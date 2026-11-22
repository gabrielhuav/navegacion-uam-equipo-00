const fotoHP = 'https://bertely.wordpress.com/wp-content/uploads/2009/05/plazas-del-ajedrez-noche-01.jpg';
const fotosBiblioteca = 'Corpus web AZC internet_000009–000011. https://commons.wikimedia.org/wiki/Category:Biblioteca_UAM-AZC';
const fotosComedor = 'Remodelación de 2009, fotografía J_sala-02. https://bertely.wordpress.com/2009/05/22/cafeteria-uam-azcapotzalco/';

function grupoDetalle(THREE, padre, nombre, reference) {
  const grupo = new THREE.Group();
  grupo.name = nombre;
  grupo.userData = { approximate: true, reference };
  padre.add(grupo);
  return grupo;
}

function revestimientoG({ THREE, buildingGroups }) {
  const refuerzos = buildingGroups.get('G')?.getObjectByName('Refuerzos_estructurales_G');
  if (!refuerzos) return;
  const grupo = grupoDetalle(THREE, refuerzos, 'G_paneles_metalicos_de_machones_y_remate',
    'Corpus AZC imagen_0066: juntas ortogonales y tonos azul grisáceo del forro que enmarca el arriostramiento rojo.');
  const paneles = ['#65747e', '#6f7e89', '#74848f', '#62717e', '#7b8993'].map(color => new THREE.Color(color));
  const posiciones = [], colores = [];

  function agregarPaño(pieza, pasoZ, pasoY) {
    const { x, y, z } = pieza.position;
    const { x: espesor, y: alto, z: ancho } = pieza.scale;
    const columnas = Math.max(1, Math.round(ancho / pasoZ));
    const filas = Math.max(1, Math.round(alto / pasoY));
    const lado = Math.sign(x);
    const frente = x + lado * (espesor / 2 + .012);
    const junta = .020;
    for (let fila = 0; fila < filas; fila++) {
      const y0 = y - alto / 2 + fila * alto / filas + junta;
      const y1 = y - alto / 2 + (fila + 1) * alto / filas - junta;
      for (let columna = 0; columna < columnas; columna++) {
        const z0 = z - ancho / 2 + columna * ancho / columnas + junta;
        const z1 = z - ancho / 2 + (columna + 1) * ancho / columnas - junta;
        const a = [frente, y0, z0], b = [frente, y1, z0];
        const c = [frente, y1, z1], d = [frente, y0, z1];
        if (lado > 0) posiciones.push(...a,...b,...c, ...a,...c,...d);
        else posiciones.push(...a,...c,...b, ...a,...d,...c);
        const tono = paneles[(fila * 3 + columna * 7 + Math.round(Math.abs(z))) % paneles.length];
        for (let vertice = 0; vertice < 6; vertice++) colores.push(tono.r, tono.g, tono.b);
      }
    }
  }

  refuerzos.traverse(pieza => {
    if (pieza.name === 'G_fascia_grafito_G') agregarPaño(pieza, 1.17, .70);
    if (pieza.name === 'G_machon_grafito_G') agregarPaño(pieza, 1.17, 1.08);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(posiciones, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colores, 3));
  geo.computeVertexNormals();
  const fachada = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .69, metalness: .15 }));
  fachada.name = 'G_despiece_de_chapa_azul_gris';
  fachada.userData.disposeMaterial = true;
  fachada.receiveShadow = true;
  grupo.add(fachada);
}

function balconesHO({ THREE, buildingGroups, box, material }) {
  const volumen = buildingGroups.get('HO')?.getObjectByName('HO_volumen_0');
  const antepechos = volumen?.children.filter(pieza => pieza.name.startsWith('Antepecho_curvo_'));
  if (!antepechos?.length) return;
  const grupo = grupoDetalle(THREE, volumen, 'HO_remates_de_balcones_curvos',
    'Corpus AZC imagen_0006: tres salidas de agua centradas en los balcones altos, cantos grafito y marcos del vidrio.');
  const acabado = material('#5f625e');

  for (const [piso, antepecho] of antepechos.entries()) {
    const { radiusTop: radio, thetaStart: inicio, thetaLength: arco } = antepecho.geometry.parameters;
    const { y, z } = antepecho.position;
    const profundidad = antepecho.scale.z;
    const canto = new THREE.Mesh(new THREE.CylinderGeometry(radio + .015, radio + .015,
      .092, 40, 1, true, inicio, arco), acabado);
    canto.name = 'HO_canto_de_grafito_del_balcon';
    canto.position.set(0, y - .565, z);
    canto.scale.z = profundidad;
    canto.receiveShadow = true;
    grupo.add(canto);

    const base = z + radio * profundidad;
    if (piso > 0) {
      box(grupo, 'HO_base_de_gargola_frente_a_antepecho', 0, y, base + .045, .16, .205, .115, '#595650');
      box(grupo, 'HO_boca_de_gargola', 0, y - .035, base + .135, .116, .104, .16, '#353933');
    }

    const ventana = volumen.getObjectByName('Ventanal_curvo_' + piso);
    if (!ventana) continue;
    const vidrio = ventana.geometry.parameters;
    for (let bay = 1; bay < 14; bay++) {
      const angulo = vidrio.thetaStart + vidrio.thetaLength * bay / 14;
      const x = Math.sin(angulo) * (vidrio.radiusTop + .026);
      const zMarco = ventana.position.z + Math.cos(angulo) * (vidrio.radiusTop + .029) * ventana.scale.z;
      const marco = box(grupo, 'HO_montante_aluminio_en_ventana_curva',
        x, ventana.position.y, zMarco, .046, vidrio.height * .92, .052, '#a1a49b');
      marco.rotation.y = angulo;
    }
  }
  // Los cubos oscuros del croquis quedaban fuera del arco, en el costado opuesto.
  for (const pieza of volumen.children.filter(pieza => pieza.name === 'Gargola_balcon_curvo')) pieza.visible = false;
}

function ventanasH({ THREE, buildingGroups, box }) {
  const volumen = buildingGroups.get('H')?.getObjectByName('H_volumen_1');
  const cintas = volumen?.children.filter(pieza => pieza.name.startsWith('H_cinta_de_ventanas_'));
  if (!cintas?.length) return;

  const grupo = grupoDetalle(THREE, volumen, 'H_carpinteria_y_paños_de_la_galeria_exterior',
    'Corpus AZC imagen_0150 e imagen_0155: cinta dividida por varios marcos oscuros e interrumpida por machones rojos.');
  const tonos = ['#485755', '#4c5856', '#53625d', '#586560'];
  for (const cinta of cintas) {
    const { y, z } = cinta.position;
    const { x: ancho, y: alto, z: fondo } = cinta.scale;
    const frente = z + fondo / 2;
    const cantidad = Math.round(ancho / 1.76);
    const mod = ancho / cantidad;
    for (let vano = 0; vano < cantidad; vano++) {
      const x = -ancho / 2 + (vano + .5) * mod;
      const esMachon = vano % 7 === 3;
      const color = esMachon ? '#99574d' : tonos[vano % tonos.length];
      box(grupo, 'H_pieza_de_la_cinta_de_ventanas', x, y, frente + .013,
        mod - .050, alto - .058, .025, color);
      box(grupo, 'H_montante_fino_de_ventana_corrida', x - mod / 2 + .017, y, frente + .030,
        .038, alto - .022, .022, '#737c74');
    }
  }
}

function papelerasHP({ THREE, world, box }) {
  const patio = world.getObjectByName('Plaza_de_ajedrez_HP');
  if (!patio) return;
  const grupo = grupoDetalle(THREE, patio, 'HP_dos_papeleras_del_borde',
    'Fotografía nocturna de Giovanni Bertely, 2009. Los recipientes tienen frente gris claro y tapa clara o roja. ' + fotoHP);
  // Los dos recipientes permanecen dentro del borde del patio y separados de los asientos.
  for (const [x, color] of [[-2.98, '#d7d2c1'], [-2.48, '#b84136']]) {
    const z = -2.24;
    box(grupo, 'HP_cuerpo_agrisado_de_papelera', x, .355, z, .365, .70, .34, '#b0aaa0');
    box(grupo, 'HP_marco_de_apertura_de_papelera', x, .665, z + .168, .307, .199, .035, color);
    box(grupo, 'HP_abertura_de_papelera', x, .683, z + .190, .243, .100, .014, '#404242');
    box(grupo, 'HP_tapa_de_papelera', x, .773, z, .418, .153, .396, color);
    box(grupo, 'HP_etiqueta_sin_texto_de_papelera', x, .430, z + .174, .153, .25, .014, color);
  }
}

function plafonT({ THREE, buildingGroups, box }) {
  const fachada = buildingGroups.get('T')?.getObjectByName('T_AZC_fachada_y_escalera');
  const losa = fachada?.getObjectByName('T_galeria_exterior');
  const ventanillas = fachada?.children.filter(pieza => pieza.name === 'T_ventanilla_roja_CSE');
  if (!losa || !ventanillas?.length) return;
  const grupo = grupoDetalle(THREE, fachada, 'T_registro_aparente_en_el_plafon_CSE',
    'Corpus AZC imagen_0118 e imagen_0124: banda oscura transversal abierta del plafón al inicio de la galería.');
  const y = losa.position.y - losa.scale.y / 2;
  const x = ventanillas[0].position.x - 1.78;
  const z = losa.position.z;
  const fondo = losa.scale.z - .06;
  box(grupo, 'T_caja_oscura_de_registro_en_plafon', x, y - .015, z, .56, .025, fondo, '#34373a');
  box(grupo, 'T_fondo_gris_del_registro_transversal', x, y - .030, z, .449, .012, fondo - .09, '#63696b');
  for (const lado of [-1, 1]) {
    box(grupo, 'T_perfil_grafito_del_registro', x + lado * .27, y - .036, z, .03, .03, fondo, '#383e3f');
  }
  for (const dz of [-.85, -.28, .28, .85]) {
    box(grupo, 'T_cruceta_aparente_del_registro', x, y - .042, z + dz, .475, .020, .031, '#909494');
  }
}

function cajaInterior(THREE, padre, nombre, referencia) {
  const grupo = grupoDetalle(THREE, padre, nombre, referencia);
  const cubo = new THREE.BoxGeometry();
  const acabados = new Map();
  return (nombre, color, x, y, z, ancho, alto, fondo, difusor = false) => {
    if (!acabados.has(color)) {
      acabados.set(color, new THREE.MeshStandardMaterial({
        color, roughness: .82, emissive: difusor ? color : '#000000', emissiveIntensity: .28,
      }));
    }
    const caja = new THREE.Mesh(cubo, acabados.get(color));
    caja.name = nombre;
    caja.position.set(x, y, z);
    caja.scale.set(ancho, alto, fondo);
    caja.receiveShadow = true;
    grupo.add(caja);
    return caja;
  };
}

function plafonesBiblioteca(THREE, modelo) {
  const caja = cajaInterior(THREE, modelo.group, 'I_modulacion_de_luz_bajo_mezanine', fotosBiblioteca);
  // En las fotos aparecen difusores cuadrados empotrados, agrupados sobre los estantes.
  const acabadosDeLuminariaLineal = new Set(['fff2cc', 'e7e3d9']);
  const luminarias = modelo.group.children.filter(pieza => pieza.isInstancedMesh &&
    acabadosDeLuminariaLineal.has(pieza.material?.color?.getHexString()));
  for (const luminaria of luminarias) luminaria.visible = false;
  for (const z of [-6.49, -4.15, -1.80, .55, 2.90, 5.25]) {
    for (const x of [-7.03, -5.22]) {
      caja('I_marco_del_panel_empotrado', '#caccc1', x, 3.178, z, .552, .028, .552);
      caja('I_panel_cuadrado_traslucido', '#fff5d6', x, 3.158, z, .468, .014, .468, true);
    }
  }
  for (const z of [-6.22, -4.24, -3.15]) {
    caja('I_marco_del_panel_empotrado_en_franja_opuesta', '#caccc1', 6.55, 3.178, z, .552, .028, .552);
    caja('I_panel_cuadrado_traslucido_en_franja_opuesta', '#fff5d6', 6.55, 3.158, z, .468, .014, .468, true);
  }
}

function iluminacionComedor(THREE, modelo) {
  const lineales = modelo.group.children.filter(pieza => pieza.name === 'Luminaria lineal');
  if (!lineales.length) return;
  const caja = cajaInterior(THREE, modelo.group, 'J_luz_lineal_indirecta_bajo_la_reticula', fotosComedor);
  for (const pieza of lineales) {
    const { x, z } = pieza.position;
    pieza.visible = false;
    // El difusor alargado queda entre la retícula fina y los ductos, por encima de las mesas.
    caja('J_bandeja_aluminio_de_luminaria', '#b7b9af', x, 3.423, z - .14, pieza.scale.x - .24, .054, .337);
    caja('J_difusor_de_luz_indirecta', '#fff3d8', x, 3.389, z - .14, pieza.scale.x - .32, .018, .252);
    for (const dx of [-1.33, 1.33]) {
      caja('J_tirante_de_luz_lineal', '#a3a8a2', x + dx, 3.47, z - .14, .026, .060, .025);
    }
  }
}

export function modelarCuartaPasadaCentro(contexto) {
  revestimientoG(contexto);
  balconesHO(contexto);
  ventanasH(contexto);
  papelerasHP(contexto);
  plafonT(contexto);
}

export function detallarCortesCuartaPasadaCentro(id, THREE, modelo) {
  if (id === 'biblioteca') plafonesBiblioteca(THREE, modelo);
  if (id === 'cafeteria') iluminacionComedor(THREE, modelo);
  return modelo;
}
