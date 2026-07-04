# thai-rent-finder — Diagnostic Findings (cc-latest)

_Read-only audit. All quotes are `file:line` from `funzi7/thai-rent-finder` @ `06d10d9` (default branch tip). No code changed._

Context: today's `scrape.yml` run (thailand-property only, post-PR#78 narrowing) —
`added=5 updated=2 deactivated=49 errors=2`, scrape 60.6s. Log: BKK `yielded=5` →
PTY `2 listings` → summary line immediately.

---

## Q1 — Deactivation semantics (data safety) 🔴

**The deactivation query** — `src/scrapers/core/BaseScraper.ts:200-217`:

```ts
const staleCutoff = new Date(Date.now() - SEVEN_DAYS_MS);         // 200
const stale = await this.prisma.listing.findMany({
  where: {
    source: this.source,                                          // 203
    is_active: true,
    last_seen_at: { lt: staleCutoff },                            // 205
    NOT: { source_id: { in: Array.from(seen) } },                 // 206
    ...(opts?.city ? { city: opts.city } : {}),                   // 207
  },
  select: { id: true },
});
if (stale.length > 0) {
  const r = await this.prisma.listing.updateMany({
    where: { id: { in: stale.map((s) => s.id) } },
    data: { is_active: false },                                   // 214
  });
  deactivated = r.count;
}
```

`SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000` (`BaseScraper.ts:11`).

**a) Scope.** Only `source: this.source` — i.e. only `THAILAND_PROPERTY` rows
(`BaseScraper.ts:203`). It does **NOT** touch other sources. **BUT** the run
today passed **no city** (`scrape.ts` invokes `scraper.run({ city: cityArg })`
with `cityArg` undefined — `package.json:15` = `tsx scripts/scrape.ts thailand-property`,
no 3rd arg). So the `...(opts?.city ? { city } : {})` clause at line 207 is
**absent** → deactivation spans **ALL cities** of THAILAND_PROPERTY (BKK + PTY +
CMI + PHK), not just the two cities actually scraped today. That is exactly why
`deactivated=49` is large: only BKK+PTY were re-seen, so stale CMI/PHK (never
fetched — see Q2) rows can be swept in.

**b) User-status exclusion — NONE.** The `where` clause (`BaseScraper.ts:202-208`)
has **no** join to / filter on `UserStatus`. There is no `status`, no
`SHORTLISTED`, no `favorite` condition anywhere in the query. A listing the user
SHORTLISTED / CONTACTED / VISITED / favorited is deactivated on the same terms as
any other row. **Nothing protects user-curated listings.**

**c) Grace window.** 7 days: `last_seen_at: { lt: staleCutoff }` where
`staleCutoff = now − 7 days` (`BaseScraper.ts:200,205`). So it is **NOT** a
single-run absence — a listing must have gone **unseen for ≥7 days** AND be
missing from the current run's `seen` set to be deactivated. `last_seen_at` is
bumped to `now` on every upsert (`BaseScraper.ts:139`). Practical implication:
the 49 deactivated today are THAILAND_PROPERTY rows last successfully scraped >7
days ago and not re-seen today.

**d) What `is_active=false` means in the UI.**
- Main list `/listings` **hides** it: `where.is_active = true`
  (`src/app/listings/page.tsx:39`).
- Board / kanban **also hides** it: `where: { is_active: true }`
  (`src/app/board/page.tsx:60`) — so a shortlisted card **disappears from the
  board too**, even though its `UserStatus` row is untouched in the DB.
- Detail page **is still reachable by direct link**:
  `prisma.listing.findUnique({ where: { id } })` with **no** `is_active` filter
  (`src/app/listings/[id]/page.tsx:42-49`). It renders normally.

**Verdict (Q1):** 🔴 **Data-safety hole confirmed.** Deactivation is
source-scoped but (today) city-wide, has a 7-day grace, and **does not exclude
listings with user status**. A deactivated shortlisted listing vanishes from both
the main list and the board; only a saved `/listings/<id>` URL still reaches it.
The row is not deleted (UserStatus/notes survive), but it is effectively
invisible in the normal UI.

**e) Ready-to-run verification** — see the command at the very bottom of this doc.

---

## Q2 — errors=2 + city coverage

**a) City list + cap.** `src/scrapers/sources/thailand-property.ts:36-41`:

```ts
export const CITY_PATH: Record<string, string> = {
  BKK: "bangkok",
  PTY: "chonburi/pattaya",
  CMI: "chiang-mai",
  PHK: "phuket",          // note: PHK (Phuket), not "HKT"
};
```

4 cities: **BKK, PTY, CMI, PHK**. When no city is passed, `search()` iterates all
four: `cityCodes.push(...Object.keys(CITY_PATH))` (`thailand-property.ts:903`).
`PER_CITY_CAP = 5` (`thailand-property.ts:20`). Deadline: `PER_RUN_DEADLINE_MS =
55_000` (`thailand-property.ts:27`).

**b) What increments `errors`.** The summary's `errors=` is
`r.errorCount = this.errors.length` (`BaseScraper.ts:237`, printed at
`scripts/scrape.ts:28`). `this.errors` grows **only** via `logError()`
(`BaseScraper.ts:28-30`). In the thailand-property path `logError` is called for:
unknown city (`thailand-property.ts:895`), **deadline before a city**
(`:908`), index-fetch failure (`:937`), anti-bot indicators (`:971`), no detail
links (`:993`), **deadline mid-city after N listings** (`:1004`), and detail-parse
failure (`:1034`); plus per-listing upsert/concerns failures in the runner
(`BaseScraper.ts:182,189`). Stale-deactivation does **not** log an error.

**c) Why the summary appears right after 2 PTY listings.** The loop **exits early
on the 55s deadline** — CMI/PHK never run; the two errors ARE the two deadline
log lines, not city failures.

Mid-city deadline (fires during PTY) — `thailand-property.ts:1001-1010`:
```ts
for (const url of candidate) {
  if (yielded >= PER_CITY_CAP) break;
  if (Date.now() - runStartMs > PER_RUN_DEADLINE_MS) {
    this.logError({ url, message:
      `Deadline reached after ${yielded} listings in ${cityCode}; stopping.`, ... }); // 1004
    return;                                                                            // 1009
  }
```

Top-of-run deadline (fires before CMI) — `thailand-property.ts:906-915`:
```ts
for (const code of cityCodes) {
  if (Date.now() - startMs > PER_RUN_DEADLINE_MS) {
    this.logError({ message:
      `Deadline reached before scraping ${code}; stopping early.`, ... });             // 908
    break;                                                                             // 912
  }
  yield* this.searchCity(code, startMs);
}
```

Sequence: BKK fills `PER_CITY_CAP=5` (~10s/page Playwright each pushes the clock
past 50s), PTY parses 2 then trips the mid-city deadline → `logError` #1 + `return`;
control returns to `search()`, which checks the deadline before CMI → `logError`
#2 + `break`. **CMI and PHK are never fetched.** That yields exactly
`errors=2`, and `added=5 (BKK new) + updated=2 (PTY existing) = 7` matches the
7 listings actually parsed. The 60.6s total > 55s deadline confirms the timeout
fired.

**Verdict (Q2):** Loop exits early on the 55s deadline after BKK+PTY. The 2
errors are the two "Deadline reached…" messages; **CMI/PHK did not run and did not
fail**. Coverage today was 2 of 4 cities.

---

## Q3 — Lazudi `description` = "View property listing."

**Where description is set** — `src/scrapers/sources/lazudi.ts:444-454`:

```ts
const metaDescription =
  $('meta[name="description"]').attr("content")?.trim() ?? "";     // 444-445
const metaParsed = parseLazudiMetaDescription(metaDescription);    // 446

let description: string | null =
  metaDescription ||                                               // 449  ← used first
  $("main").first().text().trim().slice(0, 2000) ||                // 450  ← fallback
  null;
if (description && description.length > 5000) description = description.slice(0, 5000);
```

`description` is set to the raw `<meta name="description">` content. The literal
string **"View property listing." is nowhere in the repo** (grep across `src/`,
`scripts/` = 0 hits), so it is coming straight from Lazudi's page: the meta tag
holds a generic site-default placeholder ("View property listing.") rather than
the rich summary the findings doc predicted. Because that string is non-empty, the
`||` short-circuits at line 449 and the `$("main")` body fallback (line 450) —
which would capture the real text — **never runs**. `parseLazudiMetaDescription`
also returns `null` on that placeholder (its regex `META_DESCRIPTION_RE`,
`lazudi.ts:71-72`, doesn't match), so price/beds/sqm quietly fall through to the
title/body parsers — but the `description` field is still stuck on the placeholder.

**Where the real full description lives** (per the findings doc, not live-fetched)
— `agent-memory/thai-rent-finder/scraper-findings/lazudi.md:123-128`:

> **Description body** (agent-written… PBRE Real Estate templates…):
> - "This is {N} Bedrooms, {N} Bathrooms Condo for Rent in {Sub-area}, offering
>   {Sqm} Sqm of living area, located on the {N}th floor, comes full furnished, …"
> - A "Facilities:" block …
> - A "Location" paragraph …

That agent-written paragraph is in the **page body** (SSR HTML) — the `$("main")`
content the code already has as a fallback but never reaches. The same doc flags a
possible cleaner source: a `__NEXT_DATA__` JSON blob (`lazudi.md:154`) that was
never verified/parsed.

**Verdict (Q3):** The `description` field trusts `<meta name="description">`, whose
Lazudi value is the placeholder "View property listing." The real listing prose is
the body paragraph (reachable via `$("main")`, or ideally a `__NEXT_DATA__` blob);
the `||` chain at `lazudi.ts:449` prevents the body fallback from ever being used.

---

## Q4 — Listing card contents

Component: `src/components/ListingCard.tsx`. Fields rendered (all inside a `<Link>`
to the internal detail page):
- Photo `listing.photos[0]` (`:57-70`)
- Source badge `SOURCE_LABELS[listing.source]` (`:73`)
- User-status badge (`:76-80`)
- **Title** `listing.title` (`:86`)
- Price (`:96`), City + district badge `{cityLabel}{listing.district ? …}` (`:98-99`)
- Bedrooms (`:106`), Bathrooms (`:111`), Sqm `formatSqm(listing.sqm)` (`:116`),
  Floor `listing.floor` (`:118-123`)
- Concern badges (`:128-132`), top-3 amenities (`:134-157`), favorite button
  (`:159-165`), compare checkbox (`:166-170`)

**building_name / project name:** **NOT rendered.** There is no reference to
`listing.building_name` anywhere in `ListingCard.tsx`. The card shows only
`listing.title` (`:86`).

**Card click target:** the **internal detail page**, not the external source —
`<Link href={/listings/${listing.id}}>` (`ListingCard.tsx:52-53`). The outbound
source link (`source_url`) is only on the detail page and the compare table (Q6).

**Verdict (Q4):** Card renders title/price/city/beds/baths/sqm/floor/amenities/
concerns; **no building/project name**; click → internal `/listings/<id>`.

---

## Q5 — Sort / filter inventory

**a) Schema (`prisma/schema.prisma`, model `Listing`).**
- Year built: field is **`building_year Int?`** (`schema.prisma:86`) — not
  `year_built`/`built_year`.
- Size: field is **`sqm Float?`** (`schema.prisma:72`) — not `size_sqm`/`area`.

Population by scrapers (grep of `src/scrapers/`):
- `building_year` is written by **thailand-property** (`thailand-property.ts:1156,1195`
  via regex `(?:built|completed|year)…(20\d{2}|19\d{2})`) and **fazwaz**
  (`fazwaz.ts:378,413`). It is **NOT** set by lazudi, hipflat, livinginsider,
  renthub (their `RawListing` returns omit it → `raw.building_year ?? null` at
  `BaseScraper.ts:126` stores null). So `building_year` is **sparsely populated**
  (best-effort, 2 of 6 sources).
- `sqm` is written by **every** source that returns specs — thailand-property
  (`:1189`), lazudi (`:505`), hipflat (`:239`), livinginsider (`:1250`), fazwaz,
  renthub. Well populated.

**b) Listings page + its query.** The listings page is a server component that
builds the Prisma query inline (`src/app/listings/page.tsx`) — **there is no
separate `/api/listings` route**; filters are parsed from URL search params by
`src/types/filters.ts`.

Current **sort** options — `SortKey` (`filters.ts:3`) = `"newest" | "price_asc" |
"price_desc" | "size_desc"`, applied at `listings/page.tsx:74-87`:
```ts
switch (filters.sort) {
  case "price_asc":  orderBy = { price_thb: "asc" };  break;   // 76-78
  case "price_desc": orderBy = { price_thb: "desc" }; break;   // 79-81
  case "size_desc":  orderBy = { sqm: "desc" };       break;   // 82-84
  default:           orderBy = { last_seen_at: "desc" };       // 85-86 (newest)
}
```
URL param: `?sort=price_asc|price_desc|size_desc` (default `newest`, omitted)
(`filters.ts:123-130,163`).

Current **filter** options (`listings/page.tsx:38-72`, parsed in `filters.ts`):
`city` (multi), `sources` (multi), `maxPrice` (upper bound only), `minBedrooms`
(lower bound), `status`, `favoriteOnly`, `betterOnly`, `amenities`,
`excludeConcerns`.

**What's missing to support the requested features:**
| Requested | Present? | Gap |
|---|---|---|
| sort by size | partial | only `size_desc`; **no `size_asc`** |
| sort by year built | ❌ | no `building_year` sort key at all |
| asc/desc toggle | ❌ | direction is baked into each enum value (`price_asc/desc`, `size_desc` only); no generic direction param |
| filter by year-built range | ❌ | no `building_year` filter (and field is sparsely populated — see a) |
| filter by sqm range | ❌ | only `maxPrice`/`minBedrooms` exist; no `sqm` min/max |

**Verdict (Q5):** Sort = 4 fixed keys (newest / price asc / price desc / size desc);
no size-asc, no year-built sort, no direction toggle. Filters have no sqm-range and
no year-built-range. Adding year-built anything is limited by `building_year` only
being populated by thailand-property + fazwaz.

---

## Q6 — Source-link touchpoints (affiliate prep)

Every outbound link to the source site uses the raw **`source_url`** field
(schema `source_url String`, `schema.prisma:56`), with **no per-source
differentiation**. Exactly **two** touchpoints:

1. **Detail page** — `src/app/listings/[id]/page.tsx:309-314`:
   ```tsx
   <Button asChild variant="outline" size="sm" className="shrink-0">
     <a href={listing.source_url} target="_blank" rel="noreferrer noopener">
       פתח באתר המקור
       <ExternalLink className="h-4 w-4" />
   ```
2. **Compare table** — `src/app/compare/page.tsx:396-401`:
   ```tsx
   <a href={l.source_url} target="_blank" rel="noreferrer noopener"
      className="inline-flex items-center gap-1 text-xs hover:underline">
     פתח באתר המקור
   ```

Both are identical ("פתח באתר המקור", raw `source_url`, `_blank`).

Not source-site links (for completeness):
- **ListingCard** click → internal `/listings/<id>` (`ListingCard.tsx:52-53`) —
  no `source_url`.
- **ContactActions** (`src/components/ContactActions.tsx:47-57`) builds
  `tel:` / `mailto:` / WhatsApp / LINE URLs from `contact_phone` / `contact_email`
  / `contact_line_id` — direct-contact deep links, **not** the source website, so
  out of scope for affiliate wrapping.

**Verdict (Q6):** Two touchpoints only (detail page + compare table), both wrapping
`listing.source_url` uniformly. To add per-source affiliate params, wrap
`source_url` at these two spots (or centralize in one helper keyed on
`listing.source`); no source currently differs.

---

## Q7 — state.md footer duplication

Two-part cause: the **generator emits the marker strings inside its footer note**,
and the **workflow's preserve step matches that note and re-appends it every run**.

**Generator footer** — `scripts/generate-state.js:165-168` (end of `stdout.write`):
```
---

_Auto-generated. Add manual content between `<!-- manual-section-start -->` and `<!-- manual-section-end -->` markers — the workflow appends preserved blocks at the file tail._
```
The footer note is a **single line** that literally contains both
`<!-- manual-section-start -->` and `<!-- manual-section-end -->` (as backticked
documentation).

**Workflow preserve/append logic** — `.github/workflows/auto-update-state.yml:182-189`:
```bash
if [ -f "$STATE_PATH" ] && grep -q "manual-section-start" "$STATE_PATH"; then
  sed -n '/<!-- manual-section-start -->/,/<!-- manual-section-end -->/p' \
    "$STATE_PATH" > /tmp/manual-section.txt
  if [ -s /tmp/manual-section.txt ]; then
    echo "" >> "$NEW"
    cat /tmp/manual-section.txt >> "$NEW"
  fi
fi
```

**Why it re-appends (not idempotent):**
1. `grep -q "manual-section-start"` is meant to detect a *real* manual block, but
   it also matches the generator's footer note (which mentions the marker).
2. `sed -n '/start/,/end/p'` is a range; because **both** markers sit on the
   **same footer line**, sed opens and closes the range on that one line and
   **prints the footer line itself** as if it were the manual section.
3. That footer line is appended to `$NEW` (which already ends with the generator's
   own footer from step 1) → the file now carries the footer **twice**.
4. Next run, the previous output is `$STATE_PATH`; sed now matches **every** footer
   copy present and re-appends all of them, while the generator re-adds its own —
   so the count grows by one per run. ~20 runs → ~20 duplicate footers.

The workflow's idempotency comment (`auto-update-state.yml:16-18`) and the
diff-skip (`:191`) only guarantee *same-day* no-op; the `Last auto-update:
${today}` line (`generate-state.js:131`) changes daily, so a commit always happens
and each commit accretes one more footer copy. The append target is itself
re-matched next run — the defect is self-feeding.

**Verdict (Q7):** The footer note documents the markers on one line; the
`grep`+`sed` preserve step treats that note as a manual block and appends it, and
because the appended copy is re-scanned next run the footer accumulates ~1×/day.
Fix later by (a) not putting literal markers in the footer, (b) requiring the
markers on their own lines / a real block between them, or (c) making the sed
capture strictly-between-lines and de-duping before append.

---

## Q1e — READY-TO-RUN verification (Riviera Ocean Drive + Dusit Grand Condo View)

Do **NOT** run any DB writes. Two read-only options.

**Option A — existing admin endpoint** (`/api/admin/audit-listings`, read-only,
supports `include_inactive=true`; `src/app/api/admin/audit-listings/route.ts`).
Needs the `SEED_KEY` secret. Returns `is_active` + `last_seen_at` per row:

```bash
SEED_KEY='<the SEED_KEY secret>'
curl -s "https://thai-rent-finder.vercel.app/api/admin/audit-listings?key=${SEED_KEY}&city=PTY&include_inactive=true&limit=500" \
  | jq '.rows[]
        | select(.title | test("riviera|dusit grand"; "i"))
        | {title, source, is_active, last_seen_at, source_url}'
```
(City-scoped to PTY, `include_inactive=true` so deactivated rows appear; the `jq`
regex matches either building regardless of source. If nothing prints, widen by
dropping `&city=PTY`.)

**Option B — direct read-only SQL** (psql; Prisma default table names are
PascalCase, no `@@map`). Also confirms they're shortlisted and thus would be
hidden if deactivated:

```sql
SELECT l.id, l.source, l.title, l.building_name,
       l.is_active, l.last_seen_at, us.status
FROM "Listing" l
LEFT JOIN "UserStatus" us ON us.listing_id = l.id
WHERE l.city = 'PTY'
  AND (
    l.title ILIKE '%riviera%'      OR l.building_name ILIKE '%riviera%'
    OR l.title ILIKE '%dusit grand%' OR l.building_name ILIKE '%dusit grand%'
  )
ORDER BY l.last_seen_at DESC;
```
Expected-safe result: `is_active = true`. If either shows `is_active = false` with
a non-null `us.status` (SHORTLISTED+), today's city-wide deactivation swept a
user-curated listing — the Q1 hole firing in production.
