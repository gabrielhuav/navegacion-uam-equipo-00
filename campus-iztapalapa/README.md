# UAM Iztapalapa · Croquis inicial de Práctica 3

## Biblioteca · detalle visual del 18 octubre

La biblioteca conserva el identificador L, su huella y los cuatro niveles aproximados del croquis. `libraryDetails()` en app.js añade ventanal alto con retícula, franja superior de ventanas pequeñas, pórtico abierto bajo un dintel, plaza con juntas, jardineras y bancas. El recorte del cuerpo inferior produce el hueco del pórtico; la cubierta conserva el polígono original. El grupo se desplaza y cambia de altura con el edificio. «Biblioteca · detalle» acerca la cámara sin ocultar el resto del campus.

Referencia: fotografía aportada por Gabriel, codex-clipboard-f843c4a8-cb60-425d-9f11-f80c283107f9.png. Se interpreta la arquitectura; no se copian las palabras superpuestas «Biblioteca IZTAPALAPA». La textura del dintel es una alusión cromática propia, marcada como `notOriginalArtwork`, y no una reproducción del mural original. Una reproducción fiel requiere una imagen frontal del mural. Proporciones, altura y orientación de la fachada pendientes de campo. La foto no mejora la precisión geográfica.

JSON/base documentan la revisión en `architecture`; geometría y textura se regeneran desde app.js. Guardar cambios exporta el GLB y el plano con estos detalles. Se mantienen tamaño 1920×2000, encuadre/orientación del PNG y georreferencia. El resto de edificios sigue siendo un croquis básico por perfeccionar.

18 volúmenes aproximados; revisar huellas, nombres y niveles con el alumnado. No topográfico.

## Edificio T · Carlos Graef · CBI

Se corrigió su omisión: T y AT son edificios diferentes. El plano oficial de CSE ubica T entre el sector de biblioteca/posgrado y su anexo AT; el directorio institucional identifica el nombre Carlos Graef. T tiene PB + 3 pisos aproximados, con retícula clara de concreto y ventanales basada en la foto de Gabriel. «T · CBI» acerca la cámara. Se mantienen el identificador AT y sus datos.

Su envolvente se trazó visualmente sobre el raster Esri ya usado: `calibracion/trazo-T.json` conserva cuatro puntos píxel, extensión, transformación y polígono resultante. Conversión mediante inversa de la calibración afín existente; no agrega controles ni mejora el RMS. Es una huella simplificada, pendiente de levantamiento; incertidumbre visual orientativa 5–15 m. No se cambian los otros 17 edificios, el PNG 1920×2000 ni la georreferencia. El detalle se genera en `buildingTDetails()` y forma parte del GLB exportado.


## Abrir
Con Node.js instalado: Abrir_visor.cmd o node server.mjs. Abrir http://127.0.0.1:8770/Visor_UAM_autonomo.html.
Las bibliotecas locales están en vendor/; no se requiere instalar paquetes.

## Contrato de archivos
- campus_editado.json: estado editable que se carga primero.
- model-data.js: base alternativa; campus_base.json es su copia generada.
- UAM_Iztapalapa.glb: geometría 3D, sin marca ni herramientas.
- plano_2d.png: transparente, 1920×2000, marca temporal copyright @gabrielhuav en esquina.
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


## Copyright integrado y bandera

La marca «copyright @gabrielhuav» ahora pertenece a la maqueta: tres franjas grandes semitransparentes sobre el campus, exportadas dentro del GLB como grupo `Marca_copyright_modelo`. Se mantiene también el rótulo de esquina. Esta revisión sustituye las notas anteriores que excluían la marca del GLB.

En Capas, «Copyright en la maqueta» activa o quita todas las marcas. Pulsa Guardar cambios para actualizar JSON, GLB y PNG. La bandera persistente es `showCopyright`: `true` muestra la marca; `false` la retira, también de las imágenes y del GLB exportado. Si falta la propiedad en datos antiguos, se activa por defecto. Cambiar solo el JSON no modifica un GLB ya exportado: vuelve a abrir el visor y guarda. Deshacer/rehacer también conserva esta opción.

Para Claude: las apps pueden usar el GLB con el grupo integrado o regenerarlo con la bandera desactivada. Ocultar el grupo en un visor GLB requiere controlar el nodo `Marca_copyright_modelo`; este trabajo no modifica las apps. Huellas, niveles y georreferencia conservados; encuadre/tamaño de PNG sin cambios.
