package ovh.gabrielhuav.salones

import android.view.Choreographer
import android.view.TextureView
import android.view.View
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import com.google.android.filament.Engine
import com.google.android.filament.IndirectLight
import com.google.android.filament.utils.Bookmark
import com.google.android.filament.utils.Manipulator
import com.google.android.filament.utils.ModelViewer
import com.google.android.filament.utils.Utils
import java.nio.ByteBuffer

/** Un solo motor de Filament para toda la app: crearlo cuesta y se reutiliza. */
private val motor: Engine by lazy {
    Utils.init()
    Engine.create()
}

/** El visor y sus dos posiciones de cámara: desde arriba (como el mapa) e inclinada. */
private class Visor(val modelo: ModelViewer, val camara: Manipulator, val arriba: Bookmark, val inclinada: Bookmark) {
    /** Hasta cuándo dibujar (System.nanoTime). Sin animaciones, basta dibujar un momento después de cada cambio. */
    @Volatile var dibujarHasta = 0L

    /** Última posición de cámara por encima del suelo: si un arrastre la baja de más, se regresa a ella. */
    private var ultimaBuena = camara.currentBookmark
    private val ojo = FloatArray(3)
    private val centro = FloatArray(3)
    private val haciaArriba = FloatArray(3)
    fun noBajarDelSuelo() {
        camara.getLookAt(ojo, centro, haciaArriba)
        // Al menos ~12° sobre el horizonte: la altura del ojo contra su distancia al centro.
        val dx = ojo[0] - centro[0]
        val dz = ojo[2] - centro[2]
        if (ojo[1] - centro[1] < 0.2f * kotlin.math.sqrt(dx * dx + dz * dz)) camara.jumpToBookmark(ultimaBuena)
        else ultimaBuena = camara.currentBookmark
    }
    fun avisarCambio() { dibujarHasta = System.nanoTime() + 1_500_000_000L }
}

/**
 * El GLB que exporta el editor web (campus/UAM_Azcapotzalco.glb), dibujado con Filament.
 * Un dedo lo gira (a los lados) y lo inclina (arriba y abajo); dos dedos acercan o desplazan: lo hace ModelViewer.
 *
 * El modelo se carga una sola vez y no se libera al salir de 3D: liberarlo y volverlo a cargar
 * hacía fallar a Filament (asyncCancelLoad). Oculto, no se dibuja; visible, solo un momento después de tocarlo.
 */
@Composable
actual fun Campus3D(visible: Boolean, inclinada: Boolean, modifier: Modifier) {
    val visor = remember { arrayOfNulls<Visor>(1) }
    AndroidView(
        factory = { contexto ->
            TextureView(contexto).also { superficie ->
                val motor = motor // primero el motor: Utils.init() carga las librerías nativas que usa la cámara
                val geo = leerGeorreferencia(contexto.assets.open("campus/georreferencia.json").use { it.readBytes().decodeToString() })
                val (nx, nz) = norteEnModelo(geo).let { it.first.toFloat() to it.second.toFloat() }
                // transformToUnitCube deja el campus centrado en (0, 0, -4) y de 2 unidades de ancho.
                // Desde arriba: casi vertical (unos 80°) y un poco al sur, para que el norte quede hacia arriba como en el mapa.
                fun camara(altura: Float, alSur: Float) = Manipulator.Builder()
                    .targetPosition(0f, 0f, -4f)
                    .orbitHomePosition(-nx * alSur, altura, -4f - nz * alSur)
                    .orbitSpeed(0.01f, 0.006f) // a los lados gira; arriba y abajo inclina (con tope: noBajarDelSuelo)
                    .build(Manipulator.Mode.ORBIT)
                val desdeArriba = camara(altura = 2.8f, alSur = 0.5f)
                val deLado = camara(altura = 1.3f, alSur = 1.6f)
                val modelo = ModelViewer(superficie, motor, manipulator = desdeArriba)
                val bytes = contexto.assets.open("campus/UAM_Azcapotzalco.glb").use { it.readBytes() }
                modelo.loadModelGlb(ByteBuffer.allocateDirect(bytes.size).put(bytes).rewind())
                modelo.transformToUnitCube()
                // Luz ambiental pareja, para que las caras a la sombra no queden negras.
                modelo.scene.indirectLight = IndirectLight.Builder()
                    .irradiance(1, floatArrayOf(1f, 1f, 1f))
                    .intensity(30_000f)
                    .build(motor)
                modelo.renderer.clearOptions = modelo.renderer.clearOptions.apply {
                    clear = true
                    clearColor = doubleArrayOf(0.93, 0.945, 0.93, 1.0) // el mismo fondo que el editor web
                }
                // currentBookmark guarda el ángulo; homeBookmark de Filament lo pierde (queda al ras del suelo).
                val v = Visor(modelo, desdeArriba, desdeArriba.currentBookmark, deLado.currentBookmark)
                superficie.setOnTouchListener { vista, evento -> v.avisarCambio(); modelo.onTouch(vista, evento) }
                v.avisarCambio()
                visor[0] = v
            }
        },
        update = { it.visibility = if (visible) View.VISIBLE else View.INVISIBLE },
        modifier = modifier,
    )
    LaunchedEffect(inclinada) {
        visor[0]?.let {
            it.camara.jumpToBookmark(if (inclinada) it.inclinada else it.arriba)
            it.avisarCambio()
        }
    }
    // Solo se dibuja mientras se ve.
    DisposableEffect(visible) {
        val reloj = Choreographer.getInstance()
        val cuadro = object : Choreographer.FrameCallback {
            override fun doFrame(tiempo: Long) {
                reloj.postFrameCallback(this)
                val v = visor[0] ?: return
                if (System.nanoTime() < v.dibujarHasta) {
                    v.noBajarDelSuelo()
                    v.modelo.render(tiempo)
                }
            }
        }
        if (visible) {
            visor[0]?.avisarCambio()
            reloj.postFrameCallback(cuadro)
        }
        onDispose { reloj.removeFrameCallback(cuadro) }
    }
}
