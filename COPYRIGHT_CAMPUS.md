# Marca de agua de las cinco maquetas

Checkpoint 18 octubre 2026. Texto: **copyright @gabrielhuav**, integrado en la maqueta y exportado al GLB y al PNG superior. Combina tres bandas grandes para la vista general con un mosaico de repeticiones para los acercamientos. Opacidad 0,84, contorno claro. La marca de esquina también usa el color de la unidad.

| Carpeta | Color RGB oficial UAM | Repeticiones en el modelo actual |
|---|---|---:|
| campus/ · Azcapotzalco | Rojo #CD032E | 33 |
| campus-cuajimalpa/ | Naranja #F08200 | 10 |
| campus-iztapalapa/ | Verde #57A519 | 55 |
| campus-xochimilco/ | Azul #0072CE | 57 |
| campus-lerma/ | Morado #AD25A8 | 48 |

Fuente de los códigos: [Colores distintivos, identidad UAM](https://www.comunicacionsocial.uam.mx/identidaduam/html/lineamientos/6-0-colores.html), consultada el 18 octubre 2026. El color institucional identifica la sede; no modifica la atribución OSM existente.

`copyrightStyle` en JSON define color, opacidad, separación de filas (32 m), ancho máximo de repeticiones (160 m) y las tres bandas grandes `largePanels`. El mosaico se calcula con `copyright-layout.js`, idéntico en las cinco carpetas para mantener cada visor portátil. Sus repeticiones se ajustan al contorno del predio, incluida la forma en L de Lerma. Las tres bandas grandes conservan los tamaños y lugares del checkpoint anterior.

La bandera booleana **showCopyright** conserva su contrato: casilla «Copyright en la maqueta». Al desactivarla, ocultar grupo completo `Marca_copyright_modelo` y rótulo de esquina. **Guardar cambios** debe reexportar GLB, PNG y JSON para que también los assets móviles queden sin marca. Cambiar la bandera en JSON no modifica un GLB/PNG ya generado. Los JSON antiguos sin `copyrightStyle` usan el estilo de la base como reserva.

El grupo exportado añade `color`, `pattern: tiled-site` y `panelCount` a sus extras. Cada plano se llama `Copyright_integrado_<índice>`: los índices ya pueden tener dos cifras, no limitar búsquedas a un solo dígito. Todos comparten una textura local y un material; la repetición añade pocos planos, sin imágenes remotas ni dependencias nuevas de ejecución.

Para Claude: copiar juntos GLB, `plano_2d.png` y `georreferencia.json` de cada carpeta canónica. Mantener dimensiones, recorte, orientación y escala. Los colores y repeticiones ya viajan dentro del GLB y del PNG. No añadir otra capa duplicada en móvil salvo que la app requiera explícitamente una marca propia. Revisar el asunto previo de texto AZC en espejo, que no se modifica en este cambio web. No se tocaron KMP ni Flutter.

Comprobaciones: `node verificar-copyright-campus.mjs`, `node verificar-campus-unidades.mjs`, `node verificar-campus-xochimilco.mjs`, `node verificar-campus-lerma.mjs`. La primera verifica datos de diseño conservados frente a 360e0ba, georreferencia, color, cantidad de planos y opacidad realmente exportados, y tamaños PNG. Prueba manual de Cuajimalpa: false → guardar → GLB sin grupo y JSON false; true → guardar → modelo final con las diez marcas. Estado final de las cinco sedes: marca activa, sin cambios pendientes.
