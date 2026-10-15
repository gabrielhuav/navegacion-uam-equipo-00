package ovh.gabrielhuav.salones

import platform.UIKit.UIDevice

actual fun plataforma(): String =
    "${UIDevice.currentDevice.systemName()} ${UIDevice.currentDevice.systemVersion}"
