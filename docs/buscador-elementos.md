# Buscador de elementos

La base 5.0.5 utilizada por Circuit JGR ya incluye un buscador de componentes,
comandos y ejemplos. Se abre desde **Editar → Buscar componente o comando…**,
la lupa de la barra de herramientas, la tecla **/** (si no se ha asignado a otro
comando) o dos pulsaciones rápidas de Mayús.

`CommandPaletteRegistry.buildStatic()` obtiene los componentes de los mismos
elementos que el menú Dibujar. Por ello incluye los integrados propios y los
tres accesos del display sin mantener un segundo inventario. Al elegir un
componente activa su modo de dibujo; después se coloca en el esquema.
`registerCircuit()` incorpora los ejemplos, que aparecen al escribir al menos
dos caracteres. El cuadro permite seleccionar con flechas, aceptar con Intro,
cerrar con Escape y recuperar elecciones recientes.

## Mejoras propuestas

1. Añadir «Buscar elemento…» al principio de Dibujar, reutilizando el comando
   `edit/search`, para facilitar que se descubra la función.
2. Ofrecer un filtro «Elementos / Comandos / Ejemplos» dentro del mismo cuadro.
   El usuario que busca un componente no tendría que revisar resultados de
   otros tipos.
3. Indexar también la ruta de categorías y alias: «display / visualizador»,
   «biestable / flip-flop», referencias «CD4026 / 4026» y funciones como
   «contador». Mantener los alias junto a los metadatos del componente.
4. Normalizar tildes y espacios tanto en la consulta como en los textos
   indexados. Actualmente el cotejo convierte a minúsculas y admite caracteres
   no consecutivos, pero no elimina diacríticos.
5. Escuchar el evento `input` además de los eventos de teclado. Actualmente
   el filtrado depende de `keyup`: pegar con el ratón o ciertas entradas del
   teclado móvil puede no actualizar los resultados inmediatamente.
6. Ajustar el ancho del cuadro a pantallas pequeñas, mostrar el número de
   coincidencias y un mensaje cuando no hay resultados. Conservar la inserción
   habitual y los identificadores de comandos e historial.

Estas mejoras quedan estudiadas; esta modificación publica únicamente los
accesos del display y verifica la búsqueda existente.
