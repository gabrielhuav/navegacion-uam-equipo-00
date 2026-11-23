# Salones UAM 0.5.0 (10): candidata local para revisión

Fecha: 15 de noviembre de 2026, Ciudad de México.

**No cargada en Play Console, no enviada a revisión y no publicada.** El propietario aprueba e integra los PR y sube personalmente el AAB. #23 seguía abierto en la comprobación de cierre; por ello esta candidata se preparó en una copia aislada sobre su commit `e30ead77b8693eb4342b2c439a63c4044519ff5e`. Todavía no se crea `release/0.5.0` desde `main`, su PR ni la tarjeta asociada.

## Archivo preparado

- Carpeta de entrega: `C:/Users/gabri/Downloads/1151055 Administracion/Publicacion Salones UAM/Actualizacion 0.5.0 2026-11-15/`.
- Archivo: `Salones-UAM-0.5.0-10-CANDIDATA.aab`.
- Tamaño: **57 076 314 bytes (54,43 MiB)**.
- SHA-256: `7D6B44B73C95B67F2CEAB91C2A7E2E381AA5D6B845B745356F31C05649724CB4`.
- Origen de compilación: `app-kmp/androidApp/build/outputs/bundle/release/androidApp-release.aab` en el worktree indicado abajo. La copia entregada tiene el mismo SHA-256.
- Paquete comprobado dentro del AAB: `ovh.gabrielhuav.salones`.
- Versión comprobada dentro del AAB: **0.5.0 / 10**. Mínimo API 24, destino API 36, compilación API 37. Release sin `debuggable`; cámara opcional para instalar; sin permiso `AD_ID`.
- Firma verificada con `jarsigner`: **jar verified**. Certificado `CN=Salones UAM`, RSA 3072 bits, SHA-256 `91:8B:35:54:26:9C:CD:E5:F8:3A:52:E6:52:AC:01:3A:06:05:0F:20:DB:DB:92:BF:23:CF:D8:D7:2D:7E:6B:17`, coincidente con el registro de carga de 0.4.0. El verificador avisa de certificado autofirmado y ausencia de sello de tiempo; no invalida la firma comprobada. No se copiaron secretos a la entrega.

## Código y contenido

Worktree: `C:/Users/gabri/.codex/worktrees/salones-uam-050/navegacion-uam-equipo-00`, rama local `codex/preparar-salones-0.5.0`. Se respetaron los checkouts de Claude y del corpus.

La candidata se compiló desde #23 en `e30ead7` con dos cambios funcionales revisables: versión 0.5.0 (10) y sustitución de `mainExecutor` por `ContextCompat.getMainExecutor(this)` en `ReconocerActivity`. El resto de cambios propios son documentación y memoria. El AAB registra la base de Git de esa compilación; el recibo local posterior registra el commit que conserva los cambios para trasladarlos al `main` aprobado. No confundir esta procedencia con una compilación de `main` después de aprobar los PR.

El primer `lintRelease` detectó que `Context.mainExecutor` requiere API 28 aunque la app admite API 24. Se corrigió con AndroidX, manteniendo el mínimo y sin silenciar el error. La compilación y lint posteriores pasaron. La prueba de ejecución se hizo en API 36; no se ejecutó un emulador API 24–27.

Los **11 assets de reconocimiento** empaquetados coinciden byte a byte con los del PR #23. Los SHA del modelo, galería y extras aparecen en `REVISION_PLAY_CONSOLE.md` y `evidencia/verificacion-paquete.json`. Se validó que ambas galerías declaran el SHA real del modelo. No se entrenó de nuevo, no se regeneraron JSON/modelos y no se incluyeron originales del corpus ni archivos de firma. Las seis carpetas de diseño de campus permanecen sin cambios, incluidos IDs, PNG, rutas y georreferencias.

## Comprobaciones

| Comprobación | Resultado |
|---|---|
| `:shared:testAndroidHostTest` | 21 pruebas, 0 fallos, 0 errores y 0 omitidas; resultados recuperados por Gradle de su caché de entradas idénticas. |
| `:androidApp:assembleDebug` | Correcta, incluida la candidata 0.5.0 (10) con la corrección de compatibilidad. |
| `:androidApp:bundleRelease :androidApp:lintRelease :androidApp:assembleDebug` tras corregir | BUILD SUCCESSFUL. Lint: 0 errores, 6 advertencias. |
| `bundletool 1.18.3 validate` | Correcto. |
| Metadatos y contenido del AAB | Paquete, versiones, API, permisos, cámara opcional y release no depurable comprobados. |
| Firma de carga | Verificada y huella coincidente con Salones UAM. |
| Biblioteca nativa ELF de 64 bits | 14 de 14 con segmentos LOAD alineados a 16 KB y congruencia de offset/dirección; RELRO revisado sin conflictos. Los bytes nativos de debug y AAB son idénticos. |
| Empaquetado | `PAGE_ALIGNMENT_16K`; `zipalign -c -P 16 4` correcto en los 6 splits nativos arm64/x86_64 y base-master generados. |
| Descarga estimada con bundletool | 6 216 combinaciones, entre **30 993 110 y 32 820 854 bytes (29,56–31,30 MiB)**, bajo el límite de descarga del módulo base. La validación final corresponde a Play tras la subida del propietario. |
| Novedades es-419 | 271 caracteres sin salto final; menos de 500. |

Para calcular tamaño/alineación se generó un `.apks` local con la llave de depuración habitual; es material de verificación y no es el AAB firmado de carga ni se incluye como archivo para subir. El emulador usa páginas de 4 KB (`PAGE_SIZE=4096`); **no se afirma ejecución comprobada en un sistema de 16 KB**.

Las seis advertencias de lint son: `OldTargetApi` (destino 36, compatible con el requisito contrastado), `GradleDependency` (Fragment), `UseOfNonLambdaOffsetOverload`, `MissingApplicationIcon`, `UseKtx` y `UseTomlInstead`. Se mantiene la advertencia existente de que el manifiesto no declara un icono de aplicación; las otras observaciones son de actualización/estilo/rendimiento. No se silenció ninguna.

## Prueba en emulador

Único dispositivo utilizado: **emulator-5554**, Android API 36, x86_64. Nunca se instaló en un teléfono físico. La primera compilación del PR, aún 0.4.0 (9), se usó para comprobar el aviso de cámara denegada; sus capturas están diferenciadas de las de la candidata 0.5.0 (10). Tras aplicar la corrección se instaló la candidata y se comprobó su versión por `dumpsys`.

En la candidata se verificaron la demo de Azcapotzalco con UAMito rojo, ESCOM con el burro blanco y Laboratorios, e Iztapalapa con UAMito verde. «Ir a este edificio» abrió el diálogo «La cámara cree ver: Edificio T», origen «Mi ubicación», destino «Edificio T». El reconocimiento normal de la escena virtual no identificó un edificio: similitud de T 0,24, por debajo de 0,74, y botón de ruta deshabilitado. No se observaron cierres en esas pruebas. Las demos simulan el resultado: no prueban precisión frente al edificio. La ubicación predeterminada del emulador estaba lejos del campus; tampoco se validan distancias de campo con esas capturas. El informe específico del emulador y sus capturas se incluyen en `evidencia/emulador/`.

El log del proceso de la candidata en esas pruebas no contiene `FATAL EXCEPTION`, `Fatal signal` ni ANR. El arranque en frío fue muy lento con la memoria del equipo casi agotada; al liberar el proceso de compilación propio se completaron las comprobaciones visuales. La repetición final del permiso de cámara denegado quedó **inconclusa** por esa lentitud de arranque: el permiso revocado se comprobó, pero no se volvió a observar el aviso final. El aviso «Sin permiso de cámara: elige el destino en “Ruta”» sólo se da por verificado en el APK inicial 0.4.0 del mismo PR. Repetir esa prueba sobre la entrega definitiva, sin presentarla aquí como aprobada en 0.5.0.

## Antes de crear la entrega definitiva

1. El propietario aprueba e integra el PR #23. El PR conserva algunos pendientes históricos que ya quedaron obsoletos: la galería actual sí tiene etiquetas confirmadas y no debe regenerarse por ese texto antiguo.
2. Crear `release/0.5.0` desde ese `main`, trasladar el cambio de versión, la corrección de compatibilidad y esta documentación. Abrir su PR y vincularlo al Project #1 para revisión del propietario. No fusionarlo por él.
3. Comparar contra lo verificado aquí; si cambian entradas de compilación, repetir las comprobaciones afectadas. Reconstruir la entrega definitiva desde el código aprobado, verificar firma/versión y registrar su nueva huella. No reutilizar el SHA de esta candidata si el binario cambia.
4. Revisar permiso/privacidad de cámara, política de mapas, listas/pista/país reales y uso de mascotas con `REVISION_PLAY_CONSOLE.md`. Sigue pendiente la prueba real frente al Edificio T, de día y de noche.
5. Después de aprobar los PR, el propietario hace la subida a Console. No hay autorización en esta fase para que la IA cargue, acepte declaraciones, envíe a revisión o publique.

Se leyeron los tres documentos indicados del curso. Se consultó Play Console sólo para verificar el máximo usado: «Todos los paquetes de aplicación» mostraba únicamente 0.4.0 (9), sin página siguiente. No se modificaron ficha, listas, pistas, países, publicación administrada ni cambios pendientes.
