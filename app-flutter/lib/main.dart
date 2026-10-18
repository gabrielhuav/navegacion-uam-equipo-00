import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:flutter_map/flutter_map.dart';
import 'package:model_viewer_plus/model_viewer_plus.dart';
import 'package:webview_flutter/webview_flutter.dart';

import 'campus.dart';
import 'ubicacion.dart';

/// Prototipo 2: el campus de la UAM en el mapa real, en 2D y en 3D.
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

/// La misma pantalla que la de KMP: el campus a pantalla completa (Mapa, 2D o 3D), una tarjeta
/// con el mensaje y el menú «Mapa», y los botones «UAM» y «Ubicarme» (en 3D, «Inclinar» o «Desde arriba»).
class _PantallaMapaState extends State<PantallaMapa> {
  Ubicacion _ubicacion = const Ubicacion(null, 'Buscando tu ubicación…');
  Proveedor _proveedor = proveedores.first;
  bool _falla = false;
  Vista _vista = Vista.mapa;
  bool _inclinada = false;
  bool _con3D = false; // el 3D se crea la primera vez que se pide y luego solo se oculta
  Georreferencia? _geo;
  WebViewController? _visor3D;
  final _mapa = MapController();

  @override
  void initState() {
    super.initState();
    rootBundle.loadString(georreferenciaCampus).then((json) {
      if (mounted) setState(() => _geo = leerGeorreferencia(json));
    });
    _ubicar();
  }

  Future<void> _ubicar() async {
    final ubicacion = await obtenerUbicacion();
    if (!mounted) return;
    setState(() => _ubicacion = ubicacion);
    // Si el mapa se arrastró o se acercó, «Ubicarme» lo regresa al lugar y al zoom 17.
    if (_vista != Vista.tresD) _mapa.move(ubicacion.punto ?? uamAzcapotzalco, 17);
  }

  /// Posición de la cámara 3D: casi encima con el norte arriba, como el mapa; o inclinada.
  String _orbita(Georreferencia geo) => '${giroConNorteArriba(geo)}deg ${_inclinada ? 55 : 8}deg ${_inclinada ? 520 : 600}m';

  void _inclinar() {
    setState(() => _inclinada = !_inclinada);
    final geo = _geo;
    if (geo == null) return;
    // Sin recargar el modelo: se cambia la cámara de <model-viewer> desde Dart.
    _visor3D?.runJavaScript("document.querySelector('model-viewer').cameraOrbit = '${_orbita(geo)}';");
  }

  @override
  Widget build(BuildContext context) {
    final yo = _ubicacion.punto;
    final texto = Theme.of(context).textTheme;
    final colores = Theme.of(context).colorScheme;
    final geo = _geo;
    if (_vista == Vista.tresD) _con3D = true;

    return Scaffold(
      body: Stack(
        children: [
          if (_con3D && geo != null)
            Offstage(
              offstage: _vista != Vista.tresD,
              child: ModelViewer(
                src: modeloCampus,
                alt: 'Modelo 3D aproximado del campus UAM Azcapotzalco',
                backgroundColor: colores.surfaceContainer,
                cameraControls: true,
                disableTap: true,
                interactionPrompt: InteractionPrompt.none,
                cameraOrbit: _orbita(geo),
                // Como en KMP y en la web: nunca menos de 12° sobre el horizonte.
                minCameraOrbit: 'auto 0deg auto',
                maxCameraOrbit: 'auto 78deg auto',
                onWebViewCreated: (c) => _visor3D = c,
              ),
            ),
          if (_vista != Vista.tresD)
            FlutterMap(
              mapController: _mapa,
              options: MapOptions(
                initialCenter: yo ?? uamAzcapotzalco,
                initialZoom: 17,
                minZoom: 3,
                maxZoom: 19,
                backgroundColor: _vista == Vista.plano ? colores.surfaceContainer : const Color(0xFFE8E8E8),
                // Se arrastra y se acerca con dos dedos, sin girar, igual que en KMP.
                interactionOptions: const InteractionOptions(flags: InteractiveFlag.all & ~InteractiveFlag.rotate),
              ),
              children: [
                if (_vista == Vista.mapa)
                  TileLayer(
                    key: ValueKey(_proveedor),
                    urlTemplate: _proveedor.teselas,
                    maxNativeZoom: _proveedor.zoomMaximo, // pasado este zoom se agrandan las teselas
                    userAgentPackageName: 'com.example.salones_uam',
                    errorTileCallback: (_, _, _) {
                      if (!_falla) setState(() => _falla = true);
                    },
                  ),
                // El plano del campus, girado y escalado para caer en sus esquinas reales.
                if (geo != null)
                  OverlayImageLayer(overlayImages: [
                    RotatedOverlayImage(
                      topLeftCorner: geo.superiorIzquierda,
                      bottomLeftCorner: geo.inferiorIzquierda,
                      bottomRightCorner: geo.inferiorDerecha,
                      opacity: _vista == Vista.mapa ? 0.85 : 1,
                      imageProvider: const AssetImage(planoCampus),
                    ),
                  ]),
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
                              Text('Campus UAM', style: texto.titleLarge),
                              Text(_ubicacion.mensaje, style: texto.bodyMedium),
                              const SizedBox(height: 8),
                              // Mapa real con el plano encima, solo el plano, o el modelo 3D.
                              SegmentedButton<Vista>(
                                segments: [for (final v in Vista.values) ButtonSegment(value: v, label: Text(v.nombre))],
                                selected: {_vista},
                                onSelectionChanged: (s) => setState(() => _vista = s.first),
                              ),
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
                            child: Text('Mapa ▾', style: TextStyle(color: colores.primary)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
          if (_vista != Vista.tresD)
            Positioned(
              left: 0,
              bottom: 0,
              child: Container(
                color: colores.surface.withValues(alpha: 0.8),
                padding: const EdgeInsets.all(6),
                child: Text(switch (_vista) {
                  Vista.plano => 'Plano 2D aproximado del campus',
                  _ when _falla => '${_proveedor.nombre} no carga: elige otro mapa.',
                  _ => _proveedor.credito,
                }),
              ),
            ),
        ],
      ),
      floatingActionButton: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.end,
        spacing: 12,
        children: _vista == Vista.tresD
            ? [
                FloatingActionButton.extended(
                  heroTag: 'inclinar',
                  onPressed: _inclinar,
                  label: Text(_inclinada ? 'Desde arriba' : 'Inclinar'),
                ),
              ]
            : [
                FloatingActionButton.extended(
                  heroTag: 'uam',
                  onPressed: () => _mapa.move(uamAzcapotzalco, 17),
                  label: const Text('UAM'),
                ),
                FloatingActionButton.extended(heroTag: 'ubicarme', onPressed: _ubicar, label: const Text('Ubicarme')),
              ],
      ),
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
