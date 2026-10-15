package ovh.gabrielhuav.salones

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.UIKitView
import kotlinx.cinterop.ExperimentalForeignApi
import platform.Foundation.NSURL
import platform.WebKit.WKWebView

/** En iOS, la misma página del mapa en un WKWebView. No se verificó en iPhone en este prototipo. */
@OptIn(ExperimentalForeignApi::class)
@Composable
actual fun Mapa(lugar: Ubicacion, conMarcador: Boolean, modifier: Modifier) {
    val pagina = paginaMapa(lugar, conMarcador)
    UIKitView(
        factory = { WKWebView() },
        modifier = modifier,
        update = { web -> web.loadHTMLString(pagina, baseURL = NSURL.URLWithString("https://salones.uam.mx/")) },
    )
}
