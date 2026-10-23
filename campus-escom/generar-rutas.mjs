import fs from 'node:fs/promises';
import {obstacles,pointInside,segmentCuts,modelToGeo,edgeMeters,routeIssues} from './route-space.js';
const data=JSON.parse(await fs.readFile(new URL('./campus_editado.json',import.meta.url))),geo=JSON.parse(await fs.readFile(new URL('./georreferencia.json',import.meta.url)));
const blocks=obstacles(data),site=data.site.map(p=>({x:p[0]-895,z:p[1]-390}));
const point=p=>({x:+(p[0]-895).toFixed(4),z:+(p[1]-390).toFixed(4)});
const free=p=>pointInside(p,site)&&!blocks.some(b=>pointInside(p,b.poly,true));
const visible=(a,b)=>[.1,.3,.5,.7,.9].every(t=>pointInside({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t},site))&&!blocks.some(o=>segmentCuts(a,b,o.poly));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),key=p=>p.x.toFixed(3)+','+p.z.toFixed(3);
const corners=[];
for(const b of blocks)for(const p of b.poly)for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const q={x:p.x+dx*.65,z:p.z+dz*.65};if(free(q))corners.push(q);}
const unique=arr=>[...new Map(arr.map(p=>[key(p),p])).values()];
const candidates=unique(corners),segments=[];
function detour(a,b){
 if(visible(a,b))return [a,b];
 const ps=[a,b,...candidates],dist=ps.map(()=>Infinity),previous=[],done=new Set();dist[0]=0;
 for(let step=0;step<ps.length;step++){
  let u=-1;for(let i=0;i<ps.length;i++)if(!done.has(i)&&(u<0||dist[i]<dist[u]))u=i;
  if(u<0||!Number.isFinite(dist[u]))break;if(u===1){const path=[];for(let v=1;v!==undefined;v=previous[v])path.unshift(ps[v]);return path;}done.add(u);
  for(let v=0;v<ps.length;v++){if(done.has(v))continue;const d=dist[u]+distance(ps[u],ps[v]);if(d<dist[v]&&visible(ps[u],ps[v])){dist[v]=d;previous[v]=u;}}
 }
 throw Error('No hay camino exterior entre '+key(a)+' y '+key(b));
}
const corrections=[];
function walkPoint(raw){const p=point(raw);if(free(p))return p;
 const options=[];for(const b of blocks){const q=nearestBoundary(p,[b.poly]);for(let i=0;i<16;i++){const a=i*Math.PI/8,s={x:q.x+.8*Math.cos(a),z:q.z+.8*Math.sin(a)};if(free(s))options.push(s);}}
 const q=options.sort((a,b)=>distance(a,p)-distance(b,p))[0];if(!q)throw Error('Punto exterior no encontrado');corrections.push({original:p,corregido:q});return q;}
for(const stroke of data.walkways){const ps=stroke.map(walkPoint);for(let i=1;i<ps.length;i++){
 const way=detour(ps[i-1],ps[i]);for(let j=1;j<way.length;j++)segments.push([way[j-1],way[j]]);
}}
const destinations=[];
function nearestBoundary(p,polygons){let answer,dmin=Infinity;for(const poly of polygons)for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz)));const q={x:a.x+t*dx,z:a.z+t*dz},d=distance(p,q);if(d<dmin){dmin=d;answer=q;}}return answer;}
function connect(id,nombre,p){
 if(!free(p))throw Error('Destino no transitable '+id);
 const vs=unique(segments.flat()).sort((a,b)=>distance(a,p)-distance(b,p)),v=vs.find(a=>visible(a,p));
 if(v){if(distance(p,v)>.005)segments.push([p,v]);}
 else{let path;for(const q of vs.slice(0,20)){try{path=detour(p,q);break;}catch{}}if(!path)throw Error('Destino aislado '+id+' '+JSON.stringify(p));for(let i=1;i<path.length;i++)segments.push([path[i-1],path[i]]);}
 destinations.push({id,nombre,p});
}
for(const b of data.buildings){let p=nearestBoundary(point(b.entry),blocks.filter(o=>o.id===b.id).map(o=>o.poly));connect(b.id,b.name,p);}
for(const p of data.plazas){const ps=p.polygon.map(point),center=ps.reduce((a,p)=>({x:a.x+p.x/ps.length,z:a.z+p.z/ps.length}),{x:0,z:0});connect(p.id,p.name,center);}
for(const g of data.gates)connect('ACCESO_'+g.id,g.name,point(g.point));
for(const [id,nombre]of [['BIBLIOTECA','Biblioteca · Gobierno PB'],['GESTION','Gestión Escolar · Gobierno PB'],['MEDICO','Servicios de salud · Gobierno PB']])destinations.push({id,nombre,p:destinations.find(d=>d.id==='GOB').p});
// Split intersections and destination points, keeping undirected edges without duplicates.
const split=segments.map(()=>[0,1]);
for(let i=0;i<segments.length;i++)for(let j=i+1;j<segments.length;j++){
 const [a,b]=segments[i],[c,d]=segments[j],dx=b.x-a.x,dz=b.z-a.z,ex=d.x-c.x,ez=d.z-c.z,det=dx*ez-dz*ex;
 if(Math.abs(det)<1e-10)continue;const t=((c.x-a.x)*ez-(c.z-a.z)*ex)/det,u=((c.x-a.x)*dz-(c.z-a.z)*dx)/det;
 if(t>=0&&t<=1&&u>=0&&u<=1){split[i].push(t);split[j].push(u);}
}
for(const [i,[a,b]]of segments.entries())for(const p of segments.flat()){
 const dx=b.x-a.x,dz=b.z-a.z,dd=dx*dx+dz*dz,t=((p.x-a.x)*dx+(p.z-a.z)*dz)/dd;
 if(t>0&&t<1&&Math.abs((p.x-a.x)*dz-(p.z-a.z)*dx)/Math.sqrt(dd)<.003)split[i].push(t);
}
const net={version:1,unidad:'escom',nodos:[],aristas:[],destinos:[],evidencia:{estado:'borrador exterior contrastado con croquis; sin recorrido de campo',accesibilidad:'Sin verificación; accesible=false por prudencia. No es una red de evacuación ni certificación de accesibilidad.',accesos:'Principal/Gobierno contrastados; cafetería documentada en 2020, apertura actual por verificar.'}},nodes=new Map(),edges=new Set();
function node(p){const k=key(p);if(!nodes.has(k)){const n={id:'n'+(nodes.size+1),x:+p.x.toFixed(4),z:+p.z.toFixed(4),...modelToGeo(p.x,p.z,geo),nivel:0,tipo:'cruce'};nodes.set(k,n);net.nodos.push(n);}return nodes.get(k);}
for(const [i,[a,b]]of segments.entries()){
 const ts=[...new Set(split[i].map(v=>+v.toFixed(8)))].sort((a,b)=>a-b);
 for(let j=1;j<ts.length;j++){const p=t=>({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t}),n=node(p(ts[j-1])),m=node(p(ts[j]));if(n===m)continue;const k=[n.id,m.id].sort().join('|');if(edges.has(k))continue;edges.add(k);net.aristas.push({de:n.id,a:m.id,metros:edgeMeters(n,m),tipo:'exterior',accesible:false});}
}
for(const d of destinations){const n=node(d.p);n.tipo=d.id.startsWith('ACCESO_')?'acceso':'entrada';net.destinos.push({id:d.id,nombre:d.nombre,nodo:n.id});}
const errors=routeIssues(net,data,geo);console.log(JSON.stringify({nodos:net.nodos.length,tramos:net.aristas.length,destinos:net.destinos.length,puntosInicialesOmitidosPorCuerpo:corrections.length,errores:errors},null,2));
if(errors.length)process.exitCode=1;
else if(process.argv.includes('--write'))await fs.writeFile(new URL('./rutas.json',import.meta.url),JSON.stringify(net,null,2));
