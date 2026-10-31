package ovh.gabrielhuav.salones

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.hardware.GeomagneticField
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Bundle
import android.os.SystemClock
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import org.json.JSONObject
import org.tensorflow.lite.Interpreter
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.concurrent.Executors
import kotlin.math.abs
import kotlin.math.roundToInt

/**
 * Prototipo 4 · experimento, sólo en la ESCOM: la cámara trasera, el modelo TFLite y la votación de cuadros.
 * Todo ocurre en el teléfono: no se guardan ni se envían imágenes. Devuelve a [MainActivity] el edificio
 * reconocido (clase, destino, puntaje) cuando el usuario pulsa «Ir a este edificio».
 *
 * Si reconoce el Edificio de Laboratorios (el de las letras ESCOM), dibuja sobre la cámara al burro blanco del IPN.
 * Con la brújula y el GPS lo coloca hacia donde está el edificio y dice desde qué lado se le ve, y cuántas
 * fotos de referencia hay de ese lado (las que guardaron GPS en el entrenamiento).
 */
class ReconocerActivity : ComponentActivity(), SensorEventListener {

    private var texto by mutableStateOf("Cargando el modelo…")
    private var estable by mutableStateOf<Reconocido?>(null)
    private var rumboCamara by mutableStateOf<Double?>(null) // hacia dónde apunta la cámara (0 = norte)
    private var yo by mutableStateOf<Ubicacion?>(null)
    private var burrito by mutableStateOf<Bitmap?>(null)
    private val hilo = Executors.newSingleThreadExecutor()
    private var interprete: Interpreter? = null
    private lateinit var galeria: Galeria
    private lateinit var votacion: Votacion
    private var ultimo = 0L
    private var laboratorios: Ubicacion? = null
    private var ladosReferencia: List<String?> = emptyList()
    private lateinit var sensores: SensorManager
    private lateinit var vista: PreviewView

    /** Sólo en la app de depuración: `adb shell am start … --ez demo true` simula reconocer laboratorios (para el emulador). */
    private val demo by lazy {
        (applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0 && intent.getBooleanExtra("demo", false)
    }

    private val pedirCamara = registerForActivityResult(ActivityResultContracts.RequestPermission()) { si ->
        if (si) iniciarCamara() else texto = "Sin permiso de cámara: elige el destino en «Ruta»."
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        sensores = getSystemService(SENSOR_SERVICE) as SensorManager
        vista = PreviewView(this)
        setContent {
            MaterialTheme(colorScheme = esquemaDeColor(Unidad.ESCOM, true)) {
                Box(Modifier.fillMaxSize()) {
                    AndroidView({ vista }, Modifier.fillMaxSize())
                    if (estable?.clase == "laboratorios") burrito?.let { Mascota(it) }
                    Card(Modifier.align(Alignment.BottomCenter).safeDrawingPadding().padding(16.dp).fillMaxWidth()) {
                        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("Reconocer edificio · experimento", style = MaterialTheme.typography.titleMedium)
                            Text(texto, style = MaterialTheme.typography.bodyMedium)
                            angulo()?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary) }
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                OutlinedButton(onClick = { finish() }) { Text("Cancelar") }
                                Button(enabled = estable != null, onClick = { devolver() }) { Text("Ir a este edificio") }
                            }
                        }
                    }
                }
            }
        }
        hilo.execute {
            runCatching { cargarModelo() }
                .onSuccess { runOnUiThread { texto = "Apunta a la fachada de un edificio de la ESCOM."; pedirOIniciar() } }
                .onFailure { runOnUiThread { texto = "No se pudo cargar el modelo: ${it.message}" } }
        }
        ubicar()
    }

    /**
     * El burro blanco sobre la cámara, flotando. Con brújula y GPS se mueve a lo ancho hacia donde está el edificio
     * (campo de visión horizontal de unos 60°); si queda fuera de cuadro, se queda en la orilla con una flecha.
     */
    @Composable
    private fun Mascota(imagen: Bitmap) {
        val vaiven by rememberInfiniteTransition(label = "burrito").animateFloat(
            -8f, 8f, infiniteRepeatable(tween(900), RepeatMode.Reverse), label = "vaiven",
        )
        val desvio = desvioHaciaLaboratorios()
        BoxWithConstraints(Modifier.fillMaxSize()) {
            val mitad = maxWidth / 2
            val x = desvio?.let { (it / 30.0).coerceIn(-1.0, 1.0).toFloat() } ?: 0f
            // Nunca sale de la pantalla: a lo más, su orilla toca la de la pantalla.
            Column(
                Modifier.align(Alignment.Center).offset(x = (mitad - 110.dp) * x, y = (-60 + vaiven).dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Image(imagen.asImageBitmap(), "Burro blanco del IPN", Modifier.width(160.dp))
                when {
                    desvio == null -> {}
                    desvio > 30 -> Text("Gira a la derecha →", color = MaterialTheme.colorScheme.onSurface)
                    desvio < -30 -> Text("← Gira a la izquierda", color = MaterialTheme.colorScheme.onSurface)
                }
            }
        }
    }

    /** Grados entre hacia dónde apunta la cámara y hacia dónde está el edificio (positivo: a la derecha). */
    private fun desvioHaciaLaboratorios(): Double? {
        val r = rumboCamara ?: return null
        val u = yo ?: return null
        val lab = laboratorios ?: return null
        if (distanciaMetros(u, lab) < 8) return null // muy cerca: el rumbo no sirve
        return diferenciaAngulo(rumbo(u, lab), r)
    }

    /** «Lo ves desde el lado noreste (40°), a 55 m · fotos de referencia de ese lado: 4 de 24». */
    private fun angulo(): String? {
        if (estable?.clase != "laboratorios") return null
        val u = yo ?: return "Activa la ubicación para saber desde qué lado lo ves."
        val lab = laboratorios ?: return null
        val desde = rumbo(lab, u)
        val lado = ladoDe(desde)
        val conLado = ladosReferencia.filterNotNull().size / 3
        val deEseLado = ladosReferencia.count { it == lado } / 3
        val total = ladosReferencia.size / 3
        return "Lo ves desde el lado $lado (${desde.roundToInt()}°), a ${distanciaMetros(u, lab).roundToInt()} m. " +
            "Fotos de referencia de ese lado: $deEseLado de $total ($conLado con GPS)."
    }

    private fun pedirOIniciar() {
        if (demo) simularLaboratorios()
        if (checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) iniciarCamara()
        else pedirCamara.launch(Manifest.permission.CAMERA)
    }

    private fun simularLaboratorios() {
        val g = galeria
        estable = Reconocido("laboratorios", g.destinos["laboratorios"] ?: "LAB", g.umbral("laboratorios"), System.currentTimeMillis())
        texto = "DEMO de depuración: se simula que reconoce Laboratorios."
    }

    /** El modelo, su galería, el umbral propio de laboratorios y los lados de sus fotos (assets/reconocimiento/). */
    private fun cargarModelo() {
        val bytes = assets.open("reconocimiento/escom_embeddings.tflite").use { it.readBytes() }
        val modelo = ByteBuffer.allocateDirect(bytes.size).order(ByteOrder.nativeOrder()).put(bytes).also { it.rewind() }
        interprete = Interpreter(modelo, Interpreter.Options().setNumThreads(4))
        val json = JSONObject(assets.open("reconocimiento/escom_galeria.json").use { it.readBytes().decodeToString() })
        val clases = json.getJSONArray("clases").let { a -> List(a.length()) { a.getString(it) } }
        val p = json.getJSONObject("prototipos")
        val prototipos = clases.associateWith { c ->
            val lista = p.getJSONArray(c)
            List(lista.length()) { i -> lista.getJSONArray(i).let { v -> FloatArray(v.length()) { v.getDouble(it).toFloat() } } }
        }
        val d = json.getJSONObject("destinos_escom")
        val angulos = JSONObject(assets.open("reconocimiento/escom_angulos.json").use { it.readBytes().decodeToString() })
        val umbrales = if (angulos.isNull("umbral_laboratorios")) emptyMap()
                       else mapOf("laboratorios" to angulos.getDouble("umbral_laboratorios").toFloat())
        laboratorios = angulos.getJSONArray("laboratorios_lat_lon").let { Ubicacion(it.getDouble(0), it.getDouble(1)) }
        ladosReferencia = angulos.getJSONArray("lados_laboratorios").let { a -> List(a.length()) { if (a.isNull(it)) null else a.getString(it) } }
        galeria = Galeria(clases, prototipos, clases.associateWith { d.getString(it) }, json.getDouble("umbral_no_se").toFloat(), umbrales)
        votacion = Votacion(galeria)
        burrito = assets.open("reconocimiento/burrito.png").use { BitmapFactory.decodeStream(it) }
    }

    /** Una lectura de GPS al abrir (si ya hay permiso de ubicación); basta para saber de qué lado del edificio estás. */
    @SuppressLint("MissingPermission")
    private fun ubicar() {
        if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
            checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) return
        val cliente = LocationServices.getFusedLocationProviderClient(this)
        cliente.lastLocation.addOnSuccessListener { it?.let { l -> yo = Ubicacion(l.latitude, l.longitude) } }
        cliente.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, null)
            .addOnSuccessListener { it?.let { l -> yo = Ubicacion(l.latitude, l.longitude) } }
    }

    override fun onResume() {
        super.onResume()
        sensores.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR)?.let { sensores.registerListener(this, it, SensorManager.SENSOR_DELAY_UI) }
    }

    override fun onPause() {
        super.onPause()
        sensores.unregisterListener(this)
    }

    private val rotacion = FloatArray(9)
    private val remapeada = FloatArray(9)
    private val orientacion = FloatArray(3)

    /** Brújula: hacia dónde mira la parte trasera del teléfono (la cámara), corregida al norte verdadero. */
    override fun onSensorChanged(e: SensorEvent) {
        SensorManager.getRotationMatrixFromVector(rotacion, e.values)
        SensorManager.remapCoordinateSystem(rotacion, SensorManager.AXIS_X, SensorManager.AXIS_Z, remapeada)
        SensorManager.getOrientation(remapeada, orientacion)
        val declinacion = yo?.let { GeomagneticField(it.latitud.toFloat(), it.longitud.toFloat(), 2240f, System.currentTimeMillis()).declination } ?: 0f
        val nuevo = (Math.toDegrees(orientacion[0].toDouble()) + declinacion + 360) % 360
        // Suavizado: la brújula tiembla; se avanza un 20 % hacia la lectura nueva.
        val anterior = rumboCamara
        val suave = if (anterior == null) nuevo else (anterior + 0.2 * diferenciaAngulo(nuevo, anterior) + 360) % 360
        if (anterior == null || abs(diferenciaAngulo(suave, anterior)) > 0.5) rumboCamara = suave
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    private fun iniciarCamara() {
        val futuro = ProcessCameraProvider.getInstance(this)
        futuro.addListener({
            val proveedor = futuro.get()
            val vistaPrevia = Preview.Builder().build().also { it.setSurfaceProvider(vista.surfaceProvider) }
            val analisis = ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_RGBA_8888)
                .build()
            analisis.setAnalyzer(hilo, ::analizar)
            proveedor.unbindAll()
            proveedor.bindToLifecycle(this, CameraSelector.DEFAULT_BACK_CAMERA, vistaPrevia, analisis)
        }, mainExecutor)
    }

    /** Unas tres veces por segundo: recorte central de 224×224, vector del modelo y votación. */
    private fun analizar(imagen: ImageProxy) {
        imagen.use {
            val ahora = SystemClock.elapsedRealtime()
            val modelo = interprete ?: return
            if (demo || ahora - ultimo < 300) return // en la demo manda el resultado simulado
            ultimo = ahora
            val cuadro = recorteCentral(it.toBitmap(), it.imageInfo.rotationDegrees)
            val salida = Array(1) { FloatArray(960) }
            modelo.run(entrada(cuadro), salida)
            votacion.agregar(galeria.puntajes(salida[0]))
            val r = votacion.resultado(System.currentTimeMillis())
            val mejor = votacion.mejor()
            runOnUiThread {
                estable = r
                texto = when {
                    r != null -> "Posible edificio: ${nombre(r.clase)} (similitud ${"%.2f".format(r.puntaje)})"
                    mejor == null -> "Analizando…"
                    else -> "No identifico el edificio; prueba otro ángulo. Se parece más a ${nombre(mejor.first)}: " +
                        "similitud ${"%.2f".format(mejor.second)}, necesita ${"%.2f".format(galeria.umbral(mejor.first))}. " +
                        "La similitud no es un porcentaje de certeza."
                }
            }
        }
    }

    /** Gira según el sensor, recorta el cuadrado central y lo reduce a 224×224 (bilineal), como en el entrenamiento. */
    private fun recorteCentral(b: Bitmap, grados: Int): Bitmap {
        val lado = minOf(b.width, b.height)
        val m = Matrix().apply { postRotate(grados.toFloat()); postScale(224f / lado, 224f / lado) }
        return Bitmap.createBitmap(b, (b.width - lado) / 2, (b.height - lado) / 2, lado, lado, m, true)
            .let { if (it.width == 224 && it.height == 224) it else Bitmap.createScaledBitmap(it, 224, 224, true) }
    }

    /** RGB float32 de 0 a 255: la normalización de MobileNet ya va dentro del modelo. */
    private fun entrada(b: Bitmap): ByteBuffer {
        val pix = IntArray(224 * 224).also { b.getPixels(it, 0, 224, 0, 0, 224, 224) }
        val buf = ByteBuffer.allocateDirect(224 * 224 * 3 * 4).order(ByteOrder.nativeOrder())
        for (p in pix) {
            buf.putFloat(((p shr 16) and 0xFF).toFloat())
            buf.putFloat(((p shr 8) and 0xFF).toFloat())
            buf.putFloat((p and 0xFF).toFloat())
        }
        return buf.also { it.rewind() }
    }

    private fun nombre(clase: String) = NOMBRES[clase] ?: clase

    private fun devolver() {
        val r = estable ?: return
        setResult(RESULT_OK, Intent().putExtra("clase", r.clase).putExtra("destino", r.destino).putExtra("puntaje", r.puntaje))
        finish()
    }

    override fun onDestroy() {
        super.onDestroy()
        hilo.execute { interprete?.close(); interprete = null }
        hilo.shutdown()
    }

    companion object {
        private val NOMBRES = mapOf(
            "edificio_1" to "Edificio 1", "edificio_2" to "Edificio 2", "edificio_3" to "Edificio 3",
            "edificio_4" to "Edificio 4", "gobierno" to "Gobierno · Biblioteca", "laboratorios" to "Laboratorios",
        )
    }
}
