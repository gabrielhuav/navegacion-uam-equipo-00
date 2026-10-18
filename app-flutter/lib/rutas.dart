/// Prototipo 6: rutas dentro del campus (por ahora sólo Azcapotzalco). Igual que Rutas.kt de KMP.
/// La red de caminos sale de `campus/rutas.json` (la dibuja Codex en el visor web): nodos con su latitud y
/// longitud, aristas con sus metros y un nodo por destino (edificios y accesos).
library;

import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';

class Nodo {
  const Nodo(this.id, this.lugar, this.tipo);
  final String id;
  final LatLng lugar;
  final String tipo;
}

class Destino {
  const Destino(this.id, this.nombre, this.nodo);
  final String id;
  final String nombre;
  final String nodo;
}

/// Una ruta: los puntos por los que pasa (para dibujarla) y su longitud.
class Ruta {
  const Ruta(this.puntos, this.metros);
  final List<LatLng> puntos;
  final double metros;

  /// A 1.2 m/s, el paso de una persona caminando. Al menos un minuto.
  int get minutos => (metros / 1.2 / 60).ceil().clamp(1, 1 << 30);
}

class Red {
  Red(this.nodos, List<(String, String, double)> aristas, this.destinos) {
    for (final (a, b, m) in aristas) {
      (_vecinos[a] ??= []).add((b, m));
      (_vecinos[b] ??= []).add((a, m));
    }
  }

  final Map<String, Nodo> nodos;
  final List<Destino> destinos;
  final _vecinos = <String, List<(String, double)>>{};
  static const _distancia = Distance();

  /// El camino más corto entre dos nodos (algoritmo de Dijkstra). Null si no hay camino.
  Ruta? rutaMasCorta(String desde, String hasta) {
    final distancia = {desde: 0.0};
    final previo = <String, String>{};
    final pendientes = {desde};
    final cerrados = <String>{};
    while (pendientes.isNotEmpty) {
      final actual = pendientes.reduce((a, b) => distancia[a]! <= distancia[b]! ? a : b);
      if (actual == hasta) break;
      pendientes.remove(actual);
      cerrados.add(actual);
      for (final (vecino, metros) in _vecinos[actual] ?? const <(String, double)>[]) {
        if (cerrados.contains(vecino)) continue;
        final nueva = distancia[actual]! + metros;
        if (nueva < (distancia[vecino] ?? double.infinity)) {
          distancia[vecino] = nueva;
          previo[vecino] = actual;
          pendientes.add(vecino);
        }
      }
    }
    final total = distancia[hasta];
    if (total == null) return null;
    final camino = <String>[hasta];
    for (var p = previo[hasta]; p != null; p = previo[p]) {
      camino.add(p);
    }
    return Ruta([for (final id in camino.reversed) nodos[id]!.lugar], total);
  }

  /// El nodo más cercano a un punto; con [tipo], sólo de ese tipo (por ejemplo «acceso»).
  Nodo masCercano(LatLng u, {String? tipo}) => nodos.values
      .where((n) => tipo == null || n.tipo == tipo)
      .reduce((a, b) => _distancia.distance(u, a.lugar) <= _distancia.distance(u, b.lugar) ? a : b);

  /// Desde tu ubicación: en el campus empieza en el camino más cercano; lejos (más de [lejos] metros),
  /// en el acceso más cercano. Devuelve la ruta y si se usó un acceso.
  (Ruta, bool)? rutaDesde(LatLng yo, Destino hasta, {double lejos = 150}) {
    final cerca = masCercano(yo);
    final porAcceso = _distancia.distance(yo, cerca.lugar) > lejos;
    final inicio = porAcceso ? masCercano(yo, tipo: 'acceso') : cerca;
    final ruta = rutaMasCorta(inicio.id, hasta.nodo);
    return ruta == null ? null : (ruta, porAcceso);
  }
}

/// Lee rutas.json.
Red leerRed(String json) {
  final d = jsonDecode(json) as Map<String, dynamic>;
  List<Map<String, dynamic>> lista(String k) =>
      (d[k] as List? ?? (throw StateError('Falta $k en rutas.json'))).cast<Map<String, dynamic>>();
  return Red(
    {
      for (final n in lista('nodos'))
        n['id'] as String: Nodo(
          n['id'] as String,
          LatLng((n['lat'] as num).toDouble(), (n['lon'] as num).toDouble()),
          n['tipo'] as String,
        ),
    },
    [for (final a in lista('aristas')) (a['de'] as String, a['a'] as String, (a['metros'] as num).toDouble())],
    [for (final x in lista('destinos')) Destino(x['id'] as String, x['nombre'] as String, x['nodo'] as String)],
  );
}

/// Elegir de dónde a dónde. Origen: tu ubicación (null) o un lugar; destino: un lugar. Igual que ElegirRuta.kt.
Future<(Destino?, Destino)?> elegirRuta(BuildContext context, Red red, {required bool conUbicacion}) {
  final lugares = [...red.destinos]..sort((a, b) => a.nombre.compareTo(b.nombre));
  Destino? desde, hasta;
  return showDialog<(Destino?, Destino)>(
    context: context,
    builder: (context) => StatefulBuilder(
      builder: (context, setState) {
        Widget selector(String vacio, Destino? valor, ValueChanged<Destino?> elegir, {String? primera}) =>
            PopupMenuButton<Destino?>(
              onSelected: (v) => setState(() => elegir(v)),
              itemBuilder: (context) => [
                if (primera != null) PopupMenuItem<Destino?>(value: null, child: Text(primera)),
                for (final l in lugares) PopupMenuItem<Destino?>(value: l, child: Text(l.nombre)),
              ],
              child: InputDecorator(
                decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true),
                child: Text('${valor?.nombre ?? vacio}  ▾'),
              ),
            );
        final listo = hasta != null && (desde != null || conUbicacion) && desde != hasta;
        return AlertDialog(
          title: const Text('Ruta en la UAM Azcapotzalco'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Desde'),
              const SizedBox(height: 4),
              selector(
                conUbicacion ? 'Mi ubicación' : 'Elige un lugar',
                desde,
                (v) => desde = v,
                primera: conUbicacion ? 'Mi ubicación' : null,
              ),
              const SizedBox(height: 12),
              const Text('Hasta'),
              const SizedBox(height: 4),
              selector('Elige tu destino', hasta, (v) => hasta = v),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancelar')),
            TextButton(
              onPressed: listo ? () => Navigator.pop(context, (desde, hasta!)) : null,
              child: const Text('Trazar'),
            ),
          ],
        );
      },
    ),
  );
}
