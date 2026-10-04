# paywall-bot handoff — 2026-10-04 UTC (Tech Feed IL: autonomous runtime ops, freshness and publication guardian — DRAFT PR #113, NOT merged)

## Headline

The owner milestone "Tech Feed IL: autonomous runtime ops, freshness and publication guardian" is implemented, hostile-reviewed and pushed as **draft PR #113**.

After seven Codex rounds (clean on `1ea7618`) and coordinator review, a narrow finalization round followed:
- the docs/comments-only **`9aca413`**;
- Codex round 8 on it raised one REAL P2 (shared-PAT incidents were not reconciled when governance moved), fixed in **`1071b6f`**;
- round 9 on `1071b6f` was CLEAN, and the exact-head CI and Gate are green there.

Final head: **`1071b6f35fb0d52244c52175fc6639142141f362`**. See "FINAL STATE" below.

- **It is NOT merged and NOT deployed.**
- Nothing on `main` changed through this task; no production state was edited.
- Everything below is labelled with its evidence class:
  - **DETERMINISTICALLY TESTED**
  - **READ-ONLY PHYSICALLY OBSERVED**
  - **POST-MERGE OBSERVATION PENDING**

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
