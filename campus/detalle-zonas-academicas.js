function grupoDetalle(THREE, padre, nombre, reference) {
  const grupo = new THREE.Group();
  grupo.name = nombre;
  grupo.userData = {approximate: true, reference};
  padre.add(grupo);
  return grupo;
}

function agregarLosas(THREE, grupo, nombre, area, y, tonos) {
  const posiciones = [];
  const colores = [];
  const acabados = tonos.map(tono => new THREE.Color(tono));
  const [minX, minZ, maxX, maxZ] = area;
  const paso = .48;
  const junta = .009;
  function pieza(x0, z0, x1, z1, color) {
    posiciones.push(x0,y,z0, x0,y,z1, x1,y,z1, x0,y,z0, x1,y,z1, x1,y,z0);
    for (let vertice = 0; vertice < 6; vertice++) colores.push(color.r, color.g, color.b);
  }
  // Despiece original de la plaza, recortado alrededor de las cenefas.
  const inicioX = -3.95;
  const inicioZ = -2.365;
  for (let fila = 0; inicioZ + fila * paso < maxZ - junta; fila++) {
    for (let columna = 0; inicioX + columna * paso < maxX - junta; columna++) {
      const x0 = Math.max(inicioX + columna * paso, minX);
      const z0 = Math.max(inicioZ + fila * paso, minZ);
      const x1 = Math.min(inicioX + (columna + 1) * paso, maxX);
      const z1 = Math.min(inicioZ + (fila + 1) * paso, maxZ);
      if (x1 - x0 <= junta || z1 - z0 <= junta) continue;
      pieza(x0 + junta / 2, z0 + junta / 2, x1 - junta / 2, z1 - junta / 2,
        acabados[(fila * 11 + columna * 13) % acabados.length]);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(posiciones, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colores, 3));
  geo.computeVertexNormals();
  const suelo = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({vertexColors: true, roughness: .94}));
  suelo.name = nombre;
  suelo.receiveShadow = true;
  suelo.userData.disposeMaterial = true;
  grupo.add(suelo);
}

function texturaAdoquines(THREE) {
  const canvas = document.createElement('canvas');
  // Ocho módulos de .30 m para el UV del pavimento original (2.4 m por vuelta).
  const modulos = 8;
  const lado = 32;
  canvas.width = canvas.height = modulos * lado;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#775950';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const tonos = ['#a16a5c', '#a56e5e', '#a97262', '#a16958', '#a86e61', '#a56d59', '#a3695a'];
  for (let fila = 0; fila < modulos; fila++) {
    for (let col = 0; col < modulos; col++) {
      const vertical = (fila + col) % 2 === 0;
      const anchoPieza = vertical ? lado / 2 : lado;
      const fondoPieza = vertical ? lado : lado / 2;
      for (let i = 0; i < 2; i++) {
        const x = col * lado + (vertical ? i * anchoPieza : 0);
        const y = fila * lado + (vertical ? 0 : i * fondoPieza);
        ctx.fillStyle = tonos[(fila * 11 + col * 13 + i * 17) % tonos.length];
        ctx.fillRect(x + 1, y + 1, anchoPieza - 1, fondoPieza - 1);
      }
    }
  }
  const mapa = new THREE.CanvasTexture(canvas);
  mapa.colorSpace = THREE.SRGBColorSpace;
  mapa.wrapS = mapa.wrapT = THREE.RepeatWrapping;
  mapa.anisotropy = 4;
  return mapa;
}

function detallarPasoG({THREE, world}) {
  const cruce = world.getObjectByName('G_cruce_entre_Plaza_Roja_y_COSEI');
  const loseta = cruce?.getObjectByName('G_loseta_terracota_del_vano');
  if (!loseta) return;
  // En las dos vistas del acceso se distinguen pares de piezas alternados.
  // La misma textura de loseta se comparte entre vano, umbrales y ensanches.
  const acabado = loseta.material;
  acabado.map?.dispose();
  acabado.map = texturaAdoquines(THREE);
  acabado.needsUpdate = true;
  cruce.userData.aparejo = 'Pares alternados de adoquines en corpus AZC imagen_0080 e imagen_0086.';
}

function detallarHO({THREE, buildingGroups, box}) {
  const volumen = buildingGroups.get('HO')?.getObjectByName('HO_volumen_0');
  const alas = volumen?.children.filter(parte => parte.name === 'Remate_terracota');
  if (!alas?.length) return;

  const grupo = grupoDetalle(THREE, volumen, 'HO_juntas_verticales_del_concreto_rojo',
    'Corpus AZC imagen_0005–0007 y fotografía del usuario desde el segundo piso. Se reproducen las juntas del concreto rojo en las alas del vestíbulo.');
  for (const ala of alas) {
    const {x, y, z} = ala.position;
    const {x: ancho, y: alto, z: fondo} = ala.scale;
    const caraLateral = x + Math.sign(x) * (ancho / 2 + .009);
    const caraFrontal = z - fondo / 2 - .009;
    for (const fraccion of [-.26, .24]) {
      box(grupo, 'HO_junta_vertical_en_costado_rojo', caraLateral, y, z + fondo * fraccion,
        .016, alto - .17, .036, '#893e37');
    }
    box(grupo, 'HO_junta_vertical_en_frente_rojo', x + ancho * .11, y, caraFrontal,
      .035, alto - .17, .016, '#893e37');
  }
}

function detallarH({THREE, buildingGroups, box}) {
  const volumen = buildingGroups.get('H')?.getObjectByName('H_volumen_1');
  const bandas = volumen?.children.filter(parte => parte.name.startsWith('H_banda_concreto_volada_'));
  if (!bandas?.length) return;

  const grupo = grupoDetalle(THREE, volumen, 'H_juntas_del_prehormigon_del_jardin',
    'Corpus AZC imagen_0150 e imagen_0155. Uniones verticales visibles en las bandas de hormigón de la galería.');
  for (const banda of bandas) {
    const {x, y, z} = banda.position;
    const {x: ancho, y: alto, z: fondo} = banda.scale;
    const vanos = Math.max(2, Math.round(ancho / 4.8));
    for (let j = 1; j < vanos; j++) {
      const cx = x + ancho * (j / vanos - .5);
      box(grupo, 'H_junta_oscura_del_panel_sobre_la_galeria', cx, y, z + fondo / 2 + .008,
        .033, alto - .06, .011, '#97978b');
    }
  }
}

function detallarHP({THREE, world}) {
  const plaza = world.getObjectByName('Plaza_de_ajedrez_HP');
  if (!plaza?.getObjectByName('HP_continuidad_del_pavimento_de_ajedrez')) return;

  const grupo = grupoDetalle(THREE, plaza, 'HP_losas_modeladas_dentro_de_cenefas',
    'Giovanni Bertely, fotografía del patio. https://bertely.wordpress.com/wp-content/uploads/2009/05/plazas-del-ajedrez-noche-01.jpg');
  // Las cuatro mesas y las juntas, cenefas y rejillas del piso permanecen a la vista.
  // El acabado se limita a los dos paños dentro de la doble cenefa.
  const tonos = ['#afab9c', '#b6b0a0', '#b8b4a6', '#b0ad9f', '#b4ae9f', '#acaa9c', '#b4b1a4'];
  for (const [inicioX, finX] of [[-3.82, -.16], [.16, 3.82]]) {
    agregarLosas(THREE, grupo, 'HP_losas_grises_del_patio', [inicioX, -2.27, finX, 2.27], .009, tonos);
  }
}

function detallarT({THREE, buildingGroups, box}) {
  const fachada = buildingGroups.get('T')?.getObjectByName('T_AZC_fachada_y_escalera');
  const primera = fachada?.children.find(parte => parte.name === 'T_ventanilla_roja_CSE');
  const retorno = primera?.getObjectByName('T_pantalla_lateral_CSE');
  if (!retorno) return;

  const grupo = grupoDetalle(THREE, primera, 'T_terminal_empotrada_en_el_arranque_de_ventanillas',
    'Corpus AZC imagen_0130–0134, detalle de la terminal junto a la primera ventanilla visible en la secuencia.');
  // Se pega al costado de llegada del módulo, sin modelar el funcionamiento ni
  // recrear texto de los avisos o la pantalla y sin alterar el acceso.
  const {x, z} = retorno.position;
  const bandeja = box(grupo, 'T_retorno_rojo_del_nicho', x - .29, 1.52, z - .335, .56, 1.91, .126, '#9c362e');
  const frente = bandeja.position.z - bandeja.scale.z / 2;
  box(grupo, 'T_cerco_rehundido_de_terminal', x - .29, 1.47, frente - .013, .30, .67, .033, '#543533');
  box(grupo, 'T_panel_gris_de_terminal', x - .29, 1.47, frente - .036, .23, .59, .026, '#474b4c');
  box(grupo, 'T_marco_de_pantalla', x - .29, 1.625, frente - .055, .149, .138, .018, '#1c2628');
  box(grupo, 'T_pantalla_sin_texto', x - .29, 1.625, frente - .068, .112, .096, .013, '#79a9b8');
  box(grupo, 'T_indicador_de_terminal', x - .29, 1.504, frente - .065, .024, .024, .010, '#a74334');
  box(grupo, 'T_ranura_baja_de_terminal', x - .29, 1.365, frente - .057, .071, .055, .016, '#22282a');
}

function cajaDeInterior(THREE, grupo) {
  const geo = new THREE.BoxGeometry();
  const acabados = new Map();
  return (nombre, color, x, y, z, ancho, alto, fondo) => {
    if (!acabados.has(color)) acabados.set(color, new THREE.MeshStandardMaterial({color, roughness: .82}));
    const caja = new THREE.Mesh(geo, acabados.get(color));
    caja.name = nombre;
    caja.position.set(x, y, z);
    caja.scale.set(ancho, alto, fondo);
    caja.receiveShadow = true;
    grupo.add(caja);
    return caja;
  };
}

function iluminacionBiblioteca(THREE, modelo) {
  const grupo = grupoDetalle(THREE, modelo.group, 'I_brazos_de_luz_sobre_la_franja_mural',
    'Corpus web AZC internet_000009.png e internet_000012.png. Brazos blancos bajo los ventanales altos, separados de las luminarias colgantes.');
  const caja = cajaDeInterior(THREE, grupo);
  for (const [y, z] of [[4.77, -5.83], [5.02, -4.04], [5.29, -2.31], [5.52, -.48]]) {
    caja('I_placa_de_anclaje_de_luminaria_mural', '#d5d7d0', -7.78, y, z, .09, .13, .11);
    const brazo = caja('I_brazo_blanco_frente_a_franja_mural', '#e9e9df', -5.69, y + .10, z, 4.20, .037, .038);
    brazo.rotation.z = .048;
    caja('I_proyector_en_el_extremo_del_brazo', '#dddcd0', -3.63, y + .19, z, .118, .093, .105);
    caja('I_difusor_hacia_franja_mural', '#fff4d3', -3.63, y + .142, z, .083, .018, .075);
  }
}

function reticulaDelComedor(THREE, modelo) {
  const tableros = modelo.group.children.filter(parte => parte.name === 'Retícula del plafón suspendido');
  if (!tableros.length) return;

  const grupo = grupoDetalle(THREE, modelo.group, 'J_plafon_en_reticula_abierta',
    'Remodelación de cafetería, foto de Giovanni Bertely. https://bertely.wordpress.com/2009/05/22/cafeteria-uam-azcapotzalco/');
  const caja = cajaDeInterior(THREE, grupo);
  for (const tablero of tableros) {
    const {x, y, z} = tablero.position;
    const {x: ancho, z: fondo} = tablero.scale;
    tablero.visible = false;
    for (let i = 1; i < 15; i++) {
      const dx = ancho * (i / 15 - .5);
      caja('J_perfil_fino_transversal_del_plafon', '#868b83', x + dx, y, z, .019, .032, fondo);
    }
    for (let i = 1; i < 7; i++) {
      const dz = fondo * (i / 7 - .5);
      caja('J_perfil_fino_longitudinal_del_plafon', '#91958d', x, y - .014, z + dz, ancho, .022, .018);
    }
  }
}

export function detallarZonasAcademicas(contexto) {
  detallarPasoG(contexto);
  detallarHO(contexto);
  detallarH(contexto);
  detallarHP(contexto);
  detallarT(contexto);
}

export function detallarCortesAcademicos(id, THREE, modelo) {
  if (id === 'biblioteca') iluminacionBiblioteca(THREE, modelo);
  if (id === 'cafeteria') reticulaDelComedor(THREE, modelo);
  return modelo;
}
