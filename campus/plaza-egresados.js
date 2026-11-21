// Huella aproximada al pie de HO, según la vista aérea y Aleph UAM, núm. 100, p. 28.
export const contornoPlazaEgresados = [
  [711, 298.5], [713, 293], [718, 289], [725, 287.5], [732, 289], [737, 293],
  [739, 298.5], [737, 304], [732, 308], [725, 309.5], [718, 308], [713, 304]
];

export function crearPlazaEgresados({THREE, world, material, X, Z}) {
  const plaza = new THREE.Group();
  plaza.name = 'Plaza_de_Egresados_HO';
  plaza.userData = {title: 'Plaza de Egresados', building: 'HO', approximate: true};
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

  banda('Paso_perimetral', 1, .75, .06, '#b5b1a5');
  banda('Paso_intermedio_de_adocreto', .75, .47, .06, '#535450');
  banda('Paso_interior_de_laja', .47, .25, .06, '#a89d88');
  banda('Zocalo_eliptico_Intersecciones', .25, 0, .22, '#c4bfb1');
  banda('Grada_interior_hemiciclo', .70, .57, .19, '#99988e', true);
  banda('Grada_media_hemiciclo', .83, .70, .34, '#a5a397', true);
  banda('Grada_exterior_hemiciclo', .95, .83, .49, '#adab9d', true);

  const obra = new THREE.Group();
  obra.name = 'Intersecciones_escultura_esquematica';
  obra.userData = {title: 'Intersecciones', approximate: true, reference: 'Aleph UAM núm. 100, p. 28'};
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
