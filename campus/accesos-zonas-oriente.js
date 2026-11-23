// Umbrales y galerías documentados. Los detalles se apoyan en las llegadas existentes.
export function modelarAccesosOriente({THREE, world, buildingGroups, box, material}) {
  completarGaleriaT(THREE, buildingGroups.get('T'), box, material);
  completarUmbralM(THREE, buildingGroups.get('M'), box);
  detallarPisoPorticoW(THREE, buildingGroups.get('W'), box);
  completarLlegadaP1(THREE, buildingGroups.get('P1'), buildingGroups.get('S'), box, material);
  completarGaleriaS(THREE, buildingGroups.get('S'), box);
  detallarFrenteR(THREE, buildingGroups.get('R'), box);
  ampliarPavimentoDeGradas(THREE, world.getObjectByName('Gradas_deportivas_Q'), box);
}

function grupoDetalle(THREE, padre, name, reference) {
  const grupo = new THREE.Group();
  grupo.name = name;
  grupo.userData = {approximate: true, reference};
  padre.add(grupo);
  return grupo;
}

// El pie de las ventanillas y el frente entre columnas se ven en 0079 y 0128.
function completarGaleriaT(THREE, edificio, box, material) {
  const fachada = edificio?.getObjectByName('T_AZC_fachada_y_escalera');
  const losa = fachada?.getObjectByName('T_galeria_exterior');
  const ventanillas = fachada?.children.filter(pieza => pieza.name === 'T_ventanilla_roja_CSE');
  if (!losa || !ventanillas.length) return;

  const grupo = grupoDetalle(THREE, fachada, 'T_umbral_y_solado_ventanillas',
    'Corpus AZC 0079, 0118, 0124 y 0128–0134; recorrido RV 8:14–8:24');
  const frente = losa.position.z + .70;
  const xInicio = ventanillas[0].position.x - 1.33;
  const xFin = ventanillas[ventanillas.length - 1].position.x + 1.33;
  const ancho = xFin - xInicio;
  const fondo = 2.43;
  const centroX = (xInicio + xFin) / 2;
  const centroZ = frente - .24;
  const juntas = '#9c9489';
  box(grupo, 'T_solado_claro_de_la_galeria', centroX, .232, centroZ, ancho, .032, fondo, '#cbc5b8');
  box(grupo, 'T_canto_claro_del_corredor', centroX, .249, centroZ + fondo / 2 - .065,
    ancho, .004, .127, '#d6cfc0');
  const secciones = Math.ceil(ancho / .52);
  for (let i = 1; i < secciones; i++) {
    box(grupo, 'T_junta_transversal_solado', xInicio + ancho * i / secciones, .249,
      centroZ, .012, .006, fondo, juntas);
  }
  for (const z of [-.82, -.33, .16, .65]) {
    box(grupo, 'T_junta_longitudinal_solado', centroX, .250, centroZ + z, ancho, .006, .013, juntas);
  }
  box(grupo, 'T_banda_oscura_entre_patio_y_ventanillas', centroX, .218,
    centroZ - fondo / 2 - .134, ancho, .021, .268, '#616b66');

  const alturaPlafon = losa.position.y - losa.scale.y / 2;
  for (const ventanilla of ventanillas) {
    const repisa = ventanilla.getObjectByName('T_repisa_ventanilla_CSE');
    repisa.material = material('#35342e');
    box(grupo, 'T_marco_luz_empotrada', ventanilla.position.x, alturaPlafon - .025, frente - .52,
      .115, .031, .115, '#77766b');
    box(grupo, 'T_difusor_luz_empotrada', ventanilla.position.x, alturaPlafon - .043, frente - .52,
      .075, .012, .075, '#e8dfc9');
  }
}

// La toma 0078 distingue el antepiso de los dos canceles existentes.
function completarUmbralM(THREE, edificio, box) {
  const fachada = edificio?.getObjectByName('M_fachada_esquina_gimnasio_exterior');
  const puertas = fachada?.children.filter(pieza => pieza.name === 'M_hoja_acristalada');
  if (!puertas?.length) return;

  const grupo = grupoDetalle(THREE, fachada, 'M_antepiso_de_los_canceles',
    'Corpus AZC 0077–0078 y registro institucional del gimnasio exterior');
  const xExterior = puertas[0].position.x + .68;
  const zMin = Math.min(...puertas.map(hoja => hoja.position.z)) - .56;
  const zMax = Math.max(...puertas.map(hoja => hoja.position.z)) + .56;
  const fondo = zMax - zMin;
  const centroZ = (zMin + zMax) / 2;
  box(grupo, 'M_pavimento_claro_de_llegada', xExterior, .237, centroZ, 1.62, .052, fondo, '#b9b6a7');
  box(grupo, 'M_borde_largo_de_antepiso', xExterior + .82, .245, centroZ, .11, .04, fondo, '#d0c8b8');
  box(grupo, 'M_junta_paralela_a_los_canceles', xExterior + .31, .266, centroZ, .014, .008, fondo, '#92938a');
  for (let z = zMin + .54; z < zMax; z += .54) {
    box(grupo, 'M_junta_transversal_de_antepiso', xExterior, .266, z,
      1.62, .008, .013, '#92938a');
  }
  for (const hoja of puertas) {
    box(grupo, 'M_riel_inferior_de_cancel', hoja.position.x + .030, .224, hoja.position.z,
      .056, .054, hoja.scale.z + .052, '#bbbcb4');
  }
}

// 0102–0103 dejan ver el escalón y las juntas oscuras a través del pórtico.
function detallarPisoPorticoW(THREE, edificio, box) {
  const portico = edificio?.getObjectByName('W_AZC_laboratorios_y_portico');
  const piso = portico?.getObjectByName('W_piso_portico_acceso');
  if (!piso) return;

  const grupo = grupoDetalle(THREE, portico, 'W_encuentro_de_pavimentos_portico',
    'Corpus AZC 0102 y 0103; fotos del atrio en Google Maps');
  const cara = piso.position.y + piso.scale.y / 2;
  const exterior = piso.position.x - piso.scale.x / 2;
  box(grupo, 'W_borde_claro_del_umbral', exterior + .16, cara + .004, 0,
    .31, .014, piso.scale.z - .4, '#d0cbb9');
  box(grupo, 'W_junta_lineal_del_borde', exterior + .33, cara + .008, 0,
    .058, .011, piso.scale.z - .4, '#5c6057');
  const ancho = Math.min(6.30, piso.scale.x - .77);
  for (let z = -piso.scale.z / 2 + 1.24; z <= piso.scale.z / 2 - .90; z += 2.6) {
    box(grupo, 'W_junta_transversal_oscura', exterior + .36 + ancho / 2, cara + .008, z,
      ancho, .012, .053, '#64665d');
  }
}

// 0013 documenta el adoquín y las basas metálicas junto a la escalera de baldosas azules.
function completarLlegadaP1(THREE, edificio, vecino, box, material) {
  const parte = edificio?.getObjectByName('P1_volumen_0');
  const postes = parte?.children.filter(pieza => pieza.name === 'P1_poste_rojo_luminaria');
  const torre = parte?.getObjectByName('P1_torre_azulejo_azul');
  if (!torre || !postes.length) return;

  const lado = postes[0].position.x + 1.39;
  const ancho = 2.56;
  const pisoS = vecino?.getObjectByName('S_piso_corrido_de_loseta');
  let extremo = torre.position.z + .42;
  if (pisoS) {
    const frenteS = pisoS.position.z - pisoS.scale.z / 2;
    const izquierda = parte.worldToLocal(pisoS.parent.localToWorld(new THREE.Vector3(-pisoS.scale.x / 2, 0, frenteS)));
    const derecha = parte.worldToLocal(pisoS.parent.localToWorld(new THREE.Vector3(pisoS.scale.x / 2, 0, frenteS)));
    if (izquierda.x < lado + ancho / 2 && derecha.x > lado - ancho / 2) {
      extremo = Math.min(extremo, izquierda.z - .075);
    }
  }
  const inicio = Math.max(postes[0].position.z, extremo - 17.0);
  const largo = extremo - inicio;
  if (largo < 2) return;
  const grupo = grupoDetalle(THREE, parte, 'P1_solado_de_la_llegada_a_la_torre',
    'Corpus AZC 0009 y 0013; Google Maps LAB y TALLERES CyAD');
  box(grupo, 'P1_cama_de_adoquin_de_la_llegada', lado, .217, (inicio + extremo) / 2,
    ancho, .051, largo, '#9d9c8b');
  box(grupo, 'P1_guarnicion_junto_a_luminarias', lado - ancho / 2, .248, (inicio + extremo) / 2,
    .17, .049, largo, '#bbbaad');
  const paso = .32;
  const tonos = ['#908f81', '#a5a292', '#a09e8f', '#959483'];
  const lotes = tonos.map(() => []);
  for (let fila = 0; (fila + 1) * paso < largo; fila++) {
    const z0 = inicio + fila * paso + .007;
    const z1 = z0 + paso - .014;
    for (let col = 0; col < 8; col++) {
      const x0 = lado - ancho / 2 + col * paso + .006;
      const x1 = x0 + paso - .012;
      const y = .251;
      const lote = lotes[(5 * fila + 3 * col + Math.floor(fila / 5)) % tonos.length];
      lote.push(x0,y,z0, x0,y,z1, x1,y,z0, x1,y,z0, x0,y,z1, x1,y,z1);
    }
  }
  for (const [i, posiciones] of lotes.entries()) {
    const geometria = new THREE.BufferGeometry();
    geometria.setAttribute('position', new THREE.Float32BufferAttribute(posiciones, 3));
    geometria.computeVertexNormals();
    const piso = new THREE.Mesh(geometria, material(tonos[i]));
    piso.name = 'P1_adoquin_cuadrado_de_llegada';
    piso.receiveShadow = true;
    grupo.add(piso);
  }
  for (const poste of postes) {
    box(grupo, 'P1_placa_pernada_de_luminaria', poste.position.x, .263, poste.position.z,
      .255, .043, .26, '#8e3834');
    box(grupo, 'P1_acople_oscuro_bajo_globo', poste.position.x, 3.46, poste.position.z,
      .165, .23, .165, '#444849');
  }
}

// La canaleta con ménsulas y las luminarias suspendidas son visibles desde la galería de S.
function completarGaleriaS(THREE, edificio, box) {
  const galeria = edificio?.getObjectByName('S_galeria_abierta_de_talleres');
  const techo = galeria?.getObjectByName('S_trabe_de_borde');
  const luces = galeria?.children.filter(pieza => pieza.name === 'S_luminaria_lineal');
  const cables = galeria?.children.filter(pieza => pieza.name === 'S_conducto_bajo_plafon');
  if (!techo || !luces.length || !cables.length) return;

  const grupo = grupoDetalle(THREE, galeria, 'S_instalaciones_visibles_del_pasillo',
    'Corpus AZC 0003, galería de S');
  const alto = techo.position.y + techo.scale.y / 2;
  const zBandeja = (cables[0].position.z + cables[cables.length - 1].position.z) / 2;
  const longitud = cables[0].scale.x;
  for (let i = 0; i < cables.length; i++) {
    cables[i].position.y = alto - .22;
  }
  for (let x = -longitud / 2 + .45; x < longitud / 2; x += 1.58) {
    box(grupo, 'S_mensula_de_charola', x, alto - .265, zBandeja, .049, .052, .42, '#60645f');
    for (const z of [zBandeja - .18, zBandeja + .18]) {
      box(grupo, 'S_tirante_de_charola', x, alto - .121, z, .024, .246, .029, '#6a7069');
    }
  }
  for (const luz of luces) {
    const x = luz.position.x + .27;
    const z = luz.position.z;
    luz.position.set(x, alto - .54, z);
    luz.scale.set(.13, .066, 1.32);
    box(grupo, 'S_carcasa_luz_suspendida', x, alto - .484, z, .16, .054, 1.38, '#b8b6aa');
    for (const off of [-.51, .51]) {
      box(grupo, 'S_cadena_cortada_de_luminaria', x, alto - .226, z + off, .014, .453, .014, '#6c6c60');
    }
  }
}

// Se modela el basamento y el paño ventilado de la caseta, independiente del acceso deportivo.
function detallarFrenteR(THREE, edificio, box) {
  const fachada = edificio?.getObjectByName('R_fachadas_y_subestacion');
  const caseta = fachada?.getObjectByName('R_caseta_subestacion_roja');
  const ventilas = fachada?.children.filter(pieza => pieza.name === 'R_rejilla_lateral_subestacion');
  if (!caseta || !ventilas.length) return;

  const grupo = grupoDetalle(THREE, fachada, 'R_sardineles_y_ventilas_de_caseta',
    'Corpus AZC 0060, toma desde la llegada exterior al gimnasio');
  const {x, z} = caseta.position;
  const {x: ancho, z: fondo} = caseta.scale;
  box(grupo, 'R_plinto_de_piedra_bajo_caseta', x, .15, z,
    ancho + .15, .31, fondo + .18, '#a59685');
  for (const rejilla of ventilas) {
    const lateral = Math.sign(rejilla.position.x - x);
    const cara = rejilla.position.x + lateral * rejilla.scale.x / 2;
    for (let i = 1; i <= 4; i++) {
      box(grupo, 'R_lama_alta_perfilada', cara + lateral * .015, rejilla.position.y + (i - 2.5) * .096,
        rejilla.position.z, .031, .028, rejilla.scale.z - .069, '#745047');
    }
    box(grupo, 'R_banda_inferior_de_ventilacion', cara, .57, rejilla.position.z,
      .025, .16, rejilla.scale.z - .06, '#734038');
  }
}

// El pavimento de losas grandes continúa bajo los arranques fotografiados en 0072 y 0073.
function ampliarPavimentoDeGradas(THREE, grada, box) {
  if (!grada) return;
  const grupo = grupoDetalle(THREE, grada, 'F7_llegada_frente_a_escaleras_de_gradas',
    'Corpus AZC 0072 y 0073; geometría de la grada y su alineación aérea existentes');
  const tonos = ['#a5a399', '#959383', '#b4ad9e', '#a19c8b'];
  const ancho = 6.25, fondo = 14.84, inicio = -.11;
  box(grupo, 'F7_pavimento_continuo_al_pie_de_gradas', inicio + ancho / 2, .179, 0,
    ancho, .135, fondo, '#77776b');
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 7; j++) {
      box(grupo, 'F7_losa_de_aproximacion_a_gradas', inicio + (i + .5) * ancho / 3,
        .245, (j - 3) * fondo / 7, ancho / 3 - .095, .022, fondo / 7 - .078, tonos[(2 * i + j) % tonos.length]);
    }
  }
}

export function detallarVistasOriente(id, THREE, modelo) {
  if (id === 'cyad') ampliarCorteL(THREE, modelo.group);
  if (id === 'gimnasioR') completarCancelInteriorR(THREE, modelo.group);
  return modelo;
}

function cajaDeInterior(THREE, grupo) {
  const geometria = new THREE.BoxGeometry();
  const materiales = new Map();
  return (nombre, color, x, y, z, ancho, alto, fondo, opacidad = 1) => {
    const clave = color + '/' + opacidad;
    if (!materiales.has(clave)) materiales.set(clave, new THREE.MeshStandardMaterial({
      color, roughness: .78, opacity: opacidad, transparent: opacidad < 1, depthWrite: opacidad === 1,
    }));
    const malla = new THREE.Mesh(geometria, materiales.get(clave));
    malla.name = nombre;
    malla.position.set(x, y, z);
    malla.scale.set(ancho, alto, fondo);
    malla.receiveShadow = true;
    grupo.add(malla);
  };
}

// La foto del pasillo muestra vitrinas sobre ladrillo, puerta azul y luminarias lineales.
function ampliarCorteL(THREE, escena) {
  const grupo = grupoDetalle(THREE, escena, 'L_pasillo_de_casilleros_y_vitrinas',
    'Corpus AZC 0084/0090; fotos 04 y 06 de Edificio L en Maps (febrero de 2024)');
  const caja = cajaDeInterior(THREE, grupo);
  const marco = '#e0ddd4', ladrillo = '#ab7843', junta = '#97735b';
  for (const z of [-4.7, .75, 3.55]) {
    caja('L_basamento_de_ladrillo', ladrillo, -9.38, .31, z, .60, .62, 2.06);
    caja('L_repisa_clara_de_vitrina', marco, -9.40, .634, z, .68, .043, 2.08);
    caja('L_travesano_superior_de_vitrina', marco, -9.10, 2.08, z, .05, .059, 2.08);
    caja('L_vidrio_de_vitrina', '#adbbb4', -9.113, 1.354, z, .034, 1.42, 2.04, .31);
    for (const dz of [-1.04, 0, 1.04]) {
      caja('L_parteluz_del_pasillo', marco, -9.10, 1.356, z + dz, .056, 1.45, .047);
    }
    for (const y of [.15, .30, .45]) {
      caja('L_aparejo_visible_de_ladrillo', junta, -9.077, y, z, .008, .011, 2.06);
    }
  }
  caja('L_puerta_azul_de_pasillo', '#344c68', -9.704, 1.19, -1.67, .063, 2.27, .96);
  caja('L_marco_superior_de_puerta', marco, -9.657, 2.36, -1.67, .06, .061, 1.07);
  caja('L_umbral_de_aluminio_de_la_puerta_azul', '#a5a59d', -9.647, .039, -1.67, .142, .009, 1.064);
  for (const z of [-2.19, -1.15]) {
    caja('L_jamba_de_puerta', marco, -9.657, 1.19, z, .06, 2.34, .056);
  }
  for (const z of [-4.7, -2, .70, 3.40, 6.10]) {
    caja('L_luminaria_en_cubierta_de_pasillo', '#ece5d1', -8.42, 2.892, z, .115, .048, 1.28);
  }
}

// En la duela hay una entrada baja con retorno ocre y doble hoja roja junto a las espalderas.
function completarCancelInteriorR(THREE, escena) {
  const grupo = grupoDetalle(THREE, escena, 'R_portal_ocre_de_la_duela',
    'CGA UAM-A, fotografía de la duela multiusos');
  const caja = cajaDeInterior(THREE, grupo);
  const centro = -11.9, z = -10.06, ancho = 2.18;
  caja('R_dintel_saliente_ocre', '#bf954a', centro, 2.62, z, 2.65, .35, .46);
  for (const lateral of [-1, 1]) {
    caja('R_pilastra_ocre_del_umbral', '#bc934c', centro + lateral * 1.21, 1.23, z, .23, 2.46, .46);
    caja('R_hoja_roja_de_la_duela', '#9f3835', centro + lateral * ancho / 4, 1.18, z + .208,
      ancho / 2 - .022, 2.37, .05);
    caja('R_placa_clara_de_hoja', '#eee6d4', centro + lateral * .47, 1.47, z + .24, .19, .19, .019);
    caja('R_tirador_del_acceso_de_duela', '#b7a48c', centro + lateral * .088, 1.06, z + .24, .034, .17, .038);
  }
  caja('R_junta_del_umbral', '#b4a38a', centro, .038, z + .33, 2.63, .032, .24);
}
