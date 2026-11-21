// Tres franjas, dentro del paño exterior existente. Esri 2025, Aleph UAM y corpus 0096.
export const franjasMulticanchasPoniente = [[1465, 1499], [1502, 1536], [1539, 1573]];

// Las naves 1P, 2P y 3P tienen módulos claros junto a una banda longitudinal oscura.
// Se reconstruye su ritmo desde la vista aérea, con perfil bajo basado en 0015, 0022 y 0027.
export function reconstruirCubiertasTalleres({THREE, data, buildingGroups, box, material, X, Z}) {
  for (const id of ['P1', 'P2', 'P3']) {
    const edificio = data.buildings.find(b => b.id === id);
    const volumen = buildingGroups.get(id)?.getObjectByName(id + '_volumen_0');
    if (!edificio || !volumen || volumen.getObjectByName(id + '_cubierta_modulada')) continue;

    const [x0, z0, x1, z1] = edificio.rects[0];
    const ancho = X(x1) - X(x0);
    const fondo = Z(z1) - Z(z0);
    const altura = edificio.height ?? edificio.floors * data.storeyHeight;
    const base = altura + .40;
    const serie = new THREE.Group();
    serie.name = id + '_cubierta_modulada';
    serie.userData = {approximate: true, reference: 'Esri 2025-01-30; corpus 0015, 0022, 0027'};
    volumen.add(serie);

    const cantidad = 11;
    const paso = (fondo - 1.1) / cantidad;
    const claro = paso - .16;
    const anchoClaro = ancho * (id === 'P3' ? .87 : .80);
    const inicio = -ancho / 2 + .34;
    const anchoFranja = ancho - anchoClaro - .58;
    const forma = new THREE.Shape();
    forma.moveTo(-claro / 2, 0);
    forma.quadraticCurveTo(0, 1.06, claro / 2, 0);
    forma.lineTo(claro / 2, -.09);
    forma.lineTo(-claro / 2, -.09);
    forma.closePath();

    const perfil = new THREE.ExtrudeGeometry(forma, {depth: anchoClaro, curveSegments: 10, bevelEnabled: false});
    perfil.translate(0, 0, -anchoClaro / 2);
    perfil.rotateY(Math.PI / 2);
    const claroMate = material('#e0dfd4');
    for (let n = 0; n < cantidad; n++) {
      const cubierta = new THREE.Mesh(perfil, claroMate);
      cubierta.name = id + '_modulo_claro_de_cubierta';
      cubierta.position.set(inicio + anchoClaro / 2, base + .09, -fondo / 2 + .55 + (n + .5) * paso);
      cubierta.receiveShadow = true;
      serie.add(cubierta);
    }
    box(serie, id + '_franja_longitudinal_azotea', inicio + anchoClaro + anchoFranja / 2,
      base + .10, 0, anchoFranja, .20, fondo - 1.1, '#666964');
  }
}

// Dos niveles documentados por Energía. La cara del peine conserva la llegada n106.
// Videos de O-105 (1:22–1:28) y SALAIRE (1:26) confirman cancelería, escalera y marquesina.
export function construirEdificioO({THREE, part, b, w, d, h, box, data}) {
  const edificio = new THREE.Group();
  edificio.name = 'O_laboratorios_ambiental_y_quimica';
  edificio.userData = {floors: b.floors, approximate: true, entrance: 'n106'};
  part.add(edificio);

  const frente = -d / 2;
  const accesoX = -w * 1.5 / 65;
  const receso = .44;
  const gris = '#b9bdbb', claro = '#dad8ce', vidrio = '#5f7274', rojo = '#a93432';
  const entrada = 4.5;
  box(edificio, 'O_cuerpo_de_laboratorios', 0, h / 2, receso / 2, w, h, d - receso, gris);
  for (const [izquierda, derecha] of [[-w / 2, accesoX - entrada / 2], [accesoX + entrada / 2, w / 2]]) {
    box(edificio, 'O_pano_concreto_acceso', (izquierda + derecha) / 2, h / 2, frente + receso / 2,
      derecha - izquierda, h, receso, gris);
  }
  box(edificio, 'O_dintel_de_entrada', accesoX, (2.59 + h) / 2, frente + receso / 2, entrada, h - 2.59, receso, gris);
  box(edificio, 'O_cancel_acristalado', accesoX, 1.45, frente + .14, entrada - .22, 2.30, .08, vidrio);
  for (const x of [-2.07, -1.27, 0, 1.27, 2.07]) {
    box(edificio, 'O_montante_cancel', accesoX + x, 1.45, frente + .08, .06, 2.34, .07, claro);
  }
  for (const y of [.28, 2.22, 2.61]) box(edificio, 'O_travesano_cancel', accesoX, y, frente + .08, 4.20, .066, .07, claro);
  for (const x of [-.15, .15]) box(edificio, 'O_tirador_de_acceso', accesoX + x, 1.16, frente + .035, .04, .28, .04, claro);
  box(edificio, 'O_rectangulo_de_senalizacion', accesoX + 2.65, 1.92, frente - .02, .62, .4, .06, rojo);

  const altura = data.storeyHeight;
  for (let piso = 0; piso < b.floors; piso++) {
    const y = piso * altura + 1.99;
    for (const lado of [-1, 1]) {
      const z = lado * d / 2;
      for (const x of [-w * .34, w * .34]) {
        box(edificio, 'O_ventanal_horizontal', x, y, z, w * .23, .92, .09, vidrio);
        for (const montante of [-.105, -.05, 0, .05, .105]) {
          box(edificio, 'O_montante_horizontal', x + w * montante, y, z + lado * .05, .055, .95, .04, claro);
        }
      }
    }
  }
  box(edificio, 'O_losa_de_azotea', 0, h + .11, 0, w, .22, d, '#c3c1b4');
  for (const lado of [-1, 1]) box(edificio, 'O_pretil', 0, h + .27, lado * (d / 2 - .11), w, .29, .22, '#a8a9a0');

  const marquesina = new THREE.Group();
  marquesina.name = 'O_marquesina_tubular_de_llegada';
  marquesina.position.set(accesoX, 0, frente);
  edificio.add(marquesina);

  const largo = 7.6, medio = 2.30, arranque = 2.93, flecha = .48;
  const frenteArco = new THREE.Shape();
  frenteArco.moveTo(-medio, arranque);
  frenteArco.quadraticCurveTo(0, arranque + 2 * flecha, medio, arranque);
  frenteArco.lineTo(medio, arranque + .075);
  frenteArco.quadraticCurveTo(0, arranque + 2 * flecha + .075, -medio, arranque + .075);
  frenteArco.closePath();
  const panel = new THREE.Mesh(
    new THREE.ExtrudeGeometry(frenteArco, {depth: largo, curveSegments: 18, bevelEnabled: false}),
    new THREE.MeshStandardMaterial({color: '#e8dfd0', transparent: true, opacity: .63, depthWrite: false, side: THREE.DoubleSide, roughness: .58})
  );
  panel.name = 'O_panel_traslucido_de_cubierta';
  panel.userData.disposeMaterial = true;
  panel.position.z = -largo;
  marquesina.add(panel);

  function tramo(nombre, a, c) {
    const inicio = new THREE.Vector3(...a);
    const delta = new THREE.Vector3(...c).sub(inicio);
    const largo = delta.length();
    const p = inicio.addScaledVector(delta, .5);
    const pieza = box(marquesina, nombre, p.x, p.y, p.z, .085, largo, .085, rojo);
    pieza.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.divideScalar(largo));
  }
  function alturaArco(x) { return arranque + flecha * (1 - (x / medio) ** 2); }

  for (const distancia of [.20, 3.76, largo - .17]) {
    const z = -distancia;
    for (const lateral of [-medio, medio]) box(marquesina, 'O_columna_roja_marquesina', lateral, arranque / 2, z, .13, arranque, .13, rojo);
    for (let i = 0; i < 8; i++) {
      const x = -medio + 2 * medio * i / 8;
      const siguiente = x + 2 * medio / 8;
      tramo('O_nervio_curvo_marquesina', [x, alturaArco(x), z], [siguiente, alturaArco(siguiente), z]);
    }
  }
  for (const x of [-medio, -medio / 2, 0, medio / 2, medio]) {
    box(marquesina, 'O_larguero_marquesina', x, alturaArco(x), -largo / 2, .065, .065, largo, rojo);
  }
  box(marquesina, 'O_piso_loseta_entrada', 0, .15, -largo / 2, 4.60, .16, largo, '#ac9c8e');
  for (const x of [-1.54, -.77, 0, .77, 1.54]) {
    box(marquesina, 'O_junta_longitudinal_loseta', x, .232, -largo / 2, .018, .007, largo, '#776c63');
  }
  for (let i = 1; i < 10; i++) {
    box(marquesina, 'O_junta_transversal_loseta', 0, .233, -largo * i / 10, 4.60, .007, .018, '#776c63');
  }
  return edificio;
}
