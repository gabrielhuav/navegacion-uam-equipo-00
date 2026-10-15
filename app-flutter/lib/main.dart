import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';

import 'ubicacion.dart';

/// Prototipo 1: abrir la app y ver en el mapa dónde estás dentro de la UAM.
void main() => runApp(const SalonesApp());

class SalonesApp extends StatelessWidget {
  const SalonesApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Salones UAM',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(colorSchemeSeed: Colors.deepPurple),
      home: const PantallaMapa(),
    );
  }
}

class PantallaMapa extends StatefulWidget {
  const PantallaMapa({super.key});

  @override
  State<PantallaMapa> createState() => _PantallaMapaState();
}

class _PantallaMapaState extends State<PantallaMapa> {
  Ubicacion _ubicacion = const Ubicacion(null, 'Buscando tu ubicación…');

  @override
  void initState() {
    super.initState();
    _ubicar();
  }

  Future<void> _ubicar() async {
    final ubicacion = await obtenerUbicacion();
    if (mounted) setState(() => _ubicacion = ubicacion);
  }

  @override
  Widget build(BuildContext context) {
    final yo = _ubicacion.punto;
    final centro = yo ?? uamAzcapotzalco;

    return Scaffold(
      appBar: AppBar(title: const Text('Salones UAM · ¿Dónde estoy?')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Text(
              _ubicacion.mensaje,
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ),
          Expanded(
            child: FlutterMap(
              // La clave cambia con el centro: así el mapa se recentra cuando llega la ubicación.
              key: ValueKey(centro),
              options: MapOptions(initialCenter: centro, initialZoom: 17),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.example.salones_uam',
                ),
                if (yo != null)
                  MarkerLayer(
                    markers: [
                      Marker(
                        point: yo,
                        width: 40,
                        height: 40,
                        child: const Icon(Icons.my_location, color: Colors.blue, size: 40),
                      ),
                    ],
                  ),
                const RichAttributionWidget(
                  attributions: [TextSourceAttribution('OpenStreetMap contributors')],
                ),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _ubicar,
        tooltip: 'Volver a ubicarme',
        child: const Icon(Icons.gps_fixed),
      ),
    );
  }
}
