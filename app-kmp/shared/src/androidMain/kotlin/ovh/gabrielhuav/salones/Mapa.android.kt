package ovh.gabrielhuav.salones

import android.graphics.BitmapFactory
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL
import kotlin.math.floor
import kotlin.math.roundToInt

/** Descarga una tesela; si falla, lanza la excepción con el motivo. */
private fun descargar(url: String): ImageBitmap {
    val conexion = URL(url).openConnection() as HttpURLConnection
    conexion.connectTimeout = 8_000
    conexion.readTimeout = 8_000
    // Los servidores de mapas piden identificar la app.
    conexion.setRequestProperty("User-Agent", "SalonesUAM/0.1 (ovh.gabrielhuav.salones)")
    try {
        if (conexion.responseCode != 200) error("HTTP ${conexion.responseCode}")
        return BitmapFactory.decodeStream(conexion.inputStream)?.asImageBitmap()
            ?: error("la imagen no se pudo leer")
    } finally {
        conexion.disconnect()
    }
}

/**
 * En Android, el mapa se arma con las teselas del proveedor y se dibuja en un Canvas de Compose,
 * sin WebView ni JavaScript. Se arrastra con el dedo, en vertical o en horizontal.
 * Si el proveedor elegido no responde, prueba los siguientes y dice por qué.
 */
@Composable
actual fun Mapa(lugar: Ubicacion, conMarcador: Boolean, proveedor: Int, modifier: Modifier) {
    val (fx, fy) = posicionEnTeselas(lugar)
    val lado = with(LocalDensity.current) { 256.dp.toPx() } // la tesela de 256 px se dibuja a 256 dp
    var tamano by remember { mutableStateOf(IntSize.Zero) }
    var desplazamiento by remember(lugar) { mutableStateOf(Offset.Zero) }
    val teselas = remember(lugar, proveedor) { mutableStateMapOf<Pair<Int, Int>, ImageBitmap>() }
    var activo by remember(lugar, proveedor) { mutableStateOf<Proveedor?>(null) }
    var aviso by remember(lugar, proveedor) { mutableStateOf("Cargando el mapa…") }

    // 1. Elegir el proveedor: el primero, empezando por el elegido, cuya tesela central sí llega.
    LaunchedEffect(lugar, proveedor) {
        var motivo = ""
        for (k in PROVEEDORES.indices) {
            val p = PROVEEDORES[(proveedor + k) % PROVEEDORES.size]
            aviso = "Cargando ${p.nombre}…"
            val x = floor(fx).toInt()
            val y = floor(fy).toInt()
            val centro = runCatching { withContext(Dispatchers.IO) { descargar(urlTesela(p, x, y)) } }
            if (centro.isSuccess) {
                teselas[x to y] = centro.getOrThrow()
                activo = p
                aviso = p.credito
                return@LaunchedEffect
            }
            motivo = "${p.nombre}: ${centro.exceptionOrNull()?.message ?: "sin respuesta"}"
        }
        aviso = "No se pudo descargar el mapa ($motivo). Revisa que el teléfono o el emulador tenga internet."
    }

    // 2. Las teselas que se ven en pantalla (cambian al arrastrar o al girar el teléfono).
    val mitadX = tamano.width / 2f
    val mitadY = tamano.height / 2f
    val visibles = if (tamano == IntSize.Zero) emptyList() else {
        val x0 = floor(fx + (-mitadX - desplazamiento.x) / lado).toInt()
        val x1 = floor(fx + (mitadX - desplazamiento.x) / lado).toInt()
        val y0 = floor(fy + (-mitadY - desplazamiento.y) / lado).toInt()
        val y1 = floor(fy + (mitadY - desplazamiento.y) / lado).toInt()
        (x0..x1).flatMap { x -> (y0..y1).map { y -> x to y } }
    }
    LaunchedEffect(activo, visibles) {
        val p = activo ?: return@LaunchedEffect
        visibles.filter { it !in teselas }.forEach { xy ->
            launch(Dispatchers.IO) {
                runCatching { descargar(urlTesela(p, xy.first, xy.second)) }
                    .onSuccess { teselas[xy] = it }
            }
        }
    }

    Box(
        modifier
            .background(Color(0xFFE8E8E8))
            .onSizeChanged { tamano = it }
            .pointerInput(lugar) {
                detectDragGestures { cambio, arrastre ->
                    cambio.consume()
                    desplazamiento += arrastre
                }
            },
    ) {
        Canvas(Modifier.fillMaxSize()) {
            teselas.forEach { (xy, imagen) ->
                val izquierda = mitadX + (xy.first - fx).toFloat() * lado + desplazamiento.x
                val arriba = mitadY + (xy.second - fy).toFloat() * lado + desplazamiento.y
                drawImage(
                    image = imagen,
                    dstOffset = IntOffset(izquierda.roundToInt(), arriba.roundToInt()),
                    dstSize = IntSize(lado.roundToInt() + 1, lado.roundToInt() + 1),
                )
            }
            if (conMarcador) {
                val punto = Offset(mitadX + desplazamiento.x, mitadY + desplazamiento.y)
                drawCircle(Color.White, radius = 12.dp.toPx(), center = punto)
                drawCircle(Color(0xFF1A73E8), radius = 9.dp.toPx(), center = punto)
            }
        }
        Text(
            aviso,
            modifier = Modifier.align(Alignment.BottomStart).background(Color(0xCCFFFFFF)).padding(6.dp),
        )
    }
}
