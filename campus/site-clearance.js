// Geometría de exclusión en planta. Metros del modelo, sin GPS ni supuestos de accesibilidad.
const EPS=1e-8;
export function polygonArea(poly){return Math.abs(signedArea(poly));}
function signedArea(poly){return poly.reduce((s,p,i)=>{const q=poly[(i+1)%poly.length];return s+p.x*q.z-q.x*p.z;},0)/2;}
function clean(poly){const out=[];for(const p of poly)if(!out.length||Math.hypot(p.x-out.at(-1).x,p.z-out.at(-1).z)>EPS)out.push(p);if(out.length>1&&Math.hypot(out[0].x-out.at(-1).x,out[0].z-out.at(-1).z)<EPS)out.pop();return out.length>=3&&polygonArea(out)>EPS?out:[];}
function ccw(poly){return signedArea(poly)<0?[...poly].reverse():poly;}
export function rectanglePolygon(x,z,width,depth,yaw=0){const c=Math.cos(yaw),s=Math.sin(yaw);return [[-width/2,-depth/2],[width/2,-depth/2],[width/2,depth/2],[-width/2,depth/2]].map(([u,v])=>({x:x+u*c+v*s,z:z-u*s+v*c}));}
export function segmentPolygon(a,b,width){return rectanglePolygon((a.x+b.x)/2,(a.z+b.z)/2,width,Math.hypot(b.x-a.x,b.z-a.z),Math.atan2(b.x-a.x,b.z-a.z));}
export function convexHull(points){
 const sorted=points.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.z)).map(p=>({x:p.x,z:p.z})).sort((a,b)=>a.x-b.x||a.z-b.z),unique=sorted.filter((p,i)=>!i||p.x!==sorted[i-1].x||p.z!==sorted[i-1].z);
 if(unique.length<3)return [];
 const turn=(a,b,c)=>(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x),lower=[],upper=[];
 for(const p of unique){while(lower.length>1&&turn(lower.at(-2),lower.at(-1),p)<=EPS)lower.pop();lower.push(p);}
 for(const p of [...unique].reverse()){while(upper.length>1&&turn(upper.at(-2),upper.at(-1),p)<=EPS)upper.pop();upper.push(p);}
 return clean([...lower.slice(0,-1),...upper.slice(0,-1)]);
}
/** Contacto de bordes sin área compartida no es una invasión. Comprueba el polígono completo. */
export function polygonsOverlap(a,b){
 if(a.length<3||b.length<3)return false;
 for(const poly of [a,b])for(let i=0;i<poly.length;i++){
  const p=poly[i],q=poly[(i+1)%poly.length],nx=-(q.z-p.z),nz=q.x-p.x;
  const aa=a.map(v=>v.x*nx+v.z*nz),bb=b.map(v=>v.x*nx+v.z*nz);
  if(Math.min(...aa)>=Math.max(...bb)-EPS||Math.min(...bb)>=Math.max(...aa)-EPS)return false;
 }
 return true;
}
function halfPlane(poly,a,b,inside){
 const distance=p=>(b.x-a.x)*(p.z-a.z)-(b.z-a.z)*(p.x-a.x),keep=d=>inside?d>=-EPS:d<=EPS,out=[];
 for(let i=0;i<poly.length;i++){
  const p=poly[i],q=poly[(i+1)%poly.length],dp=distance(p),dq=distance(q),kp=keep(dp),kq=keep(dq);
  if(kp)out.push(p);
  if(kp!==kq){const t=dp/(dp-dq);out.push({x:p.x+(q.x-p.x)*t,z:p.z+(q.z-p.z)*t});}
 }
 return clean(out);
}
export function intersectConvex(subject,obstacle){let result=subject;const clip=ccw(obstacle);for(let i=0;i<clip.length&&result.length;i++)result=halfPlane(result,clip[i],clip[(i+1)%clip.length],true);return result;}
/** Resta convexa: los fragmentos no se solapan y no rellena agujeros con una caja nueva. */
export function subtractConvex(subject,obstacle){
 if(!polygonsOverlap(subject,obstacle))return [subject];
 let candidate=ccw(subject);const cutter=ccw(obstacle),pieces=[];
 for(let i=0;i<cutter.length&&candidate.length;i++){
  const a=cutter[i],b=cutter[(i+1)%cutter.length],outside=halfPlane(candidate,a,b,false);
  if(outside.length)pieces.push(outside);
  candidate=halfPlane(candidate,a,b,true);
 }
 return pieces;
}
export function subtractObstacles(subject,obstacles,minArea=.012){
 let pieces=[subject];
 for(const obstacle of obstacles){pieces=pieces.flatMap(p=>subtractConvex(p,obstacle)).filter(p=>polygonArea(p)>=minArea);if(!pieces.length)break;}
 return pieces;
}
