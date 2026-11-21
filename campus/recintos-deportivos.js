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
