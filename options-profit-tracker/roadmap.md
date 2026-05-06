# OptionsProfitTracker — Roadmap

> History of completed work + forward plan. Update at end of each round.
> עדכון אחרון: 2026-05-05 (post commit `8a44bd4`)

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
- **Active branch:** `claude/analyze-project-structure-TC5ZG`

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

## Active issues — failed/incomplete from `8a44bd4`

Detailed in `state.md` "Active issues" section. Summary:

### Group A → FIX 4 (FIRST to run — biggest visual impact per Dima)
A1 strategy distribution sort, A2 source column click, A3 "ק+" shorten, A4 image cache, A5 Telegram URL normalize, A6 abnormal alerts empty

### Group B → FIX 3
B1 "בתהליך" duplicate, B2 yearly 24% twice, B3 minus left side LRM, B4 "נותר: $X" overlay, B5 monthly target $5086 vs $5116 unify

### Group C → FIX 2
C1 CSP cash net of premium, C2 CSP_CASH log empty, C3 INTC aggregation, C4 PROFITABLE_REPORT log empty

### Group D → FIX 1
D1 Massive 0 contracts (RAW JSON dump), D2 await prefetch in lookup, D3 initial vs current IV identical, D4 add `initial_implied_volatility` column in DB v31

### Other open (not in 4-FIX series)
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
