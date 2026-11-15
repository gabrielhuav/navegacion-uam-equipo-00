# Corpus UAM: sólo caras pixeladas

Copia derivada de las **157 imágenes con etiquetas confirmadas**, preparada para revisión en el [PR #23](https://github.com/gabrielhuav/navegacion-uam-equipo-00/pull/23). El propietario autorizó el commit y el push de esta variante el 15 de noviembre de 2026. La aprobación y la fusión del PR corresponden al propietario; esta incorporación no publica una versión en Play Console.

## Revisar la copia

- Descargar esta carpeta y abrir [REVISION_LOCAL.html](REVISION_LOCAL.html): permite recorrer las 157 imágenes sin recursos remotos.
- [INFORME_COMPARACION.md](INFORME_COMPARACION.md): protocolo, resultados y límites de la comparación.
- [corpus/manifiesto.csv](corpus/manifiesto.csv): etiquetas, exclusiones, grupos opacos y hashes de las copias.
- [corpus/regiones_caras.json](corpus/regiones_caras.json): rectángulos y mosaicos aplicados; [revision/](revision/) contiene diez láminas de revisión.
- [evaluacion/](evaluacion/): informes, predicciones sin correspondencias privadas y galería candidata separada. [SHA256SUMS.txt](SHA256SUMS.txt) enumera todos los demás archivos de esta carpeta.

## Alcance del pixelado

Se aplica mosaico sólo a **158 regiones faciales en 51 imágenes**. Los cuerpos, edificios, carteles y el resto de los píxeles de las imágenes preparadas se conservan. Cambia el **0,0321 % de los píxeles** del conjunto. Los PNG tienen nombres neutros, orientación aplicada, lado máximo de 1024 píxeles y ningún metadato EXIF/GPS/XMP/IPTC ni miniaturas.

Los originales y sus correspondencias privadas permanecen fuera del repositorio. No se incluye la copia anterior con bloques grises. Pixelar caras no garantiza anonimato: otros contenidos visibles se conservan y los detectores pueden omitir caras. El estado de revisión visual del manifiesto se conserva; la autorización de subida no equivale a una certificación de cada imagen. El CSV de texto candidato contiene sólo identificadores de imagen y cantidades, sin las lecturas de OCR.

## Comparación con la galería actual

Se mantienen las mismas **118 fotos exteriores únicas y 22 grupos** de evaluación, dejando fuera cada grupo completo. Al umbral fijo **0,74**, ambas galerías producen **38 aciertos de T, 4 falsos positivos y 12 T omitidos**: precisión **90,48 %** y recuperación **76 %**. Las decisiones de aceptación/rechazo de T coinciden en las 118 consultas. La clasificación forzada en seis clases pasa de **64/118 a 63/118**.

La comparación principal usa consultas originales retenidas en privado: los resultados publicados permiten auditar conteos, pero no repetir esa inferencia sin los originales. La candidata y sus entradas pixeladas se entregan por separado para revisión. La evaluación no mide el voto temporal de siete cuadros ni el funcionamiento en campo.

La galería candidata de `evaluacion/` **no está integrada en la app**. Se conservan los assets actuales, las etiquetas confirmadas y la preparación local de Salones UAM 0.5.0.
