package ovh.gabrielhuav.salones

/**
 * Lo que la app recuerda al cerrarse: modo claro u oscuro, unidad e iluminación.
 * En Android son SharedPreferences; en iOS, NSUserDefaults. Se guardan como texto (el nombre del enum).
 */
expect object Preferencias {
    fun leer(clave: String): String?
    fun guardar(clave: String, valor: String)
}

/** Lee un enum guardado; si no hay o ya no existe ese valor, usa el de omisión. */
inline fun <reified T : Enum<T>> Preferencias.leerEnum(clave: String, omision: T): T =
    leer(clave)?.let { guardado -> enumValues<T>().firstOrNull { it.name == guardado } } ?: omision
