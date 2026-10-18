package ovh.gabrielhuav.salones

import android.content.Context
import android.content.SharedPreferences

actual object Preferencias {
    private var guardadas: SharedPreferences? = null

    /** Se llama una vez desde MainActivity, antes de dibujar la pantalla. */
    fun iniciar(contexto: Context) {
        guardadas = contexto.applicationContext.getSharedPreferences("salones", Context.MODE_PRIVATE)
    }

    actual fun leer(clave: String): String? = guardadas?.getString(clave, null)

    actual fun guardar(clave: String, valor: String) {
        guardadas?.edit()?.putString(clave, valor)?.apply()
    }
}
