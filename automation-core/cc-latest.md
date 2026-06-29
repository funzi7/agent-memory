# automation-core — latest Claude Code status

## Fix #11 — Codex Gate now shows WHY it's red (check-codex-status carries output)

**automation-core main commit:** `9baa072`

`check-codex-status` was the JOB's own status check (the job was literally named
`check-codex-status`), so its red/green carried EMPTY `output.title`/`summary` — a
blocked gate showed a blank red square with no reason.

**Fix (output text only — verdict LOGIC unchanged):**
- Renamed the job to **`codex-gate`** and now publish `check-codex-status` as an
  EXPLICIT check-run via octokit `checks.create`/`checks.update` on the PR head
  (find-and-update → exactly one per head, no job-status duplicate). The check
  NAME stays exactly `check-codex-status`, so merge-bot's `checks.listForRef`
  still finds it. Added `checks: write` to permissions.
- Per state (each summary includes the 7-char head SHA):
  - 🟡 **"Waiting for Codex review"** — PENDING: Codex hasn't reviewed the head
    yet; includes the rerun attempt N/MAX and the `codex-p1-acknowledged` override
    hint. (conclusion `failure`)
  - 🔴 **"Active Codex P1/P2"** — BLOCKED: an unresolved P1/P2 on the head is
    blocking; names last-active / last-fix dates; clears on a fix Summary or a new
    head. (conclusion `failure`)
  - 🟢 **"Reviewed — clear"** — GREEN: Codex reviewed the head with no active
    P1/P2 (also used for the override label and stale-only P1/P2). (conclusion
    `success`)
- Publishing is wrapped in try/catch and **fail-soft**: a cosmetic output error is
  logged and ignored — the job's own `setFailed`/conclusion still reflects the
  real verdict, so a publish failure can never flip the gate green or crash it.
- Did NOT touch the freshness rule, P1/P2 detection, head-targeted self-rerun, or
  MAX_ATTEMPTS.

**Validation:** actionlint clean on both copies; node --check on all 3
github-script blocks; job rename + single check-codex-status producer confirmed;
`workflows/` ↔ `.github/workflows/` byte-identical (blob `00564f4`).

**Propagation:** rides the **daily sync** to the downstream repos. A red gate now
states the reason inline, and find-and-update keeps one `check-codex-status` per
head (also trimming the stale-red duplication).
