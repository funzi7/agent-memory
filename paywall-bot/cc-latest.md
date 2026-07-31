# paywall-bot — PR #88 source-health, queue and Codex Gate handoff (2026-07-31)

## Git and pull request

- Repository: `funzi7/paywall-bot`.
- Actual fetched starting `origin/main`: `17040d5b03d0de427cc2d7f5cfc9ed3b7ace303e`.
- Branch: `fix/techfeedil-health-queue-gate-20260731`.
- Ready-for-review PR #88: https://github.com/funzi7/paywall-bot/pull/88, targeting `main`; not merged.
- Final remote branch/PR head at handoff: `b5361afa6e3a569b030e26023315bdb21045ec80`.
- The local Termux/PRoot checkout could not be synchronized or locally verified because Git commands continued to fail with `bwrap: fchdir to oldroot: No such file or directory`. All mutations and exact-head validation used the GitHub repository boundary.

## Production evidence inspected read-only

- Daily Source Health run `30609946194`, job `91090294635`, finished
  2026-07-31T06:32:44Z: about 9.6 seconds, 21 direct requests, 3 Jina
  requests, no unfinished checks, overall degraded, and shared Telegram,
  Telegraph and production-poll checks healthy.
- Affected Poll & Post run `30624364449`, job `91136063612`, produced
  state commit `9d0e9a1b797f69d41916f2ac8fbdb250598a1dd3`.
- Its copied state held these retry-count-4 deferred identities:
  `https://gadgety.co.il/366030/xmc-1200-של-xmems`,
  `https://pc.co.il/455617`, and `https://pc.co.il/455771`.
- The Gadget Reviews official RSS discovered current items, but full-article
  extraction returned direct 429 and Jina 403. The Verifier official RSS
  discovered article 80300, but full-article extraction returned direct/Jina
  403. No demonstrably complete public first-party alternate body was proven.
- TECH12 remained behind a Radware challenge with no proven same-scope official
  endpoint. N12 Digital is a broader healthy sibling, so publisher status is
  partial/degraded. Geektime's health feed returned a temporary 403 before a
  later production poll published successfully. HWzone later exposed a fresh
  2026-07-31 item.
- GitHub Actions logs for the three Telegraph rows showed failure before any
  Telegraph API call at final mandatory-field validation: valid Latin glyphs
  `µ` U+00B5, `é` U+00E9 and `É` U+00C9 were rejected. Gadgety's carried
  s.w.org WordPress emoji hero was separately confirmed invalid.
- PR #87's source-health P2 was incorrectly staled by commit timestamp after an
  unrelated Page Doctor commit.

## Root causes and implementation

1. Publisher rate limiting was checked too late and initially inspected only
   top-level feed results. The monitor now scans every publisher probe,
   including every first-party fallback-chain response, before extraction
   scheduling. It captures only bounded Retry-After seconds/date metadata,
   persists a fixed publisher cooldown, performs zero article/Jina/home
   fallback requests after any 429, and never caches body text.
2. Discovery unavailability formerly generated a derivative
   `no_representative_item` extraction failure. It is now skipped/degraded
   without increasing extraction failure streaks; recent source-specific
   production evidence informs the effective publisher pipeline state.
3. Source-wide direct-429 or direct/Jina access blocks now park newly discovered
   items in a bounded, body-free cooldown state without consuming per-item
   retries. Items resume after fixed expiry; historical terminal failures are
   not resurrected.
4. Telegraph final validation accepts Unicode Latin letters and narrow
   micro-unit glyphs while source bidi controls, foreign-script contamination,
   and content-integrity gates remain fail-closed. Invalid emoji/icon/logo/
   tracking heroes are rejected. Failures retain stable
   `telegraph_publish_failed` aggregation plus bounded
   validation/render/request/API subreasons with no response bodies.
5. A versioned idempotent migration targets only the three exact identities and
   exact legacy Telegraph reason/subreason if runtime made them terminal. It
   restores normal deferred processing only; a second run is a byte-identical
   no-op and never publishes.
6. Source-health output now produces one coherent final component/publisher
   state, distinguishes discovery/extraction/pipeline/blocked queue, reports
   partial multi-feed degradation, suppresses unchanged alert spam, and clears
   recovery alert state.
7. Codex Gate now bases finding liveness on trusted GraphQL review-thread
   `isResolved`/`isOutdated` state, not commit timestamps. Active unresolved
   non-outdated trusted P1/P2 findings block across unrelated commits; outdated
   findings require a current-head clean signal; resolved findings and the
   explicit administrator override clear. Pure Node decision tests cover all
   required cases. After Codex review, the gate module was additionally moved
   to an immutable PR-base/default-branch checkout so a PR cannot execute its
   own policy module. The bootstrap PR's base does not yet contain that new
   module, so its own gate uses the pre-existing intentional technical
   fail-soft; after merge future runs load the trusted default-branch module.

## Changed areas

- Runtime: `core/source_health.py`, `core/article_parser.py`,
  `core/main.py`, `core/telegraph_pub.py`.
- Policy/config: `sites/techfeedil/config.yaml`,
  `.github/workflows/codex-gate.yml`, `tools/codex_gate_logic.js`.
- Tests/CI: focused source-health and Telegraph queue suites, sanitized fixture,
  Node gate suite, and `.github/workflows/ci.yml`.
- Documentation: `README.md`, `docs/techfeedil-attribution-health.md`,
  `handoffs/CONTEXT.md`.

## Validation and safety

- Exact-head CI run `30633921686`, job `91166641995`: success. It passed
  message-format, all requested Tech Feed IL and complete TheMarker regressions,
  53 existing Source Health tests, 6 focused source-health recovery tests, 7
  Telegraph queue tests, full unittest discovery, compileall, Node syntax and
  12 gate tests, every tracked workflow YAML parse, every tracked shell
  `bash -n`, state cleanliness, and diff checks.
- Codex Gate run `30633921399`: success under the documented bootstrap
  fail-soft. Earlier Codex findings were addressed by commits
  `eb00200ab40de99fb21447d091308ad6f5622c28`,
  `5562292d1b0ab15e9b5e902cda27b7cef57df5c8`, and
  `b5361afa6e3a569b030e26023315bdb21045ec80`.
- Tracked state blobs were re-read from the final branch and match the starting
  snapshot exactly: `.gitkeep` `e69de29...`, `errors.log` `bbf0071...`,
  health `1bc88a...`, Tech Feed IL `645266...`, both Telegraph token files
  `ed8d3f...`/`09a3d1...`, and TheMarker `4bc558...`.
- No real Telegram send, owner DM, Telegraph createPage/editPage, Backfill,
  page-doctor, historical repair, production-state edit, or runtime-log commit
  occurred. Tests mock all write boundaries and copied state was used for
  replays.

## Remaining operational limits

- No complete public first-party body fallback was proven for The Gadget
  Reviews or The Verifier. Their new items remain queued under bounded source
  cooldown and resume automatically when publisher extraction recovers.
- Local `HEAD = remote branch HEAD` could not be established inside the
  broken PRoot wrapper. Remote branch head, PR head and exact-head CI all point
  to `b5361afa6e3a569b030e26023315bdb21045ec80`.
