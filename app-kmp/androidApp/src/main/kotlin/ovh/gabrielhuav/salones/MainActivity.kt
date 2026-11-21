package ovh.gabrielhuav.salones

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
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
            if (permisos.isEmpty()) {
                // Petición cancelada (p. ej. se giró el teléfono con el diálogo abierto): no es un «no».
                return@registerForActivityResult
            }
            if (permisos.values.any { it }) {
                ubicar()
            } else {
                mensaje = "Sin permiso de ubicación: el mapa muestra la UAM."
            }
        }

    // Prototipo 4 · experimento: el edificio que reconoció la cámara en ReconocerActivity.
    private var reconocido by mutableStateOf<Reconocido?>(null)

    private val reconocer =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { r ->
            val datos = r.data ?: return@registerForActivityResult
            if (r.resultCode != RESULT_OK) return@registerForActivityResult
            reconocido = Reconocido(
                datos.getStringExtra("clase") ?: return@registerForActivityResult,
                datos.getStringExtra("destino") ?: return@registerForActivityResult,
                datos.getFloatExtra("puntaje", 0f),
                System.currentTimeMillis(),
            )
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        Preferencias.iniciar(this) // el tema y la unidad que se eligieron la última vez
        // `App()` es la pantalla compartida de `:shared` (commonMain): la misma que ve iOS.
        // Prototipo 3: la red de caminos de cada campus que la tenga (campus*/rutas.json, copiada por Gradle).
        val redes = Unidad.entries.mapNotNull { u ->
            u.carpeta?.let { c -> runCatching { assets.open("campus/$c/rutas.json").use { it.readBytes().decodeToString() } }.getOrNull() }
                ?.let { u to it }
        }.toMap()
        setContent {
            App(
                ubicacion, mensaje, onUbicar = { pedirUbicacion() }, redes = redes,
                onReconocer = { s -> reconocer.launch(Intent(this, ReconocerActivity::class.java).putExtra("sede", s.name)) }, reconocido = reconocido,
            )
        }
        // Sólo en la app de depuración, para probar en el emulador la mascota sobre la cámara (demo_sede es opcional):
        // adb shell am start -n ovh.gabrielhuav.salones/.MainActivity --ez demo_reconocer true --es demo_sede AZCAPOTZALCO
        if ((applicationInfo.flags and android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0 &&
            intent.getBooleanExtra("demo_reconocer", false) && savedInstanceState == null) {
            reconocer.launch(Intent(this, ReconocerActivity::class.java).putExtra("demo", true).putExtra("sede", intent.getStringExtra("demo_sede") ?: Unidad.ESCOM.name))
        }
        when {
            tienePermiso() -> ubicar()
            // Al girar, Android recrea la actividad; el diálogo sigue abierto y no se pide dos veces.
            savedInstanceState == null -> pedirUbicacion()
        }
    }

    private fun tienePermiso() =
        checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
            checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED

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
