const llegada = [
  [1332,664], [1355,664], [1361,669], [1372,669], [1382,675],
  [1393,678], [1399,684], [1392,691], [1378,695], [1332,695],
];

const jardines = [
  [[1356,600], [1372,598], [1386,604], [1393,613], [1388,627], [1378,638],
    [1368,656], [1356,662]],
  [[1395,624], [1407,616], [1423,619], [1429,633], [1427,650], [1419,661],
    [1424,676], [1429,685], [1424,694], [1401,694], [1404,679], [1396,668],
    [1400,653], [1390,642]],
];

const arboles = [
  [1376,610,1.04], [1368,628,1.17], [1365,648,1.06],
  [1408,635,1.19], [1415,651,.95], [1416,685,1.12],
  [1317,679,.93], [1321,688,1.04],
];

// Las copas representadas sustituyen el arbolado genérico en el detalle.
export function excluirArboladoAmbientalPuerta6(x,z) {
  return (x>=1310 && x<=1431 && z>=599 && z<=695);
}

export function construirLlegadaPuerta6({THREE,world,meshPoly,tree}) {
  const grupo = new THREE.Group();
  grupo.name = 'Llegada_y_jardines_Puerta_6';
  grupo.userData = {
    approximate: true,
    reference: 'UAM Azcapotzalco, Plano con puntos de reunión y Sendero Interpretativo 4; ortofoto Esri registrada',
  };
  world.add(grupo);

  // El ensanche de suelo claro documentado se encuentra junto al andador del croquis.
  // Los límites bajo las copas son aproximados.
  meshPoly(grupo,llegada,.321,'#c7bea6','Explanada_de_llegada_Puerta_6');
  meshPoly(grupo,[[1332,574],[1355,574],[1355,664],[1332,664]],
    .321,'#c7bea6','Andador_existente_Puerta_6');
  meshPoly(grupo,[[1332,691],[1346,691],[1346,700],[1329,700]],
    .320,'#c7bea6','Umbral_visual_Puerta_6');

  // Jardines planos. La señal de itinerario del Sendero 4 sólo indica las estaciones.
  meshPoly(grupo,jardines[0],.225,'#819359','Jardin_interior_Puerta_6');
  meshPoly(grupo,jardines[1],.225,'#738955','Jardin_lado_deportivo_Puerta_6');
  meshPoly(grupo,[[1359,603],[1371,601],[1385,608],[1386,620],[1377,630],[1360,625]],
    .23,'#8f9468','Claro_entre_copas_Puerta_6');
  meshPoly(grupo,[[1401,656],[1413,661],[1420,674],[1413,677],[1405,675],[1399,669]],
    .23,'#8d9165','Claro_entre_copas_Puerta_6');
  for (const [x,z,tamano] of arboles) tree(x,z,tamano,false,.225);
  return grupo;
}
