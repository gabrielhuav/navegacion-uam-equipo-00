# UAM Lerma · visor y editor 2D/3D

## Ajuste fotográfico · remates lila y SOY uam

Las cuatro fotos aportadas por Gabriel el 18 octubre 2026 precisan el aspecto de F/G: concreto gris claro, ventanillas estrechas arriba, columnatas abajo, núcleos acristalados y pequeños volúmenes superiores lila desaturado. `buildings[F/G].architecture.roofAccents` describe esos remates; sus tamaños y posiciones son aproximados. No se tiñen de morado todas las fachadas ni se alteran los niveles del croquis.

Se conserva el rótulo blanco «SOY uam», como se escribe en la fotografía, sobre base morada en la explanada de G, con el mismo ID editable `landmark_soy_uam`. El nuevo botón «SOY uam · detalle» facilita revisarlo. Sigue siendo una representación ligera con texto en plano transparente, sin tipografía tridimensional extruida. La escala visual se adapta al acercamiento.

GLB y PNG reexportados; marca activa por defecto. Se conserva la misma georreferencia, los 20 edificios, huellas, niveles y PNG 1800×1240 sin recorte ni giro. GLB aproximado: 1,18 MB.

Abrir `Abrir_visor.cmd`, con Node.js instalado. Visor: http://127.0.0.1:8772/Visor_UAM_autonomo.html

20 volúmenes editables, conjuntos A/B de una planta, F/G con fachadas y alturas diferenciadas, C/D/E esquemáticos, biblioteca dentro de B2, canchas con arco, circulación, estacionamientos y Los Capulines. Nombres del mapa oficial 2026; `legacyId` conserva las equivalencias antiguas. Investigación, fuentes y limitaciones en `INVESTIGACION.md` y `FUENTES.md`.

## Uso

Arrastrar gira; rueda acerca; botón derecho desplaza. Las cámaras «Conjunto F y G», «Aulas y biblioteca» y «Los Capulines» acercan cada zona. «Campus completo» permite ver todo el predio; «Plano superior» coloca el norte arriba.

Seleccionar un edificio permite ajustar niveles y desplazamiento. El modo edición permite mover árboles, estacionamientos e hitos, dibujar estacionamientos, deshacer y rehacer. El rótulo SOY uam y las referencias esquemáticas de observatorio, espacio lúdico y kiosco son hitos editables. Sus posiciones son aproximadas; observatorio y kiosco no incluyen arquitectura inventada.

«Guardar cambios» escribe conjuntamente `campus_editado.json`, `UAM_Lerma.glb` y `plano_2d.png`. El servidor carga los datos editados al iniciar. Para modificar la base, editar `model-data.js` y reconstruir con `node build.mjs`; después abrir el visor y guardar para regenerar GLB/PNG.

`showCopyright` controla las tres marcas dentro de la maqueta y el rótulo de esquina. Casilla «Copyright en la maqueta». Desactivarla y guardar exporta GLB y PNG sin marca; cambiar solo JSON no modifica assets existentes.

## Contrato para móvil

- GLB en metros, eje Y vertical; PNG superior transparente **1800×1240**.
- Marco fijo X [-450,450], Z [-310,310], 2 px/m.
- JSON de editor con origen heredado `(px-895,py-390)`; GLB y controles de calibración ya están en metros.
- `georreferencia.json`: tres esquinas del PNG completo y ajuste afín reproducible. No recortar, girar ni cambiar tamaño del plano sin recalibrar.
- Calibración visual, RMS interno 1,40 m; no precisión GNSS ni levantamiento arquitectónico. Los niveles C/D/E y partes bajas F/G son aproximados.

`app.js` contiene editor, cámara, guardado y marca. `architecture.js` genera las características de Lerma, las fachadas, el arco y el entorno. `build.mjs` integra ambos y las dependencias locales en un HTML autónomo. Sin servidor, el HTML usa la base embebida y descarga los archivos al guardar; para escribir directamente aquí, usar el servidor local.

La integración en KMP/Flutter sigue a cargo de Claude. Copiar únicamente GLB (como modelo.glb), PNG y georreferencia con el contrato de las otras unidades; sustituir el placeholder de Lerma. Esta entrega no modifica las apps.

## Marca de agua repetida · cinco unidades

El checkpoint del 18 octubre 2026 combina tres bandas grandes con repeticiones distribuidas por la maqueta, en el color oficial de esta unidad y con opacidad 0,84. Se conserva la casilla `showCopyright`; Guardar cambios actualiza GLB, PNG y JSON. Configuración en `copyrightStyle`; distribución en `copyright-layout.js`. Detalles, colores, pruebas e instrucciones para móvil en `../COPYRIGHT_CAMPUS.md`. No cambia la georreferencia, escala ni encuadre del plano.
