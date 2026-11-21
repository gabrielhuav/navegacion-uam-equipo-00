// Ejecuta las funciones reales de parking sin WebGL; audita la geometría emitida,
// no los centros. Los cuerpos mínimos de edificio/escultura son fixtures de planta.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from './vendor/three.module.js';
import * as clearance from './site-clearance.js';
import {andadorHHP,parcelasVerdesHHP,trazadosHHP} from './paisaje-h-hp.js';

const source=fs.readFileSync(new URL('./app.js',import.meta.url),'utf8');
const original=JSON.parse(fs.readFileSync(new URL('./campus_editado.json',import.meta.url),'utf8'));
const net=JSON.parse(fs.readFileSync(new URL('./rutas.json',import.meta.url),'utf8'));
const register=source.slice(source.indexOf('function registerEditable('),source.indexOf('// Las reservas son visuales'));
const parking=source.slice(source.indexOf('let parkingObstaclesCache=null;'),source.indexOf('function editSnapshot()'));
const factory=new Function('THREE','rectanglePolygon','segmentPolygon','convexHull','polygonArea','polygonsOverlap','subtractObstacles','intersectConvex','data','world','editables','buildingGroups','routeEditor','BASE_ROUTES','S','X','Z','box','material','cylinder','parcelasVerdesHHP','trazadosHHP','andadorHHP',register+parking+'\nreturn {parkingArea,vialidadEstacionamientos,parkingObstacles,registerEditable};');

function projectedHull(mesh){const p=mesh.geometry.getAttribute('position'),points=[];for(let i=0;i<p.count;i++){const v=new THREE.Vector3(p.getX(i),p.getY(i),p.getZ(i)).applyMatrix4(mesh.matrixWorld);points.push({x:v.x,z:v.z});}return clearance.convexHull(points);}
function intersectionArea(a,b){return clearance.polygonArea(clearance.intersectConvex(a,b));}
function combinedArea(polygons){return polygons.reduce((sum,polygon)=>sum+clearance.polygonArea(polygon),0);}

function assertCoverage(actual,reference,label){
 const referenceArea=combinedArea(reference);
 assert(referenceArea>0&&actual.length>0,`${label} debe tener una reserva con área.`);
 assert(Math.abs(combinedArea(actual)-referenceArea)<1e-6,`${label} perdió o extendió área al formar la reserva.`);
 for(const [index,polygon] of actual.entries()){
  const area=clearance.polygonArea(polygon);
  const covered=reference.reduce((sum,part)=>sum+intersectionArea(polygon,part),0);
  assert(area>0&&Math.abs(area-covered)<1e-6,`${label} contiene un fragmento fuera del perímetro.`);
  assert(actual.slice(0,index).every(part=>intersectionArea(part,polygon)<1e-6),`${label} contiene fragmentos que se superponen.`);
 }
}
const checked=/^(Cajón|Tope_cajon|Poste_luz_estacionamiento|Luminaria_estacionamiento|Camellon_estacionamiento|Area_verde_camellon|Guarnicion_estacionamiento|Carril_circulacion_interna|Carril_vial_conexion|Carril_estacionamientos_conectados|Linea_carril_vial)$/;
const road=/^(Carril_|Linea_carril_vial)/;
const parkingGroup=/^(Estacionamiento_editable_|Vialidad_y_accesos_estacionamiento$)/;
const results=[];
for(const transformed of [false,true]){
 const data=structuredClone(original),world=new THREE.Group(),buildingGroups=new Map(),editables=new Map();
 if(transformed){
  data.elementEdits.parking_0={offsetX:6,offsetZ:-3,rotation:.21,width:78,depth:126};
  data.elementEdits.parking_2={offsetX:-9,offsetZ:7,rotation:-.23,width:105,depth:68};
  data.elementEdits.sculpture_casa_abierta={offsetX:14,offsetZ:11,rotation:.8};
  data.casaAbierta.scale=1.5;
  data.buildings.find(b=>b.id==='A').offsetX=4;
 }
 const S=()=>data.metersPerPixel,X=x=>(x-895)*S(),Z=z=>(z-390)*S(),cube=new THREE.BoxGeometry(1,1,1),material=()=>new THREE.MeshBasicMaterial();
 function box(parent,name,x,y,z,w,h,d,color){const mesh=new THREE.Mesh(cube,material(color));mesh.name=name;mesh.position.set(x,y,z);mesh.scale.set(w,h,d);parent.add(mesh);return mesh;}
 for(const b of data.buildings){
  const g=new THREE.Group();g.position.set(b.offsetX||0,0,b.offsetZ||0);world.add(g);buildingGroups.set(b.id,g);
  for(const r of b.rects){const factor=b.diamond?Math.SQRT1_2:1;const mesh=box(g,'fixture',X((r[0]+r[2])/2),3,Z((r[1]+r[3])/2),(r[2]-r[0])*S()*factor,6,(r[3]-r[1])*S()*factor);if(b.diamond)mesh.rotation.y=b.facadeYaw??Math.PI/4;}
 }
 const api=factory(THREE,...['rectanglePolygon','segmentPolygon','convexHull','polygonArea','polygonsOverlap','subtractObstacles','intersectConvex'].map(k=>clearance[k]),data,world,editables,buildingGroups,null,net,S,X,Z,box,material,new THREE.CylinderGeometry(1,1,1,7),parcelasVerdesHHP,trazadosHHP,andadorHHP);
 for(const [key,id,radius] of [['serpentina','sculpture_serpentina_H',4],['universitas','sculpture_universitas',5.6],['casaAbierta','sculpture_casa_abierta',6.8],['habitacionesLuz','sculpture_habitaciones_luz',6.5]]){
  const spec=data[key];if(!spec)continue;const g=new THREE.Group();g.position.set(X(spec.position[0]),0,Z(spec.position[1]));g.scale.setScalar(spec.scale||1);world.add(g);api.registerEditable(id,id,'sculpture',g);box(g,'fixture sculpture',0,1,0,radius*2,2,radius*2);
 }
 for(const [i,r] of data.parking.entries())api.parkingArea(r,'parking_'+i,'fixture parking');api.vialidadEstacionamientos();world.updateMatrixWorld(true);
 const masks=api.parkingObstacles(),failures=[];
 const gardenContours=parcelasVerdesHHP.map(contour=>contour.map(([x,z])=>({x:X(x),z:Z(z)})));
 const gardenTriangles=gardenContours.flatMap(contour=>{
  const triangles=THREE.ShapeUtils.triangulateShape(contour.map(({x,z})=>new THREE.Vector2(x,z)),[])
   .map(indices=>indices.map(index=>contour[index]));
  assert(Math.abs(combinedArea(triangles)-clearance.polygonArea(contour))<1e-6,'La triangulación debe conservar el área completa de cada parcela.');
  return triangles;
 });
 const [x0,z0,x1,z1]=andadorHHP;
 const walk=clearance.rectanglePolygon(X((x0+x1)/2),Z((z0+z1)/2),(x1-x0)*S(),(z1-z0)*S());
 assert(masks.gardens.every(triangle=>triangle.length===3),'Los fragmentos de la reserva verde deben ser triángulos.');
 assertCoverage(masks.gardens,gardenTriangles,'La reserva verde');
 assertCoverage(masks.pavimentosPeatonales,[walk],'El andador');
 const landscapeMasks=[['garden',masks.gardens],['walkway',masks.pavimentosPeatonales]];
 let count=0,stalls=0,landscapeChecks=0;
 // Revisar cualquier descendiente de los grupos de parking, incluidas las cebras,
 // cabeceras, casetas y demás objetos que no tienen exclusión peatonal general.
 for(const group of world.children.filter(node=>parkingGroup.test(node.name))){
  group.traverse(mesh=>{
   if(!mesh.isMesh)return;
   landscapeChecks++;
   const poly=projectedHull(mesh);
   for(const [mask,obstacles] of landscapeMasks){
    const area=obstacles.reduce((sum,obstacle)=>sum+intersectionArea(poly,obstacle),0);
    if(area>1e-4)failures.push({group:group.name,mesh:mesh.name,mask,area});
   }
  });
 }
 assert(landscapeChecks>0,'La prueba del jardín y el andador requiere geometría de estacionamiento.');
 world.traverse(mesh=>{
  if(!mesh.isMesh||!checked.test(mesh.name))return;count++;if(mesh.name==='Tope_cajon')stalls++;
  const poly=projectedHull(mesh),exclusions=[...masks.hard,...(road.test(mesh.name)?masks.pedestrianOutsideCrossings:masks.pedestrian)];
  for(const obstacle of exclusions){const area=intersectionArea(poly,obstacle);if(area>1e-4){failures.push({mesh:mesh.name,area});break;}}
 });
 assert.equal(failures.length,0,JSON.stringify({transformed,failures:failures.slice(0,10)}));
 assert.equal([...editables.keys()].filter(k=>/^parking_\d$/.test(k)).length,7);
 assert(stalls>20,'El filtro no debe borrar todos los cajones para esconder colisiones.');
 results.push({transformed,meshes:count,stalls,landscapeChecks,collisions:failures.length});
}
console.log(JSON.stringify({checks:'actual parking functions; full emitted polygons; real canonical data + transformed fixtures',results},null,2));
