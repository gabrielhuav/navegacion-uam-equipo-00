// EAE 13 y recorrido CyAD de 2024. Ancla aproximada en el jardín entre E y G.
export const anclaPrimavera = [588, 465];

export function crearEsculturaPrimavera({THREE, material, X, Z}) {
  const grupo = new THREE.Group();
  grupo.name = 'Primavera_jardin_E_G';
  grupo.position.set(X(anclaPrimavera[0]), .335, Z(anclaPrimavera[1]));
  grupo.rotation.y = -.2;
  grupo.userData = {
    approximate: true,
    artist: 'Kiyoto Ota',
    catalogId: 'EAE 13',
    dimensions: [2.7, 3.4, .9],
    reference: 'Elogio al espacio (UAM-A, 2012), pp. 32, 145 y 150–153 impresas; recorrido CyAD (2024)',
  };

  // Cinco lóbulos anchos de acero y un solo hueco con vistas a través de la obra.
  const perfil = new THREE.Shape();
  perfil.moveTo(-1.06, 1.35);
  perfil.bezierCurveTo(-1.78, 1.45, -1.53, 2.28, -.95, 2.39);
  perfil.bezierCurveTo(-.64, 2.47, -.89, 2.70, -.78, 3.02);
  perfil.bezierCurveTo(-.62, 3.58, .21, 3.62, .35, 3.00);
  perfil.bezierCurveTo(.45, 2.66, .25, 2.40, .47, 2.41);
  perfil.bezierCurveTo(.61, 2.42, .81, 2.67, 1.15, 2.52);
  perfil.bezierCurveTo(1.70, 2.32, 1.60, 1.75, 1.25, 1.50);
  perfil.bezierCurveTo(.98, 1.27, 1.17, 1.00, 1.32, .84);
  perfil.bezierCurveTo(1.80, .35, 1.24, -.18, .76, -.02);
  perfil.bezierCurveTo(.52, .06, .45, .22, .32, .36);
  perfil.bezierCurveTo(.19, .20, -.05, -.06, -.29, -.07);
  perfil.bezierCurveTo(-.85, -.12, -1.24, .40, -.86, .80);
  perfil.bezierCurveTo(-.62, 1.04, -.57, 1.31, -1.06, 1.35);
  perfil.closePath();

  const hueco = new THREE.Path();
  hueco.moveTo(-.99, 1.64);
  hueco.bezierCurveTo(-1.35, 1.64, -1.32, 2.07, -.91, 2.08);
  hueco.bezierCurveTo(-.39, 2.09, -.42, 2.49, -.51, 2.78);
  hueco.bezierCurveTo(-.60, 3.19, -.02, 3.31, .05, 2.92);
  hueco.bezierCurveTo(.10, 2.61, -.04, 2.17, .34, 2.12);
  hueco.bezierCurveTo(.65, 2.06, .90, 2.37, 1.10, 2.21);
  hueco.bezierCurveTo(1.34, 2.03, 1.07, 1.75, .92, 1.61);
  hueco.bezierCurveTo(.62, 1.31, .75, .98, 1.04, .63);
  hueco.bezierCurveTo(1.34, .24, .85, .10, .63, .39);
  hueco.bezierCurveTo(.42, .67, .37, .78, .19, .63);
  hueco.bezierCurveTo(-.06, .42, -.37, .09, -.61, .31);
  hueco.bezierCurveTo(-.93, .61, -.36, .83, -.44, 1.24);
  hueco.bezierCurveTo(-.51, 1.54, -.71, 1.60, -.99, 1.64);
  hueco.closePath();
  perfil.holes.push(hueco);

  const forma = new THREE.ExtrudeGeometry(perfil, {depth: .9, curveSegments: 6, bevelEnabled: false});
  forma.computeBoundingBox();
  const {min, max} = forma.boundingBox;
  forma.translate(-(min.x + max.x) / 2, -min.y, -.45);
  forma.scale(2.7 / (max.x - min.x), 3.4 / (max.y - min.y), 1);

  const acero = new THREE.Mesh(forma, [material('#a36648'), material('#775141')]);
  acero.name = 'Primavera_acero_oxidado_calado';
  acero.castShadow = acero.receiveShadow = true;
  grupo.add(acero);

  // La planta y las fotos muestran luminarias circulares enrasadas con el césped.
  const aro = new THREE.CylinderGeometry(.115, .115, .024, 16);
  const lente = new THREE.CylinderGeometry(.085, .085, .025, 16);
  for (const [x, z] of [[-1.24, -.94], [1.25, -.94], [-1.24, .96], [1.25, .96]]) {
    const marco = new THREE.Mesh(aro, material('#a9aaa2'));
    marco.name = 'Primavera_aro_luminaria';
    marco.position.set(x, .004, z);
    const cristal = new THREE.Mesh(lente, material('#646d69'));
    cristal.name = 'Primavera_lente_luminaria';
    cristal.position.set(x, .008, z);
    grupo.add(marco, cristal);
  }
  return grupo;
}
