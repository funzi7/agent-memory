# paywall-bot handoff — 2026-10-03 UTC (PR #108: Runtime Ops Smoke same-run vs later-run dedup proof)

## Headline

The first real `Runtime Ops Smoke` with the renewed `AUTOMATION_PAT` (run
35848942676, 2026-09-23) created, edited and closed Issue #106 but reported
`result=error` — a smoke FALSE NEGATIVE, not a credential bug. PR #108 fixed
it in the GitHub client and the smoke; Merge Bot merged it normally
(`521bc52`), and the real post-merge smoke on `main` returned
**`result=ok`** (run 37120299666, Issue #109, exactly one Issue, closed,
`runtime-ops-smoke` only, no AI).

**The Actions tick of a smoke run is NOT its verdict** — the job exits 0 for
every outcome by design; read the JSON line in the job log / the step summary
(`ok` / `error` / `credential_failure`).

## Reconciled facts (previous handoff was stale)

- PR #105 (recovery freshness / adaptive cap / provider burst / governed
  health) was squash-merged by the owner as
  **`f84f93ab23bbc2550c791030f2f792a641923657`** (2026-09-23T10:13:36Z). Its
  first poll on main (2026-09-23T15:21Z) logged `recovery freshness:
  suppressed 136 stale deferred row(s)`, `RECOVERY-BURST provider=one3ft
  cap=4 ready=19` (≤ 30 ready ⇒ base cap) and `evaluated … owner_action=0
  ai_requests=0 stale_suppressed=136`; bursts recurred 09-24/25/26 at cap 4.
  State 2026-10-03T10:13Z: `stale_recovery_suppressed_total 155`,
  `ai_requests_total 0`, `owner_dms_total 0`, GitHub sync `ok`,
  `credential_failure` null. Not yet observed: a recovery with > 30 relevant
  ready rows (adaptive cap > 4) and a Daily Health DM text (not logged).
- `AUTOMATION_PAT` was renewed by the owner; the Actions secret now has
  Issues write — physically proven by the smoke (create 201, label, edit
  200, close 200) and by Merge Bot merging #108 (the PR #105 blocker
  "Resource not accessible by personal access token" is gone).
- `Runtime Ops Smoke` HAS been dispatched: 35848387992 (2026-09-23T10:22Z,
  old secret) → `credential_failure`, `create_issue 403`; 35848942676
  (10:27Z) → `error` (the false negative); 37120299666 (2026-10-03, after
  #108) → `ok`.
- `Sync from automation-core` is active again; PR #107 (sync, opened
  2026-10-02, Codex COMMENTED) is open — owner/automation item, untouched.

## Root cause (observed, not assumed)

Issue #106's create response already carried its `runtime-ops-smoke` label,
yet the label-filtered collection
(`GET /issues?labels=runtime-ops-smoke&state=all`) re-read ~1 s later did not
list it; the same listing returns it later. `labeled` events of every
PAT-created labelled Issue here are stamped 1–2 s after creation (#67, #86,
#90, #91, #106; #109 +1 s), and in the fixed smoke the collection listed
#109 only on the 4th read (~4 s) — so the filtered collection lags a fresh
create by seconds for a reason GitHub does not expose. Our defect: the smoke
re-read with `refresh=True`, which REPLACED the client cache with that stale
listing, and the second check reused it (one miss reported twice); it never
used the create response it held.

## Production audit (answers)

- Same process: `_apply_create_or_attach` already did
  `remember_issue(LABEL_INCIDENT, created)` and NO production caller passes
  `refresh=True` → `apply` was never exposed to a same-run duplicate.
- Crash after create, before the state save: the next process looks up, in
  order, the recorded number → exact-marker label listing → label-independent
  body search (trusted author, whole-token marker) → open earlier-epoch
  Issue → only then creates. A duplicate needs BOTH the listing and the search
  to lag at the next run; runs are a poll (hours) apart. Pinned by
  `ApplyListLagTests` (restart inside the label lag → recovered by search;
  after the lag → found by the listing without a marker search).

## What #108 changed (`tools/runtime_ops_github.py`)

- `GitHubClient._created`: its own create responses (per label, process-local,
  bounded at `MAX_REMEMBERED_ISSUES=10` for refresh survival only, dicts with
  a numeric number only); `list_incident_issues(refresh=True)` merges them back
  (`_with_created`; a server row wins); `patch_issue` 2xx updates in-run copies
  (`_refresh_known_issue`); `remember_issue` never seeds a partial cache;
  `issues_created`, `last_list_status`, `remaining()`;
  `find_server_issues_by_marker` = fresh, memory-free read returning EVERY
  marker match.
- Smoke steps: auth → ensure_label (failure ⇒ nothing opened) →
  find_before_create (must miss; failure/hit ⇒ nothing opened) → create_issue
  → assert_no_claude_fix (abort close reports its real status) →
  same_run_idempotent (remembered create, zero requests) →
  server_marker_visible (exactly [N]; ≤ 5 reads, pauses 1,1,2,3 s ≤ 7 s;
  retries only 0/5xx/408/429/rate-limit-403; reserve `SMOKE_TAIL_REQUESTS`) →
  find_or_create_idempotent (forced refresh, exactly one create) → edit_body →
  close_issue (or `--keep`). Escaped step-summary cells; summary says the
  green job is not the verdict. Docs: ADR "Follow-up 2026-10-03", evidence
  report §12, CONTEXT top section, README smoke paragraph, workflow header.
- Unchanged: markers/whole-token matching, trusted-author rule, planted Issue
  rejection, PR provenance, per-epoch separation, bounded pagination/search,
  REQUEST_BUDGET, every apply/sync decision.

## Git / PR / review (exact)

- Starting `origin/main`: **`0bf8fcd2b3ce0492fa795e84004ff8c12b4f670f`**.
- Branch `fix/runtime-ops-smoke-visibility-20261003`; one commit, head
  **`742502182bcfe999e504b5f8a8951e047f849a95`**; PR
  https://github.com/funzi7/paywall-bot/pull/108.
- Exact-head CI: run 37120094533 **success**.
- Pre-PR independent review (separate Opus reviewer, NOT a Codex
  substitute): no P1/P2; 3000 randomized old-vs-new `apply` scenarios gave
  identical API calls and state; 12 P3s → the code/test/doc ones fixed before
  the PR (exact-one visibility, enforced zero-request reuse, escaped cells,
  bounded memory no longer blocking the cache append, dicts only, label
  failure stops, real abort-close status, retry-classification tests, budget
  test at 11, observed-vs-inferred wording, "≤ 5 reads / ≤ 7 s of pauses").
- Codex on `7425021`: **clean** — summary "✅ Completed
  2026-10-03T11:36:41Z — commit 7425021", 👍 by `chatgpt-codex-connector[bot]`
  11:36:44Z, 0 reviews, 0 inline comments, 0 threads.
- Gate: pull_request_target run 37120094540 failed BEFORE the review
  ("⏳ pending"); issue_comment run 37120208968 → `✅
  current_head_signal_no_active_findings on head 7425021`;
  `check-codex-status` pass. No override label, nothing fabricated.
- Merge: **Merge Bot** run 37120228402 (`#108: merged ✅`) at
  2026-10-03T11:37:28Z → **`521bc52a87d99976478aca638c50e0aa163abee8`**;
  code/docs byte-identical to the reviewed head. CI on main after merge: run
  37120247727 success.

## Real post-merge smoke (run 37120299666, head 521bc52, 2026-10-03T11:38Z)

`{"result":"ok","issue_number":109}` — auth 200; ensure_label 422 (exists);
find_before_create found=None; create_issue 201 `runtime-ops-smoke`;
assert_no_claude_fix ok; same_run_idempotent found=109 requests=0;
server_marker_visible found=109 attempts=4; find_or_create_idempotent
found=109 creates=1; edit_body 200; close_issue 200.
Physical check: exactly one new smoke Issue (#109; previous highest #106;
nothing above #109); created 11:38:41Z, closed 11:38:47Z, author `funzi7`;
body `<!-- runtime-incident:v1 tenant=themarker fingerprint=smoke-cbc3342b
epoch=smoke -->` + text + "smoke update"; labels `runtime-ops-smoke` only; 0
comments; no `claude-fix`. `Claude Fixer` was woken by the Issue events and
both runs concluded **skipped** (no `claude-fix`, no `@claude`); Codex
Auto-Fix / Backup Fix / CI Doctor did not run. No AI spent.

## Validation actually run

`python -m unittest discover` **1314 OK** (+31: `CreatedIssueMemoryTests`,
`ApplyListLagTests`, `SmokeVisibilityTests`, updated smoke pins; the fake
GitHub now lags like the real one and created Issues carry their real
author); `python -m tests.test_message_format`; the 18 focused CI suites;
Runtime Ops family (`test_runtime_ops`, `_github`, `_integration`) OK;
`compileall`; 17 workflow YAMLs; `node --test` 21/21; `bash -n`; `state/`
byte-clean; `git diff --check`. **22 mutants of the key guards, all killed
by named tests.** Tech Feed IL untouched (no shared module changed besides
the Runtime Ops GitHub tool, which Tech Feed IL does not run).

## PENDING / known limits

1. PR #107 (sync from automation-core) open — owner/automation.
2. #104 cutover gap: the legacy pipeline_outage DM (2026-09-21T23:54Z) never
   got its "נפתר אוטומטית" closure (recorded in the Runtime Ops report §10).
3. `core/health.py` 24h comparison does not read `suppressed_items` (a
   re-posted stale-suppressed article counts as a gap) — needs a new
   comparison category; documented in the ADR.
4. #105 acceptance still open: an adaptive cap > 4 (needs > 30 relevant ready
   after a long outage) and the Daily Health DM text (not logged).
5. The autonomous Issue → Claude Fixer → PR → Gate → Merge Bot → verification
   chain is still not physically exercised (no internal defect has occurred;
   never manufacture one).
6. The smoke's `find_before_create` is one read: a transient 5xx there ends
   the smoke as `error` with no Issue opened (truthful, conservative).

## Rules note

DEVELOPMENT_RULES_FULL.md read in full; preflight done (pwd/repo/branch/
HEAD/tracking/status/diff/cached/remotes/origin-main/log/open PRs); new
branch from origin/main; no reset/clean/restore/stash/force-push; mutation
runs restored the tool file byte-identical each time; no Telegram/Telegraph
write; the only external writes were PR #108 and the explicitly dispatched
smoke Issue #109 lifecycle. agent-memory finalized only via
`/root/work/bin/agent-memory-finalize`.

## STATUS BLOCK

- paywall-bot main: `521bc52a87d99976478aca638c50e0aa163abee8` (PR #108
  merged by Merge Bot; real smoke `ok`).
