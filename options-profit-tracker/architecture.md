# OptionsProfitTracker — Architecture

> Stable document. Update only when architecture itself changes.

## Stack

- **Language:** Kotlin 2.0
- **UI:** Jetpack Compose (Material 3)
- **DI:** Hilt + KSP (no kapt)
- **Database:** Room (current version: **16**)
- **Persistent prefs:** DataStore (`AppPreferences`)
- **Background work:** WorkManager (`FlexSyncWorker` periodic)
- **HTTP:** Retrofit + Kotlinx Serialization (verify against codebase)
- **OCR:** ML Kit (text recognition for chain OCR)
- **Locale:** Hebrew RTL primary, English fallback
- **Theme:** Light + Dark (use `AppTheme.colors` everywhere — no hardcoded colors)
- **Target:** Android only, single Activity + Compose Navigation

## Repo and build

- **Repo:** `funzi7/OptionsProfitTracker`
- **Working tree on disk:** `/home/claude/OptionsProfitTracker/`
- **Build commands (from repo root):**
  - Debug build: `./gradlew assembleDebug`
  - Lint: `./gradlew lint`
  - Tests: `./gradlew test`
- **Branch naming:** `claude/batch{N}-{description}`
- **PR convention:** conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`)

## High-level data flow

```
IBKR Flex Query (XML) ──► FlexQueryService ──► FlexSyncWorker ──► Room DB ──► Compose ViewModels ──► UI
                                                       │
                                                       └──► DataStore (AppPreferences)

OptionChainParser (OCR / paste) ──► StrategicRiskAnalyzer ──► AddPositionViewModel ──► Position entry UI
```

## Key Room entities (verify exact field names in code)

```
Position
  id, ticker, strategy (enum), strikePrice, expiry, contracts
  premiumReceived, currentMarkPrice
  openDate, closeDate (nullable), status (Open | Closed | Assigned | Expired)
  capitalAtRisk, importedFromIbkr (bool)

SpreadPosition
  id, ticker, strategy (Spread | IronCondor | Straddle | Strangle)
  legs: List<SpreadLeg>  // each leg: strike, side (BUY/SELL), call/put, premium
  netPremium, maxProfit, maxLoss, breakeven

Trade
  id, positionId, ticker, side (BUY/SELL/STC/BTC/ASSIGNED/EXPIRED)
  qty, price, commission, executionTime
  flexTradeId (unique constraint for dedup)

Stock
  ticker, shares, avgCost, currentPrice
  // Used for CC reminder: tickers with 100+ shares but no open CC

EventEntity (Activity Feed)
  id, type, ticker, amount, timestamp, message_he

IVCache
  ticker, expiry, iv, lastUpdated
  // sanity bounds: IV >= 10%, IV <= 300%
```

(Verify exact field names against current Room migrations before referencing in code.)

## Strategy enum

- `COVERED_CALL` (CC)
- `CASH_SECURED_PUT` (CSP)
- `LONG_CALL`
- `LONG_PUT`
- `SPREAD` (vertical credit/debit)
- `IRON_CONDOR`
- `STRADDLE`
- `STRANGLE`
- `WHEEL` (composite — CSP rolling into CC after assignment)

## Position status enum

- `OPEN`
- `CLOSED` (manual close or BTC/STC)
- `ASSIGNED` (TO me — got the shares; FROM me — shares called away)
- `EXPIRED` (worthless)

## Key services

- **`FlexQueryService`** — IBKR Flex Query XML fetch + parse. Source of truth for all imported data.
- **`FlexSyncWorker`** — WorkManager periodic worker. Auto-sync intervals: 15/30/60/120 min via `AppPreferences`. Manual trigger button in settings.
- **`OptionChainParser`** — Text paste + ML Kit camera OCR for IBKR mobile chain screens. Outputs structured strikes.
- **`StrategicRiskAnalyzer`** — Offline rule-based, Hebrew. 0–100 score with IV crush detection, earnings awareness, annualized return.
- **`IVService`** — Alpha Vantage primary (free tier: 25 req/day, 1.5s delay required between calls). Cached in `IVCache` with sanity bounds.
- **`ExchangeRateService`** — `open.er-api.com` primary. USD/ILS + USD/THB. Refreshed during sync.
- **`BlackScholesCalculator`** — Premium auto-fill for new positions when no live quote available.

## IBKR Flex Query integration

- **Auth:** Flex token + query ID, stored in DataStore
- **Format:** XML (not CSV — CSV path exists for legacy import only)
- **Trade dedup:** by 6 fields (`tradeId` + 5 others — see gotchas.md)
- **Closing detection:** exact `"C"` match in close indicator field (NOT prefix)
- **Available capital:** parse `availableFunds` from XML
- **Portfolio value:** last element of `EquitySummaryByReportDateInBase` array (most recent date wins)
- **Assignment detection:** OWL code lives in the `notes` attribute, NOT the `code` attribute (see gotchas.md)
- **Two functions:** `fullResync()` and `syncFromIbkr()` are separate — they don't call each other.

## DataStore (`AppPreferences`)

Persisted keys (verify against code):
- `flex_token`, `flex_query_id`
- `auto_sync_enabled`, `auto_sync_interval_minutes` (15/30/60/120)
- `last_sync_timestamp`
- `portfolio_value_usd`
- `exchange_rate_usd_ils`, `exchange_rate_usd_thb`, `rates_last_fetched`
- `theme_mode` (light/dark/system)
- `language` (he/en)

## UI conventions

- **All financial numbers:** exactly 2 decimal places
- **Currency display:** USD primary; show ILS/THB equivalents on dashboard
- **Colors:** strategy-unique colors via `AppTheme.colors.strategy(strategy)`. NO hardcoded colors anywhere.
- **Hebrew strings:** in `strings.xml` under `values-he/`
- **RTL:** `android:supportsRtl="true"`. Use `Modifier.padding(start=, end=)` not `(left=, right=)`
- **Date format:** `DD/MM/YYYY` for display, ISO 8601 for storage

## CI / Build infrastructure

- **GitHub Actions:** TBD — currently no active workflows. Planned:
  - `build.yml` — runs `./gradlew assembleDebug` on every PR
  - `codex-auto-fix.yml` — listens for Codex review comments + dispatches fixes
- **Codex bot:** Available on PRs. Comment `@codex address that feedback` to trigger auto-fix.

## Out of scope (architecture-level)

- iOS — Android only
- Web companion app — not planned
- Server-side component — fully offline-first; no backend
- Real-time streaming quotes — use Alpha Vantage / Flex polling only
- Tax filing automation beyond form generation — only generate, user files manually
