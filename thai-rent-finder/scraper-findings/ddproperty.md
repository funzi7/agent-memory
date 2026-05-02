# DDProperty — Live Inspection (2026-05-02)

## TL;DR

**Recommend deferring DDProperty out of Batch 3.** PropertyGuru (DDProperty's parent) runs enterprise-grade Cloudflare Bot Management. Direct fetches return 403 from every IP I tried. The only commercial scraper for this site (Apify, $20/mo) explicitly markets "enterprise-grade residential proxies" + "rotating full browser fingerprints per session" — i.e. residential proxies are table stakes, datacenter IPs (Vercel and GH Actions both) will not work, and plain Playwright with our FazWaz-style stealth tweaks is unlikely to be enough.

The roadmap entry assumed `__NEXT_DATA__` JSON would make this easy. That assumption is invalidated: even if the JSON is there, we can't reach the page to read it.

## Tier recommendation

**Tier 2 (GH Actions) — but with significant doubt that it will work.** Realistic paths:

1. **Defer.** Keep Batch 3 to DDProperty's two easier siblings (Hipflat, Lazudi) plus one of Bahtsold/etc.
2. **Pay for managed scraping.** Subscribe to the Apify actor (`fatihtahta/ddproperty-scraper`, $20/mo flat) and write a thin GH Actions job that pulls its dataset and ingests it. This trades $20/mo for dev time and a working DDProperty source. Code in our repo stays small.
3. **Try Tier 2 + stealth and accept it may not scale.** Plain Playwright on GH Actions, with the FazWaz stealth tweaks. Expect 403s from a non-trivial fraction of requests; likely to degrade as Cloudflare updates rules. Not recommended given the project's "fewer dependencies, less hackery" preference.

I'd recommend (1) for now, revisit (2) in Batch 5 if DDProperty inventory looks worth the $20/mo after we see what Hipflat / Lazudi yield.

## URL patterns

All patterns inferred from Google-indexed search snippets and from the Apify scraper's published example output (which uses real DDProperty URLs). I could not directly fetch any DDProperty page — every attempt returned 403.

### Index by city (path-based)
- Pattern: `/en/condo-for-rent/in-{slug}-th{provinceCode}`
- BKK: `/en/condo-for-rent/in-bangkok-th10` (53,474 listings)
- PTY: `/en/condo-for-rent/in-pattaya-th20` (~1,370 listings) — note `th20` is Chonburi province, which contains Pattaya. The slug is "pattaya" but the underlying filter is province-level.
- CMI: `/en/condo-for-rent/in-chiang-mai-th50`
- PHK: not yet verified — likely `/en/condo-for-rent/in-phuket-th{XX}` (need to discover code)
- SAM: not yet verified — Koh Samui is in Surat Thani province, likely `/en/condo-for-rent/in-koh-samui-th{XX}`

Province codes observed: TH10=Bangkok, TH20=Chonburi/Pattaya, TH50=Chiang Mai. The other two (Phuket, Surat Thani) need a homepage discovery pass once we can actually fetch.

There's also a finer-grained sub-area filter: `in-bang-lamung-th200401` returns 153 listings (smaller subset of Pattaya). For our purposes, the province-level URL is the right entry point.

### Index by city (query-string-based, alternative)
The Apify scraper input example uses: `/en/property-for-sale?listingType=sale&page=1&isCommercial=false&freetext=phrom+phong`

By inference for rent: `/en/property-for-rent?listingType=rent&page=1&isCommercial=false&freetext=pattaya`. Not verified live. Path-based is the canonical SEO URL; prefer it.

### Pagination
- Path-based: `/{pageNum}` appended to the index URL.
  Verified example from Google snippet: `https://www.ddproperty.com/en/property-for-rent/in-chon-buri-th20/10` is page 10.
- Query-string-based: `?page={N}`, used in the alternative URL form above.
- Footer pattern observed in snippets: `First · Previous · 1(current) 2 · 3 · 4 · ... 8 · Next · Last`

### Detail (individual listing) page
- Pattern: `/en/property/{project-slug}-for-rent-{numericId}`
- Numeric IDs are 8–9 digits (e.g., `500278283`, `11457577`).
- Verified example (search hit): `https://www.ddproperty.com/en/property/the-base-uptown-for-rent-500278283`
- Verified example (Apify sample, sale variant): `https://www.ddproperty.com/en/property/the-seed-musee-bangkok-for-sale-11457577`
- The `for-rent` vs `for-sale` segment in the URL is the critical sale-vs-rent disambiguator.

### Project (building aggregation) page — NOT a listing
- Pattern: `/en/condo-for-rent/at-{project-slug}-{projectId}`
- Example: `/en/condo-for-rent/at-once-pattaya-7398` ("There are 22 Condos for Rent at Once Pattaya")
- Do NOT treat these as individual listings. They aggregate units within one building. Useful for cross-source dedup later (the Building model), not for the listing crawl. Distinguish by URL prefix: `at-` is project, `/en/property/` is unit listing.

### Photo CDN
- Pattern: `https://th1-cdn.pgimgs.com/listing/{listingId}/UPHO.{photoId}.V{size}/{slug}.jpg`
- Size variants in URL path (`V800`, almost certainly also `V200` / `V400`). Our existing `dedupeImageUrls()` should handle this once the size-suffix regex covers `Vxxx` paths — verify in code before merging.

## Index page selectors

**Not verified.** Could not fetch HTML. The roadmap's hint that DDProperty uses `__NEXT_DATA__` is plausible but unverified — the SEO-friendly URLs and the SSR-style snippets Google indexes suggest server-rendered HTML with hydration data, but I can't confirm.

What I can say from snippets:
- Each card displays: title (e.g., "1 Bedroom Condo for rent at Once Pattaya Condominium"), price ("฿45,000 /mo"), price per sqm ("฿865.38 / sqm"), address, beds, baths, sqm, property type, "Built: YYYY", listed/reposted date, agent name.
- A small numeric photo count appears as a separator before each card (likely a photo-count badge — saw values "29", "11", "13", "15").
- Some cards are flagged "Featured Agent" or "Verified".
- "Map View" / "List" toggle exists on the index — implies the list view is the default and worth scraping; map view may load via XHR.

## Detail page data shape

From the Apify scraper's published sample output (real DDProperty data), the detail page yields:

```json
{
  "id": 11457577,
  "title": "The Seed Musee, Bangkok",
  "url": "https://www.ddproperty.com/en/property/the-seed-musee-bangkok-for-sale-11457577",
  "price": 3800000,
  "currency": "THB",
  "bedrooms": 1,
  "bathrooms": 1,
  "floorAreaSqm": 37,
  "pricePerSqm": "102,702.7",
  "address": "119 Soi Sukhumvit 26, Khong Tan, Khlong Toei, Bangkok",
  "propertyType": "Condo",
  "postedOn": "2 Aug 2025",
  "developer": "Pruksa Real Estate - ...",
  "agentName": "NATTAPHONG Yodmanotham (K. Book)",
  "agentProfileUrl": "https://www.ddproperty.com/en/agent/{slug}-{agentId}",
  "images": ["https://th1-cdn.pgimgs.com/listing/{id}/UPHO.{photoId}.V800/...jpg"],
  "videos": ["<iframe src=\"https://www.youtube.com/embed/...\" ...>"]
}
```

**Selectors are unverified.** A scraper would need to either parse `__NEXT_DATA__` (likely the cleanest path) or pick CSS selectors after live inspection. Defer selector specifics to post-fetch verification.

**Price formats observed:** `฿X,XXX /mo` (rent), `฿X /sqm` (price-per-sqm), absolute baht for sale. The `,` thousands separator is standard. The `/mo` vs `/sqm` distinction is critical — easy to mistake one for the other.

**Address format:** comma-separated, ascending granularity (street → sub-district → district → city → province). The province appears in parentheses on Pattaya listings, e.g. `Bang Lamung (Pattaya), Chon Buri (Pattaya)`.

## Filters required

- **Sale-vs-rent.** Trivial — URL contains `for-rent` vs `for-sale`. Reject sale listings.
- **Property type.** DDProperty mixes condos, detached houses, townhouses, apartments, commercial, and land in `property-for-rent` results. Either use the narrower `condo-for-rent` index URL OR filter by `propertyType === "Condo"` post-fetch. The narrower URL is preferred (saves requests).
- **Hotels masquerading as monthly.** Less common on DDProperty than Renthub (the domain is sale-and-rent residential, not hospitality). But check title/description for "Hotel", "Resort", "Serviced" signals to be safe.
- **No expiry banner observed.** Unlike Living Insider, DDProperty appears to remove old listings rather than keep them with an "expired" banner — but this is unverified. Implement a status-based filter only after seeing live behavior.
- **Sub-district sub-areas.** A Pattaya scrape via `in-pattaya-th20` will include some Sriracha, Sattahip, Si Racha listings (whole Chonburi province). For Pattaya-strict, filter post-fetch on address containing `Pattaya` / `Bang Lamung` / `Jomtien` / `Na Kluea` / `Pratumnak`. Similar issue likely on Phuket once we figure out its province code.

## Gotchas / surprises

- **403 from every endpoint.** Index, detail, even homepage. PropertyGuru's Cloudflare case study (cloudflare.com/case-studies/propertyguru/) explicitly says "Cloudflare's data-driven solution cut our malicious bot traffic in half" — they're actively tuning bot detection against scrapers.
- **The Apify scraper costs $20/mo flat for unlimited.** This sets the price floor. If we burn more than ~3 hours of dev time fighting the anti-bot, we've already lost vs just paying for it.
- **Two URL patterns for the same data.** Path-based (`/in-pattaya-th20`) and query-string-based (`?listingType=rent&freetext=...`). Pick one. Path-based is the canonical SEO route and what Google indexes — likely more stable.
- **Project pages and listing pages share `condo-for-rent` prefix.** Distinguish by `at-{slug}-{id}` (project) vs `/en/property/{slug}-for-rent-{id}` (listing). Don't enqueue project URLs as listings.
- **"Pattaya" is not a province.** The DDProperty UI surfaces "Pattaya" as a top-level city, but underlying it's Chonburi (TH20). Listings outside Pattaya proper but inside Chonburi will appear. Plan for post-filtering.
- **Listing IDs span two ranges.** I saw 9-digit IDs (`500278283`) and 8-digit IDs (`11457577`). Likely two ID generations — older listings and newer. Both are valid; treat IDs as opaque strings.

## Verified vs guessed

**Verified (from Google snippets that indexed real pages):**
- `/en/condo-for-rent/in-pattaya-th20` exists, ~1,370 listings.
- `/en/condo-for-rent/in-bangkok-th10` exists, ~53,000 listings.
- `/en/condo-for-rent/in-chiang-mai-th50` exists.
- `/en/property-for-rent/in-chon-buri-th20/10` is page 10 — pagination is path-based.
- Detail URL format: `/en/property/{slug}-for-rent-{id}` (sample: `/the-base-uptown-for-rent-500278283`).
- Project pages use `/en/condo-for-rent/at-{slug}-{id}` and aggregate units, not individual listings.
- Image CDN host: `th1-cdn.pgimgs.com` with `Vxxx` size variants.
- Card-level data shape (title, price, beds, baths, sqm, address, agent, listed-on date).

**Guessed (inferred, not verified):**
- Phuket province code.
- Surat Thani / Koh Samui province code and slug.
- Whether listings expire silently (no banner) vs persist with a state flag.
- Selector specifics for index cards and detail pages.
- Whether `__NEXT_DATA__` is present and contains the full listing payload.
- Whether plain Playwright + `--disable-blink-features=AutomationControlled` will pass Cloudflare. Apify's marketing says no; the FazWaz pattern says maybe.

## Hand off

Send to Spec Writer with this scope (in priority order):

**Recommended path:** "Do NOT implement DDProperty in Batch 3. Move to Batch 5 or later, possibly after evaluating a paid scraping API. Update roadmap.md to reflect that the original 'Next.js, easy to scrape' assumption is wrong: PropertyGuru runs enterprise Cloudflare Bot Management, plain Playwright on GH Actions is unlikely to clear it, and the only known working scraper uses residential proxies + fingerprint rotation."

**If Dima still wants to attempt DDProperty in Batch 3:** "Implement DDProperty scraper as Tier 2 (GH Actions + Playwright). Use index URL `/en/condo-for-rent/in-{slug}-th{code}` with path-based pagination. Cities to map: PTY (in-pattaya-th20), BKK (in-bangkok-th10), CMI (in-chiang-mai-th50); discover PHK and SAM codes via homepage during first run. Detail URL pattern is `/en/property/{slug}-for-rent-{numericId}`. Critical filters: reject `for-sale` URLs; restrict to condo property type; address-based sub-filter for Pattaya-proper to exclude rest-of-Chonburi. Photo CDN is `th1-cdn.pgimgs.com` with `Vxxx` size variants — extend `dedupeImageUrls()` if needed. Selectors must be discovered live during first `workflow_dispatch` run because direct fetch from this assistant returns 403. **Build in an explicit Cloudflare-block detector that aborts the run with a clear error if the first page returns 403** so we don't burn runner minutes on doomed attempts. Acceptance criterion: `listings_added > 0` on first manual workflow_dispatch for PTY."
