# Trading Tracker — Architecture

> Update only when architecture itself changes.
> Verified against codebase: 2026-08-25 (Round 4, app 0.4.0 / schema 4).

## Stack

- Kotlin · Jetpack Compose · Material 3 · Room · WorkManager · Hilt (KSP, no kapt) ·
  OkHttp · kotlinx.serialization · Apache POI (HSSF read-only, legacy .xls import).
- Java 17. minSdk 26, target/compileSdk 36.
- Package/namespace/applicationId: `com.funzi7.tradingtracker`.
- Repo `funzi7/trading-tracker`, default branch `main`. Every round has been committed
  directly to `main` (no PR branch); commits use conventional prefixes.
- Hebrew-first RTL app. Tickers, money, quantities, percentages, dates, times all
  render as LTR machine values via `ui/components/Fmt.kt` + `core/text/MachineFragment`.

## Module map (main source)

- `core/` — `money/Micros` (fixed-point, 6-dp micros; 1.0 == 1_000_000),
  `time/NyTime` (America/New_York trading dates, strict `dd/MM/yyyy`), `util/Ids`
  (`Ids.uuid`, `Ids.deterministic`, and `Hashing.sha256Hex` — both objects live in
  `core/util/Ids.kt`).
- `domain/` — pure models: `model/Models.kt` (Instrument, RoundTrip, OpenPosition,
  enums AssetType/PutCall/Direction/Side/ExecKind), `lots/LotMatcher` (FIFO, the single
  source of realized P&L → `LedgerView{roundTrips, slices, openPositions}`),
  `stats/StatsEngine` (TickerStats), `positions/CurrentPositions` (broker-truth resolver
  + PositionDiagnostic).
- `data/db/` — Room. `AppDatabase` (version 4, exportSchema), `Entities`, `Daos`,
  `Migrations` (MIGRATION_1_2, _2_3, _3_4; all additive, no destructive fallback).
- `data/sync/` — IBKR Flex. `FlexHttp` (SendRequest/GetStatement, deadline-aware),
  `FlexParser` (FlexQueryData/FlexStatementData/FlexRow), `FlexNormalizer` (pure
  normalization + semantic hash), `FlexIngest` (transactional idempotent apply →
  IngestResult{counts, issues}), `FlexSyncEngine` (orchestration + IncrementalSyncPolicy),
  `BrokerRefreshCoordinator` (single-flight, SyncStage, BrokerRefreshProgress, NY 21:00
  scheduling), `NetworkStateProvider`, `SyncRunRecovery`.
- `data/optbridge/` — OptionsProfitTracker comparison bridge (Round 4): `OptBackupModel`
  (allowlist), `OptBackupCodec` (safe parse), `OptReconciler` (pure classifier),
  `OptImportManager` (SAF read + reconcile + persist).
- `data/repo/`, `data/fx/`, `data/dividend/`, `data/secrets/` (Keystore-backed
  credentials), `data/legacy/`, `data/backup/`.
- `ui/` — Compose screens; nav via type-safe `ui/nav/Routes.kt` + `ui/AppRoot.kt`.
- `di/AppModule.kt` — Room + migrations + interface bindings (e.g. NetworkStateProvider).

## Core invariants (do not regress)

- America/New_York is the DST-correct trading-date and daily-sync authority; device
  timezone is never consulted.
- A valid IBKR Open Positions snapshot is current-position truth; FIFO executions are
  realized-history truth. RAW broker rows and originals are immutable; user corrections
  are separate Layer-C overrides that survive resync.
- Dividends stay separate from Trading P&L and Win Rate.
- Persisted money/price/quantity use fixed-point micros; percentages and dividend
  evidence use BigDecimal. Mixed-currency totals need consistent FX or show unavailable.
- Money **totals** render exactly 2 dp; UI percentages exactly 1 dp; unit
  prices/premiums/per-share/quantities/FX keep sub-cent/high precision. Internal micros
  are never rounded by presentation (see `Fmt` MONEY_PATTERN vs price/perShare/decimal).
- Credentials, local databases, statements, notification receipts, and APKs are excluded
  from source control.

## Build / validation

- Heavy Gradle work MUST go through `/root/work/bin/heavy-run -- <cmd>` (global flock).
  Gate: `testDebugUnitTest assembleDebug assembleDebugAndroidTest lintDebug`.
- Room schemas exported to `app/schemas/com.funzi7.tradingtracker.data.db.AppDatabase/`;
  `N.json` is committed and is part of the release contract.
