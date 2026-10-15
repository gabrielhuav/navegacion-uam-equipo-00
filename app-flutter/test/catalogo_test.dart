import 'package:flutter_test/flutter_test.dart';

import 'package:salones_uam/catalogo.dart';

/// Pruebas unitarias: sólo lógica, sin widgets. Son las más rápidas.
void main() {
  group('normalizarClave', () {
    test('acepta la clave como viene en el horario', () {
      expect(normalizarClave('A-201'), 'A-201');
      expect(normalizarClave('a201'), 'A-201');
      expect(normalizarClave(' a 201 '), 'A-201');
      expect(normalizarClave('Salón A-201'), 'A-201');
      expect(normalizarClave('ho-201'), 'HO-201');
    });

    test('rechaza lo que no es edificio + número', () {
      expect(normalizarClave('201'), isNull);
      expect(normalizarClave('biblioteca'), isNull);
    });
  });

  group('buscarSalon', () {
    test('encuentra un salón del catálogo de ejemplo', () {
      final resultado = buscarSalon('g302');
      expect(resultado, isA<Encontrado>());
      final salon = (resultado as Encontrado).salon;
      expect(salon.edificio, 'G');
      expect(salon.piso, 3);
    });

    test('distingue clave vacía, formato inválido y salón inexistente', () {
      expect(buscarSalon('   '), isA<SinClave>());
      expect(buscarSalon('biblioteca'), isA<FormatoInvalido>());
      expect(buscarSalon('A-999'), isA<NoExiste>());
    });

    test('el mensaje dice edificio y piso, o por qué no se encontró', () {
      expect(mensaje(buscarSalon('A-201')), 'Edificio A · Piso 2');
      expect(
        mensaje(buscarSalon('A-999')),
        'No encontré A-999 en el catálogo de ejemplo. '
        'Revisa la clave en tu horario.',
      );
    });
  });
}
