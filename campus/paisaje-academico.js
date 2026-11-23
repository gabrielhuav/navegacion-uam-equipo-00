// Croquis en coordenadas del campus. El andador sigue los cruces existentes de K a T.
export const andadorAcademico = [966,414,980,617];
export const jardinesAcademicos = [
  [[907,554],[939,554],[950,558],[962,568],[964,578],[954,581],[942,579],[929,571],[907,566]],
  [[919,575],[933,575],[945,582],[950,590],[941,596],[930,596],[920,590]],
  [[920,600],[937,600],[943,606],[940,614],[919,614]],
];

const jardineras = [[955,587,2.25],[955,607,2.12],[916,588,1.92]];

export function construirPaisajeAcademico({THREE,world,box,slab,meshPoly,material,tree,X,Z,S}) {
  const group = new THREE.Group();
  group.name = 'Andador_y_jardines_K_J_L_T';
  group.userData = {approximate:true,reference:'Recorrido RV 8:54–9:44, corpus T y ortofoto Esri registrada'};
  world.add(group);

  const [x0,z0,x1,z1] = andadorAcademico;
  const cambioMaterial = 556;
  slab(group,[x0,z0,x1,cambioMaterial],'#a7aaa1',.324,.063,'Andador_concreto_K_L');
  slab(group,[x0,cambioMaterial,x1,z1],'#b39684',.361,.048,'Andador_grano_terracota_T');
  for (const x of [x0+.58,x1-.58]) {
    slab(group,[x-.32,z0,x+.32,cambioMaterial],'#bdbbb0',.359,.011,'Junta_longitudinal_K_L');
    slab(group,[x-.32,cambioMaterial,x+.32,z1],'#c7b9a3',.387,.009,'Junta_longitudinal_T');
  }
  for (let z=z0+3.4/S(); z<z1-.4; z+=3.4/S()) {
    const y = z<cambioMaterial ? .360 : .388;
    box(group,'Junta_transversal_andador_academico',X((x0+x1)/2),y,Z(z),(x1-x0-1.3)*S(),.008,.047,'#86887d');
  }

  for (const [index,polygon] of jardinesAcademicos.entries()) {
    meshPoly(group,polygon,.394,['#768d54','#708954','#7b9259'][index],'Cesped_patio_T_J_'+(index+1));
  }

  // Grano aparente, bordes anulares y sombra de árboles que se ven al salir de T.
  for (const [index,[x,z,radius]] of jardineras.entries()) {
    const borde = new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,.19,32),material('#aca590'));
    borde.name = 'T_borde_jardinera_circular_'+(index+1);
    borde.position.set(X(x),.467,Z(z));
    borde.receiveShadow = true;
    const tierra = new THREE.Mesh(new THREE.CylinderGeometry(radius-.165,radius-.165,.18,32),material('#79714e'));
    tierra.name = 'T_tierra_jardinera_circular_'+(index+1);
    tierra.position.set(X(x),.445,Z(z));
    tierra.receiveShadow = true;
    group.add(borde,tierra);
    tree(x,z,[1,1.16,.89][index],false,.535);
  }

  // La solera clara frente a T enlaza el andador con la galería y rodea las jardineras.
  meshPoly(group,[[902,585],[912,582],[919,591],[939,595],[949,590],[965,592],
    [966,600],[950,601],[942,601],[918,598],[906,593]],.362,'#b7ac99','Paso_transversal_patio_T');
  meshPoly(group,[[905,613],[943,613],[966,605],[969,615],[960,617],[906,617]],
    .36,'#b6b4a9','Solera_frente_galeria_T');
}


const jardinPosgrados = [
  [270,242],[531,242],[531,275],[521,280],[295,280],[283,277],[280,269],[269,265],
];

// El Sendero 3 y la ortofoto muestran grupos de copas escalonados en el jardín de D.
const arbolesPosgrados = [
  [285,251,.83],[305,258,1.04],[325,249,.91],[344,258,1.12],[374,261,1.02],
  [396,253,.88],[410,268,1.22],[439,257,1.17],[468,251,1.19],[490,266,1.04],
  [515,255,.92],
];

export function excluirArboladoAmbientalPosgrados(x,z) {
  return x>=266&&x<=532&&z>=234&&z<=280;
}

export function construirJardinPosgrados({THREE,world,box,slab,meshPoly,tree,X,Z,S}) {
  const grupo = new THREE.Group();
  grupo.name = 'Jardin_y_andador_Posgrados_D';
  grupo.userData = {
    approximate:true,
    reference:'UAM Azcapotzalco, Sendero Interpretativo 3 Posgrados y ortofoto Esri registrada',
  };
  world.add(grupo);

  // Franja entre el estacionamiento y el jardín. El cruce transversal conecta con el andador existente.
  const [inicio,fin] = [266,542];
  const [bordeEstacionamiento,bordeJardin] = [235,242];
  slab(grupo,[inicio,bordeEstacionamiento,fin,bordeJardin],'#a9a89c',.281,.073,'Andador_Posgrados_concreto');
  for (const borde of [bordeEstacionamiento,bordeJardin]) {
    slab(grupo,[inicio,borde-.35,fin,borde+.35],'#c0bbad',.283,.078,'Borde_enrasado_andador_Posgrados');
  }
  for (let x=inicio+8; x<fin-2; x+=8) {
    box(grupo,'Junta_andador_Posgrados',X(x),.319,Z((bordeEstacionamiento+bordeJardin)/2),
      .027,.008,(bordeJardin-bordeEstacionamiento-.7)*S(),'#88897e');
  }

  meshPoly(grupo,jardinPosgrados,.245,'#7c8c54','Cesped_jardin_Posgrados');
  const zonasVerdes = [
    [[279,249],[297,244],[329,245],[340,251],[328,260],[304,270],[288,268]],
    [[335,251],[364,247],[391,253],[408,260],[411,271],[394,277],[372,275],[348,267]],
    [[417,246],[455,244],[480,247],[494,255],[481,265],[461,274],[435,269],[419,257]],
    [[486,267],[502,256],[519,249],[530,253],[527,271],[515,278],[497,279]],
  ];
  for (const [i,parcela] of zonasVerdes.entries()) {
    meshPoly(grupo,parcela,.252,['#74874f','#788a54','#70864f','#748b54'][i],'Manto_vegetal_Posgrados');
  }
  const claros = [
    [[288,275],[301,265],[323,261],[344,263],[359,271],[373,278],[295,279]],
    [[405,276],[418,270],[431,271],[438,276],[461,279],[410,279]],
  ];
  for (const claro of claros) meshPoly(grupo,claro,.256,'#96916a','Claro_terroso_jardin_Posgrados');

  for (const [x,z,tamano] of arbolesPosgrados) tree(x,z,tamano,false,.248);
  return grupo;
}

const setosJK = [
  [917,420,936,423.1],
  [939.5,420,954,423.1],
  [952,422.8,955,435.4],
];

export function excluirArboladoAmbientalJK(x,z) {
  return x>=913&&x<=970&&z>=413&&z<=446;
}

// Paños de pares de ladrillos rectangulares que alternan su orientación.
function colocarAdoquinJK({THREE,terreno,material,X,Z,S,alcorque}) {
  const paso = .48/S(), junta = .009/S();
  const lotes = ['#838679','#97998d','#777d73','#8d9181'].map(color=>({color,vertices:[]}));
  for (let fila=0;418.34+(fila+1)*paso<=442.2;fila++) {
    const z = 418.34+fila*paso;
    for (let columna=0;956.05+(columna+1)*paso<=969.75;columna++) {
      const x = 956.05+columna*paso;
      if (x+paso>alcorque[0]&&x<alcorque[2]&&z+paso>alcorque[1]&&z<alcorque[3]) continue;
      const horizontal = (fila+columna)%2===0;
      const ancho = horizontal ? paso : paso/2;
      const fondo = horizontal ? paso/2 : paso;
      for (let pieza=0;pieza<2;pieza++) {
        const izquierda = x+(horizontal?0:pieza*ancho);
        const inicio = z+(horizontal?pieza*fondo:0);
        const x0 = X(izquierda+junta), x1 = X(izquierda+ancho-junta);
        const z0 = Z(inicio+junta), z1 = Z(inicio+fondo-junta);
        const lote = lotes[(fila*3+columna+pieza+Math.floor(columna/5))%lotes.length];
        lote.vertices.push(x0,.26,z0, x0,.26,z1, x1,.26,z1, x0,.26,z0, x1,.26,z1, x1,.26,z0);
      }
    }
  }
  for (const {color,vertices} of lotes) {
    const geometria = new THREE.BufferGeometry();
    geometria.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    geometria.computeVertexNormals();
    const malla = new THREE.Mesh(geometria,material(color));
    malla.name = 'Adoquin_ensanche_K';
    malla.receiveShadow = true;
    terreno.add(malla);
  }
}

export function construirJardinJK({THREE,world,vegetation,box,meshPoly,material,tree,X,Z,S}) {
  const terreno = new THREE.Group();
  terreno.name = 'Jardin_entre_J_y_K';
  terreno.userData = {
    approximate: true,
    reference: 'Panteras Al Rescate, Recorrido en RV por la UAM Azcapotzalco, 8:03–8:10 y 9:51–10:04; plano PC 2026, EAE 10 y ortofoto Esri',
  };
  world.add(terreno);
  meshPoly(terreno,[[915,418],[955,418],[958,421],[958,434],[953,437],[916,436]],
    .246,'#829653','Cesped_entre_cafeteria_y_K');
  meshPoly(terreno,[[938,426],[948,424],[953,429],[950,434],[941,434]],
    .253,'#78894e','Franja_verde_bajo_yucas_J_K');

  // El piso de K y el adoquín se encuentran junto a K-001. En el otro extremo
  // se ve un borde bajo antes de la terracota de J. Se modela el suelo visible.
  meshPoly(terreno,[[913,413],[969.8,413],[969.8,418],[913,418]],
    .250,'#d5d4ca','Franja_clara_al_pie_de_K');
  meshPoly(terreno,[[956,418],[969.8,418],[969.8,442.3],[956,442.3]],
    .248,'#7c8175','Ensanche_adoquinado_K');
  meshPoly(terreno,[[956,418],[969.8,418],[969.8,418.29],[956,418.29]],
    .260,'#bebcb0','Junta_entre_galeria_y_adoquin_K');

  const alcorque = [960,427,965,436];
  colocarAdoquinJK({THREE,terreno,material,X,Z,S,alcorque});
  const [izquierda, frente, derecha, fondo] = alcorque;
  meshPoly(terreno,[[izquierda,frente],[derecha,frente],[derecha,fondo],[izquierda,fondo]],
    .263,'#b2ad9d','Marco_al_ras_del_alcorque_K');
  meshPoly(terreno,[[izquierda+.36,frente+.36],[derecha-.36,frente+.36],
    [derecha-.36,fondo-.36],[izquierda+.36,fondo-.36]],.265,'#777751','Alcorque_rectangular_K');
  tree(962.4,431.5,.58,false,.267);
  tree(963.3,434.4,.53,false,.267);

  // Alturas y límites orientativos de la transición observada en 10:02–10:04.
  box(terreno,'Borde_bajo_hacia_J',X(962.9),.278,Z(442.32),13.8*S(),.053,.35*S(),'#aaa797');
  meshPoly(terreno,[[956,442.49],[969.8,442.49],[969.8,446],[956,446]],
    .305,'#ad7969','Loseta_terracota_del_borde_de_J');

  const plantas = new THREE.Group();
  plantas.name = 'Setos_y_yucas_J_K';
  vegetation.add(plantas);
  for (const [x0,z0,x1,z1] of setosJK) {
    const ancho=(x1-x0)*S(), fondo=(z1-z0)*S(), x=X((x0+x1)/2), z=Z((z0+z1)/2);
    box(plantas,'Seto_recortado_J_K',x,.56,z,ancho,.62,fondo,'#476b35');
    box(plantas,'Copa_clara_seto_J_K',x,.89,z,ancho-.12,.14,fondo-.12,'#698b46');
  }

  const tallo = new THREE.CylinderGeometry(.071,.112,1,7);
  const hoja = new THREE.ConeGeometry(.085,1,4);
  const vertical = new THREE.Vector3(0,1,0);
  // Siluetas visibles desde la galería. La altura y el sitio de cada tallo son orientativos.
  for (const [x,z,altura,radio] of [[943.2,428.5,2.67,1.1],[945.6,429.7,1.87,.86],[940.7,430,1.31,.7]]) {
    const tronco = new THREE.Mesh(tallo,material('#74624b'));
    tronco.name = 'Tronco_yuca_J_K';
    tronco.position.set(X(x),.25+altura/2,Z(z));
    tronco.scale.y=altura;
    tronco.castShadow=true;
    plantas.add(tronco);
    for (let i=0;i<15;i++) {
      const angulo=i*2*Math.PI/15;
      const deltaY=i%3===0?.62:-.21;
      const direccion=new THREE.Vector3(Math.cos(angulo)*radio,deltaY,Math.sin(angulo)*radio);
      const longitud=direccion.length();
      const pala=new THREE.Mesh(hoja,material(['#4f773c','#72994f','#3f6938'][i%3]));
      pala.name='Hoja_radial_yuca_J_K';
      pala.position.set(X(x)+direccion.x*.5,altura+.25+deltaY*.5,Z(z)+direccion.z*.5);
      pala.scale.y=longitud;
      pala.quaternion.setFromUnitVectors(vertical,direccion.normalize());
      plantas.add(pala);
    }
  }
}
