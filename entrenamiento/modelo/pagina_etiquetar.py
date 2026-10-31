"""Genera etiquetar.html: página local (sin red) para confirmar la clase de las fotos sin etiqueta.

Las miniaturas van incrustadas; la página no se publica ni se sube a ningún servicio.
Sugiere una clase por similitud con las fotos ya etiquetadas (3 vecinos más cercanos).
La página descarga etiquetas_revisadas.csv; no mueve ni modifica fotos.
Uso: python pagina_etiquetar.py
"""
import base64
import csv
import hashlib
import html
import io
import json

import numpy as np

from comun import MODELO, SALIDAS, CLASES_PAGINA, ETIQUETAS_REVISADAS, leer_corpus, abrir


def miniatura(ruta):
    im = abrir(ruta, 420)
    b = io.BytesIO()
    im.save(b, "JPEG", quality=70)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()


def sugerencias(filas):
    d = np.load(SALIDAS / "emb_mobilenetv3l.npz")
    e = d["emb"].mean(axis=1)
    e /= np.linalg.norm(e, axis=1, keepdims=True)
    ref = [i for i, f in enumerate(filas) if f["clase"] not in ("_sin_clasificar",) and not f["dron"]]
    out = {}
    for i, f in enumerate(filas):
        s = e[ref] @ e[i]
        orden = [ref[j] for j in np.argsort(-s) if ref[j] != i][:3]
        out[i] = [(filas[j]["clase"], round(float(e[j] @ e[i]), 2)) for j in orden]
    return out


def main():
    filas = leer_corpus()
    revisadas = {}
    clave = "etiquetas-escom-v2-sin-base"
    if ETIQUETAS_REVISADAS.exists():
        with ETIQUETAS_REVISADAS.open(encoding="utf-8-sig", newline="") as fh:
            revisadas = {r["ruta"]: r for r in csv.DictReader(fh)}
        # Un borrador antiguo no debe tapar las etiquetas actualmente aplicadas.
        # No se borra el almacenamiento anterior del navegador.
        clave = "etiquetas-escom-v2-" + hashlib.sha256(ETIQUETAS_REVISADAS.read_bytes()).hexdigest()[:16]
    sug = sugerencias(filas)
    pend = [i for i, f in enumerate(filas) if f["clase_original"] == "_sin_clasificar"]
    tarjetas = []
    for i in pend:
        f = filas[i]
        s = sug[i]
        votos = {}
        for c, v in s:
            votos[c] = votos.get(c, 0) + v
        propuesta = max(votos, key=votos.get)
        opciones = "".join(
            f'<option value="{c}"{" selected" if c == f["clase"] and c != "_sin_clasificar" else ""}>{c}</option>'
            for c in [""] + CLASES_PAGINA
        )
        tarjetas.append(f"""
<article data-ruta="{html.escape(f['ruta'])}" data-orig="{html.escape(f['clase_original'])}" data-sesion="{f['sesion']}">
  <a href="../{html.escape(f['ruta']).replace(chr(92), '/')}" target="_blank"><img loading="lazy" src="{miniatura(f['ruta'])}" alt=""></a>
  <div class="meta"><b>{html.escape(f['alumno'])}</b> · {f['sesion']} · {html.escape(f['telefono'])}{' · <em>dron</em>' if f['dron'] else ''}</div>
  <div class="arch">{html.escape(f['ruta'].split(chr(92))[-1])}</div>
  <div class="obs">{html.escape(f['observaciones'])}</div>
  <div class="sug">Sugerencia (similitud): <b>{propuesta}</b> <small>{' · '.join(f'{c} {v}' for c, v in s)}</small></div>
  <label>Clase <select>{opciones}</select></label>
  <input class="nota" placeholder="nota (opcional)" value="{html.escape(revisadas.get(f['ruta'], {}).get('nota', ''), quote=True)}">
</article>""")

    pagina = f"""<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Etiquetar fotos ESCOM</title>
<style>
:root{{--bg:#f6f7f9;--card:#fff;--tx:#1b1f24;--mut:#5b6470;--ac:#006699;--ok:#e7f4ea}}
@media (prefers-color-scheme:dark){{:root{{--bg:#14171b;--card:#1e2329;--tx:#e8eaed;--mut:#9aa3ad;--ac:#5fb3db;--ok:#1d3324}}}}
body{{margin:0;background:var(--bg);color:var(--tx);font:14px system-ui,sans-serif}}
header{{position:sticky;top:0;background:var(--bg);padding:12px 16px;border-bottom:1px solid #8884;display:flex;gap:12px;flex-wrap:wrap;align-items:center;z-index:2}}
h1{{font-size:18px;margin:0}}
main{{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;padding:16px}}
article{{background:var(--card);border-radius:8px;padding:10px;display:flex;flex-direction:column;gap:6px}}
article.hecho{{background:var(--ok)}}
img{{width:100%;height:220px;object-fit:contain;background:#000;border-radius:4px}}
.meta,.arch,.obs,.sug small{{color:var(--mut);font-size:12px}}
.obs{{max-height:4.5em;overflow:auto}}
select,input,button{{font:inherit;padding:4px 6px}}
button{{background:var(--ac);color:#fff;border:0;border-radius:6px;padding:6px 12px;cursor:pointer}}
</style></head><body>
<header><h1>Revisar etiquetas ESCOM ({len(pend)} fotos)</h1>
<span id="cuenta"></span>
<label><input type="checkbox" id="solo"> sólo pendientes</label>
<button id="aceptar">Usar sugerencia en las vacías</button>
<button id="bajar">Descargar etiquetas_revisadas.csv</button>
<small id="origen">Clases y notas cargadas desde etiquetas_revisadas.csv. Corrige y descarga el CSV al terminar; los cambios no modifican el entrenamiento automáticamente.</small></header>
<main>{''.join(tarjetas)}</main>
<script>
const K={json.dumps(clave)};
const arts=[...document.querySelectorAll('article')];
let guard={{}};try{{guard=JSON.parse(localStorage.getItem(K)||'{{}}')}}catch(e){{}}
arts.forEach(a=>{{const g=guard[a.dataset.ruta];if(g){{a.querySelector('select').value=g.c;a.querySelector('.nota').value=g.n||''}}}});
function act(){{const d={{}};let n=0;arts.forEach(a=>{{const c=a.querySelector('select').value;a.classList.toggle('hecho',!!c);if(c)n++;
d[a.dataset.ruta]={{c,n:a.querySelector('.nota').value}};a.style.display=(document.getElementById('solo').checked&&c)?'none':''}});
document.getElementById('cuenta').textContent=n+' / '+arts.length+' elegidas';try{{localStorage.setItem(K,JSON.stringify(d))}}catch(e){{}}}}
document.addEventListener('change',act);document.addEventListener('input',act);
document.getElementById('aceptar').onclick=()=>{{arts.forEach(a=>{{const s=a.querySelector('select');if(!s.value)s.value=a.querySelector('.sug b').textContent}});act()}};
document.getElementById('bajar').onclick=()=>{{const q=v=>'"'+String(v).replace(/"/g,'""')+'"';
const f=new Date().toISOString();let t='ruta,clase_original,clase_nueva,nota,fecha\\n';
arts.forEach(a=>{{const c=a.querySelector('select').value;if(c)t+=[a.dataset.ruta,a.dataset.orig,c,a.querySelector('.nota').value,f].map(q).join(',')+'\\n'}});
const u=URL.createObjectURL(new Blob(['\\ufeff'+t],{{type:'text/csv'}}));const l=document.createElement('a');l.href=u;l.download='etiquetas_revisadas.csv';l.click()}};
act();
</script></body></html>"""
    (MODELO / "etiquetar.html").write_text(pagina, encoding="utf-8")
    print("pendientes", len(pend), "->", MODELO / "etiquetar.html")


if __name__ == "__main__":
    main()
