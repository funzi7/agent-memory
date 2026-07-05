# thai-rent-finder — cc-latest

## Search / sort / favorites / building-name / Lazudi — PR #85 (`claude/features-search-sort-favorites`, open, NOT merged)

Five listings-experience improvements. One branch off `main`, 5 commits.
`tsc --noEmit` clean, `next build` green, `scripts/test-filters.ts` passes.

### What changed, per commit

**Commit 1 — `fix(listings): favoriteOnly composes with status (AND semantics)`**
- `src/app/listings/page.tsx`: the status/favoriteOnly branch was `if/else-if`, so an
  explicit `?status=` silently bypassed `?favoriteOnly=1`. Now composed with AND on the
  single UserStatus enum: both set → the explicit status iff it's in FAVORITE_STATUSES,
  else `{ is: { status: { in: [] } } }` (honest empty). `favoriteOnly=1&status=SHORTLISTED`
  shows; `favoriteOnly=1&status=NEW` is empty.

**Commit 2 — `feat(listings): free-text search over title + building name`**
- `src/types/filters.ts`: `q?: string` (parse from `?q=`, trimmed, empty→undefined;
  serialize when non-empty; counted).
- `src/app/listings/page.tsx`: `where.OR = [{ title: contains }, { building_name: contains }]`
  (mode insensitive), ANDed with all other filters.
- `src/components/FiltersBar.tsx`: text input "חיפוש לפי שם / בניין…" wired to the sync
  effect with a dedicated ~400ms debounce.

**Commit 3 — `feat(listings): show building name on the list card`**
- `src/components/ListingCard.tsx`: muted secondary line under the title when
  `building_name` is non-null and differs from the title. No layout restructuring.

**Commit 4 — `fix(lazudi): drop placeholder meta description so real body text wins`**
- `src/scrapers/sources/lazudi.ts`: added `isPlaceholderDescription()` (exact match,
  case-insensitive, optional trailing dot) and treat the placeholder "View property
  listing." (or empty) meta as `""` at the read point so description falls through to the
  `$("main")` body fallback. Rest of parser unchanged.
- Note: existing Lazudi rows keep the old text until their next scrape/rescrape.

**Commit 5 — `feat(listings): sort by size/year with direction + sqm/year range filters`**
- `src/types/filters.ts`: sort reworked from 4 combined keys to `SortField`
  (newest|price|size|year) + `SortDir` (asc|desc). Back-compat parse maps legacy keys
  (price_asc/price_desc/size_desc/newest) and honors an explicit `?dir=`. New int range
  params `minSqm/maxSqm/minYear/maxYear` (invalid dropped).
- `src/app/listings/page.tsx`: orderBy — price→price_thb, size→sqm,
  year→`building_year { sort: dir, nulls: "last" }`, newest→last_seen_at — all with the
  chosen direction. Range filters via gte/lte on sqm / building_year (an active year range
  naturally excludes null-year rows).
- `src/components/FiltersBar.tsx`: sort dropdown gains גודל + שנת בנייה, an asc/desc toggle
  button, and compact numeric inputs for sqm + year ranges (year labeled
  "קיים רק בחלק מהמקורות"). localStorage restore normalizes legacy sort keys.
- `scripts/test-filters.ts`: round-trip fixture updated to the field+dir model.

Sort-key table:
| `sort` | Prisma orderBy | dir |
|---|---|---|
| newest (default) | last_seen_at | asc/desc |
| price | price_thb | asc/desc |
| size | sqm | asc/desc |
| year | building_year { sort: dir, nulls: last } | asc/desc |

### New URL params
`q`, `dir`, `minSqm`, `maxSqm`, `minYear`, `maxYear`.

### Notes
- Size column is `sqm` (there is no `size_sqm`); range params `minSqm/maxSqm` map to `sqm`.
- `SortKey` type replaced by `SortField`+`SortDir`; only consumers (FiltersBar, page.tsx,
  test-filters.ts) updated. Legacy saved filters / localStorage round-trip correctly.

Post-deploy checklist appended to `thai-rent-finder/pending-tests.md`.
