# OptionsProfitTracker — State

> Living document. Update at the end of every working session.
> Last updated: 2026-05-05 (post commit `8a44bd4`)

## Current focus

ייצוב באגים פעילים שלא נסגרו ב-commit `8a44bd4`. יש פטרן של "הצהרת done שלא תפסה בקוד" — לכן כל FIX מכאן ואילך כולל verification בלוג שחייב להופיע לפני סגירה.

הבא בתור: סדרה של 4 פרומפטים (A/B/C/D) שמבוססים על הסיכום מ-2026-05-05 — סדר ההרצה: A (FIX 4 image+sort) → B (FIX 3 dashboard) → C (FIX 2 CSP+INTC) → D (FIX 1 IV).

## Repo + state

- **Repo:** funzi7/OptionsProfitTracker
- **DB version:** 30 (planned bump to 31 in FIX 1/F for `initial_implied_volatility` column)
- **Branch (current work):** `main`
- **Last commit:** `3e477be` (Group P prime — EditAssignmentCard RTL, stale ticker leak in edit screen, chronological social feed with timestamps)
- **Recent commits:** `8a44bd4` → `9ddca1c` (Group A) → `f1c3e9a` (Group B) → `16fd852` (Group C) → `fdc1cf1` (Group D prime) → `7df9465` (Group E prime) → `589b44e` (Group F prime) → `646a1e0` (Group G prime) → `be9a23e` (Group H prime) → `996ffe6` (Group I prime) → `9f79c9f` (Group J prime) → `75722b0` (Group K prime) → `6684fa4` (L' step 1 diag) → `3da5058` (Group L prime) → `91fa735` (Group M prime) → `8bd1aea` (Group N prime) → `3e477be` (Group P prime)

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

## New active issues from device test 2026-05-13 (N-items)

| # | Issue | Status |
|---|---|---|
| N4 | Off-market-hours: all data wrong (CC reminder, abnormal alerts, per-ticker numbers/percent) - stock prices do not update outside market hours | fixed in M prime (L' got "current" fresh from candles, but top-movers/abnormal-alerts still showed +20% for ASTS because the Flex/import paths kept demoting current→previous, corrupting the baseline; M' removes the demote in all three sync sites so previous stays at Yahoo's regularMarketPreviousClose), awaiting device verify |
| N5 | Monthly target dashboard: total progress percent disappeared | fixed in N prime (J' restored the pill via the carry-forward repair but the pill source diverged from the bars and showed 0% next to a full bar; N' aligns progressPercent to use the same combinedTotalRealized the bars consume), awaiting device verify |
| N6 | Assignment probability inverted (EWY deep ITM showed 28 percent) | fixed across F/G prime, awaiting final verify |
| N7 | "betachonot"/"maniot" in open-position card need right-align (word right, number left) | fixed in N prime (DashboardScreen.kt:2249 — replaced LTR-wrapped single Text with an RTL Row containing a label Text and an LTR-wrapped number Text). P' also fixed the related EditAssignmentCard middle rows ("ייצא מהקאש", etc.) which had a redundant RTL wrapper double-inverting them to the visual left. Awaiting device verify. |
| N8 | Phantom tickers MULL/MU persist | fixed in F prime, awaiting device verify |
| N9 | "bitachon nidrash" appears on CALL position - should be PUT only | fixed in G prime |
| N10 | IV 99 percent wrong, reverts to old value on field change | fixed in F prime (removed), awaiting device verify |
| N11 | Edit-open-position shows "sale opportunity" texts that should not appear | fixed in N prime (AddPositionScreen.kt:458-469 IV-recommendation block now guarded by `isNewOrDraft` — hidden when editing an existing open position; surrounding price/IV/earnings info row stays visible in all modes), awaiting device verify |
| N12 | Feed: updated position shows green instead of blue | fixed in F prime, awaiting device verify |
| N13 | Social dashboard shows old posts, not newest from all channels | fixed in P prime (added publishedAtEpochSec to TelegramPost + SocialFeedPost, extract <time datetime> from t.me/s/ HTML, sort allPosts newest-first before filtering, render dd/MM HH:mm timestamp on each card), awaiting device verify |
| N14 | System notifications "X fired/created", main activity - remove entirely | fixed in N prime (removed Toasts in MainActivity.onCreate + OptionsTrackerApp.onCreate; AlertWorker's foreground-service notification moved to a new SILENT_WORKER_CHANNEL with IMPORTANCE_MIN + no title + setSilent(true); real user-alert channel + monthly reminder untouched), awaiting device verify |
| N15 | Alerts: show all highest IVs by current portfolio tickers + dates | open (feature) |

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

## Ungrouped TODO (from Dima's roadmap, post-stabilization)

Re-classified from prior summary — see `roadmap.md` for the full list. Main groups:

- **F1.** AI per-post analysis (only for posts containing portfolio tickers — saves API calls)
- **F2.** Watchlist alerts → click opens AddPosition with ticker/strategy pre-filled
- **F3.** News inside position-open screen (per-ticker only, no sector filter)
- **F4.** Pre-market mode in dashboard header ("17 פוזיציות פתוחות") + price refresh in pre-market
- **F5.** CC reminder updates in pre-market (data starts 15:00 Bangkok / 04:00 ET)
- **F6.** Twitter/Nitter (free instances only — no paid API)
- **F7.** Reddit + Bloomberg + private Telegram bot integration
- **F8.** Filtered subreddits per watchlist
- **F9.** Home-screen widgets
- **F10.** AI chat for position analysis (Anthropic + Gemini keys ready)
- **F11.** Paper trading simulator
- **F12.** stockanalysis.com regex broken — try digrin.com / dividend.com fallback
- **F13.** Annual tax forms + Israeli Form 1325 + 1042-S parse
- **F14.** Spread redesign + drill-down + "best trades to repeat" (R5)
- **F15.** Delete confirmations across all screens — verification audit
- **F16.** Transfer commissions (multi-currency living)

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
