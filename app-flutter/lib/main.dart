import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:model_viewer_plus/model_viewer_plus.dart';
import 'package:webview_flutter/webview_flutter.dart';

import 'campus.dart';
import 'rutas.dart';
import 'tema.dart';
import 'ubicacion.dart';

/// Prototipos 2 y 3: el campus de cada unidad de la UAM en el mapa real, en 2D y en 3D, con modo claro u oscuro,
/// el color de cada unidad y el campus de día o de noche.
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await cargarAjustesTema(); // tema, unidad y día o noche de la última vez
  runApp(const SalonesApp());
}

class SalonesApp extends StatelessWidget {
  const SalonesApp({super.key});

  @override
  Widget build(BuildContext context) {
    // Cuando cambia el tema, toda la app se vuelve a dibujar con sus colores.
    return ValueListenableBuilder(
      valueListenable: ajustesTema,
      builder: (context, a, _) => MaterialApp(
        title: 'Salones UAM',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(colorScheme: esquemaDeColor(a.unidad, oscuro: a.oscuro)),
        home: const PantallaMapa(),
      ),
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
  Proveedor(
    'CyclOSM',
    'https://a.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    '© OpenStreetMap · CyclOSM',
    18,
  ),
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
  final _con3D = <Unidad>[]; // cada 3D se crea la primera vez que se pide y luego sólo se oculta
  final _geo = <Unidad, Georreferencia>{};
  final _visor3D = <Unidad, WebViewController>{};
  final _aplicado3D = <Unidad, String>{};
  late Unidad _unidadAnterior = ajustesTema.value.unidad;
  bool _irALaSede = false; // «UAM» o «Ir» centran el mapa en la sede; «Ubicarme», en ti
  Red? _red; // Prototipo 3: la red de caminos de Azcapotzalco (campus/rutas.json)
  Ruta? _ruta;
  String _rutaTexto = '';
  LatLng? _centrarAlVolver; // si se eligió otra sede estando en 3D, el mapa se mueve al volver a Mapa o 2D
  final _mapa = MapController();
  int _hora = DateTime.now().hour;
  Timer? _reloj;

  /// De noche según la hora del teléfono, o lo que se eligió a mano en «Tema ▾».
  bool get _noche => switch (ajustesTema.value.iluminacion) {
    Iluminacion.automatica => esDeNoche(_hora),
    Iluminacion.dia => false,
    Iluminacion.noche => true,
  };

  @override
  void initState() {
    super.initState();
    for (final u in Unidad.values.where((u) => u.carpeta != null)) {
      rootBundle.loadString(georreferenciaDe(u)).then((json) {
        if (mounted) setState(() => _geo[u] = leerGeorreferencia(json));
      });
    }
    rootBundle.loadString('assets/campus/azcapotzalco/rutas.json').then((json) {
      if (mounted) setState(() => _red = leerRed(json));
    }, onError: (_) {}); // sin red, no hay botón «Ruta»
    ajustesTema.addListener(_alCambiarTema);
    _ubicar();
    // Revisa la hora cada minuto: al dar las 19:00 el campus se hace de noche.
    _reloj = Timer.periodic(const Duration(minutes: 1), (_) {
      if (DateTime.now().hour != _hora) setState(() => _hora = DateTime.now().hour);
    });
  }

  @override
  void dispose() {
    _reloj?.cancel();
    ajustesTema.removeListener(_alCambiarTema);
    super.dispose();
  }

  Unidad get _sede => ajustesTema.value.sede;

  /// Al elegir otra unidad en «Tema ▾»: ¿ir también a su campus?
  void _alCambiarTema() {
    final u = ajustesTema.value.unidad;
    if (u == _unidadAnterior) return;
    _unidadAnterior = u;
    if (u == _sede || !mounted) return;
    showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('¿Ir a la UAM ${u.nombre}?'),
        content: Text(
          u.carpeta != null
              ? 'El mapa, el plano 2D y el modelo 3D cambian a esa unidad.'
              : 'Su croquis todavía está en desarrollo: el mapa irá a la unidad y marcará dónde está.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Sólo el color')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Ir')),
        ],
      ),
    ).then((ir) {
      if (ir != true || !mounted) return;
      ajustesTema.value = ajustesTema.value.copyWith(sede: u);
      setState(() => _irALaSede = true);
      if (_vista != Vista.tresD) {
        _mapa.move(u.centro, 17);
      } else {
        _centrarAlVolver = u.centro;
      }
    });
  }

  /// Elegir origen y destino, y trazar la ruta más corta.
  Future<void> _pedirRuta(LatLng? yo) async {
    final red = _red;
    if (red == null) return;
    final elegido = await elegirRuta(context, red, conUbicacion: yo != null);
    if (elegido == null || !mounted) return;
    final (desde, hasta) = elegido;
    final calculada = desde == null
        ? red.rutaDesde(yo!, hasta)
        : switch (red.rutaMasCorta(desde.nodo, hasta.nodo)) {
            final r? => (r, false),
            null => null,
          };
    setState(() {
      _ruta = calculada?.$1;
      _rutaTexto = switch (calculada) {
        (final r, final porAcceso) =>
          'Ruta a ${hasta.nombre}: ${r.metros.round()} m · ${r.minutos} min a pie'
              '${porAcceso ? ' (desde el acceso más cercano)' : ''}',
        null => 'No hay camino hacia ${hasta.nombre}.',
      };
      _irALaSede = true;
    });
    _mapa.move(Unidad.azcapotzalco.centro, 17);
  }

  /// Fondo y luz del 3D sin recargar el modelo: de noche baja la exposición.
  void _actualizar3D(Color fondo) {
    final visor = _visor3D[_sede];
    final c = fondo.toARGB32().toRadixString(16).padLeft(8, '0').substring(2);
    final js =
        "const mv = document.querySelector('model-viewer');"
        "mv.exposure = ${_noche ? 0.35 : 1};"
        "mv.style.backgroundColor = '#$c'; document.body.style.backgroundColor = '#$c';";
    if (js == _aplicado3D[_sede] || visor == null) return;
    final sede = _sede;
    _aplicado3D[sede] = js;
    visor.runJavaScript(js).catchError((_) => _aplicado3D.remove(sede)); // aún cargando: se reintenta al dibujar
  }

  Future<void> _ubicar() async {
    final ubicacion = await obtenerUbicacion();
    if (!mounted) return;
    setState(() {
      _ubicacion = ubicacion;
      _irALaSede = false;
    });
    // Si el mapa se arrastró o se acercó, «Ubicarme» lo regresa al lugar y al zoom 17.
    if (_vista != Vista.tresD) _mapa.move(ubicacion.punto ?? _sede.centro, 17);
  }

  /// Posición de la cámara 3D: casi encima con el norte arriba, como el mapa; o inclinada.
  String _orbita(Georreferencia geo) =>
      '${giroConNorteArriba(geo)}deg ${_inclinada ? 55 : 8}deg ${_inclinada ? 520 : 600}m';

  void _inclinar() {
    setState(() => _inclinada = !_inclinada);
    // Sin recargar el modelo: se cambia la cámara de <model-viewer> desde Dart.
    for (final MapEntry(key: u, value: visor) in _visor3D.entries) {
      final geo = _geo[u];
      if (geo != null) visor.runJavaScript("document.querySelector('model-viewer').cameraOrbit = '${_orbita(geo)}';");
    }
  }

  @override
  Widget build(BuildContext context) {
    final yo = _ubicacion.punto;
    final texto = Theme.of(context).textTheme;
    final colores = Theme.of(context).colorScheme;
    final conMarca = ajustesTema.value.conMarca;
    final sede = _sede;
    final geo = _geo[sede];
    if (_vista == Vista.tresD && sede.carpeta != null && !_con3D.contains(sede)) _con3D.add(sede);
    WidgetsBinding.instance.addPostFrameCallback((_) => _actualizar3D(colores.surfaceContainer));
    final noche = _noche;

    return Scaffold(
      body: Stack(
        children: [
          for (final u in _con3D)
            if (_geo[u] case final g?)
              Offstage(
                // Con o sin marca son dos GLB: al cambiar, <model-viewer> se vuelve a crear con el otro.
                key: ValueKey((u, conMarca)),
                offstage: _vista != Vista.tresD || u != sede,
                child: ModelViewer(
                  src: modeloDe(u, conMarca: conMarca),
                  alt: 'Modelo 3D aproximado del campus UAM ${u.nombre}',
                  backgroundColor: colores.surfaceContainer,
                  cameraControls: true,
                  disableTap: true,
                  interactionPrompt: InteractionPrompt.none,
                  cameraOrbit: _orbita(g),
                  exposure: noche ? 0.35 : 1,
                  // Como en KMP y en la web: nunca menos de 12° sobre el horizonte.
                  minCameraOrbit: 'auto 0deg auto',
                  maxCameraOrbit: 'auto 78deg auto',
                  onWebViewCreated: (c) {
                    _visor3D[u] = c;
                    _aplicado3D.remove(u);
                  },
                ),
              ),
          if (_vista == Vista.tresD && sede.carpeta == null) _EnDesarrollo(sede),
          if (_vista != Vista.tresD)
            FlutterMap(
              mapController: _mapa,
              options: MapOptions(
                initialCenter: _irALaSede ? sede.centro : (yo ?? sede.centro),
                // El controlador conserva la posición anterior: initialCenter no basta al volver del 3D.
                onMapReady: () {
                  final c = _centrarAlVolver;
                  if (c == null) return;
                  _centrarAlVolver = null;
                  _mapa.move(c, 17);
                },
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
                // De noche se oscurece con un tono azul, igual que en KMP.
                if (geo != null)
                  ColorFiltered(
                    colorFilter: ColorFilter.mode(noche ? const Color(0xFF4A5680) : Colors.white, BlendMode.modulate),
                    child: OverlayImageLayer(
                      overlayImages: [
                        RotatedOverlayImage(
                          topLeftCorner: geo.superiorIzquierda,
                          bottomLeftCorner: geo.inferiorIzquierda,
                          bottomRightCorner: geo.inferiorDerecha,
                          opacity: _vista == Vista.mapa ? 0.85 : 1,
                          imageProvider: AssetImage(planoDe(sede, conMarca: conMarca)),
                        ),
                      ],
                    ),
                  ),
                // Unidad aún sin croquis: un cuadro de su color, de 240 m de lado, con «En desarrollo…».
                if (sede.carpeta == null) ...[
                  PolygonLayer(
                    polygons: [
                      Polygon(
                        points: _cuadro(sede.centro, 120),
                        color: sede.color.withValues(alpha: 0.18),
                        borderColor: sede.color,
                        borderStrokeWidth: 3,
                      ),
                    ],
                  ),
                  MarkerLayer(
                    markers: [
                      Marker(
                        point: sede.centro,
                        width: 220,
                        height: 40,
                        child: Center(
                          child: Text(
                            'En desarrollo…',
                            style: TextStyle(color: sede.color, fontSize: 20, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
                // La ruta: una línea gruesa del color de la app con borde blanco; inicio verde.
                if (_ruta case final r? when sede == Unidad.azcapotzalco && r.puntos.length >= 2) ...[
                  PolylineLayer(
                    polylines: [
                      Polyline(
                        points: r.puntos,
                        strokeWidth: 6,
                        color: colores.primary,
                        borderStrokeWidth: 3,
                        borderColor: Colors.white,
                      ),
                    ],
                  ),
                  CircleLayer(
                    circles: [
                      CircleMarker(point: r.puntos.first, radius: 7, color: const Color(0xFF2E7D32)),
                      CircleMarker(
                        point: r.puntos.last,
                        radius: 8,
                        color: colores.primary,
                        borderColor: Colors.white,
                        borderStrokeWidth: 2,
                      ),
                    ],
                  ),
                ],
                if (yo != null)
                  MarkerLayer(
                    markers: [Marker(point: yo, width: 24, height: 24, child: const _Punto())],
                  ),
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
                              Text(yo != null ? describir(yo, sede) : _ubicacion.mensaje, style: texto.bodyMedium),
                              if (_ruta != null && sede == Unidad.azcapotzalco)
                                Text(_rutaTexto, style: texto.bodyMedium?.copyWith(color: colores.primary)),
                              const SizedBox(height: 8),
                              // Mapa real con el plano encima, solo el plano, o el modelo 3D.
                              SegmentedButton<Vista>(
                                segments: [
                                  for (final v in Vista.values) ButtonSegment(value: v, label: Text(v.nombre)),
                                ],
                                selected: {_vista},
                                onSelectionChanged: (s) => setState(() => _vista = s.first),
                              ),
                            ],
                          ),
                        ),
                        // Tema arriba; si un proveedor no carga, se elige otro abajo.
                        Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const MenuTema(),
                            TextButton(onPressed: () => mostrarAjustes(context), child: const Text('⚙ Ajustes')),
                            PopupMenuButton<Proveedor>(
                              position: PopupMenuPosition.under,
                              onSelected: (p) => setState(() {
                                _proveedor = p;
                                _falla = false;
                              }),
                              itemBuilder: (context) => [
                                for (final p in proveedores)
                                  PopupMenuItem(
                                    value: p,
                                    child: Text('${p == _proveedor ? '✓  ' : '     '}${p.nombre}'),
                                  ),
                              ],
                              child: Padding(
                                padding: const EdgeInsets.all(12),
                                child: Text('Mapa ▾', style: TextStyle(color: colores.primary)),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
          // Marca de agua temporal: el autor del proyecto (se quita en Ajustes → modo desarrollador).
          if (conMarca)
            Positioned(
              left: 8,
              bottom: 40,
              child: SafeArea(
                child: Text(
                  '© @gabrielhuav',
                  style: texto.labelMedium?.copyWith(color: colores.onSurface.withValues(alpha: 0.55)),
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
                // Rutas: sólo en Azcapotzalco, mientras las otras unidades no tienen red de caminos.
                if (_red != null && sede == Unidad.azcapotzalco)
                  FloatingActionButton.extended(
                    heroTag: 'ruta',
                    onPressed: _ruta != null ? () => setState(() => _ruta = null) : () => _pedirRuta(yo),
                    label: Text(_ruta == null ? 'Ruta' : 'Quitar ruta'),
                  ),
                FloatingActionButton.extended(
                  heroTag: 'uam',
                  onPressed: () {
                    setState(() => _irALaSede = true);
                    _mapa.move(sede.centro, 17);
                  },
                  label: const Text('UAM'),
                ),
                FloatingActionButton.extended(heroTag: 'ubicarme', onPressed: _ubicar, label: const Text('Ubicarme')),
              ],
      ),
    );
  }
}

/// Las cuatro esquinas de un cuadro de `medio` metros a cada lado del centro.
List<LatLng> _cuadro(LatLng c, double medio) {
  final dLat = medio / 111320, dLon = medio / (111320 * cos(c.latitude * pi / 180));
  return [
    LatLng(c.latitude + dLat, c.longitude - dLon),
    LatLng(c.latitude + dLat, c.longitude + dLon),
    LatLng(c.latitude - dLat, c.longitude + dLon),
    LatLng(c.latitude - dLat, c.longitude - dLon),
  ];
}

/// En lugar del 3D, mientras la unidad no tiene croquis: un cuadro de su color con «En desarrollo…».
class _EnDesarrollo extends StatelessWidget {
  const _EnDesarrollo(this.sede);

  final Unidad sede;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: Theme.of(context).colorScheme.surfaceContainer,
      child: Center(
        child: Container(
          width: 220,
          height: 220,
          decoration: BoxDecoration(
            color: sede.color.withValues(alpha: 0.18),
            border: Border.all(color: sede.color, width: 3),
          ),
          alignment: Alignment.center,
          child: Text('En desarrollo…', style: TextStyle(color: sede.color, fontSize: 22)),
        ),
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
