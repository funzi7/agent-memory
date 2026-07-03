diagnostic: red gate on sync PR #66 (fix #20 sync) — READ-ONLY

_All facts resolved from the GitHub API on 2026-07-03 (`gh` unavailable → REST/MCP). READ-ONLY: no
code/PR/comment/label/run touched. Owner referenced only by login `funzi7`._

## 0. the open sync PR
```
#66  chore/sync-automation-core @ 3d80048bfe2428c43ef40a779c0b9db245b0be63  created=2026-07-03T15:46:02Z
title: chore(automation): sync from automation-core   (2 files changed, +29/-38)
base:  main @ 43de8e221d57bda0f9a523d18c02d021daa9198d   state=open  mergeable_state=unstable
latestCommitDate (max committer date across PR commits) = 2026-07-03T15:46:00Z   (1 commit: 3d80048)
files: .github/workflows/claude-fallback-watchdog.yml (+14/-9), .github/workflows/merge-bot.yml (+15/-29)
        → diff is FIX #20 verbatim (roPage/roPaged Link rel="next", 50-page ceiling; replaces the 10-page valve)
```

## 1. every check-run on the head 3d80048, chronological (verbatim titles)
```
2026-07-03T15:46:09Z  check-codex-status   [completed/failure]  (job, run 28670733504)
2026-07-03T15:46:10Z  test-message-format  [completed/success]  (real CI — ci.yml, GREEN)
2026-07-03T15:47:52Z  check-codex-status   [completed/failure]  (job, run 28670814274)
2026-07-03T15:49:32Z  check-codex-status   [completed/failure]  (job, run 28670892084)
2026-07-03T15:49:35Z  codex-gate-verdict   [completed/failure]  :: "🟡 Waiting for Codex review"
      summary: "Codex hasn't reviewed 3d80048 yet (rerun attempt 3/3). The gate re-checks
                automatically; it turns green once Codex reviews with no active P1/P2. Manual
                override: add the `codex-p1-acknowledged` label."
```
NONE of the check-codex-status runs is `cancelled`; all three are `completed/failure` (pending verdict).

## 2. Codex signals on PR #66
```
--- reviews (pulls/66/reviews) ---            : []   (NO Codex review of any state on the head)
--- issue-level reactions (issues/66/reactions) : 0    (NO 👍 — no late Codex ack)
--- issue comments (issues/66/comments) ---   : []
--- review comments containing P1/P2 ---      : []   (no inline findings at all)
```
=> ZERO Codex signal of any kind on head 3d80048 (no review, no comment, no reaction).

## 3. gate runs on this head — did every attempt COMPLETE (fix #17 check) + poll window
```
2026-07-03T15:46:05Z  pull_request       completed/failure  run=28670733504  attempt=1
2026-07-03T15:47:47Z  workflow_dispatch  completed/failure  run=28670814274  attempt=1  (self-rerun 2/3)
2026-07-03T15:49:27Z  workflow_dispatch  completed/failure  run=28670892084  attempt=1  (self-rerun 3/3)
```
All 3 COMPLETED (failure); ZERO cancelled. The head-targeted self-rerun poll exhausted at 3/3
(~15:49:38Z) — after which the gate stops re-dispatching and sits pending until a Codex signal or the
override label.

## 4. watchdog since the PR opened — did the sweep tick, and is it even functional
```
watchdog total_count = 43;   NEWEST run = 2026-07-03T14:54:13Z (id 28668140575, completed/FAILURE)
runs created AFTER the PR opened (>15:46:02Z): NONE
```
The watchdog has NOT ticked since the PR was created (last tick 14:54 = ~52 min BEFORE the 15:46 PR).
And the deployed watchdog on `main` is BROKEN — the 14:54 run's sweep step crashed (verbatim):
```
Error: Cannot find module '@actions/github'
Require stack:
- /home/runner/work/_actions/actions/github-script/v7/dist/index.js
##[error]Unhandled error: Error: Cannot find module '@actions/github'  ... code: 'MODULE_NOT_FOUND'
```
i.e. `main` still runs the pre-fix-#19 watchdog whose late-signal sweep does `require('@actions/github')`
inside `actions/github-script@v7` — the exact bug fix #19 removed and this very sync PR (fix #20, which
sits on top of #19's fetch helpers) would deploy. So the sweep is dead-on-arrival every tick AND has not
run for #66.

## 5. merge-bot wakes since — and why it skipped
```
28670817528  2026-07-03T15:47:51Z  workflow_run  completed/SKIPPED   (the only #66-era wake)
28669680851  2026-07-03T15:24:38Z  workflow_run  completed/success   (pre-#66, other head)
28669526305  2026-07-03T15:21:27Z  workflow_run  completed/failure   (pre-#66)
```
The 15:47:51 wake SKIPPED at the job `if:` — merge-bot proceeds only on a Codex Gate `workflow_run`
whose `conclusion == 'success'`; this gate run concluded `failure`, so the job never ran (no candidate
scan). Correct fail-closed behavior: merge-bot never touched the red/ungated #66.

---

# VERDICT

**(a) The red's cause — PENDING, no Codex signal on the head.** The authoritative `check-codex-status`
is `failure` because the cosmetic tile reads **"🟡 Waiting for Codex review" — "Codex hasn't reviewed
3d80048 yet (rerun attempt 3/3)."** Reviews `[]`, comments `[]`, reactions `0`: Codex has posted NO
signal on the head. It is **not** an active P1/P2 (no findings exist) and **not** a gate malfunction
(the gate evaluated correctly, published its verdict, and completed). Because a sync PR receives no
Codex auto-review, this pending never self-clears.

**(b) fix #17 regression check — CLEAN (yes, all completed, zero cancelled).** All three gate runs on
head 3d80048 are `completed/failure` (one `pull_request`, two head-targeted `workflow_dispatch`
self-reruns); NONE is `cancelled`. The concurrency-cancel-mid-verdict strand fix #17 fixed does not
recur here.

**(c) sweep behavior — has NOT ticked for this PR, and is broken on main anyway.** The newest watchdog
run is 2026-07-03T14:54:13Z, ~52 min BEFORE the PR opened; there are ZERO watchdog runs after the PR
was created, so the sweep never evaluated #66. Separately, that 14:54 run FAILED with `Cannot find
module '@actions/github'` — main still carries the pre-fix-#19 sweep (`require` inside github-script@v7),
so the sweep would crash even if it ran. **Crucially this is NOT a late-signal-uncaught-by-sweep case:**
there is NO fresh Codex signal on the head (no review, no 👍), so a working sweep would have found
nothing to dispatch. The red is genuinely (a) pending-no-signal, not (b).

**(d) P1/P2 on the fix #20 diff — none.** No Codex finding exists on #66. (Standing rule for when one
does appear on a synced workflow: the fix belongs UPSTREAM in `automation-core`, never patched in this
repo — the next sync overwrites any downstream workflow edit.)

**(e) Recommended next step:** add the `codex-p1-acknowledged` override label to #66 (or admin-merge) —
sync PRs never get a Codex review so the pending gate can't self-clear; merging lands fix #19/#20 on
`main`, which also repairs the crashing watchdog late-signal sweep.
