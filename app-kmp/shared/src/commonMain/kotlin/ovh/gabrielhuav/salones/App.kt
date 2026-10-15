package ovh.gabrielhuav.salones

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp

/**
 * Pantalla del Prototipo 1. Es la MISMA función en Android y en iOS: vive en `commonMain`.
 * La lógica (normalizar y buscar la clave) está en Catalogo.kt y se prueba en commonTest.
 */
@Composable
fun App() {
    MaterialTheme {
        // Scaffold deja espacio para la barra de estado y la de navegación.
        Scaffold { margenes ->
            PantallaBuscar(Modifier.padding(margenes))
        }
    }
}

@Composable
fun PantallaBuscar(modifier: Modifier = Modifier) {
    // Estado de la pantalla: lo que escribe el usuario y el último resultado.
    var clave by remember { mutableStateOf("") }
    var resultado by remember { mutableStateOf<Resultado?>(null) }
    val buscar = { resultado = buscarSalon(clave) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(
            text = "Salones UAM",
            style = MaterialTheme.typography.displaySmall,
            color = MaterialTheme.colorScheme.primary,
        )
        Text(
            text = "Prototipo 1 · Buscar el salón del horario",
            style = MaterialTheme.typography.titleMedium,
        )
        OutlinedTextField(
            value = clave,
            onValueChange = { clave = it },
            label = { Text("Salón de tu horario") },
            placeholder = { Text("Ejemplo: A-201") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(
                capitalization = KeyboardCapitalization.Characters,
                imeAction = ImeAction.Search,
            ),
            keyboardActions = KeyboardActions(onSearch = { buscar() }),
            modifier = Modifier.fillMaxWidth(),
        )
        Button(onClick = buscar) {
            Text("Buscar")
        }
        resultado?.let { TarjetaResultado(it) }
        Text(
            text = "Prueba con A-201, g302 o una clave que no exista.",
            style = MaterialTheme.typography.bodyMedium,
        )
        Text(
            text = "Datos de ejemplo · ${catalogoDeEjemplo.size} salones · KMP en ${plataforma()}",
            style = MaterialTheme.typography.bodySmall,
        )
    }
}

/** Tarjeta con la respuesta: color principal si se encontró, de error si no. */
@Composable
fun TarjetaResultado(resultado: Resultado) {
    val colores = MaterialTheme.colorScheme
    val encontrado = resultado is Resultado.Encontrado
    Card(
        colors = CardDefaults.cardColors(
            containerColor = if (encontrado) colores.primaryContainer else colores.errorContainer,
            contentColor = if (encontrado) colores.onPrimaryContainer else colores.onErrorContainer,
        ),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(Modifier.padding(16.dp)) {
            if (resultado is Resultado.Encontrado) {
                Text(resultado.salon.clave, style = MaterialTheme.typography.headlineSmall)
            }
            Text(mensaje(resultado), style = MaterialTheme.typography.bodyLarge)
        }
    }
}
