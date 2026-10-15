import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:hola_mundo_flutter/main.dart';

/// Prueba de widget: arma la pantalla en memoria (sin teléfono), la "toca"
/// y revisa lo que se ve. Se ejecuta con `flutter test`.
void main() {
  testWidgets('muestra el saludo y cuenta los toques', (WidgetTester tester) async {
    // Se pasa una plataforma "de mentira" para no depender del sistema real.
    await tester.pumpWidget(const HolaMundoApp(plataforma: 'Pruebas'));

    expect(find.text('¡Hola, Mundo!'), findsOneWidget);
    expect(find.text('¡Hola desde Pruebas!'), findsOneWidget);
    expect(find.text('Todavía no has tocado el botón'), findsOneWidget);

    // Tocar el botón 3 veces.
    for (var i = 0; i < 3; i++) {
      await tester.tap(find.widgetWithText(FilledButton, 'Tócame'));
      await tester.pump(); // redibuja después de cada setState
    }

    expect(find.text('Has tocado el botón 3 veces'), findsOneWidget);
  });
}
