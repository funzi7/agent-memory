# paywall-bot handoff — 2026-10-05 UTC (Tech Feed IL post-merge acceptance of #114 + #115; docs-only PR #116 DRAFT + `no-automerge`, NOT merged; Codex quota exhausted → Claude Code fallback review)

## Headline

Post-merge acceptance and final handoff for Tech Feed IL after the merged PRs **#114** (`dc9ab26`, `queue: max`) and
**#115** (`6929d95`, official publisher Telegram channels + finished descriptions). Evidence reconciliation and
documentation ONLY.
- **No defect was reproduced, so no runtime code, workflow, config, test or state changed.**
- ONE docs-only PR, **#116**: DRAFT, carrying `no-automerge` (verified present), not marked ready, NOT merged.
- No production state was edited, nothing was dispatched or re-run, there was no Telegram send or Telegraph write, no
  concurrency collision was manufactured, and no native story was manufactured or backfilled.

## FINAL STATE

- **paywall-bot HEAD:** `1d7881d3b3d4c28c506d39d95c34959fc2249425` on `docs/techfeedil-postmerge-acceptance-20261005`,
  four docs-only commits on `origin/main` `824a7b86d3deb83e8f2cc3b14375b410d3c3f272`:
  - `9f41b5e`: the acceptance docs;
  - `352175e`: the fallback-review fixes;
  - `cfffbc3`: the final verifier's P3 wording;
  - `1d7881d`: one last scoping nit ("the #114 merge" in report §8.7).
  Verified equal on the local HEAD, `git ls-remote` and the PR head at 20:11Z. The worktree is clean.
- **PR #116** (https://github.com/funzi7/paywall-bot/pull/116): OPEN, **DRAFT**, **`no-automerge`** applied at
  creation and verified, NOT merged. Six `.md` files only, proven docs-only: no `state/` change, nothing untracked.
- **Exact-head CI on the final head `1d7881d`:** run 37367296834 (job 111955425119), CPython 3.11.16, success
  (20:08:36Z → 20:10:33Z).
  - Message format passed; "Ran 2885 tests" OK; Node 21/21; "parsed 21 workflow files".
  - Earlier heads:
    - `9f41b5e`: run 37361633585, success, 2885 OK;
    - `352175e`: run 37365088492, success, 2885 OK;
    - `cfffbc3`: CI was still queued when `1d7881d` superseded it.
  - Locally: `unittest discover` 2885 OK under the t.me/gkt.me request guard; `test_message_format` passed.
- **Review: NOT Codex.** Codex answered "@codex review" (19:11:53Z) with comment 6001297396 at 19:12:02Z: "You have
  reached your Codex usage limits for code reviews." The owner then asked for a Claude Code review.
  - `review_provider = claude_code_fallback`, `reason = codex_quota_unavailable`.
  - Before the first commit, an adversarial fact-check found 0 P1, 2 P2 and 15 P3, all fixed.
  - Two independent reviewers then reviewed `9f41b5e`:
    - requirements/policy: 0 P1, 3 P2, about 12 P3;
    - accuracy: 0 P1, 1 P2, 9 P3.
    All were fixed in `352175e`. Among them: the pre-merge §7 list restored verbatim as history, the CONTEXT §6
    SUPERSEDED entries named, a TheMarker-on-#115 PENDING item added, PC rows marked inferred, and time bounds added.
  - Final verifier on `352175e`: CLEAN (no P1/P2). Its 7 P3 wording nits were fixed in `cfffbc3`.
  - An independent check rated `cfffbc3` CLEAN (0 P1/P2) with 2 P3:
    - the report §8.7 nit, fixed in `1d7881d` (a one-line diff, confirmed);
    - the PR-body nit, fixed in the description.
  - Accepted as-is: 1 cosmetic source-line wrap in report §8.2, which renders identically.
  - **Attestation:** PR comment 6002119915 (20:11:37Z), fields:
    - `provider=claude_code_fallback`, `reviewed_head=1d7881d3b3d4c28c506d39d95c34959fc2249425`, `verdict=clean`;
    - `findings_found=34`, `findings_fixed=33`, `unresolved_p1=0`, `unresolved_p2=0`;
    - `validation=exact-head CI 37367296834 …`, `reason=codex_quota_unavailable`.
  - This repository's Codex Gate has no fallback-attestation path, so `check-codex-status` gets no review signal for
    this head. The PR stays DRAFT + `no-automerge`.
- **`origin/main` at the end:** `824a7b86d3deb83e8f2cc3b14375b410d3c3f272`, unchanged since the branch start (20:11Z). No
  Tech poll ran after 18:27Z; any later state commits are production writes, not task changes.

## #115 — merged (READ-ONLY PHYSICALLY OBSERVED)

- **Merge sequence.** The owner marked it ready (15:38:54Z) and removed `no-automerge` (17:51:10Z).
  - Merge Bot run 37351589338 (job 111903483146) logged at 17:52:08Z "#115: cleared transient needs-owner +
    needs-owner-auto after exact-head fully-green validation; continuing to merge", then "#115: merged ✅".
  - The result was squash `6929d9565f5bd2ebbae01e64d329bf6f1a9a1a2c` at 17:52:10Z. GitHub shows `funzi7` because the
    PAT is the owner's.
- **The merged head `cea598b`:**
  - exact-head CI 37349205043: 2885 tests OK;
  - Codex round 8 clean (17:42:52Z);
  - `check-codex-status` 🟢 at 17:43:16Z and 17:51:37Z.
  - Its code equals `6929d95`; only the 16:24–16:25Z state files differ.
- **Main CI 37351655460** (job 111903705393, CPython 3.11.16) on `6929d95`: success.
  - message format passed; 18 focused suites OK; "Ran 2885 tests" OK;
  - Node 21/21; "parsed 21 workflow files";
  - `bash -n`, `git diff --exit-code -- state/` and `git diff --check` all passed.

## First post-merge poll 37352458678 (manual `workflow_dispatch` as `funzi7`, `6929d95`, 17:58:35Z → 18:00:41Z, success)

- **Official channels:** "geektimecoil: 20 messages", "TheVerifier: 20 messages", "channels read=2 unreadable=0
  linked_articles=31".
- **Geektime first-enable baseline:** "phase1 bootstrap source=geektime::official-telegram: recorded 20 existing feed
  identities without publishing; use manual backfill for history".
  - State `poll_baseline_sources["geektime::official-telegram"]`: `initialized_at` 2026-10-05T17:59:22.083931Z,
    `generation` 1, keys `https://t.me/geektimecoil/17867`–`17886` (20, consecutive).
  - The Verifier is linked-only (`native_posts` not enabled), so it has no native baseline, by design.
- **No historical native flood.** "posted=10 (telegram: 0, direct: 10, …)". Those numbers are `pub_<source>` counts:
  `telegram: 0` is `pub_telegram` (articles published through the `telegram` extraction source), and a native would show
  as a separate `telegram_native: N`, rendered only when non-zero. The 10 posts are messages 1237–1246, all `direct`: PC 8, Gadgety 1, Walla 1.
  There was no `NATIVE-POST` line, no `telegram_native` block, no `pub_telegram_native` and no `native_rejected:*`.
- **Day totals.** "Today total: posted=35, deferred=29 (retries-pending), permanent_fail=0, errors=0".
  - State: posted 25 → 35 = `pub_direct` 35.
  - `deferred` counts deferral EVENTS (28 → 29). The queue itself went 24 → 15 rows.
- **State commit:** `2624d4b4b489a5908a295d707a31b98c11de7bd9` (github-actions[bot], 18:00:35Z) changes only
  `state/techfeedil.json`. Every other state file is byte-identical, TheMarker's included.
- **Quality:** "quality_inspector: no new quality issues to file". This is not proof of future quality.
- **Runtime Ops:** open=1 waiting_external=1. The incident is `eee81f7e4c48a57e`, TGspot's publisher block (403
  direct+Jina), unrelated.

## Production punctuation + bounded audit of the 10 descriptions (READ-ONLY)

- **Where the period was added.** `DIAG subtitle finish=period` appears on the 8 PC posts. Gadgety 370270 (og 148)
  and Walla 3870955 (deck 184) already ended with `.` and were unchanged.
- **Classes:** OK 2 (Gadgety, Walla: first-party verified), A 8 (PC: INFERRED from the production trail), C 0,
  **B (clipped) 0, D (other, incl. ambiguous) 0**. This covers this bounded sample only.
- **Telegram = Telegraph = `SUBTITLE-RECORD`** for all 10, each with exactly one final mark and no `..`.
- **Why the PC rows are inferred, not observed:** PC pages and their `r.jina.ai` copies answer 403 (Cloudflare) to
  this sandbox, so they rest on the production trail.
  - Production fetched each page with HTTP 200 (268,912–273,556 bytes).
  - No `DIAG subtitle overlap=` rejection line appears, so the first candidate (PC's visible deck) was accepted.
  - The texts share at most 11 opening characters with the body, and `candidate_chars + 1` equals the published
    length.
- **PC's `●` separator:** publisher-owned and pre-existing (messages 1212/1219/1220/1228/1235; polls 37250890466,
  37287364094, 37340553586); it never ends a subtitle.

## Second post-merge poll 37355922941 (schedule, `2624d4b`, 18:26:11Z → 18:27:39Z, success; state `824a7b8`)

- It was the first scheduled Tech poll since 09:01:53Z.
- It read both channels again and published 5 `direct` posts (messages 1247–1251: mako 2, Gadgety 1, Geektime 2), no
  native. Day total 40 = `pub_direct` 40.
- Two more `finish=period` lines appeared, on mako (299→300, 176→177). Gadgety and Geektime already ended with
  `.`/`?`.
- **First `telegram_native` write:** an empty native `ledger` plus two body-free `article_hashes` (`source_id`
  geektime), created by publishing the Geektime articles.

## Linked description and native: status (PRECISE)

- **Linked:** 31 linked articles indexed per poll. `_linked_telegram_text` runs before every article parse and logs
  `DIAG official telegram description candidate` when it has text; that line appears in neither poll. The two
  Geektime articles published their visible decks: their channel posts (1249 ← 17884, 1250 ← 17882) are headline +
  link only, so they offer no candidate.
  - **PENDING:** the first publication actually using an official-Telegram linked-description candidate.
  - **PENDING:** a NEW channel post classified LINKED whose article publishes exactly once.
- **Native:** at 18:33:49Z the geektimecoil preview's newest message was still 17886 (13:04:59Z), so Geektime has
  posted nothing since the baseline.
  - **PENDING:** the first real post-baseline native: its classification, format, original t.me attribution, pinned
    source-media preview where applicable, `pub_telegram_native`, ledger, and no duplicate afterwards.
  - Nothing was manufactured.

## #114 (`queue: max`) acceptance

- **DONE: GitHub accepts and runs the changed poll workflow.** This settles the workflow-level `queue: max` form,
  which Source Health also uses; the job-level Backfill form has not run yet. All three runs succeeded:
  - 37340553586: the Guardian's dispatch, 16:24:12Z, `3427b55`, which contains `dc9ab26`;
  - 37352458678;
  - 37355922941.
- **No `startup_failure`:** 0 among the 330 runs created from the #114 merge to ~18:35Z, and 0 among the 1239 runs
  since 2026-09-28T18:00Z (the earliest at 2026-10-01T23:22Z), counted on `conclusion`. The `status=startup_failure`
  filter accepts any value.
- **The Guardian (4th self-heal).** Guardian 37340511887 (schedule 16:23:53Z, success) logged `tenant_lock {"pending": [],
  "readable": true}`, `SCHEDULER_GAP … missed_slots=7`, and `dispatch … 204 accepted run_id=37340553586
  confirmed=true`.
  - Sidecar `84c7494`; counters 4/4/4.
  - The Guardian is outside `bot-state-techfeedil`: its own group, default queue, comment-only change in #114.
- **TheMarker's workflow and queue configuration is unchanged by #114:** `poll.yml` has no diff; the Backfill
  `site=themarker` group, queue and cancel settings are identical. No TheMarker poll has run since #115 merged; that
  check is PENDING.
- **PENDING:**
  - the first `source-health-techfeedil.yml` run (cron `37 3 * * *`; last run 10:49Z, before #114) and the first Tech
    Backfill run on the new queue;
  - a NATURAL two-member wait. The three member runs never overlapped, and the concurrency-groups API showed 0 active
    groups and a 404 for the group at 18:14Z/18:29Z. Never manufacture a collision.

## DONE / PENDING / FUTURE (reconciled; repo: CONTEXT §6 block 2026-10-05c, #113 ADR §13, #115 report §7)

- **DONE (merged):** #113 `62e467b`, #114 `dc9ab26`, #115 `6929d95`.
- **DONE (observed):**
  - #114: workflow startup for the poll, and for the Guardian workflow (comment-only change);
  - the first Guardian and poll runs on the post-#114 main;
  - #115: main CI, both official channel reads, the Geektime baseline, no history flood, production punctuation, the
    bounded 10-post audit (0 clipped), quality filing ("no new issues"), the first `article_hashes` write;
  - 4 Guardian self-heals; the 505-row cleanup.
- **PARTIALLY OBSERVED:**
  - no stale publication: 20/20 posts since #114 were dated, 1.8–9.4 h old; Walla rows 7.3–8.8 h corrected; 3 older
    undated mako rows remain;
  - the Source Health digest via the governed path (DM text not visible; no Source Health run since 10:49Z);
  - no clipped description (first polls only).
- **PENDING:**
  - the first TheMarker poll on #115's merged shared code (none since the merge; the last TheMarker poll was
    37306827516 at 12:02Z on `dc9ab26`). Its isolation is deterministically tested only;
  - the first real native post (discovery, classification, format, t.me, pinned media, `pub_telegram_native`,
    ledger, no duplicate);
  - the first linked-description use;
  - a linked post plus its article publishing ONE time;
  - #114: Source Health and Backfill first runs, plus a natural two-member wait;
  - a real Tech quality-Issue write (none needed yet);
  - the external dead-man (no vendor; 2026-10-05 again had no scheduled Tech poll from 09:01:53Z to 18:26:11Z, and
    the Guardian was undelivered from 07:42Z to 16:23Z);
  - Tech AI provider scouting stays disabled;
  - Walla +3 h: still reproduces (3870955 page `13:45:00+03:00`, stored `13:45:00+00:00`);
  - `time_bound`: none in 9 post-#113 polls (normal 510, evergreen 11);
  - Actions budget (not readable);
  - the lost-sidecar duplicate DM (not observed);
  - cosmetic: Codex thread 4178858301 on closed #113 is unresolved and unanswered (fix merged).
- **FUTURE:**
  - the #113 ADR §13 list;
  - the #115 report §7 list: natives for more publishers, older-article citations, og-only and visible-deck clips,
    the #113 prefix floor, MarkdownV2 backslash, preview GET deadline, `flash` sentinel, Gadgety "• •" (seen again in
    37352458678), and the generic Telegram layer's (b)–(d);
  - **owner roadmap (2026-10-05), roadmap only:**
    1. channel branding/marketing identity: subtle differentiation; tagline, bio and pinned message; no per-post
       marketing noise without approval;
    2. an original logo: avatar-size legible; square plus a later wide variant; no publisher look-alike; NOT
       generated;
    3. a future Android app on the same data/publication layer: no second ingestion system; categories, sources,
       notifications, read-later, article/IV; architecture later; NOT started.
- **SUPERSEDED:**
  - owner approved 2026-10-04: #113 ADR §12;
  - owner approved 2026-10-05: README's "does not ingest another Telegram channel", replaced by the verified
    allow-list. "Missing final punctuation alone is not truncation" is NOT superseded;
  - engineering, in effect since `dc9ab26`: the tenant lock's guarantee role, now provided by `queue: max`. The hold
    stays as a courtesy.

## Subagents used (read-only, up to 4 in parallel)

1. The 10-post description audit.
2. Runtime/Actions/Merge Bot reconciliation.
3. The state-commit semantic diff.
4. The stale-docs and backlog inventory.

Then, one at a time or in pairs:
- an adversarial fact-check of the first draft;
- the two fallback reviewers on `9f41b5e`;
- a final verifier on `352175e`;
- an independent check of the `cfffbc3` delta.

Every figure recorded here was re-verified against primary evidence.

## Next steps (coordinator / owner)

1. Review PR #116 (docs only). It merges only if the owner marks it ready and removes `no-automerge`.
2. Watch for the first real Geektime native post after the baseline: the `NATIVE-POST` line, the t.me link, the
   pinned media preview and `pub_telegram_native`. Watch also for the first `DIAG official telegram description
   candidate` that wins.
3. Watch the first Source Health run (03:37Z cron) on `queue: max`, and any natural two-member wait. A
   `startup_failure` alerts nobody, so check it by hand.
