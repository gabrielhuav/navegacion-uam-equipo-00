# Comparar Actual, Maestro confirmado y Combinado

La pantalla **Reconocer edificio** de Android permite elegir una galería por campus. La selección se recuerda; la primera vez utiliza **Actual (0.5.0)**. Cambiar de galería borra el resultado y los votos anteriores antes de permitir una ruta. El reconocimiento sigue realizándose en el teléfono, sin enviar ni guardar cuadros de cámara.

| Opción | Referencias | Uso |
|---|---|---|
| Actual (0.5.0) | Assets originales, sin sustituirlos | Referencia y opción predeterminada |
| Maestro confirmado | 143 fotos humanas únicas de AZC y 74 de ESCOM | Comparador sin etiquetas web ni sugerencias sin confirmar |
| Combinado experimental | Referencias vigentes conservadas y adiciones seleccionadas por validación interna | Experimento separado por campus |

No todas las clases tienen evidencia para aceptarse o un destino en el mapa. Todas compiten en la clasificación; sólo una respuesta que supera su umbral y margen y tiene destino permite navegar. Las clases sin operación admisible siguen compitiendo y pueden producir «no sé». Las galerías nuevas no reutilizan los conteos GPS de las fotos de la galería actual.

Los cuatro campus UAM restantes no cuentan con consultas humanas para esta comparación y no reciben galerías experimentales en la app. Sus fotos web y los originales se conservan en las entregas privadas.

**Más datos no garantiza una mejora.** La galería actual de Azcapotzalco ya usa parte del maestro. Consultar [resultados y límites](RESULTADOS.md) antes de elegir una candidata y [tratamiento del maestro privado](CORPUS_PRIVADO.md) antes de compartir datos. Los agregados verificables están en `resultados_publicos.json`.

## Método

MobileNetV3Large se conserva congelada: se actualizan las referencias numéricas y el método para compararlas, no los pesos del extractor. Su SHA-256 es `d01e31483ac10fc887e5b4e7d47ee0e7a93cc196c56286312329401e219474bd`.

Se corrige el intento anterior que había perdido 60 referencias heredadas útiles de ESCOM. Los bancos anclados contienen 299 fotos AZC (143 humanas + 156 web) y 151 ESCOM (74 humanas + 17 web + 60 heredadas sin confirmar). Las heredadas y web no se utilizan como verdad humana. Las cinco fotos retiradas por el propietario permanecen excluidas; los interiores de G y H no se retiran ni se convierten en exteriores.

Antes de puntuar las consultas finales se congelaron 29 recetas: control exacto, comparación por foto, cupos de adiciones, exteriores, centrado, blanqueo diagonal y tres vistas naturales de consulta. En la comparación por foto, el máximo de sus tres vistas ocupa una sola plaza entre las mejores K fotos. Las transformaciones sólo se ajustan con referencias de entrenamiento.

La evaluación conserva 217 consultas humanas únicas: AZC 143/23 grupos y ESCOM 74/16 grupos. Los subconjuntos del catálogo histórico son 117 y 42 fotos, se solapan con las consultas nativas y no son evidencia independiente. La reproducción histórica AZC de 118 filas conserva un alias RGB y se registra aparte; no debe confundirse con las 117 fotos únicas.

Cada grupo final se deja fuera de referencias y ajustes. Una segunda separación por grupos elige la receta y los umbrales sin consultar ese grupo final. Se protegen los aciertos históricos de T y ambas cohortes de ESCOM durante la selección interna; esas condiciones internas no garantizan que los resultados finales mejoren. El maestro es un comparador adicional fijo, fuera de la búsqueda de 29 recetas. Edificio 5 permanece en la verdad y las métricas.

Los errores y las fotos ya se habían inspeccionado antes de este experimento. Por tanto, se trata de **validación interna retrospectiva, no de una prueba externa nueva y ciega**. Los 39 grupos finales pueden seleccionar recetas distintas. Las cifras evalúan ese procedimiento de selección; no son una evaluación independiente del único JSON ajustado después con todos los datos. No validan el voto temporal de siete cuadros ni la cámara en campo.

## Archivos

- `herramientas/optimizar_anidado.py`: motor congelado; importar o verificar no ejecuta consultas finales.
- `anidada/herramientas/objetivo_anidado.py`: calibración y selección interna conservadora.
- `anidada/herramientas/verificar_anidada.py`: exclusión de grupos, alias y pruebas de que alterar el grupo final no cambia la selección interna.
- `anidada/protocolo_*.json`, firmas y verificaciones: reglas y recibos anteriores a la ejecución final.
- `herramientas/features_galerias.py`: extracción desde un manifiesto privado, con validación del modelo y caché firmada.
- `herramientas/preparar_bancos.py`: reconstrucción de los bancos de esta corrida desde los intermedios privados conservados.
- `herramientas/ajustar_exportar_final.py`: ajuste final con la misma regla interna y exportación para la app, separado de la evaluación.
- `pruebas/`: casos sintéticos que pueden ejecutarse en CI sin imágenes privadas.

## Reproducir sin publicar el maestro

Las entradas privadas se conservan fuera del repo. Para reproducir esta corrida, copiar esta carpeta de código a una carpeta de trabajo privada y colocar sus bancos y metadatos originales en `privado/`. No añadirlos a Git. Se necesitan `bancos_ajuste.npz` y `bancos_ajuste_metadata.json`; el motor comprueba sus hashes, dimensiones y etiquetas humanas. Para reconstruirlos desde la evaluación anterior:

```powershell
python herramientas/preparar_bancos.py --root <trabajo-privado> --evaluacion <intermedios-evaluacion-privada>
```

Ese segundo directorio contiene el manifiesto de evaluación, los rasgos y su metadata, la configuración histórica, el recibo de retiros y `cache_features/`. Los archivos de configuración histórica remiten a las galerías originales locales. Las entradas seudonimizadas y las consultas tampoco se publican. El constructor reproduce esta corrida concreta y valida sus cantidades; no es un importador de cualquier corpus futuro.

Con Python 3.12, instalar `requirements-numericos.txt`. Desde la copia privada:

```powershell
python anidada/herramientas/verificar_anidada.py
python herramientas/optimizar_anidado.py
# Sólo después de verificar el protocolo y sus firmas:
python herramientas/optimizar_anidado.py --run-outer
# Tras terminar la evaluación, ajustar y exportar a una carpeta privada nueva:
python herramientas/ajustar_exportar_final.py --repo <checkout-repo> --output <exportaciones-privadas>
```

No se deben reutilizar resultados congelados al cambiar código o datos: usar una carpeta nueva y volver a verificar. Una copia idéntica reproduce las firmas; el programa rechaza cambios sobre una corrida ya congelada. La extracción de características requiere además las dependencias del entrenamiento del extractor y un manifiesto autorizado; los tests numéricos no necesitan TensorFlow.

Pruebas públicas:

```powershell
python -m unittest discover -s entrenamiento/comparacion_corpus/pruebas -v
```

Las galerías exportadas se añaden en `app-kmp/androidApp/src/main/assets/reconocimiento/corpus/{maestro,combinado}/`. El extractor, las galerías y extras originales permanecen en su ubicación. El AAB firmado de 0.5.0 se conserva sin reconstruir ni sobrescribir. Esta actualización del PR no carga ni publica una nueva versión en Play; cualquier envío futuro necesita una versión nueva y validación en campo.
