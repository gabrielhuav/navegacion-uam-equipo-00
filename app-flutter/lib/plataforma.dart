import 'dart:io' show Platform;

import 'package:flutter/foundation.dart' show kIsWeb;

/// Nombre del sistema operativo en el que corre la app.
///
/// El mismo código Dart se compila para Android y para iOS; `Platform` nos
/// dice en cuál estamos en tiempo de ejecución.
String nombrePlataforma() {
  if (kIsWeb) return 'la Web'; // dart:io no existe en la Web: se revisa antes.
  if (Platform.isAndroid) return 'Android';
  if (Platform.isIOS) return 'iOS';
  return Platform.operatingSystem; // windows, macos, linux…
}
