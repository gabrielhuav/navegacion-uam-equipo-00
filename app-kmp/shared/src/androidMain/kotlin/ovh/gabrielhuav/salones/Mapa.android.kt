package ovh.gabrielhuav.salones

import android.graphics.BitmapFactory
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTransformGestures
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
import androidx.compose.runtime.rememberCoroutineScope
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
import java.net.HttpURLConnection
import java.net.URL
import kotlin.math.floor
import kotlin.math.log2
import kotlin.math.pow
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
 * sin WebView ni JavaScript. Se arrastra con un dedo y se acerca o aleja con dos, como en Flutter.
 * Pasado el zoom máximo del proveedor, se agrandan las teselas de su último nivel.
 *
 * Imagen aérea del campus (siguiente paso): en el Canvas, en lugar de `teselas.forEach`, se dibuja
 * una sola imagen; sus esquinas (latitud y longitud) se pasan a pantalla con `posicionEnTeselas`
 * y `enPantalla`, igual que cada tesela. El marcador, el arrastre y el zoom no cambian.
 */
@Composable
actual fun Mapa(lugar: Ubicacion, conMarcador: Boolean, proveedor: Int, centrar: Int, modifier: Modifier) {
    val p = PROVEEDORES[proveedor]
    var tamano by remember { mutableStateOf(IntSize.Zero) }
    var zoom by remember(centrar) { mutableStateOf(ZOOM.toFloat()) }
    var desplazamiento by remember(lugar, centrar) { mutableStateOf(Offset.Zero) } // del lugar respecto al centro
    val teselas = remember(proveedor) { mutableStateMapOf<Triple<Int, Int, Int>, ImageBitmap>() }
    val pedidas = remember(proveedor) { mutableSetOf<Triple<Int, Int, Int>>() }
    var falla by remember(proveedor) { mutableStateOf(false) }
    val alcance = rememberCoroutineScope()

    // Nivel de teselas que se descarga y a qué tamaño se dibuja cada una con el zoom actual.
    val nivel = zoom.roundToInt().coerceAtMost(p.zoomMaximo)
    val lado = with(LocalDensity.current) { 256.dp.toPx() } * 2f.pow(zoom - nivel)
    val (fx, fy) = posicionEnTeselas(lugar, nivel)
    val centro = Offset(tamano.width / 2f, tamano.height / 2f) + desplazamiento
    fun enPantalla(x: Double, y: Double) = centro + Offset(((x - fx) * lado).toFloat(), ((y - fy) * lado).toFloat())

    // Las teselas que se ven; cada una se descarga una sola vez.
    val n = 1 shl nivel
    val visibles = if (tamano == IntSize.Zero) emptyList() else {
        val xs = floor(fx - centro.x / lado).toInt()..floor(fx + (tamano.width - centro.x) / lado).toInt()
        val ys = floor(fy - centro.y / lado).toInt()..floor(fy + (tamano.height - centro.y) / lado).toInt()
        xs.flatMap { x -> ys.map { y -> Triple(nivel, x, y) } }.filter { it.second in 0 until n && it.third in 0 until n }
    }
    LaunchedEffect(proveedor, visibles) {
        visibles.filter { pedidas.add(it) }.forEach { t ->
            alcance.launch(Dispatchers.IO) {
                runCatching { descargar(urlTesela(p, t.second, t.third, t.first)) }
                    .onSuccess { teselas[t] = it }
                    .onFailure { falla = true }
            }
        }
    }

    Box(
        modifier
            .background(Color(0xFFE8E8E8))
            .onSizeChanged { tamano = it }
            .pointerInput(lugar, centrar) {
                detectTransformGestures { _, arrastre, escala, _ ->
                    val nuevo = (zoom + log2(escala)).coerceIn(3f, 19f)
                    desplazamiento = desplazamiento * 2f.pow(nuevo - zoom) + arrastre // acerca hacia el centro de la pantalla
                    zoom = nuevo
                }
            },
    ) {
        Canvas(Modifier.fillMaxSize()) {
            teselas.forEach { (t, imagen) ->
                if (t.first != nivel) return@forEach
                val esquina = enPantalla(t.second.toDouble(), t.third.toDouble())
                drawImage(
                    image = imagen,
                    dstOffset = IntOffset(esquina.x.roundToInt(), esquina.y.roundToInt()),
                    dstSize = IntSize(lado.roundToInt() + 1, lado.roundToInt() + 1),
                )
            }
            if (conMarcador) {
                drawCircle(Color.White, radius = 12.dp.toPx(), center = centro)
                drawCircle(Color(0xFF1A73E8), radius = 9.dp.toPx(), center = centro)
            }
        }
        Text(
            if (falla) "${p.nombre} no carga: elige otro mapa." else p.credito,
            modifier = Modifier.align(Alignment.BottomStart).background(Color(0xCCFFFFFF)).padding(6.dp),
        )
    }
}
