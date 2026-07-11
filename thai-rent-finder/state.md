# thai-rent-finder — State

> Living document. Auto-updated daily at 02:00 UTC by `auto-update-state.yml`.
> Last auto-update: 2026-07-11
> Production: https://thai-rent-finder.vercel.app
> Total listings in DB: 1866

## Sources status (current)

| Source | Tier | Cron (ICT) | Status | Listings 7d |
|--------|------|------------|--------|-------------|
| FAZWAZ | 2 (GH Actions) | 03:00 | ✅ active | 70 |
| RENTHUB | 2 (GH Actions) | 03:30 | ✅ active | 550 |
| LIVING_INSIDER | 2 (GH Actions) | 04:00 | ⚠️ no fresh listings | 0 |
| LAZUDI | 2 (GH Actions) | 05:30 | ✅ active | 60 |
| THAILAND_PROPERTY | 1 (Vercel) | n/a | ✅ active | 32 |
| HIPFLAT | 3 (deferred) | n/a | 🔴 deferred (Cloudflare 403) | n/a |

## Recently merged PRs (last 7 days)

- **#91** — chore(automation): sync from automation-core
- **#90** — chore(automation): sync from automation-core
- **#88** — Enrich Lazudi extraction, "עודכן" dates, mobile search + recents, dead-concern cleanup
- **#89** — chore(automation): sync from automation-core
- **#87** — chore(automation): sync from automation-core
- **#86** — fix(saved-filters): persist new listing filters
- **#85** — Search + sort/range filters, favorites AND status, building name on card, Lazudi description
- **#84** — Solo-use cadence + leaner Hebrew concerns + state.md footer fix
- **#82** — fix(scraper): stop staleness sweep from deactivating user-curated listings
- **#73** — fix(scripts): derive Telegram source list from health endpoint (closes #72)
- **#81** — chore(automation): sync from automation-core

## Open issues

- **#83** — Site Health Alert — 2026-07-05 _(site-health, auto-detected, claude-fix)_

## Active workflows

- `scrape-fazwaz.yml` — cron `0 20 3-31/3 * *` UTC
- `scrape-hipflat.yml` — cron `0 22 * * *` UTC
- `scrape-lazudi.yml` — cron `30 22 2-31/3 * *` UTC
- `scrape-living-insider.yml` — cron `0 21 3-31/3 * *` UTC
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
