import fs from 'node:fs/promises';
// Sólo informa; nunca cambia las esquinas del plano ni los archivos editados.
const {puntos,matriz}=JSON.parse(await fs.readFile(new URL('./puntos.json',import.meta.url)));
const residual=puntos.map(p=>{const v=[...p.modelo,1],en=[0,1].map(k=>v.reduce((s,x,i)=>s+x*matriz[i][k],0));return {id:p.id,metros:Math.hypot(en[0]-p.destinoEsteNorte[0],en[1]-p.destinoEsteNorte[1])};});
console.log(JSON.stringify({controles:residual,rmsInternoMetros:Math.sqrt(residual.reduce((s,p)=>s+p.metros**2,0)/residual.length),maximoMetros:Math.max(...residual.map(p=>p.metros)),advertencia:'Residuo interno; no es precisión geográfica independiente.'},null,2));
