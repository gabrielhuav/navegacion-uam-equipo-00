package ovh.gabrielhuav.salones

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
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
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

/** Mapa centrado en el lugar, con las teselas del proveedor elegido (índice en PROVEEDORES). */
@Composable
expect fun Mapa(lugar: Ubicacion, conMarcador: Boolean, proveedor: Int, modifier: Modifier = Modifier)

/**
 * Pantalla del Prototipo 1, la misma en Android y en iOS: el mapa a pantalla completa,
 * una tarjeta con el mensaje, los proveedores y el botón para volver a ubicarte.
 */
@Composable
fun App(ubicacion: Ubicacion?, mensaje: String, onUbicar: () -> Unit = {}) {
    MaterialTheme {
        var proveedor by remember { mutableStateOf(0) }
        Box(Modifier.fillMaxSize()) {
            Mapa(ubicacion ?: UAM_AZCAPOTZALCO, conMarcador = ubicacion != null, proveedor, Modifier.fillMaxSize())

            Column(Modifier.safeDrawingPadding().padding(12.dp).fillMaxWidth()) {
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
                onClick = onUbicar,
                modifier = Modifier.align(Alignment.BottomEnd).safeDrawingPadding().padding(16.dp).padding(bottom = 32.dp),
            ) {
                Text("Ubicarme")
            }
        }
    }
}
