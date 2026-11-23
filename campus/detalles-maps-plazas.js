import {gPassage} from 'route-space';

const fuenteG = 'https://www.google.com/maps/place/Edificio+G/@19.5034377,-99.1861941,3a,75y,90t/data=!3m3!1e2!3m1!1sCIHM0ogKEICAgICuxfbBTw';
const fuenteH = 'https://www.google.com/maps/place/Edificio+E/@19.5028888,-99.1870494,118m/data=!3m1!1e3!4m2!3m1!1s0x85d1f93d601c5cc7:0xa95c9df86b32d17e';
const fuenteSerpentina = 'https://www.google.com/maps/@19.5025295,-99.187095,3a,75y,90t/data=!3m8!1e2!3m6!1sCIHM0ogKEICAgICn8KW1HQ!2e10!3e12!7i6000!8i4000';
const fuenteHP = 'https://www.google.com/maps/place/Edificio+HP/@19.5029781,-99.1877747,3a,75y,90t/data=!3m3!1e2!3m1!1sCIABIhDLa2vs6qIahFkbZ713kqGG';
const fuenteCosei = 'https://www.google.com/maps/@19.5034453,-99.1865436,3a,75y,149h,90t/data=!3m4!1e1!3m2!1sCIHM0ogKEICAgICE65LQNQ!2e10';

function acabado(THREE, color) {
  return new THREE.MeshStandardMaterial({color, roughness: .94});
}

function malla(THREE, grupo, nombre, geometria, material) {
  const objeto = new THREE.Mesh(geometria, material);
  objeto.name = nombre;
  objeto.receiveShadow = true;
  grupo.add(objeto);
  return objeto;
}

function superficie(THREE, grupo, nombre, puntos, material) {
  const contorno = puntos.map(([x, , z]) => new THREE.Vector2(x, -z));
  const indices = THREE.ShapeUtils.triangulateShape(contorno, []).flat();
  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute('position', new THREE.Float32BufferAttribute(puntos.flat(), 3));
  geometria.setAttribute('uv', new THREE.Float32BufferAttribute(puntos.flatMap(([x, , z]) => [x / 2.4, z / 2.4]), 2));
  geometria.setIndex(indices);
  geometria.computeVertexNormals();
  return malla(THREE, grupo, nombre, geometria, material);
}

// Acabado generado del aparejo observado. Los pequeños cambios de tono y las
// juntas forman parte del material, no son piezas por encima del itinerario.
function despieceDePavimento(THREE, tonoPieza, tonoJunta) {
  const lado = 256;
  const datos = new Uint8Array(lado * lado * 4);
  for (let j = 0; j < lado; j++) {
    const hilada = j * 20 / lado;
    const fila = Math.floor(hilada);
    for (let i = 0; i < lado; i++) {
      const pieza = i * 10 / lado + (fila % 2) * .5;
      const columna = Math.floor(pieza) % 10;
      const junta = hilada % 1 < .083 || pieza % 1 < .044;
      const grano = (31 * j + 19 * i + i * j) % 7 - 3;
      const variacion = (fila * 17 + columna * 23 + fila * columna * 3) % 19 - 9;
      const tono = grano + (junta ? 0 : variacion);
      const [r, g, b] = junta ? tonoJunta : tonoPieza;
      datos.set([r + tono, g + tono, b + tono, 255], (j * lado + i) << 2);
    }
  }
  const textura = new THREE.DataTexture(datos, lado, lado);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.wrapS = textura.wrapT = THREE.RepeatWrapping;
  textura.magFilter = THREE.LinearFilter;
  textura.minFilter = THREE.LinearMipmapLinearFilter;
  textura.generateMipmaps = true;
  textura.needsUpdate = true;
  return new THREE.MeshStandardMaterial({map: textura, roughness: .96});
}

function despieceTerracota(THREE) {
  return despieceDePavimento(THREE, [155, 100, 86], [174, 135, 122]);
}

function detallarCruceG(THREE, raiz, data, X, Z) {
  const g = data.buildings.find(b => b.id === 'G');
  const roja = data.plazas.find(p => p.name === 'Plaza Roja');
  const cosei = data.plazas.find(p => p.name === 'Plaza COSEI');
  if (!g || !roja || !cosei) return;

  const [px0, pz0, px1, pz1] = g.rects[0];
  const x0 = X(px0) + (g.offsetX || 0);
  const x1 = X(px1) + (g.offsetX || 0);
  const {step, zCenter} = gPassage(Z(pz1) - Z(pz0));
  const centroZ = (Z(pz0) + Z(pz1)) / 2 + zCenter + (g.offsetZ || 0);
  const bordeRoja = X(roja.rect[2]);
  const bordeCosei = X(cosei.rect[0]);
  const ancho = step * .86;
  const paso = new THREE.Group();
  paso.name = 'G_cruce_entre_Plaza_Roja_y_COSEI';
  paso.position.set((x0 + x1) / 2, 0, centroZ);
  paso.userData = {approximate: true, reference: 'Imagen exterior de G y corpus 0080, 0086', source: fuenteG};
  raiz.add(paso);

  const localX = x => x - paso.position.x;
  const solado = despieceTerracota(THREE);
  const borde = acabado(THREE, '#c2baaa');

  function paño(nombre, perfil, z0, z1, material) {
    const [a, b] = perfil;
    return superficie(THREE, paso, nombre, [
      [localX(a[0]), a[1], z0], [localX(b[0]), b[1], z0],
      [localX(b[0]), b[1], z1], [localX(a[0]), a[1], z1]
    ], material);
  }

  const banda = ancho / 2;
  const interior = [[x0, .332], [x1, .332]];
  paño('G_loseta_terracota_del_vano', interior, -banda, banda, solado).userData.disposeMaterial = true;
  // El canto claro acompaña el eje terracota hasta ambos umbrales (0080 y 0086).
  const cantoInterior = [[x0, .335], [x1, .335]];
  paño('G_canto_claro_continuo_del_vano', cantoInterior, -banda, -banda + .19, borde);
  paño('G_canto_claro_continuo_del_vano', cantoInterior, banda - .19, banda, borde);

  // Las bandas llegan a los pavimentos actuales. Se recalculan con la posición
  // de G y mantienen visualmente las transiciones pequeñas de sus umbrales.
  const entradas = [
    {nombre: 'Plaza_Roja', muro: x0, limite: Math.min(x0 - .25, bordeRoja), eje: -1, nivel: .369},
    {nombre: 'COSEI', muro: x1, limite: Math.max(x1 + .25, bordeCosei), eje: 1, nivel: .372},
  ];
  for (const {nombre, muro, limite, eje, nivel} of entradas) {
    const perfil = [[muro, .345], [limite, nivel]].sort((a, b) => a[0] - b[0]);
    paño(`G_umbral_de_loseta_${nombre}`, perfil, -banda, banda, solado);
    for (const lado of [-1, 1]) {
      const extremos = [lado * banda, lado * (banda - .19)].sort((a, b) => a - b);
      paño(`G_borde_de_concreto_${nombre}`, perfil.map(([x, y]) => [x, y + .004]), ...extremos, borde);
    }
    // El ensanche transversal está en el claro inmediato al vano, con caras a ras del suelo.
    const frente = muro + eje * Math.min(1.4, Math.abs(limite - muro));
    const cruce = [[muro, .347], [frente, .368]].sort((a, b) => a[0] - b[0]);
    for (const lado of [-1, 1]) {
      const extremos = [lado * banda, lado * (banda + 5.5)].sort((a, b) => a - b);
      paño(`G_cruce_transversal_${nombre}`, cruce, ...extremos, solado);
      const canto = [extremos[0], extremos[0] + .12];
      paño(`G_canto_cruce_${nombre}`, cruce.map(([x, y]) => [x, y + .003]), ...canto, borde);
    }
  }
  paso.children.find(objeto => objeto.material === borde).userData.disposeMaterial = true;
}

function detallarPatioH(THREE, raiz, data, X, Z) {
  const patio = data.plazas.find(p => p.name === 'Patio H');
  if (!patio) return;
  const [x0, z0, x1, z1] = patio.rect;
  const medioX = (x0 + x1) / 2, medioZ = (z0 + z1) / 2;
  const patioH = new THREE.Group();
  patioH.name = 'H_patio_central_ajardinado';
  patioH.position.set(X(medioX), .355, Z(medioZ));
  patioH.userData = {
    approximate: true,
    reference: 'Contornos del croquis existente. Pavimento y arriate interpretados a partir de fotos del patio de 2007.',
    source: fuenteH,
    historicalPhoto: 'https://sandrocohen.blogspot.com/2007/09/',
    institutionalPhoto: 'https://kali.azc.uam.mx/aleph/numeros/aleph115.pdf#page=6'
  };
  raiz.add(patioH);

  // Posición relativa a los cuatro bordes del patio. Los números proceden de la
  // lectura de la toma aérea y no constituyen un levantamiento de pendientes.
  const aX = x => X(x0 + (x - 785) / 78 * (x1 - x0)) - patioH.position.x;
  const aZ = z => Z(z0 + (z - 316) / 58 * (z1 - z0)) - patioH.position.z;

  function suelo(nombre, puntos, y, material) {
    const objeto = superficie(THREE, patioH, nombre, puntos.map(([x, z]) => [aX(x), y, aZ(z)]), material);
    objeto.userData.disposeMaterial = true;
  }

  const base = malla(THREE, patioH, 'H_pavimento_terracota', new THREE.BoxGeometry(X(x1) - X(x0), .17, Z(z1) - Z(z0)), acabado(THREE, '#b86c5b'));
  base.position.y = -.085;
  base.userData.disposeMaterial = true;

  // El suelo claro del patio se distingue del corredor terracota protegido
  // por el edificio. Los pasillos conservan el nivel y el contorno del modelo.
  const losas = despieceDePavimento(THREE, [195, 185, 165], [151, 145, 132]);
  suelo('H_losas_claras_del_patio', [[791,322],[849,322],[849,339],[857,344],[857,368],
    [835,368],[829,362],[810,362],[804,368],[791,368]], .004, losas);

  // Las tres trazas claras del lado de HP se interpretan como franjas al ras.
  // El contorno del patio, el nivel y los espacios de paso no se desplazan.
  const tonos = ['#b4aaa0', '#d4c9b7', '#dcd1bc'];
  for (let i = 0; i < tonos.length; i++) {
    const x = 861 - i * 2.05, z = 372 - i * 2.05;
    suelo('H_banda_clara_del_claustro_' + (i + 1), [[x-1.68,318.6],[x,318.6],[x,z],
      [833.4,z],[833.4,z-1.68],[x-1.68,z-1.68]], .008, acabado(THREE, tonos[i]));
  }

  const jardines = [
    {nombre: 'paño_vegetado_mayor', puntos: [[833,369],[817,370],[803,365],[798,358],[801,351],[810,347],[820,352],[828,356]],
      color: '#687d4c', arbol: [816,360,3.4], guarnicion: true},
    {nombre: 'arriate_lado_HP', puntos: [[858,340],[850,341],[841,339],[834,332],[835,326],[842,324],[850,328],[857,331]],
      color: '#61734c', arbol: [846,333,2.75]},
    {nombre: 'paño_en_esquina', puntos: [[855,323],[849,319],[839,319],[831,322],[836,327],[843,328],[850,326]],
      color: '#777945', arbol: [843,323,1.9]},
  ];
  for (const {nombre, puntos, color, arbol, guarnicion} of jardines) {
    suelo('H_borde_' + nombre, puntos, .012, acabado(THREE, '#888176'));
    const xMedio = puntos.reduce((s, [x]) => s + x / puntos.length, 0);
    const zMedio = puntos.reduce((s, [, z]) => s + z / puntos.length, 0);
    const interior = puntos.map(([x, z]) => [xMedio + .93 * (x - xMedio), zMedio + .91 * (z - zMedio)]);
    suelo('H_' + nombre, interior, .018, acabado(THREE, color));
    // Dejar tierra a la vista alrededor del tronco, dentro del arriate.
    const [arbolX, arbolZ] = arbol;
    const tierra = [[-1.64,-.40],[-.64,-1.17],[1.08,-.91],[1.64,.16],[.82,.92],[-.85,.83]];
    suelo('H_tierra_visible_' + nombre, tierra.map(([x,z]) => [arbolX+x,arbolZ+z]),
      .020, acabado(THREE, '#837454'));
    if (guarnicion) {
      const contorno = new THREE.Shape(puntos.map(([x, z]) => new THREE.Vector2(aX(x), -aZ(z))));
      contorno.holes.push(new THREE.Path(interior.map(([x, z]) => new THREE.Vector2(aX(x), -aZ(z)))));
      const perfil = new THREE.ExtrudeGeometry(contorno, {depth: .11, bevelEnabled: false});
      const borde = malla(THREE, patioH, 'H_guarnicion_de_concreto_del_arriate', perfil, acabado(THREE, '#bcb3a5'));
      borde.rotation.x = -Math.PI / 2;
      borde.position.y = .016;
      borde.castShadow = true;
      borde.userData.disposeMaterial = true;
    }
    const [x, z, radio] = arbol;
    const alto = 1.9 + radio * .5;
    const tronco = malla(THREE, patioH, 'H_tronco_de_patio', new THREE.CylinderGeometry(.13, .21, alto, 8), acabado(THREE, '#615640'));
    tronco.position.set(aX(x), alto / 2 + .018, aZ(z));
    tronco.userData.disposeMaterial = true;
    tronco.castShadow = true;
    const follaje = new THREE.Group();
    follaje.name = 'H_copa_del_patio';
    follaje.position.set(aX(x), alto + .45, aZ(z));
    patioH.add(follaje);
    for (const [dx, dz, dy, r, colorCopa] of [[0,0,.62,.73,'#4d713b'],[-.37,.19,.04,.62,'#67844b'],[.43,-.11,.12,.61,'#577943']]) {
      const copa = malla(THREE, follaje, 'H_ramas_y_copa', new THREE.IcosahedronGeometry(r * radio, 2), acabado(THREE, colorCopa));
      copa.position.set(dx * radio, dy, dz * radio);
      copa.scale.y = .72;
      copa.userData.disposeMaterial = true;
      copa.castShadow = true;
    }
  }

  const arillo = malla(THREE, patioH, 'H_borde_alcorque_circular', new THREE.CylinderGeometry(1.42, 1.42, .07, 40), acabado(THREE, '#afa59a'));
  arillo.position.set(aX(822), .026, aZ(333));
  arillo.userData.disposeMaterial = true;
  const relleno = malla(THREE, patioH, 'H_alcorque_circular_tierra_y_cubresuelo', new THREE.CylinderGeometry(1.22, 1.22, .04, 40), acabado(THREE, '#6c7546'));
  relleno.position.set(aX(822), .047, aZ(333));
  relleno.userData.disposeMaterial = true;
}

/** Detalle local en la orientación de Serpentina II, incluida la edición de su grupo. */
export function detallarAroSerpentina(THREE, escultura) {
  const aro = malla(THREE, escultura, 'Serpentina_aro_exterior_fino_de_gravilla', new THREE.RingGeometry(3.8, 3.96, 96), acabado(THREE, '#b8b7a9'));
  aro.rotation.x = -Math.PI / 2;
  aro.position.y = .352;
  aro.userData = {disposeMaterial: true, approximate: true, source: fuenteSerpentina};
  return aro;
}

function detallarSueloHP(THREE, grupo, X, Z) {
  const jardincillo = new THREE.Group();
  jardincillo.name = 'HP_claros_de_tierra_del_jardin';
  jardincillo.position.set(X(916), .282, Z(290));
  jardincillo.userData = {approximate: true, reference: 'Desgaste de césped bajo las copas, distinto de las plazas de ajedrez', source: fuenteHP};
  grupo.add(jardincillo);

  const suelo = '#8c775e', ceja = '#829052';
  const terrones = [
    [[912,280],[918,279],[925,283],[927,289],[922,293],[913,291],[910,285]],
    [[903,298],[912,299],[920,301],[925,304],[919,308],[911,306],[906,305]],
    [[930,278],[938,280],[941,285],[938,289],[930,287],[927,281]]
  ];
  for (const puntos of terrones) {
    const cx = puntos.reduce((total, [x]) => total + x / puntos.length, 0);
    const cz = puntos.reduce((total, [, z]) => total + z / puntos.length, 0);
    const ajustar = ([x, z], k = 1, altura = 0) => [
      X(cx + k * (x - cx)) - jardincillo.position.x, altura,
      Z(cz + k * (z - cz)) - jardincillo.position.z
    ];
    superficie(THREE, jardincillo, 'HP_transicion_de_cesped', puntos.map(p => ajustar(p)), acabado(THREE, ceja)).userData.disposeMaterial = true;
    superficie(THREE, jardincillo, 'HP_tierra_bajo_la_copa', puntos.map(p => ajustar(p, .77, .003)), acabado(THREE, suelo)).userData.disposeMaterial = true;
  }
}

function detallarExplanadaCosei(THREE, raiz, data, X, Z) {
  const spec = data.cosei;
  if (!spec) return;
  const [x0, z0, x1, z1] = spec.terrace;
  const top = spec.baseElevation + spec.rise;
  const explanada = new THREE.Group();
  explanada.name = 'COSEI_pavimentos_de_llegada_a_Biblioteca';
  explanada.position.set(X((x0 + x1) / 2), spec.baseElevation, Z((z0 + z1) / 2));
  explanada.userData = {
    approximate: true, reference: 'Panorama de Plaza COSEI y corpus 0018, 0020, 0034, 0141, 0154, 0157.',
    source: fuenteCosei, pending: 'Calibración exacta de juntas, desnivel y ancho útil de la rampa.'
  };
  raiz.add(explanada);

  const localX = x => X(x) - explanada.position.x;
  const localZ = z => Z(z) - explanada.position.z;
  const dX = X(x1) - X(x0);
  const tramo = (nombre, [a, b, c, d], altura, material) => superficie(THREE, explanada, nombre,
    [[a, altura, b], [c, altura, b], [c, altura, d], [a, altura, d]], material);
  const terracota = despieceDePavimento(THREE, [165, 108, 93], [185, 145, 127]);
  tramo('COSEI_loseta_de_terraza', [localX(x0+.6), localZ(z0+.5), localX(x1-.5), localZ(z1-.3)],
    top - spec.baseElevation + .008, terracota).userData.disposeMaterial = true;

  // Las dos juntas oscuras van dentro de franjas grises que cruzan el orden de
  // la loseta beige. Su cota es la del pavimento. Una refina la junta existente.
  const concreto = acabado(THREE, '#b9b7a8'), junta = acabado(THREE, '#51534b');
  const juntas = [
    {x: .5731, desde: .005, hasta: .996},
    {x: .337, desde: .02, hasta: .84},
  ];
  for (const [i, {x, desde, hasta}] of juntas.entries()) {
    const eje = localX(x0) + x * dX, desdeZ = localZ(z0 + (z1 - z0) * desde), hastaZ = localZ(z0 + (z1 - z0) * hasta);
    const pisoJunta = spec.rise + .042;
    const franja = tramo('COSEI_franja_de_concreto_con_junta_' + (i + 1),
      [eje - .32, desdeZ, eje + .32, hastaZ], pisoJunta, concreto);
    const corte = tramo('COSEI_junta_de_drenaje_' + (i + 1),
      [eje - .027, desdeZ, eje + .027, hastaZ], pisoJunta + .002, junta);
    franja.userData.disposeMaterial = corte.userData.disposeMaterial = i === 0;
  }

  // La hilera de palmas modelada junto a la explanada se ve en las tomas con
  // losas grises y alcorques enrejados. Los troncos mantienen sus posiciones.
  const palmas = (spec.palms || []).filter(([x, z]) => x < x0 - 8 && z >= z0 && z <= z1 - 2)
    .sort((a, b) => a[1] - b[1]);
  if (!palmas.length) return;
  const adoquin = despieceDePavimento(THREE, [166, 165, 156], [129, 128, 122]);
  adoquin.map.repeat.set(.5, .5);
  const gris = acabado(THREE, '#8b8a7d'), metal = acabado(THREE, '#655b4c');
  const y = .052;
  const medio = localX(palmas[0][0]);
  const ancho = 2.18, hueco = 1.03;
  let limite = localZ(palmas[0][1]) - 2.0;
  for (const [i, [px, pz]] of palmas.entries()) {
    const x = localX(px), z = localZ(pz);
    const frente = z - hueco, fondo = z + hueco;
    const paño = tramo('COSEI_losas_grises_entre_alcorques', [medio - ancho, limite, medio + ancho, frente], y, adoquin);
    paño.userData.disposeMaterial = i === 0;
    tramo('COSEI_losas_grises_lado_izquierdo', [medio - ancho, frente, x - hueco, fondo], y, adoquin);
    tramo('COSEI_losas_grises_lado_derecho', [x + hueco, frente, medio + ancho, fondo], y, adoquin);
    limite = fondo;

    const lado = hueco + .08;
    const tierra = tramo('COSEI_caja_de_tierra_del_alcorque', [x - lado, frente, x + lado, fondo], y - .012, gris);
    tierra.userData.disposeMaterial = i === 0;
    const barras = [], rad = .40, numero = 44;
    for (let j = 0; j < numero; j++) {
      const a = 2 * Math.PI * j / numero, b = a + .026;
      const punto = (t, exterior) => {
        const u = Math.cos(t), v = Math.sin(t);
        const largo = exterior ? hueco / Math.max(Math.abs(u), Math.abs(v)) : rad;
        return [x + largo * u, y - .005, z + largo * v];
      };
      const p = punto(a, false), q = punto(b, false), r = punto(b, true), s = punto(a, true);
      barras.push(...p, ...q, ...r, ...p, ...r, ...s);
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(barras, 3));
    geom.computeVertexNormals();
    const rejilla = malla(THREE, explanada, 'COSEI_rejilla_radial_de_palmera', geom, metal);
    rejilla.userData.disposeMaterial = i === 0;
  }
  const fin = Math.min(limite + 1.7, localZ(z1) - .04);
  tramo('COSEI_remate_del_andador_de_losas', [medio - ancho, limite, medio + ancho, fin], y, adoquin);
}

/** Capas ligeras de exteriores. El grupo devuelto usa metros del modelo. */
export function crearDetallesMapsPlazas(THREE, data) {
  const grupo = new THREE.Group();
  grupo.name = 'Detalles_Maps_plazas_Azcapotzalco';
  const X = px => (px - 895) * data.metersPerPixel;
  const Z = pz => (pz - 390) * data.metersPerPixel;
  detallarCruceG(THREE, grupo, data, X, Z);
  detallarPatioH(THREE, grupo, data, X, Z);
  detallarSueloHP(THREE, grupo, X, Z);
  detallarExplanadaCosei(THREE, grupo, data, X, Z);
  return grupo;
}
