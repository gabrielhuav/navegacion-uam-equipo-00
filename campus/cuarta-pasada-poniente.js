// Cuarta revisión del poniente. Las piezas se acoplan a la maqueta existente.
const referenciaV1 = 'Street View de Puerta 2, enero de 2025. Hoja de barrotes representada junto a la jamba, con posición aproximada.';
const referenciaP2 = 'Street View de Puerta 5, enero de 2025. Tres ranuras y remate escalonado de la torre.';
const referenciaF = 'Laboratorios de Electrónica UAM: F-302. Corpus UAM–ESCOM etiquetado, 000347–000349 y 000415–000419.';

function crearGrupo(THREE, padre, nombre, reference) {
  const grupo = new THREE.Group();
  grupo.name = nombre;
  grupo.userData = {approximate: true, visualOnly: true, reference};
  padre.add(grupo);
  return grupo;
}

function detallarHojaPuerta2({THREE, world, box, material}) {
  const portico = world.getObjectByName('Portico_San_Pablo_V1');
  const jamba = portico?.getObjectByName('Jamba_norte_San_Pablo');
  if (!jamba) return;
  const grupo = crearGrupo(THREE, portico, 'Herrajes_y_hoja_de_Puerta_2', referenciaV1);
  const {x, y, z} = jamba.position;
  const anchoJamba = jamba.scale.z;
  const hormigon = '#a9aea8';
  const marco = '#864238';
  const exterior = x-jamba.scale.x/2+.15;
  // Se redondea la cara que mira a la avenida dentro de la anchura de la jamba.
  const redondeo = new THREE.Mesh(
    new THREE.CylinderGeometry(anchoJamba/2, anchoJamba/2, jamba.scale.y, 16),
    material(hormigon)
  );
  redondeo.name = 'Cara_curva_de_la_jamba_Puerta_2';
  redondeo.position.set(exterior, y, z);
  redondeo.castShadow = redondeo.receiveShadow = true;
  grupo.add(redondeo);

  const largo = 2.57;
  const base = .31;
  const alto = 2.30;
  // La hoja se muestra paralela al sentido de paso, dentro de la faja de la jamba.
  const ajuste = z+.13;
  const comienzo = x+.44;
  for (const dy of [.08, alto-.04]) {
    box(grupo, 'Bastidor_aparcado_Puerta_2', comienzo+largo/2, base+dy, ajuste,
      largo, .078, .082, marco);
  }
  for (let tramo=0; tramo<=12; tramo++) {
    const pilar = tramo===0 || tramo===12;
    const ancho = pilar ? .092 : .046;
    box(grupo, 'Barrote_de_la_hoja_Puerta_2', comienzo+.05+tramo*(largo-.10)/12,
      base+alto/2, ajuste, ancho, alto, ancho, marco);
  }
  for (const dy of [.49, 1.78]) {
    box(grupo, 'Bisagra_aparcada_Puerta_2', comienzo+.015, base+dy, ajuste,
      .11, .14, .132, '#67392e');
  }
}

function detallarTorrePuerta5({THREE, world, box, material}) {
  const portico = world.getObjectByName('Portico_Mapas_P2');
  const torre = portico?.getObjectByName('Torre_portico_P2');
  const remate = portico?.getObjectByName('Remate_superior_escalonado_Puerta_5');
  if (!torre || !remate) return;
  const grupo = crearGrupo(THREE, portico, 'Remates_de_las_ranuras_Puerta_5', referenciaP2);
  const ranuras = portico.children.filter(pieza => pieza.name==='Ranura_alta_torre_P2');
  for (const ranura of ranuras) {
    const {x, y, z} = ranura.position;
    const {y: alto, z: claro} = ranura.scale;
    ranura.material = material('#434a45');
    box(grupo, 'Dintel_de_ranura_de_la_torre', x-.030, y+alto/2+.012, z,
      .086, .052, claro+.10, '#a1a49a');
    box(grupo, 'Fondo_oscuro_de_ranura', x-.015, y, z,
      .013, alto-.082, claro-.04, '#373c38');
  }
  const {x, y, z} = remate.position;
  const {x: fondo, y: alto, z: ancho} = remate.scale;
  box(grupo, 'Canto_sombreado_del_remate_escalonado_Puerta_5', x-fondo/2-.008,
    y-alto/2+.035, z, .018, .07, ancho-.018, '#80877e');
}

function detallarPórticosCICTE({THREE, buildingGroups, box}) {
  const fachada = buildingGroups.get('A')?.getObjectByName('CICTE_marcos_de_azotea_y_celosia');
  if (!fachada) return;
  const vigas = fachada.children.filter(pieza => pieza.name==='Trabe_longitudinal_borde_CICTE');
  const postes = fachada.children.filter(pieza => pieza.name==='Pilar_sobre_azotea_CICTE');
  if (!vigas.length || !postes.length) return;
  const grupo = crearGrupo(THREE, fachada, 'Segundo_travesaño_longitudinal_CICTE',
    'Corpus propio de UAM, imagen_0050 e imagen_0051. Segundo travesaño y marco de concreto observado durante la obra.');
  const viga = vigas[0];
  const {x: ancho, y: alto, z: fondo} = viga.scale;
  const clara = '#c1c4ba';
  const travesanoY = postes[0].position.y+.50;
  box(grupo, 'Travesaño_superior_del_marco_CICTE', viga.position.x, travesanoY,
    viga.position.z, ancho, alto-.04, fondo-.025, clara);
  // Los extremos de los marcos transversales quedan expresados en la fachada.
  for (const pilar of postes.filter(pieza => Math.abs(pieza.position.z-viga.position.z)<.01)) {
    box(grupo, 'Testa_de_concreto_del_marco_CICTE', pilar.position.x, travesanoY,
      pilar.position.z-.18, .32, .24, .117, '#b4b7ad');
  }
}

function perfilFacetado(THREE, lados, seccion) {
  return new THREE.LatheGeometry(seccion.map(([r, y]) => new THREE.Vector2(r, y)), lados);
}

function detallarMesasJardinBD({THREE, world, material}) {
  const jardin = world.getObjectByName('Jardin_B_D_mobiliario_y_canteros');
  if (!jardin) return;
  const perfiles = new Map([
    ['Tablero_circular_jardin_B_D', perfilFacetado(THREE, 8,
      [[0,-.05],[.63,-.05],[.73,-.014],[.74,.024],[.69,.048],[0,.048]])],
    ['Pedestal_mesa_jardin_B_D', perfilFacetado(THREE, 6,
      [[0,-.31],[.21,-.31],[.34,.28],[.34,.31],[0,.31]])],
    ['Asiento_independiente_jardin_B_D', perfilFacetado(THREE, 8,
      [[0,-.033],[.26,-.033],[.29,.007],[.29,.022],[.25,.038],[0,.038]])],
    ['Base_asiento_jardin_B_D', perfilFacetado(THREE, 6,
      [[0,-.142],[.11,-.142],[.19,.133],[.18,.144],[0,.144]])],
  ]);
  const grupo = crearGrupo(THREE, jardin, 'Mobiliario_ochavado_jardin_B_D',
    'Corpus propio de UAM, imagen_0017 e imagen_0028. Tableros ochavados y pies troncopiramidales. Los conjuntos conservan su implantación aproximada.');
  for (const pieza of [...jardin.children]) {
    const perfil = perfiles.get(pieza.name);
    if (!perfil) continue;
    const color = pieza.name.startsWith('Base') || pieza.name.startsWith('Pedestal') ? '#878579' : '#a6a395';
    pieza.geometry = perfil;
    pieza.material = material(color);
    pieza.castShadow = pieza.receiveShadow = true;
    grupo.add(pieza);
  }
}

function dibujarInterior(THREE, grupo) {
  const cubo = new THREE.BoxGeometry(1,1,1);
  const colores = new Map();
  return (nombre, x,y,z, ancho,alto,fondo, color) => {
    if (!colores.has(color)) colores.set(color, new THREE.MeshStandardMaterial({color, roughness: .8}));
    const caja = new THREE.Mesh(cubo, colores.get(color));
    caja.name = nombre;
    caja.position.set(x,y,z);
    caja.scale.set(ancho,alto,fondo);
    caja.receiveShadow = true;
    grupo.add(caja);
    return caja;
  };
}

function libreria(THREE, modelo) {
  const grupo = crearGrupo(THREE, modelo.group, 'Libreria_estantes_altos_de_lomos',
    'Aleph 146, p. 4, fotografía del pasillo con lomos azules. Disposición histórica esquemática.');
  const caja = dibujarInterior(THREE, grupo);
  const nogal = '#916e48';
  const z = -5.2;
  caja('Fondo_del_anaquel_Libreria', 0, 1.13, z-.229, 7.7, 2.26, .08, '#765d46');
  for (const x of [-3.85, -1.93, 0, 1.93, 3.85]) {
    caja('Costado_del_anaquel_Libreria', x, 1.13, z, .067, 2.26, .48, nogal);
  }
  for (const y of [.12, .60, 1.09, 1.58, 2.06]) {
    caja('Canto_del_anaquel_Libreria', 0, y, z, 7.73, .061, .49, '#b3895b');
    if (y>2) continue;
    for (let i=0; i<44; i++) {
      const x = -3.73+i*.173;
      const alto = .15+.027*(i%6);
      const color = ['#314c70', '#415e84', '#607c9c', '#c0b3a0', '#9b735d'][i%5];
      caja('Lomo_en_anaquel_Libreria', x, y+.032+alto/2, z+.136,
        .12+.005*(i%4), alto, .17, color);
    }
  }
}

function posgradosD(THREE, modelo) {
  const grupo = crearGrupo(THREE, modelo.group, 'Cancel_y_rejillas_del_Nucleo_D',
    'Posgrados CyAD, instalaciones, ND_1 y ND_2. Rejilla horizontal sobre las hojas y contramarcos claros.');
  const caja = dibujarInterior(THREE, grupo);
  for (const faja of modelo.group.children.filter(malla => malla.name==='Faja_ventilacion_alta_D')) {
    const {z} = faja.position;
    const fondo = faja.scale.z;
    caja('Fondo_rehundido_de_ventilacion_D', 2.048, 2.595, z, .02, .18, fondo, '#848a86');
    for (let lama=0; lama<5; lama++) {
      caja('Lama_horizontal_del_cancel_D', 2.034, 2.527+lama*.034, z,
        .043, .016, fondo-.028, '#d9dcd2');
    }
    for (const borde of [-.5, .5]) {
      caja('Contramarco_blanco_del_cancel_D', 2.057, 1.27, z+borde*fondo,
        .048, 2.50, .041, '#ddded4');
    }
  }
  const vitrina = modelo.group.getObjectByName('Vitrina_roja_en_la_llegada_D');
  if (vitrina) {
    const {x, y, z} = vitrina.position;
    caja('Frente_acristalado_de_gabinete_D', x+.049, y, z, .018, .431, .221, '#503b39');
    caja('Extremo_de_herreria_de_gabinete_D', x+.061, y-.038, z+.118, .019, .21, .019, '#9f9990');
  }
}

function microelectronica(THREE, modelo) {
  modelo.group.userData.reference = referenciaF;
  const bancos = modelo.group.getObjectByName('Bancos_de_dos_niveles_y_pizarra_F302');
  if (bancos) bancos.userData.reference = referenciaF;
  const grupo = crearGrupo(THREE, modelo.group, 'Hoja_roja_y_proyector_F302', referenciaF);
  const caja = dibujarInterior(THREE, grupo);
  const x = 4.699;
  const z = 1.995;
  caja('Marco_de_la_puerta_F302', x, 1.115, z, .078, 2.23, .995, '#72524a');
  caja('Hoja_roja_del_acceso_F302', x-.051, 1.051, z, .040, 2.092, .889, '#ab3c32');
  caja('Marco_de_ventanilla_F302', x-.077, 1.574, z, .017, .260, .437, '#b1b5ac');
  caja('Ventanilla_obscura_del_F302', x-.09, 1.574, z, .013, .203, .382, '#4b5551');
  caja('Tirador_del_F302', x-.081, 1.016, z+.34, .061, .118, .03, '#c4c5ba');
  caja('Placa_clara_de_la_hoja_F302', x-.077, 1.845, z, .010, .093, .31, '#ede4d7');

  caja('Soporte_superior_de_proyector_F302', -1.08, 2.912, -.20, .13, .146, .13, '#747b72');
  caja('Proyector_F302', -1.08, 2.799, -.20, .365, .095, .283, '#e2e1d6');
  caja('Panel_frontal_de_proyector_F302', -1.08, 2.799, -.346, .317, .068, .02, '#6c746e');
}

export function aplicarCuartaPasadaPoniente(contexto) {
  detallarHojaPuerta2(contexto);
  detallarTorrePuerta5(contexto);
  detallarPórticosCICTE(contexto);
  detallarMesasJardinBD(contexto);
  const accesoB = contexto.buildingGroups.get('B')?.getObjectByName('Esquina_acristalada_junto_al_jardin_B');
  if (accesoB) accesoB.userData.reference = 'Cerramiento esquemático; la identificación con las fotos de la pasada anterior queda pendiente de verificar.';
}

export function interiorCuartaPasadaPoniente(id, THREE, modelo) {
  if (id==='libreria') libreria(THREE, modelo);
  if (id==='docenciaD') posgradosD(THREE, modelo);
  if (id==='microelectronicaF') microelectronica(THREE, modelo);
  return modelo;
}
