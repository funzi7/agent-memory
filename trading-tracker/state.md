# Trading Tracker — Current state

> Verified: 2026-08-25. App 0.4.0 (versionCode 4), Room schema 4.
> HEAD after Round 4: 317db7a17a11e5193c3cc9a28cd7583fa0b53747 (parent bc1d683).

## Rounds

- R1: broker-first ledger, IBKR Flex sync, legacy import, full Hebrew RTL app.
- R2: dark-theme readability, stale-ticker removal, notification permission (owner-accepted).
- R3 (bc1d683): broker truth, dividend alerts/evidence, FX, NAV, daily NY 21:00 scheduling,
  pull-to-refresh, presentation rules, per-ticker stats. Room 2→3 (`sync_runs.operation`).
- R4 (317db7a): this round — below.

## Round 4 (2026-08-25) — what shipped

- **Incremental sync.** `IncrementalSyncPolicy` (pure): routine CURRENT pulls a 7-day
  overlap window `[checkpoint-6, today]` derived from newest SUCCESS+CURRENT `periodTo`
  (`SyncRunDao.latestCurrentSuccessToDate`), NOT 365 days. First-ever sync bootstraps
  (null fd/td). Gaps + explicit Full History Audit split into ≤365-day windows, only the
  final window is CURRENT. Checkpoint is DERIVED (no new column) → upgraded installs stay
  incremental.
- **Lifecycle.** 5-min `withTimeout` per window → TIMEOUT finalized under NonCancellable;
  offline fast-fail (`NetworkStateProvider`, fail-open); honest `SyncStage` progress +
  live elapsed, no fake %; terminal result always persisted; `SyncRunRecovery` finalizes
  orphaned RUNNING → INTERRUPTED at startup. Statuses now RUNNING|SUCCESS|PARTIAL|FAILED|
  TIMEOUT|INTERRUPTED.
- **Restatements.** `StagedRecord.semanticHash` (economic fields only) vs RAW payload
  `contentHash`. Ingest splits a restatement into `rowsFinancialChanged` vs `rowsMetaOnly`
  — fixes the phantom "Updated:36" (mark price/fx/fifo-pnl/report date are meta-only).
- **Diagnostics.** `sync_run_issues` — sanitized, class-collapsed, severity
  ERROR/WARNING/UNSUPPORTED. Only a genuine financial ERROR forces PARTIAL. No Token /
  full account id / raw XML stored.
- **Presentation.** Money 2 dp, UI % 1 dp; the "+$71,271.502186" bug fixed; BTCI
  ~29.99682% → "30.0%". `נצ/הפ` heading unchanged, value = losses/wins (RTL-visual right
  number is wins): EWY 0/5, MULL 7/11, SOFI 2/16, PLUG 4/17.
- **OPT bridge.** Comparison-only import of an OptionsProfitTracker backup (Settings →
  "אימות מול מעקב אופציות"). Allowlist drops all secrets; raw JSON never persisted;
  `OptReconciler` classifies STRONG_MATCH/PROBABLE_DUPLICATE/CONFLICT/ONLY_IN_OPT/
  ONLY_IN_TT; broker truth never overwritten; OPT portfolioHistory (cash=0.0) never drives
  cash or 25/30. Tables opt_import_runs, opt_position_comparisons.
- **Room 3→4** additive migration; exported `4.json` committed.

## Validation (Round 4)

- Gate green via heavy-run: **262 JVM tests, 261 passed, 0 failed, 1 skipped** (skip =
  opt-in real legacy-file smoke, LEGACY_XLS not supplied). Lint 0 errors / 24 warn / 1 hint.
  `assembleDebug` + `assembleDebugAndroidTest` pass. `git diff --check` clean.
- New tests: IncrementalSyncPolicyTest, SemanticRestatementTest, OptReconcilerTest,
  OptBackupCodecTest, Migration3To4Test (host); SyncLifecycleRecoveryTest,
  RestatementClassificationTest (device, compiled only).
- OPT real-file check (§32): a real schema-v4 backup on device (224 positions, 261 history
  rows, 48 top-level keys) parsed through the allowlist — all **12 secret keys dropped**,
  no secret bound, every history `cash=0.0`. No secret value printed.
- APK delivered to `/sdcard/Download/TradingTracker/TradingTracker.apk`
  (16,240,558 bytes, sha256 ba2db6cb…fea149), debug-signed.

## Known gaps / next

- No ADB device attached this run → on-device install/data-survival, live same-period
  replay, the timeout/recovery behaviors, the OPT import UI, and visual/date acceptance are
  UNVERIFIED (release blockers). See docs/DEVICE_VALIDATION.md + docs/TODO.md Round-4 gates.
- Owner's real BTCI/dividend counts remain physically unverified (no DB access).
- Deferred: direct OPT↔TT bridge (ContentProvider/Intent) — needs OPT-side changes and a
  shared signing model; OPT's installed cert ≠ phone debug keystore, so cross-app runtime
  binding is not currently possible. Stays comparison-only. See docs/OPT_BRIDGE.md.
