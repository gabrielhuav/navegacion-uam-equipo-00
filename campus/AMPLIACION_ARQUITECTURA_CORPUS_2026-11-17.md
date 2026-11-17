# Ampliación de arquitectura contrastada con el corpus · 17 noviembre 2026

Esta ampliación reconstruye cuatro elementos de P4 y P2 a partir de fotografías exteriores confirmadas. El corpus permite sustituir sus aproximaciones de bloques por estructuras reconocibles. Se mantienen las posiciones de P4. En P2 se corrige una ubicación esquemática que ocultaba el invernadero dentro del edificio O; las fotografías acreditan que está junto a 2P, pero no aportan coordenadas ni medidas exactas.

## Fotografías y cambios

| Elemento | Evidencia pública ya autorizada | Qué se observa | Geometría añadida o reconstruida |
|---|---|---|---|
| Cubierta del patio de estudio de P4 | [0016](../entrenamiento/corpus/uam/solo_caras/corpus/imagenes/imagen_0016.png), [0021](../entrenamiento/corpus/uam/solo_caras/corpus/imagenes/imagen_0021.png), [0032](../entrenamiento/corpus/uam/solo_caras/corpus/imagenes/imagen_0032.png) | Paneles claros traslúcidos, entramado tubular rojo, tramos curvos y luminarias suspendidas. | Se sustituye la losa roja opaca por una cubierta traslúcida de perímetro redondeado, tubos de borde, costillas y cerchas longitudinales trianguladas. Se conservan las luminarias y columnas existentes. |
| Mesas de estudio de P4 | [0032](../entrenamiento/corpus/uam/solo_caras/corpus/imagenes/imagen_0032.png) | Tableros claros, bancos longitudinales y soportes tubulares oscuros. | Los bloques macizos pasan a conjuntos de tablero, dos bancos y bastidor tubular. Se detallan las cinco ubicaciones ya modeladas: la foto acredita el tipo de mobiliario, no el conteo ni la posición exacta de todas las mesas. |
| Exhibidor de conexiones de acero de P4 | [0019](../entrenamiento/corpus/uam/solo_caras/corpus/imagenes/imagen_0019.png) | Perfiles abiertos, placas de unión, rigidizadores, diagonal y pernos, con acabado amarillo. | Columna y brazos con sección I abierta, placas de extremo, rigidizadores y pernos; base y diagonal originales conservadas. Se agrupa como `P4_conexiones_acero_corpus`, sin atribuir título artístico o autor. |
| Invernadero junto a P2 | [0036](../entrenamiento/corpus/uam/solo_caras/corpus/imagenes/imagen_0036.png), [0047](../entrenamiento/corpus/uam/solo_caras/corpus/imagenes/imagen_0047.png) | Cerramientos traslúcidos, techo a dos aguas y bastidores blancos finos. | Se reconstruyen paredes y dos faldones; los tres paños blancos macizos se sustituyen por bastidores abiertos y largueros. Se conservan los tamaños y se corrige la ubicación esquemática del conjunto completo para evitar interpenetraciones. |

La fotografía 0021 muestra un árbol y una jardinera, pero no permite trasladar su posición con suficiente precisión al plano. Esta ampliación se concentra en los objetos cuya ubicación ya existe en el modelo.

## Integración

`detalles-arquitectura-corpus.js` exporta `mejorarArquitecturaCorpus({THREE, data, buildingGroups, box, material, cube, cylinder, net})`. Se ejecuta después de generar los edificios y antes de despejar accesos y calcular reservas de estacionamientos. Debe recibir la red de rutas vigente, incluidas las ediciones del visor. Los grupos raíz conservan sus nombres; el conjunto de acero obtiene además el grupo de inspección `P4_conexiones_acero_corpus`.

Las piezas comparten las geometrías de caja y cilindro y la caché de materiales del visor. Los paneles traslúcidos tienen ambas caras visibles y desactivan la escritura de profundidad; los materiales propios tienen un único responsable de liberación al regenerar la escena. No se incorporan fotografías como texturas.

La cubierta y el invernadero incluyen `userData.parkingGroundBounds`, expresado en coordenadas locales de sus nuevos grupos y con la huella anterior completa. La integración debe transformar sus cuatro esquinas al calcular obstáculos para aparcamientos: los paneles verticales del invernadero tienen área horizontal cero por separado. Esta reserva evita colocar coches en el recinto y no prohíbe el paso peatonal bajo la cubierta.

La cubierta conserva la huella general y no supera la cota anterior del patio. Las mesas permanecen dentro de sus cajas anteriores. El cuerpo traslúcido y los marcos del invernadero conservan sus tamaños; se trasladan juntos con los largueros. El exhibidor mantiene su base y envolvente. La curvatura, diámetros, triangulación, reparto de paneles y tamaños de uniones son aproximaciones visuales, no medidas de fabricación o de obra.

## Corrección de la ubicación esquemática de P2

La revisión del GLB encontró el centro anterior del invernadero, `(168,298802; 1,45; 30,964790)` en metros del modelo, dentro del sólido de `O_volumen_0`. Cambiar la cámara no eliminaba ese solape. Mantener exactamente su X tampoco dejaba una ubicación libre de las rampas y columnas laterales de P2.

Se permite una excepción explícita a la conservación de la ubicación del invernadero: se desplaza el conjunto completo por el mismo lado oeste de P2, sin modificar las huellas canónicas, IDs, niveles, PNG, georreferencia ni rutas. La búsqueda se ordena por distancia sobre una malla de 5 cm, hasta 4 m hacia el exterior y 30 m longitudinales, manteniendo el conjunto junto al tramo longitudinal de P2. Comprueba la huella completa con un margen de 5 cm frente a todas las huellas de edificios, los corredores de todas las aristas de 1,8 m, sus cruces y la geometría opaca a la altura del recinto, incluidas rampas, ventanas y columnas.

Para la disposición actual, el traslado mínimo de esa malla es **ΔX = −2,15 m; ΔY = 0; ΔZ = +10,10 m**. El nuevo centro del cuerpo es `(166,148802; 1,45; 41,064790)`. Paneles, tres bastidores, largueros y reserva de aparcamiento acompañan el mismo desplazamiento. Los tamaños y las posiciones relativas se mantienen. Es una corrección de representación esquemática sustentada por separación geométrica; no afirma que estas sean las coordenadas reales del invernadero. La ubicación precisa sigue pendiente de plano o comprobación en campo.

El grupo registra el motivo, la evidencia y el desplazamiento en `userData.ubicacionEsquematica`. Si falta la red de rutas o no aparece una ubicación libre dentro de los límites de búsqueda, registra el pendiente correspondiente y no inventa otra ubicación.

## Verificación reproducible

```powershell
node --check campus/detalles-arquitectura-corpus.js
node campus/verificar-arquitectura-corpus.mjs
```

La prueba utiliza las matrices y envolventes de los objetos reales capturadas del GLB previo, guardadas sin fotografías en `validacion/fixtures/arquitectura_corpus_2026-11-17.json`. Añade 30 salientes reales próximos a P2, incluidas las rampas, capturados del GLB que permitió detectar el solape. Comprueba las cuatro reconstrucciones, tamaños conservados, reservas para aparcamientos, traslado conjunto del invernadero, bastidores y perfiles I realmente abiertos, propiedades de transparencia, piezas ajenas intactas y segunda llamada sin duplicaciones. Repite el ensayo con giro, desplazamiento y escala no uniforme heredados del edificio.

También prueba las nuevas mallas contra los ejes reales de rutas a alturas 1, 1,8 y 2,2, y comprueba de manera independiente la separación de la huella completa del invernadero respecto de edificios, corredores de 1,8 m, cruces y salientes capturados. Es una comprobación de representación geométrica; la exportación final debe someterse a la auditoría global y a revisión visual. No certifica anchos útiles, accesibilidad ni exactitud topográfica. Los niveles, huellas canónicas, georreferencia, nodos y destinos no se modifican.
