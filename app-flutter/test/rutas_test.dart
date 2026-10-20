import 'package:flutter_test/flutter_test.dart';
import 'package:latlong2/latlong.dart';

import 'package:salones_uam/rutas.dart';

/// Rutas con una red pequeña: A—B—C en línea y un atajo largo A—C (igual que RutasTest.kt).
void main() {
  const json = '''
    {
      "version": 1,
      "nodos": [
        { "id": "A", "lat": 19.5000, "lon": -99.1900, "x": 0, "z": 0, "nivel": 0, "tipo": "acceso" },
        { "id": "B", "lat": 19.5010, "lon": -99.1900, "x": 0, "z": 0, "nivel": 0, "tipo": "cruce" },
        { "id": "C", "lat": 19.5020, "lon": -99.1900, "x": 0, "z": 0, "nivel": 0, "tipo": "entrada" },
        { "id": "D", "lat": 19.6000, "lon": -99.1900, "x": 0, "z": 0, "nivel": 0, "tipo": "entrada" }
      ],
      "aristas": [
        { "de": "A", "a": "B", "metros": 110, "tipo": "exterior", "accesible": true },
        { "de": "B", "a": "C", "metros": 110, "tipo": "exterior", "accesible": true },
        { "de": "A", "a": "C", "metros": 500, "tipo": "exterior", "accesible": true }
      ],
      "destinos": [ { "id": "C", "nombre": "Edificio C", "nodo": "C" } ]
    }
  ''';
  final red = leerRed(json);

  test('elige el camino más corto', () {
    final ruta = red.rutaMasCorta('A', 'C')!;
    expect(ruta.metros, 220);
    expect(ruta.puntos.length, 3); // A, B y C: no el atajo de 500 m
    expect(ruta.minutos, 4); // 220 m a 1.2 m/s ≈ 3.1 min → 4
  });

  test('sin camino devuelve null', () {
    expect(red.rutaMasCorta('A', 'D'), isNull);
  });

  test('desde lejos empieza en el acceso más cercano', () {
    final (ruta, porAcceso) = red.rutaDesde(const LatLng(19.4900, -99.1900), red.destinos.first)!;
    expect(porAcceso, isTrue);
    expect(ruta.puntos.first, const LatLng(19.5000, -99.1900));
  });
}
