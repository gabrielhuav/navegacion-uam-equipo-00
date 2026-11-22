// Comedor de J, a partir de la galería «Ambiente» de Google Maps (jun. y oct. 2017).
// Sólo se representa la parte visible: comedor, cancelería y fila de servicio.
export function crearInteriorCafeteria(THREE) {
  const group = new THREE.Group();
  group.name = 'Interior_J_Comedor';
  const cube = new THREE.BoxGeometry(1, 1, 1);
  const materials = new Map();
  function box(name, color, x, y, z, w, h, d, opacity = 1) {
    const key = `${color}/${opacity}`;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({
      color, opacity, transparent: opacity < 1, depthWrite: opacity === 1, roughness: .82,
    }));
    const mesh = new THREE.Mesh(cube, materials.get(key));
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    mesh.castShadow = opacity === 1;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }
  const terracotta = '#aa654a', sand = '#c8a16d', concrete = '#c3b9a7';
  const metal = '#7f8886', dark = '#353635', orange = '#c64f1f';
  box('Piso del comedor', '#ae8870', 0, -.16, 0, 17.4, .32, 13.6);
  for (const x of [-5.4, -1.8, 1.8, 5.4]) {
    for (const z of [-4.8, -1.6, 1.6, 4.8]) {
      const warm = (Math.round(x / 1.8) + Math.round(z / 1.6)) % 4 === 2;
      box('Paño del pavimento', warm ? sand : terracotta, x, .014, z, 3.55, .02, 3.15);
    }
  }
  box('Muro alto de fondo', concrete, 0, 2.22, -6.75, 17.4, 4.44, .24);
  box('Muro lateral bajo plafón', '#be9584', -8.6, 1.75, -.7, .22, 3.5, 12.1);
  for (const x of [-7.7, -2.6, 2.6, 7.7]) box('Columna del comedor', terracotta, x, 1.75, -4.45, .42, 3.5, .54);
  for (let i = 0; i < 7; i++) {
    const x = -7.4 + 2.45 * i;
    box('Paño acristalado', '#a1b8ad', x, 1.46, -4.45, 2.36, 2.6, .06, .24);
    box('Franja naranja del cancel', orange, x, 1.32, -4.41, 2.36, .15, .04);
    box('Montante del cancel', metal, x - 1.2, 1.5, -4.45, .07, 2.75, .092);
  }
  box('Cabezal del cancel', metal, 0, 2.83, -4.45, 17.2, .09, .12);
  box('Plafón parcial del comedor', '#b9b6a7', -2.6, 3.41, -3.1, 12.1, .11, 3.25);
  for (const x of [-7, -4, -1, 2]) box('Luminaria lineal', '#f2e9c9', x, 3.34, -2.8, 1.5, .04, .22);
  // Galería de septiembre de 2017. Vista parcial de la cubierta de celosía desde el cancel.
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
  const globe = new THREE.SphereGeometry(.23, 12, 8);
  const globeMaterial = new THREE.MeshStandardMaterial({color:'#f1ece1', roughness:.68});
  for(const x of [-5.4, 0, 5.4]){
    box('Suspensión del globo', metal, x, 4.47, -5.35, .023, .69, .023);
    const lamp = new THREE.Mesh(globe, globeMaterial);
    lamp.name = 'Luminaria esférica bajo la celosía';
    lamp.position.set(x, 4.05, -5.35);
    group.add(lamp);
  }

  for (const x of [-6, -2.9, .25]) for (const z of [-2.4, .75, 3.95]) {
    box('Tablero de mesa', '#e2ded1', x, .8, z, 1.84, .09, 1.08);
    for (const dx of [-.73, .73]) for (const dz of [-.39, .39]) {
      box('Pata de mesa', dark, x + dx, .39, z + dz, .07, .78, .07);
    }
    for (const side of [-1, 1]) for (const dx of [-.47, .47]) {
      const seatZ = z + side * .93;
      box('Asiento terracota', terracotta, x + dx, .45, seatZ, .43, .08, .43);
      box('Respaldo oscuro', dark, x + dx, .69, seatZ + side * .2, .44, .49, .07);
      box('Soporte de asiento', dark, x + dx, .22, seatZ, .08, .44, .26);
    }
  }
  box('Base del mostrador', '#a55335', 7.22, .53, -.48, 1.55, 1.04, 9.1);
  box('Mostrador del servicio', '#a6afac', 7.2, 1.08, -.48, 1.73, .13, 9.25);
  for (const z of [-4.6, -2.6, -.6, 1.4, 3.4]) box('Poste de la fila', metal, 4.38, .52, z, .085, 1.04, .085);
  for (const y of [.42, .75, 1.02]) box('Pasamanos de la fila', metal, 4.38, y, -.6, .067, .067, 8.12);
  for (const z of [-2.6, -2, -1.4]) box('Pila de charolas', '#9e3430', 7.05, 1.22, z, .46, .17, .39);

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
