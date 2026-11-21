# Metodología e Instrucciones para Agentes de IA · Mejora del Mapa y Modelo 2D/3D de UAM Azcapotzalco

Este documento describe paso a paso la metodología técnica, las invariantes geométricas, el flujo de contraste con el corpus fotográfico y el protocolo de exportación/verificación para que cualquier agente de IA (Claude, Codex, Gemini, etc.) pueda seguir detallando el modelo 2D/3D de **UAM Azcapotzalco** sin romper los contratos con las apps móviles (`app-kmp/` y `app-flutter/`) ni los comprobadores automáticos.

---

## 1. Reglas de oro y arquitectura de archivos

1. **Lectura obligatoria antes de tocar código:**
   - `AGENTS.md`
   - `MEMORIA_COMPARTIDA_CAMPUS.md`
   - `campus/README.md`
   - `campus/RUTAS.md`
2. **Separación entre archivos fuente y archivos generados en `campus/`:**
   - **Fuentes editables manualmente:**
     - `campus/app.js` — Lógica Three.js, generadores arquitectónicos 3D, cámaras, editor y exportador.
     - `campus/model-data.js` — Estado canónico `ORIGINAL` (debe mantenerse sincronizado con `campus_editado.json` cuando se actualizan niveles o metadatos base).
     - `campus/campus_editado.json` — Estado persistido del campus (`version: 8`, `showCopyright: true`, `buildings`, `plazas`, `paths`, `parking`, `gates`, esculturas y `elementEdits`).
     - `campus/index.html` — Plantilla HTML del visor (botones de cámara, paneles y controles).
   - **Artefactos generados (NUNCA editar a mano como fuente):**
     - `campus/Visor_UAM_autonomo.html` y `campus/campus_base.json` — Generados por `node campus/build.mjs`.
     - `campus/UAM_Azcapotzalco.glb`, `campus/UAM_Azcapotzalco_sin_marca.glb`, `campus/plano_2d.png` y `campus/plano_2d_sin_marca.png` — Exportados **exclusivamente** desde el visor web ejecutando `saveEditorChanges(true)` (botón `#saveChanges` / «Guardar cambios») con `campus/server.mjs` activo.
3. **Invariantes que NO deben alterarse sin orden explícita:**
   - `campus/georreferencia.json` (`ancho: 1560`, `alto: 640`, esquinas GPS calibradas y `metrosPorUnidad: 1.0895`).
   - Encuadre ortográfico del plano 2D en `campus/app.js`:
     ```js
     const PLANO = { xMin: -390, xMax: 390, zMin: -150, zMax: 170, pxPorMetro: 2 };
     ```
     Esto produce exactamente un PNG de `(390 - (-390)) * 2 = 1560 px` por `(170 - (-150)) * 2 = 640 px`.
   - `campus/rutas.json`: **115 nodos**, **120 aristas no dirigidas** y **31 destinos** (incluyendo `T` en `n89`, compartido con `uam_azcapotzalco_extras.json`). **Nunca ejecutar `node campus/generar-rutas.mjs --write`** porque sobrescribiría la red curada manualmente.

---

## 2. Sistema de coordenadas: Píxeles `(px, py)` ↔ Metros `(X, Y, Z)` ↔ GPS `(lat, lon)`

### 2.1. Conversión del croquis `(px, py)` al mundo 3D `(X, Y, Z)`
En `campus/app.js`:
```js
const S = () => data.metersPerPixel; // 740/1670 = 0.4431137724550898 unidades de modelo/px
const X = px => (px - 895) * S();    // Eje X del modelo; los cardinales se obtienen de georreferencia.json
const Z = py => (py - 390) * S();    // Eje Z del modelo; no equivale por sí solo a norte/sur geográfico
```
- **`Y`** es la elevación vertical en metros (`data.storeyHeight = 3.3 m` por nivel; suelo base en `Y ≈ 0`).
- Un rectángulo `[x1, y1, x2, y2]` en `b.rects` tiene:
  - Ancho (eje X): `w = (x2 - x1) * S()`
  - Fondo (eje Z): `d = (y2 - y1) * S()`
  - Centro en el mundo: `x = X((x1 + x2) / 2)`, `z = Z((y1 + y2) / 2)`
- Dentro del grupo local `part` (`b.id + '_volumen_' + idx`), las coordenadas son **relativas al centro `(x, 0, z)` del rectángulo**:
  - Lado -Z del modelo: `z = -d / 2`
  - Lado +Z del modelo: `z = +d / 2`
  - Lado -X del modelo: `x = -w / 2`
  - Lado +X del modelo: `x = +w / 2`

### 2.2. Cómo cruzar con OpenStreetMap (Overpass API) sin alterar `georreferencia.json`
Para comparar cualquier huella del modelo contra OpenStreetMap, invierte el modelo afín de 3 esquinas (`superiorIzquierda`, `superiorDerecha`, `inferiorIzquierda`) de `georreferencia.json` y convierte el píxel del PNG `(u, v)` (en `1560×640`) a coordenadas de modelo `(px, py)`:
```js
// u in [0, 1560], v in [0, 640]
const worldX = -390 + u / 2;
const worldZ = -150 + v / 2;
const modelPx = worldX / data.metersPerPixel + 895;
const modelPy = worldZ / data.metersPerPixel + 390;
```

---

## 3. Cómo explotar el corpus fotográfico etiquetado (`solo_caras`)

El corpus derivado autorizado reside en `entrenamiento/corpus/uam/solo_caras/`.

1. **Filtrado correcto de `corpus/manifiesto.csv`:**
   - La columna **índice 2** (`clase_modelo`) agrupa las clases del clasificador (`T`, `I`, `G`, `W`, `P2`, `otro`, `interior`, `excluida`).
   - La columna **índice 3** (`etiqueta_confirmada`) contiene la **etiqueta real confirmada de edificio/zona** (`T`, `I`, `COSEI`, `G`, `P4`, `W`, `P2`, `Q`, `P1`, `HO`, `E`, `plaza_roja`, `M`, `H`, `S`, `J`, `P3`, `A`, `R`, `area_deportiva`, `L`, `F`).
   - Comando rápido para listar las imágenes confirmadas por edificio:
     ```powershell
     node -e "const fs=require('fs');const lines=fs.readFileSync('entrenamiento/corpus/uam/solo_caras/corpus/manifiesto.csv','utf8').trim().split(/\r?\n/);const by={};for(const l of lines.slice(1)){const c=l.split(',');(by[c[3]]??=[]).push(c[0]+(c[4]==='True'?'(int)':c[5]?'(excl:'+c[5]+')':''));}console.log(by);"
     ```
2. **Qué extraer de cada fotografía al modelar en 3D:**
   - **Número real de niveles (`floors`)** y proporción entre macizos y vanos.
   - **Sistema estructural visible:** columnas cilíndricas vs. pilastras rectangulares, arriostramientos diagonales, cerchas tubulares rojas, vigas de entrepiso, ménsulas, domos o cubiertas abovedadas.
   - **Accesos peatonales:** escalinatas (contando peldaños visibles), rampas de concreto (orientación, muretes laterales, barandales simples o dobles), pórticos retranqueados, portones industriales (`TMEC`) o ventanillas en zigzag (`CSE` en `T`).
   - **Señalética y mobiliario:** letras volumétricas rojas en minúscula/mayúscula (`t`, `i`, `2P`, `j`, `e`, `r`), tótems de cicloestacionamiento, bancas corridas o curvas, jardineras circulares, mesas hexagonales, luminarias de poste rojo con globo y esculturas.
3. **Restricciones del corpus:**
   - No inventar coordenadas GPS a partir de las fotos (no tienen EXIF).
   - Modelar las rampas visualmente en 3D en `app.js`, pero **no cambiar `accesible: false` a `true` en `rutas.json`** mientras no exista levantamiento físico de pendiente y ancho libre en campo.

---

## 4. Patrones de diseño 3D en `campus/app.js`

### 4.1. Primitivas y memoria
- Usa siempre `box(parent, name, x, y, z, w, h, d, color)` y `slab(parent, rect, color, y, height, name)` para que las mallas compartan las geometrías base (`cube`, `cylinder`, `crown`) y la caché de materiales `matCache`.
- Si creas una textura dinámica con `document.createElement('canvas')` + `new THREE.CanvasTexture(canvas)` (por ejemplo, para un rótulo como `T_rotulo_rojo` o `P2_rotulo_rojo_2P`), **marca `mesh.userData.disposeMaterial = true`** en exactamente una malla que use ese material para que `generate()` libere la textura al reconstruir la escena.
- Si necesitas una cubierta curva abovedada (como `T_cubierta_curva_galeria`), prefiere extruir un arco con grosor real (`new THREE.Shape()` con `absarc` exterior e interior + `THREE.ExtrudeGeometry`) y material estándar opaco antes que un `CylinderGeometry` abierto de grosor cero, para evitar que se vea de canto o desaparezca según el ángulo de cámara.

### 4.2. Cómo abrir pasos peatonales a través de un edificio (ejemplo: Edificio `G`)
- Por defecto, `building(b)` crea una caja continua `Cuerpo de concreto` de largo `d` y ventanas continuas `Ventana_lateral_nivel_0`, lo que bloquea cualquier paso transversal en planta baja.
- Para que un pasaje central se vea y cruce de lado a lado (como el paso central de **1 solo cuadro (`bay === 3` de 7)** entre **Plaza COSEI** y **Plaza Roja** en `azcBuildingG`):
  1. Divide el cuerpo de PB y niveles superiores en dos bloques (`Cuerpo_PB_norte_G` de `-d/2` a `z0` y `Cuerpo_PB_sur_G` de `z1` a `+d/2`), dejando libre el vano central `[z0, z1]`.
  2. Divide también las tiras de ventanas laterales (`Ventana_lateral_norte_nivel_f` y `Ventana_lateral_sur_nivel_f`) y los faldones de concreto (`G_dintel_concreto_G`) para que no crucen `[z0, z1]`.
  3. Añade el piso del andador pasante (`G_andador_paso_central`), las rampas de transición en ambos frentes (`G_rampa_paso_central`) y los canceles laterales dentro del túnel (`G_cancel_acceso_tunel`).

### 4.3. Cómo añadir alas, escaleras o patios sin romper `route-space.js`
- `campus/route-space.js` calcula colisiones de aristas peatonales contra los rectángulos `b.rects` de `campus_editado.json` (con margen de `1.2 m`).
- Si un edificio tiene un pórtico saliente, escalinata exterior, rampa o ala en columnas (como el ala norte de `T` o el patio cubierto de `P4`) que se acerca a un andador de `rutas.json`, **modélalo como geometría hija dentro de `part` en `app.js` sin expandir `b.rects` en `campus_editado.json`**, verificando que `routeIssues(net, data, geo)` siga devolviendo `[]`.

### 4.4. Diseño de estacionamientos, vialidades y prevención del aliasing subpíxel en `plano_2d.png`
1. **Por qué desaparecen líneas delgadas en el plano 2D (`1560×640`, `2 px/m`) y cómo evitarlo:**
   - En `planoBlob()`, la cámara ortográfica cenital renderiza `780 m × 320 m` en `1560×640 px`, donde **`1 píxel = 0.50 m`**.
   - Si se dibujan líneas de cajón muy delgadas (p. ej. `0.055 m = 0.11 px`) con un paso constante múltiplo exacto de `0.50 m` (como `2.50 m = 5.0 px`), todas las líneas de un mismo estacionamiento comparten exactamente la **misma fase subpíxel** `((X + 390) * 2) mod 1`. Cuando esa fase no coincide con el centro de muestreo del píxel, **desaparecen el 100 % de los cajones de ese estacionamiento en `plano_2d.png`**.
   - **Regla técnica obligatoria:**
     - Usar un grosor mínimo de **`0.26 a 0.28 m` (`> 0.5 px`)** para líneas de cajón (`Cajón`), cabeceras de batería (`Linea_cabecera_bateria`) y líneas discontinuas de carril (`Linea_carril_vial`), y **`0.48 m` (`~1 px`)** para guarniciones perimetrales (`Guarnicion_estacionamiento`).
     - Usar un ancho de cajón de **`2.70 m` (`5.4 px`)** para que la fase subpíxel rote cajón tras cajón y nunca sufra aliasing periódico.
     - Mantener una jerarquía estricta de alturas `Y` para evitar *z-fighting*: `Asfalto` (tope en `y = 0.27 m`) < `Carril_circulacion_interna` (`y = 0.297 m`) < `Cajon_accesible_azul` (`y = 0.307 m`) < `Linea_carril_vial` (`y = 0.33 m`) < `Cajón` / `Linea_cabecera_bateria` (`y = 0.345 m`) < `Tope_cajon` (`y = 0.39 m`) y `Guarnicion_estacionamiento` (`y = 0.39 m`).
2. **Arquitectura de `parkingArea(r, id, title)` y `vialidadEstacionamientos()`:**
   - Conservar intactos los 7 rectángulos `data.parking` (`parking_0..6`) registrados con `registerEditable(id, title, 'parking', group, { width: w, depth: d })` para cumplir `verificar.mjs` (`rear = [0,1,2,5,6]` conectados) y `verificar-editor.mjs`.
   - Usar la función de exclusión espacial `blocked(lx, lz)` dentro de `parkingArea` para no trazar cajones, topes ni camellones encima de:
     - Edificios (`Edificio A` dentro de `parking_0`, delimitado con su propia `Explanada_obra_A` y `Guarnicion_obra_A`; `H`, `HO`, `HP`);
     - Plazas circulares de esculturas (`Serpentina II` en `[824, 265]`, `Casa abierta al tiempo` y `Universitas` en `parking_2`);
     - Los carriles troncales de circulación norte (`py ∈ [190, 214]`) y sur (`py ∈ [616, 638]`).
   - En `vialidadEstacionamientos()` se enlazan las 3 puertas vehiculares (`V1`, `V2`, `V3`, cada una con `Caseta_vigilancia_V*` y `Pluma_vehicular_V*`), el estacionamiento oriente frente a `W` y `R` (`Estacionamiento_W_R` con guarnición amarilla y tambos naranjas según `imagen_0060.png`), y los pasos peatonales tipo cebra (`Paso_peatonal_estacionamiento`) en las entregas de los andadores.

---

## 5. Nombres de nodos GLB obligatorios (Checklist para no romper verificadores)

Los scripts `campus/verificar.mjs`, `campus/verificar-compartido.mjs`, `campus/verificar-esculturas.mjs` y `verificar-rutas.mjs` inspeccionan el árbol de nodos exportado en `UAM_Azcapotzalco.glb`. Asegúrate de conservar siempre estos nodos y cantidades:

| Edificio / Grupo | Nodos y condiciones exigidas por los verificadores |
|---|---|
| **Todos los edificios (26)** | Nodo raíz `Edificio_<id>` con `extras.floors === building.floors`. |
| **G (`Edificio_G`)** | Grupo `Refuerzos_estructurales_G` con 2 hijos `Fachada_reforzada_Plaza_Roja` y `Fachada_reforzada_COSEI`; cada fachada debe tener **`>= 40` nodos llamados `Diagonal_roja_G`** (actualmente 48 por cara: 6 crujías × 4 pisos × 2 pares de diagonales). |
| **T (`Edificio_T`)** | `noStreetExit: true`; grupo `T_AZC_fachada_y_escalera`; **`>= 12` nodos `T_peldano_exterior`** (18 peldaños); `T_pasamanos_rojo_escalera`, `T_muro_inclinado_terracota`, `T_barandal_rojo_galeria`, `T_marquesina_curva_aproximada`, `T_rotulo_rojo`, `T_explanada_interior`. |
| **HO y HP (`pavilion`)** | `floors: 4`; `extras.facadeFacing === 'parking'`, `Math.cos(extras.facadeYaw) < 0`; exactamente **4 nodos `Antepecho_curvo_`** (`0..3`), **2 nodos `Cubierta_translúcida_superior`** con `alphaMode === 'BLEND'`, al menos un `Cercha_amarilla` y ningún `Remate cuadrado`. |
| **Uniones y pasillo (`H/HO/HP`, `P-K-H-E-C`)** | `Conexion_integrada_HO_H` y `Conexion_integrada_HP_H` con `Losa_PB`, `Losa_piso_1`, `Losa_piso_2`; `Pasillo_P_K_H_E_C` con 4 hijos `Tramo_*` continuos y sin `Enlace_*`, `Columna_del_pasillo` ni `Cubierta_del_pasillo`. |
| **Plaza COSEI e `I`** | `Plaza_COSEI_detalle` (`extras.library === 'I'`), exactamente **6 nodos `Escalón_COSEI_1..6`** con cotas crecientes hasta `baseElevation + rise`, **2 nodos `Jardinera_COSEI_0..1`**, `Asta_bandera_COSEI` (`height: 18`), `Mástil` de `18 m` y `Bandera_México` con textura PNG incrustada en `bufferView`. |
| **Esculturas y elementos COSEI** | `Escultura_lado_COSEI_G`, `Serpentina_II_frente_H_estacionamiento` (9 `Cinta_Serpentina_*`), `Habitaciones_de_Luz_B` (6 `Estela_Habitaciones_*`), `Universitas_HP` (2 `Prisma_Universitas_*` + 4 `Aro_rojo_Universitas_*`), `Casa_abierta_al_tiempo_HP` (7 `Placa_roja_Casa_abierta_*`), `Escultura_vidrio_COSEI`, `Letras_SOY_UAM_COSEI`, `Caracol_COSEI` y 8 `Jacaranda_Plaza_Roja_0..7`. |
| **Copyright (`showCopyright: true`)** | Grupo `Marca_copyright_modelo` con 33 paneles `Copyright_integrado_0..32` orientados según `campusNorth(georeference)`. La diferencia de nodos entre `UAM_Azcapotzalco.glb` y `UAM_Azcapotzalco_sin_marca.glb` debe ser **exactamente `34` nodos** (`1` grupo + `33` paneles). |

---

## 6. Protocolo paso a paso para exportar y verificar cambios

Cada vez que modifiques `campus/app.js`, `campus/model-data.js`, `campus/campus_editado.json` o `campus/index.html`, ejecuta este flujo completo:

### Paso 1: Comprobar sintaxis y construir el visor autónomo preliminar
```powershell
node --check campus/app.js
node campus/build.mjs
```

### Paso 2: Exportar GLB y PNG sincronizados desde el visor real (WebGL + `server.mjs`)
El visor utiliza `THREE.GLTFExporter` y un `THREE.WebGLRenderer` ortográfico en el navegador para generar los archivos `UAM_Azcapotzalco.glb`, `plano_2d.png` y sus variantes `_sin_marca` y enviarlos por `POST /guardar/*` a `campus/server.mjs`.
- Asegúrate de que `showCopyright` esté en `true` al pulsar `#saveChanges` (`Guardar cambios`).
- Si necesitas tomar capturas limpias de fachadas sin los paneles flotantes de copyright, desmarca `#copyrightToggle` **después** de haber guardado los archivos, toma las capturas y ejecuta `#editUndo` para regresar a `Sin cambios pendientes.`.

### Paso 3: Reconstruir `Visor_UAM_autonomo.html` y preservar saltos de línea CRLF en rutas
```powershell
node campus/build.mjs
# Conservar rutas.json sin cambios; build.mjs conserva route-data.js si sólo difieren saltos de línea.
```
No restaurar archivos con Git para limpiar diferencias: podría borrar cambios ajenos. Comparar contra el respaldo y conservar los bytes originales sólo cuando la red no haya cambiado.

### Paso 4: Ejecutar la batería de verificadores
```powershell
node campus/verificar-compartido.mjs
node campus/verificar.mjs
```
- **Nota sobre `verificar-rutas.mjs` y `campus/verificar-esculturas.mjs`:**
  - `verificar-rutas.mjs` incluye en la línea 13 una comparación histórica (`git show cefdd81:campus/campus_editado.json`) que falla siempre que `campus_editado.json` tenga cambios posteriores al commit `cefdd81`. No borres esa línea para ocultarlo; verifica que todas las demás aserciones del archivo (`routeIssues === []`, 115 nodos, 120 aristas, 31 destinos, pruebas negativas, Dijkstra y diferencia de 34 nodos de copyright) pasen sin error.


## Revisión Codex · 17 noviembre 2026

- Escala real de los datos: `metersPerPixel = 740/1670 = 0.4431137724550898`. Las unidades del modelo no son una nueva medición física. No aplicar la cifra 0.375 que contenía la versión inicial de esta guía ni inferir cardinales de X/Z; usar las esquinas geográficas y `campusNorth`.
- Georreferencia, huellas e IDs, siete estacionamientos y red peatonal permanecen intactos. Los detalles de geometría también deben respetar los accesos: no basta comprobar rutas contra los rectángulos si un antepecho o un volumen nuevo invade el recorrido.
- Las reglas de trazo mínimo y separación 2.7 son de legibilidad en el PNG, no un levantamiento del número o posición de cajones. No ubicar automáticamente plazas reservadas como si estuvieran verificadas.
- No seguir las antiguas instrucciones de automatización por consola del navegador o restauración con `git checkout`. Para esta revisión se utiliza el visor y sus botones, se conservan respaldos y se verifican los exports generados.
- La carpeta original de Gemini y su documentación se conservan en el respaldo previo. Los cambios de este trabajo y su evidencia se detallan en `EVIDENCIA_DETALLES_2026-11-17.md` y el informe de revisión del mapa.
