# thai-rent-finder — Pending Verification

A short, current queue of things to actually test. The current in-flight PR is **#93**
(branch `fix/trf-reality-sync-data-safety`), OPEN, not merged. Regression tests already
pass locally on that branch (see the note at the end); the items below are the physical
checks that still need a real environment (post-merge/post-deploy) or a live UI.

Historical per-PR "open, merge and deploy" step-lists (for the already-merged #82 / #84
/ #85 / #88 work) have been dropped; only the genuinely-still-unverified product
behaviors are kept, rewritten as current product checks.

---

## PR #93 — post-merge / post-deploy (NOT yet done)

- [ ] Site Health run: the `/` → `/listings` **307** redirect no longer raises a
      `homepage (HTTP 307)` alert (uptime step reports homepage OK).
- [ ] `GET /api/admin/health?key=SEED_KEY` returns `paused_sources`
      `["LIVING_INSIDER","LAZUDI","HIPFLAT"]`; `stale_sources` no longer lists the paused
      ones; `healthy:true` when the 3 active sources are fresh.
- [ ] Next `auto-update-state` run: `state.md` shows THAILAND_PROPERTY as GH Actions
      (Tier 2), LI/Lazudi/Hipflat as paused with no live cron, and no false schedule for
      commented-out crons. **Note:** the generator fix ships in PR #93 — until it merges,
      the daily auto-run still uses the deployed (old) generator, so the deployed
      `state.md` may temporarily show the old values. Not a regression.
- [ ] A real acquisition failure (e.g. a `workflow_dispatch` on a paused source that
      403s) → job exits non-zero, `ScrapeJob.status=FAILED`, and **`deactivated=0`**.
- [ ] Ambiguous HTTP-200 page-1 zero-card run (selector drift / a returned shell) →
      exits non-zero, `status=FAILED`, **no stale sweep** (`deactivated=0`).
- [ ] Valid pagination exhaustion (page 2+ empty after page-1 inventory) stays normal —
      `SUCCESS`/`PARTIAL`, sweep runs, no false acquisition failure.
- [ ] A Thailand Property FAILED run (anti-bot / zero-link) turns the `scrape.yml`
      GitHub Actions step **red** (scripts/scrape.ts exit propagation).
- [ ] `/jobs` renders a PARTIAL job as "חלקי" in amber (needs a real PARTIAL row).
- [ ] Daily Checkup Telegram message lists LIVING_INSIDER / LAZUDI / HIPFLAT with ⏸️
      (paused); overall status is NOT forced to "Needs Attention" by paused alone.
- [ ] A fully-healthy Site Health run comments "recovered" on and **closes** the open
      `site-health` issue (#83); a subsequent healthy run posts no further comment
      (idempotent). Do NOT close #83 by hand — let the workflow do it.
- [ ] Decide/recover the 8 Lazudi PTY rows deactivated by the old sweep bug (Lazudi run
      `31848091141`): reactivate via `/api/admin/reactivate-curated` or leave them
      (non-shortlisted; Lazudi paused so they can't self-heal). Only if still relevant
      after deploy.

## Older physical UX/data checks still worth verifying

These are meaningful product behaviors that have never been physically re-verified in
the current UI/data (independent of any specific old PR). Test when convenient:

- [ ] **Curated protection holds through real scraper cycles:** a SHORTLIST-or-better
      listing stays `is_active=true` and visible on the list + board after a normal
      scrape run that didn't re-see it (stale-sweep exemption).
- [ ] **AI concerns hygiene in production:** concerns on a live listing use only the 4
      approved categories, in simple natural Hebrew, with no legacy wifi/furniture/pets
      cards.
- [ ] **Favorite + status AND semantics in the live UI:** `favoriteOnly=1` shows
      favorited listings; `favoriteOnly=1&status=SHORTLISTED` still shows;
      `favoriteOnly=1&status=NEW` is empty (AND, not OR).
- [ ] **Latin search works:** searching "riviera" finds the Riviera listing. (Hebrew
      queries matching English source text is a KNOWN LIMITATION — see TODO.md — not a
      test target.)
- [ ] **Mobile recent-search chips:** searching adds a recent chip; chips survive a
      reload; a chip click re-applies the query; ✕ removes it.
- [ ] **"עודכן" timestamp** shows on cards + the detail header in Thailand time.
- [ ] **Sort/size filters:** sort by size asc/desc; sqm range narrows; year sort puts
      nulls last.

_(Lazudi/LI enriched-field checks are intentionally omitted while those sources are
paused; revisit only if a source becomes runnable again — see the re-enable condition in
TODO.md / cc-latest.md.)_

---

_Regression tests passing locally on branch `fix/trf-reality-sync-data-safety`:_
`test:acquisition-safety` (20 checks), `test:scraper-datasafety` (20 checks),
`test:checkup-message` (6 checks), plus `tsc --noEmit` and the offline parser smokes.
These are code-level and need no environment; the checkboxes above are the physical ones.
