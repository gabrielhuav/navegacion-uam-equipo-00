package ovh.gabrielhuav.salones

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

/** Las cinco unidades: cuáles tienen croquis y qué dice el mensaje en cada una. */
class SedesTest {
    @Test
    fun azcapotzalcoCuajimalpaEIztapalapaTienenCroquis() {
        assertEquals(listOf("azcapotzalco", "cuajimalpa", "iztapalapa"), Unidad.entries.mapNotNull { it.carpeta })
        assertNull(Unidad.LERMA.carpeta)
        assertNull(Unidad.XOCHIMILCO.carpeta)
    }

    @Test
    fun enElCentroDeCadaUnidadDiceQueEstasAhi() {
        Unidad.entries.forEach { assertEquals("Estás en la UAM ${it.nombre}.", describir(it.centro, it)) }
    }

    @Test
    fun desdeAzcapotzalcoCuajimalpaQuedaLejos() {
        val texto = describir(UAM_AZCAPOTZALCO, Unidad.CUAJIMALPA)
        assertTrue(texto.startsWith("Estás a ") && texto.endsWith(" km de la UAM Cuajimalpa."), texto)
    }
}
