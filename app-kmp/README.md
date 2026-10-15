# Salones UAM · Prototipo 1 en Kotlin Multiplatform

Abres la app estando en la UAM y el mapa se centra en tu ubicación. Basado en [HolaMundoKMP](https://github.com/gabrielhuav/HolaMundoKMP) y en [Kotlin-Maps-Example](https://github.com/gabrielhuav/Kotlin-Maps-Example), pero con Compose Multiplatform.

## Ejecutar

En Android Studio: **File → Open**, elige esta carpeta (`app-kmp/`, la que contiene `settings.gradle.kts`), espera la sincronización de Gradle, selecciona `androidApp` y un emulador, y pulsa **Run**.

La primera vez, la app pide permiso de ubicación. En el emulador, la ubicación se cambia en **Extended controls (⋯) → Location**: busca «UAM Azcapotzalco» y pulsa **Set location**.

Pruebas de la lógica compartida, en la JVM de la computadora:

```bash
./gradlew :shared:testAndroidHostTest
```

En Windows: `gradlew.bat :shared:testAndroidHostTest`.

## Qué cambió respecto a HolaMundoKMP

| Archivo | Cambio |
|---|---|
| `shared/src/commonMain/.../Ubicacion.kt` | Nuevo: centro de la UAM, distancia, `describir`, los cuatro proveedores (CARTO, Esri calles, Esri satélite y OpenStreetMap) y el cálculo de teselas |
| `shared/src/commonMain/.../App.kt` | Pantalla compartida: mensaje, botón, selector de proveedor y `Mapa` (`expect`) |
| `shared/src/androidMain/.../Mapa.android.kt` | Descarga las teselas y dibuja el mapa en un `Canvas` de Compose, sin WebView; si un proveedor no responde, prueba el siguiente y dice por qué |
| `shared/src/iosMain/.../Mapa.ios.kt` | Aviso: en iOS el mapa llega en el siguiente prototipo |
| `androidApp/.../MainActivity.kt` | Permiso y ubicación con `FusedLocationProviderClient` |
| `androidApp/build.gradle.kts` y `gradle/libs.versions.toml` | `play-services-location`; paquete `ovh.gabrielhuav.salones`, versión `0.1.0` |
| `androidApp/src/main/AndroidManifest.xml` | Permisos de internet y ubicación; nombre `Salones KMP` |
| `shared/src/commonTest/.../UbicacionTest.kt` | Pruebas con `kotlin.test` |

En iOS, este prototipo todavía no pide la ubicación: el mapa muestra la UAM. En el siguiente paso, el mapa será la imagen aérea del campus.
