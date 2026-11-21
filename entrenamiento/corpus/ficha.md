# Ficha del corpus ESCOM

Generada con `modelo/anonimizar_corpus.py` a partir de la corrida `20261022_193848_letras_escom`.

**Las fotos no están en este repositorio.** Tienen nombres, caras y ubicación de alumnos. Aquí sólo hay
conteos y un listado anónimo (`manifiesto_anonimo.csv`) para documentar y repetir la evaluación.

## Contenido

139 fotos: 132 de 20 alumnos y 7 de una fuente adicional. 0 videos.

| Clase | noche | dia | atardecer | Total | En la galería |
|---|---:|---:|---:|---:|---:|
| auditorio | 0 | 2 | 0 | 2 |  |
| biblioteca | 1 | 0 | 0 | 1 |  |
| cafeteria | 0 | 1 | 0 | 1 |  |
| edificio_1 | 16 | 0 | 0 | 16 | 16 |
| edificio_2 | 22 | 3 | 0 | 25 | 21 |
| edificio_3 | 7 | 0 | 0 | 7 | 7 |
| edificio_4 | 10 | 0 | 0 | 10 | 9 |
| edificio_5 | 6 | 3 | 0 | 9 |  |
| gobierno | 23 | 0 | 0 | 23 | 21 |
| laboratorios | 22 | 8 | 0 | 30 | 25 |
| otro | 3 | 10 | 2 | 15 |  |

`biblioteca` cuenta dentro de `gobierno` en el modelo: en `campus-escom/rutas.json` comparten destino.

## Origen y calidad

| Origen | Fotos |
|---|---:|
| docx | 5 |
| dron | 8 |
| fuente_adicional | 7 |
| telefono | 95 |
| whatsapp | 24 |

- Fotos con personas: 46. Interiores: 10.
- Fotos por alumno: de 3 a 33.
- Fotos de laboratorios con GPS: 6 de 25, por lado: noreste 4, norte 1, este 1.

## Evaluación del modelo

Comparación con la galería, dejando fuera a cada alumno, con un recorte central como en el teléfono.
Exactitud nocturna: 62 de 92 (67%).

| Clase | Fotos | Recobrado | Precisión |
|---|---:|---:|---:|
| edificio_1 | 16 | 56% | 53% |
| edificio_2 | 21 | 67% | 58% |
| edificio_3 | 7 | 57% | 57% |
| edificio_4 | 9 | 44% | 57% |
| gobierno | 21 | 76% | 76% |
| laboratorios | 18 | 83% | 94% |

Umbral de «no sé»: 0.8 general y 0.71 en laboratorios. La similitud no es un porcentaje de certeza.
De día todavía no hay evidencia suficiente: faltan fotos y videos de todos los edificios.

## Qué no se publica

- Fotos, miniaturas y el ZIP del corpus.
- `corpus.csv`, `etiquetas_revisadas.csv`, `resumen.md`, manifiestos y corridas: traen nombres o rutas con nombres.
- La clave de los seudónimos.

## Pendientes

- Confirmar el origen y la licencia de las fotos de la fuente adicional.
- La galería de la app son vectores, no imágenes, pero parte de ellos sale de fotos con personas.
