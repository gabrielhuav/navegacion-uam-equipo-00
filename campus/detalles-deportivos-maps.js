import {franjasMulticanchasPoniente} from 'sector-talleres-deportes';

// Contorno aproximado de la cancha encajada entre el andador y Ferrocarriles.
// Los puntos vienen de las tomas Esri de 2022–2025 registradas al croquis.
const futbol7 = {centro: [1629.25, 662.5], ancho: 45.7, largo: 109.8, giro: .329};
const ejeGradas = [[1595, 648], [1609, 688.5]];

// Continúa el cierre exterior detrás de Fútbol 7. Las coordenadas se
// derivan de la misma huella girada de los muretes para no tocar el juego.
export function vueltaExteriorFutbol7(a, b, escala) {
 const [cx,cz]=futbol7.centro,cos=Math.cos(futbol7.giro),sin=Math.sin(futbol7.giro);
 const retiro=.65/escala;
 const ancho=futbol7.ancho/2+retiro,largo=futbol7.largo/2+retiro;
 const [dx,dz]=[b[0]-a[0],b[1]-a[1]];
 const lados=[-ancho,ancho].map(x=>{
  const fin=[cx+x*cos+largo*sin,cz-x*sin+largo*cos];
  const producto=dx*cos-dz*sin;
  if(Math.abs(producto)<1e-9)return null;
  const proporcion=((fin[0]-a[0])*cos-(fin[1]-a[1])*sin)/producto;
  const corte=[a[0]+dx*proporcion,a[1]+dz*proporcion];
  const tramoLateral=(fin[0]-corte[0])*sin+(fin[1]-corte[1])*cos;
  return proporcion>0&&proporcion<1&&tramoLateral>0&&tramoLateral<2*largo?{proporcion,corte,fin}:null;
 });
 if(lados.some(lado=>!lado))return [];
 lados.sort((primero,segundo)=>primero.proporcion-segundo.proporcion);
 return [lados[0].corte,lados[0].fin,lados[1].fin,lados[1].corte];
}

// El techo largo aparece al lado del murete de la cancha de fútbol 7 en las vistas aéreas.
// Las vistas 0072 y 0073 documentan los pórticos, las riostras y las dos escaleras.
export function construirGradasDeportivas({THREE, world, box, X, Z}) {
 const group=new THREE.Group();
 group.name='Gradas_deportivas_Q';
 group.userData={approximate:true,reference:'Esri 2018–2025; corpus AZC 0072 y 0073'};
 const [[x0,z0],[x1,z1]]=ejeGradas;
 const dx=X(x1)-X(x0),dz=Z(z1)-Z(z0);
 // La grada mira al césped. Sus escaleras posteriores bajan hacia el andador.
 const giro=Math.atan2(dx,dz)+Math.PI;
 group.rotation.y=giro;
 group.position.set(X((x0+x1)/2)-.81*Math.cos(giro),0,Z((z0+z1)/2)+.81*Math.sin(giro));
 group.scale.z=Math.hypot(dx,dz)/15.03;
 world.add(group);

 const white='#e7ebe7',treads='#aeb5b5',deck='#c9cdcb',roof='#9da4a5';
 const frames=[-7.15,-3.58,0,3.58,7.15];
 const deckY=1.91,near=-.69,far=1.97;
 const vertical=new THREE.Vector3(0,1,0);
 function bar(name,from,to,width=.058,color=white) {
  const start=new THREE.Vector3(...from),end=new THREE.Vector3(...to);
  const step=end.sub(start),length=step.length();
  const center=start.addScaledVector(step,.5);
  const mesh=box(group,name,center.x,center.y,center.z,width,length,width,color);
  mesh.quaternion.setFromUnitVectors(vertical,step.divideScalar(length));
  mesh.castShadow=true;
  return mesh;
 }

 // La planta baja queda abierta bajo la plataforma.
 for(const z of frames){
  for(const x of [near,far]){
   const height=x===near?4.76:5.00;
   const y1=z===0&&x===far?deckY:height;
   bar('Columna_gradas_canchas',[x,.14,z],[x,y1,z],.095);
  }
  bar('Travesaño_gradas_deportivas',[near,1.78,z],[far,1.78,z],.11);
  bar('Viga_inclinada_cubierta_gradas',[near,4.76,z],[far,5,z],.11);
 }
 for(let i=1;i<frames.length;i++){
  const start=frames[i-1]+.07,end=frames[i]-.07;
  for(const [from,to] of [[start,end],[end,start]]){
   bar('Riostra_X_inferior_gradas',[far,.21,from],[far,1.78,to]);
   if(i===1||i===4)bar('Riostra_X_superior_gradas',[far,1.88,from],[far,4.91,to]);
  }
 }
 for(const x of [near,far]){
  bar('Larguero_de_plataforma_gradas',[x,1.75,-7.24],[x,1.75,7.24],.11);
  bar('Larguero_de_cubierta_gradas',[x,x===near?4.78:5.02,-7.37],[x,x===near?4.78:5.02,7.37],.1);
 }

 box(group,'Plataforma_elevada_gradas',.62,deckY-.085,0,2.76,.17,14.53,deck);
 for(let row=0;row<6;row++){
  const x=-.39+row*.356,y=2.17+row*.236;
  for(const z of [-4.09,4.09]){
   const plank=box(group,'Gradas_cubiertas_canchas',x,y,z,.29,.09,6.32,treads);
   plank.castShadow=true;
   box(group,'Carril_asiento_gradas',x,y-.08,z,.14,.08,6.32,white);
  }
 }
 for(const z of [-7.22,7.22]){
  bar('Arriostre_lateral_gradas',[near,1.16,z],[far,2.86,z],.073);
  bar('Barandal_lateral_gradas',[near,2.93,z],[far,4.08,z],.064);
 }
 // Corredor central con descansillo y dos tramos visibles desde atrás.
 box(group,'Descanso_central_gradas',2.46,deckY-.071,0,.97,.142,1.69,deck);
 for(const side of [-1,1]){
  const top=side*.84,bottom=side*4.36;
  const start=.22,rise=deckY-start;
  const count=11,depth=Math.abs(bottom-top)/count;
  for(let i=0;i<count;i++){
   const y=start+rise*(i+1)/count;
   const z=bottom-side*depth*(i+.5);
   const tread=box(group,'Escalera_gradas_canchas',2.59,y-.039,z,.9,.078,depth*1.05,treads);
   tread.castShadow=true;
  }
  for(const x of [2.127,3.053]){
   bar('Zanca_blanca_gradas',[x,start-.04,bottom],[x,deckY-.10,top],.085);
   for(const rail of [.38,.76])bar('Pasamanos_inclinado_gradas',[x,start+rail,bottom],[x,deckY+rail,top],.05);
   for(let i=0;i<6;i++){
    const t=i/5,y=start+rise*t,z=bottom+(top-bottom)*t;
    bar('Montante_barandal_gradas',[x,y,z],[x,y+.76,z],.047);
   }
  }
 }
 for(const [a,b] of [[-7.22,-.84],[.84,7.22]]){
  for(const y of [deckY+.4,deckY+.79])bar('Barandal_posterior_gradas',[1.965,y,a],[1.965,y,b],.058);
 }

 // Lámina a una sola pendiente. Los nervios se leen también a poca distancia.
 const slope=.085;
 const canopy=box(group,'Cubierta_gradas_canchas',.81,4.928,0,3.5,.105,15.03,roof);
 canopy.rotation.z=slope;canopy.castShadow=true;
 for(let i=0;i<23;i++){
  const z=-7.41+i*.674;
  const rib=box(group,'Nervio_lamina_gradas',.81,4.988,z,3.48,.035,.036,'#b6bcbb');
  rib.rotation.z=slope;
 }
}

// Aleph 364, p. 13: frente de Q desde el campo el 22 de abril de 2024.
export function construirFachadaQ({THREE,part,w,d,h,box,material}) {
 const grupo=new THREE.Group();
 grupo.name='Q_fachada_hacia_el_campo_natural';
 grupo.userData={approximate:true,reference:'Aleph 364, p. 13 (abril de 2024); corpus UAM-A 0075 y 0096',
  orientation:'Hacia el campo natural',access:'Se distinguen varios vanos; puerta específica de pesas pendiente'};
 part.add(grupo);

 const frente=-w/2,fondo=d/2,base=.30,fascia=.96;
 const remateCubierta=.36,division=-fondo+d*.345;
 const rojo='#a94a47',gris='#7c858b',blanco='#cfd2c9';
 const desdeIzquierda=fraccion=>-fondo+fraccion*d;
 box(grupo,'Q_cuerpo_bajo',.24,(h-remateCubierta)/2,0,w-.48,h-remateCubierta,d,gris);
 box(grupo,'Q_muro_gris_campo',frente+.22,(h-remateCubierta)/2,0,.55,h-remateCubierta,d,gris);
 box(grupo,'Q_azotea_verde',0,h-.05,0,w,.16,d,'#65735e');
 detallarAzoteaQ({THREE,grupo,w,d,techo:h+.03,box,material});
 box(grupo,'Q_fascia_roja_campo',frente-.085,h-fascia/2,(division+fondo)/2,.26,fascia,fondo-division+.08,rojo);
 box(grupo,'Q_fascia_sobre_marquesina',frente-.065,h-remateCubierta/2,(-fondo+division)/2,.22,remateCubierta,division+fondo,rojo);
 box(grupo,'Q_fascia_roja_Ferrocarriles',w/2-.02,h-fascia/2,0,.19,fascia,d+.13,'#9a4141');
 box(grupo,'Q_remate_terracota',0,h-remateCubierta/2,-fondo,w,remateCubierta,.16,rojo);
 box(grupo,'Q_remate_terracota',0,h-fascia/2,fondo,w,fascia,.16,rojo);

 // Vanos visibles en la toma de 2024, sin asignar los servicios a sus puertas.
 const perfil='#b4b8b5';
 for(const [fraccion,ancho,alto,color] of [
  [.073,d*.024,1.94,'#676e72'],
  [.121,d*.049,1.88,'#6e7e86'],
  [.259,d*.025,1.91,'#606a6e'],
  [.369,d*.023,1.94,'#8a4c48'],
  [.476,d*.028,1.97,'#747e80'],
 ]){
  const z=desdeIzquierda(fraccion);
  box(grupo,'Q_vano_en_fachada',frente-.080,base+alto/2,z,.075,alto+.075,ancho+.075,perfil);
  box(grupo,'Q_hoja_de_vano',frente-.126,base+alto/2,z,.034,alto,ancho,color);
  box(grupo,'Q_travesaño_de_vano',frente-.151,base+alto*.66,z,.037,.064,ancho,perfil);
 }
 for(const fraccion of [.105,.121,.137])
  box(grupo,'Q_montante_porton_bajo_marquesina',frente-.153,base+.94,desdeIzquierda(fraccion),.041,1.88,.055,'#4c5c64');

 // Las franjas oscuras bajo la cubierta son angostas. El resto del frente se lee como muro.
 const largoMarquesina=d*.342,centroMarquesina=-fondo+largoMarquesina/2+.09;
 for(let i=0;i<6;i++){
  const ancho=largoMarquesina/6;
  box(grupo,'Q_banda_alta_bajo_marquesina',frente-.057,2.44,centroMarquesina-largoMarquesina/2+(i+.5)*ancho,.039,.30,ancho-.23,'#626d72');
 }

 const centroCancel=desdeIzquierda(.703),anchoCancel=d*.123,altoCancel=h-fascia-base-.075;
 const cristal='#4d5d62';
 box(grupo,'Q_cancel_principal_vidrio',frente-.100,base+altoCancel/2,centroCancel,.082,altoCancel,anchoCancel,cristal);
 for(const posicion of [-.5,-.38,-.28,-.15,.15,.28,.38,.5]){
  box(grupo,'Q_montante_blanco_cancel_principal',frente-.157,base+altoCancel/2,centroCancel+anchoCancel*posicion,.069,altoCancel+.065,.085,blanco);
 }
 for(const f of [0,.25,.5,.75,1]){
  const y=base+altoCancel*f;
  if(f===0||f===1)box(grupo,'Q_marco_blanco_cancel_principal',frente-.158,y,centroCancel,.069,.071,anchoCancel+.079,blanco);
  else{
   for(const lado of [-1,1])
    box(grupo,'Q_reticula_blanca_cancel_principal',frente-.158,y,centroCancel+lado*anchoCancel*.325,.069,.054,anchoCancel*.35,blanco);
  }
 }
 const ventana=desdeIzquierda(.811),anchoVentana=d*.033;
 box(grupo,'Q_marco_ventanuco',frente-.095,1.77,ventana,.089,.76,anchoVentana,perfil);
 box(grupo,'Q_vidrio_ventanuco',frente-.149,1.77,ventana,.031,.64,anchoVentana-.12,'#666e72');
 box(grupo,'Q_andador_junto_al_campo',frente-.65,.274,0,1.30,.077,d,'#aaa694');

 // Perfil continuo de la marquesina curva y nervios estrechos sobre el tramo izquierdo.
 const vuelo=1.78,alturaMarquesina=h-.39,caida=.43,grosor=.06;
 const perfilMarquesina=new THREE.Shape();
 perfilMarquesina.moveTo(frente,alturaMarquesina);
 perfilMarquesina.quadraticCurveTo(frente-vuelo*.98,alturaMarquesina,frente-vuelo,alturaMarquesina-caida);
 perfilMarquesina.lineTo(frente-vuelo+.06,alturaMarquesina-caida);
 perfilMarquesina.quadraticCurveTo(frente-vuelo*.96,alturaMarquesina-grosor,frente,alturaMarquesina-grosor);
 perfilMarquesina.closePath();
 const inicioMarquesina=centroMarquesina-largoMarquesina/2;
 const cubierta=new THREE.Mesh(
  new THREE.ExtrudeGeometry(perfilMarquesina,{depth:largoMarquesina,bevelEnabled:false,curveSegments:8}),
  new THREE.MeshStandardMaterial({color:'#d8dbda',transparent:true,opacity:.72,depthWrite:false,roughness:.68}));
 cubierta.name='Q_marquesina_translucida';
 cubierta.position.z=inicioMarquesina;
 cubierta.userData.disposeMaterial=true;grupo.add(cubierta);
 const perfilNervio=new THREE.ExtrudeGeometry(perfilMarquesina,{depth:.045,bevelEnabled:false,curveSegments:8});
 const pasoNervio=.74;
 for(let z=inicioMarquesina+.06;z<inicioMarquesina+largoMarquesina-.055;z+=pasoNervio){
  const nervio=new THREE.Mesh(perfilNervio,material('#abb0ac'));
  nervio.name='Q_nervio_marquesina';
  nervio.position.z=z;
  grupo.add(nervio);
 }
 box(grupo,'Q_larguero_frontal_marquesina',frente-vuelo+.028,alturaMarquesina-caida,centroMarquesina,.102,.079,largoMarquesina,'#a8abaa');

 const letra=new THREE.Shape();
 letra.absellipse(0,.09,.355,.355,0,Math.PI*2,false,0);
 const hueco=new THREE.Path();
 hueco.absellipse(0,.09,.227,.230,0,Math.PI*2,true,0);
 letra.holes.push(hueco);
 const grupoRotulo=new THREE.Group();grupoRotulo.name='Q_rotulo_rojo_identificado';grupo.add(grupoRotulo);
 grupoRotulo.position.set(frente-.236,h-fascia*.52,desdeIzquierda(.941));
 grupoRotulo.rotation.y=-Math.PI/2;
 const anillo=new THREE.Mesh(new THREE.ExtrudeGeometry(letra,{depth:.07,bevelEnabled:false,curveSegments:10}),material('#8e3131'));
 grupoRotulo.add(anillo);
 box(grupoRotulo,'Q_asta_del_rotulo',.274,-.28,.034,.142,.51,.071,'#8e3131');

 // En el panorama desde Ferrocarriles se ve la franja alta por encima de la reja perimetral.
 const dintel=h-.84;
 box(grupo,'Q_vano_alto_hacia_Ferrocarriles',w/2-.014,dintel*.69,-d*.06,.115,.63,d*.45,'#565c55');
 for(const z of [-.276,-.152,-.031,.093,.16])
  box(grupo,'Q_montante_de_fachada_posterior',w/2+.057,dintel*.69,z*d,.046,.68,.075,'#8e524b');
}

// Aleph (17 de octubre de 2016) muestra tres unidades delante y dos detrás.
function detallarAzoteaQ({THREE,grupo,w,d,techo,box,material}) {
 const solar=new THREE.Group();
 solar.name='Q_colectores_solares_de_vestidores';
 solar.userData={approximate:true,reference:'Aleph UAM, 2016-10-17; ortofoto Esri',systems:5};
 solar.position.y=techo;
 grupo.add(solar);

 const acero='#a0a8a2',cromo='#b9bfb7';
 const tanqueGeometria=new THREE.CylinderGeometry(.23,.23,1.76,14);
 const tuboGeometria=new THREE.CylinderGeometry(.040,.040,Math.hypot(1.86,.70),8);
 const tanqueMaterial=material(cromo),tuboAzul=material('#36516b'),tuboClaro=material('#536b84');
 const xCentro=-w*.25, zFrente=d*.245, zFondo=zFrente+3.15;
 const ubicaciones=[
  [xCentro-1.83,zFrente],[xCentro,zFrente],[xCentro+1.83,zFrente],
  [xCentro-.92,zFondo],[xCentro+.92,zFondo]
 ];
 for(const [x,z] of ubicaciones){
  const unidad=new THREE.Group();
  unidad.name='Q_calentador_solar';
  unidad.position.set(x,0,z);
  solar.add(unidad);
  const tanque=new THREE.Mesh(tanqueGeometria,tanqueMaterial);
  tanque.name='Q_tanque_horizontal';
  tanque.rotation.z=Math.PI/2;
  tanque.position.set(0,1.10,.80);
  unidad.add(tanque);
  for(let i=0;i<15;i++){
   const tubo=new THREE.Mesh(tuboGeometria,i%3===0?tuboClaro:tuboAzul);
   tubo.name='Q_tubo_colector';
   tubo.position.set((i-7)*.104,.59,-.13);
   tubo.rotation.x=Math.PI/2-Math.atan2(.70,1.86);
   unidad.add(tubo);
  }
  for(const lateral of [-.81,.81]){
   box(unidad,'Q_apoyo_del_bastidor',lateral,.065,-.13,.12,.13,2.02,acero);
   box(unidad,'Q_paral_del_bastidor',lateral,.52,.79,.068,1.04,.072,acero);
   box(unidad,'Q_marco_inclinado_del_colector',lateral,.59,-.13,.071,.073,2.02,cromo)
    .rotation.x=-Math.atan2(.70,1.86);
  }
  box(unidad,'Q_remate_inferior_solar',0,.24,-1.065,1.75,.105,.085,cromo);
 }
 for(const [y,color] of [[.092,'#526f81'],[.156,'#894f45']]){
  box(solar,'Q_linea_de_agua',xCentro,y,zFrente+.95,5.72,.055,.052,color);
  box(solar,'Q_linea_de_agua_entre_filas',xCentro+2.85,y,(zFrente+zFondo)/2+.95,.06,.052,3.20,color);
  box(solar,'Q_linea_de_agua_fila_posterior',xCentro+.48,y,zFondo+.95,4.73,.055,.052,color);
 }
 for(const z of [d*.146,d*.192]){
  box(solar,'Q_zocalo_de_tragaluz',-w*.14,.10,z,1.12,.20,1.22,'#a8a99b');
  box(solar,'Q_tragaluz_de_azotea',-w*.14,.22,z,1.14,.07,1.24,'#cfdbcf');
  box(solar,'Q_travesano_de_tragaluz',-w*.14,.266,z,.045,.022,1.24,'#777f75');
 }
}

// Límites estimados tras proyectar la imagen aérea al croquis existente.
export const superficiesDeportivas={campo:[1453,467,1572,684],basquet:[1462,398,1576,460],futbol7:[1589,602,1671,724]};

// El plano de Protección Civil de 2026 dibuja la franja alrededor del campo.
export function construirAndadorMulticanchas({THREE,world,meshPoly,line,X,Z}) {
 const andador=new THREE.Group();
 andador.name='Andador_multicanchas_hacia_Q';
 andador.userData={approximate:true,reference:'Plano de Protección Civil UAM-A de 2026; ortofoto Esri y corpus 0096'};
 world.add(andador);
 // La vuelta enlaza el lado de 3P con la franja entre las canchas y el campo.
 // Al llegar a Q se une al pavimento que ya acompaña su fachada.
 meshPoly(andador,[
  [1437,416],[1443,416],[1443,461],[1577,461],[1577,494.6],[1572.4,494.6],
  [1572.4,466.4],[1443,466.4],[1443,591],[1437,591]
 ],.315,'#c5c2b6','Pavimento_del_andador_deportivo');
 const borde=[[1462,460.27],[1576,460.27]].map(([x,z])=>[X(x),Z(z)]);
 line(andador,borde,'#9d9e91',.22,.317);
}

// Guías visuales del acabado: CGA AZC (infraestructura) y corpus 0074, 0075, 0096.
export function construirCanchasDeportivas({THREE, world, box, slab, meshPoly, line, X, Z, S}) {
 const group=new THREE.Group();
 group.name='Canchas_deportivas_AZC';
 group.userData={approximate:true,reference:'Imagen aérea contrastada con georreferencia; fotografías CGA AZC y corpus 0074, 0075, 0096'};
 world.add(group);
 const {campo:field,basquet:hardCourt}=superficiesDeportivas;
 const warm='#aa996c',faded='#d6ccb0',white='#e5e8de',terracotta='#a75b4d';
 const point=(x,z)=>[X(x),Z(z)];
 const trace=(points,color,width=.23,height=.411)=>line(group,points.map(([x,z])=>point(x,z)),color,width,height);
 const rim=(r,n=0)=>[[r[0]+n,r[1]+n],[r[2]-n,r[1]+n],[r[2]-n,r[3]-n],[r[0]+n,r[3]-n],[r[0]+n,r[1]+n]];
 const itsUp=new THREE.Vector3(0,1,0);
 function beam(name,from,to,width=.068,color=white,parent=group){
  const a=new THREE.Vector3(...from),delta=new THREE.Vector3(...to).sub(a),length=delta.length();
  const mid=a.addScaledVector(delta,.5);
  const o=box(parent,name,mid.x,mid.y,mid.z,width,length,width,color);
  o.quaternion.setFromUnitVectors(itsUp,delta.divideScalar(length));
  return o;
 }
 function circle(cx,cz,radius,color,width=.23,height=.411){
  const points=Array.from({length:41},(_,i)=>{
   const angle=i*Math.PI/20;return [cx+Math.cos(angle)*radius,cz+Math.sin(angle)*radius];
  });
  trace(points,color,width,height);
 }
 function goal(x,z,side,width,height,base,parent=group){
  const half=width/2,back=z+side*.94;
  const frame=(name,a,b,thickness)=>beam(name,a,b,thickness,white,parent);
  for(const h of [-half,half]){
   frame('Poste_portería', [x+h,base,z],[x+h,base+height,z],.085);
   frame('Soporte_trasero_portería',[x+h,base+height,z],[x+h,base+.05,back],.064);
   frame('Base_tubular_portería',[x+h,base+.055,z],[x+h,base+.055,back],.053);
  }
  frame('Travesaño_portería',[x-half,base+height,z],[x+half,base+height,z],.08);
  frame('Base_trasera_portería',[x-half,base+.052,back],[x+half,base+.052,back],.052);
 }

 // El terreno grande es natural y muestra áreas de suelo expuesto en la vista aérea.
 slab(group,field,warm,.21,.3,'Campo_futbol');
 for(const [color,points] of [
  ['#84915e',[[1453,467],[1572,467],[1572,684],[1550,684],[1552,640],[1562,577],[1557,519],[1560,481],[1453,482]]],
  ['#9f8d68',[[1462,511],[1491,494],[1510,509],[1502,556],[1460,574],[1457,537]]],
  ['#a59165',[[1519,578],[1528,562],[1545,565],[1556,591],[1534,613],[1510,608]]],
  ['#b5a375',[[1461,625],[1491,613],[1501,630],[1489,676],[1458,678]]],
 ])meshPoly(group,points,.364,color,'Variación_de_césped_natural');
 const [fx0,fz0,fx1,fz1]=field,cx=(fx0+fx1)/2,cz=(fz0+fz1)/2;
 trace(rim(field,5),faded,.24,.406);
 trace([[fx0+5,cz],[fx1-5,cz]],faded,.24,.406);
 circle(cx,cz,14,faded,.22,.406);
 for(const [z,side] of [[fz0+5,-1],[fz1-5,1]]){
  trace([[cx-19,z],[cx-19,z-side*16],[cx+19,z-side*16],[cx+19,z]],faded,.23,.406);
  goal(X(cx),Z(z),side,6.4,2.08,.36);
 }

 // Paño de baloncesto visible en la vista aérea, con zonas cabeceras en terracota.
 slab(group,hardCourt,terracotta,.21,.25,'Cancha_borde_terracota');
 const boards=new THREE.MeshStandardMaterial({color:'#c6ddd9',transparent:true,opacity:.56,depthWrite:false,roughness:.32});
 let shareBoards=false;
 function basket(cx,cz,side){
  const x=X(cx),z=Z(cz),back=z+side*1.09,ground=.354,y=3.30,hoopY=3.06;
  for(const offset of [-.63,.63]){
   const leg=x+offset;
   beam('Soporte_blanco_canasta',[leg,ground,back],[leg,y,back],.075);
   beam('Brazo_superior_canasta',[leg,y,back],[leg,y,z]);
   beam('Riostra_blanca_canasta',[leg,1.04,back],[leg,2.46,z]);
  }
  beam('Travesaño_blanco_canasta',[x-.63,2.48,z],[x+.63,2.48,z]);
  const board=box(group,'Tablero_basquet_cancha',x,3.37,z,1.37,.83,.065,'#bdd2ce');
  board.material=boards;
  if(!shareBoards){board.userData.disposeMaterial=true;shareBoards=true;}
  for(const offset of [-.67,.67])beam('Marco_tablero_canasta',[x+offset,2.96,z],[x+offset,3.78,z],.047);
  for(const h of [2.96,3.78])beam('Marco_tablero_canasta',[x-.67,h,z],[x+.67,h,z],.047);
  const basketRim=new THREE.Mesh(new THREE.TorusGeometry(.235,.025,6,24),new THREE.MeshStandardMaterial({color:'#bc3d33',roughness:.77}));
  basketRim.name='Aro_rojo_canasta';
  basketRim.userData.disposeMaterial=true;
  basketRim.rotation.x=-Math.PI/2;
  basketRim.position.set(x,hoopY,z-side*.29);
  group.add(basketRim);
 }
 for(const [x0,x1] of franjasMulticanchasPoniente){
  const surface=[x0,401,x1,457],mid=(x0+x1)/2;
  slab(group,surface,'#5096a9',.344,.02,'Paño_celeste_baloncesto');
  trace(rim(surface,1.4),white,.22,.393);
  trace([[x0+1.4,429],[x1-1.4,429]],white,.19,.393);
  for(const [z,side] of [[403,-1],[455,1]]){
   const paint=[[mid-10,z]];
   for(let i=0;i<=12;i++){
    const angle=Math.PI*i/12;
    paint.push([mid+Math.cos(angle)*10,z-side*Math.sin(angle)*12]);
   }
   meshPoly(group,paint.slice(1),.356,terracotta,'Zona_de_tiro_terracota');
   trace(paint,white,.21,.393);
   basket(mid,z,side);
  }
 }

 // Fútbol 7: recinto oblicuo junto al terreno grande, con pasto sintético y muretes.
 const cancha=new THREE.Group();
 cancha.name='Recinto_oblicuo_futbol_7';
 cancha.userData={approximate:true,reference:'CGA UAM y Esri 2022–2025'};
 cancha.position.set(X(futbol7.centro[0]),0,Z(futbol7.centro[1]));
 cancha.rotation.y=futbol7.giro;
 group.add(cancha);
 const ancho=futbol7.ancho*S(),largo=futbol7.largo*S(),xBorde=ancho/2,zBorde=largo/2;
 box(cancha,'Cancha_futbol_7_sintetica',0,.214,0,ancho,.278,largo,'#3d6152');
 const pintar=(points,width=.22)=>line(cancha,points,white,width,.391);
 pintar(rim([-xBorde,-zBorde,xBorde,zBorde],1.33));
 pintar([[-xBorde+1.33,0],[xBorde-1.33,0]]);
 pintar(Array.from({length:41},(_,i)=>{
  const angle=i*Math.PI/20;
  return [3.86*Math.cos(angle),3.86*Math.sin(angle)];
 }));
 for(const lado of [-1,1])goal(0,lado*(zBorde-1.77),lado,3.9,1.78,.353,cancha);
 for(const x of [-xBorde,xBorde]){
  box(cancha,'Murete_blanco_cancha_7',x,.7,0,.19,.76,largo,'#deded4');
  for(let i=0;i<=6;i++){
   const z=-zBorde+largo*i/6;
   beam('Poste_malla_cancha_7',[x,1.08,z],[x,3.44,z],.071,'#a8b2ac',cancha);
  }
  beam('Tensor_superior_cancha_7',[x,3.38,-zBorde],[x,3.38,zBorde],.026,'#a5aea5',cancha);
 }
 for(const z of [-zBorde,zBorde])box(cancha,'Murete_cabecera_cancha_7',0,.7,z,ancho,.76,.19,'#deded4');
 box(cancha,'Paño_cabecera_escalonada',0,1.38,-zBorde,13.3,1.42,.21,'#deded4');
 box(cancha,'Paño_piedra_cancha_7',0,.91,-zBorde+.121,3.8,1.12,.058,'#a09c87');
 const panelWidth=1.8;
 for(const side of [-1,1])box(cancha,'Tablero_intermedio_cabecera',side*(6.65+panelWidth/2),1.09,-zBorde,panelWidth,.85,.21,'#deded4');
}

// Acabado del andador lateral de la cancha documentado en el corpus 0075 y 0076.
export function detallarAccesoDeportivo({THREE, world, slab, meshPoly}) {
 const group=new THREE.Group();
 group.name='Andador_lateral_deportes';
 group.userData={approximate:true,reference:'Adoquín y guarnición: corpus AZC, imagen_0075 e imagen_0076'};
 world.add(group);
 slab(group,[1436.7,455,1443.3,668],'#8e8d7b',.18,.15,'Base_andador_deportivo');
 for(const x of [1436.7,1442.75])slab(group,[x,455,x+.55,668],'#b8b6a8',.261,.044,'Guarnicion_andador_deportivo');
 const colors=['#8b8981','#969188','#918a80','#858980'];
 // El corpus 0076 muestra piezas rectangulares alternadas en toda la franja,
 // con un borde claro continuo. El acabado sólo cubre la huella ya dibujada.
 meshPoly(group,[[1437.3,455],[1442.7,455],[1442.7,668],[1437.3,668]],.319,
   '#716f67','Juntas_del_andador_deportivo');
 for (let fila=0; fila<64; fila++) {
   const inicio = 455 + fila * 213 / 64;
   const fin = 455 + (fila + 1) * 213 / 64 - .10;
   const separacion = fila % 2 ? 1439.05 : 1440.95;
   for (const [columna, [x0,x1]] of [[1437.3,separacion-.05],[separacion+.05,1442.7]].entries()) {
     meshPoly(group,[[x0,inicio],[x1,inicio],[x1,fin],[x0,fin]],.322,
       colors[(fila * 3 + columna) % colors.length],'Loseta_rectangular_andador_deportivo');
   }
 }
 for (const x of [1436.7,1442.75]) {
   meshPoly(group,[[x,455],[x+.55,455],[x+.55,668],[x,668]],.323,
     '#c3beb0','Canto_claro_continuo_andador_deportivo');
 }
}
