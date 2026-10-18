package ovh.gabrielhuav.salones

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay

/**
 * Mapa centrado en `centro`, con las teselas del proveedor elegido (índice en PROVEEDORES)
 * y el plano 2D del campus encima. Sin teselas queda solo el plano, como el «Plano superior» del editor web.
 * El punto azul marca `marcador` (tu ubicación), esté o no en el centro.
 * Cada vez que `centrar` cambia, el mapa vuelve al centro y al zoom inicial.
 */
@Composable
expect fun Mapa(centro: Ubicacion, marcador: Ubicacion?, proveedor: Int, centrar: Int, conTeselas: Boolean, noche: Boolean, modifier: Modifier = Modifier)

/**
 * Pantalla del Prototipo 3, la misma en Android y en iOS, y la misma que la de Flutter:
 * el campus a pantalla completa (Mapa, 2D o 3D), una tarjeta con el mensaje y el menú «Mapa»,
 * y los botones «UAM» y «Ubicarme» (en 3D, «Inclinar» o «Desde arriba»).
 * Con «Tema ▾» se elige modo claro u oscuro, el color de una de las cinco unidades de la UAM
 * y si el campus se ve de día o de noche (por defecto, según la hora del teléfono).
 */
@Composable
fun App(ubicacion: Ubicacion?, mensaje: String, onUbicar: () -> Unit = {}) {
    val sistemaOscuro = isSystemInDarkTheme()
    // Lo último que se eligió en «Tema ▾»; la primera vez, claro u oscuro como el teléfono.
    var oscuro by rememberSaveable { mutableStateOf(Preferencias.leer("oscuro")?.toBoolean() ?: sistemaOscuro) }
    var unidad by rememberSaveable { mutableStateOf(Preferencias.leerEnum("unidad", Unidad.AZCAPOTZALCO)) }
    var iluminacion by rememberSaveable { mutableStateOf(Preferencias.leerEnum("iluminacion", Iluminacion.AUTOMATICA)) }
    var hora by remember { mutableStateOf(horaLocal()) }
    LaunchedEffect(Unit) {
        while (true) { // revisa la hora cada minuto: al dar las 19:00 el campus se hace de noche
            delay(60_000)
            hora = horaLocal()
        }
    }
    val noche = when (iluminacion) {
        Iluminacion.AUTOMATICA -> esDeNoche(hora)
        Iluminacion.DIA -> false
        Iluminacion.NOCHE -> true
    }
    MaterialTheme(colorScheme = esquemaDeColor(unidad, oscuro)) {
        var proveedor by rememberSaveable { mutableStateOf(0) }
        var centrar by rememberSaveable { mutableStateOf(0) }
        var vista by rememberSaveable { mutableStateOf(Vista.MAPA) }
        var enLaUam by rememberSaveable { mutableStateOf(false) } // «UAM» centra el campus; «Ubicarme», a ti
        var inclinada by rememberSaveable { mutableStateOf(false) }
        // El modelo 3D se carga la primera vez que se pide y ya no se libera: solo se oculta y deja de dibujarse.
        var con3D by rememberSaveable { mutableStateOf(false) }
        if (vista == Vista.TRES_D) con3D = true
        Box(Modifier.fillMaxSize()) {
            if (con3D) Campus3D(visible = vista == Vista.TRES_D, inclinada, noche, Modifier.fillMaxSize())
            if (vista != Vista.TRES_D) {
                val centro = if (enLaUam || ubicacion == null) UAM_AZCAPOTZALCO else ubicacion
                Mapa(centro, ubicacion, proveedor, centrar, conTeselas = vista == Vista.MAPA, noche, Modifier.fillMaxSize())
            }

            Card(Modifier.safeDrawingPadding().padding(12.dp).widthIn(max = 480.dp).fillMaxWidth()) {
                Row(Modifier.padding(start = 16.dp, end = 4.dp, top = 8.dp, bottom = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text("Campus UAM", style = MaterialTheme.typography.titleLarge)
                        Text(mensaje, style = MaterialTheme.typography.bodyMedium)
                        // Mapa real con el plano encima, solo el plano, o el modelo 3D.
                        SingleChoiceSegmentedButtonRow(Modifier.padding(top = 8.dp)) {
                            Vista.entries.forEachIndexed { i, v ->
                                SegmentedButton(
                                    selected = vista == v,
                                    onClick = { vista = v },
                                    shape = SegmentedButtonDefaults.itemShape(i, Vista.entries.size),
                                ) { Text(v.nombre) }
                            }
                        }
                    }
                    // Tema arriba; si un proveedor no carga, se elige otro abajo.
                    Column(horizontalAlignment = Alignment.End) {
                        // Cada elección se guarda: al volver a abrir la app sigue igual.
                        MenuTema(
                            unidad, oscuro, iluminacion,
                            onUnidad = { unidad = it; Preferencias.guardar("unidad", it.name) },
                            onOscuro = { oscuro = it; Preferencias.guardar("oscuro", it.toString()) },
                            onIluminacion = { iluminacion = it; Preferencias.guardar("iluminacion", it.name) },
                        )
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
            }

            Column(
                Modifier.align(Alignment.BottomEnd).safeDrawingPadding().padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                horizontalAlignment = Alignment.End,
            ) {
                if (vista == Vista.TRES_D) {
                    ExtendedFloatingActionButton(onClick = { inclinada = !inclinada }) {
                        Text(if (inclinada) "Desde arriba" else "Inclinar")
                    }
                } else {
                    ExtendedFloatingActionButton(onClick = { enLaUam = true; centrar++ }) { Text("UAM") }
                    ExtendedFloatingActionButton(onClick = { enLaUam = false; centrar++; onUbicar() }) { Text("Ubicarme") }
                }
            }
        }
    }
}
