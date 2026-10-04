# paywall-bot handoff — 2026-10-04 UTC (Tech Feed IL: autonomous runtime ops, freshness and publication guardian — DRAFT PR #113, NOT merged)

## Headline

The owner milestone "Tech Feed IL: autonomous runtime ops, freshness and publication guardian" is implemented, hostile-reviewed and pushed as **draft PR #113**.

- **It is NOT merged and NOT deployed.**
- Nothing on `main` changed through this task; no production state was edited.
- Everything below is labelled with its evidence class:
  - **DETERMINISTICALLY TESTED**
  - **READ-ONLY PHYSICALLY OBSERVED**
  - **POST-MERGE OBSERVATION PENDING**

## Git / PR (exact)

- START_MAIN_SHA: **`ad974de877da614eb5ab3bf6e71d3a0f25a83c71`**.
  - Branch-point `origin/main`, checked with `gh api` at task start.
  - `origin/main` later gained only state commits: `17c60b1` (techfeedil source health 10:04Z) and `70ae2a4` (themarker 10:54Z), with no code changes.
- Branch: `feat/techfeedil-autonomous-runtime-freshness-20261004`.
- Final project HEAD: **`7af4d7d8a65c25f1cd545e600966606121a548e6`**. Verified equal on local HEAD, the remote branch (`git ls-remote`) and the PR head (`gh api …/pulls/113`).
- Commits:
  - `00f0fa4` script policy + description completeness
  - `447a168` Runtime Ops profiles + repository-wide repair single flight + config-gated discovery
  - `b4d686c` Tech freshness / current-first queue / Runtime Ops enrollment / Source Health ownership / quality
  - `f31c70e` Guardian
  - `7af4d7d` docs
- **Draft PR #113:** https://github.com/funzi7/paywall-bot/pull/113
  - Created as a real draft; the API reports `draft: true`, no labels.
  - No `automerge`, override or `no-automerge` label was needed, because Merge Bot skips drafts (`isAutoMergeCandidate`: `pr.draft` → false).
- **CI on #113 (GitHub runner, Python 3.11):** `test-message-format` **success** in 2m4s (Actions run 37199666333, job 111428567352). That job includes the full `unittest discover`, the focused Tech suites, compileall, the node tests, the workflow YAML parse, `bash -n`, and the `state/` and `diff --check` checks.
- **Codex review and Gate on #113: not yet observed.** The Gate's `check-codex-status` reads "🟡 Waiting for Codex review" ("Codex has not reviewed head 7af4d7d"). That is its expected initial state; its conclusion is `failure` by design until a clean review.
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

**READ-ONLY PHYSICALLY OBSERVED** (copy-only; the tracked files' sha256 values were unchanged).

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
- **Owner DMs only for OWNER_ACTION_REQUIRED,** in five parts (`הבעיה` / `המערכת` / `צריך ממך` / one `קישור`).
- **Sync tool:** a new `claude-fix` repair waits while ANOTHER tenant's runtime-incident repair is open (`single_flight_wait`).
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
- **Outcome.** 6 P1-class items, all fixed, plus P2/P3s, all fixed or documented. Every fix has a regression test.
- **Biggest catch.** The quality-filing step logged into TheMarker's TRACKED `state/errors.log`, which would have made every Tech state push fail. Fixed.
- **Process note.** A reviewer's scratch script dirtied the tracked `state/errors.log` (two lines at 10:52:56Z). Those lines were removed by hand before committing; `state/` is identical to HEAD.

## Deterministic validation (local; CI is 3.11, this venv is 3.13)

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
- The first post-merge poll's cleanup: 505 suppressed, registry about 805, no stale post.
- A real rolling-Issue write by the Tech quality filer.
- A Source Health digest that carries the Runtime Ops section.
- **The external dead-man outside GitHub Actions:** PENDING, no vendor selected.
- **Tech AI provider scouting:** disabled until the shared discovery path has real successful scout evidence and a future owner decision enables it.
- **Known limitations:**
  - Walla RSS labels local time as GMT (+3 h), bounded by `first_seen_at`;
  - no production time-bound category yet;
  - Actions budget headroom: realistic cost about +300–450 min/month; worst case bounded by the dispatch cap of 8/day. Owner review recommended.
- **CI, Codex and Gate results on #113:** not observed at handoff.

## No merge, no deploy

This task merged nothing and dispatched nothing in production. It sent no Telegram message, made no Telegraph write and ran no Backfill.

Previous handoff (Provider Discovery v1, PRs #110/#112, merged) is in the git history of this file.
