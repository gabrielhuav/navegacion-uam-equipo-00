import * as THREE from 'three';

// Geometría propia de ESCOM. Niveles documentados; detalles de fachada interpretados de fotografías.
export function createEscomArchitecture({data,world,X,Z,box,material,meshPoly,line,label,tree,registerEditable}){
 const H=data.storeyHeight;
 function volume(parent,poly,y,h,color,name){
  const s=new THREE.Shape();poly.forEach((p,i)=>i?s.lineTo(X(p[0]),-Z(p[1])):s.moveTo(X(p[0]),-Z(p[1])));s.closePath();
  const m=new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:h,bevelEnabled:false}),material(color));m.rotation.x=-Math.PI/2;m.position.y=y;m.name=name;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
 }
 function renderBuilding(b,g){
  const h=b.floors*H,academic=['academic','government'].includes(b.detail);
  for(const [pi,p]of b.polygons.entries()){
   volume(g,p,.25,h,b.detail==='cafeteria'?'#8a383d':academic?'#687b7d':'#c9c8bd',b.id+'_cuerpo_'+pi);
   volume(g,p,h+.25,.18,b.roof,b.id+'_cubierta');
   const area=p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0),winding=Math.sign(area);
   for(let i=0;i<p.length;i++){
    const a=p[i],bq=p[(i+1)%p.length],dx=X(bq[0])-X(a[0]),dz=Z(bq[1])-Z(a[1]),len=Math.hypot(dx,dz);if(len<1)continue;
    const f=new THREE.Group();f.position.set((X(a[0])+X(bq[0]))/2,0,(Z(a[1])+Z(bq[1]))/2);f.rotation.y=Math.atan2(dx,dz)+(winding<0?Math.PI:0);f.name=b.id+'_fachada_'+pi+'_'+i;g.add(f);
    const bays=Math.max(1,Math.round(len/4.6)),bay=len/bays;
    for(let level=0;level<b.floors;level++){
     const y=.25+H*level;
     box(f,'Franja_horizontal_concreto',.17,y+.65,0,.4,1.3,len,'#deded4');
     box(f,'Losa_de_entrepiso',.28,y+H-.16,0,.7,.32,len,'#e9e7da');
     for(let j=0;j<bays;j++){
      const z=-len/2+(j+.5)*bay;
      box(f,'Ventanal_retranqueado',.24,y+2.2,z,.08,1.48,bay-.6,b.detail==='cafeteria'?'#aac0b0':'#354b53');
      for(const offset of [-.28,.28])box(f,'Parteluz_ventanal',.34,y+2.2,z+bay*offset,.07,1.48,.065,'#a4b0ab');
     }
    }
    for(let j=0;j<=bays;j++)box(f,'Columna_estructural',.36,h/2+.25,-len/2+j*bay,.55,h,.5,'#e4e3d7');
    box(f,'Pretil_continuo',.2,h+.38,0,.45,.36,len,'#d9d6c9');
   }
  }
  // Núcleo de escalera en la posición de referencia de cada plano; el cuerpo queda dentro de la huella.
  if(b.entry){const x=X(b.entry[0]),z=Z(b.entry[1]);
   const e=new THREE.Group();e.name='Entrada_'+b.id;e.position.set(x,0,z);e.rotation.y=data.campusYaw;g.add(e);
   box(e,'Puertas_de_acceso',0,1.45,0,3,2.4,.12,'#294c60');
   for(let floor=1;floor<b.floors;floor++){
    // Dos tramos pequeños esquemáticos, sin convertirlos en rutas accesibles verificadas.
    for(let k=0;k<10;k++)box(e,'Escalera_nivel_'+floor,-.9,.25+(floor-1)*H+(k+.5)*H/20,-k*.2,1.6,.18,.24,'#bcbfb5');
    for(let k=0;k<10;k++)box(e,'Retorno_escalera_nivel_'+floor,.9,.25+(floor-.5)*H+(k+.5)*H/20,-1.8+k*.2,1.6,.18,.24,'#bcbfb5');
    box(e,'Descanso_escalera',0,.25+(floor-.5)*H,-2.15,3.4,.15,.8,'#d4d3c7');
   }
  }
  if(b.id==='LAB'){
   const cfg=data.skylight;for(let i=0;i<8;i++){
    const t=(i+.5)/8,a=cfg.a,b=cfg.b,x=X(a[0]+(b[0]-a[0])*t),z=Z(a[1]+(b[1]-a[1])*t);
    const m=box(g,'Lucernario_Laboratorios',x,h+.6,z,12,.55,1.35,'#8aa9a7');m.rotation.y=data.campusYaw;
   }
  }
  if(b.id==='5'){
   // Dos núcleos de circulación documentados en extremos del plano de 2022.
   for(const p of data.liftCores){const m=box(g,'Nucleo_vertical_edificio_5',X(p[0]),h/2,Z(p[1]),3.2,h+1,3.2,'#c7c9c3');m.rotation.y=data.campusYaw;}
  }
 }
 function marker(m){
  const g=new THREE.Group();g.name='Hito_'+m.id;g.position.set(X(m.point[0]),0,Z(m.point[1]));world.add(g);registerEditable('landmark_'+m.id,m.name,'landmark',g);
  if(m.kind==='flag'){
   const mast=new THREE.Mesh(new THREE.CylinderGeometry(.06,.1,12,8),material('#c7ccce'));mast.position.y=6;g.add(mast);
   for(const [i,color]of ['#176b48','#eee9da','#bd353b'].entries())box(g,'Bandera_Mexico_'+i,.4+i*.7,10.8,0,.7,1.25,.055,color);
   box(g,'Base_asta',0,.2,0,.8,.4,.8,'#a9aaa0');
  }else{
   const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=192;const c=canvas.getContext('2d');c.fillStyle='#006699';c.fillRect(0,0,1024,192);c.textAlign='center';c.fillStyle='#fff';c.font='bold 112px sans-serif';c.fillText('ESCOM · IPN',512,128);
   const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(9,1.69),new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide}));mesh.position.y=2.9;mesh.rotation.y=data.campusYaw;mesh.userData.disposeMaterial=true;g.add(mesh);
   for(const x of [-3.7,3.7])box(g,'Poste_rotulo',x,1.4,0,.12,2.8,.12,'#707c7e');
  }
 }
 function studyArea(area){
  const p=area.polygon,xs=p.map(q=>X(q[0])),zs=p.map(q=>Z(q[1]));meshPoly(world,p,.28,'#c5b8a0','Área_de_estudio');
  for(let x=Math.min(...xs)+3;x<Math.max(...xs)-2;x+=5.5)for(let z=Math.min(...zs)+3;z<Math.max(...zs)-2;z+=5.5){
   if(!pointInsideRaw(x+895,z+390,p))continue;
   const g=new THREE.Group();g.name='Mesa_exterior';g.position.set(x,0,z);world.add(g);box(g,'Mesa',0,.8,0,1.6,.12,1.4,'#cbcbc0');box(g,'Pie',0,.4,0,.15,.8,.15,'#687a76');
   for(const dx of [-1.2,1.2])box(g,'Banca',dx,.48,0,.5,.15,1.7,'#b9bbb0');
   const roof=new THREE.Mesh(new THREE.ConeGeometry(1.7,.55,8),material('#858c7c'));roof.position.y=2.65;roof.name='Sombrilla_palapa';g.add(roof);box(g,'Mástil',0,1.4,0,.07,2.8,.07,'#737d77');
  }
 }
 function pointInsideRaw(x,z,p){let inside=false;for(let i=0,j=p.length-1;i<p.length;j=i++)if((p[i][1]>z)!=(p[j][1]>z)&&x<(p[j][0]-p[i][0])*(z-p[i][1])/(p[j][1]-p[i][1])+p[i][0])inside=!inside;return inside;}
 function environment(){
  for(const p of data.lawns)meshPoly(world,p,.29,'#83a768','Jardín');
  for(const p of data.explicitTrees)tree(...p,.85);
  for(const area of data.studyAreas)studyArea(area);
  for(const [i,p]of data.courts.entries()){
   meshPoly(world,p,.3,i<2?'#5b99ad':'#629376','Cancha_'+i);
   const pts=p.map(q=>[X(q[0]),Z(q[1])]);line(world,[...pts,pts[0]],'#ede7d0',.13,.34);
   const center=pts.reduce((s,p)=>[s[0]+p[0]/pts.length,s[1]+p[1]/pts.length],[0,0]);line(world,Array.from({length:33},(_,k)=>[center[0]+1.8*Math.cos(k*Math.PI/16),center[1]+1.8*Math.sin(k*Math.PI/16)]),'#ede7d0',.12,.34);
  }
  // Parking polygons follow their footprint, rather than a rotated bounding rectangle covering gardens.
  for(const p of data.parkingPolygons){
   const poly=p.polygon,sp=data.parkingStalls[p.id]||[],xs=poly.map(q=>X(q[0])),zs=poly.map(q=>Z(q[1])),cx=(Math.min(...xs)+Math.max(...xs))/2,cz=(Math.min(...zs)+Math.max(...zs))/2,g=new THREE.Group();g.position.set(cx,0,cz);g.name='Estacionamiento_'+p.id;world.add(g);
   const m=meshPoly(g,p.polygon,.23,'#858c83',p.id);m.geometry.translate(-cx,cz,0);
   // ShapeGeometry lies in local XY before -PI/2 rotation; translation above preserves world X/Z.
   for(const [a,b]of sp)line(g,[[X(a[0])-cx,Z(a[1])-cz],[X(b[0])-cx,Z(b[1])-cz]],'#ded1a1',.08,.27);
   registerEditable('parking_'+p.id,p.name,'parking',g,{width:Math.max(...xs)-Math.min(...xs),depth:Math.max(...zs)-Math.min(...zs)});
   label(p.name,cx,1,cz,'place');
  }
  for(const p of data.walkways)line(world,p.map(q=>[X(q[0]),Z(q[1])]),'#cfc2a8',2.4,.3);
  for(const b of data.bridges)for(const level of [1,2]){
   const a=[X(b.a[0]),Z(b.a[1])],p=[X(b.b[0]),Z(b.b[1])],dx=p[0]-a[0],dz=p[1]-a[1],len=Math.hypot(dx,dz),g=new THREE.Group();g.name='Puente_entre_edificios_P'+level;g.position.set((a[0]+p[0])/2,level*H+.2,(a[1]+p[1])/2);g.rotation.y=Math.atan2(dx,dz);world.add(g);
   box(g,'Losa_puente',0,0,0,b.width,.22,len,'#d6d5c8');for(const x of [-b.width/2,b.width/2])box(g,'Barandal_puente',x,.65,0,.09,1.1,len,'#707f7e');
  }
  for(const m of data.landmarks)marker(m);
  for(const gate of data.gates){const x=X(gate.point[0]),z=Z(gate.point[1]);box(world,'Acceso_'+gate.id,x,1.2,z,.2,2.4,3,'#265f73');label(gate.name,x,4,z,'pedestrian');}
  for(const a of data.benches){const g=new THREE.Group();g.name='Banca_explanada';g.position.set(X(a[0]),0,Z(a[1]));g.rotation.y=data.campusYaw;world.add(g);box(g,'Asiento',0,.5,0,2,.2,.55,'#c7c5b7');box(g,'Respaldo',0,.85,-.22,2,.65,.15,'#a7b4af');}
 }
 return {renderBuilding,environment};
}
