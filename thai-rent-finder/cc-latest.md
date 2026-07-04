# thai-rent-finder — cc-latest

## Deactivation data-safety fix — PR #82 (`claude/deactivation-safety`, open, NOT merged)

Fixes the verified production incident where `scrape.yml` (thailand-property, no
city arg) deactivated **49 listings city-wide**, including the user's SHORTLISTED
**Riviera Ocean Drive** and **Dusit Grand Condo View** (confirmed `is_active=false`
via `/api/admin/audit-listings`). One branch off `main`, 4 commits, build green.

### Root cause (recap, verified read-only @ `06d10d9`)
- Stale sweep in `src/scrapers/core/BaseScraper.ts` filtered only
  `source + is_active + last_seen_at<now-7d + NOT-in-seen` — **no UserStatus
  exclusion**.
- No `opts.city` was passed (`scripts/scrape.ts`), so the sweep's optional city
  clause vanished → it spanned **all 4 TP cities** while the 55s deadline
  (`thailand-property.ts:27`, top-of-run break `:906-915`, mid-city return
  `:1001-1010`) meant only BKK+PTY were actually scraped.

### What changed, per commit

**Commit 1 — `fix(scraper): exempt shortlisted+ listings from staleness deactivation`**
- `src/scrapers/core/BaseScraper.ts`: added a `NOT`/none condition on the
  `UserStatus` relation to the stale-sweep `where`, so any listing whose status is
  in `SHORTLIST_OR_BETTER` (SHORTLISTED / CONTACTED / VISITED) is **never** swept,
  regardless of staleness. Imports `SHORTLIST_OR_BETTER` from
  `src/lib/status-gates.ts` (not redefined); uses the same
  `status: { is: { status: { in: … } } }` shape as the concerns endpoints. Comment:
  "User-curated listings (shortlist or better) are exempt from staleness
  deactivation. They may only leave the list by explicit user action."

**Commit 2 — `fix(scraper): scope stale sweep to cities the run actually completed`**
- `src/scrapers/core/BaseScraper.ts`: new `protected completedCities: string[] | null = null`
  field; sweep city-scoping now runs in three branches — (1) `opts.city` set →
  `{ city: opts.city }`; (2) `completedCities !== null` → `{ city: { in: completedCities } }`,
  and **skip the sweep entirely** when the array is empty (no city completed);
  (3) `completedCities === null` → original source-wide sweep (other scrapers
  unchanged).
- `src/scrapers/sources/thailand-property.ts`: `search()` initializes
  `completedCities = []` and pushes a city only when `searchCity()` returns `true`.
  `searchCity()` now returns `AsyncGenerator<RawListing, boolean>` — `true` only on
  natural end (cap reached / clean exhaustion), `false` on every early exit (run
  deadline at page boundary + mid-candidate `:1001-1010`, index-fetch failure,
  no-detail-links page). Incompletely-scanned or unreached cities are never swept.

**Commit 3 — `docs(scraper): make re-seen reactivation explicit at the upsert`**
- `src/scrapers/core/BaseScraper.ts`: **Finding — `is_active: true` is ALREADY set
  in the update branch.** It lives in the shared `data` object backing both
  `create: data` and `update: updateData` (updateData only strips lat/lng for
  `lat_lng_manual` rows). So re-seen listings already reactivate alongside the
  `last_seen_at` bump, and the ~47 wrongly-swept rows self-heal on future runs.
  Behavior unchanged; added a comment pinning this reactivation contract against a
  future create-only refactor.

**Commit 4 — `feat(admin): add reactivate-curated restore endpoint`**
- New `src/app/api/admin/reactivate-curated/route.ts` (GET|POST, `SEED_KEY`-gated).
  Finds `is_active=false` + `UserStatus.status in SHORTLIST_OR_BETTER`, sets
  `is_active=true`, bumps `last_seen_at=now()` (belt-and-suspenders atop the
  Commit-1 exemption). `?dry_run=true` supported. Response:
  `{ ok, dry_run, reactivated, rows: [{ id, title, source, city, status }] }`.

### Acceptance
- `npx tsc --noEmit` clean; `next build` green (route builds as dynamic `ƒ`
  function). The repo `build` script also runs `prisma migrate deploy`, which needs
  a live DB (CI/Vercel only); `next build` was validated directly with placeholder
  env.

Post-deploy checklist tracked in `thai-rent-finder/pending-tests.md`.
