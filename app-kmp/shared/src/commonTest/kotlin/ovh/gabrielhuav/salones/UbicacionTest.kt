package ovh.gabrielhuav.salones

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

/** Pruebas de la parte que no depende del teléfono. Tarea: `:shared:testAndroidHostTest`. */
class UbicacionTest {
    @Test
    fun enElCentroDeLaUamDiceQueEstasEnLaUam() {
        assertEquals("Estás en la UAM Azcapotzalco.", describir(UAM_AZCAPOTZALCO))
    }

    @Test
    fun lejosDeLaUamDiceAcuantosKilometrosQueda() {
        val zocalo = Ubicacion(19.4326, -99.1332)
        assertTrue(describir(zocalo).startsWith("Estás a "))
        assertTrue(describir(zocalo).endsWith(" km de la UAM."))
    }

    @Test
    fun laUamCaeEnSuTeselaDelZoom17() {
        val (x, y) = posicionEnTeselas(UAM_AZCAPOTZALCO)
        assertEquals(29423, x.toInt())
        assertEquals(58293, y.toInt())
    }

    @Test
    fun laDireccionDeLaTeselaLlevaZoomXyY() {
        assertEquals(
            "https://tile.openstreetmap.org/17/1/2.png",
            urlTesela(PROVEEDORES.last(), x = 1, y = 2),
        )
    }
}
