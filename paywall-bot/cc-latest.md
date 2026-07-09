# paywall-bot — PR #72 Hebrew presentation forms residue-scan fix handoff

Date: 2026-07-09

## Commit

- Full SHA: `9530b53d462205cce60cffab9fdf92616bb823ae`
- 7-character SHA: `9530b53`
- PR: #72
- Branch: `claude/wave3-quality`
- Push: committed and pushed to the existing PR branch; no new branch and no new PR.

## Root Cause

The publish-boundary foreign residue scan in `core/telegraph_pub.py` accepted normal Hebrew
characters in U+0590 through U+05FF, but it did not accept Hebrew Presentation Forms such as U+FB2A
or U+FB2B. The parser already allows U+FB1D through U+FB4F as Hebrew paragraph text, so otherwise
clean Hebrew text could be falsely counted as `FOREIGN-RESIDUE` and inflate `POST-RECORD foreign=`.

## Exact Fix

`_foreign_scan_char_ok` now accepts Hebrew Presentation Forms U+FB1D through U+FB4F. Existing
allowed characters are unchanged: normal Hebrew, printable ASCII, whitespace, the explicit
typography/currency/bullet/direction-mark whitelist, and the injected bot label emoji remain
allowed. The scanner does not broadly whitelist Unicode symbols, and true non-Hebrew residue is
still detected.

Regression coverage in `tests/test_message_format.py` extends the existing N2N2N scan test:

- U+FB2A and U+FB2B inside Hebrew text produce zero residue hits.
- A CJK character still produces one residue hit.
- Existing clean cases for the bot label emoji, RLM, bullets, Hebrew punctuation, currency, and
  dashes remain in the same direct scan test.

## Files Changed

- `core/telegraph_pub.py`
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

- `python3 -m py_compile core/telegraph_pub.py tests/test_message_format.py` — passed.
- `python3 -m pytest tests/test_message_format.py -q` — blocked in this environment:
  `/usr/bin/python3: No module named pytest`.
- `python3 -m tests.test_message_format` — fallback blocked because runtime dependencies are not
  installed: `ModuleNotFoundError: No module named 'telegram'`.
- Direct `_scan_foreign_residue` smoke check with a minimal `requests` import stub — passed:
  U+FB2A/U+FB2B returned 0 hits, and CJK U+9884 returned 1 hit.
- Direct scanner import without the stub was blocked because runtime dependencies are not installed:
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
