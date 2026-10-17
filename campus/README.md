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
