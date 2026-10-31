import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {routeIssues,modelToGeo,geoDistance,pointInside,obstacles,cutsClosedBody} from './campus-escom/route-space.js';
import {ORIGINAL} from './campus-escom/model-data.js';
import {BASE_ROUTES,ROUTE_GEO} from './campus-escom/route-data.js';
const root=new URL('./campus-escom/',import.meta.url),read=async p=>JSON.parse(await fs.readFile(new URL(p,root),'utf8'));
const data=await read('campus_editado.json'),geo=await read('georreferencia.json'),net=await read('rutas.json'),cal=await read('calibracion/puntos.json');
assert.deepEqual(data,ORIGINAL,'Base y JSON guardado deben corresponder al checkpoint inicial.');
assert.deepEqual(BASE_ROUTES,net);assert.deepEqual(ROUTE_GEO,geo);
assert.equal(data.unit.slug,'escom');assert.equal(data.buildings.length,10);assert.equal(new Set(data.buildings.map(b=>b.id)).size,10);
assert.equal(data.buildings.find(b=>b.id==='CAF').name,'Cafetería');assert(!/[ÃÂ]/.test(JSON.stringify(data)),'Texto UTF-8 sin caracteres mal decodificados');
for(const id of ['1','2','3','4','5','LAB'])assert.equal(data.buildings.find(b=>b.id===id).floors,3,'PB/P1/P2 del plano oficial '+id);
assert.equal(data.buildings.find(b=>b.id==='GOB').floors,2);
assert.deepEqual(routeIssues(net,data,geo),[],'Red completa/conexa, sin atravesar edificios ni cruces sin nodos');
const bad=structuredClone(net);bad.nodos[1].id=bad.nodos[0].id;assert(routeIssues(bad,data,geo).some(e=>e.includes('repetido')));
const broken=structuredClone(net);broken.aristas[0].a='no_existe';assert(routeIssues(broken,data,geo).some(e=>e.includes('inexistente')));
const length=structuredClone(net);length.aristas[0].metros+=15;assert(routeIssues(length,data,geo).some(e=>e.includes('Metros incoherentes')));
const missing=structuredClone(net);missing.destinos=missing.destinos.filter(d=>d.id!=='1');assert(routeIssues(missing,data,geo).some(e=>e.includes('Falta destino')));
const disconnected=structuredClone(net);disconnected.aristas=[];assert(routeIssues(disconnected,data,geo).some(e=>e.includes('Falta conectar')));
const wrong=structuredClone(net);wrong.nodos[0].lon+=.001;assert(routeIssues(wrong,data,geo).some(e=>e.includes('Lat/lon')));
const p=obstacles(data).find(o=>o.id==='LAB').poly,center=p.reduce((s,q)=>({x:s.x+q.x/p.length,z:s.z+q.z/p.length}),{x:0,z:0});
const inside=structuredClone(net);inside.nodos[0].x=center.x;inside.nodos[0].z=center.z;Object.assign(inside.nodos[0],modelToGeo(center.x,center.z,geo));assert(routeIssues(inside,data,geo).some(e=>e.includes('cuerpo cerrado')));
assert(net.aristas.every(e=>e.accesible===false),'Sin certificar accesibilidad por una referencia satelital');
// Contrato consumido por el reconocedor y el trazado 3D de la app.
assert.deepEqual(net.destinos.map(d=>d.id).sort(),['1','2','3','4','5','LAB','GOB','AUD','CAF','CAFE','EXPLANADA','PATIO_O','PATIO_E','ACCESO_PRINCIPAL','ACCESO_GOBIERNO','ACCESO_CAFETERIA','BIBLIOTECA','GESTION','MEDICO'].sort());
for(let i=1;i<=126;i++)assert(net.nodos.some(n=>n.id==='n'+i),'Conservar nodo anterior n'+i);
assert(net.nodos.every(n=>Number.isFinite(n.x)&&Number.isFinite(n.z)&&n.nivel===0));
for(const b of data.buildings){const n=net.nodos.find(n=>n.id===net.destinos.find(d=>d.id===b.id).nodo);assert.equal(n.tipo,'entrada');let boundary=Infinity;
 for(const o of obstacles(data).filter(o=>o.id===b.id))for(let i=0;i<o.poly.length;i++){const a=o.poly[i],q=o.poly[(i+1)%o.poly.length],dx=q.x-a.x,dz=q.z-a.z,t=Math.max(0,Math.min(1,((n.x-a.x)*dx+(n.z-a.z)*dz)/(dx*dx+dz*dz)));boundary=Math.min(boundary,Math.hypot(n.x-a.x-t*dx,n.z-a.z-t*dz));}
 assert(boundary<1.5,'Destino junto a fachada, no centro: '+b.id);
 assert(Math.hypot(n.x-(b.entry[0]-895),n.z-(b.entry[1]-390))<13,'Junto al acceso de referencia: '+b.id);
}
function distance(from,to,blocked=new Set()){const source=net.destinos.find(d=>d.id===from).nodo,target=net.destinos.find(d=>d.id===to).nodo,ds=new Map([[source,0]]),done=new Set();while(true){const u=[...ds.keys()].filter(k=>!done.has(k)).sort((a,b)=>ds.get(a)-ds.get(b))[0];if(!u)return Infinity;if(u===target)return +ds.get(u).toFixed(2);done.add(u);for(const e of net.aristas){if(blocked.has(e.de)||blocked.has(e.a))continue;const v=e.de===u?e.a:e.a===u?e.de:null;if(v)ds.set(v,Math.min(ds.get(v)??Infinity,ds.get(u)+e.metros));}}}
const principal5=distance('ACCESO_PRINCIPAL','5');assert(principal5<190,'Evitar el rodeo oriente al Edificio 5');
for(const [a,b,max]of [['ACCESO_PRINCIPAL','EXPLANADA',85],['1','LAB',40],['LAB','2',45],['1','3',90],['2','4',85],['3','5',35],['4','5',80]])assert(distance(a,b)<max,`Paso corto ${a}–${b}`);
const interiorLab=net.nodos.find(n=>n.nombre==='Laboratorios · pasillo interior transversal');
assert(interiorLab&&pointInside(interiorLab,p,true),'Cruce interior de Laboratorios');
assert(distance('3','4')<60,'Conexión directa 3–LAB–4');
assert(distance('3','4',new Set([interiorLab.id]))>distance('3','4')+1,'El camino más corto usa el pasillo interior');
// Las franjas estrechas PB no autorizan interiores completos ni tramos exteriores.
const covered=net.aristas.filter(e=>{const a=net.nodos.find(n=>n.id===e.de),b=net.nodos.find(n=>n.id===e.a);return obstacles(data).some(o=>cutsClosedBody(a,b,o,data,false));});assert(covered.length>0);assert(covered.every(e=>e.tipo==='pasillo'));
const noPassage=structuredClone(net);noPassage.aristas.forEach(e=>e.tipo='exterior');assert(routeIssues(noPassage,data,geo).some(e=>e.includes('cuerpo cerrado')));
assert(cutsClosedBody({x:882.176-895,z:380.728-390},{x:864.148-895,z:435.56-390},obstacles(data).find(o=>o.id==='LAB'),data,true),'Dos extremos en pasos no habilitan atravesar el laboratorio');
// Georreferencia y métricas deben reproducir el ajuste documentado, no sólo tener números plausibles.
let sum=0,max=0;for(const c of cal.puntos){const v=[...c.modelo,1],out=[0,1].map(k=>v.reduce((s,x,i)=>s+x*cal.matriz[i][k],0)),error=Math.hypot(...out.map((x,i)=>x-c.destinoEsteNorte[i]));sum+=error*error;max=Math.max(max,error);assert(Math.abs(error-c.residuoMetros)<.0001);}
assert(Math.abs(Math.sqrt(sum/cal.puntos.length)-geo.calibracion.rmsMetros)<.0001);assert(Math.abs(max-geo.calibracion.maximoMetros)<.0001);
assert.equal(geo.calibracion.independiente,false);assert.deepEqual(geo.calibracion.incertidumbreAbsolutaMetros,[5,12]);
const plan=data.unit.plan;assert.equal(geo.ancho,(plan.xMax-plan.xMin)*plan.pxPorMetro);assert.equal(geo.alto,(plan.zMax-plan.zMin)*plan.pxPorMetro);
const origin=geo.calibracion.origen,c=Math.cos(origin[0]*Math.PI/180),R=6378137;
for(const [key,x,z]of [['superiorIzquierda',plan.xMin,plan.zMin],['superiorDerecha',plan.xMax,plan.zMin],['inferiorIzquierda',plan.xMin,plan.zMax]]){
 const v=[x,z,1],a=[0,1].map(k=>v.reduce((s,x,i)=>s+x*cal.matriz[i][k],0)),ll={lat:origin[0]+a[1]/R*180/Math.PI,lon:origin[1]+a[0]/(R*c)*180/Math.PI};assert(geoDistance(ll,{lat:geo[key][0],lon:geo[key][1]})<.001);
}
assert(geo.superiorIzquierda[0]>19.503&&geo.superiorIzquierda[0]<19.508);assert(geo.superiorIzquierda[1]>-99.150&&geo.superiorIzquierda[1]<-99.145);
for(const file of ['plano_2d.png','plano_2d_sin_marca.png']){const b=await fs.readFile(new URL(file,root));assert.equal(b.readUInt32BE(16),1220);assert.equal(b.readUInt32BE(20),1420);assert.equal(b[25],6,'PNG RGBA');}
async function glb(file){const b=await fs.readFile(new URL(file,root));assert.equal(b.readUInt32LE(0),0x46546c67);assert.equal(b.readUInt32LE(8),b.length);return JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString());}
const marked=await glb('ESCOM_IPN.glb'),plain=await glb('ESCOM_IPN_sin_marca.glb');
for(const g of [marked,plain]){
 assert(g.buffers.every(b=>!b.uri),'GLB autónomo sin buffers externos');assert((g.images||[]).every(i=>!i.uri),'Texturas embebidas');
 for(const b of data.buildings)assert(g.nodes.some(n=>n.name==='Edificio_'+b.id),'Falta edificio en GLB '+b.id);
 assert(!g.nodes.some(n=>n.name==='Editor_red_peatonal_no_exportar'),'La capa de rutas no se hornea en la maqueta');
 assert(g.nodes.some(n=>n.name==='Puente_entre_edificios_P1'));assert(g.nodes.some(n=>n.name==='Lucernario_Laboratorios'));
}
assert(marked.nodes.some(n=>n.name==='Marca_copyright_modelo'));assert(!plain.nodes.some(n=>n.name==='Marca_copyright_modelo'));
const marks=marked.nodes.filter(n=>n.name?.startsWith('Copyright_integrado_'));assert(marks.length>=12,'Repetición suficiente en este predio');assert.equal(marked.nodes.length-plain.nodes.length,marks.length+1);
const embedded=await fs.readFile(new URL('Visor_UAM_autonomo.html',root),'utf8');assert(!embedded.includes('src="./app.js"'));assert(embedded.includes('ESCOM_IPN_sin_marca.glb'));assert(embedded.includes('route-editor'));
// Las apps ya integran ESCOM: compararlas con 53967de falla por cambios ajenos
// a la red. Conservar el aislamiento histórico de UAM; para preservar incluso
// cambios móviles sin commit, comprobar un manifiesto SHA-256 tomado ANTES.
const untouched=execFileSync('git',['diff','53967de','--name-only','--','campus','campus-cuajimalpa','campus-iztapalapa','campus-xochimilco','campus-lerma'],{cwd:new URL('.',import.meta.url),encoding:'utf8'}).trim();assert.equal(untouched,'');
let protectedFiles=0;
if(process.env.CAMPUS_ESCOM_PROTEGIDOS){const manifest=JSON.parse((await fs.readFile(process.env.CAMPUS_ESCOM_PROTEGIDOS,'utf8')).replace(/^\uFEFF/,''));assert(manifest.length>0);for(const file of manifest){const hash=createHash('sha256').update(await fs.readFile(new URL(file.path,import.meta.url))).digest('hex');assert.equal(hash.toLowerCase(),file.sha256.toLowerCase(),'Archivo ajeno alterado: '+file.path);protectedFiles++;}}
console.log(JSON.stringify({ok:true,edificios:data.buildings.length,nodos:net.nodos.length,tramos:net.aristas.length,destinos:net.destinos.length,accesoPrincipalA5Metros:principal5,marcas:marks.length,plano:[geo.ancho,geo.alto],rmsInternoMetros:geo.calibracion.rmsMetros,incertidumbreAbsolutaMetros:geo.calibracion.incertidumbreAbsolutaMetros,campusUAM:'sin modificaciones desde checkpoint',archivosProtegidosVerificados:protectedFiles,proteccionApps:protectedFiles?'SHA-256 contra estado anterior':'Opcional: CAMPUS_ESCOM_PROTEGIDOS = manifiesto anterior'},null,2));
