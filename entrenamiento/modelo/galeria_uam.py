"""Galería de UAM Azcapotzalco para reconocer el Edificio T.

Usa las etiquetas confirmadas de corpus-campus/uam_azcapotzalco/etiquetas_uam_azcapotzalco.csv si existen.
Mientras no existan, la galería es PROVISIONAL: sólo sugerencias de confianza alta, sin confirmar.
Misma red que ESCOM (MobileNetV3 congelada, TFLite) con galería, clases y umbral propios.
La evaluación deja fuera a cada autor y agrupa a quienes compartieron la misma foto.
Salida: <salida>/uam_azcapotzalco_galeria.json, uam_azcapotzalco_extras.json, informe.json y ficha.md
Uso: python galeria_uam.py <corpus-campus> <modelo.tflite> <rutas.json> <salida>
"""
import collections
import csv
import hashlib
import hmac
import json
import math
import pathlib
import sys

from comun import RAIZ, recorte_central

import numpy as np
import tensorflow as tf
from PIL import Image, ImageOps

from embeddings import vistas

OBJETIVO = "T"
LADOS = ["norte", "noreste", "este", "sureste", "sur", "suroeste", "oeste", "noroeste"]
DESTINOS = {"T": "T", "G": "G", "W": "W", "COSEI": "COSEI", "R": "R", "F": "F"}  # 2P y CIAD aún no se vinculan con el mapa
MIN_FOTOS, MIN_GRUPOS = 5, 2


def leer(p):
    with open(p, encoding="utf-8-sig", newline="") as fh:
        return list(csv.DictReader(fh))


def unit(v):
    return v / (np.linalg.norm(v, axis=-1, keepdims=True) + 1e-9)


def gps(p):
    try:
        g = Image.open(p).getexif().get_ifd(0x8825)
        d = lambda t: float(t[0]) + float(t[1]) / 60 + float(t[2]) / 3600
        lat, lon = d(g[2]) * (-1 if g.get(1) == "S" else 1), d(g[4]) * (-1 if g.get(3, "W") == "W" else 1)
        return (lat, lon) if math.isfinite(lat) and math.isfinite(lon) and lat else None
    except Exception:
        return None


def lado(obj, pos):
    dn = (pos[0] - obj[0]) * 111320
    de = (pos[1] - obj[1]) * 111320 * math.cos(math.radians(obj[0]))
    r = (math.degrees(math.atan2(de, dn)) + 360) % 360
    return LADOS[int((r + 22.5) // 45) % 8], math.hypot(dn, de)


def main():
    corpus, tflite, rutas, salida = map(pathlib.Path, sys.argv[1:5])
    salida.mkdir(parents=True, exist_ok=True)
    u = corpus / "uam_azcapotzalco"
    meta = {x["id"]: x for x in leer(u / "corpus.csv") + leer(u / "corpus_suplemento_20261031.csv")}
    confirmadas = u / "etiquetas_uam_azcapotzalco.csv"
    provisional = not confirmadas.exists()
    if provisional:
        filas = [(x["id"], x["clase_sugerida"], x["interior"]) for x in leer(u / "etiquetas_sugeridas.csv") if x["confianza"] == "alta" and x["clase_sugerida"]]
    else:
        filas = [(x["id"], x["clase"], x["interior"]) for x in leer(confirmadas) if x["clase"]]
    vistos, datos = set(), []
    for i, c, interior in filas:
        m = meta[i]
        if interior == "si" or c in ("descartar", "no_se") or m["sha256"] in vistos:
            continue
        vistos.add(m["sha256"])
        datos.append({"id": i, "clase": c, "ruta": m["ruta"], "autor": m["grupo_evaluacion"] or m["alumno"], "sha": m["sha256"]})
    # Autores que compartieron una misma foto cuentan como un solo grupo.
    padre = {}
    def raiz(a):
        padre.setdefault(a, a)
        while padre[a] != a:
            padre[a] = padre[padre[a]]
            a = padre[a]
        return a
    por_sha = {}
    for x in meta.values():
        a = raiz(x["grupo_evaluacion"] or x["alumno"])
        if x["sha256"] in por_sha:
            padre[a] = raiz(por_sha[x["sha256"]])
        por_sha.setdefault(x["sha256"], a)
    for d in datos:
        d["grupo"] = raiz(d["autor"])
    cuenta = collections.Counter(d["clase"] for d in datos)
    grupos = collections.defaultdict(set)
    for d in datos:
        grupos[d["clase"]].add(d["grupo"])
    clases = sorted(c for c in cuenta if c != "otro" and cuenta[c] >= MIN_FOTOS and len(grupos[c]) >= MIN_GRUPOS)
    if "otro" not in clases:
        clases.append("otro")
    for d in datos:
        if d["clase"] not in clases:
            d["clase"] = "otro"  # compite contra T sin dar respuesta: evita falsos positivos
    it = tf.lite.Interpreter(model_path=str(tflite), num_threads=8)
    it.allocate_tensors()
    ent, sal = it.get_input_details()[0]["index"], it.get_output_details()[0]["index"]
    def vec(a):
        it.set_tensor(ent, a[None])
        it.invoke()
        return it.get_tensor(sal)[0].astype(np.float32)
    E = []
    for d in datos:
        im = ImageOps.exif_transpose(Image.open(corpus / d["ruta"])).convert("RGB")
        im.thumbnail((1024, 1024))
        E.append(unit(np.stack([vec(v) for v in vistas(im)])))
    E = np.stack(E)
    y = np.array([d["clase"] for d in datos])
    g = np.array([d["grupo"] for d in datos])
    # Dejando fuera a cada grupo; consulta de un recorte central, como el teléfono.
    res = []
    for i in range(len(datos)):
        tr = g != g[i]
        P, c = E[tr].reshape(-1, E.shape[-1]), np.repeat(y[tr], E.shape[1])
        sim = P @ E[i, 0]
        pun = {k: float(np.sort(sim[c == k])[-3:].mean()) for k in clases if (c == k).any()}
        mejor = max(pun, key=pun.get)
        res.append((y[i], mejor, pun.get(OBJETIVO, -1)))
    acierto = sum(a == b for a, b, _ in res)
    M = {a: collections.Counter(b for x, b, _ in res if x == a) for a in clases}
    curva, umbral = [], None
    tot_t = sum(1 for a, _, _ in res if a == OBJETIVO)
    for t in np.arange(0.55, 0.91, 0.01):
        ac = [(a, b) for a, b, s in res if b == OBJETIVO and s >= t]
        if not ac:
            continue
        prec, rec = sum(a == OBJETIVO for a, _ in ac) / len(ac), sum(a == OBJETIVO for a, _ in ac) / max(1, tot_t)
        curva.append({"umbral": round(float(t), 2), "precision": round(prec, 3), "recobrado": round(rec, 3), "aceptadas": len(ac)})
        if umbral is None and prec >= 0.9 and len(ac) >= 5:
            umbral = round(float(t), 2)
    red = json.loads(rutas.read_text(encoding="utf-8"))
    nodo = next(x["nodo"] for x in red["destinos"] if x["id"] == OBJETIVO)
    obj = next((n["lat"], n["lon"]) for n in red["nodos"] if n["id"] == nodo)
    prototipos = {c: [] for c in clases}
    lados = []
    for d, e in zip(datos, E):
        prototipos[d["clase"]].extend(np.round(e, 6).tolist())
        if d["clase"] == OBJETIVO:
            pos = gps(corpus / d["ruta"])
            l = lado(obj, pos) if pos else None
            lados.extend([l[0] if l and l[1] < 300 else None] * E.shape[1])
    sha = hashlib.sha256(tflite.read_bytes()).hexdigest()
    (salida / "uam_azcapotzalco_galeria.json").write_text(json.dumps({
        "version": 1, "estado": "provisional sin etiquetas confirmadas" if provisional else "etiquetas confirmadas",
        "modelo": "escom_embeddings.tflite", "sha256_modelo": sha, "dimension": 960, "entrada": [1, 224, 224, 3],
        "umbral_no_se": 0.8, "clases": clases, "destinos": {c: v for c, v in DESTINOS.items() if c in clases},
        "prototipos": prototipos, "privacidad": "Inferencia local. No contiene fotos, nombres ni rutas."}, ensure_ascii=False), encoding="utf-8")
    (salida / "uam_azcapotzalco_extras.json").write_text(json.dumps({
        "version": 1, "objetivo": OBJETIVO, "referencia": "nodo T de campus/rutas.json", "objetivo_lat_lon": obj,
        "umbral_objetivo": umbral, "lados_objetivo": lados}, ensure_ascii=False), encoding="utf-8")
    informe = {"provisional": provisional, "fotos": len(datos), "clases": dict(collections.Counter(y.tolist())),
               "grupos": len(set(g.tolist())), "grupos_por_clase": {c: len({d["grupo"] for d in datos if d["clase"] == c}) for c in clases},
               "exactitud": round(acierto / len(res), 3), "matriz": {k: dict(v) for k, v in M.items()},
               "umbral_T": umbral, "curva_T": curva, "lados_T": dict(collections.Counter(l for l in lados[::E.shape[1]] if l))}
    (salida / "informe.json").write_text(json.dumps(informe, ensure_ascii=False, indent=1), encoding="utf-8")
    # Ficha y listado anónimos: la clave de seudónimos no sale del equipo.
    clave = (RAIZ / "_privado" / "clave_seudonimos.txt").read_text(encoding="utf-8").strip().encode()
    firma = lambda t: hmac.new(clave, t.encode("utf-8"), hashlib.sha256).hexdigest()
    alias = {a: f"fuente_{i:02d}" for i, a in enumerate(sorted(set(g.tolist()), key=lambda a: firma("uam:" + a)), 1)}
    orden = sorted(range(len(datos)), key=lambda i: firma("uamfoto:" + datos[i]["sha"]))
    with open(salida / "manifiesto_anonimo.csv", "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh, lineterminator="\n")
        w.writerow(["foto", "fuente", "clase_modelo", "sha256_16"])
        for n, i in enumerate(orden, 1):
            w.writerow([f"foto_{n:03d}", alias[datos[i]["grupo"]], datos[i]["clase"], datos[i]["sha"][:16]])
    print(json.dumps({k: v for k, v in informe.items() if k != "curva_T"}, ensure_ascii=False))
    print([c for c in curva if 0.6 <= c["umbral"] <= 0.84 and round(c["umbral"] * 100) % 2 == 0])


if __name__ == "__main__":
    main()
