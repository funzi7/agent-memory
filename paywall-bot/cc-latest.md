# paywall-bot — PR #72 figure video fallback fix handoff

Date: 2026-07-09

## Commit

- Full SHA: `598cfa2c87558f3aed59cfff763f409eff440ed8`
- 7-character SHA: `598cfa2`
- PR: #72
- Branch: `claude/wave3-quality`
- Push: committed and pushed to the existing PR branch; no new branch and no new PR.

## Root Cause

In `core/article_parser.py`, `_extract_inline_images` handled a `<figure>` containing a `<video>`
before the existing image path. When the video shell had no usable http(s) `src` or child
`<source src>`, the video branch hit `continue`. That skipped the whole figure, so a poster or
thumbnail `<img>` in the same figure was never emitted.

## Exact Fix

The video branch now appends and `continue`s only when it successfully adds a valid http(s) video
item. If the media element is a figure and the video source is unusable, duplicate, or capped, the
logic falls through to the existing image extraction branch. Bare unusable `<video>` elements are
still skipped, so non-http video URLs are not published as videos or images.

Regression coverage added in `tests/test_message_format.py`:

- A figure with a video shell using non-http/data video sources and a valid poster `<img>` emits
  one inline media item with `kind == "image"` and the poster URL.
- Existing coverage still checks valid mp4/http(s) figures publish as `kind == "video"`.
- Existing coverage still checks media after an end-of-body marker is excluded.
- Existing coverage still checks `_finalize` preserves `InlineImage.kind == "video"`.

## Files Changed

- `core/article_parser.py`
- `tests/test_message_format.py`
- `handoffs/CONTEXT.md`
- `/root/work/agent-memory/paywall-bot/cc-latest.md`

## Files Intentionally Not Changed

- `automation-core`
- `/root/work/agent-memory/automation-core/cc-latest.md`
- GitHub labels, including `needs-owner`
- PR metadata, PR body, workflow files, and merge state

## Validation

- `python3 -m py_compile core/article_parser.py tests/test_message_format.py` — passed.
- `python3 -m pytest tests/test_message_format.py -q` — blocked in this environment:
  `/usr/bin/python3: No module named pytest`.
- `python3 -m tests.test_message_format` — fallback blocked because runtime dependencies are not
  installed: `ModuleNotFoundError: No module named 'telegram'`.
- Direct parser smoke check — blocked because `beautifulsoup4` is not installed:
  `ModuleNotFoundError: No module named 'bs4'`.
- `python3 -m pip install -r requirements.txt pytest` — blocked because `pip` is not installed.
- `python3 -m ensurepip --version` — blocked because `ensurepip` is not installed.
- `git diff --check` — passed before commit.
- `git status --short` in the main repo — clean after commit and push.

Full pytest was not run. The repo handoff documents the known full-suite sandbox issue; the
requested targeted pytest command could not start here because pytest is unavailable.

## Remaining TODO

- Request/trigger Codex review on the new head.
- Run Codex Gate on branch `claude/wave3-quality` with `pr_number=72`.
- Only then remove `needs-owner` if review is clean and gate is green.
- Merge only after all checks are green.
