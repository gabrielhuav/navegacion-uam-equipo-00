# Prototipo 1 · Buscar el salón del horario

| Campo | Contenido |
|---|---|
| Pregunta | ¿El alumno encuentra su salón escribiendo la clave tal como viene en su horario? |
| Historia | [HU01] Buscar el salón del horario (issue #1) |
| Milestone | Prototipo 1 · Buscar salón (v0.1.0), con fecha del 22 de octubre |
| Versión | `v0.1.0` |
| Base | HolaMundoFlutter y HolaMundoKMP (Hurtado Avilés, 2026) |
| Tecnologías | Flutter en `app-flutter/` y Kotlin Multiplatform en `app-kmp/`. Cada equipo elige una. |

## Alcance

**Entra:**

- Escribir la clave como venga: `A-201`, `a201`, `A 201` o `Salón A-201` se leen como `A-201`.
- Ver el edificio y el piso del salón.
- Tres mensajes distintos: no escribió nada, el texto no es una clave y la clave no existe.
- Un catálogo de **ejemplo** con cuatro salones, escrito en el código.
- Pruebas automáticas de la lógica y, en Flutter, de la pantalla.

**Se aplaza a propósito:**

- La ruta y el algoritmo de Dijkstra (Prototipo 2).
- El catálogo del repositorio común y sus fotos (Prototipo 2).
- La cámara, la realidad aumentada y la virtual (Prototipos 3 y 4).
- iOS: el código lo permite, pero en este prototipo sólo se verifica Android.

## Criterios de aceptación de HU01

- [x] Dado un salón existente, cuando escribo su clave, entonces veo edificio y piso.
- [x] Dado un salón inexistente, cuando lo busco, entonces aparece un mensaje y no se calcula ruta.

Evidencia: pruebas en `app-flutter/test/` y `app-kmp/shared/src/commonTest/`, y capturas en `docs/capturas/`.

## Prueba con personas

Tarea: «Tu horario dice *A-201*. Encuentra en la app en qué edificio y piso está». Antes de empezar se aclara que los datos son de ejemplo.

| Persona | Fecha | Escribió | ¿Lo encontró? | Tiempo | Dónde se confundió |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |

*Pendiente: cada equipo llena esta tabla con su propio prototipo. No se inventan resultados.*

## Decisión para el Prototipo 2

Se llena después de la prueba con personas: qué se conserva, qué se cambia y qué entra al P2.
