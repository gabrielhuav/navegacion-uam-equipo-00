# Fuentes · UAM Lerma · consulta 18 octubre 2026

## Nomenclatura, plano y ubicación

- Mapa UAML publicado en septiembre de 2026, enlazado en la portada oficial: https://www.ler.uam.mx/UAML/wp-content/uploads/2026/09/mapaUAML.pdf
- Directorio de Espacios actual y equivalencias de nomenclatura: https://www.ler.uam.mx/DirectorioUAML/directorioservicios/
- Ubicación de servicios, versión 2024: https://www.ler.uam.mx/AlumnadoUAML/wp-content/uploads/2024/06/Ubicacion_servicios2.pdf
- Portada oficial, dirección Av. de las Garzas 10, El Panteón, Lerma, CP 52005: https://www.ler.uam.mx/UAML/

Se inspeccionaron ambas páginas PDF completas. El mapa 2026 contiene dos orientaciones del mismo predio; no se trataron como dos campus. No se midieron distancias sobre su esquema. Copias de consulta de los PDF preservadas en el respaldo final de esta entrega, fuera de los assets móviles.

## Fotografías y cambios en el tiempo

- Galería oficial de instalaciones: https://www.ler.uam.mx/UAML/instalaciones/
- Fotografía de fachada del directorio: https://www.ler.uam.mx/DirectorioUAML/wp-content/uploads/2024/07/AJG_1314.JPG-copia-1024x682.jpg
- Comunidad / Consejo Académico: https://www.ler.uam.mx/UAML_Comunidad/consejoacademico/
- Aérea de la cuenta oficial de Lerma, noviembre de 2021: https://x.com/UAM_Lerma/status/1462919313770307585
- Inauguración O/P, 25 noviembre 2021: https://www.comunicacionsocial.uam.mx/boletinesuam/586-21.html
- Renovación de cancha, 13 febrero 2025: https://www.ler.uam.mx/UAML_Comunicacion/nueva-cancha-nueva-energia/
- Primera piedra CIFE, 15 febrero 2024: https://www.ler.uam.mx/UAML_Comunicacion/investigacion-y-formacion-experimentacion/
- Estado de obras CIFE, informe RG de 100 días (2025), sección Unidad Lerma: https://www.uam.mx/informesrg/2025-2029/2025/informe-de-100-dias-de-gestion-rg-uam-2025.pdf
- Habilitación del primer nivel F, convocatoria 2026: https://www.uam.mx/obras/licitaciones/UAM_JA_RG_LP_03_2026/index.html
- Programa 2026 con referencia a habilitación de pisos de F: https://www.ler.uam.mx/UAML/wp-content/uploads/2026/04/PT-RHM.pdf
- Aviso de obra de fachada/accesos 2025–2026: https://www.ler.uam.mx/UAML/wp-content/uploads/2025/10/fachada-1.jpg

Trece imágenes concretas revisadas, con URL y observación en `investigacion/referencias.json`. El tablero carga imágenes externas opcionalmente mediante Internet; no se incorporan a GLB/PNG. No equivale a licencia para redistribuir las fotografías.

## Referencia geográfica y calibración

- OpenStreetMap, predio way 374595630: https://www.openstreetmap.org/way/374595630
- API de predio: https://api.openstreetmap.org/api/0.6/way/374595630/full
- API de edificios y contexto: https://api.openstreetmap.org/api/0.6/map?bbox=-99.5029,19.2900,-99.4940,19.2933
- Huellas usadas, con IDs/tags y sin usuarios o historial: `calibracion/huellas-osm.geojson`. La biblioteca adicional 1413063311 se registra dentro de la metadata de B2; no duplica su cuerpo.
- © OpenStreetMap contributors, ODbL: https://www.openstreetmap.org/copyright
- Esri World Imagery: https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer

El servicio Esri devolvió un raster 1800×1400 con extensión Web Mercator registrada en `georreferencia.json`; URL y fecha de consulta reproducibles. No se afirma fecha de captura ni se distribuye ese raster. Los tres trazos C/D/E conservan puntos píxel en `calibracion/trazos-satelital.json`.

Once controles visuales sobre diez edificios OSM, RMS interno 1,4046 m, máximo 3,0725 m. Mismo raster para contraste y trazos auxiliares: no validación independiente. Paralaje, alturas y fechas pueden introducir errores mayores. Sin controles GNSS ni puntos al extremo sur de Los Capulines. Ver discusión y decisiones en `INVESTIGACION.md`.

Recalcular/verificar: `node calibracion/recalcular.mjs --write` o sin `--write`. El HTML de comprobación dibuja controles y huellas; un botón permite solicitar el raster al proveedor. Las tres esquinas latitud/longitud del PNG completo se derivan del ajuste, no se suponen.

## Cuatro fotografías aportadas por Gabriel · 18 octubre 2026

- `codex-clipboard-a869e1ec-f50a-49f3-b4c4-8ae2152af389.png`: concreto claro, núcleos de cristal y rótulo blanco «SOY uam» con base morada.
- `codex-clipboard-f42be2cb-fe61-4409-a588-3871380d7e84.png`: conjunto alargado y cuerpos extremos desde el aire.
- `codex-clipboard-4ddf4345-8a04-41dc-93c0-b355f9196f05.png`: columnatas, ventanillas superiores, estacionamiento y remates lila suaves.
- `codex-clipboard-8a190740-52d4-4a56-bb40-103789bfbd63.png`: acercamiento al remate superior lila.

Complementan las 13 referencias web de la investigación previa. Se aplican a materiales y proporciones de fachada, sin recalibrar por perspectiva. Los tres remates añadidos a F/G son aproximaciones de aspecto; no constituyen un inventario medido de equipos de azotea ni confirman su uso.
