# Salones UAM · Prototipo 1 en Flutter

Basado en [HolaMundoFlutter](https://github.com/gabrielhuav/Flutter-Projects/tree/main/HolaMundoFlutter). La instalación de Flutter, Android Studio y el emulador está explicada en ese tutorial.

## Ejecutar

```bash
flutter pub get
flutter analyze
flutter test
flutter run
```

## Qué cambió respecto a HolaMundoFlutter

| Archivo | Cambio |
|---|---|
| `pubspec.yaml` | Nombre `salones_uam` y versión `0.1.0+1` |
| `lib/catalogo.dart` | Nuevo (antes `saludo.dart`): catálogo de ejemplo, `normalizarClave`, `buscarSalon` y `mensaje` |
| `lib/main.dart` | Pantalla `PantallaBuscar`: campo de texto, botón Buscar y tarjeta de resultado |
| `test/catalogo_test.dart` | Pruebas unitarias de la lógica |
| `test/widget_test.dart` | Prueba de la pantalla: encontrar `a201` y avisar con `Z-999` |
| `android/app/build.gradle.kts` | `applicationId` y `namespace`: `com.example.salones_uam` |
| `android/.../MainActivity.kt` | Carpeta y paquete `com/example/salones_uam` |
| `AndroidManifest.xml` | Nombre bajo el ícono: `Salones Flutter` |
| `ios/` | Bundle ID `com.example.salonesUam` y nombre `Salones UAM` (no verificado en iPhone en este prototipo) |

`lib/plataforma.dart` no cambió.
