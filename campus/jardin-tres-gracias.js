const centro = [916, 290];
const nivelCesped = .27;
const fotoBases = 'https://www.google.com/maps/place/Edificio+HP/@19.5029781,-99.1877747,3a,75y,90t/data=!3m3!1e2!3m1!1sCIABIhDLa2vs6qIahFkbZ713kqGG';

// Contornos esquemáticos en metros, a partir de los alzados y las fotos del catálogo.
const figuras = [
  {
    nombre: 'Figura_brazos_abiertos', punto: [929, 296], giro: -.78, largoBase: 4.2,
    placas: [
      { borde: [
        [-1.62, 3.54], [-1.48, 3.59], [-1.32, 3.46], [-.62, 2.92],
        [.4, 2.60], [.89, 2.53], [1.08, 2.64], [1.18, 2.94],
        [1.32, 2.97], [1.36, 2.81], [1.22, 2.46], [1.01, 2.32],
        [.49, 2.34], [.40, 1.69], [-.67, 1.91], [-.57, 2.65], [-1.54, 3.36]
      ] },
      { borde: [
        [-.57, 1.94], [.38, 1.75], [.28, 1.20], [.60, .85], [.72, .59],
        [.59, .50], [.39, .68], [-.04, 1.15], [-.33, .55], [-.58, .38],
        [-.80, .40], [-.82, .51], [-.58, .69], [-.46, 1.27]
      ] }
    ]
  },
  {
    nombre: 'Figura_torso_calado', punto: [909, 296], giro: -.84, largoBase: 3.8,
    placas: [
      {
        borde: [
          [-.73, 3.16], [-.19, 3.48], [-.58, 3.58], [-.64, 3.70],
          [-.54, 3.74], [.05, 3.55], [.14, 3.44], [-.21, 3.18],
          [.82, 2.91], [1.03, 2.77], [.89, 2.48], [.75, 2.50], [.86, 2.71],
          [.59, 2.77], [.32, 1.72], [-.57, 1.84], [-.65, 2.61], [-.89, 2.67]
        ],
        calados: [
          [[-.68, 2.81], [-.3, 3.02], [.57, 2.87], [.50, 2.73], [-.66, 2.67]],
          [[-.49, 2.53], [-.02, 2.57], [-.04, 1.93], [-.43, 1.99]],
          [[.10, 2.59], [.45, 2.62], [.23, 1.91], [.07, 1.93]]
        ]
      },
      { borde: [
        [-.53, 1.91], [.32, 1.77], [.22, 1.35], [.67, 1.42], [.79, 1.27],
        [.43, .69], [.25, .73], [.49, 1.13], [0, 1.07], [-.28, .56],
        [-.44, .41], [-.56, .45], [-.51, .61], [-.36, .87]
      ] }
    ]
  },
  {
    nombre: 'Figura_de_perfil', punto: [910, 286], giro: -.66, largoBase: 3.5,
    placas: [
      { borde: [
        [-.57, 3.37], [-.30, 3.59], [.28, 3.65], [.80, 3.52], [1.18, 3.35],
        [1.23, 3.22], [1.12, 3.17], [.73, 3.29], [.20, 3.41], [-.09, 3.35],
        [.12, 2.97], [.14, 2.09], [-.13, 1.45], [.19, .74], [.13, .50],
        [-.06, .45], [-.13, .63], [-.47, 1.36], [-.45, 2.04], [-.23, 2.97]
      ] },
      { borde: [
        [-.18, 3.22], [.05, 3.05], [-.02, 2.57], [-.55, 2.38],
        [-.80, 2.59], [-.86, 2.79], [-.74, 2.82], [-.62, 2.65], [-.48, 2.57]
      ], giro: .42 },
      { borde: [[-.40, 2.08], [-.11, 2.38], [.12, 2.10], [-.14, 1.41], [-.25, .67], [-.45, .49], [-.50, 1.36]], giro: -.45 }
    ]
  }
];

export function construirJardinTresGracias({THREE, world, material, X, Z}) {
  const obra = new THREE.Group();
  obra.name = 'Las_tres_Gracias_HP';
  obra.userData = {
    title: 'Las tres Gracias', artist: 'Manuel Marín', catalogId: 'EAE 05',
    material: 'Acero al carbón oxidado y concreto', approximate: true, reference: fotoBases
  };
  obra.position.set(X(centro[0]), nivelCesped, Z(centro[1]));
  world.add(obra);

  const oxido = material('#6c493a');
  const oxidoOscuro = material('#513b33');
  const concreto = new THREE.MeshStandardMaterial({vertexColors: true, roughness: .96});
  const concretoClaro = new THREE.Color('#b1aa96');
  const tinteBase = new THREE.Color('#7f855f');

  function trazar(contorno, forma) {
    forma.moveTo(...contorno[0]);
    for (const punto of contorno.slice(1)) forma.lineTo(...punto);
    forma.closePath();
    return forma;
  }

  function extruir(forma, profundidad, acabado, nombre) {
    const geometria = new THREE.ExtrudeGeometry(forma, {depth: profundidad, bevelEnabled: false});
    geometria.translate(0, 0, -profundidad / 2);
    const malla = new THREE.Mesh(geometria, acabado);
    malla.name = nombre;
    malla.castShadow = malla.receiveShadow = true;
    return malla;
  }

  for (const {nombre, punto, giro, largoBase, placas} of figuras) {
    const figura = new THREE.Group();
    figura.name = nombre;
    figura.position.set(X(punto[0]) - obra.position.x, 0, Z(punto[1]) - obra.position.z);
    figura.rotation.y = giro;
    obra.add(figura);

    // Las fotos muestran apoyos bajos en onda con cantos redondeados y un tinte
    // verdoso junto al césped. Los perfiles y anclajes se mantienen esquemáticos.
    const extremo = largoBase / 2;
    const base = new THREE.Shape();
    base.moveTo(-extremo, 0);
    base.lineTo(extremo, 0);
    base.lineTo(extremo * .985, .10);
    base.bezierCurveTo(extremo * .64, .17, extremo * .36, .48, .04, .53);
    base.bezierCurveTo(-extremo * .36, .57, -extremo * .75, .34, -extremo, .08);
    base.closePath();
    const profundidad = .79;
    const geometriaBase = new THREE.ExtrudeGeometry(base, {
      depth: profundidad, curveSegments: 20, bevelEnabled: true,
      bevelThickness: .036, bevelSize: .040, bevelSegments: 3
    });
    geometriaBase.translate(0, 0, -profundidad / 2);
    const puntosBase = geometriaBase.getAttribute('position');
    const colores = [];
    for (let i = 0; i < puntosBase.count; i++) {
      const bajo = Math.max(0, 1 - puntosBase.getY(i) / .53);
      const variacion = .05 * Math.sin(11 * puntosBase.getX(i) + 8 * puntosBase.getZ(i));
      const tono = concretoClaro.clone().lerp(tinteBase, .72 * bajo).multiplyScalar(1 + variacion);
      colores.push(tono.r, tono.g, tono.b);
    }
    geometriaBase.setAttribute('color', new THREE.Float32BufferAttribute(colores, 3));
    const baseOndulada = new THREE.Mesh(geometriaBase, concreto);
    baseOndulada.name = 'Base_ondulada_de_concreto';
    baseOndulada.castShadow = baseOndulada.receiveShadow = true;
    if (nombre === figuras[0].nombre) baseOndulada.userData.disposeMaterial = true;
    figura.add(baseOndulada);

    for (const {borde, calados = [], giro: pliegue = 0} of placas) {
      const forma = trazar(borde, new THREE.Shape());
      for (const calado of calados) forma.holes.push(trazar(calado, new THREE.Path()));
      const placa = extruir(forma, .075, pliegue ? oxidoOscuro : oxido, 'Placa_de_acero');
      placa.rotation.y = pliegue;
      figura.add(placa);
    }
  }
  return obra;
}
