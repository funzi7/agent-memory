# paywall-bot — latest Claude Code status

## Codex #49 P2 fix: commit filed state onto a fresh origin/main checkout

**PR #49 (`claude/quality-rolling-issue`) head SHA:** `540d29a`

**Codex finding (P2 on #49):** the Quality Monitor can be dispatched from a
NON-main ref. The rolling-Issue flow committed the filed-state update and pushed
`HEAD:main` from the event ref — which can fail after the Issue was already
created/commented, leaving the new hashes unmarked and causing duplicate
comments on the next run.

**Fix (`core/quality_inspector.py`, `file_quality_findings`):** before
committing `state/themarker.json`, the function now runs `git fetch origin main`
then `git checkout -B main origin/main`, RE-READS the state from the main
checkout and MERGES the new finding hashes (so a concurrent run's marks aren't
clobbered), writes, commits, and **`git push origin main`** (fast-forward) —
instead of `git push origin HEAD:main` from the event ref. Ordering preserved:
this runs ONLY after the Issue create/comment succeeded, so hashes are marked
only once the findings are actually filed. The rolling-Issue logic and the
`ROUTE_FINDINGS_TO_AUTOFIX` toggle are unchanged.

**Test:** RR2 updated to assert the new ref behavior — `fetch origin main`,
`checkout -B main origin/main`, and `push origin main` are called, `push origin
HEAD:main` is NOT, and the checkout happens before the state add/commit.
Validated standalone (create / ref-order / no-op all pass). The full
`tests/test_message_format` suite still can't run in this sandbox (top-level
`from core import tg_bot` → `telegram`/`cryptography` rust panic, unrelated).

**Status:** committed to `claude/quality-rolling-issue` (PR #49) as commit
`540d29a`. Merge #49 to land both the rolling-Issue switch and this P2 fix.
