import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const colors={'campus':'#CD032E','campus-cuajimalpa':'#F08200','campus-iztapalapa':'#57A519','campus-xochimilco':'#0072CE','campus-lerma':'#AD25A8'};
let helper;
for(const [dir,color]of Object.entries(colors)){
 const read=f=>fs.readFile(new URL('./'+dir+'/'+f,import.meta.url));
 const d=JSON.parse(await read('campus_editado.json')),{ORIGINAL}=await import('./'+dir+'/model-data.js');assert.deepEqual(d,ORIGINAL);
 const before=JSON.parse(execFileSync('git',['show','360e0ba:'+dir+'/campus_editado.json'],{encoding:'utf8'}));
 const clean=o=>{o=structuredClone(o);delete o.copyrightStyle;delete o.copyrightPanels;return o;};assert.deepEqual(clean(d),clean(before),'Sólo debe cambiar presentación: '+dir);
 assert.deepEqual(JSON.parse(await read('georreferencia.json')),JSON.parse(execFileSync('git',['show','360e0ba:'+dir+'/georreferencia.json'],{encoding:'utf8'})));
 const source=await read('copyright-layout.js');if(helper)assert.deepEqual(source,helper);helper=source;
 const {copyrightPanelsForSite:layout}=await import('./'+dir+'/copyright-layout.js'),panels=layout(d.site,d.metersPerPixel,d.copyrightStyle);assert(panels.length>=7);assert.equal(d.copyrightStyle.color,color);assert.equal(d.copyrightStyle.opacity,.84);
 const binary=await read(d.unit?.glb||'UAM_Azcapotzalco.glb'),g=JSON.parse(binary.subarray(20,20+binary.readUInt32LE(12)));
 const mark=g.nodes.find(n=>n.name==='Marca_copyright_modelo');assert.equal(mark.extras.color,color);assert.equal(mark.extras.panelCount,panels.length);assert.equal(mark.children.length,panels.length);assert.equal(mark.extras.flag,'showCopyright');assert.equal(d.showCopyright,true);
 for(const child of mark.children){const n=g.nodes[child],primitive=g.meshes[n.mesh].primitives[0],m=g.materials[primitive.material];assert.equal(m.alphaMode,'BLEND');assert(Math.abs(m.pbrMetallicRoughness.baseColorFactor[3]-.84)<1e-6);}
 const png=await read('plano_2d.png'),geo=JSON.parse(await read('georreferencia.json'));assert.equal(png.readUInt32BE(16),geo.ancho);assert.equal(png.readUInt32BE(20),geo.alto);
 console.log(dir+': '+panels.length+' marcas, '+color+', GLB/PNG correctos, datos y georreferencia conservados.');
}
