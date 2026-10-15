import 'package:flutter/material.dart';

import 'catalogo.dart';
import 'plataforma.dart';

/// Punto de entrada: Android e iOS arrancan AQUÍ, con el mismo código.
void main() {
  runApp(SalonesApp(plataforma: nombrePlataforma()));
}

/// La app completa. Recibe el nombre de la plataforma como parámetro para
/// que las pruebas puedan pasarle uno "de mentira" (ver test/widget_test.dart).
class SalonesApp extends StatelessWidget {
  const SalonesApp({super.key, required this.plataforma});

  final String plataforma;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Salones UAM',
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
      home: PantallaBuscar(plataforma: plataforma),
    );
  }
}

/// Pantalla del Prototipo 1: escribir la clave del horario y ver dónde está.
/// Es `StatefulWidget` porque guarda datos que cambian: el texto y el resultado.
class PantallaBuscar extends StatefulWidget {
  const PantallaBuscar({super.key, required this.plataforma});

  final String plataforma;

  @override
  State<PantallaBuscar> createState() => _PantallaBuscarState();
}

class _PantallaBuscarState extends State<PantallaBuscar> {
  final _clave = TextEditingController();
  Resultado? _resultado;

  void _buscar() {
    // setState avisa a Flutter que el estado cambió y que debe redibujar.
    setState(() => _resultado = buscarSalon(_clave.text));
  }

  @override
  void dispose() {
    _clave.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tema = Theme.of(context);
    final resultado = _resultado;

    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text(
              'Salones UAM',
              style: tema.textTheme.displaySmall?.copyWith(
                color: tema.colorScheme.primary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Prototipo 1 · Buscar el salón del horario',
              style: tema.textTheme.titleMedium,
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _clave,
              textCapitalization: TextCapitalization.characters,
              textInputAction: TextInputAction.search,
              onSubmitted: (_) => _buscar(),
              decoration: const InputDecoration(
                labelText: 'Salón de tu horario',
                hintText: 'Ejemplo: A-201',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: _buscar,
              icon: const Icon(Icons.search),
              label: const Text('Buscar'),
            ),
            const SizedBox(height: 24),
            if (resultado != null) TarjetaResultado(resultado: resultado),
            const SizedBox(height: 24),
            Text(
              'Prueba con A-201, g302 o una clave que no exista.',
              style: tema.textTheme.bodyMedium,
            ),
            const SizedBox(height: 8),
            Text(
              'Datos de ejemplo · ${catalogoDeEjemplo.length} salones · '
              'Flutter en ${widget.plataforma}',
              style: tema.textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }
}

/// Tarjeta con la respuesta: color principal si se encontró, de error si no.
class TarjetaResultado extends StatelessWidget {
  const TarjetaResultado({super.key, required this.resultado});

  final Resultado resultado;

  @override
  Widget build(BuildContext context) {
    final colores = Theme.of(context).colorScheme;
    final textos = Theme.of(context).textTheme;
    final encontrado = resultado is Encontrado;
    final colorTexto =
        encontrado ? colores.onPrimaryContainer : colores.onErrorContainer;

    return Card(
      color: encontrado ? colores.primaryContainer : colores.errorContainer,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(
              encontrado ? Icons.place : Icons.error_outline,
              color: colorTexto,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (resultado case Encontrado(:final salon))
                    Text(
                      salon.clave,
                      style: textos.headlineSmall?.copyWith(color: colorTexto),
                    ),
                  Text(
                    mensaje(resultado),
                    style: textos.bodyLarge?.copyWith(color: colorTexto),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
