# cc-latest.md — OptionsProfitTracker handoff (latest)

> Rolling single-file handoff. Every future prompt OVERWRITES this file with a fresh, complete summary of the just-finished task and then prints its commit SHA. Read this first for the newest context, then `state.md` (full commit chain), `pending-tests.md` (device-test checklists), and `roadmap.md` (backlog + owner rules).

## Latest task: D1 — Diagnostic ONLY (2026-07-05, Claude Code)
READ-ONLY on `funzi7/OptionsProfitTracker` (zero code changes). Docs written to `funzi7/agent-memory` only. **OPT HEAD inspected: `ac3f4e8`** (main; "fix: covered put probability row and feed bidi base"). Purpose: report exact facts on (A) the three yield/probability calcs in the new-position screen and (B) the Covered Put assignment money path. NO fixes performed. The owner ruling at the bottom is the approved direction for a LATER fix.

---

## PART A — new-position screen yield / probability / premium-range calcs

### A1. Yield-tier banner — CONFIRMED strategy-blind (uses strike for every strategy)
- **File+line:** `ui/screens/addposition/AddPositionScreen.kt` **lines 828–869** (formula 836–837; tiers 840–844; render 854–859).
- **Exact formula:**
  - `yieldPct = premVal / strikeVal * 100.0`  (premVal = `state.premiumPerContract`, strikeVal = `state.strikePrice`)
  - `annualized = yieldPct * (365.0 / dte)`  (dte = ChronoUnit.DAYS between today and `state.expirationDate`)
- **Tiers (annualized):** ≥40 מעולה · ≥25 טוב · ≥15 סביר · ≥8 נמוך · else חלש.
- **Strategy-blind: YES.** It reads only `state.premiumPerContract` and `state.strikePrice`; there is **no** branch on `strategyType` / CC vs CSP. The base denominator is always the **strike**. For a Covered Call the capital base is the **stock cost basis**, not the strike, so a CC yield is understated.
- **Owner symptom reproduced with the code:** CC premium 0.54, strike 50, cost basis 24.28, DTE 31 → `yieldPct = 0.54/50*100 = 1.08%`, `annualized = 1.08*365/31 = 12.71%` → "⚠️ נמוך: 1.08% (שנתי 12.7%)". Correct on cost basis: `0.54/24.28*100 = 2.22%`, annualized ≈ 25–26% — which is what the מודיעין card shows (it reads `m.absoluteRoR`/`m.annualizedRoR` from `StrategicRiskAnalyzer` metrics, which ARE cost-basis-aware — see the contrast with A3). The two readouts on the SAME screen therefore disagree.

### A2. Assignment-probability routing + estimateAssignmentProb — CONFIRMED put-math applied to CALL legs
- **File:** `domain/calculator/StrategicRiskAnalyzer.kt`.
- **(i) Routing in `calculateMetrics` (lines 327–339):**
  - `putBufferAssessment` is computed **only when `ctx.optionType == OptionType.PUT`** (line 327), else `null`.
  - `probAssignment` = `putBufferAssessment.assignmentProbability` when non-null (PUT path); **else** (i.e. every CALL, when iv/price/dte valid) → `estimateAssignmentProb(currentStockPrice, strike, iv, dte)` (line 335); else default `30.0`.
  - Net: **CALL legs always fall through to `estimateAssignmentProb`.**
- **(ii) `estimateAssignmentProb` FULL body (lines 378–387):**
  ```
  val t = dte / 365.0
  val sigma = iv * sqrt(t)
  if (sigma <= 0) return 30.0
  val d = ln(stockPrice / strike) / sigma
  val probITM = normalCDF(-d) * 100   // comment: "Probability stock goes below strike for PUT"
  return probITM.coerceIn(1.0, 99.0)
  ```
  It computes **P(price < strike) unconditionally** — correct for a PUT, **backwards for a CALL** (a short CALL is assigned when price > strike ≈ `normalCDF(d)`). No `optionType` branch inside.
- **Owner symptom reproduced:** CALL strike 50 on a 20.68 stock → `d = ln(20.68/50)/σ` is large-negative → `normalCDF(-d) ≈ 0.96` → **"הקצאה 96%"**. True call-assignment prob ≈ 4%.
- **Where it surfaces:** `AddPositionScreen.kt:634` prints `הקצאה ${m.probAssignment}%` in the מודיעין supporting line; also used in `evaluateStrategy` scoring (StrategicRiskAnalyzer lines 172–176) and `buildStrategicContext` (line 461–462).

### A3. Premium-range thresholds — base is `capitalAtRisk` (strategy-AWARE), NOT raw strike
- **File+line:** `ui/screens/addposition/AddPositionViewModel.kt` **lines 1387–1397** (`fun premForTarget`), stored into state at 1424–1426.
- **Formula:** for `targetAnnual` ∈ {12.0 (min), 18.0 (medium), 25.0 (excellent)}:
  - `targetReturnPerTrade = targetAnnual * dte / 365.0`
  - `totalMinPremium = capitalAtRisk * targetReturnPerTrade / 100.0`
  - returns per-share: `totalMinPremium / (contracts * 100)`
  - Guarded: returns `null` if `capitalAtRisk <= 0 || dte <= 0`.
- **Base = `ProfitCalculator.capitalAtRisk(entity)` (ProfitCalculator.kt lines 384–~430), which IS strategy-specific:**
  - `COVERED_CALL` → **stock cost basis** = `(stockPurchasePrice ?: strike) * (sharesHeld ?: contracts*100)` (falls back to strike only if no cost basis).
  - `CASH_SECURED_PUT` / `COVERED_PUT` / `WHEEL` → `strike * contracts * 100`.
  - `LONG_PUT` / `LONG_CALL` → premium paid (abs totalPremium).
  - `BULL_PUT_SPREAD` / `BEAR_CALL_SPREAD` / `IRON_CONDOR` → width-based collateral − premium.
- **Key contrast:** A3 correctly bases a CC on its cost basis; **A1 does not** (A1 divides by strike). That is exactly why the A1 banner and the cost-basis-aware readouts disagree for CCs.

---

## PART B — Covered Put assignment money path (current code, ac3f4e8)

### B1. Where COVERED_PUT assignment realizes the option premium as income
- **File+line:** `domain/calculator/ProfitCalculator.realizedPnL`, **ASSIGNED branch lines 141–164**, specifically the `isCoveredPut` sub-branch **lines 148–155**:
  - `isCoveredPut = position.strategyType == StrategyType.COVERED_PUT` (line 143).
  - `grossPnl = totalPremium(position)` (line 154) — the option premium is realized as income (design 8d8907b: "realizes premium, NOT the CSP $0 fold").
  - Commission guard **lines 200–204**: COVERED_PUT is **explicitly excluded** from `isAssignedCspNoSale` (line 202–203: `position.strategyType != StrategyType.COVERED_PUT`), so line 204 yields `calcPnl = grossPnl − totalCommission`.
  - For MULL: `totalPremium` = premiumPerContract × contracts × 100 = **1,820.00**; minus commission (open+close ≈ 3.84) → **≈ 1,816.16**.
- **Is it PERSISTED? NO — it is COMPUTED on read.** `PositionEntity` has **no** realized-P&L column; the only stored realized field is `ibkr_realized_pnl` (`ibkrRealizedPnl`, fifoPnlRealized from IBKR Flex import). The MULL CP is a **manual** record (owner-entered short stock + short put), so `ibkrRealizedPnl` is null and the 1,816.16 is produced live by `realizedPnL` every read. The persisted **inputs** that produce it: `premiumPerContract`, `numContracts`, `commission`, `closeCommission`, `strategyType = COVERED_PUT`, `closeMethod = ASSIGNED`/`ASSIGNED_EARLY`, `direction = SELL`, `optionType = PUT`.
- `CoveredPutCalculator.AssignmentResult` (premiumRealized/combinedRealized, ~lines 168–186) is a pure in-memory calc struct — it is **not** persisted and is used by the detail screen, not by the calendar/reports totals.

### B2. Where calendar day-cells / monthly-target / reports read that realized value
All read the SAME hybrid `pos.ibkrRealizedPnl ?: ProfitCalculator.realizedPnL(pos)` — so a manual CP contributes its computed 1,816.16:
- **Calendar day-cells:** `CalendarViewModel.calendarDays` → `ReportGenerator.getCalendarData(month)` (ReportGenerator.kt lines 1153–…), which combines `repository.getClosedPositionsForMonth(yearMonth)` (DAO query by `closeDate` range, repository.kt 49–52) and sums per position `it.ibkrRealizedPnl ?: realizedPnL(it)` (e.g. line 1166). A CP with `closeDate` in July lands in July.
- **Monthly-target / "ממומש החודש":**
  - `CalendarViewModel.monthlyRealized` (CalendarViewModel.kt 66–74): `getClosedPositionsForMonth(month)` → `sumOf { ibkrRealizedPnl ?: realizedPnL }`.
  - `DashboardViewModel.optionsRealized` (DashboardViewModel.kt 237–251): `repository.getClosedPositions()` → bucket by `closeDate` YYYY-MM, `pnl = ibkrRealizedPnl ?: realizedPnL`.
  - Dashboard MTD diagnostic (DashboardViewModel 714–718) and `ReportGenerator.getMonthlyReport` (236–245) use the same hybrid.
- **Reports:** `ReportGenerator` monthly/annual (lines 236–245, 411–429), `TaxReportScreen.kt:175` — all `ibkrRealizedPnl ?: realizedPnL`.
- `CalendarViewModel.allTimeRealized` (58–63) likewise.

### B3. The close-edit screen renders the CSP-style "$0 — premium in cost basis" box for the SAME CP (contradiction)
- **File:** `ui/screens/addposition/ClosePositionScreen.kt`.
  - Assignment summary card gate **line 1254**: `isCSP = position.optionType == OptionType.PUT && position.direction == Direction.SELL` — a Covered Put (short PUT) satisfies this, so it renders the **"CSP Assignment — מניות נרכשו"** title (line 1255, wrong wording for a buy-to-cover) and the **"Option P&L:" $0** line with the "premium folds into cost basis" footnote (lines 1362–…, from the FR2/FO CSP treatment).
  - `calculatePnL` **lines 443–449**: `isAssignedCspNoSale = isAssigned && optionType == PUT && !(soldStock && stockSoldPrice…)` has **NO `strategyType != COVERED_PUT` exclusion** (unlike the central calc). So a CP assignment with no stock sale → `calculated = 0.0`, and the feed `amount = closePnl = calculatedPnL` (line 564, 611/622) is stored as **0.0**.
- **Net contradiction:** the close-edit screen (and any feed row it wrote) shows the MULL CP assignment as **$0**, while `realizedPnL` / calendar / monthly-target / reports show **+1,816.16**. The two screens disagree today.

### B4. What a corrective change would need to touch to re-realize MULL CP from 1,816.16 → 0 (NOT performed)
- **Primary (calc):** because realized is COMPUTED (not stored) for the manual MULL record, changing the calc fixes ALL reads retroactively with **no data migration and no entity-row edit**:
  1. `ProfitCalculator.realizedPnL` COVERED_PUT sub-branch (lines 148–155) → behave like CSP: option realizes **$0** (premium folds into the effective cover price), not `totalPremium`.
  2. Commission guard (lines 200–204) → **remove** the `strategyType != COVERED_PUT` exclusion so a no-sale CP assignment zeroes out (premium AND commission fold into the cover basis) — i.e. let COVERED_PUT fall into `isAssignedCspNoSale`.
  This alone drops July realized by 1,816.16 across calendar, monthly-target, and reports (they all recompute via `realizedPnL`).
- **Verify on device before/after (data that could hold a stale figure a calc change won't touch):**
  - **`ibkrRealizedPnl` on the MULL CP row** — must be `null` for the calc change to take effect. If a value was ever persisted there, that row's `ibkr_realized_pnl` must be nulled/zeroed (only place a stored number would override the calc).
  - **Feed `ActivityEventEntity.amount`** for the assignment — a persisted per-row number. The close-screen path already stores `0.0` (B3), but if any other path recorded the assignment with `amount = premium`, that feed row's `amount` needs correcting.
- **Consistency note:** the close-edit screen (B3) already shows $0 for the CP, so the ruling makes the reports MATCH that screen (and matches the CoveredPutCalculator effective-cover-price 23.60, which already folds the premium in).
- **Do NOT** also add the short-stock realized gain onto the option side — that gain is tracked separately via the short-stock snapshot / StockRealized (existing gotcha), so folding premium into cover price + $0 option is the complete change.

---

## OWNER RULING (verbatim — approved direction for a later fix)
> Covered Put assignment must behave like CSP — option P&L $0, premium folded into the effective cover price (23.60), NOT counted as option income in the calendar or the monthly target. The existing MULL CP record must be corrected accordingly (July realized drops by 1,816.16). Rationale: matches IBKR reporting, and prevents double-counting once buy-to-cover import (roadmap gap) lands, since IBKR books the cover at the premium-adjusted price.

This REVERSES the 8d8907b design decision (which realized the premium as option income). The reversal is owner-approved; a future coordinator implements it (it touches `ProfitCalculator.realizedPnL`, a `.claude-guard.json` P&L-locked file → requires the explicit-approval / `needs-dima` PR path).

---

## Two CONFIRMED bugs to fix later (also in roadmap "2026-07-05 D1 findings")
1. **Strategy-blind yield banner** — `AddPositionScreen.kt:828–869`; divide by cost basis for CC (reuse `capitalAtRisk` / `StrategicRiskAnalyzer` metrics like A3 does) instead of raw strike.
2. **Put assignment-probability on CALL legs** — `StrategicRiskAnalyzer.kt:327–339` (routing) + `estimateAssignmentProb` `378–387`; for a short CALL, assignment prob = P(price > strike) ≈ `normalCDF(d)`, not `normalCDF(-d)`.

## Pointers
- `options-profit-tracker/state.md` — full dated commit chain / current state.
- `options-profit-tracker/pending-tests.md` — device-test checklists (owner rule: no regression tests).
- `options-profit-tracker/roadmap.md` — backlog + owner rules + the new D1 findings section.
- `options-profit-tracker/gotchas.md` — hard-won lessons (Covered Put accounting pitfalls: 2026-06-29 block).
