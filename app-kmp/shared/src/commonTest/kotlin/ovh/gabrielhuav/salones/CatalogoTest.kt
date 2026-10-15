package ovh.gabrielhuav.salones

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertNull

/**
 * Pruebas de commonTest: la misma lógica que usan Android e iOS.
 * Se usa `kotlin.test` porque JUnit no existe en iOS.
 * En la computadora se ejecutan con: ./gradlew :shared:testAndroidHostTest
 */
class CatalogoTest {

    @Test
    fun aceptaLaClaveComoVieneEnElHorario() {
        assertEquals("A-201", normalizarClave("A-201"))
        assertEquals("A-201", normalizarClave("a201"))
        assertEquals("A-201", normalizarClave(" a 201 "))
        assertEquals("A-201", normalizarClave("Salón A-201"))
        assertEquals("HO-201", normalizarClave("ho-201"))
    }

    @Test
    fun rechazaLoQueNoEsEdificioMasNumero() {
        assertNull(normalizarClave("201"))
        assertNull(normalizarClave("biblioteca"))
    }

    @Test
    fun encuentraUnSalonDelCatalogoDeEjemplo() {
        val resultado = assertIs<Resultado.Encontrado>(buscarSalon("g302"))
        assertEquals("G", resultado.salon.edificio)
        assertEquals(3, resultado.salon.piso)
    }

    @Test
    fun distingueClaveVaciaFormatoInvalidoYSalonInexistente() {
        assertIs<Resultado.SinClave>(buscarSalon("   "))
        assertIs<Resultado.FormatoInvalido>(buscarSalon("biblioteca"))
        assertEquals(Resultado.NoExiste("A-999"), buscarSalon("A-999"))
    }

    @Test
    fun elMensajeDiceEdificioYPisoOPorQueNoSeEncontro() {
        assertEquals("Edificio A · Piso 2", mensaje(buscarSalon("A-201")))
        assertEquals(
            "No encontré A-999 en el catálogo de ejemplo. Revisa la clave en tu horario.",
            mensaje(buscarSalon("A-999")),
        )
    }
}
