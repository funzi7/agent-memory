# paywall-bot — PR #72 source-link end-marker scan fix handoff

Date: 2026-07-09

## Commit

- Full SHA: `f7dd63f225b40bcfdc0cd972a07c0f7f5b39e995`
- 7-character SHA: `f7dd63f`
- PR: #72
- Branch: `claude/wave3-quality`
- Push: committed and pushed to the existing PR branch; no new branch and no new PR.

## Root Cause

`_extract_source_link()` scanned every `<a href>` inside `section.article-body-wrapper` with
`wrapper.find_all("a", href=True)`. Paragraph and inline-media extraction already stopped at HTML
end-of-body markers such as `עוד כותרות`, but source-link extraction did not. A related rail or ad
after the marker could therefore contribute an external anchor whose text starts with `לכתבה`, and
that anchor could be emitted as the article's source link even though the rail content was truncated
from the article body.

## Exact Fix

`core/article_parser.py` now has `_is_html_end_of_body_marker_text()` for the shared exact-marker
test. `_extract_source_link()` walks `section.article-body-wrapper` descendants in DOM order,
checks text-bearing elements for that marker, and breaks before processing anchors after the marker.
The existing source-link phrase rules and external-host gating remain unchanged. Valid pre-marker
external source links still resolve to the same `{"href", "label"}` shape.

Regression coverage in `tests/test_message_format.py` adds `P2P2Pb`:

- A valid external source link before `עוד כותרות` is still captured with the friendly NYT label.
- A post-marker rail/ad anchor whose text starts with `לכתבה` and whose host is external is ignored.
- Existing P2P2P coverage remains for NYT external capture and TheMarker/domestic rejection.

## Files Changed

- `core/article_parser.py`
- `tests/test_message_format.py`
- `handoffs/CONTEXT.md`
- `/root/work/agent-memory/paywall-bot/cc-latest.md`

## Files Intentionally Not Changed

- `automation-core`
- `/root/work/agent-memory/automation-core/cc-latest.md`
- `state/errors.log`
- GitHub labels, including `needs-owner`
- PR metadata, PR body, workflow files, and merge state

## Validation

- `python3 -m py_compile core/article_parser.py tests/test_message_format.py` — passed.
- `python3 -m pytest tests/test_message_format.py -q` — blocked in this environment:
  `/usr/bin/python3: No module named pytest`.
- `python3 -m tests.test_message_format` — fallback blocked because runtime dependencies are not
  installed: `ModuleNotFoundError: No module named 'telegram'`.
- Direct `_extract_source_link` smoke check with minimal `requests` and `bs4` import stubs — passed:
  pre-marker external NYT link was captured; post-marker external `לכתבה` rail link returned `None`.
- Direct import without stubs was blocked because runtime dependencies are not installed:
  `ModuleNotFoundError: No module named 'requests'`.
- `git diff --check` — passed.
- `git status --short` in the main repo — clean after commit and push.

Full pytest was not run. The repo handoff documents the known full-suite sandbox issue; the
requested targeted pytest command could not start here because pytest is unavailable.

## Remaining TODO

- Request/trigger Codex review on the new head.
- Run Codex Gate on branch `claude/wave3-quality` with `pr_number=72`.
- Only then remove `needs-owner` if review is clean and gate is green.
- Merge only after all checks are green.
