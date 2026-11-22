// Tres franjas, dentro del paño exterior existente. Esri 2025, Aleph UAM y corpus 0096.
export const franjasMulticanchasPoniente = [[1465, 1499], [1502, 1536], [1539, 1573]];

// Las naves 1P, 2P y 3P tienen módulos claros junto a una banda longitudinal oscura.
// Se reconstruye su ritmo desde la vista aérea, con perfil bajo basado en 0015, 0022 y 0027.
export function reconstruirCubiertasTalleres({THREE, data, buildingGroups, box, material, X, Z}) {
  const proporciones = {P1: .73, P2: .86, P3: .90};
  for (const id of ['P1', 'P2', 'P3']) {
    const edificio = data.buildings.find(b => b.id === id);
    const volumen = buildingGroups.get(id)?.getObjectByName(id + '_volumen_0');
    if (!edificio || !volumen || volumen.getObjectByName(id + '_cubierta_modulada')) continue;

    const [x0, z0, x1, z1] = edificio.rects[0];
    const ancho = X(x1) - X(x0);
    const fondo = Z(z1) - Z(z0);
    const altura = edificio.height ?? edificio.floors * data.storeyHeight;
    const base = altura + .40;
    const serie = new THREE.Group();
    serie.name = id + '_cubierta_modulada';
    serie.userData = {approximate: true, reference: 'Esri 2025-01-30; corpus 0015, 0022, 0027'};
    volumen.add(serie);

    const cantidad = 11;
    const paso = (fondo - 1.1) / cantidad;
    const claro = paso - .16;
    const anchoClaro = ancho * proporciones[id];
    const inicio = -ancho / 2 + .34;
    const anchoFranja = ancho - anchoClaro - .58;
    const forma = new THREE.Shape();
    forma.moveTo(-claro / 2, 0);
    forma.quadraticCurveTo(0, 1.06, claro / 2, 0);
    forma.lineTo(claro / 2, -.09);
    forma.lineTo(-claro / 2, -.09);
    forma.closePath();

    const perfil = new THREE.ExtrudeGeometry(forma, {depth: anchoClaro, curveSegments: 10, bevelEnabled: false});
    perfil.translate(0, 0, -anchoClaro / 2);
    perfil.rotateY(Math.PI / 2);
    const claroMate = material('#e0dfd4');
    for (let n = 0; n < cantidad; n++) {
      const cubierta = new THREE.Mesh(perfil, claroMate);
      cubierta.name = id + '_modulo_claro_de_cubierta';
      cubierta.position.set(inicio + anchoClaro / 2, base + .09, -fondo / 2 + .55 + (n + .5) * paso);
      cubierta.receiveShadow = true;
      serie.add(cubierta);
    }
    box(serie, id + '_franja_longitudinal_azotea', inicio + anchoClaro + anchoFranja / 2,
      base + .10, 0, anchoFranja, .20, fondo - 1.1, '#666964');
  }
  detallarConexionP({buildingGroups, box, material});
  detallarMarquesinaYEscaleraP1({THREE, buildingGroups, box});
  detallarPortonesYMarquesinasP2({THREE, buildingGroups, box});
  detallarPatiosDeTalleres({THREE, data, buildingGroups, box, material, X, Z});
}

// La cubierta roja de P conecta visualmente las naves. Sus juntas se leen en la ortofoto.
function detallarConexionP({buildingGroups, box, material}) {
  const volumen = buildingGroups.get('P')?.getObjectByName('P_volumen_0');
  const azotea = volumen?.getObjectByName('Azotea');
  if (!azotea || volumen.getObjectByName('P_junta_de_cubierta')) return;
  const {x: ancho, z: fondo} = azotea.scale;
  const y = azotea.position.y + azotea.scale.y / 2;
  azotea.material = material('#a96454');
  for (const proporcion of [-.24, -.08, .16, .35]) {
    box(volumen, 'P_junta_de_cubierta', ancho * proporcion, y + .018, 0, .12, .046, fondo * .92, '#855448');
  }
  box(volumen, 'P_paño_terracota_conexion', ancho * .22, y + .012, 0, ancho * .095, .032, fondo * .88, '#ad6e5c');
}

// Fotos 0002, 0009 y 0013. Se trabaja dentro de las envolventes ya asignadas a la escalera y cubierta.
function detallarMarquesinaYEscaleraP1({THREE, buildingGroups, box}) {
  const volumen = buildingGroups.get('P1')?.getObjectByName('P1_volumen_0');
  const marquesina = volumen?.getObjectByName('P1_marquesina_roja');
  if (!marquesina || volumen.getObjectByName('P1_travesaño_marquesina')) return;
  const {x, y, z} = marquesina.position;
  const {x: ancho, y: alto, z: fondo} = marquesina.scale;
  marquesina.material = new THREE.MeshStandardMaterial({color: '#e9dfcc', transparent: true, depthWrite: false, opacity: .60, roughness: .74});
  marquesina.userData.disposeMaterial = true;
  marquesina.castShadow = false;
  for (const lateral of [-1, 1]) {
    box(volumen, 'P1_borde_tubular_marquesina', x + lateral * (ancho / 2 - .064), y - alto * .32, z, .11, .12, fondo, '#a23933');
  }
  const divisiones = Math.ceil(fondo / 3.2);
  for (let i = 0; i <= divisiones; i++) {
    const posZ = z + (i / divisiones - .5) * (fondo - .095);
    box(volumen, 'P1_travesaño_marquesina', x, y - alto * .32, posZ, ancho, .11, .075, '#a23933');
  }

  const escalera = volumen.getObjectByName('P1_escalera_exterior');
  if (!escalera) return;
  const {x: anchoEscalera, y: altura, z: largo} = escalera.scale;
  const arranque = escalera.position.y - altura / 2;
  const frente = escalera.position.z - largo / 2;
  const peldaños = 13;
  const huella = largo / peldaños;
  for (let i = 1; i <= peldaños; i++) {
    const altoEscalera = altura * i / peldaños;
    box(volumen, 'P1_peldaño_de_concreto', escalera.position.x, arranque + altoEscalera / 2,
      frente + (i - .5) * huella, anchoEscalera, altoEscalera, huella, i % 2 ? '#b3b1a7' : '#b7b5aa');
  }
  escalera.removeFromParent();
}

// Detalle dentro de las envolventes ya modeladas. Corpus AZC 0065 y 0093.
function detallarPortonesYMarquesinasP2({THREE, buildingGroups, box}) {
  const taller = buildingGroups.get('P2')?.getObjectByName('P2_AZC_talleres_2P');
  if (!taller || taller.getObjectByName('P2_paño_superior_del_portón')) return;
  const azul = '#294a77', rojo = '#a33b34';
  const portones = taller.children.filter(pieza => pieza.name === 'P2_porton_azul_taller');
  for (const porton of portones) {
    const {x, y, z} = porton.position;
    const {x: espesor, y: alto, z: ancho} = porton.scale;
    const lado = Math.sign(x);
    const cara = x + lado * espesor / 2;
    const cabezal = y + alto / 2;
    const franja = alto * .31;
    const columna = (ancho - .12) / 4;
    for (let i = 0; i < 4; i++) {
      const luz = z - ancho / 2 + .06 + (i + .5) * columna;
      box(taller, 'P2_paño_superior_del_portón', cara + lado * .016,
        cabezal - .055 - franja / 2, luz, .028, franja, columna - .065, i % 2 ? '#b9c3c5' : '#c8cbca');
    }
    box(taller, 'P2_travesaño_azul_del_portón', cara + lado * .027,
      cabezal - franja - .086, z, .044, .072, ancho - .085, azul);
    box(taller, 'P2_junta_de_las_hojas', cara + lado * .027,
      y - franja / 2 - .012, z, .043, alto - franja - .12, .056, azul);
    for (const hoja of [-1, 1]) {
      box(taller, 'P2_tirador_del_portón', cara + lado * .047, y - .31, z + hoja * .15,
        .050, .21, .052, '#99a39e');
    }
  }

  const cubiertas = taller.children.filter(pieza => pieza.name === 'P2_marquesina_roja');
  for (const cubierta of cubiertas) {
    const {x, y, z} = cubierta.position;
    const {x: ancho, y: alto, z: largo} = cubierta.scale;
    cubierta.material = new THREE.MeshStandardMaterial({
      color: '#e4dbc7', transparent: true, depthWrite: false, opacity: .58, roughness: .68
    });
    cubierta.userData.disposeMaterial = true;
    cubierta.castShadow = false;
    const bajo = y - alto / 2;
    for (const retiro of [-.42, 0, .42]) {
      box(taller, 'P2_larguero_rojo_de_marquesina', x + ancho * retiro, bajo, z, .098, .096, largo, rojo);
    }
    const claros = Math.ceil(largo / 3.7);
    for (let i = 0; i <= claros; i++) {
      const posZ = z + (i / claros - .5) * (largo - .10);
      box(taller, 'P2_travesaño_rojo_de_marquesina', x, bajo - .012, posZ, ancho, .092, .082, rojo);
      if (i % 3 === 1) {
        box(taller, 'P2_luminaria_lineal_de_marquesina', x, bajo - .082, posZ,
          ancho * .57, .038, .074, '#eee9d7');
      }
    }
  }
}

// Paños de la galería de estudio. Corpus AZC 0016 y 0019.
function detallarFachadaDeEstudioP4(volumen, cubierta, edificio, box, nivel) {
  const escalones = volumen.children.filter(pieza => pieza.name === 'P4_escalinata_acceso')
    .sort((a, b) => a.position.x - b.position.x);
  if (!escalones.length || volumen.getObjectByName('P4_cancel_del_patio')) return;
  const {z} = cubierta.position;
  const fondo = cubierta.scale.z;
  const cara = cubierta.position.x + cubierta.scale.x / 2 + .10;
  const zEntrada = escalones[0].position.z;
  const claro = escalones[0].scale.z;
  const ladoA = zEntrada - claro / 2 - .15;
  const ladoB = zEntrada + claro / 2 + .15;
  if (ladoA <= z - fondo / 2 || ladoB >= z + fondo / 2) return;

  const paño = (nombre, y, posZ, alto, ancho, color, saliente = .13) =>
    box(volumen, nombre, cara - saliente, y, posZ, .058, alto, ancho, color);
  const concreto = '#bdbbb2', terracota = '#a65e4c', vidrio = '#60706e', aluminio = '#e2dfd2';
  const tramos = [];
  for (const [inicio, fin] of [[z - fondo / 2, ladoA], [ladoB, z + fondo / 2]]) {
    const cantidad = Math.max(1, Math.round((fin - inicio) / 5.4));
    const ancho = (fin - inicio) / cantidad;
    for (let i = 0; i < cantidad; i++) tramos.push({centro: inicio + (i + .5) * ancho, ancho});
  }
  tramos.push({centro: zEntrada, ancho: ladoB - ladoA});
  for (let piso = 0; piso < edificio.floors; piso++) {
    for (const {centro, ancho} of tramos) {
      const y = piso * nivel + 2;
      const acceso = piso === 0 && centro === zEntrada;
      if (!acceso) {
        paño('P4_entrepaño_terracota_del_patio', y, centro, 1.26, ancho, terracota);
        for (const ventana of [-1, 1]) {
          const centroVentana = centro + ventana * ancho * .26;
          paño('P4_marco_claro_de_ventana', y - .07, centroVentana, .91, ancho * .40, aluminio, .17);
          paño('P4_vidrio_de_ventana_del_patio', y - .07, centroVentana, .80, ancho * .36, vidrio, .21);
          paño('P4_montante_de_ventana_del_patio', y - .07, centroVentana, .89, .045, aluminio, .24);
        }
      }
      paño('P4_pilastra_gris_del_patio', y - .37, centro + ancho / 2 - .09, nivel, .18, concreto, .19);
    }
  }
  for (let piso = 1; piso <= edificio.floors; piso++) {
    paño('P4_losa_horizontal_de_fachada', piso * nivel - .43, z, .31, fondo, concreto, .165);
  }

  const altura = Math.max(...escalones.map(pieza => pieza.position.y + pieza.scale.y / 2));
  const inicio = Math.min(...escalones.map(pieza => pieza.position.x - pieza.scale.x / 2));
  const huella = (cara - inicio) / escalones.length;
  escalones.forEach((escalon, i) => {
    const y = altura * (i + 1) / escalones.length;
    const x = inicio + (i + .5) * huella;
    escalon.position.set(x, y / 2, zEntrada);
    escalon.scale.set(huella, y, claro);
    box(volumen, 'P4_borde_de_peldaño_de_loseta', x - huella / 2 + .019, y + .004,
      zEntrada, .037, .013, claro, '#ba8370');
    for (const junta of [-.25, 0, .25]) {
      box(volumen, 'P4_junta_de_peldaño', x, y + .007, zEntrada + claro * junta,
        huella - .042, .010, .012, '#906b58');
    }
  });

  const anchoCancel = claro - .22;
  const altoCancel = nivel - altura - .16;
  paño('P4_cancel_del_patio', altura + altoCancel / 2, zEntrada, altoCancel, anchoCancel, vidrio, .165);
  for (let i = 0; i <= 6; i++) {
    const montante = zEntrada + (i / 6 - .5) * anchoCancel;
    paño('P4_montante_del_cancel', altura + altoCancel / 2, montante, altoCancel, .073, aluminio, .207);
  }
  for (const y of [altura + .036, altura + altoCancel * .76, altura + altoCancel - .033]) {
    paño('P4_travesaño_del_cancel', y, zEntrada, .073, anchoCancel, aluminio, .208);
  }
  for (const lado of [-1, 1]) {
    paño('P4_tirador_del_cancel', altura + 1.04, zEntrada + lado * .19, .24, .046, aluminio, .259);
    paño('P4_jamba_del_cancel', altura + altoCancel / 2, zEntrada + lado * (anchoCancel / 2 + .10),
      altoCancel + .16, .18, concreto, .181);
  }
}


function detallarPatiosDeTalleres({THREE, data, buildingGroups, box, material, X, Z}) {
  const edificio = data.buildings.find(b => b.id === 'P4');
  const naveP3 = data.buildings.find(b => b.id === 'P3');
  const volumen = buildingGroups.get('P4')?.getObjectByName('P4_volumen_0');
  const cubierta = volumen?.getObjectByName('P4_patio_cubierto_estudio');
  if (!edificio || !cubierta || volumen.getObjectByName('P4_pavimento_de_estudio')) return;
  detallarFachadaDeEstudioP4(volumen, cubierta, edificio, box, data.storeyHeight);

  // La loseta terracota sigue el espacio bajo la cubierta y las franjas grises de 0016 y 0021.
  const {x, z} = cubierta.position;
  const ancho = cubierta.scale.x;
  const fondo = cubierta.scale.z;
  box(volumen, 'P4_pavimento_de_estudio', x, .210, z, ancho, .075, fondo, '#b48166');
  for (const lateral of [-1, 1]) {
    box(volumen, 'P4_cenefa_gris_del_patio', x + lateral * (ancho / 2 - .21), .251, z, .40, .010, fondo, '#96968c');
  }
  for (let distancia = -fondo / 2 + .96; distancia < fondo / 2 - .2; distancia += .96) {
    box(volumen, 'P4_junta_de_loseta', x, .25, z + distancia, ancho - .80, .008, .023, '#926b56');
  }
  for (const eje of [-1.8, -.90, 0, .90, 1.80]) {
    box(volumen, 'P4_junta_de_loseta', x + eje, .25, z, .023, .008, fondo, '#926b56');
  }
  const disco = volumen.getObjectByName('P4_piso_circular_patio');
  if (disco) {
    const radio = disco.geometry.parameters.radiusTop;
    const cenefa = new THREE.Mesh(new THREE.RingGeometry(radio - .14, radio + .09, 48), material('#999489'));
    cenefa.name = 'P4_cenefa_circular_del_patio';
    cenefa.rotation.x = -Math.PI / 2;
    cenefa.position.set(x, .259, z);
    volumen.add(cenefa);
  }

  // 0015, 0022 y 0027 sitúan el pavimento de trabajo entre la fachada de P4 y la nave de P3.
  if (!edificio?.rects[1] || !naveP3?.rects[0]) return;
  const zInicio = Z(edificio.rects[1][3] + 2);
  const zFin = Z(edificio.rects[0][3] - 4);
  const xInicio = X(edificio.rects[0][2]);
  const xFin = X(naveP3.rects[0][0]) + (naveP3.offsetX || 0) - (edificio.offsetX || 0);
  const disponible = xFin - xInicio;
  if (disponible < 5 || zFin <= zInicio) return;
  const patios = new THREE.Group();
  patios.name = 'Patio_de_trabajo_entre_P4_y_P3';
  patios.userData = {approximate: true, reference: 'Esri 2025; corpus AZC 0015, 0022 y 0027'};
  buildingGroups.get('P4').add(patios);
  const centro = (zInicio + zFin) / 2;
  const largo = zFin - zInicio;
  const pasoP4 = Math.min(3.1, disponible * .35);
  const pasoP3 = Math.min(3.35, disponible * .38);
  const medio = disponible - pasoP4 - pasoP3;
  box(patios, 'Faja_de_concreto_junto_a_P4', xInicio + pasoP4 / 2, .214, centro, pasoP4, .13, largo, '#b4b0a2');
  box(patios, 'Adoquín_del_paso_P3', xFin - pasoP3 / 2, .214, centro, pasoP3, .13, largo, '#ad9e84');
  box(patios, 'Franja_verde_entre_talleres', xInicio + pasoP4 + medio / 2, .194, centro, medio, .11, largo * .76, '#777d56');
  for (let posZ = zInicio + 1.65; posZ < zFin; posZ += 1.65) {
    box(patios, 'Junta_del_adoquín', xFin - pasoP3 / 2, .283, posZ, pasoP3, .008, .025, '#897e6b');
  }
}

// Foto 0003. La circulación mira al patio de S y desemboca en la llegada exterior ya trazada.
export function construirGaleriaSTalleres({THREE, part, w, d, h, box, data}) {
  const grupo = new THREE.Group();
  grupo.name = 'S_galeria_abierta_de_talleres';
  grupo.userData = {approximate: true, reference: 'Corpus AZC 0003; Esri 2025', llegadaExterior: 'n104'};
  part.add(grupo);
  const nivel = data.storeyHeight;
  const frente = -d / 2;
  const anchoGaleria = Math.min(3.15, d * .34);
  const fondoGaleria = frente + anchoGaleria;
  const gris = '#bdbcb3', muro = '#d1cdc0', rojo = '#a84233';

  box(grupo, 'S_cuerpo_retranqueado', 0, nivel / 2, anchoGaleria / 2, w, nivel, d - anchoGaleria, muro);
  box(grupo, 'S_planta_alta_sobre_galeria', 0, (nivel + h) / 2, 0, w, h - nivel, d, gris);
  box(grupo, 'S_losa_de_azotea', 0, h + .17, 0, w, .34, d, '#898b72');
  box(grupo, 'S_piso_corrido_de_loseta', 0, .18, frente + anchoGaleria / 2, w, .25, anchoGaleria, '#c6c2b8');
  box(grupo, 'S_trabe_de_borde', 0, nivel - .16, frente + .29, w, .36, .46, '#aeada4');
  const claros = 9;
  const espacio = (w - 1.10) / claros;
  for (let i = 0; i <= claros; i++) {
    const x = -w / 2 + .55 + i * espacio;
    box(grupo, 'S_pilar_de_concreto', x, (nivel + .30) / 2, frente + .29, .48, nivel - .30, .47, gris);
    box(grupo, 'S_junta_de_loseta', x, .31, frente + anchoGaleria / 2, .024, .007, anchoGaleria, '#a6a398');
    if (i === claros) continue;
    box(grupo, 'S_plafon_rojo_pasillo', x + espacio / 2, nivel - .34, frente + anchoGaleria / 2,
      .23, .46, anchoGaleria - .42, rojo);
    box(grupo, 'S_luminaria_lineal', x + espacio / 2, nivel - .45, frente + anchoGaleria * .40,
      1.52, .064, .12, '#e6e4d9');
    box(grupo, 'S_ventana_de_planta_alta', x + espacio / 2, nivel + 1.86, frente + .021,
      espacio * .57, .83, .066, '#687a75');
  }
  for (const retiro of [.15, .24, .34, .43]) {
    box(grupo, 'S_conducto_bajo_plafon', 0, nivel - .16, fondoGaleria - retiro, w - 1.40, .042, .042, '#92968d');
  }
  box(grupo, 'S_gabinete_hidrante_rojo', -w / 2 + .55 + espacio * 2, 1.40, frente + .54, .38, .70, .19, rojo);
  return grupo;
}

// Dos niveles documentados por Energía. La cara del peine conserva la llegada n106.
// Videos de O-105 (1:22–1:28) y SALAIRE (1:26) confirman cancelería, escalera y marquesina.
export function construirEdificioO({THREE, part, b, w, d, h, box, data}) {
  const edificio = new THREE.Group();
  edificio.name = 'O_laboratorios_ambiental_y_quimica';
  edificio.userData = {floors: b.floors, approximate: true, entrance: 'n106'};
  part.add(edificio);

  const frente = -d / 2;
  const accesoX = -w * 1.5 / 65;
  const receso = .44;
  const gris = '#b9bdbb', claro = '#dad8ce', vidrio = '#5f7274', rojo = '#a93432';
  const entrada = 4.5;
  box(edificio, 'O_cuerpo_de_laboratorios', 0, h / 2, receso / 2, w, h, d - receso, gris);
  for (const [izquierda, derecha] of [[-w / 2, accesoX - entrada / 2], [accesoX + entrada / 2, w / 2]]) {
    box(edificio, 'O_pano_concreto_acceso', (izquierda + derecha) / 2, h / 2, frente + receso / 2,
      derecha - izquierda, h, receso, gris);
  }
  box(edificio, 'O_dintel_de_entrada', accesoX, (2.59 + h) / 2, frente + receso / 2, entrada, h - 2.59, receso, gris);
  box(edificio, 'O_cancel_acristalado', accesoX, 1.45, frente + .14, entrada - .22, 2.30, .08, vidrio);
  for (const x of [-2.07, -1.27, 0, 1.27, 2.07]) {
    box(edificio, 'O_montante_cancel', accesoX + x, 1.45, frente + .08, .06, 2.34, .07, claro);
  }
  for (const y of [.28, 2.22, 2.61]) box(edificio, 'O_travesano_cancel', accesoX, y, frente + .08, 4.20, .066, .07, claro);
  for (const x of [-.15, .15]) box(edificio, 'O_tirador_de_acceso', accesoX + x, 1.16, frente + .035, .04, .28, .04, claro);
  box(edificio, 'O_rectangulo_de_senalizacion', accesoX + 2.65, 1.92, frente - .02, .62, .4, .06, rojo);

  const altura = data.storeyHeight;
  for (let piso = 0; piso < b.floors; piso++) {
    const y = piso * altura + 1.99;
    for (const lado of [-1, 1]) {
      const z = lado * d / 2;
      for (const x of [-w * .34, w * .34]) {
        box(edificio, 'O_ventanal_horizontal', x, y, z, w * .23, .92, .09, vidrio);
        for (const montante of [-.105, -.05, 0, .05, .105]) {
          box(edificio, 'O_montante_horizontal', x + w * montante, y, z + lado * .05, .055, .95, .04, claro);
        }
      }
    }
  }
  box(edificio, 'O_losa_de_azotea', 0, h + .11, 0, w, .22, d, '#c3c1b4');
  for (const lado of [-1, 1]) box(edificio, 'O_pretil', 0, h + .27, lado * (d / 2 - .11), w, .29, .22, '#a8a9a0');

  const marquesina = new THREE.Group();
  marquesina.name = 'O_marquesina_tubular_de_llegada';
  marquesina.position.set(accesoX, 0, frente);
  edificio.add(marquesina);

  const largo = 7.6, medio = 2.30, arranque = 2.93, flecha = .48;
  const frenteArco = new THREE.Shape();
  frenteArco.moveTo(-medio, arranque);
  frenteArco.quadraticCurveTo(0, arranque + 2 * flecha, medio, arranque);
  frenteArco.lineTo(medio, arranque + .075);
  frenteArco.quadraticCurveTo(0, arranque + 2 * flecha + .075, -medio, arranque + .075);
  frenteArco.closePath();
  const panel = new THREE.Mesh(
    new THREE.ExtrudeGeometry(frenteArco, {depth: largo, curveSegments: 18, bevelEnabled: false}),
    new THREE.MeshStandardMaterial({color: '#e8dfd0', transparent: true, opacity: .63, depthWrite: false, side: THREE.DoubleSide, roughness: .58})
  );
  panel.name = 'O_panel_traslucido_de_cubierta';
  panel.userData.disposeMaterial = true;
  panel.position.z = -largo;
  marquesina.add(panel);

  function tramo(nombre, a, c) {
    const inicio = new THREE.Vector3(...a);
    const delta = new THREE.Vector3(...c).sub(inicio);
    const largo = delta.length();
    const p = inicio.addScaledVector(delta, .5);
    const pieza = box(marquesina, nombre, p.x, p.y, p.z, .085, largo, .085, rojo);
    pieza.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.divideScalar(largo));
  }
  function alturaArco(x) { return arranque + flecha * (1 - (x / medio) ** 2); }

  for (const distancia of [.20, 3.76, largo - .17]) {
    const z = -distancia;
    for (const lateral of [-medio, medio]) box(marquesina, 'O_columna_roja_marquesina', lateral, arranque / 2, z, .13, arranque, .13, rojo);
    for (let i = 0; i < 8; i++) {
      const x = -medio + 2 * medio * i / 8;
      const siguiente = x + 2 * medio / 8;
      tramo('O_nervio_curvo_marquesina', [x, alturaArco(x), z], [siguiente, alturaArco(siguiente), z]);
    }
  }
  for (const x of [-medio, -medio / 2, 0, medio / 2, medio]) {
    box(marquesina, 'O_larguero_marquesina', x, alturaArco(x), -largo / 2, .065, .065, largo, rojo);
  }
  box(marquesina, 'O_piso_loseta_entrada', 0, .15, -largo / 2, 4.60, .16, largo, '#ac9c8e');
  for (const x of [-1.54, -.77, 0, .77, 1.54]) {
    box(marquesina, 'O_junta_longitudinal_loseta', x, .232, -largo / 2, .018, .007, largo, '#776c63');
  }
  for (let i = 1; i < 10; i++) {
    box(marquesina, 'O_junta_transversal_loseta', 0, .233, -largo * i / 10, 4.60, .007, .018, '#776c63');
  }
  return edificio;
}
