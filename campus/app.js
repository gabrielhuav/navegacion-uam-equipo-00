import * as THREE from 'three';
import {OrbitControls} from 'orbit';
import {GLTFExporter} from 'exporter';
import {ORIGINAL} from 'model-data';
import {copyrightPanelsForSite} from 'copyright-layout';
import {createRouteEditor} from 'route-editor';
import {BASE_ROUTES,ROUTE_GEO} from 'route-data';
import {gPassage} from 'route-space';
import {rectanglePolygon,segmentPolygon,convexHull,polygonArea,polygonsOverlap,subtractObstacles,intersectConvex} from 'site-clearance';
import {agregarDetallesCorpus} from 'detalles-corpus';
import {liberarAccesosModelados} from 'accesos-modelados';
import {mejorarArquitecturaCorpus} from 'detalles-arquitectura-corpus';
import {agregarEntornoCorpus} from 'detalles-entorno-corpus';
import {crearInteriorBiblioteca,crearInteriorG302,crearInteriorL} from 'interiores-biblioteca-g';
import {crearInteriorCafeteria} from 'interior-cafeteria';
import {crearInteriorW,crearInteriorR} from 'interiores-w-r';
import {construirBardaFrenteT,construirCubiertaL,detallarFachadaH,detallarVestibuloHO,construirFachadaKEstacionamiento} from 'detalles-academicos-maps';
import {bloqueaArboladoEnAccesos,crearDetallesMapsAccesos,tramoRejaCICTE} from 'detalles-maps-accesos';
import {crearDetallesMapsPlazas,detallarAroSerpentina} from 'detalles-maps-plazas';
import {crearDetallesMapsPonente,cubrePerimetroMapsPonente} from 'detalles-maps-ponente';
import {crearDetallesMapsCorredorCultural,detallarGaleriaCulturalE,crearInteriorIncalli,crearVistaLibreria,crearVistaGaleriaDelTiempo} from 'detalles-maps-corredor-cultural';
import {construirAndadorMulticanchas,construirCanchasDeportivas,construirGradasDeportivas,construirFachadaQ,detallarAccesoDeportivo,perimetroCruzaFutbol7,superficiesDeportivas} from 'detalles-deportivos-maps';
import {construirJardinTresGracias} from 'jardin-tres-gracias';
import {parcelasVerdesHHP,andadorHHP,trazadosHHP,construirPaisajeHHP} from 'paisaje-h-hp';
import {contornoPlazaEgresados,crearPlazaEgresados} from 'plaza-egresados';
import {andadorAcademico,jardinesAcademicos,construirPaisajeAcademico} from 'paisaje-academico';
import {construirEdificioO,construirGaleriaSTalleres,reconstruirCubiertasTalleres} from 'sector-talleres-deportes';
import {construirPlazaRoja,construirCuerpoConGaleriaF,construirPorticoV1} from 'sector-acceso-plaza';
import {crearPlazasAjedrez} from 'plazas-ajedrez';
import {construirFachadaM,construirGimnasioExteriorM} from 'recintos-deportivos';

const $=id=>document.getElementById(id);
const editables=new Map();
let editMode=false,editSelected='',undoHistory=[],redoHistory=[],savedData='',isSaving=false,drawStart=null,drawPreview=null,dragEdit=null;
let georeference=ROUTE_GEO,routeEditor=null;
let data=structuredClone(ORIGINAL), world, vegetation, buildingGroups=new Map(), labels=[], selected='', topMode=false,focusMode=false;
let detallesAccesos,reservasArboladoCultural=[];
const mount=$('viewport'), labelLayer=$('labels');
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor('#edf1ed');renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
mount.prepend(renderer.domElement);
const scene=new THREE.Scene();scene.fog=new THREE.Fog('#edf1ed',1400,2300);
scene.add(new THREE.HemisphereLight('#fff6e6','#4b6750',2.3));
const sun=new THREE.DirectionalLight('#fff3de',3);sun.position.set(-280,550,320);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-500,right:500,top:500,bottom:-500,near:1,far:1200});sun.shadow.bias=-.0003;sun.shadow.normalBias=.5;scene.add(sun);
const perspective=new THREE.PerspectiveCamera(42,1,1,3000), ortho=new THREE.OrthographicCamera(-460,460,270,-270,1,2500);let camera=perspective;
const interiorScene=new THREE.Scene();
interiorScene.background=new THREE.Color('#f0eee8');
interiorScene.add(new THREE.HemisphereLight('#fff8ed','#666c72',2.2));
const interiorSun=new THREE.DirectionalLight('#fff6e6',2.55);
interiorSun.position.set(12,21,10);interiorSun.castShadow=true;
interiorSun.shadow.mapSize.set(1024,1024);
Object.assign(interiorSun.shadow.camera,{left:-16,right:16,top:15,bottom:-15,near:1,far:52});
interiorSun.shadow.normalBias=.025;interiorScene.add(interiorSun);
const interiorCamera=new THREE.PerspectiveCamera(42,1,.1,220);
let activeInterior=null,interiorLabels=[];
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=30;controls.maxDistance=1500;controls.maxPolarAngle=THREE.MathUtils.degToRad(78);controls.target.set(0,0,10);
const grid=new THREE.GridHelper(1000,100,'#6f8f80','#b9c9bc');grid.position.y=.3;grid.visible=false;scene.add(grid);
const matCache=new Map();
function material(color){if(!matCache.has(color))matCache.set(color,new THREE.MeshStandardMaterial({color,roughness:.88}));return matCache.get(color);}
const cube=new THREE.BoxGeometry(1,1,1), cylinder=new THREE.CylinderGeometry(1,1,1,7), crown=new THREE.IcosahedronGeometry(1,1);
const translucentRoof=new THREE.MeshPhysicalMaterial({color:'#ede6c1',transparent:true,opacity:.32,roughness:.25,metalness:0,side:THREE.DoubleSide,depthWrite:false});
function box(parent,name,x,y,z,w,h,d,color){const o=new THREE.Mesh(cube,material(color));o.name=name;o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=h>1;o.receiveShadow=true;parent.add(o);return o;}
const S=()=>data.metersPerPixel;
const X=px=>(px-895)*S(),Z=py=>(py-390)*S();
function slab(parent,r,color,y=.18,height=.25,name='Superficie'){return box(parent,name,X((r[0]+r[2])/2),y,Z((r[1]+r[3])/2),(r[2]-r[0])*S(),height,(r[3]-r[1])*S(),color);}
function meshPoly(parent,points,y,color,name){const shape=new THREE.Shape();points.forEach((p,i)=>i?shape.lineTo(X(p[0]),-Z(p[1])):shape.moveTo(X(p[0]),-Z(p[1])));shape.closePath();const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape),material(color));mesh.rotation.x=-Math.PI/2;mesh.position.y=y;mesh.receiveShadow=true;mesh.name=name;parent.add(mesh);return mesh;}
function line(parent,points,color='#eeeee0',width=.22,y=.5){for(let i=1;i<points.length;i++){let a=points[i-1],b=points[i],dx=b[0]-a[0],dz=b[1]-a[1];let o=box(parent,'Línea', (a[0]+b[0])/2,y,(a[1]+b[1])/2,width,.04,Math.hypot(dx,dz),color);o.rotation.y=Math.atan2(dx,dz);}}
function label(text,x,y,z,cls=''){const el=document.createElement('div');el.className='label '+cls;el.textContent=text;labelLayer.append(el);labels.push({el,p:new THREE.Vector3(x,y,z)});}
function pavilion(parent,b,w,d,h){
 const story=data.storeyHeight,r=w*.46,depthScale=d/w*.72;
 parent.userData={facadeFacing:'parking',facadeYaw:b.facadeYaw,pavilion:true,curvedFacade:true,upperLevel:3,roofMaterial:'Translúcido aproximado; material real no confirmado'};
 box(parent,'Núcleo del pabellón',0,h/2,-d*.15,w*.88,h,d*.62,'#c8c4b8');
 function arc(name,y,height,mat){const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,height,40,1,true,-Math.PI/2,Math.PI),mat);o.name=name;o.position.set(0,y,-d*.03);o.scale.z=depthScale;o.castShadow=!mat.transparent;parent.add(o);return o;}
 function floor(y,name){const shape=new THREE.Shape();shape.moveTo(-r,d*.46);shape.lineTo(-r,d*.03);for(let i=0;i<=40;i++){const a=-Math.PI/2+i*Math.PI/40;shape.lineTo(r*Math.sin(a),d*.03-r*Math.cos(a)*depthScale);}shape.lineTo(r,d*.46);shape.closePath();const o=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.25,bevelEnabled:false}),material('#c8c7bb'));o.name=name;o.rotation.x=-Math.PI/2;o.position.y=y-.25;o.receiveShadow=true;o.castShadow=true;parent.add(o);}
 for(let f=0;f<b.floors;f++){
  floor(f===0?.35:f*story,'Losa_pabellón_'+f);
  arc('Antepecho_curvo_'+f,f*story+.72,1.18,material('#c6c7c0'));
  // Gárgola/desagüe central oscuro en cada balcón curvo de concreto martelinado (imagen_0005, 0006).
  box(parent,'Gargola_balcon_curvo',0,f*story+.72,-d*.03-r*depthScale-.12,.38,.32,.28,'#3a3e40');
  if(f<3)arc('Ventanal_curvo_'+f,f*story+2.15,.9,material('#455a5e'));
  else arc('Cierre_translúcido_superior',f*story+2.1,1.6,translucentRoof);
 }
 // Muros laterales macizos color rojo terracota con entrecalles horizontales, celosía blanca vertical y ménsulas rojas (imagen_0005, 0006, 0007).
 for(const side of [-1,1]){
  box(parent,'Remate_terracota',side*(w/2-.55),h/2,-d*.06,1.65,h+.45,d*.84,'#b6483e');
  for(let f=1;f<=b.floors;f++)box(parent,'Junta_muro_terracota',side*(w/2-.55),f*story-.1,-d*.06,1.72,.08,d*.85,'#7e2d26');
  for(let f=1;f<b.floors;f++)box(parent,'Mensula_roja_pabellon',side*(w/2+.35),f*story-.15,d*.22,.55,.42,.28,'#9e2629');
 }
 for(let y=1.2;y<h;y+=.45)box(parent,'Celosia_blanca_pabellon',-w/2-.05,y,d*.18,1.15,.12,.95,'#eceee9');
 const roofBase=h+.25,rise=1.15,coverDepth=d*.97,half=w*.52;
 function beam(name,a,b,radius=.085){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),dir=bv.clone().sub(av);const mesh=new THREE.Mesh(cylinder,material('#d0ac37'));mesh.name=name;mesh.position.copy(av).add(bv).multiplyScalar(.5);mesh.scale.set(radius,dir.length(),radius);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());mesh.castShadow=true;parent.add(mesh);}
 for(const side of [-1,1]){
  const panel=new THREE.Mesh(cube,translucentRoof);panel.name='Cubierta_translúcida_superior';panel.position.set(side*half/2,roofBase+rise/2,0);panel.scale.set(Math.hypot(half,rise),.07,coverDepth);panel.rotation.z=-side*Math.atan2(rise,half);parent.add(panel);
  beam('Marco_amarillo_borde',[side*half,roofBase,-coverDepth/2],[side*half,roofBase,coverDepth/2]);
 }
 beam('Cumbrera_amarilla',[0,roofBase+rise,-coverDepth/2],[0,roofBase+rise,coverDepth/2]);
 for(let i=0;i<=5;i++){const z=-coverDepth/2+i*coverDepth/5;for(const side of [-1,1]){beam('Cercha_amarilla',[side*half,roofBase,z],[0,roofBase+rise,z]);beam('Diagonal_amarilla',[side*half,roofBase,z],[0,roofBase,z]);beam('Columna_amarilla',[side*half,3*story,z],[side*half,roofBase,z],.07);}}
}

function reinforceG(parent,w,d,h,floors){
 const group=new THREE.Group();group.name='Refuerzos_estructurales_G';group.userData={building:'G',sides:[-1,1],approximate:true};parent.add(group);
 function beam(name,a,b,holder=group,thickness=.38,color='#b9252d'){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av),o=new THREE.Mesh(cube,material(color));o.name=name;o.position.copy(av).add(bv).multiplyScalar(.5);o.scale.set(thickness,delta.length(),thickness);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());o.castShadow=true;holder.add(o);}
 // Siete módulos longitudinales: 3 al norte (0..2), 1 SOLO vano central de paso abierto (bay===3), y 3 al sur (4..6).
 const bays=7,step=(d-2)/bays,graphite='#4d555b',spandrel='#cbc9be',zCenter=-d/2+1+3.5*step;
 for(const side of [-1,1]){const face=new THREE.Group();face.name='Fachada_reforzada_'+(side<0?'Plaza_Roja':'COSEI');face.userData={side,building:'G'};group.add(face);
  box(face,'G_fascia_grafito_G',side*(w/2+.38),h-.55,0,.82,1.35,d+.3,graphite);
  for(let bay=0;bay<=bays;bay++){
   const z=-d/2+1+bay*step,isPortalEdge=bay===3||bay===4,isMajor=[0,2,5,7].includes(bay);
   box(face,'Pilastra_gris_G',side*(w/2+.28),h/2,z,.65,h,.95,isPortalEdge?'#d8d9d2':'#a8afae');
   if(isMajor)box(face,'G_machon_grafito_G',side*(w/2+.44),h/2,z,.92,h+.15,2.45,graphite);
  }
  for(const zSpan of [[-d/2+1,-d/2+1+3*step],[-d/2+1+4*step,d/2-1]]){
   const zMid=(zSpan[0]+zSpan[1])/2,len=zSpan[1]-zSpan[0]-1.4;
   box(face,'G_banca_corrida_PB',side*(w/2+.75),.42,zMid,.9,.46,len,'#c7c5b8');
  }
  for(let f=0;f<floors;f++){const y=f*data.storeyHeight+.65;
   // El único vano central (bay 3) no lleva faldón de concreto en ningún nivel; en PB queda libre y en pisos superiores sólo cruzan vigas rojas esbeltas (imagen_0080, 0086).
   for(const zSpan of [[-d/2+.6,-d/2+1+3*step],[-d/2+1+4*step,d/2-.6]]){
    box(face,'G_dintel_concreto_G',side*(w/2+.32),y-.18,(zSpan[0]+zSpan[1])/2,.58,.68,zSpan[1]-zSpan[0],spandrel);
    if(f===0)box(face,'Dintel_rojo_G',side*(w/2+.65),y+.05,(zSpan[0]+zSpan[1])/2,.45,.32,zSpan[1]-zSpan[0]-.4,'#b9252d');
   }
   if(f>0){
    box(face,'Dintel_rojo_G',side*(w/2+.65),y+.05,0,.45,.32,d-2,'#b9252d');
    box(face,'G_barandal_rojo_vano_central',side*(w/2+.55),y+.55,zCenter,.22,.26,step-.6,'#c4282e');
   }
   for(let bay=0;bay<bays;bay++){
    if(bay===3)continue; // Un único cuadro central sin diagonales (paso peatonal en PB y vestíbulo abierto arriba).
    const z=-d/2+1+bay*step,x=side*(w/2+.73);
    beam('Diagonal_roja_G',[x,y,z+.45],[x,y+2.05,z+step*.34],face);
    beam('Diagonal_roja_G',[x,y+2.05,z+step*.66],[x,y,z+step-.45],face);
    beam('Diagonal_roja_G',[x,y+.12,z+.65],[x,y+1.95,z+step*.36],face,.24);
    beam('Diagonal_roja_G',[x,y+1.95,z+step*.64],[x,y+.12,z+step-.65],face,.24);
    beam('G_travesano_rojo_G',[x,y+2.05,z+step*.32],[x,y+2.05,z+step*.68],face,.36);
   }
  }
 }
 for(const dz of [-1.4,1.4]){
  const base=box(group,'G_base_domo_ventilacion',w/2+3.6,.32,-d*.16+dz,1.35,.42,1.35,'#9da095');
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(.82,.88,.18,24),material('#dedfd6'));cap.name='G_domo_ventilacion';cap.position.set(base.position.x,.62,base.position.z);group.add(cap);
 }
}

function azcBuildingG(part,b,w,d,h){
 const story=data.storeyHeight,{step,z0,z1,zCenter}=gPassage(d);
 const northLen=z0-(-d/2),southLen=d/2-z1;
 // PB dividida en dos cuerpos para dejar el vano central (1 solo cuadro) abierto de lado a lado entre COSEI y Plaza Roja.
 box(part,'Cuerpo_PB_norte_G',0,story/2,-d/2+northLen/2,w,story,northLen,'#d4d6d1');
 box(part,'Cuerpo_PB_sur_G',0,story/2,z1+southLen/2,w,story,southLen,'#d4d6d1');
 // Niveles 1, 2 y 3 sobre PB; en el vano central tienen pasillo/puente con vista pasante.
 box(part,'Cuerpo_superior_norte_G',0,(h+story)/2,-d/2+northLen/2,w,h-story,northLen,'#d4d6d1');
 box(part,'Cuerpo_superior_sur_G',0,(h+story)/2,z1+southLen/2,w,h-story,southLen,'#d4d6d1');
 for(let f=2;f<b.floors;f++){
  box(part,'Losa_puente_central_G_'+f,0,f*story+.1,zCenter,w*.28,.22,step+.1,'#cacbc4');
 }
 // Muros laterales del pasaje central con canceles de acceso a escaleras/aulas de G y plafón con luminarias (imagen_0080, 0086).
 for(const zWall of [z0+.08,z1-.08]){
  box(part,'G_cancel_acceso_tunel',0,1.55,zWall,w*.72,2.5,.12,'#2f4449');
  for(let x=-w*.3;x<=w*.3;x+=w*.2)box(part,'G_montante_tunel',x,1.55,zWall,.1,2.55,.16,'#dcded8');
 }
 for(const xLight of [-w*.28,0,w*.28])box(part,'G_luminaria_paso_central',xLight,2*story-.06,zCenter,1.4,.08,.35,'#f4f2e8');
 // Andador de ladrillo rojo y rampas de transición que cruzan por dentro del túnel central de G de Plaza COSEI a Plaza Roja.
 box(part,'G_andador_paso_central',0,.25,zCenter,w+24,.14,step*.86,'#b5654d');
 for(const side of [-1,1]){
  const ramp=box(part,'G_rampa_paso_central',side*(w/2+1.35),.22,zCenter,2.7,.12,step*.8,'#c8c4b6');
  ramp.rotation.z=side*.04;
 }
 // Ventanas por crujía sin tapar el túnel central de PB ni el vano central.
 for(let f=0;f<b.floors;f++){
  const wy=f*story+2;
  for(const side of [-1,1]){
   box(part,'Ventana_lateral_norte_nivel_'+f,side*(w/2+.025),wy,-d/2+northLen/2,.1,1.15,northLen-1.2,'#364d52');
   box(part,'Ventana_lateral_sur_nivel_'+f,side*(w/2+.025),wy,z1+southLen/2,.1,1.15,southLen-1.2,'#364d52');
  }
 }
 box(part,'Azotea',0,h+.2,0,w+.25,.4,d+.25,b.roof||'#dcded2');
 for(const side of [-1,1]){
  box(part,'Pretil',0,h+.55,side*d/2,w,.55,.25,'#c2c5b7');
  box(part,'Remate lateral',side*w/2,h+.55,0,.25,.55,d,'#c2c5b7');
 }
 reinforceG(part,w,d,h,b.floors);
}
function sculptureG(spec){
 const group=new THREE.Group();
 group.name='Escultura_lado_COSEI_G';
 group.userData={...spec,title:'Pérgola animada',artist:'Gilberto Aceves Navarro',catalogueId:'EAE15',approximate:true};
 group.position.set(X(spec.position[0]),0,Z(spec.position[1]));world.add(group);
 registerEditable('sculpture_G','Pérgola animada · G / COSEI','sculpture',group);
 if(!group.parent)return;
 const floor=.35, rust='#80513a',darkRust='#704330';
 box(group,'Pergola_pavimento_enrasado',1,.318,0,5.4,.064,4.58,'#b2ada1');
 function plate(name,points,position,{crosswise=false,color=rust,holes=[]}={}){
  const shape=new THREE.Shape(points.map(p=>new THREE.Vector2(...p)));
  for(const hole of holes)shape.holes.push(new THREE.Path(hole.map(p=>new THREE.Vector2(...p))));
  const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.19,bevelEnabled:false}),material(color));
  mesh.name=name;mesh.position.set(...position);mesh.rotation.y=crosswise?-Math.PI/2:0;
  mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
 }
 // Placas de acero oxidado, con huecos laterales y un dintel por encima del eje peatonal.
 plate('Pergola_placa_asimetrica_alta',[
  [1.35,0],[1.84,0],[1.84,2.43],[2.18,3.35],[2.12,4.54],[1.97,4.6],
  [1.88,3.83],[1.71,3.76],[1.74,4.48],[1.56,4.46],[1.46,3.93],[1.28,3.86],
  [1.20,4.29],[1.07,4.23],[.98,3.59],[1.16,3.22],[1.33,2.8],
 ],[.06,floor,.18],{crosswise:true,holes:[[[1.48,2.6],[1.68,2.84],[1.76,3.41],[1.59,3.33]]]});
 plate('Pergola_dintel_recortado',[
  [-1.82,2.64],[-1.24,2.62],[-.21,2.69],[.83,2.64],[1.67,2.65],
  [1.67,3.08],[.8,3.01],[.36,3.18],[.05,3.15],[-.43,2.99],[-1.34,3.03],[-1.82,2.94],
 ],[.11,floor,0],{crosswise:true,color:darkRust});
 plate('Pergola_pata_del_dintel',[
  [-2.02,0],[-1.57,0],[-1.63,1.18],[-1.53,2.64],[-1.64,2.97],[-2,2.92],[-1.94,1.75],
 ],[.08,floor,0],{crosswise:true,color:darkRust});
 plate('Pergola_aleta_cortada',[
  [-.99,0],[-.39,0],[-.49,1.16],[.08,2.04],[.68,2.29],[.78,2.63],
  [.13,2.55],[-.48,2.12],[-.81,1.44],
 ],[0,floor,1.68]);
 plate('Pergola_lateral_calado',[
  [.03,0],[2.9,0],[3.12,.19],[3.11,2.29],[3.25,2.63],[3.07,2.91],
  [2.85,3.04],[2.65,2.89],[2.51,2.47],[1.93,1.8],[1.36,1.49],
  [1.27,1.14],[2.25,1.6],[2.72,2.04],[2.72,.43],[.03,.25],
 ],[0,floor,-2.05],{color:'#8b5940'});
 label('Pérgola animada',group.position.x,5.35,group.position.z,'place');
}
// Caja del Tiempo: la inauguración de la UAM confirma la pieza vista en el corpus.
let coseiGlassMaterial;
function esculturaVidrioCosei(spec){
 const g=new THREE.Group();g.name='Escultura_vidrio_COSEI';g.userData={title:'Caja del Tiempo',approximate:true,reference:spec.reference};
 g.position.set(X(spec.position[0]),0,Z(spec.position[1]));g.scale.setScalar(spec.scale||1);world.add(g);
 registerEditable('sculpture_vidrio_COSEI','Caja del Tiempo · COSEI','sculpture',g);
 box(g,'Pavimento_gris_COSEI',0,.42,0,4.4,.08,4,'#818681');
 for(const x of [-1.62,-1.08,-.54,0,.54,1.08,1.62])box(g,'Junta_pavimento_Caja_del_Tiempo',x,.462,0,.036,.006,3.98,'#727a76');
 box(g,'Pedestal_concreto_COSEI',0,.73,0,2.9,.55,2.5,'#c5c4ba');
 box(g,'Placa_sin_inscripcion',-.75,.76,1.263,.45,.25,.025,'#555e5c');
 box(g,'Zocalo_metalico',0,1.08,0,1.5,.16,1.06,'#889692');
 box(g,'Panel_inferior_opaco',0,1.57,0,1.38,.85,.9,'#9eafaa');
 for(const x of [-.69,.69])for(const z of [-.48,.48])box(g,'Montante_metalico',x,2.67,z,.045,3.2,.045,'#566b69');
 coseiGlassMaterial??=new THREE.MeshStandardMaterial({name:'Vidrio_COSEI',color:'#b6d9d4',transparent:true,opacity:.22,roughness:.2,metalness:.1,side:THREE.DoubleSide,depthWrite:false});
 function panel(name,w,h,x,y,z,yaw){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),coseiGlassMaterial);m.name=name;m.position.set(x,y,z);m.rotation.y=yaw;g.add(m);}
 for(const side of [-1,1]){
  panel('Vidrio_frontal_posterior',1.38,3.12,0,2.67,side*.49,0);
  panel('Vidrio_lateral',.98,3.12,side*.70,2.67,0,Math.PI/2);
  box(g,'Junta_horizontal',0,2,side*.495,1.4,.025,.025,'#78928d');
  for(const x of [-.49,.49])for(const y of [1.3,1.85]){const bolt=new THREE.Mesh(new THREE.SphereGeometry(.035,6,4),material('#667b76'));bolt.name='Fijacion_panel';bolt.position.set(x,y,side*.515);g.add(bolt);}
 }
 const facets=['#dae4df','#aebfba','#8baba6','#c7d6d0'].map(color=>new THREE.MeshStandardMaterial({color,roughness:.32,metalness:.22,flatShading:true}));
 for(let i=0;i<2;i++){
  const geometry=new THREE.OctahedronGeometry(.72,0);geometry.clearGroups();for(let face=0;face<8;face++)geometry.addGroup(face*3,3,(face+i)%facets.length);
  const poly=new THREE.Mesh(geometry,facets);poly.name='Poliedro_facetado_'+i;poly.scale.set(1,.65,.62);poly.position.set(0,2.08+i*.91,0);poly.rotation.y=Math.PI/4;poly.castShadow=true;g.add(poly);
 }
 if(g.parent)label('Caja del Tiempo',g.position.x,4.8,g.position.z,'place');
}
function serpentinaH(spec){
 const group=new THREE.Group();group.name='Serpentina_II_frente_H_estacionamiento';group.userData={building:'H',side:'estacionamiento',approximate:true,reference:'Elogio al espacio, EAE04, y foto del corpus internet_000242'};group.position.set(X(spec.position[0]),0,Z(spec.position[1]));group.scale.setScalar(spec.scale||1);world.add(group);
 registerEditable('sculpture_serpentina_H','Serpentina II · H / estacionamiento','sculpture',group);
 function disc(name,r,h,y,color,x=0,z=0){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,48),material(color));m.name=name;m.position.set(x,y,z);m.receiveShadow=true;group.add(m);}
 const surface=.352,gravelRadius=1.94,slabWidth=2.82,slabDepth=1.9;
 disc('Serpentina_plazoleta_circular',4,.066,.313,'#8b8a80');
 const paving=new THREE.Mesh(new THREE.RingGeometry(gravelRadius,3.77,64),material('#454848'));
 paving.name='Serpentina_anillo_pavimento_oscuro';paving.rotation.x=-Math.PI/2;paving.position.y=.35;paving.receiveShadow=true;group.add(paving);
 disc('Serpentina_gravilla',gravelRadius,.054,surface-.027,'#797d77');
 box(group,'Serpentina_losa_rectangular',0,surface-.018,0,slabWidth,.044,slabDepth,'#b2ada0');
 // Gravilla estilizada en una sola malla, sin textura de la foto ni geometría sobre la losa.
 const chips=[];
 let seed=711;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<720;i++){
  const a=random()*Math.PI*2,r=Math.sqrt(random())*(gravelRadius-.035),x=Math.cos(a)*r,z=Math.sin(a)*r;
  if(Math.abs(x)<slabWidth/2+.025&&Math.abs(z)<slabDepth/2+.025)continue;
  const size=.012+random()*.024,y=surface+.003;
  chips.push(x-size,y,z-size*.4,x+size*.1,y,z+size,x+size,y,z-size*.65);
 }
 const gravel=new THREE.BufferGeometry();gravel.setAttribute('position',new THREE.Float32BufferAttribute(chips,3));gravel.computeVertexNormals();
 const pebbles=new THREE.Mesh(gravel,material('#bfc1b6'));pebbles.name='Serpentina_granos_ornamentales';pebbles.receiveShadow=true;group.add(pebbles);
 detallarAroSerpentina(THREE,group);
 for(const [x,z] of [[-1.12,-.71],[1.12,-.71],[1.12,.71]]){
  disc('Serpentina_marco_luminaria_empotrada',.125,.009,surface+.008,'#c4c9c4',x,z);
  disc('Serpentina_vidrio_luminaria_empotrada',.087,.008,surface+.009,'#689099',x,z);
 }
 box(group,'Serpentina_placa_frontal',0,surface+.009,-.7,.35,.012,.16,'#4a4c49');
 disc('Serpentina_anclaje_del_eje',.15,.05,surface+.029,'#3b3e3b');
 const palettes=['#b52328','#edf0ed','#30353c'];
 const ribbons=palettes.map(color=>new THREE.MeshStandardMaterial({color,metalness:.52,roughness:.32,side:THREE.DoubleSide}));
 function branch(name,points,turns,radius,hand=1){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),segments=80,frames=curve.computeFrenetFrames(segments,false);
  const rod=new THREE.Mesh(new THREE.TubeGeometry(curve,48,.11,8,false),material('#333c3d'));rod.name='Serpentina_eje_'+name;rod.castShadow=true;group.add(rod);
  for(let color=0;color<3;color++){
   const vertices=[],indices=[];
   for(let i=0;i<=segments;i++){
    const t=i/segments,theta=hand*t*turns*Math.PI*2+color*Math.PI*2/3,radial=frames.normals[i].clone().multiplyScalar(Math.cos(theta)).addScaledVector(frames.binormals[i],Math.sin(theta)),center=curve.getPointAt(t),r=radius*(.88+.12*Math.sin(Math.PI*t));
    for(const side of [-1,1]){const p=center.clone().addScaledVector(radial,r+side*.2);vertices.push(p.x,p.y,p.z);}
    if(i<segments){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
   }
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();
   const ribbon=new THREE.Mesh(geometry,ribbons[color]);ribbon.name='Serpentina_cinta_'+name+'_'+color;ribbon.castShadow=true;ribbon.userData.disposeMaterial=name==='tronco';group.add(ribbon);
  }
 }
 branch('tronco',[[0,surface+.08,0],[0,1.6,0],[0,2.8,0]],1.6,.65);
 branch('brazo_izquierdo',[[0,2.6,0],[-1.4,3.8,0],[-3.1,4.6,0],[-4.5,5.7,0]],2.5,.68,-1);
 branch('brazo_derecho',[[0,2.6,0],[1.4,3.8,0],[3.1,4.6,0],[4.5,5.7,0]],2.5,.68,1);
 if(group.parent)label('Serpentina II',group.position.x,7,group.position.z,'place');
}


// Aproximación de las piedras, el vano adintelado y la placa en el jardín norte de B.
function habitacionesLuz(spec){
 const group=new THREE.Group();group.name='Habitaciones_de_Luz_escultura';
 group.userData={title:'Habitaciones de Luz',artist:'Guadalupe Ojeda Garay',kind:'escultura',material:'piedra',
  approximate:true,location:'Jardín norte de B. Anclaje aproximado según el conjunto visible en planta.',
  reference:'Consejo Académico de la UAM, sesión 182; recorrido escultórico CyAD; fotografías de UAMFoto'};
 group.position.set(X(spec.position[0]),0,Z(spec.position[1]));group.scale.setScalar(spec.scale||1);world.add(group);
 registerEditable('sculpture_habitaciones_luz','Habitaciones de Luz · piedras','sculpture',group);

 const suelo=.16;
 const tonos=['#c1bba5','#b6b098','#c9c2ac','#d0c9b6'];
 function piedra(nombre,x,z,ancho,fondo,alto,giro,indice,base=suelo){
  const geometria=new THREE.CylinderGeometry(1,1,alto,8,3);
  const vertices=geometria.attributes.position;
  for(let i=0;i<vertices.count;i++){
   const vx=vertices.getX(i),vz=vertices.getZ(i),y=vertices.getY(i);
   const nivel=Math.round((y/alto+.5)*3),t=nivel/3;
   const angulo=Math.atan2(vz,vx);
   const relieve=1+.12*Math.sin(3*angulo+indice*.83)+.10*Math.cos(5*angulo+nivel*1.35+indice);
   const perfil=[1,.88,.92,.77][nivel];
   const inclina=(indice%3-1)*.16;
   const desnivel=nivel===3?.075*vx+.055*vz:0;
   vertices.setXYZ(i,ancho*(vx*relieve*perfil/2+t*inclina),y+desnivel,fondo*vz*relieve/2);
  }
  geometria.computeVertexNormals();
  const malla=new THREE.Mesh(geometria,material(tonos[indice%tonos.length]));
  malla.name=nombre;malla.position.set(x,base+alto/2,z);malla.rotation.y=giro;
  malla.castShadow=true;malla.receiveShadow=true;group.add(malla);
 }
 const bloques=[
  [-3.35,.40,1.32,1.16,2.32,-.08],
  [-2.18,-1.43,1.08,1.07,2.64,.12],
  [-.99,.33,1.21,1.07,2.98,-.26],
  [.17,.72,1.03,.95,2.67,.22],
  [.69,-.43,1.08,1.10,2.63,-.18],
  [3.44,-.43,1.34,1.26,2.63,.17],
  [2.61,-2.52,1.12,1.08,2.25,-.24],
  [.33,-2.52,1.24,.97,2.31,.14],
 ];
 for(const [i,bloque] of bloques.entries())piedra('Habitaciones_piedra_'+(i+1),...bloque,i);
 piedra('Habitaciones_remate_del_bloque',-3.37,.38,1.43,1.23,.59,-.08,2,suelo+2.24);
 piedra('Habitaciones_dintel_principal',2.02,-.43,4.18,1.23,.66,0,3,suelo+2.52);
 piedra('Habitaciones_dintel_del_fondo',1.47,-2.52,3.23,1.05,.48,.02,0,suelo+2.22);

 const placa=new THREE.Group();placa.name='Habitaciones_placa_inclinada';placa.position.set(1.21,suelo,3.7);group.add(placa);
 box(placa,'Base_de_concreto_de_la_placa',0,.065,0,.80,.13,.64,'#8d8676');
 const marco=box(placa,'Marco_de_la_placa',0,.24,-.03,.70,.07,.57,'#615a47');
 marco.rotation.x=.70;
 const cara=box(placa,'Frente_de_la_placa',0,.273,-.002,.60,.018,.46,'#88785c');
 cara.rotation.x=.70;
 if(group.parent)label('Habitaciones de Luz',group.position.x,4.4,group.position.z,'place');
}

// Universitas: escultura de acero azul, formada por puntas piramidales que cruzan un centro común, sobre pedestal circular de piedra. Aproximada a partir de fotografías.
let universitasMaterial;
function universitasSteel(){return universitasMaterial??=new THREE.MeshStandardMaterial({color:'#25436e',metalness:.35,roughness:.52,flatShading:true});}
function universitas(spec){
 const group=new THREE.Group();group.name='Universitas_escultura';group.userData={title:'Universitas',kind:'escultura',material:'acero pintado azul',approximate:true,reference:spec.reference};
 group.position.set(X(spec.position[0]),0,Z(spec.position[1]));group.scale.setScalar(spec.scale||1);world.add(group);
 registerEditable('sculpture_universitas','Universitas · escultura azul','sculpture',group);
 const pedestal=new THREE.Mesh(new THREE.CylinderGeometry(1.66,1.68,.43,8),material('#6e675a'));pedestal.name='Universitas_pedestal';pedestal.position.y=.32;pedestal.castShadow=true;pedestal.receiveShadow=true;group.add(pedestal);
 const rim=new THREE.Mesh(new THREE.CylinderGeometry(1.80,1.80,.12,8),material('#8b8576'));rim.name='Universitas_remate_pedestal';rim.position.y=.595;rim.castShadow=true;rim.receiveShadow=true;group.add(rim);
 const plate=box(group,'Universitas_placa',0,.225,1.95,.48,.09,.26,'#73746e');plate.rotation.x=-.2;
 const junction=new THREE.Vector3(0,1.98,0),up=new THREE.Vector3(0,1,0);
 const tips=[[1.52,2.14,-.17],[-1.52,1.93,.25],[.54,3.53,.24],[.75,3.36,-.23],[-1.16,3.09,.18],[-1.03,3.21,-.27],[-.64,.79,.15],[.84,.85,.47],[1.13,1.2,-.32]];
 for(const tip of tips){
  const axis=new THREE.Vector3(...tip).sub(junction),length=axis.length();
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute([
   -.13,0,-.23,.13,0,-.23,.13,0,.23,-.13,0,.23,
   -.25,length,-.35,.25,length,-.35,.25,length,.35,-.25,length,.35,
  ],3));
  geometry.setIndex([0,1,2,0,2,3,4,6,5,4,7,6,0,4,5,0,5,1,1,5,6,1,6,2,2,6,7,2,7,3,3,7,4,3,4,0]);
  geometry.computeVertexNormals();
  const arm=new THREE.Mesh(geometry,universitasSteel());arm.name='Universitas_brazo_truncado';arm.position.copy(junction);arm.quaternion.setFromUnitVectors(up,axis.normalize());arm.castShadow=true;group.add(arm);
 }
 if(group.parent)label('Universitas',group.position.x,4.1,group.position.z,'place');
}

// Casa abierta al tiempo: tres poliedros dorados de caras triangulares, apilados y desfasados, sobre pedestal circular. Aproximada a partir de fotografías.
let casaAbiertaMaterial,casaAbiertaLineas;
function casaAbiertaAlTiempo(spec){
 const group=new THREE.Group();group.name='Casa_abierta_al_tiempo_escultura';group.userData={title:'Casa Abierta al Tiempo · jardín',kind:'escultura',material:'metal dorado',approximate:true,reference:spec.reference};
 group.position.set(X(spec.position[0]),0,Z(spec.position[1]));group.scale.setScalar(spec.scale||1);world.add(group);
 registerEditable('sculpture_casa_abierta','Casa Abierta al Tiempo · jardín','sculpture',group);
 if(!casaAbiertaMaterial)casaAbiertaMaterial=new THREE.MeshStandardMaterial({color:'#d8b11c',metalness:.45,roughness:.4,flatShading:true});
 if(!casaAbiertaLineas)casaAbiertaLineas=new THREE.LineBasicMaterial({color:'#5f4f0c'});
 const pedestal=new THREE.Mesh(new THREE.CylinderGeometry(1.52,1.55,.35,48),material('#77726a'));pedestal.name='Casa_abierta_pedestal';pedestal.position.y=.28;pedestal.castShadow=true;pedestal.receiveShadow=true;group.add(pedestal);
 const cap=new THREE.Mesh(new THREE.CylinderGeometry(1.68,1.68,.095,48),material('#a39e91'));cap.name='Casa_abierta_losa_circular';cap.position.y=.5;cap.castShadow=true;cap.receiveShadow=true;group.add(cap);
 // Caras planas superior e inferior y paños facetados como en la foto del jardín.
 const profile=[[-.69,.10],[-.46,-.50],[.39,-.50],[.69,-.24],[.62,.32],[.29,.50],[-.45,.50]];
 const n=profile.length,vertices=[],faces=[];
 for(const z of [.34,-.34])for(const [x,y] of profile)vertices.push(x,y,z);
 vertices.push(.07,-.02,.53,-.07,.05,-.49);
 for(let i=0;i<n;i++){
  const j=(i+1)%n;
  faces.push(i,j,2*n,n+i,2*n+1,n+j,i,n+i,n+j,i,n+j,j);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(faces);geometry.computeVertexNormals();
 const edgeGeometry=new THREE.EdgesGeometry(geometry,1);
 const spacing=.93,base=1.045;
 // [desfase X, desfase Z, giro, inclinación X, inclinación Z]
 const blocks=[[0,0,.2,0,0],[.26,-.06,.55,.05,-.08],[-.17,.09,1.1,-.04,.06]];
 for(const [i,[dx,dz,yaw,tiltX,tiltZ]] of blocks.entries()){
  const block=new THREE.Mesh(geometry,casaAbiertaMaterial);block.name='Casa_abierta_poliedro_'+(i+1);block.position.set(dx,base+i*spacing,dz);block.rotation.set(tiltX,yaw,tiltZ);block.castShadow=true;block.receiveShadow=true;group.add(block);
  const edges=new THREE.LineSegments(edgeGeometry,casaAbiertaLineas);edges.name='Casa_abierta_aristas_'+(i+1);block.add(edges);
 }
 if(group.parent)label('Casa Abierta al Tiempo',group.position.x,3.9,group.position.z,'place');
}

// Marca que pertenece a la maqueta y viaja en GLB; bandera persistente en JSON.
function copyrightStyle(){return data.copyrightStyle||ORIGINAL.copyrightStyle;}
function copyrightEnabled(){return data.showCopyright!==false;}
function syncCopyright(){const enabled=copyrightEnabled();const node=world?.getObjectByName('Marca_copyright_modelo');if(node)node.visible=enabled;$('copyrightToggle').checked=enabled;$('watermark').hidden=!enabled;$('watermark').style.color=copyrightStyle().color;}
function addCopyrightToModel(){
 const group=new THREE.Group();group.name='Marca_copyright_modelo';group.userData={presentation:true,flag:'showCopyright',text:'copyright @gabrielhuav'};world.add(group);
 const style=copyrightStyle();group.userData.color=style.color;group.userData.pattern='tiled-site';
 const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=192;const ctx=canvas.getContext('2d');ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 112px sans-serif';ctx.lineWidth=9;ctx.strokeStyle='#fff8e9';ctx.strokeText('copyright @gabrielhuav',768,96,1470);ctx.fillStyle=style.color;ctx.fillText('copyright @gabrielhuav',768,96,1470);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const mat=new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:style.opacity,fog:false,toneMapped:false,side:THREE.DoubleSide,depthWrite:false});
 const height=Math.max(...data.buildings.map(b=>b.floors*data.storeyHeight))+4;
 const panels=copyrightPanelsForSite(data.site,data.metersPerPixel,style);
 group.userData.panelCount=panels.length;const north=campusNorth(georeference)||{x:0,z:-1},textAngle=Math.atan2(-north.x,-north.z);group.userData.northAligned=true;group.userData.textAngle=textAngle;
 for(const [i,p]of panels.entries()){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(p.width,p.width/8),mat);mesh.name='Copyright_integrado_'+i;mesh.rotation.set(-Math.PI/2,0,textAngle);mesh.position.set(p.x,height,p.z);mesh.renderOrder=5;mesh.userData.disposeCopyrightMaterial=i===0;group.add(mesh);}
 syncCopyright();
}
$('copyrightToggle').onchange=()=>{if(isSaving)return;rememberEdit();data.showCopyright=$('copyrightToggle').checked;syncCopyright();updateSaveState();message(copyrightEnabled()?'Marca integrada activada. Guarda cambios para actualizar GLB y PNG.':'Marca desactivada. Guarda cambios para exportar sin ella.');};

function azcBuildingT(part,b,w,d,h){
 const details=new THREE.Group();details.name='T_AZC_fachada_y_escalera';details.userData={approximate:true,reference:'Corpus confirmado UAM-A (75 fotos de T) y dos fotos iniciales de Gabriel; sin salida a Eje 5 Norte',noStreetExit:true};part.add(details);
 const stone='#b9b8aa',red='#b72f32',terra='#ad6550',front=-d/2,back=d/2,rise=Math.min(data.storeyHeight,h*.5),run=8.2,stairsX=-w*.27,stairsWidth=4.8;
 box(details,'T_cuerpo_PB_retranqueado',0,rise/2,1,w,rise,d-2,stone);
 box(details,'T_cuerpo_superior',0,(h+rise)/2,0,w,h-rise,d,stone);
 box(details,'T_azotea',0,h+.15,0,w+.2,.3,d+.2,'#cfcec2');
 for(const z of [-d/2,d/2])box(details,'T_pretil',0,h+.48,z,w,.45,.24,'#c0bfb2');
 box(details,'T_ventanal_inferior',0,1.6,front+1.95,w-2,1.9,.12,'#455a57');
 for(let x=-w/2+1;x<w/2;x+=3.5){box(details,'T_montante_PB',x,1.6,front+1.83,.12,2,.2,'#c4c7bd');box(details,'T_pilar_PB',x,rise/2,front+.4,.3,rise,.45,stone);}
 // Columnas cilíndricas de concreto en galería PB y ventanillas rojas en zigzag (CSE, imagen_0079, imagen_0118..0134).
 for(let x=-w*.44;x<=w*.44;x+=5.4){
  const col=new THREE.Mesh(cylinder,material('#aeb2b0'));col.name='T_columna_cilindrica_PB';col.position.set(x,rise/2,front-.45);col.scale.set(.38,rise,.38);col.castShadow=true;details.add(col);
 }
 for(let i=0;i<7;i++){
  const vx=-1.5+i*2.8;
  const ventanilla=new THREE.Group();ventanilla.name='T_ventanilla_roja_CSE';ventanilla.position.set(vx,0,front+1.55);ventanilla.rotation.y=.20;details.add(ventanilla);
  box(ventanilla,'T_zocalo_terracota_CSE',0,.52,.04,2.52,1.04,.63,'#853f33');
  box(ventanilla,'T_pantalla_lateral_CSE',-1.18,1.62,.04,.14,2.15,.82,'#982d2a');
  box(ventanilla,'T_cristal_ventanilla_CSE',.02,1.85,-.14,2.19,1.58,.08,'#586b57');
  const marco='#bbc3b2';
  for(const y of [1.07,1.55,2.64])box(ventanilla,'T_travesano_ventanilla_CSE',.02,y,-.202,2.19,.07,.07,marco);
  for(const x of [-1.08,.23,1.12])box(ventanilla,'T_montante_ventanilla_CSE',x,1.85,-.202,.06,1.59,.07,marco);
  box(ventanilla,'T_repisa_ventanilla_CSE',.02,1.08,-.26,2.22,.075,.43,'#947258');
 }
 const letreroCSE=box(details,'T_letrero_colgante_CSE',1.2,rise-.59,front-.2,2.46,.48,.08,'#ad3735');
 for(const x of [.34,2.06])box(details,'T_tirante_letrero_CSE',x,rise-.322,front-.2,.022,.058,.022,'#5e5751');
 const cseCanvas=document.createElement('canvas');cseCanvas.width=512;cseCanvas.height=104;
 const cseText=cseCanvas.getContext('2d');cseText.fillStyle='#ad3735';cseText.fillRect(0,0,512,104);
 cseText.fillStyle='#fff6ea';cseText.textAlign='center';cseText.font='bold 30px sans-serif';cseText.fillText('COORDINACIÓN DE',256,42);cseText.fillText('SISTEMAS ESCOLARES',256,80);
 const cseTexture=new THREE.CanvasTexture(cseCanvas);cseTexture.colorSpace=THREE.SRGBColorSpace;
 const cseSign=new THREE.Mesh(new THREE.PlaneGeometry(2.42,.45),new THREE.MeshBasicMaterial({map:cseTexture,side:THREE.DoubleSide}));
 cseSign.name='T_texto_sistemas_escolares';cseSign.position.copy(letreroCSE.position);cseSign.position.z-=.046;cseSign.rotation.y=Math.PI;cseSign.userData.disposeMaterial=true;details.add(cseSign);
 // Rampas de acceso peatonal hacia el pórtico de PB de T desde la explanada norte (imagen_0079, 0107, 0127).
 for(const rx of [-w*.08,w*.18]){
  const rampPB=box(details,'T_rampa_acceso_PB',rx,.18,front-1.8,2.6,.22,3.4,'#c7c3b4');rampPB.rotation.x=-.05;
  for(const s of [-1,1])box(details,'T_barandal_rampa_PB',rx+s*1.22,.58,front-1.8,.07,.75,3.2,red);
 }
 box(details,'T_galeria_exterior',0,rise-.15,front-.7,w,.3,2.5,'#b8b3a3');
 box(details,'T_acceso_superior',3,rise+1.1,front-.08,6,2.2,.14,'#555d57');
 box(details,'T_ventana_galeria',w*.28,rise+1.1,front-.08,w*.23,1.15,.14,'#78817a');
 const canopy=box(details,'T_marquesina_curva_aproximada',w*.16,rise+2.1,front-.8,7.5,.25,2.7,'#a99d88');canopy.rotation.z=.04;
 for(const x of [w*.16-3.5,w*.16+3.5])box(details,'T_soporte_rojo_marquesina',x,rise+1,front-1.8,.12,2,.12,red);
 // Techumbre curva abovedada blanca sobre estructura tubular roja en galería superior (imagen_0063, imagen_0107, imagen_0113, imagen_0140).
 const vaultSpan=w*.38,vaultX=w*.02,vaultZ=front-.95;
 const archShape=new THREE.Shape();archShape.absarc(0,0,1.75,Math.PI*.12,Math.PI*.88,false);archShape.absarc(0,0,1.52,Math.PI*.88,Math.PI*.12,true);archShape.closePath();
 const vault=new THREE.Mesh(new THREE.ExtrudeGeometry(archShape,{depth:vaultSpan,bevelEnabled:false,curveSegments:24}),material('#f2efe6'));
 vault.name='T_cubierta_curva_galeria';vault.rotation.y=Math.PI/2;vault.scale.set(1,.58,1);vault.position.set(vaultX-vaultSpan/2,rise+1.95,vaultZ);vault.castShadow=true;details.add(vault);
 function beam(name,a,b,width,color){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);const o=box(details,name,0,0,0,width,delta.length(),width,color);o.position.copy(start.add(end).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());}
 for(let x=vaultX-vaultSpan/2+1.2;x<=vaultX+vaultSpan/2-1.2;x+=4.2){
  box(details,'T_estructura_roja_galeria',x,rise+1.25,front-1.78,.14,2.5,.14,red);
  box(details,'T_arco_rojo_cubierta',x,rise+2.88,vaultZ,.16,.18,3.1,red);
  beam('T_estructura_roja_galeria',[x,rise+1.7,front-1.78],[x,rise+2.75,vaultZ+.45],.1,red);
  beam('T_estructura_roja_galeria',[x,rise+1.7,front-1.78],[x-.95,rise+2.58,front-1.78],.09,red);
  beam('T_estructura_roja_galeria',[x,rise+1.7,front-1.78],[x+.95,rise+2.58,front-1.78],.09,red);
 }
 // Ala norte perpendicular en L sobre columnas cilíndricas y puente de galería superior (imagen_0063, 0107, 0127, 0140).
 const wingW=6.8,wingL=11.6,wingX=w*.23,wingZ=front-wingL/2-.2;
 box(details,'T_ala_norte_colonnade',wingX,rise+1.65,wingZ,wingW,h-rise+.2,wingL,stone);
 box(details,'T_azotea_ala_norte',wingX,h+.25,wingZ,wingW+.2,.28,wingL+.2,'#cfcec2');
 box(details,'T_ventanal_ala_norte',wingX-wingW/2-.06,rise+1.6,wingZ,.12,1.35,wingL-1.8,'#455a57');
 for(const dz of [-wingL*.38,0,wingL*.38])for(const dx of [-wingW*.36,wingW*.36]){
  const c=new THREE.Mesh(cylinder,material('#aeb2b0'));c.name='T_columna_ala_norte';c.position.set(wingX+dx,rise/2,wingZ+dz);c.scale.set(.38,rise,.38);c.castShadow=true;details.add(c);
 }
 box(details,'T_puente_galeria_norte',wingX-wingW/2-1.15,rise-.15,front-3.1,2.3,.3,4.2,'#b8b3a3');
 box(details,'T_barandal_rojo_galeria',wingX-wingW/2-2.22,rise+.85,front-3.1,.08,.08,4.2,red);
 // Escalera exterior hacia el patio interior (lado -Z), sin abrir el perímetro sur.
 const count=18,tread=run/count;
 for(let i=1;i<=count;i++)box(details,'T_peldano_exterior',stairsX,rise*i/count/2,front-run+(i-.5)*tread,stairsWidth,rise*i/count,tread+.01,'#b8957b');
 for(const side of [-1,1]){
  const x=stairsX+side*(stairsWidth/2-.12);
  beam('T_pasamanos_rojo_escalera',[x,.95,front-run],[x,rise+.95,front],.1,red);
  beam('T_barra_intermedia_escalera',[x,.5,front-run],[x,rise+.5,front],.07,red);
  for(let i=0;i<=count;i+=3)box(details,'T_poste_rojo_escalera',x,rise*i/count+.5,front-run+run*i/count,.08,1,.08,red);
 }
 const shape=new THREE.Shape();shape.moveTo(-(front-run),0);shape.lineTo(-front,0);shape.lineTo(-front,rise+1);shape.lineTo(-(front-run),.28);shape.closePath();
 const wall=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.4,bevelEnabled:false}),material(terra));wall.name='T_muro_inclinado_terracota';wall.rotation.y=Math.PI/2;wall.position.x=stairsX+stairsWidth/2;wall.castShadow=true;wall.receiveShadow=true;details.add(wall);
 // Cicloestacionamiento techado rojo y tótem junto al muro inclinado (imagen_0008, imagen_0113, imagen_0114, imagen_0137).
 const bikeX=stairsX+stairsWidth/2+1.75,bikeZ=front-run*.55;
 box(details,'T_totem_cicloestacionamiento',bikeX+1.05,1.35,front-run-.4,.65,2.7,.16,'#d42338');
 const bikeRoof=box(details,'T_cubierta_cicloestacionamiento',bikeX,2.32,bikeZ,2.6,.14,5.2,'#c82936');bikeRoof.rotation.z=-.12;
 for(const dz of [-1.9,0,1.9]){
  beam('T_tirante_cicloestacionamiento',[stairsX+stairsWidth/2+.35,2.95,bikeZ+dz],[bikeX+.95,2.22,bikeZ+dz],.05,'#4b4e50');
  box(details,'T_rack_bicicletas',bikeX-.15,.48,bikeZ+dz,1.05,.68,.12,'#c82936');
 }
 const railStart=stairsX+stairsWidth/2+.5,railEnd=w*.48;
 for(const y of [rise+.5,rise+1])box(details,'T_barandal_rojo_galeria',(railStart+railEnd)/2,y,front-1.9,railEnd-railStart,.08,.08,red);
 for(let x=railStart;x<railEnd;x+=2.2)box(details,'T_poste_rojo_galeria',x,rise+.5,front-1.9,.08,1,.08,red);
 const canvas=document.createElement('canvas');canvas.width=128;canvas.height=192;const ctx=canvas.getContext('2d');ctx.fillStyle=red;ctx.textAlign='center';ctx.font='bold 170px sans-serif';ctx.fillText('t',64,158);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const letter=new THREE.Mesh(new THREE.PlaneGeometry(1.3,1.95),new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide}));letter.name='T_rotulo_rojo';letter.userData.disposeMaterial=true;letter.rotation.y=Math.PI;letter.position.set(-w/2+2.4,h-.9,front-.15);details.add(letter);
 const plaza=box(details,'T_explanada_interior',-w*.08,.1,front-run*.72,w*.78,.18,run*1.75,'#aaa697');
 for(let x=plaza.position.x-w*.38;x<plaza.position.x+w*.38;x+=3.6)box(details,'T_junta_explanada',x,.21,plaza.position.z,.035,.02,run*1.75,'#cec8b7');
 for(let z=front-run*1.55;z<front;z+=3.6)box(details,'T_junta_explanada',plaza.position.x,.22,z,w*.78,.02,.035,'#cec8b7');
 // Uroboros (EAE 11), dos cintas de acero en el jardín entre T y J. Catálogo pp. 35, 66–67 e imágenes 0023 y 0127.
 const uroboros=new THREE.Group();uroboros.name='T_escultura_acero_patio';
 uroboros.userData={name:'Uroboros',artist:'Yvonne Domenge',catalogId:'EAE 11',material:'Acero al carbón oxidado',approximate:true};
 const [tX1,tZ1,tX2,tZ2]=b.rects[0];
 uroboros.position.set(X(945)-X((tX1+tX2)/2),.11,Z(580)-Z((tZ1+tZ2)/2));
 details.add(uroboros);
 function cintaUroboros(nombre,puntos,ancho,color){
  const curva=new THREE.CatmullRomCurve3(puntos.map(p=>new THREE.Vector3(...p)),true);
  const pasos=64,secciones=[];
  for(let i=0;i<pasos;i++){
   const t=i/pasos,centro=curva.getPoint(t),tangente=curva.getTangent(t);
   const a=2*Math.PI*t,alabeo=.42*Math.sin(a+.55)+.22*Math.cos(2*a);
   const anchoLocal=ancho*(.76+.24*Math.cos(a-.36));
   const ala=new THREE.Vector3(-tangente.y,tangente.x,0).normalize().applyAxisAngle(tangente,alabeo);
   const espesor=new THREE.Vector3().crossVectors(tangente,ala).normalize();
   secciones.push([[-1,-1],[1,-1],[1,1],[-1,1]].map(([n,s])=>centro.clone().addScaledVector(ala,n*anchoLocal/2).addScaledVector(espesor,s*.027)));
  }
  const vertices=[],indices=[];
  for(let cara=0;cara<4;cara++){
   const inicio=vertices.length/3;
   for(const seccion of secciones)vertices.push(...seccion[cara].toArray(),...seccion[(cara+1)%4].toArray());
   for(let i=0;i<pasos;i++){
    const a=inicio+2*i,b=inicio+2*((i+1)%pasos);
    indices.push(a,a+1,b,a+1,b+1,b);
   }
  }
  const geometria=new THREE.BufferGeometry();
  geometria.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometria.setIndex(indices);
  geometria.computeVertexNormals();geometria.computeBoundingBox();geometria.translate(0,-geometria.boundingBox.min.y,0);
  const pieza=new THREE.Mesh(geometria,material(color));pieza.name=nombre;pieza.castShadow=true;pieza.receiveShadow=true;uroboros.add(pieza);
  return pieza;
 }
 cintaUroboros('Uroboros_cinta_mayor',[[.25,.28,.16],[-.58,.40,-.12],[-1.08,1.31,-.02],[-.96,2.37,.16],[.05,2.85,.20],[.53,2.55,-.14],[.61,1.56,-.24],[1.10,.86,.08],[.88,.45,.23]],.55,'#754a30');
 const menor=cintaUroboros('Uroboros_cinta_menor',[[.12,.12,.10],[-.36,.18,.02],[-.54,.64,-.06],[-.30,.91,.09],[.16,.99,.12],[.40,.67,-.10],[.39,.31,-.09]],.35,'#68412c');
 menor.rotation.y=.62;menor.position.set(-1.02,0,-.67);
 // Fachada posterior sur y lateral: tres franjas de celosía de ladrillo, remetimiento acristalado y cuerpo terracota (imagen_0052..0057).
 box(details,'T_cuerpo_lateral_terracota',w/2-3.4,h*.52,1.1,6.8,h+.3,d-1.8,terra);
 const cornerCol=new THREE.Mesh(cylinder,material('#c2c4be'));cornerCol.name='T_columna_esquina_lateral';cornerCol.position.set(w/2+.05,h*.5,back-.3);cornerCol.scale.set(.42,h,.42);details.add(cornerCol);
 box(details,'T_remetimiento_acristalado_sur',-w*.18,h*.48,back-.18,3.8,h*.82,.45,'#35484c');
 for(const [lvl,yy] of [[0,1.25],[1,3.35],[2,5.3]]){
  box(details,'T_celosia_ladrillo_posterior_'+lvl,-w*.36,yy,back+.08,w*.26,1.35,.22,'#8c4339');
  box(details,'T_parasol_horizontal',w*.08,yy+.55,back+.14,w*.38,.14,.48,'#aeb2ae');
 }
}

const libraryPorticoRecess=2.35;
const libraryPorticoHeight=h=>Math.min(6.1,h*.79);
function azcBuildingI(part,idx,b,w,d,h){
 const g=new THREE.Group();g.name='I_AZC_biblioteca_'+idx;g.userData={building:'I',part:idx,floors:b.floors,approximate:true,reference:'Corpus confirmado UAM-A: 12 fotos de I y Plaza COSEI'};part.add(g);
 const concrete='#c8c9c0',fascia='#b4b6ac',darkGlass='#2c4147',mullion='#e2e5e0',story=data.storeyHeight;
 if(idx===0){
  const porticoY=libraryPorticoHeight(h),recess=Math.min(libraryPorticoRecess,d*.35);
  box(g,'Cuerpo de concreto',0,h/2,recess/2,w,h,d-recess,concrete);
  box(g,'I_voladizo_de_acceso',0,(h+porticoY)/2,-d/2+recess/2,w,h-porticoY,recess,concrete);
 }else box(g,'Cuerpo de concreto',0,h/2,0,w,h,d,concrete);
 box(g,'Azotea',0,h+.2,0,w+.3,.4,d+.3,'#dadcd0');
 box(g,'I_cornisa_superior',0,h-.55,0,w+.42,1.25,d+.42,fascia);
 for(const side of [-1,1]){
  box(g,'Pretil',0,h+.58,side*d/2,w,.55,.26,'#bcbeb3');
  box(g,'Remate lateral',side*w/2,h+.58,0,.26,.55,d,'#bcbeb3');
 }
 // Domos/lucernarios de sala de lectura en azotea de I.
 for(let x=-w*.32;x<=w*.32;x+=w*.32){
  box(g,'I_domo_lectura_base',x,h+.65,0,3.6,.55,3.2,'#8e948e');
  box(g,'I_domo_lectura_vidrio',x,h+1.02,0,3.2,.24,2.8,'#a9c2c6');
 }
 // Ventanales modulados con parteluces de aluminio y pilastras verticales de concreto (imagen_0018, 0020, 0141, 0154, 0157).
 for(let x=-w/2+2.4;x<=w/2-2.4;x+=4.8){
  for(const side of [-1,1]){
   if(idx===0&&side===-1)continue; // La fachada sur principal hacia COSEI se detalla con doble altura en coseiPlaza.
   box(g,'I_pilastra_lectura',x,h/2,side*(d/2+.12),.38,h-.8,.28,'#b8bab0');
  }
 }
 for(let f=0;f<b.floors;f++){
  const wy=f*story+1.85;
  for(const side of [-1,1]){
   if(idx===0&&side===-1)continue;
   box(g,'Ventana_nivel_'+f,0,wy,side*(d/2+.04),w-2.2,1.25,.1,darkGlass);
   for(let x=-w/2+2.4;x<=w/2-2.4;x+=2.4)box(g,'Montante',x,wy,side*(d/2+.1),.1,1.3,.1,mullion);
  }
  for(const side of [-1,1]){
   box(g,'Ventana_lateral_nivel_'+f,side*(w/2+.04),wy,0,.1,1.25,d-2.2,darkGlass);
   for(let z=-d/2+2.4;z<=d/2-2.4;z+=2.4)box(g,'I_montante_lateral',side*(w/2+.1),wy,z,.1,1.3,.1,mullion);
  }
 }
}

function azcBuildingW(part,b,w,d,h){
 const g=new THREE.Group();g.name='W_AZC_laboratorios_y_portico';g.userData={building:'W',floors:b.floors,approximate:true,reference:'Corpus confirmado UAM-A: imagen_0030, 0062, 0092, 0101, 0102, 0103'};part.add(g);
 const concrete='#c5c8c4',darkGlass='#4a6166',frame='#eceee9',red='#b62931',porticoW=8.6,mainW=w-porticoW,story=data.storeyHeight;
 box(g,'W_cuerpo_concreto_gris',porticoW/2,h/2,0,mainW,h,d,concrete);
 box(g,'Azotea',porticoW/2,h+.2,0,mainW+.25,.4,d+.25,'#dcded2');
 // Muros ala norte y sur que enmarcan el atrio abierto de triple altura en -X (imagen_0102, 0103).
 const px=-w/2+porticoW/2;
 for(const side of [-1,1]){
  box(g,'W_muro_ala_portico',px,h/2,side*(d/2-.95),porticoW,h,1.9,concrete);
 }
 box(g,'W_piso_portico_acceso',px-.8,.18,0,porticoW+2.4,.28,d-1.2,'#b8b5a8');
 // Rampa peatonal accesible con barandal rojo hacia la explanada del pórtico de W (imagen_0102, 0103).
 const rampW=box(g,'W_rampa_acceso_portico',-w/2-2.6,.16,d*.18,3.6,.22,2.4,'#c6c3b6');rampW.rotation.z=.05;
 for(const s of [-1,1])box(g,'W_barandal_rampa_portico',-w/2-2.6,.62,d*.18+s*1.1,3.4,.08,.08,red);
 // Volúmenes bajos escalonados en PB hacia estacionamiento (-Z, imagen_0030, imagen_0062, imagen_0101).
 box(g,'W_volumen_bajo_escalonado',porticoW/2-mainW*.26,2.1,-d/2-1.85,mainW*.36,4.2,3.7,'#bec2be');
 box(g,'W_volumen_bajo_escalonado',porticoW/2+mainW*.14,1.85,-d/2-1.25,mainW*.3,3.7,2.5,'#b8bcba');
 box(g,'W_puerta_roja_servicio',porticoW/2+mainW*.28,1.25,-d/2-.08,2.1,2.4,.16,'#a8322d');
 box(g,'W_rampa_servicio_norte',porticoW/2+mainW*.28,.16,-d/2-1.35,2.4,.2,2.5,'#c4c2b6');
 // Bloques de ventanales reticulares con parteluces blancos en PB, P1 y P2 (imagen_0030, imagen_0101).
 for(const side of [-1,1])for(const f of [0,1,2]){
  if(f===0&&side===-1)continue;
  const wy=f*story+1.65;
  for(const bx of [-mainW*.3,0,mainW*.3]){
   const wx=porticoW/2+bx,bw=6.8,bh=2.1;
   box(g,'W_ventanal_reticular',wx,wy,side*(d/2+.05),bw,bh,.1,darkGlass);
   for(let dx=-bw/2;dx<=bw/2+.01;dx+=bw/4)box(g,'W_parteluz_blanco',wx+dx,wy,side*(d/2+.11),.1,bh+.1,.08,frame);
   for(const dy of [-bh/2,0,bh/2])box(g,'W_parteluz_blanco',wx,wy+dy,side*(d/2+.11),bw+.1,.09,.08,frame);
  }
 }
 // Barandal perimetral en azotea y caseta superior con acento rojo (imagen_0030, imagen_0101).
 for(const z of [-d/2,d/2])box(g,'W_barandal_azotea',porticoW/2,h+.75,z,mainW,.1,.1,'#545c5e');
 for(const x of [-w/2+porticoW,w/2])box(g,'W_barandal_azotea',x,h+.75,0,.1,.1,d,'#545c5e');
 box(g,'W_caseta_azotea_roja',porticoW/2+mainW*.18,h+1.45,-d*.15,7.8,2.3,5.6,'#b8bdb9');
 box(g,'W_acento_rojo_azotea',porticoW/2+mainW*.18,h+1.05,-d*.15-2.85,7.9,1.35,.22,red);
 for(let n=0;n<2;n++)box(g,'Equipo de azotea',w/2-2-n*2.6,h+.9,0,1.8,.8,1.8,'#728182');
 // Pórtico de triple altura con cerchas rojas, galerías interiores, muro curvo, puertas rojas y escalera con descansos curvos (imagen_0102, imagen_0103).
 box(g,'W_muro_fondo_portico',px+porticoW*.22,h/2,d*.18,porticoW*.55,h,d*.56,concrete);
 for(const [lvl,yy] of [[1,story],[2,2*story]]){
  box(g,'W_galeria_atrio_'+lvl,px+1.1,yy-.15,d*.08,porticoW*.62,.28,d*.68,'#c2c4be');
  box(g,'W_barandal_galeria_atrio_'+lvl,px-1.45,yy+.55,d*.08,.09,.95,d*.66,red);
 }
 const curvedWall=new THREE.Mesh(new THREE.CylinderGeometry(4.4,4.4,h-.4,28,1,true,-Math.PI*.15,Math.PI*.75),material('#bfc3bf'));
 curvedWall.name='W_muro_curvo_acceso';curvedWall.position.set(-w/2+2.1,h/2-.2,-d*.16);g.add(curvedWall);
 box(g,'W_puerta_roja_acceso',-w/2+.75,1.4,-d*.26,.22,2.5,2.8,red);
 box(g,'W_marco_puerta_acceso',-w/2+.68,2.72,-d*.26,.3,.24,3.1,'#eceee9');
 for(let z=-d/2+2.1;z<=d/2-2.1;z+=3.2){
  box(g,'W_cercha_roja_portico',px,h-.32,z,porticoW+.5,.34,.26,red);
  box(g,'W_cercha_roja_portico',px,h-1.02,z,porticoW+.3,.24,.2,red);
 }
 for(const side of [-1,0,1])box(g,'W_viga_roja_portico',px+side*(porticoW*.44),h-.68,0,.28,.95,d-2.2,red);
 for(const [lvl,yy] of [[1,story],[2,2*story]]){
  const landing=new THREE.Mesh(new THREE.CylinderGeometry(2.55,2.55,1.05,28),material('#c7cac5'));
  landing.name='W_escalera_descanso_curvo_'+lvl;landing.position.set(px-.4,yy,-d*.14);g.add(landing);
  const rail=new THREE.Mesh(new THREE.CylinderGeometry(2.62,2.62,.16,28),material(red));
  rail.name='W_barandal_rojo_escalera';rail.position.set(px-.4,yy+.62,-d*.14);g.add(rail);
  const ramp=box(g,'W_rampa_escalera_'+lvl,px-.3,yy-story*.45,d*.04,2.1,.38,4.5,'#bdbab0');ramp.rotation.x=-.48;
  for(const s of [-1,1])box(g,'W_barandal_rampa_escalera',px-.3+s*.95,yy-story*.2,d*.04,.08,.85,4.2,red);
 }
 // Primera letra (EAE 07) frente a W hacia P. Alzados y planta del catálogo, imágenes 0102 y 0103.
 const sc=new THREE.Group();sc.name='W_escultura_negra_acceso';
 sc.userData={name:'Primera letra',artist:'Vicente Rojo',catalogId:'EAE 07',material:'Acero al carbón pintado',approximate:true};
 const [wX1,wZ1,wX2,wZ2]=b.rects[0];
 sc.position.set(X(1212)-X((wX1+wX2)/2),.10,Z(346)-Z((wZ1+wZ2)/2));g.add(sc);
 const acero='#252a2d';
 box(sc,'W_pedestal_escultura_negra',0,.045,0,2.02,.09,2.08,'#999a93');
 function perfilW(nombre,a,b,ancho=.14,fondo=.16){
  const base=new THREE.Vector3(...a),punta=new THREE.Vector3(...b),delta=punta.clone().sub(base),medio=base.addScaledVector(delta,.5);
  const perfil=box(sc,nombre,medio.x,medio.y,medio.z,ancho,delta.length(),fondo,acero);
  perfil.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
 }
 perfilW('W_poste_escultura_negra',[-.79,.09,.68],[-.03,5.23,.68]);
 perfilW('W_poste_escultura_negra',[.78,.09,.68],[-.03,5.23,.68]);
 perfilW('Primera_letra_travesaño',[-.48,2.16,.68],[.47,2.16,.68],.123,.15);
 for(const x of [-.61,.66])perfilW('W_poste_escultura_negra',[x,.09,-.67],[x,4.38,-.67]);
 perfilW('Primera_letra_travesaño',[-.68,3.96,-.67],[.74,3.96,-.67],.23,.15);
 perfilW('Primera_letra_arriostre',[-.58,.17,-.67],[.58,3.85,-.67]);
 perfilW('Primera_letra_arriostre',[.66,.15,-.67],[.36,2.55,.68]);
 perfilW('Primera_letra_travesaño',[-.61,2.20,-.67],[-.47,2.20,.68],.105,.125);
 perfilW('Primera_letra_travesaño',[-.61,3.76,-.67],[-.46,3.76,.68],.20,.13);
 for(const [x,y,z,r,giro] of [[-.57,4.14,-.67,.335,0],[.63,4.56,-.67,.34,0],[-.60,3.78,.53,.285,Math.PI/2]]){
  const disco=new THREE.Mesh(new THREE.CylinderGeometry(r,r,.15,28),material(acero));
  disco.name='Primera_letra_disco';disco.rotation.order='YXZ';disco.rotation.set(Math.PI/2,giro,0);
  disco.position.set(x,y,z);disco.castShadow=true;sc.add(disco);
 }
}

function azcBuildingP2(part,b,w,d,h){
 const g=new THREE.Group();g.name='P2_AZC_talleres_2P';g.userData={building:'P2',floors:b.floors,approximate:true,reference:'Corpus confirmado UAM-A: imagen_0036, 0047, 0048, 0059, 0065, 0088, 0093, 0094'};part.add(g);
 const wallColor='#c7cbd0',terra='#b6473b',blueDoor='#254b8c',story=data.storeyHeight;
 box(g,'P2_cuerpo_gris_claro',0,h/2,0,w,h,d,wallColor);
 box(g,'Azotea',0,h+.2,0,w+.25,.4,d+.25,'#cfd3d6');
 box(g,'P2_franja_superior_terracota',0,h-.42,0,w+.22,.78,d+.22,terra);
 for(const side of [-1,1]){
  box(g,'Pretil',0,h+.5,side*d/2,w,.45,.24,'#b8bdc2');
  box(g,'Remate lateral',side*w/2,h+.5,0,.24,.45,d,'#b8bdc2');
  for(let z=-d/2+4;z<=d/2-4;z+=8.5)box(g,'P2_pilastra_concreto',side*(w/2+.08),h/2,z,.24,h,.42,'#b4b9bf');
  // Marcos de ventana rojos/terracota salientes en PB y P1 (imagen_0036, 0059, 0065, 0088).
  for(const f of [0,1])for(let z=-d/2+6;z<=d/2-8;z+=8.5){
   if(f===0&&Math.abs(z)<10)continue;
   const wy=f===0?1.65:story+1.75;
   box(g,'P2_marco_ventana_rojo',side*(w/2+.16),wy,z,.32,1.42,2.75,terra);
   // El vidrio sobresale lo suficiente para separar sus caras del marco.
   box(g,'Ventana_lateral_nivel_'+f,side*(w/2+.245),wy,z,.2,1.08,2.35,'#3d525b');
  }
  // Portones azules de taller mecánico (TMEC), rampas de acceso vehicular/peatonal y marquesina ligera roja (imagen_0036, 0065, 0093).
  for(const zDoor of [-4.5,4.5]){
   box(g,'P2_porton_azul_taller',side*(w/2+.1),1.6,zDoor,.2,3.1,3.5,blueDoor);
   box(g,'P2_letrero_TMEC',side*(w/2+.14),3.28,zDoor,.14,.38,2.2,'#eceee9');
   const rTaller=box(g,'P2_rampa_taller',side*(w/2+1.25),.14,zDoor,2.3,.18,3.6,'#bab8ae');rTaller.rotation.z=side*.05;
  }
  box(g,'P2_marquesina_roja',side*(w/2+1.15),3.42,0,2.3,.16,d*.72,terra);
  for(let z=-d*.32;z<=d*.32;z+=8.5)box(g,'P2_columna_marquesina',side*(w/2+2.1),1.7,z,.14,3.4,.14,terra);
 }
 // Mesas de trabajo exteriores bajo la marquesina oriente (imagen_0036).
 for(const zTable of [-14,-8,10,16])box(g,'P2_mesa_exterior',w/2+1.35,.45,zTable,1.1,.75,1.8,'#9da2a6');
 // Anexo bajo terracota con portón de persiana roja, rampa y tinaco en azotea (imagen_0059, 0065, 0088).
 box(g,'P2_anexo_terracota',-w*.16,1.8,d/2+2.6,w*.72,3.6,5.2,terra);
 box(g,'P2_porton_persiana_roja',-w*.2,1.45,d/2+5.25,3.4,2.65,.18,'#8f2224');
 box(g,'P2_rampa_anexo_sur',-w*.2,.14,d/2+6.4,3.4,.18,2.2,'#c2bfb4');
 const tank=new THREE.Mesh(cylinder,material('#24282c'));tank.name='P2_tinaco_azotea';tank.position.set(-w*.08,4.35,d/2+2.4);tank.scale.set(.82,1.5,.82);g.add(tank);
 // Invernadero ligero lateral junto a P2 con bastidor blanco (imagen_0036, imagen_0047).
 const gh=new THREE.Mesh(cube,new THREE.MeshPhysicalMaterial({color:'#d4e8e4',transparent:true,opacity:.58,roughness:.22}));
 gh.name='P2_invernadero_lateral';gh.position.set(-w/2-2.3,1.45,-d*.18);gh.scale.set(3.8,2.8,6.4);g.add(gh);
 for(const dz of [-3.1,0,3.1])box(g,'P2_marco_invernadero',-w/2-2.3,1.45,-d*.18+dz,3.9,2.85,.1,'#eef0ec');
 // Rótulo volumétrico rojo "2P" en esquina superior (imagen_0059, imagen_0088).
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=160;const ctx=canvas.getContext('2d');ctx.fillStyle='#c4282c';ctx.textAlign='center';ctx.font='bold 128px sans-serif';ctx.fillText('2P',128,125);const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
 for(const [zx,rotY] of [[d/2+.2,0],[-d/2-.2,Math.PI]]){
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(2.8,1.75),new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide}));
  sign.name='P2_rotulo_rojo_2P';sign.userData.disposeMaterial=zx>0;sign.rotation.y=rotY;sign.position.set(-w*.22,h-.95,zx);g.add(sign);
 }
}
function azcBuildingJ(part,b,w,d,h){
 const g=new THREE.Group();g.name='J_cafeteria_y_lucernario';g.userData={approximate:true,reference:'imagen_0004, imagen_0155 y Cafetería J en Maps'};part.add(g);
 const front=-d/2,recess=.38,band=Math.min(1.18,h*.35),soffit=h-band+.2,glass=front+recess-.09;
 const frame='#8e938d',glassColor='#364346',red='#a3232b';
 // El recorrido de 7:54 a 8:09 muestra el cancel girando hacia la galería lateral.
 const pasoLateral=Math.min(2.55,w*.17),centroComedor=-pasoLateral/2,limiteComedor=w/2-pasoLateral;
 box(g,'Cuerpo de concreto',centroComedor,soffit/2,recess/2,w-pasoLateral,soffit,d-recess,'#a3a39a');
 box(g,'J_fascia_concreto',0,soffit+band/2,0,w+1,band,d+.8,'#898b82');
 box(g,'Azotea',0,h+.28,0,w+.32,.16,d+.32,b.roof||'#a54f42');
 box(g,'J_umbral_bajo_canceleria',0,.20,front+.03,w-.58,.14,1.18,'#c0b5a4');
 box(g,'J_rampa_acceso',-w*.25,.18,front-1.4,3.2,.22,2.6,'#c4c2b6');
 const span=w-pasoLateral-.50,bays=Math.max(6,Math.round(span/1.56)),bay=span/bays,base=.27,windowHeight=soffit-base-.08;
 for(let i=0;i<bays;i++){
  const x=centroComedor-span/2+bay*(i+.5),centerDoor=Math.abs(x)<=bay*.6;
  box(g,'J_ventanal_cafeteria',x,base+windowHeight/2,glass,bay-.07,windowHeight,.085,i%3===0?'#485554':glassColor);
  box(g,'J_franja_naranja_cancel',x,base+windowHeight*.48,glass-.056,bay-.08,.10,.025,'#bf6234');
  if(centerDoor){
   box(g,'J_encuentro_hojas_acceso',x,base+windowHeight/2,glass-.06,.052,windowHeight,.061,'#a4a69b');
   for(const side of [-1,1])box(g,'J_tirador_acceso',x+side*.14,1.13,glass-.105,.052,.27,.09,'#b8b8aa');
  }else box(g,'J_rail_inferior_cancel',x,.42,glass-.05,bay-.07,.055,.051,frame);
 }
 for(let i=0;i<=bays;i++)box(g,'J_montante_cancel',centroComedor-span/2+bay*i,base+windowHeight/2,glass-.035,.065,windowHeight+.07,.086,frame);
 for(const y of [base,base+windowHeight*.74,base+windowHeight])
  box(g,'J_travesano_cancel',centroComedor,y,glass-.044,span+.07,.06,.075,frame);

 const lateral=new THREE.Group();lateral.name='J_galeria_lateral_de_cafeteria';
 lateral.userData={approximate:true,reference:'Recorrido en RV, 7:54–8:09; planta de remodelación, 2009'};
 g.add(lateral);
 const vidrioLateral=limiteComedor+.04,comienzo=front+.36,largo=d*.67;
 const anchoPaño=1.36,paños=Math.floor(largo/anchoPaño),altoRejilla=.43;
 const altoVidrio=windowHeight-altoRejilla;
 box(lateral,'J_loseta_terracota_en_galeria',limiteComedor+pasoLateral/2,.281,0,pasoLateral,.078,d,'#b07061');
 for(let i=0;i<paños;i++){
  const z=comienzo+(i+.5)*anchoPaño;
  box(lateral,'J_cancel_lateral',vidrioLateral,base+altoVidrio/2,z,.074,altoVidrio,anchoPaño-.05,
   i%3===1?'#526661':'#465450');
  box(lateral,'J_banda_naranja_lateral',vidrioLateral+.052,base+altoVidrio*.58,z,.025,.125,anchoPaño-.065,'#c16c38');
  box(lateral,'J_montante_de_galeria',vidrioLateral+.028,base+windowHeight/2,z-anchoPaño/2,.069,windowHeight,.067,frame);
  box(lateral,'J_fondo_rejilla_lateral',vidrioLateral,soffit-.08-altoRejilla/2,z,.060,altoRejilla,anchoPaño-.06,'#696d61');
  for(let k=0;k<5;k++)box(lateral,'J_lama_de_ventilacion',vidrioLateral+.035,soffit-.12-k*.078,z,.076,.029,anchoPaño-.06,'#a0a698');
 }
 const largoCancel=paños*anchoPaño;
 for(const y of [base+.07,base+altoVidrio*.35,base+altoVidrio])box(lateral,'J_travesaño_lateral',
  vidrioLateral+.066,y,comienzo+largoCancel/2,.042,.056,largoCancel,frame);
 for(let z=front+1.45;z<d/2-.4;z+=3.05){
  box(lateral,'J_junta_de_loseta_lateral',limiteComedor+pasoLateral/2,.324,z,pasoLateral,.005,.025,'#a06257');
  box(lateral,'J_luz_empotrada_galeria',w/2-pasoLateral*.4,soffit-.018,z,.45,.032,.43,'#e3e2da');
 }
 for(const side of [-1,1])for(const x of [-w*.3,-w*.1,w*.1,w*.3])
  box(g,'J_junta_hormigon_alero',x,soffit+band/2,side*(d/2+.405),.027,band*.94,.008,'#6f756d');
 for(const x of [-w*.31,-w*.1,w*.11,w*.32])
  box(g,'J_luminaria_empotrada_alero',x,soffit-.016,front-.19,.31,.023,.22,'#e7d8af');
 const mark=new THREE.Group();mark.name='J_rotulo_rojo';mark.position.set(w*.38,soffit+band*.49,front-.46);g.add(mark);
 const j=new THREE.Shape();j.moveTo(-.14,.29);j.lineTo(.13,.29);j.lineTo(.13,-.24);
 j.quadraticCurveTo(.13,-.45,-.14,-.45);j.lineTo(-.29,-.44);j.lineTo(-.29,-.23);j.lineTo(-.20,-.23);
 j.quadraticCurveTo(-.14,-.23,-.14,-.14);j.closePath();
 const letter=new THREE.Mesh(new THREE.ExtrudeGeometry(j,{depth:.09,bevelEnabled:false,curveSegments:8}),material(red));
 letter.rotation.y=Math.PI;mark.add(letter);
 box(mark,'J_punto_rotulo',0,.42,-.038,.26,.18,.09,red);
 // El lucernario tiene una meseta y cuatro faldones inclinados, no dos cuerpos superpuestos.
 const baseW=w*.46,baseD=d*.30,low=h+.54,rise=Math.min(1.12,h*.34);
 const corners=[
  [-baseW/2,low,-baseD/2],[-baseW/2,low,baseD/2],[baseW/2,low,baseD/2],[baseW/2,low,-baseD/2],
  [-baseW*.34,low+rise,-baseD*.20],[-baseW*.34,low+rise,baseD*.20],
  [baseW*.34,low+rise,baseD*.20],[baseW*.34,low+rise,-baseD*.20],
 ];
 box(g,'J_zocalo_lucernario',0,low-.09,0,baseW+.16,.24,baseD+.16,'#627471');
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(corners.flat(),3));
 geometry.setIndex([0,4,5,0,5,1,1,5,6,1,6,2,2,6,7,2,7,3,3,7,4,3,4,0,4,7,6,4,6,5]);
 geometry.computeVertexNormals();
 const roof=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({
  color:'#8da7a0',roughness:.24,metalness:.08,side:THREE.DoubleSide,transparent:true,opacity:.72,
 }));
 roof.name='J_lucernario_piramidal';roof.userData.disposeMaterial=true;g.add(roof);
 const mullion=(a,b)=>{
  const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av);
  const beam=box(g,'J_marco_lucernario',...av.clone().add(bv).multiplyScalar(.5).toArray(),.072,delta.length(),.072,'#687d78');
  beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
 };
 for(let i=0;i<4;i++){
  const next=(i+1)%4;mullion(corners[i],corners[4+i]);mullion(corners[4+i],corners[4+next]);
  for(const t of [.25,.5,.75])mullion(
   corners[i].map((v,j)=>v+(corners[next][j]-v)*t),
   corners[4+i].map((v,j)=>v+(corners[4+next][j]-v)*t));
 }
}
function azcBuildingR(part,b,w,d,h){
 const g=new THREE.Group();g.name='R_fachadas_y_subestacion';g.userData={approximate:true,reference:'imagen_0060 del corpus exterior de Azcapotzalco'};part.add(g);
 const recess=.92,eave=h*.62,front=d/2,volumeW=w*.69,volumeX=w*.07,concrete='#aeb1ae';
 box(g,'Cuerpo de concreto',0,h/2,-recess/2,w,h,d-recess,concrete);
 box(g,'R_volumen_superior_rojo',volumeX,(eave+h)/2,front-.22,volumeW,h-eave,2.16,'#bd453d');
 box(g,'Azotea',0,h+.17,-recess/2,w+.24,.34,d-recess+.16,b.roof||'#c9cac0');
 const sill=.55,span=volumeW-.28,panes=Math.max(8,Math.round(span/2.35)),panelWidth=span/panes,glassZ=front-recess+.045;
 for(let i=0;i<panes;i++){
  const x=volumeX-span/2+(i+.5)*panelWidth;
  box(g,'R_ventanal_frente_bajo_volado',x,(eave+sill)/2,glassZ,panelWidth-.075,eave-sill-.06,.09,i%4===0?'#697578':'#48565c');
 }
 for(let i=0;i<=panes;i++)box(g,'R_montante_ventanal',volumeX-span/2+i*panelWidth,(eave+sill)/2,glassZ+.06,.075,eave-sill,.072,'#a4aca8');
 for(const y of [sill,eave*.47,eave*.73,eave-.05])
  box(g,'R_travesano_ventanal',volumeX,y,glassZ+.062,span,.07,.078,'#a1aaa6');
 for(let dx=-volumeW/2+.14;dx<volumeW/2;dx+=.33)
  box(g,'R_nervadura_volumen_rojo',volumeX+dx,(eave+h)/2,front+.875,.064,h-eave-.065,.046,'#ac3d36');
 for(const y of [h*.31,h*.64]){
  box(g,'R_junta_horizontal_concreto',-w/2-.009,y,-recess/2,.016,.035,d-recess-.1,'#909692');
  box(g,'R_junta_horizontal_concreto',w/2+.009,y,-recess/2,.016,.035,d-recess-.1,'#909692');
 }
 // Letra del edificio como relieve angular, y marca tipográfica en el paño ciego.
 const mark=new THREE.Group();mark.name='R_rotulo_rojo';mark.position.set(volumeX-volumeW/2-.64,h-.98,glassZ+.065);g.add(mark);
 box(mark,'R_letra_trazo_vertical',-.16,0,.04,.18,.89,.09,'#aa322d');
 box(mark,'R_letra_remate',.045,.32,.04,.33,.21,.09,'#aa322d');
 box(mark,'R_letra_caida',.21,.224,.04,.15,.22,.09,'#aa322d');
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=148;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#343d40';ctx.textAlign='center';ctx.font='bold 81px sans-serif';
 ctx.fillText('UAM',128,88);ctx.font='18px sans-serif';ctx.fillText('Casa abierta al tiempo',128,116);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const sign=new THREE.Mesh(new THREE.PlaneGeometry(3.8,2.2),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}));
 sign.name='R_emblema_monumental_UAM';sign.userData.disposeMaterial=true;sign.rotation.y=-Math.PI/2;
 sign.position.set(-w/2-.022,h-1.76,-d*.18);g.add(sign);
 const cx=-w*.12,cz=front+3.8,caseW=4.6,caseD=3.4;
 box(g,'R_caseta_subestacion_roja',cx,1.35,cz,caseW,2.7,caseD,'#a04a3c');
 box(g,'R_caseta_coronamiento',cx,2.72,cz,caseW+.16,.14,caseD+.16,'#8c3b32');
 for(const dx of [-.99,.99]){
  box(g,'R_marco_rejilla_subestacion',cx+dx,1.22,cz+caseD/2+.03,1.93,2.21,.08,'#692e29');
  box(g,'R_puerta_rejilla_subestacion',cx+dx,1.22,cz+caseD/2+.083,1.73,2.01,.025,'#47352f');
  for(let y=.28;y<2.2;y+=.145)box(g,'R_lama_rejilla_subestacion',cx+dx,y,cz+caseD/2+.104,1.71,.045,.046,'#533b33');
 }
 for(const side of [-1,1])for(const dz of [-.82,.82])
  box(g,'R_rejilla_lateral_subestacion',cx+side*(caseW/2+.022),2.03,cz+dz,.048,.48,1.22,'#553b33');
 box(g,'R_rampa_acceso',w*.15,.18,front+1.3,3.2,.22,2.5,'#c4c2b6');
}
function building(b){const g=new THREE.Group();g.name='Edificio_'+b.id;g.userData={id:b.id,name:b.name||b.id,floors:b.floors,approximate:true};g.position.set(b.offsetX||0,0,b.offsetZ||0);world.add(g);buildingGroups.set(b.id,g);const h=b.height??b.floors*data.storeyHeight;
 for(const [idx,r] of b.rects.entries()){
  // La caja de referencia de un pabellón es la envolvente del rombo ya girado.
  const diagonalFactor=b.diamond?Math.SQRT1_2:1;
  const w=(r[2]-r[0])*S()*diagonalFactor,d=(r[3]-r[1])*S()*diagonalFactor,x=X((r[0]+r[2])/2),z=Z((r[1]+r[3])/2);
  if(b.construction){
   // Edificio A en obra: pórticos de concreto de 2 niveles con vigas pasantes, celosía café en P1 y tapial de lámina (imagen_0050).
   box(g,'Losa en construcción',x,.45,z,w,.45,d,'#b8b8aa');
   box(g,'Losa_nivel_1_A',x,3.5,z,w*.94,.38,d*.92,'#b2b3a8');
   box(g,'Losa_cubierta_A',x,6.6,z,w*.92,.35,d*.9,'#b8b9ae');
   for(let i=0;i<5;i++)for(let j=0;j<3;j++)box(g,'Columna sin terminar',x-w*.43+i*(w*.86)/4,3.4,z-d*.4+j*(d*.8)/2,.58,6.6,.58,'#9e9f95');
   for(const yBeam of [3.5,6.6])for(const s of [-1,1])box(g,'Viga',x,yBeam,z+s*(d*.42),w*.94,.55,.55,'#b8b6a9');
   for(let k=-w*.36;k<=w*.36;k+=1.8)box(g,'A_celosia_vertical',x+k,4.85,z-d*.42,.18,2.1,.28,'#6d4c3b');
   for(const s of [-1,1])box(g,'Cerca de obra',x,1.05,z+s*(d/2+.2),w+1,2.1,.18,'#c4c8cc');
   for(const s of [-1,1])box(g,'A_tapial_lateral',x+s*(w/2+.2),1.05,z,.18,2.1,d,'#c4c8cc');
   continue;
  }
  const part=new THREE.Group();part.name=b.id+'_volumen_'+idx;part.position.set(x,0,z);if(b.diamond)part.rotation.y=b.facadeYaw??Math.PI/4;g.add(part);
  if(b.pavilion){
   pavilion(part,b,w,d,h);
   detallarVestibuloHO({THREE,part,b,w,d,h,box,material,data});
   continue;
  }
  if(b.id==='G'){azcBuildingG(part,b,w,d,h);continue;}
  if(b.id==='I'){azcBuildingI(part,idx,b,w,d,h);continue;}
  if(b.id==='T'){azcBuildingT(part,b,w,d,h);continue;}
  if(b.id==='W'){azcBuildingW(part,b,w,d,h);continue;}
  if(b.id==='P2'){azcBuildingP2(part,b,w,d,h);continue;}
  if(b.id==='J'){azcBuildingJ(part,b,w,d,h);continue;}
  if(b.id==='Q'){construirFachadaQ({THREE,part,w,d,h,box,material});continue;}
  if(b.id==='M'){construirFachadaM({THREE,part,w,d,h,box,material});continue;}
  if(b.id==='R'){azcBuildingR(part,b,w,d,h);continue;}
  if(b.id==='O'){construirEdificioO({THREE,part,b,w,d,h,box,data});continue;}
  if(b.id==='S'){construirGaleriaSTalleres({THREE,part,b,w,d,h,box,data});continue;}
  const gallery=b.openGallery||b.galleryParts?.includes(idx),galleryWidth=Math.min(2.8,d*.32),galleryTop=Math.min(h,3*data.storeyHeight);
  if(gallery){
   box(part,'Cuerpo integrado al pasillo',0,h/2,-galleryWidth/2,w,h,d-galleryWidth,'#d3d0bd');
   if(h>galleryTop)box(part,'Piso superior sobre galería',0,(h+galleryTop)/2,(d-galleryWidth)/2,w,h-galleryTop,galleryWidth,'#d3d0bd');
   for(const level of [0,1,2])if(level<b.floors){const yy=level===0?.35:level*data.storeyHeight;
    box(part,'Galería_integrada_'+level,0,yy-.15,(d-galleryWidth)/2,w,.3,galleryWidth,'#c8c4b3');
    if(level>0)box(part,'Antepecho de galería',0,yy+.5,d/2-.13,w,.8,.2,'#d3d0bd');
   }
   const divisions=Math.max(1,Math.ceil(w/5));for(let i=0;i<=divisions;i++)box(part,'Pilar integrado',-w/2+i*w/divisions,galleryTop/2,d/2-.2,.3,galleryTop,.35,'#b7beaf');
  }else if(b.id==='F'&&b.floors>1)construirCuerpoConGaleriaF({THREE,part,w,d,h,box,material,data});
  else box(part,'Cuerpo de concreto',0,h/2,0,w,h,d,b.reinforced?'#d4d6d1':'#d3d0bd');
  for(let f=0;f<b.floors;f++){
   const wy=f*data.storeyHeight+2;
   if(w>4)for(const side of [-1,1]){if((gallery&&side===1&&f<3)||(b.id==='F'&&f===1&&side===-1)||(b.id==='K'&&side===-1))continue;
    box(part,'Ventana_nivel_'+f,0,wy,side*(d/2+.025),w-1,1.15,.1,'#425f61');
    for(let k=-w/2+3;k<w/2-1;k+=3)box(part,'Montante',k,wy,side*(d/2+.09),.11,1.2,.1,'#c8c8b9');
   }
   if(d>4&&!(b.id==='F'&&f===1))for(const side of [-1,1])box(part,'Ventana_lateral_nivel_'+f,side*(w/2+.025),wy,0,.1,1.15,d-1,'#425f61');
  }
  box(part,'Azotea',0,h+.2,0,w+.25,.4,d+.25,b.roof||'#dcded2');
  for(const side of [-1,1]){
   box(part,'Pretil',0,h+.55,side*d/2,w,.55,.25,'#c2c5b7');
   box(part,'Remate lateral',side*w/2,h+.55,0,.25,.55,d,'#c2c5b7');
   if(!b.reinforced)box(part,'Acento guinda',side*(w/2-.7),h/2,d/2+.1,1.1,h,.17,'#823747');
  }
  if(b.reinforced)reinforceG(part,w,d,h,b.floors);
  if(b.id==='H')detallarFachadaH({part,b,w,d,idx,box,data});
  if(b.id==='K'){
   construirFachadaKEstacionamiento({THREE,part,b,w,d,h,box});
   // El giro del video 360° a los 8:00 permite leer la k roja desde la galería de J.
   const rotulo=new THREE.Group();rotulo.name='K_rotulo_rojo_hacia_J';
   rotulo.userData={approximate:true,reference:'Recorrido en RV, 8:00, vista girada desde J'};
   rotulo.position.set(-w/2+w*.064,h-1.12,d/2+.12);part.add(rotulo);
   const rojo='#aa3541';
   box(rotulo,'K_asta_del_rotulo',-.19,0,0,.162,1.15,.135,rojo);
   box(rotulo,'K_brazo_superior_del_rotulo',.048,.047,0,.156,.54,.135,rojo).rotation.z=-.96;
   box(rotulo,'K_brazo_inferior_del_rotulo',.07,-.32,0,.16,.65,.135,rojo).rotation.z=.79;
  }
  if(b.id==='L')construirCubiertaL({THREE,part,w,d,h,box,material});
  else if(b.ribbed)for(let zz=-d/2+1;zz<d/2;zz+=2.4)box(part,'Nervadura de cubierta',0,h+.6,zz,w,.35,.22,'#7e2426');
  if(b.skylight){box(part,'Lucernario base',0,h+1,0,w*.47,1.4,d*.47,'#36464a');box(part,'Lucernario vidrio',0,h+1.8,0,w*.35,.3,d*.35,'#9cbcc2');}
  if(b.diamond){const roof=new THREE.Mesh(new THREE.ConeGeometry(Math.min(w,d)*.74,3,4),material('#e5dfc3'));roof.position.y=h+1.7;roof.rotation.y=Math.PI/4;roof.castShadow=true;part.add(roof);box(part,'Remate cuadrado',0,h+3.3,0,w*.45,.4,d*.45,'#5a6467');box(part,'Tragaluz',0,h+3.6,0,2,.15,2,'#b6cdcd');}
  if(['H','K','W'].includes(b.id)&&idx===0){for(let n=0;n<2;n++)box(part,'Equipo de azotea',w/2-2-n*2.6,h+.9,0,1.8,.8,1.8,'#728182');}
  // Bloques académicos B, C, D, E, F: galerías con antepechos corridos de concreto blanco-grisáceo, franja de sombra y seto perimetral (imagen_0025, 0040, 0049, 0150).
  if(['B','C','D','E','F'].includes(b.id)){
   for(let f=0;f<b.floors;f++){
    const py=f*data.storeyHeight+1.05;
    for(const side of [-1,1]){
     if((b.id==='F'&&f===1&&side===-1)||(b.id==='E'&&side===1&&f<3))continue;
     if(w>=d){
      box(part,'Antepecho_balcon_nivel_'+f,0,py,side*(d/2+.16),w+.1,1.15,.22,'#cfcfc6');
      box(part,'Sombra_galeria_nivel_'+f,0,py+1.02,side*(d/2+.08),w-.6,.82,.14,'#253034');
     }else{
      box(part,'Antepecho_balcon_nivel_'+f,side*(w/2+.16),py,0,.22,1.15,d+.1,'#cfcfc6');
      box(part,'Sombra_galeria_nivel_'+f,side*(w/2+.08),py+1.02,0,.14,.82,d-.6,'#253034');
     }
    }
   }
   if(b.id==='C'&&idx===0){
    if(w>=d)box(part,'Seto_perimetral_C',0,.42,d/2+1.1,w*.86,.65,.85,'#486b3f');
    else box(part,'Seto_perimetral_C',w/2+1.1,.42,0,.85,.65,d*.82,'#486b3f');
   }
  }
  if(b.id==='P1'){
   box(part,'P1_torre_azulejo_azul',w/2-.95,(h+2.8)/2,d/2-.95,2.5,h+2.8,2.5,'#1e4598');
   for(let y=1;y<h+2.6;y+=1.1)box(part,'P1_reticula_azulejo',w/2-.95,y,d/2-.95,2.56,.06,2.56,'#dde3ec');
   box(part,'P1_escalera_exterior',w/2+1.15,1.2,d/2-3.4,2.1,2.4,4.8,'#b8b7ac');
   box(part,'P1_muro_rampa_escalera',w/2+2.15,1.35,d/2-3.4,.22,2.6,4.8,'#c8b5a2');
   box(part,'P1_rampa_acceso',w/2+1.25,.18,d*.18,2.4,.22,4.2,'#c4c2b6');
   box(part,'P1_marquesina_roja',w/2+1.05,3.3,0,2.1,.16,d*.76,'#b64238');
   box(part,'P1_puerta_roja',w/2+.08,1.35,d*.2,.16,2.4,2.1,'#a82428');
   // Luminarias de poste rojo con globo blanco junto a P1 (imagen_0013).
   for(const dz of [-d*.28,d*.08,d*.38]){
    box(part,'P1_poste_rojo_luminaria',w/2+3.1,1.75,dz,.12,3.5,.12,'#a82428');
    const gl=new THREE.Mesh(crown,material('#f4f3ea'));gl.name='P1_globo_luminaria';gl.scale.setScalar(.28);gl.position.set(w/2+3.1,3.62,dz);part.add(gl);
   }
  }
  if(b.id==='P3'){
   // Nave norte con muro de piedra/block rústico (imagen_0015, 0022, 0027).
   box(part,'P3_muro_piedra_taller',0,h/2,-d*.16,w+.12,h-.2,d*.46,'#92897b');
   box(part,'P3_dala_concreto',0,data.storeyHeight,-d*.16,w+.18,.28,d*.47,'#c8c9c2');
   box(part,'P3_franja_terracota',0,h-.38,0,w+.24,.82,d+.24,'#b85442');
   // Anexo bajo a dos aguas con base terracota, franja gris y friso de tabique aparente (imagen_0015, 0022, 0027).
   const ax=-w/2-2.6,az=-d*.24,aw=4.8,ad=7.6;
   box(part,'P3_anexo_dos_aguas',ax,1.35,az,aw,2.7,ad,'#b85442');
   box(part,'P3_franja_gris_anexo',ax,2.25,az,aw+.08,.45,ad+.08,'#adb0ad');
   box(part,'P3_friso_ladrillo_anexo',ax,2.78,az,aw+.06,.62,ad+.06,'#8c4438');
   for(const s of [-1,1]){
    const roofHalf=box(part,'P3_techo_dos_aguas',ax+s*(aw*.26),3.32,az,aw*.58,.12,ad+.4,'#e4e6e2');
    roofHalf.rotation.z=-s*.22;
   }
   box(part,'P3_andador_cubierto_rojo',-w/2-1.35,3.2,d*.14,2.6,.16,d*.56,'#b63830');
   for(let z=-d*.1;z<=d*.38;z+=6.5){
    const c=new THREE.Mesh(cylinder,material('#b8bab4'));c.name='P3_columna_andador';c.position.set(-w/2-2.3,1.6,z);c.scale.set(.22,3.2,.22);part.add(c);
   }
   // Tubería amarilla elevada y vigas rojas de ensayo estructural en el patio P3–P4 (imagen_0015, 0022, 0027, 0035).
   box(part,'P3_tuberia_amarilla',-w/2-2.2,3.58,d*.08,3.8,.12,.12,'#dfb22b');
   box(part,'P3_viga_ensayo_roja',-w/2-4.2,.32,-d*.04,.55,.55,7.4,'#8f2426');
   box(part,'P3_viga_ensayo_roja',-w/2-5.4,.32,-d*.08,1.8,.55,1.2,'#8f2426');
   box(part,'P3_rampa_acceso',-w/2-1.35,.18,d*.28,2.4,.22,4.4,'#c4c2b6');
  }
  if(b.id==='SH2'){
   // Módulo sanitario terracota con franja superior de ventana con reja negra y lavaderos exteriores (imagen_0015, 0035).
   box(part,'SH2_muro_terracota',0,h/2,0,w+.12,h,d+.12,'#c46252');
   box(part,'SH2_ventana_reja_superior',0,h-.75,0,w+.18,.68,d*.82,'#1e2426');
   box(part,'SH2_lavaderos_exteriores',w/2+.65,.22,0,1.1,.28,2.8,'#cbcac0');
  }
  if(b.id==='P4'&&idx===0){
   for(let f=0;f<b.floors;f++)box(part,'P4_franja_terracota',0,f*data.storeyHeight+1.1,0,w+.2,.95,d+.2,'#b65344');
   // Escalinata de 6 peldaños y rampa peatonal accesible con doble barandal rojo en PB (imagen_0016).
   for(let s=1;s<=6;s++)box(part,'P4_escalinata_acceso',-w/2-.35*s,.08*s,-d*.22,2.2-.28*s,.16*s,4.2,'#b56552');
   const rP4=box(part,'P4_rampa_visual_acceso',-w/2-1.25,.42,d*.1,2.3,.22,7.2,'#c2c0b4');rP4.rotation.x=.09;
   for(const s of [-1,1])for(const ry of [.65,.98])box(part,'P4_barandal_rojo_rampa',-w/2-1.25+s*1.02,ry,d*.1,.08,.08,7.1,'#b8292f');
   // Patio cubierto de estudio de 1 nivel (y=3.4 m) con estructura roja, piso circular terracota, luminarias globo y mesas (imagen_0021, 0032).
   const patioW=6.4,patioL=d*.62,patioX=-w/2-patioW/2-.1;
   box(part,'P4_patio_cubierto_estudio',patioX,3.45,0,patioW,.22,patioL,'#b5312c');
   const patioFloor=new THREE.Mesh(new THREE.CylinderGeometry(patioW*.45,patioW*.45,.14,32),material('#b56552'));
   patioFloor.name='P4_piso_circular_patio';patioFloor.position.set(patioX,.18,0);part.add(patioFloor);
   for(let z=-patioL*.42;z<=patioL*.42;z+=6.2){
    box(part,'P4_columna_patio',patioX-patioW*.42,1.72,z,.24,3.4,.24,'#b8292f');
    box(part,'P4_mesa_estudio',patioX,0.45,z,1.4,.75,1.8,'#c8c6ba');
    const lamp=new THREE.Mesh(crown,material('#f7f5eb'));lamp.name='P4_luminaria_globo';lamp.scale.setScalar(.24);lamp.position.set(patioX,3.1,z);part.add(lamp);
   }
   // Árbol amarillo de conexiones de acero del Departamento de Materiales y óculos de ventilación (imagen_0019, 0040).
   const sx=-w/2-2.8,sz=-d*.38,yellow='#deb028';
   box(part,'P4_base_arbol_acero',sx,.18,sz,1.2,.12,1.2,yellow);
   box(part,'P4_escultura_amarilla',sx,1.55,sz,.36,2.8,.36,yellow);
   for(const by of [1.1,2.2])box(part,'P4_brazo_acero_amarillo',sx,by,sz,.32,.38,2.3,yellow);
   const brace=box(part,'P4_diagonal_acero_amarillo',sx,.65,sz-.45,.14,.95,.14,yellow);brace.rotation.x=.65;
   for(const oz of [-d*.42,-d*.34])box(part,'P4_oculo_ventilacion',-w/2-.12,.75,oz,.08,.36,.36,'#222628');
  }
  if(b.id==='E'&&idx===0){
   box(part,'E_rotulo_rojo',w/2-.8,h-1.1,d/2+.22,.55,1.45,.22,'#b8292f');
   box(part,'E_rampa_acceso',0,.18,d/2+1.2,3.4,.22,2.4,'#c4c2b6');
   detallarGaleriaCulturalE({part,w,d,box,data});
  }
  if(b.id==='F'&&idx===0){
   const sky=new THREE.Mesh(new THREE.CylinderGeometry(2.4,2.4,w*.58,20,1,false,0,Math.PI),translucentRoof);
   sky.name='F_domo_curvo';sky.rotation.z=Math.PI/2;sky.scale.set(.58,1,1);sky.position.set(0,h+.35,0);part.add(sky);
   for(let x=-w*.25;x<=w*.25;x+=3.2)box(part,'F_costilla_domo',x,h+1.45,0,.12,.14,2.8,'#eceee9');
  }
 }
 if(b.id==='H'){
  const x=X(824),z=Z(320),hh=h+3;box(g,'Torre_acristalada_H',x,hh/2,z,7,hh,3,'#405961');
  for(let y=1;y<hh;y+=1.8)box(g,'Retícula torre',x,y,z+1.6,7.2,.1,.1,'#b3b8ad');
  for(let xoff=-3.5;xoff<=3.5;xoff+=1.4)box(g,'Montante torre H',x+xoff,hh/2,z+1.6,.1,hh,.1,'#b3b8ad');
  box(g,'Panel geométrico H',x,hh-1.5,z+1.65,7,3,.15,'#9f163f');
  for(let n=0;n<7;n++)box(g,'Detalle panel',x-3+n,hh-1.2+(n%2?-.2:.3),z+1.8,.26,2.2,.1,n%2?'#dedbd3':'#26272b');
 }
 const rs=b.rects;const cx=rs.reduce((s,r)=>s+(r[0]+r[2])/2,0)/rs.length,cy=rs.reduce((s,r)=>s+(r[1]+r[3])/2,0)/rs.length;
 const hitos={A:'A · CICTE',I:'I · Biblioteca',Q:'Q · Gimnasio de pesas'};
 label(hitos[b.id]||b.id,X(cx)+(b.offsetX||0),h+4,Z(cy)+(b.offsetZ||0));
 return g;
}
function bridge(spec){
 const from=data.buildings.find(b=>b.id===spec.from),to=data.buildings.find(b=>b.id===spec.to);
 if(!from||!to||from.floors<=spec.floor||to.floors<=spec.floor)return;
 const a=new THREE.Vector3(X(spec.fromAnchor[0])+(from.offsetX||0),0,Z(spec.fromAnchor[1])+(from.offsetZ||0));
 const b=new THREE.Vector3(X(spec.toAnchor[0])+(to.offsetX||0),0,Z(spec.toAnchor[1])+(to.offsetZ||0));
 const height=spec.floor*data.storeyHeight,width=spec.width||2.6,length=a.distanceTo(b)+.8;
 const g=new THREE.Group();g.name='Puente_'+spec.id;g.userData={from:spec.from,to:spec.to,floor:spec.floor,deckHeight:height,approximate:true};g.position.copy(a).add(b).multiplyScalar(.5);g.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);world.add(g);
 box(g,'Losa_piso_'+spec.floor,0,height-.15,0,width,.3,length,'#babcae');
 for(const side of [-1,1]){
  for(const railHeight of [.55,1.1])box(g,'Barandal',side*width/2,height+railHeight,0,.08,.08,length,'#667d7e');
  for(let z=-length/2;z<=length/2+.01;z+=length/Math.max(1,Math.ceil(length/1.8)))box(g,'Poste_barandal',side*width/2,height+.55,z,.08,1.1,.08,'#667d7e');
 }
 label('Piso 2',g.position.x,height+2,g.position.z,'place');
}
function integratedLink(spec){
 const from=data.buildings.find(b=>b.id===spec.from),to=data.buildings.find(b=>b.id===spec.to);if(!from||!to)return;
 const levels=spec.levels.filter(n=>n<Math.min(from.floors,to.floors));if(!levels.length)return;
 const point=(p,b)=>new THREE.Vector3(X(p[0])+(b.offsetX||0),0,Z(p[1])+(b.offsetZ||0));const a=point(spec.fromAnchor,from),b=point(spec.toAnchor,to),length=a.distanceTo(b)+2,height=(Math.max(...levels)+1)*data.storeyHeight;
 const g=new THREE.Group();g.name='Conexion_integrada_'+spec.id;g.userData={from:spec.from,to:spec.to,levels,integrated:true,approximate:true};g.position.copy(a).add(b).multiplyScalar(.5);g.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);world.add(g);
 // Un cuerpo de unión de tres plantas, apoyado desde PB y con fachadas continuas.
 box(g,'Cuerpo_de_unión',0,height/2,0,spec.width,height,length,'#c6c5b8');
 for(const floor of levels){const yy=floor===0?.35:floor*data.storeyHeight;box(g,floor===0?'Losa_PB':'Losa_piso_'+floor,0,yy-.15,0,spec.width+.12,.3,length,'#b5b9ab');
  for(const side of [-1,1]){box(g,'Ventana_unión_piso_'+floor,side*(spec.width/2+.03),floor*data.storeyHeight+2,0,.1,1.1,Math.max(.5,length-.5),'#708587');for(let z=-length/2+.6;z<length/2;z+=1.5)box(g,'Montante_de_unión',side*(spec.width/2+.1),floor*data.storeyHeight+2,z,.1,1.1,.09,'#d7d6c6');}
 }
 box(g,'Azotea_continua_de_unión',0,height+.1,0,spec.width+.2,.25,length,'#bbbfae');
}
function corridor(spec){
 const stops=spec.stations.map(s=>{const b=data.buildings.find(b=>b.id===s.building);if(!b)throw Error('Falta el edificio '+s.building+' del pasillo');
  const point=p=>new THREE.Vector3(X(p[0])+(b.offsetX||0),0,Z(p[1])+(b.offsetZ||0));return {building:b,spine:point(s.spine),facade:point(s.facade)};});
 const g=new THREE.Group();g.name='Pasillo_'+spec.id;g.userData={route:spec.stations.map(s=>s.building),levels:spec.levels,width:spec.width,integrated:!!spec.integrated,approximate:true};world.add(g);
 function segment(a,b,name,rails=true){const length=a.distanceTo(b);if(length<.01)return;const group=new THREE.Group();group.name=name;group.position.copy(a).add(b).multiplyScalar(.5);group.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);g.add(group);
  const levels=spec.levels.filter(f=>stops.every(s=>s.building.floors>f));const top=(Math.max(...levels)+1)*data.storeyHeight;
  group.userData={start:a.toArray(),end:b.toArray(),levels,approximate:true};
  for(const level of levels){const height=level===0?.35:level*data.storeyHeight;
   box(group,'Losa_'+(level===0?'PB':'piso_'+level),0,height-.15,0,spec.width,.3,length+.12,'#cabfa9');
   if(!spec.integrated&&rails&&level>0)for(const side of [-1,1]){
    for(const rail of [.55,1.1])box(group,'Barandal_piso_'+level,side*spec.width/2,height+rail,0,.08,.08,Math.max(.1,length-1.5),'#6d8080');
   }
  }
  if(spec.integrated)return; // Las fachadas y cubiertas son las del edificio, no una estructura paralela.
  box(group,'Cubierta_del_pasillo',0,top+.1,0,spec.width+.3,.25,length+.12,'#d8d8c9');
  const divisions=Math.max(1,Math.ceil(length/6));for(let i=0;i<=divisions;i++)for(const side of [-1,1])box(group,'Columna_del_pasillo',side*(spec.width/2-.15),top/2,-length/2+i*length/divisions,.22,top,.22,'#a6ad9f');
 }
 for(let i=1;i<stops.length;i++)segment(stops[i-1].spine,stops[i].spine,'Tramo_'+stops[i-1].building.id+'_'+stops[i].building.id);
 for(const s of stops)segment(s.spine,s.facade,'Enlace_'+s.building.id,false);
 const mid=stops[Math.floor(stops.length/2)].spine;label('Pasillo integrado · PB + 1 + 2',mid.x,11.8,mid.z+3,'place');
}
function jacaranda(px,py,index){
 const group=new THREE.Group();group.name='Jacaranda_Plaza_Roja_'+index;group.userData={species:'Jacaranda',plaza:'Plaza Roja'};group.position.set(X(px),0,Z(py));vegetation.add(group);registerEditable('jacaranda_'+index,'Jacaranda · Plaza Roja '+(index+1),'tree',group);
 function branch(a,b,r){const delta=new THREE.Vector3(...b).sub(new THREE.Vector3(...a)),o=new THREE.Mesh(cylinder,material('#675446'));o.name='Rama de jacaranda';o.position.set(...a).add(new THREE.Vector3(...b)).multiplyScalar(.5);o.scale.set(r,delta.length(),r);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());o.castShadow=true;group.add(o);}
 branch([0,0,0],[.3,5.5,0],.5);
 for(let n=0;n<6;n++){const angle=n*Math.PI/3+index*.7,x=Math.cos(angle)*3.4,z=Math.sin(angle)*3.4,y=8+(n%3)*.55;branch([.3,4.5,0],[x,y,z],.2);branch([x,y,z],[x*1.3,y+1,z*1.3],.09);
  const foliage=new THREE.Mesh(crown,material(['#a793c9','#b4a0d3','#8774b4','#719866'][n%4]));foliage.name='Copa en flor';foliage.scale.set(3.2,1.6,3);foliage.position.set(x,y+.8,z);foliage.castShadow=true;group.add(foliage);
 }
}
function tree(px,py,size=1,palm=false,elevation=0){
 const id='tree_'+px+'_'+py,edit=data.elementEdits?.[id];
 const xCroquis=px+(edit?.offsetX||0)/S(),zCroquis=py+(edit?.offsetZ||0)/S();
 if(!edit&&(bloqueaArboladoEnAccesos(detallesAccesos?.userData.reservasArbolado||[],X(xCroquis),Z(zCroquis))
   ||bloqueaArboladoEnAccesos(reservasArboladoCultural,X(xCroquis),Z(zCroquis))))return;
 const canopy=(palm?4.7:2.9*size)/S();
 // Los árboles decorativos de borde no deben quedar dentro de las canchas ni sobre sus porterías.
 if(Object.values(superficiesDeportivas).some(([x0,z0,x1,z1])=>Math.hypot(Math.max(0,x0-xCroquis,xCroquis-x1),Math.max(0,z0-zCroquis,zCroquis-z1))<canopy))return;
 const group=new THREE.Group();group.name=palm?'Palmera_editable':'Árbol_editable';group.position.set(X(px),0,Z(py));vegetation.add(group);
 registerEditable(id,(palm?'Palmera':'Árbol')+' · '+Math.round(X(px))+', '+Math.round(Z(py))+' m','tree',group);
 const x=0,z=0,trunk=new THREE.Mesh(cylinder,material('#75654c'));trunk.name=palm?'Palmera_tronco':'Árbol_tronco';trunk.scale.set(palm?.3:.4,palm?12:4,.4);trunk.position.set(x,(palm?6:2)+elevation,z);trunk.castShadow=true;group.add(trunk);
 if(palm){for(let a=0;a<8;a++){const leaf=new THREE.Mesh(crown,material('#567d3d'));leaf.scale.set(3.5,.4,.8);leaf.rotation.y=a*Math.PI/4;leaf.position.set(x+1.2*Math.cos(a*Math.PI/4),12+elevation,z+1.2*Math.sin(a*Math.PI/4));group.add(leaf);}}
 else {const c=new THREE.Mesh(crown,material(['#47774e','#5b8557','#689460'][Math.floor(px+py)%3]));c.scale.set(2.9*size,3.3*size,2.9*size);c.position.set(x,5*size+elevation,z);c.castShadow=true;group.add(c);}
}
function inside(px,py,poly){let v=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){let a=poly[i],b=poly[j];if((a[1]>py)!=(b[1]>py)&&px<(b[0]-a[0])*(py-a[1])/(b[1]-a[1])+a[0])v=!v;}return v;}
function excluded(x,y){const t=data.buildings.find(b=>b.id==='T'),r=t?.rects[0];if(r&&x>r[0]-5+(t.offsetX||0)/S()&&x<r[0]+70+(t.offsetX||0)/S()&&y>r[1]-36+(t.offsetZ||0)/S()&&y<r[1]+(t.offsetZ||0)/S())return true;if(inside(x,y,contornoPlazaEgresados))return true;const rects=[...data.buildings.flatMap(b=>b.rects),...data.plazas.map(p=>p.rect),...data.parking,...data.paths,[1453,360,1650,686],[1440,260,1510,375]];return rects.some(r=>x>r[0]-10&&x<r[2]+10&&y>r[1]-10&&y<r[3]+10);}
let mexicanFlagMaterial;
function flagMaterial(){
 if(mexicanFlagMaterial)return mexicanFlagMaterial;
 const canvas=document.createElement('canvas');canvas.width=420;canvas.height=240;const ctx=canvas.getContext('2d');
 ctx.fillStyle='#006847';ctx.fillRect(0,0,140,240);ctx.fillStyle='#fffdf0';ctx.fillRect(140,0,140,240);ctx.fillStyle='#ce1126';ctx.fillRect(280,0,140,240);
 // Emblema esquemático, para lectura a escala de campus; no es una reproducción oficial.
 ctx.strokeStyle='#487447';ctx.lineWidth=6;ctx.beginPath();ctx.arc(210,125,39,.18,Math.PI-.18);ctx.stroke();
 ctx.fillStyle='#795438';ctx.beginPath();ctx.ellipse(210,119,17,26,-.4,0,Math.PI*2);ctx.fill();
 ctx.beginPath();ctx.moveTo(214,118);ctx.lineTo(242,92);ctx.lineTo(235,123);ctx.lineTo(217,137);ctx.closePath();ctx.fill();
 ctx.beginPath();ctx.arc(202,94,9,0,Math.PI*2);ctx.fill();ctx.fillStyle='#c6a44a';ctx.beginPath();ctx.moveTo(194,92);ctx.lineTo(185,99);ctx.lineTo(200,99);ctx.fill();
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 mexicanFlagMaterial=new THREE.MeshStandardMaterial({map:texture,side:THREE.DoubleSide,roughness:1});return mexicanFlagMaterial;
}
function coseiPlaza(spec){
 if(spec.soyUam){
  const g=new THREE.Group();g.name='Letras_SOY_UAM_COSEI';g.position.set(X(spec.soyUam[0]),spec.baseElevation+spec.rise,Z(spec.soyUam[1]));world.add(g);registerEditable('letters_SOY_UAM_COSEI','SOY UAM · COSEI','sculpture',g);
  box(g,'Base_roja_letras',0,.15,0,10,.3,.8,'#b92736');
  // Letras volumétricas de trazos simples; legibles también por detrás como en la foto.
  const strokes={S:[[[1,1],[.2,1],[0,.8],[.2,.55],[.8,.45],[1,.2],[.8,0],[0,0]]],O:[[[.2,0],[0,.2],[0,.8],[.2,1],[.8,1],[1,.8],[1,.2],[.8,0],[.2,0]]],Y:[[[0,1],[.5,.5],[1,1]],[[.5,.5],[.5,0]]],U:[[[0,1],[0,.2],[.2,0],[.8,0],[1,.2],[1,1]]],A:[[[0,0],[.4,1],[.6,1],[1,0]],[[.2,.4],[.8,.4]]],M:[[[0,0],[0,1],[.5,.45],[1,1],[1,0]]]};
  [...'SOY UAM'].forEach((ch,i)=>{for(const path of strokes[ch]||[])for(let k=1;k<path.length;k++){const a=new THREE.Vector3(i*1.35-4.5+path[k-1][0],.4+path[k-1][1]*2,0),b=new THREE.Vector3(i*1.35-4.5+path[k][0],.4+path[k][1]*2,0),delta=b.clone().sub(a);const m=box(g,'Letra_'+ch,0,0,0,.23,delta.length()+.12,.32,'#f3f1e8');m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());}});
 }
 if(spec.caracol){
  const g=new THREE.Group();g.name='Caracol_COSEI';g.position.set(X(spec.caracol[0]),spec.baseElevation,Z(spec.caracol[1]));world.add(g);registerEditable('caracol_COSEI','Caracol · bancas COSEI','sculpture',g);
  const floor=new THREE.Mesh(new THREE.CylinderGeometry(8,8,.12,64),material('#969b94'));floor.position.y=.06;g.add(floor);
  for(const [r,start,end] of [[7.5,.2,4.8],[4.6,2.3,6.4],[2.1,-.3,2.5]]){const s=new THREE.Shape();s.absarc(0,0,r,start,end,false);s.absarc(0,0,r-.55,end,start,true);s.closePath();const m=new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:.75,bevelEnabled:false,curveSegments:40}),material('#a6a89e'));m.name='Banca_curva_caracol';m.rotation.x=-Math.PI/2;m.position.y=.85;m.castShadow=true;g.add(m);}
  const garden=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.6,.15,32),material('#638153'));garden.position.y=.15;g.add(garden);
 }
 const g=new THREE.Group();g.name='Plaza_COSEI_detalle';g.userData={library:'I',rise:spec.rise,steps:spec.steps,approximate:true};world.add(g);
 const r=spec.terrace,base=spec.baseElevation,top=base+spec.rise;
 slab(g,r,'#b87861',base+spec.rise/2,spec.rise,'Plataforma_elevada_COSEI');
 for(let x=r[0]+4;x<r[2];x+=35)slab(g,[x,r[1],x+1,r[3]],'#d7bc9c',top+.02,.025,'Junta_plataforma');
 for(let y=r[1]+9;y<r[3];y+=35)slab(g,[r[0],y,r[2],y+1],'#d7bc9c',top+.02,.025,'Junta_plataforma');
 // Junta lineal oscura dentro de la franja de concreto vista frente a Biblioteca I.
 const juntaX=r[0]+74.5;
 slab(g,[juntaX-.12,r[1]+.2,juntaX+.12,r[3]-.4],'#555950',top+.034,.006,'Canal_lineal_explanada_COSEI');
 const treadPx=spec.tread/S();
 for(let i=0;i<spec.steps;i++){const rise=spec.rise*(i+1)/spec.steps,y0=r[1]-(spec.steps-i)*treadPx;
  slab(g,[spec.stairWidth[0],y0,spec.stairWidth[1],y0+treadPx+.025],'#c0b9a6',base+rise/2,rise,'Escalón_COSEI_'+(i+1));
 }
 const wallRects=[[r[0],r[1],spec.stairWidth[0],r[1]+1],[spec.stairWidth[1],r[1],r[2],r[1]+1],[r[0],r[1],r[0]+1,r[3]]];
 for(const [i,wall] of wallRects.entries())slab(g,wall,'#a7aaa1',base+(spec.rise+.1)/2,spec.rise+.1,'Murete_desnivel_'+i);
 for(const [i,p] of spec.planters.entries()){
  const height=.5;slab(g,p,'#969d90',base+height/2,height,'Jardinera_COSEI_'+i);
  slab(g,[p[0]+2,p[1]+2,p[2]-2,p[3]-2],'#627c4e',base+height+.015,.05,'Área_verde_jardinera');
  for(const edge of [[p[0],p[1],p[2],p[1]+1.7],[p[0],p[3]-1.7,p[2],p[3]]])slab(g,edge,'#d7d0ba',base+height+.06,.12,'Banca_murete_COSEI');
  tree((p[0]+p[2])/2,(p[1]+p[3])/2,.6,false,base+height);
 }
 for(const p of spec.palms)tree(p[0],p[1],1,true,base);
 const flag=spec.flag,x=X(flag.position[0]),z=Z(flag.position[1]),poleBase=top+.24;
 const flagGroup=new THREE.Group();flagGroup.name='Asta_bandera_COSEI';flagGroup.userData={height:flag.height,library:'I',flag:'México, emblema esquemático',approximate:true};flagGroup.position.set(x,poleBase,z);g.add(flagGroup);registerEditable('flag_COSEI','Bandera · Plaza COSEI','flag',flagGroup);
 box(flagGroup,'Pedestal_asta',0,-.12,0,1.5,.24,1.5,'#d3d2bf');
 const pole=new THREE.Mesh(new THREE.CylinderGeometry(.07,.13,flag.height,16),material('#c8cfd0'));pole.name='Mástil';pole.position.y=flag.height/2;pole.castShadow=true;flagGroup.add(pole);
 const finial=new THREE.Mesh(crown,material('#c7c0a7'));finial.name='Remate_asta';finial.scale.setScalar(.16);finial.position.y=flag.height;flagGroup.add(finial);
 const geometry=new THREE.PlaneGeometry(flag.width,flag.width*4/7,24,12);geometry.translate(flag.width/2,-flag.width*2/7,0);
 const positions=geometry.attributes.position;for(let i=0;i<positions.count;i++){const xx=positions.getX(i),yy=positions.getY(i);positions.setZ(i,.3*Math.sin(xx*1.9+yy*.5)*xx/flag.width);}
 geometry.computeVertexNormals();const cloth=new THREE.Mesh(geometry,flagMaterial());cloth.name='Bandera_México';cloth.position.y=flag.height-.25;cloth.castShadow=true;flagGroup.add(cloth);
 // Frente acristalado de la biblioteca, muro macizo oriente con rótulo "i", pórtico retranqueado y desnivel de plataforma (imagen_0018, 0020, 0034, 0141, 0154, 0157).
 const lib=data.buildings.find(b=>b.id==='I'),front=lib.rects[0],fullWidth=(front[2]-front[0])*S(),glassWidth=fullWidth*.76,frontCenterX=X((front[0]+front[2])/2)+(lib.offsetX||0),glassX=frontCenterX-fullWidth*.11;
 const porticoY=libraryPorticoHeight(lib.height??lib.floors*data.storeyHeight),recess=Math.min(libraryPorticoRecess,(front[3]-front[1])*S()*.35);
 const frontZ=Z(front[1])+(lib.offsetZ||0),glassZ=frontZ+recess-.12;
 const glassHeight=Math.max(.4,porticoY-top),doorHeight=Math.min(2.3,glassHeight);
 box(g,'Acceso_acristalado_Biblioteca_I',glassX,top+glassHeight/2,glassZ,glassWidth,glassHeight,.16,'#344d55');
 for(let dx=-glassWidth/2;dx<=glassWidth/2;dx+=2.5)box(g,'Montante_biblioteca',glassX+dx,top+glassHeight/2,glassZ-.12,.09,glassHeight,.10,'#dce0d9');
 for(const t of [.21,.49,.77])box(g,'Travesaño_biblioteca',glassX,top+glassHeight*t,glassZ-.12,glassWidth,.085,.10,'#dce0d9');
 box(g,'I_suelo_bajo_portico',frontCenterX,top-.09,frontZ+recess/2,fullWidth,.18,recess,'#c9c4b6');
 const doorX=frontCenterX+fullWidth*.20;
 box(g,'I_portico_retranqueado_acceso',doorX,top+doorHeight/2,glassZ-.21,2.95,doorHeight,.09,'#263a40');
 for(const dx of [-1.48,0,1.48])box(g,'I_perfil_de_puerta',doorX+dx,top+doorHeight/2,glassZ-.28,.07,doorHeight,.075,'#dce0d9');
 box(g,'I_cabezal_de_puerta',doorX,top+doorHeight-.01,glassZ-.28,3.03,.075,.075,'#dce0d9');
 for(const dx of [-.36,.36])box(g,'I_tirador_de_puerta',doorX+dx,top+doorHeight*.435,glassZ-.32,.045,.34,.065,'#c0c7c5');
 for(let x=frontCenterX-fullWidth*.43;x<frontCenterX+fullWidth*.25;x+=3.6)box(g,'I_luz_empotrada_en_voladizo',x,porticoY-.018,frontZ+recess*.35,.12,.035,.12,'#ded3b7');
 const eastWallX=frontCenterX+fullWidth*.38,eastWallW=fullWidth*.24;
 box(g,'I_muro_macizo_oriente',eastWallX,top+(glassHeight+.07)/2,frontZ+recess/2,eastWallW,glassHeight+.07,recess,'#b8b9b0');
 const fasciaHeight=Math.min(1.36,porticoY*.26);
 box(g,'I_dintel_concreto_fachada',frontCenterX,porticoY+fasciaHeight/2,frontZ+.13,fullWidth+.4,fasciaHeight,.48,'#bcbdb4');
 box(g,'I_emblema_UAM_relieve',eastWallX-eastWallW/2-.045,top+glassHeight*.53,frontZ+recess*.54,.08,Math.min(1.25,glassHeight*.45),recess*.68,'#5a5d57');
 box(g,'I_franja_mural_aproximada',eastWallX,top+glassHeight*.22,frontZ-.06,eastWallW*.88,glassHeight*.35,.10,'#e7ebe8');
 box(g,'I_banca_frontal',eastWallX,top+.34,frontZ-.36,eastWallW*.88,.46,.72,'#9fa29a');
 box(g,'I_rotulo_rojo_biblioteca',eastWallX-eastWallW*.08,top+glassHeight*.75,frontZ-.10,.44,glassHeight*.28,.20,'#c42525');
 box(g,'I_rotulo_rojo_biblioteca_punto',eastWallX-eastWallW*.08,top+glassHeight*.947,frontZ-.10,.44,glassHeight*.08,.20,'#c42525');
 // Rampa accesible poniente con muretes laterales y escalinata oriente de la plataforma COSEI (imagen_0018, 0141, 0154, 0157).
 const rampX=X(spec.stairWidth[0]-9),rampZ=Z(r[1]-3.6);
 const ramp=box(g,'Rampa_visual_plataforma_COSEI',rampX,(base+top)/2,rampZ,2.8,spec.rise*.95,4.2,'#cbc7b9');ramp.rotation.x=-.16;
 for(const s of [-1,1])box(g,'Murete_rampa_COSEI',rampX+s*1.48,base+spec.rise*.55,rampZ,.18,spec.rise+.22,4.2,'#a7aaa1');
 for(let s=1;s<=3;s++)box(g,'Escalinata_esquina_oriente_COSEI',X(888),base+spec.rise*s/6,Z(r[1]-2.4+s*.75),5.2,spec.rise*s/3,.85,'#cbc7ba');
}
function generate(){
 if(world){scene.remove(world);world.traverse(o=>{if(o.geometry&&!([cube,cylinder,crown].includes(o.geometry)))o.geometry.dispose();if(o.userData.disposeMaterial||o.userData.disposeCopyrightMaterial){o.material.map?.dispose();o.material.dispose();}});}
 clearEditSelection();labelLayer.replaceChildren();labels=[];buildingGroups.clear();editables.clear();world=new THREE.Group();world.name='UAM_Azcapotzalco';world.userData={units:'meters',approximate:true,reference:'v7 approved',scaleEstimate:740};scene.add(world);
 detallesAccesos=crearDetallesMapsAccesos(THREE,data,routeEditor?.getNet()||BASE_ROUTES);
 const corredorCultural=crearDetallesMapsCorredorCultural(THREE,data,routeEditor?.getNet()||BASE_ROUTES);
 reservasArboladoCultural=corredorCultural.userData.reservasArbolado;
 vegetation=new THREE.Group();vegetation.name='Vegetación';world.add(vegetation);
 box(world,'Base maqueta',0,-2,10,760,4,310,'#b8beaf');meshPoly(world,data.site,.1,'#82a276','Predio');
 slab(world,[30,706,1770,736],'#88918d',-.03,.2,'Eje_5_Norte_Montevideo');slab(world,[22,70,48,705],'#88918d',-.03,.2,'Av_San_Pablo');
 for(const r of data.paths)slab(world,r,'#d5cbb1');
 for(const p of data.plazas){
  const r=p.rect;
  if(p.name==='Plaza Roja'){
   construirPlazaRoja({THREE,world,rect:r,box,material,X,Z,S,data,net:routeEditor?.getNet()||BASE_ROUTES});
   // Luminarias y botes dobles en Plaza Roja (imagen_0025, 0040).
   for(const [lx,ly] of [[505,432],[585,432],[505,545],[585,545]]){
    box(world,'Luminaria_Plaza_Roja',X(lx),1.8,Z(ly),.11,3.2,.11,'#b8292f');
    box(world,'Bote_doble_Plaza_Roja',X(lx)+1.2,.48,Z(ly),.45,.72,.38,'#b8292f');
    box(world,'Bote_doble_Plaza_Roja',X(lx)+1.7,.48,Z(ly),.45,.72,.38,'#eceee9');
   }
  }else if(p.name!=='Patio H'){
   slab(world,r,'#b87861',.23);
   for(let x=r[0];x<r[2];x+=35)slab(world,[x,r[1],x+1.2,r[3]],'#d7bc9c',.38,.025,'Junta de plaza');
   for(let y=r[1];y<r[3];y+=35)slab(world,[r[0],y,r[2],y+1.2],'#d7bc9c',.39,.025,'Junta de plaza');
  }
  if(p.name!=='Patio H')label(p.name,X((r[0]+r[2])/2),1,Z((r[1]+r[3])/2),'place');
 }
 // Plazuela circular con bancas curvas de concreto entre H, I y Cafetería J (imagen_0004, 0150, 0155).
 const pj=new THREE.Group();pj.name='Plazuela_bancas_curvas_J';pj.position.set(X(894),.18,Z(462));world.add(pj);
 const pjFloor=new THREE.Mesh(new THREE.CylinderGeometry(5.6,5.6,.12,36),material('#b4b6ae'));pjFloor.position.y=.06;pj.add(pjFloor);
 const pjGarden=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.5,.18,24),material('#567449'));pjGarden.position.y=.12;pj.add(pjGarden);
 for(const [start,end] of [[.25,2.6],[3.4,5.8]]){
  const s=new THREE.Shape();s.absarc(0,0,4.8,start,end,false);s.absarc(0,0,4.2,end,start,true);s.closePath();
  const bench=new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:.52,bevelEnabled:false,curveSegments:28}),material('#c4c5bd'));
  bench.name='Banca_curva_plazuela_J';bench.rotation.x=-Math.PI/2;bench.position.y=.58;pj.add(bench);
 }
 // Campo natural, canchas y gradas, contrastados con Maps y las fotos de la UAM.
 construirCanchasDeportivas({THREE,world,box,slab,meshPoly,line,X,Z,S});
 construirAndadorMulticanchas({THREE,world,meshPoly,line,X,Z});
 construirGradasDeportivas({THREE,world,box,X,Z});
 detallarAccesoDeportivo({THREE,world,slab});
 for(const [key,title] of [['campo','Campo de fútbol'],['basquet','Multicanchas'],['futbol7','Fútbol 7']]){
  const [x0,z0,x1,z1]=superficiesDeportivas[key];label(title,X((x0+x1)/2),1,Z((z0+z1)/2),'place');
 }
 // La torre contigua a Q queda al borde del campo, por delante de la fachada (0075/0096).
 for(const [tx,ty] of [[1596,445],[1573.4,575],[1450,445],[1450,575]]){
  box(world,'Torre_iluminacion_canchas',X(tx),5.5,Z(ty),.22,11,.22,'#7c6c5a');
  box(world,'Reflectores_torre_canchas',X(tx),11.1,Z(ty),.45,.38,1.2,'#e8eae6');
 }
 // Caseta de bombeo con reja roja junto al acceso de canchas y jardín de cactáceas en perímetro oriente (imagen_0055, 0076).
 box(world,'Caseta_bombeo_canchas',X(1432),1.25,Z(668),3.4,2.3,2.8,'#8c908e');
 box(world,'Reja_roja_caseta_bombeo',X(1432),1.2,Z(668)+1.42,2.8,2.1,.08,'#a82828');
 for(let i=0;i<14;i++){
  const cx=X(1612+i*4),cz=Z(345+i*14);
  const cac=new THREE.Mesh(cylinder,material('#4c7544'));cac.name='Jardin_cactaceas_oriente';cac.position.set(cx,.9+(i%3)*.3,cz);cac.scale.set(.18,1.6+(i%3)*.6,.18);world.add(cac);
 }
 // Mesas de concreto hexagonales con 6 bancas en jardines frente a E y F (imagen_0017, 0028).
 for(const [mx,my] of [[428,392],[448,392],[438,412],[492,392],[512,392]]){
  const tHex=new THREE.Mesh(new THREE.CylinderGeometry(.85,.85,.72,6),material('#c8c6ba'));
  tHex.name='Mesa_hexagonal_jardines';tHex.position.set(X(mx),.42,Z(my));world.add(tHex);
  for(let a=0;a<6;a++){
   const seat=box(world,'Banca_mesa_hexagonal',X(mx)+Math.cos(a*Math.PI/3)*1.25,.28,Z(my)+Math.sin(a*Math.PI/3)*1.25,.42,.42,.42,'#b8b6aa');
   seat.rotation.y=-a*Math.PI/3;
  }
 }
 for(const b of data.buildings)building(b);
 reconstruirCubiertasTalleres({THREE,data,buildingGroups,box,material,X,Z});
 agregarDetallesCorpus({THREE,data,buildingGroups,box});
 mejorarArquitecturaCorpus({THREE,data,buildingGroups,box,material,cube,cylinder,net:routeEditor?.getNet()||BASE_ROUTES});
 liberarAccesosModelados({THREE,world,net:routeEditor?.getNet()||BASE_ROUTES,data,openingWidth:2.4,openingHeight:2.35});
 if(data.sculpture)sculptureG(data.sculpture);
 if(data.serpentina)serpentinaH(data.serpentina);
 if(data.habitacionesLuz)habitacionesLuz(data.habitacionesLuz);
 if(data.universitas)universitas(data.universitas);
 if(data.casaAbierta)casaAbiertaAlTiempo(data.casaAbierta);
 if(data.vidrioCosei)esculturaVidrioCosei(data.vidrioCosei);
 for(const spec of data.bridges||[])bridge(spec);
 for(const spec of data.integratedLinks||[])integratedLink(spec);
 for(const spec of data.corridors||[])corridor(spec);
 if(data.cosei)coseiPlaza(data.cosei);
 construirPaisajeAcademico({THREE,world,box,slab,meshPoly,material,tree,X,Z,S});
 construirGimnasioExteriorM({THREE,world,meshPoly,box,material,X,Z});
 construirPaisajeHHP({THREE,world,meshPoly,slab,tree,X,Z,S});
 const egresados=crearPlazaEgresados({THREE,world,material,X,Z});
 label('Plaza de Egresados',egresados.position.x,3,egresados.position.z,'place');
 const ajedrez=crearPlazasAjedrez({THREE,world,material,box,X,Z});
 for(const patio of ajedrez.children)label(patio.userData.title,patio.position.x,4.8,patio.position.z,'place');
 const tresGracias=construirJardinTresGracias({THREE,world,material,X,Z});
 registerEditable('sculpture_tres_gracias_HP','Las tres Gracias · HP','sculpture',tresGracias);
 if(tresGracias.parent)label('Las tres Gracias',tresGracias.position.x,4.8,tresGracias.position.z,'place');
 agregarEntornoCorpus({THREE,data,world,box,material,X,Z,S,net:routeEditor?.getNet()||BASE_ROUTES});
 const detallesPonente=crearDetallesMapsPonente(THREE,data,perimetroCruzaFutbol7);
 world.add(detallesAccesos,crearDetallesMapsPlazas(THREE,data),detallesPonente,corredorCultural);
 // El trazado se calcula después de las geometrías reales y de sus transformaciones editadas.
 parkingObstaclesCache=null;
 for(const [i,r] of data.parking.entries())parkingArea(r,'parking_'+i,'Estacionamiento '+(i+1));
 for(const [i,p] of (data.extraParking||[]).entries())parkingArea(p.rect,p.id,'Estacionamiento nuevo '+(i+1));
 vialidadEstacionamientos();
 // Perímetro cerrado, excepto en los seis accesos definidos; T permanece sin salida.
 const poly=[...data.site,data.site[0]];
 for(let lado=0;lado<poly.length-1;lado++){
  const [a,b]=[poly[lado],poly[lado+1]],dx=b[0]-a[0],dz=b[1]-a[1];
  const len=Math.hypot(dx,dz),yaw=-Math.atan2(dz,dx);
  for(let t=0;t<len;t+=8){
   const u=(t+4)/len,px=a[0]+dx*u,py=a[1]+dz*u;
   if(perimetroCruzaFutbol7(px,py)||data.gates.some(g=>Math.hypot(g.x-px,g.y-py)<21))continue;
   if(cubrePerimetroMapsPonente(detallesPonente,lado,t)||(px===60&&py>tramoRejaCICTE[0]&&py<tramoRejaCICTE[1]))continue;
   const tramoObservado=lado===2&&((px>=943&&px<985)||(px>=1052&&px<1095));
   if(tramoObservado)construirBardaFrenteT({THREE,world,box,x:X(px),z:Z(py),width:8*S(),yaw,postes:Math.floor(t/16)%2===0});
   else box(world,'Perímetro',X(px),.9,Z(py),8*S(),1.7,.45,'#71816d').rotation.y=yaw;
  }
 }
 for(const gate of data.gates){
  const vehicular=gate.type==='vehicle';
  if(gate.id==='V1')construirPorticoV1({THREE,world,gate,box,slab,material,X,Z,S});
  else if(!['P1','P2'].includes(gate.id))box(world,'Acceso_'+gate.id,X(gate.x),.5,Z(gate.y),vehicular?7:3,.6,5,vehicular?'#bc3535':'#1d72b6');
  const puertas={V1:'Puerta 2',P1:'Puerta 4',P2:'Puerta 5'};
  label(puertas[gate.id]||(vehicular?'Auto':'Peatón'),X(gate.x),5,Z(gate.y),gate.type);
 }
 let seed=1729;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let n=0;n<520;n++){const x=75+rand()*1600,y=95+rand()*590;if(inside(x,y,data.site)&&!excluded(x,y))tree(x,y,.7+rand()*.6);}
 for(let x=90;x<1560;x+=39){let y=80+(x-60)*144/1515+11;if(!excluded(x,y))tree(x,y,.9);}
 for(let x=80;x<1650;x+=34)if(!data.gates.some(g=>Math.hypot(g.x-x,g.y-689)<25))tree(x,688,.8);
 tree(803,354,1,true);tree(845,354,1,true);tree(1312,248,1,true);tree(1335,248,1,true);for(const p of [[805,331],[847,331]])tree(p[0],p[1],.6);
 for(const [i,p] of (data.jacarandas||[]).entries())jacaranda(p[0],p[1],i);
 for(const px of [715,877])for(let py=436;py<565;py+=48){if(data.cosei&&px>760&&py>=480)continue;if(!data.sculpture||Math.hypot(px-data.sculpture.position[0],py-data.sculpture.position[1])>18)tree(px,py,.6);}
 label('Eje 5 Norte · Montevideo',X(870),2,Z(743),'place');label('Av. San Pablo',X(-8),2,Z(400),'place');
 vegetation.visible=$('trees').checked;syncLabels();
 addCopyrightToModel();world.updateMatrixWorld(true);selectBuilding(selected);refreshEditor();routeEditor?.refresh();
}
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down;
renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);
renderer.domElement.addEventListener('pointerup',e=>{if(editMode||activeInterior)return;if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>4)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects([...buildingGroups.values()],true);if(hits.length){let o=hits[0].object;while(o.parent&&o.userData.id===undefined)o=o.parent;selectBuilding(o.userData.id);}});
let highlight;
function selectBuilding(id){selected=id||'';$('building').value=selected;if(highlight){scene.remove(highlight);highlight.geometry.dispose();highlight.material.dispose();highlight=null;}
 const b=data.buildings.find(b=>b.id===selected);$('editor').hidden=!b;
 if(!b){$('info').textContent='Haz clic en un edificio o selecciónalo en la lista.';return;}
 $('info').textContent=(b.name||'Edificio '+b.id)+' · '+b.floors+' nivel(es)'+(['H','HO','HP'].includes(b.id)?' · Conexión integrada en PB, 1 y 2':'')+(b.pavilion?' · Cubierta translúcida superior':'')+(b.id==='T'?' · Sin salida hacia Eje 5 Norte':'')+(b.construction?' · Volumen esquemático del croquis':'');
 for(const key of ['floors','offsetX','offsetZ'])$(key).value=b[key]||0;
 highlight=new THREE.BoxHelper(buildingGroups.get(b.id),'#ffb02e');scene.add(highlight);
}
for(const b of data.buildings){const option=document.createElement('option');option.value=b.id;option.textContent=b.name||'Edificio '+b.id;$('building').append(option);}
$('building').onchange=e=>selectBuilding(e.target.value);
$('apply').onclick=()=>{const b=data.buildings.find(b=>b.id===selected);if(!b)return;const n=Number($('floors').value),ox=Number($('offsetX').value),oz=Number($('offsetZ').value);if(!Number.isInteger(n)||n<1||n>8||![ox,oz].every(Number.isFinite)){message('Introduce niveles entre 1 y 8 y desplazamientos válidos.');return;}rememberEdit();b.floors=n;delete b.height;b.offsetX=ox;b.offsetZ=oz;generate();updateSaveState();message('Edificio actualizado. Guarda datos y GLB para conservar el cambio.');};
function resize(){const w=mount.clientWidth,h=mount.clientHeight;renderer.setSize(w,h);perspective.aspect=w/h;perspective.updateProjectionMatrix();if(activeInterior){interiorCamera.aspect=w/h;interiorCamera.updateProjectionMatrix();fitInterior();return;}const span=480;ortho.left=-span;ortho.right=span;ortho.top=span*h/w;ortho.bottom=-span*h/w;ortho.updateProjectionMatrix();const corpusCamera=[['p4patio','P4_patio_cubierto_estudio'],['p4acero','P4_conexiones_acero_corpus'],['p2invernadero','P2_invernadero_lateral']].find(([id])=>$(id)?.classList.contains('active'));if(!topMode&&focusMode&&corpusCamera){const node=world.getObjectByName(corpusCamera[1]);if(node){world.updateMatrixWorld(true);const size=new THREE.Box3().setFromObject(node).getSize(new THREE.Vector3()),angle=Math.atan(Math.tan(THREE.MathUtils.degToRad(perspective.fov/2))*Math.min(1,perspective.aspect)),distance=corpusCamera[0]!=='p4acero'?12:Math.max(12,size.length()*.58/Math.sin(angle));perspective.position.sub(controls.target).normalize().multiplyScalar(distance).add(controls.target);controls.update();}}else if(!topMode&&focusMode&&$('serpentina').classList.contains('active')){const distance=Math.max(34,7/(Math.tan(THREE.MathUtils.degToRad(perspective.fov/2))*perspective.aspect));perspective.position.sub(controls.target).normalize().multiplyScalar(distance).add(controls.target);controls.update();}else if(!topMode&&focusMode&&$('tdetail').classList.contains('active')){const distance=Math.max(48,20/(Math.tan(THREE.MathUtils.degToRad(perspective.fov/2))*perspective.aspect));perspective.position.sub(controls.target).normalize().multiplyScalar(distance).add(controls.target);controls.update();}else if(!topMode&&!focusMode){const distance=Math.max(850,420/(Math.tan(THREE.MathUtils.degToRad(perspective.fov/2))*perspective.aspect));perspective.position.sub(controls.target).normalize().multiplyScalar(distance).add(controls.target);controls.update();}}
window.addEventListener('resize',resize);
$('expand').onclick=()=>{const panel=document.querySelector('aside');panel.hidden=!panel.hidden;mount.style.left=panel.hidden?'0px':'';$('expand').textContent=panel.hidden?'Mostrar controles':'Ampliar vista';resize();};
// Misma transformación de norte que Campus.kt; no escala la geometría ni aplica dos veces la calibración.
function campusNorth(geo){
 if(!geo)return null;
 const ul=geo.superiorIzquierda,ur=geo.superiorDerecha,ll=geo.inferiorIzquierda;
 if(![ul,ur,ll].every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite))||!(geo.ancho>0&&geo.alto>0))return null;
 const cosLat=Math.cos(ul[0]*Math.PI/180),ax=(ur[1]-ul[1])*cosLat/geo.ancho,ay=(ur[0]-ul[0])/geo.ancho,bx=(ll[1]-ul[1])*cosLat/geo.alto,by=(ll[0]-ul[0])/geo.alto,det=ax*by-ay*bx;
 if(Math.abs(det)<1e-18)return null;
 const x=-bx/det,z=ax/det,length=Math.hypot(x,z);return {x:x/length,z:z/length};
}
const sculptureViews={habitaciones:'sculpture_habitaciones_luz',universitas:'sculpture_universitas',casaAbierta:'sculpture_casa_abierta',vidrioCosei:'sculpture_vidrio_COSEI',pergola:'sculpture_G',tresGracias:'sculpture_tres_gracias_HP'};
const artworkViews={uroboros:'T_escultura_acero_patio',primeraLetra:'W_escultura_negra_acceso'};
const sectorViews={
 accesoSanPablo:{target:[66,2.6,220],offset:[-24,8,8]},
 jardinBD:{target:[351,.7,362],offset:[-28,69,25]},
 llegadaD:{target:[407,1,275],offset:[34,24,-38]},
 patioH:{target:[824,.5,345],offset:[9,53,19]},
 bardaEje5:{target:[971,1.15,693],offset:[-17,13,23]},
 galeriaF:{target:[616,3.7,568],offset:[12,2.65,0]},
 hGalerias:{target:[802,3.8,405],offset:[20,20,79]},
 hJardines:{target:[923,1.1,267],offset:[14,76,-121]},
 hoEgresados:{target:[725,.4,298.5],offset:[7,9,-12]},
 explanadaCosei:{target:[805,.8,548],offset:[-27.47,8.2,-17.28]},
 galeriaS:{target:[1219,1.32,536],offset:[22,1.25,-1.7]},
 ajedrezHO:{target:[733,1.25,356.25],offset:[5.7,.90,4.8]},
 ajedrezHOPlantaAlta:{target:[733,1.8,356.25],offset:[8.1,5.5,-1.65]},
 ajedrezHP:{target:[906,1.35,371],offset:[7.6,1.85,2.1]},
 hoVestibulo:{target:[728,1.65,348],offset:[5.9,2.2,8.2]},
 tVentanillas:{target:[985,1.22,621],offset:[-6,1.73,-5]},
 patioAcademico:{target:[943,.8,577],offset:[-14,25,35]},
 lCubierta:{target:[1057,8,523],offset:[-30,81,95]},
 talleres:{target:[1279,4,487],offset:[-36,71,88]},
 p2Portones:{target:[1280,2.05,489],offset:[-14,3.7,11.4]},
 p4Entrada:{target:[1339,1.63,459.3],offset:[-5.95,.84,7.8]},
 oLaboratorios:{target:[1245,2,434],offset:[2,2,-8.8]},
 mGimnasio:{target:[1235,.8,588],offset:[-10,10,-12]},
 jExterior:{target:[935,2.4,514],offset:[-37,13,-36]},
 jGaleria:{target:[959,1.9,509],offset:[8.2,5.5,-20]},
 mFachada:{target:[1324,2.25,628],offset:[12,4.2,-13]},
 qAzotea:{target:[1588,2.7,573],offset:[-19,15,-14]},
 kEstacionamiento:{target:[1032,5.8,380],offset:[-11,3.3,-26]},
 qExterior:{target:[1593,1.55,550],offset:[-56,12,-7]},
 rExterior:{target:[1370,5.1,280],offset:[-36,16,56]},
 andadorDeportivo:{target:[1510,1.2,456],offset:[-4,59,-38]},
 deportes:{target:[1565,1.65,555],offset:[-62,121,144]},
 gradas:{target:[1602,2.25,668.25],offset:[-17.6,8.5,-13.5]},
 futbol7:{target:[1629.25,1.7,662.5],offset:[-31,29,-25]},
};
const corpusViews={p4patio:'P4_patio_cubierto_estudio',p4acero:'P4_conexiones_acero_corpus',p2invernadero:'P2_invernadero_lateral'};
const cameraButtons=['approved','maps','top','plaza','pavilions','cosei','gdetail','parking','tdetail','wdetail','p2detail','serpentina',...Object.keys(sculptureViews),...Object.keys(artworkViews),...Object.keys(corpusViews)];
const interiores={
 incalli:{crear:crearInteriorIncalli,titulo:'C · Auditorio Incalli',nota:'Corte esquemático de la sala según la galería y las fotografías de la UAM.'},
 libreria:{crear:crearVistaLibreria,titulo:'C · Librería UAM',nota:'Vista del cancel, el corredor y el área de cajas y casilleros. El mobiliario se representa de forma esquemática.'},
 galeriaDelTiempo:{crear:crearVistaGaleriaDelTiempo,titulo:'C · Galería del Tiempo',nota:'Corte de reconocimiento de la sala en planta baja. Montaje y medidas esquemáticos.'},
 biblioteca:{crear:crearInteriorBiblioteca,titulo:'I · Sala de lectura',nota:'Corte esquemático de la sala de doble altura. Ubicaciones interiores aproximadas.'},
 cafeteria:{crear:crearInteriorCafeteria,titulo:'J · Comedor',nota:'Corte esquemático basado en la planta y las fotos de la remodelación de 2009 y en fotos comunitarias de 2017.'},
 redes:{crear:crearInteriorG302,titulo:'G302-A · Aula de Redes',nota:'Piso 3. Corte esquemático basado en el recorrido de Electrónica y las fotografías del aula.'},
 cyad:{crear:crearInteriorL,titulo:'L · Vestíbulo de CyAD',nota:'Corte esquemático según fotos comunitarias de 2024 y 2026.'},
 atrioW:{crear:crearInteriorW,titulo:'W · Atrio',nota:'Corte esquemático del atrio, las galerías y el muro de vidrio con su pila, basado en fotos y el recorrido de 360°.'},
 gimnasioR:{crear:crearInteriorR,titulo:'R · Gimnasio de duela',nota:'Corte esquemático de la cancha cubierta y las gradas laterales.'},
};
function syncLabels(){
 const names=$('names').checked;
 labelLayer.hidden=!names||Boolean(activeInterior);
 $('interiorLabels').hidden=!names||!activeInterior;
}
function setInteriorHud(open){
 $('interiorHud').hidden=!open;
 $('campusHud').hidden=open;
 syncLabels();
}
function closeInterior(){
 if(!activeInterior)return;
 interiorScene.remove(activeInterior.group);
 activeInterior=null;interiorLabels=[];
 $('interiorLabels').replaceChildren();
 $('interior').value='';setInteriorHud(false);
}
function fitInterior(){
 const aspect=interiorCamera.aspect;
 const base=new THREE.Vector3(...activeInterior.camera).sub(controls.target);
 const zoom=Math.max(1,1.24/Math.max(.18,aspect));
 interiorCamera.position.copy(controls.target).addScaledVector(base,zoom);
 interiorCamera.lookAt(controls.target);
 controls.update();
}
function openInterior(id){
 const enclosure=interiores[id];
 if(!enclosure){view('approved');return;}
 if(editMode)setEditing(false);
 $('editRoutes').checked=false;$('routeEditor').hidden=true;
 closeInterior();
 const model=enclosure.model??=enclosure.crear(THREE);
 activeInterior=model;interiorScene.add(model.group);
 $('interior').value=id;$('interiorTitle').textContent=enclosure.titulo;$('interiorNote').textContent=enclosure.nota;
 interiorLabels=model.etiquetas.map(({texto,posicion})=>{
  const el=document.createElement('div');el.className='label interior';el.textContent=texto;$('interiorLabels').append(el);
  return {el,p:new THREE.Vector3(...posicion)};
 });
 setInteriorHud(true);
 camera=interiorCamera;topMode=false;focusMode=true;
 controls.object=camera;controls.enableRotate=true;controls.autoRotate=false;
 controls.minDistance=3;controls.maxDistance=185;controls.maxPolarAngle=THREE.MathUtils.degToRad(86);
 controls.target.set(...model.target);
 $('sectorDetalle').value='';
 for(const button of [...cameraButtons,'spin'])$(button)?.classList.remove('active');
 resize();
}
function view(mode){closeInterior();const artwork=sculptureViews[mode]||artworkViews[mode],sector=sectorViews[mode];controls.maxDistance=1500;controls.minDistance=corpusViews[mode]||artwork||sector?6:30;topMode=mode==='top';controls.maxPolarAngle=topMode?Math.PI:THREE.MathUtils.degToRad(78);focusMode=Boolean(artwork||sector)||['plaza','pavilions','cosei','gdetail','parking','tdetail','wdetail','p2detail','serpentina',...Object.keys(corpusViews)].includes(mode);camera=topMode?ortho:perspective;controls.object=camera;controls.enableRotate=!topMode;controls.target.set(0,0,0);camera.zoom=1;camera.up.set(0,1,0);
 if(corpusViews[mode]){
  const node=world.getObjectByName(corpusViews[mode]);
  if(node){world.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(node),size=bounds.getSize(new THREE.Vector3());bounds.getCenter(controls.target);controls.target.y=mode==='p4patio'?1.35:Math.max(1.5,controls.target.y-1);const angle=Math.atan(Math.tan(THREE.MathUtils.degToRad(perspective.fov/2))*Math.min(1,perspective.aspect));const distance=mode!=='p4acero'?12:Math.max(12,size.length()*.58/Math.sin(angle));const direction=(mode==='p4patio'?new THREE.Vector3(-.08,.10,-1):mode==='p4acero'?new THREE.Vector3(-.65,.3,-1):new THREE.Vector3(-1,.35,.45)).normalize();camera.position.copy(controls.target).addScaledVector(direction,distance);}
  else{camera.position.set(0,580,630);message('Este detalle no está incluido en los datos cargados.');}
 }
 else if(mode==='serpentina'){const node=editables.get('sculpture_serpentina_H')?.node;controls.target.copy(node?.position||new THREE.Vector3(X(824),0,Z(265)));controls.target.y=3.4;camera.position.copy(controls.target).add(new THREE.Vector3(-8,6,-23));}
 else if(artwork){
  const node=sculptureViews[mode]?editables.get(artwork)?.node:world.getObjectByName(artwork);
  if(node&&mode==='habitaciones'){
   controls.target.copy(node.position);controls.target.y=1.7;
   camera.position.copy(controls.target).add(new THREE.Vector3(5,8,15).multiplyScalar(node.scale.x));
  }else if(node){
   world.updateMatrixWorld(true);
   const bounds=new THREE.Box3().setFromObject(node),size=bounds.getSize(new THREE.Vector3());bounds.getCenter(controls.target);
   const artworkDirections={universitas:[.32,.49,-1.44],tresGracias:[1.1,.70,-1.52]};
   const direction=new THREE.Vector3(...(artworkDirections[mode]||[1,.48,1.5]));
   camera.position.copy(controls.target).add(direction.normalize().multiplyScalar(Math.max(9,size.length()*1.98)));
  }else{camera.position.set(0,580,630);message('Esta escultura no está incluida en los datos cargados.');}
 }
 else if(sector){const [x,y,z]=sector.target;controls.target.set(X(x),y,Z(z));camera.position.copy(controls.target).add(new THREE.Vector3(...sector.offset));}
 else if(mode==='tdetail'){const b=data.buildings.find(b=>b.id==='T'),r=b.rects[0];controls.target.set(X((r[0]+r[2])/2)+(b.offsetX||0)-(r[2]-r[0])*S()*.25,2.8,Z(r[1])+(b.offsetZ||0)-2.5);camera.position.copy(controls.target).add(new THREE.Vector3(-24,14,-38));}
 else if(mode==='wdetail'){controls.target.set(148.5,4.8,-41.7);camera.position.set(106,15,-76);}
 else if(mode==='p2detail'){controls.target.set(192,4.5,44);camera.position.set(148,34,108);}
 else if(mode==='plaza'){controls.target.set(X(563.5),3,Z(486.5));camera.position.copy(controls.target).add(new THREE.Vector3(35,115,155));}
 else if(mode==='pavilions'){controls.target.set(X(824),6,Z(337));camera.position.copy(controls.target).add(new THREE.Vector3(-45,90,-140));}
 else if(mode==='cosei'){controls.target.set(X(817),4.5,Z(540));camera.position.copy(controls.target).add(new THREE.Vector3(-12,62,-128));}
 else if(mode==='gdetail'){controls.target.set(X(670),3.2,Z(531));camera.position.copy(controls.target).add(new THREE.Vector3(64,15.5,18));}
 else if(mode==='parking'){controls.target.set(X(790),3,Z(255));camera.position.copy(controls.target).add(new THREE.Vector3(-80,170,-200));}
 else if(mode==='maps'){const north=campusNorth(georeference);camera.position.set(north?-north.x*630:-70,580,north?-north.z*630:-630);}
 else if(mode==='top'){camera.position.set(0,1000,0);const north=campusNorth(georeference);if(north)camera.up.set(north.x,0,north.z);else camera.up.set(.17,0,.985);}
 else camera.position.set(0,580,630);
 camera.lookAt(controls.target);camera.updateProjectionMatrix();controls.update();$('sectorDetalle').value=sector?mode:'';for(const id of cameraButtons)if($(id))$(id).classList.toggle('active',id===mode);resize();}
for(const mode of cameraButtons)if($(mode))$(mode).onclick=()=>view(mode);
$('interior').onchange=e=>openInterior(e.target.value);
$('sectorDetalle').onchange=e=>view(e.target.value||'approved');
$('volverCampus').onclick=()=>view('approved');
$('spin').onclick=()=>{if(topMode)view('maps');controls.autoRotate=!controls.autoRotate;$('spin').classList.toggle('active',controls.autoRotate);};
$('trees').onchange=()=>vegetation.visible=$('trees').checked;$('names').onchange=syncLabels;$('grid').onchange=()=>grid.visible=$('grid').checked;
function message(text){$('status').textContent=text;clearTimeout(message.timer);message.timer=setTimeout(()=>$('status').textContent='',6500);}
function renderViewport(){
 if(activeInterior){renderer.render(interiorScene,camera);return;}
 // El rótulo de esquina sigue visible en las cámaras de detalle. Los archivos del campus se exportan con su marca completa.
 const mark=focusMode?world?.children.find(node=>node.name==='Marca_copyright_modelo'):null;
 const visible=mark?.visible;
 if(mark)mark.visible=false;
 try{renderer.render(scene,camera);}finally{if(mark)mark.visible=visible;}
}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),6000);}
async function save(blob,kind,name){if(location.protocol==='http:'&&['localhost','127.0.0.1'].includes(location.hostname)){const res=await fetch('/guardar/'+kind,{method:'POST',body:blob});if(!res.ok)throw Error('No se pudo guardar');const r=await res.json();message('Guardado en la carpeta del modelo: '+r.saved);}else{download(blob,name);message('Archivo preparado para descargar.');}}
$('saveglb').onclick=async()=>{if(isSaving)return;const btn=$('saveglb');btn.disabled=true;message('Preparando modelo GLB…');const was=vegetation.visible;try{vegetation.visible=true;const result=await new GLTFExporter().parseAsync(world,{binary:true,onlyVisible:true});await save(new Blob([result],{type:'model/gltf-binary'}),'glb','UAM_Azcapotzalco.glb');}catch(e){$('error').textContent=e.message;}finally{vegetation.visible=was;btn.disabled=false;}};
$('savejson').onclick=()=>saveEditorChanges(false);
$('savepng').onclick=async()=>{renderViewport();const canvas=document.createElement('canvas');canvas.width=renderer.domElement.width;canvas.height=renderer.domElement.height;const ctx=canvas.getContext('2d');ctx.drawImage(renderer.domElement,0,0);const factor=canvas.width/mount.clientWidth;if($('names').checked)for(const l of (activeInterior?interiorLabels:labels)){if(l.el.style.display==='none')continue;const x=parseFloat(l.el.style.left)*factor,y=parseFloat(l.el.style.top)*factor;ctx.font=`600 ${12*factor}px sans-serif`;const w=ctx.measureText(l.el.textContent).width+12*factor;ctx.fillStyle=l.el.classList.contains('vehicle')?'#bc3535':l.el.classList.contains('pedestrian')?'#1d72b6':'#fffdf0';ctx.fillRect(x-w/2,y-10*factor,w,20*factor);ctx.fillStyle=['vehicle','pedestrian'].some(c=>l.el.classList.contains(c))?'white':'#243b2e';ctx.textAlign='center';ctx.fillText(l.el.textContent,x,y+4*factor);}
 ctx.textAlign='left';ctx.font=`${12*factor}px sans-serif`;ctx.fillStyle='#344d3f';ctx.fillText(activeInterior?'UAM Azcapotzalco · Corte interior esquemático':'UAM Azcapotzalco · Modelo aproximado basado en v7',18*factor,canvas.height-18*factor);drawWatermark(ctx);canvas.toBlob(async b=>{try{await save(b,'png','Vista_UAM.png');}catch(e){message(e.message);}},'image/png');};
$('loadjson').onclick=()=>$('filejson').click();
$('filejson').onchange=async e=>{try{if(!e.target.files[0])return;const loaded=validateCampus(JSON.parse(await e.target.files[0].text()));rememberEdit();data=loaded;selected='';editSelected='';generate();updateSaveState();message('Datos cargados. Usa Guardar cambios para conservarlos.');}catch(e){message('No se pudo abrir: '+e.message);}finally{e.target.value='';}};
// Editor ligero: los cambios son datos; los controles no forman parte del GLB.
let editHelper=null;
function clearEditSelection(){if(editHelper){scene.remove(editHelper);editHelper.geometry.dispose();editHelper.material.dispose();editHelper=null;}}
function registerEditable(id,title,kind,node,size){
 if((data.removedElements||[]).includes(id)){node.removeFromParent();return;}
 const entry={id,title,kind,node,basePosition:node.position.clone(),baseAngle:node.rotation.y,size};editables.set(id,entry);node.userData.editableId=id;
 const change=data.elementEdits?.[id]||{};node.position.x+=change.offsetX||0;node.position.z+=change.offsetZ||0;node.rotation.y+=change.rotation||0;
 if(size){node.scale.x=(change.width||size.width)/size.width;node.scale.z=(change.depth||size.depth)/size.depth;}
}
// Las reservas son visuales/conservadoras: no son un levantamiento ni certifican accesibilidad.
let parkingObstaclesCache=null;
const parkingCrossings=[[234,202],[541,202],[746,202],[904,202],[391,627],[1298,233]];
const parkingRoadRects=[[1114,193,1134,242],[1120,224,1488,242],[1289,240,1307,366],[48,618,640,636]];
const llegadaVehicularV1=[
 [[48,211],[72,211],[72,229],[48,229]],
 [[72,211],[100,193],[100,211],[72,229]],
];
function parkingWorldRect(r,pad=0){return rectanglePolygon(X((r[0]+r[2])/2),Z((r[1]+r[3])/2),(r[2]-r[0])*S()+2*pad,(r[3]-r[1])*S()+2*pad);}
function parkingNodeBounds(node,pad=.2){const bounds=new THREE.Box3().setFromObject(node);return bounds.isEmpty()?[]:rectanglePolygon((bounds.min.x+bounds.max.x)/2,(bounds.min.z+bounds.max.z)/2,bounds.max.x-bounds.min.x+2*pad,bounds.max.z-bounds.min.z+2*pad);}
function parkingMeshFootprint(mesh){
 if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();const b=mesh.geometry.boundingBox,points=[];let minY=Infinity,maxY=-Infinity;
 for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){const p=new THREE.Vector3(x,y,z).applyMatrix4(mesh.matrixWorld);points.push({x:p.x,z:p.z});minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);}
 return minY<=.9&&maxY>=.2?convexHull(points):[];
}
function parkingObstacles(){
 if(parkingObstaclesCache)return parkingObstaclesCache;
 world.updateMatrixWorld(true);
 const gardens=[...parcelasVerdesHHP,...jardinesAcademicos].flatMap(contorno=>{
  const puntos=contorno.map(([x,z])=>new THREE.Vector2(X(x),Z(z)));
  return THREE.ShapeUtils.triangulateShape(puntos,[]).map(cara=>cara.map(i=>({x:puntos[i].x,z:puntos[i].y})));
 });
 const pavimentosPeatonales=[
  ...[andadorHHP,andadorAcademico].map(r=>parkingWorldRect(r)),
  ...(world.getObjectByName('Detalles_Maps_accesos_y_jardin_B_D')?.userData.reservasAparcamiento||[]),
 ];
 const hard=[...gardens,...pavimentosPeatonales],pedestrian=[],entradaV1=llegadaVehicularV1.map(p=>p.map(([x,z])=>({x:X(x),z:Z(z)})));
 const roads=[...(data.driveAisles||[]),...parkingRoadRects].map(r=>parkingWorldRect(r)).concat(entradaV1);
 for(const b of data.buildings){
  const node=buildingGroups.get(b.id),own=[];if(!node)continue;
  for(const r of b.rects){const diagonal=b.diamond?Math.SQRT1_2:1;
   const poly=rectanglePolygon(X((r[0]+r[2])/2),Z((r[1]+r[3])/2),(r[2]-r[0])*S()*diagonal+.28,(r[3]-r[1])*S()*diagonal+.28,b.diamond?(b.facadeYaw??Math.PI/4):0).map(p=>{const v=new THREE.Vector3(p.x,0,p.z).applyMatrix4(node.matrixWorld);return {x:v.x,z:v.z};});
   own.push(poly);hard.push(poly);
  }
  // Escaleras, rampas y apoyos en PB que sobresalen de la huella: usar sus mallas, no puntos fijos.
  node.traverse(mesh=>{
   // Un recinto acristalado sigue ocupando todo su interior aunque sus paneles
   // sean planos. La reserva afecta sólo al aparcamiento, no a las rutas.
   const area=mesh.userData?.parkingGroundBounds;
   if(area&&[area.xMin,area.xMax,area.zMin,area.zMax].every(Number.isFinite)&&area.xMax>area.xMin&&area.zMax>area.zMin){
    const poly=rectanglePolygon((area.xMin+area.xMax)/2,(area.zMin+area.zMax)/2,area.xMax-area.xMin,area.zMax-area.zMin).map(p=>{const v=new THREE.Vector3(p.x,0,p.z).applyMatrix4(mesh.matrixWorld);return {x:v.x,z:v.z};});hard.push(poly);
   }
   if(!mesh.isMesh)return;const poly=parkingMeshFootprint(mesh);if(poly.length&&subtractObstacles(poly,own).length)hard.push(poly);
  });
 }
 for(const entry of editables.values())if(entry.kind==='sculpture'&&entry.node.parent){const poly=parkingNodeBounds(entry.node,.22);if(poly.length)hard.push(poly);}
 const plazuela=world.getObjectByName('Plazuela_bancas_curvas_J');if(plazuela)hard.push(parkingNodeBounds(plazuela,.15));
 for(const p of data.plazas)hard.push(parkingWorldRect(p.rect,.12));
 for(const r of data.paths)pedestrian.push(parkingWorldRect(r,.12));
 const net=routeEditor?.getNet()||BASE_ROUTES,nodes=new Map(net.nodos.map(n=>[n.id,n]));
 for(const edge of net.aristas){const a=nodes.get(edge.de),b=nodes.get(edge.a);if(a&&b&&Math.hypot(b.x-a.x,b.z-a.z)>.01)pedestrian.push(segmentPolygon(a,b,1.8));}
 const crossings=parkingCrossings.map(([x,z])=>rectanglePolygon(X(x),Z(z),3.8,9));
 // Sólo los seis cruces ya dibujados permiten la superposición gráfica vial/peatonal.
 const pedestrianOutsideCrossings=pedestrian.flatMap(p=>subtractObstacles(p,crossings));
 return parkingObstaclesCache={hard,pedestrian,roads,entradaV1,crossings,pedestrianOutsideCrossings,gardens,pavimentosPeatonales};
}
function parkingPainter(parent,bounds=null){
 parent.updateWorldMatrix(true,false);const inverse=parent.matrixWorld.clone().invert();
 const transform=p=>{const v=new THREE.Vector3(p.x,0,p.z).applyMatrix4(parent.matrixWorld);return {x:v.x,z:v.z};};
 const local=p=>{const v=new THREE.Vector3(p.x,0,p.z).applyMatrix4(inverse);return {x:v.x,z:v.z};};
 const footprint=(x,z,w,d)=>rectanglePolygon(x,z,w,d).map(transform);
 const boundary=bounds?footprint(0,0,bounds.width,bounds.depth):null;
 function draw(name,x,y,z,w,h,d,color,obstacles=[]){
  const original=footprint(x,z,w,d),subject=boundary?intersectConvex(original,boundary):original,parts=subject.length?subtractObstacles(subject,obstacles):[];
  if(parts.length===1&&Math.abs(polygonArea(parts[0])-polygonArea(original))<1e-7){return [box(parent,name,x,y,z,w,h,d,color)];}
  const result=[];
  for(const polygon of parts){const points=polygon.map(local),shape=new THREE.Shape();points.forEach((p,i)=>i?shape.lineTo(p.x,-p.z):shape.moveTo(p.x,-p.z));shape.closePath();const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false}),material(color));mesh.name=name;mesh.rotation.x=-Math.PI/2;mesh.position.y=y-h/2;mesh.receiveShadow=true;mesh.castShadow=h>1;mesh.userData={clippedParkingGeometry:true};parent.add(mesh);result.push(mesh);}
  return result;
 }
 return {draw,footprint,clear:(x,z,w,d,obstacles)=>{const p=footprint(x,z,w,d);return (!boundary||Math.abs(polygonArea(p)-polygonArea(intersectConvex(p,boundary)))<1e-7)&&!obstacles.some(o=>polygonsOverlap(p,o));}};
}
function parkingArea(r,id,title){
 const baseW=(r[2]-r[0])*S(),baseD=(r[3]-r[1])*S(),group=new THREE.Group();group.name='Estacionamiento_editable_'+id;group.position.set(X((r[0]+r[2])/2),0,Z((r[1]+r[3])/2));world.add(group);registerEditable(id,title,'parking',group,{width:baseW,depth:baseD});if(!group.parent)return;
 const site=parkingObstacles();
 parkingPainter(group).draw('Asfalto',0,.15,0,baseW,.24,baseD,'#58605d',[...site.gardens,...site.pavimentosPeatonales]);
 // Redimensionar reticula el trazado en metros, sin estirar el grosor ni el paso de los cajones.
 const w=baseW*group.scale.x,d=baseD*group.scale.z,layout=new THREE.Group();layout.name='Trazado_en_metros_'+id;layout.scale.set(1/group.scale.x,1,1/group.scale.z);group.add(layout);
 const draw=parkingPainter(layout,{width:w,depth:d}),curb='#d4d2c4',lineCol='#f4eed8',stopper='#e3bd3b',laneCol='#4a514f',dashCol='#efd055';
 const laneRects=[],rows=[],medians=[],filasObservadas=[];let vertical=null;
 const trazado=trazadosHHP[id];
 if(trazado){
  const [x0,z0,x1,z1]=trazado.limites;
  const localX=x=>((x-x0)/(x1-x0)-.5)*w,localZ=z=>((z-z0)/(z1-z0)-.5)*d;
  for(const [x,inicio,fin] of trazado.carriles)laneRects.push({x:localX(x),z:localZ((inicio+fin)/2),w:5.4,d:localZ(fin)-localZ(inicio)});
  for(const [x,dir,inicio,fin] of trazado.filas)filasObservadas.push([localX(x),dir,localZ(inicio),localZ(fin)]);
 }else if(w>=d){
  rows.push([-d/2+3,1],[d/2-3,-1]);if(d>=32)medians.push(id==='parking_3'?d*.08:-d*.08);if(d>=58)medians.push(d*.18);
  for(const z of medians)rows.push([z-3.05,-1],[z+3.05,1]);
  for(const z of d>=58?[-d*.28,0,d*.34]:d>=32?[-d*.24,d*.24]:[0])laneRects.push({x:0,z,w:w+.4,d:5.4});
 }else if(id==='parking_0'){
  const zStart=-d/2+4,zEnd=d/2-42;vertical={zStart,zEnd,zMid:(zStart+zEnd)/2};
  if(zEnd>zStart)for(const x of [-w*.28,w*.22])laneRects.push({x,z:vertical.zMid,w:5.4,d:zEnd-zStart});
 }
 const laneBlocks=laneRects.map(r=>draw.footprint(r.x,r.z,r.w,r.d));
 const physical=[...site.hard,...site.pedestrian],reserved=[...physical,...site.roads,...laneBlocks],laneExcluded=[...site.hard,...site.pedestrianOutsideCrossings];
 for(const side of [-1,1]){
  draw.draw('Guarnicion_estacionamiento',0,.32,side*(d/2-.24),w,.14,.48,curb,reserved);
  if(id!=='parking_5')draw.draw('Guarnicion_estacionamiento',side*(w/2-.24),.32,0,.48,.14,d,curb,reserved);
 }
 function median(x,z,mw,md){
  draw.draw('Camellon_estacionamiento',x,.33,z,mw,.16,md,curb,reserved);
  draw.draw('Area_verde_camellon',x,.39,z,Math.max(.1,mw-.4),.06,Math.max(.1,md-.4),'#587f4e',reserved);
  const horizontal=mw>=md,len=Math.max(mw,md);
  for(let t=-len/2+8;t<=len/2-8;t+=22){const lx=x+(horizontal?t:0),lz=z+(horizontal?0:t);
   // También se reserva la huella completa de la luminaria, no sólo su poste.
   if(draw.clear(lx,lz,1.6,1.6,reserved)){box(layout,'Poste_luz_estacionamiento',lx,3.2,lz,.16,6,.16,'#464c4e');box(layout,'Luminaria_estacionamiento',lx,6.2,lz,horizontal?.35:1.3,.18,horizontal?1.3:.35,'#eef0ec');}
  }
 }
 for(const z of medians)if(w>26)median(0,z,w-14,1.35);
 if(vertical&&vertical.zEnd-vertical.zStart>12)median(-2.2,vertical.zMid,1.35,vertical.zEnd-vertical.zStart-8);
 for(const lane of laneRects){
  draw.draw('Carril_circulacion_interna',lane.x,.285,lane.z,lane.w,.025,lane.d,laneCol,laneExcluded);
  const horizontal=lane.w>=lane.d,len=Math.max(lane.w,lane.d);
  for(let t=-len/2+3;t<=len/2-3;t+=4.8)draw.draw('Linea_carril_vial',lane.x+(horizontal?t:0),.315,lane.z+(horizontal?0:t),horizontal?2.1:.28,.03,horizontal?.28:2.1,dashCol,[...laneExcluded,...site.crossings]);
 }
 const stallW=2.7,stallD=4.6,medianBlocks=medians.map(z=>draw.footprint(0,z,Math.max(.1,w-14),1.65));
 if(vertical)medianBlocks.push(draw.footprint(-2.2,vertical.zMid,1.65,Math.max(.1,vertical.zEnd-vertical.zStart-8)));
 const stallsExcluded=[...reserved,...medianBlocks],paintedLines=new Set();
 function stall(x,z,dir,horizontal=true,depth=stallD){
  // Toda la plaza (incluido el saliente de pintura), cabecera y tope debe quedar libre.
  if(!draw.clear(x,z,horizontal?stallW+.32:depth+.08,horizontal?depth+.08:stallW+.32,stallsExcluded))return;
  for(const side of [-1,1]){const lx=x+(horizontal?side*stallW/2:0),lz=z+(horizontal?0:side*stallW/2),key=lx.toFixed(6)+'|'+lz.toFixed(6)+'|'+horizontal+'|'+depth;if(!paintedLines.has(key)){paintedLines.add(key);box(layout,'Cajón',lx,.325,lz,horizontal?.28:depth,.04,horizontal?depth:.28,lineCol);}}
  box(layout,'Linea_cabecera_bateria',x+(horizontal?0:-dir*(depth/2-.14)),.325,z+(horizontal?-dir*(depth/2-.14):0),horizontal?stallW-.28:.28,.04,horizontal?.28:stallW-.28,lineCol);
  box(layout,'Tope_cajon',x+(horizontal?0:-dir*(depth/2-.78)),.35,z+(horizontal?-dir*(depth/2-.78):0),horizontal?1.55:.28,.08,horizontal?.28:1.55,stopper);
 }
 if(trazado)for(const [x,dir,inicio,fin] of filasObservadas)for(let z=inicio;z<=fin;z+=stallW)stall(x,z,dir,false);
 else if(w>=d)for(const [z,dir] of rows)for(let x=-w/2+3.2;x<=w/2-3.2;x+=stallW)stall(x,z,dir);
 else if(vertical)for(const [x,dir] of [[-w/2+3,1],[-5.25,-1],[.85,1],[w/2-3,-1]])for(let z=-d/2+3.5;z<=d/2-3.5;z+=stallW)stall(x,z,dir,false);
 else for(let x=-w/2+1.8;x<=w/2-1.8;x+=stallW)stall(x,d/2-2.8,-1,true,4.2);
 group.userData.parkingLayout={completeFootprintChecks:true,followsEditedTransforms:true,stallPitchMeters:2.7,lineWidthMeters:.28,illustrative:true,accessibleStallLocationsVerified:false};
 // No se asignan automáticamente cajones azules: el corpus no confirma esas ubicaciones.
}
function vialidadEstacionamientos(){
 const g=new THREE.Group();g.name='Vialidad_y_accesos_estacionamiento';g.userData={approximate:true,physicalAccessNotVerified:true};world.add(g);const draw=parkingPainter(g),site=parkingObstacles();
 const laneCol='#4a514f',dashCol='#efd055',curb='#d4d2c4',lineCol='#f4eed8',stopper='#e3bd3b',physical=[...site.hard,...site.pedestrian],laneExcluded=[...site.hard,...site.pedestrianOutsideCrossings];
 const rect=(name,r,y,h,color,blocked=physical)=>draw.draw(name,X((r[0]+r[2])/2),y,Z((r[1]+r[3])/2),(r[2]-r[0])*S(),h,(r[3]-r[1])*S(),color,blocked);
 for(const r of data.driveAisles||[])rect('Carril_estacionamientos_conectados',r,.295,.03,laneCol,laneExcluded);
 for(const r of parkingRoadRects)rect('Carril_vial_conexion',r,.295,.03,laneCol,laneExcluded);
 for(const tramo of site.entradaV1){
  const libre=subtractObstacles(tramo,laneExcluded);
  for(const poly of libre){
   const shape=new THREE.Shape();
   poly.forEach(({x,z},i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));
   shape.closePath();
   const pavement=new THREE.Mesh(new THREE.ShapeGeometry(shape),material(laneCol));
   pavement.name='Carril_vial_conexion_V1';
   pavement.rotation.x=-Math.PI/2;
   pavement.position.y=.312;
   pavement.receiveShadow=true;
   g.add(pavement);
  }
 }
 for(const [x0,x1,z] of [[108,1110,201.8],[1136,1476,232.8],[70,632,626.8]])for(let x=x0;x<=x1;x+=14)rect('Linea_carril_vial',[x,z-.14/S(),x+6,z+.14/S()],.32,.03,dashCol,[...laneExcluded,...site.crossings]);
 const wr=[1187,338,1427,370],vehicleReserved=[...physical,...site.roads],paintedLines=new Set();
 rect('Estacionamiento_W_R',wr,.15,.24,'#58605d',site.hard);
 rect('Guarnicion_amarilla_W_R',[wr[0],wr[1],wr[2],wr[1]+1.3],.32,.14,'#deb838',vehicleReserved);
 rect('Guarnicion_W_R',[wr[0],wr[3]-1.3,wr[2],wr[3]],.32,.14,curb,vehicleReserved);
 for(let x=X(wr[0])+3;x<X(wr[2])-2;x+=2.7){const z=Z(wr[3])-3.3;
  if(!draw.clear(x,z,3.02,4.68,vehicleReserved))continue;
  for(const side of [-1,1]){const lx=x+side*1.35,key=lx.toFixed(6)+'|'+z.toFixed(6);if(!paintedLines.has(key)){paintedLines.add(key);box(g,'Cajón',lx,.325,z,.28,.04,4.6,lineCol);}}
  box(g,'Linea_cabecera_bateria',x,.325,z+2.16,2.42,.04,.28,lineCol);box(g,'Tope_cajon',x,.35,z+1.55,1.55,.08,.28,stopper);
 }
 for(const px of [1316,1332,1348,1364]){const x=X(px),z=Z(344);if(!draw.clear(x,z,.8,.8,physical))continue;const barrel=new THREE.Mesh(cylinder,material('#d95b26'));barrel.name='Tambo_vial_naranja_R';barrel.position.set(x,.45,z);barrel.scale.set(.28,.75,.28);g.add(barrel);}
 for(const [px,pz] of parkingCrossings){
  // Cruzar el carril es la única excepción visual; nunca se pinta dentro de edificios o esculturas.
  for(let k=-2;k<=2;k++)draw.draw('Paso_peatonal_estacionamiento',X(px)+k*.75,.325,Z(pz),.42,.035,8.8,'#f4f3ea',site.hard);
 }
 for(const gate of data.gates.filter(gt=>gt.type==='vehicle'&&gt.id!=='V1')){
  const x=X(gate.x)+(gate.id==='V3'?-3.5:3.5),z=Z(gate.y)-3.2;
  // Cabina completa y brazo de pluma deben quedar fuera de la reserva peatonal.
  if(!draw.clear(x,z,2.9,3,physical)||!draw.clear(x,z+4,.5,4.6,physical))continue;
  box(g,'Caseta_vigilancia_'+gate.id,x,1.35,z,2.4,2.5,2.2,'#c8c9c0');box(g,'Techo_caseta_'+gate.id,x,2.68,z,2.8,.24,2.6,'#b8292f');box(g,'Ventana_caseta_'+gate.id,x,1.5,z+1.12,1.8,.95,.08,'#2c3e44');box(g,'Base_pluma_'+gate.id,x,.65,z+2.1,.35,1.1,.35,'#d94b2b');box(g,'Pluma_vehicular_'+gate.id,x,1.05,z+4.2,.12,.12,3.8,'#f4f3ea');
 }
 const a=data.buildings.find(b=>b.id==='A');if(a?.construction){
  const r=a.rects[0],ax=X((r[0]+r[2])/2)+(a.offsetX||0),az=Z((r[1]+r[3])/2)+(a.offsetZ||0),aw=(r[2]-r[0])*S()+1.8,ad=(r[3]-r[1])*S()+1.8;
  // La delimitación de obra pertenece a A, no se desplaza al editar parking_0.
  draw.draw('Explanada_obra_A',ax,.275,az,aw,.03,ad,'#b6b7ac',site.pedestrian);
  for(const side of [-1,1]){draw.draw('Guarnicion_obra_A',ax+side*aw/2,.33,az,.48,.16,ad,'#d8b238',physical);draw.draw('Guarnicion_obra_A',ax,.33,az+side*ad/2,aw,.16,.48,'#d8b238',physical);}
 }
}
function editSnapshot(){return structuredClone(data);}
function rememberEdit(snapshot=editSnapshot()){undoHistory.push(snapshot);if(undoHistory.length>40)undoHistory.shift();redoHistory=[];}
function updateSaveState(){const dirty=JSON.stringify(data)!==savedData||routeEditor?.isDirty();$('saveState').textContent=isSaving?'Guardando…':dirty?'Hay cambios sin guardar.':'Sin cambios pendientes.';$('editUndo').disabled=!undoHistory.length;$('editRedo').disabled=!redoHistory.length;}
function rebuildAfterEdit(){generate();updateSaveState();}
function editorOptions(){
 const selector=$('editObject'),kind=$('editFilter').value;selector.replaceChildren(new Option('Selecciona en el mapa o en esta lista',''));
 for(const e of editables.values())if(kind==='all'||e.kind===kind)selector.add(new Option(e.title,e.id));
 selector.value=editSelected;
}
function refreshEditor(){editorOptions();showObjectFields();}
function showObjectFields(){
 clearEditSelection();const e=editables.get(editSelected);$('objectFields').hidden=!e;if(!e)return;
 $('editObject').value=e.id;$('objectX').value=e.node.position.x.toFixed(2);$('objectZ').value=e.node.position.z.toFixed(2);$('objectAngle').value=THREE.MathUtils.radToDeg(e.node.rotation.y).toFixed(1);
 $('parkingFields').hidden=e.kind!=='parking';if(e.size){$('parkingWidth').value=(e.size.width*e.node.scale.x).toFixed(2);$('parkingDepth').value=(e.size.depth*e.node.scale.z).toFixed(2);}
 if(editMode){editHelper=new THREE.BoxHelper(e.node,'#f4a622');editHelper.name='Selección_editor';scene.add(editHelper);}
}
function chooseEditable(id){editSelected=id||'';const e=editables.get(id);if(e&&$('editFilter').value!=='all'&&$('editFilter').value!==e.kind)$('editFilter').value='all';refreshEditor();}
function resetDraw(){drawStart=null;if(drawPreview){scene.remove(drawPreview);drawPreview.geometry.dispose();drawPreview.material.dispose();drawPreview=null;}}
function setEditing(value){
 editMode=value;resetDraw();controls.autoRotate=false;$('spin').classList.remove('active');controls.enabled=true;$('sceneEditor').hidden=!value;$('toggleEdit').textContent=value?'Cerrar modo edición':'Activar modo edición';$('toggleEdit').setAttribute('aria-expanded',String(value));mount.classList.toggle('editing',value);refreshEditor();
 if(value)message('Selecciona y arrastra un elemento. Los cambios se conservan con Guardar cambios.');
}
$('toggleEdit').onclick=()=>{if(activeInterior)view('approved');if(!editMode){$('editRoutes').checked=false;$('routeEditor').hidden=true;}setEditing(!editMode);};
$('editObject').onchange=e=>chooseEditable(e.target.value);
$('editFilter').onchange=()=>{editSelected='';refreshEditor();};
$('editTop').onclick=()=>view('top');
$('editTool').onchange=()=>{resetDraw();message($('editTool').value==='parking'?'Marca dos esquinas del estacionamiento. Esc cancela.':$('editTool').value==='place'?'Selecciona un elemento en la lista y haz clic en su nueva ubicación.':'Selecciona un elemento y arrástralo.');};
$('editUndo').onclick=()=>{if(isSaving||!undoHistory.length)return;resetDraw();redoHistory.push(editSnapshot());data=undoHistory.pop();rebuildAfterEdit();message('Cambio deshecho.');};
$('editRedo').onclick=()=>{if(isSaving||!redoHistory.length)return;resetDraw();undoHistory.push(editSnapshot());data=redoHistory.pop();rebuildAfterEdit();message('Cambio recuperado.');};
function writeTransform(e,x,z,angle,width,depth){
 data.elementEdits??={};data.elementEdits[e.id]={offsetX:x-e.basePosition.x,offsetZ:z-e.basePosition.z,rotation:angle-e.baseAngle,...(e.size?{width:width??e.size.width*e.node.scale.x,depth:depth??e.size.depth*e.node.scale.z}:{})};
}
$('applyObject').onclick=()=>{
 const e=editables.get(editSelected);if(!e)return;const x=Number($('objectX').value),z=Number($('objectZ').value),angle=Number($('objectAngle').value),w=Number($('parkingWidth').value),d=Number($('parkingDepth').value);
 if(![x,z,angle].every(Number.isFinite)||Math.abs(x)>1000||Math.abs(z)>1000||(e.size&&(![w,d].every(Number.isFinite)||w<2||w>750||d<2||d>310))){message('Revisa las medidas. Estacionamientos: ancho de 2 a 750 m y fondo de 2 a 310 m.');return;}
 rememberEdit();writeTransform(e,x,z,THREE.MathUtils.degToRad(angle),w,d);rebuildAfterEdit();message('Elemento actualizado.');
};
$('resetObject').onclick=()=>{if(!editables.has(editSelected))return;rememberEdit();delete data.elementEdits?.[editSelected];rebuildAfterEdit();message('Elemento restablecido.');};
$('deleteObject').onclick=()=>{if(!editables.has(editSelected))return;rememberEdit();data.removedElements??=[];data.removedElements.push(editSelected);editSelected='';rebuildAfterEdit();message('Elemento quitado. Puedes recuperarlo con Deshacer.');};
function canvasRay(e){const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);}
function groundPoint(e){canvasRay(e);const p=new THREE.Vector3();return raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),p);}
function snapped(p){if($('editSnap').checked){p.x=Math.round(p.x*2)/2;p.z=Math.round(p.z*2)/2;}return p;}
function editableAt(e){canvasRay(e);const hits=raycaster.intersectObjects([...editables.values()].filter(e=>e.kind!=='tree'||vegetation.visible).map(e=>e.node),true);const selected=editables.get(editSelected);if(selected&&hits.length){const selectedHits=raycaster.intersectObject(selected.node,true);if(selectedHits.length&&selectedHits[0].distance<=hits[0].distance+.3)return selected;}for(const hit of hits){let node=hit.object;while(node&&!node.userData.editableId)node=node.parent;if(node)return editables.get(node.userData.editableId);}return null;}
function consumePointer(e){e.preventDefault();e.stopImmediatePropagation();}
function validParkingPoint(p){return inside(p.x/S()+895,p.z/S()+390,data.site);}
function finishParking(p){
 const a=drawStart,w=Math.abs(p.x-a.x),d=Math.abs(p.z-a.z);if(w<2||d<2){message('Marca una segunda esquina a más de 2 m de la primera.');return;}
 const points=[[Math.min(a.x,p.x),Math.min(a.z,p.z)],[Math.max(a.x,p.x),Math.min(a.z,p.z)],[Math.max(a.x,p.x),Math.max(a.z,p.z)],[Math.min(a.x,p.x),Math.max(a.z,p.z)]];
 if(!points.every(([x,z])=>validParkingPoint(new THREE.Vector3(x,0,z)))){message('Las cuatro esquinas deben quedar dentro del campus.');return;}
 rememberEdit();data.extraParking??=[];const id='parking_new_'+Date.now().toString(36)+'_'+data.extraParking.length;
 data.extraParking.push({id,rect:[points[0][0]/S()+895,points[0][1]/S()+390,points[2][0]/S()+895,points[2][1]/S()+390]});resetDraw();editSelected=id;$('editFilter').value='parking';rebuildAfterEdit();$('editTool').value='move';message('Estacionamiento creado. Puedes moverlo, girarlo y ajustar sus medidas.');
}
renderer.domElement.addEventListener('pointerdown',e=>{
 if(!editMode||e.button!==0||isSaving)return;const tool=$('editTool').value;
 if(tool==='parking'){consumePointer(e);const p=groundPoint(e);if(!p)return;snapped(p);if(!drawStart){if(!validParkingPoint(p)){message('Marca la primera esquina dentro del campus.');return;}drawStart=p;message('Ahora marca la esquina opuesta.');}else finishParking(p);return;}
 if(tool==='place'){consumePointer(e);const entry=editables.get(editSelected),p=groundPoint(e);if(!entry){message('Elige primero un elemento en la lista.');return;}if(!p)return;snapped(p);rememberEdit();writeTransform(entry,p.x,p.z,entry.node.rotation.y);rebuildAfterEdit();message('Elemento colocado.');return;}
 const entry=editableAt(e);if(!entry)return;consumePointer(e);const p=groundPoint(e);if(!p)return;chooseEditable(entry.id);controls.enabled=false;dragEdit={entry,start:p,position:entry.node.position.clone(),snapshot:editSnapshot(),pointerId:e.pointerId};renderer.domElement.setPointerCapture(e.pointerId);
},true);
renderer.domElement.addEventListener('pointermove',e=>{
 if(!editMode)return;
 if(dragEdit){consumePointer(e);const p=groundPoint(e);if(!p)return;const target=dragEdit.position.clone().add(p.sub(dragEdit.start));snapped(target);dragEdit.entry.node.position.x=target.x;dragEdit.entry.node.position.z=target.z;editHelper?.update();return;}
 if(drawStart){const p=groundPoint(e);if(!p)return;snapped(p);if(!drawPreview){drawPreview=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:'#efb542',transparent:true,opacity:.55,depthTest:false}));drawPreview.name='Vista_previa_estacionamiento';drawPreview.renderOrder=10;scene.add(drawPreview);}drawPreview.position.set((drawStart.x+p.x)/2,.5,(drawStart.z+p.z)/2);drawPreview.scale.set(Math.max(.05,Math.abs(p.x-drawStart.x)),.15,Math.max(.05,Math.abs(p.z-drawStart.z)));}
},true);
function endEditDrag(e,cancel=false){if(!dragEdit)return;consumePointer(e);const drag=dragEdit;dragEdit=null;controls.enabled=true;if(renderer.domElement.hasPointerCapture(e.pointerId))renderer.domElement.releasePointerCapture(e.pointerId);
 const moved=drag.entry.node.position.distanceTo(drag.position)>.01;if(cancel){drag.entry.node.position.copy(drag.position);showObjectFields();return;}if(moved){rememberEdit(drag.snapshot);writeTransform(drag.entry,drag.entry.node.position.x,drag.entry.node.position.z,drag.entry.node.rotation.y);rebuildAfterEdit();}else showObjectFields();
}
renderer.domElement.addEventListener('pointerup',e=>endEditDrag(e),true);
renderer.domElement.addEventListener('pointercancel',e=>endEditDrag(e,true),true);
document.addEventListener('keydown',e=>{if(!editMode||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(e.key==='Escape'){resetDraw();message('Dibujo cancelado.');}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();$(e.shiftKey?'editRedo':'editUndo').click();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();$('editRedo').click();}});
window.addEventListener('beforeunload',e=>{if(savedData&&(JSON.stringify(data)!==savedData||routeEditor?.isDirty())){e.preventDefault();e.returnValue='';}});
function validateCampus(d){
 if(d?.vidrioCosei&&(!Array.isArray(d.vidrioCosei.position)||d.vidrioCosei.position.length!==2||!d.vidrioCosei.position.every(Number.isFinite)||(d.vidrioCosei.scale!==undefined&&(!Number.isFinite(d.vidrioCosei.scale)||d.vidrioCosei.scale<.2||d.vidrioCosei.scale>4))))throw Error('Escultura de vidrio COSEI inválida');
 if(d?.serpentina&&(!Array.isArray(d.serpentina.position)||d.serpentina.position.length!==2||!d.serpentina.position.every(Number.isFinite)||(d.serpentina.scale!==undefined&&(!Number.isFinite(d.serpentina.scale)||d.serpentina.scale<.2||d.serpentina.scale>4))))throw Error('Serpentina inválida');
 if(d?.habitacionesLuz&&(!Array.isArray(d.habitacionesLuz.position)||d.habitacionesLuz.position.length!==2||!d.habitacionesLuz.position.every(Number.isFinite)||(d.habitacionesLuz.scale!==undefined&&(!Number.isFinite(d.habitacionesLuz.scale)||d.habitacionesLuz.scale<.2||d.habitacionesLuz.scale>4))))throw Error('Habitaciones de Luz inválidas');
 if(d?.universitas&&(!Array.isArray(d.universitas.position)||d.universitas.position.length!==2||!d.universitas.position.every(Number.isFinite)||(d.universitas.scale!==undefined&&(!Number.isFinite(d.universitas.scale)||d.universitas.scale<.2||d.universitas.scale>4))))throw Error('Universitas inválida');
 if(d?.casaAbierta&&(!Array.isArray(d.casaAbierta.position)||d.casaAbierta.position.length!==2||!d.casaAbierta.position.every(Number.isFinite)||(d.casaAbierta.scale!==undefined&&(!Number.isFinite(d.casaAbierta.scale)||d.casaAbierta.scale<.2||d.casaAbierta.scale>4))))throw Error('Casa abierta al tiempo inválida');
 if(d?.showCopyright!==undefined&&typeof d.showCopyright!=='boolean')throw Error('showCopyright debe ser true o false');
 const rect=r=>Array.isArray(r)&&r.length===4&&r.every(Number.isFinite)&&r[2]>r[0]&&r[3]>r[1];
 if(!d||!Array.isArray(d.buildings)||!Array.isArray(d.site)||!(d.metersPerPixel>0)||!Number.isFinite(d.storeyHeight)||!d.buildings.every(b=>typeof b.id==='string'&&Number.isInteger(b.floors)&&b.floors>=1&&b.floors<=8&&Array.isArray(b.rects)&&b.rects.every(rect))||!['plazas','paths','parking','gates'].every(k=>Array.isArray(d[k]))||!d.parking.every(rect)||!d.paths.every(rect)||!d.plazas.every(p=>rect(p.rect)))throw Error('Datos de campus inválidos');
 if(d.extraParking!==undefined&&(!Array.isArray(d.extraParking)||d.extraParking.length>500||!d.extraParking.every(p=>typeof p.id==='string'&&/^parking_new_[a-z0-9_]+$/.test(p.id)&&rect(p.rect))))throw Error('Estacionamientos inválidos');
 if(d.removedElements!==undefined&&(!Array.isArray(d.removedElements)||!d.removedElements.every(id=>typeof id==='string')))throw Error('Elementos retirados inválidos');
 if(d.elementEdits!==undefined&&(!d.elementEdits||Array.isArray(d.elementEdits)||typeof d.elementEdits!=='object'||!Object.values(d.elementEdits).every(v=>v&&typeof v==='object'&&Object.entries(v).every(([key,n])=>['offsetX','offsetZ','rotation','width','depth'].includes(key)&&Number.isFinite(n)&&Math.abs(n)<10000)&&(!('width'in v)||v.width>=2)&&(!('depth'in v)||v.depth>=2))))throw Error('Posiciones de elementos inválidas');
 return {...d,version:8};
}
// Plano 2D para la app móvil: vista ortográfica desde arriba, fondo transparente, +X a la derecha y -Z arriba.
// La app lo coloca sobre el mapa real con georreferencia.json; estos límites (m) deben coincidir con los de ahí.
// Marca temporal sobre la imagen, nunca sobre la geometría exportada.
function drawWatermark(ctx){
 if(!copyrightEnabled())return;
 const text='copyright @gabrielhuav',margin=12,size=14;ctx.save();ctx.font='500 '+size+'px system-ui, sans-serif';ctx.textAlign='right';ctx.textBaseline='bottom';const width=ctx.measureText(text).width;
 ctx.fillStyle='rgba(255,255,255,.78)';ctx.fillRect(ctx.canvas.width-margin-width-8,ctx.canvas.height-margin-size-6,width+16,size+12);ctx.fillStyle=copyrightStyle().color;ctx.fillText(text,ctx.canvas.width-margin,ctx.canvas.height-margin);ctx.restore();
}
async function watermarkedPlan(source,withMark=true){
 const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;const ctx=canvas.getContext('2d');ctx.drawImage(source,0,0);if(withMark)drawWatermark(ctx);return await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('No se pudo crear el plano PNG.')),'image/png'));
}
const PLANO={xMin:-390,xMax:390,zMin:-150,zMax:170,pxPorMetro:2};
async function planoBlob(withMark=true){
 const w=(PLANO.xMax-PLANO.xMin)*PLANO.pxPorMetro,h=(PLANO.zMax-PLANO.zMin)*PLANO.pxPorMetro;
 const r=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});r.setSize(w,h,false);r.setClearColor(0,0);
 r.outputColorSpace=renderer.outputColorSpace;r.toneMapping=renderer.toneMapping;r.toneMappingExposure=renderer.toneMappingExposure;
 const cam=new THREE.OrthographicCamera(PLANO.xMin,PLANO.xMax,-PLANO.zMin,-PLANO.zMax,1,2500);cam.position.set(0,1000,0);cam.up.set(0,0,-1);cam.lookAt(0,0,0);
 const exteriores=[];
 world.getObjectByName('Portico_San_Pablo_V1')?.traverse(node=>{if(node.userData.fueraDelPredio)exteriores.push(node);});
 const ocultos=[...['Base maqueta','Eje_5_Norte_Montevideo','Av_San_Pablo'].map(n=>world.getObjectByName(n)),...exteriores,editHelper,highlight,routeEditor?.group].filter(Boolean).map(node=>({node,visible:node.visible})),was=vegetation.visible,fog=scene.fog,g=grid.visible;
 for(const o of ocultos)o.node.visible=false;vegetation.visible=true;scene.fog=null;grid.visible=false;
 try{r.render(scene,cam);return await watermarkedPlan(r.domElement,withMark);}
 finally{for(const o of ocultos)o.node.visible=o.visible;vegetation.visible=was;scene.fog=fog;grid.visible=g;r.dispose();}
}
async function saveEditorChanges(withModel=true){
 if(isSaving||!routeEditor)return;let routeSnapshot;try{routeSnapshot=routeEditor.exportNet();}catch(e){message(e.message);return;}isSaving=true;resetDraw();updateSaveState();const buttons=['copyrightToggle','saveChanges','saveglb','savejson','apply','applyObject','deleteObject','resetObject','loadjson','toggleEdit','editUndo','editRedo'];for(const id of buttons)$(id).disabled=true;
 const snapshot=JSON.stringify(data);try{
  if(withModel){const was=vegetation.visible,mark=world.getObjectByName('Marca_copyright_modelo'),visible=mark?.visible;vegetation.visible=true;try{
   let result=await new GLTFExporter().parseAsync(world,{binary:true,onlyVisible:true});await save(new Blob([result],{type:'model/gltf-binary'}),'glb','UAM_Azcapotzalco.glb');await save(await planoBlob(),'plano','plano_2d.png');
   if(mark)mark.visible=false;result=await new GLTFExporter().parseAsync(world,{binary:true,onlyVisible:true});await save(new Blob([result],{type:'model/gltf-binary'}),'glb-sin-marca','UAM_Azcapotzalco_sin_marca.glb');await save(await planoBlob(false),'plano-sin-marca','plano_2d_sin_marca.png');
  }finally{vegetation.visible=was;if(mark)mark.visible=visible;}}
  await save(new Blob([JSON.stringify(JSON.parse(snapshot),null,2)],{type:'application/json'}),'json','campus_editado.json');await save(new Blob([JSON.stringify(routeSnapshot,null,2)],{type:'application/json'}),'rutas','rutas.json');savedData=snapshot;routeEditor.markSaved(routeSnapshot);message(withModel?'Campus, rutas.json y variantes con/sin marca guardados.':'Datos editables y rutas.json guardados.');
 }catch(e){message('No se pudo completar el guardado: '+e.message);}finally{isSaving=false;for(const id of buttons)$(id).disabled=false;updateSaveState();}
}
$('saveChanges').onclick=()=>saveEditorChanges(true);

async function startCampus(){
 if(location.protocol==='http:'){try{const geo=await fetch('./georreferencia.json',{cache:'no-store'});if(geo.ok){const candidate=await geo.json();if(campusNorth(candidate))georeference=candidate;}}catch{ /* El visor portátil mantiene su orientación de reserva. */ }}
 let notice='Listo: gira el modelo con el ratón.';
 if(location.protocol==='http:'&&['localhost','127.0.0.1'].includes(location.hostname)){
  try{const response=await fetch('./campus_editado.json',{cache:'no-store'});if(response.ok){data=validateCampus(await response.json());notice='Se cargaron tus últimos cambios guardados.';}}
  catch(e){notice='No se pudieron cargar los datos guardados. Se muestra la base; revisa el archivo antes de guardar.';}
 }
 let routes=structuredClone(BASE_ROUTES);if(location.protocol==='http:'){try{const response=await fetch('./rutas.json',{cache:'no-store'});if(response.ok)routes=await response.json();}catch{notice+=' Se usa la red incorporada al visor.';}}
 data.version=8;savedData=JSON.stringify(data);generate();
 routeEditor=createRouteEditor({scene,canvas:renderer.domElement,getCamera:()=>camera,getData:()=>data,getGeo:()=>georeference,initial:routes,onDirty:updateSaveState,message,viewTop:()=>view('top'),busy:()=>isSaving,onEnable:()=>{if(editMode)setEditing(false);}});
 view('approved');resize();updateSaveState();$('interior').disabled=false;$('sectorDetalle').disabled=false;message(notice);
}
startCampus();
const v=new THREE.Vector3(),scaleA=new THREE.Vector3(),scaleB=new THREE.Vector3(),scaleRight=new THREE.Vector3();
const scaleBar=mount.querySelector('.scale');
function animate(){requestAnimationFrame(animate);controls.update();renderViewport();const w=mount.clientWidth,h=mount.clientHeight;routeEditor?.paint(camera,w,h,!activeInterior);for(const l of (activeInterior?interiorLabels:labels)){v.copy(l.p).project(camera);l.el.style.display=(!focusMode||!$('serpentina').classList.contains('active')||['H','Serpentina II'].includes(l.el.textContent))&&v.z<1&&v.z>-1&&Math.abs(v.x)<1.1&&Math.abs(v.y)<1.1?'':'none';l.el.style.left=((v.x+1)*w/2)+'px';l.el.style.top=((-v.y+1)*h/2)+'px';}
 if(activeInterior)return;
 // Medida horizontal en el suelo bajo el punto al que apunta la cámara.
 scaleA.set(controls.target.x,0,controls.target.z);
 scaleRight.setFromMatrixColumn(camera.matrixWorld,0);scaleRight.y=0;scaleRight.normalize();
 const metrosPorUnidad=georeference.metrosPorUnidad||1;
 scaleB.copy(scaleA).addScaledVector(scaleRight,1/metrosPorUnidad).project(camera);scaleA.project(camera);
 const pixels=Math.hypot((scaleB.x-scaleA.x)*w,(scaleB.y-scaleA.y)*h)/2;
 const maxWidth=Math.min(150,w*.26);
 const meters=[50,25,10,5,2,1].find(n=>n*pixels<=maxWidth)||.5;
 scaleBar.style.width=Math.min(maxWidth,Math.max(2,pixels*meters))+'px';
 $('scaleText').textContent=meters.toLocaleString('es-MX')+' m aprox. · Escala local';
}
animate();
