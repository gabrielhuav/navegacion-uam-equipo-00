"""Genera la ficha pública del corpus sin datos personales.

Salida en <carpeta>/: manifiesto_anonimo.csv y ficha.md.
Nunca escribe nombres, rutas, nombres de archivo, teléfonos, fechas, observaciones ni GPS.
Los seudónimos (alumno_01…) salen de una clave secreta guardada en _privado/, fuera del repositorio:
sin ella no se puede volver del seudónimo al alumno, y con ella salen siempre los mismos.
Uso: python anonimizar_corpus.py <carpeta de la corrida> <carpeta de salida>
"""
import collections
import csv
import hashlib
import hmac
import json
import pathlib
import secrets
import sys

from comun import RAIZ

import numpy as np

CLAVE = RAIZ / "_privado" / "clave_seudonimos.txt"
FUSION = {"biblioteca": "gobierno"}


def clave():
    if not CLAVE.exists():
        CLAVE.parent.mkdir(exist_ok=True)
        CLAVE.write_text(secrets.token_hex(32), encoding="utf-8")
    return CLAVE.read_text(encoding="utf-8").strip().encode()


def firma(k, texto):
    return hmac.new(k, texto.encode("utf-8"), hashlib.sha256).hexdigest()


def origen(f):
    nombre = f["ruta"].split("\\")[-1].lower()
    if "adicionales" in f["ruta"]:
        return "fuente_adicional"
    if f.get("dron"):
        return "dron"
    if "whatsapp" in nombre or "-wa" in nombre:
        return "whatsapp"
    if "docx" in f.get("observaciones", "").lower():
        return "docx"
    return "telefono"


def tabla(encabezado, filas):
    lineas = ["| " + " | ".join(encabezado) + " |", "|" + "|".join(["---"] + ["---:"] * (len(encabezado) - 1)) + "|"]
    return lineas + ["| " + " | ".join(str(c) for c in f) + " |" for f in filas]


def main():
    corrida, salida = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
    salida.mkdir(parents=True, exist_ok=True)
    k = clave()
    filas = json.loads((corrida / "manifiesto.json").read_text(encoding="utf-8"))
    galeria = json.loads((corrida / "exportado" / "escom_galeria.json").read_text(encoding="utf-8"))
    informe = json.loads((corrida / "informe.json").read_text(encoding="utf-8"))
    angulos = json.loads((corrida / "exportado" / "escom_angulos.json").read_text(encoding="utf-8"))

    # Qué fotos están en la galería: se compara cada prototipo con las vistas de cada foto.
    d = np.load(corrida / "embeddings_tflite.npz", allow_pickle=True)
    E = d["emb"].astype(np.float32)
    E /= np.linalg.norm(E, axis=-1, keepdims=True)
    vistas = E.reshape(-1, E.shape[-1])
    en_galeria = set()
    for c in galeria["clases"]:
        en_galeria |= {int(i) for i in (np.asarray(galeria["prototipos"][c], np.float32) @ vistas.T).argmax(1) // E.shape[1]}

    alumnos = sorted({f["alumno"] for f in filas if "adicionales" not in f["ruta"]}, key=lambda a: firma(k, "alumno:" + a))
    seudonimo = {a: f"alumno_{i:02d}" for i, a in enumerate(alumnos, 1)}
    orden = sorted(range(len(filas)), key=lambda i: firma(k, "foto:" + filas[i]["ruta"]))

    salidas = []
    for n, i in enumerate(orden, 1):
        f = filas[i]
        clase = f.get("c") or f["clase"]
        obs = f.get("observaciones", "").lower()
        huella = hashlib.sha256((RAIZ / f["ruta"]).read_bytes()).hexdigest()[:16]
        salidas.append({
            "foto": f"foto_{n:03d}",
            "fuente": seudonimo.get(f["alumno"], "fuente_adicional"),
            "clase": clase,
            "clase_modelo": FUSION.get(clase, clase),
            "sesion": f["sesion"],
            "origen": origen(f),
            "interior": "si" if f.get("interior") else "",
            "con_personas": "si" if ("persona" in obs or "caras" in obs) else "",
            "en_galeria": "si" if i in en_galeria else "",
            "sha256_16": huella,
        })
    with open(salida / "manifiesto_anonimo.csv", "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(salidas[0].keys()), lineterminator="\n")
        w.writeheader()
        w.writerows(salidas)

    # Ficha.
    sesiones = ["noche", "dia", "atardecer"]
    clases = sorted({s["clase"] for s in salidas})
    por = collections.Counter((s["clase"], s["sesion"]) for s in salidas)
    gal = collections.Counter(s["clase_modelo"] for s in salidas if s["en_galeria"])
    origenes = collections.Counter(s["origen"] for s in salidas)
    fotos_alumno = collections.Counter(s["fuente"] for s in salidas if s["fuente"] != "fuente_adicional")
    res = informe["comparacion"]["galeria"]["despues"]
    lados = collections.Counter(l for l in angulos["lados_laboratorios"][::3] if l)
    ficha = [
        "# Ficha del corpus ESCOM",
        "",
        "Generada con `modelo/anonimizar_corpus.py` a partir de la corrida `" + corrida.name + "`.",
        "",
        "**Las fotos no están en este repositorio.** Tienen nombres, caras y ubicación de alumnos. Aquí sólo hay",
        "conteos y un listado anónimo (`manifiesto_anonimo.csv`) para documentar y repetir la evaluación.",
        "",
        "## Contenido",
        "",
        f"{len(salidas)} fotos: {len(salidas) - origenes['fuente_adicional']} de {len(alumnos)} alumnos y "
        f"{origenes['fuente_adicional']} de una fuente adicional. 0 videos.",
        "",
    ]
    ficha += tabla(["Clase"] + sesiones + ["Total", "En la galería"],
                   [[c] + [por[(c, s)] for s in sesiones] + [sum(por[(c, s)] for s in sesiones), gal.get(c, "")] for c in clases])
    ficha += ["", "`biblioteca` cuenta dentro de `gobierno` en el modelo: en `campus-escom/rutas.json` comparten destino.", "",
              "## Origen y calidad", ""]
    ficha += tabla(["Origen", "Fotos"], sorted(origenes.items()))
    ficha += ["",
              f"- Fotos con personas: {sum(1 for s in salidas if s['con_personas'])}. Interiores: {sum(1 for s in salidas if s['interior'])}.",
              f"- Fotos por alumno: de {min(fotos_alumno.values())} a {max(fotos_alumno.values())}.",
              f"- Fotos de laboratorios con GPS: {sum(lados.values())} de {gal['laboratorios']}, por lado: "
              + ", ".join(f"{l} {n}" for l, n in lados.most_common()) + ".",
              "", "## Evaluación del modelo", "",
              "Comparación con la galería, dejando fuera a cada alumno, con un recorte central como en el teléfono.",
              f"Exactitud nocturna: {res['aciertos']} de {res['n']} ({res['exactitud']:.0%}).", ""]
    ficha += tabla(["Clase", "Fotos", "Recobrado", "Precisión"],
                   [[c, v["n"], f"{v['recobrado']:.0%}", f"{v['precision']:.0%}" if v["precision"] is not None else "—"]
                    for c, v in res["por_clase"].items()])
    ficha += ["", f"Umbral de «no sé»: {galeria['umbral_no_se']} general y {angulos['umbral_laboratorios']} en laboratorios. "
              "La similitud no es un porcentaje de certeza.",
              "De día todavía no hay evidencia suficiente: faltan fotos y videos de todos los edificios.",
              "", "## Qué no se publica", "",
              "- Fotos, miniaturas y el ZIP del corpus.",
              "- `corpus.csv`, `etiquetas_revisadas.csv`, `resumen.md`, manifiestos y corridas: traen nombres o rutas con nombres.",
              "- La clave de los seudónimos.",
              "", "## Pendientes", "",
              "- Confirmar el origen y la licencia de las fotos de la fuente adicional.",
              "- La galería de la app son vectores, no imágenes, pero parte de ellos sale de fotos con personas.",
              ""]
    (salida / "ficha.md").write_text("\n".join(ficha), encoding="utf-8")
    print(len(salidas), "filas;", "en galería", sum(1 for s in salidas if s["en_galeria"]), "; alumnos", len(alumnos))


if __name__ == "__main__":
    main()
