# Campus UAM Azcapotzalco · modelo 2D/3D

Fuente única del diseño del campus. La versión web (visor y editor) y la app móvil usan los mismos archivos:

| Archivo | Lo usa |
|---|---|
| `UAM_Azcapotzalco.glb` | app (vista 3D) y cualquier visor GLB |
| `campus_editado.json` | editor web y app (edificios, IDs) |
| `index.html`, `app.js`, `model-data.js`, `vendor/` | editor web (Three.js) |

## Editar el diseño (computadora)

Requiere Node.js. Desde esta carpeta:

```
node server.mjs
```

y abrir http://127.0.0.1:8768/Visor_UAM_autonomo.html. **Guardar cambios** actualiza `campus_editado.json` y el GLB aquí mismo. Si cambias `index.html`, `app.js` o `model-data.js`, corre `node build.mjs` para reconstruir el visor autónomo.

Las medidas son aproximadas: no es un levantamiento topográfico. Detalle técnico en `GUIA_PARA_CLAUDE.md` e historial en `LEEME.md`. Three.js: licencia MIT en `vendor/LICENSE_three.txt`.
