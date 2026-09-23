# paywall-bot handoff — 2026-09-23 UTC (PR #105: TheMarker recovery freshness + adaptive recovery cap + provider-recovery burst + Runtime-Ops-governed Daily Health)

## Headline

Post-merge follow-up to PR #104 (Runtime Ops v1, squash-merged `c7cd80d` on
2026-09-22T06:11:34Z by funzi7). Owner product decision: the recovery queue
must not slowly publish week-old news because an outage once blocked it;
recovery must be faster for relevant articles and freshness-aware; the daily
health DM must not headline automatic recovery as a red "תקלה". The old
contract "historical tail drains gradually under max_posts_per_run=4 — never
discarded" is `SUPERSEDED — owner approved` (2026-09-23).

**Read first:** `reports/themarker-recovery-freshness-20260923.md` (evidence,
simulation, replay) and the ADR section "Follow-up 2026-09-23" at the end of
`docs/themarker-runtime-ops-20260921.md`. `handoffs/CONTEXT.md` top section
is the repo-side handoff.

## Git / PR state (exact)

- Starting `origin/main`: **`7d6c197ff8a45e7580d89803f441df4343ce926c`**
  (`state: techfeedil 2026-09-23T05:37:43Z`; code identical to `c7cd80d`).
- Branch `feat/themarker-recovery-freshness-20260923` (owner namespace; an
  owner-authored same-repo PR is a Merge Bot candidate without `automerge`).
- One commit: **`9c272d9ba7cafec08377c0b50f5be51f0dd22bd6`** (implementation +
  tests + docs). PR: https://github.com/funzi7/paywall-bot/pull/105.
- Exact-head CI on `9c272d9`: **success** (CI run `35844195644`,
  `test-message-format` pass).
- Codex on `9c272d9`: **clean** — review summary "✅ Completed
  2026-09-23T09:44:31Z — commit 9c272d9 — PR opened", 👍 reaction by
  `chatgpt-codex-connector[bot]` at 09:44:34Z, 0 inline comments, 0 reviews,
  0 review threads. Codex quota was available (no fallback used).
- Gate: `codex-gate-evaluator` first ran before the review ("⏳ pending") and
  failed; RE-RUN after the review (run `35844195681`, attempt 2):
  `✅ current_head_signal_no_active_findings on head 9c272d9`;
  `check-codex-status` pass. `gh pr view 105`: MERGEABLE / CLEAN.
- **Merge: BLOCKED by the automation credential, not by the PR.** Merge Bot
  runs `35844758970` (09:44:57Z), `35844866832` (09:46:00Z) and a manual
  `workflow_dispatch` `35845707983` all log
  `#105: unexpected evaluation error; skipping only this PR: Resource not
  accessible by personal access token`. The failing call is one of Merge
  Bot's AUTOMATION_PAT Octokit reads after the checks pass
  (`hasCurrentHeadCodexSignal`: `issues.listComments`,
  `reactions.listForIssue`, `pulls.listReviews`, `pulls.listReviewComments`,
  or the GraphQL `reviewThreads` query). GitHub's fine-grained-PAT table: the
  issue comments and issue reactions endpoints require the **Issues**
  repository permission; `pulls.get` (which works) needs only Pull requests.
  Inference (not verifiable without the token): the PAT renewed on
  2026-09-22 is fine-grained WITHOUT `Issues` permission. The same gap would
  make Runtime Ops' trusted Issue writes (code-fix / needs-owner Issues) fail
  with 403 → `github.credential_failure` → an owner-action DM. **No manual
  merge was performed.** (#104 was merged by funzi7 at 06:11:34Z right after
  two manual Merge Bot dispatches at 06:06/06:09 whose logs are no longer
  retrievable.) automation-core's Merge Bot is also failing (runs
  `35821617653`, `35802935575`, `35791284252`).

## Measured production truth (copy of `81d7082`, 2026-09-22T23:32:39Z)

- runtime_ops.enabled_at 2026-09-22T09:43:09Z; github.last_sync_status ok;
  credential_failure null; active_code_fix null; ai_requests_total 0;
  owner_dms_total 0; outage `68c5cb55d1c6bdc5` WAITING_EXTERNAL 15:27Z →
  RESOLVED 20:03Z (one3ft, complete_content); `backlog_drain`
  `b5c61fa289128382` SELF_HEALING epoch 2, affected 138.
- Queue: 138 rows, no `published_at` (persist_source_metadata false). Age by
  first_seen: ≤24h 2, 24–48h 0, 48–72h 1, 72h–7d 0, >7d 135 (oldest 42 d,
  median ≈27 d), unknown 0. 127 extraction_outage_parked, 11 never attempted.
- Old news already published: of 67 posts since 09-15, 15 were >72h old (8
  of them 14–21 days); run 35711749261 (09-22 09:40) published an 18-day-old
  article. The next poll on main would publish rows aged 18h, 18h, 62h, 442h.
- Cadence: 31 scheduled polls 2026-09-16..22 = **4.43/day** (cron asks 10);
  interval median 4.6h, mean 5.3h, max 10.3h; run 64s median / 159s max.
  Inflow 7.27 new rows/day. Observed net drain at cap 4: 0.53 rows/poll.
- Primary RSS `cmlink/1.144` (read-only GET 2026-09-23): 100/100 pubDates
  inside their own URL day; the feed lists Feb–May 2026 articles.
- Daily Health 2026-09-23T07:26Z (run 35831731875; DM text not logged,
  rebuilt with the pure builders): `🔴 תקלה בפרסום TheMarker` (1 active
  terminal) above `🟢 מצב אוטומטי … פעולה נדרשת: 0 … פריטים בהמתנה בטוחה: 138`.

## What shipped in #105 (TheMarker only; Tech Feed IL byte-for-byte)

- Freshness: `posting.recovery_max_publish_age_hours: 72`;
  `_suppress_stale_recovery_rows` every poll before reconcile/discovery/cap/
  planning/network; proven age = max(trusted published_at, first_seen_at as
  lower bound); strictly > 72h suppressed; unknown/naive/malformed/future
  (+5 min skew)/published_at ≤ 2000-01-01T00:00Z never counts; published_at
  needs a counted first_seen on the row. Suppressed → `suppressed_items`
  (`stale_recovery_age:<h>h`, `basis`, `first_seen_at`), no retry / event /
  terminal / posted_guids / stats; rediscovery (`_filter_fresh_items`, all
  discovery paths) and backfill (`_recovery_stale_suppressed`) cannot
  requeue. Active outage: only `parked_item_count` recomputed; stamp
  `parked_drained_by_freshness_at` blocks the next poll's `no_parked_work`
  close. New rows record `published_at` (`_record_admission_published_at`);
  normalize merge keeps the earliest.
- Adaptive cap: `recovery_post_cap_tiers` >30→6, >60→8, >90→10, >120→12;
  `recovery_max_posts_per_run: 12`; code ceiling 12; base 4 whenever the
  outage is active or ready ≤ 30; computed once after the freshness pass,
  ONE budget dict for flashes + phase 2 (`_process_ready_deferred(post_cap=)`);
  recovery attempt plan `max(20, 3×cap)`; `post_cap` reported = PEAK cap in
  force; `runtime.poll_budget_seconds: 240` (worst row ≈210s vs 480s step).
- Burst (`features.themarker_provider_recovery_burst`): trigger = full-chain
  row under an active outage cleared with `complete_content` by an external
  provider in the chain; `set_poll_recovered_provider(P)`; `_prioritized_chain`
  = local lead → P → rest (configured chain never mutated; latched providers
  stay and record `unavailable_cached_for_run`); cap raised; remaining rows
  re-planned newest-first excluding attempted keys. `_BURST_SYSTEMIC_STREAK`:
  1st systemic-signature failure → `recovery_burst_transient` park (no
  retry/no outage); 2nd consecutive → `latch_provider_for_run(P)` + existing
  `_record_themarker_outage_probe`; streak resets on any content and on any
  non-systemic failure. Latch fix: acceptance pops the provider's
  `_POLL_UNAVAILABLE_COUNTS` entry (fail→success→fail no longer latches).
- Runtime Ops: backlog evidence `{ready, threshold, post_cap,
  stale_suppressed}`, quiet resolution rewrites the count, queue-count kinds
  accept 0 and clear `oldest_affected_at`, `stale_recovery_suppressed_total`
  (once per poll_key, `block["stale_recovery"]`), `recovery_burst_transient`
  in `_P2_ROW_OUTCOME_KEYS`, digest line `דולגו כי התיישנו: N` (24h from
  poll_events, explicit zero, gated on the config key).
- Health: `build_report(site_config=)` + `runtime_ops.health_governance`:
  🔴 `נדרשת פעולה — TheMarker` (OWNER_ACTION_REQUIRED) / 🟡 `תיקון אוטומטי
  בתהליך — אין פעולה נדרשת כרגע` / 🟡 `ממתינים לספק חיצוני — אין פעולה
  נדרשת` / 🟢 `התאוששות אוטומטית — אין פעולה נדרשת`; no incident → legacy
  headline with red mapped to its own branch's non-red sibling; facts
  byte-identical; legacy when last_evaluated_at > 18h old, unknown state,
  disabled, block missing, Tech Feed IL.
- Pre-existing test date bomb fixed (`test_publication_budget …
  test_duplicate_entries_from_an_older_build_replay_once`).

## Simulation / replay (task-local scripts, not shipped)

- Copy-only replay of the branch code on `81d7082` (clock = next poll at the
  median interval): 138 → **135 suppressed**, 3 relevant ready, cap 4, drained
  in **1 poll** (main: ~35 full-cap polls ≈ 7.9 days static, 59 with inflow,
  all 135 stale articles published); backlog_drain → RESOLVED backlog_drained
  (affected 3, runbook_state {ready 3, threshold 30, post_cap 4,
  stale_suppressed 135}); 0 DMs, 0 AI; health 🔴 → 🟢 with identical facts;
  posted_guids/publication_events/terminal_failures/stats untouched; tracked
  state sha256 unchanged.
- Tier simulation (real cadence cycled, inflow 7.27/day): fresh 100–150 rows
  (0–72h / 0–48h) back under 30 in 30–48h with the chosen tiers; 150-row
  <24h spike ≈56h (bound = 12 × 4.43/day); nothing >72h ever published.

## Review

- Pre-PR (Claude Code, independent Opus reviewers — NOT a Codex substitute):
  three adversarial lenses + one verification pass. Found and fixed with
  mutation-checked tests: P1 burst re-latch relied on the per-run latch
  (missed 429/no_snapshot/empty bodies/smry no_body; P hit up to 34×) →
  streak; P1 health trusted a stale verdict forever → 18h bound; P2 (two
  reviewers) suppression let the next poll fake a `no_parked_work` outage
  recovery → drain stamp; P3s: relative 30-day published_at guard let old
  articles through → absolute floor (exclusive), unknown states → legacy,
  oldest_affected_at, transient counted as parked/row outcome, 240s budget,
  streak reset on non-systemic failure, phase-start recovered-provider reset.
  Kept by decision: SELF_HEALING-only → 🟢 even above unrelated terminal loss
  (owner mapping; loss stays in facts + digest).
- Codex: 1 round, clean on `9c272d9` (see above). No threads to resolve.

## Validation actually run

- Local CI-equivalent on the final tree: `unittest discover` **1283 OK**
  (main 1128 + 1 date-bomb failure); `python -m tests.test_message_format`
  green; the 18 focused CI suites; Runtime Ops / budget / outage / probe /
  taxonomy / freshness / burst / health family 793 OK; compileall; 17
  workflow YAMLs; `node --test` 21/21; `bash -n`; `git diff --exit-code --
  state/`; `git diff --check`. New suites: `test_themarker_recovery_freshness`,
  `test_themarker_recovery_burst`, `test_health_actionability`.
- Exact-head GitHub CI on `9c272d9`: success.

## Known limitations (documented in the ADR)

- An outage that starts resolves `backlog_drain` as `backlog_drained`
  (pre-existing label; now with the true count).
- A poll crashing after a mid-poll checkpoint persists suppressions without
  counting them in that day's digest line.
- `core/health.py::_comparison_analysis` does not read `suppressed_items`: a
  stale-suppressed article re-posted by the source within 24h shows as a
  missed gap (same as the existing `stale_at_discovery`); a fix needs a new
  comparison category/fact line.
- #104 cutover gap (recorded in the Runtime Ops report §10): the legacy
  pipeline_outage (last DM 2026-09-21T23:54Z) never got its single
  "נפתר אוטומטית" closure — the first Runtime Ops poll had already cleared
  the outage before phase 4, so no incident carried owner_notified_via.

## PENDING (owner / next session)

0. **Owner:** give `AUTOMATION_PAT` the fine-grained repository permission
   **Issues: Read and write** (plus the existing Pull requests / Contents
   write) on paywall-bot (and automation-core), or explicitly direct a manual
   merge of #105. Then dispatch Merge Bot; it merges only with exact-head CI
   + Gate green on `9c272d9` (a new commit would need a fresh Codex review).
1. Post-merge acceptance on normal scheduled Polls (never manufacture a
   fault): first poll suppresses the 135 stale rows (`recovery freshness:
   suppressed … `, `RUNTIME-OPS … stale_suppressed=135`), `backlog_drain`
   RESOLVED; posted ≤ post_cap ≤ 12 per poll; healthy mode back at 4;
   suppressed identities never rediscovered; owner_dms_total /
   ai_requests_total unchanged; next Daily Health headline green/amber
   unless OWNER_ACTION_REQUIRED; a natural provider recovery → one
   `RECOVERY-BURST provider=…` poll.
2. `Runtime Ops Smoke` has never been dispatched (carried from #104) — it
   would also prove the Issues permission.
3. Carried from #104: Morning Report ingestion (automation-core), GitHub App
   tokens, `Sync from automation-core` disabled (fallback-review workflows
   absent; `CLAUDE_FALLBACK_REVIEW_ENABLED` unset — verified 2026-09-23),
   one3ft prewarm / independent full-body backup provider.

## Rules note

DEVELOPMENT_RULES_FULL.md read in full; preflight done (pwd/repo/branch/
HEAD/tracking/status/diff/cached/remotes/origin-main/log/open PRs); the old
feature branch left untouched, new branch from origin/main. Workflow tool
unavailable in this permission mode → parallel Agent subagents (≤4 at a
time, disjoint files). No reset/clean/restore/stash/force-push; no tracked
state edited; no Telegram/Telegraph writes; replays copy-only. agent-memory
finalized only through `/root/work/bin/agent-memory-finalize`.

## STATUS BLOCK

- paywall-bot PR head: `9c272d9ba7cafec08377c0b50f5be51f0dd22bd6` (PR #105
  OPEN, CI green, Codex clean, Gate green, Merge Bot blocked by PAT
  permission). main unchanged by this task.
