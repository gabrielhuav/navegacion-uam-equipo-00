package ovh.gabrielhuav.salones

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material3.Card
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

/**
 * Mapa centrado en el lugar, con las teselas del proveedor elegido (índice en PROVEEDORES).
 * Cada vez que `centrar` cambia, el mapa vuelve al lugar y al zoom inicial.
 */
@Composable
expect fun Mapa(lugar: Ubicacion, conMarcador: Boolean, proveedor: Int, centrar: Int, modifier: Modifier = Modifier)

/**
 * Pantalla del Prototipo 1, la misma en Android y en iOS, y la misma que la de Flutter:
 * el mapa a pantalla completa, una tarjeta con el mensaje y el menú «Mapa», y el botón «Ubicarme».
 */
@Composable
fun App(ubicacion: Ubicacion?, mensaje: String, onUbicar: () -> Unit = {}) {
    MaterialTheme {
        var proveedor by rememberSaveable { mutableStateOf(0) }
        var centrar by rememberSaveable { mutableStateOf(0) }
        Box(Modifier.fillMaxSize()) {
            Mapa(ubicacion ?: UAM_AZCAPOTZALCO, conMarcador = ubicacion != null, proveedor, centrar, Modifier.fillMaxSize())

            Card(Modifier.safeDrawingPadding().padding(12.dp).widthIn(max = 480.dp).fillMaxWidth()) {
                Row(Modifier.padding(start = 16.dp, end = 4.dp, top = 8.dp, bottom = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text("¿Dónde estoy?", style = MaterialTheme.typography.titleLarge)
                        Text(mensaje, style = MaterialTheme.typography.bodyMedium)
                    }
                    // Si un proveedor no carga, se elige otro aquí.
                    Box {
                        var abierto by remember { mutableStateOf(false) }
                        TextButton(onClick = { abierto = true }) { Text("Mapa ▾") }
                        DropdownMenu(abierto, onDismissRequest = { abierto = false }) {
                            PROVEEDORES.forEachIndexed { i, p ->
                                DropdownMenuItem(
                                    text = { Text((if (i == proveedor) "✓  " else "     ") + p.nombre) },
                                    onClick = { proveedor = i; abierto = false },
                                )
                            }
                        }
                    }
                }
            }

            ExtendedFloatingActionButton(
                onClick = { centrar++; onUbicar() },
                modifier = Modifier.align(Alignment.BottomEnd).safeDrawingPadding().padding(16.dp),
            ) {
                Text("Ubicarme")
            }
        }
    }
}
