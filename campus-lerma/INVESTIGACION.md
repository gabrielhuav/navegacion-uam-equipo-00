# UAM Lerma · investigación para el croquis 2D/3D

Consulta: 18 de octubre de 2026. Se contrastaron dos planos oficiales, el directorio vigente, noticias institucionales, una referencia satelital completa, huellas OSM y trece imágenes revisadas visualmente. Las fotografías y el raster no son texturas del modelo. El tablero `investigacion/referencias.html` carga las imágenes desde sus fuentes; `referencias.json` conserva URL, observación e identificación.

## Lo que cambia la interpretación del campus

Lerma combina módulos ligeros de una planta con un conjunto permanente mayor al oriente. No es un único bloque ni una colección de torres iguales. El predio OSM tiene forma de L: además del sector académico al norte, incluye una prolongación natural al sureste. Los campos grandes al sur del sector occidental no se incorporaron como si todo el rectángulo satelital perteneciera a la universidad.

La entrada de Las Garzas está en el extremo occidental del sector de aulas ligeras. La circulación continúa hacia los conjuntos B y después hacia el área permanente F/G. La calzada interna y el andador se trazan como elementos diferentes. Son interpretaciones visuales de posición y ancho, sin calificación de rutas accesibles.

El **mapa oficial de septiembre de 2026** y el **Directorio de Espacios** resultan decisivos porque cambiaron las letras. Gran parte de las fotos y OSM usan la nomenclatura anterior. Aplicar esas letras directamente produciría dos G distintos o confundiría el F actual con un pequeño módulo antiguo.

| Edificio actual | Nombre anterior | Interpretación usada |
|---|---|---|
| A1 | A | Aulas y espacios colaborativos |
| A2 | G | Barra ligera de laboratorios, medios y bioterio |
| A3, A4, A5 | B, C, D | Módulos ligeros de tecnología y laboratorios |
| A6, A7 | E, F | Laboratorios/servicios y salón de usos múltiples |
| B1, B3, B4, B5 | H, I, J, K | Laboratorios, Cómputo, Servicios Auxiliares y Servicio Médico |
| B2 | M | Barra que contiene biblioteca y otros espacios |
| B6, B7 | L, N | Comedor y deportes/vestidores |
| F | O | Cuerpos bajos del conjunto permanente |
| G | P | Aulas y administración; Rectoría en nivel 3 |
| C, D, E | CIFE | Tres módulos intermedios visibles en la referencia cenital |

Se guardan `legacyId` y `osmName`; los nombres antiguos son alias, no edificios adicionales. La biblioteca tiene una huella OSM adicional superpuesta a B2: se documenta, pero no se extruye un segundo edificio sobre ella.

## Referencias visuales y consecuencias de diseño

Las trece imágenes se pueden consultar juntas en el tablero. Las siguientes observaciones proceden de inspección visual; no son mediciones de ventanas, materiales o alturas.

| Referencia en el tablero | Observación | Aplicación |
|---|---|---|
| Explanada y fachada G, AJG_1470 | Fachada clara, núcleo de vidrio y letras SOY uam sobre base morada | Retícula, núcleo vertical y rótulo esquemático editable |
| 13-scaled | PB y tres niveles superiores, ventanas separadas, pilares y dinteles claros | Cuatro niveles de G, módulos de ventana y PB retranqueada |
| IMG_1138 | Canchas entre dos barras bajas, con malla de sombra histórica | Posición de canchas; se distingue de la cubierta curva posterior |
| IMG_1139 | Campo de fútbol contiguo, visto desde arriba | Cancha independiente del área de básquetbol |
| IMG_1142 | Cancha a nivel de suelo, postes y fachadas ligeras | Canastas, líneas y altura de módulos bajos aproximadas |
| biblioteca2 | Biblioteca interior en construcción ligera de una planta | Mantener la biblioteca en B2, sin inventar un bloque alto |
| IMG_0777 | Servicio de comedor interior en módulo ligero | Corroboración del carácter bajo de los servicios |
| IMG_1132 | Caseta pequeña, puerta, ventanas y andador | Caseta sencilla en el acceso; no una portería monumental |
| IMG_1134 | Caseta con vialidad, malla y estacionamiento al lado | Relación de acceso, circulación y estacionamientos |
| Aérea oficial de 2021 | Conjunto O/P con barra larga y retornos angulares | Conservar huellas continuas y alas de F/G, con distintas alturas |
| AJG_1314 del directorio | Galería baja, jardín frontal y coches | Pilares, jardín y estacionamientos separados de la circulación |
| IMG_0420 de Comunidad | Núcleo/acceso acristalado y volúmenes escalonados | Paños verticales de vidrio; retorno bajo aproximado |
| CIFE, foto institucional de 2024 | Cimentación en construcción, no render | Evidencia de fase temprana; no usarla para afirmar acabados actuales |

El resultado usa concreto claro, ventanas azul grisáceas, PB con matiz lila, cubiertas terracota en los edificios mayores y techos claros en los módulos. Son elecciones cromáticas de representación, no especificaciones de materiales. No se copian murales, logotipos ni fotos sobre las fachadas.

## Fechas, contradicciones y decisiones

El plano de servicios de 2024 todavía llama P al actual G y usa H–N para parte de las aulas ligeras. Se emplea para corroborar distribución, no como nomenclatura vigente. El mapa 2026 incluye los sectores A1–A7, B1–B7 y C–G, así como la zona de Los Capulines.

Las fotos de canchas muestran una malla oscura. La noticia de febrero de 2025 documenta la renovación del pavimento y también muestra esa malla. En cambio, el raster consultado permite ver una cubierta curva clara. Se representa esta cubierta observada, sin adjudicarle una fecha de terminación ni confundir la fecha de consulta con la de captura de la imagen.

La nota de inicio del CIFE (2024) confirma tres módulos. El informe institucional de 100 días de gestión de 2025 habla de una primera etapa próxima a concluir; eso no confirma su ocupación total en octubre de 2026. El mapa 2026 los identifica como C/D/E y el raster muestra tres cubiertas. Por tanto, se trazan esos volúmenes y se marca su habilitación como pendiente de confirmar. Sus tres niveles y fachadas son estimaciones; no se materializan futuros edificios del plan maestro.

El G tiene cuatro niveles según las fotos y la ubicación oficial de Rectoría en el nivel 3. Para F se adoptan tres niveles en la barra, con retorno frontal más bajo: las publicaciones sobre habilitar sus pisos 1 y 2 apoyan esa lectura, pero faltan secciones completas para definir toda su altura. La diferencia de alturas de las alas es una aproximación visual, conservada como parámetro de arquitectura.

Una imagen genérica difundida en resultados de búsqueda bajo UAM Lerma muestra una celosía y cuerpo terracota asociados a Cuajimalpa. No se utilizó como fachada de Lerma. Tampoco se utilizó el plan maestro futuro para ocupar con bloques el terreno libre.

La obra de fachada y sistema de accesos anunciada para 2025/2026 requiere una foto actual para verificar su estado final. El acceso aquí conserva la localización geográfica, una caseta y un marcador; no se afirma una reconstrucción de su nueva portada.

## Geometría, escala y límites prácticos

20 volúmenes editables: 17 huellas OSM y tres cubiertas CIFE trazadas sobre la referencia cenital. Se conserva la forma de L del predio. Las unidades del GLB son metros. El marco es X [-450,450], Z [-310,310]; PNG transparente de 1800×1240 a 2 px/m.

La proyección local parte de coordenadas OSM reales alrededor de 19.2905, -99.4985. Once esquinas en diez edificios se contrastaron visualmente con Esri. El ajuste afín da RMS interno 1,4046 m y máximo 3,0725 m. Los controles se concentran donde existen edificios: el extremo natural se apoya en el contorno OSM, sin controles de campo al sur. El error allí puede ser mayor; el RMS no lo valida de forma independiente.

No hay levantamiento GNSS, sección arquitectónica ni fecha de captura verificada. Considerar una incertidumbre visual orientativa de 5–15 m, sin garantía estadística. En C/D/E se trazaron cubiertas y no la huella topográfica medida a nivel de suelo. Las esquinas del PNG se calculan a partir del ajuste completo, no asignando un centro y un cuadro arbitrarios.

Los Capulines se representa con cobertura vegetal irregular, un sendero esquemático y referencias editables para observatorio y espacio lúdico. Estas posiciones se apoyan en el esquema oficial y son aproximadas; no se inventó la arquitectura del observatorio ni se construyó una ruta navegable. Los árboles no son un inventario individual.

Para perfeccionar: fotos actuales de C/D/E y portada, niveles/secciones F/G, ubicación exacta de SOY uam, levantamiento de accesos y controles al sur del predio. El usuario puede acomodar hitos, árboles y estacionamientos, y guardar los cambios con el mismo editor de las otras unidades.
