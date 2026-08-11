# paywall-bot current handoff — TheMarker extraction outage

Updated: 2026-08-11 UTC

## Current repository and PR

- Project: `funzi7/paywall-bot`
- Task branch: `fix/themarker-extraction-outage-circuit-breaker-20260810`
- Final pushed project HEAD:
  `75691d0ac9e71eaca9574e41c6ef8bba67fd8e5c`.
- PR: #93, `fix(themarker): park systemic extraction outages`, ready, open,
  targeting `main`; it is not merged, auto-merge is unset, and its final
  `mergeStateStatus` is `CLEAN`.
- Base used after scheduled-state reconciliation:
  `35bc4e0372bc15a4b69839e17ef10608c8e055b2`.
- Exact-head CI run `31525184002` passed every canonical repository step on
  `75691d0ac9e71eaca9574e41c6ef8bba67fd8e5c`.
- Trusted review raised and the branch fixed three real findings: a P1 where
  later rows skipped item-specific local sources, a P1 where non-TheMarker
  paywall rejection was removed, and a P2 where provider-health evidence did
  not clear stale persisted outage state. The first thread is outdated; the
  two line-mapped fixed threads are resolved. The trusted reviewer reported
  no major issues on exact head `75691d0ac9` at
  `2026-08-11T18:59:25Z`.
- Review-only gate dispatch `31525749669` succeeded. The PR-attached rerun of
  gate run `31525182583` then succeeded, including evaluator job `93893739654`
  and authoritative `check-codex-status` job `93893780483`. All three final PR
  checks are green.
- No PR merge, deployment, production workflow dispatch, Backfill, production-
  state edit, real Telegram post/DM, or Telegraph create/edit occurred. The
  normal post-merge scheduled Poll remains the first authorized production
  application of the migration and breaker.

## PR #92 is merged and worked

The old handoff was stale. PR #92 merged at
`2c32368013ee35560952f5e6ec2fe141cd101439` on 2026-08-09. Do not revert its
publication accounting, successful-send checkpointing, exact rolling 24-hour
Health window, source timestamps, terminal ledger, or source-aware alerting.

Its exact recovery migration succeeded through normal production Polls:

- historical `e074` is Telegram message #757;
- recovered live `e16` published as #760 through direct;
- recovered premium `d240` published as #761 through one3ft; and
- recovered premium `dd04` published as #762 through one3ft.

Normal publications continued afterward. Current fetched production state
contains 22 publication events and reaches Telegram message #780 at
`2026-08-11T17:49:02.247329+00:00`, source one3ft, URL identity `ef7d`.
Message #766 at `2026-08-09T21:22:16.187205+00:00` was only the latest send
at the initial outage report, not current latest truth.

Daily Health is also working. Run #86 (`31353377940`) fetched 13 Telethon
messages, resolved 13 records, and logged `exact_window=True`. Run #87
(`31455370670`) fetched 14 messages, resolved the 13 records inside the exact
rolling interval, and also logged `exact_window=True`. Publication counts
remain `publication_events`-based, and last post/poll remain distinct.

## Current outage evidence

Every decoded post-merge Poll log from #700 (`31306003725`) through #724
(`31519428389`) was read. Provider availability is intermittent across
unrelated TheMarker URLs:

- Telegram source text is usually absent/incomplete;
- premium direct is intentionally `skipped_premium_url`;
- public-looking/highlight direct pages return a short paywalled teaser;
- Jina returns 403;
- smry returns HTTP 200 but its client shell parses as `no_body`;
- one3ft frequently returns 503; and
- Wayback returns 403/404.

Run #708 had two ready/two bumped. Run #709 (`31369619950`) had three ready,
two bumped, and terminalized magazine `b2be`. Run #723 (`31509168254`) repeated
the broken chain for six rows before one3ft recovered and published #777–#779.
Run #724 repeated it for five rows, terminalizing `ef60`, before one3ft
recovered for the sixth and published `ef7d` as #780. A workflow conclusion of
success is therefore not application health.

Fetched production state commit `81bc541` has:

- latest poll `2026-08-11T17:49:07.820731+00:00`;
- latest post `2026-08-11T17:49:02.247329+00:00`, message #780;
- 15 active `fetch_chain_exhausted` terminals;
- four retry-bearing affected deferred rows; and
- two fresh retry-zero rows (`f0b9`, `f0eb`) that are not recovery targets.

## First-party extraction findings

Read-only raw-response inspection covered current premium, `.highlight`,
`ty-article-magazine`, ordinary public, short paywalled-looking public, and
live pages. Full article text was not printed or persisted.

- Ordinary public and structurally complete live pages contain full bodies in
  server-rendered DOM and are already accepted by the existing direct path.
- Premium/highlight/magazine pages expose only a one-paragraph teaser in DOM
  and JSON-LD plus paywall UI.
- Their React Flight target-article record contains IDs, title, dates, paywall
  type, and word count, but no article body/content.
- No complete premium body or page-referenced first-party body endpoint was
  proved. Generic API-gateway strings are not proof of an endpoint.

Therefore PR #93 adds no speculative proxy, browser automation, login/session
path, or new first-party parser. The global floor stays four paragraphs / 1,500
characters. The existing live exception still requires exact complete DOM and
JSON-LD update agreement with no collapsed/expand control. A sanitized fixture
pins teaser/paywall/nav/comment/metadata rejection.

## Circuit breaker implementation

`core/extraction_outage.py` classifies only a bounded, body-free systemic
attempt chain. All four configured external providers must show explicit
availability failures. Direct premium skip or explicit
`paywalled_partial_body` may accompany the outage, but a healthy non-paywalled
direct quality failure vetoes systemic classification. Any accepted source or
healthy external-provider content rejection also uses the normal per-item
retry. The exact migration alone accepts reviewed legacy direct reason codes,
because its allowlist predates the explicit paywall diagnostic and decoded
logs prove those direct shapes were paywall teasers.

`core/main.py` implements a TheMarker-only poll-local latch:

1. The first qualifying ready row probes the normal chain.
2. If systemic, it becomes `extraction_outage_parked` with unchanged retry.
3. Every later ready row still tries its item-specific Telegram/direct paths
   but makes zero Jina/smry/one3ft/Wayback requests. A complete local body can
   publish; a healthy direct integrity rejection uses the item retry lifecycle,
   while provider/paywall-local exhaustion parks with unchanged retry.
4. The shared-provider latch remains active after a local-only success, so the
   rest of the Poll still cannot fan out into repeated broken-provider chains.
5. The next scheduled Poll permits one fresh full-chain representative probe.
6. A complete valid source on that probe clears the active outage and normal
   processing resumes; existing successful-send checkpointing/dedup prevents
   duplicates.

A request-backed external-provider response rejected only for article-specific
quality also clears a stale active systemic flag before that row uses its normal
retry. Post-parse integrity rejection follows the same transition. Missing or
availability-only diagnostics do not clear it.

Top-level `extraction_outage` is bounded and stores only active/recovered state,
first/last/probe times, probe and parked/affected counts, reason, and four
source/reason pairs. Parked rows remain unpublished, nonterminal eligible
work. Health distinguishes them from grace waiting, displays the bounded
provider line, and forces active outage red. Alert cooldown can suppress a
duplicate DM but cannot change the underlying red classification.

The feature is gated by tenant name and TheMarker config. Tech Feed IL's
existing `source_extraction_cooldown`, publisher request behavior, retries,
and publication accounting are unchanged and cross-tenant tested.

## Exact recovery migration

Version: `themarker_2026_08_09_extraction_outage_v1`.

It is TheMarker-only, idempotent, state-only, and never posts or creates fake
publication evidence. Publication proof wins. Current status/retry, original
first-seen evidence where present, failure reason, and systemic attempts must
match; otherwise that row fails closed as `left_state_mismatch`. It removes
processed suppression only for an exact matching terminal target and requires
that suppression as part of the terminal shape. An unexpected suppression on
an active deferred target fails closed and is preserved. The normal post-merge
Poll must be the first production invocation.

Exact terminal targets restoring retry 5 -> 0:
`e4af`, `e096`, `d1bf`, `e542`, `e671`, `b2be`, `e63d`, `e581`,
`64f8`, `e618`, `e5c7`, `ec85`, `ec77`, and `eed3` (full UUIDs and URLs are
versioned in `core/state.py` and the reliability runbook).

Exact terminal `ef60-db03-a9ff-ff733d9f0000` restores 5 -> 1. Its first
one3ft HTTP-200 `body_too_short:960<1500` response was article-specific; its
following four attempts were systemic.

Exact active deferred restoration:

- `eb60-d310-a3df-ef63432e0000`: 4 -> 0
- `f0c7-d28e-a3df-f0d74c530000`: 2 -> 0
- `f083-db94-a3df-fd8342f90000`: 2 -> 0
- `ef3a-d456-a99f-ef7ab4f10000`: 2 -> 0

Published `ef7d` (#780), fresh `f0b9`/`f0eb`, all PR #92 publications, and any
unrelated historical terminal are intentionally not recovered. An in-memory
copy of current production state matched 19/19 targets, moved 15 terminals to
deferred, restored the four active budgets, preserved original first-seen
data, and left `publication_events` plus `last_post_at` unchanged. No tracked
state file was edited.

## Validation actually executed

All Telegram and Telegraph write boundaries were mocked. No Backfill, real
channel post, owner DM, Telegraph create/edit, production Poll dispatch, or
manual production-state mutation occurred.

- `.venv/bin/python -m tests.test_message_format`: passed.
- `.venv/bin/python -m unittest discover -v`: 454/454 passed.
- `.venv/bin/python -m compileall -q .`: passed.
- `.venv/bin/python -m compileall core sites tests`: passed.
- `node --check tools/codex_gate_logic.js`: passed.
- `node --test tests/test_codex_gate_logic.js`: 18/18 passed.
- PyYAML parsed all 15 tracked workflow YAML files.
- `bash -n` passed both tracked shell scripts.
- `git diff --check` and tracked `state/` diff checks passed.
- SHA-256 snapshots proved all seven tracked state files byte-identical across
  both Python suites.

The current local Python environment is the repository `.venv`; the older
PRoot/bubblewrap limitation did not reproduce. The bare system interpreter
lacks the Telegram dependency, so the canonical Python commands were executed
with `.venv/bin/python`; none was claimed against an interpreter where it could
not start.

## Remaining risks and exact continuation

- External provider availability remains volatile. HTTP success still must
  pass all completeness and integrity gates.
- Premium/highlight/magazine full bodies are unavailable if all configured
  providers are unavailable; the correct behavior is red parking, not fake
  completeness or retry exhaustion.
- PR #93 is ready for owner review but remains deliberately open and unmerged.
  Do not merge it from this task handoff.
- If `origin/main` advances with scheduled state before finalization, merge it
  safely without force, inspect the new Poll/state transition, update the exact
  migration constants only from proven evidence, rerun affected tests, and
  push a normal follow-up commit.
- After a reviewed merge by the owner, let the normal scheduled Poll apply the
  migration. Do not run Backfill or edit state. Verify the stored 19 migration
  outcomes, exactly one representative provider chain during a continuing
  outage, zero retry changes for parked rows, red Health, and automatic normal
  processing after a complete-source probe.
- Keep this file aligned with later production facts; preserve unrelated
  agent-memory work and use normal non-force pushes.
