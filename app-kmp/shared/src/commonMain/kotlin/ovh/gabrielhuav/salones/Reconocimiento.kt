package ovh.gabrielhuav.salones

import kotlin.math.sqrt

/**
 * Experimento: reconocer con la cámara el edificio que se tiene enfrente, por ahora en la ESCOM y en UAM Azcapotzalco.
 * El modelo (TFLite, en Android) convierte cada cuadro en un vector de 960 números; aquí se compara
 * con la galería de fotos de los alumnos de cada campus (sin fotos ni nombres) y se vota entre cuadros.
 * Reconocer una fachada no dice dónde está parado el teléfono: sólo sugiere un destino.
 */
data class Reconocido(val clase: String, val destino: String, val puntaje: Float, val momento: Long)

/**
 * Lo que reconoce un campus: el prefijo de sus archivos en assets/reconocimiento/ y el edificio que hace aparecer
 * la mascota. Cada campus tiene su propia galería: nunca se mezclan edificios de campus distintos.
 */
data class Reconocedor(val prefijo: String, val objetivo: String)

/** El reconocedor de `sede`, o null mientras ese campus no tenga galería. */
fun reconocedorDe(sede: Unidad): Reconocedor? = when (sede) {
    Unidad.ESCOM -> Reconocedor("escom", "laboratorios")
    Unidad.AZCAPOTZALCO -> Reconocedor("uam_azcapotzalco", "T")
    else -> null
}

/** La mascota que aparece sobre la cámara: el burro blanco en el IPN; en la UAM, UAMito con la playera de su unidad. */
fun mascotaDe(sede: Unidad): String = if (sede == Unidad.ESCOM) "burrito.png" else "uamito_${sede.carpeta}.png"

/**
 * Prototipos normalizados por clase, el destino de rutas.json de cada clase y el umbral de «no sé».
 * [umbrales] permite un umbral propio por clase (p. ej. laboratorios, calibrado aparte con sus fotos).
 */
class Galeria(
    val clases: List<String>,
    private val prototipos: Map<String, List<FloatArray>>,
    val destinos: Map<String, String>,
    private val umbralGeneral: Float,
    private val umbrales: Map<String, Float> = emptyMap(),
) {
    /** Similitud mínima para responder esa clase; por debajo, «no sé». No es un porcentaje de certeza. */
    fun umbral(clase: String): Float = umbrales[clase] ?: umbralGeneral

    /** Puntaje de cada clase (en el orden de [clases]): la media de sus tres similitudes coseno más altas. */
    fun puntajes(vector: FloatArray): FloatArray {
        val norma = sqrt(vector.fold(0f) { s, x -> s + x * x }).takeIf { it > 1e-6f } ?: return FloatArray(clases.size)
        return FloatArray(clases.size) { k ->
            prototipos[clases[k]].orEmpty()
                .map { p -> var s = 0f; for (i in p.indices) s += p[i] * vector[i]; s / norma }
                .sortedDescending().take(3).average().toFloat()
        }
    }
}

/** Promedia los puntajes de los últimos [cuadros] cuadros; responde sólo si la mejor clase supera el umbral. */
class Votacion(private val galeria: Galeria, private val cuadros: Int = 7) {
    private val recientes = ArrayDeque<FloatArray>()

    fun agregar(puntajes: FloatArray) {
        recientes.addLast(puntajes)
        if (recientes.size > cuadros) recientes.removeFirst()
    }

    /** La clase más votada y su puntaje medio, aunque no supere el umbral (para mostrarlo en pantalla). */
    fun mejor(): Pair<String, Float>? {
        if (recientes.isEmpty()) return null
        val media = FloatArray(galeria.clases.size) { k -> recientes.map { it[k] }.average().toFloat() }
        val k = media.indices.maxBy { media[it] }
        return galeria.clases[k] to media[k]
    }

    /** Resultado estable: ventana llena y la mejor clase por encima del umbral; si no, «no sé» (null). */
    fun resultado(momento: Long): Reconocido? {
        if (recientes.size < cuadros) return null
        val (clase, puntaje) = mejor() ?: return null
        val destino = galeria.destinos[clase] ?: return null
        return if (puntaje >= galeria.umbral(clase)) Reconocido(clase, destino, puntaje, momento) else null
    }
}

/** Ocho lados, empezando por el norte y en el sentido del reloj. */
val LADOS = listOf("norte", "noreste", "este", "sureste", "sur", "suroeste", "oeste", "noroeste")

/** El lado (de [LADOS]) que corresponde a un rumbo en grados (0 = norte, 90 = este). */
fun ladoDe(rumbo: Double): String = LADOS[(((rumbo + 22.5) % 360 + 360) % 360 / 45).toInt() % 8]

/** Rumbo en grados (0 = norte, 90 = este) para ir de [desde] a [hasta]; vale para distancias cortas. */
fun rumbo(desde: Ubicacion, hasta: Ubicacion): Double {
    val norte = hasta.latitud - desde.latitud
    val este = (hasta.longitud - desde.longitud) * kotlin.math.cos(desde.latitud * kotlin.math.PI / 180)
    return (kotlin.math.atan2(este, norte) * 180 / kotlin.math.PI + 360) % 360
}

/** Diferencia de ángulos en grados, entre -180 y 180 (positiva: [a] queda a la derecha de [b]). */
fun diferenciaAngulo(a: Double, b: Double): Double = ((a - b) % 360 + 540) % 360 - 180
