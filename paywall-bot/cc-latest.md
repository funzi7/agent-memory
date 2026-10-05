# paywall-bot handoff — 2026-10-05 UTC (Tech Feed IL: official publisher Telegram channels + finished descriptions — PR #115 marked READY by the owner, `no-automerge` held, NOT merged)

## Headline

Owner-approved Tech Feed IL follow-up after merged #113/#114, on a NEW branch and ONE PR.
- **Branch and PR.** `feat/techfeedil-telegram-sources-descriptions-20261005` from `origin/main` `3427b55`, PR
  **#115**: opened as a DRAFT carrying `no-automerge`; the **owner** marked it ready (15:38:54Z, not the task);
  **`no-automerge` is still present; NOT merged.**
- **Goal 1 (official channels).** Tech Feed IL reads the VERIFIED official Telegram channels of its own publishers:
  Geektime `geektimecoil` (native text posts + linked text) and The Verifier `TheVerifier` (linked text).
- **Goal 2 (descriptions).** Today's 20 descriptions audited: none truncated (OK 6, A 12, C 2, B 0). A subtitle
  PROVEN complete without terminal punctuation now renders with one final period (Telegram === Telegraph).
- No production state was edited, no workflow was dispatched, no Telegram/Telegraph write was made, no existing
  message/page/ledger was touched, and no concurrency collision was manufactured. #113/#114 were not modified.

## FINAL STATE

- **paywall-bot HEAD:** `cea598b1e2c7f6725c3650ae046a9583c88c5183` on `feat/techfeedil-telegram-sources-descriptions-20261005`,
  verified equal on the local HEAD, `git ls-remote` and the PR head (17:48Z). Seven commits on `origin/main` `3427b55`,
  all authored by this task (no foreign commit):
  - `7b4a382` feat(techfeedil): official publisher Telegram channels + finished descriptions;
  - `afa5be7` fix: count native-phase crashes and verify native fixes per stage (Codex round 1, 2 P2);
  - `4313811` fix: never index a linked post with an unresolved short link (Codex round 2, 1 P2);
  - `d76f640` fix: keep the native route marker outside the bounded item sample (Codex round 3, 1 P2);
  - `76a0033` fix: show native media via a pinned preview; detect unlinked URLs and cross-promotion (Codex round 5, 2 P2);
  - `b2cb34c` fix: never finish a subtitle ending in a scheme-less URL with a path (Codex round 6, 1 P2);
  - `cea598b` fix: window-pruned equivalence state, revalidate cleaned natives, any domain tail (Codex round 7, 3 P2).
- **PR #115** (https://github.com/funzi7/paywall-bot/pull/115): OPEN, **not a draft** (owner `ready_for_review`
  15:38:54Z), **NOT merged**. Labels:
  - **`no-automerge`**: applied at creation (14:19Z, funzi7 via `gh pr create --label`) and verified present at the end;
  - `needs-owner` + `needs-owner-auto`: added by github-actions[bot] (15:48:57–58Z) when Codex Auto-Fix's 3-round
    breaker tripped on the round-5 review. Merge Bot's provenance check treats this bot-added pair as a transient
    escalation (merge-bot.yml `transientEscalation`), not a manual hard stop.
  - `mergeable: MERGEABLE`; `mergeStateStatus: UNSTABLE` only because of the stale pre-review `codex-gate-evaluator`
    run.
  - The PR body was refreshed at the end through a REST PATCH, because `gh pr edit` fails on the Projects-classic
    GraphQL deprecation. Editing the body triggers no workflow.
- **`origin/main` at the end:** `58bd224a87e643fd1de75c27be8179299343d28b`. Since `3427b55` it has only two bot state
  commits: `84c7494` (guardian state, 16:24:16Z) and `58bd224` (techfeedil state, 16:25:37Z). The branch was not rebased
  and is still mergeable.
- **Exact-head CI on `cea598b`:** run 37349205043, job 111895474021 `test-message-format`, CPython 3.11.16,
  17:32:40Z→17:34:38Z, success. Message format "All tests passed."; 18 focused modules 404 OK; `unittest discover`
  "Ran 2885 tests" OK; Node 21/21; "parsed 21 workflow files"; `bash -n`, `git diff --exit-code -- state/` and
  `git diff --check` passed.
- **Codex: 8 rounds, CLEAN on the final head.** Rounds 1–4 were requested with "@codex review" while the PR was a
  draft. Round 5 was Codex's automatic ready-for-review pass. Rounds 6–8 were requested with "@codex review" after the
  owner marked the PR ready.
  - Round 1 on `7b4a382` (review 5416117249, 14:29:36Z): 2 P2. A caught native-phase crash counted no pipeline
    failure, and native fix verification was not stage-aware → fixed in `afa5be7`.
  - Round 2 on `afa5be7` (review 5416344390, 14:45:56Z): 1 P2. A linked post with an unresolved `gkt.me` link could
    attach its teaser to the wrong article → fixed in `4313811`.
  - Round 3 on `4313811` (review 5416537265, 15:00:14Z): 1 P2. The native sentinel could be dropped by a full
    incident item sample → fixed in `d76f640`.
  - Round 4 on `d76f640`: comment 5997426935 at 15:18:18Z, "Didn't find any major issues. Bravo.", plus a 👍.
  - Round 5 on `d76f640`, the ready-for-review pass (review 5417177113, 15:48:29Z): 2 P2. Media posts were republished
    caption-only, and scheme-less URLs in monospace were not detected → fixed in `76a0033`. Six more independent
    reviewers (four on the fixes, two on the implementation) then widened both fixes to their whole class.
  - Round 6 on `76a0033` (review 5418127273, 17:12:27Z): 1 P2. `example.com/pricing` got a final period → fixed in
    `b2cb34c`.
  - Round 7 on `b2cb34c` (review 5418277509, 17:26:26Z): 3 P2 → fixed in `cea598b`:
    - article hashes were count-capped inside the 7-day window;
    - the published native text was not re-validated after the global cleaner;
    - a domain tail with an unlisted TLD (`startup.tech`) got a period.
  - **Round 8 on `cea598b`:** comment 5999862876 at 17:42:52Z, "Codex Review: Didn't find any major issues. You're on
    a roll.", **Reviewed commit `cea598b1e2`**, with a 👍 at 17:42:58Z. There was no review object and no inline
    finding.
  - All 10 finding threads were answered with the fix commit and resolved (10/10).
  - The bridge's ai-loop attempts 1–3 (14:30Z, 14:47Z, 15:01Z) ended in `state=billing`. At 15:48Z, Codex
    Auto-Fix's trigger job tripped its 3-round breaker (→ `needs-owner`) instead of requesting a fix. No fixer ran,
    no fix request was posted, and every other Claude Fixer/Codex Auto-Fix run was `skipped`.
- **The Gate on `cea598b`:** `check-codex-status` success, "🟢 Reviewed — clear" (17:43:16Z).
  `codex-gate-evaluator` still shows its pre-review failure (17:32:59Z). It is diagnostic only (Merge Bot's
  `NON_BLOCKING_DIAGNOSTIC_CHECKS`).
- **#113 and #114 were NOT modified.** The #113 ADR §13 and CONTEXT now record #114's merge (backlog
  reconciliation only).

## What was implemented (DETERMINISTICALLY TESTED)

### Finished descriptions (`core/article_parser.py`)
- `finalize_subtitle_punctuation`, behind feature `subtitle_terminal_punctuation` (Tech only; TheMarker never reaches
  it).
- It appends one `.` when the accepted subtitle ends with a letter (the base letter under niqqud), a digit, `%` or `°`,
  after closing quotes/brackets are peeled. The period goes after the closers (mako `…שמיעה".`).
- It leaves the text unchanged after:
  - `. ! ? … ׃` or any other punctuation (connectors);
  - symbols and emoji;
  - an e-mail, a `#hashtag` or an `@mention`;
  - a URL or domain: any dotted host of any TLD shape, with or without a path, also after a Hebrew prefix
    (Codex rounds 6–7).
- Brand-shaped final tokens (`Claude.ai`, `Node.js`) therefore get no period. This is documented and conservative.
- Runs ONCE in `_finalize` → `_resolve_rich_subtitle`, after `_select_subtitle`, before Telegraph/Telegram (one text).
  The classifier never sees the period; a rejected candidate never gets one. "Missing final punctuation alone is not
  truncation" is NOT superseded.
- Shown-once fold: a subtitle equal to an opening paragraph up to its terminal punctuation removes that paragraph.

### Official channels (`core/telegram_channel.py`, `official_telegram:` in `sites/techfeedil/config.yaml`)
- Allow-list with first-party `verified_by` proof and pinned `channel_id` (Geektime -1282228958, The Verifier
  -1185382821); feature `official_telegram_sources` + `official_telegram.enabled`. One anonymous GET of
  `t.me/s/<handle>` per channel per poll.
- LINKED (primary link = one publisher article): never a second publication. Its description candidate is the first
  prose line after the headline: edge emoji and label hashtags removed, lines with pointers or inner hashtags
  skipped, 40–600 chars.
  - The candidate is ranked deck → Telegram → og → meta → JSON-LD AT PARSE TIME
    (`_with_official_telegram_candidate`). `_finalize` only appends it after a provisional winner (hostile-review P1:
    otherwise the lede could be lost).
  - A linked post that also carries an unresolved publisher short link is never indexed.
- NATIVE: substantive Hebrew text with NO publisher article link. Links counted:
  - anchors, hidden citations and preview cards;
  - URLs written in the text: scheme, `www.`, `t.me/`, the publisher's host or shortener, any dotted name with a
    path, and path-less common TLDs; inside code spans, any dotted name;
  - `gkt.me`, resolved one HEAD hop (chains and home targets stay unresolved).
- Rejected structurally:
  - promotions, deals, registrations and CTA links/lines;
  - URL buttons;
  - other Telegram chats (mentions, invites, bots, other chats' posts): `telegram_cross_link`;
  - struck or spoiler text: `struck_or_hidden_text`;
  - polls, replies, forwards, short captions and link-only posts.
- Quote/code blocks are line borders. The channel signature and join lines are chrome. A line that carried a URL
  token is dropped whole.
- The substantive-text rules (`substantive_text_reason`: length, sentences, Hebrew ratio) run at classification AND
  again on the text actually published, after the global cleaner (Codex round 7).
- Format: bold headline, RTL lines, original `https://t.me/<handle>/<id>`, tags; no Telegraph page.
  - **Media** (Codex round 5): the post is sent with the link preview pinned to the original post
    (`LinkPreviewOptions(url=…, is_disabled=False, prefer_large_media=True)` via
    `tg_bot.post_to_channel(preview_url=…)`), so its media stays visible.
  - A text-only native keeps the preview off.
  - Every other `post_to_channel` caller is unchanged.
- Pipeline (`core/main.py` PHASE 1n, after the flash snapshot, before phase 2), in order:
  1. per-channel first-enable baseline (`poll_baseline_sources["geektime::official-telegram"]`; older posts
     re-entering the preview → `baseline_history`);
  2. posted/baseline/suppressed filter;
  3. 30-min grace (undated posts wait ≤ 3 polls);
  4. tiered freshness, once per poll;
  5. classification, with ≤ 6 shortener HEADs per poll;
  6. dedup;
  7. ≤ 3 natives per poll, in the shared budget.
- Dedup:
  - identity = the t.me URL (edits never republish);
  - A/B: a linked post is never native;
  - B: a native repeating a published article's description/lead → `article_equivalent`;
  - C: an article whose description/lead equals a native PROSE paragraph (7 days, same publisher) → published
    equivalent;
  - E: scoped by `source_id`;
  - reposts (first 8 prose paragraphs) → `duplicate_content`;
  - a publisher-scoped content fingerprint, both ways.
- State `telegram_native` holds body-free 64-bit hashes.
  - `ledger` and `article_hashes` are pruned to the 7-day equivalence window, with backstop caps of 300 and 1000.
  - `article_hashes` is recorded only for native publishers (Codex round 7). `attempts` is capped at 100.
  - Natives also add the legacy `posted_fingerprints` entry.
- Publication accounting: `pub_telegram_native` (a tenant-only key, rendered only when non-zero), plus a publication
  event/ledger entry with `iv_status: not_applicable`.
- Runtime Ops:
  - Identity `telegram_native`, plus a `native` route marker kept in `evidence.routes` for native send failures
    (never `flash`). The marker survives a full MAX_IDENTITIES item sample.
  - `native_exercised` / `native_recovered`.
  - A phase crash is a phase-1 failure with route `native` and its stage (read/admit/classify/build/send/record). It
    is verified only by the matching stage counter, and counts as `native_error` in `pipeline_failures`.

## Evidence (READ-ONLY PHYSICALLY OBSERVED)

- Description audit: messages 1212–1231 (complete window; no Tech poll ran from 09:03Z to the audit's end). The
  required examples were verified:
  - Geektime 73/87-char decks: C;
  - PC 459001/458996/458990/458985/458978/458977/458970: A;
  - Walla 3870762/3870903: A;
  - mako f6773f3f87601a1026 (closing quote): A; 8324ad20a2601a1027: A;
  - contrasts: Walla 3870814/3870772 and Gadgety 370229/370226/370202/370255: OK.
  The fixture is `tests/fixtures/techfeedil_descriptions_20261005.json`.
- Channel audit (12:22–12:34Z, 7 channels, proof per channel in ADR §4); N12/Walla have no proven channel.
- Live validation (13:30Z, shipped module, channel-id pins matched, nothing published):
  - Geektime, 20 messages: 4 native (17869; 17879 via gkt.me→politico; 17883; 17886 with a tag-page citation),
    13 linked, 2 captions, 1 poll;
  - The Verifier, 20 messages: 19 linked with 111–149-char teasers, 1 short.
- After the round-5 fixes: 10 of 458 audited real messages changed verdict or description, each justified (TGspot
  25142 → `telegram_cross_link`). Natives 17869/17879/17883/17886 stayed native in every later round.
- #114 merged 11:54:17Z (`dc9ab26`) after the owner marked it ready (11:45:19Z) and removed `no-automerge` (11:53:11Z).
  Its **first natural Tech runs on `queue: max` were OBSERVED** on `3427b55`, which contains `dc9ab26`:
  - Guardian run 37340511887 (schedule, 16:23:53Z→16:24:22Z): success;
  - its self-dispatched Poll & Post run 37340553586 (workflow_dispatch by github-actions[bot],
    16:24:12Z→16:25:41Z): success, state commit `58bd224`;
  - no `startup_failure`.
  A natural two-member wait is still unobserved.

## Hostile review (4 + 6 independent reviewers) + mutation testing

- R1 provenance/spoofing, R2 dedup/baseline/state, R3 completeness/RTL, R4 workflow/TheMarker; private copies only.
  - 1 P1 (R3: a Telegram candidate displacing a provisional winner after it folded the lede) and 9 P2 were fixed and
    pinned. P3s were fixed or documented (ADR §16).
  - R4: TheMarker poll logs and state byte-identical before/after.
- After Codex round 5, six more reviewers widened the media and URL fixes to their class (ADR §16).
- Mutation testing: 111 reviewer mutants; a final 30-mutant run over the fixes killed 29, 1 equivalent.
- Codex rounds 1–3 and 5–7 found 10 P2, all fixed with tests; rounds 4 and 8 were clean.

## Validation

- Local, final tree:
  - `unittest discover`: **2885 tests OK**, under a guard that fails any request to t.me/telegram.me/gkt.me (none
    made);
  - the CI focused suites (18 modules): 404 OK;
  - `python -m tests.test_message_format`: all passed;
  - `compileall -q .`, the Python 3.11 grammar check, Node gate 21/21, 21 workflow YAMLs, `bash -n` and
    `git diff --check`: all pass;
  - no tracked `state/` change. Two accidental `log_info` lines from a read-only live script were removed by editing
    before any commit; nothing else was ever written there.
- New/changed test modules (re-run at the end, 174 OK):
  - `tests.test_techfeedil_official_telegram`: 126 tests, with the real bounded fixture
    `tests/fixtures/techfeedil_official_telegram_20261005.json`;
  - `tests.test_techfeedil_description_completeness`: 48 tests.
- Acceptance matrix §11 (10 items): mapped to named tests in ADR §11.

## PENDING POST-MERGE (explicit; none observed)

1. First natural ingestion cycle per channel: baseline recorded, no publication on that poll,
   `official telegram: channels read=2`.
2. First real native publication (format, pinned media card, `pub_telegram_native`, t.me link).
3. A linked post + its article → exactly ONE publication.
4. No historical flood.
5. The final period visible on a real new subtitle (`DIAG subtitle finish=period`).
6. No real clipped description after rollout (`description_truncated` absent).
7. A real The Verifier article taking its linked teaser (only without a complete deck).
8. #114: a natural two-member wait
   (`GET /repos/funzi7/paywall-bot/actions/concurrency_groups/bot-state-techfeedil`). The first natural runs on
   `queue: max` are already observed (Evidence).

## FUTURE / residual risks

- Natives for more publishers (owner decision).
- Natives citing an OLDER own article (the Geektime 17837/17832 shape) are `linked_citation` today.
- No structural signal exists yet for og-only publisher clips (Walla 155), publisher-clipped visible decks (Geektime
  2026-10-04), or short (< 80 chars) non-visible prefixes (the #113 floor).
- Other open items: the shared MarkdownV2 backslash escape; a total deadline/byte cap for preview GETs; Gadgety
  doubled bullets in Telegraph bodies.
- Documented, conservative behaviour:
  - code-span file names (`main.py`) reject a native;
  - brand tokens at a subtitle's end get no period;
  - the media card repeats the original post, including lines our cleaning removes.
- The pre-existing `flash` route sentinel has the same bounded-item-sample limit Codex found for natives. A route
  marker would change TheMarker's incident evidence, so it needs its own change.

## SUPERSEDED — owner approved 2026-10-05

- README "Tech Feed IL does not ingest another Telegram channel in production." → the verified official-channel
  allow-list. NOT superseded: "missing final punctuation alone is not evidence of truncation".

## Next steps (coordinator / owner)

1. Review PR #115. The owner already marked it ready; the ready-for-review Codex pass ran (round 5), and round 8 on the
   head is clean.
   - To merge: remove `no-automerge`.
   - Merge Bot then merges an owner-authored same-repo PR within about a minute when it is mergeable and the required
     checks are green. It needs no `automerge` label, and the bot-added `needs-owner` pair is a transient escalation.
   - Keep the label until the review is done.
2. After the merge, watch the first Tech poll: the Geektime baseline record, no native published on that poll, both
   channels read. Then watch for the first real native post and the first finished subtitle.
3. Watch for #114's first natural two-member wait (a `startup_failure` alerts nobody).

Docs: `docs/techfeedil-telegram-sources-descriptions-20261005.md` (ADR, §16 all review rounds),
`reports/techfeedil-telegram-sources-descriptions-20261005.md`, `handoffs/CONTEXT.md` (2026-10-05b), README.
