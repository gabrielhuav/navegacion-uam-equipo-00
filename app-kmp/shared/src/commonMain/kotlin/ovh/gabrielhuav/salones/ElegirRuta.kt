package ovh.gabrielhuav.salones

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
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
fun ElegirRuta(
    red: Red, lugar: String, conUbicacion: Boolean, onCerrar: () -> Unit,
    hastaInicial: Destino? = null, aviso: String? = null, // P4: el destino que sugiere la cámara
    onTrazar: (desde: Destino?, hasta: Destino) -> Unit,
) {
    var desde by remember { mutableStateOf<Destino?>(null) }
    var hasta by remember { mutableStateOf(hastaInicial) }
    val lugares = red.destinos.sortedBy { it.nombre }
    val exteriores = lugares.filter { it.edificio == null }
    AlertDialog(
        onDismissRequest = onCerrar,
        title = { Text("Ruta en $lugar") },
        text = {
            Column {
                aviso?.let {
                    Text(it, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.height(12.dp))
                }
                Text("Desde", style = MaterialTheme.typography.labelLarge)
                Selector(desde?.nombre ?: if (conUbicacion) "Mi ubicación" else "Elige un lugar", exteriores,
                         primera = if (conUbicacion) "Mi ubicación" else null) { desde = it }
                Spacer(Modifier.height(12.dp))
                Text("Hasta", style = MaterialTheme.typography.labelLarge)
                Selector(hasta?.nombre ?: "Elige tu destino", lugares, buscar = exteriores.size != lugares.size) { hasta = it }
                hasta?.let { destino ->
                    destino.nivel?.let { Text("Edificio ${destino.edificio} · ${nombrePiso(it)}", style = MaterialTheme.typography.bodyMedium) }
                }
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
private fun Selector(texto: String, lugares: List<Destino>, primera: String? = null, buscar: Boolean = false, onElegir: (Destino?) -> Unit) {
    var abierto by remember { mutableStateOf(false) }
    var consulta by remember { mutableStateOf("") }
    Box {
        OutlinedButton(onClick = { consulta = ""; abierto = true }, modifier = Modifier.fillMaxWidth()) { Text(texto + "  ▾") }
        DropdownMenu(abierto, onDismissRequest = { abierto = false }) {
            if (buscar) {
                OutlinedTextField(
                    consulta, onValueChange = { consulta = it }, label = { Text("Nombre o código") }, singleLine = true,
                    modifier = Modifier.padding(horizontal = 12.dp).padding(bottom = 8.dp),
                )
            }
            primera?.let { DropdownMenuItem(text = { Text(it) }, onClick = { onElegir(null); abierto = false }) }
            val coincidencias = lugares.filter { consulta.isBlank() || coincide(it, consulta) }
            if (coincidencias.isEmpty()) Text("Sin coincidencias", Modifier.padding(12.dp))
            coincidencias.forEach { l ->
                DropdownMenuItem(text = { Text(l.nombre) }, onClick = { onElegir(l); abierto = false })
            }
        }
    }
}

internal fun nombrePiso(nivel: Int): String = if (nivel == 0) "planta baja" else "piso $nivel"

private fun coincide(destino: Destino, consulta: String): Boolean {
    val texto = normalizarBusqueda("${destino.nombre} ${destino.id}")
    return consulta.trim().split(Regex("\\s+")).all { normalizarBusqueda(it) in texto }
}

private fun normalizarBusqueda(texto: String): String = texto.lowercase()
    .replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u').replace("-", "")
