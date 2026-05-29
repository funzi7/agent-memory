# OptionsProfitTracker — Gotchas

> Hard-won lessons specific to OPT. Add to this file every time something burns hours of debugging.
> Verified against codebase: 2026-05-29 (Group BH prime)
>
> **For cross-app rules** (RTL, LTR, +/-, 2-decimal, KSP-not-kapt, build conventions, branch naming): see `shared/conventions.md`.

## OPT-specific hard rules (from CLAUDE.md)

### Bug Investigation Rule
NEVER say "already correct" when Dima reports something is broken. If Dima says it doesn't work, it doesn't work — regardless of what the code looks like. The bug might be in a different file, a different code path, a race condition, or a caching issue. Always investigate further. "Already correct" is not an acceptable response to a bug report.

### P&L Calculation Rule
NEVER change `realizedPnL()` or any P&L calculation function without EXPLICIT instruction from Dima. If you think it should change, ASK first. Wrong P&L breaks reports, calendar, MTD, best trades — everything.

### Draft Update Rule
`DraftUpdateWorker` must NOT update B-S prices when US market is closed. Market hours: Mon-Fri, 4:00 AM – 8:00 PM Eastern Time (pre-market through after-hours). It also must NOT update CSP draft premiums (active issue S16 — `strategyType == CASH_SECURED_PUT && status == DRAFT` should be excluded).

### LTR Display Rule (project-wide reminder)
The general LTR rule lives in `shared/conventions.md`. **For OPT specifically:** this rule has been violated across 6+ screens repeatedly. PR Reviewer must actively check it on every PR. The rule itself: every Composable showing money/date/English wraps in `CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr)`. +/- always to the LEFT of the number.

---

## IBKR Flex Query parsing

### OWL assignment code lives in `notes` attribute, NOT `code`
**Symptom:** P&L doesn't match IBKR ($4,532.72 mismatch in April 2026, OWL = +283 instead of 0).
**Reason:** When IBKR assigns a position, the OWL marker appears in the `notes` XML attribute on the trade, not in `code` where status flags usually live.
**Fix:** When detecting assignments, check `trade.attribute("notes")` for OWL marker. Keep `code` parsing for other statuses.
**File:** `app/src/main/java/com/dima/optionstracker/data/remote/FlexQueryService.kt`

### Trade dedup must use 6-field composite key
**Symptom:** Duplicate trades after re-syncing the same Flex query.
**Reason:** `tradeId` alone isn't unique across edited/corrected trades. IBKR sometimes re-issues IDs.
**Fix:** Composite = `(tradeId, ticker, strike, expiry, side, executionTime)`. All 6 must match.

### Closing detection must be EXACT "C" match
**Symptom:** Some opens were misclassified as closes (e.g., "CLOSE" or "Cancel" got matched).
**Reason:** Naive `startsWith("C")` matched too aggressively.
**Fix:** Exact equality `== "C"` only.

### Available capital comes from `availableFunds`, not `cashBalance`
**Symptom:** "Available capital" display didn't match IBKR's actual buying power.
**Reason:** `cashBalance` includes pending settlement; `availableFunds` is what TWS reports as buying power.
**Fix:** Parse `availableFunds` from Flex XML.

### Portfolio value = last element of `EquitySummaryByReportDateInBase`
**Symptom:** Portfolio value displayed an old date's number.
**Reason:** The array is ordered chronologically. `.first()` returns oldest.
**Fix:** Use `.last()`. Stored in `equity_summary_nav` DataStore key.

### CC reminder share doubling (duplicate regex)
**Symptom:** Tickers with 100 shares appeared as 200; CC reminder banner doubled.
**Reason:** Duplicate regex in `parseStockPositions()` matched the same row twice across XML sections.
**Fix:** Single regex pass, or dedup by `(ticker, accountId)` after parse.
**File:** `FlexQueryService.parseStockPositions()`

### `fullResync()` and `syncFromIbkr()` are SEPARATE functions
**Pitfall:** Don't assume one calls the other. They have different behaviors:
- `syncFromIbkr()` (`ImportViewModel:109`) — incremental, dedups against existing DB
- `fullResync()` (`ImportViewModel:1260`) — wipes IMPORTED data, re-imports from scratch (preserves MANUAL + TRADESTATION rows via `syncSource` enum)

The "Resync" button calls `fullResync()`; the auto-sync worker and "Sync now" button call `syncFromIbkr()`. When fixing sync bugs, verify which function is being invoked.

### IBKR XML data is `List<Map<String, String>>` not typed DTOs
`FlexQueryService` parse functions return raw maps. Don't refactor to typed DTOs without coordination — many callers index by string keys.

---

## Database

### DB version is 30, with 21 migrations
Each schema change has a migration in the chain. **NEVER bump version without adding a migration.** All migrations live in `OptionsDatabase.kt` companion object as `MIGRATION_29_30`, `MIGRATION_28_29`, etc. The chain must be unbroken.

### ⚠️ Migrations must be registered in 11 places, NOT one
**Symptom:** `IllegalStateException: A migration from X to Y was required but not found` on first launch after install — but only for some users.
**Reason:** OPT does not use a single Hilt-provided `OptionsDatabase` singleton. Multiple files build their own DB instance via `Room.databaseBuilder(...).addMigrations(...)`. If you add a migration only in `OptionsDatabase.kt` companion, it won't be picked up by the other 10 callers.
**The 11 sites that build the DB:**
1. `OptionsTrackerApp.kt`
2. `MainActivity.kt`
3. `di/AppModule.kt`
4. `ui/screens/settings/SettingsScreen.kt`
5. `ui/screens/dashboard/DashboardViewModel.kt`
6. `ui/screens/dashboard/PortfolioNewsScreen.kt`
7. `ui/screens/dashboard/PortfolioHistoryScreen.kt`
8. `ui/screens/dashboard/PortfolioEventsScreen.kt`
9. `notification/DraftUpdateWorker.kt`
10. `notification/AlertWorker.kt`
11. `notification/FlexSyncWorker.kt`

Every new migration must be appended to `addMigrations(...)` in EVERY one of these. Migration Guard agent enforces this.

**Planned fix (roadmap item DI):** consolidate all 11 into a single Hilt-injected `OptionsDatabase` singleton. This whole copy-paste hazard — plus the destructive-downgrade data-loss bug below — exists only because the DB is built in 11 separate places. One source of truth kills both. Until then, treat all 11 as a unit.

### ⚠️ NEVER use `fallbackToDestructiveMigrationOnDowngrade()` — it silently WIPES data (CONFIRMED data loss)
**This reverses the previous note in this file.** That builder option was assumed harmless ("only dev rollbacks"). It is NOT: it caused Dima to lose ALL app data after a reboot. When an OLDER-versioned build (e.g. a Play rollback, or simply opening with an older APK) touches the newer v30 DB, Room treats it as a downgrade and **destroys the database** instead of failing. There is no warning and no recovery.
**Group BA (commit `594a0d5`) removed `.fallbackToDestructiveMigrationOnDowngrade()` from all 16 builder sites across 11 files.** A downgrade now THROWS (recoverable — the user keeps their data, you fix the version) rather than wiping.
- Do NOT re-add it, and do NOT switch to the broader `fallbackToDestructiveMigration()` either — that wipes on ANY missing migration. We want NO destructive fallback at all. The correct builder chain is `databaseBuilder(...).addMigrations(...).build()`.
- The safety net is the **auto-backup folder** (Group BA2): `BackupService.autoBackup()` writes a dated JSON to `getExternalFilesDir/auto_backups` once per day (rotated to the newest 15), so even a catastrophic wipe is restorable.
- Upgrades still MUST ship a real migration in the unbroken chain.

### Position status `CLOSED` does not exist
The enum is: `OPEN | CLOSED_BTC | EXPIRED | ASSIGNED | ROLLED | DRAFT`. Use `CLOSED_BTC` (closed by buy-to-close), not `CLOSED`. Other close paths are tracked via `EXPIRED`, `ASSIGNED`, `ROLLED` as their own statuses.

### Spread legs are columns on the SAME ROW
There is no separate `spreads` table. A vertical spread is one `PositionEntity` row with `spread_leg_*` columns populated (`spread_leg_strike`, `spread_leg_premium`, `spread_leg_type`, `spread_leg_direction`). Don't introduce a separate table — the model is intentional.

### Iron Condor / Straddle / Strangle
Same single-row model. The `strategyType` enum value tells you the structure; for IC, additional legs are stored via `notes` JSON or a separate mechanism (verify in code if you touch this).

### `syncSource` is what protects manual data on `fullResync()`
- `MANUAL` — entered via AddPosition
- `IMPORTED` — came from IBKR Flex
- `TRADESTATION` — came from TS PDF

`fullResync()` only deletes `IMPORTED` rows. Don't change `syncSource` lightly.

---

## Calculations

### Options × 100 multiplier
**Symptom:** P&L numbers off by a factor of 100.
**Reason:** Each US options contract = 100 shares. Premium $1.50 = $150 per contract.
**Fix:** Always multiply premium × contracts × 100 when computing dollars.

### CC P&L has THREE separate values, not one (per CLAUDE.md domain rule)
For an open CC, three numbers matter:
1. **Premium received** (locked-in income)
2. **Unrealized option P&L** (negative if stock rallied past strike)
3. **Total P&L** = premium + share appreciation up to strike

**The "loss" above strike is OPPORTUNITY COST, not real loss.** Never collapse into one number; never present opportunity-cost as a real $ loss.

### Spread leg-matching is fragile (active issue I1)
3-pass SELL+BUY matching exists but breaks on certain Flex imports. Has been "fixed" multiple times. **Verify on every spread import.**

### IV cache sanity bounds: 10% min, 300% max
**Symptom:** Insane IV values (0.01%, 999%) crashed strategy analyzer.
**Reason:** IBKR returns garbage IV in pre-market or low-liquidity windows.
**Fix:** Reject any IV outside `[0.10, 3.00]`. Auto-cleanup runs on app startup over `IvCacheEntity`.

### `ivAtOpen` is FROZEN, `impliedVolatility` is LIVE
- `iv_at_open` — captured at position open, NEVER updated after insert
- `implied_volatility` — current IV, refreshed during sync

When showing "IV change since open", use both. When showing "current IV", use only the live one.

### Abnormal-move alert threshold clamps out big drops on super-volatile tickers (use an absolute floor)
**Symptom:** RKLX dropped **-17.85%** but never appeared in the pre-market abnormal alerts.
**Reason:** the per-ticker threshold is `2× avgDailyMovePct`, clamped to `[3%, 25%]`. RKLX's avg daily move is ~13.28%, so its threshold = `min(2×13.28, 25) = 25%` — a -17.85% drop is "normal" for it and never fires. The relative-only test silently swallows meaningful moves on the most volatile tickers (exactly the ones worth an alert).
**Fix (BF2, commit `d44bb7c`):** added `val ABS_MOVE_FLOOR = 10.0` in the `ReportGenerator` preMarketAlerts loop and fire on EITHER condition: `abs(changePct) >= threshold || abs(changePct) >= ABS_MOVE_FLOOR`. Floor-only fires append "ירידה גדולה (תנודתי רגיל לטיקר זה)" so the user knows it's big-in-points but normal-vol. The BC4 buy recommendation also got a `>= ABS_MOVE_FLOOR → 100`-share tier so floor-fired drops still get a rec (RKLX rarity ≈1.34 < 1.5 would otherwise yield 0). The 10% floor is tunable. (`ABNORMAL_DIAG` per-ticker log added in BE is what pinned this down — remove it once confirmed on device.)
**Note:** `DashboardSummary.ivByTicker: Map<String,Double>` already exists (built from open positions' `impliedVolatility`); the NEW10 high-IV screen reads it directly. There is no per-ticker IV timestamp — only a global `lastIvRefresh`.

### `unrealizedPnL` must match IBKR mark-to-market — NO commission on unrealized
Per CLAUDE.md domain rule. Commission is deducted only on realized P&L (close).

### `initialPremium` preserves the original premium across draft B-S updates
Captured on first save. DRAFT B-S updates may overwrite `premiumPerContract` (for non-CSP); `initialPremium` is the audit trail.

---

## External APIs

### IV source try-order (and the outdated comment/settings text)
`IvService.fetchIv(ticker, avKey, tradierKey, rapidKey, mdKey, …)` is the single IV entry point. The **actual** runtime order (verified in code, follow the `IV_SOURCE` logs):
1. **Cache** (`IvCacheEntity` / `iv_cache` JSON)
2. **Marketdata.app** (primary — `mdKey`)
3. **Massive.com** (`massiveKey`, only if key present; 60s cooldown after 429)
4. **Yahoo** (no key)
5. **Alpha Vantage** (`avKey`, skipped if blank — demo key doesn't work)
6. **Tradier** (`tradierKey`, dev token, 15-min delayed)
7. **RapidAPI** (`rapidKey`, Yahoo wrapper)
8. **Historical volatility** (last-resort fallback computed locally)

**Gotchas to remember:**
- The KDoc comment above `fetchIv` (line ~88) lists a DIFFERENT order ("Cache → Yahoo → Alpha Vantage → Tradier → Marketdata → RapidAPI → Historical") and is **OUTDATED** — Marketdata is actually first after cache, and Massive isn't even in the comment. Trust the code / `IV_SOURCE` logs, not the comment. The Settings IV-key description text is likewise stale.
- Settings exposes **4** IV key fields: **AlphaVantage, MarketData, Massive, RapidAPI**. **Tradier is used in code (source #6) but has NO settings field** — so `tradierKey` is effectively always blank unless added. Worth a settings field if Tradier coverage is wanted.
- IV is persisted on `PositionEntity.impliedVolatility` (open positions) → that's what `DashboardSummary.ivByTicker` is built from. There's **no per-ticker IV row** for watchlist-only tickers; Group BH's `HighIvScreen` holds those in an in-memory `_extraIv` map (not persisted — no DB row, no schema change).

### Alpha Vantage free tier: 25 req/day + 1.5s between calls
**Symptom:** "Note: Thank you for using Alpha Vantage…" returned instead of data; all calls fail rest of day.
**Fix:**
- Throttle: 1.5s between calls
- Cache aggressively in `IvCacheEntity` and `iv_cache` JSON pref
- Track daily count; surface to UI when at 20+/25
- Pre-market sync may consume daily budget — document for user

### Massive API: 60s cooldown after 429
Stored in `massive_rate_limit_at` DataStore key. Skip Massive entirely for 60s after a 429.

### Exchange rates from `open.er-api.com`
Free, no key, 1 req/24h cache. Cached in DataStore. Don't switch to a different provider without coordinating.

### Finnhub doesn't return dividend payment date
Symptom: "תאריך תשלום: לא זמין" hardcoded as fallback because Finnhub omits this. Plan: use Yahoo or Alpha Vantage for payment date when needed (see roadmap S14).

---

## ML Kit

### `text-recognition:16.0.0` triggers 16 KB page-size warning
**Symptom:** Build warning: `lib/arm64-v8a/libmlkit_google_ocr_pipeline.so` not aligned at 16 KB boundaries.
**Why it matters:** Required for Google Play submissions targeting Android 15+ from Nov 1, 2025.
**Active issue:** I5 — needs ML Kit version bump or workaround.

### ML Kit is declared TWICE in `app/build.gradle.kts`
Lines 73 and 97 both declare `com.google.mlkit:text-recognition:16.0.0`. Harmless dependency-wise, but worth cleaning up when touching the file.

---

## Background work

### `FlexSyncWorker` can be killed by Android battery optimization
**Symptom:** Auto-sync stops working "for some users" — no error, just silence.
**Reason:** Aggressive vendor battery optimizers (Xiaomi, Samsung, Huawei) freeze WorkManager periodic workers.
**Fix:** Show a settings option that opens battery-optimization exclusion intent. Document in settings. Cannot be auto-fixed.

### `AlertWorker` scheduling is in `OptionsTrackerApp.onCreate()` directly
Not behind coroutine/prefs check. Logs `ALERT_SCHEDULE`. If `adb logcat | grep ALERT_SCHEDULE` is empty after a Clean Build, the Application class isn't being instantiated — check `AndroidManifest.xml` `android:name=".OptionsTrackerApp"`.

### `DraftUpdateWorker` should NOT update CSP draft premiums (active issue S16)
Per CLAUDE.md Draft Update Rule + Dima's request. Currently still updates CSP premiums; needs disable for `strategyType == CASH_SECURED_PUT && status == DRAFT`.

---

## UI / Compose (OPT-specific)

For general UI rules (RTL, LTR wrapper, +/-, hardcoded colors, 2-decimal numbers): see `shared/conventions.md`.

### OPT history: 29 hardcoded color replacements in April
Background agent did 29 `Color(0x...)` → `AppTheme.colors.X` replacements across 7 files in April 2026. **Two times already.** Grep `Color(0x` to spot regressions before they accumulate again.

### LTR rule has been broken in 6+ screens repeatedly
The general LTR rule lives in `shared/conventions.md`. For OPT specifically, the violation pattern is consistent — newly-added Composables miss the wrapper. Active issue tracked in `state.md`.

### Dates rendering "wrong" was an ISO-FORMAT issue, NOT a bidi/RTL problem
**Symptom:** dividend/event dates showed as `2026-06-16` and looked reversed/foreign to Dima, who wanted `16-06-2026`.
**The trap:** Groups AV→AX burned multiple rounds treating this as an RTL bidi bug — adding `textDirection = TextDirection.Ltr`, then a Left-To-Right-Mark (U+200E) prefix, then both. None were the real fix.
**Root cause + fix (Group AZ, commit `bfbbcc1`):** the dates were simply in ISO `yyyy-MM-dd`. Dima wanted day-month-year. The fix is to **reformat the string** to `dd-MM-yyyy` (a file-scope `fmtDate(iso)` using `DateTimeFormatter.ofPattern("dd-MM-yyyy")`). A plain `dd-MM-yyyy` numeric string renders LTR naturally — once reformatted, ALL the LRM/textDirection hacks were removed.
**Lesson:** when a date "looks wrong," first ask whether it's the **format** (ISO vs dd-MM-yyyy) before reaching for bidi tooling. Money amounts with +/- still need the LTR wrapper (that's a genuine bidi concern); bare dates usually just need reformatting.

### Calendar arrows feel reversed in RTL
**Symptom:** Right arrow goes to next month, left arrow to previous (per Dima).
**Reason:** RTL flips visual direction but logical "next" should still be ← in Hebrew.
**Fix:** Decouple visual direction from logical action — track open issue S2 in roadmap.

---

## Process / workflow

### "All agents done. Working tree clean" doesn't mean it's verified
Claude Code reports "all 6 background agents have completed successfully" — this means the agents finished, NOT that the work is correct on device. **Always:** `git pull && ./gradlew assembleDebug && install on device && smoke-test the changed screens` before declaring a round done.

### Don't re-prompt completed items
**Symptom:** Claude Code wastes a session redoing P3 items because the spec didn't mention they were already done.
**Fix:** Spec Writer agent must read `roadmap.md` first. State Tracker agent confirms before any new round.

### Clean Build is required after Application/Manifest/DB changes
**Symptom:** Logs that should appear are empty after Run; behavior unchanged despite committed code.
**Fix:** Tell Dima to do **Clean Build** (not just Run) when changes touch `OptionsTrackerApp.kt`, `AndroidManifest.xml`, or Room schema. Lesson learned March/April 2026.

### Background AGP / network errors during build are usually transient
**Symptom:** "Could not resolve com.android.tools.build:gradle:X.Y.Z".
**Fix:** Retry. If repeated, check `gradle.properties` for proxy/mirror config.

### `git sync` alias = fetch + merge + push
Configured in Dima's git config. Don't assume it's a standard git command in other contexts.

---

## Security

- **Don't log Flex XML content** — contains account numbers and balances
- **API keys live in DataStore plain** for now — migration to EncryptedDataStore is open work
- **`API_KEYS` log tag** in `AppPreferences` only logs `len=N first4=ABCD`, never full keys — preserve this pattern when adding new providers

---

## Pitfalls to avoid

- **Don't add new dependencies without flagging them.** Hilt / Compose / Room / WorkManager / ML Kit / Coil / Gson are the load-bearing seven. Resist anything that overlaps.
- **Don't introduce kapt** — KSP only.
- **Don't bump Room DB version without a migration.** v30 with 21-migration chain is the current state.
- **Don't assume `CLOSED` enum value.** It's `CLOSED_BTC`. Other closes are `EXPIRED` / `ASSIGNED` / `ROLLED`.
- **Don't store secrets in plain SharedPreferences** — use DataStore (which we do) until migration to EncryptedDataStore lands.
- **Don't change `syncSource` enum semantics** — it's what protects manual data on `fullResync()`.
- **Don't change the +/- left-of-number convention** — Dima will spot it immediately and ask for revert.

---

## Log tags reference (OPT)

When debugging, filter `adb logcat` by these tags:

- `IV_CACHE_BUILD` — Massive prefetch / IV cache population
- `IV_LOOKUP` — IV lookup attempts and cache hits/misses
- `IV_SAVE` — Position save events with IV
- `OWL_DEBUG` — IBKR OWL assignment detection
- `FUNDS_TRACE` — `availableFunds` parsing
- `PORTFOLIO_DBG` — portfolio value calc
- `SYNC_SCHED` — FlexSyncWorker scheduling
- `ALERT_SCHEDULE` — AlertWorker scheduling (empty = Application class not instantiated → Clean Build needed)
- `WHEEL` — wheel cycle detection
- `PREMIUM_DAY_TOTAL` — premium-of-day rollup
- `API_KEYS` — masked key presence (`len=N first4=ABCD`)
- `CC_ASSIGNMENT` — CC assignment probability calc
- `CSP_CASH` — CSP cash recommendation calc — *currently EMPTY (branch not reaching)*
- `PROFITABLE_REPORT` — profitable-tickers aggregation — *currently EMPTY*
- `MONTHLY_TARGET` — monthly target unification (planned)
- `ABNORMAL` — abnormal price movement alerts
- `BTL_DEBUG` — temp tag for "בתהליך" duplicate hunt
- `PORTFOLIO_SORT` — portfolio sort mode changes
- `POST_IMAGE` — Coil image fetch (relative URLs failing)

---

## "Toast already killed" log spam

**Symptom:** `Toast already killed` error in Logcat.
**Reason:** Toast shown from a Composable that was already disposed (e.g., navigation happened mid-Toast).
**Fix:** Use `SnackbarHost` for in-app notifications, OR show Toast from Application context only after confirming lifecycle is still active.
**Tracked as:** S20 in roadmap.md.

---

## Color regression watchlist (OPT-specific reminder)

The color semantics defined in `shared/conventions.md` (green = realized profit, blue = premium received, red = realized loss) have been broken multiple times in OPT — most recently after the activity feed dedup change in commit `7df9465`, where editing a position changed the row color from blue (premium) to green (realized profit) even though no realization happened.

**Pattern to watch:** any change to ActivityEventEntity insert/update logic, ProfitCalculator coloring, or feed rendering can silently swap blue↔green. PR Reviewer should grep for `PrimaryGreen\|AccentBlue` near event/feed code on every PR touching those areas.

**Common confusion:**
- An OPEN CC has both: premium received ($1.50 collected) AND unrealized P&L (mark price moves). The premium portion is BLUE (locked income, no realization yet — but it's already yours). Unrealized portion has its own coloring.
- A CLOSED position has only realized P&L → GREEN if profit, RED if loss.
- A position that gets EDITED but stays open should retain its prior coloring (blue if it was a premium-received row, etc.).

---

## Critical: verification logs MUST appear in logcat before declaring "done"

There's a pattern of "fix committed but didn't actually take effect." From now on, EVERY fix that includes a log tag MUST be verified by Dima running `adb logcat | grep <TAG>` after a Clean Build. If the expected log line doesn't appear, the fix is NOT done — even if `git log` shows the commit.

Examples (currently broken):
- `CSP_CASH` log empty → `cashNeeded` calc isn't being called
- `PROFITABLE_REPORT` log empty → aggregation function never runs
- `ALERT_SCHEDULE` log empty → AlertWorker not actually scheduled

When a verification log is empty, the bug is upstream of the calc — find which composable/function should have triggered it and fix that path first.
