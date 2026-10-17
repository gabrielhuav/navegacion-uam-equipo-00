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
      theme: ThemeData(), // el morado de Material 3 por omisión, igual que en KMP
      home: const PantallaMapa(),
    );
  }
}

class PantallaMapa extends StatefulWidget {
  const PantallaMapa({super.key});

  @override
  State<PantallaMapa> createState() => _PantallaMapaState();
}

/// Un proveedor de mapas: nombre, plantilla de teselas, crédito y el zoom más alto que tiene.
class Proveedor {
  const Proveedor(this.nombre, this.teselas, this.credito, [this.zoomMaximo = 19]);

  final String nombre;
  final String teselas;
  final String credito;
  final int zoomMaximo;
}

const _arcgis = 'https://server.arcgisonline.com/ArcGIS/rest/services/';

/// Los mismos que en KMP (Ubicacion.kt). Ninguno pide API key; si uno no carga, se elige otro.
/// CARTO ya pide API key y Google no permite usar sus teselas así: por eso no están.
const proveedores = [
  Proveedor('OpenStreetMap', 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', '© OpenStreetMap contributors'),
  Proveedor('OSM Humanitario', 'https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', '© OpenStreetMap · HOT'),
  Proveedor('CyclOSM', 'https://a.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', '© OpenStreetMap · CyclOSM', 18),
  Proveedor('OpenTopoMap', 'https://a.tile.opentopomap.org/{z}/{x}/{y}.png', '© OpenStreetMap · OpenTopoMap', 17),
  Proveedor('Esri calles', '${_arcgis}World_Street_Map/MapServer/tile/{z}/{y}/{x}', 'Tiles © Esri', 18),
  Proveedor('Esri satélite', '${_arcgis}World_Imagery/MapServer/tile/{z}/{y}/{x}', 'Tiles © Esri'),
  Proveedor('Esri topográfico', '${_arcgis}World_Topo_Map/MapServer/tile/{z}/{y}/{x}', 'Tiles © Esri', 18),
  Proveedor('Esri gris claro', '${_arcgis}Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', 'Tiles © Esri', 16),
  Proveedor('Esri gris oscuro', '${_arcgis}Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', 'Tiles © Esri', 16),
];

/// La misma pantalla que la de KMP: el mapa a pantalla completa, una tarjeta con el mensaje
/// y el menú «Mapa», y el botón «Ubicarme».
class _PantallaMapaState extends State<PantallaMapa> {
  Ubicacion _ubicacion = const Ubicacion(null, 'Buscando tu ubicación…');
  Proveedor _proveedor = proveedores.first;
  bool _falla = false;
  final _mapa = MapController();

  @override
  void initState() {
    super.initState();
    _ubicar();
  }

  Future<void> _ubicar() async {
    final ubicacion = await obtenerUbicacion();
    if (!mounted) return;
    setState(() => _ubicacion = ubicacion);
    // Si el mapa se arrastró o se acercó, «Ubicarme» lo regresa al lugar y al zoom 17.
    _mapa.move(ubicacion.punto ?? uamAzcapotzalco, 17);
  }

  @override
  Widget build(BuildContext context) {
    final yo = _ubicacion.punto;
    final texto = Theme.of(context).textTheme;

    return Scaffold(
      body: Stack(
        children: [
          FlutterMap(
            mapController: _mapa,
            options: MapOptions(
              initialCenter: yo ?? uamAzcapotzalco,
              initialZoom: 17,
              minZoom: 3,
              maxZoom: 19,
              // Se arrastra y se acerca con dos dedos, sin girar, igual que en KMP.
              interactionOptions: const InteractionOptions(flags: InteractiveFlag.all & ~InteractiveFlag.rotate),
            ),
            children: [
              TileLayer(
                key: ValueKey(_proveedor),
                urlTemplate: _proveedor.teselas,
                maxNativeZoom: _proveedor.zoomMaximo, // pasado este zoom se agrandan las teselas
                userAgentPackageName: 'com.example.salones_uam',
                errorTileCallback: (_, _, _) {
                  if (!_falla) setState(() => _falla = true);
                },
              ),
              if (yo != null)
                MarkerLayer(markers: [Marker(point: yo, width: 24, height: 24, child: const _Punto())]),
            ],
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 480),
                child: Card(
                  margin: EdgeInsets.zero,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 4, 8),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('¿Dónde estoy?', style: texto.titleLarge),
                              Text(_ubicacion.mensaje, style: texto.bodyMedium),
                            ],
                          ),
                        ),
                        // Si un proveedor no carga, se elige otro aquí.
                        PopupMenuButton<Proveedor>(
                          position: PopupMenuPosition.under,
                          onSelected: (p) => setState(() {
                            _proveedor = p;
                            _falla = false;
                          }),
                          itemBuilder: (context) => [
                            for (final p in proveedores)
                              PopupMenuItem(value: p, child: Text('${p == _proveedor ? '✓  ' : '     '}${p.nombre}')),
                          ],
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Text('Mapa ▾', style: TextStyle(color: Theme.of(context).colorScheme.primary)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
          Positioned(
            left: 0,
            bottom: 0,
            child: Container(
              color: const Color(0xCCFFFFFF),
              padding: const EdgeInsets.all(6),
              child: Text(_falla ? '${_proveedor.nombre} no carga: elige otro mapa.' : _proveedor.credito),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(onPressed: _ubicar, label: const Text('Ubicarme')),
    );
  }
}

/// Tu ubicación: un punto azul con borde blanco, como en KMP.
class _Punto extends StatelessWidget {
  const _Punto();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1A73E8),
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 3),
      ),
    );
  }
}
