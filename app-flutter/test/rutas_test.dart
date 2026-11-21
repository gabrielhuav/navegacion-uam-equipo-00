import 'dart:convert';

import 'package:flutter/material.dart';
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
    final (ruta, porAcceso) = red.rutaDesde(
      const LatLng(19.4900, -99.1900),
      red.destinos.first,
    )!;
    expect(porAcceso, isTrue);
    expect(ruta.puntos.first, const LatLng(19.5000, -99.1900));
  });

  final datosPiloto = jsonDecode(json) as Map<String, dynamic>;
  datosPiloto['perimetro'] = [
    {'lat': 19.4995, 'lon': -99.1905},
    {'lat': 19.50205, 'lon': -99.1905},
    {'lat': 19.50205, 'lon': -99.1895},
    {'lat': 19.4995, 'lon': -99.1895},
  ];
  (datosPiloto['nodos'] as List)[3] = {
    'id': 'D',
    'lat': 19.502,
    'lon': -99.1899,
    'tipo': 'acceso',
  };
  (datosPiloto['aristas'] as List)
    ..removeLast()
    ..last['tipo'] = 'escalera';
  (datosPiloto['destinos'] as List).addAll([
    {'id': 'ACCESO_P1', 'nombre': 'Acceso P1', 'nodo': 'A'},
    {'id': 'ACCESO_P2', 'nombre': 'Acceso P2 sin conexión', 'nodo': 'D'},
    {
      'id': 'C001',
      'nombre': 'Sala C001',
      'nodo': 'C',
      'edificio': 'C',
      'nivel': 0,
      'referencia': 'Pórtico.',
    },
  ]);
  final piloto = leerRed(jsonEncode(datosPiloto));
  final sala = piloto.destinos.last;

  test('desde fuera evita empezar dentro y salta un acceso sin conexión', () {
    final (ruta, porAcceso) = piloto.rutaDesde(
      const LatLng(19.5021, -99.1900),
      sala,
    )!;
    expect(porAcceso, isTrue);
    expect(ruta.inicioAcceso, 'ACCESO_P1');
    expect(ruta.puntos.first, const LatLng(19.5000, -99.1900));
    expect(ruta.incluyeEscaleras, isTrue);
    expect(sala.edificio, 'C');
    expect(sala.piso, 'Planta baja');
    expect(sala.referencia, 'Pórtico.');
  });

  test('en el campus comienza en el tramo y no agrega el desvío al nodo', () {
    final (ruta, porAcceso) = piloto.rutaDesde(
      const LatLng(19.5005, -99.19001),
      sala,
    )!;
    expect(porAcceso, isFalse);
    expect(ruta.puntos.first.latitude, closeTo(19.5005, 1e-8));
    expect(ruta.puntos.first.longitude, closeTo(-99.1900, 1e-8));
    expect(ruta.metros, closeTo(165, 1e-6));
  });

  test(
    'si la ubicación interior está lejos de un andador pide un origen manual',
    () {
      expect(piloto.rutaDesde(const LatLng(19.5005, -99.1896), sala), isNull);
    },
  );

  testWidgets('filtra por código y selecciona la sala con su piso', (
    tester,
  ) async {
    (Destino?, Destino)? elegido;
    await tester.pumpWidget(
      MaterialApp(
        home: Builder(
          builder: (context) => TextButton(
            onPressed: () async => elegido = await elegirRuta(
              context,
              piloto,
              lugar: 'Azcapotzalco',
              conUbicacion: true,
            ),
            child: const Text('Elegir ruta'),
          ),
        ),
      ),
    );
    await tester.tap(find.text('Elegir ruta'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField), 'c001');
    await tester.pumpAndSettle();
    await tester.tap(find.text('Elige tu destino  ▾'));
    await tester.pumpAndSettle();
    expect(find.text('Edificio C'), findsNothing);
    await tester.tap(find.text('Sala C001 · Planta baja'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Trazar'));
    await tester.pumpAndSettle();
    expect(elegido, (null, sala));
  });
}
