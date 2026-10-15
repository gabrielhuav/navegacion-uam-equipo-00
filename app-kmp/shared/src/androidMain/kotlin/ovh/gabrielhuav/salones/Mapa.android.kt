package ovh.gabrielhuav.salones

import android.annotation.SuppressLint
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView

/** En Android, el mapa de OpenStreetMap se abre en un WebView, como en Kotlin-Maps-Example. */
@SuppressLint("SetJavaScriptEnabled")
@Composable
actual fun Mapa(lugar: Ubicacion, modifier: Modifier) {
    val url = urlMapa(lugar)
    AndroidView(
        factory = { contexto ->
            WebView(contexto).apply {
                settings.javaScriptEnabled = true // el mapa de OpenStreetMap usa JavaScript
                webViewClient = WebViewClient() // los enlaces se abren dentro de la app
            }
        },
        update = { web ->
            if (web.tag != url) { // solo recarga cuando cambia el lugar
                web.tag = url
                web.loadUrl(url)
            }
        },
        modifier = modifier,
    )
}
