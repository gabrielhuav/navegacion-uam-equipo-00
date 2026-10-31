"""Revisión de calidad del corpus: no modifica ninguna foto.

Genera modelo/salidas/revision.csv con brillo, nitidez, EXIF, duplicados
cercanos (dHash) y marcas de dron / WhatsApp / DOCX.
Uso: python revisar_corpus.py
"""
import csv
import collections
import pathlib

import numpy as np
from PIL import Image, ImageOps, ExifTags
import pillow_heif

pillow_heif.register_heif_opener()

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SALIDAS = pathlib.Path(__file__).resolve().parent / "salidas"
SALIDAS.mkdir(exist_ok=True)

TAGS = {v: k for k, v in ExifTags.TAGS.items()}


def dhash(gris, n=8):
    p = np.asarray(gris.resize((n + 1, n), Image.BILINEAR), dtype=np.int16)
    return (p[:, 1:] > p[:, :-1]).flatten()


def nitidez(gris):
    # Varianza del laplaciano sobre una versión de 512 px de lado mayor.
    a = np.asarray(gris, dtype=np.float32)
    lap = a[1:-1, :-2] + a[1:-1, 2:] + a[:-2, 1:-1] + a[2:, 1:-1] - 4 * a[1:-1, 1:-1]
    return float(lap.var())


def main():
    filas = list(csv.DictReader(open(RAIZ / "corpus.csv", encoding="utf-8-sig")))
    res = []
    hashes = []
    for f in filas:
        ruta = RAIZ / f["ruta"]
        im = Image.open(ruta)
        exif = im.getexif()
        w, h = im.size
        im = ImageOps.exif_transpose(im).convert("RGB")
        im.thumbnail((512, 512))
        gris = im.convert("L")
        g = np.asarray(gris, dtype=np.float32)
        nombre = ruta.name.lower()
        r = {
            "ruta": f["ruta"],
            "clase": f["clase"],
            "sesion": f["sesion"],
            "alumno": f["alumno"],
            "telefono": f["telefono"],
            "ancho": w,
            "alto": h,
            "mp": round(w * h / 1e6, 1),
            "brillo": round(float(g.mean()), 1),
            "pct_negro": round(float((g < 20).mean()) * 100, 1),
            "nitidez": round(nitidez(gris), 1),
            "exif_modelo": str(exif.get(TAGS["Model"], "")).strip(),
            "dron": "DJI" in f["telefono"],
            "whatsapp": "whatsapp" in nombre or "-wa" in nombre,
            "docx": "docx" in f["observaciones"].lower() or nombre.startswith("imagen "),
            "caras": "caras" in f["observaciones"].lower(),
        }
        r["oscura"] = r["brillo"] < 45
        r["borrosa"] = r["nitidez"] < 40
        res.append(r)
        hashes.append(dhash(gris))

    # Duplicados cercanos: distancia de Hamming de dHash <= 6 de 64.
    H = np.array(hashes)
    grupos = collections.defaultdict(list)
    for i in range(len(H)):
        for j in range(i + 1, len(H)):
            if (H[i] != H[j]).sum() <= 6:
                grupos[i].append(j)
    for r in res:
        r["casi_duplicado_de"] = ""
    for i, js in grupos.items():
        for j in js:
            if not res[j]["casi_duplicado_de"]:
                res[j]["casi_duplicado_de"] = res[i]["ruta"]

    with open(SALIDAS / "revision.csv", "w", newline="", encoding="utf-8-sig") as fh:
        w = csv.DictWriter(fh, fieldnames=list(res[0].keys()))
        w.writeheader()
        w.writerows(res)

    c = collections.Counter
    print("total", len(res))
    for k in ["dron", "whatsapp", "docx", "caras", "oscura", "borrosa"]:
        print(k, sum(r[k] for r in res))
    print("casi_duplicados", sum(bool(r["casi_duplicado_de"]) for r in res))
    print("brillo noche p10/p50/p90", np.percentile([r["brillo"] for r in res if r["sesion"] == "noche"], [10, 50, 90]).round(1))
    print("nitidez p10/p50/p90", np.percentile([r["nitidez"] for r in res], [10, 50, 90]).round(1))
    print("mp", c(round(r["mp"]) for r in res))
    print("alumnos por clase (noche, etiquetadas):")
    por = collections.defaultdict(set)
    for r in res:
        if r["sesion"] == "noche":
            por[r["clase"]].add(r["alumno"])
    for k, v in sorted(por.items()):
        print(" ", k, len(v))
    for r in res:
        if r["casi_duplicado_de"]:
            print("DUP", r["ruta"][-60:], "<-", r["casi_duplicado_de"][-60:])
    for r in res:
        if r["borrosa"] or r["oscura"]:
            print("CAL", r["clase"], r["brillo"], r["nitidez"], r["ruta"][-55:])


if __name__ == "__main__":
    main()
