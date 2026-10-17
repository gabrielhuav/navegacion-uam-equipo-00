package ovh.gabrielhuav.salones

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

/** Las tres formas de ver el campus. Por defecto, el mapa real con el plano 2D encima. */
enum class Vista(val nombre: String) { MAPA("Mapa"), PLANO("2D"), TRES_D("3D") }

/**
 * Dónde va el plano 2D del campus sobre el mapa real: las esquinas de `plano_2d.png` en grados.
 * Sale de `campus/georreferencia.json`, el mismo archivo que usa Flutter.
 */
data class Georreferencia(
    val ancho: Int,
    val alto: Int,
    val superiorIzquierda: Ubicacion,
    val superiorDerecha: Ubicacion,
    val inferiorIzquierda: Ubicacion,
)

/** Lee georreferencia.json. Basta con buscar cinco claves: no hace falta una librería de JSON. */
fun leerGeorreferencia(json: String): Georreferencia {
    fun entero(clave: String) =
        Regex("\"$clave\"\\s*:\\s*(\\d+)").find(json)?.groupValues?.get(1)?.toInt()
            ?: error("Falta $clave en georreferencia.json")
    fun punto(clave: String): Ubicacion {
        val m = Regex("\"$clave\"\\s*:\\s*\\[\\s*(-?[\\d.]+)\\s*,\\s*(-?[\\d.]+)\\s*]").find(json)
            ?: error("Falta $clave en georreferencia.json")
        return Ubicacion(m.groupValues[1].toDouble(), m.groupValues[2].toDouble())
    }
    return Georreferencia(
        ancho = entero("ancho"),
        alto = entero("alto"),
        superiorIzquierda = punto("superiorIzquierda"),
        superiorDerecha = punto("superiorDerecha"),
        inferiorIzquierda = punto("inferiorIzquierda"),
    )
}

/** El modelo 3D del campus. En Android se dibuja con Filament; en iOS, todavía no. */
@Composable
expect fun Campus3D(modifier: Modifier = Modifier)
