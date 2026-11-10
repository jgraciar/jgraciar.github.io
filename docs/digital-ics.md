# Integrados digitales numerados

Encapsulados funcionales completos, con una entrada por referencia en **Dibujar → Integrados digitales**, organizado en ocho submenús por función. El número precede al nombre. Los ocho encabezados se traducen a los 22 idiomas; los nuevos nombres MSI están en español e inglés. Las referencias repetidas se incorporan una sola vez; 7476N es la variante DIP del 7476 y comparte su función, con un alias propio para poder localizar ambas denominaciones.

| Referencia | Contenido | Alimentación y masa (patillas) |
|---|---|---|
| 4081 | 4 AND de 2 entradas | 14, 7 |
| 7408 | 4 AND de 2 entradas | 14, 7 |
| 4011 | 4 NAND de 2 entradas | 14, 7 |
| 7400 | 4 NAND de 2 entradas | 14, 7 |
| 4071 | 4 OR de 2 entradas | 14, 7 |
| 7432 | 4 OR de 2 entradas | 14, 7 |
| 4069 | 6 inversores | 14, 7 |
| 4070 | 4 XOR de 2 entradas | 14, 7 |
| 4001 | 4 NOR de 2 entradas | 14, 7 |
| 7486 | 4 XOR de 2 entradas | 14, 7 |
| 7402 | 4 NOR de 2 entradas | 14, 7 |
| 4082 | 2 AND de 4 entradas | 14, 7 |
| 7420 | 2 NAND de 4 entradas | 14, 7 |
| 4012 | 2 NAND de 4 entradas | 14, 7 |
| 4023 | 3 NAND de 3 entradas | 14, 7 |
| 4043 | 4 latch RS NOR, salida de tres estados, ENABLE común | 16, 8 |
| 4044 | 4 latch RS NAND, salida de tres estados, ENABLE común | 16, 8 |
| 7476 / 7476N | 2 JK maestro-esclavo, PRE/CLR activos a nivel bajo | **5, 13** |
| 74112 | 2 JK por flanco descendente, PRE/CLR activos a nivel bajo | 16, 8 |
| 4027 | 2 JK por flanco ascendente, SET/RESET activos a nivel alto | 16, 8 |
| 40106 | 6 inversores Schmitt CMOS | 14, 7 |
| 7414 | 6 inversores Schmitt TTL | 14, 7 |
| 7404 | 6 inversores TTL | 14, 7 |

| 7430 | NAND de 8 entradas | 14, 7 |
| 74373 | Latch D de 8 bits, LE y /OE, salidas Z | 20, 10 |
| 7475 | Latch D de 4 bits, dos habilitaciones, Q y /Q | **5, 12** |
| 74194 | Registro universal bidireccional de 4 bits | 16, 8 |
| 74164 | Registro SIPO de 8 bits, /CLR asíncrono | 14, 7 |
| 74165 | Registro PISO de 8 bits, /PL asíncrono, QH y /QH | 16, 8 |
| 74190 | Contador BCD ascendente/descendente, carga asíncrona | 16, 8 |
| 74192 | Contador BCD con relojes UP y DOWN, CLR y /LOAD | 16, 8 |
| 74168 | Contador **BCD** síncrono ascendente/descendente | 16, 8 |
| 7447 | BCD a siete segmentos, colector abierto activo a nivel bajo | 16, 8 |
| 74147 | Codificador prioritario decimal a BCD, entradas y salidas activas bajas | 16, 8 |
| 74138 | Decodificador 3 a 8, tres habilitaciones y salidas activas bajas | 16, 8 |
| 74151 / 54151 | Multiplexor 8 a 1, /G y salidas complementarias | 16, 8 |
| 74152 | Multiplexor 8 a 1, salida invertida, sin habilitación | 14, 7 |
| 74150 | Multiplexor 16 a 1, /G, salida invertida | 24, 12 |
| 74181 | ALU de 4 bits: 16 funciones lógicas y 16 aritméticas | 24, 12 |
| 74189 | RAM 16 × 4, /CS y /WE, salidas invertidas Z | 16, 8 |

Cada patilla muestra su número físico y su función; el índice de la API es el número de patilla menos uno. La disposición sigue la vista superior de un DIP: primera mitad a la izquierda y segunda mitad a la derecha en orden inverso. Las burbujas identifican entradas activas a nivel bajo. Las patillas NC permanecen sin función interna. No se añaden conexiones a tierra al insertar un integrado.

## Funcionamiento y límites

Hay que conectar la alimentación explícitamente: TTL a 4,75–5,25 V; CMOS a 3–18 V. El modelo de puertas conmuta a 1,4 V en TTL y a la mitad de la alimentación en CMOS. La zona entre VIL y VIH de un componente real no se representa como un tercer estado lógico. Las entradas utilizadas deben tener un nivel definido.

Los Schmitt conservan memoria entre umbrales: 0,9/1,7 V para 7414 y 30/70 % de VDD para 40106. Son valores funcionales aproximados; no se deben utilizar para dimensionar un circuito real ni extraer tolerancias de fabricante. El 4069 reproduce su función digital, no su comportamiento como amplificador analógico.

Los JK del 7476 cargan el maestro durante el nivel alto y transfieren al esclavo al bajar el reloj. Se exige mantener J/K estables durante ese nivel alto, como indica el fabricante. El 74112 muestrea en el flanco descendente y el 4027 en el ascendente. Los controles asíncronos tienen prioridad. La activación simultánea de SET y RESET en los JK fuerza ambas salidas altas y se identifica en la información del elemento; no es una condición válida para diseñar un circuito y su liberación simultánea no tiene un resultado físico garantizado. El estado inicial cero es una condición del simulador.

En el 4043, S domina si S=R=1; en el 4044, R domina si ambas entradas activas a nivel bajo están a cero, conforme a las tablas de TI. ENABLE=0 deja las salidas en alta impedancia, pero el latch sigue respondiendo a SET/RESET. Al habilitar de nuevo aparece el estado almacenado.

Las salidas usan etapas resistivas simplificadas de 200 Ω y fugas de 1 TΩ. Sin alimentación válida quedan en alta impedancia. No se modelan las corrientes máximas, el consumo real de cada familia, la carga de las entradas TTL, los diodos de protección, la temporización, la temperatura ni los daños por cortocircuito. La impedancia de salida simplificada no debe confundirse con la capacidad real de excitar un LED o una carga. Las memorias y la histéresis se conservan al exportar/importar XML.

Los nuevos modelos MSI conservan registros, relojes y RAM en el XML. Los latch son transparentes mientras su habilitación está activa. En 74373, /OE solo controla la salida y no impide almacenar datos. El 74165 usa el flanco ascendente de CK OR INH; cambiar INH de bajo a alto con CK bajo también desplaza, como en la puerta de reloj del componente.

Los tres nuevos contadores son BCD (0–9). El 74168 carga en el flanco ascendente; 74190 y 74192 cargan de forma asíncrona. En 74192, CLR alto domina la carga y cada reloj cuenta en su flanco ascendente si el otro permanece alto. Deben cargarse datos BCD válidos.

El 7447 reproduce la tabla del fabricante también para códigos 10–15, /LT, /RBI y la patilla bidireccional /BI/RBO. Las salidas de segmentos y /RBO solo absorben corriente: requieren carga hacia el positivo o resistencias de elevación. También A=B del 74181 es de colector abierto. Las pruebas usan resistencias externas de 10 kΩ, sin añadirlas al insertar el componente.

El 74181 usa datos activos altos, M=1 para lógica y /Cn=0 para añadir acarreo. Los pines 15 y 17 ofrecen propagación y generación activas bajas; A=B libera el colector si F=1111. Para comparar A y B, usar la función de resta S=0110 con /Cn=1. La RAM 74189 escribe mientras /CS=/WE=0, presenta datos invertidos cuando /CS=0 y /WE=1 y libera las salidas al escribir o deshabilitarla. Su inicialización a cero es una condición del simulador.

## Fuentes de pinout y función

Hojas de datos del fabricante; las familias TTL y CMOS con una misma función no siempre comparten patillaje.

- [TI CD4073B/CD4081B/CD4082B](https://www.ti.com/lit/ds/symlink/cd4081b.pdf).
- [TI CD4011B/CD4012B/CD4023B](https://www.ti.com/lit/ds/symlink/cd4011b.pdf).
- [TI CD4071B](https://www.ti.com/lit/ds/symlink/cd4071b.pdf), [CD4001B](https://www.ti.com/lit/ds/symlink/cd4001b.pdf), [CD4070B](https://www.ti.com/lit/ds/symlink/cd4070b.pdf).
- [TI CD4069UB](https://www.ti.com/lit/ds/symlink/cd4069ub.pdf), [CD40106B](https://www.ti.com/lit/ds/symlink/cd40106b.pdf).
- [TI CD4043B/CD4044B](https://www.ti.com/lit/ds/symlink/cd4043b.pdf), [CD4027B](https://www.ti.com/lit/ds/symlink/cd4027b.pdf).
- [TI SN7476/SN74LS76A](https://www.ti.com/lit/gpn/SN5476), [SN74LS112A](https://www.ti.com/lit/ds/symlink/sn74ls112a.pdf).
- [TI SN7400](https://www.ti.com/lit/ds/symlink/sn7400.pdf), [SN74LS08](https://www.ti.com/lit/ds/symlink/sn74ls08.pdf), [SN7432](https://www.ti.com/lit/ds/symlink/sn7432.pdf), [SN7402](https://www.ti.com/lit/ds/symlink/sn7402.pdf), [SN7486/SN74LS86A](https://www.ti.com/lit/ds/symlink/sn74ls86a.pdf), [SN7420/SN74LS20](https://www.ti.com/lit/ds/symlink/sn74ls20.pdf), [SN7404](https://www.ti.com/lit/ds/symlink/sn7404.pdf), [SN7414](https://www.ti.com/lit/ds/symlink/sn7414.pdf).

- [TI SN74LS373](https://www.ti.com/lit/ds/symlink/sn74ls373.pdf), [SN7475/SN74LS75](https://www.ti.com/lit/ds/symlink/sn74ls75.pdf).
- [TI SN74LS194A](https://www.ti.com/lit/ds/symlink/sn74ls194a.pdf), [SN74LS164](https://www.ti.com/lit/ds/symlink/sn74ls164.pdf), [SN74LS165A](https://www.ti.com/lit/ds/symlink/sn74ls165a.pdf).
- [TI SN74190/SN74191](https://www.ti.com/lit/ds/symlink/sn74ls191.pdf), [SN74192/SN74193](https://www.ti.com/lit/ds/symlink/sn74ls193.pdf), [Motorola SN74LS168/SN74LS169](https://susta.cz/fel/74/pdf/sn_74168.pdf).
- [TI SN7447/SN74LS47](https://www.ti.com/lit/ds/symlink/sn74ls47.pdf), [SN74147/SN74LS147](https://www.ti.com/lit/ds/symlink/sn74ls148.pdf), [SN74LS138](https://www.ti.com/lit/ds/symlink/sn74ls138.pdf), [SN7430](https://www.ti.com/lit/ds/symlink/sn74ls30.pdf).
- [TI SN74150/SN74151/SN54151](https://www.ti.com/lit/ds/symlink/sn74ls151.pdf), [Hitachi HD74HC152, tabla lógica y patillaje](https://k1.spdns.de/Develop/Hardware/Infomix/ICs%20logic/74xxx/74152.HC.pdf).
- [TI SN74LS181, SDLS136, tabla 2 y diagrama lógico](https://www.ti.com/lit/ds/symlink/sn54ls181.pdf).

## Validación

Pruebas numéricas de las 42 referencias del modelo genérico: 584 combinaciones de puertas y 17.731 casos MSI, incluidos los 16.384 casos de la ALU, prioridad, habilitaciones, carga y desplazamiento, contaje BCD, RAM y colectores abiertos. Se conservan las pruebas de JK, RS e histéresis. Las pruebas de navegador verifican los ocho submenús, las 45 referencias numeradas (incluidos 4026, 7493 y 74191), las 42 nuevas referencias alimentadas a 5 V con cargas externas y la exportación/importación del estado.
