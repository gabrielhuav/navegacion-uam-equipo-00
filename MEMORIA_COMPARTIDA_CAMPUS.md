# Memoria compartida del campus · Web y app móvil

## COSEI: letras, palmeras y Caracol · 22 octubre 2026

Referencia: dos fotografías nuevas de Gabriel. Se añadieron letras volumétricas simplificadas SOY UAM sobre base roja, editables con ID `letters_SOY_UAM_COSEI`; Caracol con tres bancas curvas de concreto, pavimento y jardín central, ID `caracol_COSEI`. Campos `cosei.soyUam` y `cosei.caracol`. Se incorporaron tres palmeras a las tres existentes y el asta pasó a `[870,516]`, junto al borde de la plataforma/escaleras. Distribución, dimensiones y forma del Caracol aproximadas: pendientes de ajuste preciso del usuario. Las letras vistas desde atrás se leen invertidas, como en las fotos.

Checkpoint previo `checkpoint/antes-cosei-letras-caracol` sobre fd466fc. Se exportan GLB/PNG y JSON conjuntamente; encuadre, georreferencia, rutas y entrenamiento/P4 conservados. Se comprobó la vista COSEI y la presencia de letras y bancas en GLB. No se modificaron apps ni se hizo push.

## Escultura de vidrio en COSEI · 22 octubre 2026

Añadida en `feature/10-esculturas` sobre `edf8bac`, a partir de la fotografía aportada por Gabriel: pedestal rectangular de concreto con placa sin inscripción, zócalo y panel inferior opaco, cuatro paneles de vidrio con montantes y fijaciones, y dos cuerpos facetados claros en el interior. Nombre descriptivo provisional «Escultura de vidrio · COSEI»; no se atribuye autor ni título de obra. Altura y proporciones aproximadas (unos 4.3 m incluyendo base), posición inicial `[736,470]` cerca de G/E dentro de COSEI, pendiente de ajuste preciso por el usuario.

Estado: `vidrioCosei` en JSON/base; ID editable `sculpture_vidrio_COSEI`; grupo GLB `Escultura_vidrio_COSEI`. Botón «COSEI · Escultura de vidrio» para acercarse. Se puede mover, girar, deshacer y guardar mediante las herramientas existentes. La escultura anterior de G se conserva: son elementos distintos en la foto. Geometría ligera y vidrio con material estándar transparente, sin texturas externas.

Se exportaron ambos GLB y PNG desde Guardar cambios, se reconstruyó el HTML portátil y se verificaron: presencia del nuevo grupo y vidrio transparente en ambos GLB, cuatro paneles y dos poliedros, conservación exacta de todos los campos previos del JSON, posiciones de las tres esculturas del PR, dimensiones PNG 1560×640, georreferencia/rutas/apps intactas. Prueba visual, movimiento/giro con deshacer antes de exportar y consola sin errores. Evidencia: `docs/capturas/azc_vidrio_cosei_2026-10-22.png`. Se mantiene `showCopyright:false` del estado del equipo. Falta comprobar aspecto en el renderizador móvil al integrar con Claude.

Checkpoint anterior: tag local `checkpoint/antes-escultura-vidrio-cosei-2026-10-22` (`edf8bac`), más copia de campus y memoria en `_respaldos/2026-10-22_antes_escultura_vidrio_cosei` de la carpeta del curso. Prototipo 4 y entrenamiento siguen protegidos como se indica abajo; no se modificaron ni mezclaron sus ramas. Réplica de Descargas comprobada sin divergencias antes de sincronizar. No se hizo push.

## Actualización 22 octubre 2026 · HTML de esculturas y protección de P4

Rama de esta corrección: `feature/10-esculturas`, PR #11, sobre `8fdf9e1`. El PR ya incluía Habitaciones de Luz, Universitas y Casa abierta al tiempo en el código y GLB, pero el HTML autónomo y la base no se habían reconstruido. Además, la pestaña 8782 correspondía a ESCOM, en otro checkout.

Se reconstruyó el HTML, se añadieron tres cámaras de acercamiento y se corrigió build.mjs para incluir `campus_editado.json` en el portátil (sin perder los desplazamientos acomodados por el equipo). `campus_base.json` sigue derivándose de ORIGINAL. Vista actual AZC: http://127.0.0.1:8783/Visor_UAM_autonomo.html. El puerto es local y temporal; el inicio normal conserva su configuración.

Se conservaron sin cambios los GLB/PNG, el estado guardado y su `showCopyright:false`, model-data.js, georreferencia, rutas y las apps. Pruebas: verificar-esculturas.mjs valida código embebido, estado portátil, base, botones, presencia y posición de las tres esculturas en ambos GLB; verificar.mjs y comprobación sintáctica correctas. Las tres cámaras se comprobaron en el navegador, sin errores de consola. Evidencia: `docs/capturas/azc_esculturas_2026-10-22.png`.

**Prototipo 4 ya existe en otra rama:** `feature/p4-reconocer-escom`, commit `7b61ce2`, protegido con tag local `checkpoint/p4-entrenamiento-2026-10-22`. Incluye los assets de reconocimiento de ESCOM y su integración. No se mezcló en esta rama antigua del PR. Las notas históricas de abajo que hablan de P4 pendiente no describen el estado de esa rama.

Entrenamiento original: `C:/dev/entrenamiento-escom`, conservado intacto. Respaldo previo: `C:/Users/gabri/Downloads/1151055 Administracion/_respaldos/2026-10-22_antes_corregir_html_esculturas`, con campus, memoria, bundle Git de todas las ramas y copia de modelo/exportado, corridas, salidas y fuentes del modelo con manifiestos SHA256. El corpus y entorno originales permanecen en su ubicación; este respaldo adicional del entrenamiento no duplica todo el corpus ni .venv.

Para integrar con Claude: incorporar la corrección del visor sobre la rama de desarrollo que contiene P4; conservar sus assets y entrenamiento. No sustituir la app P4 por el estado de app-kmp/app-flutter de esta rama. El commit de la corrección es local hasta que se publique.

Actualizada: 18 de octubre de 2026. Fuente revisada: sesión de Claude «Unidad III actualización y decisiones de material», archivos locales y commit f5311cb de la rama feature/p2-campus. Este documento es el punto común para Claude y Codex; no sincroniza automáticamente los historiales de los chats.

## Fuente del diseño

La carpeta canónica es C:/dev/navegacion-uam-equipo-00/campus. La copia de Descargas, C:/Users/gabri/Downloads/1151055 Administracion/Proyecto/Modelo_3D_UAM, es una réplica de consulta/compatibilidad. Editar primero la carpeta canónica y actualizar la réplica con sincronizar-replica.mjs. No desarrollar dos diseños por separado.

Guardar cambios en el visor canónico produce campus_editado.json, UAM_Azcapotzalco.glb y plano_2d.png. El JSON es el estado editable; ORIGINAL/model-data.js es la base. build.mjs reconstruye el HTML y campus_base.json; no exporta por sí solo GLB/PNG. Mantener estables los IDs de edificios y objetos.

## Diseño confirmado con el usuario

- H, HO y HP: PB + 3 pisos, cuatro niveles. Nombres HO/HP en mayúsculas, fachadas curvas hacia estacionamiento. Uniones integradas en PB y pisos 1 y 2; parte superior translúcida con estructura amarilla aproximada.
- W y P: tres niveles. Pasillo integrado P–K–H–E–C en PB, 1 y 2.
- Plaza Roja rodeada por C/E/F/G, con jacarandas. G tiene refuerzos rojos en ambas fachadas; la escultura aproximada está del lado COSEI.
- Biblioteca = I. Plaza COSEI tiene asta, bandera, plataforma con desnivel y escalinata. Materiales, escultura y medidas arquitectónicas son aproximaciones.
- J = cafetería, junto a L; no colocar un edificio nuevo frente al H. Espacio posterior de H hacia el perímetro = estacionamiento conectado.
- A en construcción en el lugar marcado por el usuario. Mantener accesos peatonales/vehiculares; T no tiene salida hacia Eje 5 Norte.
- Conservar simplicidad: navegación normal y herramientas de edición opcionales. El usuario acomoda elementos, guarda y luego solicita checkpoint.

## Contrato técnico compartido

Modelo: suelo X/Z, altura Y; S=740/1670, X=(px-895)*S, Z=(py-390)*S. La relación base es aproximada.

Plano de exportación: xMin=-390, xMax=390, zMin=-150, zMax=170; 2 píxeles por unidad de modelo; imagen transparente de 1560×640. +X a la derecha y -Z hacia arriba en la imagen. No cambiar encuadre, recorte, dimensiones u orientación sin recalibrar georreferencia.json.

Georreferencia vigente: ajuste descrito por Claude con 10 edificios H/L/G/C/B/D/P1/P3/M/R sobre imagen Esri del 17 oct 2026; error típico declarado ~6 m. metrosPorUnidad=1.0895, que sustituye el 1.124 anterior. Se conserva el JSON con sus tres esquinas exactas. Esta precisión se documenta como estimación de la calibración de Claude; no se volvió a medir satelitalmente en esta revisión.

No multiplicar a ciegas todas las huellas/alturas por 1.0895: el modelo y la proyección geográfica son capas distintas. KMP coloca la imagen usando las esquinas del JSON. En Campus.kt, Georreferencia/leerGeorreferencia no consumen actualmente metrosPorUnidad. El campo es metadato de calibración, no una escala aplicada por ese lector.

La orientación del norte se obtiene de esas mismas esquinas, como norteEnModelo de Campus.kt. El visor web ahora usa la misma fórmula en Google Maps/Plano superior. La vista aprobada histórica se conserva. El límite web impide bajar de 12° sobre el horizonte; Android usa una relación vertical/horizontal de 0.2 (~11.3°), descrita por Claude como unos 12°.

## Estado real de la app

KMP Android: app-kmp/shared/src/androidMain/kotlin/ovh/gabrielhuav/salones. Mapa.android.kt coloca el PNG sobre teselas; Campus3D.android.kt carga el GLB con Filament. Los assets GLB/PNG/georreferencia se copian desde campus al compilar mediante copiarCampus en app-kmp/androidApp/build.gradle.kts. Guardar desde la web no actualiza una app ya instalada: hay que recompilar/reinstalar.

Android conserva TextureView, modelo reutilizado, dibujo tras interacción y currentBookmark; preservar estas decisiones para evitar los fallos previos descritos por Claude. El código incorpora giro e inclinación por arrastre y límite del suelo. No se hizo prueba en dispositivo durante esta revisión. Claude reportó compilación/pruebas correctas, pero emulador y teléfono se desconectaron en la última verificación de gestos.

Flutter (actualizado 18 oct): ya tiene Mapa, 2D y 3D y los temas; ver las secciones de abajo. iOS sigue sin 3D y sin el paso de copia de assets; no anunciar paridad completa en iOS.

Pendientes (18 oct): tocar edificio para centrar en 2D/3D; modo de interfaz simplificada; prueba física final; merge de feature/p2-campus y feature/p3-temas a main con sus versiones. Flutter y láminas ya hechos. No son tareas completadas por crear esta memoria.

## Acuerdo de trabajo

1. Leer esta memoria y campus/README.md antes de trabajar en el campus. Separar hechos verificados, estimaciones y pendientes.
2. Revisar git status; respetar cambios y capturas del usuario. No hacer push, merge ni instalaciones en dispositivos como parte de una simple sincronización local.
3. Antes de cambiar diseño guardar/checkpoint según la preferencia del usuario. Respaldo previo a esta alineación: Descargas/.../Modelo_3D_UAM/Checkpoint_v8_2026-10-18_antes_memoria_compartida; incluye Fuente_Claude_previa y hashes. El checkpoint v7 anterior se envió a la Papelera tras verificar v8.
4. Trabajar en campus canónico. Guardar/exportar GLB+PNG+JSON juntos. Comprobar georreferencia si cambian límites globales.
5. Reconstruir HTML con node build.mjs; actualizar la réplica con node sincronizar-replica.mjs. El sincronizador detecta modificaciones divergentes de la réplica y se detiene; resolverlas sin sobrescribirlas.
6. Actualizar aquí decisiones y pendientes al terminar. Guardar no crea checkpoints ni implica aprobación visual automática.
7. No guardar claves, tokens ni datos privados ajenos al diseño en esta memoria.

## Cambios de esta revisión

Codex leyó la sesión abierta mediante la interfaz de Claude, comparó el código y confirmó que JSON/GLB/huellas eran idénticos entre copias. Recuperó la exportación PNG y georreferencia que faltaban en Descargas. Añadió norte calibrado y límite de cámara al visor web; estableció réplica comprobada y esta memoria. No se modificó el código móvil, no se hizo merge/push ni se enviaron mensajes a Claude.

La exportación planoBlob oculta también los contornos de selección de objetos/edificios, para que no aparezcan en el PNG móvil, y restaura su visibilidad al terminar.

## Prototipo 3 · Temas (18 oct 2026, rama feature/p3-temas, desde el checkpoint 40fa193 de P2)

KMP Android: menú «Tema ▾» con modo Claro/Oscuro (empieza como el teléfono) y el color de una de las cinco unidades. Colores oficiales de las «Reglas para la Aplicación de los Elementos de Identidad Institucional» (UAM): Azcapotzalco #CD032E (Pantone 186 C), Cuajimalpa #F08200 (144 C), Iztapalapa #57A519 (369 C), Lerma #AD25A8 (253 C), Xochimilco #0072CE (285 C). El esquema de Material 3 sale del color de la unidad y cambia con el modo; el fondo del 2D y del 3D sigue al tema (el 3D convierte el color sRGB a lineal para Filament). Probado en el emulador; la elección no se guarda al cerrar la app. Las teselas del mapa no cambian con el modo oscuro. Pendiente: Flutter y persistir la elección.
## Flutter · Prototipo 2 (18 oct 2026, feature/p2-campus)

app-flutter tiene la misma pantalla que KMP: Mapa (teselas + plano con RotatedOverlayImage de flutter_map), 2D, 3D, «UAM», «Ubicarme» e «Inclinar». El 3D usa model_viewer_plus (`<model-viewer>` de Google en un WebView; no es el editor web): abre casi encima con el norte arriba (giro de norteEnModelo), limita la cámara a 78° (12° sobre el horizonte) e «Inclinar» cambia cameraOrbit por JavaScript sin recargar. Flutter no empaqueta assets fuera del proyecto: Gradle (android/app/build.gradle.kts, copiarCampus) copia GLB, PNG y georreferencia de ../campus a app-flutter/assets/campus/ al compilar; esa carpeta no se versiona salvo su LEEME. El manifiesto permite tráfico http local porque model_viewer_plus sirve el modelo desde 127.0.0.1. Probado en el emulador; iOS no tiene paso de copia todavía.

## Prototipo 3 · Día y noche y Flutter (18 oct 2026, feature/p3-temas)

Se unió feature/p2-campus en feature/p3-temas. «Tema ▾» ahora tiene también Iluminación: «Según la hora» (por defecto; de noche de 19:00 a 6:59, revisa la hora cada minuto), «Día» o «Noche». De noche el plano 2D (en Mapa y en 2D) se multiplica por #4A5680; el 3D baja la luz: KMP sol 8 000 lux azulado y ambiental 6 000 (de día 100 000 y 30 000); Flutter exposure 0.35 en model-viewer. Flutter ya tiene modo claro/oscuro y las cinco unidades (lib/tema.dart, mismos colores y mezclas que Tema.kt; ValueNotifier ajustesTema). Probado en el emulador en KMP y Flutter. Las elecciones se guardan al cerrar la app: KMP con Preferencias (SharedPreferences en Android, NSUserDefaults en iOS; MainActivity llama Preferencias.iniciar) y Flutter con shared_preferences (cargarAjustesTema en main). Claves: oscuro, unidad, iluminacion; la primera vez, claro u oscuro como el teléfono.

## Práctica 3 del curso y trabajo futuro (18 oct 2026)

- Láminas de P2 y P3 en la Unidad III (102–116), generadas por Guiones/u03_prototipos2y3.py en la carpeta del curso (Descargas). Para las láminas no usar docs/capturas/p2_kmp_01_mapa.png: es una captura del teléfono real con notificaciones; la del emulador está en Proyecto/Prototipo_2_3_capturas.
- Práctica 3 «Mi parte del campus» (entrega jueves 22 oct 2026): cada equipo elige zona o edificio y cada integrante un edificio, piso o fachada; issue con tarjeta de prioridad Alta, rama, PR revisado y plan de fotos. Los alumnos copian campus/ a su propio repositorio y lo editan ahí: el campus canónico de este repo no recibe sus cambios automáticamente. Alumnos de Cuajimalpa (4) e Iztapalapa (1) harán campus-cuajimalpa/ y campus-iztapalapa/: hoy no existe base para esas unidades.
- Fotos para reconocer lugares (RA/RV, futuro): ángulos, al menos dos teléfonos, mañana a noche, sol/nublado/lluvia, con y sin gente (sin rostros reconocibles). El docente prefiere YOLO sobre Google ML Kit porque el proyecto es KMP y Flutter y debe llegar a iPhone; no está decidido.
- Respaldo antes de este trabajo: Descargas/1151055 Administracion/_respaldos/2026-10-18_antes_practica_unificada (bundle de git con todas las ramas, réplica del campus, guiones).


## Croquis de otras unidades y marca temporal · 18 oct 2026

Trabajo de Codex en rama feature/campus-unidades, creada desde feature/p3-temas (5789edf), con Git limpio al comenzar.
Respaldo nuevo verificado: Descargas/1151055 Administracion/_respaldos/2026-10-18_antes_campus_unidades (bundle --all, campus previo, memoria y SHA256). Se conserva el respaldo completo anterior antes_practica_unificada.

- campus/ conserva nombre, ubicación, GLB y georreferencia de Azcapotzalco. Solo cambian el visor/exportador y plano_2d.png para © @gabrielhuav temporal.
- campus-cuajimalpa/: editor autónomo, JSON, UAM_Cuajimalpa.glb, PNG 1040×1000 y tres esquinas geográficas. Dos volúmenes: Torre III (conjunto integrado de ocho niveles de referencia UAM) y auxiliar norte de uso por confirmar. No confundir con cinco edificios de Azcapotzalco: tres controles adicionales son volúmenes vecinos EXTERNOS y no se incluyen como instalaciones UAM.
- campus-iztapalapa/: mismo contrato, UAM_Iztapalapa.glb, PNG 1920×2000, 17 volúmenes principales simplificados. Identificadores contrastados con el plano institucional.
- Coordenadas/perímetros de OSM, direcciones institucionales UAM y contraste sobre Esri World Imagery. Cada unidad incluye FUENTES.md (atribución ODbL para datos derivados), calibracion/puntos.json y un comprobador/recalculador afín reproducible con Node.
- Cuajimalpa: ocho puntos sobre cinco volúmenes observados, incluyendo entorno externo, RMS interno 2.5539 m y máximo 4.1354 m. Iztapalapa: diez controles en diez edificios, RMS 3.5765 m y máximo 5.4697 m. Parte del trazo/control procede de la misma imagen: NO son errores absolutos independientes. Sin GNSS; incertidumbre visual orientativa 5–15 m. Fecha de consulta 18 oct; no se afirma fecha de captura satelital.
- calibracion/comprobacion.html superpone huellas y residuos sobre imagen Esri en línea. No se redistribuyó raster satelital en Git.
- Marca temporal discreta en esquina de los tres visores y en PNG de Guardar cambios; capa de UI/canvas, sin geometría/textura de marca en los GLB. El PNG de Azcapotzalco mantiene 1560×640, encuadre y orientación; su georreferencia y GLB permanecen idénticos a feature/p3-temas.
- No se modificó app-kmp/ ni app-flutter/. Sus copiarCampus siguen apuntando a campus/; integrar unidades y marca de la app corresponde a Claude.
- Puertos: Azcapotzalco 8768, Cuajimalpa 8769, Iztapalapa 8770. Cada carpeta es portable para los equipos de la Práctica 3.
- Pruebas: edición de niveles + deshacer en Cuajimalpa, exportación GLB/PNG/JSON en los tres visores, inspección visual de marca web/PNG y contraste satelital; verificadores existentes Azcapotzalco y nuevo verificar-campus-unidades.mjs. Sin cambios de prueba persistidos.

Pendientes: alumnos deben confirmar nombres auxiliares, niveles, fachadas, plantas bajo terreno, accesos y límites; croquis sin topografía detallada. La incorporación en las apps y cualquier prueba física quedan fuera de esta rama. Claude integra los commits locales; no se hizo push ni merge.

Commit de los croquis: 4d37d4b. El siguiente commit de la misma rama incluye la marca de Azcapotzalco, verificadores y esta memoria.

## Cuajimalpa · corrección visual del conjunto integrado · 18 oct 2026

Gabriel señaló que el croquis no se parecía al edificio real y aportó tres fotos: gran celosía del acceso, fachada acristalada con corredores y vista desde portería. Se mantiene una sola Torre III principal, más el pequeño auxiliar norte provisional. La mejora en campus-cuajimalpa/app.js usa cuajimalpaFacades(): terracota, celosía geométrica oscura con pliegues claros, atrio central de vidrio, bandas por nivel, lucernarios y plaza/rampa esquemáticas con rótulo. Todos los detalles son hijos de Edificio_TORRE_III y siguen sus desplazamientos y niveles editables. Dos cámaras cercanas permiten reconocer las fachadas; el contexto completo sigue disponible.

No se deducen medidas exactas ni orientación comprobada de estas fotos: la asignación de los frentes y la rampa es interpretativa y queda pendiente de campo. No se modificaron polígonos, calibración, tres esquinas geográficas ni dimensiones/orientación del plano 1040×1000. JSON/base incluyen metadatos architecture; app.js genera los detalles, que ya están incluidos en el GLB y el PNG exportados. Se mantiene la marca temporal. No se tocó Iztapalapa, Azcapotzalco ni las apps.

Checkpoint previo: Descargas/1151055 Administracion/_respaldos/2026-10-18_cuajimalpa_antes_fachadas (carpeta Cuajimalpa completa, memoria previa, commit y manifiesto SHA256). No se eliminaron respaldos completos del curso.

Verificación: inspección de ambos frentes en el visor, exportación mediante Guardar cambios y verificar-campus-unidades.mjs. El verificador comprueba detalles reconocibles dentro del GLB, un único nodo principal, huellas y georreferencia idénticas al commit 6dbf995, contrato y PNG del tamaño original. Pendiente la validación de semejanza por Gabriel y orientación/proporciones en campo. Rama feature/campus-unidades; integración móvil sigue a cargo de Claude.

## Cuajimalpa · referencia aérea y portería · 18 oct 2026

Dos referencias adicionales de Gabriel: primer plano de la torre de entrada con marquesina suspendida/tirantes y portones, y vista aérea de casi todo el edificio. Se actualizaron ventanas laterales a módulos separados, cubierta roja, dos cubiertas longitudinales elevadas con apoyos y jardineras circulares. La función de las estructuras de cubierta no está confirmada; no asumir que son lucernarios o paneles solares. Se conserva su nomenclatura técnica previa donde la usa el verificador. No se reprodujo el logotipo sobreimpreso de la fotografía como arquitectura.

Nueva portería simplificada como grupo independiente editable `porteria_cuajimalpa`: torre terracota y alas grises, rótulo vertical, marquesina, tirantes, cubierta peatonal, portones y caseta. Botón «Portería» y filtro específico en herramientas. Se mueve/gira con el editor existente y se guarda en elementEdits/GLB/PNG; no es otro edificio académico. Anclaje provisional local [-20,82] en CU_FRAME, sin amarre geográfico: confirmar su ubicación y orientación con imagen cenital/campo. No se presenta como medición. No se modifican huellas principales ni georreferencia, encuadre o tamaño de PNG.

Checkpoint antes de esta revisión: Descargas/1151055 Administracion/_respaldos/2026-10-18_cuajimalpa_antes_porteria, versión fa0c5b6 completa con memoria y SHA256. Se conservan respaldos del curso y el anterior de fachadas hasta validar la nueva interpretación.

Pruebas: selección y desplazamiento de portería, deshacer (vuelve a «Sin cambios pendientes»), inspección de cámara cercana, exportación GLB/PNG/JSON; verificador ampliado para portería y detalle aéreo, huellas/georreferencia invariantes. Sigue pendiente la validación visual de Gabriel y precisar terreno, alturas y posición de acceso. Apps, Azcapotzalco e Iztapalapa sin cambios.

## Iztapalapa · biblioteca L · 18 oct 2026

Referencia nueva de Gabriel: fachada de biblioteca con ventanal alto, huecos superiores pequeños, pórtico abierto y mural sobre el dintel, plaza con juntas y setos. Se añade generador específico libraryDetails() en campus-iztapalapa/app.js, recortando el cuerpo inferior para que el pórtico sea abierto; la cubierta conserva el contorno original. Retícula de concreto/vidrio, plaza, jardineras y bancas esquemáticas. Botón «Biblioteca · detalle» para acercar la cámara. Mantiene ID L, sus cuatro niveles aproximados y desplazamientos editables; detalles hijos del mismo edificio.

El mural es una alusión cromática propia hecha en canvas y embebida en el GLB: `notOriginalArtwork=true`, NO reproducción fiel del original. No se copiaron los textos superpuestos a la foto. Pendiente imagen frontal del mural si se solicita mayor fidelidad. Orientación de fachada y medidas siguen aproximadas; no se modificaron edificios/datos de huellas ni georreferencia ni tamaño/encuadre/orientación del PNG 1920×2000. Los demás edificios de Iztapalapa permanecen básicos. No cambia Cuajimalpa, Azcapotzalco ni las apps.

Checkpoint previo: Descargas/1151055 Administracion/_respaldos/2026-10-18_iztapalapa_antes_biblioteca (carpeta completa, memoria, commit 450744a y SHA256). Se conserva hasta validar el resultado. JSON/base documentan architecture; GLB y PNG exportados con Guardar cambios. Pruebas: revisión visual de cámara cercana, exportación, verificador ampliado con presencia de detalles y conservación de todos los edificios y georreferencia respecto a 450744a. Rama feature/campus-unidades; Claude integra el nuevo commit.

## Cuajimalpa · corrección del extremo de entrada · 18 oct 2026

Gabriel corrigió la portería: está del lado de Vasco de Quiroga, al otro lado de todo el sector de canchas respecto al edificio. Aportó captura Maps y vista aérea con ángulos distintos. La ubicación anterior [-20,82] era errónea y se sustituye por [-23,-173] en CU_FRAME, con giro adicional PI hacia la calle. Se conserva el diseño y el ID editable porteria_cuajimalpa. El orden relativo queda documentado en architecture.accessOrder: calle → portería → sector de canchas → sede principal. El punto exacto sigue aproximado: las imágenes no aportan controles suficientes para una nueva medición de portería.

Andador esquemático lateral junto a canchas, sin atravesar superficies de juego; el primer tramo se adapta a la posición/giro editables de la portería. Nueva cámara «Acceso y canchas», rótulos de orientación y «Fachada · celosía» para distinguirla de la entrada al predio. Se mantienen huellas de edificios/canchas, orientación general, tres esquinas y tamaño/encuadre del PNG 1040×1000. El GLB y PNG se exportaron de nuevo. Iztapalapa, Azcapotzalco y apps sin cambios.

Checkpoint previo: Descargas/1151055 Administracion/_respaldos/2026-10-18_cuajimalpa_antes_reubicar_acceso (Cuajimalpa completo, memoria, commit ec7b755 y SHA256). Las notas anteriores de portería se conservan como historial; esta sección prevalece sobre su ubicación anterior. Pruebas: inspección general, exportación y verificar-campus-unidades.mjs; se comprueba que la portería quede más allá de todas las canchas y que la traslación real del GLB coincida con JSON, además de los contratos e invariantes existentes.

## Iztapalapa · edificio T faltante · 18 oct 2026

Gabriel señaló correctamente que se había omitido T: el croquis tenía AT, pero no el edificio principal de CBI. Se incorpora ID T, «T · Carlos Graef · CBI», PB + 3 pisos aproximados, con retícula clara de concreto y ventanales según su foto. Plano CSE y directorio oficial contrastados: T y AT son distintos. No se renombra ni desplaza AT. Nueva cámara «T · CBI». Iztapalapa pasa de 17 a 18 volúmenes.

Huella T simplificada trazada visualmente sobre el raster Esri ya utilizado. `campus-iztapalapa/calibracion/trazo-T.json` conserva puntos píxel, extensión y polígono en coordenadas del modelo obtenido por inversión de la matriz afín existente. No es una medición independiente y no cambia el RMS; incertidumbre visual orientativa 5–15 m, detalles y dimensiones por validar. Sin cambios a georreferencia ni tamaño/encuadre/orientación del PNG 1920×2000. Se exportaron GLB/PNG/JSON. Los otros 17 edificios y las demás unidades/apps conservan sus datos.

Checkpoint: Descargas/1151055 Administracion/_respaldos/2026-10-18_iztapalapa_antes_edificio_T (carpeta completa y memoria en d4d4358, SHA256). Pruebas: cámara cercana y exportación, verificar-campus-unidades.mjs ampliado para exigir T y AT distintos, cuatro niveles de T y conservación de los otros 17 edificios. Rama feature/campus-unidades; Claude integra este nuevo commit.

## Marca visible en AZC, IZT y CUAJ · 18 oct 2026

Gabriel aclaró que desea el texto literal «copyright @gabrielhuav» en los tres mapas. Sustituye la marca anterior «© @gabrielhuav» en los tres visores y exportadores de PNG. Capa fija respecto al viewport, por encima del HUD, con fondo claro y texto de mayor contraste; se mantiene visible al girar, acercar, cambiar cámara o ampliar. Se reexportan los tres planos 2D con la marca nueva, sin alterar dimensiones, encuadre ni georreferencia. Guardar imagen de esta vista también la incorpora.

La marca es de presentación en visor/imagen, no geometría GLB. Las apps siguen a cargo de Claude y aquí no se modifican: para que aparezca siempre al desplazar el mapa o girar el GLB en móvil, Claude debe conservar una capa fija con este mismo texto en AZC, IZT y CUAJ. Los créditos OSM/ODbL siguen presentes.

Checkpoint previo: Descargas/1151055 Administracion/_respaldos/2026-10-18_antes_copyright_tres_unidades (tres carpetas completas y memoria en 90e9e82). Pruebas: inspección de los tres visores, exportación de tres PNG, comprobación visual en vista ampliada y contratos/georreferencias/modelos sin cambios. Esta sección prevalece sobre las notas históricas del texto de la marca.

## Copyright dentro de la maqueta y bandera · 18 oct 2026

Nueva petición de Gabriel: marca más invasiva, dentro del modelo y con bandera para quitarla, en AZC/IZT/CUAJ. Se añade grupo 3D `Marca_copyright_modelo` con tres franjas grandes de texto «copyright @gabrielhuav», textura transparente y opacidad 0.62 sobre el campus. Son planos horizontales en coordenadas del modelo, sobre la altura máxima de los edificios. Viajan en GLB y se renderizan en PNG. Esta sección sustituye la decisión anterior de no incluir marca en GLB; la nueva petición lo autoriza.

Bandera JSON `showCopyright` (booleano, true por defecto y en las bases actuales). Casilla «Copyright en la maqueta» en Capas de los tres visores; cambia la visibilidad 3D y el rótulo de esquina, y usa el historial de deshacer/rehacer. Al guardar con false, se omite el grupo del GLB (onlyVisible) y no se dibuja la marca en PNG/captura. La casilla se bloquea durante exportación para no producir archivos discordantes. Cambiar solo el JSON no altera un GLB existente: regenerar con el visor y Guardar cambios. Para ocultarlo dentro de una app que ya cargó el GLB, Claude puede controlar el nodo del grupo o sustituir el asset por exportación sin marca. Apps sin cambios aquí.

Checkpoint previo: Descargas/1151055 Administracion/_respaldos/2026-10-18_antes_copyright_integrado, tres carpetas y memoria en 340f744. Pruebas: casilla false y guardado real en Cuajimalpa, JSON false y GLB sin nodo de marca verificados; reactivada después. Exportaciones finales activas en las tres unidades; comprobación de tres planos por GLB y de huellas/datos/georreferencia conservados. Se mantienen dimensiones/encuadre de PNG; cambia intencionalmente el GLB de Azcapotzalco para incluir la marca, por eso el verificador deja de exigir igualdad binaria con feature/p3-temas.

## CHECKPOINT acordado con Gabriel · entrega a Claude · 18 oct 2026

Gabriel pide conservar este estado como checkpoint y vuelve con Claude al desarrollo móvil. Este es el estado vigente; las decisiones de este apartado y del anterior prevalecen sobre notas históricas contradictorias. No se piden más cambios de diseño en este paso.

- Repositorio canónico: `C:\dev\navegacion-uam-equipo-00`. Rama de entrega: `feature/campus-unidades`, desde `feature/p3-temas` (5789edf). Último commit de implementación: `ea5dcb2`; integrar también el commit posterior de esta memoria. Integrar la rama completa, no únicamente el último commit, para incluir las nuevas unidades y correcciones.
- Etiqueta del checkpoint: `checkpoint/campus-unidades-2026-10-18-copyright-integrado`. Respaldo de este estado: `C:\Users\gabri\Downloads\1151055 Administracion\_respaldos\2026-10-18_checkpoint_campus_para_claude`, con las tres carpetas, memoria, bundle Git y manifiesto SHA256. Se conservan respaldos previos del curso.
- AZC: `campus/`, `UAM_Azcapotzalco.glb`, PNG 1560×640. No mover ni renombrar esta carpeta.
- CUAJ: `campus-cuajimalpa/`, `UAM_Cuajimalpa.glb`, PNG 1040×1000. Conjunto principal integrado, detalle de fachadas y portería al extremo de Vasco de Quiroga; canchas entre entrada y sede. Ubicaciones/detalles aproximados pendientes de afinar.
- IZT: `campus-iztapalapa/`, `UAM_Iztapalapa.glb`, PNG 1920×2000. Ahora 18 volúmenes: biblioteca L detallada y T «Carlos Graef» independiente del AT, con cuatro niveles aproximados. Mural de biblioteca interpretativo; no reproducción fiel.
- En cada carpeta, usar conjuntamente `campus_editado.json`, GLB, `plano_2d.png` y `georreferencia.json`. Las tres esquinas y el encuadre del PNG son un contrato: no recortar, rotar ni redimensionar el asset sin recalibrar. Los editores y generadores completos están en esas mismas carpetas. Puertos web AZC 8768, CUAJ 8769, IZT 8770.
- Marca actual: «copyright @gabrielhuav» grande y semitransparente dentro de las tres maquetas/GLB/PNG, más rótulo de esquina web. `showCopyright: true` en los JSON actuales; `false` la elimina al regenerar y guardar. Nodo del GLB: `Marca_copyright_modelo`. El JSON no conmuta automáticamente un GLB ni un PNG ya exportados. Si Claude añade una bandera móvil, debe controlar el grupo 3D y resolver también la versión del PNG: ocultar solo un rótulo de la app no quita las franjas horneadas en la imagen. La bandera de las apps y los mecanismos de carga quedan a cargo de Claude.
- `app-kmp/` y `app-flutter/` no fueron modificadas en esta rama. Sus tareas `copiarCampus` aún apuntan a AZC (`campus/`); revisar la integración de CUAJ/IZT y la selección de unidad en móvil. No se afirma que las nuevas unidades hayan sido probadas en móvil.
- Pruebas ya realizadas: `node verificar-campus-unidades.mjs`, sintaxis de generadores, exportaciones de las tres unidades, inspecciones visuales; prueba real de exportación sin marca y reactivación en CUAJ. JSON de diseño idénticos al respaldo previo salvo `showCopyright`; georreferencias intactas y PNG con dimensiones originales. Solo se actualiza la documentación en este checkpoint; no se repiten exportaciones.

Pendientes para Claude/alumnado: integración y prueba móvil KMP/Flutter; afinar huellas, orientación de fachadas, niveles y accesos con evidencia adicional. Las calibraciones siguen siendo aproximadas y sus RMS internos no equivalen a exactitud absoluta. Actualizar esta memoria con las decisiones móviles para conservar el diseño común. No se hizo push ni merge en esta entrega; los commits están disponibles localmente.

## AZC · mejora fotográfica del edificio T posterior al checkpoint · 18 oct 2026

Gabriel retoma Azcapotzalco y aporta dos fotos del T: escalera exterior, muro lateral inclinado terracota, barandales rojos, galería, marquesina y concreto claro. Generador específico `azcBuildingT()` en campus/app.js, sin aplicar el diseño del T de Iztapalapa. Nuevo botón «T · Escalera exterior». Se conserva ID T, rectángulo de referencia, dos niveles del croquis y `noStreetExit: true`. Fotos parciales: dimensiones y orientación exacta de fachada quedan pendientes de campo, no se infiere altura total nueva.

Escalera de 18 peldaños hacia el patio interior (-Z), situada en el tramo de T libre junto al L, sin atravesar L ni abrir salida a Eje 5 Norte. Muro inclinado, barandales, PB retranqueada, galería y rótulo rojo, con explanada esquemática. La zona inmediata se excluye de vegetación aleatoria. Detalles hijos de Edificio_T, siguen altura/desplazamiento. Metadata en buildings[T].facadeReference, también en base. Se libera la textura del rótulo y la de copyright al regenerar para evitar acumular recursos.

Checkpoint previo preservado: Descargas/1151055 Administracion/_respaldos/2026-10-18_azc_antes_detalle_T (campus completo, memoria, commit 0acee64 y SHA256). El checkpoint etiquetado anterior sigue intacto. Se reexportaron GLB/PNG/JSON de AZC con copyright activo; se ocultó temporalmente solo para revisión/captura de fachada y se reactivó antes de guardar. Georreferencia, encuadre/tamaño de PNG y los otros edificios conservados. CUAJ/IZT/apps sin cambios. Pruebas: sintaxis, verificadores del campus y contrato de tres unidades, presencia de escalera/muro/barandales y 18 peldaños en GLB. Claude debe incluir este commit posterior al checkpoint si desea la nueva fachada en móvil.

## App · cinco unidades (Claude, 19 oct 2026, rama feature/app-unidades desde feature/campus-unidades)

- KMP y Flutter copian al compilar campus/, campus-cuajimalpa/ y campus-iztapalapa/ a assets campus/<azcapotzalco|cuajimalpa|iztapalapa>/ con modelo.glb (renombrado), plano_2d.png y georreferencia.json. No se tocaron las carpetas campus*.
- En «Tema ▾», elegir otra unidad pregunta «¿Ir a la UAM X?»: «Ir» cambia la sede (Mapa, 2D y 3D de esa unidad); «Sólo el color» no. La sede se guarda (clave `sede`). Un 3D por unidad visitada, cargado una vez y nunca liberado (lección del crash de Filament).
- Lerma (19.291425, -99.499548, OSM) y Xochimilco (19.3025, -99.1035, aprox. entre OSM y el mapa de la UAMX) no tienen croquis: cuadro de 240 m de su color con «En desarrollo…» sobre el mapa, y cuadro equivalente en 3D. Centros de CUAJ/IZT = centro de su plano.
- Marca de agua temporal «© @gabrielhuav» en la esquina inferior izquierda de la app, además de la horneada en GLB/PNG.
- Probado en el emulador en KMP y Flutter (capturas docs/capturas/p4_*).
- Para Codex: en el 3D de Azcapotzalco visto desde arriba con el norte hacia arriba, el texto «copyright @gabrielhuav» del GLB se ve en espejo; en CUAJ e IZT se lee bien. Probablemente la cara del texto apunta hacia abajo o la cámara la ve por detrás.
- Las apps empaquetan lo que haya en campus/ al compilar: el APK de prueba incluyó los cambios de Azcapotzalco que Codex tenía sin commit en ese momento.

## AZC · T terminado y Serpentina II · 18 oct 2026

Se cerró el trabajo del T en commit `974aa33`. Mientras Codex trabajaba, Claude completó la integración móvil y dejó el repositorio en `feature/app-unidades` (commits ae6ab86 y ba3a0c2); el commit del T quedó en esa rama. Se conserva esa rama y los avances de Claude; este trabajo no modifica apps. Las notas anteriores de entrega que decían que aún no se copiaban CUAJ/IZT son históricas: prevalece la sección de Claude de Prototipo 4. El asunto del texto AZC en espejo comunicado por Claude sigue pendiente de diagnóstico y no se da por resuelto aquí.

Gabriel pidió después Serpentina II frente a H por el estacionamiento, no por COSEI, con foto cercana y captura Maps. Se añade `data.serpentina` con posición inicial [824,265], escala 1 y side estacionamiento. Punto y dimensiones aproximados. Generador `serpentinaH()`: base/plazoleta circular con anillos claros, ejes metálicos en Y y nueve cintas helicoidales rojas, claras y oscuras. Grupo GLB `Serpentina_II_frente_H_estacionamiento`; elemento editable `sculpture_serpentina_H`. No se sustituye la escultura G / COSEI ni se cambian edificios, estacionamientos o georreferencia. Cada brazo y cinta es geometría ligera; no se incrustan fotos.

Nueva cámara «Serpentina II · H», con rótulos lejanos filtrados solo en esa vista. Herramientas → Escultura permiten mover/girar y guardar el conjunto completo. Ajustes persistidos en elementEdits. GLB/PNG/JSON de AZC reexportados con copyright activo, PNG 1560×640 y encuadre conservados. CUAJ/IZT sin cambios.

Checkpoint previo a la escultura: Descargas/1151055 Administracion/_respaldos/2026-10-18_azc_antes_serpentina (campus y memoria en 974aa33, SHA256). Pruebas: mover escultura y deshacer, cámara cercana, exportación, verificadores del editor/campus y contrato de unidades (exige nueve cintas, ID editable y lado norte del H). Se retira del verificador de modelos la antigua restricción de comparar apps con feature/p3-temas, incompatible con la integración legítima de Claude; las pruebas de apps son independientes. Persisten los pendientes de medir posición/dimensiones y validar la semejanza visual con Gabriel.

## Xochimilco · primer croquis editable · 18 oct 2026

Gabriel solicita incorporar UAM X y aporta `Descargas/MAPA.pdf`, de Servicios Médicos UAM Xochimilco: https://serviciosmedicos.xoc.uam.mx/archivos/MAPA.pdf. Se inspeccionó la página completa y su nomenclatura de 59 entradas. Es una ilustración en perspectiva: se utiliza para identificar conjuntos, no para medir. Se contrastó dirección oficial Calzada del Hueso 1100, Villa Quietud, Coyoacán, y predio OSM way 317456019. El embed del sitio oficial apunta a otra sede y se descartó como control geográfico.

Nueva carpeta canónica `campus-xochimilco/`, puerto **8771**, sin mover `campus/` ni alterar AZC/CUAJ/IZT o apps. Contrato: `Visor_UAM_autonomo.html`, `campus_editado.json`, `campus_base.json`, `UAM_Xochimilco.glb`, `plano_2d.png`, `georreferencia.json`. 37 volúmenes simples: 33 huellas OSM y cuatro trazos visuales (A, M y anexos AC/AB). Patios Edén/Zapata, canchas, estacionamientos y velaria básica. Niveles OSM cuando disponibles y estimaciones en los demás; fachadas genéricas sin interiores ni topografía. Se mantienen edición de niveles/posición, árboles/estacionamientos, dibujo de estacionamientos, deshacer/rehacer y guardado. No es una reconstrucción arquitectónica detallada.

Modelo en metros, coordenadas locales Este/+X y Sur/+Z; la representación de datos conserva el origen heredado `(px-895,py-390)`. Encuadre nuevo fijo **X [-200,200], Z [-530,530], 2 px/m**, PNG **800×2120**, transparente. La cámara inicial oblicua permite ver el predio alargado completo; «Vista norte» y «Plano superior» calculan el norte a partir de las esquinas geográficas. Ajuste de cámara con ocho esquinas para evitar recortar extremos. No cambiar dimensiones, recorte u orientación del PNG sin recalibrar.

Calibración afín reproducible con **11 controles en 11 edificios**, observados contra Esri World Imagery (extensión/tamaño/URL en JSON): RMS interno **2,1812 m**, máximo **4,4085 m**. NO representa exactitud absoluta: control visual no independiente, paralaje y posibles diferencias temporales OSM/raster. Incertidumbre orientativa 5–15 m pendiente de GNSS/campo. Tres esquinas lat/lon calculadas por el ajuste, no supuestas. `calibracion/puntos.json`, `huellas-osm.geojson`, `trazos-satelital.json`, `recalcular.mjs` y `comprobacion.html` documentan el método. El raster no se distribuye en Git; la comprobación permite solicitarlo a Esri.

Ambigüedades conservadas explícitamente: PDF duplica AC (9/15), BA/BB sin separar, discrepancia de etiqueta biblioteca entre OSM y PDF (A frente a J), ubicaciones interpretativas de W/WBIS/U/Cómputo y anexos AC/AB. `osmName`, `identificationPending`, `architecture` y FUENTES.md registran estos límites. Selector marca «por confirmar» cuando corresponde. Las entradas exactas y rutas accesibles aún no se modelan; no usar para navegación de seguridad.

Copyright con el mismo contrato: `showCopyright:true`, tres franjas `copyright @gabrielhuav` dentro de `Marca_copyright_modelo`, GLB/PNG y rótulo web. Prueba real false → Guardar cambios: GLB sin grupo y JSON false; se reactivó y reexportó para entrega. Edición T 4→5 niveles y deshacer vuelve a estado sin cambios pendientes. `verificar-campus-xochimilco.mjs` valida contrato, todos los IDs, encuadre, cabeceras, calibración reproducible y marca. `verificar-campus-unidades.mjs` también pasa para las otras tres unidades.

Checkpoint previo: `Descargas/1151055 Administracion/_respaldos/2026-10-18_antes_xochimilco`, bundle Git de todas las referencias y memoria en a299b34. Entrega en **feature/app-unidades**, etiqueta **checkpoint/xochimilco-2026-10-18-inicial**; no push ni merge. Respaldo final en `Descargas/1151055 Administracion/_respaldos/2026-10-18_checkpoint_xochimilco`.

**Para Claude:** Xochimilco ya tiene assets reales iniciales. Sustituir su placeholder de 240 m e incorporar `campus-xochimilco/` a `copiarCampus` en KMP/Flutter, copiando GLB como `modelo.glb`, PNG y georreferencia como las otras unidades. Usar la georreferencia entregada para el encuadre completo, no el antiguo centro aproximado del placeholder. Regenerar APK y probar 2D, norte y 3D. Esta integración móvil está pendiente y Codex NO modificó `app-kmp/` ni `app-flutter/`. Lerma sigue pendiente. El texto en espejo del GLB de AZC comunicado por Claude continúa pendiente y este trabajo no lo resuelve.

## Lerma · investigación y croquis 2D/3D · 18 oct 2026

Gabriel solicita completar Lerma con investigación profunda y numerosas referencias. Se contrastaron mapa oficial publicado en septiembre de 2026, plano de servicios 2024, Directorio de Espacios actual, noticias UAM sobre O/P, CIFE y renovación de canchas, foto aérea oficial de 2021, galería institucional, huellas OSM y raster Esri del predio completo. **13 imágenes revisadas visualmente**, con tablero remoto `campus-lerma/investigacion/referencias.html` y registro JSON de fuentes/observaciones. Investigación y decisiones desarrolladas en `INVESTIGACION.md`; URLs en `FUENTES.md`. No se incorporan fotografías ni raster como texturas.

Hallazgo clave: cambió la nomenclatura. O→F, P→G; antiguos módulos A–G pasan a A1–A7 y H–N a B1–B7. Se aplica el mapa/directorio 2026 conservando `legacyId` y `osmName`. Biblioteca dentro de B2 (antes M); su huella OSM extra se registra como evidencia, sin duplicar un volumen sobre B2. Se descarta una foto de celosía de Cuajimalpa que aparecía bajo resultados de Lerma, y no se construye el plan maestro futuro como si ya existiera.

Nueva carpeta **`campus-lerma/`**, puerto **8772**. Contrato completo: `Visor_UAM_autonomo.html`, `campus_editado.json`, `campus_base.json`, `UAM_Lerma.glb`, `plano_2d.png`, `georreferencia.json`. **20 volúmenes**: 17 huellas OSM y tres trazos de cubierta C/D/E (CIFE). A1–A7/B1–B7 de una planta; G cuatro niveles según fotos y Rectoría en nivel 3; F tres con retorno frontal bajo; C/D/E tres niveles estimados, habilitación por confirmar. La ocupación total del CIFE y acabados actuales no se dan por comprobados.

`architecture.js` genera fachadas propias: módulos bajos claros y ventanas con marcos verdes; F/G con ventanas individuales, pilares/dinteles de concreto, PB retranqueada lila, núcleos verticales de vidrio, cubiertas terracota y alas de altura menor. Posición y reparto de elementos son aproximados. La cubierta curva de canchas se interpreta de Esri, distinguiéndola de la malla histórica de las fotos; líneas/canastas y campo de fútbol contiguo. Circuito interior, andador, estacionamientos, lámparas solares y rótulo SOY uam esquemáticos. No se copia arte mural ni logotipo.

Se conserva el **predio en L** de OSM way 374595630, incluyendo la prolongación sureste natural Los Capulines. No se toma el campo al sur de la franja occidental como si todo el rectángulo fuera universidad. Vegetación irregular representativa, sin inventario individual; sendero interpretativo esquemático. Observatorio, espacio lúdico, kiosco y producción agrícola son referencias de posición aproximada del plano oficial: no se inventa su arquitectura ni se convierten en rutas navegables. El marcador de producción agrícola queda dentro del predio; no se modela una cubierta externa como si estuviera medida.

GLB en metros, Y vertical. Marco nuevo fijo **X [-450,450], Z [-310,310], 2 px/m**, PNG transparente **1800×1240**. Transformación de datos heredada `(px-895,py-390)`; GLB y controles en metros. Tres esquinas lat/lon calculadas de ajuste afín con **11 esquinas en 10 edificios**, RMS interno **1,4046 m**, máximo **3,0725 m**. NO precisión absoluta ni GNSS; incertidumbre visual orientativa 5–15 m. Controles concentrados al norte en zona de edificios: el extremo natural sur no tiene validación independiente. C/D/E trazados contra el mismo raster; paralaje y fecha de captura desconocidos. Puntos, IDs OSM, trazos, extensión/URL del raster y recálculo en `calibracion/`.

Cámaras de detalle «Conjunto F y G», «Aulas y biblioteca», «Los Capulines», más vista completa y superior. Se heredan edición de edificios, árboles/estacionamientos, dibujo, historial y guardado conjunto. Nueva categoría «Hitos y referencias»: permite mover/girar el rótulo y los puntos esquemáticos. Prueba real de mover SOY uam +2 m, aplicar, deshacer y volver al estado base antes de exportar.

Copyright activo por defecto con `showCopyright`. Tres paneles integrados ajustados a la forma de L mediante `copyrightPanels`, de modo que las marcas queden dentro del predio, no sobre el vacío occidental. Mismo nodo `Marca_copyright_modelo` y rótulo de esquina. Prueba real false→guardar: JSON false, GLB sin nodo; después true y reexportación final. GLB final ~1,17 MB. `verificar-campus-lerma.mjs` comprueba contrato, IDs/alias, biblioteca sin duplicación, alturas físicas exportadas, arco, geometría incrustada, marca dentro del predio, controles y marco. Pasan también verificadores de Xochimilco y las otras tres unidades.

Checkpoint previo: `Descargas/1151055 Administracion/_respaldos/2026-10-18_antes_lerma`, memoria y bundle Git en f2d3065. Entrega en **feature/app-unidades**, etiqueta **checkpoint/lerma-2026-10-18-investigado**. Respaldo final `Descargas/1151055 Administracion/_respaldos/2026-10-18_checkpoint_lerma`, carpeta Lerma, memoria, bundle, manifiesto, capturas y copias de los dos PDF consultados. Sin push/merge; se preservan los checkpoints anteriores y respaldos del curso.

**Para Claude:** ya existen assets web para las cinco unidades. Incorporar también `campus-lerma/` a las tareas `copiarCampus` de KMP/Flutter, renombrando GLB a modelo.glb y copiando PNG/georreferencia; sustituir placeholder Lerma y usar el marco completo entregado, no su cuadro anterior de 240 m. Integrar también Xochimilco del commit f2d3065 si sigue pendiente. Codex no modifica apps. Probar en móvil 2D/3D/norte y cambio de sede; la integración de estos dos campus sigue pendiente de Claude. Persisten la revisión visual/medición de detalles, la portada actual de Lerma y el asunto de texto AZC en espejo comunicado anteriormente.

## Checkpoint · Xochimilco, fachadas azules y referencia aérea · 18 octubre 2026

Gabriel aporta dos fotografías desde ángulos distintos: `codex-clipboard-e9c62a76-7e83-43dc-aace-ab1ac70d445a.png` (concreto, ventanas con azul y torre gráfica) y `codex-clipboard-f0624919-165e-4c97-bdac-40640a3acd5b.png` (campus aéreo, cubiertas rojas y jacarandas). Se usan para aspecto arquitectónico; no para girar la geometría geográfica ni recalibrar el plano.

Nuevo `campus-xochimilco/architecture.js`, incorporado también al HTML autónomo: fachada de concreto gris, aletas y alfeizares, ventanas segmentadas y marcos azules. Conserva las cubiertas rojas, ahora con tono más próximo a la referencia. El volumen central A recibe un lucernario curvo de vidrio y costillas claras, de medidas estimadas. **No se identifica ni se trasplanta la torre con gráfica azul de la foto cercana a un edificio por suposición**; su identidad y diseño exacto quedan pendientes. Se añaden 21 jacarandas editables aproximadas junto a estacionamientos y se colorea parte del arbolado existente en floración; no es inventario de campo.

Nuevo botón «Fachadas azules · detalle», enfocado a un tramo de G desde el jardín Edén. La escala visual se adapta al punto observado y al acercamiento. Conserva los 37 IDs, niveles, huellas, desplazamientos, patios, estacionamientos y orientación anteriores. PNG transparente **800×2120**, mismo marco métrico y **georreferencia idéntica byte a byte** al commit 5897829; mismos 11 controles y error declarado (RMS interno 2,18 m, máximo 4,41 m, sin exactitud absoluta independiente). No se recalibra por las fotografías.

Guardar cambios reexportó JSON, PNG y GLB con copyright activo y bandera `showCopyright` conservada. GLB **3,14 MB** con materiales/forma locales, sin texturas fotográficas ni dependencias remotas. Pasan `node --check` y `node verificar-campus-xochimilco.mjs`: contrato, GLB, PNG, lucernario, marcos y jacarandas exportados; regresión contra 5897829 que comprueba huellas, niveles, estacionamientos, predio, marco y georreferencia sin alteración. Revisión visual real en visor de detalle, vista norte y plano PNG; sin cambios pendientes al terminar. Los detalles son interpretativos, no réplica medida.

Respaldo previo completo de Xochimilco y memoria, HEAD y bundle: `Descargas/1151055 Administracion/_respaldos/2026-10-18_xochimilco_antes_fachadas_azules`. Entrega en **feature/app-unidades**, etiqueta **checkpoint/xochimilco-2026-10-18-fachadas-azules**. Respaldo final: `Descargas/1151055 Administracion/_respaldos/2026-10-18_checkpoint_xochimilco_fachadas_azules`, con fuentes, assets, memoria, verificador, capturas, bundle y manifiesto. Sin push/merge; no se eliminan respaldos del curso ni se modifican las otras unidades.

**Para Claude:** al integrar Xochimilco, usar el GLB y PNG actualizados de esta carpeta, manteniendo la misma georreferencia. No reconstruir el estilo por separado en móvil ni cambiar el encuadre. No se tocaron `app-kmp/` ni `app-flutter/`; siguen pendientes su copia/integración y prueba visual en dispositivo. Las discrepancias de nomenclatura y alturas ya declaradas en FUENTES.md siguen pendientes de verificación del alumnado.

## Checkpoint de relevo a Claude · Lerma, remates lila y SOY uam · 18 octubre 2026

Gabriel aporta cuatro fotografías nuevas de Lerma, registradas en `campus-lerma/FUENTES.md` y `architecture.photoReference` del JSON. Complementan las trece referencias web ya revisadas. F/G se ajustan a concreto gris claro, ventanas superiores estrechas, columnatas bajas y núcleos acristalados. Se añaden **tres remates superiores lila desaturado** (uno F, dos G), discretos, mediante `buildings[F/G].architecture.roofAccents`; no se pintan fachadas completas de morado. Posiciones y dimensiones de esos detalles aproximadas, sin afirmar un inventario medido de azoteas.

Se conserva «SOY uam» blanco sobre base morada, con la capitalización de la foto y el ID editable **landmark_soy_uam**, en la misma posición. Continúa como texto ligero en plano transparente, no letras 3D extruidas. Se refuerza su contorno para lectura. Nuevo botón **«SOY uam · detalle»**, que sigue la posición editada del hito. Escala visual adaptada al acercamiento y al punto observado.

Se conservan **20 edificios**, IDs y alias, huellas, niveles, desplazamientos, estacionamientos, hitos, orientación y marco. `georreferencia.json` idéntico byte a byte al commit 6a6c342. PNG transparente **1800×1240**, X [-450,450], Z [-310,310], 2 px/m. Mismos 11 controles en diez edificios, RMS interno 1,4046 m y máximo 3,0725 m, sin validación absoluta independiente. Las fotografías no recalibran el mapa ni corrigen por sí solas sus aproximaciones.

Guardar cambios reexportó `campus_editado.json`, `UAM_Lerma.glb` (**1,18 MB**) y `plano_2d.png`. `campus_base.json` y HTML autónomo reconstruidos. **Copyright activo en el estado final** (`showCopyright: true`), con sus tres paneles y casilla para ocultarlo. Se ocultó temporalmente para inspeccionar el rótulo y se restauró; captura sin marca sólo para inspección. Estado final del editor sin cambios pendientes.

Pruebas: `node --check` en app y arquitectura; `node verificar-campus-lerma.mjs` pasa contrato, geometría exportada, alturas F/G, rótulo, remates lila, marco, georreferencia y ajuste reproducible. La regresión contra 6a6c342 verifica que este cambio de aspecto no mueve edificios/hitos ni cambia niveles o encuadre. Revisión visual del conjunto F/G y del rótulo. Sin cambios en otras unidades ni en las apps.

Respaldo previo: `Descargas/1151055 Administracion/_respaldos/2026-10-18_lerma_antes_remates_morados`, carpeta Lerma, memoria, HEAD y bundle. Entrega en **feature/app-unidades**, etiqueta **checkpoint/lerma-2026-10-18-remates-morados**. Respaldo final: `Descargas/1151055 Administracion/_respaldos/2026-10-18_checkpoint_lerma_remates_morados`, fuentes/exports de Lerma, memoria, verificador, bundle, manifiesto y capturas. Se mantienen respaldos anteriores; sin push ni merge.

**Relevo para Claude / aplicación móvil:** tomar este checkpoint de Lerma y el de Xochimilco (**6a6c342**). Los assets canónicos están en `C:/dev/navegacion-uam-equipo-00/campus-lerma/` y `campus-xochimilco/`; copiar GLB, PNG y georreferencia juntos. Mantener las dimensiones y las esquinas entregadas, sin el cuadro provisional de 240 m. Los materiales y detalles ya viajan en el GLB; no recrearlos de forma independiente en móvil. Integración y prueba en KMP/Flutter pendientes de Claude; Codex no modificó `app-kmp/` ni `app-flutter/`. Verificar cambio entre las cinco sedes, vistas 2D/3D/norte y presentación del copyright (incluido el asunto previo de AZC en espejo). Persisten los pendientes de campo y nomenclatura descritos en cada campus.

## Checkpoint final de relevo · copyright repetido y colores por unidad · 18 octubre 2026

Gabriel pide una marca más invasiva en **las cinco maquetas**, con más repeticiones y color representativo de cada unidad. Se conserva el texto **copyright @gabrielhuav**, integrado en el modelo, y la casilla `showCopyright`. Este checkpoint sustituye las marcas anteriores; conserva todos los detalles de arquitectura aprobados, incluidos F/G y SOY uam de Lerma y las fachadas de Xochimilco.

Se mantienen las tres bandas grandes para lectura a distancia y se añade un mosaico de repeticiones de hasta 160 m de ancho, cada 32 m, ajustado al contorno del predio. Lerma conserva sus tres bandas grandes dentro de la forma en L. Opacidad aumentada de 0,62 a **0,84**; material sin iluminación, sin atenuación por niebla ni tone mapping en la web, contorno claro. Marca de esquina y PNG también con color de sede. Todas las copias comparten textura/material por maqueta; no hay imágenes remotas ni nuevas dependencias de ejecución.

Colores RGB verificados contra la página oficial [Colores distintivos UAM](https://www.comunicacionsocial.uam.mx/identidaduam/html/lineamientos/6-0-colores.html): **AZC rojo #CD032E (33 planos)**; **CUAJ naranja #F08200 (10)**; **IZT verde #57A519 (55)**; **XOC azul #0072CE (57)**; **LER morado #AD25A8 (48)**. La cantidad varía con la extensión del predio, no representa edificios. La atribución OSM se conserva.

Nuevo `copyrightStyle` en JSON: version 2, color, opacity, layout tiled-site, rowSpacing, maxWidth y largePanels. `copyright-layout.js` es el mismo helper local en las cinco carpetas, incluido en los cinco HTML autónomos. Los JSON antiguos sin copyrightStyle usan el estilo base. Ya no se depende del campo antiguo copyrightPanels de Lerma: esas tres bandas pasan a `copyrightStyle.largePanels`. Mismo grupo GLB **Marca_copyright_modelo**, bandera **showCopyright**, hijos **Copyright_integrado_<índice>**; los índices tienen también dos cifras. Extras del grupo: color, pattern y panelCount. Instrucciones completas en **COPYRIGHT_CAMPUS.md**.

Reexportados **los cinco GLB, los cinco PNG y JSON**, bases y visores. Estado final: showCopyright true en las cinco sedes, sin cambios pendientes. Se conservan datos de edificios, hitos, niveles, huellas, orientación, recorte y dimensiones PNG, puntos y georreferencias anteriores. No se tocaron `app-kmp/` ni `app-flutter/`.

Pruebas: sintaxis de las cinco apps; `verificar-copyright-campus.mjs` compara el diseño con **360e0ba**, verifica colores, cantidades y opacidad del GLB y tamaños PNG; pasan también verificadores de unidades, Xochimilco y Lerma. Prueba real en Cuajimalpa false → guardar → JSON false y GLB sin grupo, después true → guardar → diez marcas exportadas. Revisión visual de las cinco sedes y capturas de evidencia; ajuste de niebla añadido tras detectar pérdida de intensidad a distancia.

Respaldo previo recuperable en `Descargas/1151055 Administracion/_respaldos/2026-10-18_antes_copyright_repetido` con bundle completo y memoria en 360e0ba. Rama **feature/app-unidades**, etiqueta **checkpoint/copyright-cinco-unidades-2026-10-18**. Respaldo final `Descargas/1151055 Administracion/_respaldos/2026-10-18_checkpoint_copyright_cinco_unidades`: cinco carpetas, documentación/memoria, verificadores, capturas, bundle y manifiesto. Sin push/merge ni borrado de respaldos anteriores.

**Para Claude:** integrar este último checkpoint para **las cinco unidades**, no sólo los dos últimos campus. Copiar GLB + plano_2d.png + georreferencia.json de las carpetas canónicas. La marca de color y las repeticiones ya están incrustadas en GLB/PNG, sin reconstruirlas en móvil ni duplicarlas accidentalmente. Si la app necesita ocultarlas dinámicamente, ocultar el grupo Marca_copyright_modelo completo en 3D; para 2D se necesita un PNG sin marca regenerado desde el editor (el PNG activo está rasterizado). Conservar su preferencia/flag según la implementación de Claude. Probar 2D/3D, cambio de sede y vista norte. Sigue pendiente la cuestión de AZC en espejo y la integración/verificación móvil; las aproximaciones geográficas/arquitectónicas previas no se dan por resueltas por este cambio.

## App · las cinco unidades con croquis (Claude, 19 oct 2026, feature/app-unidades)

- KMP y Flutter copian al compilar las cinco carpetas canónicas (campus/ y campus-cuajimalpa, -iztapalapa, -lerma, -xochimilco) a assets campus/<unidad>/ con modelo.glb, plano_2d.png y georreferencia.json, tal como los entregó Codex (checkpoint/copyright-cinco-unidades-2026-10-18). La marca con color por unidad viaja en el GLB/PNG; la app no la recrea. Sigue el rótulo pequeño «© @gabrielhuav» de la app.
- Lerma y Xochimilco ya no usan el cuadro provisional: centro = centro de su plano (LER 19.290506, -99.498472; XOC 19.30419, -99.102905), radio 350 y 450 m. El código de «En desarrollo…» queda sólo para una unidad futura sin carpeta.
- Corrección Flutter: si se elige otra sede estando en 3D, el mapa se centra en ella al volver a Mapa o 2D (onMapReady), porque el MapController conserva la posición anterior.
- Probado en el emulador: las cinco unidades en Mapa, 2D y 3D en KMP y Flutter, sin fallos (capturas docs/capturas/p5_*).
- **AZC «en espejo», diagnóstico:** el PNG de AZC se lee bien, pero el plano de Azcapotzalco va casi de cabeza respecto al norte (giro ≈ -170° en georreferencia). Al mostrarlo con el norte arriba (Mapa, 2D y 3D), el texto queda **de cabeza**. En las otras cuatro el plano ya viene con el norte arriba. Arreglo propuesto para Codex: en AZC, orientar el texto de la marca con el norte calibrado (norteEnModelo / campusNorth), es decir girarlo ~180° en el modelo; no cambiar el encuadre ni el tamaño del PNG.

## App · Ajustes y modo desarrollador sin marca de agua (Claude, 19 oct 2026, feature/app-unidades)

- Botón «⚙ Ajustes» en KMP y Flutter: «Modo desarrollador» y, dentro, «Marca de agua». Fuera del modo desarrollador la marca siempre se ve. Claves guardadas: `desarrollador`, `marca`.
- Sin marca: 2D usa `plano_2d_sin_marca.png`; 3D en KMP oculta las entidades `Copyright_integrado_*` con la capa de visibilidad de Filament (no se libera el modelo); 3D en Flutter carga `modelo_sin_marca.glb` (se recrea `<model-viewer>`); desaparece el rótulo de la esquina.
- **Archivos nuevos en las cinco carpetas canónicas:** `UAM_<Unidad>_sin_marca.glb` y `plano_2d_sin_marca.png`. Se generaron con el propio editor de cada unidad, en una copia temporal (puertos 8868–8872, para no tocar los visores abiertos en 8768–8772), con `showCopyright=false` y Guardar cambios. Verificado: cero nodos de copyright, el resto de nodos idéntico al GLB con marca y el PNG del mismo tamaño. No se modificó ningún archivo existente de Codex.
- **Para Codex:** cuando vuelvas a exportar una unidad, exporta también su versión sin marca con esos mismos nombres (o avisa para regenerarla); si no, la versión sin marca quedará atrasada respecto al diseño.

## Prototipo 6 · rutas en Azcapotzalco, lado app (Claude, 19 oct 2026, feature/app-unidades)

- KMP (`Rutas.kt`, `ElegirRuta.kt`) y Flutter (`lib/rutas.dart`) leen `campus/rutas.json` con el contrato acordado (nodos id/lat/lon/x/z/nivel/tipo, aristas de/a/metros/tipo/accesible, destinos id/nombre/nodo). Botón «Ruta» (sólo con la sede Azcapotzalco): origen = mi ubicación (se ajusta al nodo más cercano; a más de 150 m empieza en el acceso más cercano) o un destino; destino = un destino. Dijkstra no dirigido sobre `metros`; se dibuja en Mapa y 2D; la tarjeta dice metros y minutos (1.2 m/s). En 3D todavía no se dibuja.
- **`campus/rutas.json` actual es PROVISIONAL** (`"provisional": true`), generado por `app-kmp/herramientas/red_provisional.py` desde `paths`, `gates` y el centro de cada edificio de `campus_editado.json`: 67 nodos, 72 aristas, 29 destinos, un componente. Sus tramos son rectos y pueden cruzar jardines o edificios. **Codex: reemplázalo completo** con la red del visor (mismos nombres de claves); la app no necesita cambios. Si cambian los IDs de destino, no pasa nada: la app sólo muestra `nombre`.
- Probado en el emulador (KMP y Flutter): mi ubicación → Edificio L 120 m · 2 min; Acceso P1 → HP ≈ 567 m · 8 min. Capturas docs/capturas/p7_*.

## Numeración de prototipos vigente (decidida por Gabriel, 19 oct 2026)

Son **cuatro** prototipos; esta numeración sustituye la que aparece en mensajes de commit y secciones anteriores de esta memoria («Prototipo 4», «5» y «6»):
- **P1 · ¿Dónde estoy?** — ubicación en el mapa. `v0.1.0`, hecho.
- **P2 · El campus** — Mapa, 2D y 3D; temas, día y noche; las cinco unidades con su croquis; Ajustes y modo desarrollador sin marca. `v0.2.0`, hecho.
- **P3 · Rutas** — de un punto a otro en Azcapotzalco (red provisional hasta que Codex entregue la suya). `v0.3.0`, hecho; versión actual de las apps 0.3.0.
- **P4 · Guía** — llegar solo con AR, RV o ambas. `v1.0.0`, Entrega 3 (26 nov). **No se ha empezado.**
Los commits ya publicados no se reescriben; las láminas de la Unidad III ya usan esta numeración.

## Entrega Codex · red del visor para P3 Rutas AZC · 18 octubre 2026

Trabajo solicitado como «Prototipo 6 · rutas», conservando la numeración vigente de cuatro prototipos de la sección anterior (corresponde a P3 Rutas; no se renumeran las apps). Rama nueva **feature/rutas-azc**, creada desde **feature/app-unidades en cefdd81** tras revisar estado limpio. Respaldo previo completo de campus, memoria y bundle en `Descargas/1151055 Administracion/_respaldos/2026-10-18_antes_rutas_azc`. **Sólo Azcapotzalco; no se tocaron app-kmp/ ni app-flutter/ ni otras unidades.**

**campus/rutas.json sustituye completa la red provisional de Claude**. Contrato versión 1, unidad azcapotzalco, sin bandera provisional. **115 nodos, 120 aristas no dirigidas, 31 destinos, un componente**. Un destino para cada uno de los 26 edificios presentes en el croquis, incluidos HO/HP y P1–P4, más COSEI, Plaza Roja y las tres entradas peatonales. IDs `ACCESO_P1/P2/P3` distinguen las puertas de los edificios P1/P2/P3. I: biblioteca; J: cafetería; A termina fuera de la zona de obra, sin invitar a entrar. No se inventan letras de edificios ausentes ni salida de T hacia Eje 5 Norte.

Trazado inicial en `campus/generar-rutas.mjs`, a partir del croquis canónico y sus caminos, plazas y galerías; no usa centros de edificios ni copia la red provisional. Divide las intersecciones en nodos compartidos. Por defecto comprueba sin escribir; **--write sustituye los ajustes por el trazado inicial**. Red editable autoritativa: rutas.json. `build.mjs` incorpora la red y georreferencia actuales en `route-data.js` y el HTML autónomo. Fuentes, uso, coordenadas y límites en **campus/RUTAS.md**.

Todos los nodos son de **PB (nivel 0)**. En E/K/P y la galería sur de H, el obstáculo excluye sólo la franja abierta que YA representa el modelo, con el mismo ancho `min(2.8 m,32% del fondo)`. Las rutas pueden verse bajo sus techos en 2D, pero no atraviesan los cuerpos cerrados. Los demás cuerpos se respetan, incluidos el giro de HO/HP y desplazamientos; no hay una exención genérica por llamar «pasillo» a una arista. La biblioteca I se alcanza por la escalera representada en COSEI, no accesible; no se inventa rampa/elevador. Los tramos de PB restantes sin barrera modelada tienen accesibilidad estimada, pendiente de comprobar anchos/suelo/puertas. La red aún puede dar rodeos por cuerpos que el croquis muestra cerrados: no garantiza el camino real más corto ni una ruta accesible certificada. No se dibujan pisos superiores ni rutas de otras sedes.

Lat/lon deriva exactamente de las tres esquinas y el encuadre existente, por interpolación afín de X/Z: u=(x+390)/780, v=(z+150)/320. **No se aplica otra rotación.** X/Z en metros del modelo. `metros` usa distancia horizontal geográfica local entre extremos calibrados, coherente con la escala próxima a 1,09 de AZC, no la distancia X/Z sin calibrar. No incluye medición 3D de pendientes/peldaños. Se conserva la incertidumbre geográfica previa; los decimales no son exactitud de campo.

Visor: «Ver nodos y caminos» y «Editar red de caminos». Selección por clic/listas; X/Z o clic para mover; añadir sobre un tramo lo divide; unir nodos; cambiar tipo/accesibilidad; reasignar destino; quitar tramos/nodos; historial propio deshacer/rehacer; importar rutas.json y comprobar red. Marcadores de tamaño legible a cualquier zoom. Modificaciones inválidas se revierten. **Guardar cambios rechaza una red desconectada o que corte cuerpos cerrados antes de escribir**, guarda rutas.json junto con los demás assets, y el servidor vuelve a validar el POST. Nuevos módulos locales `route-space.js`, `route-editor.js`, `route-data.js`; HTML portátil con nueve módulos incrustados. La red es capa visual de edición y **no se hornea en GLB ni PNG**.

Servidor actualizado con `/guardar/rutas`, `/guardar/glb-sin-marca`, `/guardar/plano-sin-marca`. **La sesión de revisión está en http://127.0.0.1:8780/Visor_UAM_autonomo.html**, sirviendo la carpeta canónica. El servidor anterior en 8768 se dejó abierto; hay que reiniciarlo para que admita los nuevos endpoints. Un inicio nuevo conserva 8768 por defecto. Guardar cambios ahora actualiza tanto `UAM_Azcapotzalco.glb`/plano_2d.png como **UAM_Azcapotzalco_sin_marca.glb / plano_2d_sin_marca.png**, sin alterar la preferencia de marca del JSON.

**Pendiente del copyright AZC resuelto en los assets web:** sus 33 planos se orientan con campusNorth/georreferencia, giro local del texto **-170,6746°** aproximadamente. Sólo se giran las letras, no la maqueta, el PNG ni su georreferencia. El grupo añade extras northAligned y textAngle. Conserva color oficial rojo, opacidad, cantidad, posiciones y bandera showCopyright. La marca se lee derecha en la vista con norte arriba. Falta confirmación en móvil de Claude.

**Pruebas:** `node verificar-rutas.mjs`: IDs/referencias, conectividad, 31 destinos válidos y próximos a su edificio/plaza/acceso, geometría sin corte de cuerpos cerrados, cruces con nodo común, coordenadas/distancias, negativos (duplicados, nodos inexistentes, metros/lat alterados, desconexión, destino faltante y un «pasillo» falso que corta L), todos los pares de destinos alcanzables. Ejemplos Dijkstra desde ACCESO_P1: H≈590,0 m, HP≈628,1 m, I≈624,5 m, L≈667,4 m; valores de esta red, no tiempos medidos en campo. Comprueba además orientación real de los 33 paneles, GLB sin marca y ausencia de la red horneada.

Prueba real en visor: mover n2 +1 m recalcula n1↔n2 de 9,16 a 10,25 m; deshacer/rehacer y volver a original. Moverlo dentro de L se rechaza y revierte. Añadir sobre un tramo da 116 nodos/121 tramos, deshacer restaura 115/120. Quitar la conexión de un acceso desconecta la red y Guardar cambios la bloquea; deshacer recupera el trazado válido. POST inválido al servidor devuelve 400 y no cambia rutas.json. Guardado final exitoso y sin cambios pendientes. Pasan sintaxis, verificar-rutas, campus/verificar-editor y verificar-copyright-campus. El verificador antiguo campus/verificar se actualizó de cinco imports fijos a los nueve módulos incrustados actuales; pasa las comprobaciones de arquitectura existentes.

Se conservan sin cambios **campus_editado.json, campus_base.json, model-data.js y georreferencia.json**, edificios/niveles/huellas, marco X[-390,390], Z[-150,170] y PNG **1560×640**. Se reexportaron los dos GLB y los dos PNG. Comparación del PNG sin marca con el respaldo previo: **idéntico píxel a píxel**; sólo difieren bytes de codificación. En el marcado cambia la orientación del texto. Etiqueta de checkpoint **checkpoint/rutas-azc-2026-10-18** y respaldo final `Descargas/1151055 Administracion/_respaldos/2026-10-18_checkpoint_rutas_azc`, con carpeta, memoria, verificadores, capturas, bundle y manifiesto; sin push/merge.

**Para Claude:** integrar feature/rutas-azc; copiar el rutas.json entregado y **no regenerarlo con red_provisional.py**. Los nombres de claves no cambiaron y las aristas siguen no dirigidas; no hacen falta cambios por el contrato. Copiar también assets AZC con/sin marca para recibir la corrección del copyright; no recalibrar el PNG ni aplicar una segunda rotación a rutas. Probar en KMP/Flutter origen GPS/destino, las tres entradas, I por escalera y H/HO/HP, selección de P1–P4 sin confundir puertas, lectura de marca con norte arriba y modo desarrollador sin marca. Sigue pendiente la validación de campo de entradas, recorridos y accesibilidad. La app 3D/AR y las otras unidades no reciben rutas nuevas en esta entrega.

## P3 · rutas con la red de Codex, integradas en la app (Claude, 19 oct 2026)

- `feature/rutas-azc` (d5b1322) se integró por avance rápido en `feature/app-unidades`: la app usa la red real (115 nodos, 120 tramos, 31 destinos); la red provisional de Claude queda sustituida. No hubo que cambiar código: el contrato coincide. `node verificar-rutas.mjs` pasa.
- Probado en el emulador con la red real (KMP y Flutter): mi ubicación → Edificio L 82 m · 2 min; Acceso P1 → Edificio HP 628 m · 9 min, por los andadores. El copyright de AZC ya se lee con el norte arriba en 2D y 3D. Capturas docs/capturas/p8_*.
- Láminas de la Unidad III (130): lámina «Del Prototipo 1 al 4» con capturas reales (P4 por empezar) y P3 con la red real.
- Práctica 3 (alumnado) ya apunta a las cinco carpetas `campus*` y, en Azcapotzalco, a revisar la red de caminos de su parte.

## Cierre de P2 y P3 en GitHub (Claude, 19 oct 2026)

- Milestones: #2 renombrado «Prototipo 2 · El campus (v0.2.0)»; nuevos #3 «Prototipo 3 · Rutas (v0.3.0)» (5 nov) y #4 «Prototipo 4 · Guía (v1.0.0)» (26 nov, Unidad IV, por empezar).
- Issues: #5 [HU06] campus en Mapa/2D/3D (P2); #6 [HU02] ruta más corta y #7 [HU05] aviso sin ruta (P3); #1 [HU01] buscar el salón pasó al P4 con comentario.
- PR #8 `feature/app-unidades` → `main` (Closes #5 #6 #7). Al integrar: releases `v0.2.0` (estado del P2, commit 42605d0) y `v0.3.0` (merge del P3).
- README y docs/prototipos.md describen P1–P3 hechos y P4 por empezar. La Unidad III llega hasta el P3 (130 láminas); el P4 irá en la Unidad IV.

## Cuajimalpa · entrada, caminos y canchas del equipo de Práctica 3 · 22 octubre 2026

Propuesto en el issue #12. Trabajo del equipo de Cuajimalpa (maxitodev/proyectos-integradores-uam_a, sus issues #35 entrada y caminos, de Bryan Tonatiuh Ochoa De La Cruz, y #38 canchas y realismo del visor, de Max Sánchez), copiado de este repositorio el 21 oct (sobre 53967de, sin diferencias) y trasladado aquí con sus 39 commits y su autoría. Sólo cambian `campus-cuajimalpa/`, `docs/plan-de-fotos/` y `docs/practica-3/`; no se tocaron las otras unidades ni las apps.

- **Diseño:** portería, andador y caminos vehiculares corregidos; tres canchas medidas (fútbol 31.4×51.5 m, fútbol rápido 22.8×49.9 m, básquetbol en losa de 16.4×29.5 m), camino de en medio, calle frente a la sede, carpas, techumbre y el montecito oriente con sus escaleras. Vista «Canchas». Medidas sobre Esri World Imagery y fotos del equipo: interpretativas, por confirmar en campo con los planes de fotos. Visor con cielo, hora del día, texturas CC0 de ambientCG, efectos opcionales (GTAO, brillo, SMAA) y vegetación, autos y personas (add-ons de three r160, MIT, en `vendor/`; detalle en `FUENTES.md` y `texturas/LICENCIA.txt`). El GLB crece de 542 420 a 892 440 bytes.
- **Contrato conservado (comprobado por hash o comparación):** IDs `TORRE_III` y `AUX_N`, sus huellas, `georreferencia.json`, `calibracion/puntos.json`, `campus_base.json`, `model-data.js`, `copyright-layout.js`, `server.mjs` y el PNG 1040×1000.
- **Dónde vive el diseño nuevo:** sólo en `campus_editado.json` (`architecture.sportsFields`, `walkways`, `planters`, `canopies`, `shelters`, `terrain`, `roads`; `courts` queda vacío; `elementEdits` guarda la portería y un árbol movidos con el editor). `model-data.js` y `campus_base.json` siguen siendo el croquis original, así que el JSON editado ya no es igual a `ORIGINAL`.
- **Marca de copyright:** las regeneraciones del equipo se habían guardado con `showCopyright` en false (sin marca en GLB y PNG). Se reexportó con el visor y la casilla activada: `showCopyright` true, grupo `Marca_copyright_modelo` con 10 paneles #F08200 al 0.84 (los 1528 nodos previos intactos) y marca en el PNG. Se regeneraron también `UAM_Cuajimalpa_sin_marca.glb` y `plano_2d_sin_marca.png` con el diseño nuevo (cero nodos de copyright, mismos nodos que el modelo con marca), que las apps usan en el modo desarrollador.
- **Pruebas:** comprobaciones de contrato sobre Cuajimalpa adaptadas de `verificar-campus-unidades.mjs` y `verificar-copyright-campus.mjs`, comparando contra `main` en lugar de los commits locales; visor abierto y guardado en Chromium sin cabeza sin errores propios (sólo el 404 de `favicon.ico`, que ya ocurría en `main`); exportar sin cambios reproduce el JSON byte a byte y el GLB con la misma estructura (ruido de coma flotante); `node build.mjs` reproduce `campus_base.json`, y el `Visor_UAM_autonomo.html` del equipo sólo difiere en saltos de línea CRLF dentro de los módulos incrustados.
- **Pendientes:** los dos verificadores del profe no se pueden ejecutar tal cual con el repositorio publicado (piden los commits locales 6dbf995 y 360e0ba) y, para Cuajimalpa, esperan `elementEdits` vacío (`verificar-campus-unidades.mjs`) y el JSON igual a `ORIGINAL` (`verificar-copyright-campus.mjs`): hay que decidir si se actualizan o si `model-data.js` adopta el diseño nuevo. Sin probar en dispositivo ni emulador (KMP y Flutter); el CI compila ambas apps con estos assets. Falta confirmar en campo medidas, alturas y la posición de la portería. `campus-cuajimalpa/Vista_actual.png` (captura temporal del visor) no está en el `.gitignore` de este repositorio.

## Cuajimalpa · Ágora y parte de atrás del equipo de Práctica 3 · 25 octubre 2026

Parte de Daniela Nava Martínez (maxitodev/proyectos-integradores-uam_a#37), fusionada en el repositorio del equipo con su PR #45 (7c12b28); su primera versión del Ágora la hizo ella con apoyo de Claude, según declaró en el issue, y Claude Code la reconstruyó a petición de Max Sánchez con cinco fotos de campo del equipo (23 oct; no se redistribuyen) y Esri World Imagery z19 rectificada con `georreferencia.json`. Aquí se trae sobre `main` (63c2dad). Sólo cambian `campus-cuajimalpa/`, `docs/practica-3/` y esta memoria.

- **Qué entra:** `agora.js` (Ágora en el lugar medido: membrana de 654 m², centro local (−15.7, 57), arcos de armadura, mástiles con luminaria de anillo, bocinas, pantallas, foro, gradas, terraza y mesas; editable `agora_cuajimalpa`), `plaza_trasera.js` (plaza del remetimiento, franja del costado y letras «soy uam» en 3D, editable `letrero_soy_uam`), `geometria.js` (combina piezas en una sola malla) y cambios en `cuajimalpaFacades()`: celosía en el remetimiento trasero hasta el piso, cara +u con ventanas verticales, vidrio y parasoles, torres de escaleras con balcones; además andador lateral, talud de pasto con arboleda, cámara «Ágora» y filtro «Portería, Ágora y letras». Anclas en `architecture.agora` y `architecture.letrero` del marco `CU_FRAME`.
- **Decisiones:**
  - Se conserva el visor sin Node.js de Gabriel (0025c8f: texturas y datos incrustados, «Usar la carpeta del campus»); no se trae la variante del equipo (`incrustar.js`).
  - `showCopyright` true: GLB y PNG con la marca; las variantes `_sin_marca` se exportaron con la casilla apagada.
  - Salen del costado la plaza, la rampa y el rótulo esquemáticos, porque las fotos muestran andador, talud y torres de escaleras: ya no existen los nodos `Rampa_acceso_aproximada`, `Pretil_rampa`, `Plaza_acceso`, `Portico_acceso`, `Pavimento_naranja`, `Jardinera_circular_acceso`, `Macizo_terracota_acceso`, `Rotulo_SOY_UAM_interpretativo`, `Base_rotulo_SOY_UAM`, `Perforacion_circulacion`, `Parteluz_patio` ni `Ventana_modular_patio_nivel_0..7`.
- **Evidencia:** IDs `TORRE_III` y `AUX_N` con sus huellas, `georreferencia.json`, `calibracion/puntos.json`, `campus_base.json` y `model-data.js` idénticos a `main`; PNG de 1040×1000 y caja del GLB igual al encuadre. `Marca_copyright_modelo` con 10 paneles #F08200 al 0.84 en `UAM_Cuajimalpa.glb` (1 372 288 B, 1737 nodos); cero nodos de marca en `UAM_Cuajimalpa_sin_marca.glb` (1 292 372 B), byte a byte igual al GLB del equipo. Visor por `file://` sin errores, con el Ágora y las texturas incrustadas, y 0 píxeles distintos frente a `server.mjs`; «Usar la carpeta del campus» y el servidor guardan GLB, PNG y JSON idénticos. Ninguna pieza del Ágora queda dentro del edificio. La revisión del equipo corrigió antes la cámara del Ágora (el edificio tapaba el 42 %), piezas dentro del muro, la membrana que tapaba el arco trasero, la base de la celosía, los balcones de la torre E y el arbolado del talud.
- **Pendientes:**
  - `verificar-campus-unidades.mjs:26` exige `Rampa_acceso_aproximada`: decidir si se cambia por un detalle actual (p. ej. `Agora_Cuajimalpa` o `Celosia_pliegues_claros`). Siguen los fallos que ya había por `elementEdits` (líneas 33 y 53) y las comparaciones con commits locales.
  - El plan de fotos del Ágora es entregable de Daniela. Alturas de arcos, mástiles y talud, posición exacta de las letras y la escalera de la esquina sur, por confirmar en campo.
  - Sin probar en dispositivo (KMP y Flutter).
