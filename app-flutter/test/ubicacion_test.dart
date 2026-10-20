import 'package:flutter_test/flutter_test.dart';
import 'package:latlong2/latlong.dart';

import 'package:salones_uam/ubicacion.dart';

/// Pruebas de la parte que no depende del teléfono: describir dónde estás.
void main() {
  test('en el centro de la UAM dice que estás en la UAM', () {
    expect(describir(uamAzcapotzalco), 'Estás en la UAM Azcapotzalco.');
  });

  test('lejos de la UAM dice a cuántos kilómetros queda', () {
    const zocalo = LatLng(19.4326, -99.1332);
    expect(describir(zocalo), startsWith('Estás a '));
    expect(describir(zocalo), endsWith(' km de la UAM Azcapotzalco.'));
  });
}
