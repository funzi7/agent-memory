# thai-rent-finder — Gotchas

> Hard-won lessons. Add to this file every time something burns hours of debugging.

## Infrastructure

### Playwright cannot run on Vercel functions
**Symptom:** `libnss3.so: cannot open shared object file: No such file or directory`
**Reason:** Vercel's serverless runtime doesn't include the Chromium shared libraries. `@sparticuz/chromium` and similar workarounds are fragile and often break.
**Fix:** Move any Playwright-using scraper to GitHub Actions. There's no clean fix for Vercel.

### DATABASE_URL must use `postgres://` protocol
**Symptom:** `the URL must start with the protocol postgresql:// or postgres://`
**Reason:** Vercel exposes multiple env vars per Postgres integration. `DATABASE_URL` sometimes points to a Prisma Accelerate URL (`prisma://...`) which Prisma client itself rejects in non-Vercel runtimes.
**Fix:** In GH Actions secrets, use the value of `POSTGRES_URL_NON_POOLING` from Vercel — it's a real `postgres://` URL and bypasses the connection pooler (better for batch CI jobs that open/close connections per listing).

### Cloudflare blocks Vercel function IPs
**Symptom:** HTTP 403 with "Just a moment..." page from `fazwaz.com`
**Reason:** Cloudflare's bot scoring is harsher on cloud-provider IP ranges. Vercel's serverless IPs are flagged.
**Fix:** Run on GH Actions (different IP range, less aggressively rate-limited). Adding stealth tweaks (`--disable-blink-features=AutomationControlled`, removing `navigator.webdriver`) helps but isn't enough alone.

## Scraping

### Renthub is mostly daily rentals
**Symptom:** Naive scraping returns hotels, hostels, daily rooms.
**Reason:** Renthub's primary market is short-term. Most cards show only `THB/day`, even when displayed on monthly-search pages.
**Fix:** Apply a strict index-card filter: only keep cards that show `THB/month` AND aren't titled "Hotel", "Resort", "Guesthouse". Even with this, expect 80%+ of cards to be rejected — that's correct.

### Renthub detail page sometimes hides the monthly price
**Symptom:** Index card shows "8,000 THB/month" but detail page returns `price_thb: 0`.
**Reason:** Some Renthub detail pages use markup variants the parser doesn't catch. The card data is more reliable for price than the detail page.
**Fix:** Carry the index-card monthly price forward; if detail parse returns 0, fall back to the card price. Implemented as `applyMonthlyFallback()` in `src/scrapers/sources/renthub.ts`.
**Trap:** Order matters. Apply the fallback BEFORE the zero-price guard, or the fallback is unreachable. (Caught by Codex in PR #46.)

### Living Insider has expired and closed listings
**Symptom:** Scraper persists listings that are no longer rentable.
**Reason:** Living Insider doesn't 404 expired listings — they remain accessible with a banner.
**Fix:** Check detail page for "Listing was expired" / "This posts has expired" / "Close the deal" / "This listing has been closed" before persisting.

### Photo URLs come in 2-4 size/quality variants
**Symptom:** A listing has 12 "photos" but they're 3 unique images at 4 sizes each.
**Fix:** Use `dedupeImageUrls()` from `src/lib/image-utils.ts`. Strips size suffixes (`-300x200`, `_w400`), Cloudinary-style segments (`/w_400,h_300/`), and treats `.webp`/`.jpg`/`.png` as the same logical image. Picks the variant most likely to be highest quality.

## CLI and CI

### `process.exit(0)` truncates GH Actions logs
**Symptom:** Final `done`/`error` JSON event missing from workflow logs intermittently.
**Reason:** `process.exit` terminates before stdout pipes flush.
**Fix:** Set `process.exitCode` and let the function return naturally. Event loop drains, `finally` block runs, logs flush.

### `found` count must exclude deactivated listings
**Symptom:** Run reports `found: 50` even when scrape mostly failed; investigation shows most of those 50 are stale rows that got auto-deactivated.
**Reason:** Including deactivations conflates "what we saw" with "what we cleaned up".
**Fix:** `found = listingsAdded + listingsUpdated`. Deactivations go in their own field.

## Process / workflow

### Sandbox in Claude Code can't reach external sites
**Symptom:** Claude Code reports it can't verify scraper selectors against live HTML.
**Reason:** The build sandbox has no outbound network.
**Fix:** Two options: (a) Claude (this assistant) does live web_fetch inspection up front and provides URL patterns + selectors in the prompt; (b) Claude Code ships best-effort code, then verifies via `workflow_dispatch` after merge. Option (a) is faster for known sites; (b) is the only option if a site's structure can't be predicted.

### Codex bot reviews PRs after open
**Useful for catching:** logic ordering bugs (the unreachable monthly fallback), unreachable guards, cron noise from stub workflows.
**Not a substitute for:** human review of scraper outputs against real listings. Codex can't tell you that 4 PTY listings is suspiciously low.
**To respond inline:** comment `@codex address that feedback` on a PR — it will push a fix commit. We don't currently use this; Claude Code handles fixes.

## Pitfalls to avoid

- Don't introduce `playwright-extra` / `puppeteer-extra-plugin-stealth` unless plain Playwright + minimal init script truly fails. Adds dependency weight.
- Don't try to scrape Facebook Marketplace / groups for Thailand rentals. Discussed and dropped — anti-bot is too aggressive, ToS issues, and signal-to-noise is bad.
- Don't filter out scraped listings client-side when the database can do it server-side. Use Prisma `where` clauses for source/city/price filters.
- Don't enable a daily cron for a scraper that hasn't been verified on `workflow_dispatch` first. The noise compounds and burns runner minutes.
