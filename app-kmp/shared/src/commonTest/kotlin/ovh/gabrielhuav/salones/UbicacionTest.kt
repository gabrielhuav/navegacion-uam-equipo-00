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
    fun laUrlDelMapaLlevaElMarcador() {
        assertTrue(urlMapa(UAM_AZCAPOTZALCO).endsWith("marker=19.50306,-99.18694"))
    }
}
