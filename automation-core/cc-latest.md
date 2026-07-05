# automation-core — latest Claude Code status

## fix #24 — honesty + push-instruction hardening on the fixer chain

**main commit `7bfb28a`** (direct to main, ONE commit, author funzi7). Both changed workflows
byte-identical across `workflows/` ↔ `.github/workflows/` (codex-backup-fix `efad70a`, watchdog
`6b0a06d`); `yaml.safe_load` + actionlint pass on all four copies; `node --check` on all 9 script bodies.

### codex-backup-fix.yml
- **Part A — freshness filter.** The findings gather now computes `latestCommitDate` (MAX committer
  date across the PR's commits, else `pr.created_at` — codex-gate's date-only model) and keeps a Codex
  review **COMMENT** only if `created_at > latestCommitDate` and a review **BODY** only if
  `submitted_at > latestCommitDate`. Stale, already-addressed P1/P2s are no longer fed to the agent.
  The generic fallback line stays for the empty case.
- **Part B — honest end states.** The apply/push bash step gains `id: apply` and a `pushed` step output:
  `'false'` on the empty-patch no-op, `'true'` **only after `git push` succeeds**. The single marker step
  is split by outcome (all under `stale=='false'`):
  - `pushed=='true'` → `agent=codex state=pushed` (unchanged text);
  - `pushed=='false'` → `agent=codex state=no_change` (+ `core.notice`, "empty patch — not counted as a fix");
  - apply step FAILED (`if: failure()`) → `agent=codex state=patch_failed` (+ `core.error`, loud).
  **Was:** it posted `state=pushed` even on an EMPTY patch (a lie). Verified the fix #23 watchdog judges
  the codex-api stage by `deliveredSince` (real commits) and reads only `agent=codex state=requested` — it
  **never** treats `no_change`/`patch_failed`/`pushed` as delivered, so the markers can't lie to the ladder.

### claude-fallback-watchdog.yml
- **Part C — Cloud-stage texts.** The codex-cloud `@codex fix` body now appends, right after
  `[auto-triggered]`, an explicit push instruction: **"Commit and push your fix directly to this PR's head
  branch (you have write permission) — do not leave the diff waiting in the task."** (the Codex Connector
  app is CONFIRMED to hold Read&Write on code+workflows across all repos, so autonomous push is a
  product-behavior question, not a permissions one). The final escalation comment appends, when a
  codex-cloud marker exists for the head, a **View-task hint**: "A Codex Cloud task may have completed with
  a ready diff — open the task (View task) and apply it / Update branch." (Chain-naming text kept.)
- **Part D — fork guards on the new paths.** The same-repo guard
  (`pr.head.repo.full_name === owner/repo`, mirroring codex-backup-fix's guard) is added to BOTH fix #23
  paths: a **fork-headed PR is NEVER pinged for a cloud fix** (skip + `core.info`, falls through to
  escalate) and **NEVER auto-update-branched** (`loopPr && !hasNeedsOwner && sameRepo`).

### Validation
`yaml.safe_load` + actionlint on both copies of both files; `node --check` on all 9 script bodies (7 in
codex-backup-fix, 2 in the watchdog); greps — `latestCommitDate` present in codex-backup-fix,
`state=no_change` + `state=patch_failed` present, the pushed-marker gated on
`steps.apply.outputs.pushed == 'true'`, the push-instruction line in the cloud ping, the `full_name`
guard in BOTH new watchdog paths, "View task" present; regression guard **ZERO**
`require('@actions/github')` / `__original_require__` / `getOctokit` anywhere; `git hash-object` equal per
file.

**Handoffs updated in the same commit:** `handoffs/CONTEXT.md` (codex-backup freshness + honest states;
watchdog cloud push instruction + View-task hint + fork guards + the confirmed-Read&Write note),
`LOOP_STATE.md` (both files, fix #24), `handoffs/loop-build.md` (dated entry).

**Next:** the codex-api backup no longer claims a fix it didn't make; the Cloud ping tells Codex to push
autonomously; the new fix #23 paths are fork-guarded. Propagates downstream on the next daily sync.
