// La geometría nueva se acopla a los volúmenes actuales. Los cortes son visuales.
function grupoDeDetalle(THREE, padre, nombre, fuente) {
  const grupo = new THREE.Group();
  grupo.name = nombre;
  grupo.userData = {approximate: true, visualOnly: true, reference: fuente};
  padre.add(grupo);
  return grupo;
}

function detallarCaseta({THREE, world, box}) {
  const puerta = world.getObjectByName('Detalles_Puerta_2');
  const vidrio = puerta?.getObjectByName('Vidrio_caseta_Puerta_2');
  const base = puerta?.getObjectByName('Base_caseta_Puerta_2');
  const alero = puerta?.getObjectByName('Alero_caseta_Puerta_2');
  if (!vidrio || !base || !alero) return;

  const grupo = grupoDeDetalle(THREE, puerta, 'Alfeizar_y_vierteaguas_caseta_Puerta_2',
    'Foto oblicua de la Puerta 2 en Maps, diciembre de 2023. Perfil perimetral de la cabina acristalada.');
  const {x, y, z} = base.position;
  const {x: ancho, y: alto, z: fondo} = base.scale;
  box(grupo, 'Alfeizar_continuo_caseta', x, y+alto/2+.009, z,
    ancho+.14, .055, fondo+.14, '#aeb0a5');
  box(grupo, 'Marco_sombra_bajo_alero_caseta', x, alero.position.y-alero.scale.y/2-.021, z,
    ancho+.13, .042, fondo+.13, '#565d58');
}

function detallarLuminariaPuerta2({THREE, world, box, material}) {
  const puerta = world.getObjectByName('Detalles_Puerta_2');
  if (!puerta) return;
  const grupo = grupoDeDetalle(THREE, puerta, 'Luminaria_solar_junto_a_Puerta_2',
    'Street View, enero de 2025, rumbo 279. Poste visible hacia el norte del acceso; posición aproximada.');
  // El poste queda al interior del perímetro y a un costado de la entrada.
  grupo.position.set(-1.9, .12, -11.3);
  const metal = '#babcba';
  const poste = new THREE.Mesh(new THREE.CylinderGeometry(.052, .078, 6.05, 9), material(metal));
  poste.name = 'Poste_galvanizado_luminaria_solar';
  poste.position.y = 3.025;
  poste.castShadow = true;
  grupo.add(poste);
  box(grupo, 'Cruceta_luminaria_solar', 0, 5.58, 0, .089, .073, 1.03, metal);
  for (const z of [-.47, .47]) {
    box(grupo, 'Cabezal_luminaria_solar', -.10, 5.525, z, .31, .083, .27, '#525c5b');
    box(grupo, 'Difusor_luminaria_solar', -.146, 5.481, z, .187, .017, .18, '#e3e1d3');
  }
  const panel = new THREE.Group();
  panel.position.set(-.14, 6.09, -.17);
  panel.rotation.x = .25;
  grupo.add(panel);
  box(panel, 'Marco_panel_fotovoltaico', 0, 0, 0, .83, .05, 1.28, '#9fa6a2');
  box(panel, 'Cara_panel_fotovoltaico', 0, .032, 0, .77, .015, 1.22, '#35484a');
}

function detallarPlantaBajaCICTE({THREE, buildingGroups, box}) {
  const edificio = buildingGroups.get('A');
  const fachada = edificio?.getObjectByName('CICTE_marcos_de_azotea_y_celosia');
  if (!fachada) return;
  const paños = fachada.children.filter(malla => malla.name==='Pano_bajo_acristalado_CICTE');
  const losa = edificio.getObjectByName('Losa_nivel_1_A');
  if (!losa || !paños.length) return;

  const grupo = grupoDeDetalle(THREE, edificio, 'Entrepano_de_obra_PB_CICTE',
    'Corpus propio, imagen_0050 e imagen_0051. Montantes de concreto claro y soportes rojizos durante la obra.');
  for (const paño of paños) {
    const {x, y, z} = paño.position;
    const {x: ancho, y: alto} = paño.scale;
    box(grupo, 'Zocalo_de_concreto_del_ventanal_CICTE', x, y-alto/2+.105, z-.065,
      ancho-.015, .21, .063, '#b6b7ac');
    box(grupo, 'Travesano_de_ventanal_PB_CICTE', x, y+.03, z-.062,
      ancho-.035, .064, .052, '#b8bbb2');
    for (const signo of [-1, 1]) {
      box(grupo, 'Montante_secundario_PB_CICTE', x+signo*ancho*.225, y, z-.061,
        .055, alto, .049, '#b5b9b0');
    }
  }
  const frente = paños[0].position.z;
  const techo = losa.position.y-losa.scale.y/2;
  const claro = techo-1.98;
  for (const t of [-.31, -.045]) {
    const x = losa.position.x+t*losa.scale.x;
    box(grupo, 'Perfil_rojizo_visto_detras_del_tapial_CICTE', x, 1.98+claro/2, frente+.33,
      .095, claro, .09, '#9d503d');
    box(grupo, 'Perfil_rojizo_visto_detras_del_tapial_CICTE', x+.24, 1.98+claro/2, frente+.33,
      .069, claro, .075, '#8b4636');
  }
}

function detallarEsquinaB({THREE, buildingGroups, box, material, data}) {
  const volumen = buildingGroups.get('B')?.getObjectByName('B_volumen_0');
  const base = volumen?.getObjectByName('B_cuerpo_PB');
  if (!base) return;

  const grupo = grupoDeDetalle(THREE, volumen, 'Esquina_acristalada_junto_al_jardin_B',
    'UAMFoto, corpus web 000292 y 000295. Esquina identificada por el rótulo B. Posición y longitud aproximadas.');
  const {x: ancho, z: fondo} = base.scale;
  const x = ancho/2, frente = -fondo/2;
  const piso = data.storeyHeight;
  const ventana = '#4b625c';
  const naranja = '#cf6435';
  box(grupo, 'Pano_vidriado_del_acceso_B', x-2.71, 1.46, frente-.025, 3.06, 2.85, .064, ventana);
  box(grupo, 'Sobremarco_oscuro_B', x-2.71, 2.94, frente-.033, 3.08, .105, .093, '#555d54');
  box(grupo, 'Pilar_naranja_en_esquina_B', x-.26, piso/2, frente-.045, .43, piso, .146, naranja);
  box(grupo, 'Jamba_naranja_en_esquina_B', x-4.44, 1.47, frente-.044, .267, 2.94, .127, naranja);

  const vidrio = material('#bad5c4').clone();
  vidrio.transparent = true;
  vidrio.opacity = .47;
  vidrio.depthWrite = false;
  for (const [centro, anchoPano] of [[x-3.55, 1.38], [x-.57, .73]]) {
    const paño = box(grupo, 'Guardacuerpo_translucido_en_B', centro, .655, frente-.33,
      anchoPano, .74, .034, '#a9c6ad');
    paño.material = vidrio;
    box(grupo, 'Pasamanos_metalico_B', centro, 1.045, frente-.33,
      anchoPano+.059, .036, .049, '#babeba');
    for (const lateral of [-.5, .5]) {
      box(grupo, 'Montante_guardacuerpo_B', centro+anchoPano*lateral, .657, frente-.33,
        .036, .80, .042, '#a8b0a7');
    }
  }
  box(grupo, 'Plinto_gris_esquina_B', x-2.18, .239, frente-.175,
    4.22, .15, .38, '#565c58');
}

function dibujarCorte(THREE, grupo) {
  const cubo = new THREE.BoxGeometry(1, 1, 1);
  const materiales = new Map();
  function material(color) {
    if (!materiales.has(color)) {
      materiales.set(color, new THREE.MeshStandardMaterial({color, roughness: .79}));
    }
    return materiales.get(color);
  }
  function caja(nombre, x, y, z, ancho, alto, fondo, color) {
    const malla = new THREE.Mesh(cubo, material(color));
    malla.name = nombre;
    malla.position.set(x, y, z);
    malla.scale.set(ancho, alto, fondo);
    malla.receiveShadow = true;
    grupo.add(malla);
    return malla;
  }
  return {caja, material};
}

function detallarLibreria(THREE, modelo) {
  const grupo = grupoDeDetalle(THREE, modelo.group, 'Mostrador_expositor_y_gavetas_Libreria_C',
    'Aleph 146, página 4, fotos de la Librería. Se reproduce el tipo de expositor; montaje actual por confirmar.');
  const {caja} = dibujarCorte(THREE, grupo);
  const madera = '#bc8049';
  const claro = '#d0a76e';
  const borde = '#bfc2b5';
  const x = -3.72;
  caja('Cuerpo_de_gavetas_Libreria', x, .325, -2.77, .70, .65, 2.86, madera);
  caja('Remate_de_gavetas_Libreria', x, .675, -2.77, .77, .065, 2.97, claro);
  for (const z of [-3.69, -2.77, -1.85]) {
    caja('Frente_de_gaveta_Libreria', x+.357, .346, z, .057, .42, .893, madera);
    caja('Tirador_de_gaveta_Libreria', x+.390, .50, z, .029, .027, .20, '#87694b');
  }
  const exhibicion = new THREE.Group();
  exhibicion.position.set(x+.007, .722, -2.77);
  exhibicion.rotation.z = -.43;
  grupo.add(exhibicion);
  const {caja: estante} = dibujarCorte(THREE, exhibicion);
  const soporte = '#c7a078';
  estante('Panel_inclinado_para_portadas_Libreria', 0, .304, 0, .058, .69, 2.89, soporte);
  for (const y of [.05, .275, .50]) {
    estante('Riel_claro_para_portadas_Libreria', .066, y, 0, .121, .025, 2.92, borde);
    for (let i=0; i<10; i++) {
      const color = ['#a58b71', '#987464', '#647984', '#bbad89'][(i+Math.round(y*5))%4];
      estante('Portada_neutra_en_expositor_Libreria', .042, y+.104,
        -1.29+i*.286, .035, .187, .189, color);
    }
  }
}

function detallarDocenciaD(THREE, modelo) {
  const grupo = grupoDeDetalle(THREE, modelo.group, 'Espera_y_acabados_de_Posgrados_D',
    'Posgrados CyAD, fotos institucionales ND_1 y ND_2. Bancas rojizas junto a la cara libre del corredor interior.');
  const {caja} = dibujarCorte(THREE, grupo);
  const herrería = '#464b48';
  const aluminio = '#a9aea8';
  const tapiz = '#9b5f58';

  for (const z of [-4.88, -4.34, -3.80, -3.26, -2.72, -2.18]) {
    caja('Base_de_asiento_Posgrados_D', -1.78, .205, z, .43, .081, .13, herrería);
    caja('Soporte_de_asiento_Posgrados_D', -1.86, .263, z, .054, .524, .046, herrería);
    caja('Asiento_rojizo_Posgrados_D', -1.73, .475, z, .484, .092, .473, tapiz);
    const respaldo = caja('Respaldo_rojizo_Posgrados_D', -1.98, .738, z,
      .084, .395, .466, tapiz);
    respaldo.rotation.z = .11;
  }

  // Juntas del terrazo claro y zócalo bajo la cancelería observados en ND_2.
  caja('Zocalo_del_corredor_Posgrados_D', 2.179, .067, -.648, .037, .129, 9.67, '#a3a29a');
  for (let z=-5.3; z<5.6; z+=.68) {
    caja('Junta_transversal_del_terrazo_D', 0, .002, z, 4.58, .003, .014, '#aaa79e');
  }
  for (let x=-1.91; x<2.2; x+=.69) {
    caja('Junta_longitudinal_del_terrazo_D', x, .002, 0, .014, .003, 11.27, '#aaa79e');
  }
  caja('Manija_horizontal_del_cancel_D', 1.49, 1.075, -1.20, .59, .042, .047, aluminio);
  for (const x of [1.25, 1.73]) {
    caja('Extremo_de_manija_del_cancel_D', x, 1.075, -1.233, .04, .04, .065, aluminio);
  }
  const placa = modelo.group.getObjectByName('Banda_gris_de_Posgrados_D');
  placa.material.color.set('#dbdbd5');
}

function detallarMicroelectronicaF(THREE, modelo) {
  const fuente = 'Laboratorios de Electrónica UAM, F-302. Fotografías institucionales en el corpus web 000385–000387.';
  modelo.group.userData.reference = fuente;
  modelo.camera = [1.65, 7.35, 13.4];
  const grupo = grupoDeDetalle(THREE, modelo.group, 'Bancos_de_dos_niveles_y_pizarra_F302', fuente);
  const {caja, material} = dibujarCorte(THREE, grupo);
  const cubierta = '#81463d';
  const herrería = '#2b3030';
  const piedra = '#d9d9d2';
  const costado = new THREE.Shape();
  costado.moveTo(-.60, .04);
  costado.lineTo(.53, .04);
  costado.lineTo(.53, .86);
  costado.lineTo(.03, .86);
  costado.quadraticCurveTo(-.24, .88, -.28, 1.115);
  costado.lineTo(-.31, 1.207);
  costado.lineTo(-.60, 1.207);
  costado.closePath();
  const perfil = new THREE.ExtrudeGeometry(costado, {depth: .065, bevelEnabled: false});

  for (const repisa of modelo.group.children.filter(malla => malla.name==='Repisa_instrum_F302')) {
    const {x, z} = repisa.position;
    const largo = repisa.scale.x;
    repisa.visible = false;
    caja('Cubierta_alta_para_monitores_F302', x, 1.207, z+.028,
      largo+.04, .067, .432, cubierta);
    for (const extremo of [-1, 1]) {
      const ala = new THREE.Mesh(perfil, material(herrería));
      ala.name = 'Costado_negro_curvo_del_banco_F302';
      ala.position.set(x+extremo*(largo/2-.02)+.032, 0, z+.435);
      ala.rotation.y = -Math.PI/2;
      ala.castShadow = true;
      ala.receiveShadow = true;
      grupo.add(ala);
    }
  }

  // Las pantallas descansan sobre el escalón alto. Bajo él queda la instrumentación.
  const cambios = {
    Pantalla_de_instrumentacion_F302: [.258, -.30],
    Cristal_de_instrumentacion_F302: [.258, -.30],
    Osciloscopio_F302: [-.320, .073],
    Caratula_de_osciloscopio_F302: [-.320, .073],
  };
  for (const malla of modelo.group.children) {
    const ajuste = cambios[malla.name];
    if (ajuste) {
      malla.position.y += ajuste[0];
      malla.position.z += ajuste[1];
    }
    if (malla.name==='Asiento_laboratorio_F302') malla.material = material('#98684c');
    if (malla.name==='Pantalla_de_instrumentacion_F302') {
      caja('Pie_de_monitor_F302', malla.position.x, 1.255, malla.position.z,
        .20, .026, .142, herrería);
      caja('Cuello_de_monitor_F302', malla.position.x, 1.29, malla.position.z-.02,
        .036, .062, .047, herrería);
    }
  }

  // El fondo permanece acristalado. La pizarra se ancla al muro lateral del corte.
  caja('Paño_de_bloc_claro_F302', 4.85, 1.56, -.87, .105, 3.12, 6.64, piedra);
  for (const z of [-2.19, .26]) {
    caja('Marco_aluminio_pizarra_F302', 4.777, 1.69, z, .072, 1.42, 2.39, '#929790');
    caja('Pizarra_blanca_F302', 4.735, 1.69, z, .017, 1.337, 2.311, '#e8e9e3');
    caja('Charola_de_pizarra_F302', 4.688, .978, z, .104, .042, 2.39, '#a4a69d');
  }
  for (let y=.17; y<3.11; y+=.19) {
    caja('Junta_de_bloc_del_aula_F302', 4.796, y, -.87, .012, .014, 6.63, '#b3b4ad');
  }
}

export function detallarZonasSanPablo(contexto) {
  detallarCaseta(contexto);
  detallarLuminariaPuerta2(contexto);
  detallarPlantaBajaCICTE(contexto);
  detallarEsquinaB(contexto);
}

export function detallarCortesSanPablo(id, THREE, modelo) {
  if (id==='libreria') detallarLibreria(THREE, modelo);
  if (id==='docenciaD') detallarDocenciaD(THREE, modelo);
  if (id==='microelectronicaF') detallarMicroelectronicaF(THREE, modelo);
  return modelo;
}
