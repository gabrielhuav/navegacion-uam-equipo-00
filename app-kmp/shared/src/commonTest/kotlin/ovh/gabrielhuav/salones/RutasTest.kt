package ovh.gabrielhuav.salones

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
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

    private val piloto = leerRed("""
        {
          "version": 1,
          "unidad": "azcapotzalco",
          "perimetro": [
            { "lat": 19.5000, "lon": -99.1910 }, { "lat": 19.5000, "lon": -99.1890 },
            { "lat": 19.5020, "lon": -99.1890 }, { "lat": 19.5020, "lon": -99.1910 }
          ],
          "nodos": [
            { "id": "A", "lat": 19.5000, "lon": -99.1900, "x": 0, "z": 0, "tipo": "acceso" },
            { "id": "B", "lat": 19.5010, "lon": -99.1900, "x": 0, "z": 100, "tipo": "cruce" },
            { "id": "C", "lat": 19.5010, "lon": -99.1899, "x": 10, "z": 100, "tipo": "entrada" },
            { "id": "D", "lat": 19.5020, "lon": -99.1890, "x": 100, "z": 200, "tipo": "acceso" },
            { "id": "V", "lat": 19.5019, "lon": -99.1890, "x": 100, "z": 190, "tipo": "acceso" }
          ],
          "aristas": [
            { "de": "A", "a": "B", "metros": 110, "tipo": "pasillo" },
            { "de": "B", "a": "C", "metros": 10, "tipo": "escalera" },
            { "de": "C", "a": "V", "metros": 135, "tipo": "exterior" }
          ],
          "destinos": [
            { "id": "ACCESO_P1", "nombre": "Acceso peatonal P1", "nodo": "A" },
            { "id": "ACCESO_P2", "nombre": "Acceso peatonal P2", "nodo": "D" },
            { "id": "ACCESO_V1", "nombre": "Acceso vehicular V1", "nodo": "V" },
            { "id": "C", "nombre": "Edificio C", "nodo": "C" },
            { "id": "C101", "nombre": "C101", "nodo": "C", "edificio": "C", "nivel": 1,
              "referencia": "Acceso por la plaza" }
          ]
        }
    """.trimIndent())
    private val salon = piloto.destinos.last()

    @Test
    fun desdeFueraSoloEmpiezaEnUnAccesoPeatonalConectado() {
        // Aunque hay dos nodos de acceso a menos de 20 m, uno no está conectado y el otro es vehicular.
        val (ruta, porAcceso) = piloto.rutaDesde(Ubicacion(19.50201, -99.1890), salon)!!
        assertTrue(porAcceso)
        assertEquals("ACCESO_P1", ruta.inicioAcceso)
        assertEquals(piloto.nodos.getValue("A").lugar, ruta.puntos.first())
        assertEquals(120.0, ruta.metros)
        assertTrue(ruta.incluyeEscaleras)
    }

    @Test
    fun reconoceElPasoPeatonalDePuertaDosComoOrigenExterior() {
        val destinos = piloto.destinos.map { destino ->
            if (destino.id == "ACCESO_P1") destino.copy(id = "ACCESO_PUERTA_2") else destino
        }
        val conPuertaDos = Red(piloto.nodos, piloto.aristas, destinos, piloto.perimetro)
        val (ruta, porAcceso) = conPuertaDos.rutaDesde(Ubicacion(19.49999, -99.1900), salon)!!
        assertTrue(porAcceso)
        assertEquals("ACCESO_PUERTA_2", ruta.inicioAcceso)
        assertEquals(piloto.nodos.getValue("A").lugar, ruta.puntos.first())
    }

    @Test
    fun proyectaAlAndadorYContinuaPorElExtremoQueAcortaElRecorrido() {
        val (ruta, porAcceso) = piloto.rutaDesde(Ubicacion(19.50025, -99.19002), salon)!!
        assertFalse(porAcceso)
        assertEquals(Ubicacion(19.50025, -99.1900), ruta.puntos.first())
        assertEquals(piloto.nodos.getValue("B").lugar, ruta.puntos[1])
        assertEquals(92.5, ruta.metros, 1e-6)
        assertEquals(0.0, ruta.enModelo.first().first, 1e-9)
        assertEquals(25.0, ruta.enModelo.first().second, 1e-6)
        assertTrue(ruta.incluyeEscaleras)
    }

    @Test
    fun exigeUnOrigenManualCuandoNoHayAndadorCercano() {
        val origen = Ubicacion(19.50025, -99.1908)
        assertEquals(true, piloto.ubicacionDentroDelPerimetro(origen))
        assertNull(piloto.rutaDesde(origen, salon))
        assertNull(red.ubicacionDentroDelPerimetro(origen))
    }

    @Test
    fun leePisoYReferenciaSinModificarLaLlegadaNiColocarUnTramoInterior() {
        assertEquals("C", salon.edificio)
        assertEquals(1, salon.nivel)
        assertEquals("Acceso por la plaza", salon.referencia)
        val llegada = piloto.rutaMasCorta("A", salon.nodo)!!
        assertEquals(piloto.nodos.getValue("C").lugar, llegada.puntos.last())
        assertTrue(piloto.rutaMasCorta("C", "A")!!.incluyeEscaleras)
        assertFalse(piloto.rutaMasCorta("A", "B")!!.incluyeEscaleras)
    }
}
