# Comparación de los elementos originales con Falstad

Comprobación del 10 de noviembre de 2026. Resultado: no se han detectado regresiones en el alcance descrito.

## Fuente y versiones

Circuit JGR utiliza la base pública de CircuitJS `8ac55f22a03606579b822b3dccd4dc10de1ddc5b` (5.0.4ts). La web oficial de Falstad consultada muestra 5.0.5ts. Por tanto, la identidad del código se comprueba contra la base original fijada; la comparación de comportamiento se ejecuta contra la web oficial actual.

De los 260 archivos TypeScript originales, 241 son idénticos y ninguno falta. De los 157 archivos de modelos concretos de componentes, 156 son idénticos. La excepción intencionada es `WattmeterTrueElm.ts`, ampliado para las mediciones de potencia del proyecto.

El motor `SimulationManager.ts`, los nodos, la base de chips y el analizador numérico original conservan sus archivos íntegros. En `CircuitElm.ts` solo cambian los métodos de inicialización del formato y presentación de unidades. En `MouseManager.ts` solo cambia la preparación del menú contextual: doble clic, arrastre, teclado y demás manejadores originales conservan su código. En `CommandManager.ts` se amplía el despacho de órdenes para las funciones añadidas.

Las 147 órdenes originales de creación de componentes siguen presentes. Las diferencias deliberadas incluyen organización y traducción de menús, nuevos componentes, información contextual, presentación y entrada regional de números, configuración inicial e identidad de la aplicación. Estos cambios de interfaz no implican identidad visual con Falstad.

## Comparación de las webs publicadas

Se han abierto con Chromium las dos aplicaciones reales:

- https://www.falstad.com/circuit/circuitjs.html
- https://jgraciar.github.io/circuitjgr.html

Los 47 ejemplos originales se importan con exactamente el mismo contenido en ambas. Se compara la estructura XML exportada, incluidos tipos, parámetros y coordenadas, y se registran las tensiones de todos los terminales y la intensidad de cada elemento en tres instantes: 0,137 ms, 1,173 ms y 3,137 ms. El paso máximo es de 5 µs, reducido cuando hace falta para alcanzar el instante de muestreo. Se exige una diferencia máxima de `1e-7 + 1e-6 * max(abs(a), abs(b))` para cada magnitud numérica.

Resultado: **47 de 47 circuitos coincidentes**, con 141 muestras por web. Los ejemplos cubren resistencias, condensadores, bobinas, RLC, fuentes, diodos y rectificación, zéner, BJT, MOSFET, JFET, transformadores, amplificadores operacionales, multiplexores, DAC, sumadores, biestables, contadores, registros de desplazamiento, relés, SCR y 555.

Además, el doble clic real sobre el biestable D y el 555 abre el editor original en ambas webs. Coinciden los tipos, valores y estados de sus campos. En Circuit JGR no se abre la ficha informativa al hacer doble clic.

Ejecución y resultados completos: https://github.com/jgraciar/jgraciar.github.io/actions/runs/42911144016 (artefacto `falstad-compatibility`).

## Repetición y límites

El flujo `.github/workflows/falstad-compatibility.yml` permite repetir la auditoría. `tests/audit-falstad-source.mjs` comprueba los archivos originales, métodos y órdenes de dibujo; `tests/compare-falstad-live.mjs` ejecuta los casos contra las webs publicadas y guarda los resultados completos en JSON.

La prueba de comportamiento es una batería representativa con un intervalo temporal concreto; no recorre todas las configuraciones posibles de los componentes. La comprobación de identidad del código sí abarca todos los modelos originales de la base fijada, con la excepción explícita del vatímetro ampliado. Una futura actualización de la web oficial puede introducir diferencias respecto a esta base sin que procedan de Circuit JGR.
