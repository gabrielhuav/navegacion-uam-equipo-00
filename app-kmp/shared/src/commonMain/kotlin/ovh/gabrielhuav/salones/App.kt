package ovh.gabrielhuav.salones

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.Card
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

/**
 * Mapa centrado en el lugar, con las teselas del proveedor elegido (índice en PROVEEDORES).
 * Cada vez que `centrar` cambia, el mapa vuelve al lugar aunque se haya arrastrado.
 */
@Composable
expect fun Mapa(lugar: Ubicacion, conMarcador: Boolean, proveedor: Int, centrar: Int, modifier: Modifier = Modifier)

/**
 * Pantalla del Prototipo 1, la misma en Android y en iOS: el mapa a pantalla completa,
 * una tarjeta con el mensaje, los proveedores y el botón para volver a ubicarte.
 */
@Composable
fun App(ubicacion: Ubicacion?, mensaje: String, onUbicar: () -> Unit = {}) {
    MaterialTheme {
        // rememberSaveable: el proveedor elegido no se pierde al girar el teléfono.
        var proveedor by rememberSaveable { mutableStateOf(0) }
        var centrar by rememberSaveable { mutableStateOf(0) }
        Box(Modifier.fillMaxSize()) {
            Mapa(ubicacion ?: UAM_AZCAPOTZALCO, conMarcador = ubicacion != null, proveedor, centrar, Modifier.fillMaxSize())

            // En horizontal la tarjeta no ocupa todo el ancho, para que se vea el mapa.
            Column(Modifier.safeDrawingPadding().padding(12.dp).widthIn(max = 480.dp)) {
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(16.dp)) {
                        Text("¿Dónde estoy?", style = MaterialTheme.typography.titleLarge)
                        Text(mensaje, style = MaterialTheme.typography.bodyMedium)
                    }
                }
                // Si un proveedor no carga, se elige otro.
                Row(Modifier.horizontalScroll(rememberScrollState())) {
                    PROVEEDORES.forEachIndexed { i, p ->
                        FilterChip(
                            selected = i == proveedor,
                            onClick = { proveedor = i },
                            label = { Text(p.nombre) },
                            colors = FilterChipDefaults.filterChipColors(containerColor = Color.White),
                            modifier = Modifier.padding(end = 8.dp, top = 8.dp),
                        )
                    }
                }
            }

            ExtendedFloatingActionButton(
                onClick = { centrar++; onUbicar() },
                modifier = Modifier.align(Alignment.BottomEnd).safeDrawingPadding().padding(16.dp).padding(bottom = 32.dp),
            ) {
                Text("Ubicarme")
            }
        }
    }
}
