# paywall-bot — latest Claude Code session state

Updated: 2026-07-20 (UTC)

## What just happened

Two-part task after PR #79 merged (main `a21f49c`):

1. **Android/Kimi operational Telegraph repair — STILL BLOCKED, nothing
   applied.** Re-verified fresh this session: the sandbox egress proxy
   answers 403 to CONNECT for `api.telegra.ph` (and tgspot/theverifier/
   `api.telegram.org`), and no Telethon credentials exist in the
   environment (`TELEGRAM_API_ID`/`API_HASH`/session absent). The page
   doctor is proven correct up to the network boundary; the owner must run
   the documented diagnose → dry-run → `--apply` → re-diagnose sequence
   from an egress-capable machine (commands in
   `docs/techfeedil-attribution-health.md`). 0 Telegraph pages
   created/edited, 0 Telegram operations, 0 state changes.

2. **PR #80 opened (do not merge without review): The Verifier content +
   RTL fix.** Branch `fix/techfeedil-theverifier-content-rtl` from
   `a21f49c`, head `227e567f42a73ab44f7f41133ffd82ddc33584c4`, non-draft
   to main, 10 files, no `state/` files.
   https://github.com/funzi7/paywall-bot/pull/80

## PR #80 contents (all tenant-gated; TheMarker byte-identical)

Incident: Verifier article published pre-#79 shipped "3 דקות קריאה" as
excerpt + first paragraph + fingerprint suffix (committed fingerprint
`…openai3דקותקריאה` is the smoking gun), raw `Image N:` caption prefixes,
caption-as-paragraph duplicates, hero repeated inline as a `-768x432`
variant, LTR-leading blocks left-aligned, left-aligned native author
strip, visible Cocoon residue.

- `is_reading_time_label` shared classifier (standalone full-line he/en)
  → `_is_noise_text`, subtitle candidates, heading refinement,
  `_post_flash`.
- `select_article_excerpt` replaces both raw `paragraphs[0]` sites; Tech
  `prefer_subtitle_excerpt` subtitle→body→summary(gated); TheMarker
  legacy order regression-pinned; `_is_substantive_excerpt` rejects
  metadata shapes; nothing substantive → excerpt omitted.
- `rich_description_candidates`: visible subtitle → og:description →
  meta → JSON-LD (`_jsonld_article_description`).
- `telegraph.force_rtl_blocks` (Tech): leading RLM every Telegraph block
  + Telegram line, trailing RLM on Latin-ending blocks; untrusted source
  bidi controls stripped first. 3 tech assertions updated deliberately.
- `clean_image_caption`/`caption_identity` (prefix strip, figure dedup,
  caption-as-paragraph removal), `image_asset_identity` (scheme/www/
  query/WP `-NxN`/`-scaled`) for hero/inline dedup.
- Jina vendor-label block opens a ONE-block summary region →
  `cocoon_paragraphs` → #79 strict gate; check runs BEFORE the
  artifact/metadata/emptiness filters (pure label block is emptied by
  `_strip_cocoon_vendor_label` and would otherwise never open it).
- Native "פיד טכנולוגיה" strip = Telegraph's own author header from
  `author_name`/`author_url` — NOT our node, NOT claimed fixed;
  `telegraph.author_name_rlm` (default false) is the controlled RLM
  experiment, enable only after live verification.
- NEW `tests/test_techfeedil_verifier.py` (13, in ci.yml) with the exact
  sanitized Verifier jina fixture end-to-end. Full matrix green:
  185 message-format checks + 21+17+50+42+13+15+13 unittest, compileall,
  workflow YAML, `bash -n`, `git diff --check`, state-clean gate.

## Post-merge (owner)

1. Merge PR #80 through review. Do NOT run Backfill.
2. From an egress-capable machine: run the page-doctor sequence for the
   Verifier page (and the still-pending Android/Kimi repairs from the
   #79 procedure) — diagnose, dry-run repair, `--apply`, re-diagnose.
3. Watch the next Tech poll: excerpts must never be reading-time; blocks
   right-aligned; `author_name_rlm` stays off until a live page verifies
   the experiment.

## Standing rules (unchanged)

Work only in funzi7/paywall-bot (+ this memory repo). Never write the
owner's personal name. Commits as funzi7
(207505227+funzi7@users.noreply.github.com). Never print secrets. No
Backfill; no publishing during development; never mutate tracked
`state/` files (CI enforces `git diff --exit-code -- state/`). Verify
PRs via API with full 40-char SHAs. gh CLI unavailable — use GitHub MCP
tools. Test isolation: every suite re-points ERROR_LOG to a tempdir via
the `_activate` pattern.

## Earlier history

PR #72 (wave 2), PR #77 (attribution/byline/health), PR #78 (stale/promo
queue hotfix + state-hygiene gate), PR #79 (Cocoon ASCII gate, publish
validator, IV ledger, page doctor) — all merged by owner.
