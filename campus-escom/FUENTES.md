# Fuentes y decisiones · ESCOM · 20 octubre 2026

## Referencias primarias consultadas

1. [Ubicación oficial ESCOM](https://www.escom.ipn.mx/htmls/conocenos/ubicacion.php): identificación del plantel de Zacatenco, Av. Juan de Dios Bátiz y Miguel Othón de Mendizábal. No se confundió con CIC/CIDETEC, que aparecen en la misma vista satelital pero no se incorporaron como edificios ESCOM.
2. [Sede ICPC México 2026](https://finals2026.icpcmexico.org/sede), organizador del evento: croquis general, fotografía de Laboratorios, existencia de Edificio 5 y uso de su sótano. [Croquis en alta resolución](https://finals2026.icpcmexico.org/_astro/escom-croquis.CZRTYkfH.jpg). Se decodificaron sus siete QR y se consultaron todos los planos enlazados.
3. Planos oficiales ESCOM 2022: [1](https://www.escom.ipn.mx/docs/conocenos/ubicacion/croquisESCOM2022_edificio1.png), [2](https://www.escom.ipn.mx/docs/conocenos/ubicacion/croquisESCOM2022_edificio2.png), [3](https://www.escom.ipn.mx/docs/conocenos/ubicacion/croquisESCOM2022_edificio3.png), [4](https://www.escom.ipn.mx/docs/conocenos/ubicacion/croquisESCOM2022_edificio4.png), [5](https://www.escom.ipn.mx/docs/conocenos/ubicacion/croquisESCOM2022_edificio5.png), [Laboratorios](https://www.escom.ipn.mx/docs/conocenos/ubicacion/croquisESCOM2022_edificioLabs.png), [Gobierno](https://www.escom.ipn.mx/docs/conocenos/ubicacion/croquisESCOM2022_edifGobierno.png). Confirman PB/P1/P2 de las aulas y LAB, PB/P1 de Gobierno, biblioteca y escalera/patio. Son esquemas funcionales, no planos ejecutivos acotados.
4. [Protección Civil semestre 2025-1, página 7](https://www.escom.ipn.mx/docs/escomunidad/formatosDocumentos/proteccion_civil_25_1.pdf): contraste de distribución, dos filas laterales de aulas, LAB y 5 en el eje central. No se presentaron sus indicaciones de evacuación como rutas accesibles de la app.
5. [Protección Civil 2019, página 5](https://www.escom.ipn.mx/docs/escomunidad/formatosDocumentos/uipc_presentacion20191.pdf): referencia histórica; no usar su inventario como completo para 2026, pues no incluye el Edificio 5.
6. [Plan integral de regreso 2020](https://www.escom.ipn.mx/docs/slider/planIntegralRegresoClases_ESCOM2020.pdf), pp. 18 y 22–30: fotos de barra, cafetería roja con cubierta ligera, accesos de Gobierno/principal/cafetería, jardines y escaleras. Se revisaron láminas fotográficas con vistas diferentes. Las restricciones sanitarias de ese año **no** se consideran vigentes. Cafetería y barra están en su ubicación de croquis; operación actual por confirmar.
7. [Directorio actual ESCOM](https://www.escom.ipn.mx/htmls/conocenos/organigramaDirectorio.php): Gobierno PB/P1, biblioteca y Gestión Escolar. [Servicio de biblioteca](https://www.escom.ipn.mx/SSEIS/serviciosestudiantiles/servicios/biblioteca.php): fotografías interiores contrastadas; no se construyó una biblioteca independiente ficticia.
8. [OpenStreetMap](https://www.openstreetmap.org/#map=19/19.5047/-99.1467), datos del 20 octubre 2026: huellas y puntos de acceso. © OpenStreetMap contributors, [ODbL](https://www.openstreetmap.org/copyright). IDs originales en `calibracion/huellas.json` y `puntos.json`. Trazados derivados de OSM sujetos a ODbL; la marca del autor del modelo no sustituye dicha atribución.
9. [Esri World Imagery](https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer), mosaico consultado el 20 octubre 2026. Teselas z19, primera columna/fila y origen en `georreferencia.json`. La fecha de consulta **no** es fecha de adquisición de la imagen. Se usó como referencia de comparación; no se distribuyen teselas ni fotografías como texturas del modelo.

## Distribución y discrepancias resueltas

Gobierno queda al extremo norte del conjunto, Auditorio adosado por el exterior y el patio de Gobierno permanece abierto. Explanada al sur de Gobierno. Aulas 1/3 al poniente y 2/4 al oriente; LAB central seguido del 5. Dos patios longitudinales entre brazos laterales y el bloque central. La malla de caminos pasa por exteriores; los puentes superiores son geometría esquemática, sin añadir conexiones transitables de PB a través de cuerpos cerrados.

OSM agrega los dos cuerpos poniente bajo «Edificio 1» y los dos oriente bajo «Edificio 2». Además, dos polígonos del cuerpo central sur están rotulados como 3 y 4. Se usaron los croquis oficiales 2022/2025/2026 para **dividir las filas 1/3 y 2/4**, y representar el cuerpo central sur como **5**. No se copiaron las etiquetas incorrectas de OSM. La división interna de volúmenes se estima en los núcleos de escalera visibles; no es deslinde estructural medido.

## Calibración reproducible

`calibracion/puntos.json` contiene ocho correspondencias de esquinas: coordenada métrica inicial OSM y destino satelital este/norte. Se ajusta `[x,z,1] × matriz3x2 → [este,norte]` por mínimos cuadrados. Origen geográfico del plano de trabajo: 19,5047030751° N, −99,1467189789°. Se usa R=6378137 y cos(latitud) para convertir a metros locales. La matriz se incorpora sólo a las tres esquinas del PNG; las apps no deben volver a escalar la geometría ni aplicar dos veces la matriz.

`node ../verificar-campus-escom.mjs` recalcula los residuos del ajuste almacenado. RMS 0,816 m es **interno**, con controles escogidos sobre las mismas referencias que originan la geometría. No son controles GPS independientes. La resolución de imagen, el paralaje de cubierta, la antigüedad y el trazado manual impiden deducir exactitud absoluta a partir de ese RMS. Se declara incertidumbre orientativa 5–12 m, con verificación de campo pendiente. Entrepisos 3,4 m estimados; sin cotas de altura oficiales.

## Pendientes reales

- Recorrido de campo para accesos abiertos, rampas, pendientes, ancho libre y puntos exactos de puertas; por ahora la red marca toda accesibilidad como no confirmada.
- No hay interiores navegables, rutas por piso ni representación física del sótano de Edificio 5/estacionamiento subterráneo; su existencia está documentada pero no hay cotas fiables en las fuentes revisadas.
- Revisar cambios posteriores a 2022 en servicios/aulas y la operación actual de la barra de café. Rótulo de acceso, mobiliario, asta, puentes, escaleras, colores y detalles son interpretaciones.
- Integración en móvil por Claude. Ninguna app se modificó ni se instaló como parte de esta entrega.
