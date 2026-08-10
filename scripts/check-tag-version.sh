#!/usr/bin/env bash
# Assert that a release tag agrees with the `version` in the package.json of the commit it
# points at.
#
# Why this exists: on 2026-08-09 the tag `v0.2.2` was cut by hand at the tip of `main`, which
# still carried `"version": "0.2.1"` because the bump PR had not merged yet. The published
# release therefore *contained* a package.json that named a different version than the tag.
# Nothing noticed — no test asserts on the tag, and the rule content was correct, so every
# check stayed green. A published artifact that misstates its own version is the kind of
# falsehood that a later session (or a release tool reading package.json at the tag) trusts.
#
# This is an ALARM, not a barrier: by the time a tag push runs the workflow, the tag exists.
# It turns a silent mismatch into a loud one. What PREVENTS it is cutting the tag from the
# bump commit itself — the job of the release workflow (studio plan, F2.5).
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  check-tag-version.sh <tag>              compare <tag> against ./package.json (working tree)
  check-tag-version.sh <tag> --from-git   compare against `git show <tag>:package.json`
  check-tag-version.sh --all              audit every v* tag in the repository

<tag> may be given with or without the leading "v" (v0.2.3 and 0.2.3 both work).
Exit 0 when every tag checked agrees with its package.json; 1 otherwise.
EOF
}

# Reads the "version" field. Node is a hard dependency of this repo, jq is not.
version_from_json() {
  node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
    const v=JSON.parse(s).version;
    if (typeof v !== "string" || v === "") { console.error("package.json has no usable version field"); process.exit(2) }
    process.stdout.write(v);
  })'
}

check_one() {
  local tag="$1" mode="$2" expected actual
  expected="${tag#v}"

  if [ "$mode" = git ]; then
    actual="$(git show "${tag}:package.json" | version_from_json)"
  else
    actual="$(version_from_json <package.json)"
  fi

  if [ "$expected" = "$actual" ]; then
    printf 'OK    %-10s package.json says %s\n' "$tag" "$actual"
    return 0
  fi
  printf 'FAIL  %-10s package.json says %s, the tag claims %s\n' "$tag" "$actual" "$expected"
  return 1
}

case "${1:-}" in
  -h | --help | '')
    usage
    exit 0
    ;;
  --all)
    rc=0
    tags="$(git tag --list 'v*' --sort=v:refname)"
    [ -n "$tags" ] || { echo "no v* tags in this repository"; exit 0; }
    while read -r t; do
      check_one "$t" git || rc=1
    done <<<"$tags"
    exit "$rc"
    ;;
  *)
    tag="$1"
    mode=worktree
    [ "${2:-}" = "--from-git" ] && mode=git
    check_one "$tag" "$mode"
    ;;
esac
