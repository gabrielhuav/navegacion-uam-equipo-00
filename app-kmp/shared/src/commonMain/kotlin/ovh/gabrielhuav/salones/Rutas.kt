package ovh.gabrielhuav.salones

import kotlin.math.ceil

/**
 * Prototipo 3: rutas dentro del campus (por ahora sólo Azcapotzalco).
 * La red de caminos sale de `campus/rutas.json` (la dibuja Codex en el visor web; mismo archivo en Flutter):
 * nodos con su latitud y longitud, aristas con sus metros y un nodo por destino (edificios y accesos).
 */
data class Nodo(val id: String, val lugar: Ubicacion, val tipo: String)
data class Arista(val de: String, val a: String, val metros: Double)
data class Destino(val id: String, val nombre: String, val nodo: String)

/** Una ruta: los puntos por los que pasa (para dibujarla) y su longitud. */
data class Ruta(val puntos: List<Ubicacion>, val metros: Double) {
    /** A 1.2 m/s, el paso de una persona caminando. Al menos un minuto. */
    val minutos: Int get() = maxOf(1, ceil(metros / 1.2 / 60).toInt())
}

class Red(val nodos: Map<String, Nodo>, val aristas: List<Arista>, val destinos: List<Destino>) {
    private val vecinos: Map<String, List<Pair<String, Double>>> =
        aristas.flatMap { listOf(it.de to (it.a to it.metros), it.a to (it.de to it.metros)) }
            .groupBy({ it.first }, { it.second })

    /** El camino más corto entre dos nodos (algoritmo de Dijkstra). Null si no hay camino. */
    fun rutaMasCorta(desde: String, hasta: String): Ruta? {
        val distancia = mutableMapOf(desde to 0.0)
        val previo = mutableMapOf<String, String>()
        val pendientes = mutableSetOf(desde)
        val cerrados = mutableSetOf<String>()
        while (pendientes.isNotEmpty()) {
            val actual = pendientes.minBy { distancia.getValue(it) }
            if (actual == hasta) break
            pendientes.remove(actual)
            cerrados.add(actual)
            for ((vecino, metros) in vecinos[actual].orEmpty()) {
                if (vecino in cerrados) continue
                val nueva = distancia.getValue(actual) + metros
                if (nueva < (distancia[vecino] ?: Double.MAX_VALUE)) {
                    distancia[vecino] = nueva
                    previo[vecino] = actual
                    pendientes.add(vecino)
                }
            }
        }
        val total = distancia[hasta] ?: return null
        val camino = generateSequence(hasta) { previo[it] }.toList().reversed()
        return Ruta(camino.map { nodos.getValue(it).lugar }, total)
    }

    /** El nodo más cercano a un punto; con `tipo`, sólo de ese tipo (por ejemplo «acceso»). */
    fun masCercano(u: Ubicacion, tipo: String? = null): Nodo =
        nodos.values.filter { tipo == null || it.tipo == tipo }.minBy { distanciaMetros(u, it.lugar) }

    /**
     * Desde tu ubicación: si estás en el campus, la ruta empieza en el camino más cercano; si estás lejos
     * (a más de [lejos] metros del camino), empieza en el acceso más cercano. Devuelve la ruta y si se usó un acceso.
     */
    fun rutaDesde(yo: Ubicacion, hasta: Destino, lejos: Double = 150.0): Pair<Ruta, Boolean>? {
        val cerca = masCercano(yo)
        val porAcceso = distanciaMetros(yo, cerca.lugar) > lejos
        val inicio = if (porAcceso) masCercano(yo, "acceso") else cerca
        return rutaMasCorta(inicio.id, hasta.nodo)?.let { it to porAcceso }
    }
}

/** Lee rutas.json. Cada objeto de la red es plano (sin objetos dentro), así que basta con buscar sus claves. */
fun leerRed(json: String): Red {
    fun lista(clave: String): List<String> {
        val inicio = json.indexOf("\"$clave\"").takeIf { it >= 0 } ?: error("Falta $clave en rutas.json")
        val abre = json.indexOf('[', inicio)
        var nivel = 0
        var cierra = abre
        for (i in abre until json.length) {
            if (json[i] == '[') nivel++
            if (json[i] == ']' && --nivel == 0) { cierra = i; break }
        }
        return Regex("\\{[^{}]*\\}").findAll(json.substring(abre, cierra)).map { it.value }.toList()
    }
    fun texto(o: String, k: String) = Regex("\"$k\"\\s*:\\s*\"([^\"]*)\"").find(o)?.groupValues?.get(1) ?: error("Falta $k en $o")
    fun numero(o: String, k: String) = Regex("\"$k\"\\s*:\\s*(-?[\\d.]+)").find(o)?.groupValues?.get(1)?.toDouble() ?: error("Falta $k en $o")
    val nodos = lista("nodos").map { Nodo(texto(it, "id"), Ubicacion(numero(it, "lat"), numero(it, "lon")), texto(it, "tipo")) }
    return Red(
        nodos.associateBy { it.id },
        lista("aristas").map { Arista(texto(it, "de"), texto(it, "a"), numero(it, "metros")) },
        lista("destinos").map { Destino(texto(it, "id"), texto(it, "nombre"), texto(it, "nodo")) },
    )
}
