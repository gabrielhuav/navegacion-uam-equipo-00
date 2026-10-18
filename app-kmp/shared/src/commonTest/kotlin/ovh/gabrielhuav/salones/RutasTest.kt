package ovh.gabrielhuav.salones

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

/** Rutas con una red pequeña: A—B—C en línea y un atajo largo A—C. */
class RutasTest {
    private val json = """
        {
          "version": 1,
          "nodos": [
            { "id": "A", "lat": 19.5000, "lon": -99.1900, "x": 0, "z": 0, "nivel": 0, "tipo": "acceso" },
            { "id": "B", "lat": 19.5010, "lon": -99.1900, "x": 0, "z": 0, "nivel": 0, "tipo": "cruce" },
            { "id": "C", "lat": 19.5020, "lon": -99.1900, "x": 0, "z": 0, "nivel": 0, "tipo": "entrada" },
            { "id": "D", "lat": 19.6000, "lon": -99.1900, "x": 0, "z": 0, "nivel": 0, "tipo": "entrada" }
          ],
          "aristas": [
            { "de": "A", "a": "B", "metros": 110, "tipo": "exterior", "accesible": true },
            { "de": "B", "a": "C", "metros": 110, "tipo": "exterior", "accesible": true },
            { "de": "A", "a": "C", "metros": 500, "tipo": "exterior", "accesible": true }
          ],
          "destinos": [ { "id": "C", "nombre": "Edificio C", "nodo": "C" } ]
        }
    """
    private val red = leerRed(json)

    @Test
    fun eligeElCaminoMasCorto() {
        val ruta = red.rutaMasCorta("A", "C")!!
        assertEquals(220.0, ruta.metros)
        assertEquals(3, ruta.puntos.size) // A, B y C: no el atajo de 500 m
        assertEquals(4, ruta.minutos)     // 220 m a 1.2 m/s ≈ 3.1 min → 4
    }

    @Test
    fun sinCaminoDevuelveNull() {
        assertNull(red.rutaMasCorta("A", "D"))
    }

    @Test
    fun desdeLejosEmpiezaEnElAccesoMasCercano() {
        val (ruta, porAcceso) = red.rutaDesde(Ubicacion(19.4900, -99.1900), red.destinos.first())!!
        assertTrue(porAcceso)
        assertEquals(Ubicacion(19.5000, -99.1900), ruta.puntos.first())
    }

    @Test
    fun leeDestinosYAristas() {
        assertEquals("Edificio C", red.destinos.single().nombre)
        assertEquals(3, red.aristas.size)
    }
}
