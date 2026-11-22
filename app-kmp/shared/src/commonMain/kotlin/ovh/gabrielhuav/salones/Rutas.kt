package ovh.gabrielhuav.salones

import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.cos

/**
 * Prototipo 3: rutas dentro del campus (por ahora sólo Azcapotzalco).
 * La red de caminos sale de `campus/rutas.json` (la dibuja Codex en el visor web; mismo archivo en Flutter):
 * nodos con su latitud y longitud, aristas con sus metros y un nodo por destino (edificios y accesos).
 */
data class Nodo(val id: String, val lugar: Ubicacion, val tipo: String, val x: Double? = null, val z: Double? = null)
data class Arista(val de: String, val a: String, val metros: Double, val tipo: String = "exterior")
data class Destino(
    val id: String,
    val nombre: String,
    val nodo: String,
    val edificio: String? = null,
    val nivel: Int? = null,
    val referencia: String? = null,
)

/**
 * Una ruta: los puntos por los que pasa (para dibujarla) y su longitud.
 * `enModelo`: los mismos puntos en metros X/Z del modelo 3D (si rutas.json los trae), para dibujarla en 3D.
 */
data class Ruta(
    val puntos: List<Ubicacion>,
    val metros: Double,
    val enModelo: List<Pair<Double, Double>> = emptyList(),
    val inicioAcceso: String? = null,
    val incluyeEscaleras: Boolean = false,
) {
    /** A 1.2 m/s, el paso de una persona caminando. Al menos un minuto. */
    val minutos: Int get() = maxOf(1, ceil(metros / 1.2 / 60).toInt())
}

class Red(
    val nodos: Map<String, Nodo>,
    val aristas: List<Arista>,
    val destinos: List<Destino>,
    val perimetro: List<Ubicacion> = emptyList(),
) {
    private data class Paso(val nodo: String, val arista: Arista)

    private val vecinos: Map<String, List<Paso>> = aristas
        .flatMap { listOf(it.de to Paso(it.a, it), it.a to Paso(it.de, it)) }
        .groupBy({ it.first }, { it.second })

    /** El camino más corto entre dos nodos (algoritmo de Dijkstra). Null si no hay camino. */
    fun rutaMasCorta(desde: String, hasta: String): Ruta? {
        if (desde !in nodos || hasta !in nodos) return null
        val distancia = mutableMapOf(desde to 0.0)
        val previo = mutableMapOf<String, Paso>()
        val pendientes = mutableSetOf(desde)
        val cerrados = mutableSetOf<String>()
        while (pendientes.isNotEmpty()) {
            val actual = pendientes.minBy { distancia.getValue(it) }
            if (actual == hasta) break
            pendientes.remove(actual)
            cerrados.add(actual)
            for ((vecino, arista) in vecinos[actual].orEmpty()) {
                if (vecino in cerrados) continue
                val nueva = distancia.getValue(actual) + arista.metros
                if (nueva < (distancia[vecino] ?: Double.MAX_VALUE)) {
                    distancia[vecino] = nueva
                    previo[vecino] = Paso(actual, arista)
                    pendientes.add(vecino)
                }
            }
        }
        val total = distancia[hasta] ?: return null
        val camino = generateSequence(hasta) { previo[it]?.nodo }.toList().reversed()
        val enCamino = camino.map { nodos.getValue(it) }
        val enModelo = enCamino.mapNotNull { it.enModelo() }
        return Ruta(
            enCamino.map { it.lugar }, total,
            if (enModelo.size == enCamino.size) enModelo else emptyList(),
            incluyeEscaleras = camino.any { previo[it]?.arista?.tipo == "escalera" },
        )
    }

    /** El nodo más cercano a un punto; con `tipo`, sólo de ese tipo (por ejemplo «acceso»). */
    fun masCercano(u: Ubicacion, tipo: String? = null): Nodo =
        nodos.values.filter { tipo == null || it.tipo == tipo }.minBy { distanciaMetros(u, it.lugar) }

    /** Null si falta el perímetro o la ubicación no es válida. */
    fun ubicacionDentroDelPerimetro(yo: Ubicacion): Boolean? =
        if (perimetro.isEmpty() || !yo.esValida()) null else estaDentro(yo, perimetro)

    /**
     * Con perímetro, se inicia en un andador cercano o, desde fuera, en un acceso peatonal.
     * Para redes anteriores, [lejos] conserva el umbral por distancia al nodo.
     * Devuelve la ruta y si se usó un acceso en lugar de la ubicación.
     */
    fun rutaDesde(yo: Ubicacion, hasta: Destino, lejos: Double = 150.0): Pair<Ruta, Boolean>? {
        if (!yo.esValida() || nodos.isEmpty()) return null
        when (ubicacionDentroDelPerimetro(yo)) {
            true -> return rutaDesdeTramo(yo, hasta.nodo)?.let { it to false }
            false -> return rutaDesdeAcceso(yo, hasta.nodo)?.let { it to true }
            null -> Unit
        }
        val cerca = masCercano(yo)
        val porAcceso = distanciaMetros(yo, cerca.lugar) > lejos
        val inicio = if (porAcceso) {
            nodos.values.filter { it.tipo == "acceso" }
                .minByOrNull { distanciaMetros(yo, it.lugar) } ?: return null
        } else cerca
        val acceso = if (porAcceso) destinos.firstOrNull { it.nodo == inicio.id && it.edificio == null } else null
        return rutaMasCorta(inicio.id, hasta.nodo)?.copy(inicioAcceso = acceso?.id)?.let { it to porAcceso }
    }

    private fun rutaDesdeAcceso(yo: Ubicacion, hasta: String): Ruta? = destinos
        .asSequence()
        .filter { it.id in ACCESOS_PEATONALES_AZC && nodos[it.nodo]?.tipo == "acceso" }
        .sortedBy { distanciaMetros(yo, nodos.getValue(it.nodo).lugar) }
        .firstNotNullOfOrNull { acceso ->
            rutaMasCorta(acceso.nodo, hasta)?.copy(inicioAcceso = acceso.id)
        }

    private data class Proyeccion(val arista: Arista, val fraccion: Double, val lugar: Ubicacion, val distancia: Double)

    private fun rutaDesdeTramo(yo: Ubicacion, hasta: String): Ruta? {
        // Escaleras y elevadores requieren información de altura para servir de punto de partida.
        val escalaLon = cos(yo.latitud * PI / 180)
        val proyeccion = aristas.asSequence()
            .filter { it.tipo in TRAMOS_DE_ORIGEN }
            .mapNotNull { arista ->
                val a = nodos.getValue(arista.de).lugar
                val b = nodos.getValue(arista.a).lugar
                val dx = (b.longitud - a.longitud) * escalaLon
                val dy = b.latitud - a.latitud
                val cuadrado = dx * dx + dy * dy
                if (cuadrado == 0.0) return@mapNotNull null
                val x = (yo.longitud - a.longitud) * escalaLon
                val y = yo.latitud - a.latitud
                val t = ((x * dx + y * dy) / cuadrado).coerceIn(0.0, 1.0)
                val punto = Ubicacion(interpolar(a.latitud, b.latitud, t), interpolar(a.longitud, b.longitud, t))
                Proyeccion(arista, t, punto, distanciaMetros(yo, punto))
            }
            .minByOrNull { it.distancia }
            ?.takeIf { it.distancia <= DISTANCIA_MAXIMA_AL_ANDADOR } ?: return null
        val (arista, t, punto) = proyeccion
        val a = nodos.getValue(arista.de)
        val b = nodos.getValue(arista.a)
        val (ruta, fraccionAdicional) = listOf(a to t, b to (1 - t))
            .mapNotNull { (nod, fraccion) -> rutaMasCorta(nod.id, hasta)?.let { it to fraccion } }
            .minByOrNull { (ruta, fraccion) -> ruta.metros + arista.metros * fraccion } ?: return null
        if (fraccionAdicional == 0.0) return ruta

        val inicioModelo = a.enModelo()?.let { (x, z) ->
            b.enModelo()?.let { (bx, bz) -> interpolar(x, bx, t) to interpolar(z, bz, t) }
        }
        return ruta.copy(
            puntos = listOf(punto) + ruta.puntos,
            metros = ruta.metros + arista.metros * fraccionAdicional,
            enModelo = if (inicioModelo != null && ruta.enModelo.isNotEmpty()) {
                listOf(inicioModelo) + ruta.enModelo
            } else emptyList(),
        )
    }
}

private val ACCESOS_PEATONALES_AZC = setOf("ACCESO_PUERTA_2", "ACCESO_P1", "ACCESO_P2", "ACCESO_P3")
private val TRAMOS_DE_ORIGEN = setOf("exterior", "pasillo", "rampa")
private const val DISTANCIA_MAXIMA_AL_ANDADOR = 20.0

private fun Ubicacion.esValida() = latitud in -90.0..90.0 && longitud in -180.0..180.0

private fun Nodo.enModelo() = x?.let { x -> z?.let { z -> x to z } }

private fun interpolar(a: Double, b: Double, t: Double) = a + (b - a) * t

/** Cruces del rayo hacia el este; un punto sobre el borde cuenta como interior. */
private fun estaDentro(punto: Ubicacion, poligono: List<Ubicacion>): Boolean {
    var dentro = false
    for (i in poligono.indices) {
        val a = poligono[i]
        val b = poligono[(i + 1) % poligono.size]
        val dx = b.longitud - a.longitud
        val dy = b.latitud - a.latitud
        val x = punto.longitud - a.longitud
        val y = punto.latitud - a.latitud
        val escala = maxOf(abs(dx), abs(dy))
        if (escala > 0 && abs(dx * y - dy * x) / escala < 1e-8 &&
            punto.longitud in minOf(a.longitud, b.longitud)..maxOf(a.longitud, b.longitud) &&
            punto.latitud in minOf(a.latitud, b.latitud)..maxOf(a.latitud, b.latitud)
        ) return true
        if ((a.latitud > punto.latitud) != (b.latitud > punto.latitud) && x < dx * y / dy) dentro = !dentro
    }
    return dentro
}

/** Lee rutas.json. Cada objeto de la red es plano (sin objetos dentro), así que basta con buscar sus claves. */
fun leerRed(json: String): Red {
    fun lista(clave: String, requerida: Boolean = true): List<String> {
        val inicio = json.indexOf("\"$clave\"")
        if (inicio < 0 && !requerida) return emptyList()
        require(inicio >= 0) { "Falta $clave en rutas.json" }
        val abre = json.indexOf('[', inicio)
        var nivel = 0
        var cierra = abre
        for (i in abre until json.length) {
            if (json[i] == '[') nivel++
            if (json[i] == ']' && --nivel == 0) { cierra = i; break }
        }
        return Regex("\\{[^{}]*\\}").findAll(json.substring(abre, cierra)).map { it.value }.toList()
    }
    fun textoOpcional(o: String, k: String) = Regex("\"$k\"\\s*:\\s*\"([^\"]*)\"").find(o)?.groupValues?.get(1)
    fun texto(o: String, k: String) = textoOpcional(o, k) ?: error("Falta $k en $o")
    fun numero(o: String, k: String) = Regex("\"$k\"\\s*:\\s*(-?[\\d.]+)").find(o)?.groupValues?.get(1)?.toDouble() ?: error("Falta $k en $o")
    fun opcional(o: String, k: String) = Regex("\"$k\"\\s*:\\s*(-?[\\d.]+)").find(o)?.groupValues?.get(1)?.toDouble()
    val nodos = lista("nodos").map {
        Nodo(texto(it, "id"), Ubicacion(numero(it, "lat"), numero(it, "lon")), texto(it, "tipo"), opcional(it, "x"), opcional(it, "z"))
    }
    return Red(
        nodos.associateBy { it.id },
        lista("aristas").map { Arista(texto(it, "de"), texto(it, "a"), numero(it, "metros"), textoOpcional(it, "tipo") ?: "exterior") },
        lista("destinos").map {
            Destino(texto(it, "id"), texto(it, "nombre"), texto(it, "nodo"),
                textoOpcional(it, "edificio"), opcional(it, "nivel")?.toInt(), textoOpcional(it, "referencia"))
        },
        lista("perimetro", requerida = false).map { Ubicacion(numero(it, "lat"), numero(it, "lon")) }
            .also { require(it.isEmpty() || it.size >= 3) { "Perímetro incompleto en rutas.json" } },
    )
}
