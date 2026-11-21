# Salones UAM 0.5.0 (10): revisión del propietario

Estado: preparación local para prueba cerrada; nada cargado, enviado ni publicado.
El propietario aprueba e integra los PR y realiza personalmente la subida a Play Console.

## Procedencia y orden de aprobación

- Aplicación KMP: `app-kmp/androidApp`, paquete `ovh.gabrielhuav.salones`.
- Base de esta candidata: PR [#23](https://github.com/gabrielhuav/navegacion-uam-equipo-00/pull/23), commit `e30ead77b8693eb4342b2c439a63c4044519ff5e`, todavía abierto al preparar.
- Se usa una copia aislada y la rama local `codex/preparar-salones-0.5.0`; no se modifica la rama de Claude ni el PR #23.
- La rama definitiva `release/0.5.0` desde `main` y su PR se preparan después de que el propietario apruebe e integre #23, como solicita `Codex_actualizacion_Play.md`. Antes de entregarla, comprobar que los archivos aprobados coincidan con la candidata y repetir las comprobaciones afectadas por cualquier diferencia.
- El 15 de noviembre de 2026 se consultó, sin modificaciones, «Todos los paquetes de aplicación» de Salones UAM en Play Console: sólo figuraba `9 / 0.4.0 / Activo`, sin página siguiente. Por eso se propone el código 10. Si se carga otro bundle antes de esta entrega, volver a comprobar el máximo.

## Qué incluye el resultado del entrenamiento

- Galería UAM del PR #23, sin regenerarla: 118 fotos de referencia únicas de exteriores de 22 grupos, representadas por 354 vectores. Las fotos originales no se empaquetan ni se suben.
- Etiquetas confirmadas; clases T, I, G, W, P2 y otro. `otro` no genera destino. T usa umbral 0,74.
- Se conserva la red MobileNetV3 congelada compartida con ESCOM; esta actualización cambia la galería de referencias y su umbral, no vuelve a entrenar los pesos de la red.
- Evaluación del corpus: precisión de T 90 %, recuperación 76 %. No son garantías de campo ni porcentajes de certeza de cada reconocimiento. Falta probar frente al Edificio T de día y de noche.
- UAMito al reconocer T; ESCOM conserva Laboratorios y el burro blanco. Las otras cuatro playeras UAM están incluidas, pero sus sedes aún no tienen galería operativa.
- Modelo SHA-256: `d01e31483ac10fc887e5b4e7d47ee0e7a93cc196c56286312329401e219474bd`, coincidente con el declarado en las galerías UAM y ESCOM.
- Galería UAM SHA-256: `b505a08d2fa4442c1431017e568a9b82e0057f169ca20683b224f56968d0a829`.
- Extras UAM SHA-256: `0ab447fe78512e157784b5fab41364a576ceb3ff80ddfb5a2838b41e5691a00a`.

## Lista de revisión en Console, a cargo del propietario

- [ ] Aprobar e integrar #23 y después revisar el PR de versión. No eludir la aprobación de `main`.
- [ ] La entrega actual es una **candidata local** identificada en `INFORME_PREPARACION.md`. Tras aprobar e integrar los PR, comprobar/reconstruir el AAB definitivo desde `main` y volver a registrar sus huellas; no subir el APK de depuración ni una candidata que haya cambiado después de verificarse.
- [ ] Confirmar pista cerrada **Tarea 3 - Curso**, país **México**. Son la pista y el país históricos; comprobarlos antes de la subida.
- [ ] Verificar las listas actualmente seleccionadas sin alterar cuentas. La incorporación histórica de **26-O Y 2027-1** no se da por aprobada sólo por los documentos de octubre.
- [ ] Revisar publicación administrada y cambios pendientes: la preparación local no demuestra que una versión esté enviada, aprobada o publicada.
- [ ] Pegar `novedades-es-419.txt` como es-419 (menos de 500 caracteres).
- [ ] Revisar cámara opcional y permiso en tiempo de ejecución: el reconocimiento usa análisis local de cuadros, sin guardar ni transmitir las imágenes de cámara. Con permiso denegado debe seguir disponible la elección manual de rutas.
- [ ] Revisar Seguridad de los datos y política pública con ese alcance preciso. No declarar que toda la app funciona sin transferencias: los mapas/proveedores externos reciben datos técnicos y solicitudes; ubicación conserva su tratamiento ya declarado.
- [ ] Mantener el aviso de aplicación no oficial de la UAM. Confirmar el permiso de uso de UAMito y demás mascotas antes de su publicación; este punto sigue pendiente en #23.
- [ ] Decidir si renovar capturas con el reconocimiento real. Las imágenes de demo deben identificarse como tales y no servir como evidencia de precisión frente al edificio. No usar fotos del corpus ni datos de alumnos.
- [ ] Comprobar advertencias y validaciones actuales de Play tras la subida del propietario; no aceptar formularios ni enviar cambios por cuenta del propietario.

## Requisitos contrastados y límites de las pruebas locales

- La app apunta a API 36 y mínimo 24. [Requisito oficial de API objetivo](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en).
- El tamaño del archivo AAB y la descarga comprimida por dispositivo son métricas diferentes. El límite vigente del módulo base es 500 MB de descarga comprimida; la medición local de bundletool es una estimación, Play hace la validación final. [Tamaño en Play](https://support.google.com/googleplay/android-developer/answer/9859372?hl=en).
- Revisar tanto ELF de bibliotecas de 64 bits como empaquetado ZIP a 16 KB. Una compilación correcta no basta para probar ejecución en dispositivos de 16 KB. [Guía oficial de páginas de memoria](https://developer.android.com/guide/practices/page-sizes).
- El tratamiento exclusivamente local de la cámara no elimina las obligaciones respecto a mapas y otros proveedores. [Seguridad de los datos](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en).

Fuentes consultadas el 15 de noviembre de 2026. No se modifican geometrías, PNG, IDs, rutas ni georreferencias; tampoco originales del corpus, DOCX o PPTX.
