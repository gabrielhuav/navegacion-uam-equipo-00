// Escenas independientes para el visor. Las proporciones se interpretan a partir de las fotos.
function prepararCorte(THREE, nombre, evidencia) {
  const group = new THREE.Group();
  group.name = nombre;
  group.userData = {aproximado: true, evidencia};
  const lotes = new Map();
  const identidad = new THREE.Quaternion();
  const ejeY = new THREE.Vector3(0, 1, 0);

  function caja(color, x, y, z, ancho, alto, fondo, giro = identidad, opacidad = 1) {
    const clave = `${color}/${opacidad}`;
    if (!lotes.has(clave)) lotes.set(clave, {color, opacidad, cajas: []});
    lotes.get(clave).cajas.push({pos: [x, y, z], escala: [ancho, alto, fondo], giro});
  }

  function barra(color, inicio, fin, ancho, fondo = ancho) {
    const a = new THREE.Vector3(...inicio);
    const b = new THREE.Vector3(...fin);
    const delta = b.clone().sub(a);
    const largo = delta.length();
    const giro = new THREE.Quaternion().setFromUnitVectors(ejeY, delta.normalize());
    caja(color, ...a.lerp(b, .5).toArray(), ancho, largo, fondo, giro);
  }

  function marcarPiso(color, puntos, ancho) {
    for (let i = 1; i < puntos.length; i++) {
      const [x0, z0] = puntos[i - 1];
      const [x1, z1] = puntos[i];
      const giro = new THREE.Quaternion().setFromAxisAngle(ejeY, -Math.atan2(z1 - z0, x1 - x0));
      caja(color, (x0 + x1) / 2, .027, (z0 + z1) / 2, Math.hypot(x1 - x0, z1 - z0), .012, ancho, giro);
    }
  }

  function colocarMallas() {
    const geometria = new THREE.BoxGeometry();
    const matriz = new THREE.Matrix4();
    const posicion = new THREE.Vector3();
    const escala = new THREE.Vector3();
    for (const {color, opacidad, cajas} of lotes.values()) {
      const material = new THREE.MeshStandardMaterial({
        color, roughness: .82, opacity: opacidad, transparent: opacidad < 1, depthWrite: opacidad === 1,
      });
      const malla = new THREE.InstancedMesh(geometria, material, cajas.length);
      for (const [i, {pos, escala: dimensiones, giro}] of cajas.entries()) {
        matriz.compose(posicion.fromArray(pos), giro, escala.fromArray(dimensiones));
        malla.setMatrixAt(i, matriz);
      }
      malla.receiveShadow = opacidad === 1;
      group.add(malla);
    }
  }

  return {group, caja, barra, marcarPiso, colocarMallas};
}

// Las dos fotos interiores del Edificio W, de febrero y agosto de 2022, muestran el mismo atrio.
export function crearInteriorW(THREE) {
  const {group, caja, barra, colocarMallas} = prepararCorte(THREE, 'Interior_W_Atrio', 'Google Maps: Edificio W, fotos 1 y 2; Recorrido en RV, 11:15–11:25');
  const concreto = '#b9bab1', junta = '#93968e', muro = '#deded2', rojo = '#a63c43';
  const piso = ['#303638', '#383e40', '#3c4243', '#34393c'];
  const anchoAtrio = 10.0, fondo = 24, xInterior = anchoAtrio / 2, xExterior = 7.9;
  caja(concreto, 0, -.23, 0, 2 * xExterior, .42, fondo);
  caja('#55595a', 0, -.025, 0, anchoAtrio, .05, fondo);
  for (let fila = 0; fila < 24; fila++) {
    for (let col = 0; col < 10; col++) {
      caja(piso[(fila * 5 + col + Math.floor(fila / 6)) % piso.length], col - 4.5, .005, fila - 11.5, .985, .015, .985);
    }
  }
  caja(muro, 0, 4.2, -11.94, 2 * xExterior, 8.4, .12);
  // El video mira a ambos lados de la estructura de vidrio y muestra la pila al pie.
  const pilaZ = -10.78, vidrioZ = -10.94, anchoPila = 6.8;
  caja('#676d69', 0, .13, pilaZ, anchoPila, .26, 1.58);
  caja('#355c5c', 0, .26, pilaZ, anchoPila - .36, .027, 1.22);
  for (const z of [pilaZ - .72, pilaZ + .72]) {
    caja('#7b817e', 0, .32, z, anchoPila, .22, .14);
  }
  for (const x of [-3.33, 3.33]) {
    caja('#7b817e', x, .32, pilaZ, .14, .22, 1.58);
    caja('#263a37', x * .96, 1.62, vidrioZ, .10, 2.79, .12);
  }
  caja('#547f78', 0, 1.65, vidrioZ, 6.36, 2.66, .052, undefined, .52);
  for (const x of [-1.5, -.5, .5, 1.5]) {
    caja('#a6cebd', x, 1.59, vidrioZ + .035, .062, 1.84, .014, undefined, .38);
  }
  for (const x of [-2.5, -1.67, -.84, 0, .84, 1.67, 2.5]) {
    caja('#3b4f48', x, .315, pilaZ + .35, .10, .10, .15);
  }
  caja(rojo, 5.3, 1.09, -11.84, 1.35, 2.18, .11);
  caja(rojo, -5.75, 1.09, -11.84, 1.35, 2.18, .11);

  for (const lado of [-1, 1]) {
    const corredor = lado * (xInterior + xExterior) / 2;
    const borde = lado * xInterior;
    const anchura = xExterior - xInterior;
    caja('#dbd9cd', corredor, .016, 0, anchura, .035, fondo);

    for (let nivel = 0; nivel <= 2; nivel++) {
      const y = nivel * 3.02;
      caja(muro, lado * xExterior, y + 1.42, -1.65, .16, 2.83, 20.65);
      for (let tramo = 0; tramo < 6; tramo++) {
        const z = -9.75 + tramo * 3.30;
        caja('#a8afa9', lado * (xExterior - .093), y + 2.22, z, .028, .66, 2.92);
        caja('#d1d4cd', lado * (xExterior - .124), y + 2.22, z, .03, .69, .038);
        caja(rojo, lado * (xExterior - .109), y + 1.01, z + .91, .043, 2.02, .84);
        caja('#d4c5ab', lado * (xExterior - .142), y + 1.03, z + 1.17, .022, .098, .042);
        caja('#efe9d7', corredor, y + 2.69, z, .115, .065, 1.81);
      }
      if (nivel === 0) continue;
      caja(concreto, corredor, y - .17, -.57, anchura, .34, 22.84);
      caja(concreto, borde + lado * .08, y + .35, -.57, .16, .70, 22.84);
      caja(rojo, borde + lado * .08, y + .87, -.57, .058, .07, 22.84);
      for (let z = -11.45; z < 10.78; z += 2.22) {
        caja(rojo, borde + lado * .08, y + .78, z, .045, .235, .048);
        caja(junta, borde - lado * .003, y + .35, z, .009, .64, .011);
      }
    }
  }

  for (const y of [3.02, 6.04, 8.98]) {
    caja(concreto, 0, y - .16, -9.75, 2 * xExterior, .32, 2.12);
    caja(concreto, 0, y + .33, -8.72, anchoAtrio, .66, .12);
    caja(rojo, 0, y + .73, -8.72, anchoAtrio, .065, .065);
  }

  for (let bloque = 0; bloque < 3; bloque++) {
    const centroZ = -6.8 + bloque * 4.4;
    caja('#34594b', -7.49, .865, centroZ, .64, 1.73, 3.14);
    for (let fila = 0; fila < 3; fila++) {
      for (let puerta = 0; puerta < 7; puerta++) {
        const y = .352 + fila * .529;
        const z = centroZ - 1.32 + puerta * .44;
        caja((fila + puerta) % 5 === 0 ? '#668a5b' : '#507a55', -7.158, y, z, .031, .511, .421);
        caja('#334a3a', -7.133, y + .041, z + .138, .022, .076, .028);
      }
    }
  }

  // Planos translúcidos y arcos segmentados, abiertos hacia el frente para leer el corte.
  const semicubierta = 5.23, arranque = 9.00, flecha = 2.05, segmentos = 16;
  const perfil = Array.from({length: segmentos + 1}, (_, i) => {
    const angulo = Math.PI * (1 - i / segmentos);
    return [semicubierta * Math.cos(angulo), arranque + flecha * Math.sin(angulo)];
  });
  for (const z of [-9.8, -7.52, -5.24, -2.96, -.68, 1.6, 3.88, 6.16, 8.44]) {
    for (let i = 1; i < perfil.length; i++) {
      const [x0, y0] = perfil[i - 1];
      const [x1, y1] = perfil[i];
      barra(rojo, [x0, y0, z], [x1, y1, z], .115, .082);
    }
  }
  for (const i of [0, 3, 6, 8, 10, 13, 16]) {
    const [x, y] = perfil[i];
    caja(rojo, x, y, -.68, .085, .085, 18.28);
  }
  for (let i = 1; i < perfil.length; i++) {
    const [x0, y0] = perfil[i - 1];
    const [x1, y1] = perfil[i];
    const giro = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.atan2(y1 - y0, x1 - x0));
    caja('#c2d9df', (x1 + x0) / 2, (y1 + y0) / 2 + .037, -6.39, Math.hypot(x1 - x0, y1 - y0), .035, 6.81, giro, .41);
  }

  colocarMallas();
  return {
    group, target: [0, 3.6, -1.2], camera: [7, 12.8, 35.3],
    etiquetas: [
      {texto: 'Atrio longitudinal', posicion: [0, .6, 3.5]},
      {texto: 'Muro de vidrio y pila', posicion: [0, 2.98, -10.62]},
      {texto: 'Galerías de ambos lados', posicion: [4.8, 6.84, -3.4]},
      {texto: 'Cubierta con arcos rojos', posicion: [0, 11.28, -5.3]},
    ],
  };
}

// El mapa y la UAM identifican el gimnasio de duela en R. La cubierta se muestra en corte.
export function crearInteriorR(THREE) {
  const {group, caja, barra, marcarPiso, colocarMallas} = prepararCorte(THREE, 'Interior_R_Gimnasio_duela', 'Google Maps: Gimnasio UAM, fotos 1–3, 5, 7–9; Expo Deportiva UAM-A');
  const duela = ['#bd9255', '#c89d5c', '#cca463', '#c49b61', '#d3ab68', '#cda16b'];
  const rojo = '#a3333c', gris = '#848d8e', muro = '#e2e0d6', azul = '#36a4ce';
  const blanco = '#f3ecda', linea = '#56656a', xBorde = 16.5, zFondo = -10.4, zFrente = 10.4;
  caja('#9d9c91', 0, -.27, 1.7, 33.3, .5, 24.3);
  caja('#be955b', 0, -.023, 0, 33, .05, 20.8);

  for (let fila = 0; fila < 65; fila++) {
    const z = zFondo + (fila + .5) * .32;
    let x = -xBorde;
    for (let i = 0; x < xBorde - .01; i++) {
      const ancho = Math.min(xBorde - x, i === 0 ? 1.1 + (fila % 4) * .39 : 2.9);
      caja(duela[(i * 5 + fila + Math.floor(fila / 7)) % duela.length], x + ancho / 2, .006, z, ancho - .008, .017, .314);
      x += ancho;
    }
  }

  const semicirculo = (cx, cz, radio, inicio, fin) => Array.from({length: 49}, (_, i) => {
    const angulo = inicio + (fin - inicio) * i / 48;
    return [cx + radio * Math.cos(angulo), cz + radio * Math.sin(angulo)];
  });
  const circulo = new THREE.Mesh(new THREE.CylinderGeometry(1.66, 1.66, .011, 48), new THREE.MeshStandardMaterial({color: azul, roughness: .82}));
  circulo.position.y = .019;
  group.add(circulo);
  marcarPiso(blanco, [[-14, -7.5], [14, -7.5], [14, 7.5], [-14, 7.5], [-14, -7.5]], .058);
  marcarPiso(blanco, [[0, -7.5], [0, 7.5]], .045);
  marcarPiso(blanco, semicirculo(0, 0, 1.66, 0, 2 * Math.PI), .05);
  marcarPiso(linea, [[-9.25, -8.05], [9.25, -8.05], [9.25, 8.05], [-9.25, 8.05], [-9.25, -8.05]], .035);

  for (const lado of [-1, 1]) {
    caja(azul, lado * 11.14, .019, 0, 5.72, .012, 4.76);
    marcarPiso(blanco, [[lado * 14, -2.38], [lado * 8.28, -2.38], [lado * 8.28, 2.38], [lado * 14, 2.38]], .049);
    const centro = lado * 8.28;
    const angulo = lado > 0 ? Math.PI : 0;
    marcarPiso(blanco, semicirculo(centro, 0, 1.82, angulo - Math.PI / 2, angulo + Math.PI / 2), .055);
    marcarPiso(blanco, semicirculo(lado * 12.43, 0, 6.30, angulo - Math.PI / 2, angulo + Math.PI / 2), .057);
    caja(rojo, lado * 15.55, .86, 0, .56, 1.72, .82);
    barra('#e7e3d8', [lado * 15.55, 1.6, 0], [lado * 13.42, 3.16, 0], .13);
    caja('#aabcc1', lado * 13.39, 3.49, 0, .064, 1.08, 1.79);
    caja(blanco, lado * 13.34, 3.38, 0, .033, .46, .63);
    caja('#aabcc1', lado * 13.317, 3.38, 0, .028, .386, .55);
    const aro = new THREE.Mesh(new THREE.TorusGeometry(.222, .026, 6, 24), new THREE.MeshStandardMaterial({color: '#ad5940', roughness: .83}));
    aro.position.set(lado * 13.09, 3.04, 0);
    aro.rotation.x = Math.PI / 2;
    group.add(aro);
  }

  caja(muro, 0, 2.19, zFondo, 33, 4.38, .20);
  caja(gris, 0, .38, zFondo + .112, 32.89, .76, .04);
  caja(muro, 0, 7.27, zFondo, 33, .92, .20);
  for (const x of [-10.65, 0, 10.65]) {
    caja('#708389', x, 5.67, zFondo, 10.22, 2.56, .115);
    for (let j = 0; j < 12; j++) {
      const montante = x - 4.75 + j * .86;
      caja('#b8c6c7', montante, 5.67, zFondo + .108, .23, 2.56, .12);
      caja(j % 4 === 0 ? '#acc4c9' : '#ced9d2', montante + .39, 5.71, zFondo + .068, .52, 2.36, .026);
    }
  }
  for (const x of [-16.2, -5.32, 5.32, 16.2]) caja(rojo, x, 3.97, zFondo + .20, .34, 7.94, .405);
  for (const x of [-11.9, 11.9]) {
    caja(rojo, x, 1.22, zFondo + .148, 2.08, 2.44, .105);
    caja('#c67575', x, 1.22, zFondo + .208, .058, 2.32, .02);
    for (const dx of [-.43, .43]) caja('#768488', x + dx, 1.57, zFondo + .213, .37, .35, .03);
  }

  for (const lado of [-1, 1]) {
    const largoMuro = lado < 0 ? 17.8 : 7.1;
    const centroMuro = zFondo + largoMuro / 2;
    caja(muro, lado * xBorde, 3.78, centroMuro, .19, 7.56, largoMuro);
    caja(gris, lado * (xBorde - .108), .38, centroMuro, .055, .76, largoMuro);
  }

  // Las fotos 2, 8 y 9 muestran las gradas lineales frente a los ventanales altos.
  const grisGradas = ['#a4a6a3', '#b9bab4', '#aeb0ab'];
  const tramos = [[-15.52, -12.2], [-11.07, 11.07], [12.2, 15.52]];
  for (let fila = 0; fila < 5; fila++) {
    const alto = .24 + fila * .36;
    const z = zFrente - 1.92 + fila * .81;
    for (const [inicio, fin] of tramos) caja(grisGradas[fila % 3], (inicio + fin) / 2, alto / 2, z, fin - inicio, alto, .82);
    for (const x of [-11.64, 11.64]) {
      caja('#989c97', x, (alto - .12) / 2, z - .21, 1.12, alto - .12, .405);
      caja('#aab0a9', x, alto / 2, z + .195, 1.12, alto, .405);
    }
  }
  for (const [inicio, fin] of tramos) {
    for (const y of [.61, 1.04]) caja(rojo, (inicio + fin) / 2, y, 8.06, fin - inicio, .105, .085);
    for (let x = inicio + .15; x < fin - .05; x += 1.76) caja(rojo, x, .52, 8.06, .075, 1.04, .086);
  }

  // Perfiles triangulados visibles en las fotos; se omite el cierre frontal para ver la cancha.
  const yTirante = 7.45, yAlero = 8.48, yCumbrera = 9.74;
  for (const x of [-16.2, -10.8, -5.4, 0, 5.4, 10.8, 16.2]) {
    caja(rojo, x, yTirante / 2, zFondo + .37, .28, yTirante, .34);
    caja(rojo, x, yTirante, .35, .14, .19, 21.2);
    for (const lado of [-1, 1]) {
      const objetivoZ = .35 + lado * 10.6;
      barra(rojo, [x, yCumbrera, .35], [x, yAlero, objetivoZ], .132, .185);
      for (let i = 0; i < 5; i++) {
        const z = .35 + lado * (i + 1) * 2.12;
        const y = yCumbrera + (yAlero - yCumbrera) * (i + 1) / 5;
        barra(rojo, [x, yTirante, z - lado * 2.12], [x, y, z], .078);
        barra(rojo, [x, yTirante, z], [x, y, z], .070);
      }
    }
  }
  for (const z of [-9.45, -5.25, -.98, 3.20, 7.43]) {
    const y = yCumbrera - (yCumbrera - yAlero) * Math.abs(z - .35) / 10.6;
    caja(rojo, 0, y, z, 32.4, .12, .10);
  }
  for (const x of [-13, -8.2, -3.15, 3.15, 8.2, 13]) {
    for (const z of [-6.2, -.2, 5.8]) {
      caja('#7b7772', x, 7.19, z, .052, .56, .052);
      caja('#f5ebcd', x, 6.91, z, .31, .13, .31);
    }
  }

  colocarMallas();
  return {
    group, target: [0, 2.2, .25], camera: [32, 24.3, 33],
    etiquetas: [
      {texto: 'Cancha de duela', posicion: [-2, .2, 1.3]},
      {texto: 'Gradas interiores', posicion: [6.4, 2.0, 11.25]},
      {texto: 'Ventanales altos', posicion: [0, 5.8, -10.22]},
    ],
  };
}
