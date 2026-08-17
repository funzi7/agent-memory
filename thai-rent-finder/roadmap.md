# thai-rent-finder — Historical Roadmap

## Current source of truth (NOT this file)

- **Current actionable work:** the project root **`TODO.md`** (funzi7/thai-rent-finder).
- **Current handoff / latest state of the world:** **`cc-latest.md`**.
- **Current generated operational state** (sources, crons, health): **`state.md`**.

> Everything below is **historical implementation history**. It is a change-history
> record, NOT current runtime state and NOT a current TODO. Do not act on any item
> below as if it were pending today — cross-check against `TODO.md` + `cc-latest.md`,
> which win on every disagreement. Old cron schedules, listing counts, and "pending
> PR" notes in this file are frozen snapshots from when they were written.

---

## Historical milestones / batches (chronological)

### Batch 1 — GH Actions infra + FazWaz migration (PR #44, merged)
- `scripts/scrape-cli.ts` runner (`--source --city --limit --dry-run`).
- FazWaz refactored to full Playwright (not serverless Chromium); `/api/scrape/[source]`
  returns a 503 redirect for FazWaz; `.github/workflows/scrape-fazwaz.yml` (matrix-per-city).
- `/jobs` links to GH Actions; `docs/SETUP_GH_ACTIONS.md`.
- Outcome: FazWaz PTY produced 4 listings on first verified run.

### Batch 2 — Renthub + Living Insider stubs + photo dedup + source filter (PR #45, merged)
- `dedupeImageUrls()` utility (applied retroactively to FazWaz); Renthub + LI scraper
  stubs + workflows; source multi-select filter on `/listings`.

### Batch 2.5 — Scraper implementations + review fixes (PR #46, merged)
- Scheduled crons disabled until live verification; CLI `process.exitCode` (no log
  truncation); `found` excludes deactivations; RenthubScraper (plain HTTP + Cheerio,
  monthly-only filter, hotel reject, `applyMonthlyFallback()`); LivingInsiderScraper
  (PTY zone_id=42, expired/closed filter).

### Batch 2.6–2.9 — Renthub / FazWaz / LI bug fixes (PRs #47–#51, merged)
- Renthub city-stamping, Phuket leak filter, LINE-icon photo filter, structured logging.
- FazWaz city fix, `city-stamping.ts` extraction, pre-fetch slicing, `closeBrowser()` in
  finally, scrape-cli 5s force-exit failsafe; `photo-filters.ts`; admin
  `cleanup-icon-photos` + `audit-listings`.
- LI anchor-first dedup by source_id.

### Batch 3.0–3.1 — Living Insider data quality (PR #52 + follow-ups, merged)
- `isLikelyTitle` heuristic, `parseLiCardRooms` tightened, `parseLiPrice` requires /mo,
  `cleanCardText`, Thai `สตูดิโอ` studio detection, content-based title gate.

### EnableCrons (direct push to main, e2e8753)
- Enabled the FazWaz / Renthub / Living Insider daily crons (at the time). Cadence has
  since changed — see `state.md` for the current schedule.

### Batch 4 — Hipflat + Lazudi + LI polish (PR #53, merged)
- Hipflat Tier 2 (incremental skip); Lazudi Tier 2 (min-term filter); LI specs-only
  title fix. Outcome at the time: Lazudi verified (~10 listings); Hipflat hit Cloudflare
  403 and was dropped to future investigation.

### Solo-use + data-quality batches (PRs #82, #84, #85, #88, merged)
- Deactivation data-safety exemption for curated (SHORTLIST-or-better) listings.
- Solo cadence narrowing + AI-concerns cleanup (4 approved categories, plain Hebrew;
  dropped low-value wifi/furniture/pets cards).
- Search / sort / favorites==status unification / Lazudi enrichment.
- "עודכן" dates, mobile search + recent-search chips, dead-concern cleanup.

### Reliability milestone + manager follow-up (PR #93, OPEN as of 2026-08)
Branch `fix/trf-reality-sync-data-safety`. This is the current in-flight PR — details
live in `cc-latest.md`. Summary:
- Fail-closed data-safety: an acquisition failure (403/429/5xx/challenge/fetch-fail, and
  ambiguous HTTP-200 page-1 zero-card) no longer stale-sweeps; `ScrapeJob` status is
  `SUCCESS`/`PARTIAL`/`FAILED`; runners (`scrape-cli.ts` + `scrape.ts`) exit non-zero on
  FAILED so the workflow can go red.
- Lazudi + Living Insider paused (verified runner-IP 403); parser fixes retained.
- Health/state honesty: site-health 307-redirect false alert fixed + healthy-path issue
  closure; `/api/admin/health` `paused_sources`; `generate-state.js` corrected (TP = GH
  Actions, live workflow state, paused/broken states); `/jobs` PARTIAL status; Daily
  Checkup renders paused sources.
- Docs reconciliation; private-name removal.

---

## What happened to the old open items (bugs / UX / features)

The pre-2026-08 "Top priority bugs / UX / features" lists are resolved or moved. Fate,
without fabricated PR/date mappings where none is evidenced:

**Shipped since (no longer open):**
- Free-text search (`q` param, `SearchBox`); persistent/saved filters (`SavedFilter`
  model, `SavedFiltersBar`); max-price 40K (`MAX_PRICE_DEFAULT`); filters actually apply
  (SSR reflects params); favorites unified with status (no separate boolean); current
  apartment + comparison (`/settings/current`, `/compare`, `current_*` fields); contact
  details (`contact_*` fields, `ContactActions`); mobile search visible without opening
  filters. RTL number rendering is handled via the `Ltr` component / `PriceDisplay`.

**Still current work — see root `TODO.md` (do not duplicate here):**
- Building enrichment + canonical building-name cleanup + per-source building-name
  extraction; cross-source Building/unit dedup; broader Thailand geographic coverage;
  back-navigation scroll restoration; light theme; direct 404/gone detection in rescrape.
- Hebrew search translation is a **known limitation** (literal match on title/
  building_name; a Hebrew query won't match English source text) — tracked in TODO.md,
  not a "bug".

**Considered and NOT built (dropped / not in current scope):**
- DDProperty and Property Scout scrapers (planned "Batch 5/6", never implemented).
- Facebook Marketplace/groups, Airbnb, Bahtsold, sale listings — explicitly out of scope
  (anti-bot / ToS / short-term / low-signal / rentals-only).
- Hipflat scheduled scraping — disabled (Cloudflare 403 from the runner); code retained.

**DevOps automation (historical):** the Codex auto-fix flow, CI Watcher endpoint
(`/api/admin/ci-runs`), and the self-healing loop shipped. The current automation
workflows are being synced via the separate open PR #92 (kept isolated from PR #93).
