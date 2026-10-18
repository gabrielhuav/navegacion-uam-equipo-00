import * as THREE from 'three';

// Interpretación de las fotos de Gabriel. Las huellas y alturas pertenecen al JSON;
// aquí sólo se añade el lenguaje de fachada, sin girar ni recolocar edificios.
export function xocArchitecture(g,b,poly,height,{box,X,Z,storey,material}){
 const academic=b.floors>=3;
 const facade=new THREE.Group();facade.name='Fachada_concreto_marcos_azules';g.add(facade);
 const area=poly.reduce((s,p,i)=>{const q=poly[(i+1)%poly.length];return s+p[0]*q[1]-q[0]*p[1];},0);
 for(let i=0;i<poly.length;i++){
  const a=poly[i],q=poly[(i+1)%poly.length],dx=X(q[0])-X(a[0]),dz=Z(q[1])-Z(a[1]),length=Math.hypot(dx,dz);
  if(length<2)continue;
  const edge=new THREE.Group();edge.position.set((X(a[0])+X(q[0]))/2,0,(Z(a[1])+Z(q[1]))/2);
  edge.rotation.y=Math.atan2(dx,dz)+(area<0?Math.PI:0);facade.add(edge);
  // +X local apunta al exterior, también en polígonos de sentido inverso.
  const bays=Math.max(1,Math.floor(length/(academic?4.7:6))),pitch=length/bays;
  for(let f=0;f<b.floors;f++){
   const y=f*storey;
   box(edge,'Losa_concreto',.18,y+.5,0,.55,.4,length,'#b9b9b0');
   for(let k=0;k<bays;k++){
    const z=-length/2+(k+.5)*pitch,w=Math.max(.4,pitch-.85),h=academic?2.05:1.55;
    box(edge,'Marco_azul_nivel_'+f,.14,y+2.1,z,.22,h,w,'#254c85');
    box(edge,'Cristal_azul_rehundido',.27,y+2.1,z,.065,h-.22,Math.max(.2,w-.22),'#496578');
    if(w>2)box(edge,'Parteluz_azul',.32,y+2.1,z,.12,h-.12,.075,'#254c85');
    if(academic)box(edge,'Aleta_concreto',.48,y+1.95,z-w/2-.24,.95,2.65,.42,'#bdbeb7');
    box(edge,'Alfeizar_concreto',.4,y+2.1-h/2-.12,z,.7,.18,w+.15,'#c8c8bf');
   }
  }
  // Juntas de los paños, sin textura fotográfica ni archivos remotos.
  box(edge,'Pretil_concreto',.09,height+.62,0,.26,.48,length,'#c5c4bb');
 }
 if(b.id==='A'){
  const points=poly.map(p=>[X(p[0]),Z(p[1])]),cx=points.reduce((s,p)=>s+p[0],0)/points.length,cz=points.reduce((s,p)=>s+p[1],0)/points.length;
  const roof=new THREE.Group();roof.name='Lucernario_curvo_central';roof.position.set(cx,height+.62,cz);roof.rotation.y=-Math.atan2(points[1][1]-points[0][1],points[1][0]-points[0][0]);g.add(roof);
  const width=22,length=42,rise=3.8,segments=16,vertices=[],indices=[];
  for(let i=0;i<=segments;i++){const t=i/segments*Math.PI,z=-width/2*Math.cos(t),y=rise*Math.sin(t);vertices.push(-length/2,y,z,length/2,y,z);if(i<segments){const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  const glass=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:'#547d8b',roughness:.4,metalness:.15,side:THREE.DoubleSide}));glass.name='Cubierta_curva_vidriada';glass.userData.disposeMaterial=true;roof.add(glass);
  function beam(a,c,name){const v=new THREE.Vector3().subVectors(c,a),m=box(roof,name,0,0,0,.2,.2,v.length(),'#e4e2d8');m.position.copy(a).add(c).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),v.normalize());}
  for(let x=-length/2;x<=length/2+.01;x+=length/7)for(let i=0;i<segments;i++){const t=i/segments*Math.PI,u=(i+1)/segments*Math.PI;beam(new THREE.Vector3(x,rise*Math.sin(t)+.12,-width/2*Math.cos(t)),new THREE.Vector3(x,rise*Math.sin(u)+.12,-width/2*Math.cos(u)),'Costilla_clara_lucernario');}
  for(let i=0;i<=segments;i+=4){const t=i/segments*Math.PI;beam(new THREE.Vector3(-length/2,rise*Math.sin(t)+.12,-width/2*Math.cos(t)),new THREE.Vector3(length/2,rise*Math.sin(t)+.12,-width/2*Math.cos(t)),'Larguero_lucernario');}
  roof.userData={approximate:true,reference:'Vista aérea aportada por Gabriel; dimensiones y detalle de cubierta estimados'};
 }
}
