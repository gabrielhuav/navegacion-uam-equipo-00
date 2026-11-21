# Entrenamiento del reconocedor de edificios · UAM

Código y documentación del reconocimiento de edificios con la cámara en **UAM Azcapotzalco y ESCOM**. El reconocimiento sigue siendo experimental; las evaluaciones del corpus no sustituyen una prueba de campo.

## Selector y comparación de corpus

Android permite elegir **Actual (0.5.0)**, **Maestro confirmado** o **Combinado experimental** por campus. Actual es la primera elección; sus assets y el AAB de 0.5.0 se conservan. Se publican las galerías numéricas nuevas, el procedimiento y los resultados, sin añadir las fotos del maestro privado.

La combinada mejora ESCOM en la validación interna, pero empeora T en AZC. El maestro completo tampoco supera todos los indicadores de la actual. [Comparación, reproducción y límites](comparacion_corpus/README.md) · [Resultados](comparacion_corpus/RESULTADOS.md) · [Permisos y maestro privado](comparacion_corpus/CORPUS_PRIVADO.md).

**Los originales y las correspondencias con alumnos permanecen privados.** Esta carpeta contiene el código y las fichas con listados anónimos: [UAM Azcapotzalco](corpus/uam/ficha.md) y [ESCOM](corpus/ficha.md). Para UAM se incorpora también la [copia derivada con sólo caras pixeladas](corpus/uam/solo_caras/README.md), cuya subida al PR #23 autorizó el propietario. Incluye la comparación con la galería actual; la candidata permanece separada de los assets de la app.

## Cómo funciona

1. MobileNetV3Large, preentrenada en ImageNet y congelada, convierte cada imagen en un vector de 960 números.
2. La galería guarda los vectores de las fotos de referencia, tres vistas por foto.
3. El teléfono compara cada cuadro con la galería: en Actual, la media de las tres similitudes de prototipo más altas; en las candidatas, el método y los umbrales declarados en su configuración.
4. Vota entre 7 cuadros y, si no alcanza el umbral, responde «no sé».

No se reentrena la red: «entrenar» es actualizar la galería. Con tan pocas fotos, esto funcionó mejor que ajustar una capa final.

La evaluación agrupa la procedencia y las fotos compartidas; no separa al azar vistas de una misma foto. La comparación nueva deja fuera grupos completos y usa otra separación interna para elegir ajustes.

## Carpetas

| Carpeta | Contenido |
|---|---|
| `modelo/` | Scripts de revisión, etiquetado, evaluación y exportación |
| `corpus/uam/` | Ficha y listado anónimo de UAM Azcapotzalco |
| `corpus/` | Ficha y listado anónimo de la ESCOM, generados por `modelo/anonimizar_corpus.py` |
| `instrucciones-toma-2.md` | Instrucciones para la siguiente toma de fotos y videos |

## Scripts

| Script | Qué hace |
|---|---|
| `revisar_corpus.py` | Brillo, nitidez, casi duplicados, dron, WhatsApp y DOCX |
| `embeddings.py` | Vectores con MobileNetV3Large y EfficientNetB0 |
| `pagina_etiquetar.py` | Página local para confirmar la clase de cada foto |
| `evaluar.py` | Validación dejando fuera a un alumno y matriz de confusión |
| `galeria_uam.py` | Galería, evaluación y umbral del Edificio T |
| `reentrenar_letras.py` | Corrida completa de la ESCOM con el TFLite y la galería que usa la app |
| `angulos_laboratorios.py` | Lado desde el que se tomó cada foto y umbral de laboratorios |
| `exportar_tflite.py` | Exporta el extractor de vectores a TFLite |
| `anonimizar_corpus.py` | Genera la ficha y el listado anónimo |

## Cada campus, su galería

La red es la misma, pero cada campus tiene galería, clases y umbral propios: nunca se mezclan edificios de campus distintos. La app carga la galería del campus elegido.

| Campus | Edificio objetivo | Mascota sobre la cámara |
|---|---|---|
| UAM Azcapotzalco | Edificio T | UAMito, pantera negra con la playera de su unidad |
| ESCOM | Laboratorios (letras ESCOM) | Burro blanco del IPN |

Azcapotzalco lleva playera roja. Las otras unidades ya tienen la suya (Cuajimalpa naranja, Iztapalapa verde, Lerma morada y Xochimilco azul), y aparecerá cuando tengan galería.

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

Para la UAM, con las etiquetas confirmadas o, si aún no existen, con las sugerencias de confianza alta:

```bash
modelo/.venv/Scripts/python.exe modelo/galeria_uam.py <corpus-campus> <modelo.tflite> <campus/rutas.json> <salida>
```

## Antes de agregar algo a esta carpeta

Revisa que no traiga nombres, rutas de fotos ni GPS. `.gitignore` bloquea originales y corridas; sólo permite los PNG derivados y las láminas de la copia UAM revisada. No sustituye la revisión de contenidos visibles.
