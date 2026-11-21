// Comprueba el campus exportado sin editar archivos ni anular guardas históricas.
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const campus=path.resolve(process.argv[2]||'campus');
const baseline=process.argv[3]?path.resolve(process.argv[3]):null;
const file=n=>fs.readFile(path.join(campus,n));
const read=async n=>(await file(n)).toString('utf8');
const data=JSON.parse(await read('campus_editado.json'));
const geo=JSON.parse(await read('georreferencia.json'));
const net=JSON.parse(await read('rutas.json'));
const {ORIGINAL}=await import(pathToFileURL(path.join(campus,'model-data.js')).href);
const {routeIssues,modelToGeo}=await import(pathToFileURL(path.join(campus,'route-space.js')).href);
const {BASE_ROUTES,ROUTE_GEO}=await import(pathToFileURL(path.join(campus,'route-data.js')).href);
const parseGlb=async name=>{
  const raw=await file(name);
  assert.equal(raw.subarray(0,4).toString(),'glTF');
  assert.equal(raw.readUInt32LE(4),2);assert.equal(raw.readUInt32LE(8),raw.length);
  const gltf=JSON.parse(raw.subarray(20,20+raw.readUInt32LE(12)).toString('utf8'));
  return {gltf,sha256:crypto.createHash('sha256').update(raw).digest('hex'),bytes:raw.length};
};
assert.deepEqual(JSON.parse(await read('campus_base.json')),ORIGINAL,'Base incompatible con model-data.js');
assert.deepEqual(net,BASE_ROUTES,'Portátil/red incorporada obsoletos');assert.deepEqual(geo,ROUTE_GEO);
assert.deepEqual(routeIssues(net,data,geo),[],'Rutas cortan obstáculos canónicos o tienen datos inválidos');
assert.ok(net.nodos.length>=115&&net.aristas.length>=120);
assert.equal(net.destinos.filter(d=>!d.edificio).length,31);
assert.ok(net.perimetro?.length>=3,'Falta el límite para iniciar rutas desde el GPS');
assert.ok(net.destinos.some(d=>d.edificio==='G'&&d.id==='G302-A'));
assert.ok(net.destinos.some(d=>d.edificio==='T'&&d.id==='T_CSE'));
assert.ok(net.destinos.some(d=>d.edificio==='I'&&d.id==='I_HEMEROTECA'));
assert.equal(data.buildings.length,26);
assert.equal(data.gates.filter(x=>x.type==='vehicle').length,3);
assert.equal(data.gates.filter(x=>x.type==='pedestrian').length,3);
assert.equal(data.buildings.find(x=>x.id==='T').noStreetExit,true);
assert.deepEqual([geo.ancho,geo.alto],[1560,640]);
for(const [x,z,key] of [[-390,-150,'superiorIzquierda'],[390,-150,'superiorDerecha'],[-390,170,'inferiorIzquierda']]){
  const p=modelToGeo(x,z,geo);assert.ok(Math.abs(p.lat-geo[key][0])<1e-8&&Math.abs(p.lon-geo[key][1])<1e-8);
}
// Las pruebas negativas se ejecutan sobre copias: nunca se modifica rutas.json.
for(const [mutate,pattern] of [
  [n=>n.nodos.push({...n.nodos[0]}),/repetido/],
  [n=>n.aristas.push({...n.aristas[0],a:'no-existe'}),/inexistente/],
  [n=>n.aristas[0].metros+=10,/Metros incoherentes/],
  [n=>n.nodos[0].lat+=.001,/Lat\/lon/],
  [n=>n.destinos[0].nodo='no-existe',/Destino sin nodo/],
  [n=>n.destinos=n.destinos.filter(d=>d.id!=='T'),/Falta destino/],
  [n=>n.perimetro[0].lat+=.001,/perímetro GPS/],
  [n=>n.nodos.find(p=>p.id===n.destinos.find(d=>d.id==='ACCESO_P3').nodo).tipo='cruce',/Acceso peatonal sin tipo/],
  [n=>n.destinos.find(d=>d.id==='G302-A').nodo='n1',/Destino interior/],
]){const copy=structuredClone(net);mutate(copy);assert.ok(routeIssues(copy,data,geo).some(x=>pattern.test(x)));}
// Conectividad real, no sólo cantidad de nodos.
const links=new Map(net.nodos.map(n=>[n.id,[]]));
for(const e of net.aristas){links.get(e.de).push(e.a);links.get(e.a).push(e.de);}
const seen=new Set(),queue=[net.nodos[0].id];
while(queue.length){const id=queue.pop();if(seen.has(id))continue;seen.add(id);queue.push(...links.get(id));}
assert.equal(seen.size,net.nodos.length);
const app=await read('app.js'),html=await read('Visor_UAM_autonomo.html');
assert.ok(html.includes(app),'Código portátil obsoleto: ejecutar build.mjs');
assert.ok(/xMin:\s*-390,\s*xMax:\s*390,\s*zMin:\s*-150,\s*zMax:\s*170,\s*pxPorMetro:\s*2/.test(app));
const imports=JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]).imports;
const embedded=Buffer.from(imports['model-data'].split(',')[1],'base64').toString('utf8');
assert.deepEqual(JSON.parse(embedded.match(/export const ORIGINAL = ([\s\S]*);$/)[1]),data,'Portátil pierde datos guardados');
const marked=await parseGlb('UAM_Azcapotzalco.glb'),plain=await parseGlb('UAM_Azcapotzalco_sin_marca.glb');
for(const {gltf} of [marked,plain]){
  const buildingRoots=gltf.nodes.filter(x=>/^Edificio_/.test(x.name||''));
  assert.equal(buildingRoots.length,data.buildings.length);
  for(const b of data.buildings){const node=buildingRoots.find(x=>x.name==='Edificio_'+b.id);assert.ok(node);assert.equal(node.extras.floors,b.floors);}
  const ids=gltf.nodes.filter(n=>n.extras?.editableId).map(n=>n.extras.editableId);
  assert.equal(new Set(ids).size,ids.length);
  for(let i=0;i<data.parking.length;i++)assert.ok(ids.includes('parking_'+i));
  assert.ok(!gltf.nodes.some(n=>['Selección_editor','Vista_previa_estacionamiento'].includes(n.name)||/Editor_red|^Nodo_n|^Arista_/.test(n.name||'')));
  assert.ok(!gltf.nodes.some(n=>/^Interior_(I_|J_|L_|G302_)/.test(n.name||'')),'Una vista interior entró en el GLB del campus');
}
assert.equal(plain.gltf.nodes.some(x=>x.name==='Marca_copyright_modelo'||x.name?.startsWith('Copyright_integrado_')),false);
if(data.showCopyright!==false){
  assert.equal(marked.gltf.nodes.length-plain.gltf.nodes.length,34);
  assert.equal(marked.gltf.nodes.filter(x=>x.name?.startsWith('Copyright_integrado_')).length,33);
}
for(const name of ['plano_2d.png','plano_2d_sin_marca.png']){
  const png=await file(name);assert.equal(png.subarray(1,4).toString(),'PNG');
  assert.deepEqual([png.readUInt32BE(16),png.readUInt32BE(20)],[1560,640]);
  assert.equal(png[25],6,'Conservar PNG RGBA/transparencia');
}
if(baseline){
  const old=JSON.parse(await fs.readFile(path.join(baseline,'campus_editado.json'),'utf8'));
  assert.deepEqual(geo,JSON.parse(await fs.readFile(path.join(baseline,'georreferencia.json'),'utf8')));
  const oldNet=JSON.parse(await fs.readFile(path.join(baseline,'rutas.json'),'utf8'));
  for(const key of ['nodos','destinos']){
    const ids=new Set(net[key].map(item=>item.id));
    for(const item of oldNet[key])assert.ok(ids.has(item.id),'Falta el ID previo '+item.id);
  }
  assert.equal(data.metersPerPixel,old.metersPerPixel);assert.equal(data.storeyHeight,old.storeyHeight);
  assert.deepEqual(data.site,old.site);assert.deepEqual(data.parking,old.parking);assert.deepEqual(data.gates,old.gates);
  assert.deepEqual(data.buildings.map(b=>({id:b.id,rects:b.rects,offsetX:b.offsetX,offsetZ:b.offsetZ})),
                   old.buildings.map(b=>({id:b.id,rects:b.rects,offsetX:b.offsetX,offsetZ:b.offsetZ})));
}
console.log(JSON.stringify({pass:true,read_only:true,buildings:26,parking:data.parking.length,
  routeNodes:net.nodos.length,routeEdges:net.aristas.length,routeDestinations:net.destinos.length,routeComponent:1,png:[1560,640],
  marked:{sha256:marked.sha256,bytes:marked.bytes,nodes:marked.gltf.nodes.length},
  plain:{sha256:plain.sha256,bytes:plain.bytes,nodes:plain.gltf.nodes.length},
  savedEditsPreserved:Object.keys(data.elementEdits||{}).length,baselineCompared:!!baseline}));
