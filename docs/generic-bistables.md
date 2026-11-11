# Biestables genéricos configurables y lectura de contadores

Los componentes genéricos JK, D y T incorporan un desplegable en sus propiedades con cuatro modos: flanco ascendente, flanco descendente, nivel alto y nivel bajo. El símbolo distingue cada configuración mediante triángulo de reloj y burbuja de inversión.

Se incorpora un componente RS genérico independiente con seis modos: asíncrono con S/R activas en alto, asíncrono con S/R activas en bajo, habilitación por nivel alto o bajo, y flancos ascendente o descendente. Los integrados comerciales no se alteran.

**Modelo didáctico:** en los modos de nivel, JK con J=K=1 y T con T=1 conmutan una vez por ventana activa. Un biestable real con realimentación puede presentar oscilación por carrera (race-around); el simulador no reproduce esa condición indeterminada. D y RS sí son transparentes durante el nivel de habilitación.

Los archivos .jgr y el XML almacenan la configuración como indicadores del componente. Se respetan los modos de circuitos anteriores: D y T por flanco ascendente, JK por flanco descendente salvo configuración anterior explícita de flanco ascendente.

Se añaden dos elementos:
- Convertidor de binario de cuatro bits a BCD: entradas I0..I3 y salidas U0..U3 (unidades) y D0..D3 (decenas), para valores 0–15.
- Lector numérico de siete segmentos: entradas a..g, lectura de 0 a 9; muestra una raya con un patrón no válido. No sustituye al display físico ni modela sus corrientes.

La publicación incluye pruebas de presencia, modos, símbolos, funcionamiento lógico y visualización, además de las anteriores de contadores e integrados digitales.
