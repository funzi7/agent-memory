diagnostic: agent-memory sync cron failing (READ-ONLY)

_2026-07-04. READ-ONLY on funzi7/agent-memory: no workflow/PR/file change — only this cc-latest.md
publish. `gh` unavailable → REST/curl + GitHub MCP. Owner referenced only by login `funzi7`._

## 1. last 8 runs of sync-automation-core.yml
```
28697512725  2026-07-04T06:19:57Z  schedule  failure
28642996822  2026-07-03T06:32:39Z  schedule  failure
28570768676  2026-07-02T06:40:59Z  schedule  failure
28500218150  2026-07-01T07:11:53Z  schedule  failure
28426174160  2026-06-30T06:56:05Z  schedule  failure
28357990304  2026-06-29T08:12:10Z  schedule  failure
28314554237  2026-06-28T07:02:20Z  schedule  failure
28281224158  2026-06-27T06:29:28Z  schedule  failure
```

## 2. latest FAILED run — jobs, steps, failing log tail (run 28697512725)
```
JOB sync: failure
  step 1 Set up job: success
  step 2 Checkout this repo: success
  step 3 Check opt-out: success
  step 4 Clone automation-core: success
  step 5 Sync workflows: success
  step 6 Create PR if changes: FAILURE   <== the failing step
  step 12 Post Checkout this repo: success
  step 13 Complete job: success
```
Failing-step log tail (verbatim, job 85109669738, step "Create PR if changes"):
```
Created branch 'chore/sync-automation-core'
##[group]Pushing pull request branch to 'origin/chore/sync-automation-core'
[command]/usr/bin/git push --force-with-lease origin chore/sync-automation-core:refs/heads/chore/sync-automation-core
To https://github.com/funzi7/agent-memory
 ! [remote rejected] chore/sync-automation-core -> chore/sync-automation-core (refusing to allow a GitHub App to create or update workflow `.github/workflows/ci-doctor.yml` without `workflows` permission)
error: failed to push some refs to 'https://github.com/funzi7/agent-memory'
##[error]The process '/usr/bin/git' failed with exit code 1
```
(peter-evans/create-pull-request@v6 pushes the sync branch; the push is REJECTED because the token
used cannot write `.github/workflows/*`.)

## 3. how long has it been failing?
```
40-run window returned 10 runs, ALL failure; ZERO successes. Oldest in window 2026-06-25T06:48:12Z.
tail: 06-25 fail, 06-26 fail, 06-27 fail, 06-28 fail, 06-29 fail, 06-30 fail, 07-01 fail, 07-02 fail,
      07-03 fail, 07-04 fail.
=> the sync has NEVER succeeded in the observable window — it fails on every daily schedule tick.
```

## 4. repo context
```
--- workflows present in agent-memory ---
  sync-automation-core.yml        (ONLY this — the loop workflows never landed, because the push fails)
--- .automation-core-ignore at root? ---
  (absent — "Not Found")
--- open PRs ---
  (none — the push fails before a PR is ever created)
--- sync workflow key params (.github/workflows/sync-automation-core.yml @ main) ---
  L8  permissions:
  L19 - name: Check opt-out
  L22   if [ -f ".automation-core-ignore" ]; then      # documented opt-out gate
  L40 CONFIG=/tmp/automation-core/sync-config.json
  L41 SYNCED=$(jq -r '.synced_workflows[]' "$CONFIG")   # copies the loop workflows in
  L77 uses: peter-evans/create-pull-request@v6
  L79   token: ${{ secrets.GITHUB_TOKEN }}              # <== root cause: default token can't push workflows
  L80   branch: chore/sync-automation-core
  L88   To opt this repo out of future syncs, create `.automation-core-ignore` in the repo root.
```

---

# VERDICT

**(a) Exact failure + since when.** Step 6 "Create PR if changes" fails on the push:
`! [remote rejected] … refusing to allow a GitHub App to create or update workflow
.github/workflows/ci-doctor.yml without workflows permission` → `error: failed to push some refs` →
`##[error]The process '/usr/bin/git' failed with exit code 1`. The `peter-evans/create-pull-request@v6`
step is configured with **`token: ${{ secrets.GITHUB_TOKEN }}`** (line 79); the default `GITHUB_TOKEN`
is a GitHub-App token and GitHub **refuses** to let it create/update files under `.github/workflows/`
(that requires the `workflows` permission, which a fine-grained PAT — the downstream repos'
`AUTOMATION_PAT` — carries, but the default token does not). Since the sync's whole payload is workflow
files, every push is rejected. **Failing on every daily run in the entire observable window (≥ 2026-06-25,
10/10 runs) — it has effectively never succeeded here.**

**(b) Does agent-memory belong in the loop-sync?** **No.** agent-memory is a **plain public state/memory
repo** (it stores `cc-latest.md`, `state.md`, `gotchas.md`, roadmaps — no product code). The loop
workflows (ci-doctor, codex-gate, merge-bot, claude.yml, watchdog, codex-*) exist to CI-doctor / gate /
auto-fix / merge **product** PRs — there is nothing here for them to act on, so installing them only adds
Actions noise, minutes, and (right now) a daily red run. Two ways to stop the bleed:
- **FIX** (keep it in the loop): change line 79 to `token: ${{ secrets.AUTOMATION_PAT }}` (the PAT has
  the `workflows` scope, exactly how the downstream product repos' sync succeeds). This makes the push
  succeed — but it then **installs the full loop into a state repo**, which is the wrong outcome.
- **OPT-OUT** (recommended): commit an **empty `.automation-core-ignore` at the repo root** — the sync's
  own documented opt-out (checked at line 22, advertised at line 88). Step 3 "Check opt-out" then
  short-circuits the job before it ever copies workflows or pushes, so the daily failure disappears and
  no loop Actions are installed. This matches what OptionsProfitTracker / thai-rent-finder effectively
  chose (they disabled their sync workflow).

**(c) Next step (one line):** commit an empty `.automation-core-ignore` at the root of funzi7/agent-memory
to opt this state repo out of the loop sync — stops the daily failing run with zero downside.
