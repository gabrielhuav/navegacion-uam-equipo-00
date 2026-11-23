# Andador de las multicanchas, llegada a Q y conexión J–K

22 de noviembre de 2026 · Actualización del [PR #23](https://github.com/gabrielhuav/navegacion-uam-equipo-00/pull/23).

[Ver el antes y después en planta y en 3D](../docs/capturas/azc-andador-multicanchas-q-antes-despues.jpg).

## Andador de las multicanchas

El plano de Protección Civil de enero de 2026 dibuja una franja continua que sale del lado de 3P, pasa entre las tres multicanchas y el campo natural y gira hacia la fachada de Q. Al registrar la ortofoto al croquis se distingue la franja estrecha fuera de las canchas. La foto 0096 del corpus muestra el pavimento exterior y un cambio de nivel al borde de la plataforma. Las fotos 0075 y 0076 muestran el otro andador, junto a la barda norte del campo. [Plano de Protección Civil](https://www.azc.uam.mx/docs/proteccioncivil/PlanoPuntosReunionUAMA.pdf) · [Ortofoto del borde de las canchas](https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/19/233175/117687) · [Ortofoto frente a Q](https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/19/233173/117687).

| | Antes | Después |
| --- | --- | --- |
| Recorrido desde el mismo cruce | `n111 → n113 → n114 → n115`, 125.48 m. Cruza la plataforma de las multicanchas y termina en la parte posterior de Q. | `n111 → n124 → n113 → n114 → n115`, 90.18 m. Usa la franja entre las canchas y el campo hasta el frente de Q. |
| Representación del terreno | El paso entre ambas superficies no se distinguía. | El plano 2D y ambos modelos 3D muestran la continuidad del andador y el borde de la plataforma. La cámara **Multicanchas · Andador hacia Q** permite revisarlo de cerca. |

El nuevo giro de la red está en `n124 [1440, 463.5]`. El eje gira junto al campo en `n113 [1574.5, 463.5]` y llega a `n115 [1574.5, 497.5]`, frente a Q. Estas coordenadas del croquis y los anchos del pavimento son aproximados. Las dos distancias terminan en puntos diferentes del edificio. El desnivel real y el ancho libre quedan por comprobar.

## Q · Identificación de la puerta

El plano de 2026 distingue dos volúmenes de Q junto al campo y le asigna el punto de reunión 13. El rótulo grande «Gimnasio» corresponde al edificio R. En el plano histórico de 2008 aparece el símbolo de baños cerca de las canchas. El estudio de orientación identifica pesas en Q y la guía deportiva distingue las actividades de Q y R. Ninguno identifica qué hoja de la fachada corresponde al gimnasio de pesas. La app ahora orienta hacia el frente del campo y marca esa llegada como aproximada. [Plano histórico de 2008, p. 12](https://kali.azc.uam.mx/aleph/numeros/aleph128.pdf#page=12) · [Estudio de orientación de la UAM, p. 44 impresa](https://revistatd.azc.uam.mx/index.php/rtd/article/download/65/158/261#page=8) · [Guía deportiva](https://csu.azc.uam.mx/guias_uso/guia_deportivas.pdf).

## J–K · Conexión en el plano

Protección Civil y el mapa de CBI dibujan una pieza angosta con contorno propio frente al centro de la cafetería que alcanza K. Un estudio de 2003 ubica una escalera en esa intersección como parte de un itinerario de Intendencia. El plano de 2026 carece de información sobre nivel, umbrales y apertura al público. En la ortofoto la cubierta de J se prolonga hacia K más allá de la huella actual de la maqueta. Su proyección incluye los puntos usados como salida y cruce del comedor (`n79` y `n77`), por lo que ajustar la huella requiere volver a verificar esos accesos. Se conservó el recorrido exterior de 81.98 m. [Plano de Protección Civil](https://www.azc.uam.mx/docs/proteccioncivil/PlanoPuntosReunionUAMA.pdf) · [Mapa institucional de CBI](https://dcbi.azc.uam.mx/media/Estructura/Mapa.png) · [Proyecto de 2003, apartado 7.6](https://zaloamati.azc.uam.mx/bitstreams/5d64de72-b60c-49d8-902b-75d188cf96c8/download#page=88) · [Ortofoto sobre J y K](https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/19/233174/117691).

## Verificación

Se regeneraron el visor y las variantes 2D y 3D. Se conservaron las 26 huellas, todos los IDs existentes, la georreferencia y los PNG de 1560 × 640. La red tiene 124 nodos, 131 tramos y los mismos 93 destinos. La validación rechaza aristas que atraviesan el campo natural o las multicanchas. Las pruebas geométricas, la auditoría de pasos frente a los volúmenes de edificios y la compilación de depuración de Android pasaron. La comparativa contiene el plano, las rutas y las vistas del propio modelo.
