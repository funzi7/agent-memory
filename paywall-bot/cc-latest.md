diagnostic: PR #58 claude-fix failure + gate state (READ-ONLY)

> gh CLI unavailable; raw GH_TOKEN is integration-scoped (403 on Actions + check-runs REST) —
> Actions/check-run data captured via the GitHub MCP API, repo data via REST (200). All
> SHAs/run-ids resolved from the API. Verbatim below.

## 0. PR #58 head
```
head=c6141dca54bcdd134ea25198b789cf33adc385c2
state=open mergeable_state=unknown commits=1 head_ref=claude/quality-gate-jina
```

## 1. claude.yml runs (relevant window; latest 6 shown)
```
28592857550 2026-07-02T13:14:16Z issue_comment skipped :: Quality gate + jina talkback defenses: never post teaser/talkback renders
28586474712 2026-07-02T11:27:21Z pull_request_review_comment failure :: Quality gate + jina talkback defenses: never post teaser/talkback renders
28586465353 2026-07-02T11:27:11Z pull_request_review_comment skipped :: Quality gate + jina talkback defenses: never post teaser/talkback renders
28499989670 2026-07-01T07:07:18Z pull_request_review_comment skipped :: chore(automation): sync from automation-core
28436291868 2026-06-30T10:02:52Z pull_request_review_comment skipped :: chore(automation): sync from automation-core
28436276736 2026-06-30T10:02:35Z pull_request_review_comment failure :: Drop foreign-script-dominant subtitle candidates (Chinese-subtitle guard)
latest FAILED claude run = 28586474712
```

## 2. failed run 28586474712: which step failed (job 84759240646 "claude")
```
JOB claude: failure
  step 1 Set up job: success
  step 2 Fail-soft check for ANTHROPIC_API_KEY: success
  step 3 Checkout repository: success
  step 4 Run Claude Code: failure          <- 11:27:29 → 11:34:56
  step 5 Swap 👀 → 👎 on a failed fix: success
  step 6 Label Claude's PR for auto-merge: skipped
```

## 3. failed run: log tail (verbatim)
```
{"type":"system","subtype":"init","message":"Claude Code initialized","model":"claude-opus-4-8[1m]"}
{"type":"result","subtype":"error_max_turns","is_error":true,"duration_ms":430016,"num_turns":51,
 "total_cost_usd":2.20873675,"permission_denials_count":21}
##[error]Execution failed: Reached maximum number of turns (50)
##[error]Action failed with error: Claude execution failed: Reached maximum number of turns (50)
No buffered inline comments
Swapped 👀 → 👎 on comment 3512643758 (failed fix).
```

## 4. did Claude push/comment before failing?
```
--- commits on the PR branch (ALL of them) ---
c6141dc 2026-07-02T11:23:11Z :: fix: quality gate + jina talkback defenses — never post teaser/talkback renders
--- ALL issue comments on #58 (count=1) ---
funzi7 @ 2026-07-02T13:14:13Z :: <!-- ai-loop:v1 root_pr=58 head=c6141dc… agent=watchdog state=escalated -->
  Claude didn't fix PR #58 within the timeout and the autonomous backup is disabled (no OpenAI quota) — needs a manual fix.
--- PR review comments ---
chatgpt-codex-connector[bot] @ 2026-07-02T11:27:07Z path=core/main.py :: [P1] Continue the fetch chain before deferring teaser parses
funzi7 @ 2026-07-02T11:27:19Z path=core/main.py :: <!-- ai-loop:v1 … attempt=1 agent=claude state=requested --> @claude fix [auto-triggered]
  "…the findings are inlined below — apply a fix for each: - core/main.py:630 — [P1] Continue the fetch chain before deferring teaser parses …"
--- reactions on the @claude comment (id 3512643758) ---
-1=1 eyes=1  (total_count=2)
```
The Codex P1 (verbatim core): *"When a premium URL is first accepted by telegram/jina/smry with a
body between min_chars and 2×min_chars, fetch_and_parse has already stopped before trying later
bypass sources like one3ft/wayback. This branch only bumps the retry counter and returns, so the
next poll will hit the same early teaser source again and can eventually mark the article
permanent_fail even though a later source could have produced the full body. The teaser rejection
needs to happen inside the fetch chain, or otherwise resume the chain after the gate rejects the
early source."*

## 5. Codex Gate on this head
```
--- ALL check-runs on head c6141dc (15) ---
test-message-format            [completed/success]    11:23:56           (CI green)
check-codex-status             [completed/cancelled]  11:23:56→11:25:36  (job; run 28586284857, pull_request)
check-codex-status             [completed/cancelled]  11:25:40→11:27:18  (job; run 28586376820, workflow_dispatch)
check-codex-status             [completed/cancelled]  11:27:19→11:27:22  (job; run 28586470086)
check-codex-status             [completed/failure]    11:27:25→11:27:33  (job; run 28586474700)  output.title="" (EMPTY — job check, no 🟢/🔴/🟡)
claude                         [completed/failure]    11:27:25→11:34:59  (the failed fixer run)
claude                         [completed/skipped]    11:27:12
trigger_codex_fix ×3 skipped, ×1 success (11:27:14) ; archive_codex_summary ×3 skipped, ×1 success
--- completed gate run 28586474700 log (verbatim key lines) ---
publishGateCheck failed (ignored, cosmetic): Check run status and conclusions can only be updated
  internally by GitHub Actions. Please see https://github.blog/changelog/2025-02-12-notice-of-upcoming-…
PR #58: ❌ active Codex P1/P2 unresolved (last active: 2026-07-02T11:27:07Z, last fix: none, head: c6141dc)
##[error]Blocked by Codex Gate: an active P1 or P2 is unresolved, or Codex has not reviewed the current head yet.
--- codex-gate.yml runs (latest 10) ---
2026-07-02T13:14:16Z issue_comment failure :: Quality gate + jina talkback defenses…
2026-07-02T11:27:21Z pull_request_review_comment failure :: Quality gate + jina talkback defenses…
2026-07-02T11:27:21Z pull_request_review cancelled :: Quality gate + jina talkback defenses…
2026-07-02T11:27:16Z workflow_dispatch cancelled :: Codex Gate
2026-07-02T11:27:11Z pull_request_review_comment cancelled :: Quality gate + jina talkback defenses…
2026-07-02T11:27:11Z pull_request_review cancelled :: Quality gate + jina talkback defenses…
2026-07-02T11:25:33Z workflow_dispatch cancelled :: Codex Gate
2026-07-02T11:23:53Z pull_request cancelled :: Quality gate + jina talkback defenses…
2026-07-02T06:33:13Z workflow_dispatch success :: Codex Gate
2026-07-02T06:31:33Z workflow_dispatch cancelled :: Codex Gate
```

## VERDICT
- **(a) Exact failure reason of the claude run (28586474712):** `"subtype": "error_max_turns"` —
  verbatim: `##[error]Execution failed: Reached maximum number of turns (50)`. 51 turns in 430s,
  $2.21, **permission_denials_count: 21** — over 40% of the budget burned on denied tool calls
  (allowedTools too narrow for the fix it attempted), so it ran out of turns mid-work.
- **(b) Did Claude push/comment before failing? NO.** The branch has exactly 1 commit (the
  original `c6141dc`); "No buffered inline comments"; zero Claude comments on #58 (only the Codex
  review, the bridge @claude ping, and the later watchdog escalation). The only post-failure
  action was the workflow's own 👀→👎 swap on comment 3512643758 (fix #10 worked; final reactions
  `-1=1 eyes=1`).
- **(c) Gate on this head:** YES — 3 `check-codex-status` runs were **cancelled by concurrency**
  (11:23:56 push, 11:25:40 dispatch, 11:27:19) as newer events superseded them; one completed
  (28586474700) and correctly went **red via the JOB conclusion** (`❌ active Codex P1/P2
  unresolved… head: c6141dc`). **NO explicit check-codex-status check-run with a 🟢/🔴/🟡 title
  exists on this head** — `publishGateCheck` hard-failed: *"Check run status and conclusions can
  only be updated internally by GitHub Actions"* — the duplicate JOB-status check named
  `check-codex-status` IS present (as expected until fix #14), and because publishGateCheck's
  `existing.find(name==='check-codex-status')` matches that Actions-owned job check, its
  `checks.update` is rejected by GitHub. The explicit-check mechanism is effectively dead on this
  repo until fix #14 renames the job (the gate still blocks correctly through the job conclusion).
- **(d) Recommended next step:** Manually apply the Codex P1 on #58 — move the teaser rejection
  INSIDE the fetch chain (or resume the chain past the winning-but-gated source) instead of
  defer-only at the gate — and push; that clears the P1, re-triggers Codex, and un-reds the gate.
  In parallel: raise `--max-turns` (50 → e.g. 80) or widen allowedTools in claude.yml (21 denials
  wasted the budget), and land fix #14's job rename so the explicit 🟢/🔴/🟡 check can publish.

## Repo state notes
#53–#56 merged; PR #58 OPEN (CI test-message-format green; gate red on the P1; autonomous backup
disabled — no OpenAI quota; watchdog escalated at 13:14:13Z). Manual-delete branches:
`diag/run-brokenimg`, `diag/run-srclink`, `diag/telethon-vs-posted-guids`.
