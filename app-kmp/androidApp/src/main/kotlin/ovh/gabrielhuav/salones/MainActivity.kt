package ovh.gabrielhuav.salones

import android.Manifest
import android.annotation.SuppressLint
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority

class MainActivity : ComponentActivity() {

    // Lo que lee la pantalla compartida: cuando cambia, Compose la vuelve a dibujar.
    private var ubicacion by mutableStateOf<Ubicacion?>(null)
    private var mensaje by mutableStateOf("Buscando tu ubicación…")

    private val pedirPermiso =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { permisos ->
            if (permisos.values.any { it }) {
                ubicar()
            } else {
                mensaje = "Sin permiso de ubicación: el mapa muestra la UAM."
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        // `App()` es la pantalla compartida de `:shared` (commonMain): la misma que ve iOS.
        setContent { App(ubicacion, mensaje, onUbicar = { pedirUbicacion() }) }
        pedirUbicacion()
    }

    private fun pedirUbicacion() {
        pedirPermiso.launch(
            arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION),
        )
    }

    @SuppressLint("MissingPermission") // solo se llama después de conceder el permiso
    private fun ubicar() {
        val cliente = LocationServices.getFusedLocationProviderClient(this)
        cliente.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, null)
            .addOnSuccessListener { lugar ->
                if (lugar != null) {
                    mostrar(lugar.latitude, lugar.longitude)
                } else {
                    // Sin lectura nueva (pasa en el emulador): se usa la última conocida.
                    cliente.lastLocation.addOnSuccessListener { ultima ->
                        if (ultima != null) mostrar(ultima.latitude, ultima.longitude) else sinUbicacion()
                    }
                }
            }
            .addOnFailureListener { sinUbicacion() }
    }

    private fun mostrar(latitud: Double, longitud: Double) {
        val yo = Ubicacion(latitud, longitud)
        ubicacion = yo
        mensaje = describir(yo)
    }

    private fun sinUbicacion() {
        mensaje = "No se pudo leer la ubicación: el mapa muestra la UAM. En el emulador, fíjala en ⋯ → Location."
    }
}
