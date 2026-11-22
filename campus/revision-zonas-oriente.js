// Detalles esquemáticos de las zonas 14–18. Los anclajes siguen sus volúmenes editables.
export function modelarZonasOriente({THREE, data, buildingGroups, box, material}) {
  function grupo(padre, nombre, referencia) {
    const detalle = new THREE.Group();
    detalle.name = nombre;
    detalle.userData = {approximate: true, reference: referencia};
    padre.add(detalle);
    return detalle;
  }

  function barra(padre, nombre, a, b, ancho, fondo, color) {
    const inicio = new THREE.Vector3(...a);
    const delta = new THREE.Vector3(...b).sub(inicio);
    const longitud = delta.length();
    const centro = inicio.addScaledVector(delta, .5);
    const pieza = box(padre, nombre, centro.x, centro.y, centro.z, ancho, longitud, fondo, color);
    pieza.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.divideScalar(longitud));
    return pieza;
  }

  // Los montantes y tendidos fijos se exportan por material para el visor móvil.
  function agruparAcabados(detalle) {
    const lotes = new Map();
    const vertice = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const matrizNormal = new THREE.Matrix3();
    for (const malla of [...detalle.children]) {
      const clave = malla.name + '/' + malla.material.id;
      if (!lotes.has(clave)) lotes.set(clave, {
        nombre: malla.name, material: malla.material, proyectaSombra: malla.castShadow,
        vertices: [], normales: [], indices: [],
      });
      const lote = lotes.get(clave);
      const {position, normal: atributoNormal} = malla.geometry.attributes;
      const desplazamiento = lote.vertices.length / 3;
      malla.updateMatrix();
      matrizNormal.getNormalMatrix(malla.matrix);
      for (let i = 0; i < position.count; i++) {
        vertice.fromBufferAttribute(position, i).applyMatrix4(malla.matrix);
        normal.fromBufferAttribute(atributoNormal, i).applyNormalMatrix(matrizNormal);
        lote.vertices.push(vertice.x, vertice.y, vertice.z);
        lote.normales.push(normal.x, normal.y, normal.z);
      }
      for (const indice of malla.geometry.index.array) lote.indices.push(indice + desplazamiento);
      malla.removeFromParent();
    }
    for (const lote of lotes.values()) {
      const geometria = new THREE.BufferGeometry();
      geometria.setAttribute('position', new THREE.Float32BufferAttribute(lote.vertices, 3));
      geometria.setAttribute('normal', new THREE.Float32BufferAttribute(lote.normales, 3));
      geometria.setIndex(lote.indices);
      const malla = new THREE.Mesh(geometria, lote.material);
      malla.name = lote.nombre;
      malla.castShadow = lote.proyectaSombra;
      malla.receiveShadow = true;
      detalle.add(malla);
    }
  }

  // 14. La toma al pie de la fachada distingue los huecos y el cancel reticular sin salida.
  const t = buildingGroups.get('T')?.getObjectByName('T_AZC_fachada_y_escalera');
  if (t) {
    const detalle = grupo(t, 'Revision_14_T_celosias_y_cancel', 'Corpus AZC: imagen_0052, imagen_0053, imagen_0056 e imagen_0057');
    const ladrillos = ['#a66b5b', '#9b6250', '#b07966', '#995748'];
    for (let piso = 0; piso < 3; piso++) {
      const pano = t.getObjectByName('T_celosia_ladrillo_posterior_' + piso);
      if (!pano) continue;
      const {x, y, z} = pano.position;
      const ancho = pano.scale.x;
      const alto = pano.scale.y;
      const cara = z + pano.scale.z / 2;
      pano.material = material('#563d36');
      const columnas = Math.round(ancho / .27);
      const paso = ancho / columnas;
      for (let i = 0; i < columnas; i++) {
        box(detalle, 'T_montante_de_tabique', x - ancho / 2 + (i + .5) * paso, y,
          cara + .035, paso * .66, alto - .05, .10, ladrillos[(3 * i + piso) % ladrillos.length]);
      }
      for (const nivel of [-.48, -.25, 0, .25, .48]) {
        box(detalle, 'T_tendido_de_tabique', x, y + nivel * alto, cara + .045,
          ancho, .052, .108, '#9b6656');
      }
    }
    const vidrio = t.getObjectByName('T_remetimiento_acristalado_sur');
    if (vidrio) {
      const {x, y, z} = vidrio.position;
      const alto = vidrio.scale.y, ancho = vidrio.scale.x;
      const cara = Math.max(t.getObjectByName('T_azotea').scale.z / 2, z + vidrio.scale.z / 2);
      const columnas = 5, filas = 9;
      for (let i = 0; i < columnas; i++) for (let j = 0; j < filas; j++) {
        const px = x + ((i + .5) / columnas - .5) * ancho;
        const py = y + ((j + .5) / filas - .5) * alto;
        box(detalle, 'T_celda_de_vidrio_del_remetimiento', px, py, cara + .016,
          ancho / columnas - .07, alto / filas - .058, .034,
          ['#3e4c4b', '#526663', '#646d62', '#455a59'][(i + 3 * j) % 4]);
      }
      box(detalle, 'T_jardinera_baja_del_cancel', x, y - alto / 2 + .28, cara + .052,
        ancho + .09, .56, .11, '#88644f');
    }
    agruparAcabados(detalle);
  }

  // 15. El levantamiento de CyAD documenta luz cenital en sus dos patios. Se distinguen
  // los marcos de cada lucernario dentro del plano de cubierta existente.
  const l = buildingGroups.get('L')?.getObjectByName('L_cubierta_diente_de_sierra');
  if (l) {
    const detalle = grupo(l, 'Revision_15_CyAD_vidrios_y_travesanos',
      'UNAM, levantamiento CyAD pp. 68–69; corpus internet_000001 (Escaleras CyAD, Commons)');
    for (const [indice, vidrio] of l.children.filter(nodo => nodo.name === 'L_lucernario_vertical').entries()) {
      const {x, y, z} = vidrio.position;
      const {x: ancho, y: alto, z: espesor} = vidrio.scale;
      vidrio.material = material(indice % 2 === 0 ? '#8eaaa4' : '#809992');
      const cara = z + espesor / 2;
      const modulos = Math.round(ancho / 2.7);
      for (let i = 0; i <= modulos; i++) {
        box(detalle, 'L_parteluz_lucernario', x + (i / modulos - .5) * ancho,
          y, cara + .014, .065, alto + .064, .039, '#675f59');
      }
      for (const lado of [-1, 1]) {
        box(detalle, 'L_marco_horizontal_del_lucernario', x, y + lado * (alto / 2),
          cara + .022, ancho + .02, .084, .052, '#7c6f62');
      }
    }
    agruparAcabados(detalle);
  }

  // 16. Dos tramos por nivel. El acabado lateral y el descanso curvo de concreto
  // quedan visibles desde el pórtico tal como en 0102 y 0103.
  const w = buildingGroups.get('W')?.getObjectByName('W_AZC_laboratorios_y_portico');
  const descanso = w?.getObjectByName('W_escalera_descanso_curvo_1');
  const rampa = w?.getObjectByName('W_rampa_escalera_1');
  if (descanso && rampa) {
    const detalle = grupo(w, 'Revision_16_W_escalera_de_dos_tramos', 'Corpus AZC: imagen_0102 e imagen_0103');
    const x = descanso.position.x, z = descanso.position.z;
    const piso = data.storeyHeight;
    const ancho = 1.38, largo = 4.1, numero = 9;
    const frente = z + .92;
    const arranque = frente + largo;
    const concreto = '#b4b5ae', cuerpo = '#c2c1b8', rojo = '#8b332e';
    for (const pieza of [...w.children]) {
      if (/^W_(?:escalera_descanso_curvo|barandal_rojo_escalera|rampa_escalera)_\d$/.test(pieza.name) ||
          pieza.name === 'W_barandal_rampa_escalera') pieza.removeFromParent();
    }

    function tramo(centroX, y, desde, hacia) {
      const subida = piso / 2;
      const profundidad = Math.abs(hacia - desde) / numero;
      const desplazamiento = hacia - desde;
      const huella = .17;
      for (let i = 0; i < numero; i++) {
        const zPeldaño = desde + desplazamiento * (i + .5) / numero;
        box(detalle, 'W_peldaño_de_concreto', centroX, y + subida * (i + 1) / numero - huella / 2,
          zPeldaño, ancho, huella, profundidad + .004, i % 3 === 0 ? concreto : cuerpo);
      }
      for (const lado of [-1, 1]) {
        const borde = centroX + lado * ancho / 2;
        barra(detalle, 'W_zanca_de_concreto', [borde, y - .13, desde],
          [borde, y + subida - .13, hacia], .17, .31, concreto);
        barra(detalle, 'W_pasamanos_rojo', [borde, y + .89, desde],
          [borde, y + subida + .89, hacia], .05, .05, rojo);
        for (const fraccion of [.03, .37, .68, .97]) {
          box(detalle, 'W_poste_del_pasamanos', borde, y + subida * fraccion + .45,
            desde + desplazamiento * fraccion, .039, .90, .041, rojo);
        }
      }
    }

    const radio = 1.63;
    const plataforma = new THREE.CylinderGeometry(radio, radio, .31, 26, 1, false, Math.PI / 2, Math.PI);
    const peto = new THREE.CylinderGeometry(radio, radio, .90, 26, 1, true, Math.PI / 2, Math.PI);
    for (let nivel = 0; nivel < 2; nivel++) {
      const base = nivel * piso + .32;
      const y = base + piso / 2;
      tramo(x - .77, base, arranque, frente);
      tramo(x + .77, y, frente, arranque);
      box(detalle, 'W_plataforma_del_descanso', x, y - .155, frente - .49, 2 * radio, .31, 1.0, cuerpo);
      const apoyo = new THREE.Mesh(plataforma, material(cuerpo));
      apoyo.name = 'W_descanso_semicircular';
      apoyo.position.set(x, y - .155, frente - .98);
      detalle.add(apoyo);
      const borde = new THREE.Mesh(peto, material(concreto));
      borde.name = 'W_antepecho_curvo_de_concreto';
      borde.position.set(x, y + .44, frente - .98);
      detalle.add(borde);
      box(detalle, 'W_llegada_al_piso', x + .77, base + piso - .155,
        arranque + .66, ancho, .31, 1.32, cuerpo);
    }
  }

  // 17. La torre azul separa la escalera y la galería lateral. Las fotos enseñan
  // la nariz de cada peldaño y las costillas de concreto bajo la escalera.
  const p1 = buildingGroups.get('P1')?.getObjectByName('P1_volumen_0');
  const torre = p1?.getObjectByName('P1_torre_azulejo_azul');
  if (torre) {
    const detalle = grupo(p1, 'Revision_17_P1_llegada_de_talleres',
      'Corpus AZC: imagen_0002, imagen_0009 e imagen_0013; levantamiento UNAM, p. 70');
    for (const peldaño of p1.children.filter(nodo => nodo.name === 'P1_peldaño_de_concreto')) {
      const {x, y, z} = peldaño.position;
      box(detalle, 'P1_nariz_del_peldaño', x, y + peldaño.scale.y / 2 - .026,
        z - peldaño.scale.z / 2 - .009, peldaño.scale.x, .052, .047, '#d2c9ba');
    }
    const escalera = p1.getObjectByName('P1_muro_rampa_escalera');
    const cuerpo = p1.getObjectByName('Cuerpo de concreto');
    if (escalera && cuerpo) {
      const x = escalera.position.x - 1.10;
      const z = escalera.position.z;
      const ancho = .43, nivel = data.storeyHeight;
      box(detalle, 'P1_pretil_de_concreto_del_descanso', x, nivel + .46,
        z + 1.54, ancho, .91, 2.60, '#c4bcb0');
      box(detalle, 'P1_remate_del_pretil', x, nivel + .94,
        z + 1.54, ancho + .09, .09, 2.64, '#dad0c0');
      barra(detalle, 'P1_zanca_de_concreto_bajo_el_pretil', [x, nivel - 1.16, z - 2.48],
        [x, nivel - .12, z + 1.95], ancho + .06, .29, '#a49888');
      for (let i = 0; i <= 10; i++) {
        box(detalle, 'P1_costilla_bajo_la_zanca', x, nivel - 1.32 + i * .096,
          z - 2.40 + i * .38, ancho + .086, .085, .116, '#8b8176');
      }

      // La fachada de la pasarela combina paños concretos y ventanas rectangulares.
      // Se conserva el cuerpo del taller; los vanos son una lectura esquemática de su alzado.
      const cara = cuerpo.scale.x / 2 + .085;
      const profundidad = cuerpo.scale.z;
      const tramo = profundidad * .60;
      const paso = tramo / 7;
      for (let i = 0; i <= 7; i++) {
        const posZ = -tramo / 2 + i * paso;
        box(detalle, 'P1_machon_de_pasarela', cara, nivel + 1.96, posZ,
          .15, 2.16, .49, '#c7c7bb');
        if (i === 7) continue;
        const centro = posZ + paso / 2;
        box(detalle, 'P1_cancel_de_pasarela', cara, nivel + 1.97, centro,
          .119, 1.21, paso - .58, '#55676b');
        box(detalle, 'P1_alféizar_concreto_de_pasarela', cara + .055, nivel + 1.36, centro,
          .21, .13, paso - .48, '#bcbcb0');
        for (const fraccion of [-.31, 0, .31]) {
          box(detalle, 'P1_parteluz_de_pasarela', cara + .069, nivel + 1.97, centro + fraccion * (paso - .58),
            .055, 1.22, .054, '#d0d2c6');
        }
      }
    }
  }

  // 18. 0035 y 0022 muestran el anexo bajo de P3 con franja de huecos,
  // barrotes oscuros y umbral de ladrillo. El anexo y su volumen se conservan.
  const p3 = buildingGroups.get('P3')?.getObjectByName('P3_volumen_0');
  const anexo = p3?.getObjectByName('P3_anexo_dos_aguas');
  if (anexo) {
    const detalle = grupo(p3, 'Revision_18_P3_vanos_del_anexo',
      'Corpus AZC: imagen_0015, imagen_0022, imagen_0027 e imagen_0035');
    const {x, z} = anexo.position;
    const ancho = anexo.scale.x, fondo = anexo.scale.z;
    const cara = z + fondo / 2;
    const elevacion = 2.20, alto = .61, extremos = .30, montante = .28;
    const anchoPano = (ancho - 2 * extremos - montante) / 2;
    for (const lado of [-1, 1]) {
      const centro = x + lado * (anchoPano + montante) / 2;
      box(detalle, 'P3_luz_del_anexo_bajo', centro, elevacion, cara + .055,
        anchoPano, alto, .067, '#333b37');
      for (let i = 0; i <= 10; i++) {
        box(detalle, 'P3_barrote_del_anexo_bajo', centro + (i / 10 - .5) * anchoPano, elevacion,
          cara + .095, .033, alto, .027, '#59605b');
      }
      box(detalle, 'P3_alféizar_de_tabique', centro, elevacion - alto / 2 - .027,
        cara + .086, anchoPano + .063, .06, .11, '#9c6353');
    }
  }
}
