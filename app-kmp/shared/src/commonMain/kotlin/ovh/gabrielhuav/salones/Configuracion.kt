package ovh.gabrielhuav.salones

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

/**
 * «⚙ Ajustes»: activar el modo desarrollador y, ya dentro de él, quitar la marca de agua
 * «copyright @gabrielhuav» por completo: del plano 2D, de la maqueta 3D y de la esquina de la app.
 * Fuera del modo desarrollador la marca siempre se ve. Las dos opciones se recuerdan al cerrar la app.
 */
@Composable
fun Configuracion(
    desarrollador: Boolean,
    marca: Boolean,
    onDesarrollador: (Boolean) -> Unit,
    onMarca: (Boolean) -> Unit,
    onCerrar: () -> Unit,
) {
    AlertDialog(
        onDismissRequest = onCerrar,
        title = { Text("Ajustes") },
        text = {
            Column {
                Opcion("Modo desarrollador", "Opciones para quien desarrolla la app.", desarrollador, onDesarrollador)
                if (desarrollador) {
                    Spacer(Modifier.height(12.dp))
                    Opcion("Marca de agua", "«copyright @gabrielhuav» en el plano, el 3D y la app.", marca, onMarca)
                }
            }
        },
        confirmButton = { TextButton(onClick = onCerrar) { Text("Listo") } },
    )
}

@Composable
private fun Opcion(titulo: String, detalle: String, activa: Boolean, onCambio: (Boolean) -> Unit) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f).padding(end = 12.dp)) {
            Text(titulo, style = MaterialTheme.typography.titleMedium)
            Text(detalle, style = MaterialTheme.typography.bodySmall)
        }
        Switch(activa, onCheckedChange = onCambio)
    }
}
