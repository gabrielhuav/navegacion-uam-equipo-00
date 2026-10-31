"""Utilidades compartidas: lectura del corpus, etiquetas revisadas e imágenes."""
import csv
import ctypes
import os
import pathlib

# El python.exe de Anaconda trae un msvcp140.dll viejo (14.29) que impide cargar
# TensorFlow 2.21; se cargan primero las versiones de System32.
if os.name == "nt":
    for _dll in ("msvcp140.dll", "vcruntime140.dll", "vcruntime140_1.dll"):
        ctypes.WinDLL(os.path.join(os.environ["SystemRoot"], "System32", _dll))
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

import numpy as np
from PIL import Image, ImageOps
import pillow_heif

pillow_heif.register_heif_opener()

RAIZ = pathlib.Path(__file__).resolve().parent.parent
MODELO = pathlib.Path(__file__).resolve().parent
SALIDAS = MODELO / "salidas"
SALIDAS.mkdir(exist_ok=True)
# Capa de etiquetas confirmadas por el profesor; nunca se reescribe corpus.csv.
ETIQUETAS_REVISADAS = RAIZ / "etiquetas_revisadas.csv"

CLASES_PAGINA = [
    "edificio_1", "edificio_2", "edificio_3", "edificio_4", "edificio_5",
    "laboratorios", "gobierno", "biblioteca", "auditorio", "cafeteria",
    "otro", "descartar", "no_se",
]


def leer_corpus():
    filas = list(csv.DictReader(open(RAIZ / "corpus.csv", encoding="utf-8-sig")))
    revis = {}
    if ETIQUETAS_REVISADAS.exists():
        for r in csv.DictReader(open(ETIQUETAS_REVISADAS, encoding="utf-8-sig")):
            revis[r["ruta"]] = r
    for f in filas:
        f["clase_original"] = f["clase"]
        r = revis.get(f["ruta"], {})
        if r:
            f["clase"] = r["clase_nueva"]
        f["interior"] = r.get("interior") == "si"
        f["dron"] = "DJI" in f["telefono"]
        f["fuera_de_sesion"] = f["sesion"] != "noche"
    return filas


def abrir(ruta, lado=None):
    im = Image.open(RAIZ / ruta)
    im = ImageOps.exif_transpose(im).convert("RGB")
    if lado:
        im.thumbnail((lado, lado))
    return im


def recorte_central(im, n=224):
    """Redimensiona el lado menor a n y recorta el centro (como haría la cámara)."""
    w, h = im.size
    s = n / min(w, h)
    im = im.resize((max(n, round(w * s)), max(n, round(h * s))), Image.BILINEAR)
    w, h = im.size
    l, t = (w - n) // 2, (h - n) // 2
    return np.asarray(im.crop((l, t, l + n, t + n)), dtype=np.float32)
