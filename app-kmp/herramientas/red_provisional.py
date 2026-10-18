"""Red de caminos PROVISIONAL de Azcapotzalco para probar las rutas de la app (Prototipo 6).

La red buena la dibuja Codex en el visor (campus/rutas.json, mismo formato). Ésta sólo une, con
segmentos rectos, los accesos peatonales, los andadores (`paths`) y la puerta aproximada de cada
edificio de campus/campus_editado.json; puede cruzar jardines y no conoce pasillos interiores.
Uso:  python app-kmp/herramientas/red_provisional.py  (escribe campus/rutas.json)
"""

import json
import math
import os

RAIZ = os.path.join(os.path.dirname(__file__), "..", "..")
d = json.load(open(os.path.join(RAIZ, "campus", "campus_editado.json"), encoding="utf-8"))
geo = json.load(open(os.path.join(RAIZ, "campus", "georreferencia.json"), encoding="utf-8"))
S = d["metersPerPixel"]


def modelo(px, py):
    return (px - 895) * S, (py - 390) * S


def latlon(x, z):
    """Del modelo (m) al mapa con las tres esquinas del plano, como hace la app con el PNG."""
    u, v = (x + 390) * 2 / geo["ancho"], (z + 150) * 2 / geo["alto"]
    tl, tr, bl = geo["superiorIzquierda"], geo["superiorDerecha"], geo["inferiorIzquierda"]
    return (tl[0] + (tr[0] - tl[0]) * u + (bl[0] - tl[0]) * v,
            tl[1] + (tr[1] - tl[1]) * u + (bl[1] - tl[1]) * v)


nodos, aristas = {}, set()


def nodo(nid, px, py, tipo):
    x, z = modelo(px, py)
    la, lo = latlon(x, z)
    nodos[nid] = {"id": nid, "lat": round(la, 7), "lon": round(lo, 7), "x": round(x, 2), "z": round(z, 2),
                  "nivel": 0, "tipo": tipo, "px": (px, py)}
    return nid


def unir(a, b):
    if a != b:
        aristas.add(tuple(sorted((a, b))))


# Andadores: su línea central, con un nodo cada ~25 m.
for i, (x0, y0, x1, y1) in enumerate(d["paths"]):
    horizontal = (x1 - x0) >= (y1 - y0)
    largo = (x1 - x0) if horizontal else (y1 - y0)
    pasos = max(1, round(largo * S / 25))
    previo = None
    for k in range(pasos + 1):
        t = k / pasos
        px, py = (x0 + (x1 - x0) * t, (y0 + y1) / 2) if horizontal else ((x0 + x1) / 2, y0 + (y1 - y0) * t)
        n = nodo(f"a{i}_{k}", px, py, "cruce")
        if previo:
            unir(previo, n)
        previo = n


def cercano(px, py, excluir=(), tipos=("cruce",)):
    return min((n for n in nodos.values() if n["tipo"] in tipos and n["id"] not in excluir),
               key=lambda n: math.dist(n["px"], (px, py)))["id"]


# Unir los extremos de andadores cercanos entre sí (los cruces).
extremos = [n for n in nodos.values() if n["id"].endswith("_0") or not any(
    m["id"].startswith(n["id"].rsplit("_", 1)[0] + "_") and int(m["id"].rsplit("_", 1)[1]) > int(n["id"].rsplit("_", 1)[1])
    for m in nodos.values())]
for n in extremos:
    otro = cercano(*n["px"], excluir=[m["id"] for m in nodos.values() if m["id"].split("_")[0] == n["id"].split("_")[0]])
    unir(n["id"], otro)

# Accesos peatonales y puerta aproximada de cada edificio (centro de su huella), unidos al andador más cercano.
for g in d["gates"]:
    if g["type"] == "pedestrian":
        unir(nodo(f"acceso_{g['id']}", g["x"], g["y"], "acceso"), cercano(g["x"], g["y"]))
destinos = []
for b in d["buildings"]:
    x0, y0, x1, y1 = b["rects"][0]
    n = nodo(f"e_{b['id']}", (x0 + x1) / 2, (y0 + y1) / 2, "entrada")
    unir(n, cercano((x0 + x1) / 2, (y0 + y1) / 2))
    destinos.append({"id": b["id"], "nombre": b.get("name") or f"Edificio {b['id']}", "nodo": n})
for g in d["gates"]:
    if g["type"] == "pedestrian":
        destinos.append({"id": f"Acceso {g['id']}", "nombre": f"Acceso peatonal {g['id']}", "nodo": f"acceso_{g['id']}"})


# Un solo componente: se une cada isla con el nodo más cercano de la parte principal.
def componentes():
    vecinos = {n: set() for n in nodos}
    for a, b in aristas:
        vecinos[a].add(b)
        vecinos[b].add(a)
    vistos, grupos = set(), []
    for n in nodos:
        if n in vistos:
            continue
        pila, grupo = [n], set()
        while pila:
            m = pila.pop()
            if m in grupo:
                continue
            grupo.add(m)
            pila.extend(vecinos[m] - grupo)
        vistos |= grupo
        grupos.append(grupo)
    return grupos


while len(g := componentes()) > 1:
    principal, isla = max(g, key=len), min(g, key=len)
    a, b = min(((a, b) for a in isla for b in principal),
               key=lambda p: math.dist(nodos[p[0]]["px"], nodos[p[1]]["px"]))
    unir(a, b)

salida = {
    "version": 1,
    "unidad": "azcapotzalco",
    "provisional": True,
    "nota": "Red PROVISIONAL de Claude para probar la app; la reemplaza la red que dibuje Codex en el visor.",
    "nodos": [{k: v for k, v in n.items() if k != "px"} for n in nodos.values()],
    "aristas": [{"de": a, "a": b, "tipo": "exterior", "accesible": True,
                 "metros": round(math.dist(nodos[a]["px"], nodos[b]["px"]) * S, 1)} for a, b in sorted(aristas)],
    "destinos": sorted(destinos, key=lambda x: x["nombre"]),
}
json.dump(salida, open(os.path.join(RAIZ, "campus", "rutas.json"), "w", encoding="utf-8", newline="\n"),
          ensure_ascii=False, indent=1)
print(len(salida["nodos"]), "nodos,", len(salida["aristas"]), "aristas,", len(destinos), "destinos, componentes:", len(componentes()))
