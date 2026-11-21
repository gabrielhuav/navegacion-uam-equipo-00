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
