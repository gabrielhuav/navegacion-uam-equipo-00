"""Rasgos y galerías offline; no escribe corpus, pesos ni recursos de la app.

extraer(rows, cache_dir, model_path) devuelve dict[id] con refs float32[3,960]
y query float32[960]. exportar_galerias(rows, features, outdir) devuelve
dict[campus, Path] de candidatas sin destinos integrados. No filtra filas: la
selección de clases/interiores, duplicados y particiones pertenece al llamador.
"""
from __future__ import annotations

import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import re
import tempfile
import zipfile
from collections import defaultdict

EXPECTED_MODEL_SHA256 = "d01e31483ac10fc887e5b4e7d47ee0e7a93cc196c56286312329401e219474bd"
THREADS = 2
DIMENSION = 960
CAMPUSES = frozenset({"escom", "uam_azcapotzalco", "uam_cuajimalpa", "uam_iztapalapa", "uam_lerma", "uam_xochimilco"})
PROTOCOL = {
    "version": "mobilenet_vigente_20261116_v1",
    "orientation": "ImageOps.exif_transpose",
    "color": "RGB",
    "size_limit": "Pillow Image.thumbnail((1024,1024)) default resample",
    "views": "center; horizontal left/right .66/.34 if width>height, otherwise vertical top/bottom .66/.34; integer truncation",
    "crop": "resize shorter side to224 using round and max224; PIL BILINEAR; center crop floor offsets",
    "input": "float32[1,224,224,3] RGB0..255; no external model preprocessing",
    "output": "float32[3,960]; L2 divide by norm+1e-9 for each view",
    "query": "refs[0] unchanged, not an average or three-view vote",
    "interpreter_threads": THREADS,
}


def _json_bytes(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode("utf-8")


PROTOCOL_SHA256 = hashlib.sha256(_json_bytes(PROTOCOL)).hexdigest()


def _sha(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def _versions():
    return {key: importlib.metadata.version(dist) for key, dist in
            (("tensorflow", "tensorflow"), ("numpy", "numpy"), ("pillow", "Pillow"))}


def _libraries():
    # El mismo arreglo de DLL usado por la corrida vigente en Windows/Anaconda.
    if os.name == "nt":
        import ctypes
        for name in ("msvcp140.dll", "vcruntime140.dll", "vcruntime140_1.dll"):
            ctypes.WinDLL(os.path.join(os.environ["SystemRoot"], "System32", name))
    for key in ("OMP_NUM_THREADS", "TF_NUM_INTRAOP_THREADS", "OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS"):
        os.environ.setdefault(key, str(THREADS))
    os.environ.setdefault("TF_NUM_INTEROP_THREADS", "1")
    os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
    import numpy as np
    from PIL import Image, ImageOps
    import pillow_heif
    pillow_heif.register_heif_opener()
    return np, Image, ImageOps


def _interpreter(model_path):
    import tensorflow as tf
    import numpy as np
    interpreter = tf.lite.Interpreter(model_path=str(model_path), num_threads=THREADS)
    interpreter.allocate_tensors()
    incoming, outgoing = interpreter.get_input_details()[0], interpreter.get_output_details()[0]
    if list(incoming["shape"]) != [1, 224, 224, 3] or incoming["dtype"] != np.float32:
        raise RuntimeError("El TFLite no conserva la entrada RGB float32 224x224 vigente.")
    if list(outgoing["shape"]) != [1, DIMENSION] or outgoing["dtype"] != np.float32:
        raise RuntimeError("El TFLite no conserva la salida float32 de 960 valores.")
    return interpreter, incoming["index"], outgoing["index"]


def _center(im, np, Image):
    width, height = im.size
    scale = 224 / min(width, height)
    im = im.resize((max(224, round(width * scale)), max(224, round(height * scale))), Image.Resampling.BILINEAR)
    width, height = im.size
    left, top = (width - 224) // 2, (height - 224) // 2
    return np.asarray(im.crop((left, top, left + 224, top + 224)), dtype=np.float32)


def _views(im, np, Image):
    width, height = im.size
    result = [_center(im, np, Image)]
    if width > height:
        boxes = ((0, 0, int(width * .66), height), (int(width * .34), 0, width, height))
    else:
        boxes = ((0, 0, width, int(height * .66)), (0, int(height * .34), width, height))
    result.extend(_center(im.crop(box), np, Image) for box in boxes)
    return result


def _check_rows(rows):
    ids = set()
    for n, row in enumerate(rows):
        if any(key not in row for key in ("id", "campus", "clase", "ruta", "sha256", "interior", "grupo", "origen")):
            raise ValueError(f"Fila {n}: faltan campos del manifiesto acordado.")
        if not isinstance(row["id"], str) or not row["id"] or row["id"] in ids:
            raise ValueError(f"Fila {n}: identificador vacío, inválido o repetido.")
        ids.add(row["id"])
        if row["campus"] not in CAMPUSES:
            raise ValueError(f"Fila {n}: campus fuera del catálogo de seis sedes.")
        if not isinstance(row["clase"], str) or not row["clase"].strip():
            raise ValueError(f"Fila {n}: clase vacía.")
        if not isinstance(row["sha256"], str) or not re.fullmatch(r"[0-9a-fA-F]{64}", row["sha256"]):
            raise ValueError(f"Fila {n}: SHA256 inválido.")
        if not isinstance(row["interior"], bool) or row["origen"] not in ("alumnos", "web"):
            raise ValueError(f"Fila {n}: interior u origen inválido.")
        if not isinstance(row["grupo"], str) or not row["grupo"]:
            raise ValueError(f"Fila {n}: falta grupo opaco de evaluación.")
        if row.get("query_ruta") is not None or row.get("query_sha256") is not None:
            if not isinstance(row.get("query_ruta"), (str, Path)) or not str(row["query_ruta"]):
                raise ValueError(f"Fila {n}: falta ruta de la consulta natural.")
            if not isinstance(row.get("query_sha256"), str) or not re.fullmatch(r"[0-9a-fA-F]{64}", row["query_sha256"]):
                raise ValueError(f"Fila {n}: falta SHA256 válido de la consulta natural.")


def _check_refs(refs, np):
    if refs.dtype != np.float32 or refs.shape != (3, DIMENSION) or not np.isfinite(refs).all():
        raise ValueError("Rasgos inválidos: se requieren tres vectores float32 finitos de dimensión 960.")
    if not np.allclose(np.linalg.norm(refs, axis=-1), 1.0, rtol=0, atol=2e-6):
        raise ValueError("Rasgos inválidos: los vectores deben conservar normalización L2.")


def _save_cache(path, refs, signature, np):
    # Archivo temporal único + reemplazo atómico; no contiene rutas, autores ni etiquetas.
    fd, temp_name = tempfile.mkstemp(prefix=".features_", suffix=".npz", dir=path.parent)
    try:
        with os.fdopen(fd, "wb") as f:
            np.savez_compressed(f, refs=refs, signature=np.asarray(_json_bytes(signature).decode("utf-8")),
                                refs_sha256=np.asarray(hashlib.sha256(refs.tobytes(order="C")).hexdigest()))
        os.replace(temp_name, path)
    finally:
        if os.path.exists(temp_name):
            os.unlink(temp_name)


def extraer(manifest_rows: list[dict], cache_dir: Path, model_path: Path) -> dict:
    """Extrae o reutiliza tres referencias y una consulta central.

    Cada resultado incluye refs/query y firmas de imagen, modelo y protocolo.
    La caché valida firmas, forma, norma, finitud y hash de sus propios vectores.
    query_ruta/query_sha256 opcionales permiten consultar la foto natural y
    conservar referencias pixeladas; nunca sustituyen refs. Por defecto, la
    consulta es refs[0]. Fuentes con SHA diferente usan claves distintas.
    """
    rows = list(manifest_rows)
    _check_rows(rows)
    model_path, cache_dir = Path(model_path), Path(cache_dir)
    if _sha(model_path) != EXPECTED_MODEL_SHA256:
        raise ValueError("El modelo difiere del TFLite vigente autorizado; no se calculan rasgos.")
    np, Image, ImageOps = _libraries()
    versions = _versions()
    cache_dir.mkdir(parents=True, exist_ok=True)
    engine = None
    def image_features(path, expected_sha, number):
        nonlocal engine
        path = Path(path)
        try:
            actual_sha = _sha(path)
        except OSError:
            raise RuntimeError(f"Fila {number}: no se pudo leer la imagen; ruta privada omitida.") from None
        if actual_sha != expected_sha.lower():
            raise ValueError(f"Fila {number}: la imagen cambió respecto al manifiesto.")
        signature = {"image_sha256": actual_sha, "model_sha256": EXPECTED_MODEL_SHA256,
                     "protocol_sha256": PROTOCOL_SHA256, "libraries": versions, "schema_version": 1}
        key = hashlib.sha256(_json_bytes(signature)).hexdigest()
        cached = cache_dir / (key + ".npz")
        refs = None
        if cached.is_file():
            try:
                with np.load(cached, allow_pickle=False) as saved:
                    candidate = saved["refs"].copy()
                    same_signature = json.loads(str(saved["signature"].item())) == signature
                    same_bytes = hashlib.sha256(candidate.tobytes(order="C")).hexdigest() == str(saved["refs_sha256"].item())
                _check_refs(candidate, np)
                if same_signature and same_bytes:
                    refs = candidate
            except (OSError, ValueError, KeyError, EOFError, zipfile.BadZipFile, json.JSONDecodeError):
                refs = None
        cache_hit = refs is not None
        if refs is None:
            if engine is None:
                engine = _interpreter(model_path)
            interpreter, incoming, outgoing = engine
            try:
                with Image.open(path) as source:
                    im = ImageOps.exif_transpose(source).convert("RGB")
                im.thumbnail((1024, 1024))
                vectors = []
                for view in _views(im, np, Image):
                    interpreter.set_tensor(incoming, view[None])
                    interpreter.invoke()
                    vectors.append(interpreter.get_tensor(outgoing)[0].astype(np.float32))
                refs = np.stack(vectors)
                refs = refs / (np.linalg.norm(refs, axis=-1, keepdims=True) + 1e-9)
                _check_refs(refs, np)
            except Exception as error:
                raise RuntimeError(f"Fila {number}: extracción fallida ({type(error).__name__}); detalles privados omitidos.") from None
            _save_cache(cached, refs, signature, np)
        return refs, actual_sha, key, cache_hit

    result = {}
    for number, row in enumerate(rows):
        refs, actual_sha, key, cache_hit = image_features(row["ruta"], row["sha256"], number)
        query_sha = (row.get("query_sha256") or row["sha256"]).lower()
        if row.get("query_ruta") is not None and (query_sha != actual_sha or Path(row["query_ruta"]).resolve() != Path(row["ruta"]).resolve()):
            qrefs, query_sha, query_key, query_hit = image_features(row["query_ruta"], query_sha, number)
            query = qrefs[0].copy()
        else:
            query, query_key, query_hit = refs[0].copy(), key, cache_hit
        result[row["id"]] = {"refs": refs, "query": query, "sha256": actual_sha, "query_sha256": query_sha,
                             "model_sha256": EXPECTED_MODEL_SHA256, "protocol_sha256": PROTOCOL_SHA256,
                             "cache_key": key, "cache_hit": cache_hit,
                             "query_cache_key": query_key, "query_cache_hit": query_hit}
    return result


def exportar_galerias(rows: list[dict], features: dict, outdir: Path) -> dict[str, Path]:
    """Exporta prototipos redondeados a seis decimales por campus.

    No evalúa, calibra, inventa destinos ni cambia pesos. Incluye únicamente las
    filas recibidas, en ese orden dentro de cada clase. El llamador controla el
    catálogo, la selección final y la separación entre entrenamiento y prueba.
    """
    rows = list(rows)
    _check_rows(rows)
    import numpy as np
    by_campus = defaultdict(list)
    for row in rows:
        if row["id"] not in features:
            raise ValueError("Faltan rasgos para una fila seleccionada.")
        f = features[row["id"]]
        if f.get("sha256") != row["sha256"].lower() or f.get("model_sha256") != EXPECTED_MODEL_SHA256 or f.get("protocol_sha256") != PROTOCOL_SHA256:
            raise ValueError("Los rasgos no corresponden a la imagen, el modelo o el protocolo acordados.")
        _check_refs(f["refs"], np)
        expected_query_sha = (row.get("query_sha256") or row["sha256"]).lower()
        if f.get("query_sha256", f["sha256"]) != expected_query_sha:
            raise ValueError("La consulta no corresponde a la imagen natural declarada.")
        query = f["query"]
        if query.dtype != np.float32 or query.shape != (DIMENSION,) or not np.isfinite(query).all() or not np.isclose(np.linalg.norm(query),1.0,rtol=0,atol=2e-6):
            raise ValueError("Consulta inválida; debe ser un vector float32 de 960 valores normalizado.")
        if expected_query_sha == f["sha256"] and not np.array_equal(query, f["refs"][0]):
            raise ValueError("La consulta de la misma imagen no coincide con el recorte central.")
        by_campus[row["campus"]].append(row)
    outdir = Path(outdir)
    outdir.mkdir(parents=True, exist_ok=True)
    paths = {}
    for campus, selected in sorted(by_campus.items()):
        classes = sorted({r["clase"] for r in selected})
        prototypes = {c: [] for c in classes}
        for row in selected:
            prototypes[row["clase"]].extend(np.round(features[row["id"]]["refs"], 6).tolist())
        gallery = {
            "version": 3, "estado": "CANDIDATA_OFFLINE_NO_INTEGRADA", "integrada_en_app": False,
            "campus": campus, "modelo": "escom_embeddings.tflite", "sha256_modelo": EXPECTED_MODEL_SHA256,
            "entrada": [1, 224, 224, 3], "formato_entrada": "RGB float32 0..255; orientación corregida; recorte central bilinear",
            "dimension": DIMENSION, "normalizacion_salida": "L2", "protocolo_sha256": PROTOCOL_SHA256,
            "metrica": "coseno; media de las 3 similitudes más altas por clase y por cuadro",
            "umbral_no_se": 0.8, "umbral_experimental": True, "umbral_calibrado": False,
            "votacion_temporal": "no evaluada con fotografías; no se exporta una afirmación de estabilidad",
            "clases": classes, "destinos": {}, "prototipos": prototypes,
            "fotos_referencia": len(selected), "vistas_por_foto": 3,
            "privacidad": "Inferencia local; esta galería no contiene fotos, nombres, rutas, IDs de origen ni grupos de autores.",
        }
        path = outdir / (campus + "_galeria_CANDIDATA_NO_INTEGRADA.json")
        # Publicación local atómica, también si el proceso se interrumpe al escribir.
        fd, temp_name = tempfile.mkstemp(prefix=".gallery_", suffix=".json", dir=outdir)
        try:
            with os.fdopen(fd, "wb") as f:
                f.write(_json_bytes(gallery))
                f.write(b"\n")
            os.replace(temp_name, path)
        finally:
            if os.path.exists(temp_name):
                os.unlink(temp_name)
        paths[campus] = path
    return paths
