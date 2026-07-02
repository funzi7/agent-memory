# automation-core — latest Claude Code status

## Fix #15 — two-check gate architecture (survive GitHub's 2025-03-31 update policy)

**automation-core main commit:** `51b7330`

**Root cause:** GitHub's **2025-03-31 policy** forbids a workflow's `GITHUB_TOKEN`
from UPDATING the status/conclusion of a check-run created by a DIFFERENT Actions
run ("Check run status and conclusions can only be updated internally by GitHub
Actions"). Proven on a downstream: `publishGateCheck`'s `checks.update` was
rejected. Consequence of the post-#14 code: on the **2nd** gate run for a head
(the NORMAL path — 🟡 first, then Codex reviews) find→update fails →
`publishFailed` → the job failed even on a GREEN verdict → the gate jammed
**permanently red**.

**Fix — separate the authoritative signal from the rich output:**
- **Authoritative `check-codex-status` = the ACTIONS-OWNED job-status check.**
  Added `name: check-codex-status` to the job; its conclusion equals the VERDICT
  ONLY (`core.setFailed` iff `anyBlocked`; deleted the `publishFailed`→setFailed
  coupling and its message). Actions updates this internally — immune to the
  policy and to token downgrades. The head-targeted self-rerun still lands it on
  `pr.head.sha`. merge-bot (`CODEX_CHECK`) + telegram (`GATE_CHECK`) read it BY
  NAME via `checks.listForRef`; nothing keys on the job via `needs:`.
- **Rich 🟢/🔴/🟡 output = a cosmetic, CREATE-ONLY companion `codex-gate-verdict`.**
  `publishGateCheck` now always `checks.create`s a fresh completed check-run with
  the title/summary — **no list/find/update** (the exact op the policy blocks).
  Runs accumulate; latest-per-name surfaces the newest. A create failure
  (downgraded `checks:write` on forked/Dependabot runs) is a `core.warning` and
  NEVER fails the job. Nothing keys on this name. Permanently resolves Codex's
  "Restore the fallback gate check name" finding.
- Unchanged: scheduleRerun, `MAX_ATTEMPTS`, freshness rule, P1/P2 detection,
  concurrency, override label.

**Validation:** actionlint clean on both copies; node --check on all 3
github-script blocks; greps confirm job `name: check-codex-status`, `publishFailed`
removed, final block verdict-only, cosmetic `codex-gate-verdict` create-only, no
`checks.update`; merge-bot still keys on `check-codex-status`, nothing on the
cosmetic name; `workflows/` ↔ `.github/workflows/` byte-identical (blob `4ddac70`).

**Net:** a normal head shows one authoritative `check-codex-status` (Actions job
check, green once Codex reviews clean) + a cosmetic `codex-gate-verdict` carrying
the reason; the 2nd-run red-jam is gone. Propagates via the daily sync.
