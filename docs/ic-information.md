# Fichas de circuitos integrados

Acceso mediante doble clic (doble toque en pantalla táctil) o «Información del integrado» en el menú contextual. La selección y el arrastre conservan su funcionamiento. El menú «Editar…» y el botón de la ficha mantienen el acceso a los parámetros.

Las 42 referencias del modelo DIP digital, los contadores 4026/7493/74191 y el temporizador 555 incluyen patillaje físico en vista superior. Las puertas muestran las unidades internas conectadas a sus patillas mediante símbolos rectangulares y burbujas de inversión; los JK y RS muestran los biestables y sus controles. Los MSI complejos usan diagramas de bloques funcionales, sin presentarlos como esquemas de transistores. El dibujo SVG se genera a partir de la misma definición de patillas usada por el modelo; permite ampliar y desplazarse horizontalmente.

Los componentes genéricos (ADC, DAC, biestables configurables, memoria, multiplexores, subcircuitos, etc.) muestran las conexiones realmente expuestas por el modelo, con identificadores T1, T2… y un aviso de que no representan un encapsulado físico determinado. No se les asigna un pinout comercial ni una familia TTL/CMOS por semejanza funcional.

La tabla y el dibujo muestran las tensiones **instantáneas**, actualizadas cada 250 ms mientras la simulación avanza. V(t) (GND) es el potencial respecto a la tierra del circuito; V(t) − VSS descuenta el potencial de la masa del integrado cuando está expuesta. Z describe la salida en alta impedancia: una resistencia externa puede fijar una tensión alta o baja en ese nodo. Abrir o cerrar la ficha no modifica el circuito ni añade conexiones a tierra.

El modelo 7493 tiene alimentación implícita. El 74191 antiguo tampoco expone VCC/GND y su salida C es el complemento de MAX/MIN. La patilla física 12 de ese dispositivo no recibe una lectura falsamente asignada a C: se muestra sin medición, y los terminales originales siguen accesibles en una tabla adicional. El 555 puede ocultar GND y RESET mediante sus opciones; esas patillas no se presentan como si estuvieran medidas.

Los límites funcionales del simulador se presentan separados de los del componente físico. Los umbrales 1,4 V de TTL y 0,5·VDD de CMOS son decisiones del modelo, no límites VIL/VIH del fabricante. La ficha de 7408 incluye los valores específicos del SN7408 (VCC 4,75–5,25 V, VIH ≥ 2 V y VIL ≤ 0,8 V); no los aplica a CMOS, HC, LS ni a todos los componentes con una numeración parecida. 4081B/4082B y NE555 incluyen sus respectivos intervalos de alimentación, comprobados en las hojas indicadas. Las demás referencias enlazan el documento correspondiente para consultar sus variantes, encapsulados y condiciones.

Las tablas de funcionamiento cubren puertas, histéresis, controles asíncronos, memoria, desplazamiento, carga/contaje BCD, selección, prioridad y ALU. La tabla ALU usa operandos activos altos; M=0 y /Cn=1 no añaden acarreo; /Cn=0 añade uno.

Los controles y encabezados están en los 22 idiomas del simulador; las explicaciones de los modelos y tablas utilizan español o inglés de respaldo, con ecuaciones y nombres de patilla invariantes. Los nombres elegidos por el usuario se insertan como texto, y las etiquetas SVG se escapan.

## Fuentes

- [TI SDLS033: SN7408/SN74LS08/SN74S08](https://www.ti.com/lit/ds/symlink/sn74ls08.pdf).
- [TI CD4073B/CD4081B/CD4082B](https://www.ti.com/lit/ds/symlink/cd4081b.pdf).
- [TI NE555](https://www.ti.com/lit/ds/symlink/ne555.pdf).
- [Patillajes y fuentes de los 42 modelos digitales](digital-ics.md).
- [TI SN7493/SN74LS93](https://www.ti.com/lit/ds/symlink/sn74ls93.pdf), [SN74190/SN74191](https://www.ti.com/lit/ds/symlink/sn74ls191.pdf), [CD4026B](https://www.ti.com/lit/ds/symlink/cd4026b.pdf).

## Comprobaciones

`tests/ic-info.test.mjs`: las 46 referencias físicas, numeración, roles, conexiones de todas las patillas funcionales en el SVG, tablas, diferencias de alimentación/umbrales, niveles Z y escape de etiquetas.

`tests/verify-ic-info-ui.mjs`: apertura real por doble clic en los 42 DIP alimentados, acción contextual, actualización de valores desde los nodos del solver y el SVG, conservación de elementos/posiciones, visualización móvil, cierre/Escape, edición y los modelos 4026/7493/74191/555 y un biestable genérico.
