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

/// Un proveedor de mapas. Ninguno necesita API key; si uno no carga, se elige otro.
class Proveedor {
  const Proveedor(this.nombre, this.teselas, {this.subdominios = const []});

  final String nombre;
  final String teselas;
  final List<String> subdominios;
}

const _arcgis = 'https://server.arcgisonline.com/ArcGIS/rest/services/';

const proveedores = [
  Proveedor('CARTO', 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      subdominios: ['a', 'b', 'c', 'd']),
  Proveedor('Esri calles', '${_arcgis}World_Street_Map/MapServer/tile/{z}/{y}/{x}'),
  Proveedor('Esri satélite', '${_arcgis}World_Imagery/MapServer/tile/{z}/{y}/{x}'),
  Proveedor('OpenStreetMap', 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'),
];

class _PantallaMapaState extends State<PantallaMapa> {
  Ubicacion _ubicacion = const Ubicacion(null, 'Buscando tu ubicación…');
  Proveedor _proveedor = proveedores.first;

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
      appBar: AppBar(
        title: const Text('Salones UAM · ¿Dónde estoy?'),
        actions: [
          PopupMenuButton<Proveedor>(
            icon: const Icon(Icons.layers),
            tooltip: 'Cambiar de mapa',
            onSelected: (p) => setState(() => _proveedor = p),
            itemBuilder: (context) => [
              for (final p in proveedores)
                CheckedPopupMenuItem(value: p, checked: p == _proveedor, child: Text(p.nombre)),
            ],
          ),
        ],
      ),
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
                  key: ValueKey(_proveedor.nombre),
                  urlTemplate: _proveedor.teselas,
                  subdomains: _proveedor.subdominios,
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
                  attributions: [TextSourceAttribution('OpenStreetMap contributors, CARTO y Esri')],
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
