package ovh.gabrielhuav.salones

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sqrt

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

/**
 * Hacia dónde queda el norte en el modelo, como vector unitario (x, z) del suelo.
 * El borde superior del plano va hacia +x y el izquierdo hacia +z; sus esquinas en el mapa dicen cómo está girado.
 */
fun norteEnModelo(geo: Georreferencia): Pair<Double, Double> {
    val cosLat = cos(geo.superiorIzquierda.latitud * PI / 180)
    // Cuánto avanza un píxel del plano (este, norte); la escala común no importa.
    fun porPixel(u: Ubicacion, pixeles: Int) = Pair(
        (u.longitud - geo.superiorIzquierda.longitud) * cosLat / pixeles,
        (u.latitud - geo.superiorIzquierda.latitud) / pixeles,
    )
    val (ax, ay) = porPixel(geo.superiorDerecha, geo.ancho)  // hacia +x
    val (bx, by) = porPixel(geo.inferiorIzquierda, geo.alto) // hacia +z
    // norte = x·(ax, ay) + z·(bx, by) con este = 0 y norte = 1 (regla de Cramer).
    val det = ax * by - ay * bx
    val x = -bx / det
    val z = ax / det
    val largo = sqrt(x * x + z * z)
    return Pair(x / largo, z / largo)
}

/**
 * El modelo 3D del campus. Empieza visto desde arriba con el norte hacia arriba, como el mapa;
 * con `inclinada` la cámara baja para verlo de lado. En Android se dibuja con Filament; en iOS, todavía no.
 * Mientras `visible` es falso no se dibuja: así no gasta batería.
 */
@Composable
expect fun Campus3D(visible: Boolean, inclinada: Boolean, modifier: Modifier = Modifier)
