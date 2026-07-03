# automation-core — latest Claude Code status

## HOTFIX (merge-bot YAML) + fix #18 (watchdog late-signal sweep)

**main commit `7b0e2be`** (direct to main, ONE commit, author funzi7). Both changed workflows
byte-identical across `workflows/` ↔ `.github/workflows/` (merge-bot `8811de6`, watchdog `9cb7d42`);
actionlint + `yaml.safe_load` pass on all four copies; `node --check` on both script bodies.

### PART A — HOTFIX: merge-bot.yml was broken YAML on main (both copies)
A manual paste of the `github-script v8` + `__original_require__` fix landed badly:
- `.github/workflows/merge-bot.yml` had a stray `+ const { getOctokit } = __original_require__(...)`
  diff-artifact line, then the real getOctokit line + `const readonly = ...` at **column 0**.
- `workflows/merge-bot.yml` had getOctokit indented but `const readonly` at **column 0**.

A column-0 line **terminates** the `script: |` block scalar, so `yaml.safe_load` failed at line 92
col 1 on BOTH copies — the whole file wouldn't parse (and had synced broken to a downstream). Fixed:
the block is now
```
            const { getOctokit } = __original_require__('@actions/github');
            const readonly = getOctokit(process.env.GH_READONLY_TOKEN);
```
at the 12-space script indent, no column-0 lines anywhere in the block. The `actions/github-script@v8`
bump itself is CORRECT and **stays** (v8 sandboxes `require`, so `__original_require__` is required to
load the bundled `@actions/github`). Every OTHER workflow left on `@v7`. `readonly` still used for
exactly the two reads (`checks.listForRef` + `repos.listCommitStatusesForRef`); `github-token` still
`AUTOMATION_PAT`.

### PART B — fix #18: watchdog late-signal sweep closes the late-👍 gap
INCIDENT: Codex's 👍 landed AFTER the gate's 3-attempt poll window (~4.5 min) closed. A reaction
fires **no webhook event**, so nothing re-runs the gate → the PR strands 🟡-pending forever (until a
manual re-run). Fix: a SECOND `github-script@v7` step in `claude-fallback-watchdog.yml`, AFTER the
existing timeout logic, on the SAME 5-min schedule (**zero new billed runs**), whole-body +
per-PR `try/catch` so it never blocks the timeout step:
- For each open PR, read the newest `codex-gate-verdict` check-run on the head via a **GITHUB_TOKEN
  readonly** client (`require('@actions/github').getOctokit(env.GH_READONLY_TOKEN)` — v7 plain
  `require`; fine-grained PATs can't hold Checks, so added `checks: read` to the watchdog perms).
- Candidate iff the verdict title is **`🟡 Waiting for Codex review`** (verbatim from the gate's
  publish call) OR no verdict on the head. 🟢 needs nothing; 🔴 (active P1/P2) is the bridge's job.
- For a candidate, if a **fresh Codex signal on the head** exists — a Codex review
  `submitted_at > latestCommitDate` OR a Codex-authored issue-level 👍 `created_at > latestCommitDate`,
  using the gate's EXACT `isCodex` matcher and `latestCommitDate` (max committer date across
  `pulls.listCommits`) — it re-dispatches the gate on the head branch **exactly as `scheduleRerun`**
  (`createWorkflowDispatch` `codex-gate.yml`, `ref: pr.head.ref`, `inputs.pr_number`) via
  **AUTOMATION_PAT** (`github`, the watchdog's dispatch token; fix #4 loud-fail = `core.error` +
  Telegram), logging `late-signal sweep: dispatching gate for PR #N @ <head7>`.
- **Self-limiting:** after the dispatched run the verdict is 🟢 (candidate clears) or 🔴 (skipped
  thereafter) → at most one extra gate run per stuck head per watchdog tick.

**Handoffs updated in the same commit:** `handoffs/CONTEXT.md` (merge-bot: v8 `require` lesson +
manual-edit/YAML rules; watchdog: the late-👍 sweep), `LOOP_STATE.md` (merge-bot hotfix +
watchdog fix #18), `handoffs/loop-build.md` (dated entry: broken-YAML-on-main + stranded-green-PR,
both closed here).

**Next:** a late Codex 👍 now self-heals within one watchdog tick (≤5 min) instead of stranding until
a manual re-run. Propagates to downstreams on the next daily sync.
