const fuenteAjedrez = 'https://bertely.wordpress.com/wp-content/uploads/2009/05/plazas-del-ajedrez-obra-02.jpg';
const fuenteHP = 'https://bertely.wordpress.com/wp-content/uploads/2009/05/plazas-del-ajedrez-noche-01.jpg';
const fuenteH = 'https://kali.azc.uam.mx/aleph/numeros/aleph115.pdf#page=6';
const fuenteI = 'https://www.google.com/maps/place/Biblioteca+COSEI/@19.5043665,-99.1867885,3a,75y,90t/data=!3m6!1e2!3m4!1sCIHM0ogKEICAgIDX99PFVg!2e10!3e12';

function grupo(THREE, padre, nombre, evidencia) {
  const detalle = new THREE.Group();
  detalle.name = nombre;
  detalle.userData = { approximate: true, reference: evidencia };
  padre.add(detalle);
  return detalle;
}

function malla(THREE, padre, nombre, geometria, acabado, x, y, z) {
  const pieza = new THREE.Mesh(geometria, acabado);
  pieza.name = nombre;
  pieza.position.set(x, y, z);
  pieza.receiveShadow = true;
  padre.add(pieza);
  return pieza;
}

function mesasDeConcreto({THREE, world, box, material}) {
  const nombres = new Set(['Mesa_hexagonal_jardines', 'Banca_mesa_hexagonal']);
  const anteriores = world.children.filter(pieza => nombres.has(pieza.name));
  const centros = anteriores.filter(pieza => pieza.name === 'Mesa_hexagonal_jardines');
  if (!centros.length) return;

  const detalle = grupo(THREE, world, 'EF_mesas_de_concreto_con_plataforma',
    'Corpus imagen_0017 e imagen_0028. Geometría y alturas estimadas; se reutilizan los claros del plano.');
  const base = new THREE.CylinderGeometry(1.58, 1.62, .13, 36);
  const tablero = new THREE.CylinderGeometry(.74, .72, .105, 6);
  const columna = new THREE.CylinderGeometry(.208, .265, .68, 6);
  const asiento = new THREE.CylinderGeometry(.24, .225, .085, 6);
  const soporte = new THREE.CylinderGeometry(.105, .164, .34, 6);
  const gris = material('#aaa69a'), concreto = material('#c5c2b3');
  for (const centro of centros) {
    const {x, z} = centro.position;
    malla(THREE, detalle, 'EF_plataforma_redonda_de_la_mesa', base, gris, x, .42, z);
    malla(THREE, detalle, 'EF_pedestal_de_mesa', columna, gris, x, .82, z);
    malla(THREE, detalle, 'EF_tablero_hexagonal', tablero, concreto, x, 1.20, z).castShadow = true;
    for (let i = 0; i < 6; i++) {
      const angulo = i * Math.PI / 3;
      const sx = x + 1.23 * Math.cos(angulo), sz = z + 1.23 * Math.sin(angulo);
      malla(THREE, detalle, 'EF_pedestal_de_banco', soporte, gris, sx, .65, sz);
      malla(THREE, detalle, 'EF_asiento_hexagonal', asiento, concreto, sx, .85, sz);
    }
    box(detalle, 'EF_junta_de_apoyo_del_tablero', x, 1.133, z, .43, .045, .42, '#9a978b');
    centro.geometry.dispose();
  }
  world.remove(...anteriores);
}

function acabadoPasoG({THREE, buildingGroups, box}) {
  const parte = buildingGroups.get('G')?.getObjectByName('G_volumen_0');
  if (!parte) return;
  const canceles = parte.children.filter(pieza => pieza.name === 'G_cancel_acceso_tunel');
  if (canceles.length !== 2) return;
  const detalle = grupo(THREE, parte, 'G_carpinteria_y_azulejo_del_paso',
    'Ficha Edificio G, fotos 1 y 4 (agosto 2022), corpus 0080 y 0086. Se conserva el vano de paso.');
  for (const cancel of canceles) {
    const {x, y, z} = cancel.position;
    const lado = z < 0 ? 1 : -1;
    const anchoCancel = cancel.scale.x;
    const alFrente = z + lado * .103;
    cancel.material = box(detalle, 'G_zocalo_azulejo_blanco', x, .60, alFrente,
      anchoCancel, .49, .036, '#c7c6b8').material;
    const alto = 2.09;
    const modulos = Math.max(4, Math.round(anchoCancel / 1.35));
    const anchoModulo = anchoCancel / modulos;
    for (let i = 0; i < modulos; i++) {
      const cx = x - anchoCancel / 2 + (i + .5) * anchoModulo;
      const color = i % 3 === 0 ? '#586c6d' : '#394d4e';
      box(detalle, 'G_pano_vidrio_lateral', cx, y + .22, alFrente,
        anchoModulo - .062, alto, .04, color);
      box(detalle, 'G_montante_natural_del_cancel', cx - anchoModulo / 2, y + .22,
        alFrente + lado * .024, .055, alto, .042, '#b2b7b1');
    }
    for (const wy of [.74, 2.43, 2.82]) {
      box(detalle, 'G_travesano_del_cancel', x, wy, alFrente + lado * .028,
        anchoCancel, .057, .045, '#c8c9c3');
    }
    box(detalle, 'G_canalizacion_aparente', x, 3.16, alFrente,
      anchoCancel + .45, .075, .084, '#92978f');
    for (const s of [-1, 1]) {
      const jamb = x + s * (anchoCancel / 2 + .45);
      box(detalle, 'G_jamba_azulejo_blanco', jamb, 1.68, alFrente,
        .86, 2.66, .042, '#d5d4c7');
      for (let h = .61; h < 2.96; h += .19) {
        box(detalle, 'G_junta_horizontal_azulejo', jamb, h, alFrente + lado * .026,
          .85, .018, .014, '#afada1');
      }
    }
  }
}

function pavimentoAjedrez(THREE, world, box, id, ancho, fondo, margen, fuente) {
  const plaza = world.getObjectByName('Plaza_de_ajedrez_' + id);
  if (!plaza) return;
  const detalle = grupo(THREE, plaza, id + '_continuidad_del_pavimento_de_ajedrez', fuente);
  const piso = '#b0aba0', junta = '#88877f', terracota = '#a46f64';
  const semiancho = ancho / 2 + margen, semifondo = fondo / 2 + margen;
  // El plano del patio existente deja visible la cenefa que rodea las mesas.
  for (const lado of [-1, 1]) {
    const x = lado * (ancho / 2 + margen / 2);
    box(detalle, id + '_losa_gris_lateral', x, -.025, 0, margen, .043, 2 * semifondo, piso);
    const z = lado * (fondo / 2 + margen / 2);
    box(detalle, id + '_losa_gris_transversal', 0, -.025, z, ancho, .043, margen, piso);
    for (let s = -semifondo + .43; s < semifondo - .2; s += .49) {
      box(detalle, id + '_junta_fina_lateral', x, -.003, s, margen - .025, .008, .018, junta);
    }
    for (let s = -ancho / 2 + .47; s < ancho / 2 - .2; s += .49) {
      box(detalle, id + '_junta_fina_transversal', s, -.003, z, .018, .008, margen - .025, junta);
    }
    box(detalle, id + '_cenefa_del_pavimento_contiguo', x, .001, 0, .078, .007, 2 * semifondo, terracota);
    box(detalle, id + '_cenefa_del_pavimento_contiguo', 0, .001, z, 2 * semiancho, .007, .078, terracota);
  }
  return detalle;
}

function patioH({THREE, buildingGroups, box, data, S}) {
  const h = data.buildings.find(b => b.id === 'H');
  const hGroup = buildingGroups.get('H');
  if (!h || !hGroup) return;

  const storey = data.storeyHeight;
  for (const [i, side] of [[0, 1], [1, -1]]) {
    const part = hGroup.getObjectByName('H_volumen_' + i);
    if (!part) continue;
    const [x0, z0, x1, z1] = h.rects[i];
    const ancho = (x1 - x0) * S();
    const borde = side * (z1 - z0) * S() / 2;
    const cara = borde + side * .080;
    const detalle = grupo(THREE, part, 'H_canceleria_hacia_patio_' + i,
      fuenteH + ' y panorama de la galería de H en el recorrido 360°.');
    const modulos = Math.max(2, Math.round((ancho - 2) / 4.8));
    const largo = (ancho - 1.5) / modulos;
    for (let p = 1; p < h.floors; p++) {
      const y = p * storey;
      box(detalle, 'H_antepecho_aparente_del_patio', 0, y + .62, cara,
        ancho - 1.48, 1.21, .21, '#b6b4a9');
      box(detalle, 'H_faja_aparente_del_patio', 0, y + 2.88, cara,
        ancho - 1.48, .71, .21, '#b9b7ae');
      for (let j = 0; j < modulos; j++) {
        const x = (j - (modulos - 1) / 2) * largo;
        box(detalle, 'H_ventana_rehundida_hacia_patio', x, y + 1.83, cara - side * .021,
          largo - .061, 1.28, .087, j % 4 === 1 ? '#445652' : '#435154');
        for (const dx of [-.25, 0, .25]) {
          box(detalle, 'H_perfil_aluminio_hacia_patio', x + dx * largo, y + 1.83,
            cara + side * .037, .042, 1.29, .037, '#a3a69e');
        }
        box(detalle, 'H_junta_del_precolado', x - largo / 2, y + .62,
          cara + side * .111, .032, 1.20, .016, '#8d8e86');
      }
    }
  }
}

function frenteBiblioteca({THREE, world, box}) {
  const plaza = world.getObjectByName('Plaza_COSEI_detalle');
  const vidrio = plaza?.getObjectByName('Acceso_acristalado_Biblioteca_I');
  const muro = plaza?.getObjectByName('I_muro_macizo_oriente');
  const dintel = plaza?.getObjectByName('I_dintel_concreto_fachada');
  if (!vidrio || !muro || !dintel) return;

  const detalle = grupo(THREE, plaza, 'I_detalle_del_portico_de_Biblioteca', 'Corpus imagen_0018, imagen_0020 e imagen_0034. ' + fuenteI);
  const {x, y, z} = vidrio.position;
  const ancho = vidrio.scale.x, alto = vidrio.scale.y;
  const modulos = Math.round(ancho / 2.2);
  const largo = ancho / modulos;
  const frente = z - .086;
  const alturaInferior = y - .49 * alto;
  const franjas = [
    {centro: .117, alto: .19, acabado: ['#435252','#505f5e','#4b5757']},
    {centro: .345, alto: .23, acabado: ['#3a5057','#4e646b','#50676d']},
    {centro: .63, alto: .255, acabado: ['#45606b','#526b74','#5b757d']},
    {centro: .88, alto: .226, acabado: ['#3a515c','#526d77','#4e646e']},
  ];
  const acceso = plaza.getObjectByName('I_portico_retranqueado_acceso');
  for (let j = 0; j < modulos; j++) {
    const cx = x - ancho / 2 + (j + .5) * largo;
    for (const franja of franjas) {
      box(detalle, 'I_pano_modulado_de_vidrio', cx, alturaInferior + alto * franja.centro,
        frente, largo - .10, alto * franja.alto, .018, franja.acabado[j % 3]);
    }
    if (!acceso || Math.abs(acceso.position.x - cx) > 1.65) {
      box(detalle, 'I_travesano_de_cancel_inferior', cx, alturaInferior + .204 * alto, frente - .035,
        largo, .043, .04, '#bfc4bc');
    }
  }

  const wy = muro.position.y, wx = muro.position.x;
  const wz = muro.position.z - muro.scale.z / 2 - .012;
  const caraX = muro.scale.x;
  for (const sign of [-1, 1]) {
    box(detalle, 'I_junta_vertical_panel_del_muro', wx + sign * caraX * .17, wy + muro.scale.y * .16,
      wz, .042, muro.scale.y * .68, .025, '#898a80');
  }
  for (const proporcion of [.14, .39]) {
    box(detalle, 'I_junta_horizontal_panel_del_muro', wx, wy + proporcion * muro.scale.y,
      wz, caraX - .075, .026, .025, '#909187');
  }
  const d = dintel.position;
  const dz = d.z - dintel.scale.z / 2 - .012;
  for (let s = -dintel.scale.x / 2 + 3.6; s < dintel.scale.x / 2 - 1; s += 3.6) {
    box(detalle, 'I_junta_del_dintel_precolado', d.x + s, d.y, dz, .027, dintel.scale.y - .058, .023, '#8e8f86');
  }
}

export function modelarZonasCentro(contexto) {
  const {THREE, world, box} = contexto;
  mesasDeConcreto(contexto);
  acabadoPasoG(contexto);
  pavimentoAjedrez(THREE, world, box, 'HO', 5.05, 4.25, .60,
    fuenteAjedrez + ' y corpus 0007. Entorno inmediato de la plaza; perímetro aproximado.');
  patioH(contexto);
  const hp = pavimentoAjedrez(THREE, world, box, 'HP', 8.3, 5.15, .86,
    fuenteHP + '. Pavimento y drenaje de la foto histórica, acotados al patio existente.');
  if (hp) {
    const lados = [[-4.53, .03, 0], [2.03, 2.97, Math.PI / 2]];
    for (const [x, z, giro] of lados) {
      const rejilla = grupo(THREE, hp, 'HP_canal_lineal_con_rejilla', fuenteHP);
      rejilla.position.set(x, .015, z);
      rejilla.rotation.y = giro;
      box(rejilla, 'HP_zanja_del_drenaje', 0, 0, 0, .19, .016, 2.15, '#4b4e49');
      for (let s = -.99; s < 1; s += .076) {
        box(rejilla, 'HP_travesano_de_rejilla', 0, .011, s, .164, .012, .028, '#a1a29b');
      }
    }
  }
  frenteBiblioteca(contexto);
}
