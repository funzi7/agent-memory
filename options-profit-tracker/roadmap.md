# OptionsProfitTracker — Roadmap

> History of completed work + forward plan. Update at end of each round.

עדכון אחרון: 2026-05-05

---

## Status (current)

- **DB Version:** 16
- **Repo:** funzi7/OptionsProfitTracker
- **Source on disk:** `/home/claude/OptionsProfitTracker/`
- **Latest packaged zip:** `/mnt/user-data/outputs/OptionsProfitTracker.zip`

**Active issues (see state.md for live tracking):** I1 spread leg-matching, I2 activity feed verify, I3 annual target screen, I4 Black-Scholes auto-fill confirm.

---

## Completed rounds

### P1 — Spread as single position
- `SpreadPosition` model with 2 legs
- Expandable dashboard card
- Flex import auto-detect spreads + trade aggregation

### P2 — Persistent IBKR sync
- `FlexSyncWorker` (WorkManager periodic)
- `AppPreferences` DataStore
- Auto-sync toggle (15/30/60/120 min)
- Manual sync button
- `OpenPosition` mark price extraction

### P3 — Close screens + CC reminder + Portfolio
- Long Put/Call close screen with STC + full P&L calc
- CC reminder banner for tickers with 100+ shares but no open CC
- Portfolio value auto-applied on sync

### P4 — Strategy UX + advanced strategies
- Strategy-unique colors + colored badges
- `Settings.save()` preserves imported portfolio data
- Iron Condor / Straddle / Strangle full preview calcs and spread entry UI
- `totalPremium` fixed for Straddle / Strangle

### Chain OCR
- `OptionChainParser` (text paste + ML Kit camera)
- Strike scoring (RoR / delta / bid-ask / OI / capital)
- `StrategicRiskAnalyzer` (offline rule-based, Hebrew, 0–100 score, IV crush detection, earnings awareness, annualized return)
- Optional Anthropic / Gemini API call hook (for future)

### Bug round P1
- XML dedup by 6 fields
- Closing detection exact `"C"` match
- Partial close support
- Available capital from `availableFunds`
- Import rewrite with NET position logic

### Bug round P2
- Chain OCR with IBKR mobile format
- PUT/CALL toggle
- CC IV risk surfacing
- "Assigned TO/FROM me" split
- Closed trades query fixed
- Full resync button

### Features round P3 (partial)
- ✅ CC separate display: premium received vs unrealized vs total P&L
- ✅ CC minimum premium calc per strike
- ⏳ Annual tax forms + tax calculations (deferred to R2)
- ⏳ Sync close-order (BTC limit) prices (deferred to R3)

### Large session 2026-04-28 — Major bug fixes
- **P&L matching IBKR exactly** ($4,532.72) — root cause: OWL assignment in `notes` XML attribute
- CC reminder share doubling (duplicate regex in `parseStockPositions()`)
- IV cache sanity checks (10%/300% bounds, auto-cleanup on startup)
- Portfolio value from `EquitySummaryByReportDateInBase` last element
- Exchange rates moved to `open.er-api.com`
- Pre-market alerts
- Dashboard restructure with activity feed
- DB v14 → v16

### Smaller items merged
- Theme: 29 hardcoded color replacements across 7 files (background agent)
- Login screen TODO comment placeholder
- Best trades (individual)
- Pre-market alerts
- Min Premium Calculator: 12% annual target in AddPosition
- AI Analysis: enriched with ticker history + strategic analysis

---

## Top priority — Active issues to close

### I1. Spread display leg-matching
3-pass SELL+BUY matching is implemented but breaks on certain Flex imports. Need real-import verification + targeted fix.

### I2. Activity feed "אין אירועים"
DB inserts added at 5 points (last commit). Need live verification — perform actions and confirm rows land in `EventEntity`.

### I3. Annual target screen
Missing: bars for previous months, year selector. Currently only shows current year/month.

### I4. Black-Scholes premium auto-fill
Implemented but unconfirmed by Dima. Needs walk-through of new-position flow.

---

## Master TODO — pending rounds (GPT handoff)

### R1 — Sync correctness
- Delete+Sync fix (imported vs manual data separation)
- Assigned TO/FROM me counting (verify after split fix in P2)
- Expired counting
- IBKR fee matching (2 decimals, open + close commission split)

### R2 — Tax + dividends
- 1042-S auto-parse (PDF)
- HTML dividends import
- Full sync of tax data

### R3 — Sync completion
- IV sync completion
- BTC limit order sync from IBKR open orders
- Auto-sync verification (FlexSyncWorker actually running on schedule)

### R4 — Strategy AI improvements
- Min premium calc per strategy (extend beyond CC to CSP / spreads)
- Focused AI analysis using ticker history + strategy context
- Multi-provider support (Anthropic / Gemini / OpenAI rotation or fallback)

### R5 — UX / drill-down
- Spread redesign (current expandable card → dedicated page)
- Drill-down per ticker (all positions, history, summary stats)
- "Best trades to repeat" list

---

## Future / not scheduled

### Maybe later
- Wear OS companion (premium expiry alerts on watch)
- Widget (today's P&L, open positions count)
- Tablet-optimized layout
- Multi-account support (currently single IBKR account)

### Explicitly out of scope
- iOS port
- Web companion
- Server-side anything
- Stock screener (stick to options + portfolio tracking)
- Real-time streaming quotes (polling only)
- Auto-trading / order placement (read-only by design)

---

## Notes

- Workflow rule: discuss before sending Claude Code prompts. Pack related work. Don't re-prompt completed items. (See `shared/workflow.md`.)
- Round labels (P1/P2/P3/P4 + R1-R5) are Dima's convention — preserve them.
- DB version migrations are sacred — never bump without a migration in the chain.
- All financial numbers display with exactly 2 decimal places.
