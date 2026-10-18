package ovh.gabrielhuav.salones

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

/** En iOS el mapa todavía no se dibuja en este prototipo: solo se verifica Android. */
@Composable
actual fun Mapa(centro: Ubicacion, marcador: Ubicacion?, proveedor: Int, centrar: Int, conTeselas: Boolean, noche: Boolean, modifier: Modifier) {
    Box(modifier) {
        Text("En iOS, el mapa llega en el siguiente prototipo.", Modifier.padding(16.dp))
    }
}
