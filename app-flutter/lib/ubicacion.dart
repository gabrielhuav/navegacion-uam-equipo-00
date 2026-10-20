/// Ubicación del teléfono para el Prototipo 1: ¿dónde estoy dentro de la UAM?
library;

import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

import 'tema.dart';

/// Centro de la UAM Azcapotzalco. El mapa empieza aquí mientras llega tu ubicación.
const uamAzcapotzalco = LatLng(19.50306, -99.18694);

/// Radio aproximado del campus, en metros.
const radioCampus = 350;

/// Resultado de pedir la ubicación: el punto (o null si no hay) y el texto que ve el usuario.
class Ubicacion {
  const Ubicacion(this.punto, this.mensaje);

  final LatLng? punto;
  final String mensaje;
}

/// Pide permiso, lee la ubicación del teléfono y la describe.
Future<Ubicacion> obtenerUbicacion() async {
  if (!await Geolocator.isLocationServiceEnabled()) {
    return const Ubicacion(null, 'Activa la ubicación del teléfono y vuelve a intentar.');
  }
  var permiso = await Geolocator.checkPermission();
  if (permiso == LocationPermission.denied) {
    permiso = await Geolocator.requestPermission();
  }
  if (permiso == LocationPermission.denied || permiso == LocationPermission.deniedForever) {
    return const Ubicacion(null, 'Sin permiso de ubicación: el mapa muestra la UAM.');
  }
  try {
    final posicion = await Geolocator.getCurrentPosition(
      locationSettings: _ajustes(),
    ).catchError((_) async => (await Geolocator.getLastKnownPosition())!);
    final punto = LatLng(posicion.latitude, posicion.longitude);
    return Ubicacion(punto, describir(punto));
  } catch (e) {
    debugPrint('Ubicación: $e');
    return const Ubicacion(null, 'No se pudo leer la ubicación: el mapa muestra la UAM.');
  }
}

/// En Android se lee el GPS del sistema (LocationManager). Con el proveedor de Google,
/// geolocator abre el diálogo «Location Accuracy» y, si el usuario dice que no, falla.
LocationSettings _ajustes() {
  if (defaultTargetPlatform == TargetPlatform.android) {
    return AndroidSettings(forceLocationManager: true, timeLimit: const Duration(seconds: 15));
  }
  return const LocationSettings(timeLimit: Duration(seconds: 15));
}

/// Dice si el punto está en la unidad (por omisión, Azcapotzalco) o a cuántos kilómetros queda.
String describir(LatLng punto, [Unidad sede = Unidad.azcapotzalco]) {
  final metros = const Distance().distance(sede.centro, punto);
  if (metros <= sede.radio) return 'Estás en la UAM ${sede.nombre}.';
  return 'Estás a ${(metros / 1000).toStringAsFixed(1)} km de la UAM ${sede.nombre}.';
}
