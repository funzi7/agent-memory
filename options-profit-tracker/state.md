# OptionsProfitTracker — State

> Living document. Update at the end of every working session.
> Last updated: 2026-05-05

## Current focus

ייצוב באגים אחרי סבב גדול של תיקונים (28 באפריל). יש פיצ'רים חצי-עשויים שצריכים אימות + פיצ'רים שלא נסתיימו. במקביל בנייה של תשתית אייג'נטים (תהליך מקביל ב-`agent-memory`).

## Active issues

| # | Issue | Status | Notes |
|---|---|---|---|
| I1 | Spread display leg-matching | 🔴 broken after multiple attempts | 3-pass SELL+BUY matching. Verify against real spread imports — Dima reported "had 2 rows, now 0". |
| I2 | Activity feed showing "אין אירועים" | 🟡 fix committed, unverified | DB inserts at 5 points — needs live test on `ActivityEventEntity`. |
| I3 | Annual target screen | 🟡 partial | Needs bars for previous months + year selector. |
| I4 | Black-Scholes premium auto-fill | 🟡 implemented, unconfirmed | Pending Dima's manual verification. |
| I5 | APK 16 KB page-size warning | ⏳ open | ML Kit `text-recognition:16.0.0` (`libmlkit_google_ocr_pipeline.so`) not aligned. Required for Play Store from Nov 1, 2025. |
| I6 | Cents-level P&L mismatch | 🔴 open | E.g., BTCI: app 349.49 vs IBKR 349.50. Likely entry-price avg fill (0.49 user-entered 0.50). |
| I7 | CSP collateral display logic | 🔴 open | Shows as +pos / loss-style. Should show stock value as collateral. |
| I8 | Dashboard layout requests | ⏳ open | 3 cards same row: הון זמין / פרמיות היום / % על הון. יעד שנתי גדול בלמטה. |

## Known patterns broken multiple times

These flag as "claimed done but not really" — need diagnostic-first prompts before any further fix attempt:
- **LTR fixes in 6 screens** — `CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr)` not applied to all money/date/English content per CLAUDE.md rule
- **PercentPill in monthly + annual targets** — component exists, never applied
- **Top gainers/losers fallback** — code claims it exists, returns empty
- **AlertWorker scheduling** — `ALERT_SCHEDULE` log empty even after multiple commits. (Code IS in `OptionsTrackerApp.onCreate()` direct path — if logs empty, Application class isn't instantiating; check Manifest.)

## Recently completed (last session, 2026-04-28)

See `roadmap.md` → "Large session 2026-04-28" for full list. Highlights:
- **P&L now matches IBKR exactly** ($4,532.72) — root cause: OWL assignment in `notes` XML attribute, not `code`
- CC reminder share doubling fixed
- IV cache sanity bounds (10%/300%) + auto-cleanup
- Portfolio value uses last element of `EquitySummaryByReportDateInBase`
- Exchange rates moved to `open.er-api.com`
- DB v14 → v16 (current as of session) — **note: actual DB is now v30** with 14 additional migrations since (likely background-agent commits between sessions). Verify `OptionsDatabase.kt` `version =`.

## Round status

| Round | Status | Summary |
|---|---|---|
| P1 | ✅ Done | Spread as single position with 2 legs (in same row, `spread_leg_*` cols) |
| P2 | ✅ Done | Persistent IBKR sync (FlexSyncWorker, DataStore, auto-sync 15/30/60/120 min) |
| P3 | ✅ Done | Long Put/Call close screen, CC reminder, portfolio auto-applied |
| P4 | ✅ Done | Strategy colors, badges, IC/Straddle/Strangle previews, totalPremium fix |
| Chain OCR | ✅ Done | OCR + StrategicRiskAnalyzer (Hebrew, 0–100 score) |
| Bug P1 | ✅ Done | XML dedup 6-fields, exact "C" close, partial close, availableFunds, NET position |
| Bug P2 | ✅ Done | OCR mobile format, PUT/CALL toggle, CC IV risk, Assigned TO/FROM split |
| Features P3 | 🟡 Partial | CC three-way display ✅, CC min premium ✅. Tax forms ⏳ (R2). BTC limit sync ⏳ (R3). |

## Top priority — close active issues

Per Dima's preference: stabilize active issues (I1–I8) before moving to R1.

Open question: do active issues first, or jump to R1 (Sync correctness)?

## Master TODO order (pending — see roadmap.md for full)

| Round | Scope |
|---|---|
| R1 | Delete+Sync separation, assignment counting, expired counting, fee matching 2-decimal |
| R2 | 1042-S parse, HTML dividends import, full sync |
| R3 | IV/BTC sync completion, auto-sync verification |
| R4 | Min premium per strategy, focused AI, multi-provider |
| R5 | Spread redesign, drill-down, "best trades", **Watchlist (note: `WatchlistEntity` already exists in DB)**, background notifications |

## Already-built infrastructure (worth knowing before re-prompting)

- **Watchlist** — `WatchlistEntity` exists, `WatchlistDao` exists, migrations 27/28/29 added `target_strike`, `target_entry_price`, `target_price`. Most of the table/storage layer is done. UI may or may not be wired.
- **Workers (all exist):** `AlertWorker`, `AutoAssignCC`, `DraftUpdateWorker`, `FlexSyncWorker`, `MonthlyReminderWorker`, `NotificationHelper`. Don't write new ones — extend.
- **API keys (10 providers in DataStore):** Alpha Vantage, Tradier, RapidAPI, MarketData, Perplexity, OpenAI, Anthropic, Gemini, Finnhub, Massive. Multi-provider AI is partially scaffolded.
- **Tax import per-year:** `tax_import_1042_<year>` and `tax_import_dividends_<year>` are functional pref keys.
- **Manual P&L adjustment:** `manual_pnl_adjustment` pref exists for one-off corrections.

## Open questions / next decisions

- Confirm I1 against real Flex import
- Live-verify activity feed events fire at 5 points
- ML Kit 16 KB compat — bump library version or workaround?
- Decide order: stabilize I1–I8 first, or jump to R1?
- Active PRs — אין מידע עדכני. צריך לאתר ולעדכן.

## Repo

- **GitHub:** funzi7/OptionsProfitTracker
- **Default branch:** `main`
- **Branch naming:** `claude/batch{N}-{description}` or `claude/{round-label}-{description}`
- **Source on disk (past sessions):** `/home/claude/OptionsProfitTracker/`
- **Latest packaged zip:** `/mnt/user-data/outputs/OptionsProfitTracker.zip` (from past session — not in current sandbox; download from GitHub if needed)
