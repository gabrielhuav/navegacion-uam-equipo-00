// Parque frente a M: revista Aleph, 6 de octubre de 2016, y ortofoto Esri de 2025.
// Se dibuja la parte despejada del césped y se dejan libres los andadores del croquis.
export const contornoGimnasioExteriorM = [
  [1211, 571], [1221, 569], [1246, 569], [1256, 574],
  [1258, 604], [1251, 606], [1223, 605], [1212, 594]
];

export function construirGimnasioExteriorM({THREE, world, meshPoly, box, material, X, Z}) {
  const parque = new THREE.Group();
  parque.name = 'Gimnasio_exterior_frente_a_M';
  parque.userData = {
    title: 'Gimnasio al aire libre · M', approximate: true,
    reference: 'Aleph UAM, 2016-10-06; cinco puntos visibles en Esri, 2025-01-30'
  };
  world.add(parque);
  const alturaCesped = .325;
  meshPoly(parque, contornoGimnasioExteriorM, alturaCesped, '#8b9b62', 'Cesped_gimnasio_urbano_M');
  meshPoly(parque, [[1211,586.6],[1258,586.6],[1258,593.4],[1211,593.4]],
    .331, '#d5cbb1', 'Andador_transversal_gimnasio_M');

  const verde = '#39816c', marfil = '#d9d7ad', soporte = '#9f9b82';
  const eje = new THREE.Vector3(0, 1, 0);
  function tubo(grupo, desde, hasta, color, radio = .034) {
    const origen = new THREE.Vector3(...desde);
    const flecha = new THREE.Vector3(...hasta).sub(origen);
    const largo = flecha.length();
    const forma = new THREE.CylinderGeometry(radio, radio, largo, 10);
    const pieza = new THREE.Mesh(forma, material(color));
    pieza.name = 'Tubo_de_aparato';
    pieza.position.copy(origen).addScaledVector(flecha, .5);
    pieza.quaternion.setFromUnitVectors(eje, flecha.divideScalar(largo));
    grupo.add(pieza);
  }

  // Los puntos vienen de la imagen aérea. Los tipos son ejemplos de las fotos de la UAM.
  function aparato(nombre, [x, z], giro) {
    const g = new THREE.Group();
    g.name = nombre;
    g.position.set(X(x), alturaCesped, Z(z));
    g.rotation.y = giro;
    parque.add(g);
    for (const lateral of [-.44, .44]) box(g, 'Plinto_aparato', lateral, .03, 0, .37, .06, 1.01, soporte);
    return g;
  }

  const ruedas = aparato('Aparato_de_ruedas', [1237, 597], .30);
  tubo(ruedas, [0, .05, 0], [0, 1.68, 0], verde, .06);
  tubo(ruedas, [-.49, 1.43, -.02], [.49, 1.43, -.02], verde);
  for (const x of [-.42, .42]) {
    const aro = new THREE.Mesh(new THREE.TorusGeometry(.29, .025, 8, 24), material(marfil));
    aro.name = 'Aro_de_ejercicio';
    aro.rotation.x = -.54;
    aro.position.set(x, 1.43, .11);
    ruedas.add(aro);
    tubo(ruedas, [x, 1.17, .24], [x, 1.69, -.03], marfil, .022);
  }

  const eliptica = aparato('Aparato_eliptico', [1248, 601], -.54);
  tubo(eliptica, [0, .06, -.13], [0, 1.15, -.13], verde, .065);
  for (const x of [-.26, .26]) {
    tubo(eliptica, [x, .28, .46], [x, 1.42, -.33], marfil);
    tubo(eliptica, [x, 1.42, -.33], [x, 1.59, -.48], marfil);
    box(eliptica, 'Pedal_eliptica', x, .25, .33, .19, .07, .43, marfil);
  }

  const caminadora = aparato('Aparato_de_pendulos', [1226, 578], -.68);
  for (const x of [-.46, .46]) {
    tubo(caminadora, [x, .04, 0], [x, 1.46, 0], verde, .051);
    tubo(caminadora, [x * .48, 1.39, .02], [x * .48, .27, .10], marfil);
    box(caminadora, 'Pedal_pendulo', x * .48, .27, .16, .20, .07, .36, marfil);
  }
  tubo(caminadora, [-.46, 1.49, 0], [.46, 1.49, 0], marfil);

  const remo = aparato('Aparato_de_remo', [1240, 582], 1.0);
  tubo(remo, [0, .08, -.53], [0, .54, -.44], verde, .058);
  tubo(remo, [0, .08, .36], [0, .58, .28], verde, .058);
  tubo(remo, [0, .28, -.37], [0, .7, .21], marfil, .042);
  tubo(remo, [-.28, .73, .18], [.28, .73, .18], marfil);
  box(remo, 'Asiento_remo', 0, .53, -.28, .37, .09, .40, marfil);
  const mult = aparato('Aparato_multifuncional', [1248, 583], -.44);
  for (const x of [-.40, .40]) {
    tubo(mult, [x, .05, -.24], [x, 1.57, -.24], verde, .049);
    tubo(mult, [x, 1.57, -.24], [x, 1.57, .36], verde);
    tubo(mult, [x, .84, -.24], [x, .84, .40], marfil);
  }
  tubo(mult, [-.40, 1.57, .36], [.40, 1.57, .36], verde);
  box(mult, 'Asiento_multifuncional', 0, .53, .12, .39, .085, .42, marfil);
  return parque;
}

export function construirFachadaM({THREE, part, w, d, h, box, material}) {
  const fachada = new THREE.Group();
  fachada.name = 'M_fachada_esquina_gimnasio_exterior';
  fachada.userData = {
    approximate: true,
    reference: 'Corpus UAM-A 0077 y 0078; ortofoto Esri; Aleph UAM, octubre de 2016'
  };
  part.add(fachada);

  const lado = w / 2, frente = -d / 2, fondo = d / 2;
  const muro = '#a5aaa6', rojo = '#a34b3c', aluminio = '#c6c9bf';
  const fascia = 1.34, dintel = h - fascia;
  box(fachada, 'M_cuerpo_de_concreto', -.10, h / 2, 0, w - .20, h, d, muro);
  box(fachada, 'M_azotea', 0, h + .20, 0, w + .25, .40, d + .25, '#d2d0c5');

  for (const signo of [-1, 1]) {
    box(fachada, 'M_pretil_terracota_largo', 0, h - .26, signo * fondo, w, 2.17, .24, rojo);
    box(fachada, 'M_pretil_terracota_corto', signo * lado, h - .26, 0, .24, 2.17, d, rojo);
    for (const [altura, color] of [[.135, '#42463f'], [.064, '#c8c4ad'], [-.014, '#4d5048']]) {
      box(fachada, 'M_moldura_continua_del_pretil', 0, dintel + altura, signo * (fondo + .115), w + .21, .042, .045, color);
      box(fachada, 'M_moldura_de_esquina', signo * (lado + .115), dintel + altura, 0, .045, .042, d + .21, color);
    }
  }

  // Los dos canceles de la toma frontal quedan separados por una pilastra de concreto.
  const puertaAncho = 2.32, puertaAlto = 2.48;
  const huecos = [
    {z: -1.50, vidrio: '#4b584e'},
    {z: 1.55, vidrio: '#596660'}
  ];
  let borde = frente;
  for (const {z, vidrio} of huecos) {
    const inicio = z - puertaAncho / 2, fin = z + puertaAncho / 2;
    box(fachada, 'M_paño_de_cemento_costado', lado - .12, dintel / 2, (borde + inicio) / 2,
      .24, dintel, inicio - borde, muro);
    box(fachada, 'M_dintel_de_cancel', lado - .12, (dintel + puertaAlto) / 2, z,
      .24, dintel - puertaAlto, puertaAncho, muro);
    for (const signo of [-1, 1]) {
      box(fachada, 'M_hoja_acristalada', lado - .092, (puertaAlto + .19) / 2, z + signo * .55,
        .055, puertaAlto - .24, 1.04, vidrio);
      box(fachada, 'M_perfil_lateral_de_cancel', lado - .035, (puertaAlto + .12) / 2, z + signo * 1.13,
        .074, puertaAlto - .10, .055, aluminio);
      box(fachada, 'M_tirador_del_cancel', lado + .025, 1.18, z + signo * .14, .088, .20, .033, '#b9bdb0');
    }
    box(fachada, 'M_montante_central_de_cancel', lado - .026, (puertaAlto + .12) / 2, z,
      .093, puertaAlto - .10, .064, aluminio);
    for (const y of [.17, puertaAlto - .035])
      box(fachada, 'M_travesaño_de_cancel', lado - .035, y, z, .080, .055, puertaAncho, aluminio);
    borde = fin;
  }
  box(fachada, 'M_paño_de_cemento_costado', lado - .12, dintel / 2, (borde + fondo) / 2,
    .24, dintel, fondo - borde, muro);
  box(fachada, 'M_visera_de_acceso', lado + .15, puertaAlto + .14, 1.55, .69, .064, 2.61, '#6f7066');

  // Los paños altos y la rejilla saliente se ven al dar vuelta hacia el parque.
  const altoCelosia = .86, yCelosia = dintel - .57;
  const paños = 8, paso = Math.min(4.2, w * .09);
  const extremo = lado - .23, centroPaño = extremo - paso / 2;
  for (let i = 0; i < paños; i++) {
    const x = centroPaño - i * paso;
    box(fachada, 'M_fondo_de_celosia_alta', x, yCelosia, frente - .017, paso - .12, altoCelosia, .040, '#67695b');
    for (let fila = 0; fila < 7; fila++) {
      const y = yCelosia - altoCelosia / 2 + .07 + fila * .119;
      box(fachada, 'M_lama_de_celosia_alta', x, y, frente - .042, paso - .16, .034, .031, '#777969');
    }
    box(fachada, 'M_marco_vertical_alto', x + paso / 2 - .060, yCelosia, frente - .045, .071, altoCelosia + .045, .040, aluminio);
  }
  const rejilla = lado - 2.23;
  box(fachada, 'M_fondo_rejilla_saliente', rejilla, 3.34, frente - .045, 2.95, .92, .091, '#7d847b');
  for (let fila = 0; fila < 7; fila++)
    box(fachada, 'M_lama_rejilla_saliente', rejilla, 2.99 + fila * .116, frente - .108, 2.87, .033, .043, aluminio);
  for (const x of [rejilla - 1.46, rejilla, rejilla + 1.46])
    box(fachada, 'M_montante_rejilla_saliente', x, 3.34, frente - .135, .047, .94, .043, aluminio);
  for (const y of [2.887, 3.793])
    box(fachada, 'M_borde_rejilla_saliente', rejilla, y, frente - .135, 2.97, .05, .043, aluminio);

  // La bajante blanca forma dos codos y un tramo vertical junto al vértice.
  const xBajante = lado - .42;
  const cotas = [[0, .31, -.21], [0, .54, -.13], [0, 4.06, -.13], [-.07, 4.34, -.14], [-.24, 4.37, -.05]];
  const curva = new THREE.CatmullRomCurve3(cotas.map(([x, y, z]) => new THREE.Vector3(xBajante + x, y, frente + z)));
  const tubo = new THREE.Mesh(new THREE.TubeGeometry(curva, 30, .067, 8), material('#d7d8ce'));
  tubo.name = 'M_bajante_blanca_con_codos';
  fachada.add(tubo);
  for (const y of [1.24, 3.01]) {
    const abrazadera = new THREE.Mesh(new THREE.CylinderGeometry(.077, .077, .05, 10), material('#a9aaa0'));
    abrazadera.name = 'M_abrazadera_bajante';
    abrazadera.position.set(xBajante, y, frente - .13);
    fachada.add(abrazadera);
  }

  // Se conservan el tratamiento esquemático de la cara opuesta y su llegada.
  for (const y of [2, h - 1.3]) {
    box(fachada, 'M_ventana_cara_opuesta', 0, y, fondo + .026, w - 1, 1.15, .10, '#425f61');
    for (let x = -lado + 3; x < lado - 1; x += 3)
      box(fachada, 'M_montante_cara_opuesta', x, y, fondo + .083, .11, 1.20, .075, aluminio);
  }
  const acceso = -w * .18;
  box(fachada, 'M_acceso_acristalado', acceso, 1.45, fondo + .08, 4.8, 2.50, .16, '#384d52');
  const rampa = box(fachada, 'M_rampa_acceso', acceso, .18, fondo + 1.5, 3.6, .22, 2.8, '#c4c2b6');
  rampa.rotation.x = -.05;
  for (const signo of [-1, 1])
    box(fachada, 'M_barandal_rampa', acceso + signo * 1.65, .58, fondo + 1.5, .08, .75, 2.60, '#b8292f');
  return fachada;
}
