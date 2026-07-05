# thai-rent-finder — cc-latest

## Enrich extraction + "עודכן" dates + mobile search + dead-concern cleanup — PR #88 (`claude/enrich-dates-search-cleanup`, open, NOT merged)

One branch off `main`, 4 commits. `tsc --noEmit` clean, `next build` green.

### What changed, per commit

**Commit 1 — `feat(scrapers): extract lazudi floor/furnished/facilities; share amenity table`**
- New **`src/scrapers/core/amenities.ts`**: `FACILITY_TO_AMENITY` + `detectAmenitiesFromText()`
  extracted verbatim from thailand-property (no duplication). `thailand-property.ts` imports it;
  `detectAmenities()` keeps DOM "Facilities" scoping, delegates text→key match.
- `lazudi.ts`: `parseLazudiFloor` ("…located on the {N}th floor"), `parseLazudiFurnished`
  (fully/full furnished→true, unfurnished/not furnished→false, else null), `parseLazudiAmenities`
  ("Facilities:" block → keys). `floor`/`furnished`/`amenities` now written into the returned object.
  (Verified vs sample prose: floor=8, furnished=true, amenities={pool,gym,security,elevator,parking}.)

**Commit 2 — `feat(ui): show "עודכן" last-seen date+time on card and detail header`**
- New `src/lib/format-updated.ts`: `formatUpdatedAt(d)` → he-IL, `Asia/Bangkok`, `dd.MM.yy HH:mm`
  (24h, formatToParts, server-safe).
- `ListingCard.tsx`: muted `עודכן: …` line after the spec row (`last_seen_at`).
- Detail page: same line in the header under title/building-name (not a specs-table row).

**Commit 3 — `feat(search): always-visible mobile search box + recent-searches chips`**
- `SearchBox.tsx`: 400ms-debounced input editing ONLY the `q` URL param (others preserved),
  mounted `md:hidden` between SavedFiltersBar and FiltersBar.
- `recent-searches.ts`: localStorage `trf_recent_searches`, newest-first, dedup, max 5, SSR-guarded.
- `RecentSearchChips.tsx`: chips under SearchBox (mobile) + FiltersBar panel input (desktop);
  click applies, ✕ removes, "נקה הכל" clears. Both save committed non-empty q.

**Commit 4 — `feat(admin): cleanup-dead-concerns endpoint for removed RULE keys`**
- New `GET|POST /api/admin/cleanup-dead-concerns` (SEED_KEY, `?dry_run=true`). One `deleteMany`
  of `source='RULE'` + key IN (`no_furnished_info`,`no_pet_info`). Response
  `{ ok, dry_run, by_key, deleted_total }` (dry-run adds `would_delete_total`).

### Report-only findings (from PR body)

**Upsert-update field list (1c) — re-seen listings backfill the new values.** BaseScraper's
`data` object backs both `create` and `update` (`updateData` only strips lat/lng), and includes:
`furnished: raw.furnished ?? null` (BaseScraper.ts:135), `building_year: raw.building_year ?? null`
(:143), `floor: raw.floor ?? null` (:144), `amenities: raw.amenities ?? {}` (:147). No change needed.

**Skipped labels (1b) — renthub / living-insider: furnished + building_year skipped (both sources).**
No renthub findings doc exists at all; the LI findings docs and the renthub/LI smoke fixtures
contain NO labeled furnished/year spec-row (the only "fully furnished" hit is inside a title
string, not a `dt/dd`/`th/td` label). Per "don't invent Thai/English label strings," no `lookup()`
calls were added. → Decision for later: if we want these fields from renthub/LI, first capture a
real detail-page HTML fixture and document the exact label text in a findings doc.

Post-deploy checklist appended to `thai-rent-finder/pending-tests.md`.
