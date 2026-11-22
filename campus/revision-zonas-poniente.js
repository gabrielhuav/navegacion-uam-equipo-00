import {polygonArea, intersectConvex, polygonsOverlap, rectanglePolygon, segmentPolygon} from 'site-clearance';

const concreto = '#b3b4ac';
const juntaOscura = '#858a83';
const metalRojo = '#a3453a';

function crearGrupo(THREE, padre, nombre, referencia) {
  const grupo = new THREE.Group();
  grupo.name = nombre;
  grupo.userData = {approximate: true, visualOnly: true, reference: referencia};
  padre.add(grupo);
  return grupo;
}

function detallarPuerta2({THREE, world, box}) {
  const portico = world.getObjectByName('Portico_San_Pablo_V1');
  if (!portico) return;
  const dintel = portico.getObjectByName('Dintel_concreto_San_Pablo');
  const grupo = crearGrupo(THREE, portico, 'Juntas_y_caseta_Puerta_2',
    'Street View San Pablo, enero de 2025, y foto oblicua de diciembre de 2023');

  // Se mantienen la boca completa y el perfil del pórtico.
  const {x, y, z} = dintel.position;
  const {x: fondo, y: alto, z: ancho} = dintel.scale;
  for (const dz of [-.345, -.16, .16, .345]) {
    box(grupo, 'Union_de_panos_en_dintel', x - fondo/2, y, z + dz*ancho,
      .016, alto*.965, .029, juntaOscura);
  }
  box(grupo, 'Canto_inferior_de_dintel', x - fondo/2, y - alto*.41, z,
    .017, .029, ancho, '#8c9188');

  const caseta = world.getObjectByName('Detalles_Puerta_2');
  const vidrio = caseta?.getObjectByName('Vidrio_caseta_Puerta_2');
  if (!vidrio) return;
  const paños = crearGrupo(THREE, caseta, 'Cercos_del_acristalamiento_Puerta_2',
    'Foto oblicua de Puerta 2, diciembre de 2023');
  const {x: vx, y: vy, z: vz} = vidrio.position;
  const {x: largo, y: altura, z: anchoCaseta} = vidrio.scale;
  for (const signo of [-1, 1]) {
    const zz = vz + signo*(anchoCaseta/2 + .014);
    box(paños, 'Parteluz_frontal_de_caseta', vx+.16, vy, zz, .051, altura, .033, '#c3c5bf');
    for (const yy of [vy-altura*.48, vy+altura*.48]) {
      box(paños, 'Perfil_horizontal_de_caseta', vx, yy, zz, largo, .045, .034, '#c3c5bf');
    }
  }
  for (const yy of [vy-altura*.48, vy+altura*.48]) {
    box(paños, 'Perfil_lateral_de_caseta', vx-largo/2-.014, yy, vz,
      .034, .045, anchoCaseta, '#c3c5bf');
  }
}

function detallarSanPablo({THREE, world, box}) {
  for (const id of ['P1', 'P2']) {
    const portico = world.getObjectByName('Portico_Mapas_'+id);
    if (!portico) continue;
    const grupo = crearGrupo(THREE, portico, 'Remates_de_portico_'+id,
      'Street View San Pablo, enero de 2025, acceso '+(id==='P1' ? '4' : '5'));
    const dintel = portico.getObjectByName('Dintel_portico_'+id);
    const {y} = dintel.position;
    const {x: fondo, y: alto, z: ancho} = dintel.scale;
    box(grupo, 'Junta_en_frente_de_dintel', -fondo/2-.008, y-alto*.36, 0,
      .016, .038, ancho-.10, juntaOscura);

    const torre = portico.getObjectByName('Torre_portico_'+id);
    if (!torre) continue;
    const {y: torreY, z: torreZ} = torre.position;
    const {x: torreFondo, y: torreAlto, z: torreAncho} = torre.scale;
    const cima = torreY + torreAlto/2;
    if (id === 'P2') {
      // La toma de la Puerta 5 muestra un perfil escalonado y tres vanos.
      box(grupo, 'Remate_inferior_escalonado_Puerta_5', 0, cima+.21, torreZ,
        torreFondo, .42, torreAncho, '#a3a6a0');
      box(grupo, 'Remate_superior_escalonado_Puerta_5', .14, cima+.66, torreZ+.12,
        torreFondo*.73, .48, torreAncho*.75, '#9fa29b');
      for (const dz of [-.32, 0, .32]) {
        for (const borde of [-.085, .085]) {
          box(grupo, 'Jamba_de_ranura_en_torre', -.741, 3.79, torreZ+dz+borde,
            .041, .79, .04, concreto);
        }
        box(grupo, 'Vierteaguas_de_ranura', -.744, 3.397, torreZ+dz,
          .10, .052, .215, concreto);
      }
    } else {
      box(grupo, 'Canto_terracota_Puerta_4', -torreFondo/2-.005, cima-.11, torreZ,
        .020, .11, torreAncho, '#884c41');
      box(grupo, 'Encuentro_de_dintel_y_terracota_Puerta_4', -torreFondo/2-.005,
        y-alto*.36, torreZ, .020, .038, torreAncho, '#83463d');
    }
  }
}

function detallarCICTE({THREE, buildingGroups, box, material}) {
  const edificio = buildingGroups.get('A');
  if (!edificio) return;
  const losa = edificio.getObjectByName('Losa_cubierta_A');
  const celosia = edificio.children.filter(pieza => pieza.name==='A_celosia_vertical');
  if (!losa || celosia.length < 2) return;
  const grupo = crearGrupo(THREE, edificio, 'CICTE_marcos_de_azotea_y_celosia',
    'Corpus propio de UAM 0050/0051, fase de obra; perfil esquemático dentro de la huella actual');
  const {x, y, z} = losa.position;
  const {x: ancho, y: espesor, z: fondo} = losa.scale;
  const techo = y + espesor/2;
  const xMin = x-ancho*.455;
  const frente = z-fondo*.467, fondoMarcos = z+fondo*.11;
  for (let marco=0; marco<7; marco++) {
    const px = xMin + marco*ancho*.91/6;
    for (const cz of [frente, fondoMarcos]) {
      box(grupo, 'Pilar_sobre_azotea_CICTE', px, techo+1.20, cz, .40, 2.43, .38, concreto);
    }
    box(grupo, 'Trabe_transversal_elevada_CICTE', px, techo+1.75, (frente+fondoMarcos)/2,
      .31, .28, fondoMarcos-frente, '#c1c2b8');
  }
  for (const para of [0, 1]) {
    box(grupo, 'Trabe_longitudinal_borde_CICTE', x, techo+.65, frente + para*(fondoMarcos-frente),
      ancho*.922, .27, .29, concreto);
  }

  // La celosía registra varios tonos y piezas finas entre los pilares de concreto.
  const tonos = ['#64473c', '#885b42', '#715043', '#a1694c'];
  const {y: celosiaY, z: celosiaZ} = celosia[0].position;
  for (const [i, pieza] of celosia.entries()) {
    pieza.material = material(tonos[i%tonos.length]);
    if (i===celosia.length-1) break;
    const inicia = pieza.position.x, paso = celosia[i+1].position.x-inicia;
    for (const t of [1/3, 2/3]) {
      box(grupo, 'Lama_intermedia_CICTE', inicia+paso*t, celosiaY, celosiaZ,
        .115, 2.1, .245, tonos[(i+(t<.5 ? 2 : 3))%tonos.length]);
    }
  }
  // Montantes bajos ante los paños de PB que se alcanzan a ver sobre el tapial.
  for (const t of [.23, .63]) {
    const centro = x + ancho*(t-.5);
    const largo = ancho*.16;
    box(grupo, 'Pano_bajo_acristalado_CICTE', centro, 2.27, frente+.23,
      largo, .62, .077, '#566761');
    for (const p of [-.46, 0, .46]) {
      box(grupo, 'Perfil_del_pano_PB_CICTE', centro+largo*p, 2.27, frente+.181,
        .063, .69, .075, '#b9bfb5');
    }
  }
}

function espacioLibre(data, net, X, Z, S) {
  const nodos = new Map(net.nodos.map(nodo => [nodo.id, nodo]));
  const pasos = net.aristas.flatMap(tramo => {
    const a = nodos.get(tramo.de), b = nodos.get(tramo.a);
    return a?.nivel===0 && b?.nivel===0 && Math.hypot(a.x-b.x,a.z-b.z)>.01 ?
      [segmentPolygon(a,b,3.2)] : [];
  });
  const predio = data.site.map(([x,z]) => ({x:X(x),z:Z(z)}));
  const huellas = data.buildings.flatMap(b => b.rects.map(([x0,z0,x1,z1]) => {
    const girado = b.diamond ? Math.SQRT1_2 : 1;
    return rectanglePolygon(X((x0+x1)/2)+(b.offsetX||0), Z((z0+z1)/2)+(b.offsetZ||0),
      (x1-x0)*S()*girado, (z1-z0)*S()*girado, b.diamond ? (b.facadeYaw??Math.PI/4) : 0);
  }));
  return (x,z,ancho,fondo) => {
    const base = rectanglePolygon(x,z,ancho,fondo);
    return polygonArea(intersectConvex(base,predio))>=ancho*fondo-1e-5 &&
      ![...huellas,...pasos].some(obstaculo => polygonsOverlap(obstaculo,base));
  };
}

function detallarJardinBD({THREE, world, material, X, Z}, libre) {
  const vegetacion = world.getObjectByName('Vegetación');
  if (!vegetacion) return;
  const grupo = crearGrupo(THREE, vegetacion, 'Arboles_documentados_jardin_B_D',
    'Levantamiento de vegetación UAM, abril de 2023, lámina VE 01/02');
  // Centros de algunos ejemplares de conservación. Registro por esquinas
  // de B, C y D; el levantamiento no garantiza el inventario de hoy.
  const ejemplares = [
    [270,422,2.9,'fresno'], [274,327,3.0,'colorin'], [282,341,3.1,'colorin'],
    [287,386,2.8,'fresno'], [304,328,2.8,'colorin'], [325,397,3.0,'fresno'],
    [329,372,3.0,'fresno'], [348,346,2.9,'colorin'], [393,418,3.0,'colorin'],
  ];
  const tronco = new THREE.CylinderGeometry(.14,.26,3.1,10);
  const copa = new THREE.IcosahedronGeometry(1,2);
  const arboles = vegetacion.children.filter(nodo => nodo.name==='Árbol_editable');
  for (const [px,pz,radio,especie] of ejemplares) {
    const x = X(px), z = Z(pz);
    if (!libre(x,z,.85,.85) ||
        arboles.some(a => Math.hypot(a.position.x-x,a.position.z-z)<3.7)) continue;

    const arbol = crearGrupo(THREE, grupo, 'Jardin_B_D_'+especie, 'Lámina VE 01/02');
    arbol.position.set(x,.105,z);
    const pie = new THREE.Mesh(tronco,material('#76644e'));
    pie.position.y=1.55;
    pie.castShadow = true;
    arbol.add(pie);
    const tonos = especie==='fresno' ? ['#637e4a','#758f55','#668453'] :
      ['#496a47','#567b48','#456845'];
    for (let i=0; i<3; i++) {
      const angulo = 2*Math.PI*i/3;
      const ramas = new THREE.Mesh(copa,material(tonos[i]));
      ramas.position.set(Math.cos(angulo)*radio*.46, 3.9+(i===1 ? .52 : 0),
        Math.sin(angulo)*radio*.46);
      ramas.scale.set(radio*.78, radio*.73, radio*.73);
      ramas.castShadow = true;
      arbol.add(ramas);
    }
  }
}

function detallarCorredorC({THREE, world, data, buildingGroups, slab, S}) {
  const fachada = buildingGroups.get('C');
  const rect = data.buildings.find(b => b.id==='C')?.rects[0];
  if (!fachada || !rect) return;
  const grupo = crearGrupo(THREE, world, 'Solado_del_corredor_cultural_C',
    'Convenio de limpieza UAM, 2020, y foto de Incalli agosto 2024. Solado en el acceso del croquis');
  const bordeX = rect[2] + fachada.position.x/S();
  const corrimientoZ = fachada.position.z/S();
  const inicio = 392 + corrimientoZ, fin = 417 + corrimientoZ;
  // Pavimento al ras en la llegada existente a C, sin ubicar sus puertas.
  slab(grupo,[bordeX,inicio,bordeX+6.4,fin],'#a26151',.306,.040,'Paño_terracota_C');
  for (let pz=inicio+1.2; pz<fin; pz+=1.2) {
    slab(grupo,[bordeX+.11,pz,bordeX+6.25,pz+.043],'#b48270',.328,.006,'Junta_transversal_C');
  }
  for (const dx of [1.48, 3.12, 4.76, 6.32]) {
    slab(grupo,[bordeX+dx,inicio,bordeX+dx+.05,fin],'#bc8b79',.329,.006,'Junta_longitudinal_C');
  }
}

function detallarLlegadaD({THREE, world, box, slab, X, Z, S}, libre) {
  const llegada = world.getObjectByName('Detalles_Maps_corredor_cultural_D_F');
  if (!llegada?.getObjectByName('Andador_exterior_D_desde_estacionamiento')) return;
  const grupo = crearGrupo(THREE, llegada, 'Cebra_y_bolardos_de_llegada_D',
    'Fotos de la entrada de D desde estacionamiento, abril de 2017. Posiciones aproximadas');
  // La sombra en la ortofoto impide fijar la posición del cruce al centímetro.
  for (let i=0; i<6; i++) {
    const x0 = 362.8+i*2.05;
    slab(grupo,[x0,248.75,x0+1.10,253.45],'#e3dfca',.343,.009,'Franja_clara_de_cebra_D');
  }
  for (const [x,z] of [[360,254.8],[362.1,257.5],[375.8,255.3],[377.5,258.2]]) {
    const px = X(x), pz = Z(z);
    if (!libre(px,pz,.35,.35)) continue;
    box(grupo,'Base_hormigon_bolardo_D',px,.358,pz,.29,.070,.29,concreto);
    const bolardo = box(grupo,'Bolardo_amarillo_llegada_D',px,.734,pz,.123,.689,.123,'#d0a12d');
    bolardo.rotation.y = Math.PI/4;
  }
  for (const [x0,z0,x1,z1] of [[348,273,354,280],[388,270,400,277]]) {
    // Canto junto a los setos existentes, de concreto bajo y segmentado.
    const x = X((x0+x1)/2), z = Z(z0)-.042, ancho = (x1-x0)*S();
    if (libre(x,z,ancho,.13)) {
      box(grupo,'Guarnicion_baja_junto_a_seto_D',x,.37,z,ancho,.120,.127,concreto);
    }
  }
}

export function modelarZonasPoniente(contexto) {
  const {data, net, X, Z, S} = contexto;
  const libre = espacioLibre(data, net, X, Z, S);
  detallarPuerta2(contexto);
  detallarSanPablo(contexto);
  detallarCICTE(contexto);
  detallarJardinBD(contexto, libre);
  detallarCorredorC(contexto);
  detallarLlegadaD(contexto, libre);
}

export function mejorarInteriorIncalli(THREE, vista) {
  const grupo = crearGrupo(THREE, vista.group, 'Umbral_rojo_Auditorio_Incalli',
    'Maps Incalli #20, agosto de 2024, y contrato de limpieza UAM 2020');
  const cubo = new THREE.BoxGeometry();
  // El vano se representa en el tramo posterior del corte. Su posición
  // relativa a la sala y al corredor es esquemática.
  const colores = new Map();
  function caja(nombre, x, y, z, w, h, d, color) {
    if (!colores.has(color)) colores.set(color,new THREE.MeshStandardMaterial({color,roughness:.86}));
    const malla = new THREE.Mesh(cubo,colores.get(color));
    malla.name = nombre;
    malla.position.set(x,y,z);
    malla.scale.set(w,h,d);
    grupo.add(malla);
  }
  caja('Piso_terracota_en_umbral_Incalli',0,-.115,7.60,5.8,.22,2.04,'#ad684f');
  for (const x of [-1.95,0,1.95]) {
    caja('Junta_de_loseta_Incalli',x,-.003,7.65,.020,.012,1.94,'#c39c83');
  }
  caja('Muro_gris_en_torno_al_umbral',0,1.42,6.76,5.56,2.84,.16,'#a4a39a');
  caja('Marco_oscuro_del_umbral',0,1.16,6.85,2.24,2.30,.067,'#4a3935');
  for (const lado of [-1, 1]) {
    caja('Hoja_roja_de_Incalli',lado*.554,1.127,6.895,1.057,2.23,.053,'#a83432');
    caja('Barra_de_puerta_Incalli',lado*.56,.91,6.946,.79,.053,.058,'#c3c1b6');
  }
  caja('Pequena_placa_amarilla_Incalli',1.66,1.57,6.853,.48,.38,.025,'#cfb365');
  caja('Ventilacion_alta_del_umbral',0,2.50,6.847,2.21,.26,.028,'#585954');
  for (let i=0;i<6;i++) caja('Lama_ventilacion_Incalli',0,2.397+i*.04,6.865,2.19,.018,.032,'#a6a59b');
  return vista;
}
