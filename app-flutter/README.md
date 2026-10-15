# Salones UAM · Prototipo 1 en Flutter

Abres la app estando en la UAM y el mapa se centra en tu ubicación. Basado en [HolaMundoFlutter](https://github.com/gabrielhuav/Flutter-Projects/tree/main/HolaMundoFlutter); la instalación de Flutter, Android Studio y el emulador está en ese tutorial.

## Ejecutar

```bash
flutter pub get
flutter test
flutter run
```

La primera vez, la app pide permiso de ubicación. En el emulador, la ubicación se cambia en **Extended controls (⋯) → Location**: busca «UAM Azcapotzalco» y pulsa **Set location**.

## Qué cambió respecto a HolaMundoFlutter

| Archivo | Cambio |
|---|---|
| `lib/ubicacion.dart` | Nuevo: pedir permiso, leer la ubicación con `geolocator` y decir si estás en la UAM |
| `lib/main.dart` | `PantallaMapa`: mapa con `flutter_map`, un marcador en tu posición y el botón de capas para elegir proveedor (CARTO, Esri calles, Esri satélite u OpenStreetMap) |
| `test/ubicacion_test.dart` | Pruebas de `describir` |
| `pubspec.yaml` | `geolocator`, `flutter_map` y `latlong2`; nombre `salones_uam`, versión `0.1.0+1` |
| `android/app/src/main/AndroidManifest.xml` | Permisos de internet y ubicación; nombre `Salones Flutter` |
| `ios/Runner/Info.plist` | Motivo del permiso de ubicación (`NSLocationWhenInUseUsageDescription`) |

El mapa usa los mosaicos públicos de OpenStreetMap, que sirven para un prototipo pero no para una app con muchos usuarios. En el siguiente paso, el mapa será la imagen aérea del campus.
