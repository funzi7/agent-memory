# Trading Tracker — Gotchas

> Non-obvious things that will bite a future agent. Verified 2026-08-26.

## Round 7 (realized P&L + quotes + calendar)

- **IBKR `fifoPnlRealized` is GROSS (commissions EXCLUDED).** Confirmed on the owner's real data:
  `OptReconciler.explainedByCommission` treats broker−(TT net) ≈ TOTAL commissions, i.e. broker ≈ gross.
  So the app's realized P&L (Round 7) is broker GROSS, with commissions shown separately — do NOT
  re-subtract commission from it. This was the MULL fix ($52.53 net → $55.47 gross).
- `brokerFifoPnlMicros` was ALREADY persisted on `executions` since v1; the Round-7 change is that
  `LedgerRepository.toDomain` now propagates it into `ExecEvent` (+ signedCommission + grossCash +
  hasEconomicOverride). No schema change for the P&L itself.
- **Distribute the broker figure per CLOSING EXECUTION, not per slice.** One closing exec can close many
  FIFO lots → many slices; `LotMatcher.distributeBrokerPnl` splits the exec's single fifoPnl across its
  slices qty-proportionally with the remainder on the LAST slice, so Σ slice = broker total EXACTLY,
  counted once. `ClosedSlice.selectedPnlMicros = resolvedPnlMicros ?: pnlMicros`; `RoundTrip
  .realizedPnlMicros` = Σ selected. Consumers use `selectedPnlMicros`, NOT `pnlMicros` (which stays the
  LOCAL net for the reconciliation delta).
- **JUnit `assertEquals(Int, Long?)` FAILS** (boxes Integer vs Long). Nullable-Long assertions need an
  `L` suffix on the literal; non-nullable Long args widen an Int fine. Bit me on the MULL test.
- **StatsScreen FX conversion must convert `resolvedPnlMicros` too**, not just `pnlMicros` — StatsEngine
  reads `selectedPnlMicros`, so a `.copy(pnlMicros=converted)` alone leaves selected pointing at the
  unconverted broker micros. Set `resolvedPnlMicros = converted(it.selectedPnlMicros, ...)`.
- **Calendar arrows:** wrap the arrow Row in `CompositionLocalProvider(LocalLayoutDirection provides
  Ltr)` so auto-mirrored `Icons.AutoMirrored.Filled.KeyboardArrowLeft/Right` render UN-mirrored →
  left=previous, right=next (owner's RTL expectation). Do NOT import `Icons.Filled.KeyboardArrowLeft as
  X` and use `X` bare — it's an extension property on `Icons.Filled`, "receiver type mismatch".
- **Calendar swipe** = `Modifier.pointerInput{ detectHorizontalDragGestures(...) }` on the LazyColumn;
  RIGHT (dx>0)→nextMonth, LEFT→previousMonth; the horizontal touch slop is the orientation lock so a
  vertical scroll never fires it. Owner DELIBERATELY wants right=next (not the generic RTL pager order).
- **NyTime market hours:** `optionsMarketPhase` = REGULAR 09:30–16:00 ONLY (no pre/post — OPRA); equities
  add PRE 04:00 / POST 20:00. Holidays NOT modeled (label only, never ledger). `MarketPhase` enum is a
  TOP-LEVEL type (outside the NyTime object).
- **Quote 2d fallback** fires only when `1d` `parse` returns null (illiquid option overnight with no
  candles AND no regularMarketPrice). MULL overnight HAS regularMarketPrice=0.5 so 1d already yields a
  price; 2d is a safety net. Real smoke: `MULL260918P00015000` overnight → HTTP 200, 0.5, empty series.
- **OPT publishes nothing consumable:** FileProvider is `exported="false"` (manual share only);
  auto-backup → app-private `getExternalFilesDir/auto_backups` (unreadable by other apps). So the
  granted-location monitor scans a USER-granted shared folder, not OPT's dir. No direct sync w/o OPT change.
- **Scroll capture** needs Compose Foundation ≥1.8 (ScrollCaptureCallback support). Project = BOM
  2024.11.00 = Foundation 1.7.5 → impossible app-side. Fix = BOM bump; no FLAG_SECURE; long screens are
  single scroll containers already. Unverifiable without a Samsung device.

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

## Round 6 (journal + live prices + position detail/close + strategy/tags)

- **Live prices are KEYLESS via ONE endpoint for both stocks and options.** `GET query1.finance.
  yahoo.com/v8/finance/chart/{SYMBOL}?interval=1m&range=1d&includePrePost=true` with a `User-Agent`.
  Stock SYMBOL = ticker; OPTION SYMBOL = OCC = `UNDERLYING + yyMMdd + (C|P) + zeroPad8(strikeMicros/1000)`
  (strikeMicros = strike×1e6, so /1000 = strike×1000; verified incl. non-round strikes, e.g. $12.67 →
  `…P00012670`). The v7 options/quote endpoints now 401 "Invalid Crumb" — do NOT use them; OPT itself
  doesn't handle the crumb. So §24 needed NO STOP/keyed provider. `YahooChart.parse` is pure/tested;
  the network lives in `QuoteRepository` (display-only; failures swallowed; never breaks sync/ledger).
- **Extended-hours selection is by candle-ts vs meta.regularMarketTime**, not marketState. In pre/post
  the baseline switches to today's regularMarketPrice (NOT the older previousClose). Null baseline ⇒
  `dayChangePercent()` returns null ⇒ Fmt.percent(null)="—". Never carry current→baseline.
- **`Fmt.price`/`priceNative` now use `PRICE_PATTERN="#,##0.00##"`** (2–4 dp) — a change from the old
  6-dp DECIMAL_PATTERN. `qty()` STILL uses DECIMAL_PATTERN (no 2-dp floor). per-share evidence
  (`decimal()`/`perShare()`) keeps 12 dp. A price test asserting 6 dp was updated (Round 6 §10).
- **`LotMatcher.build` now returns `LedgerView.executionEffects`** (per-exec OPEN/ADD, emitted in the
  opening phase). It is append-only — it does NOT change slices/P&L/commissions. `DayActivityBuilder`
  marks a slice full-CLOSE only when `slice.closeInstant == rt.closeInstant` (the exec that zeroed the
  round trip); earlier partials are REDUCE even if the round trip later closes. All day dating via NyTime.
- **Broker-backed close = `pending_position_closes` ONLY** (Layer-C, like field_overrides): never a
  fake BROKER exec, never a duplicate MANUAL exec. Realized P&L is ALWAYS only from broker/manual
  ClosedSlices, so `estimatedPnlMicros` can never double-count. Manual position close writes a real
  MANUAL `ex_mc_<uuid>` close (FIFO-matches the open lot). `PendingCloseReconciler` matches a later
  broker ClosedSlice (source==BROKER, conid/instrumentKey + opposite direction + ±7d + qty≈) → flips
  status; a broker match already consumed by another confirmed pending ⇒ SUPERSEDED (duplicate).
- **Strategy: OPT contractKey == `Instrument.key`** ("OPT:TICKER:expiry:C|P:strikeMicros"), so OPT
  strategyType maps to a live position by instrument key. Short PUT alone ⇒ "Sell Put" (NEVER a
  fabricated CSP); CSP only from metadata/OPT; Covered Call only with enough covering long shares.
  Manual override → `position_strategy` (source=LOCAL_OVERRIDE), never rewrites broker truth.
- **AppRoot**: Calendar is `CalendarScreen()` (no onOpenDay — inline detail). `DayDetailRoute`/screen
  kept for compat. New routes PositionDetailRoute/ClosePositionRoute/TagPositionsRoute; PositionDetail
  + TagPositions added to `refreshable`. `PullRefreshWorkflow` internal ctor + SharedPullRefresh have a
  DEFAULTED `quoteRefresh = {}` param so the Round-3 pull tests still compile.
- **RTL ticker-left** = `CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr)`
  around the card header (OPT's technique). Real quote smoke: `QUOTE_SMOKE=1` env var (read via
  getenv/getProperty) — Gradle -D does NOT reach the forked test JVM; use the env var.
- APK is born versioned via `applicationVariants.all { outputs.all { (this as BaseVariantOutputImpl)
  .outputFileName = "TradingTracker-$versionName.apk" } }`. Delivered TradingTracker-0.6.0.apk; old
  unversioned TradingTracker.apk left in place (don't delete). `am broadcast` media-scan can't reach a
  framework from PRoot → never claim My Files visibility without a device.
