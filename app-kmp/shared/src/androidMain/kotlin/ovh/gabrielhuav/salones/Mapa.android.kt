package ovh.gabrielhuav.salones

import android.annotation.SuppressLint
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView

/** En Android, la página del mapa (Leaflet) se abre en un WebView, como en Kotlin-Maps-Example. */
@SuppressLint("SetJavaScriptEnabled")
@Composable
actual fun Mapa(lugar: Ubicacion, conMarcador: Boolean, modifier: Modifier) {
    val pagina = paginaMapa(lugar, conMarcador)
    AndroidView(
        factory = { contexto ->
            WebView(contexto).apply {
                settings.javaScriptEnabled = true // Leaflet es JavaScript
                settings.domStorageEnabled = true
                webViewClient = WebViewClient()
            }
        },
        update = { web ->
            if (web.tag != pagina) { // solo recarga cuando cambia el lugar
                web.tag = pagina
                // Con una dirección https de base, los servidores de mapas reciben un Referer válido.
                web.loadDataWithBaseURL("https://salones.uam.mx/", pagina, "text/html", "UTF-8", null)
            }
        },
        modifier = modifier,
    )
}
