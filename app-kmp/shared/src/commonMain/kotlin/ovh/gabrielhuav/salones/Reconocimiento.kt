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

/** Las fotos no se empaquetan: cada opción carga únicamente su galería numérica. */
enum class CorpusReconocimiento(val id: String, val titulo: String) {
    ACTUAL("actual", "Actual (0.5.0)"),
    MAESTRO("maestro", "Maestro confirmado"),
    COMBINADO("combinado", "Combinado experimental");

    fun archivo(reconocedor: Reconocedor): String = if (this == ACTUAL)
        "reconocimiento/${reconocedor.prefijo}_galeria.json"
    else "reconocimiento/corpus/$id/${reconocedor.prefijo}.json"

    companion object {
        fun desdeId(id: String?): CorpusReconocimiento = entries.firstOrNull { it.id == id } ?: ACTUAL
    }
}

enum class AgrupacionReferencias { PROTOTIPOS, FOTOS }

/** Estadísticos ajustados sólo con referencias de entrenamiento; los prototipos ya están transformados. */
class TransformacionConsulta(private val media: FloatArray, private val escala: FloatArray) {
    init {
        require(media.isNotEmpty() && media.size == escala.size)
        require(media.all { it.isFinite() } && escala.all { it.isFinite() && it > 0 })
    }

    fun aplicar(vector: FloatArray): FloatArray {
        require(vector.size == media.size)
        val norma = sqrt(vector.fold(0f) { s, x -> s + x * x })
        require(norma.isFinite() && norma > 1e-8f)
        val resultado = FloatArray(vector.size) { (vector[it] / norma - media[it]) * escala[it] }
        val nuevaNorma = sqrt(resultado.fold(0f) { s, x -> s + x * x })
        require(nuevaNorma.isFinite() && nuevaNorma > 1e-8f)
        return FloatArray(vector.size) { resultado[it] / nuevaNorma }
    }
}

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
    private val agrupacion: AgrupacionReferencias = AgrupacionReferencias.PROTOTIPOS,
    private val identificadoresFoto: Map<String, List<String>> = emptyMap(),
    private val k: Int = 3,
    val vistasConsulta: Int = 1,
    private val transformacion: TransformacionConsulta? = null,
    private val margenGeneral: Float = 0f,
    private val margenes: Map<String, Float> = emptyMap(),
) {
    init {
        require(clases.isNotEmpty() && clases.distinct().size == clases.size)
        require(k > 0 && vistasConsulta in listOf(1, 3))
        require(umbralGeneral.isFinite() && umbrales.values.all { it.isFinite() })
        require(margenGeneral.isFinite() && margenGeneral >= 0 && margenes.values.all { it.isFinite() && it >= 0 })
        val dimensiones = prototipos.values.flatten().map { it.size }.distinct()
        require(dimensiones.size == 1 && dimensiones.first() > 0)
        require(prototipos.values.flatten().all { p -> p.all { it.isFinite() } })
        if (agrupacion == AgrupacionReferencias.FOTOS) {
            require(clases.all { identificadoresFoto[it]?.size == prototipos[it].orEmpty().size })
            require(identificadoresFoto.values.flatten().all { it.isNotBlank() })
            val clasesPorFoto = mutableMapOf<String, String>()
            for (c in clases) for (id in identificadoresFoto[c].orEmpty()) {
                require(clasesPorFoto.put(id, c).let { it == null || it == c })
            }
        }
    }

    /** Similitud mínima para responder esa clase; por debajo, «no sé». No es un porcentaje de certeza. */
    fun umbral(clase: String): Float = umbrales[clase] ?: umbralGeneral

    /** Un voto por prototipo en la actual, o por foto independiente en las candidatas que lo declaran. */
    fun puntajes(vector: FloatArray): FloatArray {
        val consulta = transformacion?.aplicar(vector) ?: vector
        val norma = if (transformacion == null) sqrt(consulta.fold(0f) { s, x -> s + x * x }) else 1f
        if (!norma.isFinite() || norma <= 1e-6f) return FloatArray(clases.size)
        return FloatArray(clases.size) { k ->
            val clase = clases[k]
            val similares = prototipos[clase].orEmpty().map { p ->
                require(p.size == consulta.size)
                var s = 0f
                for (i in p.indices) s += p[i] * consulta[i]
                s / norma
            }
            val votos = if (agrupacion == AgrupacionReferencias.PROTOTIPOS) similares else {
                val fotos = mutableMapOf<String, Float>()
                similares.forEachIndexed { i, s ->
                    val id = identificadoresFoto.getValue(clase)[i]
                    fotos[id] = maxOf(fotos[id] ?: Float.NEGATIVE_INFINITY, s)
                }
                fotos.values.toList()
            }
            if (votos.isEmpty()) -1f else votos.sortedDescending().take(this.k).average().toFloat()
        }
    }

    /** Las vistas de una misma consulta se promedian antes de votar cuadros, sin multiplicar sus votos. */
    fun puntajes(vectores: List<FloatArray>): FloatArray {
        require(vectores.size == vistasConsulta)
        val vistas = vectores.map(::puntajes)
        return FloatArray(clases.size) { c -> vistas.map { it[c] }.average().toFloat() }
    }

    fun aceptada(puntajes: FloatArray): Int? {
        require(puntajes.size == clases.size)
        if (puntajes.any { !it.isFinite() }) return null
        val mejor = puntajes.indices.maxBy { puntajes[it] }
        val clase = clases[mejor]
        val segundo = puntajes.indices.filter { it != mejor }.maxOfOrNull { puntajes[it] } ?: -1f
        return mejor.takeIf {
            clase in destinos && puntajes[mejor] >= umbral(clase) &&
                puntajes[mejor] - segundo >= (margenes[clase] ?: margenGeneral)
        }
    }
}

/** Promedia los puntajes de los últimos [cuadros] cuadros; responde sólo si la mejor clase supera el umbral. */
class Votacion(private val galeria: Galeria, private val cuadros: Int = 7) {
    private val recientes = ArrayDeque<FloatArray>()

    fun agregar(puntajes: FloatArray) {
        require(puntajes.size == galeria.clases.size)
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
        val media = FloatArray(galeria.clases.size) { k -> recientes.map { it[k] }.average().toFloat() }
        val k = galeria.aceptada(media) ?: return null
        val clase = galeria.clases[k]
        return Reconocido(clase, galeria.destinos.getValue(clase), media[k], momento)
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
