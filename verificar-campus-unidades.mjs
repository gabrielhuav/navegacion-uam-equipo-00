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
 if(slug==='cuajimalpa'){
  assert.equal(d.architecture.integratedComplex,true);
  assert.equal(gltf.nodes.filter(n=>n.name==='Edificio_TORRE_III').length,1);
  for(const name of ['Fachadas_integradas_Cuajimalpa','Celosia_pliegues_claros','Atrio_central_vidrio','Lucernario_vidrio','Rampa_acceso_aproximada'])assert.ok(gltf.nodes.some(n=>n.name===name),'Falta detalle: '+name);
  for(const name of ['Porteria_Cuajimalpa_aproximada','Marquesina_porteria','Tirante_marquesina_superior','Cubierta_elevada_verde','Ventana_modular_lateral_nivel_7'])assert.ok(gltf.nodes.some(n=>n.name===name),'Falta detalle de referencia aérea/acceso: '+name);
  const gate=gltf.nodes.find(n=>n.name==='Porteria_Cuajimalpa_aproximada');assert.equal(gate.extras.editableId,'porteria_cuajimalpa');assert.equal(gate.extras.placementPending,true);
  const before=JSON.parse(execFileSync('git',['show','6dbf995:campus-cuajimalpa/campus_editado.json'],{cwd:new URL('.',root).pathname.replace(/^\/(\w:)/,'$1')}).toString());
  assert.deepEqual(d.buildings.map(b=>b.polygons),before.buildings.map(b=>b.polygons),'Se alteró la huella al detallar las fachadas');
  assert.equal(hash(await read(dir+'georreferencia.json')),hash(execFileSync('git',['show','6dbf995:'+dir+'georreferencia.json'],{cwd:new URL('.',root).pathname.replace(/^\/(\w:)/,'$1')})));
 }
 if(slug==='iztapalapa'){
  for(const name of ['Biblioteca_L_detalle','Biblioteca_cuerpo_con_portico','Biblioteca_dintel','Biblioteca_mural_interpretativo','Biblioteca_montante','Biblioteca_plaza'])assert.ok(gltf.nodes.some(n=>n.name===name),'Falta detalle de biblioteca: '+name);
  assert.equal(gltf.nodes.find(n=>n.name==='Biblioteca_mural_interpretativo').extras.notOriginalArtwork,true);
  const cwd=new URL('.',root).pathname.replace(/^\/(\w:)/,'$1'),before=JSON.parse(execFileSync('git',['show','450744a:'+dir+'campus_editado.json'],{cwd}).toString());
  assert.deepEqual(d.buildings,before.buildings,'Se alteraron edificios al detallar la biblioteca');
  assert.deepEqual(g,JSON.parse(execFileSync('git',['show','450744a:'+dir+'georreferencia.json'],{cwd}).toString()),'Se alteró la georreferencia de Iztapalapa');
 }
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
