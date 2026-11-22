import {BASE_ROUTES} from 'route-data';
import {polygonsOverlap, rectanglePolygon, segmentPolygon} from 'site-clearance';

// Paño visible en la ortofoto registrada entre la fachada de D y el estacionamiento.
// La sombra oculta la continuación y la foto a pie no distingue la puerta de D-001.
const llegadaD = [[365,252],[372,252],[380,265],[389,282.6],[353,282.6],[360,267]];
const setosD = [[348,273,354,280],[388,270,400,277]];
// Las islas ya aparecen en sector-acceso-plaza.js. Aquí se detalla su borde junto al andador.
const bordesF = [[512,556,539,558],[572,555,610,557]];

function formas(THREE,group) {
  const cubo = new THREE.BoxGeometry(1,1,1);
  const colores = new Map();
  const material = color => {
    if (!colores.has(color)) colores.set(color,new THREE.MeshStandardMaterial({color,roughness:.88}));
    return colores.get(color);
  };
  function caja(name,color,x,y,z,w,h,d) {
    const mesh = new THREE.Mesh(cubo.clone(),material(color));
    mesh.name = name;
    mesh.position.set(x,y,z);
    mesh.scale.set(w,h,d);
    mesh.receiveShadow = true;
    mesh.castShadow = h>1;
    group.add(mesh);
    return mesh;
  }
  function superficie(name,color,contorno,y) {
    // La planta X/Z se proyecta con normal positiva en Y.
    const cont = contorno.map(p => new THREE.Vector2(p.x,-p.z));
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(cont)),material(color));
    mesh.rotation.x = -Math.PI/2;
    mesh.position.y = y;
    mesh.receiveShadow = true;
    mesh.name = name;
    group.add(mesh);
    return mesh;
  }
  return {caja,superficie,material};
}

function reservaDePasos(net) {
  const nodos = new Map(net.nodos.map(n => [n.id,n]));
  return net.aristas.flatMap(({de,a}) => {
    const n = nodos.get(de), m = nodos.get(a);
    if (!n || !m || n.nivel!==0 || m.nivel!==0 || Math.hypot(n.x-m.x,n.z-m.z)<.001) return [];
    return [segmentPolygon(n,m,3.2)];
  });
}

export function crearDetallesMapsCorredorCultural(THREE,data,net=BASE_ROUTES) {
  const group = new THREE.Group();
  group.name = 'Detalles_Maps_corredor_cultural_D_F';
  group.userData = {approximate:true,visualOnly:true,reservasArbolado:[],
    reference:'Auditoría Maps AZC, zonas 05 a 07, corpus y Esri World Imagery registrada'};
  const {caja,superficie} = formas(THREE,group);
  const s = data.metersPerPixel;
  const punto = ([x,z]) => ({x:(x-895)*s,z:(z-390)*s});
  const rutas = reservaDePasos(net);
  const huella = ([x0,z0,x1,z1]) => rectanglePolygon(punto([(x0+x1)/2,0]).x,
    punto([0,(z0+z1)/2]).z,(x1-x0)*s,(z1-z0)*s);
  function arriates(rects,id) {
    for (const [x0,z0,x1,z1] of rects) {
      for (let x=x0;x<x1;x+=2.8) {
        const fin = Math.min(x+2.8,x1), base = huella([x,z0,fin,z1]);
        if (rutas.some(p => polygonsOverlap(p,base))) continue;
        const centro = punto([(x+fin)/2,(z0+z1)/2]);
        caja('Seto_discontinuo_'+id,'#47613e',centro.x,.545,centro.z,(fin-x)*s,.43,(z1-z0)*s);
      }
    }
  }
  const d = data.buildings.find(b => b.id==='D')?.rects[0];
  if (d && d[1]===283) {
    const llegada = llegadaD.map(punto);
    superficie('Andador_exterior_D_desde_estacionamiento','#b6b1a3',llegada,.337);
    group.userData.reservasArbolado.push(llegada);
    arriates(setosD,'D');
  }
  const f = data.buildings.find(b => b.id==='F')?.rects[0];
  if (f && f[1]===565) {
    // Foto a pie de junio 2023. El pavimento gris está entre la fachada y el
    // borde de los arriates. La ubicación exacta del medallón queda pendiente.
    superficie('Pavimento_gris_PB_F_Plaza_Roja','#a7aaa1',huella([487,559.02,644,565]),.369);
    superficie('Junta_andador_PB_F_Plaza_Roja','#817f76',huella([487,559.05,644,559.21]),.372);
    arriates(bordesF,'F');
  }
  return group;
}

// Vanos existentes de E. Luz, instalaciones y plafón quedan al interior del
// corredor abierto; el friso cae desde arriba y deja visible el vano.
export function detallarGaleriaCulturalE({part,w,d,box,data}) {
  const ancho = Math.min(2.8,d*.32);
  const centro = (d-ancho)/2;
  const frente = d/2;
  const piso = data.storeyHeight;
  for (let nivel=0;nivel<3;nivel++) {
    const techo = (nivel+1)*piso-.31;
    box(part,'Plafon_claro_galeria_E_'+nivel,0,techo,centro,w,.09,ancho,'#e3dfd3');
    box(part,'Trabe_corrida_galeria_E_'+nivel,0,techo-.12,frente-.13,w,.36,.25,'#aaa99f');
    if (nivel>0) {
      box(part,'Coronacion_antepecho_E_'+nivel,0,nivel*piso+.925,frente-.13,w,.052,.226,'#b4b6ac');
    }
    for (let x=-w/2+2.8;x<w/2-1.8;x+=4.4) {
      box(part,'Lampara_transversal_galeria_E_'+nivel,x,techo-.077,centro,.092,.055,1.41,'#fbf5de');
    }
    if (nivel===2) {
      for (const despl of [.19,.32]) {
        box(part,'Instalacion_alta_galeria_E',0,techo-.16,frente-ancho+despl,w-.32,.09,.074,'#908477');
      }
    }
  }
}

export function crearInteriorIncalli(THREE) {
  const group = new THREE.Group();
  group.name = 'Interior_esquematico_Auditorio_Incalli';
  group.userData = {approximate:true,visualOnly:true,reference:'Fotos de Incalli, galería Maps de agosto de 2024'};
  const {caja,material} = formas(THREE,group);
  const oscuro = '#302c2d', madera = '#875743', plantilla = new THREE.Object3D();
  const filas = 8, asientos = 14;
  function butacas(name,color,w,h,d,y,z) {
    const malla = new THREE.InstancedMesh(new THREE.BoxGeometry(w,h,d),material(color),filas*asientos);
    let i=0;
    for (let fila=0;fila<filas;fila++) for (let n=0;n<asientos;n++) {
      plantilla.position.set(-5.84+n*.90,y+fila*.22,z+fila*1.17);
      plantilla.updateMatrix();
      malla.setMatrixAt(i++,plantilla.matrix);
    }
    malla.name = name;
    malla.castShadow = true;
    malla.receiveShadow = true;
    group.add(malla);
  }
  caja('Corte_piso_auditorio','#726156',0,-.12,0,15.8,.25,17.8);
  caja('Tablado_escenario',oscuro,0,.38,-6.42,14.85,.76,4.88);
  caja('Frente_tablado','#52413a',0,.31,-3.956,14.8,.57,.11);
  caja('Fondo_escenario','#282729',0,2.67,-8.78,14.9,5.34,.18);
  caja('Marco_pantalla',oscuro,0,3.06,-8.66,8.6,4.1,.15);
  caja('Pantalla_de_proyeccion','#e8e5dd',0,3.06,-8.57,8.25,3.75,.031);
  for (let fila=0;fila<filas;fila++) {
    const y = .22+fila*.22, z = -2.79+fila*1.17;
    caja('Terraza_fila','#57504a',0,y/2,z,15.2,y,1.17);
    for (const lado of [-1,1]) {
      const x = lado*6.98;
      caja('Zanco_escalonado_lateral','#666461',x,y-.105,z-.38,1.3,.21,.404);
      caja('Luz_embutida_escalon','#ddcaa1',x,y-.04,z-.552,.22,.05,.03);
    }
  }
  butacas('Asientos_oscuro','#3e3a3d',.66,.12,.58,.68,-2.86);
  butacas('Respaldos_oscuro','#464247',.69,.57,.13,.83,-2.55);
  butacas('Soporte_butacas','#28282a',.083,.44,.50,.45,-2.86);
  for (const lado of [-1,1]) {
    const x = lado*7.65;
    // Se corta el muro de observación y se conserva el lateral opuesto.
    const alto = lado<0?5.1:1.08;
    caja('Muro_lateral_de_corte','#d0c6b9',x,alto/2,-.8,.20,alto,15.9);
    if (lado<0) {
      for (let i=0;i<8;i++) {
        const z = -7.82+i*1.9;
        caja('Panel_vertical_acustico',madera,x+.133,2.81,z,.10,3.64,1.64);
      }
      for (const z of [-6.0,-3.15,-.3,2.55]) {
        caja('Fragmento_plafon_acustico','#e3e0d7',-5.58,4.82,z,4.02,.18,2.14);
        caja('Empotrado_plafon','#bbb4a7',-5.6,4.70,z,1.41,.09,.96);
      }
    }
  }
  caja('Muro_posterior_bajo','#b0a39a',0,1.13,6.61,15.34,2.26,.16);
  return {group,target:[0,1.6,-1.15],camera:[20,15.3,21],
    etiquetas:[
      {texto:'Auditorio Incalli Ixcahuicopa',posicion:[0,5.25,-8.78]},
      {texto:'Escalones laterales',posicion:[6.82,.77,.3]},
    ]};
}

export function crearVistaLibreria(THREE) {
  const group = new THREE.Group();
  group.name = 'Vista_esquematica_cancel_Libreria_C';
  group.userData = {approximate:true,visualOnly:true,reference:'Librería UAM-A y Aleph núm. 146, p. 4; disposición de mobiliario esquemática'};
  const {caja} = formas(THREE,group);
  const vidrio = new THREE.MeshStandardMaterial({color:'#bad2d0',transparent:true,opacity:.27,roughness:.22});
  const zCancel = .04, gris = '#8d9b99';
  caja('Corredor_terracota_Libreria','#a2604d',0,-.11,2.1,9.8,.22,4.2);
  caja('Piso_madera_Libreria','#946744',0,-.105,-2.8,9.6,.21,5.6);
  caja('Muro_posterior_de_corte','#d5c9b4',0,1.45,-5.60,9.6,2.9,.16);
  caja('Panel_lateral_Libreria','#5a5952',4.76,1.48,-2.8,.15,2.97,5.6);
  for (let z=-4.8;z<-.7;z+=1.23) {
    caja('Isla_de_madera_Libreria','#8f6849',0,.87,z,4.86,1.72,.52);
    for (const y of [.43,.94,1.44]) {
      caja('Canto_estante_Libreria','#bc9369',0,y,z,5.03,.087,.65);
      for (let i=0;i<14;i++) {
        const color = ['#896045','#815453','#a39162','#526a67'][Math.floor(i/2)%4];
        caja('Libros_en_exhibicion',color,-2.27+i*.343,y+.139,z+.17,.27,.19,.14);
      }
    }
  }
  for (const x of [-3.56,-2.17,-.75,.75,2.17,3.56]) {
    const pano = new THREE.Mesh(new THREE.BoxGeometry(1.365,2.72,.045),vidrio);
    pano.name = Math.abs(x)<1?'Hoja_acristalada_Libreria':'Fijo_acristalado_Libreria';
    pano.position.set(x,1.4,zCancel);
    group.add(pano);
    caja('Franja_esmerilada_Libreria','#b6c5bd',x,1.22,zCancel+.026,1.358,.31,.011);
  }
  for (const x of [-4.23,-2.87,-1.46,1.46,2.87,4.23]) {
    caja('Perfil_metalico_Libreria',gris,x,1.4,zCancel,.049,2.79,.08);
  }
  for (const x of [-.22,.22]) {
    caja('Tirador_Libreria','#c5cfcd',x,1.08,.108,.064,.47,.073);
    for (const dy of [-.22,.22]) caja('Soporte_tirador_Libreria','#bfcac7',x,1.08+dy,.07,.047,.044,.10);
  }
  for (const x of [-1.26,0,1.26]) {
    caja('Base_pedestal_control_Libreria','#777d79',x,.051,-.52,.19,.10,.41);
    caja('Pedestal_control_Libreria','#9ba5a0',x,.68,-.53,.095,1.33,.32);
  }
  // Aleph documenta tres cajas y un área de lockers. El corte conserva abierto el acceso central.
  for (const z of [-4.55,-3.35,-2.15]) {
    caja('Mostrador_caja_Libreria','#956c50',3.53,.51,z,.74,1.02,1.14);
    caja('Cubierta_mostrador_Libreria','#c19b74',3.51,1.035,z,.82,.11,1.20);
    caja('Terminal_caja_Libreria','#565b59',3.55,1.23,z,.12,.28,.30);
  }
  for (const z of [-1.38,-.94,-.50]) {
    for (let nivel=0;nivel<4;nivel++) {
      const y = .26 + nivel*.38;
      caja('Puerta_locker_Libreria','#a1a8a4',4.27,y,z,.38,.36,.416);
      caja('Cerradura_locker_Libreria','#5c6461',4.071,y,z-.116,.027,.085,.028);
    }
  }
  caja('Dintel_Libreria','#a8a398',0,2.99,.01,9.66,.42,.23);
  caja('Friso_rojo_Libreria','#8e3833',0,3.015,.149,6.0,.31,.07);
  return {group,target:[0,1.25,-.48],camera:[8.4,5.2,11.4],
    etiquetas:[{texto:'Librería UAM Azcapotzalco',posicion:[0,3.29,.16]}]};
}

export function crearVistaGaleriaDelTiempo(THREE) {
  const group = new THREE.Group();
  group.name = 'Corte_esquematico_Galeria_del_Tiempo_C';
  group.userData = {
    approximate: true,
    visualOnly: true,
    reference: 'Aleph 259 p. 12 y Aleph 368 p. 18. Sala C PB, Guía Universitaria núm. 183.'
  };
  const {caja} = formas(THREE,group);
  const muro = '#ece9e1';
  const marco = '#474440';
  caja('Piso_corte_Galeria','#aaa192',0,-.12,0,12.8,.24,9.4);
  caja('Muro_fondo_Galeria',muro,0,1.78,-4.6,12.8,3.56,.20);
  caja('Muro_lateral_Galeria',muro,-6.3,1.78,-.76,.20,3.56,7.48);
  caja('Seccion_muro_lateral_Galeria',muro,6.3,.38,-.76,.20,.76,7.48);
  caja('Rodapie_fondo_Galeria','#d3cbc0',0,.08,-4.479,12.36,.16,.045);
  caja('Rodapie_lateral_Galeria','#d3cbc0',-6.179,.08,-.76,.045,.16,7.24);
  for (let z=-3.9;z<4.5;z+=.78) {
    caja('Junta_piso_Galeria','#918a80',0,.001,z,12.4,.004,.013);
  }
  for (let x=-5.96;x<6.1;x+=.78) {
    caja('Junta_piso_Galeria','#918a80',x,.001,0,.013,.004,8.92);
  }

  // Los marcos representan el montaje sin reproducir las piezas expuestas.
  for (const [x,ancho,alto] of [[-4.69,1.10,1.00],[-2.87,1.14,1.14],[-.83,1.50,1.02],[1.45,1.42,1.06],[3.75,1.59,1.14]]) {
    caja('Marco_exposicion_Galeria',marco,x,1.69,-4.46,ancho,alto,.07);
    caja('Paspartu_neutro_Galeria','#f7f2e3',x,1.69,-4.418,ancho-.09,alto-.09,.027);
    caja('Plano_expositivo_neutro','#b6aea0',x,1.69,-4.40,ancho*.68,alto*.67,.009);
  }
  for (const [z,ancho] of [[-3.21,1.16],[-1.43,1.22],[.39,1.04]]) {
    caja('Marco_lateral_Galeria',marco,-6.17,1.71,z,.07,1.12,ancho);
    caja('Paspartu_lateral_Galeria','#f7f2e3',-6.129,1.71,z,.027,1.025,ancho-.09);
    caja('Plano_expositivo_lateral_neutro','#c5b7a4',-6.109,1.71,z,.009,.68,ancho*.67);
  }
  for (const z of [-3.33,-.30]) {
    caja('Riel_de_iluminacion_Galeria','#74716b',0,3.45,z,11.65,.09,.065);
    for (const x of [-4.7,-2.35,0,2.35,4.7]) {
      caja('Soporte_luminaria_Galeria','#77746d',x,3.30,z,.055,.24,.055);
      caja('Luminaria_dirigida_Galeria','#dedbd3',x,3.13,z-.055,.15,.16,.17);
    }
  }
  return {group,target:[0,1.11,-.4],camera:[11.9,9.0,13.7],etiquetas:[
    {texto:'Galería del Tiempo',posicion:[0,3.71,-4.45]}
  ]};
}
