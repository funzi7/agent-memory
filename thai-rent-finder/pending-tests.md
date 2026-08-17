# thai-rent-finder — pending tests / post-deploy checks

## PR #93 — reliability milestone (2026-08-17)

### Regression tests added (already passing in this branch — evidence: green locally)
- [x] `npm run test:acquisition-safety` — pure sweep/classify logic (13 checks).
- [x] `npm run test:scraper-datasafety` — end-to-end via fake Prisma (14 checks):
      acquisition failure ⇒ no sweep + FAILED; per-item error ⇒ records kept + PARTIAL;
      genuinely-empty ⇒ SUCCESS + sweep; sweep query exempts SHORTLISTED/CONTACTED/VISITED.
- [x] `npx tsc --noEmit` clean (repo's CI build gate); existing offline smoke tests pass.

### Post-deploy acceptance (do AFTER PR #93 merges + Vercel deploys — NOT yet done)
- [ ] Trigger `site-health.yml` (`workflow_dispatch`): no `homepage (HTTP 307)` alert;
      uptime step reports homepage OK on the 307 redirect.
- [ ] `GET /api/admin/health?key=SEED_KEY` returns `paused_sources`:
      `["LIVING_INSIDER","LAZUDI","HIPFLAT"]` and `stale_sources` no longer lists the
      paused ones; `healthy:true` if the 3 active sources are fresh.
- [ ] Next `auto-update-state.yml` run: `state.md` shows THAILAND_PROPERTY as
      GH Actions (Tier 2), Hipflat/Lazudi/LI with no live cron / disabled state, and no
      false schedule for commented-out crons.
- [ ] `workflow_dispatch` a paused source (e.g. Lazudi PTY): if it 403s, the job exits
      non-zero, emits an `error` event, `ScrapeJob.status=FAILED`, and **`deactivated=0`**
      (no stale sweep on acquisition failure). If it unexpectedly succeeds (`found>0`),
      that is the signal to re-enable its schedule.
- [ ] Recovery decision for the 8 Lazudi PTY rows deactivated by the old sweep bug
      (Lazudi run `31848091141`): reactivate via `/api/admin/reactivate-curated` if
      wanted, or leave (non-shortlisted; Lazudi paused so they can't self-heal).
- [ ] Issue #83: only after the above prove healthy, decide whether to close it.

## PR #82 — deactivation data-safety fix (post-deploy)

- [ ] Merge PR, wait for Vercel deploy
- [ ] Call /api/admin/reactivate-curated?key=SEED_KEY&dry_run=true — expect Riviera+Dusit rows listed
- [ ] Call again without dry_run — expect reactivated>=2
- [ ] Browser: main list + board show Riviera & Dusit again
- [ ] After next scrape.yml run: audit-listings shows both still is_active=true (sweep exemption held)

## PR #84 — solo cadence + concerns cleanup (post-deploy)

- [ ] Merge PR, wait for Vercel deploy
- [ ] Run /api/listings/<riviera-id>/recompute-concerns?key=SEED_KEY&source=all — new concerns are plain Hebrew, only 4 categories, no wifi/furniture/pets cards
- [ ] Same for the Dusit listing
- [ ] Next TP run (group A day, 09:00 ICT): log shows city order PTY→CMI→PHK→BKK, all 4 completed, BKK yielded ≤2, duration ~4-6 min
- [ ] Site-health after an off-day: no false stale alerts (80h threshold holding)
- [ ] agent-memory state.md after next auto-update: single footer, ~20 duplicates gone, cron table reflects */3 cadence

## PR #85 — search/sort/favorites/lazudi (post-deploy)

- [ ] Merge PR, wait for Vercel deploy
- [ ] /listings?favoriteOnly=1 → favorited listings show
- [ ] favoriteOnly=1&status=SHORTLISTED → still shows; favoriteOnly=1&status=NEW → empty (AND semantics)
- [ ] Search box: "riviera" finds Riviera; Hebrew building-name query finds a match
- [ ] List cards show building name line where available
- [ ] Sort by size asc/desc works; sqm range filter narrows; year sort puts nulls last
- [ ] After next Lazudi run (group B day): a Lazudi listing shows a real description, not "View property listing."

## PR #88 — enrich/dates/search/cleanup (post-deploy)

- [ ] Merge PR, wait for Vercel deploy
- [ ] /api/admin/cleanup-dead-concerns?key=SEED_KEY&dry_run=true → counts > 0
- [ ] Real run → deleted_total matches; open a listing that had "חסר מידע על ריהוט/חיות מחמד" → cards gone
- [ ] Cards show "עודכן: dd.MM.yy HH:mm" in Thailand time; detail page header shows the same line
- [ ] Mobile: search box visible above results without opening סננים; searching adds a recent-chip; chips survive reload; chip click re-applies; ✕ removes
- [ ] After next Lazudi run (group B day): a Lazudi listing shows קומה on the card and מרוהט=כן on the detail page; amenities chips appear
- [ ] PR-body skipped-labels list reviewed (decide if renthub/LI need a findings-doc update later)
