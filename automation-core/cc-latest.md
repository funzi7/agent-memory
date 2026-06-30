# automation-core — latest Claude Code status

## Fix #14 — single check-codex-status producer + fail-closed publish

**automation-core main commit:** `9f4ff7d`

Resolves the verification caveat (two `check-codex-status` check-runs per head)
and Codex's sync-PR finding "Restore the fallback gate check name".

### STEP 1 (report)
- In automation-core the codex-gate job KEY is `codex-gate` with **NO
  `name: check-codex-status`** line. The duplicate `name:` was a DOWNSTREAM-only
  divergence (paywall-bot's sync PR added it); upstream never had it.
- Repo-wide grep: **nothing references the job by `check-codex-status` via
  `needs:`/required-checks** — every hit is the CHECK name via
  `checks.listForRef` (merge-bot / telegram-morning-report) or doc comments. Safe.

### STEP 2 — kill the duplicate
No `name:` line to remove upstream (already single-producer). The explicit
`publishGateCheck` is the ONLY `check-codex-status`; the job-status check is
`codex-gate` (which merge-bot ignores). The next sync overwrites paywall-bot's
downstream `name:` hack, so the duplicate disappears downstream too.

### STEP 3 — fail CLOSED + VISIBLE (Codex's fallback finding)
- `publishGateCheck` no longer swallows errors as "cosmetic": on a thrown
  `checks.create`/`update` (a **downgraded `checks:write` token** on a forked /
  Dependabot run leaves no required check while merge-bot still requires
  `check-codex-status`) it sets `publishFailed=true` + `core.error(...)`.
- The final block now `core.setFailed(...)` when **the verdict blocks OR
  `publishFailed`** — green only when the verdict is clear AND the check actually
  published. So a downgraded run is a VISIBLE red `codex-gate`, never a green job
  hiding an unmergeable PR.
- The explicit check's own conclusion still equals the verdict (🟢/🔴/🟡); the
  freshness rule, P1/P2 detection, concurrency, and MAX_ATTEMPTS are unchanged.
  (Also corrected a stale "max 5 attempts" → "max 3" in the blocked message.)

### Validation
actionlint clean on both copies; node --check on all 3 github-script blocks; a
4-case fail-closed self-test (green+published→pass; blocked→fail;
green+publish-FAILED→fail; blocked+publish-FAILED→fail); exactly one explicit
`check-codex-status` producer + no `name:` line on the job; `workflows/` ↔
`.github/workflows/` byte-identical (blob `fc48ba2`).

### Net
One `check-codex-status` per head (the explicit one) + a separate `codex-gate`
job-status check; a publish failure fails the gate visibly red. Propagates via
the daily sync.
