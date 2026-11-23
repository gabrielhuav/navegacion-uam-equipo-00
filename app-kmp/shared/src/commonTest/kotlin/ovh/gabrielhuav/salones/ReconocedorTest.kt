package ovh.gabrielhuav.salones

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class ReconocedorTest {
    @Test
    fun cadaCampusTieneSuObjetivo() {
        assertEquals("laboratorios", reconocedorDe(Unidad.ESCOM)?.objetivo)
        assertEquals("T", reconocedorDe(Unidad.AZCAPOTZALCO)?.objetivo)
    }

    @Test
    fun lasUnidadesSinGaleriaNoReconocen() {
        listOf(Unidad.CUAJIMALPA, Unidad.IZTAPALAPA, Unidad.LERMA, Unidad.XOCHIMILCO).forEach { assertNull(reconocedorDe(it)) }
    }

    @Test
    fun laMascotaDependeDeLaSede() {
        assertEquals("burrito.png", mascotaDe(Unidad.ESCOM))
        assertEquals("uamito_azcapotzalco.png", mascotaDe(Unidad.AZCAPOTZALCO))
        assertEquals("uamito_iztapalapa.png", mascotaDe(Unidad.IZTAPALAPA))
    }
}
