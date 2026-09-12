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

- Remove NEWS_REL/EVENTS_FETCH temp logs once confirmed.
- Pending Dima clarifications: open-position countdown label (expiry vs opening) and price-movement ALERTS scope.
- Next: time-to-expiry on dashboard open positions; alerts feature; extract shared NewsDisplay.kt; "ראה הכל" dedicated pages; migrate PortfolioEventsScreen to EventDisplayCard; AddPosition intelligence panel; IBKR<->Claude connector / live IBKR Web API eval.

- ALERTS feature pending build (scope being confirmed with Dima): push notifications for actionable events (tap -> relevant screen) + a dismissible colored dashboard banner (✕ closes it, content below reflows) reserved for special events; proposed triggers: position expired, near-expiry (<=N days), upcoming earnings for a holding, large price move, target-price crossed. Also pending: shared NewsDisplay.kt, "ראה הכל" dedicated pages, migrate PortfolioEventsScreen to EventDisplayCard, AddPosition intelligence panel, IBKR live Web API eval.

- ALERTS EB (next): wire near-expiry into AlertWorker via EXPIRY_ALERT_ENABLED/EXPIRY_ALERT_DAYS_BEFORE for OPEN positions; add position-expired/assigned alerts; add upcoming-earnings (Finnhub) for holdings; each feeds notification + banner; mark which triggers are banner-worthy vs notification-only.
- ALERTS EC: make AlertsScreen rows tap -> ticker page; target-price crossed; per-trigger settings toggles.

- ALERTS EC (next): position expired/assigned alerts; upcoming-earnings (Finnhub) for holdings; differentiate banner-worthy vs notification-only triggers; AlertsScreen rows tap -> ticker; target-price crossed. NOTE: AlertWorker only runs in extended market hours — revisit if near-expiry should also fire pre-open. EB2 follow-up: persist the article-body cache to disk if cold-restart instant re-open is wanted.

- ALERTS ED (next): position expired/assigned alerts; upcoming-earnings (Finnhub) for holdings; banner-worthy vs notification-only; AlertsScreen rows tap -> ticker; target-price crossed. Optional: persist ArticleBodyCache across restarts (EB2 is in-memory only); improve article body-fetch coverage for sites that fall back to the Finnhub summary.

- ALERTS EE (pending Dima design confirmation): (1) upcoming-earnings alert — AlertWorker fetches Finnhub earnings for HELD tickers, cached once/day for rate limits, alert within X days (X TBD, suggest 7). (2) position expired/assigned alert — dashboard already shows the auto-expired banner (DC2); decide whether to ALSO push a background notification when positions expire/are assigned while the app is closed (worker would need to detect it; currently foreground/dashboard-tied). Open: target-price crossed; AlertsScreen rows tap -> ticker.

- ALERTS remaining: sync-driven ASSIGNMENT alert (needs IBKR data in a worker); target-price crossed; AlertsScreen rows tap -> ticker. Optional: per-trigger settings toggles (earnings/expiry/move) under the 'התראות' section.

- ALERTS remaining (optional): sync-driven ASSIGNMENT alert (needs IBKR data in a worker); target-price-crossed alert (needs a target-price field); per-trigger settings toggles (earnings/expiry/move) under 'התראות'. Non-alerts backlog: dashboard social post-count vs portfolio-filter behavior; shared NewsDisplay.kt; 'ראה הכל' dedicated pages; migrate PortfolioEventsScreen to EventDisplayCard; AddPosition intelligence panel; IBKR live Web API eval.

## Group FA prime ✅ (2026-06-08)
AddPosition intelligence panel — FB next: compact SOCIAL block for the entered ticker (reuse dashboard social rendering; TickerDetail has no social section) + richer events (dividends via shared EventDisplayCard). FC: loading/layout polish.

## Group FB prime ✅ (2026-06-08)
AddPosition intelligence panel — FC next: compact SOCIAL block for the entered ticker (reuse the dashboard social rendering, filtered to posts mentioning the ticker; TickerDetail has no social section to extract from). Then FC polish: loading/layout.

## Group FC prime ✅ (2026-06-08)
AddPosition intelligence — FD next: field-level inline hints (warning next to the EXPIRY-DATE field when expiry falls after an earnings date — 'דוח לפני הפקיעה / IV crush'; strike-vs-price + IV hints near their fields). FE: social block inside the מודיעין card + layout polish; possibly fold PositionAnalysisCard into the card.

## Group FD prime ✅ (2026-06-08)
OPEN items surfaced this round:
(1) Alerts/banners must fire in PRE-market and AFTER-hours too, not only regular market hours — relax AlertWorker's market-hours gate (user saw BTCI +6% pre-market with no alert).
(2) Premium/strike RECOMMENDATION engine for the open: given DTE + the closing IV (e.g. 38.7%) + a pre-market-move-implied delta shift, suggest target-delta strikes (~15-25 delta normal, ~10 for leveraged tickers), estimate the premium for each candidate strike, and recommend the best strike + premium + tenor (weekly/daily if available). Big quant feature — design a Black-Scholes/delta estimator (or reuse IvService) first.
(3) AddPosition מודיעין card should NOT vanish-and-reappear on return — cache tickerNews/tickerEvents per ticker and update in place.
(4) Verify/fix the FC2 analyzer earnings feed (setAnalysisEarnings) so the analyzer's earnings flags + score reflect earnings, and surface a warning flag in the verdict preferentially over a positive one.

## Group FE prime ✅ (2026-06-08)
OPEN items:
(1) Big-move alerts currently scan the WATCHLIST only (held-position tickers are excluded) — if Dima wants moves on HOLDINGS (his BTCI +6% example) alerted, add a holdings move-scan pass.
(2) Premium/strike RECOMMENDATION engine for the open (DTE + closing IV + pre-market-implied delta shift -> target-delta strikes ~15-25 / ~10 leveraged -> est. premium per strike -> best strike/premium/tenor); design a delta/Black-Scholes estimator first.
(3) Optionally persist AddPositionIntelCache across restarts.

## Group FF prime ✅ (2026-06-08)
OPEN items:
(1) VERDICT correctness in AddPosition — qualityScore over-rewards annualized RoR + safety, so low-absolute-yield and deep-ITM (intrinsic-heavy) trades score 'מצוין/טוב' while the separate yield tier says 'חלש' (contradiction). Pending Dima's confirmation on thresholds: penalize mostly-intrinsic premium + cap the verdict when annualized RoR < ~15%.
(2) Premium/strike RECOMMENDATION engine for the open (DTE + closing IV + pre-market delta shift -> target-delta strikes -> est. premium per strike -> best strike/premium/tenor) — needs a delta/Black-Scholes estimator.

## Group FG prime ✅ (2026-06-08)
OPEN: Premium/strike RECOMMENDATION engine for the open (DTE + closing IV + pre-market delta shift → target-delta strikes ~15-25 / ~10 leveraged → est. premium per strike → best strike/premium/tenor) — needs a delta/Black-Scholes estimator; big quant feature, design first.

## Group FH prime ✅ (2026-06-09)
OPEN (queued):
(A) AddPosition verdict 2nd line + GLOBAL rule: when text follows a leading emoji/icon, wrapped lines must align to the first word, not under the emoji.
(B) AddPosition price/IV must show on ticker entry (currently hidden until a strike).
(C) CC reminder: '+' to the LEFT of the number on the 'לחוזה...' line + verify the premium calc.
(D) Dashboard 'רשתות חברתיות' → unified 'מודיעין' feed (news+events+social, my-tickers-first chronological, then the rest).
(E) BBAI +5% didn't alert — likely below its 2x-avg threshold; decide whether to lower the move threshold or add a fixed floor.

## Group FI prime ✅ (2026-06-09)
OPEN (queued): (D) price/IV visible from ticker entry; (C) CC 'לחוזה' line + sign + premium calc; (A) dashboard 'social' → unified מודיעין feed (big, design first). Apply BulletText more widely as the standard over time.

## Group FJ prime ✅ (2026-06-09)
OPEN (queued): (C) CC reminder 'CC ~$X לחוזה' line — move/add the '+' sign to the LEFT of the number (pending Dima confirming exactly which '+'). (A) dashboard 'social' section → unified 'מודיעין' feed (news+events+social, my-tickers-first chronological, then the rest) — big, design first.

OPEN: (1) CC premium boost formula review — boost uses the LAST closed position's DTE and fires on any |move|>3% incl. drops; Dima to decide new rule. (2) Recommendation should persist by PRICE LEVEL, not only daily move (proposal pending Dima's approval). (3) Social: if Telegram preview truncates long posts at SOURCE — full-post fetch (see FK5 finding: the t.me/s page itself carries full text, but the PARSER's non-greedy block regex tgme_widget_message_wrap...(.*?)</div></div></div> + text regex to the FIRST </div> can cut long/nested posts mid-way — fix is parser-side). (4) Dashboard social section → unified מודיעין feed (news+events+social, my-tickers-first chronological) — big, design first.

OPEN: (1) market-based CC premium from a real option chain — design pending FL5 inventory + Dima approval (FL5 finding: Yahoo fetchOptionDetails already parses bid/ask per strike/expiry, keyless — best candidate; Massive chain has structure but no bid/ask). (2) MRAM partial-close import gap — fix pending FL2 findings (realizedPnL-adjacent, needs explicit approval; may need Dima's Flex XML rows). (3) Telegram parser rewrite for very long posts (balanced-tag/DOM) — queued. (4) Dashboard social section → unified מודיעין feed — big, design first.

OPEN: (1) MRAM partial-close fix (partialNets + FlexSyncWorker quantity path must emit closed record + fifoPnlRealized + ActivityEvent) — AWAITING Dima approval + MRAM Flex XML rows. (2) Market-based CC premium via Yahoo fetchOptionDetails (DTE 21-35, strike >= max(price*1.02, costBasis), bid, daily cache, heuristic fallback) — design proposed, AWAITING Dima approval.

DONE: MRAM partial-close fix + market-based CC quote (FN). STILL OPEN: Telegram parser rewrite for very long posts; dashboard social -> unified מודיעין feed (design); FL3 diagnostics if the quiet-day CSP note still doesn't appear after the backfill.

OPEN (Tables UX, to scope with owner before building): (1) apply the PortfolioBreakdown-style sortable, column-aligned headers (header+data cells Box-centered on shared W_* weights — RTL-drift-proof) to every list/table screen; (2) PERSIST the last-used sort per table across re-entries/app restarts (PortfolioBreakdown persists via VM; StockRealized GC is in-memory only). Candidate screens to review together: PositionsListScreen, PortfolioBreakdownScreen (persist), StockRealizedScreen (persist), CollateralScreen, ReportsScreen tables, TaxReportScreen. Decide the exact list with owner first.

GD2: short value as MtM liability ((entry-current)*|shares|, not shares*price) + include in portfolio total + inverted unrealized P&L display. Also fix the GD1-flagged gaps: PortfolioEventsScreen shares*price/dividends for shorts; FlexSyncWorker background merge (currently keeps >0 so background sync drops shorts); snapshot reads using takeIf{>0}.
GD3: split the 100-share assignment feed/realized into 46 close + 54 short-open so the share count isn't 154.

GD2b STATUS: short P&L value DONE in PortfolioBreakdownScreen (GD2) + dashboard open-positions short ROW DONE (GF2). REMAINING: include shorts in summary.openPositionsCount (touches the option-counting summary builder). GD3 DONE (GF3): assignment share-count split to closed qty. STILL OPEN from GD1: PortfolioEventsScreen shares*price/dividends for shorts; FlexSyncWorker background merge keeps >0 (shorts persist via manual import only).

SHORT-STOCK STATUS (GG): GD1 sign-through DONE; GD2 short value/P&L DONE; GD3 assignment count split DONE (GF3); GF2 dashboard short row DONE; GG1 sub-100 short → 'לא נכלל' w/ P&L DONE; GG2 short in openPositionsCount DONE; GG3a bg-sync persistence + avgCost DONE; GG3b PortfolioEventsScreen already safe (shares>0 guards). REMAINING/none-critical: (a) multi-flip-trade share-count attribution edge (GF3); (b) if a short ever needs to appear in the dashboard MOVERS by position-P&L (currently only a separate short row); (c) openPositionsCount short count excludes a short ticker that ALSO has an open option leg (counted once via the option) — intentional to avoid double-count.

SHORT-STOCK STATUS (GH): GH1 feed-tap scroll-to-sale DONE; GH2 short as % mover w/ 'שורט' tag (separate $ row removed) DONE; GH3 assignment short-open event (STOCK_SHORT_OPENED, 46+54=100, realized unchanged) DONE. Short-stock feature now: sign-through (GD1), value/inverted-P&L (GD2), count split (GF3/GH3 two-event), feed-tap drill+scroll (GE/GF1/GH1), dashboard mover w/ tag (GH2), sub-100→'לא נכלל' w/ P&L (GG1), openPositionsCount (GG2), bg-sync persistence (GG3a), PortfolioEventsScreen safe (GG3b). REMAINING/minor: multi-flip-trade count attribution edge (GF3); STOCK_SHORT_OPENED shows '$0.00' amount in feed (per spec amount=0).

SHORT-STOCK STATUS (GI): GI1 feed-tap scroll-to-row WORKING (animateScrollToItem(1, measured-offset); GH1 BringIntoView failed on single-item table); GI2 short-open shows proceeds informationally (amount null, realized unchanged). Short-stock UX now complete through GI. REMAINING/minor: multi-flip-trade count attribution edge (GF3); the assignment trade's literal proceeds (qty×690) differ from the displayed qty×avg(714.78) — by design per spec (uses the position avg).

SHORT-STOCK STATUS (GK): GK1 feed-tap scroll WORKING via discrete items (offset-math removed); GK2 short-open proceeds from rawXml costBasisPrice (snapshot avgCost was null); GK3 short-open row → PortfolioBreakdown. Short-stock UX complete through GK. REMAINING/minor: multi-flip-trade count attribution edge (GF3).

User-reported TODO (to scope later):
 - Expiry banner undercounts: shows only 1 expiring position when 4 are actually expiring — fix the banner's count/source.
 - Risk-assessment + intel sanity bug: a put with current price ~25 and strike 24 (only ~$1 OTM) shows StrategicRiskAnalyzer 'סטרייק רחוק...' and intel 'התנאים תומכים בהמשך החזקה...'; after setting IV=122% the risk turns yellow 'איזון פרמיה/סיכון...' but intel stays green 'תומכים בהחזקה'. A ~$1 gap with 122% IV reading as 'strike far'/'supports holding' is illogical — audit the StrategicRiskAnalyzer distance/IV math and the intel recommendation logic.
 - Alerts not firing: no unusual-movement alerts during pre-market despite several tickers moving sharply — investigate the alert trigger/scheduling.

### 2026-06-29 Covered Put — completed + follow-ups
COMPLETED (commit 8d8907b):
- COVERED_PUT first-class strategy: enum, BigDecimal CoveredPutCalculator, Room v31 (contract_multiplier), ProfitCalculator integration, CoveredPutDetailScreen + nav, 23 JVM tests.
REMAINING Covered Put improvements (not done this round):
- Persist a custom contract multiplier from the creation UI (currently entity default 100; calculator/detail are multiplier-aware, but AddPosition has no multiplier input field yet).
- Real partial-assignment PERSISTENCE: split the position entity (assigned slice -> closed/ASSIGNED with N contracts, remainder stays OPEN) in a repository method + an assignment dialog. Calculator math is done & tested; the entity split/UX is not wired.
- IBKR import mapping: auto-classify short-stock + short-put on the same underlying as COVERED_PUT.
- Reporting/dashboard: a dedicated COVERED_PUT grouping/section (currently flows through generic SELL-option totals).
- ProfitCalculator still uses a hard-coded x100 for COVERED_PUT (multiplier-aware figures live only in CoveredPutCalculator/the detail screen) — fine for standard contracts; revisit for adjusted contracts.

### 2026-06-29 Deferred items logged for handoff (NOT part of the Covered Put task)
- Feed number bidi REGRESSION: REMOVE isolateLtrRuns from event.title/description in DashboardScreen.kt; instead force textDirection=TextDirection.Rtl on both Texts (isolateLtrRuns double-isolates strings the importer already wraps with ⁨ -> regression).
- Social: shrink the text block above the posts (exact element pending an owner screenshot).
- Social thumbnail: before treating "no image" as a bug, confirm imageUrl is present via Logcat tag SOCIAL_FEED ("X posts, Y with images").
- StockRealized drill-down: route per-sale rows to the correct POSITION screen (target pending owner choice), NOT TickerDetail; make BACK restore the screen via rememberSaveable for expandedTicker + scroll position.
- Deploy note (not code): app "downgrades" on reboot due to Android Studio Apply Changes / streamed install not persisting — fix is a full APK install (assembleDebug + adb install -r). The GO BootReceiver does not address this.

### 2026-07-04 Owner rules + verified gaps (M1)
- GLOBAL RULE (owner): Back navigation must restore the exact previous spot — screen state + scroll — everywhere in the app.
- GLOBAL RULE (owner): No large flickers or involuntary jumps anywhere in the app. Banner ✕ dismissal must be smooth, and the monthly-target card must NOT refill/re-animate when a banner is dismissed. (Small live-value refreshes like the unrealized-P&L card are fine.)
- FEATURE GAP (verified in code): short-close (buy-to-cover) is invisible. importStockSoldEvents skips every trade where buySell != "SELL" (ImportViewModel ~line 1303) and EventType has no stock-BUY value — so a short's closing BUY, which carries IBKR's fifoPnlRealized, never becomes a feed event or stock-realized P&L. Owner closed a short at a profit days ago; it appears nowhere. Needs: surface closing STK BUY trades as a feed event + include them in stock-realized totals. Design pending owner approval.
- DIAGNOSIS NEEDED: dashboard banner returns on every dashboard entry after ✕ despite GP1's cache-vs-dismissedSig check. Suspect (unverified): the worker rewrites the cache string between entries so the signature no longer matches. Requires a read/log diagnostic before any fix.

### 2026-07-05 D1 findings (diagnostic — no code changed; OPT HEAD ac3f4e8)
Two CONFIRMED bugs in the new-position screen + the owner ruling on the Covered Put money path. Full detail in cc-latest.md (A1–A3, B1–B4).

- CONFIRMED BUG — strategy-blind yield-tier banner. `AddPositionScreen.kt:828–869` computes `yieldPct = premium/strike*100`, `annualized = yieldPct*365/dte`, tiers 40/25/15/8 (מעולה/טוב/סביר/נמוך/חלש). No `strategyType` branch — the base is always the STRIKE. For a Covered Call the base should be the stock COST BASIS. Symptom: CC prem 0.54 / strike 50 / cost 24.28 / DTE 31 shows "נמוך 1.08% (שנתי 12.7%)" while the מודיעין card (cost-basis-aware `StrategicRiskAnalyzer` metrics) shows ~2.22% / ~25%. Fix later by dividing on `capitalAtRisk`/cost basis (the way A3 `premForTarget` already does).
- CONFIRMED BUG — put assignment-probability math applied to CALL legs. `StrategicRiskAnalyzer.calculateMetrics:327–339` builds `putBufferAssessment` only for `optionType==PUT`; a CALL falls through to `estimateAssignmentProb` (`378–387`), which returns `normalCDF(-d)` = P(price < strike) UNCONDITIONALLY (comment even says "for PUT"). For a short CALL, assignment prob = P(price > strike) ≈ `normalCDF(d)`. Symptom: CALL strike 50 on a 20.68 stock shows "הקצאה 96%" (true ≈ 4%). Surfaces at `AddPositionScreen.kt:634`. Fix later: branch on optionType (CALL → normalCDF(d)).
- NOTE (not a bug): A3 premium-range thresholds (`AddPositionViewModel.premForTarget:1387–1397`, targets 12/18/25% annual) ARE strategy-aware — they base on `ProfitCalculator.capitalAtRisk` (CC → stock cost basis; CSP/CoveredPut/Wheel → strike×contracts×100; longs → premium; spreads/IC → width−premium). This is the correct pattern the A1 banner should copy.

- OWNER RULING (approved direction, Covered Put money path): Covered Put assignment must behave like CSP — option P&L $0, premium folded into the effective cover price (23.60), NOT counted as option income in the calendar or the monthly target. The existing MULL CP record must be corrected accordingly (July realized drops by 1,816.16). Rationale: matches IBKR reporting, and prevents double-counting once buy-to-cover import (roadmap gap) lands, since IBKR books the cover at the premium-adjusted price. This REVERSES the 8d8907b design (which realized premium as income). Implementation touches `ProfitCalculator.realizedPnL` (COVERED_PUT branch 148–155 + commission guard 200–204) — a `.claude-guard.json` P&L-locked file → needs-dima PR path. Realized is COMPUTED (not stored: no realized column, only `ibkr_realized_pnl` which is null for the manual MULL record), so the calc change fixes the existing record retroactively with no migration; verify `ibkrRealizedPnl` is null and correct any feed `ActivityEventEntity.amount` row.

### 2026-08-19 S1 — phone dev loop established + reboot-crash root cause (OPT 5445921)
Setup/diagnostic only; no app code changed. Full handoff in cc-latest.md; runbook committed as `PHONE_BUILD.md`.

- DONE (infra): on-device build/test/APK loop verified with NO Android Studio — JDK 21 + SDK `/opt/android-sdk` + `heavy-run`. compile gate + 23 unit tests + `assembleDebug` all green. `platforms;android-35` was missing and is now installed. `local.properties` must stay `sdk.dir=/opt/android-sdk` on the phone (gitignored+tracked; NOT committed).
- OPEN (manual, owner): ADB has no paired device — one-time Wireless-debugging pairing needed before any on-device install/launch/logcat (command shapes in PHONE_BUILD.md; do NOT invent pair codes).
- OPEN (manual, owner): debug-signing continuity UNPROVEN — phone keystore (gen 2026-07-22, SHA-1 0EB514FE…) almost certainly differs from the months-old computer-signed install, so `install -r` will likely need the computer's `~/.android/debug.keystore` copied to the phone first. Verify once a device is paired.
- REBOOT CRASH — root cause CONFIRMED from code + memory (extends the existing "Deploy note"): DB v31-on-disk vs a reboot-reverted v30 Apply-Changes/streamed APK → Room downgrade, fatal since destructive fallback was removed → dashboard empty then unguarded-DB crash. Durable fix is the S1 loop itself (full APK `install -r`, never Apply Changes). NO code fix in S1 (locked P&L/DB core + design choices). OWNER FIX OPTIONS (pick before any code change):
  1. Process-only (RECOMMENDED, zero code): always deploy via `assembleDebug` + `adb install -r` (this runbook); stop using Apply Changes/streamed installs. Fully mitigates the reboot revert. No P&L/DB risk.
  2. Bump `versionCode` on each real install (build.gradle) so the OS never silently reverts a streamed deploy to an older package. Small, non-locked, complements #1.
  3. Consolidate the 11 hand-maintained Room builders into the single Hilt-provided DB so `MIGRATION_30_31` (and future migrations) can't drift (roadmap "DI" item). Touches Room/DB LOCKED core → needs-dima PR.
  4. Add a guarded downgrade path (`fallbackToDestructiveMigrationOnDowngrade`) — REJECTED direction historically (it silently WIPES data; that was the old "all data lost after reboot" bug). Only reconsider with explicit owner sign-off. Touches locked DB core.

### 2026-08-19 S1-cont status — signing / install / reboot (Claude Code)
- SIGNING: RESOLVED to a CONFIRMED MISMATCH via certificate evidence (apksigner --print-certs on both APKs). Installed cert SHA-1 5d3d855c6c6c397f817df2bd0c62f16f940b1551; new phone-built APK SHA-1 0eb514fe3213157080d3fa8269a74e83e34ebd08. Different debug keystores (computer vs phone). No longer an assumption.
- INSTALL: BLOCKED (not attempted) on the one-time keystore copy. Owner action = copy the computer's original ~/.android/debug.keystore onto the phone at /root/.android/debug.keystore (no custom signingConfig, so this is the whole signing path), rebuild, verify SHA-1 == 5d3d855c... , THEN adb install -r. Uninstall/clear-data forbidden.
- REBOOT: NOT performed in S1-cont (owner-gated; do not reboot until instructed). Durable reboot-crash fix still = full-APK install loop (this same install path, once unblocked), NOT Android Studio Apply Changes.
- ADB self-connection is LIVE and proven; install/launch/logcat now run entirely from the phone once the keystore step is done.
- BACKLOG PRESERVED (unchanged): F1, F2, R1/R2, dashboard banner-reappear (GP1 diagnosis), buy-to-cover import gap, social-feed items, D1 findings (A1 yield-banner, A2 CALL assignment-prob, Covered-Put money-path ruling), and all prior roadmap entries.

### 2026-09-06 S1-final — owner-reported backlog from physical app use (RECORDED ONLY — NOT implemented in S1-final)
Source: the owner's physical use of the installed app, reported at the S1-final prompt. All six are owner-approved TODOs for FUTURE rounds; none were touched in S1-final (a signing / build / install / device-acceptance + documentation task only). No P&L, commission, or import formula may change without explicit owner approval (`realizedPnL` and the P&L core remain locked per `.claude-guard.json`).

- **A. NEW dashboard section "מה קורה היום בשוק"** — placed exactly BEFORE "פוזיציות פתוחות", with the same visual size/weight as that section. Purpose: summarize what matters for the CURRENT trading day as a simple, understandable daily market briefing in plain Hebrew (not dense professional jargon). Coverage: tickers currently held in the portfolio, tickers with open options, and actively-watched/watchlist tickers. For each ticker/universe explain: what is expected to move it today; important same-day catalysts/events/news; if it IS moving, the likely relevant reason/context; group related tickers/universes where that makes the summary clearer. (Relates to the existing NEW23 "pre-open ticker intelligence" item — A is the concrete dashboard placement + UX spec for it.)
- **B. Covered Call reminder UX / coverage** — the current sentences such as "לחוזה..." and the explanatory phrase are unclear. Redesign the wording LATER so a normal user understands: what the number means; what action/idea is being suggested; why it is shown. Also INVESTIGATE why not every eligible portfolio ticker WITHOUT an active CC consistently appears in the reminder. Preserve the existing approved behavior (incl. the `CC_REMINDER_FILTER` rules) until it is explicitly redesigned. (Extends the earlier FH/FJ "(C) CC 'לחוזה' line" items.)
- **C. IBKR commissions / rebates (signed values)** — the app currently cannot represent the full SIGNED commission/rebate behavior IBKR shows. A DIAGNOSTIC reconciliation of the raw Flex/IBKR fields is required BEFORE any money formula changes; then support the real signed-value semantics correctly. Do NOT "fix" this by merely allowing a minus sign without verifying the import + calculation semantics.
- **D. IBKR vs app trade P&L discrepancies** — multiple trades show different realized amounts in the app vs IBKR; some discrepancies exist even where the visible commission sign does not explain them. The future diagnostic must reconcile the full chain: raw opening fills → opening commission/fees → imported opening basis → closing fills → closing commission/fees → IBKR realized P&L → stored app values → displayed app P&L. NO P&L formula change without explicit owner approval.
- **E. Feed close timestamp bug** — the owner observed feed rows showing a close time/date around "15.08 03:00" while the actual trades closed on 14.08 at different real execution times. Investigate the source timestamp, the timezone conversion (America/New_York vs device/Thailand) and the fallback behavior. SUSPECT (unverified): 14.08 16:00 ET == 15.08 03:00 in Thailand (UTC+7), i.e. the stored close time may be the market-close (16:00 ET) fallback instead of the real execution time. Also ADD the real closing TIME to the close/edit page later — it currently exposes the closing DATE but not the actual time.
- **F. SPCH concrete reconciliation example** — owner-supplied IBKR/app screenshots show a materially different result (roughly a ~$20 discrepancy); the IBKR close execution shows a commission around -5.92. The difference is too large to assume commission alone explains it. The future investigation must compare the real opening basis/fills and closing fills against the app's stored premium and P&L. Treat as a DATA-RECONCILIATION bug (import/basis), NOT a cosmetic display issue. Use SPCH as the concrete fixture for C/D.

PRESERVED (unchanged, still open — nothing deleted): F1, F2, R1/R2, dashboard alert-banner reappear (GP1 diagnosis), buy-to-cover import gap, social-feed items, D1 findings (A1 strategy-blind yield banner, A2 CALL assignment-probability math, Covered-Put money-path owner ruling), PR #18 (automation-core workflow sync) review findings — deferred, not addressed in S1-final —, every pending device test in `pending-tests.md`, and all earlier roadmap entries above.

### 2026-09-06 S1-final status — signing / install / launch DONE on the device; owner acceptance + reboot pending (Claude Code)
- OPT: 7225b7af16c183de00a9f064ead03a01ad6af1d3 (docs-only: PHONE_BUILD.md). APK built + installed from d0d5d3d — app sources identical to 5445921.
- SIGNING — SUPERSEDES the S1-cont "INSTALL: BLOCKED" entry above: the owner recovered the computer's ORIGINAL debug.keystore onto the phone (keytool SHA-1 5D:3D:85:5C:6C:6C:39:7F:81:7D:F2:BD:0C:62:F1:6F:94:0B:15:51, verified independently in-session); the new APK signer == the freshly pulled installed signer (SHA-1 5d3d855c…, SHA-256 9e5307e1…).
- INSTALL: `adb install -r` Success, update in place; firstInstallTime unchanged (2026-04-22); DB / DataStore / caches untouched (sizes + mtimes identical); installed base.apk byte-identical to the build (SHA-256 8e94372f…). No uninstall / clear / -d.
- BUILD/TESTS: compile gate green (0 `e:`), 23/23 JVM tests actually re-executed (forced via `cleanTestDebugUnitTest` — plain `testDebugUnitTest` was UP-TO-DATE), assembleDebug green, `git diff --check` clean.
- LAUNCH/RUNTIME: Displayed +1s57ms, pid stable 60 s, second warm launch OK, 0 FATAL / Room / SQLite / downgrade errors, workers SUCCESS, positions loaded from Room.
- APK DELIVERED: /sdcard/Download/OptionsProfitTracker/OptionsProfitTracker-1.0.0.apk (SHA-256 == build output).
- PENDING (owner-gated): (1) visual data-survival acceptance (6-point checklist in pending-tests.md) — could not be collected in-session; S1-final validation = BLOCKED on it; (2) reboot test — NOT performed. The S1 reboot-revert root cause is mitigated by design now that a full APK is installed, but only the real reboot confirms it.
- NEW record-only TODO — diagnostic log storm: `PNL_TRACE` (≈96.8k warn lines) + `PnLDebug` (4.7k) + `PNL_DBG` (3.8k) are emitted within ~10 s of every dashboard load (~100k logcat lines per load, also on warm re-launch) and print per-position trade details to logcat. Gate them behind a debug flag or remove once the P&L reconciliation work (C/D/F above) no longer needs them. Not touched in S1-final (ProfitCalculator area is locked).
- Backlog A–F (recorded in the block above) and every earlier item remain open and unimplemented.

### 2026-09-07 S2 — done in PR #19 (OPEN, needs-owner; OPT f327a7e) + preserved backlog
- DONE (in PR, not merged): owner backlog A (dashboard "מה קורה היום בשוק"), B (CC reminder wording + coverage bug), C (signed commissions/rebates), D (IBKR-authoritative reconciliation of manual rows, one realized precedence), E (feed close timestamp root cause + real close time on "עריכת סגירה"), F (SPCH fixture as a unit test through the real cycle builder); D1 findings A1 (CC yield banner) + A2 (CALL assignment probability); Covered Put money-path owner ruling (old 8d8907b accounting = SUPERSEDED — owner approved: assignment option P&L $0 + premium folded into the effective cover price); PNL log storm gated OFF.
- PENDING: owner review/merge of PR #19; Codex review (usage limits); device QA of the PR build; reboot test (owner-gated).
- PRESERVED (unchanged): dashboard alert-banner reappear (GP1 diagnosis); buy-to-cover import gap (short-close STK BUY invisible); social backlog; PR #18 automation-core review findings; Room/Hilt DB-builder consolidation (DI item); expiry-banner undercount; alerts pre-market; calendar progress-bar jump; tables-UX sort persistence; all earlier roadmap entries and pending device tests.

### 2026-09-07 S2 (cont.) — device-verified in PR #19 (OPEN, needs-owner; OPT 1ab4c82)
- DONE and now VERIFIED ON THE DEVICE (still in the PR, not merged): the whole S2 set above, plus four defects that only the real IBKR feed exposed — multi-cycle rows overwriting each other (BKSY data loss), per-import premium churn on multi-row contracts (PLUG/QQQ), the true per-fill commission sign (SPCH rebates = the owner's "~$20" gap), and movers being shown on a closed market day.
- MEASURED: PNL log storm 63k+3k+2.3k lines → 0; reconciliation converged to updated=0/inserted=0/unchanged=261 on the third real import.
- PENDING: owner review/merge of PR #19; Codex review (account usage limits); owner visual checklist (pending-tests.md 2026-09-08); reboot test (owner-gated).
- PRESERVED (unchanged): dashboard alert-banner reappear; buy-to-cover import gap; social backlog; PR #18 automation-core findings; Room/Hilt DB consolidation; expiry-banner undercount; pre-market alerts; calendar progress-bar jump; tables-UX sort persistence; the remaining direct-calculator sites in TaxReportScreen / AddPositionViewModel; all earlier roadmap entries.

### 2026-09-07 S2.1 — done in PR #19 (OPEN, needs-owner; OPT e91488b) + preserved backlog
- DONE (in PR, not merged): whole-repo IBKR financial audit with 8 bucket-(B) precedence fixes + a ReportGenerator hardening; a real reconciliation audit (11 metrics, IBKR_AUDIT line, verdict CLEAN on the live feed); the A4 ambiguity question ANSWERED with device evidence (one cycle split across N rows — deliberately still not matched); the owner-approved state-aware Covered Put expected-profit branch; the dynamic market brief (no roll-call line, no truncation, named holidays, full session model incl. 13:00 ET early closes, event lifecycle wording, factual-reasons-only).
- DONE (security, newly discovered on the device): raw Flex XML / IBKR account number / the entire <AccountInformation> element (legal name, home address, email) and the AlphaVantage API key were all being written to logcat on every sync. Redacted and gated; measured 0 occurrences afterwards.
- PENDING: owner review/merge of PR #19; Codex review (usage limits); reboot test (owner-gated); the owner visual checklist in pending-tests.md.
- NEW backlog from S2.1 (owner decisions, none implemented): (1) buy-to-cover feed rows — stock TOTALS are already complete, but a short closed by a BUY has no feed row, so the drill-down under-reports its own total (MULL 2026-07 ~$3,159.07); a STOCK_SHORT_COVERED event would be feed-only and must not touch any sum. (2) the three split cycles — merge each set of partial-close rows, or split a cycle by (closeDate, quantity); the latter resolves BTCI and SPCH but provably cannot resolve IRE from the data on the device. (3) strengthen the same-second (timestamp, amount) feed fingerprint with tradeID/ibExecID (both in the payload, both discarded); 9 ticker-months affected, totals unaffected. (4) unify the four worker session windows (FlexSyncWorker 4-20, AlertWorker 4-19, DraftUpdateWorker 4-19, IvService 4-19, OptionsTrackerApp 9-18) onto MarketCalendar.sessionAt — NOT done here because it would silently change auto-sync/alert cadence on holidays.
- PRESERVED (unchanged): dashboard alert-banner reappear (GP1); social backlog; PR #18 automation-core findings; Room/Hilt DB-builder consolidation (DI); expiry-banner undercount; alerts pre-market; calendar progress-bar jump; tables-UX sort persistence; all earlier roadmap entries and pending device tests.

### 2026-09-07 S2.1 (review round) — self-review fixes in PR #19 (OPEN, needs-owner; OPT 9500709)
- DONE: 13 defects found by reviewing this PR myself after the owner confirmed Codex has no quota — partial-close slice double-counting, split-fill commission, the never-cleared tax loss carry-forward, a realized P&L stamped on OPEN rows, a fallback matcher that could close a live position, a partial close duplicating the broker figure, the covered-put premium lost on uncovered shares, the CC yield scaled by the wrong share count, the Flex token reaching logcat through an exception message, three real defects in the new redaction regex, an audit verdict that overstated its own coverage, an invented "quiet day" claim, and a frozen dashboard clock.
- NEW backlog (owner decisions, NOT changed): BackupService writes the Flex token + 11 API keys in cleartext to EXTERNAL storage automatically once a day (15 copies retained); and allowBackup=true with no dataExtractionRules makes the DataStore holding those credentials eligible for Google Auto Backup. Both are larger exposures than the logcat leak this task fixed, but changing either alters what a restore can recover.
- PRESERVED: everything from the S2.1 block above, unchanged.

### 2026-09-09 — S2.2 backlog reconciliation (OPT 4935ba6, PR #19 OPEN needs-owner)

**DONE in S2.2**
- Feed: a partial close now produces a partial-close event on the CLOSED slice, with the slice's own
  authoritative P&L and no duplicate; the cold-start pass repairs a stranded event instead of zeroing it.
- CC reminder: the stock snapshot can follow a holding DOWN; coverage counts any live short call.
- Market brief: no unexplained mover is listed, the "אין הסבר זמין" sentence is gone, explanations are
  resolved from the app's existing Finnhub company-news source, the earnings cache and the social feed.
- Partial cycles are reconciled (close side only) and audited; an OPEN cycle no longer recombines a
  partially-closed row or double-charges its opening commission.

**PENDING OWNER (blocking nothing in code, but they are the only ones who can answer)**
- SPCH strike 12: IBKR reports 18 contracts OPEN + 800 shares and has no buy-to-close for the 10
  contracts the app shows closed. Confirm against the IBKR app — if it never executed, 1,000 shares'
  worth of calls are naked. Decides whether the slice ever gets a broker realized P&L and a real fill time.
- Whether the thin Finnhub `company-news` coverage for this portfolio (0 items for every leveraged /
  thinly-covered ticker, 5 for NOK) is acceptable, given the card now stays silent without a source.

**PENDING PHYSICAL (owner device checks)**
- The market brief's POSITIVE path (a ≥3% mover WITH a same-day headline) — no ticker met both
  conditions during the S2.2 session; the negative path was proven live on NOK.
- A fresh partial close made through "סגירת פוזיציה" end to end.
- Reboot: still not performed (forbidden this task).

**PRESERVED FUTURE (deliberately NOT implemented here — no scope creep)**
- Cleartext credentials in the daily external-storage backup, and `allowBackup="true"` with no
  extraction rules. Both still untouched; both change what a restore can recover, so they are owner decisions.
- Buy-to-cover feed rows (A5); how to correct the three ambiguous split cycles (A4); strengthening the
  feed fingerprint with `tradeID`/`ibExecID`; PR #18 automation-core findings; the dashboard alert-banner
  reappear issue (GP1); DB/Hilt consolidation; unrelated IV work; tables-UX sort persistence;
  unifying the four worker session windows onto `MarketCalendar.sessionAt`.

**SUPERSEDED** — nothing. No previously approved behaviour was replaced in S2.2.

## After the S2.3 ADDENDUM (2026-09-10)

**OWNER-GATED (see pending-tests.md)** — the phone was locked all session, so every visual check for
the withdrawal line, the put ranking, the watchlist price and the three-section brief is owed. So is
the reboot test, still never performed.

**FOUND, DELIBERATELY NOT FIXED (out of scope, real money)**
- `FlexQueryService.parseDividends` runs TWO regexes over the same XML (`/>` then `>`), and a
  self-closing `<CashTransaction … />` matches BOTH. `extractAndSaveDividends` appends one line per
  returned row with no dedup, so the tax dividend payload double-counts every self-closing row. The
  new `parseCashRows` uses the single correct `/?>` form; the dividend path was left alone because it
  changes tax-report numbers and that is the owner's call, not an agent's.
- The withdrawal figure cannot be re-derived from history: `rawFlexXml` is in-memory only, so the
  store is only as complete as the windows the app has actually seen since this build was installed.
  Months before that will read as no withdrawal. Worth telling the owner rather than silently showing
  a partial history.

**PRESERVED FUTURE (unchanged)**
- Cleartext credentials in the daily external-storage backup, and `allowBackup="true"` with no
  extraction rules. Both still untouched; both change what a restore can recover.
- Buy-to-cover feed rows (A5); the three ambiguous split cycles (A4); `tradeID`/`ibExecID` in the feed
  fingerprint; PR #18 automation-core findings; the alert-banner reappear issue (GP1); DB/Hilt
  consolidation; unifying the four worker session windows onto `MarketCalendar.sessionAt`.

**SUPERSEDED by the owner's addendum**
- S2.3's rule that broad-market context is a FALLBACK shown only when the owner's tickers are quiet.
  The owner ruled the brief must carry BOTH kinds of context on every briefing; the fallback-only
  behaviour and the tests that pinned it are gone.
- The "AGENT CHOICE, PENDING OWNER CONFIRMATION" note on the SPY/QQQ/DIA/IWM benchmark set. The owner
  approved the set explicitly; the note is removed and a test pins the four symbols and labels.

### 2026-09-10 — S2.3 FINAL ADDENDUM shipped; one finding deliberately left open

**Shipped** (see state.md for the commit): session-dynamic market brief (D1), the CC premium root
cause + freshness contract (finding 2), the dashboard canonical top-3 put preview (D3).

**Open backlog item — the dashboard price-refresh fan-out (NOT a regression, pre-dates S2.3).**
The device PID log shows the whole ticker list fetched **four times within ~100 ms** of every launch
and every resume:

```
12:41:26.301 YAHOO_PRICE  : Dashboard init: refreshing prices for 7 tickers
12:41:26.395 PREPOST_DEBUG: triggerPriceRefresh …   (DashboardScreen LaunchedEffect(Unit))
12:41:26.396 PREPOST_DEBUG: resume refresh …        (refreshOnResume; its 3-min cooldown is cold at 0)
12:41:26.396 PREPOST_DEBUG: triggerPriceRefresh …   (DashboardScreen ON_RESUME observer)
```

28 keyless Yahoo requests for a 7-ticker portfolio, per launch. The chart endpoint is rate-limited
and the way that failure lands is a 429 → empty price map → a market brief with nothing to say.

**Why it was NOT fixed in the final addendum, and what the fix actually is.** The obvious
claim-before-launch gate (the discipline `PutScanCache` uses) was written, wired and then reverted,
because it is wrong here: `init` is a strict SUBSET of `triggerPriceRefresh` — it reads only the
snapshot's own keys, so it misses open-position tickers, and it never writes `currentStockPrice` back
to the open positions. `init` also fires FIRST, so a gate keyed on time hands the win to the weakest
caller and silently stops pricing pure-CSP / pure-CC underlyings (exactly the J2/G2 defect the
comments in `DashboardViewModel` record being fixed once already).

The correct fix de-duplicates at the FETCH layer, not the call sites: a short-TTL memo inside
`IvService.fetchYahooPricesWithPrePost` keyed on the ticker set, so all four callers still run their
full post-processing (dailyOpen stamping, volatility cache, CC quote refresh, `currentStockPrice`
writes, watch-scan snapshot) while only one of them touches the network. Needs its own tests for the
memo's TTL, its key, and concurrent callers.

Estimated: small, but it touches a service every screen and both workers depend on, so it wants its
own round rather than a finalization-day patch.

**Also open, found the same day:** the CC reminder's `פרמיה אחרונה שמכרת` fallback considers only
CLOSED sells. For a PARTIALLY covered ticker (some shares under an open CC, some uncovered) the open
CC is a more recent sale than any closed one, so the caption can name an older premium than the one
the owner most recently sold. Not wrong — the amount and date it prints are both real — but not
literally "the last premium you sold" either. Decide whether the label or the query should change;
it needs an owner call, not a guess.

### OWNER DECISION NEEDED — two owner rulings now contradict each other (found 2026-09-10)

The S2.3 final addendum says, of a displayed premium: **"Do NOT fabricate from stock move alone."**
That is why the CC reminder's 1.30–1.60 `dteBoostFactor` and its `stockPrice × 0.02` fallback were
deleted.

**A third instance survives, in a different feature, because the owner approved it earlier.**
`ReportGenerator.kt` (the abnormal-move alert, marked `FL4 (approved)`):

```kotlin
val lastPremium = closedThisMonth.filter { it.ticker == ticker }
    .maxByOrNull { it.closeDate ?: it.openDate }?.premiumPerContract
val estimatedPremium = lastPremium?.let { if (changePct > 0) it * 1.3 else it }
```

It reaches the owner's eyes as `→ CC ~$X` on the dashboard alerts card and on `AlertsScreen`. The
`× 1.3` is a premium fabricated from the stock move alone — the exact thing the new ruling forbids —
and the `~` is much weaker labelling than the provenance line the CC reminder now carries. Its
ranking key is also the buy-back date, the same defect fixed elsewhere this round.

**It was deliberately NOT changed**, because reversing an owner-approved behaviour in a feature the
addendum did not name is the owner's call, not the agent's. Numbered choices:

1. **Apply the new ruling here too** — drop the `× 1.3` and show the owner's real last premium with
   its real sale date, or show no number when there is none. (Consistent with the rest of the round.)
2. **Keep the boost but label it** — show it as an explicit estimate, e.g. `~$X (הערכה)`, so it can
   never be read as a quote.
3. **Keep FL4 exactly as approved** — the alert is a prompt to look, not a trading number, and the
   `~` is enough.

Whichever is chosen, the ranking key should move from `closeDate` to `openDate` (a one-line change,
the same fix as `CcPremium.lastSale`): a premium sold in August but closed yesterday currently
outranks one sold last week.

### OPEN — the day-baseline fix reached the INDEX row only (found 2026-09-10, review round 2)

`MarketContext.dayBaseline` + the `dayPrevious` key fixed the benchmark row: after the bell it now
divides by the previous session's close instead of today's own. **The per-ticker `changePct` was not
changed.** It still reads the stock snapshot's `previous`, which `DashboardViewModel` writes from
`priceData["previous"]` — and after 16:00 ET that is today's close.

**Consequence.** At 18:30 ET on a day SPY/QQQ/DIA/IWM each closed −1.8 % and SOXL closed −6.2 % and
is flat after hours: the index row correctly reads −1.8 %, while SOXL's `changePct` is
`(post-market print − today's close) / today's close` ≈ **0.0 %**. That is below
`DEFAULT_MOVE_THRESHOLD_PCT`, so SOXL is not a mover at all, the explanation ladder never runs for
it, and **rung 3 still cannot fire after the close** — the very thing the blocker fix was supposed
to restore. The card is then internally inconsistent: four indices at −1.8 % over a portfolio
showing ±0.0 %.

This is PRE-EXISTING (the per-ticker path has always used `fetchYahooPricesWithPrePost`), not a
regression from the fix — but the fix is only half done and the docs now say so explicitly.

**Why it was not done here.** The correct fix persists `dayPrevious` into the stock snapshot as its
own field and switches `changePct(t)` and `ReportGenerator`'s movers base onto it. That changes what
the movers card, the abnormal-move alerts and the watchlist all MEAN by "today's change" in
after-hours — a visible behaviour change across four surfaces that the owner has not asked for, and
one that wants its own round with its own device QA. Doing it silently at finalization would be the
same mistake as the reverted price-refresh gate.

Also worth deciding in that round: `WatchlistScreen`'s `dailyOpen` guard compares against
`LocalDate.now(America/New_York)` while the WRITER stamps `dailyOpenDate` from a hardcoded
`Asia/Bangkok` rule (`DashboardViewModel`, pre-existing). They disagree during NY 00:00–04:00, so a
seeded `dailyOpen` is discarded then. The outcome is conservative (price shown, day-change hidden),
but a hardcoded Bangkok business-logic date is load-bearing for an NY-gated check, which the
project's timezone rule forbids.

### OWNER DECISION NEEDED — an assigned Covered Put realizes its premium NOWHERE on the manual path

Found by the exact-head review of the complete PR diff (2026-09-10). **Not changed**, because
`ProfitCalculator.kt` is a protected file, the behaviour is explicitly owner-approved, and CLAUDE.md
forbids touching `realizedPnL()` without explicit instruction.

**What changed and where.** `ProfitCalculator.kt` — the `isCoveredPut` assignment branch went from
`grossPnl = totalPremium(position)` to `grossPnl = 0.0`, and a new `isAssignedCoveredPut` disjunct
forces `calcPnl = 0.0`. Commits `f327a7e` / `e91488b`, both labelled owner-approved. The stated
design: a Covered Put assignment behaves like a CSP assignment — the option realizes $0 and the
premium folds into the effective buy-to-cover price, with the cover gain booked on the STOCK side.

**Why it looks incomplete.** The only code that folds the premium into the cover basis —
`CoveredPutCalculator.effectiveCoverPrice` / `.assign` — has exactly ONE non-test caller: a what-if
preview on an OPEN position in `CoveredPutDetailScreen`. It is referenced NOWHERE in `realizedPnL`,
`ReportGenerator`, `MonthlyCardLines` or `ImportViewModel.captureStockRealized` (verified by grep at
head 8be1fac). `captureStockRealized` copies IBKR's `fifoPnlRealized` verbatim, which does not exist
for a hand-entered trade.

**Concrete scenario.** The owner manually records SPCH, 2 contracts, strike 12, $1.40/share credit =
**$280**, short entry 15.00, assigned at expiry. No Flex row (manual entry; and per the daily-snapshot
rule today's trade would not be in the report anyway). `ReportGenerator` computes
`ibkrRealizedPnl ?: realizedPnL(entity)` = `null ?: 0.0`. **The owner sees $0.00 where $280 belongs**
— in `ממומש החודש`, the monthly-target total, the calendar day and the annual figure. Note the
asymmetry: an assigned CSP recovers its premium inside `realizedPnL` itself; the new guard makes that
branch unreachable for covered puts.

**Evidence that settles the BROKER-FED case** (the manual case is settled — it loses the premium):
take one real IBKR Flex `STK` buy-to-cover row from a covered-put assignment and compare its
`fifoPnlRealized` against `(shortEntry − strike) × shares`. EQUAL ⇒ the premium is absent from the
stock side too and the broker-fed path loses it as well. SMALLER BY `premium × shares` ⇒ IBKR already
basis-adjusted and only the manual path is affected.

**Numbered choices:**
1. Wire `CoveredPutCalculator.effectiveCoverPrice` into the realized path so the premium reaches the
   stock side as the design intends.
2. Revert to the pre-`f327a7e` accounting (option realizes the premium; nothing on the stock side).
3. Keep as-is and accept $0 on manual covered-put assignments, documenting it as intended.

Nothing here should be changed without an explicit owner instruction — it is `realizedPnL()`.

### OWNER NOTE — the CALL assignment-probability flip changes numbers on EXISTING positions

Same review. `StrategicRiskAnalyzer.estimateAssignmentProb` gained an `optionType` parameter. PUT
positions are unchanged (`N(-d)`); **CALL positions go from `N(-d)` to `N(+d)`**, so every
call-bearing strategy — Covered Call, call legs of spreads, straddles, strangles, long calls — now
reports a different assignment probability. It is a correct fix (the old code reported ~96 %
assignment on a short CALL 50 against a 20.68 stock) and it is a probability display rather than
P&L, and the commit claims owner approval — but it is NOT scoped to a new strategy, so the owner is
seeing changed numbers on positions they already hold.

UNVERIFIED and worth settling: whether `probAssignment` only feeds display, or also drives alerts and
recommendations. If it drives alerts, this deserves its own owner note.

### OPEN (pre-existing, NOT this PR) — the import logs the raw payload's first 200 characters

`ImportViewModel.parseCsv` logged `csvContent.take(200)` at `TS_PARSE`. For an IBKR Flex payload that
is the `<FlexStatement accountId="U…">` header — an account identifier and raw broker XML, both of
which the privacy contract forbids. Introduced by `d31b611`, which PREDATES this branch (confirmed:
the line is absent from `git diff 7225b7af 8be1fac`). It was redacted to `FlexLogRedaction.shape(...)`
in this round anyway, since the fix is one line and the leak is real — but the DEFECT is not this
PR's, and the same file has two other raw-dump sites (the OCR 500/2000-char dumps around `:2693` and
`:2778`, and `FlexSyncWorker.kt:873`) whose in-diff status was never verified. Worth one sweep.

### 2026-09-10 S2.3 physical-QA addendum — OWNER-PENDING decisions (OPT 5d4eca6; nothing below was changed)

**1. The put ranking is dominated by 2027–2028 LEAPS.** Live on the device the top three were WDCX
PUT 18 exp 2028-12-15 (119.51 %), NEBX PUT 25 exp 2027-03-19 (85.19 %) and SNXX PUT 16 exp 2027-03-19
(63.27 %). This is your own approved contract working as specified — *no upper DTE cap* and the ratio is
*deliberately not annualised* — so a longer expiry legitimately wins on premium per dollar of collateral.
It is flagged because a 827-day CSP ties up the collateral for 827 days, which may not be what you meant.
NOT CHANGED without your word. Options:
  1. Leave it exactly as approved (the DTE is shown next to every row, so nothing is hidden).
  2. Add an owner-set upper DTE cap (e.g. ≤ 180 days) as a FILTER, keeping the ratio un-annualised.
  3. Show BOTH: the current ranking plus a second "within N days" list, no formula change.
  4. Annualise the ratio — **rejected direction historically**: you ruled that annualising re-ranks the
     list by time rather than by the money at stake, which is the opposite of what you asked for.

**2. The sector-grouping feature cannot fire for your actual portfolio.** Finnhub's `stock/profile2`
returns an EMPTY `finnhubIndustry` for every leveraged single-stock ETF you hold (ELIL, MULL, SOXL,
CWVX, NEBX, SNXX, WDCX, SPCH). That is a real provider answer, not a bug, and the rule that a sector is
never guessed from a ticker symbol means the grouped row stays silent. Options:
  1. Accept it — the broad-market row already covers these days, and the grouping will start working if
     you ever hold ordinary equities.
  2. Derive the ETF's sector from its *underlying* (e.g. WDCX → WDC) — needs a mapping the app does not
     have and would be a guess unless the mapping is provider-supplied. Not done.
  3. Add a provider that classifies ETFs — **a new paid provider/key, which the addendum forbids without
     your approval.**

**3. The CSP prefill's IV field takes the TICKER-level IV, not the ranked contract's.** Tapping WDCX
(contract IV 131 %) prefilled the form's `IV %` field with 138.5 %, the ticker-level figure the sync
autofill writes. The RANKING itself uses the exact-contract IV — that is what the row displays and it is
what the approved contract requires — but the prefilled form then prices Black-Scholes off a different
number. Options: (1) leave it (the form's IV is an editable input, not a claim about the contract);
(2) prefill the contract's own IV when the route carries one. Not changed.

**4. `IvService.fetchCcQuote` is called ~4× per ticker within milliseconds.** Observed on the device:
four identical `CC_QUOTE: RKLX: no expiration with DTE 21-35` lines inside 16 ms, and the same for MULL.
Pre-existing behaviour (concurrent reminder flows), not introduced by this round, and each call is now
cheap because the chain is cached — but it is four network requests where one would do. Worth a
de-duplication pass. Not changed.

**STILL OWNER-PENDING FROM THE PREVIOUS ROUND, UNCHANGED:** the `× 1.3` premium boost surviving in
`ReportGenerator`'s abnormal-move alert (three numbered alternatives already recorded above), and the
assigned Covered Put realizing its premium nowhere on the manual path (`ProfitCalculator.kt`, P&L-locked,
three numbered choices already recorded above). Neither was touched.

### 2026-09-10 S2.3 exact-head review round 2 — OWNER-PENDING and recorded-not-fixed

**5. The monthly-target card's month key is device-zone, and moving only half of it is worse.**
`FlexWithdrawals` and the stock-realized map are keyed on the BROKER's New York day, so
`DashboardScreen`'s month key "should" be New York — but `ReportGenerator.getDashboardSummary`
(`:168`, and `:432`, `:1187-1188`, `:1534`) still derives the options figure, the progress bar and the
monthly target from a device-zone `YearMonth.now()`. Migrating one half made the card show OCTOBER
options over SEPTEMBER stock and withdrawal for the first eleven hours of the 1st on a UTC+7 device —
one card, two months. The change was therefore REVERTED, and both halves stay device-zone and agree.
Options: (1) leave it (they agree; the boundary window is ~11 h once a month); (2) migrate every site
in `ReportGenerator` to New York together — correct, but it changes which month a trade counts in
around the boundary, i.e. owner-visible monthly numbers; (3) make the zone an app setting. Not done.

**6. `sharesUpdatedAt` is stamped and read in the DEVICE zone.** `ImportViewModel.kt:748/:790`,
`FlexSyncWorker.kt:267` and `ClosePositionScreen.kt:656` write a bare `LocalDateTime.now()`;
`ReportGenerator.kt:678-680` parses it back and `CcReminderEligibility.decide` compares it against
`assignmentSettleLocal(...)`, whose zone defaults to `systemDefault()`. Consistent today only because
both sides are device-zone — a zone change between stamp and read shifts the comparison and can hide a
real holding or show a ghost. The mechanism is new in this PR. Pinning it to epoch-millis or New York
means handling values already written to the database, so it is an owner decision, not a quiet fix.

**7. Smaller items recorded, not changed** (all verified, all cosmetic or out of this addendum's scope):
`fetchYahooPrices` sends the cookie but no crumb (`IvService.kt:1081`) — same `v7` family that started
refusing, outside the "five option paths" the addendum names; `updateTicker` clears the price on every
keystroke, so fixing a symbol typo wipes a hand-typed price for a snapshot-less ticker; the
`fetchCcQuote` 429/non-200 branches are log-only (they return null exactly as the blanket catch did);
`TickerDetailScreen.kt:196` renders money in a plain `Text` (mitigated — `formatCurrency` prefixes an
LRM); `ImportViewModel.kt:2699` still logs `first500` of a raw CSV; and the pre-existing
`first4=${key.take(4)}` diagnostics plus `API_KEYS: LOAD <provider>: present=<bool> len=<n>` disclose
key metadata without key material. None are touched by this PR's own changes.

**8. `ui.fmtPremium` formats with the DEFAULT locale** (`FormatUtils.kt:9-11`) — `"%.2f".format(v)` rather
than `String.format(Locale.US, …)`, which is the exact bug `SignedAmountInput.format` documents and
fixes. On a comma-decimal device the close-price prefill writes `"0,24"`; the new seed comparison
correctly reports "no edit", but the SAVE path's `toDoubleOrNull` returns null and the stored close
price is wiped while `ibkrRealizedPnl` is kept. `updateClosePrice` also does not sanitize, unlike
`updateCloseCommission`. Not reachable on the owner's dot-decimal locale, and pre-existing — recorded
rather than fixed inside this PR. Options: (1) pin `Locale.US` in `fmtPremium` (one line, but it is
shared by many screens); (2) sanitize in `updateClosePrice` as the commission field already does;
(3) both.

**9. `BrokerReconciliationStore.get` is still untested.** The guard it applies was extracted as the pure
`recordMatches` and IS tested, but reintroducing the strip at the CALL SITE would restore the original
"rejects every record" defect with the suite still green. There is no Robolectric on this classpath, so
covering `get` itself needs either that dependency or an interface seam over SharedPreferences.

### 2026-09-10 S2.3 exact-head review round 5 — RECORDED, NOT FIXED (OPT c1b9300)

Round 5 returned **APPROVE_WITH_COMMENTS**: no BLOCKER, no MAJOR, and — for the first time in the
series — no regression introduced by the fix round. Its own conclusion: *"none blocks the merge, and
none needs a new commit before merging."* Three MINORs and two NITs are therefore recorded here rather
than triggering another build / gate / review cycle on a `needs-owner` PR that merges nothing on its own.

**10. The BUY-direction "Roll" close method is incomplete in two ways.** With `ROLLED` now an edit-mode
status, a long option stored as ROLLED gets a selectable "Roll" radio — but (a) the entry is derived
from the LIVE `state.closeMethod`, so tapping another radio makes it vanish and it cannot be
re-selected without leaving the screen unsaved; and (b) the `CloseMethod.ROLLED` price field sits
inside `if (!isBuyPosition)`, so the BTC price the long-roll P&L is computed from stays invisible.
**Reachability, verified by the reviewer:** no current write path produces a BUY + ROLLED row —
`detectIbkrCloseMethod` returns only ASSIGNED / EXPIRED / null, and the manual "Roll" radio is
SELL-only — so this is defensive coverage for legacy rows. Still strictly better than before this PR,
where the same row had no selection at all and a mis-tap was equally destructive with nothing
recoverable. Fixes: key the entry off `seededCloseMethod` as well, and widen the price-field gate to
`!isBuyPosition || closeMethod == ROLLED`.

**11. The close-PRICE field has two parsers.** The predicate uses `SignedAmountInput.parse` (which
sanitizes `,` `+` letters and spaces away); the SAVE path and `recalculate()` use
`String.toDoubleOrNull()`. On a comma-decimal IME — where `KeyboardType.Decimal` shows a `,` key, the
exact quirk `sanitize` exists for — retyping `"0,24"` over a seeded `"0.24"` is correctly judged "no
edit", but the save then writes `null` and destroys the stored close price. The `null`-on-unparseable
save is PRE-EXISTING (identical at `7225b7af`); this is the first time a more permissive parser can
call such text unchanged. It cannot make the predicate miss a genuine amount change — `sanitize` only
deletes characters. Not reachable on the owner's dot-decimal device. Fix: one parser per field — use
`SignedAmountInput.parse` at both save sites and in `recalculate`, or sanitize in `updateClosePrice`
the way `updateCloseCommission` already does. Relates to item 8 (`fmtPremium`'s default locale), which
is the other half of the same comma-decimal hazard.

**NITs, recorded for completeness:** `CloseEditDetectionTest:71` asserts on `"+1.05"`, an input the real
field can never hold (`sanitize` drops `+`) — harmless in a pure-function test, and the `"0.240"` case
beside it carries the real coverage; and a code comment in `ClosePositionScreen` overstates the
pre-commit damage ("any save would silently rewrite the roll") when in fact only an explicit radio tap
could, because `loadPosition` already seeded `ROLLED` and the save's `when` mapped it back.

### 2026-09-12 — S2.4 backlog reconciliation (PR #19 OPEN needs-owner, NOT merged)

**DONE in S2.4**
- ONE canonical stock-sale grain rule (`StockRealizedGrain`), used by BOTH the per-ticker total and the
  per-sale feed, so the two surfaces can never again read different row sets. Plus the import audit
  that names every ticker-month the rule moves, and a cross-surface check that classifies any remaining
  total-vs-drill-down difference.
- Put candidates are DTE **2–60 inclusive**; the window is applied BEFORE the chain request budget is
  spent; `EXPIRY_TOO_FAR` and "no expiry in the window" are their own counters and their own sentences.
- CC reminder shows BID / ASK / MID, with the estimated premium and the recommended limit BOTH the mid,
  derived once, only from a real two-sided quote, and labelled "not a guaranteed fill".
- The watchlist is ONE list: one quote loader, one row, one persisted shared sort (default = today's
  move, largest declines first), and both surfaces carry the price into `פוזיציה חדשה`.
- Market-brief rows are one paragraph with one indentation; the LTR detail keeps its guarantee via an
  explicit isolate.
- The stock drill-down DATE is now the broker's New York day (was the device's — the reason this very
  round was commissioned against "the SPCH 2026-09-09 sale", which traded on 09-08).

**THE HEADLINE FINDING — the reported defect did not reproduce**
The SPCH 1,000-share sale is four EXECUTION fills totalling exactly **−$6,815.39**; total and
drill-down agree to the cent; the audit found **0 duplicate grains in the entire live payload**.
**−$2,412.39 is not in the data.** Nothing was changed toward it. If IBKR's own screen shows that
figure, the owner needs to send the exact view — it will be a different report, period or lot-matching
basis, and reconciling it is an OWNER input, not an agent guess.

**MEASURED, RECORDED, DELIBERATELY NOT FIXED (each is an existing owner decision)**
- **Buy-to-cover has no feed event (A5).** Now quantified: MULL 2026-07 +3,159.07, PLUG 2026-06
  −691.07, QQQ 2026-02 −4.30. The TOTAL is right; the drill-down is short by exactly the buy side.
- **The same-second `(timestamp, amount)` feed fingerprint collapses two real fills.** Previously
  theoretical ("9 ticker-months affected"); now PROVEN: BCAR 2026-01-13 12:33:36 has two fills both
  realizing 1.48 (at 10.29 and 10.30) and only one event exists — the diff is exactly 1.48. Also EWT
  2026-05, VNDA 2026-02, RXT 2026-02, MULL 2026-06. **Not changed because the fingerprint IS the
  identity of money-bearing feed rows: altering it without a migration would INSERT duplicates on the
  next import, which is worse than the under-count.** Options: (1) add qty+price to the fingerprint and
  migrate existing rows; (2) use `tradeID`/`ibExecID` (both in the payload, both currently discarded);
  (3) accept it — totals are unaffected, only the drill-down under-reports.
- **The rebuilt total is windowed.** `captureStockRealized` replaces the whole per-ticker map from the
  CURRENT Flex window, while feed events accumulate for ever, so a month the window no longer covers
  SHRINKS in the total (GPUS 2026-01: feed 76.34 vs total 36.66). Options: (1) accept; (2) merge per
  ticker-month instead of replacing; (3) a per-sale side store like `BrokerCashFlowStore`. Each changes
  what the monthly card shows for old months, so it is the owner's call.
- **11 ticker-months differ by exactly ±0.01** (per-row rounding vs sum rounding). Cosmetic.

**PRESERVED FUTURE (unchanged, nothing touched)**
- The `× 1.3` premium boost in `ReportGenerator`'s abnormal-move alert — still live and visible on the
  device this session (`→ CSP ~2.68` on SOXL). Three numbered alternatives already recorded.
- The assigned Covered Put realizing its premium nowhere on the manual path (`ProfitCalculator`, locked).
- Cleartext credentials in the daily external-storage backup; `allowBackup` with no extraction rules.
- The dashboard price-refresh fan-out (4× per launch); the three ambiguous split cycles; PR #18
  automation-core findings; DB/Hilt consolidation; the alert-banner reappear issue; unifying the four
  worker session windows; the per-ticker `changePct` day-baseline gap (index row only was fixed).
- The CSP prefill's IV field takes the ticker-level IV, not the ranked contract's.
- Settings renders the Flex token and every API key as plain on-screen text (pre-existing; observed
  again this session and deliberately not recorded anywhere).

**SUPERSEDED — owner approved**
- "No upper DTE cap" on the put ranking → DTE 2–60 inclusive.
- "A CC premium is a real BID or it is not shown" is NARROWED, not reversed: a real two-sided quote now
  yields a MID, which is what the card shows. A stale `lastPrice`, a lone side and a crossed book stay
  refused, and with no pair the card still shows the bid alone.

### 2026-09-12 — S2.4 review rounds: what the reviewers found, and what is now owner-pending

FOUR exact-head review passes by THREE reviewers. Codex was quota-blocked at the start (the sanctioned
Claude fallback was used) and **came back partway through**, so the final authority is Codex, not the
fallback — the first time in this PR series that has been true.

**Found and FIXED this round (all mine):**
- The orphaned price: unifying the watchlist row made the alerts surface pass `targetStrategy` into
  `prefillFromBestTrade`, whose `else -> return` bails for five of the picker's seven labels, skipping
  `updateTicker` while `prefillCurrentPrice` still ran. NVDA (`"מניות"`) opened an EMPTY ticker with a
  price in the field. Fixed at the root.
- The grain fallback could DELETE money: on the live `(ticker, day)` key, "suppress everything that is
  not the winning grain" removed a second, genuinely different order reported at a coarser grain.
- **Codex:** equal money is not the same movement — a SELL and a buy-to-cover both realizing `+$100`
  collapsed into one. Suppression now needs money AND signed quantity.
- **Codex:** the FEED could accumulate two grains of one order ACROSS imports (append-only, dedupes on
  `(timestamp, amount)`, no migration). The feed now takes EXECUTION/unlabelled rows only.
- **Codex:** exact-contract IV had a 100x discontinuity (`rawIv < 5.0` heuristic borrowed from
  `IvService`, wrong against Yahoo v7 where IV is always decimal). A decimal 5.0 showed as 5%.
- The stock drill-down DATE was the DEVICE's day, not the broker's.
- Plus: `keptRows` claimed a guard it did not implement; the audit asserted "only partly covered" from a
  comparison that cannot establish it; the empty-state spoke for every scanned ticker on one ticker's
  evidence; `summaryLines` had an alphabetical cap that would have dropped 54 of 114 ticker-months;
  the row's 0dp hazard moved from the delete button to the strategy chip.

**NEW owner-pending items surfaced by the reviews:**
1. **Get `ibOrderID` (or `orderID`) into the Flex query's field list.** It is the single change that
   would remove the `(ticker, day)` grouping ambiguity at the source, and with it the whole class of
   "is this tier a duplicate or a different movement?" reasoning. Nothing in the app can do this — it
   is a setting in the IBKR portal's Flex Query configuration. Highly recommended.
2. **`AlertsScreen` now runs an ungated per-entry quote fetch.** `rememberWatchlistQuotes` has no TTL,
   no NY-day stamp and no process-scope gate, so every entry into `התראות ומעקב` issues one batch quote
   plus one chart request per ticker missing from both snapshots. Measured at 4 fetches across the whole
   QA session (one per screen entry, not per recomposition), so it is not a storm — but it is new cost
   on a frequently-visited screen, and the `PutScanCache` ruling ("ViewModel-held gates die on every
   back-navigation") says the fix is a process-level gate keyed on the ticker set. Not done: it is a
   performance change to an accepted behaviour and wants its own round.
3. **A contract whose own IV exceeds 500 % now has NO usable IV** and is excluded as `NO_OWN_IV`, where
   before the fix it would have rendered as a wrong small number. That is the honest outcome, but it can
   remove a candidate that used to appear. Confirm the 1..500 band is where you want it.
