/// El campus compartido con KMP y con el editor web: plano 2D, georreferencia y modelo 3D.
/// Los archivos vienen de `../campus/`, la fuente única del diseño; Gradle los copia a assets/campus al compilar.
library;

import 'dart:convert';
import 'dart:math';

import 'package:latlong2/latlong.dart';

import 'tema.dart';

/// Archivos del campus de una unidad con croquis (Gradle copia cada una a `assets/campus/<carpeta>/`).
String planoDe(Unidad u) => 'assets/campus/${u.carpeta}/plano_2d.png';
String modeloDe(Unidad u) => 'assets/campus/${u.carpeta}/modelo.glb';
String georreferenciaDe(Unidad u) => 'assets/campus/${u.carpeta}/georreferencia.json';

/// Las tres formas de ver el campus. Por defecto, el mapa real con el plano 2D encima.
enum Vista {
  mapa('Mapa'),
  plano('2D'),
  tresD('3D');

  const Vista(this.nombre);
  final String nombre;
}

/// Dónde va el plano 2D sobre el mapa real: las esquinas de `plano_2d.png`. Igual que Campus.kt.
class Georreferencia {
  const Georreferencia(this.ancho, this.alto, this.superiorIzquierda, this.superiorDerecha, this.inferiorIzquierda);

  final int ancho;
  final int alto;
  final LatLng superiorIzquierda;
  final LatLng superiorDerecha;
  final LatLng inferiorIzquierda;

  /// La cuarta esquina: el plano es un paralelogramo.
  LatLng get inferiorDerecha => LatLng(
    superiorDerecha.latitude + inferiorIzquierda.latitude - superiorIzquierda.latitude,
    superiorDerecha.longitude + inferiorIzquierda.longitude - superiorIzquierda.longitude,
  );
}

/// Lee georreferencia.json; si falta una clave, dice cuál.
Georreferencia leerGeorreferencia(String json) {
  final d = jsonDecode(json) as Map<String, dynamic>;
  T dato<T>(String clave) => d[clave] as T? ?? (throw StateError('Falta $clave en georreferencia.json'));
  LatLng punto(String clave) {
    final p = dato<List<dynamic>>(clave);
    return LatLng((p[0] as num).toDouble(), (p[1] as num).toDouble());
  }

  return Georreferencia(
    dato<int>('ancho'),
    dato<int>('alto'),
    punto('superiorIzquierda'),
    punto('superiorDerecha'),
    punto('inferiorIzquierda'),
  );
}

/// Hacia dónde queda el norte en el modelo, como vector unitario (x, z) del suelo. Igual que Campus.kt.
(double, double) norteEnModelo(Georreferencia geo) {
  final cosLat = cos(geo.superiorIzquierda.latitude * pi / 180);
  (double, double) porPixel(LatLng u, int pixeles) => (
    (u.longitude - geo.superiorIzquierda.longitude) * cosLat / pixeles,
    (u.latitude - geo.superiorIzquierda.latitude) / pixeles,
  );
  final (ax, ay) = porPixel(geo.superiorDerecha, geo.ancho); // hacia +x
  final (bx, by) = porPixel(geo.inferiorIzquierda, geo.alto); // hacia +z
  final det = ax * by - ay * bx;
  final x = -bx / det, z = ax / det;
  final largo = sqrt(x * x + z * z);
  return (x / largo, z / largo);
}

/// Giro de la cámara de model-viewer (grados) para ver el campus con el norte hacia arriba, como el mapa.
/// Con la cámara casi encima, lo que queda arriba en la pantalla es lo opuesto a donde está la cámara.
double giroConNorteArriba(Georreferencia geo) {
  final (nx, nz) = norteEnModelo(geo);
  return atan2(-nx, -nz) * 180 / pi;
}
