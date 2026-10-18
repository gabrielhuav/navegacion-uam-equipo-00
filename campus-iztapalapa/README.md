# UAM Iztapalapa · Croquis inicial de Práctica 3

17 volúmenes aproximados; revisar huellas, nombres y niveles con el alumnado. No topográfico.


## Abrir
Con Node.js instalado: Abrir_visor.cmd o node server.mjs. Abrir http://127.0.0.1:8770/Visor_UAM_autonomo.html.
Las bibliotecas locales están en vendor/; no se requiere instalar paquetes.

## Contrato de archivos
- campus_editado.json: estado editable que se carga primero.
- model-data.js: base alternativa; campus_base.json es su copia generada.
- UAM_Iztapalapa.glb: geometría 3D, sin marca ni herramientas.
- plano_2d.png: transparente, 1920×2000, marca temporal © @gabrielhuav en esquina.
- georreferencia.json: tres esquinas lat/lon, RMS y procedencia.
- index.html/app.js: interfaz y generador. node build.mjs recompone el HTML autónomo; no exporta GLB/PNG.

Guardar cambios exporta JSON, GLB y PNG. Hay edición de niveles/desplazamiento de edificios y herramientas para árboles/estacionamientos, con deshacer/rehacer.
Sin servidor se descargan los archivos; recuperarlos con Abrir datos guardados.
Los polígonos usan buildings[].polygons; rects conserva las envolventes. Suelo X/Z, altura Y; X=px-895, Z=py-390 (metersPerPixel=1).
La vegetación es ilustrativa. Las alturas suponen 3.3 m por nivel; no resuelven sótanos ni topografía.

## Calibración
10 puntos en 10 volúmenes observados: RMS interno 3.58 m; máximo 5.47 m.
No es exactitud absoluta: algunas huellas y controles proceden de la misma imagen. Sin GNSS; incertidumbre visual orientativa 5–15 m.
Ver calibracion/puntos.json y FUENTES.md. node calibracion/recalcular.mjs comprueba el ajuste; --write actualiza georreferencia tras corregir puntos.
Conservar tamaño, encuadre y orientación del PNG o recalibrar deliberadamente.

## Mejorar y entregar
Corregir fuentes/datos, ejecutar node build.mjs, recargar y Guardar cambios. El JSON guardado tiene prioridad: no perder las correcciones del alumnado al cambiar la base.
Copiar esta carpeta completa al repositorio del equipo. campus/ sigue siendo Azcapotzalco y las apps aún copian solo esa ruta; aquí no se modificó su integración.
Datos derivados de © OpenStreetMap contributors, ODbL 1.0 (conservar atribución y licencia). Código según licencia del repositorio; bibliotecas según vendor.
