# Circuit JGR 1.0

Sitio web personal de [Circuit JGR](https://jgraciar.github.io/circuitjgr.html), simulador de circuitos eléctricos y electrónicos desarrollado y adaptado por Jesús Gracia Ruiz (2026).

La portada, en `https://jgraciar.github.io/`, ofrece acceso a:
- **Circuit JGR 1.0:** `/circuitjgr.html`.
- **Laboratorio de Electrotecnia:** `/electrotecnia/`, publicado desde el repositorio [jgraciar/electrotecnia](https://github.com/jgraciar/electrotecnia).

El simulador está basado en CircuitJS1, de Paul Falstad, Iain Sharp y colaboradores. Se conservan sus atribuciones y condiciones de licencia; las adaptaciones propias se distribuyen bajo GNU GPLv3.

El código fuente de **Circuit JGR 1.0** está en este mismo repositorio, dentro de `scripts/`, `tests/` e `initial-settings.js`. GitHub Actions lo compila mediante `.github/workflows/pages.yml`, utilizando CircuitJS1 como base externa. El Laboratorio de Electrotecnia permanece en su propio repositorio `jgraciar/electrotecnia`, sin dependencia de compilación ni enlace de código fuente desde Circuit JGR.
