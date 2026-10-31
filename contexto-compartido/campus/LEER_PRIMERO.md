# Contexto para construir un campus desde cero

Este paquete permite continuar en una conversación nueva sin reconstruir el historial del chat. Fue preparado por Codex a petición de Gabriel el 20 de octubre de 2026, después de implementar ESCOM. Es documentación reutilizable del proyecto, no una sincronización automática entre chats.

## Orden de lectura

1. `METODO_CONSTRUCCION.md`: investigación, modelado, georreferencia, editor, exportaciones y comprobaciones.
2. `DATOS_DEL_NUEVO_CAMPUS.md`: información inicial y decisiones que debe registrar la nueva sesión.
3. `../../AGENTS.md` y `../../MEMORIA_COMPARTIDA_CAMPUS.md`: reglas del repositorio y estado compartido con Claude. Leer las últimas secciones y comprobar el estado actual con Git; las rutas/rama descritas aquí son una fotografía del 20 de octubre.
4. `../../campus-escom/README.md`, `../../campus-escom/FUENTES.md` y el código del ejemplo: referencia funcional completa, con sus limitaciones declaradas.

## Dónde está el proyecto

- Copia donde se escribió este paquete: **C:/dev/navegacion-uam-escom/**, worktree de la rama **feature/campus-escom**.
- Checkout habitual del equipo: **C:/dev/navegacion-uam-equipo-00/**. Ambas copias comparten el repositorio Git; no son dos diseños independientes.
- ESCOM: commit **c463add**. Entrega para Claude: **80c79f3**. Verificar integración posterior antes de asumir que faltan estos archivos en main.
- Visor ESCOM en esta entrega: http://127.0.0.1:8782/Visor_UAM_autonomo.html. Un servidor iniciado en otra sesión puede estar cerrado o sirviendo archivos de una copia antigua: comprobarlo.
- Respaldo ESCOM: **C:/Users/gabri/Downloads/1151055 Administracion/_respaldos/2026-10-20_checkpoint_escom/**.

Si sólo se proporciona esta carpeta como contexto, seguir los enlaces relativos hacia el repositorio para leer el código real. La guía no reemplaza los fuentes ni autoriza sobrescribir cambios de otras personas. Si el proyecto fue movido o integrado, localizar los archivos antes de editar y actualizar estas referencias.

## Acuerdos con Gabriel

- Se construye una **maqueta geométrica 3D reutilizable**, que se puede girar, con plano 2D derivado del mismo modelo. Las imágenes de referencia sirven para modelar; no se genera una imagen nueva por cada ángulo.
- Mantener una interfaz sencilla. Las herramientas de edición son opcionales y permiten acomodar elementos, dibujar estacionamientos y guardar.
- Guardar respaldo antes de cambiar una versión aceptada y checkpoint al terminar; actualizar la memoria con pruebas y pendientes reales. No borrar respaldos sólo por antigüedad: verificar el alcance de la autorización vigente y qué versiones hay que conservar.
- Un campus por carpeta, con IDs y nombres estables. **campus/** siempre es UAM Azcapotzalco. No moverla ni renombrarla para crear otro plantel.
- Claude se encarga de las apps. El trabajo de modelado entrega assets y documentación; no modificar **app-kmp/** ni **app-flutter/** sin un encargo explícito que cambie esta separación.
- Marca repetida **copyright @gabrielhuav** dentro de la maqueta, con color representativo y casilla para retirarla. Conservar también assets sin marca para el modo de desarrollo de las apps.
- No afirmar precisión medida cuando sólo se dispone de fotografías/croquis. Distinguir hechos documentados, interpretación geométrica y asuntos pendientes.

## Lo mínimo que necesita la nueva sesión

Nombre del campus y ciudad/ubicación para identificarlo sin ambigüedad. Con eso puede investigar las fuentes públicas y proponer la escala/encuadre. Si hay fotos, PDF, puntos GPS o correcciones del usuario, incorporarlos y registrar su procedencia. La falta de planos acotados no obliga a inventar medidas: producir un croquis aproximado y explicar su límite.

Al finalizar una nueva construcción, actualizar la memoria compartida y este contexto sólo con aprendizajes reutilizables; los detalles particulares quedan en la carpeta del nuevo campus.
