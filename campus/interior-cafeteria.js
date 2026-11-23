// Corte parcial de J. Planta y fotos de la remodelación proyectada por VHSP y Giovanni
// Bertely (2009), contrastadas con las fotos comunitarias de 2017 y con el corpus exterior.
// https://bertely.wordpress.com/2009/05/22/cafeteria-uam-azcapotzalco/
export function crearInteriorCafeteria(THREE) {
  const group = new THREE.Group();
  group.name = 'Interior_J_Comedor';
  const cube = new THREE.BoxGeometry(1, 1, 1);
  const tube = new THREE.CylinderGeometry(1, 1, 1, 12);
  const materials = new Map();

  function material(color, opacity = 1) {
    const key = color + '/' + opacity;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({
      color, opacity, transparent: opacity < 1, depthWrite: opacity === 1, roughness: .82,
    }));
    return materials.get(key);
  }
  function mesh(name, geometry, color, x, y, z, w, h, d, opacity = 1) {
    const object = new THREE.Mesh(geometry, material(color, opacity));
    object.name = name;
    object.position.set(x, y, z);
    object.scale.set(w, h, d);
    object.castShadow = opacity === 1;
    object.receiveShadow = true;
    group.add(object);
    return object;
  }
  function box(name, color, x, y, z, w, h, d, opacity) {
    return mesh(name, cube, color, x, y, z, w, h, d, opacity);
  }
  function cylinder(name, color, x, y, z, radius, height) {
    return mesh(name, tube, color, x, y, z, radius, height, radius);
  }

  const terracotta = '#ab583d', ochre = '#c7a36b', brown = '#70544b', concrete = '#c3b9a7';
  const aluminum = '#a1a7a3', dark = '#303332', orange = '#c65b32';
  box('Piso del comedor', ochre, 0, -.16, 0, 17.4, .32, 13.6);
  // Dos áreas oscuras de mesas, cruzadas por circulaciones y rematadas en terracota.
  for (const x of [-5.35, .8]) {
    box('Paño marrón del comedor', brown, x, .009, .7, 4.7, .018, 8.75);
    for (const side of [-1, 1]) {
      box('Banda longitudinal terracota', terracotta, x + side * 2.49, .009, .7, .28, .018, 9.31);
      box('Banda transversal terracota', terracotta, x, .009, .7 + side * 4.515, 4.7, .018, .28);
    }
  }
  box('Banda al mostrador', terracotta, 6.47, .009, 5.08, 4.3, .018, .38);
  box('Piso detrás del cancel', '#79655b', 0, .009, -5.62, 17.15, .018, 2.14);
  for (let i = 0; i < 19; i++) {
    box('Junta del piso junto al cancel', '#5f5149', -8.25 + i * .915, .02, -5.62, .018, .004, 2.14);
  }
  box('Junta transversal del piso junto al cancel', '#5f5149', 0, .024, -5.62, 17.15, .004, .02);
  box('Muro alto de fondo', concrete, 0, 2.22, -6.75, 17.4, 4.44, .24);
  box('Muro lateral bajo plafón', '#c3ad94', -8.6, 1.75, -.7, .22, 3.5, 12.1);
  box('Friso bajo del muro lateral', '#ddd1b7', -8.48, .09, -.7, .045, .18, 12.1);

  for (const [x, z] of [[-7.75, -4.45], [-3.37, -4.45], [3.13, -4.45], [7.75, -4.45], [-3.37, 1.9], [3.13, 1.9]]) {
    box('Columna de sección cuadrada', '#bfaa90', x, 1.76, z, .4, 3.52, .46);
    box('Zócalo claro de columna', '#ddd1b7', x, .075, z, .46, .15, .52);
  }

  const glazingZ = -4.45;
  const bayWidth = 1.42;
  const bays = 12;
  for (let i = 0; i < bays; i++) {
    const x = (i + .5 - bays / 2) * bayWidth;
    const door = i === 5 || i === 6;
    box(door ? 'Hoja acristalada del cancel interior' : 'Paño acristalado', '#aec3b9', x, 1.46, glazingZ, bayWidth - .075, 2.65, .045, .19);
    box('Franja naranja del cancel', orange, x, 1.31, glazingZ + .031, bayWidth - .075, .19, .016);
    box('Travesaño inferior del cancel', aluminum, x, 1.06, glazingZ, bayWidth - .045, .045, .09);
    box('Travesaño alto del cancel', aluminum, x, 2.23, glazingZ, bayWidth - .045, .045, .09);
    box('Montante del cancel', aluminum, x - bayWidth / 2, 1.46, glazingZ, .06, 2.75, .09);
    if (door) {
      box('Perfil de la hoja', aluminum, x + Math.sign(x) * .025, 1.46, glazingZ + .065, .04, 2.66, .04);
      box('Tirador del cancel interior', dark, x - Math.sign(x) * .47, 1.11, glazingZ + .095, .04, .27, .075);
    }
  }
  box('Montante extremo del cancel', aluminum, bays * bayWidth / 2, 1.46, glazingZ, .06, 2.75, .09);
  box('Cabezal del cancel', aluminum, 0, 2.83, glazingZ, 17.1, .09, .12);
  box('Umbral del cancel', '#81786b', 0, .032, glazingZ, 17.1, .064, .115);

  // Solo se cubre el fondo del corte para poder ver el comedor desde la cámara existente.
  for (const x of [-6.03, -2.03, 1.97]) {
    for (const z of [-3.62, -1.64]) {
      box('Retícula del plafón suspendido', '#777c78', x, 3.45, z, 3.12, .03, 1.35, .68);
      for (const side of [-1, 1]) {
        box('Perfil longitudinal de la retícula', aluminum, x, 3.446, z + side * .675, 3.19, .075, .044);
        box('Perfil transversal de la retícula', aluminum, x + side * 1.56, 3.446, z, .044, .075, 1.35);
      }
    }
  }
  for (const z of [-3.05, -1.1]) {
    cylinder('Ducto metálico del comedor', '#9da5a1', -1.93, 3.49, z, .135, 12.38).rotation.z = Math.PI / 2;
    for (let i = 0; i < 24; i++) {
      cylinder('Junta del ducto', '#7f8885', -7.75 + i * .5, 3.49, z, .14, .024).rotation.z = Math.PI / 2;
    }
    for (const x of [-6.03, -2.03, 1.97]) {
      box('Luminaria lineal', '#f5ecd2', x, 3.51, z - .22, 3.83, .04, .18);
      cylinder('Difusor redondo de ventilación', '#c6c1b6', x, 3.3, z, .22, .072);
      cylinder('Centro del difusor', '#777d7b', x, 3.26, z, .15, .025);
    }
  }

  // Galería de 2017. Vista parcial de la celosía desde el cancel.
  const trussColor = '#973e34';
  const trussBays = 8, trussWidth = 17.2;
  const trussPoint = (i, row) => [
    (i / trussBays - .5) * trussWidth,
    4.56 + row * .38,
    -3.14 - row * 1.65,
  ];
  function strut(name, start, end) {
    const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
    const delta = b.clone().sub(a);
    const member = box(name, trussColor, ...a.clone().lerp(b, .5), .062, delta.length(), .062);
    member.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
  }
  for (let row = 0; row < 3; row++) {
    strut('Cordón de la celosía de J', trussPoint(0, row), trussPoint(trussBays, row));
    if (row === 2) continue;
    for (let i = 0; i <= trussBays; i++) {
      strut('Montante de la celosía de J', trussPoint(i, row), trussPoint(i, row + 1));
      if (i < trussBays) strut('Diagonal de la celosía de J', trussPoint(i, row), trussPoint(i + 1, row + 1));
    }
  }
  const globe = new THREE.SphereGeometry(1, 12, 8);
  for (const x of [-5.4, 0, 5.4]) {
    box('Suspensión del globo', aluminum, x, 4.47, -5.35, .023, .69, .023);
    mesh('Luminaria esférica bajo la celosía', globe, '#f1ece1', x, 4.05, -5.35, .23, .23, .23);
  }

  const chairs = new Map();
  function chairPart(name, color, x, y, z, w, h, d) {
    if (!chairs.has(name)) chairs.set(name, {color, matrices: []});
    const matrix = new THREE.Matrix4().makeScale(w, h, d).setPosition(x, y, z);
    chairs.get(name).matrices.push(matrix);
  }
  for (const x of [-6.45, -4.28, -.34, 1.87]) for (const z of [-2.35, .75, 3.97]) {
    box('Tablero claro de mesa', '#e4e0d4', x, .79, z, 1.65, .054, .9);
    box('Canto oscuro de mesa', dark, x, .752, z, 1.64, .04, .895);
    for (const dx of [-.72, .72]) for (const dz of [-.36, .36]) {
      box('Pata de mesa', dark, x + dx, .367, z + dz, .045, .734, .045);
    }
    for (const side of [-1, 1]) for (const dx of [-.43, .43]) {
      const seatX = x + dx;
      const seatZ = z + side * .71;
      chairPart('Bastidor de silla', dark, seatX, .413, seatZ, .415, .055, .4);
      chairPart('Asiento rojo de silla', '#8f382d', seatX, .454, seatZ, .4, .042, .39);
      for (const leg of [-1, 1]) {
        chairPart('Pata delantera de silla', dark, seatX + leg * .18, .205, seatZ - side * .168, .039, .41, .039);
        chairPart('Pata y montante trasero de silla', dark, seatX + leg * .18, .43, seatZ + side * .169, .039, .86, .039);
      }
      for (const y of [.62, .724, .832]) {
        chairPart('Travesaño abierto del respaldo', dark, seatX, y, seatZ + side * .17, .36, .047, .047);
      }
    }
  }

  // Se agrupan las piezas repetidas de las sillas en cinco objetos de render.
  for (const [name, {color, matrices}] of chairs) {
    const parts = new THREE.InstancedMesh(cube, material(color), matrices.length);
    parts.name = name;
    matrices.forEach((matrix, index) => parts.setMatrixAt(index, matrix));
    parts.instanceMatrix.needsUpdate = true;
    parts.castShadow = true;
    parts.receiveShadow = true;
    group.add(parts);
  }

  const counterX = 7.22;
  box('Base del mostrador', '#8e928d', counterX, .52, -.48, 1.55, 1.04, 9.1);
  box('Mostrador de acero inoxidable', '#bbc0bc', counterX, 1.08, -.48, 1.73, .13, 9.25);
  box('Zócalo oscuro del mostrador', dark, 6.43, .08, -.48, .054, .16, 9.04);
  for (const z of [-4.22, -2.68, -1.14, .4, 1.94, 3.48]) {
    box('Paño de acero del mostrador', '#a5aca7', 6.43, .59, z, .044, .86, 1.48);
  }
  for (const z of [-3.42, -.52, 2.38]) {
    box('Protección acristalada de servicio', '#aec5b9', 6.73, 1.44, z, .036, .53, 2.76, .24);
    box('Perfil superior de la protección', aluminum, 6.73, 1.72, z, .044, .043, 2.83);
    box('Soporte de la protección', aluminum, 6.73, 1.43, z - 1.41, .06, .56, .053);
  }
  box('Soporte final de la protección', aluminum, 6.73, 1.43, 3.79, .06, .56, .053);
  for (const z of [-4.6, -2.6, -.6, 1.4, 3.4]) {
    cylinder('Poste de la fila', dark, 4.38, .52, z, .043, 1.04);
    cylinder('Base del poste', dark, 4.38, .034, z, .112, .068);
  }
  for (const y of [.42, .75, 1.02]) box('Pasamanos de la fila', dark, 4.38, y, -.6, .067, .067, 8.12);
  for (const z of [-2.6, -2, -1.4]) {
    for (let i = 0; i < 5; i++) box('Charola apilada', '#943d37', 7.05, 1.16 + i * .029, z, .46, .02, .39);
  }

  return {
    group,
    target: [0, 1.15, -.65],
    camera: [17, 14, 23],
    etiquetas: [
      {texto: 'Comedor', posicion: [-3.15, .91, 3.8]},
      {texto: 'Fila de servicio', posicion: [5.8, 1.23, .6]},
      {texto: 'Cancel con franja naranja', posicion: [-3.25, 2.8, -4.45]},
    ],
  };
}
