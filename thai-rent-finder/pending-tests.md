# thai-rent-finder — pending tests / post-deploy checks

## PR #82 — deactivation data-safety fix (post-deploy)

- [ ] Merge PR, wait for Vercel deploy
- [ ] Call /api/admin/reactivate-curated?key=SEED_KEY&dry_run=true — expect Riviera+Dusit rows listed
- [ ] Call again without dry_run — expect reactivated>=2
- [ ] Browser: main list + board show Riviera & Dusit again
- [ ] After next scrape.yml run: audit-listings shows both still is_active=true (sweep exemption held)
