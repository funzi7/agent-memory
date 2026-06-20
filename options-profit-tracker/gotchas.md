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

### SignedFormatter drops the "+" for positives; per-position values after a Hebrew label need `.percent`; em-dash ranges need an LTR span (Group BI, commits `47a1dcf` BI1/BI2 + `0160887` BI3)
Three related number-formatting lessons from Group BI:
- **`SignedFormatter.currency()`/`percent()` now OMIT the "+" for positives (GLOBAL change).** The positive branch returns `""`, not `"+"`. Only negatives show a sign (a "-", always after the ‎ LTR mark so it sits on the LEFT). This changed every call site of those two functions at once. Do NOT reintroduce a "+". `currencyUnsigned`/`percentUnsigned`/`number` were never signed and are unaffected. Verified nothing parses the "+" back out (`grep .startsWith("+")` = none).
- **A signed value sitting AFTER a Hebrew label must use `SignedFormatter.percent`/`.currency`, not a raw `"%.1f%%".format(...)`.** The per-position "שנתי" annual badge had a `CompositionLocalProvider(LayoutDirection.Ltr)` wrap (BH3) yet the minus STILL rendered on the right — because the badge string starts with the Hebrew label, which sets an RTL paragraph for the whole Text and the layout-direction wrap doesn't change the text's bidi base. The embedded ‎ mark inside `SignedFormatter.percent` is what forces the number LTR. Lesson: layout-direction wrap ≠ bidi base; for a number glued to Hebrew, the ‎ mark is mandatory.
- **Numeric ranges with an em-dash ("$X — $Y") or a "%-%" range reverse in RTL.** The cheapest fix that works: prepend `${SignedFormatter.LTR}` (the ‎ mark) to the START of the whole string — a leading ‎ forces the entire line to an LTR base so the range reads left-to-right while a trailing Hebrew word (e.g. " שנתי") still shapes correctly. That's exactly what BI3 did to the six New-Position premium-tier/annual strings (3 tier "<emoji> <hebrew>: $X — $Y" + 3 "12%-18%"/"18%-25%"/"25%+ שנתי"). A heavier alternative (LTR span via `CompositionLocalProvider(LayoutDirection.Ltr)` around just the numeric part, Hebrew label as a separate Text) also works but is rarely needed — reach for the leading-‎ first.
- **Trap (cost me many rounds in BI3):** those premium tiers are INLINE `Row{Text}` blocks in `AddPositionScreen.kt` (~1690-1718), NOT a `PremiumTierBox` composable — don't trust a stale memory of that name; grep the actual file before editing.
- **Edit-tool trap with emoji in source:** the tier Texts store the check/cross as LITERAL escape text `✅`/`❌` (not the rendered glyph). An Edit `old_string` containing the emoji glyph ✅/❌ will NEVER match (JSON decodes `\uXXXX` in your string to the codepoint, so you send a glyph; the file has the backslash-u text). Fix: either copy the literal `✅` text, or — better — anchor your Edit on a PURE-ASCII unique substring that avoids the emoji entirely (that's how BI3 finally landed: anchored on `"${if (minAchieved)` and `Text("12%-18%`).

### Group BJ (commits `d8ad9ff` + `afca093`) — corrects/extends the Group BI notes above
- **The positive "+" lived in MANY places, NOT just `SignedFormatter`.** BI2 only removed it from `SignedFormatter.currency()/percent()`, but most of the "+" the user actually saw came from `formatCurrency` + `formatCompactCurrency` (DashboardScreen.kt) plus ~13 inline sign sites: the fx-converter `fxSub`/`annualCompact`/top-movers gainers+losers/cleanNote-change/premium-credit lines in DashboardScreen, `Charts.formatBarValue`, `PortfolioHistoryScreen.signed`, `ActivityFeedScreen`, `UnrealizedPnlScreen`, `WatchlistScreen`, `ReportGenerator` daily-change, `AddPositionScreen` theo-price diff. **A global "remove +" MUST `grep -rn '"+"'` and sweep every `if (x >= 0) "+" else …` / `if (x > 0.005) "+" else …` value-sign, changing the positive branch to `""`.** KEEP only: the `"+${chipTickers.size - 4}"` overflow counter and the ReportGenerator DTE-boost NOTE `"+${...}% בגלל …"` (descriptive text, not a value).
- **A leading ‎ is NOT enough when the line STARTS with a Hebrew label** — this corrects BI3's "reach for the leading-‎ first" note above. BI3's leading-‎ fixed the `"12%-18% שנתי"` labels (they start with ASCII digits) but the tier rows `"✅ מינימלי: $X — $Y"` start with the emoji+Hebrew, so the embedded `$X — $Y` range still reversed on device. BJ2 fixed it by SPLITTING each tier row: an inner `Row(verticalAlignment = Alignment.CenterVertically){ Text("✅ <hebrew>: ") ; CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr){ Text("$X — $Y") } }`. Rule: **when a line begins RTL, put the LTR numeric range in its own `LayoutDirection.Ltr`-wrapped Text, with the Hebrew label as a separate sibling Text.**
- **Prefilled strike must be normalized via `fmtStrike`.** Opening Add-Position from the most-profitable-trades route passed the strike as a raw string → field showed `"75.00"`. `prefillFromBestTrade` (AddPositionViewModel) now does `strikeParts[0].toDoubleOrNull()?.let { fmtStrike(it) } ?: it` (also on the spread leg). Other prefill sites (loadPosition, parsed OCR, best/row) already used `fmtStrike` — mirror that.
- **PROCESS FAIL to avoid:** in this round I committed+pushed `d8ad9ff` while `./gradlew :app:compileDebugKotlin` was reporting **BUILD FAILED**, because I didn't read the error output before committing (a botched regex PowerShell had ballooned AddPositionScreen.kt to 3008 lines with an unbalanced brace). Recovery: `git show <good-commit>:<file> > <file>` to restore the known-good version, then re-apply the edits cleanly. **ALWAYS confirm "BUILD SUCCESSFUL" in the output before `git commit`.** Also: prefer a single whole-block PowerShell `IndexOf`-based replace over a multi-match regex when restructuring Compose blocks — the regex `Singleline` `.*?` matched across the wrong boundaries and interleaved tiers.

### Group BK (commits `74f63db` BK1 + `5e7cc88` BK2) — "+" belongs on price-MOVEMENT %, not on money
- **BJ over-corrected by stripping "+" EVERYWHERE.** The user wants "+" BACK on stock daily-MOVEMENT % (a +5% rise reads as meaningfully positive) but NOT on P&L / returns / money. So the rule is now nuanced, not global.
- **Movement-% sites that SHOW "+" (positive branch = `"+"`):** DashboardScreen top-movers gainers (~555) + losers (~620), the abnormal-note changePct (~1594), `ReportGenerator` daily-change string (~672), `WatchlistScreen` day-change (~166, written `if (pct >= 0) "+" else "-"` with `abs(pct)` so negatives show "-X%"). AlertsScreen's `alert.changePercent` renders with its own ▲/▼ arrow (no "+").
- **Money / P&L / return sites stay WITHOUT "+" (positive branch = `""`):** `formatCurrency`, `formatCompactCurrency`, `annualCompact`, fx `fxSub`, `PortfolioHistoryScreen.signed`, `ActivityFeedScreen` $, `UnrealizedPnlScreen` %, `Charts.formatBarValue`, premium credit/debit, theo-price diff. Don't blanket-revert BJ — only the movement-% sites get "+" back.
- **"ייצא מהקאש" (cash leaving on assignment) shows a leading minus `"-$X"` in LossRed** — it's an outflow. The value `netCashOnAssignment = (strike − premium) × 100 × contracts` is positive; the minus is hardcoded in the string (`"-\$${...}"`), and the Hebrew label "ייצא מהקאש: " is a SEPARATE Text from the LTR-wrapped value Text (so the Edit anchor is the `netCashOnAssignment` value line, NOT the Hebrew label).

### Group BP (commit `942af85`+`46f717f`) — MarketData HTTP 203, splitApiKeys no-space, fast build gate
- **MarketData returns HTTP 203 (Non-Authoritative) for a DELAYED data feed — ACCEPT it.** The user's plan serves 24h-delayed option data as `203`, with the SAME body structure and the IV present. Rejecting anything `!= 200` made liquid tickers (NVDA/SOFI/SOXL) fall through to Yahoo/AlphaVantage and end as "—" — *after MarketData had already spent the credits*. Fix in `fetchIvFromMarketdata`: `if (responseCode != 200 && responseCode != 203)`. (The "prefetchContractIvs 203" item from the task was a no-op — that path uses the Massive API, not a MarketData chain.)
- **`splitApiKeys` must NOT split on space.** It split on `"\n", ",", ";", " "`; a key with a stray leading/trailing space got forged into invalid fragments — the device showed `keyIndex 1/3` for a 2-key field (the failover log's count is the quick tell). Split on `\n , ;` only, then trim+filter+distinct.
- **Routine build verification is the FAST gate, NOT `clean assembleDebug`.** Use `./gradlew :app:compileDebugKotlin 2>&1 | tee /tmp/optbuild.log`; PASS only if `grep "^e: " /tmp/optbuild.log` is EMPTY *and* the output has "BUILD SUCCESSFUL". `clean assembleDebug` is slow (caused 30+ min rounds) — run only at the very end for an installable APK. Codified in CLAUDE.md + AGENTS.md. The recurring failure: reading the gradle *tail* instead of grepping `^e: ` pushed broken builds in two prior rounds — grep `^e: ` every time.

### Group BM (commit `34b5ba3`) — IV multi-key failover, 4s timeouts, historical fallback prices, key-log security
- **IV providers now support MULTIPLE keys (failover).** A provider's key field may hold several keys (newline / comma / `;` / space separated). `IvService.splitApiKeys(raw)` parses them; `fetchIv` loops over each key per provider — first non-null wins, on null it logs `IV_KEY_FAILOVER` and `delay(400)` then tries the next, and a blank field → empty list → provider skipped entirely (no wasted call). This is what lets a rate-limited MarketData key roll over to the next. **NEVER log the key value — only keyIndex/size.** Provider order is unchanged (Marketdata→Massive→Yahoo→AlphaVantage→Tradier→RapidAPI→Historical).
- **`withTimeout` does NOT cancel a blocking `HttpURLConnection`.** The VM wraps each fetch in `withTimeout(8_000)`, but a blocking socket read ignores coroutine cancellation — so the REAL bound is the connection's `connectTimeout`/`readTimeout`. They were 10_000; BM cut all of them to 4_000 so a slow/limited key fails fast and failover proceeds. If IV sync ever "feels stuck" again, check the socket timeouts, not just the coroutine timeout.
- **The historical-vol fallback (Source F) only fires when `fetchIv` is given non-null prices.** `syncIvForTickers` used to pass `currentPrice=null, previousPrice=null`, so a ticker whose option-IV sources all failed got nothing. BM reads the stock + watch-scan snapshots once and passes each ticker's `current`/`previous` (the snapshot JSON keys) into fetchIv, so empty tickers get an HV estimate. Snapshot price keys are `"current"` / `"previous"` (per-ticker nested object).
- **Cache fn is `cacheIV(ticker, iv)`** (in-mem, 5-min TTL) — not `saveToCache`. Don't invent the latter.
- **Never log API-key characters or prefix.** Removed the `first4=${key.take(4)}` SAVE logs (openai/anthropic/gemini) → `present=${key.isNotBlank()}`. `len=` alone is borderline; prefer present-only.
- **`syncIvForTickers` had been silently skipping Massive** — the fetchIv call passed only 5 positional key args (massiveKey defaulted to ""). BM passes massiveKey too.

### Group BL (commit `968ca89`) — session badge weekday check, parallel IV sync, Tradier field
- **Session badge ("פרה"/"אחה״צ") must check the WEEKDAY, not just the NY time.** It was computed from `nyTime` (LocalTime) only, so Sat/Sun 4:00–9:30 ET wrongly showed "פרה". Fix: compute `nyNow = ZonedDateTime.now(America/New_York)`, derive `isWeekend = dayOfWeek in {SATURDAY, SUNDAY}`, and gate both windows on `!isWeekend`; badge shows "סגור" on weekends. (DashboardScreen.kt ~482.) Same trap applies to anything that infers market-open from time alone.
- **IV sync must run CONCURRENTLY.** `syncIvForTickers` fetched 25 tickers SEQUENTIALLY, each `withTimeout(20_000)` + `delay(800)` → 6–8 min when sources were slow/failing (felt stuck). Fix: `coroutineScope { list.map { async(Dispatchers.IO){ sem.withPermit { withTimeout(8_000){ IvService.fetchIv(...) } } } }.awaitAll() }` with `Semaphore(6)` and an `AtomicInteger` progress counter; apply results after the join. Finishes ~10–20s. Needs imports `kotlinx.coroutines.async`, `awaitAll`, `kotlinx.coroutines.sync.withPermit` (Semaphore/Dispatchers/withTimeout/coroutineScope were used fully-qualified). Keep the try/finally that resets `_isSyncing`.
- **Tradier had no settings field, and the IV try-order helper text was wrong.** IvService uses Tradier as source #6 but SettingsScreen never exposed an input for it (state.tradierApiKey/updateTradierApiKey/saveTradierApiKey all existed already — just no field). Added the OutlinedTextField. The helper text claimed the order was "Alpha Vantage → MarketData → RapidAPI" — the REAL order is "MarketData → Massive → Yahoo → Alpha Vantage → Tradier → RapidAPI → historical volatility" (prices: Yahoo v8 → Finnhub → Yahoo v7). When you see an order/description string in settings, verify it against IvService, not the comment.

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
- **Don't change the +/- left-of-number convention** — Dima will spot it immediately and ask for revert. NOTE (Group BI): positives now show NO sign at all (the "+" was dropped globally in `SignedFormatter`); only negatives show a "-", and it stays on the LEFT via the ‎ mark. Keep it that way — don't re-add "+".

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

- (Group BQ) Update agent-memory by APPEND + injected `git rev-parse --short HEAD`, never Edit (anchor-matching fails repeatedly) and never hand-typed hashes. MarketCalendar centralizes NYSE non-trading days (weekend + computed holidays w/ observed shift + Good Friday). NOTE: the calendar grid renders day cells INLINE in CalendarScreen.kt — there IS a separate CalendarDayCell.kt component but it is NOT used by the month grid; edit the inline Text.

- (Group BR) Realized P&L is DISPLAYED as ibkrRealizedPnl ?: calc, and IBKR reports $0 for assignments, so assigned options ALREADY show $0 — do NOT change realizedPnL to "fix" an assigned $0. Only the EXPECTED projection (expectedProfitAtExpiration ~line 286, NOT realizedPnL ~line 100) needed aligning: ITM/assigned->$0, OTM/expires->premium. The real wheel gain lives on the STOCK (fifoPnlRealized of STK trades), not the option.

### Stock realized P&L = IBKR fifoPnlRealized on STK trades (not the option)
**Symptom:** Assigned-wheel gains/losses (RKLB ~+$1504, PLUG ~-$3000) were invisible — the option correctly shows $0 on assignment, but the real gain/loss lives on the STOCK that was assigned then later sold.
**Reason:** IBKR reports it as `fifoPnlRealized` on the STK sale trade. The Flex trades parse (ImportViewModel ~line 221) DROPS all STK rows (`assetCategory != OPT && != FOP -> null`), so it was never captured.
**Fix (Group BS prime):** a SEPARATE pass `captureStockRealized(xmlTrades)` aggregates STK `fifoPnlRealized` per ticker per month into AppPreferences JSON (`stockRealizedByTicker`, no DB migration) — STK is NOT turned into a position. Shown in a SEPARATE dashboard section, kept apart from the options/premium realized totals. Do NOT fold stock realized into `realizedPnL()` / the options total.

### Stock section shows REALIZED stock P&L only (completed sales), not open-CC unrealized
**Context:** The "💰 רווח/הפסד מניות (ממומש)" section / StockRealizedScreen reflects IBKR `fifoPnlRealized` on COMPLETED STK sales only. An OPEN covered call whose underlying stock has an unrealized loss/gain does NOT appear there until the shares are actually sold (assignment or manual close) — this is CORRECT, not a bug. Example: PLUG still open → not shown; RKLB closed/sold → shown. Do not "fix" the absence of an open holding by injecting unrealized numbers into this section; if projected/unrealized stock P&L is wanted it belongs in a SEPARATE clearly-labeled view (open question, pending user decision).

### Projected stock P&L (open ITM CCs) is DISPLAY-ONLY — never feeds realized/expected
**What:** `DashboardViewModel.projectedStockPnl` computes (strike − avgCost) × shares for OPEN covered calls that are ITM (currentStockPrice >= strike). It is shown on the compact card ("📊 צפוי (CC פתוח)") and as a separate section in StockRealizedScreen.
**Rules:** ITM gate is `currentStockPrice >= strikePrice`; OTM CCs (keep the stock — no forced sale) and CSPs (no shares yet) are EXCLUDED. It is the same stockDelta BR1 removed from `expectedProfitAtExpiration` — recomputed for display only. Do NOT let it feed any realized/expected/options total, and do NOT change expectedProfitAtExpiration / realizedPnL / ibkrRealizedPnl to source it. Realized stock section (BS/BT) still shows only completed sales; projected is the pre-assignment view.

### Imported CCs have NULL stockPurchasePrice/sharesHeld on the entity — cost+shares live in stockSnapshot
**Symptom:** A calc that reads `pos.stockPurchasePrice` / `pos.sharesHeld` silently drops every IMPORTED covered call (e.g. PLUG), keeping only manually-entered ones (MULL/ASTS).
**Reason:** The Flex import stores a CC cost basis + share count in the stockSnapshot JSON (AppPreferences.getStockSyncSnapshot, keys `avgCost`/`shares`/`current`) + manual overrides — it only sets `currentStockPrice` on the position entity, NOT stockPurchasePrice/sharesHeld.
**Fix:** For ANY CC cost/share math use `AvgCostResolver.resolve(ticker,pos,prefs)` (suspend) or `AvgCostResolver.resolveFromSnapshot(ticker,pos,mergedSnapshot)` (sync, for Flow `combine` builders) for avgCost, and read shares from the snapshot (`optInt("shares")`, override-first) — NEVER trust the raw entity fields. Canonical reference: the `openPositions` StateFlow + `projectedStockPnl` (Group BV) in DashboardViewModel.

### The recurring RTL-date bug is now solved by the shared LtrText component — USE IT
**Symptom:** dates/numbers reverse inside the RTL Hebrew UI (e.g. "2026-06" → "50-2026"); totals wrap/truncate to a second line. This kept recurring because each new composable forgot the `CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr)` wrap.
**Fix (Group BW prime):** use `com.dima.optionstracker.ui.components.LtrText` for EVERY date / number / price / English string (it wraps the LTR provider and defaults `maxLines=1, softWrap=false`). For a header row, give the Hebrew title `Modifier.weight(1f, fill=false)` + maxLines=1 + TextOverflow.Ellipsis and put the amount in an LtrText so the number never wraps. Hebrew labels stay a normal Text. Codified in CLAUDE.md + AGENTS.md.

### LtrText fixes DIRECTION, not FORMAT — month/date format must be MM-YYYY / DD-MM-YYYY
**Symptom:** even after LtrText (LTR), a month chip reads "2026-06" — correct direction but wrong order; the app convention is month-before-year.
**Fix:** format the displayed string month-before-year (`fmtMonth("2026-06") -> "06-2026"`), keep LtrText so it stays left-to-right. Keep the underlying KEY ("YYYY-MM") for lookup — change only the shown string.
**Header layout rule:** the TITLE wraps (`softWrap=true` + `Modifier.weight(1f)`, NO maxLines/ellipsis — never truncate the title) and only the NUMBER is one line (LtrText, maxLines=1, softWrap=false, no weight). BW3 had wrongly truncated the title with ellipsis.

### IV quota cooldown: Double.NaN is the "quota" signal; cooldown is MONTHLY, key is hashed
**What:** to skip a provider key that hit its credit/quota until next month, the keyed IvService providers return `Double.NaN` on a QUOTA error (MarketData 402/429, AlphaVantage Note/Information/Error-Message, Massive/Tradier/RapidAPI 402/429/403). NaN is DISTINCT from null (= other failure) and from a value (= success).
**Rules:** NaN must NEVER be cached or returned as an IV — each per-key loop guards `value != null && !value.isNaN()` before cacheIV/return; on NaN it calls markKeyExhausted + logs, then tries the next key. fetchIv still only ever returns a real value or null externally. Cooldown is MONTHLY for ALL providers (MarketData credits reset monthly; AlphaVantage daily 25 treated as monthly — acceptable, it is a weak fallback). The key is identified by `k.trim().hashCode().toString(36)` (one-way) stored in AppPreferences `exhausted_keys_json` as hash->"YYYY-MM" (auto-resets when the month rolls over); the RAW key is NEVER persisted or logged — logs show only provider + keyIndex.

### IV key-status UI MUST reuse IvService.splitApiKeys + IvService.keyHash (1-based #N)
The IV failover loop logs keyIndex=i+1/size (1-based) — any key-status UI MUST reuse `IvService.splitApiKeys` (now public) + `IvService.keyHash` so the displayed "#N" AND the cooldown hash both match the failover loop exactly (no second hash, no drift). Finnhub is a SHARED key (prices + news + dividends), Massive = IV + dividends → group Settings sections BY PROVIDER with usage notes, not a key per feature. Never render or log a key value — status shows provider + #N + state only.

### IV status card #N count = IvService.splitApiKeys count
The IV status card "#N" comes from IvService.splitApiKeys (delimiters: newline, comma, semicolon) — real API keys contain none of these, so "shows 3 but I entered 2" means two keys are comma/semicolon-joined on one line (or a hidden extra line) in the STORED value, NOT a bug; the failover loop sees the same count (Logcat keyIndex=X/N).

- (Group CB) The rotating Sync icon on the dashboard is keyed on _isSyncing — any sync entry point (e.g. refreshAllPositionIVs) MUST set _isSyncing=true (guard + finally-false) or the icon will not spin and the buttons will not disable; one-shot getLastIvRefresh() reads go stale, observe the appPreferences.lastIvRefresh Flow for live UI.

- (Group CC) NEVER associate news (or any text->ticker mapping) by substring contains() — short symbols like ASTS hit forec/broad/pod-CASTS and arbitrary URL paths; carry the fetched source ticker on the item and match extra mentions with word boundaries (TICKER) on headline+summary, never on url.

- (Group CD) CompositionLocalProvider(LocalLayoutDirection=Ltr) sets LAYOUT direction only — it does NOT set a Text's bidi base direction. A Text whose string starts with a Hebrew char still resolves RTL and reverses embedded LTR number runs; force `style = TextStyle(textDirection = TextDirection.Ltr)` on mixed Hebrew+number labels that must read left-to-right.

- (Group CE) For a progress bar that must FILL left-to-right under an RTL app, wrap the fill Box in LocalLayoutDirection=Ltr (fillMaxWidth(fraction) aligns to start, which is RIGHT under RTL); and to mix a Hebrew label with LTR numbers, split them into separate Texts in a Row rather than one bidi-mixed string.

- (Group CG) To make a fill Box align to the LEFT under an RTL app, the LocalLayoutDirection=Ltr must wrap the PARENT Box (child alignment follows the parent's direction); wrapping only the children does NOT change where the fill sits.

Partial closes: partialNets + FlexSyncWorker create a closed slice record (fifoPnlRealized from the closing trade rows, never computed) + ActivityEvent; idempotent on re-import (explicit non-open ticker+strike+type+expiry+closeDate+qty guard — repository.isDuplicate would match the still-open row and must NOT be used for slices). CC reminder premium: prefers a daily Yahoo chain quote (strike >= max(price*1.02, costBasis), DTE 21-35, bid per share -> per-contract display); heuristic fallback. NOTE: premiumPerContract app-wide is per SHARE (total = x100xcontracts).

Feed shows ActivityEvent.amount (STORED at creation), NOT recomputed — so a P&L calc fix doesn't retroactively fix old feed rows; a one-time OptionsTrackerApp migration (FT2) reconciles amount/timestamp to ibkrRealizedPnl ?: realizedPnL and expiry/close@16:00 ET (amount only for rows that already had one; amount-less expiry rows keep null, timestamp-only). Auto-expire fires at 16:00 ET on the expiration date, not at ET-midnight (FT1).

Feed migration: ASSIGNED event timestamp must use the assignment date (assignmentDate ?: closeDate) — early assignments happen BEFORE expiry, so expirationDate@16:00 can even be a future date; only EXPIRED uses expirationDate, CLOSED uses closeDate.

Stock-sale realized P&L lives as STOCK_SOLD ActivityEvents (NOT positions) — fifoPnlRealized is already net of commission. Realized TOTALS sum closed POSITIONS in DashboardViewModel + ReportGenerator, so STOCK_SOLD is NOT yet counted there (Phase 2). EventType is exhaustive-when across feed + dashboard (icon-map, amtColor, eventPriority/feedEventPriority) — appending a value breaks EVERY no-else when at compile time; rely on the build to find them all (6 found for STOCK_SOLD). Feed migration: ASSIGNED timestamp uses assignment date; only EXPIRED uses expirationDate.

'מחק וייבא' must NEVER deleteAllPositions() — that wipes manual positions. Use deleteImportedNonDraftPositions() (sync_source!='MANUAL' AND status!='DRAFT'); don't wipe the stock snapshot (saveStockSyncSnapshot('{}')) either — BA3 prune handles refresh/removal while preserving manual entries.

Much of the app logs DEBUG at Log.e level (CC_ENTRY/UNREAL_DISPATCH/CC_CALL etc.) — these flood 'level:error' in Logcat. CC ones demoted in FX (Log.e→Log.d); others (startup tags: APP_ONCREATE/FEED_FIX/BACKFILL/FEED_CLEANUP) remain at Log.e but are once-per-startup, not per-recomposition spam.

NEVER run the Flex import/sync in viewModelScope — switching tabs clears the Settings VM and cancels it mid-way (JobCancellationException in doImport), silently aborting the capital update (applyPortfolioToSettings) + stock-sale capture (importStockSoldEvents/captureStockRealized). Use the app-scoped @Singleton CoroutineScope (AppModule.provideApplicationScope). Light helpers can stay on viewModelScope.

applyPortfolioToSettings saves capitalAllocatedOptions (the dashboard 'הון זמין' = summary.allocatedCapital). It must run INLINE in the app-scoped import coroutine (now a suspend fun) — if it launches its own viewModelScope, a tab-switch cancels it and capital is silently NOT saved, while portfolioValue still updates via saveEquitySummaryNav in fullResync. Pairs with FY (import on appScope).

Dashboard 'הון זמין' (allocatedCapital) priority in ReportGenerator: manual(getAvailableFundsManual + isAvailableFundsManuallySet) > getAutoEstimatedFunds > MonthlyTarget.capitalAllocatedOptions. A manual pin overrides sync forever unless cleared; the sync now clears it (GA) when it has a real cash value (cash>0) via setAvailableFundsManuallySet(false) + saveAutoEstimatedFunds(cash). AppPreferences setter names: saveAutoEstimatedFunds / setAvailableFundsManuallySet (NOT set*Funds/save*ManuallySet — verify before calling).

STOCK_SOLD ActivityEvents are the per-sale source of truth (ticker + 'qty מניות @ $price' description + realized fifoPnl amount + trade timestamp); query via getEventsByTypeAndTicker(STOCK_SOLD,ticker). captureStockRealized stays the per-MONTH aggregate (DashboardViewModel.stockRealized). They are intentionally NOT a duplication: month total (card) vs per-sale detail (drill-down) vs chronological feed. Two feed surfaces both render STOCK_SOLD and both now route taps to stock_realized: ActivityFeedScreen.ActivityEventCard + DashboardScreen.DashboardActivityRow.

Short stock: parseStockPositions returns SIGNED qty (do not re-add abs). Snapshot merge is flip-aware (sign change always wins; else larger |qty|). Shorts (shares<0) are intentionally value=0/excluded from the portfolio total in GD1 — GD2 adds liability/MtM value + inverted unrealized P&L ((entry-current)*|qty|). The CC-projected-P&L loop skips shares<=0 by design (a short isn't a CC). KNOWN GD1 GAPS for GD2/GD3: (a) PortfolioEventsScreen still computes shares*price (שווי נוכחי) + dividend projections per-ticker → shows negative for a short; (b) FlexSyncWorker background merge keeps the >0 filter so shorts persist via MANUAL import only; (c) most snapshot reads use takeIf{>0} so they silently drop shorts.

StockRealizedScreen feed-tap (GB2/GE): the auto-expand+highlight LaunchedEffect MUST key on initialSaleTs too (not just initialTicker), else tapping a different sale of the same ticker won't re-fire. And the month chip must be set from the tapped sale's month (monthKeyOf(initialSaleTs)), else GC's month filter hides the sale. Zone nuance: data.byMonth/chips use IBKR tradeDate (ET) while monthKeyOf uses systemDefault (Thailand) — can disagree at month boundaries (pre-existing); GE picks monthKeyOf to stay consistent with the drill-down filter.

Short stock value = (avgCost - current)*|shares| (NOT shares*price = gross liability, which double-counts the cash proceeds). avgCost for a short MUST come from the short entry (Flex costBasisPrice captured on the flip), not the old long basis — GD2 overwrites it for shares<0 (snapshot avgCost-save block in ImportViewModel). Verify via SHORT_AVGCOST log (~714.78 for MULL). In PortfolioBreakdownScreen a short's value cell is colored as P&L (green value>0 / red value<0); included=true so it shows in the MAIN list. If no avgCost, GD2 falls back to GD1 (value=0/excluded, SHORT_VALUE log) — never guesses.

GF1 root cause: StockRealized drill-down month filter (monthKeyOf) MUST use America/New_York, not systemDefault — captureStockRealized byMonth keys + STOCK_SOLD ts are ET (IBKR tradeDate). A Thailand-zone monthKeyOf drifts the deep-linked month off the ticker's byMonth key so perTickerForMonth hides the row (symptom: only MULL/mid-month worked). Also match ticker case-insensitively (event ticker = raw symbol; row key = uppercased) and treat saleTs<=0 as the no-value sentinel.
GF3 split rule: a STK SELL with openCloseIndicator containing BOTH 'C' and 'O' is an assignment that CLOSED part of a long + OPENED a short. Displayed sale count = |tradeQty| - |resulting short (parseStockPositions, signed)|; realized stays IBKR fifoPnlRealized (already the closed-portion P&L). The short-open is the -N snapshot position, NOT a separate sale event. If the closed qty can't be determined, leave full qty (never guess).

Short <100 shares → 'לא נכלל' (not main 'מניות בתיק'); the main holdings list is 100+ only (longs via shares>=100||assignment, shorts via |shares|>=100). A sub-100 short KEEPS its inverted-P&L value (NOT 0) in 'לא נכלל' + the dashboard open-positions row. openPositionsCount includes distinct short-stock tickers (shares<0 + valid avgCost, not an existing option leg). Background sync (FlexSyncWorker) now mirrors GD1b+GD2a for shorts. PortfolioEventsScreen already excludes shorts from dividends via shares>0 guards (no change needed — a short pays, doesn't receive, dividends).

Feed-tap scroll (GH1): StockRealizedScreen's per-ticker table is a SINGLE LazyColumn item, so animateScrollToItem can't target a specific ticker row — use BringIntoViewRequester on the expanded row + bringIntoView() in a LaunchedEffect keyed on expandedSales (fires after the drill-down composes). Gate on a real feed tap (initialSaleTs>0); manual tap clears the pending scroll.
Assignment two-event rule (GH3): a STK SELL with openCloseIndicator containing BOTH 'C' and 'O' = assignment that CLOSED part of a long + OPENED a short. Emit TWO feed events: STOCK_SOLD (closed qty = |tradeQty|-|short|, realized = fifoPnlRealized) + STOCK_SHORT_OPENED (qty = |short|, amount 0, realized 0, non-clickable). 46 closed + 54 short-open = 100. STOCK_SHORT_OPENED amount=0 so realized totals never change; it's NOT in getStockSalesForTicker (STOCK_SOLD only). Movers: a short (shares<0) is a real position — phantom filter is shares==0 (NOT <=0).

Feed-tap scroll (GI1, FINAL): StockRealizedScreen's per-ticker table is ONE LazyColumn item — BringIntoViewRequester on an inner row does NOT scroll the outer list (GH1 failed). Use rememberLazyListState + onGloballyPositioned to measure the expanded row's offset within the table item (targetRowY - tableTopY via positionInRoot, an EXTENSION fn needing import) then listState.animateScrollToItem(1, offset). Gate on initialSaleTs>0; manual tap clears pendingScrollTicker.
STOCK_SHORT_OPENED (GI2): shows proceeds (qty × short-entry avgCost from snapshot) in the DESCRIPTION as neutral info ('@ 714.78 · התקבל $38,598'); amount=null so no $0.00 and never in a realized total. Emission is find-or-insert-or-update by ticker+timestamp (so re-import upgrades older rows). Realized totals come from captureStockRealized/positions, NOT feed-event amounts — short-open never affects them.

StockRealizedScreen scroll REQUIRES discrete LazyColumn items + animateScrollToItem(index) — offset-math via positionInRoot/onGloballyPositioned FAILS because the table top (tableTopY) is often still 0f when the LaunchedEffect runs. Discrete items: header card (0), sort header (1), itemsIndexed rows (2..); index = 2 + ticker index in the CURRENT sorted+month-filtered list. Removed global spacedBy; use per-item card background (rounded top on sort header, rounded bottom on last row) so rows still read as one card.
Short-open proceeds (STOCK_SHORT_OPENED) MUST come from rawFlexXml OpenPosition costBasisPrice (svc.parseOpenPositions), NOT the snapshot avgCost — the snapshot avgCost is unpopulated when importStockSoldEvents runs (it returned $0). Proceeds = qty × costBasisPrice, amount=null (informational, never a realized total). Tapping a short-open row routes to PortfolioBreakdown (no sale to drill into).

Feed-tap scroll index MUST be computed in a SEPARATE effect keyed on the FRESH filtered rows (the body list itemsIndexed renders) — computing it right after setting selectedMonth reads the STALE list (new-month ticker absent) → idx=-1 (GK1 bug). headerItems before ticker rows = 2 (total/chips card + sort header). If idx<0, leave pendingScrollTicker set to retry on the next rows change.
Short-open proceeds MUST mirror the ~595-606 open-positions parse: svc.parseOpenPositions(rawXml), key = underlyingSymbol?:symbol.first() (NOT uppercased), value = costBasisPrice?:costPrice → 714.78. The snapshot avgCost is NULL when importStockSoldEvents runs (don't rely on it). Tapping a short-open row shows a details DIALOG (qty/entry/proceeds/date from the description), not the general שווי תיק page.

Short-open feed row → REAL DETAIL PAGE, not a dialog (GL4, hash bfdaf84): the GL3 AlertDialog parsed the entry from the event DESCRIPTION (qty/@price/proceeds) which carried the trade price ≈690 — wrong. The detail page (ShortPositionDetailScreen, route short_detail/{ticker}) instead reads the LIVE snapshot via DashboardViewModel.shortHoldingFor(ticker) (same appPreferences.stockSyncSnapshot Flow as portfolioHoldings). avgCost there is the short ENTRY (≈714.78, GD2a overwrites the stale long basis for shares<0). Inverted P&L = (avgCost-current)*|qty|, green when price<entry. shortHoldingFor emits null when shares>=0 (not a short) so the page shows an empty state. Pattern: a feed row with no positionId that needs live position data should nav to a ticker-arg detail screen + read the snapshot, NOT embed a description-parsed dialog.

Feed "position not found" after re-import (GL4 TASK B, hash bfdaf84): an ASSIGNMENT/expiry feed event (e.g. "ASTX פקע והוקצה") keeps a positionId that points to an option position DELETED on re-import (NET-zero close) → tapping dead-ended on ClosePositionScreen.positionNotFound ("פוזיציה לא נמצאה"). isDeletedPosition (strikethrough) only catches positions removed via a POSITION_DELETED event with deleteTime>eventTs — a re-import removal has NO such event, so it was missed. Fix: VM exposes existingPositionIds (repository.getAllPositions().map{id set}); feed onClick routes positionGone (id !in set, guarded on set.isNotEmpty() to skip the load window) to onNavigateToTickerDetail(ticker). Working records (id still present) are unchanged. Both feed surfaces (DashboardActivityRow + ActivityFeedScreen.ActivityEventCard) fixed; ActivityFeedViewModel now injects OptionsRepository. Log tag FEED_CLICK "resolve positionId=.. gone=..".

- 2026-06-20 short-open flip (fb8b538): Never exact-match raw Trade and OpenPosition ticker strings for resulting stock quantity. Canonicalize to the trade key and retain the signed position (position ?: quantity ?: currentQuantity); otherwise netStockPos silently becomes 0 and no STOCK_SHORT_OPENED/proceeds log is produced. Keep amount=null so realized totals remain unchanged.

### 2026-06-20 — Stored mixed RTL/LTR feed descriptions need isolates
- OPT: d583a7e
- A single stored string that interleaves Hebrew with numbers, @, or currency may reorder segments in an RTL Text. Wrap each numeric/Latin run with FSI (`\u2068`) and PDI (`\u2069`); a Compose layout-direction wrapper cannot repair the stored string itself.

Assignment/expiry feed records: resolve a null/0/STALE positionId by TICKER before falling back to the ticker page (GL6, hash 4c9ee9a). GL4 over-routed because it treated positionId !in existingPositionIds as "gone" — but a re-imported assignment record (e.g. ASTX) keeps a stale/null positionId while a live position for the ticker STILL exists. Order: (1) valid stored id (>0 && in existingPositionIds) → its position page; (2) null/stale id on a LIFECYCLE event → positionIdByTicker[ticker.uppercase()] (VM map: getAllPositions filter status!=DRAFT, groupBy ticker, max id) → open that position; (3) ticker has no position → onNavigateToTickerDetail. The outer onClick branch must gate on eventType (NOT positionId!=null) or a null-id assignment never enters resolution (silent dead-end). Drafts/targets stay edit-nav, never ticker-resolved. MULL (valid id) keeps working; ASTX (stale/null id) now opens its real position page. Log tag FEED_CLICK "ASTX-case ... resolved=..".

Monthly-target card stock-realized subline (GL7, hash ab3e00e): the "יעד חודשי" card reflects the CURRENT month (summary.totalRealizedProfitThisMonth uses ReportGenerator YearMonth.now(), systemDefault). To add a "ממומש מניות: +$X" subline that is CONSISTENT with the adjacent options figure, compute the month key with the SAME java.time.YearMonth.now().toString() and read DashboardViewModel.stockRealized (StockRealizedData) via .totalForMonth(monthKey) — NOT a different zone. Note: StockRealizedData.byMonth keys come from captureStockRealized using IBKR tradeDate (ET); YearMonth.now() is systemDefault (Thailand) — they agree mid-month, can differ by one month for ~1 day at a month boundary (pre-existing nuance, same as GE/GF1). Matching the options figures YearMonth.now() was chosen so the two sit-side-by-side figures always show the same month label. combinedTotalRealized (the options "ממומש החודש") is OPTIONS-only (closedThisMonth positions) — it does NOT include stock realized, so the subline is purely additive. Render only when abs>=0.005; pnlColor; number in LtrText for RTL safety.

### 2026-06-21 — CC reminder must not infer current holdings from position history
- OPT: f45e1f7
- PositionEntity.sharesHeld survives after a CC closes/expires, and assignment history is historical rather than proof of a current stock holding. For CC reminders, accept only live OPEN rows (not assigned and not past expiry@16:00 ET), explicit manual overrides, or a stock snapshot that does not predate the latest CC close; log the decision with CC_REMINDER_FILTER.

Reusing dashboard stock-realized in OTHER screens (GL8, hash 48ddf3b): to show per-month stock-sale realized in a screen that uses a DIFFERENT VM (e.g. CalendarScreen → CalendarViewModel), inject DashboardViewModel = hiltViewModel() as a SECOND defaulted param and read its stockRealized (StockRealizedData), then .totalForMonth("YYYY-MM"). Do NOT recompute or add the source to the other VM. DashboardViewModel.init only schedules idempotent unique/KEEP WorkManager jobs + logs, so a second nav-scoped instance is safe, and only the light stockRealized prefs-flow is actually collected (the heavy flows stay cold). Month key = the screen's displayed month (currentMonth.toString() for the calendar; YearMonth.now() for the dashboard card) so the stock figure follows the same month as the adjacent options figure. CalendarViewModel.monthlyRealized / allTimeRealized are OPTIONS-only (closed positions, ibkr ?: ProfitCalculator) — stock is additive, never double-counted. Combined "total" lines are gated on the stock value being non-zero (else they'd just repeat the options figure).

### 2026-06-21 — Keep reports stock realized additive
- OPT: f561eeb
- MonthlyReport/OverallReport realized fields remain options-only. For Reports, aggregate the persisted stockRealizedByTicker JSON across tickers by YearMonth in the reports view model, filter it to the selected month/year/all-years, and add it only at presentation time; do not fold stock P&L into ReportGenerator, options target progress, or realized math.
