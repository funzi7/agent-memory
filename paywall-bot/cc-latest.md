# paywall-bot handoff — 2026-09-21 UTC (PR #104: Autonomous Runtime Ops v1 — TheMarker pilot)

## Headline

TheMarker no longer routes runtime trouble through the owner. PR #104 adds a
deterministic runtime incident controller (`core/runtime_ops.py`) that runs in
phase 4 of every poll in place of the legacy owner-DM lifecycle for tenants
that enable it, a trusted GitHub-write layer (`tools/runtime_ops_github.py` +
a separate `poll.yml` step holding AUTOMATION_PAT), a dispatch-only no-AI
smoke workflow, and the three still-open §18 fixes. The owner is DM'd only
for `OWNER_ACTION_REQUIRED`, plus one "נפתר אוטומטית" cancel when such a
condition clears by itself. Tech Feed IL is byte-for-byte unchanged.

**Read `docs/themarker-runtime-ops-20260921.md` (ADR) and
`reports/themarker-runtime-ops-20260921.md` (evidence) before touching
TheMarker alerting again.** The 2026-08-29 owner-DM lifecycle is
`SUPERSEDED — owner approved` for TheMarker only (reason: 22 non-actionable
outage DMs in eight days, 2026-09-13..21, none of them a real 24h reminder).

## Git / PR state (exact)

- Starting `origin/main`: **`c4c7c38671a84431659a26efc1df076e0af0c946`**
  (`state: techfeedil 2026-09-21T04:25:02Z`; local main was 137 state
  commits behind and was fast-forwarded, never reset).
- Branch: `feat/themarker-runtime-ops-v1-20260921` (owner namespace → no
  `automerge` label needed; `isOwnerSameRepo` qualifies for Merge Bot).
- Commits: `25564fc` (implementation) → `7010004` (review round: Codex 2 P1 +
  1 P2 and the independent Claude review's 5 P1 + 7 P2 fixed; docs, ADR,
  evidence report) → `e98c8de` (Codex round 2: 3 flash-origin P2s) →
  `df1b3a8` (Codex round 3: fatal-path evaluation, per-run send-failure
  list) → `c9c5fdc` (Codex round 4: phase-1-only flash evidence, open
  incident cap + overflow, per-crash poll key) → sixth commit (Codex round
  5: merged-flag gate, row-outcome evidence, crash origin, pending flash)
  → `e7dc60d` (Codex round 6: rolling-24h digest loss count) → `bd6ca17`
  (Codex round 7: PR labels for `needs-owner`, closed-unmerged PR) → ninth
  commit `d303b56` (Codex round 8: credential-independent owner Issue,
  `ChannelNotConfigured`, `missing_title` unverified) → `b6a40aa` (Codex
  round 9: failed flashes kept, action list never drops pending) →
  `6d41347` (Codex round 10: phase-1 exceptions classified, failed records
  never wedge the queue) → `3ebd892` (Codex round 11: pending flash
  front-of-line, owner-Issue labels verified, owner-Issue retry backoff) →
  `9dc8419` (Codex round 12: terminal phase-2 exceptions observed, phase-2
  exceptions keyed by origin) → `39a723e` (Codex round 13: owner
  Issue reset per epoch, recorded Issue number fetched directly) →
  `039ec5c` (Codex round 14: a reopened epoch starts with empty
  repair metadata; a reused Issue's `claude-fix` label is re-triggered) →
  `7be7da8` (Codex round 15: owner-notification bookkeeping reset
  per epoch; the re-trigger reconciled against GitHub's own label events) →
  `0ab7425` (Codex round 16: flash replay deduplicated by identity,
  one AI request counted per action, same-second label events reconciled,
  oldest-first comment/event pagination, legacy cancel DM preserved) →
  `80e06e8` (round 17) → `b99af18` (round 18) → `8c3c91b` (round 19) →
  `d4e7d9a` (round 20) → `73b4474` (round 21) → `66174b2` (round 22) →
  `f8ad171` (independent-review follow-ups: a repair PR judged by when it
  finished, the Issue marker families kept apart) → `ea25a97` (round 23) →
  … one commit per Codex round … → `c70746d` (round 49) → `e5324d7`
  (round 50). **56 commits** on the branch (`git log --oneline
  origin/main..HEAD`): the implementation, 49 titled `Codex round N`
  (rounds 1-13 predate that convention and are folded into the earlier
  commits above), the independent-review follow-ups, and two docs commits.
  §8a of the evidence report lists every round with the head it reviewed
  and the commit that fixed it.
  FINAL HEAD: see the status block at the end of this file.
- PR: https://github.com/funzi7/paywall-bot/pull/104 — OPEN at hand-off.
- Exact-head CI: green on every pushed head; the final one is in the status
  block.
- **Merge path is physically blocked by the repository, not by this PR:**
  `AUTOMATION_PAT` returns 401 on every CI Doctor / Merge Bot / watchdog run
  since 2026-09-08T20:23Z (CI Doctor `35533738707`, Merge Bot `35562244017`,
  watchdog `35568028376`: `HttpError: Bad credentials`). Merge Bot therefore
  cannot merge anything; the Codex Gate (GITHUB_TOKEN-only) still runs.
  **No manual merge was performed** — the owner must renew the PAT or direct
  the merge explicitly (PR #103 precedent).

## Architecture (what shipped)

- **State machine** `SELF_HEALING → WAITING_EXTERNAL / CODE_FIX_CANDIDATE →
  FIX_IN_PROGRESS → VERIFYING_FIX → RESOLVED`, plus `OWNER_ACTION_REQUIRED`.
  Tenant-local bounded record `state["runtime_ops"]` (schema 1): incidents
  keyed by `sha256(tenant|kind|key)[:16]`, epochs on material new evidence,
  history ≤ 20, ≤ 3 representative identities, ≤ 5 requested actions
  (`pending|applied|failed|withdrawn`), ≤ 10 fatal records, `github` block,
  `counters`, `cutover`. Every field is normalized on load (nulls/foreign
  schema never raise). `evaluate()` is pure and takes `now`; `observe_poll()`
  logs `RUNTIME-OPS …` lines and sends DMs, marking notification only after
  a successful send; `record_poll_fatal()` runs from `main()`'s except.
- **Kinds/classes**: `external_extraction_outage` (WAITING_EXTERNAL,
  runbook `provider_outage_wait`), `external_publisher_api`,
  `external_telegram_api`, `backlog_drain` (safe queue work),
  `internal_publication_boundary` (`telegraph_validation_failed:*` /
  `telegraph_render_failed:*`), `internal_channel_message_format`
  (`telegram_send_failed:BadRequest|MessageValidationFailed`),
  `internal_phase1_exception` (bounded per-poll list from `_phase1_discover`),
  `internal_phase2_exception`, `internal_poll_fatal`,
  `internal_accounting_invariant` (`sum(pub_*) != posted`),
  `owner_github_credential`, `owner_telegram_credential`
  (`Forbidden|Unauthorized|InvalidToken|NotConfigured`). Internal kinds become
  CODE_FIX_CANDIDATE only on 2 distinct items or the same item on 2 polls;
  `posted=0` is never evidence; a big parked queue is never a code defect.
  Phase-1 FLASH send failures are classified from the `tg_bot` send-failure
  latch (they leave no queue row).
- **Runbooks** (registry in `core/runtime_ops.py`): `provider_outage_wait`,
  `provider_rate_limit_wait`, `backlog_drain`, `retry_neutral_park`,
  `bounded_transient_retry`, `versioned_state_recovery`,
  `internal_code_escalation` (the ONLY one with `uses_ai=True`),
  `owner_credentials_required`, `repair_verification`. A poll that crashes
  before phase 4 is evaluated from `main()`'s fatal path (`record_poll_fatal`
  → `observe_poll`), so a repeating crash becomes a code-fix candidate on its
  second occurrence and the always-on sync step opens the Issue.
- **AI budget / single flight**: one active code-fix incident
  (`active_code_fix`); others queue in `code_fix_queue`; the slot is released
  on RESOLVED, on the Issue observed closed, on a merged repair
  (VERIFYING_FIX — documented decision), or on a failed Issue request; it is
  HELD while the active incident is OWNER_ACTION_REQUIRED with an Issue. One
  Issue per (fingerprint, epoch); a new cycle needs material new evidence,
  bounded by `max_code_fix_cycles: 2` → then owner action. Quota/billing
  failure of the fixer changes nothing and never DMs.
- **Verification**: merge → VERIFYING_FIX with the merge SHA; RESOLVED only
  after `verification_min_polls: 3` AND the failing path was exercised (an
  extraction-sourced publication for boundary/format defects; a phase-2
  attempt for phase-2 exceptions, at the STAGE and extraction provider the
  origin names; for a fatal, a poll that reached the phase its crash origin
  places it in — never merely a poll that ended; a poll with
  publications for accounting) AND no recurrence.
- **Owner DM policy (TheMarker)**: only OWNER_ACTION_REQUIRED — start,
  update when the required action changes, ≤ 1 reminder / 24h, one cancel
  on auto-resolution. Hebrew, MarkdownV2, lint-clean; answers what broke /
  what was tried / why it cannot continue / what is needed / one link.
  A Telegram-credential incident (whose DM would use the failing token) and
  any owner-action DM that failed twice also request ONE `needs-owner`
  GitHub Issue via the trusted step (never `claude-fix`, auto-closed on
  resolution) — the credential-independent path (GitHub notifications +
  central Morning Report).
  Cutover: the legacy `alerting.incident` open at rollout (pipeline_outage
  since 2026-09-19T09:15:46Z) is recorded and the outage incident carries
  `owner_notified_via = legacy_alerting`, so the owner gets exactly one
  cancel when the current outage recovers. `state["alerting"]` untouched.
- **Digest**: plain-text section appended to the existing daily health DM
  (`core/health.py::_compose_dm`) only when there was activity in 24h or an
  incident is open. No new cron. The central Morning Report ingests CI/PR
  loop state only (verified) — application ingestion is a NEXT for
  automation-core.
- **Trusted writes**: poll records `requested_actions`; `poll.yml` step
  `Runtime Ops GitHub sync` (between "Run poll" and "Commit state",
  `if: always()`, `timeout-minutes: 3`; job timeout raised 12 → 16) runs
  `python -m tools.runtime_ops_github apply --site themarker` with
  `RUNTIME_OPS_GITHUB_TOKEN = AUTOMATION_PAT` (writes) and `GITHUB_TOKEN`
  (reads; `permissions` gained `issues: read`, `pull-requests: read`).
  Find-or-create by marker `runtime-incident:v1 tenant=themarker
  fingerprint=<fp> epoch=<n>` (whole-token match), labels `runtime-incident`
  + `claude-fix` (label re-applied if it did not land; the AI counter moves
  only when it lands), same-fingerprint earlier-epoch open Issue → comment +
  body marker append, Issue number reconciled into state before the commit,
  Issue/PR/merge lifecycle read into `code_fix.observed`
  (least-recently-observed first, budget 40). 401 / non-rate-limit 403 →
  `github.credential_failure`, exit 0 → owner-action DM next poll; other
  4xx on create → `code_fix.request_failed` → owner action + slot released;
  malformed payloads → `unhandled:<Type>` recorded, exit 0 (never a red
  step, so CI Doctor never opens an AI Issue about the supervisor);
  `runtime_ops.enabled: false` → no-op.
- **Smoke**: `.github/workflows/runtime-ops-smoke.yml` (dispatch only;
  `python -m tools.runtime_ops_github smoke`): auth probe → label →
  create marked Issue with `runtime-ops-smoke` only (asserts `claude-fix`
  absent) → find by marker → no duplicate → edit → close; JSON line +
  step summary; exit 0 on credential failure.
- **§18 fixes**: one per-poll publication budget across phase-1 flash and
  phase-2 (`flash_capped`, `published_before`; a refused OR failed flash is
  kept in `state["pending_flash"]`, ≤20 entries / 24h, and replayed ahead of
  new discovery next poll); `CONTENT_UNVERIFIED` for
  `site_validation:* / content_validation:* / site_prepare_rejected /
  premium_talkback_section / site_quality_check_error / missing_title`
  (never health, never availability evidence, never latches). `missing_title`
  is deliberately NOT positive health: it is emitted before the
  landing-page/language checks, so a titleless provider landing page would
  clear a real outage (§18C verified and closed the other way).
- **Config**: `runtime_ops:` block in `sites/themarker/config.yaml` only
  (enabled, autonomous_code_fix, immediate_owner_alerts:
  action_required_only, daily_digest, single_flight_code_fix,
  candidate_min_distinct_items 2, candidate_min_polls 2,
  self_heal_resolve_polls 5, verification_min_polls 3, repair_stall_hours 48,
  max_code_fix_cycles 2, owner_reminder_hours 24 (clamped ≥ 1),
  max_incidents 25, history_limit 20).
- **Operator CLI**: `python -m core.runtime_ops status|replay --site themarker
  [--state-file <copy>]` (read-only / dry run, never writes, never logs to
  the tenant log); `python -m tools.runtime_ops_github status|smoke`.

## Production fixture classification (copy-only replays, nothing written)

| Snapshot | Legacy behavior | Runtime Ops v1 |
| --- | --- | --- |
| Live outage `5e7f4e6` (2026-09-21T00:55Z; 138 parked; jina 403 / smry no_body / one3ft 503 / wayback no_snapshot) | DM on 6 of the last 7 polls | `WAITING_EXTERNAL`, 0 DMs, 0 AI, runbook `provider_outage_wait`; cutover cancel DM on recovery |
| Healthy recovery `c0e90fd` (2026-09-15) | recovery DM + new start DM same day | `backlog_drain` SELF_HEALING, no DM |
| U+200F boundary `400d1f7` / `2f5038b` | manual investigation | `CODE_FIX_CANDIDATE`, one requested Issue, same fingerprint from both, body-free packet |
| Credential-failure fixture | n/a | one actionable DM naming AUTOMATION_PAT + settings link; silent repeat; one cancel on renewal |
| Two code incidents fixture | n/a | second queued; promoted only when the first merged; merge → VERIFYING_FIX (never RESOLVED by merge) |

The digest rendered on the live copy and the health DM composition are in the
evidence report §2.

## Review

- **Codex** auto-reviewed `25564fc` (07:29–07:35Z): P1 flash-send failures
  unclassified; P1 failed Issue request held the single-flight slot forever;
  P2 missing `claude-fix` label marked applied. All fixed in `7010004`,
  replied to and resolved (0 unresolved threads on that head).
- **Independent Claude Code review** (Opus reviewer separate from the three
  implementing agents; `review_provider = claude_code_fallback` in the
  DEVELOPMENT_RULES §12 sense — run in addition to Codex because the synced
  fallback-review contract is not installed here, NOT as a Codex substitute)
  on `25564fc`: 5 P1 + 7 P2 + P3s + 22 surviving mutations. All P1/P2 fixed
  in `7010004` (one P2 — releasing the slot at VERIFYING_FIX — kept as a
  documented decision); 22 mutation-killing tests added. Full list in the
  ADR "Review-driven hardening" section.
- Codex on `7010004`: 3 P2 (a Telegram-credential incident "recovered" on
  quiet polls that exercised nothing; a flash-origin incident could never
  satisfy the URL-based recovery check; a flash-origin fix was verified by
  unrelated article publications) — fixed in the third commit (credential
  recovery requires a successful send; `evidence.flash_recovered` from a
  phase-1 success; per-route `flash_exercised` / `article_exercised`
  verification), replied to and resolved.
- Codex on `e98c8de`: 1 P1 + 1 P2 (a consistently crashing poll never
  reached the evaluation, so fatal records piled up without an incident —
  `record_poll_fatal` now runs `observe_poll` immediately and each record
  counts once; the send-failure latch kept only the last outcome —
  `tg_bot.send_failures()` keeps the bounded per-run list) — fixed in the
  fourth commit, replied to and resolved.
- Codex on `df1b3a8`: 2 P2 (the flash collector consumed phase-2 article
  failures too — the poll now snapshots phase-1 failures before phase 2;
  open incidents were unbounded — refused at `max_incidents` and coalesced
  into one counted `overflow` record, owner-action exempt). That head's CI
  also failed on `test_record_poll_fatal_evaluates_immediately…`: under the
  Actions env two crashes shared the run URL as poll identity — the fatal
  path now carries `poll_key=fatal:<ts>`. Fixed in the fifth commit,
  replied to and resolved.
- Codex on `c9c5fdc`: 1 P1 + 3 P2 (GitHub's prospective `merge_commit_sha`
  on an OPEN PR was taken as a merge — tool and core now require the merged
  flag; `post_cap_reached` counted as phase-2 work — row outcomes only;
  fatal fingerprints by exception class only — bounded sanitized
  `file:function` origin now in the record/key/signature; budget-refused
  flashes not persisted — bounded 24h `pending_flash` queue replayed first
  next poll). Fixed in the sixth commit, replied to and resolved.
- Codex on `881c287`: 1 P2 (the digest's proven-loss line summed whole
  UTC-day buckets — now a rolling 24h count of unrecovered
  `terminal_failures`, like the health report). Fixed in the seventh
  commit, replied to and resolved.
- Codex on `e7dc60d`: 2 P1 (the ladder's `needs-owner` lands on the repair
  PR, not the Issue — the sync now records `observed.pr_labels` and core
  escalates from either; a repair PR closed without merge stayed
  FIX_IN_PROGRESS and held the slot forever — now a terminal owner action
  `repair_pr_closed_unmerged`). Fixed in the eighth commit, replied to and
  resolved.
- Codex on `bd6ca17`: 2 P1 + 1 P2 (an `InvalidToken` incident was DM'd with
  the failing bot token → Telegram-credential incidents and any owner DM
  that failed twice now also request a `needs-owner` GitHub Issue via the
  trusted step (`runtime-owner-action:v1` marker, `incident.owner_issue`,
  auto-closed on resolution, never `claude-fix`); a chat/rights
  `BadRequest` is a destination misconfiguration → synthetic
  `ChannelNotConfigured` → owner action `telegram_channel_misconfigured`;
  `missing_title` must not prove health → `CONTENT_UNVERIFIED`, §18C closed
  the other way). Fixed in the ninth commit, replied to and resolved.
- Codex on `d303b56`: 2 P1 (a FAILED flash was not kept for retry → the
  pending-flash queue now keeps failed flashes too; the requested-actions
  list truncated pending requests at the cap → `_append_action` refuses
  instead, `requested` flags are set only when queued, `_bound_actions`
  drops finished records first, `_ensure_close_requests` re-requests a
  refused Issue close until the post-step records `closed_at`). Fixed in
  the tenth commit, replied to and resolved.
- Codex on `b6a40aa`: 1 P1 + 1 P2 (phase-1 exceptions were counted but never
  classified → the poll records a bounded per-poll list {exc_type, origin,
  link} and core classifies `internal_phase1_exception`, promoted like
  phase-2 exceptions, verified by a handled phase-1 item; five failed action
  records could wedge the queue → cap counts pending only, failed records
  pruned once `code_fix.request_failed` is on the incident). Fixed in the
  eleventh commit, replied to and resolved.
- Codex on `6d41347`: 3 P2 (a still-listed pending flash stayed at its
  ordinary position → replayed first with the feed's own item, deduplicated;
  an owner-action Issue created without `needs-owner` was marked applied →
  every requested label is verified/re-applied before completion; a
  rejected owner-Issue request landed on `code_fix.request_failed` and was
  never retried → recorded on `owner_issue.request_failed`, retried once per
  6h backoff). Fixed in the twelfth commit, replied to and resolved.
- Codex on `3ebd892`: 2 P2 (a phase-2 exception on a row's last retry
  terminalized it and the terminal record was skipped → observed like
  deferred rows; phase-2 exceptions keyed by class alone → `_phase2_retry`
  stores `runtime_ops.crash_origin(exc)` as the row's subreason for
  runtime-ops tenants and the key/signature include it). Fixed in the
  thirteenth commit, replied to and resolved.
- Codex on `9dc8419`: 1 P1 + 1 P2 (a reopened Telegram-credential incident
  kept the previous epoch's closed owner-Issue number and never requested a
  new one → `_reset_epoch` resets `owner_issue` keeping
  `previous_issue_number`; an Issue created without labels could not be
  found by the label-filtered marker listing on retry → the recorded number
  is fetched directly first). Fixed in the fourteenth commit, replied to
  and resolved.
- Codex on `39a723e`: 2 P1 (a reopened incident inherited the previous
  epoch's repair metadata, so the old epoch's merged PR drove the new one
  straight into `VERIFYING_FIX` on a superseded SHA and no new repair was
  ever requested → `_reset_epoch` clears `code_fix`/`verification`, keeping
  the old Issue/PR/merge SHA under `code_fix.previous`; a new epoch reusing
  an Issue that already carried `claude-fix` never woke the fixer, because
  it runs on `issues.opened`/`issues.labeled`/an owner `@claude` comment and
  a bot comment is none of those → the label is removed and re-added before
  the epoch marker is appended, so a failed re-trigger retries next poll;
  an escalated `needs-owner` Issue is never re-triggered). Fixed in the
  fifteenth commit, replied to and resolved.
- Codex on `039ec5c`: 2 P2 (a reopened epoch kept `owner_notified` and its
  signature, so a recurrence inside the reminder window sent no DM at all —
  `_reset_epoch` now clears the notification, reminder and DM-failure
  bookkeeping; the label re-trigger was idempotent only against an orderly
  retry — the epoch comment is now read back from GitHub and a `claude-fix`
  `labeled` event newer than it is taken as proof the fixer was already
  woken, with the AI counter moving there). Fixed in the sixteenth commit,
  replied to and resolved.
- Codex on `7be7da8`: 3 P2 (a pending flash whose URL differed only by the
  live-blog query was replayed AND left in the fresh list, so one article
  would post twice in a poll → both sides compared by `_dedup_key`, the
  reorder extracted into `_flash_replay_order`; the AI counter moved before
  the action could still fail, so a pending retry counted the same fixer run
  every poll → a per-action `ai_counted` flag; a `labeled` event in the same
  second as the epoch comment read as "not woken" → whole-second comparison,
  anchor inclusive). An independent review added a fourth: the epoch reset
  cleared the legacy-alerting cutover marker, dropping the single cancel DM
  for good → that marker is now preserved. Issue comments and events are
  served OLDEST first, so the lookups now use `since`, walk to the last
  event page, and read the last comment page in the sync. Fixed in the
  seventeenth commit, replied to and resolved.
- Codex rounds 17-22 (heads `0ab7425`, `80e06e8`, `b99af18`, `8c3c91b`,
  `d4e7d9a`, `73b4474`): 15 findings, every one valid and fixed with a
  mutation-verified test — the pending-flash queue keyed by identity, the
  phase-1 route recorded by the poll instead of inferred from a stack
  frame, `flash_capped`/`dedup_skipped` dropped as verification evidence
  (and `dedup_after_fetch` added back for the post-chain dedups), ladder
  labels persisted whole, the comment/event lookups paged from the right
  end with bounded "I could not look" answers, epochs kept apart in the
  sync (superseded closes withdrawn, an earlier epoch's finished PR
  ignored, the stall clock restarted at the attach), an unexercised repair
  escalating to the owner and returning from it, and the daily digest
  reserved room in the health DM. Independent reviews on each head found 14
  more, including three regressions of the round before them. Every thread
  replied to with its fixing SHA and resolved.
- Codex rounds 23-50 (heads `ea25a97` … `c70746d`, one commit per round):
  50 further findings, all valid, all fixed with mutation-verified tests.
  Two themes. (1) The repository is PUBLIC, so anything a stranger can
  write is untrusted input: a provenance comment, a planted Issue carrying
  the marker, a fork pull request claiming `Fixes #N`, a page of decoys
  crowding the search, and finally the next epoch's marker comment itself
  — each is now either authenticated (`_trusted_author`,
  `_is_automation_repair`) or answered "I could not look" with a bounded
  wait, never adopted. (2) Verification must name the exact thing that
  broke: the stage a phase-2 row reached (`stage=fetch|parse|fingerprint|
  publish|send`, with the excerpt moved into `send`), the phase-1 route,
  which of the two dedups ran, and which extraction provider delivered —
  measured against a baseline taken from BEFORE the poll that could have
  proven the fix, because the GitHub sync runs after the poll. Several
  rounds caught regressions introduced by the round before them.
- Codex round 50 (head `c70746d`) was the last that found anything. Its fix
  is `e5324d7`, and Codex's review of THAT head completed with no findings:
  see the status block. Rounds 42-50 were each a single finding one layer
  deeper in the same seam — the GitHub sync runs AFTER the poll, so a merge
  can land between two syncs and the poll in between runs repaired code
  while the record still says "not merged". The end state: the poll records
  the revision it ran, the sync asks GitHub whether that revision contains
  the merge commit, the transition WAITS (bounded) for that answer rather
  than using the poll's start time, and a recurrence judged to be on merged
  code spends a repair cycle instead of entering verification.
- **Claude fallback ATTESTATION NOT minted**: paywall-bot's `codex-gate.yml`
  / `merge-bot.yml` / `claude-fallback-watchdog.yml` predate automation-core
  PR #56 and `claude-fallback-review.yml` is absent (sync workflow
  `disabled_manually`, last run 2026-08-30); `CLAUDE_FALLBACK_REVIEW_ENABLED`
  deliberately NOT set (the task's precondition "synced workflow matches the
  trusted central version" does not hold). Nothing was faked.

## Validation actually run

- `python -m unittest discover`: **661 → 1128 OK** (`test_runtime_ops` 220,
  `test_runtime_ops_github` 171, `test_runtime_ops_integration` 33,
  `test_provider_taxonomy_2xx` 12, `test_publication_budget` 31);
  `python -m tests.test_message_format` green (new lint section for the
  owner DMs); `compileall`; 17 workflow YAMLs parse; `bash -n`; `node
  --test` 21; `git diff --check`; `state/` byte-clean after every run.
- Tech Feed IL safety: `test_techfeedil`, `test_techfeedil_wave2`,
  `test_source_health` + full discovery green; the integration suite asserts
  Tech Feed IL still calls `check_and_alert` and writes no `runtime_ops`.
- Copy-only replays of 4 committed snapshots + 2 synthetic fixtures (above).
- Adversarial state shapes (nulls, foreign schema, garbage actions) evaluate
  without raising (14 tests).

## NOT verified physically (do not claim)

1. **Real no-AI GitHub write smoke**: `gh workflow run runtime-ops-smoke.yml
   --ref <branch>` → HTTP 404 (a `workflow_dispatch` workflow is registered
   only once it exists on the default branch). Run it after merge; expected
   result on the current credential: `credential_failure` (401), exit 0.
2. **The autonomous chain** Issue → Claude Fixer → PR → Gate → Merge Bot →
   verification: blocked by the dead PAT. No Claude/Codex quota was spent to
   manufacture a defect.
3. **Post-merge scheduled polls** under the new policy (no generic outage DM;
   incident persisted across fresh Actions processes; sync step exiting 0
   with the credential classification; the first owner-action DM = renew the
   PAT; the cutover cancel DM on a natural provider recovery).

## NEXT

0. **Owner**: renew `AUTOMATION_PAT` (repo + workflow scopes); re-enable
   `Sync from automation-core` and let the sync PR deliver the PR #56
   fallback-review workflows; only then consider
   `CLAUDE_FALLBACK_REVIEW_ENABLED=true`. Merge PR #104 via the normal path
   once Merge Bot works (or direct the merge explicitly).
1. After merge: dispatch `Runtime Ops Smoke`; watch the first polls (expect
   `RUNTIME-OPS … WAITING_EXTERNAL`, one `automation_pat_rejected` DM, no
   outage DMs); append §10 of the evidence report.
2. automation-core NEXT (documented in CONTEXT.md): Morning Report ingestion
   of the standardized `runtime_ops` block; add "Poll & Post" /
   "Runtime Ops Smoke" to CI Doctor's ignore sets if they must never spawn
   `claude-fix`; GitHub App installation tokens replacing the renewable PAT.
3. Phase 2 safe auto-rollback (automation-generated, rollback-safe repair
   PRs only) — v1 records PR number/head/merge SHA for it.
4. one3ft prewarm/wake + independent full-body backup provider (unchanged;
   the current outage is exactly this). PR #101 Tech Feed IL source_health
   P2s remain open (out of scope by instruction).

## Rules note

`DEVELOPMENT_RULES_FULL.md` read in full first; preflight complete
(pwd/repo/branch/HEAD/tracking/status/diff/cached/remotes/origin-main/log/
open PRs; all listed state, config, core, workflow, test and handoff files;
automation-core main read-only). Four read-only Opus investigators, three
Opus implementers per round (disjoint files), one independent Opus reviewer.
No `reset`/`clean`/`restore`/`stash`/`force-push`; the only `checkout --`
calls restored a test's accidental append to the tracked log (agent C,
inspected first). agent-memory finalized ONLY through
`/root/work/bin/agent-memory-finalize`. No production state edited by hand;
no Telegram or Telegraph write occurred; no AI quota spent on fixtures.

## STATUS BLOCK (filled at finalization)

- FINAL HEAD: **`e5324d77b2d351fb94b717933e4f2f91577aaf53`** (round 50's fix,
  pushed 2026-09-21T20:13Z). 56 commits on
  `feat/themarker-runtime-ops-v1-20260921`. Nothing was pushed after it: a
  docs-only commit would move the head and retire the clean Codex review
  below, and every round's fix commit already carries its own documentation.
- Exact-head CI: **success** (`CI` run `35649726335` on `e5324d7`:
  `unittest discover` 1128 OK, `test_message_format`, `compileall`,
  17 workflow YAMLs, `bash -n`, `node --test` 21, `git diff --exit-code --
  state/`, `git diff --check`). `test-message-format` SUCCESS in the PR
  rollup.
- Codex on final head: **clean**. The review summary comment records
  `📝 Code Review — ✅ Completed 2026-09-21T20:20:27Z — commit e5324d7 —
  New commits`, with no review body and no inline comment: that is how a
  Codex review with NO findings appears. Review threads on the PR:
  **100 total, 0 unresolved** — every one answered with its fixing SHA and
  resolved. 50 review rounds in all (rounds 1-50, one fix commit each);
  every finding was judged valid and fixed with a test that fails when the
  fix is reverted.
- Gate `check-codex-status`: **SUCCESS** on `e5324d7`.
  `codex-gate-evaluator` first ran at 20:13Z, seconds after the push and
  before Codex had reviewed ("⏳ pending — Codex has not reviewed head
  e5324d7"), and failed; it was RE-RUN after the review landed (run
  `35649722125`, attempt 2) and both jobs are now green. No Gate change, no
  override label, no `codex-p1-acknowledged`, no fabricated signal.
  `gh pr view 104`: `mergeable=MERGEABLE`, `mergeStateStatus=CLEAN`.
- Merge: **NOT MERGED — PR #104 is OPEN.** Merge Bot still cannot act:
  run `35673534084` (2026-09-22T00:50Z, job `106575110691`) ends
  `RequestError [HttpError]: Bad credentials / status: 401`, the same
  `AUTOMATION_PAT` rejection seen on every CI Doctor / Merge Bot / watchdog
  run since 2026-09-08T20:23Z. **No manual merge was performed.** The owner
  must renew `AUTOMATION_PAT` (or direct the merge explicitly, PR #103
  precedent); the autonomous chain Issue → Fixer → PR → Gate → Merge Bot →
  verification therefore remains implemented and unit-tested but NOT
  physically demonstrated end to end.
