package ovh.gabrielhuav.salones

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

/** Mapa centrado en el lugar, con las teselas del proveedor elegido (índice en PROVEEDORES). */
@Composable
expect fun Mapa(lugar: Ubicacion, conMarcador: Boolean, proveedor: Int, modifier: Modifier = Modifier)

/**
 * Pantalla del Prototipo 1, la misma en Android y en iOS: el mensaje y el mapa.
 * Mientras no hay ubicación, el mapa se centra en la UAM.
 */
@Composable
fun App(ubicacion: Ubicacion?, mensaje: String, onUbicar: () -> Unit = {}) {
    MaterialTheme {
        Scaffold { margenes ->
            Column(Modifier.padding(margenes).fillMaxSize()) {
                Text(
                    text = "Salones UAM · ¿Dónde estoy?",
                    style = MaterialTheme.typography.titleLarge,
                    modifier = Modifier.padding(16.dp),
                )
                Text(mensaje, modifier = Modifier.padding(horizontal = 16.dp))
                Button(onClick = onUbicar, modifier = Modifier.padding(horizontal = 16.dp)) {
                    Text("Volver a ubicarme")
                }
                // Proveedor del mapa: si uno no carga, se elige otro.
                var proveedor by remember { mutableStateOf(0) }
                Row(Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 8.dp)) {
                    PROVEEDORES.forEachIndexed { i, p ->
                        FilterChip(
                            selected = i == proveedor,
                            onClick = { proveedor = i },
                            label = { Text(p.nombre) },
                            modifier = Modifier.padding(4.dp),
                        )
                    }
                }
                Mapa(ubicacion ?: UAM_AZCAPOTZALCO, conMarcador = ubicacion != null, proveedor, Modifier.fillMaxSize())
            }
        }
    }
}
