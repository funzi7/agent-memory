# thai-rent-finder — Architecture

> Stable document. Update only when architecture itself changes.

## Stack

- **Frontend + API:** Next.js 14+ (App Router), TypeScript
- **Database:** Postgres on Vercel (Vercel Postgres / Neon)
- **ORM:** Prisma
- **Hosting (app):** Vercel
- **Hosting (heavy scraping):** GitHub Actions (free tier, ubuntu-latest)
- **Scraping (HTML):** plain `fetch` + Cheerio
- **Scraping (anti-bot):** Playwright with full Chromium
- **Styling:** Tailwind (verify)
- **UI language:** Hebrew, RTL primary
- **Domain language:** English in code, Hebrew in UI strings

## Two-tier scraping architecture

The big decision. Each source picks ONE tier:

### Tier 1: Vercel functions (`/api/scrape/[source]`)
- Runs in serverless function with 10–60s timeout
- Triggered by Vercel Cron OR manual button in `/jobs` UI
- Suitable for: simple HTML scraping with no anti-bot protection
- Limitation: cannot run Playwright (missing libnss3 + other Chromium deps)
- Currently used by: `THAILAND_PROPERTY`

### Tier 2: GitHub Actions (`scripts/scrape-cli.ts` + `.github/workflows/scrape-{source}.yml`)
- Runs on GH Actions runner (ubuntu-latest), 60min timeout
- Triggered by daily cron OR `workflow_dispatch`
- Required for: anti-bot sites (Cloudflare → FazWaz) or sites needing Playwright
- Used by: `FAZWAZ`, and any new scraper by default for consistency

**Default for new scrapers: Tier 2.** Only stay on Tier 1 if there's a specific reason (e.g., needs to be triggerable from the UI in real time).

## Database schema (key models)

```
Listing
  id, source (enum), source_listing_id, scraped_at, status
  city (enum: BKK/PTY/CMI/PHK/SAM), price_thb, sqm, bedrooms, bathrooms
  building_id (FK to Building, nullable)
  raw_data (JSONB)
  
Building
  id, name, city, location
  // Cross-source connector — same physical building seen on multiple sources
  
ScrapeJob
  id, source, started_at, finished_at, status
  listings_added, listings_updated, listings_deactivated, error_count
  
SavedFilter
  id, user_id, name, filters_json
  
Concern
  id, listing_id, type (RULE | AI), text, severity
```

(Verify exact field names in Prisma schema before referencing in code.)

## Source enum

Defined in Prisma schema:
- `THAILAND_PROPERTY`
- `FAZWAZ`
- `RENTHUB`
- `LIVING_INSIDER`
- `DDPROPERTY` (not yet implemented)
- `HIPFLAT` (not yet implemented)
- `LAZUDI` (not yet implemented)
- `PROPERTY_SCOUT` (not yet implemented)

## City enum

- `BKK` — Bangkok
- `PTY` — Pattaya
- `CMI` — Chiang Mai
- `PHK` — Phuket
- `SAM` — Koh Samui

## Scraper interface (BaseScraper)

All scrapers extend `BaseScraper` in `src/scrapers/core/BaseScraper.ts`:

```typescript
abstract class BaseScraper {
  abstract source: Source
  abstract scrapeCity(city: City, opts: ScrapeRunOptions): Promise<ScrapeResult>
  
  // Helpers available:
  protected async cleanOrphanedJobs()
  // ... others — verify in source
}

interface ScrapeRunOptions {
  limit?: number
  dryRun?: boolean
  prisma: PrismaClient
}

interface ScrapeResult {
  listingsAdded: number
  listingsUpdated: number
  listingsDeactivated: number
  errorCount: number
  jobId: string
}
```

## Key library functions

- `src/lib/image-utils.ts` → `dedupeImageUrls(urls: string[]): string[]`
  Normalizes image URLs across CDN size variants and removes duplicates.
  All scrapers must apply this before persisting photos.

- `scripts/scrape-cli.ts` — entry point for GH Actions scrapers
  Usage: `npx tsx scripts/scrape-cli.ts --source <name> --city <CODE> [--limit N] [--dry-run]`
  Exits via `process.exitCode` (not `process.exit`) to avoid log truncation.

## Routing decisions

- `/listings` — main user-facing list with filters (cities, sources, price, etc.)
- `/jobs` — admin-style page showing scraper status per source
- `/api/scrape/[source]` — Vercel-hosted scrapers; FazWaz returns 503 redirect
- `/api/admin/...` — admin endpoints (concerns recompute, etc.)

## Environment variables

- `DATABASE_URL` — Postgres connection string. **Must start with `postgres://` or `postgresql://`.**
  - On Vercel: use `POSTGRES_URL` or `POSTGRES_PRISMA_URL`
  - On GH Actions: use `POSTGRES_URL_NON_POOLING` (avoids pool exhaustion in CI)
- `NODE_ENV` — `production` in CI
- `VERCEL` — auto-set on Vercel, used by `src/scrapers/core/browser.ts` to switch Playwright config

## CI / GH Actions conventions

- One workflow file per scraper: `.github/workflows/scrape-{source}.yml`
- Matrix strategy: parallel jobs per city (5 cities)
- Daily cron at staggered times in Asia/Bangkok (avoid concurrent DB writes)
- Failure artifact upload: logs + Playwright report
- Required secret: `DATABASE_URL` (in repo Settings → Secrets → Actions)
