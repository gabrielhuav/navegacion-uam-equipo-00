import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:salones_uam/tema.dart';

/// Temas del Prototipo 3, los mismos que en KMP (Tema.kt y CampusTest.kt).
void main() {
  test('de 7:00 a 18:59 es de día', () {
    for (final h in [7, 13, 18]) {
      expect(esDeNoche(h), isFalse, reason: '$h h');
    }
  });

  test('desde las 19:00 y antes de las 7:00 es de noche', () {
    for (final h in [19, 23, 0, 6]) {
      expect(esDeNoche(h), isTrue, reason: '$h h');
    }
  });

  test('en modo claro el color principal es el oficial de la unidad', () {
    expect(esquemaDeColor(Unidad.xochimilco, oscuro: false).primary, const Color(0xFF0072CE));
    expect(esquemaDeColor(Unidad.azcapotzalco, oscuro: false).primary, const Color(0xFFCD032E));
  });

  test('en modo oscuro el esquema es oscuro y el color se aclara', () {
    final s = esquemaDeColor(Unidad.iztapalapa, oscuro: true);
    expect(s.brightness, Brightness.dark);
    expect(s.primary.computeLuminance(), greaterThan(Unidad.iztapalapa.color.computeLuminance()));
  });

  test('recuerda lo elegido y lo vuelve a cargar al abrir', () async {
    TestWidgetsFlutterBinding.ensureInitialized();
    SharedPreferences.setMockInitialValues({'oscuro': true, 'unidad': 'lerma', 'iluminacion': 'noche'});
    await cargarAjustesTema();
    expect(ajustesTema.value.oscuro, isTrue);
    expect(ajustesTema.value.unidad, Unidad.lerma);
    expect(ajustesTema.value.iluminacion, Iluminacion.noche);

    ajustesTema.value = ajustesTema.value.copyWith(unidad: Unidad.cuajimalpa, oscuro: false);
    final p = await SharedPreferences.getInstance();
    expect(p.getString('unidad'), 'cuajimalpa');
    expect(p.getBool('oscuro'), isFalse);
  });
}
