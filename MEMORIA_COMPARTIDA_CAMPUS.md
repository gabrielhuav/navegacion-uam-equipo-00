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

Flutter: existe app-flutter pero no tiene declarados estos assets en pubspec.yaml al revisar. La paridad campus 2D/3D sigue pendiente. iOS 3D también está pendiente; no anunciar paridad completa.

Pendientes de la sesión: tocar edificio para centrar en 2D/3D; modo de interfaz simplificada; adaptar Flutter; actualizar láminas didácticas después de validar la app. No son tareas completadas por crear esta memoria.

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
