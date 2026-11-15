# Ficha del corpus UAM Azcapotzalco

Generada para el reconocimiento del Edificio T. **Los originales y sus correspondencias con alumnos permanecen privados.** Aquí están los conteos, el [listado anónimo](manifiesto_anonimo.csv) y la [copia derivada con sólo caras pixeladas](solo_caras/README.md) autorizada para revisión en el PR #23. La galería candidata pixelada se entrega por separado; los assets de la app se conservan.

**Las etiquetas están confirmadas.** El profesor revisó a mano las 157 imágenes. `modelo/galeria_uam.py` usa esas etiquetas.

## Contenido

157 imágenes: 100 de la Tarea 2 de Métodos Numéricos, 54 de los issues #17 y #9, y 3 de la Práctica 3. Las 157 tienen etiqueta confirmada.

Se quedan fuera de la galería los interiores, las fotos marcadas «descartar» o «no sé» y las copias exactas de otra foto.

## Galería

118 fotos únicas de exteriores, de 22 grupos de autores. Quienes compartieron la misma foto cuentan como un solo grupo.

| Clase | Fotos | Grupos |
|---|---:|---:|
| T | 50 | 17 |
| I | 8 | 5 |
| G | 7 | 3 |
| W | 6 | 3 |
| P2 | 6 | 3 |
| otro | 41 | 10 |

Una clase necesita al menos 5 fotos de 2 grupos. Las demás, como la Plaza COSEI o la Plaza Roja, van a `otro`. `otro` compite contra T, pero nunca da una respuesta: la app dice «no sé». Las clases T, I, G, W y P2 llevan a su destino en el mapa.

## Evaluación

Misma red que la ESCOM (MobileNetV3 congelada), con galería y umbral propios. Se deja fuera a cada grupo y se consulta un recorte central, como en el teléfono.

- Exactitud en las seis clases: 54 %. Las clases pequeñas se confunden entre sí y con T.
- Sin umbral, T encuentra 46 de sus 50 fotos, con 33 falsos positivos.
- **Con el umbral de 0,74, cuando dice T acierta el 90 % y encuentra el 76 % de sus fotos.** Con la galería provisional, encontraba el 52 %.

La similitud no es un porcentaje de certeza. Son pocas fotos y no se ha probado frente al edificio.

## Pendiente

- Probar frente al Edificio T, de día y de noche.
- Juntar más fotos de I, G, W y P2 para que dejen de confundirse con T.
