package ovh.gabrielhuav.salones

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

/** Mapa centrado en el lugar, con un marcador. Cada plataforma lo dibuja a su manera. */
@Composable
expect fun Mapa(lugar: Ubicacion, modifier: Modifier = Modifier)

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
                Button(onClick = onUbicar, modifier = Modifier.padding(16.dp)) {
                    Text("Volver a ubicarme")
                }
                Mapa(ubicacion ?: UAM_AZCAPOTZALCO, Modifier.fillMaxSize())
            }
        }
    }
}
