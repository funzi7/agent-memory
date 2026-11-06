# OptionsProfitTracker — 2026-11-06 exact financial/reconciliation + stock-quote handoff

This is the complete current handoff. It supersedes the 2026-10-20 current handoff while preserving
that history in agent-memory git and the appended state/roadmap/gotchas records.

## Heads, branch, PR and review

- OPT starting HEAD: `d2c5a3ebeded5c09ca7c3f03375418a40a069bb3`.
- OPT final/pushed exact HEAD: `6f13551b7c28b908e4a5a6e82a3fbf78f9cfa135`.
- Branch: `s2/ibkr-reconciliation-lifecycle-dashboard`; PR #19 OPEN, not merged. No push to `main`.
- Agent-memory starting HEAD: `038c507d463ed9eddb458b3c81b35cc220817817`; final memory SHA is
  the canonical finalizer commit containing this handoff and must be read from git, never guessed.
- The owner's existing `local.properties` SDK path stayed unstaged/excluded from every OPT commit.
- Normal review provider: trusted `chatgpt-codex-connector[bot]`. Clean receipt comment
  `6687271825`, 2026-11-06T14:32:23Z, explicitly reviewed `6f13551b7c`: “Didn't find any major
  issues.” GraphQL paged both thread pages; zero unresolved current/non-outdated P1/P2.
- Exact-head PR Build Gate run `42234318111`, job `127947896680`: PASS. Workflow Scripts Tests run
  `42234318000`, job `127947895442`: PASS. Codex Gate check `127949734602`: PASS. The initial
  push-time evaluator failure before the clean connector signal is historical, not the final Gate.

## What was fixed

### Exact close/BTC money and canonical evidence

The two outstanding October P2 findings are **SUPERSEDED — fixed with owner approval**:

1. A single-leg CC/CSP row could retain legacy spread-leg values. A `$1.00` short call with stale
   `$0.40` leg data and a `50%` target could prefill `$0.30` instead of `$0.50`. Every close-screen
   opening-money, target, derived percentage and preview now consumes `SpreadEvidence.sanitizeLegs`.
   It clears the complete legacy leg tuple for a strategy-owned single leg and preserves genuine
   spreads. Typed price, edited percent, saved target and screen reopen regressions pass.
2. Canonical flows previously woke only on Room emissions even when durable
   `canonicalPositionId`/reconciliation evidence changed. All store instances now share one
   process-owned `BrokerEvidenceRevision`; only a changed successful synchronous commit advances it.
   Repository canonical flows combine Room plus that revision. No-op, failed and CAS-rejected writes
   do not emit false change claims.

Subsequent complete-PR reviews tightened exact execution/class proof for older opening-only partial
replay, conserved signed opening-commission cents by sequential subtraction, and made canonical plus
durably associated hidden-inverse deletion an evidence-revision/full-row group CAS with immediate
all-or-none cancellation recovery. Assignment, collapsed-spread, backup/recovery and stock-publication
boundaries fail closed. No aggregate plug or ticker-specific correction was introduced.

WDCX remains the canonical local close fixture: open `0.95`, 3 contracts, opening rebate `-1.46`,
close `0.65`, closing rebate `-1.47` → exact `+92.93`. The displayed `32%` cannot change dollars to
`94.13`; money comes from exact price and signed fees, percentage is derived.

Historical assignments are excluded from CC reminder eligibility; the owner confirmed BBAI, ASTX and
BTCI no longer appeared as phantom covered calls. Settings now shows generated
`BuildConfig.VERSION_NAME`; there was no version bump.

### Stock-price refresh ownership and final review fix

The visible Dashboard **Prices** action was wired to `syncPrices(context)`, which enqueued Flex/IBKR.
That explains how a price action could surface `IBKR 1003 statement not available`; it did not own a
canonical quote refresh. The action now forces the process-owned `DASHBOARD_PRICE_REFRESH` workflow.
Composition/resume/pull join equivalent in-flight work; explicit force bypasses completed freshness
but does not duplicate in-flight work. The sorted/deduplicated snapshot-root plus current-OPEN
universe is fetched in stable provider batches of at most 30. Different universes/kinds remain
distinct. Operational quote evidence is non-backup and independent of broker timestamps. Success,
zero/invalid failure, partial `X/Y`, provider omissions and authoritative root pruning are factual.

Complete-PR review `5801013995` of predecessor `00bb211d47...` found P2 `4493135680`: snapshot/
evidence attempt ordering did not fence the later Room position-price projection, so an older
different-universe request could overwrite the newer price. Final `6f13551...` reads fresh OPEN rows
under `BrokerLifecycleMutationCoordinator`, rechecks the durable accepted attempt, projects through
bounded full-row CAS, and makes accepted commit+projection non-cancellable. Failure commits use the
same lifecycle owner. Five deterministic tests cover newer-before-older, older-then-newer fresh reread,
identity/ticker/status CAS races, failure release/retry and cancellation. Reply `4493482112` resolved
the review thread.

### Tick proof and PUT ownership retained from S2.8

`OptionTickPolicy` keeps continuous model values separate from new actionable limits. Proven BUY
limits round down and SELL credits round up using decimal increments. `OptionTickProofService` reads
Cboe daily class-reference CSVs and accepts documented positive Tick Type labels for the actual option
series: penny-to-$3 (`.01/.05`) and penny-all (`.01`); proven non-penny `.05/.10` is unit-tested but is
not inferred from absence. No `.50` rule or larger increment was invented. Missing/stale/conflicting
proof makes automatic model/PUT/B-S recommendations explicitly unavailable. Historical weighted
average fills are factual and never quantized.

Owner override retained: unknown tick proof no longer disables or clears manual BTC price/percentage
entry or the explicit B-S **Fill** calculator. Manual values warn and retain the prior two-decimal
calculator behavior; they are not asserted executable recommendations. Automatic recommendations
remain strict. Exact entered price still drives effective percentage and P&L.

High-IV and PUT are separate owner-approved tools. `HighIvScreen` is IV-only. Dedicated
`PutOpportunitiesScreen` (`פוטים לפי פרמיה / בטחונות`) owns one first automatic scan only when no
attempt exists for the current New York day, then explicit `סרוק הזדמנויות`; maximum one in flight,
same-day cache on re-entry, cancellation retry, factual failure/empty/closed-session state. Dashboard
and IV never secretly scan; Top 3/full page share the canonical result/scoring pool. User-facing OI is
`חוזים פתוחים (OI)`/`OI`; thresholds remain OI≥100, contract volume≥10, spread≤25%, relevant ticker
PUT volume≥100 and a real bid. All lifecycle/request-count validation used fakes—no live scan.

## Financial audit: what is proven and what is not

The fixed Sep1–28 NY-window sanitized audit input SHA-256 is
`aaf7e9f827358cf4bb6f2c5e3094acee3d28124a7157b835c6f9e9818ccc0dc2`; output SHA-256 is
`5de7863d4cc852c84b617e21a6884ebd11f586b80ad52f7bfd052f2810942a17`. It contains 52 rows:
16 broker-backed, 36 local-only. Raw persisted local total is `5089.44` (owner screenshot `5089.43`).
Three proven manual/imported inverse duplicates suppress `245.35`; exact cent handling contributes
`+0.01`; 49 canonical rows total `4844.09`. Broker reference is `4741.75`, leaving `102.34` across
33 canonical local-only cycles. The owner confirmed no additional Sep1–28 broker export is saved, so
row attribution cannot be invented.

Other owner evidence remains open:

- Sep3–Oct2 canonical `5724.27` versus broker `5518` (whole-dollar residual `206.27`).
- September statement canonical/app `5832.48` versus IBKR equity+index options `5634.27`, residual
  `198.21`. SOXL assigned 128C is local `199.23` versus broker option `0`; removing it would leave
  `-1.02`, and raw assignment provenance is absent.
- YTD app/canonical `38287.55` versus IBKR `37688.74`, gap `598.81`, without an exact owner cutoff.
  Older BTCI/IRE/SPCH partial slices total `302.54`; they are genuine cycles, not duplicates, and lack
  external broker identity/amounts.
- November options match exactly at `+232.30`. November stock remains RKLX OPT/Flex FIFO `-926.74`
  versus broker `-990.92`, MULL `-5678.18` versus `-4563.93`; OPT total `-6604.92` versus IBKR
  headline `-5554.86` (the displayed broker rows add to `-5554.85`). Existing Flex FIFO evidence
  reproduces OPT; displayed average anchors can reproduce the broker figures, but selecting an
  accounting method or rewriting historical basis requires owner policy and authoritative evidence.

Overall financial parity is therefore **FAILED**. No hardcoded SOXL zero, September/YTD adjustment,
November cent correction, ticker offset, cost-basis guess or lifecycle merge by resemblance was made.

## Validation, artifact and physical QA

- Focused financial: 134 tests / 3 classes / 0 failures/errors/skips.
- Focused stock quote: 53 tests / 6 classes / 0 failures/errors/skips.
- Full JVM: 2334 tests / 169 classes / 0 failures / 0 errors / 1 existing
  `OrdersTradesReferenceTest` private-history skip; 2333 executed; `BUILD SUCCESSFUL in 30s`.
- Node workflow scripts: 84/84. Python exporter: 4/4. `git diff --check`: clean.
- Strict `:app:compileDebugKotlin`: `BUILD SUCCESSFUL in 10s`, zero real compiler `^e:` lines.
- Clean `assembleDebug`: `BUILD SUCCESSFUL in 4m11s`, 42 executed tasks.
- APK version `1.0.0`, code `1`, 64,832,472 bytes; SHA-256
  `4c8db166356120ceb9afb64698e1397c7af8112f3752065dd3f19c5736b7398a`.
- Original signer unchanged: SHA-256
  `9e5307e1344917f0cdc495c5cc04a80d23a92c5965c779b6efb0faa1135b8221`; SHA-1
  `5d3d855c6c6c397f817df2bd0c62f16f940b1551`.
- Exact-hash copy delivered to
  `/sdcard/Download/OptionsProfitTracker/OptionsProfitTracker-1.0.0.apk`.

Shared host ADB listed no attached device. The final APK was **not installed or launched**. The last
earlier read-only phone evidence had OPT-only `OEM_DENY_3` and unsatisfied JobScheduler connectivity,
but it could not be reverified post-build. No live Dashboard Prices, Yahoo/Finnhub, IV, chain, PUT,
watchlist, news, Flex/IBKR sync/import/resync, broker statement retry, trading action or device-DB/
settings mutation occurred. Physical final quote, CC-reminder, Settings-version and BTC-form QA is
owner-deferred; do not claim PASS.

## Remaining backlog / next work

1. Obtain authoritative per-cycle broker evidence before changing Sep/YTD or November stock money.
   Preserve every residual above and the historical stock-ledger/SOFI/missing `ibOrderID` gaps.
2. Physical install/launch and controlled live quote acceptance only when a device is attached and the
   owner authorizes provider traffic. Preserve ADB1 live scheduling and ADB2 broker E2E as owner-gated.
3. Owner choices remain: Import newly accepted OPEN/one-letter cycles; GetStatement pacing;
   non-standard multipliers; sync-now behavior during backoff; overdue pre-market semantics.
4. Preserve `MIGRATION_30_31` registration hazard, expired/null-close history and bidi debt,
   exact-series/non-penny/larger-tick proof gaps and cross-store process-death/permanent-projection
   limitations.
5. Preserve unrelated roadmap: OPT → Trading Tracker SPEC_ONLY; conditional ChatGPT daily report;
   Phase 3 personal historical BTC-exit learning; PR #20 automation-core/fallback rollout and untested
   `issues:write` permission.
6. Standalone market agent: approved plan remains `docs/STANDALONE_MARKET_AGENT_PLAN.md`; implementation
   belongs in future private `funzi7/opt-market-agent`. No hosting, credentials, deployment, recurring
   paid runs or automation were enabled here.

Finalize future memory updates only through
`AGENT_MEMORY_PROJECT=options-profit-tracker /root/work/bin/agent-memory-finalize "<factual message>"`;
do not mutate agent-memory Git directly.
