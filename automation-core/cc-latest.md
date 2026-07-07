# automation-core — final post-fix #27 documentation normalization handoff

Date: 2026-07-07. This is self-contained for a future ChatGPT/Codex session.

## Commits
- New documentation-normalization automation-core commit: full `1b205d1137d2126bb8bbd78b8f7b625cec3a4da1`; 7-character `1b205d1`.
- Fix #27 implementation commit: full `93f6acb9d2e0396afad3e10854503024843c32de`; 7-character `93f6acb`.
- Previous documentation reconciliation commit: full `ff57a73220faa5dbb563edc7b035fc6cc653c509`; 7-character `ff57a73`.
- Same final-normalization session also published doc-only updates to `LOOP_STATE.md` and `handoffs/CONTEXT.md` before the final handoff-log commit: `421d37fd473dc46e3fb9bdcf05b8e1f04e671e49` and `051ec7af9c9319f15897d0c344447544132ad712`.

## Current Architecture
Delivery-judged fixer ladder:

```text
Codex auto-review
-> Claude
-> Codex API only when CODEX_BACKUP_ENABLED == 'true'
-> Codex Cloud unless CODEX_CLOUD_ENABLED == 'false'
-> Claude proxy only after genuine Claude no_delivery and only if it can deliver to the original PR head
-> needs-owner
-> Codex Gate
-> Merge Bot
```

The direct-to-main convention is preserved for automation-core maintenance commits. The only escalation label is `needs-owner`.

## Delivery Definition
Delivery means a real commit reaches the actual relevant PR head branch after that stage's request marker.

Not delivery: workflow success alone, View task, task diff, Created commit wording, Cloud-side commit hint, ready diff without a branch push, or a secondary PR.

## Verification Split
Code-verified:
- `CLAUDE_ENABLED != 'false'` is default ON.
- Public-repo Claude comment triggers require an owner-authored comment.
- Fork PRs are not run with writable credentials or secrets.
- `CODEX_BACKUP_ENABLED === 'true'` is required for Codex API backup; disabled backup is skipped, not escalated.
- `CODEX_CLOUD_ENABLED !== 'false'` is default ON.
- Trusted Codex identity is exactly `chatgpt-codex-connector[bot]`.
- Bridge/gate severity supports P1 + P2 for actionable findings.

Runtime-verified:
- No new runtime delivery verification was completed in this final documentation-normalization task.

Runtime-unverified:
- Claude PR-head delivery from fix #27 is implemented but not proven in a successful post-fix live Claude run.
- Claude proxy is implemented but not proven in live runtime.
- Codex API backup is not proven in live runtime while API quota is unavailable.

Unknown / not checked:
- Current downstream secrets, variables, permissions, and Actions runtime health.
- Whether downstream repos have the newest synced workflow contents beyond the known merged sync PR facts below.

## Current Stage State
Claude:
- Default ON unless `CLAUDE_ENABLED == 'false'`.
- Same-repo PR comments resolve the PR head and are intended to commit directly to the original head branch.
- Public comment triggers must be owner-authored.
- Fork heads are guarded from writable credential/secrets execution.
- Current runtime state: blocked/unverified because recent Claude runs return Anthropic `billing_error`.

Codex API backup:
- Default OFF.
- Enabled only by literal `CODEX_BACKUP_ENABLED == 'true'`.
- Disabled means SKIPPED, not immediate escalation.
- Stale does not advance the old cycle to Cloud.
- Current runtime state: blocked/unverified while OpenAI API quota is unavailable.

Codex Cloud:
- Default ON unless `CODEX_CLOUD_ENABLED == 'false'`.
- A Cloud View task or ready diff is not delivery without an actual commit on the relevant branch.
- There is no supported automatic Update branch action when Cloud leaves only a View task/diff.
- No browser automation, session-cookie automation, UI automation, fake API workaround, or fake Update-branch implementation exists or was added.
- A ready diff without branch push may consume the Cloud stage for that head.

Claude proxy:
- Implemented after genuine Claude `no_delivery` only when it can deliver to the original PR head.
- Runtime-unverified because Claude budget is unavailable.
- Do not describe it as verified.

Codex Gate:
- Code-verified as delivery-judged and strict about the trusted Codex bot identity.
- Current bridge/gate severity supports P1 + P2.
- Current live health was not checked in this task.

Merge Bot:
- Runs after the gate according to the ladder.
- Current live health was not checked in this task.

## Codex Cloud Limitation
Cloud-side task state is not enough. If Codex Cloud leaves only a View task, task diff, or ready diff, the automation has no supported non-UI Update branch action to convert that into delivery. Success requires a real commit on the relevant PR head branch after the Cloud request marker.

## Downstream Facts
Verified current known facts:
- OptionsProfitTracker PR #12 is merged.
- thai-rent-finder PR #80 is merged.

Unverified in this task:
- Downstream secrets.
- Downstream Actions variables.
- Downstream permissions settings.
- Downstream runtime health.
- Whether any downstream repository is fully synced to the latest automation-core workflow contents.

## Prioritized TODO
A. Documentation/state work completed:
- `LOOP_STATE.md`, `handoffs/CONTEXT.md`, and `handoffs/loop-build.md` were normalized for post-fix #27 current architecture.
- Stale current-tense claims were removed, rewritten, or marked HISTORICAL/SUPERSEDED.

B. Claude-budget-blocked runtime verification:
- Restore Anthropic credit.
- Run the exact Claude live test below.
- Record whether the commit reaches the original PR head and whether the watchdog recognizes delivery.

C. OpenAI API quota-blocked verification:
- Restore OpenAI API quota.
- Run a controlled Codex API backup test with `CODEX_BACKUP_ENABLED == 'true'`.
- Verify disabled backup remains a skip path, not escalation.

D. Downstream sync / secrets / variables audit:
- Audit only current evidence from each downstream repository.
- Verify secrets, variables, permissions, and synced workflow contents before claiming health.
- Do not infer sync state from older onboarding notes.

E. Longer-term work:
- Keep Cloud limitation explicit until a supported non-UI Update branch mechanism exists.
- Keep delivery markers tied to real branch commits, not workflow wording or task UI state.
- Continue preserving useful incident history only when marked historical and pointed at current architecture.

## Exact Next Live Test Plan
1. Create one harmless same-repo PR.
2. Ensure it has an active P1 or P2 finding.
3. Trigger `@claude fix` from an owner-authored public-repo comment.
4. Verify a real commit reaches the original PR head branch after the Claude marker.
5. Verify no secondary branch or PR is created.
6. Verify the watchdog recognizes delivery.
7. Verify no `no_delivery` marker remains after the successful push.

## Documentation Files Updated
- `LOOP_STATE.md`
- `handoffs/CONTEXT.md`
- `handoffs/loop-build.md`
- `/root/work/agent-memory/automation-core/cc-latest.md`

## Files Intentionally Not Changed
- `workflows/`
- `.github/workflows/`
- `sync-config.json`
- Any downstream repository
- Any workflow logic

## Explicit Non-Actions
- No workflow logic was changed.
- No downstream repository changed.
- No force push was used.
- No browser automation, Playwright, session-cookie automation, UI automation, or fake Codex Cloud Update-branch implementation was used.

## Validation Notes
- Initial local `git status --short` in `/root/work/automation-core` was clean.
- Local `git pull --ff-only`, local file writes, and local `git diff --check` against the intended edits were blocked by the workspace error `bwrap: fchdir to oldroot: No such file or directory`.
- Because local writes were blocked, documentation commits were published directly through the GitHub connector on `main`; no force push was used.
- Markdown structure was reviewed in the replacement content.
- Stale current-tense phrases were removed from the rewritten documentation content or retained only as HISTORICAL/SUPERSEDED context.
