import {BASE_ROUTES} from 'route-data';
import {intersectConvex, polygonArea, polygonsOverlap, rectanglePolygon, segmentPolygon, subtractObstacles} from 'site-clearance';

const materiales = {
  hormigon: '#aeafa8', hormigonClaro: '#bdb8a8', gris: '#939b94', terracota: '#a24a3f',
  metal: '#5e6967', vidrio: '#556d6e', reja: '#9e3d35', asfalto: '#606766',
  amarillo: '#d6b658', blanco: '#e6e2d2', cesped: '#758651',
};

// Vistas aéreas de Google Maps y Esri registradas al croquis. El tramo curvo
// termina antes de que el sendero desaparezca bajo las copas.
const curvaVisible = [[432,365],[427,361],[419,356],[413,352],[408,347],[405,342],[405,335]];
const pañosPuerta2 = [
  [[86,233],[157,231],[165,237],[165,291],[91,295],[86,289]],
  [[178,233],[269,233],[270,303],[263,309],[184,309],[178,303]],
];
// Bordes exactos de los trece segmentos genéricos centrados entre 336 y 432.

function preparar(THREE,data,net) {
  const root = new THREE.Group();
  root.name = 'Detalles_Maps_accesos_y_jardin_B_D';
  root.userData = {
    approximate:true,visualOnly:true,reference:'Auditoría Maps AZC, zonas 01–06',
    reservasAparcamiento:[], reservasArbolado:[],
  };
  const s = data.metersPerPixel;
  const punto = ([x,z]) => ({x:(x-895)*s,z:(z-390)*s});
  const rect = ([x0,z0,x1,z1]) => [[x0,z0],[x1,z0],[x1,z1],[x0,z1]].map(punto);
  const nodos = new Map(net.nodos.map(n => [n.id,n]));
  const pasos = net.aristas.flatMap(({de,a}) => {
    const inicio = nodos.get(de), fin = nodos.get(a);
    if (!inicio || !fin || inicio.nivel !== 0 || fin.nivel !== 0 ||
      Math.hypot(fin.x-inicio.x,fin.z-inicio.z) < .001) return [];
    return [segmentPolygon(inicio,fin,3.2)];
  });
  const huellas = data.buildings.flatMap(b => b.rects.map(([x0,z0,x1,z1]) => {
    const centro = punto([(x0+x1)/2,(z0+z1)/2]);
    const factor = b.diamond ? Math.SQRT1_2 : 1;
    return rectanglePolygon(centro.x+(b.offsetX||0),centro.z+(b.offsetZ||0),
      (x1-x0)*s*factor,(z1-z0)*s*factor,b.diamond ? (b.facadeYaw??Math.PI/4) : 0);
  }));
  const predio = data.site.map(punto);
  const paleta = new Map();
  const materialesUsados = new Set();
  const cubo = new THREE.BoxGeometry(1,1,1);
  function material(color) {
    if (!paleta.has(color)) paleta.set(color,new THREE.MeshStandardMaterial({color,roughness:.92}));
    return paleta.get(color);
  }
  function grupo(nombre,reference,origen={x:0,z:0}) {
    const group = new THREE.Group();
    group.name = nombre;
    group.position.set(origen.x,0,origen.z);
    group.userData = {approximate:true,visualOnly:true,reference};
    root.add(group);
    return group;
  }
  function malla(g,nombre,geometry,color) {
    const mesh = new THREE.Mesh(geometry,material(color));
    mesh.name = nombre;
    mesh.receiveShadow = true;
    if (!materialesUsados.has(color)) {
      mesh.userData.disposeMaterial = true;
      materialesUsados.add(color);
    }
    g.add(mesh);
    return mesh;
  }
  function caja(g,nombre,x,y,z,w,h,d,color) {
    const mesh = malla(g,nombre,cubo.clone(),color);
    mesh.position.set(x,y,z);
    mesh.scale.set(w,h,d);
    mesh.castShadow = h>1;
    return mesh;
  }
  function superficie(g,nombre,poligonos,y,color) {
    const positions = [];
    for (const contorno of poligonos) {
      const forma = contorno.map(p => new THREE.Vector2(p.x,p.z));
      for (const [a,b,c] of THREE.ShapeUtils.triangulateShape(forma,[])) {
        const [p,q,r] = [contorno[a],contorno[b],contorno[c]];
        const normalY = (q.z-p.z)*(r.x-p.x)-(q.x-p.x)*(r.z-p.z);
        for (const i of normalY>0 ? [p,q,r] : [p,r,q]) positions.push(i.x,y,i.z);
      }
    }
    if (!positions.length) return;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.computeVertexNormals();
    malla(g,nombre,geometry,color);
  }
  const libre = (x,z,w,d) => {
    const p = rectanglePolygon(x,z,w,d);
    return ![...huellas,...pasos].some(q => polygonsOverlap(p,q)) &&
      polygonArea(intersectConvex(p,predio))>w*d-1e-6;
  };
  return {THREE,root,s,punto,rect,pasos,huellas,predio,grupo,malla,caja,superficie,libre};
}

function portalPeatonal(ctx,gate,amplio) {
  const {grupo,caja,superficie,punto,libre} = ctx;
  const {hormigon,gris,terracota,vidrio,hormigonClaro} = materiales;
  const p = punto([gate.x,gate.y]);
  const mitad = amplio ? 3.4 : 2.12;
  const ladoTorre = amplio ? 1 : -1;
  const torreZ = ladoTorre*(mitad+.52), otraJamba = -ladoTorre*(mitad+.44);
  const bajoDintel = amplio ? 3.55 : 2.75, altoTorre = amplio ? 5.68 : 3.94;
  const g = grupo('Portico_Mapas_'+gate.id,'Street View, enero 2025',p);
  g.userData.existingGate = gate.id;
  g.userData.operationVerified = false;
  if (libre(p.x,p.z+torreZ,1.4,1.04)) {
    caja(g,'Torre_portico_'+gate.id,0,.14+altoTorre/2,torreZ,1.4,altoTorre,1.04,amplio?gris:terracota);
    if (amplio) for (const dz of [-.32,0,.32]) {
      caja(g,'Ranura_alta_torre_'+gate.id,-.712,3.79,torreZ+dz,.026,.76,.145,vidrio);
    }
  }
  if (libre(p.x,p.z+otraJamba,1.2,.88)) {
    caja(g,'Apoyo_portico_'+gate.id,0,(bajoDintel+.14)/2,otraJamba,1.2,bajoDintel-.14,.88,hormigon);
  }
  caja(g,'Dintel_portico_'+gate.id,0,bajoDintel+.20,0,1.82,.40,2*mitad+1.04,hormigon);
  g.userData.encuentrosReja = [torreZ, otraJamba].map(dz => [p.x, p.z + dz]);
  const alero = rectanglePolygon(.80,0,3.45,2*mitad-.2);
  // El delantal queda a ras del pavimento y deja libre el vano peatonal.
  superficie(g,'Piso_portico_'+gate.id,[alero],.322,hormigonClaro);
}

function detallesPuerta2(ctx,gate) {
  const {grupo,caja,punto,libre} = ctx;
  const {hormigon,gris,metal,vidrio,amarillo,blanco} = materiales;
  const p = punto([gate.x,gate.y]), g = grupo('Detalles_Puerta_2','Maps, diciembre 2023 y enero 2025',p);
  g.userData.existingGate = gate.id;
  const x = 3.86, z = 2.89, w = 1.90, d = 1.49;
  if (libre(p.x+x,p.z+z,w+.20,d+.20)) {
    caja(g,'Plinto_caseta_Puerta_2',x,.39,z,w,.14,d,hormigon);
    caja(g,'Base_caseta_Puerta_2',x,.77,z,w,.63,d,gris);
    caja(g,'Vidrio_caseta_Puerta_2',x,1.52,z,w-.05,.87,d-.05,vidrio);
    caja(g,'Alero_caseta_Puerta_2',x,2.06,z,w+.2,.19,d+.2,metal);
    for (const sx of [-1,1]) for (const sz of [-1,1]) {
      caja(g,'Montante_caseta_Puerta_2',x+sx*(w/2-.055),1.58,z+sz*(d/2-.055),.08,1.05,.08,metal);
    }
    caja(g,'Parteluz_caseta_Puerta_2',x-w/2+.02,1.52,z,.08,.91,.045,metal);
  }
  // Detalle exterior de la torre previa, sobre su arco hacia San Pablo.
  for (const a of [-.30,.30]) {
    const ventanilla = caja(g,'Ventanilla_baja_torre_Puerta_2',-Math.cos(a)*1.164,1.42,-4.70+Math.sin(a)*1.164,
      .055,.47,.24,metal);
    ventanilla.rotation.y = a;
  }
  for (let i=0; i<10; i++) {
    caja(g,'Franja_vado_Puerta_2',-.36,.341,-2.77+i*.54,1.46,.012,.28,i%2?blanco:amarillo);
  }
}

function estacionamientoPuerta2(ctx,data) {
  const {root,grupo,punto,rect,huellas,pasos,predio,superficie} = ctx;
  if (!data.parking[0] || data.removedElements?.includes('parking_0')) return;
  const area = data.parking[0], [x0,z0,x1,z1] = area;
  const centro = punto([(x0+x1)/2,(z0+z1)/2]);
  const edit = data.elementEdits?.parking_0 || {};
  const w = (x1-x0)*ctx.s, d = (z1-z0)*ctx.s;
  const cos = Math.cos(edit.rotation || 0), sin = Math.sin(edit.rotation || 0);
  const transformar = p => {
    const x = (p.x-centro.x)*(edit.width || w)/w, z = (p.z-centro.z)*(edit.depth || d)/d;
    return {x:centro.x+(edit.offsetX||0)+x*cos+z*sin,z:centro.z+(edit.offsetZ||0)-x*sin+z*cos};
  };
  const limite = rect(area).map(transformar);
  const recortar = p => intersectConvex(intersectConvex(p.map(transformar),limite),predio);
  const reserva = recortar(rect([78,226,272,314]));
  if (reserva.length<3) return;
  root.userData.reservasAparcamiento.push(reserva);
  root.userData.reservasArbolado.push(reserva);
  const g = grupo('Panos_estacionamiento_Puerta_2','Aéreas Google Maps y Esri, ajuste a parking_0');
  g.userData.existingParking = 'parking_0';
  const obstaculos = [...huellas,...pasos,...data.paths.map(rect),...(data.driveAisles||[]).map(rect)];
  const {asfalto,cesped,hormigonClaro,blanco} = materiales;
  for (const [i,pan] of pañosPuerta2.entries()) {
    const contorno = recortar(pan.map(punto));
    superficie(g,'Asfalto_paño_Puerta_2_'+i,subtractObstacles(contorno,obstaculos),.274,asfalto);
    const marcas = [];
    for (const x of i===0 ? [97.5,153] : [190,219.5]) {
      for (let z=242; z<=(i===0?288:302); z+=2.7/ctx.s) {
        const raya = rect([x-4.4/ctx.s/2,z-.115/ctx.s,x+4.4/ctx.s/2,z+.115/ctx.s]);
        const tramo = intersectConvex(recortar(raya),contorno);
        marcas.push(...subtractObstacles(tramo,obstaculos,.002));
      }
    }
    superficie(g,'Rayas_paño_Puerta_2_'+i,marcas,.297,blanco);
  }
  const paso = recortar(rect([169,229,175,306]));
  superficie(g,'Paso_entre_panos_Puerta_2',subtractObstacles(paso,obstaculos),.291,hormigonClaro);
  const jardin = recortar(rect([165.5,239,168.15,292]));
  superficie(g,'Franja_verde_entre_panos_Puerta_2',subtractObstacles(jardin,obstaculos),.280,cesped);
}

function detallarJardinBD(ctx,data,andador) {
  const {THREE,root,grupo,malla,caja,punto,rect,huellas,pasos,predio,superficie} = ctx;
  const g = grupo('Jardin_B_D_mobiliario_y_canteros',
    'Levantamiento UAM 2023, lámina VE 01/02, y registro fotográfico del jardín 2013 y 2017');
  const obstaculos = [...huellas,...pasos,...data.paths.map(rect),...andador];
  const tonoConcreto = '#a7a497';
  const mallaCircular = (nombre,x,y,z,rSuperior,rInferior,altura,color) => {
    const m = malla(g,nombre,new THREE.CylinderGeometry(rSuperior,rInferior,altura,20),color);
    m.position.set(x,y,z);
  };

  // El levantamiento permite reconocer el jardín y el alineamiento junto a C.
  // Los bordes de suelo, el mobiliario y la altura de los setos son aproximados.
  const paños = [
    {contorno:[[260,381],[304,373],[332,391],[338,418],[321,438],[264,435]],color:'#7d8c59'},
    {contorno:[[346,391],[381,382],[413,393],[417,422],[402,444],[348,444]],color:'#77874f'},
    {contorno:[[254,405],[274,403],[289,413],[298,432],[273,441],[255,431]],color:'#95866a'},
    {contorno:[[397,408],[421,400],[429,412],[429,432],[416,442],[397,432]],color:'#998b6c'},
  ];
  for (const [i,{contorno,color}] of paños.entries()) {
    const partes = subtractObstacles(intersectConvex(contorno.map(punto),predio),obstaculos);
    superficie(g,'Suelo_jardin_B_D_'+i,partes,.117+i*.004,color);
  }

  const setos = [[429.2,411,431.5,433.5],[429.2,439,431.5,448.3]];
  for (const [x0,z0,x1,z1] of setos) {
    const huella = rect([x0,z0,x1,z1]);
    if (obstaculos.some(p => polygonsOverlap(p,huella))) continue;
    const p = punto([(x0+x1)/2,(z0+z1)/2]), w = (x1-x0)*ctx.s, d = (z1-z0)*ctx.s;
    caja(g,'Bordillo_del_cantero_jardin_B_D',p.x,.15,p.z,w,.10,d,tonoConcreto);
    caja(g,'Seto_bajo_junto_a_C',p.x,.44,p.z,w-.18,.48,d-.16,'#4b6638');
    root.userData.reservasArbolado.push(huella);
  }

  for (const {x,z} of [[356,426],[380,426]].map(punto)) {
    const huella = rectanglePolygon(x,z,3.18,3.18);
    if (obstaculos.some(p => polygonsOverlap(p,huella))) continue;
    mallaCircular('Plataforma_circular_jardin_B_D',x,.159,z,1.58,1.59,.12,tonoConcreto);
    // La foto de las mesas muestra tierra apisonada hasta su encuentro con el césped.
    // El contorno se recorta contra las mismas reservas del jardín.
    const tierra = Array.from({length: 15}, (_, i) => {
      const angulo = i * Math.PI * 2 / 15;
      const radio = 2.14 + .15 * Math.sin(i * 2.4);
      return {x: x + radio * Math.cos(angulo), z: z + radio * Math.sin(angulo)};
    });
    const suelo = subtractObstacles(intersectConvex(tierra, predio), obstaculos);
    superficie(g, 'Tierra_bajo_la_mesa_del_jardin', suelo, .143, '#8d8169');
    mallaCircular('Pedestal_mesa_jardin_B_D',x,.529,z,.22,.31,.62,'#777b70');
    mallaCircular('Tablero_circular_jardin_B_D',x,.884,z,.74,.74,.09,'#babdb0');
    for (let i=0;i<4;i++) {
      const a = Math.PI*(.25+.5*i), asientoX = x+1.16*Math.cos(a), asientoZ = z+1.16*Math.sin(a);
      mallaCircular('Base_asiento_jardin_B_D',asientoX,.361,asientoZ,.14,.19,.284,'#777b70');
      mallaCircular('Asiento_independiente_jardin_B_D',asientoX,.538,asientoZ,.29,.27,.07,'#aeb1a2');
    }
    root.userData.reservasArbolado.push(huella);
  }
}


function senderoJardin(ctx,data) {
  const {THREE,root,grupo,punto,superficie,rect,huellas,predio} = ctx;
  const g = grupo('Andadores_observados_B_D','Vista aérea de Google Maps y Esri');
  const curva = new THREE.CatmullRomCurve3(curvaVisible.map(coordenadas => {
    const p = punto(coordenadas);
    return new THREE.Vector3(p.x,0,p.z);
  }));
  const bordes = curva.getPoints(18).map((p,i) => {
    const tangent = curva.getTangent(i/18);
    const half = .94;
    return [{x:p.x+tangent.z*half,z:p.z-tangent.x*half},
      {x:p.x-tangent.z*half,z:p.z+tangent.x*half}];
  });
  const tramos = bordes.slice(1).flatMap(([p,q],i) => {
    const [a,b] = bordes[i];
    return subtractObstacles(intersectConvex([a,b,q,p],predio),huellas,.004);
  });
  superficie(g,'Sendero_curvo_visible_desde_C',tramos,.313,'#b8af97');
  root.userData.reservasArbolado.push(...tramos);
  detallarJardinBD(ctx,data,tramos);
  const b = data.buildings.find(b => b.id==='B');
  if (b) {
    const [x0,z0,x1,z1] = b.rects[0];
    const adaptar = polygon => polygon.map(p => ({x:p.x+(b.offsetX||0),z:p.z+(b.offsetZ||0)}));
    const banda = adaptar(rect([x0+(x1-x0)*.23,z0-6.2,x1-9,z0-.25]));
    const terraza = subtractObstacles(intersectConvex(banda,predio),huellas);
    superficie(g,'Franja_pavimentada_jardin_B',terraza,.317,materiales.hormigonClaro);
    root.userData.reservasArbolado.push(...terraza);
    const bordeTecho = adaptar(rect([x0+.25,z0+.24,x0+(x1-x0)*.083,z1-.24]));
    superficie(g,'Remate_terracota_cubierta_B',[bordeTecho],
      (b.height??b.floors*data.storeyHeight)+.408,'#9b5245');
  }
}

export function bloqueaArboladoEnAccesos(reservas,x,z) {
  const tronco = rectanglePolygon(x,z,.9,.9);
  return reservas.some(poligono => polygonsOverlap(poligono,tronco));
}

export function crearDetallesMapsAccesos(THREE,data,net=BASE_ROUTES) {
  const ctx = preparar(THREE,data,net);
  for (const gate of data.gates) {
    if (gate.id==='V1') detallesPuerta2(ctx,gate);
    if (gate.id==='P1' || gate.id==='P2') portalPeatonal(ctx,gate,gate.id==='P2');
  }
  estacionamientoPuerta2(ctx,data);
  senderoJardin(ctx,data);
  return ctx.root;
}
