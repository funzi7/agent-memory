# OptionsProfitTracker — Gotchas

> Hard-won lessons. Add to this file every time something burns hours of debugging.

## IBKR Flex Query parsing

### OWL assignment code lives in `notes` attribute, NOT `code`
**Symptom:** P&L doesn't match IBKR ($4,532.72 mismatch in April 2026).
**Reason:** When IBKR assigns a position, the OWL (option exercised/assigned) marker appears in the `notes` XML attribute on the trade, not in the `code` field where you'd expect status flags.
**Fix:** When detecting assignments, check `trade.attribute("notes")` for OWL marker. Keep `code` parsing for other statuses.
**File:** `FlexQueryService.kt` (verify current name)

### Trade dedup must use 6-field composite key
**Symptom:** Duplicate trades after re-syncing the same Flex query.
**Reason:** `tradeId` alone isn't unique across edited/corrected trades. IBKR re-issues IDs sometimes.
**Fix:** Dedup composite = `(tradeId, ticker, strike, expiry, side, executionTime)`. All 6 must match for dedup.

### Closing detection must be EXACT "C" match
**Symptom:** Some opens were misclassified as closes (e.g., "CLOSE" or "Cancel" got matched).
**Reason:** Naive `startsWith("C")` matched too aggressively.
**Fix:** Exact equality `== "C"` only.

### Available capital comes from `availableFunds`, not `cashBalance`
**Symptom:** "Available capital" display didn't match what IBKR actually allowed for new positions.
**Reason:** `cashBalance` includes pending settlement; `availableFunds` is the actual buying power IBKR shows in TWS.
**Fix:** Parse `availableFunds` from the Flex XML.

### Portfolio value = last element of `EquitySummaryByReportDateInBase`
**Symptom:** Portfolio value displayed an old date's value.
**Reason:** The array is ordered chronologically. Naive `.first()` returns the oldest.
**Fix:** Use `.last()` — that's the most recent date.

### CC reminder share doubling (duplicate regex)
**Symptom:** Tickers with 100 shares appeared as having 200 shares; CC reminder banner doubled.
**Reason:** A duplicate regex in `parseStockPositions()` matched the same row twice in different XML sections.
**Fix:** Single regex pass, or dedup by `(ticker, accountId)` after parse.

### `fullResync()` and `syncFromIbkr()` are separate functions
**Pitfall:** Don't assume `fullResync()` calls `syncFromIbkr()` or vice-versa. They have different behaviors:
- `syncFromIbkr()` — incremental, dedups against existing DB
- `fullResync()` — wipes imported data, re-imports from scratch (doesn't touch manually-entered positions)

**Trap:** When fixing sync bugs, verify which function is being invoked. The "Resync" button calls `fullResync()`; the auto-sync worker and "Sync now" button call `syncFromIbkr()`.

## Calculations

### Options × 100 multiplier
**Symptom:** P&L numbers off by a factor of 100.
**Reason:** Each US options contract = 100 shares. Premium $1.50 means $150 per contract.
**Fix:** Always multiply premium × contracts × 100 when computing dollars. Single source of truth: `Position.totalPremium()` extension.

### CC P&L has THREE separate values, not one
**Symptom:** "P&L" display confused premium received vs unrealized vs total.
**Reason:** For an open CC, three numbers matter:
1. **Premium received** (locked-in income from selling the call)
2. **Unrealized option P&L** (how the call value moved — negative if stock rallied above strike)
3. **Total P&L on the position** (premium + share appreciation)

**Fix:** UI shows all three separately. Don't collapse into one "P&L" number.

### Spread leg-matching is fragile
**Symptom:** Imported spreads display incorrectly — wrong legs paired, wrong net premium.
**Reason:** Flex XML lists each leg as a separate trade row. Pairing them requires matching by `(ticker, expiry, executionTime ±60s, opposite side)`.
**Status:** Currently using a 3-pass SELL+BUY matching algorithm. Has been broken multiple times. **Verify on every spread import.**

### IV cache sanity bounds: 10% min, 300% max
**Symptom:** Insane IV values (0.01%, 999%) crashed strategy analyzer downstream.
**Reason:** Some IBKR contracts return garbage IV in pre-market or low-liquidity windows.
**Fix:** Reject any IV outside `[0.10, 3.00]`. Auto-cleanup runs on app startup, sweeps `IVCache` for out-of-bounds values.

## External APIs

### Alpha Vantage free tier: 25 req/day + 1.5s between calls
**Symptom:** "Note: Thank you for using Alpha Vantage..." returned instead of data; all calls fail rest of day.
**Reason:** Free tier has hard daily and per-minute limits.
**Fix:**
- Throttle: 1.5s `delay()` between calls
- Cache aggressively in `IVCache` (TTL: 1 hour for live, longer for closed market)
- Track daily count; surface to UI when at 20+/25
- Document for user: pre-market sync may consume daily budget

### Exchange rates from `open.er-api.com`
**Why this one:** Free, no key required, 1 req/24h cache is enough for our use.
**Old endpoint:** Some alternative was tried earlier and abandoned (rate limits / instability).
**Fix:** Stay on `open.er-api.com`. Cache in DataStore (`rates_last_fetched`).

## Background work

### FlexSyncWorker can be killed by Android battery optimization
**Symptom:** Auto-sync stops working "for some users" — no error, just silence.
**Reason:** Aggressive vendor battery optimizers (Xiaomi, Samsung, Huawei) freeze WorkManager periodic workers.
**Fix:** Show a setting that opens battery-optimization exclusion intent for users who report stale data. Document in settings screen. Cannot be auto-fixed.

## UI / Compose

### Hardcoded colors leak through dark theme
**Symptom:** Some screens look correct in light mode but have wrong colors in dark.
**Reason:** Direct `Color(0xFF...)` calls in Composables instead of `AppTheme.colors.X`.
**Fix:** Grep for `Color(0x` outside the theme module. Replace with semantic tokens. **Background agent has done this twice already — keep watching.**

### RTL: use `start`/`end`, not `left`/`right`
**Symptom:** Hebrew RTL UI looks wrong in some screens (margins on wrong side).
**Reason:** `Modifier.padding(start=)`/`(end=)` flip with locale; `(left=)`/`(right=)` don't.
**Fix:** Always use `start`/`end`. Lint check should catch this; verify it's enabled.

## Process / workflow

### "All agents done. Working tree clean" doesn't mean it's verified
**Pitfall:** Claude Code reports "all 6 background agents have completed successfully" — this means the agents finished, not that the work is correct on device.
**Fix:** Always do `git pull && ./gradlew assembleDebug && install on device && smoke-test the changed screens` before declaring a round done.

### Don't re-prompt completed items
**Symptom:** Claude Code wastes a session redoing P3 items because the spec didn't mention they were already done.
**Fix:** Spec Writer agent must read `roadmap.md` first. State Tracker agent confirms before any new round.

### Background AGP / network errors during build are usually transient
**Symptom:** "Could not resolve com.android.tools.build:gradle:X.Y.Z" during `./gradlew`.
**Reason:** Sandbox network blip or Maven mirror.
**Fix:** Retry. If repeated, check `gradle.properties` for proxy/mirror config.

## Pitfalls to avoid

- Don't add new dependencies without flagging them — Hilt/Compose/Room/WorkManager are the load-bearing four. Resist anything that overlaps.
- Don't introduce kapt — KSP only.
- Don't bump Room DB version without a migration. Each version 14→15→16 had a migration; keep the chain unbroken.
- Don't store secrets (Flex token, Alpha Vantage key) in plain SharedPreferences. Use EncryptedDataStore.
- Don't log Flex XML content — it contains account numbers and balances.
