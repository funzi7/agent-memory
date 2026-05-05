# OptionsProfitTracker — Architecture

> Stable document. Update only when architecture itself changes.
> Verified against codebase: 2026-05-05

## Stack

- **Language:** Kotlin 2.0.20
- **Build:** Gradle 8.7 (wrapper)
- **Java target:** 17
- **UI:** Jetpack Compose with Material 3 (BOM 2024.11.00)
- **DI:** Hilt 2.51.1 + KSP (no kapt)
- **Database:** Room 2.6.1, current version: **30**, with **21 migrations** in chain
- **Persistent prefs:** DataStore Preferences 1.1.1 (`AppPreferences`)
- **Background work:** WorkManager 2.9.1
- **HTTP:** No Retrofit — direct HTTP via JDK / OkHttp (verify in `data/remote/`)
- **JSON:** Gson 2.10.1
- **Date/time:** kotlinx-datetime 0.6.1
- **OCR:** ML Kit text-recognition **16.0.0** ⚠️ (this is the version triggering the 16 KB page-size warning)
- **Image loading:** Coil 2.6.0
- **Navigation:** androidx.navigation.compose 2.8.3 + hilt-navigation-compose 1.2.0
- **Locale:** Hebrew RTL primary (with Dark theme as default)
- **Theme:** Light + Dark — switchable via `THEME_MODE` pref ("dark" / "light" / "system")

## SDK levels + app metadata

- **applicationId:** `com.dima.optionstracker`
- **namespace:** `com.dima.optionstracker`
- **compileSdk:** 35
- **targetSdk:** 35
- **minSdk:** 26
- **versionCode:** 1
- **versionName:** 1.0.0

## Repo and build

- **Repo:** `funzi7/OptionsProfitTracker`
- **Default branch:** `main`
- **Branch naming:** `claude/batch{N}-{description}` or `claude/{round-label}-{description}`
- **PR convention:** conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`)

### Build commands (per CLAUDE.md and AGENTS.md)

- **Primary compile check:** `./gradlew :app:compileDebugKotlin --stacktrace`
- **Full debug build:** `./gradlew assembleDebug`
- **Unit tests (if applicable):** `./gradlew :app:testDebugUnitTest --stacktrace`
- **Pre-commit (mandatory per CLAUDE.md):**
  ```
  export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"
  ./gradlew assembleDebug
  ```
  Build must pass before commit. No exceptions.

## Package structure

```
com.dima.optionstracker/
  MainActivity.kt
  OptionsTrackerApp.kt              ← Application class, schedules AlertWorker on onCreate
  data/
    AppPreferences.kt               ← All DataStore keys + accessors
    entity/                         ← 9 Room entities
    dao/                            ← 10 DAOs (one entity uses external dao)
    database/OptionsDatabase.kt     ← @Database, version=30, 21 migrations
    repository/                     ← Including OptionsRepository.kt
    remote/                         ← FlexQueryService, OptionChainParser, AiAnalysisService, etc.
  di/                               ← Hilt modules
  domain/
    calculator/                     ← ProfitCalculator, StrategicRiskAnalyzer
    usecase/                        ← ReportGenerator, etc.
  notification/                     ← All workers + helpers
    AlertWorker.kt
    AutoAssignCC.kt
    DraftUpdateWorker.kt
    FlexSyncWorker.kt
    MonthlyReminderWorker.kt
    NotificationHelper.kt
  ui/
    navigation/Screen.kt
    screens/
      dashboard/DashboardScreen.kt
      addposition/{AddPositionScreen, AddPositionViewModel, ClosePositionScreen}.kt
      reports/TaxReportScreen.kt
      settings/ImportViewModel.kt
      ...
```

## Database — Room v30

### Critical: migrations registered in 11 sites (no Hilt singleton)

The DB is NOT provided through a single Hilt-injected singleton. Multiple files call `Room.databaseBuilder(...).addMigrations(...)` themselves — there are 11 such sites. Every new migration must be appended to all of them or the app crashes on first launch for users on older versions. See `gotchas.md` for the full list. Migration Guard agent enforces this.

Policy: `fallbackToDestructiveMigrationOnDowngrade()` (downgrades may drop data; upgrades require real migration).

### 9 Entities (single-table-per-concept)

| Entity | Table | Purpose |
|---|---|---|
| `PositionEntity` | `positions` | Core entity — every position (CC, CSP, Spread, IC, etc.). Spread legs stored as same row with `spread_leg_*` cols. **No separate Trade table.** |
| `MonthlyTargetEntity` | (verify table name) | Monthly income targets |
| `ExchangeRateEntity` | (verify table name) | USD/ILS, USD/THB rates |
| `TaxDocumentEntity` | (verify table name) | 1042-S parsing results |
| `ActivityEventEntity` | (verify table name) | Activity feed events |
| `IvCacheEntity` | (verify table name) | Per-(ticker, expiry) IV cache |
| `WatchlistEntity` | `watchlist` | Watchlist tickers (already implemented — see migrations 27-29) |
| `PortfolioEventEntity` | (verify table name) | Portfolio-level events (deposits, withdrawals, etc.) |
| `SocialSourceEntity` | (verify table name) | Social/news source feeds |
| `PortfolioHistoryEntity` | (verify table name) | Daily portfolio value snapshots |

### PositionEntity key fields (this is the load-bearing table)

```kotlin
@Entity(tableName = "positions",
        indices = [Index("status"), Index("expiration_date"), Index("ticker"), Index("strategy_type")])
data class PositionEntity(
    id: Long PK autoGenerate,
    ticker: String,
    strategyType: StrategyType,
    optionType: OptionType,                    // CALL or PUT
    direction: Direction,                       // SELL or BUY
    strikePrice, premiumPerContract, numContracts,
    openDate, expirationDate: LocalDate,

    // CC + Wheel underlying
    stockPurchasePrice, sharesHeld,

    // Spread leg (in same row)
    spreadLegStrike, spreadLegPremium, spreadLegType, spreadLegDirection,

    // Closing
    status: PositionStatus,                     // OPEN | CLOSED_BTC | EXPIRED | ASSIGNED | ROLLED | DRAFT
    closeDate, closeMethod, closePricePerContract, closeProfitPercent,

    // Assignment
    assigned: Boolean, assignmentDate, assignmentStockPrice,
    stockSoldPrice, stockSoldDate,

    // Auto-close + commissions
    autoCloseTargetPercent,
    commission: Double,                         // open commission
    closeCommission: Double,                    // close commission (separate)

    // Market value
    currentPricePerContract,                    // current option mid
    initialPremium,                             // captured on first save — DRAFT B-S preserves this
    currentStockPrice,
    impliedVolatility,                          // CURRENT IV — refreshed
    ivAtOpen,                                   // captured at open — NEVER updated

    // Misc
    currency: Currency,                         // USD | ILS | THB
    wheelGroupId,                               // links CC + CSP in same wheel cycle
    syncSource: PositionSyncSource,             // MANUAL | IMPORTED | TRADESTATION
    ibkrRealizedPnl,                            // fifoPnlRealized from IBKR Flex XML
    notes, tags, isFavorite,
    createdAt, updatedAt
)
```

### Enums (verbatim from PositionEntity.kt)

```kotlin
enum class StrategyType {
    COVERED_CALL, CASH_SECURED_PUT, WHEEL,
    BULL_PUT_SPREAD, BEAR_CALL_SPREAD, BEAR_PUT_SPREAD, BULL_CALL_SPREAD,
    IRON_CONDOR, STRADDLE, STRANGLE,
    LONG_PUT, LONG_CALL, CUSTOM
}
enum class OptionType { CALL, PUT }
enum class Direction { SELL, BUY }
enum class PositionStatus { OPEN, CLOSED_BTC, EXPIRED, ASSIGNED, ROLLED, DRAFT }
enum class CloseMethod { BTC_EXACT_PRICE, BTC_PROFIT_PERCENT, EXPIRED, ASSIGNED, ASSIGNED_EARLY, ROLLED }
enum class Currency { USD, ILS, THB }
enum class PositionSyncSource { MANUAL, IMPORTED, TRADESTATION }
```

⚠️ **Important:** closed position status is `CLOSED_BTC`, NOT `CLOSED`. There is no `CLOSED` enum value.

## DataStore (`AppPreferences`)

Persisted keys (all live in companion object). Categorized:

**Sync / IBKR Flex**
- `flex_token`, `flex_query_id`
- `auto_sync_enabled` (default false), `sync_interval_minutes` (default 15)
- `last_sync_time`, `last_iv_refresh_time`
- `equity_summary_nav` (NAV from IBKR EquitySummary)
- `holdings_value` (stock + abs(options) from EquitySummary)

**Alerts / notifications**
- `expiry_alert_enabled`, `expiry_alert_days_before` (default 3)
- `alert_notifications_enabled` (default true), `alert_interval_minutes` (default 10)
- `last_alert_cache` (JSON array of alert texts)
- `iv_alert_threshold` (default 50.0), `dte_alert_days` (default 7)

**Portfolio**
- `month_start_portfolio_value`, `month_start_portfolio_month`
- `available_funds_manual`, `available_funds_manually_set`, `auto_estimated_funds`
- `manual_pnl_adjustment`
- `portfolio_sort_mode` (default "VALUE"), `portfolio_sort_asc` (default false)

**Targets**
- `monthly_target_ils`, `monthly_target_thb`, `last_target_edit_source` ("USD" | "ILS" | "THB")

**API keys** (all stored in DataStore, EncryptedDataStore migration TBD)
- `alpha_vantage_key`, `tradier_api_key`, `rapidapi_key`, `marketdata_key`
- `perplexity_api_key`, `openai_api_key`, `anthropic_api_key`, `gemini_api_key`
- `finnhub_api_key`, `massive_api_key`
- `ai_provider`, `ai_api_key` (active provider + its key)

**Caches (JSON-stored)**
- `iv_cache` — JSON `{"TICKER": {"2025-03-21": 45.2, ...}}`
- `dividend_cache` — JSON `{"TICKER": {"events": [...], "ts": ...}}`
- `autofill_cache`, `stock_sync_snapshot`, `manual_share_overrides`

**IBKR API (placeholder for future direct API)**
- `ibkr_api_enabled`, `ibkr_api_host` (default `https://localhost:5000`)

**Misc**
- `theme_mode` (default "dark")
- `default_commission`, `show_commissions` (default true)
- `massive_rate_limit_at` — last 429 timestamp from Massive API (60s cooldown)
- `tax_import_1042_<year>` (per-year function), `tax_import_dividends_<year>` (per-year function), `loss_carry_forward_<year>` (per-year function)

## Workers (notification/ package)

| Worker | Purpose | Notes |
|---|---|---|
| `AlertWorker` | Periodic price/IV/DTE alerts | Scheduled in `OptionsTrackerApp.onCreate()` directly (not behind coroutine/prefs) — `WORK_NAME` constant. Logs `ALERT_SCHEDULE`. |
| `AutoAssignCC` | Detects assignments and auto-creates next wheel leg | |
| `DraftUpdateWorker` | Refreshes B-S prices on DRAFT positions | **Rule: only during US market hours, Mon-Fri 4 AM–8 PM ET** (per CLAUDE.md). Also: must NOT update CSP draft premiums (per active issue S16). |
| `FlexSyncWorker` | Periodic IBKR Flex sync | Auto-sync intervals: 15 / 30 / 60 / 120 min via `AppPreferences`. Manual trigger button in settings. |
| `MonthlyReminderWorker` | Monthly summary notifications | |
| `NotificationHelper` | Shared notification channel + helpers | Channel: `options_alerts`, importance HIGH (heads-up). |

## High-level data flow

```
IBKR Flex Query (XML) ──► FlexQueryService.fetchFlexReport() ──► parseFlexXml / parseOptionEAE / parseOpenPositions / parseStockPositions / parseOpenOrders / parseDividends
                                                                            │
                                                          ImportViewModel.syncFromIbkr() (incremental)
                                                          ImportViewModel.fullResync() (wipe imported, preserve manual)
                                                                            │
                                                                            ▼
                                                                       Room DB (positions table + others)
                                                                            │
                                                                            ▼
                                                          Compose ViewModels ──► UI

OptionChainParser (paste / ML Kit camera) ──► StrategicRiskAnalyzer ──► AddPositionViewModel ──► UI

Background:
  AlertWorker (periodic) ──► fetch quotes, build alerts, save to last_alert_cache, notify
  FlexSyncWorker (periodic) ──► incremental Flex sync ──► update positions + currentPrice
  DraftUpdateWorker ──► refresh B-S on DRAFT (market-hours only)
```

## FlexQueryService — public methods

(in `data/remote/FlexQueryService.kt`)

```kotlin
suspend fun fetchFlexReport(token: String, queryId: String): FlexResult
fun parseFlexXml(xml: String): List<Map<String, String>>          // trades
fun parseOptionEAE(xml: String): List<Map<String, String>>        // expiry / assignment / exercise events
fun parseOpenPositions(xml: String): List<Map<String, String>>    // current open positions w/ markPrice
fun parseStockPositions(xml: String): Map<String, Int>            // ticker → shares held
fun parseOpenOrders(xml: String): List<Map<String, String>>       // pending BTC limits, etc.
fun parseDividends(xml: String): List<Map<String, String>>
fun parseDividendsFromHtml(html: String): List<Map<String, String>>
fun analyzeFlexXml(xml: String): String                            // debug summary
```

Data is returned as `List<Map<String, String>>` rather than typed DTOs. Be aware when refactoring.

## Sync functions (in `ImportViewModel`)

Two distinct functions — they DO NOT call each other:
- **`syncFromIbkr()`** (line 109) — incremental sync; dedups against existing DB rows; preserves manual data
- **`fullResync()`** (line 1260) — wipes IMPORTED data only (preserves MANUAL/TRADESTATION-source rows); re-imports from scratch

## IBKR Flex Query integration

- **Auth:** Flex token + query ID, stored in DataStore
- **Format:** XML (parsed with Android XML pull parser)
- **Trade dedup:** by 6-field composite (`tradeId` + 5 others — see gotchas.md)
- **Closing detection:** exact `"C"` match (NOT prefix)
- **Available capital:** parse `availableFunds` (NOT `cashBalance`)
- **Portfolio value:** last element of `EquitySummaryByReportDateInBase` array (most recent date wins)
- **Assignment detection (OWL):** lives in `notes` XML attribute, NOT `code` (see gotchas.md)
- **Positions:** stored with `syncSource = IMPORTED` so they're separable from `MANUAL` and `TRADESTATION`

## UI conventions (per CLAUDE.md)

- **All financial numbers:** exactly 2 decimal places
- **Currency display:** USD primary; show ILS/THB equivalents on dashboard
- **+/- signs:** ALWAYS to the LEFT of the number, never the right (LTR rule)
- **LTR wrapper:** `CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr)` for ALL money amounts with +/-, ALL dates, ALL English content
- **Strategy colors:** unique per strategy (defined in theme); NO hardcoded `Color(0x...)`
- **Hebrew strings:** in `values-he/strings.xml`
- **RTL:** `Modifier.padding(start=, end=)` (NOT `left/right`)
- **Date format:** `DD/MM/YYYY` for display, ISO 8601 (`LocalDate`) for storage
- **Trade dates:** stored in `America/New_York` timezone, NOT device timezone (Dima is in Thailand)

## Domain rules (per CLAUDE.md, must preserve)

- **CC profit logic:** Profit = premium + stock gain up to strike. "Loss" above strike is OPPORTUNITY COST, not real loss.
- **CSP collateral:** strike × 100 × contracts (cash backing the put)
- **Spread net:** SELL premium − BUY premium. Max loss = width − net credit.
- **Straddle/Strangle:** both legs are SELL. `totalPremium = leg1 + leg2` (NOT subtracted).
- **Assignment terminology:**
  - "Assignment FROM me" = CC CALL assigned (shares sold)
  - "Assignment TO me" = CSP PUT assigned (shares bought)
- **`unrealizedPnL`:** Must match IBKR mark-to-market — NO commission deduction on unrealized.

## CI / Build infrastructure

- **GitHub Actions:** TBD — currently no active workflows.
- **Codex bot:** Has its own conventions; respects `AGENTS.md`. Prefers `./gradlew :app:compileDebugKotlin --stacktrace` for compile checks.
- **Background-agent settings:** `.claude/settings.json` pre-allows Edit/Write/NotebookEdit and `Bash(./gradlew *)` so file edits auto-accept (per CLAUDE.md).

## Round structure (per CLAUDE.md "Current Known Issues")

CLAUDE.md groups pending work into 5 rounds:
- **Round 1** — Import + Report Correctness (delete-and-sync, assignments, expired count, commission 2-decimal, realized P&L)
- **Round 2** — Tax / Dividends (1042-S parse, HTML dividends, full sync)
- **Round 3** — Sync Infrastructure (IV sync, BTC sync, auto-sync, portfolio value)
- **Round 4** — Analytics (min premium per strategy, focused AI, more AI providers, "best trades to repeat")
- **Round 5** — UI/UX (spread redesign, drill-down pages, annual target, animations)

These are the same R1-R5 in `roadmap.md`.

## Out of scope (architecture-level)

- iOS — Android only
- Web companion app — not planned
- Server-side component — fully offline-first; no backend
- Real-time streaming quotes — use polling only
- Auto-trading / order placement — read-only by design
- Tax filing automation beyond form generation — only generate, user files manually
