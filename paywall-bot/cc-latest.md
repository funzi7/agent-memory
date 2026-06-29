diagnostic: #49 claude.yml 👀-no-fix WITH budget + backup not firing (READ-ONLY)

## 1. claude.yml run on PR #49 — did it FAIL after the 👀? (conclusion + permissions block + error)

claude.yml recent runs (createdAt event status/conclusion id):
```
2026-06-29T08:27:29Z pull_request_review_comment completed/failure id=28358803095  (head e62a3f5, br claude/quality-rolling-issue) ← #49
2026-06-29T08:27:19Z pull_request_review_comment completed/skipped id=28358794264  (head e62a3f5, #49 sibling event)
2026-06-29T08:25:27Z issues                      completed/skipped id=28358696827  (head dd672b3, main)
2026-06-29T08:25:27Z issues                      completed/skipped id=28358696752  (head dd672b3, main)
2026-06-29T08:15:00Z pull_request_review_comment completed/failure id=28358147390  (head 0135203, chore/sync-automation-core)
2026-06-29T07:25:13Z pull_request_review_comment completed/skipped id=28355632155  (head 9e7c7fd, chore/sync-automation-core)
```

The run tied to #49's head (e62a3f5) is id=28358803095, job "claude" (id 84008170952) → **conclusion = failure**.

Log lines matching GITHUB_TOKEN Permissions / Contents / permission / denied / 403 / Resource not accessible / push / fatal / Error (verbatim):
```
##[group]GITHUB_TOKEN Permissions
Actions: read
Contents: write
Issues: write
Metadata: read
PullRequests: write
##[endgroup]
  ANTHROPIC_API_KEY: ***                      (key IS set — budget present)
Checking permissions for actor: funzi7
Permission level retrieved: admin
Actor has write access: admin
  claude_args: --max-turns 20
    "Bash(git push:*)",                        (push IS in allowedTools)
  "model": "claude-opus-4-8[1m]"
{
  "type": "result",
  "subtype": "error_max_turns",
  "is_error": true,
  "duration_ms": 151178,
  "num_turns": 21,
  "total_cost_usd": 0.77298825,
  "permission_denials_count": 11
}
##[error]Execution failed: Reached maximum number of turns (20)
##[error]Action failed with error: Claude execution failed: Reached maximum number of turns (20)
##[error]Process completed with exit code 1.
```

VERDICT: it FAILED after the 👀, but NOT from budget / token / push permission. ANTHROPIC_API_KEY is set, $0.77 was spent (Claude ran the model claude-opus-4-8[1m] for ~151s), and both the GITHUB_TOKEN (Contents: write) and the PAT had write + `Bash(git push:*)` was allowed. The failure is **`error_max_turns`**: Claude hit the **20-turn cap** (num_turns 21) with **11 internal permission_denials** (it kept trying tools outside its allowedTools allowlist, burning turns) and exited error WITHOUT opening a fix PR. No `403` / `Resource not accessible` / `denied`(github) / `fatal` / push-failure line appears anywhere in the log.

## 2. ai-loop marker on #49? (review-comment channel)

```
2026-06-29T08:27:27Z  ::  <!-- ai-loop:v1 root_pr=49 head=e62a3f548f60ae21b77f2ded040d7eb3acca2857 attempt=1 agent=claude state=requested -->
```
#49 current head SHA:
```
e62a3f548f60ae21b77f2ded040d7eb3acca2857
```
→ marker present, agent=claude state=requested, head == current head. The watchdog's match condition is satisfied (it should fire once the 20-min timeout elapses).

## 3. Are watchdog + backup on paywall-bot main now (post-#48)?

```
[backfill.yml, ci-doctor.yml, ci.yml, claude-fallback-watchdog.yml, claude.yml,
 codex-auto-fix.yml, codex-backup-fix.yml, codex-gate.yml, health.yml,
 merge-bot.yml, poll.yml, quality-monitor.yml, sync-automation-core.yml]
```
→ YES. `claude-fallback-watchdog.yml` and `codex-backup-fix.yml` are BOTH on paywall-bot main now (landed via the sync after #48). (Note: codex-gate.yml here is blob 461b280 — the pre-P2-block version; automation-core's fix #6 `f1c548e` hasn't synced down yet.)

## 4. Recent claude-fallback-watchdog runs (did it tick after #49's @claude fix / try to dispatch / any 403?)

```
total_count = 0   (the watchdog has NEVER run on paywall-bot)
```
→ Although the workflow file is now on main, it has 0 runs: the scheduled cron (`2-59/5 * * * *`) only starts firing after the file is on the default branch and GitHub registers the schedule, and the 20-min timeout from the 08:27 @claude fix had not elapsed at capture. So it has NOT yet ticked on #49, has NOT attempted a dispatch, and there is therefore no 403 to report yet.

## 5. Recent codex-backup-fix runs

```
total_count = 0   (codex-backup-fix has NEVER run on paywall-bot)
```
→ Consistent with #4: the watchdog hasn't fired, so it never dispatched the backup. (And the AUTOMATION_PAT `Actions: write` scope may still be ungranted, which would 403 the dispatch when the watchdog does tick — see automation-core fix #4 / Hard-Won Lesson 10/11.)
