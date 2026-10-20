package ovh.gabrielhuav.salones

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

/**
 * Elegir de dónde a dónde. Origen: tu ubicación (`null`) o un lugar de la red; destino: un lugar de la red.
 * Al pulsar «Trazar», [onTrazar] recibe los dos y la app calcula la ruta más corta.
 */
@Composable
fun ElegirRuta(red: Red, conUbicacion: Boolean, onCerrar: () -> Unit, onTrazar: (desde: Destino?, hasta: Destino) -> Unit) {
    var desde by remember { mutableStateOf<Destino?>(null) }
    var hasta by remember { mutableStateOf<Destino?>(null) }
    val lugares = red.destinos.sortedBy { it.nombre }
    AlertDialog(
        onDismissRequest = onCerrar,
        title = { Text("Ruta en la UAM Azcapotzalco") },
        text = {
            Column {
                Text("Desde", style = MaterialTheme.typography.labelLarge)
                Selector(desde?.nombre ?: if (conUbicacion) "Mi ubicación" else "Elige un lugar", lugares,
                         primera = if (conUbicacion) "Mi ubicación" else null) { desde = it }
                Spacer(Modifier.height(12.dp))
                Text("Hasta", style = MaterialTheme.typography.labelLarge)
                Selector(hasta?.nombre ?: "Elige tu destino", lugares) { hasta = it }
            }
        },
        confirmButton = {
            TextButton(
                enabled = hasta != null && (desde != null || conUbicacion) && desde != hasta,
                onClick = { onTrazar(desde, hasta!!) },
            ) { Text("Trazar") }
        },
        dismissButton = { TextButton(onClick = onCerrar) { Text("Cancelar") } },
    )
}

/** Un botón con lo elegido; al tocarlo, la lista de lugares (y, si se pasa, una primera opción que vale null). */
@Composable
private fun Selector(texto: String, lugares: List<Destino>, primera: String? = null, onElegir: (Destino?) -> Unit) {
    var abierto by remember { mutableStateOf(false) }
    Box {
        OutlinedButton(onClick = { abierto = true }, modifier = Modifier.fillMaxWidth()) { Text(texto + "  ▾") }
        DropdownMenu(abierto, onDismissRequest = { abierto = false }) {
            primera?.let { DropdownMenuItem(text = { Text(it) }, onClick = { onElegir(null); abierto = false }) }
            lugares.forEach { l -> DropdownMenuItem(text = { Text(l.nombre) }, onClick = { onElegir(l); abierto = false }) }
        }
    }
}
