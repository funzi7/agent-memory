# automation-core — latest Claude Code status

## fix #21 — silent-sync grace-green + override-label bootstrap

**main commit `ee035f4`** (direct to main, ONE commit, author funzi7). Both changed workflows
byte-identical across `workflows/` ↔ `.github/workflows/` (codex-gate `96ed29d`, watchdog `112096e`);
actionlint + `yaml.safe_load` pass on all four copies; `node --check` on the gate Evaluate body + the
sweep body.

### The incident
A sync PR received **ZERO Codex signal** (no review, no comment, no reaction — Codex simply never
engaged), so the fail-closed gate stranded it **🟡-pending forever** and it needed a manual merge.
Worse, the `codex-p1-acknowledged` override label that the gate's own summary tells humans to add
**did not exist** in the downstream repo. Sync PRs are byte-copies of an upstream `main` that already
passed our full validation — Codex silence on them must not require a human.

### Part A — codex-gate.yml: trusted-sync grace-green
Added `SYNC_GRACE_MINUTES = 30` and an `isTrustedSync(pr)` predicate **textually mirroring
merge-bot's** (title prefix `chore(automation): sync from automation-core` + owner-or-same-repo-
`chore/sync-automation-core`-branch; all three copies carry a "must match … keep in sync" comment).
A new verdict branch fires **ONLY inside the existing zero-signal 🟡 block**: if `isTrustedSync(pr)`
AND `codexSignalCount === 0` (reviews + review comments + issue comments + issue-level reactions, any
date) AND `Date.now() − latestCommitDate > 30 min` → **GREEN**, cosmetic title
**`🟢 Trusted sync — no Codex findings within grace window`**. **ANY Codex signal → `codexSignalCount
> 0` → the branch never fires** and normal rules apply (active P1/P2 still blocks; a clean review/👍
still greens; a younger-than-grace silent sync stays 🟡 with a `\nTrusted sync: auto-clears at <UTC>`
line appended). Untouched: freshness rule, P1/P2 detection, ack semantics, concurrency, MAX_ATTEMPTS,
two-check publishing.

### Part B — claude-fallback-watchdog.yml: sweep dispatches stale silent syncs
The gate's own poll (MAX_ATTEMPTS 3, ~4.5 min) can't wait out the 30-min grace, so the sweep lands it.
Added a **second dispatch class** on the same 🟡-pending/no-verdict candidate: `isTrustedSync(pr)` AND
head older than `SYNC_GRACE_MINUTES` (= 30 here too) → dispatch the gate exactly as the existing path
(`createWorkflowDispatch codex-gate.yml`, `ref: pr.head.ref`, `inputs.pr_number`, fix #4 loud-fail),
logging **`silent-sync grace: dispatching gate for PR #N @ <head7>`**. Dispatch condition is now
`freshSignal || silentSyncStale`; self-limiting — the dispatched run flips the verdict 🟡→🟢 so the PR
stops matching next tick.

### Part C — claude-fallback-watchdog.yml: bootstrap the override label
Once per tick, before the PR loop, the sweep **upserts** `codex-p1-acknowledged`
(`createLabel({name, color:'0e8a16', description:'Override: acknowledge Codex P1/P2 findings and let
the Codex Gate pass'})`, catch/ignore HTTP 422 = already exists). Mirrors the `needs-owner` upsert;
fixes the missing-label incident so the label the gate points humans to actually exists on every repo
the watchdog ticks.

### Validation
`yaml.safe_load` + actionlint on both copies of both files; `node --check` on both changed script
bodies; greps — `SYNC_GRACE_MINUTES = 30` present in **both** files (same value), the `isTrustedSync`
predicate present in gate + sweep with its `titleIsSync`/`sameRepo`/`OWNER_LOGIN`/`SYNC_BRANCH` lines
**byte-identical** to merge-bot's, the green title string present, the label upsert present, the
`silent-sync grace` log present; regression guard **ZERO** `require('@actions/github')` /
`__original_require__` / `getOctokit` anywhere; `git hash-object` equal per file.

**Handoffs updated in the same commit:** `handoffs/CONTEXT.md` (gate trusted-sync grace rule +
rationale; watchdog silent-sync class + label bootstrap), `LOOP_STATE.md` (codex-gate + watchdog fix
#21 entries), `handoffs/loop-build.md` (dated entry: the zero-signal sync strand + missing label).

**Next:** the next zero-signal sync auto-clears 30 min after its head with no human; the override label
exists everywhere the watchdog ticks. Propagates to downstreams on the next daily sync.
