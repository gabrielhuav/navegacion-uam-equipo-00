// Corte de reconocimiento de la galería alta del edificio G hacia H.
// Recorrido en RV, 4:41 y 5:20. Proporciones y niveles ilustrativos.
export function crearInteriorPuenteG(THREE) {
  const group = new THREE.Group();
  group.name = 'Interior_G_pasillo_y_puente_hacia_H';
  group.userData = {
    approximate: true,
    visualOnly: true,
    reference: 'https://www.youtube.com/watch?v=rU-4eFuBX2g&t=281s',
    tramo: '4:41–5:20',
  };
  const materiales = new Map();
  const bloque = new THREE.BoxGeometry(1, 1, 1);
  const tubo = new THREE.CylinderGeometry(1, 1, 1, 10);
  const gris = '#9da39e';
  const soffit = '#efeee5';

  function material(color) {
    if (!materiales.has(color)) {
      materiales.set(color, new THREE.MeshStandardMaterial({color, roughness: .8}));
    }
    return materiales.get(color);
  }

  function caja(nombre, color, centro, medidas) {
    const pieza = new THREE.Mesh(bloque, material(color));
    pieza.name = nombre;
    pieza.position.set(...centro);
    pieza.scale.set(...medidas);
    pieza.receiveShadow = true;
    group.add(pieza);
    return pieza;
  }

  function tuberia(nombre, color, desde, hasta, radio) {
    const inicio = new THREE.Vector3(...desde);
    const fin = new THREE.Vector3(...hasta);
    const vector = fin.clone().sub(inicio);
    const pieza = new THREE.Mesh(tubo, material(color));
    pieza.name = nombre;
    pieza.position.copy(inicio).lerp(fin, .5);
    pieza.scale.set(radio, vector.length(), radio);
    pieza.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vector.normalize());
    group.add(pieza);
  }

  caja('G_losa_del_pasillo_y_puente', '#dfe1da', [0, -.11, -.48], [3.7, .22, 21.35]);
  caja('G_plafon_del_pasillo', soffit, [0, 3.17, 4.55], [3.79, .2, 11.5]);
  caja('G_plafon_del_puente', soffit, [0, 3.17, -5.55], [3.75, .2, 8.74]);
  caja('G_junta_en_el_cambio_de_solado', '#999b8e', [0, .003, -1.13], [3.24, .007, .094]);
  for (const z of [-9.75, -1.16, 5.37]) {
    caja('G_trabe_bajo_plafon', '#dfdfd7', [0, 2.99, z], [3.72, .25, .29]);
  }

  const tonos = ['#dbdcd2', '#d5d6cd', '#e1e1d8'];
  for (const lado of [-1, 1]) {
    const muro = lado * 1.76;
    caja('G_muro_interior_de_la_galeria', '#c2c4bc', [muro, 1.23, 4.49], [.22, 2.46, 11.35]);
    caja('G_zoclo_de_la_galeria', '#a8ada4', [muro - lado * .13, .083, 4.49], [.05, .166, 11.35]);
    for (let hilada = 0; hilada < 11; hilada++) {
      const inicio = -1.18 - (hilada % 2) * .41;
      for (let z = inicio; z < 10.15; z += .82) {
        const desde = Math.max(z, -1.18);
        const hasta = Math.min(z + .82, 10.15);
        caja('G_pieza_horizontal_clara_del_muro', tonos[(hilada + Math.round((z - inicio) / .82)) % tonos.length],
          [muro - lado * .125, .22 + hilada * .196, (desde + hasta) / 2],
          [.034, .182, hasta - desde - .012]);
      }
    }
    caja('G_antepecho_del_vano_alto', '#b7bbb2', [muro, 2.45, 4.49], [.24, .27, 11.35]);
    caja('G_vidrio_oscuro_del_vano_alto', '#525b57', [muro, 2.78, 4.49], [.1, .48, 11.35]);
    for (const y of [2.54, 2.77, 3.01]) {
      caja('G_marco_horizontal_del_vano_alto', '#c8ccc2', [muro - lado * .09, y, 4.49],
        [.045, .046, 11.35]);
    }
    for (let z = -.95; z < 10.18; z += 1.38) {
      caja('G_montante_de_ventila', '#b8bfb4', [muro - lado * .09, 2.78, z], [.051, .47, .048]);
    }

    caja('G_antepecho_continuo_del_puente', gris, [muro, .55, -5.49], [.24, 1.1, 8.65]);
    caja('G_coronacion_del_antepecho', '#d1d3c7', [muro, 1.115, -5.49], [.31, .046, 8.65]);
    caja('G_trabe_longitudinal_del_puente', '#a9aea7', [muro, 2.92, -5.49], [.26, .38, 8.65]);
    caja('G_losa_lateral_paralela', '#c8ccc3', [lado * 3.24, -.13, -5.49], [1.8, .26, 8.67]);
    caja('G_fondo_lateral_del_puente', '#bdc2ba', [lado * 4.15, 1.15, -5.49], [.16, 2.3, 8.67]);
    caja('G_hoja_roja_vista_desde_el_puente', '#96313f',
      [lado * 4.05, 1.1, lado === 1 ? -6.65 : -3.1], [.057, 2.16, .88]);
    caja('G_marco_de_hoja_roja', '#bbbeb5',
      [lado * 4.015, 2.20, lado === 1 ? -6.65 : -3.1], [.053, .07, 1]);
  }

  // Cañerías expuestas con desvío a la entrada del tramo abierto.
  for (let i = 0; i < 3; i++) {
    const x = .51 + i * .125;
    const y = 2.96 - i * .018;
    const puntos = [[x, y, 9.94], [x, y, .15], [x - .26, y, -.42], [x - .26, y, -8.74]];
    for (let j = 1; j < puntos.length; j++) {
      tuberia('G_conducto_electrico_del_plafon', '#828f86', puntos[j - 1], puntos[j], .021);
    }
    for (const z of [8.65, 5.84, 3.46, 1.28, -2.23, -5.77, -8.30]) {
      const ancla = z < 0 ? x - .26 : x;
      caja('G_abrazadera_del_conducto', '#6f7972', [ancla, y + .028, z], [.081, .055, .028]);
    }
  }
  for (const z of [8.94, 6.42, 3.6, 1.23, -3.2, -5.82, -8.22]) {
    const largo = z > 0 ? .86 : .27;
    caja('G_carcasa_fluorescente_suspendida', '#a1aba3', [0, 2.847, z], [.94, .09, largo]);
    for (const x of [-.30, 0, .30]) {
      caja('G_difusor_fluorescente', '#fffbeb', [x, 2.795, z], [.199, .017, largo - .045]);
      tuberia('G_tirante_de_luminaria', '#75827a', [x, 2.9, z], [x, 3.085, z], .012);
    }
  }

  // Plano abierto al fondo y arranque de escalera dentro del encuadre histórico.
  caja('G_umbral_del_descanso_al_fondo', '#afb5a9', [0, -.037, -10.48], [3.45, .08, 1.35]);
  caja('G_pilastra_del_descanso', '#bec3b9', [1.51, 1.43, -10.42], [.34, 2.86, .65]);
  for (let n = 0; n < 5; n++) {
    const alto = .16 * (n + 1);
    caja('G_peldano_en_el_descanso', '#a4ada4', [-.91, alto / 2, -10.41 - n * .29],
      [1.26, alto, .293]);
  }

  const placa = new THREE.Shape();
  placa.moveTo(-1.44, -.18);
  placa.lineTo(1.05, -.18);
  placa.quadraticCurveTo(1.43, -.18, 1.44, .18);
  placa.lineTo(-1.44, .18);
  placa.closePath();
  const cartel = new THREE.Mesh(new THREE.ShapeGeometry(placa), material('#843644'));
  cartel.name = 'G_senal_granate_hacia_el_edificio_H';
  cartel.position.set(0, 2.675, -2.13);
  group.add(cartel);
  for (const x of [-1.05, 1.02]) {
    tuberia('G_sujecion_de_la_senal', '#788279', [x, 2.84, -2.13], [x, 3.08, -2.13], .012);
  }

  // Texto en malla plana, disponible también al exportar sin un navegador.
  const glifos = {
    G: ['01111','10000','10000','10111','10001','10001','01111'],
    E: ['11111','10000','10000','11110','10000','10000','11111'],
    D: ['11110','10001','10001','10001','10001','10001','11110'],
    I: ['111','010','010','010','010','010','111'],
    F: ['11111','10000','10000','11110','10000','10000','10000'],
    C: ['01111','10000','10000','10000','10000','10000','01111'],
    O: ['01110','10001','10001','10001','10001','10001','01110'],
    H: ['10001','10001','10001','11111','10001','10001','10001'],
    '>': ['00100','00010','00001','11111','00001','00010','00100'],
  };
  function texto(nombre, frase, x, y, paso) {
    const vertices = [];
    for (const caracter of frase) {
      const filas = glifos[caracter];
      if (filas) {
        filas.forEach((fila, j) => Array.from(fila).forEach((marca, i) => {
          if (marca !== '1') return;
          const a = x + i * paso;
          const b = y - j * paso;
          const q = paso * .96;
          vertices.push(a,b-q,0,a+q,b-q,0,a+q,b,0,a,b-q,0,a+q,b,0,a,b,0);
        }));
      }
      x += (filas ? filas[0].length + 1 : 4) * paso;
    }
    const geometria = new THREE.BufferGeometry();
    geometria.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometria.computeVertexNormals();
    const rotulo = new THREE.Mesh(geometria, material('#f4e5d5'));
    rotulo.name = nombre;
    rotulo.position.z = .003;
    cartel.add(rotulo);
  }
  texto('G_letra_del_edificio', 'G', -1.30, .114, .031);
  texto('G_direccion_edificio_H', 'EDIFICIO H >', -.27, .06, .019);

  return {
    group,
    camera: [.12, 2.48, 10.82],
    target: [0, 1.31, -4.0],
    etiquetas: [],
  };
}
