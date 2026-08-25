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
