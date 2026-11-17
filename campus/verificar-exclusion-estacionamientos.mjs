import assert from 'node:assert/strict';
import {rectanglePolygon,segmentPolygon,convexHull,polygonArea,polygonsOverlap,subtractObstacles} from './site-clearance.js';

const rect=rectanglePolygon;
// Un centro libre NO basta: el borde de un cajón alcanza la obra.
assert(polygonsOverlap(rect(0,0,2.7,4.6),rect(2,0,1.5,8)));
// Recortar un camellón continuo deja dos piezas, sin cerrar de nuevo el hueco.
const median=rect(0,0,20,1.35),building=rect(0,0,4,8),pieces=subtractObstacles(median,[building]);
assert.equal(pieces.length,2);
assert(Math.abs(pieces.reduce((s,p)=>s+polygonArea(p),0)-16*1.35)<1e-7);
assert(pieces.every(p=>!polygonsOverlap(p,building)));
// La reserva de una escultura trasladada/rotada depende de su geometría actual.
const moved=rect(12,6,7,4,Math.PI/3);
assert(polygonsOverlap(rect(12,6,2,2),moved));
assert(!polygonsOverlap(rect(0,0,2,2),moved));
// Un hueco interior genera piezas reales alrededor; no sólo se comprueban sus vértices.
const courtyard=rect(0,0,10,10),statue=rect(0,0,2,2),ring=subtractObstacles(courtyard,[statue]);
assert(Math.abs(ring.reduce((s,p)=>s+polygonArea(p),0)-96)<1e-7);
assert(ring.every(p=>!polygonsOverlap(p,statue)));
// Varios obstáculos y un aparcamiento girado/no uniforme conservan exclusión total.
const parking=rect(4,-3,30,14,Math.PI/5),cuts=[rect(1,0,7,5),rect(10,-5,3,6,Math.PI/7),segmentPolygon({x:-15,z:0},{x:20,z:0},2)];
const clipped=subtractObstacles(parking,cuts);
assert(clipped.length>1);
assert(clipped.every(p=>cuts.every(o=>!polygonsOverlap(p,o))));
for(let i=0;i<clipped.length;i++)for(let j=i+1;j<clipped.length;j++)assert(!polygonsOverlap(clipped[i],clipped[j]));
assert.equal(convexHull([{x:0,z:0},{x:2,z:0},{x:2,z:1},{x:0,z:1},{x:1,z:.5}]).length,4);
assert(!polygonsOverlap(rect(0,0,2,2),rect(2,0,2,2)));
console.log('Exclusión de estacionamientos: 8 escenarios de huella completa/recorte/translación/giro satisfactorios.');
