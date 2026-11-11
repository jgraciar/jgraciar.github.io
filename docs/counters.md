# Contadores 7493 y 74xx191

Insertar en **Dibujar → Circuitos integrados digitales → Añadir contador binario 7493 / Añadir contador ascendente/descendente 74191**. Los ejemplos están en **Ejemplos de circuitos → Circuit JGR**:

- [7493](https://jgraciar.github.io/circuitjgr.html?startCircuit=7493-practice.xml): reloj de 2 Hz, realimentación QA → CK2 e indicadores QD QC QB QA. R1 y R2 son entradas 0/1; ambas a 1 reinician la cuenta. Teclas 1 y 2.
- [74xx191](https://jgraciar.github.io/circuitjgr.html?startCircuit=74191-practice.xml): reloj de 2 Hz, datos L1–L4, sentido U/D, carga LD, habilitación EN e indicadores QD QC QB QA. U/D=0 asciende y U/D=1 desciende (D); EN=0 cuenta y EN=1 detiene (E); LD=0 carga los datos sin esperar al reloj (L). Teclas 1–4 para los datos; L1 es el bit de menor peso.

Todos los controles tienen un nivel definido mediante entradas lógicas interactivas; no se han añadido símbolos de tierra. Las salidas auxiliares sin utilizar quedan libres. El reloj se inserta en **Dibujar → Entradas y fuentes → Añadir reloj**; las entradas y salidas lógicas, en **Dibujar → Puertas lógicas, entrada y salida**. Los nombres de las categorías pueden variar con el idioma.

Los modelos son funcionales de lógica ideal 0/5 V, con alimentación implícita como los integrados digitales básicos del simulador. El 7493 cuenta con flancos descendentes; CK1 controla QA y CK2 la sección de tres bits. El 74191 cuenta con flancos ascendentes y carga paralela asíncrona. La inicialización a cero es una condición del simulador, no una garantía del integrado físico. No se modelan retardos físicos ni consumo de alimentación.

En el símbolo facilitado, C y R llevan burbuja: C es el complemento de MAX/MIN y R corresponde a RCO, activo a nivel bajo con cuenta terminal, reloj bajo y EN=0. No es necesario conectarlas para un contador aislado.

El estado de la cuenta y del reloj se conserva al exportar e importar XML. Los tres integrados propios (4026, 7493 y 74191) permiten seleccionar y arrastrar todo el cuerpo, incluso si se insertaron con extremos coincidentes; un arrastre largo de inserción conserva su escala pequeña.

Referencia funcional: [TI SN74LS191](https://www.ti.com/lit/ds/symlink/sn74ls191.pdf). Las posiciones del símbolo agrupan funciones y no son un encapsulado DIP físico.

## Display del ejemplo 7493

Las salidas existentes QA/QB/QC/QD y su realimentación se conservan. Se añaden ramas horizontales desde los codos (800,192), (752,208), (704,224) y (656,240), respectivamente, hasta las entradas I0/I1/I2/I3 de un display decimal de cuatro bits situado a la derecha. Muestra 0–15, con QA como bit menos significativo. No necesita descodificador ni conexiones de alimentación adicionales.

## Comparación 7493 y cuatro JK

El mismo ejemplo muestra el 7493 arriba y el contador del archivo «8.7.3.1 contador_asincrono_4_bits_JK.txt» debajo. Comparten un reloj de 2 Hz. Una única línea de 5 V alimenta los controles físicos: RESET (tecla r) pone a cero ambos contadores; J=K (tecla e), inicialmente cerrado, habilita la conmutación de los cuatro JK. Sus resistencias de 10 kΩ mantienen las señales a cero al abrir los interruptores, con un único retorno común.

Se conservan las cuatro salidas binarias del 7493 y las cuatro del montaje JK. Cada contador tiene lectura decimal 0–15 y un descodificador con display de siete segmentos 0–F; A–F equivalen a 10–15. Los nombres IC_Q0…IC_Q3 y JK_Q0…JK_Q3 trasladan las señales a cada descodificador sin unir las salidas de ambos contadores. Se conservan los cinco osciloscopios del archivo aportado, ajustando sus referencias a los índices del montaje combinado.

Los JK mantienen el disparo por flanco descendente y la conexión en cascada del archivo original. Se añaden pines de reset para la puesta a cero común y se inicializan en cero para comparar la cuenta con el 7493 desde el arranque. Las rutas Q→CK siguientes se separan de los nuevos pines de reset para evitar conexiones accidentales.

## Contadores inferiores independientes con biestables T

Los dos montajes superiores se conservan: 7493 con QA realimentando CK2, reset unido y equivalente con JK. Solo se modifica la comparación inferior.

El 7493 tiene un reset común a las cuatro salidas. Para disponer de resets independientes se usan dos encapsulados: el primero aporta Q1, módulo 2, con un reloj independiente de 1 Hz; el segundo aporta Q2–Q4, módulo 8, con el reloj superior de 2 Hz. Las secciones no utilizadas tienen sus relojes fijados a cero. Cada grupo tiene lectura decimal y display de siete segmentos independiente.

Debajo, un biestable T reproduce Q1 y tres biestables T reproducen Q2–Q4. Todos tienen T=1. Los T nativos se activan por flanco ascendente: se invierten los dos relojes externos y la cadena usa las salidas complementadas para reproducir el disparo descendente del 7493, sin modificar el componente nativo.

El interruptor a borra Q1 en su 7493 y su T; b borra Q2–Q4 en el otro 7493 y los tres T. Ninguno afecta al otro grupo ni a los montajes superiores. El reset r queda reservado a los montajes superiores. Los controles mantienen los 5 V y el retorno compartidos.

Los dos resets inferiores se cargan cerrados para inicializar ambos circuitos a cero sin flancos espurios de la cadena T. Se abren con a y b para empezar a contar.
