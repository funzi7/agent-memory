# paywall-bot — PR #88 source-health, queue and Codex Gate handoff (2026-07-31)

## Git and pull request

- Repository: `funzi7/paywall-bot`.
- Actual fetched starting `origin/main`: `17040d5b03d0de427cc2d7f5cfc9ed3b7ace303e`.
- Branch: `fix/techfeedil-health-queue-gate-20260731`.
- Ready-for-review PR #88: https://github.com/funzi7/paywall-bot/pull/88, targeting `main`; open, mergeable, not draft, not merged.
- Final remote branch and PR head: `7c4d10acb51968500bd80f8da3b5494f3d4b29f0`; direct comparison is identical (ahead 0 / behind 0).
- The local Termux/PRoot checkout could not be synchronized or locally verified because every attempted Git/shell command failed with `bwrap: fchdir to oldroot: No such file or directory`. All branch mutations and exact-head validation used the GitHub repository boundary; do not claim local tests passed.

## Exact production evidence inspected read-only

- Daily Source Health run `30609946194`, job `91090294635`, finished
  2026-07-31T06:32:44Z: about 9.6 seconds, 21 direct requests, 3 Jina
  requests, no unfinished checks, overall degraded, shared Telegram,
  Telegraph, and production-poll checks healthy.
- Poll & Post run `30624364449`, job `91136063612`, produced state commit
  `9d0e9a1b797f69d41916f2ac8fbdb250598a1dd3`. Later polls published N12
  Digital, TGspot, Geektime, and Gadgety, proving the general pipeline live.
- Copied state held these exact retry-count-4 `telegraph_publish_failed` rows:
  - Gadgety `https://gadgety.co.il/366030/xmc-1200-של-xmems`
  - PC `https://pc.co.il/455617`
  - PC `https://pc.co.il/455771`
- The Gadget Reviews official RSS returned 200 with 30 current items, while
  representative article extraction returned direct 429 and Jina 403.
- The Verifier official RSS exposed current article
  `https://theverifier.co.il/80300/apple-siri-ai-icloud-subscription-paywall/`;
  direct and Jina article extraction returned 403.
- N12 TECH12 remained a Radware challenge with no proven current same-scope
  official representation. The broader filtered N12 Digital feed remained a
  separate healthy sibling. Geektime's daily health feed got 403, but a later
  production poll published a current item. HWzone later supplied a fresh
  2026-07-31 item.

## Root causes

1. Publisher 429 classification existed, but extraction cooldown was consulted
   only when no representative existed. A multi-feed publisher could therefore
   receive an article request after one sibling had returned 429.
2. Direct configured fallback, Jina fallback, and stale website cross-check
   429s were not uniformly terminal. Later fallback endpoints could still be
   requested in the same probe.
3. Discovery unavailability manufactured a derivative
   `no_representative_item` extraction failure. Degraded display evidence
   could also clear an older extraction failure even though no extraction ran.
4. Source-wide extraction failures burned each queued item's retry on every
   poll instead of parking the item behind a source cooldown.
5. The three Telegraph rows parsed/finalized successfully and failed before any
   API call at mandatory final-field validation: valid `µ` U+00B5, `é`
   U+00E9, and `É` U+00C9 were rejected. Gadgety's carried s.w.org emoji URL
   was independently an invalid WordPress placeholder hero.
6. Codex Gate inferred finding liveness from REST comment time versus newest
   commit time. An unrelated PR #87 commit therefore made an unresolved P2 look
   stale. Subsequent rollout review found the trusted-workflow, PR-head check,
   and resolution-watchdog edge cases that are also fixed here.

## Implemented invariants

- All sibling discovery probes finish before extraction scheduling. Any
  current-run 429 creates one coherent publisher cooldown result and zero
  subsequent article/direct/Jina/home-fallback extraction requests, regardless
  of a sibling or cached representative.
- The current-probe rate-limit latch spans direct, Jina, configured fallback,
  and stale-listing paths. The first 429 records only bounded status and
  Retry-After evidence and terminates that feed's remaining fallback chain.
  Already-running sibling discovery is not cancelled.
- Cooldown state has a bounded fixed expiry and does not self-extend from stale
  state. Cached representative identity is metadata only; cached body text is
  never reused.
- `discovery_unavailable` is non-derivative. It does not increment or clear
  the extraction failure lifecycle merely because discovery supplied no item.
  Publisher-cooldown observations with
  `additional_article_request=false` likewise preserve an existing extraction
  failure until a real extraction result. A no-evidence failed cooldown still
  counts as a genuine failure.
- Publisher digest state separates discovery, extraction, production pipeline,
  and blocked/cooldown queue. Multi-feed N12 is partial/degraded rather than
  wholly failed; unchanged degraded/failed runs remain silent and real
  recovery clears alert state once.
- New items blocked by source-wide extraction failure stay in a body-free,
  bounded queue state without consuming per-item retries. They resume after
  cooldown expiry; historical terminal failures are not resurrected.
- Telegraph keeps stable high-level `telegraph_publish_failed` aggregation
  plus bounded validation/render/request/API subreasons. Unicode Latin letters
  and narrow µ/μ units are accepted; unsupported scripts, source bidi controls,
  contamination, emoji/icons/logos/tracking pixels remain fail-closed.
- The versioned migration is exact to the three canonical identities and exact
  legacy reason/subreason. It restores only matching terminal rows to normal
  deferred processing, never publishes, and is byte-identical on a second run.
- Codex Gate uses trusted GraphQL review-thread `isResolved`/`isOutdated`
  state, exact Codex App identities, Summary/Testing quote stripping, and
  reaction-based current-head clean signals. Active unresolved non-outdated
  P1/P2 survives docs/test/state/unrelated commits.
- The gate evaluator is loaded only from base/default-branch workflow code via
  `pull_request_target`, `issue_comment`, or default-branch dispatch; it
  checks out and executes no PR code. It creates the authoritative
  `check-codex-status` directly on `pr.head.sha`; its native evaluator job
  has a different name.
- The default-branch watchdog queries authoritative thread state, rechecks red
  verdicts after resolution/outdating, admits that transition through its
  dispatch guard, and dispatches `codex-gate.yml` from the PR base/default
  ref rather than the PR head ref.
- On final head Codex posted a clean PR-level `+1` at
  2026-07-31T14:27:26Z. Eight addressed active threads were replied to and
  resolved; no unresolved non-outdated trusted P1/P2 remains. Four historical
  unresolved threads are already GitHub-outdated and therefore non-blocking.

## Changed files

- Workflows: `.github/workflows/ci.yml`,
  `.github/workflows/codex-gate.yml`,
  `.github/workflows/claude-fallback-watchdog.yml`.
- Runtime: `core/article_parser.py`, `core/main.py`,
  `core/source_health.py`, `core/telegraph_pub.py`.
- Configuration/docs: `sites/techfeedil/config.yaml`, `README.md`,
  `docs/techfeedil-attribution-health.md`, `handoffs/CONTEXT.md`.
- Tests/tools: `tools/codex_gate_logic.js`,
  `tests/test_codex_gate_logic.js`,
  `tests/test_techfeedil_source_health_recovery.py`,
  `tests/test_techfeedil_telegraph_queue_recovery.py`,
  `tests/fixtures/techfeedil_telegraph_latin_validation.json`.

## Validation

- Final exact-head CI run `30638366727`, job `91181688502`, passed on
  `7c4d10acb51968500bd80f8da3b5494f3d4b29f0`.
- It passed: `tests.test_message_format`, `tests.test_techfeedil`,
  `tests.test_techfeedil_wave2`, `tests.test_source_health`, both new
  focused suites, quality/hotfix/Cocoon/Verifier/multisource/RTL/Walla/TGspot/
  content-bounds/live-render/ordered-content/excerpt suites, full
  `unittest discover -v` (including complete TheMarker regressions),
  `compileall`, Node syntax and all Codex Gate tests, every tracked workflow
  YAML parse, every tracked shell script through `bash -n`, state guard, and
  `git diff --check`.
- Earlier exact-head green review runs while addressing Codex findings:
  `30636412296`, `30637282034`, `30637648842`, and
  `30638151842`.
- Focused assertions prove zero real Telegram send/owner DM/Telegraph write,
  no tracked production-state save, zero subsequent publisher request after
  429 (including direct/Jina/configured/stale paths), bounded logs, exact
  migration second-run no-op, and TheMarker compatibility.
- No real Telegram post/DM, Telegraph createPage/editPage, Backfill,
  page-doctor, old-page repair, production-state edit, or runtime-log commit
  was performed.

## Tracked state snapshot — unchanged on final head

- `state/.gitkeep`: `e69de29bb2d1d6434b8b29ae775ad8c2e48c5391`
- `state/errors.log`: `bbf0071e77de0a189f66ac10cb4c69ca8f68bcab`
- `state/techfeedil-health.json`: `1bc88a257dbf4d6a4c841845deb6965ee619aaaa`
- `state/techfeedil-telegraph-token.json`: `ed8d3f177dbf590a79d49c8beace6d6895439cb2`
- `state/techfeedil.json`: `645266616b48b01c0f158db141e4d208c2766582`
- `state/telegraph_token.json`: `09a3d17f40c228daa58d90c452db42b0bd05e799`
- `state/themarker.json`: `4bc5580991822b5acb7b86eac6f42faaff987603`

## Remaining blockers / post-merge expectation

- Local branch checkout and local tests remain blocked by the PRoot bubblewrap
  `fchdir` failure; remote branch/PR identity and exact-head CI are verified.
- The secure `pull_request_target` gate is a bootstrap change: GitHub loads it
  from the default branch, so PR #88 itself cannot execute that new trusted
  workflow until after merge. Static gate/watchdog tests and current-head Codex
  review validate this rollout; future PRs execute it from trusted `main`.
- No complete first-party article fallback was proven for The Gadget Reviews
  or The Verifier. Their new items remain queued until bounded cooldown expiry
  and extraction recovery; no fake success was introduced.
- After merge, the three exact Telegraph items retry only through the normal
  poll, source-blocked items stop burning retries, Geektime/HWzone recover on
  successful checks, N12 remains accurately partial, and unrelated commits can
  no longer clear active Codex P1/P2 findings.
