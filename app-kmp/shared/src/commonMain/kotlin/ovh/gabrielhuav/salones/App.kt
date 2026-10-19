package ovh.gabrielhuav.salones

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material3.AlertDialog
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
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateListOf
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
expect fun Mapa(centro: Ubicacion, marcador: Ubicacion?, proveedor: Int, centrar: Int, conTeselas: Boolean, noche: Boolean, sede: Unidad, conMarca: Boolean, ruta: Ruta? = null, modifier: Modifier = Modifier)

/**
 * Pantalla de los prototipos 2 (el campus) y 3 (rutas), la misma en Android y en iOS, y la misma que la de Flutter:
 * el campus a pantalla completa (Mapa, 2D o 3D), una tarjeta con el mensaje y el menú «Mapa»,
 * y los botones «UAM» y «Ubicarme» (en 3D, «Inclinar» o «Desde arriba»).
 * Con «Tema ▾» se elige modo claro u oscuro, el color de una de las cinco unidades de la UAM
 * y si el campus se ve de día o de noche (por defecto, según la hora del teléfono).
 * Al elegir otra unidad, la app pregunta si quieres ir a ella: las cinco tienen croquis (Mapa, 2D y 3D).
 */
@Composable
fun App(ubicacion: Ubicacion?, mensaje: String, onUbicar: () -> Unit = {}, redAzcapotzalco: String? = null) {
    val sistemaOscuro = isSystemInDarkTheme()
    // Lo último que se eligió en «Tema ▾»; la primera vez, claro u oscuro como el teléfono.
    var oscuro by rememberSaveable { mutableStateOf(Preferencias.leer("oscuro")?.toBoolean() ?: sistemaOscuro) }
    var unidad by rememberSaveable { mutableStateOf(Preferencias.leerEnum("unidad", Unidad.AZCAPOTZALCO)) }
    var iluminacion by rememberSaveable { mutableStateOf(Preferencias.leerEnum("iluminacion", Iluminacion.AUTOMATICA)) }
    // La unidad cuyo campus se ve; puede ser otra que la del color (se pregunta al cambiar de unidad).
    var sede by rememberSaveable { mutableStateOf(Preferencias.leerEnum("sede", Unidad.AZCAPOTZALCO)) }
    var preguntar by remember { mutableStateOf<Unidad?>(null) }
    // Configuración: el modo desarrollador permite quitar la marca de agua del plano, del 3D y de la app.
    var desarrollador by rememberSaveable { mutableStateOf(Preferencias.leer("desarrollador")?.toBoolean() ?: false) }
    var marcaPedida by rememberSaveable { mutableStateOf(Preferencias.leer("marca")?.toBoolean() ?: true) }
    var configurando by remember { mutableStateOf(false) }
    val conMarca = !desarrollador || marcaPedida
    // Prototipo 3: rutas en Azcapotzalco (la red viene de campus/rutas.json).
    val red = remember(redAzcapotzalco) { redAzcapotzalco?.let { runCatching { leerRed(it) }.getOrNull() } }
    var eligiendoRuta by remember { mutableStateOf(false) }
    var ruta by remember { mutableStateOf<Ruta?>(null) }
    var rutaTexto by remember { mutableStateOf("") }
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
        // Cada modelo 3D se carga la primera vez que se pide y ya no se libera: sólo se oculta y deja de dibujarse.
        val con3D = remember { mutableStateListOf<Unidad>() }
        if (vista == Vista.TRES_D && sede.carpeta != null && sede !in con3D) con3D.add(sede)
        Box(Modifier.fillMaxSize()) {
            con3D.forEach { s ->
                key(s) { Campus3D(s, visible = vista == Vista.TRES_D && s == sede, inclinada, noche, conMarca, Modifier.fillMaxSize()) }
            }
            if (vista == Vista.TRES_D && sede.carpeta == null) EnDesarrollo(sede, Modifier.fillMaxSize())
            if (vista != Vista.TRES_D) {
                val centro = if (enLaUam || ubicacion == null) sede.centro else ubicacion
                Mapa(centro, ubicacion, proveedor, centrar, conTeselas = vista == Vista.MAPA, noche, sede, conMarca, ruta.takeIf { sede == Unidad.AZCAPOTZALCO }, Modifier.fillMaxSize())
            }

            Card(Modifier.safeDrawingPadding().padding(12.dp).widthIn(max = 480.dp).fillMaxWidth()) {
                Row(Modifier.padding(start = 16.dp, end = 4.dp, top = 8.dp, bottom = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text("Campus UAM", style = MaterialTheme.typography.titleLarge)
                        Text(ubicacion?.let { describir(it, sede) } ?: mensaje, style = MaterialTheme.typography.bodyMedium)
                        if (ruta != null && sede == Unidad.AZCAPOTZALCO) {
                            Text(rutaTexto, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.primary)
                        }
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
                            onUnidad = {
                                unidad = it
                                Preferencias.guardar("unidad", it.name)
                                if (it != sede) preguntar = it
                            },
                            onOscuro = { oscuro = it; Preferencias.guardar("oscuro", it.toString()) },
                            onIluminacion = { iluminacion = it; Preferencias.guardar("iluminacion", it.name) },
                        )
                        TextButton(onClick = { configurando = true }) { Text("⚙ Ajustes") }
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

            // Marca de agua temporal: el autor del proyecto (se quita en Ajustes → modo desarrollador).
            if (conMarca) Text(
                "© @gabrielhuav",
                Modifier.align(Alignment.BottomStart).safeDrawingPadding().padding(start = 8.dp, bottom = 40.dp),
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.55f),
                style = MaterialTheme.typography.labelMedium,
            )

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
                    // Rutas: sólo en Azcapotzalco, mientras las otras unidades no tienen red de caminos.
                    if (red != null && sede == Unidad.AZCAPOTZALCO) {
                        ExtendedFloatingActionButton(onClick = { if (ruta == null) eligiendoRuta = true else ruta = null }) {
                            Text(if (ruta == null) "Ruta" else "Quitar ruta")
                        }
                    }
                    ExtendedFloatingActionButton(onClick = { enLaUam = true; centrar++ }) { Text("UAM") }
                    ExtendedFloatingActionButton(onClick = { enLaUam = false; centrar++; onUbicar() }) { Text("Ubicarme") }
                }
            }

            if (eligiendoRuta && red != null) {
                ElegirRuta(red, conUbicacion = ubicacion != null, onCerrar = { eligiendoRuta = false }) { desde, hasta ->
                    eligiendoRuta = false
                    val calculada = if (desde == null) ubicacion?.let { red.rutaDesde(it, hasta) }
                                    else red.rutaMasCorta(desde.nodo, hasta.nodo)?.let { it to false }
                    ruta = calculada?.first
                    rutaTexto = calculada?.let { (r, porAcceso) ->
                        "Ruta a ${hasta.nombre}: ${r.metros.toInt()} m · ${r.minutos} min a pie" +
                            if (porAcceso) " (desde el acceso más cercano)" else ""
                    } ?: "No hay camino hacia ${hasta.nombre}."
                    if (vista == Vista.TRES_D) vista = Vista.MAPA
                    enLaUam = true
                    centrar++
                }
            }

            if (configurando) {
                Configuracion(
                    desarrollador, marcaPedida,
                    onDesarrollador = { desarrollador = it; Preferencias.guardar("desarrollador", it.toString()) },
                    onMarca = { marcaPedida = it; Preferencias.guardar("marca", it.toString()) },
                    onCerrar = { configurando = false },
                )
            }

            // Al cambiar de unidad en «Tema ▾»: ¿ir también a su campus?
            preguntar?.let { u ->
                AlertDialog(
                    onDismissRequest = { preguntar = null },
                    title = { Text("¿Ir a la UAM ${u.nombre}?") },
                    text = {
                        Text(if (u.carpeta != null) "El mapa, el plano 2D y el modelo 3D cambian a esa unidad."
                             else "Su croquis todavía está en desarrollo: el mapa irá a la unidad y marcará dónde está.")
                    },
                    confirmButton = {
                        TextButton(onClick = {
                            sede = u
                            Preferencias.guardar("sede", u.name)
                            enLaUam = true
                            centrar++
                            preguntar = null
                        }) { Text("Ir") }
                    },
                    dismissButton = { TextButton(onClick = { preguntar = null }) { Text("Sólo el color") } },
                )
            }
        }
    }
}

/** En lugar del 3D, mientras la unidad no tiene croquis: un cuadro de su color con «En desarrollo…». */
@Composable
private fun EnDesarrollo(sede: Unidad, modifier: Modifier = Modifier) {
    Box(modifier.background(MaterialTheme.colorScheme.surfaceContainer), contentAlignment = Alignment.Center) {
        Box(
            Modifier.size(220.dp).background(sede.color.copy(alpha = 0.18f)).border(3.dp, sede.color),
            contentAlignment = Alignment.Center,
        ) {
            Text("En desarrollo…", color = sede.color, style = MaterialTheme.typography.titleLarge)
        }
    }
}
