"""Iteración reproducible local: galería MobileNet/LiteRT + sonda lineal.

Conserva corpus, etiquetas, exportación anterior y fotos originales. Agrupa las
7 fotos de procedencia desconocida como una fuente única. Evalúa consultas de
un recorte central, como la futura app. No interpreta similitud como probabilidad.
"""
import argparse
import collections
import datetime
import hashlib
import json
import pathlib
import shutil
import time

from comun import RAIZ, MODELO, abrir, leer_corpus, recorte_central
from embeddings import vistas
import numpy as np
import tensorflow as tf
from sklearn.linear_model import LogisticRegression
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from PIL import Image, ImageOps


def sha(p):
    return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()


def unit(x):
    return x / np.maximum(np.linalg.norm(x, axis=-1, keepdims=True), 1e-12)


def phash(im):
    # dHash sobre la imagen completa. Se usa sólo para agrupar posibles duplicados.
    a = np.asarray(im.convert("L").resize((9, 8)), dtype=np.int16)
    return np.packbits((a[:, 1:] > a[:, :-1]).reshape(-1)).tobytes()


def metrics(y, scores, classes, threshold):
    if not len(y):
        return {"n": 0}
    pred = scores.argmax(1)
    confidence = scores.max(1)
    accepted = confidence >= threshold if threshold is not None else None
    matrix = np.zeros((len(classes), len(classes)), dtype=int)
    for a, b in zip(y, pred):
        matrix[a, b] += 1
    per = {}
    for k, c in enumerate(classes):
        per[c] = {
            "n": int(matrix[k].sum()),
            "aciertos": int(matrix[k, k]),
            "recobrado": float(matrix[k, k] / matrix[k].sum()) if matrix[k].sum() else None,
            "precision": float(matrix[k, k] / matrix[:, k].sum()) if matrix[:, k].sum() else None,
        }
    return {"n": len(y), "aciertos": int((pred == y).sum()),
            "exactitud": float(np.mean(pred == y)), "matriz": matrix.tolist(),
            "por_clase": per, "umbral": threshold,
            "aceptadas": int(accepted.sum()) if accepted is not None else None,
            "cobertura": float(accepted.mean()) if accepted is not None else None,
            "aciertos_aceptadas": int(((pred == y) & accepted).sum()) if accepted is not None else None,
            "exactitud_aceptadas": float(np.mean(pred[accepted] == y[accepted])) if accepted is not None and accepted.any() else None}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--fotos", required=True)
    ap.add_argument("--umbral", type=float, default=0.80)
    args = ap.parse_args()
    stamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    run = MODELO / "corridas" / (stamp + "_letras_escom")
    run.mkdir(parents=True, exist_ok=False)
    (run / "exportado").mkdir()
    original_model = MODELO / "exportado" / "escom_embeddings.tflite"
    frozen = {str(p.relative_to(RAIZ)): sha(p) for p in
              [RAIZ / "corpus.csv", RAIZ / "etiquetas_revisadas.csv",
               original_model, MODELO / "exportado" / "escom_galeria.json"]}
    for name in ("corpus.csv", "etiquetas_revisadas.csv"):
        shutil.copy2(RAIZ / name, run / name)
    shutil.copy2(pathlib.Path(__file__), run / pathlib.Path(__file__).name)
    # Misma red preentrenada que la app usará; la nueva galería se calcula con TFLite.
    shutil.copy2(original_model, run / "exportado" / original_model.name)
    files = sorted(p for p in pathlib.Path(args.fotos).iterdir()
                   if p.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"})
    rows = leer_corpus()
    n_original = len(rows)
    additions = []
    originals_by_sha = collections.defaultdict(list)
    for row in rows:
        originals_by_sha[sha(RAIZ / row["ruta"])].append(row["ruta"])
    extra_dir = RAIZ / "adicionales" / "letras_escom"
    extra_dir.mkdir(parents=True, exist_ok=True)
    for p in files:
        digest = sha(p)
        dst = extra_dir / p.name
        if dst.exists() and sha(dst) != digest:
            raise RuntimeError("El destino ya existe con otros bytes: " + str(dst))
        if not dst.exists():
            shutil.copy2(p, dst)
        assert sha(dst) == digest
        im = ImageOps.exif_transpose(Image.open(dst)).convert("RGB")
        item = {"ruta": str(dst.relative_to(RAIZ)), "clase": "laboratorios", "sesion": "dia",
                "fecha": "desconocida", "telefono": "desconocido", "alumno": "fuente_adicional_letras_escom",
                "tipo": "foto", "duracion_segundos": "",
                "observaciones": "Aporte del propietario; procedencia y fecha no verificadas; agrupado como una sola fuente.",
                "interior": False, "dron": False, "fuera_de_sesion": True,
                "sha256": digest, "ancho": im.width, "alto": im.height,
                "duplicada_exacta_de": originals_by_sha.get(digest, [])}
        if p.name in {"images (2).jpg", "images.jpg"}:
            item["observaciones"] += " Contiene o podría contener rótulos/gráficos superpuestos."
        additions.append(item)
        if not item["duplicada_exacta_de"]:
            rows.append(item)
    (run / "adicionales.json").write_text(json.dumps(additions, ensure_ascii=False, indent=2), encoding="utf-8")
    (run / "manifiesto.json").write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")

    classes = ["edificio_1", "edificio_2", "edificio_3", "edificio_4", "gobierno", "laboratorios"]
    for r in rows:
        r["c"] = "gobierno" if r["clase"] == "biblioteca" else r["clase"]
    # Cada autor y cada posible duplicado deben quedar en el mismo lado del corte.
    parent = list(range(len(rows)))
    def find(a):
        while parent[a] != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a
    def merge(a, b):
        parent[find(a)] = find(b)
    authors = {}
    hashes, dhashes = [], []
    for i, r in enumerate(rows):
        if r["alumno"] in authors:
            merge(i, authors[r["alumno"]])
        authors[r["alumno"]] = i
        hashes.append(sha(RAIZ / r["ruta"]))
        dhashes.append(phash(abrir(r["ruta"])))
    similar = []
    for i in range(len(rows)):
        for j in range(i):
            distance = sum((a ^ b).bit_count() for a, b in zip(dhashes[i], dhashes[j]))
            if hashes[i] == hashes[j] or distance <= 4:
                merge(i, j)
                similar.append({"a": rows[i]["ruta"], "b": rows[j]["ruta"], "distancia_dhash": distance})
    groups = np.array([find(i) for i in range(len(rows))])
    (run / "posibles_duplicados.json").write_text(json.dumps(similar, ensure_ascii=False, indent=2), encoding="utf-8")

    interpreter = tf.lite.Interpreter(model_path=str(original_model), num_threads=2)
    interpreter.allocate_tensors()
    input_info, output_info = interpreter.get_input_details()[0], interpreter.get_output_details()[0]
    assert input_info["shape"].tolist() == [1, 224, 224, 3]
    assert input_info["dtype"] == np.float32
    embeddings, latencies = [], []
    for i, row in enumerate(rows):
        feature_views = []
        for x in vistas(abrir(row["ruta"], 1024)):
            interpreter.set_tensor(input_info["index"], x[None].astype(np.float32))
            start = time.perf_counter()
            interpreter.invoke()
            latencies.append((time.perf_counter() - start) * 1000)
            feature_views.append(interpreter.get_tensor(output_info["index"])[0].copy())
        embeddings.append(feature_views)
        if i % 25 == 0:
            print("embeddings TFLite", i + 1, "/", len(rows), flush=True)
    e = np.asarray(embeddings, dtype=np.float32)
    assert np.isfinite(e).all()
    np.savez_compressed(run / "embeddings_tflite.npz", emb=e, rutas=np.array([r["ruta"] for r in rows]))

    def eligible(i):
        r = rows[i]
        return not r["dron"] and not r["interior"] and r["c"] in classes
    night = [i for i in range(n_original) if eligible(i) and rows[i]["sesion"] == "noche"]
    extra = [i for i in range(n_original, len(rows)) if eligible(i)]
    day = [i for i in range(n_original) if eligible(i) and rows[i]["sesion"] != "noche"]
    negative = [i for i, r in enumerate(rows[:n_original]) if not r["dron"] and not r["interior"]
                and r["c"] not in classes + ["no_se", "descartar", "_sin_clasificar", ""]]
    labels = np.array([classes.index(r["c"]) if r["c"] in classes else -1 for r in rows])
    safe_folds = []
    for g in sorted(set(groups[night])):
        train = [i for i in night if groups[i] != g]
        assert set(labels[train]) == set(range(len(classes))), "Faltan clases al separar grupos"
        safe_folds.append({"grupo": int(g), "prueba": int(sum(groups[night] == g)), "entrena": len(train)})

    def predictor(train, method="galeria"):
        x, y = unit(e[train].reshape(-1, e.shape[-1])), np.repeat(labels[train], 3)
        if method == "lineal":
            clf = LogisticRegression(max_iter=3000, C=0.5, class_weight="balanced", random_state=0)
            clf.fit(x, y)
            return lambda tests: clf.predict_proba(unit(e[tests, 0]))
        def predict(tests):
            sims = unit(e[tests, 0]) @ x.T
            return np.stack([np.sort(sims[:, y == k], axis=1)[:, -3:].mean(1)
                             for k in range(len(classes))], axis=1)
        return predict

    def oof(method, extended):
        p = np.zeros((len(night), len(classes)))
        for g in sorted(set(groups[night])):
            mask = groups[night] == g
            test = np.array(night)[mask].tolist()
            train = [i for i in night + (extra if extended else []) if groups[i] != g]
            assert not set(groups[train]) & set(groups[test])
            p[mask] = predictor(train, method)(test)
        return p
    report = {"version": 2, "corrida": run.name, "clases": classes,
              "metodo_desplegable": "MobileNetV3Large preentrenada congelada + galería por similitud",
              "entrenamiento_adicional": "Sonda lineal ajustada y guardada para comparación; no es la cabeza desplegada.",
              "protocolo": "Consultas centrales de una imagen. Validación por autor/fuente y posibles duplicados agrupados.",
              "umbral_galeria": args.umbral, "umbral_no_calibrado_en_nuevas_fotos": True,
              "fotos_originales": n_original, "fotos_adicionales_recibidas": len(additions),
              "fotos_adicionales_unicas": len(extra), "total_fotos": len(rows),
              "fotos_entrenamiento_base": len(night), "fotos_entrenamiento_actualizado": len(night + extra),
              "fotos_por_clase_actualizado": dict(collections.Counter(rows[i]["c"] for i in night + extra)),
              "grupos_adicionales": len(set(groups[extra])), "pares_posiblemente_duplicados": len(similar),
              "folds": safe_folds, "comparacion": {}, "prueba_diurna_original": {},
              "tiempo_inferencia_cpu_ms_mediana": float(np.median(latencies[3:])),
              "equipo_medicion": "PC, TFLite CPU dos hilos; no representa la latencia del teléfono"}
    for method in ("galeria", "lineal"):
        report["comparacion"][method] = {}
        for name, extended in (("antes", False), ("despues", True)):
            scores = oof(method, extended)
            report["comparacion"][method][name] = metrics(labels[night], scores, classes, args.umbral if method == "galeria" else None)
            np.save(run / f"predicciones_{method}_{name}.npy", scores)
            print(method, name, report["comparacion"][method][name]["exactitud"], flush=True)

    # Prueba diurna original: nunca se incorpora al entrenamiento ni se permite un duplicado en él.
    for name, train_all in (("antes", night), ("despues", night + extra)):
        pday = []
        for i in day:
            train = [j for j in train_all if groups[j] != groups[i]]
            pday.append(predictor(train)([i])[0])
        scores = np.asarray(pday)
        report["prueba_diurna_original"][name] = metrics(labels[day], scores, classes, args.umbral)
        report["prueba_diurna_original"][name]["predicciones"] = [
            {"ruta": rows[i]["ruta"], "real": rows[i]["c"], "predicha": classes[int(p.argmax())],
             "similitud": float(p.max())} for i, p in zip(day, scores)]
    # Siete aportes completos fuera de la galería: no evaluar con su propia copia ni sus recortes.
    excluded_groups = set(groups[extra])
    web_train = [i for i in night if groups[i] not in excluded_groups]
    report["nuevo_grupo_diurno_fuera_entrenamiento"] = metrics(
        labels[extra], predictor(web_train)(extra), classes, args.umbral)
    # Negativos originales no se usan para construir la galería ni para elegir el umbral.
    neg_scores = []
    for i in negative:
        train = [j for j in night + extra if groups[j] != groups[i]]
        neg_scores.append(predictor(train)([i])[0])
    report["negativos_no_entrenados"] = {"n": len(negative), "clase_otro": sum(rows[i]["c"] == "otro" for i in negative),
        "falsos_aceptados": int(sum(float(p.max()) >= args.umbral for p in neg_scores)),
        "advertencia": "Muestra pequeña y no representativa de todos los entornos; no certifica rechazo en campo."}

    trained = LogisticRegression(max_iter=3000, C=0.5, class_weight="balanced", random_state=0)
    trained.fit(unit(e[night + extra].reshape(-1, e.shape[-1])), np.repeat(labels[night + extra], 3))
    np.savez(run / "sonda_lineal_entrenada.npz", coef=trained.coef_, intercept=trained.intercept_, clases=np.array(classes))
    # Prototipos de las tres vistas de cada foto. Nunca incluyen nombres de alumnos ni rutas personales.
    prototypes = {c: [] for c in classes}
    for i in night + extra:
        prototypes[rows[i]["c"]].extend(unit(e[i]).round(6).tolist())
    destinations = {"edificio_1": "1", "edificio_2": "2", "edificio_3": "3", "edificio_4": "4",
                    "gobierno": "GOB", "laboratorios": "LAB"}
    gallery = {"version": 2, "corrida": run.name, "estado": "experimental",
        "modelo": original_model.name, "sha256_modelo": sha(original_model),
        "entrada": [1, 224, 224, 3], "formato_entrada": "RGB float32 0..255; orientación corregida; recorte central; resize bilinear",
        "dimension": int(e.shape[-1]), "normalizacion_salida": "L2",
        "metrica": "coseno; media de las 3 similitudes más altas por clase y por cuadro",
        "umbral_no_se": args.umbral, "umbral_experimental": True,
        "votacion_temporal": "pendiente de validar con video real; no se mide como acierto en esta corrida",
        "clases": classes, "destinos_escom": destinations, "prototipos": prototypes,
        "privacidad": "Inferencia local. El paquete no contiene fotos, nombres, correos ni rutas de los autores."}
    exported = run / "exportado"
    (exported / "escom_galeria.json").write_text(json.dumps(gallery, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    # Verificar que el archivo que recibirá la app reproduce el predictor utilizado al evaluar.
    test_idxs = night[:2] + extra[:2] + day[:2]
    pg = []
    for c in classes:
        pg.append(np.asarray(gallery["prototipos"][c], dtype=np.float32))
    serialized_scores = np.array([[np.sort(unit(e[i, 0])[None] @ p.T)[0, -3:].mean() for p in pg] for i in test_idxs])
    reference_scores = predictor(night + extra)(test_idxs)
    error = float(np.max(np.abs(serialized_scores - reference_scores)))
    assert error < 1e-4, error
    report["verificacion_exportado"] = {"max_error_puntaje_json": error, "entrada": input_info["shape"].tolist(),
        "salida": output_info["shape"].tolist(), "prototipos_por_clase": {c: len(p) for c, p in prototypes.items()},
        "sha256_tflite": sha(exported / original_model.name), "sha256_galeria": sha(exported / "escom_galeria.json")}
    for rel, digest in frozen.items():
        assert sha(RAIZ / rel) == digest, "Se modificó un original: " + rel
    report["originales_intactos"] = frozen
    (run / "informe.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    matrix = np.array(report["comparacion"]["galeria"]["despues"]["matriz"])
    fig, ax = plt.subplots(figsize=(8, 6))
    ax.imshow(matrix, cmap="Blues")
    ax.set_xticks(range(len(classes)), classes, rotation=30, ha="right")
    ax.set_yticks(range(len(classes)), classes)
    for (i, j), value in np.ndenumerate(matrix):
        ax.text(j, i, str(value), ha="center", va="center")
    ax.set_xlabel("Predicción"); ax.set_ylabel("Etiqueta real")
    ax.set_title("Galería actualizada: una imagen central, grupos separados")
    fig.tight_layout(); fig.savefig(run / "matriz_galeria_actualizada.png", dpi=150); plt.close(fig)
    summary = ["# Entrenamiento actualizado de ESCOM", "", f"Corrida: {run.name}", "",
        f"Se recibieron {len(additions)} fotos y se incorporaron {len(extra)} nuevas por bytes.",
        f"Galería: {len(night)} fotos nocturnas originales + {len(extra)} diurnas adicionales.",
        "", "Las siete adicionales forman una sola fuente. Los autores y posibles duplicados se mantienen fuera del entrenamiento cuando se evalúan sus imágenes.",
        "", "| Evaluación comparable | Antes | Después |", "|---|---:|---:|"]
    for label, a in (("Galería, fotos nocturnas fuera de autor", report["comparacion"]["galeria"]),
                     ("Sonda lineal, fotos nocturnas fuera de autor", report["comparacion"]["lineal"]),
                     ("Fotos diurnas originales reservadas", report["prueba_diurna_original"])):
        summary.append(f"| {label} | {a['antes']['aciertos']}/{a['antes']['n']} ({a['antes']['exactitud']:.1%}) | {a['despues']['aciertos']}/{a['despues']['n']} ({a['despues']['exactitud']:.1%}) |")
    g = report["nuevo_grupo_diurno_fuera_entrenamiento"]
    summary += ["", f"Las fotos nuevas, dejando fuera todo su grupo: {g['aciertos']}/{g['n']}. No se evalúan contra sí mismas.",
        f"Con el umbral {args.umbral}, se aceptan {report['prueba_diurna_original']['despues']['aceptadas']} de {len(day)} fotos diurnas originales y {g['aceptadas']} de {g['n']} del nuevo grupo reservado. Los aciertos de la tabla se calculan antes del rechazo por baja similitud.",
        f"Negativos: {len(negative)} imágenes; falsos aceptados al umbral {args.umbral}: {report['negativos_no_entrenados']['falsos_aceptados']}.",
        "", "## Alcance", "", "Se actualizaron los prototipos y se ajustó una sonda lineal. Los pesos de MobileNet permanecen preentrenados y congelados.",
        "La galería y la evaluación usan el mismo TFLite cuantizado y consultas de un recorte central, como se propone para el teléfono.",
        "Las métricas anteriores del piloto usaban tres vistas por foto de consulta y embeddings Keras: no se comparan directamente con estas cifras.",
        "El umbral 0.80 se conserva como experimental. Faltan negativos variados, videos independientes y una prueba en el celular.",
        "Las cuatro fotos diurnas reservadas son pocas para concluir que funciona de día. Los siete aportes cubren sólo laboratorios.",
        "", "## Archivos para la app", "", "- exportado/escom_embeddings.tflite", "- exportado/escom_galeria.json",
        "- informe.json y matriz_galeria_actualizada.png para revisar resultados.", "", "Los originales y la exportación anterior permanecen intactos. No se subió nada a servicios externos ni al repositorio."]
    (run / "RESULTADOS.md").write_text("\n".join(summary) + "\n", encoding="utf-8")
    (MODELO / "ULTIMA_CORRIDA_LETRAS.txt").write_text(str(run), encoding="utf-8")
    print("CORRIDA_COMPLETA", run, flush=True)


if __name__ == "__main__":
    main()
