"""Calcula embeddings de todas las fotos con modelos preentrenados en ImageNet.

Modelos de keras.applications (código Apache-2.0). Se guarda una fila por foto y
por vista: recorte central y la foto completa con relleno, para votar.
Uso: python embeddings.py
"""
from comun import SALIDAS, leer_corpus, abrir, recorte_central

import numpy as np
import keras

MODELOS = {
    "mobilenetv3l": (
        lambda: keras.applications.MobileNetV3Large(include_top=False, pooling="avg", input_shape=(224, 224, 3)),
        keras.applications.mobilenet_v3.preprocess_input,
    ),
    "efficientnetb0": (
        lambda: keras.applications.EfficientNetB0(include_top=False, pooling="avg", input_shape=(224, 224, 3)),
        keras.applications.efficientnet.preprocess_input,
    ),
}


def vistas(im):
    """Tres vistas por foto: centro, mitad izquierda y mitad derecha (cuadros de video simulados)."""
    w, h = im.size
    out = [recorte_central(im)]
    if w > h:
        out.append(recorte_central(im.crop((0, 0, int(w * 0.66), h))))
        out.append(recorte_central(im.crop((int(w * 0.34), 0, w, h))))
    else:
        out.append(recorte_central(im.crop((0, 0, w, int(h * 0.66)))))
        out.append(recorte_central(im.crop((0, int(h * 0.34), w, h))))
    return out


def main():
    filas = leer_corpus()
    imgs = []
    for f in filas:
        imgs.append(np.stack(vistas(abrir(f["ruta"], 1024))))
    X = np.stack(imgs)  # (n, 3, 224, 224, 3)
    n, v = X.shape[:2]
    for nombre, (crear, prep) in MODELOS.items():
        m = crear()
        e = m.predict(prep(X.reshape(n * v, 224, 224, 3).copy()), batch_size=32, verbose=0)
        e = e.reshape(n, v, -1)
        np.savez(SALIDAS / f"emb_{nombre}.npz", emb=e, rutas=np.array([f["ruta"] for f in filas]))
        print(nombre, e.shape)


if __name__ == "__main__":
    main()
