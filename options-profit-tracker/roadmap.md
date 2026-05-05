# OptionsProfitTracker — Roadmap

> History of completed work + forward plan. Update at end of each round.

עדכון אחרון: 2026-05-05

---

## Status legend

- ✅ Done & verified on device
- 🟡 Claimed done, unverified / partial
- 🔴 Broken / failed multiple attempts
- ⏳ Not started
- 🚫 Deferred (Dima said "not now")

---

## Repo + state

- **Repo:** funzi7/OptionsProfitTracker
- **DB version:** 16
- **Source on disk (in past sessions):** `/home/claude/OptionsProfitTracker/`
- **Latest packaged zip:** `/mnt/user-data/outputs/OptionsProfitTracker.zip` (from prior session — not in current sandbox)

---

## Completed rounds (✅ verified)

### P1 — Spread as single position
- `SpreadPosition` model with 2 legs (`spreadLegStrike`, `spreadLegPremium`, `spreadLegType`, `spreadLegDirection`, `spreadWidth`, `spreadMaxLoss`, `spreadBreakeven`)
- Expandable dashboard card (↓ chevron, opens to show both legs with colors)
- Flex import auto-detect spreads + trade aggregation (`detectSpreadPairs()`, `spreadPairToEntity()`)
- AddPosition dual-leg UI with color-coded legs (green SELL / red BUY)
- Real-time net premium / width / max loss calc

### P2 — Persistent IBKR sync
- `FlexSyncWorker` periodic via WorkManager
- `AppPreferences` DataStore (Flex token + query ID + intervals)
- Auto-sync intervals: 15 / 30 / 60 / 120 min
- Manual "Sync now" button
- `OpenPosition` mark price extraction → `currentPricePerContract`
- Trade aggregation `aggregateTrades()` — fixes IBKR's 10-contract split into 3+4+3 fills

### P3 — Close screens + CC reminder + Portfolio
- Long Put / Long Call close screen with STC + full P&L calc
- CC reminder banner for tickers with 100+ shares but no open CC
- Portfolio value auto-applied on sync from `EquitySummaryByReportDateInBase` (last element)

### P4 — Strategy UX + advanced strategies
- Strategy-unique colors + colored badges
- `Settings.save()` preserves imported portfolio data
- Iron Condor / Straddle / Strangle full preview calcs + spread entry UI
- `totalPremium` fixed for Straddle / Strangle

### Chain OCR
- `OptionChainParser` (text paste + ML Kit camera)
- Strike scoring: RoR / delta / bid-ask / OI / capital
- `StrategicRiskAnalyzer` — offline rule-based, Hebrew, 0–100 score, IV crush detection, earnings awareness, annualized return
- Optional Anthropic / Gemini API hook (future-ready)

### Bug round P1
- XML dedup by 6-field composite
- Closing detection exact `"C"` match
- Partial close support
- Available capital from `availableFunds` (not `cashBalance`)
- Import rewrite with NET position logic

### Bug round P2
- Chain OCR with IBKR mobile format + PUT/CALL toggle
- CC IV risk surfacing
- "Assigned TO/FROM me" split
- Closed trades query fixed
- Full resync button

### Features round P3 (partial)
- ✅ CC separate display: premium received / unrealized / total
- ✅ CC minimum premium calc per strike

### Large session 2026-04-28 — Major bug fixes (verified on device)
- **P&L matches IBKR exactly** ($4,532.72) — root cause: OWL assignment in `notes` XML attribute, not `code`
- CC reminder share doubling fixed (duplicate regex in `parseStockPositions()`)
- IV cache sanity bounds (10% / 300%) + auto-cleanup on startup
- Portfolio value uses last element of `EquitySummaryByReportDateInBase`
- Exchange rates moved to `open.er-api.com`
- Pre-market alerts (basic)
- Dashboard restructure with activity feed (separate screen exists, not yet inline)
- DB v14 → v16
- Theme: 29 hardcoded color replacements across 7 files (background agent)
- Best trades (individual)
- Min Premium Calculator: 12% annual target in AddPosition
- AI Analysis: enriched with ticker history + strategic analysis
- Login screen TODO comment placeholder
- Sync prices match by expiry date (was duplicating across same-symbol/strike different-expiry)
- Premium journal — UI now shows `realizedOnDay` (was showing `premPaid`)

---

## Active issues (🔴 / 🟡)

### I1. Spread display leg-matching 🔴
**Status:** Currently using a 3-pass SELL+BUY matching algorithm. Has been broken multiple times. Needs verification on a real Flex import. Dima reported earlier: "had 2 rows, now 0".

### I2. Activity feed showing "אין אירועים" 🟡
**Status:** Fix committed — DB inserts added at 5 points. Needs live verification — perform actions, confirm rows land in `EventEntity`.

### I3. Annual target screen 🟡
**Missing:** Bars for previous months + year selector. Currently only shows current year/month.

### I4. Black-Scholes premium auto-fill 🟡
Implemented but unconfirmed by Dima. Needs walk-through of new-position flow on device.

### I5. APK 16 KB page-size compatibility ⏳
**Symptom:** Build warning — `lib/arm64-v8a/libmlkit_google_ocr_pipeline.so` not aligned at 16 KB boundaries. Required for Google Play submissions targeting Android 15+ from Nov 1, 2025. Need ML Kit version bump or workaround.

---

## Pending — grouped by similarity (Dima's "קבוצות" pattern)

### קבוצה א — IV + Autofill 🟡
- **A1.** IV from external API (Yahoo / Alpha Vantage) or richer cache logic
- **A2.** Autofill on AddPosition: current price, shares held, IV, last premium per ticker (currently only current price + premium done)

### קבוצה ב — External sync 🟡
- **B1.** Exchange rates auto-update from API ✅ (verified)
- **B2.** Portfolio value + buying power from Flex XML ✅ (verified)
- **B3.** Pre-market / daily move alerts 🟡 (basic version exists; full version pending)

### קבוצה ג — Dashboard restructure ⏳
- **C1.** Move "פוזיציות פתוחות" out of dashboard into its own tab; in its place put the activity feed inline
- **C2.** Dashboard cards open NEW pages (not drill-down popups) — for "פוזיציות", "רווח צפוי", "בטחונות", "הכנסת פרמיה", "יעד שנתי"
- **C3.** Activity feed inline in dashboard (currently lives on a separate screen)

### קבוצה ד — P&L + Spread 🔴
- **D1.** Cents-level P&L mismatch with IBKR (e.g., BTCI: app 349.49 vs IBKR 349.50) — likely entry-price avg fill (0.49 vs user-entered 0.50)
- **D2.** Spread leg-matching → see I1

### קבוצה ה — Best trades + Ticker page ⏳
- **E1.** Best trades — auto-pick next Friday expiry (currently only suggests, doesn't auto-fill)
- **E2.** "הראה הכל" → ticker detail page (TickerDetailScreen exists from previous commit, needs wiring)

### קבוצה ו — CC reminder smart timing ⏳
- **F1.** Day-color (green / red) badge on each CC reminder
- **F2.** Premium boost notification when premium > +30% (`timingLabel` / `timingNote` exist; needs threshold + notification)

### קבוצה ז — AI + Spread UI ⏳
- **G1.** Focused AI analysis using ticker history + strategy context (partial — generic version exists)
- **G2.** Spread screen redesign (current expandable card → dedicated page)

---

## Pending — Master TODO (R-rounds, GPT-handoff style)

### R1 — Sync correctness ⏳
- Delete+Sync fix (separate imported vs manual data so partial delete doesn't wipe manual entries)
- Assigned TO/FROM me counting (verify after split fix in P2)
- Expired counting (CC `EXPIRED` close method handling)
- IBKR fee matching: 2 decimals, open + close commission split (currently single value)

### R2 — Tax + dividends ⏳ (deferred per Dima — see "Deferred" below)

### R3 — Sync completion ⏳
- IV sync completion (per קבוצה א)
- BTC limit order sync from IBKR open orders
- Auto-sync verification (FlexSyncWorker actually firing on schedule)

### R4 — Strategy AI improvements ⏳
- Min premium calc per strategy (extend beyond CC to CSP / spreads)
- Focused AI analysis (per קבוצה ז G1)
- Multi-provider support (Anthropic / Gemini / OpenAI rotation or fallback)

### R5 — UX / drill-down ⏳
- Spread redesign (per קבוצה ז G2)
- Drill-down per ticker (per קבוצה ה E2)
- "Best trades to repeat" list
- Watchlist (separate `WatchlistEntity` table) — partial spec exists, not implemented
- Background notifications + CC refresh `NotificationHelper` + `AlertWorker` periodic — partial

---

## Smaller items mentioned but not yet started

| # | Item | Notes |
|---|---|---|
| S1 | Delta in 2 lines (OpenPositionsScreen layout) | Should be on same row as IV / RoR / annual / % |
| S2 | LTR fixes in 6 screens | Right-arrow goes to next instead of prev (calendar) |
| S3 | PercentPill in monthly + annual targets | Component exists, not applied |
| S4 | "Novo b.co" → "NVO" ticker normalization | Affects portfolio events |
| S5 | Notification expandable | When app open / background |
| S6 | CC reminder shows in notifications | Currently only daily-change alerts |
| S7 | CSP collateral display: should show stock value, not strike-as-loss | UI logic mismatch |
| S8 | Dashboard 3 cards same row: הון זמין / פרמיות היום / % על הון + יעד שנתי גדול בלמטה | Layout request |
| S9 | Year target — current-pace projection ("אם תמשיך כך…") | Calc + UI |
| S10 | Monthly target double: must (living) + growth (portfolio expansion) | Bigger scope: changes annual target downstream |
| S11 | Historical scrollable graph (Polymarket-style) | Drag finger → values for that day |
| S12 | Reddit / Bloomberg news to social/news section | Filter for portfolio tickers only |
| S13 | Widgets (home screen) | Today's P&L + open positions count |
| S14 | Dividend payment date + ex-date with detailed recommendation | Finnhub doesn't return; need Yahoo/AV alternative |
| S15 | Top gainers/losers — fallback empty | Code claims fallback added, doesn't return data |
| S16 | B-S still updates premium of CSP draft | Should not — verify and disable |
| S17 | Auto-refresh on dashboard entry (3-5 min cooldown) | Verify exists / works |

---

## Deferred (🚫 Dima said "not now")

- **TradeStation PDF activity import** (was "10. TradeStation PDF import") — multiple failures, abandoned for now. Dima decided to enter historical trades manually from the 2 PDFs he uploaded.
- **1042-S value identification** (was "11. 1042-S זיהוי ערכים") — basic detection works (form opens, pulls some codes), full code-33/34/37 parsing deferred. Form 1042-S generation also deferred to R2.
- **TS Activity import OCR** — empty results, deferred.

---

## Future / not scheduled

### Maybe later
- Wear OS companion (premium expiry alerts on watch)
- Tablet-optimized layout
- Multi-account support (currently single IBKR account)
- AI_CHAIN with new keys
- Telegram private channels integration (for news/alerts)

### Explicitly out of scope
- iOS port
- Web companion
- Server-side anything
- Stock screener (stick to options + portfolio tracking)
- Real-time streaming quotes (polling only — IBKR free tier doesn't support streaming)
- Auto-trading / order placement (read-only by design)

---

## Workflow notes (per Dima's repeated reminders)

- **Discuss before sending Claude Code prompts.** Pack related work. Don't re-prompt completed items.
- **Group similar tasks** — Dima literally organized things into קבוצה א-ז. Preserve that pattern.
- **Mark verified vs claimed-done.** Many items got stamped "done" but weren't actually working.
- **Clean Build is a thing** — when changes touch Application / Manifest / DB, instruct Dima to do Clean Build, not just Run. Lesson learned in March/April.
- All financial numbers display with exactly 2 decimal places.
- Sign +/- goes LEFT of the number, not right.
- DB version migrations are sacred — never bump without a migration in the chain.

---

## Round labels

Dima uses these labels — preserve them:
- **P1, P2, P3, P4** = Phase rounds (completed)
- **Bug P1, Bug P2** = bug-fix rounds (completed)
- **Features P3** = partial features round (in progress)
- **R1-R5** = Master TODO rounds (pending)
- **קבוצה א-ז** = grouping for combined Claude Code prompts
