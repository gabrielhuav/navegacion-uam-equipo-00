# Detalles de fachada contrastados con el corpus · 17 noviembre 2026

Se revisaron fotografías exteriores confirmadas del maestro y vistas exteriores de AZC de la colección web etiquetada. Las numerosas imágenes web interiores de G y H no se usaron para deducir sus fachadas. Se respetan los retiros de fotografías solicitados por el propietario.

La revisión encontró que Gemini ya había representado las características principales de T, G, H/HO, I, W, P1/P2 y COSEI: cubiertas, escaleras, ventanas, marcos, refuerzos, rampas visuales, mobiliario y vegetación. No se vuelven a añadir esos objetos ni se cambian sus posiciones a partir de fotos sin escala o de encuadre parcial.

## Dos detalles adicionales

| Lugar | Evidencia revisada | Observación | Representación y límite |
|---|---|---|---|
| W, fachada hacia estacionamiento | [imagen_0030.png](../entrenamiento/corpus/uam/solo_caras/corpus/imagenes/imagen_0030.png) y [imagen_0062.png](../entrenamiento/corpus/uam/solo_caras/corpus/imagenes/imagen_0062.png), etiqueta humana W, exterior | El concreto presenta juntas horizontales y verticales; no es un paño completamente liso. | Juntas finas sobre el cuerpo existente, recortadas alrededor de los bloques de ventanas. El ritmo es aproximado: no se deducen medidas exactas ni se alteran ventanas, alturas o huellas. |
| P1, torre azul junto a escalera | [imagen_0002.png](../entrenamiento/corpus/uam/solo_caras/corpus/imagenes/imagen_0002.png), etiqueta humana P1, exterior | La cara azul tiene juntas claras verticales y horizontales y se observa como revestimiento cerámico. | Se completan las juntas verticales de las dos caras exteriores de la torre. Las horizontales de Gemini se conservan. Las divisiones son esquemáticas, no un levantamiento del tamaño de cada baldosa. |

`detalles-corpus.js` añade grupos hijos de los volúmenes existentes de W y P1; por eso siguen los desplazamientos y giros del edificio. Comparte la geometría de caja y los materiales del visor, sin incorporar fotografías, textos personales ni nuevas texturas. Las juntas no proyectan sombras propias y se evita duplicarlas al repetir la llamada.

Los interiores web, las personas, los vehículos estacionados y los puestos temporales no se convierten en cambios del diseño. Se conservan IDs, dimensiones/encuadre del PNG, georreferencia, alturas de edificios y red de rutas. Las fotografías no acreditan exactitud topográfica ni certifican accesibilidad. Los originales y correspondencias privadas permanecen fuera de Git.
