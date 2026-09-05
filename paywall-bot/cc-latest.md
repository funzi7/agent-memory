# paywall-bot handoff — 2026-09-05 UTC (PR #102 MERGED: TheMarker outage probe rotation + current-item probe)

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
- Commits: `1bb859c` (rotation) → `f6f23ad` (review fixes 1) → `4b0e387`
  (review fixes 2) → `cb8ff9f` (docs precision) → `8663cb9` (Gate/backlog
  documentation) → `71f86b5` (**owner's** Gate fix: bind clean Codex
  summaries to reviewed heads) → `7e17702` (review fix 3) → `a1b8ba3`
  (review fix 4) → **HEAD `6c069ef4df629843ec6be79d67ddb42339b12f10`**
  (review fix 5).
- PR: https://github.com/funzi7/paywall-bot/pull/102 — **MERGED**
  2026-09-05T20:01:52Z as SHA-pinned squash
  **`b07344f4d53b33478d0d349eb2b79d035805a328`** from the exact head
  `6c069ef`, on an EXPLICIT owner instruction after the review side was
  complete. Post-merge CI on the merge commit: green. A docs-only
  reconciliation commit followed on `main`
  (`e6885c105dce3b4e4571a0131acebfeaa4163e61`, CI green) so the handoff
  docs match reality.
- **CI green on EVERY head**, `1bb859c` through `6c069ef`
  (`test-message-format`, ~1 min each).
- **Codex capacity is BACK** — the first real signal since the 2026-08-29
  quota notice on #101. A genuine Code Review ran on `1bb859c`
  (2026-09-05T18:00:40Z) and **found two real defects**, both fixed in
  `f6f23ad` with regression tests, replied to on their threads, and resolved:
  - **P1 — cursor durability.** An in-memory advance is not an advance:
    `run_poll`'s only unconditional `save_state` is at its very end and the
    poll job is cancelled when its timeout expires on an ephemeral runner, so
    a poll that kept dying mid-way would reload the old cursor and re-probe
    the same representative forever. (Two later passes proved `always()` alone
    does not survive a TIMEOUT — see the step-cap findings below.) Fixed with `_checkpoint_probe_rotation`
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
- **The OWNER pushed `71f86b5` onto this branch** — "fix(automation): bind
  clean Codex summaries to reviewed heads", addressing the Gate gap below. It
  adds `completedCodexSummaryTargetsHead` identically to the Gate, Merge Bot
  and watchdog: trusted connector login only, the connector's own
  `<!-- codex-pull-request-review-summary -->` marker, a ✅ row (🔄 refused),
  and a backticked SHA that must prefix the head; the 👍 must still post-date
  the head observation, and `decideCodexGate` still blocks on any active
  unresolved P1/P2 first. Reviewed here and sound; +4 node gate tests (21).
- **Codex then found THREE more real defects on top of it** — all fixed,
  replied to and resolved:
  - `71f86b5` **P1**: `if: always()` does not survive a JOB timeout — the
    runner dies with the checkpoint. Fixed in `7e17702` by giving the poll
    step its own cap.
  - `7e17702` **P1**: an 8-of-10-minute step cap ignores checkout/setup/
    install, which consume the same job budget before the poll starts. Fixed
    in `a1b8ba3`: TheMarker job 10 → 12 with an 8-minute step cap and an
    explicit 4-minute reserve (measured on run 33976044896 — checkout 2s,
    setup-python 4s, pip install 5s, commit 2s; job never above 92s).
  - `a1b8ba3` **P2** (my error): the Tech Feed IL step cap of 12 min sat
    BELOW that tenant's own `runtime.poll_budget_seconds: 900` — I had cited
    the unrelated `source_health.runtime_budget_seconds: 270`. Fixed in
    `6c069ef`: cap 16 inside the unchanged 20-minute job, above the app
    budget, 4-minute reserve. TheMarker configures no `runtime` section, so
    its 8-minute cap bounds nothing the application itself limits.
- **Final head `6c069ef`: review CLEAN, zero unresolved threads, CI green.**
  Seven Codex findings total across five passes, every one fixed with
  regression coverage, replied to on its thread, and resolved.
- **Gate is RED for a structural reason, and the fix cannot unblock its own
  PR** — now proven empirically, not just from the source. On `6c069ef` all
  three preconditions the owner's fix needs are present: connector 👍 at
  2026-09-05T19:17:44Z (after the head), a ✅ summary row naming `6c069ef`,
  and zero unresolved findings. `check-codex-status` still reports *"Codex has
  not reviewed head 6c069ef"* — including on a manual re-run at 19:18:44Z, so
  it is not a timing race. Cause: `pull_request_target`, `schedule` and
  `workflow_dispatch` all execute the workflow file from the DEFAULT branch,
  and `main` does not carry the fix
  (`git show origin/main:.github/workflows/codex-gate.yml | grep -c
  completedCodexSummaryTargetsHead` → 0). The Gate change takes effect only
  once it is on `main`.
  Nothing was worked around: no `codex-p1-acknowledged` override label, no
  fabricated `Reviewed commit` marker (the Gate only trusts connector logins
  anyway), and no edit by me to the Gate, Merge Bot or automation-core.
  Owner options: (a) manual SHA-pinned squash of #102 — the Gate is then
  fixed for every later PR; (b) land the Gate change on `main` by itself
  first (a single-commit PR clears through the existing reaction-only path)
  and re-run the Gate here. Status comment on the PR: 5554193554.
- **Merge basis, stated plainly.** The Codex REVIEW requirement was fully
  satisfied on the merged head — five passes, seven real findings all fixed
  and resolved, final pass clean with the connector thumbs-up, zero
  unresolved threads, exact-head CI green. `check-codex-status` was red
  only for the Gate binding gap that this PR itself fixes and that no PR
  carrying the fix can clear (proven empirically, above). The owner then
  explicitly directed the merge. As with #100 and #101: no
  `codex-p1-acknowledged` override label, no fabricated or forged review
  signal, no weakening of the Gate, Merge Bot or automation-core — the
  Gate simply stayed red on an owner-merged PR. The merge commit message
  records all of this.
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
   back to the persisted poll counter, which still advances). It is written at
   selection time AND checkpointed to disk before the first external chain,
   with the workflow committing tenant state under `if: always()` and the poll
   step capped below the job budget — three parts, because Codex proved each
   of the first two insufficient on its own. Deterministic: identical state
   always yields an identical plan.
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
nothing) — evidence diversity per poll is. Observed poll wall-clock 52–92s vs
the 8-minute poll-step cap, one3ft warm retry stays once per RUN ⇒ no runtime budget
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
`node --test` gate tests (**21**, incl. the owner's 4 new
`completedCodexSummaryTargetsHead` cases); `git diff --check`; **`state/` byte-clean after the
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

Workflow changes (all review-driven): `.github/workflows/poll.yml` commits
tenant state with `if: always()` (the Tech Feed IL poll already did), its job
budget is 12 minutes with an 8-minute cap on the poll step and an explicit
4-minute reserve for setup + commit, and the Tech Feed IL poll step is capped
at 16 of its unchanged 20 minutes — above that tenant's own
`runtime.poll_budget_seconds: 900`. The Gate/Merge-Bot/watchdog change in this
branch (`71f86b5`) is the OWNER's, reviewed here, not mine; I touched no
automation to unblock my own PR.

## NOT verified physically

- The rotation and the current-item probe in PRODUCTION: the live outage
  recovered 2026-09-05T15:51Z, so the fairness path is dormant. First
  production evidence arrives with the next latched outage. Test- and
  simulation-verified only.
- Whether a current article *would* have published externally during the
  2026-08-26 outage — unknowable without having made those requests then. No
  claim made.

## PENDING (in order)

1. **First post-merge production evidence — DONE, and it validated the whole
   change.** Run 33991697780 (2026-09-05T21:01Z, 118s, success; state
   `6bcc11c`, docs `d566991`). The outage re-latched after the 15:51Z
   recovery, so the first poll on the merged code ran the new path:
   `phase2 active-outage fairness: 2 external probe row(s) (representative
   rotation position 0/147, poll 1) + 18 newest ready rows (local-only)`, and
   `themarker_probe_rotation` is now a committed state key
   (`last_probe_key …0000019f-f2c8…`, `last_probe_index 0`,
   `ready_count 147`, `probe_count 1`, `updated_at 20:59:56Z`).
   **The current-item probe is what recovered the tenant**: at 21:00:12Z the
   aged representative produced the systemic signature and the breaker
   latched; two seconds later `TheMarker extraction outage cleared
   source=one3ft reason=complete_content`, and the next line publishes a
   SAME-DAY article via one3ft (12¶ / 4,021 chars). Under the pre-merge
   selection that row was local-only — the poll would have parked and
   published nothing. Also observed live: `provider jina skipped: unavailable
   earlier in this run` ×5 (provider-global caching after two systemic
   failures), `post cap reached: 4 posted this run`, `errors 0`,
   `permanent_fail 0`, poll step 100s against its 8-minute cap, commit step
   2s, job 118s against 12 minutes.
   STILL OPEN: a multi-poll rotation CYCLE — this outage cleared inside the
   first rotating poll, so the cursor has advanced only once. Next latched
   outage should show `rotation position i/N` moving across polls and
   `extraction_outage.probe_count` advancing by up to 2 per poll.
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
