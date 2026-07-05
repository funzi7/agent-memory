# thai-rent-finder — cc-latest

## Solo-use cadence + concerns cleanup + state.md footer fix — PR #84 (`claude/solo-cadence-and-concerns`, open, NOT merged)

Solo-use tuning: fewer/better listings, minimal Actions minutes, clearer Hebrew AI
output. One branch off `main`, 6 commits. `tsc --noEmit` clean, `next build` green,
all 7 changed workflow YAMLs parse.

### What changed, per commit

**Commit 1 — `feat(concerns): plain-Hebrew AI output, 4 categories only; drop 2 low-value rules`**
- `src/lib/ai-concerns.ts`: prompt rewritten in plain natural Hebrew with explicit
  anti-machine-translation guidance ("חיות מחמד" not "חיות חמות", "רעש" not "קול",
  "תיירות" not "טוריזם"). Output constrained to 4 categories only — רעש /
  תנאי חוזה ומחיר / תחזוקה וגיל בניין / מיקום וסביבה — ≤1 item each. Dropped wifi,
  workspace, furniture-detail, photo-count, pets. Trimmed model input (removed
  `furnished`, `pet_friendly`, `photos_count`). **Output budget: `max_tokens`
  1500 → 750; item count 3–7 → up to 4.**
- `src/lib/concerns.ts`: removed the two auto-rules "חסר מידע על ריהוט"
  (`no_furnished_info`) and "חסר מידע על חיות מחמד" (`no_pet_info`). Neither is a
  `FILTER_CONCERN_KEY`; all other rules untouched.

**Commit 2 — `perf(scraper): TP city priority, BKK cap 2, 3.5min deadline, job timeout`**
- `src/scrapers/sources/thailand-property.ts`: `CITY_PATH` iteration reordered to
  **PTY, CMI, PHK, BKK** (Bangkok last so a deadline abort costs BKK, not the small
  cities). Added `PER_CITY_CAP_OVERRIDES = { BKK: 2 }` + `capFor(city)`; both cap
  checks in `searchCity` use it. `PER_RUN_DEADLINE_MS` 55_000 → 210_000 (3.5 min;
  Actions-only path).
- `.github/workflows/scrape.yml`: job `timeout-minutes` 30 → 10.
- **Report-only 2d findings:**
  - `PER_RUN_DEADLINE_MS` is module-private, referenced only inside
    `search()`/`searchCity()`. The 3 Vercel admin routes importing
    `ThailandPropertyScraper` — `rescrape-all` (route.ts:135), `rescrape-listing`
    (:60), `listing-debug` (:57) — all call `parseDetail()` on one listing, never
    `search()`/`run()`. **Raising the deadline has zero effect on any Vercel route.**
  - `rescrape-all` **does** bump `last_seen_at`: `rescrape-all/route.ts:276`
    (`last_seen_at: now,` in the update `data`, written via `prisma.listing.update`
    at :292); also pre-bumps `scraped_at` at :178 before `parseDetail`.
  - `PER_CITY_CAP` usages (now all `capFor`-driven): the constant, plus the
    page-loop guard and the candidate-loop guard in `searchCity`.

**Commit 3 — `chore(ci): every-3-days staggered scrape cadence for solo use`**
- 5 scraper crons → every-3-days, only day-of-month field changed, hours kept:
  - A: `scrape.yml '0 2 */3 * *'`
  - B: `scrape-renthub.yml '30 20 2-31/3 * *'`, `scrape-lazudi.yml '30 22 2-31/3 * *'`
  - C: `scrape-fazwaz.yml '0 20 3-31/3 * *'`, `scrape-living-insider.yml '0 21 3-31/3 * *'`
  - Month-boundary quirk (A day-31→1 back-to-back; B/C up to 4-day gap) documented + accepted.

**Commit 4 — `chore(ci): raise site-health freshness threshold to 80h for 3-day cadence`**
- `.github/workflows/site-health.yml`: single `DEFAULT_MAX_AGE_HOURS = 80`
  (72h + ~8h buffer); dropped redundant fazwaz=50h override. Age-vs-threshold
  reporting kept.

**Commit 5 — `fix(scraper): widen stale window 7d -> 14d for 3-day cadence`**
- `src/scrapers/core/BaseScraper.ts`: `SEVEN_DAYS_MS` → `STALE_WINDOW_MS = 14 days`
  (~4–5× the 3-day cadence). Only 2 usages (constant + sweep cutoff), both here.

**Commit 6 — `fix(state): stop state.md footer self-duplication (diagnostic Q7)`**
- `scripts/generate-state.js`: footer no longer contains the literal
  `<!-- manual-section-start/end -->` strings (described in words).
- `.github/workflows/auto-update-state.yml`: strict preserve step — recognise a
  manual block only when the START marker is on its **own line**, drop any extracted
  line carrying **both** markers (legacy footer copies), append nothing if empty.
  Cleans the ~20 accumulated duplicates on the next run and prevents recurrence.
  Verified with a mock legacy file (real block kept, all duplicates dropped) and a
  legacy-only file (nothing appended, no `pipefail` crash).

### New cadence (ICT = UTC+7)
| Group | Source | UTC cron | ICT | Days |
|---|---|---|---|---|
| A | thailand-property | `0 2 */3 * *` | 09:00 | 1,4,…,31 |
| B | Renthub | `30 20 2-31/3 * *` | 03:30 (+1d) | 2,5,…,29 |
| B | Lazudi | `30 22 2-31/3 * *` | 05:30 (+1d) | 2,5,…,29 |
| C | FazWaz | `0 20 3-31/3 * *` | 03:00 (+1d) | 3,6,…,30 |
| C | Living-Insider | `0 21 3-31/3 * *` | 04:00 (+1d) | 3,6,…,30 |

Post-deploy checklist appended to `thai-rent-finder/pending-tests.md`.
