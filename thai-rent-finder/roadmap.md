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

### Batch 2.5 — Scraper implementations + P2 review fixes (PR #46, merged 2026-05-02)
- Disabled scheduled crons until live verification (P1 from Codex review)
- CLI uses `process.exitCode` to avoid log truncation (P2)
- `found` excludes deactivated count (P2)
- `status_min` validation gated behind AI source (P2)
- RenthubScraper: plain HTTP + Cheerio, monthly-only filter, hotel reject, defensive selectors, `applyMonthlyFallback()` for index-card price recovery
- LivingInsiderScraper: PTY only (zone_id=42), expired/closed filter, other cities throw "zone not yet mapped"

**Outcome:** Merged. Live workflow_dispatch surfaced 6 bugs handled in Batch 2.6. Crons remain disabled.

## Next batches

### Batch 2.6 — Renthub bug fixes + Living Insider diagnostics + CLI case-insensitive (next PR)

Branch: `claude/fix-renthub-li-bugs`
PR title: `fix: Renthub city/photo/limit bugs + Living Insider diagnostics + CLI case-insensitive`

Commit order (one bug per commit):
1. `fix(cli): accept case-insensitive --city` — `scripts/scrape-cli.ts` uppercases `args.city` before validating against `['BKK','PTY','CMI','PHK','SAM']`. Update `inputs.city` description in `scrape-renthub.yml`, `scrape-living-insider.yml`, `scrape-fazwaz.yml` to note case-insensitive. Don't touch matrix arrays — already uppercase.
2. `fix(renthub): persist Listing.city from --city arg, not default` — bug 1. PTY run produced 14 listings all filed as BKK. Thread `cityCode` from `scrapeCity()` through to the Prisma upsert; remove any default of BKK in the constructor. Add an in-runner assertion: scrape PTY → every returned listing has `city: 'PTY'`.
3. `fix(renthub): reject listings whose detail location doesn't match requested city` — bug 2. Some PTY-bucketed listings actually showed Phuket on the detail page; index page likely includes a "popular nearby" / "recommended in Thailand" container. Tighten `parseListingLinks()` to the main listings container only (inspect `https://www.renthub.in.th/en/apartment/pattaya` and document the chosen selector in code). Defense in depth: `parseDetail()` extracts location text and rejects if it doesn't contain expected city substring (`pattaya`/`chonburi`, `bangkok`, `phuket`, etc.).
4. `fix(renthub): filter out contact/UI icons from photo extraction` — bug 3. Photo URLs were resolving to LINE/email icons. In `parseDetail()` photo extraction, drop URLs whose path contains `line`, `messenger`, `whatsapp`, `facebook`, `email`, `mail`, `contact`, `icon`, `logo`; drop known icon CDNs (`cdn-icons-png.flaticon.com`); drop images <200x200 if dimensions known. If filtering leaves zero photos, persist `photos: []` (UI handles empty).
5. `fix(renthub): apply --limit as post-filter cap` — bug 4. `--limit 10` produced ~14 listings. Slice `validListings` to `limit` immediately before returning from `scrapeCity()`; comment that limit is post-filter, not pre-filter.
6. `feat(living-insider): add structured logging to diagnose 0-listings issue` — bug 5. `livinginsider.ts` succeeded in 34s with 0 persisted listings. Don't guess the cause — add JSON-line logs at: `index_fetch` (url, status), `index_parsed` (cardsFound, sample hrefs), `detail_fetch` (url, status), `listing_filtered` (url, reason), `listing_persisted` (url, city, sourceId). Re-run workflow_dispatch; the first failing step will be obvious from CI output. Likely candidates: index selector matched 0 elements, all listings hit expired/closed filter, pagination broke, zone_id=42 stale. Fix the actual root cause in a follow-up commit if logging exposes it; do not ship a guess.

**Acceptance:**
- PR opened, branch pushed
- `tsc --noEmit` clean, `next build` green
- After merge + workflow_dispatch:
  - Renthub city=PTY limit=10 → DB has ≤10 listings, all `city=PTY`, all with property photos OR empty photo array (no LINE icons)
  - Living Insider city=PTY limit=10 → either listings appear, OR CI logs show exactly where the parser bails (follow-up if 0 still)

**After this PR:** verify both scrapers produce clean data → uncomment `schedule:` blocks in both yml files → mark RENTHUB + LIVING_INSIDER as ✅ Verified live in `state.md` → start Batch 3.

**Out of scope for Batch 2.6:** FazWaz; new sources (DDProperty/Hipflat/Lazudi are Batch 3); the harmless `"No files were found with the provided path: *.log"` GH Actions warning.

### Batch 3 — Mid-difficulty sources (after Batch 2.6 verified live)
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
