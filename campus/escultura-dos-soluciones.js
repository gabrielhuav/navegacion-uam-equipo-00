// Planta EAE 01 junto a B y San Pablo Xalpa, Elogio al espacio, p. 68 impresa.
export const anclaDosSoluciones = [174,535];

export function crearEsculturaDosSoluciones({THREE,material,X,Z}) {
  const grupo = new THREE.Group();
  grupo.name = 'Dos_soluciones_San_Pablo';
  grupo.position.set(X(anclaDosSoluciones[0]),.1,Z(anclaDosSoluciones[1]));
  // Orientación aproximada de la diagonal respecto a la bifurcación del andador.
  grupo.rotation.y = -2.48;
  grupo.userData = {
    approximate: true,
    reference: 'Elogio al espacio (UAM-A, 2012), EAE 01 y pp. 64–72 impresas; Aleph 304, p. 9',
    artist: 'Manuel Felguérez',
  };

  const concreto = '#777772', acero = '#313638', canto = '#7d8987', cable = '#9e5454';
  const vertical = new THREE.Vector3(0,1,0);
  function pieza(nombre, geometria, color, posicion) {
    const malla = new THREE.Mesh(geometria,material(color));
    malla.name = nombre;
    malla.position.set(...posicion);
    malla.castShadow = malla.receiveShadow = true;
    grupo.add(malla);
    return malla;
  }
  function perfil(nombre, puntos, fondo, z, color) {
    const arco = new THREE.Shape();
    puntos.forEach(([x,y],i) => i === 0 ? arco.moveTo(x,y) : arco.lineTo(x,y));
    arco.closePath();
    pieza(nombre,new THREE.ExtrudeGeometry(arco,{depth:fondo,bevelEnabled:false}),color,[0,0,z-fondo/2]);
  }
  function barra(nombre, inicio, fin, ancho, fondo, color) {
    const a = new THREE.Vector3(...inicio), b = new THREE.Vector3(...fin);
    const eje = b.clone().sub(a);
    const malla = pieza(nombre,new THREE.BoxGeometry(ancho,eje.length(),fondo),color,a.lerp(b,.5).toArray());
    malla.quaternion.setFromUnitVectors(vertical,eje.normalize());
  }

  pieza('Basamento_Dos_soluciones',new THREE.BoxGeometry(2.4,.37,2.8),concreto,[-.13,.185,0]);
  pieza('Dado_lateral_de_concreto',new THREE.BoxGeometry(.68,.78,1.42),concreto,[-.91,.76,-.53]);
  perfil('Apoyo_inclinado_de_concreto',[[.37,.36],[.96,.36],[1.09,2.5],[.86,2.65]],.54,-.04,concreto);
  perfil('Montante_de_acero',[[-1.02,.57],[-.77,.57],[-.77,1.13],[-.63,1.36],[-.78,1.43],
    [-.78,4.96],[-1.02,5],[-1.04,1.19]],.25,-.27,acero);
  barra('Brazo_diagonal_principal',[-1.24,4.63,-.19],[2.11,1.13,.04],.28,.45,acero);
  barra('Canto_del_brazo_diagonal',[-1.23,4.74,-.19],[2.13,1.23,.04],.049,.43,canto);
  perfil('Ala_superior_de_acero',[[-1.31,3.79],[-.50,3.99],[-.17,4.73],[-.36,4.86]],.23,.13,acero);
  perfil('Placa_entre_brazos',[[-1.39,3.97],[.17,3.5],[.14,3.88],[-1.21,4.15]],.21,.06,acero);

  // Las bandas curvadas y los tensores dejan abierta la silueta de los brazos.
  for(const [z,y,claro,color] of [[.42,3.97,.73,canto],[-.38,3.48,.62,acero]]) {
    const arco = new THREE.Shape();
    arco.moveTo(-.96,y);
    arco.quadraticCurveTo(-.08,y-claro,.27,y-.16);
    arco.lineTo(.22,y-.28);
    arco.quadraticCurveTo(-.06,y-claro-.18,-1.02,y-.12);
    arco.closePath();
    pieza('Banda_curvada_de_acero',new THREE.ExtrudeGeometry(arco,{depth:.13,bevelEnabled:false}),color,[0,0,z]);
  }
  barra('Tensor_rojo_superior',[-.96,4.98,-.21],[.32,3.6,.45],.018,.018,cable);
  barra('Tensor_rojo_frontal',[-.33,4.75,.14],[-.90,3.85,.47],.018,.018,cable);
  barra('Tensor_rojo_inferior',[-1.36,3.98,.12],[-.87,3.22,-.37],.018,.018,cable);
  return grupo;
}
