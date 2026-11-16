package ovh.gabrielhuav.salones

import android.content.res.AssetManager
import org.json.JSONObject

/** Lee únicamente datos numéricos. La galería original conserva sus extras y umbrales históricos. */
internal fun cargarGaleria(
    assets: AssetManager,
    reconocedor: Reconocedor,
    corpus: CorpusReconocimiento,
    extras: JSONObject,
): Galeria {
    val json = JSONObject(assets.open(corpus.archivo(reconocedor)).use { it.readBytes().decodeToString() })
    val clases = json.getJSONArray("clases").let { a -> List(a.length()) { a.getString(it) } }
    val p = json.getJSONObject("prototipos")
    val prototipos = clases.associateWith { c ->
        val lista = p.getJSONArray(c)
        List(lista.length()) { i -> lista.getJSONArray(i).let { a ->
            require(a.length() == 960) { "Dimensión de referencia incompatible" }
            FloatArray(a.length()) { a.getDouble(it).toFloat() }
        } }
    }
    val d = json.optJSONObject("destinos") ?: json.getJSONObject("destinos_escom")
    val destinos = clases.filter { d.has(it) }.associateWith { d.getString(it) }
    val configuracion = if (corpus == CorpusReconocimiento.ACTUAL) null else json.getJSONObject("configuracion")
    if (configuracion == null) {
        val umbrales = if (extras.isNull("umbral_objetivo")) emptyMap() else
            mapOf(reconocedor.objetivo to extras.getDouble("umbral_objetivo").toFloat())
        return Galeria(clases, prototipos, destinos, json.getDouble("umbral_no_se").toFloat(), umbrales)
    }
    // Las etiquetas nuevas no crean automáticamente destinos: sólo se admiten los IDs del mapa del campus.
    val carpeta = if (reconocedor.prefijo == "escom") "escom" else "azcapotzalco"
    val idsDestino = leerRed(assets.open("campus/$carpeta/rutas.json").use { it.readBytes().decodeToString() })
        .destinos.map { it.id }.toSet()
    require(destinos.values.all { it in idsDestino }) { "Destino ajeno al mapa del campus" }
    val fotos = json.optJSONObject("identificadores_foto")?.let { ids ->
        clases.associateWith { c -> ids.getJSONArray(c).let { a -> List(a.length()) { a.getString(it) } } }
    }.orEmpty()
    val agrupacion = when (configuracion.getString("pooling")) {
        "prototipos" -> AgrupacionReferencias.PROTOTIPOS
        "fotos" -> AgrupacionReferencias.FOTOS
        else -> error("Agrupación de referencias desconocida")
    }
    val transformacion = configuracion.optJSONObject("transformacion")?.let { t ->
        val media = t.optJSONArray("media")
        val escala = t.optJSONArray("escala")
        if (media == null && escala == null) null else {
            require(media != null && escala != null && media.length() == 960 && escala.length() == 960)
            TransformacionConsulta(FloatArray(960) { media.getDouble(it).toFloat() }, FloatArray(960) { escala.getDouble(it).toFloat() })
        }
    }
    fun mapaNumerico(nombre: String): Map<String, Float> = configuracion.optJSONObject(nombre)?.let { m ->
        m.keys().asSequence().associateWith { m.getDouble(it).toFloat() }
    }.orEmpty()
    return Galeria(
        clases, prototipos, destinos,
        configuracion.optDouble("umbral", json.getDouble("umbral_no_se")).toFloat(),
        mapaNumerico("umbrales"), agrupacion, fotos,
        configuracion.getInt("k"), configuracion.getInt("vistas_query"), transformacion,
        configuracion.optDouble("margen", 0.0).toFloat(), mapaNumerico("margenes"),
    )
}
