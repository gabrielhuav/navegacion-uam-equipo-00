// Huella aproximada al pie de HO, según la vista aérea y Aleph UAM, núm. 100, p. 28.
export const contornoPlazaEgresados = [
  [711, 298.5], [713, 293], [718, 289], [725, 287.5], [732, 289], [737, 293],
  [739, 298.5], [737, 304], [732, 308], [725, 309.5], [718, 308], [713, 304]
];

const fuente = 'https://kali.azc.uam.mx/aleph/numeros/aleph100.pdf#page=28';

export function crearPlazaEgresados({THREE, world, material, X, Z}) {
  const plaza = new THREE.Group();
  plaza.name = 'Plaza_de_Egresados_HO';
  plaza.userData = {
    title: 'Plaza de Egresados', building: 'HO', approximate: true, source: fuente,
    reference: 'Crónica del proyectista. Gradas sobre un talud, tres pasillos elípticos y basamento de Intersecciones.',
    pending: 'Niveles exactos, permanencia de los ocho cipreses del proyecto y funcionamiento del agua.'
  };
  plaza.position.set(X(725), .12, Z(298.5));
  world.add(plaza);

  const radioX = X(739) - X(725);
  const radioZ = Z(309.5) - Z(298.5);

  function banda(nombre, exterior, interior, alto, color, gradas = false) {
    const forma = new THREE.Shape();
    if (gradas) {
      // Los peldaños ocupan la mitad que mira hacia HO. El lado del jardín queda abierto.
      forma.absellipse(0, 0, radioX * exterior, radioZ * exterior, Math.PI, 2 * Math.PI);
      forma.lineTo(radioX * interior, 0);
      forma.absellipse(0, 0, radioX * interior, radioZ * interior, 2 * Math.PI, Math.PI, true);
      forma.closePath();
    } else {
      forma.absellipse(0, 0, radioX * exterior, radioZ * exterior, 0, 2 * Math.PI);
      if (interior) {
        const centro = new THREE.Path();
        centro.absellipse(0, 0, radioX * interior, radioZ * interior, 0, 2 * Math.PI, true);
        forma.holes.push(centro);
      }
    }
    const geometria = new THREE.ExtrudeGeometry(forma, {depth: alto, curveSegments: 28, bevelEnabled: false});
    const malla = new THREE.Mesh(geometria, material(color));
    malla.name = nombre;
    malla.rotation.x = -Math.PI / 2;
    malla.receiveShadow = true;
    plaza.add(malla);
  }

  // Las tres bandas de piso siguen el basamento. El graderío queda libre en
  // la mitad hacia el jardín y se conecta por detrás con el talud de HO.
  banda('Paso_perimetral', 1, .75, .12, '#b5b1a5');
  banda('Paso_intermedio_de_adocreto', .75, .47, .12, '#535450');
  banda('Paso_interior_de_laja', .47, .25, .12, '#a89d88');
  banda('Zocalo_eliptico_Intersecciones', .206, 0, .22, '#b6afa0');
  banda('Borde_eliptico_fuente_seca', .25, .221, .21, '#c5beae');
  banda('Lecho_seco_fuente_Intersecciones', .221, .206, .143, '#787d72');
  banda('Grada_interior_hemiciclo', .687, .548, .25, '#9c9a8d', true);
  banda('Grada_media_hemiciclo', .823, .687, .406, '#a6a398', true);
  banda('Grada_exterior_hemiciclo', .943, .823, .562, '#adab9e', true);

  function punto(radio, angulo, y) {
    return [Math.cos(angulo) * radioX * radio, y, Math.sin(angulo) * radioZ * radio];
  }

  // Paños de adocreto negro, laja policromada y pavimento del borde. Las juntas
  // espaciales distinguen los tres acabados también en el PNG visto desde arriba.
  const vertices = [], colores = [];
  function paño(a, b, c, d, color) {
    const tono = new THREE.Color(color);
    for (const vertice of [a, b, c, a, c, d]) {
      vertices.push(...vertice);
      colores.push(tono.r, tono.g, tono.b);
    }
  }
  function hiladas(radios, piezas, tonos) {
    radios.slice(1).forEach((borde, fila) => {
      const interior = radios[fila] + .0024, exterior = borde - .0024;
      for (let i = 0; i < piezas; i++) {
        const paso = Math.PI * 2 / piezas;
        const desde = (i + fila % 2 * .5) * paso + .0037;
        const hasta = desde + paso - .0074;
        const color = tonos[(7 * i + 3 * fila + i * fila) % tonos.length];
        paño(punto(interior, desde, .123), punto(interior, hasta, .123),
          punto(exterior, hasta, .123), punto(exterior, desde, .123), color);
      }
    });
  }
  hiladas([.259,.321,.394,.462], 42, ['#b9a58d','#b0a694','#aa9e81','#c1b19c','#9c9582']);
  hiladas([.478,.523,.568,.615,.661,.706,.742], 72, ['#62605a','#595a57','#52554f','#67675e','#5b5a54']);
  hiladas([.758,.863,.990], 52, ['#b9b5ab','#bcb7ad','#bbb9af','#afada5']);

  const pavimento = new THREE.BufferGeometry();
  pavimento.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  pavimento.setAttribute('color', new THREE.Float32BufferAttribute(colores, 3));
  pavimento.computeVertexNormals();
  const despiece = new THREE.Mesh(pavimento, new THREE.MeshStandardMaterial({vertexColors: true, roughness: .96}));
  despiece.name = 'Egresados_laja_adocreto_y_paso_perimetral';
  despiece.userData.disposeMaterial = true;
  despiece.receiveShadow = true;
  plaza.add(despiece);

  // El terreno continúa detrás de la grada. Se limita a la reserva que ya tenía
  // el teatro. La documentación histórica acredita ocho cipreses, cuya
  // posición y permanencia actuales quedan pendientes, por lo que no se dibujan.
  const pendiente = [], indicesTalud = [];
  const segmentos = 32;
  for (let i = 0; i <= segmentos; i++) {
    const angulo = .08 + (Math.PI - .16) * i / segmentos;
    pendiente.push(...punto(.943, angulo, .52), ...punto(.994, angulo, .25));
    const inicio = 2 * i;
    if (i < segmentos) indicesTalud.push(inicio, inicio + 2, inicio + 1, inicio + 1, inicio + 2, inicio + 3);
  }
  const talud = new THREE.BufferGeometry();
  talud.setAttribute('position', new THREE.Float32BufferAttribute(pendiente, 3));
  talud.setIndex(indicesTalud);
  talud.computeVertexNormals();
  const suave = new THREE.Mesh(talud, material('#777e56'));
  suave.name = 'Egresados_talud_curvo_tras_las_gradas';
  suave.receiveShadow = true;
  plaza.add(suave);

  const obra = new THREE.Group();
  obra.name = 'Intersecciones_escultura_esquematica';
  obra.userData = {title: 'Intersecciones', approximate: true, reference: fuente};
  obra.position.y = .22;
  plaza.add(obra);

  // La geometría de las cintas representa la silueta histórica. El basamento se muestra seco.
  const cinta = new THREE.Shape();
  cinta.moveTo(-1.12, 0);
  cinta.bezierCurveTo(-.85, .63, .18, .60, .49, 1.24);
  cinta.bezierCurveTo(.70, 1.59, .56, 1.92, .91, 2.09);
  cinta.bezierCurveTo(.82, 1.79, .99, 1.50, .79, 1.15);
  cinta.bezierCurveTo(.50, .54, -.48, .51, -.73, 0);
  cinta.closePath();

  const metal = new THREE.MeshStandardMaterial({color: '#a1a8a6', roughness: .47, metalness: .55});
  const perfil = new THREE.ExtrudeGeometry(cinta, {depth: .23, curveSegments: 12, bevelEnabled: false});
  perfil.translate(0, 0, -.115);
  const principal = new THREE.Mesh(perfil, metal);
  principal.name = 'Cinta_metalica_principal';
  principal.rotation.y = -.48;
  principal.castShadow = true;
  principal.userData.disposeMaterial = true;
  obra.add(principal);

  const cruzada = new THREE.Mesh(perfil, metal);
  cruzada.name = 'Cinta_metalica_cruzada';
  cruzada.rotation.y = 2.04;
  cruzada.scale.set(.86, .91, 1);
  cruzada.position.x = .17;
  cruzada.castShadow = true;
  obra.add(cruzada);
  return plaza;
}
