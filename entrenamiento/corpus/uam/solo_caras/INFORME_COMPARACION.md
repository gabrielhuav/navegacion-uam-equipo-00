# Comparación: sólo caras pixeladas

15 de noviembre de 2026, Ciudad de México. **Informe de la copia con sólo caras pixeladas para revisión en el PR #23; commit y push autorizados por el propietario.**

## Corrección aplicada

Los bloques grises anteriores se usaron para ocultar posibles identificadores; no eran una técnica para mejorar la precisión. Aquella copia cubría zonas más amplias de lo solicitado. Esta variante parte de los originales y aplica únicamente un mosaico pequeño de colores de la propia imagen dentro de caras, dejando cuerpos, ropa, edificios, carteles y otros objetos intactos.

Hay **157 copias** con etiquetas confirmadas y nombres neutrales. Se conserva la selección original de **118 fotos únicas exteriores y 22 grupos** para comparar. La preparación es la misma de la app: orientación, RGB y lado máximo 1024 con Pillow 13. Los originales mantienen su resolución y sus bytes.

La versión corregida contiene **158 rectángulos faciales en 51 imágenes**. Son regiones aplicadas, no personas identificadas. Se reducen pequeños recortes de cara a un máximo de 4×4 celdas por promediado BOX y se amplían mediante NEAREST, con margen del 6 % y mínimo de un píxel. Las caras muy pequeñas pueden quedar en una sola celda de su color medio. No se utiliza relleno gris fijo, máscaras de cuerpo, OCR para tapar texto ni bandas de ocultación.

La auditoría independiente reconstruyó cada resultado desde los píxeles originales preparados y las regiones declaradas: **157/157 imágenes coinciden exactamente con ese mosaico**, y **157/157 conservan todos los píxeles fuera de las caras**. En conjunto sólo cambió el **0,0321 % de píxeles**. El detalle reproducible de rectángulos y tamaños de mosaico está en `corpus/regiones_caras.json`.

## Comparación al mismo umbral 0,74

Las dos galerías se probaron con las mismas 118 consultas naturales originales, retenidas en privado. Se excluyó de cada consulta todo su grupo original y las tres vistas; se conservaron duplicados/grupos antes de pixelar. MobileNetV3 permanece congelada y el umbral no se recalibró.

| Métrica de T | Galería actual | Sólo caras pixeladas |
|---|---:|---:|
| Aciertos de T | 38 de 50 | 38 de 50 |
| Falsos positivos | 4 | 4 |
| T omitidos | 12 | 12 |
| Precisión | 90,48 % | 90,48 % |
| Recuperación | 76,00 % | 76,00 % |

**Para T, las decisiones de aceptación/rechazo son idénticas en las 118 consultas**, no sólo sus totales. La copia anterior de censura amplia había dado 35 aciertos y 5 falsos positivos; esos valores no describen esta variante de sólo caras.

La clasificación forzada entre las seis clases sí cambia: de 64/118 (54,24 %) a 63/118 (53,39 %). Por tanto, no se afirma ausencia de efecto en todos los resultados. Esta es una evaluación del corpus, no una medición de campo o del voto temporal de siete cuadros de la cámara.

La galería comparada se entrega por separado en `evaluacion/galeria_solo_caras_CANDIDATA_NO_INTEGRADA.json`; contiene 354 vectores de 960 dimensiones. No se copiaron esos vectores a la app, no se alteraron los extras y no se compiló un AAB nuevo.

## Datos y revisión

Se reexportaron los PNG desde píxeles, sin EXIF, GPS, XMP, IPTC, perfiles, miniaturas ni rutas originales. Se conservan las etiquetas confirmadas, condición de interior/exclusión y grupos opacos. La correspondencia con los originales y los candidatos descartados se guardan fuera de esta carpeta.

Los detectores pueden omitir caras, y algunas regiones requieren la revisión del propietario. Las estimaciones sobre paredes, objetos, cuellos o partes del cuerpo se retiraron cuando no se confirmó una cara. El pixelado no constituye una garantía de anonimato: los cuerpos y demás contenidos visibles se conservaron expresamente por la corrección solicitada.

El OCR ya calculado se reutilizó sólo para señalar texto que conviene revisar; **no se aplicaron máscaras de texto** ni nuevas inferencias OCR. Se señalan 79 imágenes con 159 regiones de texto no institucional candidato; esto puede ser texto público o falsos positivos y no prueba presencia de datos personales. No hubo coincidencias de los patrones comprobados de correo, número de 8–15 dígitos o autor conocido. El CSV de revisión incluye sólo identificadores opacos y cantidades, nunca las lecturas.

## Integridad y procedencia

La evaluación verificó **157 originales y 69 archivos protegidos sin cambios**, incluida la versión 0.5.0 y los resultados anteriores. La auditoría también protege los 187 archivos de la copia amplia previa y comprueba los 167 PNG de esta entrega —157 imágenes y diez láminas—. Los informes numéricos están en `evaluacion/`. Los 55 archivos protegidos de la auditoría de metadatos y los 69 de la evaluación corresponden a alcances distintos de comprobación.

Conjunto pixelado evaluado: `a4557a1f4f7ccfac0d8ea30c69481b9c1f16bcebf3bc3ea3a0c2ebcd5b09bb75`.

Galería candidata SHA-256: `923cb093ef08ac0be5200df6702447761ae28316d67327dfd244abcd2f1fb213`.

El AAB de 0.5.0 conserva SHA-256 `7D6B44B73C95B67F2CEAB91C2A7E2E381AA5D6B845B745356F31C05649724CB4`. No cambiaron pesos, versión, archivos del campus, georreferencias, rutas ni IDs. No se instalaron paquetes adicionales para esta corrección: se reutilizaron los entornos locales existentes, Pillow/HEIF para el mosaico y TensorFlow 2.21 para evaluar.

La galería de revisión se guarda en `REVISION_LOCAL.html` y no carga recursos remotos. Las tablas privadas de correspondencia no forman parte de esta carpeta. El propietario autorizó incorporar esta variante al mismo PR #23 mediante commit y push el 15 de noviembre de 2026. La aprobación y fusión del PR, y cualquier subida a Play Console, quedan a cargo del propietario.
