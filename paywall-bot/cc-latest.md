# paywall-bot current handoff — PR #93

Updated: 2026-08-11 UTC

## Repository and pull request

- Project: `funzi7/paywall-bot`.
- Existing task branch:
  `fix/themarker-extraction-outage-circuit-breaker-20260810`.
- Final pushed project HEAD:
  `aae1c20698509d3cf52a4e9f68cc7a24feb44383`.
- PR #93, `fix(themarker): park systemic extraction outages`, is open,
  non-draft, and targets `main`. It is deliberately not merged.
- The branch was normally reconciled with scheduled-state commits through
  fetched `origin/main` `19642e9d4bdeeedce714113e5f6bfd05f9ba92a6`.
  No reset, stash, force push, alternate worktree, or state rollback was used.
- Exact-head CI run `31532282974` passed on `aae1c20698509d3cf52a4e9f68cc7a24feb44383`.
- Trusted Codex reported no major issues on exact head `aae1c20698` at
  `2026-08-11T20:22:47Z`. Every prior P1/P2 thread is resolved or outdated.
- The PR-attached rerun of trusted gate run `31532281455` succeeded, including
  evaluator job `93916314961` and authoritative `check-codex-status` job
  `93916362452`. The review-triggered gate run `31532623944` and manual
  verification dispatch `31532650437` also succeeded. The PR is mergeable,
  `mergeStateStatus=CLEAN`, and all three final checks are green.
- No PR merge, deployment, production Poll dispatch, Backfill, manual
  production-state edit, real Telegram post/DM, or Telegraph create/edit was
  performed by this task.

## PR #92 is merged and its production recovery worked

PR #92 merged as `2c32368013ee35560952f5e6ec2fe141cd101439` on
2026-08-09. Its publication accounting, successful-send checkpointing, exact
inclusive rolling 24-hour Health source window, distinct `last_post_at` and
`last_poll_at`, terminal ledger, and source-aware alert behavior are production
invariants. PR #93 preserves them.

Verified normal-production results after PR #92:

- historical `e074` remains Telegram message #757;
- recovered live `e16` published as #760 through direct;
- recovered premium `d240` published as #761 through one3ft; and
- recovered premium `dd04` published as #762 through one3ft.

Normal sends continued. Current fetched state commit
`19642e9d4bdeeedce714113e5f6bfd05f9ba92a6` reaches message #782 at
`2026-08-11T19:55:06.919015+00:00` through one3ft. Messages #780, #781, and
#782 are all publication-proven. Message #766 was only the latest send at the
initial incident report.

Daily Health remained correct: run #86 (`31353377940`) fetched/resolved 13
records and logged `exact_window=True`; run #87 (`31455370670`) also retained
exact rolling-window coverage. A technically successful workflow does not
override application-health classification.

## Current extraction outage and first-party findings

Decoded Poll & Post runs #700 through #725 were inspected. Across unrelated
premium, highlight, magazine, and short public-looking URLs, the systemic
signature repeats:

- Telegram source text is absent or incomplete;
- premium direct is intentionally `skipped_premium_url`;
- highlight/public-looking direct responses are short paywalled teasers;
- Jina returns 403;
- smry returns an HTTP-200 client shell with `no_body`;
- one3ft is volatile, often 503 but intermittently recovers; and
- Wayback returns 403/404.

Run #724 (`31519428389`) repeated the chain across five rows before one3ft
recovered for the sixth and published #780. Run #725 (`31530201981`) repeated
it again, terminalized reviewed identity `eb60`, bumped reviewed identities
`f0c7`, `f083`, and `ef3a`, then published unrelated fresh rows `f0b9` and
`f0eb` as #781/#782 when one3ft recovered. This proves both the systemic
retry-burn problem and the need to preserve usable-source recovery.

Read-only first-party response inspection covered current premium,
`.highlight`, `ty-article-magazine`, ordinary public, short paywalled-looking
public, and live shapes. Full bodies were not printed or persisted. Ordinary
public and structurally complete live pages contain complete server-rendered
bodies already handled by direct. Premium/highlight/magazine responses expose
only teaser/paywall DOM and JSON-LD plus body-free React metadata. No complete
premium body or demonstrably page-referenced first-party body endpoint was
proved. PR #93 therefore adds no new parser, browser/session path, speculative
proxy, or quality-floor reduction. The four-paragraph / 1,500-character floor
and scoped live completeness proof remain unchanged.

## Circuit breaker and Health behavior

`core/extraction_outage.py` classifies only the bounded body-free four-provider
availability pattern. Direct premium skip alone is not systemic. A healthy
usable source or request-backed article-specific quality failure prevents a
false systemic classification.

The TheMarker-only poll policy is:

1. One representative ready row probes the configured chain.
2. Proven systemic evidence parks that row without incrementing retry.
3. Later ready rows still try item-specific Telegram/direct sources, but make
   zero new Jina/smry/one3ft/Wayback requests in that poll.
4. Complete local content may publish; article-specific local quality failure
   uses the normal item retry; provider/paywall-local exhaustion parks.
5. The next scheduled Poll performs one bounded full-chain reprobe.
6. Complete content or request-backed provider-health evidence clears stale
   outage state and normal processing resumes.
7. If the representative reprobe is inconclusive and leaves persisted outage
   state active, that active state latches the remainder of the Poll so later
   rows use only Telegram/direct and do not repeat the external chain or burn
   retries.
8. If publication proof or normalization removes the final parked row, the
   bounded count refresh now deactivates the stale latch with
   `no_parked_work`. This fixes the reviewed stale-latch P2 and is covered
   for both startup normalization and phase-2 dedup removal.

Persisted `extraction_outage` metadata is bounded and body-free. Parked work is
unpublished, nonterminal, retry-neutral, eligible, and red in Health—not grace
waiting. Alert cooldown may suppress a duplicate DM but never changes red
classification. Tech Feed IL's existing publisher cooldown and publication
accounting remain separate and cross-tenant tested.

## Exact 19-identity recovery

Migration version: `themarker_2026_08_09_extraction_outage_v1`.

It is tenant-gated, state-only, idempotent, and never sends or creates
publication proof. Publication proof wins. Current status/retry, failure
reason, body-free systemic attempts, suppression shape, and original
first-seen evidence must match; otherwise the row fails closed as
`left_state_mismatch`.

Current exact transitions after run #725:

- 14 terminal identities restore retry 5 -> 0: `e4af`, `e096`, `d1bf`,
  `e542`, `e671`, `b2be`, `e63d`, `e581`, `64f8`, `e618`, `e5c7`, `ec85`,
  `ec77`, and `eed3` (full UUIDs/URLs are versioned in `core/state.py` and the
  reliability runbook).
- terminal `ef60-db03-a9ff-ff733d9f0000` restores 5 -> 1, preserving its one
  legitimate one3ft HTTP-200 short-body failure.
- terminal `eb60-d310-a3df-ef63432e0000` restores 5 -> 0.
- deferred `f0c7-d28e-a3df-f0d74c530000`,
  `f083-db94-a3df-fd8342f90000`, and
  `ef3a-d456-a99f-ef7ab4f10000` restore 3 -> 0.

The identity allowlist remains exactly 19. The scheduled-state reconciliation
changed only the exact evidence shape for four already allowlisted identities.
An in-memory copy of current tracked production state produced 19/19
`retry_budget_restored` outcomes, left the real state object/file unchanged,
and created no publication proof. Published `ef7d` (#780), `f0b9` (#781), and
`f0eb` (#782), plus all unrelated rows, remain excluded.

The normal first Poll after an owner merge must be the migration's first
production application. Do not apply it manually.

## Telegraph native author-header follow-up

TheMarker config now uses the existing generic policy:

- `author_name: TheMarker` (visible byline preserved);
- `author_url_behavior: channel`; and
- `author_url: https://t.me/demarkerpremium`.

New createPage and explicit editPage requests therefore use
`https://t.me/demarkerpremium` as the native Telegraph author/header link. The
original TheMarker article is not used as the top link and remains exactly
once in the established final `מקור: TheMarker` footer node. No duplicate
attribution block was added. Tech Feed IL remains on its existing
`https://t.me/Tech_Feed_IL` policy, and generic `original` behavior remains
supported for a tenant that selects it.

Read-only HTTP inspection of the latest existing page, message #782, returned
200. It currently renders visible byline `TheMarker` linked to the original
article and ends with the original-source footer, proving the pre-merge state
and footer. No existing Telegraph page was edited or migrated. The config
change affects newly created/explicitly edited pages only after merge.

## Validation physically executed

All Telegram and Telegraph write boundaries were mocked.

- `.venv/bin/python -m tests.test_message_format`: passed.
- `.venv/bin/python -m unittest discover -v`: 458/458 passed.
- `.venv/bin/python -m compileall -q .`: passed.
- `.venv/bin/python -m compileall core sites tests`: passed.
- `node --check tools/codex_gate_logic.js`: passed.
- `node --test tests/test_codex_gate_logic.js`: 18/18 passed.
- PyYAML parsed all 15 tracked workflow files.
- `bash -n` passed both tracked shell scripts.
- `git diff --check` passed.
- SHA-256 comparisons proved all seven tracked `state/` files byte-identical
  across the final Python suites; final state diff matched fetched
  `origin/main` exactly.
- Exact-head GitHub Actions CI run `31532282974`: passed.
- Trusted exact-head Codex review: clean at `2026-08-11T20:22:47Z`.
- Trusted PR-attached gate run `31532281455`: evaluator
  `93916314961` and `check-codex-status` `93916362452` both passed.

## Remaining risk and exact continuation

- External providers remain volatile. When none supplies complete content,
  correct behavior is red parking—not fake completeness or retry exhaustion.
- PR #93 remains open and unmerged. Do not claim deployment from this handoff.
- If `origin/main` advances again before merge/finalization, reconcile normally,
  preserve scheduled state, inspect exact transition evidence, and rerun the
  affected validation. Never force push.
- After an owner merges PR #93, let the first normal scheduled Poll apply the
  migration and breaker. Verify all 19 stored migration outcomes, one bounded
  representative external chain during continued outage, zero retry burn for
  parked rows, and red Health classification.
- Verify the first newly created TheMarker Telegraph page after merge: visible
  `TheMarker` header must link `https://t.me/demarkerpremium`, and the original
  article must appear exactly once in the final footer.
- Verify the first Poll that exercises the circuit breaker and the first
  complete-source reprobe that clears it. Preserve publication-events and exact
  rolling-24h Health semantics.
