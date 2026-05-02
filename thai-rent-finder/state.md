# thai-rent-finder — State

> Living document. Update at the end of every working session.
> Last updated: 2026-05-02

## Current focus

Multi-source scraping infrastructure. Adding rental listing sources one at a time, validating each on live data before moving to the next. PR #46 merged but live runs surfaced bugs — fix batch (Batch 2.6) is the next blocker before crons.

## Active PRs

| # | Title | Status | Notes |
|---|---|---|---|
| _planned_ | `fix: Renthub city/photo/limit bugs + Living Insider diagnostics + CLI case-insensitive` | **to open** | Branch `claude/fix-renthub-li-bugs`. See Batch 2.6 in roadmap.md. |

## Recently merged

| # | Title | Date | Outcome |
|---|---|---|---|
| #35 | Rescrape-all with 6h freshness | — | Working in prod |
| #36 | Concerns recompute | — | Status uncertain — verify before assuming closed |
| #44 | GH Actions runner + FazWaz migration | 2026-05-02 | Working. PTY produced 4 listings on first run. |
| #45 | Renthub + Living Insider stubs + photo dedup + source filter | 2026-05-02 | Stubs only. Bodies implemented in #46. |
| #46 | Renthub + Living Insider scraper bodies, P2 fixes | 2026-05-02 | Merged. Live workflow_dispatch surfaced 6 bugs (see Batch 2.6). |

## Source status

| Source | Runs on | State | Last verified | Notes |
|---|---|---|---|---|
| THAILAND_PROPERTY | Vercel | ✅ Working | — | Original scraper, ~45 listings |
| FAZWAZ | GH Actions | ✅ Working | 2026-05-02 PTY | 4 listings on first run — low; may indicate pagination not paging |
| RENTHUB | GH Actions | 🐛 Buggy live | 2026-05-02 PTY | PTY run yielded ~14 listings; all filed under BKK (bug 1), some from Phuket (bug 2), photos are LINE/contact icons (bug 3), `--limit 10` not honored (bug 4). Fix in Batch 2.6. |
| LIVING_INSIDER | GH Actions | 🐛 Returns 0 | 2026-05-02 PTY | workflow_dispatch PTY/limit=10 succeeded in 34s but persisted 0 listings. Root cause unknown — diagnostic logging is the first commit of Batch 2.6. |
| DDPROPERTY | — | ⏳ Not started | — | Batch 3 |
| HIPFLAT | — | ⏳ Not started | — | Batch 3 |
| LAZUDI | — | ⏳ Not started | — | Batch 3 |
| PROPERTY_SCOUT | — | ⏳ Not started | — | Batch 4 (needs Playwright) |

## Cron schedule (Asia/Bangkok)

| Workflow | Time | Status |
|---|---|---|
| scrape-fazwaz | 03:00 | Active (UTC 20:00) |
| scrape-renthub | 03:30 | **Disabled** (uncomment after Batch 2.6 verified clean) |
| scrape-living-insider | 04:00 | **Disabled** (uncomment after Batch 2.6 verified clean) |

## Open questions / next decisions

- Living Insider 0-listings root cause (selector drift? all filtered as expired? pagination? zone_id 42 stale?) — answered after diagnostic logging ships
- Verify Renthub `koh-samui` slug — flagged as best-guess in PR #46
- Discover Living Insider zone IDs for BKK, CMI, PHK, SAM
- After Renthub + LI verified live → re-enable crons → start Batch 3 (DDProperty + Hipflat + Lazudi)
- FazWaz only returned 4 PTY listings — investigate if pagination needs a fix or if that's the real long-term inventory

## Known active blockers

Batch 2.6 (Renthub bug fixes + LI diagnostics + CLI case-insensitive) is the critical-path blocker. Crons stay disabled until both scrapers produce clean data on live workflow_dispatch.

## Recent gotchas (full list in gotchas.md)

- DATABASE_URL must be `postgres://` — Vercel's `prisma://` URL fails on GH Actions
- Playwright cannot run on Vercel functions (libnss3 missing)
- Renthub is mostly daily rentals — index card monthly filter is mandatory
- Living Insider has expired + closed states that must be filtered

## Repo

- GitHub: `funzi7/thai-rent-finder`
- Production: `https://thai-rent-finder.vercel.app`
- Default branch: `main`
- Branch naming: `claude/batch{N}-{description}`
