# thai-rent-finder — cc-latest

## Diagnostic: "favorites only" returns zero (READ-ONLY)

Traced the `favoriteOnly` pipeline end-to-end at `main` tip `3704a1d`. Target rows:
`cmoklt6cy001oui0284t0uobp` "Riviera Ocean Drive" and `cmoklt4x9001hui02gt9rwab1`
"Dusit Grand Condo View For Rent" (both asserted is_active=true, UserStatus.status=SHORTLISTED).

### HOP 1 — UI toggle
`src/components/FiltersBar.tsx:470-476` — the "רק מועדפים" control is a plain
checkbox that sets **React state**, not a URL param directly:
```tsx
<input
  type="checkbox"
  className="h-4 w-4 accent-primary"
  checked={favoriteOnly}
  onChange={(e) => setFavoriteOnly(e.target.checked)}
/>
רק מועדפים
```
The URL param is produced by the sync effect at `FiltersBar.tsx:207-231`:
`filtersToQueryString({ …, favoriteOnly, … })` (`:209`,`:215`) → `router.replace("/listings?"+finalQs)` (`:230`).
So param name/value are whatever `filtersToQueryString` emits (HOP 2).

### HOP 2 — param round-trip (`src/types/filters.ts`)
- Serialize: `filters.ts:157` → `if (f.favoriteOnly) params.set("favoriteOnly", "1");`
  → param **name `favoriteOnly`**, **value `"1"`**.
- Parse: `filters.ts:107` → `const favoriteOnly = get(sp, "favoriteOnly") === "1";`
  → reads **`favoriteOnly`**, compares to **`"1"`**.
- **Name matches; value matches (`"1" === "1"`). Round-trip consistent. ✓**

### HOP 3 — query build (`src/app/listings/page.tsx`)
`page.tsx:52-56`:
```ts
if (filters.status) {
  where.status = { is: { status: filters.status } };
} else if (filters.favoriteOnly) {
  where.status = { is: { status: { in: [...FAVORITE_STATUSES] } } };
}
```
Status list source: `page.tsx:21` → `import { FAVORITE_STATUSES } from "@/lib/favorite-status";`
(HOP 5). Note the `else if`: an explicit `status=` param wins and **skips** favoriteOnly.
Two other conditions are always applied to the same `where`: `is_active: true` and
`price_thb: { lte: filters.maxPrice }` (`page.tsx:38-40`; default maxPrice 40000).

### HOP 4 — schema (`prisma/schema.prisma`)
- Listing side, `:119` → `status              UserStatus?` — **optional to-one (1-1)**.
- UserStatus, `:193-199` → `listing_id String @id` (PK == FK ⇒ strictly one-to-one) and
  `status Status @default(NEW)` (the enum field the filter targets).
- The HOP-3 shape `{ status: { is: { status: { in: [...] } } } }` = Listing.`status`
  relation → `is` → UserStatus.`status` enum → `in`. **`is` is the correct/valid
  relation-filter for an optional to-one in Prisma. Shape is valid. ✓**

### HOP 5 — status list (`src/lib/favorite-status.ts:31-37`)
```ts
export const FAVORITE_STATUSES: readonly Status[] = [
  Status.VIEWED,
  Status.SHORTLISTED,   // ← present
  Status.CONTACTED,
  Status.VISITED,
  Status.RENTED,
] as const;
```
**SHORTLISTED is in the list. ✓**

### VERDICT — ALL FIVE HOPS ARE CORRECT IN CODE
No param-name mismatch (`favoriteOnly` throughout), no value mismatch (`"1"==="1"`),
the Prisma relation-filter shape is valid for the 1-1 `Listing.status → UserStatus`
relation, and `FAVORITE_STATUSES` includes `SHORTLISTED`. With `is_active=true`,
`UserStatus.status=SHORTLISTED`, and `price_thb ≤ maxPrice` all true at query time, this
code **should** return the two rows. **The break is not in the traced code as written.**
Not guessing a bug — the deciding factor is runtime/data, distinguishable by:

1. **Generated SQL.** Run the app (or a script) with `new PrismaClient({ log: ['query'] })`
   and hit `/listings?favoriteOnly=1`; confirm the emitted SQL joins `UserStatus` and
   filters `"UserStatus"."status" IN ('VIEWED','SHORTLISTED','CONTACTED','VISITED','RENTED')`.
2. **Raw DB check against the SAME database the deployed app uses:**
   ```sql
   SELECT l.id, l.is_active, l.price_thb, us.status
   FROM "Listing" l
   LEFT JOIN "UserStatus" us ON us.listing_id = l.id
   WHERE l.id IN ('cmoklt6cy001oui0284t0uobp','cmoklt4x9001hui02gt9rwab1');
   ```
   If `us.status` is NULL / not SHORTLISTED, or `is_active=false`, the data — not the
   filter — is the cause (e.g. the "confirmed" facts were read from a different
   DB/branch/time than production queries).
3. **Confounders on the always-applied `where`:** verify `price_thb ≤ 40000` for both
   (TP scrapes with `max_price=25000`, so unlikely) and that no `status=` param is also
   on the URL (which takes the `if (filters.status)` branch at `page.tsx:52` and bypasses
   favoriteOnly).
4. **Deploy freshness:** confirm the running Vercel build is on `3704a1d`, not a stale
   bundle predating the unified favorite/status logic.

Most likely: a data/deploy/URL-state mismatch (the SQL from check #1 + the raw query in
check #2 on the production DB will isolate it in one shot), not an ORM/param defect.

### BONUS — free-text name/title search
None. No `q`/`search`/`title` param in `filters.ts`, no text `<input>` in `FiltersBar.tsx`,
and no `contains`/`title` clause in the listings `where` — the only `searchParams`/`query`
references are Next.js URL plumbing and pagination links.
