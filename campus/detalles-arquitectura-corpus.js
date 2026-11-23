// Reconstrucciones geométricas sustentadas por fotografías exteriores del corpus.
// Reemplazan aproximaciones de los mismos objetos. La ubicación lateral
// esquemática del invernadero se corrige si invade edificios o rutas.
import { convexHull, rectanglePolygon, segmentPolygon, polygonsOverlap } from 'site-clearance';
export const VERSION_ARQUITECTURA_CORPUS = '2026-11-17';

function grupoSustituto(THREE, malla, evidencia, tipo) {
  if (!malla?.isMesh || !malla.parent) return null;
  const padre = malla.parent, indice = padre.children.indexOf(malla), grupo = new THREE.Group();
  grupo.name = malla.name;
  grupo.position.copy(malla.position); grupo.quaternion.copy(malla.quaternion);
  grupo.visible = malla.visible; grupo.layers.mask = malla.layers.mask;
  grupo.userData = { ...malla.userData, arquitecturaCorpus: VERSION_ARQUITECTURA_CORPUS,
    approximate: true, tipo, evidencia, dimensiones: 'Envolvente existente; proporciones de detalle aproximadas' };
  // La liberación de materiales corresponde a una malla propietaria, nunca al grupo.
  delete grupo.userData.disposeMaterial; delete grupo.userData.disposeCopyrightMaterial;
  padre.remove(malla); padre.add(grupo);
  padre.children.splice(padre.children.indexOf(grupo), 1); padre.children.splice(indice, 0, grupo);
  return grupo;
}

function recursos(contexto, geometriaCaja) {
  const { THREE } = contexto, cache = new Map();
  const material = color => {
    if (!cache.has(color)) cache.set(color, contexto.material?.(color) || new THREE.MeshStandardMaterial({ color, roughness: .8 }));
    return cache.get(color);
  };
  const caja = contexto.cube || geometriaCaja, cilindro = contexto.cylinder || new THREE.CylinderGeometry(1, 1, 1, 8);
  const plano = new THREE.PlaneGeometry(1, 1);
  function pieza(padre, nombre, x, y, z, w, h, d, color) {
    const m = new THREE.Mesh(caja, material(color)); m.name = nombre;
    m.position.set(x, y, z); m.scale.set(w, h, d); m.castShadow = h > .25; m.receiveShadow = true; padre.add(m); return m;
  }
  function tubo(padre, nombre, a, b, radio, color) {
    const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b), delta = bv.clone().sub(av);
    const m = new THREE.Mesh(cilindro, material(color)); m.name = nombre;
    m.position.copy(av).add(bv).multiplyScalar(.5); m.scale.set(radio, delta.length(), radio);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
    m.castShadow = true; m.receiveShadow = true; padre.add(m); return m;
  }
  function panel(padre, nombre, centro, ancho, alto, rotacion, mat) {
    const m = new THREE.Mesh(plano, mat); m.name = nombre; m.position.set(...centro);
    m.scale.set(ancho, alto, 1); m.quaternion.copy(rotacion); m.receiveShadow = true; padre.add(m); return m;
  }
  const traslucido = (color, opacidad) => new THREE.MeshStandardMaterial({ color, transparent: true,
    opacity: opacidad, roughness: .42, side: THREE.DoubleSide, depthWrite: false });
  return { pieza, tubo, panel, traslucido, material };
}

function cubiertaP4(ctx, util) {
  const { THREE, buildingGroups } = ctx, part = buildingGroups.get('P4')?.getObjectByName('P4_volumen_0');
  const original = part?.getObjectByName('P4_patio_cubierto_estudio');
  if (!original?.isMesh) return 0;
  const w = original.scale.x, l = original.scale.z, maxY = original.position.y + original.scale.y / 2;
  const grupo = grupoSustituto(THREE, original, ['imagen_0016.png', 'imagen_0021.png', 'imagen_0032.png'], 'Cubierta traslúcida y cerchas tubulares');
  grupo.userData.parkingGroundBounds = { xMin: -w / 2, xMax: w / 2, zMin: -l / 2, zMax: l / 2 };
  const radius = Math.min(.7, w * .13, l * .12), borde = .075, mitadX = w / 2 - borde, mitadZ = l / 2 - borde;
  const trayectoria = [], corners = [[mitadX - radius, mitadZ - radius, 0],
    [-mitadX + radius, mitadZ - radius, Math.PI / 2], [-mitadX + radius, -mitadZ + radius, Math.PI],
    [mitadX - radius, -mitadZ + radius, 3 * Math.PI / 2]];
  for (const [x, z, inicio] of corners) for (let i = 0; i <= 6; i++) {
    const a = inicio + i * Math.PI / 12; trayectoria.push([x + radius * Math.cos(a), z + radius * Math.sin(a)]);
  }
  const forma = new THREE.Shape(); trayectoria.forEach(([x, z], i) => i ? forma.lineTo(x, -z) : forma.moveTo(x, -z)); forma.closePath();
  const cubiertaMat = util.traslucido('#eef1e7', .58), cubierta = new THREE.Mesh(new THREE.ShapeGeometry(forma), cubiertaMat);
  cubierta.name = 'P4_panel_traslucido_cubierta_corpus'; cubierta.rotation.x = -Math.PI / 2;
  cubierta.position.y = maxY - original.position.y - .045; cubierta.userData.disposeMaterial = true; grupo.add(cubierta);
  const rojo = '#b42d35', upperY = maxY - original.position.y - .09, lowerY = Math.max(3.04 - original.position.y, upperY - .4);
  for (let i = 0; i < trayectoria.length; i++) {
    const a = trayectoria[i], b = trayectoria[(i + 1) % trayectoria.length];
    util.tubo(grupo, 'P4_tubo_perimetral_curvo_corpus', [a[0], upperY, a[1]], [b[0], upperY, b[1]], .045, rojo);
  }
  // Cerchas longitudinales con triangulación roja; quedan sobre el paso y
  // lejos de los globos de iluminación existentes en el eje del patio.
  for (const lado of [-1, 1]) {
    const x = lado * (mitadX - .025), z0 = -mitadZ + radius, z1 = mitadZ - radius;
    util.tubo(grupo, 'P4_cordon_inferior_cercha_corpus', [x, lowerY, z0], [x, lowerY, z1], .04, rojo);
    const n = Math.max(2, Math.ceil((z1 - z0) / 2.6));
    for (let i = 0; i < n; i++) {
      const a = z0 + (z1 - z0) * i / n, b = z0 + (z1 - z0) * (i + 1) / n;
      util.tubo(grupo, 'P4_diagonal_cercha_corpus', [x, i % 2 ? upperY : lowerY, a], [x, i % 2 ? lowerY : upperY, b], .032, rojo);
    }
  }
  const luces = part.children.filter(n => n.name === 'P4_luminaria_globo');
  for (const luz of luces) {
    const z = luz.position.z - grupo.position.z, puntos = [];
    for (let i = 0; i <= 12; i++) {
      const x = -mitadX + 2 * mitadX * i / 12;
      puntos.push([x, upperY + .008 * Math.sin(Math.PI * i / 12), z]);
    }
    for (let i = 1; i < puntos.length; i++) util.tubo(grupo, 'P4_costilla_curva_corpus', puntos[i - 1], puntos[i], .032, rojo);
    util.tubo(grupo, 'P4_suspension_luminaria_corpus', [0, upperY, z], [0, luz.position.y - grupo.position.y + luz.scale.y, z], .016, '#d7d8d3');
  }
  grupo.userData.alturaMaximaConservada = maxY;
  grupo.userData.curvatura = 'Perímetro redondeado observado; ritmo y radios esquemáticos';
  return 1;
}

function mesasP4(ctx, util) {
  const { THREE, buildingGroups } = ctx, part = buildingGroups.get('P4')?.getObjectByName('P4_volumen_0');
  const mesas = part?.children.filter(n => n.isMesh && n.name === 'P4_mesa_estudio') || [];
  for (const original of mesas) {
    const [w, h, d] = original.scale.toArray(), grupo = grupoSustituto(THREE, original, ['imagen_0032.png'], 'Mesa y bancos de estudio con bastidor tubular');
    const gris = '#d5d6d0', oscuro = '#323b3c', suelo = -h / 2;
    util.pieza(grupo, 'P4_tablero_mesa_corpus', 0, h / 2 - .04, 0, w * .5, .08, d, gris);
    for (const lado of [-1, 1]) util.pieza(grupo, 'P4_banco_longitudinal_corpus', lado * w * .4, suelo + .40, 0, w * .2, .075, d * .92, gris);
    for (const z of [-d * .31, d * .31]) {
      for (const lado of [-1, 1]) {
        util.tubo(grupo, 'P4_pata_tubular_mesa_corpus', [lado * w * .19, suelo + .03, z], [lado * w * .19, h / 2 - .09, z], .025, oscuro);
        util.tubo(grupo, 'P4_soporte_tubular_banco_corpus', [0, suelo + .16, z], [lado * w * .4, suelo + .35, z], .025, oscuro);
      }
      util.tubo(grupo, 'P4_patín_tubular_mesa_corpus', [-w * .4, suelo + .025, z], [w * .4, suelo + .025, z], .025, oscuro);
    }
  }
  return mesas.length;
}

function perfilI(util, grupo, nombre, w, h, d, eje, color) {
  if (eje === 'y') {
    const t = Math.min(w, d) * .16;
    for (const lado of [-1, 1]) util.pieza(grupo, nombre + '_ala', 0, 0, lado * (d / 2 - t / 2), w, h, t, color);
    util.pieza(grupo, nombre + '_alma', 0, 0, 0, t, h, d - 2 * t, color);
  } else {
    const t = Math.min(w, h) * .16;
    for (const lado of [-1, 1]) util.pieza(grupo, nombre + '_ala', 0, lado * (h / 2 - t / 2), 0, w, t, d, color);
    util.pieza(grupo, nombre + '_alma', 0, 0, 0, t, h - 2 * t, d, color);
  }
}

function exhibidorP4(ctx, util) {
  const { THREE, buildingGroups } = ctx, part = buildingGroups.get('P4')?.getObjectByName('P4_volumen_0');
  const columna = part?.children.find(n => n.isMesh && n.name === 'P4_escultura_amarilla');
  if (!columna) return 0;
  const amarillo = '#d6a325', perno = '#9e7d24', [w, h, d] = columna.scale.toArray();
  const grupo = grupoSustituto(THREE, columna, ['imagen_0019.png'], 'Exhibidor de conexiones de acero de perfiles abiertos');
  perfilI(util, grupo, 'P4_perfil_columna_I_corpus', w, h, d, 'y', amarillo);
  const brazos = part.children.filter(n => n.isMesh && n.name === 'P4_brazo_acero_amarillo');
  for (const original of brazos) {
    const [bw, bh, bd] = original.scale.toArray(), brazo = grupoSustituto(THREE, original, ['imagen_0019.png'], 'Perfil I, placas y pernos de conexión');
    perfilI(util, brazo, 'P4_perfil_viga_I_corpus', bw, bh, bd, 'z', amarillo);
    for (const extremo of [-1, 1]) {
      const z = extremo * (bd / 2 - .035);
      util.pieza(brazo, 'P4_placa_union_acero_corpus', 0, 0, z, bw * .94, bh * .94, .035, amarillo);
      for (const x of [-bw * .29, bw * .29]) for (const y of [-bh * .29, bh * .29])
        util.tubo(brazo, 'P4_perno_union_acero_corpus', [x, y, z - .016], [x, y, z + .016], .022, perno);
    }
    for (const z of [-.26, .26]) util.pieza(brazo, 'P4_rigidizador_acero_corpus', 0, 0, z, bw * .72, bh * .72, .035, amarillo);
  }
  const base = part.children.find(n => n.isMesh && n.name === 'P4_base_arbol_acero');
  if (base && !part.getObjectByName('P4_anclajes_base_corpus')) {
    const g = new THREE.Group(); g.name = 'P4_anclajes_base_corpus'; g.userData.arquitecturaCorpus = VERSION_ARQUITECTURA_CORPUS; part.add(g);
    for (const x of [-base.scale.x * .35, base.scale.x * .35]) for (const z of [-base.scale.z * .35, base.scale.z * .35])
      util.tubo(g, 'P4_perno_anclaje_base_corpus', [base.position.x + x, base.position.y + base.scale.y / 2, base.position.z + z],
        [base.position.x + x, base.position.y + base.scale.y / 2 + .045, base.position.z + z], .035, perno);
  }
  const conjunto = new THREE.Group(); conjunto.name = 'P4_conexiones_acero_corpus';
  conjunto.position.copy(base?.position || grupo.position);
  conjunto.userData = { arquitecturaCorpus: VERSION_ARQUITECTURA_CORPUS, approximate: true,
    evidencia: ['imagen_0019.png'], tipo: 'Exhibidor de conexiones de acero, sin atribución artística' };
  const nombres = new Set(['P4_base_arbol_acero', 'P4_escultura_amarilla', 'P4_brazo_acero_amarillo',
    'P4_diagonal_acero_amarillo', 'P4_anclajes_base_corpus']);
  const piezas = part.children.filter(n => nombres.has(n.name));
  part.add(conjunto);
  for (const pieza of piezas) { pieza.position.sub(conjunto.position); conjunto.add(pieza); }
  return 1;
}

function invernaderoP2(ctx, util) {
  const { THREE, buildingGroups } = ctx, part = buildingGroups.get('P2')?.getObjectByName('P2_volumen_0');
  const original = part?.getObjectByName('P2_invernadero_lateral');
  if (!original?.isMesh) return 0;
  const padre = original.parent, [w, h, d] = original.scale.toArray();
  const marcos = padre.children.filter(n => n.isMesh && n.name === 'P2_marco_invernadero');
  const grupo = grupoSustituto(THREE, original, ['imagen_0036.png', 'imagen_0047.png'], 'Invernadero con techo a dos aguas y bastidor vacío');
  grupo.userData.parkingGroundBounds = { xMin: -w / 2, xMax: w / 2, zMin: -d / 2, zMax: d / 2 };
  const piso = -h / 2, altoMuro = h * .73, alero = piso + altoMuro, cumbrera = h / 2;
  const vidrio = original.material;
  vidrio.transparent = true; vidrio.opacity = .4; vidrio.depthWrite = false; vidrio.side = THREE.DoubleSide;
  const techo = util.traslucido('#e5eee9', .5), frente = new THREE.Quaternion();
  const wall0 = util.panel(grupo, 'P2_panel_frontal_invernadero_corpus', [0, piso + altoMuro / 2, d / 2], w, altoMuro, frente, vidrio);
  wall0.userData.disposeMaterial = true;
  util.panel(grupo, 'P2_panel_posterior_invernadero_corpus', [0, piso + altoMuro / 2, -d / 2], w, altoMuro, frente, vidrio);
  const lateral = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
  for (const lado of [-1, 1]) util.panel(grupo, 'P2_panel_lateral_invernadero_corpus', [lado * w / 2, piso + altoMuro / 2, 0], d, altoMuro, lateral, vidrio);
  for (const lado of [-1, 1]) {
    const ux = new THREE.Vector3(w / 2, lado * (alero - cumbrera), 0).normalize(), uy = new THREE.Vector3(0, 0, -1), normal = ux.clone().cross(uy);
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(ux, uy, normal));
    const panel = util.panel(grupo, 'P2_faldon_techo_invernadero_corpus', [lado * w / 4, (alero + cumbrera) / 2, 0], Math.hypot(w / 2, cumbrera - alero), d, q, techo);
    if (lado === -1) panel.userData.disposeMaterial = true;
  }
  for (const viejo of marcos) {
    const [mw, mh] = viejo.scale.toArray(), bastidor = grupoSustituto(THREE, viejo, ['imagen_0036.png', 'imagen_0047.png'], 'Bastidor blanco abierto, antes paño macizo');
    const bajo = -mh / 2, arriba = mh / 2 - .025, eave = bajo + mh * .73, ancho = mw / 2 - .025;
    for (const lado of [-1, 1]) {
      util.tubo(bastidor, 'P2_poste_bastidor_invernadero_corpus', [lado * ancho, bajo + .025, 0], [lado * ancho, eave, 0], .025, '#e7ece9');
      util.tubo(bastidor, 'P2_cabio_techo_invernadero_corpus', [lado * ancho, eave, 0], [0, arriba, 0], .025, '#e7ece9');
    }
    util.tubo(bastidor, 'P2_zocalo_bastidor_invernadero_corpus', [-ancho, bajo + .025, 0], [ancho, bajo + .025, 0], .025, '#e7ece9');
    util.tubo(bastidor, 'P2_travesano_bastidor_invernadero_corpus', [-ancho, eave, 0], [ancho, eave, 0], .025, '#e7ece9');
  }
  const largos = new THREE.Group(); largos.name = 'P2_bastidor_longitudinal_corpus'; largos.position.copy(grupo.position); largos.quaternion.copy(grupo.quaternion);
  largos.userData = { arquitecturaCorpus: VERSION_ARQUITECTURA_CORPUS, approximate: true }; padre.add(largos);
  for (const lado of [-1, 1]) {
    const x = lado * (w / 2 + .005);
    for (const y of [piso + .07, piso + altoMuro / 2, alero]) util.tubo(largos, 'P2_larguero_invernadero_corpus', [x, y, -d / 2 + .04], [x, y, d / 2 - .04], .022, '#e7ece9');
    for (const z of [-d / 3, -d / 6, d / 6, d / 3]) util.tubo(largos, 'P2_montante_lateral_invernadero_corpus', [x, piso + .07, z], [x, alero, z], .022, '#e7ece9');
  }
  corregirUbicacionInvernadero(ctx, grupo, [...padre.children.filter(n => n.name === 'P2_marco_invernadero'), largos]);
  return 1;
}

function puntosGeometria(THREE, nodos, espacio) {
  const puntos = [], inversa = espacio.matrixWorld.clone().invert();
  for (const nodo of nodos) nodo.traverse(malla => {
    if (!malla.isMesh) return;
    malla.geometry.computeBoundingBox(); const b = malla.geometry.boundingBox;
    const transformacion = inversa.clone().multiply(malla.matrixWorld);
    for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z])
      puntos.push(new THREE.Vector3(x, y, z).applyMatrix4(transformacion));
  });
  return puntos;
}

// La ubicación lateral heredada interpenetraba O. La fotografía acredita el
// objeto junto a 2P, pero no fija su posición: conservar el error lo ocultaría.
// Sólo se desplaza el conjunto por el mismo lado de P2; rects, IDs y rutas permanecen.
function corregirUbicacionInvernadero(ctx, grupo, otrasRaices) {
  const { THREE, data, buildingGroups, net } = ctx, raices = [grupo, ...otrasRaices];
  const campus = ctx.world || buildingGroups.get('P2').parent, padre = grupo.parent;
  const info = { esquema: 'Ubicación lateral esquemática, no levantamiento topográfico',
    motivo: 'La aproximación anterior quedaba dentro del volumen O', evidencia: ['imagen_0036.png', 'imagen_0047.png'],
    anchoCorredores: 1.8, pasoBusqueda: .05, margen: .05, deltaLocal: [0, 0, 0] };
  grupo.userData.ubicacionEsquematica = info;
  if (!net?.nodos || !net?.aristas) { info.estado = 'pendiente_red_de_rutas'; return; }
  campus.updateWorldMatrix(true, true);
  const fuente = puntosGeometria(THREE, raices, campus), minY = Math.min(...fuente.map(p => p.y)), maxY = Math.max(...fuente.map(p => p.y));
  // El margen cubre todo el conjunto, incluidos los tres bastidores, no sólo
  // las paredes traslúcidas cuya proyección horizontal aislada tiene área cero.
  const cajaLocal = new THREE.Box3().setFromPoints(puntosGeometria(THREE, raices, padre));
  const inversaCampus = campus.matrixWorld.clone().invert(), padreACampus = inversaCampus.clone().multiply(padre.matrixWorld);
  const base = [];
  for (const x of [cajaLocal.min.x - info.margen, cajaLocal.max.x + info.margen])
    for (const z of [cajaLocal.min.z - info.margen, cajaLocal.max.z + info.margen])
      base.push(new THREE.Vector3(x, 0, z).applyMatrix4(padreACampus));
  const poligono = convexHull(base), origen = new THREE.Vector3().applyMatrix4(padreACampus);
  const ejeZ = new THREE.Vector3(0, 0, 1).applyMatrix4(padreACampus).sub(origen), ejeX = new THREE.Vector3(1, 0, 0).applyMatrix4(padreACampus).sub(origen);
  const obstaculos = [], s = data.metersPerPixel;
  for (const edificio of data.buildings || []) for (const r of edificio.rects || [])
    obstaculos.push(rectanglePolygon(((r[0] + r[2]) / 2 - 895) * s + (edificio.offsetX || 0),
      ((r[1] + r[3]) / 2 - 390) * s + (edificio.offsetZ || 0), (r[2] - r[0]) * s, (r[3] - r[1]) * s));
  const nodos = new Map(net.nodos.map(n => [n.id, n]));
  for (const arista of net.aristas) {
    const a = nodos.get(arista.de), b = nodos.get(arista.a);
    if (a && b) obstaculos.push(segmentPolygon(a, b, info.anchoCorredores));
  }
  for (const nodo of net.nodos) obstaculos.push(rectanglePolygon(nodo.x, nodo.z, info.anchoCorredores, info.anchoCorredores));
  const propias = new Set(); for (const raiz of raices) raiz.traverse(n => propias.add(n));
  // Añadir salientes reales: columnas, ventanas y marcos de O alcanzan más
  // allá de la huella canónica. Cubiertas por encima del conjunto no bloquean.
  for (const edificio of buildingGroups.values()) edificio.traverse(malla => {
    if (!malla.isMesh || propias.has(malla) || (Array.isArray(malla.material) ? malla.material.every(m => m.transparent) : malla.material.transparent)) return;
    const puntos = puntosGeometria(THREE, [malla], campus), bajos = Math.min(...puntos.map(p => p.y)), altos = Math.max(...puntos.map(p => p.y));
    if (altos <= minY || bajos >= maxY) return;
    const huella = convexHull(puntos); if (huella.length >= 3) obstaculos.push(huella);
  });
  const rectP2 = data.buildings?.find(b => b.id === 'P2')?.rects?.[0], fondoP2 = rectP2 && (rectP2[3] - rectP2[1]) * s;
  // Filtrar por el recinto completo de búsqueda evita comparar cada paso con
  // fachadas y rutas del otro extremo del campus.
  const lado = Math.sign(grupo.position.x) || -1, busqueda = [];
  for (const p of poligono) for (const dx of [0, lado * 4]) for (const dz of [-30, 30])
    busqueda.push({ x: p.x + ejeX.x * dx + ejeZ.x * dz, z: p.z + ejeX.z * dx + ejeZ.z * dz });
  const alcance = { xMin: Math.min(...busqueda.map(p => p.x)), xMax: Math.max(...busqueda.map(p => p.x)),
    zMin: Math.min(...busqueda.map(p => p.z)), zMax: Math.max(...busqueda.map(p => p.z)) };
  const cercanos = obstaculos.filter(o => Math.max(...o.map(p => p.x)) >= alcance.xMin && Math.min(...o.map(p => p.x)) <= alcance.xMax &&
    Math.max(...o.map(p => p.z)) >= alcance.zMin && Math.min(...o.map(p => p.z)) <= alcance.zMax);
  const libre = (dx, dz) => {
    if (fondoP2 && (cajaLocal.min.z + dz - info.margen < -fondoP2 / 2 || cajaLocal.max.z + dz + info.margen > fondoP2 / 2)) return false;
    const candidata = poligono.map(p => ({ x: p.x + ejeX.x * dx + ejeZ.x * dz, z: p.z + ejeX.z * dx + ejeZ.z * dz }));
    return cercanos.every(obstaculo => !polygonsOverlap(candidata, obstaculo));
  };
  // Ordenar por distancia encuentra el desplazamiento mínimo de la malla de
  // 5 cm, admitiendo hasta 4 m hacia fuera sin cambiar de lado del edificio.
  const candidatos = [];
  for (let ix = 0; ix <= 4 / info.pasoBusqueda; ix++) for (let iz = -30 / info.pasoBusqueda; iz <= 30 / info.pasoBusqueda; iz++)
    candidatos.push({ ix, iz, distancia2: ix * ix + iz * iz });
  candidatos.sort((a, b) => a.distancia2 - b.distancia2 || a.ix - b.ix || b.iz - a.iz);
  const desplazamiento = candidatos.find(c => libre(lado * c.ix * info.pasoBusqueda, c.iz * info.pasoBusqueda));
  info.aristasComprobadas = net.aristas.length; info.obstaculosComprobados = obstaculos.length;
  if (!desplazamiento) { info.estado = 'pendiente_sin_ubicacion_libre'; return; }
  const dx = Math.round(lado * desplazamiento.ix * info.pasoBusqueda * 100) / 100, dz = Math.round(desplazamiento.iz * info.pasoBusqueda * 100) / 100;
  for (const raiz of raices) { raiz.position.x += dx; raiz.position.z += dz; }
  info.deltaLocal = [dx, 0, dz]; info.estado = dx || dz ? 'corregida_sin_interpenetracion' : 'ubicacion_anterior_libre';
  campus.updateWorldMatrix(true, true);
}

/** Ejecutar después de construir edificios y antes de despejar accesos/aparcamientos. */
export function mejorarArquitecturaCorpus(contexto) {
  const { buildingGroups } = contexto;
  const muestra = ['P4_patio_cubierto_estudio', 'P4_mesa_estudio', 'P4_escultura_amarilla']
    .map(nombre => buildingGroups.get('P4')?.getObjectByName(nombre))
    .concat(buildingGroups.get('P2')?.getObjectByName('P2_invernadero_lateral')).find(n => n?.isMesh);
  if (!muestra?.isMesh) return { cubiertaP4: 0, mesasP4: 0, exhibidorP4: 0, invernaderoP2: 0 };
  const util = recursos(contexto, muestra.geometry);
  return { cubiertaP4: cubiertaP4(contexto, util), mesasP4: mesasP4(contexto, util),
    exhibidorP4: exhibidorP4(contexto, util), invernaderoP2: invernaderoP2(contexto, util) };
}
