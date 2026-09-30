# eslint-config

Shared **ESLint flat configs** (`base.mjs`, `next.mjs`, `expo.mjs`) for the maintainer's repos.
Public (MIT). **Not published to npm:** consumers install it as a git dependency pinned by tag
(`github:igonzalezespi-apps/eslint-config#vX.Y.Z`). The npm name `@studio/eslint-config` belongs
to an unrelated third party, so never install it from the registry. The exported configs are a
public API: a rule change alters every consumer's lint.

## Rules

- **Public repo: never name a private project** — not in configs, tests, docs, comments, commit
  messages, PR bodies or CI. The `.githooks/` hooks enforce it against a private denylist (a no-op
  on a fork); they are not wired through a package `prepare` script on purpose, since that would
  run in consumers' installs.
- **Language:** reply to the maintainer in Spanish; code, comments and this file stay English.
- **Branch flow: `develop` → `main`.** Work PRs target `develop`, and so do dependency PRs (the
  shared Renovate preset inherits `develop`). They land by **squash** — a convention, since all
  three merge methods are enabled — so the PR title becomes the commit and MUST be a valid
  Conventional Commit: it drives the changelog and version, together with the one `semver:*`
  label every PR needs. `main` moves only through the promotion PR `develop` → `main`, which the
  maintainer merges with a merge commit; an agent never merges into `main`.
- **Nothing is enforced server-side** (no branch protection, rulesets or required checks: a
  standing decision). CI reports, it does not block; what stops a mistake is the vendored guard
  in-session and the `.githooks/` hooks per clone. Run `./bootstrap.sh` after cloning.
- The company-wide rules come from the `studio-policy` plugin; this file keeps only what is
  specific to this repo. Path rules load on demand: `.claude/rules/configs.md` (the presets and
  their tests) and `.claude/rules/guard.md` (`scripts/hooks/`, `.githooks/`, `bootstrap.sh`).

## Reserved to the maintainer (escalate, do not decide)

Breaking the public API (a config or rule change consumers depend on) · spend or cost · opening,
renaming or changing the visibility of this repo.
