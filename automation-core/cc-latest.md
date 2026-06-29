# automation-core — latest Claude Code status

## Fix #10 — claude.yml swaps the triggering comment's 👀 → 👎 on a failed fix

**automation-core main commit:** `bb15a60`

When `claude.yml`'s autonomous fixer RAN but did not succeed, the triggering
comment kept the 👀 (eyes = "in progress") reaction the action adds — so a failed
run looked like it was still checking. Fix #10 adds a fail-soft github-script step
after the `claude` step that swaps that reaction to 👎.

- **Gate:** `if: always() && steps.keycheck.outputs.has_key == 'true' &&
  steps.claude.outcome != 'success'` (the `has_key` guard keeps a fail-soft
  no-`ANTHROPIC_API_KEY` skip — which isn't a failure — from being 👎'd).
- Reads `context.payload.comment.id` (present for `issue_comment` AND
  `pull_request_review_comment`; absent on `issues.opened/labeled` → no-op).
- Picks the issue-comment vs PR-review-comment reaction endpoint by
  `context.eventName` (list/delete/create differ).
- Deletes the bot's existing `eyes` reaction (matched via `users.getAuthenticated`,
  falling back to any `eyes` if that lookup fails), then adds `-1` (👎).
- Uses the same `AUTOMATION_PAT || github.token` the action used to add the 👀.
- Whole step wrapped in try/catch — a reaction error NEVER fails the job; no extra
  comment is posted (the reaction swap is the only signal).

**Validation:** actionlint clean on both copies; node --check on the new
github-script block; `workflows/` ↔ `.github/workflows/` byte-identical (blob
`ed6dc67`).

**Propagation:** rides the **daily sync** to the downstream repos. With fix #8
(watchdog escalates on timeout when the backup is disabled) and fix #10, a failed
or timed-out fix now reads clearly (👎 + `needs-owner`) instead of a stale 👀.
