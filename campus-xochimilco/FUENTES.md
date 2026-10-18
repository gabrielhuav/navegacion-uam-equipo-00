# Fuentes y límites · consulta 18 octubre 2026

1. **UAM Xochimilco, Servicios Médicos — MAPA.pdf**:
   https://serviciosmedicos.xoc.uam.mx/archivos/MAPA.pdf
   Copia aportada por Gabriel: `C:/Users/gabri/Downloads/MAPA.pdf`, una página. Plano ilustrado en perspectiva con 59 entradas en su leyenda. Se usa para relacionar edificios, patios, canchas y velaria. NO se midieron distancias sobre su perspectiva ni se incluyeron su fondo, logotipos o ilustración en el modelo.
   SHA256 de la copia: `3631ba8f1f86efd5062d9ceebbd55e3310900982f95caebaf7e8d1f323b2a116`.
2. **UAM Xochimilco — ubicación oficial**:
   https://www.xoc.uam.mx/mapa/
   Dirección: Calzada del Hueso 1100, Villa Quietud, Coyoacán, CP 04960. El mapa embebido de esa página señala otra sede; no se usó ese centro para georreferenciar Xochimilco.
3. **OpenStreetMap — predio way 317456019**:
   https://www.openstreetmap.org/way/317456019
   API consultada: https://api.openstreetmap.org/api/0.6/map?bbox=-99.1052,19.2992,-99.1005,19.3090
   y https://api.openstreetmap.org/api/0.6/way/317456019/full
   © OpenStreetMap contributors, ODbL: https://www.openstreetmap.org/copyright
   `calibracion/huellas-osm.geojson` conserva los IDs y tags de las 33 huellas utilizadas; excluye usuarios e historial. Las demás cuatro huellas son trazos propios registrados en `trazos-satelital.json`.
4. **Esri World Imagery**, referencia visual cenital:
   https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer
   URL, extensión Mercator y tamaño 900×1800 del raster consultado en `georreferencia.json`. Fecha de consulta no implica fecha de captura. No se distribuye imagen satelital en el repositorio.

## Geometría y escala

Coordenadas OSM proyectadas a un plano métrico local Mercator corregido por cos(lat), centro 19.3042, -99.1029, dentro del predio comprobado. Cuatro huellas faltantes (A, M y dos anexos AC/AB) se trazaron sobre la referencia cenital. El predio mide aproximadamente 950 m de extremo a extremo; no se asignaron coordenadas a partir del PDF en perspectiva.

Calibración afín por mínimos cuadrados: 11 centros de envolventes repartidos en B, D, G, H, T, J, C, K, F, S y N, comparados visualmente contra el raster. RMS interno **2,18 m**, máximo **4,41 m**. Es un error de ajuste, NO exactitud absoluta independiente. Incertidumbre visual orientativa de 5–15 m por relieve, paralaje, antigüedad y segmentación; pendiente control de campo/GNSS. Datos y residuos reproducibles en `calibracion/puntos.json` y `recalcular.mjs`.

Las tres esquinas geográficas se calculan de ese ajuste para el encuadre completo del PNG 800×2120. El norte de la cámara usa esas esquinas; la exportación conserva +X a la derecha y -Z arriba.

## Identificaciones pendientes

- El PDF imprime «AC» tanto en 9 como en 15. Se distinguen `AC` y `AC_SECTOR_F` provisionalmente.
- OSM llama biblioteca al volumen que corresponde a J según la posición del PDF; este último marca A como punto de biblioteca/servicios. Se conserva el nombre original OSM en `osmName`, se sigue la nomenclatura del PDF en el croquis y se debe verificar el uso actual. No afirmar que esta discrepancia está resuelta.
- `BA_BB` es un conjunto sin separar. W, WBIS, U, Cómputo y los anexos AC/AB tienen asignaciones interpretativas señaladas en JSON/selector, pendientes del alumnado.
- Niveles OSM cuando existen; los demás son estimados. No se representan interiores, rutas accesibles, topografía ni puertas exactas. Las fachadas son bandas simples, y la velaria un volumen básico, no una reconstrucción fiel.

Estos límites forman parte de la entrega; mejorar el croquis no debe convertir las aproximaciones en mediciones declaradas.
