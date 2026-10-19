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

| Prototipo | Pregunta que responde | Historias | Entra | Versión y estado |
|---|---|---|---|---|
| **P1 · ¿Dónde estoy?** | ¿La app muestra en el mapa dónde está el alumno dentro de la UAM? | HU03 | Permiso y ubicación del teléfono, mapa de OpenStreetMap | `v0.1.0` · hecho, antes de la Entrega 1 (22 oct) |
| **P2 · El campus** | ¿El alumno se orienta mejor con el campus de su unidad en Mapa, 2D y 3D, con su tema y de día o de noche? | HU06 | Plano 2D georreferenciado y modelo 3D por unidad; temas UAM, claro u oscuro, día o noche; las cinco unidades; Ajustes con modo desarrollador | `v0.2.0` · hecho |
| **P3 · Rutas** | ¿La app lo lleva de un punto a otro de Azcapotzalco por el camino más corto? | HU02 y HU05 | Red de caminos (`campus/rutas.json`), Dijkstra, origen por ubicación o lugar, metros y minutos | `v0.3.0` · hecho, para la Entrega 2 (5 nov) |
| **P4 · Guía** | ¿Una persona que no conoce la UAM llega sola con AR, RV o ambas? | HU01 y HU04 | Buscar el salón, reconocer el lugar con la cámara, flechas o recorrido, aviso de llegada, prueba con 3 personas | `v1.0.0` · por empezar, Entrega 3 (26 nov) |

Las fechas son las de la planeación del curso. Cada equipo ajusta su plan, pero cada prototipo debe tener sus issues, su milestone, su PR y su versión. La prueba con usuarios del P4 se repite en la presentación final (1 y 3 de diciembre).

### El plan cambió y quedó escrito

- Al principio, el P2 era «Buscar y llegar» y el P3 «Reconocer el lugar». Con la prueba del P1 se decidió primero mostrar el campus (P2) y después las rutas (P3). Buscar el salón por su clave (HU01) y reconocer el lugar con la cámara pasan al P4, junto con la guía.
- Durante el P2 se trabajó por partes (temas, cinco unidades, ajustes) y algunos mensajes de commit las llaman «Prototipo 3», «4» o «5». La numeración vigente es la de esta tabla.

## Riesgos que se registran

- En Flutter, los complementos de realidad aumentada llevan años sin mantenimiento; en Kotlin están ARCore y ML Kit, de Google. Si el equipo elige Flutter con AR, ese riesgo va a su matriz de riesgos desde la Entrega 1 (enunciado del proyecto).
- Para reconocer lugares en el P4 se prefiere un modelo propio (por ejemplo YOLO) sobre ML Kit, porque las dos apps deben llegar a iPhone. Aún no se decide.

## Cómo se evalúa cada prototipo

- **Pruebas automáticas** en verde en el Pull Request (GitHub Actions).
- **Prueba con personas**: tres personas que no conozcan el prototipo hacen la tarea sin ayuda. Se registra si lo lograron, cuánto tardaron y dónde se confundieron.
- **Decisión documentada** en la ficha del prototipo: qué se conserva, qué se cambia y qué entra al siguiente.

## Referencias

- Pressman, R. S. (2009). *Software engineering: A practitioner's approach* (7th ed.). McGraw-Hill.
- Project Management Institute & Agile Alliance. (2017). *Agile practice guide*. Project Management Institute.
- Hurtado Avilés, G. (2026). *Proyectos integradores: planteamiento y requisitos* [Material del curso 1151055]. UAM Azcapotzalco.
