import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:salones_uam/main.dart';

/// Prueba de widget: arma la pantalla en memoria (sin teléfono), escribe una
/// clave, toca Buscar y revisa lo que se ve. Se ejecuta con `flutter test`.
void main() {
  testWidgets('encuentra un salón del catálogo de ejemplo', (tester) async {
    // Se pasa una plataforma "de mentira" para no depender del sistema real.
    await tester.pumpWidget(const SalonesApp(plataforma: 'Pruebas'));

    expect(find.text('Salones UAM'), findsOneWidget);

    await tester.enterText(find.byType(TextField), 'a201');
    await tester.tap(find.text('Buscar'));
    await tester.pump(); // redibuja después de setState

    expect(find.text('A-201'), findsOneWidget);
    expect(find.text('Edificio A · Piso 2'), findsOneWidget);
  });

  testWidgets('avisa cuando el salón no existe', (tester) async {
    await tester.pumpWidget(const SalonesApp(plataforma: 'Pruebas'));

    await tester.enterText(find.byType(TextField), 'Z-999');
    await tester.tap(find.text('Buscar'));
    await tester.pump();

    expect(find.textContaining('No encontré Z-999'), findsOneWidget);
  });
}
