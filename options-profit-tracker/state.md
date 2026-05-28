# OptionsProfitTracker — State

> Living document. Update at the end of every working session.
> Last updated: 2026-05-28 (post commit `ec0a56e`)

## Current focus

Stabilization rounds A → R2 prime are all merged (latest OPT commit `ec0a56e`). Pattern to keep: every fix carries a verification log tag that must appear in logcat before it's declared done — "done in code" has bitten us before (CLAUDE.md "already correct" rule).

Next up: **Group S prime** (watchlist add-button + ±3% alerts + auto-update available capital from IBKR sync — see "In-progress feature plan" below). Two device-verification items still pending (pre/post-market price + abnormal-alert percent — see "Awaiting" section). Current backlog + verified-fixed list are below.

## Repo + state

- **Repo:** funzi7/OptionsProfitTracker
- **DB version:** 30 (planned bump to 31 in FIX 1/F for `initial_implied_volatility` column)
- **Branch (current work):** `main`
- **Last commit:** `ec0a56e` (Group R2 prime — PremiumIncomeScreen weekly day-table column clarity: renamed/recolored headers "נאספו"(blue)/"מומשו"(green), matched data weights to header, collected/realized week totals split right/left)
- **Recent commits:** `8a44bd4` → `9ddca1c` (Group A) → `f1c3e9a` (Group B) → `16fd852` (Group C) → `fdc1cf1` (Group D prime) → `7df9465` (Group E prime) → `589b44e` (Group F prime) → `646a1e0` (Group G prime) → `be9a23e` (Group H prime) → `996ffe6` (Group I prime) → `9f79c9f` (Group J prime) → `75722b0` (Group K prime) → `6684fa4` (L' step 1 diag) → `3da5058` (Group L prime) → `91fa735` (Group M prime) → `8bd1aea` (Group N prime) → `3e477be` (Group P prime) → `d8ba47f` (Group Q prime) → `ac6bbd6` (Group R prime) → `ec0a56e` (Group R2 prime)
- **Agent-memory last commit:** `ad5cf15`+ (this state.md repo, funzi7/agent-memory)

## Active issues

### Group A (FIX 4) - COMPLETE
A1 strategy sort, A2/A3 source column click+shorten, A4/A5 image cache+URL normalize: all verified. A6 abnormal alerts: partial - only one ticker shows when multiple should (still open, see N-items).

### Group B (FIX 3) - COMPLETE
B1 duplicate removed, B2 yearly 24 percent removed, B4 remaining overlay, B5 monthly target unified 5066: all verified. B3 skipped (minus already correct).

### Group C (FIX 2) - COMPLETE
C2 INTC aggregation verified (2026-only correct), C3 settings target reload verified, C4 post paragraphs verified. C1 CSP cash: superseded by E prime and F-area work.

### Group D prime - COMPLETE
D1 social regression fixed (section restored), D3 reports all-years toggle verified, D4 per-bar remaining done. D2 CSP text: superseded by E prime.

### Group E prime - COMPLETE
E1 CSP card: found root cause - premium is per-share not per-contract. ASTS net = (150 - 9.31) x 100 x 1 = 14069 not 14991. Number now correct. Card restructured RTL with 3 rows (exit cash, available now, after assignment).
E2 monthly bar: realized/target/remaining on each bar, total row RTL.
E3 phantom IREN: added AlertSource enum + badges (bait/watchlist/draft/other). Root cause NOT fixed - just labeled. Superseded by F4.
E4 feed dedup: edit-then-close now updates same row instead of stacking.

### Group F prime - COMPLETE (commit 589b44e)
F1 assignment prob: added DELTA_DEBUG log, made BlackScholesCalculator unit-tolerant (accepts IV as percent or decimal via <5.0 heuristic). Awaiting device verification of EWY showing ~95 percent.
F2 remove IV autofill: stripped all 8 lookupIvForExpiry call sites, removed init cachedIv overwrite. IV now manual-only, user-typed value survives field changes.
F3 feed color: POSITION_EDITED moved to blue (PremiumReceivedColor) branch.
F4 phantom prune: added isFullSync param, prune runs only on fullResync, removes snapshot tickers absent from Flex with no open position and no manual override.

### Group G prime - COMPLETE (commit 646a1e0)
G1 assignment prob IV-free fallback: added assignmentProbability field, BS-delta when IV present else logistic moneyness fallback, hides row when null/zero (no more "very low 0 percent"). Awaiting device verify of RIOT/PLUG now showing probability.
G2 stale prices off-hours: triggerPriceRefresh now writes fetched Yahoo prices back to currentStockPrice (the field ReportGenerator reads), not just the snapshot. Awaiting device verify.
G3 monthly progress percent restored as single LTR row.
G4 required-collateral label now PUT-only (CC no longer shows it).

### Group H prime - COMPLETE (commit be9a23e)
H1 monthly bar reverted: removed the G3 row addition below the bar. Replaced with a PercentPill above the bar matching the AnnualTargetCard pattern (single source of truth). Negative percent clamped to 0 for the pill so a net-loss month doesn't render as nonsense. Added MONTHLY_PCT log to diagnose any sign issue from `realizedForProgress / monthlyTarget`.
H2 BS fill cache-IV fallback: `fillPremiumFromBS` now reads `ivCacheDao.getLatestIvForTicker(ticker)` when the IV field is empty, sets it into state, and re-runs `recalculate()`. If still no BS price, surface a Hebrew autoFillStatus message ("הזן IV..." or "לא ניתן לחשב...") instead of silently writing 0.00. Added BS_FILL log inside `BlackScholesCalculator.calculate` to confirm inputs.
H3 stale price baseline: removed the `else if (oldCurrent != null && oldCurrent != yahooCurrent) obj.put("previous", oldCurrent)` fallback from BOTH price-refresh paths in DashboardViewModel. The fallback was mutating "previous" forward over refreshes, inflating daily change (ASTS real +6% → app +13%). Also flipped abnormal-alert base order to `previous ?: dailyOpen` (was `dailyOpen ?: previous`) — dailyOpen is captured opportunistically and drifts.

### Group I prime - COMPLETE (commit 996ffe6)
I1 monthly bars fallback: rewrote the `else` branch of `MonthlyTargetCard` (when `living > 0 && growth > 0` fails). Now always renders a single 22.dp bar with a centered LTR overlay showing `realized / target · נותר remaining` (or `✓ הושג realized / target` when met). Previously it showed only "נותר: $X" centered on a thin 5%-wide bar, which the user perceived as "no bar". Added MONTHLY_BARS diagnostic log in ReportGenerator that prints `target=<bool> living=<n> growth=<n> overallTarget=<n>` so we can tell if the breakdown is missing because the user never saved one (most likely) vs. a data-load failure.
I2 BS fill IV-parse hardening: in BOTH `recalculate()` AND `fillPremiumFromBS()` the IV is now parsed via `.trim().removeSuffix("%").trim().toDoubleOrNull()` so "45%" / " 45.0 " / "45.0  " all yield 45.0 (previously they parsed to null and BS computed nothing). Comprehensive BS_FILL diagnostic log added showing every parsed input (S, K, dte, ivField, ivParsed, type, bsTheoretical). The "near-zero" guard widened from `<= 0` to `< 0.005` so a positive-but-rounds-to-0.00 BS result triggers the Hebrew explanation branch instead of silently writing "0.00" into the premium field. Added a dedicated "פרמיה תיאורטית קרובה ל-0 — האופציה מאוד OTM" message for that case.
I3 stale price baseline (continuation): H' fixed the `triggerPriceRefresh` path but missed `refreshOnResume` (line 607) and `pullToRefresh` (line 660) — those still had `else if (oldCurrent != null && oldCurrent != yahooCurrent) obj.put("previous", oldCurrent)` which mutated "previous" forward on every resume / pull. Removed in both paths; only Yahoo's regularMarketPreviousClose can update "previous". Added PRICE_REFRESH logs in both paths showing `oldCurrent → newCurrent` and `oldPrev / yahooPrev` so the next device test can confirm fresh baselines.

### Group J prime - COMPLETE (commit 9f79c9f)
J1 stop zeroing living/growth + carry-forward repair: MONTHLY_BARS log on commit 996ffe6 proved `target=true living=0.0 growth=0.0 overallTarget=5073.0` — a Flex sync was overwriting the user's living/growth with zeros. Root cause was `ImportViewModel.applyPortfolioToSettings` constructing a `MonthlyTargetEntity` without the breakdown fields, defaulting them to 0.0. Fix:
  - `applyPortfolioToSettings`: now calls `resolveBreakdown(existing)` which preserves the existing record's living/growth, OR carries forward from the most recent month that has a non-zero breakdown.
  - `FlexSyncWorker.upsertMonthlyFinancialMetrics`: when creating a new-month target, also copies forward prior month's living/growth (so month rollovers don't wipe).
  - `ReportGenerator` (read-time repair): when the current-month target has zero breakdown but a prior month has one, in-memory borrows that breakdown so the two-bar `SegmentedTargetBar` renders again immediately — no need to wait for a Flex sync to persist the repair.
  - New repository helper `getLatestTargetWithBreakdown(excludeYearMonth)` (and corresponding `MonthlyTargetDao.getAllOnce()` filter in Kotlin) finds the latest month with non-zero breakdown excluding a given month.
  - SettingsScreen's existing `getLatestTarget()` fallback at load is already correct — its `defaultTarget` creation only fires when no target exists anywhere, so leaving breakdown=0 there is fine.
J2 price refresh fires for open-position tickers: PRICE_REFRESH log was empty because `refreshOnResume` and `pullToRefresh` only iterated `snapshot.keys()`, and ASTS (a pure-CSP underlying with no shares) never lived in the stock snapshot. Both paths now build `tickers = snapshotTickers ∪ openPositionTickers` (matching what `triggerPriceRefresh` already did from G'), CREATE a fresh snapshot entry for any open-position ticker not yet present, and persist the new price to `position.currentStockPrice` so ReportGenerator's per-position daily-change calculations see fresh values. Added unconditional `refreshOnResume ENTERED` / `triggerPriceRefresh ENTERED` logs at the top of each function so an empty log unambiguously means lifecycle wiring is broken (rather than empty-ticker early-return).

### Group K prime - COMPLETE (commit 75722b0)
J' got the refresh firing and covering open-position tickers (PRICE_REFRESH log now shows ASTS being fetched) but device test revealed two remaining issues — ASTS still displayed +13% (yesterday's close-to-close) instead of today's pre-market ~+6%, and the write-back log said "Wrote currentStockPrice to 0 open positions".
K1 pre/post-market-aware batch fetch: the v7 `/finance/quote` endpoint that `fetchYahooPrices` uses does NOT include pre-market or post-market prices — during overnight sessions it just returns yesterday's regular close as `regularMarketPrice`, so "current" never moved off 119.7 for ASTS. Added `fetchYahooPricesWithPrePost(tickers)` to IvService that loops the existing `fetchYahooPrice(ticker)` (v8 `/finance/chart?includePrePost=true`) per ticker; this endpoint properly surfaces `preMarketPrice` / `postMarketPrice` and `previousClose`. All three dashboard refresh paths (`triggerPriceRefresh`, `refreshOnResume`, `pullToRefresh`) now use it. Also pointed the shared `fetchPricesWithFallback` at the new pre/post variant so any caller using the fallback chain gets pre-market too. (Other callers of `fetchYahooPrices` outside the dashboard refresh — workers, alerts — left alone.)
K2 removed same-price write-back skip: the `if (pos.currentStockPrice != null && kotlin.math.abs(pos.currentStockPrice - fresh) < 0.0001) continue` guard appeared in all three refresh paths. When the v7 endpoint returned yesterday's close (== whatever was already stored), every position got skipped and `positionsUpdated=0`. Removed in all three paths; idempotent writes are fine and `updatedAt` should refresh so downstream Flow listeners react. Added a per-ticker `DAILY-CHK` log printing `current / prev / pct` so the device test can confirm pre-market values without parsing the larger PRICE_REFRESH stream. PositionEntity has no `previousStockPrice` column, so the daily-change baseline lives in the snapshot's `"previous"` key — already getting written from Yahoo's `regularMarketPreviousClose`, fixed back in I'. No DB schema changes here.

### Group L prime - COMPLETE (commits 6684fa4 diag + 3da5058 fix)
K' added the `fetchYahooPricesWithPrePost` path but ASTS still showed +13% from yesterday — turned out K' was just routing through a v8 endpoint that ALSO didn't surface the pre/post data the way we assumed.
Step 1 (diagnostic, commit 6684fa4): added a `PREPOST_DEBUG` log inside `fetchYahooPrice` dumping every raw `meta` field plus the full key list, and confirmation logs at all four dashboard fetch call sites. The PREPOST_DEBUG output from the device proved that on the v8 `chart` endpoint `meta.preMarketPrice` and `meta.postMarketPrice` simply don't exist (they came back NaN, and the meta key list never contained them). The pre/post field naming we assumed only applies to the v7 `quote` endpoint — and that one doesn't include pre/post at all. So neither endpoint, as we were calling them, returned an extended-hours price.
Step 2 (fix, commit 3da5058): on the v8 chart endpoint the latest extended-hours trade actually lives in the per-minute candle arrays at `result[0].indicators.quote[0].close` (with matching `result[0].timestamp`). Now `fetchYahooPrice` walks the close array backwards, picks the most recent non-null close, compares its timestamp against `meta.regularMarketTime`, and if the candle is newer it returns the candle's close as "current" (otherwise falls back to `regularMarketPrice`). `previousClose` comes from meta as before. URL already had `interval=1m&range=1d&includePrePost=true` so the candle array does include pre/post prints. Function signature `(ticker: String): Map<String, Double>` unchanged so all callers (including the K' batch wrapper) just work.
The L1 / CANDLES / FINAL PREPOST_DEBUG logs are left in place so the next device test can verify the new logic produces sensible values.
v7 batch `fetchYahooPrices` (used by workers, alerts, anything outside the dashboard refresh) left alone — only the v8 single-ticker path changed.

### Group M prime - COMPLETE (commit 91fa735)
Device test with markets OPEN: top gainers/losers + abnormal alerts still showed ASTS at +20% when reality was +6%. Current price was correct (127.4 fresh from L' candle-array fix), but the snapshot's "previous" baseline was 105.86 — a value from 2 days ago, not yesterday's close of 119.7.
M1 stop the current→previous demote in Flex/import paths: the dashboard refresh paths (Yahoo) had been writing the correct previous from `regularMarketPreviousClose` since I'/J'/K'. The corruption was coming from THREE non-dashboard sites that did `existing.put("previous", lastCurrent)` on every Flex/sync run — exactly the demote anti-pattern fixed in H' for the dashboard. Locations: `FlexSyncWorker.kt:259-264` (background Flex sync), `ImportViewModel.kt:617-624` (mark-price sync for open positions), and `ImportViewModel.kt:659-666` (stock-holding merge loop). All three now write `current` only; `previous` is owned by Yahoo refresh paths. Added a `snapshot write` PRICE_REFRESH log in the init refresh path showing the written current/previous/pct so the next device test can verify.
M2 IV_TRACE diagnostic (no calc change): once on commit 3da5058 device test, an open CSP position showed delta=-0.999 (vs broker -0.191) and BS=$62.51 (vs broker mid $3.24), self-corrected after the user re-entered IV minutes later. Added `IV_TRACE` log inside `ReportGenerator.summarize` printing `ticker / optionType / K / S / storedIv / dteUsed / delta / prob` at the exact moment estimatedDelta + assignmentProbability are computed. No calc changes — purely diagnostic so next recurrence reveals whether `entity.impliedVolatility` momentarily held the wrong value (stale sync IV, race between user input and persist, etc.).
M3 expected-move range in add-position risk panel: next to the existing "תנועה צפויה (1σ) ±$X" row, added a "טווח צפוי" row showing `$low – $high` (currentPrice ± expectedMove), both wrapped in LTR per CLAUDE.md money-sign rule. Renders only when currentPrice > 0 && expectedMove > 0 so the panel doesn't show a zero-zero range on bare/blank forms.

### Group N prime - COMPLETE (commit 8bd1aea)
N'1 PercentPill realized source aligned with bars: the pill showed 0% while the bars were full and the total row said "✓ הושג היעד". Root cause: `progressPercent` in `ReportGenerator` was computed from `realizedForProgress = ibkrTotalRealized ?: totalRealized` (= 0 for this user — they had no IBKR-tagged closes this month so `ibkrTotalRealized` resolved to a non-null but 0-summed value), while the bars use `combinedTotalRealized` (= ibkrPnl ?: calc per-position, which sums to the real number). Switched `progressPercent` to use `combinedTotalRealized / monthlyTarget * 100`, same value the bars and `totalRealizedProfitThisMonth` flow from. Single source of truth restored. Added `MONTHLY_PCT` log printing both values for verification.
N'2 RTL collateral labels (N7): in `DashboardScreen.kt:2249` the open-position card's "בטחונות: $X" / "מניות: $X" was wrapped in `LayoutDirection.Ltr`, which forced left-to-right reading order and put the Hebrew label visually before the number. Replaced with an RTL Row containing a Hebrew label Text followed by an LTR-wrapped number Text — now label sits on the visual right with the number to its left, matching the rest of the Hebrew card.
N'3 removed debug notifications (N14): three debug surfaces were leaking into the system tray / on-screen — `MainActivity.kt:69-73` Toast "MainActivity.onCreate fired", `OptionsTrackerApp.kt:40-46` Toast "App.onCreate fired @ ...", and `AlertWorker.getForegroundInfo()` notification "בודק התראות..." on the HIGH-importance ALERT channel. Removed both Toasts; kept the logcat MAIN_ONCREATE / APP_ONCREATE entries for diagnostics. AlertWorker's foreground-service notification (Android-required for foreground workers) moved to a new `SILENT_WORKER_CHANNEL_ID` channel (IMPORTANCE_MIN, no sound/vibration/lights), title stripped, `setSilent(true)` + `PRIORITY_MIN`. Real user features (MonthlyReminderWorker reminder, NotificationHelper.showAlertNotification price alerts) left as-is.
N'4 hide IV-opportunity hint on edit (N11): in `AddPositionScreen.kt:458-469` the "🔥 IV גבוה — הזדמנות למכירה" / "📈 IV מעל ממוצע. פרמיות סבירות" / etc. recommendation was rendering on edit-of-existing-open-position too, where the "sell now" framing made no sense (the trade is already open). Wrapped the recommendation block in `if (state.editingPositionId == null || state.isEditingDraft)` so it only shows when adding a new position or editing a draft. The surrounding IV/price/earnings info row is left visible in all modes — that data is useful regardless.

### Group P prime - COMPLETE (commit 3e477be)
P1 EditAssignmentCard RTL: in the CSP "אם תוקצה" panel, the title / subtitle / "מחיר רכישה" rows were correctly right-aligned (inherited the global RTL), but the middle rows ("ייצא מהקאש" / "יתרה זמינה כעת" / "יתרה לאחר הקצאה") sat on the visual left. Root cause: those rows were wrapped in an EXTRA `CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl)` + `Alignment.End` / `Arrangement.End`. Inside an already-RTL screen, `End` resolves to the visual LEFT, so the wrapper effectively double-inverted them. Removed the extra wrapper, flipped `End` → `Start` on the Column's `horizontalAlignment` and the rows' `horizontalArrangement` (in global RTL, `Start` = visual right). Inner LTR providers around each `$X,XXX` amount are preserved so the digits keep reading left-to-right.
P2 ticker leak in edit screen (RKLB showing MU): root cause was that `loadPosition()` updates `state.ticker` and a handful of position-specific fields but did NOT clear the ticker-specific cached analyses (`tickerAnalysis`, `strategicAnalysis`, `chainAnalysis`, `wheelSummary`, `lastHistoricalPremium`, `tickerHistory`, `autoFillStatus`, `showChainResult`). Those linger from whatever ticker the ViewModel was last viewing — so opening RKLB edit while the VM still held an MU analysis from a previous session surfaced Micron text inside the RKLB screen. `updateTicker(value)` already nulls `tickerAnalysis` on user-typed input; `loadPosition` now does the same for the full bundle of cached fields. Added `EDIT_LEAK` log confirming the clear.
P3 social feed chronological + timestamps (N13): three coordinated changes — (a) added `publishedAtEpochSec: Long?` to `TelegramPost` and `SocialFeedPost`; (b) `fetchTelegramPostsWithImages` now extracts `<time datetime="ISO8601">` inside each `tgme_widget_message_wrap` block via a `Regex("""<time[^>]*datetime="([^"]+)"""")` and parses to epoch seconds via `OffsetDateTime.parse(it).toEpochSecond()`; (c) `DashboardViewModel` now sorts `allPosts.sortedByDescending { publishedAtEpochSec ?: 0L }` before the filtering/distinctBy/take chain (those are order-preserving), and downstream references switch from `allPosts` to the new `sortedPosts`. Twitter/Nitter posts keep `publishedAtEpochSec = null` (no time tag extracted from Nitter HTML yet) so they fall to the end. UI: added a small LTR `dd/MM HH:mm` stamp next to the `📨 ${channel}` header in all three render sites (compact list, uniform grid card, expanded dialog) so the user immediately sees which channels post freshest.

### Group Q prime - COMPLETE (commit d8ba47f)
Q1 "% על ההון" wrong realized source: the dashboard "% על ההון" card (`DashboardScreen.kt` Row 4 → `summary.profitPercentOnAllocated`) always showed -0.80%. Same root as N'1 — `ReportGenerator.summarize` computed `profitPercentOnPortfolio` / `profitPercentOnAllocated` from `realizedOnly = ibkrTotalRealized ?: totalRealized` (the broken ~-435 IBKR-only sum), NOT the `combinedTotalRealized` (~5286, `ibkrPnl ?: calc` per-position) that the bars / total row / N'-fixed `progressPercent` all consume. -435 / ~54k ≈ -0.80%. Switched both percent fields to `combinedTotalRealized / portfolioForPercent * 100`. Added `EQUITY_PCT` log. NOTE: ReportsScreen's "% פורטפוליו"/"% על ההון" come from the SEPARATE `getMonthlyReport` function via `report.portfolioReturn`/`report.allocatedReturn`, which already use `realizedProfit = ibkrRealizedPnl ?: realizedPnL` (the combined formula) — so that path was already correct and left alone. The device bug was the dashboard card (function A), not the reports card (function B).
Q2 removed duplicate dashboard target banner: a standalone "Month status badge" item, positioned between the social feed and the pre-market/large-move alerts, rendered `summary.monthVsTargetStatus` ("🎯 יעד הושג!" when progress ≥100) — duplicating the MonthlyTargetCard's own "✓ הושג היעד". Removed the entire `if (summary.monthVsTargetStatus.isNotEmpty()) { item {...} }` block. The MonthlyTargetCard / SegmentedTargetBar internal "✓ הושג היעד" text was NOT touched.
Q3 social toggle moved onto header row: the "רק טיקרים בתיק" Switch was its own `item {}` row below the "📱 רשתות חברתיות" header. Merged both into one `item {}` with a `SpaceBetween` Row (global RTL → Hebrew header on the visual right, toggle on the visual left). The "מוצגים X מתוך Y" filtered-count item between them is preserved. (Edited via PowerShell line-reconstruction because the header line stores the emoji as a literal `📱` escape that the Edit tool's JSON layer kept converting to the emoji char — reused the original emoji/Hebrew lines verbatim rather than retyping.)
Q4 finished clearing edit-screen leak: P2 cleared tickerAnalysis/strategicAnalysis/chainAnalysis/wheelSummary/autoFillStatus/lastHistoricalPremium/tickerHistory in `loadPosition`, but a generic "defense companies" headline still leaked into RKLB edit — it lived in the uncleared `aiAnalysis` text field (RKLB is a space/defense underlying, so a stale AI/sector analysis persisted). Added `aiAnalysis`, `aiAnalysisError`, `aiAnalysisLoading`, `chainParsingText`, `showManualChainEntry`, `manualChainRows`, `chainBidAskOverrides` to the loadPosition clearing block. Updated the `EDIT_LEAK` log to list every field cleared. No realizedPnL / DB schema changes.

### Group R prime - COMPLETE (commit ac6bbd6)
All six fixes in `PremiumIncomeScreen.kt` (the income journal screen) — no realizedPnL / DB changes.
R1 rename "מפגרים" → "מפסידים": section header "מובילים ומפגרים לפי P&L" and the loss-card title "מפגרים" both now say "מפסידים" (losers).
R2 center "ניצחונות"/"הפסדים" StatMini cards: the shared `StatMini` Column now has `Modifier.fillMaxWidth()` and both the value and label Texts use `Modifier.fillMaxWidth()` + `textAlign = TextAlign.Center`, so content centers inside the card instead of hugging the RTL start edge.
R3 weekly-summary RTL: the week-header "ממומש: $X" was one combined string inside an LTR span (bidi put the Hebrew label on the LEFT). Split into a Row { Hebrew label "ממומש:" (inherits RTL → right) + Spacer + LTR-wrapped number }. Same split applied to the per-day "סה\"כ:" totals in both columns (R4 region). The week-total row ("סה\"כ שבוע" + number) was already label-right/number-left and left as-is.
R4 hide empty day sub-sections: the two-column day detail used to always render the "פרמיות שנאספו:" / "ממומש:" labels with a "—" placeholder when empty. Now computes `showPremiumCol = opened.isNotEmpty() || dayPremium > 0.0` and `showRealizedCol = closed.isNotEmpty() || dayRealized != 0.0`; each `Column` (and the middle `Spacer`) is wrapped in `if (...)` so an empty side is fully absent (no label, no dash). Removed both `Text("—")` placeholders.
R5 align day-table columns: the header Row uses weights יום=0.8 / תאריך=1 / פרמיות=1.2 / ממומש=1.2 (total 4.2) but the data row used 0.8/1/0.4 (a single bullet dot, total 2.2) so nothing lined up. Replaced the dot with two LTR amount columns at weight 1.2 each: premium = `day.premiumReceived - day.premiumPaid` (PremiumReceivedColor), realized = `day.realizedOnDay` (pnlColor), both `formatCurrency`, `textAlign = End`, empty string when 0. Data row now 0.8/1/1.2/1.2 matching the header.
R6 contain "רווח לפי חודש" month bar: the per-month bar `Box(weight(1f))` sat directly adjacent to the amount (no gap) so the bar visually ran into the number. Added `Spacer(Modifier.width(8.dp))` between the weighted bar Box and the LTR amount, and changed the amount from `Modifier.width(72.dp)` to `Modifier.widthIn(min = 64.dp)` so long values aren't clipped. The bar lives inside its weighted Box and can no longer overlap the number's area.
NOTE on editing this file: it stores `●` (bullet) and `‎` (LTR mark) as LITERAL backslash-escapes and uses `\"` inside Hebrew strings ("סה\"כ:"). The Edit tool's JSON layer mangles `\uXXXX`/`\"`, so the data-row + day-detail rewrite (R3/R4/R5) was done via PowerShell line-splice with single-quoted here-strings (which keep Hebrew, `"`, `\`, `$` literal). Simple Hebrew-only edits (R1, R2, R3 header, R6) went through the Edit tool fine.

### Group R2 prime - COMPLETE (commit ec0a56e)
Follow-up to R5: the two weekly day-table amount columns were ambiguous — a per-day number (e.g. $331.19) looked like it floated between the "פרמיות"/"ממומש" headers. Root cause was a header/data mismatch: each amount cell is LTR-wrapped with `textAlign.End` (number hugs the right edge of its slot) while the RTL headers used `textAlign.End` too (label hugs the left edge of the same slot), so label and number sat at opposite ends of the column — and identical-but-tight 1.2/1.2 weights gave no clear separation or color cue. All in `PremiumIncomeScreen.kt` WeekCard. No realizedPnL / DB changes.
R2'1 column clarity: renamed + recolored the two headers to one-word, color-coded labels — "נאספו" (collected, `PremiumReceivedColor` blue) and "מומשו" (realized, `PrimaryGreen`). Header + data row now use IDENTICAL order and weights (יום 0.7 / תאריך 0.9 / נאספו 1.3 / מומשו 1.3), both inherit global RTL, `maxLines = 1` on the amount cells, numbers still LTR-wrapped. The color match (blue header over blue number, green header over green/red number) is the real disambiguator. Also renamed the day sub-detail left header "ממומש:" → "פרמיות שמומשו:" and recolored it `PrimaryGreen` (the right sub-header "פרמיות שנאספו:" stays blue).
R2'2 week totals split: the week header was restructured from a `Row(SpaceBetween){ title; Column(End){totals} }` into a `Column(clickable){ title Row; totals Row }`. The totals Row is full-width `SpaceBetween` → "סה\"כ נאספו: $X" collected on the visual RIGHT (blue, first child in RTL), "סה\"כ מומשו: $Y" realized on the visual LEFT (green/red). Hebrew label + LTR-wrapped number in each. The bottom "סה\"כ שבוע" footer row was left untouched (out of scope).
NOTE: R2'2 was written via PowerShell line-splice because the new strings contain `\"` (סה\"כ) which the Edit tool's JSON layer mangles; the Hebrew-only / ASCII R2'1 edits used the Edit tool fine.

## Verified fixed (device-confirmed)

N5 monthly bars + percent (J'/N'1 — pill shows 104%), N6 assignment prob (F'/G'), N7 collateral/maniot RTL (N'2/P1), N8 phantom tickers (F'), N9 collateral PUT-only (G'), N10 IV autofill removed (F'), N11 IV-opportunity hidden on edit (N'4), N12 feed color blue (F'), N13 social chronological + timestamps (P3), N14 debug notifications removed (N'3), "% on equity" (Q1), edit-screen ticker leak (P2/Q4), BS fill (I2), CSP card RTL (P1).

## Awaiting PRE/POST-MARKET device verification (time-dependent)

- ASTS dashboard price shows live pre-market (~125-127), not stuck at 119.7 close (L' fix — extended-hours from v8 candle array).
- ASTS top-gainers + abnormal-alerts percent shows ~+5-6% (from yesterday close 119.7), not +20% (M1 fix — snapshot "previous" no longer demoted by sync paths).
- (This pair is the old N4 "off-market-hours data wrong" — both sub-items must check out on a pre/post-market device test.)

## NEW backlog (reported, not yet built)

NEW1. Feed "position edited": show what changed from→to (old value → new value).
NEW2. Abnormal alerts: +/- sign LEFT of number in "ירידה %"/"עלייה %".
NEW3. PLUG edit (price 4.07, call strike 2.50 = ITM) still shows "מחיר/עסקה מופלאה" — wrong BS calc, likely same IV-stale root as the delta -0.999 issue. Use IV_TRACE log (added in M2) to catch the bad IV value.
NEW4. Dashboard annual target: growth bar shows 0.
NEW5. Portfolio news: right-align AI summary + CACHE it (don't re-summarize on every open of the same article).
NEW6. Portfolio news: improve article content shown (lots of junk).
NEW7. Portfolio news: per-article summary with sentiment (pos/neg) + how the stock moved since the news (% up/down).
NEW8. Portfolio events: dividends not showing.
NEW9. Option to merge news + portfolio events into the social feed.
NEW10. (was N15) Alerts: show all highest IVs by current portfolio tickers + dates.

## Deferred (by user)

- Social: filter out irrelevant posts (e.g. Israeli market) — "future".
- Watchlist ±3% alert verification (needs device check, not code).

## In-progress feature plan (Group S prime — next)

S1: "Add to watchlist" button in add-position (always shown unless ticker already in watchlist); when added, ticker enters watchlist with all data and alerts on a target (e.g. price move ≥3%).
S2: Verify/ensure watchlist tickers trigger ±3% abnormal-move alerts.
S3: Available capital ("הון זמין") should auto-update from IBKR sync instead of manual entry in Settings.

## ✅ Confirmed working as of `8a44bd4`

This list is the source of truth — don't re-prompt items from here.

- Backup/Restore v4 (JSON, schema v4, autoFillCache + manualPnlAdjustment)
- Expected-profit calculator + calendar (state-aware: PLUG CC -$3367, SOFI -$3517, RIOT -$693, OWL -$17, IBRX +$254)
- Global left arrows (Unicode `←`, not Material Icons)
- Edit-position UX: tags removed, keyboard stays open during typing, premium recommendation
- DRAFT does not create activity-feed rows
- Portfolio sort persists across recompose (ViewModel + DataStore) + total shows full number
- Massive.com IV provider wired (Marketdata primary, Massive fallback) — but Massive fallback returns empty (Group D)
- Monthly realized — manual + IBKR combined
- Edit closed position (pre-fill + warning + "עדכן סגירה" button)
- Black-Scholes "מלא" works; premium NOT updated for CSP DRAFT (frozen), other strategies auto-update
- Save-as-draft → drafts list
- DB v30 + `initial_premium` column + migration with backfill (NOTE: `initial_iv` column does NOT yet exist — that's Group D)
- Top movers expand/collapse inline
- Portfolio events refresh (try/finally on isRefreshing)
- CC Reminder no longer says "CSP"
- CC Assignment Probability based on Black-Scholes delta
- IV per-contract trigger runs (but cache stays empty — that's Group D)
- Posts: LTR for English text in posts, POST_IMAGE callbacks run, new put starts at 0% (not 100%)

## Longer-term roadmap

The post-stabilization feature roadmap (F1–F16: AI per-post analysis, watchlist→AddPosition prefill, per-ticker news, pre-market mode, more social sources, home-screen widgets, paper trading, tax forms, spread redesign + drill-down, delete-confirm audit, transfer commissions, etc.) lives in `roadmap.md` — that file is the canonical source. The "NEW backlog" + "Group S prime" sections above are the actively-prioritized slice pulled from it.

## Validated environment notes

- **Pre-market ET:** 4:00–9:30 ET = **15:00–20:30 שעון תאילנד**
- **After-hours ET:** 16:00–20:00 ET = **03:00–07:00 שעון תאילנד**
- **Verified Marketdata-supported tickers (22):** IBRX, OPEN, BTCI, NVO, OWL, IREN, PLUG, RKLB, BBAI, EWY, ASTS, SOFI, RIOT, DRAM, NVDA, MULL, TTD, SMCI, ONDS, KEY, KBWY, USO, CHPT, LUNR, CCL
- **API keys present in DataStore:** Marketdata ✅, Massive ⚠️ (free tier returns empty IV), Finnhub, Alpha Vantage, Anthropic, Gemini, IBKR Flex token + Query ID. Alpaca **removed** (registration too complex).

## Workflow rules (reminders for all agents)

1. Max 4 fixes per Claude Code prompt
2. **GREP before fixing** — confirm grep target exists before writing changes
3. **Build must pass** before commit (`./gradlew :app:compileDebugKotlin --stacktrace`)
4. **Auto-accept all file edits** — Claude Code does not prompt for diff confirmation
5. **NEVER** change `realizedPnL()` without explicit Dima approval
6. Each fix has a verification step (specific log tag) that MUST appear in logcat before declaring done
7. Warn before any `uninstall` recommendation — past data loss

## Repo

- **GitHub:** funzi7/OptionsProfitTracker
- **Default branch:** `main`
- **Active branch:** `claude/analyze-project-structure-TC5ZG`
- **Branch naming convention:** `claude/batch{N}-{description}` or `claude/{round-label}-{description}`
- **PR convention:** conventional commits (`fix:`, `feat:`, `chore:`, etc.)
