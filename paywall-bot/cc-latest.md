# paywall-bot — Tech Feed IL production tenant handoff

Date: 2026-07-19

## Git

- Primary repository: `funzi7/paywall-bot`.
- Starting `origin/main` HEAD:
  `1c94032b34a8c85c5547b4a5bee328bb50ae2f97`.
- Feature branch: `feat/techfeedil-mvp`.
- Final commit and branch HEAD:
  `6f3c600eba54416997b6d837d52ceb1f60e6849a` (`6f3c600`).
- Push: branch pushed successfully to `origin/feat/techfeedil-mvp`; upstream
  tracking is configured. Before the final push it was rebased onto three
  intervening TheMarker state-only `origin/main` commits (latest `cf64521`),
  then updated with an explicit force-with-lease and both suites were rerun.
- `main` was not merged or modified by this task.

## Delivered

- Added the production `techfeedil` tenant for bot `@Tech_Feed_IL_Bot` and
  channel `@Tech_Feed_IL` (`https://t.me/Tech_Feed_IL`). Production discovery
  uses first-party publisher sources only; `@TechFeedIL` is inventory/reference
  input and is not in the live polling path.
- Added aggregate RSS/category discovery, publisher-specific DOM scoping,
  canonical URL handling, source-aware metadata and footers, Hebrew quality
  gates, controlled topic/source hashtags, no-publish preview, isolated state
  and Telegraph account state, tenant workflows, source inventory tooling, and
  focused offline tests.
- Preserved TheMarker defaults through explicit feature gates. In particular,
  its first-success feed strategy, 108x81 RSS-thumbnail rejection, parser
  behavior, AI caption, market emphasis, hero-caption output, state/log paths,
  Telegram formatting, and existing Telegraph token remain unchanged.

## Architecture decisions

- `FeedItem`/`ParsedArticle` now carry `source_id`, `source_name`,
  `source_domain`, `source_url`, `canonical_url`, `parser_id`, publication
  metadata, discovery identities, hero/inline media, captions, and ordered
  section headings. Source metadata survives the deferred queue without
  persisting full article bodies or excerpts.
- Aggregate discovery is opt-in. URL identity removes tracking, AMP, explicit
  mobile aliases, and mako Nexter/TECH12 section variants by shared
  `Article-…htm` ID. Content fingerprints are scoped by source domain, so two
  publishers covering the same announcement remain independent.
- First-run baselines are per feed. A recovering feed cannot release its old
  backlog, while overlap with an already-initialized feed remains fresh and is
  not swallowed by the new baseline. Deferred rows are excluded before the
  fresh-item cap to prevent retry backlog starvation.
- The Tech fetch chain is direct then Jina; no TheMarker paywall service is
  enabled. Known source adapters fail closed when a trusted article body or
  Jina article boundary is missing.
- Tech completeness requires at least 3 meaningful paragraphs, 600 body
  characters, 100 Hebrew letters, and a 45% Hebrew-letter ratio. Failed
  extraction is deferred for 30 minutes, retried up to five times, then becomes
  a controlled permanent failure. Original-source URLs are never posted as a
  fallback.
- Telegraph uses short name `techfeedil`, author `Tech Feed IL`, the original
  article as author URL, dynamic linked publisher footers, no channel “Join”
  author URL, no AI-summary block, and no TheMarker market emphasis.
- Tech polling is hourly all day with lock `bot-state-techfeedil`; TheMarker
  keeps `poll-themarker`. Manual backfill shares the selected tenant lock and
  requires a bounded count (1–100). Poll/backfill budgets are 15/40 minutes,
  Tech state checkpoints after irreversible publication, and state pushes are
  default-branch guarded.

## Verified discovery endpoints

- Gadgety (HTTP 200, 10 items each):
  `https://www.gadgety.co.il/category/technology/feed/`,
  `https://www.gadgety.co.il/category/hardware/feed/`,
  `https://www.gadgety.co.il/category/apps/feed/`, and the official encoded
  cellular category feed.
- Geektime (HTTP 200, 30 items):
  `https://www.geektime.co.il/category/technology/feed/`.
- TGspot (HTTP 200, 10 items): `https://www.tgspot.co.il/feed/rss`, redirecting
  to `/feed/`. Direct articles currently return Cloudflare 403, so Jina is the
  justified article fallback.
- The Verifier (HTTP 200, 10 items): `https://theverifier.co.il/feed/`.
  Feedparser tolerates its observed duplicate namespace attribute.
- mako/N12: authoritative TECH12 category
  `https://www.mako.co.il/news-money/tech12` (18 current exact article rows;
  direct may receive a Radware challenge, then Jina). No TECH12-specific RSS
  is advertised. The official broader Digital/Nexter RSS
  `https://rcs.mako.co.il/rss/cd0c4e8fc83b8310VgnVCM2000002a0c10acRCRD.xml`
  is supplementary and conservatively relevance-filtered.

## Live no-publish evidence

- Two current articles per source were previewed; all 10 were `ready`, every
  footer/source URL was correct, every Telegram representation omitted the
  original URL, and no Telegraph or Telegram call occurred.
- Gadgety direct: 27 paragraphs/3,962 chars with 5 headings; 19/2,406 with 3.
- Geektime direct: 5/2,033 and 8/1,837.
- TGspot Jina: 7/1,788 and 5/1,148.
- The Verifier direct: 12/1,996 and 28/5,671.
- N12 direct: 14/4,528 and 21/5,794.
- Separate authoritative TECH12 checks: Hailo 23/6,125 with 3 headings and
  WhatsApp 5/1,014; mako Article-ID dedup was correct.
- Heroes, section headings, list items, inline media/captions, clean excerpts,
  controlled underscore hashtags, and linked source footers were inspected.

## Source inventory

- Public fallback scanned 1,000 `@TechFeedIL` posts (IDs 62231–63236,
  2026-06-17 through 2026-07-18): 999 linked, 1 linkless, 0 ambiguous.
- Domain counts: pc.co.il 368, Gadgety 193, Geektime 144, mako 134, TGspot
  127, thegadgetreviews.com 33. The newest observed post was Geektime message
  63236 at 2026-07-18T16:57:01Z.
- Reports: `docs/techfeedil-source-inventory.md` and `.json`. The utility
  prefers existing read-only Telethon credentials and safely falls back to
  public `https://t.me/s/TechFeedIL` pages.

## Files changed

- New: `.github/workflows/poll-techfeedil.yml`, `core/preview.py`, both
  inventory reports, `scripts/commit_tenant_state.sh`, `sites/techfeedil/`,
  both empty Tech state/token placeholders, `tests/test_techfeedil.py`, and
  `tools/techfeedil_source_inventory.py` plus `tools/__init__.py`.
- Generalized: `core/alerting.py`, `article_parser.py`, `backfill.py`,
  `feeds.py`, `health.py`, `main.py`, `state.py`, `telegraph_pub.py`,
  `tg_bot.py`, and `url_utils.py`.
- Updated: `.env.example`, `.gitignore`, `README.md`,
  `handoffs/CONTEXT.md`, `sites/themarker/config.yaml`, and shared
  backfill/CI/health/poll workflows. Total commit payload: 33 files.

## Exact validation

- `.venv/bin/python -m unittest tests.test_techfeedil -v` — 21 tests, `OK`.
- `.venv/bin/python -m tests.test_message_format` — 185 PASS, 0 FAIL; final
  line `All tests passed.`
- `.venv/bin/python -m compileall -q core sites tests tools` — passed.
- `bash -n scripts/commit_tenant_state.sh` — passed.
- PyYAML `safe_load` of all 14 workflow YAML files — passed.
- `git diff --check` — passed.
- Release audits found no remaining blocker and no bot token, session string,
  PAT, private key, access-token literal, sensitive state/log, downloaded HTML
  fixture, or full third-party article body in the commit.

## Required manual setup

- Add GitHub Actions secrets `TECH_TELEGRAM_BOT_TOKEN` and
  `TECH_TELEGRAM_CHANNEL`; reuse existing `TELEGRAM_OWNER_ID`. Do not record
  values in code, docs, logs, or this memory.
- Add `@Tech_Feed_IL_Bot` as administrator of `@Tech_Feed_IL` with Post
  Messages permission. The owner must open the bot and send `/start` once so
  alerts can be delivered.
- Review and merge `feat/techfeedil-mvp` through the normal GitHub process.
  After merge, run no-publish preview from the default branch, optionally run
  a small bounded manual backfill, then monitor the first real poll/publish.

## Remaining risks / TODO

- Monitor TGspot's Cloudflare/Jina dependency, mako's Radware challenge and
  conservative supplementary-RSS filter, The Verifier's malformed RSS,
  publisher DOM drift, deferred/permanent-failure rates, and per-source volume.
- Hourly GitHub Actions cost is intentionally unmeasured. Review median and
  worst runtime plus billed usage before changing the cron cadence.
- The first successful real publish creates the separate Tech Telegraph
  account/token state. Confirm it persists only in
  `state/techfeedil-telegraph-token.json` and never touches TheMarker's token.

---

# Previous retained handoff — PR #72 content-quality audit

Date: 2026-07-09

## Commit

- Full SHA: `4eedf243122eb42877fa48251f67d734076d54f8`
- 7-character SHA: `4eedf24`
- PR: #72
- Branch: `claude/wave3-quality`
- Push: committed and pushed to the existing PR branch; no new branch and no new PR.

## What Was Fixed

- Hardened author/byline extraction so suspicious entity, widget, or embed text does not become `מאת:`.
- Stripped source-page Cocoon/AI-summary vendor labels while preserving useful Hebrew summary/body text.
- Expanded finance/markets emphasis coverage across subtitle, Cocoon summary, and body content.
- Kept metadata nodes flat: title, byline, figcaption, footer, and source-link labels are not recursively emphasized.

## Root Causes

- Wrong byline: `_extract_author` trusted `meta[name=author]` and broad `.author|.byline` nodes, and `_clean_author` preserved pure Latin strings even when they looked like organization/widget text instead of a person byline.
- Cocoon label leak: parser extraction could carry raw source-page chrome such as `Cocoon AI Summary` as article content, especially in mixed label+summary text.
- Finance emphasis gap: the emphasis vocabulary and output paths covered core indices/companies/moves but missed common finance terms and did not emphasize subtitle/Cocoon summary content.

## Exact Fix

- Added byline guardrails in `core/article_parser.py`: suspicious pure-Latin bylines are rejected unless they look like a person name; author nodes under embed/widget/promo/summary/noise ancestry are ignored; suspicious metadata can fall through to a later valid byline candidate.
- Reapplied `_clean_author` at the `publish_article` boundary in `core/telegraph_pub.py` before rendering the byline node.
- Added `_strip_cocoon_vendor_label` and applied it to subtitle extraction, Cocoon summary extraction, body paragraph extraction, jina markdown, and smry fallback/html paths.
- Updated Cocoon label regex handling so wrapped forms such as `**Cocoon AI Summary:**` strip cleanly without leaving markdown residue.
- Added `FINANCE_TERMS` and expanded whole-token matching to cover Hebrew Presentation Forms, ASCII, Hebrew prefixes, and terms including stocks, markets, Wall Street variants, Nasdaq/Dow/S&P, futures, oil/Brent/WTI, indexes, exchanges/trading, yields, bonds, rates, and inflation.
- Applied finance emphasis to article content nodes: subtitle, Cocoon summary, and body paragraphs.

## Files Changed

- `core/article_parser.py`
- `core/telegraph_pub.py`
- `tests/test_message_format.py`
- `handoffs/CONTEXT.md`
- `/root/work/agent-memory/paywall-bot/cc-latest.md`

## Files Inspected But Intentionally Unchanged

- `core/main.py`
- `core/tg_bot.py`
- `sites/themarker/tags.py`
- `sites/themarker/config.py`
- `sites/themarker/telegram_index.py`
- Reports and prior Wave 3 media/source-link/residue/tag helpers
- `automation-core`
- GitHub labels, PR metadata, workflow files, and merge state

## Validation

- `python3 -m py_compile core/article_parser.py core/telegraph_pub.py tests/test_message_format.py` — passed.
- `python3 -m pytest tests/test_message_format.py -q` — blocked: `/usr/bin/python3: No module named pytest`.
- `python3 -m tests.test_message_format` — blocked: `ModuleNotFoundError: No module named 'telegram'`.
- Targeted helper smoke with import stubs — passed for author cleanup, publisher byline guard, Cocoon label stripping including markdown-wrapped labels, finance emphasis expansion, substring false-positive avoidance, and metadata-vs-content formatting.
- `git diff --check` — passed.
- Main repo pushed to `origin/claude/wave3-quality` at `4eedf24`.

## Remaining Risk

- Full parser-fixture tests need CI because the local environment lacks `pytest`, `telegram`, and `bs4`.
- No ICE-specific site package exists in this repo; the Cocoon/AI label fix was implemented in the generic parser/publisher paths.

## Remaining TODO

- Request/trigger Codex review on the new head.
- Run Codex Gate on branch `claude/wave3-quality` with `pr_number=72`.
- Only then remove `needs-owner` if review is clean and gate is green.
- Merge only after all checks are green.
