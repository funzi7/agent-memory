# paywall-bot handoff — 2026-10-04 UTC (Provider Discovery v1: PR #110 merged; first natural cycle; PR #112 GitHub-id fix)

## Headline

The owner milestone "Autonomous Provider Discovery & Promotion v1 — TheMarker
only" is merged and working in production up to the scout launch.

- PR #110 was merged by **Merge Bot** as
  **`8578a4120b12ada72dab604447dcd79cb1616036`**.
- The first natural discovery cycle ran on `main`: request, Issue #111, known
  re-probe, launch, ingestion, cooldown, close. It ended at the model with
  **`billing_error`**, because Anthropic credit is exhausted.
- **The real web scout is NOT verified:** no inference ran and no
  WebSearch/WebFetch call was made.
- There was no viable candidate, so **no integration, canary or promotion**
  happened. No provider was promoted.
- That cycle exposed a real defect: GitHub ids were clamped to 10**9 in core
  state, which broke evidence dedup. **PR #112** fixes it. Its status is
  under "Git / PR / review (exact)" below.

## Git / PR / review (exact)

### PR #110

- Starting `origin/main`: **`521bc52a87d99976478aca638c50e0aa163abee8`** (after #108).
- Branch `feat/themarker-provider-discovery-v1-20261003`, opened
  2026-10-03T20:58Z.
- Nine heads, CI success on each:
  - `53c20e1` 37153465376
  - `cf31f31` 37154340576
  - `7f893dc` 37155057667
  - `b7c9ab6` 37156421460
  - `ddd041b` 37157053647
  - `3ff5430` 37162893798
  - `b900601` 37164218503
  - `6c7465f` 37165200576
  - `af4117d` 37170740766
- Codex rounds 1–9:
  - Every P1/P2 was fixed by the coordinator; the `@claude fix` hand-offs
    ended `billing_error`.
  - Round 8 on `6c7465f` was clean.
  - Round 9 on `af4117d` first hit Codex's own "Something went wrong"
    (02:20Z); re-requested, it came back clean at 02:33:42Z.
  - The finding-by-finding record is in evidence report §11.
- Gate:
  - `check-codex-status` stayed `failure` after the clean review.
  - Once the fixed findings' threads were resolved, a status comment
    (03:59:34Z) re-ran the Gate (run 37175661363). It went green "🟢
    Reviewed — clear" at 03:59:54Z (check run 111357670998).
  - No override, acknowledgement or `automerge` label was used.
- Merge: Merge Bot run 37175679796 cleared the transient `needs-owner` and
  `needs-owner-auto` labels after exact-head fully-green validation, then
  merged at 2026-10-04T04:00:23Z. Head `af4117d9cf1b00eea86eacd851bb85af13623b14`;
  merge `8578a41`. CI on `main` afterwards: 37175708496, success.
- Synthetic smoke Mode A: run 37175789982 on `8578a41` → `result ok`, 17 steps
  (`promotion_decision render=ok exact=ok; discarded`,
  `hard_stop_config_untouched`). This is not provider evidence.

### PR #112

- Branch `fix/themarker-provider-discovery-github-ids-20261004` from `89c0cb1`.
- Head `c3487fb753036ec7ba9e30ca533058b8ec740fd1`; CI `test-message-format`
  success.
- Codex: the automatic review on PR open finished "✅ Completed" at
  2026-10-04T07:41:22Z on `c3487fb`; 👍 by `chatgpt-codex-connector[bot]` at
  07:41:25Z; 0 reviews, 0 inline comments. Clean.
- Gate: the `pull_request_target` run 37186387909 and the `issue_comment`
  run 37186399310 ran BEFORE the review ("🟡 Waiting for Codex review").
  The Codex summary edit triggered `issue_comment` run 37186551387, and
  `check-codex-status` went to success "🟢 Reviewed — clear" at 07:41:43Z
  (check run 111389620812). No comment, label or override from the
  coordinator.
- Merge: Merge Bot run 37186570626 (`workflow_run`, 07:41:48Z) merged at
  2026-10-04T07:42:06Z →
  **`c851459e4f9eef6c30bfa1078195fca46a8b75d2`**. No label was needed: this
  is an owner same-repo `fix/*` branch.

## First natural cycle (physically observed)

GitHub skipped the scheduled polls after the merge; the last scheduled run
was 2026-10-03T23:30Z. So the normal production `poll.yml` was dispatched
three times: 37184788861, 37184910088 and 37184993996.

These are ordinary production polls. They published 0, 4 and 2 articles via
one3ft once the outage had ended. That is normal bot operation, not a test.
No owner DM was sent.

- **Poll 37184788861** (07:06Z, `main` `ab32523`): `provider_discovery
  phase=IDLE->REQUESTED cycle=pd-e10-20261003T194051Z-n1-9d96
  reason=external_outage_sustained`, then `summary phase=REQUESTED …
  candidates=5` (the seeded known list). The sync logged
  `action=issue_created issue=111` and `action=scout_triggered`.
- **Issue #111**: author `funzi7` (PAT); labels `provider-discovery` and
  `provider-scout`; marker present; no assignee, no `@`, no `claude-fix`,
  no onrender host.
- **Scout run 37184820543** (`issues`): all three jobs succeeded. The
  duplicate-event scout run 37184820340 and three Claude Fixer runs were
  skipped.
  - Gate: re-probed 4 known entries, 0 viable (`latency_budget_exceeded`,
    `landing_page` ×2, `no_content`), then posted `kind=known` and
    `kind=launch`.
  - Model job: read-only token, no checkout, no PAT, agent mode. It checked
    the actor with the read-only token ("Verified human actor: funzi7", so
    R8 is observed OK).
  - Model args: `--tools`/`--allowedTools "WebSearch,WebFetch"`, a full
    disallow list, `--strict-mcp-config`, `--setting-sources user`,
    `--max-turns 40`, `--max-budget-usd 3.00`, `--json-schema`.
  - Result: `is_error: true`, empty `modelUsage`, so `billing_error`. The
    sanitize job posted `kind=scout` with `outcome=billing_error` and 0
    candidates.
- **Poll 37184910088**: the outage incident went `WAITING_EXTERNAL→RESOLVED`
  (`provider_recovered`); discovery went `REQUESTED→SCOUTING`; the sync
  ingested `known`, `launch` and `scout`.
- **Poll 37184993996**: absorbed the evidence:
  - `scout_ai_requests_total` 1, `ai_requests_total` 0→1, `known_rechecks_total` 4;
  - `SCOUTING→COOLDOWN` (`billing_error`, terminal `ai_unavailable`), then
    `COOLDOWN→IDLE` (`outage_resolved`);
  - `next_scout_eligible_at` 2026-10-05T07:07:31Z (launch + 24 h);
  - Issue #111 closed at 07:11:29Z with its summary;
  - `owner_dms_total` 0, `ai_failure_cycles` 1 of 2, sync `ok`,
    `credential_failure` null.
- Tech Feed IL poll 37182923828 succeeded; `state/techfeedil.json` has no
  `runtime_ops` key.

## Defect found and fixed (PR #112)

**Symptom.** After poll 37184993996, the committed state held the absorbed
evidence records as `run_id`/`comment_id` **1000000000**. Three duplicates
sat beside them under the real ids: run 37184820543; comments 5977569156,
5977569245 and 5977573942.

**Cause.** `core/provider_discovery.py` normalized GitHub ids with
`_count`'s default bound of 10**9.

**Impact.**

- The evidence comments sit within the read anchor's 10-minute slack before
  the close comment. So v1 re-ingests them on every poll of the 48 h late
  window.
- After 8 such polls, `MAX_EVIDENCE_RUNS` trims the absorbed records. From
  then on, core would count the launch (AI) and the re-check again on every
  poll. A v1 emulation reproduces this: 1 → 2 → 3 …
- A canary's second run (a real id) collapses onto its first and is dropped,
  so no canary could ever pass.
- A refused comment is refused again on every poll.

**Fix.**

- `GITHUB_ID_MAX = 2**63-1` and `_github_id()` for every stored GitHub id.
- `_v1_duplicate()`: an entry whose cycle holds ANOTHER record of the same
  kind and attempt at exactly 10**9 is marked absorbed without being counted
  (fail closed; history row `evidence_duplicate … v1_id`).
- The fakes and the smoke now use production-sized ids.
- `tests/test_provider_discovery_github_ids.py` has 9 tests. Mutations: clamp
  restored → 8 fail; duplicate rule removed → 2 fail; both → 9 fail.
- Docs: ADR §27; report §0/§11–§17 filled; §12.1 records this finding;
  CONTEXT.md.

**Production when the fix was written** (state `89c0cb1`): counters exact
(AI 1, scout AI 1, re-checks 4, DMs 0). Three re-ingested records sat in the
inbox, waiting.

**After #112 merged** (verified in production). CI on `main` for
`c851459`: run 37186588847, success. The normal poll was dispatched once more
because GitHub skipped the 07:00Z cron.

- Poll 37186657246, on head `c851459`, wrote three history rows:
  `evidence_duplicate launch/known/scout run=37184820543 attempt=1 v1_id`.
- All six evidence records are absorbed and the inbox is 0.
- Counters are unchanged: AI 1, scout AI 1, re-checks 4, DMs 0,
  `ai_failure_cycles` 1.
- The poll log has 0 `evidence_ingested`/`evidence_refused` lines, so the
  re-ingest loop is closed.
- Sync `ok`, `credential_failure` null, posted 0.
- A copy-only replay of the pre-fix state (`89c0cb1`) through the fixed
  `evaluate` had predicted exactly this.

**Same poll:** the outage incident `68c5cb55d1c6bdc5` went
`RESOLVED → WAITING_EXTERNAL` (`outage_reopened`). That is expected
behaviour, not an error.

- Discovery can request a new cycle after 3 consecutive `WAITING_EXTERNAL`
  evaluations and 8 h in the epoch.
- The scout cannot launch before 2026-10-05T07:07:31Z.
- If Anthropic credit is still exhausted then, that second billing cycle
  makes the owner AI-credit DM fire, by design.

## Validation actually run

- On the fix branch:
  - `python -m unittest discover`: **2334 OK**.
  - `python -m tests.test_message_format`: pass.
  - `state/` byte-clean; `git diff --check` clean; Python 3.11 grammar scan clean.
  - Local Mode A smoke with production-sized ids: `ok`, 17 steps.
- On #110, before merge: full suite OK on every head, consolidated mutation
  run (26 design rows, all killed), pre-PR adversarial review, and the
  verification re-review (evidence report §3–§10).

## PENDING / known limits

1. **Anthropic credit (owner).** The real web scout (WebSearch/WebFetch, the
   manifest, the sanitizer on real output) cannot be verified until credit
   is added. The AI-credit owner DM fires only after 2 consecutive
   billing/auth cycles; it is at 1.
2. **Unobserved stages.** Nothing after the scout launch has been physically
   observed: pre-probe of a scouted candidate, integration PR + `@claude`,
   Fixer PR-mode delivery, guard on a delivered head, exact-head Codex,
   integration merge, canary, acceptance, promotion PR and merge,
   post-promotion verification, and demotion.
3. **PR #107** (sync from automation-core): still OPEN and untouched; head
   `3892cc0`, last updated 2026-10-03T09:02Z.
4. **Residuals from the ADR:**
   - R15: Merge Bot latest-wins per check name.
   - R16: committed Telegraph tokens are readable by same-repo PR code in CI
     (backlog).
   - R17: adapter computation the AST policy cannot bound.
   - A canary comment not ingested at gate time costs at most one extra
     canary run.
   - `known` posted but `launch` failed: the cycle waits for
     `scout_stall_hours`.
5. **Older items, still open:**
   - the #104 cutover gap (a legacy DM was never closed);
   - the `core/health.py` 24 h comparison ignores `suppressed_items`;
   - #105's adaptive cap > 4 is unobserved;
   - the internal-defect Issue → Fixer → PR chain is unobserved.
6. **Scheduled polls.** GitHub skips the `0 5-23/2` poll schedule for hours
   at a time. Dispatching the normal poll is the operator remedy.

## Rules note

- DEVELOPMENT_RULES_FULL.md was followed.
- Every branch was cut from `origin/main`; there was no
  reset/clean/restore/stash/force-push.
- No Telegram/Telegraph write came from tests. The only production
  publications were the normal polls' (above).
- No fabricated review evidence and no override labels. Both merges were
  made by Merge Bot.
- agent-memory is finalized only via `/root/work/bin/agent-memory-finalize`.

## STATUS BLOCK

- paywall-bot main: `ad974de877da614eb5ab3bf6e71d3a0f25a83c71` (the state
  commit after poll 37186657246; code = `c851459`, #112). Later state
  commits move `main`.
- Real scout path: executed end to end up to the model; web search NOT
  verified (billing_error).
- Real viable-candidate promotion: not physically observed (no candidate).
