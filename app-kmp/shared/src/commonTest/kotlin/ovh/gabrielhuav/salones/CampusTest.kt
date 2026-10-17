package ovh.gabrielhuav.salones

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

/** La lectura de campus/georreferencia.json, la misma que hace Flutter. */
class CampusTest {
    private val json = """
        {
          "plano": "plano_2d.png",
          "ancho": 1560,
          "alto": 640,
          "superiorIzquierda": [19.5012133, -99.1833458],
          "superiorDerecha": [19.502099, -99.1916483],
          "inferiorIzquierda": [19.504424, -99.1829603]
        }
    """

    @Test
    fun leeElTamanoYLasTresEsquinas() {
        val geo = leerGeorreferencia(json)
        assertEquals(1560, geo.ancho)
        assertEquals(640, geo.alto)
        assertEquals(Ubicacion(19.5012133, -99.1833458), geo.superiorIzquierda)
        assertEquals(Ubicacion(19.502099, -99.1916483), geo.superiorDerecha)
        assertEquals(Ubicacion(19.504424, -99.1829603), geo.inferiorIzquierda)
    }

    @Test
    fun sinUnaEsquinaAvisaCualFalta() {
        val error = assertFailsWith<IllegalStateException> { leerGeorreferencia("""{"ancho": 1, "alto": 1}""") }
        assertEquals("Falta superiorIzquierda en georreferencia.json", error.message)
    }

    @Test
    fun elPlanoCaeSobreLaUam() {
        val geo = leerGeorreferencia(json)
        val centro = Ubicacion(
            (geo.superiorDerecha.latitud + geo.inferiorIzquierda.latitud) / 2,
            (geo.superiorDerecha.longitud + geo.inferiorIzquierda.longitud) / 2,
        )
        assertEquals("Estás en la UAM Azcapotzalco.", describir(centro))
    }
}
