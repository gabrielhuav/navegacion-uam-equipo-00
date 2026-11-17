// Mobiliario y acabados observados en fotografías exteriores del corpus.
// Las posiciones nuevas son esquemáticas; nunca crean destinos ni accesibilidad.
import {rectanglePolygon, segmentPolygon, polygonsOverlap} from 'site-clearance';

const VERSION = '2026-11-17-entorno';
const NOMBRE = 'Entorno_corpus_2026_11_17';
const EPS = 1e-6;

function circle(x, z, r, count = 24) {
  return Array.from({length: count}, (_, i) => ({x: x + r * Math.cos(i * Math.PI * 2 / count),
    z: z + r * Math.sin(i * Math.PI * 2 / count)}));
}

function contextoSeguro({THREE, data, world, X, Z, S, net}) {
  world.updateWorldMatrix(true, true);
  const inversa = world.matrixWorld.clone().invert();
  const localCampus = (parent, x, z) => {
    const p = new THREE.Vector3(x, 0, z).applyMatrix4(parent.matrixWorld).applyMatrix4(inversa);
    return {x: p.x, z: p.z};
  };
  const obstacles = [], routeObstacles = [];
  for (const b of data.buildings) for (const r of b.rects) {
    const factor = b.diamond ? Math.SQRT1_2 : 1;
    obstacles.push(rectanglePolygon(X((r[0] + r[2]) / 2) + (b.offsetX || 0),
      Z((r[1] + r[3]) / 2) + (b.offsetZ || 0),
      (r[2] - r[0]) * S() * factor + .3, (r[3] - r[1]) * S() * factor + .3,
      b.diamond ? (b.facadeYaw ?? Math.PI / 4) : 0));
  }
  for (const r of data.paths || []) obstacles.push(rectanglePolygon(X((r[0] + r[2]) / 2),
    Z((r[1] + r[3]) / 2), (r[2] - r[0]) * S() + .16, (r[3] - r[1]) * S() + .16));
  if (typeof net === 'function') net = net();
  const nodes = new Map((net?.nodos || []).map(n => [n.id, n]));
  for (const e of net?.aristas || []) {
    const a = nodes.get(e.de), b = nodes.get(e.a);
    if (a && b && Math.hypot(b.x - a.x, b.z - a.z) > EPS) {
      // Máscara circunscrita en los extremos: no dejar huecos entre vértices.
      const masks = [segmentPolygon(a, b, 1.8), circle(a.x, a.z, .9 / Math.cos(Math.PI / 24)),
        circle(b.x, b.z, .9 / Math.cos(Math.PI / 24))];
      obstacles.push(...masks); routeObstacles.push(...masks);
    }
  }
  // No se colocan nuevos muebles sobre las bases existentes de esculturas.
  for (const child of world.children) {
    if (!child.userData?.editableId || !/(sculpture|letters_|caracol)/.test(child.userData.editableId)) continue;
    const box = new THREE.Box3().setFromObject(child);
    if (box.isEmpty()) continue;
    const corners = [[box.min.x, box.min.z], [box.max.x, box.min.z],
      [box.max.x, box.max.z], [box.min.x, box.max.z]].map(([x,z]) => {
      const p = new THREE.Vector3(x, 0, z).applyMatrix4(inversa); return {x:p.x,z:p.z};
    });
    obstacles.push(corners);
  }
  const clear = poly => poly.length >= 3 && !obstacles.some(o => polygonsOverlap(poly, o));
  const footprint = (parent, x, z, width, depth, yaw = 0) =>
    rectanglePolygon(x, z, width, depth, yaw).map(p => localCampus(parent, p.x, p.z));
  const bounds = poly => ({minX:Math.min(...poly.map(p=>p.x)),maxX:Math.max(...poly.map(p=>p.x)),
    minZ:Math.min(...poly.map(p=>p.z)),maxZ:Math.max(...poly.map(p=>p.z))});
  const routesWithBounds=routeObstacles.map(poly=>({poly,...bounds(poly)}));
  const routesClear = triangles => {
    const b=bounds(triangles.flat()),near=routesWithBounds.filter(r=>
      r.minX<b.maxX&&r.maxX>b.minX&&r.minZ<b.maxZ&&r.maxZ>b.minZ);
    return !triangles.some(tri => near.some(r => polygonsOverlap(tri,r.poly)));
  };
  return {clear, footprint, localCampus, routesClear};
}

// Triángulos reales en la planta del padre, incluidos el grosor del arco.
function trianglesInParent(THREE, mesh) {
  mesh.updateWorldMatrix(true, false);
  const matrix = mesh.parent.matrixWorld.clone().invert().multiply(mesh.matrixWorld);
  const positions = mesh.geometry.getAttribute('position'), index = mesh.geometry.index;
  const vertices = Array.from({length:positions.count}, (_, i) => {
    const p = new THREE.Vector3().fromBufferAttribute(positions, i).applyMatrix4(matrix);
    return {x:p.x, z:p.z};
  });
  const triangles = [];
  for (let i=0; i<(index?.count ?? positions.count); i+=3) {
    const tri=[0,1,2].map(j=>vertices[index ? index.getX(i+j) : i+j]);
    const [a,b,c]=tri;
    if(Math.abs((b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x))>EPS)triangles.push(tri);
  }
  return triangles;
}

function despejarBancaJ(ctx, safe, bench, floor, garden) {
  const triangles=trianglesInParent(ctx.THREE,bench),parent=bench.parent;
  const inCampus=polys=>polys.map(tri=>tri.map(p=>safe.localCampus(parent,p.x,p.z)));
  if(safe.routesClear(inCampus(triangles)))return null;
  const points=triangles.flat(), center=points.reduce((v,p)=>({x:v.x+p.x/points.length,z:v.z+p.z/points.length}),{x:0,z:0});
  const gardenMask=circle(garden.position.x,garden.position.z,garden.geometry.parameters.radiusTop+.06,36);
  // Primer desplazamiento libre en pasos de .01 unidades locales hacia el centro.
  // La forma, escala y giro del arco permanecen intactos.
  for(let step=1;step<=300;step++)for(const [ux,uz]of [[0,1],[0,-1],[1,0],[-1,0]]){
    if(ux*center.x+uz*center.z>=-EPS)continue;
    const dx=ux*step*.01,dz=uz*step*.01;
    const moved=triangles.map(tri=>tri.map(p=>({x:p.x+dx,z:p.z+dz})));
    if(moved.some(tri=>tri.some(p=>Math.hypot(p.x-floor.position.x,p.z-floor.position.z)>floor.geometry.parameters.radiusTop-.04)))continue;
    if(moved.some(tri=>polygonsOverlap(tri,gardenMask)))continue;
    // Reserva extra de .02: exigir también libre el arco trasladado hacia cada lado.
    if(![[0,0],[.02,0],[-.02,0],[0,.02],[0,-.02]].every(([mx,mz])=>
      safe.routesClear(inCampus(moved.map(tri=>tri.map(p=>({x:p.x+mx,z:p.z+mz})))))))continue;
    bench.position.x+=dx;bench.position.z+=dz;
    return {dx,dz,step:.01,clearanceWidth:1.8,extraMargin:.02,approximate:true};
  }
  return {unresolved:true};
}

function plazaTop(data, world, X, Z, S, name) {
  const spec = data.plazas.find(p => p.name === name);
  if (!spec) return .355;
  const r = spec.rect, x = X((r[0] + r[2]) / 2), z = Z((r[1] + r[3]) / 2);
  const mesh = world.children.find(n => n.isMesh && Math.abs(n.position.x - x) < EPS &&
    Math.abs(n.position.z - z) < EPS && Math.abs(n.scale.x - (r[2] - r[0]) * S()) < EPS &&
    Math.abs(n.scale.z - (r[3] - r[1]) * S()) < EPS);
  return mesh ? mesh.position.y + mesh.scale.y / 2 : .355;
}

function makeHelpers({THREE, box, material}, report) {
  const halfSphere = new THREE.SphereGeometry(1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 16);
  const hex = new THREE.CylinderGeometry(1, 1, 1, 6);
  function mesh(parent, name, geometry, color, x, y, z, sx, sy, sz, obstacle = true) {
    const n = new THREE.Mesh(geometry, typeof color === 'string' ? material(color) : color);
    n.name = name; n.position.set(x, y, z); n.scale.set(sx, sy, sz);
    n.receiveShadow = true; n.castShadow = false; n.userData={corpusEnvironment:VERSION,pedestrianObstacle:obstacle,groundSurface:!obstacle}; parent.add(n); report.mallasNuevas++; return n;
  }
  function caja(parent, name, x, y, z, w, h, d, color, obstacle = true) {
    const n = box(parent, name, x, y, z, w, h, d, color);
    n.castShadow = false; n.userData={corpusEnvironment:VERSION,pedestrianObstacle:obstacle,groundSurface:!obstacle}; report.mallasNuevas++; return n;
  }
  return {mesh, caja, halfSphere, cylinder, hex};
}

function completarBotes(ctx, safe, h, report) {
  const {THREE, data, world, X, Z, S} = ctx;
  const botes = []; world.traverse(n => {if (n.isMesh && n.name === 'Bote_doble_Plaza_Roja') botes.push(n);});
  const floor = plazaTop(data, world, X, Z, S, 'Plaza Roja');
  for (const [i, bote] of botes.entries()) {
    const w = bote.scale.x, d = bote.scale.z, alto = bote.scale.y;
    if (!safe.clear(safe.footprint(bote.parent, bote.position.x, bote.position.z, w + .12, d + .12))) {
      report.botesSinTapaPorReserva++; continue;
    }
    const originalY = bote.position.y;
    // La caja anterior penetraba el piso de la plaza: apoyar el cuerpo en él.
    bote.position.y = floor + .015 + alto / 2;
    bote.userData={...bote.userData,corpusEnvironment:VERSION,pedestrianObstacle:true,groundSurface:false,existingFootprintPreserved:true,evidence:['imagen_0025.png','imagen_0040.png']};
    const grupo = new THREE.Group(); grupo.name = 'Bote_tapa_y_boca_corpus_' + i;
    grupo.position.copy(bote.position); grupo.quaternion.copy(bote.quaternion);
    grupo.userData = {approximate:true, evidence:['imagen_0025.png','imagen_0040.png'],
      purpose:'Tapa abombada y boca de depósito; cuerpo apoyado en pavimento', priorBodyY:originalY,corpusEnvironment:VERSION,environmentRole:'furniture'};
    bote.parent.add(grupo);
    const y = alto / 2, c = bote.material;
    h.mesh(grupo,'Bote_cubierta_abombada_corpus',h.halfSphere,c,0,y+.19,0,w*.6,.15,d*.62);
    for (const side of [-1,1]) h.caja(grupo,'Bote_soporte_tapa_corpus',side*(w*.47),y+.095,0,.04,.19,d+.04,c.color.getStyle());
    h.caja(grupo,'Bote_trasera_boca_corpus',0,y+.095,-d/2-.005,w,.19,.025,c.color.getStyle());
    h.caja(grupo,'Bote_hueco_deposito_corpus',0,y+.09,d/2-.04,w*.72,.15,.035,'#1f2925');
    h.caja(grupo,'Bote_placa_neutra_corpus',0,.01,d/2+.012,w*.48,alto*.47,.018,
      c.color.getHexString()==='eceee9'?'#b1b7b1':'#e5e7df');
    report.botesCompletados++;
  }
}

function plazuelaJ(ctx, safe, h, report) {
  const {THREE, world} = ctx, parent = world.getObjectByName('Plazuela_bancas_curvas_J');
  if (!parent) return;
  const floor = parent.children.find(n => n.isMesh && n.geometry.parameters?.radiusTop > 5);
  const garden = parent.children.find(n => n.isMesh && n.geometry.parameters?.radiusTop < 2);
  if (!floor || !garden) return;
  const top = floor.position.y + floor.geometry.parameters.height * floor.scale.y / 2;
  const grupo = new THREE.Group(); grupo.name='Plazuela_J_pavimento_y_delimitadores_corpus';
  grupo.userData={approximate:true,evidence:['imagen_0146.png','imagen_0148.png','imagen_0150.png','imagen_0155.png'],
    purpose:'Losetas y franjas de pavimento; delimitación esquemática del jardín existente',corpusEnvironment:VERSION,environmentRole:'assembly'}; parent.add(grupo);
  // Las dos bancas estaban suspendidas .46 sobre el piso por su traslación.
  for (const bench of parent.children.filter(n=>n.isMesh && n.name==='Banca_curva_plazuela_J')) {
    bench.userData={...bench.userData,corpusSupportCorrection:true,previousLocalY:bench.position.y,previousLocalPosition:bench.position.toArray(),evidence:['imagen_0155.png'],corpusEnvironment:VERSION,pedestrianObstacle:true,groundSurface:false,existingFootprintPreserved:true};
    bench.position.y=top; report.bancasApoyadas++;
    const adjustment=despejarBancaJ(ctx,safe,bench,floor,garden);
    if(adjustment){
      bench.userData.corpusRouteAdjustment=adjustment;
      if(adjustment.unresolved)report.bancasSinResolver++;
      else{bench.userData.existingFootprintPreserved=false;report.bancasReubicadas++;}
    }
  }
  const inner=garden.geometry.parameters.radiusTop+.12, outer=4.08, cell=1.2;
  for(let xi=-3;xi<=3;xi++)for(let zi=-3;zi<=3;zi++){
    const x=xi*cell,z=zi*cell,poly=rectanglePolygon(x,z,cell-.055,cell-.055);
    if(poly.some(p=>Math.hypot(p.x,p.z)>outer)||polygonsOverlap(poly,circle(0,0,inner)))continue;
    h.caja(grupo,'Paño_loseta_gris_plazuela_corpus',x,top+.012,z,cell-.055,.022,cell-.055,
      (xi+zi)%2?'#a9aea6':'#bfc2b9',false); report.panosPavimento++;
  }
  for(let i=0;i<4;i++){
    const a=i*Math.PI/2,from=inner+.05,to=4.05,r=(from+to)/2;
    const band=h.caja(grupo,'Franja_clara_plazuela_corpus',Math.cos(a)*r,top+.03,Math.sin(a)*r,to-from,.025,.28,'#d6d0aa',false);
    band.rotation.y=-a; report.franjasPavimento++;
  }
  // Sólo sobre el pequeño jardín ya existente: no inventar una huella verde.
  const r=garden.geometry.parameters.radiusTop-.02, base=garden.position.y+garden.geometry.parameters.height/2;
  const points=Array.from({length:10},(_,i)=>({x:r*Math.cos(i*Math.PI*2/10),z:r*Math.sin(i*Math.PI*2/10)}));
  const allowed=points.map(p=>safe.clear(safe.footprint(parent,p.x,p.z,.16,.16)));
  for(let i=0;i<points.length;i++){
    if(!allowed[i])continue; const p=points[i];
    h.mesh(grupo,'Poste_delimitador_jardin_corpus',h.cylinder,'#8c9898',p.x,base+.34,p.z,.042,.68,.042);
    h.mesh(grupo,'Remate_poste_delimitador_corpus',h.halfSphere,'#bac3bf',p.x,base+.68,p.z,.058,.035,.058);
    report.postesJardin++;
    const j=(i+1)%points.length;if(!allowed[j])continue;const q=points[j];
    const poly=segmentPolygon(p,q,.045).map(v=>safe.localCampus(parent,v.x,v.z));if(!safe.clear(poly))continue;
    const cord=h.caja(grupo,'Cordon_delimitador_jardin_corpus',(p.x+q.x)/2,base+.52,(p.z+q.z)/2,.025,.025,Math.hypot(q.x-p.x,q.z-p.z),'#a5aeaa');
    cord.rotation.y=Math.atan2(q.x-p.x,q.z-p.z); report.cordonesJardin++;
  }
}

function drenaje(ctx, safe, h, report, marker) {
  const {THREE, data, world, X, Z, S} = ctx;
  const sculpture=world.getObjectByName('Escultura_vidrio_COSEI');
  if(!sculpture)return;
  const anchor=safe.localCampus(sculpture,0,0),p=data.plazas.find(p=>p.name==='Plaza COSEI');if(!p)return;
  const r=p.rect, dentro=pos=>pos.x-.46>X(r[0])&&pos.x+.46<X(r[2])&&pos.z-.46>Z(r[1])&&pos.z+.46<Z(r[3]);
  const candidates=[[2.4,-6.8],[3.6,-5.7],[-2.4,-6.8],[3.6,5.7]];
  const pos=candidates.map(([x,z])=>({x:anchor.x+x,z:anchor.z+z})).find(v=>dentro(v)&&safe.clear(circle(v.x,v.z,.46)));
  if(!pos)return;
  const group=new THREE.Group();group.name='Drenaje_circular_corpus_COSEI';group.position.set(pos.x,plazaTop(data,world,X,Z,S,'Plaza COSEI')+.003,pos.z);
  group.userData={approximate:true,evidence:['imagen_0148.png'],positionStatus:'Posición esquemática en pavimento existente, sin coordenada de campo',corpusEnvironment:VERSION,environmentRole:'groundSurface'};marker.add(group);
  h.mesh(group,'Fondo_oscuro_rejilla_corpus',h.cylinder,'#26322c',0,0,0,.38,.008,.38,false);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.38,.012,5,24),ctx.material('#737d72'));
  ring.name='Aro_drenaje_circular_corpus';ring.rotation.x=-Math.PI/2;ring.position.y=.009;ring.userData={corpusEnvironment:VERSION,pedestrianObstacle:false,groundSurface:true};group.add(ring);report.mallasNuevas++;
  for(let i=-3;i<=3;i++){
    const x=i*.085,len=2*Math.sqrt(.32*.32-x*x);
    h.caja(group,'Barra_rejilla_drenaje_corpus',x,.014,0,.035,.012,len,'#677468',false);
  }
  for(const z of [-.16,.16])h.caja(group,'Travesano_rejilla_drenaje_corpus',0,.016,z,.58,.012,.028,'#677468',false);
  report.drenajes++;
}

function mesaPlazaRoja(ctx, safe, h, report, marker){
  const {THREE,data,world,X,Z,S}=ctx,p=data.plazas.find(p=>p.name==='Plaza Roja');if(!p)return;
  const r=p.rect,margin=2.2,candidates=[[.28,.28],[.68,.68],[.3,.7],[.7,.3],[.45,.52]].map(([u,v])=>({x:X(r[0]+u*(r[2]-r[0])),z:Z(r[1]+v*(r[3]-r[1]))}));
  const treeMasks=(data.jacarandas||[]).map(([x,z])=>circle(X(x),Z(z),1.5));
  const pos=candidates.find(v=>v.x-margin>X(r[0])&&v.x+margin<X(r[2])&&v.z-margin>Z(r[1])&&v.z+margin<Z(r[3])&&
    safe.clear(rectanglePolygon(v.x,v.z,margin*2,margin*2))&&!treeMasks.some(t=>polygonsOverlap(rectanglePolygon(v.x,v.z,margin*2,margin*2),t)));
  if(!pos)return;
  const group=new THREE.Group();group.name='Mesa_y_bancos_Plaza_Roja_corpus';group.position.set(pos.x,plazaTop(data,world,X,Z,S,'Plaza Roja'),pos.z);
  group.userData={approximate:true,evidence:['internet_000003'],positionStatus:'Una representación esquemática dentro de la plaza; no inventario ni ubicación medida',corpusEnvironment:VERSION,environmentRole:'furniture'};marker.add(group);
  h.mesh(group,'Pedestal_mesa_Plaza_Roja_corpus',h.cylinder,'#a8aa9f',0,.36,0,.2,.72,.2);
  h.mesh(group,'Tablero_hexagonal_Plaza_Roja_corpus',h.hex,'#c6c3b4',0,.79,0,.98,.13,.98);
  for(let i=0;i<6;i++){
    const a=i*Math.PI/3,x=Math.cos(a)*1.48,z=Math.sin(a)*1.48;
    h.mesh(group,'Base_banco_Plaza_Roja_corpus',h.cylinder,'#a5a79c',x,.19,z,.16,.38,.16);
    const seat=h.mesh(group,'Asiento_banco_Plaza_Roja_corpus',h.hex,'#bbb9ab',x,.43,z,.37,.16,.37);seat.rotation.y=a;
  }
  report.mesasPlazaRoja++;
}

/** Añadir después de COSEI/edificios/plazuela y antes de calcular reservas de parking. */
export function agregarEntornoCorpus(ctx){
  if(ctx.world.getObjectByName(NOMBRE))return {version:VERSION,idempotente:true,mallasNuevas:0};
  const report={version:VERSION,idempotente:false,mallasNuevas:0,botesCompletados:0,botesSinTapaPorReserva:0,
    bancasApoyadas:0,bancasReubicadas:0,bancasSinResolver:0,panosPavimento:0,franjasPavimento:0,postesJardin:0,cordonesJardin:0,drenajes:0,mesasPlazaRoja:0};
  const marker=new ctx.THREE.Group();marker.name=NOMBRE;marker.userData={version:VERSION,approximate:true,corpusEnvironment:VERSION,environmentRole:'assembly'};ctx.world.add(marker);
  const safe=contextoSeguro(ctx),h=makeHelpers(ctx,report);
  completarBotes(ctx,safe,h,report);plazuelaJ(ctx,safe,h,report);drenaje(ctx,safe,h,report,marker);mesaPlazaRoja(ctx,safe,h,report,marker);
  marker.userData.report={...report};ctx.world.updateWorldMatrix(true,true);return report;
}
