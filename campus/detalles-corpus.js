// Detalles exteriores observados en las copias autorizadas del corpus.
// No define huellas, accesos, alturas de edificios ni geometría de rutas.
export const VERSION_DETALLES_CORPUS = '2026-11-17';

function restarIntervalos(inicio, fin, huecos) {
  let partes = [[inicio, fin]];
  for (const [desde, hasta] of huecos) {
    partes = partes.flatMap(([a, b]) => hasta <= a || desde >= b ? [[a, b]] :
      [[a, Math.min(b, desde)], [Math.max(a, hasta), b]].filter(([x, y]) => y - x > .08));
  }
  return partes;
}

function grupoNuevo(THREE, parent, nombre, fotos) {
  if (parent.getObjectByName(nombre)) return null;
  const g = new THREE.Group();
  g.name = nombre;
  g.userData = {
    version: VERSION_DETALLES_CORPUS, approximate: true,
    purpose: 'Detalle visual exterior; no modifica navegación ni acredita medidas en campo',
    evidence: fotos,
  };
  parent.add(g);
  return g;
}

function detalleLigero(box, grupo, nombre, x, y, z, w, h, d, color) {
  const pieza = box(grupo, nombre, x, y, z, w, h, d, color);
  // Son juntas de acabado, no salientes que proyecten sombras sobre la fachada.
  pieza.castShadow = false;
  return pieza;
}

function juntasConcretoW({ THREE, data, buildingGroups, box }) {
  const part = buildingGroups.get('W')?.getObjectByName('W_volumen_0');
  const cuerpo = part?.getObjectByName('W_cuerpo_concreto_gris');
  if (!cuerpo?.isMesh) return null;
  const grupo = grupoNuevo(THREE, part, 'W_detalle_juntas_corpus', ['imagen_0030.png', 'imagen_0062.png']);
  if (!grupo) return null;
  const x0 = cuerpo.position.x - cuerpo.scale.x / 2;
  const x1 = cuerpo.position.x + cuerpo.scale.x / 2;
  const y0 = cuerpo.position.y - cuerpo.scale.y / 2;
  const y1 = cuerpo.position.y + cuerpo.scale.y / 2;
  const frente = cuerpo.position.z - cuerpo.scale.z / 2;
  const vanos = [];
  part.traverse(n => {
    if (n.name === 'W_ventanal_reticular' && n.isMesh && Math.abs(n.position.z - frente) < .2) {
      vanos.push([n.position.x - n.scale.x / 2 - .12, n.position.y - n.scale.y / 2 - .12,
        n.position.x + n.scale.x / 2 + .12, n.position.y + n.scale.y / 2 + .12]);
    }
  });
  // El corpus acredita el despiece; el paso es esquemático y se adapta a la
  // dimensión canónica. Se conservan las retículas de ventanas ya existentes.
  const columnas = Math.max(3, Math.round((x1 - x0) / 3));
  const color = '#aeb4af', ancho = .035, plano = frente - .022;
  for (let i = 1; i < columnas; i++) {
    const x = x0 + (x1 - x0) * i / columnas;
    const huecos = vanos.filter(v => x >= v[0] && x <= v[2]).map(v => [v[1], v[3]]);
    for (const [a, b] of restarIntervalos(y0 + .15, y1 - .15, huecos))
      detalleLigero(box, grupo, 'W_junta_vertical_concreto_corpus', x, (a + b) / 2, plano,
        ancho, b - a, .024, color);
  }
  const paso = data.storeyHeight / 2;
  for (let y = y0 + paso; y < y1 - .15; y += paso) {
    const huecos = vanos.filter(v => y >= v[1] && y <= v[3]).map(v => [v[0], v[2]]);
    for (const [a, b] of restarIntervalos(x0 + .08, x1 - .08, huecos))
      detalleLigero(box, grupo, 'W_junta_horizontal_concreto_corpus', (a + b) / 2, y, plano,
        b - a, ancho, .024, color);
  }
  grupo.userData.facade = 'Lado -Z del modelo, hacia estacionamiento; cardinales según georreferencia; sin juntas sobre ventanales';
  return grupo;
}

function juntasCeramicaP1({ THREE, buildingGroups, box }) {
  const part = buildingGroups.get('P1')?.getObjectByName('P1_volumen_0');
  const torre = part?.getObjectByName('P1_torre_azulejo_azul');
  if (!torre?.isMesh) return null;
  const grupo = grupoNuevo(THREE, part, 'P1_detalle_ceramica_corpus', ['imagen_0002.png']);
  if (!grupo) return null;
  const w = torre.scale.x, d = torre.scale.z, alto = torre.scale.y;
  const { x, y, z } = torre.position;
  // Se completan sólo las dos caras exteriores de la torre. Las juntas
  // horizontales existentes de Gemini se conservan sin duplicarlas.
  for (let i = 1; i < 8; i++) {
    detalleLigero(box, grupo, 'P1_junta_vertical_azulejo_corpus', x - w / 2 + w * i / 8,
      y, z + d / 2 + .014, .035, alto - .06, .022, '#dde3ec');
    detalleLigero(box, grupo, 'P1_junta_vertical_azulejo_corpus', x + w / 2 + .014,
      y, z - d / 2 + d * i / 8, .022, alto - .06, .035, '#dde3ec');
  }
  grupo.userData.material = 'Revestimiento cerámico azul, no vidrio';
  grupo.userData.layout = 'Retícula visual aproximada; no implica despiece medido';
  return grupo;
}

/** Llamar tras generar los edificios; todos los detalles heredan sus ediciones. */
export function agregarDetallesCorpus(contexto) {
  const grupos = [juntasConcretoW(contexto), juntasCeramicaP1(contexto)].filter(Boolean);
  return { version: VERSION_DETALLES_CORPUS, grupos: grupos.map(g => g.name),
    piezas: grupos.reduce((n, g) => n + g.children.length, 0) };
}
