package ovh.gabrielhuav.salones

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

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
    fun elNorteDelModeloEsCasiMasZ() {
        // El plano está casi de cabeza en el mapa: su borde de abajo (+z) apunta al norte, girado unos 6°.
        val (x, z) = norteEnModelo(leerGeorreferencia(json))
        assertTrue(z > 0.98, "z = $z")
        assertTrue(x > 0.05 && x < 0.2, "x = $x")
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

/** Día o noche según la hora del teléfono. */
class IluminacionTest {
    @Test
    fun deSieteASieteEsDeDia() {
        assertEquals(false, esDeNoche(7))
        assertEquals(false, esDeNoche(13))
        assertEquals(false, esDeNoche(18))
    }

    @Test
    fun desdeLasDiecinueveYAntesDeLasSieteEsDeNoche() {
        assertEquals(true, esDeNoche(19))
        assertEquals(true, esDeNoche(23))
        assertEquals(true, esDeNoche(0))
        assertEquals(true, esDeNoche(6))
    }
}
