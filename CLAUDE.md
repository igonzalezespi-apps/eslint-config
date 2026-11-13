# eslint-config

Shared **ESLint flat configs** (`base.mjs`, `next.mjs`, `expo.mjs`) for the maintainer's repos.
Public (MIT). Consumers install it as a git dependency pinned by tag
(`github:igonzalezespi-apps/eslint-config#vX.Y.Z`).

## Rules

- **This repo is public: nothing names a private project** — not code, tests, docs, comments,
  commits, PRs, issues or comments on them. The `.githooks/` hooks check files and commit
  messages against a private list kept on the maintainer's machine (fail closed there, no-op on
  a fork). Enable them per clone: `git config core.hooksPath .githooks`. They are deliberately
  not wired through a package `prepare` script: that would run in consumers' installs.
- **Not published to npm.** The npm name `@studio/eslint-config` belongs to an unrelated third
  party: never install it from the registry.
- **The presets are a public API.** A rule change alters every consumer's lint: prefer additive,
  opt-in changes. Details in `.claude/rules/configs.md`.
- **Language:** reply to the maintainer in Spanish; code, comments and this file stay English.

## Flow

- New worktree from `origin/develop`; PR into `develop`, landed by **squash**, so the PR title
  is the commit and must be a Conventional Commit (it drives the changelog).
- When its checks are green you merge it yourself:
  `gh pr merge <n> --squash --match-head-commit <sha>`. If the change is delicate, first get a
  second read with `/code-review` in a clean context.
- `main` and releases belong to the maintainer: while `develop` exists, the `develop` → `main`
  promotion is theirs (merge commit), and a release tag must match `version` in `package.json`.
- What to ask the maintainer and what you decide comes from the machine's instructions; it is
  not repeated here.

## Commands

```bash
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit
pnpm test          # vitest; the tests in __tests__/ pin the exported rules and their options
```

## Where things live

- Presets: `*.mjs` at the root (the package `exports`); their tests: `__tests__/`.
- Local hooks: `.githooks/` (gitleaks + private-name check). CI: `.github/workflows/` —
  `ci.yml` (typecheck + test), `hygiene.yml` (gitleaks over history, CLAUDE.md ≤ 6 KB).
