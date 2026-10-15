package ovh.gabrielhuav.salones

import kotlin.math.PI
import kotlin.math.asin
import kotlin.math.cos
import kotlin.math.ln
import kotlin.math.pow
import kotlin.math.roundToInt
import kotlin.math.sin
import kotlin.math.sqrt
import kotlin.math.tan

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

/** Un proveedor de mapas: nombre, plantilla de teselas y crédito. Ninguno necesita API key. */
data class Proveedor(val nombre: String, val teselas: String, val credito: String)

private const val ARCGIS = "https://server.arcgisonline.com/ArcGIS/rest/services/"

/** Si uno no responde, el mapa pasa solo al siguiente; también se elige con los botones de arriba del mapa. */
val PROVEEDORES = listOf(
    Proveedor("CARTO", "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", "© OpenStreetMap contributors © CARTO"),
    Proveedor("Esri calles", ARCGIS + "World_Street_Map/MapServer/tile/{z}/{y}/{x}", "Tiles © Esri"),
    Proveedor("Esri satélite", ARCGIS + "World_Imagery/MapServer/tile/{z}/{y}/{x}", "Tiles © Esri"),
    Proveedor("OpenStreetMap", "https://tile.openstreetmap.org/{z}/{x}/{y}.png", "© OpenStreetMap contributors"),
)

/** Acercamiento del mapa: en 17 se distinguen los edificios del campus. */
const val ZOOM = 17

/**
 * Posición del lugar en teselas (cuadros de 256 px) con la proyección de todos los mapas web.
 * La parte entera dice qué tesela; la fracción, en qué parte de ella cae el punto.
 */
fun posicionEnTeselas(lugar: Ubicacion, zoom: Int = ZOOM): Pair<Double, Double> {
    val n = 2.0.pow(zoom)
    val x = (lugar.longitud + 180) / 360 * n
    val latRad = lugar.latitud * PI / 180
    val y = (1 - ln(tan(latRad) + 1 / cos(latRad)) / PI) / 2 * n
    return x to y
}

/** Dirección de una tesela de un proveedor. */
fun urlTesela(proveedor: Proveedor, x: Int, y: Int, zoom: Int = ZOOM): String =
    proveedor.teselas.replace("{z}", "$zoom").replace("{x}", "$x").replace("{y}", "$y")
