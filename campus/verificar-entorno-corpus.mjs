// Geometría emitida: huellas completas frente a rutas, apoyo de bancas,
// clasificación piso/mueble, invariancia del campus e idempotencia.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from './vendor/three.module.js';
const root=new URL('../',import.meta.url);
const original=JSON.parse(fs.readFileSync(new URL('campus/campus_editado.json',root),'utf8'));
const net=JSON.parse(fs.readFileSync(new URL('campus/rutas.json',root),'utf8'));
const source=fs.readFileSync(new URL('campus/detalles-entorno-corpus.js',root),'utf8').replace("from 'site-clearance'",'from '+JSON.stringify(new URL('campus/site-clearance.js',root).href));
const {agregarEntornoCorpus}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));

function hull(points){
 const sorted=points.sort((a,b)=>a.x-b.x||a.z-b.z).filter((p,i,a)=>!i||Math.abs(p.x-a[i-1].x)>1e-8||Math.abs(p.z-a[i-1].z)>1e-8);
 const cross=(a,b,c)=>(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x),lo=[],hi=[];
 for(const p of sorted){while(lo.length>1&&cross(lo.at(-2),lo.at(-1),p)<=1e-9)lo.pop();lo.push(p);}
 for(const p of sorted.slice().reverse()){while(hi.length>1&&cross(hi.at(-2),hi.at(-1),p)<=1e-9)hi.pop();hi.push(p);}return [...lo.slice(0,-1),...hi.slice(0,-1)];
}
function pointSegment(p,a,b){const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz)));return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz);}
function inside(p,poly){let v=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.z>p.z)!==(b.z>p.z)&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)v=!v;}return v;}
function distance(poly,a,b){if(inside(a,poly)||inside(b,poly))return 0;let min=Infinity;for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length];const cross=(a,b,c)=>(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);if(cross(a,b,p)*cross(a,b,q)<0&&cross(p,q,a)*cross(p,q,b)<0)return 0;min=Math.min(min,pointSegment(p,a,b),pointSegment(q,a,b),pointSegment(a,p,q),pointSegment(b,p,q));}return min;}
function independentRoutes(world,net,halfWidth=.9){
 world.updateWorldMatrix(true,true);const inverse=world.matrixWorld.clone().invert(),nodes=new Map(net.nodos.map(n=>[n.id,n]));const fresh=[],preserved=[];let checked=0;
 world.traverse(mesh=>{if(!mesh.isMesh||!mesh.userData.pedestrianObstacle)return;const attr=mesh.geometry.getAttribute('position'),points=[];for(let i=0;i<attr.count;i++){const v=new THREE.Vector3(attr.getX(i),attr.getY(i),attr.getZ(i)).applyMatrix4(mesh.matrixWorld).applyMatrix4(inverse);points.push({x:v.x,z:v.z});}const poly=hull(points);checked++;
  for(const e of net.aristas){const a=nodes.get(e.de),b=nodes.get(e.a);if(distance(poly,a,b)<halfWidth-1e-6){(mesh.userData.existingFootprintPreserved?preserved:fresh).push({name:mesh.name,edge:e.de+'-'+e.a});}}
 });return {checked,newCollisions:fresh,preservedFootprintCollisions:preserved};
}
function projectedTriangles(world,mesh){
 const matrix=world.matrixWorld.clone().invert().multiply(mesh.matrixWorld),attr=mesh.geometry.getAttribute('position'),index=mesh.geometry.index;
 const points=Array.from({length:attr.count},(_,i)=>{const p=new THREE.Vector3().fromBufferAttribute(attr,i).applyMatrix4(matrix);return {x:p.x,z:p.z};}),triangles=[];
 for(let i=0;i<(index?.count??attr.count);i+=3){const tri=[0,1,2].map(k=>points[index?index.getX(i+k):i+k]),[a,b,c]=tri;if(Math.abs((b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x))>1e-8)triangles.push(tri);}
 return triangles;
}
function trianglesOverlap(a,b){
 for(const tri of [a,b])for(let i=0;i<3;i++){
  const p=tri[i],q=tri[(i+1)%3],nx=p.z-q.z,nz=q.x-p.x,aa=a.map(v=>v.x*nx+v.z*nz),bb=b.map(v=>v.x*nx+v.z*nz);
  if(Math.min(...aa)>=Math.max(...bb)-1e-8||Math.min(...bb)>=Math.max(...aa)-1e-8)return false;
 }return true;
}

function run(yaw,offset,scaled=false){
 const data=structuredClone(original),world=new THREE.Group();world.rotation.y=yaw;world.position.set(offset,0,-offset/2);if(scaled)world.scale.set(1.05,1,.92);
 const cube=new THREE.BoxGeometry(1,1,1),cache=new Map(),material=c=>{if(!cache.has(c))cache.set(c,new THREE.MeshStandardMaterial({color:c}));return cache.get(c);};
 function box(parent,name,x,y,z,w,h,d,c){const m=new THREE.Mesh(cube,material(c));m.name=name;m.position.set(x,y,z);m.scale.set(w,h,d);parent.add(m);return m;}
 const S=()=>data.metersPerPixel,X=x=>(x-895)*S(),Z=z=>(z-390)*S();
 for(const p of data.plazas){const r=p.rect;box(world,'Superficie',X((r[0]+r[2])/2),.23,Z((r[1]+r[3])/2),(r[2]-r[0])*S(),.25,(r[3]-r[1])*S(),p.name==='Plaza Roja'?'#b86d50':'#b87861');}
 for(const [x,z]of [[505,432],[585,432],[505,545],[585,545]])for(let i=0;i<2;i++)box(world,'Bote_doble_Plaza_Roja',X(x)+1.2+i*.5,.48,Z(z),.45,.72,.38,i?'#eceee9':'#b8292f');
 const pj=new THREE.Group();pj.name='Plazuela_bancas_curvas_J';pj.position.set(X(894),.18,Z(462));world.add(pj);
 const floor=new THREE.Mesh(new THREE.CylinderGeometry(5.6,5.6,.12,36),material('#b4b6ae'));floor.position.y=.06;pj.add(floor);
 const garden=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.5,.18,24),material('#567449'));garden.position.y=.12;pj.add(garden);
 for(const [start,end]of[[.25,2.6],[3.4,5.8]]){const s=new THREE.Shape();s.absarc(0,0,4.8,start,end,false);s.absarc(0,0,4.2,end,start,true);s.closePath();const b=new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:.52,bevelEnabled:false,curveSegments:28}),material('#c4c5bd'));b.name='Banca_curva_plazuela_J';b.rotation.x=-Math.PI/2;b.position.y=.58;pj.add(b);}
 const vidrio=new THREE.Group();vidrio.name='Escultura_vidrio_COSEI';vidrio.position.set(X(data.vidrioCosei.position[0]),0,Z(data.vidrioCosei.position[1]));vidrio.userData.editableId='sculpture_vidrio_COSEI';world.add(vidrio);box(vidrio,'fixture',0,2,0,2,4,2,'#777777');
 world.updateMatrixWorld(true);
 const benches=pj.children.filter(n=>n.name==='Banca_curva_plazuela_J'),prior=benches.map(n=>({x:n.position.x,z:n.position.z,scale:n.scale.toArray(),rotation:n.quaternion.toArray(),geometry:n.geometry}));
 const report=agregarEntornoCorpus({THREE,data,world,box,material,X,Z,S,net});
 assert.equal(report.botesCompletados,8);assert.equal(report.bancasApoyadas,2);assert.equal(report.bancasReubicadas,1);assert.equal(report.bancasSinResolver,0);assert.ok(report.postesJardin>0);assert.ok(report.cordonesJardin>0);assert.ok(report.drenajes===1);assert.equal(report.mesasPlazaRoja,1);assert.ok(report.panosPavimento>0);
 for(const [i,b]of benches.entries()){
  const correction=b.userData.corpusRouteAdjustment;
  assert.equal(b.position.y,.12);assert.equal(b.position.x,prior[i].x+(correction?.dx||0));assert.equal(b.position.z,prior[i].z+(correction?.dz||0));
  assert.deepEqual(b.scale.toArray(),prior[i].scale);assert.deepEqual(b.quaternion.toArray(),prior[i].rotation);assert.equal(b.geometry,prior[i].geometry);
  if(correction){assert.ok(correction.dz>0&&correction.dz<=2.7);assert.equal(b.userData.existingFootprintPreserved,false);}
  // La proyección completa permanece en el pavimento y fuera del jardín central.
  b.updateWorldMatrix(true,false);const matrix=pj.matrixWorld.clone().invert().multiply(b.matrixWorld),attr=b.geometry.getAttribute('position');
  const vertices=[];for(let j=0;j<attr.count;j++){const p=new THREE.Vector3().fromBufferAttribute(attr,j).applyMatrix4(matrix);assert.ok(Math.hypot(p.x,p.z)<=5.56+1e-6);vertices.push({x:p.x,z:p.z});}
  const index=b.geometry.index,origin={x:0,z:0};
  for(let j=0;j<(index?.count??attr.count);j+=3){
   const tri=[0,1,2].map(k=>vertices[index?index.getX(j+k):j+k]),[a,c,d]=tri;
   if(Math.abs((c.x-a.x)*(d.z-a.z)-(c.z-a.z)*(d.x-a.x))<1e-6)continue;
   assert.equal(inside(origin,tri),false,'No invadir jardín');
   for(let k=0;k<3;k++)assert.ok(pointSegment(origin,tri[k],tri[(k+1)%3])>=1.56-1e-6,'Separación del jardín');
  }
 }
 const all=[];world.traverse(n=>{if(n.isMesh)all.push(n);});const count=all.length;
 const again=agregarEntornoCorpus({THREE,data,world,box,material,X,Z,S,net});assert.equal(again.idempotente,true);let second=0;world.traverse(n=>{if(n.isMesh)second++;});assert.equal(second,count);
 for(const m of all){assert.ok(m.position.toArray().every(Number.isFinite));assert.ok(m.scale.toArray().every(v=>Number.isFinite(v)&&v>0));assert.ok(m.geometry.getAttribute('position').array.every(Number.isFinite),'Vértices finitos');}
 // Las piezas de acabado y muebles heredarán un desplazamiento del campus.
 const benchBox=new THREE.Box3().setFromObject(benches[0]),floorBox=new THREE.Box3().setFromObject(floor);assert.ok(Math.abs(benchBox.min.y-floorBox.max.y)<1e-6);
 const drain=world.getObjectByName('Drenaje_circular_corpus_COSEI');
 assert.ok(new THREE.Box3().setFromObject(drain).max.y<=.355+.03,'Rejilla prácticamente a ras de pavimento');
 for(const m of all.filter(n=>n.userData.corpusEnvironment))assert.equal(m.userData.groundSurface,!m.userData.pedestrianObstacle,'Clasificar suelo y mueble por separado');
 const routeAudit=independentRoutes(world,net);assert.equal(routeAudit.newCollisions.length,0,JSON.stringify(routeAudit.newCollisions));assert.equal(routeAudit.preservedFootprintCollisions.length,0);
 assert.equal(independentRoutes(world,net,.92).newCollisions.length,0,'Margen adicional de .02');
 const adjusted=benches.find(b=>b.userData.corpusRouteAdjustment),adjustedTriangles=projectedTriangles(world,adjusted),adjustedBox=new THREE.Box3().setFromObject(adjusted);
 for(const other of all){
  if(other===adjusted||!other.userData.pedestrianObstacle)continue;
  const otherBox=new THREE.Box3().setFromObject(other);if(!otherBox.intersectsBox(adjustedBox))continue;
  const otherTriangles=projectedTriangles(world,other);
  assert.equal(adjustedTriangles.some(a=>otherTriangles.some(b=>trianglesOverlap(a,b))),false,'Banca sin superposición con '+other.name);
 }
 adjusted.position.z-=.01;
 assert.ok(independentRoutes(world,net,.92).newCollisions.some(v=>v.name==='Banca_curva_plazuela_J'),'Un paso menos no satisface el margen');
 adjusted.position.z+=.01;world.updateWorldMatrix(true,true);return {...report,routeAudit};
}
const results=[run(0,0),run(.32,18),run(-.27,-11,true)];for(const result of results.slice(1))assert.deepEqual(result,results[0]);console.log(JSON.stringify({pass:true,results},null,2));
