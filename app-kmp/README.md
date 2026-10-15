# Salones UAM · Prototipo 1 en Kotlin Multiplatform

Basado en [HolaMundoKMP](https://github.com/gabrielhuav/HolaMundoKMP). La instalación de Android Studio, el SDK y el emulador está explicada en ese tutorial.

## Ejecutar

En Android Studio: **File → Open**, elige esta carpeta (`app-kmp/`, la que contiene `settings.gradle.kts`), espera la sincronización de Gradle, selecciona `androidApp` y un emulador, y pulsa **Run**.

Pruebas de la lógica compartida, en la JVM de la computadora:

```bash
./gradlew :shared:testAndroidHostTest
```

En Windows: `gradlew.bat :shared:testAndroidHostTest`.

## Qué cambió respecto a HolaMundoKMP

| Archivo | Cambio |
|---|---|
| `settings.gradle.kts` | Proyecto `SalonesUAM` |
| `shared/.../Catalogo.kt` | Nuevo: catálogo de ejemplo, `normalizarClave`, `buscarSalon` y `mensaje` |
| `shared/.../App.kt` | Pantalla `PantallaBuscar`: campo de texto, botón Buscar y tarjeta de resultado |
| `shared/src/commonTest/.../CatalogoTest.kt` | Nuevo: pruebas con `kotlin.test` |
| `shared/build.gradle.kts` | `withHostTestBuilder {}` y dependencia `kotlin("test")` en `commonTest` |
| `androidApp/build.gradle.kts` | `applicationId` y `namespace`: `ovh.gabrielhuav.salones`; versión `0.1.0` |
| Paquete Kotlin | `ovh.gabrielhuav.holamundo` → `ovh.gabrielhuav.salones` en todas las carpetas |
| `AndroidManifest.xml` | Nombre bajo el ícono: `Salones KMP` |
| `iosApp/` | Bundle ID `ovh.gabrielhuav.salones` y nombre `Salones UAM` (no verificado en iPhone en este prototipo) |

`Plataforma.kt` y sus `actual` de Android e iOS no cambiaron, salvo el paquete.
