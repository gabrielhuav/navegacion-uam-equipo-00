import {rectanglePolygon, segmentPolygon, polygonsOverlap} from 'site-clearance';
import {obstacles} from 'route-space';
import {contornoPlazaEgresados} from 'plaza-egresados';

const estudio = 'https://zaloamati.azc.uam.mx/bitstreams/0a1a854d-435b-48b7-8ea4-17d7c1ea6cd3/download#page=38';

// El estudio identifica las dos plazas, cuatro mesas con cuatro asientos cada una
// y cuatro asientos sueltos en total. La distribución 2 + 2 es una aproximación.
// La foto aportada desde el piso superior sitúa la lona de HO junto a las trabes
// rojas del enlace con H. Se ajusta en ese claro y se mantiene continuo el andador.
export const plazasAjedrez = [
  {
    id: 'HO', centro: [733, 356.25], ancho: 5.05, fondo: 4.25, altura: 3.38,
    mesas: [[-1.19, -.05], [1.17, .06]],
    asientosSueltos: [[-1.39, 1.66], [1.40, -1.62]],
    referenciaVisual: 'Foto del usuario desde el piso superior, Google Maps (dic. 2022, CIHM0ogKEICAgID-idKAZg) y corpus de HO imagen_0007.png',
    evidencia: 'La foto superior confirma la lona baja junto a las trabes H–HO, el remate circular y las puntas con tensores. Apoyos al suelo y reparto del mobiliario estimados.'
  },
  {
    id: 'HP', centro: [906, 371], ancho: 8.3, fondo: 5.15, altura: 4.15,
    mesas: [[-1.68, -.62], [1.55, .68]],
    asientosSueltos: [[-3.18, 1.15], [3.1, -.95]],
    referenciaVisual: 'Vista aérea de la zona H–HP y descripción del mobiliario en el estudio UAM, p. 38',
    evidencia: 'Implantación aproximada hacia H y la Biblioteca. El estudio confirma lona y mobiliario. Los detalles de costura y el remate son esquemáticos, interpretados a partir de HO.'
  }
];

const nivelPiso = .325;
const anchoMesa = .94;
const anchoAsiento = .43;
const retiroAsiento = .85;
const anchoPoste = .105;
const margenMueble = .14;

function asientosDeMesa([x, z]) {
  return [[x - retiroAsiento, z], [x + retiroAsiento, z], [x, z - retiroAsiento], [x, z + retiroAsiento]];
}

function apoyos(plaza) {
  return [[-.465, -.385], [.465, -.385], [.465, .355], [-.465, .355]]
    .map(([x, z]) => [x * plaza.ancho, z * plaza.fondo]);
}

function huellas(plaza) {
  const mesas = plaza.mesas.flatMap((mesa, indice) => [
    {nombre: `Mesa ${indice + 1}`, posicion: mesa, ancho: anchoMesa},
    ...asientosDeMesa(mesa).map((posicion, orden) => ({nombre: `Asiento ${indice + 1}.${orden + 1}`, posicion, ancho: anchoAsiento}))
  ]);
  const sueltos = plaza.asientosSueltos.map((posicion, indice) => ({nombre: `Asiento libre ${indice + 1}`, posicion, ancho: anchoAsiento}));
  const postes = apoyos(plaza).map((posicion, indice) => ({nombre: `Apoyo ${indice + 1}`, posicion, ancho: anchoPoste}));
  return [...mesas, ...sueltos, ...postes];
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
    const conflictosMuebles = huellas(plaza).flatMap(({nombre, posicion: [dx, dz], ancho}) => {
      const poly = rectanglePolygon(x + dx, z + dz, ancho + margenMueble, ancho + margenMueble);
      return superficiesProtegidas.filter(barrera => polygonsOverlap(poly, barrera.poly))
        .map(barrera => ({plaza: plaza.id, elemento: nombre, invade: barrera.id}));
    });
    return [...conflictosPatio, ...conflictosMuebles];
  });
}

function crearCubierta({THREE, grupo, plaza, material}) {
  const lonaHO = plaza.id === 'HO';
  const cotaAlero = lonaHO ? -.10 : 0;
  const aleros = [
    [-.495, -.415, 2.98], [0, -.5, 2.72], [.495, -.415, 2.94],
    [.5, .4, 2.89], [0, .5, 2.68], [-.5, .4, 2.94]
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
    orilla.x *= 1 - (lonaHO ? .28 : .21) * concavidad;
    orilla.z *= 1 - (lonaHO ? .28 : .21) * concavidad;
    orilla.y -= .18 * concavidad;
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

  for (const extremo of aleros) {
    const costura = [0, .25, .5, .75, 1].map(t => puntoRadial(extremo, t));
    for (const punto of costura) punto.y += .01;
    barra('Costura_radial', costura, .008, '#dddcd4');
  }

  // Las fotos muestran brazos cortos en los extremos. Los pies se aproximan por
  // los bordes de la plaza porque la fotografía no muestra todos sus anclajes.
  const brazos = apoyos(plaza).map(([x, z], indice) => {
    const oreja = aleros[[0, 2, 3, 5][indice]];
    const arranque = new THREE.Vector3(x, .015, z);
    const union = new THREE.Vector3(x, oreja.y + .04, z);
    const punta = oreja.clone().multiply(new THREE.Vector3(1.035, 1, 1.035));
    barra('Soporte_perimetral', [arranque, union], anchoPoste / 2, '#929a9b');
    barra('Brazo_y_tensor', [union, punta], .035, '#929a9b');
    return punta;
  });

  casquillo('Remate_circular_membrana', pico.clone().add(new THREE.Vector3(0, .015, 0)), .103, .032, '#ded7c4');
  casquillo('Arandela_del_remate', pico.clone().add(new THREE.Vector3(0, .035, 0)), .062, .018, '#9c8564');
  for (let sector = 0; sector < aleros.length; sector++) {
    const borde = Array.from({length: pasos + 1}, (_, i) => puntoDeBorde(sector, i / pasos));
    barra('Dobladillo_tensado', borde, .012, '#e4e1d6');
    casquillo('Terminal_del_tensor', aleros[sector], .038, .04, '#aab1ae');
  }
  if (lonaHO) {
    // Los tensores intermedios se suspenden cerca del perímetro, sin sumar apoyos
    // en los claros peatonales. La unión exacta no se distingue desde arriba.
    [[1, 0, 1], [4, 2, 3]].forEach(([extremo, a, b]) => {
      const paso = aleros[extremo].clone();
      paso.z *= 1.07;
      barra('Tensor_intermedio', [brazos[a], paso, brazos[b]], .012, '#aab1ae');
      barra('Horquilla_intermedia', [aleros[extremo], paso], .019, '#aab1ae');
    });
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
    for (const asiento of plaza.asientosSueltos) crearAsiento(asiento, 'Asiento_libre');

    crearCubierta({THREE, grupo, plaza, material});
  }
  return conjunto;
}
