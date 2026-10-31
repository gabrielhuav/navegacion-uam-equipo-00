# Método de construcción · campus web y assets móviles

## 1. Asegurar el trabajo antes de modelar

Leer AGENTS.md, memoria compartida y README del ejemplo. Revisar rama, HEAD, cambios, worktrees y archivos guardados por el usuario. Crear respaldo verificable antes de modificar un campus aceptado: estado editable, assets y georreferencia juntos, memoria, HEAD y hashes; un bundle Git conserva también el historial confirmado, pero no sustituye la copia de cambios sin confirmar.

Escoger una rama y carpeta nuevas desde la base vigente, sin asumir que `main` o una rama antigua contienen lo último de Claude. Preferir un worktree aislado si hay trabajo paralelo. No cambiar ni limpiar por fuerza el checkout del usuario. En ESCOM, GitHub Desktop cambió de rama y guardó los cambios en un stash; se recuperaron en otro worktree y se conservó el stash. Ante una desaparición de archivos, revisar estado/reflog/stash antes de reconstruir o sobrescribir.

Definir nombre, slug, carpeta, nombres GLB y puerto libre. No detener servidores existentes por comodidad. En Windows, iniciar ayudantes sin ventana visible cuando el usuario no necesita interactuar con ellos. Resolver todas las rutas de copia/borrado antes de acciones recursivas. Conservar la carpeta `campus/` de Azcapotzalco.

## 2. Investigar el plantel correcto

Buscar fuentes primarias: ubicación oficial, directorio, croquis general, planos por edificio/piso, Protección Civil, informes de obras y fotografías institucionales. Revisar fecha del documento y vigencia: un croquis antiguo puede omitir edificios recientes y una foto de acceso no prueba que esté abierto hoy.

Abrir los PDF y revisar sus láminas visuales, no sólo el texto extraído. Aplicar la habilidad PDF disponible cuando corresponda. Revisar imágenes a resolución suficiente. Los croquis pueden incluir QR: en ESCOM se decodificaron siete QR que llevaron a planos oficiales de edificios, con niveles y funciones. Son referencias muy útiles aunque no tengan cotas.

Crear un inventario antes de dibujar: ID estable, nombre oficial, función, niveles, huella, acceso, fuente y confianza. Separar instalaciones vecinas. En ESCOM no se incorporaron CIC/CIDETEC como si fueran edificios de la escuela.

OSM es una referencia contrastable, no una autoridad infalible. Sus nombres, agrupaciones y niveles pueden discrepar de los planos. En ESCOM, OSM reunía las filas laterales bajo 1/2 y rotulaba partes del cuerpo central sur como 3/4. Los planos oficiales permitieron dividir 1/3 y 2/4 y reconocer el Edificio 5. Documentar correcciones; no copiar etiquetas dudosas silenciosamente.

Guardar enlaces, páginas, fecha de consulta y discrepancias en FUENTES.md; proporcionar referencias.html para inspección humana. Mantener atribución/licencia de datos usados. No incorporar fotografías, logotipos o teselas como texturas por el mero hecho de poder verlos: modelar geometría propia y registrar las fuentes.

## 3. Resolver orientación, escala y georreferencia

Verificar coordenadas reales del campus mediante fuentes públicas/cartografía. No reutilizar el centro geográfico de otra escuela. Elegir una referencia norte/este y anclas reconocibles: edificios, esquinas, calles, canchas y entrada. Las fotos del usuario pueden tener orientaciones diferentes; no girar una huella por parecido visual sin contrastar sus anclas.

Escoger un origen y trabajar en metros locales. Convención del proyecto: suelo X/Z, altura Y; +X a la derecha y −Z arriba en el PNG. Los ejemplos antiguos almacenan puntos como `[px,py]`: `x=(px−895)*metersPerPixel`, `z=(py−390)*metersPerPixel`. Es una convención heredada del editor, no píxeles de la imagen satelital. En ESCOM `metersPerPixel=1`. Registrar explícitamente cualquier otra transformación.

Para un campus nuevo se puede elegir un encuadre propio. Fijar `unit.plan={xMin,xMax,zMin,zMax,pxPorMetro}` con margen suficiente. El PNG tendrá ancho `(xMax−xMin)*pxPorMetro` y alto `(zMax−zMin)*pxPorMetro`. Una vez aceptado/integrado, no cambiar límites, tamaño, recorte u orientación sin recalibrar y coordinar las apps.

Contrastar varias esquinas distribuidas entre varios edificios con una imagen georreferenciada. Guardar puntos de origen/destino y el ajuste afín `[x,z,1] × matriz3x2 → [este,norte]`. La matriz puede revelar escala, giro y pequeños desajustes; no multiplicar todas las coordenadas por un factor sin entender qué capa corrige. Verificar que no se aplica dos veces la calibración entre el modelo y las apps.

Generar `georreferencia.json` con `plano`, `ancho`, `alto`, `superiorIzquierda`, `superiorDerecha` e `inferiorIzquierda`, cada esquina `[lat,lon]`, y metadatos de método/controles/error. El lector móvil debe usar ese mismo contrato. La transformación exacta modelo→lat/lon también debe usarse para rutas.

Declarar RMS y máximo **internos** por separado de la incertidumbre absoluta. Si la huella y los controles salen de las mismas fuentes, el ajuste no es validación independiente. No heredar el rango de error de ESCOM a otro campus. Registrar paralaje de cubierta, resolución, fecha de consulta, fecha de adquisición si se conoce y necesidad de control de campo. En ESCOM el RMS interno fue 0,816 m; el rango absoluto 5–12 m fue orientativo, no una medición GPS.

Si falla la exportación de imágenes de un proveedor, puede usarse su servicio documentado de teselas como referencia, conservando zoom, fila/columna, tamaño y proyección para reconstruir coordenadas. No confundir el índice de tesela con una coordenada de modelo ni distribuir mosaicos sin revisar las condiciones aplicables.

## 4. Construir geometría ligera y reconocible

Partir de huellas poligonales contrastadas. Usar polígonos múltiples o anillos para alas y patios: un patio abierto no debe convertirse en un prisma cerrado. Alinear cubiertas, cuerpos laterales y accesos con la misma planta. Las cajas de encuadre (`rects`) pueden servir para rótulos/selección; no reemplazan las huellas reales ni sirven por sí solas para detectar colisiones de edificios rotados.

Crear un módulo `architecture.js` propio del campus y separar los datos de la representación. Confirmar niveles con planos PB/P1/P2, etc.; estimar la altura entre pisos si no hay cota y declarar la estimación. Un sótano mencionado no basta para inventar su geometría. No contar azoteas, cubiertas ligeras o dobles alturas como pisos adicionales sin evidencia.

Priorizar rasgos visibles: bandas de concreto, ventanales, colores, cubiertas, núcleos, escaleras, puentes, patios y hitos. Es una interpretación simplificada para navegación, no un BIM. Los puentes elevados no deben convertirse en bloques sólidos que corten recorridos de PB. El arbolado y las superficies deben excluir huellas y caminos; usar polígonos, no sólo cajas alineadas a ejes que eliminen jardines completos.

Estacionamientos rotados: conservar su polígono, no pintar su rectángulo envolvente sobre los jardines. Agrupar la geometría con un origen conocido si será editable. Registrar elementos mediante el sistema de selección/transformaciones existente para que los movimientos se guarden en JSON. Evitar duplicar referencias visuales en grupos que no sigan los desplazamientos.

No copiar la arquitectura de otra escuela cambiando sólo el nombre. Reutilizar infraestructura y utilidades; construir la forma del nuevo campus a partir de sus fuentes.

## 5. Reutilizar el editor sin arrastrar supuestos particulares

Ejemplo de trabajo: `campus-escom/`. Leer `app.js`, `index.html`, `model-data.js`, `architecture.js`, `copyright-layout.js`, `server.mjs` y `build.mjs`. Copiar sólo infraestructura necesaria y vendor/licencias; reemplazar completamente datos, arquitectura y referencias específicas.

Configurar `unit.name`, `slug`, `glb`, `port`, `plan`, `accent`, coordenadas, cámaras y nombres de grupos. Revisar textos en HTML, mensajes, nombres de descarga, rutas de guardado y el HTML portátil. Un nombre GLB olvidado puede pasar desapercibido por HTTP si el servidor impone su propio nombre, pero fallar al descargar el HTML portátil.

Mantener cámara orbital, plano superior con norte calculado desde las esquinas, selección de edificio, edición opcional de objetos, deshacer/rehacer, cambios pendientes y protección frente a recarga accidental. Preservar controles sencillos; dejar las fuentes y detalles técnicos fuera del flujo principal.

`campus_editado.json` es el estado guardado por el usuario. `model-data.js` contiene ORIGINAL, la base; `campus_base.json` deriva de ella. El visor servido carga los cambios guardados. Al crear un checkpoint inicial las bases pueden coincidir; después de ediciones del usuario pueden divergir legítimamente. No copiar ORIGINAL encima de sus cambios para hacer pasar una prueba.

Usar UTF-8 explícito al leer/escribir todos los archivos, especialmente en Python/PowerShell para Windows. En esta sesión una lectura con la codificación por defecto produjo `CafeterÃ­a`; se corrigió y se añadió comprobación. No aplicar una conversión global a archivos sanos: identificar primero dónde ocurrió la decodificación.

## 6. Copyright y exportaciones coherentes

Texto `copyright @gabrielhuav` repetido dentro de la maqueta, más rótulo de esquina, con bandera `showCopyright`. Grupo `Marca_copyright_modelo`, hijos `Copyright_integrado_*`. Elegir color representativo con fuente; si es aproximación digital, indicarlo en documentación. Orientar el texto con el norte del campus para su lectura en las apps, evitando que aparezca invertido.

Guardar cambios debe producir:

- `campus_editado.json`;
- `<NombreCampus>.glb` y `<NombreCampus>_sin_marca.glb`;
- `plano_2d.png` y `plano_2d_sin_marca.png`;
- `rutas.json`, cuando la red esté incluida;
- `georreferencia.json` se mantiene coherente con el encuadre fijado, aunque no se regenera con cada movimiento.

La variante sin marca se exporta ocultando sólo su grupo y omitiendo el rótulo de esquina; después se restaura la visibilidad. No alterar geometría, cámara de exportación, recorte o resolución para retirar la marca.

PNG: cámara ortográfica fija, RGBA transparente, ocultar base rectangular, selección, retícula y ayudas. La red editable es una capa separada: la app dibuja rutas encima, no debe quedar horneada en GLB/PNG. Exportar los assets completos aunque el usuario haya ocultado vegetación para inspeccionar el modelo.

`node build.mjs` reconstruye el HTML autónomo y datos incorporados; **no genera el GLB ni el PNG**. Para eso abrir el visor y usar Guardar cambios, comprobando el resultado real y los archivos. `server.mjs` se limita a localhost, guarda nombres explícitos y rechaza redes inválidas. El HTML fuera del servidor descarga archivos; no puede escribir libremente en la carpeta del proyecto.

## 7. Red peatonal si está dentro del encargo

Contrato: `version`, `unidad`, `nodos`, `aristas`, `destinos`. Nodo: ID, lat/lon, x/z en metros del modelo, nivel y tipo (`cruce/acceso/entrada`). Arista no dirigida: `de`, `a`, `metros`, tipo y booleano `accesible`. Destino: ID estable, nombre y nodo de entrada. Añadir metadatos de evidencia sin romper el contrato básico.

Trazar caminos observados en croquis/fotos/imagen. Poner destinos en puertas o fachadas accesibles, no en centroides cerrados. Dividir todas las intersecciones de PB en nodos comunes; evitar que un nodo quede sobre el interior de una arista sin dividirla. Comprobar un componente y que ningún tramo atraviese una huella cerrada ni salga del predio.

Longitudes: usar la transformación geográfica calibrada, especialmente si el modelo tiene corrección de escala. Si hay niveles, el cálculo debe contemplar el recorrido vertical/real; el ejemplo ESCOM sólo maneja PB. No anunciar escaleras, elevadores o rampas transitables por piso copiando un módulo que valida exclusivamente nivel 0.

Un generador puede evitar automáticamente huellas y conectar borradores, pero esos desvíos no demuestran que exista pavimento, ancho libre o acceso abierto. No presentar el resultado como ruta físicamente verificada ni evacuación. Accesibilidad requiere evidencia; ESCOM mantuvo `accesible:false` por falta de recorrido de campo. Cambiar IDs de edificios o red puede afectar destinos guardados en las apps.

Reutilización: adaptar **route-space.js**, **route-editor.js**, **route-data.js** y el generador, no sólo rutas.json. Revisar encuadre en modelo→geo, slug, huellas, nivel permitido, destinos obligatorios, formato de accesos/plazas, desplazamientos de edificios y validación del servidor. En ESCOM se reemplazaron los obstáculos rectangulares de AZC por polígonos reales. Un `--write` del generador reemplaza ediciones; ejecutarlo por defecto sin escritura.

## 8. Verificar antes del checkpoint

Hacer comprobaciones proporcionales a los cambios, con casos que descubran errores reales:

- Identidad, inventario, niveles y coherencia con fuentes; nombres Unicode correctos.
- Esquinas, dimensiones PNG, transformación inversa/calibración y residuos reproducibles.
- GLB válido y autónomo, sin buffers/texturas externos; presencia de edificios y grupos esperados; variantes difieren sólo en copyright.
- PNG transparente, mismo encuadre/tamaño/orientación en ambas variantes, sin ayudas de edición.
- Grafo: IDs únicos, referencias válidas, destinos completos, conexidad, metros y lat/lon coherentes, colisiones, intersecciones partidas. Inyectar ejemplos inválidos para comprobar rechazo.
- Interfaz real: abrir vistas, seleccionar edificio, consultar fuente, mover/deshacer un elemento y un nodo, activar/restaurar marca, guardar y volver a cargar. Dejar revertidas las ediciones de prueba.
- Servidor: rechazar una red inválida sin cambiar el archivo anterior. Verificar hashes cuando corresponda.
- Inspección visual desde arriba y en perspectiva: patios, orientación, fachadas, accesos y solapes. Guardar captura representativa.
- Comprobar que las apps y otros campus no se modificaron fuera del encargo. Un verificador con hashes/commit base específico se debe adaptar: no reutilizar cifras, rutas o expectativas de ESCOM como supuestos universales.

Al comprobar sólo una actualización documental, no hace falta regenerar maquetas ni ejecutar pruebas de geometría.

## 9. Cerrar y dejar continuidad

Guardar GLB/PNG/JSON/georreferencia/red coherentes, reconstruir HTML cuando cambió código/base, comprobar cambios pendientes y crear commit/checkpoint. Respaldar archivos y memoria con hashes; registrar rama, commit, tag y ruta efectiva. No hacer push, merge ni instalaciones en dispositivos sin que formen parte del encargo.

Actualizar MEMORIA_COMPARTIDA_CAMPUS.md con decisiones, fuentes, precisión, pruebas, pendientes y lo que falta integrar en las apps. Si se trabajó en otro worktree, indicar explícitamente dónde está la memoria nueva: la copia en main puede no contenerla aún. No reaplicar un stash antiguo sobre archivos ya recuperados.

Entregar enlace al visor, carpeta, captura, commits y mensaje para Claude. La integración móvil copia assets, registra el campus/slug y recompila; guardar la web no cambia una app instalada. Conservar una sola fuente de diseño por campus y una memoria que ambas sesiones puedan leer.
