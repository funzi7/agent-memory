# automation-core — latest Claude Code status

## fix #22 — minutes-guard monthly re-enable: off-peak tick + day-1/2 fallback

**main commit `ec732d2`** (direct to main, ONE commit, author funzi7). `minutes-guard.yml` is
**hub-only** — a single copy in `.github/workflows/`, not in `sync-config.synced_workflows`, so there
is **no `workflows/` copy** and the byte-identical-across-dirs check is N/A (no spurious sync-source
copy was created). `yaml.safe_load` + actionlint pass; `node --check` on the guard script body OK.

### The bug (proven this month)
The monthly re-enable depended on a **single `5 0 1 * *` (00:05 UTC on the 1st)** cron tick — GitHub's
most congested cron window. It was **empirically dropped on 2026-07-01**: the minutes-guard run history
shows a gap **2026-06-30T23:04Z → 2026-07-01T01:37Z**, so the monthly tick never fired; the 01:37 run
was a `*/30` detect tick (`Mode: detect`). The guard state happened to be empty this month, so nothing
was lost — but had the guard been holding disabled workflows, re-enable would have been **missed for the
entire month**.

### Change 1 — move the tick off-peak
Replaced `5 0 1 * *` with **`23 2 1 * *` (02:23 UTC on the 1st)** in BOTH the `on.schedule` list AND the
`MONTHLY_REENABLE_CRON` env — the two are kept **equal** (the mode resolution compares
`github.event.schedule` to that env, so they must match). Header + inline comments updated to 02:23 UTC
with a note on why (top-of-hour on the 1st is congested and was dropped 2026-07-01).

### Change 2 — date-based fallback (a dropped tick can never skip a month)
Placed right after `const state = loadState();` — the earliest point where BOTH `mode` and the loaded
`state` exist, before any mode-dependent branching:
```
let modeFromFallback = false;
if (mode === 'detect') {
  const dom = new Date().getUTCDate();
  if (dom <= 2 && Object.keys(state.disabled_by_guard || {}).length > 0) {
    mode = 're-enable';
    modeFromFallback = true;
    core.info('Day-1/2 fallback: guard state non-empty and the monthly tick may have been dropped — switching to re-enable.');
  }
}
```
So on the 1st or 2nd, any `*/30` detect tick whose guard state still holds disabled workflows switches
itself to re-enable. **Idempotent** by design: re-enable empties `disabled_by_guard`, so subsequent
day-1/2 detect ticks stay `detect`. The summary **Trigger** label now names the `day-1/2 fallback` case.
Preserved untouched: H1 non-main dry-run, `dry_run` input semantics, H2 cooldown (re-enable still sets
`last_enable_at`), H3 confirmed-enable-only state removal.

### Validation
`yaml.safe_load` + actionlint on `.github/workflows/minutes-guard.yml`; `node --check` on the guard
script body; greps — **ZERO** `5 0 1 * *` anywhere, `23 2 1 * *` present in exactly the two required
places (cron + env, equal), the fallback block present after state load; name-guard clean.

**Handoffs updated in the same commit:** `handoffs/CONTEXT.md` (minutes-guard section — new 02:23 UTC
tick + day-1/2 fallback + the July-1 dropped-window evidence), `LOOP_STATE.md` (minutes-guard.yml fix
#22 entry), `handoffs/loop-build.md` (dated entry).

**Next:** on 2026-08-01 the re-enable fires at 02:23 UTC; if that tick is also dropped, the first
day-1/2 `*/30` detect tick with non-empty guard state re-enables instead. (Hub-only workflow — no
downstream sync.)
