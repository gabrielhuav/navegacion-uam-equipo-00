# Correspondencia entre entradas de ruta y geometría visible · 17 noviembre 2026

Una comprobación del GLB de Gemini encontró ocho cortes entre el eje de rutas existentes y piezas de caja a 1 m de altura, más un parasol de T que invadía la aproximación a 1,8 m. La red y sus destinos se conservan: la corrección alinea la representación visual con esos accesos esquemáticos, sin deducir puertas nuevas a partir de las fotografías.

| Sector | Aproximaciones existentes | Corrección acotada |
|---|---|---|
| B | n27–n5 | Abrir el antepecho de PB y el paño oscuro de la misma cara. |
| C | n51–n52 | Igual, únicamente donde cruza esta aproximación. |
| D | n33–n34 | Igual, sin modificar los niveles altos. |
| E | n52–n71 y n53–n73 | Dos aberturas separadas; la segunda considera el ángulo diagonal del camino. |
| F | n87–n12 | Abertura en la cara correspondiente de PB. |
| W | n32–n47 | Paso en el volumen bajo escalonado, conservando los laterales y el dintel superior. |
| G | n15–n88 | Retraer íntegra la única pilastra que invadía la aproximación, aproximadamente 0,635 m; no cortar la columna ni desplazar diagonales. |
| T | n89–n20 | Interrumpir el parasol bajo que invadía el paso a 1,8 m; conservar intactos los parasoles de niveles superiores. |

`accesos-modelados.js` recibe la red viva del editor y sólo actúa si existen esas aristas y si el segmento intersecta realmente la caja transformada. Trabaja en coordenadas locales mediante la inversa de su matriz mundial; no usa una envolvente rectangular mayor que la pieza. La abertura tiene un ancho nominal de 2,4 m proyectado según la aproximación, con margen de acabado, y altura libre nominal de 2,35 m. Los laterales y dinteles comparten las geometrías y materiales originales. Los grupos raíz conservan nombre y transformación; la operación es idempotente.

Se abren también los paños oscuros de PB situados sobre los antepechos de esas mismas caras, hasta 2,35 m, para no dejar un obstáculo entre 1,66 y 2,35 m. Se mantienen sus remates superiores. No se modifican los paños de pisos altos ni los de fachadas sin una de las aproximaciones autorizadas.

La prueba local usa las nueve matrices exactas de los diagnósticos y sus aproximaciones, incluidas las dos de E. Comprueba el eje y dos líneas paralelas a ±1,2 m, a alturas de 1, 1,8 y 2,2 m; conserva el dintel de W, los niveles altos, los parasoles altos de T, la columna completa de G y las piezas ajenas. Incluye una repetición con giro y desplazamiento y una segunda llamada sin duplicar cortes. El GLB final debe comprobarse de nuevo sobre todas sus mallas después de exportar: una prueba de piezas seleccionadas no acredita por sí sola todo el modelo.

Estas dimensiones son **decisiones de representación**, no medidas verificadas de puertas, pendientes o anchos reales. Los sondeos de líneas tampoco son una certificación continua de paso libre. No se cambian nodos, conexiones, destinos, coordenadas, niveles ni indicadores de accesibilidad en `rutas.json`; hace falta validación física para esos usos.
