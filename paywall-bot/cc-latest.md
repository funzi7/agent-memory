# paywall-bot — PR #72 content-quality audit handoff

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
