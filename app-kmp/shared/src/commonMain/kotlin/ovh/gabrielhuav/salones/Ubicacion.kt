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

/** Un proveedor de mapas: nombre, plantilla de teselas y crédito. Ninguno necesita API key. */
data class Proveedor(val nombre: String, val teselas: String, val credito: String, val subdominios: String = "")

private const val ARCGIS = "https://server.arcgisonline.com/ArcGIS/rest/services/"

/** Si uno no responde, el mapa pasa solo al siguiente; también se puede elegir con el botón de capas. */
val PROVEEDORES = listOf(
    Proveedor("CARTO", "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "&copy; OpenStreetMap contributors &copy; CARTO", "abcd"),
    Proveedor("Esri calles", ARCGIS + "World_Street_Map/MapServer/tile/{z}/{y}/{x}", "Tiles &copy; Esri"),
    Proveedor("Esri satélite", ARCGIS + "World_Imagery/MapServer/tile/{z}/{y}/{x}", "Tiles &copy; Esri"),
    Proveedor("OpenStreetMap", "https://tile.openstreetmap.org/{z}/{x}/{y}.png", "&copy; OpenStreetMap contributors"),
)

/**
 * Página con Leaflet: el mapa centrado en el lugar, el selector de proveedores y,
 * si hay ubicación, un círculo azul donde estás.
 */
fun paginaMapa(lugar: Ubicacion, conMarcador: Boolean): String {
    val capas = PROVEEDORES.joinToString(",\n") { p ->
        "'${p.nombre}': L.tileLayer('${p.teselas}', {maxZoom: 19, subdomains: '${p.subdominios.ifEmpty { "abc" }}', attribution: '${p.credito}'})"
    }
    val marcador = if (conMarcador) {
        "L.circleMarker([${lugar.latitud}, ${lugar.longitud}], {radius: 9, color: '#fff', weight: 3, " +
            "fillColor: '#1a73e8', fillOpacity: 1}).addTo(mapa).bindPopup('Estás aquí');"
    } else {
        ""
    }
    return """
<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html, body, #mapa { height: 100%; margin: 0; }</style>
</head><body>
<div id="mapa"></div>
<script>
var mapa = L.map('mapa').setView([${lugar.latitud}, ${lugar.longitud}], 17);
var capas = {
$capas
};
var nombres = Object.keys(capas);
capas[nombres[0]].addTo(mapa);
L.control.layers(capas).addTo(mapa);
// Si un proveedor falla varias veces seguidas, se pasa al siguiente.
var errores = 0;
nombres.forEach(function (nombre, i) {
  capas[nombre].on('tileload', function () { errores = 0; });
  capas[nombre].on('tileerror', function () {
    if (!mapa.hasLayer(capas[nombre]) || ++errores < 4) return;
    errores = 0;
    mapa.removeLayer(capas[nombre]);
    capas[nombres[(i + 1) % nombres.length]].addTo(mapa);
  });
});
$marcador
</script>
</body></html>
""".trimIndent()
}
