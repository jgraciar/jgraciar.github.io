# Cambio de idioma sin recargar circuitos

Los textos de los menús se conservan como expresiones de su fuente original.
Al cambiar el idioma se vuelven a evaluar las etiquetas de Dibujar, sus grupos,
los integrados, displays, menús contextuales, opciones, ejemplos y ayudas de la
barra de herramientas. No se reconstruyen los componentes ni sus conexiones.

La actualización conserva los nodos de los controles y sus manejadores,
selecciones, marcas y atajos. También actualiza los nombres del catálogo del
buscador y vuelve a registrar los ejemplos con sus títulos y rutas actuales.
Los catálogos propios neerlandés y sueco mantienen su código de idioma aunque
no dispongan de un fichero nativo separado.

Las pestañas abiertas reciben el cambio de idioma sin eco entre ellas. Se
actualizan los controles de la barra de pestañas y el selector de configuración.
Los nombres elegidos por el usuario para los circuitos permanecen intactos.

La prueba `verify-live-menu-locales-ui.mjs` reproduce valenciano → español desde
Configuración. Después compara los menús, contextuales, nombres, atajos y ayudas
de cambios sucesivos por los 22 idiomas con aperturas directas en cada idioma.
También comprueba la búsqueda de ejemplos, la identidad del motor, el contenido
del circuito, su tiempo y pausa, y la sincronización de dos pestañas abiertas.
