import fs from 'node:fs/promises';
import {ORIGINAL} from './model-data.js';
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
// Embed Git's LF form even when a Windows editor has saved mixed line endings.
const read=async p=>(await fs.readFile(new URL(p,import.meta.url),'utf8')).replace(/\r\n/g,'\n');
// No reescribir rutas intactas por diferencias CRLF/LF: conserva los bytes
// actuales sin recurrir a restauraciones de Git que puedan borrar trabajo ajeno.
async function writeTextIfChanged(file,text){
 try{if((await read(file)).replace(/\r\n/g,'\n')===text.replace(/\r\n/g,'\n'))return;}
 catch(error){if(error.code!=='ENOENT')throw error;}
 await fs.writeFile(new URL(file,import.meta.url),text);
}
const routes=JSON.parse(await read('./rutas.json')),geo=JSON.parse(await read('./georreferencia.json'));
// El portátil debe conservar también las posiciones acomodadas en el editor.
// ORIGINAL sigue siendo la base de campus_base.json, sin sobrescribir datos guardados.
let portableData=ORIGINAL;
try{portableData=JSON.parse(await read('./campus_editado.json'));}
catch(error){if(error.code!=='ENOENT')throw error;}
await writeTextIfChanged('./route-data.js','export const ROUTE_GEO='+JSON.stringify(geo)+';\nexport const BASE_ROUTES='+JSON.stringify(routes)+';\n');
const imports={'route-space':uri(await read('./route-space.js')),'route-data':uri(await read('./route-data.js')),'route-editor':uri(await read('./route-editor.js')),'copyright-layout':uri(await read('./copyright-layout.js')),'site-clearance':uri(await read('./site-clearance.js')),'detalles-corpus':uri(await read('./detalles-corpus.js')),'accesos-modelados':uri(await read('./accesos-modelados.js')),'detalles-arquitectura-corpus':uri(await read('./detalles-arquitectura-corpus.js')),'detalles-entorno-corpus':uri(await read('./detalles-entorno-corpus.js')),three:uri(await read('./vendor/three.module.js')),orbit:uri(await read('./vendor/OrbitControls.js')),exporter:uri((await read('./vendor/GLTFExporter.js')).replace(/'\.\/(?:\.\.\/utils\/)?TextureUtils\.js'/,"'texture-utils'")),'texture-utils':uri(await read('./vendor/TextureUtils.js')),'model-data':uri('export const ORIGINAL = '+JSON.stringify(portableData)+';')};
for(const name of ['interiores-biblioteca-g','interior-cafeteria','interiores-w-r','detalles-academicos-maps','detalles-deportivos-maps','jardin-tres-gracias','paisaje-h-hp','plaza-egresados',
 'paisaje-academico','sector-acceso-plaza','sector-talleres-deportes','plazas-ajedrez','recintos-deportivos',
 'detalles-maps-accesos','detalles-maps-plazas','detalles-maps-ponente','detalles-maps-corredor-cultural'])imports[name]=uri(await read('./'+name+'.js'));
let html=await read('./index.html');html=html.replace(/<script type="importmap">[\s\S]*?<\/script>/,`<script type="importmap">${JSON.stringify({imports})}</script>`).replace('<script type="module" src="./app.js"></script>',`<script type="module">${await read('./app.js')}</script>`);
await fs.writeFile(new URL('./Visor_UAM_autonomo.html',import.meta.url),html);await fs.writeFile(new URL('./campus_base.json',import.meta.url),JSON.stringify(ORIGINAL,null,2));
// La versión servida también resuelve la utilidad de exportación en la carpeta local.
const exporter=await read('./vendor/GLTFExporter.js');await fs.writeFile(new URL('./vendor/GLTFExporter.js',import.meta.url),exporter.replace("'./../utils/TextureUtils.js'","'./TextureUtils.js'"));
console.log('Visor autónomo y datos base creados.');
