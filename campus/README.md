# Campus UAM Azcapotzalco · modelo 2D/3D

## Serpentina II · frente al H, lado estacionamiento

Escultura esquemática basada en las dos imágenes de Gabriel: tronco y dos brazos con nueve cintas helicoidales rojas, claras y oscuras, ejes metálicos y plazoleta circular con anillos claros. `serpentinaH()` genera el grupo `Serpentina_II_frente_H_estacionamiento`. Su posición inicial `[824,265]` está frente al H del lado del estacionamiento, opuesto a COSEI; punto y medidas aproximados. No sustituye a la escultura de G.

Botón «Serpentina II · H» para acercar la cámara. Para acomodarla: Activar modo edición → Mostrar elementos: Escultura → Serpentina II · H / estacionamiento → mover/girar → Guardar cambios. ID estable `sculpture_serpentina_H`; posición inicial en `data.serpentina`, ajustes en `elementEdits`. Se exporta en GLB y PNG. El copyright conserva su bandera independiente. Su forma es una interpretación simplificada, no una réplica medida de la obra.

## Edificio T · referencia fotográfica del 18 octubre

`azcBuildingT()` en app.js interpreta las dos fotos aportadas por Gabriel: PB retranqueada con ventanales, cuerpo superior de concreto, galería y marquesina esquemática, escalera exterior de 18 peldaños con muro inclinado terracota y barandales rojos, rótulo rojo «t». El botón «T · Escalera exterior» acerca la cámara. El detalle forma parte de Edificio_T y sigue sus desplazamientos y altura; no altera su envolvente de referencia. La escalera se proyecta hacia el interior del campus, en el tramo libre junto a L, y se excluye esa zona del arbolado aleatorio. Se conserva `noStreetExit: true`, sin crear accesos hacia Eje 5 Norte.

Dimensiones de escalera y reparto de fachada son aproximados; las fotos parciales no determinan altura total ni orientación exacta. Se conservan los dos niveles existentes del croquis, el resto de edificios y la georreferencia. La referencia queda en `buildings[T].facadeReference` de los JSON/base. GLB y PNG 1560×640 reexportados con copyright activo; para inspeccionar los detalles puede desactivarse temporalmente desde Capas.

Fuente única del diseño del campus. La versión web (visor y editor) y la app móvil usan los mismos archivos:

| Archivo | Lo usa |
|---|---|
| `UAM_Azcapotzalco.glb` | app (vista 3D) y cualquier visor GLB |
| `plano_2d.png` | app (vista Mapa y 2D): el campus visto desde arriba, fondo transparente |
| `georreferencia.json` | app: esquinas del plano en latitud y longitud, para encimarlo en el mapa real |
| `campus_editado.json` | editor web (edificios, IDs) |
| `index.html`, `app.js`, `model-data.js`, `vendor/` | editor web (Three.js) |

## Editar el diseño (computadora)

Requiere Node.js. Desde esta carpeta:

```
node server.mjs
```

y abrir http://127.0.0.1:8768/Visor_UAM_autonomo.html. **Guardar cambios** actualiza `campus_editado.json`, el GLB y `plano_2d.png` aquí mismo; la app los copia al compilar. Si cambias `index.html`, `app.js` o `model-data.js`, corre `node build.mjs` para reconstruir el visor autónomo.

Si mueves o agrandas el campus completo, hay que recalibrar `georreferencia.json`. Las medidas son aproximadas: no es un levantamiento topográfico. Detalle técnico en `GUIA_PARA_CLAUDE.md` e historial en `LEEME.md`. Three.js: licencia MIT en `vendor/LICENSE_three.txt`.

## Memoria y réplica

Leer ../MEMORIA_COMPARTIDA_CAMPUS.md. Google Maps/Plano superior del visor web usan el norte de georreferencia.json. El límite de cámara web es 12° sobre el horizonte. Para actualizar la réplica de Descargas: node sincronizar-replica.mjs; se detiene si hay cambios locales divergentes. Guardar la web no actualiza una app ya instalada.

## Marca temporal

El visor y plano_2d.png llevan copyright @gabrielhuav en una esquina. Es capa de UI/canvas y no se exporta al GLB. No cambió el PNG de 1560×640 ni su encuadre/orientación/georreferencia. Al retirar la marca después, conservar esas dimensiones y límites.


## Copyright integrado y bandera

La marca «copyright @gabrielhuav» ahora pertenece a la maqueta: tres franjas grandes semitransparentes sobre el campus, exportadas dentro del GLB como grupo `Marca_copyright_modelo`. Se mantiene también el rótulo de esquina. Esta revisión sustituye las notas anteriores que excluían la marca del GLB.

En Capas, «Copyright en la maqueta» activa o quita todas las marcas. Pulsa Guardar cambios para actualizar JSON, GLB y PNG. La bandera persistente es `showCopyright`: `true` muestra la marca; `false` la retira, también de las imágenes y del GLB exportado. Si falta la propiedad en datos antiguos, se activa por defecto. Cambiar solo el JSON no modifica un GLB ya exportado: vuelve a abrir el visor y guarda. Deshacer/rehacer también conserva esta opción.

Para Claude: las apps pueden usar el GLB con el grupo integrado o regenerarlo con la bandera desactivada. Ocultar el grupo en un visor GLB requiere controlar el nodo `Marca_copyright_modelo`; este trabajo no modifica las apps. Huellas, niveles y georreferencia conservados; encuadre/tamaño de PNG sin cambios.
