// Acabados del oriente, zonas 35–50, referidos a piezas del croquis existente.
const callePuerta6 = 'Street View, Eje 5 Norte, enero de 2025, pano bC0qD7d7XzSPbdO2jFmQbg';
const ferrocarriles = 'Street View, Ferrocarriles, julio de 2024, pano HY5f0h236SqOvdbIBTZyLg';
const concreto = '#b6b4a7';
const metal = '#6f7773';

function zona(THREE, padre, numero, nombre, referencia) {
  const grupo = new THREE.Group();
  grupo.name = 'Zona50_' + numero + '_' + nombre;
  grupo.userData = {zona50: numero, approximate: true, reference: referencia};
  padre.add(grupo);
  return grupo;
}

function buscadorDePiezas(raiz, nombre) {
  const piezas = [];
  raiz?.traverse(objeto => {
    if (objeto.name === nombre) piezas.push(objeto);
  });
  return piezas;
}

function bordeHorizontal(ctx, padre, pieza, nombre, color, ancho, fondo, dx = 0, dz = 0) {
  const {x, y, z} = pieza.position;
  return ctx.box(padre, nombre, x + dx, y + pieza.scale.y / 2 + .009, z + dz,
    ancho, .008, fondo, color);
}

function puerta6(ctx) {
  const {THREE, world, box, material} = ctx;
  const cierres = world.getObjectByName('Cierres_Maps_poniente');
  const extremos = cierres?.userData.vanos.find(vano => vano.id === 'P3')?.extremosXZ;
  const acceso = ctx.net?.nodos.find(nodo => nodo.id === 'n93');
  if (!extremos?.every(punto => Array.isArray(punto)) || !acceso) return;

  const caminos = world.getObjectByName('Conexiones_peatonales_de_las_puertas');
  const grupo = zona(THREE, caminos || world, 35, 'Puerta6_banqueta_y_macetas', callePuerta6);
  const borde = Math.min(...extremos.map(punto => punto[0]));
  const z = acceso.z;
  const acera = new THREE.Group();
  acera.userData.fueraDelPredio = true;
  grupo.add(acera);
  const separacion = 1.64;
  for (const [start, end] of [[borde - 5.6, acceso.x - separacion], [acceso.x + separacion, borde + 13.1]]) {
    const ancho = end - start;
    box(acera, 'Puerta6_pano_de_banqueta', start + ancho / 2, .303, z + 1.35,
      ancho, .048, 2.61, '#adada3');
    const paños = Math.ceil(ancho / 1.38);
    for (let i = 0; i < paños; i++) {
      const paso = ancho / paños;
      box(acera, 'Puerta6_losa_de_banqueta', start + (i + .5) * paso, .331, z + 1.35,
        paso - .025, .008, 2.57, i % 2 ? '#c6c4b7' : '#bfbdaf');
    }
    box(acera, 'Puerta6_canto_de_concreto', start + ancho / 2, .313, z + 2.67,
      ancho, .073, .105, '#c8c1af');
  }
  const maceta = new THREE.LatheGeometry(
    [[0,0],[.27,0],[.35,.42],[.36,.49],[.305,.49],[.293,.42],[.262,.08],[0,.08]]
      .map(([x,y]) => new THREE.Vector2(x,y)), 20);
  const tierra = new THREE.CylinderGeometry(.291, .291, .025, 20);
  const copa = new THREE.IcosahedronGeometry(.38, 1);
  // Las ubicaciones se dibujan junto a los paños laterales, fuera del vano y del eje del andador.
  for (const [x, conArbusto] of [[borde - 4.5,false],[borde - 2.6,true],[borde - 1.15,true]]) {
    const planta = new THREE.Mesh(maceta, material(concreto));
    planta.name = 'Puerta6_maceta_cilindrica_de_concreto';
    planta.position.set(x, .34, z + .71);
    planta.castShadow = true;
    acera.add(planta);
    const sustrato = new THREE.Mesh(tierra, material('#6b6555'));
    sustrato.name = 'Puerta6_tierra_en_maceta';
    sustrato.position.set(x, conArbusto ? .78 : .63, z + .71);
    acera.add(sustrato);
    if (!conArbusto) continue;
    for (const [dx, dy, dz, tono] of [[-.16,.15,.025,'#465838'],[.13,.21,.04,'#3d5439'],[.03,.39,-.027,'#536747']]) {
      const rama = new THREE.Mesh(copa, material(tono));
      rama.name = 'Puerta6_copa_de_arbusto';
      rama.position.set(x + dx, .78 + dy, z + .71 + dz);
      rama.castShadow = true;
      acera.add(rama);
    }
  }
}

function jardinPuerta6(ctx) {
  const {THREE, world, meshPoly} = ctx;
  const llegada = world.getObjectByName('Llegada_y_jardines_Puerta_6');
  if (!llegada) return;
  const grupo = zona(THREE, llegada, 36, 'Jardines_de_llegada',
    'Sendero Interpretativo 4 UAM y ortofoto Esri registrada; bordes aproximados entre jardín y ensanche');
  // Hilo de tierra y concreto fino en bordes ya libres de la trayectoria n93–n22.
  meshPoly(grupo, [[1356,611],[1357,612],[1357,648],[1359,656],[1367,654],[1366,656],[1356,662]],
    .238, '#a5a183', 'Puerta6_borde_del_jardin_interior');
  meshPoly(grupo, [[1404,678],[1406,679],[1404,692],[1424,692],[1423,694],[1401,694]],
    .238, '#b0a983', 'Puerta6_borde_del_jardin_deportivo');
  meshPoly(grupo, [[1358,620],[1368,615],[1377,617],[1382,626],[1378,632],[1366,629],[1358,631]],
    .235, '#a79d72', 'Puerta6_tierra_bajo_copas');
}

function porticoW(ctx, portico) {
  const piso = portico?.getObjectByName('W_piso_portico_acceso');
  if (!piso) return;
  const grupo = zona(ctx.THREE, portico, 37, 'W_solado_del_portico', 'Corpus AZC 0102 y 0103, solado gris modular');
  const ancho = Math.min(6.15, piso.scale.x - 1.6);
  const centroX = piso.position.x - piso.scale.x / 2 + .43 + ancho / 2;
  const anchoPaño = ancho / 4;
  const paso = 1.30;
  for (let i = 0; i < 23; i++) {
    const z = piso.position.z + (i - 11) * paso;
    for (let j = 0; j < 4; j++) {
      const x = centroX + (j - 1.5) * anchoPaño;
      const gris = ['#bdbbb1','#b1b2a7','#c2c0b8','#b6b6ac'][(i * 3 + j * 5) % 4];
      ctx.box(grupo, 'W_modulo_de_solado', x, piso.position.y + piso.scale.y / 2 + .006, z,
        anchoPaño - .026, .008, paso - .035, gris);
    }
  }
}

function cubiertaW(ctx, portico) {
  const paneles = buscadorDePiezas(portico, 'W_lamina_clara_entre_cerchas');
  if (!paneles.length) return;
  const grupo = zona(ctx.THREE, portico, 38, 'W_juntas_de_cubierta', 'Corpus AZC 0102 y 0103, cubierta clara entre perfiles de acero rojos');
  for (const panel of paneles) {
    const {x, y, z} = panel.position;
    const {x: ancho, y: espesor, z: fondo} = panel.scale;
    for (const lado of [-1, 1]) {
      ctx.box(grupo, 'W_union_longitudinal_de_panel', x + lado * (ancho / 2 - .09), y + espesor / 2 + .006, z,
        .085, .028, fondo, '#7e8682');
    }
    ctx.box(grupo, 'W_solape_transversal_de_panel', x, y + espesor / 2 + .006, z - fondo / 2 + .06,
      ancho, .028, .11, '#a0a39a');
  }
}

function conjuntoOP1(ctx) {
  const {THREE, box, buildingGroups} = ctx;
  const p1 = buildingGroups.get('P1')?.getObjectByName('P1_volumen_0');
  const torre = p1?.getObjectByName('P1_torre_azulejo_azul');
  if (torre) {
    const grupo = zona(THREE, p1, 39, 'P1_zocalo_azul_y_canto', 'Corpus AZC 0002, 0009, 0013; escalera y pie de la torre cerámica');
    const {x,z} = torre.position;
    const {x:ancho,z:fondo} = torre.scale;
    for (const lado of [-1,1]) {
      box(grupo, 'P1_azulejo_sombreado_a_nivel_del_patio', x, .34, z + lado * (fondo / 2 + .011),
        ancho + .026, .27, .028, '#234578');
      box(grupo, 'P1_encuentro_del_azulejo_con_el_suelo', x + lado * (ancho / 2 + .013), .34, z,
        .028, .27, fondo, '#234578');
    }
  }
  const marquesina = buildingGroups.get('O')?.getObjectByName('O_marquesina_tubular_de_llegada');
  if (marquesina) {
    const grupo = zona(THREE, marquesina, 39, 'O_remate_de_marquesina', 'Video de acceso O, 1:22, y croquis de cubierta curva');
    for (const larguero of buscadorDePiezas(marquesina, 'O_larguero_marquesina').filter(p => p.position.y < 3.03)) {
      const {x,y,z} = larguero.position;
      box(grupo, 'O_canto_continuo_de_la_cubierta', x, y + .056, z, .095, .072, larguero.scale.z, '#925043');
    }
  }
  const juntas = buscadorDePiezas(buildingGroups.get('P'), 'P_junta_de_cubierta');
  if (juntas.length) {
    const grupo = zona(THREE, juntas[0].parent, 39, 'P_modulacion_de_conexion', 'Ortofoto Esri de talleres, continuidad y cambios de paño de la conexión P');
    for (const junta of juntas) bordeHorizontal(ctx, grupo, junta, 'P_sombra_de_junta_en_conexion', '#a97b68',
      .31, junta.scale.z - .07, -.22);
  }
}

function portonesP2(ctx) {
  const puertas = buscadorDePiezas(ctx.buildingGroups.get('P2'), 'P2_porton_azul_taller');
  if (!puertas.length) return;
  const grupo = zona(ctx.THREE, puertas[0].parent, 40, 'P2_canceleria_azul', 'Corpus AZC 0065; puertas azules con modulación de paños altos');
  for (const puerta of puertas) {
    const {x,y,z} = puerta.position;
    const {x:grosor,y:alto,z:ancho} = puerta.scale;
    const frente = x + Math.sign(x) * (grosor / 2 + .015);
    for (let i = 0; i < 4; i++) {
      const panelZ = z + (i - 1.5) * ancho / 4;
      ctx.box(grupo, 'P2_vidrio_alto_del_porton', frente, y + alto * .33, panelZ,
        .022, alto * .235, ancho / 4 - .075, i % 2 ? '#64747b' : '#677a80');
    }
    ctx.box(grupo, 'P2_travesano_azul_bajo_vidrio', frente, y + alto * .20, z,
      .035, .10, ancho, '#344c78');
  }
}

function invernaderoP2(ctx) {
  const pabellon = ctx.buildingGroups.get('P2')?.getObjectByName('P2_invernadero_lateral');
  const huella = pabellon?.userData.parkingGroundBounds;
  if (!huella) return;
  const grupo = zona(ctx.THREE, pabellon, 41, 'P2_perfiles_blancos_del_invernadero', 'Corpus AZC 0036 y 0047, modulación blanca de vidrio y cubierta');
  const w = huella.xMax - huella.xMin;
  const d = huella.zMax - huella.zMin;
  // Perfiles dentro del volumen trasladado que audita el verificador del invernadero.
  for (const lado of [-1, 1]) {
    const z = lado * (d / 2 - .018);
    for (const x of [-w * .30, 0, w * .30]) {
      ctx.box(grupo, 'P2_parteluz_de_testero_invernadero', x, -.41, z, .047, 1.91, .026, '#e5e7df');
    }
    ctx.box(grupo, 'P2_carril_claro_de_testero', 0, -.44, z, w - .08, .072, .028, '#e1e4db');
  }
}

function anexoP3(ctx) {
  const ventanas = buscadorDePiezas(ctx.buildingGroups.get('P3'), 'P3_luz_del_anexo_bajo');
  if (!ventanas.length) return;
  const grupo = zona(ctx.THREE, ventanas[0].parent, 42, 'P3_entrecalles_de_tabique', 'Corpus AZC 0015, 0022, 0027 y 0035, frente de taller rojizo y vanos altos');
  const inicio = ventanas[0].position.x - ventanas[0].scale.x / 2 - .12;
  const fin = ventanas.at(-1).position.x + ventanas.at(-1).scale.x / 2 + .12;
  const z = ventanas[0].position.z - .048;
  for (const y of [.58,.73,.88,1.03,1.18,1.33,1.48,1.63,1.78]) {
    ctx.box(grupo, 'P3_aparejo_horizontal_del_anexo', (inicio + fin) / 2, y, z,
      fin - inicio, .018, .014, '#b27663');
  }
}

function patioP4(ctx) {
  const piso = ctx.buildingGroups.get('P4')?.getObjectByName('P4_pavimento_de_estudio');
  if (!piso) return;
  const grupo = zona(ctx.THREE, piso.parent, 43, 'P4_mosaico_del_patio', 'Corpus AZC 0016, 0021 y 0032, loseta rojiza entre bordes grises');
  for (let i = -15; i <= 15; i++) {
    for (const lateral of [-1, 1]) {
      const desplazamiento = lateral * 2.1;
      const color = ['#aa725c','#b88269','#a97560','#b37a65'][Math.abs(i * 3 + lateral) % 4];
      bordeHorizontal(ctx, grupo, piso, 'P4_loseta_de_la_franja_terracota', color,
        .6, .91, desplazamiento, i * .96);
    }
  }
}

function galeriaS(ctx) {
  const luces = buscadorDePiezas(ctx.buildingGroups.get('S'), 'S_luminaria_lineal');
  if (!luces.length) return;
  const grupo = zona(ctx.THREE, luces[0].parent, 44, 'S_difusores_del_corredor', 'Corpus AZC 0003, luminarias tubulares y canalización bajo plafón');
  for (const luz of luces) {
    const {x,y,z} = luz.position;
    ctx.box(grupo, 'S_difusor_de_doble_linea', x, y - .048, z, .11, .033, luz.scale.z * .95, '#ece1b7');
    for (const lado of [-1,1]) ctx.box(grupo, 'S_terminal_oscuro_de_luminaria', x, y - .034,
      z + lado * luz.scale.z * .49, .158, .061, .105, '#555653');
  }
}

function frenteR(ctx) {
  const volumen = ctx.buildingGroups.get('R')?.getObjectByName('R_volumen_superior_rojo');
  const nervios = buscadorDePiezas(volumen?.parent, 'R_nervadura_volumen_rojo');
  if (!nervios.length) return;
  const grupo = zona(ctx.THREE, volumen.parent, 45, 'R_canto_del_voladizo', 'Corpus AZC 0060, volumen alto rojizo y cara inferior en sombra');
  const {x, y} = volumen.position;
  const {x: ancho, y: alto} = volumen.scale;
  ctx.box(grupo, 'R_perfil_oscuro_inferior_del_voladizo', x, y - alto / 2 + .058,
    nervios[0].position.z + .014, ancho, .155, .083, '#773a35');
  const tonos = ['#9f423a','#b45145','#a7443c','#983d38'];
  nervios.forEach((pieza,i) => { pieza.material = ctx.material(tonos[i % tonos.length]); });
}

function frenteQ(ctx) {
  const fascia = ctx.buildingGroups.get('Q')?.getObjectByName('Q_fascia_roja_campo');
  const andador = fascia?.parent.getObjectByName('Q_andador_junto_al_campo');
  if (!andador) return;
  const grupo = zona(ctx.THREE, fascia.parent, 46, 'Q_solado_frente_al_campo', 'Aleph 364, p. 13; Corpus AZC 0075, borde claro sobre campo natural');
  const paso = 1.36;
  const maximo = andador.scale.z / 2 - .25;
  for (let dz = -maximo + .72; dz < maximo; dz += paso) {
    bordeHorizontal(ctx, grupo, andador, 'Q_junta_del_andador_a_nivel', '#817f70',
      andador.scale.x - .07, .030, 0, dz);
  }
  bordeHorizontal(ctx, grupo, andador, 'Q_canto_continuo_del_andador', '#c4bba3',
    .13, andador.scale.z, -andador.scale.x / 2 + .09);
}

function bordeMulticancha(ctx, canchas) {
  const cancha = canchas?.getObjectByName('Cancha_borde_terracota');
  if (!cancha) return;
  const grupo = zona(ctx.THREE, canchas, 47, 'Multicanchas_borde_terracota', 'Corpus AZC 0096, plataforma rojiza con borde oscuro hacia el suelo exterior');
  const {x, y, z} = cancha.position;
  const {x: ancho, y: alto, z: fondo} = cancha.scale;
  for (const lado of [-1, 1]) {
    ctx.box(grupo, 'Multicanchas_cara_de_guarnicion', x, y + alto * .28, z + lado * (fondo / 2 - .003),
      ancho, .106, .025, '#735d4b');
    bordeHorizontal(ctx, grupo, cancha, 'Multicanchas_borde_de_transicion_terracota', '#864d3e',
      ancho, .36, 0, lado * (fondo / 2 - .21));
  }
}

function campoNatural(ctx, canchas) {
  if (!canchas?.getObjectByName('Campo_futbol')) return;
  const grupo = zona(ctx.THREE, canchas, 48, 'Campo_natural_hierba_y_tierra', 'Corpus AZC 0074–0076, franja irregular de hierba, suelo expuesto y andador');
  const suelo = [
    ['#92986a', [[1453,488],[1459,486],[1461,503],[1459,523],[1463,543],[1458,574],[1460,589],[1453,595]]],
    ['#857c5d', [[1453,524],[1457,531],[1458,545],[1455,556],[1457,570],[1453,581]]],
    ['#a99d70', [[1464,555],[1476,545],[1486,548],[1492,563],[1485,581],[1468,587],[1459,578]]],
    ['#99946b', [[1500,636],[1512,626],[1533,631],[1540,657],[1527,673],[1505,665]]],
  ];
  for (const [i, [color, puntos]] of suelo.entries()) {
    ctx.meshPoly(grupo, puntos, .369 + i * .002, color, 'Campo_manchon_de_cesped_y_tierra');
  }
}

function puerta7(ctx) {
  const cierres = ctx.world.getObjectByName('Cierres_Maps_poniente');
  const extremos = cierres?.userData.vanos.find(vano => vano.id === 'V3')?.extremosXZ;
  if (!extremos?.every(punto => Array.isArray(punto))) return;
  const caminos = ctx.world.getObjectByName('Conexiones_peatonales_de_las_puertas');
  const grupo = zona(ctx.THREE, caminos || ctx.world, 49, 'Ferrocarriles_vado_y_borde',
    ferrocarriles + '; Plano de Protección Civil para situar V3');
  const [a,b] = extremos;
  const centro = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const escala = ctx.data.metersPerPixel;
  const puntos = [[-2.53,-.24],[2.53,-.24],[2.53,.64],[-2.53,.64]].map(([x,z]) =>
    [895 + (centro[0]+x) / escala, 390 + (centro[1]+z) / escala]);
  ctx.meshPoly(grupo, puntos, .315, '#aba99c', 'Puerta7_junta_enrasada_de_concreto');
  for (const [x,z] of extremos) {
    ctx.box(grupo, 'Ferrocarriles_canto_lateral_de_banqueta', x, .284, z - .75,
      .27, .031, 1.3, '#a9a49a').userData.fueraDelPredio = true;
  }
}

function gradaFutbol7(ctx) {
  const grada = ctx.world.getObjectByName('Gradas_deportivas_Q');
  const techo = grada?.getObjectByName('Cubierta_gradas_canchas');
  if (!techo) return;
  const grupo = zona(ctx.THREE, grada, 50, 'Futbol7_lamina_de_gradas', 'Corpus AZC 0072 y 0073, lámina gris acanalada sobre la grada blanca');
  const {x,y,z} = techo.position;
  const {x: ancho, y: alto, z: fondo} = techo.scale;
  const tonos = ['#858b89','#909895','#798381','#898f89'];
  const paso = fondo / 23;
  for (let i = 0; i < 23; i++) {
    const paño = ctx.box(grupo, 'Futbol7_banda_de_lamina_galvanizada', x, y + alto / 2 + .014,
      z - fondo / 2 + (i + .5) * paso, ancho - .015, .025, paso - .053, tonos[i % tonos.length]);
    paño.rotation.z = techo.rotation.z;
  }
}

export function mejorarOriente50(ctx) {
  puerta6(ctx);
  jardinPuerta6(ctx);
  const portico = ctx.buildingGroups.get('W')?.getObjectByName('W_AZC_laboratorios_y_portico');
  porticoW(ctx, portico);
  cubiertaW(ctx, portico);
  conjuntoOP1(ctx);
  portonesP2(ctx);
  invernaderoP2(ctx);
  anexoP3(ctx);
  patioP4(ctx);
  galeriaS(ctx);
  frenteR(ctx);
  frenteQ(ctx);
  const canchas = ctx.world.getObjectByName('Canchas_deportivas_AZC');
  bordeMulticancha(ctx, canchas);
  campoNatural(ctx, canchas);
  puerta7(ctx);
  gradaFutbol7(ctx);
}
