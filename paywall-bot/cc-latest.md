# paywall-bot — PR #72 mp4 video source selection and full Wave 3 audit handoff

Date: 2026-07-09

## Commit

- Full SHA: `a816ec7a6fe5dd84ddac6e0934748efa9af5d89a`
- 7-character SHA: `a816ec7`
- PR: #72
- Branch: `claude/wave3-quality`
- Push: committed and pushed to the existing PR branch; no new branch and no new PR.

## Root Cause

The in-body video extraction branch in `core/article_parser.py::_extract_inline_images` used the
direct `<video src>` or only the first child `<source src>`, then accepted any resolved http(s) URL.
Common markup can put webm, HLS, blob, or data candidates before a later usable mp4, so the parser
could miss the mp4 or publish an unsupported video URL.

## Exact Fix

Added `_is_usable_inline_video_src` and `_select_usable_inline_video_src` in `core/article_parser.py`.
The selector prefers a usable direct `<video src>` and otherwise scans all child `<source>` entries in
DOM order. A candidate is accepted only when it resolves to http(s) and is mp4 by URL path before
query/fragment or by `video/mp4` type metadata. HLS, webm, blob, data, and other unsupported sources
are rejected.

`_extract_inline_images` now uses that selector. Valid mp4 videos still emit `InlineImage(kind="video")`.
Unsupported videos inside `<figure>` fall through to the existing poster/thumbnail `<img>` branch.
Unsupported bare `<video>` elements emit nothing. Existing dedupe, caps, captions, anchor placement,
and end-marker protections remain unchanged.

## Full Wave 3 Audit

- Invariants audited: A inline text/join; B end-of-body markers; C inline media; D source-link
  extraction; E publish-boundary residue scan; F tag keyword matching; G tests and call-site
  consistency.
- Audited code paths: `_inline_text`, `_clean`, `_extract_paragraphs`, figcaption extraction,
  `_extract_cocoon_paragraphs`, `_extract_subtitle`, `HTML_END_OF_BODY_MARKERS`,
  `_is_html_end_of_body_marker_text`, `_truncate_at_end_of_body_marker`, `_extract_inline_images`,
  `_select_best_image_src`, `InlineImage`, `_finalize`, `_build_nodes`, `_extract_source_link`,
  `_scan_foreign_residue`, `_foreign_scan_char_ok`, `publish_article`, `LAST_PUBLISH_STATS`,
  `KEYWORD_TAGS`, `build_tags`, `BODY_SCAN_PARAGRAPHS`, `_post_article`, `process_item`, and
  `_fetch_and_publish`.
- Changed paths: video source selection in `core/article_parser.py`; Q2Q2Qd regression coverage and
  runner registration in `tests/test_message_format.py`; repo handoff in `handoffs/CONTEXT.md`; this
  agent-memory handoff.
- Inspected but intentionally unchanged paths: `core/telegraph_pub.py`, `sites/themarker/tags.py`,
  `core/main.py`, existing parser cleaner behavior, source-link phrase/host gating, residue whitelist,
  tag keyword lists, section-tag rules, workflow files, labels, and merge state.
- Tests covering audited invariants: L2L2L covers inline join and figcaption spacing; M2M2M covers
  paragraph end markers; P2P2Pb and Q2Q2Qb cover source-link/media marker stops; Q2Q2Q covers valid
  in-body mp4 video and rail exclusion; Q2Q2Qc covers poster fallback for unusable figure video;
  Q2Q2Qd covers mp4 source selection, type-hinted mp4, poster fallback, and unsupported bare video;
  PPPPP covers `_finalize` preserving video kind; N2N2N covers residue hits and Hebrew Presentation
  Forms/emoji whitelist; O2O2O covers subtitle label normalization; P2P2P and U1U1U cover source-link
  capture and domestic-host rejection; R2R2R and R2R2Rb cover body-aware tags, title priority,
  no-match behavior, and Hebrew/ASCII token boundaries.
- Remaining risk: local runtime dependencies are incomplete, so `pytest` and the standalone test
  module could not run in this container. CI remains the full test arbiter. The changed helper was
  directly smoke-tested with import stubs, and static validation passed.

## Files Changed

- `core/article_parser.py`
- `tests/test_message_format.py`
- `handoffs/CONTEXT.md`
- `/root/work/agent-memory/paywall-bot/cc-latest.md`

## Files Intentionally Not Changed

- `automation-core`
- `/root/work/agent-memory/automation-core/cc-latest.md`
- `core/telegraph_pub.py`
- `sites/themarker/tags.py`
- `core/main.py`
- GitHub labels, including `needs-owner`
- PR metadata, PR body, workflow files, and merge state

## Validation

- `python3 -m py_compile core/article_parser.py core/telegraph_pub.py sites/themarker/tags.py tests/test_message_format.py` — passed.
- `python3 -m pytest tests/test_message_format.py -q` — blocked in this environment:
  `/usr/bin/python3: No module named pytest`.
- `python3 -m tests.test_message_format` — fallback blocked because runtime dependencies are not
  installed: `ModuleNotFoundError: No module named 'telegram'`.
- Direct helper smoke check with local import stubs — passed:
  direct `.mp4` accepted; later `.mp4` selected after HLS/webm; `video/mp4` type-hinted non-`.mp4`
  URL accepted; webm, HLS, blob, and data sources rejected; unsupported candidates returned empty.
- Pre-commit self-review search — passed:
  no remaining `video.find("source")`; source scanning uses the new helper; body-wrapper walkers and
  tag matching remain on marker-aware/helper-based paths.
- `git diff --check` — passed.
- `git status --short` in the main repo — clean after commit and push.

## Remaining TODO

- Request/trigger Codex review on the new head.
- Run Codex Gate on branch `claude/wave3-quality` with `pr_number=72`.
- Only then remove `needs-owner` if review is clean and gate is green.
- Merge only after all checks are green.
