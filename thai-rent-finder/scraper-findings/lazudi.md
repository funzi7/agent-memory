# Lazudi — Live Inspection (2026-05-04)

## Tier recommendation

**Tier 2 (GH Actions) + Playwright with stealth** — same recipe as Hipflat and FazWaz.

Reason: every direct fetch returned **HTTP 403** — homepage `lazudi.com/th-en`, index `/th-en/properties/condo-for-rent/chonburi/pattaya`, and detail page `/th-en/chonburi/property/the-urban-condo-with-3beds-for-rent-125138` all blocked. Same Cloudflare-style anti-bot behavior as the other two sources we've already moved off Vercel. Plain HTTP + Cheerio will not work. Reuse the FazWaz Playwright stack with the existing stealth init script (`navigator.webdriver` removal + `--disable-blink-features=AutomationControlled`).

## URL patterns

Single domain: `https://lazudi.com/`. Mandatory `/th-en/` prefix on every page (country=Thailand, language=English; `/th-th/` exists for Thai but we ignore it). No `.com` vs `.co.th` mirror to choose between.

### Index URLs (rental, by city)

Pattern: `/th-en/properties/{type-slug}/{province-slug}/{city-slug}[/{sub-area-slug}]`

Property-type slugs:
- Condos: `condo-for-rent` → primary scope for v1
- Houses: `house-for-rent`
- Townhouses: `townhouse-for-rent`
- Villas: lumped under `house-for-rent`
- All types: `for-rent`

Province + city slug for Pattaya: `chonburi/pattaya`. **Both segments are mandatory** — `/properties/for-rent/pattaya` (without province) is not a valid URL on Lazudi. This is different from Hipflat and Renthub. The full canonical Pattaya URL is:

```
https://lazudi.com/th-en/properties/condo-for-rent/chonburi/pattaya
```

(Verified by Google indexing — page header reads "Explore (222) Condos for Rent in Pattaya, Chonburi". Counter drifts: the same page also shows 334 condos in the breakdown facet on the broader `/for-rent/` view; treat ~200–340 as the order of magnitude.)

### Bedroom-count narrowing (optional, don't use for v1)

`/th-en/properties/{N}-bed-condo-for-rent/{province}/{city}` and `/studio-condo-for-rent/...`. Examples (verified): `1-bed-condo-for-rent` (88 in PTY), `2-bed-condo-for-rent` (82), `3-bed-condo-for-rent` (17 across all of Chonburi), `studio-condo-for-rent` (55). Don't slice the scrape this way — pull all and filter client-side.

### Sub-area narrowing (optional)

Lazudi uses Thai administrative subdivisions, not the colloquial Pattaya neighborhoods (Central/North/Jomtien). Sub-area facets observed for Pattaya:
- `nong-prue` (338 — biggest, covers most of South + East Pattaya + Jomtien)
- `na-kluea` (97 — Wongamat / North Pattaya)
- `na-chom-thian` (truncated count — Na Chom Thian / Na Jomtien southward)
- `pattaya` (528 — confusingly, "Pattaya within Pattaya" = the actual Pattaya beach strip)
- `bang-lamung` (0 — present but empty, probably a vestigial label)
- More also exist beneath: `nong-prue/near-jomtien-beach` is a real path (returned 18 condos, 4 two-bed condos).

Don't slice by sub-area for v1. The city-level URL covers everything and the sub-area paths are inconsistent.

### Detail page URL

`https://lazudi.com/th-en/{province}/property/{descriptive-slug}-{numeric-id}`

Verified examples (Pattaya condos for rent):
- `/th-en/chonburi/property/the-urban-condo-with-3beds-for-rent-125138` (LAZ125138)
- `/th-en/chonburi/property/2-bed-1-bath-47-sqm-new-nordic-trend-6-208475` (LAZ208475)

The `{numeric-id}` is the canonical Lazudi listing ID (also displayed prefixed as `LAZ{id}` in the page title). Use this number directly as `source_listing_id`. The slug part is descriptive and may contain spaces, project names, bed counts; safe to ignore for ID purposes but keep the full URL for re-fetching.

### Project (building) page URL — bonus

`https://lazudi.com/th-en/{province}/project/{slug}-{numeric-id}` with `PRO{id}` prefix in some text references.

Verified examples:
- `/the-base-central-pattaya-2913` (PRO02913)
- `/the-riviera-jomtien-3306`
- `/lumpini-park-beach-jomtien-1536`
- `/reflection-jomtien-beach-pattaya-2297`
- `/jomtien-complex-1280`
- `/casa-jomtien-village-4187`

These project pages are **richer than Hipflat's** — they include developer name ("Reflection Jomtien Beach Pattaya is developed by Major Development"), total units ("335 units across 55 floors, and 2 buildings"), unit-size range ("60-218 Sqm"), bedroom range ("1–3 bed"), full facility list ("Elevator, CCTV/IP Camera, Swimming Pool, Covered Parking, Gym, Shop, Restaurant, Sauna, 24-hour Security, BBQ Area, Garden"). **Excellent feed for the future Building model.** Capture project name + numeric ID from the listing card or detail page; don't try to scrape projects in this batch.

### Pagination

**Unverified.** Couldn't probe live, and Google didn't index any URLs containing `?page=`, `?p=`, or `&page=` for Lazudi. Two plausible mechanisms:
1. Standard `?page=N` query string (most Next.js-style portals use this — Hipflat does)
2. Infinite scroll / "Load more" with client-side fetching

Search snippets show "Recently Updated · 17 · Condo For Rent · ฿ 50,000 · per Month..." patterns suggesting cards are server-rendered, but the page count for ~222 listings would suggest at least 8–10 pages of pagination if cards are typical 20–30 per page. Claude Code will need to verify on first live render — open the URL, scroll, watch the Network panel for either a URL change to `?page=2` or an XHR fetch.

## Index page selectors

**NOT VERIFIED** (403 on every fetch). What's reliably observed in Google snippets, useful as an "I expect the parser to find" checklist:

A card produces this textual sequence (interleaved with whitespace and likely separator dots):
- A status tag: `New` / `Recently Updated`
- A photo count: `17`, `20`, `30`, `12` etc.
- The transaction type: `Condo For Rent`
- The price: `฿ 50,000`
- The lease term: `per Month - Min 1 year` (or `Min 6 months`, `Min 3 months`, `Min 1 month`)
- Beds: numeric or `Studio`
- Baths: numeric
- Size: `48 Sqm`
- Land size (houses only): `220 Sqm Land`
- Action buttons: `Call`, `Message`, `More Details` — the `More Details` link is the link to the detail page

The grand total at the top of the page is in the header text: `"Explore (222) Condos for Rent in Pattaya, Chonburi"`. Useful sanity check — should match (cards across all paginated pages) ± 10%.

## Detail page selectors

**NOT VERIFIED.** Observed in Google snippets:

**Page title** (very consistent format, useful as parser fallback):
```
{Project Name} {N} Bed {Sqm}.0 Sqm for Rent LAZ{id}
{Project Name} {N} Bed {Sqm}.0 Sqm for Sale & Rent LAZ{id}
```

Examples:
- `The Urban 3 Bed 110.0 Sqm for Sale & Rent LAZ125138`
- `New Nordic trend 6 2 Bed 47.0 Sqm for Rent LAZ208475`

**Meta description** (also very consistent):
```
THB {price} for Rent, {N} Bed {N} Bath {Sqm} Sqm Condo at {Project Name}, located in {City}, {Province}.
```
or for dual sale+rent:
```
THB {sale-price} for Sale & Rent for THB {rent-price}, ...
```

Use the meta description as the safety-net regex parser when structured selectors fail.

**Description body** (agent-written, varies but follows patterns from PBRE Real Estate templates which look like the dominant agent on Lazudi for Pattaya):
- "This is {N} Bedrooms, {N} Bathrooms Condo for Rent in {Sub-area}, offering {Sqm} Sqm of living area, located on the {N}th floor, comes full furnished, ..."
- A "Facilities:" block listing things like "24 Hours Security, CCTV, Communal Swimming Pool, Car Parking, Elevator, Key Card System, Gym"
- A "Location" paragraph with nearby landmarks
- An ID field: `ID:7390R` (PBRE internal — `R` = rent, `S` = sale). NOT the LAZ id.
- Phone, Line, WhatsApp, WeChat contact lines

**Photos:** present but unknown markup. Apply `dedupeImageUrls()` when persisting.

**Lat/lng / sale-vs-rent disambiguation / property-type:** not visible in snippets. Verify live.

## Filters required

1. **Reject sale-only listings.** Many `/property/` pages are dual-purpose: title says "for Sale & Rent" and meta description gives both prices. The URL we follow comes from `/condo-for-rent/`, but not all of those URLs have a real rent price — some are mostly sale with a token rent line. **Require non-zero THB rental price** parsed from the meta description's "for Rent for THB X" or detail-page rental price field.

2. **Min-term filter for short-term rentals.** Cards expose lease term explicitly: "per Month - Min 1 year", "Min 6 months", "Min 3 months", "Min 1 month". A `Min 1 month` listing is effectively a vacation rental priced like long-term. **Reject `Min 1 month` and shorter.** Keep `Min 3 months` and longer (this is consistent with how the existing app treats Renthub). The min-term value is a card-level field — capture it during index parsing, don't wait for the detail page.

3. **Exclude non-residential property types.** The `for-rent` listing on Lazudi mixes `Hotel (7)`, `Building (15)`, `Office`, `Retail`, `Restaurant Bar`, `Land` into the same totals. The `condo-for-rent` URL filters those out at the source — that's why we use it as the v1 scope instead of the broader `for-rent`. If we expand to `house-for-rent` or `villa-for-rent` later, ensure the type-scoped URLs do the same exclusion.

4. **Holiday rental (short-term) namespace is separate** — don't accidentally hit it. Lazudi has a parallel "Holiday Rentals" / "Short Term Rental" section, presumably under different URLs (`/short-term-rental/...` or similar — not verified). The `condo-for-rent` URLs we use are long-term only by Lazudi's own categorization.

5. **Currency display is THB by default** (verified — site has a multi-currency switcher but defaults to ฿/THB and Sqm). Cards and titles show THB primary. Less of a concern than Hipflat. Still: require the THB price string to parse cleanly; don't fall back to FX.

6. **Don't double-count duplicate sale-and-rent listings.** Same physical unit can be advertised on `/condo-for-sale/` AND `/condo-for-rent/` with different LAZ IDs. We're only scraping `/condo-for-rent/`, so this isn't a direct issue, but if cross-source dedup ever runs against Lazudi's own internal duplicates, expect the same physical unit to appear with its rent listing once.

## Gotchas / surprises

- **Province + city is mandatory in URLs.** Unlike Hipflat (`/condo-for-rent/pattaya`) or Renthub (`/en/apartment/pattaya`), Lazudi requires `/chonburi/pattaya`. The province slug must be correct or the page 404s/redirects. This means the city → province mapping needs to be a first-class config in the scraper, not derived. Best guesses (verify live): `bangkok/bangkok`, `chiang-mai/chiang-mai`, `phuket/phuket` (or possibly with a sub-district), `surat-thani/koh-samui`. Pattern verified only for `chonburi/pattaya` so far.
- **Sub-area system is Thai administrative, not colloquial.** Lazudi groups by `nong-prue`, `na-kluea`, `na-chom-thian` (formal subdivisions of Bang Lamung municipality), not by the tourist names (Central/North/Jomtien) the other portals use. Don't try to map between them — just scrape at the city level.
- **Inventory is small but quality is high.** ~222–334 condos for rent in Pattaya. Compare: Hipflat ~9K, Renthub TBD, FazWaz 4. Lazudi is a curated agency portal, not a high-volume aggregator — most listings come from a small set of established agencies (PBRE Real Estate dominates Pattaya). This means: low volume → no need for incremental scraping or pagination paranoia; one full-scrape per run is fine. Daily cron is reasonable.
- **Internal agency IDs are exposed in description text** (e.g., "ID:7390R"). These are PBRE-internal, not Lazudi-canonical. Use the LAZ numeric ID from the URL as `source_listing_id`. The PBRE/agency ID could go into `raw_data.agency_id` if we ever want cross-source dedup with Hipflat (where PBRE may also list).
- **No clear sign of a JSON API.** Search snippets contain rendered HTML strings (counts in headers, full description text), suggesting SSR. But unlike Hipflat I haven't ruled out a `__NEXT_DATA__` blob or `/api/` calls — Claude Code should check the page source on first render. If `__NEXT_DATA__` is present, the parser becomes much simpler (read JSON, skip CSS).
- **Duplicate URL forms.** Both `/properties/for-rent/chonburi/pattaya` (577 all-type) and `/properties/for-rent/chonburi/pattaya/pattaya` (528 sub-area) work and look almost-identical. Stick to the city-level (no double-pattaya) path.
- **Dual sale+rent listings are common.** ~30%+ of rental listings in snippets show sale + rent prices side by side. The same listing on Lazudi can carry both intents under one ID. Make sure the rent price is captured separately from the sale price in `raw_data` (e.g., `raw_data.sale_price_thb`, `raw_data.rent_price_thb`) so we don't overwrite or confuse them.

## Verified vs guessed

**Verified (URL form confirmed via Google's index, even though direct fetch returned 403):**
- Domain + prefix: `https://lazudi.com/th-en/`
- Index URL form: `/properties/{type-for-rent}/{province}/{city}`
- Detail URL form: `/{province}/property/{slug}-{numeric-id}`
- Project URL form: `/{province}/project/{slug}-{numeric-id}`
- Province + city slug for Pattaya: `chonburi/pattaya`
- Sub-area slugs: `nong-prue`, `na-kluea`, `na-chom-thian`, `pattaya` (the inner one)
- Bedroom-count slugs: `studio-condo-for-rent`, `1-bed-condo-for-rent` ... `5-bed-...`
- Inventory order of magnitude: 222–334 condos for rent in PTY; 88 one-bed; 82 two-bed; 55 studio; 67 sea-view
- THB currency primary on cards and detail meta
- Lease-term display on cards ("per Month - Min 1 year", etc.)
- Listings classified by transaction type (`for Rent`, `for Sale`, `for Sale & Rent` — visible in titles)
- Long-term-only by category: the `for-rent` URL space is distinct from a separate "Holiday Rentals" / short-term namespace

**Guessed (must verify live):**
- All CSS selectors for index cards and detail page.
- Pagination mechanism (`?page=N` is best guess; could also be infinite-scroll). Whether all ~222 condos are paginated or fit on a small number of long pages.
- Whether `__NEXT_DATA__` JSON is in page source.
- Photo URL pattern and size-variant scheme.
- City + province slugs for Bangkok / Chiang Mai / Phuket / Koh Samui.
- Whether Lazudi marks expired listings in any visible way (or just removes them).
- Whether the `Min 1 month` filter rule needs refinement after seeing real data.

## Hand off

**To Spec Writer:** Implement the `LAZUDI` scraper.

- **Tier:** 2 (GH Actions + Playwright). Reuse the FazWaz/Hipflat pattern. Cloudflare 403 confirmed on direct fetch, so plain Cheerio is out.
- **Cities to map for v1:** Pattaya only — slug `chonburi/pattaya`. Other cities throw `"city not yet mapped for LAZUDI"`. Province + city is a two-segment config, not single — match Living Insider's `cityToZoneId` shape, but with a `{ province, slug }` value.
- **Index URL:** `https://lazudi.com/th-en/properties/condo-for-rent/chonburi/pattaya[?page=N]`. After first verification run, if pagination turns out to be infinite-scroll, switch to a Playwright scroll loop (`while listings still appearing, scroll to bottom + wait`).
- **Detail URL:** `https://lazudi.com/th-en/chonburi/property/{slug}-{LAZ-id}` extracted from the card's "More Details" link.
- **Critical filters:**
  - Non-zero THB rental price (some listings are sale-only despite the URL category).
  - Reject `Min 1 month` lease-term cards (capture term during index parse).
  - Trust the type-scoped URL to filter out hotels/offices/etc. — don't add a defensive title blacklist unless first run shows leakage.
- **Selector strategy:** ship best-effort CSS selectors AND a meta-description regex fallback (`THB {N} for Rent, {beds} Bed {baths} Bath {sqm} Sqm Condo at {project}, located in {city}, {province}.`). The title format is also extremely consistent and can serve as a fallback (`{project} {beds} Bed {sqm} Sqm for Rent LAZ{id}`). First live run will reveal whether the structured selectors work.
- **Check for `__NEXT_DATA__`** before writing CSS-based extraction. If it's present, parsing JSON is dramatically simpler than scraping the rendered DOM. (This is consistent with the Batch 3 strategy mentioned in roadmap.md.)
- **Limit recommendation:** default `--limit 100` for first run (Pattaya total is ~222–334 — 100 will exercise pagination if it exists, without hammering). Cron disabled until manual run produces `listings_added > 50`.
- **Apply `dedupeImageUrls()`** to photos before persistence.
- **Capture project metadata.** Lazudi project pages are unusually rich — store the project's numeric ID and name in `raw_data.project = { name, lazudi_id }` for future Building-model backfill. Don't scrape project pages directly in this batch.
- **Capture agent + agency ID** (e.g., PBRE `ID:7390R`) into `raw_data.agency_id` for future cross-source dedup work.
- **Verification step (mandatory after merge):** `workflow_dispatch` for PTY with `--limit 30 --dry-run` first to inspect parser output, then a real `--limit 100` run. Crons stay commented out until both produce sensible numbers and a manual spot-check confirms 5–10 listings have correct project/price/bed/sqm.
