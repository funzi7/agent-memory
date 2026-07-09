# automation-core — codex-backup-fix agent-failure path fix handoff

Date: 2026-07-09. Self-contained handoff for the upstream fix to the Codex backup workflow.

## Commit
- New automation-core commit: full `06118053e21e0afe3c5f75a930dadcaecc0ee706`; 7-character `0611805`.
- Commit message: `fix: gate codex backup apply path on agent success`.
- Published directly to automation-core `main` as a fast-forward update; no force push.

## Triggering Downstream Evidence
- Downstream repo: `funzi7/paywall-bot`.
- Downstream PR: #73.
- Codex finding: P2 `Skip patch download after agent failure`.
- Finding file in downstream PR: `.github/workflows/codex-backup-fix.yml`.
- The downstream PR was read for evidence only. It was not modified directly.

## Root Cause
`apply-and-push` intentionally had a broad job-level condition so it could run marker-only terminal paths after fork skips or Codex agent failures. However, the normal patch apply steps were guarded only by `needs.generate-patch.outputs.proceed == 'true'`.

When `openai/codex-action` failed after the same-repo guard, `proceed` remained `true` and `codex_agent_failed` was also `true`. That let the normal path run after the intended `api_error` marker path, including PR-head resolve, checkout, `codex-patch` artifact download, apply/push, and potentially a misleading secondary `patch_failed` marker caused only by the missing patch artifact.

## Exact Fix
- Added `patch_ready` as a `generate-patch` job output from a new `Mark patch artifact ready` step that only runs after the Codex agent succeeds and `codex.patch` exists.
- Kept the `apply-and-push` job-level condition broad enough for marker-only terminal paths and the normal patch path.
- Added a first step in `apply-and-push`, `Classify apply-and-push path`, which sets `normal_patch_path=true` only when:
  - `proceed == 'true'`;
  - `fork_pr != 'true'`;
  - `codex_agent_failed != 'true'`;
  - `patch_ready == 'true'`.
- Gated all normal patch steps on `steps.path.outputs.normal_patch_path == 'true'`:
  - Resolve PR head ref + stale-head guard;
  - checkout PR head branch;
  - download `codex-patch`;
  - apply patch and push;
  - post pushed marker;
  - post no-change marker;
  - post patch-failed marker;
  - stale-head note.
- After `codex_agent_failed == 'true'`, only the intended Codex `api_error` marker path runs. It does not download or apply a patch and cannot emit `no_change` or `patch_failed` from a missing artifact.
- Clarified the workflow comments that disabled Codex API backup is skipped by the watchdog ladder, not immediate escalation.

## Files Changed In automation-core
- `workflows/codex-backup-fix.yml`
- `.github/workflows/codex-backup-fix.yml`
- `LOOP_STATE.md`
- `handoffs/loop-build.md`

## Files Intentionally Not Changed
- `funzi7/paywall-bot` and every downstream repository.
- Any workflow other than the mirrored `codex-backup-fix.yml` copies.
- `.github/workflows/` files other than `.github/workflows/codex-backup-fix.yml`.
- `sync-config.json`.
- `handoffs/CONTEXT.md`.
- Secrets, Actions variables, permissions, and downstream settings.

## Validation Run And Results
- Initial local `/root/work/automation-core` `git status --short`: clean.
- `git pull --ff-only`: blocked by sandbox error `bwrap: fchdir to oldroot: No such file or directory`.
- Local write test in `/tmp`: blocked by the same `bwrap` error, so the fix was published through GitHub git API tree/commit/ref operations.
- Remote compare `11ba6a6bf13c91b1be61d4292b853dd15c37063b...06118053e21e0afe3c5f75a930dadcaecc0ee706`: one fast-forward commit, exactly four automation-core files changed.
- `git diff --check`: exited clean on the local worktree.
- Remote trailing-whitespace check via `gh api --jq` over all four changed files: no trailing whitespace output.
- Mirror identity: both workflow copies have identical Git blob SHA `174dc5a5b2182e7a59bd6dfb22992c2056a5a612`.
- GitHub workflow metadata check: `codex-backup-fix.yml` reports `active .github/workflows/codex-backup-fix.yml`.
- YAML parse attempt: blocked by the sandbox for available local interpreters/parsers (`ruby`, `node`, `python3`, `perl`, `awk`) with `bwrap: fchdir to oldroot: No such file or directory`; no package installation was attempted.
- `actionlint` availability/run attempt: blocked by the same sandbox wrapper error; no package installation was attempted.
- Remote grep/readback via `gh api --jq` confirmed:
  - `codex_agent_failed` is checked in the `normal_patch_path` classifier;
  - the agent-failure marker step is separate;
  - `Resolve PR head ref + stale-head guard`, checkout, `Download patch artifact`, `Apply patch and push`, `pushed`, `no_change`, `patch_failed`, and stale-note steps all use `steps.path.outputs.normal_patch_path == 'true'`;
  - no normal apply step after the classifier is guarded only by `needs.generate-patch.outputs.proceed == 'true'`.
- Final local `git status --short` was clean in both `/root/work/automation-core` and `/root/work/agent-memory`.

## Sync Impact
- paywall-bot was not modified directly.
- paywall-bot PR #73 must be updated/refreshed by the normal sync from automation-core.
- Do not merge PR #73 until the refreshed sync includes commit `0611805` and Codex Gate is green.
- No downstream sync was run in this task.

## Remaining TODO
1. Refresh/sync paywall-bot PR #73 from automation-core.
2. Re-check PR #73 after the refreshed sync lands.
3. Return to PR #72 only after sync workflows are current.

## Guardrails Observed
- No downstream repository changed.
- No force push.
- No browser automation, Playwright, session-cookie automation, UI automation, or fake Codex Cloud Update-branch implementation.
- Public-repo wording does not include the owner’s personal name.
- The only escalation label referenced is `needs-owner`.
