import 'package:flutter/material.dart';

import 'plataforma.dart';
import 'saludo.dart';

/// Punto de entrada: Android e iOS arrancan AQUÍ, con el mismo código.
void main() {
  runApp(HolaMundoApp(plataforma: nombrePlataforma()));
}

/// La app completa. Recibe el nombre de la plataforma como parámetro para
/// que las pruebas puedan pasarle uno "de mentira" (ver test/widget_test.dart).
class HolaMundoApp extends StatelessWidget {
  const HolaMundoApp({super.key, required this.plataforma});

  final String plataforma;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Hola Mundo Flutter',
      debugShowCheckedModeBanner: false,
      // Tema claro u oscuro según el sistema del teléfono.
      themeMode: ThemeMode.system,
      theme: ThemeData(
        colorSchemeSeed: Colors.deepPurple,
        brightness: Brightness.light,
      ),
      darkTheme: ThemeData(
        colorSchemeSeed: Colors.deepPurple,
        brightness: Brightness.dark,
      ),
      home: PantallaInicio(plataforma: plataforma),
    );
  }
}

/// La pantalla. Es `StatefulWidget` porque guarda un dato que cambia: el contador.
class PantallaInicio extends StatefulWidget {
  const PantallaInicio({super.key, required this.plataforma});

  final String plataforma;

  @override
  State<PantallaInicio> createState() => _PantallaInicioState();
}

class _PantallaInicioState extends State<PantallaInicio> {
  int _veces = 0;

  void _tocar() {
    // setState avisa a Flutter que el estado cambió y que debe redibujar.
    setState(() => _veces++);
  }

  @override
  Widget build(BuildContext context) {
    final tema = Theme.of(context);

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '¡Hola, Mundo!',
                  style: tema.textTheme.displaySmall?.copyWith(
                    color: tema.colorScheme.primary,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Flutter · Android + iOS',
                  style: tema.textTheme.titleMedium,
                ),
                const SizedBox(height: 32),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 16,
                    ),
                    child: Text(
                      saludar(widget.plataforma),
                      style: tema.textTheme.titleLarge,
                    ),
                  ),
                ),
                const SizedBox(height: 32),
                FilledButton(
                  onPressed: _tocar,
                  child: const Text('Tócame'),
                ),
                const SizedBox(height: 16),
                Text(
                  textoContador(_veces),
                  style: tema.textTheme.bodyLarge,
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
