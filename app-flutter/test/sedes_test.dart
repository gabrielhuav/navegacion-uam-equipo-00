import 'package:flutter_test/flutter_test.dart';

import 'package:salones_uam/tema.dart';
import 'package:salones_uam/ubicacion.dart';

/// Las cinco unidades: cuáles tienen croquis y qué dice el mensaje en cada una (igual que SedesTest.kt).
void main() {
  test('Azcapotzalco, Cuajimalpa e Iztapalapa tienen croquis', () {
    expect(Unidad.values.map((u) => u.carpeta).nonNulls.toList(), ['azcapotzalco', 'cuajimalpa', 'iztapalapa']);
    expect(Unidad.lerma.carpeta, isNull);
    expect(Unidad.xochimilco.carpeta, isNull);
  });

  test('en el centro de cada unidad dice que estás ahí', () {
    for (final u in Unidad.values) {
      expect(describir(u.centro, u), 'Estás en la UAM ${u.nombre}.');
    }
  });

  test('desde Azcapotzalco, Cuajimalpa queda lejos', () {
    final texto = describir(uamAzcapotzalco, Unidad.cuajimalpa);
    expect(texto, startsWith('Estás a '));
    expect(texto, endsWith(' km de la UAM Cuajimalpa.'));
  });
}
