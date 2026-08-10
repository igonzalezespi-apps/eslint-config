<!-- Describe the change above the section below. -->

## Merge method

This repository is **squash-only** (enforced by repo settings): every PR lands as one commit
whose message is the **PR title**. The PR title MUST therefore be a valid Conventional Commit
(e.g. `fix(base): disable a rule that breaks flat-config consumers`) - it drives the computed
changelog and version.
