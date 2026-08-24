# thai-rent-finder — State

> Living document. Auto-updated daily at 02:00 UTC by `auto-update-state.yml`.
> Last auto-update: 2026-08-24
> Production: https://thai-rent-finder.vercel.app
> Total listings in DB: 2373

## Sources status (current)

| Source | Tier | Cron (ICT) | Status | Listings 7d |
|--------|------|------------|--------|-------------|
| FAZWAZ | 2 (GH Actions) | 03:00 | 🔴 broken (0 fresh, stale) | 0 |
| RENTHUB | 2 (GH Actions) | 03:30 | ✅ active | 524 |
| THAILAND_PROPERTY | 2 (GH Actions) | 09:00 | 🔴 broken (0 fresh, stale) | 0 |
| LIVING_INSIDER | 2 (GH Actions) | paused | ⏸️ paused (access blocked) | n/a |
| LAZUDI | 2 (GH Actions) | paused | ⏸️ paused (access blocked) | n/a |
| HIPFLAT | 2 (GH Actions) | paused | ⏸️ paused (access blocked) | n/a |

## Recently merged PRs (last 7 days)

- **#93** — fix(reliability): fail-closed data-safety, honest scraper status, pause LI/Lazudi, reconcile state/health/docs

## Open issues

- **#94** — Site Health Alert — 2026-08-24 _(site-health, auto-detected, claude-fix)_

## Active workflows

- `scrape-fazwaz.yml` — cron `0 20 3-31/3 * *` UTC
- `scrape-hipflat.yml`
- `scrape-lazudi.yml`
- `scrape-living-insider.yml`
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
