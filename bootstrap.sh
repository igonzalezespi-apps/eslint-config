#!/usr/bin/env bash
# bootstrap.sh — one-time / re-runnable setup for a fresh clone or worktree.
#
# 1. Installs the plugins this repo declares in .claude/settings.json from the
#    maintainer's plugin marketplace (project scope).
# 2. Enables the local git hooks (private-reference pre-commit guard).
# 3. If the core-dev plugin is installed, refreshes the vendored guard from the
#    canonical core (guard-sync) and verifies it (guard-verify). The guard
#    ENFORCES from its committed copy in scripts/hooks/ regardless; this only
#    keeps that copy current and proves it is intact, cabled and live.
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

# --- 1. Declared plugins (project scope) ------------------------------------
# Kept in lockstep with .claude/settings.json enabledPlugins. The marketplace is
# added first (idempotent) so the @ivan plugins resolve.
if command -v claude >/dev/null 2>&1; then
  claude plugin marketplace add igonzalezespi/claude-plugins 2>/dev/null || true
  for p in core-dev stack-node studio-policy; do
    claude plugin install "${p}@ivan" --scope project || \
      echo "bootstrap: could not install ${p}@ivan (continuing)" >&2
  done
else
  echo "bootstrap: 'claude' CLI not found — skipping plugin install (install the CLI, then re-run)." >&2
fi

# --- 2. Local git hooks (private-reference pre-commit guard) -----------------
git config core.hooksPath .githooks
echo "bootstrap: git hooks enabled (core.hooksPath=.githooks)"

# --- 3. Refresh + verify the vendored guard (if core-dev is installed) -------
# The plugin cache keys every plugin by VERSION —
# <cache>/<marketplace>/core-dev/<version>/scripts — so the version-less path
# this used to probe matched nothing: both tools were always reported missing
# and the step no-oped even with the plugin installed. Locate the script itself,
# maintainer's marketplace first, newest version wins (deterministic when
# several versions or several marketplaces coexist).
find_core_dev_script() {
  local name="$1" root hit
  if [ -n "${CLAUDE_PLUGIN_ROOT:-}" ] && [ -f "${CLAUDE_PLUGIN_ROOT}/scripts/$name" ]; then
    printf '%s' "${CLAUDE_PLUGIN_ROOT}/scripts/$name"
    return 0
  fi
  for root in \
    "$HOME/.claude/plugins/cache/ivan/core-dev" \
    "$HOME/.claude/plugins/cache" \
    "$HOME/.claude/plugins/marketplaces"; do
    [ -d "$root" ] || continue
    hit="$(find "$root" -type f -name "$name" -path '*core-dev*' 2>/dev/null | sort -V | tail -1)"
    [ -n "$hit" ] && { printf '%s' "$hit"; return 0; }
  done
  return 1
}

SYNC="$(find_core_dev_script guard-sync.sh || true)"
VERIFY="$(find_core_dev_script guard-verify.sh || true)"

if [ -n "$SYNC" ]; then
  bash "$SYNC" --repo "$ROOT"
else
  echo "bootstrap: core-dev/guard-sync not found (plugin not installed) — the vendored guard in scripts/hooks/ still enforces; run /guard-sync after installing core-dev to refresh it." >&2
fi

if [ -n "$VERIFY" ]; then
  bash "$VERIFY" --repo "$ROOT"
else
  echo "bootstrap: core-dev/guard-verify not found — running the vendored self-test instead." >&2
  bash scripts/hooks/bash-guard.test.sh
fi

echo "bootstrap: done."
