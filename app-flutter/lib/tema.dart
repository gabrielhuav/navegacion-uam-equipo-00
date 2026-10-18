/// Prototipo 3: modo claro u oscuro, color de cada unidad de la UAM y día o noche en el campus.
/// Los mismos valores que Tema.kt y Campus.kt de KMP.
library;

import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Las cinco unidades de la UAM y su color distintivo oficial (Pantone y su equivalente HEX), según
/// «Reglas para la Aplicación de los Elementos de Identidad Institucional», UAM, Comunicación Social.
///
/// [carpeta]: dónde están su modelo 3D, su plano y su georreferencia en assets/campus/ (los copia Gradle desde
/// `campus/` y `campus-<unidad>/`). Una unidad nueva sin croquis iría sin carpeta: el mapa va a su [centro] y muestra
/// un cuadro «En desarrollo…». [radio]: hasta dónde se dice «Estás en la UAM». Igual que Tema.kt.
enum Unidad {
  azcapotzalco('Azcapotzalco', Color(0xFFCD032E), 'azcapotzalco', LatLng(19.50306, -99.18694), 350), // Pantone 186 C
  cuajimalpa('Cuajimalpa', Color(0xFFF08200), 'cuajimalpa', LatLng(19.351945, -99.282701), 250), // Pantone 144 C
  iztapalapa('Iztapalapa', Color(0xFF57A519), 'iztapalapa', LatLng(19.361775, -99.072597), 450), // Pantone 369 C
  lerma('Lerma', Color(0xFFAD25A8), 'lerma', LatLng(19.290506, -99.498472), 350), // Pantone 253 C
  xochimilco('Xochimilco', Color(0xFF0072CE), 'xochimilco', LatLng(19.30419, -99.102905), 450); // Pantone 285 C

  const Unidad(this.nombre, this.color, this.carpeta, this.centro, this.radio);
  final String nombre;
  final Color color;
  final String? carpeta;
  final LatLng centro;
  final double radio;
}

/// Iluminación del campus en 2D y 3D. Por defecto sigue la hora del teléfono; también se fija a mano.
enum Iluminacion {
  automatica('Según la hora'),
  dia('Día'),
  noche('Noche');

  const Iluminacion(this.nombre);
  final String nombre;
}

/// De noche entre las 19:00 y las 6:59.
bool esDeNoche(int hora) => hora < 7 || hora >= 19;

/// Colores de la app a partir del color de la unidad. En claro se usa el color tal cual;
/// en oscuro, una versión más clara sobre fondos oscuros para que se lea bien.
ColorScheme esquemaDeColor(Unidad unidad, {required bool oscuro}) {
  final c = unidad.color;
  Color mezcla(Color otro, double t) => Color.lerp(c, otro, t)!;
  final base = ColorScheme.fromSeed(seedColor: c, brightness: oscuro ? Brightness.dark : Brightness.light);
  return oscuro
      ? base.copyWith(
          primary: mezcla(Colors.white, 0.35),
          onPrimary: Colors.black,
          primaryContainer: mezcla(Colors.black, 0.55),
          onPrimaryContainer: mezcla(Colors.white, 0.8),
          secondaryContainer: mezcla(Colors.black, 0.65),
          onSecondaryContainer: mezcla(Colors.white, 0.85),
        )
      : base.copyWith(
          primary: c,
          onPrimary: Colors.white,
          primaryContainer: mezcla(Colors.white, 0.82),
          onPrimaryContainer: mezcla(Colors.black, 0.55),
          secondaryContainer: mezcla(Colors.white, 0.75),
          onSecondaryContainer: mezcla(Colors.black, 0.6),
        );
}

/// Lo que elige el usuario en «Tema ▾». La app entera se vuelve a dibujar cuando cambia.
class AjustesTema {
  const AjustesTema({
    required this.oscuro,
    this.unidad = Unidad.azcapotzalco,
    this.iluminacion = Iluminacion.automatica,
    this.sede = Unidad.azcapotzalco,
  });

  final bool oscuro;
  final Unidad unidad;
  final Iluminacion iluminacion;

  /// La unidad cuyo campus se ve; puede ser otra que la del color (se pregunta al cambiar de unidad).
  final Unidad sede;

  AjustesTema copyWith({bool? oscuro, Unidad? unidad, Iluminacion? iluminacion, Unidad? sede}) => AjustesTema(
    oscuro: oscuro ?? this.oscuro,
    unidad: unidad ?? this.unidad,
    iluminacion: iluminacion ?? this.iluminacion,
    sede: sede ?? this.sede,
  );
}

/// Lo que se eligió en «Tema ▾». Antes de abrir la app se carga con [cargarAjustesTema].
final ajustesTema = ValueNotifier(const AjustesTema(oscuro: false));

/// Lee lo último que se eligió (la primera vez, claro u oscuro como el teléfono)
/// y, desde entonces, guarda cada cambio: al volver a abrir la app sigue igual. Igual que Preferencias.kt.
Future<void> cargarAjustesTema() async {
  final p = await SharedPreferences.getInstance();
  T elegido<T extends Enum>(List<T> valores, String clave, T omision) =>
      valores.where((v) => v.name == p.getString(clave)).firstOrNull ?? omision;
  ajustesTema.value = AjustesTema(
    oscuro: p.getBool('oscuro') ?? WidgetsBinding.instance.platformDispatcher.platformBrightness == Brightness.dark,
    unidad: elegido(Unidad.values, 'unidad', Unidad.azcapotzalco),
    iluminacion: elegido(Iluminacion.values, 'iluminacion', Iluminacion.automatica),
    sede: elegido(Unidad.values, 'sede', Unidad.azcapotzalco),
  );
  ajustesTema.addListener(() {
    final a = ajustesTema.value;
    p.setBool('oscuro', a.oscuro);
    p.setString('unidad', a.unidad.name);
    p.setString('iluminacion', a.iluminacion.name);
    p.setString('sede', a.sede.name);
  });
}

/// Elemento del menú «Tema ▾»: un valor que se aplica al elegirlo.
typedef OpcionTema = AjustesTema Function(AjustesTema);

/// Botón «Tema ▾»: modo claro u oscuro, color de una unidad y día o noche en el campus.
class MenuTema extends StatelessWidget {
  const MenuTema({super.key});

  @override
  Widget build(BuildContext context) {
    final a = ajustesTema.value;
    String marca(bool si) => si ? '✓  ' : '     ';
    return PopupMenuButton<OpcionTema>(
      position: PopupMenuPosition.under,
      onSelected: (cambio) => ajustesTema.value = cambio(ajustesTema.value),
      itemBuilder: (context) => [
        PopupMenuItem(value: (a) => a.copyWith(oscuro: false), child: Text('${marca(!a.oscuro)}Claro')),
        PopupMenuItem(value: (a) => a.copyWith(oscuro: true), child: Text('${marca(a.oscuro)}Oscuro')),
        const PopupMenuDivider(),
        for (final u in Unidad.values)
          PopupMenuItem(
            value: (a) => a.copyWith(unidad: u),
            child: Row(
              children: [
                CircleAvatar(radius: 8, backgroundColor: u.color),
                const SizedBox(width: 12),
                Text('${marca(u == a.unidad)}${u.nombre}'),
              ],
            ),
          ),
        const PopupMenuDivider(),
        for (final i in Iluminacion.values)
          PopupMenuItem(
            value: (a) => a.copyWith(iluminacion: i),
            child: Text('${marca(i == a.iluminacion)}${i.nombre}'),
          ),
      ],
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Text('Tema ▾', style: TextStyle(color: Theme.of(context).colorScheme.primary)),
      ),
    );
  }
}
