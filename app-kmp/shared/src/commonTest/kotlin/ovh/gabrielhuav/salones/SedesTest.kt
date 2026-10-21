package ovh.gabrielhuav.salones

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

/** Las cinco unidades y la ESCOM: cuáles tienen croquis y qué dice el mensaje en cada una. */
class SedesTest {
    @Test
    fun lasCincoUnidadesYLaEscomTienenCroquis() {
        assertEquals(
            listOf("azcapotzalco", "cuajimalpa", "iztapalapa", "lerma", "xochimilco", "escom"),
            Unidad.entries.map { it.carpeta },
        )
    }

    @Test
    fun enElCentroDeCadaUnidadDiceQueEstasAhi() {
        Unidad.entries.forEach { assertEquals("Estás en ${it.titulo}.", describir(it.centro, it)) }
    }

    @Test
    fun desdeAzcapotzalcoCuajimalpaQuedaLejos() {
        val texto = describir(UAM_AZCAPOTZALCO, Unidad.CUAJIMALPA)
        assertTrue(texto.startsWith("Estás a ") && texto.endsWith(" km de la UAM Cuajimalpa."), texto)
    }

    @Test
    fun laEscomEsDelIpnNoDeLaUam() {
        assertEquals("Estás en la ESCOM (IPN).", describir(Unidad.ESCOM.centro, Unidad.ESCOM))
        assertEquals("Estás en la UAM Lerma.", describir(Unidad.LERMA.centro, Unidad.LERMA))
    }
}
