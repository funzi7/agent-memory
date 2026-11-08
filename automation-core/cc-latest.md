# automation-core handoff — 2026-11-08 UTC (Codex Gate reliability and fail-closed enforcement)

## Outcome

The two paywall-bot Codex Gate "failures" seen during the Telegraph token fix (PR #120 run
`42477092393`, PR #122 run `42485718581`) were investigated read-only against GitHub and fixed in
the source of truth (`automation-core/workflows/`). Nothing in paywall-bot was edited; the fix
reaches it through the official daily sync after the owner merges the automation-core PR.

Branch `claude/codex-gate-fail-closed` (based on `main` `15652f6`), PR <https://github.com/funzi7/automation-core/pull/59>.
Final HEAD `5491701be5cd67087dd304af9b1032a21afcef5a` (pushed, == origin). Commits: `d169c82` (permissions + technical
fail-closed), `c43d5d6` (structured head binding, thread truncation, evidence block hardening)
, `4127173` (independent-review follow-ups: own-branch `@ref` suffix only, producer 24 h mint bound, `has_unresolved_findings` guard, `core.error` annotations), `5491701` (handoff docs).

## What actually happened in paywall-bot (verified from run logs, PR timelines and check-runs)

1. **Normal WAITING state, not a wrongful merge.** Each failed run is the `pull_request_target`
   evaluator firing seconds after the push, before Codex reviewed. It published
   `check-codex-status` = `🟡 Waiting for Codex review` (conclusion `failure`) and failed the
   diagnostic evaluator job while application CI was green. Codex then posted a
   `codex-review-receipt:v1` comment with `**Reviewed commit:**` naming the exact head on all three
   PRs (#120 `23eac35` 11:47:14Z, #121 `68985bc` 12:49:00Z, #122 `fcd6263` 13:36:47Z); the
   `issue_comment` gate run republished `🟢 Reviewed — clear` on the exact head
   (`current_head_signal_no_active_findings`); Merge Bot woke on the gate's `workflow_run`
   success, revalidated and squash-merged the evaluated SHA (merged_by `funzi7` = `AUTOMATION_PAT`).
   PR #120's three Codex P2 threads were all resolved before `23eac35`; #121/#122 had no findings.
   No P1/P2 was active at any merge and every merge had exact-head Codex evidence.
2. **Real permission defect, universal.** `trusted head marker publish failed; markerless signals
   stay fail-closed: Resource not accessible by integration` appears on EVERY `pull_request_target`
   gate run in paywall-bot and in automation-core (PR #58, all day 2026-11-08). The gate declared
   `issues: write` + `pull-requests: read`; the `codex-head-epoch:v3` marker is a comment on a pull
   request. No marker exists on any PR of either repository since the mechanism shipped on
   2026-08-13 (checked automation-core #41–#58, paywall-bot #94–#122). Effect: fail-closed
   (reaction-only clean, trusted-sync grace and fallback quota episodes all need an authenticated
   head epoch and stayed pending) — never a false green. `claude-fallback-review.yml` had the same
   defect, so no fallback attestation could ever have been minted. Both repositories report
   `default_workflow_permissions: write`; no repository setting is involved.
3. **Fail-open on technical errors (latent).** The gate's exception branch published a GREEN
   `check-codex-status` titled "Technical fail-soft". It did not fire in the observed runs.
4. **paywall-bot runs a stale, locally modified gate.** `codex-gate.yml`, `merge-bot.yml` and
   `claude-fallback-watchdog.yml` on paywall-bot `main` were changed by a paywall-bot feature commit
   (`b07344f4`, 2026-09-05, summary-row reaction binding) and predate automation-core PR #56;
   `codex-auto-fix.yml` matches; `claude-fallback-review.yml` is absent. The official sync PR #107
   (open since 2026-10-02, head `c770aa5`) is red: Codex left 4 P1 + 5 P2 on the synced gate code
   (addressed here) and paywall-bot's own `tests/test_codex_gate_logic.js` asserts the local patch
   (`not ok 19 - authoritative workflow keeps gate policy inline`).

## What changed (source of truth `workflows/`, mirrors `.github/workflows/` byte-identical)

- `codex-gate.yml`, `claude-fallback-review.yml`: `pull-requests: write` (kept `issues: write`).
- `codex-gate.yml`: technical errors publish `failure` titled `🟠 Gate evaluation error —
  fail-closed`, set `anyBlocked`, fail the evaluator; `decideCodexGate({technicalError})` →
  `pending`/`technical_error_fail_closed` (inline + `tools/codex_gate_logic.js`); the watchdog
  treats the new title like pending (`ERROR_TITLE`, pinned identical by test). A freshness-lookup
  API error (`triggeringHeadEventIsCurrent`, now tri-state) is reported as such and fails the job
  instead of being labelled a stale event.
- `signalTargetsHead` (gate, Merge Bot, watchdog, producer, module): Codex's machine-written
  `<!-- codex-review-state:v1 {…} -->` marker binds when `code_review.status === 'completed'` and
  the full 40-char `commit_sha` equals the head (replaces paywall-bot's local summary-row heuristic).
- Review-thread readers request `comments.pageInfo.hasNextPage`; a non-resolved thread with more
  comments than one page and no visible finding fails closed (`review_thread_truncated` pending in
  the gate; `true` from Merge Bot/watchdog finding predicates).
- Canonical evidence block (3 verbatim copies + `tools/review_evidence.js`): same-second ties close
  the quota episode; Route A bounded by the attestation time (24 h; ADR 0001 revised); attestation
  must be minted inside the current head epoch (`attestation_predates_head_epoch`); inactive
  candidates are skipped, not terminal; producer run path tolerates `@ref`; the producer counts
  Codex reactions and refuses on a tie.
- Tests: `tests/test_codex_gate_workflow.js` (new, executes the shipped gate script end to end:
  marker 403, missing marker + 👍, unverifiable marker, authenticated marker + 👍, late
  previous-head review, active P1/P2, resolved/outdated threads, non-inline P2, quota notice,
  GraphQL outage → 🟠, override, marker contract, stale/force-pushed events, publish failure);
  `tests/test_workflow_permissions.js` (new); gate-logic and evidence suites extended.
- Docs: README (permissions, fail-closed vs fail-soft), LOOP_STATE (addendum + TODO item 8 +
  paywall-bot row), CONTEXT (§3 verification, §4 contract, §5 downstream, §7 TODO A00),
  ADR 0001 (Route A TTL, 2026-11-08 hardening), `handoffs/loop-build.md` top entry.

## Validation actually run

- `bash scripts/validate.sh` green at every pushed head: 172/172 node tests (`tests/test_codex_gate_workflow.js`
  25 end-to-end scenarios and `tests/test_workflow_permissions.js` 4 guards are new; gate-logic 38→48,
  evidence 43→50), 59 github-script bodies syntax-checked, actionlint, `git diff --check`,
  source/mirror parity and the byte-identical canonical block asserted by tests.
- GitHub CI `validate-automation-core` on PR #59: success on `4127173` and on the final head `5491701`.
- Live pre-fix behaviour reproduced on PR #59 itself (main's gate runs on `pull_request_target`): run
  `42525806490` logged `trusted head marker publish failed ... Resource not accessible by integration`
  and published `🟡 Waiting for Codex review` — exactly the paywall-bot shape, confirming the diagnosis.
- Evidence gathered read-only from GitHub: job logs of paywall-bot runs `42477092393`/`42485718581` and
  every automation-core PR #58 gate run; PR timelines, reviews, review comments, GraphQL threads,
  reactions and check-runs of paywall-bot #120–#122 and #107; workflow run attempts (`path`,
  `pull_requests`); Actions settings of both repositories; paywall-bot workflow files and their history.

Independent review: a reviewer subagent (not the implementer) reviewed the full diff with its own
fixtures; no P1 found; one low P2 (scheduled sweeps keep the job green while the docs claimed it fails) and P3s (blanket `@ref` strip, producer without TTL, missing end-to-end truncation/marker scenarios, stale wording) — all addressed in `4127173`; 21/22 of its mutants were killed by the suite.

Not run: no production run of the changed gate — `pull_request_target` loads the workflow from the
default branch, so the first real marker publish and the first `🟠` verdict can only be observed
after merge. No paywall-bot sync dispatched (nothing to sync until automation-core `main` changes).
A throwaway branch probe of the permission (`workflow_dispatch`) was attempted and removed: GitHub
only registers dispatchable workflows from the default branch, so it could not run.

Codex on PR #59 at handoff time (21:37Z): review-state marker `status=completed` for `4127173` with `has_any_findings=False`, `has_unresolved_findings=False`; the docs-only final head `5491701` still awaits its own exact-head Codex signal (check-codex-status 🟡 at 21:35Z, as designed). Receipt comments so far: 0.

## Not physically verified / risks

- Marker publish succeeding with `pull-requests: write` (the documented permission model and
  the observed 403 both point there; both scopes are now declared so the publish cannot fail on
  whichever one GitHub checks). First signal after merge: a `pull_request_target` gate run logs
  `indexed trusted head epoch run` and a `github-actions[bot]` `codex-head-epoch:v3` comment
  appears on the PR.
- Merge Bot's reaction to the new `🟠` verdict in production (it requires `check-codex-status`
  success, so it skips; covered by tests, not by a live run).
- paywall-bot: the daily sync will refresh PR #107 after merge; Codex must re-review the new sync
  head; paywall-bot's local `tests/test_codex_gate_logic.js` summary-row assertions must be updated
  in that repository (not done here — no direct edits to paywall-bot).
- Docs on this branch will conflict trivially with PR #58's handoff entries (both prepend to
  `handoffs/loop-build.md` and `LOOP_STATE.md`); resolve by keeping both entries.

## Backlog (reconciled 2026-11-08)

1. **DONE (this branch):** root cause and merge legitimacy established; permission fix; technical
   fail-closed; structured head binding; thread truncation fail-closed; evidence-block hardening
   (the nine PR #107 Codex findings); end-to-end regression harness; docs.
2. **PENDING (owner):** merge PR <https://github.com/funzi7/automation-core/pull/59>; observe the first marker publish; let the daily sync
   refresh paywall-bot #107 (or dispatch `sync-automation-core.yml` there); update paywall-bot's local
   gate test; optionally reduce `issues: write` to `read` on the gate once a marker publish has been
   observed with `pull-requests: write`.
3. **SUPERSEDED:** "intentional technical fail-soft" (gate); "Route A deliberately carries no TTL"
   (ADR 0001); paywall-bot's local summary-row reaction binding.
4. **Unchanged:** LOOP_STATE items 1–7 and the oauto PR #58 item (previous handoff below).

## Operating invariants to preserve

- Authoritative policy stays inline in trusted workflow YAML; `tools/*.js` are mirrors; the canonical
  block is byte-identical in gate, Merge Bot and watchdog (test 14c).
- No `${{ }}` inside `github-script` bodies; Actions/Checks reads on GITHUB_TOKEN.
- A missing, unverifiable or stale marker is never a clean review; API errors never publish green;
  exact-head evidence is `commit_id` / `original_commit_id` / `Reviewed commit` / completed
  `codex-review-state` with the full SHA — never timing, task summaries or capacity notices.

---

# Previous handoff (still open): oauto PR #58 — Codex P1 round closed (2026-11-08)

PR <https://github.com/funzi7/automation-core/pull/58>, branch `claude/oauto-opencode-reviewer`,
final HEAD `18011a91e35f55c3d94725224c749d08f1ab0ec4` (Codex clean, Gate green, CI green, owner merge
pending). Full record in that branch's `handoffs/loop-build.md` 2026-11-08 "Codex P1 round" entry and
agent-memory commit `0e4e644`. Owner follow-ups: merge; one `oauto <repo>` run from a real Termux
shell; decision on listing `oauto` in `DEVELOPMENT_RULES_FULL` §7.
