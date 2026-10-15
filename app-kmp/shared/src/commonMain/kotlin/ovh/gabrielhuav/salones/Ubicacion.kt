package ovh.gabrielhuav.salones

import kotlin.math.PI
import kotlin.math.asin
import kotlin.math.cos
import kotlin.math.pow
import kotlin.math.roundToInt
import kotlin.math.sin
import kotlin.math.sqrt

/** Un punto del mapa, en grados. */
data class Ubicacion(val latitud: Double, val longitud: Double)

/** Centro de la UAM Azcapotzalco. El mapa empieza aquí mientras llega tu ubicación. */
val UAM_AZCAPOTZALCO = Ubicacion(19.50306, -99.18694)

/** Radio aproximado del campus, en metros. */
const val RADIO_CAMPUS = 350.0

/** Distancia en metros entre dos puntos (fórmula del haversine). */
fun distanciaMetros(a: Ubicacion, b: Ubicacion): Double {
    fun rad(grados: Double) = grados * PI / 180
    val dLat = rad(b.latitud - a.latitud)
    val dLon = rad(b.longitud - a.longitud)
    val h = sin(dLat / 2).pow(2) + cos(rad(a.latitud)) * cos(rad(b.latitud)) * sin(dLon / 2).pow(2)
    return 2 * 6_371_000.0 * asin(sqrt(h))
}

/** Dice si el punto está en la UAM o a cuántos kilómetros queda. */
fun describir(yo: Ubicacion): String {
    val metros = distanciaMetros(yo, UAM_AZCAPOTZALCO)
    if (metros <= RADIO_CAMPUS) return "Estás en la UAM Azcapotzalco."
    val km = (metros / 100).roundToInt() / 10.0
    return "Estás a $km km de la UAM."
}

/** Página de OpenStreetMap centrada en el lugar y con un marcador. No necesita API key. */
fun urlMapa(lugar: Ubicacion, margen: Double = 0.002): String =
    "https://www.openstreetmap.org/export/embed.html?bbox=" +
        "${lugar.longitud - margen},${lugar.latitud - margen}," +
        "${lugar.longitud + margen},${lugar.latitud + margen}" +
        "&layer=mapnik&marker=${lugar.latitud},${lugar.longitud}"
