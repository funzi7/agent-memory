# OptionsProfitTracker — Current Session Snapshot (handover for a new chat)

_Last updated: 2026-06-21. Latest origin/main HEAD at write time: `24c50b6`. Read this top-to-bottom, then `state.md` (chronological log), `gotchas.md`, `roadmap.md`, `pending-tests.md`, and `parallel-agents.md`._

---

## 1) PROJECT
- **App**: OptionsProfitTracker, package `com.dima.optionstracker`. Android, **Kotlin / Jetpack Compose / Hilt / Room / WorkManager**. Hebrew **RTL** app, dark theme. Tracks options (CSP, CC, spreads, long put/call, iron condor, straddle, strangle) + stock, syncs with IBKR via the Flex Query API.
- **Two clones, both push `origin/main`:**
  - `OptionsProfitTracker_git` → **CLAUDE_CODE** (runs in the Android Studio terminal).
  - `OptionsProfitTracker_codex` → **CODEX**.
- **agent-memory** repo (this repo) is the shared source of truth: `options-profit-tracker/state.md` (dated log), `gotchas.md` (hard-won lessons), `roadmap.md` (backlog), `in-progress.md` (live file-ownership locks), `pending-tests.md` (device tests to run), `parallel-agents.md` (the protocol), and THIS `current-session.md`.

## 2) PARALLEL-AGENT WORKFLOW (the key process)
Two agents run **simultaneously** per round, each given a **non-overlapping file set** with explicit **ALLOWED**/**FORBIDDEN** lists. Per-round protocol (in `parallel-agents.md`):
1. `git fetch` + `git pull --rebase origin main` (STOP if uncommitted).
2. Read `state.md`, `gotchas.md`, `roadmap.md`, **and `in-progress.md`** first.
3. Touch ONLY allowed files. If a file you need is owned by the other agent in `in-progress.md`, **STOP** and report.
4. **APPEND an ownership line to `in-progress.md` and push it BEFORE editing code** (e.g. `CLAUDE_CODE OWNS: X.kt, Y.kt — <task> — <timestamp>`).
5. **Build ONLY in your own clone.**
6. Push OPT, then update agent-memory: `pull --rebase` right before push; if push rejected, `pull --rebase` and retry. Finally **REMOVE your in-progress line** and push.
7. **Shared files** (`Screen.kt`, `MainActivity`, `AppModule`, `ReportGenerator`, DB schema) — only ONE agent may own them in a given round, and only if `in-progress.md` shows the other agent is not in them.
- The human owner hands each agent its prompt; agents run autonomously (`claude` / `codex --yolo`).
- **Build gate** (run in your own clone): `./gradlew :app:compileDebugKotlin 2>&1 | tee /tmp/optbuild.log`. PASS only if `grep "^e: " /tmp/optbuild.log` is EMPTY **and** the log contains `BUILD SUCCESSFUL`. Never commit a red build. (For an installable APK run `./gradlew clean assembleDebug` once at the very end.)
- **Email privacy**: commits must use the funzi7 noreply identity or GitHub rejects the push (GH007). Use `funzi7 <207505227+funzi7@users.noreply.github.com>` for every commit. NOTE: a `git pull --rebase` AFTER committing rewrites the committer back to the local git config — set `GIT_AUTHOR_*`/`GIT_COMMITTER_*` env vars (name + email) so the rebase keeps funzi7, or amend right before pushing.

## 3) SHORT-STOCK FEATURE — FINAL STATE (arc GD1→GK + Codex follow-ups)
A long arc made short stock positions first-class. Final behavior:
- **`parseStockPositions` returns SIGNED quantity** (no `abs()`); a short is negative shares.
- **Snapshot stores negative shares** with a **flip-aware merge** (a sign change always wins; otherwise the larger `|qty|` wins). Background sync (`FlexSyncWorker`) mirrors the same merge so shorts persist without a manual import.
- **avgCost OVERWRITE for shorts**: when post-merge snapshot shares < 0, the snapshot `avgCost` is overwritten with the Flex `costBasisPrice` (the short ENTRY, ≈ 714.78 for MULL) instead of the stale long basis. Logged as `SHORT_AVGCOST`. (Longs keep "never overwrite".)
- **Short value = `(avgCost − current) * |shares|` = INVERTED unrealized P&L** (green when price < entry). NOT `shares*price` (that would double-count the cash proceeds already sitting in the account).
- **Sub-100 short** shows in **"לא נכלל"** (not the main "מניות בתיק" list, which is 100+ only) but **keeps its inverted-P&L value** (not 0). A short with no valid avgCost stays excluded/unvalued (logs `SHORT_VALUE`), never guessing a basis.
- **`openPositionsCount`** includes distinct open short-stock tickers (shares < 0 with a valid avgCost, not already an open-option ticker).
- **`STOCK_SHORT_OPENED` event** (assignment that flips long→short, oci has BOTH 'C' and 'O'): emits TWO feed events — a `STOCK_SOLD` for the CLOSED portion (realized = fifoPnlRealized) AND a `STOCK_SHORT_OPENED` for the short-open leg (`amount = null`, realized 0). For MULL: 46 closed + 54 short-open = 100. The short-open **proceeds are shown INFORMATIONALLY** in the description, computed from `rawFlexXml` `costBasisPrice` (`svc.parseOpenPositions`, key = underlyingSymbol ?: symbol.first(), NOT uppercased) — the snapshot avgCost is still null when `importStockSoldEvents` runs. The description runs are **bidi-isolated** (FSI/PDI) so the mixed Hebrew/LTR text renders in logical order. `amount = null` → never in any realized total.
- **Tapping a `STOCK_SHORT_OPENED` feed row → `ShortPositionDetailScreen`** (nav route `short_detail/{ticker}`). It reads the short LIVE from the snapshot via `DashboardViewModel.shortHoldingFor(ticker): Flow<ShortHoldingInfo?>` and shows: ticker, `-<qty> שורט`, מחיר כניסה (avgCost ≈ 714.78, NOT the trade price 690), שווי כניסה/התקבל (`|qty|×avgCost`), מחיר נוכחי, and רווח/הפסד לא ממומש `= (avgCost−current)×|qty|` colored green/red (inverted). (Replaced an earlier GL3 AlertDialog that parsed a wrong ~690 entry from the trade price.)
- **MULL worked example**: a CC at strike 690 was assigned → 46 shares closed (≈ **+$12,222 realized**), 54 shares short-opened @ **714.78** (entry = 690 strike + $24.78 premium). Proceeds **$38,598** (cash IN; the short liability equals it → net 0 at open). At price ≈ 972 the short shows ≈ **−$13,897** unrealized. **MULL total stock realized ≈ $24,736.**

## 4) STOCK-REALIZED SHOWN EVERYWHERE (consistent across 4 surfaces)
Per-month stock-sale realized P&L is surfaced in **four** places, all reading the SAME source — `stockRealizedByTicker` prefs → `StockRealizedData.totalForMonth("YYYY-MM")` (captured by `captureStockRealized`, keyed by IBKR tradeDate / ET):
1. **"רווח/הפסד מניות" screen** — per-ticker rows with per-sale drill-down (tap to expand individual `STOCK_SOLD` sales), month chips, sortable column-aligned header, feed-tap deep-link + highlight + scroll.
2. **Monthly-target card ("יעד חודשי")** — a `"ממומש מניות"` subline beneath the options "ממומש החודש" figure, plus a bold `"סה\"כ החודש"` combined line = options realized + stock realized. Shown only when stock ≠ 0.
3. **Calendar ("לוח שנה")** — under the month-totals row, `"ממומש מניות (חודש): ±$X"` + `"סה\"כ החודש (כולל מניות): ±$Y"` (Y = options monthlyRealized + stock); follows the displayed month.
4. **Reports ("דוחות")** — monthly + yearly/all-years stock realized and combined options+stock totals (CODEX; reads the same `DashboardViewModel.stockRealized`, logs `REPORTS_STOCK`).
- **June example, consistent across all four**: stock realized **$16,500.07**, options **−$1,364.49**, combined **$15,135.58**.
- **No double-count**: options figures (`combinedTotalRealized`, `CalendarViewModel.monthlyRealized`/`allTimeRealized`, reports) are OPTIONS-ONLY (closed positions, `ibkrRealizedPnl ?: ProfitCalculator.realizedPnL`). Stock is purely additive.

## 5) OTHER RECENT FIXES (final state)
- **Feed-tap deep-link to stock-realized**: tapping a `STOCK_SOLD` row scrolls the exact ticker's row into view in `StockRealizedScreen`. Working approach = **discrete LazyColumn items** (header card idx 0, sort header idx 1, `itemsIndexed` rows idx 2+) + `animateScrollToItem(2 + indexOfTicker)`, with the index computed in a SEPARATE effect keyed on the FRESH month-filtered rows (computing it in the same effect that sets the month read the STALE list → idx −1). Earlier `positionInRoot` / `BringIntoViewRequester` offset-math FAILED (single-item table / tableTopY 0f at effect time).
- **Assignment records open their EXISTING position page** (ticker fallback only if truly gone): feed onClick resolution order = (1) stored `positionId` valid (>0 AND in `existingPositionIds`) → its position page; (2) null/0/stale id on a lifecycle event → resolve via `positionIdByTicker[ticker.uppercase()]` (VM `StateFlow<Map<String,Long>>` = `getAllPositions()` filtered `status!=DRAFT`, groupBy ticker, value = max-id) → open that position; (3) no position for the ticker → `onNavigateToTickerDetail` (never a dead "פוזיציה לא נמצאה"). Drafts/targets keep edit-nav. Both feed surfaces (DashboardActivityRow + ActivityFeedScreen.ActivityEventCard). Log `FEED_CLICK "ASTX-case ... resolved=.."`.
- **Ghost CC reminder filter** (CODEX): CC-reminder holding evidence accepted ONLY from a current snapshot/manual override or a genuinely live OPEN position; closed/assigned rows, positions past the 16:00 ET expiry boundary, assignment-history-alone, and snapshots predating the latest CC close are all rejected. Logs `CC_REMINDER_FILTER` for every include/exclude.
- **Calendar stable layout**: fixed **6-row** grid (empty same-size trailing cells; out-of-range cell = `Box(Modifier.weight(1f).aspectRatio(0.85f))`, not a zero-height Spacer); per-week "שבוע" total row always composed + `alpha`-reserved; **fixed-height summary card** (stock/combined lines always composed, `alpha 0` when zero, `maxLines=1, softWrap=false` so a big value can't wrap to a 2nd line); **fixed-width month-title Box (140.dp, centered, maxLines=1)** with the **"היום" chip slot always reserved** (`enabled=!isCurrentMonth` + `alpha`) so the arrows + chip never reflow with month-name length. The "היום" chip sits beside the name on its (visual RTL) left and reuses `CalendarViewModel.goToCurrentMonth()`.
- **IV/buffer-aware `StrategicRiskAnalyzer` + consistent intel** (CODEX): shared `assessPutBuffer` — `expectedMovePct = IV*sqrt(max(DTE,1)/365)*100`, probability bands plus an 8% / 1.5×-expected-move floor before calling a strike "far"; thin/elevated short-PUT bands cap the strategic score at caution-or-worse and the intel warns instead of "supports holding". Logs `RISK_DBG`. (This resolved the earlier "~$1 OTM + 122% IV reads as 'strike far' / 'supports holding'" sanity bug — now CLOSED.)

## 6) OPEN TODOs (carry forward)
- **(a) Alerts not firing during pre-market** despite several tickers moving sharply — INVESTIGATE the alert trigger/scheduling (AlertWorker, 15-min periodic; pre-market thresholds).
- **(b) Expiry banner undercounts** — shows only 1 expiring position when 4 are actually expiring; fix the banner's count/source.
- **(c) `CC_REMINDER_FILTER` log noise** — prints `Log.d` for many long-gone tickers; they're CORRECTLY excluded (behavior is right), it's only log spam. Optionally quiet it.
- **(d) Cosmetic** — the short-open row proceeds wording could read **"התקבל בפתיחה"** for clarity.
- **(e) Tables-UX** — persist the last-used sort across ALL table screens (PortfolioBreakdown persists via VM; StockRealized sort is in-memory only). Candidates: PositionsList, PortfolioBreakdown, StockRealized, Collateral, Reports tables, TaxReport.
- **(f) GF3 multi-flip-trade count-attribution edge** — a theoretical edge in splitting a multi-flip assignment's share counts; not observed in practice.

## 7) IBKR NOTE
"**statement could not be generated this time**" was an **IBKR Flex server-side error (intermittent)**, NOT an app bug — retry later. Consider showing a friendlier in-app message that distinguishes an IBKR server hiccup from a real import failure.

## 8) IRON RULES
- **Hebrew written naturally** — no `div dir=rtl`; never embed Latin letters INSIDE a Hebrew word.
- **Numbers / Latin runs / dates wrapped LTR / bidi-safe** in the RTL UI — use the shared `LtrText` composable or `CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr)`; signs go on the LEFT of the number; `maxLines = 1, softWrap = false` so numbers never wrap/reverse (e.g. `50-2026`).
- **Do NOT touch** `ProfitCalculator` / IV (Black-Scholes) math / Room DB schema & migrations / realized-P&L formulas / `AppPreferences` / `AvgCostResolver` **without explicit human OK** (they are the financial / data-integrity core and are guarded). If a fix needs one of them, open a PR and escalate (`needs-dima`).
- **Device tests** are written in **English** with the Hebrew on-screen area names quoted, and are listed only **AFTER a summary is brought** (appended to `pending-tests.md`).
- **Claude Code prompts** are **plain text in a code block** — never artifacts.
- **Delete & sync** must use `deleteImportedNonDraftPositions()` (never `deleteAllPositions()`); never wipe the stock snapshot on resync (manual/enriched data must survive).
