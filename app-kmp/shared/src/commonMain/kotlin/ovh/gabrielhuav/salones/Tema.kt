package ovh.gabrielhuav.salones

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.unit.dp

/**
 * Las cinco unidades de la UAM y su color distintivo oficial (Pantone y su equivalente HEX), según
 * «Reglas para la Aplicación de los Elementos de Identidad Institucional», UAM, Comunicación Social.
 *
 * `carpeta`: dónde están su modelo 3D, su plano y su georreferencia dentro de los assets (los copia Gradle
 * desde campus/ y campus-<unidad>/). Una unidad nueva sin croquis iría sin carpeta: el mapa va a su `centro`
 * y muestra un cuadro «En desarrollo…». `radio`: hasta dónde se dice «Estás en la UAM».
 * Centros: Azcapotzalco, el de siempre; las demás, el centro de su plano georreferenciado.
 */
enum class Unidad(val nombre: String, val color: Color, val carpeta: String?, val centro: Ubicacion, val radio: Double) {
    AZCAPOTZALCO("Azcapotzalco", Color(0xFFCD032E), "azcapotzalco", UAM_AZCAPOTZALCO, RADIO_CAMPUS), // Pantone 186 C
    CUAJIMALPA("Cuajimalpa", Color(0xFFF08200), "cuajimalpa", Ubicacion(19.351945, -99.282701), 250.0), // Pantone 144 C
    IZTAPALAPA("Iztapalapa", Color(0xFF57A519), "iztapalapa", Ubicacion(19.361775, -99.072597), 450.0), // Pantone 369 C
    LERMA("Lerma", Color(0xFFAD25A8), "lerma", Ubicacion(19.290506, -99.498472), 350.0),               // Pantone 253 C
    XOCHIMILCO("Xochimilco", Color(0xFF0072CE), "xochimilco", Ubicacion(19.30419, -99.102905), 450.0), // Pantone 285 C
}

/**
 * Colores de la app a partir del color de la unidad. En modo claro se usa el color tal cual;
 * en oscuro, una versión más clara sobre fondos oscuros para que se lea bien.
 */
fun esquemaDeColor(unidad: Unidad, oscuro: Boolean): ColorScheme {
    val c = unidad.color
    return if (oscuro) {
        darkColorScheme(
            primary = lerp(c, Color.White, 0.35f),
            onPrimary = Color.Black,
            primaryContainer = lerp(c, Color.Black, 0.55f),
            onPrimaryContainer = lerp(c, Color.White, 0.8f),
            secondaryContainer = lerp(c, Color.Black, 0.65f),
            onSecondaryContainer = lerp(c, Color.White, 0.85f),
        )
    } else {
        lightColorScheme(
            primary = c,
            onPrimary = Color.White,
            primaryContainer = lerp(c, Color.White, 0.82f),
            onPrimaryContainer = lerp(c, Color.Black, 0.55f),
            secondaryContainer = lerp(c, Color.White, 0.75f),
            onSecondaryContainer = lerp(c, Color.Black, 0.6f),
        )
    }
}

/** Botón «Tema ▾»: modo claro u oscuro, color de una unidad y día o noche en el campus. */
@Composable
fun MenuTema(
    unidad: Unidad,
    oscuro: Boolean,
    iluminacion: Iluminacion,
    onUnidad: (Unidad) -> Unit,
    onOscuro: (Boolean) -> Unit,
    onIluminacion: (Iluminacion) -> Unit,
) {
    Box {
        var abierto by remember { mutableStateOf(false) }
        TextButton(onClick = { abierto = true }) { Text("Tema ▾") }
        DropdownMenu(abierto, onDismissRequest = { abierto = false }) {
            fun marca(si: Boolean) = if (si) "✓  " else "     "
            DropdownMenuItem(text = { Text(marca(!oscuro) + "Claro") }, onClick = { onOscuro(false); abierto = false })
            DropdownMenuItem(text = { Text(marca(oscuro) + "Oscuro") }, onClick = { onOscuro(true); abierto = false })
            HorizontalDivider()
            Unidad.entries.forEach { u ->
                DropdownMenuItem(
                    text = { Text(marca(u == unidad) + u.nombre) },
                    leadingIcon = { Box(Modifier.size(16.dp).background(u.color, CircleShape)) },
                    onClick = { onUnidad(u); abierto = false },
                )
            }
            HorizontalDivider()
            Iluminacion.entries.forEach { i ->
                DropdownMenuItem(text = { Text(marca(i == iluminacion) + i.nombre) }, onClick = { onIluminacion(i); abierto = false })
            }
        }
    }
}
