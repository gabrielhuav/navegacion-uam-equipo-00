// El acabado de J se apoya en la vuelta de la galería a las 7:59 del recorrido de 2021.
function detallarZocaloCafeteria({buildingGroups, box}) {
  const cafeteria = buildingGroups.get('J')?.getObjectByName('J_cafeteria_y_lucernario');
  const galeria = cafeteria?.getObjectByName('J_galeria_lateral_de_cafeteria');
  if (!galeria) return;
  for (const vano of galeria.children.filter(malla => malla.name === 'J_cancel_lateral')) {
    const {x, y, z} = vano.position;
    const cara = x + vano.scale.x / 2;
    const base = y - vano.scale.y / 2;
    const alto = vano.scale.y * .30;
    box(galeria, 'J_faldón_opaco_del_cancel', cara + .011, base + alto / 2, z,
      .026, alto, vano.scale.z - .025, '#96988d');
    box(galeria, 'J_travesaño_del_faldón', cara + .027, base + alto, z,
      .038, .042, vano.scale.z, '#bfc0b3');
  }
}

// Cierre divisor visible en la foto de 2017 de las multicanchas tomada hacia Q.
// La malla se arma por paños y se mantiene al sur de la ruta exterior.
function detallarMallaMulticanchas({THREE, world, box, material, X, Z}) {
  const cierre = new THREE.Group();
  cierre.name = 'Malla_divisoria_multicanchas_campo';
  cierre.userData = {approximate:true, reference:'Google Maps, Campo de futbol, foto 1 de abril de 2017'};
  world.add(cierre);
  const inicio = X(1455), fin = X(1570.5), z = Z(467.15);
  const base = .36, cima = 2.96, distancia = fin - inicio;
  const claros = Math.ceil(distancia / 3.2);
  for (let i = 0; i <= claros; i++) {
    box(cierre, 'Poste_de_acero_malla_deportiva', inicio + i * distancia / claros, (base + cima) / 2, z,
      .074, cima - base, .074, '#59645c');
  }
  for (const altura of [base + .07, cima - .04]) {
    box(cierre, 'Tensor_de_malla_deportiva', (inicio + fin) / 2, altura, z, distancia, .029, .031, '#687369');
  }
  const vertices = [];
  const inferior = base + .07, superior = cima - .04;
  const alto = superior - inferior;
  for (const diagonal of [-1, 1]) {
    for (let x = inicio - alto; x < fin + alto; x += .32) {
      const t0 = Math.max(0, diagonal > 0 ? inicio - x : x - fin);
      const t1 = Math.min(alto, diagonal > 0 ? fin - x : x - inicio);
      if (t1 - t0 < .04) continue;
      const a = x + diagonal * t0, b = x + diagonal * t1;
      const y0 = inferior + t0, y1 = inferior + t1, espesor = .012;
      vertices.push(a,y0,z, a+espesor,y0,z, b+espesor,y1,z, a,y0,z, b+espesor,y1,z, b,y1,z);
      vertices.push(a,y0,z, b+espesor,y1,z, a+espesor,y0,z, a,y0,z, b,y1,z, b+espesor,y1,z);
    }
  }
  const trama = new THREE.BufferGeometry();
  trama.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  trama.computeVertexNormals();
  const tejido = new THREE.Mesh(trama, material('#7c867b'));
  tejido.name = 'Trama_diamantada_del_campo';
  cierre.add(tejido);
}

// Desde la cancha, la foto de infraestructura permite separar la cabecera
// blanca, el cuadro de mampostería empotrado y los montantes rojos.
function detallarCabeceraFutbol7({world, box, line}) {
  const cancha = world.getObjectByName('Recinto_oblicuo_futbol_7');
  const testero = cancha?.getObjectByName('Paño_cabecera_escalonada');
  const piedra = cancha?.getObjectByName('Paño_piedra_cancha_7');
  if (!piedra || !testero) return;
  const {x, y, z} = piedra.position;
  const frente = z + piedra.scale.z / 2;
  const ancho = piedra.scale.x, alto = piedra.scale.y;
  const colores = ['#8d8d83','#a1a096','#8a8079','#b1aea0','#999b91'];
  for (let hilada = 0; hilada < 3; hilada++) {
    const paso = ancho / 9;
    for (let columna = 0; columna < 9; columna++) {
      const bloque = box(cancha, 'Sillarejo_de_la_cabecera_F7', x - ancho/2 + paso*(columna+.5),
        y - alto/2 + (hilada+.5)*alto/3, frente + .013,
        paso - .038, alto/3 - .029, .025, colores[(columna*3 + hilada*2) % colores.length]);
      bloque.rotation.z = .022*((columna+hilada)%3-1);
    }
  }
  for (const lado of [-1, 1]) {
    box(cancha, 'Encuentro_blanco_mampostería_F7', x + lado*ancho/2, y, frente + .018,
      .076, alto + .07, .044, '#d7d9cf');
    box(cancha, 'Montante_rojo_en_testero_F7', x + lado*(ancho/2+.27), .97, frente + .02,
      .052, 1.24, .043, '#912e34');
  }
  const raya = z + 1.42;
  line(cancha, [[-4.4,raya],[-4.4,raya+3.7],[4.4,raya+3.7],[4.4,raya]], '#e5e8de', .16, .391);
}

export function modelarZonasCafeteriaDeportes(contexto) {
  detallarZocaloCafeteria(contexto);
  detallarMallaMulticanchas(contexto);
  detallarCabeceraFutbol7(contexto);
}
