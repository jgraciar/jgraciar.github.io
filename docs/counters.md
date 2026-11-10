# Contadores 7493 y 74xx191

Insertar en **Dibujar → Circuitos integrados digitales → Añadir contador binario 7493 / Añadir contador ascendente/descendente 74191**. Los ejemplos están en **Ejemplos de circuitos → Circuit JGR**:

- [7493](https://jgraciar.github.io/circuitjgr.html?startCircuit=7493-practice.xml): reloj de 2 Hz, realimentación QA → CK2 e indicadores QD QC QB QA. R1 y R2 son entradas 0/1; ambas a 1 reinician la cuenta. Teclas 1 y 2.
- [74xx191](https://jgraciar.github.io/circuitjgr.html?startCircuit=74191-practice.xml): reloj de 2 Hz, datos L1–L4, sentido U/D, carga LD, habilitación EN e indicadores QD QC QB QA. U/D=0 asciende y U/D=1 desciende (D); EN=0 cuenta y EN=1 detiene (E); LD=0 carga los datos sin esperar al reloj (L). Teclas 1–4 para los datos; L1 es el bit de menor peso.

Todos los controles tienen un nivel definido mediante entradas lógicas interactivas; no se han añadido símbolos de tierra. Las salidas auxiliares sin utilizar quedan libres. El reloj se inserta en **Dibujar → Entradas y fuentes → Añadir reloj**; las entradas y salidas lógicas, en **Dibujar → Puertas lógicas, entrada y salida**. Los nombres de las categorías pueden variar con el idioma.

Los modelos son funcionales de lógica ideal 0/5 V, con alimentación implícita como los integrados digitales básicos del simulador. El 7493 cuenta con flancos descendentes; CK1 controla QA y CK2 la sección de tres bits. El 74191 cuenta con flancos ascendentes y carga paralela asíncrona. La inicialización a cero es una condición del simulador, no una garantía del integrado físico. No se modelan retardos físicos ni consumo de alimentación.

En el símbolo facilitado, C y R llevan burbuja: C es el complemento de MAX/MIN y R corresponde a RCO, activo a nivel bajo con cuenta terminal, reloj bajo y EN=0. No es necesario conectarlas para un contador aislado.

El estado de la cuenta y del reloj se conserva al exportar e importar XML. Los tres integrados propios (4026, 7493 y 74191) permiten seleccionar y arrastrar todo el cuerpo, incluso si se insertaron con extremos coincidentes; un arrastre largo de inserción conserva su escala pequeña.

Referencia funcional: [TI SN74LS191](https://www.ti.com/lit/ds/symlink/sn74ls191.pdf). Las posiciones del símbolo agrupan funciones y no son un encapsulado DIP físico.
