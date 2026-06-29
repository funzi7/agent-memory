# automation-core — latest Claude Code status

## Fix #8 + #9 — gate the dead Codex backup; ci-doctor ignores all infra workflows

**automation-core main commit:** `c743ca4`

### Fix #8 — Codex backup gated behind `CODEX_BACKUP_ENABLED` (default OFF)
The Codex backup fixer (`codex-backup-fix.yml`) is dead: OpenAI quota is exhausted
(its maiden run on paywall-bot #49 failed `ERROR: Quota exceeded`). `claude.yml`
(fix #7) has Anthropic budget and is the working fixer.
- `claude-fallback-watchdog.yml` now reads the Actions variable
  **`CODEX_BACKUP_ENABLED`** (via step `env`). It must be EXACTLY `'true'` to
  enable dispatch; **anything else, including unset, is DISABLED — the default**.
- DISABLED → the watchdog does NOT dispatch the dead backup. On the FIRST timeout
  it escalates: adds `needs-owner` (deduped vs a prior `agent=watchdog
  state=escalated` marker or an existing `needs-owner` label), posts a
  "needs a manual fix" comment, sends a counts-only Telegram alert (fail-soft).
- ENABLED → original dispatch path (incl. the 3-attempt cap) unchanged.
- `codex-backup-fix.yml` left in place but DORMANT; its header documents it needs
  OpenAI quota + `CODEX_BACKUP_ENABLED='true'`. **Re-enableable.**

### Fix #9 — ci-doctor `IGNORE_WORKFLOWS` now lists all infra workflows
Added `Minutes Guard`, `Bootstrap repos`, `Loop Morning Report` (verified against
each workflow's `name:`) so their infra failures no longer open noisy `claude-fix`
issues.

### Validation
actionlint clean on both copies of all three edited workflows; node --check on the
two touched github-script blocks; a 6-case gate self-test passes (only `'true'`
enables dispatch); `workflows/` ↔ `.github/workflows/` byte-identical (watchdog
`f59e015`, ci-doctor `649e23c`, backup `b8f40d8`).

### Defaults / propagation
**`CODEX_BACKUP_ENABLED` defaults OFF** (unset = disabled) — no action needed to
keep the backup dormant. Both fixes ride the **daily sync** to the downstream
repos. To re-enable the backup later: restore OpenAI quota AND set
`CODEX_BACKUP_ENABLED='true'`. Claude remains the sole autonomous fixer meanwhile;
watch that Codex *review* doesn't also lapse on quota (would leave the gate
pending — use the `codex-p1-acknowledged` override if so).
