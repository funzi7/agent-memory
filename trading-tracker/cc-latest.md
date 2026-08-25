# trading-tracker — Round 5 handoff (2026-08-25)

Project HEAD: `d1f71c7024aa2b875b6c4ea1042aea7aaac482d5` (origin/main, pushed and remote-verified)
Starting project HEAD: `317db7a17a11e5193c3cc9a28cd7583fa0b53747`
Repo: `github.com/funzi7/trading-tracker` · package `com.funzi7.tradingtracker` ·
app `0.5.0` / versionCode `5` · Room schema `5`

Round 5 is a broker-synchronization-correctness + OptionsProfitTracker-reconciliation-correctness
release. Root causes were traced end-to-end (4 read-only subagents) before any edit.

## Broker sync — what shipped

- **365-day replay root cause + fix (§6).** Round 4's checkpoint derived only from `SUCCESS+CURRENT`
  `periodTo`; with broker data present but every recent run `PARTIAL`, that was null → `currentPlan`
  bootstrap → **null fd/td → the query's ~365-day period**, never advanced by the `PARTIAL` → an
  infinite replay (≈13,795 dup rows, ≈12,207 warnings). Fix: `FlexSyncEngine.resolveCurrentAnchor()`
  + `SyncAnchor` (Checkpoint → Recovery(snapshot/portfolio report date) → BoundedRecovery 30-day →
  Bootstrap). A null window is used ONLY for a truly empty broker DB; a DB/parse fault degrades to
  recovery. Recovery mode surfaces in progress + the run message and ends on the first CURRENT success.
- **Completed-Activity date (§7).** `NyTime.latestCompletedActivityDate(now)` — before 21:00 NY the
  previous completed date, at/after 21:00 today, weekends walk back to the last weekday. 21:00 ET is
  the earliest-attempt boundary (US securities statement cutoff is 20:20 ET; IBKR Activity is final
  once daily at close of business — verified vs current docs by subagent B). Device TZ never used.
  The broker-echoed response `toDate` stays authoritative (can lag the requested `td`).
- **Incremental window (§8).** `IncrementalSyncPolicy.currentPlan(anchor, latestCompleted)` →
  `[anchor-6, latestCompleted]` explicit fd/td (7-day overlap), ≤365-day split only for huge gaps.
- **Checkpoint advancement (§9).** Only a valid CURRENT advances `periodTo`; PARTIAL preserves rows
  but retries a bounded overlap; FAILED/TIMEOUT never advance. `runPlan` no longer abandons the final
  CURRENT window when an earlier window is a deterministic PARTIAL (Open Positions still advances).
- **The one physical error (§15).** It was a legitimate lot-detail OpenPositions section rejected as
  duplicate instrument keys. `PositionSnapshotEvaluator.collapseByLevelOfDetail` now keeps SUMMARY (or
  net-aggregates LOT) per instrument before the duplicate-key guard; the malformed-non-`OpenPosition`
  guard is retained. On genuine failure the prior snapshot is kept + `פוזיציות פתוחות לא עודכנו — Open Positions נכשל`.
- **Warning explosion (§16).** Unhandled Flex sections are tagged `audit-only` → `UNSUPPORTED`
  (`FlexNormalizer` else-branch), so they no longer inflate `warned`. UI header shows `N types · M occurrences`.
- **Visibility (§13/§14).** New DAO queries `observeLatestAttempt`/`observeLatestSuccessfulCurrent`;
  Settings + Sync screens show last attempt (status/period/message) vs last successful CURRENT sync
  (broker-confirmed date). Diagnostics bind to the newest TERMINAL run (not a fresh RUNNING) and always
  render for a non-SUCCESS attempt, with a terminal-message fallback. `BrokerRefreshProgress` gained
  `recovery` + `confirmedToDate`; the engine persists a fallback issue when a PARTIAL has no issue rows.

## OPT bridge — what shipped

- Rewrote `OptReconciler` to a **lifecycle/episode model** over `RoundTrip`s (which are already
  flat-to-flat, carry `source` BROKER/MANUAL, opened/closed micros, realized, commissions):
  broker-only TT scope; OPT rows folded into episodes by open date; reconcile CLOSED and OPEN
  aggregates per `(contractKey, direction)`; one-OPT-lifecycle↔many-TT-slices and reopened episodes;
  P&L-delta attribution (commissions/aggregation) before CONFLICT; freshness `NEWER_IN_OPT` vs a
  derived TT high-water; provenance = `ibkrRealizedPnl != null` only.
- **Stocks (§27):** `OptStockCodec` parses OPT's non-secret `stockSyncSnapshot` JSON string
  (ticker→shares/avgCost) transiently, reconciled against the TT broker stock snapshot. Raw string
  never persisted/logged/fingerprinted.
- **Dual formats (§28):** full backup → full reconciliation; summary export (`exportDate`/`nav`/
  `openPositions`) → PARTIAL, labeled, no history claims. `OptBackupCodec.isSummaryOnly`.
- **UI (§30):** per-row field-level reasons (OPT vs TT contracts/P&L/Δ, Hebrew reason), NEWER badges,
  stock rows. Schema 4→5 additive: `opt_import_runs` (+newerInOpt/newerInTt/stockComparisons/partial),
  `opt_position_comparisons` (+assetKind/ttContracts/ttRealizedPnlMicros/pnlDeltaMicros/reason).

## Validation

- Gate (heavy-run): **284 JVM tests, 284 passed, 0 failed, 1 skipped** (skip = opt-in real `.xls`
  smoke, `LEGACY_XLS` not supplied). Lint **0 errors** / 24 warn / 1 hint. `assembleDebug` +
  `assembleDebugAndroidTest` pass. `git diff --check` clean.
- New/rewritten tests: `CompletedActivityDateTest`, `IncrementalSyncPolicyTest` (recovery),
  `PositionSnapshotRound5Test` (levelOfDetail collapse + audit-only), `OptReconcilerTest` (lifecycle),
  `OptBackupCodecTest` (stock parse + dual-format), `Migration4To5Test`, `RealOptBackupSmokeTest`.
- **Real OPT backup smoke (§32/§39) RAN** against `/sdcard/Download/TradingTracker/opt_backup_2026-08-25.json`
  through the actual Kotlin allowlist codec + stock parser + reconciler: schema 4, 257 positions, 320
  history rows (all cash=0.0), status OPEN 9 / CLOSED_BTC 203 / ASSIGNED 43 / EXPIRED 2, 191 with
  IBKR-provenance, **8 stocks parsed**, 261 deterministic comparison rows; all **13 secret keys** and 38
  undeclared top-level keys dropped, no secret/value printed. The 9 OPEN positions match the owner's
  "~9 recent options" freshness delta.
- APK delivered to `/sdcard/Download/TradingTracker/TradingTracker.apk`: 16,289,710 bytes, sha256
  `9c834c36cfedd47a736dfd6f97fa306199c935e7924a1044666503e51b2b3b9e` (== Gradle output), atomic
  temp-copy+rename, current mtime.

## Real broker integration + requested/confirmed window + same-window replay

- **NOT performed** — `adb devices` empty. No live IBKR sync, so no real requested/confirmed date
  window and no same-window replay were observed. A real authenticated IBKR integration smoke could
  not be run safely (must not extract the Flex token from the OPT backup). This is a release blocker.

## Remaining real conflicts / what remains UNVERIFIED (release blockers)

- The **TT side of the OPT full comparison** needs the installed IBKR ledger via ADB; only the OPT side
  was validated headlessly. The 37→reduced conflict outcome, false-ONLY_IN_TT elimination, and the
  NEWER_IN_OPT/stock deltas are proven in unit tests + on real OPT data, but not against the owner's
  real TT ledger.
- On-device: 4→5 migration data survival, a live incremental sync proving the explicit 7-day window +
  completed/broker-confirmed date (not 365), the fixed lot-detail snapshot accepting new positions,
  diagnostics/last-attempt UI, same-window idempotency, WorkManager/pull, and visual/date acceptance.

## Risks

- Completed-date 21:00-ET boundary is an *earliest attempt*, not a guarantee; mitigated by trusting the
  broker `toDate` + the self-healing 7-day overlap. If IBKR returns not-ready at 21:00, next run heals.
- `ibkrRealizedPnl != null` as the only IBKR-provenance signal is sparse (assignments/expiries/open have
  null realized → structure-only compare). OPT episode grouping by open date is a heuristic; the
  aggregate-reconciliation fallback prevents false ONLY on lumping/decomposition.

See docs/BROKER_SYNC.md, docs/OPT_BRIDGE.md, docs/SCHEMA_HISTORY.md (v5), docs/DEVICE_VALIDATION.md,
docs/TODO.md Round-5 gates.
