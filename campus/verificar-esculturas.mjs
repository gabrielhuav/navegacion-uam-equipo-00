import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {ORIGINAL} from './model-data.js';
const read=p=>fs.readFile(new URL(p,import.meta.url),'utf8');
const saved=JSON.parse(await read('./campus_editado.json')),html=await read('./Visor_UAM_autonomo.html'),app=await read('./app.js');
assert(html.includes(app),'El HTML autónomo tiene código desactualizado: ejecutar node campus/build.mjs');
const imports=JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]).imports;
const embedded=Buffer.from(imports['model-data'].split(',')[1],'base64').toString('utf8');
assert.deepEqual(JSON.parse(embedded.match(/export const ORIGINAL = ([\s\S]*);$/)[1]),saved,'El portátil pierde los ajustes guardados');
assert.deepEqual(JSON.parse(await read('./campus_base.json')),ORIGINAL,'Reconstruir no debe reemplazar la base con los ajustes');
const specs=[['habitacionesLuz','sculpture_habitaciones_luz','Habitaciones_de_Luz_escultura','habitaciones'],['universitas','sculpture_universitas','Universitas_escultura','universitas'],['casaAbierta','sculpture_casa_abierta','Casa_abierta_al_tiempo_escultura','casaAbierta']];
specs.push(['vidrioCosei','sculpture_vidrio_COSEI','Escultura_vidrio_COSEI','vidrioCosei']);
for(const name of ['UAM_Azcapotzalco.glb','UAM_Azcapotzalco_sin_marca.glb']){
 const b=await fs.readFile(new URL(name,import.meta.url)),g=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));
 for(const [property,id,group,button]of specs){
  assert(saved[property]);assert(html.includes('id="'+button+'"'));const node=g.nodes.find(n=>n.name===group);assert(node,'Falta '+group+' en '+name);assert.equal(node.extras.editableId,id);
  const edit=saved.elementEdits[id]||{},x=(saved[property].position[0]-895)*saved.metersPerPixel+(edit.offsetX||0),z=(saved[property].position[1]-390)*saved.metersPerPixel+(edit.offsetZ||0);
  assert(Math.abs((node.matrix?.[12]??node.translation?.[0]??0)-x)<.0001);assert(Math.abs((node.matrix?.[14]??node.translation?.[2]??0)-z)<.0001);
 }
 assert(g.nodes.some(n=>n.name==='Letras_SOY_UAM_COSEI'));
 const caracol=g.nodes.find(n=>n.name==='Caracol_COSEI');
 assert.equal(caracol?.extras.editableId,'caracol_COSEI');
 const [px,pz]=saved.cosei.caracol,edit=saved.elementEdits.caracol_COSEI||{};
 const x=(px-895)*saved.metersPerPixel+(edit.offsetX||0),z=(pz-390)*saved.metersPerPixel+(edit.offsetZ||0);
 assert.ok(Math.abs((caracol.matrix?.[12]??caracol.translation?.[0]??0)-x)<.0001);
 assert.ok(Math.abs((caracol.matrix?.[14]??caracol.translation?.[2]??0)-z)<.0001);
 assert.equal(g.nodes.filter(n=>n.name==='Caracol_COSEI').length,1);
 const plazuela=caracol.children.map(i=>g.nodes[i]).find(n=>n.name==='Plazuela_bancas_curvas_J');
 assert.equal(plazuela.children.map(i=>g.nodes[i]).filter(n=>n.name==='Banca_curva_plazuela_J').length,2);
 const glass=g.materials.find(m=>m.name==='Vidrio_COSEI');assert(glass,'Falta vidrio exportado');assert.equal(glass.alphaMode,'BLEND');assert(glass.pbrMetallicRoughness.baseColorFactor[3]>0&&glass.pbrMetallicRoughness.baseColorFactor[3]<1);
 const sculpture=g.nodes.find(n=>n.name==='Escultura_vidrio_COSEI'),children=sculpture.children.map(i=>g.nodes[i]);
 assert.equal(children.filter(n=>n.name.startsWith('Poliedro_facetado_')).length,2);
 assert.equal(children.filter(n=>n.name.startsWith('Vidrio_')).length,4);
 assert(children.some(n=>n.name==='Pedestal_concreto_COSEI'));
}
for(const file of ['plano_2d.png','plano_2d_sin_marca.png']){const png=await fs.readFile(new URL(file,import.meta.url));assert.equal(png.readUInt32BE(16),1560);assert.equal(png.readUInt32BE(20),640);}
console.log('Esculturas y Caracol en HTML/GLB con sus posiciones guardadas, vidrio transparente y PNG de 1560 × 640.');
