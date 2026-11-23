# Piloto de rutas para T, G y la biblioteca

**UAM Azcapotzalco · 20 de noviembre de 2026.** Candidato local sobre el mapa del PR #23 (`19db385`).

| Recorrido simulado | Antes | Piloto |
| --- | --- | --- |
| Plaza Roja → cruce perimetral junto a G (`n72` → `n19`) | 234,0 m por el extremo del edificio | 156,3 m por el paso cubierto de G, 77,7 m menos con los mismos extremos |
| GPS simulado frente a la parte posterior de T → T | 7,2 m desde un punto interior inferido, con llegada por detrás de T | 415,3 m desde el acceso peatonal P3 hasta el patio de T. La app muestra el nombre del acceso y la distancia interior |
| Plaza COSEI → biblioteca | 76,2 m con el origen sobre una banca y cruces del mobiliario y del frente acristalado | 75,1 m desde la plaza, por los escalones y hasta el pórtico. Hemeroteca se puede seleccionar y figura en planta baja |

Las distancias se calculan con la red y su georreferencia. En G se fijaron ambos extremos para medir el efecto del atajo. En T e I se corrigieron puntos de inicio o llegada, por lo que las cifras ilustran recorridos distintos. La red AZC tiene 123 nodos, 130 tramos y 53 destinos en un componente.

## Cambios y evidencia

- **T.** `T` llega a `n81`, frente a la galería de Sistemas Escolares desde el patio. `n89` conserva su ID y conexión al andador posterior. Las referencias del corpus de alumnos `imagen_0079`, `imagen_0107` y `imagen_0127` muestran las ventanillas, las columnas y su relación con el patio. Para el GPS se usa el perímetro del mapa. Fuera del predio se elige el acceso peatonal conectado más cercano entre P1, P2 y P3. Dentro se usa el punto del andador más próximo hasta 20 m y se ofrece elegir el origen si queda más lejos. El caso exterior simulado está frente a T y reproduce el origen erróneo de la versión anterior.
- **G.** `imagen_0080` y `imagen_0086` muestran el paso pasante de planta baja. El corredor nuevo enlaza Plaza Roja (`n71`), el paso bajo G (`n116`–`n119`) y Plaza COSEI, con un desvío corto alrededor de la escultura del lado COSEI. El destino G mantiene su acceso del lado de Plaza Roja (`n88`). El paso nuevo queda pendiente de comprobación de accesibilidad en campo.
- **Biblioteca.** El etiquetado del corpus web `internet_000220` y las vistas del corpus de alumnos `imagen_0141`, `imagen_0154` y `imagen_0157` sitúan el acceso de la biblioteca respecto de la plataforma, las palmas y el asta. Las pruebas sobre la geometría exportada permitieron contornear las bancas y letras y acercar `n86` al pórtico antes del vidrio. El tramo `n83`–`n84` conserva el tipo `escalera` y la app lo avisa. La foto de una rampa junto a la plataforma queda como referencia para verificar un recorrido continuo en campo. [Galería institucional que documenta la plaza](https://www.uamfoto.uam.mx/copia-de-14-de-noviembre-de-2018-1).

## Destinos consultables por nombre o código

Cada destino usa el mismo punto de llegada que su edificio y añade el piso que indica la fuente. La línea del plano termina en el acceso. La app muestra la referencia de llegada y el piso para continuar dentro del edificio.

| Edificio | Piso | Destinos | Fuente |
| --- | --- | --- | --- |
| T | Planta baja | Sistemas Escolares y Soporte Técnico y Redes | [Guía de la Coordinación de Servicios de Cómputo](https://csc.azc.uam.mx/guias/7%29-Guia-de-uso-para-apoyo-en-digitalizacion_rev8.pdf) |
| T | 1 | Sala John Von Neumann | [Guía de la Coordinación de Servicios de Cómputo](https://csc.azc.uam.mx/guias/7%29-Guia-de-uso-para-apoyo-en-digitalizacion_rev8.pdf) |
| G | Planta baja | G006 Electricidad y Magnetismo, G007 Cuerpo Rígido y Oscilador | [Ficha G006](https://cbi.azc.uam.mx/?page_id=7127) · [Ficha G007](https://cbi.azc.uam.mx/?page_id=5797) |
| G | 3 | G302-A y G302-B Redes, G304 Control, G304-BIS Semiconductores y Circuitos Integrados, G306 Electrónica, G307 Robótica, G308 Electrónica de Potencia, G309 CADI, G310-A Proyectos Terminales, G312 Mecatrónica y Robótica Cognitiva, G314 Audiovisual, G316 Taller Mecánico | [Directorio del Departamento de Electrónica](https://zeus.azc.uam.mx/DepElectronicaAZC/laboratorios/index.html) |
| I | Planta baja | Hemeroteca y Sección de Documentación | [Guía de consulta especializada de COSEI](https://cosei.azc.uam.mx/pdf/especial.pdf) |
| I | 1 y 2 | Colección General Q–Z y Audiovisual (1), Colección General A–P (2) | [Distribución de colecciones](https://cosei.azc.uam.mx/index.php?Itemid=472&id=76&option=com_content&view=article) |

Para T queda pendiente contrastar el nivel de Ada Byron, que difiere entre fuentes, y la altura de los volúmenes con la ficha de Charles Babbage. Para incorporar recorridos interiores hace falta identificar puertas y conexiones entre pisos. Los corpus se usaron como referencia local para las llegadas y el paso cubierto.

## Verificación y entrega

- El contrato comprueba la red conectada, los cuerpos de G a ambos lados de su vano, los destinos base, el perímetro con la georreferencia vigente y la coherencia de cada destino interior con su acceso. Se comprobó que se preservan los IDs de la base.
- Se contrastaron 18 tramos nuevos o ajustados con triángulos del GLB. Los sondeos del eje y sus laterales a seis alturas quedaron libres de obstáculos, salvo el contacto del tramo de escalera con peldaños y el borde de su plataforma. Las auditorías de edificios, mobiliario y estacionamientos también pasaron. La inspección de campo sigue pendiente para pendientes, ancho continuo, puertas y GPS de un teléfono.
- La app KMP pasó 34 pruebas y se generó un APK Android de depuración. Flutter pasó 22 pruebas, incluida la búsqueda por código, y su análisis estático. Ambos usan `campus/rutas.json`. El visor se reconstruyó con los datos del piloto.
- Se verificaron los 18 archivos protegidos de la 0.5.0 y los corpus. El plano, la georreferencia y los GLB conservaron sus bytes. El piloto queda en el directorio de trabajo para revisión.
