# Hipflat — Live Inspection (2026-05-04)

## Tier recommendation

**Tier 2 (GH Actions) + Playwright with stealth** — mandatory.

Reason: Every direct fetch (homepage, index pages, detail pages, robots.txt-style probes) returned **HTTP 403**. The 403s came from www.hipflat.co.th and www.hipflat.com on `/en/condo-for-rent/pattaya`, `/condo-for-rent/pattaya/central-pattaya`, `/apartment-for-rent/pattaya`, `/condo-for-rent/pattaya/one-bed`, and `/ads/{token}` detail URLs alike. The pattern matches Cloudflare bot management (the same family that blocks FazWaz). Plain `fetch` + Cheerio will not work. Same recipe as FazWaz: Playwright + Chromium on GH Actions runner, with the existing `--disable-blink-features=AutomationControlled` + `navigator.webdriver` removal init script. There is no API-discovery escape hatch — see "Gotchas" below for what was checked.

## URL patterns

Two domains mirror each other:
- `https://www.hipflat.co.th/en/...` (Thai TLD, `/en/` prefix mandatory)
- `https://www.hipflat.com/...` (no prefix)

**Recommendation: use `https://www.hipflat.com/`** — shorter, no language prefix to manage, and all detail URLs Google indexes are on `.com`. Treat `.co.th/en` as a fallback.

### Index URLs (rental, by city)

Property-type-scoped paths:
- Condos (primary): `/condo-for-rent/{city}` → Pattaya: `https://www.hipflat.com/condo-for-rent/pattaya`
- Apartments: `/apartment-for-rent/{city}` → Pattaya: `https://www.hipflat.com/apartment-for-rent/pattaya`
- Houses: `/house-for-rent/{city}` → Pattaya: `https://www.hipflat.com/house-for-rent/pattaya`
- All-types: `/property-for-rent/{city}` → Pattaya: `https://www.hipflat.com/property-for-rent/pattaya`

**Recommendation:** scrape `condo-for-rent/{city}` only for v1. The site reports ~8,800–10,300 condos for rent in Pattaya alone (number drifts between snapshots), which dwarfs FazWaz (4) and Renthub. Expanding to apartments/houses is Batch 3.5+ if v1 looks healthy.

City slug (verified): `pattaya`. Other cities follow the obvious pattern: `bangkok` (108K listings — confirmed), `chiang-mai` (~2K — confirmed), `phuket` and `koh-samui` are best-guess, **must be verified live**.

### Optional narrowing (not needed, but exists)

Neighborhood paths exist underneath: `/condo-for-rent/pattaya/{area}` where `{area}` ∈ `central-pattaya`, `north-pattaya`, `east-pattaya`, `jomtien`, `pratumnak`. Don't use these for v1 — adds complexity, the city-level page returns everything.

Bedroom-count narrowing: `/condo-for-rent/pattaya/one-bed` (also `two-bed`, `three-bed`, `four-bed`). Don't use either — get the data and filter server-side.

### Detail page URL

`https://www.hipflat.com/ads/{32-char-lowercase-alphanumeric-token}`

Examples (verified via Google index):
- `https://www.hipflat.com/ads/e9230uu789n8an0a8a9eetat3u011lu8` (Pattaya 1BR Once Pattaya)
- `https://www.hipflat.com/ads/a4n1llc38n399tc7n211a3883u04t2tn` (Bangkok 3BR Sathorn)
- `https://www.hipflat.com/ads/u292t3488ha3l187ea98hu3l3u0l48hn` (Bangkok 2BR Ratchada)

The token is **opaque** — looks like base32-ish but not standard. Use it directly as `source_listing_id`.

### Project (building) page URL — bonus for Building model

`https://www.hipflat.com/projects/{name-slug}-{token}`

Examples:
- `pattaya-beach-condo-kxxrmf` (6-char token here)
- `the-urban-pattaya-igixhh`
- `once-pattaya-condominium-plvhwa`
- `the-panora-pattaya-tqkxkd`

These pages aggregate per-project stats: "X condos for sale and Y condos for rent at {Project} in Bang Lamung". They expose price-range bands, average-per-sqm, and trend. **High-value for the Building model and future cross-source dedup.** But out of scope for the rental scraper itself — capture project name + token on the listing card or detail page so we can populate `Building.name` and a `Building.hipflat_project_token` later.

### Pagination

`?page=N` query parameter — verified on `https://www.hipflat.com/condo-for-sale/pattaya?page=6` (returned by Google with that URL). Same syntax for rent paths. Page size unknown until live (best guess 20–30 cards).

## Index page selectors

**NOT VERIFIED.** Direct fetch returned 403 every time, so I could not view the live HTML. Claude Code will need to ship best-effort selectors and verify on first `workflow_dispatch` run. The snippets below are everything I could observe through Google's text excerpts:

- Each card contains: project/listing title, short description (often agent-written, varies wildly), price line ("฿X /month" or "X THB/month" or "USD$X /month — *price may vary slightly*"), bed/bath/sqm summary line.
- Card title appears to link to `/ads/{token}`.
- "X listings" header text shows total inventory ("8,805 listings.") — useful as a sanity check when scraping ("cards visible across all pages should match this number, ±10%").
- Currency display is per-user (Hipflat shows USD by default for foreign IPs — this is what Google indexed). On detail pages with stats, both formats appear inline (e.g., "Rental Price: 28,000 Baht / Month (≈ 777 USD *price may vary slightly*)"). **Always extract the THB number; the USD is computed and noisy.**

## Detail page selectors

**NOT VERIFIED.** Same reason as above.

What's reliably present on detail pages, observed across many indexed snippets:
- A canonical sentence: "This property is a {N} m² condo with {beds} bed and {baths} bathrooms that is available for rent. It is part of the {Project Name} project in {District}, {Province} and was completed in {Month Year}. You can rent this condo for USD{N} per month."
- Often a structured block: "Project: {Name}", "Listing ID: {short-code}", "Property type: Condo", "No of floors: N", "Floor: N", "Usable area: N sqm", "No. of Bedroom: N", "No. of Bathroom: N", "Furniture: ...", "Common Facilities: ...", "Nearby Facilities: ..."
- Photos: present but unknown markup. Standard practice for Thai rental portals is `<img src=".../{listing}/{photo-id}_{size}.jpg">` and Hipflat is presumably similar — we already have `dedupeImageUrls()` to handle that.
- Phone: obfuscated. Page shows "View Phone" / "Show number"; clicking calls a per-listing reveal endpoint. **Don't try to capture phone**, not worth the complexity, and the gotcha "When you make the call, we will ask you to dial the code to identify the advertiser" suggests they track reveals.
- Lat/lng: not visible in snippets, may exist in JSON in a `<script>` tag (worth checking once live).

**For Claude Code:** the canonical sentence is the safety-net parser. If structured selectors break, regex out beds/baths/sqm/project from "This property is a X m² condo with Y bed and Z bathrooms that is available for rent. It is part of the {ProjectName} project in {District}".

## Filters required

1. **Reject sale-only listings.** Many `/ads/{token}` pages serve both sale and rent. The URL we fetch is from `/condo-for-rent/`, but the detail page may show "Sale: 5,300,000 ฿ — Rent: 30,000 ฿" or sometimes only sale. **Require a non-zero THB rental price.** Reuse the same monthly-fallback pattern as Renthub if needed (carry the card's "X /month" forward when detail parse misses it).

2. **Reject short-term-only / "1-month contract" pricing as primary.** Many listings show three tiers (1-month / 6-month / 12-month). Always pick the **longest-contract price** as `price_thb`. Example from indexed page: "Per month for 1 year contract: ฿20,000 / Per month for 6 months contract: ฿23,000 / Per month for 1 month contract: ฿30,000" — store 20,000.

3. **Don't scrape `/hotel-for-rent/`.** That URL serves entire hotel buildings as commercial rentals (49 listings in Pattaya, prices in millions of baht/month, e.g., "1.3MB/month, 119 rooms"). Restrict scrape paths to `condo`/`apartment`/`house` (or just `condo` for v1).

4. **Drop hotels/resorts that leak into condo results.** Some condo cards have titles like "Hotel Amber Pattaya" (because the building is operated as serviced/hotel residence). Apply a title-blacklist filter: reject if title contains `Hotel`, `Resort`, `Guesthouse`, `Hostel`, `Serviced Apartment` — same approach as Renthub.

5. **MonthStayz-style aggregator listings.** A few listings advertise "1-Month Lease – 46,000 / 3-Month Lease – 37,200 / 6-Month Lease – 36,000 / 12-Month Lease – 40,000" with a deliberately confusing tier where the 1-month price is highest. Same rule as #2 — pick the longest-term price.

6. **Currency normalization.** If the THB number isn't found on the page but USD is, **skip the listing** rather than convert. Hipflat's USD is computed at an unknown FX rate ("*price may vary slightly*"), and we'd be storing fictional baht.

## Gotchas / surprises

- **Inventory is huge.** ~8,800–10,300 condos for rent listed for Pattaya alone. Bangkok shows 108K. This is the largest source we'll have hit. Pagination at 20 cards/page → ~440 pages → 440 detail-page fetches × 5 cities. Plan a `--limit` default of maybe 200 for the first verification run, and don't enable the cron until we've decided on a sustainable cap. Daily full-scrape of 50K listings will not fit in a 60-minute GH Actions matrix slot — we may need either a per-city worker pool, an incremental-only scrape (newest-first, stop after N consecutive seen-before listings), or a weekly schedule instead of daily.
- **No public JSON API.** I could not find any `/api/` routes referenced anywhere in indexed pages. Earlier roadmap.md guessed Hipflat had "internal JSON API behind the listings pages" — I found no evidence of that. Treat as HTML-only via Playwright. (Worth one more look once we can render the page in Playwright — check Network panel — but plan as if it's HTML-only.)
- **Project pages exist and are gold.** The `/projects/{slug-token}` pages list every available unit per building with price ranges and trend data. Future Building model + cross-source dedup work should pull from these. Out of scope for this batch.
- **Currency confusion.** Same listing can render with THB or USD primary depending on viewer (likely IP-geo). When run from a GH Actions runner (US-located), expect USD primary. Strip the USD, find the THB.
- **Phone obfuscation.** Don't bother. Tracked.
- **`.co.th/en/` vs `.com` parity.** Both work, but `.com` returned more Google-indexed snippets and has shorter URLs.
- **`hipflat.co.th/en/market/condo-pattaya-fykx`** — separate "market" URL space exists with a different short-token pattern (4 chars, e.g., `fykx`). Looks like an SEO-redirect of `/projects/condo/pattaya`. Ignore.
- **No `expired`/`closed` banner observed** in snippets, but I can't confirm absence — check after live render. If Hipflat does a soft-delete with a banner like Living Insider, we'll need a similar filter.

## Verified vs guessed

**Verified (URL fetched OK or text indexed by Google):**
- Domain: `hipflat.com` and `hipflat.co.th/en` both resolve and serve same content.
- Index URL pattern: `/condo-for-rent/{city}`, `/apartment-for-rent/{city}`, `/house-for-rent/{city}`, `/property-for-rent/{city}`.
- Detail URL pattern: `/ads/{32-char-token}`.
- Project URL pattern: `/projects/{slug-token}`.
- Pagination: `?page=N`.
- City slug `pattaya` and neighborhood slugs (`central-pattaya`, `north-pattaya`, `east-pattaya`, `jomtien`, `pratumnak`).
- Bedroom slugs: `one-bed`, `two-bed`, `three-bed`, `four-bed`.
- Inventory order of magnitude (~9K Pattaya condos for rent).
- Listings are predominantly long-term monthly with explicit "X THB/month" or "Rental price: X" wording. Short-term tiers exist as alternative prices, not as the default.

**Guessed (could not fetch — must verify live):**
- All CSS selectors. Everything in "Index page selectors" and "Detail page selectors" above.
- Card-list HTML structure (server-rendered vs JS-required).
- Page size for pagination.
- Photo URL structure.
- City slugs `phuket`, `koh-samui` (both not directly verified — pattern-extrapolated).
- Whether Hipflat exposes any JSON in `<script>` tags or `__NEXT_DATA__`.
- Whether expired/closed listings stay accessible with a banner.
- Whether the Cloudflare challenge is a JS challenge (passable with stealth Playwright) or Turnstile (needs solver). FazWaz's Cloudflare was passable with stealth alone — assume Hipflat is the same until proven otherwise.

## Hand off

**To Spec Writer:** Implement the `HIPFLAT` scraper.

- **Tier:** 2 (GH Actions + Playwright). Reuse the FazWaz pattern from `src/scrapers/sources/fazwaz.ts` and `.github/workflows/scrape-fazwaz.yml`.
- **Cities to map for v1:** Pattaya only (slug `pattaya`). Other cities throw `"city not yet mapped for HIPFLAT"` — same pattern as Living Insider does for non-PTY cities. Add Bangkok next batch once Pattaya is verified live; the inventory volumes mean we'll want per-city tuning anyway.
- **Index URL:** `https://www.hipflat.com/condo-for-rent/pattaya?page={N}`. Paginate until the page returns zero cards or the same cards as the previous page (defensive against off-by-one pagination loops).
- **Detail URL:** `https://www.hipflat.com/ads/{token}` extracted from the card's link.
- **Critical filters:** non-zero THB rental price; reject sale-only; pick longest-contract price among 1m/6m/12m tiers; reject titles matching `/(hotel|resort|guesthouse|hostel)/i`; skip listings where only USD is parsed (do not FX-convert).
- **Selectors:** unverified — implement with the canonical-sentence regex fallback ("This property is a X m² condo with Y bed and Z bathrooms…") so we get something even if the structured selectors miss. After first `workflow_dispatch` run, expect a P1 "selectors brittle" follow-up.
- **Limit recommendation:** default `--limit 200` for first runs; cron disabled in workflow file until a manual run produces `listings_added > 50`. Same gating policy as Renthub/Living Insider PR #46.
- **Apply `dedupeImageUrls()`** to photos before persistence (mandatory per architecture.md).
- **Capture project name + token** if visible on the card or detail page → store in `raw_data.project = { name, token }` so a future Building-model job can backfill `Building` rows. Don't try to populate `Building` directly from this scraper.
- **Verification step (mandatory after merge):** run `workflow_dispatch` for PTY with `--limit 50 --dry-run` first to inspect the parser output, then a real `--limit 200` run. Crons stay commented out until both produce sensible numbers.
