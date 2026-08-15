# paywall-bot handoff — 2026-08-15 UTC (PR #100, continued)

## Task

Continue the EXISTING TheMarker reliability PR #100 (do not replace, do not
merge, do not bypass Codex). Fix a newly-surfaced production URL-contamination
bug, recover the one damaged identity, re-verify the starvation fixes, refresh
stale status docs, and make #100 fully ready for a future exact-head Codex
review. No Tech Feed IL change; no quality gate weakened; no Backfill; no
production state hand-edited; automation-core code untouched.

## PR #100 state

- PR: https://github.com/funzi7/paywall-bot/pull/100 — branch
  `claude/themarker-queue-starvation`, base `main`, **OPEN** (not merged).
- Current exact head: `0585dc1d9c56279df5b35507020a53d9f76d61a9`
  (7957fce starvation fixes → 48b2c62 URL fix + recovery → 0585dc1 candidacy
  docs).
- Exact-head application CI (`test-message-format`) **PASSED** on the head.
- Codex review capacity is UNAVAILABLE: the connector posted only a usage-limit
  notice (2026-08-15T18:14:54Z), never a review. Per policy that is not a review
  signal, so `check-codex-status` / `codex-gate-evaluator` are RED
  (fail-closed). No owner merge, no `codex-p1-acknowledged`, no `no-automerge`,
  no `automerge` label applied.

## Malformed-URL bug (root cause + fix)

A real Poll recorded `.../.highlight/0000019f-eb24-da6c-a9df-eba630800000Share`
— the UI word `Share` glued directly onto the terminal 8-4-4-4-12 hex article
UUID. Root cause is UPSTREAM: the @themarkeronline channel post's own `<a href>`
(present in both the Telethon message and the public `t.me/s` HTML) carried the
contaminated URL — not a DOM-adjacency parse error. That URL fetched HTTP 400,
burned all 5 retries, and reached `permanent_fail` unrelated to the article.

Fix (TheMarker-only, host-gated, idempotent):
`url_utils.sanitize_themarker_article_url` strips a letter-led suffix glued onto
the complete 8-4-4-4-12 hex identifier plus embedded control/zero-width chars.
The hyphenated UUID structure anchors the match, so query strings (incl. genuine
`?gift=` tokens), percent-encoding, and non-TheMarker hosts are never damaged.
Applied at the channel-source trust boundaries:
`telethon_client._extract_urls_from_message` (covers every Telethon consumer:
discovery `_telethon_source_items`, `resolve_themarker_urls/index`, the
extraction index), the short-link resolver outputs, and
`telegram_index._candidate_urls` (public-HTML path). A malformed identity can
never enter discovery/state or burn retries.

## Damaged-state audit + recovery

Audit of current production state (`state/themarker.json`) found EXACTLY ONE
affected article: the eb24 magazine piece, present as 2 malformed entries — one
`terminal_failures` row (retry 5, `fetch_chain_exhausted`,
`direct=http_status:400`) plus its `posted_guids` suppression. The corrected
identity was NOT posted/deferred/terminal/published.

Recovery `themarker_2026_08_15_malformed_url_v1`
(`state.migrate_themarker_malformed_url_recovery`, gated by
`features.themarker_malformed_url_recovery_v1`) detects contamination via the
same sanitizer (never a broad guess), removes the malformed variants from
deferred/terminal/posted, and re-admits the corrected article at retry 0 — or
dedupes if the corrected identity is already published/deferred/terminal/posted.
It never sends, never creates a Telegraph page, never fabricates a
`publication_events` row, and is a second-run no-op. Verified on a copy of live
state: 1 corrected, 1 re-admitted, 0 publication events changed, idempotent.
Recovery count: **1 identity**.

## Starvation fixes (re-verified, unchanged)

Discovery admission (`exclude_deferred_from_discovery_cap` +
`admit_all_discovered_identities`), active-outage phase-2 fairness
(`themarker_active_outage_queue_fairness`), and the read-only Telethon
extraction index (`telegram_extraction_telethon_index`) are unchanged by this
follow-up and still covered by `tests/test_themarker_queue_starvation.py` (14).
Content floor (4 paragraphs / 1,500 chars / 0.5 Hebrew ratio) unchanged.

## Provider + production status (INTERMITTENT, not dead)

Providers periodically recover; publications occur during recovery; then the
outage can re-latch. Latest verified real publication:
`https://themarker.com/wallstreet/2026-08-15/ty-article/0000019f-e71f-dfd7-a19f-e7dfd2790000`
→ Telegram message **829**, `posted_at 2026-08-15T17:12:13Z`, source **direct**,
Telegraph `telegra.ph/סין-הצליחה-לשקם-...-08-15`. As of the last poll (21:11Z)
the outage was re-latched (`active`, probe_count 7, 16 parked). No new reliable
body provider on re-check → none added.

## Telegraph header — production verified by owner inspection

The owner manually inspected the production Telegraph article "סין הצליחה
לשקם…" and confirmed: native top `TheMarker` header links to the Telegram
channel; footer has the original TheMarker source link; the adapted external
original source (The Economist) link is separately present. PR #93 header
requirement is now **production verified by owner inspection** (not
machine-verified), no longer pending. The production article was not edited or
republished.

## Auto-merge candidacy (Section 11)

`merge-bot.yml` `isAutoMergeCandidate` blocks any `claude/*` PR marked
`claudeGenerated` unless it carries the explicit `automerge` label. That label
is the success-only signal applied ONLY by the trusted `claude.yml` workflow to
PRs it delivers. PR #100 is owner-authored on a `claude/*` branch, so it
legitimately has no `automerge` label — and this task does NOT apply one (not
part of a trusted automated workflow; forging provenance is forbidden).
**Exact next action when Codex quota returns:** fresh exact-head Codex review
with no active P1/P2 → `check-codex-status` green on the exact head → Merge Bot
recognizes candidacy only once `automerge` is present (owner explicit opt-in or
trusted Claude-delivery re-label) → normal SHA-pinned auto-merge. Until then
#100 correctly stays open/fail-closed.

## Tests / validation

`tests/test_themarker_malformed_url.py` (19) + `test_themarker_queue_starvation.py`
(14). Full `unittest discover` = **491** all OK; `tests.test_message_format`
"All tests passed."; `compileall`; all workflow YAML parse; `git diff --check`
clean. No production state mutated by tests; Telegram/Telegraph write boundaries
mocked.

## Corrected PR #98 merge evidence (unchanged from prior handoff)

#98 head `012824a7b8d710cd4fd06245ac19afc27a4de09d`; exact-head CI `31711027957`
and Gate `31711220444` green. Merge Bot run `31711250348`'s SHA-pinned merge
request surfaced a 502 client-side (`#98: unexpected merge error (502),
skipping this PR: Server Error`) while GitHub independently recorded #98 merged
at `2026-08-13T14:40:09Z` as `73c2d3875e49aa038f0ed9790d610eb063e4e90d`; the
next Merge Bot run found no candidate because #98 was already merged. Run
`31711250348` did NOT receive a normal successful merge response. Corrected in
`handoffs/CONTEXT.md` (in PR #100) and `automation-core/cc-latest.md`.
