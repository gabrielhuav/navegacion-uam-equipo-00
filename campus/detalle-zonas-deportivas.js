// Secciones de galería y deporte vistas desde el corredor o el patio.
// Las formas y cotas finas son aproximadas y reutilizan las huellas existentes.
export function detallarZonasDeportivas({THREE, world, buildingGroups, box, material}) {
  detallarConcretoPorticoW(THREE, buildingGroups.get('W'), box);
  reticularCeramicaP1(THREE, buildingGroups.get('P1'), material);
  completarCubiertaDelAnexoP2(THREE, buildingGroups.get('P2'), box);
  completarEstructuraDeCanastas(THREE, world.getObjectByName('Canchas_deportivas_AZC'), box);
  colocarRedFutbol7(THREE, world.getObjectByName('Recinto_oblicuo_futbol_7'), box);
}

function grupoDeDetalle(THREE, padre, nombre, referencia) {
  const grupo = new THREE.Group();
  grupo.name = nombre;
  grupo.userData = {approximate: true, reference: referencia};
  padre.add(grupo);
  return grupo;
}

// El muro interior del pórtico muestra juntas de paneles, visibles detrás de Primera letra.
function detallarConcretoPorticoW(THREE, edificio, box) {
  const portico = edificio?.getObjectByName('W_AZC_laboratorios_y_portico');
  const muros = portico?.children.filter(pieza => pieza.name === 'W_muro_ala_portico');
  if (!muros?.length) return;

  const detalle = grupoDeDetalle(THREE, portico, 'W_panelizado_concreto_del_atrio', 'Corpus AZC 0102 y 0103');
  const colores = ['#c0c3bf', '#c9cac4', '#c4c6c0', '#bec2bf'];
  for (const muro of muros) {
    const haciaPatio = -Math.sign(muro.position.z);
    const cara = muro.position.z + haciaPatio * (muro.scale.z / 2 + .009);
    const ancho = muro.scale.x, alto = muro.scale.y;
    const columnas = Math.ceil(ancho / 1.24), filas = Math.ceil(alto / .94);
    const inicio = muro.position.x - ancho / 2, base = muro.position.y - alto / 2;
    for (let fila = 0; fila < filas; fila++) {
      for (let columna = 0; columna < columnas; columna++) {
        const tono = colores[(fila * 13 + columna * 7 + Math.floor(columna / 2)) % colores.length];
        box(detalle, 'W_panel_de_concreto_aparente', inicio + (columna + .5) * ancho / columnas,
          base + (fila + .5) * alto / filas, cara, ancho / columnas - .024, alto / filas - .018, .021, tono);
      }
    }
  }
}

// Las fotos muestran dos caras de la torre. El despiece esquemático continúa por las otras dos.
function reticularCeramicaP1(THREE, edificio, material) {
  const parte = edificio?.getObjectByName('P1_volumen_0');
  const torre = parte?.getObjectByName('P1_torre_azulejo_azul');
  if (!torre) return;
  const detalle = grupoDeDetalle(THREE, parte, 'P1_despiece_ceramico_azul', 'Corpus AZC 0002 y 0009');
  for (const junta of parte.children.filter(pieza => pieza.name === 'P1_reticula_azulejo')) {
    junta.removeFromParent();
  }
  parte.getObjectByName('P1_detalle_ceramica_corpus')?.removeFromParent();
  torre.material = material('#a3aab3');

  const {x, y, z} = torre.position;
  const {x: ancho, y: alto, z: fondo} = torre.scale;
  const filas = Math.round(alto / .30), base = y - alto / 2;
  const colores = ['#184186', '#254f97', '#204a91', '#1a438b', '#27569c'].map(tono => new THREE.Color(tono));
  const posiciones = [], coloresPorVertice = [];
  for (const [extension, origen, valorFijo, girada] of [
    [ancho, x - ancho / 2, z + fondo / 2 + .004, false],
    [fondo, z - fondo / 2, x + ancho / 2 + .004, true],
    [ancho, x - ancho / 2, z - fondo / 2 - .004, false],
    [fondo, z - fondo / 2, x - ancho / 2 - .004, true],
  ]) {
    const columnas = Math.round(extension / .31);
    for (let fila = 0; fila < filas; fila++) {
      const inferior = base + fila * alto / filas + .009;
      const superior = inferior + alto / filas - .018;
      for (let columna = 0; columna < columnas; columna++) {
        const a = origen + columna * extension / columnas + .009;
        const b = a + extension / columnas - .018;
        const tono = colores[(fila * 7 + columna * 3 + Math.floor(fila / 3)) % colores.length];
        if (girada) {
          posiciones.push(valorFijo,inferior,a, valorFijo,superior,a, valorFijo,inferior,b,
            valorFijo,inferior,b, valorFijo,superior,a, valorFijo,superior,b);
        } else {
          posiciones.push(a,inferior,valorFijo, b,inferior,valorFijo, a,superior,valorFijo,
            a,superior,valorFijo, b,inferior,valorFijo, b,superior,valorFijo);
        }
        for (let i = 0; i < 6; i++) coloresPorVertice.push(tono.r, tono.g, tono.b);
      }
    }
  }
  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute('position', new THREE.Float32BufferAttribute(posiciones, 3));
  geometria.setAttribute('color', new THREE.Float32BufferAttribute(coloresPorVertice, 3));
  geometria.computeVertexNormals();
  const revestimiento = new THREE.Mesh(geometria, new THREE.MeshStandardMaterial({vertexColors:true,roughness:.72,side:THREE.DoubleSide}));
  revestimiento.name = 'P1_revestimiento_de_azulejo_azul';
  revestimiento.userData.disposeMaterial = true;
  revestimiento.receiveShadow = true;
  detalle.add(revestimiento);
}

// En 0065 hay una base de concreto bajo el tinaco y dos rejillas de cubierta independientes.
function completarCubiertaDelAnexoP2(THREE, edificio, box) {
  const parte = edificio?.getObjectByName('P2_AZC_talleres_2P');
  const anexo = parte?.getObjectByName('P2_anexo_terracota');
  const tinaco = parte?.getObjectByName('P2_tinaco_azotea');
  if (!anexo || !tinaco) return;
  const grupo = grupoDeDetalle(THREE, parte, 'P2_ventilacion_sobre_anexo', 'Corpus AZC 0065');
  const nivel = anexo.position.y + anexo.scale.y / 2;
  const frente = anexo.position.z + anexo.scale.z / 2;
  const concreto = '#aaa9a2', rejilla = '#777972';
  const pedestal = .34;
  box(grupo, 'P2_base_de_concreto_tinaco', tinaco.position.x, nivel + pedestal / 2, tinaco.position.z, 1.52, pedestal, 1.24, concreto);
  tinaco.position.y += pedestal;
  box(grupo, 'P2_canto_concreto_de_azotea', anexo.position.x, nivel+.028, frente,
    anexo.scale.x+.08,.105,.22,concreto);
  for (let n = 0; n < 2; n++) {
    const x = tinaco.position.x + 1.18 + 1.34 * n;
    const z = frente - .68 - n * .14;
    const ancho = .94, fondo = .66, alto = .49, y = nivel + alto / 2 + .105;
    box(grupo, 'P2_carcasa_ventilada_en_azotea', x,y,z,ancho,alto,fondo,'#a4a59a');
    box(grupo, 'P2_marco_de_rejilla_de_cubierta', x,y,z+fondo/2+.009,ancho-.09,alto-.10,.017,'#4d524f');
    for (let rej = 0; rej < 12; rej++) {
      box(grupo, 'P2_barra_vertical_de_rejilla', x+(rej-5.5)*.07,y,z+fondo/2+.023,.013,alto-.115,.020,rejilla);
    }
    for (const altura of [-.132,0,.132]) {
      box(grupo, 'P2_travesaño_de_rejilla', x,y+altura,z+fondo/2+.023,ancho-.105,.013,.021,rejilla);
    }
    for (const dx of [-.28,.28]) {
      box(grupo, 'P2_soporte_bajo_de_ventilacion', x+dx,nivel+.06,z,.043,.12,fondo+.07,'#535d61');
    }
  }
}

function barraBlanca(THREE, grupo, box, nombre, a, b, grosor) {
  const delta = new THREE.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
  const longitud = delta.length();
  const pieza = box(grupo, nombre, (a[0]+b[0])/2, (a[1]+b[1])/2, (a[2]+b[2])/2,
    grosor, longitud, grosor, '#e1e4dc');
  pieza.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.divideScalar(longitud));
}

// Las cuatro patas y dos planos de diagonales se ven de perfil en el conjunto de la foto 0096.
function completarEstructuraDeCanastas(THREE, canchas, box) {
  const patas = canchas?.children.filter(pieza => pieza.name === 'Soporte_blanco_canasta');
  if (!patas?.length) return;
  const tableros = canchas.children.filter(pieza => pieza.name === 'Tablero_basquet_cancha');
  const grupo = grupoDeDetalle(THREE, canchas, 'Multicanchas_marcos_tubulares_completos', 'Corpus AZC 0096');
  for (let i = 0; i + 1 < patas.length; i += 2) {
    const a = patas[i], b = patas[i+1];
    const centro = (a.position.x + b.position.x) / 2;
    const tablero = tableros.find(pieza => Math.abs(pieza.position.x-centro) < .035 &&
      Math.abs(pieza.position.z - a.position.z) < 1.35);
    if (!tablero) continue;
    const posterior = a.position.z, anterior = tablero.position.z;
    const base = .361, y1 = 1.04, y2 = 1.77, y3 = 2.48, alto = 2.5;
    for (const {position:{x}} of [a,b]) {
      barraBlanca(THREE, grupo, box, 'Pata_anterior_de_canasta', [x,base,anterior],[x,alto,anterior],.064);
      barraBlanca(THREE, grupo, box, 'Riostra_inferior_de_canasta', [x,base,posterior],[x,y1,anterior],.055);
      barraBlanca(THREE, grupo, box, 'Riostra_media_de_canasta', [x,y1,anterior],[x,y2,posterior],.052);
    }
    const x0 = a.position.x, x1 = b.position.x;
    barraBlanca(THREE, grupo, box, 'Travesaño_anterior_de_canasta', [x0,y3,anterior],[x1,y3,anterior],.053);
    barraBlanca(THREE, grupo, box, 'Riostra_posterior_entre_patas', [x0,y1,posterior],[x1,y3,posterior],.049);
  }
}

// Red alta detrás del murete junto a las gradas. La foto fija ese lateral.
function colocarRedFutbol7(THREE, recinto, box) {
  const lateral = recinto?.getObjectByName('Murete_blanco_cancha_7');
  if (!lateral) return;
  const grupo = grupoDeDetalle(THREE, recinto, 'Red_lateral_F7_junto_a_gradas', 'Corpus AZC 0072 y 0073; altura y tensado aproximados');
  const x = lateral.position.x - .045;
  const minimo = lateral.position.z - lateral.scale.z / 2 + .18;
  const maximo = lateral.position.z + lateral.scale.z / 2 - .18;
  const fondo = maximo - minimo, vanos = 5, alero = 5.92, suelo = 1.08;
  const paso = fondo / vanos;
  function superior(z) {
    const v = (z-minimo) / paso;
    return alero - Math.sin(Math.PI * (v-Math.floor(v))) * .29;
  }
  const fibras = [];
  for (let vano = 0; vano <= vanos; vano++) {
    box(grupo, 'Mastil_de_red_alta_F7', x,(alero+suelo)/2,minimo+vano*paso,.062,alero-suelo,.062,'#a6aca2');
  }
  const densidad = Math.ceil(fondo/.191);
  const espesor = .013;
  for (let i = 0; i <= densidad; i++) {
    const z = minimo + fondo * i/densidad;
    const a = z-espesor/2, b = z+espesor/2, y = superior(z);
    fibras.push(x,suelo,a, x,y,a, x,suelo,b, x,suelo,b, x,y,a, x,y,b);
  }
  for (let k = 0; k <= 22; k++) {
    const propor = k / 22;
    for (let i = 0; i < 40; i++) {
      const z0 = minimo + fondo*i/40, z1 = minimo + fondo*(i+1)/40;
      const y0 = suelo + (superior(z0)-suelo)*propor;
      const y1 = suelo + (superior(z1)-suelo)*propor;
      fibras.push(x,y0,z0, x,y0+espesor,z0, x,y1,z1, x,y1,z1, x,y0+espesor,z0, x,y1+espesor,z1);
    }
  }
  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute('position', new THREE.Float32BufferAttribute(fibras,3));
  geometria.computeVertexNormals();
  const red = new THREE.Mesh(geometria, new THREE.MeshStandardMaterial({
    color:'#9da59d',side:THREE.DoubleSide,roughness:.88,transparent:true,opacity:.64,depthWrite:false,
  }));
  red.name='Tejido_translucido_de_red_F7';
  red.userData.disposeMaterial=true;
  grupo.add(red);
}

export function detallarCortesDeportivos(id, THREE, modelo) {
  if (id !== 'cyad') return modelo;
  const grupo = grupoDeDetalle(THREE, modelo.group, 'L_solado_y_registro_del_pasillo',
    'Corpus AZC 0084/0090; corredor del corte de CyAD');
  const cubo = new THREE.BoxGeometry();
  const materiales = new Map();
  function colocar(nombre, color, x,y,z, ancho,alto,fondo) {
    if (!materiales.has(color)) materiales.set(color, new THREE.MeshStandardMaterial({color,roughness:.86}));
    const pieza = new THREE.Mesh(cubo,materiales.get(color));
    pieza.name=nombre;
    pieza.position.set(x,y,z);
    pieza.scale.set(ancho,alto,fondo);
    pieza.receiveShadow=true;
    grupo.add(pieza);
  }
  // El pasillo visible tiene juntas alternadas y un registro cuadrado al ras.
  const tonos=['#d6cab7','#d2c7b9','#d9cdc0','#cfc5b7'];
  const xMin=-9.09, xMax=-6.63, zMin=-3.20, zMax=4.24, profundidad=.56;
  const registro={x:-7.48,z:.09,ancho:.34};
  for (let j=0; zMin+j*profundidad<zMax; j++) {
    const z0=zMin+j*profundidad, z1=Math.min(zMax,z0+profundidad);
    for(let x0=xMin-(j%2)*.36; x0<xMax; x0+=.72) {
      const a=Math.max(xMin,x0), b=Math.min(xMax,x0+.72);
      if(b-a<.016) continue;
      const tono=tonos[(j*7 + Math.round((x0-xMin+.36)/.36)) % tonos.length];
      colocar('L_loseta_rectangular_de_pasillo',tono,(a+b)/2,.029,(z0+z1)/2,b-a-.012,.012,z1-z0-.011);
    }
  }
  colocar('L_marco_enrasado_registro_de_pasillo','#96958b',registro.x,.037,registro.z,registro.ancho,.009,registro.ancho);
  colocar('L_tapa_registro_de_pasillo','#c0b7a9',registro.x,.043,registro.z,registro.ancho-.032,.009,registro.ancho-.032);
  return modelo;
}
