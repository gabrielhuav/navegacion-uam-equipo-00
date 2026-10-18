package ovh.gabrielhuav.salones

import platform.Foundation.NSUserDefaults

actual object Preferencias {
    actual fun leer(clave: String): String? = NSUserDefaults.standardUserDefaults.stringForKey(clave)

    actual fun guardar(clave: String, valor: String) {
        NSUserDefaults.standardUserDefaults.setObject(valor, forKey = clave)
    }
}
