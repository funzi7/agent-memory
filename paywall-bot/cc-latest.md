# paywall-bot — TheMarker production-reliability handoff (2026-08-09)

## Git, PR, and deployment truth

- Repository: `funzi7/paywall-bot`.
- Authoritative fetched starting `origin/main`:
  `848e792e96a2ec338aab8ea2857511b0a9148f6a`.
- Task branch: `fix/themarker-production-reliability-20260809`.
- Final pushed application branch HEAD:
  `fd298c0f5b9543fd3d915ca7f1500093b4490372`; `git ls-remote` returned the
  same 40-character SHA.
- PR #92: https://github.com/funzi7/paywall-bot/pull/92, targeting `main`,
  open, ready for review, mergeable with `mergeStateStatus=CLEAN`, and not
  merged at this handoff checkpoint.
- Exact-head CI run `31304825228`, job `93223373230`, passed every canonical
  repository step on `fd298c0f5b9543fd3d915ca7f1500093b4490372`.
- The separate Codex policy gate initially reported only
  `current_head_review_pending`. The trusted automatic reviewer returned a
  clean 👍 at 2026-08-09T09:08:11Z on the exact head, with no P1/P2 body,
  comments, inline comments, reviews, or review threads. Safe review-only gate
  dispatch `31305233608` and rerun attempt of `31304825229` then passed; the
  authoritative `check-codex-status`, evaluator, and canonical CI checks are
  all green on the PR.
- No PR merge, release, deployment, production workflow dispatch, Backfill,
  production-state edit, real Telegram post/DM, or Telegraph create/edit was
  performed by this task. The only manual workflow dispatch was the
  review-only Codex Gate re-evaluation after its clean reaction. A Git push and
  passing CI are not a deployment.

## Read-only production evidence inspected

- Poll & Post run `31297186619`, job `93204111155`, on code head `47d6377`,
  ran at 2026-08-09 05:40 UTC. Telethon successfully read
  `@themarkeronline`, all four incident URLs were fresh after dedup, and the
  run ended `posted=0`, `deferred=3`, `permanent_fail=1`, `errors=0`.
- The direct live page yielded three paragraphs / 1,492 body characters but
  failed the global four-paragraph / 1,500-character floor. That same chain
  logged Jina 403, smry 200 with zero body paragraphs, one3ft 503, and Wayback
  404. Premium direct fetches were intentionally skipped.
- Daily Health run `31292352775` used a 48-hour Telethon fetch while labelling
  the comparison 24 hours. It treated legacy `posted_guids` as channel proof,
  ignored deferred/terminal warning evidence, used `last_run` as last post,
  and emitted the false quiet/no-articles classification.
- State history proved `d240` and `dd04` moved from retry 4 to
  `posted_guids` in commit `b83bcfe7c3891f5a556c7bdc1b4dd07fa196bcc7`
  while posted remained zero. `e16` made the same false transition in state
  commit `dc03a21312b7058a9468e77529d2c43d73962a45`. None had publication or
  fingerprint evidence.
- Public destination GETs initially showed no Aug 8/9 publication through
  message `#756`. Scheduled old-code Poll run `31301839229` later published
  `e074` through one3ft. Public destination message `#757` and its Telegraph
  `author_url` independently prove the exact source URL and successful send at
  `2026-08-09T07:44:38+00:00`.
- Current upstream availability changed during diagnosis. one3ft returned
  complete usable premium bodies for `e074` (9 paragraphs / 3,518 chars),
  `d240` (30 / 2,448), and `dd04` (11 / 2,381). Its `e16` body remained partial
  (2 / 1,099 with an expand control). smry was a client-rendered shell without
  embedded article text. Jina and Wayback availability varied by request.
- All GitHub, source, destination, endpoint, and state diagnostics were
  read-only. No credentials or full article bodies were printed or persisted.

## Exact incident identities and current disposition

1. `https://www.themarker.com/wallstreet/2026-08-08/ty-article/.premium/0000019f-e074-d7e2-a39f-f7f68b6f0000`
   - Actually published by the later old-code scheduled run as destination
     message `#757`.
   - The versioned migration records the exact body-free proof as a
     `historical_reconciliation` event (timestamp, Telegram message ID 757,
     Telegraph URL, source `one3ft`, and evidence marker), removes stale
     retry/terminal rows, and never sends it again.
   - It does not set `last_post_at`: messages `#758` and `#759` followed in
     pre-ledger history, so the reconciled event cannot truthfully establish
     the latest successful send.
2. `https://www.themarker.com/wallstreet/2026-08-08/ty-article-live/0000019f-e16d-d310-a3df-e56f67d20000`
   - Confirmed false terminal suppression in legacy `posted_guids`; never
     published by the incident runs.
   - Migration removes only this exact false suppression and requeues it at
     retry zero with fresh 30-minute grace and bounded recovery metadata.
3. `https://www.themarker.com/realestate/2026-08-08/ty-article/.premium/0000019f-d240-d310-a3df-d6436e8f0000`
   - Confirmed false terminal suppression; migration requeues only this exact
     identity at retry zero with the same bounded lifecycle.
4. `https://www.themarker.com/wallstreet/2026-08-08/ty-article/.premium/0000019f-dd04-d310-a3df-dd0778750000`
   - Confirmed false terminal suppression; migration requeues only this exact
     identity at retry zero with the same bounded lifecycle.

The migration version is `themarker_2026_08_08_outage_v1`. It is tenant-gated
before mutation, exact to these four URLs, idempotent, and does not publish.
An in-memory replay against current fetched production state reconciled one
verified publication, requeued exactly three false terminal identities, left
unrelated rows untouched, and made the second invocation byte-for-byte a no-op.

## Root causes and fixes

### Extraction and completeness

- Jina's current render puts a comments jump/action bar before the article
  body. The parser's unqualified `תגובות:` end marker truncated before the
  body. Only the exact Markdown action-link shape is now exempt; real heading,
  bare, plain, and embedded comments markers still terminate/fail closed.
- The complete `ty-article-live` incident page legitimately contains three
  large paragraphs. The global 4/1,500 floor remains unchanged. A scoped
  3/1,400 floor applies only when TheMarker host/path, server-rendered live DOM,
  no-expand state, live-item count, JSON-LD `LiveBlogPosting` updates, and every
  normalized `BlogPosting.articleBody` agree exactly.
- Premium teasers, navigation, related cards, comments, paywall UI, promotions,
  collapsed live items, mismatched JSON-LD, and partial proxy bodies remain
  rejected. No new proxy was introduced.
- smry `no_body`, per-source HTTP statuses, and threshold reasons are retained
  as bounded body-free attempt diagnostics. Old raw body/title/paragraph DIAG
  output was removed; optional `SMRY_DEBUG` stores only response length, title
  presence/length, and tag counts.
- TheMarker diagnostics no longer inherit Tech Feed IL's intentional
  direct-429 source-cooldown short circuit. TheMarker records direct 429 and
  continues its configured fallback chain; Tech retains its existing stop.

### Publication truth and retry suppression

- `posted_guids` remains the backward-compatible processed/dedup registry. It
  is never publication proof.
- `publication_events` is a bounded body-free successful-send ledger containing
  normalized source URL, aware UTC `posted_at`, Telegraph URL, Telegram message
  ID when available, source, aliases, and only a SHA-256 of any content
  fingerprint. It is written only after a successful Telegram send.
- `last_post_at` comes from real complete-ledger sends; `last_poll_at` records
  completed polls separately. Historical partial reconciliation is valid proof
  but cannot claim the latest publication time.
- `terminal_failures` is bounded, body-free, diagnosable, and can retain legacy
  retry suppression without inflating publication metrics. Successful article,
  flash, and backfill paths share the same event boundary. Telegraph/Telegram
  failures advance the bounded lifecycle; final failures become terminal.
- TheMarker immediately checkpoints successful send evidence and dedup state,
  preventing a later caught poll error from losing truth and duplicating a post.
- Canonical/content equivalents count only when tied to an actual retained
  publication proof. Legacy fingerprints still suppress duplicates but cannot
  inflate health counts. WordPress root-query identities such as `/?p=169053`
  remain distinct for Tech Feed IL.
- Both Google News wrapper cleanup migrations now create explicit terminal rows
  rather than silently using `mark_posted` as failure truth.

### Exact rolling health and source-aware alerts

- Publication accounting uses the inclusive aware-UTC boundary
  `now - 24h <= posted_at <= now`; historical calendar-day aggregates are no
  longer the 24-hour source of truth.
- Source records preserve normalized URL, text/title, timestamp, and message ID
  through resolution. A 48-hour input cannot leak older rows into a 24-hour
  report. Naive/future timestamps are excluded.
- Telethon comparison is exact only if it reaches/exhausts past the cutoff
  without hitting its cap, losing an undated message, or failing any candidate
  URL resolution. HTML preview evidence is always labelled partial/degraded.
- Daily Health distinguishes exact quiet, waiting inside the 30-minute grace,
  recoverable degradation, and red terminal/source-gap/fetch-chain/publication
  failures. It displays real last-post and last-poll fields separately, bounds
  the final escaped DM, and never says “never” when pre-ledger history is merely
  unknown.
- Comparison counts only publication events or proven equivalents as
  `פוסטים אצלך`. Deferred, terminal, processed-unproven, outside-window, and
  missed rows remain factual gaps.
- Zero-post alerting is source-aware: genuinely quiet and waiting-only runs do
  not increment the outage streak; eligible source items with zero publications
  plus extraction/send failure are an immediate outage signal. Mixed runs still
  alert on a send boundary failure, with the existing six-hour cooldown.

## Validation physically executed

- `.venv/bin/python -m tests.test_message_format` — 187/187 passed.
- The exact 17 focused unittest modules from `.github/workflows/ci.yml` —
  379/379 passed.
- `.venv/bin/python -m unittest discover -v` — 430/430 passed.
- `.venv/bin/python -m compileall -q .` — passed.
- `.venv/bin/python -m compileall core sites tests` — passed.
- `node --check tools/codex_gate_logic.js` — passed.
- `node --test tests/test_codex_gate_logic.js` — 18/18 passed.
- PyYAML `safe_load` parsed all 15 tracked workflow YAML files.
- `bash -n` passed both tracked shell scripts.
- `git diff --check`, cached whitespace review, and
  `git diff --exit-code -- state/` passed.
- SHA-256 before/after snapshots proved all seven tracked production-state
  files byte-identical during both current-tree and post-merge final-head runs.
- One deliberately concurrent focused/discovery invocation observed an ignored
  diagnostic-log hash race. The canonical CI-equivalent sequential rerun passed
  379/379; this was validation-process interference, not a product-test failure.
- Exact-head GitHub Actions CI run `31304825228` passed every canonical step on
  `fd298c0f5b9543fd3d915ca7f1500093b4490372`.
- Trusted Codex returned a clean exact-head signal with no findings. Review-only
  gate run `31305233608` and the PR-attached rerun of `31304825229` passed,
  leaving all three PR checks green.

The historical Termux/PRoot bubblewrap/fchdir limitation did not reproduce in
this run. All listed local commands were physically executed. Telegram and
Telegraph write boundaries were mocked. No test modified tracked production
state. No required repository validation was skipped or merely inferred from a
different commit.

## Not physically verified and remaining work/risks

- New code has not run on production because PR #92 is not merged. Therefore
  migration application, the three requeued items' subsequent normal polls,
  new Daily Health wording, and live successful-send ledger writes are not yet
  verified in production.
- After reviewed merge, do not run Backfill and do not manually edit state.
  Let the normal TheMarker poll apply the versioned migration, inspect its
  bounded outcomes, allow the fresh 30-minute defer grace, then inspect normal
  poll logs/state/destination history read-only before claiming recovery.
- Proxy availability remains volatile. HTTP 200 is not completeness proof, and
  strict DOM/JSON-LD validation intentionally defers on publisher shape changes.
- General pre-ledger TheMarker history remains unproven, so early comparison
  counts and last-post reporting are deliberately conservative. `e074` is the
  only exact historical reconciliation encoded by this migration.
- Unrelated destination message `#759` has a verified broken visible Telegraph
  link: Telegram stripped ASCII `PDF` from the created Unicode/Latin slug, so
  the visible URL returns 404 while the raw created URL returns 200. This task
  documented but did not repair that separate formatting risk.
- Preserve Tech Feed IL's publication and cooldown behavior. The new generic
  accounting is additive and covered by the full Tech regression suite.

## Architecture decisions to preserve

- Successful destination send is the sole normal publication boundary.
- Processed/suppressed, deferred, terminal, and published are distinct states.
- Rolling health uses exact timestamped events and source records, never daily
  buckets or `last_run` as publication truth.
- Completeness exceptions are format- and structure-proven, never global floor
  reductions.
- Recovery migrations are exact, versioned, tenant-gated, body-free,
  idempotent, and never publish directly.
- Fail closed on partial body or ambiguous legacy publication state; do not
  manufacture green health statistics.
