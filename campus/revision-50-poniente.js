// Acabados de 17 sectores del poniente. Las piezas nuevas se apoyan en sus
// anfitriones existentes y las marcas de piso son superficies a ras.
const fuentes = {
  puerta2: 'Street View San Pablo Xalpa, enero de 2025; vista oblicua de diciembre de 2023',
  puerta4: 'Street View, Puerta 4, enero de 2025',
  puerta5: 'Street View, Puerta 5 desde San Pablo Xalpa, enero de 2025',
  obra: 'Corpus propio, 0050 y 0051; licitación UAM.JA.RG.LP.03.2024',
  jardin: 'Corpus propio 0017 y 0028; levantamiento UAM VE 01/02, abril de 2023',
  d: 'Foto Maps al pie del edificio D, abril de 2017; Posgrados CyAD, serie ND',
  cultural: 'Recorrido 360° 0:20–0:47 y fichas del corredor cultural cotejadas en la cuarta pasada',
  roja: 'Aleph 336, pp. 3–4; corpus propio 0025, 0040 y 0049',
  f: 'F desde Plaza Roja, foto de junio de 2023; corpus web 000347/000349/000416 para distinguir la galería del interior',
  g: 'Corpus propio 0066, 0080 y 0086; paso de G en el panorama de Plaza Roja',
};

function detalle(ctx, padre, id, nombre, reference) {
  const grupo = new ctx.THREE.Group();
  grupo.name = 'Zona50_' + id + '_' + nombre;
  grupo.userData = {approximate: true, visualOnly: true, reference};
  padre.add(grupo);
  return grupo;
}

function buscarTodos(grupo, nombre) {
  const piezas = [];
  grupo?.traverse(pieza => {
    if (pieza.name === nombre) piezas.push(pieza);
  });
  return piezas;
}

function porticoV1(ctx) {
  const obra = ctx.world.getObjectByName('Portico_San_Pablo_V1');
  const dintel = obra?.getObjectByName('Dintel_concreto_San_Pablo');
  if (!dintel) return;
  const g = detalle(ctx, dintel.parent, '01', 'Canto_del_portico_Puerta_2', fuentes.puerta2);
  const {x,y,z} = dintel.position;
  const {x:fondo,y:alto,z:ancho} = dintel.scale;
  // El dintel de concreto tiene una cara horizontal sombreada y testas claras.
  ctx.box(g,'Canto_inferior_de_hormigon_Puerta_2', x,y-alto/2-.021,z,
    fondo-.17,.042,ancho-.19,'#777b73');
  for (const lado of [-1,1]) {
    ctx.box(g,'Testa_clara_del_dintel_Puerta_2', x,y,z+lado*(ancho/2+.013),
      fondo-.09,alto-.10,.026,'#b8b6a8');
  }
}

function casetaV1(ctx) {
  const base = ctx.world.getObjectByName('Base_caseta_Puerta_2');
  if (!base) return;
  const g = detalle(ctx, base.parent, '02', 'Despiece_de_caseta_Puerta_2', fuentes.puerta2);
  const {x,y,z} = base.position;
  const {x:ancho,y:alto,z:fondo} = base.scale;
  for (const lado of [-1,1]) {
    ctx.box(g,'Soclo_de_caseta_en_cara_larga',x,y-alto*.35,z+lado*(fondo/2+.013),
      ancho,.16,.026,'#858575');
    ctx.box(g,'Soclo_de_caseta_en_testa',x+lado*(ancho/2+.014),y-alto*.35,z,
      .028,.16,fondo,'#858575');
  }
}

function llegadaEntrePanos(ctx) {
  const piso = ctx.world.getObjectByName('Andador_Puerta_V1');
  if (!piso?.userData.nodos) return;
  const g = detalle(ctx, piso.parent, '03', 'Solado_peatonal_entre_panos',
    'Tramo de Puerta 2 entre estacionamientos. Ortofoto Esri y eje aproximado de la red');
  const nodos = new Map(ctx.net.nodos.map(nodo => [nodo.id,nodo]));
  const eje = piso.userData.nodos.map(id => nodos.get(id));
  const ancho = piso.userData.ancho;
  // Las juntas se apoyan sólo en los paños rectos de la traza ya recortada.
  for (let i=1;i<eje.length;i++) {
    const a=eje[i-1], b=eje[i];
    if (!a || !b) continue;
    const dx=b.x-a.x,dz=b.z-a.z,largo=Math.hypot(dx,dz);
    for (let dist=1.3;dist<largo-1.1;dist+=2.3) {
      const t=dist/largo;
      const junta=ctx.box(g,'Junta_transversal_entre_panos_V1',a.x+dx*t,.358,a.z+dz*t,
        .038,.007,ancho-.17,'#9b9484');
      junta.rotation.y=Math.atan2(-dz,dx);
    }
  }
}

function portalSecundario(ctx, id, numero) {
  const arco = ctx.world.getObjectByName('Portico_Mapas_'+id);
  const dintel=arco?.getObjectByName('Dintel_portico_'+id);
  const torre=arco?.getObjectByName('Torre_portico_'+id);
  if (!dintel || !torre) return;
  const cuatro = id === 'P1';
  const g = detalle(ctx, arco, numero, 'Cara_exterior_'+id, cuatro ? fuentes.puerta4 : fuentes.puerta5);
  const {x,y,z}=dintel.position;
  const {x:fondo,y:alto,z:claro}=dintel.scale;
  ctx.box(g,'Canto_de_cimbra_del_portico_'+id,x-fondo/2-.008,y+alto*.35,z,
    .016,.055,claro-.06,cuatro ? '#c5c1af' : '#c0bfb6');
  const {x:tx,y:ty,z:tz}=torre.position;
  const {x:d,y:h,z:w}=torre.scale;
  if (cuatro) {
    ctx.box(g,'Soclo_de_mamposteria_del_apoyo_Puerta_4',tx-d/2-.013,ty-h/2+.17,tz,
      .026,.31,w,'#666257');
  } else {
    // El retorno de concreto enmarca las tres ranuras ya modeladas.
    ctx.box(g,'Franja_terracota_en_el_retorno_Puerta_5',tx-d/2-.012,ty,tz+w*.415,
      .024,h-.16,.105,'#9a655b');
    ctx.box(g,'Junta_baja_de_torre_Puerta_5',tx-d/2-.014,ty-h*.300,tz,
      .025,.045,w-.045,'#7d8179');
  }
}

function obraCICTE(ctx) {
  const a=ctx.buildingGroups.get('A');
  const celosia=a?.getObjectByName('CICTE_marcos_de_azotea_y_celosia');
  if (!celosia) return;
  const paños=buscarTodos(celosia,'Pano_bajo_acristalado_CICTE');
  const g=detalle(ctx,celosia,'06','Huecos_de_la_fachada_CICTE',fuentes.obra);
  for (const paño of paños) {
    const {x,y,z}=paño.position;
    ctx.box(g,'Cargadero_entre_vanos_PB_CICTE',x,y+paño.scale.y/2+.065,z-.095,
      paño.scale.x+.13,.130,.131,'#c4c1b4');
    for (const lado of [-1,1]) {
      ctx.box(g,'Remate_vertical_lateral_de_vano_CICTE',x+lado*(paño.scale.x/2+.026),y,z-.060,
        .072,paño.scale.y+.195,.10,'#b7b4a7');
    }
  }

  const marcos=detalle(ctx,celosia,'07','Cantos_de_los_marcos_de_azotea',fuentes.obra);
  for (const trabe of buscarTodos(celosia,'Trabe_transversal_elevada_CICTE')) {
    const {x,y,z}=trabe.position;
    ctx.box(marcos,'Sombra_inferior_de_trabe_CICTE',x,y-trabe.scale.y/2-.022,z,
      trabe.scale.x-.042,.044,trabe.scale.z-.05,'#949589');
    ctx.box(marcos,'Testa_revelada_de_trabe_CICTE',x,y,z-trabe.scale.z/2-.011,
      trabe.scale.x-.06,trabe.scale.y-.065,.022,'#d0ccbe');
  }
}

function galeriaB(ctx) {
  const galeria=ctx.buildingGroups.get('B')?.getObjectByName('B_tramo_cubierto_del_piso_1');
  const losa=galeria?.getObjectByName('B_piso_continuo_de_galeria');
  if (!losa) return;
  const g=detalle(ctx,galeria,'08','Solado_del_pasillo_B',galeria.userData.reference || fuentes.jardin);
  const {x,y,z}=losa.position;
  const {x:ancho,y:alto,z:fondo}=losa.scale;
  ctx.box(g,'B_cenefa_del_pasillo_cubierto',x,y+alto/2+.006,z-fondo/2+.12,
    ancho-.10,.010,.23,'#aa9c89');
  const apartados=Math.floor(ancho/1.86);
  for (let i=1;i<apartados;i++) {
    ctx.box(g,'B_junta_de_losa_en_galeria',x-ancho/2+ancho*i/apartados,y+alto/2+.006,z,
      .036,.010,fondo-.12,'#918d82');
  }
}

function jardinBD(ctx) {
  const camino=ctx.world.getObjectByName('Sendero_curvo_visible_desde_C');
  if (camino) {
    const g=detalle(ctx,camino.parent,'09','Solado_curvo_B_D','Ortofoto Esri y trazado de sendero desde C');
    const suelo=camino.clone();
    suelo.name='Paño_arena_del_sendero_B_D';
    suelo.material=ctx.material('#c9b89a');
    delete suelo.userData.disposeMaterial;
    suelo.position.y+=.004;
    g.add(suelo);
  }
  const jardin=ctx.world.getObjectByName('Jardin_B_D_mobiliario_y_canteros');
  const bases=buscarTodos(jardin,'Plataforma_circular_jardin_B_D');
  if (!bases.length) return;
  const g=detalle(ctx,jardin,'10','Remate_del_mobiliario_B_D',fuentes.jardin);
  for (const base of bases) {
    const {radiusTop:radio,height:alto}=base.geometry.parameters;
    const aro=new ctx.THREE.Mesh(new ctx.THREE.RingGeometry(radio-.11,radio-.018,32),
      ctx.material('#bdb6a3'));
    aro.name='Canto_del_zocalo_circular_B_D';
    aro.rotation.x=-Math.PI/2;
    aro.position.copy(base.position);
    aro.position.y+=alto/2+.006;
    g.add(aro);
  }
}

function llegadaD(ctx) {
  const llegada=ctx.world.getObjectByName('Andador_exterior_D_desde_estacionamiento');
  if (!llegada) return;
  const g=detalle(ctx,llegada.parent,'11','Solado_de_llegada_D',fuentes.d);
  const copia=llegada.clone();
  copia.name='Concreto_claro_de_llegada_D';
  copia.position.y+=.003;
  copia.material=ctx.material('#c7c0af');
  delete copia.userData.disposeMaterial;
  g.add(copia);
  // Sectores transversales contenidos en la ampliación de la propia llegada.
  for (const [z,x0,x1] of [[256,364,373],[264,361.5,378.7],[272,357.7,383.3],[280,354.7,387.6]]) {
    ctx.slab(g,[x0,z,x1,z+.085],'#aaa08e',.343,.005,'Junta_en_loseta_en_llegada_D');
  }
}

function corredorC(ctx) {
  const corredor=ctx.world.getObjectByName('Solado_del_corredor_cultural_C');
  const banda=corredor?.getObjectByName('Franja_clara_del_umbral_C');
  if (!banda) return;
  const g=detalle(ctx,corredor,'12','Encuentro_del_solado_C',fuentes.cultural);
  const {x,y,z}=banda.position;
  const {x:ancho,y:alto,z:fondo}=banda.scale;
  ctx.box(g,'C_cenefa_piedra_clara_umbrales',x,y+alto/2+.005,z,
    ancho*.82,.008,fondo-.08,'#c9c3b7');
  ctx.box(g,'C_junta_de_cenefa_y_terracota',x+ancho/2+.021,y+alto/2+.006,z,
    .048,.008,fondo-.08,'#855f52');
}

function galeriaE(ctx) {
  const trabe=ctx.buildingGroups.get('E')?.getObjectByName('Trabe_corrida_galeria_E_0');
  if (!trabe) return;
  const g=detalle(ctx,trabe.parent,'13','Canto_de_la_galeria_E',fuentes.cultural);
  const {x,y,z}=trabe.position;
  const {x:ancho,y:alto,z:fondo}=trabe.scale;
  ctx.box(g,'E_franja_de_sombra_bajo_la_trabe',x,y-alto*.30,z+fondo/2+.010,
    ancho-.16,.077,.021,'#837e71');
  for (let t=-.42;t<.43;t+=.12) {
    ctx.box(g,'E_enjarje_vertical_de_trabe',x+ancho*t,y,z+fondo/2+.010,
      .044,alto-.060,.021,'#918b7e');
  }
}

function plazaRoja(ctx) {
  const banda=ctx.world.getObjectByName('Banda_concreto_Plaza_Roja');
  if (!banda) return;
  const g=detalle(ctx,banda.parent,'14','Canal_de_la_Plaza_Roja',fuentes.roja);
  // Los bordes reproducen el recorte del concreto que separa sus losetas.
  const cenefa=banda.clone();
  cenefa.name='Cenefa_clara_alrededor_del_canal_Plaza_Roja';
  cenefa.material=ctx.material('#cac0ac');
  delete cenefa.userData.disposeMaterial;
  cenefa.position.y+=.002;
  g.add(cenefa);
}

function galeriaF(ctx) {
  const galeria=ctx.buildingGroups.get('F')?.getObjectByName('Galeria_abierta_F_piso_1');
  const losa=galeria?.getObjectByName('Losa_galeria_F_P1');
  if (!losa) return;
  const g=detalle(ctx,galeria,'15','Losa_de_la_galeria_F',fuentes.f);
  const {x,y,z}=losa.position;
  const {x:ancho,y:alto,z:fondo}=losa.scale;
  ctx.box(g,'F_canto_sombreado_bajo_la_losa',x,y-alto*.29,z-fondo/2-.015,
    ancho-.10,.075,.030,'#86867a');
  for (let t=-.44;t<.46;t+=.11) {
    ctx.box(g,'F_union_vertical_entre_panos_de_losa',x+ancho*t,y,z-fondo/2-.015,
      .048,alto-.024,.030,'#929084');
  }
}

function jardinF(ctx) {
  const entorno=ctx.world.getObjectByName('Detalles_Maps_corredor_cultural_D_F');
  const setos=buscarTodos(entorno,'Seto_discontinuo_F');
  if (!setos.length) return;
  const g=detalle(ctx,entorno,'16','Bases_de_arriate_en_jardin_F',fuentes.f);
  for (const seto of setos) {
    const {x,y,z}=seto.position;
    const {x:ancho,y:alto,z:fondo}=seto.scale;
    // La base sustituye el tramo inferior sin ampliar la huella del seto.
    const basamento=.094;
    seto.position.y+=basamento/2;
    seto.scale.y-=basamento;
    ctx.box(g,'F_remate_piedra_al_pie_del_arriate',x,y-alto/2+basamento/2,z,
      ancho,basamento,fondo,'#969381');
  }
}

function pasoG(ctx) {
  const cruce=ctx.world.getObjectByName('G_cruce_entre_Plaza_Roja_y_COSEI');
  const cantos=buscarTodos(cruce,'G_canto_claro_continuo_del_vano');
  if (!cantos.length) return;
  const g=detalle(ctx,cruce,'17','Cantos_del_pasadizo_G',fuentes.g);
  for (const canto of cantos) {
    const copia=canto.clone();
    copia.name='Canto_marfil_del_andador_G';
    copia.material=ctx.material('#d3c8b5');
    delete copia.userData.disposeMaterial;
    copia.position.y+=.005;
    g.add(copia);
  }
}

export function mejorarPoniente50(contexto) {
  porticoV1(contexto);
  casetaV1(contexto);
  llegadaEntrePanos(contexto);
  portalSecundario(contexto,'P1','04');
  portalSecundario(contexto,'P2','05');
  obraCICTE(contexto);
  galeriaB(contexto);
  jardinBD(contexto);
  llegadaD(contexto);
  corredorC(contexto);
  galeriaE(contexto);
  plazaRoja(contexto);
  galeriaF(contexto);
  jardinF(contexto);
  pasoG(contexto);
}
