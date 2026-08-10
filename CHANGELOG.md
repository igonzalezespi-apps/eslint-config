# Changelog

Todas las versiones publicadas de `@studio/eslint-config`.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el versionado es
[SemVer](https://semver.org/lang/es/). **Aquí «breaking» significa que el lint de un consumidor
puede pasar de verde a rojo sin que él toque una línea** — es el criterio que importa en un repo
cuyo producto es un conjunto de reglas.

El histórico anterior a `0.2.3` se ha reconstruido a partir de los commits y los tags: este
fichero se sembró el 2026-08-09, cuando se automatizaron los releases.

## [0.2.3] — 2026-08-09

Release **de metadatos: no cambia ninguna regla.** `v0.2.2` y `v0.2.3` exportan exactamente el
mismo preset, así que un consumidor que se quede en `v0.2.2` no se pierde nada funcional.

### Corregido

- **El `version` de `package.json` vuelve a decir la verdad.** El tag `v0.2.2` se cortó a mano en
  la punta de `main` *antes* de que mergease su PR de bump, así que el commit publicado como
  `0.2.2` lleva dentro `"version": "0.2.1"`.

  No se movió el tag, y la razón importa: los tags son inmutables por contrato, `v0.2.2` ya está
  en el lockfile de un consumidor **por SHA**, y moverlo habría dado dos contenidos con el mismo
  nombre sin llegar siquiera a ese consumidor —que resuelve el commit, no la etiqueta—. Cortar
  `0.2.3` cuesta un número de versión y no rompe nada.

### Interno

- **`tag-version-match`** ([#42]): un workflow que dispara al empujar un tag `v*` y falla si el
  `version` del commit etiquetado no coincide con la etiqueta.

  Al auditar el histórico con `scripts/check-tag-version.sh --all` aparecieron **tres** tags con
  el defecto, no uno: `v0.1.1` y `v0.1.2` (los dos dicen `0.1.0`) además de `v0.2.2`. Era un
  hábito, no un desliz de un día.

  Es una **alarma, no una barrera**: cuando el workflow corre, el tag ya existe. Lo que lo
  *previene* es cortar el tag desde el propio commit del bump — el trabajo del release
  automático, todavía sin montar aquí.

## [0.2.2] — 2026-08-09

> ⚠️ **El commit etiquetado `v0.2.2` declara `"version": "0.2.1"`.** Ver `0.2.3`, que existe
> justo para eso. El contenido de las reglas sí es el que describe esta entrada.

### Corregido

- **`jsdoc/require-param` ahora lleva también `checkDestructuredRoots: false`** — la otra mitad de
  la cura que ya llevaba `checkDestructured: false` ([#40]).

  `checkDestructured: false` impide que la regla exija las *propiedades* desestructuradas, pero el
  parámetro **raíz** se seguía pidiendo, así que el fixer insertaba un `@param root0` pelado: una
  etiqueta que no documenta nada, porque las props ya las tipa TypeScript.

  Medido en un consumidor privado contra `v0.2.1`: al retirar su override local, `eslint --fix`
  quedaba en **0 errores y era idempotente** —parecía curado— pero reescribía **20 componentes** e
  inyectaba **30 `@param root0` vacíos**. Cero errores más idempotencia no es lo mismo que
  correcto: una salida *estable y equivocada* es justo lo que ninguna de esas dos propiedades
  puede ver.

  Relaja una regla, no la endurece: ningún consumidor pasa de verde a rojo.

### Interno

- `require-semver-label` en las PRs a `main`, con `branches: [main]` y `runs-on: ubuntu-latest`
  fijo ([#41]). No afecta al preset.

## [0.2.1] — 2026-08-04

### Corregido

- `sonarjs/publicly-writable-directories` excluido en los tests ([#39]): la regla marcaba los
  `mkdtemp` legítimos de la propia suite.

## [0.2.0] — 2026-08-04

### Añadido

- **Los cinco detectores de secretos, encendidos** ([#37]). Estaban apagados bajo un comentario
  que decía que solapaban con `eslint-plugin-security`; para esas cinco reglas era **falso**.
  Cazaron un secreto real en un consumidor.

### Corregido

- `jsdoc/check-param-names` con `checkDestructured: false` ([#35]). Sin él, `eslint --fix` se
  contradecía en el patrón React `function C({ a, b }: Props)`: `require-param` insertaba
  `@param root0` y `check-param-names` (un **error**) exigía entonces `@param root0.a`, que ningún
  fixer escribe nunca. El resultado era un hook de fix-on-commit **imposible de pasar**.
- `sonarjs/no-redundant-optional` apagado ([#24]): contradecía al preset de TypeScript.

## [0.1.2] — 2026-08-02

Mantenimiento de dependencias y ajustes de configuración del propio repo.

> ⚠️ El commit etiquetado `v0.1.2` declara `"version": "0.1.0"`.

## [0.1.1] — 2026-06-04

Primera versión etiquetada.

> ⚠️ El commit etiquetado `v0.1.1` declara `"version": "0.1.0"`.

[0.2.3]: https://github.com/igonzalezespi/eslint-config/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/igonzalezespi/eslint-config/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/igonzalezespi/eslint-config/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/igonzalezespi/eslint-config/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/igonzalezespi/eslint-config/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/igonzalezespi/eslint-config/releases/tag/v0.1.1
[#24]: https://github.com/igonzalezespi/eslint-config/pull/24
[#35]: https://github.com/igonzalezespi/eslint-config/pull/35
[#37]: https://github.com/igonzalezespi/eslint-config/pull/37
[#39]: https://github.com/igonzalezespi/eslint-config/pull/39
[#40]: https://github.com/igonzalezespi/eslint-config/pull/40
[#41]: https://github.com/igonzalezespi/eslint-config/pull/41
[#42]: https://github.com/igonzalezespi/eslint-config/pull/42
