# Quinta revisión visual de UAM Azcapotzalco

21 de noviembre de 2026. Comparación con el mapa de `3e0d55b` del PR #23.

[Ver el antes y después y el plano anotado de J–K](../docs/capturas/azc-habitaciones-biblioteca-jk-antes-despues.jpg)

## Habitaciones de Luz · Jardín norte de B

El recorrido escultórico de CyAD ubica la obra en el jardín norte de B. Se cotejaron cuatro fotos de UAMFoto del 23 de julio de 2024 conservadas en el corpus, `internet_000213` a `internet_000216`. Muestran la fachada de B detrás de las piedras, el kiosco al costado, dos pórticos alineados y la placa baja e inclinada. En la placa se leen el título, Guadalupe Ojeda y septiembre de 1996. La autoría y el año concuerdan con el informe de actividades de 1996 presentado al Consejo Académico. [Recorrido de CyAD](https://www.cyad.online/uncategorized/tour-escultorico-en-miercoles-de-en-medio/) · [Fotos institucionales de Azcapotzalco](https://www.uamfoto.uam.mx/copia-de-14-de-noviembre-de-2018-1) · [Acta 182](https://consejoacademico.azc.uam.mx/pluginfile.php/252/mod_page/content/84/ACTA182.pdf)

El ajuste anterior del editor colocaba el centro efectivo en `[336.45, 534.43]`. El marcador de Maps se proyecta a `[302.33, 529.27]` con la georreferencia del campus. Al ampliar en Maps se distingue un grupo de bloques claros a pocos metros del marcador. Ese grupo aparece también en imágenes aéreas de Esri de distintas fechas; las copas ocultan parte de la huella. Se colocó el centro estimado en `[297, 524]`, unos 20 m respecto al ajuste anterior dentro del mismo jardín, y se consolidó ese único ajuste en los datos de la obra. El ID editable se conserva. La posición de cada piedra y de la placa requiere una medición en campo. [Ficha y foto de septiembre de 2016](https://www.google.com/maps/place/Habitaciones+De+Luz+(Escultura)/data=!4m2!3m1!1s0x85d1f80b619ca6c7:0xca423807b2543f5b) · [Vista aérea de Esri](https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/19/233175/117696)

La maqueta sustituye el anillo de bloques rectangulares sobre disco elevado por apoyos pétreos irregulares, dos dinteles y una placa inclinada a ras de jardín. La cámara toma la vista desde el lado de la placa. La representación es esquemática. El antes y después de la obra utiliza el mismo ángulo y distancia relativos al centro de cada maqueta.

## J y K · Cruce y navegación

| Evidencia | Qué permite verificar |
| --- | --- |
| Proyecto terminal de Ingeniería Ambiental de 2003, apartado 7.6 | Registra escaleras en la intersección entre K y J desde el pasillo principal y distingue esa parada de la de K con L. Demuestra la existencia histórica de un cruce. [Proyecto y ficha del repositorio UAM](https://hdl.handle.net/11191/13291) |
| Planta de la remodelación de J y plano institucional de 2024 | La planta de 2009 muestra el acceso general desde el exterior. El plano institucional distingue los volúmenes de J y K. [Planta de Giovanni Bertely](https://bertely.wordpress.com/wp-content/uploads/2009/05/cafeteria-uam-azcapotzalco-planta.jpg) · [Plano de la UAM de 2024, p. 4](https://dcbi.azc.uam.mx/media/ProduccionEditorial/Eventos/ProgramaTecnico-2024.pdf#page=4) |
| Tomas 0004, 0150 y 0155 del corpus y fotos/panoramas del sector | Se reconocen el frente acristalado de J, el andador, el pavimento exterior y los jardines hacia H. Las tomas no muestran ambos extremos bajo la cubierta. El satélite distingue el paño entre J y K de la franja longitudinal del andador junto a L. [Galería de J](https://www.google.com/maps/place/Edificio+J+-+Cafeteria/data=!4m2!3m1!1s0x85d1f80afb51f261:0x6c954c5ff242b785) · [Vista aérea del sector](https://www.google.com/maps/@19.503558,-99.1875514,480m/data=!3m1!1e3) |

La red ya conecta las llegadas de J y K por el andador exterior y el pasillo: `n79 → n77 → n78 → n59 → n60`, 81,98 m en el modelo. Se comprobó por tramos que el recorrido anterior y el actual son iguales. Sigue pendiente comprobar si hay un acceso directo bajo la cubierta, si está abierto y qué desnivel tiene. La vista aérea por sí sola no permite fijar un nuevo tramo.

El buscador añade **Coordinación Divisional de Vinculación CSH**, planta baja, y **LIM · Laboratorio de Innovación Metropolitana**, segundo piso. La indicación lleva al acceso existente de K. [Vinculación CSH](https://vinculaciondcsh.azc.uam.mx/index.php/formacion-integral) · [Aleph 337, p. 7](https://kali.azc.uam.mx/aleph/numeros/aleph337.pdf#page=7)

## Edificio I · Sala de lectura

El corte del visor ahora distingue las estanterías a ambos lados, las dos franjas de paso entre mesas, la banda de color del entrepiso, el plafón y las lámparas suspendidas. Las fotos del corpus web `000009–000012` y una vista institucional permiten reconocer esa organización. El corte conserva la cámara y la envolvente. Los conteos y dimensiones son aproximados. [Serie fotográfica de la biblioteca](https://commons.wikimedia.org/wiki/File:Serie_de_fotograf%C3%ADas_-_Biblioteca_UAM-AZC_03.jpg) · [Servicios comunitarios de la UAM](https://vinculacion.uam.mx/eng/documentos/Servicios_Comunitarios.pdf)

## Verificación

- La revisión conserva georreferencia, huellas, 123 nodos y 130 tramos. El catálogo sube de 88 a 90 destinos. Los dos PNG conservan 1560 × 640 píxeles.
- Pasaron los verificadores del visor, las auditorías de geometría y el sondeo de ejes peatonales a 1, 1,8 y 2,2 m. Ambos GLB incluyen la obra en el punto estimado con su ID, placa y dinteles. El APK de depuración compiló con los seis recursos del mapa verificados byte por byte.
- La comparativa se generó con los renders y el plano del proyecto. Las fotos de referencia se mantuvieron en el corpus.
