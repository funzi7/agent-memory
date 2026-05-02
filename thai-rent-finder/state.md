
# thai-rent-finder — State

> Living document. Update at the end of every working session.
> Last updated: 2026-05-02

## Current focus

Multi-source scraping infrastructure. Adding rental listing sources one at a time, validating each on live data before moving to the next.

## Active PRs

| # | Title | Status | Notes |
|---|---|---|---|
| #46 | Renthub + Living Insider scrapers, P2 fixes | **awaiting merge** | All Codex reviews addressed. Crons disabled until live verification. |

## Recently merged

| # | Title | Date | Outcome |
|---|---|---|---|
| #35 | Rescrape-all with 6h freshness | — | Working in prod |
| #36 | Concerns recompute | — | Status uncertain — verify before assuming closed |
| #44 | GH Actions runner + FazWaz migration | 2026-05-02 | Working. PTY produced 4 listings on first run. |
| #45 | Renthub + Living Insider stubs + photo dedup + source filter | 2026-05-02 | Stubs only. Bodies implemented in #46. |

## Source status

| Source | Runs on | State | Last verified | Notes |
|---|---|---|---|---|
| THAILAND_PROPERTY | Vercel | ✅ Working | — | Original scraper, ~45 listings |
| FAZWAZ | GH Actions | ✅ Working | 2026-05-02 PTY | 4 listings on first run — low; may indicate pagination not paging |
| RENTHUB | GH Actions | 🟡 Implemented, unverified | — | Pending live workflow_dispatch run |
| LIVING_INSIDER | GH Actions | 🟡 Implemented, PTY only | — | Other cities throw "zone not yet mapped" |
| DDPROPERTY | — | ⏳ Not started | — | Batch 3 |
| HIPFLAT | — | ⏳ Not started | — | Batch 3 |
| LAZUDI | — | ⏳ Not started | — | Batch 3 |
| PROPERTY_SCOUT | — | ⏳ Not started | — | Batch 4 (needs Playwright) |

## Cron schedule (Asia/Bangkok)

| Workflow | Time | Status |
|---|---|---|
| scrape-fazwaz | 03:00 | Active (UTC 20:00) |
| scrape-renthub | 03:30 | **Disabled** (uncomment when verified) |
| scrape-living-insider | 04:00 | **Disabled** (uncomment when verified) |

## Open questions / next decisions

- Verify Renthub `koh-samui` slug — flagged as best-guess in PR #46
- Discover Living Insider zone IDs for BKK, CMI, PHK, SAM
- After Renthub + LI verified live → re-enable crons → start Batch 3 (DDProperty + Hipflat + Lazudi)
- FazWaz only returned 4 PTY listings — investigate if pagination needs a fix or if that's the real long-term inventory

## Known active blockers

None right now. PR #46 is the only blocker on the critical path.

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
