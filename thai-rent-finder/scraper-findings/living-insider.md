# Living Insider — Live Inspection (2026-05-03)

> Pattaya zone (zone_id=42). Investigates `cardsFound: 0` on the existing PR #46 implementation.

## TL;DR — likely root causes

1. **Index page `cardsFound: 0` is most likely a CSS-selector mismatch.** The index URL works, returns HTML 200, and contains listings server-rendered. The current scraper just isn't matching the cards in the DOM with whatever selector PR #46 chose. The selector was guessed (sandbox couldn't reach the live site at implementation time) and was not verified against real HTML.
2. **Detail pages are *probably* JS-rendered.** Both `/detail_en/...` and `/livingdetail_en/...` URLs returned empty HTML bodies on direct fetch, while Google's index has full content for the same URLs. This is a separate, second problem the implementation will hit even if (1) is fixed. **It changes the architecture decision** — see below.

## Tier recommendation

**Tier 2 (GH Actions). Index = plain Cheerio is fine; detail pages need Playwright.**

Two-pass strategy recommended:
- Pass 1 (plain HTTP + Cheerio): scrape index pages, extract everything visible on the card (id, URL, title, project name, sqm, bedrooms, bathrooms, floor, price-per-sqm, "1 month OK" tag).
- Pass 2 (Playwright, lazy / opt-in): only fetch detail page when richer fields (full photos, description, full price text, exact expired/closed banner) are needed.

For v1, **strongly consider index-only scraping** — the card already contains enough fields to populate a Listing. Detail-page enrichment can be a follow-up batch.

## URL patterns

### Index by city
- Pattern: `/living_zone_en/{zone_id}/Condo/Rent/{page_num}/{slug}.html`
- **Pattaya (zone_id=42)**: `https://www.livinginsider.com/living_zone_en/42/Condo/Rent/1/Chonburi-Pattaya-Bangsa.html` ✅ **verified, returns server-rendered HTML, contains listings**
- Page 2 verified: `/2/Chonburi-Pattaya-Bangsa.html` returns title "...| Livinginsider-Page 2"
- Other Pattaya zone URLs found in the same site nav (for future city expansion):
  - Bangkok (BKK): no single zone — Bangkok is split across ~30 sub-zones (Sukhumvit=18, Asoke part of 18, Silom=22, Sathorn=24, etc.)
  - Phuket: zone_id=46 → `/living_zone_en/46/Condo/Rent/1/Phuket.html` (slug guessed but pattern verified)
  - Chiang Mai: zone_id=45 → `/living_zone_en/45/Condo/Rent/1/Chiang-Mai.html`
  - Koh Samui: zone_id=141 (under "Surat Thani") → `/living_zone_en/141/Condo/Rent/1/Surat-Thani.html`
  - Hua Hin: zone_id=43 → `/living_zone_en/43/Condo/Rent/1/Hua-Hin-Prachuap.html`

### Detail page — TWO patterns coexist
Both are still live and indexed:
- **New (post-2024?)**: `/detail_en/{long-slug-with-id-at-end}-{numeric_id}` (no `.html` suffix; trailing number is the listing ID)
- **Legacy**: `/livingdetail_en/{numeric_id}/{slug}.html`

The numeric ID is the same in both patterns. Index page hrefs use the new `detail_en` pattern (verified on Pattaya page 1's first card). Old listings still resolve via `livingdetail_en`. The implementation should:
- **Match either pattern** when extracting card → detail links from the index
- **Extract listing ID** with a regex like `/(\d+)$|\/livingdetail_en\/(\d+)/` — same ID either way

### Pagination
- Page number is in the path, not a query string: `.../Rent/{page_num}/...`
- "Next page" navigation exists but I didn't extract its selector
- Strategy: increment `page_num` until a fetched page returns zero matched cards (or contains pagination element indicating end)

## Index page selectors — **NOT VERIFIED**

> ⚠️ **I could not get raw HTML through web_fetch — only markdown-extracted text.** The selectors below are based on what's *clearly visible* in the rendered text, not on inspecting class names. The implementation MUST log the first card's outer HTML on its first run so we can iterate. Suggested logging: write `$('body').html().slice(0, 50000)` to a debug artifact when `cardsFound === 0`.

What's verified to be in the card text (in this order):
1. Property type label: `Condo` / `Home` / etc.
2. Post type: `For rent`
3. Min-term tag: `1 month OK` (only on listings that accept 1-month) — useful filter signal
4. Highlight badge text: `Spotlight` (sponsored cards have this; appears as a distinct badge)
5. Long title (often emoji-heavy, multi-line)
6. Project name (separate text node, NOT the title — e.g. "Copacabana Beach Jomtien")
7. Floor size: `29 Sq.m.`
8. Price-per-sqm in parens: `(759 baht/sq.m.)`
9. Floor range: `Fl. 5-10`
10. Bedroom count: `1 Rooms` (the word "Rooms", not "Bedrooms" on the card)
11. Bathroom count: `1 Rooms` (also "Rooms" — distinguished only by position/icon)

**Total monthly price** (e.g. "22,000 baht/month") — appears in the title text and likely also as a price label in the card markup, but I can't confirm the exact element from markdown extraction. The card also contains a CSS-derivable monthly price as `price_per_sqm × sqm` (rounds to ~22,000 in the verified case).

Suggested defensive selector strategy (try multiple, take first that yields >0 hits):
```
const candidates = [
  'div.zone-list a[href*="/detail_en/"]',
  'div.zone-list a[href*="/livingdetail_en/"]',
  '.list-item a[href*="detail_en"]',
  '.card a[href*="detail_en"]',
  'a[href*="/detail_en/"]:has(img)',
  'a[href*="/livingdetail_en/"]:has(img)',
];
```
The link-based approach is safest — find every `<a>` whose href matches the detail pattern, then walk up to its containing card element.

## Detail page selectors — **partially observed via search snippets**

Detail pages return **empty body to direct fetch**, but Google Search has indexed full content. From those snippets, the on-page structure is consistent:

```
Detail · ฿ 21,000 /mo (779 B./Sq.m.)
Property information
Floor Size 26.96 sq. m
Floor 17
Bedrooms 1
Bathrooms 1
Detail
Project and location
EDGE Central - Pattaya
Map
```

For-sale variant:
```
฿1,500,000 (60,000 B./Sq.m.) Created 20/02/2026 · Updated 4 days ago
```

Field-extraction patterns (text-search based, since selectors are unknown):
- **Price (rent)**: regex `/฿\s*([\d,]+)\s*\/mo/`
- **Price-per-sqm**: regex `/\(([\d,]+)\s*B\.\/Sq\.m\.\)/`
- **Floor size**: regex `/Floor Size\s+([\d.]+)\s+sq\.\s*m/i`
- **Bedrooms**: regex `/Bedrooms\s+(\d+|Studio room)/i`
- **Bathrooms**: regex `/Bathrooms\s+(\d+)/i`
- **Project name**: text after `Project and location · ` and before `Map`
- **Updated date**: regex `/Updated\s+(.+?)(?:·|$)/`

These patterns assume the detail page is fetched with a JS engine (Playwright) since plain HTTP returns empty body.

## Filters required

### Rent vs sale
- URL contains `/Rent/` segment for rent index
- Detail price format `฿ X /mo (Y B./Sq.m.)` indicates rent; `฿X (Y B./Sq.m.)` without `/mo` indicates sale
- Card text shows "For rent" vs "For Sale" labels
- **Recommendation**: rely on URL path segment + card "For rent" text; reject anything missing both

### Expired listings — verified text patterns
Detail page banner reads:
> `Listing was expired`
> `This posts has expired. because the owner has not updated for more than 30 days.`

Filter: detail-page text contains `Listing was expired` OR `This posts has expired` → reject.

### Closed listings — verified text patterns
Detail page banner reads:
> `Close the deal`
> `This listing has been closed.`

Status badge separately shows `Condo Rented` (or similar) for the property type.
Filter: detail-page text contains `Close the deal` OR `This listing has been closed` OR badge text matches `(Condo|Home|...) Rented` → reject.

### Hotels / short-term-only
Living Insider's hotel/business listings are filtered at URL level (different category in nav: `Hotel_apartment`). Within `/Condo/Rent/`, hotels shouldn't appear — but defensive check on title for `Hotel`/`Resort`/`Hostel`/`Guesthouse` is cheap and worth keeping.

### Daily / hourly rentals
Living Insider has flexible rental terms — some listings are 1-month minimum, others 12-month. The card shows `1 month OK` when 1-month is accepted; this is **not a rejection signal** in itself. The site is monthly-oriented (unlike Renthub), so no equivalent of the Renthub daily-filter is needed here. The presence of "Short-term rental" in the title or `Cleaning service` mentions indicate flexible/serviced units, but those still belong in the dataset for Dima's use case.

## Gotchas / surprises

### 1. Detail page returns empty body to direct HTTP fetch
The headline finding. Both `/detail_en/...` and `/livingdetail_en/...` URLs returned an empty document via `web_fetch` (markdown extraction returned blank). Same URLs render full content in Google Search and presumably in a real browser.

Possible causes (most → least likely):
- (A) Content is JS-rendered after page load (need to verify by viewing actual response — could be a `<noscript>` body with empty `<div id="root">` style markup)
- (B) Anti-bot blocking on detail pages (returns 200 + blank when the User-Agent doesn't look like a human browser)
- (C) Cookie consent gate that hides content until "Accept" is clicked

**Implication**: if the implementation uses `fetch()` + Cheerio for detail pages and currently sees them as "empty / no fields extracted", that's why. Index works because index is server-rendered; detail does not.

**Implementation fix options** (in order of preference):
1. Skip detail pages in v1 — index has enough data
2. Add a real User-Agent + Accept-Language headers and retry — might be (B) and a header fix is enough
3. Switch detail-page fetcher to Playwright (`browser.ts` already exists for FazWaz; reuse the same pattern)

### 2. Two URL patterns for detail pages
`/detail_en/...-{id}` is newer; `/livingdetail_en/{id}/...html` still works. Cards on the current Pattaya page 1 use the new pattern (verified on the Spotlight Copacabana card). The implementation should match either, and the listing ID extraction must handle both.

### 3. "Spotlight" / sponsored cards may have different markup
The first card on the index is in a `Spotlight` section with a `highlight_badge.svg` icon. Sponsored cards often have extra wrapper divs or different class hierarchies. Defensive: don't assume all cards are at the same DOM depth.

### 4. The card's bedrooms and bathrooms are both labeled "Rooms"
In the index card text: `1 Rooms` appears twice — once for bedrooms, once for bathrooms. They're distinguished only by surrounding icons or position. The implementation must extract them by position (first "X Rooms" = bedrooms, second = bathrooms) or by icon class, not by the label text alone.

### 5. Card "price" appears as price-per-sqm, not total monthly
The card prominently displays `(759 baht/sq.m.)`. The total monthly price (e.g., 22,000) is in the title text and presumably elsewhere in the card markup, but the index strongly leads with price/sqm. If the implementation grabs "the first price-looking number" it might end up storing 759 instead of 22,000. Verify by computing `sqm × price_per_sqm` and reconciling against the extracted total — if off by >5%, the extraction is grabbing the wrong field.

### 6. `assets18/` versioning
The site loads assets from `/assets18/...` paths, suggesting a 2018-era redesign. Class names from older docs/scrapers may have drifted since 2018. Treat any selectors documented in older sources as suspect.

### 7. The cookie banner ("Accept All") may matter
The page shows a cookie consent banner. For human visitors this is dismissible; for scrapers it's irrelevant unless the site gates content on cookies. **Worth testing**: scrape with and without `Cookie:` headers to see if responses differ.

## Verified vs guessed

### Verified (actually fetched and inspected)
- ✅ Pattaya index URL `/living_zone_en/42/Condo/Rent/1/Chonburi-Pattaya-Bangsa.html` reachable, server-rendered HTML, contains listings
- ✅ Pagination: `/2/...` returns "Page 2"
- ✅ Index card structure (the "Spotlight" Copacabana listing) — fields visible in extracted text
- ✅ Both `/detail_en/...` and `/livingdetail_en/...` URL patterns are live and indexed by Google
- ✅ Detail page returns empty body via direct fetch (verified on 3 different listings: 2985996, 2054517, 915388, 2979731)
- ✅ Expired/closed banner text strings (verified via search snippets of expired Pattaya listings)
- ✅ Detail-page field structure: `Floor Size X sq. m`, `Floor X`, `Bedrooms X`, `Bathrooms X`, `Project and location · X` (verified via search snippets)
- ✅ Rent price format `฿ X /mo (Y B./Sq.m.)` and sale format `฿X (Y B./Sq.m.)` (verified via search snippets)

### Guessed / inferred (NOT directly verified)
- ⚠️ Other-city zone IDs (45 CMI, 46 PHK, 141 SAM, 43 Hua Hin) — taken from Pattaya page's nav links, not test-fetched
- ⚠️ Bangkok being multi-zone vs a single zone — confirmed via nav structure, but the BKK strategy is undecided (scrape every BKK sub-zone? Pick a few popular ones?)
- ⚠️ All CSS selectors — couldn't access raw HTML, only markdown-extracted text
- ⚠️ Photo URL patterns and size variants on detail page — not observed
- ⚠️ Map / lat-lng presence on detail page — Google snippets mention "Map" header but no coords visible
- ⚠️ Whether the detail-page empty-body is JS rendering or anti-bot — needs runtime confirmation

### Couldn't fetch / blocked
- ❌ Raw HTML of any page (web_fetch only returns markdown; no extraction mode gave class names)
- ❌ Detail page bodies (returned empty across all attempts)
- ❌ The `traf` extraction method threw an internal error on the index page

## Hand off to Spec Writer

Implement Living Insider Pattaya scraper rebuild. Critical path is fixing the index-page card extraction.

**Scope:**
- Cities to map: PTY (zone_id=42) only for v1 — same as current state. Other cities deferred per state.md.
- Pattern: GH Actions Tier 2, plain HTTP + Cheerio for index, **defer detail page** for v1.
- URL: `https://www.livinginsider.com/living_zone_en/42/Condo/Rent/{page}/Chonburi-Pattaya-Bangsa.html`
- Pagination: increment page until empty results.

**Critical filters:**
- Expired/closed: detail-page text match (skip in v1 if no detail fetch — accept that some stale listings will leak through until detail pass is added)
- Hotel reject by title keywords (defensive)
- Rent-only (URL contains `/Rent/`)

**Index card extraction (pure Cheerio, defensive):**
- Match cards by `<a>` whose href matches `/(detail_en|livingdetail_en)\/`
- For each card link, walk up to a containing element; extract listing ID via regex from href; extract sqm, beds, baths, project name, price (compute from per-sqm × sqm if total not directly findable, then verify against any total-price text)
- If `cardsFound === 0` after running through fallback selectors, log `$.html().slice(0, 50000)` as a debug artifact and return early — don't silently succeed

**Acceptance criteria:**
- `npx tsx scripts/scrape-cli.ts --source LIVING_INSIDER --city PTY --limit 10` produces ≥ 5 listings on first run
- All extracted listings have non-zero price, non-zero sqm, non-empty project name
- TypeScript clean, build green, tests pass
- Workflow logs include first-card raw HTML excerpt on the first run for verification

**Deferred to a later batch (NOT in this implementation):**
- Detail-page enrichment (needs decision on Playwright vs header-fix-and-retry)
- Other-city zone mapping (BKK strategy unclear)
- Photo deduplication beyond what `dedupeImageUrls()` already does

**Open question for Dima before implementation:**
- Accept v1 = index-only (no expired/closed filter, no full photo set, no description) on the bet that index data is good enough for the listings UI — and add detail enrichment in a follow-up?
- Or block on solving the detail-page empty-body issue first (Playwright route, +1 day of work)?

My recommendation: ship index-only v1, observe what's missing in real listings UI, then decide whether detail enrichment is worth the Playwright complexity for this source specifically.
