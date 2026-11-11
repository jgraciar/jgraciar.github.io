# Registro maestro de pruebas de Circuit JGR 1.0

**Fecha de consolidación:** 11 de noviembre de 2026. **Proyecto de destino:** `jgraciar/jgraciar.github.io` (simulador autónomo, entrada `circuitjgr.html`). **Origen adicional:** `jgraciar/electrotecnia` (laboratorio docente anterior, **no modificar**).

## Objeto y reglas para retomarlo

Inventario recuperado de las conversaciones de los días 4–11 de noviembre de 2026 y contrastado con los archivos de pruebas y flujos de GitHub Actions de ambos repositorios. **Este archivo no acredita la ejecución de todos los ensayos ni certifica conformidad normativa o metrológica.** Sirve para continuar las pruebas posteriormente sin repetir la recopilación. Una prueba presente en el repositorio no se considera superada si no hay ejecución satisfactoria correspondiente al código que se pretende liberar.

- Mantener separados Circuit JGR, el laboratorio de electrotecnia, el generador didáctico ESP32 y la calculadora. No modificar ni eliminar prestaciones, circuitos de ejemplo, traducciones o archivos existentes como consecuencia de esta recopilación.
- Antes de trasladar pruebas, identificar dependencias de la web docente (`LabCircuit`, `#circuit-frame`, prácticas Paraninfo y servidor 8765). Reescribirlas para probar directamente `circuitjgr.html` y la API disponible, nunca copiarlas sin adaptar.
- Comparar magnitudes eléctricas con resultados analíticos y tolerancias explícitas; conservar evidencias de simulación, XML inicial/final, versión/commit y registros de navegador.
- Las características todavía **no implementadas** se consignan como pruebas futuras condicionadas al desarrollo; no deben evaluarse como fallos de funciones que no existen.

## 1. Evidencia comprobada hasta esta fecha

| Bloque | Evidencia | Alcance y límite |
|---|---|---|
| Publicación actual | [Actions 43056397301](https://github.com/jgraciar/jgraciar.github.io/actions/runs/43056397301), commit `4c1d866a26d269d233615279c215c9a9afb9ce07`, correcto | Compilación y publicación de Circuit JGR en Pages; no equivale por sí solo al plan completo. |
| Comprobación independiente de la web publicada | [Actions 43057541565](https://github.com/jgraciar/jgraciar.github.io/actions/runs/43057541565), **segundo intento satisfactorio** | El primer intento falló durante instalación de Chromium por DNS del servidor Ubuntu, sin llegar a las pruebas de la web. |
| Comprobaciones eléctricas e importación | 33/33, registradas en la compilación del 11-11 y [batería 42980065079](https://github.com/jgraciar/jgraciar.github.io/actions/runs/42980065079) | Ocho equivalencias Z, doce supuestos FV, 60 Hz, trifásica, vatímetro con armónicos, Aron/Wulflemm, seis TXT originales y tres rechazos seguros. Estos 33 casos no abarcan todos los escenarios del proyecto anterior. |
| Auditoría original Falstad | [Actions 42911144016](https://github.com/jgraciar/jgraciar.github.io/actions/runs/42911144016), [42911735479](https://github.com/jgraciar/jgraciar.github.io/actions/runs/42911735479) y [42979267327](https://github.com/jgraciar/jgraciar.github.io/actions/runs/42979267327), satisfactorias | 47 circuitos de muestra en Falstad y Circuit JGR, tres instantes por circuito, estructura y valores de todos los bornes/corrientes, tolerancia `1e-7 + 1e-6 * max(|a|,|b|)`, y dos comprobaciones de doble clic. 156 de los 157 modelos concretos originales permanecen idénticos; la excepción intencionada es el vatímetro. 147 órdenes de creación conservadas. No es un barrido exhaustivo ni asegura ausencia de diferencias tras cambios posteriores. |
| Contadores e integrados | Ejecución publicada [43056397301](https://github.com/jgraciar/jgraciar.github.io/actions/runs/43056397301) | 7493, cuatro JK, 74191, CD4026, relojes, resets, displays, arrastre, recarga XML; 42 modelos digitales genéricos y pruebas MSI. Verificar indirectamente el archivo `lab-digital-msi.test.mjs`, que no figura como comando directo en workflows. |
| Interfaz y localización | Ejecución publicada [43056397301](https://github.com/jgraciar/jgraciar.github.io/actions/runs/43056397301) | Pruebas automatizadas actuales de menús, opciones, edición, formatos regionales, paneles de circuitos, osciloscopios y etiquetas; **no** equivale a revisión lingüística manual de los 22 idiomas. |

Fuentes internas adicionales: [docs/project-validation.md](https://github.com/jgraciar/jgraciar.github.io/blob/main/docs/project-validation.md), [docs/falstad-compatibility.md](https://github.com/jgraciar/jgraciar.github.io/blob/main/docs/falstad-compatibility.md), [docs/digital-ics.md](https://github.com/jgraciar/jgraciar.github.io/blob/main/docs/digital-ics.md), [docs/counters.md](https://github.com/jgraciar/jgraciar.github.io/blob/main/docs/counters.md).

## 2. Matriz completa de trabajo, sin ejecutar ahora

**A. Estabilidad numérica y prestaciones del solucionador — PENDIENTE de completar**

- Recuperar y adaptar `lab-robustness.test.mjs`: rechazar `NaN`, `Infinity`, `-Infinity`, parámetros no físicos, ventanas/muestras insuficientes y órdenes armónicos inválidos; aceptar tensiones positivas, negativas y cero; corriente nula y continua pura; comprobar THD nula o indefinida según corresponda, RMS y fundamental de senos con amplitudes diferentes.
- Rectificador monofásico con filtro C: repetir las cuatro combinaciones **R/C** del ensayo antiguo (100 Ω/100 µF, 200 Ω/2 mF, 1 kΩ/470 µF, 50 Ω/10 µF), comprobar importación, dos bornes, paso de tiempo efectivo, intensidades finitas, `|P|≤S`, `|FP|≤1`, exportación y reinicializaciones sucesivas en el **solver real**.
- Contrastar la prueba actual de convergencia de **10 V RMS, 50 Hz, 80 periodos y 1.000/2.000 pasos** con el ensayo adicional acordado de **230 V, 50 Hz y 30/80 periodos**; comprobar permanencia de régimen, error al reducir el paso, energía, potencias, picos y THD con muestreo uniforme. No afirmar que la prueba a 10 V sustituye a la de 230 V.
- Ensayos de estrés con cambios sucesivos de elementos, elementos desconectados, parámetros extremos, interrupciones de simulación, reinicio, exportación/importación repetida y comprobación de errores JS o bloqueos. Documentar límites reales antes de añadir casos.
- Resonancia **paralelo** de red R-L con banco C e inyección de 5.º armónico en el motor completo: comparar `I5`, `U5`, `Z5`, THD, `P/Q₁/S/FP/D*` con cálculo fasorial y transitorio. Las referencias analíticas actuales no bastan para validar ese régimen en el solver.

**B. Medidas y circuitos eléctricos — PARCIALMENTE VERIFICADO**

- Wattmeter: continua y alterna resistiva/inductiva/capacitiva, Aron, lectura **P**, `Q₁`, `S`, instantánea `p(t)`, pico, RMS y media; verificar conceptos de potencia media frente a potencia instantánea y presentación de unidades (W, VAr, VA). En CC evitar magnitudes que no proceden. Contrastar signos por inversión de conexiones.
- Armónicos: cosφ fundamental frente a FP real (`P/S`), THD de tensión/corriente, quinto armónico con potencia positiva y negativa, rectificación de media onda, cancelación y superposición de armónicos, `D*` residual, escalado por número de equipos, balances `S²=P²+Q₁²+D*²` cuando corresponda. Algunos casos analíticos ya pasan; comprobar versiones y cobertura.
- Cargas R-L/C y compensación: sumar ramas, no sumar aparente escalar como si fuera aditiva, medir corriente de red y desfase, efecto de banco de condensadores sobre `Q₁`, FP y THD. Incluir tensión armónica aplicada a un condensador: `I_h=hωCU_h`.
- Impedancia `Z`: equivalencias R, L, C, combinaciones serie/paralelo y resonancia, módulo-argumento frente a R±jX, actualización al cambiar frecuencia, red de 50 y 60 Hz, limitación de uso en CC, persistencia XML, errores y decimales. **Parámetros distribuidos R′/L′/C′, longitud y modelo π** son mejoras futuras mientras no se implementen.
- FV e inversores: modo aislado y conectado a red, sincronismo de frecuencia/fase, corriente y sentido de P, 0/50/100/150 % de demanda, fuente ideal y posterior red no ideal, límites de potencia y aparente. Modelos sin PLL dinámico, MPPT, antiisla ni PWM no deben recibir certificaciones de esas prestaciones.
- Rectificador de seis pulsos, LEDs y fuentes informáticas sin PFC: formas de onda, factor de potencia, valor por unidad y multiplicador de unidades, picos finitos, configuración propia y reimportación. Contrastar con las pruebas de navegador vigentes.

**C. Autoconsumo FV y baterías de condensadores — PENDIENTE de recuperar el conjunto histórico**

- Recuperar modelos de balance `P/Q` en el punto común de conexión, ley de Kirchhoff, corriente de acometida, red con importación/exportación y generación FV inferior/igual/superior a la demanda.
- Recuperar **ocho** combinaciones eléctricas de interruptores de una batería con **tres escalones**; corrientes RMS de cada condensador y red, P de la red, XML intacto después de cada maniobra.
- Recuperar el **regulador de escalones**: cosφ objetivo, potencia cercana a cero, bloqueo cuando hay exportación, conservación de contactores ya conectados, evitar compensación excesiva cuando así esté configurado, maniobras y selección discreta.
- Verificar funcionamiento de una instalación FV que alimenta carga con batería preexistente: posible absorción/cesión de reactiva, corriente de red aunque `P_red=0`, sobrecompensación con producción FV, producción reactiva del inversor.
- Recuperar el catálogo de supuestos: **vivienda, comercio, terciario e industria**, monofásicos y trifásicos, autoconsumo con/sin excedentes, compensación reactiva, instalación equilibrada o desequilibrada, corrientes de neutro, exportación simultánea por unas fases e importación por otras. Distinguir los casos pedagógicos de la certificación de antivertido o cumplimiento real.
- Recuperar los XML de galerías: **7 circuitos monofásicos con 7 vatímetros, 7 trifásicos con 21 vatímetros, y galería agrupada con 28 vatímetros y 14 paneles**. Adaptar la lectura de cada vatímetro al simulador autónomo. No crear artificialmente una nueva interfaz de prácticas.
- Recuperar pruebas sobre instalaciones comerciales trifásicas, bancos en triángulo y contactores, así como detección de uniones accidentales de conductores en fixtures.
- Las referencias normativas de los escenarios docentes son contexto para interpretar hipótesis, no constituyen por sí mismas un ensayo legal de conformidad.

**D. Compatibilidad, importación, exportación, preservación — PARCIALMENTE VERIFICADO**

- Mantener la auditoría de la **base exacta 5.0.5ts** (`8d694e2ce2657b53a94a81b4816e3d19dcb645b5`), archivos originales, 157 modelos, método de edición, menús y comandos. Contrastar 47 circuitos en 3 instantes y añadir escenarios/escalas cuando cambie el motor.
- Expandir corpus TXT/XML de Falstad/Wulflemm: fuentes, bobinas, transformadores, motores, electrónica de potencia, circuitos digitales, referencias, coordenadas, nombres de terminales, signos, opciones, osciloscopios y estado; guardar listas exactas de componentes admitidos y no admitidos. No prometer compatibilidad universal.
- Rechazo seguro de archivo XML malformado, tipo desconocido en XML/TXT o componente externo no reconocido sin borrar parcialmente el circuito abierto; verificar advertencias en el idioma seleccionado.
- Exportar/importar circuitos con todas las clases propias (Z, PV, vatímetro, cargas no lineales, digitales, contadores) y con editor abierto. Comprobar señales y parámetros, además de estructura.
- Mantener el doble clic como **Edición** y la ficha informativa como opción contextual, sin perder opciones originales de Delete/Undo ni la asignación de señales a osciloscopios. Comprobar integridad de los menús originales.
- Las utilidades de importación específicas de la web docente (Wulflemm UI incrustada, puente `LabCircuit`, pruebas Paraninfo) quedan fuera **salvo** la lógica de formatos que se use realmente en Circuit JGR.

**E. Electrónica digital y ejemplos — PARCIALMENTE VERIFICADO**

- Barrer tablas de verdad, alimentación 5 V TTL y rango CMOS, entradas definidas, patillas DIP y NC, RESET/PRESET asíncronos y prioridad, estados Hi-Z, RS, Schmitt e histéresis, registros/latch/RAM, contadores BCD, 7447, 74181 y conexiones a LED con resistencia. Evitar añadir tierra salvo retorno necesario.
- Repetir `CD4026`: pulsos manuales y rebote, cuenta 9→0, reset, segmentos y XML; `7493`: CK1/CK2, división 2/8, realimentación, 0–15 y reset; `74191`: subida/bajada, carga y habilitación; equivalencias con JK/T.
- Montaje combinado 7493 arriba + cuatro JK abajo: mismo reloj, alimentación 5 V, interruptores J=K y reset, salidas QA…QD existentes, lectura decimal, displays de siete segmentos 0–F, coincidencia de cuentas y osciloscopios. Validar además la separación de los montajes inferiores de 1 y 3 bits con sus propios relojes y resets.
- Arrastre del cuerpo sin perder cables, recuperación del estado tras XML, errores de renderizado al abrir ejemplos y funcionamiento de todas las referencias en fichas informativas.

**F. Interfaz, accesibilidad, regionalización e idiomas — PARCIALMENTE VERIFICADO**

- Idioma inicial automático según navegador/sistema (con español por defecto si no se detecta) y selección manual de **22 idiomas**; auditoría de traducciones de menús, submenús, diálogo Editar, opciones, deslizadores, osciloscopios, Acerca de, importación, mensajes de error y elementos propios. Revisiones lingüísticas **manuales**: español, valenciano/catalán independientes, gallego, euskera y resto de catálogos disponibles.
- Formato regional coma/punto, miles, precisión, eliminación de ceros decimales no significativos, prefijos SI, notación científica, lectura RMS y estado persistente de opciones. La configuración de presentación no altera el cálculo interno.
- Cambio fondo claro/oscuro: paleta de circuitos legible, área del osciloscopio blanca con ejes/divisiones visibles, restauración de colores originales en negro, visualización y colores de trazas y controles.
- Osciloscopios a ancho disponible sin reservar un lateral excesivo para tiempos; escalas en esquina superior derecha con **V** (vertical) y **H** (horizontal), unidades por división, cambios dinámicos, autoescala vertical al máximo, exportación de opciones; probar acoplados y flotantes, varias señales y modalidades de magnitudes.
- Ficha de integrados: patillaje, conexiones internas, comportamiento eléctrico y tensiones en directo, escala y cierre; pruebas de escritorio y móvil.
- Portada `index.html`, `circuitjgr.html`, menús y enlaces, capacidad de abrir ejemplos, condiciones de reinicio y almacenamiento local. Conservar créditos/licencias y no confundir Circuits JGR con el laboratorio.

**G. Cargas de estrés generales y regresión futura — POR PLANIFICAR DETALLES**

- Ciclos largos, muchos componentes, repetición rápida de interruptores, grandes osciloscopios, varios displays y carga simultánea; medir CPU/memoria y avance real de tiempo sin presuponer umbrales.
- Ciclos repetidos abrir/importar/exportar/guardar, circuitos grandes, cambio de idioma, formato, tema, zoom y tamaño, modos de selección; buscar bloqueos, errores no controlados y datos perdidos.
- Repetición completa tras cualquier actualización del código base, del solver, de serialización, del sistema de menús o de la gestión de osciloscopios.

## 3. Inventario literal de archivos de pruebas (sin omisiones)

Consulta automática del 11-11-2026: **41 archivos de prueba** en el repositorio autónomo y **58** en el laboratorio anterior; **14 nombres compartidos**, **44 solo en el antiguo** y **27 solo en el autónomo**. La coincidencia de nombre **no demuestra** que las versiones de las pruebas sean idénticas.

### 3.1 Archivos existentes en Circuit JGR (41)

- [`audit-falstad-source.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/audit-falstad-source.mjs)
- [`calculadora-decimales.test.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/calculadora-decimales.test.mjs)
- [`calculadora-ejemplos.test.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/calculadora-ejemplos.test.mjs)
- [`compare-falstad-live.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/compare-falstad-live.mjs)
- [`ic-info.test.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/ic-info.test.mjs)
- [`lab-cd4026.test.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/lab-cd4026.test.mjs)
- [`lab-counters.test.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/lab-counters.test.mjs)
- [`lab-digital-ics.test.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/lab-digital-ics.test.mjs)
- [`lab-digital-msi.test.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/lab-digital-msi.test.mjs)
- [`lab-filtered-bridge-convergence.test.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/lab-filtered-bridge-convergence.test.mjs)
- [`lab-filtered-bridge-power.test.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/lab-filtered-bridge-power.test.mjs)
- [`lab-filtered-bridge.test.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/lab-filtered-bridge.test.mjs)
- [`lab-harmonics.test.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/lab-harmonics.test.mjs)
- [`lab-impedance.test.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/lab-impedance.test.mjs)
- [`lab-nonlinear-load.test.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/lab-nonlinear-load.test.mjs)
- [`lab-power-factor-rectifier.test.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/lab-power-factor-rectifier.test.mjs)
- [`lab-power-measurement.test.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/lab-power-measurement.test.mjs)
- [`lab-pv-catalog-inverter.test.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/lab-pv-catalog-inverter.test.mjs)
- [`lab-pv-current-display.test.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/lab-pv-current-display.test.mjs)
- [`lab-pv-inverter.test.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/lab-pv-inverter.test.mjs)
- [`lab-resonance-transient.test.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/lab-resonance-transient.test.mjs)
- [`verify-about-and-draw-locales.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/verify-about-and-draw-locales.mjs)
- [`verify-cd4026-ui.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/verify-cd4026-ui.mjs)
- [`verify-circuitjgr-elements.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/verify-circuitjgr-elements.mjs)
- [`verify-circuits-jgr-root.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/verify-circuits-jgr-root.mjs)
- [`verify-counters-ui.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/verify-counters-ui.mjs)
- [`verify-digital-ics-ui.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/verify-digital-ics-ui.mjs)
- [`verify-edit-dialog-titles.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/verify-edit-dialog-titles.mjs)
- [`verify-edit-regional-numbers.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/verify-edit-regional-numbers.mjs)
- [`verify-edit-regional-ui.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/verify-edit-regional-ui.mjs)
- [`verify-ic-info-ui.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/verify-ic-info-ui.mjs)
- [`verify-light-palette-ui.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/verify-light-palette-ui.mjs)
- [`verify-live-settings-ui.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/verify-live-settings-ui.mjs)
- [`verify-nonlinear-presets-ui.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/verify-nonlinear-presets-ui.mjs)
- [`verify-nonlinear-presets.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/verify-nonlinear-presets.mjs)
- [`verify-nonlinear-units-ui.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/verify-nonlinear-units-ui.mjs)
- [`verify-project-pending.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/verify-project-pending.mjs)
- [`verify-six-pulse-static.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/verify-six-pulse-static.mjs)
- [`verify-six-pulse-ui.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/verify-six-pulse-ui.mjs)
- [`verify-upstream-505-ui.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/verify-upstream-505-ui.mjs)
- [`verify-wattmeter-ui.mjs`](https://github.com/jgraciar/jgraciar.github.io/blob/main/tests/verify-wattmeter-ui.mjs)

### 3.2 Archivos del laboratorio anterior que no están en Circuit JGR (44)

**No equivale a 44 pruebas obligatorias sin ejecutar.** Clasificar uno a uno: reutilizar lógica del motor, adaptar dependencia del laboratorio o excluir como exclusiva de web/prácticas.

- [`aron-power.test.js`](https://github.com/jgraciar/electrotecnia/blob/main/tests/aron-power.test.js)
- [`audit-valencian-upstream.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/audit-valencian-upstream.mjs)
- [`bridge-import-inspection.test.js`](https://github.com/jgraciar/electrotecnia/blob/main/tests/bridge-import-inspection.test.js)
- [`check-pv-fixture-junctions.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/check-pv-fixture-junctions.mjs)
- [`lab-localizations.test.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/lab-localizations.test.mjs)
- [`lab-pv-capacitor-bank.test.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/lab-pv-capacitor-bank.test.mjs)
- [`lab-pv-capacitor-contactors.test.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/lab-pv-capacitor-contactors.test.mjs)
- [`lab-pv-capacitor-controller.test.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/lab-pv-capacitor-controller.test.mjs)
- [`lab-pv-commercial-installations.test.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/lab-pv-commercial-installations.test.mjs)
- [`lab-pv-grid-balance.test.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/lab-pv-grid-balance.test.mjs)
- [`lab-pv-kirchhoff.test.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/lab-pv-kirchhoff.test.mjs)
- [`lab-pv-regulator-integration.test.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/lab-pv-regulator-integration.test.mjs)
- [`lab-pv-sector-autoconsumption.test.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/lab-pv-sector-autoconsumption.test.mjs)
- [`lab-pv-three-phase-unbalanced.test.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/lab-pv-three-phase-unbalanced.test.mjs)
- [`lab-robustness.test.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/lab-robustness.test.mjs)
- [`probe-wulflemm-external.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/probe-wulflemm-external.mjs)
- [`verify-catalan-complete.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/verify-catalan-complete.mjs)
- [`verify-circuitjs-initial-settings.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/verify-circuitjs-initial-settings.mjs)
- [`verify-dropbox-locale.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/verify-dropbox-locale.mjs)
- [`verify-filtered-bridge.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/verify-filtered-bridge.mjs)
- [`verify-impedance.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/verify-impedance.mjs)
- [`verify-in-falstad.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/verify-in-falstad.mjs)
- [`verify-interface-menu-coverage.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/verify-interface-menu-coverage.mjs)
- [`verify-lab-locales.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/verify-lab-locales.mjs)
- [`verify-paraninfo.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/verify-paraninfo.mjs)
- [`verify-pv-capacitor-switches.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/verify-pv-capacitor-switches.mjs)
- [`verify-pv-commercial-delta-bank.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/verify-pv-commercial-delta-bank.mjs)
- [`verify-pv-commercial-single-phase.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/verify-pv-commercial-single-phase.mjs)
- [`verify-pv-inverter-modes.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/verify-pv-inverter-modes.mjs)
- [`verify-pv-inverter.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/verify-pv-inverter.mjs)
- [`verify-pv-three-phase-unbalanced.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/verify-pv-three-phase-unbalanced.mjs)
- [`verify-pv-unconnected.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/verify-pv-unconnected.mjs)
- [`verify-pv-visual-gallery.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/verify-pv-visual-gallery.mjs)
- [`verify-russian-interface.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/verify-russian-interface.mjs)
- [`verify-scope-options-translations.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/verify-scope-options-translations.mjs)
- [`verify-slider-dialog-locale.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/verify-slider-dialog-locale.mjs)
- [`verify-spanish-interface.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/verify-spanish-interface.mjs)
- [`verify-valencian-complete.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/verify-valencian-complete.mjs)
- [`verify-wattmeter-inbound.mjs`](https://github.com/jgraciar/electrotecnia/blob/main/tests/verify-wattmeter-inbound.mjs)
- [`wattmeter-average.test.js`](https://github.com/jgraciar/electrotecnia/blob/main/tests/wattmeter-average.test.js)
- [`wulflemm-structure.test.js`](https://github.com/jgraciar/electrotecnia/blob/main/tests/wulflemm-structure.test.js)
- [`wulflemm-ui-deferred.test.js`](https://github.com/jgraciar/electrotecnia/blob/main/tests/wulflemm-ui-deferred.test.js)
- [`wulflemm-xml-diagnostics.test.js`](https://github.com/jgraciar/electrotecnia/blob/main/tests/wulflemm-xml-diagnostics.test.js)
- [`wulflemm-xml-roundtrip.test.js`](https://github.com/jgraciar/electrotecnia/blob/main/tests/wulflemm-xml-roundtrip.test.js)

### 3.3 Nombres comunes a ambos repositorios (14)

`lab-filtered-bridge-convergence.test.mjs`, `lab-filtered-bridge-power.test.mjs`, `lab-filtered-bridge.test.mjs`, `lab-harmonics.test.mjs`, `lab-impedance.test.mjs`, `lab-nonlinear-load.test.mjs`, `lab-power-factor-rectifier.test.mjs`, `lab-power-measurement.test.mjs`, `lab-pv-catalog-inverter.test.mjs`, `lab-pv-current-display.test.mjs`, `lab-pv-inverter.test.mjs`, `verify-about-and-draw-locales.mjs`, `verify-edit-dialog-titles.mjs`, `verify-edit-regional-numbers.mjs`.

### 3.4 Componentes de CI, casos y resultados que requieren confirmación al reanudar

En el workflow principal `pages.yml` se ejecutan pruebas numéricas, preparación y localización, compilación y pruebas Chromium; `project-validation.yml` valida la web publicada; `falstad-compatibility.yml` compara con la web oficial. `lab-digital-msi.test.mjs` figura en el repositorio actual **sin invocación directa** desde los workflows revisados: comprobar si `lab-digital-ics.test.mjs` lo importa y, si no, incorporarlo expresamente. Los archivos del laboratorio anterior no se deben ejecutar sobre la URL del laboratorio como sustituto de una comprobación del simulador autónomo.

## 4. Orden de ejecución acordado para una sesión posterior

1. **Congelar alcance y versión**: anotar SHA de `main`, commit oficial base y dependencias. Registrar la referencia de cada fixture y su fuente.
2. **Hacer matriz de trazabilidad** por archivo/caso: código de prueba, característica, entradas, referencia analítica, tolerancia, entorno (modelo puro, navegador local o web publicada), resultado y evidencia. Distinguir casos existentes de pruebas que necesitan implementación.
3. **Recuperar robustez y estrés numérico**: comenzar por `lab-robustness` y por R/C de rectificador; ampliar ensayos eléctricos de régimen de 230 V sin tocar prestaciones ya correctas.
4. **Recuperar autoconsumo y condensadores**: modelos analíticos, ocho combinaciones, regulador, desequilibrios, galería de 14 escenarios/28 vatímetros, y casos de resonancia. Adaptar todos al simulador independiente.
5. **Repetir compatibilidad y regresión Falstad**, ampliar corpus externo, pruebas de XML, electrónica digital y 22 idiomas. Verificar en el navegador publicado y pruebas visuales.
6. **Informe final de resultados**: por cada grupo indicar aprobado/fallido/no ejecutado/no aplicable, error concreto, commit, workflow/job, log y comparación de magnitudes. Guardar artefacto JSON o CSV y un resumen Markdown, sin cambiar estados por intuición.
7. Publicar correcciones **solo cuando se justifiquen mediante un fallo reproducible**, conservando archivos y funciones existentes. Reejecutar los bloques relacionados y la batería completa.

**Criterio de cierre:** ninguna prueba planeada pertinente para la versión considerada queda sin resultado justificado; los fallos reales están corregidos o quedan descritos y aceptados explícitamente. Los supuestos sobre prestaciones aún no implementadas no se cuentan como ensayos superados. No confundir un despliegue correcto ni 33/33 casos con la batería general completa.

## 5. Fuentes y puntos de reanudación

- [Repositorio y simulador](https://github.com/jgraciar/jgraciar.github.io) · [Circuit JGR publicado](https://jgraciar.github.io/circuitjgr.html).
- [Batería actual en `tests/`](https://github.com/jgraciar/jgraciar.github.io/tree/main/tests) · [workflows del simulador](https://github.com/jgraciar/jgraciar.github.io/tree/main/.github/workflows).
- [Batería histórica del laboratorio](https://github.com/jgraciar/electrotecnia/tree/main/tests) · [workflow histórico](https://github.com/jgraciar/electrotecnia/blob/main/.github/workflows/deploy.yml).
- [Auditoría Falstad 10 de noviembre](https://github.com/jgraciar/jgraciar.github.io/actions/runs/42911735479) · [comparación posterior de 47 ejemplos](https://github.com/jgraciar/jgraciar.github.io/actions/runs/42979267327).
- [Compilación y publicación más recientes verificadas](https://github.com/jgraciar/jgraciar.github.io/actions/runs/43056397301) · [verificación independiente sobre web publicada](https://github.com/jgraciar/jgraciar.github.io/actions/runs/43057541565).
- [Documento de casos eléctricos actuales](https://github.com/jgraciar/jgraciar.github.io/blob/main/docs/project-validation.md) · [documento de compatibilidad](https://github.com/jgraciar/jgraciar.github.io/blob/main/docs/falstad-compatibility.md).

**Al reanudar:** consultar primero este documento y los resultados actuales de Actions, **no** volver a reconstruir la batería de memoria ni comenzar por modificar el simulador. Este inventario se puede ampliar sin quitar contenido existente.
