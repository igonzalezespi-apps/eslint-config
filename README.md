# @studio/eslint-config

The studio's shared **ESLint flat config**, consumed by **git reference** (the
`renovate-config` pattern — no npm publishing, no tokens). One package at the
repo root, three named presets.

## Presets

| Export | Preset | Built on |
| --- | --- | --- |
| `@studio/eslint-config/base` | `base` | `@eslint/js` recommended + `typescript-eslint` recommended + `eslint-plugin-security` + `eslint-plugin-sonarjs` + `eslint-plugin-jsdoc` + `eslint-config-prettier` |
| `@studio/eslint-config/next` | `next` | the `base` preset (add `eslint-config-next` in the app when needed) |
| `@studio/eslint-config/expo` | `expo` | `eslint-config-expo` (flat) + `eslint-config-prettier` |

The `base` preset is the richest correct base: JS + TypeScript recommended,
security and SonarJS static analysis, JSDoc checks on exported declarations, and
Prettier last (so Prettier owns all formatting). It carries **no repo-specific
boundary policy** — workspace-alias rules, `internal/`-module restrictions, and
similar `no-restricted-imports` blocks belong to each consuming repo, which
composes them on top of this base.

`expo` deliberately does **not** spread `base`: `eslint-config-expo` already
registers the typescript-eslint / react / react-native plugins, and spreading
`base` on top would trigger ESLint's "plugin redefined" conflict.

## Consume it

This repo is **not published to npm**. Depend on it by git tag:

```jsonc
// package.json
{
  "devDependencies": {
    "@studio/eslint-config": "github:igonzalezespi-apps/eslint-config#v0.1.3"
  }
}
```

The ESLint plugins the presets `import` are declared as `dependencies`, so a git
install resolves them automatically. `eslint` and `typescript-eslint` are
**peer dependencies** — your project pins the versions that match its toolchain
(the config supports `eslint >= 9`; it is developed and tested on ESLint 10).

### `base` — Node / library / monorepo packages

```js
// eslint.config.mjs
import base from '@studio/eslint-config/base';

export default [
  { ignores: ['**/__fixtures__/**'] },
  ...base
  // ...your repo-specific boundary rules here
];
```

### `next` — Next.js apps

```js
// eslint.config.mjs
import next from '@studio/eslint-config/next';

export default [...next];
```

### `expo` — Expo / React-Native apps

```js
// eslint.config.mjs
import expo from '@studio/eslint-config/expo';

export default [
  { ignores: ['.expo/**', 'android/**', 'ios/**'] },
  ...expo
];
```

## Studio context

This package is part of the studio's **homogenize-projects** effort: shared
config lives in small public repos consumed by git reference, so every studio
project lints against one source of truth instead of drifting per-repo copies.
It merges the previously-separate base config (the richer ESLint 10 base:
security + sonarjs + jsdoc, with rule-tester tests) and the `aca` config (the
`expo` preset). The companion
[`@studio/tsconfig`](https://github.com/igonzalezespi-apps/tsconfig) does the same for
TypeScript compiler options.

Consumer migration of the product repos onto this package is a separate,
verification-heavy step and is intentionally **not** part of v0.1.0.

## Develop

```bash
pnpm install
pnpm test   # vitest — cjs-globals regression pin + core-rule behavior + helper unit tests
```

## License

MIT — see [LICENSE](./LICENSE). Public config, no secrets.
