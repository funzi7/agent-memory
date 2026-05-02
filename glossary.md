# thai-rent-finder — Glossary

> Terms and concepts specific to this project. Reference for agents that don't have full context.

## Core domain

**Listing** — A single rental unit currently offered. Has source, source_listing_id, scraped_at, and status. Multiple listings can map to one Building.

**Building** — A physical building/condo project. The cross-source connector. The same physical unit may appear as separate Listings on FazWaz and Renthub but share a Building.

**Source** — One of the supported rental websites being scraped. Enum: `THAILAND_PROPERTY`, `FAZWAZ`, `HIPFLAT`, `DDPROPERTY`, `LAZUDI`, `PROPERTY_SCOUT`, `RENTHUB`, `LIVING_INSIDER`.

**City** — One of 5 supported cities. Enum: `BKK` (Bangkok), `PTY` (Pattaya), `CMI` (Chiang Mai), `PHK` (Phuket), `SAM` (Koh Samui).

**ScrapeJob** — One row per scraper run. Tracks listings_added, listings_updated, listings_deactivated, error_count. Used by `/jobs` UI to show recent activity.

**Concern** — A flag attached to a listing indicating something to watch out for. Two types:
- `RULE` — deterministic checks (price way below building average, suspicious description)
- `AI` — LLM-generated observations
The "concerns recompute" admin endpoint regenerates all concerns from scratch.

**Saved Filter** — User-saved `/listings` query (city, price range, bedrooms, etc.). Persisted per-user.

## Scraper terms

**BaseScraper** — Abstract class in `src/scrapers/core/BaseScraper.ts` that all scrapers extend. Provides `scrapeCity()`, job lifecycle, deduplication, and DB writes.

**Detail page** — The per-listing page on a source site. Contains photos, full specs, contact info.

**Index page** — The per-city listings page on a source site. Contains cards with summary info + links to detail pages.

**Index-card filter** — A filter applied at the index page before fetching the detail page. Used to avoid wasting requests on listings we'd reject anyway (e.g., daily-only Renthub listings).

**Cross-source dedup** — The (future) process of matching the same physical unit across multiple sources via the Building model.

**Photo dedup** — Stripping URL variants of the same logical image. Implemented as `dedupeImageUrls()`.

**Monthly fallback** — In Renthub, using the index-card monthly price when the detail-page price is missing or zero. Implemented as `applyMonthlyFallback(detailPrice, cardMonthly)`.

**Stagger** — Spreading scraper cron times so daily runs don't all hit the DB simultaneously. Current schedule: 03:00 / 03:30 / 04:00 BKK.

## Source-specific URL terminology

### FazWaz
- Property-for-rent path: `/property-for-rent/thailand/{province}/{city}`
- Pattaya: `/property-for-rent/thailand/chon-buri/pattaya`

### Renthub
- Index by area: `/en/apartment/{slug}` (e.g., `/en/apartment/pattaya`)
- Listing detail: `/en/{listing-slug}` (e.g., `/en/poonsukplace-hotel`)
- Note: `/en/apartment/...` is the area page, `/en/{slug}` without `apartment/` is the individual listing

### Living Insider
- Index by zone: `/living_zone_en/{zone_id}/Condo/Rent/{page}/{slug}.html`
- Pattaya zone_id = **42**
- Listing detail: `/livingdetail_en/{listing_id}/{slug}.html`
- Project page: `/living_project_en/{zone}/{project_id}/Condo/all/all/{page}/Condo-{name}.html`

## Infrastructure terminology

**Tier 1 / Tier 2** (custom term, see architecture.md)
- Tier 1 = Vercel functions, simple HTTP scraping only
- Tier 2 = GitHub Actions, can use Playwright and bypass Cloudflare

**workflow_dispatch** — GitHub Actions trigger type for manual runs. Used for testing scrapers before re-enabling cron.

**Pooled vs non-pooled DB connection** — Vercel exposes both. Pooled = `POSTGRES_URL`, limited concurrent connections. Non-pooled = `POSTGRES_URL_NON_POOLING`, direct connection. CI batch jobs use non-pooled to avoid pool exhaustion when iterating through listings.

## Common UI strings (Hebrew)

- "מקור" — Source (in source filter)
- "מסונכרן יומית ב-GitHub Actions" — Synced daily on GitHub Actions
- "אין אירועים" — No events (empty state for activity feed)

## Codex bot

A GitHub-integrated AI reviewer that comments on PRs automatically. Different from this assistant (Claude). Catches logic bugs, unreachable code, etc. To request a fix from it inline: comment `@codex address that feedback` on the PR. Currently we don't use this — Claude Code handles fixes via separate prompts.
