# UAM Azcapotzalco en Google Maps · 20 zonas

21 de noviembre de 2026 · Comparación con Salones UAM 0.6.0 (11), mapa del commit `f530ae4` y registro de producción en `c7fdc69`. La división cubre los 26 edificios del croquis, los accesos, las plazas, los estacionamientos y el sector deportivo. El plano de revisión numera áreas de trabajo aproximadas.

Se abrieron imágenes a tamaño completo, panoramas y mosaicos satelitales en Edge. Cada ficha indica qué se puede comprobar y qué quedaría pendiente. La fecha del mosaico de Maps no aparece en el visor. Los pines pueden señalar el centro del edificio y varias fotos usan las coordenadas de la ficha. Las longitudes se estimaron sobre la escala aérea y el croquis. Se cruzaron puntos dudosos con el corpus, las fuentes UAM o la vista aérea registrada. [Mapa institucional](https://dcbi.azc.uam.mx/media/Estructura/Mapa.png) · [Base de la 0.6.0](REVISION_POR_ZONAS_2026-11-21.md) · [Inventario previo de galerías](AUDITORIA_GALERIAS_MAPS_AZC_2026-11-21.md)

## Prioridad de implementación

| Alcance | Trabajo | Comprobación antes de exportar |
| --- | --- | --- |
| Representación y orientación | Tramos visibles del sendero B–D, cruces de G, patio de H, borde de Avenida 5 Norte y referencias de entrada de L | Comparar plantas y vistas a ras de suelo. Comprobar que el mobiliario y el paisajismo dejan libres los pasos. |
| Búsqueda de destinos | Laboratorios de W con nivel documentado | Vincular al acceso de W, mostrar el piso y verificar que la indicación acaba en la entrada del edificio. |
| Trazados e identificación | Contrastar pórticos de San Pablo, llegada D–D-001, CICTE, cubierta J–K, Plaza de Egresados y acceso a Q | Para mover huellas o rutas, registrar planta y cotas con puntos de control. Para habilitar un paso, corroborar letrero y uso. |
| HO, HP y monumentos | Conservar la foto de HO como referencia de detalle de su cubierta. Levantar por separado la cubierta y el mobiliario de HP. | Conseguir dos ángulos medibles de HP, incluida una vista desde el suelo, y comparar bases de esculturas con hitos fijos. |

## 01 · Puerta 2 y estacionamiento del acceso

**Evidencia.** El panorama frontal de enero de 2025 y una toma oblicua de diciembre de 2023 muestran una caseta acristalada al interior, dos ventanillas bajas en la torre y marcas amarillas y blancas sobre el vado. La vista aérea separa dos paños de unos 40 × 36 m y 28 × 27 m por un paso con seto. La foto oblicua aparece en la ficha de Incalli y su torre coincide con Puerta 2. [Street View frontal](https://www.google.com/maps/@19.5018598,-99.1836111,3a,75y,279h,90t/data=!3m4!1e1!3m2!1sskVmo8vZRzZwnEMzs0UcUQ!2e0) · [Foto oblicua](https://www.google.com/maps/place/Auditorio+Incalli+Ixcahuicopa/@19.5029676,-99.1858501,3a,75y,90t/data=!3m6!1e2!3m4!1sCIHM0ogKEICAgIDt3PXWYQ!2e10!3e12) · [Vista aérea](https://www.google.com/maps/@19.5022805,-99.1842617,240m/data=!3m1!1e3)

**Comparación y trabajo.** La 0.6.0 tiene el pórtico y la cebra. Falta diferenciar la caseta, el pavimento de aproximación y los paños de estacionamiento dentro de la huella disponible. Comprobar el paso peatonal junto a la caseta antes de cambiar la llegada.

## 02 · Puerta 4 y pórticos de San Pablo Xalpa

**Evidencia.** En enero de 2025, frente al acceso `P1` se ve un pórtico bajo con pilar terracota, dintel gris y reja roja. Frente a `P2` se distingue otro mayor con vado rayado y torre de tres vanos, candidato a Puerta 5. Más arriba, en el eje de `V2`, se ve la barda acanalada y la escalera del puente. [P1](https://www.google.com/maps/@19.5029538,-99.1833674,3a,90y,279h,90t/data=!3m4!1e1!3m2!1snAsOvL6ToEAUlmqBarn2XQ!2e0) · [P2](https://www.google.com/maps/@19.5033409,-99.1832798,3a,90y,279h,90t/data=!3m4!1e1!3m2!1smWbXNQuV3F_dzuXYjKv0tA!2e0) · [V2](https://www.google.com/maps/@19.5035309,-99.183234,3a,90y,265h,90t/data=!3m4!1e1!3m2!1sf44XhmmLZ9G9PY1LWvp54Q!2e0)

**Comparación y trabajo.** Los dos pórticos visibles tienen geometría muy distinta de los bloques genéricos de la 0.6.0. La vista frente a `V2` deja sin confirmar el segundo vano independiente que supone el croquis. Verificar las denominaciones oficiales, sentido de circulación y operación de los tres IDs antes de ajustar el grafo.

## 03 · A, CICTE y perímetro

**Evidencia.** La vista cenital muestra dos sectores de cubierta, una retícula estructural y una explanada hacia la avenida. Sobre la escala de pantalla, el volumen visible es del orden de 38 × 57 m y se aprecia más adentro del predio que el bloque de 44 × 47 m. El registro preliminar de la vista aérea sitúa la diferencia del orden de 25–30 m. Desde la calle en enero de 2025, la barda roja y los árboles cubren el frente. Dirección de Obras reportó trabajos contratados ejecutados al 4 de noviembre de 2026, con correctivos de impermeabilización pendientes. [Satélite](https://www.google.com/maps/@19.5026982,-99.1848752,240m/data=!3m1!1e3) · [Street View](https://www.google.com/maps/@19.5025062,-99.1834681,3a,75y,280h,92t/data=!3m4!1e1!3m2!1syoxTq6Unpx0hVJu3eyPSxA!2e0) · [Dirección de Obras](https://www.azc.uam.mx/CasaAbiertaAlDialogo/Documentos%20CICTE%20Azcapotzalco%20NI%20Obras%204%20nov%202026_1docx-1.pdf)

**Comparación y trabajo.** A tiene nombre y llegada exterior en la app, con un volumen esquemático. Pedir planta y fotos actuales de las caras hacia la avenida y el jardín. Con esos controles se podrá medir el desplazamiento y sustentar el acceso público.

## 04 · B y jardín entre B, C y D

**Evidencia.** En el satélite, el jardín arbolado tiene una profundidad de unos 70 m. Se distinguen un sendero curvo desde C, una banda pavimentada junto a B y un remate terracota en su cubierta hacia San Pablo. Las copas ocultan partes del sendero. [Vista aérea](https://www.google.com/maps/@19.5026982,-99.1848752,240m/data=!3m1!1e3)

**Comparación y trabajo.** El croquis tiene dos andadores rectangulares en el sector. Trazar el trecho curvo visible y distinguir la terraza de B del césped. La conexión que desaparece bajo copa queda por cotejar desde el suelo.

**Monumento.** La galería de B y la ficha de Habitaciones de Luz muestran piedras irregulares y una placa inclinada. La separación de unos 16 m entre el pin y la posición guardada sigue abierta. Fijar la placa respecto a una esquina identificable antes de desplazar el conjunto. [Habitaciones de Luz](https://www.google.com/maps/place/Habitaciones+De+Luz+(Escultura)/data=!4m2!3m1!1s0x85d1f80b619ca6c7:0xca423807b2543f5b) · [Comparación anterior](AUDITORIA_GALERIAS_MAPS_AZC_2026-11-21.md)

## 05 · C, Incalli y Librería

**Evidencia.** La foto de Incalli capturada en agosto de 2024 muestra doble puerta roja, placa amarilla, muro gris, ventilación alta y piso terracota. La foto oblicua de Librería de septiembre de 2016 muestra cancel acristalado a toda altura, dos hojas con tiradores y tres pedestales. Los pines de ambas fichas caen dentro de C y distan unos 38 m en el modelo. Las galerías incluyen también imágenes de Puerta 2, D y Biblioteca. [Incalli](https://www.google.com/maps/place/Auditorio+Incalli+Ixcahuicopa/@19.5029676,-99.1858501,3a,75y,90t/data=!3m6!1e2!3m4!1sCIHM0ogKEICAgIDPss6q4AE!2e10!3e12) · [Librería](https://www.google.com/maps/place/Librer%C3%ADa+UAM+Azcapotzalco/@19.5032455,-99.1852657,3a,75y,90t/data=!3m6!1e2!3m4!1sCIHM0ogKEICAgICE2bK51wE!2e10!3e12)

**Comparación y trabajo.** El destino de Incalli ya indica planta baja con llegada exterior. Las fotos proporcionan materiales y proporciones para distinguir los dos vanos. Para mover la llegada, comprobar su posición con referencia a la esquina y al sentido del corredor de C.

## 06 · D, auditorio D-001 y jardín

**Evidencia.** Dos tomas de abril de 2017. Desde el estacionamiento, una cebra clara y al menos cuatro bolardos preceden un paso entre setos hacia una marquesina en planta baja. Desde el jardín se ve un núcleo con aperturas horizontales y una escultura negra plegada de atribución pendiente. [Llegada desde estacionamiento](https://www.google.com/maps/place/Edificio+%22D%22/@19.5024108,-99.1852187,3a,75y,90t/data=!3m8!1e2!3m6!1sCIHM0ogKEICAgIDEzvP5Hg!2e10!3e12!7i3008!8i5344!4m2!3m1!1s0x85d1f80b450110e1:0xc2b31722ee39a408) · [Costado del jardín](https://www.google.com/maps/place/Edificio+%22D%22/@19.502077,-99.1852823,3a,75y,90t/data=!3m8!1e2!3m6!1sCIHM0ogKEICAgIDEzrvVyAE!2e10!3e12!7i5344!8i3008!4m2!3m1!1s0x85d1f80b450110e1:0xc2b31722ee39a408)

**Comparación y trabajo.** La app llega al exterior de D para D-001. Revalidar esa cebra y el corredor de llegada. Queda por demostrar qué puerta corresponde al auditorio y qué obra se ve desde el jardín.

## 07 · E, F y Plaza Roja

**Evidencia.** En junio de 2023, una toma exterior de F muestra un medallón rosa con dos anillos grises, una rejilla circular de árbol y el paso bajo las trabes. Otra toma a ras de planta baja muestra setos discontinuos y corredor gris con puertas rojas. [Medallón y cruce](https://www.google.com/maps/place/Edificio+%22F%22/@19.5036836,-99.1854841,3a,75y,90t/data=!3m8!1e2!3m6!1sCIHM0ogKEICAgIDxxMv_vgE!2e10!3e12!7i3024!8i4032!4m2!3m1!1s0x85d1f80b6df48d93:0x3855f86ab1d621c3) · [Corredor y setos](https://www.google.com/maps/place/Edificio+%22F%22/@19.5036836,-99.1854841,3a,75y,90t/data=!3m8!1e2!3m6!1sCIHM0ogKEICAgIDxxKvwBw!2e10!3e12!7i3024!8i4032!4m2!3m1!1s0x85d1f80b6df48d93:0x3855f86ab1d621c3)

**Comparación y trabajo.** El detalle existente desarrolla la primera planta de F y los jardines frente a E. En planta baja quedan pendientes el medallón y el arriate. Cotejar con la posición de puentes y vanos para ubicarlos y con una foto reciente de la plaza restaurada para confirmar vigencia.

## 08 · G, paso entre Plaza Roja y COSEI

**Evidencia.** La vista exterior oblicua de julio de 2022 muestra bordes bajos, vegetación en varias bandas y un globo blanco frente al arriostramiento. El corpus de alumnos `imagen_0080` y `imagen_0086` muestra ambos extremos del paso, paños laterales y un cruce transversal al pie del vano, con juntas en el pavimento terracota. Otra toma de la ficha se hizo dentro de un pasillo. [Exterior de G](https://www.google.com/maps/place/Edificio+G/@19.5034377,-99.1861941,3a,75y,90t/data=!3m8!1e2!3m6!1sCIHM0ogKEICAgICuxfbBTw!2e10!3e12!7i4000!8i3000!4m2!3m1!1s0x85d1f9302416eaed:0x3ae049573e8ba38b)

**Comparación y trabajo.** Ya existe el vano navegable y un rectángulo terracota bajo el paso. Perfilar los cruces visibles, las juntas y los bordes ajardinados con el mismo eje de ruta.

## 09 · HO, Plaza de Egresados y ajedrez

**Evidencia.** La vista satelital ampliada permite distinguir tres trazas curvas junto a una esquina de HO y un elemento circular separado hacia abajo en la imagen. La foto nocturna de abril de 2026 muestra árboles y una franja iluminada. El levantamiento de Egresados documenta el hemiciclo. La foto de Gabriel desde el segundo piso permite reconocer el remate, costuras, bordes cóncavos y tensores de la lona junto a las trabes. [Vista aérea](https://www.google.com/maps/place/Edificio+E/@19.5028888,-99.1870494,118m/data=!3m1!1e3!4m6!3m5!1s0x85d1f93d601c5cc7:0xa95c9df86b32d17e!8m2!3d19.5029848!4d-99.1859738!16s%2Fg%2F11v6t3p3db) · [Foto nocturna de HO](https://www.google.com/maps/@19.5029437,-99.1866559,4182a,13.1y/data=!3m8!1e2!3m6!1sCIABIhDT-ojPEx_y6kmVeABEZUl_!2e10!3e12!7i3072!8i4096) · [Referencias de Egresados](JARDINES_H_HP.md)

**Comparación y trabajo.** La 0.6.0 incorpora la lona ajustada con la foto y dibuja las gradas alrededor de una elipse. Cotejar la planta histórica y las dos trazas aéreas desde el terreno antes de alterar el hemiciclo o ubicar `Intersecciones`. La cantidad y posición exactas de las mesas siguen abiertas.

## 10 · H central, patio y Serpentina II

**Evidencia.** El satélite ampliado separa los grupos vegetados, un paño abierto terracota, un alcorque circular y al menos tres bandas claras en el lado hacia HP. La toma de septiembre de 2024 desde el estacionamiento muestra en Serpentina II dos aros de grava clara, con el exterior más fino, y un barandal amarillo cerca del cancel. [Patio de H](https://www.google.com/maps/place/Edificio+E/@19.5028888,-99.1870494,118m/data=!3m1!1e3!4m6!3m5!1s0x85d1f93d601c5cc7:0xa95c9df86b32d17e!8m2!3d19.5029848!4d-99.1859738!16s%2Fg%2F11v6t3p3db) · [Foto de Serpentina II](https://www.google.com/maps/@19.5025295,-99.187095,3a,75y,90t/data=!3m8!1e2!3m6!1sCIHM0ogKEICAgICn8KW1HQ!2e10!3e12!7i6000!8i4000)

**Comparación y trabajo.** El patio se representa como un rectángulo de unos 34,6 × 25,7 m. Ya se puede separar los paños dentro de esa huella. La posición estimada del alcorque es `[822,333]` en el croquis. La función y cotas de las bandas quedan abiertas. Agregar la grava exterior de Serpentina II tiene mejor fundamento que mover la escultura. La separación entre pin y ancla es de unos 4,4 m, dentro del error de registro.

## 11 · HP, Las tres Gracias y patio de ajedrez

**Evidencia.** Las dos fotos de julio de 2026, desde el césped, muestran bases bajas e inclinadas, claros de tierra bajo los árboles, una banca de listones junto a un asiento de acabado moteado y separaciones entre las figuras. El panorama de junio de 2019 muestra el costado del jardín y su relación con el andador de losas. [Galería de HP](https://www.google.com/maps/place/Edificio+HP/data=!4m2!3m1!1s0x85d1f80ae0b50def:0xdb5e1f0a58d554be) · [Panorama del andador](https://www.google.com/maps/@19.5025666,-99.1874735,3a,75y,299.68h,90t/data=!3m4!1e1!3m2!1sCIHM0ogKEICAgIDanZSd6QE!2e10)

**Comparación y trabajo.** La 0.6.0 ya contiene el jardín continuo y las tres piezas esquemáticas. El modelado de las bases bajas, el desgaste desigual del césped y la banca puede afinarse con estas fotos. Para determinar el perfil, los apoyos y la disposición de mesas de HP hace falta una referencia de su propio patio.

## 12 · I, Biblioteca y Plaza COSEI

**Evidencia.** La foto del pórtico, capturada en octubre y publicada en noviembre de 2024, confirma el gran retranqueo, la fachada acristalada y la llegada desde la explanada. El panorama interior de abril de 2017 muestra bandas que cruzan la loseta terracota y arriates con muretes bajos. La toma de calle de enero de 2025 muestra la barda sobre Avenida 5 Norte por la parte posterior. [Galería, foto 2](https://www.google.com/maps/place/Biblioteca+COSEI/@19.5043665,-99.1867885,3a,75y,90t/data=!3m6!1e2!3m4!1sCIHM0ogKEICAgIDX99PFVg!2e10!3e12) · [Explanada desde el interior](https://www.google.com/maps/@19.5034453,-99.1865436,3a,75y,149h,90t/data=!3m4!1e1!3m2!1sCIHM0ogKEICAgICE65LQNQ!2e10)

**Comparación y trabajo.** Se confirma la orientación de llegada de la biblioteca y se puede comparar la continuidad de la banda clara con los arriates y los pasos ya dibujados. Verificar vigencia de las bandas antiguas, distancia del pórtico al escalón y dimensiones de la rampa antes de ofrecer una indicación de accesibilidad.

## 13 · J, Cafetería, K y cruces

**Evidencia.** Una foto de septiembre de 2017, desde el área acristalada de la cafetería, muestra celosía triangular roja, luminarias esféricas y piso terracota. Otra de octubre de 2017 muestra plafón de rejilla y ductos sobre el comedor. El satélite de Maps muestra un paño de cubierta hacia K. En la vista aérea registrada de Esri, el conjunto visible en ese eje ocupa aproximadamente `[902,426,966,552]` frente a la huella atribuida a J `[902,487,965,552]`. El paño adicional mide del orden de 27 m en el eje hacia K. [Imágenes de Cafetería J](https://www.google.com/maps/place/Edificio+J+-+Cafeteria/data=!4m2!3m1!1s0x85d1f80afb51f261:0x6c954c5ff242b785) · [Satélite de J–K](https://www.google.com/maps/@19.503558,-99.1875514,480m/data=!3m1!1e3) · [Vista aérea Esri](https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/19/233175/117690)

**Comparación y trabajo.** La 0.6.0 tiene el comedor y su lucernario, y el eje `n77–n79` atraviesa en planta parte del paño adicional. Verificar en el suelo si ese paño es un vestíbulo, terraza, cubierta de circulación u otro cuerpo. Documentar la permeabilidad en planta baja antes de considerar un ajuste de ruta.

## 14 · T, Sistemas Escolares y Eje 5 Norte

**Evidencia.** En Street View, enero de 2025 y rumbo 195°, se distingue la barda de piedra por paños, reja roja con remate inclinado, banqueta arbolada y vanos altos con retícula al fondo. En el recorrido interior se ven columnas cilíndricas, canceles con zócalo y letrero de Sistemas Escolares. [Barda frente a T](https://www.google.com/maps/@?api=1&map_action=pano&pano=sExJmblJ7B1mWcJOoouVIw&heading=195.4) · [Aproximación por el patio, 8:14–8:24](https://www.youtube.com/watch?v=rU-4eFuBX2g&t=494s)

**Comparación y trabajo.** La llegada de T ya usa el patio interior. El exterior aporta ritmo y material para la barda y las celosías vistas desde Eje 5. La toma de calle queda como referencia perimetral. Falta verificar qué canceles interiores operan como entradas de uso cotidiano.

## 15 · L, CyAD, M y gimnasio exterior

**Evidencia.** El panorama al nivel del acceso, de junio de 2019, muestra dos cuerpos a ambos lados de un vestíbulo con columnas redondas y cancel blanco, piso reticulado y banca al fondo. La vista 360° que ofrece la ficha de L se tomó desde Eje 5 en enero de 2025 y documenta barda y reja. Un registro de la UAM de 2016 confirma el gimnasio exterior. [Panorama de CyAD](https://www.google.com/maps/@19.5034442,-99.1883851,3a,75y,90h,90t/data=!3m4!1e1!3m2!1sCIHM0ogKEICAgIDanY6baw!2e10) · [L desde la avenida](https://www.google.com/maps/@?api=1&map_action=pano&pano=DXvNMbFm0jweYkCc2KfYdw&heading=189.28) · [Gimnasio exterior](https://alephuamazcapotzalco.wordpress.com/2016/10/06/nuevo-gimnasio-al-aire-libre/)

**Comparación y trabajo.** L ya tiene dos niveles y los faldones en diente de sierra. El panorama aporta el diseño del umbral y su materialidad. Confirmar cara y vano al cruzar con el levantamiento de L antes de modelar el acceso. M ya tiene cinco aparatos esquemáticos, cuya forma y ubicación actuales requieren una foto reciente.

## 16 · W, laboratorios y estacionamiento W–R

**Evidencia.** Las fotos de 2022 muestran galerías, casilleros y diagonales de las cerchas del atrio. El panorama de CyAD de junio de 2019, hacia la escalera y la escultura Primera Letra, muestra dos cajones azules contiguos y franjas peatonales amarillas. El satélite distingue una fila angosta entre W y R. Maps y la UAM ubican dos laboratorios en W. La UAM documenta Aplicaciones de Plasma Frío y Conversión de Energía en primer piso, módulo A, y Teletráfico y Comunicaciones Ópticas en el tercer nivel. Conexión CBI lista otros 16 laboratorios de segundo y tercer nivel. [W en Maps](https://www.google.com/maps/place/Edificio+W/data=!4m2!3m1!1s0x85d1f9748761cd15:0x77b5917c84a83693) · [Panorama de la escalera](https://www.google.com/maps/@19.5032255,-99.1883997,2248a,75y,236.67h,90t/data=!3m8!1e1!3m6!1sCIHM0ogKEICAgIDanebm1wE!2e10!3e11!7i5760!8i2880) · [Plasma Frío](https://iee.azc.uam.mx/laplace.html) · [Conexión CBI, pp. 13–14](https://dcbi.azc.uam.mx/media/ConexionCBI/19_ene_abr_2020.pdf)

**Comparación y trabajo.** La 0.6.0 ya representa los casilleros y galerías. Faltan las diagonales de celosía y los dos destinos corroborados, que pueden compartir `n47` con el piso documentado. La escalera del panorama queda en otra cara. Registrar el contorno del estacionamiento antes de repintarlo, ya que parte de la franja del croquis coincide con arbolado y andador en la vista aérea. Confirmar en sitio la vigencia de la pintura de 2019.

## 17 · P, O y el edificio P1

**Evidencia.** El satélite muestra la cubierta roja continua de P y los empalmes con los talleres. El pin LAB y TALLERES CyAD cae dentro del edificio P1, a unos 46 m de la llegada `n98`. Su ficha carece de fotografías. El video muestra la marquesina curva de O. [Satélite de talleres](https://www.google.com/maps/@19.5038463,-99.1895401,301m/data=!3m1!1e3) · [LAB y TALLERES CyAD](https://www.google.com/maps/place/LAB+y+TALLERES+CyAD/data=!4m6!3m5!1s0x85d1f968fa0018b1:0xa902b8baa73a28f3!8m2!3d19.5038368!4d-99.188535!16s%2Fg%2F11hzbvwrdg) · [Aproximación a O, 1:22](https://www.youtube.com/watch?v=Pz5MSRU68Xo&t=82s)

**Comparación y trabajo.** La marquesina de O y las llegadas exteriores `n106`, `n66` y `n98` ya están representadas. La vista aérea sirve para cotejar la continuidad de la cubierta de P y sus acometidas. Un recorrido a pie debe confirmar las puertas secundarias de los tres cuerpos.

## 18 · Edificios P2, P3, P4 y S

**Evidencia.** La vista aérea separa tres naves claras, una franja oscura longitudinal entre P1 y P2, claros entre naves y el enlace de S y P4. Las sombras dificultan distinguir algunas cubiertas bajas. La UAM publica edificios y niveles de los espacios de Energía. [Vista aérea de talleres](https://www.google.com/maps/@19.5038463,-99.1895401,301m/data=!3m1!1e3) · [Ubica tu salón](https://energia.azc.uam.mx/en/ubica-tu-salon)

**Comparación y trabajo.** Los faldones y el patio cubierto de P4 ya aparecen en el modelo, al igual que las llegadas `n99`, `n100`, `n109` y `n104`. Registrar dónde se abren los claros y cotejar pasillos y puertas a ras de suelo. El expediente de inversión de 2026 registra cubiertas proyectadas, cuyo estado se debe verificar antes de añadirlas. [Proyectos de inversión UAM](https://transparencia.uam.mx/presupuesto/presup2026/Proyectos-de-inversion-con-clave-de-cartera-al-290426.pdf)

**Perímetro.** El acceso peatonal `P3` del croquis tiene una vista de enero de 2025 desde Eje 5 Norte. Esta vista aporta barda, banqueta y la aproximación exterior. Confirmar operación y continuidad interior del portón que usa el piloto como llegada desde el exterior. [Panorama del acceso P3](https://www.google.com/maps/@19.5049222,-99.1891268,3a,75y,171.28h,90t/data=!3m4!1e1!3m2!1sbC0qD7d7XzSPbdO2jFmQbg!2e0) · [Piloto de rutas](PILOTO_T_G_BIBLIOTECA.md)

## 19 · R, Q, campo natural y multicanchas

**Evidencia.** En R, una foto interior de febrero de 2020 muestra duela y vigas. Desde Central Rosario, Street View de julio de 2024 muestra la fachada roja posterior tras piedra gris y malla. Q se identifica como gimnasio de pesas en las fuentes institucionales. En el campo natural, una toma de abril de 2017 muestra la malla hacia las multicanchas y sus superficies azules con terracota. El panorama de enero de 2025 muestra el borde de Eje 5 con reja roja y malla detrás. El pin del campo natural queda a unos 74 m del centro de Fútbol 7. [R desde Central Rosario](https://www.google.com/maps/@?api=1&map_action=pano&pano=YzBF1O3cR6V4Kkg8U6hwCw&heading=31.42) · [Ficha del campo natural](https://www.google.com/maps/place/Campo+de+futbol/data=!4m2!3m1!1s0x85d1f80a7f7c57b3:0xab208d975c88b3b9) · [Borde de Eje 5](https://www.google.com/maps/@?api=1&map_action=pano&pano=eHE0c5cqGgSA4rgjgE5WSw&heading=194.57) · [Instalaciones deportivas UAM](https://csu.azc.uam.mx/deportivas/)

**Comparación y trabajo.** La app ya distingue tres multicanchas y el corte de R. Se puede perfilar el cierre y la separación entre zonas deportivas. La puerta de Q queda pendiente. El punto `n115` indica una aproximación exterior y necesita confirmación física antes de guiar a un vano concreto.

**Acceso vehicular.** La caseta y pluma de `V3` son esquemáticas. Las tomas consultadas de R y del perímetro deportivo sirven para verificar el cierre. Falta una vista frontal del vano y corroborar su uso. [Representación de V3 en el proyecto](METODOLOGIA_MEJORA_IA.md)

## 20 · Fútbol 7, gradas y perímetro deportivo

**Evidencia.** La vista aérea distingue la cancha oblicua y el techo estrecho de las gradas. Desde Ferrocarriles Nacionales, Street View de julio de 2024, hacia 87°, muestra un cierre externo alternado de piedra oscura, barrotes rojos sobre zócalo bajo y malla superior. La foto institucional muestra un murete blanco dentro del recinto. [Cierre desde Ferrocarriles Nacionales](https://www.google.com/maps/@?api=1&map_action=pano&pano=HY5f0h236SqOvdbIBTZyLg&heading=87.03) · [Foto UAM de Fútbol 7](https://cga.azc.uam.mx/wp-content/uploads/2024/10/fut.jpg)

**Comparación y trabajo.** La cancha, murete y gradas ya se corrigieron en la 0.6.0. Representar por separado el cierre exterior en el tramo visible. Hace falta una toma por cada extremo para cerrar el trazado y localizar una entrada operativa.
