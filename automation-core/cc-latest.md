# automation-core — latest Claude Code status

## Fix #6: Codex Gate now blocks on an active P2 (not just P1)

**automation-core main commit:** `f1c548e`

**Problem (Codex's #48 P1):** the bridge triggers a Claude fix on **P1 and P2**,
but the Codex Gate only failed on P1 — so a **P2-no-P1** PR could go green and
**merge BEFORE the fix landed** (the merge-before-fix race).

**Fix (in `codex-gate.yml`, both copies byte-identical):**
- Added `p2Pattern` mirroring `p1Pattern` EXACTLY: badge fragment `P2-yellow`
  (the same badge the bridge keys on — `![P2 Badge](…/badge/P2-yellow…)`) plus
  line-leading `**P2**` / `[P2]` / `P2:`, with the same mid-prose discipline (a
  bare "P2" token never matches; P1/P3 badges don't cross-match).
- Active detection now blocks on P1 **or** P2 (`activeSevItems`), using the same
  date-only `onHead` freshness, `stripSummarySections`, and
  later-fix-Summary-clears-it logic that P1 used.
- The gate BLOCKS on an unresolved active P1/P2 OR a head Codex hasn't reviewed;
  a stale P1/P2, clean review, 👍, or **P3** all pass. Head-targeted self-rerun +
  `codex-p1-acknowledged` override unchanged. Net: **gate-block severity now
  equals bridge-trigger severity (P1+P2)**.

**Validation:** actionlint clean on both copies; `node --check` on the gate's
github-script blocks; an 8-case `p2Pattern` self-test passes; `workflows/` ↔
`.github/workflows/` byte-identical (blob `73b3c7d`).

**Propagation:** rides the **daily sync** to the downstream repos. paywall-bot's
next sync is small + clean — fix #5 (suppress auto-@claude-fix on the sync PR) is
already on main, so the sync PR won't trip the breaker.

**Closes Codex's #48 P1.** Remaining loop tasks (owner-side): grant
`AUTOMATION_PAT` the `Actions: write` scope, close #38, run a fresh downstream sync.
