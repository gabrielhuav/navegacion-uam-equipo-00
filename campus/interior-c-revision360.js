// Escalera (2:08) y galería alta (2:31–2:48) del edificio C, reunidas en un corte.
// El recorrido permite reconocer sus acabados y su relación con el jardín.
export function crearInteriorEscalerasC(THREE) {
  const group = new THREE.Group();
  group.name = 'Interior_C_Escaleras_y_galeria_360';
  group.userData = {
    approximate: true,
    visualOnly: true,
    reference: [
      'https://www.youtube.com/watch?v=rU-4eFuBX2g&t=128s',
      'https://www.youtube.com/watch?v=rU-4eFuBX2g&t=145s',
      'https://www.youtube.com/watch?v=rU-4eFuBX2g&t=151s',
    ],
  };
  const cubo = new THREE.BoxGeometry();
  const tubo = new THREE.CylinderGeometry(1, 1, 1, 12);
  const maceta = new THREE.CylinderGeometry(1, .73, 1, 14);
  const hoja = new THREE.SphereGeometry(1, 9, 6);
  const materiales = new Map();
  const ejeY = new THREE.Vector3(0, 1, 0);

  function pieza(padre, nombre, geometria, color, posicion, escala, opacidad = 1) {
    const clave = color + '/' + opacidad;
    if (!materiales.has(clave)) {
      materiales.set(clave, new THREE.MeshStandardMaterial({
        color, opacity: opacidad, transparent: opacidad < 1, depthWrite: opacidad === 1,
        roughness: opacidad === 1 ? .87 : .3,
      }));
    }
    const malla = new THREE.Mesh(geometria, materiales.get(clave));
    malla.name = nombre;
    malla.position.set(...posicion);
    malla.scale.set(...escala);
    malla.receiveShadow = opacidad === 1;
    padre.add(malla);
    return malla;
  }

  function caja(padre, nombre, color, x, y, z, ancho, alto, fondo, opacidad) {
    return pieza(padre, nombre, cubo, color, [x, y, z], [ancho, alto, fondo], opacidad);
  }

  function barra(padre, nombre, color, inicio, fin, radio) {
    const a = new THREE.Vector3(...inicio);
    const b = new THREE.Vector3(...fin);
    const delta = b.clone().sub(a);
    const malla = pieza(padre, nombre, tubo, color, a.lerp(b, .5).toArray(), [radio, delta.length(), radio]);
    malla.quaternion.setFromUnitVectors(ejeY, delta.normalize());
  }

  const escalera = new THREE.Group();
  escalera.name = 'C_escalera_y_descanso';
  group.add(escalera);
  const galeria = new THREE.Group();
  galeria.name = 'C_galeria_alta_hacia_jardin';
  group.add(galeria);

  const concreto = '#b9b6a8', claro = '#cecdc2', plafon = '#e0dfd5';
  const marco = '#3e4b46', panelRojo = '#974c46', junta = '#8e766b';
  const gradas = 15, alzado = .18, huella = .285, alto = gradas * alzado;
  const frente = gradas * huella, ancho = 3.16, anchoMedio = ancho / 2;
  const borde = anchoMedio + .105;
  const tonos = ['#b77f71', '#bf8877', '#b88377', '#c28b7e'];
  caja(escalera, 'C_piso_inferior_escalera', '#bb9a87', 0, -.125, frente + .79, 3.7, .25, 1.59);
  for (let i = 0; i < gradas; i++) {
    const nivel = (i + 1) * alzado;
    const z = frente - (i + .5) * huella;
    const coronacion = nivel - .034;
    caja(escalera, 'C_peldano_de_concreto', concreto, 0, (coronacion - .22) / 2, z, ancho, coronacion + .22, huella);
    for (let loseta = 0; loseta < 9; loseta++) {
      const modulo = ancho / 9, x = (loseta + .5) * modulo - anchoMedio;
      caja(escalera, 'C_huella_de_loseta_rosa', tonos[(loseta * 3 + i * 5) % tonos.length],
        x, nivel - .017, z, modulo - .008, .034, huella - .006);
    }
    caja(escalera, 'C_canto_de_peldano', junta, 0, nivel - .049, z + huella / 2 - .008, ancho, .028, .018);
  }

  for (const lado of [-1, 1]) {
    const x = lado * borde;
    // El corte conserva el muro macizo por debajo del pasamanos y aligera su remate.
    const perfil = new THREE.Shape();
    perfil.moveTo(frente, -.22);
    perfil.lineTo(0, -.22);
    perfil.lineTo(0, alto + (lado < 0 ? 1.12 : 1.4));
    perfil.lineTo(frente, lado < 0 ? 1.12 : 1.4);
    perfil.closePath();
    const muro = pieza(escalera, 'C_muro_solido_lateral_de_la_escalera',
      new THREE.ExtrudeGeometry(perfil, {depth: .21, bevelEnabled: false}), claro,
      [x + .105, 0, 0], [1, 1, 1]);
    muro.rotation.y = -Math.PI / 2;
    const xBarra = lado * (anchoMedio - .14);
    const color = lado < 0 ? '#863f45' : '#53504d';
    barra(escalera, 'C_pasamanos_tubular_de_escalera', color,
      [xBarra, .87, frente - .02], [xBarra, alto + .87, .02], .035);
    for (const t of [.09, .29, .50, .71, .92]) {
      const y = .82 + alto * t, z = frente * (1 - t);
      barra(escalera, 'C_soporte_de_pasamanos', color, [lado * anchoMedio, y, z], [xBarra, y + .055, z], .016);
      caja(escalera, 'C_placa_de_anclaje_del_pasamanos', color, lado * (anchoMedio - .006), y, z, .019, .077, .054);
    }
  }

  const principio = .01, fondo = -11.8, largo = principio - fondo, medio = (principio + fondo) / 2;
  const yTecho = alto + 2.76, xCancel = 1.72, xJardin = -1.77;
  caja(galeria, 'C_losa_de_descanso_y_galeria', '#bbb9ad', 0, alto - .113, medio, 3.7, .226, largo);
  caja(galeria, 'C_piso_claro_de_galeria', '#c4c2b6', 0, alto + .008, medio, 3.33, .016, largo - .015);
  for (const z of [-.83, -1.89, -3.32, -4.76, -6.2, -7.64, -9.08, -10.5]) {
    caja(galeria, 'C_junta_discreta_de_piso', '#b2b0a4', 0, alto + .018, z, 3.3, .004, .014);
  }
  caja(galeria, 'C_antepecho_continuo_hacia_jardin', concreto, xJardin, alto + .49, medio, .23, .98, largo);
  caja(galeria, 'C_coronacion_del_antepecho_de_concreto', claro, xJardin, alto + 1.009, medio, .29, .058, largo);
  caja(galeria, 'C_canto_blanco_de_plafon', '#d0cec3', xJardin, yTecho + .05, medio, .15, .19, largo);
  // Sección visible del plafón, del lado del cancel, para mantener abierto el corte.
  caja(galeria, 'C_plafon_blanco_de_galeria', plafon, .92, yTecho + .07, medio, 1.75, .14, largo);

  const modulos = 9, paso = largo / modulos;
  for (let i = 0; i < modulos; i++) {
    const z = principio - (i + .5) * paso;
    caja(galeria, 'C_zocalo_rojo_de_cancel', i % 3 ? panelRojo : '#a1534a',
      xCancel, alto + .45, z, .105, .9, paso - .053);
    caja(galeria, 'C_vidrio_de_galeria', '#9daaa0', xCancel, alto + 1.77, z, .038, 1.71, paso - .061, .36);
    caja(galeria, 'C_montante_de_cancel', marco, xCancel, alto + 1.37, principio - i * paso, .147, 2.74, .057);
    caja(galeria, 'C_travesano_sobre_el_zocalo', marco, xCancel, alto + .92, z, .143, .057, paso);
    caja(galeria, 'C_travesano_medio_del_cancel', marco, xCancel, alto + 1.9, z, .095, .038, paso);
    // Aparejo mate visible en 2:25 al lado de la escalera.
    if (i < 2) {
      for (const [y, desfase] of [[1.12, 0], [1.31, .14]]) {
        for (const dz of [-.41, -.075, .26]) {
          caja(galeria, 'C_rectangulo_esmerilado_del_cancel', '#dad9ca',
            xCancel - .023, alto + y, z + dz + desfase, .006, .105, .245);
        }
      }
    }
  }
  caja(galeria, 'C_montante_extremo_de_cancel', marco, xCancel, alto + 1.37, fondo, .147, 2.74, .057);
  caja(galeria, 'C_marco_continuo_superior_de_cancel', marco, xCancel, yTecho - .065, medio, .19, .107, largo);
  caja(galeria, 'C_superficie_interior_detras_del_cancel', '#c4c0b4', 2.09, alto - .07, medio, .77, .14, largo);
  caja(galeria, 'C_soporte_de_fluorescentes_en_sofito', plafon, .07, yTecho + .045, medio, .16, .09, largo);
  for (const z of [-1.48, -4.32, -7.16, -10.0]) {
    caja(galeria, 'C_perfil_de_luminaria_de_plafon', '#c4c7bb', .07, yTecho - .032, z, .13, .065, 1.36);
    for (const x of [.035, .105]) {
      caja(galeria, 'C_tubo_fluorescente_blanco', '#f3efdf', x, yTecho - .066, z, .026, .027, 1.28);
    }
  }

  // En 2:08 se distingue un paño oscuro colgante, sin texto legible.
  caja(escalera, 'C_barra_superior_del_pano_suspendido', '#57534e', 0, yTecho + .015, -.36, 2.44, .058, .058);
  caja(escalera, 'C_pano_suspendido_sin_rotulo', '#54504b', 0, yTecho - .225, -.36, 2.34, .415, .027);

  const verdes = ['#5e724b', '#728455', '#4f623e', '#41583a'];
  for (const [i, z] of [-3.45, -6.25, -9.09].entries()) {
    const x = xCancel - .31;
    pieza(galeria, 'C_maceta_junto_al_cancel', maceta, i === 1 ? '#a18065' : '#807060',
      [x, alto + .153, z], [.219, .30, .219]);
    pieza(galeria, 'C_tierra_de_maceta', tubo, '#514838', [x, alto + .294, z], [.195, .025, .195]);
    for (let rama = 0; rama < 6; rama++) {
      const angulo = rama * Math.PI / 3 + .47 * i;
      const dx = Math.cos(angulo) * .22, dz = Math.sin(angulo) * .24;
      const y = alto + .94 + (rama % 3) * .16;
      barra(galeria, 'C_tallo_de_planta', '#6e7650', [x, alto + .30, z], [x + dx, y, z + dz], .012);
      const punta = pieza(galeria, 'C_hoja_de_planta', hoja, verdes[(rama + i) % verdes.length],
        [x + dx, y, z + dz], [.083, .172, .043]);
      punta.rotation.set(.36 * Math.sin(angulo), angulo, .5 * Math.cos(angulo));
    }
  }
  // Copas parciales fuera del antepecho, como contexto del lado abierto de la galería.
  for (const [x, z, radio] of [[-3.15, -3.1, .94], [-3.87, -6.5, 1.19], [-3.28, -9.91, .84]]) {
    barra(galeria, 'C_tronco_del_jardin_en_corte', '#6f6652', [x, .2, z], [x, alto + .82, z], .115);
    for (const [dx, dz] of [[-.27, -.25], [.20, .28], [-.17, .34]]) {
      pieza(galeria, 'C_copa_del_jardin_en_corte', hoja, '#697f54',
        [x + dx, alto + .47, z + dz], [radio * .78, radio, radio * .78]);
    }
  }

  return {
    group,
    target: [-.18, alto * .8, -2.75],
    camera: [-8.4, 7.9, 14.1],
    etiquetas: [
      {texto: 'Escalera de loseta rosa', posicion: [0, 1.1, 2.68]},
      {texto: 'Galería alta hacia el jardín', posicion: [0, alto + 1.52, -6.4]},
    ],
  };
}
