# Prototipo 1 · ¿Dónde estoy?

| Campo | Contenido |
|---|---|
| Pregunta | ¿La app muestra en el mapa dónde está el alumno dentro de la UAM? |
| Historia | [HU03] Ver dónde estoy en el mapa de la UAM |
| Milestone | Prototipo 1, con fecha del 22 de octubre |
| Versión | `v0.1.0` |
| Base | HolaMundoFlutter, HolaMundoKMP y Kotlin-Maps-Example (Hurtado Avilés) |
| Tecnologías | Flutter en `app-flutter/` y Kotlin Multiplatform con Compose en `app-kmp/`. Cada equipo elige una. |

## Alcance

**Entra:**

- Pedir permiso de ubicación y leer la posición del teléfono.
- Un mapa de OpenStreetMap centrado en esa posición, con un marcador. Sin API key.
- Un mensaje: «Estás en la UAM Azcapotzalco» o a cuántos kilómetros queda.
- Sin permiso o sin ubicación, el mapa muestra la UAM y el mensaje dice por qué.

**Se aplaza a propósito:**

- La imagen aérea 2D del campus como mapa (siguiente paso).
- Buscar el salón y la ruta (Prototipo 2).
- La cámara, la realidad aumentada y la virtual (Prototipos 3 y 4).
- iOS: el código lo permite, pero en este prototipo sólo se verifica Android.

## Criterios de aceptación de HU03

- [ ] Dado que la app tiene permiso de ubicación, cuando la abro, entonces el mapa se centra en mi posición y la marca.
- [ ] Dado que niego el permiso o no hay ubicación, cuando abro la app, entonces el mapa muestra la UAM y un mensaje dice por qué.

## Prueba con personas

Tarea: «Abre la app en la UAM y dime en qué parte del campus estás». Tres personas que no conozcan el prototipo, sin ayuda.

| Persona | Fecha | ¿Se ubicó? | Tiempo | Dónde se confundió |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

*Pendiente: cada equipo llena esta tabla con su propio prototipo. No se inventan resultados.*

## Decisión para el Prototipo 2

Se llena después de la prueba con personas: qué se conserva, qué se cambia y qué entra al P2.
