# cc-latest — thai-rent-finder reliability milestone

**Timestamp:** 2026-08-17 11:37 ICT
**Branch:** `fix/trf-reality-sync-data-safety`
**Project HEAD (pushed):** `3b7dd106d5eb8c4177c76bcf7733c0669337e855`
**Base / main HEAD observed:** `bd513fcc3ddc9db6a976b9de50b6a382d1fd3285`
**Worktree:** was clean on `main` at start; all work committed & pushed on the branch. No unrelated local changes.
**PR (this milestone):** #93 — https://github.com/funzi7/thai-rent-finder/pull/93 (open, NOT merged)

## PR #92 isolation (honored)

PR #92 (`chore(automation): sync from automation-core`) is open, base `main`, head
`e267904e390db8b9d7cf3c19dc337af6fdb9322a`, touching **7 workflow files**:
`ci-doctor.yml`, `claude-fallback-watchdog.yml`, `claude.yml`, `codex-auto-fix.yml`,
`codex-backup-fix.yml`, `codex-gate.yml`, `merge-bot.yml`. **None were edited in this
milestone** (verified via `git status`). Any watchdog cost optimization is documented
as deferred until #92 resolves.

## Files changed (28)

Source: `src/scrapers/core/BaseScraper.ts`, `src/scrapers/core/acquisition.ts` (new),
`src/scrapers/core/types.ts`, `src/scrapers/sources/{lazudi,livinginsider,renthub,fazwaz,thailand-property}.ts`,
`src/app/api/admin/health/route.ts`, `src/lib/contact.ts`, `src/lib/building-reviews.ts`.
Scripts: `scripts/scrape-cli.ts`, `scripts/generate-state.js`,
`scripts/test-acquisition-safety.ts` (new), `scripts/test-scraper-datasafety.ts` (new), `package.json`.
Workflows (non-#92): `auto-update-state.yml`, `site-health.yml`, `daily-checkup.yml`,
`scrape-lazudi.yml`, `scrape-living-insider.yml`, `scrape-renthub.yml`.
Config/docs: `.claude-guard.json` (only `__doc__`), `README.md`, `TODO.md` (new),
`ThaiRentFinder_MasterPlan.md`, `Round1_Prompt.md`, `DEPLOY.md`.

## Product behavior changed

- **Data-safety (fail-closed):** a source/city acquisition failure (HTTP 403/429/5xx,
  Cloudflare challenge, index-fetch/browser failure) is signalled by
  `BaseScraper.failAcquisition(city, reason)`. When set, the stale sweep is **skipped**
  for that city, the `ScrapeJob` is `PARTIAL`/`FAILED` (never `SUCCESS`), and the CLI
  exits non-zero + emits an `error` event. A run with a few per-item parse errors is
  `PARTIAL` and keeps its records; a genuinely-empty valid run stays `SUCCESS` and
  still sweeps. Pure logic in `src/scrapers/core/acquisition.ts` (`computeSweepPlan`,
  `classifyRun`). Shortlist-or-better exemption + 14-day window unchanged.
- **Status:** `ScrapeJob.status` is a free-form String → new `SUCCESS`/`PARTIAL`/`FAILED`
  values, **no schema migration**. `ScrapeRunResult` gained `status` + `acquisitionOk`.
- **Lazudi + Living Insider:** scheduled crons commented out (paused); code + parsers +
  `workflow_dispatch` retained. `/api/admin/health` reports `paused_sources`; state/
  health show PAUSED, not stale/unhealthy.
- **site-health:** `/`→`/listings` 307 redirect no longer a false alert; paused
  scrapers not checked by workflow conclusion.
- **generate-state.js:** TP corrected to GH Actions; live workflow `state` via Actions
  API; PAUSED/BROKEN states; commented crons no longer render as active.
- **Docs:** README rewritten; new `TODO.md`; MasterPlan/Round1 marked historical;
  DEPLOY cadence fixed. Private first-name references removed from editable files.

## Source status (current)

| Source | Runner | Status |
|--------|--------|--------|
| THAILAND_PROPERTY | GH Actions `scrape.yml` (09:00 ICT / 3d) | ✅ active (last scrape 2026-08-16 SUCCESS, added 6) |
| FAZWAZ | GH Actions (03:00 ICT / 3d) | ✅ active |
| RENTHUB | GH Actions (03:30 ICT / 3d) | ✅ active |
| LIVING_INSIDER | GH Actions | ⏸️ paused (runner-IP HTTP 403) |
| LAZUDI | GH Actions | ⏸️ paused (runner-IP Cloudflare 403) |
| HIPFLAT | GH Actions | ⏸️ disabled_manually (Cloudflare 403) |

## Evidence (run IDs used)

- **Lazudi** run `31848091141` / job `94918481752` (2026-08-14): Playwright→Cloudflare
  challenge, plain fetch→HTTP 403 (5929b), `found=0 errors=2 deactivated=8`, workflow
  `success`. The `deactivated=8` is the stale-sweep bug — attributable and now fixed.
- **Living Insider** run `31909171930` / job `95071543356` (2026-08-15):
  `index_fetch status=403` on all 5 cities, `found=0`, workflow `success`.
- Live from THIS environment's IP (different from runner): Lazudi index 200 / 1.24MB /
  40 detail links; LI index 200 / 48 unique listings. So the block is runner-IP
  reputation, not a permanent site change.

## Production smoke (read-only, 2026-08-17)

`/`→307 (intentional, no Location header — RSC/client redirect), `/listings`, `/board`,
`/compare`, `/jobs`, `/settings/current` → 200; `/api/health`→200. Mobile search box
verified visible without opening filters (headless 390px); no console errors; detail
page has outbound source link. **No production data mutated.** `SEED_KEY` not available
in this env → admin-health endpoint not called (401 unauthenticated confirmed).

## DB counts (verified live)

`/api/health`: `active_listings = 949`; `last_scrape` = THAILAND_PROPERTY SUCCESS
(2026-08-16, added 6). Total-in-DB (~2365 per prior state.md) not re-verified live.

## Tests

- `npm run test:acquisition-safety` — 13 checks (pure sweep/classify logic). PASS.
- `npm run test:scraper-datasafety` — 14 checks (end-to-end via fake Prisma): no sweep
  on acquisition failure + FAILED; records kept + PARTIAL on per-item error; SUCCESS +
  sweep on genuinely-empty; sweep query exempts SHORTLISTED/CONTACTED/VISITED. PASS.
- `npx tsc --noEmit` (this repo's CI build gate) — clean. Existing offline smoke tests
  (filters, image-utils, photo-filters, lazudi/li/renthub parsers) — pass. `git diff
  --check` — clean. Lint: repo has no eslintrc (pre-existing; `next lint` prompts to
  configure). Full `next build` needs a live DB — CI itself uses `tsc` instead.

## Data-safety semantics after the fix

`failAcquisition` → (a) sweep skipped for the failed city, (b) status `FAILED` iff
found==0 else `PARTIAL`, (c) CLI exit 1 on `FAILED`. Per-item errors alone → `PARTIAL`,
never suppress the sweep. `completedCities` (thailand-property) still gates its sweep;
failed cities are additionally filtered out. No `found==0` heuristic — a genuine empty
inventory still sweeps.

## Issue #83

OPEN, 43 comments, coalescing `site-health` issue. Latest (2026-08-17): `Uptime:
homepage (HTTP 307)` (FALSE POSITIVE — fixed here) + `DB: stale sources:
LIVING_INSIDER,LAZUDI` (now represented as PAUSED and excluded from stale). **Do NOT
close manually** until a post-deploy run proves healthy (see pending-tests).

## Actions-cost findings (audit only, no #92 edits)

Claude Fallback Watchdog (`claude-fallback-watchdog.yml`, a #92 file): cron
`2-59/5 * * * *` but GitHub throttles to ~48 runs/day; 749 total runs; median ~11s each
→ 1-min billing floor. **Measured ≈565 Actions-minutes over the last 30 days** (single
largest recurring non-scraper consumer). Do NOT extrapolate the theoretical 288/day.
Lever = cadence (e.g. `2-59/5`→`*/30`), not runtime. Deferred until #92 resolves.

## Private-name audit

All editable hits neutralized (contact sign-offs dropped; AI prompt → `המשתמש`;
comments/docs → `funzi7`/"the owner"; `.claude-guard.json __doc__` fixed to
`needs-owner`). Remaining `rg` hits are false positives: `dimAttr` (dimension helper,
renthub.ts) and `jsonLdImageCount` (scrape-debug). **Zero** name hits inside the 7 #92
files.

## Current TODO priorities

Blockers: post-deploy verification; keep #83 open until proven healthy; Lazudi/LI stay
paused until a runner access path is proven. Next: decide on the 8 Lazudi rows
deactivated by the old bug; watchdog cost after #92; Next.js patch/LTS path (audit: 1
critical `next` DoS + high `postcss`/`undici`/`nanoid`; fixing `next` is breaking — NOT
done here). See root `TODO.md`.

## Risks

- Lazudi/LI: if their GitHub `state` stays `active`, commenting the cron stops
  scheduled runs but the workflow still shows `active` in the API; state.md will label
  them PAUSED via `paused_sources`, which is correct. (Fully disabling via
  `gh workflow disable` was intentionally NOT done — it would also block
  `workflow_dispatch`.)
- The `next build` path is unverified locally (no DB); relying on `tsc --noEmit` which
  matches CI's `pr-build-gate.yml`.

## Physical checks still required AFTER deploy (not claimed done)

1. site-health run: no `homepage (HTTP 307)` alert.
2. `/api/admin/health?key=…` returns `paused_sources:[LIVING_INSIDER,LAZUDI,HIPFLAT]`
   and `stale_sources` no longer lists the paused ones.
3. Next `auto-update-state` run: `state.md` shows TP as GH Actions, Hipflat with no
   live cron, LI/Lazudi paused.
4. A scraper acquisition failure (or a `workflow_dispatch` on a paused source) exits
   non-zero and does NOT deactivate rows.
5. Decide/reactivate the 8 Lazudi rows if desired (`/api/admin/reactivate-curated`).

**No deploy observed** — this milestone only opens PR #93; Vercel deploys on merge to
`main`, which has not happened.
