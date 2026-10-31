# Entrenamiento del reconocedor de edificios · ESCOM

Código y documentación del piloto del Prototipo 4: ¿la cámara reconoce los edificios de la ESCOM con fotos de los alumnos?

**Las fotos no están aquí, ni van a estar.** Tienen nombres, caras y ubicación de alumnos, y este repositorio es público. Se quedan en la computadora del profesor. Esta carpeta sólo trae el código, una [ficha del corpus](corpus/ficha.md) y un [listado anónimo](corpus/manifiesto_anonimo.csv).

## Cómo funciona

1. MobileNetV3Large, preentrenada en ImageNet y congelada, convierte cada imagen en un vector de 960 números.
2. La galería guarda los vectores de las fotos de referencia, tres vistas por foto.
3. El teléfono compara cada cuadro con la galería: el puntaje de una clase es la media de sus tres similitudes más altas.
4. Vota entre 7 cuadros y, si no alcanza el umbral, responde «no sé».

No se reentrena la red: «entrenar» es actualizar la galería. Con tan pocas fotos, esto funcionó mejor que ajustar una capa final.

La evaluación nunca separa al azar fotos de una misma persona: siempre se deja fuera a un alumno completo.

## Carpetas

| Carpeta | Contenido |
|---|---|
| `modelo/` | Scripts de revisión, etiquetado, evaluación y exportación |
| `corpus/` | Ficha con conteos y listado anónimo, generados por `modelo/anonimizar_corpus.py` |
| `instrucciones-toma-2.md` | Instrucciones para la siguiente toma de fotos y videos |

## Scripts

| Script | Qué hace |
|---|---|
| `revisar_corpus.py` | Brillo, nitidez, casi duplicados, dron, WhatsApp y DOCX |
| `embeddings.py` | Vectores con MobileNetV3Large y EfficientNetB0 |
| `pagina_etiquetar.py` | Página local para confirmar la clase de cada foto |
| `evaluar.py` | Validación dejando fuera a un alumno y matriz de confusión |
| `reentrenar_letras.py` | Corrida completa con el TFLite y la galería que usa la app |
| `angulos_laboratorios.py` | Lado desde el que se tomó cada foto y umbral de laboratorios |
| `exportar_tflite.py` | Exporta el extractor de vectores a TFLite |
| `anonimizar_corpus.py` | Genera la ficha y el listado anónimo |

## Repetir el entrenamiento

Hace falta el corpus privado. Copia `modelo/` dentro de la carpeta del corpus, de modo que `corpus.csv` quede junto a `modelo/`. Luego, con Python 3.12:

```bash
python -m venv modelo/.venv
modelo/.venv/Scripts/python.exe -m pip install -r modelo/requirements.txt
modelo/.venv/Scripts/python.exe modelo/reentrenar_letras.py --fotos adicionales/letras_escom --umbral 0.80
modelo/.venv/Scripts/python.exe modelo/angulos_laboratorios.py <carpeta de la corrida>
```

`angulos_laboratorios.py` lee `campus-escom/rutas.json` desde `RUTAS_ESCOM`, al inicio del script: ajusta esa ruta a tu copia del repositorio.

Los archivos para la app salen en `<corrida>/exportado/` y se copian a `app-kmp/androidApp/src/main/assets/reconocimiento/`.

## Antes de agregar algo a esta carpeta

Revisa que no traiga nombres, rutas de fotos ni GPS. `.gitignore` bloquea imágenes y corridas, pero no sustituye esa revisión.
