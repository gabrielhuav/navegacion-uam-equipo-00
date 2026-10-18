import * as THREE from 'three';

// Interpretación geométrica ligera. Fuentes y límites: INVESTIGACION.md.
export function createLermaArchitecture(ctx){
 const {data,world,X,Z,box,material,meshPoly,line,label,tree,registerEditable}=ctx;
 const H=data.storeyHeight;
 function volume(parent,poly,y,height,color,name){
  const shape=new THREE.Shape();poly.forEach((p,i)=>i?shape.lineTo(X(p[0]),-Z(p[1])):shape.moveTo(X(p[0]),-Z(p[1])));shape.closePath();
  const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false}),material(color));mesh.rotation.x=-Math.PI/2;mesh.position.y=y;mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
 }
 function clip(poly,bound,less){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=less?bound-a[1]:a[1]-bound,db=less?bound-b[1]:b[1]-bound;if(da>=0)out.push(a);if((da>=0)!==(db>=0)){const t=da/(da-db);out.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}}return out;}
 function facade(parent,poly,height,b,permanent){
  const winding=Math.sign(poly.reduce((s,p,i)=>{const q=poly[(i+1)%poly.length];return s+p[0]*q[1]-q[0]*p[1];},0));
  for(let i=0;i<poly.length;i++){
   const a=poly[i],q=poly[(i+1)%poly.length],dx=X(q[0])-X(a[0]),dz=Z(q[1])-Z(a[1]),length=Math.hypot(dx,dz);if(length<2)continue;
   const face=new THREE.Group();face.name=b.id+'_fachada_'+i;face.position.set((X(a[0])+X(q[0]))/2,0,(Z(a[1])+Z(q[1]))/2);face.rotation.y=Math.atan2(dx,dz)+(winding<0?Math.PI:0);parent.add(face);
   const n=Math.max(1,Math.round(length/(permanent?5:4))),bay=length/n,levels=Math.max(1,Math.round(height/H)),floorHeight=height/levels;
   for(let f=0;f<levels;f++){
    const y=.25+f*floorHeight+(permanent?2:1.9);
    for(let j=0;j<n;j++){
     const z=-length/2+(j+.5)*bay,ww=permanent?Math.min(2.7,bay-.65):bay-.65;
     box(face,b.id+'_ventana_nivel_'+f,.13,y,z,.16,permanent?1.65:1.25,ww,permanent?'#6b8084':'#819a96');
     box(face,'Parteluz',.25,y,z,.08,permanent?1.65:1.25,.07,'#b5c3be');
     box(face,'Dintel',.25,y+.86,z,.2,.12,ww+.16,permanent?'#c9c9bb':'#e4e6dc');
    }
    if(permanent)box(face,'Trabe_de_concreto',.35,.25+(f+1)*floorHeight-.25,0,.8,.55,length,'#d7d3c3');
   }
   for(let j=0;j<=n;j++)box(face,permanent?'Columna_de_concreto':'Poste_modulo',permanent?.38:.15,height/2+.25,-length/2+j*bay,permanent?.75:.18,height,permanent?.65:.18,permanent?'#d7d3c3':'#648077');
   box(face,'Pretil',.1,height+.48,0,.34,.45,length,permanent?'#d9d5c7':'#b9c7bb');
   if(permanent&&Math.abs(dx)>65&&height>H*2){
    // Núcleo vertical visible en las fotos; posición/reparto aproximados.
    const hh=height-.5;box(face,b.id+'_nucleo_acristalado',.82,.25+hh/2,0,.15,hh,5.8,'#4d7179');
    for(let z=-2.9;z<=2.91;z+=1.45)box(face,'Montante_nucleo',.96,.25+hh/2,z,.1,hh,.09,'#b7c8c3');
    for(let y=.25;y<height;y+=floorHeight/2)box(face,'Travesano_nucleo',.96,y,0,.1,.1,5.8,'#b7c8c3');
   }
  }
 }
 function lightRoof(parent,b,poly,height){
  volume(parent,poly,height+.25,.16,b.roof,'Cubierta_ligera_clara');
  const xs=poly.map(p=>X(p[0])),zs=poly.map(p=>Z(p[1])),xmin=Math.min(...xs),xmax=Math.max(...xs),zmin=Math.min(...zs),zmax=Math.max(...zs);
  if(poly.length===4){
   const alongX=(xmax-xmin)>(zmax-zmin),verts=alongX?[[xmin,height+.4,zmin],[xmax,height+.4,zmin],[xmin,height+.95,(zmin+zmax)/2],[xmax,height+.95,(zmin+zmax)/2],[xmin,height+.4,zmax],[xmax,height+.4,zmax]]:[[xmin,height+.4,zmin],[xmin,height+.4,zmax],[(xmin+xmax)/2,height+.95,zmin],[(xmin+xmax)/2,height+.95,zmax],[xmax,height+.4,zmin],[xmax,height+.4,zmax]];
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(verts.flat(),3));geometry.setIndex([0,1,2,1,3,2,2,3,4,3,5,4]);geometry.computeVertexNormals();const m=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:'#e4e7da',side:THREE.DoubleSide,roughness:.8}));m.name='Techo_suave_dos_aguas';m.userData.disposeMaterial=true;parent.add(m);
  }
 }
 function renderBuilding(b,parent){
  const height=b.floors*H,permanent=b.detail==='permanent',parts=[];
  for(const poly of b.polygons){
   if(permanent&&b.architecture.frontCutZ!==undefined){const cut=b.architecture.frontCutZ+390;parts.push({poly:clip(poly,cut,true),height},{poly:clip(poly,cut,false),height:height*b.architecture.frontRatio});}
   else parts.push({poly,height});
  }
  for(const part of parts){
   const {poly,height}=part;if(poly.length<3)continue;
   if(permanent&&height>H*1.1){
    const center=poly.reduce((s,p)=>[s[0]+p[0]/poly.length,s[1]+p[1]/poly.length],[0,0]);
    const inset=poly.map(p=>{const d=Math.hypot(p[0]-center[0],p[1]-center[1]);return [p[0]+(center[0]-p[0])/Math.max(d,1),p[1]+(center[1]-p[1])/Math.max(d,1)];});
    volume(parent,inset,.25,H,'#7d7889','PB_retranqueada_lila');volume(parent,poly,H+.25,height-H,'#d9d5c7','Cuerpo_alto_de_concreto');
   }else volume(parent,poly,.25,height,permanent?'#cccbbd':b.detail==='cife'?'#bcc7c4':'#d5ddd2','Cuerpo_'+b.detail);
   facade(parent,poly,height,b,permanent);
   if(b.detail==='light')lightRoof(parent,b,poly,height);else volume(parent,poly,height+.25,.18,b.roof,'Azotea_terracota');
  }
  parent.userData.legacyId=b.legacyId;parent.userData.detail=b.detail;parent.userData.heightEvidence=b.heightEvidence;
 }
 function curvedSportsRoof(){
  const cfg=data.sportsRoof,r=cfg.rect,x=X((r[0]+r[2])/2),z=Z((r[1]+r[3])/2),w=r[2]-r[0],d=r[3]-r[1],g=new THREE.Group();g.name='Arco_techo_canchas_Lerma';g.position.set(x,0,z);g.userData={approximate:true,source:cfg.source};world.add(g);
  const vertices=[],indices=[],segments=24;
  for(let i=0;i<=segments;i++){const t=i/segments,xx=-w/2+w*t,yy=cfg.eaves+cfg.rise*Math.sin(Math.PI*t);vertices.push(xx,yy,-d/2,xx,yy,d/2);if(i<segments){const n=2*i;indices.push(n,n+2,n+1,n+1,n+2,n+3);}}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();const roof=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:'#d8dfd7',side:THREE.DoubleSide,roughness:.55,metalness:.1}));roof.name='Lamina_curva_blanca';roof.castShadow=true;roof.userData.disposeMaterial=true;g.add(roof);
  for(let zz=-d/2;zz<=d/2+.1;zz+=d/5){
   for(const xx of [-w/2,w/2])box(g,'Columna_arco',xx,cfg.eaves/2,zz,.2,cfg.eaves,.2,'#617874');
   const pts=Array.from({length:segments+1},(_,i)=>new THREE.Vector3(-w/2+w*i/segments,cfg.eaves+cfg.rise*Math.sin(Math.PI*i/segments)-.15,zz));const rib=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),24,.075,5,false),material('#70857c'));rib.name='Costilla_arco';g.add(rib);
  }
 }
 function courtDetails(){
  for(const [i,p]of data.courts.entries()){
   const xs=p.map(q=>X(q[0])),zs=p.map(q=>Z(q[1])),xmin=Math.min(...xs),xmax=Math.max(...xs),zmin=Math.min(...zs),zmax=Math.max(...zs),xc=(xmin+xmax)/2,zc=(zmin+zmax)/2;
   meshPoly(world,p,.32,i===2?'#69874e':'#bd514d',i===2?'Cancha_futbol':'Cancha_basquet_'+i);
   line(world,[[xmin+.4,zmin+.4],[xmax-.4,zmin+.4],[xmax-.4,zmax-.4],[xmin+.4,zmax-.4],[xmin+.4,zmin+.4]],'#f1e9ce',.13,.36);line(world,[[xmin,zc],[xmax,zc]],'#f1e9ce',.13,.36);
   const rad=i===2?4.8:1.8;line(world,Array.from({length:33},(_,j)=>[xc+rad*Math.cos(j*Math.PI/16),zc+rad*Math.sin(j*Math.PI/16)]),'#f1e9ce',.13,.36);
   for(const zz of [zmin+.9,zmax-.9]){
    if(i<2){box(world,'Poste_canasta',xc,1.6,zz,.16,3.2,.16,'#c8cec4');box(world,'Tablero_canasta',xc,3.1,zz,1.65,.95,.1,'#e7e9df');}
    else{for(const xx of [xc-3.5,xc+3.5])box(world,'Porteria_futbol',xx,1.15,zz,.12,2.3,.12,'#e2e6d5');box(world,'Travesano_porteria',xc,2.3,zz,7,.12,.12,'#e2e6d5');}
   }
  }
 }
 function solarLamp(x,z){const g=new THREE.Group();g.name='Luminaria_solar';world.add(g);box(g,'Poste',x,3,z,.1,6,.1,'#657870');box(g,'Panel_solar',x,6.15,z,.9,.08,.55,'#3d5760');box(g,'Luminaria',x+.28,5.8,z,.7,.12,.23,'#dee5d4');}
 function marker(m){
  const g=new THREE.Group();g.position.set(X(m.point[0]),0,Z(m.point[1]));g.name='Hito_'+m.id;g.userData={approximate:true,source:m.source};world.add(g);registerEditable('landmark_'+m.id,m.name,'landmark',g);
  if(m.kind==='sign'){
   box(g,'Base_SOY_UAM',0,.35,0,19,.7,2,'#7d438b');
   const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=220;const ctx=canvas.getContext('2d');ctx.font='bold 178px sans-serif';ctx.fillStyle='#faf8ed';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('SOY uam',512,110,1010);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(18,3.86),new THREE.MeshStandardMaterial({map:texture,transparent:true,side:THREE.DoubleSide,roughness:.85}));mesh.name='Rotulo_SOY_uam';mesh.position.set(0,2.25,0);mesh.userData.disposeMaterial=true;g.add(mesh);
  }else{const ring=new THREE.Mesh(new THREE.RingGeometry(1.4,1.8,16),material('#9763a2'));ring.rotation.x=-Math.PI/2;ring.position.y=.32;ring.name='Referencia_esquematica';g.add(ring);label(m.name,g.position.x,2,g.position.z,'place');}
 }
 function environment(){
  meshPoly(world,data.nature.polygon,.12,'#7c9165','Zona_natural_Los_Capulines');
  for(const p of data.lawns)meshPoly(world,p,.24,'#9fb187','Jardin_explanada');
  for(const road of data.roads){const points=road.points.map(p=>[X(p[0]),Z(p[1])]);line(world,points,road.color,road.width,.25);}
  // Sendero interpretativo esquemático. No se exporta como ruta navegable.
  line(world,data.nature.trail.map(p=>[X(p[0]),Z(p[1])]),'#c7ba91',2.2,.28);
  label('Los Capulines · zona natural',210,1,70,'place');
  courtDetails();curvedSportsRoof();for(const m of data.landmarks)marker(m);
  for(const gate of data.gates){const x=X(gate.point[0]),z=Z(gate.point[1]);box(world,'Acceso_Las_Garzas',x,1.8,z,1.3,3.6,1.3,'#376f8e');label(gate.name,x,5,z,'pedestrian');}
  for(const road of data.roads.slice(0,1))for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i],dx=b[0]-a[0],dz=b[1]-a[1],n=Math.max(1,Math.floor(Math.hypot(dx,dz)/28));for(let k=0;k<n;k++)solarLamp(X(a[0]+dx*k/n),Z(a[1]+dz*k/n)+6);}
 }
 return {renderBuilding,environment};
}
