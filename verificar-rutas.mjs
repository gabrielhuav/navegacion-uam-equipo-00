import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {routeIssues,modelToGeo,edgeMeters,obstacles,segmentCuts} from './campus/route-space.js';
import * as THREE from './campus/vendor/three.module.js';
import {BASE_ROUTES,ROUTE_GEO} from './campus/route-data.js';
const read=n=>fs.readFile(new URL('./campus/'+n,import.meta.url)),json=async n=>JSON.parse(await read(n));
const [net,data,geo]=await Promise.all(['rutas.json','campus_editado.json','georreferencia.json'].map(json));
assert.deepEqual(routeIssues(net,data,geo),[]);assert.equal(net.provisional,undefined);
assert.deepEqual(net,BASE_ROUTES);assert.deepEqual(geo,ROUTE_GEO);
assert.equal(net.destinos.length,data.buildings.length+5);assert.equal(net.destinos.filter(d=>d.id.startsWith('ACCESO_')).length,3);
assert.deepEqual(geo,JSON.parse(execFileSync('git',['show','cefdd81:campus/georreferencia.json'],{encoding:'utf8'})));
assert.deepEqual(data,JSON.parse(execFileSync('git',['show','cefdd81:campus/campus_editado.json'],{encoding:'utf8'})),'La red no modifica edificios ni la maqueta');
const png=await read('plano_2d.png');assert.equal(png.readUInt32BE(16),1560);assert.equal(png.readUInt32BE(20),640);
for(const [x,z,key]of [[-390,-150,'superiorIzquierda'],[390,-150,'superiorDerecha'],[-390,170,'inferiorIzquierda']]){const p=modelToGeo(x,z,geo);assert(Math.abs(p.lat-geo[key][0])<1e-8);assert(Math.abs(p.lon-geo[key][1])<1e-8);}
const check=(fn,pattern)=>{const changed=structuredClone(net);fn(changed);assert(routeIssues(changed,data,geo).some(s=>pattern.test(s)),'No rechazó '+pattern);};
check(g=>g.nodos.push({...g.nodos[0]}),/repetido/);
check(g=>g.aristas.push({...g.aristas[0],a:'no-existe'}),/inexistente/);
check(g=>g.aristas[0].metros+=10,/Metros incoherentes/);
check(g=>g.nodos[0].lat+=.001,/Lat\/lon/);
check(g=>g.destinos[0].nodo='no-existe',/Destino sin nodo/);
check(g=>g.aristas=g.aristas.filter(e=>e.de!==g.nodos[0].id&&e.a!==g.nodos[0].id),/Falta conectar/);
check(g=>g.destinos.pop(),/Falta destino/);
// Pasillo abierto real del croquis frente al cuerpo cerrado: no exenciones por tipo de arista.
const s=data.metersPerPixel,at=(x,z)=>({x:(x-895)*s,z:(z-390)*s}),closed=obstacles(data);
const e=closed.find(b=>b.id==='E'),l=closed.find(b=>b.id==='L');
assert(!segmentCuts(at(500,406),at(640,406),e.poly));assert(segmentCuts(at(500,390),at(640,390),e.poly));assert(segmentCuts(at(970,500),at(1140,500),l.poly));
check(g=>{const a={id:'prueba_a',...at(970,500),nivel:0,tipo:'cruce'},b={id:'prueba_b',...at(1140,500),nivel:0,tipo:'cruce'};Object.assign(a,modelToGeo(a.x,a.z,geo));Object.assign(b,modelToGeo(b.x,b.z,geo));g.nodos.push(a,b);g.aristas.push({de:a.id,a:b.id,metros:edgeMeters(a,b),tipo:'pasillo',accesible:true});},/cuerpo cerrado L/);
// Dijkstra de prueba para todos los destinos: aristas no dirigidas, con distancias calibradas.
const adjacency=new Map(net.nodos.map(n=>[n.id,[]]));for(const e of net.aristas){adjacency.get(e.de).push([e.a,e.metros]);adjacency.get(e.a).push([e.de,e.metros]);}
function distance(from,to){const dist=new Map([[from,0]]),done=new Set();while(done.size<net.nodos.length){const next=[...dist].filter(([id])=>!done.has(id)).sort((a,b)=>a[1]-b[1])[0];if(!next)return Infinity;const [id,d]=next;if(id===to)return d;done.add(id);for(const [other,m]of adjacency.get(id))if(d+m<(dist.get(other)??Infinity))dist.set(other,d+m);}return Infinity;}
for(const a of net.destinos)for(const b of net.destinos)assert(Number.isFinite(distance(a.nodo,b.nodo)));
for(const b of net.destinos.filter(d=>['H','I','L','HP'].includes(d.id))){const a=net.destinos.find(d=>d.id==='ACCESO_P1');console.log(`${a.nombre} → ${b.nombre}: ${distance(a.nodo,b.nodo).toFixed(1)} m`);}
assert(net.aristas.some(e=>e.tipo==='pasillo'));assert(net.aristas.some(e=>e.tipo==='escalera'&&!e.accesible));
const parseGlb=bytes=>JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
const marked=parseGlb(await read('UAM_Azcapotzalco.glb')),plain=parseGlb(await read('UAM_Azcapotzalco_sin_marca.glb'));
assert(!plain.nodes.some(n=>n.name==='Marca_copyright_modelo'||n.name?.startsWith('Copyright_integrado_')));
for(const g of [marked,plain])assert(!g.nodes.some(n=>/Editor_red|^Nodo_n|^Arista_/.test(n.name||'')),'Red de edición horneada dentro del GLB');
assert.equal(marked.nodes.length-plain.nodes.length,34);
const north=(()=>{const a=(geo.superiorDerecha[1]-geo.superiorIzquierda[1])/geo.ancho,b=(geo.inferiorIzquierda[1]-geo.superiorIzquierda[1])/geo.alto,c=(geo.superiorDerecha[0]-geo.superiorIzquierda[0])/geo.ancho,d=(geo.inferiorIzquierda[0]-geo.superiorIzquierda[0])/geo.alto,det=a*d-b*c;return new THREE.Vector3(-b/det,0,a/det).normalize();})();
assert.equal(marked.nodes.find(n=>n.name==='Marca_copyright_modelo').extras.northAligned,true);
for(const n of marked.nodes.filter(n=>n.name?.startsWith('Copyright_integrado_'))){const m=n.matrix?new THREE.Matrix4().fromArray(n.matrix):new THREE.Matrix4().compose(new THREE.Vector3(...n.translation),new THREE.Quaternion(...n.rotation),new THREE.Vector3(...(n.scale||[1,1,1])));assert(new THREE.Vector3(0,1,0).transformDirection(m).dot(north)>.99999,'Marca no orientada al norte');}
const plainPng=await read('plano_2d_sin_marca.png');assert.equal(plainPng.readUInt32BE(16),1560);assert.equal(plainPng.readUInt32BE(20),640);
console.log(`Red AZC válida: ${net.nodos.length} nodos, ${net.aristas.length} tramos no dirigidos, ${net.destinos.length} destinos, un componente, sin cortes de cuerpos cerrados, coordenadas y metros coherentes.`);
