import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {ORIGINAL} from './campus-xochimilco/model-data.js';
const root=new URL('./campus-xochimilco/',import.meta.url),read=async name=>fs.readFile(new URL(name,root)),json=async name=>JSON.parse(await read(name));
const data=await json('campus_editado.json'),base=await json('campus_base.json'),geo=await json('georreferencia.json');
assert.deepEqual(data,ORIGINAL);assert.deepEqual(base,ORIGINAL);
assert.equal(data.unit.slug,'xochimilco');assert.equal(data.buildings.length,37);assert.equal(new Set(data.buildings.map(b=>b.id)).size,37);
for(const id of ['A','B','C','D','E','F','G','H','I','J','K','M','N','O','P','Q','R','S','T','V','W','Z','VELARIA'])assert(data.buildings.some(b=>b.id===id),id);
const plan=data.unit.plan;assert.equal(geo.ancho,(plan.xMax-plan.xMin)*plan.pxPorMetro);assert.equal(geo.alto,(plan.zMax-plan.zMin)*plan.pxPorMetro);
for(const poly of [data.site,...data.buildings.flatMap(b=>b.polygons)])for(const [px,py]of poly){const x=px-895,z=py-390;assert(x>=plan.xMin&&x<=plan.xMax&&z>=plan.zMin&&z<=plan.zMax,'Punto fuera del PNG');}
const png=await read('plano_2d.png');assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png.readUInt32BE(16),800);assert.equal(png.readUInt32BE(20),2120);
const glb=await read(data.unit.glb);assert.equal(glb.subarray(0,4).toString(),'glTF');assert.equal(glb.readUInt32LE(4),2);assert.equal(glb.readUInt32LE(8),glb.length);assert.equal(glb.subarray(16,20).toString(),'JSON');
const gltf=JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12)).toString());
for(const b of data.buildings){const nodes=gltf.nodes.filter(n=>n.name==='Edificio_'+b.id);assert.equal(nodes.length,1,b.id);assert.equal(nodes[0].extras.floors,b.floors);}
const mark=gltf.nodes.find(n=>n.name==='Marca_copyright_modelo');assert.equal(data.showCopyright,true);assert.equal(mark.children.length,3);assert.equal(mark.extras.flag,'showCopyright');
const sources=await json('calibracion/huellas-osm.geojson');assert.equal(sources.features.length,33);assert(sources.features.every(f=>f.properties.osmWay));
const points=await json('calibracion/puntos.json');assert.equal(points.length,11);assert.equal(geo.calibracion.independiente,false);assert(geo.calibracion.rmsMetros<5);assert(geo.calibracion.maximoMetros<10);
for(const p of points)assert(p.latLon[0]>19.299&&p.latLon[0]<19.31&&p.latLon[1]>-99.106&&p.latLon[1]<-99.10);
execFileSync(process.execPath,[new URL('calibracion/recalcular.mjs',root).pathname.replace(/^\/([A-Z]:)/i,'$1')],{stdio:'inherit'});
const html=(await read('Visor_UAM_autonomo.html')).toString();assert(html.includes('copyright @gabrielhuav'));assert(!html.includes('Biblioteca · detalle'));assert(!html.includes('UAM Iztapalapa'));
console.log(`Xochimilco OK: ${data.buildings.length} volúmenes, ${points.length} controles, PNG 800×2120, GLB ${(glb.length/1e6).toFixed(2)} MB, copyright integrado.`);
