# automation-core handoff — 2026-08-12 UTC

## Outcome

The central source reconciliation and initial hands-off proof succeeded, but the final protected-path provenance correction is blocked on external Codex review capacity. PR #38 must remain unmerged until exact-head review/gate proof exists.

## Merged foundation

- GitHub main: `c6708e2d9c58179e451d3a7cb5be0baa4f283767`.
- Earlier bootstrap PR #36 merged as `f1d0f1bf126375af86c815957a74c7bba4e56cd4` after exact-head green review/check proof.
- Source drift was reconciled from paywall-bot’s reviewed Codex Gate/watchdog behavior into central source while retaining central-only correct behavior.
- On main, all seven workflows in `sync-config.json` are byte-identical between `workflows/` and `.github/workflows/`.
- Post-merge Automation Core CI run `31555201613` passed on exact main `c6708e2d9c58179e451d3a7cb5be0baa4f283767`.

## Live auto-merge proof: PR #37

- PR: <https://github.com/funzi7/automation-core/pull/37>
- Exact reviewed head: `b912f6e6ea5b6721589c8d87edb23fafe2977080`.
- Squash merge commit: `c6708e2d9c58179e451d3a7cb5be0baa4f283767`.
- Merge Bot run: <https://github.com/funzi7/automation-core/actions/runs/31555184597>.
- The run logged that protected paths on a trusted same-repo owner PR still required exact-head gates, cleared transient `needs-owner` + `needs-owner-auto`, continued in the same evaluation, SHA-pinned squash-merged, and deleted `fix/current-head-epoch`.
- This proves ordinary same-repo owner candidacy plus transient automated escalation clearing. Deterministic tests separately cover `no-automerge`, human/manual `needs-owner`, forks, failed/running/missing gates, SHA movement, and trusted sync.

## Open corrective PR #38

- PR: <https://github.com/funzi7/automation-core/pull/38>
- Branch: `fix/protected-owner-provenance`.
- Exact pushed head: `5933fa16cc48ad6e2bd2d68fcf6aac2c916f089c`.
- State: OPEN, non-draft, mergeable.
- Labels: `needs-owner`, `needs-owner-auto` (correctly retained while the review/gate is incomplete).
- Exact-head Automation Core CI run `31558633148` passed.
- All current review threads are resolved.
- Local full validation at this head passed 64/64 deterministic tests, parsed all changed YAML, parsed 14 changed inline github-script blocks, verified source/mirror byte parity, and passed `git diff --check`; actionlint was unavailable.
- The external Codex connector posted a usage-limit message instead of reviewing `5933fa16cc48ad6e2bd2d68fcf6aac2c916f089c`. This is not exact-head review proof. No authoritative exact-head gate was dispatched/accepted, and the PR was not merged.

## Final PR #38 design awaiting review

- Normal open, non-draft same-repo `funzi7` PRs remain auto-merge candidates across ordinary `fix/*`, `feat/*`, and `chore/*` branches.
- `no-automerge` remains a permanent human stop; manual/unknown `needs-owner` remains hard; proven automated `needs-owner` + `needs-owner-auto` clears only after exact-head fully green validation.
- Protected ordinary owner PRs may merge only after unchanged exact-head CI/Codex/review/thread/mergeability checks.
- Issue-mode Claude receives only `github.token`, not `AUTOMATION_PAT`; the action controls a `claude/*` branch and Claude lacks broad branch/PR creation commands.
- A trusted post-step alone receives `AUTOMATION_PAT`, creates the PR from the action’s exact `branch_name`, and the default Actions identity attaches durable `claude-generated` provenance. The `claude/*` head is immediate protected-path provenance at PR creation.
- Trusted automation-core sync now requires same repo, exact title, exact `chore/sync-automation-core` branch, and exact owner author. Proven Claude provenance wins over sync shape.
- Fork/untrusted/ambiguous/Claude-generated protected PRs remain fail-closed.

## Safe resume sequence

1. Restore/renew Codex code-review capacity.
2. Request `@codex review` on PR #38. Require the result to name the exact then-current head, inspect every new P1/P2, and fix all real findings.
3. When exact-head Automation Core CI is green, zero active P1/P2 remain, the PR is mergeable, and a trusted current-head review exists, dispatch the default-branch Gate if needed: `gh workflow run .github/workflows/codex-gate.yml --repo funzi7/automation-core -f pr_number=38`.
4. Require exact-head `check-codex-status` success and let Merge Bot clear the transient label pair and auto-merge. Do not use an override merely to bypass missing review.
5. Verify post-merge main CI and all seven source/mirror pairs.
6. Trigger the normal paywall-bot sync, update fresh PR #94, resolve its provenance P1 only after the fix lands, and complete exact-head downstream review/gate/merge verification.

## Local state

- `/root/work/automation-core` is clean on `fix/protected-owner-provenance` at `5933fa16cc48ad6e2bd2d68fcf6aac2c916f089c`, tracking its remote branch.
