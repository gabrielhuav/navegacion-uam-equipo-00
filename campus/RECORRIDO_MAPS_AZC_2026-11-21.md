# Recorrido de revisión de UAM Azcapotzalco

**21 de noviembre de 2026.** Continuación local de la revisión de monumentos. La comparación usa el plano y el modelo locales que ya incorporaban las correcciones de Universitas, Casa Abierta al Tiempo y la Pérgola animada.

## Qué cambió

| Sector | Detalle incorporado | Referencia visual |
| --- | --- | --- |
| L · Vestíbulo de CyAD | Corte 3D de doble altura con dos tramos de escalera amarilla, galería superior, casilleros verdes, mesas perimetrales, bandas de ladrillo, bloques de vidrio y bancas de madera. Los paños de color señalan la ubicación general de los murales. | [Fotos comunitarias de L en Maps, de 2024 y 2026](https://www.google.com/maps/place/Edificio+L/@19.503882,-99.1893024,478m/data=!3m1!1e3!4m6!3m5!1s0x85d1f80af1270271:0x19f6b5b6c238c418!8m2!3d19.503882!4d-99.1880123!16s%2Fg%2F11hcfhyvpv) · [Escaleras CyAD](https://commons.wikimedia.org/wiki/File:Escaleras_CyAD.jpg) · [Programa de CyAD que identifica el vestíbulo](https://congresoadmonytecparaeldiseno.azc.uam.mx/imagenes/Programa_XIX_Congreso.pdf#page=1) |
| H y HO | H tiene bandas de concreto, ventanas corridas y pavimento rojo bajo la galería hacia COSEI. Frente a Serpentina II, la planta baja tiene paños acristalados y montantes. En HO, el vestíbulo recto gana un retranqueo, carpintería, piso con juntas rojizas y luminarias en el plafón. | Corpus de alumnos `imagen_0150`, `imagen_0155`, `imagen_0005`–`imagen_0007` · [Foto de Serpentina II con H al fondo, de septiembre de 2024](https://www.google.com/maps/place/Serpentina+II/data=!4m2!3m1!1s0x85d1f9000e0c1231:0xa84793e32e637e82) |
| J · Cafetería | Cancelería oscura con franja naranja, alero de concreto con juntas y luminarias, letra «j» en relieve y un único lucernario bajo de faldones de vidrio. | Corpus `imagen_0004` e `imagen_0155` · [Ficha de J en Maps](https://www.google.com/maps/place/Edificio+J+-+Cafeteria/data=!4m2!3m1!1s0x85d1f80afb51f261:0x6c954c5ff242b785) |
| R | Fachada gris con juntas horizontales, volumen rojo nervado en voladizo y ventanal al fondo, más dos hojas de rejilla en la caseta. | Corpus `imagen_0060`. |
| Zona deportiva | Se dibujan por separado el terreno de césped natural, las multicanchas con zonas de tiro terracota y la cancha sintética de fútbol 7 con muretes de rebote. Las gradas junto a Q tienen pórticos blancos, riostras, cubierta acanalada y doble escalera. Se añadió el adoquín del andador lateral y se despejaron los árboles decorativos sobre las superficies deportivas. | Vista aérea en Google Maps abierta en Edge, contraste con Esri y [fotos de infraestructura de la UAM](https://cga.azc.uam.mx/infraestructura/) · Corpus `imagen_0072`–`imagen_0076` e `imagen_0096`. |

La superficie gris genérica del modelo anterior ocupaba una zona donde se distinguen techumbres en la toma aérea. Se retiró esa representación provisional. Queda pendiente reconstruir las cubiertas con una referencia que confirme sus límites y alturas. El punto de Maps de Serpentina II difiere aproximadamente 4,4 m del centro del modelo. La foto de la obra y el acceso acristalado de H confirman el mismo sitio dentro del margen de la georreferencia.

En **Interiores → L · Vestíbulo de CyAD** se abre el corte esquemático. En **Sectores del campus** se puede saltar a H, HO, J, R, las canchas y las gradas. La escala del visor indica ahora una distancia aproximada cerca del punto al que apunta la cámara.

## Comprobación y límites

- El corte del vestíbulo sirve para reconocimiento visual. La posición de puertas, la circulación interior y las medidas exactas quedan por comprobar en el campus.
- Se regeneraron en el visor los dos modelos GLB y los dos planos PNG. Se conservan sus dimensiones de 1560 × 640, la georreferencia, los edificios y la red peatonal de 123 nodos, 130 tramos y 53 destinos. El archivo de rutas y los datos editables coinciden con la base local.
- La auditoría del modelo exportado encontró cero cortes de ejes peatonales con los edificios a 1, 1,8 y 2,2 m. Pasaron también las auditorías de mobiliario, aparcamiento e invernadero. Se verificaron el visor autónomo y la compilación Android de prueba.
- Las fotos se consultaron como referencias. Los modelos y planos usan geometría y acabados generados en el proyecto. La revisión del mapa se entrega en el PR #23.
