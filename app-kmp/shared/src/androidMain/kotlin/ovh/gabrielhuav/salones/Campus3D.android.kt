package ovh.gabrielhuav.salones

import android.view.Choreographer
import android.view.TextureView
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import com.google.android.filament.Engine
import com.google.android.filament.IndirectLight
import com.google.android.filament.utils.Manipulator
import com.google.android.filament.utils.ModelViewer
import com.google.android.filament.utils.Utils
import java.nio.ByteBuffer

/** Un solo motor de Filament para toda la app: crearlo cuesta y se reutiliza al volver a la vista 3D. */
private val motor: Engine by lazy {
    Utils.init()
    Engine.create()
}

/**
 * El GLB que exporta el editor web (campus/UAM_Azcapotzalco.glb), dibujado con Filament.
 * Un dedo lo gira alrededor, dos dedos acercan o desplazan: lo hace ModelViewer.
 */
@Composable
actual fun Campus3D(modifier: Modifier) {
    val visor = remember { arrayOfNulls<ModelViewer>(1) }
    AndroidView(
        factory = { contexto ->
            TextureView(contexto).also { superficie ->
                val motor = motor // primero el motor: Utils.init() carga las librerías nativas que usa la cámara
                // transformToUnitCube deja el campus centrado en (0, 0, -4): la cámara lo mira desde arriba y de lado.
                val camara = Manipulator.Builder()
                    .targetPosition(0f, 0f, -4f)
                    .orbitHomePosition(0f, 2.2f, -1.4f)
                    .orbitSpeed(0.01f, 0f) // arrastrar solo gira alrededor del campus: nunca queda debajo del suelo
                    .build(Manipulator.Mode.ORBIT)
                val v = ModelViewer(superficie, motor, manipulator = camara)
                superficie.setOnTouchListener(v)
                val bytes = contexto.assets.open("campus/UAM_Azcapotzalco.glb").use { it.readBytes() }
                v.loadModelGlb(ByteBuffer.allocateDirect(bytes.size).put(bytes).rewind())
                v.transformToUnitCube()
                // Luz ambiental pareja, para que las caras a la sombra no queden negras.
                v.scene.indirectLight = IndirectLight.Builder()
                    .irradiance(1, floatArrayOf(1f, 1f, 1f))
                    .intensity(30_000f)
                    .build(motor)
                v.renderer.clearOptions = v.renderer.clearOptions.apply {
                    clear = true
                    clearColor = doubleArrayOf(0.93, 0.945, 0.93, 1.0) // el mismo fondo que el editor web
                }
                visor[0] = v
            }
        },
        modifier = modifier,
    )
    DisposableEffect(Unit) {
        val reloj = Choreographer.getInstance()
        val cuadro = object : Choreographer.FrameCallback {
            override fun doFrame(tiempo: Long) {
                reloj.postFrameCallback(this)
                visor[0]?.render(tiempo)
            }
        }
        reloj.postFrameCallback(cuadro)
        onDispose {
            reloj.removeFrameCallback(cuadro)
            visor[0]?.destroyModel()
        }
    }
}
