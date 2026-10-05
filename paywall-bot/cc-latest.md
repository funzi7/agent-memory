# paywall-bot handoff — 2026-10-05 UTC (Tech Feed IL: non-replacing tenant queue, follow-up to merged #113 — PR #114 marked READY by funzi7 at 11:45Z, `no-automerge` still on, NOT merged)

## Update 2026-10-05 ~11:55Z (READ-ONLY PHYSICALLY OBSERVED, after the finalization below)

- **11:45:19Z.** funzi7 marked PR #114 ready for review (`ready_for_review` by funzi7). This task never marked it ready.
  It is now `draft=false`, still OPEN and NOT merged, and **`no-automerge` is still present**.
- **11:50:13Z.** Codex's automatic review (trigger "Draft marked ready") completed on `4db114f` with NO findings: the
  summary comment reads "✅ Completed", with 👍 at 11:50:17Z. There is no new comment, review object or inline finding.
- **`check-codex-status` on `4db114f`.** 🟢 "Reviewed — clear" at 11:45:54Z and 11:50:37Z.
- **`codex-gate-evaluator`** still shows its stale pre-review failure (11:25:21Z). It is diagnostic only for Merge Bot,
  and it is why GitHub shows `mergeable_state: unstable`.
- **Merge Bot runs at 11:46 and 11:50** (37305047152, 37305546775) evaluated only #107 ("a check failed, skip"). #114
  was not even a candidate, because `isAutoMergeCandidate` returns false on `no-automerge`. So the hold worked: the
  ready-for-review review landed (clean) BEFORE any merge could happen, unlike #113.
- **To merge:** the owner removes `no-automerge`, after which Merge Bot merges it on its next wake, since CI and the
  Gate are green on the exact head; or the owner merges it by hand. Then follow "Next steps" 2–4 below.

## Headline

Codex's post-merge P2 on #113 (the Guardian's tenant lock was check-then-act) is fixed at the queue layer, on a NEW
branch and PR.
- **Branch and PR.** `fix/techfeedil-tenant-queue-20261005`, PR **#114**: a **DRAFT carrying `no-automerge`, NOT
  merged, never marked Ready**, kept for coordinator review.
- **The fix.** Every member of `bot-state-techfeedil` declares `queue: max`, so a newly queued member waits instead of
  cancelling a pending one.
- **TheMarker** is unchanged. #113 and its deleted branch were not touched.
- **Final head:** **`4db114fec71f63ba8ab5e014bd7f55bd632a9792`**. See "FINAL STATE".
- No production state was edited, no workflow was dispatched, no Telegram or Telegraph write was made, and no
  production collision was manufactured.

## FINAL STATE (2026-10-05 ~11:40Z)

- **paywall-bot HEAD:** `4db114fec71f63ba8ab5e014bd7f55bd632a9792` on `fix/techfeedil-tenant-queue-20261005`. It is verified
  equal on the local HEAD, `git ls-remote` and the PR head. It is two commits on `origin/main` `b519b04`:
  - `f8b6701` fix(techfeedil): non-replacing tenant queue for bot-state-techfeedil (Codex P2 after #113). It changes the
    workflows, Guardian comments and docstrings, tests and docs.
  - `4db114f` docs(techfeedil): PR #114 and the first post-merge Source Health digest. Docs only.
- **PR #114** (https://github.com/funzi7/paywall-bot/pull/114):
  - OPEN, **DRAFT**, carrying **`no-automerge`** (labelled at creation, 11:23:01Z, by funzi7), NOT merged;
  - never marked Ready or labelled `automerge`;
  - author funzi7, base `main`.
  - Merge Bot skips it twice over: it is a draft, and `no-automerge` is a hard stop.
- **`origin/main` at the end:** `a0a2a62`, one state-only commit past the branch start (Tech Source Health 10:49Z). The
  branch was not rebased.
- **Exact-head CI on `4db114f`.** Run 37302820477, job 111739354492, Python 3.11.16: success.
  - Message format "All tests passed.", and the focused suites OK.
  - `unittest discover` "Ran 2742 tests", OK.
  - Node 21/21; 21 workflow files parsed; `bash -n` passed.
  - `git diff --exit-code -- state/` and `git diff --check` passed.
- **Codex: CLEAN in one round.**
  - Requested with "@codex review" (comment 5993527675, 11:28:44Z) while the PR was a draft.
  - Result: comment 5993618004 at 11:34:55Z, "Codex Review: Didn't find any major issues", **Reviewed commit
    `4db114fec7`**, with 👍 at 11:35:00Z.
  - No review object, no inline finding, no thread.
- **The Gate on `4db114f`.**
  - `check-codex-status`: success, "🟢 Reviewed — clear" (11:35:18Z), "No unresolved non-outdated trusted Codex P1/P2
    thread blocks 4db114f (current_head_signal_no_active_findings)".
  - `codex-gate-evaluator` still shows its pre-review failure from 11:25:21Z. It is diagnostic only: Merge Bot lists it
    in `NON_BLOCKING_DIAGNOSTIC_CHECKS`. No later evaluator run was created.
- **#113 was NOT touched** in this task. Its late P2 thread 4178858301 stays unresolved, `check-codex-status` on `1071b6f`
  stays red, and `needs-owner`/`needs-owner-auto` remain on the closed PR. On `main` the race stays live until #114
  merges.

### Next steps (coordinator / owner)

1. **Review PR #114.** To merge it, the owner must decide to mark it Ready and remove `no-automerge`.
   - Keep `no-automerge` until Codex's automatic ready-for-review review has landed: marking Ready triggers it, and
     Merge Bot does not wait for it.
2. **Right after the merge, check BY HAND that the first run of each changed workflow starts** (poll at :17, the next
   Source Health and Backfill).
   - A `startup_failure` alerts nobody: CI Doctor filters `conclusion === 'failure'`, and the Guardian records it as
     telemetry.
   - Example:
     `gh api "repos/funzi7/paywall-bot/actions/workflows/poll-techfeedil.yml/runs?per_page=3" -q '.workflow_runs[] | "\(.id) \(.event) \(.status)/\(.conclusion)"'`
3. **When two Tech members first wait together,** `GET /repos/funzi7/paywall-bot/actions/concurrency_groups/bot-state-techfeedil`
   must list both as `pending`, with neither ending `cancelled`. That is the runtime proof of `queue: max`, still
   PENDING.
4. **Never Re-run a Tech run created before the merge, and never dispatch Tech workflows from stale branches.** Either
   would bring back the old queue in the production group.
5. **After the merge,** #113's late P2 thread can be answered with a pointer to #114.

## What was implemented (DETERMINISTICALLY TESTED)

### The race

- `tools/techfeedil_guardian.py` `read_tenant_lock` GETs the Source Health and Backfill runs. `pg.apply_tenant_lock`
  holds while one waits; otherwise `dispatch_poll` POSTs `workflow_dispatch` for `poll-techfeedil.yml`.
- `bot-state-techfeedil` used GitHub's default `queue: single`: at most one pending run, "any existing pending job or
  workflow run in the same group is canceled and replaced", even with `cancel-in-progress: false`.
- So a Source Health or Tech Backfill run that went pending between the GET and the POST was cancelled by the Guardian's
  poll. The cron and manual polls replaced pending members the same way, without any check.

### Why GET-before-POST is insufficient

- A read-then-dispatch sequence always leaves a window between the last read and the POST, plus GitHub's asynchronous
  queueing. A second read only moves the window.
- GitHub has no compare-and-set for queueing a run.
- Post-dispatch "cancelled" telemetry is not prevention. None was added.

### The final queue/concurrency contract

- **Docs.** Official, from github/docs `data/reusables/actions/actions-group-concurrency.md`, commit 336b7f546d,
  2026-05-06, version-gated `actions-nga` = fpt/ghec:
  - `single` (default) keeps 1 pending and replaces it;
  - `max` keeps up to 100 pending, FIFO by wait start, and the 101st is cancelled;
  - `max` + `cancel-in-progress: true` is a validation error.
  - Nothing documents `queue` as an expression. SchemaStore's `github-workflow.json` enum is `single | max`, with no
    expression branch.
- **The members** of `bot-state-techfeedil` all declare `cancel-in-progress: false` and `queue: max`:
  - `poll-techfeedil.yml` (workflow level): the cron, a manual run and the Guardian's dispatch;
  - `source-health-techfeedil.yml` (workflow level);
  - `backfill.yml`, new job `backfill-techfeedil` (job level, `if:` default branch `&& inputs.site == 'techfeedil'`).
    It also gains "Refresh tenant state from the default branch", Source Health's form: a waited run starts from its
    trigger commit, and Tech has `reconcile_destination: false`.
- **The Guardian** stays in its own group `guardian-techfeedil` (default queue). Its logic is unchanged:
  - it dispatches only the normal poll;
  - the per-slot sidecar and runs-after-slot dedup are unchanged;
  - `daily_dispatch_cap` stays 24 in code and 8 in the Tech config.
  - The GET tenant lock is now documented as a courtesy hold plus evidence, NOT the guarantee. It still holds while a
    Source Health run waits or ANY Backfill run is unfinished, a TheMarker one included.

### TheMarker isolation

- `poll.yml` is untouched: `poll-themarker`, the default queue.
- The `backfill.yml` TheMarker job keeps:
  - job id `backfill`, group `poll-themarker`, the default queue, `cancel-in-progress: false`;
  - the same runner, timeout, permissions, inputs, steps, env and commit step.
  - It only drops the Tech step, which never ran there, and its `if:` adds `inputs.site == 'themarker'`.
- The skipped other-tenant job resolves to `backfill-<tenant>-skipped-<run_id>`. GitHub does not document whether
  skipped jobs enter their group.

### Validation (DETERMINISTICALLY TESTED unless stated)

- **The local CI-equivalent run before the push**, all passing:
  - message format;
  - the 18 focused CI suites, plus the Guardian classifier (87), the Guardian tool (68) and Tech Runtime Ops (41);
  - `python -m unittest discover`: **Ran 2742 tests, OK** (2713 plus 29 new);
  - `compileall`; node 21/21; 21 workflow files parsed;
  - SchemaStore `github-workflow.json` validation, 21/21. The negative controls were rejected: `queue: maxx`, an
    expression, an unknown key;
  - `bash -n` (3 scripts); `state/` unchanged; `git diff --check`.
- **New `tests/test_techfeedil_tenant_queue.py` (29 tests).**
  - **What it does.** It reads the workflows as YAML 1.2, with a GitHub-expression evaluator: loose `==`,
    case-insensitive names, strict `format()`. It discovers every member of each lock per `site` option, including
    skipped jobs. It pins:
    - the exact contract;
    - both Backfill jobs and `backfill.yml` as wholes;
    - that only 4 workflow files mention `bot-state`;
    - the Guardian outside the group;
    - `TENANT_LOCK_WORKFLOWS` against the members;
    - no `always()` in a Tech job `if`.
    It also drives the documented-queue model with the modes of the members that resolve to each lock (scenarios
    1–6).
  - **On #113's tree** (`git archive 62e467b`): 15 of 29 fail (16 failures and 3 errors counting subtests). The Tech
    scenarios fail through the model itself: scenario 1 gives "['source health'] != []". TheMarker's behavioural and
    scenario tests pass on both trees.
- **Mutations: 41 of 41 caught, all by the new module alone.** 16 are my own; 25 came from the independent tests review.
  10 of the review's mutants survived the module's first version, and the guards were added for them.
- **actionlint 1.7.7** reports only "unexpected key queue" on the 3 changed blocks; the tool predates the key, and
  even 1.7.12 lacks it. GitHub's `@actions/workflow-parser` 0.3.61 accepted all 21 files (the YAML reviewer's run).
- **Reviews.** Four subagents ran through the Agent tool; the Workflow tool is denied in this session's "don't ask"
  mode.
  - **Fable planner (design).** Correct and near-minimal; the Tech Backfill refresh step is REQUIRED.
  - **YAML reviewer.** No P1/P2; 4 P3s, all fixed or documented:
    - "`queue` takes no expression" reworded: GitHub's parser accepts one, and the runtime behaviour is undocumented;
    - "the next run re-evaluates the slot" corrected;
    - the Re-run risk added;
    - persisted Backfill credentials recorded as FUTURE.
  - **Tests reviewer.** No P1/P2; 4 P3s and 3 nits, all fixed.
  - **Docs reviewer.** 1 P1, 5 P2s and 7 P3s, plus nits, all fixed.
    - The P1 was my false claim that "CI Doctor reports startup_failure".
    - The P2s: the post-age count, an overclaim in the status block, the unmerged fix listed as DONE, the open P2 left
      out, and "the Guardian never queues a second poll".

### Not physically tested (PENDING, post-merge only)

No existing safe mechanism allows this before the merge, and no production collision was manufactured. A branch
dispatch of the real poll or Source Health enters the PRODUCTION group (workflow-level concurrency applies even when
the job is skipped). A probe workflow would be new scope with its own minutes; it was NOT done.

1. **The first scheduled or dispatched run of each changed workflow starts normally.**
   - GitHub's own workflow parser has not yet run on these files: they trigger only on `schedule`/`workflow_dispatch`,
     and nothing was dispatched. (GitHub's `@actions/workflow-parser` library accepted them offline.)
   - A rejected file would show as `startup_failure`, which ALERTS NOBODY: CI Doctor filters `failure`, and the Guardian
     records it as telemetry. Check BY HAND ("Next steps" 2).
2. **A natural moment with two Tech members waiting.** `GET /repos/funzi7/paywall-bot/actions/concurrency_groups/bot-state-techfeedil`
   must list both as `pending`, and neither may end `cancelled` with "higher priority waiting request".

### Risks (also in ADR §16.7)

- A dispatch of a Tech workflow from a branch whose YAML predates this change, or a Re-run of a Tech run created before
  the merge (re-runs reuse the original commit's workflow file, for up to 30 days), joins the production group with the
  old queue. Mixed modes are undocumented. Don't.
- A duplicate poll that the old queue cancelled now runs (≈2 min).
  - The Guardian does not dispatch while its GET snapshot shows a poll queued or running. The same read window applies
    to that snapshot.
  - A late cron or a human can still stack a second poll.
- Both Backfill jobs keep checkout's persisted token while they process article content. This is pre-existing,
  recorded as FUTURE, and unchanged here.
- A poll that waits more than 20 min behind a Tech Backfill classifies `POLL_DELAYED_OR_STUCK` (telemetry).
- FIFO order is not guaranteed by GitHub. Every member refreshes state first.
- There is a 100-pending cap.
- TheMarker's Backfill still has no state refresh (pre-existing).
- actionlint ≤ 1.7.12 does not know `queue` (noise).

## #113 post-merge evidence and backlog (READ-ONLY PHYSICALLY OBSERVED, to 2026-10-05 ~11:25Z; ADR §13, §15)

### DONE, physically observed

- **How #113 merged.** The owner marked it ready at 18:43:39Z, and Merge Bot run 37225576753 merged it at 18:44:37Z as
  `62e467b`. Merge Bot uses `AUTOMATION_PAT`, so GitHub shows funzi7.
  - Codex's ready-for-review review, which raised the P2, landed 3 min after the merge.
  - Rule since: our PRs are DRAFT plus `no-automerge`.
- **Three real Guardian self-heals,** each `accepted` and `confirmed` with reason `scheduler_gap`:

  | Slot | Dispatched | Poll run | Sidecar commit |
  | --- | --- | --- | --- |
  | 21:17Z | 21:59:12Z | 37238250650 | `1931f0b` |
  | 00:17Z | 01:18:02Z | 37250890466 | `7c54deb` |
  | 06:17Z | 07:42:20Z | 37279233171 | `ba4347e` |

  All three replacement polls succeeded.
- **The stale-backlog cleanup.** The first post-merge poll (37238250650, 22:01:19Z) suppressed 505, the replay's
  figure. The later polls suppressed 10, 3, 1, 0 and 0, so 519 `stale_recovery_age` in all. The queue went 535 → 13 and
  `suppressed_items` 300 → 819.
- **The sidecar is tracked** since `1931f0b`, so CI's `state/` diff check covers it.
- **The quality-filing step ran in all 6 post-merge polls** ("no new quality issues to file").

### PARTIALLY OBSERVED

- **No stale post.**
  - 33 posts in all; 30 carry a stored date: 29 were 2.0–33.3 h old, plus Walla `item/3870903` at −0.9 h (its +3 h
    label).
  - The 3 undated mako rows have lower bounds only (4.8, 9.1 and 9.1 h): their trusted page date is not
    persisted, and mako's bot manager blocks a re-fetch from here.
- **The Source Health daily digest.**
  - The first post-merge Source Health run, 37298998393 at 10:49:15Z, started at once.
  - It reported `actionability: runtime_ops` and `alert_delivery: sent`, and its sidecar `a0a2a62` advanced
    `last_digest_at` to 10:49:31Z.
  - The "Runtime Ops (autonomous):" text is inferred from the governed code path, not seen.

### PENDING

- **Codex's P2 on `main`,** until #114 merges.
- **The runtime observation of `queue: max`,** plus the by-hand check of the first runs.
- **A real Tech quality-Issue write.** None has been needed yet.
- **The external dead-man.** GitHub delivered about 3 of 15 Guardian slots and 3 of 14 poll slots.
- **Tech AI scouting** stays disabled.
- **Walla's +3 h label** (still seen).
- **`time_bound` evidence.** Only the `normal` (510) and `evergreen` (9) tiers were logged.
- **The Actions budget.**
  - The billing API needs the `user` scope.
  - Run time since the merge: Guardian 1.4, Tech polls 9.6, TheMarker polls 2.1 min. Billing rounds jobs up, so that is
    roughly 3, 12 and 3 min.
- **The Guardian's lost-sidecar duplicate DM** (a residual risk).

### Cancellation history

Server-side `status=cancelled` counts over the API's retained history:
- Source Health 0 of 64;
- Backfill 0 of 4;
- Tech poll 1 of 641. That one, 31947704293 on 2026-08-16, was a 20-min timeout.

This absence is no proof that the race cannot occur.

### FUTURE

- an external heartbeat;
- Tech AI scouting;
- a Walla timezone;
- owner-verified `time_bound` terms;
- the Guardian runbook `next_action` text;
- optionally, a record-only courtesy hold or a read of the concurrency-groups API;
- hardening: give both Backfill jobs `persist-credentials: false` with environment-only git auth (pre-existing).

### SUPERSEDED

- the owner-approved items of ADR §12;
- engineering only, effective once #114 merges: the tenant lock's ROLE as the replacement guard, which `queue: max`
  takes over. The hold itself remains.

### Process notes

- Run `gh pr create --draft --label no-automerge` in one command.
- `gh pr edit` fails here with a Projects (classic) GraphQL deprecation error. Update a body with
  `gh api -X PATCH repos/funzi7/paywall-bot/pulls/N -F body=@file`.
- A clean Codex result is still a comment plus 👍, with no review object; `watch_codex_pr.sh` handles both shapes.

---

# Previous handoff (historical): PR #113 pre-merge record, as written on 2026-10-04

Everything below predates the merge of #113 and is kept unchanged as history. Where it says #113 is a draft or
not merged, that was true then. The current state is above.

## FINAL STATE — narrow finalization round after coordinator review (2026-10-04)

- **`9aca413`** changed documentation and comments only, verified two ways: Python ASTs and the parsed workflow YAML are identical to `1ea7618`, and the full suite re-ran.
- Codex round 8 then found a real P2. Per the coordinator spec ("reproduce and fix it on the SAME PR/branch") it was reproduced and fixed in the code+tests+docs commit **`1071b6f`**, with the full regression suite run.

### Round-8 fix commit `1071b6f` (code + tests + docs)

- **The finding** (Codex review 5407425382 on `9aca413`, P2, `core/runtime_ops.py`): Tech observes either `shared_credential_wait` (TheMarker's verdict on the shared `AUTOMATION_PAT` is fresh) or its own `owner_github_credential`. Whichever went unobserved stayed open until the token recovered.
  - After TheMarker went stale, the wait lingered.
  - After TheMarker became current again, Tech's owner incident kept sending 24 h reminders beside TheMarker's.
- **REPRODUCED on the unfixed code:** a scratch run produced 2 extra "⏰ reminder" DMs, and both incidents stayed open.
- **The fix:**
  - Both the collector and `_apply_quiet` decide from one predicate, `_shared_credential_governed(ctx)`.
  - TheMarker stale: the wait resolves (`shared_owner_stale`).
  - TheMarker current again: Tech's owner incident resolves (`shared_owner_resumed`) with `owner_notified=False`, so there is NO false "resolved automatically" cancel while the PAT is still rejected.
  - A real recovery still sends its one cancel (`credential_recovered`).
  - TheMarker (no shared owner configured) is unaffected.
- **Tests and mutation check:**
  - `tests/test_techfeedil_runtime_ops.py`: the four-step governance round trip, plus the real-recovery cancel. Tech Runtime Ops now has 41 tests.
  - 3/4 mutants were caught. S4 is equivalent: a defensive guard on a path the collector already excludes.
- **Docs:** the ADR §5/§13/§14, the evidence report §0/§4.3/§4c and CONTEXT record round 8.
- **Validation:** local `unittest discover` passed, **2713 OK**; message format, compileall, 21 workflow YAML, `bash -n`, py3.11 grammar, node 21/21 and `git diff --check` were all clean; `state/` unchanged.

### Finalization commit `9aca413` (docs/comments only)

- **Changed (10 files):**
  - `reports/techfeedil-autonomous-runtime-20261004.md`: §0 at a glance; §2.1 earlier vs §2.2 current replay; §3 labelled historical; §4.1 exact-head CI; §4.2 historical local run; §4.3 two-column counts; §4c seven Codex rounds; §5 backlog.
  - `docs/techfeedil-autonomous-runtime-20261004.md`: status, the owner list (adds `repair_slot_blocked`), the §3.7 replay, the pre-R1.5 diagnosis labelled as never-committed pre-fix code next to the final budget contract, Guardian counts 87/68, §13 DONE/PENDING/SUPERSEDED/FUTURE, and a new §14 "Pre-merge record".
  - `handoffs/CONTEXT.md`: the Tech section relabelled; Status (DONE/PENDING/SUPERSEDED/FUTURE) and Final record added.
  - `README.md`: the owner-DM list and the replay wording.
  - Comments and docstrings only: the `core/main.py` quality comment; the `guardian-techfeedil.yml` header (the budget is not an owner action); the `poll-techfeedil.yml` Guardian dispatch comment; the `sites/techfeedil/config.yaml` shared-PAT comment; the `core/runtime_ops.py` module and `_collect_guardian` docstrings; the `core/quality_inspector.py` module docstring.
- **Proof of no behaviour change:** the scratch script `prove_docs_only.py 1ea7618` reports `docs_only_proven`.
  - Python ASTs are identical with docstrings excluded, and nothing reads `__doc__`.
  - The workflow and config YAML parse identically.
  - Nothing is untracked and no `state/` path changed.
- **Local validation on the final tree:**
  - `unittest discover` passed: **2711 tests OK**.
  - message format: all passed; compileall OK; 21 workflow files parsed; `bash -n` OK; py3.11 grammar OK.
  - node gate tests 21/21; `git diff --check` clean.
- **Process:** three read-only auditor subagents covered the ADR, the report + README, and CONTEXT + code comments. A fourth read-only final reviewer found 0 blockers, 1 MAJOR (CONTEXT lacked explicit DONE/SUPERSEDED/FUTURE) and 13 MINOR issues; all were fixed before the commit.
- **Fact corrected by an auditor:** TheMarker's legacy `quality-monitor.yml` files on ONE rolling `quality-findings` Issue (owner-triaged, no report PR) since `e62a3f5`.
- **Deliberately NOT changed** (out of a docs-only scope, recorded as FUTURE):
  - The Guardian `owner_actions_permission` incident reuses the `owner_credentials_required` runbook, whose internal `next_action` reads "owner renews the rejected credential". The owner DM is correct.
  - Pre-existing TheMarker-only stale text: `quality-monitor.yml`'s job name and comments, and `core/quality_inspector.py` ~L104/L444 still mention the old report PR.

### Git / PR

- Final paywall-bot HEAD: **`1071b6f35fb0d52244c52175fc6639142141f362`** (round-8 fix). The chain is `1ea7618` (round 7 clean) → `9aca413` (docs-only finalization) → `1071b6f`.
  - Verified equal on local HEAD, `git ls-remote` and the PR head (`gh api …/pulls/113`).
- PR #113 is **OPEN, DRAFT, not merged**, with **no labels**.
  - The Codex Auto-Fix circuit breaker re-added `needs-owner` + `needs-owner-auto` on the round-8 finding at 17:57:24Z/17:57:25Z.
  - After round 9 came back clean they were removed again at 18:20:04Z/18:20:05Z. The owner had explicitly asked for their removal earlier in this session, for the same breaker on the same PR.
  - Their marker count stays at 3, so any future Codex P1/P2 re-adds them along with an owner DM.
- `origin/main` = `22d1c34af229b9ed28307038ce510b7a90b09c68`. Since the merge-base `ad974de` it has gained four STATE-ONLY commits (only `state/` paths):
  - `17c60b1` Tech source health 10:04Z;
  - `70ae2a4` TheMarker 10:54Z;
  - `e5a58cb` Tech 12:55Z;
  - `22d1c34` TheMarker 15:39Z, which arrived after the coordinator's review.
  - The PR stays mergeable (`clean`).

### Codex review progression (nine rounds)

| Round | Head | Finding | Fixed in |
| --- | --- | --- | --- |
| 1 | `7af4d7d` | P1: the cross-tenant repair single flight guarded only the create | `36b4a02` (with the verifier P2/P3s) |
| 2 | `36b4a02` | P2: a feed duplicate dropped the RSS publication date | `02767de` |
| 3 | `02767de` | P2: the Guardian job timeout was below its step caps | `d19d80d` (10 = 3+2+2+3) |
| 4 | `d19d80d` | P2: a queued re-sighting never merged its freshness evidence | `ef053c3` |
| 5 | `ef053c3` | P1: repair-slot acquisition was not atomic | `4942206` (two-phase) |
| 6 | `4942206` | no P1/P2 (Gate 🟢); P3 `missed_slots` off by one (telemetry only) | `1ea7618` |
| 7 | `1ea7618` | **clean**: "Didn't find any major issues" plus 👍 | — |
| 8 | `9aca413` (docs-only finalization; review 5407425382) | P2: the shared-PAT incidents were not reconciled when governance moved (2 extra reminder DMs reproduced) | `1071b6f` |
| 9 | `1071b6f` | **clean**: comment 5982979102 at 18:18:12Z, "Didn't find any major issues" (reviewed commit `1071b6f35f`), plus 👍 | — |

- Every valid P1/P2 was fixed, and the P3 too. All **7** finding threads were replied to with their fixing commit and resolved; the round-8 one was replied to and resolved at 18:19Z.
- The ai-loop bridge's three `@claude fix` attempts ended in `billing_error`. The Codex Auto-Fix circuit breaker then added `needs-owner` + `needs-owner-auto`, and both were removed at the OWNER's request at 14:54Z.

### Exact-head validation

- **`1ea7618`:** CI run 37209219164 / job 111456774903 (Python 3.11.16), success.
  - Ran 2711 tests, OK.
  - Parsed 21 workflow files.
  - `git diff --check` and `git diff --exit-code -- state/` passed.
  - node gate tests 21/21.
  - `check-codex-status` 🟢 "Reviewed — clear"; evaluator "current_head_signal_no_active_findings".
- **`9aca413`:** CI run 37221930718 / job 111493846645, success. It ran 2711 tests OK and parsed 21 workflow files. Its Gate then went 🔴 on the round-8 P2.
- **Final head `1071b6f`:** CI run 37223289156 / job 111497742662, success (Python 3.11).
  - Message format: "All tests passed."
  - **Ran 2713 tests, OK.**
  - node 21/21; parsed 21 workflow files; the `git diff --exit-code -- state/` and `git diff --check` steps passed.
  - **Gate:** `check-codex-status` completed/success "🟢 Reviewed — clear" (18:20:18Z); `codex-gate-evaluator` reported "✅ current_head_signal_no_active_findings on head 1071b6f".

### Current pre-merge freshness replay (copy-only)

Setup:
- `--now 2026-10-04T17:00:25Z`, on copies of origin/main `22d1c34`;
- the Tech state was last written by `e5a58cb` at 12:55:34Z;
- sha256 of the copies was unchanged, every invariant held, and the second pass suppressed 0.

Results:
- **526 rows** (40 undated) → **505 suppressed**, all older than 168 h:
  - by basis: `published_at` 474, `first_seen_at` 31;
  - by tier: normal 496, evergreen 9.
- **21 retained:** n12 15, TGR 4, Geektime 1, TGspot 1. By tier, normal 20 and evergreen 1; 18 undated; max 65.5 h.
- **Registry** 300 → 805.
- **Ledgers unchanged:** 1224 `posted_guids`, 575 events, 25 terminal.

How this relates to the earlier copy-only replay (on the `ab32523` state, at 10:26Z and 11:26Z): it measured 521 → 505 / 16 / 805. That record is historical and was not rewritten. The real first post-merge poll will measure again.

### Backlog reconciliation

- **DONE** (deterministically tested, Codex-clean; NOT production-accepted):
  - the freshness tiers and gates, the current-first queue, and the queued-duplicate evidence merge;
  - Runtime Ops `multi_publisher`, Source Health ownership, and the repository-wide repair slot (every wake gated, two-phase, bounded wait);
  - the Guardian classifier/tool/workflow (job cap 10, exact missed-slot count);
  - descriptions, the script policy, and the Tech quality profile with in-job filing.
- **PENDING (post-merge physical):**
  - a real Guardian self-heal dispatch, its replacement run and the sidecar commit;
  - the first post-merge production cleanup, confirming that no stale article is posted;
  - a real Tech rolling quality-Issue write;
  - a Source Health daily digest that carries the Runtime Ops section.
- **PENDING (future / owner decision):**
  - the external dead-man outside GitHub Actions (no vendor);
  - Tech AI provider scouting stays disabled until real successful shared-discovery evidence and an owner decision;
  - the Walla RSS +3 h timezone mislabel;
  - production `time_bound` category evidence;
  - the Actions budget/headroom review.
- **SUPERSEDED** (unchanged labels from the ADR):
  - poll cron `0 * * * *` → `17 * * * *`;
  - Tech Source Health urgent/reminder DMs → Runtime Ops ownership;
  - the original "only a new create waits" single flight → every fixer wake waits plus two-phase acquisition (Codex rounds 1 and 5).

## Git / PR (exact)

- START_MAIN_SHA: **`ad974de877da614eb5ab3bf6e71d3a0f25a83c71`**.
  - Branch-point `origin/main`, checked with `gh api` at task start.
  - `origin/main` later gained only state commits: `17c60b1` (techfeedil source health 10:04Z), `70ae2a4` (themarker 10:54Z), `e5a58cb` (techfeedil 12:55Z) and `22d1c34` (themarker 15:39Z), with no code changes.
- Branch: `feat/techfeedil-autonomous-runtime-freshness-20261004`.
- Project HEAD: **`1071b6f35fb0d52244c52175fc6639142141f362`**, the round-8 fix, which is the final code tree.
  - Below it sit the docs/comments-only finalization `9aca4135d5eb4614e91a586a3aa97d613f9c0ece` and the round-7-clean tree `1ea76189cbaba110b92accdbb55a4aafb54241f9`.
  - `1ea7618` carries the Codex round-1 to round-6 fixes (`36b4a02`, `02767de`, `d19d80d`, `ef053c3`, `4942206`, `1ea7618`) on top of `7af4d7d`.
  - Verified equal on local HEAD, the remote branch (`git ls-remote`) and the PR head (`gh api …/pulls/113` reports `1071b6f`).
- Commits:
  - `00f0fa4` script policy + description completeness
  - `447a168` Runtime Ops profiles + repository-wide repair single flight + config-gated discovery
  - `b4d686c` Tech freshness / current-first queue / Runtime Ops enrollment / Source Health ownership / quality
  - `f31c70e` Guardian
  - `7af4d7d` docs
  - `36b4a02` fix(runtime-ops): gate every fixer wake on the repository repair slot (Codex P1 on PR #113)
  - `02767de` fix(feeds): a feed duplicate keeps its earliest plausible publication date (Codex P2 on PR #113)
  - `d19d80d` fix(guardian): give the job time for its own capped steps (Codex P2 on PR #113)
  - `ef053c3` fix(freshness): a queued article seen again keeps its best evidence (Codex P2 on PR #113)
  - `4942206` fix(runtime-ops): acquire the repository repair slot in two phases (Codex P1 on PR #113)
  - `1ea7618` fix(guardian): count only the scheduler slots no poll run covered (Codex P3 on PR #113)
  - `9aca413` docs(techfeedil): finalize PR #113 docs and comments after coordinator review (docs/comments only)
  - `1071b6f` fix(runtime-ops): reconcile shared-PAT incidents when governance moves (Codex P2 on PR #113, round 8)
- **Draft PR #113:** https://github.com/funzi7/paywall-bot/pull/113
  - Created as a real draft; the API reports `draft: true`, no labels.
  - No `automerge`, override or `no-automerge` label was needed, because Merge Bot skips drafts (`isAutoMergeCandidate`: `pr.draft` → false).
- **CI on #113 (GitHub runner, Python 3.11):** `test-message-format` **success** in 2m4s (Actions run 37199666333, job 111428567352). That job includes the full `unittest discover`, the focused Tech suites, compileall, the node tests, the workflow YAML parse, `bash -n`, and the `state/` and `diff --check` checks.
- **CI on `36b4a02`:** `test-message-format` **success** (Actions run 37204625281, job 111443133072). Local `unittest discover` passed: **2695 tests OK**.
- **CI on the final head `1ea7618`:** `test-message-format` **success** (Actions run 37209219164, job 111456774903). Local `unittest discover` passed: **2711 tests OK**.
- **Codex round 1** (requested 12:15Z, comment 5979793881; review 5406049273 on `7af4d7d`) raised **one P1**: the cross-tenant repair single flight guarded only the create. This was REAL.
  - It was fixed in `36b4a02`. Three independent verifier subagents checked the fix (wake paths, semantics/liveness, mutation testing). Their P2/P3 findings are fixed in the same commit:
    - **Gate only real wakes.** The create, the `claude-fix` add and the new-epoch re-trigger are gated. An attach that wakes nothing never waits, and the found Issue is attached first. The old top-of-function gate would have orphaned a crash-recovered Issue.
    - **Slot owner.** The slot belongs to the OLDEST open `runtime-incident` + `claude-fix` Issue, read with a dedicated query (`state=open`, both labels, `direction=asc`). This removes mutual waits and the 100-Issue window limit.
    - **Visible, bounded wait.** The wait is recorded in `code_fix.slot_wait`, shown in `next_action`/`queued` and `status`, and the stall clock is off until the wake (re-stamped then). It escalates as OWNER_ACTION_REQUIRED `repair_slot_blocked` after 48 h. It self-releases when the wait ends, and resolves with one cancel DM if the defect heals.
    - **Owner hold.** An incident waiting on the owner never wakes the fixer.
    - **Failed slot read.** A failed slot read holds the wake (`single_flight_lookup`), and a 401 on it is a credential failure.
    - **Close race.** An earlier-epoch pending close no longer shuts the Issue a waiting new epoch reuses.
  - A mutation run on the final code caught 22/22 mutants. Two had survived the first pass; tests were added for them.
  - Documented, not changed: the read/write race between the two tenants' syncs, and discovery's own `@claude` request (outside the slot).
- **Codex round 2:** requested 13:10Z on `36b4a02` (comment 5980296171). Review 5406352796 came in at 13:14:36Z.
  - The P1 was **not repeated**.
  - It raised **one new P2**, REAL, at `core/feeds.py` `_dedupe_feed_items`. The dedupe kept the first occurrence's metadata, so N12's undated TECH12 listing entry discarded the same article's dated Digital RSS date. A page without a trusted date of its own was then suppressed for good as unknown-date.
  - Fixed in **`02767de`**: the merge keeps the EARLIEST plausible timestamp (`trusted_timestamp`), the same contract as the queue merge. TheMarker has 0 aggregate feeds and is unaffected.
  - Four tests were added, one using the real N12 feed order through `_try_all_feeds` and `decide_row`. Three mutants (no merge, latest wins, no plausibility check) were all caught.
  - Local `unittest discover`: **2699 OK**.
- **ai-loop bridge (automation-owned, not touched):** for each round's finding it posted `@claude fix [auto-triggered]` as the owner PAT, for attempts 1 and 2. Both Actions fixer runs ended in **`billing_error`** (Anthropic credit exhausted, 0 tokens, nothing pushed). Each handed off to `claude-fallback-watchdog`.
  - The watchdog does NOT skip drafts. It is cron `*/5`, but in practice it runs rarely; the last run was 11:05Z.
  - When it next runs on a head that still carries an unfixed finding, it advances the ladder. Depending on repository variables, that means the Codex API backup, then `@codex fix` to Codex Cloud, then `needs-owner` plus an owner notification.
  - Pushing the fix first means a new head with no request, so there is nothing to escalate.
- **Codex round 3:** requested 13:22:41Z on `02767de` (comment 5980416044). Review 5406415170 came in at 13:27:09Z.
  - Neither earlier finding was repeated.
  - It raised **one new P2**, REAL, in `guardian-techfeedil.yml` (this PR's own workflow). The job's `timeout-minutes: 5` was below its own step caps (3 + 2 + 2), so a slow run could be cancelled before the `always()` sidecar commit persisted DM bookkeeping.
  - Fixed in **`d19d80d`**: the job cap is now 10 = 3 + 2 + 2 + 3 reserve; setup measures about 15 s on the poll.
  - The contract test now pins the invariant, which replaces the old "≤ 5" pin. Three mutants were caught.
  - Local `unittest discover`: **2699 OK**.
  - The bridge's attempt 3 also ended in `billing_error`.
- **Review threads:** the round-1 P1 thread (`PRRT_kwDOSZRyh86oyM1u`, outdated) and the round-2 P2 thread (`PRRT_kwDOSZRyh86oyzEk`) were each **replied to with their fixing commit and resolved** at about 13:32Z. Codex's round-3 re-review had not repeated either.
  - The round-2 thread had stayed NOT-outdated because GitHub re-anchored it to line 915. That alone kept the Gate 🔴 on the new head.
  - The Gate lists resolving a thread as a legitimate path. The PR is still a draft, and Merge Bot skips drafts.
- **Codex round 4:** requested 13:34:36Z on `d19d80d` (comment 5980541890). Review 5406471689 came in at 13:39:03Z.
  - No earlier finding was repeated.
  - It raised **one new P2**, REAL, a follow-on to round 2. Once an article is queued, `exclude_deferred_from_discovery_cap` filters every later sighting out before phase 1, and even the phase-1 merge only unioned discovery ids. So an article admitted undated while N12's RSS was down could never take the RSS date from the next poll.
  - Fixed in **`ef053c3`**: for a freshness tenant, `_filter_fresh_items` folds each re-sighting into the queued row before filtering it out.
    - The earliest trusted date wins.
    - Categories and feed ids are unioned.
    - The tier is re-derived via `classify`, which picks the shortest tier, so more evidence never lengthens a limit.
    - TheMarker is untouched.
  - Five tests were added, including the two-poll RSS-outage scenario through the real `run_poll`. Five mutants were caught; one survived a first pass, and a placeholder/undated test was added for it.
  - Local `unittest discover`: **2704 OK**.
  - The round-3 Guardian thread was replied to with its fix and resolved.
- **`needs-owner` + `needs-owner-auto` labels on #113** were added at 13:39:24Z by `github-actions[bot]`. That was the **Codex Auto-Fix circuit breaker** (`codex-auto-fix.yml`, `MAX_FIX_ROUNDS = 3`): three bridge `@claude fix` markers, all `billing_error`, and then a fourth Codex finding.
  - Its code also sends the owner a Telegram escalation: "3 @claude fix rounds didn't converge".
  - The breaker stops auto-triggering on this PR.
  - These are temporary automation labels, which Merge Bot clears after exact-head fully-green validation (`merge-bot.yml` ~L1174). Merge Bot skips drafts, so they stay while #113 is a draft.
  - At first I left them untouched on purpose, since they are a human-attention stop.
  - **Removed at the owner's explicit request** at 14:54:43Z / 14:54:45Z (`unlabeled` by funzi7).
    - Both labels were removed together, the way Merge Bot clears them. A dangling `needs-owner-auto` would make Merge Bot treat a later HUMAN `needs-owner` as transient and clear it.
    - The Auto-Fix marker count stays at 3, so another Codex P1/P2 on a new head would trip the breaker again (labels plus an owner DM).
- **Codex round 5:** requested 13:48:21Z on `ef053c3` (comment 5980681010). Review 5406537494 came in at 13:53:03Z.
  - No earlier finding was repeated.
  - It raised **one P1**, REAL: make repair-slot acquisition atomic. This is the read/write race I had documented as a known limit.
    - The two tenants' syncs use separate concurrency groups, so both could find the slot free and open Issues WITH `claude-fix`.
    - Opening an Issue with the label starts its fixer immediately, and nothing can stop a run that has started.
  - Fixed in **`4942206`** with **two-phase acquisition:**
    1. Create the Issue WITHOUT `claude-fix`, as a claim. Its number is the ticket.
    2. Wait `CLAIM_SETTLE_SECONDS` = 2, then re-elect with the own claim in place, adding a label-free newest-first read (a fresh claim's labels land 1–4 s late).
    3. Only the elected owner adds `claude-fix`. A losing claim waits attached and is woken via path 0.
    - The `Fixes #N` patch now lands before the wake.
  - **Election rule:**
    - Claims are open Issues whose body STARTS with the repair marker, with or without the label. A quoted marker is no claim, and neither is `needs-owner` without `claude-fix`.
    - The owner is the OLDEST WOKEN claim while any exists, else the OLDEST claim. A plain "oldest claim wins" would have let an older waiting claim wake a second fixer beside a running one; the existing tests caught that during the change.
  - **Verified:**
    - `claude.yml`'s `if:` wakes only on opened-with-`claude-fix`, labeled `claude-fix`, assigned, or an owner comment containing `@claude`. An Issue opened without the label wakes nothing, even with "@claude" in its body.
    - Six tests were added, including the real race with a hidden, lagged older claim. Six mutants were caught.
    - Local `unittest discover`: **2710 OK**.
  - The round-4 thread was replied to with its fix and resolved.
- **Codex round 6:** requested 14:11:07Z on `4942206` (comment 5980893195). Review 5406628222 came in at 14:19:11Z.
  - **No P1/P2.** The Codex Gate on `4942206` turned **🟢 "Reviewed — clear"**.
  - It left **one P3**, REAL but telemetry-only. `missed_slots` returned `floor(gap) + 1`, so it counted the last run's own slot when that run started on its cron minute (an 11:17 run plus a missing 12:17 read as 2).
  - Fixed in **`1ea7618`**: a ceiling over the uncovered span (`slot − last − tolerance`). Five cases are pinned and two mutants were caught.
  - Local `unittest discover`: **2711 OK**.
  - The documented live-smoke counts are unaffected: those runs were created minutes after their cron minute, where both formulas agree.
  - The round-5 P1 thread was replied to with its fix and resolved.
- **Codex round 7: CLEAN.** Requested 14:26:00Z on `1ea7618` (comment 5981027524). Codex comment 5981068900 at 14:30:18Z: "Didn't find any major issues… Reviewed commit `1ea76189cb`". It added 👍 on the PR, and the summary reads "Code Review ✅ Completed `1ea7618`".
  - **Codex reports a clean result as an issue comment plus 👍, not as a PR review object.** A watcher keyed only on reviews misses it, so check the summary comment and reactions too.
  - Final state on `1ea7618`:
    - `check-codex-status` 🟢 "Reviewed — clear", and the `codex-gate-evaluator` reports "✅ current_head_signal_no_active_findings";
    - CI `test-message-format` passed;
    - all **6/6** Codex finding threads were replied to with their fix and resolved;
    - **no labels**; the PR is still a **draft**.
- Gate evaluator warning, pre-existing and automation-owned, NOT touched: "trusted head marker publish failed … Resource not accessible by integration".
- Coordinator: review, then mark ready.

## Production evidence inspected (read-only)

- **State copies**
  - `git show origin/main:state/techfeedil.json`: blob `8a10e806…`, written by `ab32523965` at 06:29:38Z.
  - `state/techfeedil-health.json`, written by `73f6380267`.
  - Replay copies from `17c60b1` and `70ae2a4`.
- **Actions** (`gh api` GET only)
  - `poll-techfeedil.yml`: 633 runs (628 schedule + 5 dispatch).
  - Non-success runs explained:
    - budget: 36284663019 and 33355852516;
    - git push failure after 8 posts: 34292712178;
    - timeout: 31947704293;
    - runner not acquired: 31125869870 and 31121072192.
  - Last 7 days: 13 of 168 hourly slots ran. 111 of the misses fall in the budget blackout 09-26T23:50Z → 10-01T23:22Z; the rest are schedule events GitHub never delivered. The repo gets about 25% delivery overall, and queue delay was 0 s on every run.
  - Three repository-wide budget blackouts: 5.3 d, 4.0 d, 4.9 d.
- **Stale post.** Gadgety iPhone Duo (https://www.gadgety.co.il/369122/iphone-duo-announced/) went out as Telegram message 1192 at 10-04T00:11:48Z. Its first-party `article:published_time` is 09-09T18:35:27Z, so it was 581.6 h old at publication. All 103 traced posts since 09-10 were older than 72 h.
- **Pipeline block.** 12 of 13 polls since the blackout posted 0, from two causes:
  - phase-2 head-of-line blocking by 403-blocked The Verifier and TGspot rows;
  - oldest-first phase-1 admission that dropped current items over the cap.
- **Backlog at task start**
  - `deferred_items` 521: pc 89, tgspot 88, theverifier 84, geektime 77, n12 70, gadgety 66, walla 30, TGR 14, hwzone 3.
  - 483 rows carry a trusted `published_at`, all older than 7 d; 38 are undated (35 N12 TECH12, 3 TGR).
  - `suppressed_items` was at its 300 cap: 74 evicted, 2 rediscovered.
  - No `runtime_ops` block. Source Health had 9 open incidents, 25–76 d old.
- **Subtitle regression.** Geektime iOS 27, read via Telegraph `getPage`: the stored subtitle (148 chars) is a clipped prefix of the 181-char first paragraph, ending mid-date. The same text went to Telegram.

## What was implemented

### Freshness (`core/freshness.py`, `freshness:` config; TheMarker inert)

- **Tiers:** time_sensitive 24 h, time_bound 48 h, normal 72 h (default), evergreen 168 h (structural evidence only).
- **Hard cap:** 168 h, clamped in code.
- **Classification:** structural evidence only — publisher RSS categories kept on the row, publisher-scoped URL rules, feed tiers. Conflicts take the shorter tier. Title words are support only.
- **Proven age** = the maximum of a trusted `published_at` (counted even without `first_seen`), `first_seen_at` (a lower bound), and a trusted page date (`meta`/`jsonld`/`wp_rest`/`jina`, older-only).
- **Unknown dates:** never evergreen. **An age that cannot be proven is never published:** an undated row whose page has no trusted date is suppressed as `unknown_publication_date:<tier>:seen<h>h`.
- **Checks:** at admission (before the cap), by a per-poll queue pass over ALL rows, by a pre-network gate (also covers backfill), and by a pre-publication gate (before the quality gate and before Telegraph).
- **Stale rows are SEEN/SUPPRESSED.** No retry, event, terminal, Telegraph page or DM, and never publisher-recovery proof.
- **Registry:** cap 3000, evicted by last feed sighting (TheMarker keeps 300 FIFO).
- **Current-first:**
  - every fresh identity is admitted (`admit_all_discovered_identities`);
  - dated rows are planned newest-first, then undated rows;
  - one probe per blocked publisher;
  - `max_items_per_run: 10` stays the single attempt budget, and the 30-min grace is unchanged.
- **Merges** keep the earliest trusted date.

### Copy-only replay (`tools/techfeedil_freshness_replay.py`)

**EARLIER run, historical:** during the task, on the task-start Tech state (`ab32523`) and the pre-Codex code. For the current pre-merge replay (526 → 505 / 21 / 805), see FINAL STATE. **READ-ONLY PHYSICALLY OBSERVED** (copy-only; the tracked files' sha256 values were unchanged).

| Measure | Result |
| --- | --- |
| Rows before | 521 |
| Suppressed | **505**, all older than 168 h (normal 496, evergreen 9) |
| Retained | **16** (n12 13, TGR 3), all undated; first-sighting lower bound ≤ 59.9 h; each still needs a trusted page date to publish |
| Registry | 300 → 805 of 3000, 0 evicted |
| Ledgers | 575 events, 1224 `posted_guids`, 25 terminal: all unchanged |
| Retries consumed | 0 |
| Second pass | 0 (idempotent) |
| Plan | newest-first; 16 ready, attempt limit 10 |
| Source Health "stale awaiting suppression" | gadgety 66, geektime 77, pc 89, tgspot 88, theverifier 84, n12 57, walla 30, TGR 11, hwzone 3 → 0 |

Identical counts at 10:26Z (`17c60b1`) and 11:26Z (`70ae2a4`).

### Runtime Ops (generalized, not forked)

- **Profiles:**
  - `pipeline`: TheMarker, byte-identical.
  - `multi_publisher`: Tech, with a per-publisher WAITING_EXTERNAL `external_source_access` incident that resolves only on real extraction or publication evidence after the epoch.
  - `guardian`: no code-fix ladder, no needs-owner Issue.
- **Source Health bridge** (read-only, ≤ 30 h). A health verdict never outranks newer send-path evidence (`completed_at` versus `last_seen_at` / `last_post_at`).
- **`shared_credential_wait`.** Tech waits while TheMarker's GitHub-sync activity (any outcome) is within 18 h. One shared `AUTOMATION_PAT`, one DM, and no false "renew" DM after a renewal.
  - Since `1071b6f` (Codex round 8), each governance move closes the incident that no longer owns the DM: `shared_owner_stale` for the wait, and `shared_owner_resumed` for Tech's owner incident, the latter without a false cancel or reminders.
- **Owner DMs only for OWNER_ACTION_REQUIRED,** in five parts (`הבעיה` / `המערכת` / `צריך ממך` / one `קישור`).
- **Sync tool (final, after Codex rounds 1 and 5):** every fixer wake waits while ANOTHER tenant holds the repository repair slot. That covers a create, a `claude-fix` label add, and a new-epoch re-trigger.
  - The slot is the oldest WOKEN claim, else the oldest claim.
  - Acquisition is two-phase: open the claim without `claude-fix`, settle, re-elect with a label-free read, and label only if elected.
  - The wait is visible and bounded: `code_fix.slot_wait`, with `repair_slot_blocked` after 48 h.
  - The original "only a new create waits" rule is SUPERSEDED.
- **Provider discovery** runs only for a config with a discovery section. Tech never runs it, even over planted state.
- **Tech AI provider scouting stays disabled.**

### Guardian

- **Schedule:** `guardian-techfeedil.yml` at `47 * * * *` plus dispatch with `dry_run`. The poll cron moved from `0 * * * *` to `17 * * * *` (SUPERSEDED).
- **Classifier** (`core/publication_guardian.py`, pure): the expected slot S = the latest HH:17 at or before now − 30 min, read from the real Actions API and the production heartbeat. States:
  - HEALTHY_QUIET, HEALTHY_WAITING
  - SCHEDULER_GAP, POLL_DELAYED_OR_STUCK
  - WORKFLOW_FAILED / CANCELLED / TIMED_OUT
  - HEARTBEAT_STALE, PIPELINE_BLOCKED
  - OBSERVABILITY_FAILURE
- **Self-heal:**
  - one dispatch of the NORMAL poll per slot, deduplicated by the sidecar and the Actions API;
  - never while a poll is queued or running, or while the tenant lock (Source Health / Backfill) has a pending member;
  - never Backfill; cap 8 per rolling 24 h; confirmed via the API.
  - A run that provably failed before the poll step (including a budget block that has already lifted) gets one redispatch.
- **Owner DMs:** only `owner_actions_permission` (a refused dispatch, GitHub's `disabled_inactivity`, a read 403 on 2 consecutive slots). A 401, `disabled_manually` and transient errors never DM. `owner_actions_budget` is never emitted.
- **Writer safety:**
  - own concurrency group;
  - checkout persists no token; the GitHub and Telegram steps run separately;
  - sidecar `state/techfeedil-guardian.json`, body-free, committed alone and only on a material change.
- **Documented residuals:**
  - a lost sidecar commit can cause one duplicate owner DM;
  - the in-GitHub Guardian cannot see a total GitHub outage, so the **external dead-man is PENDING**.

### Source Health ownership

- Runtime Ops owns actionability: no urgent or reminder DMs for Tech, and ONE daily digest with a "Runtime Ops (autonomous):" section. The section is built from a deep copy and includes the Guardian line (only run-creating dispatches are counted).
- Stale rows count as `stale_awaiting_suppression`, never stuck.
- Only the bridged owner-action component/reason pairs stop being red. Corrupt token files, transient errors and failed DM delivery stay red.

### Quality monitor (Tech profile)

- **What it inspects:** the poll re-checks the page as stored by Telegraph, via a read-only `getPage`.
- **Finding classes:**
  - the publisher's own validators: foreign script, vendor label, bidi/wrapper;
  - structure;
  - provable truncation and subtitle/body duplicates;
  - title duplicates, with direction marks stripped;
  - boundary refusals;
  - missing Instant View, which replaces the old IV owner DM.
- **Bounds:** samples ≤ 80 chars, at most 10 findings per post, 200 stored, 20 filed per run.
- **Filing:** in-job, by the poll step "Record Tech quality findings", on the tenant's own rolling Issue (label `quality-findings-techfeedil`).
  - It uses the job `GITHUB_TOKEN`: no workflow trigger, `@`/`#` neutralized, no git commands.
  - It logs to the tenant's gitignored log.
- **Routing:** a switched-off section files nothing; only TheMarker uses the legacy filer. TheMarker's `quality-monitor.yml` is unchanged.

### Descriptions and Unicode

- **Descriptions:** the first STRUCTURALLY complete candidate wins (deck → og → meta → JSON-LD).
  - Rejected: clipped prefixes, paragraph + clipped start, and a candidate's own ellipsis.
  - Missing final punctuation is never truncation.
  - A duplicate of any opening paragraph renders once.
  - Telegram gets exactly the Telegraph subtitle (`resolve_display_subtitle`); dynamic fitting is unchanged.
- **`core/script_policy.py`** (`features.script_policy_v1`, Tech only): Hebrew plus every Unicode "LATIN" letter, ª/º and µ/μ.
  - Marks are allowed only on a valid base, and only Latin/common diacritics or Hebrew points.
  - Cyrillic, Arabic, Greek, CJK, fullwidth/math and homoglyphs stay blocked; invisible format characters are cleaned.
  - TheMarker is byte-identical: a reviewer ran 1,493 probes against base and branch.

### Workflows

- **`poll-techfeedil.yml`:**
  - cron `17 * * * *`; ff-refresh; Runtime Ops sync step (`AUTOMATION_PAT` only there); quality filing step;
  - permissions `contents: write`, `issues: write`, `pull-requests: read`;
  - checkout `persist-credentials: false`, with the token only in the git and API steps via env;
  - job timeout 26.
- **`commit_tenant_state.sh`:** `--autostash`.
- **Unchanged:** `quality-monitor.yml`, `claude.yml`, Codex, Gate, Merge Bot, watchdog and CI Doctor. **No second fixer, Gate, Merge Bot or watchdog was added.**

## Hostile review (§33)

- **Coverage.** Four parallel read-only reviewers: runtime/Guardian/workflows; freshness/queue; description/Unicode/quality; data safety/tests.
- **Outcome.** All fixed or documented, and every fix has a regression test.
  - The evidence report's §4a table records three P1 rows (R1.1, R1.2, R4.1); the rest are P2/P3.
  - An earlier summary said "6 P1-class items". That figure could not be re-derived from the table, so the table is the record.
- **Biggest catch.** The quality-filing step logged into TheMarker's TRACKED `state/errors.log`, which would have made every Tech state push fail. Fixed.
- **Process note.** A reviewer's scratch script dirtied the tracked `state/errors.log` (two lines at 10:52:56Z). Those lines were removed by hand before committing; `state/` is identical to HEAD.

## Deterministic validation (local; CI is 3.11, this venv is 3.13): historical, at `7af4d7d` before the Codex rounds

For the final tree, see FINAL STATE: exact-head CI on `1ea7618` ran 2711 tests OK. The counts below are the pre-Codex figures, kept as recorded.

| Check | Result |
| --- | --- |
| `python -m unittest discover` on `7af4d7d` | **Ran 2668 tests, OK** |
| `python -m tests.test_message_format` | All passed |
| compileall | OK |
| node | 21 pass |
| tracked workflow YAML | 21 parsed |
| `bash -n` | OK |
| `git diff --check` | clean |
| `git diff --exit-code -- state/` | clean |
| 3.11 grammar check | 38 files OK |
| TheMarker, provider, Runtime Ops and health regressions (32 modules) | 1871 OK |

New suites: freshness 38, replay 3, Tech Runtime Ops/owner-DM 39, quality 29, descriptions 31, script policy 33, Guardian classifier 86, Guardian tool 68.

## Read-only physical validation (READ-ONLY PHYSICALLY OBSERVED)

- **Guardian dry-run** on remote main (GET only, no dispatch, no DM, no sidecar):
  - 10:35Z: `SCHEDULER_GAP` (slot 09:17Z, 3 missed); latest run 37182923828; heartbeat 06:29:29Z.
  - 11:30Z, after the fixes: 4 GETs including the tenant-lock reads, `SCHEDULER_GAP`.
  - Five real failed runs diagnosed correctly.
- **Live Geektime GETs** through the production parser in-process: iOS 27, Anthropic and Duo now resolve to their complete decks (100/118/117 chars) instead of the clipped og.
- **Jalapeño** (NFC and decomposed) passes V1 and V2 in-process; the blocked classes stay blocked.
- **Publisher probes** from this sandbox:
  - TGspot: direct 403 + Jina 403, classified `publisher_direct_and_jina_403`;
  - The Verifier: item-level failure, and its newest item is a 73.7 h deal, stale at admission;
  - N12 and TGR: healthy, with `meta` dates;
  - pc.co.il: RSS 403 from this sandbox.
- **Quality detectors** on real stored pages: iOS 27 gives `description_truncated`; the clean page gives none (reviewer: 14 pages, no false positives).

## NOT physically observed / POST-MERGE OBSERVATION PENDING

- A real Guardian self-heal dispatch on `main`, plus its replacement run and sidecar commit.
- The first post-merge poll's cleanup on production state, and no stale post.
  - The replays measured 505 suppressed at both clocks: earlier 521/505/16, current 526/505/21, registry 805.
  - The real count depends on the poll's own time and state.
- A real rolling-Issue write by the Tech quality filer.
- A Source Health digest that carries the Runtime Ops section.
- **The external dead-man outside GitHub Actions:** PENDING, no vendor selected.
- **Tech AI provider scouting:** disabled until the shared discovery path has real successful scout evidence and a future owner decision enables it.
- **Known limitations:**
  - Walla RSS labels local time as GMT (+3 h), bounded by `first_seen_at`;
  - no production time-bound category yet;
  - Actions budget headroom: realistic cost about +300–450 min/month; worst case bounded by the dispatch cap of 8/day. Owner review recommended.
- **CI, Codex and Gate results on #113:** all green on `1ea7618` after 7 Codex rounds (see Git / PR).

## No merge, no deploy

This task merged nothing and dispatched nothing in production. It sent no Telegram message, made no Telegraph write and ran no Backfill.

Previous handoff (Provider Discovery v1, PRs #110/#112, merged) is in the git history of this file.
