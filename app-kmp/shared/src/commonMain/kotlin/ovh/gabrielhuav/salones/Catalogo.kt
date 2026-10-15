package ovh.gabrielhuav.salones

/** Un salón del catálogo: clave como "A-201", edificio y piso. */
data class Salon(val clave: String, val edificio: String, val piso: Int)

/**
 * Datos de EJEMPLO del Prototipo 1. No son el catálogo oficial de la UAM:
 * en el Prototipo 2 se sustituyen por el catálogo del repositorio común.
 */
val catalogoDeEjemplo: List<Salon> = listOf(
    Salon("A-105", "A", 1),
    Salon("A-201", "A", 2),
    Salon("G-302", "G", 3),
    Salon("H-108", "H", 1),
)

/** Resultado de buscar lo que escribió el usuario. */
sealed interface Resultado {
    /** La clave existe en el catálogo. */
    data class Encontrado(val salon: Salon) : Resultado

    /** El usuario no escribió nada. */
    data object SinClave : Resultado

    /** Lo escrito no tiene la forma edificio + número. */
    data class FormatoInvalido(val texto: String) : Resultado

    /** La clave tiene buena forma, pero no está en el catálogo. */
    data class NoExiste(val clave: String) : Resultado
}

private val formatoClave = Regex("^([A-Z]{1,3})(\\d{1,4})$")

/**
 * Convierte la clave como viene en el horario a la forma del catálogo:
 * "a201", " a 201 " o "Salón A-201" se vuelven "A-201".
 * Devuelve null si el texto no tiene la forma edificio + número.
 */
fun normalizarClave(texto: String): String? {
    val compacto = texto.uppercase()
        .replace(Regex("^\\s*SAL[OÓ]N"), "")
        .replace(Regex("[\\s\\-_.]"), "")
    val partes = formatoClave.matchEntire(compacto) ?: return null
    return "${partes.groupValues[1]}-${partes.groupValues[2]}"
}

/** Busca en [catalogo] el salón que escribió el usuario. */
fun buscarSalon(texto: String, catalogo: List<Salon> = catalogoDeEjemplo): Resultado {
    if (texto.isBlank()) return Resultado.SinClave
    val clave = normalizarClave(texto) ?: return Resultado.FormatoInvalido(texto.trim())
    val salon = catalogo.firstOrNull { it.clave == clave } ?: return Resultado.NoExiste(clave)
    return Resultado.Encontrado(salon)
}

/** Texto que ve el usuario para cada resultado. */
fun mensaje(resultado: Resultado): String = when (resultado) {
    is Resultado.Encontrado ->
        "Edificio ${resultado.salon.edificio} · Piso ${resultado.salon.piso}"
    Resultado.SinClave -> "Escribe la clave de tu salón, por ejemplo A-201."
    is Resultado.FormatoInvalido ->
        "«${resultado.texto}» no parece una clave. Escribe edificio y número, por ejemplo A-201."
    is Resultado.NoExiste ->
        "No encontré ${resultado.clave} en el catálogo de ejemplo. Revisa la clave en tu horario."
}
