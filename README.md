# navegacion-uam-equipo-00

**Salones UAM · Prototipos 1 a 3: ¿dónde estoy?, el campus y las rutas**

| | |
|---|---|
| Equipo | 00 · repositorio de ejemplo del profesor (tu equipo escribe aquí integrantes y matrículas) |
| UEA | Administración de Proyectos de Software (1151055) · UAM Azcapotzalco |
| Profesor | M. en C. Gabriel Hurtado Avilés |
| Trimestre | 26-O |
| Versión | `v0.3.0` · Prototipo 3 |

## Introducción

Un alumno de nuevo ingreso tiene su horario, pero no sabe dónde está el salón que dice. El objetivo del proyecto es que una persona que nunca ha estado en la UAM llegue sola a su salón, guiada con realidad aumentada, realidad virtual o ambas.

La app se construye con **cuatro prototipos** (ver [docs/prototipos.md](docs/prototipos.md)):

| Prototipo | Qué hace | Versión |
|---|---|---|
| **P1 · ¿Dónde estoy?** | Da permiso de ubicación y el mapa se centra en donde estás. | `v0.1.0` |
| **P2 · El campus** | El campus de tu unidad sobre el mapa real, en 2D y en 3D; temas con el color de cada unidad, modo claro u oscuro, día o noche, y las cinco unidades. | `v0.2.0` |
| **P3 · Rutas** | En Azcapotzalco, de tu ubicación o de un lugar a otro, por el camino más corto. | `v0.3.0` |
| **P4 · Guía** | Llegar sola o solo con AR, RV o ambas. Por empezar. | `v1.0.0` |

La app está hecha dos veces para que sirva de base a cualquier equipo:

| Carpeta | Tecnología | Basada en |
|---|---|---|
| [`app-flutter/`](app-flutter/) | Flutter (Dart): `geolocator`, `flutter_map` y `model_viewer_plus` (3D) | [HolaMundoFlutter](https://github.com/gabrielhuav/Flutter-Projects/tree/main/HolaMundoFlutter) |
| [`app-kmp/`](app-kmp/) | Kotlin Multiplatform con Compose; Filament para el 3D en Android | [HolaMundoKMP](https://github.com/gabrielhuav/HolaMundoKMP) y [Kotlin-Maps-Example](https://github.com/gabrielhuav/Kotlin-Maps-Example) |

Tu equipo usa **una** de las dos.

## El campus: un diseño para la web y las dos apps

Cada unidad tiene una carpeta con su editor web (Three.js), su modelo 3D (`UAM_<Unidad>.glb`), su plano 2D (`plano_2d.png`) y su georreferencia (`georreferencia.json`). Al compilar, Gradle copia esos archivos a las dos apps: nadie edita copias.

| Unidad | Carpeta |
|---|---|
| Azcapotzalco | [`campus/`](campus/README.md), con la red de caminos de las rutas (`rutas.json`) |
| Cuajimalpa | [`campus-cuajimalpa/`](campus-cuajimalpa/README.md) |
| Iztapalapa | [`campus-iztapalapa/`](campus-iztapalapa/README.md) |
| Lerma | [`campus-lerma/`](campus-lerma/README.md) |
| Xochimilco | [`campus-xochimilco/`](campus-xochimilco/README.md) |
| ESCOM (IPN), campus aparte | [`campus-escom/`](campus-escom/README.md), con su red de caminos (`rutas.json`, borrador) |

El editor de cada unidad se abre desde su carpeta con `node server.mjs`; la terminal muestra la dirección. Los croquis y la red de caminos son aproximados: no son levantamientos topográficos. Los datos derivados de OpenStreetMap están bajo ODbL; ver `FUENTES.md` de cada carpeta. Los verificadores están en la raíz (`node verificar-rutas.mjs`, `node verificar-campus-unidades.mjs`, …).

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

## Cómo se usa

- **Mapa / 2D / 3D**: el campus sobre el mapa real, sólo el plano, o el modelo 3D (un dedo gira e inclina, dos acercan).
- **Tema ▾**: claro u oscuro, el color de una de las cinco unidades (pregunta si quieres ir a su campus) y día o noche.
- **Ruta** (Azcapotzalco): origen (tu ubicación o un lugar) y destino; la tarjeta dice metros y minutos a pie.
- **⚙ Ajustes**: el modo desarrollador permite quitar la marca de agua temporal «copyright @gabrielhuav».

## Estructura

```text
.github/            plantillas de issue y PR, y la integración continua (workflows/ci.yml)
app-flutter/        app en Flutter: lib/ (campus, tema, rutas y pantalla) y test/
app-kmp/            app en KMP: shared/src/commonMain (pantalla y lógica) y androidApp (ubicación)
campus*/            un editor, modelo, plano y georreferencia por unidad
docs/               plan de prototipos, ficha del Prototipo 1 y capturas
MEMORIA_COMPARTIDA_CAMPUS.md   decisiones, pruebas y pendientes del diseño común
```

## Trazabilidad

| Elemento | Dónde |
|---|---|
| Historias | Un issue por historia, con etiqueta `historia` |
| Milestones | Uno por prototipo, con su versión y su fecha |
| Commits | Conventional Commits: `feat`, `fix`, `docs`, `ci`, `chore` |
| Pull Request | Enlaza sus issues, con evidencia de pruebas y uso de IA. En tu equipo lo aprueba otro integrante |
| Integración continua | `.github/workflows/ci.yml`: Flutter (análisis, pruebas y APK) y KMP (pruebas y APK) |
| Versiones | Etiquetas y releases `v0.1.0`, `v0.2.0` y `v0.3.0` |

## Riesgos registrados

- **AR en Flutter.** Los complementos de realidad aumentada para Flutter llevan años sin mantenimiento; en Kotlin están ARCore y ML Kit. Si el equipo elige Flutter con AR, el riesgo va a su matriz desde la Entrega 1.
- **Reconocer lugares en iPhone.** Para el P4 se prefiere un modelo propio (por ejemplo YOLO) sobre ML Kit, porque las dos apps deben llegar a iOS.
- **Mapa público.** Los mosaicos de OpenStreetMap sirven para un prototipo, no para una app con muchos usuarios.
- **Croquis aproximados.** Las huellas, la georreferencia (error de varios metros) y la red de caminos se revisan en campo.

## Uso de inteligencia artificial

Repositorio de ejemplo preparado con apoyo de Claude (Anthropic), en las apps, pruebas y documentación, y de Codex (OpenAI), en los croquis, editores y la red de caminos. Las pruebas y la compilación de las dos apps se comprueban en la integración continua y en el emulador. Cada equipo declara aquí su propio uso de IA; lo no declarado se anula.

## Licencia

MIT. Ver [LICENSE](LICENSE). Los datos derivados de OpenStreetMap conservan la licencia ODbL y las bibliotecas, las suyas.

## Referencias

- Conventional Commits. (s. f.). *Conventional Commits 1.0.0*. https://www.conventionalcommits.org/es/v1.0.0/
- Dijkstra, E. W. (1959). A note on two problems in connexion with graphs. *Numerische Mathematik, 1*, 269–271.
- Hurtado Avilés, G. (2025). *Kotlin-Maps-Example* [Software]. GitHub. https://github.com/gabrielhuav/Kotlin-Maps-Example
- Hurtado Avilés, G. (2026a). *HolaMundoFlutter* [Software]. GitHub. https://github.com/gabrielhuav/Flutter-Projects/tree/main/HolaMundoFlutter
- Hurtado Avilés, G. (2026b). *HolaMundoKMP* [Software]. GitHub. https://github.com/gabrielhuav/HolaMundoKMP
- OpenStreetMap contributors. (s. f.). *OpenStreetMap*. https://www.openstreetmap.org/copyright
- Pressman, R. S. (2009). *Software engineering: A practitioner's approach* (7th ed.). McGraw-Hill.
- Preston-Werner, T. (s. f.). *Versionado semántico 2.0.0*. https://semver.org/lang/es/
- Universidad Autónoma Metropolitana. (2012). *Reglas para la Aplicación de los Elementos de Identidad Institucional*. https://www.comunicacionsocial.uam.mx/identidaduam/
