# UAM Xochimilco · croquis editable

## Fachadas y vista aérea · 18 octubre 2026

Las dos fotos aportadas por Gabriel se usan como referencias de aspecto desde ángulos diferentes. `architecture.js` añade concreto gris, aletas, alfeizares, paños acristalados y marcos azules. Las azoteas rojas se conservan; el volumen central A incorpora una interpretación del lucernario curvo visible en la toma aérea. No se asigna la torre con gráfico azul de la foto cercana a un edificio concreto sin confirmar su identidad.

«Fachadas azules · detalle» acerca un tramo de G hacia el patio Edén. La escala de pantalla se adapta al acercamiento; no modifica la escala de exportación. Hay 21 jacarandas editables aproximadas junto a los estacionamientos y floración en parte del arbolado existente. No representan un inventario de árboles.

Se conservan los 37 IDs, huellas, niveles, patios, estacionamientos, orientación y georreferencia del checkpoint anterior. El PNG sigue siendo 800×2120, con el mismo encuadre. Guardar cambios exporta los detalles en GLB y plano; la marca integrada conserva su bandera. GLB aproximado: 3,14 MB. Materiales y geometría locales, sin fotografías incrustadas ni descargas externas.

Abrir `Abrir_visor.cmd` (requiere Node.js). Dirección local:
http://127.0.0.1:8771/Visor_UAM_autonomo.html

37 volúmenes iniciales, patios Edén y Zapata, sector deportivo, velaria y estacionamientos. El PDF de Servicios Médicos guía la identificación; las huellas proceden de OSM y de trazos visuales sobre Esri. No es un levantamiento arquitectónico. Los nombres provisionales aparecen señalados en el selector. Los niveles de los edificios sin dato son estimados.

Arrastrar gira la cámara, rueda acerca y botón derecho desplaza. «Plano superior» muestra el norte arriba. Seleccionar un edificio permite cambiar niveles y posición. «Activar modo edición» permite mover árboles y estacionamientos y dibujar estacionamientos nuevos. Deshacer/rehacer conserva el historial de la sesión. «Guardar cambios» escribe conjuntamente:

- `campus_editado.json`: estado editable; se carga al iniciar el servidor.
- `UAM_Xochimilco.glb`: geometría en metros, eje Y vertical.
- `plano_2d.png`: plano ortográfico transparente, **800 × 2120 px**.

`georreferencia.json` contiene las tres esquinas latitud/longitud del PNG completo. No recortar, rotar ni redimensionar el plano sin recalibrarlo. El encuadre es X [-200,200], Z [-530,530], 2 px/m. Las coordenadas del JSON heredado usan `(px-895, py-390)` metros; GLB y puntos de calibración ya usan metros. La matriz de calibración se aplica al posicionamiento geográfico, no dos veces a la geometría.

«Copyright en la maqueta» controla `showCopyright`. Activado por defecto, incluye tres marcas dentro del GLB/PNG y un rótulo de esquina. Desactivarlo y guardar regenera ambos assets sin marca.

Fuentes, ambigüedades y precisión: `FUENTES.md`. Recalcular: `node calibracion/recalcular.mjs --write`; verificar sin escribir: el mismo comando sin `--write`. `calibracion/comprobacion.html` permite contrastar controles y huellas con la referencia satelital mediante un botón de carga; no se distribuye el raster.

`node build.mjs` reconstruye el HTML autónomo y `campus_base.json` desde `app.js`, `index.html`, `model-data.js` y `vendor/`. Después abrir el visor y pulsar «Guardar cambios» para regenerar GLB/PNG. El HTML puede abrirse sin servidor, pero en ese caso descarga los archivos y usa la base embebida; para persistir directamente en esta carpeta, usar el servidor local.

Integración móvil pendiente de Claude: copiar esta carpeta con el mismo contrato de las otras unidades y sustituir el mapa provisional de Xochimilco. No se modificaron las apps en esta entrega.
