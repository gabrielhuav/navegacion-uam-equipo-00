package ovh.gabrielhuav.salones

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.UIKitView
import kotlinx.cinterop.ExperimentalForeignApi
import platform.Foundation.NSURL
import platform.Foundation.NSURLRequest
import platform.WebKit.WKWebView

/** En iOS, el mismo mapa de OpenStreetMap en un WKWebView. No se verificó en iPhone en este prototipo. */
@OptIn(ExperimentalForeignApi::class)
@Composable
actual fun Mapa(lugar: Ubicacion, modifier: Modifier) {
    val url = urlMapa(lugar)
    UIKitView(
        factory = { WKWebView() },
        modifier = modifier,
        update = { web ->
            NSURL.URLWithString(url)?.let { web.loadRequest(NSURLRequest.requestWithURL(it)) }
        },
    )
}
