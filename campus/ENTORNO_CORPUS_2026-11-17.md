# Entorno de plazas contrastado con el corpus · 17 noviembre 2026

`detalles-entorno-corpus.js` añade detalles visibles de mobiliario y pavimento a la base de Gemini. Se revisaron fotografías exteriores del corpus de alumnos y de la colección web. No se copian imágenes nuevas al repositorio: los enlaces de alumnos apuntan a la copia de caras pixeladas ya existente. Los originales se conservan. No se usan interiores de G/H para reconstruir exteriores, ni la fotografía web `internet_000219` retirada por el propietario.

## Evidencia y cambios

| Evidencia revisada | Observación visual | Aplicación al modelo |
| --- | --- | --- |
| [imagen_0025](../entrenamiento/corpus/uam/solo_caras/corpus/imagenes/imagen_0025.png), [imagen_0040](../entrenamiento/corpus/uam/solo_caras/corpus/imagenes/imagen_0040.png) | Botes rojo/blanco con cubierta superior y boca oscura de depósito, en Plaza Roja. | Se completan los ocho cuerpos de bote existentes con tapas abombadas, soportes, trasera y boca. Se conserva su planta y se apoya el cuerpo sobre el pavimento; antes penetraba en él. La placa frontal es neutra: no se inventan rótulos ni clasificación de residuos. |
| [imagen_0146](../entrenamiento/corpus/uam/solo_caras/corpus/imagenes/imagen_0146.png), [imagen_0148](../entrenamiento/corpus/uam/solo_caras/corpus/imagenes/imagen_0148.png), [imagen_0150](../entrenamiento/corpus/uam/solo_caras/corpus/imagenes/imagen_0150.png) | Postes grises bajos y cordones delimitan jardines en el entorno H/J/COSEI. | Se representa una delimitación parcial en el pequeño jardín ya existente de la plazuela J. Su forma circular es la aproximación heredada; no se amplía ni se inventa una zona verde. Se omiten los tramos que invadirían reservas de paso. |
| [imagen_0148](../entrenamiento/corpus/uam/solo_caras/corpus/imagenes/imagen_0148.png) | Rejilla circular en el pavimento frente al conjunto de vidrio. | Una rejilla circular con aro y barrotes, prácticamente a ras del pavimento de COSEI. Su ubicación es esquemática, próxima a la escultura existente; no es una coordenada obtenida en campo ni un agujero nuevo. |
| [imagen_0155](../entrenamiento/corpus/uam/solo_caras/corpus/imagenes/imagen_0155.png) | Bancas curvas de concreto apoyadas sobre un pavimento gris con franjas claras junto a J. | Se añaden paños grises y franjas claras dentro del piso existente. Las dos bancas se bajan 0,46 unidades de modelo para apoyar su base. Se conserva su geometría, nombre, giro y escala; el arco que invadía la ruta se desplaza hacia el centro dentro del pavimento, con ubicación esquemática. La otra banca conserva X/Z. |
| `internet_000003`, [Plaza Roja en Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Plazarojauamazc.jpg) | Mesa hexagonal de concreto con asientos entre jacarandas de Plaza Roja. | Una mesa y seis asientos dentro de la plaza, fuera de edificios, esculturas, jacarandas y reservas peatonales. Es una representación esquemática de la tipología observada, no un inventario ni una ubicación medida. Fuente de la colección web: KyoFch / Wikimedia Commons / CC BY-SA 3.0; la fotografía no se incorpora. |

No se añaden globos blancos en los postes de Plaza Roja: aparecen en la foto web, pero las referencias del corpus de alumnos muestran remates diferentes. Tampoco se añade el dispositivo solar visible en `internet_000220`, cuya ubicación y correspondencia actual no quedaron suficientemente corroboradas. Las instalaciones temporales de las fotos no se modelan.

## Posiciones, escala y circulación

Las fotos permiten identificar formas y materiales, no medir distancias con precisión. Las nuevas ubicaciones y dimensiones son aproximaciones visuales dentro de superficies canónicas existentes. No cambian IDs, huellas de edificios, límites del PNG, georreferencia, destinos ni atributos de accesibilidad.

El módulo evalúa la huella completa de cada nueva tapa, poste, cordón y conjunto de mesa/asientos. Excluye edificios, andadores, bases de esculturas y corredores de rutas de 1,8 unidades de ancho, incluidos sus extremos. La mesa evita además las posiciones canónicas de jacarandas. El pavimento y la rejilla se clasifican como superficies de suelo, por separado del mobiliario. Ninguna de estas comprobaciones certifica un ancho libre o accesibilidad reales.

La auditoría independiente del GLB anterior confirmó que el arco de una `Banca_curva_plazuela_J` sí invadía el corredor del tramo `n76–n77`: no era sólo un efecto de su envolvente convexa. Se corrige su posición esquemática con un desplazamiento local de **X: 0, Z: +2,62**, hacia el centro de la plazuela, conservando la ruta. El módulo busca el primer desplazamiento libre en pasos de 0,01 mediante los **triángulos reales proyectados del arco**, incluidos grosor y extremos, frente a todos los corredores y sus extremos redondeados, con margen adicional de 0,02. El arco completo queda dentro del piso circular existente y fuera del jardín central; conserva forma, nombre, giro y escala. Estas cifras son unidades del modelo y una decisión de representación, no distancias medidas ni una afirmación sobre la ubicación física de la banca. La exportación corregida debe volver a pasar la auditoría independiente del GLB.

## Comprobaciones reproducibles y auditoría del GLB

Ejecutar `node campus/verificar-entorno-corpus.mjs` desde la raíz. La prueba construye las superficies y muebles heredados pertinentes, aplica el módulo y comprueba:

- apoyo de las bancas sobre el piso, conservando geometría, escala y giro; sólo la afectada por la ruta cambia su posición X/Z;
- permanencia de todo el arco reubicado dentro del pavimento y fuera del jardín; el paso anterior de 0,01 aún incumple el margen adicional de 0,02;
- ausencia de superposición de sus triángulos con la otra banca y el mobiliario físico etiquetado del fixture;
- rejilla con relieve máximo de 0,03 sobre el pavimento del modelo;
- repetición sin duplicados e invariancia al desplazar, girar y escalar el campus;
- finitud de geometrías y separación explícita de suelo y mobiliario;
- distancia independiente de las huellas geométricas completas a los segmentos de ruta, sin reutilizar el algoritmo de exclusión del módulo.

Resultado del fixture en sus tres transformaciones: 103 mallas nuevas, ocho botes completados, dos bancas apoyadas y una de ellas reubicada, doce paños de pavimento, cuatro franjas, cinco postes con remate, cuatro cordones, una rejilla y un conjunto de mesa/asientos. Se comprueban 86 mallas de mobiliario, incluidos diez objetos heredados identificados por separado; no se detectan cruces nuevos ni heredados con los corredores. La verificación de distancia emplea incluso las envolventes convexas completas del mobiliario, sin exceptuar el hueco de las bancas curvas. Estos conteos describen el fixture, no son por sí solos una auditoría del archivo exportado.

Para comprobar el GLB real, cada malla afectada exporta `extras.corpusEnvironment = "2026-11-17-entorno"` y `pedestrianObstacle` / `groundSurface`. Los cuerpos de los ocho botes y la banca que no cambia X/Z incluyen además `existingFootprintPreserved: true`. La banca reubicada lleva **`existingFootprintPreserved: false`** y `corpusRouteAdjustment` con el desplazamiento y margen, de modo que nunca se exima como huella heredada. Las mallas de suelo tienen `pedestrianObstacle: false`; las tapas, soportes, bocas, placas, postes, cordones, mesa y bancos tienen `true`. El grupo `Entorno_corpus_2026_11_17` contiene rejilla y mesa; los botes se completan junto a sus cuerpos y los detalles de J permanecen bajo `Plazuela_bancas_curvas_J`. La auditoría debe recorrer todo el árbol, no sólo edificios o el grupo marcador.

La integración debe llamar `agregarEntornoCorpus({THREE,data,world,box,material,X,Z,S,net})` después de construir COSEI, edificios y plazuela, y antes de calcular reservas de estacionamiento. El resultado es geometría ligera compartida; no contiene fototexturas, datos personales ni nuevas fotografías del corpus maestro.
