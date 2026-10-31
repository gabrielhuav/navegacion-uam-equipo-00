"""Desde qué lado se tomó cada foto de laboratorios y umbral propio de esa clase.

1. Relaciona cada prototipo de la galería con su foto (comparando vectores) y, si la foto
   guarda GPS en EXIF, calcula el rumbo desde el Edificio de Laboratorios (nodo LAB de
   campus-escom/rutas.json) hasta quien tomó la foto: el lado desde el que se ve.
2. Calibra, dejando fuera a cada alumno, el umbral de similitud para responder «laboratorios»
   con precisión >= 0,9 (una sola vista central, como el teléfono).
Escribe <corrida>/exportado/escom_angulos.json (sin rutas ni nombres: sólo lado y rumbo).
Uso: python angulos_laboratorios.py <carpeta de la corrida>
"""
import json
import math
import pathlib
import sys

from comun import RAIZ

import numpy as np
from PIL import Image

RUTAS_ESCOM = pathlib.Path(r"C:\dev\navegacion-uam-equipo-00\campus-escom\rutas.json")
LADOS = ["norte", "noreste", "este", "sureste", "sur", "suroeste", "oeste", "noroeste"]


def unit(v):
    return v / np.linalg.norm(v, axis=-1, keepdims=True)


def gps(ruta):
    try:
        g = Image.open(ruta).getexif().get_ifd(0x8825)
    except Exception:
        return None
    if not g or 2 not in g or 4 not in g:
        return None
    dec = lambda t: float(t[0]) + float(t[1]) / 60 + float(t[2]) / 3600
    lat, lon = dec(g[2]), dec(g[4])
    if g.get(1) == "S":
        lat = -lat
    if g.get(3, "W") == "W":
        lon = -lon
    return lat, lon


def rumbo(desde, hasta):
    """Rumbo en grados (0 = norte, 90 = este) de `desde` a `hasta`, en plano local."""
    dn = (hasta[0] - desde[0]) * 111_320
    de = (hasta[1] - desde[1]) * 111_320 * math.cos(math.radians(desde[0]))
    return (math.degrees(math.atan2(de, dn)) + 360) % 360, math.hypot(dn, de)


def main():
    corrida = pathlib.Path(sys.argv[1])
    filas = json.loads((corrida / "manifiesto.json").read_text(encoding="utf-8"))
    d = np.load(corrida / "embeddings_tflite.npz", allow_pickle=True)
    E = unit(d["emb"].astype(np.float32))
    galeria = json.loads((corrida / "exportado" / "escom_galeria.json").read_text(encoding="utf-8"))
    red = json.loads(RUTAS_ESCOM.read_text(encoding="utf-8"))
    nodo = next(x["nodo"] for x in red["destinos"] if x["id"] == "LAB")
    lab = next((n["lat"], n["lon"]) for n in red["nodos"] if n["id"] == nodo)

    # 1. Lado de cada prototipo de laboratorios.
    vistas = E.reshape(-1, E.shape[-1])
    protos = np.asarray(galeria["prototipos"]["laboratorios"], dtype=np.float32)
    origen = (protos @ vistas.T).argmax(1) // E.shape[1]
    lados, rumbos, cache = [], [], {}
    for i in origen:
        if i not in cache:
            p = gps(RAIZ / filas[i]["ruta"])
            if p:
                r, dist = rumbo(lab, p)
                cache[i] = (LADOS[int((r + 22.5) // 45) % 8], round(r), round(dist)) if dist < 250 else None
            else:
                cache[i] = None
        c = cache[i]
        lados.append(c[0] if c else None)
        rumbos.append(c[1] if c else None)
    fotos = {i: c for i, c in cache.items()}
    print("fotos de laboratorios en la galería:", len(fotos), "con lado:", sum(c is not None for c in fotos.values()))
    print("lados:", {l: sum(1 for c in fotos.values() if c and c[0] == l) for l in LADOS})

    # 2. Umbral propio de laboratorios (dejando fuera al alumno o fuente).
    clases = galeria["clases"]
    k_lab = clases.index("laboratorios")
    grupo = [f.get("alumno") or f.get("grupo") or f["ruta"].split("\\")[1] for f in filas]
    clase_de = {}
    for c in clases:
        for i in (np.asarray(galeria["prototipos"][c], np.float32) @ vistas.T).argmax(1) // 3:
            clase_de[int(i)] = c
    negativos = [i for i, f in enumerate(filas) if i not in clase_de and f.get("c", f.get("clase")) not in ("descartar", "no_se", "_sin_clasificar") and not f.get("dron")]
    puntos = []  # (puntaje laboratorios, ¿es la mejor clase?, ¿es laboratorios de verdad?)
    for i in list(clase_de) + negativos:
        otros = [j for j in clase_de if grupo[j] != grupo[i]]
        s = []
        for c in clases:
            P = E[[j for j in otros if clase_de[j] == c]].reshape(-1, E.shape[-1])
            s.append(np.sort(P @ E[i, 0])[-3:].mean() if len(P) else -1)
        s = np.array(s)
        puntos.append((float(s[k_lab]), int(s.argmax()) == k_lab, clase_de.get(i) == "laboratorios"))
    puntos = np.array(puntos, dtype=float)
    total_lab = puntos[:, 2].sum()
    umbral = None
    for t in np.arange(0.55, 0.90, 0.01):
        acepta = (puntos[:, 0] >= t) & (puntos[:, 1] == 1)
        if not acepta.any():
            continue
        prec = puntos[acepta, 2].mean()
        rec = (acepta & (puntos[:, 2] == 1)).sum() / total_lab
        print(f"umbral {t:.2f}: precisión {prec:.2f}, encuentra {rec:.2f} de las fotos de laboratorios, aceptadas {acepta.sum()}")
        if umbral is None and prec >= 0.9 and acepta.sum() >= 5:
            umbral = round(float(t), 2)
    print("umbral laboratorios:", umbral, "negativos:", len(negativos))

    salida = {
        "version": 1, "corrida": galeria.get("corrida"), "referencia": "nodo LAB de campus-escom/rutas.json",
        "laboratorios_lat_lon": lab,
        "umbral_laboratorios": umbral,
        "umbral_nota": "Similitud mínima para responder «laboratorios», calibrada dejando fuera a cada alumno con precisión >= 0,9. Experimental.",
        "lados_laboratorios": lados, "rumbos_laboratorios": rumbos,
        "lados_nota": "Un valor por prototipo de laboratorios, en el mismo orden que la galería; null si la foto no guardó GPS.",
    }
    (corrida / "exportado" / "escom_angulos.json").write_text(json.dumps(salida, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    main()
