/// Lógica pura: no sabe nada de pantallas, ni de Android, ni de iOS.
/// Por eso se puede probar con pruebas unitarias (ver test/saludo_test.dart).
library;

/// Saludo que se muestra en la tarjeta, por ejemplo "¡Hola desde Android!".
String saludar(String plataforma) => '¡Hola desde $plataforma!';

/// Texto del contador con la palabra en singular o plural.
String textoContador(int veces) => switch (veces) {
      0 => 'Todavía no has tocado el botón',
      1 => 'Has tocado el botón 1 vez',
      _ => 'Has tocado el botón $veces veces',
    };
