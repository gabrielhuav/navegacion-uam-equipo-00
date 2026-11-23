package ovh.gabrielhuav.salones

import kotlin.math.sqrt
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNotNull
import kotlin.test.assertNull

class GaleriaCorpusTest {
    private val x = floatArrayOf(1f, 0f)
    private val y = floatArrayOf(0f, 1f)

    @Test
    fun laOpcionInicialConservaLosArchivosOriginalesDeCadaCampus() {
        assertEquals(CorpusReconocimiento.ACTUAL, CorpusReconocimiento.desdeId(null))
        assertEquals(CorpusReconocimiento.ACTUAL, CorpusReconocimiento.desdeId("opcion_antigua"))
        assertEquals("reconocimiento/escom_galeria.json", CorpusReconocimiento.ACTUAL.archivo(reconocedorDe(Unidad.ESCOM)!!))
        assertEquals("reconocimiento/corpus/maestro/uam_azcapotzalco.json", CorpusReconocimiento.MAESTRO.archivo(reconocedorDe(Unidad.AZCAPOTZALCO)!!))
    }

    @Test
    fun laGaleriaActualSiguePromediandoTresPrototipos() {
        val g = Galeria(listOf("T"), mapOf("T" to listOf(x, x, y)), mapOf("T" to "T"), .74f)
        assertEquals(2f / 3, g.puntajes(floatArrayOf(4f, 0f))[0], 1e-6f)
        assertEquals(1, g.vistasConsulta)
    }

    @Test
    fun tresRecortesDeUnaFotoNoDesplazanOtrasFotosDelTopK() {
        val refs = mapOf("T" to listOf(x, x, x, y, y, y))
        val ids = mapOf("T" to listOf("foto_a", "foto_a", "foto_a", "foto_b", "foto_b", "foto_b"))
        val g = Galeria(listOf("T"), refs, mapOf("T" to "T"), .74f,
            agrupacion = AgrupacionReferencias.FOTOS, identificadoresFoto = ids, k = 2)
        assertEquals(.5f, g.puntajes(x)[0], 1e-6f)
        assertNull(g.aceptada(g.puntajes(x)))
    }

    @Test
    fun laTransformacionNormalizaAntesDeRestarLaMedia() {
        val t = TransformacionConsulta(floatArrayOf(.5f, 0f), floatArrayOf(2f, 1f))
        // unit(0, 10) -> (-1, 1) -> unit(-1, 1).
        val g = Galeria(listOf("T"), mapOf("T" to listOf(floatArrayOf(-1f / sqrt(2f), 1f / sqrt(2f)))),
            mapOf("T" to "T"), .74f, transformacion = t)
        assertEquals(1f, g.puntajes(floatArrayOf(0f, 10f))[0], 1e-6f)
    }

    @Test
    fun lasVistasPromedianPuntajesSinPromediarEmbeddings() {
        val g = Galeria(listOf("T"), mapOf("T" to listOf(x)), mapOf("T" to "T"), .74f, vistasConsulta = 3)
        assertEquals(1f / 3, g.puntajes(listOf(x, y, y))[0], 1e-6f)
        assertFailsWith<IllegalArgumentException> { g.puntajes(listOf(x)) }
    }

    @Test
    fun elMargenRechazaUnaFachadaAmbiguaAunqueSupereElUmbral() {
        val g = Galeria(listOf("T", "I"), mapOf("T" to listOf(x), "I" to listOf(y)), mapOf("T" to "T", "I" to "I"),
            .74f, margenGeneral = .03f)
        val v = Votacion(g, cuadros = 2)
        v.agregar(floatArrayOf(.81f, .80f))
        v.agregar(floatArrayOf(.83f, .80f))
        assertNull(v.resultado(1))
        v.agregar(floatArrayOf(.92f, .70f))
        assertEquals("T", assertNotNull(v.resultado(2)).clase)
    }

    @Test
    fun unaClaseSinRutaSigueCompitiendoYNoActivaLaSegunda() {
        val g = Galeria(listOf("otro", "T"), mapOf("otro" to listOf(x), "T" to listOf(y)), mapOf("T" to "T"), .74f)
        assertNull(g.aceptada(floatArrayOf(.95f, .90f)))
    }

    @Test
    fun elUmbralDosDeshabilitaUnaClaseSinEliminarSuCompetencia() {
        val g = Galeria(listOf("T", "I"), mapOf("T" to listOf(x), "I" to listOf(y)), mapOf("T" to "T", "I" to "I"),
            2f, umbrales = mapOf("I" to .8f))
        assertNull(g.aceptada(floatArrayOf(.99f, .91f)))
        assertEquals(1, g.aceptada(floatArrayOf(.91f, .99f)))
    }

    @Test
    fun laIdentidadDeUnaFotoNoPuedeTenerDosClases() {
        assertFailsWith<IllegalArgumentException> {
            Galeria(listOf("T", "I"), mapOf("T" to listOf(x), "I" to listOf(y)), emptyMap(), .8f,
                agrupacion = AgrupacionReferencias.FOTOS, identificadoresFoto = mapOf("T" to listOf("misma"), "I" to listOf("misma")))
        }
    }

}
