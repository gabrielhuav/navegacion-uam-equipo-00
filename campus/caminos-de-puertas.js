const trazos = [
  { puerta: 'V1', nodos: ['n125', 'n126', 'n127', 'n128', 'n129', 'n24'], ancho: 2.1 },
  { puerta: 'P1', nodos: ['n1', 'n2', 'n3'], ancho: 2.7 },
  { puerta: 'P2', nodos: ['n7', 'n8', 'n9'], ancho: 3.15 },
  { puerta: 'P3', nodos: ['n93', 'n22'], ancho: 3.25 },
];

function contornoDeAndador(eje, ancho) {
  const mitad = ancho / 2;
  const normales = eje.slice(1).map(([x, z], i) => {
    const dx = x - eje[i][0], dz = z - eje[i][1];
    const longitud = Math.hypot(dx, dz);
    return [-dz / longitud, dx / longitud];
  });
  const lados = [-1, 1].map(lado => eje.map(([x, z], i) => {
    const anterior = normales[Math.max(0, i - 1)];
    const siguiente = normales[Math.min(i, normales.length - 1)];
    const producto = anterior[0] * siguiente[0] + anterior[1] * siguiente[1];
    const distancia = lado * mitad / (1 + producto);
    return [
      x + distancia * (anterior[0] + siguiente[0]),
      z + distancia * (anterior[1] + siguiente[1]),
    ];
  }));
  return lados[0].concat(lados[1].reverse());
}

export function construirCaminosDePuertas({ THREE, world, data, net, meshPoly, vanos }) {
  const grupo = new THREE.Group();
  grupo.name = 'Conexiones_peatonales_de_las_puertas';
  world.add(grupo);

  const escala = data.metersPerPixel;
  const aCroquis = ([x, z]) => [895 + x / escala, 390 + z / escala];
  const porId = new Map(net.nodos.map(nodo => [nodo.id, nodo]));
  for (const { puerta, nodos, ancho } of trazos) {
    if (!nodos.every(id => porId.has(id))) continue;
    const eje = nodos.map(id => {
      const { x, z } = porId.get(id);
      return [x, z];
    });
    const [x, z] = eje[0];
    const desdeEje5 = puerta === 'P3';
    const banqueta = desdeEje5 ? [x, z + 6 * escala] : [x - 12 * escala, z];
    const apoyaEnPuerta = desdeEje5 ? [x, z - .46] : [x + .46, z];

    const huella = contornoDeAndador(
      [banqueta, ...eje].filter(([ax, az], i, puntos) =>
        i === 0 || Math.hypot(ax - puntos[i - 1][0], az - puntos[i - 1][1]) > .01),
      ancho,
    );
    const interior = contornoDeAndador(eje, ancho);
    const exterior = contornoDeAndador([banqueta, apoyaEnPuerta], ancho);
    const pavimento = meshPoly(grupo, interior.map(aCroquis), .351, '#c1bcad', 'Andador_Puerta_' + puerta);
    pavimento.userData = { ancho, nodos, huellaXZ: huella };
    const delantal = meshPoly(grupo, exterior.map(aCroquis), .345, '#c5beb0', 'Banqueta_Puerta_' + puerta);
    delantal.userData.fueraDelPredio = true;

    // La banqueta y el vano se distinguen mediante juntas superficiales.
    // Las juntas se acomodan en el ancho actual y quedan libres de resaltes.
    const distancia = Math.hypot(x - banqueta[0], z - banqueta[1]);
    const trazaBanqueta = puerta === 'V1' || puerta === 'P1' || puerta === 'P2';
    if (trazaBanqueta) {
      const hombro = (ancho - .16) / 2;
      for (let avance = .75; avance < distancia - .45; avance += 1.35) {
        const centro = [banqueta[0] + avance, z];
        const junta = [
          [centro[0] - .023, z - hombro], [centro[0] + .023, z - hombro],
          [centro[0] + .023, z + hombro], [centro[0] - .023, z + hombro],
        ];
        meshPoly(grupo, junta.map(aCroquis), .348, '#928c7e', 'Junta_banqueta_' + puerta)
          .userData.fueraDelPredio = true;
      }
      if (puerta === 'V1') {
        // Street View, enero 2025: remate amarillo a ambos lados de la entrada.
        // Las dos trazas terminan antes del borde peatonal.
        const calle = banqueta[0] - .14;
        for (const lado of [-1, 1]) {
          const z0 = z + lado * (ancho / 2 + .20);
          const z1 = z + lado * (ancho / 2 + 3.15);
          meshPoly(grupo, [[calle-.09,z0],[calle+.09,z0],[calle+.09,z1],[calle-.09,z1]].map(aCroquis),
            .349, '#bb9b45', 'Remate_amarillo_de_banqueta_Puerta_2').userData.fueraDelPredio = true;
        }
      }
    }
  }

  // Puerta 7 está documentada para circulación vehicular. Su entrada enlaza
  // la abertura del cierre con el carril interior junto a R.
  const puerta7 = vanos.find(vano => vano.id === 'V3');
  const gate = data.gates.find(puerta => puerta.id === 'V3');
  if (!puerta7 || !gate) return;
  const [a, b] = puerta7.extremosXZ;
  const umbral = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const calle = [umbral[0], umbral[1] - 4 * escala];
  const carril = [(gate.x - 895) * escala, (gate.y - 390) * escala];
  const llegada = [(gate.x - 904) * escala, carril[1]];
  const pavimento = meshPoly(grupo, contornoDeAndador([calle, umbral, carril, llegada], 5.3).map(aCroquis),
    .305, '#7c807b', 'Continuidad_vehicular_Puerta_7');
  pavimento.userData = { acceso: 'V3', modo: 'vehicle', approximate: true };
}
