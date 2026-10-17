package ovh.gabrielhuav.salones

import androidx.compose.ui.window.ComposeUIViewController

/**
 * Lo que llama Swift (`MainViewControllerKt.MainViewController()`) para meter Compose en la app iOS.
 * En este prototipo, iOS todavía no pide la ubicación: el mapa muestra la UAM.
 */
fun MainViewController() = ComposeUIViewController {
    App(ubicacion = null, mensaje = "En iOS, el mapa muestra la UAM.")
}
