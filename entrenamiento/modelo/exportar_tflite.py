"""Exporta el reconocedor por similitud a TFLite.

Salida en modelo/exportado/:
- escom_embeddings.tflite : MobileNetV3Large sin cabeza; entrada 1x224x224x3 float RGB 0..255,
  salida 1x960 (el preprocesamiento va dentro del modelo).
- escom_galeria.json      : prototipos normalizados por clase (sin fotos ni nombres), umbral y versión.
Uso: python exportar_tflite.py [umbral]
"""
import json
import sys

from comun import MODELO, SALIDAS, leer_corpus

import numpy as np
import keras
import tensorflow as tf

from evaluar import FUSION, NO_ENTRENAN

OUT = MODELO / "exportado"
OUT.mkdir(exist_ok=True)


def main():
    umbral = float(sys.argv[1]) if len(sys.argv) > 1 else 0.80
    m = keras.applications.MobileNetV3Large(include_top=False, pooling="avg", input_shape=(224, 224, 3))
    conv = tf.lite.TFLiteConverter.from_keras_model(m)
    conv.optimizations = [tf.lite.Optimize.DEFAULT]  # pesos en int8, ~4 MB
    tfl = conv.convert()
    (OUT / "escom_embeddings.tflite").write_bytes(tfl)

    informe = json.loads((SALIDAS / "informe_mobilenetv3l.json").read_text(encoding="utf-8"))
    clases = informe["clases"]
    filas = leer_corpus()
    E = np.load(SALIDAS / "emb_mobilenetv3l.npz")["emb"]
    galeria = {c: [] for c in clases}
    for f, e in zip(filas, E):
        c = FUSION.get(f["clase"], f["clase"])
        if c in clases and not f["dron"] and not f["fuera_de_sesion"] and not f["interior"] and c not in NO_ENTRENAN:
            for v in e:
                galeria[c].append((v / np.linalg.norm(v)).round(5).tolist())

    # Comprobación: el TFLite cuantizado debe dar casi el mismo embedding que Keras.
    it = tf.lite.Interpreter(model_content=tfl)
    it.allocate_tensors()
    x = np.random.default_rng(0).uniform(0, 255, (1, 224, 224, 3)).astype(np.float32)
    it.set_tensor(it.get_input_details()[0]["index"], x)
    it.invoke()
    a = it.get_tensor(it.get_output_details()[0]["index"])[0]
    b = m.predict(x, verbose=0)[0]
    cos = float(a @ b / np.linalg.norm(a) / np.linalg.norm(b))

    (OUT / "escom_galeria.json").write_text(json.dumps({
        "version": 1, "modelo": "escom_embeddings.tflite", "entrada": [1, 224, 224, 3],
        "formato_entrada": "RGB float32 0..255, recorte central", "dimension": len(a),
        "metrica": "coseno; puntaje de clase = media de las 3 similitudes más altas; votar 5-10 cuadros",
        "umbral_no_se": umbral, "clases": clases, "prototipos": galeria,
    }), encoding="utf-8")
    print(f"tflite {len(tfl)/1e6:.1f} MB, coseno keras-vs-tflite {cos:.4f}, prototipos",
          {c: len(v) for c, v in galeria.items()})


if __name__ == "__main__":
    main()
