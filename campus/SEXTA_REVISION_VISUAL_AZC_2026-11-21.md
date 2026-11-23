# Revisión visual de J–K, Q y F en UAM Azcapotzalco

21 de noviembre de 2026 · Actualización del PR [#23](https://github.com/gabrielhuav/navegacion-uam-equipo-00/pull/23).

[Comparación del modelo antes y después](../docs/capturas/azc-j-k-q-f-antes-despues.jpg). Cada par usa la misma cámara.

## Cafetería J y edificio K

| Momento del recorrido 360° | Observación |
| --- | --- |
| [7:29–7:41](https://www.youtube.com/watch?v=rU-4eFuBX2g&t=449s) | La cámara llega a la fachada de la cafetería desde la explanada. Al girar hacia atrás se distingue la biblioteca I. La toma frontal coincide con la foto 0004 del corpus. |
| [7:54–8:00](https://www.youtube.com/watch?v=rU-4eFuBX2g&t=474s) | La cámara pasa junto a los canceles con banda naranja, bajo la cubierta de J y sobre loseta color terracota. Al girar la vista de las [8:00](https://www.youtube.com/watch?v=rU-4eFuBX2g&t=480s) hacia el jardín se lee la letra roja de K. |
| [8:06–8:12](https://www.youtube.com/watch?v=rU-4eFuBX2g&t=486s) | La filmación sigue junto al costado de J y corta a Sistemas Escolares (T). No muestra el extremo del posible paso desde K ni un trayecto continuo entre los edificios. |

Se modelaron la galería exterior, la cancelería en esquina, las rejillas y las luminarias de J dentro de su huella, así como el rótulo de K visible desde J. La ubicación y las dimensiones exactas de estas piezas son aproximadas. La [planta de remodelación de la cafetería](https://bertely.wordpress.com/wp-content/uploads/2009/05/cafeteria-uam-azcapotzalco-planta.jpg) aporta contexto para el acceso exterior.

El [estudio de la UAM de 2003, figura 5.1, pp. 88–89](https://zaloamati.azc.uam.mx/bitstreams/5d64de72-b60c-49d8-902b-75d188cf96c8/download#page=88) sitúa una escalera en la intersección de J y K en el contexto de una propuesta de recolección. Queda por verificar el desembarco desde K y si el paso está habilitado para el público. El camino exterior de 81.98 m sigue por los nodos `n79 → n77 → n78 → n59 → n60`.

## Gimnasio de pesas Q

La foto 0075 del corpus muestra la letra roja de Q y varios vanos en la fachada orientada al campo natural, incluida la cubierta clara con perfiles rojizos en el tercio sur. La 0076 documenta el pavimento al norte del campo. El [plano institucional de CBI](https://dcbi.azc.uam.mx/media/Estructura/Mapa.png) y la [vista aérea](https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/19/233173/117687) permiten ubicar el volumen junto al campo. El [artículo de la UAM sobre sus instalaciones deportivas](https://revistatd.azc.uam.mx/index.php/rtd/article/download/65/158/261#page=8) identifica el uso de Q.

La huella rectangular pasa de `[1603, 520, 1648, 576]` a `[1577, 494, 1611, 604]` en las coordenadas del croquis. La nueva posición y los módulos de fachada son aproximados. Se incluyeron el rótulo, la marquesina traslúcida y los canceles hacia el campo. El [panorama de Google Maps de julio de 2024](https://www.google.com/maps/place/Gimnasio+de+Pesas/data=!4m2!3m1!1s0x85d203005408bdfd:0xf6930ee7233e7c1e) permite distinguir la cara posterior detrás de la reja de Ferrocarriles.

La planta baja conserva la llegada orientativa por el lado de Ferrocarriles. Se movió su punto final `n115` tres píxeles del croquis, aproximadamente 1.33 m a la escala del modelo, y se recalculó únicamente el último tramo. La indicación del destino orienta hacia la fachada del campo. Quedan por confirmar la puerta específica de pesas y un itinerario continuo desde la red peatonal hasta esa puerta. El tramo preexistente entre `n111` y `n113` cruza la zona de multicanchas del modelo y requiere contraste en sitio.

## Galería del primer piso de F hacia Plaza Roja

La foto 0049 del corpus muestra el pavimento, los accesos retranqueados, la ventana alta y las luminarias transversales. Se reprodujeron las juntas y el grano del piso, dos accesos visibles y los remates interiores, con medidas aproximadas. Se conservó la envolvente de F. [Aleph 336, UAM Azcapotzalco](https://kali.azc.uam.mx/aleph/numeros/aleph336.pdf#page=3).

## Validación

- Ambos modelos 3D, ambos planos 2D y el visor autónomo se regeneraron. Se conservan la georreferencia, el tamaño de 1560 × 640 px y los identificadores de los 26 edificios. La red conserva 123 nodos, 130 tramos y 90 destinos.
- Pasaron los validadores de campus, las 16 pruebas de geometría y la compilación de depuración de Android con sus pruebas. La auditoría de intersecciones de rutas con las cajas de los edificios registró cero cruces a 1, 1.8 y 2.2 m de altura. Esta comprobación evalúa el modelo geométrico. La inspección en sitio sigue pendiente donde se indica.
