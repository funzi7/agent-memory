# trading-tracker — Round 7 handoff (2026-08-26)

Project HEAD: `25adf4d1f7729930c9b9526da662eadc9eeee753` (origin/main, pushed + remote-verified)
Starting project HEAD: `88206c9dafa0ff7f2cf5f6132e62130d28b45e08`
Repo: `github.com/funzi7/trading-tracker` · package `com.funzi7.tradingtracker` ·
app `0.7.0` / versionCode `7` · Room schema `7`

Round 7 = financial-correctness + runtime-UX. Broker-authoritative realized P&L (fixes the physical
MULL error), signed broker commissions, a realized-P&L audit + commission breakdown, an explicit
live-quote state model, an All-Open-Positions screen, calendar gesture fixes + a Today control, and
granted-location OPT monitoring. Additive Room 6→7. Traced end-to-end (main-loop reads; the 4 spawned
subagents hit a session cap and returned partial — the realized-P&L area was fully re-derived here).

## What shipped

- **Broker-authoritative realized P&L (§5–§8).** ROOT CAUSE: IBKR `fifoPnlRealized` is a **GROSS**
  price P&L (commissions EXCLUDED — confirmed by `OptReconciler.explainedByCommission`, where broker −
  TT-net ≈ total commissions). It was parsed + persisted on `executions.brokerFifoPnlMicros` since v1
  but `LedgerRepository.toDomain` never propagated it, so realized P&L was purely LOCAL FIFO net
  (`gross − open − close commission`) → MULL showed `+$52.53` vs IBKR `+$55.47` (Δ = the $2.94
  commissions). FIX: `ExecEvent` gained `brokerFifoPnlMicros`/`signedCommissionMicros`/`grossCashMicros`/
  `hasEconomicOverride`; `LotMatcher` distributes a closing execution's single `fifoPnlRealized`
  across the slices it closed (qty-proportional, remainder on last → summed exactly once), sets
  `ClosedSlice.resolvedPnlMicros`/`pnlSource`/`brokerFifoPnlMicros` (derived, NOT persisted). Hierarchy:
  IBKR → IBKR_DERIVED (gross from signed broker proceeds when fifo field absent) → LOCAL (fallback +
  manual + any economic override). `RoundTrip.realizedPnlMicros` = Σ selected; `localRealizedPnlMicros`/
  `brokerRealizedPnlMicros`/`pnlReconciliationDeltaMicros` for the audit. NEVER re-subtract commission
  from the IBKR value (§11).
- **All realized-P&L consumers switched to `selectedPnlMicros`** (§7): StatsEngine (daily/range/net),
  StatsScreen (FX-converts resolvedPnlMicros too — key gotcha, see gotchas.md), HomeScreen, CalendarScreen
  (daily + gains/losses), DayActivity.ClosingEvent, DayDetailScreen, ExcelExporter (+ new audit columns),
  PendingCloseRepository. `RoundTrip.realizedPnlMicros` consumers (TradeCard/TagPositions/PositionDetail/
  TradeDetail) auto-updated. Legacy day-cell reconciliation deliberately stays on LOCAL net.
- **Signed commissions (§9/§10).** `executions.signedCommissionMicros` (additive, nullable). Normalizer
  keeps `commissionMicros = abs(ibCommission)` (FIFO cost) AND `signedCommissionMicros = ibCommission`
  (audit). `CommissionBackfill` (startup, TradingTrackerApp.onCreate) fills existing BROKER rows from
  the immutable RAW payload — idempotent (NULL-only), exact via `Micros`. Backup ExecutionB round-trips it.
- **Breakdown + audit (§11/§12).** `ui/components/PnlBreakdown` (PnlBreakdownCard + SlicePnlDetail) in
  TradeDetail: gross, open/close/total commission, IBKR vs LOCAL realized, delta, selected + source, raw
  SIGNED commissions in an expandable audit block. `ui/reconcile/PnlReconScreen` (Settings → ביקורת רווח
  ממומש) lists broker trades where IBKR ≠ local; totals still use the authoritative value.
- **Quote state model (§13–§17).** `data/quote/QuoteStatus` (QuoteStatus enum + QuoteStatusResolver,
  pure/tested) + `QuoteView` on every `PositionUi`. `NyTime.equityMarketPhase`/`optionsMarketPhase`
  (options = REGULAR only, no pre/post). `QuoteRepository` tracks per-key `QuoteOutcome`
  (observeOutcomes, in-memory), classifies IOException(network) vs HTTP/empty(provider), and retries
  `range=2d` only when `1d` yields no usable price. Card/detail render a distinct honest label; the old
  single "מחיר חי לא זמין כרגע" collapse is gone.
- **All Open Positions (§18–§20).** `ui/positions/OpenPositionsScreen` + `OpenPositionsViewModel`
  (PositionUiProvider). Home פוזיציות פתוחות TCard is now `onClick=onOpenAllPositions`. Sort/filter via
  rememberSaveable + rememberLazyListState (survive Back), FlowRow chips (no horizontal scroll), reuses
  `PositionCard`. Routes `OpenPositionsRoute`/`PnlReconciliationRoute` added to AppRoot + refreshable.
- **Calendar (§22–§24).** Arrows wrapped in `CompositionLocalProvider(LayoutDirection.Ltr)` so
  left=previous / right=next (auto-mirrored icons render un-mirrored in the LTR scope); swipe via
  `detectHorizontalDragGestures` on the LazyColumn (RIGHT→next, LEFT→prev; horizontal slop = orientation
  lock); sticky `היום` FilledTonalButton (Box overlay) → `goToToday()` (month=now, select today).
  Inline day journal + VM-held month/selectedDate preserved.
- **OPT monitor (§27–§31).** `opt_source_monitors` + `data/optbridge/OptSourceMonitor`
  (DocumentsContract, no extra dep). grantFolder/grantDocument persist SAF read permission;
  checkForNewer scans newest *.json (opt_backup_* preferred) and imports only when doc-id/lastModified/
  fingerprint changed. Wired to MainActivity.onStart + OptComparison UI (grant folder / check now /
  remove). ImportSummary now carries `fileFingerprint`. Confirmed OPT publishes NO consumable interface
  (FileProvider exported=false; auto-backup → app-private getExternalFilesDir/auto_backups).

## Validation

- Gate (heavy queue): **350 JVM tests, 0 failed, 0 errors, 3 skipped** (opt-in real-.xls + 2 real-quote
  smokes). Lint **0 errors** (26 warn, 1 hint). `assembleDebugAndroidTest` compiled. `assembleDebug` →
  `TradingTracker-0.7.0.apk`. `git diff --check` clean. New tests: `RealizedPnlResolverTest` (MULL
  fixture + double-count + flip + multi-close + fallback + manual + override + IBKR_DERIVED),
  `CommissionSignTest`, `QuoteStatusTest` (full state matrix + NY hours), `Migration6To7Test` (vs
  exported 7.json). NOTE: nullable-Long assertEquals needs an `L` suffix (Int-vs-Long boxing trap).
- **REAL market-data smoke RAN (§45).** 2026-08-26 05:21 EDT: `MULL260918P00015000` 1d → HTTP 200,
  regularMarketPrice 0.5, previousClose 0.5, empty candles → `Quote(0.50, CLOSED)` → UI "$0.50 · שוק
  סגור" (the exact reported-bug fix). AAPL 1d → 309.9, 77 candles, live. 2d fallback available/unneeded.
- APK delivered `/sdcard/Download/TradingTracker/TradingTracker-0.7.0.apk`: 16,584,622 bytes, sha256
  `35aa5c68221dba3f053baad8bbdf325996e6addc31262c2579e0dafd7ccc60b9` (== Gradle output); 0.6.0 + old
  unversioned APK kept.

## MULL P&L evidence (sanitized fixture reproduces the shape)

open SELL 2 MULL Sep18 $15P @0.83 (comm 0.73), close BUY 2 @0.56 (comm 0.74, fifoPnl=55.47).
LOCAL gross=(0.83−0.56)×2×100=54.00; LOCAL net=54.00−0.73−0.74=52.53; SELECTED=IBKR 55.47;
Δ=2.94=commissions; source=IBKR. (Real prices/commissions differ; the fixture matches the DISPLAYED
$52.53 vs $55.47 headline. fifoPnl==gross is the confirmed real relationship.)

## NOT physically verified (no ADB device this run) — release blockers

`adb devices` empty; `/data/data/com.funzi7.tradingtracker` inaccessible. NOT done: 5→7 install +
data-survival; live sync showing MULL `+$55.47` on Calendar/Home/Stats/detail + the breakdown + the
IBKR-vs-local audit on real data; signed-commission RAW backfill on the real DB; quote states on the
real device; OPT monitor auto-import of a newer real export; same-window replay; **physical Samsung
long screenshot**. The v0.6.0 physically-accepted behavior is preserved.

## Scroll capture (§32–§35) — blocked, NOT physically verified

Native long-screenshot support for Compose scroll containers landed in **Foundation 1.8.0-alpha01**
(ScrollCaptureCallback). Project is on **compose-bom 2024.11.00 = Foundation 1.7.5** → no app-side code
enables it. No FLAG_SECURE; primary long screens are single scroll containers (ready). Fix = bump
compose-bom to ≥ a Foundation-1.8 version, then re-gate + physically confirm on Samsung. DEFERRED:
unvalidatable-without-device dependency bump; must not risk the working install. Physical test NOT done.

## Risks / notes

- IBKR_DERIVED uses signed broker proceeds (SELL +, BUY −) summed to a gross; gated on both legs having
  proceeds; else LOCAL. Rare in practice (fifoPnl usually present).
- Legacy reconciliation intentionally keeps LOCAL net day-cells (matches the old journal's net records);
  documented in PROJECT_STATE (§7 carve-out).
- OPT monitor scans only the granted folder's direct children; OPT's private auto-backup dir is NOT
  readable, so the user must export/place backups into the granted shared folder.

See docs/PROJECT_STATE.md (R7), docs/SCHEMA_HISTORY.md (v7), docs/MARKET_DATA.md (quote states),
docs/BROKER_SYNC.md (realized-P&L authority), docs/OPT_BRIDGE.md (monitor + OPT-side limits),
docs/DEVICE_VALIDATION.md, docs/RELEASE_REVIEW.md, TODO.md (R7 gates), agent-memory gotchas.md/state.md.
