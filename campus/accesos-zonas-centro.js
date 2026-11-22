const fotoHO = 'Corpus AZC, imagen_0007.png: vestíbulo retranqueado, pavimento y macetas.';
const fotoH = 'Corpus AZC, imagen_0150.png: galería baja, pavimento terracota y tablero junto a los canceles.';
const fotoHP = 'https://bertely.wordpress.com/wp-content/uploads/2009/05/plazas-del-ajedrez-noche-01.jpg';
const fotoBiblioteca = 'https://commons.wikimedia.org/wiki/Category:Biblioteca_UAM-AZC';
const fotoJ = 'https://bertely.wordpress.com/2009/05/22/cafeteria-uam-azcapotzalco/';

function detalle(THREE, padre, nombre, reference) {
  const group = new THREE.Group();
  group.name = nombre;
  group.userData = {approximate: true, reference};
  padre.add(group);
  return group;
}

function juntasDePiso(THREE, grupo, nombre, piso, material, intervalo, color) {
  const {x, y, z} = piso.position;
  const {x: ancho, y: alto, z: fondo} = piso.scale;
  const superficie = y + alto / 2 + .003;
  const posiciones = [];
  function junta(x0, z0, x1, z1) {
    posiciones.push(x0,superficie,z0, x0,superficie,z1, x1,superficie,z1,
      x0,superficie,z0, x1,superficie,z1, x1,superficie,z0);
  }
  for (let dx = -ancho / 2 + intervalo; dx < ancho / 2 - .08; dx += intervalo) {
    junta(x+dx-.009, z-fondo/2, x+dx+.009, z+fondo/2);
  }
  for (let dz = -fondo / 2 + intervalo; dz < fondo / 2 - .08; dz += intervalo) {
    junta(x-ancho/2, z+dz-.009, x+ancho/2, z+dz+.009);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(posiciones,3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo,material(color));
  mesh.name = nombre;
  mesh.receiveShadow = true;
  grupo.add(mesh);
}

function umbralHO({THREE, buildingGroups, box, material}) {
  const edificio = buildingGroups.get('HO');
  const part = edificio?.getObjectByName('HO_volumen_0');
  const cancel = part?.getObjectByName('HO_acristalamiento_vestibulo');
  const piso = part?.getObjectByName('HO_pavimento_vestibulo');
  if (!cancel || !piso) return;

  const grupo = detalle(THREE, part, 'HO_remates_del_vestibulo_bajo', fotoHO);
  juntasDePiso(THREE, grupo, 'HO_juntas_de_losetas_en_vestibulo', piso, material, .46, '#969387');
  const {x, y, z} = cancel.position;
  const {x: vano, y: alto, z: espesor} = cancel.scale;
  const fondo = z - espesor / 2;
  const base = y - alto / 2;
  const panel = vano / 4;
  for (const i of [0, 1, 2, 3]) {
    const centro = x + (i - 1.5) * panel;
    box(grupo, 'HO_panel_bajo_acabado_mate', centro, base+.40, fondo-.008, panel-.075, .79, .034, '#888a81');
    box(grupo, 'HO_antepecho_de_aluminio', centro, base+.808, fondo-.022, panel-.045, .044, .055, '#c1c0b3');
    box(grupo, 'HO_montante_intermedio_del_paño', centro, base+1.42, fondo-.020, .037, 1.16, .041, '#b5b7a9');
  }
  const maceta = new THREE.CylinderGeometry(.23,.15,.34,12);
  const follaje = new THREE.IcosahedronGeometry(.25,1);
  const yPiso = piso.position.y + piso.scale.y / 2;
  for (const [lado, altura] of [[-1,.72],[1,.88]]) {
    const px = x + lado * (vano / 2 + .45);
    const pz = fondo - .33;
    const recipiente = new THREE.Mesh(maceta, material('#9a5344'));
    recipiente.name = 'HO_maceta_junto_al_muro';
    recipiente.position.set(px, yPiso+.17, pz);
    grupo.add(recipiente);
    box(grupo, 'HO_tallo_de_maceta', px, yPiso+altura*.57, pz, .027, altura*.66, .027, '#5a6851');
    for (const [dx, dy, dz] of [[-.12,-.06,-.02],[.12,.04,.07],[0,.17,-.12]]) {
      const hojas = new THREE.Mesh(follaje, material('#596b46'));
      hojas.name = 'HO_follaje_de_maceta';
      hojas.scale.set(.64,.74,.62);
      hojas.position.set(px+dx,yPiso+altura+dy,pz+dz);
      grupo.add(hojas);
    }
  }
}

function galeriaH({THREE, buildingGroups, box, material}) {
  const part = buildingGroups.get('H')?.getObjectByName('H_volumen_1');
  const piso = part?.getObjectByName('H_pavimento_rojo_de_galeria');
  const cancel = part?.children.filter(n => n.name === 'H_pano_acristalado_rehundido').find(n => n.position.x > 0);
  if (!piso || !cancel) return;

  const grupo = detalle(THREE, part, 'H_acabado_de_galeria_baja', fotoH);
  juntasDePiso(THREE, grupo, 'H_juntas_de_loseta_terracota', piso, material, .47, '#87564b');
  const {x, y, z} = cancel.position;
  const frente = z + cancel.scale.z / 2;
  const ancho = cancel.scale.x * .83;
  const base = y - cancel.scale.y / 2 - .06;
  box(grupo, 'H_tablero_de_cartelera_en_galeria', x, y+.14, frente+.021, ancho, .96, .047, '#625c55');
  for (const dx of [-.5,.5]) {
    box(grupo, 'H_marco_vertical_de_cartelera', x+dx*ancho, y+.14, frente+.054, .049, 1.01, .055, '#aeafa5');
  }
  for (const dy of [-.48,.48]) {
    box(grupo, 'H_marco_horizontal_de_cartelera', x, y+.14+dy, frente+.053, ancho, .048, .052, '#aeafa5');
  }
  for (const [dx, dy, w, h, color] of [
    [-1.27,.25,.48,.42,'#c5bdab'], [-.79,.44,.31,.25,'#a97767'], [-.48,.08,.29,.34,'#d1cabb'],
    [-.05,.34,.46,.32,'#a8b7a3'], [.45,.19,.38,.51,'#bba38d'], [1.02,.43,.49,.27,'#d6cfc0'],
    [1.23,.06,.29,.38,'#949c88']
  ]) {
    box(grupo, 'H_paño_sin_texto_de_cartelera', x+dx, y+dy, frente+.048, w,h,.015,color);
  }
  for (const paño of part.children.filter(n => n.name === 'H_pano_acristalado_rehundido')) {
    box(grupo, 'H_riel_inferior_de_cancel_galería', paño.position.x, base, frente+.022,
      paño.scale.x, .055, .054, '#a0a497');
  }
}

function bancasHP({THREE, world, box}) {
  const patio = world.getObjectByName('Plaza_de_ajedrez_HP');
  if (!patio) return;

  // En la foto nocturna se aprecia la sombra entre los bloques y el pavimento.
  // El zócalo retranqueado mantiene el apoyo y ocupa menos espacio que el banco.
  const grupo = detalle(THREE, patio, 'HP_zocalos_de_bancas_independientes', fotoHP);
  for (const banca of patio.children.filter(n => n.name === 'Banca_independiente_de_concreto')) {
    const {x, y, z} = banca.position;
    const {x: ancho, y: alto, z: fondo} = banca.scale;
    const inferior = y - alto / 2;
    const retiro = .065;
    banca.scale.y -= retiro;
    banca.position.y += retiro / 2;
    box(grupo, 'HP_zocalo_rehundido_de_banca', x, inferior+retiro/2, z,
      ancho-.12, retiro, fondo-.12, '#73746a');
  }
}

function umbralBiblioteca({THREE, world, material}) {
  const plaza = world.getObjectByName('Plaza_COSEI_detalle');
  const suelo = plaza?.getObjectByName('I_suelo_bajo_portico');
  if (!suelo) return;

  const fuente = 'Corpus AZC imagen_0018 e imagen_0034. Foto 2 en Maps, Biblioteca COSEI, noviembre de 2024.';
  const grupo = detalle(THREE, plaza, 'I_juntas_y_umbrales_de_llegada', fuente);
  juntasDePiso(THREE, grupo, 'I_juntas_de_losas_bajo_portico', suelo, material, .90, '#acaa9e');
  const escalones = plaza.children.filter(n => /^Escalón_COSEI_\d+$/.test(n.name));
  for (const [i, escalon] of escalones.entries()) {
    // El canto de cada peldaño mantiene su geometría, sin reducir el ancho de paso.
    escalon.material = material(i % 2 ? '#c7c1b1' : '#b6b0a4');
  }
}

function detalleDeInterior(THREE, modelo, nombre, fuente) {
  const group = detalle(THREE, modelo.group, nombre, fuente);
  const geometria = new THREE.BoxGeometry();
  const materiales = new Map();
  return (etiqueta, color, x,y,z, ancho,alto,fondo) => {
    if (!materiales.has(color)) materiales.set(color,new THREE.MeshStandardMaterial({color,roughness:.84}));
    const mesh = new THREE.Mesh(geometria, materiales.get(color));
    mesh.name = etiqueta;
    mesh.position.set(x,y,z);
    mesh.scale.set(ancho,alto,fondo);
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
}

function consultaBiblioteca(THREE, modelo) {
  const caja = detalleDeInterior(THREE, modelo, 'I_modulos_de_consulta_de_biblioteca',
    'Corpus web AZC internet_000011.png, foto de la sala del 13 de enero de 2017. ' + fotoBiblioteca);
  for (const x of [-4.92,-1.64,1.64,4.92]) {
    const z = 6.35;
    caja('I_cubierta_de_módulo_de_consulta','#9a664c',x,.80,z,1.16,.083,.69);
    caja('I_frente_madera_de_consulta','#6e4838',x,.45,z+.33,1.15,.68,.061);
    for (const s of [-1,1]) {
      caja('I_costado_escalonado_de_consulta','#865640',x+s*.551,.50,z,.059,.94,.65);
    }
    for (const franja of [-.17,.01,.19]) {
      caja('I_canto_del_frente_de_madera','#8b5943',x,.45+franja,z+.364,1.1,.022,.017);
    }
    caja('I_base_del_monitor','#343637',x,.849,z-.023,.28,.021,.22);
    caja('I_pie_del_monitor','#414342',x,.968,z-.045,.073,.233,.078);
    caja('I_monitor_de_consulta','#25282a',x,1.151,z-.047,.52,.319,.052);
    caja('I_teclado_de_consulta','#303333',x,.848,z-.217,.36,.022,.127);
  }
  modelo.etiquetas.push({texto:'Módulos de consulta',posicion:[0,1.4,6.35]});
}

function pavimentoCafeteria(THREE, modelo) {
  const caja = detalleDeInterior(THREE, modelo, 'J_despiece_de_pavimento_de_comedor',
    'Plano y fotos del piso de comedor de la remodelación de 2009. ' + fotoJ);
  // La franja de circulación entre mesas permanece libre de mobiliario.
  // Las líneas se acoplan al corte esquemático y evocan el dibujo del proyecto.
  const trazas = [[-2.29,.72,1.49,9.24,'#9d5949'],[-2.29,.72,.92,8.60,'#b78855']];
  for (const [x,z,ancho,largo,tono] of trazas) for (const s of [-1,1]) {
    caja('J_inserto_longitudinal_del_andador',tono,x+s*ancho/2,.025,z,.105,.009,largo+.105);
    caja('J_inserto_transversal_del_andador',tono,x,.026,z+s*largo/2,ancho,.009,.105);
  }
  for (const x of [-5.35,.80]) {
    for (let i = 0; i < 9; i++) {
      caja('J_junta_transversal_de_loseta','#8b6958',x,.020,-3.35+i*1.01,4.7,.004,.035);
    }
    for (const s of [-1,1]) {
      caja('J_junta_longitudinal_de_loseta','#8b6958',x+s*.79,.020,.70,.026,.004,8.75);
    }
    for (const z of [-3.82,5.23]) {
      caja('J_cenefa_ocre_al_desembarque','#ae875a',x,.023,z,4.67,.009,.065);
    }
  }
  for (const columna of modelo.group.children.filter(n => n.name === 'Columna de sección cuadrada')) {
    const {x,z} = columna.position;
    caja('J_remate_cuadrado_de_piso_alrededor_de_columna','#ad775b',x,.018,z,.735,.008,.76);
  }
}

export function modelarAccesosCentro(contexto) {
  umbralHO(contexto);
  galeriaH(contexto);
  bancasHP(contexto);
  umbralBiblioteca(contexto);
}

export function detallarVistasCentro(id, THREE, modelo) {
  if (id === 'biblioteca') consultaBiblioteca(THREE, modelo);
  if (id === 'cafeteria') pavimentoCafeteria(THREE, modelo);
  return modelo;
}
