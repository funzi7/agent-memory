# OptionsProfitTracker — Roadmap

> History of completed work + forward plan. Update at end of each round.
> עדכון אחרון: 2026-05-30 (post commit `46f717f` — Group BP prime: accept MarketData HTTP 203 (delayed feed) so liquid tickers get IV; splitApiKeys no-space; fast build-check rule (`:app:compileDebugKotlin` + `grep "^e: "`))

## Group BP prime ✅ (`942af85`+`46f717f`, 2026-05-30)
- MarketData HTTP **203** (Non-Authoritative = 24h-delayed feed) now accepted in `fetchIvFromMarketdata` — was rejected as `!= 200`, so liquid tickers (NVDA/SOFI/SOXL) showed "—" despite spent credits. **DONE.**
- `splitApiKeys` no longer splits on space (a stray space forged a phantom key) — splits on `\n , ;` only. **DONE.**
- Build-check rule made FAST + strict in CLAUDE.md (`942af85`) + AGENTS.md (`46f717f`): `:app:compileDebugKotlin` + `grep "^e: "` (full `clean assembleDebug` only for APKs). **DONE.**
- **Queue (in order):** (1) multi-key MONTHLY COOLDOWN — on a quota/credit error (402/429) skip that key until the 1st of next month, try the next; persist by a HASH of the key (never the key), auto-resets at month start. (2) 21-day historical-vol fallback (cached avgDailyMove ×√252 for tickers with no option IV). (3) NYSE-holidays helper (badge "סגור" + calendar gray-out). (4) expected-profit $1400→-$0.81 bug. (5) SOXL long-put mislabel; ASTS-shows-RKLB-news.

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
- **DB version:** 30 (planned: 31 with new `initial_implied_volatility` column in FIX 1/D)
- **Active branch:** `main`

---

## Completed rounds

### P1 — Spread as single position ✅
- `SpreadPosition` model, expandable dashboard card, Flex import auto-detect, dual-leg AddPosition UI

### P2 — Persistent IBKR sync ✅
- `FlexSyncWorker`, `AppPreferences` DataStore, auto-sync 15/30/60/120, manual sync, `OpenPosition` mark price, `aggregateTrades()` for IBKR fill splits

### P3 — Close screens + CC reminder + Portfolio ✅
- Long Put/Call close screen + STC + full P&L, CC reminder banner, portfolio auto-applied on sync

### P4 — Strategy UX + advanced strategies ✅
- Strategy colors, IC/Straddle/Strangle full preview, totalPremium fix

### Chain OCR ✅
- `OptionChainParser` (paste + ML Kit camera), `StrategicRiskAnalyzer` (Hebrew, 0–100 score)

### Bug round P1 ✅
- XML dedup 6-fields, exact `"C"` close, partial close, `availableFunds`, NET position logic

### Bug round P2 ✅
- OCR mobile format, PUT/CALL toggle, CC IV risk, Assigned TO/FROM split, full resync

### Features round P3 (partial)
- ✅ CC three-way display (premium / unrealized / total)
- ✅ CC minimum premium calc per strike

### Large session 2026-04-28 ✅
- P&L exact match IBKR ($4,532.72) — OWL in `notes`
- CC reminder share doubling fixed
- IV cache sanity bounds (10%/300%) + auto-cleanup
- Portfolio value uses last element of `EquitySummaryByReportDateInBase`
- Exchange rates moved to `open.er-api.com`
- Dashboard restructure with activity feed
- DB v14 → v30 (29-30 added `initial_premium` column with backfill)

### Commit `8a44bd4` items confirmed working ✅
- Backup/Restore v4 (schema v4)
- Expected-profit calculator + calendar (state-aware)
- Global left arrows (Unicode)
- Edit-position UX (tags removed, keyboard, premium rec)
- DRAFT no longer creates feed rows
- Portfolio sort persistence (ViewModel + DataStore)
- Top movers expand/collapse inline
- B-S "full" + DRAFT premium frozen for CSP only
- Save-as-draft works
- Massive.com wired (but cache empty — pending Group D)
- Monthly realized: manual + IBKR combined
- Edit closed position (pre-fill + warning)
- CC Reminder no longer says "CSP"
- CC Assignment Probability via B-S delta
- IV per-contract trigger runs (cache empty — pending Group D)
- Posts LTR for English, POST_IMAGE callbacks run, put starts at 0%
- Theme: 29 hardcoded color replacements across 7 files
- Best trades (individual)
- Min Premium Calculator: 12% annual target
- AI Analysis enriched with ticker history
- Sync prices match by expiry date

---

## Active groups — Groups A through F prime ✅ DONE

All six groups merged into `main`. Detailed status per group in `state.md`.

### Group A → FIX 4 ✅ (commit `9ddca1c`)
A1 strategy sort, A2/A3 source column click+shorten, A4/A5 image cache + Telegram URL normalize — all verified. A6 abnormal alerts partial (only 1 ticker shown when multiple should appear) — now tracked as N-item.

### Group B → FIX 3 ✅ (commit `f1c3e9a`)
B1 "בתהליך" duplicate removed, B2 yearly 24% duplicate removed, B4 "נותר" overlay, B5 monthly target unified to $5066. B3 minus-on-right skipped (was already correct).

### Group C → FIX 2 ✅ (commit `16fd852`)
C2 INTC aggregation (2026-only correct), C3 settings target reload, C4 post paragraph breaks — all verified. C1 CSP cash superseded by E prime / F-area work.

### Group D prime ✅ (commit `fdc1cf1`)
D1 social regression fixed, D3 reports all-years toggle verified, D4 per-bar remaining done. D2 CSP text superseded by E prime.

### Group E prime ✅ (commit `7df9465`)
E1 CSP card root cause: premium is per-share not per-contract. ASTS net = (150 − 9.31) × 100 × 1 = 14069, not 14991. Card restructured RTL with 3 rows (exit cash / available now / after assignment). E2 monthly bar realized/target/remaining + RTL total row. E3 phantom IREN labeled via AlertSource enum + badges (root cause not fixed — superseded by F4). E4 feed dedup: edit-then-close updates same row instead of stacking.

### Group F prime ✅ (commit `589b44e`)
F1 assignment probability: DELTA_DEBUG log added, BlackScholesCalculator made unit-tolerant (IV accepted as percent or decimal via <5.0 heuristic), EWY ~95% awaiting device verify. F2 IV autofill removed: stripped all 8 `lookupIvForExpiry` call sites + init `cachedIv` overwrite — IV is now manual-only and survives field changes. F3 feed color: POSITION_EDITED moved to blue (`PremiumReceivedColor`) branch. F4 phantom prune: `isFullSync` param added so prune only runs on `fullResync()`, removes snapshot tickers absent from Flex with no open position and no manual override.

---

## Current backlog — N-items (from device test 2026-05-13)

Full table lives in `state.md` under "New active issues from device test 2026-05-13 (N-items)". Summary:

- **N4** off-market-hours stock prices stale → cascades to CC reminder, abnormal alerts, per-ticker numbers/percent
- **N5** monthly target dashboard: total progress percent disappeared
- **N6** assignment probability inverted (EWY deep ITM showed 28%) — fixed in F prime, awaiting device verify
- **N7** RTL alignment on "betachonot"/"maniot" in open-position card
- **N8** phantom tickers MULL/MU persist — fixed in F prime, awaiting device verify
- **N9** "bitachon nidrash" appears on CALL positions (should be PUT only)
- **N10** IV 99% wrong / reverts on field change — fixed in F prime (autofill removed), awaiting device verify
- **N11** edit-open-position shows spurious "sale opportunity" texts
- **N12** feed: updated position shows green instead of blue — fixed in F prime, awaiting device verify
- **N13** social dashboard shows old posts, not newest across channels
- **N14** system notifications "X fired/created" / main activity — remove entirely
- **N15** alerts: surface highest IVs across current portfolio tickers + dates (feature)

Next prompt should bundle the still-open items (N4, N5, N7, N9, N11, N13, N14) per 4-fix limit. F-prime device-verify items (N6, N8, N10, N12) get confirmed on next device session before being closed.

---

## Other open (not in A-F prime series)
E1 Spread leg-matching, E2 Annual target screen bars, E3 B-S auto-fill device verify, E4 ML Kit 16 KB, E5 cents-level P&L, E6 Dashboard 3-card layout

---

## Pending — Master TODO (R-rounds)

### R1 — Sync correctness ⏳
- Delete+Sync separation (imported vs manual)
- Assigned TO/FROM counting verify
- Expired counting (CC `EXPIRED` close method handling)
- IBKR fee matching: 2 decimals, open + close commission split

### R2 — Tax + dividends 🚫 (deferred per Dima)
- 1042-S parse, HTML dividends, full sync, Israeli Form 1325 — postponed

### R3 — Sync completion ⏳
- IV sync completion (after Group D)
- BTC limit order sync from IBKR open orders
- Auto-sync verification (FlexSyncWorker actually firing)

### R4 — Strategy AI improvements ⏳
- Min premium per strategy (extend beyond CC)
- Focused AI analysis (ticker history + strategy context)
- Multi-provider (Anthropic / Gemini / OpenAI rotation)

### R5 — UX / drill-down ⏳
- Spread redesign (dedicated page)
- Drill-down per ticker
- "Best trades to repeat" list
- Watchlist UI (table layer mostly done — `WatchlistEntity` + DAO + 3 migrations)
- Background notifications + AlertWorker schedule

---

## Future / Features (F-items, post-stabilization)

| # | Item | Notes |
|---|---|---|
| F1 | AI per-post analysis | Only for posts with portfolio tickers (save API calls) |
| F2 | Watchlist alerts → AddPosition | Click alert opens new position with ticker/strategy pre-filled |
| F3 | News inside open-position screen | Per-ticker only, no sector filter |
| F4 | Pre-market mode in dashboard | Header indicator + price refresh from 15:00 Bangkok |
| F5 | CC reminder pre-market refresh | Data refresh starts 15:00 Bangkok |
| F6 | Twitter/Nitter integration | Free instances only — no paid API. Multiple fallbacks. |
| F7 | Reddit + Bloomberg + private Telegram | Bot token for private channels |
| F8 | Filtered subreddits per watchlist | Topic filtering |
| F9 | Home-screen widgets | Today's P&L + open positions count |
| F10 | AI chat for position analysis | Use existing Anthropic + Gemini keys |
| F11 | Paper trading simulator | New screen + entity |
| F12 | Dividend scrape fallback | digrin.com / dividend.com after stockanalysis.com regex broke |
| F13 | Twitter popular tweets | Filter to portfolio tickers |
| F14 | Tax forms + calculations | 1042-S + Israeli Form 1325 (post-R2) |

---

## NEW backlog items (open, as of 2026-05-29)

Tracked alongside `state.md` "NEW backlog". Recently shipped: NEW5 (news AI summary RTL + per-URL cache) ✅ Group BB; NEW32 (watchlist row → Add-Position prefilled) ✅ Group BB; NEW33 phase 1/1.5 (watchScan + buy recommendation) ✅ Groups BC/BD; NEW10 (high-IV list) ✅ Group BF, expanded to dashboard top-5 section + full all-tickers/sync/tap screen ✅ Group BH; **IV-key settings (added Tradier field + corrected try-order text) + IV-sync performance (sequential→concurrent, ~10–20s) ✅ Group BL (`968ca89`)**; weekend session badge ✅ Group BL.

**Public mirror — ❌ CANCELLED (2026-05-30):** user declined exposing the code; do not add any mirror workflow.

**IV multi-key failover + Tradier field + API-key-prefix log cleanup ✅ Group BM (`34b5ba3`)** — also cut socket timeouts 10s→4s and wired snapshot prices into the historical-vol fallback.

**Next-up queue (open):** NYSE-holidays helper (badge "סגור" + calendar gray-out non-trading days); expected-profit $1400→−$0.81 bug (NEXT); SOXL long-put mislabel; ASTS shows RKLB news; annual-target % inside both bars; dividend/events API-key section.

| # | Item | Notes |
|---|---|---|
| DI | Refactor ~10+ ad-hoc Room builders → single Hilt singleton | ⏳ Data-integrity hardening. Each call site re-lists MIGRATION_21_22…29_30 and previously `.fallbackToDestructiveMigrationOnDowngrade()` (the data-loss bug, removed in Group BA across 16 sites/11 files by hand). One injected `OptionsDatabase` would kill the copy-paste drift and this whole bug class. |
| NEW3 | PLUG / IV-stale Black-Scholes | ⏳ PLUG (price 4.07, call strike 2.50 = ITM) shows a wrong "מחיר/עסקה מופלאה" — likely a stale-IV BS calc; use the IV_TRACE log (M2) to catch the bad IV value. |
| NEW6 | News article content has junk | ⏳ Extraction cleanup — the `<p>`/`<div>` scrape in `PortfolioNewsScreen` pulls nav/boilerplate/ads. Needs better readability extraction. |
| NEW7 | Per-article sentiment + stock move since news | ⏳ Show bullish/bearish tag and the ticker's price change since the article timestamp. |
| NEW9 | Merge news + events into the social feed | ⏳ Unify the news feed and portfolio events into the single social/activity feed. |
| NEW10 | List highest IVs by portfolio tickers | ✅ Group BF → expanded in Group BH: dashboard "🔥 IV גבוה — הזדמנויות" top-5 section (tap→Add-Position prefill, "ראה הכל ←") + full `HighIvScreen` listing ALL tracked tickers (open∪draft∪watchlist, no-IV last as "—") with a "סנכרן IV" refetch button and tap-to-open. |
| NEW23 | Pre-open ticker intelligence | ⏳ BIG feature — pre-market briefing per held ticker (overnight move, news, events, gap risk) before US open. |
| CLEANUP | Remove `ABNORMAL_DIAG` diagnostic log | ⏳ Added in Group BE to diagnose RKLX; BF2 (10% floor) is the fix. Remove the per-ticker `ABNORMAL_DIAG` log once Dima confirms on device that RKLX/MRAM now alert. |

---

## Smaller items (S-items)

| # | Item | Notes |
|---|---|---|
| S1 | Delta in 2 lines (OpenPositionsScreen) | Same row as IV/RoR/annual/% |
| S2 | LTR fixes in 6 screens | Calendar arrow direction, see B3 |
| S3 | PercentPill in monthly + annual targets | Component exists, not applied |
| S4 | "Novo b.co" → "NVO" ticker normalization | |
| S5 | Notification expandable | When app open / background |
| S6 | CC reminder shows in notifications | Currently only daily-change alerts |
| S7 | CSP collateral display | Shows stock value, not strike-as-loss |
| S8 | Dashboard 3 cards same row | E6 |
| S9 | Year target — current-pace projection | "אם תמשיך כך…" |
| S10 | Monthly target double: must (living) + growth | Bigger scope — affects annual downstream |
| S11 | Historical scrollable graph (Polymarket-style) | Drag finger → values for that day |
| S12 | Reddit / Bloomberg news to social section | Filter for portfolio tickers |
| S13 | Widgets (home screen) | F9 |
| S14 | Dividend payment date + ex-date | Finnhub omits — need Yahoo/AV alt (F12) |
| S15 | Top gainers/losers fallback empty | Code claims fallback added, doesn't return data |
| S16 | B-S still updates premium of CSP draft | Should not — verify and disable |
| S17 | Auto-refresh on dashboard entry (3-5 min cooldown) | Verify exists / works |
| S18 | LTR not consistent for English text | Heuristic to investigate |
| S19 | Posts truncated mid-content | Fetcher truncation |
| S20 | "Toast already killed" log error | Investigate context |
| S21 | Long posts: paragraphs/spaces | Done but unverified |
| S22 | Watchlist filtered subreddits | F8 detail |
| S23 | $ sign on right + minus on right (in P&L "הצג הכל") | RTL fix beyond B3 |

---

## Deferred 🚫

- **TradeStation PDF activity import** — multiple failures, abandoned. Dima entering historical trades manually from 2 PDFs.
- **1042-S full code-33/34/37 parsing** — basic detection works (form opens, pulls some codes), full parsing deferred.
- **Form 1042-S generation** — deferred to post-R2.
- **TS Activity import OCR** — empty results, deferred.

---

## Explicitly out of scope

- iOS port
- Web companion
- Server-side anything
- Stock screener (stick to options + portfolio)
- Real-time streaming quotes (polling only)
- Auto-trading / order placement (read-only by design)

---

## Workflow

- Max 4 fixes per Claude Code prompt
- Discuss before sending
- Pack related work into one prompt
- Mark verified vs claimed-done
- Clean Build after Application/Manifest/DB changes
- All financial numbers: 2 decimal places exactly
- Sign +/- LEFT of number, not right
- DB version migrations are sacred — never bump without migration
- Each fix has a logcat verification tag

## Round labels (Dima's convention)

- **P1, P2, P3, P4** = Phase rounds (✅ done)
- **Bug P1, Bug P2** = bug-fix rounds (✅ done)
- **Features P3** = partial features (🟡)
- **R1-R5** = Master TODO rounds (⏳)
- **Group A-D** = current 4-FIX series (active)
- **F1-F14** = post-stabilization features (⏳)
- **S1-S23** = small UX items
- **E1-E6** = other open issues outside 4-FIX

## Group BQ prime — 2026-05-31 (OPT 44f653a)
- NYSE non-trading-days helper DONE (session badge "סגור" + calendar gray-out).
- Queue (in order): (1) expected-profit assigned-CC realizedPnL — BLOCKED on user accounting decision; (2) SOXL long-put mislabel — need BUY vs SELL of the SOXL pos; (3) ASTS-shows-RKLB-news — locate news source; (4) multi-key monthly cooldown; (5) 21-day HV fallback (thin safety net).

## Group BR prime — 2026-05-31 (OPT 106fa90)
- Expected-profit assignment/$0 vs expiry/premium + calendar non-trading-day background DONE.
- Queue (in order): (1) STOCK realized-P&L display — capture IBKR fifoPnlRealized of STK trades per ticker + a UI section (the real wheel gain, e.g. RKLB ~$1504, lives there); (2) multi-key monthly cooldown; (3) SOXL CSP->LONG_PUT import mis-parse (needs user Flex rows); (4) ASTS-shows-RKLB-news.

### Group BS prime — done + next (2026-05-31)
- DONE: stock realized-P&L display (per-ticker + monthly + combined-total toggle, separate from options) + calendar today-digit dims on non-trading days.
- NEXT: multi-key monthly cooldown (IV credit guard per key/month); SOXL CSP→LONG_PUT import mis-parse (needs the user's actual Flex rows to diagnose); ASTS-shows-RKLB-news (wrong-ticker news mapping).

### Group BT prime — done + next (2026-05-31)
- DONE: stock-P&L detail moved to its own StockRealizedScreen (compact dashboard card + "ראה הכל"); combined total now follows the SELECTED month (options+stock per period; "כל הזמן" = lifetime).
- OPEN QUESTION (next, pending USER decision): optionally show UNREALIZED/projected stock P&L for OPEN CC holdings (e.g. PLUG's projected assignment loss) in a separate labeled view — do NOT mix into the realized section.
- QUEUE: multi-key monthly cooldown (IV credit guard per key/month); SOXL CSP→LONG_PUT import mis-parse (needs user's actual Flex rows); ASTS-shows-RKLB-news (wrong-ticker news mapping).

### Group BU prime — done + next (2026-05-31)
- DONE: PLUG-style PROJECTED (unrealized) stock P&L for open ITM covered calls = (strike − avgCost) × shares; compact-card "צפוי (CC פתוח)" line + separate section in StockRealizedScreen; display-only (expected/realizedPnL untouched). Closes the BT open question.
- QUEUE: multi-key monthly cooldown (IV credit guard per key/month); SOXL CSP→LONG_PUT import mis-parse (needs user's actual Flex rows); ASTS-shows-RKLB-news (wrong-ticker news mapping).

### Group BV prime — done + next (2026-06-01)
- DONE: PLUG-projected-fix — projectedStockPnl now resolves CC avgCost via AvgCostResolver.resolveFromSnapshot + shares/current from stockSnapshot, so IMPORTED ITM CCs (PLUG ~-$3000) show projected assignment P&L, not just manually-entered ones. Display-only.
- QUEUE: multi-key monthly cooldown (IV credit guard per key/month); SOXL CSP->LONG_PUT import mis-parse (needs user's actual Flex rows); ASTS-shows-RKLB-news (wrong-ticker news mapping).

### Group BW prime — done + next (2026-06-01)
- DONE: stock-screen polish — reusable LtrText (LTR dates/numbers), month selector always includes the current month, header totals no longer wrap; LTR rule codified in CLAUDE.md/AGENTS.md.
- NEXT (user requested): multi-key monthly cooldown (IV credit guard per key/month).
- QUEUE: SOXL CSP->LONG_PUT import mis-parse (needs user's actual Flex rows); ASTS-shows-RKLB-news (wrong-ticker news mapping).

### Group BX prime — done + next (2026-06-01)
- DONE: stock-screen month-format (chips show MM-YYYY via fmtMonth, LtrText keeps LTR) + header-wrap (title wraps, number one line — fixed BW3 title-truncation).
- NEXT (user requested): multi-key monthly cooldown (IV credit guard per key/month).
- QUEUE: SOXL CSP->LONG_PUT import mis-parse (needs user's actual Flex rows); ASTS-shows-RKLB-news (wrong-ticker news mapping).

### Group BY prime — done + next (2026-06-01)
- DONE: combined-section month MM-YYYY; multi-key MONTHLY quota cooldown (NaN quota signal → skip key whose hash is in cooldown for the current YearMonth, auto-reset on the 1st; wired from all 3 fetchIv sites; key hashed, never stored/logged).
- QUEUE: SOXL CSP->LONG_PUT import mis-parse (needs user's actual Flex rows); ASTS-shows-RKLB-news (wrong-ticker news mapping); optional DAILY-granularity cooldown for AlphaVantage (currently treated as monthly).

### Group BZ prime — done + next (2026-06-01)
- DONE: IV key-status display ("סטטוס מפתחות IV" card, ACTIVE/COOLDOWN/NONE per key, #N aligned to failover keyIndex); Finnhub own Settings section; shared IvService.keyHash (DashboardViewModel.hashKey delegates).
- QUEUE: ASTS-shows-RKLB-news (locate news source / wrong-ticker mapping); SOXL long-put mislabel (need SOXL Flex rows); optional DAILY-granularity cooldown for AlphaVantage (currently treated as monthly).

## Group CA prime ✅ (38f09aa)
- IV status: refresh feedback + last-sync time — **DONE.**

- [done] sync-icon rotation on IV refresh + live last-sync in Settings (Group CB prime)

- [done] ASTS-shows-RKLB-news (news->ticker mis-tag, Group CC prime). Queue still: SOXL long-put mislabel (BLOCKED — need SOXL Flex rows), optional daily cooldown for AlphaVantage.

- [done] monthly target bars RTL (remaining + 0/target order, Group CD prime).

- [queued] AddPositionScreen AI-summary sentiment vs 'השפעה על התיק' card can look contradictory (article negative-for-stock but card shows חיובי because SELL positions benefit) — reconcile or add a one-line explanation of why they differ.
- [queued] make the 'השפעה על התיק' card render RTL.

- [done] pull-to-refresh on 4 network screens (News/Events/Watchlist/Social, Group CF prime). Remaining: pull-to-refresh on DB-backed screens (would trigger a full sync) — pending Dima's decision; and the CG news work (lazy company-name + persist News/Events cache to disk to fix empty-page-on-entry).

- [queued] dashboard '📱 רשתות חברתיות' section -> navigate to SocialSourcesScreen (route social_sources).
- [queued] SocialSourcesScreen: merge posts from all channels into ONE chronological feed sorted by TelegramPost.publishedAtEpochSec desc (currently per-channel), keep a per-post channel label, keep add/delete-channel management.
- [queued][FUTURE] add Twitter and private-Telegram-channel support to the social sources.

- [done] dashboard->SocialSources tap-through (Group CH prime).
- [done] SocialSources chronological merged feed (Group CH prime).
- [FUTURE] Twitter + private-Telegram-channel support for social sources.
- [pending Dima] pull-to-refresh on DB-backed screens (would trigger a full sync).

- [verify] Group CH SocialSources merge code is confirmed present + compiling; the per-channel/empty symptom Dima saw was a STALE APK (Claude Code only compiles+pushes, not install) — re-verify after a fresh build+install.

- [CK] move 'ניהול ערוצים' management to a separate page so the SocialSources feed starts at the top.
- [CL] TrendSpider picks the channel AVATAR background-image instead of the post photo (image extraction grabs the first background-image:url) + diagnose mostly-empty channels (t.me/s fetch — regex fragility/throttling, check Logcat per channel).
- [FUTURE] Twitter + private-Telegram-channel support for social sources.

- [CL] TrendSpider picks the channel avatar background-image instead of the post photo + diagnose mostly-empty channels (t.me/s fetch, check Logcat per channel).
- [FUTURE] Twitter + private-Telegram-channel support for social sources.

- [Social] shared post component to sync dashboard+full feeds (bring CJ direction/tap-expand/tags to the dashboard + consistent channel-name cleanup + ticker tap).
- [Social] ticker -> TickerDetailScreen aggregation (news+events+social + open-position prefilled with ticker only).
- [Social] TrendSpider avatar-vs-post-photo image bug.
- [Social][FUTURE] Twitter + private-Telegram-channel support.
- [Social][NOTE] if many channels show ✗ in CL health, suspect t.me/s throttling from parallel fetches — investigate next.

- [Social] shared post RENDER component to sync dashboard+full (CJ direction/tap-expand/tags to dashboard + consistent channel-name cleanup [bizportal/'בלומברג בעברית/Bloomberg' suffix not stripped in full feed] + ticker tap).
- [Social] ticker -> TickerDetailScreen aggregation (news+events+social + open-position prefilled ticker only).
- [Social][FUTURE] Twitter + private-Telegram-channel support.
- [Social][NOTE] empty-channels appears resolved — was a stale APK; CL health shows all channels active.

- [Social] ticker -> TickerDetailScreen aggregation (news+events+social + open-position prefilled, ticker only) + ticker-tap from posts (both feeds).
- [Social] shared post RENDER component (optional cleanup — logic helpers socialTextDirection/formatSocialTime/normalizeChannelName now shared).
- [Social][FUTURE] Twitter + private-Telegram-channel support. (Empty-channels confirmed resolved.)

- [Social] ticker tap -> TickerDetailScreen aggregation (news+events+social + open-position prefilled, ticker only).
- [Social] web-fetch the bizportal-style article link to read it in-app.
- [Social][FUTURE] Twitter + private-Telegram-channel support. If a channel name still shows junk, check Logcat tag CHANNEL_NORM for the raw->normalized string.

- [Social] Bloomberg channel name still showed a suffix but its raw handle was not in the CHANNEL_NORM log; get the raw->normalized line and fix the exact case.
- [Social] ticker tap -> TickerDetailScreen aggregation (news+events+social + open-position prefilled, ticker only).
- [Social] web-fetch article links (bizportal-style) in-app.
- [Social][FUTURE] Twitter + private-Telegram-channel support.

- [Social] ticker tap -> TickerDetailScreen aggregation (news+events+social + open-position prefilled, ticker only).
- [Social] web-fetch article links in-app.
- [Social][FUTURE] Twitter + private-Telegram-channel support.

- [Social] (optional) per-channel custom display name (needs a DB column + migration, pending Dima OK).
- [Social] ticker tap -> TickerDetailScreen aggregation (news+events+social + open-position prefilled, ticker only).
- [Social] web-fetch article links in-app.
- [Social][FUTURE] Twitter + private-Telegram-channel support.

- [Social] NEXT: extend TickerDetailScreen (currently shows positions only) to also show the ticker news + events + social + an open-position button (prefill ticker only).
- [Social] web-fetch article links in-app.
- [Social][FUTURE] Twitter + private-Telegram-channel support.

- [Social] if a post still renders RTL, read Logcat SOCIAL_DIR (he/la/text) and fix from the actual counts; then remove the temp log.
- [Social] NEXT feature: extend TickerDetailScreen (positions-only today) with the ticker news + events + social + an open-position button (prefill ticker only).
- [Social] web-fetch article links in-app.
- [Social][FUTURE] Twitter + private-Telegram-channel support.

- [Social] TickerDetail part 2/2 (CX) — events section (Finnhub calendar/earnings + dividend source, parse from PortfolioEventsScreen) + social section (posts from socialSourceDao via fetchTelegramPostsWithImages, filtered to posts mentioning the ticker).
- [Social] web-fetch article links in-app.
- [Social][FUTURE] Twitter + private-Telegram-channel support.

- [Social] TickerDetail remaining — social section (posts from socialSourceDao via fetchTelegramPostsWithImages filtered to the ticker).
- [Social] web-fetch article links in-app.
- [Social][FUTURE] Twitter + private-Telegram-channel support.

- [Social] Use AutoDirText for any future dynamic text (posts/news/labels).
- [Social] TickerDetail remaining — social section (posts mentioning the ticker).
- [Open Q for Dima] show news/events context ALSO on the AddPosition screen to help decide; dashboard social shows fewer posts due to the portfolio filter (show all vs portfolio-only?).
- [Social] If NVDA still shows no events, read EVENTS_FETCH log; remove the log once confirmed.
- [Social][FUTURE] Twitter + private-Telegram-channel support.

- [NEXT BIG] AddPosition intelligence panel reusing SHARED pieces (TickerDetail news/events/social + ArticleReaderSheet + AutoDirText): show price, news, events, social for the entered ticker to help decide whether/when/at what price/which strategy.
- [Social] Remove EVENTS_FETCH log once events confirmed. Consider AutoDirText inside ArticleReaderSheet for Hebrew articles later.
- [Social] TickerDetail remaining — social section (posts mentioning the ticker).
- [Social][FUTURE] Twitter + private-Telegram-channel support.

- [TODO] IBKR<->Claude connector launched (June 2026); evaluate upgrading OPT IBKR integration from Flex XML batch to the live IBKR Web/Client-Portal API (real-time positions/orders) the connector uses — separate project.
- [TickerDetail] dedicated "ראה הכל" pages for news/events; trade-history pagination (10 -> 20 -> dedicated page).
- [Events] migrate PortfolioEventsScreen to the shared EventDisplayCard.
- [Dashboard] social post count (filter has no effect — investigate).
- [NEXT] AddPosition intelligence panel reusing all shared pieces.

- Remove NEWS_REL log once confirmed.
- Next: extract a shared NewsDisplay.kt (news card + relevance) used by TickerDetail + PortfolioNewsScreen.
- "ראה הכל" dedicated pages for news/events; trade-history dedicated page for >20.
- Migrate PortfolioEventsScreen to EventDisplayCard.
- Dashboard social post count (filter has no effect — investigate).
- AddPosition intelligence panel; IBKR<->Claude connector / live IBKR Web API eval.
