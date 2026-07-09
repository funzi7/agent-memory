# paywall-bot — PR #72 body tag boundary matching fix handoff

Date: 2026-07-09

## Commit

- Full SHA: `744c25a5844c3971806ed4cf22cb1e75e8e82e8b`
- 7-character SHA: `744c25a`
- PR: #72
- Branch: `claude/wave3-quality`
- Push: committed and pushed to the existing PR branch; no new branch and no new PR.

## Root Cause

Wave 3 added body-aware keyword tags, but `sites/themarker/tags.py::build_tags` still used raw
case-insensitive substring checks for title and body keyword matches. Body text is much longer than
titles, so substrings such as `מניה` inside `גרמניה` and `AI` inside `Airbnb` or `retail` could emit
wrong keyword tags.

## Exact Fix

Added a local boundary-aware keyword helper in `sites/themarker/tags.py`. Keyword matches now reject
occurrences embedded inside larger Hebrew or ASCII word tokens. Token chars are normal Hebrew
U+0590-U+05FF, Hebrew Presentation Forms U+FB1D-U+FB4F, ASCII letters/digits, and underscore.
Matching remains case-insensitive for ASCII and checks the first and last character of the whole
keyword phrase, so punctuation and whitespace boundaries are valid.

`build_tags` now uses the helper for both title keyword matches and body keyword matches. Section
URL prefix matching, declaration-order priority, dedupe, cap behavior, no-match behavior, and
title-before-body ordering are unchanged.

## Mandatory Audit

- Invariant: keyword tag matching must match whole Hebrew/ASCII tokens or phrases, not substrings
  embedded inside larger Hebrew/Latin tokens.
- Audited code paths: `KEYWORD_TAGS`; `build_tags`; title keyword matching; body keyword matching
  over `BODY_SCAN_PARAGRAPHS`; `_post_article`; immediate `process_item` publish path; retry
  `_fetch_and_publish` path; tests for title priority, body-only matches, and no-match behavior.
- Changed paths: `build_tags` title keyword matching and body keyword matching now call the shared
  `_keyword_in_text` helper; R2R2R tests now use boundary-valid keywords; new R2R2Rb regression
  covers body false positives, title adjacent false positives, and valid standalone matches.
- Inspected but intentionally unchanged paths: `KEYWORD_TAGS` contents; `SECTION_TAGS` URL prefix
  logic; `DEFAULT_SECTION_TAG`; `MAX_TAGS`; `BODY_SCAN_PARAGRAPHS`; `_post_article` call signature;
  both call sites that pass `parsed.paragraphs` to `_post_article`; Telegram Markdown tag rendering.
- Remaining risk: Hebrew prefixes attached to a keyword, such as a definite article prefix, no
  longer count as keyword matches unless the keyword list includes that form. That follows the
  whole-token invariant and avoids the false positives from embedded substrings.

## Files Changed

- `sites/themarker/tags.py`
- `tests/test_message_format.py`
- `handoffs/CONTEXT.md`
- `/root/work/agent-memory/paywall-bot/cc-latest.md`

## Files Intentionally Not Changed

- `automation-core`
- `/root/work/agent-memory/automation-core/cc-latest.md`
- `core/main.py`
- `KEYWORD_TAGS` entries
- Section URL tag rules
- GitHub labels, including `needs-owner`
- PR metadata, PR body, workflow files, and merge state

## Validation

- `python3 -m py_compile sites/themarker/tags.py tests/test_message_format.py` — passed.
- `python3 -m pytest tests/test_message_format.py -q` — blocked in this environment:
  `/usr/bin/python3: No module named pytest`.
- `python3 -m tests.test_message_format` — fallback blocked because runtime dependencies are not
  installed: `ModuleNotFoundError: No module named 'telegram'`.
- Direct `build_tags` smoke check — passed:
  `גרמניה` did not emit `בורסה`; `Airbnb`/`retail` did not emit `בינה_מלאכותית`; title false
  positives were blocked; standalone `מניה` emitted `בורסה`; standalone `AI` emitted
  `בינה_מלאכותית`; title priority and no-match behavior held.
- `git diff --check` — passed.
- `git status --short` in the main repo — clean after commit and push.

Full pytest was not run. The repo handoff documents the known full-suite sandbox issue; the
requested targeted pytest command could not start here because pytest is unavailable.

## Remaining TODO

- Request/trigger Codex review on the new head.
- Run Codex Gate on branch `claude/wave3-quality` with `pr_number=72`.
- Only then remove `needs-owner` if review is clean and gate is green.
- Merge only after all checks are green.
