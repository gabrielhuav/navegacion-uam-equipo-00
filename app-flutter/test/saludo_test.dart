import 'package:flutter_test/flutter_test.dart';

import 'package:hola_mundo_flutter/saludo.dart';

/// Pruebas unitarias: solo lógica, sin widgets. Son las más rápidas.
void main() {
  test('saluda con el nombre de la plataforma', () {
    expect(saludar('Android'), '¡Hola desde Android!');
    expect(saludar('iOS'), '¡Hola desde iOS!');
  });

  test('el contador usa singular y plural', () {
    expect(textoContador(0), 'Todavía no has tocado el botón');
    expect(textoContador(1), 'Has tocado el botón 1 vez');
    expect(textoContador(5), 'Has tocado el botón 5 veces');
  });
}
