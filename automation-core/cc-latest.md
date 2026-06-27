diagnostic: loop probe #33 + paywall-bot self-PRs (READ-ONLY, no changes made)

> Note: the `gh` CLI is not available in this environment; outputs below were captured
> via the GitHub REST API (read-only) and projected to the exact fields each command requested.

## 1 — watchdog runs (claude-fallback-watchdog.yml) — did it run? success/fail?
```
2026-06-27T05:42:01Z schedule completed/success id=28280196819
2026-06-27T01:47:01Z schedule completed/success id=28274907523
2026-06-26T23:42:49Z schedule completed/success id=28271438616
2026-06-26T22:22:03Z schedule completed/success id=28268564978
2026-06-26T21:02:45Z schedule completed/success id=28265130962
2026-06-26T19:18:42Z schedule completed/success id=28260055780
2026-06-26T17:22:01Z schedule completed/success id=28254067768
2026-06-26T15:33:42Z schedule completed/success id=28248224071
2026-06-26T13:01:39Z schedule completed/success id=28239715372
(total_count=9 runs returned)
```

## 2 — backup runs (codex-backup-fix.yml) — was it dispatched? success/fail?
```
(no runs — total_count=0; codex-backup-fix.yml has never been dispatched/run)
```

## 3 — automation-core workflows — active or disabled? (gh workflow list --all)
```
Bootstrap repos                active  id=275278345  .github/workflows/bootstrap.yml
CI Doctor                      active  id=296993976  .github/workflows/ci-doctor.yml
Claude Fallback Watchdog       active  id=302663752  .github/workflows/claude-fallback-watchdog.yml
Claude Fixer                   active  id=296964435  .github/workflows/claude.yml
Codex Auto-Fix                 active  id=296964429  .github/workflows/codex-auto-fix.yml
Codex Backup Fix               active  id=302663754  .github/workflows/codex-backup-fix.yml
Codex→Claude Bridge            active  id=298471487  .github/workflows/codex-claude-bridge.yml
Codex Gate                     active  id=296956104  .github/workflows/codex-gate.yml
Merge Bot                      active  id=296993977  .github/workflows/merge-bot.yml
Minutes Guard                  active  id=295389988  .github/workflows/minutes-guard.yml
Sync from automation-core      active  id=296993978  .github/workflows/sync-automation-core.yml
Loop Morning Report            active  id=299662291  .github/workflows/telegram-morning-report.yml
```

## 4 — KEY signal — any agent=codex marker on PR #33?
```
(no issue comments on PR #33 match ai-loop:v1 — gh pr view --json comments returns the
conversation/issue comments only; result is empty. No agent=codex marker present in that channel.)
```

## 5 — which check is failing on PR #33? (gh pr checks 33)
```
check-codex-status      completed/success   started=2026-06-26T15:15:32Z completed=2026-06-26T15:15:39Z id=83689113354
archive_codex_summary   completed/skipped   started=2026-06-26T15:15:20Z completed=2026-06-26T15:15:12Z id=83689082203
archive_codex_summary   completed/skipped   started=2026-06-26T15:15:20Z completed=2026-06-26T15:15:12Z id=83689081770
trigger_codex_fix       completed/skipped   started=2026-06-26T15:15:18Z completed=2026-06-26T15:15:12Z id=83689074711
trigger_codex_fix       completed/skipped   started=2026-06-26T15:15:12Z completed=2026-06-26T15:15:12Z id=83689055073
check-codex-status      completed/success   started=2026-06-26T15:15:15Z completed=2026-06-26T15:15:21Z id=83689054196
claude                  completed/success   started=2026-06-26T15:15:15Z completed=2026-06-26T15:15:34Z id=83689054156
check-codex-status      completed/success   started=2026-06-26T15:15:15Z completed=2026-06-26T15:15:20Z id=83689053804
archive_codex_summary   completed/skipped   started=2026-06-26T15:15:09Z completed=2026-06-26T15:15:02Z id=83689042146
claude                  completed/skipped   started=2026-06-26T15:15:02Z completed=2026-06-26T15:15:02Z id=83689020992
trigger_codex_fix       completed/skipped   started=2026-06-26T15:15:02Z completed=2026-06-26T15:15:02Z id=83689020591
trigger_codex_fix       completed/success   started=2026-06-26T15:15:05Z completed=2026-06-26T15:15:12Z id=83689020267
check-codex-status      completed/success   started=2026-06-26T15:15:06Z completed=2026-06-26T15:15:11Z id=83689020132
archive_codex_summary   completed/success   started=2026-06-26T15:15:06Z completed=2026-06-26T15:15:11Z id=83689019713
check-codex-status      completed/success   started=2026-06-26T15:15:06Z completed=2026-06-26T15:15:13Z id=83689019457
check-codex-status      completed/FAILURE   started=2026-06-26T15:13:51Z completed=2026-06-26T15:15:30Z id=83688774053
(16 check runs on PR #33 head; the only failing one is an early check-codex-status run id=83688774053.
 later check-codex-status runs on the same head concluded success.)
```

## 6 — paywall-bot PR #40 — branch + body (what opened the content-quality PRs)
```
branch=quality-report-2026-06-26-59b1229f
created=2026-06-26T22:04:34Z
--body--
This PR was opened automatically by the runtime quality monitor.

**1 content-quality issues** detected in published posts since the last report. Of those, **0** are P1 (user-visible)

## Finding types in this batch

- `low_hebrew_dominance`

Full report: [`reports/quality-issue-2026-06-26-59b1229f.md`](reports/quality-issue-2026-06-26-59b1229f.md)

Codex auto-fix is expected to read this PR, diagnose each finding's source parser path, and open a follow-up PR with the actual code fix. Merging this report PR records that the issues have been filed; the code fix lives in the follow-up.
```

## 7 — paywall-bot workflows — active/disabled (gh workflow list --all)
```
Backfill                     active  id=274070691  .github/workflows/backfill.yml
CI                           active  id=274732686  .github/workflows/ci.yml
Claude Fixer                 active  id=302557988  .github/workflows/claude.yml
Codex Auto-Fix               active  id=288365498  .github/workflows/codex-auto-fix.yml
Codex Gate                   active  id=288364579  .github/workflows/codex-gate.yml
Daily Health                 active  id=274070693  .github/workflows/health.yml
Poll & Post                  active  id=274070694  .github/workflows/poll.yml
Quality Monitor              active  id=275313209  .github/workflows/quality-monitor.yml
Sync from automation-core    active  id=275289239  .github/workflows/sync-automation-core.yml
Dependency Graph             active  id=274060091  dynamic/dependabot/update-graph
```
