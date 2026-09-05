# paywall-bot handoff — 2026-09-05 UTC (PR #102 OPEN: TheMarker outage probe rotation + current-item probe)

## Headline

The 2026-08-15/08-29 active-outage design re-probed **one** representative row
per poll: `ready[0]`, the oldest ready row. Parked rows never advance their
retry counter and never leave the queue, so that is the SAME identity for the
whole outage. Committed production state proves the consequence over the
2026-08-26 → 2026-09-05 outage (10.08 days): **all 15 polls** between the #101
merge (`718145dd`, 2026-08-29T16:55Z) and the recovery poll (`15b1047`,
2026-09-05T15:52Z) sent the same row through the external chain —
`themarker.com/technation/2026-08-11/ty-article/.highlight/0000019f-f0c7-…`
(first seen 2026-08-11T14:12:27Z, `retry_count` frozen at 4, the only row
carrying `last_attempts` in every revision); `extraction_outage.probe_count`
rose 11 → 25, one per poll, while the backlog grew 93 → 146 rows. **145 rows
never received one external attempt.** That row was unextractable: on the
recovery poll it answered `one3ft=paywalled_partial_body` /
`wayback=no_snapshot`, spent retry 5 and terminalized. The breaker read ten
days of evidence from an article no configured provider was going to serve,
and no current article could publish externally or contribute recovery
evidence. The mechanism worked as specified; the specification was wrong.

## Git/PR state (exact)

- Branch: `fix/themarker-representative-rotation-20260905` (owner-namespace,
  NOT `claude/*` → legitimate Merge Bot candidate with no label needed).
- Base: `origin/main` `e9b342cf2bcb2f309bbb9ff8ecc9d8431ccb6c47`.
- Commits: `1bb859c` (rotation) → `f6f23ad` (review pass 1 fixes) →
  `4b0e387` (review pass 2 fixes) → `cb8ff9f` (docs precision) →
  **HEAD `8663cb92e5f1a5dbaf08603c4b22280e4dba5edf`** (Gate/backlog
  documentation). The last two carry no code change.
- PR: https://github.com/funzi7/paywall-bot/pull/102 — **OPEN**, with an
  owner-facing status comment (5553917309) laying out the three merge
  options.
- **CI green on EVERY head**: `test-message-format` pass on `1bb859c`
  (run 33982698357, 1m7s), `f6f23ad` (run 33983248763, 1m9s), `4b0e387`,
  `cb8ff9f` (run 33983969747, 1m0s) and `8663cb9`.
- **Codex capacity is BACK** — the first real signal since the 2026-08-29
  quota notice on #101. A genuine Code Review ran on `1bb859c`
  (2026-09-05T18:00:40Z) and **found two real defects**, both fixed in
  `f6f23ad` with regression tests, replied to on their threads, and resolved:
  - **P1 — cursor durability.** An in-memory advance is not an advance:
    `run_poll`'s only unconditional `save_state` is at its very end and the
    poll job is killed at its 10-minute timeout on an ephemeral runner, so a
    poll that kept dying mid-way would reload the old cursor and re-probe the
    same representative forever. Fixed with `_checkpoint_probe_rotation`
    (persist before the first external chain, best-effort) **plus**
    `.github/workflows/poll.yml` committing tenant state with `if: always()`
    — matching the Tech Feed IL poll workflow. That `always()` also hardens
    the pre-existing `checkpoint_after_publish` duplicate-post guard, whose
    local write had exactly the same gap.
  - **P2 — seed the cursor at outage establishment.** The establishing poll
    plans while the outage is still inactive, so no cursor exists and the next
    poll picks position 0 — the same row that just established the outage.
    `_record_themarker_outage_probe` now seeds the cursor with that row; a
    cursor still pointing at a live deferred row is never overwritten, a
    stale one is replaced.
  A second Codex review (of `f6f23ad`, trigger: new commits) then found **two
  more real P2s in the fixes themselves**, both addressed in `4b0e387`:
  - **the establishing poll was still not durable** — it plans as an ordinary
    poll, carries no probe plan, and so never reached the pre-chain
    checkpoint; the `always()` step could only commit unchanged on-disk state.
    `_record_themarker_outage_probe` now checkpoints on the inactive → active
    transition (renamed general helper `_checkpoint_poll_state`), so the
    outage record and its seed both survive a killed run;
  - **a cursor left by a PREVIOUS outage could decide the next one** — the
    "never overwrite a live cursor" guard skipped seeding whenever the old
    cursor's row was still deferred, and if the new establishing row followed
    it in oldest-first order the next poll re-probed the establishing row. The
    rotation belongs to the INCIDENT: establishment now always replaces the
    cursor, while seeding still runs only on the inactive → active transition
    so a latched outage's live cursor is never touched.
  Side effect handled: establishment now writes the state file, so
  `tests/test_themarker_extraction_outage.py` (which inherited the tracked
  `state/themarker.json` from `set_site_context`) redirects the state file
  into its temp dir — CI runs that module individually and enforces
  `git diff --exit-code -- state/`.
  All four threads were replied to and resolved after the fixes landed.
- **Review passes 3 and 4 came back CLEAN** — `4b0e387` (completed
  2026-09-05T18:23:28Z) and the final head `cb8ff9f` (completed
  2026-09-05T18:27:16Z), no new findings; zero unresolved review threads on
  the PR. Codex also left the clean-result 👍 reaction.
- **Gate is RED for a structural reason, not a finding** (verified in the
  workflow source, not guessed). `check-codex-status` on `cb8ff9f` reports
  *"🟡 Waiting for Codex review — Codex has not reviewed head cb8ff9f."*
  `.github/workflows/codex-gate.yml` computes
  `hasCodexSignalOnHead = allBodies.some(onHead) || codexReactionOnHead`,
  where `signalTargetsHead` (:213-226) binds a signal to the head ONLY via a
  comment/review `commit_id`, `original_commit_id`, or a
  `**Reviewed commit:** \`sha\`` marker, and the 👍-reaction path
  (`onlyObservedHead`) is allowed only when marker history proves the PR
  never had another head. A CLEAN review posts no inline comment, so it
  carries no exact-head binding; #102 has had four heads, so the reaction
  path is refused too. Consequence: **any PR that needed a fix round can
  never reach a green Gate through a clean final review.** That is a Gate
  design gap, and it was NOT worked around here — no override label
  (`codex-p1-acknowledged`), no fabricated `Reviewed commit` marker (which
  the Gate would reject anyway: only `chatgpt-codex-connector` logins count),
  and no edit to the Gate/Merge-Bot/automation-core to make my own PR
  mergeable. Owner options, in the owner's hands: (a) a manual SHA-pinned
  squash merge as with #100/#101, now on top of a genuinely clean multi-pass
  Codex review; (b) extend the Gate to accept a completed clean review bound
  to the head (the connector's summary comment does contain the short SHA) or
  a 👍 that post-dates the last head observation with zero unresolved
  threads; (c) re-file the final tree as a single-commit PR so the
  reaction-only path applies.
- NO owner exception is requested or used here. Merge only after a green Gate
  or an explicit owner decision.
- **Retrospective Codex reviews REQUESTED** on 2026-09-05 (capacity is back):
  `@codex review` posted on #100 (comment 5553907913) and #101 (comment
  5553908086), each stating the merge SHA and the change set to audit. Their
  outcomes land after this handoff; any real P1/P2 → normal forward-fix PR.

## What changed (code)

`themarker_outage_probe_rotation` (TheMarker-only feature flag; off ⇒ previous
behavior byte-for-byte, and no rotation state is written at all):

1. **Rotating representative** — `_rotate_outage_representative` in
   `core/main.py`. The aged probe advances one step per poll through the
   oldest-first ready order (dedup key as stable tie-break), from a cursor
   persisted in tenant state under `themarker_probe_rotation`:
   `{last_probe_key, last_probe_index, ready_count, probe_count, updated_at}`.
   Persistence is mandatory, not an optimization: every poll is a fresh
   GitHub-Actions process, so an in-memory cursor would restart at the oldest
   row and reproduce the defect exactly. The cursor is a dedup KEY (a queue
   that grows/shrinks between polls cannot pin it; a vanished cursor falls
   back to the persisted poll counter, which still advances) and is written at
   selection time, so a poll that dies mid-way cannot re-pin the same row.
   Deterministic: identical state always yields an identical plan.
2. **Current-item probe** — the NEWEST ready row additionally gets its own
   full external chain, so today's article can publish during an outage and
   recovery evidence can come from a fresh URL instead of a 24-day-old one.
3. **Bounded cost** — `defer.outage_external_probes_per_poll` = 2, clamped
   1..4 in code (`MAX_OUTAGE_EXTERNAL_PROBES`). `_select_deferred_ready` is now
   a thin wrapper over `_plan_deferred_ready`, which returns
   `(ready_urls, external_probe_urls)`; `_process_ready_deferred` takes the
   probe list and lets exactly those rows past the poll-local latch (omitting
   it keeps the legacy single-probe behavior — the fallback all existing tests
   exercise). Everything else stays local-only (telegram/direct).
4. **Unchanged invariants, asserted by test** — probe rows park with ZERO
   retry burn while the systemic signature is proven; the provider-global
   per-run latch (threshold 2) means each systemically-failing provider is
   called at most twice per poll and probe rows 3+ record
   `unavailable_cached_for_run` with no request; providers answering
   item-specifically (Wayback `no_snapshot` ITEM_MISS, content rejects, smry's
   2xx shell) never latch off and never clear the outage, so they are re-asked
   per probe row by design; Tech Feed IL is untouched.

No provider was added or removed; fetch_chain, alert lifecycle, posting cap and
recovery ordering are unchanged.

## Measured (simulation on a COPY of live state — never the tracked file)

30 consecutive polls, live 146-row backlog, outage forced active:

| | distinct aged-probe rows | distinct rows probed | longest same-row run | external chains/poll |
| --- | --- | --- | --- | --- |
| before | 1 (0.7%) | 1 | 30 | 1 |
| after | 30 (20.5%) | 31 (21.2%) | 1 | 2 |

Full 146-row pass ≈ 146 polls ≈ 14.6 days at 10 polls/day. Coverage speed is
explicitly NOT the goal (during an all-provider outage extra probes prove
nothing) — evidence diversity per poll is. Observed poll wall-clock 52–92s vs a
10-minute job timeout, one3ft warm retry stays once per RUN ⇒ no runtime budget
added.

## Production evidence for PR #101 (all from committed state — now CLOSED)

16 post-merge polls, `errors: 0` in every one.
- **Alert suppression**: 4 owner DMs in 6.96 days — reminders 2026-08-30T15:10:05Z,
  2026-09-04T09:23:44Z, 2026-09-05T12:29:15Z (gaps 27.70h / 114.23h / 27.09h,
  never below the 24h contract) + one recovery DM 2026-09-05T15:52:25Z;
  `reminder_count` 1 → 3. Legacy 6h re-alerting would have sent dozens.
- **one3ft warm retry**: two independent `one3ft=http_status:503` attempts
  (`request_made: true` each) in every pre-recovery representative signature.
- **Wayback availability pre-check**: `wayback=http_status:503` →
  `wayback=no_snapshot` at the first post-merge poll, stable thereafter.
- **Recovery**: `recovered_at 2026-09-05T15:51:47.599017Z`,
  `recovery_source one3ft`, `recovery_reason provider_health_evidence` (a
  genuine 2xx article-specific rejection = the CONTENT_REJECT rule).
- **Flood safety**: the recovery poll (run 33976044896, 92s) published exactly
  4 = `posting.max_posts_per_run`; 3 via one3ft + 1 via direct (message ids
  885–888); all 4 were recent rows (newest-first), and 142 of the 146
  remaining rows stayed parked and untouched. Zero retry burn in every outage
  poll; the single `permanent_fail` came after recovery, on a real attempt.
- **Tech Feed IL Source Health**: at the 2026-09-05T07:51Z run all 7 open
  incidents share one `last_notified_at` — one aggregated digest per run, no
  per-publisher duplicates.

## Backlog reality at handoff

146 deferred rows (134 parked, 12 never probed); ages `<24h` 3, `24–48h` 33,
`48–72h` 0, `>72h` **110**; oldest 587.9h ≈ 24.5 days; `retry_count`
`{0: 130, 1: 4, 2: 3, 4: 9}`. Outage INACTIVE since 2026-09-05T15:51:47Z.

## Validation

`unittest discover` **610 OK** (575 → 610; +35 in
`tests/test_themarker_probe_rotation.py`: rotation advance, full-cycle
coverage, the 10-poll monopolization guard, JSON-restart persistence,
determinism, vanished-cursor advance, corrupt-state repair,
bounded/serializable state, current-item probe placement, full-chain vs
local-only routing, no-retry-burn, no external attempt leaking onto a
local-only row, mid-poll recovery reopening the chain, third-probe
request-free behavior through the REAL `article_parser` latch, ITEM_MISS never
clearing the outage, budget clamping, tenant isolation, legacy/disabled
paths, plus the review-driven groups: pre-chain checkpoint ordering/real
state-file round-trip/no-checkpoint-without-a-plan/failure-never-stops-the-poll
and establishment seeding — seed + next-poll advance, a latched outage never
reseeding, a cursor left by an earlier outage replaced, the establishment
itself checkpointed to the state file). `python -m tests.test_message_format`
OK; `compileall`; 16 workflow YAMLs parse; `bash -n`; `node --check` +
`node --test` gate tests; `git diff --check`; **`state/` byte-clean after the
full suite AND after each CI-listed module run on its own** — three
self-inflicted pollution bugs were caught and fixed during the round: a test
helper and the simulation both let `set_site_context` repoint the error log at
the tracked `state/errors.log` (tenant switches now go through a log-safe
helper), and once establishment began checkpointing to disk,
`tests/test_themarker_extraction_outage.py` started writing the tracked
`state/themarker.json` (it now redirects the state file into its temp dir).

Docs: ADR `docs/themarker-probe-rotation-20260905.md`, evidence report
`reports/themarker-probe-rotation-20260905.md`, README section "Outage probe
rotation" + corrected fairness/flood-safety text, `handoffs/CONTEXT.md` new
dated section + a 2026-09-05 backlog reconciliation block (including the Gate
gap and the retrospective requests), and the 2026-08-15 "exactly one probe,
always the oldest" test assertion marked SUPERSEDED in
`tests/test_themarker_queue_starvation.py` (it now covers the legacy no-plan
call path only).

One workflow change: `.github/workflows/poll.yml` commits tenant state with
`if: always()` (the Tech Feed IL poll workflow already did). Nothing else in
CI, the Gate, the Merge Bot or automation-core was touched.

## NOT verified physically

- The rotation and the current-item probe in PRODUCTION: the live outage
  recovered 2026-09-05T15:51Z, so the fairness path is dormant. First
  production evidence arrives with the next latched outage. Test- and
  simulation-verified only.
- Whether a current article *would* have published externally during the
  2026-08-26 outage — unknowable without having made those requests then. No
  claim made.

## PENDING (in order)

1. **#102 merge decision — OWNER'S CALL.** The review side is done: four Codex
   passes, four real findings fixed/replied/resolved, two clean passes, zero
   unresolved threads, CI green on every head. The Gate stays red only because
   a clean review leaves no exact-head binding (see the Gate note above).
   Options: manual SHA-pinned squash merge as with #100/#101; fix the Gate
   separately and re-run it; or re-file the tree as a single-commit PR. Do NOT
   fix the Gate inside #102 — a Gate change must not ride in the PR it
   unblocks. A fifth (docs-only) Codex pass on `8663cb9` runs after this
   handoff; it changes none of the above.
2. **Retrospective Codex audits of #100 and #101 — requested, awaiting
   results.** `@codex review` posted 2026-09-05 (comments 5553907913 /
   5553908086). Read the outcomes; any real P1/P2 → normal forward-fix PR.
3. First latched-outage production evidence for the rotation: expect
   `phase2 active-outage fairness: 2 external probe row(s) (representative
   rotation position i/N, poll k)` with a MOVING `i`, a `themarker_probe_rotation`
   block in committed state, and `extraction_outage.probe_count` advancing by
   up to 2 per poll (it counts probes, not polls, now).
4. **OPEN OBSERVATION, not a code defect** — scheduled-run gaps: no TheMarker
   poll ran 2026-08-30T23:08Z → 2026-09-04T09:23Z (106.26h) and only two Source
   Health runs exist in 7 days (142.41h apart), with zero workflow failures on
   09-04/09-05. Drift is visible across every scheduled workflow (Daily Health
   `0 2 * * *` fires hours late with multi-day gaps). Not root-caused. It is
   also the reason one alert-reminder gap is 114h rather than ~24h.
5. Issue #50 recurring `low_hebrew_dominance` quality findings (latest
   2026-09-05T15:52:51Z) — untouched by this task;
   `ROUTE_FINDINGS_TO_AUTOFIX = False` keeps them out of the auto-fix loop by
   design.

## Rules note

`agent-memory/DEVELOPMENT_RULES_FULL.md` was read in full FIRST (canonical
copy at the agent-memory root). agent-memory was finalized ONLY through
`/root/work/bin/agent-memory-finalize`; no direct Git operation was run inside
the agent-memory repository.
