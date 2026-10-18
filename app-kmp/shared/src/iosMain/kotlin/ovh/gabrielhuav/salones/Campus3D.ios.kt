package ovh.gabrielhuav.salones

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

/** En iOS el modelo 3D todavía no se dibuja en este prototipo: solo se verifica Android. */
@Composable
actual fun Campus3D(sede: Unidad, visible: Boolean, inclinada: Boolean, noche: Boolean, modifier: Modifier) {
    if (visible) Box(modifier) {
        Text("En iOS, el modelo 3D llega en un siguiente prototipo.", Modifier.padding(16.dp))
    }
}
