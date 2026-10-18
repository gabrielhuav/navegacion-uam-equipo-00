# Campus UAM Azcapotzalco · modelo 2D/3D

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
