---
paths:
  - '*.mjs'
  - '__tests__/**'
  - 'package.json'
  - 'pnpm-lock.yaml'
---

# The presets and their tests

- `base.mjs`, `next.mjs` and `expo.mjs` are the package's `exports`. Adding or removing a rule, or
  tightening one, is a breaking change for every consumer: prefer additive, opt-in changes, and
  escalate a breaking one to the maintainer.
- **The tests are the contract.** `__tests__/` (vitest) pins the exported rules and their options.
  Change a preset and its test together, then run `pnpm exec tsc --noEmit` and `pnpm test` (what
  CI runs, after `pnpm install --frozen-lockfile`).
- The ESLint plugins the presets import are `dependencies`, so a git install resolves them;
  `eslint` is a `peerDependency`, pinned by each consumer.
- A release tag must match `version` in `package.json` (`tag-version-match` checks it).
