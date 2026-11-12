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

## Mejoras implementadas

1. «Buscar elemento…» al principio de Dibujar abre el mismo cuadro con el filtro
   de elementos seleccionado. Editar, la lupa y los atajos abren la búsqueda combinada.
2. Filtros «Todo / Elementos / Comandos / Ejemplos» dentro del mismo cuadro.
   El usuario que busca un componente no tiene que revisar resultados de
   otros tipos.
3. Se indexan la ruta de categorías y alias: «display / visualizador»,
   «biestable / flip-flop», referencias «CD4026 / 4026» y funciones como
   «contador». Las funciones de los integrados se extraen de sus metadatos;
   los alias de componentes genéricos se mantienen en `CircuitJGRSearch.ts`.
4. Se normalizan diacríticos, mayúsculas, separadores y espacios. Los resultados
   exactos del nombre se sitúan por delante de alias y coincidencias aproximadas.
   Los comandos se buscan también por su nombre traducido.
5. Se escucha `input`, incluida la escritura con teclado móvil y el pegado
   mediante ratón. La composición de texto IME se procesa cuando termina.
6. El cuadro se ajusta al espacio visible, incluido el teclado en pantalla,
   muestra el número de resultados y avisa cuando no hay coincidencias.
   Se muestran hasta 50 filas y se informa del total encontrado.

La selección mantiene la inserción habitual, los identificadores de comandos y
el historial. Flechas e Intro seleccionan un resultado; Escape cierra el cuadro.
El selector de tipo conserva su navegación nativa por teclado. Se mantienen los
22 idiomas del simulador. Los ejemplos requieren al menos dos caracteres.
