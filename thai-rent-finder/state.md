# thai-rent-finder — State

> Living document. Auto-updated daily at 02:00 UTC by `auto-update-state.yml`.
> Manually reconciled 2026-08-17 (reliability milestone, PR #93). The generator was
> fixed in that same PR; once it merges, the next auto-run reproduces this table. Until
> then the daily run still uses the old (deployed) generator and may revert the fixes
> below (TP shown as Vercel, LI/Lazudi as "no fresh listings").
> Production: https://thai-rent-finder.vercel.app
> Active listings (live /api/health 2026-08-17): 949

## Sources status (current)

Every scraper runs on **GitHub Actions (Tier 2)** — there is no Vercel-cron scraping.

| Source | Tier | Cron (ICT) | Status | Listings 7d |
|--------|------|------------|--------|-------------|
| RENTHUB | 2 (GH Actions) | 03:30 | ✅ active | 491 |
| FAZWAZ | 2 (GH Actions) | 03:00 | ✅ active | 65 |
| THAILAND_PROPERTY | 2 (GH Actions) | 09:00 | ✅ active | ~32 |
| LIVING_INSIDER | 2 (GH Actions) | paused | ⏸️ paused (runner-IP HTTP 403) | n/a |
| LAZUDI | 2 (GH Actions) | paused | ⏸️ paused (runner-IP Cloudflare 403) | n/a |
| HIPFLAT | 2 (GH Actions) | paused | ⏸️ disabled_manually (Cloudflare 403) | n/a |

## Recently merged PRs (last 7 days)

_No PRs merged in last 7 days_

## Open PRs

- **#93** — reliability milestone (data-safety, honest status, pause LI/Lazudi,
  state/health/docs reconciliation) — OPEN, not merged.
- **#92** — `chore(automation): sync from automation-core` (7 workflow files) — OPEN.

## Open issues

- **#83** — Site Health Alert — 2026-07-05 _(site-health, auto-detected, claude-fix)_ —
  keep OPEN until post-deploy proof of health (the `homepage (HTTP 307)` false alert is
  fixed in #93; `stale sources: LI/Lazudi` now represented as PAUSED).

## Active workflows

- `scrape-fazwaz.yml` — cron `0 20 3-31/3 * *` UTC
- `scrape-hipflat.yml` — **disabled_manually** (schedule commented out)
- `scrape-lazudi.yml` — **paused** in #93 (schedule commented out; workflow_dispatch kept)
- `scrape-living-insider.yml` — **paused** in #93 (schedule commented out; workflow_dispatch kept)
- `scrape-renthub.yml` — cron `30 20 2-31/3 * *` UTC
- `auto-update-state.yml` — cron `0 2 * * *` UTC
- `ci-doctor.yml` — cron `0 6,18 * * *` UTC
- `claude-fallback-watchdog.yml` — cron `2-59/5 * * * *` UTC
- `claude.yml`
- `codex-auto-fix.yml`
- `codex-backup-fix.yml`
- `codex-gate.yml`
- `daily-checkup.yml` — cron `30 1 * * *` UTC
- `merge-bot.yml` — cron `30 7 * * *` UTC
- `pr-build-gate.yml`
- `scrape.yml` — cron `0 2 */3 * *` UTC
- `site-health.yml` — cron `0 1 * * *` UTC
- `sync-automation-core.yml` — cron `0 3 * * *` UTC

## Admin endpoints

- `/api/admin/audit-listings`
- `/api/admin/backfill-buildings`
- `/api/admin/ci-runs`
- `/api/admin/cleanup-dead-concerns`
- `/api/admin/cleanup-icon-photos`
- `/api/admin/cleanup-seeded`
- `/api/admin/concerns-recompute-all`
- `/api/admin/health`
- `/api/admin/reactivate-curated`
- `/api/admin/recompute-cities`
- `/api/admin/regenerate-summaries-all`
- `/api/admin/rescrape-all`
- `/api/admin/review-costs`

## Claude.ai Projects (manual list)

- TRF — State Tracker
- TRF — Spec Writer
- TRF — Bug Triage
- TRF — PR Reviewer
- TRF — Scraper Doctor
- TRF — CI Watcher
- TRF — Site Doctor

---

_Auto-generated daily by `auto-update-state.yml`. Manual notes are preserved across regenerations when wrapped between the manual-section start and end markers (paired HTML comments, each on its own line); the workflow re-appends that block at the file tail._
