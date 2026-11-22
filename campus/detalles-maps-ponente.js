// Paños visibles en panoramas fechados. Se proyectan al perímetro del croquis.
// Las fotos no determinan los extremos ni la altura medida de cada cierre.
const referencias = [
  {lado: 0, punto: [1408, 208], celdas: 3, tipo: 'Piedra_R', perfiles: ['muro_R'],
    pano: 'YzBF1O3cR6V4Kkg8U6hwCw', fecha: '2024-07', rumbo: 31.42},
  {lado: 1, punto: [1712, 643], celdas: 4, tipo: 'Ferrocarriles', perfiles: ['muro_F7', 'reja_F7'],
    pano: 'HY5f0h236SqOvdbIBTZyLg', fecha: '2024-07', rumbo: 87.03},
  {lado: 2, punto: [1481, 700], celdas: 4, tipo: 'Borde_campo_natural', perfiles: ['reja_campo'],
    pano: 'eHE0c5cqGgSA4rgjgE5WSw', fecha: '2025-01', rumbo: 194.57},
];
const paso = 8;

// En el perímetro existente, t es la distancia desde el inicio del lado en el croquis.
export function cubrePerimetroMapsPonente(detalles, lado, t) {
  return detalles.userData.panos.some(pano => pano.lado === lado && pano.desde === t);
}

export function crearDetallesMapsPonente(THREE, data, omitirPunto = () => false) {
  const grupo = new THREE.Group();
  grupo.name = 'Cierres_Maps_poniente';
  grupo.userData = {aproximado: true, panos: []};

  const cajaBase = new THREE.BoxGeometry();
  const unidad = cajaBase.toNonIndexed();
  cajaBase.dispose();
  const base = unidad.getAttribute('position');
  const vertice = new THREE.Vector3();
  const lotes = new Map();

  function caja(nombre, color, x, y, z, largo, alto, fondo, giro = 0) {
    const clave = `${nombre}/${color}`;
    if (!lotes.has(clave)) lotes.set(clave, {nombre, color, posiciones: []});
    const {posiciones} = lotes.get(clave);
    const cos = Math.cos(giro), sin = Math.sin(giro);
    for (let i = 0; i < base.count; i++) {
      vertice.fromBufferAttribute(base, i);
      const u = vertice.x * largo, v = vertice.y * alto;
      posiciones.push(x + cos * u - sin * v, y + sin * u + cos * v, z + vertice.z * fondo);
    }
  }

  function muro(ancho, alto) {
    caja('Muro_piedra', '#54534f', ancho / 2, .17 + alto / 2, 0, ancho, alto, .25);
    const tonos = ['#676561', '#5c5b56', '#76716a', '#62615d'];
    const filas = Math.round(alto / .28), columnas = Math.ceil(ancho / .48);
    for (let fila = 0; fila < filas; fila++) {
      for (let col = 0; col <= columnas; col++) {
        const pasoX = ancho / columnas, altoFila = alto / filas;
        const inicio = (col - (fila % 2) * .41) * pasoX;
        const izquierda = Math.max(.024, inicio + .026), derecha = Math.min(ancho - .024, inicio + pasoX - .022);
        if (derecha - izquierda < .06) continue;
        const x = (izquierda + derecha) / 2, y = .17 + (fila + .5) * altoFila;
        const bloque = (3 * fila + col + Math.floor(col / 3)) % tonos.length;
        const giro = (((fila * 9 + col * 13) % 7) - 3) * .013;
        for (const cara of [-1, 1]) {
          caja('Juntas_de_piedra', tonos[bloque], x, y, cara * .126, derecha - izquierda, altoFila - .028, .026, giro);
        }
      }
    }
  }

  function reja(ancho, inferior, superior) {
    const rojo = '#873e39', altura = superior - inferior;
    const divisiones = Math.round(ancho / .155);
    for (let i = 0; i < divisiones; i++) {
      const x = ancho * (i + .5) / divisiones;
      caja('Barrotes_rojos', rojo, x, inferior + altura / 2, 0, .061, altura, .057);
    }
    caja('Travesaño_de_reja', '#763d39', ancho / 2, inferior + .074, 0, ancho, .075, .068);
    caja('Travesaño_de_reja', '#763d39', ancho / 2, superior - .070, 0, ancho, .067, .068);
  }

  function malla(ancho, inferior, superior, fondo) {
    const metal = '#716e62', altura = superior - inferior;
    caja('Poste_de_malla', metal, .032, inferior + altura / 2, fondo, .064, altura, .064);
    caja('Marco_de_malla', metal, ancho / 2, superior, fondo, ancho, .051, .052);
    const intervalo = .23;
    for (let origen = -altura; origen < ancho; origen += intervalo) {
      const a = Math.max(0, -origen), b = Math.min(altura, ancho - origen);
      if (b <= a) continue;
      const x = origen + (a + b) / 2, y = inferior + (a + b) / 2;
      const largo = Math.SQRT2 * (b - a);
      caja('Malla_eslabonada', metal, x, y, fondo, largo, .014, .014, Math.PI / 4);
      caja('Malla_eslabonada', metal, x, superior - y + inferior, fondo, largo, .014, .014, -Math.PI / 4);
    }
  }

  const escala = data.metersPerPixel;
  const plantillas = new Map();
  const materiales = new Map();
  const materialesEnUso = new Set();

  function piezasPaño(perfil) {
    if (plantillas.has(perfil)) return plantillas.get(perfil);
    const ancho = paso * escala;
    if (perfil === 'muro_R') {
      muro(ancho, 1.62);
      malla(ancho, 1.78, 2.57, .065);
    } else if (perfil === 'muro_F7' || perfil === 'reja_F7') {
      muro(ancho, perfil === 'muro_F7' ? 1.43 : .26);
      if (perfil === 'reja_F7') reja(ancho, .43, 1.60);
      malla(ancho, 1.58, 2.46, .055);
    } else {
      reja(ancho, .20, 1.88);
      malla(ancho, .24, 2.38, .12);
    }

    const piezas = Array.from(lotes.values(), ({nombre, color, posiciones}) => {
      const geometria = new THREE.BufferGeometry();
      geometria.setAttribute('position', new THREE.Float32BufferAttribute(posiciones, 3));
      geometria.computeVertexNormals();
      if (!materiales.has(color)) materiales.set(color, new THREE.MeshStandardMaterial({color, roughness: .91}));
      const pieza = new THREE.Mesh(geometria, materiales.get(color));
      pieza.name = nombre;
      pieza.receiveShadow = true;
      return pieza;
    });
    lotes.clear();
    plantillas.set(perfil, piezas);
    return piezas;
  }

  for (const {lado, punto, celdas, tipo, perfiles, pano, fecha, rumbo} of referencias) {
    const [x0, z0] = data.site[lado], [x1, z1] = data.site[(lado + 1) % data.site.length];
    const dx = x1 - x0, dz = z1 - z0, largo = Math.hypot(dx, dz);
    const centro = ((punto[0] - x0) * dx + (punto[1] - z0) * dz) / largo;
    const inicio = Math.max(0, Math.round(centro / paso - celdas / 2) * paso);
    for (let indice = 0; indice < celdas; indice++) {
      const desde = inicio + indice * paso;
      if (desde + paso > largo) break;
      const fraccion = (desde + paso / 2) / largo;
      const px = x0 + fraccion * dx, pz = z0 + fraccion * dz;
      if (omitirPunto(px, pz) || data.gates.some(gate => Math.hypot(gate.x - px, gate.y - pz) < 21)) continue;

      const tramo = new THREE.Group();
      tramo.name = tipo;
      tramo.rotation.y = -Math.atan2(dz, dx);
      const origen = desde / largo;
      tramo.position.set((x0 + origen * dx - 895) * escala, 0, (z0 + origen * dz - 390) * escala);
      grupo.add(tramo);
      grupo.userData.panos.push({lado, desde, pano, fecha, rumbo});

      const perfil = perfiles[indice % perfiles.length];
      for (const pieza of piezasPaño(perfil)) {
        const copia = pieza.clone();
        if (!materialesEnUso.has(copia.material)) {
          copia.userData.disposeMaterial = true;
          materialesEnUso.add(copia.material);
        }
        tramo.add(copia);
      }
    }
  }
  unidad.dispose();
  return grupo;
}
