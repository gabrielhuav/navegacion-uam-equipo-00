# navegacion-uam-equipo-00

**Salones UAM · Prototipo 1: ¿dónde estoy?**

| | |
|---|---|
| Equipo | 00 · repositorio de ejemplo del profesor (tu equipo escribe aquí integrantes y matrículas) |
| UEA | Administración de Proyectos de Software (1151055) · UAM Azcapotzalco |
| Profesor | M. en C. Gabriel Hurtado Avilés |
| Trimestre | 26-O |
| Versión | `v0.1.0` · Prototipo 1 |

## Introducción

Un alumno de nuevo ingreso tiene su horario, pero no sabe dónde está el salón que dice. El objetivo del proyecto es que una persona que nunca ha estado en la UAM llegue sola a su salón, guiada con realidad aumentada, realidad virtual o ambas.

La app se construye con **prototipos** (ver [docs/prototipos.md](docs/prototipos.md)). El **Prototipo 1** es el más simple: abres la app estando en la UAM, da permiso de ubicación y el mapa se centra en donde estás. El mapa es de OpenStreetMap y no necesita API key. En el siguiente paso, el mapa será una imagen aérea 2D del campus.

El mismo prototipo está hecho dos veces para que sirva de base a cualquier equipo:

| Carpeta | Tecnología | Basada en |
|---|---|---|
| [`app-flutter/`](app-flutter/) | Flutter (Dart), con `geolocator` y `flutter_map` | [HolaMundoFlutter](https://github.com/gabrielhuav/Flutter-Projects/tree/main/HolaMundoFlutter) |
| [`app-kmp/`](app-kmp/) | Kotlin Multiplatform con Compose | [HolaMundoKMP](https://github.com/gabrielhuav/HolaMundoKMP) y [Kotlin-Maps-Example](https://github.com/gabrielhuav/Kotlin-Maps-Example) |

Tu equipo usa **una** de las dos.

## Cómo ejecutarlo desde un clon limpio

Requisitos: los de la Tarea 2 (Android Studio con su SDK y un emulador; Flutter si usas `app-flutter/`). Clona en una carpeta sin acentos, por ejemplo `C:\dev`: Gradle falla con rutas como `...\OneDrive\Imágenes\...`.

**Flutter**, desde una terminal:

```bash
cd app-flutter
flutter pub get
flutter test
flutter run
```

**KMP**: en Android Studio, **File → Open** y elige la carpeta `app-kmp/` (la que contiene `settings.gradle.kts`). Espera la sincronización de Gradle, elige `androidApp` y un emulador, y pulsa **Run**. Las pruebas: `./gradlew :shared:testAndroidHostTest` (en Windows, `gradlew.bat`).

En el emulador, la ubicación se cambia en **Extended controls (⋯) → Location**: busca «UAM Azcapotzalco» y pulsa **Set location**.

## Estructura

```text
.github/            plantillas de issue y PR, y la integración continua (workflows/ci.yml)
app-flutter/        prototipo en Flutter: lib/ubicacion.dart y lib/main.dart
app-kmp/            prototipo en KMP: shared/src/commonMain (pantalla y lógica) y androidApp (ubicación)
docs/               plan de prototipos y ficha del Prototipo 1
```

## Trazabilidad

| Elemento | Dónde |
|---|---|
| Historia | [HU03] Ver dónde estoy en el mapa de la UAM |
| Milestone | Prototipo 1, con fecha del 22 de octubre |
| Commits | Conventional Commits: `chore`, `feat`, `docs`, `ci` |
| Pull Request | Enlaza su issue, con evidencia de pruebas y uso de IA. En tu equipo lo aprueba otro integrante |
| Integración continua | `.github/workflows/ci.yml`: Flutter (análisis, pruebas y APK) y KMP (pruebas y APK) |
| Versión | Etiqueta y release `v0.1.0` |

## Riesgos registrados

- **AR en Flutter.** Los complementos de realidad aumentada para Flutter llevan años sin mantenimiento; en Kotlin están ARCore y ML Kit. Si el equipo elige Flutter con AR, el riesgo va a su matriz desde la Entrega 1.
- **Mapa público.** Los mosaicos de OpenStreetMap sirven para un prototipo, no para una app con muchos usuarios. Se sustituyen por la imagen aérea del campus.

## Uso de inteligencia artificial

Repositorio de ejemplo preparado con apoyo de Claude (Anthropic): adaptación de las plantillas HolaMundo, ubicación y mapa, pruebas, plantillas de GitHub y documentación. Las pruebas y la compilación de las dos apps se comprueban en la integración continua. Cada equipo declara aquí su propio uso de IA; lo no declarado se anula.

## Licencia

MIT. Ver [LICENSE](LICENSE).

## Referencias

- Conventional Commits. (s. f.). *Conventional Commits 1.0.0*. https://www.conventionalcommits.org/es/v1.0.0/
- Hurtado Avilés, G. (2025). *Kotlin-Maps-Example* [Software]. GitHub. https://github.com/gabrielhuav/Kotlin-Maps-Example
- Hurtado Avilés, G. (2026a). *HolaMundoFlutter* [Software]. GitHub. https://github.com/gabrielhuav/Flutter-Projects/tree/main/HolaMundoFlutter
- Hurtado Avilés, G. (2026b). *HolaMundoKMP* [Software]. GitHub. https://github.com/gabrielhuav/HolaMundoKMP
- OpenStreetMap contributors. (s. f.). *OpenStreetMap*. https://www.openstreetmap.org/copyright
- Pressman, R. S. (2009). *Software engineering: A practitioner's approach* (7th ed.). McGraw-Hill.
- Preston-Werner, T. (s. f.). *Versionado semántico 2.0.0*. https://semver.org/lang/es/


### Croquis iniciales para otras unidades
- [Cuajimalpa](campus-cuajimalpa/README.md): Torre III y auxiliar norte; datos y niveles provisionales.
- [Iztapalapa](campus-iztapalapa/README.md): 17 volúmenes principales simplificados.
Ambas carpetas incluyen editor web, GLB, PNG y georreferencia con controles/error declarado. Las apps conservan campus/ como Azcapotzalco.
Datos derivados de OpenStreetMap bajo ODbL; ver FUENTES.md de cada carpeta. Bibliotecas/código conservan sus licencias.
Verificar entrega con node verificar-campus-unidades.mjs.
