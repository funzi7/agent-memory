# automation-core — latest Claude Code status

## Loop-hardening: five fixes (automation-core main `0af9ee8`)

All five landed in ONE commit to `main` (`0af9ee8`), with handoffs/CONTEXT/LOOP_STATE in the same commit.

1. **claude.yml — `automerge` scope (Codex P1).** Removed the two branches that
   labelled an existing PR reached via an `@claude` mention. Now ONLY a PR Claude
   CREATES to close a `claude-fix` Issue (open PR matching `Fixes #<issueNum>`)
   gets `automerge` — no more auto-merging any PR that merely mentions Claude.
2. **claude.yml — wake on the FIRST ci-doctor Issue (Codex P1).** Added `opened`
   to `on.issues.types` and a job `if:` clause firing on
   `issues.opened && contains(join(github.event.issue.labels.*.name, ','), 'claude-fix')`.
   ci-doctor creates the Issue already carrying `claude-fix` (fires `opened`, not
   `labeled`), which the old trigger missed.
3. **ci-doctor.yml — ignore loop infra (Codex P2).** Added `Codex Backup Fix` and
   `Claude Fallback Watchdog` to `IGNORE_WORKFLOWS` so their failures aren't filed
   as product CI breakage.
4. **claude-fallback-watchdog.yml — loud, retryable dispatch failure.** Confirmed
   root cause of the #33 stall: `createWorkflowDispatch` 403 swallowed by
   `core.warning`. Now the catch emits `core.error` (annotation) + a counts-only
   Telegram alert (fail-soft if Telegram unset) + a deduped
   `agent=watchdog state=dispatch_failed` marker with NO `attempt=` field — so no
   attempt is burned, no `needs-owner`, and it auto-retries each tick until fixed.
   The "already fired" guard was tightened to `agent=codex && (requested||pushed)`
   so the failure marker can't block the retry.
5. **codex-auto-fix.yml (bridge) — never auto-@claude-fix the sync PR.** The check
   step sets `should_trigger=false` (no marker, no `@claude fix`) when the head ref
   is `chore/sync-automation-core` or the title starts with
   `chore(automation): sync from automation-core`. Sync-PR findings belong UPSTREAM;
   auto-patching the downstream copy diverges it and trips the breaker → needs-owner
   (what hit #38). Codex still reviews; only the auto-trigger is suppressed.

## Outstanding manual action (blocker)

**Grant `AUTOMATION_PAT` the fine-grained `Actions: write` scope.** Without it,
`createWorkflowDispatch` (watchdog → backup) and minutes-guard enable/disable all
fail with **403 "Resource not accessible by personal access token"**. The repo's
Workflow-permissions setting governs only the GITHUB_TOKEN — it does NOT grant the
PAT this scope. This is a manual PAT-settings change to confirm. Once granted, the
watchdog's next tick dispatches the backup on #33 (no attempt was burned).

## Next steps

- Close **#38** (the sync PR that tripped the 3-round breaker — its findings belong
  upstream; auto-trigger on sync PRs is now suppressed).
- Run a **fresh sync to downstream repos** so they pick up these workflow fixes.
- Add **idempotency to paywall-bot's Quality Monitor** (it opens a self-PR per run;
  dedupe so report PRs don't pile up).

## Validation

- actionlint clean on BOTH copies of all 4 edited workflows.
- `node --check` on all 6 touched github-script blocks.
- `workflows/` ↔ `.github/workflows/` byte-identical: claude `2697748`,
  ci-doctor `a9c3338`, watchdog `c5131d3`, codex-auto-fix `340ef57`.
- legacy-label grep = 0; owner-name standalone grep = 0.
