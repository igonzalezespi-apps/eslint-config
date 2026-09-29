# eslint-config

Shared, published **ESLint flat configs** for the maintainer's repos: `base.mjs`, `expo.mjs`,
`next.mjs`.

> **⚠️ ESTE PAQUETE NO SE PUBLICA EN npm, y la frase de arriba decía lo contrario.**
>
> Los consumidores lo instalan como **dependencia de git**, no del registro:
> `"@studio/eslint-config": "git+https://github.com/igonzalezespi-apps/eslint-config.git#v0.0.0"`.
>
> No es un matiz. Comprobado el 2026-08-12: el nombre **`@studio/eslint-config` SÍ existe en npm y es de otra
> persona** — `mantoni`, «The JavaScript Studio», desde 2016. Un `pnpm add @studio/eslint-config` siguiendo la
> línea anterior no habría fallado: habría instalado el paquete de un tercero creyendo que era
> éste. Una falsedad en un contrato que se puede *ejecutar* es peor que una que solo confunde.
>
> Lo que sí es cierto y sigue mandando: **la API pública es real**. Un cambio en lo exportado rompe
> a cada consumidor, y por eso los consumidores lo pinean **por tag**.
 Public (MIT). Consumed as a **git dependency pinned by tag**, so the exported configs are a public
API — a rule change affects every consumer's lint.

## Rules

- **Public repo — never name a private project.** Not in configs, tests, docs, comments,
  commit messages, or CI. A local `pre-commit` guard (`.githooks/pre-commit`) enforces this
  against a private denylist; enable it per clone with `git config core.hooksPath .githooks`
  (it is a no-op where the denylist is absent, e.g. a fork). Not wired via a package `prepare`
  script on purpose — that would run in consumers' installs.
- **Language / Idioma** — Reply to the user (Ivan) in **Spanish**; he reads Spanish and this
  holds in every repo and session. Author the OpenSpec docs the user reads — `proposal.md`,
  `design.md`, `tasks.md` — in **Spanish** too. Everything else stays **English**: source
  code, comments, identifiers, this contract file's own text, skills/SKILL.md, agent prompts,
  and OpenSpec **spec deltas** (`specs/**/spec.md`, which keep their `SHALL` / `WHEN`/`THEN`
  RFC2119 keyword format).
- **Conventional Commits** — `type(scope): description` (`feat/fix/chore/docs/ci`).
- **Branch flow: `develop` → `main`.** `develop` is the default branch: work PRs target it and
  land as **one squashed commit whose message is the PR title** — by convention, not by settings
  (all three merge methods are enabled) — so the PR title MUST be a valid Conventional Commit:
  it drives the computed changelog/version. Work reaches `main` only through the **promotion
  PR** `develop` → `main`, which the maintainer merges with a **merge commit**; an agent never
  merges into `main`. The only sanctioned force-push is `--force-with-lease` on your own PR
  branch; never GitHub's "Update branch" button (it puts a merge commit on the PR branch).
  **One measured exception:** dependency PRs still open against `main`, and automerge there,
  because the shared Renovate preset this repo extends (`renovate-config:config-repo`) pins its
  base branch there
  (`gh pr list --repo igonzalezespi-apps/eslint-config --state merged --search 'author:app/renovate' --json baseRefName,mergedBy`).
  *(Corrected 2026-09-29. Until then this bullet said «trunk → main, squash-only. PRs target `main`» <!-- flow-claim: allow -->
  and «enforced by repo settings», a month after the move to `develop` on 2026-08-26. Re-measure
  with `gh api repos/igonzalezespi-apps/eslint-config --jq '[.default_branch,.allow_squash_merge,.allow_merge_commit,.allow_rebase_merge]'`
  and `gh pr list --repo igonzalezespi-apps/eslint-config --state merged --limit 10 --json baseRefName,headRefName`.)*
- **No secrets committed** — placeholders only.
- **Tests are the contract.** `__tests__/` (vitest) pins the exported rules; run them before
  committing. A rule add/removal is a breaking change for consumers — prefer additive/opt-in.
- **Agent guard.** A vendored `scripts/hooks/bash-guard.sh` is cabled as a PreToolUse Bash
  hook in `.claude/settings.json`; it denies pushes to `main` and other forbidden actions and
  enforces from its committed copy (no plugin required). `bootstrap.sh` refreshes and verifies
  it; run `bash scripts/hooks/bash-guard.test.sh` after touching it.

## Reserved to Ivan (escalate, do not decide)

Breaking a public API (a config/rule change consumers depend on) · spend/cost · opening or
renaming this repo · edits to this contract. When in doubt, escalate rather than guess.

## Studio layer

This repo declares the maintainer's plugins in `.claude/settings.json` (`core-dev`,
`stack-node`, `studio-policy`) from the `ivan` marketplace. The shared **company-layer
contract is injected at runtime by the `studio-policy` plugin** — it is not vendored here, so
this file stays self-contained and neutral. Run `./bootstrap.sh` on a fresh clone or worktree
to install the plugins and enable the guards (per-machine install is a separate step).
