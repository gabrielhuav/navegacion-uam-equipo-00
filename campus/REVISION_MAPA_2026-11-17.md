# Revisión detallada de UAM Azcapotzalco · 17 noviembre 2026

El mapa queda preparado para revisión en el PR #23 antes de preparar otra actualización de Google Play. Se incorporó la base de Gemini y se corrigieron sus interferencias geométricas comprobables, conservando las mejoras de fachadas y entorno. Las fotografías respaldan rasgos visuales; las dimensiones de los detalles siguen siendo aproximaciones.

[Abrir comparación interactiva](REVISION_MAPA_2026-11-17.html) · [Plano actual sin marca](plano_2d_sin_marca.png) · [Visor 3D portátil](Visor_UAM_autonomo.html) · [Auditoría numérica](validacion/INFORME_AUDITORIA_2026-11-17.json).

## Base de Gemini conservada

Los cambios se encontraron en su carpeta de trabajo aislada, todavía sin incorporar a este checkout. Se respaldaron ambas versiones completas antes de copiar la base. La memoria existente se conservó y se añadió únicamente la sección nueva de Gemini.

Se mantienen sus detalles de T —escaleras, pórtico, ventanillas y cubiertas—, G y su paso central, la biblioteca I/COSEI, el pórtico de W, los talleres P1–P4, pabellones HO/HP, cafetería, plazas, canchas y accesos. También se conservan sus niveles corregidos de P1/P2/P3 y los desplazamientos de esculturas ya guardados. Estas mejoras son de Gemini; las siguientes correcciones son posteriores.

## Qué se mejoró en esta revisión

### Estacionamientos y vialidad

La exclusión anterior comprobaba principalmente puntos centrales. Eso permitía que bordes, carriles o camellones atravesaran un edificio aunque su centro quedara fuera. Ahora se comprueba la huella completa y se recortan las piezas que pueden fragmentarse; un cajón se dibuja únicamente cuando cabe completo.

Se consideran el giro real de HO/HP, desplazamientos de edificios, geometrías que sobresalen en planta baja y las posiciones, giros y escalas guardados de las esculturas. Los trazos respetan plazas y reservas peatonales. Al mover o redimensionar un estacionamiento se redistribuyen sus elementos conservando el paso y el grosor en unidades de modelo, sin estirarlos.

Se corrigieron las interferencias en A, HP y R, se eliminaron líneas de cajón duplicadas y cabeceras superpuestas, y la delimitación de obra de A dejó de depender del desplazamiento del estacionamiento. Se mantienen las reglas de Gemini para legibilidad: líneas de 0,26–0,28, paso de 2,7, guarniciones de 0,48 y separación vertical entre superficies. Son decisiones gráficas; la distribución de cajones no es un censo de capacidad real.

Se retiró la asignación automática de cajones azules cuya ubicación no estaba confirmada. Los indicadores de accesibilidad de las rutas no cambian.

### Correspondencia entre rutas y geometría visible

Se revisaron nueve aproximaciones en B, C, D, E, F, G, W y T. En B–F se abren sólo los antepechos y paños de planta baja que cortaban el recorrido existente. En W se abre el volumen bajo conservando laterales y dintel. En T se interrumpe el parasol inferior donde invadía el paso a la altura de la cabeza. La pilastra de G se retrae íntegra unos 0,635 de modelo, sin cortar la columna ni desplazar los refuerzos.

La abertura nominal de representación es de 2,4 de ancho y 2,35 de altura; se adapta al ángulo de cada aproximación. No son medidas levantadas de puertas reales. Se conservan los paños superiores y las piezas de otras fachadas. No se añaden destinos ni se mueven rutas para ocultar colisiones. [Detalle por tramo y límites](ACCESOS_MODELADOS_2026-11-17.md).

### Acabados contrastados con ambos corpus

La revisión documenta referencias exteriores del maestro confirmado y de la colección web. Las imágenes interiores de G y H no se utilizaron para inferir fachadas. Se respetaron las fotografías retiradas por el propietario.

Se añadieron dos detalles que faltaban en la base: juntas horizontales y verticales de paneles de concreto de W, recortadas alrededor de ventanas, y juntas verticales del revestimiento cerámico azul de P1. Son 50 piezas ligeras con geometría/materiales compartidos; siguen las transformaciones de sus edificios y no incorporan fotos ni datos personales. Los rasgos ya modelados por Gemini no se duplican. [Evidencia pública y aproximaciones](EVIDENCIA_DETALLES_2026-11-17.md).

### Arquitectura y mobiliario reconstruidos desde las fotos

La segunda pasada añade formas reconocibles que antes eran bloques: cubierta traslúcida con cerchas tubulares rojas y perímetro redondeado en P4; cinco mesas con bancos y bastidores; exhibidor amarillo de conexiones con perfiles I abiertos, placas, rigidizadores y pernos; e invernadero de P2 con techo a dos aguas y marcos blancos abiertos. Se conservan las formas y dimensiones generales. La comprobación global reveló que la ubicación heredada del invernadero quedaba dentro de O: el conjunto se desplaza al espacio libre junto a P2, conservando los límites de ambos edificios. Su ubicación corregida sigue siendo esquemática, no una coordenada medida. [Seis fotos y correspondencia de cada elemento](AMPLIACION_ARQUITECTURA_CORPUS_2026-11-17.md).

En las plazas se completan los ocho botes rojo/blanco, se apoyan las bancas curvas de J sobre su pavimento y se añaden paños y franjas del suelo, delimitadores de jardín, una rejilla circular y una mesa hexagonal con seis asientos. Las posiciones nuevas son esquemáticas dentro de las superficies existentes. Una banca de J se desplaza 2,62 unidades de modelo hacia el centro de la plazuela para liberar el corredor; conserva forma, giro y escala, y permanece íntegra sobre el pavimento. No se añaden instalaciones temporales ni rasgos de fotos antiguas sin corroboración. [Referencias exteriores y decisiones](ENTORNO_CORPUS_2026-11-17.md).

El visor incorpora cámaras para el patio de P4, sus conexiones de acero y el invernadero de P2. La vista de patio se sitúa dentro del corredor para que los edificios vecinos no oculten las cerchas y mesas. [Patio](revision-2026-11-17/P4_patio.jpg) · [Acero](revision-2026-11-17/P4_acero.jpg) · [Invernadero](revision-2026-11-17/P2_invernadero.jpg).

### Documentación y reproducción

Se conservaron ambas guías metodológicas en `campus/`. Se corrigieron la escala documental 0,375 y la altura de nivel 3,4: los datos reales conservan `metersPerPixel = 740/1670 = 0.4431137724550898` y `storeyHeight = 3.3`. No se cambió la escala del campus. Los cardinales se obtienen de la georreferencia y no se deducen directamente de los signos X/Z.

`build.mjs` conserva los bytes de `route-data.js` cuando sólo difieren saltos de línea. No se utiliza una restauración indiscriminada de Git. Los cinco módulos nuevos también se incrustan en el visor portátil y el comprobador verifica su igualdad con las fuentes.

## Verificación de los archivos exportados

Los dos GLB y los dos PNG se generaron desde **Guardar cambios** en el visor real. Después se reconstruyó el portátil y se auditaron los archivos guardados, con un comprobador independiente de las funciones que los generan.

| Comprobación | Base de Gemini | Revisión actual |
|---|---:|---:|
| Intersecciones de aparcamiento con edificios, usando triángulos y huellas giradas | 15 | 0 |
| Cortes de los ejes peatonales a altura 1 | 8 | 0 |
| Cortes a altura 1,8 | 3 | 0 |
| Cortes a altura 2,2 | 2 | 0 |
| Sondeos laterales para ancho nominal 1,2, a altura 1 | 54 | 31 |
| Nodos del GLB con marca | 10.836 | 8.813 |

Los 31 sondeos laterales restantes ya afectaban a objetos/lados de la base de Gemini: pilares de pasillos y refuerzos. No se han eliminado elementos estructurales sin evidencia para hacer desaparecer esos resultados. **El eje libre de colisiones no certifica un ancho continuo libre ni accesibilidad.** Falta contrastar esos pasillos y accesos en campo antes de hacer afirmaciones sobre sus anchos útiles.

Se conservan exactamente 26 edificios y sus huellas, siete estacionamientos, seis accesos, 115 nodos, 120 tramos, 31 destinos, tres ediciones guardadas, georreferencia y PNG RGBA de 1560×640. `georreferencia.json` y `rutas.json` conservan los bytes locales previos. Los módulos JavaScript y HTML se normalizan a LF mediante `.gitattributes`, incluido `route-data.js`, sin alterar sus datos; el informe distingue hashes locales de los JSON y hashes normalizados del repositorio. La diferencia entre variantes GLB con/sin copyright sigue siendo de 34 nodos.

Pasaron los comprobadores compartido y general, el contrato actual, ocho escenarios de exclusión, escenarios de estacionamientos trasladados/girados/redimensionados, pruebas de los detalles, pruebas de accesos y pruebas analíticas independientes de auditoría. También se comprueban independientemente las 86 mallas físicas del entorno contra el corredor continuo de 1,8, incluidos extremos redondeados y sin exenciones para piezas heredadas: cero invasiones. La envolvente tridimensional completa de las 38 mallas del invernadero también queda separada de las 4.835 mallas restantes de edificios, incluidas columnas y rampas bajas. Los comprobadores antiguos de editor, esculturas y rutas ya tenían comparaciones históricas incompatibles con las ediciones de Gemini; se conservan sus aserciones y sus fallos se distinguen de los controles semánticos actuales satisfactorios.

La página de comparación permite alternar versiones, deslizar antes/después y acercar el plano. Se revisó el modelo en el navegador y se guardó [evidencia visual de W](revision-2026-11-17/W_fachada.jpg). No se midieron FPS ni rendimiento de Filament en teléfono.

## Estado de entrega

El usuario autorizó incorporar los cambios al mismo PR #23 mediante commit y push. La aprobación e integración del PR corresponden al usuario; esta entrega no prepara ni envía otra versión de Play. Los originales del corpus, los modelos de reconocimiento y los AAB de 0.5.0 se conservan. La réplica de Descargas sigue vinculada al checkout anterior de `main`; no se sobrescribió ni se cambió su manifiesto para forzar una sincronización desde otro worktree.

La siguiente preparación de la app debe tomar juntos GLB, PNG, JSON y georreferencia de esta revisión, comprobarlos en teléfono y mantener separadas la precisión del reconocedor, la exactitud del mapa y la accesibilidad física.
