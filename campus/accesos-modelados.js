// Ajustes de representación de las entradas ya presentes en la red canónica.
// No desplaza nodos, no añade destinos y no certifica accesibilidad.
const ENTRADAS = [
  { edificio: 'Edificio_B', nombre: 'Antepecho_balcon_nivel_0', aristas: [['n27', 'n5']] },
  { edificio: 'Edificio_C', nombre: 'Antepecho_balcon_nivel_0', aristas: [['n51', 'n52']] },
  { edificio: 'Edificio_D', nombre: 'Antepecho_balcon_nivel_0', aristas: [['n33', 'n34']] },
  { edificio: 'Edificio_E', nombre: 'Antepecho_balcon_nivel_0', aristas: [['n52', 'n71'], ['n53', 'n73']] },
  { edificio: 'Edificio_F', nombre: 'Antepecho_balcon_nivel_0', aristas: [['n87', 'n12']] },
  { edificio: 'Edificio_W', nombre: 'W_volumen_bajo_escalonado', aristas: [['n32', 'n47']] },
  { edificio: 'Edificio_T', nombre: 'T_parasol_horizontal', aristas: [['n89', 'n20']] },
];
const EPS = 1e-8;

function segmentoCajaXZ(THREE, malla, a, b) {
  const inversa = malla.matrixWorld.clone().invert();
  const p = new THREE.Vector3(a.x, 1, a.z).applyMatrix4(inversa);
  const q = new THREE.Vector3(b.x, 1, b.z).applyMatrix4(inversa);
  const delta = q.clone().sub(p);
  let entrada = 0, salida = 1;
  for (const eje of ['x', 'z']) {
    if (Math.abs(delta[eje]) < EPS) {
      if (p[eje] <= -.5 || p[eje] >= .5) return null;
    } else {
      const valores = [(-.5 - p[eje]) / delta[eje], (.5 - p[eje]) / delta[eje]].sort((x, y) => x - y);
      entrada = Math.max(entrada, valores[0]); salida = Math.min(salida, valores[1]);
    }
  }
  return salida - entrada > EPS ? { p, delta, entrada, salida, inversa } : null;
}

function ejeYLongitud(THREE, malla) {
  const x = new THREE.Vector3().setFromMatrixColumn(malla.matrixWorld, 0).length();
  const z = new THREE.Vector3().setFromMatrixColumn(malla.matrixWorld, 2).length();
  return x >= z ? { largo: 'x', normal: 'z', metros: x } : { largo: 'z', normal: 'x', metros: z };
}

function intervaloApertura(THREE, malla, a, b, ancho) {
  const cruce = segmentoCajaXZ(THREE, malla, a, b);
  if (!cruce) return null;
  const eje = ejeYLongitud(THREE, malla);
  if (Math.abs(cruce.delta[eje.normal]) < EPS) return null;
  const dx = b.x - a.x, dz = b.z - a.z, distancia = Math.hypot(dx, dz);
  if (distancia < EPS) return null;
  const lateral = new THREE.Vector4(-dz / distancia, 0, dx / distancia, 0).applyMatrix4(cruce.inversa);
  // Proyección del corredor de ancho físico sobre la fachada. Se incluyen
  // ambas caras del muro: también quedan libres las aproximaciones diagonales.
  const factor = Math.abs(lateral[eje.largo] - cruce.delta[eje.largo] / cruce.delta[eje.normal] * lateral[eje.normal]);
  const centros = [cruce.entrada, cruce.salida].map(t => cruce.p[eje.largo] + cruce.delta[eje.largo] * t);
  const margen = ancho / 2 * factor + .03 / eje.metros;
  const desde = Math.max(-.5, Math.min(...centros) - margen), hasta = Math.min(.5, Math.max(...centros) + margen);
  return hasta - desde > EPS ? { desde, hasta, eje: eje.largo } : null;
}

function unirIntervalos(intervalos) {
  const unidos = [];
  for (const v of intervalos.slice().sort((a, b) => a.desde - b.desde)) {
    const ultimo = unidos.at(-1);
    if (ultimo && v.desde <= ultimo.hasta + EPS) ultimo.hasta = Math.max(ultimo.hasta, v.hasta);
    else unidos.push({ ...v });
  }
  return unidos;
}

function recortar(THREE, malla, intervalos, altura) {
  const abiertos = unirIntervalos(intervalos);
  if (!abiertos.length || !malla.parent) return null;
  const eje = abiertos[0].eje;
  const centro = new THREE.Vector3().setFromMatrixPosition(malla.matrixWorld);
  const yDintel = new THREE.Vector3(centro.x, altura, centro.z).applyMatrix4(malla.matrixWorld.clone().invert()).y;
  const limiteY = Math.max(-.5, Math.min(.5, yDintel));
  if (limiteY <= -.5 + EPS) return null;
  const parent = malla.parent, indice = parent.children.indexOf(malla), grupo = new THREE.Group();
  grupo.name = malla.name;
  grupo.position.copy(malla.position); grupo.quaternion.copy(malla.quaternion); grupo.scale.copy(malla.scale);
  grupo.visible = malla.visible; grupo.renderOrder = malla.renderOrder; grupo.layers.mask = malla.layers.mask;
  grupo.userData = { ...malla.userData, accesoModelado: true, aperturaHastaY: altura,
    approximate: true, purpose: 'Vano esquemático alineado a entrada de ruta existente; sin medición ni certificación de accesibilidad' };
  let numero = 0;
  function fragmento(inicio, fin, y0 = -.5, y1 = .5, tipo = 'lateral') {
    if (fin - inicio <= EPS || y1 - y0 <= EPS) return;
    const pieza = new THREE.Mesh(malla.geometry, malla.material);
    pieza.name = malla.name + '_acceso_' + tipo + '_' + numero++;
    pieza.position.set(eje === 'x' ? (inicio + fin) / 2 : 0, (y0 + y1) / 2, eje === 'z' ? (inicio + fin) / 2 : 0);
    pieza.scale.set(eje === 'x' ? fin - inicio : 1, y1 - y0, eje === 'z' ? fin - inicio : 1);
    pieza.castShadow = malla.castShadow; pieza.receiveShadow = malla.receiveShadow; pieza.layers.mask = malla.layers.mask;
    grupo.add(pieza);
  }
  let cursor = -.5;
  for (const abierto of abiertos) {
    fragmento(cursor, abierto.desde);
    // El dintel permanece apoyado en los laterales; nunca se corta una columna
    // estructural alta para dejar su parte superior suspendida.
    fragmento(abierto.desde, abierto.hasta, limiteY, .5, 'dintel');
    cursor = abierto.hasta;
  }
  fragmento(cursor, .5);
  parent.remove(malla); parent.add(grupo);
  parent.children.splice(parent.children.indexOf(grupo), 1); parent.children.splice(indice, 0, grupo);
  return grupo;
}

function aristaPermitida(net, a, b) {
  return net.aristas.some(e => e.de === a && e.a === b || e.de === b && e.a === a);
}

/** Se ejecuta tras generar edificios, usando el net vivo del editor de rutas. */
export function liberarAccesosModelados({ THREE, world, net, openingWidth = 2.4, openingHeight = 2.35 }) {
  if (typeof net === 'function') net = net();
  if (!world || !net?.nodos || !net?.aristas) return { aristas: [], objetosRecortados: 0, pilastrasRetraidas: 0 };
  if (!(Number.isFinite(openingWidth) && openingWidth > 0 && Number.isFinite(openingHeight) && openingHeight > 0))
    throw Error('Dimensiones de apertura inválidas');
  const nodos = new Map(net.nodos.map(n => [n.id, n])), planes = [], aristas = new Set();
  world.updateWorldMatrix(true, true);
  for (const permitido of ENTRADAS) {
    const edificio = world.getObjectByName(permitido.edificio);
    if (!edificio) continue;
    const candidatos = [];
    edificio.traverse(n => { if (n.isMesh && n.name === permitido.nombre) candidatos.push(n); });
    for (const malla of candidatos) {
      const cortes = [];
      for (const [idA, idB] of permitido.aristas) {
        if (!aristaPermitida(net, idA, idB)) continue;
        const a = nodos.get(idA), b = nodos.get(idB);
        if (!a || !b) continue;
        const intervalo = intervaloApertura(THREE, malla, a, b, openingWidth);
        if (intervalo) cortes.push({ ...intervalo, arista: idA + '-' + idB });
      }
      if (!cortes.length) continue;
      planes.push({ malla, cortes });
      if (permitido.nombre !== 'Antepecho_balcon_nivel_0') continue;
      // Se abre también el paño oscuro que estaba justo sobre ese antepecho,
      // únicamente en la misma cara y hasta la altura libre fijada.
      const eje = ejeYLongitud(THREE, malla), centro = new THREE.Vector3().setFromMatrixPosition(malla.matrixWorld);
      const normal = new THREE.Vector3().setFromMatrixColumn(malla.matrixWorld, eje.normal === 'x' ? 0 : 2).normalize();
      for (const sombra of malla.parent.children) {
        if (!sombra.isMesh || sombra.name !== 'Sombra_galeria_nivel_0') continue;
        const cs = new THREE.Vector3().setFromMatrixPosition(sombra.matrixWorld);
        if (Math.abs(cs.sub(centro).dot(normal)) > .35) continue;
        const cortesSombra = [];
        for (const [idA, idB] of permitido.aristas) {
          if (!aristaPermitida(net, idA, idB)) continue;
          const a = nodos.get(idA), b = nodos.get(idB);
          if (!a || !b) continue;
          const intervalo = intervaloApertura(THREE, sombra, a, b, openingWidth);
          if (intervalo) cortesSombra.push({ ...intervalo, arista: idA + '-' + idB });
        }
        if (cortesSombra.length) planes.push({ malla: sombra, cortes: cortesSombra });
      }
    }
  }
  const unicos = new Map();
  for (const plan of planes) {
    if (!unicos.has(plan.malla)) unicos.set(plan.malla, []);
    unicos.get(plan.malla).push(...plan.cortes);
  }
  let objetosRecortados = 0;
  for (const [malla, cortes] of unicos) if (recortar(THREE, malla, cortes, openingHeight)) {
    objetosRecortados++;
    for (const corte of cortes) aristas.add(corte.arista);
  }
  world.updateWorldMatrix(true, true);
  const grupoG = world.getObjectByName('Edificio_G'), a = nodos.get('n15'), b = nodos.get('n88');
  let pilastrasRetraidas = 0, retranqueoG = 0;
  if (grupoG && a && b && aristaPermitida(net, 'n15', 'n88')) {
    const pilares = [];
    grupoG.traverse(n => { if (n.isMesh && n.name === 'Pilastra_gris_G' && !n.userData.accesoModelado) pilares.push(n); });
    for (const pilar of pilares) {
      if (!segmentoCajaXZ(THREE, pilar, a, b)) continue;
      const direccion = new THREE.Vector3(b.x - a.x, 0, b.z - a.z).normalize();
      const centro = new THREE.Vector3().setFromMatrixPosition(pilar.matrixWorld);
      const radio = [0, 1, 2].reduce((r, i) => r + Math.abs(new THREE.Vector3().setFromMatrixColumn(pilar.matrixWorld, i).dot(direccion)) / 2, 0);
      const avance = Math.max(0, new THREE.Vector3(b.x, centro.y, b.z).sub(centro).dot(direccion) + radio + .03);
      if (avance <= EPS) continue;
      centro.addScaledVector(direccion, avance);
      pilar.position.copy(pilar.parent.worldToLocal(centro));
      pilar.userData = { ...pilar.userData, accesoModelado: true, approximate: true,
        retranqueoVisual: avance, purpose: 'Retraída íntegra detrás del destino existente; sin cortar la columna' };
      pilastrasRetraidas++; retranqueoG += avance; aristas.add('n15-n88');
      break; // Únicamente la pilastra que invadía esta aproximación.
    }
  }
  return { aristas: [...aristas].sort(), objetosRecortados, pilastrasRetraidas, retranqueoG };
}
