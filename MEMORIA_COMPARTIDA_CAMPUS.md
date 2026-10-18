# Memoria compartida del campus · Web y app móvil

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
