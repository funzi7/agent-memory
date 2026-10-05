# paywall-bot handoff — 2026-10-05 UTC (Tech Feed IL: official publisher Telegram channels + finished descriptions — PR #115 DRAFT + `no-automerge`, NOT merged)

## Headline

Owner-approved Tech Feed IL follow-up after merged #113/#114, on a NEW branch and ONE PR.
- **Branch and PR.** `feat/techfeedil-telegram-sources-descriptions-20261005` from `origin/main` `3427b55`, PR
  **#115**: a **DRAFT carrying `no-automerge`, NOT merged, never marked Ready**, kept for coordinator review.
- **Goal 1 (official channels).** Tech Feed IL reads the VERIFIED official Telegram channels of its own publishers:
  Geektime `geektimecoil` (native text posts + linked text) and The Verifier `TheVerifier` (linked text).
- **Goal 2 (descriptions).** Today's 20 descriptions audited: none truncated (OK 6, A 12, C 2, B 0). A subtitle
  PROVEN complete without terminal punctuation now renders with one final period (Telegram === Telegraph).
- No production state was edited, no workflow was dispatched, no Telegram/Telegraph write was made, no existing
  message/page/ledger was touched, and no concurrency collision was manufactured. #113/#114 were not modified.

## FINAL STATE

- **paywall-bot HEAD:** `d76f6404b1979baa69b0e69e2f07b7bc2c932703` on `feat/techfeedil-telegram-sources-descriptions-20261005`,
  verified equal on the local HEAD, `git ls-remote` and the PR head (15:20Z). Four commits on `origin/main` `3427b55`:
  - `7b4a382` feat(techfeedil): official publisher Telegram channels + finished descriptions;
  - `afa5be7` fix: count native-phase crashes and verify native fixes per stage (Codex round 1, 2 P2);
  - `4313811` fix: never index a linked post with an unresolved short link (Codex round 2, 1 P2);
  - `d76f640` fix: keep the native route marker outside the bounded item sample (Codex round 3, 1 P2).
- **PR #115** (https://github.com/funzi7/paywall-bot/pull/115): OPEN, **DRAFT**, carrying **`no-automerge`** (applied at
  creation, 14:19Z, by funzi7 via `gh pr create --label`; verified present), **NOT merged**, never marked Ready or
  labelled `automerge`; author funzi7, base `main`; `mergeable_state: unstable` only because of the stale pre-review
  `codex-gate-evaluator` run. Merge Bot skips it (draft + `no-automerge`).
- **`origin/main` at the end:** `3427b555f84b53f4c81bde151c4c939296a2fad7`, unchanged since the branch start (no rebase).
- **Exact-head CI on `d76f640`:** run 37329934138, job 111830172184 `test-message-format`, CPython 3.11.16: success —
  message format all passed, the focused suites OK, `unittest discover` "Ran 2864 tests" OK, Node 21/21, 21 workflow
  files parsed, `bash -n`, `git diff --exit-code -- state/` and `git diff --check` passed.
- **Codex: 4 rounds, CLEAN on the final head.** Every request was "@codex review" while the PR was a draft.
  - Round 1 on `7b4a382` (review 5416117249, 14:29:36Z): 2 P2 — a caught native-phase crash counted no pipeline
    failure; native fix verification was not stage-aware → fixed in `afa5be7`.
  - Round 2 on `afa5be7` (review 5416344390, 14:45:56Z): 1 P2 — a linked post with an unresolved `gkt.me` link could
    attach its teaser to the wrong article → fixed in `4313811`.
  - Round 3 on `4313811` (review 5416537265, 15:00:14Z): 1 P2 — the native sentinel could be dropped by a full
    incident item sample → fixed in `d76f640`.
  - Round 4 on `d76f640`: comment 5997426935 at 15:18:18Z "Codex Review: Didn't find any major issues. Bravo.",
    **Reviewed commit `d76f6404b1`**, 👍 at 15:18:23Z; no review object, no inline finding.
  - All 4 finding threads were answered with the fix commit and resolved (4/4).
  - The bridge's automatic "@claude fix" (14:30Z) did NOT run a fixer: Claude Fixer and Codex Auto-Fix were
    `skipped`; no foreign commit exists on the branch.
- **The Gate on `d76f640`:** `check-codex-status` success, "🟢 Reviewed — clear" (15:18:44Z).
  `codex-gate-evaluator` still shows its pre-review failure (15:05:48Z, "⏳ pending — Codex has not reviewed head
  d76f640"); diagnostic only (Merge Bot's `NON_BLOCKING_DIAGNOSTIC_CHECKS`).
- **#113 and #114 were NOT modified.** The #113 ADR §13 and CONTEXT now record #114's merge (backlog
  reconciliation only).

## What was implemented (DETERMINISTICALLY TESTED)

### Finished descriptions (`core/article_parser.py`)
- `finalize_subtitle_punctuation`, feature `subtitle_terminal_punctuation` (Tech only; TheMarker never reaches it).
- Appends one `.` when the accepted subtitle — after peeling closing quotes/brackets — ends with a letter (base letter
  under niqqud), digit, `%` or `°`; the period goes after the closers (mako `…שמיעה".`). Unchanged after `. ! ? … ׃`,
  any other punctuation (connectors), symbols/emoji, URL/domain/e-mail, `#hashtag`, `@mention`.
- Runs ONCE in `_finalize` → `_resolve_rich_subtitle`, after `_select_subtitle`, before Telegraph/Telegram (one text).
  The classifier never sees the period; a rejected candidate never gets one. "Missing final punctuation alone is not
  truncation" is NOT superseded.
- Shown-once fold: a subtitle equal to an opening paragraph up to its terminal punctuation removes that paragraph.

### Official channels (`core/telegram_channel.py`, `official_telegram:` in `sites/techfeedil/config.yaml`)
- Allow-list with first-party `verified_by` proof and pinned `channel_id` (Geektime -1282228958, The Verifier
  -1185382821); feature `official_telegram_sources` + `official_telegram.enabled`. One anonymous GET of
  `t.me/s/<handle>` per channel per poll.
- LINKED (primary link = one publisher article): never a second publication; the first prose line after the headline
  (edge emoji/hashtags removed; lines with pointers/inner hashtags skipped; 40–600 chars) is a description candidate
  ranked deck → Telegram → og → meta → JSON-LD AT PARSE TIME (`_with_official_telegram_candidate`); `_finalize` only
  appends it after a provisional winner (hostile-review P1: otherwise the lede could be lost). A linked post that also
  carries an unresolved publisher short link is never indexed (it may name a second article).
- NATIVE: substantive Hebrew text with NO publisher article link (anchors, hidden citations, URLs written in text,
  `gkt.me` resolved one HEAD hop; chains/home targets stay unresolved) → published as itself: bold headline, RTL
  lines, original `https://t.me/<handle>/<id>`, tags; no Telegraph page. Rejected structurally: promotions, deals,
  registrations, URL buttons, other channels' posts shown visibly, CTA links/lines, polls, replies, forwards,
  captions/short text, link-only posts.
- Pipeline (`core/main.py` PHASE 1n, after the flash snapshot, before phase 2): per-channel first-enable baseline
  (`poll_baseline_sources["geektime::official-telegram"]`; older posts re-entering the preview → `baseline_history`)
  → posted/baseline/suppressed filter → 30-min grace (undated waits ≤ 3 polls) → tiered freshness once per poll →
  classification (+ ≤ 6 shortener HEADs/poll) → dedup → ≤ 3 natives/poll in the shared budget.
- Dedup: identity = t.me URL (edits never republish); A/B linked never native; B native repeating a published
  article's description/lead → `article_equivalent`; C article whose description/lead equals a native PROSE paragraph
  (7 days, same publisher) → published equivalent; E scoped by `source_id`; reposts (first 8 prose paragraphs) →
  `duplicate_content`; publisher-scoped content fingerprint both ways.
- State `telegram_native` (body-free 64-bit hashes; ledger ≤ 100, article_hashes ≤ 200, attempts ≤ 100); natives also
  add the legacy `posted_fingerprints` entry (raw normalized title+lead, pre-existing mechanism). `pub_telegram_native`
  (tenant-only key, rendered only when non-zero), publication event/ledger with `iv_status: not_applicable`.
- Runtime Ops: identity `telegram_native` plus a `native` route marker kept in `evidence.routes` (survives a full
  MAX_IDENTITIES item sample) for native send failures (never `flash`); `native_exercised` / `native_recovered`; a
  phase crash is a phase-1 failure with route `native` and its stage (read/admit/classify/build/send/record), verified
  only by the matching stage counter (`native_read/seen/classified/built/sent/posted`), and counts as `native_error`
  in `pipeline_failures`; phase and each channel read wrapped; counters updated in place.

## Evidence (READ-ONLY PHYSICALLY OBSERVED)

- Description audit: messages 1212–1231 (complete window; no Tech poll ran 09:03Z → task end). Required examples
  (Geektime 73/87-char decks C; PC 459001/458996/458990/458985/458978/458977/458970 A; Walla 3870762/3870903 A; mako
  f6773f3f87601a1026 closing quote A, 8324ad20a2601a1027 A) and contrasts (Walla 3870814/3870772, Gadgety
  370229/370226/370202/370255 OK) verified; fixture `tests/fixtures/techfeedil_descriptions_20261005.json`.
- Channel audit (12:22–12:34Z, 7 channels, proof per channel in ADR §4); N12/Walla have no proven channel.
- Live validation 13:30Z with the shipped module: Geektime 20 msgs → 4 native (17869, 17879 via gkt.me→politico,
  17883, 17886 tag-page citation), 13 linked, 2 captions, 1 poll; The Verifier 20 → 19 linked with 111–149-char
  teasers, 1 short. Channel-id pins matched. Nothing published.
- #114: merged 11:54:17Z (`dc9ab26`) after the owner marked it ready (11:45:19Z) and removed `no-automerge`
  (11:53:11Z); main CI success; no `startup_failure`; no Tech poll/Source Health/Guardian/Backfill run since the
  merge as of 15:20Z (last Tech poll 09:01Z, Source Health 10:49Z, Guardian 07:42Z; TheMarker's 12:02Z poll and this
  PR's CI ran, so Actions itself works) → first natural runs on `queue: max` PENDING.

## Hostile review (4 independent reviewers) + mutation testing

- R1 provenance/spoofing, R2 dedup/baseline/state, R3 completeness/RTL, R4 workflow/TheMarker; private copies only.
- 1 P1 (R3: Telegram candidate displacing a provisional winner after it folded the lede) + 9 P2 fixed and pinned;
  P3s fixed or documented (ADR §16). R4: TheMarker poll logs/state byte-identical before/after.
- 111 reviewer mutants; final 30-mutant run over the fixes: 29 killed, 1 equivalent. Then Codex rounds 1–3 found
  4 more P2 (all fixed, tests added); round 4 clean.

## Validation

- Local, final tree: `unittest discover` **2864 tests OK** under a guard that fails any request to t.me/telegram.me/
  gkt.me (none made); the CI focused suites (18 modules) 404 OK; `python -m tests.test_message_format` all passed;
  `compileall -q .`; Python 3.11 grammar + PEP-701 scan of every changed file; Node gate 21/21; 21 workflow YAMLs;
  `bash -n`; `git diff --check`; no tracked `state/` change (two accidental `log_info` lines from a read-only live
  script were removed by editing before any commit; nothing else was ever written there).
- New/changed test modules: `tests.test_techfeedil_official_telegram` 106 tests (real bounded fixture
  `tests/fixtures/techfeedil_official_telegram_20261005.json`), `tests.test_techfeedil_description_completeness` 47.
- Acceptance matrix §11 (10 items): mapped to named tests in ADR §11.

## PENDING POST-MERGE (explicit; none observed)

1. First natural ingestion cycle per channel: baseline recorded, no publication on that poll,
   `official telegram: channels read=2`.
2. First real native publication (format, `pub_telegram_native`, t.me link).
3. A linked post + its article → exactly ONE publication.
4. No historical flood.
5. The final period visible on a real new subtitle (`DIAG subtitle finish=period`).
6. No real clipped description after rollout (`description_truncated` absent).
7. A real The Verifier article taking its linked teaser (only without a complete deck).
8. #114: first natural Tech runs on `queue: max` (no `startup_failure`) + a natural two-member wait
   (`GET /repos/funzi7/paywall-bot/actions/concurrency_groups/bot-state-techfeedil`).

## FUTURE / residual risks

- Natives for more publishers (owner decision); natives citing an OLDER own article (Geektime 17837/17832 shape,
  today `linked_citation`); og-only publisher clips (Walla 155) and publisher-clipped visible decks (Geektime
  2026-10-04) — no structural signal; short (< 80 chars) non-visible prefixes (the #113 floor); shared MarkdownV2
  backslash escape; total deadline/byte cap for preview GETs; Gadgety doubled bullets in Telegraph bodies; the
  pre-existing `flash` route sentinel has the same bounded-item-sample limit Codex found for natives (a route marker
  would change TheMarker's incident evidence, so it needs its own change).

## SUPERSEDED — owner approved 2026-10-05

- README "Tech Feed IL does not ingest another Telegram channel in production." → the verified official-channel
  allow-list. NOT superseded: "missing final punctuation alone is not evidence of truncation".

## Next steps (coordinator / owner)

1. Review PR #115. To merge: the owner marks it Ready and removes `no-automerge` (keep the label until Codex's
   ready-for-review review lands; Merge Bot does not wait for it).
2. After the merge, watch the first Tech poll: the Geektime baseline record, no native published on that poll, both
   channels read; then the first real native post and the first finished subtitle.
3. Check #114's first natural Tech runs by hand (a `startup_failure` alerts nobody).

Docs: `docs/techfeedil-telegram-sources-descriptions-20261005.md` (ADR), `reports/techfeedil-telegram-sources-descriptions-20261005.md`,
`handoffs/CONTEXT.md` (2026-10-05b), README.
