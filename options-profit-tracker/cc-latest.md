# OptionsProfitTracker — rolling handoff (Claude Code)

**Task:** S2.7 — BROKER-EXACT REALIZED P&L + ONE CANONICAL LEDGER + BROKER PROVENANCE + 0DTE +
PUT LIQUIDITY + MODEL BTC EXIT TARGET + MARKET-BRIEF FIXES
**Date:** 2026-09-22
**Branch:** `s2/ibkr-reconciliation-lifecycle-dashboard` — **PR #19 OPEN** (`needs-owner`,
`no-automerge`), **never merged**, nothing pushed to `main`.

---

## 1. Heads

| | SHA |
|---|---|
| S2.7 starting HEAD | `1a51e5e41a3e8a13a05d6833d862783243fa62cb` |
| recovered S2.6 follow-up | `ff2b41f` (see §2) |
| **Final HEAD** | `a6e18376fad85e85a57da2fabdf5959be9c76cab` |
| merge-base with `origin/main` | `7225b7af16c183de00a9f064ead03a01ad6af1d3` |

`a6e1837` = 56 files, +8,536 / −348.

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

**It also shipped three failing tests and three pasted bidi glyphs**, all found and fixed in S2.7 —
see §9. Lesson recorded in `gotchas.md`: *work that was never run is not work that was verified.*

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

App before: BTCI −2,210.42, SPCH −2,412.39, NOK −3,570.42, SOFI −4,070.90 (= −12,264.13).

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

The recon said a ledger was impossible without one, because `syncSource` is INGESTION provenance
(`doImport` writes `IMPORTED` for a TradeStation CSV *and* an IBKR Flex payload; only 7 hardcoded seed
rows carry `TRADESTATION`) and **no broker account / order / execution id is persisted anywhere**.

That verdict is wrong once the owner's own rule is used: **broker provenance is a DATE boundary** —
TradeStation through 2025-10-17, IBKR from 2025-10-18 — so `RealizedLedger.brokerOf(date)` derives it.
Closed `positions` rows are already durable. Only the STOCK half was volatile, and it uses the
standalone-prefs shape approved twice before (`BrokerCashFlowStore`, `BrokerBasisStore`).

`StockRealizedLedgerStore` = one key per realized stock row,
`<TICKER>|<day>|<S|B>|<qty>|<price>|<ordinal>`. Merge is SCOPED to the `(ticker, day)` pairs the
payload describes. Amounts stored RAW, rounded ONCE per ticker-month.

**What it cannot claim, and says so:** it starts EMPTY and accumulates from this build onward. It
cannot recover a month no payload ever reported. `coverage()` reports the real row count and day span.

### TASK A — two REAL defects found, beyond the semantic flip

1. `PositionSummary.profitPercentOnPosition` and `annualizedReturn` took their numerator from
   `ProfitCalculator` **even on a reconciled row**, while `realizedPnL` on the SAME summary took the
   broker's. One row could print IBKR's P&L beside a percentage from a different number. Fixed at the
   unprotected `ReportGenerator` call site; `ProfitCalculator` untouched.
2. `DashboardViewModel.optionsRealized` did `total += pnl` **before** `closeDate ?: continue`, so a
   row with no close date counted in the all-time total and in NO month. The total and the sum of its
   own buckets disagreed permanently.

Plus: **three YTD windows** with three different null-`closeDate` fallbacks (two `openDate`, one
`expiration_date`) and two interval kinds, converged on `closeDate ?: expirationDate`.

### TASK F — the objective, stated exactly

`expected realized P&L / expected collateral-day`, over the COMPLETE policy — hit paths AND
carry-to-expiry AND assignment AND loss. Deterministic CRR lattice, no drift (p = 0.5), values from
`calculateForYears`. **`StrategicRiskAnalyzer` untouched; no second probability model.**
Refuses rather than guessing; **never falls back to 80**.

A real modelling gap the tests exposed: a target the contract ALREADY meets exits at t = 0, so
expected holding time is zero and the objective divides by zero — or, handled naively as 0.0, ranks
the best available outcome LAST. Holding time is now floored at ONE LATTICE STEP.

---

## 5. Verification

| | |
|---|---|
| `:app:compileDebugKotlin` | **BUILD SUCCESSFUL**, `grep "^e: "` EMPTY |
| JVM tests | **1384 tests, 0 failures, 0 errors, 1 skipped, 65 classes** (1133 at S2.6) |
| `git diff --check` | clean |
| pasted bidi/NBSP glyphs in the diff | 0 (3 found and converted to escapes) |
| health scripts | `node --test .github/scripts/health/__tests__` → **75/75 pass** |

---

## 6. NOT DONE — device QA. ADB was down for the whole round.

`adb devices` → `cannot connect to daemon at tcp:127.0.0.1:5037` from first check to last. Per the
isolation rules an ADB server must never be started from inside PRoot, so **no device QA was
performed**: no Sep 1–18 parity check, no per-ticker check, no idempotency run on real data, no
market-brief inspection, no put-liquidity inspection, no 0DTE observation, no APK install.

**Every acceptance figure in §3 is therefore UNVERIFIED ON THE DEVICE.** The mechanism is in place and
unit-tested; the numbers have not been read off the owner's screen.

---

## 7. NOT PROVEN — Yahoo returned HTTP 429 to this host

A live check of the keyless v7 chain 429'd on **both** the crumb handshake and the chain, so it is
**unverified whether the payload carries per-contract `volume` / `openInterest`**. Task E therefore
treats absent as **UNPROVEN ⇒ EXCLUDED**, never guessed — the owner's own rule. The `PUT_CHAIN` log
line prints how many rows arrived with each field; that is the evidence that settles it on the device.

**Consequence to watch:** if Yahoo does not supply those fields, the put list will be EMPTY and the
card will say `לא ניתן להוכיח ווליום פוטים מספיק לטיקרים שנסרקו`. That is correct behaviour, not a bug.

---

## 8. CI / process state

- **`AUTOMATION_PAT` was renewed by the owner mid-round and WORKS.** Dispatched
  `sync-automation-core` → run **35708535163 SUCCESS** (first after consecutive daily failures) →
  opened **PR #20 `chore/sync-automation-core`**, which carries **`claude-fallback-review.yml`
  (+402, new)** plus updates to `claude-fallback-watchdog`, `codex-gate`, `merge-bot`, `ci-doctor`.
  **PR #20 is OPEN and NOT merged.**
- **What is proven is checkout + push + PR creation.** The original crash was
  `createLabel ... Bad credentials` on the ISSUE path, which needs `issues:write` — a different scope
  on a fine-grained PAT. **NOT tested**, deliberately: `main` still runs the PRE-S2.6 inline workflow
  that treats Yahoo's 429 as a real failure, so a dispatch would likely open a SPURIOUS Issue.
- **The S2.6 health check has never actually protected the repo.** `main` has **no
  `.github/scripts/`** at all. Every scheduled run uses the old workflow; run **35620163427**
  (2026-09-21) shows 429 ×3 → `fail-http` → `Bad credentials` → crash. It starts protecting only when
  PR #19 merges.
- PR #19 on `a6e1837`: `scripts-test` **pass**, `build-gate` **pending at handoff**, `codex-gate`
  **fail-closed pending** (`Codex has not reviewed head a6e1837`) — the expected state right after a
  push, not a review verdict.
- A CLAUDE.md claim about `buildResultFrom` ("job succeeded + empty output ⇒ plumbing failure") does
  **not** match `classify.js`, which returns `OK`, with `classify.test.js` pinning it deliberately.
  **The doc was corrected to the code.**

---

## 9. Defects inherited from the untested S2.6 follow-up, fixed here

1. `MarketEvidenceTest.theSixHourWindowIsAnchoredOnTheClustersFirstItem` looked the merged row up by
   the ANCHOR's timestamp. `reduce` keeps the cluster WINNER's (lowest tier, then newest), so the
   lookup threw. The real claim — which tickers merge — is now what is asserted.
2. `MarketBriefEvidenceTest.passingNoNewSources…` asserted ONE `MARKET_NEWS` row for a fixture whose
   headline names a MOVER. Rung 1 SPENDS it as that ticker's explanation, so a news row would violate
   the S2.3 "one item, one row" rule. **Proven with a temporary in-tree probe**, not deduced; the
   probe was deleted. The assertion now pins the CONTEXT row and `0` news rows.
3. Three pasted `U+2066`/`U+2069` glyphs in `HighIvScreen`'s new liquidity subtitle → escapes.

Also reverted: a Task C agent had added an unrequested suppression (drop a TICKER news item whenever
any of its tickers already had a CONTEXT row) that is strictly broader than `spentEvidence` and
silently removed real news rows.

---

## 10. Open items for the owner

1. **Device QA — everything in §6.**
2. **PR #20** — merging it is the owner's call; it brings the canonical Claude review fallback.
3. **Does the PAT have `issues:write`?** Untested (§8).
4. **`ibOrderID` is still not in the Flex query field list.** Three subsystems wait on it:
   `StockRealizedGrain` suppression, `SpreadEvidence` auto-linking, and now the put scan's order
   identity. One IBKR-portal change.
5. **`MIGRATION_30_31` is registered at exactly ONE of 17 `Room.databaseBuilder` call sites**
   (`di/AppModule.kt:61`). The other sixteen stop at `MIGRATION_29_30`, and
   `OptionsTrackerApp`'s is inside a swallowing `try`. Found during recon, **NOT fixed** — out of
   round scope and it touches a guard-protected file. This is a live data-integrity hazard.
6. 7 pre-existing pasted bidi/NBSP glyphs remain on untouched lines in `AddPositionScreen` (2),
   `CoveredPutDetailScreen`, `DashboardScreen`, `PortfolioBreakdownScreen`, `LeveragedUniverseTest` (2).
7. **SOFI all-time −$12,646.22 vs the IBKR portion −$6,795.78** — a −$5,850.44 difference to be
   attributed to historical rows by the audit, **never closed with a manual offset**.
