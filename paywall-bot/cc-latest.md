# paywall-bot handoff — 2026-09-09 UTC (PR #103: source direction-control trust boundary + truthful publication accounting)

## Headline

The 2026-09-08T21:41Z TheMarker poll recovered one3ft and extracted two
complete, gate-passing premium articles (9¶/3,120 chars and 15¶/6,328 chars).
It published **neither**. Both were rejected at the Telegraph publication
boundary by a single legitimate source **U+200F RIGHT-TO-LEFT MARK**, and each
burned a retry. The same poll logged `posted=4 (… one3ft: 6 …)` — six sources
for four posts.

Root cause: **two trust domains three lines apart** in `core/telegraph_pub.py`:

```python
_SEMANTIC_CONTROL_CHAR_OK = {"\n", "\t"}                      # aborts on U+200F
_RENDER_CONTROL_CHAR_OK   = {"\n", "\t", "‎", "‏", "⁧", "⁩"}   # trusts U+200F
```

The SEMANTIC validator (pre-serialization) rejects every `Cc`/`Cf` but
newline/tab. The FINAL TREE validator (post-render) trusts LRM/RLM/RLI/PDI,
because the renderer injects them. The renderer was about to add that very
codepoint one layer later. Source marks reached the semantic validator at all
because `article_parser` stripped untrusted source bidi **only** for tenants
setting `telegraph.force_rtl_blocks` — Tech Feed IL sets it and was immune,
TheMarker does not.

## Git/PR state (exact)

- Starting `origin/main`: **`55c9dc953f21ebf711d2046b9784fd2fbfb7b288`**
  (`state: themarker 2026-09-09T01:06:08Z`). NOT the `d566991` in the task
  prompt — that was already 8 commits stale; local `main` was fast-forwarded,
  never reset.
- Branch: `fix/themarker-rtl-publication-boundary-20260909` (owner namespace,
  not `claude/*` → no `automerge` label required; verified against
  `merge-bot.yml:215-236`, where `isOwnerSameRepo` qualifies and the
  label is mandatory only for `claude-generated` provenance).
- Commits: `017d548` (the change) → `279ade6` (migration robustness) →
  `2cacd50` (Codex P2s #1–2) → `89c4440` (docs) → `ae8fc66` (Codex P2 #3) →
  `8d51205` (Codex P2 #4) → **`72de8f8`** (final docs/status).
- PR: https://github.com/funzi7/paywall-bot/pull/103 — **OPEN, NOT MERGED**.
- CI `test-message-format`: **green on every head**, including `8d51205`.
- **MERGE BLOCKER (factual, not an excuse): Codex reached its usage limits at
  2026-09-09T02:13:50Z**, before it could review the final head.
  `check-codex-status` reports *"Codex has not reviewed head 8d51205"* and is
  correctly red. Per the standing rule a usage-limit notice is NOT a review
  signal. No `codex-p1-acknowledged` override was applied, no review signal was
  fabricated, and neither the Gate nor the Merge Bot was touched. **Next action
  when quota returns: `@codex review` on #103, then the normal Merge Bot path.**

## Codex review — 4 real P2s across 3 genuine reviews, all fixed and resolved

Reviews auto-triggered three times (PR open, then twice on new commits) against
`017d548` (01:53:38Z), `89c4440` (02:01:41Z) and `ae8fc66` (02:09:45Z). **Zero
unresolved threads remain.** All four findings were in code I added — the
review was worth having.

1. **`core/main.py:1913` — the fallback bucket was never read.**
   `_bump_publication_source` folds an unrecognised source into `pub_other`
   precisely to keep `sum(pub_*) == posted` when a source is added — but
   `PUBLICATION_SOURCE_KEYS` omitted `other`, so `log_run_summary` never read
   it and the invariant broke in exactly the case the fallback existed for.
   Reachable today: `archive_today` is a registered fetcher a tenant can add to
   its configurable `fetch_chain`. Fixed by splitting the constants —
   `PUBLICATION_SOURCE_KEYS` is the known-source set the bump matches against,
   `PUBLICATION_COUNTER_KEYS = … + ("other",)` is what the summary reads and
   sums; `other` renders only when non-zero.
2. **`core/main.py:1978` — flash distorted the extraction comparison.** Flash
   items bump `posted` and `pub_flash` with no `src_*`, so comparing
   extractions against ALL publications reported a phantom gap on every
   flash-only run and — worse — let a flash success numerically cancel a real
   extracted article that failed to publish (1 flash + 1 lost article read as
   `extracted == posted == 1` and stayed silent). Fixed by subtracting
   `NON_EXTRACTION_PUBLICATION_KEYS`; the line now names both sides.

3. **`core/main.py:1998` (on `89c4440`) — fallback sources missing from the
   extraction total.** The exact mirror of #1, and I should have caught it when
   I fixed that one. `bump_stat(state, f"src_{source}")` is NOT restricted to
   `SOURCE_KEYS` (verified at `core/main.py:2237`), so an `archive_today`
   publication writes `src_archive_today` + `pub_other`; summing only the fixed
   tuple logged a healthy publication as
   `extracted=0 … vs 1 published from extraction`. Fixed in `ae8fc66` by
   discovering the `src_*` keys actually present in the bucket.
4. **`tests/…rtl_publication_boundary.py:100` (on `ae8fc66`) — tenant context
   not restored.** `tearDown` hardcoded Tech Feed IL, latching force-RTL
   process-wide. Fixed in `8d51205` (snapshot/restore `_SITE_CONFIG`,
   `STATE_FILE`, `ERROR_LOG`). Guarded, because `_SITE_CONFIG` starts as `{}`
   and replaying that KeyErrors on `state_file` — my first attempt did exactly
   that and broke 30 tests. **Two facts recorded on the thread:** the cited
   reproduction is not reachable (`tests/test_message_format.py` exposes 0
   unittest tests — it is a standalone script runner), and the hardcoded-tenant
   idiom is repo-wide (10+ modules, including
   `test_themarker_probe_rotation.py:130` from PR #102). Applied to the new
   suite only; converting the rest is a separate cleanup.

Findings 1–3 are a fair hit on my design: I added a fallback and then failed to
read it, compared two populations with different denominators, and then missed
the mirror image of my own fix.

## What changed (code)

**1. Source direction-control contract (`core/article_parser.py`).**
`normalize_source_direction_controls` — LRM, RLM, ALM, the five
embeddings/overrides (U+202A–U+202E), the four isolates (U+2066–U+2069) —
now runs **unconditionally** at the end of `_global_clean_paragraph` and
`_global_clean_title`. The `force_rtl_blocks` gate and its predicate
`_strip_untrusted_bidi_enabled` are gone.

Placement matters and was verified, not assumed: the strip sits exactly where
`_ZERO_WIDTH_STRIP` already sat — **after** the vendor-label caption matchers
(`_CAPTION_SEP` deliberately matches **on** these codepoints, so it must see
them) and **after** `_strip_glued_latin`. Those rules therefore observe
byte-identical input to before; only the final output loses the invisible
marks.

**2. Full publish surface, one change.** Every mandatory field flows through
one of those two cleaners before validation — title, author, hero caption,
body, headings, inline-image captions, source-link footer label (plus advisory
subtitle and drop-gated Cocoon). The only uncovered mandatory field is
`metadata_author`, a tenant config constant. Inline CTA link text and
social-embed text call the helper directly, being the only publish-boundary
surfaces that bypass the cleaner.

**3. Validators untouched.** `_SEMANTIC_CONTROL_CHAR_OK` and
`_RENDER_CONTROL_CHAR_OK` keep exact current membership, asserted by test.
Soft hyphen, C0 controls, language tags, U+FFF9 and every unknown `Cc`/`Cf`
still abort. Explicitly **not** a blanket `Cf` allowlist.

**4. Publication accounting (`core/main.py`).** New `pub_<source>` counters
bump once per real publication at the same site as `posted` — all three
`bump_stat(state, "posted")` sites are paired, verified by grep — including
`flash`, which previously bumped `posted` with no source attribution at all.
`sum(pub_*) == posted` by construction. The run summary prints `pub_*` in the
`posted=N (…)` parenthetical and reports extraction totals on a separate
labelled line, only when they differ.

**5. Retry recovery (`core/state.py`).**
`migrate_themarker_telegraph_direction_mark_retry`, flag
`themarker_telegraph_direction_mark_retry_v1` (TheMarker config only).
RELATIVE decrement (`retry_count - 1`, never below zero) so a later legitimate
retry survives. Correct under every disposition: deferred (observed —
`first_seen_at` and the `extraction_outage_parked` reason untouched), published
(`kept_published`, never resurrected), terminalized (back to deferred one below
the terminal count, only those two identities so no unrelated terminal row is
recovered), absent or already zero (recorded no-op). Never sends, publishes or
fabricates a publication event.

**6. Alerting (`core/alerting.py`).** Owner DM now reports
`extraction_outage.parked_item_count` while an outage is active. Also fixed a
**pre-existing** defect found by a new test: the pure-improvement branch
updated the stored signature but neither set a phase nor returned, so control
fell through to the send — an improving incident DM'd every poll with a
"start" headline. It now continues into the reminder cadence.

## The accounting decision (this is the part worth reading)

The task prompt's preferred reading was that `src_*` means publication source
and 2026-09-08 needed a stats repair. **The evidence says otherwise, and the
prompt's own fallback branch applies.**

`src_<source>` is bumped the moment the fetch chain yields a gate-passing body
— before canonical/fingerprint dedup, before Telegraph, before Telegram. It
counts EXTRACTIONS. Across all committed history:

```
sum(src_*) - posted == errors + dedup_skipped
```

holds on **82 of 83** TheMarker days and **44 of 44** Tech Feed IL days (whose
deltas reach +30 on ten consecutive July days). The single exception is
2026-05-10, a legacy flash-path artifact. 2026-08-14 and 2026-08-15 carry the
identical +1 shape as 09-08 and were never corrected.

So: **no historical stats rewrite was performed.** 2026-09-08 `src_one3ft=10`
against 9 ledgered publications is correct-by-contract. Reinterpreting `src_*`
would have rewritten half of Tech Feed IL's history and changed a shared
counter. Truth was restored by adding `pub_*` and fixing the *display*, which
is exactly what §9/§10 of the prompt prescribe for this branch.

## Production evidence

**Multi-poll rotation (PR #102) — now PRODUCTION-VERIFIED.** The prior handoff
said the cursor had advanced only once. Falsified by committed state: the
cursor advanced **153 → 154 → 155 → 156** across four consecutive polls
spanning **22.6 hours** inside one unbroken outage
(`first_seen_at 2026-09-07T16:19:47Z`; state `148a175`, `cddf321`, `fe191c4`,
`a2394c2`; corroborated verbatim at `state/errors.log:1242,1432,1633,1832`).
An earlier chain shows **wrap-around 142 → 0 → 1 → 2** inside the
2026-09-06T00:42 outage. All 10 `active-outage fairness` lines read `2 external
probe row(s)`; the 4 reading `0` are outage-*establishing* polls, which plan
while the outage is inactive and carry no probe plan by design.
`extraction_outage.probe_count` advances 1→3→5→7→8.

**Correction to the coordinator's framing:** the pair *(156/167 poll 16,
169/172 poll 18)* is real but is **not one continuous advance** — a recovery
occurred at 14:59:28Z and a NEW outage was established at 18:32:19Z (`a7e7271`,
`seeded_from: "outage_established"`, cursor reset). 169 belongs to that fresh
incident. It is the weakest available evidence, not the strongest.

**Reading caveat now documented:** `_seed_probe_rotation` hardcodes
`last_probe_index: 0` and sets `ready_count` to total queue size, so rows with
`seeded_from: "outage_established"` are sentinels, not measured positions.

**The current provider outage is genuine and was NOT suppressed.** Still
`active=true` since 2026-09-09T01:06:05Z, 158 parked, all four providers down.
Established by reading the predicate: the 21:41 incident opened solely through
`boundary_failures > 0` (the two U+200F failures — `errors=2` did not
contribute, `high_errors` needs `> 10`); the 01:06 owner DM was an
**escalation** (`phase="update"`, five new signature elements), not a reminder,
so `reminder_count=0` is correct rather than a cadence violation.

## Validation

- New suite `tests/test_themarker_rtl_publication_boundary.py` — **50 tests**;
  full suite **610 → 660 OK**.
- `python -m tests.test_message_format` OK (TEST II updated to the new
  contract, plus a new assertion that the parenthesised counts sum to posted).
- `compileall`; 16 workflow YAMLs; `bash -n`; `node --check` + `node --test`
  (21); `git diff --check`.
- **`state/` byte-clean** after the full suite AND after each of the 29
  CI-listed modules run individually. That per-module sweep surfaced a
  **pre-existing** leak in `tests/test_themarker_malformed_url.py` — its
  migration logged into the tracked `state/errors.log` whenever that module ran
  alone (masked under `discover` because an earlier module redirected the
  global first). Fixed with the canonical redirect idiom.
- **Integration beyond unit tests:** the exact sanitized U+200F shapes driven
  through the real parser → publication-field builder → final validator → node
  tree with only `_post` mocked, on a temp state copy — publishes once, no
  duplicate page, visible text and the Hebrew maqaf intact, no stray
  non-leading RLM, `_final_tree_violations` empty; malicious controls abort
  before the API with nothing sent to Telegram. All migration dispositions
  exercised against a **copy** of the live committed `state/themarker.json`
  (never the tracked file). The rendered owner DM was MarkdownV2-linted.
- No Telegram or Telegraph write occurred at any point. No production state was
  edited by hand.

Twice during the round my own probe scripts appended to the tracked
`state/errors.log` (they imported `core.state` without redirecting). Both times
the diff was inspected first — pure appends, zero deletions, my own lines — and
the file was restored; every later probe redirects the log. Final `state/` is
byte-identical to `origin/main`.

## Retrospective Codex audits of #100 and #101 — COMPLETED, 6 findings, all unresolved

Requested 2026-09-05T18:30Z; both completed the same day. Recorded as factual
status; **none is fixed here** and none overlaps this change set.

| PR | Reviewed | Sev | Path | Finding |
| --- | --- | --- | --- | --- |
| #100 | `f20075988a` | P2 | `core/main.py:975` | Flash sends escape the per-run publication cap |
| #100 | `f20075988a` | P2 | `core/extraction_outage.py:137` | `missing_title` missing from the positive-health allowlist |
| #101 | `718145dd39` | **P1** | `core/main.py:2370` | The 4-post cap restarts at 0 between phase 1 and phase 2 |
| #101 | `718145dd39` | P2 | `core/source_health.py:2997` | Recovery incident removed before the DM is confirmed delivered |
| #101 | `718145dd39` | P2 | `core/source_health.py:2814` | Incident signatures omit the per-feed check identity |
| #101 | `718145dd39` | P2 | `core/providers.py:176` | 2xx content rejections fall through to `PROVIDER_UNAVAILABLE` and can latch a provider off |

All six threads `isResolved=false`. The two `source_health` items are Tech Feed
IL (out of scope here). **The #101 P1 is the highest-priority forward fix.**

## Docs

New ADR `docs/themarker-rtl-publication-boundary-20260909.md` and evidence
report `reports/themarker-rtl-publication-boundary-20260909.md`.
`handoffs/CONTEXT.md`: new dated section at the top + a
**Backlog reconciliation 2026-09-09** block. README: two new sections
(*Source direction controls*, *Extraction vs publication counters* — the
`src_*`/`pub_*` distinction was previously undocumented anywhere), plus the
migration inventory and the `force_rtl_blocks` description. Stale "multi-poll
rotation unverified" text struck through (not deleted) in three places.

## STILL PENDING PHYSICALLY

0. **THE MERGE ITSELF.** PR #103 is OPEN. Codex quota ran out before the final
   head could be reviewed, so the Gate is correctly red. Everything below
   depends on the merge and none of it is claimed as done.
1. **A naturally-encountered TheMarker article carrying a source direction mark
   publishing through the corrected path in production.** The outage active at
   2026-09-09T01:06Z had not cleared at hand-off, so nothing could publish
   externally at all. Test-, integration- and simulation-verified only. **Not
   claimed as physically proven.**
2. **The retry migration applying in production** — it runs on the first
   post-merge poll through the normal runtime path.
3. **Post-merge acceptance** — truthful per-source counters summing to posted,
   no U+200F boundary failure, no duplicate publication, cap still 4, no false
   outage recovery.

## NEXT (explicitly out of scope here)

0. **Get PR #103 reviewed and merged** once Codex capacity returns:
   `@codex review` on #103, fix anything real, then the normal Merge Bot path.
1. **one3ft prewarm/wake timing + an independent full-body backup provider.**
   one3ft again answered `503 → 8s warm retry → 503` at 01:06 while being
   responsible for most recent successful premium publications. Unchanged by
   design.
2. **PR #101 P1 forward fix** — the per-poll publication cap restarting between
   phase 1 and phase 2. Then the remaining four retrospective findings.
3. Scheduled-run gaps (open observation, not root-caused).
4. Issue #50 recurring `low_hebrew_dominance`.

## Rules note

`agent-memory/DEVELOPMENT_RULES_FULL.md` was read in full FIRST (canonical copy
at the agent-memory root). Preflight covered pwd/repo/branch/HEAD/tracking/
status/diff/remotes/log/origin-main/open-PRs and every state, config, core,
workflow, test and handoff file listed in the task. No `reset`, `clean`,
`restore`, `stash`, `force-push` or alternative worktree was used to bypass any
work — the only `checkout` calls restored my own accidental test appends to a
tracked log, each inspected first. Four read-only subagents ran the
investigation tracks. agent-memory was finalized ONLY through
`/root/work/bin/agent-memory-finalize`; no direct Git operation was run inside
the agent-memory repository.
