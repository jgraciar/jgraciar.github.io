# Orden y ancho de las pestañas

Arrastrar el nombre de una pestaña hacia la izquierda o derecha cambia su orden.
Alt + Mayús + Flecha izquierda/derecha mueve la pestaña enfocada una posición.
Escape cancela un arrastre. En pantallas táctiles, una pulsación mantenida antes
de arrastrar reordena; un deslizamiento rápido desplaza la lista.

El ancho se reparte por igual entre las pestañas, hasta un máximo de 245 px.
Los nombres largos se acortan visualmente con puntos suspensivos y mantienen su
nombre completo en el título emergente. Cuando no caben a un ancho mínimo de
48 px, se desplaza únicamente la lista. El botón «+» se sitúa inmediatamente
después de la última pestaña, sin ocupar el espacio libre a su derecha.
El botón «+» y el control del panel
lateral quedan fuera de ella y siguen accesibles. En pantallas estrechas el
control del panel se representa mediante un icono y conserva su etiqueta accesible.

Se retira el límite fijo de ocho pestañas. Abrir otra pestaña o archivo no
depende de la anchura disponible. La pestaña activa se lleva a la vista al abrirla.
Reordenar mantiene los mismos motores, circuitos, nombres y estados de simulación.

La prueba de navegador comprueba arrastre en ambos sentidos, teclado, cancelación,
conservación de XML y tiempo, apertura de más de ocho pestañas, ajuste entre
320 y 1500 px, accesibilidad de «+», cierre y gestos táctiles.

«+» abre siempre un circuito vacío. El icono de dos hojas anterior al control
del panel lateral duplica la pestaña activa en otra independiente, con el sufijo
«(copia)». La copia conserva el circuito y el estado de marcha o pausa; puede
guardarse con otro nombre. El circuito original permanece abierto.

El botón «Organizar circuitos abiertos», junto a «Duplicar», ofrece tres vistas:
una sola pestaña, en horizontal (una encima de otra) y en vertical (lado a lado).
Las vistas agrupadas muestran todos los circuitos y permiten trabajar en cada
uno. El circuito sobre el que se pulsa pasa a ser el activo. Cada simulación
visible conserva su estado de marcha o pausa. Al volver a una sola pestaña,
las ocultas se pausan y recuperan su estado al mostrarlas de nuevo.

La disposición sigue el orden de las pestañas y se actualiza al abrir, cerrar
o reordenar. Cuando hay muchas ventanas, el área se puede desplazar para
mantener un tamaño mínimo de 320 × 280 px por circuito. Cambiar de vista
conserva los motores, los circuitos y los cambios pendientes de guardar.

En la vista agrupada, los menús, las herramientas y la barra de pestañas son
comunes y actúan sobre el circuito activo. Seleccionar otro circuito cambia
el destino de esos controles. El panel lateral se controla siempre mediante
un icono. Configuración, reinicio e inicio/parada se muestran mediante iconos
con etiquetas accesibles y títulos emergentes traducidos.

El panel lateral pertenece a cada ventana. Su control actúa solo sobre el
circuito activo y conserva la visibilidad de las demás ventanas. Al entrar
en vertical se ocultan todos los paneles automáticamente; las ventanas nuevas
en esa disposición también empiezan sin panel. El usuario puede mostrar
el panel de la ventana activa sin alterar las demás.

Configuración ocupa el extremo izquierdo de la barra de pestañas, con un
engranaje de seis dientes. Marcha/paro usa un triángulo y una barra vertical.
Los iconos comparten trazo fino y fondo transparente; mantienen su función
y sus etiquetas accesibles.

Configuración se abre en un diálogo global, centrado sobre toda la aplicación,
con fuente de 12 px. Su icono ocupa el extremo derecho de la barra. El cambio
de fondo se aplica a todos los circuitos. El separador entre ventanas mide
2 px y el marco activo mide 4 px, azul sobre blanco y amarillo sobre negro.

Marcha/paro utiliza un fondo verde pastel (#d8efd9) en marcha y rojo claro
(#f8d7da) en parada, también al pasar el ratón. `aria-pressed` mantiene el
estado accesible y gobierna el color. La pestaña del simulador y el motor
usan el icono original de https://www.falstad.com/circuit/favicon.ico mediante
un enlace directo al archivo de Falstad.
