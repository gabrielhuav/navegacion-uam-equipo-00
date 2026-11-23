"""Evaluación honesta por similitud (k vecinos) y sonda lineal sobre embeddings.

- Entrenamiento: sólo fotos nocturnas, sin dron, sin fuera de sesión.
- Validación dejando fuera a un alumno (leave-one-student-out).
- Votación de las 3 vistas por foto (simula varios cuadros de la cámara).
- Umbral de «no sé»: curva cobertura/exactitud.
- Prueba aparte: entrenar con noche y probar con las fotos de día etiquetadas.
Uso: python evaluar.py [mobilenetv3l|efficientnetb0]
"""
import base64
import collections
import html
import io
import json
import sys

import numpy as np
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.linear_model import LogisticRegression

from comun import SALIDAS, leer_corpus, abrir

# Clases chicas: la biblioteca está en el edificio de Gobierno (mismo destino en rutas.json).
FUSION = {"biblioteca": "gobierno"}
MIN_FOTOS, MIN_ALUMNOS = 5, 3
NO_ENTRENAN = {"_sin_clasificar", "descartar", "no_se", ""}


def normal(e):
    return e / np.linalg.norm(e, axis=-1, keepdims=True)


def clasificador(nombre, Xtr, ytr, clases):
    if nombre == "knn":
        P = normal(Xtr.mean(1))
        # Prototipos por vista: cada vista de entrenamiento cuenta como ejemplo.
        Pv = normal(Xtr.reshape(-1, Xtr.shape[-1]))
        yv = np.repeat(ytr, Xtr.shape[1])

        def pred(X):
            s = normal(X) @ Pv.T  # (n, vistas, m)
            out = np.zeros(X.shape[:2] + (len(clases),))
            for k in range(len(clases)):
                m = yv == k
                out[..., k] = np.sort(s[..., m], axis=-1)[..., -3:].mean(-1) if m.sum() else -1
            return out.mean(1)  # votación: promedio de similitudes por clase
        return pred
    clf = LogisticRegression(max_iter=3000, C=0.5, class_weight="balanced")
    clf.fit(normal(Xtr.reshape(-1, Xtr.shape[-1])), np.repeat(ytr, Xtr.shape[1]))
    idx = {c: i for i, c in enumerate(clf.classes_)}

    def pred(X):
        p = clf.predict_proba(normal(X.reshape(-1, X.shape[-1]))).reshape(X.shape[0], X.shape[1], -1)
        out = np.zeros(X.shape[:2] + (len(clases),))
        for c, i in idx.items():
            out[..., c] = p[..., i]
        return out.mean(1)
    return pred


def miniatura(ruta):
    b = io.BytesIO()
    abrir(ruta, 300).save(b, "JPEG", quality=65)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()


def main():
    modelo = sys.argv[1] if len(sys.argv) > 1 else "mobilenetv3l"
    filas = leer_corpus()
    d = np.load(SALIDAS / f"emb_{modelo}.npz")
    E = d["emb"]
    assert list(d["rutas"]) == [f["ruta"] for f in filas], "Recalcula embeddings.py"
    for f in filas:
        f["c"] = FUSION.get(f["clase"], f["clase"])

    noche = [i for i, f in enumerate(filas)
             if not f["dron"] and not f["fuera_de_sesion"] and not f["interior"] and f["c"] not in NO_ENTRENAN]
    cuenta = collections.Counter(filas[i]["c"] for i in noche)
    alumnos = collections.defaultdict(set)
    for i in noche:
        alumnos[filas[i]["c"]].add(filas[i]["alumno"])
    clases = sorted(c for c in cuenta if c != "otro" and cuenta[c] >= MIN_FOTOS and len(alumnos[c]) >= MIN_ALUMNOS)
    fuera = {c: (cuenta[c], len(alumnos[c])) for c in cuenta if c not in clases}
    # «otro» y las clases sin datos suficientes no se entrenan: sirven para medir el «no sé».
    idx = [i for i in noche if filas[i]["c"] in clases]
    neg = [i for i in noche if filas[i]["c"] not in clases]
    y = np.array([clases.index(filas[i]["c"]) for i in idx])
    alum = np.array([filas[i]["alumno"] for i in idx])

    informe = {"modelo": modelo, "clases": clases, "fotos_por_clase": {c: cuenta[c] for c in clases},
               "alumnos_por_clase": {c: len(alumnos[c]) for c in clases}, "excluidas": fuera, "metodos": {}}
    ejemplos = []
    for metodo in ["knn", "lineal"]:
        P = np.zeros((len(idx), len(clases)))
        Pneg = []
        for a in sorted(set(alum)):
            te = alum == a
            pred = clasificador(metodo, E[idx][~te], y[~te], clases)
            P[te] = pred(E[idx][te])
            nn = [i for i in neg if filas[i]["alumno"] == a]
            if nn:
                Pneg.append(pred(E[nn]))
        Pneg = np.concatenate(Pneg) if Pneg else np.zeros((0, len(clases)))
        yhat = P.argmax(1)
        conf = P.max(1)
        M = np.zeros((len(clases), len(clases)), int)
        for t, p in zip(y, yhat):
            M[t, p] += 1
        por_clase = {c: round(float(M[k, k] / M[k].sum()), 2) for k, c in enumerate(clases)}
        precision = {c: round(float(M[k, k] / max(1, M[:, k].sum())), 2) for k, c in enumerate(clases)}
        # Curva del umbral de «no sé».
        curva = []
        for u in np.quantile(np.concatenate([conf, Pneg.max(1)]) if len(Pneg) else conf, np.linspace(0, 0.9, 10)):
            ac = conf >= u
            curva.append({"umbral": round(float(u), 3), "cobertura": round(float(ac.mean()), 2),
                          "exactitud_aceptadas": round(float((yhat[ac] == y[ac]).mean()), 2) if ac.any() else None,
                          "otros_aceptados": round(float((Pneg.max(1) >= u).mean()), 2) if len(Pneg) else None})
        azar = max(np.bincount(y)) / len(y)
        informe["metodos"][metodo] = {"exactitud": round(float((yhat == y).mean()), 3),
                                      "linea_base_clase_mayoritaria": round(float(azar), 3),
                                      "exactitud_por_clase": por_clase, "precision_por_clase": precision, "matriz": M.tolist(), "curva_no_se": curva}

        fig, ax = plt.subplots(figsize=(5, 4.4))
        ax.imshow(M, cmap="Blues")
        ax.set_xticks(range(len(clases)), clases, rotation=45, ha="right")
        ax.set_yticks(range(len(clases)), clases)
        for (r, c), v in np.ndenumerate(M):
            ax.text(c, r, v, ha="center", va="center", color="white" if v > M.max() / 2 else "black")
        ax.set_xlabel("predicha")
        ax.set_ylabel("real")
        ax.set_title(f"{modelo} · {metodo} · LOSO · exactitud {informe['metodos'][metodo]['exactitud']:.0%}")
        fig.tight_layout()
        fig.savefig(SALIDAS / f"matriz_{modelo}_{metodo}.png", dpi=120)
        plt.close(fig)
        if metodo == "knn":
            for k, i in enumerate(idx):
                if yhat[k] != y[k]:
                    ejemplos.append((filas[i], clases[y[k]], clases[yhat[k]], float(conf[k])))

    # Noche -> día: entrenar con todas las nocturnas y probar en las de día etiquetadas.
    dia = [i for i, f in enumerate(filas) if f["fuera_de_sesion"] and not f["dron"] and f["c"] in clases]
    if dia:
        pred = clasificador("knn", E[idx], y, clases)
        p = pred(E[dia])
        informe["noche_a_dia"] = [{"ruta": filas[i]["ruta"], "real": filas[i]["c"], "predicha": clases[p[k].argmax()],
                                   "similitud": round(float(p[k].max()), 3)} for k, i in enumerate(dia)]
        informe["noche_a_dia_exactitud"] = round(float(np.mean([r["real"] == r["predicha"] for r in informe["noche_a_dia"]])), 2)

    (SALIDAS / f"informe_{modelo}.json").write_text(json.dumps(informe, ensure_ascii=False, indent=1), encoding="utf-8")
    tarj = "".join(
        f'<figure><img src="{miniatura(f["ruta"])}"><figcaption>real <b>{r}</b> → <b>{p}</b> ({c:.2f})<br><small>{html.escape(f["ruta"].split(chr(92))[-1])}</small></figcaption></figure>'
        for f, r, p, c in ejemplos)
    (SALIDAS / f"errores_{modelo}.html").write_text(
        '<!doctype html><meta charset="utf-8"><title>Errores del modelo</title><style>body{font:13px system-ui;margin:16px}'
        'div{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px}img{width:100%;height:170px;object-fit:contain;background:#000}</style>'
        f'<h1>Errores · {modelo} · k vecinos · LOSO</h1><div>{tarj}</div>', encoding="utf-8")
    print(json.dumps({k: v for k, v in informe.items() if k != "noche_a_dia"}, ensure_ascii=False)[:3000])
    print("noche_a_dia", informe.get("noche_a_dia_exactitud"), [(r["real"], r["predicha"]) for r in informe.get("noche_a_dia", [])])


if __name__ == "__main__":
    main()
