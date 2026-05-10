# thai-rent-finder — State

> Living document. Auto-updated daily at 02:00 UTC by `auto-update-state.yml`.
> Last auto-update: 2026-05-10
> Production: https://thai-rent-finder.vercel.app
> Total listings in DB: 1226

## Sources status (current)

| Source | Tier | Cron (ICT) | Status | Listings 7d |
|--------|------|------------|--------|-------------|
| FAZWAZ | 2 (GH Actions) | 03:00 | ✅ active | 164 |
| RENTHUB | 2 (GH Actions) | 03:30 | ✅ active | 712 |
| LIVING_INSIDER | 2 (GH Actions) | 04:00 | ✅ active | 159 |
| LAZUDI | 2 (GH Actions) | 05:30 | ✅ active | 58 |
| THAILAND_PROPERTY | 1 (Vercel) | n/a | ✅ active | 62 |
| HIPFLAT | 3 (deferred) | n/a | 🔴 deferred (Cloudflare 403) | n/a |

## Recently merged PRs (last 7 days)

- **#70** — fix: 4 critical CI automation issues (closes #65, #69)
- **#68** — feat(ci): codex auto-fix catches inline review comments too
- **#67** — feat(ci): daily Telegram checkup with health summary
- **#66** — feat(ci): auto-update state.md daily from production data
- **#63** — feat(ci): trigger Codex on site-health issues automatically
- **#62** — feat(ci): site health workflow + /api/admin/health endpoint
- **#61** — fix(ui): migrate legacy maxPrice=25000 in saved filters (Codex P1 from PR #58)
- **#60** — fix(ci): archive_codex_summary catches pull_request_review events
- **#59** — fix(ui): filter persistence actually applies on mount (B5 follow-up)
- **#58** — fix(ui): RTL sqm display, Apply button, persistent filters, max price 40K
- **#57** — feat(ci): archive Codex summaries to agent-memory automatically
- **#56** — feat(ci): auto-trigger Codex fix on P1/P2 reviews
- **#55** — feat(api): CI Watcher endpoint for Claude Project automation
- **#54** — feat: Hipflat + Lazudi scrapers (Tier 2 GH Actions) + Living Insider polish
- **#53** — fix: Living Insider price extraction (multiple formats + URL fallback) + tighter title heuristic
- **#52** — fix: Living Insider title/specs/price extraction + Codex reviews

## Open issues

- **#64** — Site Health Alert — 2026-05-04 _(site-health, auto-detected)_

## Active workflows

- `scrape-fazwaz.yml` — cron `0 20 * * *` UTC
- `scrape-hipflat.yml` — cron `0 22 * * *` UTC
- `scrape-lazudi.yml` — cron `30 22 * * *` UTC
- `scrape-living-insider.yml` — cron `0 21 * * *` UTC
- `scrape-renthub.yml` — cron `30 20 * * *` UTC
- `auto-update-state.yml` — cron `0 2 * * *` UTC
- `codex-auto-fix.yml`
- `daily-checkup.yml` — cron `30 1 * * *` UTC
- `scrape.yml` — cron `0 2,14 * * *` UTC
- `site-health.yml` — cron `0 1 * * *` UTC

## Admin endpoints

- `/api/admin/audit-listings`
- `/api/admin/backfill-buildings`
- `/api/admin/ci-runs`
- `/api/admin/cleanup-icon-photos`
- `/api/admin/cleanup-seeded`
- `/api/admin/concerns-recompute-all`
- `/api/admin/health`
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

_Auto-generated. Add manual content between `<!-- manual-section-start -->` and `<!-- manual-section-end -->` markers — the workflow appends preserved blocks at the file tail._

_Auto-generated. Add manual content between `<!-- manual-section-start -->` and `<!-- manual-section-end -->` markers — the workflow appends preserved blocks at the file tail._

_Auto-generated. Add manual content between `<!-- manual-section-start -->` and `<!-- manual-section-end -->` markers — the workflow appends preserved blocks at the file tail._
_Auto-generated. Add manual content between `<!-- manual-section-start -->` and `<!-- manual-section-end -->` markers — the workflow appends preserved blocks at the file tail._
_Auto-generated. Add manual content between `<!-- manual-section-start -->` and `<!-- manual-section-end -->` markers — the workflow appends preserved blocks at the file tail._
_Auto-generated. Add manual content between `<!-- manual-section-start -->` and `<!-- manual-section-end -->` markers — the workflow appends preserved blocks at the file tail._
