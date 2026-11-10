# Integrados digitales numerados

Encapsulados funcionales completos, con una entrada por referencia en **Dibujar → Integrados digitales**. El número precede al nombre traducido. Las referencias repetidas se incorporan una sola vez; 7476N es la variante DIP del 7476 y comparte su función, con un alias propio para poder localizar ambas denominaciones.

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

Cada patilla muestra su número físico y su función; el índice de la API es el número de patilla menos uno. La disposición sigue la vista superior de un DIP: primera mitad a la izquierda y segunda mitad a la derecha en orden inverso. Las burbujas identifican entradas activas a nivel bajo. Las patillas NC permanecen sin función interna. No se añaden conexiones a tierra al insertar un integrado.

## Funcionamiento y límites

Hay que conectar la alimentación explícitamente: TTL a 4,75–5,25 V; CMOS a 3–18 V. El modelo de puertas conmuta a 1,4 V en TTL y a la mitad de la alimentación en CMOS. La zona entre VIL y VIH de un componente real no se representa como un tercer estado lógico. Las entradas utilizadas deben tener un nivel definido.

Los Schmitt conservan memoria entre umbrales: 0,9/1,7 V para 7414 y 30/70 % de VDD para 40106. Son valores funcionales aproximados; no se deben utilizar para dimensionar un circuito real ni extraer tolerancias de fabricante. El 4069 reproduce su función digital, no su comportamiento como amplificador analógico.

Los JK del 7476 cargan el maestro durante el nivel alto y transfieren al esclavo al bajar el reloj. Se exige mantener J/K estables durante ese nivel alto, como indica el fabricante. El 74112 muestrea en el flanco descendente y el 4027 en el ascendente. Los controles asíncronos tienen prioridad. La activación simultánea de SET y RESET en los JK fuerza ambas salidas altas y se identifica en la información del elemento; no es una condición válida para diseñar un circuito y su liberación simultánea no tiene un resultado físico garantizado. El estado inicial cero es una condición del simulador.

En el 4043, S domina si S=R=1; en el 4044, R domina si ambas entradas activas a nivel bajo están a cero, conforme a las tablas de TI. ENABLE=0 deja las salidas en alta impedancia, pero el latch sigue respondiendo a SET/RESET. Al habilitar de nuevo aparece el estado almacenado.

Las salidas usan etapas resistivas simplificadas de 200 Ω y fugas de 1 TΩ. Sin alimentación válida quedan en alta impedancia. No se modelan las corrientes máximas, el consumo real de cada familia, la carga de las entradas TTL, los diodos de protección, la temporización, la temperatura ni los daños por cortocircuito. La impedancia de salida simplificada no debe confundirse con la capacidad real de excitar un LED o una carga. Las memorias y la histéresis se conservan al exportar/importar XML.

## Fuentes de pinout y función

Hojas de datos del fabricante; las familias TTL y CMOS con una misma función no siempre comparten patillaje.

- [TI CD4073B/CD4081B/CD4082B](https://www.ti.com/lit/ds/symlink/cd4081b.pdf).
- [TI CD4011B/CD4012B/CD4023B](https://www.ti.com/lit/ds/symlink/cd4011b.pdf).
- [TI CD4071B](https://www.ti.com/lit/ds/symlink/cd4071b.pdf), [CD4001B](https://www.ti.com/lit/ds/symlink/cd4001b.pdf), [CD4070B](https://www.ti.com/lit/ds/symlink/cd4070b.pdf).
- [TI CD4069UB](https://www.ti.com/lit/ds/symlink/cd4069ub.pdf), [CD40106B](https://www.ti.com/lit/ds/symlink/cd40106b.pdf).
- [TI CD4043B/CD4044B](https://www.ti.com/lit/ds/symlink/cd4043b.pdf), [CD4027B](https://www.ti.com/lit/ds/symlink/cd4027b.pdf).
- [TI SN7476/SN74LS76A](https://www.ti.com/lit/gpn/SN5476), [SN74LS112A](https://www.ti.com/lit/ds/symlink/sn74ls112a.pdf).
- [TI SN7400](https://www.ti.com/lit/ds/symlink/sn7400.pdf), [SN74LS08](https://www.ti.com/lit/ds/symlink/sn74ls08.pdf), [SN7432](https://www.ti.com/lit/ds/symlink/sn7432.pdf), [SN7402](https://www.ti.com/lit/ds/symlink/sn7402.pdf), [SN7486/SN74LS86A](https://www.ti.com/lit/ds/symlink/sn74ls86a.pdf), [SN7420/SN74LS20](https://www.ti.com/lit/ds/symlink/sn74ls20.pdf), [SN7404](https://www.ti.com/lit/ds/symlink/sn7404.pdf), [SN7414](https://www.ti.com/lit/ds/symlink/sn7414.pdf).

## Validación

Pruebas numéricas de todas las combinaciones de entradas de cada puerta (328 casos), independencia de canales, histéresis, controles asíncronos, flancos y fase maestro-esclavo, prioridad RS, alta impedancia, alimentación y restauración del estado. Pruebas de navegador de las 24 referencias completas con alimentación de 5 V y cargas externas de 10 kΩ, verificando tensiones en cada salida y exportación/importación.
