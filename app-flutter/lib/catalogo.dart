/// Lógica pura del Prototipo 1: no sabe nada de pantallas, ni de Android, ni de iOS.
/// Por eso se puede probar con pruebas unitarias (ver test/catalogo_test.dart).
library;

/// Un salón del catálogo.
class Salon {
  const Salon({
    required this.clave,
    required this.edificio,
    required this.piso,
  });

  /// Clave tal como la guarda el catálogo, por ejemplo "A-201".
  final String clave;

  /// Edificio donde está el salón, por ejemplo "A".
  final String edificio;

  /// Piso del salón.
  final int piso;
}

/// Datos de EJEMPLO del Prototipo 1. No son el catálogo oficial de la UAM:
/// en el Prototipo 2 se sustituyen por el catálogo del repositorio común.
const List<Salon> catalogoDeEjemplo = [
  Salon(clave: 'A-105', edificio: 'A', piso: 1),
  Salon(clave: 'A-201', edificio: 'A', piso: 2),
  Salon(clave: 'G-302', edificio: 'G', piso: 3),
  Salon(clave: 'H-108', edificio: 'H', piso: 1),
];

/// Resultado de buscar lo que escribió el usuario.
sealed class Resultado {
  const Resultado();
}

/// La clave existe en el catálogo.
class Encontrado extends Resultado {
  const Encontrado(this.salon);

  final Salon salon;
}

/// El usuario no escribió nada.
class SinClave extends Resultado {
  const SinClave();
}

/// Lo escrito no tiene la forma edificio + número.
class FormatoInvalido extends Resultado {
  const FormatoInvalido(this.texto);

  final String texto;
}

/// La clave tiene buena forma, pero no está en el catálogo.
class NoExiste extends Resultado {
  const NoExiste(this.clave);

  final String clave;
}

final RegExp _formatoClave = RegExp(r'^([A-Z]{1,3})(\d{1,4})$');

/// Convierte la clave como viene en el horario a la forma del catálogo:
/// "a201", " a 201 " o "Salón A-201" se vuelven "A-201".
/// Devuelve null si el texto no tiene la forma edificio + número.
String? normalizarClave(String texto) {
  final compacto = texto
      .toUpperCase()
      .replaceAll(RegExp(r'^\s*SAL[OÓ]N'), '')
      .replaceAll(RegExp(r'[\s\-_.]'), '');
  final partes = _formatoClave.firstMatch(compacto);
  if (partes == null) return null;
  return '${partes.group(1)}-${partes.group(2)}';
}

/// Busca en [catalogo] el salón que escribió el usuario.
Resultado buscarSalon(
  String texto, {
  List<Salon> catalogo = catalogoDeEjemplo,
}) {
  if (texto.trim().isEmpty) return const SinClave();
  final clave = normalizarClave(texto);
  if (clave == null) return FormatoInvalido(texto.trim());
  for (final salon in catalogo) {
    if (salon.clave == clave) return Encontrado(salon);
  }
  return NoExiste(clave);
}

/// Texto que ve el usuario para cada resultado.
String mensaje(Resultado resultado) => switch (resultado) {
      Encontrado(:final salon) =>
        'Edificio ${salon.edificio} · Piso ${salon.piso}',
      SinClave() => 'Escribe la clave de tu salón, por ejemplo A-201.',
      FormatoInvalido(:final texto) =>
        '«$texto» no parece una clave. Escribe edificio y número, por ejemplo A-201.',
      NoExiste(:final clave) =>
        'No encontré $clave en el catálogo de ejemplo. Revisa la clave en tu horario.',
    };
