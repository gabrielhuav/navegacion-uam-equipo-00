# Plan de prototipos · App de salones

La app de salones tiene mucha incertidumbre técnica: reconocer un lugar con la cámara, dibujar flechas en realidad aumentada y calcular rutas dentro del campus. Por eso el equipo no la construye de una sola vez. La construye con **prototipos**: versiones pequeñas que responden una pregunta concreta antes de invertir más tiempo.

## El ciclo de cada prototipo

Es el modelo de prototipos (Pressman, 2009) dentro de un ciclo de vida iterativo (Unidad II, tema 2.3):

1. **Comunicación.** ¿Qué pregunta debe responder este prototipo? ¿Qué historia de usuario atiende?
2. **Plan rápido.** Un issue por historia, una rama y un milestone con fecha.
3. **Diseño rápido.** Lo mínimo para responder la pregunta; lo demás se aplaza a propósito.
4. **Construcción.** Commits pequeños, pruebas automáticas y un Pull Request revisado.
5. **Entrega y retroalimentación.** Versión etiquetada (`v0.N.0`) y prueba con personas. Con lo aprendido se decide: **continuar, ajustar o descartar**.

Los prototipos de este repositorio son **evolutivos**: el código que pasa sus pruebas se conserva y crece. Un experimento que sólo sirve para aprender (por ejemplo, probar un complemento de AR) va en una rama `spike/…` y no se integra a `main`.

## Los cuatro prototipos

| Prototipo | Pregunta que responde | Historias | Entra | Entrega |
|---|---|---|---|---|
| **P1 · Buscar salón** | ¿El alumno encuentra su salón escribiendo la clave como viene en su horario? | HU01 y parte de HU05 | Clave normalizada, edificio y piso, mensajes de error, catálogo de ejemplo | `v0.1.0` · antes de la Entrega 1 (22 oct) |
| **P2 · Ruta** | ¿La ruta más corta sobre el grafo del catálogo común lleva al salón correcto? | HU02 y HU05 | Catálogo común (≥ 20 lugares), grafo, Dijkstra, «sin ruta» | `v0.2.0` · Entrega 2 (5 nov) |
| **P3 · ¿Dónde estoy?** | ¿La app reconoce el punto de partida con la cámara (o el usuario lo señala en el recorrido)? | HU03 | Fotos del repositorio común, reconocimiento o letreros, GPS por edificio | `v0.3.0` · antes de la Entrega 3 |
| **P4 · Guía** | ¿Una persona que no conoce la UAM llega sola con AR, RV o ambas? | HU04 | Flechas o recorrido, aviso de llegada, prueba con 3 personas | `v1.0.0` · Entrega 3 (26 nov) |

Las fechas son las de la planeación del curso. Cada equipo ajusta su plan, pero cada prototipo debe tener su issue, su milestone, su PR y su versión. La prueba con usuarios del P4 se repite en la presentación final (1 y 3 de diciembre).

## Riesgo que se registra desde el P1

En Flutter, los complementos de realidad aumentada llevan años sin mantenimiento; en Kotlin están ARCore y ML Kit, de Google. Si el equipo elige Flutter con AR, ese riesgo va a su matriz de riesgos desde la Entrega 1 (enunciado del proyecto).

## Cómo se evalúa cada prototipo

- **Pruebas automáticas** en verde en el Pull Request (GitHub Actions).
- **Prueba con personas**: tres personas que no conozcan el prototipo hacen la tarea sin ayuda. Se registra si lo lograron, cuánto tardaron y dónde se confundieron.
- **Decisión documentada** en la ficha del prototipo: qué se conserva, qué se cambia y qué entra al siguiente.

## Referencias

- Pressman, R. S. (2009). *Software engineering: A practitioner's approach* (7th ed.). McGraw-Hill.
- Project Management Institute & Agile Alliance. (2017). *Agile practice guide*. Project Management Institute.
- Hurtado Avilés, G. (2026). *Proyectos integradores: planteamiento y requisitos* [Material del curso 1151055]. UAM Azcapotzalco.
