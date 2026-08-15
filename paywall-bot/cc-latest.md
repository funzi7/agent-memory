# paywall-bot handoff — 2026-08-15 UTC

## Task

Restore TheMarker production publishing reliability: eliminate discovery-cap +
phase-2 queue starvation during a persisted extraction-provider outage,
investigate additional body sources, audit for missed discoveries, correct the
PR #98 evidence, and ship through the normal PR → exact-head CI → Codex → Gate →
Merge Bot path. No Tech Feed IL change; no quality gate weakened; no Backfill;
no hand-edited production state; no manual Telegram/Telegraph writes.

## Root cause (publication-reliability defect, not a total outage)

TheMarker's body providers were systemically unavailable (jina 403, smry
HTTP-200 `no_body` shell, one3ft 503, Wayback 503/no-snapshot — re-verified live
2026-08-15). The outage is IP/availability driven (the shared GitHub-Actions
runner IP is intermittently blocked), and production DID publish in bursts on
recovery — last real send before this task was `2026-08-15T07:22:43Z` via
one3ft/direct, then the outage re-latched at `09:17Z`. So the earlier
"zero publications since 2026-08-11" premise was already stale; the real defect
was current-article STARVATION during the latched outage:

1. Discovery cap — phase 1 did `fresh = sort_oldest_first(fresh)[:cap]` with
   `exclude_deferred_from_discovery_cap: false`, so the oldest 20 candidates
   (already-deferred parked rows) consumed the whole admission budget and
   genuinely new URLs were never recorded (`20 already in deferred queue,
   0 newly recorded`).
2. Phase-2 ordering — `_select_deferred_ready` was always oldest-first, so the
   same oldest parked rows were re-selected every poll and newer articles never
   got a local-source publish chance.

## Fixes (all TheMarker-only, tenant-gated; Tech Feed IL untouched)

- Discovery admission: `exclude_deferred_from_discovery_cap: true` +
  new `admit_all_discovered_identities: true`. `_bounded_admissions` (extracted
  from `run_poll`) admits every newly discovered eligible identity from the
  bounded source result (defer only, never publishes); `max_items_per_run`
  bounds phase-2 processing only. New phase-1 observability line
  (`source/already_deferred/newly_discovered/admitted/dropped_over_cap`).
- Active-outage phase-2 fairness: `themarker_active_outage_queue_fairness: true`.
  While latched, `_select_deferred_ready` returns one representative (oldest
  ready row → full external-chain single probe) then the NEWEST ready rows
  (local-only). Preserves the circuit breaker exactly: one probe/poll, no
  external fan-out on later rows, no retry burn, no false terminalization;
  oldest-first drain resumes on recovery. Deterministic.
- Telegram extraction via read-only Telethon: `telegram_extraction_telethon_index:
  true`. `sites/themarker/telegram_index.prime_from_telethon` (called once per
  poll before phase 2) builds the extraction index from the same trusted
  read-only channel history discovery uses (bounded 96h/200-msg horizon, shared
  short-link cache, resolve budget) instead of only the ~20 newest public
  `t.me/s` HTML posts. Newest-wins per identity, read-only, public HTML
  fallback intact. Telegram ledes still must clear the unchanged 4-para /
  1,500-char floor.

## Additional body sources — investigated, none added

Read-only live probe of 6 structurally different current URLs (public-news,
public-markets, `.premium`, `.highlight`, magazine-highlight, technation):
first-party JSON-LD `articleBody` is teaser-sized only (115–297 chars); no
`__NEXT_DATA__`/preload hydration body; RSS `cmlink/1.144` has zero
`content:encoded` (descriptions ≤349 chars); no already-public `?gift=` token
present (tokens never guessed). Public URLs' bodies are already handled by the
existing `direct` parser; premium/highlight/magazine are teaser-only.
Third-party providers: jina 403, Wayback 503, smry no-body, one3ft intermittent
(200 residential / 503 GHA-IP). No reliable new complete-body provider exists →
none added; the outage classifier provider set is unchanged.

## Missed-discovery audit (§7)

Compared public `t.me/s/themarkeronline` in-window identities (from
`2026-08-12T00:00:00Z`) vs every tracked state identity using the shared
`url_utils.normalize_url`. 14 in-window records: 12 already accounted for, 2
unaccounted — both timestamped AFTER the last poll (`14:20Z`, `17:27Z` vs
`last_poll_at 13:22Z`) and within the 48h Telethon discovery horizon, so the
next normal poll admits them. No proven missing identity falls outside the
horizon → NO recovery migration was warranted or created (fabricating state is
forbidden). Coverage limit: public HTML exposes only ~20 newest posts and no
Telethon creds are available in the agent env, so the `08-12→08-14T08` window
cannot be independently re-derived here; the admission fix prevents recurrence.

## Content floor / prior work preserved

4-paragraph / 1,500-char floor, hebrew_ratio 0.5, teaser/talkback protections,
publication_events truth (vs posted_guids), terminal/deferred distinction,
checkpoint-after-publish, PR #92/#93 outage-parking + one-probe-per-poll +
retry-neutral parking + stale-outage clearing + recovery migrations — all
unchanged. Telegraph header policy (visible author `TheMarker`, header link
`https://t.me/demarkerpremium`, original URL once in footer) unchanged.

## Tests / validation

`tests/test_themarker_queue_starvation.py` — 14 tests (discovery admission exact
production shape; active-outage fairness; Telethon index incl. teaser rejection
and HTML fallback). Full `unittest discover` = 472 pre-existing + 14 new all OK;
`tests.test_message_format` "All tests passed"; `compileall`; 15 workflow YAML
parses; `git diff --check` clean. No production state mutated by tests.

## PR / CI / Codex / Gate / Merge — PENDING (fail-closed)

- PR: https://github.com/funzi7/paywall-bot/pull/100
  head `7957fce8b5801ba49bdfa62b2acc147831ff02ff`, base `main`.
- Exact-head application CI (`test-message-format`) PASSED.
- Codex review capacity is UNAVAILABLE: the connector posted a usage-limit
  notice, not a review. Per policy that is not a review signal, so
  `check-codex-status` / `codex-gate-evaluator` are RED (fail-closed). No owner
  merge, no `codex-p1-acknowledged`, no `no-automerge` was used.
- The PR is intentionally left OPEN and fail-closed pending Codex capacity;
  Merge Bot will auto-merge only once a clean exact-head Codex review turns the
  Gate green. Manual merge is NOT performed.

## Post-merge production verification — PENDING

Not yet applicable (PR unmerged). When merged, the first scheduled TheMarker
Poll must show: new items admitted, no disappearance behind old deferred rows,
active-outage phase-2 giving current ready rows a local-source chance, exactly
one external probe/poll, no external fan-out on later rows, no retry burn.

## Telegraph header verification — STILL PENDING

The last proven send (#782, 2026-08-11) predates #93's header change, and no new
post-merge publication has occurred, so the `TheMarker` → `t.me/demarkerpremium`
header behavior remains unverified in production.

## Corrected PR #98 merge evidence

#98 final head `012824a7b8d710cd4fd06245ac19afc27a4de09d`; exact-head CI
`31711027957` and Gate `31711220444` green. The SHA-pinned Merge Bot merge
request on run `31711250348` coincided with a server-side successful merge while
its client/API call surfaced a 502 (`#98: unexpected merge error (502),
skipping this PR: Server Error`); GitHub independently recorded #98 merged at
`2026-08-13T14:40:09Z` as `73c2d3875e49aa038f0ed9790d610eb063e4e90d`, and the
next Merge Bot run found no candidate because #98 was already merged. Run
`31711250348` did NOT receive a normal successful merge response. Corrected in
`handoffs/CONTEXT.md` (in PR #100) and in `automation-core/cc-latest.md`.
