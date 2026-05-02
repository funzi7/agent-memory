# thai-rent-finder — Roadmap

> History of completed work + forward plan. Update at end of each batch.

## Completed batches

### Batch 1 — GH Actions infra + FazWaz migration (PR #44, merged)
- `scripts/scrape-cli.ts` runner with `--source --city --limit --dry-run`
- Refactored FazWaz to use full Playwright (not serverless Chromium)
- `/api/scrape/[source]` returns 503 redirect for FazWaz
- `.github/workflows/scrape-fazwaz.yml` with daily cron + matrix-per-city
- `/jobs` page shows GH Actions link instead of broken sync button
- `docs/SETUP_GH_ACTIONS.md`

**Outcome:** FazWaz PTY produced 4 listings on first verified run. Low number — possibly real low long-term inventory, possibly pagination not paging. Investigate later.

### Batch 2 — Renthub + Living Insider stubs + photo dedup + source filter (PR #45, merged)
- `dedupeImageUrls()` utility + applied retroactively to FazWaz
- Renthub + Living Insider scraper stubs (threw "not yet implemented")
- Workflows for both
- Source multi-select filter on `/listings`
- Bumped GH Actions versions to silence Node 20 deprecation warnings

**Outcome:** Stubs only — sandbox couldn't access live sites for verification. Bodies left for Batch 2.5.

### Batch 2.5 — Scraper implementations + P2 review fixes (PR #46, awaiting merge)
- Disabled scheduled crons until live verification (P1 from Codex review)
- CLI uses `process.exitCode` to avoid log truncation (P2)
- `found` excludes deactivated count (P2)
- `status_min` validation gated behind AI source (P2)
- RenthubScraper: plain HTTP + Cheerio, monthly-only filter, hotel reject, defensive selectors, `applyMonthlyFallback()` for index-card price recovery
- LivingInsiderScraper: PTY only (zone_id=42), expired/closed filter, other cities throw "zone not yet mapped"

**Outcome:** Implementation complete but unverified live. Crons remain disabled — user enables manually after `workflow_dispatch` confirms `listings_added > 0`.

## Next batches

### Batch 3 — Mid-difficulty sources (after Batch 2.5 verified live)
Three sources, all need API discovery before HTML parsing:
- DDProperty — uses Next.js, has `__NEXT_DATA__` JSON in HTML
- Hipflat — has internal JSON API behind the listings pages
- Lazudi — internal API as well

Strategy: Live inspection first (this assistant via web_fetch), then a single batch with all three. Each scraper is shorter than HTML-parsing because the API returns structured data.

### Batch 4 — Property Scout (Playwright)
- Anti-bot heavier than FazWaz
- Will use Playwright on GH Actions
- Reuses the FazWaz tier-2 pattern

### Batch 5 — Cross-source dedup
- The Building model exists. Improve cross-source deduplication using:
  - Building name + city + bedroom count + sqm range + price range
  - Heuristic: same building + same bedrooms ± 5% sqm = likely same physical unit
- UI: show "זמין גם ב-{source}" badge on listing cards when match found across sources

### Maybe later
- Listing Quality Inspector — periodic job that flags listings with missing photos, suspicious prices, expired-likely. Surfaces in `/jobs` admin view.
- Drill-down per source (last 10 errors, time-series of listings_added)
- "Best deals" — listings priced significantly below building average

### Explicitly out of scope
- Facebook Marketplace / groups (anti-bot + ToS)
- Airbnb (short-term, not the use case)
- Bahtsold (low signal, no structured rental data)
- Sale listings (rentals only)
