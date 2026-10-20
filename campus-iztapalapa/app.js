import * as THREE from 'three';
import {OrbitControls} from 'orbit';
import {GLTFExporter} from 'exporter';
import {ORIGINAL} from 'model-data';
import {copyrightPanelsForSite} from 'copyright-layout';

const UNIT=ORIGINAL.unit;
const $=id=>document.getElementById(id);
const editables=new Map();
let editMode=false,editSelected='',undoHistory=[],redoHistory=[],savedData='',isSaving=false,drawStart=null,drawPreview=null,dragEdit=null;
let georeference=null;
let data=structuredClone(ORIGINAL), world, vegetation, buildingGroups=new Map(), labels=[], selected='', topMode=false,focusMode=false;
const mount=$('viewport'), labelLayer=$('labels');
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor('#edf1ed');renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
mount.prepend(renderer.domElement);
const scene=new THREE.Scene();scene.fog=new THREE.Fog('#edf1ed',1400,2300);
scene.add(new THREE.HemisphereLight('#fff6e6','#4b6750',2.3));
const sun=new THREE.DirectionalLight('#fff3de',3);sun.position.set(-280,550,320);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-500,right:500,top:500,bottom:-500,near:1,far:1200});sun.shadow.bias=-.0003;sun.shadow.normalBias=.5;scene.add(sun);
const perspective=new THREE.PerspectiveCamera(42,1,1,3000), ortho=new THREE.OrthographicCamera(-460,460,270,-270,1,2500);let camera=perspective;
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=30;controls.maxDistance=1500;controls.maxPolarAngle=THREE.MathUtils.degToRad(78);controls.target.set(0,0,10);
const grid=new THREE.GridHelper(1000,100,'#6f8f80','#b9c9bc');grid.position.y=.3;grid.visible=false;scene.add(grid);
const matCache=new Map();
function material(color){if(!matCache.has(color))matCache.set(color,new THREE.MeshStandardMaterial({color,roughness:.88}));return matCache.get(color);}
const cube=new THREE.BoxGeometry(1,1,1), cylinder=new THREE.CylinderGeometry(1,1,1,7), crown=new THREE.IcosahedronGeometry(1,1);
const translucentRoof=new THREE.MeshPhysicalMaterial({color:'#ede6c1',transparent:true,opacity:.32,roughness:.25,metalness:0,side:THREE.DoubleSide,depthWrite:false});
function box(parent,name,x,y,z,w,h,d,color){const o=new THREE.Mesh(cube,material(color));o.name=name;o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=h>1;o.receiveShadow=true;parent.add(o);return o;}
const S=()=>data.metersPerPixel;
const X=px=>(px-895)*S(),Z=py=>(py-390)*S();
function slab(parent,r,color,y=.18,height=.25,name='Superficie'){return box(parent,name,X((r[0]+r[2])/2),y,Z((r[1]+r[3])/2),(r[2]-r[0])*S(),height,(r[3]-r[1])*S(),color);}
function meshPoly(parent,points,y,color,name){const shape=new THREE.Shape();points.forEach((p,i)=>i?shape.lineTo(X(p[0]),-Z(p[1])):shape.moveTo(X(p[0]),-Z(p[1])));shape.closePath();const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape),material(color));mesh.rotation.x=-Math.PI/2;mesh.position.y=y;mesh.receiveShadow=true;mesh.name=name;parent.add(mesh);return mesh;}
function line(parent,points,color='#eeeee0',width=.22,y=.5){for(let i=1;i<points.length;i++){let a=points[i-1],b=points[i],dx=b[0]-a[0],dz=b[1]-a[1];let o=box(parent,'Línea', (a[0]+b[0])/2,y,(a[1]+b[1])/2,width,.04,Math.hypot(dx,dz),color);o.rotation.y=Math.atan2(dx,dz);}}
function label(text,x,y,z,cls=''){const el=document.createElement('div');el.className='label '+cls;el.textContent=text;labelLayer.append(el);labels.push({el,p:new THREE.Vector3(x,y,z)});}
function buildingTDetails(parent,b,height){
 const group=new THREE.Group();group.name='T_reticula_concreto_y_ventanales';group.userData={approximate:true,reference:'Foto de Gabriel: estructura clara, PB + 3 pisos; medidas y reparto de ventanas aproximados'};parent.add(group);
 const poly=b.polygons[0];
 for(let i=0;i<poly.length;i++){
  const a=poly[i],q=poly[(i+1)%poly.length],dx=X(q[0])-X(a[0]),dz=Z(q[1])-Z(a[1]),length=Math.hypot(dx,dz),face=new THREE.Group();face.name='T_fachada_'+i;face.position.set((X(a[0])+X(q[0]))/2,0,(Z(a[1])+Z(q[1]))/2);face.rotation.y=Math.atan2(dx,dz);group.add(face);
  const bays=Math.max(1,Math.round(length/6.5)),bay=length/bays;
  for(let f=0;f<b.floors;f++){
   for(let n=0;n<bays;n++){
    const z=-length/2+(n+.5)*bay;
    box(face,'T_ventanal_nivel_'+f,.16,.25+f*data.storeyHeight+1.85,z,.16,2,bay-.55,'#79908e');
    for(const shift of [-bay/6,bay/6])box(face,'T_parteluz',.28,.25+f*data.storeyHeight+1.85,z+shift,.12,2,.07,'#bbc5bf');
   }
   box(face,'T_trabe_horizontal',.43,.25+(f+1)*data.storeyHeight-.2,0,.8,.6,length,'#d3d5c9');
  }
  for(let n=0;n<=bays;n++)box(face,'T_columna_concreto',.43,height/2+.25,-length/2+n*bay,.85,height,.55,'#d3d5c9');
  box(face,'T_pretil',.4,height+.55,0,.8,.65,length,'#ced1c5');
 }
}
const LIBRARY={x:836,z:464,angle:-Math.atan2(.298,.954)};
function libraryLocal(p){return [(p[0]-LIBRARY.x)*.954+(p[1]-LIBRARY.z)*.298,-(p[0]-LIBRARY.x)*.298+(p[1]-LIBRARY.z)*.954];}
function libraryWorld([u,v]){const c=Math.cos(LIBRARY.angle),s=Math.sin(LIBRARY.angle);return [LIBRARY.x+u*c+v*s,LIBRARY.z-u*s+v*c];}
function clipLibrary(poly,axis,bound,less){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=less?bound-a[axis]:a[axis]-bound,db=less?bound-b[axis]:b[axis]-bound;if(da>=0)out.push(a);if((da>=0)!==(db>=0)){const t=da/(da-db);out.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}}return out;}
function libraryDetails(parent,height){
 const g=new THREE.Group();g.name='Biblioteca_L_detalle';g.position.set(X(LIBRARY.x),.25,Z(LIBRARY.z));g.rotation.y=LIBRARY.angle;g.userData={approximate:true,reference:'Foto de biblioteca aportada por Gabriel; orientación y medidas pendientes de campo'};parent.add(g);
 const stone='#a49b85',dark='#394b47',frame='#b8b7a9',glass='#667b75';
 // Ventanal alto con retícula profunda, separado de la franja de huecos superiores.
 box(g,'Biblioteca_fondo_ventanal',-8,.34*height,22.65,31,height*.66,.15,dark);
 for(let x=-22;x<=6;x+=4){box(g,'Biblioteca_vidrio',x,height*.34,22.8,3.1,height*.62,.12,glass);box(g,'Biblioteca_montante',x-1.8,height*.34,23.05,.38,height*.68,.65,frame);}
 for(let y=.35;y<height*.7;y+=height*.22)box(g,'Biblioteca_travesano',-8,y,23.05,32,.38,.65,frame);
 for(let x=-22;x<7;x+=5.4)box(g,'Biblioteca_ventana_superior',x,height*.86,22.7,2.35,1.3,.15,dark);
 // Pórtico realmente abierto bajo el dintel: el cuerpo inferior se recorta al generarlo.
 box(g,'Biblioteca_pilar_portico',23.1,height*.34,21.5,2.7,height*.68,2.1,stone);
 box(g,'Biblioteca_piso_portico',15,.16,16,17,.24,13,'#aaa28e');
 box(g,'Biblioteca_fondo_acceso',15,height*.29,8.1,16,height*.58,.18,'#504f40');
 box(g,'Biblioteca_puerta_vidrio',12,height*.23,8.3,4,height*.45,.12,glass);
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=320;const ctx=canvas.getContext('2d');
 ctx.fillStyle='#af7865';ctx.fillRect(0,0,1024,320);
 // Alusión cromática propia, no reconstrucción del mural de la fotografía.
 const colors=['#d9bd89','#829d8d','#c7cabb','#be8e73','#727f72'];
 for(let i=0;i<9;i++){const x=60+i*115,y=125+(i%3)*34;ctx.fillStyle=colors[i%colors.length];ctx.beginPath();ctx.ellipse(x,y,83,114,(i%2?1:-1)*.25,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#dfd0aa';ctx.lineWidth=8;ctx.beginPath();ctx.arc(x,y-12,34,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(x,y+25);ctx.lineTo(x-23,y+77);ctx.lineTo(x+40,y+63);ctx.stroke();}
 ctx.fillStyle='#294f40';ctx.font='bold 33px sans-serif';ctx.textAlign='right';ctx.fillText('BIBLIOTECA',1005,38);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const mural=new THREE.Mesh(new THREE.PlaneGeometry(18,height*.25),new THREE.MeshStandardMaterial({map:texture,roughness:.95}));mural.name='Biblioteca_mural_interpretativo';mural.userData={disposeMaterial:true,interpretation:true,notOriginalArtwork:true};mural.position.set(15,height*.855,22.8);g.add(mural);
 box(g,'Biblioteca_plaza',0,.08,37,64,.15,27,'#9b9885');
 for(let x=-30;x<=30;x+=6)box(g,'Biblioteca_junta_plaza',x,.18,37,.06,.035,26,'#d0c9ae');
 for(let z=25;z<=49;z+=6)box(g,'Biblioteca_junta_plaza',0,.18,z,63,.035,.06,'#d0c9ae');
 for(const x of [-23,-9,28]){box(g,'Biblioteca_jardinera',x,.42,25,9,.7,2.6,'#8f8a76');box(g,'Biblioteca_seto',x,.95,25,8.8,.8,2.4,'#4d6b43');box(g,'Biblioteca_banca',x,.65,27.3,5,.4,.9,'#b8b6a9');}
 for(let y=height*.72;y<height;y+=1.5)box(g,'Biblioteca_junta_muro',-8,y,22.63,33,.035,.035,'#8e8776');
}

// Marca que pertenece a la maqueta y viaja en GLB; bandera persistente en JSON.
function copyrightStyle(){return data.copyrightStyle||ORIGINAL.copyrightStyle;}
function copyrightEnabled(){return data.showCopyright!==false;}
function syncCopyright(){const enabled=copyrightEnabled();const node=world?.getObjectByName('Marca_copyright_modelo');if(node)node.visible=enabled;$('copyrightToggle').checked=enabled;$('watermark').hidden=!enabled;$('watermark').style.color=copyrightStyle().color;}
function addCopyrightToModel(){
 const group=new THREE.Group();group.name='Marca_copyright_modelo';group.userData={presentation:true,flag:'showCopyright',text:'copyright @gabrielhuav'};world.add(group);
 const style=copyrightStyle();group.userData.color=style.color;group.userData.pattern='tiled-site';
 const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=192;const ctx=canvas.getContext('2d');ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 112px sans-serif';ctx.lineWidth=9;ctx.strokeStyle='#fff8e9';ctx.strokeText('copyright @gabrielhuav',768,96,1470);ctx.fillStyle=style.color;ctx.fillText('copyright @gabrielhuav',768,96,1470);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const mat=new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:style.opacity,fog:false,toneMapped:false,side:THREE.DoubleSide,depthWrite:false});
 const height=Math.max(...data.buildings.map(b=>b.floors*data.storeyHeight))+4;
 const panels=copyrightPanelsForSite(data.site,data.metersPerPixel,style);
 group.userData.panelCount=panels.length;
 for(const [i,p]of panels.entries()){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(p.width,p.width/8),mat);mesh.name='Copyright_integrado_'+i;mesh.rotation.x=-Math.PI/2;mesh.position.set(p.x,height,p.z);mesh.renderOrder=5;mesh.userData.disposeCopyrightMaterial=i===0;group.add(mesh);}
 syncCopyright();
}
$('copyrightToggle').onchange=()=>{if(isSaving)return;rememberEdit();data.showCopyright=$('copyrightToggle').checked;syncCopyright();updateSaveState();message(copyrightEnabled()?'Marca integrada activada. Guarda cambios para actualizar GLB y PNG.':'Marca desactivada. Guarda cambios para exportar sin ella.');};

function building(b){
 const g=new THREE.Group();g.name='Edificio_'+b.id;g.userData={id:b.id,name:b.name||b.id,floors:b.floors,approximate:true,source:b.source};g.position.set(b.offsetX||0,0,b.offsetZ||0);world.add(g);buildingGroups.set(b.id,g);const height=b.floors*data.storeyHeight;
 const polys=b.polygons||b.rects.map(r=>[[r[0],r[1]],[r[2],r[1]],[r[2],r[3]],[r[0],r[3]]]);
 for(const poly of polys){const shape=new THREE.Shape();poly.forEach((p,i)=>i?shape.lineTo(X(p[0]),-Z(p[1])):shape.moveTo(X(p[0]),-Z(p[1])));shape.closePath();
  function volume(name,y,h,color,outline=shape){const m=new THREE.Mesh(new THREE.ExtrudeGeometry(outline,{depth:h,bevelEnabled:false}),material(color));m.rotation.x=-Math.PI/2;m.position.y=y;m.name=name;m.castShadow=true;m.receiveShadow=true;g.add(m);}
  if(b.id==='L'){
   const local=poly.map(libraryLocal),left=clipLibrary(local,0,7,true),rear=clipLibrary(clipLibrary(local,0,7,false),1,8,true);
   for(const points of [left,rear]){if(points.length<3)continue;const s=new THREE.Shape();points.map(libraryWorld).forEach((p,i)=>i?s.lineTo(X(p[0]),-Z(p[1])):s.moveTo(X(p[0]),-Z(p[1])));s.closePath();volume('Biblioteca_cuerpo_con_portico',.25,height*.68,'#a49b85',s);}
   volume('Biblioteca_dintel',height*.68+.25,height*.32,'#a49b85');
  }else volume('Cuerpo_aproximado',.25,height,b.id==='T'?'#bdc1b6':'#d6d3c5');
  volume('Azotea',height+.25,.35,b.roof||'#b8c0b6');
  if(!['L','T'].includes(b.id))for(let f=0;f<b.floors;f++)for(let i=0;i<poly.length;i++){const a=poly[i],q=poly[(i+1)%poly.length],dx=X(q[0])-X(a[0]),dz=Z(q[1])-Z(a[1]),length=Math.hypot(dx,dz);if(length<1)continue;const pane=box(g,'Ventana_nivel_'+f,(X(a[0])+X(q[0]))/2,f*data.storeyHeight+2,(Z(a[1])+Z(q[1]))/2,.14,1.1,length,'#526d70');pane.rotation.y=Math.atan2(dx,dz);}
 }
 if(b.id==='L')libraryDetails(g,height);
 if(b.id==='T')buildingTDetails(g,b,height);
 const points=polys.flat(),cx=points.reduce((a,p)=>a+X(p[0]),0)/points.length,cz=points.reduce((a,p)=>a+Z(p[1]),0)/points.length;label(b.id,cx+g.position.x,height+4,cz+g.position.z);return g;
}
function tree(px,py,size=1,palm=false,elevation=0){
 const group=new THREE.Group();group.name=palm?'Palmera_editable':'Árbol_editable';group.position.set(X(px),0,Z(py));vegetation.add(group);
 registerEditable('tree_'+px+'_'+py,(palm?'Palmera':'Árbol')+' · '+Math.round(X(px))+', '+Math.round(Z(py))+' m','tree',group);
 const x=0,z=0,trunk=new THREE.Mesh(cylinder,material('#75654c'));trunk.name=palm?'Palmera_tronco':'Árbol_tronco';trunk.scale.set(palm?.3:.4,palm?12:4,.4);trunk.position.set(x,(palm?6:2)+elevation,z);trunk.castShadow=true;group.add(trunk);
 if(palm){for(let a=0;a<8;a++){const leaf=new THREE.Mesh(crown,material('#567d3d'));leaf.scale.set(3.5,.4,.8);leaf.rotation.y=a*Math.PI/4;leaf.position.set(x+1.2*Math.cos(a*Math.PI/4),12+elevation,z+1.2*Math.sin(a*Math.PI/4));group.add(leaf);}}
 else {const c=new THREE.Mesh(crown,material(['#47774e','#5b8557','#689460'][Math.floor(px+py)%3]));c.scale.set(2.9*size,3.3*size,2.9*size);c.position.set(x,5*size+elevation,z);c.castShadow=true;group.add(c);}
}
function inside(px,py,poly){let v=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){let a=poly[i],b=poly[j];if((a[1]>py)!=(b[1]>py)&&px<(b[0]-a[0])*(py-a[1])/(b[1]-a[1])+a[0])v=!v;}return v;}
function excluded(x,y){const rects=[...data.buildings.flatMap(b=>b.rects),...data.plazas.map(p=>p.rect),...data.parking,...data.paths];return rects.some(r=>x>r[0]-10&&x<r[2]+10&&y>r[1]-10&&y<r[3]+10);}
function generate(){
 if(world){scene.remove(world);world.traverse(o=>{if(o.geometry&&![cube,cylinder,crown].includes(o.geometry))o.geometry.dispose();if(o.userData.disposeCopyrightMaterial){o.material.map?.dispose();o.material.dispose();}if(o.userData.disposeMaterial){o.material.map?.dispose();o.material.dispose();}});}
 clearEditSelection();labelLayer.replaceChildren();labels=[];buildingGroups.clear();editables.clear();world=new THREE.Group();world.name='UAM_'+UNIT.name;world.userData={units:'meters',approximate:true,reference:data.reference,unit:UNIT.name,dataLicense:data.license};scene.add(world);
 vegetation=new THREE.Group();vegetation.name='Vegetación';world.add(vegetation);const p=UNIT.plan;
 box(world,'Base maqueta',(p.xMin+p.xMax)/2,-2,(p.zMin+p.zMax)/2,p.xMax-p.xMin,4,p.zMax-p.zMin,'#bbc3b5');meshPoly(world,data.site,.1,'#90aa81','Predio_aproximado');
 for(const [i,poly]of(data.courts||[]).entries())meshPoly(world,poly,.31,'#4f906c','Cancha_aproximada_'+i);
 for(const r of data.paths)slab(world,r,'#d5cbb1');for(const plaza of data.plazas)slab(world,plaza.rect,'#b87861');
 for(const [i,r]of data.parking.entries())parkingArea(r,'parking_'+i,'Estacionamiento '+(i+1));for(const [i,p]of(data.extraParking||[]).entries())parkingArea(p.rect,p.id,'Estacionamiento nuevo '+(i+1));
 for(const b of data.buildings)building(b);
 let seed=1729;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let n=0;n<120;n++){const px=895+p.xMin+rand()*(p.xMax-p.xMin),py=390+p.zMin+rand()*(p.zMax-p.zMin);if(inside(px,py,data.site)&&!excluded(px,py))tree(px,py,.6);}
 vegetation.visible=$('trees').checked;labelLayer.hidden=!$('names').checked;addCopyrightToModel();world.updateMatrixWorld(true);selectBuilding(selected);refreshEditor();
}
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down;
renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);
renderer.domElement.addEventListener('pointerup',e=>{if(editMode)return;if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>4)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects([...buildingGroups.values()],true);if(hits.length){let o=hits[0].object;while(o.parent&&o.userData.id===undefined)o=o.parent;selectBuilding(o.userData.id);}});
let highlight;
function selectBuilding(id){selected=id||'';$('building').value=selected;if(highlight){scene.remove(highlight);highlight.geometry.dispose();highlight.material.dispose();highlight=null;}
 const b=data.buildings.find(b=>b.id===selected);$('editor').hidden=!b;
 if(!b){$('info').textContent='Haz clic en un edificio o selecciónalo en la lista.';return;}
 $('info').textContent=(b.name||b.id)+' · '+b.floors+' niveles aproximados · Validar con observación del alumnado.';
 for(const key of ['floors','offsetX','offsetZ'])$(key).value=b[key]||0;
 highlight=new THREE.BoxHelper(buildingGroups.get(b.id),'#ffb02e');scene.add(highlight);
}
for(const b of data.buildings){const option=document.createElement('option');option.value=b.id;option.textContent=b.name||'Edificio '+b.id;$('building').append(option);}
$('building').onchange=e=>selectBuilding(e.target.value);
$('apply').onclick=()=>{const b=data.buildings.find(b=>b.id===selected);if(!b)return;const n=Number($('floors').value),ox=Number($('offsetX').value),oz=Number($('offsetZ').value);if(!Number.isInteger(n)||n<1||n>8||![ox,oz].every(Number.isFinite)){message('Introduce niveles entre 1 y 8 y desplazamientos válidos.');return;}rememberEdit();b.floors=n;delete b.height;b.offsetX=ox;b.offsetZ=oz;generate();updateSaveState();message('Edificio actualizado. Guarda datos y GLB para conservar el cambio.');};
function resize(){const w=mount.clientWidth,h=mount.clientHeight;renderer.setSize(w,h);perspective.aspect=w/h;perspective.updateProjectionMatrix();const span=Math.max((UNIT.plan.xMax-UNIT.plan.xMin)/2,(UNIT.plan.zMax-UNIT.plan.zMin)/2*w/h)*1.1;ortho.left=-span;ortho.right=span;ortho.top=span*h/w;ortho.bottom=-span*h/w;ortho.updateProjectionMatrix();if(!topMode){const distance=focusMode?Math.max(115,43/(Math.tan(THREE.MathUtils.degToRad(perspective.fov/2))*perspective.aspect)):Math.max((UNIT.plan.zMax-UNIT.plan.zMin)*.9,(UNIT.plan.xMax-UNIT.plan.xMin)*.6/(Math.tan(THREE.MathUtils.degToRad(perspective.fov/2))*perspective.aspect));perspective.position.sub(controls.target).normalize().multiplyScalar(distance).add(controls.target);controls.update();}}
window.addEventListener('resize',resize);
$('expand').onclick=()=>{const panel=document.querySelector('aside');panel.hidden=!panel.hidden;mount.style.left=panel.hidden?'0px':'';$('expand').textContent=panel.hidden?'Mostrar controles':'Ampliar vista';resize();};
// Misma transformación de norte que Campus.kt; no escala la geometría ni aplica dos veces la calibración.
function campusNorth(geo){
 if(!geo)return null;
 const ul=geo.superiorIzquierda,ur=geo.superiorDerecha,ll=geo.inferiorIzquierda;
 if(![ul,ur,ll].every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite))||!(geo.ancho>0&&geo.alto>0))return null;
 const cosLat=Math.cos(ul[0]*Math.PI/180),ax=(ur[1]-ul[1])*cosLat/geo.ancho,ay=(ur[0]-ul[0])/geo.ancho,bx=(ll[1]-ul[1])*cosLat/geo.alto,by=(ll[0]-ul[0])/geo.alto,det=ax*by-ay*bx;
 if(Math.abs(det)<1e-18)return null;
 const x=-bx/det,z=ax/det,length=Math.hypot(x,z);return {x:x/length,z:z/length};
}
function view(mode){topMode=mode==='top';focusMode=['library','towerT'].includes(mode);camera=topMode?ortho:perspective;controls.object=camera;controls.enableRotate=!topMode;controls.target.set(0,0,0);camera.zoom=1;camera.up.set(0,1,0);const north=campusNorth(georeference)||{x:0,z:-1};
 if(topMode){camera.position.set(0,1000,0);camera.up.set(north.x,0,north.z);}else camera.position.set(-north.x*630,580,-north.z*630);
 if(mode==='library'){const b=data.buildings.find(b=>b.id==='L');controls.target.set(X(LIBRARY.x)+(b.offsetX||0),5,Z(LIBRARY.z)+(b.offsetZ||0));const delta=new THREE.Vector3(30,24,115).applyAxisAngle(new THREE.Vector3(0,1,0),LIBRARY.angle);camera.position.copy(controls.target).add(delta);}
 if(mode==='towerT'){const b=data.buildings.find(b=>b.id==='T'),r=b.rects[0];controls.target.set(X((r[0]+r[2])/2)+(b.offsetX||0),5,Z((r[1]+r[3])/2)+(b.offsetZ||0));camera.position.copy(controls.target).add(new THREE.Vector3(-75,40,-100));}
 camera.lookAt(controls.target);camera.updateProjectionMatrix();controls.update();for(const id of ['approved','library','towerT','maps','top'])$(id).classList.toggle('active',id===mode);resize();}
for(const mode of ['approved','library','towerT','maps','top'])$(mode).onclick=()=>view(mode);
$('spin').onclick=()=>{if(topMode)view('maps');controls.autoRotate=!controls.autoRotate;$('spin').classList.toggle('active',controls.autoRotate);};
$('trees').onchange=()=>vegetation.visible=$('trees').checked;$('names').onchange=()=>labelLayer.hidden=!$('names').checked;$('grid').onchange=()=>grid.visible=$('grid').checked;
function message(text){$('status').textContent=text;clearTimeout(message.timer);message.timer=setTimeout(()=>$('status').textContent='',6500);}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),6000);}
async function save(blob,kind,name){if(location.protocol==='http:'&&['localhost','127.0.0.1'].includes(location.hostname)){const res=await fetch('/guardar/'+kind,{method:'POST',body:blob});if(!res.ok)throw Error('No se pudo guardar');const r=await res.json();message('Guardado en la carpeta del modelo: '+r.saved);}else{download(blob,name);message('Archivo preparado para descargar.');}}
$('saveglb').onclick=async()=>{if(isSaving)return;const btn=$('saveglb');btn.disabled=true;message('Preparando modelo GLB…');const was=vegetation.visible;try{vegetation.visible=true;const result=await new GLTFExporter().parseAsync(world,{binary:true,onlyVisible:true});await save(new Blob([result],{type:'model/gltf-binary'}),'glb',UNIT.glb);}catch(e){$('error').textContent=e.message;}finally{vegetation.visible=was;btn.disabled=false;}};
$('savejson').onclick=()=>saveEditorChanges(false);
$('savepng').onclick=async()=>{renderer.render(scene,camera);const canvas=document.createElement('canvas');canvas.width=renderer.domElement.width;canvas.height=renderer.domElement.height;const ctx=canvas.getContext('2d');ctx.drawImage(renderer.domElement,0,0);const factor=canvas.width/mount.clientWidth;if($('names').checked)for(const l of labels){if(l.el.style.display==='none')continue;const x=parseFloat(l.el.style.left)*factor,y=parseFloat(l.el.style.top)*factor;ctx.font=`600 ${12*factor}px sans-serif`;const w=ctx.measureText(l.el.textContent).width+12*factor;ctx.fillStyle=l.el.classList.contains('vehicle')?'#bc3535':l.el.classList.contains('pedestrian')?'#1d72b6':'#fffdf0';ctx.fillRect(x-w/2,y-10*factor,w,20*factor);ctx.fillStyle=['vehicle','pedestrian'].some(c=>l.el.classList.contains(c))?'white':'#243b2e';ctx.textAlign='center';ctx.fillText(l.el.textContent,x,y+4*factor);}
 ctx.textAlign='left';ctx.font=`${12*factor}px sans-serif`;ctx.fillStyle='#344d3f';ctx.fillText('UAM Iztapalapa · Croquis inicial aproximado',18*factor,canvas.height-18*factor);drawWatermark(ctx);canvas.toBlob(async b=>{try{await save(b,'png','Vista_UAM.png');}catch(e){message(e.message);}},'image/png');};
$('loadjson').onclick=()=>$('filejson').click();
$('filejson').onchange=async e=>{try{if(!e.target.files[0])return;const loaded=validateCampus(JSON.parse(await e.target.files[0].text()));rememberEdit();data=loaded;selected='';editSelected='';generate();updateSaveState();message('Datos cargados. Usa Guardar cambios para conservarlos.');}catch(e){message('No se pudo abrir: '+e.message);}finally{e.target.value='';}};
// Editor ligero: los cambios son datos; los controles no forman parte del GLB.
let editHelper=null;
function clearEditSelection(){if(editHelper){scene.remove(editHelper);editHelper.geometry.dispose();editHelper.material.dispose();editHelper=null;}}
function registerEditable(id,title,kind,node,size){
 if((data.removedElements||[]).includes(id)){node.removeFromParent();return;}
 const entry={id,title,kind,node,basePosition:node.position.clone(),baseAngle:node.rotation.y,size};editables.set(id,entry);node.userData.editableId=id;
 const change=data.elementEdits?.[id]||{};node.position.x+=change.offsetX||0;node.position.z+=change.offsetZ||0;node.rotation.y+=change.rotation||0;
 if(size){node.scale.x=(change.width||size.width)/size.width;node.scale.z=(change.depth||size.depth)/size.depth;}
}
function parkingArea(r,id,title){
 const w=(r[2]-r[0])*S(),d=(r[3]-r[1])*S(),group=new THREE.Group();group.name='Estacionamiento_editable_'+id;group.position.set(X((r[0]+r[2])/2),0,Z((r[1]+r[3])/2));world.add(group);registerEditable(id,title,'parking',group,{width:w,depth:d});
 box(group,'Asfalto',0,.16,0,w,.25,d,'#777f78');
 // Los cajones no sobrepasan la superficie y dejan pasillos de circulación.
 for(let x=-w/2+3;x<w/2-1;x+=2.5)for(let z=-d/2+1;z+5<d/2-1;z+=10)box(group,'Cajón',x,.32,z+2.5,.055,.025,5,'#dfd4a0');
}
function editSnapshot(){return structuredClone(data);}
function rememberEdit(snapshot=editSnapshot()){undoHistory.push(snapshot);if(undoHistory.length>40)undoHistory.shift();redoHistory=[];}
function updateSaveState(){const dirty=JSON.stringify(data)!==savedData;$('saveState').textContent=isSaving?'Guardando…':dirty?'Hay cambios sin guardar.':'Sin cambios pendientes.';$('editUndo').disabled=!undoHistory.length;$('editRedo').disabled=!redoHistory.length;}
function rebuildAfterEdit(){generate();updateSaveState();}
function editorOptions(){
 const selector=$('editObject'),kind=$('editFilter').value;selector.replaceChildren(new Option('Selecciona en el mapa o en esta lista',''));
 for(const e of editables.values())if(kind==='all'||e.kind===kind)selector.add(new Option(e.title,e.id));
 selector.value=editSelected;
}
function refreshEditor(){editorOptions();showObjectFields();}
function showObjectFields(){
 clearEditSelection();const e=editables.get(editSelected);$('objectFields').hidden=!e;if(!e)return;
 $('editObject').value=e.id;$('objectX').value=e.node.position.x.toFixed(2);$('objectZ').value=e.node.position.z.toFixed(2);$('objectAngle').value=THREE.MathUtils.radToDeg(e.node.rotation.y).toFixed(1);
 $('parkingFields').hidden=e.kind!=='parking';if(e.size){$('parkingWidth').value=(e.size.width*e.node.scale.x).toFixed(2);$('parkingDepth').value=(e.size.depth*e.node.scale.z).toFixed(2);}
 if(editMode){editHelper=new THREE.BoxHelper(e.node,'#f4a622');editHelper.name='Selección_editor';scene.add(editHelper);}
}
function chooseEditable(id){editSelected=id||'';const e=editables.get(id);if(e&&$('editFilter').value!=='all'&&$('editFilter').value!==e.kind)$('editFilter').value='all';refreshEditor();}
function resetDraw(){drawStart=null;if(drawPreview){scene.remove(drawPreview);drawPreview.geometry.dispose();drawPreview.material.dispose();drawPreview=null;}}
function setEditing(value){
 editMode=value;resetDraw();controls.autoRotate=false;$('spin').classList.remove('active');controls.enabled=true;$('sceneEditor').hidden=!value;$('toggleEdit').textContent=value?'Cerrar modo edición':'Activar modo edición';$('toggleEdit').setAttribute('aria-expanded',String(value));mount.classList.toggle('editing',value);refreshEditor();
 if(value)message('Selecciona y arrastra un elemento. Los cambios se conservan con Guardar cambios.');
}
$('toggleEdit').onclick=()=>setEditing(!editMode);
$('editObject').onchange=e=>chooseEditable(e.target.value);
$('editFilter').onchange=()=>{editSelected='';refreshEditor();};
$('editTop').onclick=()=>view('top');
$('editTool').onchange=()=>{resetDraw();message($('editTool').value==='parking'?'Marca dos esquinas del estacionamiento. Esc cancela.':$('editTool').value==='place'?'Selecciona un elemento en la lista y haz clic en su nueva ubicación.':'Selecciona un elemento y arrástralo.');};
$('editUndo').onclick=()=>{if(isSaving||!undoHistory.length)return;resetDraw();redoHistory.push(editSnapshot());data=undoHistory.pop();rebuildAfterEdit();message('Cambio deshecho.');};
$('editRedo').onclick=()=>{if(isSaving||!redoHistory.length)return;resetDraw();undoHistory.push(editSnapshot());data=redoHistory.pop();rebuildAfterEdit();message('Cambio recuperado.');};
function writeTransform(e,x,z,angle,width,depth){
 data.elementEdits??={};data.elementEdits[e.id]={offsetX:x-e.basePosition.x,offsetZ:z-e.basePosition.z,rotation:angle-e.baseAngle,...(e.size?{width:width??e.size.width*e.node.scale.x,depth:depth??e.size.depth*e.node.scale.z}:{})};
}
$('applyObject').onclick=()=>{
 const e=editables.get(editSelected);if(!e)return;const x=Number($('objectX').value),z=Number($('objectZ').value),angle=Number($('objectAngle').value),w=Number($('parkingWidth').value),d=Number($('parkingDepth').value);
 if(![x,z,angle].every(Number.isFinite)||Math.abs(x)>1000||Math.abs(z)>1000||(e.size&&(![w,d].every(Number.isFinite)||w<2||w>750||d<2||d>310))){message('Revisa las medidas. Estacionamientos: ancho de 2 a 750 m y fondo de 2 a 310 m.');return;}
 rememberEdit();writeTransform(e,x,z,THREE.MathUtils.degToRad(angle),w,d);rebuildAfterEdit();message('Elemento actualizado.');
};
$('resetObject').onclick=()=>{if(!editables.has(editSelected))return;rememberEdit();delete data.elementEdits?.[editSelected];rebuildAfterEdit();message('Elemento restablecido.');};
$('deleteObject').onclick=()=>{if(!editables.has(editSelected))return;rememberEdit();data.removedElements??=[];data.removedElements.push(editSelected);editSelected='';rebuildAfterEdit();message('Elemento quitado. Puedes recuperarlo con Deshacer.');};
function canvasRay(e){const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);}
function groundPoint(e){canvasRay(e);const p=new THREE.Vector3();return raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),p);}
function snapped(p){if($('editSnap').checked){p.x=Math.round(p.x*2)/2;p.z=Math.round(p.z*2)/2;}return p;}
function editableAt(e){canvasRay(e);const hits=raycaster.intersectObjects([...editables.values()].filter(e=>e.kind!=='tree'||vegetation.visible).map(e=>e.node),true);const selected=editables.get(editSelected);if(selected&&hits.length){const selectedHits=raycaster.intersectObject(selected.node,true);if(selectedHits.length&&selectedHits[0].distance<=hits[0].distance+.3)return selected;}for(const hit of hits){let node=hit.object;while(node&&!node.userData.editableId)node=node.parent;if(node)return editables.get(node.userData.editableId);}return null;}
function consumePointer(e){e.preventDefault();e.stopImmediatePropagation();}
function validParkingPoint(p){return inside(p.x/S()+895,p.z/S()+390,data.site);}
function finishParking(p){
 const a=drawStart,w=Math.abs(p.x-a.x),d=Math.abs(p.z-a.z);if(w<2||d<2){message('Marca una segunda esquina a más de 2 m de la primera.');return;}
 const points=[[Math.min(a.x,p.x),Math.min(a.z,p.z)],[Math.max(a.x,p.x),Math.min(a.z,p.z)],[Math.max(a.x,p.x),Math.max(a.z,p.z)],[Math.min(a.x,p.x),Math.max(a.z,p.z)]];
 if(!points.every(([x,z])=>validParkingPoint(new THREE.Vector3(x,0,z)))){message('Las cuatro esquinas deben quedar dentro del campus.');return;}
 rememberEdit();data.extraParking??=[];const id='parking_new_'+Date.now().toString(36)+'_'+data.extraParking.length;
 data.extraParking.push({id,rect:[points[0][0]/S()+895,points[0][1]/S()+390,points[2][0]/S()+895,points[2][1]/S()+390]});resetDraw();editSelected=id;$('editFilter').value='parking';rebuildAfterEdit();$('editTool').value='move';message('Estacionamiento creado. Puedes moverlo, girarlo y ajustar sus medidas.');
}
renderer.domElement.addEventListener('pointerdown',e=>{
 if(!editMode||e.button!==0||isSaving)return;const tool=$('editTool').value;
 if(tool==='parking'){consumePointer(e);const p=groundPoint(e);if(!p)return;snapped(p);if(!drawStart){if(!validParkingPoint(p)){message('Marca la primera esquina dentro del campus.');return;}drawStart=p;message('Ahora marca la esquina opuesta.');}else finishParking(p);return;}
 if(tool==='place'){consumePointer(e);const entry=editables.get(editSelected),p=groundPoint(e);if(!entry){message('Elige primero un elemento en la lista.');return;}if(!p)return;snapped(p);rememberEdit();writeTransform(entry,p.x,p.z,entry.node.rotation.y);rebuildAfterEdit();message('Elemento colocado.');return;}
 const entry=editableAt(e);if(!entry)return;consumePointer(e);const p=groundPoint(e);if(!p)return;chooseEditable(entry.id);controls.enabled=false;dragEdit={entry,start:p,position:entry.node.position.clone(),snapshot:editSnapshot(),pointerId:e.pointerId};renderer.domElement.setPointerCapture(e.pointerId);
},true);
renderer.domElement.addEventListener('pointermove',e=>{
 if(!editMode)return;
 if(dragEdit){consumePointer(e);const p=groundPoint(e);if(!p)return;const target=dragEdit.position.clone().add(p.sub(dragEdit.start));snapped(target);dragEdit.entry.node.position.x=target.x;dragEdit.entry.node.position.z=target.z;editHelper?.update();return;}
 if(drawStart){const p=groundPoint(e);if(!p)return;snapped(p);if(!drawPreview){drawPreview=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:'#efb542',transparent:true,opacity:.55,depthTest:false}));drawPreview.name='Vista_previa_estacionamiento';drawPreview.renderOrder=10;scene.add(drawPreview);}drawPreview.position.set((drawStart.x+p.x)/2,.5,(drawStart.z+p.z)/2);drawPreview.scale.set(Math.max(.05,Math.abs(p.x-drawStart.x)),.15,Math.max(.05,Math.abs(p.z-drawStart.z)));}
},true);
function endEditDrag(e,cancel=false){if(!dragEdit)return;consumePointer(e);const drag=dragEdit;dragEdit=null;controls.enabled=true;if(renderer.domElement.hasPointerCapture(e.pointerId))renderer.domElement.releasePointerCapture(e.pointerId);
 const moved=drag.entry.node.position.distanceTo(drag.position)>.01;if(cancel){drag.entry.node.position.copy(drag.position);showObjectFields();return;}if(moved){rememberEdit(drag.snapshot);writeTransform(drag.entry,drag.entry.node.position.x,drag.entry.node.position.z,drag.entry.node.rotation.y);rebuildAfterEdit();}else showObjectFields();
}
renderer.domElement.addEventListener('pointerup',e=>endEditDrag(e),true);
renderer.domElement.addEventListener('pointercancel',e=>endEditDrag(e,true),true);
document.addEventListener('keydown',e=>{if(!editMode||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(e.key==='Escape'){resetDraw();message('Dibujo cancelado.');}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();$(e.shiftKey?'editRedo':'editUndo').click();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();$('editRedo').click();}});
window.addEventListener('beforeunload',e=>{if(savedData&&JSON.stringify(data)!==savedData){e.preventDefault();e.returnValue='';}});
function validateCampus(d){
 if(d?.showCopyright!==undefined&&typeof d.showCopyright!=='boolean')throw Error('showCopyright debe ser true o false');
 const rect=r=>Array.isArray(r)&&r.length===4&&r.every(Number.isFinite)&&r[2]>r[0]&&r[3]>r[1];
 if(d?.unit?.slug!==UNIT.slug)throw Error('Este archivo pertenece a otra unidad.');
 if(!d||!Array.isArray(d.buildings)||!Array.isArray(d.site)||!(d.metersPerPixel>0)||!Number.isFinite(d.storeyHeight)||!d.buildings.every(b=>typeof b.id==='string'&&Number.isInteger(b.floors)&&b.floors>=1&&b.floors<=8&&Array.isArray(b.rects)&&b.rects.every(rect))||!['plazas','paths','parking','gates'].every(k=>Array.isArray(d[k]))||!d.parking.every(rect)||!d.paths.every(rect)||!d.plazas.every(p=>rect(p.rect)))throw Error('Datos de campus inválidos');
 if(d.extraParking!==undefined&&(!Array.isArray(d.extraParking)||d.extraParking.length>500||!d.extraParking.every(p=>typeof p.id==='string'&&/^parking_new_[a-z0-9_]+$/.test(p.id)&&rect(p.rect))))throw Error('Estacionamientos inválidos');
 if(d.removedElements!==undefined&&(!Array.isArray(d.removedElements)||!d.removedElements.every(id=>typeof id==='string')))throw Error('Elementos retirados inválidos');
 if(d.elementEdits!==undefined&&(!d.elementEdits||Array.isArray(d.elementEdits)||typeof d.elementEdits!=='object'||!Object.values(d.elementEdits).every(v=>v&&typeof v==='object'&&Object.entries(v).every(([key,n])=>['offsetX','offsetZ','rotation','width','depth'].includes(key)&&Number.isFinite(n)&&Math.abs(n)<10000)&&(!('width'in v)||v.width>=2)&&(!('depth'in v)||v.depth>=2))))throw Error('Posiciones de elementos inválidas');
 if(!d.buildings.every(b=>!b.polygons||Array.isArray(b.polygons)&&b.polygons.every(poly=>Array.isArray(poly)&&poly.length>=3&&poly.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)))))throw Error('Huellas inválidas');
 return {...d,unit:UNIT,version:8};
}
// Plano 2D para la app móvil: vista ortográfica desde arriba, fondo transparente, +X a la derecha y -Z arriba.
// La app lo coloca sobre el mapa real con georreferencia.json; estos límites (m) deben coincidir con los de ahí.
// Marca temporal sobre la imagen, nunca sobre la geometría exportada.
function drawWatermark(ctx){
 if(!copyrightEnabled())return;
 const text='copyright @gabrielhuav',margin=12,size=14;ctx.save();ctx.font='500 '+size+'px system-ui, sans-serif';ctx.textAlign='right';ctx.textBaseline='bottom';const width=ctx.measureText(text).width;
 ctx.fillStyle='rgba(255,255,255,.78)';ctx.fillRect(ctx.canvas.width-margin-width-8,ctx.canvas.height-margin-size-6,width+16,size+12);ctx.fillStyle=copyrightStyle().color;ctx.fillText(text,ctx.canvas.width-margin,ctx.canvas.height-margin);ctx.restore();
}
async function watermarkedPlan(source){
 const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;const ctx=canvas.getContext('2d');ctx.drawImage(source,0,0);drawWatermark(ctx);return await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('No se pudo crear el plano PNG.')),'image/png'));
}
const PLANO=UNIT.plan;
async function planoBlob(){
 const w=(PLANO.xMax-PLANO.xMin)*PLANO.pxPorMetro,h=(PLANO.zMax-PLANO.zMin)*PLANO.pxPorMetro;
 const r=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});r.setSize(w,h,false);r.setClearColor(0,0);
 r.outputColorSpace=renderer.outputColorSpace;r.toneMapping=renderer.toneMapping;r.toneMappingExposure=renderer.toneMappingExposure;
 const cam=new THREE.OrthographicCamera(PLANO.xMin,PLANO.xMax,-PLANO.zMin,-PLANO.zMax,1,2500);cam.position.set(0,1000,0);cam.up.set(0,0,-1);cam.lookAt(0,0,0);
 const ocultos=[...['Base maqueta','Eje_5_Norte_Montevideo','Av_San_Pablo'].map(n=>world.getObjectByName(n)),editHelper,highlight].filter(Boolean).map(node=>({node,visible:node.visible})),was=vegetation.visible,fog=scene.fog,g=grid.visible;
 for(const o of ocultos)o.node.visible=false;vegetation.visible=true;scene.fog=null;grid.visible=false;
 try{r.render(scene,cam);return await watermarkedPlan(r.domElement);}
 finally{for(const o of ocultos)o.node.visible=o.visible;vegetation.visible=was;scene.fog=fog;grid.visible=g;r.dispose();}
}
async function saveEditorChanges(withModel=true){
 if(isSaving)return;isSaving=true;resetDraw();updateSaveState();const buttons=['copyrightToggle','saveChanges','saveglb','savejson','apply','applyObject','deleteObject','resetObject','loadjson','toggleEdit','editUndo','editRedo'];for(const id of buttons)$(id).disabled=true;
 const snapshot=JSON.stringify(data);try{
  if(withModel){const was=vegetation.visible;vegetation.visible=true;try{const result=await new GLTFExporter().parseAsync(world,{binary:true,onlyVisible:true});await save(new Blob([result],{type:'model/gltf-binary'}),'glb',UNIT.glb);}finally{vegetation.visible=was;}await save(await planoBlob(),'plano','plano_2d.png');}
  await save(new Blob([JSON.stringify(JSON.parse(snapshot),null,2)],{type:'application/json'}),'json','campus_editado.json');savedData=snapshot;message(withModel?'Cambios y modelo 3D guardados. Puedes avisarme para crear el checkpoint.':'Datos guardados. El botón Guardar cambios también actualiza el modelo 3D.');
 }catch(e){message('No se pudo completar el guardado: '+e.message);}finally{isSaving=false;for(const id of buttons)$(id).disabled=false;updateSaveState();}
}
$('saveChanges').onclick=()=>saveEditorChanges(true);

async function startCampus(){
 if(location.protocol==='http:'){try{const geo=await fetch('./georreferencia.json',{cache:'no-store'});if(geo.ok){const candidate=await geo.json();if(campusNorth(candidate))georeference=candidate;}}catch{ /* El visor portátil mantiene su orientación de reserva. */ }}
 let notice='Listo: gira el modelo con el ratón.';
 if(location.protocol==='http:'&&['localhost','127.0.0.1'].includes(location.hostname)){
  try{const response=await fetch('./campus_editado.json',{cache:'no-store'});if(response.ok){data=validateCampus(await response.json());notice='Se cargaron tus últimos cambios guardados.';}}
  catch(e){notice='No se pudieron cargar los datos guardados. Se muestra la base; revisa el archivo antes de guardar.';}
 }
 data.version=8;savedData=JSON.stringify(data);generate();view('approved');resize();updateSaveState();message(notice);
}
startCampus();
const v=new THREE.Vector3();function animate(){requestAnimationFrame(animate);controls.update();renderer.render(scene,camera);const w=mount.clientWidth,h=mount.clientHeight;for(const l of labels){v.copy(l.p).project(camera);l.el.style.display=v.z<1&&v.z>-1&&Math.abs(v.x)<1.1&&Math.abs(v.y)<1.1?'':'none';l.el.style.left=((v.x+1)*w/2)+'px';l.el.style.top=((-v.y+1)*h/2)+'px';}
 // Escala local en el plano del suelo: varía con cámara y perspectiva.
 const a=new THREE.Vector3(0,0,0).project(camera),b=new THREE.Vector3(50,0,0).project(camera);const px=Math.abs(b.x-a.x)*w/2;mount.querySelector('.scale').style.width=Math.max(2,px)+'px';$('scaleText').textContent='50 m aprox. · Referencia local en el centro del terreno';}
animate();
