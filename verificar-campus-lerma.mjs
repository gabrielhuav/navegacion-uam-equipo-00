import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import * as THREE from './campus-lerma/vendor/three.module.js';
import {ORIGINAL} from './campus-lerma/model-data.js';
import {copyrightPanelsForSite} from './campus-lerma/copyright-layout.js';
const root=new URL('./campus-lerma/',import.meta.url),read=n=>fs.readFile(new URL(n,root)),json=async n=>JSON.parse(await read(n));
const data=await json('campus_editado.json'),geo=await json('georreferencia.json');assert.deepEqual(data,ORIGINAL);assert.deepEqual(await json('campus_base.json'),data);
assert.equal(data.unit.slug,'lerma');assert.equal(data.buildings.length,20);
const expected=[...Array.from({length:7},(_,i)=>'A'+(i+1)),...Array.from({length:7},(_,i)=>'B'+(i+1)),'C','D','E','F','G','CASETA'];
assert.deepEqual(data.buildings.map(b=>b.id).sort(),expected.sort());
const get=id=>data.buildings.find(b=>b.id===id);assert.equal(get('G').legacyId,'P');assert.equal(get('F').legacyId,'O');assert.equal(get('A2').legacyId,'G');assert.equal(get('B2').legacyId,'M');assert.equal(get('B2').architecture.libraryOsmWay,'1413063311');assert.equal(get('G').floors,4);
for(const b of data.buildings.filter(b=>/^[AB][1-7]$/.test(b.id)))assert.equal(b.floors,1,b.id);
const frame=data.unit.plan;assert.equal(geo.ancho,1800);assert.equal(geo.alto,1240);assert.equal((frame.xMax-frame.xMin)*frame.pxPorMetro,geo.ancho);assert.equal((frame.zMax-frame.zMin)*frame.pxPorMetro,geo.alto);
function inside(x,z,poly){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
const panels=copyrightPanelsForSite(data.site,data.metersPerPixel,data.copyrightStyle);
for(const p of panels)for(const dx of [-p.width/2,p.width/2])for(const dz of [-p.width/16,p.width/16])assert(inside(p.x+dx+895,p.z+dz+390,data.site),'Marca fuera del predio en L');
for(const m of data.landmarks)assert(inside(...m.point,data.site),'Hito fuera del predio: '+m.id);
for(const poly of [data.site,data.nature.polygon,...data.buildings.flatMap(b=>b.polygons)])for(const [x,z]of poly)assert(x-895>=frame.xMin&&x-895<=frame.xMax&&z-390>=frame.zMin&&z-390<=frame.zMax,'Recorte en límite PNG');
// La prolongación natural debe estar al sur; no reducir el mapa al área de aulas.
assert(Math.max(...data.site.map(p=>p[1]-390))>250);assert(Math.min(...data.site.map(p=>p[1]-390))<-250);
const png=await read('plano_2d.png');assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png.readUInt32BE(16),1800);assert.equal(png.readUInt32BE(20),1240);
const bytes=await read(data.unit.glb);assert.equal(bytes.subarray(0,4).toString(),'glTF');assert.equal(bytes.readUInt32LE(4),2);assert.equal(bytes.readUInt32LE(8),bytes.length);assert(bytes.length<8e6,'GLB demasiado grande para este croquis');
const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));assert(gltf.buffers.every(b=>!b.uri));assert((gltf.images||[]).every(i=>i.bufferView!==undefined));
for(const b of data.buildings){const nodes=gltf.nodes.filter(n=>n.name==='Edificio_'+b.id);assert.equal(nodes.length,1,b.id);assert.equal(nodes[0].extras.floors,b.floors);}
const names=gltf.nodes.map(n=>n.name);for(const name of ['Arco_techo_canchas_Lerma','Lamina_curva_blanca','Zona_natural_Los_Capulines','Hito_soy_uam','Rotulo_SOY_uam','Acceso_Las_Garzas'])assert(names.includes(name),name);
for(const id of ['F','G'])assert(names.includes('Remates_lila_'+id));
// El cambio fotográfico conserva el marco y la posición de los veinte edificios.
const previous=JSON.parse(execFileSync('git',['show','6a6c342:campus-lerma/campus_editado.json'],{encoding:'utf8'}));
for(const key of ['unit','site','parking','landmarks'])assert.deepEqual(data[key],previous[key],key);
for(const b of data.buildings){const old=previous.buildings.find(o=>o.id===b.id);for(const key of ['polygons','rects','floors','offsetX','offsetZ'])assert.deepEqual(b[key],old[key],b.id+' '+key);}
assert.deepEqual(await read('georreferencia.json'),execFileSync('git',['show','6a6c342:campus-lerma/georreferencia.json']));
for(const b of data.buildings.filter(b=>['F','G'].includes(b.id)))for(const a of b.architecture.roofAccents){const r=a.rect;assert(inside((r[0]+r[2])/2,(r[1]+r[3])/2,b.polygons[0]),'Remate fuera de su huella');}
const mark=gltf.nodes.find(n=>n.name==='Marca_copyright_modelo');assert.equal(data.showCopyright,true);assert.equal(mark.children.length,panels.length);assert.equal(mark.extras.flag,'showCopyright');
// Alturas físicas en el GLB: verificar el modelo exportado, no solo sus etiquetas.
function bounds(name){
 const id=gltf.nodes.findIndex(n=>n.name===name),out=new THREE.Box3();
 function visit(index,parent){const n=gltf.nodes[index],m=n.matrix?new THREE.Matrix4().fromArray(n.matrix):new THREE.Matrix4().compose(new THREE.Vector3(...(n.translation||[0,0,0])),new THREE.Quaternion(...(n.rotation||[0,0,0,1])),new THREE.Vector3(...(n.scale||[1,1,1])));m.premultiply(parent);if(n.mesh!==undefined)for(const primitive of gltf.meshes[n.mesh].primitives){const a=gltf.accessors[primitive.attributes.POSITION];if(a.min&&a.max)out.union(new THREE.Box3(new THREE.Vector3(...a.min),new THREE.Vector3(...a.max)).applyMatrix4(m));}for(const child of n.children||[])visit(child,m);}
 visit(id,new THREE.Matrix4());return out;
}
assert(bounds('Edificio_G').max.y>14&&bounds('Edificio_G').max.y<16);assert(bounds('Edificio_F').max.y>10&&bounds('Edificio_F').max.y<12);assert(bounds('Edificio_A1').max.y<5);assert(bounds('Arco_techo_canchas_Lerma').max.y>9&&bounds('Arco_techo_canchas_Lerma').max.y<11);
const refs=await json('investigacion/referencias.json');assert.equal(refs.length,13);assert(refs.every(r=>r.visuallyReviewed&&r.source.startsWith('https://')));
const points=await json('calibracion/puntos.json');assert.equal(points.length,11);assert.equal(new Set(points.map(p=>p.edificio)).size,10);assert.equal(geo.calibracion.independiente,false);assert(geo.calibracion.rmsMetros<3);assert(geo.calibracion.maximoMetros<5);
for(const p of points)assert(p.latLon[0]>19.287&&p.latLon[0]<19.294&&p.latLon[1]>-99.504&&p.latLon[1]<-99.494);
execFileSync(process.execPath,[fileURLToPath(new URL('calibracion/recalcular.mjs',root))],{stdio:'inherit'});
const html=(await read('Visor_UAM_autonomo.html')).toString();assert(html.includes('lerma-architecture'));assert(html.includes('copyright @gabrielhuav'));assert(!html.includes('UAM Xochimilco'));
console.log(`Lerma OK: 20 volúmenes, 13 referencias visuales, 11 controles, PNG 1800×1240, GLB ${(bytes.length/1e6).toFixed(2)} MB, alturas y arquitectura exportadas.`);
