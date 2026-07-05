# automation-core — latest Claude Code status

## fix #23 — the full fixer ladder, delivery-judged + auto update-branch

**main commit `eed3728`** (direct to main, ONE commit, author funzi7). Both changed workflows
byte-identical across `workflows/` ↔ `.github/workflows/` (claude.yml `d69cae3`, watchdog `1b59163`);
`yaml.safe_load` + actionlint pass on all four copies; `node --check` on all 5 script bodies.

### Forensic (TRF PR #84)
1. `claude-code-action` concluded **`success` in 15 seconds with ZERO commits** — a no-op success — so
   fix #10's `outcome != 'success'` guard skipped the 👎 and the chain looked healthy while delivering
   nothing.
2. The 👀 on the trigger was placed by the **hosted `claude[bot]` App** — a DIFFERENT identity whose
   reactions we cannot delete — so the 👎 must be **ADDED**, never "swapped".
3. The chain only advanced because the owner manually commented `@codex fix` (a PAT/owner-authored
   comment provably wakes subscription-billed Codex Cloud) and manually clicked **Update branch**.

### Part A — claude.yml: delivery-aware verdict
- New **Delivery check** step (`id: delivery`, `always() && has_key`): lists commits on the PR head ref
  since the trigger comment's time → `delivered = ≥1 new commit` (via `github.rest.repos.listCommits`,
  injected octokit, zero modules). Fail-soft: unknown → treat as delivered (no false 👎).
- The fix-#10 step is rewritten: guard is now
  `always() && has_key=='true' && (steps.claude.outcome != 'success' || steps.delivery.outputs.delivered != 'true')`.
  It **ADDS** a 👎 (the cross-identity delete-eyes logic is GONE) and upserts a
  `agent=claude state=no_delivery head=<sha>` ai-loop marker so the watchdog can advance the ladder
  **without waiting the full 20-min timeout**.

### Part B — claude-fallback-watchdog.yml: the ladder (delivery-judged)
Per open PR with an unanswered `agent=claude state=requested` marker, the per-PR decision is now a
ladder, each stage judged ONLY by `deliveredSince(pingTime)` (a commit on the head ref after the ping;
injected octokit, zero modules) and firing **at most once per head** (marker dedupe):
1. **claude** — failed = a `claude/no_delivery` marker OR the 20-min window elapsed with no delivery.
2. **codex-api** — ONLY if `vars.CODEX_BACKUP_ENABLED == 'true'`: the existing `codex-backup-fix.yml`
   dispatch (unchanged; Codex runs IN Actions) + its own 20-min window. **Skipped when the var is unset**
   (today's reality — dead OpenAI quota).
3. **codex-cloud (NEW)** — a TOP-LEVEL `@codex fix` issue comment via AUTOMATION_PAT + `[auto-triggered]`
   + the findings digest COPIED from the bridge's most recent `@claude fix` comment (located by its
   ai-loop marker; else "see the Codex review") + marker `agent=codex-cloud state=requested`.
   **HARD LIMIT: one codex-cloud attempt per head** (dedupe via the marker). Then a 20-min window.
4. **escalate** — only after every ENABLED stage failed delivery: the existing `needs-owner` upsert
   (fix #14B) + Telegram, message naming the chain.
The old fixed 3-attempt cap AND the "backup-disabled → escalate on first timeout" block are BOTH
replaced by this per-head ladder; unused `MAX_ATTEMPTS`/`CLAUDE_APP` consts removed. Each advance sends
a Telegram info line.

### Part C — sweep: auto update-branch
In the existing sweep loop, a new candidate class: any **loop PR** (carries an ai-loop marker OR a
`claude/*` head ref OR a trusted sync) that is `mergeable_state == 'behind'` and NOT `needs-owner` →
`pulls.updateBranch({ expected_head_sha })` via AUTOMATION_PAT — the owner used to click Update branch by
hand. **NEVER for `'dirty'`** (real conflicts stay a human's job). Log `auto update-branch: PR #N`,
loud-fail (`core.error` + Telegram), at most once per PR per tick. The update advances the head → the
gate re-runs → the ladder continues on the fresh head.

### Validation
`yaml.safe_load` + actionlint on both copies of both files; `node --check` on all 5 script bodies (3 in
claude.yml, 2 in the watchdog); greps — claude.yml's new guard references `steps.delivery.outputs.delivered`;
`state=no_delivery` / `agent=codex-cloud` / `updateBranch` present in the watchdog; the one-cloud-per-head
dedupe (`newestMarker('codex-cloud','requested')`) present; regression guard **ZERO**
`require('@actions/github')` / `__original_require__` / `getOctokit` anywhere; `git hash-object` equal per file.

**Handoffs updated in the same commit:** `handoffs/CONTEXT.md` (fixer-chain section rewritten — the
4-stage ladder, delivery-based verdicts, success≠delivery, add-only 👎 + the `claude[bot]`-identity note,
auto update-branch, one-cloud cap), `LOOP_STATE.md` (claude.yml + watchdog fix #23 entries),
`handoffs/loop-build.md` (dated entry citing TRF #84).

**Next:** an `@claude` no-op success no longer looks healthy — 👎 + `no_delivery` marker fire immediately,
the watchdog climbs to Codex Cloud before escalating, and a stale loop-PR head is auto-updated.
Propagates downstream on the next daily sync.
