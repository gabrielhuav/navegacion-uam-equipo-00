// Croquis de la franja H–HP, orientado con georreferencia.json y la vista aérea.
// Los primeros límites siguen el jardín. Los restantes corresponden a separadores arbolados.
export const parcelasVerdesHHP = [
  [[748,246],[752,266],[757,276],[864,276],[883,283],[891,292],[897,306],[901,315],
   [910,320],[920,315],[931,315],[948,322],[955,319],[954,302],[954,285],[951,271],
   [954,258],[945,245],[935,238],[921,234],[903,235],[890,237],[877,242],[858,244],
   [840,245],[825,243],[813,234],[791,234],[777,242],[762,240],[757,241]],
  [[1007,262],[1017,260],[1020,273],[1018,309],[1020,333],[1016,352],
   [1006,351],[1005,325],[1005,280]],
  [[1072,224],[1084,226],[1087,245],[1086,269],[1088,292],[1086,318],
   [1083,336],[1072,332],[1070,306],[1071,271],[1068,247]],
  [[1138,247],[1146,251],[1149,267],[1148,301],[1149,322],[1146,345],
   [1138,345],[1137,326],[1137,291],[1137,266]],
  [[890,221],[899,216],[908,217],[915,223],[914,231],[903,232],[890,232]],
];

// Andador visible en el panorama de CyADtv de junio de 2019, sobre el eje n29–n30.
export const andadorHHP = [745,237.25,960,242.75];

// Referencias en planta para orientar las baterías conservando las transformaciones del editor.
// Cada fila indica x, lado de cabecera, z inicial y z final. Los intersticios quedan como carriles.
export const trazadosHHP = {
  parking_2: {
    limites: [901,185,1174,365],
    filas: [[973,1,247,347],[997,-1,235,349],[1029,1,230,351],
      [1057,-1,228,348],[1100,1,243,347],[1131,-1,245,348]],
    carriles: [[985,224,356],[1043,222,356],[1115,222,356]],
  },
  parking_6: {
    limites: [740,180,901,270],
    filas: [[765,1,183,231],[818,1,182,223],[851,-1,182,228],[875,-1,188,225]],
    carriles: [[777,181,230],[833,181,229],[863,181,229]],
  },
};

// Se toma el centro visible de las copas como anclaje aproximado. Las posiciones dejan libre el andador.
const arboles = [
  [767,254,1.0],[787,260,1.25],[808,254,1.18],[823,254,1.18],[847,263,1.0],
  [868,254,1.32],[884,259,1.15],[901,249,1.45],[922,251,1.24],[940,258,1.12],
  [944,279,1.18],[943,305,1.30],[921,306,1.06],[892,288,.93],
  [1012,268,1.1],[1011,287,1.35],[1013,307,1.12],[1013,325,1.39],[1013,342,1.12],
  [1078,253,1.25],[1079,273,1.08],[1081,290,1.4],[1078,313,1.3],[1077,328,1.1],
  [1142,262,1.22],[1143,281,1.38],[1142,303,1.22],[1144,323,1.35],[1143,337,1.18],
  [903,226,1.2],
];

export function construirPaisajeHHP({THREE,world,meshPoly,slab,tree,X,Z,S}) {
  const group = new THREE.Group();
  group.name = 'Jardines_y_andador_H_HP';
  group.userData = {approximate:true,reference:'Vista aérea Esri, mapa de CBI y panorama CyADtv en junio de 2019'};
  world.add(group);

  const sueloVerde = .27;
  const colores = ['#789851','#6c8751','#759155','#6c8950','#7b9255'];
  for (const [i, puntos] of parcelasVerdesHHP.entries()) {
    meshPoly(group,puntos,sueloVerde,colores[i],i===0?'Cesped_continuo_H_HP':'Cesped_camellon_H_HP_'+i);
  }

  const [x0,z0,x1,z1] = andadorHHP;
  const borde = .16/S();
  slab(group,andadorHHP,'#a7a7a0',.302,.086,'Andador_losas_H_HP');
  for (const z of [z0,z1-borde]) {
    slab(group,[x0,z,x1,z+borde],'#c6c5b8',.344,.036,'Borde_concreto_andador_H_HP');
  }

  // Juntas superficiales de las losas, en una sola malla.
  const vertices = [];
  const zu = Z(z0+borde), zv = Z(z1-borde), half = .017;
  for (let x=x0+.92/S(); x<x1-.1; x+=.92/S()) {
    const l=X(x)-half, r=X(x)+half;
    vertices.push(l,.348,zu,l,.348,zv,r,.348,zv,l,.348,zu,r,.348,zv,r,.348,zu);
  }
  const juntas = new THREE.BufferGeometry();
  juntas.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  juntas.computeVertexNormals();
  const malla = new THREE.Mesh(juntas,new THREE.MeshStandardMaterial({color:'#7b7c76',roughness:.96}));
  malla.name = 'Juntas_losas_andador_H_HP';
  malla.receiveShadow = true;
  malla.userData.disposeMaterial = true;
  group.add(malla);

  // El panorama muestra setos interrumpidos hacia el carril, con claros en los cruces.
  for (const [inicio,fin,z] of [[790,813,235.5],[900,919,235.9],[927,934,236.4]]) {
    for (let x=inicio; x<=fin; x+=2.8) {
      slab(group,[x,z-.52,Math.min(x+2.86,fin+.12),z+.52],'#577144',.51,.48,'Seto_bajo_andador_H_HP');
    }
  }

  for (const [index,[x,z,porte]] of arboles.entries()) {
    const radio = (.72 + .16 * (index%4))/S();
    const alcorque = Array.from({length:9},(_,i)=>{
      const angulo=i*2*Math.PI/9;
      const bordeIrregular=radio*(.84+.15*Math.sin(i*3+index));
      return [x+Math.cos(angulo)*bordeIrregular,z+Math.sin(angulo)*bordeIrregular];
    });
    meshPoly(group,alcorque,sueloVerde+.008,'#8a7751','Tierra_bajo_copa_H_HP');
    tree(x,z,porte,false,sueloVerde);
  }
}
