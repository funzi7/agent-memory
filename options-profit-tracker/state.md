# OptionsProfitTracker — State

> Living document. Update at the end of every working session.
> Last updated: 2026-05-05

## Current focus

ייצוב באגים אחרי סבב גדול של תיקונים (28 באפריל). שלוש פיצ'רים פתוחים שלא נסגרו: spread leg-matching, activity feed, annual target screen. במקביל — בנייה של תשתית אייג'נטים אוטומטית (תהליך מקביל ב-`agent-memory`).

## Active issues

| # | Issue | Status | Notes |
|---|---|---|---|
| I1 | Spread display leg-matching | 🔴 broken after multiple fix attempts | Currently using 3-pass SELL+BUY matching. Verify against real spread imports. |
| I2 | Activity feed showing "אין אירועים" | 🟡 fix committed, unverified | DB inserts added at 5 points — needs live test. |
| I3 | Annual target screen | 🟡 partial | Needs bars for previous months + year selector. |
| I4 | Black-Scholes premium auto-fill | 🟡 implemented, unconfirmed | Pending Dima's manual verification. |

## Recently completed (last session, 2026-04-28)

- **P&L now matches IBKR exactly** ($4,532.72) — root cause: OWL assignment code in `notes` XML attribute, not `code`
- **CC reminder share doubling fixed** — duplicate regex in `parseStockPositions()` removed
- **IV cache sanity checks** — min 10% / max 300%, auto-cleanup on startup
- **Portfolio value** now uses last element of `EquitySummaryByReportDateInBase` (most recent date)
- **Exchange rates** moved to `open.er-api.com`
- **Pre-market alerts** added
- **Dashboard restructured** with activity feed
- DB version progressed 14→16

## Round history (per Dima's instruction labels)

| Round | Status | Summary |
|---|---|---|
| P1 | ✅ Done | Spread as single position with 2 legs, Flex import auto-detect, trade aggregation |
| P2 | ✅ Done | Persistent IBKR sync (FlexSyncWorker, WorkManager periodic), AppPreferences DataStore, auto-sync toggle 15/30/60/120min |
| P3 | ✅ Done | Long Put/Call close screen + STC + full P&L; CC reminder banner; portfolio auto-applied on sync |
| P4 | ✅ Done | Strategy-unique colors, badges, IC/Straddle/Strangle previews, totalPremium fix |
| Chain OCR | ✅ Done | OptionChainParser (paste + ML Kit camera), StrategicRiskAnalyzer (offline rule-based, Hebrew, 0–100 score) |
| Bug P1 | ✅ Done | XML dedup by 6 fields, closing detection exact "C", partial close support, available capital from `availableFunds`, NET position logic |
| Bug P2 | ✅ Done | Chain OCR with IBKR mobile + PUT/CALL toggle, CC IV risk, Assigned TO/FROM split, closed trades query, full resync button |
| Features P3 | 🟡 Partial | CC premium/unrealized/total separation ✅, CC min premium per strike ✅. Tax forms + BTC limit sync ⏳ |

## Master TODO (GPT handoff roadmap — pending rounds)

| Round | Scope | Status |
|---|---|---|
| R1 | Delete+Sync fix (imported vs manual data separation), assigned counting, expired counting, IBKR fee matching (2 decimals, open+close commission split) | ⏳ |
| R2 | 1042-S auto-parse, HTML dividends import, full sync | ⏳ |
| R3 | IV/BTC sync completion, auto-sync verification | ⏳ |
| R4 | Min premium calc per strategy, focused AI analysis, more AI providers | ⏳ |
| R5 | Spread redesign, drill-down pages, "best trades to repeat" list | ⏳ |

## Open questions / next decisions

- Confirm spread leg-matching works on real Flex import (I1)
- Live-verify activity feed events fire at all 5 insert points (I2)
- Decide order: ייצוב באגים פתוחים → R1 / לדלג ל-R1?
- בנייה של אייג'נטים — בעבודה במקביל (תוצאה ב-`agent-memory/options-profit-tracker/`)

## Known active blockers

None blocking. I1 + I2 + I3 are tracked but not blocking new work.

## Repo

- GitHub: `funzi7/OptionsProfitTracker`
- Default branch: `main` (verify)
- Branch naming: `claude/batch{N}-{description}`
- Source on disk: `/home/claude/OptionsProfitTracker/`
- Latest zip: `/mnt/user-data/outputs/OptionsProfitTracker.zip`
- Transcript catalog: `/mnt/transcripts/journal.txt`
