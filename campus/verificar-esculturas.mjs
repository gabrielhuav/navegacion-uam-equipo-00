import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {ORIGINAL} from './model-data.js';
const read=p=>fs.readFile(new URL(p,import.meta.url),'utf8');
const saved=JSON.parse(await read('./campus_editado.json')),html=await read('./Visor_UAM_autonomo.html'),app=await read('./app.js');
assert(html.includes(app),'El HTML autónomo tiene código desactualizado: ejecutar node campus/build.mjs');
const imports=JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]).imports;
const embedded=Buffer.from(imports['model-data'].split(',')[1],'base64').toString('utf8');
assert.deepEqual(JSON.parse(embedded.match(/export const ORIGINAL = ([\s\S]*);$/)[1]),saved,'El portátil pierde los ajustes guardados');
assert.deepEqual(JSON.parse(await read('./campus_base.json')),ORIGINAL,'Reconstruir no debe reemplazar la base con los ajustes');
const specs=[['habitacionesLuz','sculpture_habitaciones_luz','Habitaciones_de_Luz_escultura','habitaciones'],['universitas','sculpture_universitas','Universitas_escultura','universitas'],['casaAbierta','sculpture_casa_abierta','Casa_abierta_al_tiempo_escultura','casaAbierta']];
for(const name of ['UAM_Azcapotzalco.glb','UAM_Azcapotzalco_sin_marca.glb']){
 const b=await fs.readFile(new URL(name,import.meta.url)),g=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));
 for(const [property,id,group,button]of specs){
  assert(saved[property]);assert(html.includes('id="'+button+'"'));const node=g.nodes.find(n=>n.name===group);assert(node,'Falta '+group+' en '+name);assert.equal(node.extras.editableId,id);
  const edit=saved.elementEdits[id]||{},x=(saved[property].position[0]-895)*saved.metersPerPixel+(edit.offsetX||0),z=(saved[property].position[1]-390)*saved.metersPerPixel+(edit.offsetZ||0);
  assert(Math.abs((node.matrix?.[12]??node.translation?.[0]??0)-x)<.0001);assert(Math.abs((node.matrix?.[14]??node.translation?.[2]??0)-z)<.0001);
 }
}
// Esta corrección conserva assets, datos guardados, apps y georreferencia del PR.
const changed=execFileSync('git',['diff','8fdf9e1','--name-only','--','campus/campus_editado.json','campus/model-data.js','campus/georreferencia.json','campus/rutas.json','campus/*.glb','campus/*.png','app-kmp','app-flutter'],{cwd:new URL('..',import.meta.url),encoding:'utf8'}).trim();assert.equal(changed,'');
console.log('Tres esculturas en HTML/GLB, cámaras y posiciones guardadas correctas; assets, apps y georreferencia conservados.');
