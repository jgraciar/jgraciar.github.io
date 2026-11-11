# Comprobaciones pendientes recuperadas de los chats

Revisión del 11 de noviembre de 2026. Proyecto: Circuit JGR, separado del laboratorio docente y de los desarrollos físicos ESP32.

## Estado comprobado al iniciar la revisión

La ejecución publicada 42976639524 terminó correctamente. Confirma las regresiones numéricas de siete cargas armónicas en paralelo, superposición R-L/capacitiva/armónica, compensación reactiva y balance P/Q₁/S/D*. Las referencias fasoriales de resonancia y su reconstrucción temporal también pasan; esto no equivale a una comprobación transitoria de la resonancia en el solver completo.

El proyecto ya verifica en navegador perfiles de cargas no lineales, multiplicador por unidades, seis pulsos, componentes digitales, importación/exportación de elementos propios, menús, idiomas y doble clic. Los correos y mensajes antiguos de ejecuciones fallidas no sustituyen al resultado posterior confirmado.

## Batería adicional

`tests/verify-project-pending.mjs` contrasta la aplicación real mediante su API pública y cálculos independientes sobre las tensiones e intensidades resueltas:

- Ocho equivalencias Z ↔ componentes originales: R, RL, RC, RLC, L, C, resonancia serie y funcionamiento a 60 Hz. Compara las corrientes instantáneas y repite tras exportar e importar. En la bobina ideal sin resistencia se respeta el desplazamiento de continua debido a la condición inicial.
- Doce casos FV monofásicos: cargas R, RL y RL con compensación capacitiva; generación 0, 50 %, 100 % y 150 % de la potencia activa. Comprueba Kirchhoff, P de red, P FV, Q y persistencia XML.
- Seguimiento de red a 60 Hz con desfase inicial y un caso trifásico con tres inversores, selección de fase y consumo/excedentes simultáneos.
- Vatímetro en una instalación con rectificador filtrado e inversor FV. Contraste de P/Q₁/S, cosφ₁, FP, THD_I y D* con integración y análisis de Fourier independientes; persistencia de las opciones de medida.
- Importación y conservación de la estructura del fixture XML Aron/Wulflemm (179 elementos y dos vatímetros) y seis ejemplos TXT originales de Falstad.
- Rechazo de componente XML desconocido, tipo TXT desconocido y XML mal formado, conservando exactamente la exportación del circuito que estaba abierto.

El primer ensayo encontró una pérdida parcial del circuito al importar un componente desconocido. La corrección valida antes de vaciar el circuito o restablecer el contexto de edición, usa los registros reales de componentes admitidos y mantiene avisos en los 22 idiomas. No intenta simular componentes desconocidos ni anuncia compatibilidad universal.

La batería se ejecuta antes de publicar en el sitio de prueba y vuelve a ejecutarse contra la web publicada después de un despliegue correcto. Los resultados JSON se guardan como artefacto `project-checks` del flujo `project-validation.yml`.

## Alcance todavía pendiente

- Importación externa de todas las familias de componentes, variantes de archivos y bibliotecas de subcircuitos. La cobertura actual se limita a los ejemplos y formatos probados; no se exige que Falstad abra nuestros tipos propios sin descomponerlos.
- Ensayo de resonancia paralelo con inyección armónica y batería de condensadores en el solver completo; las referencias analíticas existentes están comprobadas.
- Pruebas FV con red no ideal, desequilibrios más generales y combinaciones trifásicas de cargas no lineales y compensación. El inversor actual no incorpora PLL dinámico, MPPT, antiisla ni modelo PWM.
- Revisión técnica manual de las traducciones. Integridad de los 22 catálogos no significa validación lingüística integral de cada explicación.

La Z avanzada con parámetros por longitud/modelo π, el variador con inversor y motor y la regulación automática de condensadores son funciones pendientes, no comprobaciones que puedan darse por superadas sobre un modelo ya disponible.
