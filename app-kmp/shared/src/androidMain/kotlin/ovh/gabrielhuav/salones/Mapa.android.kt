package ovh.gabrielhuav.salones

import android.graphics.BitmapFactory
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL
import kotlin.math.floor
import kotlin.math.roundToInt

/** Cuántas teselas se descargan alrededor del lugar en cada dirección (5 × 5 cubren la pantalla). */
private const val RADIO = 2

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
 * sin WebView ni JavaScript. Si el proveedor elegido no responde, prueba los siguientes.
 */
@Composable
actual fun Mapa(lugar: Ubicacion, conMarcador: Boolean, proveedor: Int, modifier: Modifier) {
    var teselas by remember(lugar, proveedor) { mutableStateOf<Map<Pair<Int, Int>, ImageBitmap>>(emptyMap()) }
    var aviso by remember(lugar, proveedor) { mutableStateOf("Cargando el mapa…") }
    val (fx, fy) = posicionEnTeselas(lugar)
    val cx = floor(fx).toInt()
    val cy = floor(fy).toInt()

    LaunchedEffect(lugar, proveedor) {
        var motivo = ""
        for (k in PROVEEDORES.indices) {
            val p = PROVEEDORES[(proveedor + k) % PROVEEDORES.size]
            aviso = "Cargando ${p.nombre}…"
            // Primero la tesela del centro: si no llega, se pasa al siguiente proveedor.
            val centro = runCatching { withContext(Dispatchers.IO) { descargar(urlTesela(p, cx, cy)) } }
            if (centro.isFailure) {
                motivo = "${p.nombre}: ${centro.exceptionOrNull()?.message ?: "sin respuesta"}"
                continue
            }
            val resto = coroutineScope {
                (-RADIO..RADIO).flatMap { dx -> (-RADIO..RADIO).map { dy -> dx to dy } }
                    .filter { it != (0 to 0) }
                    .map { (dx, dy) ->
                        async(Dispatchers.IO) {
                            runCatching { (cx + dx to cy + dy) to descargar(urlTesela(p, cx + dx, cy + dy)) }.getOrNull()
                        }
                    }
                    .awaitAll()
                    .filterNotNull()
            }
            teselas = (resto + ((cx to cy) to centro.getOrThrow())).toMap()
            aviso = p.credito
            return@LaunchedEffect
        }
        aviso = "No se pudo descargar el mapa ($motivo). Revisa que el teléfono o el emulador tenga internet."
    }

    Box(modifier.background(Color(0xFFE8E8E8))) {
        Canvas(Modifier.fillMaxSize()) {
            // La tesela mide 256 px de origen; se dibuja a 256 dp para que se lea bien.
            val lado = 256.dp.toPx()
            val centroX = size.width / 2
            val centroY = size.height / 2
            teselas.forEach { (xy, imagen) ->
                val izquierda = centroX + (xy.first - fx).toFloat() * lado
                val arriba = centroY + (xy.second - fy).toFloat() * lado
                drawImage(
                    image = imagen,
                    dstOffset = IntOffset(izquierda.roundToInt(), arriba.roundToInt()),
                    dstSize = IntSize(lado.roundToInt() + 1, lado.roundToInt() + 1),
                )
            }
            if (conMarcador) {
                drawCircle(Color.White, radius = 12.dp.toPx(), center = Offset(centroX, centroY))
                drawCircle(Color(0xFF1A73E8), radius = 9.dp.toPx(), center = Offset(centroX, centroY))
            }
        }
        Text(
            aviso,
            modifier = Modifier.align(Alignment.BottomStart).background(Color(0xCCFFFFFF)).padding(6.dp),
        )
    }
}
