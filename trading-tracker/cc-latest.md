# trading-tracker — session 2026-08-22 (Claude Code)

Project HEAD: `e7310849b6d9248d23895bcf264c12114eaf2f35` (origin/main, pushed)
Repo: github.com/funzi7/trading-tracker · pkg `com.funzi7.tradingtracker`

## What was done (empty repo → working app, 98 files / 13,948 lines)

- Full native Android app: Kotlin 2.2.10 / AGP 8.13.2 / Gradle 8.14.3 wrapper /
  Compose BOM **2024.11.00** / M3 / Room 2.8.4 / Hilt **2.58** / hilt-nav 1.2.0 /
  nav 2.8.3 / activity 1.9.3 / lifecycle 2.8.6 / POI 5.5.1 (HSSF only) / OkHttp
  4.12.0 / minSdk 26 / compileSdk 36 / Heebo variable font bundled (OFL).
- Broker-first 3-layer model: raw_broker_records (verbatim payload, dedup key,
  content hash, prev-payload archive) → executions/dividends ledger → user
  metadata (per-field overrides w/ originals kept, journal לפני/אחרי/רגשות, tags).
- Pure-JVM financial core: NyTime (America/New_York authority), Micros (Long ×1e6),
  LotMatcher (FIFO, per-slice NY close-date, exact commission conservation, flips,
  expiration/assignment lifecycle), StatsEngine (dividends structurally excluded),
  Reconciler (day-cell scoring: date 25/22/12, ticker 25/20/12, amount 40/28/15,
  option 8; AUTO ≥75 with amount+date guards + margin 15 + bipartite), Planning.
- IBKR Flex per docs fetched 2026-08-22 (docs/research/ibkr-flex-api.md):
  SendRequest/GetStatement, UA required, 1req/s pacing, error map (1012/1013/1015/
  1018/1019… Hebrew hints), fd/td ≤365d windows, 4-year backfill loop; SAX parser
  (OptionEAE container=row quirk); idempotent ingest (keys ibExecID→tradeID→
  transactionID, fp fallback; restatement archives + flags overrides NEEDS_REVIEW).
- Legacy .xls importer verified on the REAL export (see below); backup JSON v1 w/
  SHA-256 manifest + validate-before-REPLACE; hand-rolled real .xlsx export (5 RTL
  sheets); FX open.er-api.com (live-verified) + frankfurter fallback, cached w/
  timestamp; Keystore AES/GCM secrets (never in Room/backup/logs).
- 13 Compose screens (בית/לוח שנה/סטטיסטיקות/הגדרות + daily/trade/sync/recon/
  import/backup/dividends/manual-stock/manual-option), FAB lower-left-in-RTL,
  calendar 6-row months + gold dividend dots, LTR isolation utils for numbers.

## Validation record

- PASSED: `:app:testDebugUnitTest` — **77 tests / 0 failures** (NY/TH/IL/DST time,
  FIFO worked example +196/−102/+396 & conservation, options CSP/CC/expiration,
  flip split, dedup determinism, recon guard rails, legacy grammar quirks, backup
  tamper/version/FK rejection, xlsx package).
- PASSED: `:app:assembleDebug` → app-debug.apk 15.4MB.
- PASSED (real integration): user's actual export `/sdcard/Pnl/22 אוג׳ 25~ 22
  ספט׳ 26.xls` (copy; original untouched) → **362/362 rows, 0 fatal**, range
  2025-10-24→2026-08-20, ΣP&L **$5,061.36**, tickers PLUG25/QQQ20/SOFI17/RIOT16…,
  6 time-unknown, 11 nonstandard-time, 5 dividend-suspect. Required 2 real-world
  parser fixes: **Hebrew-month dates ("02 ינו׳ 2026")** and **lowercase tickers**
  (+ jargon blacklist). Re-runnable: `LEGACY_XLS=… --tests "*RealLegacyFileSmoke*"`.
- NOT physically verified (honest): live IBKR sync (no credentials on device);
  on-device install/launch (adb had no devices — wireless debugging not paired);
  in-app SAF flows; desktop-Excel opening of export. Runbook:
  docs/DEVICE_VALIDATION.md.

## Key decisions / gotchas for next session

- **Pending USER decisions (session was don't-ask mode; STOP checkpoints honored
  via null-actions)**: D1 credentials-in-backup (v1: excluded entirely; optional
  encrypted block reserved in format), D2 broker-record delete/hide (v1: no
  delete UI for broker rows, overrides only; `hiddenByUser` column ready). Options
  with trade-offs: docs/DECISIONS_PENDING.md.
- Version cage: Compose BOM 2026.xx needs AGP 9.1+/compileSdk 37; Hilt ≥2.59
  needs AGP 9 → stayed AGP 8.13.2 + 2024-era UI stack (all cached, builds fast).
  Upgrade path (cached on device): AGP 9.3.1 + Gradle 9.6.1 + Kotlin 2.3.21.
- Flex timestamps parsed as US/Eastern wall time (IBKR statement convention);
  tradeDate is the NY date key. Cancels ("Ca.") normalize via quantity sign flip.
- v1 simplifications vs design docs (all additive): in-memory derived aggregates,
  1:day-cell recon only, REPLACE-only restore, OptionEAE/CorpActions raw-only,
  single manual close tranche. Deltas table: docs/ARCHITECTURE.md.
- IBKR account artifacts exist on device (`/sdcard/Download/Tradestransaction_*_
  11696251_*.txt`) — user has IBKR history; first live sync will confirm the
  UNVERIFIED Flex attribute names (unknown rows are kept RAW, nothing lost).
- Heavy builds auto-serialized by global hook; agent-memory git only via
  `/root/work/bin/agent-memory-finalize`.

## Remaining work

See TODO.md in repo: D1/D2 decisions → their UIs; live IBKR sync validation;
device smoke; merge-restore; manual↔broker recon; corporate actions; release/R8
build; Room schema export before any migration.
