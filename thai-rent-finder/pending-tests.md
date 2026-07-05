# thai-rent-finder — pending tests / post-deploy checks

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
