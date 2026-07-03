# automation-core — latest Claude Code status

## fix #19 — eliminate in-script module loading; raw REST via built-in `fetch`

**main commit `de5eb9a`** (direct to main, ONE commit, author funzi7). Both changed workflows
byte-identical across `workflows/` ↔ `.github/workflows/` (merge-bot `7563959`, watchdog `b952c9f`);
actionlint + `yaml.safe_load` pass on all four copies; `node --check` on both script bodies.

### The bug (empirical, both majors)
`require('@actions/github')` crashed merge-bot on **github-script v7** (`Cannot find module
…/v7/dist/index.js`), and `__original_require__('@actions/github')` crashed it **again on v8** (same
error, v8/dist in the stack). Root cause: the action ships an **ncc-bundled `dist` with NO
`node_modules`** — there is nothing to resolve, under either require, in either major. The fix #18
watchdog sweep carried the SAME dead construct (plain `require` on v7), so it was **dead-on-arrival
every tick** (threw before reading a single verdict).

### The fix — built-in global `fetch`, zero modules
Replaced the second-token octokit client in BOTH files with `fetch`-based helpers at the same script
spot:
- `roGet(path)` — `Bearer $GH_READONLY_TOKEN` + `Accept: application/vnd.github+json` +
  `X-GitHub-Api-Version: 2022-11-28`; throws with status + body slice on non-OK.
- `roCheckRuns(ref)` — `GET /repos/{o}/{r}/commits/{ref}/check-runs?per_page=100&page=N` (paged to 10).
- `roStatuses(ref)` — `GET /repos/{o}/{r}/commits/{ref}/statuses?per_page=100&page=N` (**merge-bot only**;
  the watchdog reads only check-runs).

**merge-bot.yml** (`@v8`, kept): call sites became `const checkRunsAll = await roCheckRuns(headSha);`
and `const statuses = await roStatuses(headSha);`.
**claude-fallback-watchdog.yml** (`@v7`, kept): the sweep's call site became
`const checkRuns = await roCheckRuns(headSha);`; false "v7 exposes require" comment + require line
deleted; all sweep logic (candidate rule, fresh-signal matchers, dispatch, loud-fail) unchanged.

REST payload fields are **identical** to what octokit returned (check runs:
`name`/`status`/`conclusion`/`started_at`/`completed_at`/`output`; statuses: `state`/`context`/
`created_at`), so every downstream consumer — the fix #17 cancelled filter, latest-per-name dedupe,
`anyRunning`/`anyFailed`, `CODEX_CHECK` lookup, status handling, and the sweep's `output.title`
verdict read — is untouched. `github-token: AUTOMATION_PAT` (mutations/dispatch) and the
`GH_READONLY_TOKEN: github.token` env line unchanged on both.

### Validation
`yaml.safe_load` on both copies of both files; actionlint clean on all four; `node --check` on each
extracted script body; grep across `workflows/` + `.github/workflows/` returns **ZERO** hits for
`require('@actions/github')`, `__original_require__`, `getOctokit`, and `readonly.`; `git hash-object`
equal per file.

**Handoffs updated in the same commit:** `handoffs/CONTEXT.md` (new **HARD RULE** in §7 CONVENTIONS —
never load a module in github-script; the only sanctioned second-token pattern is raw REST via built-in
`fetch`; merge-bot + watchdog sections corrected), `LOOP_STATE.md` (merge-bot + watchdog fix #19
entries), `handoffs/loop-build.md` (dated entry: v7 + v8 crash record, both replaced with fetch).

**Next:** merge-bot's checks/statuses reads and the watchdog late-signal sweep now actually execute
(were throwing every run). Propagates to downstreams on the next daily sync.
