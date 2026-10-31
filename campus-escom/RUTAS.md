# Revisión peatonal · 21 octubre 2026

Red revisada en el plano superior y la capa «Red peatonal · PB» del visor local. 173 nodos, 233 tramos no dirigidos, 19 destinos, un componente. Se conservan los IDs de destino y los nodos anteriores n1–n126; cada nodo mantiene X/Z y latitud/longitud recalculadas con la georreferencia existente. No cambian huellas, GLB, PNG, escala ni georreferencia.

## Conexiones y entradas

Se añaden conexiones entre la explanada y los edificios 1/2/LAB/Gobierno, corredores 1–3 y 2–4, enlaces LAB–1/2/3/4/5, pasos 3–5 y 4–5, cruce entre los patios laterales y aproximación a cafetería desde su acceso. Los cruces de líneas se dividen en nodos comunes; las distancias se calculan sobre las coordenadas geográficas, como en la app.

Los diez destinos de edificio se ubican junto a su acceso de referencia (`buildings[].entry`), nunca en su centro. Si `entry` ya es exterior se conserva ese punto; si cae dentro de la huella esquemática, se usa el borde más próximo con separación exterior de 35 cm. Biblioteca, Gestión y Salud conservan el acceso compartido de Gobierno. Esta operación no demuestra la puerta física exacta: posición y apertura requieren revisión sobre el terreno.

## Pasos PB y volúmenes simplificados

La red anterior desviaba caminos alrededor de cuerpos completos cuando una huella tapaba un paso. `PEDESTRIAN_PASSAGES` en `route-space.js` define cuatro franjas, de ancho aproximado 2,4 m:

- Principal–explanada: sigue puntos de `walkways[0]` del modelo, junto al extremo norte del Edificio 2.
- Junta LAB–5: sigue la junta de las fachadas entre ambos patios; la simplificación de las huellas superpone sus bordes.
- Paso junto a LAB al oriente: aproximación de PB bajo el puente dibujado, siguiendo el corredor transversal del modelo.
- Interior LAB entre 3 y 4: circulación interior confirmada por Gabriel el 21 octubre. Se añaden accesos poniente/oriente y un nodo interior (n167/n169 y n168); su eje y ancho se aproximan sobre la maqueta. Se conserva el destino LAB en n118.

Son interpretaciones de los pasos solicitados y de la maqueta existente, pendientes de comprobación física. No son corredores nuevos levantados en campo ni una validación de accesibilidad. Todos los tramos mantienen `accesible=false`.

El validador admite cruces de una huella **sólo en esas franjas y sólo para aristas `pasillo`**. Divide matemáticamente el segmento en las intersecciones con huella y franjas; revisa todos los intervalos. Tener ambos extremos permitidos no habilita cortar el interior entre ellos. El resto de los cuerpos cerrados sigue bloqueado.

Los puentes de P1/P2 del modelo no se añaden como aristas de PB. La app actual no distingue niveles; para guiarlos harían falta nodos por piso, escaleras y selección de nivel. Los enlaces añadidos representan la circulación de planta baja.

## Distancias de control

Acceso principal → Edificio 5: **353,56 → 169,25 m** en el grafo local. El origen es `ACCESO_PRINCIPAL` (n5), destino `5` (n119). Los 443 m reportados desde la app no se reproducen con ese par en el JSON respaldado; pueden corresponder a otra copia/origen. La app instalada requiere recompilar para incorporar esta red.

Edificio 3 → Edificio 4: **74,53 → 56,44 m**, pasando por el interior de LAB. Una prueba quita el nodo del pasillo y verifica que la ruta vuelve a ser más larga.

## Validación

Desde `campus-escom/`: `node ../verificar-campus-escom.mjs`. Comprueba geometría, conectividad, IDs, X/Z, puertas próximas al borde, pasos cortos, rechazo de interiores no permitidos, longitudes, GLB/PNG, georreferencia y calibración. `node build.mjs` sincroniza `route-data.js` y el HTML autónomo; no exporta GLB/PNG. No ejecutar `generar-rutas.mjs --write` sobre esta edición.

Se corrigió la comprobación histórica que comparaba las apps con 53967de: ese commit precede a su integración de ESCOM. Se conserva la comparación histórica de los cinco campus UAM. Para comprobar archivos móviles contra un estado previo, se puede proporcionar `CAMPUS_ESCOM_PROTEGIDOS` con un manifiesto de objetos `{path,sha256}`; el verificador compara contenido, incluyendo cambios sin commit.

Respaldo previo, informe de conexiones y capturas del visor en `C:\Users\gabri\Downloads\1151055 Administracion\Proyecto\respaldo_rutas_escom_20261021\`. Durante la revisión se observaron ediciones simultáneas ajenas en `ReconocerActivity.kt` y `MainActivity.kt`; se conservaron. El manifiesto original documenta esas diferencias y no se debe reemplazar para ocultarlas.
