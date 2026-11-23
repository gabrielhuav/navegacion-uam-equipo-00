// Posición esquemática en la franja de césped entre K y el estacionamiento.
// Planta EAE 06, Elogio al espacio (2012), pp. 29 y 99 impresas.
export const anclaPielDelMar = [1033,370];

export function crearEsculturaPielDelMar({THREE,material,X,Z}) {
  const grupo = new THREE.Group();
  grupo.name = 'La_piel_del_mar_K';
  grupo.position.set(X(anclaPielDelMar[0]),.1,Z(anclaPielDelMar[1]));
  grupo.rotation.y = -Math.PI / 2;
  grupo.userData = {
    approximate: true,
    reference: 'Elogio al espacio (UAM-A, 2012), pp. 29 y 94–102 impresas; Tour escultórico CyAD',
    artist: 'Marina Láscaris',
    dimensions: [1.6,3,1],
  };

  // Dos lóbulos desiguales y una abertura que atraviesa la piedra.
  const frente = new THREE.Shape();
  frente.moveTo(-.72,.08);
  frente.bezierCurveTo(-.69,.18,-.49,.19,-.54,.42);
  frente.bezierCurveTo(-.62,.78,-.51,1.07,-.55,1.35);
  frente.bezierCurveTo(-.66,1.65,-.47,1.95,-.51,2.2);
  frente.bezierCurveTo(-.54,2.63,-.42,2.92,-.17,2.92);
  frente.bezierCurveTo(.01,2.92,.11,2.76,.16,2.82);
  frente.bezierCurveTo(.36,2.92,.61,2.86,.58,2.63);
  frente.bezierCurveTo(.61,2.39,.52,2.17,.55,1.99);
  frente.bezierCurveTo(.63,1.74,.45,1.58,.51,1.37);
  frente.bezierCurveTo(.58,1.05,.45,.86,.54,.61);
  frente.bezierCurveTo(.64,.41,.52,.25,.72,.08);
  frente.closePath();

  const hueco = new THREE.Path();
  hueco.moveTo(.025,1.66);
  hueco.bezierCurveTo(.20,1.84,.26,2.11,.14,2.39);
  hueco.bezierCurveTo(.04,2.29,-.145,2.03,-.085,1.85);
  hueco.bezierCurveTo(-.074,1.75,-.042,1.68,.025,1.66);
  hueco.closePath();
  frente.holes.push(hueco);

  const cuerpo = new THREE.ExtrudeGeometry(frente,{
    depth:.84,curveSegments:12,bevelEnabled:true,
    bevelThickness:.08,bevelSize:.08,bevelSegments:3
  });
  cuerpo.computeBoundingBox();
  cuerpo.translate(0,-cuerpo.boundingBox.min.y,-.42);
  const piedra = new THREE.Mesh(cuerpo,material('#d2cec0'));
  piedra.name = 'Estela_de_recinto_calada';
  piedra.castShadow = piedra.receiveShadow = true;
  grupo.add(piedra);

  // Bandas curvas estrechas evocan los surcos de la superficie tallada.
  const relieves = [
    [[-.49,.32],[-.38,.35],[-.23,.38],[-.08,.37]],
    [[-.48,.45],[-.35,.48],[-.19,.52],[-.05,.49]],
    [[-.47,.58],[-.33,.61],[-.18,.65],[-.04,.62]],
    [[-.46,.72],[-.31,.75],[-.16,.79],[-.033,.745]],
    [[-.45,.87],[-.28,.89],[-.17,.93],[-.026,.90]],
    [[-.44,1.03],[-.29,1.06],[-.16,1.10],[-.028,1.055]],
    [[.02,.58],[.02,1.03],[.13,1.52],[.33,1.77],[.39,2.04]],
    [[.19,1.77],[.28,1.93],[.37,2.13],[.37,2.34]],
  ];
  relieves.forEach((puntos,indice) => {
    const curva = new THREE.CatmullRomCurve3(puntos.map(([x,y]) => new THREE.Vector3(x,y,.421)));
    const surco = new THREE.Mesh(new THREE.TubeGeometry(curva,16,.012,4,false),
      material(indice<6 ? '#c5c1b4' : '#bdb9ad'));
    surco.name = 'Estria_tallada_de_la_estela';
    grupo.add(surco);
  });
  return grupo;
}
