import {convexHull, intersectConvex, polygonsOverlap, rectanglePolygon, segmentPolygon, subtractObstacles} from 'site-clearance';

// El registro aéreo y las fotos a pie sitúan el jardín junto a la fachada E.
// Coordenadas en el croquis del campus, con el claro al este de la banda.
const jardinE = [[486,416],[594,416],[601,422],[599,433],[592,437],
  [567,436],[552,432],[528,433],[510,439],[486,438]];
const setosE = [
  [487,418,526,421], [531,418,554,421], [569,418,591,421],
];
// La planta de la UAM (SMEQ 2025, p. V) distingue dos islas centrales
// y jardines discontinuos al pie de C, F y G. Los límites siguen el croquis.
const jardinesPlaza = [
  [[486,459],[493,459],[498,464],[497,471],[486,474]],
  [[486,499],[492,499],[498,506],[499,534],[493,542],[486,540]],
  [[502,548],[541,547],[547,551],[547,559],[503,559],[499,555]],
  [[568,548],[615,544],[625,549],[624,559],[563,559],[563,552]],
  [[638,422],[647,422],[647,483],[641,490],[635,488],[634,429]],
  [[637,503],[647,503],[647,552],[640,554],[635,548]],
  [[573,449],[603,448],[607,454],[606,479],[600,483],[574,482],[570,474]],
  [[559,508],[569,503],[604,503],[609,509],[607,522],[601,528],[559,527],[555,521]],
];

function recorteRect([x0,z0,x1,z1], X, Z) {
  return [[x0,z0],[x1,z0],[x1,z1],[x0,z1]].map(([x,z]) => ({x:X(x),z:Z(z)}));
}

function triangulos(THREE, puntos) {
  const contorno = puntos.map(p => new THREE.Vector2(p.x,p.z));
  return THREE.ShapeUtils.triangulateShape(contorno,[]).map(t => t.map(i => puntos[i]));
}

function reservaDePasos(net) {
  const nodos = new Map((net?.nodos || []).map(n => [n.id,n]));
  const pasos = [];
  for (const tramo of net?.aristas || []) {
    const a = nodos.get(tramo.de), b = nodos.get(tramo.a);
    if (!a || !b || (a.nivel ?? 0) !== 0 || (b.nivel ?? 0) !== 0) continue;
    if (Math.hypot(a.x-b.x,a.z-b.z) < .001) continue;
    pasos.push(segmentPolygon(a,b,3.2),rectanglePolygon(a.x,a.z,3.2,3.2),
      rectanglePolygon(b.x,b.z,3.2,3.2));
  }
  return pasos;
}

function piso(THREE, grupo, nombre, contornos, y, material, periodo = 4) {
  const posiciones = [], uv = [];
  for (const contorno of contornos) {
    for (const [a,b,c] of triangulos(THREE,contorno)) {
      const normalY = (b.z-a.z)*(c.x-a.x) - (b.x-a.x)*(c.z-a.z);
      for (const p of normalY > 0 ? [a,b,c] : [a,c,b]) {
        posiciones.push(p.x,y,p.z);
        uv.push(p.x/periodo,p.z/periodo);
      }
    }
  }
  if (!posiciones.length) return;
  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute('position',new THREE.Float32BufferAttribute(posiciones,3));
  geometria.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geometria.computeVertexNormals();
  const mesh = new THREE.Mesh(geometria,material);
  mesh.name = nombre;
  mesh.receiveShadow = true;
  grupo.add(mesh);
  return mesh;
}

// Acabado artesanal dibujado por código. El despiece se repite en metros del modelo.
function losetaRoja(THREE) {
  const lado = 256, filas = 20, columnas = 12;
  const datos = new Uint8Array(lado*lado*4);
  for (let j=0; j<lado; j++) {
    const fila = j*filas/lado, filaBase = Math.floor(fila);
    for (let i=0; i<lado; i++) {
      const col = i*columnas/lado + filaBase%2*.5, colBase = Math.floor(col)%columnas;
      const junta = fila%1 < .067 || col%1 < .052;
      const tono = ((filaBase*31 + colBase*17 + filaBase*colBase*3)%23)-11;
      const grano = (i*37 + j*11 + i*j*3)%9-4;
      // La junta clara es más fina que el ladrillo que separa.
      const color = junta ? [181,132,117] : [156+tono,85+tono,72+tono];
      const pos = (j*lado+i)*4;
      datos.set([color[0]+grano,color[1]+grano,color[2]+grano,255],pos);
    }
  }
  return acabadoConMapa(THREE,datos,lado);
}

function acabadoConMapa(THREE, datos, lado) {
  const mapa = new THREE.DataTexture(datos,lado,lado);
  mapa.colorSpace = THREE.SRGBColorSpace;
  mapa.wrapS = mapa.wrapT = THREE.RepeatWrapping;
  mapa.magFilter = THREE.LinearFilter;
  mapa.minFilter = THREE.LinearMipmapLinearFilter;
  mapa.generateMipmaps = true;
  mapa.needsUpdate = true;
  return new THREE.MeshStandardMaterial({map:mapa,roughness:.95});
}

export function construirPlazaRoja({THREE,world,rect,box,material,X,Z,S,data,net}) {
  const plaza = new THREE.Group();
  plaza.name = 'Plaza_Roja_restaurada';
  plaza.userData = {approximate:true,reference:'Corpus 0025, 0040 y 0049, UAMFoto 2022, plano UAM de SMEQ 2025 e imagen aérea Esri'};
  world.add(plaza);

  const contorno = recorteRect(rect,X,Z);
  const pasos = reservaDePasos(net).filter(p => polygonsOverlap(p,contorno));
  const cortarJardin = (puntos, claros) => triangulos(THREE,puntos.map(([x,z]) => ({x:X(x),z:Z(z)})))
    .flatMap(p => subtractObstacles(intersectConvex(p,contorno),claros));
  const claroE = recorteRect([555,416,567,438],X,Z);
  const franjaE = cortarJardin(jardinE,[claroE,...pasos]);
  const otrosJardines = jardinesPlaza.flatMap(p => cortarJardin(p,pasos));
  const verde = [...franjaE,...otrosJardines];
  const alcorques = [];
  for (const [i,[px,pz]] of (data.jacarandas || []).entries()) {
    if (data.removedElements?.includes('jacaranda_'+i)) continue;
    const edit = data.elementEdits?.['jacaranda_'+i];
    const x = X(px)+(edit?.offsetX || 0), z = Z(pz)+(edit?.offsetZ || 0);
    const radio = 1.45+(i%3)*.35;
    const circulo = Array.from({length:10},(_,j) => {
      const angulo = j*Math.PI/5, r = radio*(1+.13*Math.sin(j*3+i));
      return {x:x+r*Math.cos(angulo),z:z+r*Math.sin(angulo)};
    });
    const libre = subtractObstacles(intersectConvex(convexHull(circulo),contorno),[...verde,...pasos]);
    alcorques.push(...libre);
  }
  const reservas = [...verde,...alcorques];
  const [x0,z0,x1,z1] = rect;
  // Se registra una junta larga clara y su línea oscura desde el tramo visible en la foto aérea.
  const ejeJunta = 541.5, anchoJunta = .94/S(), mediaLinea = .063/S()/2;
  const banda = recorteRect([ejeJunta-anchoJunta/2,z0,ejeJunta+anchoJunta/2,z1],X,Z);
  const linea = recorteRect([ejeJunta-mediaLinea,z0,ejeJunta+mediaLinea,z1],X,Z);
  const ladrillo = subtractObstacles(contorno,[...reservas,banda]);
  const concreto = subtractObstacles(intersectConvex(banda,contorno),reservas);
  const juntas = subtractObstacles(intersectConvex(linea,contorno),reservas,.001);
  const paños = piso(THREE,plaza,'Panos_loseta_artesanal_Plaza_Roja',ladrillo,.362,losetaRoja(THREE));
  if (paños) paños.userData.disposeMaterial = true;
  piso(THREE,plaza,'Banda_concreto_Plaza_Roja',concreto,.362,material('#bbb6aa'));
  piso(THREE,plaza,'Junta_central_Plaza_Roja',juntas,.366,material('#6d625b'));
  piso(THREE,plaza,'Franja_cesped_E_Plaza_Roja',franjaE,.335,material('#688453'));
  piso(THREE,plaza,'Jardines_discontinuos_Plaza_Roja',otrosJardines,.335,material('#6e8955'));
  piso(THREE,plaza,'Alcorques_Plaza_Roja',alcorques,.332,material('#786852'));
  // La línea de césped se interrumpe en los claros. Los setos se quedan en sus paños
  // y fuera de la reserva de los pasos, incluso al editar el trazado.
  for (const [sx0,sz0,sx1,sz1] of setosE) {
    for (let x=sx0; x<sx1; x+=2.8) {
      const d = Math.min(2.92,sx1-x);
      const base = recorteRect([x,sz0,x+d,sz1],X,Z);
      if (pasos.some(p => polygonsOverlap(base,p))) continue;
      const xc = X(x+d/2), zc = Z((sz0+sz1)/2);
      box(plaza,'Seto_bajo_Plaza_Roja',xc,.56,zc,d*S(),.44,(sz1-sz0)*S(),'#4d693e');
    }
  }
  return plaza;
}

// El grano y las juntas pertenecen al solado, sin geometría por encima del paso.
function pavimentoGaleriaF(THREE) {
  const lado = 128, piezas = 4;
  const datos = new Uint8Array(lado*lado*4);
  for (let j=0; j<lado; j++) {
    for (let i=0; i<lado; i++) {
      const col=i*piezas/lado, fila=j*piezas/lado;
      const junta=col%1<.032 || fila%1<.032;
      const particula=(i*23+j*31+(i*j)%37)%23;
      const base=junta?158:181+4*((Math.floor(col)+3*Math.floor(fila))%4);
      const tono=base+(particula<5?-23:particula-10);
      datos.set([tono,tono,tono-6,255],(j*lado+i)*4);
    }
  }
  return acabadoConMapa(THREE,datos,lado);
}

export function construirCuerpoConGaleriaF({THREE,part,w,d,h,box,material,data}) {
  const piso1 = data.storeyHeight, piso2 = Math.min(h,piso1*2);
  const front = -d/2, fondo = Math.min(2.65,d*.24), pared = front+fondo;
  const claro = piso2-piso1;
  box(part,'Cuerpo_F_PB',0,piso1/2,0,w,piso1,d,'#d3d0bd');
  if (h>piso2) box(part,'Cuerpo_F_niveles_superiores',0,(h+piso2)/2,0,w,h-piso2,d,'#d3d0bd');
  box(part,'Cuerpo_F_P1_rehundido',0,(piso1+piso2)/2,fondo/2,w,claro,d-fondo,'#d3d0bd');

  const g = new THREE.Group();
  g.name = 'Galeria_abierta_F_piso_1';
  g.userData = {approximate:true,level:1,side:'Plaza Roja',reference:'Corpus imagen_0049'};
  part.add(g);
  const centro = front+fondo/2, paso = w-.24;
  const extremo = paso/2, zPasillo = front+.21, zMuro = pared-.102;
  const areaPiso = recorteRect([-extremo,zPasillo,extremo,zMuro],x=>x,z=>z);
  piso(THREE,g,'F_pavimento_granulado_galeria_piso_1',[areaPiso],piso1+.004,pavimentoGaleriaF(THREE),2.5)
    .userData.disposeMaterial = true;
  box(g,'Losa_galeria_F_P1',0,piso1-.14,centro,w,.28,fondo,'#aaa9a1');
  box(g,'Antepecho_concreto_F_P1',0,piso1+.53,front+.105,w,1.06,.21,'#b3b4ad');
  box(g,'Cara_interior_antepecho_F_P1',0,piso1+.53,front+.219,paso,1.045,.017,'#888a80');
  box(g,'Remate_antepecho_F_P1',0,piso1+1.075,front+.105,w,.055,.21,'#c7c8c0');
  box(g,'Dala_superior_galeria_F_P1',0,piso2-.265,front+.13,w,.53,.26,'#a8a9a2');
  box(g,'Cara_interior_dala_F_P1',0,piso2-.332,front+.267,paso,.395,.014,'#8a8d83');
  box(g,'Plafon_galeria_F_P1',0,piso2-.065,centro,w,.13,fondo,'#dfddd2');

  // La foto muestra accesos remetidos desde la galería. Se esquematizan los
  // dos que se distinguen en la toma, conservando el volumen detrás del muro.
  const puertas = [
    {x:extremo-15.1,ancho:1.03,color:'#823936'},
    {x:extremo-7.4,ancho:1.12,color:'#615c53'},
  ].filter(p=>p.x-p.ancho/2>-extremo);
  const panos = [];
  let inicio = -extremo;
  for (const {x,ancho,color} of puertas) {
    const izq = x-ancho/2, der = x+ancho/2, alto = Math.min(2.24,claro-.62);
    panos.push([inicio,izq]);
    box(g,'Hoja_rehundida_galeria_F',x,piso1+alto/2,pared-.026,ancho-.16,alto,.052,color);
    box(g,'Dintel_acceso_galeria_F',x,piso1+(alto+claro)/2,pared-.075,ancho,claro-alto,.15,'#d6d5c9');
    for (const borde of [izq,der]) box(g,'Jamba_concreto_galeria_F',borde,piso1+alto/2,pared-.082,.13,alto,.17,'#bbb9ad');
    box(g,'Tirador_acceso_galeria_F',x+ancho*.26,piso1+1.025,pared-.058,.047,.18,.029,'#b3ad9d');
    inicio = der;
  }
  panos.push([inicio,extremo]);

  const altoVentana = .46, yVentana = piso2-.71;
  box(g,'Ventana_corrida_alta_F_P1',0,yVentana,pared-.113,paso,altoVentana,.027,'#628589');
  box(g,'Marco_horizontal_ventana_F_P1',0,yVentana-altoVentana/2,pared-.137,paso,.057,.042,'#c2c6be');
  for (let x=-extremo+.45; x<extremo; x+=1.8) {
    box(g,'Marco_ventana_alta_F_P1',x,yVentana,pared-.132,.055,altoVentana+.05,.043,'#d0d3ca');
  }
  for (let x=-extremo+1.6; x<extremo-1; x+=4.2) {
    box(g,'Perfil_luminaria_recesada_F_P1',x,piso2-.145,centro,.36,.03,1.10,'#a4a69c');
    box(g,'Difusor_luminaria_transversal_F_P1',x,piso2-.165,centro,.29,.018,1.01,'#efeee1');
  }
  for (let x=extremo-1.15; x>-extremo; x-=8.4) {
    box(g,'Encuentro_transversal_plafon_F_P1',x,piso2-.138,centro,.032,.015,fondo-.04,'#a39f92');
  }

  // Las juntas siguen cada paño de tabique y terminan en las jambas.
  const juntas = [];
  for (const [izq,der] of panos) {
    const ancho = der-izq, cx = (izq+der)/2;
    box(g,'Tabique_blanco_galeria_F_P1',cx,(piso1+piso2)/2,pared-.05,ancho,claro,.10,'#d6d5c9');
    box(g,'Zoclo_tabique_galeria_F_P1',cx,piso1+.053,pared-.112,ancho,.10,.026,'#aaa89d');
    for (let y=piso1+.22; y<yVentana-.29; y+=.16) {
      juntas.push(izq,y,pared-.111,der,y,pared-.111);
      const desfase = Math.round((y-piso1)/.16)%2*.20;
      for (let x=izq+.40+desfase; x<der; x+=.40) juntas.push(x,y-.15,pared-.111,x,y,pared-.111);
    }
  }
  const lineas = new THREE.BufferGeometry();
  lineas.setAttribute('position',new THREE.Float32BufferAttribute(juntas,3));
  const line = new THREE.LineSegments(lineas,new THREE.LineBasicMaterial({color:'#b9b7aa'}));
  line.name = 'Juntas_tabique_galeria_F_P1';
  line.userData.disposeMaterial = true;
  g.add(line);
  // El patrón negro y amarillo marca la junta fotografiada de un extremo.
  const xJunta = w/2-1.05, zPiso = front+.24, zPared = pared-.11;
  const base = recorteRect([xJunta-.145,zPiso,xJunta+.145,zPared],x=>x,z=>z);
  piso(THREE,g,'Junta_amarilla_galeria_F_P1',[base],piso1+.009,material('#ceb558'));
  const rayas = [];
  for (let z=zPiso; z<zPared-.10; z+=.20) {
    const banda = [{x:xJunta-.145,z},{x:xJunta+.145,z:z+.14},
      {x:xJunta+.145,z:z+.23},{x:xJunta-.145,z:z+.09}];
    const tramo = intersectConvex(banda,base);
    if (tramo.length) rayas.push(tramo);
  }
  piso(THREE,g,'Rayas_negras_junta_F_P1',rayas,piso1+.012,material('#3c3c3a'));
  const xPlaca = w/2-2.35, yPlaca = piso2-.34, anchoPlaca = fondo-.46;
  box(g,'Placa_guinda_galeria_F_P1',xPlaca,yPlaca,centro,.08,.29,anchoPlaca,'#7b2b2b');
  for (const z of [centro-anchoPlaca*.33,centro+anchoPlaca*.33]) {
    box(g,'Sujecion_rotulo_F_P1',xPlaca,piso2-.161,z,.023,.072,.024,'#72665d');
  }
  if (typeof document !== 'undefined') {
    const lienzo = document.createElement('canvas');
    lienzo.width = 512;
    lienzo.height = 80;
    const ctx = lienzo.getContext('2d');
    ctx.fillStyle = '#7b2b2b';
    ctx.fillRect(0,0,512,80);
    ctx.fillStyle = '#f3ede5';
    ctx.font = 'bold 49px sans-serif';
    ctx.fillText('Edificio F',24,57);
    ctx.font = '30px sans-serif';
    ctx.fillText('1er Piso',295,56);
    const mapa = new THREE.CanvasTexture(lienzo);
    mapa.colorSpace = THREE.SRGBColorSpace;
    const frente = new THREE.Mesh(new THREE.PlaneGeometry(anchoPlaca,.29),
      new THREE.MeshBasicMaterial({map:mapa}));
    frente.name = 'Rotulo_edificio_F_piso_1';
    frente.position.set(xPlaca+.041,yPlaca,centro);
    frente.rotation.y = Math.PI/2;
    frente.userData.disposeMaterial = true;
    g.add(frente);
  }
  return g;
}

export function construirPorticoV1({THREE,world,gate,box,slab,material,X,Z,S}) {
  const grupo = new THREE.Group();
  grupo.name = 'Portico_San_Pablo_V1';
  grupo.userData = {approximate:true,existingGate:gate.id,reference:'Street View, enero 2025',operationVerified:false};
  world.add(grupo);
  const x = X(gate.x), z = Z(gate.y), margen = 3.7;
  const hormigon = '#a9aea8', cementoOscuro = '#858c87', reja = '#963a34';
  const torre = new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.15,6.4,24),material(cementoOscuro));
  torre.name = 'Torre_cilindrica_San_Pablo';
  torre.position.set(x,3.42,z-margen-1.0);
  torre.castShadow = torre.receiveShadow = true;
  grupo.add(torre);
  box(grupo,'Jamba_norte_San_Pablo',x,2.26,z+margen+.42,1.50,4.06,.84,hormigon);
  box(grupo,'Dintel_concreto_San_Pablo',x,4.96,z,2.15,1.17,2*margen+1.14,hormigon);
  for (const lado of [-1,1]) {
    const extremo = z+lado*(margen+2.05);
    box(grupo,'Trabe_reja_lateral_San_Pablo',x,1.84,extremo,.09,.10,2.8,reja);
    box(grupo,'Zocalo_reja_lateral_San_Pablo',x,.47,extremo,.08,.08,2.8,reja);
    for (let k=-1.34; k<=1.4; k+=.18) {
      box(grupo,'Barra_reja_lateral_San_Pablo',x,1.15,extremo+k,.075,1.37,.063,reja);
    }
  }
  const mitadPx = (margen-.09)/S();
  const bordePredio = 60;
  slab(grupo,[bordePredio,gate.y-mitadPx,gate.x+2,gate.y+mitadPx],'#b8b4a7',.128,.10,'Atrio_de_acceso_San_Pablo');
  slab(grupo,[48,gate.y-mitadPx,bordePredio,gate.y+mitadPx],'#b8b4a7',.128,.10,'Atrio_exterior_San_Pablo').userData.fueraDelPredio = true;
  // Las rayas van perpendicularmente al cruce, sobre el tramo existente de avenida.
  for (let cx=24; cx<47; cx+=.80/S()) {
    slab(grupo,[cx,gate.y-3.6,Math.min(cx+.38/S(),47.6),gate.y+3.6],
      '#ddd9ca',.076,.011,'Paso_cebra_San_Pablo').userData.fueraDelPredio = true;
  }
  return grupo;
}
