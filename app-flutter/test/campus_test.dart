import 'package:flutter_test/flutter_test.dart';
import 'package:latlong2/latlong.dart';

import 'package:salones_uam/campus.dart';
import 'package:salones_uam/ubicacion.dart';

/// La lectura de campus/georreferencia.json, la misma que hace KMP (CampusTest.kt).
void main() {
  const json = '''
    {
      "plano": "plano_2d.png",
      "ancho": 1560,
      "alto": 640,
      "superiorIzquierda": [19.5012133, -99.1833458],
      "superiorDerecha": [19.502099, -99.1916483],
      "inferiorIzquierda": [19.504424, -99.1829603]
    }
  ''';

  test('lee el tamaño y las tres esquinas', () {
    final geo = leerGeorreferencia(json);
    expect(geo.ancho, 1560);
    expect(geo.alto, 640);
    expect(geo.superiorIzquierda.latitude, 19.5012133);
    expect(geo.inferiorIzquierda.longitude, -99.1829603);
  });

  test('sin una esquina avisa cuál falta', () {
    expect(
      () => leerGeorreferencia('{"ancho": 1, "alto": 1}'),
      throwsA(isA<StateError>().having((e) => e.message, 'message', 'Falta superiorIzquierda en georreferencia.json')),
    );
  });

  test('el norte del modelo es casi +z, como en KMP', () {
    final (x, z) = norteEnModelo(leerGeorreferencia(json));
    expect(z, greaterThan(0.98));
    expect(x, inInclusiveRange(0.05, 0.2));
  });

  test('el centro del plano cae sobre la UAM', () {
    final geo = leerGeorreferencia(json);
    final c = geo.inferiorDerecha;
    final centro = LatLng(
      (geo.superiorIzquierda.latitude + c.latitude) / 2,
      (geo.superiorIzquierda.longitude + c.longitude) / 2,
    );
    expect(describir(centro), 'Estás en la UAM Azcapotzalco.');
  });
}
