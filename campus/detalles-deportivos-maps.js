import {franjasMulticanchasPoniente} from 'sector-talleres-deportes';

// Contorno aproximado de la cancha encajada entre el andador y Ferrocarriles.
// Los puntos vienen de las tomas Esri de 2022–2025 registradas al croquis.
const futbol7 = {centro: [1629.25, 662.5], ancho: 45.7, largo: 109.8, giro: .329};
const ejeGradas = [[1595, 648], [1609, 688.5]];

export function perimetroCruzaFutbol7(px, pz) {
 const [cx,cz]=futbol7.centro,cos=Math.cos(futbol7.giro),sin=Math.sin(futbol7.giro);
 const dx=px-cx,dz=pz-cz;
 return Math.abs(dx*cos-dz*sin)<futbol7.ancho/2+4 && Math.abs(dx*sin+dz*cos)<futbol7.largo/2+4;
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

// Límites estimados tras proyectar la imagen aérea al croquis existente.
export const superficiesDeportivas={campo:[1453,467,1572,684],basquet:[1462,398,1576,460],futbol7:[1589,602,1671,724]};

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
export function detallarAccesoDeportivo({THREE, world, slab}) {
 const group=new THREE.Group();
 group.name='Andador_lateral_deportes';
 group.userData={approximate:true,reference:'Adoquín y guarnición: corpus AZC, imagen_0075 e imagen_0076'};
 world.add(group);
 slab(group,[1436.7,455,1443.3,668],'#8e8d7b',.18,.15,'Base_andador_deportivo');
 for(const x of [1436.7,1442.75])slab(group,[x,455,x+.55,668],'#b8b6a8',.261,.044,'Guarnicion_andador_deportivo');
 const colors=['#827f74','#8e8878','#8a7b72','#7e8475'];
 for(let i=0;i<39;i++){
  const start=457+i*5.34,end=Math.min(start+5.20,666);
  slab(group,[1437.3,start,1442.7,end],colors[(i*13+Math.floor(i/4))%colors.length],.259,.025,'Adoquin_andador_deportivo');
 }
 slab(group,[1437.3,455,1442.7,456.98],'#b7b2a1',.258,.027,'Empalme_concreto_andador_deportivo');
}
