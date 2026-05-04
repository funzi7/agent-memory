# thai-rent-finder — State

`Last updated: 2026-05-05 04:30 ICT`

## Sources status (current)

| Source            | Tier            | Cron (ICT) | Status                          | Listings 7d |
|-------------------|-----------------|------------|---------------------------------|-------------|
| FAZWAZ            | 2 (GH Actions)  | 03:00      | ✅ active                       | 73          |
| RENTHUB           | 2 (GH Actions)  | 03:30      | ✅ active                       | 542         |
| LIVING_INSIDER    | 2 (GH Actions)  | 04:00      | ✅ active                       | 156         |
| LAZUDI            | 2 (GH Actions)  | 05:30      | ✅ active                       | 50          |
| THAILAND_PROPERTY | 1 (Vercel)      | n/a        | ⚠️ suspect (0 in 7d)            | 0           |
| HIPFLAT           | 3               | n/a        | 🔴 deferred (Cloudflare 403)    | n/a         |

## Recently merged PRs

- **#54** — Lazudi scraper + min-term filter (Codex P1 fix)
- **#55** — CI Watcher endpoint at `/api/admin/ci-runs`
- **#56** — Codex auto-fix workflow (P1/P2 trigger)
- **#57** — Codex Summary archive to agent-memory
- **#58** — UX batch: RTL sqm, Apply button, persistent filters, max 40K
- **#59** — Filter persistence real fix (useEffect ordering race)
- **#60** — `archive_codex_summary` catches PR reviews
- **#61** — Migrate legacy `maxPrice=25000` in saved filters
- **#62** — Site Health workflow + `/api/admin/health` endpoint
- **#63** — Codex trigger on site-health issues

## Pending issues

- ⚠️ **THAILAND_PROPERTY scraper investigation** — 0 listings in 7 days, status unknown. Tier 1 (Vercel-hosted, no GH Actions cron), so the freshness signal didn't surface in scraper workflow logs. First action: hit `/api/scrape/THAILAND_PROPERTY?key=...` and inspect response.
- ⚠️ **Scheduled scrape run id 25328922523** — cancelled after 30 min, needs root cause. Check `/api/admin/ci-runs?key=...&run_id=25328922523` for structured-event log.

## Automation infrastructure

### Active workflows

- `scrape-fazwaz.yml` — daily 20:00 UTC (03:00 ICT)
- `scrape-renthub.yml` — daily 20:30 UTC (03:30 ICT)
- `scrape-living-insider.yml` — daily 21:00 UTC (04:00 ICT)
- `scrape-lazudi.yml` — daily 22:30 UTC (05:30 ICT)
- `site-health.yml` — daily 01:00 UTC (08:00 ICT, after all scrapers)
- `codex-auto-fix.yml` — on PR review/comment + on issue with label `site-health`

### Endpoints

- `/api/admin/ci-runs?key=...` — GitHub Actions runs (used by CI Watcher Project)
- `/api/admin/health?key=...` — DB freshness + uptime
- `/api/admin/cleanup-icon-photos?key=...` — Renthub LINE icon cleanup
- `/api/admin/audit-listings?key=...` — listing audit

### Claude.ai Projects

- TRF — State Tracker
- TRF — Spec Writer
- TRF — Bug Triage
- TRF — PR Reviewer
- TRF — Scraper Doctor
- TRF — CI Watcher
- TRF — Site Doctor