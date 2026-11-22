import {rectanglePolygon, segmentPolygon, polygonsOverlap} from 'site-clearance';
import {obstacles} from 'route-space';
import {contornoPlazaEgresados} from 'plaza-egresados';

const estudio = 'https://zaloamati.azc.uam.mx/bitstreams/0a1a854d-435b-48b7-8ea4-17d7c1ea6cd3/download#page=38';
const obras = 'https://bertely.wordpress.com/wp-content/uploads/2009/05/plazas-del-ajedrez-obra-02.jpg';
const norteHP = 'https://bertely.wordpress.com/wp-content/uploads/2009/05/plazas-del-ajedrez-noche-01.jpg';

// Las fotos de obra y de las lonarias terminadas se distinguen de la planta
// de 2009. Se conservan los dos claros del modelo y sus andadores.
export const plazasAjedrez = [
  {
    id: 'HO', centro: [733, 356.25], ancho: 5.05, fondo: 4.25, altura: 3.38,
    mesas: [[-1.06, -1.04], [1.06, -1.04], [-1.06, 1.04], [1.06, 1.04]],
    bancas: [[-2.28, 0, .42, 1.28], [2.28, 0, .42, 1.28]],
    referenciaVisual: obras,
    evidencia: 'El montaje de obra documenta cuatro mesas alrededor del mástil. La foto reciente desde H confirma la lona junto a las trabes. Medidas, número de bancas y posición de cada mueble aproximados.'
  },
  {
    id: 'HP', centro: [906, 371], ancho: 8.3, fondo: 5.15, altura: 4.15,
    mesas: [[-1.62, -1.1], [1.6, -1.1], [-1.62, 1.1]],
    bancas: [[-3.25, -.95, .5, 1.52], [-3.25, .91, .5, 1.52], [3.08, .55, .52, 1.5]],
    referenciaVisual: norteHP,
    evidencia: 'La foto nocturna del acceso de HP confirma la lonaria, mástil central, brazos y bancas independientes. Se representan las tres mesas que se distinguen. Inventario actual y posición precisa pendientes.'
  }
];

const nivelPiso = .325;
const anchoMesa = .90;
const anchoAsiento = .42;
const retiroAsiento = .76;
const anchoDado = .53;
const margenMueble = .14;

function asientosDeMesa([x, z]) {
  return [[x - retiroAsiento, z], [x + retiroAsiento, z], [x, z - retiroAsiento], [x, z + retiroAsiento]];
}

function huellas(plaza) {
  const mesas = plaza.mesas.flatMap((mesa, indice) => [
    {nombre: 'Mesa ' + (indice + 1), posicion: mesa, ancho: anchoMesa},
    ...asientosDeMesa(mesa).map((posicion, orden) => ({nombre: 'Asiento ' + (indice + 1) + '.' + (orden + 1), posicion, ancho: anchoAsiento}))
  ]);
  const bancas = plaza.bancas.map(([x, z, ancho, fondo], indice) => ({
    nombre: 'Banca ' + (indice + 1), posicion: [x, z], ancho, fondo
  }));
  return [...mesas, ...bancas, {nombre: 'Dado del mástil', posicion: [0, 0], ancho: anchoDado}];
}

/** Audita mobiliario y apoyos de planta baja. La lona deja libre la altura de paso. */
export function verificarPlazasAjedrez({data, net, X, Z}) {
  const nodos = new Map(net.nodos.map(nodo => [nodo.id, nodo]));
  const aristas = net.aristas.map(({de, a}) => ({id: `${de}–${a}`, poly: segmentPolygon(nodos.get(de), nodos.get(a), 2)}));
  const enlacesPB = (data.integratedLinks || []).filter(enlace => enlace.levels.includes(0)).map(enlace => {
    const [de, a] = [enlace.fromAnchor, enlace.toAnchor].map(([x,z]) => ({x: X(x), z: Z(z)}));
    return {id: enlace.id, poly: segmentPolygon(de, a, enlace.width)};
  });
  const egresados = {id: 'Plaza de Egresados', poly: contornoPlazaEgresados.map(([x, z]) => ({x: X(x), z: Z(z)}))};
  const edificios = obstacles(data);
  const caminos = (data.paths || []).map(([x0, z0, x1, z1], indice) => ({
    id: `Andador ${indice + 1}`,
    poly: rectanglePolygon(X((x0 + x1) / 2), Z((z0 + z1) / 2), Math.abs(X(x1) - X(x0)), Math.abs(Z(z1) - Z(z0)))
  }));
  const superficiesProtegidas = [...edificios, ...enlacesPB, ...aristas, ...caminos, egresados];

  return plazasAjedrez.flatMap(plaza => {
    const [px, pz] = plaza.centro;
    const x = X(px), z = Z(pz);
    const patio = {nombre: 'Pavimento', poly: rectanglePolygon(x, z, plaza.ancho, plaza.fondo)};
    const conflictosPatio = [...edificios, ...caminos, egresados]
      .filter(barrera => polygonsOverlap(patio.poly, barrera.poly))
      .map(barrera => ({plaza: plaza.id, elemento: patio.nombre, invade: barrera.id}));
    const conflictosMuebles = huellas(plaza).flatMap(({nombre, posicion: [dx, dz], ancho, fondo = ancho}) => {
      const poly = rectanglePolygon(x + dx, z + dz, ancho + margenMueble, fondo + margenMueble);
      return superficiesProtegidas.filter(barrera => polygonsOverlap(poly, barrera.poly))
        .map(barrera => ({plaza: plaza.id, elemento: nombre, invade: barrera.id}));
    });
    return [...conflictosPatio, ...conflictosMuebles];
  });
}

function crearCubierta({THREE, grupo, plaza, material, box}) {
  const lonaHO = plaza.id === 'HO';
  const cotaAlero = lonaHO ? 0 : .26;
  const aleros = [
    [-.496, 0, 2.95], [0, -.496, 2.70], [.496, 0, 2.91], [0, .496, 2.72]
  ].map(([x, z, y]) => new THREE.Vector3(x * plaza.ancho, y + cotaAlero, z * plaza.fondo));
  const pico = new THREE.Vector3(0, plaza.altura, -.05);
  const posiciones = [...pico];
  const indices = [];
  const pasos = 8;
  const segmentos = aleros.length * pasos;

  function puntoRadial(orilla, t) {
    const punto = pico.clone().lerp(orilla, t);
    punto.y -= (lonaHO ? .18 : .35) * Math.sin(Math.PI * t);
    return punto;
  }

  function puntoDeBorde(sector, fraccion) {
    const a = aleros[sector];
    const b = aleros[(sector + 1) % aleros.length];
    const concavidad = Math.sin(Math.PI * fraccion);
    const orilla = a.clone().lerp(b, fraccion);
    orilla.x *= 1 - .205 * concavidad;
    orilla.z *= 1 - .205 * concavidad;
    orilla.y -= .16 * concavidad;
    return orilla;
  }

  for (let anillo = 1; anillo <= pasos; anillo++) {
    const progreso = anillo / pasos;
    for (let sector = 0; sector < aleros.length; sector++) {
      for (let paso = 0; paso < pasos; paso++) {
        posiciones.push(...puntoRadial(puntoDeBorde(sector, paso / pasos), progreso));

        const segmento = sector * pasos + paso;
        const actual = 1 + (anillo - 1) * segmentos + segmento;
        const siguiente = 1 + (anillo - 1) * segmentos + (segmento + 1) % segmentos;
        if (anillo === 1) indices.push(0, siguiente, actual);
        else indices.push(actual - segmentos, siguiente, actual, actual - segmentos, siguiente - segmentos, siguiente);
      }
    }
  }

  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute('position', new THREE.Float32BufferAttribute(posiciones, 3));
  geometria.setIndex(indices);
  geometria.computeVertexNormals();
  const lona = new THREE.Mesh(geometria, new THREE.MeshStandardMaterial({color: lonaHO ? '#efeee5' : '#f1f0e8', roughness: .91, side: THREE.DoubleSide}));
  lona.name = 'Membrana_tensada_blanca';
  lona.userData.disposeMaterial = true;
  lona.castShadow = true;
  grupo.add(lona);

  function barra(nombre, puntos, radio, color) {
    const curva = new THREE.CatmullRomCurve3(puntos);
    const pieza = new THREE.Mesh(new THREE.TubeGeometry(curva, 9, radio, 6, false), material(color));
    pieza.name = nombre;
    grupo.add(pieza);
  }

  function casquillo(nombre, pos, radio, altura, color) {
    const pieza = new THREE.Mesh(new THREE.CylinderGeometry(radio, radio, altura, 16), material(color));
    pieza.name = nombre;
    pieza.position.copy(pos);
    grupo.add(pieza);
  }

  // La obra muestra un mástil compuesto y ramas curvas en abanico. Los
  // tensores quedan suspendidos. Las cuatro puntas conservan el perímetro libre.
  const acero = '#b8c0bf';
  const encuentro = lonaHO ? 1.56 : 1.71;
  box(grupo, 'Dado_central_de_lonaria', 0, .061, 0, anchoDado, .12, anchoDado, '#aaa79c');
  for (const [x, z] of [[-.115, -.085], [.115, -.085], [.115, .085], [-.115, .085]]) {
    barra('Montante_mastil_central', [new THREE.Vector3(x, .12, z), new THREE.Vector3(x, encuentro, z)], .037, acero);
  }
  casquillo('Union_del_mastil_y_los_brazos', new THREE.Vector3(0, encuentro, 0), .164, .067, acero);
  const corona = new THREE.Vector3(0, pico.y - .05, pico.z);
  barra('Tubo_central_de_la_lonaria', [new THREE.Vector3(0, encuentro, 0), corona], .067, acero);
  casquillo('Remate_circular_membrana', pico.clone().add(new THREE.Vector3(0, .015, 0)), .103, .032, '#ded7c4');

  for (let sector = 0; sector < aleros.length; sector++) {
    const borde = Array.from({length: pasos + 1}, (_, i) => puntoDeBorde(sector, i / pasos));
    barra('Dobladillo_tensado', borde, .010, '#dcdace');
    for (const tramo of [0, .5]) {
      const extremo = puntoDeBorde(sector, tramo);
      const costura = [0, .25, .5, .75, 1].map(t => puntoRadial(extremo, t).add(new THREE.Vector3(0, .006, 0)));
      barra('Costura_radial', costura, .006, '#dddcd4');
      const principal = tramo === 0;
      const largo = principal ? 1.012 : .92;
      const extremoBrazo = new THREE.Vector3(extremo.x * largo, extremo.y - .045, extremo.z * largo);
      const base = new THREE.Vector3(extremo.x * .041, encuentro, extremo.z * .041);
      const curva = [
        base,
        new THREE.Vector3(extremo.x * .16, encuentro + .60, extremo.z * .16),
        new THREE.Vector3(extremo.x * .51, extremoBrazo.y - .12, extremo.z * .51),
        extremoBrazo
      ];
      barra(principal ? 'Brazo_curvo_de_lonaria' : 'Brazo_curvo_intermedio_de_lonaria', curva, principal ? .038 : .028, acero);
      if (principal) {
        const arranque = new THREE.Vector3(extremo.x * .07, encuentro + .04, extremo.z * .07);
        const finTensor = extremoBrazo.clone().add(new THREE.Vector3(0, -.025, 0));
        barra('Tensor_suspendido_de_lonaria', [arranque, finTensor], .009, '#aab1ae');
        casquillo('Terminal_del_tensor', extremoBrazo, .049, .043, acero);
      }
    }
  }
}

function crearTablero({THREE, grupo, x, z}) {
  const posiciones = [];
  const colores = [];
  const canteraClara = new THREE.Color('#ded8c5');
  const canteraOscura = new THREE.Color('#484b47');
  const lado = .080;
  for (let fila = 0; fila < 8; fila++) {
    for (let columna = 0; columna < 8; columna++) {
      const izq = x + (columna - 4) * lado;
      const frente = z + (fila - 4) * lado;
      const der = izq + lado;
      const fondo = frente + lado;
      const altura = .813;
      posiciones.push(izq, altura, frente, izq, altura, fondo, der, altura, frente,
        izq, altura, fondo, der, altura, fondo, der, altura, frente);
      const tono = (fila + columna) % 2 ? canteraOscura : canteraClara;
      for (let vertice = 0; vertice < 6; vertice++) colores.push(tono.r, tono.g, tono.b);
    }
  }
  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute('position', new THREE.Float32BufferAttribute(posiciones, 3));
  geometria.setAttribute('color', new THREE.Float32BufferAttribute(colores, 3));
  geometria.computeVertexNormals();
  const tablero = new THREE.Mesh(geometria, new THREE.MeshStandardMaterial({vertexColors: true, roughness: .85}));
  tablero.name = 'Tablero_de_cantera_de_ocho_por_ocho';
  tablero.receiveShadow = true;
  tablero.userData.disposeMaterial = true;
  grupo.add(tablero);
}

export function crearPlazasAjedrez({THREE, world, material, box, X, Z}) {
  const conjunto = new THREE.Group();
  conjunto.name = 'Plazas_de_ajedrez_HO_HP';
  world.add(conjunto);

  for (const plaza of plazasAjedrez) {
    const grupo = new THREE.Group();
    const [px, pz] = plaza.centro;
    grupo.name = `Plaza_de_ajedrez_${plaza.id}`;
    grupo.position.set(X(px), nivelPiso, Z(pz));
    grupo.userData = {
      title: `Plaza de ajedrez · ${plaza.id}`, building: plaza.id, approximate: true,
      reference: estudio, visualReference: plaza.referenciaVisual, evidencia: plaza.evidencia
    };
    conjunto.add(grupo);

    const piso = '#aaa79e';
    const junta = '#96938b';
    const ladrillo = '#a47d70';
    const concreto = '#bcb9ae';
    const concretoBase = '#a9a79d';
    box(grupo, 'Pavimento_del_patio', 0, -.055, 0, plaza.ancho, .11, plaza.fondo, piso);
    for (const lado of [-1, 1]) {
      box(grupo, 'Cenefa_terracota', lado * (plaza.ancho / 2 - .16), .004, 0, .27, .012, plaza.fondo, ladrillo);
      box(grupo, 'Cenefa_terracota', 0, .004, lado * (plaza.fondo / 2 - .16), plaza.ancho - .54, .012, .27, ladrillo);
    }
    box(grupo, 'Franja_transversal_terracota', 0, .004, 0, .25, .012, plaza.fondo - .54, ladrillo);
    for (let x = -plaza.ancho / 2 + .68; x < plaza.ancho / 2 - .29; x += .48) {
      box(grupo, 'Junta_pavimento', x, .003, 0, .014, .006, plaza.fondo - .59, junta);
    }
    for (let z = -plaza.fondo / 2 + .69; z < plaza.fondo / 2 - .29; z += .48) {
      box(grupo, 'Junta_pavimento', 0, .003, z, plaza.ancho - .59, .006, .014, junta);
    }

    function crearAsiento([x, z], nombre) {
      box(grupo, `${nombre}_zocalo`, x, .031, z, anchoAsiento - .08, .06, anchoAsiento - .08, concretoBase);
      const asiento = box(grupo, nombre, x, .236, z, anchoAsiento, .36, anchoAsiento, concreto);
      asiento.castShadow = true;
    }

    for (const [x, z] of plaza.mesas) {
      box(grupo, 'Plinto_mesa', x, .049, z, .53, .098, .53, concretoBase);
      const pedestal = box(grupo, 'Pedestal_mesa', x, .406, z, .34, .64, .34, concreto);
      pedestal.castShadow = true;
      const cubierta = box(grupo, 'Losa_de_concreto_mesa', x, .759, z, anchoMesa, .105, anchoMesa, concreto);
      cubierta.castShadow = true;
      box(grupo, 'Marco_de_cantera', x, .808, z, .692, .006, .692, concretoBase);
      crearTablero({THREE, grupo, x, z});
      for (const asiento of asientosDeMesa([x, z])) crearAsiento(asiento, 'Asiento_cubico');
    }
    for (const [x, z, ancho, fondo] of plaza.bancas) {
      const banca = box(grupo, 'Banca_independiente_de_concreto', x, .218, z, ancho, .41, fondo, concreto);
      banca.castShadow = true;
    }

    crearCubierta({THREE, grupo, plaza, material, box});
  }
  return conjunto;
}
