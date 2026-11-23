# Título propuesto

Preparar Salones UAM 0.5.0 (10) para prueba cerrada

## Descripción propuesta

Salones UAM incorpora la galería del Edificio T con etiquetas confirmadas del PR #23, manteniendo el reconocimiento de ESCOM. Esta entrega cambia la versión Android KMP a **0.5.0 (10)**, corrige la compatibilidad del inicio de cámara con Android 7 y 8, y reúne las novedades es-419, las comprobaciones locales y la lista de revisión de Play Console.

No se regenera la galería ni el modelo. El código 10 se eligió después de consultar «Todos los paquetes de aplicación» el 15 de noviembre de 2026: el único bundle cargado era 0.4.0 (9).

La revisión completa de release detectó una llamada a `Context.mainExecutor` que requiere API 28 pese al mínimo 24 de la app. Se sustituye por `ContextCompat.getMainExecutor(this)`, sin subir el mínimo ni silenciar el error de lint. Referencia: [ContextCompat](https://developer.android.com/reference/androidx/core/content/ContextCompat#getMainExecutor(android.content.Context)).

### Validación

Consultar `INFORME_PREPARACION.md` para resultados, firma, huellas, tamaño, evidencia del emulador y límites. Las notas tienen menos de 500 caracteres y la lista de Console distingue el análisis local de cámara de las transferencias de los mapas externos.

### Aprobación y publicación

Este texto es un borrador local; aún no se abrió este PR. Primero el propietario debe aprobar e integrar #23. Después se crea `release/0.5.0` desde el `main` aprobado y se traslada el cambio de versión y esta documentación, comprobando que coincida con lo verificado.

El propietario revisa y aprueba ese PR; también realiza personalmente la subida a la pista cerrada. No hay autorización para fusionar PR, cargar AAB, enviar a revisión ni publicar en su nombre.

### Tarjeta propuesta para el Project #1

**Salones UAM 0.5.0 (10): actualización para prueba cerrada.** Depende de la integración aprobada de #23. Vincular el PR definitivo de versión al tablero cuando exista; anexar novedades, revisión de privacidad/cámara, resultados de pruebas y huella del AAB definitivo. No marcar como publicada por haber preparado el archivo.
