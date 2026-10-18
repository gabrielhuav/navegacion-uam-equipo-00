import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import crypto from 'node:crypto';
const root=new URL('./',import.meta.url);
const read=(p)=>fs.readFile(new URL(p,root));
const json=async p=>JSON.parse(await read(p));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const slug of ['cuajimalpa','iztapalapa']){
 const dir='campus-'+slug+'/',d=await json(dir+'campus_editado.json'),g=await json(dir+'georreferencia.json'),p=await json(dir+'calibracion/puntos.json');
 assert.equal(d.unit.slug,slug);assert.equal(d.unit.glb,'UAM_'+d.unit.name+'.glb');
 assert.equal(new Set(d.buildings.map(b=>b.id)).size,d.buildings.length);
 assert.equal(d.buildings.length,slug==='cuajimalpa'?2:17);
 for(const b of d.buildings){assert.ok(Number.isInteger(b.floors)&&b.floors>0&&b.floors<=8);assert.equal(b.levelsApproximate,true);assert.ok(b.polygons.every(poly=>poly.length>=3&&poly.every(p=>p.length===2&&p.every(Number.isFinite))));}
 assert.equal(p.length,g.calibracion.numeroPuntos);assert.ok(g.calibracion.volumenes>=4);assert.equal(g.calibracion.independiente,false);
 for(const key of ['superiorIzquierda','superiorDerecha','inferiorIzquierda']){assert.equal(g[key].length,2);assert.ok(g[key][0]>19.3&&g[key][0]<19.4&&g[key][1]>-99.30&&g[key][1]<-99.06);}
 const png=await read(dir+'plano_2d.png');assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png.readUInt32BE(16),g.ancho);assert.equal(png.readUInt32BE(20),g.alto);
 const binary=await read(dir+d.unit.glb);assert.equal(binary.subarray(0,4).toString(),'glTF');assert.equal(binary.readUInt32LE(4),2);assert.equal(binary.readUInt32LE(8),binary.length);
 const gltf=JSON.parse(binary.subarray(20,20+binary.readUInt32LE(12)).toString());
 for(const b of d.buildings){const node=gltf.nodes.find(n=>n.name==='Edificio_'+b.id);assert.ok(node,'Falta '+b.id);assert.equal(node.extras.floors,b.floors);}
 assert.ok(gltf.nodes.some(n=>n.extras?.dataLicense?.includes('OpenStreetMap')));
 assert.ok(!gltf.nodes.some(n=>/Selección_editor|Vista_previa_estacionamiento|gabrielhuav/.test(n.name||'')));
 const app=(await read(dir+'app.js')).toString(),html=(await read(dir+'Visor_UAM_autonomo.html')).toString();
 assert.ok(app.includes('watermarkedPlan(r.domElement)'));assert.ok(html.includes('© @gabrielhuav'));assert.ok(!html.includes('Eje 5 Norte;'));
 assert.equal((d.extraParking||[]).length,0);assert.deepEqual(d.elementEdits||{},{});
 execFileSync(process.execPath,[new URL(dir+'calibracion/recalcular.mjs',root).pathname.replace(/^\/(\w:)/,'$1')],{stdio:'pipe'});
 console.log(d.unit.name+': contrato, GLB, PNG, atribución, controles y calibración correctos.');
}
const repo=new URL('.',root).pathname.replace(/^\/(\w:)/,'$1');
for(const file of ['georreferencia.json','UAM_Azcapotzalco.glb']){
 const previous=execFileSync('git',['show','feature/p3-temas:campus/'+file],{cwd:repo,maxBuffer:20e6});assert.equal(hash(await read('campus/'+file)),hash(previous),'Se alteró Azcapotzalco: '+file);
}
const png=await read('campus/plano_2d.png');assert.equal(png.readUInt32BE(16),1560);assert.equal(png.readUInt32BE(20),640);
assert.equal(execFileSync('git',['diff','feature/p3-temas','--','app-kmp/','app-flutter/'],{cwd:repo}).length,0,'Hay cambios en las apps');
console.log('Azcapotzalco conserva GLB/georreferencia y PNG 1560×640; apps sin cambios.');
