# cc-latest — thai-rent-finder reliability milestone + manager follow-up

**Timestamp:** 2026-08-17 20:41 ICT
**Branch:** `fix/trf-reality-sync-data-safety`
**Project HEAD (pushed):** `bccce403ff73939e0f7a3d06edf71374efed9dbd`
**Base / main HEAD observed:** `bd513fcc3ddc9db6a976b9de50b6a382d1fd3285`
**PR:** #93 — https://github.com/funzi7/thai-rent-finder/pull/93 (OPEN, NOT merged)
**Worktree:** clean; all work committed & pushed on the branch.

This is the follow-up commit `bccce40` on top of the milestone commit `3b7dd10`
(same branch / same PR #93). Codex code review was **quota-blocked** on the earlier
head, so its green gate did NOT prove no defects — the manager manually reviewed and
found the gaps fixed below.

> **Agent-memory documentation cleanup (2026-08-17, memory-only).** No project code
> changed and the project HEAD is unchanged (`bccce40`); PR #93 remains the current
> project PR (OPEN, not merged, not deployed). `roadmap.md` was converted to a
> historical-change-history document (its stale "current status" runtime block, obsolete
> crons/counts, and old "pending PR"/bug/UX lists-as-future were removed). `pending-tests.md`
> was reconciled to a current verification queue (old "merge PR #82/#84/#85/#88" step-lists,
> the Hebrew-search-matches-English expectation, and Lazudi-scheduled-run checks removed).
> Genuine private-name references were removed from the whole TRF agent-memory directory
> (roadmap + scraper-findings). Current source of truth: root `TODO.md` + this file +
> `state.md`.

## PR #92 isolation (still honored)

PR #92 (`chore(automation): sync from automation-core`) OPEN, head
`e267904e390db8b9d7cf3c19dc337af6fdb9322a`, still exactly its **7 workflow files**
(ci-doctor, claude-fallback-watchdog, claude, codex-auto-fix, codex-backup-fix,
codex-gate, merge-bot). **None touched.** Watchdog cost optimization still deferred
until #92 resolves.

## Manager-review defects found → fixes implemented (follow-up commit bccce40)

1. **P1 — HTTP 200 + zero parsed inventory was not fail-closed.** A source can return
   200 while selectors drift / an anti-bot or JS shell is served, so a page-1 index
   parsing ZERO listing cards still reached the stale sweep (renthub/fazwaz/lazudi/li)
   or a silent green (TP). **Fix:** pure `isAmbiguousEmptyIndex({page, verifiedEmpty})`
   + `BaseScraper.noteEmptyIndexPage(city, page)`. Page 1 with no verified empty-marker
   → `failAcquisition` (no sweep, not SUCCESS); page 2+ → pagination exhaustion (no-op).
   Wired into renthub, fazwaz, lazudi, living-insider, thailand-property.
2. **P1 — Thailand Property workflow could not turn red.** TP runs via
   `scripts/scrape.ts` (`npm run scrape:thailand-property` in `scrape.yml`), NOT
   scrape-cli. scrape.ts printed ✓ and exited 0 regardless of `ScrapeRunResult.status`.
   **Fix:** scrape.ts now propagates status to the exit code (FAILED/throw → non-zero,
   PARTIAL → 0 but labelled, SUCCESS → 0) after closeBrowser/Prisma cleanup; unknown-
   source uses exitCode+return (no `process.exit` bypassing cleanup). Shared exit
   decision `isFailedRunStatus` used by both scrape.ts and scrape-cli.ts.
3. **TP anti-bot/zero-link honest status.** Page-1 HTTP-200 anti-bot/captcha/access-
   denied shell and ambiguous page-1 zero-link now call `failAcquisition` (and still
   `return false` → never swept). TP cap/deadline/`completedCities` safety unchanged.
4. **/jobs PARTIAL UI.** `JobRow` renders `PARTIAL` = "חלקי" in amber (distinct from
   SUCCESS green / FAILED red).
5. **Daily Checkup paused sources.** `build-checkup-message.js` now renders
   `health.paused_sources` (⏸️, always listed even at 0 fresh rows, paused-over-stale
   precedence); paused is not a health failure. Refactored to export pure builders
   (`renderSourceLines`, `buildMessage`) for a deterministic test.
6. **site-health #83 lifecycle.** No healthy-path closure existed → the coalesced
   `site-health` issue could stay open forever, keeping Daily Checkup at "Needs
   Attention". Added an idempotent close-on-recovery step (comment + close the open
   site-health issue only when ALL checks pass; no daily spam). #83 NOT closed here.
7. **scrape.yml stale comment** fixed ("once daily / 30 runs/mo" → every-3-days,
   ~10 runs/mo). Cadence unchanged.

## First-page zero-inventory audit (every current scraper)

Grepped every `length === 0 / size === 0` in `src/scrapers/sources/*.ts`:

| Scraper | Page-loop zero-index site | Classification | Action |
|---------|---------------------------|----------------|--------|
| renthub | `renthub.ts` `links.length===0` | C (ambiguous) | `noteEmptyIndexPage` |
| fazwaz | `fazwaz.ts` `detailUrls.length===0` | C | `noteEmptyIndexPage` |
| lazudi | `lazudi.ts` `links.length===0` | C | `noteEmptyIndexPage` |
| living-insider | `livinginsider.ts` `grouped.size===0` | C | `noteEmptyIndexPage` |
| thailand-property | `candidate.length===0` + anti-bot | C | `noteEmptyIndexPage` + `failAcquisition` on anti-bot |
| hipflat | `hipflat.ts` `links.length===0` | C, BUT `disabled_manually` + explicit out-of-scope | audited, **not modified** |

Non-acquisition `length===0` hits (helper functions, NOT index acquisition, left as-is):
fazwaz `extractDescription`/`extractAmenities` (heading/headings), livinginsider
`findCommonAncestor` (anchors) and `parseLiCardRooms` (matches). **No source has an
evidenced empty-results marker**, so all fail closed on ambiguous page-1 zero cards —
no empty-state selectors were fabricated.

## scripts/scrape.ts exit semantics (after fix)

SUCCESS → exit 0 (✓). PARTIAL → exit 0 but "⚠ PARTIAL" printed. FAILED → `process.exitCode=1`
(✗) so `scrape.yml` goes red. Thrown scraper error → exit 1. `all` mode: runs every
target, collects `anyFailed`, exits 1 if any FAILED/threw, always after closeBrowser +
prisma.$disconnect. No `process.exit` that skips async cleanup.

## Source status (unchanged from milestone)

TP active (GH Actions `scrape.yml`, last scrape 2026-08-16 SUCCESS added 6); FazWaz,
Renthub active; LIVING_INSIDER, LAZUDI paused (runner-IP 403); HIPFLAT disabled_manually.

## Tests

- `npm run test:acquisition-safety` — now 20 checks (adds isAmbiguousEmptyIndex 4,
  isFailedRunStatus 3). PASS.
- `npm run test:scraper-datasafety` — now 20 checks (adds E: HTTP-200 page-1 zero cards
  → no sweep + FAILED; F: page-2 exhaustion → sweep + SUCCESS). PASS.
- `npm run test:checkup-message` — 6 checks (paused-source rendering, precedence,
  status). PASS.
- `npx tsc --noEmit` clean; existing offline smokes (filters, image-utils, photo-filters,
  lazudi/li/renthub parsers) pass; `git diff --check` clean. Lint: repo has no eslintrc
  (pre-existing). Full `next build` needs a live DB — CI's `pr-build-gate.yml` uses `tsc`.

## PR checks

Pushed `bccce40`. PR Build Gate must be verified green on this new head before declaring
validation passed (see final status). **Codex review remained quota-blocked** — absence
of a Codex review is NOT approval.

## DB counts (verified live)

`/api/health` 2026-08-17: `active_listings=949`; last_scrape THAILAND_PROPERTY SUCCESS
(2026-08-16, added 6).

## No production change

This work only updates PR #93. No merge, no deploy. A Vercel preview (if any) is not
production. No production data mutated.

## Physical checks still required AFTER deploy

See pending-tests.md — acquisition failure doesn't deactivate; TP FAILED reddens
scrape.yml; ambiguous HTTP-200/zero-card doesn't sweep; valid pagination exhaustion stays
normal; /jobs shows PARTIAL; Daily Checkup shows LI/Lazudi/Hipflat paused; healthy
site-health run closes #83 via the new lifecycle; auto-state renders active/paused.

## Isolation / constraints re-confirmed

No Prisma schema/migration change. None of PR #92's 7 files changed. hipflat untouched.
Lazudi/LI cron still paused (not re-enabled). No Next.js upgrade. No AI-gate /
favorite-semantics / 14-day-window / limits/cities changes.
