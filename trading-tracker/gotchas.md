# Trading Tracker — Gotchas

> Non-obvious things that will bite a future agent. Verified 2026-08-25.

## Environment / workflow

- **Heavy builds MUST use `/root/work/bin/heavy-run -- <cmd>`** (global flock, one at a
  time). Never bypass or kill another build. A cold Android build can exceed 10 min — run
  it in the background and poll the log, don't block.
- Trailing `echo "GRADLE_EXIT=$?"` makes the background command exit 0 even when gradle
  failed — always read the real GRADLE_EXIT / `BUILD SUCCESSFUL|FAILED` from the log, not
  the task-notification exit code.
- **No ADB device is attached** in this env (`adb devices` empty), so instrumented/device
  tests, `adb install`, and live IBKR/UI validation cannot run headlessly. androidTest
  only compiles.
- BUT the host IS an Android device (PRoot/Termux): **`/sdcard` is directly accessible**.
  Deliver the APK by plain `cp` to `/sdcard/Download/TradingTracker/TradingTracker.apk`.
  Real OPT backups live in `/sdcard/Download/opt_backup_*.json` — usable for §32, but they
  contain REAL secrets: never print/log their contents; only safe aggregates.
- Data-safety hard rules (owner's real IBKR data is installed): never `git reset/clean/
  restore/stash`, force-push, destructive Room migration, uninstall, `pm clear`, or delete
  broker history. Migrations must be additive. Preserve unrelated local changes.
- agent-memory: write files under `/root/work/agent-memory/trading-tracker/`, then run
  `/root/work/bin/agent-memory-finalize "<msg>"` from inside the project repo. Do NOT git
  in agent-memory directly. The dir must exist before finalize (create it first).

## Sync / ingest

- Dedup is by `(recordType, dedupKey)` where dedupKey prefers a broker UID (Trades:
  ibExecID/tradeID/transactionID). A change to a volatile field keeps the same dedupKey →
  it's a *restatement*, not a new row.
- `contentHash` = sha256 of the whole canonical RAW payload (flips on ANY attr, incl.
  mark price / fxRate / fifoPnlRealized / proceeds / reportDate). `semanticHash` =
  sha256 over normalized ECONOMIC fields only (`FlexNormalizer.semanticKeyOf`). Restatement
  is `financialChanged` iff old semanticHash != new; else `metaOnly`. This is the whole
  fix for "Updated:36". `semanticHashForPayload(section, payloadJson)` recomputes it from a
  stored RAW row via `parseCanonicalPayload` (the exact inverse of `canonicalPayload`).
- The incremental checkpoint is DERIVED from `sync_runs.periodTo` (newest SUCCESS+CURRENT)
  — there is intentionally NO checkpoint column. PARTIAL/BACKFILL/FAILED never advance it.
- `FlexIngest.apply(...)` returns **IngestResult{counts, issues}**, not IngestCounts. (A
  mismatched return type here was a real compile bug caught in Round 4.) Callers use
  `.counts.new` etc.
- Only a genuine financial ERROR → PARTIAL. UNSUPPORTED/WARNING (audit-only, non-financial)
  must never force PARTIAL. If a "1 error" is legit IBKR data, fix the PARSER, don't
  downgrade the diagnostic.

## Presentation

- `Fmt.money*` = 2 dp (MONEY_PATTERN "#,##0.00"); `Fmt.percentValue`/`percent` = 1 dp;
  `Fmt.price*`/`perShare`/`decimal`/`qty` keep sub-cent/high precision. Do NOT unify these.
  Export uses `toPlainString()` so 1-dp UI never reduces export precision.
- `StatsScreen.formatWinLoss(wins, losses)` returns **"$losses/$wins"** on purpose (RTL:
  under the "נצ/הפ" heading the visual right-hand number must be wins). There is a KDoc
  saying DO NOT flip it back. Heading string stays exactly "נצ/הפ".

## OPT bridge

- OPT serializes with Gson, **no field-naming policy** → JSON keys == camelCase property
  names verbatim (note `realizedPnL`, capital L). `serializeNulls()` emits nulls → the codec
  uses `coerceInputValues`. OPT enums serialize by `.name` (CALL/PUT, SELL/BUY, OPEN/
  CLOSED_BTC/EXPIRED/ASSIGNED/ROLLED/DRAFT, USD) → model fields are `String?`.
- Security is by allowlist + `ignoreUnknownKeys=true`: OPT v4 backups carry 12+ secret keys
  (flexToken, flexQueryId, finnhubKey, massiveApiKey, alphaVantageKey, tradierKey,
  rapidApiKey, marketDataKey, perplexityKey, openAiKey, anthropicKey, geminiKey, aiApiKey,
  alpacaApiKey, alpacaSecret) + opaque caches (stockSyncSnapshot, ivCacheJson, …). None are
  declared, so none are ever bound. `OptImportManager` never persists raw JSON (only a
  fingerprint + counts + comparison rows). OptBackupCodecTest has a reflective guard that
  the model declares no secret-shaped field — it uses **Java reflection**
  (`::class.java.declaredFields`), NOT kotlin-reflect (`memberProperties`), which is not on
  the test classpath.
- OPT `portfolioHistory` cash=0.0 always; the `cash` field is deliberately NOT declared.
  It is comparison-only, never authoritative, never drives the dividend 25/30 rule.

## OPT repo (funzi7/OptionsProfitTracker at /root/work/OptionsProfitTracker)

- READ-ONLY. Never edit/commit/build/install it. Its installed signing cert ≠ phone debug
  keystore, so all cross-app integration must live entirely in trading-tracker.
- Backup shape: `com.dima.optionstracker.data.BackupService.BackupData` (schema v4);
  entities `PositionEntity`/`PortfolioHistoryEntity`/`PortfolioEventEntity`.
- The owner's real full backup is at `/sdcard/Download/TradingTracker/opt_backup_2026-08-25.json`
  (NOT directly in `/sdcard/Download/`, where only older ones live). `RealOptBackupSmokeTest` reads
  it (system property `OPT_BACKUP` overrides) and skips if absent. It contains 13 secrets; only
  sanitized aggregates are ever printed.

## Round 5 (sync + OPT correctness)

- **The 365-day replay** came from the checkpoint being null-derivable: no `SUCCESS+CURRENT` →
  `currentPlan` bootstrap → null fd/td → the Flex query's configured ~365-day period, and PARTIAL
  never advances the checkpoint. Fix lives in `FlexSyncEngine.resolveCurrentAnchor()` + the
  `SyncAnchor` sealed type. **Only `SyncAnchor.Bootstrap` (a truly empty broker DB) may use null
  fd/td.** The recovery anchor is DERIVED from `broker_position_snapshots.reportDate` /
  `portfolio_snapshots.reportDate` (new DAO `latestSnapshotReportDate`/`latestReportDate`) — no column.
- `NyTime.latestCompletedActivityDate(now)`: before 21:00 NY → prev completed date; ≥21:00 → today;
  weekends walk back. 21:00 ET is an *earliest attempt* (securities cutoff 20:20 ET); the broker
  response `toDate` (`data.toDate` → `canonicalTo`) is authoritative and can be earlier. Never device TZ.
- **The physical `errors=1`** was IBKR OpenPositions **lot detail**: SUMMARY + repeated LOT rows share
  an instrument key → the old duplicate-key guard → INVALID → snapshot not replaced → new positions
  missing. `PositionSnapshotEvaluator.collapseByLevelOfDetail` keeps SUMMARY (or net-aggregates LOT)
  before the guard. `NormalizedRecord.Position` gained `levelOfDetail`. Keep the non-`OpenPosition`
  element guard (fail-closed).
- **The ~12,207 warnings** were unhandled Flex sections (ConversionRates, AccountInformation, …). The
  `FlexNormalizer` else-branch now tags them `"audit-only: section … not ingested"`, which
  `FlexIngest.issueSeverity` maps to UNSUPPORTED (not WARNING), so they don't inflate `rowsWarned`.
- `runPlan` continues past a deterministic PARTIAL window so the final CURRENT window still runs
  (Open Positions/checkpoint advance). A PARTIAL still doesn't satisfy the daily obligation.
- **OPT reconciler v2 is over `RoundTrip`s** (already flat-to-flat, carry `source`/opened-closed
  micros/realized/commissions). Filter `source == BROKER && type == OPTION`. OPT rows fold into
  episodes by open date; CLOSED and OPEN reconcile separately per `(contractKey, direction)`. The
  ONLY reliable IBKR-provenance signal is `ibkrRealizedPnl != null` (sparse); `syncSource` is NOT
  (MANUAL/IMPORTED/TRADESTATION, no IBKR value). Micros: 1 option contract = 1_000_000 micros.
- `stockSyncSnapshot` is now DECLARED in `OptBackup` as `String?` and parsed by `OptStockCodec`
  (transient, never persisted). It is non-secret. `OptBackupCodecTest`'s reflective guard bans field
  names containing token/key/secret/cash/… — `stockSyncSnapshot` passes (no banned substring). The
  summary-export path needs `OptBackupCodec.parse` to NOT reject `version<=0 && empty` when summary
  markers (`exportDate`/`nav`/`holdingsValue`/`openPositions`) are present.
- Room v5: `Migration4To5Test` validates against exported `5.json` (generated at build). Additive
  columns must match the entity `@ColumnInfo(defaultValue=…)` exactly (Boolean→INTEGER DEFAULT 0).
