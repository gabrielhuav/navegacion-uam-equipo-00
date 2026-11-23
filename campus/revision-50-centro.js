// Detalles de la revisión de 50 zonas. Cada pieza sigue una superficie, un
// mueble o un vano del modelo, y conserva la implantación de los recorridos.
const rv = 'https://www.youtube.com/watch?v=rU-4eFuBX2g&t=';
const ajedrezHO = 'https://bertely.wordpress.com/wp-content/uploads/2009/05/plazas-del-ajedrez-obra-02.jpg';
const ajedrezHP = 'https://bertely.wordpress.com/wp-content/uploads/2009/05/plazas-del-ajedrez-noche-01.jpg';
const explanadaI = 'https://www.google.com/maps/@19.5034453,-99.1865436,3a,75y,149h,90t/data=!3m4!1e1!3m2!1sCIHM0ogKEICAgICE65LQNQ!2e10';

function zona({THREE}, padre, nombre, reference) {
  if (!padre || padre.getObjectByName(nombre)) return null;
  const grupo = new THREE.Group();
  grupo.name = nombre;
  grupo.userData = {approximate: true, reference};
  padre.add(grupo);
  return grupo;
}

function superficie({THREE, material}, grupo, nombre, vertices, color) {
  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometria.computeVertexNormals();
  const pieza = new THREE.Mesh(geometria, material(color));
  pieza.name = nombre;
  pieza.receiveShadow = true;
  grupo.add(pieza);
}

function anillo(c, grupo, nombre, centro, radios, altura, desde, hasta, color) {
  const [x, z] = centro;
  const [radioX, radioZ, interior, exterior] = radios;
  const pasos = Math.max(6, Math.ceil((hasta - desde) * 16));
  const vertices = [];
  const punto = (radio, angulo) =>
    [x + radioX * radio * Math.cos(angulo), altura, z + radioZ * radio * Math.sin(angulo)];
  for (let i = 0; i < pasos; i++) {
    const a = desde + (hasta - desde) * i / pasos;
    const b = desde + (hasta - desde) * (i + 1) / pasos;
    const p = punto(interior, a), q = punto(interior, b);
    const r = punto(exterior, b), s = punto(exterior, a);
    vertices.push(...p, ...q, ...r, ...p, ...r, ...s);
  }
  superficie(c, grupo, nombre, vertices, color);
}

function balconesHO(c) {
  const {THREE, buildingGroups, material} = c;
  const volumen = buildingGroups.get('HO')?.getObjectByName('HO_volumen_0');
  const grupo = zona(c, volumen, 'Zona50_18_HO_ventanas_curvas', 'Corpus AZC 0005 y 0006, banda de vidrio entre antepechos curvos.');
  if (!grupo) return;
  for (const vidrio of volumen.children.filter(p => /^Ventanal_curvo_[0-9]+$/.test(p.name))) {
    const {radiusTop, height, thetaStart, thetaLength} = vidrio.geometry.parameters;
    const radio = radiusTop + .034;
    const perfil = new THREE.Mesh(
      new THREE.CylinderGeometry(radio, radio, .065, 40, 1, true, thetaStart, thetaLength),
      material('#a4a79d'),
    );
    perfil.name = 'HO_travesano_superior_curvo';
    perfil.position.copy(vidrio.position);
    perfil.position.y += height / 2 - .075;
    perfil.scale.z = vidrio.scale.z;
    grupo.add(perfil);
  }
}

function pavimentoHO(c) {
  const {world, box} = c;
  const patio = world.getObjectByName('Plaza_de_ajedrez_HO');
  const piso = patio?.getObjectByName('Pavimento_del_patio');
  if (!piso) return;
  const grupo = zona(c, patio, 'Zona50_19_HO_pavimento_de_ajedrez', ajedrezHO);
  if (!grupo) return;
  const {x: ancho, z: fondo} = piso.scale;
  // Se distinguen las piezas de la cenefa sin aumentar la huella del patio.
  for (const lado of [-1, 1]) {
    for (let dx = -ancho / 2 + .41; dx < ancho / 2 - .32; dx += .27) {
      box(grupo, 'HO_junta_clara_cenefa_larga', dx, .012, lado * (fondo / 2 - .16),
        .028, .003, .235, '#d7b5a2');
    }
    for (let dz = -fondo / 2 + .41; dz < fondo / 2 - .32; dz += .27) {
      box(grupo, 'HO_junta_clara_cenefa_corta', lado * (ancho / 2 - .16), .012, dz,
        .235, .003, .028, '#d7b5a2');
    }
  }
}

function gradasEgresados(c) {
  const plaza = c.world.getObjectByName('Plaza_de_Egresados_HO');
  const grupo = zona(c, plaza, 'Zona50_20_HO_gradas_de_egresados',
    'Aleph UAM n.º 100, p. 28, gradas de concreto del semicírculo.');
  if (!grupo) return;
  const {X, Z} = c;
  for (const [interior, alto] of [[.548, .25], [.687, .406], [.823, .562]]) {
    anillo(c, grupo, 'Egresados_frente_claro_del_peldano', [0, 0],
      [X(739) - X(725), Z(309.5) - Z(298.5), interior + .003, interior + .025],
      alto + .003, .02, Math.PI - .02, '#cdc8b7');
  }
}

function galeriaH(c) {
  const {buildingGroups, box} = c;
  const volumen = buildingGroups.get('H')?.getObjectByName('H_volumen_1');
  const piso = volumen?.getObjectByName('H_pavimento_rojo_de_galeria');
  if (!piso) return;
  const grupo = zona(c, volumen, 'Zona50_21_H_corredor_cubierto',
    'Corpus AZC 0150 y 0155, galería terracota; recorrido 360°, 5:22–5:53.');
  if (!grupo) return;
  const {x, y, z} = piso.position;
  const {x: largo, y: espesor, z: ancho} = piso.scale;
  const ras = y + espesor / 2 + .019;
  for (const lado of [-1, 1]) {
    box(grupo, 'H_canto_terracota_galeria', x, ras, z + lado * (ancho / 2 - .14),
      largo - .16, .003, .24, '#ad6954');
  }
  for (let dx = -largo / 2 + .55; dx < largo / 2 - .3; dx += .94) {
    box(grupo, 'H_junta_corta_en_borde_de_galeria', x + dx, ras + .003, z + ancho / 2 - .14,
      .035, .003, .24, '#cf9d85');
  }
}

function arriateH(c) {
  const {world, box} = c;
  const patio = world.getObjectByName('H_patio_central_ajardinado');
  const borde = patio?.getObjectByName('H_borde_alcorque_circular');
  if (!borde) return;
  const grupo = zona(c, patio, 'Zona50_22_H_alcorque_del_patio',
    'Corpus AZC 0150 y 0155. Se perfila el remate claro del alcorque modelado.');
  if (!grupo) return;
  const {x, y, z} = borde.position;
  const {radiusTop: radio, height} = borde.geometry.parameters;
  anillo(c, grupo, 'H_remate_de_concreto_en_orilla', [x, z],
    [radio, radio, .89, .998], y + height / 2 + .003, 0, 2 * Math.PI, '#c3b7a2');
  for (let i = 0; i < 8; i++) {
    const giro = i * Math.PI / 4;
    const medio = radio * .945;
    const junta = box(grupo, 'H_junta_radial_del_remate', x + medio * Math.cos(giro),
      y + height / 2 + .006, z + medio * Math.sin(giro), radio * .101, .003, .022, '#847b6b');
    junta.rotation.y = -giro;
  }
}

function senderoHHP(c) {
  const {world, box} = c;
  const jardin = world.getObjectByName('Jardines_y_andador_H_HP');
  const camino = jardin?.getObjectByName('Andador_losas_H_HP');
  if (!camino) return;
  const grupo = zona(c, jardin, 'Zona50_23_sendero_H_HP',
    'Panorama CyADtv de junio 2019, losas grises en el paso frente al estacionamiento.');
  if (!grupo) return;
  const {x, y, z} = camino.position;
  const {x: largo, y: espesor, z: ancho} = camino.scale;
  // Dos tonos de losa y sus juntas conservan el borde de concreto y el eje.
  for (let dx = -largo / 2 + .06; dx + .92 < largo / 2; dx += 1.84) {
    box(grupo, 'H_HP_losa_gris_entre_juntas', x + dx + .42, y + espesor / 2 + .003, z,
      .84, .004, ancho - .36, '#b5b5aa');
  }
}

function basesGracias(c) {
  const {world, THREE} = c;
  const obra = world.getObjectByName('Las_tres_Gracias_HP');
  const grupo = zona(c, obra, 'Zona50_24_HP_bases_de_las_tres_Gracias',
    'Catálogo EAE 05, pp. 131–137, y fotos de julio de 2026 de HP. Apoyos ondulados de concreto.');
  if (!grupo) return;
  for (const figura of obra.children.filter(p => p.name.startsWith('Figura_'))) {
    const base = figura.getObjectByName('Base_ondulada_de_concreto');
    if (!base) continue;
    const color = base.geometry.getAttribute('color');
    const puntos = base.geometry.getAttribute('position');
    const pátina = new THREE.Color('#8d9073');
    const tono = new THREE.Color();
    // La pátina queda en el apoyo existente y conserva el acero de las figuras.
    for (let i = 0; i < puntos.count; i++) {
      const mezcla = .50 * Math.max(0, 1 - Math.max(0, puntos.getY(i)) / .25);
      tono.setRGB(color.getX(i), color.getY(i), color.getZ(i)).lerp(pátina, mezcla);
      color.setXYZ(i, tono.r, tono.g, tono.b);
    }
    color.needsUpdate = true;
    base.geometry.computeBoundingBox();
    const ancho = base.geometry.boundingBox.max.x;
    anillo(c, grupo, 'HP_claro_angosto_de_tierra_en_la_base',
      [figura.position.x, figura.position.z],
      [ancho * .58, .58, .85, 1], .007, 0, 2 * Math.PI, '#8a7d60');
  }
}

function asientosHP(c) {
  const {world, box} = c;
  const patio = world.getObjectByName('Plaza_de_ajedrez_HP');
  const grupo = zona(c, patio, 'Zona50_25_HP_asientos_de_ajedrez', ajedrezHP);
  if (!grupo) return;
  for (const asiento of patio.children.filter(p =>
    p.name === 'Asiento_cubico' || p.name === 'Banca_independiente_de_concreto')) {
    const {x, y, z} = asiento.position;
    const {x: ancho, y: alto, z: fondo} = asiento.scale;
    box(grupo, 'HP_paño_claro_en_asiento_de_concreto', x, y + alto / 2 + .003, z,
      ancho - .064, .004, fondo - .064, '#d7d0bf');
  }
}

function porticoBiblioteca(c) {
  const {world, box} = c;
  const plaza = world.getObjectByName('Plaza_COSEI_detalle');
  const puerta = plaza?.getObjectByName('I_portico_retranqueado_acceso');
  if (!puerta) return;
  const grupo = zona(c, plaza, 'Zona50_26_I_cancel_de_ingreso', 'Corpus AZC 0018, 0020 y 0034, cancel y pórtico de Biblioteca.');
  if (!grupo) return;
  const {x, y, z} = puerta.position;
  const {x: ancho, y: alto} = puerta.scale;
  const frente = z - puerta.scale.z / 2 - .009;
  for (const lado of [-1, 1]) {
    box(grupo, 'I_vidrio_del_cancel_de_ingreso', x + lado * ancho / 4, y + .015, frente,
      ancho / 2 - .12, alto - .18, .014, lado < 0 ? '#415759' : '#4b6365');
    box(grupo, 'I_travesano_del_cancel_de_ingreso', x + lado * ancho / 4, y - alto * .16, frente - .013,
      ancho / 2 - .03, .041, .016, '#b7bcb1');
  }
}

function escalonesCosei(c) {
  const {world, box} = c;
  const plaza = world.getObjectByName('Plaza_COSEI_detalle');
  const grupo = zona(c, plaza, 'Zona50_27_COSEI_peldanos', explanadaI + ' y corpus AZC 0018.');
  if (!grupo) return;
  for (const escalon of plaza.children.filter(p => /^Escalón_COSEI_[0-9]+$/.test(p.name))) {
    const {x, y, z} = escalon.position;
    const {x: ancho, y: alto, z: fondo} = escalon.scale;
    box(grupo, 'COSEI_canto_concreto_sobre_huella', x, y + alto / 2 + .003, z - fondo / 2 + .055,
      ancho - .09, .004, .105, '#d2cabc');
  }
}

function marcosPalmas(c) {
  const {world, THREE, box} = c;
  const explanada = world.getObjectByName('COSEI_pavimentos_de_llegada_a_Biblioteca');
  const grupo = zona(c, explanada, 'Zona50_28_COSEI_alcorques_de_palmas', explanadaI + ' y corpus AZC 0020 y 0034.');
  if (!grupo) return;
  for (const hueco of explanada.children.filter(p => p.name === 'COSEI_caja_de_tierra_del_alcorque')) {
    const geometria = hueco.geometry;
    geometria.computeBoundingBox();
    const {min, max} = geometria.boundingBox;
    const centro = new THREE.Vector3();
    geometria.boundingBox.getCenter(centro);
    centro.add(hueco.position);
    const y = centro.y + .017;
    const espesor = .105;
    const ancho = max.x - min.x - .17;
    const fondo = max.z - min.z;
    for (const lado of [-1, 1]) {
      box(grupo, 'COSEI_marco_longitudinal_enrasado', centro.x + lado * (ancho / 2 - espesor / 2),
        y, centro.z, espesor, .005, fondo, '#a59a86');
      box(grupo, 'COSEI_marco_transversal_enrasado', centro.x, y,
        centro.z + lado * (fondo / 2 - espesor / 2), ancho - 2 * espesor, .005, espesor, '#a59a86');
    }
  }
}

function plazuelaJ(c) {
  const {world} = c;
  const plaza = world.getObjectByName('Plazuela_bancas_curvas_J');
  const grupo = zona(c, plaza, 'Zona50_29_J_bancas_curvas',
    'Corpus AZC 0004, 0150 y 0155; recorrido 360°, 7:29–8:11, plazuela junto a J.');
  if (!grupo) return;
  // Las dos huellas curvas reciben una pieza de asiento dentro de cada banca.
  const bancas=plaza.children.filter(pieza=>pieza.name==='Banca_curva_plazuela_J');
  [[.25, 2.6], [3.4, 5.8]].forEach(([desde, hasta], indice)=>{
    const banca=bancas[indice];
    const {x,y,z}=banca.position;
    anillo(c, grupo, 'J_remate_superior_de_banca_curva', [x, z],
      [1, 1, 4.235, 4.765], y+banca.geometry.parameters.options.depth+.003,
      -hasta + .018, -desde - .018, '#d4d0bf');
  });
}

function galeriaJ(c) {
  const {buildingGroups, box} = c;
  const galeria = buildingGroups.get('J')?.getObjectByName('J_galeria_lateral_de_cafeteria');
  const piso = galeria?.getObjectByName('J_loseta_terracota_en_galeria');
  if (!piso) return;
  const grupo = zona(c, galeria, 'Zona50_30_J_loseta_del_comedor', rv + '474 y planta de remodelación de 2009.');
  if (!grupo) return;
  const {x, y, z} = piso.position;
  const {x: ancho, y: espesor, z: fondo} = piso.scale;
  const ras = y + espesor / 2 + .009;
  for (let p = -fondo / 2 + .40; p < fondo / 2 - .12; p += .48) {
    box(grupo, 'J_junta_corta_loseta_del_comedor', x, ras, z + p,
      ancho - .19, .002, .025, '#9a5c50');
  }
  box(grupo, 'J_borde_claro_del_solado_terracota', x + ancho / 2 - .06, ras, z,
    .10, .003, fondo - .11, '#d0aa8f');
}

function encuentroK(c) {
  const {world, meshPoly} = c;
  const jardin = world.getObjectByName('Jardin_entre_J_y_K');
  const grupo = zona(c, jardin, 'Zona50_31_K_encuentro_de_suelos', rv + '594');
  if (!grupo) return;
  // Juntas dentro de la franja ya reconocida junto a K-001. Siguen al ras.
  for (let x = 914.5; x < 969.5; x += 3.0) {
    meshPoly(grupo, [[x, 413.08], [x + .07, 413.08], [x + .07, 417.96], [x, 417.96]],
      .257, '#a19f91', 'K_junta_transversal_del_piso_claro');
  }
}

function ventanillasT(c) {
  const {buildingGroups, box} = c;
  const fachada = buildingGroups.get('T')?.getObjectByName('T_AZC_fachada_y_escalera');
  const grupo = zona(c, fachada, 'Zona50_32_T_ventanillas_de_sistemas_escolares',
    rv + '494 y corpus AZC 0118, 0124. Repisas y paños terracota de las ventanillas.');
  if (!grupo) return;
  for (const vano of fachada.children.filter(p => p.name === 'T_ventanilla_roja_CSE')) {
    const zocalo = vano.getObjectByName('T_zocalo_terracota_CSE');
    if (!zocalo) continue;
    const inserto = new c.THREE.Group();
    inserto.name = 'T_acabado_terracota_ventanilla';
    inserto.position.copy(vano.position);
    inserto.quaternion.copy(vano.quaternion);
    grupo.add(inserto);
    const {x, y, z} = zocalo.position;
    const frente = z - zocalo.scale.z / 2 - .008;
    box(inserto, 'T_frente_terracota_del_zocalo', x, y + .08, frente,
      zocalo.scale.x - .13, zocalo.scale.y - .24, .014, '#ac5341');
    box(inserto, 'T_canto_bajo_revelado_del_mostrador', x, y + .47, frente,
      zocalo.scale.x - .08, .048, .018, '#723d32');
  }
}

function faldonesL(c) {
  const {THREE, buildingGroups, box} = c;
  const techo = buildingGroups.get('L')?.getObjectByName('L_cubierta_diente_de_sierra');
  const grupo = zona(c, techo, 'Zona50_33_L_cubierta_de_CyAD',
    'Levantamiento fotográfico citado en la revisión de L (pp. 68–69) y vista aérea Esri.');
  if (!grupo) return;
  const arriba = new THREE.Vector3(0, 1, 0);
  for (const faldon of techo.children.filter(p => p.name.startsWith('L_faldon_terracota_'))) {
    faldon.geometry.computeBoundingBox();
    const {min, max} = faldon.geometry.boundingBox;
    const largo = new THREE.Vector3(0, max.y - min.y, max.z - min.z);
    const escala = .93;
    const {x, y, z} = faldon.position;
    for (let paso = 1; paso < 8; paso++) {
      const unión = box(grupo, 'L_junta_del_faldon_en_pendiente', x + min.x + (max.x - min.x) * paso / 8,
        y + (max.y + min.y) / 2 + .015, z + (max.z + min.z) / 2,
        .052, largo.length() * escala, .022, '#934840');
      unión.quaternion.setFromUnitVectors(arriba, largo.clone().normalize());
    }
  }
}

function fachadaM(c) {
  const {buildingGroups, box} = c;
  const fachada = buildingGroups.get('M')?.getObjectByName('M_fachada_esquina_gimnasio_exterior');
  const grupo = zona(c, fachada, 'Zona50_34_M_marcos_de_canceles',
    'Corpus AZC 0077 y 0078, esquina frente al gimnasio exterior. El acceso de Impresiones sigue pendiente.');
  if (!grupo) return;
  for (const hoja of fachada.children.filter(p => p.name === 'M_hoja_acristalada')) {
    const {x, y, z} = hoja.position;
    const {x: espesor, y: alto, z: ancho} = hoja.scale;
    box(grupo, 'M_reflejo_alto_en_cancel_claro', x + espesor / 2 + .008, y + alto * .28, z,
      .014, .12, ancho - .19, '#849b9c');
    box(grupo, 'M_cantonera_inferior_en_cancel', x + espesor / 2 + .009, y - alto * .38, z,
      .016, .065, ancho - .12, '#aeb1a8');
  }
}

export function mejorarCentro50(contexto) {
  for (const mejorar of [
    balconesHO, pavimentoHO, gradasEgresados, galeriaH, arriateH, senderoHHP,
    basesGracias, asientosHP, porticoBiblioteca, escalonesCosei, marcosPalmas,
    plazuelaJ, galeriaJ, encuentroK, ventanillasT, faldonesL, fachadaM,
  ]) mejorar(contexto);
}
