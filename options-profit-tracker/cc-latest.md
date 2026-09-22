# OptionsProfitTracker — rolling handoff (Claude Code)

**Task:** S2.7 — BROKER-EXACT REALIZED P&L + ONE CANONICAL LEDGER + BROKER PROVENANCE + 0DTE +
PUT LIQUIDITY + MODEL BTC EXIT TARGET + MARKET-BRIEF FIXES
**Date:** 2026-09-22 (implementation, Codex rounds 10–16, device QA, and this finalization pass)
**Branch:** `s2/ibkr-reconciliation-lifecycle-dashboard` — **PR #19 OPEN** (`needs-owner`,
`no-automerge`), **never merged**, nothing pushed to `main`.

> **This file was fully rewritten on 2026-09-22 as the FINAL S2.7 handoff.** The previous revision
> named `a6e1837` as Final HEAD and still said device QA had not run, the APK was not installed, the
> Codex gate was pending and Yahoo volume/OI was unproven. **All four of those statements are
> superseded by later evidence recorded below.** Historical detail is kept only where it is marked
> as superseded.

---

## 1. Heads

| | SHA |
|---|---|
| S2.7 starting HEAD | `1a51e5e41a3e8a13a05d6833d862783243fa62cb` |
| recovered S2.6 follow-up | `ff2b41f` (see §2) |
| first S2.7 feature commit | `a6e1837` — **NOT the final head**, superseded by 16 review commits |
| **FINAL HEAD** | **`4512cbfa93b0a1623d544626c56e1c8709c06083`** |
| `origin/main` (untouched by this PR) | `7225b7af16c183de00a9f064ead03a01ad6af1d3` |

18 commits in the round. Against the merge-base: **196 files, +54,945 / −1,476** (the count includes
the recovered S2.6 follow-up and two large new `docs/` specifications).

`HEAD` is NOT an ancestor of `origin/main` — verified — so `main` carries none of this yet.

---

## 2. READ THIS FIRST — the round started from 2,768 lines of UNCOMMITTED, UNCOMPILABLE work

The worktree carried 43 modified + 6 new files written 2026-09-15 16:38–16:40, i.e. **after** the
S2.6 commit at 15:20. It was a coherent S2.6 follow-up round (`StockFeedPlan` occurrence ordinals,
the health-check `build` step-output rename, `usableEvidence` across every evidence tier) that was
never committed **and never compiled**:

> `ImportViewModel.kt:1659 Unresolved reference 'BuildConfig'`

`referenceWindowEnabled` is the app's ONLY `BuildConfig.DEBUG` reference and AGP 8.x does not
generate `BuildConfig` unless `buildFeatures { buildConfig = true }` is set. It was not. One line in
`app/build.gradle.kts` closed it; the work was preserved as its own commit `ff2b41f`.

**It also shipped three failing tests and three pasted bidi glyphs**, all found and fixed in S2.7.
Lesson recorded in `gotchas.md`: *work that was never run is not work that was verified.*

---

## 3. The premise correction that defines the round

S2.6 was built on "IBKR Orders & Trades is average-cost, so SPCH there is −2,412.39". **The owner's
current Orders & Trades screenshots disprove it.** Their screen, 2026-09-01..2026-09-18:

| | IBKR |
|---|---|
| STOCK (7 trades) | **−$15,377.60** |
| OPTIONS (99 trades) | **+$3,033.53** |
| COMBINED (106) | **−$12,344.07** |
| SPCH / BTCI / SOFI / NOK | −6,815.39 / −1,914.57 / −3,077.21 / −3,570.42 |

SPCH at −6,815.39 **is** the Flex FIFO figure (the exact sum of the four EXECUTION fills S2.4
measured). So the displayed stock figure went back to IBKR's own `fifoPnlRealized`, and
`OrdersTradesRealized` / `StockLotAccounting` / `BrokerBasisStore` survive as the logged DIAGNOSTIC —
S2.6's arrangement, inverted. Marked `SUPERSEDED — owner approved` in CLAUDE.md.

**Nothing was hardcoded toward a target; September is not special-cased; NOK already matched and was
not disturbed.** The $0.01 between the rounded rows (−15,377.59) and IBKR's header is the broker's
and was NOT "corrected".

App before the round: BTCI −2,210.42, SPCH −2,412.39, NOK −3,570.42, SOFI −4,070.90.

---

## 4. What was built

| task | artefact |
|---|---|
| A — one selection rule | `RealizedLedger.selectedRealized` replaces ~35 hand-typed copies; `CloseRowAudit` per-cycle audit |
| B — one ledger | `RealizedLedger` (periods, broker split, derived combined) + `StockRealizedLedger` + `StockRealizedLedgerStore` |
| C — market brief | heading grouped per scope; `INDEX_PHRASES` fixed; new `MarketHeadlineNature` |
| D — 0DTE | `OptionTimeRemaining` + `BlackScholesCalculator.calculateForYears` |
| E — put liquidity | `PutOpportunity` floors + 8 new rejection reasons + counters + empty states |
| F — BTC exit target | `BtcExitOptimizer` (CRR lattice, per-collateral-day objective) |
| G | strict ±2x/±3x discovery untouched; regression green |
| H | health check VERIFIED not rewritten — `docs/S2_7_HEALTH_VERIFICATION.md` |
| I | `docs/OPT_TO_TRADING_TRACKER_CONTRACT.md` (1,066 lines), SPEC ONLY |

### TASK B — the migration verdict: **NO Room migration. Schema stays v31.**

`syncSource` is INGESTION provenance (`doImport` writes `IMPORTED` for a TradeStation CSV *and* an
IBKR Flex payload; only 7 hardcoded seed rows carry `TRADESTATION`) and **no broker account / order /
execution id is persisted anywhere**. The owner supplied the missing fact as a rule instead:
**broker provenance is a DATE boundary** — TradeStation through 2025-10-17, IBKR from 2025-10-18 — so
`RealizedLedger.brokerOf(date)` derives it. Closed `positions` rows are already durable. Only the
STOCK half was volatile, and it uses the standalone-prefs shape approved twice before
(`BrokerCashFlowStore`, `BrokerBasisStore`).

`StockRealizedLedgerStore` = one key per realized stock row,
`<TICKER>|<day>|<S|B>|<qty>|<price>|<ordinal>`. Merge is SCOPED to the `(ticker, day)` pairs the
payload describes. Amounts stored RAW, rounded ONCE per ticker-month.

**What it cannot claim, and says so:** it starts EMPTY and accumulates from this build onward. It
cannot recover a month no payload ever reported. `coverage()` reports the real row count and day span
and `StockRealizedScreen` prints it.

### TASK A — two REAL defects found, beyond the semantic flip

1. `PositionSummary.profitPercentOnPosition` and `annualizedReturn` took their numerator from
   `ProfitCalculator` **even on a reconciled row**, while `realizedPnL` on the SAME summary took the
   broker's. One row could print IBKR's P&L beside a percentage from a different number. Fixed at the
   unprotected `ReportGenerator` call site; `ProfitCalculator` untouched.
2. `DashboardViewModel.optionsRealized` did `total += pnl` **before** `closeDate ?: continue`, so a
   row with no close date counted in the all-time total and in NO month.

Plus: **three YTD windows** with three different null-`closeDate` fallbacks (two `openDate`, one
`expiration_date`) and two interval kinds, converged on `closeDate ?: expirationDate`.

### TASK F — the objective, stated exactly

`expected realized P&L / expected collateral-day`, over the COMPLETE policy — hit paths AND
carry-to-expiry AND assignment AND loss. Deterministic CRR lattice, no drift (p = 0.5), values from
`calculateForYears`. **`StrategicRiskAnalyzer` untouched; no second probability model.**
Refuses rather than guessing; **never falls back to 80**.

---

## 5. Codex review rounds 10–16 (all applied, all on top of `a6e1837`)

| round | what it caught |
|---|---|
| 10 | English `BID/ASK` run unisolated in an RTL paragraph; the What-if never re-evaluated at the exchange cutoff |
| 11 | `describedDays` is the DELETION scope and **absent ≠ zero** — a STK row with no `fifoPnlRealized` could erase a stored sale. Also: my own earlier "fix" had INVENTED a 13:00 close on 2026-07-02; the NYSE publishes no July early close when July 4 falls at a weekend, so the rule is plain July 3 again |
| 12 | `PUT_SCAN` counters must SUM to `puts` — `NOT_RED` / `NO_UNDERLYING_PRICE` / `BAD_STRIKE` were unnamed |
| 13 | the scan line reported only the LAST expiry page's live percentage |
| 14 | the live-pct collapse used numeric distance, not the `isRed` (`pct < 0.0`) classification boundary |
| 15 | the three Finnhub-spending pools were still ViewModel-scoped, completing S2.6 finding 21 |
| 16 | claims moved to process scope while the FETCHES stayed on `viewModelScope` — a cancelled fetch left a standing claim over an empty pool |

**Round 17 came back clean.** Codex review comment 2026-09-22T15:10:20Z:
`Codex Review: Didn't find any major issues.` — **Reviewed commit `4512cbfa93`**, the exact final head.
This is genuine Codex evidence. It is **not** a Claude fallback and must never be described as one.

---

## 6. Verification at the final head

| | |
|---|---|
| `:app:compileDebugKotlin` | **BUILD SUCCESSFUL**, `grep "^e: "` EMPTY |
| JVM tests | **1409 tests, 0 failures, 0 errors, 1 skipped, 66 classes** (1384 at `a6e1837`; 1133 at S2.6) |
| `git diff --check` | clean |
| health scripts | `node --test .github/scripts/health/` → **75/75 pass** |
| APK | 1.0.0, sha256 `b01e16d701f965ae645fb125f77123272cdfe3ba919f535e2291206fd95ad687`, signer SHA-1 `5d3d855c…` |
| APK handling | built, **installed in place with `adb install -r`**, **launched successfully** (no FATAL), delivered to `/sdcard/Download/OptionsProfitTracker/`. No uninstall, no `pm clear`, no data wipe |

**SUPERSEDED:** the earlier APK `b84a0069c80cb56bcdf547f4d06ed3ed1bb5d614c1e7b13106b99fa4629c3d34`
and the earlier "1384 tests / 65 classes" figures belonged to `a6e1837`.

### Exact-head GitHub state — verified read-only during finalization

| check | result |
|---|---|
| `build-gate` | **pass** |
| `scripts-test` | **pass** |
| `check-codex-status` | **pass** |
| `codex-gate-evaluator` | **pass** |

PR #19: OPEN, not a draft, `mergedAt` null, `mergeCommit` null, base `main`, head
`4512cbfa93b0a1623d544626c56e1c8709c06083`.
Review threads: **37 total — 10 resolved, 27 unresolved and all 27 `isOutdated=true`** (anchored to
lines later commits replaced). **Zero unresolved current-head threads.**

**SUPERSEDED:** the previous "`build-gate` pending at handoff / `codex-gate` fail-closed pending"
note described the state seconds after a push, not a verdict.

---

## 7. DEVICE QA — IT RAN. This supersedes "device QA NOT RUN".

ADB came back up and the final QA session ran on the owner's own phone against the live Flex
snapshot, through the settings **`סנכרן מ-IBKR`** path.

### Measured, matching IBKR Orders & Trades to the cent

| ticker (Sep) | app | owner reference |
|---|---|---|
| SOFI | **−$3,077.21** | −3,077.21 ✓ |
| BTCI | **−$1,914.57** | −1,914.57 ✓ |
| NOK | **−$3,570.42** | −3,570.42 ✓ (already correct, not disturbed) |

### SPCH — **−$4,288.73 is CORRECT, and it is a WIDER PERIOD, not a mismatch**

The owner's reference is the fixed window 2026-09-01..2026-09-18 = **−$6,815.39**. The device showed
the FULL September month. It printed the fills:

```
SUM SPCH 2026-09 total=-4288.73 sells=5/-4288.73 buys=0/0.00 days=2026-09-08|2026-09-21
ROW SPCH 2026-09-08 SELL grain=EXECUTION qty=-500 px=10.70 realized=-3407.71
ROW SPCH 2026-09-08 SELL grain=EXECUTION qty=-300 px=10.69 realized=-2043.77
ROW SPCH 2026-09-08 SELL grain=EXECUTION qty=-100 px=10.69 realized=-681.97
ROW SPCH 2026-09-08 SELL grain=EXECUTION qty=-100 px=10.69 realized=-681.94
ROW SPCH 2026-09-21 SELL grain=EXECUTION qty=-800 px=10.76 realized=+2526.66
```

The four 09-08 fills sum to exactly **−6,815.39**. A later **2026-09-21** sale of 800 shares realized
**+2,526.66**, and `−6,815.39 + 2,526.66 = −4,288.73`. Nothing was wrong and nothing was adjusted.

### The reference window

Four reference tickers over the owner's fixed window: visible rounded row sum **−$15,377.59** against
IBKR's headline **−$15,377.60**. The one cent is IBKR aggregate/internal rounding.
**No adjustment was added and production math was NOT changed to force the rows to the headline.**

### Ledger, coverage, and the derived month

- `STOCK_LEDGER` first population: `incoming=272 stored=0 -> 272 tickers=103 span=2025-11-21..2026-09-21`;
  repeat pass `stored=272 -> 272` — the scoped merge is idempotent on that already-running sync path.
- `StockRealizedScreen` shows honest coverage wording beginning `נצבר מ-2025-11-21` and does **not**
  claim unseen earlier stock history. Its all-time stock coverage is therefore **partial** and starts
  at the measured stored span.
- Dashboard month: stock realized **−$12,850.93**, options realized **+$4,372.90**, combined
  **−$8,478.03**. Combined is **DERIVED**: `+4,372.90 + (−12,850.93) = −8,478.03`.
  Do NOT compare this full-month state against the owner's older Sep 1–18 screenshot as one period.

---

## 8. Yahoo `volume` / `openInterest` — **PROVEN on the device**

This supersedes "NOT PROVEN — Yahoo returned HTTP 429 to this host". The live phone showed chains
such as `18 puts / 18 with own IV / 16 with volume / 18 with open interest`, and
`10 puts / 10 with own IV / 10 with volume / 10 with open interest`.

**Both fields DO exist in the live device payload.** Missing volume stays **UNPROVEN ⇒ EXCLUDED**
under the owner's liquidity contract, and the `16 of 18` line is that path occurring naturally.
**Do not change that behaviour.**

---

## 9. What the final QA session could NOT observe — stated, not glossed

| item | why |
|---|---|
| a live ACCEPTED put row | the live PUT scan ranked **zero** candidates that session. Not a failure by itself; the rejection counters now account for every contract (rounds 12–14) |
| the live 0DTE path | no same-day expiring live contract existed that session. Logic is covered deterministically by unit tests, not by the screen |
| the repeated-heading / plain-`NASDAQ` visual case | no qualifying broad-index news item existed that session, so the original visual defect could not be reproduced again |

Do not manufacture an accepted candidate, a 0DTE contract or a news item to claim UI coverage.

---

## 10. NOT RE-RUN — owner explicitly declined further broker synchronization

The owner ruled: **the account is already synchronized and no new broker data is expected**, so no
further IBKR sync, import, full re-sync or same-snapshot import test was performed.

These diagnostics live on the **IMPORT / reconciliation** path. The final device session used the
supported IBKR sync path, which refreshes the stock side but does **not** call `reconcileWithBroker`:

- `CloseRowAudit summary … contractViolations == 0`
- the fixed 2026-09-01..2026-09-18 complete OPTIONS / STOCK / COMBINED triple
- historical IBKR subtotal **+$6,916.31**
- SOFI IBKR subtotal **−$6,795.78**
- same-snapshot IMPORT idempotency
- `OPTIONS_SYNC` / `REALIZED_LEDGER` import diagnostics

**Status: NOT RE-RUN — owner explicitly declined further broker synchronization.**
This is a deliberate owner acceptance decision. It is **not** permission to record them as passed,
and it is **not** an acceptance blocker to be reopened by the next session.

---

## 11. NO market-data refresh was performed during finalization

No price, IV, option-chain, PUT-scan, watchlist, news, BLS/Investing/issuer or any other provider
call was made in the finalization pass — see the quota item in §12.

---

## 12. Open items for the owner / next sessions

1. **NEW — price/API refresh appears to run ~3× per owner action.** Owner observation: one manual
   price refresh appears to execute approximately **three** refresh passes in succession, which can
   rapidly consume the monthly quota of the configured market-data/API keys. **Cause is NOT
   diagnosed and must not be guessed.** A future task must audit: the exact user action, every
   trigger it generates, ViewModel recreation, WorkManager/background overlap, per-provider fan-out,
   shared refresh functions, repeated IV refresh, repeated stock-quote refresh, option-chain refresh,
   cache/TTL ownership and in-flight request deduplication.
   **Acceptance:** one owner refresh action must not create duplicate equivalent provider requests.
   **Do not reproduce it and do not consume quota until the owner authorizes it.**
2. **PR #20 `chore/sync-automation-core`** — still OPEN, not merged. Carries
   `claude-fallback-review.yml` plus updates to `claude-fallback-watchdog`, `codex-gate`,
   `merge-bot`, `ci-doctor`. **It is NOT required to validate this head**, which has a genuine clean
   current-head Codex review and a green Codex Gate. Separate infrastructure rollout.
3. **`ibOrderID` is still not in the Flex query field list.** Three subsystems wait on it:
   `StockRealizedGrain` grain suppression, `SpreadEvidence` auto-linking, and the put scan's order
   identity. One IBKR-portal change. Until then each correctly refuses to act on ambiguous evidence.
4. **Durable stock-ledger coverage is partial.** It begins at its measured stored span
   (`2025-11-21`). Do **not** relabel it as complete TradeStation + IBKR lifetime history until the
   missing earlier broker rows are actually present.
5. **SOFI all-time −$12,646.22 vs the IBKR portion −$6,795.78** — a −$5,850.44 difference to be
   ATTRIBUTED to real stored historical rows by the audit. **Never closed with a manual offset.**
6. **`MIGRATION_30_31` is registered at exactly ONE of 17 `Room.databaseBuilder` call sites**
   (`di/AppModule.kt:61`). The other sixteen stop at `MIGRATION_29_30`, and `OptionsTrackerApp`'s
   builder is inside a swallowing `try`, so the failure would be silent. Found during S2.7 recon,
   deliberately **NOT fixed** — out of round scope and it touches the guard-protected
   `OptionsDatabase.kt`. **This is a live data-integrity hazard.**
7. **Does `AUTOMATION_PAT` have `issues:write`?** Checkout / push / PR creation are proven
   (run 35708535163 → PR #20). The original crash was on the ISSUE path. Untested.
8. 7 pre-existing pasted bidi/NBSP glyphs remain on untouched lines in `AddPositionScreen` (2),
   `CoveredPutDetailScreen`, `DashboardScreen`, `PortfolioBreakdownScreen`, `LeveragedUniverseTest` (2).
9. **FUTURE — Phase 3 personal historical BTC exit learning.** Not implemented, not trained: the
   historical ledger was being corrected in this very round and is not a clean training set yet.

---

## 13. The NEXT repository task is NOT this repo

**OPT → Trading Tracker, direct one-way lifecycle sync.** The finalized contract already exists in
`docs/OPT_TO_TRADING_TRACKER_CONTRACT.md`; nothing is implemented or activated.

Scope for the next round: OPEN / CLOSE / **ROLL as a factual close + a factual open tied by one
correlation id** / ASSIGNMENT / EXPIRY; a durable idempotent outbox; receiver ACK; retry when Trading
Tracker is unavailable; an OPT save is **never** blocked by the bridge; Trading Tracker displays
`OPT · ממתין לאישור IBKR`; the daily IBKR reconciliation remains broker authority in both apps; no
duplicates; differences are audited. The conditional daily ChatGPT report belongs to Trading Tracker
/ the relay, not to OPT, and no PAT or ChatGPT credential goes into any APK.

Two structural problems named in the doc must be solved first: `OptionsRepository` is not a choke
point (`AutoAssignCC`, `FlexSyncWorker`, `DraftUpdateWorker` write straight to `positionDao`), and
delete-and-reimport must not replay history.

The next manager session runs `clauto trading-tracker`.
