# thai-rent-finder — cc-latest

## Diagnostic: schema/extraction + card/detail + stale-concern cleanup (READ-ONLY)

At `main` tip `bf328cf`. Feeds the next features PR (card enrichment, always-visible
search, stale-concern cleanup, furniture rules) + a building-enrichment decision.

---

## AREA 1 — Listing schema + what each scraper extracts

### 1a) Listing model (`prisma/schema.prisma`) — relevant fields + date semantics
- `floor Int?`, `total_floors Int?`, `building_year Int?`, `sqm Float?`,
  `furnished Boolean?`, `pet_friendly Boolean?`, `view_type String?`,
  `building_name String?`. **There is NO `furniture` field — furnished state is the single
  `furnished Boolean?`.**
- Date fields (NO `created_at`, NO `first_seen`, NO `updated_at` on Listing):
  - `scraped_at DateTime` — when the row was last (re)parsed/written.
  - `last_seen_at DateTime` — bumped on every upsert; drives the stale sweep + the
    `@@index([is_active, last_seen_at])`.
  - `last_concerns_recompute_at DateTime?` — comment: "When concerns were last recomputed
    (rule and/or AI). Used by /api/admin/concerns-recompute-all as a freshness gate…".
  - `available_from DateTime?` — listing's own move-in date, not a bookkeeping timestamp.
- So the only "freshness" timestamps are `scraped_at` and `last_seen_at`; an "updated at"
  card/detail line would render one of those.

### 1b/1c) Per-source field writes + available-but-not-extracted
(Fields WRITTEN = present in the object each `parseDetail`/card builder returns.)

**thailand-property** (`src/scrapers/sources/thailand-property.ts`) — RICHEST building-level:
- WRITES: `description`(:1243), `sqm`(:1248), `building_year`(:1254), `floor`(:1255),
  `photos`(:1256), `amenities`(:1257), `pet_friendly`(:1261), `building_name`(:1264).
- floor: `const floorMatch = bodyText.match(/floor\s*[:\-]?\s*(\d+)/i);` (:1217-1218).
- building_year: `bodyText.match(/(?:built|completed|year)[^\d]{0,8}(20\d{2}|19\d{2})/i)` (:1214-1215).
- facilities → amenities: `detectAmenities($)` scopes to a "Facilities"/"Amenities" section
  (:609-615) and maps pool/gym/sauna/security/parking/etc via `FACILITY_TO_AMENITY` (:584).
- building_name: `extractBuildingName(...)` (:1228).
- NOT extracted: `furnished: null`(:1260), `total_floors: null`(:1262), `view_type: null`(:1263).
  → furnished = **not visible in parser**; total_floors / unit-count = **not extracted** (no selector).

**fazwaz** (`fazwaz.ts`) — RICHEST unit-level (but Cloudflare-paused, and no building_name):
- WRITES: `description`(:385), `sqm`(:395), `furnished`(:396), `pet_friendly`(:397),
  `building_year`(:413), `floor`(:414), `amenities`(:417), `photos`(:420).
- floor: `extractFloor(bodyText)` — `/Floor[:\s]+(\d+)/i` + `/(\d+)(?:st|nd|rd|th)\s*Floor/i` (:491-498).
- furnished: `extractFurnished(bodyText)` — `"Furniture: Fully/Unfurnished"` → bool (:819-826).
- building_year: `extractYearBuilt(bodyText)` — `Year Built:` / `Completed:` / `Built in YYYY` (:~800).
- NOT extracted: `building_name: null`(:412), `total_floors: null`(:415), `view_type: null`(:416).
  → building_name / total_floors = **available on page but not extracted** (Year Built/Floor
  labels exist, so a "Total Floors"/project label likely does too — no selector written).

**lazudi** (`lazudi.ts`):
- WRITES: `description`(:510, now body-text after PR #85), `sqm`(:515),
  `building_name`(:517 = projectName from meta/title regex), `photos`(:519),
  `lease_min_months`, bed/bath/price.
- NOT extracted: floor, furnished, building_year, total_floors, view_type, amenities, pet.
  → Per the findings doc (`agent-memory/.../scraper-findings/lazudi.md`), the description
  body reads "…located on the {N}th floor, comes full furnished, Facilities: [24h security,
  CCTV, pool, parking, gym…]" — so **floor / furnished / facilities are AVAILABLE (in the
  description prose) but NOT extracted** as structured fields. building_year = not visible.

**renthub** (`renthub.ts`):
- WRITES: `description`(:706), `sqm`(:711), `floor`(:712), `photos`(:715), bed/bath, district.
- floor: `const floorText = lookup(labels, "floor", "ชั้น"); … floorText ? parseInteger(floorText) : null` (:673,:678).
- `labels` comes from `extractLabeledFields($)` (:314) which captures **every** `dt/dd`,
  `th/td`, and label-sibling pair generically.
  → furnished / building_year / total_floors = **available-IF-labeled but not extracted**
    (the generic label map is built, but there is no `lookup()` for them and no amenities map).
- NOT written: furnished, building_year, building_name, total_floors, view_type, amenities, pet.

**living-insider** (`livinginsider.ts`) — two paths:
- Card builder (:996-1010) WRITES `building_name`(:1007 projectName), `sqm`, `description:""`, photos, bed/bath.
- `parseDetail` (:1359-1376) WRITES `description`(real), `floor`(:1370 via `lookup(labels,"floor","ชั้น")` :1350-1355), `sqm`, photos, bed/bath.
- Union WRITES: description, sqm, floor, building_name, photos.
- Same generic `extractLabeledFields` (:1342) as renthub → furnished / building_year /
  total_floors = **available-IF-labeled but not extracted**; amenities not extracted.

### 1d) VERDICT — richest building-level source for PTY/CMI
**thailand-property.** It is the only ACTIVE source that, across all four cities
(PTY/CMI/PHK/BKK), extracts a **building_name** (enabling Building grouping/`building_id`),
a **building_year** (regex on "built/completed/year"), a **floor**, AND a **facilities scan**
(`detectAmenities` → pool/gym/security/parking/…). fazwaz extracts richer *unit* fields
(furnished + year + floor + amenities) but writes `building_name: null` (so its rows can't be
grouped into a Building) and is Cloudflare-paused. lazudi is PTY-only and leaves floor/
furnished/facilities buried in prose. So for building-level data tied to the PTY/CMI
buildings our listings live in, **thailand-property is the single richest source**; no source
extracts `total_floors` or unit-count today.

---

## AREA 2 — card + detail page current state

### 2a) `src/components/ListingCard.tsx` — fields rendered
- Photo (:57-70), source badge (:73), user-status badge (:76-80).
- Title `{listing.title}` (:85-87).
- **building_name line** (PR #85): muted `<p>` shown when non-null AND `!== title` (:95-101).
- Price `<PriceDisplay>` (:104) + city·district badge (:105-108).
- Spec row (:111-131): bedrooms (:112-115), bathrooms (:116-121), sqm (:122-125), and
  **floor is ALREADY rendered** — `{listing.floor != null && (<span>…קומה {listing.floor}</span>)}` (:126-131).
- Below the Link: concern badges, top-3 amenities, favorite button, compare checkbox.
- **No date is shown on the card.** An "updated at" line (`scraped_at`/`last_seen_at`) would
  slot as a new muted line inside `<div className="space-y-2 p-3">` — e.g. right after the
  spec row (~:132) or in the amenities/footer band. Floor already lives in the spec row.

### 2b) Detail page (`src/app/listings/[id]/page.tsx`) — dates + פרטים rows
- **No date field is rendered anywhere** on the detail page (no `scraped_at`/`last_seen_at`/
  "עודכן"/`toLocaleDateString` — grep = 0 hits).
- The פרטים spec table `const specs = [...]` (:65+) already has rows that render "—" when
  null: סוג נכס, חדרי שינה, חדרי רחצה, שטח, **קומה** (floor `/` total_floors, :87-96),
  נוף (view_type, :99-100), **שנת בנייה** (building_year, :103-108), **מרוהט**
  (furnished → כן/לא/—, :111-112), מותר חיות מחמד (:115-116), פיקדון (:119-126),
  מינימום שכירות (:129-133). → floor + furnished + year rows ALREADY exist and show "—"
  for sources that don't extract them; enriching those scrapers lights the rows up with no
  UI change.

### 2c) How the PR #85 search input is mounted (`FiltersBar.tsx`)
The `q` text input lives INSIDE `formInner` (top "חיפוש" section), and `formInner` is
rendered in two wrappers:
- Mobile: `<div className="md:hidden"><Sheet>…<SheetTrigger>…סננים…</SheetTrigger>
  <SheetContent side="bottom">…{formInner}…` (:676-707) — **hidden behind the "סננים"
  sheet until opened.**
- Desktop: `<div className="hidden md:block rounded-lg border bg-card p-4">{formInner}</div>`
  (:710-711) — the panel is always rendered, so search **is** always visible on ≥md.
`src/app/listings/page.tsx:203` renders `<FiltersBar />` between `<SavedFiltersBar />` and
`<ListingGrid />` — there is **no standalone search box above results**. Net: search is
always-visible on desktop but collapsed inside the filter sheet on mobile.

---

## AREA 3 — stale concerns cleanup scope

### 3a) `Concern` model (`prisma/schema.prisma`)
`id`, `listing_id` (FK, onDelete Cascade), `key String`, `label String`,
`severity ConcernSeverity @default(INFO)`, `source ConcernSource @default(RULE)`,
`detail String?`, `created_at DateTime @default(now())`. Constraints:
`@@unique([listing_id, key])`, `@@index([key])`, `@@index([severity])`.
→ old rows are targetable by `key` + `source` (+ `created_at` if a cutoff is wanted).

### 3b) Exact removed rule keys (git history `-S "no_furnished_info" -- src/lib/concerns.ts`)
```
-    key: "no_furnished_info",
-    label: "חסר מידע על ריהוט",
-    key: "no_pet_info",
-    label: "חסר מידע על חיות מחמד",
```
Keys: **`no_furnished_info`** and **`no_pet_info`** (both `source: "RULE"`), removed in PR #84.

### 3c) Does recompute (source=RULE) delete the dead keys? — **YES.**
The delete-stale logic is in `syncRuleConcerns` (`src/lib/concerns-persist.ts`):
```ts
const computed = computeRuleConcerns(listing);
const computedKeys = new Set(computed.map((c) => c.key));
const existingRule = await db.concern.findMany({
  where: { listing_id: listing.id, source: "RULE" }, select: { id: true, key: true },
});
const toRemove = existingRule.filter((c) => !computedKeys.has(c.key));
if (toRemove.length > 0) {
  await db.concern.deleteMany({ where: { id: { in: toRemove.map((c) => c.id) } } });
}
```
`no_furnished_info` / `no_pet_info` are no longer produced by `computeRuleConcerns` (removed
from `RULES` in PR #84), so they are NOT in `computedKeys` → they land in `toRemove` and are
`deleteMany`'d. The delete is scoped to `source: "RULE"`, so AI/USER concerns are untouched.

Wiring:
- `/api/listings/[id]/recompute-concerns?source=RULE` → `runRule` → `syncRuleConcerns(prisma, listing)`
  (`route.ts:50,70`).
- `/api/admin/concerns-recompute-all?source=RULE` (default RULE) → `syncRuleConcerns(prisma, listing)`
  per listing (`route.ts:129-130,263`).

**Answer: YES** — running `recompute-concerns?source=RULE` on a listing today removes both
dead keys automatically. There is **no dedicated delete-concerns-by-key admin endpoint**; the
bulk self-heal path is `/api/admin/concerns-recompute-all?source=RULE`, which iterates every
listing and drops any RULE concern whose key is no longer in the engine (so a single bulk run
clears all lingering `no_furnished_info` / `no_pet_info` rows across the catalogue).
