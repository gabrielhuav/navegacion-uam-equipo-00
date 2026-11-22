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

// Las transiciones que se pierden entre panoramas se aproximan sobre el eje
// del croquis. Las secciones sin evidencia directa retienen un cierre liso.
function perfilDeFondo(lado, x, z, indice) {
  switch (lado) {
    case 0: return x >= 1310 ? 'muro_R' : 'cierre_esquematico';
    case 1:
      if (z < 396) return 'muro_R';
      return Math.floor(indice / 2) % 2 ? 'reja_F7' : 'muro_F7';
    case 2:
      if (x < 865) return 'cierre_esquematico';
      return Math.floor(indice / 2) % 2 ? 'reja_Eje_5' : 'muro_Eje_5';
    default: return z < 608 ? 'reja_San_Pablo' : 'paño_acanalado';
  }
}

export function crearDetallesMapsPonente(THREE, data, omitirPunto) {
  const grupo = new THREE.Group();
  grupo.name = 'Cierres_Maps_poniente';
  grupo.userData = {
    aproximado: true,
    panos: [],
    referencia: 'Frente de San Pablo Xalpa, Eje 5, Central Rosario y Ferrocarriles en Street View (2024–2025)',
  };

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

  function piezasPaño(perfil, ancho) {
    const clave = perfil + '/' + ancho.toFixed(5);
    if (plantillas.has(clave)) return plantillas.get(clave);
    if (perfil === 'muro_R') {
      muro(ancho, 1.62);
      malla(ancho, 1.78, 2.57, .065);
    } else if (perfil === 'muro_F7' || perfil === 'reja_F7') {
      muro(ancho, perfil === 'muro_F7' ? 1.43 : .26);
      if (perfil === 'reja_F7') reja(ancho, .43, 1.60);
      malla(ancho, 1.58, 2.46, .055);
    } else if (perfil === 'reja_campo') {
      reja(ancho, .20, 1.88);
      malla(ancho, .24, 2.38, .12);
    } else if (perfil === 'muro_Eje_5') {
      muro(ancho, 1.72);
    } else if (perfil === 'reja_Eje_5') {
      muro(ancho, .19);
      reja(ancho, .36, 1.89);
      malla(ancho, 1.87, 2.26, .065);
      const piezasDeMalla = ['Poste_de_malla', 'Marco_de_malla', 'Malla_eslabonada'];
      for (const {nombre, posiciones} of lotes.values()) {
        if (!piezasDeMalla.includes(nombre)) continue;
        for (let y = 1; y < posiciones.length; y += 3) {
          posiciones[y + 1] += .54 * (posiciones[y] - 1.87);
        }
      }
    } else if (perfil === 'reja_San_Pablo') {
      caja('Zocalo_bajo_San_Pablo', '#64615a', ancho/2, .19, 0, ancho, .10, .29);
      reja(ancho, .24, 1.91);
      caja('Montante_rojo_San_Pablo', '#803c37', .05, 1.07, 0, .105, 1.67, .12);
    } else if (perfil === 'paño_acanalado') {
      caja('Paño_acanalado_San_Pablo', '#6b7474', ancho / 2, 1.025, 0, ancho, 1.71, .13);
      for (let x = .06; x < ancho - .025; x += .14) {
        caja('Nervadura_de_lámina', '#838a88', x, 1.025, .076, .031, 1.69, .035);
      }
      caja('Remate_de_lámina', '#959b94', ancho / 2, 1.885, .018, ancho, .048, .18);
    } else {
      caja('Cierre_sin_acabado_confirmado', '#777a71', ancho / 2, .94, 0, ancho, 1.62, .33);
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
    plantillas.set(clave, piezas);
    return piezas;
  }

  const pañosObservados = new Map();
  for (const {lado, punto, celdas, tipo, perfiles, pano, fecha, rumbo} of referencias) {
    const [x0, z0] = data.site[lado], [x1, z1] = data.site[(lado + 1) % data.site.length];
    const dx = x1 - x0, dz = z1 - z0, largo = Math.hypot(dx, dz);
    const centro = ((punto[0] - x0) * dx + (punto[1] - z0) * dz) / largo;
    const inicio = Math.max(0, Math.round(centro / paso - celdas / 2) * paso);
    for (let indice = 0; indice < celdas; indice++) {
      const desde = inicio + indice * paso;
      if (desde + paso > largo) break;
      const perfil = perfiles[indice % perfiles.length];
      pañosObservados.set(lado + '/' + desde, {tipo, perfil, referencia: {lado, desde, pano, fecha, rumbo}});
    }
  }

  for (let lado = 0; lado < data.site.length; lado++) {
    const [x0, z0] = data.site[lado], [x1, z1] = data.site[(lado + 1) % data.site.length];
    const dx = x1 - x0, dz = z1 - z0, largo = Math.hypot(dx, dz);
    for (let desde = 0; desde < largo; desde += paso) {
      const longitud = Math.min(paso, largo - desde);
      if (longitud < .001) break;
      const mitad = (desde + longitud / 2) / largo;
      const x = x0 + mitad * dx, z = z0 + mitad * dz;
      if (omitirPunto(x, z)) continue;
      if (data.gates.some(gate => gate.id !== 'V2' && Math.hypot(gate.x - x, gate.y - z) < 21)) continue;

      const observado = pañosObservados.get(lado + '/' + desde);
      const perfil = observado?.perfil ?? perfilDeFondo(lado, x, z, Math.floor(desde / paso));
      const tramo = new THREE.Group();
      tramo.name = observado?.tipo ?? perfil;
      tramo.rotation.y = -Math.atan2(dz, dx);
      const origen = desde / largo;
      tramo.position.set((x0 + origen * dx - 895) * escala, 0, (z0 + origen * dz - 390) * escala);
      grupo.add(tramo);
      if (observado) grupo.userData.panos.push(observado.referencia);

      for (const pieza of piezasPaño(perfil, longitud * escala)) {
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
