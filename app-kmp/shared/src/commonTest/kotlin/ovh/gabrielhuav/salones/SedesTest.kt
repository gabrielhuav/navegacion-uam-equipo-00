package ovh.gabrielhuav.salones

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

/** Las cinco unidades: cuáles tienen croquis y qué dice el mensaje en cada una. */
class SedesTest {
    @Test
    fun lasCincoUnidadesTienenCroquis() {
        assertEquals(
            listOf("azcapotzalco", "cuajimalpa", "iztapalapa", "lerma", "xochimilco"),
            Unidad.entries.map { it.carpeta },
        )
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
