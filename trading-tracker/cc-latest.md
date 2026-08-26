# trading-tracker — Round 6 handoff (2026-08-26)

Project HEAD: `88206c9dafa0ff7f2cf5f6132e62130d28b45e08` (origin/main, pushed and remote-verified)
Starting project HEAD: `d1f71c7024aa2b875b6c4ea1042aea7aaac482d5`
Repo: `github.com/funzi7/trading-tracker` · package `com.funzi7.tradingtracker` ·
app `0.6.0` / versionCode `6` · Room schema `6`

Round 6 turns the calendar into a daily activity journal, adds useful clickable current-position cards
with live prices, a position-detail + fast-close workflow, live/extended-hours market prices, strategy/
tag navigation, precision cleanup, long-scroll screenshot support, and versioned APK delivery — while
preserving the physically-working v0.5.0 IBKR sync. Traced end-to-end by 4 read-only subagents (calendar,
position/close+OPT ClosePositionScreen, market-data+OPT price path, tags/scroll/APK) before any edit.

## What shipped

- **Calendar = daily activity journal (§6/§7/§8).** `domain/journal/DayActivity` + `DayActivityBuilder`
  build each NY day from CANONICAL facts — opening effects + closing slices + dividends + legacy P&L —
  never the current Open-Positions snapshot. `LotMatcher.build` now also returns `executionEffects`
  (per-exec OPEN/ADD, emitted in the opening phase; append-only, P&L/commission math untouched).
  A slice is a full CLOSE only when its execution actually zeroed the round trip (closeInstant ==
  rt.closeInstant), else REDUCE. `CalendarScreen` is one `LazyColumn`; clicking a day sets a selected
  date and renders inline detail BELOW the grid (scrolls into view) — NO navigation. `AppRoot` calls
  `CalendarScreen()` (dropped onOpenDay); `DayDetailRoute`/screen stay for compatibility.
- **Live prices (§21–§27).** `data/quote/`: `YahooChart` (pure — OCC symbol builder + v8-chart
  field-selection: regularMarketPrice, but the last extended-hours 1-min candle when its ts >
  regularMarketTime; baseline = today's regular close in pre/post, never the 2-sessions-old
  previousClose; null baseline ⇒ no %). `QuoteRepository` = one coordinator (shared OkHttp, 60s TTL,
  batch/dedupe, `market_quotes` last-known cache retained on failure, all failures swallowed).
  `PositionValuation` = unrealized P&L (option ×100 once). **Option prices use the SAME keyless
  v8-chart-with-OCC path** (verified live) — no crumb, no keyed provider, no §24 STOP needed.
- **Cards + Position Detail + fast Close (§9/§14–§20).** `ui/positions/`: `PositionUi(Builder)` +
  `PositionUiProvider` (combines currentPositions + quotes + strategy + pending). `PositionCard` pins
  the ticker far-LEFT via `CompositionLocalProvider(LocalLayoutDirection provides Ltr)`, shows strategy
  chip / live price / day% / unrealized P&L / freshness; clickable → `PositionDetailScreen`. Close
  workflow: broker position → `PendingCloseRepository.recordBrokerClose` writes ONLY a
  `pending_position_closes` row (no fake BROKER, no duplicate MANUAL exec); manual position →
  `recordManualClose` writes a real MANUAL close (`ex_mc_<uuid>`). `CloseCalc` = direction-correct
  methods (BTC/STC/Expired/Assigned/Exercised/Roll; Roll = classification only), 1/Half/All presets,
  live estimated P&L. `PendingCloseReconciler` + `reconcileAll` match a later broker close (conid-first
  + opposite side + qty≈ + ±7d window) → CONFIRMED/SUPERSEDED; realized P&L only from broker/manual
  ClosedSlices ⇒ no double count.
- **Strategy (§11) + tag nav (§12/§13).** `domain/strategy/StrategyResolver` evidence ladder: local
  override → manual metadata → matched OPT `strategyType` → provable broker inference (Covered Call
  needs covering shares) → factual leg (short put alone = Sell Put, never fabricated CSP).
  `StrategyRepository` (position_strategy overrides + OPT strategy by contract, keyed by
  `Instrument.key` == OPT contractKey). `TagPositionsScreen` filters round-trip episodes (+ open
  positions for STRATEGY), open-only default + include-closed toggle + sort/asset filters, VM state
  survives back. OPT `strategyType` retained via a pure `optLocalId→strategyType` lookup in
  `OptImportManager` (reconciler untouched).
- **Precision (§10).** New `Fmt.PRICE_PATTERN="#,##0.00##"` (2–4 dp, HALF_UP) for `price`/`priceNative`;
  qty keeps DECIMAL_PATTERN; money 2dp / percent 1dp unchanged. Kills the six-decimal micro-noise.
- **Refresh (§30).** `PullRefreshWorkflow`/`SharedPullRefresh` join a live-quote refresh (defaulted
  param, tests unaffected) alongside the unchanged broker single-flight + FX — no new Flex, no dup sync.
- **Schema 5→6 + APK (§34/§35).** Additive `MIGRATION_5_6`: `pending_position_closes`, `market_quotes`,
  `position_strategy`, `opt_position_comparisons.optStrategyType`; exported `6.json`; `WipeDao` extended.
  `app/build.gradle.kts` versionCode 6 / versionName 0.6.0 + `applicationVariants` outputFileName
  `TradingTracker-${versionName}.apk`.
- **Scroll capture (§29).** No FLAG_SECURE (none exists). Primary long screens are single LazyColumns
  (Home/Stats/Dividends/Sync/Recon already were; Calendar/Position Detail/Tag list now are). Settings +
  Dividend detail left as verticalScroll (Compose 1.7.5 supports it; converting unverifiable-on-device
  working screens was judged riskier). OEM capture best-effort/experimental, not physically verified.

## Validation

- Gate (heavy queue): **324 JVM tests, 0 failed, 0 errors, 3 skipped** (skips = opt-in real-.xls smoke +
  the 2 opt-in real-quote smokes). `assembleDebugAndroidTest` compiled, `lintDebug` 0 errors,
  `assembleDebug` → `TradingTracker-0.6.0.apk`. `git diff --check` clean.
- New tests: `Migration5To6Test` (additive vs exported 6.json), `StrategyResolverTest`,
  `DayActivityBuilderTest` (OPEN/ADD/REDUCE/CLOSE, both midnight crossings, lifecycle, dividend+trade),
  `MarketQuoteParseTest` (extended-hours + no-baseline + OCC), `CloseAndValuationTest`,
  `PendingCloseReconcilerTest`, `RealQuoteSmokeTest` (opt-in). Fixed `FormattingFoundationRound3Test`
  price assertion to the new trimmed policy.
- **REAL market-data smoke (§26) RAN** (`QUOTE_SMOKE=1`) through the actual `YahooChart` codec over the
  live keyless v8 endpoint: AAPL → current $309.20 / baseline $309.90 / session POST (extended-hours
  selection confirmed live); option `SOFI260925C00020000` → current $0.77, HTTP 200. Source validated.
- APK delivered `/sdcard/Download/TradingTracker/TradingTracker-0.6.0.apk`: 16,486,318 bytes, sha256
  `da2539e5b04cb1e10aaaf0dd94a0d37cbe6d3bba4a780cd2876a1164e3c13f88` (== Gradle output), atomic
  temp+rename; old unversioned `TradingTracker.apk` (v0.5.0) left in place. A `MEDIA_SCANNER_SCAN_FILE`
  broadcast could not reach a framework from PRoot → My Files visibility NOT claimed.

## What remains UNVERIFIED (no ADB device this run)

On-device 5→6 install/data-survival; calendar prior-NY-day openings + inline detail on the real DB;
card→detail→live-quote→close prefill/preset/P&L flow; pending-close reconciliation vs a later real IBKR
sync; an actual Samsung long/scroll screenshot; the sync regression + same-window replay on device.
These are release checks, not claimed. The physically-accepted v0.5.0 IBKR sync is preserved.

## Risks / notes

- Option prior-close baselines for illiquid contracts can equal the last price (0% change) — honest per
  provider, but the option day-% may read flat on thin contracts.
- Strategy for a CLOSED round trip resolves with coveringShares=false (historical shares unknown), so a
  historical covered call may show "Sell Call" unless OPT/override provenance exists.
- Pending-close reconcile runs from `PositionUiProvider.refresh()` (VM init + pull); a background-only
  sync with no positions screen open reconciles on next positions-screen open — acceptable, not instant.

See docs/MARKET_DATA.md, docs/SCHEMA_HISTORY.md (v6), docs/PROJECT_STATE.md, docs/RELEASE_REVIEW.md,
docs/DEVICE_VALIDATION.md, docs/BROKER_SYNC.md (refresh join), docs/OPT_BRIDGE.md (strategy provenance),
TODO.md Round-6 gates.
