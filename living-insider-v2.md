# Living Insider — Live Inspection v2 (2026-05-03)

> Follow-up to `living-insider.md`. Triggered by debug log from production scraper run:
> **0 `livingdetail_en` links, 1079 `detail_en` links** on a single index page.
>
> v2 supersedes v1 on points: (a) link pattern (livingdetail_en is dead in current pages — confirmed), (b) the high anchor count's interpretation, (c) dedup strategy.
>
> v2 does NOT replace v1 on architecture (still Tier 2, still defer detail page enrichment) — those decisions hold.

## Headline corrections to v1

1. **`livingdetail_en` is not used by current cards.** v1 said both patterns coexist on cards — this is wrong for cards on rendered pages. The legacy URLs still resolve when followed, but no card on `living_zone_en/42/Condo/Rent/1/...` links to them. **The implementation must search ONLY `detail_en`.** Searching for `livingdetail_en` returns zero. (PR #46's behavior is consistent with the scraper looking for the wrong pattern.)
2. **1079 anchors ≠ 1079 listings.** Each card emits 3 anchors with the *same href* (title + project name + specs row). With 50 listings/page that's 150. A page with 1079 anchors implies either ~360 unique listings on the page (likely — Living Insider may render many or all listings server-side) or substantial sidebar duplication. Either way, **dedup by source ID is mandatory**, otherwise the scraper will write 3× duplicates per listing.

## Exact detail-link pattern

### URL shape
```
https://www.livinginsider.com/detail_en/{slug}-{numeric_id}
```

- Path starts with `/detail_en/`
- Slug is hyphen-separated, can contain percent-encoded UTF-8 (Thai characters, emoji)
- **Trailing component is always a numeric listing ID** preceded by a hyphen
- **No `.html` suffix** on the new pattern

Verified examples (real, from this and prior fetches):
```
/detail_en/...-urgent-promotion-...-2572077
/detail_en/condo-for-sale-condo-laguna-beach-resort-2-studio-2979731
/detail_en/...-901635
```

### Selector (Cheerio)
```ts
const $cards = $('a[href*="/detail_en/"]');
```

That's the **only** selector that's safe to use without verified class names. v1's earlier suggestion to also include `livingdetail_en` is REMOVED — that pattern is not live on cards.

### source_id extraction
```ts
function extractSourceId(href: string): string | null {
  // Trailing numeric segment after the last hyphen, before any query/fragment.
  // Tolerates percent-encoded slugs (the path does NOT contain raw `?` or `#` from the slug itself).
  const m = href.match(/-(\d+)(?:[/?#]|$)/);
  return m ? m[1] : null;
}
```

Why this regex:
- Anchored on `-(\d+)` so emoji-heavy slugs don't matter
- `(?:[/?#]|$)` allows for tracking query strings the site might add
- Returns string (Listing.source_listing_id is a string in the schema)

Test cases the implementation should include:
```
'/detail_en/foo-bar-2572077' → '2572077'
'/detail_en/foo-bar-2572077?utm=x' → '2572077'
'/detail_en/condo-for-sale-condo-laguna-beach-resort-2-studio-2979731' → '2979731'
'/livingdetail_en/915388/old-pattern.html' → '915388'  // legacy pattern, regex still works on these but they shouldn't appear on current pages
'https://www.livinginsider.com/detail_en/foo-bar-2572077' → '2572077'
'/detail_en/foo-bar' → null  // no trailing id
'/detail_en/foo-2-bar-2572077' → '2572077'  // takes the LAST numeric, not '2'
```

That last case matters: the slug "Laguna Beach Resort 2" has a `-2-` in the middle. The regex must take the **last** numeric segment, which `String.prototype.match` with this pattern does (regex is non-greedy on the left because `-(\d+)` only matches contiguous digits, and JavaScript scans left-to-right but the boundary `(?:[/?#]|$)` anchors to end-of-string/path).

Actually — on second thought, JavaScript regex without `g` returns the *first* match. Let me give the safe form:

```ts
function extractSourceId(href: string): string | null {
  // Strip query/fragment, then take the trailing numeric run.
  const path = href.split(/[?#]/)[0];
  const m = path.match(/-(\d+)$/);
  return m ? m[1] : null;
}
```

This is unambiguous: split off query, then anchor `$` to end of path.

## Card container — **NOT directly verified**

> ⚠️ **Honest answer**: I cannot tell you whether the wrapper class is `div_listing`, `div_card`, `box-prop`, `result-item`, or something else. `web_fetch` only returns markdown-extracted text from this site, never raw HTML. Browser DOM inspection would settle this in 5 seconds; the live-fetch tooling I have can't.
>
> **What I can give you**: a strategy that doesn't require knowing the class name, plus a one-shot probe to discover it.

### Recommended strategy: "anchor-first, group by ID"

Don't try to find cards top-down via container class. Instead, find anchors first, then group them:

```ts
const anchors = $('a[href*="/detail_en/"]').toArray();

// Group anchors by source_id. Each card emits 3 anchors with the same href.
const byId = new Map<string, cheerio.Element[]>();
for (const a of anchors) {
  const href = $(a).attr('href') ?? '';
  const id = extractSourceId(href);
  if (!id) continue;
  const arr = byId.get(id) ?? [];
  arr.push(a);
  byId.set(id, arr);
}

// For each unique ID, the 3 anchors are the title, project name, and specs row
// (in that DOM order, based on the markdown extraction). Treat them as a virtual card:
for (const [sourceId, anchorGroup] of byId) {
  // anchorGroup[0] = title link (text is the long title)
  // anchorGroup[1] = project link (text is the project name only)
  // anchorGroup[2] = specs link (text contains "29 Sq.m. (759 baht/sq.m.) Fl. 5-10 1 Rooms 1 Rooms")
  // ...extract from each by text(), no class names needed
}
```

**Advantages**: works regardless of wrapper class; immune to template changes that touch container CSS but not the anchor structure; naturally dedupes the 3-anchors-per-card emission.

**Caveat**: assumes anchor DOM order matches title→project→specs. If a card has a different layout (e.g., the "Spotlight" sponsored card might add a 4th "Add to favorite" anchor or a 5th badge anchor — though favorite is an `<img>` not an `<a>`, so probably fine). The implementation should:
- Tolerate `anchorGroup.length !== 3` (skip those, log them)
- Verify that `anchorGroup[2]` text contains "Sq.m." or "Rooms" before treating it as the specs row; if not, fall back to scanning all 3 for the one with specs-like text

### One-shot probe to recover the actual class name (if Dima wants to fix this properly)

In the production scraper, before writing the listing, log the wrapper class for the first card found:

```ts
if (process.env.DEBUG_LIVING_INSIDER === '1' && cardIndex === 0) {
  const firstAnchor = anchorGroup[0];
  const wrapper = $(firstAnchor).closest('[class]');
  console.log('LIVING_INSIDER_PROBE wrapper.class=', $(wrapper).attr('class'));
  console.log('LIVING_INSIDER_PROBE wrapper.outerHTML=', $.html(wrapper).slice(0, 2000));
}
```

Or simpler — log the first matched anchor's parent chain unconditionally on the first run, copy class names from logs, then commit a tighter selector in v3. **The anchor-first strategy above already works without this** — the probe is for tightening the selector later if dedup-by-ID proves unreliable.

### What `div_listing` vs `div_card` would imply (for context)

The site's `assets18/` versioning suggests a 2018-era jQuery/Bootstrap codebase. Class conventions of that era + the Thai dev community typically use either snake_case (`div_listing`) or kebab-case (`box-prop-list`). Both are guesses. The anchor-first approach sidesteps this entirely.

## Implementation summary for Spec Writer / Claude Code

**Drop these from the current scraper:**
- Any reference to `livingdetail_en` in the link selector — it's unreachable
- Any selector that depends on a specific `div.something` class for the card wrapper — unverified

**Use these exact pieces:**
- Index URL: `https://www.livinginsider.com/living_zone_en/42/Condo/Rent/{page}/Chonburi-Pattaya-Bangsa.html` (unchanged from v1)
- Card discovery: `$('a[href*="/detail_en/"]')`
- source_id extraction: trailing `-(\d+)$` after stripping query/fragment
- Dedup: `Map<source_id, anchors[]>` — emit one listing per unique ID
- Per-card data: text content of anchors[0] (title), anchors[1] (project name), anchors[2] (specs string to parse for sqm/beds/baths/floor); price computed from `sqm × pricePerSqm` parsed from anchors[2]

**Sanity guards (must-have):**
- Skip groups where `length < 3` and log
- Skip when `extractSourceId` returns null
- Cap dedup count — if a page yields > 200 unique IDs, something is wrong (sidebar contamination), log a warning. Real per-page count is probably 30–60.

**Acceptance for the next CLI run:**
- `npx tsx scripts/scrape-cli.ts --source LIVING_INSIDER --city PTY --limit 10 --dry-run`
- Expect ≥ 5 unique listings, each with non-empty project name and non-zero sqm/price
- If `cardsFound: 0` again, the bug is no longer the link pattern — it's something deeper (HTTP-level: cookie gate, UA-blocking, etc.) and we'll need a full HTML dump artifact to diagnose

## What's verified vs guessed (this session)

### Verified
- ✅ `detail_en` is the active pattern; `livingdetail_en` is absent from current cards (Dima's debug log: 1079 vs 0)
- ✅ source_id pattern: trailing `-(\d+)` on the URL path (verified across 3+ different listing URLs in observable traffic)
- ✅ Multiple anchors per card pointing to the same href — confirmed in the Spotlight Copacabana card observed via markdown extraction
- ✅ Index page is server-rendered with anchors visible to plain HTTP fetcher
- ✅ Page is producing >>50 detail_en anchors → dedup is mandatory, not optional

### Guessed / not verifiable here
- ⚠️ The 3-anchors-per-card pattern: confirmed on 1 card (Spotlight Copacabana). Other cards likely follow the same template, but I haven't extracted multiple cards' worth from the markdown to prove it. Implementation must tolerate variation.
- ⚠️ Card wrapper class name: completely unknown. The strategy above doesn't need it; if a future scraper rewrite wants to use it, a runtime probe is required.
- ⚠️ Whether 1079 includes hidden/lazy-loaded content vs a sidebar with related listings vs Living Insider really showing 360+ per page. Doesn't affect correctness of dedup-by-ID, only the upper-bound sanity check.

### Could not fetch
- ❌ Raw HTML at any extraction setting (web_fetch only returns markdown for this site)
- ❌ Detail page bodies (return empty — separate problem documented in v1)

## Where this leaves the scraper

The fix for `cardsFound: 0` is one line:
```diff
- $('a[href*="/livingdetail_en/"]')
+ $('a[href*="/detail_en/"]')
```
…plus the dedup-by-source_id loop and the regex update. v1's broader guidance (Tier 2, defer detail enrichment, expired/closed filters at detail level) all still apply.

If after this fix `cardsFound` is still 0, the issue isn't the link pattern — it's at the HTTP layer (anti-bot, cookie gate, UA filtering on Vercel-vs-GH-Actions IPs, or similar). At that point we need a full response-body artifact dumped from the failing run to diagnose, not another selector inspection.
