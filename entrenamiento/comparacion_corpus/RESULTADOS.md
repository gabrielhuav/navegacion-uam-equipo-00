# Resultados del ajuste del 16 de noviembre de 2026

**No se consiguió una candidata superior en ambos campus.** ESCOM mejora en la evaluación interna; Azcapotzalco empeora en la detección de T. La app conserva Actual (0.5.0) como primera elección y permite probar Maestro confirmado y Combinado experimental sin sustituir los originales.

El maestro tampoco mejora todos los indicadores: en ESCOM amplía el acierto de clase, pero pierde reconocimientos aceptados; en AZC no mejora el acierto bruto y añade errores. La galería actual ya utiliza parte del maestro de AZC. No se promete que entrenar con más fotos produzca mejores resultados.

## Consultas humanas nativas

Clasificación significa la mejor clase incluso cuando la app responde «no sé». Aceptadas correctas/incorrectas aplican los umbrales y márgenes; el rechazo no se cuenta como acierto. Las clases sin soporte, incluido Edificio 5, permanecen en el denominador.

| Campus | Galería | Fotos | Aciertos de clase | Aceptadas correctas | Aceptadas incorrectas | Rechazadas |
|---|---|---:|---:|---:|---:|---:|
| AZC | Actual | 143 | 63 | 39 | 4 | 100 |
| AZC | Maestro | 143 | 63 | 40 | 5 | 98 |
| AZC | Combinada | 143 | 63 | 36 | 5 | 102 |
| ESCOM | Actual | 74 | 30 | 18 | 5 | 51 |
| ESCOM | Maestro | 74 | 40 | 14 | 3 | 57 |
| ESCOM | Combinada | 74 | 45 | 19 | 4 | 51 |

## Subconjunto del catálogo histórico

Estas consultas son parte del conjunto anterior; no son una segunda prueba independiente. AZC usa 117 fotos únicas, frente a las 118 filas de la reproducción histórica que conserva un alias RGB. Por eso no se comparan directamente porcentajes de cohortes diferentes.

| Campus | Galería | Fotos | Aciertos de clase histórica | Aceptadas correctas | Aceptadas incorrectas |
|---|---|---:|---:|---:|---:|
| AZC | Actual | 117 | 64 | 38 | 4 |
| AZC | Maestro | 117 | 63 | 38 | 5 |
| AZC | Combinada | 117 | 60 | 36 | 5 |
| ESCOM | Actual | 42 | 28 | 17 | 3 |
| ESCOM | Maestro | 42 | 26 | 14 | 3 |
| ESCOM | Combinada | 42 | 31 | 18 | 2 |

T en las 117 fotos históricas únicas:

| Galería | Verdaderos positivos | Falsos positivos | Precisión | Recuperación |
|---|---:|---:|---:|---:|
| Actual | 38 | 4 | 90.48% | 77.55% |
| Maestro | 38 | 5 | 88.37% | 77.55% |
| Combinada | 36 | 5 | 87.80% | 73.47% |

El filtro adicional de destino canónico no elimina ninguna respuesta aceptada en estas consultas finales; los JSON públicos separan ambas cuentas. Son coincidencias de etiqueta con destino disponible, no pruebas de rutas físicas ni de llegada al edificio.

## Galerías finales que lleva el selector

La selección final repite la regla interna congelada con todos los datos. No utiliza los resultados finales para elegir la receta. Cada grupo de evaluación pudo seleccionar otra receta: las tablas evalúan el procedimiento y **no son una evaluación independiente del único archivo final**.

| Variante | Campus | Fotos de referencia | Clases | Método | Confirmación habilitada |
|---|---|---:|---:|---|---|
| Maestro | AZC | 143 | 23 | Tres mejores prototipos, umbrales heredados | Clases con destino, salvo otro |
| Maestro | ESCOM | 74 | 8 | Tres mejores prototipos, umbrales heredados | Clases con destino, salvo otro |
| Combinada | AZC | 299 | 26 | Mejor foto independiente, sin transformación | Sólo T con calibración admisible |
| Combinada | ESCOM | 138 | 18 | Dos mejores fotos independientes, centrado, cupo de adiciones | Sólo Laboratorios con calibración admisible |

Las clases sin calibración admisible siguen compitiendo. No se borran Edificio 5, los interiores de G/H ni las clases difíciles para mejorar los números. En ESCOM, las nueve consultas humanas de Edificio 5 tienen 0/5/1 aciertos brutos con Actual/Maestro/Combinada y ninguna aceptación correcta en las tres variantes. Aún necesita mejores referencias y evaluación por grupos independientes.

## Qué produjo la regresión y qué se corrigió

- El intento anterior de ESCOM había retirado 60 referencias heredadas; se conservaron en los bancos anclados. Se mantienen como referencias sin confirmar, nunca como verdad humana.
- Las tres vistas de una misma foto podían ocupar los tres primeros lugares; las recetas por foto las agrupan antes de tomar las mejores referencias.
- El nuevo falso positivo T del intento anterior incluía una vista interior humana de T entre sus referencias más cercanas. No lo provocaban las fotos web de G/H; no se atribuye causalidad a esos interiores sin evidencia.
- Los patios compartidos de edificios 4/5, escenas ambiguas y clases con poca variedad siguen limitando el resultado. No se cambiaron etiquetas confirmadas para forzar aciertos.

Se probaron 29 recetas con selección y calibración internas, manteniendo un control exacto y un maestro fijo. No se hicieron nuevas búsquedas después de ver el resultado para presentarlas como confirmación independiente.

## Validación y límites

- 39 grupos finales; 217 consultas por variante, 651 predicciones verificadas de forma independiente.
- Exclusión de grupos de todas las fuentes y alias, transformaciones ajustadas sólo con referencias de entrenamiento; invariancia ante cambios en el grupo final durante la selección interna.
- Paridad Python de los cuatro JSON: 28 consultas, error máximo 2.384e-7. Paridad del motor Kotlin compilado: cuatro consultas, 75 puntajes, error máximo 6.557e-7; decisiones navegables coincidentes. Estas comprobaciones verifican el cálculo, no miden precisión nueva.
- 30 pruebas compartidas, compilación APK debug y lint satisfactorios (0 errores, 9 advertencias); 20 pruebas numéricas públicas satisfactorias; se añadieron también al CI.
- 18 archivos protegidos sin cambios, incluidos 11 assets originales y ambos AAB firmados de 0.5.0. No se instala ni publica esta actualización durante la preparación del PR.

Los datos y errores ya se habían observado: **validación interna retrospectiva**, sin prueba externa ciega ni ensayo de cámara o del voto temporal de siete cuadros en el campus. Android y Pillow pueden diferir en el muestreo de píxeles; la paridad numérica parte de los vectores. Falta comprobar visualmente el selector y las cámaras en un dispositivo, y hacer una nueva evaluación con fotos exteriores/grupos independientes.

Recomendación: conservar Actual en AZC; probar la combinada de ESCOM de forma experimental para Laboratorios. Hace falta nueva evidencia para cambiar la opción predeterminada o afirmar una mejora general del maestro. Los originales y la 0.5.0 permanecen intactos; esta entrega sólo actualiza el PR abierto, sin aprobación, integración ni envío a Play.

Métricas por clase, políticas y ajustes finales: [resultados_publicos.json](resultados_publicos.json). Procedimiento y reproducción privada: [README](README.md).
