# automation-core — fix #27 implementation handoff

Date: 2026-07-07

## 1. Main commit SHA

- Full SHA: `93f6acb9d2e0396afad3e10854503024843c32de`
- 7-character SHA: `93f6acb`
- Branch: `automation-core/main`
- Push result: `main -> main` at `origin https://github.com/funzi7/automation-core.git`

## 2. Scope

Changed exactly this in automation-core:

- Split Claude behavior for Issue/new-PR fixes versus existing PR comment fixes.
- Added owner-only guard for comment-triggered Claude runs in the public repo.
- Resolved PR targets through the GitHub API before Claude runs, with same-repo/fork branching.
- Checked out same-repo PR comments at the exact existing PR head SHA and attached the local checkout to the original head branch.
- Kept Issue/`claude-fix` behavior as the new-branch/new-PR path using `Fixes #<issue-number>`.
- Added direct existing-head wording to the bridge `@claude fix` message.
- Wired `CODEX_CLOUD_ENABLED` as default-on / opt-out in the watchdog.
- Replaced loose Codex identity matching in `codex-gate.yml` and `claude-fallback-watchdog.yml` with the same strict allowlist.
- Added Codex API agent failure markers and watchdog immediate advancement for terminal Codex API failures.
- Made Codex Cloud delivery truthfulness explicit: only a real new PR-head commit is delivery; View task / ready diff / Created commit text is not delivery.
- Migrated remaining workflow uses of `actions/github-script@v7` to `actions/github-script@v8`.
- Reconciled `handoffs/CONTEXT.md`, `LOOP_STATE.md`, and `handoffs/loop-build.md` with the implemented architecture.

Intentionally not changed:

- No downstream repositories were modified.
- No browser automation, Playwright, session cookies, UI-click automation, or Cloud Update-branch automation was added.
- No force push was used.
- The direct-to-main convention was preserved.
- The only escalation label remains `needs-owner`.
- `claude-proxy` remains enabled because the Claude PR-comment path was verified and implemented as direct original-head delivery for same-repo PRs.
- Codex Cloud remains unable to apply View task -> Update branch automatically from this automation; that step remains manual when Cloud does not push.
- The three per-repo Actions variables remain intentionally unsynced: `CLAUDE_ENABLED`, `CODEX_BACKUP_ENABLED`, `CODEX_CLOUD_ENABLED`.

## 3. Part A determination

Inspection of `anthropics/claude-code-action@v1`:

- The action is a composite action and does not perform an implicit `actions/checkout` for the workflow caller.
- The action runs from the GitHub Actions workspace. Its security docs describe the checked-out PR head in `$GITHUB_WORKSPACE` as the code the action/Claude operates on and warn against checking out untrusted fork refs with writable credentials.
- Source inspection showed branch handling and MCP context use the current workspace/branch information (`CLAUDE_BRANCH`, `GITHUB_HEAD_REF`, `GITHUB_REF_NAME`, or default branch). Therefore an explicitly checked-out, same-repo PR head branch is the right architecture for direct delivery.

Implemented result:

- Existing PR comment path now resolves the PR through the API first.
- Same-repo PR comments set `same_repo_pr=true`, expose `head_ref`, `head_sha`, `head_repo`, and `base_ref`, checkout `head_sha`, attach a local branch named exactly `head_ref`, set upstream to `origin/head_ref` if available, and run Claude with `CLAUDE_BRANCH=head_ref`.
- Existing PR prompt now says the task is fixing an existing pull request, must work only on the existing head branch, must commit/push directly to that branch, must not create a branch, must not open a PR, and must not merge.
- Issue path remains the new-branch/new-PR path. It still instructs Claude to create a new branch, apply the fix, open a PR, use `Fixes #<issue number>`, and not merge.
- Fork-headed PR comments are skipped before checkout and before Claude. The skip uses `github.token`, adds/uses `needs-owner` where possible, posts `agent=claude state=fixer_error`, and logs that no writable credentials were exposed.
- `claude-proxy` remains enabled and now benefits from the same direct existing-head PR path. Its message includes: “Codex Cloud prepared a diff, but it did not reach the PR branch. Implement EXACTLY the changes described below on this PR's existing head branch and push. Do NOT create a new branch. Do NOT open a new PR.”

Relevant implemented lines:

```yaml
# workflows/claude.yml
if: |
  vars.CLAUDE_ENABLED != 'false' && (
    (github.event_name == 'issue_comment' &&
     github.event.comment.user.login == github.repository_owner &&
     contains(github.event.comment.body, '@claude')) ||
    (github.event_name == 'pull_request_review_comment' &&
     github.event.comment.user.login == github.repository_owner &&
     contains(github.event.comment.body, '@claude')) ||
```

```js
const sameRepo =
  !!(pr.head && pr.head.repo && pr.head.repo.full_name === `${owner}/${repo}`);
core.setOutput('same_repo_pr', sameRepo ? 'true' : 'false');
core.setOutput('head_ref', pr.head.ref || '');
core.setOutput('head_sha', pr.head.sha || '');
```

```yaml
- name: Checkout existing PR head branch
  if: steps.keycheck.outputs.has_key == 'true' && steps.pr_context.outputs.same_repo_pr == 'true'
  uses: actions/checkout@v5
  with:
    ref: ${{ steps.pr_context.outputs.head_sha }}
    token: ${{ secrets.AUTOMATION_PAT || github.token }}
    fetch-depth: 0

- name: Attach checkout to original PR head branch
  run: |
    git checkout -B "${HEAD_REF}" "${HEAD_SHA}"
    git branch --set-upstream-to="origin/${HEAD_REF}" "${HEAD_REF}" 2>/dev/null || true
```

## 4. Fixer ladder after fix #27

Architecture:

`Codex auto-review -> Claude -> Codex API when CODEX_BACKUP_ENABLED=true -> Codex Cloud when CODEX_CLOUD_ENABLED is not false -> optional Claude proxy only if verified capable of direct original-head delivery -> needs-owner -> Codex Gate -> Merge Bot`

Stages and switches:

- Codex auto-review: external review signal; gate and bridge consume only trusted Codex identity allowlist values.
- Claude: enabled unless `CLAUDE_ENABLED == 'false'`. Comment-triggered runs require `github.event.comment.user.login == github.repository_owner`. Issue/label/assignment triggers are unchanged.
- Codex API backup: enabled only when `CODEX_BACKUP_ENABLED == 'true'`. Dispatch failures before the agent starts are `agent=watchdog state=dispatch_failed`, non-attempt-consuming, retryable, and not a completed Codex attempt.
- Codex Cloud: enabled unless `CODEX_CLOUD_ENABLED == 'false'`. When disabled, the watchdog logs a clear line, posts no `@codex fix`, does not claim a Cloud attempt, and escalates through the terminal path.
- Claude proxy: only after Cloud has a terminal ready-diff summary or Cloud window elapses, only on same-repo PRs, only if Claude failure was genuine `no_delivery`, only if Claude is enabled, and only once per head.
- needs-owner: the terminal human escalation when no enabled legitimate delivery mechanism has delivered a real branch commit.
- Codex Gate: blocks until Codex has reviewed the current head and no active P1/P2 remains.
- Merge Bot: merges only after the gate is green and no escalation hard stop exists.

Immediate advance:

- Claude `billing_error` / `fixer_error` are treated as dead-fixer classes and the watchdog advances without waiting a full stage timeout.
- Codex API `api_error`, `fixer_error`, `no_change`, and `patch_failed` are terminal non-delivery states and skip the remaining API wait in the same watchdog pass.
- Codex Cloud terminal View task summary is not delivery; if no real branch commit lands, the watchdog may move to proxy or escalation without calling it success.

Waits for timeout:

- A requested stage with no real PR-head commit and no terminal marker waits up to `TIMEOUT_MS` (20 minutes in the watchdog, subject to schedule lag).
- Codex API `stale` does not advance to Cloud on that cycle because the PR head changed and the new head must begin a fresh review/fixer cycle.

Escalates:

- Fork-headed PRs for Claude, Codex API, and Cloud are not run with writable/agent credentials and escalate to `needs-owner`.
- Cloud disabled after earlier stages fail escalates without posting `@codex fix`.
- Cloud ready diff without branch delivery eventually escalates with manual Update branch instructions if proxy is unavailable or also fails.

## 5. Terminal states and delivery

Delivery definition: a fix is delivered only when a commit actually reaches the relevant PR head branch. A workflow success, task diff, View task, Created commit text, or ready Cloud diff is not delivery.

Emitted states:

- Claude: `requested` from bridge comments; `no_delivery`, `billing_error`, `fixer_error` from `claude.yml`; fork skip also emits `fixer_error`.
- Codex API: `requested`, `pushed`, `no_change`, `patch_failed`, `stale`, `api_error`, `fixer_error`.
- Codex Cloud: `requested`; success is detected only by a real new commit on the PR head after the request marker, not by a Cloud-side comment.
- Claude proxy: `requested`; success is detected only by a real new commit on the PR head after the proxy marker.
- Watchdog: `dispatch_failed`, `claude_dead`, `escalated`.

Delivery states:

- `agent=codex state=pushed` is delivery only because it is emitted after the apply step actually pushed.
- Claude, Codex Cloud, and Claude proxy delivery are judged by `deliveredSince(markerTime)`: a real commit on the current PR head after the marker.

Terminal but non-delivery states:

- `billing_error`, `api_error`, `fixer_error`, `no_change`, `patch_failed`, `no_delivery`, `stale`, `dispatch_failed`, `escalated`, `claude_dead`.
- `stale` is terminal for the old head only and deliberately does not advance to Cloud on that stale cycle.
- `dispatch_failed` is retryable and pre-start, so it does not consume an attempt.

Attempt accounting:

- Attempts come only from valid `ai-loop:v1` attempt markers for actual ladder stages.
- Reviews, comments, watchdog ticks, technical retries, and pre-start dispatch failures do not count.
- Codex API dispatch failure before the agent starts is `dispatch_failed`, has no `attempt=`, and is retried.
- Codex API agent started then failed may consume the Codex API stage for that head but is never delivery.
- A ready Codex Cloud diff without branch delivery may consume the one Cloud stage for that head because Cloud was asked to fix that head, but it is never success.
- `pushed` remains emitted only after actual successful branch push:

```yaml
if: needs.generate-patch.outputs.proceed == 'true' && steps.resolve.outputs.stale == 'false' && steps.apply.outputs.pushed == 'true'
body: `<!-- ai-loop:v1 root_pr=${prNumber} head=${newSha} attempt=${attempt} agent=codex state=pushed -->...`
```

## 6. Codex identity trust model

Allowlist in both `codex-gate.yml` and `claude-fallback-watchdog.yml`:

```js
// Strict Codex actor allowlist — must match claude-fallback-watchdog.yml — keep in sync.
const TRUSTED_CODEX_LOGINS = new Set(['chatgpt-codex-connector[bot]']);
const isCodex = (user) => !!user?.login && TRUSTED_CODEX_LOGINS.has(user.login);
```

```js
// Strict Codex actor allowlist — must match codex-gate.yml — keep in sync.
const TRUSTED_CODEX_LOGINS = new Set(['chatgpt-codex-connector[bot]']);
const isCodex = (user) => !!user?.login && TRUSTED_CODEX_LOGINS.has(user.login);
```

Evidence for `chatgpt-codex-connector[bot]`:

- GitHub API issue comment evidence: `issue_comment id=4643232219 issue_url=https://api.github.com/repos/funzi7/automation-core/issues/6 created_at=2026-06-07T16:19:40Z login=chatgpt-codex-connector[bot]`.
- GitHub API issue comment evidence: `issue_comment id=4721642333 issue_url=https://api.github.com/repos/funzi7/automation-core/issues/17 created_at=2026-06-16T17:49:10Z login=chatgpt-codex-connector[bot]`.
- GitHub API review comment evidence: `review_comment id=3225478234 pull=https://api.github.com/repos/funzi7/automation-core/pulls/3 created_at=2026-05-12T10:03:51Z login=chatgpt-codex-connector[bot]`.
- GitHub API review comment evidence: `review_comment id=3482318427 pull=https://api.github.com/repos/funzi7/automation-core/pulls/33 created_at=2026-06-26T15:14:58Z login=chatgpt-codex-connector[bot]`.

No other aliases were added. Specifically not added: `codex`, `codex[bot]`, or substring/regex aliases. Validation grep found no `includes('codex')`, `/codex/i`, or `toLowerCase().includes('codex')` in workflows.

## 7. Cloud limitation

Codex Cloud success now means exactly this: a real new commit lands on the actual PR head branch and that commit is newer than the Cloud request marker.

The following are not branch delivery and are never successful repair by themselves:

- View task
- Created commit text in a Cloud-side summary
- A task diff
- Any Cloud-side commit hint

Owner-facing output when Cloud has a ready diff but no branch delivery says:

`Codex Cloud prepared a diff, but it did not reach the PR branch. Open View task → Update branch to apply it manually.`

No browser automation, Playwright, session cookies, UI-click automation, or false API claim for Codex Cloud Update branch was added.

## 8. Security

Commenter guard:

- `issue_comment` and `pull_request_review_comment` Claude runs now require `github.event.comment.user.login == github.repository_owner`.
- This prevents arbitrary public `@claude` comments from consuming paid fixer capacity.
- It does not affect `claude-fix` issue triggers, label triggers, assigned issue triggers, or internal owner-authored loop comments posted through `AUTOMATION_PAT`.

Same-repo/fork protections:

- Claude PR-comment path resolves the PR first and requires `pr.head.repo.full_name === owner/repo` before writable checkout or Claude run.
- Fork-headed Claude PR comments skip before checkout/Claude and emit `agent=claude state=fixer_error` plus `needs-owner` escalation where possible.
- Codex API generate job has a read-only fork guard before checkout and before the OpenAI step. The write-capable job performs fork escalation without checking out fork code.
- Codex Cloud is never pinged on fork-headed PRs.

Codex API secret-scope verification:

```yaml
# generate-patch job
permissions:
  contents: read
  pull-requests: read
```

```yaml
- name: Checkout PR head (read-only, no persisted creds)
  uses: actions/checkout@v5
  with:
    ref: ${{ inputs.head_sha }}
    persist-credentials: false
```

```yaml
- name: Run Codex to fix the finding (CI agent, not Cloud)
  id: codex_agent
  uses: openai/codex-action@v1
  with:
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    sandbox: workspace-write
    safety-strategy: drop-sudo
```

```yaml
- name: Record Codex agent failure
  id: codex_agent_failure
  if: failure() && steps.codex_agent.outcome == 'failure'
```

```yaml
# apply-and-push job
permissions:
  contents: write
  pull-requests: write
  issues: write
```

`rg` verification in `workflows/codex-backup-fix.yml` showed `OPENAI_API_KEY` only in the generate-patch comments/input and no `OPENAI_API_KEY` in the apply-and-push job. `AUTOMATION_PAT` appears only in the write-capable apply-and-push job and checkout there, not in the `openai/codex-action@v1` agent step.

No force push was used.

## 9. Validation

YAML parse:

```text
YAML OK 19
```

Actionlint:

```text
npm_config_cache=.npm-cache npm exec --yes github-actionlint -- workflows/*.yml .github/workflows/*.yml
exit 0, no output
```

Embedded `github-script` syntax check:

```text
node --check OK 51 github-script bodies
```

Mirror byte-identity check with `git hash-object`:

```text
ci-doctor.yml 1c9990805a67de889feefdea21981bb43ddec153 OK
claude-fallback-watchdog.yml 2d70abb0c5f1136758db2ceb3f09ab7f72d6e210 OK
claude.yml 46707628cfa0997d6cb9dd1f57656fe9e678ed29 OK
codex-auto-fix.yml 87e3eed1ab94002e07755df97db3a1b55b6fdea5 OK
codex-backup-fix.yml 28ceab4df90739a30bd49bb1256a7cd0bd6cf18c OK
codex-gate.yml 347c05457069fc5f7873c8b5a9c8d821b215afb1 OK
merge-bot.yml d95040107172e6639ba5743be137f7a8a8dabd37 OK
telegram-morning-report.yml 37df858ecda94c14df094117cba864d1563e86c6 OK
```

Forbidden-pattern grep:

```text
rg -n "actions/github-script@v7|require\('@actions/github'\)|includes\('codex'\)|/codex/i|toLowerCase\(\)\.includes\('codex'\)" workflows .github/workflows
exit 1, no matches
```

Positive grep confirmations:

- `CODEX_CLOUD_ENABLED` wired in `workflows/claude-fallback-watchdog.yml` and mirror.
- Commenter guard present in `workflows/claude.yml` and mirror.
- Same-repo PR guard present in `workflows/claude.yml`, `workflows/claude-fallback-watchdog.yml`, `workflows/codex-backup-fix.yml`, `workflows/codex-gate.yml`, and mirrors.
- Codex API failure marker present: `id: codex_agent` and `if: failure() && steps.codex_agent.outcome == 'failure'` in source and mirror.
- `agent=codex state=api_error` present in source and mirror.
- `agent=codex state=stale` present in source and mirror.
- `agent=codex state=pushed` present only in the pushed-marker path gated by `steps.apply.outputs.pushed == 'true'`.

Whitespace/conflict check:

```text
git diff --check
exit 0, no output
```

## 10. Files updated

Automation-core files updated in commit `93f6acb9d2e0396afad3e10854503024843c32de`:

- `.github/workflows/bootstrap.yml`
- `.github/workflows/ci-doctor.yml`
- `.github/workflows/claude-fallback-watchdog.yml`
- `.github/workflows/claude.yml`
- `.github/workflows/codex-auto-fix.yml`
- `.github/workflows/codex-backup-fix.yml`
- `.github/workflows/codex-gate.yml`
- `.github/workflows/telegram-morning-report.yml`
- `workflows/ci-doctor.yml`
- `workflows/claude-fallback-watchdog.yml`
- `workflows/claude.yml`
- `workflows/codex-auto-fix.yml`
- `workflows/codex-backup-fix.yml`
- `workflows/codex-gate.yml`
- `workflows/telegram-morning-report.yml`
- `LOOP_STATE.md`
- `handoffs/CONTEXT.md`
- `handoffs/loop-build.md`

Agent-memory file updated after the automation-core commit:

- `automation-core/cc-latest.md`

## 11. Files intentionally not changed

Complete relevant not-changed list for fix #27 scope:

- No downstream repository files.
- No files outside `/root/work/automation-core` except `/root/work/agent-memory/automation-core/cc-latest.md`.
- `workflows/merge-bot.yml`
- `.github/workflows/merge-bot.yml`
- `.github/workflows/minutes-guard.yml`
- `.github/workflows/sync-automation-core.yml`
- `sync-config.json`
- `README.md`
- `template/`
- No additional agent-memory files outside `automation-core/cc-latest.md`.

## 12. Open limitations / next verification

- A real same-repo PR comment test should be run once Claude budget/API availability permits, to verify the hosted Claude agent follows the direct existing-head prompt and pushes to the original branch in practice.
- The direct PR-head design is based on action docs/source inspection plus explicit checkout/branch setup; no live Claude run was performed during this fix.
- Codex Cloud View task -> Update branch remains manual when Cloud did not push to the PR branch.
- Downstream repositories must set per-repo Actions variables manually as desired because workflow sync does not sync variables:
  - `CLAUDE_ENABLED`: default enabled; literal `false` disables Claude.
  - `CODEX_BACKUP_ENABLED`: default disabled; only literal `true` enables Codex API backup.
  - `CODEX_CLOUD_ENABLED`: default enabled; literal `false` disables Codex Cloud.
- Downstream repos still need their own secrets and permissions (`AUTOMATION_PAT`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` where relevant) for enabled stages.
