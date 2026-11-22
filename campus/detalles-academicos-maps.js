// Las fachadas se anclan a los volúmenes existentes. Las cotas son esquemáticas.
// H: corpus de alumnos, imagen_0150 e imagen_0155, desde el patio de la cafetería.
// HO: imagen_0005, imagen_0006 e imagen_0007, frente curvo y vestíbulo.

// Edificio L, levantamiento de talleres CyAD (pp. 68–69) y vista aérea registrada.
export function construirCubiertaL({THREE,part,w,d,h,box,material}) {
 const group = new THREE.Group();
 group.name = 'L_cubierta_diente_de_sierra';
 group.userData = {approximate:true,reference:'Levantamiento fotográfico UNAM, pp. 68–69; vista aérea Esri'};
 part.add(group);
 const cantidad = 16;
 const margen = .6, paso = (d-2*margen)/cantidad;
 const ancho = w*.70, ejeX = w*.084, alto = 1.10, base = h+.4;
 const claro = paso-.08;
 const forma = new THREE.Shape();
 forma.moveTo(-claro/2,0);
 forma.lineTo(claro/2,0);
 forma.lineTo(claro/2,alto);
 forma.closePath();
 const seccion = new THREE.ExtrudeGeometry(forma,{depth:ancho,bevelEnabled:false});
 seccion.translate(0,0,-ancho/2).rotateY(-Math.PI/2);
 for (let i=0;i<cantidad;i++) {
  const z = -d/2+margen+(i+.5)*paso;
  const faldon = new THREE.Mesh(seccion,material(i%4===1?'#a9574d':'#ad544a'));
  faldon.name = 'L_faldon_terracota_'+(i+1);
  faldon.position.set(ejeX,base,z);
  faldon.castShadow = true;
  faldon.receiveShadow = true;
  group.add(faldon);
  const frente = z+claro/2+.014;
  box(group,'L_lucernario_vertical',ejeX,base+alto*.46,frente,ancho-.42,alto*.75,.05,'#6c6661');
  box(group,'L_remate_de_acerado',ejeX,base+alto-.035,frente,ancho+.06,.091,.107,'#bd7866');
 }
}

// Tramo de Eje 5 visible en Street View de enero de 2025, frente a T.
// Sustituye el acabado de las piezas del límite existente.
export function construirBardaFrenteT({THREE,world,box,x,z,width,yaw,postes}) {
 const group=new THREE.Group();
 group.name='T_barda_de_piedra_y_reja_Eje_5';
 group.position.set(x,0,z);
 group.rotation.y=yaw;
 world.add(group);
 if(!postes){
  box(group,'T_pano_piedra_perimetral',0,.94,0,width,1.68,.45,'#54504a');
  for(let row=0;row<4;row++){
   const y=.32+row*.4;
   box(group,'T_junta_horizontal_piedra',0,y,.229,width,.024,.012,'#716b62');
   for(let i=1;i<5;i++){
    const x=width*((i+row%2*.46)/5-.5);
    box(group,'T_junta_vertical_piedra',x,y+.2,.229,.027,.39,.012,'#716b62');
   }
  }
  return;
 }
 box(group,'T_zocalo_bajo_reja',0,.24,0,width,.28,.37,'#5e554d');
 const count=Math.round(width/.21);
 for(let i=0;i<count;i++){
  const x=width*((i+.5)/count-.5);
  box(group,'T_barrote_rojo_Eje_5',x,1.08,0,.055,1.6,.055,'#9d4239');
  box(group,'T_remate_inclinado_Eje_5',x,1.93,.083,.048,.31,.042,'#9d4239').rotation.x=.55;
 }
 box(group,'T_travesano_alto_reja',0,1.77,0,width,.07,.065,'#8a3830');
}

export function detallarFachadaH({part,b,w,d,idx,box,data}) {
 if(b.id!=='H')return;
 if(idx===0){
  // La cara hacia Serpentina II se ve en la ficha de Maps de septiembre de 2024.
  const front=-d/2,span=Math.min(w*.34,18),alto=Math.min(2.52,data.storeyHeight*.8);
  for(const node of [...part.children]){
   if(node.position.z<0&&(node.name==='Ventana_nivel_0'||(node.name==='Montante'&&node.position.y===2)))part.remove(node);
  }
  box(part,'H_acceso_acristalado_hacia_Serpentina',0,.24+alto/2,front-.028,span,alto,.058,'#536260');
  const panes=10;
  for(let i=0;i<=panes;i++)box(part,'H_montante_Serpentina',(i/panes-.5)*span,.24+alto/2,front-.069,.085,alto,.064,'#c4c5b9');
  for(const y of [.26,.24+alto*.70,.24+alto])box(part,'H_travesano_Serpentina',0,y,front-.072,span,.064,.068,'#c4c5b9');
  for(const x of [-.31,.31])box(part,'H_tirador_de_acceso_Serpentina',x,1.08,front-.109,.034,.27,.05,'#d7d5ce');
  const fascia=.24+alto+.235;
  box(part,'H_banda_concreto_Serpentina',0,fascia,front-.035,span+2,.42,.12,'#aaa99e');
  return;
 }
 if(idx!==1||!b.galleryParts?.includes(idx))return;

 const floor=data.storeyHeight;
 const gallery=Math.min(2.8,d*.32),edge=d/2,back=edge-gallery;
 const span=w-.38,concrete='#bfc0b9',metal='#a4a9a3',glass='#3d4b4c';

 // Las bandas altas dan sombra a las ventanas corridas. El paso de PB queda abierto.
 for(let level=1;level<Math.min(3,b.floors);level++){
  const y=level*floor;
  box(part,'H_banda_concreto_volada_'+level,0,y+.33*floor,edge-.09,span,.63*floor,.16,concrete);
  box(part,'H_cinta_de_ventanas_'+level,0,y+.77*floor,edge-.28,span-.32,.23*floor,.075,glass);
  box(part,'H_carpinteria_horizontal_'+level,0,y+.7*floor,edge-.225,span-.32,.062,.054,metal);
 }

 const bays=Math.max(2,Math.round(span/4.5)),step=span/bays;
 // Los paños de PB se apoyan en el muro interior de la galería; se respetan los extremos.
 for(let bay=1;bay<bays-1;bay++){
  const x=(bay+.5)*step-span/2;
  box(part,'H_pano_acristalado_rehundido',x,1.39,back+.039,step-.14,1.62,.066,glass);
  box(part,'H_travesano_de_acceso',x,1.78,back+.083,step-.14,.052,.034,metal);
  box(part,'H_montante_de_acceso',x+step/2-.07,1.39,back+.085,.056,1.62,.046,metal);
 }
 // Recorrido en RV, 5:22–5:53: el primer piso mira al jardín por una cara abierta.
 // La cancelería con zócalo rojo está en el lado de las aulas, detrás del antepecho.
 if(b.floors>2){
  box(part,'H_zocalo_rojo_galeria_piso_1',0,floor+.44,back+.04,span,.88,.073,'#a93d3b');
  box(part,'H_cristal_galeria_piso_1',0,floor+1.69,back+.043,span,1.57,.077,'#536766');
  box(part,'H_travesano_galeria_piso_1',0,floor+1.93,back+.092,span,.053,.045,'#353e3c');
  for(let x=-span/2+.08;x<span/2;x+=1.45)box(part,'H_montante_galeria_piso_1',x,floor+1.28,back+.093,.049,2.56,.049,'#414947');
  for(let x=-span/2+2.5;x<span/2-1.7;x+=4.9)box(part,'H_luminaria_galeria_piso_1',x,2*floor-.323,back+gallery*.5,1.07,.036,.37,'#e9ede9');
 }
 box(part,'H_pavimento_rojo_de_galeria',0,.356,edge-gallery*.33,span,.018,gallery*.58,'#995f54');
}

export function detallarVestibuloHO({THREE,part,b,w,d,h,box,material,data}) {
 if(b.id!=='HO')return;
 const core=part.children.find(node=>node.name==='Núcleo del pabellón');
 if(!core)return;

 // Se retranquea la planta baja de la cara recta. La caja alta conserva su huella.
 const soffit=Math.min(data.storeyHeight,h*.82);
 const front=-d*.46,recess=Math.min(1.74,d*.13),back=front+recess;
 const width=w*.88,depth=d*.62,center=-d*.15;
 core.position.y=(h+soffit)/2;
 core.scale.y=h-soffit;
 box(part,'HO_nucleo_PB_retranqueado',0,soffit/2,center+recess/2,width,soffit,depth-recess,'#b8b7ad');
 box(part,'HO_pavimento_vestibulo',0,.351,(front+back)/2,width,.024,recess,'#bbb5a8');

 // Las juntas rojizas, el aluminio y las luminarias están visibles en imagen_0007.
 const panelWidth=width*.67;
 const glassHeight=Math.min(2.15,soffit*.78),glassY=.33+glassHeight/2;
 box(part,'HO_acristalamiento_vestibulo',0,glassY,back-.034,panelWidth,glassHeight,.062,'#3d4a4e');
 box(part,'HO_travesano_vestibulo',0,glassY+glassHeight*.23,back-.077,panelWidth,.05,.04,'#b4b6ac');
 for(let i=0;i<=4;i++){
  const x=(i/4-.5)*panelWidth;
  box(part,'HO_montante_vestibulo',x,glassY,back-.078,.054,glassHeight,.045,'#b4b6ac');
 }
 for(let i=1;i<=5;i++){
  const x=(i/6-.5)*width;
  box(part,'HO_junta_roja_en_pavimento',x,.365,(front+back)/2,.078,.008,recess,'#a77973');
 }
 box(part,'HO_junta_roja_transversal',0,.365,(front+back)/2,width,.008,.075,'#a77973');
 for(const shift of [-.27,0,.27]){
  box(part,'HO_luminaria_de_plafon',shift*width,soffit-.026,(front+back)/2,.69,.038,.29,'#e9efea');
 }

 // Las fotos del frente curvo muestran un remate terracota sobre la última galería.
 const lintel=Math.min(h*.2,.77);
 box(part,'HO_remate_terracota_superior',0,h-lintel*.45,d*.335,w*.9,lintel,.24,'#a94137');
 const lowerRim=new THREE.CylinderGeometry(w*.461,w*.461,.114,40,1,true,-Math.PI/2,Math.PI);
 for(let level=1;level<b.floors;level++){
  const rim=new THREE.Mesh(lowerRim,material('#6a6c66'));
  rim.name='HO_borde_inferior_curvo';
  rim.position.set(0,level*data.storeyHeight+.164,-d*.03);
  rim.scale.z=(d/w)*.72;
  rim.receiveShadow=true;
  part.add(rim);
 }
}
