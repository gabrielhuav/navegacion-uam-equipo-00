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
    fun laPaginaCentraElMapaYOfreceVariosProveedores() {
        val pagina = paginaMapa(UAM_AZCAPOTZALCO, conMarcador = true)
        assertTrue(pagina.contains("setView([19.50306, -99.18694], 17)"))
        PROVEEDORES.forEach { assertTrue(pagina.contains("'${it.nombre}'")) }
        assertTrue(pagina.contains("circleMarker"))
    }

    @Test
    fun sinUbicacionNoHayMarcador() {
        assertTrue(!paginaMapa(UAM_AZCAPOTZALCO, conMarcador = false).contains("circleMarker"))
    }
}
