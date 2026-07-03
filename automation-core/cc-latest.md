fleet scan: post-reset wake-up audit (READ-ONLY)

_2026-07-03. READ-ONLY: no enable/disable, no dispatch, no repo commit — only this agent-memory
publish. `gh` unavailable → REST/curl + GitHub MCP. Owner referenced only by login `funzi7`._

## STEP 1 — repo discovery (scope note)
Account-level enumeration (`user/repos`, `installation/repositories`) is **blocked by the session
proxy** ("sessions are bound to their configured repositories — use repos/{owner}/{repo}/…"). So the
scan covers the session's **14 configured repos** (the same set bootstrap/sync target). The
Minutes-Guard July-1 log independently auto-discovered **11 private repos**: DivTracker, FundMe,
HydroMe, netflix-radar, OptionsProfitTracker, paper-trader, paywall-bot, **percent-calculator**,
**quality-screener**, RatesNow, thai-rent-finder — so `percent-calculator` and `quality-screener` are
real fleet repos **outside this session's scope (NOT scanned)**. (LevelCam / funzi-reels / stocks-info
are absent from that private list ⇒ public; automation-core + agent-memory are public infra.)

## STEP 2 — workflow state per repo
```
funzi7/automation-core — 12 workflows, ALL active
funzi7/agent-memory    — 2 workflows, ALL active (Sync from automation-core; pages-build-deployment)
funzi7/paywall-bot     — 17 workflows, ALL active
funzi7/paper-trader    — 3 workflows, ALL active (daily, universe-refresh, Dependency Graph)
funzi7/OptionsProfitTracker — 4 workflows: 1 active, 3 disabled_manually  <== FLAGGED
funzi7/thai-rent-finder     — 13 workflows: 3 active, 10 disabled_manually <== FLAGGED
funzi7/netflix-radar   — 0 workflows (no .github/workflows)
funzi7/LevelCam        — 0 workflows
funzi7/funzi-reels     — 0 workflows
funzi7/stocks-info     — 0 workflows
funzi7/HydroMe         — 0 workflows
funzi7/RatesNow        — 0 workflows
funzi7/DivTracker      — 0 workflows
funzi7/FundMe          — 0 workflows
funzi7/percent-calculator, funzi7/quality-screener — OUT OF SCOPE (not scanned)
```

## STEP 3 — firing history (active workflows with cron)
```
automation-core | Minutes Guard        | last_sched=2026-07-03T16:20:30Z/success   (~30m cadence) OK
automation-core | Claude Fallback Watchdog | last_sched=2026-07-03T15:30:41Z/success (5m) OK
automation-core | CI Doctor            | last_sched=2026-07-03T08:56:51Z/success    OK
automation-core | Loop Morning Report  | last_sched=2026-07-03T08:31:26Z/success    OK
automation-core | Sync from automation-core | last_sched=2026-07-03T06:26:04Z/success OK
automation-core | Merge Bot            | last_sched=2026-07-03T10:13:34Z/success    OK
automation-core | Bootstrap repos      | last_sched=2026-06-29T08:57:48Z/success  age=103.5h  cron '0 4 * * 1' (weekly Mon) → CADENCE-OK
agent-memory    | Sync from automation-core | last_sched=2026-07-03T06:32:39Z/FAILURE age<48h  (firing but FAILING)
paywall-bot     | Poll & Post          | last_sched=2026-07-03T15:01:42Z/success  age=1.5h   cron '0 5-23/2 * * *'  OK
paper-trader    | daily                | last_sched=2026-07-02T23:39:18Z/success  age=16.8h  cron '30 22 * * 1-5'   OK
```
(thai-rent-finder active workflows = codex-auto-fix / codex-gate / pr-build-gate — all event-driven,
NO cron. OptionsProfitTracker active = pr-build-gate — PR-driven, no cron. So no active cron there.)

## TABLE A — workflows with state != active (all `disabled_manually`; ZERO `disabled_inactivity`)
```
repo                       | path                                     | name                       | state
OptionsProfitTracker | .github/workflows/auto-fix-nudge.yml        | OPT Auto-Fix Nudge          | disabled_manually
OptionsProfitTracker | .github/workflows/health-check.yml          | OPT Health Check            | disabled_manually
OptionsProfitTracker | .github/workflows/sync-automation-core.yml  | Sync from automation-core   | disabled_manually
thai-rent-finder     | .github/workflows/auto-update-state.yml     | Auto-update state.md        | disabled_manually
thai-rent-finder     | .github/workflows/daily-checkup.yml         | Daily Checkup               | disabled_manually
thai-rent-finder     | .github/workflows/scrape-fazwaz.yml         | Scrape FazWaz               | disabled_manually
thai-rent-finder     | .github/workflows/scrape-hipflat.yml        | Scrape Hipflat              | disabled_manually
thai-rent-finder     | .github/workflows/scrape-lazudi.yml         | Scrape Lazudi               | disabled_manually
thai-rent-finder     | .github/workflows/scrape-living-insider.yml | Scrape Living Insider       | disabled_manually
thai-rent-finder     | .github/workflows/scrape-renthub.yml        | Scrape Renthub              | disabled_manually
thai-rent-finder     | .github/workflows/scrape.yml                | Scrape thailand-property    | disabled_manually
thai-rent-finder     | .github/workflows/site-health.yml           | Site Health Check           | disabled_manually
thai-rent-finder     | .github/workflows/sync-automation-core.yml  | Sync from automation-core   | disabled_manually
```
(Disable timestamps cluster 2026-06-14/15/17 — deliberate mass-disables, not the guard: the guard's
state is empty. Note both flagged repos disabled their `sync-automation-core.yml` = they OPTED OUT of
loop syncs, which is why fix #15–#21 never reached them.)

## STEP 4 — Minutes Guard health (funzi7/automation-core)
```
last 12 runs: ALL schedule / completed/success, cadence ~30–90 min, newest 2026-07-03T16:20:30Z.
July-1 schedule runs: dense from 01:37Z onward; GAP 2026-06-30T23:04:33Z → 2026-07-01T01:37:27Z
   (GitHub delayed/dropped the 00:00–01:30 UTC top-of-hour cron window — the busiest).
First July-1 run 28487513510 @ 01:37:27Z / completed/success — job "guard" log verbatim:
   MONTHLY_REENABLE_CRON: 5 0 1 * *
   TRIGGERED_BY_SCHEDULE: */30 * * * *
   Discovered 11 private non-archived repo(s).
   Mode: detect
   (step "Commit state changes" = SKIPPED → nothing changed)
```
state/minutes-guard.json (verbatim, ref=main):
```
{
  "schema": 1,
  "disabled_by_guard": {},
  "last_pause_at": null,
  "last_enable_at": null
}
```

---

# VERDICT

**(a) TABLE A wake action.** Every non-active workflow is **`disabled_manually`** — **ZERO
`disabled_inactivity`** anywhere in the scanned fleet. Per policy, `disabled_manually` → **do NOT
enable; ask the owner first.** They cluster on 2026-06-14/15/17 (deliberate), and the two
`sync-automation-core.yml` disables mean OptionsProfitTracker + thai-rent-finder intentionally opted
out of loop syncs. Nothing here is a GitHub inactivity auto-disable, so no `gh workflow enable` is
warranted without owner confirmation. (Reminder for the inactivity case, not triggered here:
`disabled_inactivity` → `gh workflow enable` **and** schedules resume only after enable + a repo event
or a manual dispatch.)

**(b) TABLE B — active crons that stopped firing (>48h).** **NONE.** The only active cron with a
last-scheduled run older than 48h is **automation-core / Bootstrap repos** (`0 4 * * 1`, weekly Monday
04:00 UTC) — last fired 2026-06-29 (Mon), age 103.5h ≈ 4.3 days < 8 days → **cadence-OK** (next tick
Mon 2026-07-06). All other active crons fired within 48h (paywall Poll 1.5h, paper-trader daily 16.8h,
plus every automation-core loop cron on 2026-07-03). One thing to watch (firing, not stopped):
**agent-memory / Sync from automation-core** last scheduled run 2026-07-03T06:32:39Z concluded
**failure** — it ticks but is failing; not a wake item, but a separate health flag.

**(c) Minutes Guard July-1 re-enable.** Healthy — every run schedule/success, ~30-min cadence. The
dedicated `5 0 1 * *` re-enable tick did **not** appear at/near 2026-07-01T00:05Z: GitHub delayed and
dropped the 00:00–01:30 UTC high-contention cron window (gap 06-30T23:04 → 07-01T01:37). The first
July-1 run (01:37:27Z) ran in **`Mode: detect`** (triggered by `*/30`), succeeded, and **committed
nothing**. It doesn't matter: `state/minutes-guard.json` is empty (`disabled_by_guard: {}`,
`last_pause_at: null`), so there was **nothing to re-enable** — exactly the expected "ran with nothing
to re-enable" outcome.

**(d) BOTTOM LINE — everything that should be awake IS awake.** No `disabled_inactivity` workflows, no
active cron has stopped firing, and the guard disabled nothing in June. **No wake commands are
warranted.** Two follow-ups for the owner (not auto-actions):
- The 13 `disabled_manually` workflows (OPT ×3, thai-rent-finder ×10) are owner-domain — leave
  disabled unless the owner wants them back (esp. the two `sync-automation-core` opt-outs).
- Coverage gap: **funzi7/percent-calculator** and **funzi7/quality-screener** are private fleet repos
  the guard sees but this session's scope excludes — re-run this audit with them in scope to close it.
- Minor health flag: **agent-memory** sync cron is firing-but-failing (07-03 06:32Z failure).
