# automation-core — latest Claude Code status

## Fix #12 — collapse Codex Gate's duplicate runs + lower the self-rerun cap

**automation-core main commit:** `5788467`

The Codex Gate over-ran (~275 runs on a downstream): a Codex review fires BOTH
`pull_request_review` and `pull_request_review_comment` (one per inline note), and
a push fires a `pull_request` run + its head-targeted self-rerun — ~4 gate runs per
review wave. Fix #12 trims that **without changing the green/red verdict logic**.

- **Run-collapsing concurrency (top-level):**
  `concurrency: { group: codex-gate-pr-${{ github.event.pull_request.number || github.event.inputs.pr_number || github.event.issue.number || github.run_id }}, cancel-in-progress: true }`.
  Overlapping gate runs for the SAME PR cancel down to the latest authoritative
  run (the simultaneous review/review_comment burst, and a push run + its
  immediate self-rerun, collapse to one). Sequential self-reruns (~90s apart)
  don't overlap → untouched. The `|| github.run_id` fallback guarantees a
  non-empty group key.
- **Safe (no wedge):** every run publishes `check-codex-status` on the PR HEAD sha
  (fix #11, `head_sha: headSha`), so whichever run wins concurrency lands the
  check on the head via find-and-update — a canceled/superseded run never leaves
  a stale or half check.
- **`MAX_ATTEMPTS` 5→3** (poll KEPT): since fix #11 lands the check on the head
  from every run, the self-rerun's only remaining job is catching a 👍 reaction
  (which fires no event); 3 polls (~90s apart, per-head reset) suffice. Header
  comment updated from (5).
- **Unchanged:** date-only freshness rule, P1/P2 detection, the
  `codex-p1-acknowledged` override, and the verdict→conclusion mapping.

**Validation:** actionlint clean on both copies; node --check on all 3
github-script blocks; YAML parse confirms the concurrency group + non-empty
fallback + `cancel-in-progress: true`; `MAX_ATTEMPTS = 3` (no `5` left); the check
create stays head-pinned; `workflows/` ↔ `.github/workflows/` byte-identical
(blob `c6dba57`).

**Propagation:** rides the **daily sync** to the downstream repos — far fewer gate
runs per PR head, same verdict and same head-pinned `check-codex-status`.
