// Detalles de los corredores docentes y la zona deportiva observados en el corpus AZC.
export function detallarCuartaPasadaOriente({THREE, world, buildingGroups, box, material}) {
  completarCerchasW(THREE, buildingGroups.get('W')?.getObjectByName('W_AZC_laboratorios_y_portico'), box);
  detallarTorreP1(THREE, buildingGroups.get('P1')?.getObjectByName('P1_volumen_0'), box);
  detallarPersianaP2(THREE, buildingGroups.get('P2')?.getObjectByName('P2_AZC_talleres_2P'), box);
  fijarTablerosMulticanchas(THREE, world.getObjectByName('Canchas_deportivas_AZC'), box);
  detallarGradaF7(THREE, world.getObjectByName('Gradas_deportivas_Q'), box, material);
}

function detalle(THREE, padre, nombre, reference) {
  const grupo = new THREE.Group();
  grupo.name = nombre;
  grupo.userData = {approximate: true, reference};
  padre.add(grupo);
  return grupo;
}

function perfil(THREE, grupo, box, nombre, desde, hasta, grosor, color) {
  const inicio = new THREE.Vector3(...desde);
  const final = new THREE.Vector3(...hasta);
  const direccion = final.sub(inicio);
  const largo = direccion.length();
  const centro = inicio.addScaledVector(direccion, .5);
  const pieza = box(grupo, nombre, centro.x, centro.y, centro.z, grosor, largo, grosor, color);
  pieza.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), direccion.divideScalar(largo));
}

// La cámara hacia arriba muestra almas trianguladas rojas y la cubierta nervada entre ellas.
function completarCerchasW(THREE, portico, box) {
  const cordones = portico?.children.filter(pieza => pieza.name === 'W_cercha_roja_portico');
  const vigas = portico?.children.filter(pieza => pieza.name === 'W_viga_roja_portico');
  if (!cordones?.length || !vigas?.length) return;
  const grupo = detalle(THREE, portico, 'W_cubierta_nervada_sobre_cerchas_rojas', 'Corpus AZC 0102 y 0103');
  const tonos = ['#a5363a', '#8f3035', '#9b3738'];
  for (let i = 0; i < cordones.length; i += 2) {
    const [arriba, abajo] = cordones.slice(i, i + 2);
    const {x,z} = arriba.position;
    const ancho = abajo.scale.x - .1;
    const yAlto = arriba.position.y, yBajo = abajo.position.y;
    const claros = 10, paso = ancho / claros;
    const xBorde = x - ancho / 2;
    arriba.scale.y = .20;
    abajo.scale.y = .13;
    for (let n = 0; n < claros; n++) {
      const inicio = xBorde + paso * n, fin = inicio + paso;
      const a = n % 2 === 0 ? yAlto : yBajo;
      const b = n % 2 === 0 ? yBajo : yAlto;
      perfil(THREE, grupo, box, 'W_diagonal_de_cercha_alta', [inicio,a,z], [fin,b,z], .083, tonos[n % 3]);
    }
    for (const borde of [xBorde, xBorde + ancho]) {
      perfil(THREE, grupo, box, 'W_placa_vertical_de_cercha', [borde,yAlto,z], [borde,yBajo,z], .113, tonos[1]);
    }
    const siguiente = cordones[i + 2];
    if (!siguiente) continue;
    const profundidad = siguiente.position.z - z;
    const centroZ = z + profundidad / 2;
    for (const lado of [-1, 1]) {
      const anchoPaño = (arriba.scale.x - .45) * .48;
      const xPaño = x + lado * (anchoPaño / 2 + .07);
      const color = i % 4 ? '#c7c7be' : '#b9bcb6';
      box(grupo, 'W_lamina_clara_entre_cerchas', xPaño, yAlto + .14, centroZ,
        anchoPaño, .055, profundidad - .04, color);
      for (let costilla = 1; costilla <= 14; costilla++) {
        const xCostilla = xPaño + (costilla / 15 - .5) * anchoPaño;
        box(grupo, 'W_nervio_inferior_de_lamina', xCostilla, yAlto + .098, centroZ,
          .024, .038, profundidad - .07, '#a1a49b');
      }
    }
  }

  // Las vigas longitudinales del pórtico son también cerchas abiertas.
  for (const viga of vigas) {
    const {x,y,z} = viga.position;
    const fondo = viga.scale.z;
    const pasos = Math.ceil(fondo / .89), paso = fondo / pasos;
    const inferior = y - .36, superior = y + .41;
    viga.position.y = inferior;
    viga.scale.y = .13;
    box(grupo, 'W_cordon_longitudinal_superior', x, superior, z, .23, .165, fondo, tonos[0]);
    for (let i = 0; i < pasos; i++) {
      const a = z - fondo / 2 + i * paso;
      const [de,hacia] = i % 2 ? [superior,inferior] : [inferior,superior];
      perfil(THREE, grupo, box, 'W_alma_triangular_longitudinal',
        [x,de,a],[x,hacia,a + paso], .077, tonos[i % 3]);
    }
  }
}

// Dos luminarias adosadas se distinguen sobre el azulejo y bajo el paso de concreto.
function detallarTorreP1(THREE, volumen, box) {
  const torre = volumen?.getObjectByName('P1_torre_azulejo_azul');
  const alero = volumen?.getObjectByName('P1_marquesina_roja');
  if (!torre || !alero) return;
  const grupo = detalle(THREE, volumen, 'P1_luminarias_adheridas_a_la_torre', 'Corpus AZC 0002 y 0009');
  const {x, z} = torre.position;
  const y = torre.position.y + torre.scale.y * .31;
  const ancho = torre.scale.x, fondo = torre.scale.z;
  for (const [ladoX,ladoZ] of [[0,1],[-1,0]]) {
    const giro = Math.atan2(ladoX,ladoZ);
    const lampara = new THREE.Group();
    lampara.position.set(x + ladoX * (ancho / 2 + .014), y - Math.abs(ladoX) * .57, z + ladoZ * (fondo / 2 + .014));
    lampara.rotation.y = giro;
    grupo.add(lampara);
    box(lampara, 'P1_base_luminaria_de_fachada',0,0,.039,.23,.30,.078,'#464f4a');
    box(lampara, 'P1_brazo_corto_de_luminaria',0,.064,.214,.102,.106,.31,'#676f68');
    const foco = box(lampara, 'P1_carcasa_inclinada_de_luz',0,.008,.325,.26,.14,.26,'#545a52');
    foco.rotation.x = .28;
    box(lampara, 'P1_difusor_de_luminaria',0,-.070,.332,.18,.029,.190,'#cfccaa').rotation.x = .28;
  }
  const frente = z + fondo / 2 + .013;
  for (const dy of [-.24,.10]) {
    box(grupo, 'P1_placa_visible_en_azulejo', x + ancho * .37, y + dy, frente,
      .074,.065,.022,'#c0c4bb');
  }

  // Cartelas rojas bajo los largueros de la marquesina junto a la torre.
  const {x:centro, y:nivel, z:centroZ} = alero.position;
  const anchoAlero = alero.scale.x;
  for (const pieza of volumen.children.filter(malla => malla.name === 'P1_travesaño_marquesina')) {
    const posZ = pieza.position.z;
    if (Math.abs(posZ - centroZ) > .34 * alero.scale.z) continue;
    perfil(THREE, grupo, box, 'P1_cartela_inclinada_de_marquesina',
      [centro - anchoAlero * .47, nivel - .48, posZ],
      [centro + anchoAlero * .16, nivel - .07, posZ], .079, '#973830');
  }
}

// La persiana exterior de 2P tiene dos hojas, centros de cierre y perfil saliente.
function detallarPersianaP2(THREE, volumen, box) {
  const puerta = volumen?.getObjectByName('P2_porton_persiana_roja');
  if (!puerta) return;
  const grupo = detalle(THREE, volumen, 'P2_persiana_de_dos_hojas_del_anexo', 'Corpus AZC 0065 y 0088');
  const {x,y,z} = puerta.position;
  const {x:ancho,y:alto,z:fondo} = puerta.scale;
  const frente = z + fondo / 2, rojo = '#a23e37', sombra = '#763431';
  for (const lado of [-1, 1]) {
    const xHoja = x + lado * ancho / 4;
    const filas = Math.round(alto / .098);
    const paso = (alto - .13) / filas;
    const y0 = y - alto / 2 + .065;
    for (let i = 0; i < filas; i++) {
      const hoja = box(grupo, 'P2_lama_horizontal_de_persiana', xHoja, y0 + (i + .5) * paso, frente + .026,
        ancho / 2 - .13, paso * .58, .044, i % 5 ? rojo : '#aa4a43');
      hoja.rotation.x = -.24;
    }
    box(grupo, 'P2_perfil_central_persiana', x + lado * .038, y, frente + .043, .059, alto, .053, rojo);
    box(grupo, 'P2_jamba_externa_persiana', x + lado * (ancho / 2 - .020),
      y, frente + .041, .071, alto + .042, .061, sombra);
    box(grupo, 'P2_tirador_cierre_de_persiana', x + lado * .147, y + .045, frente + .085, .098, .046, .045, '#6e4a3c');
  }
  for (const fraccion of [-.49,.49]) {
    box(grupo, 'P2_bastidor_horizontal_de_persiana', x, y + fraccion * alto, frente + .035,
      ancho + .04,.071,.066,sombra);
  }
}

// La foto de perfil muestra dos montantes prolongados hacia los cuadrados de soporte del tablero.
function fijarTablerosMulticanchas(THREE, canchas, box) {
  const tableros = canchas?.children.filter(pieza => pieza.name === 'Tablero_basquet_cancha');
  if (!tableros?.length) return;
  const grupo = detalle(THREE, canchas, 'Multicanchas_herrajes_y_tirantes_de_tableros', 'Corpus AZC 0096');
  const aros = canchas.children.filter(pieza => pieza.name === 'Aro_rojo_canasta');
  const blanco = '#dbe1d9';
  for (const tablero of tableros) {
    const {x,y,z} = tablero.position;
    const aro = aros.find(pieza => Math.abs(pieza.position.x - x) < .04 && Math.abs(pieza.position.z - z) < .42);
    if (!aro) continue;
    const haciaJuego = Math.sign(aro.position.z - z);
    const zPosterior = z - haciaJuego * .045, zAnterior = z + haciaJuego * .061;
    for (const lado of [-1,1]) {
      const extremo = x + lado * .61;
      perfil(THREE, grupo, box, 'Tirante_superior_de_tablero', [extremo,3.30,z-haciaJuego*.84],
        [extremo,y+.34,zPosterior], .056, blanco);
      perfil(THREE, grupo, box, 'Perfil_trasero_vertical_de_tablero', [extremo,y-.37,zPosterior],
        [extremo,y+.36,zPosterior], .026, blanco);
      box(grupo, 'Frente_pernado_de_aro', x + lado * .093, aro.position.y, zAnterior,
        .036,.077,.027,'#696e61');
    }
    perfil(THREE, grupo, box, 'Union_de_aro_al_tablero', [x,aro.position.y,zAnterior],
      [x,aro.position.y,aro.position.z - haciaJuego * .16], .040, '#913c30');
  }
}

// Apoyos de las gradas y luminaria fuera de la estructura, como en 0072 y 0073.
function detallarGradaF7(THREE, grada, box, material) {
  const columnas = grada?.children.filter(pieza => pieza.name === 'Columna_gradas_canchas');
  if (!columnas?.length) return;
  const grupo = detalle(THREE, grada, 'F7_placas_de_apoyo_y_luminaria_de_gradas', 'Corpus AZC 0072 y 0073; posición de lámpara aproximada');
  for (const columna of columnas) {
    const {x,z} = columna.position;
    box(grupo, 'F7_dado_bajo_columna_de_grada', x,.268,z,.37,.080,.37,'#a9a99c');
    box(grupo, 'F7_placa_de_anclaje_grada', x,.316,z,.22,.024,.22,'#656f69');
    for (const dx of [-.075,.075]) for (const dz of [-.074,.074]) {
      box(grupo, 'F7_perno_de_columna', x+dx,.336,z+dz,.022,.024,.021,'#aaaeb0');
    }
  }
  for (const z of [-7.18,7.18]) {
    perfil(THREE, grupo, box, 'F7_borde_inclinado_del_alero', [-.93,4.81,z], [2.56,5.105,z], .077, '#8e9997');
  }
  const x = 1.18, z = 8.65, altura = 8.9;
  const poste = new THREE.Mesh(new THREE.CylinderGeometry(.055,.095,altura,10),material('#875d48'));
  poste.name = 'F7_poste_de_luz_junto_a_la_grada';
  poste.position.set(x, altura / 2 + .11, z);
  grupo.add(poste);
  box(grupo, 'F7_base_de_mastil',x,.19,z,.37,.13,.37,'#a5a395');
  box(grupo, 'F7_cabezal_cruceta_de_luz',x,altura+.07,z,.61,.077,.68,'#5e6462');
  for (const ladoX of [-1,1]) for (const ladoZ of [-1,1]) {
    const px = x + ladoX * .24, pz = z + ladoZ * .25;
    const foco = box(grupo, 'F7_proyector_cuadrado_en_cruceta',px,altura+.14,pz,.26,.16,.23,'#535a61');
    foco.rotation.z = ladoX * .26;
    const cristal = box(grupo, 'F7_difusor_de_proyector',px+ladoX*.026,altura+.077,pz,.198,.018,.173,'#e0ddc6');
    cristal.rotation.z = foco.rotation.z;
  }
}

export function detallarCortesCuartaPasadaOriente(id, THREE, modelo) {
  if (id !== 'cyad') return modelo;
  const grupo = detalle(THREE, modelo.group, 'L_casilleros_y_gabinete_del_corredor', 'Corpus AZC 0084 y 0090');
  const geometria = new THREE.BoxGeometry();
  const materiales = new Map();
  function caja(nombre,color,x,y,z,ancho,alto,fondo) {
    if (!materiales.has(color)) {
      materiales.set(color, new THREE.MeshStandardMaterial({color,roughness:.73}));
    }
    const malla = new THREE.Mesh(geometria,materiales.get(color));
    malla.name = nombre;
    malla.position.set(x,y,z);
    malla.scale.set(ancho,alto,fondo);
    malla.receiveShadow = true;
    grupo.add(malla);
  }
  const carcasa = '#21564c', junta = '#284b42', tirador = '#363d37';
  const tonos = ['#5e8c57','#6c9a59','#467745','#7b9a53','#557f51'];
  const inicio = -3.20, paso = .58, total = 13 * paso;
  // Revestimiento del frente que mira al pasillo, sobre la huella previa de los casilleros.
  caja('L_costado_del_banco_de_casilleros',carcasa,-6.24,1.10,inicio+total/2,.683,2.19,total);
  for (let fila = 0; fila < 4; fila++) {
    const y = .320 + fila * .503;
    for (let col = 0; col < 13; col++) {
      const z = inicio + (col + .5) * paso;
      caja('L_hoja_de_casillero_verde',tonos[(col*3+fila*7+Math.floor(col/3))%tonos.length],
        -6.592,y,z,.032,.472,.548);
      colocarHerrajes(caja, y, z, junta, tirador);
    }
  }
  caja('L_canal_superior_del_casillero',carcasa,-6.586,2.132,inicio+total/2,.046,.068,total);
  caja('L_zocalo_del_casillero',junta,-6.588,.058,inicio+total/2,.050,.111,total);
  const zGabinete = -.95;
  caja('L_pilastra_grafito_del_gabinete','#5a5b55',-9.42,1.39,zGabinete,.48,2.78,.21);
  caja('L_gabinete_rojo_adosado','#9d362f',-9.07,1.35,zGabinete,.24,.62,.40);
  caja('L_vidrio_del_gabinete','#a66757',-8.939,1.37,zGabinete,.021,.45,.29);
  caja('L_asidero_del_gabinete','#5d5248',-8.915,1.34,zGabinete-.135,.026,.077,.026);
  caja('L_placa_roja_sobre_gabinete','#a43e36',-9.10,2.73,zGabinete,.06,.24,.23);
  caja('L_simbolo_claro_de_placa','#ede5cc',-9.063,2.73,zGabinete,.015,.120,.055);
  return modelo;
}

function colocarHerrajes(caja, y, z, junta, tirador) {
  caja('L_bisagra_superior_del_casillero',junta,-6.613,y+.183,z-.237,.027,.057,.028);
  caja('L_bisagra_inferior_del_casillero',junta,-6.613,y-.181,z-.237,.027,.057,.028);
  caja('L_cerradura_del_casillero',tirador,-6.623,y+.056,z+.183,.045,.071,.038);
  caja('L_tirador_del_casillero',tirador,-6.626,y+.009,z+.183,.049,.027,.096);
}
