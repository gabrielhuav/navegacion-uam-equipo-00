/// Rutas dentro del campus. Comparte la red con Rutas.kt de KMP.
/// La red de caminos sale de `campus/rutas.json` (la dibuja Codex en el visor web): nodos con su latitud y
/// longitud, aristas con sus metros y un nodo por destino (edificios y accesos).
library;

import 'dart:convert';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';

class Nodo {
  const Nodo(this.id, this.lugar, this.tipo);
  final String id;
  final LatLng lugar;
  final String tipo;
}

class Destino {
  const Destino(
    this.id,
    this.nombre,
    this.nodo, {
    this.edificio,
    this.nivel,
    this.referencia,
  });
  final String id;
  final String nombre;
  final String nodo;
  final String? edificio;
  final int? nivel;
  final String? referencia;

  String? get piso => switch (nivel) {
    0 => 'Planta baja',
    final n? => 'Piso $n',
    null => null,
  };
}

/// Una ruta: los puntos por los que pasa (para dibujarla) y su longitud.
class Ruta {
  const Ruta(
    this.puntos,
    this.metros, {
    this.inicioAcceso,
    this.incluyeEscaleras = false,
  });
  final List<LatLng> puntos;
  final double metros;
  final String? inicioAcceso;
  final bool incluyeEscaleras;

  /// A 1.2 m/s, el paso de una persona caminando. Al menos un minuto.
  int get minutos => (metros / 1.2 / 60).ceil().clamp(1, 1 << 30);
}

typedef Arista = ({String de, String a, double metros, String tipo});

class Red {
  Red(this.nodos, this._aristas, this.destinos, {this.perimetro = const []}) {
    for (final arista in _aristas) {
      (_vecinos[arista.de] ??= []).add((arista.a, arista));
      (_vecinos[arista.a] ??= []).add((arista.de, arista));
    }
  }

  final Map<String, Nodo> nodos;
  final List<Destino> destinos;
  final List<LatLng> perimetro;
  final List<Arista> _aristas;
  final _vecinos = <String, List<(String, Arista)>>{};
  static const _distancia = Distance(roundResult: false);
  static const _accesosPeatonalesAzc = {
    'ACCESO_PUERTA_2',
    'ACCESO_P1',
    'ACCESO_P2',
    'ACCESO_P3',
  };
  static const _tramosDeOrigen = {'exterior', 'pasillo', 'rampa'};

  /// El camino más corto entre dos nodos (algoritmo de Dijkstra). Null si no hay camino.
  Ruta? rutaMasCorta(String desde, String hasta, {String? inicioAcceso}) {
    if (!nodos.containsKey(desde) || !nodos.containsKey(hasta)) return null;
    final distancia = {desde: 0.0};
    final previo = <String, (String, Arista)>{};
    final pendientes = {desde};
    final cerrados = <String>{};
    while (pendientes.isNotEmpty) {
      final actual = pendientes.reduce(
        (a, b) => distancia[a]! <= distancia[b]! ? a : b,
      );
      if (actual == hasta) break;
      pendientes.remove(actual);
      cerrados.add(actual);
      for (final (vecino, arista)
          in _vecinos[actual] ?? const <(String, Arista)>[]) {
        if (cerrados.contains(vecino)) continue;
        final nueva = distancia[actual]! + arista.metros;
        if (nueva < (distancia[vecino] ?? double.infinity)) {
          distancia[vecino] = nueva;
          previo[vecino] = (actual, arista);
          pendientes.add(vecino);
        }
      }
    }
    final total = distancia[hasta];
    if (total == null) return null;
    final camino = <String>[hasta];
    var escaleras = false;
    for (var paso = previo[hasta]; paso != null; paso = previo[paso.$1]) {
      camino.add(paso.$1);
      escaleras |= paso.$2.tipo == 'escalera';
    }
    return Ruta(
      [for (final id in camino.reversed) nodos[id]!.lugar],
      total,
      inicioAcceso: inicioAcceso,
      incluyeEscaleras: escaleras,
    );
  }

  /// El nodo más cercano a un punto; con [tipo], sólo de ese tipo (por ejemplo «acceso»).
  Nodo masCercano(LatLng u, {String? tipo}) => nodos.values
      .where((n) => tipo == null || n.tipo == tipo)
      .reduce(
        (a, b) =>
            _distancia.distance(u, a.lugar) <= _distancia.distance(u, b.lugar)
            ? a
            : b,
      );

  /// Las redes delimitadas comienzan en un tramo cercano o en un acceso peatonal.
  /// Las redes anteriores conservan el criterio de distancia al nodo más cercano.
  (Ruta, bool)? rutaDesde(LatLng yo, Destino hasta, {double lejos = 150}) {
    if (!(yo.latitude.abs() <= 90 && yo.longitude.abs() <= 180) ||
        nodos.isEmpty) {
      return null;
    }
    if (perimetro.length >= 3) {
      if (!_dentroDelPredio(yo)) {
        final accesos = destinos
            .where(
              (d) =>
                  _accesosPeatonalesAzc.contains(d.id) &&
                  nodos[d.nodo]?.tipo == 'acceso',
            )
            .toList();
        accesos.sort(
          (a, b) => _distancia
              .distance(yo, nodos[a.nodo]!.lugar)
              .compareTo(_distancia.distance(yo, nodos[b.nodo]!.lugar)),
        );
        for (final acceso in accesos) {
          final ruta = rutaMasCorta(
            acceso.nodo,
            hasta.nodo,
            inicioAcceso: acceso.id,
          );
          if (ruta != null) return (ruta, true);
        }
        return null;
      }
      final ruta = _rutaDesdeAndador(yo, hasta.nodo);
      return ruta == null ? null : (ruta, false);
    }
    final cerca = masCercano(yo);
    final porAcceso = _distancia.distance(yo, cerca.lugar) > lejos;
    if (porAcceso && !nodos.values.any((n) => n.tipo == 'acceso')) return null;
    final inicio = porAcceso ? masCercano(yo, tipo: 'acceso') : cerca;
    final acceso = porAcceso
        ? destinos
              .where((d) => d.nodo == inicio.id && d.edificio == null)
              .firstOrNull
        : null;
    final ruta = rutaMasCorta(inicio.id, hasta.nodo, inicioAcceso: acceso?.id);
    return ruta == null ? null : (ruta, porAcceso);
  }

  bool _dentroDelPredio(LatLng yo) {
    var dentro = false;
    for (var i = 0; i < perimetro.length; i++) {
      final a = perimetro[i];
      final b = perimetro[(i + 1) % perimetro.length];
      final proyeccion = _proyectar(yo, a, b).$1;
      if (_distancia.distance(yo, proyeccion) <= 0.001) return true;
      if ((a.latitude > yo.latitude) == (b.latitude > yo.latitude)) continue;
      final cruce =
          a.longitude +
          (b.longitude - a.longitude) *
              (yo.latitude - a.latitude) /
              (b.latitude - a.latitude);
      if (yo.longitude < cruce) dentro = !dentro;
    }
    return dentro;
  }

  Ruta? _rutaDesdeAndador(LatLng yo, String hasta) {
    var margen = 20.0;
    (Arista, LatLng, double)? ajuste;
    for (final arista in _aristas) {
      if (!_tramosDeOrigen.contains(arista.tipo)) continue;
      final a = nodos[arista.de]?.lugar;
      final b = nodos[arista.a]?.lugar;
      if (a == null || b == null) continue;
      final (punto, fraccion) = _proyectar(yo, a, b);
      final metros = _distancia.distance(yo, punto);
      if (metros > margen || (metros == margen && ajuste != null)) continue;
      ajuste = (arista, punto, fraccion);
      margen = metros;
    }
    if (ajuste == null) return null;
    final (arista, punto, fraccion) = ajuste;
    Ruta? mejor;
    for (final (nodo, distancia) in [
      (arista.de, fraccion),
      (arista.a, 1 - fraccion),
    ]) {
      final ruta = rutaMasCorta(nodo, hasta);
      if (ruta == null) continue;
      final metros = ruta.metros + arista.metros * distancia;
      if (mejor != null && metros >= mejor.metros) continue;
      mejor = Ruta(
        [if (punto != ruta.puntos.first) punto, ...ruta.puntos],
        metros,
        incluyeEscaleras: ruta.incluyeEscaleras,
      );
    }
    return mejor;
  }

  (LatLng, double) _proyectar(LatLng yo, LatLng a, LatLng b) {
    final escala = math.cos(yo.latitude * math.pi / 180);
    final dx = (b.longitude - a.longitude) * escala;
    final dy = b.latitude - a.latitude;
    final longitudCuadrada = dx * dx + dy * dy;
    if (longitudCuadrada == 0) return (a, 0);
    final fraccion =
        ((dx * (yo.longitude - a.longitude) * escala +
                    dy * (yo.latitude - a.latitude)) /
                longitudCuadrada)
            .clamp(0.0, 1.0);
    return (
      LatLng(
        a.latitude + dy * fraccion,
        a.longitude + (b.longitude - a.longitude) * fraccion,
      ),
      fraccion,
    );
  }
}

/// Lee rutas.json.
Red leerRed(String json) {
  final d = jsonDecode(json) as Map<String, dynamic>;
  List<Map<String, dynamic>> lista(String k) =>
      (d[k] as List? ?? (throw StateError('Falta $k en rutas.json')))
          .cast<Map<String, dynamic>>();
  LatLng punto(Map<String, dynamic> dato) =>
      LatLng((dato['lat'] as num).toDouble(), (dato['lon'] as num).toDouble());
  return Red(
    {
      for (final n in lista('nodos'))
        n['id'] as String: Nodo(
          n['id'] as String,
          punto(n),
          n['tipo'] as String,
        ),
    },
    [
      for (final a in lista('aristas'))
        (
          de: a['de'] as String,
          a: a['a'] as String,
          metros: (a['metros'] as num).toDouble(),
          tipo: a['tipo'] as String? ?? 'exterior',
        ),
    ],
    [
      for (final x in lista('destinos'))
        Destino(
          x['id'] as String,
          x['nombre'] as String,
          x['nodo'] as String,
          edificio: x['edificio'] as String?,
          nivel: x['nivel'] as int?,
          referencia: x['referencia'] as String?,
        ),
    ],
    perimetro: [
      if (d['perimetro'] != null)
        for (final p in lista('perimetro')) punto(p),
    ],
  );
}

/// Elegir de dónde a dónde. Origen: tu ubicación (null) o un lugar; destino: un lugar. Igual que ElegirRuta.kt.
Future<(Destino?, Destino)?> elegirRuta(
  BuildContext context,
  Red red, {
  required String lugar,
  required bool conUbicacion,
}) {
  final lugares = [...red.destinos]
    ..sort((a, b) => a.nombre.compareTo(b.nombre));
  final origenes = lugares.where((d) => d.edificio == null).toList();
  final buscar = origenes.length != lugares.length;
  Destino? desde, hasta;
  var filtro = '';
  return showDialog<(Destino?, Destino)>(
    context: context,
    builder: (context) => StatefulBuilder(
      builder: (context, setState) {
        Widget selector(
          String vacio,
          Destino? valor,
          List<Destino> opciones,
          ValueChanged<Destino?> elegir, {
          String? primera,
        }) => PopupMenuButton<(Destino?,)>(
          onSelected: (v) => setState(() => elegir(v.$1)),
          itemBuilder: (context) => [
            if (primera != null)
              PopupMenuItem(value: (null,), child: Text(primera)),
            for (final l in opciones)
              PopupMenuItem(
                value: (l,),
                child: Text([l.nombre, ?l.piso].join(' · ')),
              ),
          ],
          child: InputDecorator(
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              isDense: true,
            ),
            child: Text(
              '${[valor?.nombre ?? vacio, ?valor?.piso].join(' · ')}  ▾',
            ),
          ),
        );
        final opciones = lugares
            .where((d) => '${d.nombre} ${d.id}'.toLowerCase().contains(filtro))
            .toList();
        final listo =
            hasta != null &&
            (desde != null || conUbicacion) &&
            desde?.nodo != hasta?.nodo;
        return AlertDialog(
          title: Text('Ruta en $lugar'),
          scrollable: true,
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Desde'),
              const SizedBox(height: 4),
              selector(
                conUbicacion ? 'Mi ubicación' : 'Elige un lugar',
                desde,
                origenes,
                (v) => desde = v,
                primera: conUbicacion ? 'Mi ubicación' : null,
              ),
              const SizedBox(height: 12),
              const Text('Hasta'),
              const SizedBox(height: 4),
              if (buscar) ...[
                TextField(
                  decoration: const InputDecoration(
                    labelText: 'Filtrar por nombre o código',
                    isDense: true,
                  ),
                  onChanged: (texto) => setState(() {
                    filtro = texto.trim().toLowerCase();
                    hasta = null;
                  }),
                ),
                const SizedBox(height: 8),
              ],
              if (opciones.isEmpty)
                const Text('Sin destinos que coincidan')
              else
                selector('Elige tu destino', hasta, opciones, (v) => hasta = v),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancelar'),
            ),
            TextButton(
              onPressed: listo
                  ? () => Navigator.pop(context, (desde, hasta!))
                  : null,
              child: const Text('Trazar'),
            ),
          ],
        );
      },
    ),
  );
}
