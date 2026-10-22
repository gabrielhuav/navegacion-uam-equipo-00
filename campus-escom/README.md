# ESCOM · IPN · maqueta editable

Carpeta canónica independiente de las cinco UAM. No sustituye `campus/`. Abre `Abrir_visor.cmd` o ejecuta `node server.mjs` y visita http://127.0.0.1:8782/Visor_UAM_autonomo.html.

## Archivos compartidos con la app

| Archivo | Uso |
|---|---|
| `campus_editado.json` | Estado editable, geometría, niveles, posiciones y bandera `showCopyright` |
| `ESCOM_IPN.glb` | Maqueta 3D exportada; marca azul integrada en `Marca_copyright_modelo` |
| `ESCOM_IPN_sin_marca.glb` | Mismo campus sin el grupo de copyright |
| `plano_2d.png` | Vista superior transparente con marca, 1220×1420 |
| `plano_2d_sin_marca.png` | Mismo encuadre y resolución, sin marca |
| `georreferencia.json` | Tres esquinas lat/lon y metadatos de calibración |
| `rutas.json` | Red peatonal PB: 173 nodos, 233 tramos, 19 destinos |

Guardar cambios valida la red y guarda los seis assets y rutas. El HTML portátil incorpora datos base y dependencias; por HTTP carga el JSON guardado. Fuera del servidor, los botones descargan archivos en lugar de escribir la carpeta. `node build.mjs` reconstruye el HTML con el estado de rutas vigente; **no** exporta GLB/PNG.

## Herramientas

- Edificio: escogerlo o tocarlo, consultar su plano oficial, cambiar niveles/desplazamiento.
- Acomodar el campus: mover/girar bandera, rótulo, árboles y estacionamientos; dibujar estacionamientos nuevos; deshacer/rehacer.
- Red peatonal: ver nodos y aristas, añadir/mover/unir, dividir tramos, cambiar tipos y asignar destinos. Guardar rechaza aristas que corten cuerpos cerrados fuera de las franjas PB explícitas, destinos ausentes y redes desconectadas.
- Copyright: casilla persistente `showCopyright`, texto repetido azul `#006699` como aproximación digital de la identidad visual ESCOM; no es un color oficial UAM. Las variantes sin marca se regeneran siempre, aunque la casilla esté activada.

El terreno usa X/Z, altura Y, metros aproximados. Los puntos del JSON conservan la convención del editor: `x=px−895`, `z=py−390`. Plano: X=[−150,155], Z=[−185,170], 4 px/m. El norte lo determina la georreferencia. No cambiar los límites ni la resolución sin recalibrar.

## Cobertura y precisión

Edificios 1–5 y LAB: PB + P1 + P2 **documentados** por siete planos oficiales de 2022. Gobierno: PB/P1 con patio abierto y biblioteca integrada. Auditorio, cafetería y barra de café incluidos. Las alturas de entrepiso, fachadas, puentes, jardines, mobiliario y límite del predio son interpretaciones aproximadas. Se modela un pasillo interior de PB en Laboratorios que conecta los edificios 3 y 4, confirmado por Gabriel; el resto de interiores e instalaciones ocultas no se modela. Los nombres de espacios de 2022 no garantizan su uso actual.

Ocho esquinas OSM/imagen Esri: RMS interno **0,816 m**, máximo en `georreferencia.json`. Es un ajuste entre referencias, no precisión absoluta independiente. Incertidumbre orientativa **5–12 m**, no medida en campo. [Fuentes, discrepancias y límites](FUENTES.md), [referencias visuales](referencias.html).

La red es un **borrador de circulación PB**, no una red de evacuación ni una certificación accesible. `accesible=false` hasta revisión de campo. Los accesos Principal y Gobierno se contrastaron con imagen/OSM y fotos; la apertura actual del acceso de cafetería está pendiente. Biblioteca, Gestión y Servicios de Salud comparten el acceso exterior de Gobierno, no una ruta interior simulada.

## Comprobación y regeneración

`node ../verificar-campus-escom.mjs` verifica contrato, niveles, exportaciones, georreferencia, calibración, grafo y casos inválidos. `node generar-rutas.mjs` calcula la red inicial sin guardar; `--write` reemplaza `rutas.json`, por lo que sólo debe usarse para regenerar la base, no sobre ediciones del usuario. Las desviaciones alrededor de edificios se calculan en el generador; revisar recorridos reales antes de uso en navegación.

ESCOM ya está integrado en las apps; ver la memoria compartida para el trabajo móvil vigente. Slug estable `escom`; conservar nombres/IDs. Los assets sólo llegan a una app instalada al recompilar y reinstalar. La revisión de la red del 21 octubre no modifica código móvil.

## Revisión peatonal del 21 octubre

[Decisiones, pasos PB, puertas, distancias y verificación](RUTAS.md). Se preservan los 19 IDs de destino y todos los X/Z. Acceso principal → Edificio 5: **169,25 m** frente a **353,56 m** del JSON previo (los 443 m observados en móvil no corresponden a ese par de nodos en el archivo respaldado). Puertas aproximadas junto al acceso de referencia; comprobación de campo pendiente. Los puentes P1/P2 permanecen visuales: no se simulan como conexiones PB.

El pasillo interior de Laboratorios conecta 3 y 4: **56,44 m** entre sus destinos, frente a 74,53 m por el exterior. Se conservan el destino LAB, los demás IDs y X/Z. Su existencia está confirmada por Gabriel; eje y ancho se representan de forma aproximada.
