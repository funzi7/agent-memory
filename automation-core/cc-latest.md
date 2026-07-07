# automation-core — post-fix #27 documentation reconciliation handoff

Date: 2026-07-07. Self-contained — a brand-new AI can act from this alone. No personal names anywhere.

## Commits
- **Reconciliation commit (this task, docs-only):** full `ff57a73220faa5dbb563edc7b035fc6cc653c509` · 7-char **`ff57a73`** · automation-core `main`.
- **Fix #27 implementation commit:** full `93f6acb9d2e0396afad3e10854503024843c32de` · 7-char **`93f6acb`** ("fix: deliver PR fixes to original heads"). It is the parent of `ff57a73` and the current architecture base.
- This task changed ONLY documentation (`LOOP_STATE.md`, `handoffs/CONTEXT.md`, `handoffs/loop-build.md`). **`workflows/` and `.github/workflows/` were NOT touched** (all six loop workflows verified byte-identical across the two dirs).

## The current fixer ladder (delivery-judged)
```
Codex auto-review
  → Claude (default-ON; comment triggers must be OWNER-authored)
  → Codex API backup      [only if CODEX_BACKUP_ENABLED == 'true']
  → Codex Cloud           [unless CODEX_CLOUD_ENABLED == 'false']
  → Claude apply-by-proxy [genuine no_delivery only, same-repo, once/head]
  → needs-owner (escalate)
  → Codex Gate → Merge Bot
```
Direction is deliberate: **Codex reviews, Claude fixes.** Each stage fires ≤1 per head (marker dedupe); escalate is terminal per head; a disabled stage is SKIPPED (not escalated — the fix-#8 "escalate on first timeout" behavior is SUPERSEDED by this ladder).

## Delivery definition (exact)
A fix is **delivered** only when a **real commit reaches the relevant PR head branch, dated AFTER that stage's request marker** (`deliveredSince`). NONE of these is delivery: a green workflow run, a Codex Cloud "View task" link, a task-side diff, or a "Created commit `sha`" hint — unless the PR head branch actually receives a newer commit.

## Exact state of each fallback stage
- **Claude (stage 1):** default-ON (`CLAUDE_ENABLED != 'false'`). Comment triggers gated on `github.event.comment.user.login == github.repository_owner` (public-repo cost guard). Fix #27: a PR-comment trigger resolves the PR via API, checks out the **exact head SHA** (`ref: steps.pr_context.outputs.head_sha`) on the existing head branch, and the prompt says commit+push directly to that branch (no new branch/PR). Fork heads are skipped before any writable checkout → `needs-owner` + `agent=claude state=fixer_error`. Non-delivery is CLASSIFIED (fix #26): `billing_error` / `fixer_error` / `no_delivery`.
- **Codex API backup (stage 2):** DORMANT — `CODEX_BACKUP_ENABLED` default-OFF (only literal `'true'` enables). OpenAI quota exhausted ("Quota exceeded"). `codex-backup-fix.yml` runs `openai/codex-action@v1` in Actions, pushes to the existing head branch; honest end-states `pushed`/`no_change`/`patch_failed`; terminal classes (`api_error`/`fixer_error`/`no_change`/`patch_failed`) advance the ladder immediately.
- **Codex Cloud (stage 3):** default-ON (`CODEX_CLOUD_ENABLED != 'false'`). Posts a top-level `@codex fix` (sanitized digest). Its sandbox has **no push remote** — it posts a terminal "View task" summary instead of pushing. A ready diff without a pushed commit is **never delivery and never `pushed`**; it **consumes the head's single Cloud attempt**.
- **Claude proxy (stage 4):** entry = Cloud ended without delivery AND the original Claude class was a **genuine `no_delivery`** (NEVER `billing_error`/`fixer_error` — a recipe can't fix an empty account) AND Claude enabled AND same-repo AND no proxy marker yet. Posts `@claude fix` to implement Cloud's exact summary on the existing head branch.
- **needs-owner (stage 5):** terminal human escalation after every ENABLED stage fails delivery; enriched with the ready-diff commit hint when Cloud left one.

## The three per-repo Actions variables (NOT carried by the sync)
| Variable | Default | Semantics |
|---|---|---|
| `CLAUDE_ENABLED` | enabled | literal `'false'` disables Claude (and pre-skips the watchdog Claude stage). |
| `CODEX_BACKUP_ENABLED` | disabled | only literal `'true'` enables the OpenAI/Codex API backup. |
| `CODEX_CLOUD_ENABLED` | enabled (opt-out) | only literal `'false'` disables Codex Cloud. |
(`CLAUDE_SHOW_FULL_OUTPUT` is a fourth per-repo var — exposes the SDK transcript for debugging.)

## Trusted Codex identity
Exactly `new Set(['chatgpt-codex-connector[bot]'])` in BOTH `codex-gate.yml` and `claude-fallback-watchdog.yml` (keep-in-sync comment). No `includes('codex')` / `/codex/i` trusted-identity matching remains.

## Implementation-verified vs runtime-verified (the honest split)
- **IMPLEMENTED, code-verified (read in `93f6acb`):** the head-SHA checkout + push-to-existing-branch prompt; fork-skip; the three switches; classification; the ladder; strict identity allowlist; bridge triggers on **P1+P2** (not P1-only).
- **RUNTIME-UNVERIFIED:** the fix #27 Claude → **original-PR-head** delivery has **never run a real fix** — every Claude call currently returns `billing_error` (0 tokens) because Anthropic credit is exhausted. The claude-proxy stage and the codex-api backup are likewise unrun. Docs now say "implemented; runtime-unverified", never "verified".

## Codex Cloud manual limitation (explicit)
Codex Cloud cannot auto-apply "View task → Update branch" from this automation. If Cloud prepares a diff but does not push, the owner-facing text is: *"Codex Cloud prepared a diff, but it did not reach the PR branch. Open View task → Update branch to apply it manually."* No browser automation / Playwright / session cookies / UI-click / fake API Update-branch path exists.

## Downstream fleet status
**VERIFIED (live GitHub API, 2026-07-07):**
- OptionsProfitTracker **PR #12 MERGED** 2026-06-17T03:12:10Z (onboarding: sync + health-check→claude-fix + build-gate + .claude-guard.json + CLAUDE.md).
- thai-rent-finder **PR #80 MERGED** 2026-06-17T03:12:38Z (onboarding); latest `chore(automation): sync` **PR #90 merged** 2026-07-07.
- paywall-bot latest `chore(automation): sync` **PR #69 merged** 2026-07-06.

**UNKNOWN / UNVERIFIED (not checked this pass — do not assume):** per-repo presence of secrets (`AUTOMATION_PAT`, `ANTHROPIC_API_KEY`) and Actions variables; per-repo `Workflow permissions = Read and write`; whether each downstream repo's sync workflow is enabled; runtime health of the loop on any downstream repo (all gated by Anthropic/OpenAI availability).

## Prioritized Open TODO
- **A. Done by this task (docs/state):** snapshot SHA → `93f6acb`; "verified"→"implemented, runtime-unverified"; OPT #12/TRF #80 → MERGED (API); fix-#8 escalate-on-first-timeout → SUPERSEDED; glossary/variables/delivery/attempts confirmed vs code.
- **B. Runtime tests blocked on Claude budget:** the fix #27 direct-to-original-head delivery + the claude-proxy stage — need one real same-repo PR run once Anthropic credit is funded.
- **C. Runtime tests blocked on OpenAI API quota:** the codex-api backup (`codex-backup-fix.yml`) honest end-states + stale-head guard, once quota + `CODEX_BACKUP_ENABLED='true'`.
- **D. Downstream sync / secrets / Actions-variable verification:** confirm secrets + the three (four) per-repo vars on each participating repo (none are synced); add OPT (+ paper-trader) to minutes-guard `TARGET_REPOS`.
- **E. Longer-term:** Telegram control surface (currently notify-only); possible history rewrite to purge the legacy label; fold `codex-backup-fix.yml` in vs keep dormant.

## Next live-test plan (Claude direct-to-head delivery)
Once Anthropic credit returns: pick ONE open same-repo PR with an active Codex P1/P2. The bridge posts `@claude fix` → claude.yml (owner-authored) resolves the head, checks out the exact head SHA on the existing head branch → Claude commits+pushes THERE (no new branch/PR) → the watchdog `deliveredSince(ping)` sees the commit → the gate re-checks → merge-bot merges. Confirm: no second PR is opened, the original head branch advances, and the `no_delivery` marker is NOT posted.

## Files updated (this task)
- `automation-core/LOOP_STATE.md`
- `automation-core/handoffs/CONTEXT.md`
- `automation-core/handoffs/loop-build.md`
- `agent-memory/automation-core/cc-latest.md` (this file)

## Files intentionally NOT changed
- Any `workflows/` or `.github/workflows/` file in automation-core (no code/workflow change).
- Any downstream repository (READ-ONLY — verified via API only).
- The direct-to-main convention, the single escalation label `needs-owner`, and no force-push all preserved.
