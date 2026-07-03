# automation-core — latest Claude Code status

## fix #17 — gate never dies mid-verdict; merge-bot ignores cancelled checks + reads on GITHUB_TOKEN

**main commit `a03a807`** (direct to main, ONE commit, author funzi7). Two live failures from today,
three parts. Both changed workflows byte-identical across `workflows/` ↔ `.github/workflows/`
(codex-gate `140e929`, merge-bot `f08ea09`); actionlint clean on all four copies; `node --check` OK
on merge-bot's github-script body.

### INCIDENT 1 — a green PR stranded by a self-cancelled gate run
A codex-gate run read Codex's 👍, CREATED the green `codex-gate-verdict` tile, then got CANCELLED
mid-run by the workflow's own `cancel-in-progress` BEFORE the job concluded — leaving the
authoritative `check-codex-status` job check `cancelled` on the head. merge-bot treats cancelled as
failed → the PR stranded until a manual re-run.
- **Part A — `codex-gate.yml`:** `cancel-in-progress: true → false` (group key UNCHANGED). In-progress
  runs now always run to completion; GitHub still collapses the QUEUE per group (at most one pending;
  superseded pending runs dropped), so event bursts don't storm — they just don't cancel the
  executing run.
- **Part B — `merge-bot.yml`:** before the latest-check-per-name dedupe, `checkRuns` is filtered
  `conclusion !== 'cancelled'` (in-progress runs, `conclusion: null`, kept so `anyRunning` still
  works); latest-per-name, `anyFailed`, and the `CODEX_CHECK` lookup all operate on the filtered
  list. An older SUCCESS on the same head stays authoritative past a cancelled tail (checks are
  pinned to the head SHA); if EVERY `check-codex-status` on the head is cancelled → lookup finds
  nothing → fail-closed skip (unchanged).

### INCIDENT 2 — merge-bot crash: `Resource not accessible by personal access token`
merge-bot reached its checks read on the first real candidate and died. The whole github-script step
is bound to `AUTOMATION_PAT`, and **fine-grained PATs cannot be granted the Checks permission at all**
(no such option exists in the PAT UI), so `checks.listForRef` on the PAT can never succeed.
- **Part C — `merge-bot.yml`:** added `env: GH_READONLY_TOKEN: ${{ github.token }}` and built
  `const readonly = require('@actions/github').getOctokit(process.env.GH_READONLY_TOKEN)`. Switched
  ONLY the two read calls (`checks.listForRef` + `repos.listCommitStatusesForRef`) to `readonly`.
  `github-token` stays `AUTOMATION_PAT` — every MUTATION (`pulls.merge` [must be PAT-authored so the
  push to main triggers downstream], labels, comments, `deleteRef`, issue-close) is unchanged.
  `GITHUB_TOKEN` carries the workflow's already-declared `checks: read` + `statuses: read`.

**Validation greps:** no `cancel-in-progress: true` directive remains in codex-gate.yml; the cancelled
filter sits before latest-per-name; `readonly` is used for exactly the two reads (no other
`readonly.rest.`); `github-token` still `AUTOMATION_PAT`. Handoffs updated in the same commit:
`handoffs/CONTEXT.md` (gate concurrency semantics + merge-bot cancelled-filter + two-token split +
fine-grained-PAT/Checks limitation), `LOOP_STATE.md` (codex-gate + merge-bot entries, fix #17),
`handoffs/loop-build.md` (dated entry: stranded-green-PR + merge-bot PAT crash).

**Next:** watch the next real green candidate merge cleanly — no cancelled-tail strand, no PAT-Checks
crash. Propagates to downstreams on the next daily sync.
