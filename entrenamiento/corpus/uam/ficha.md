# Ficha del corpus UAM Azcapotzalco

Generada para el reconocimiento del Edificio T. **Las fotos no están en este repositorio**: son de alumnos y se quedan en el equipo del profesor. Aquí sólo hay conteos y un [listado anónimo](manifiesto_anonimo.csv).

**La galería es provisional.** Las etiquetas todavía no están confirmadas: salen de las pistas que dejaron los alumnos y se usaron sólo las de confianza alta. Al confirmarlas, `modelo/galeria_uam.py` se vuelve a correr y usa las etiquetas confirmadas.

## Contenido

157 imágenes: 100 de la Tarea 2 de Métodos Numéricos, 54 de los issues #17 y #9, y 3 de la Práctica 3.

| Estado de la etiqueta | Imágenes |
|---|---:|
| Confirmada | 0 |
| Pista clara | 99 |
| Pista parcial | 12 |
| Sin pista suficiente | 46 |

Las pistas son los nombres de archivo, los pies de foto de PDF y Word, los títulos de los issues, el GPS con brújula y las copias exactas de otras fotos. El parecido visual sólo orienta: no cuenta como evidencia.

## Galería provisional

88 fotos únicas de exteriores, de 13 grupos de autores. Quienes compartieron la misma foto cuentan como un solo grupo.

| Clase | Fotos | Grupos |
|---|---:|---:|
| T | 50 | 10 |
| W | 5 | 3 |
| otro | 33 | 8 |

`otro` reúne lugares con pocas fotos, como la Plaza COSEI o el Edificio G. Compite contra T, pero nunca da una respuesta: la app dice «no sé».

## Evaluación

Misma red que la ESCOM (MobileNetV3 congelada), con galería y umbral propios. Se deja fuera a cada grupo y se consulta un recorte central, como en el teléfono.

- Exactitud en las tres clases: 68 %.
- Sin umbral, T encuentra 41 de sus 50 fotos, con 18 falsos positivos.
- **Con el umbral de 0,74, cuando dice T acierta el 93 % y encuentra el 52 % de sus fotos.**

La similitud no es un porcentaje de certeza. Son pocas fotos, no se probó todavía frente al edificio y las etiquetas siguen sin confirmar. Estas cifras pueden cambiar.

## Pendiente

- Confirmar las etiquetas.
- Vincular «2P» con un edificio del mapa y decidir qué hacer con «CIAD», que no está en el mapa.
- Probar frente al Edificio T, de día y de noche.
