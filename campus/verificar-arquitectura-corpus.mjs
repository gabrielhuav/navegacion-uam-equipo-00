// Fixture capturado del GLB anterior a la ampliación: prueba posiciones,
// envolventes y huecos reales de las primitivas, sin fotos ni navegador.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from './vendor/three.module.js';
const architectureSource=fs.readFileSync(new URL('./detalles-arquitectura-corpus.js',import.meta.url),'utf8').replace("from 'site-clearance'",'from '+JSON.stringify(new URL('./site-clearance.js',import.meta.url).href));
const {mejorarArquitecturaCorpus}=await import('data:text/javascript;base64,'+Buffer.from(architectureSource).toString('base64'));
import {rectanglePolygon,segmentPolygon,polygonsOverlap} from './site-clearance.js';

const fixture=JSON.parse(fs.readFileSync(new URL('./validacion/fixtures/arquitectura_corpus_2026-11-17.json',import.meta.url),'utf8'));
const net=JSON.parse(fs.readFileSync(new URL('./rutas.json',import.meta.url),'utf8'));
const data=JSON.parse(fs.readFileSync(new URL('./campus_editado.json',import.meta.url),'utf8'));
const EPS=2e-5;
function transform(n,spec){
 if(spec.matrix)new THREE.Matrix4().fromArray(spec.matrix).decompose(n.position,n.quaternion,n.scale);
 else{if(spec.translation)n.position.fromArray(spec.translation);if(spec.rotation)n.quaternion.fromArray(spec.rotation);if(spec.scale)n.scale.fromArray(spec.scale);}
 n.name=spec.name;n.userData=structuredClone(spec.extras||{});return n;
}
function createNode(spec){
 let n;
 if(spec.bounds){
  const [lo,hi]=spec.bounds,w=hi.map((v,i)=>v-lo[i]),c=hi.map((v,i)=>(v+lo[i])/2);
  const geometry=new THREE.BoxGeometry(...w).translate(...c),pbr=spec.material?.pbr||{},rgba=pbr.baseColorFactor||[.8,.8,.8,1];
  n=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:new THREE.Color(...rgba.slice(0,3)),transparent:spec.material?.alphaMode==='BLEND',opacity:rgba[3]}));
 }else n=new THREE.Group();
 transform(n,spec);for(const child of spec.children||[])n.add(createNode(child));return n;
}
function sample(transformed){
 const world=new THREE.Group(),buildingGroups=new Map();
 if(transformed){world.position.set(18,0,-12);world.rotation.y=.37;world.scale.set(1.05,1,.92);}
 for(const row of fixture.parts){const b=createNode(row.building),p=createNode(row.part);b.add(p);world.add(b);buildingGroups.set(row.building.name.slice(9),b);for(const child of row.children)p.add(createNode(child));}
 for(const spec of fixture.nearbyObstacles||[]){let b=buildingGroups.get(spec.building);if(!b){b=new THREE.Group();b.name='FixtureEdificio_'+spec.building;world.add(b);buildingGroups.set(spec.building,b);}b.add(createNode(spec));}
 world.updateMatrixWorld(true);return {world,buildingGroups};
}
function nodes(root,name){const out=[];root.traverse(n=>{if(n.name===name)out.push(n);});return out;}
function bounds(list){const out=new THREE.Box3();for(const n of list)out.union(new THREE.Box3().setFromObject(n));return out;}
function inside(actual,expected,label){for(const axis of ['x','y','z']){assert.ok(actual.min[axis]>=expected.min[axis]-EPS,label+' min '+axis);assert.ok(actual.max[axis]<=expected.max[axis]+EPS,label+' max '+axis);}}
function close(a,b,label){assert.ok(a.distanceTo(b)<EPS,label);}
function cornersBefore(root){return [-1,1].flatMap(x=>[-1,1].map(z=>root.localToWorld(new THREE.Vector3(x/2,0,z/2))));}
function assertGroundReservation(root,before){
 const b=root.userData.parkingGroundBounds;assert.ok(b,'Reserva de estacionamiento conservada');
 const actual=[b.xMin,b.xMax].flatMap(x=>[b.zMin,b.zMax].map(z=>root.localToWorld(new THREE.Vector3(x,0,z))));
 for(let i=0;i<actual.length;i++)close(actual[i],before[i],'Huella original reservada frente a aparcamientos');
}
function rayLocal(root,from,to){root.updateWorldMatrix(true,true);const a=root.localToWorld(new THREE.Vector3(...from)),b=root.localToWorld(new THREE.Vector3(...to));return new THREE.Raycaster(a,b.clone().sub(a).normalize(),0,a.distanceTo(b)).intersectObject(root,true);}
function digest(root){const all=[];root.updateMatrixWorld(true);root.traverse(n=>all.push([n.name,n.isMesh||false,...n.matrixWorld.elements]));return JSON.stringify(all);}
function campusBounds(roots,campus){const points=[];for(const root of roots)root.traverse(n=>{if(!n.isMesh)return;n.geometry.computeBoundingBox();const b=n.geometry.boundingBox;for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])points.push(campus.worldToLocal(n.localToWorld(new THREE.Vector3(x,y,z))));});return new THREE.Box3().setFromPoints(points);}
const reports=[];
for(const moved of [false,true]){
 const {world,buildingGroups}=sample(moved),cube=new THREE.BoxGeometry(1,1,1),cylinder=new THREE.CylinderGeometry(1,1,1,8),cache=new Map();
 const material=c=>{if(!cache.has(c))cache.set(c,new THREE.MeshStandardMaterial({color:c}));return cache.get(c);};
 const sourceRoof=world.getObjectByName('P4_patio_cubierto_estudio'),sourceGh=world.getObjectByName('P2_invernadero_lateral');
 assert.ok(sourceRoof?.isMesh&&sourceGh?.isMesh,'El fixture debe representar la geometría anterior real');
 const roofGroundBefore=cornersBefore(sourceRoof),greenhouseGroundBefore=cornersBefore(sourceGh);
 const roofBefore=bounds([sourceRoof,...nodes(world,'P4_columna_patio'),...nodes(world,'P4_luminaria_globo')]);
 const greenhouseBefore=bounds([sourceGh]),framesBefore=nodes(world,'P2_marco_invernadero').map(n=>({box:bounds([n]),center:n.getWorldPosition(new THREE.Vector3())}));
 const tablesBefore=nodes(world,'P4_mesa_estudio').map(n=>({box:bounds([n]),center:n.getWorldPosition(new THREE.Vector3())}));
 const steelNames=['P4_base_arbol_acero','P4_escultura_amarilla','P4_brazo_acero_amarillo','P4_diagonal_acero_amarillo'];
 const steelBefore=bounds(steelNames.flatMap(name=>nodes(world,name)));
 const controls=[...nodes(world,'P2_tinaco_azotea'),...nodes(world,'P4_franja_terracota')].map(n=>({n,world:n.matrixWorld.clone()}));
 const dataBefore=JSON.stringify(data),netBefore=JSON.stringify(net);
 const result=mejorarArquitecturaCorpus({THREE,data,world,buildingGroups,cube,cylinder,material,net});world.updateMatrixWorld(true);
 assert.equal(result.cubiertaP4,1);assert.equal(result.mesasP4,tablesBefore.length);assert.equal(result.exhibidorP4,1);assert.equal(result.invernaderoP2,1);
 const roof=world.getObjectByName('P4_patio_cubierto_estudio'),gh=world.getObjectByName('P2_invernadero_lateral');
 assert.ok(roof.isGroup&&gh.isGroup,'Conservar nombres raíz como grupos');
 assertGroundReservation(roof,roofGroundBefore);
 const location=gh.userData.ubicacionEsquematica;assert.equal(location.estado,'corregida_sin_interpenetracion');
 assert.ok(Math.abs(location.deltaLocal[0]+2.15)<1e-8);assert.equal(location.deltaLocal[1],0);assert.ok(Math.abs(location.deltaLocal[2]-10.1)<1e-8,'Menor traslado sobre malla de 5 cm, por el mismo lado oeste');
 assert.equal(location.aristasComprobadas,net.aristas.length);
 const delta=new THREE.Vector3(...location.deltaLocal).applyMatrix4(gh.parent.matrixWorld).sub(new THREE.Vector3().applyMatrix4(gh.parent.matrixWorld));
 assertGroundReservation(gh,greenhouseGroundBefore.map(p=>p.add(delta)));
 inside(bounds([roof,...nodes(world,'P4_columna_patio'),...nodes(world,'P4_luminaria_globo')]),roofBefore,'Envolvente del patio');
 inside(bounds([gh]),greenhouseBefore.translate(delta),'Forma y tamaño del invernadero conservados tras corregir ubicación');
 const tables=nodes(world,'P4_mesa_estudio');
 for(let i=0;i<tables.length;i++){
  assert.ok(tables[i].isGroup);close(tables[i].getWorldPosition(new THREE.Vector3()),tablesBefore[i].center,'Centro de mesa conservado');
  inside(bounds([tables[i]]),tablesBefore[i].box,'Mesa y bancos');
  assert.equal(nodes(tables[i],'P4_banco_longitudinal_corpus').length,2);
 }
 const frames=nodes(world,'P2_marco_invernadero');assert.equal(frames.length,framesBefore.length);
 for(let i=0;i<frames.length;i++){
  assert.ok(frames[i].isGroup);close(frames[i].getWorldPosition(new THREE.Vector3()),framesBefore[i].center.add(delta),'Bastidor trasladado junto al invernadero');
  inside(bounds([frames[i]]),framesBefore[i].box.translate(delta),'Forma del bastidor vacío');
  assert.equal(rayLocal(frames[i],[0,0,-1],[0,0,1]).length,0,'El centro del antiguo paño blanco debe quedar abierto');
 }
 const steel=world.getObjectByName('P4_conexiones_acero_corpus');assert.ok(steel?.isGroup);inside(bounds([steel]),steelBefore,'Exhibidor');
 const column=world.getObjectByName('P4_escultura_amarilla');assert.ok(column.isGroup);
 assert.equal(rayLocal(column,[.12,-2,0],[.12,2,0]).length,0,'El canal del perfil I debe ser hueco');
 assert.ok(nodes(world,'P4_perno_union_acero_corpus').length>0);
 assert.ok(nodes(world,'P4_diagonal_cercha_corpus').length>0);
 assert.equal(nodes(world,'P2_faldon_techo_invernadero_corpus').length,2);
 const greenhouseRoots=[gh,...frames,world.getObjectByName('P2_bastidor_longitudinal_corpus')],placed=campusBounds(greenhouseRoots,world);
 const footprint=rectanglePolygon((placed.min.x+placed.max.x)/2,(placed.min.z+placed.max.z)/2,placed.max.x-placed.min.x+.1,placed.max.z-placed.min.z+.1),s=data.metersPerPixel;
 for(const building of data.buildings)for(const r of building.rects){const b=rectanglePolygon(((r[0]+r[2])/2-895)*s+(building.offsetX||0),((r[1]+r[3])/2-390)*s+(building.offsetZ||0),(r[2]-r[0])*s,(r[3]-r[1])*s);assert.ok(!polygonsOverlap(footprint,b),'Recinto fuera de huella '+building.id);}
 const actualNodes=new Map(net.nodos.map(n=>[n.id,n]));for(const edge of net.aristas)assert.ok(!polygonsOverlap(footprint,segmentPolygon(actualNodes.get(edge.de),actualNodes.get(edge.a),1.8)),'Corredor completo '+edge.de+'-'+edge.a);
 for(const node of net.nodos)assert.ok(!polygonsOverlap(footprint,rectanglePolygon(node.x,node.z,1.8,1.8)),'Reserva de cruce '+node.id);
 for(const spec of fixture.nearbyObstacles){const n=world.getObjectByName(spec.name),b=campusBounds([n],world);if(b.max.y<=placed.min.y||b.min.y>=placed.max.y)continue;assert.ok(!polygonsOverlap(footprint,rectanglePolygon((b.min.x+b.max.x)/2,(b.min.z+b.max.z)/2,b.max.x-b.min.x,b.max.z-b.min.z)),'Saliente real ajeno: '+spec.sourceParent+'/'+spec.sourceName);}
 assert.equal(JSON.stringify(data),dataBefore,'IDs, rects y niveles intactos');assert.equal(JSON.stringify(net),netBefore,'Nodos y aristas intactos');
 const transparents=[];world.traverse(n=>{if(n.isMesh&&n.material.transparent&&n.name.endsWith('_corpus'))transparents.push(n);});
 for(const n of transparents){assert.equal(n.material.side,THREE.DoubleSide);assert.equal(n.material.depthWrite,false);}
 const ownedMaterials=new Set();world.traverse(n=>{if(n.userData.disposeMaterial||n.userData.disposeCopyrightMaterial){assert.ok(n.isMesh&&n.material?.isMaterial,'La liberación debe pertenecer a una malla con material');assert.ok(!ownedMaterials.has(n.material),'Un solo propietario por material');ownedMaterials.add(n.material);}});
 for(const {n,world:before} of controls)assert.deepEqual(n.matrixWorld.elements,before.elements,'Elemento ajeno conservado');
 let meshCount=0;world.traverse(n=>{if(n.isMesh){meshCount++;assert.ok(n.geometry.getAttribute('position').array.every(Number.isFinite));assert.ok(n.scale.toArray().every(v=>v>0));}});
 const beforeRepeat=digest(world),repeat=mejorarArquitecturaCorpus({THREE,data,world,buildingGroups,cube,cylinder,material,net});
 assert.deepEqual(Object.values(repeat),[0,0,0,0]);assert.equal(digest(world),beforeRepeat,'Segunda llamada sin duplicaciones');
 // El ensayo segmental parte de los nodos reales de rutas y usa todas las
 // mallas del fixture; no constituye certificación de ancho libre.
 const targetRoots=[roof,...tables,steel,gh,...frames,world.getObjectByName('P2_bastidor_longitudinal_corpus')];
 const byId=new Map(net.nodos.map(n=>[n.id,n])),cuts=[];
 for(const height of [1,1.8,2.2])for(const e of net.aristas){
  const a=byId.get(e.de),b=byId.get(e.a),av=world.localToWorld(new THREE.Vector3(a.x,height,a.z)),bv=world.localToWorld(new THREE.Vector3(b.x,height,b.z)),len=av.distanceTo(bv);
  if(len<1e-6)continue;const ray=new THREE.Raycaster(av,bv.clone().sub(av).normalize(),1e-4,len-1e-4);
  if(ray.intersectObjects(targetRoots,true).length)cuts.push(e.de+'-'+e.a+'@'+height);
 }
 assert.deepEqual(cuts,[],'Las nuevas piezas deben respetar los ejes de rutas en las tres alturas');
 reports.push({transformed:moved,result,meshes:meshCount,routeCuts:cuts.length,shapesPreserved:true,greenhouseShiftLocal:location.deltaLocal,buildingFootprintOverlaps:0,routeCorridorOverlaps:0,lowGeometryOverlaps:0,parkingFootprintsFollow:true,framesOpen:true,IProfileOpen:true,idempotent:true});
}
console.log(JSON.stringify({passed:true,fixtureSource:fixture.sourceGlbSha256,reports},null,2));
