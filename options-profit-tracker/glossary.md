# OptionsProfitTracker — Glossary

> Terms and concepts specific to this project. Reference for agents that don't have full context.

## Core domain

**Position** — A single options or stock holding. Has `ticker`, `strategy`, `status` (Open/Closed/Assigned/Expired), `contracts`, `strikePrice`, `expiry`, `premiumReceived`, `currentMarkPrice`. The unit of tracking.

**Trade** — A single execution event (buy or sell). Multiple Trades can compose one Position. Stored separately for audit + dedup against IBKR Flex re-imports.

**SpreadPosition** — A composite Position with 2+ legs (vertical spread, Iron Condor, Straddle, Strangle). Each leg is itself a Trade. Net premium = sum of leg premiums (signed).

**Stock** — A simple share holding. Tracked separately from Position because the CC reminder logic queries shares-by-ticker without strategy filter.

**Strategy** — Enum of position types:
- `COVERED_CALL` (CC) — sell call against owned shares
- `CASH_SECURED_PUT` (CSP) — sell put with cash to back assignment
- `LONG_CALL` — buy call (directional bullish)
- `LONG_PUT` — buy put (directional bearish or hedge)
- `SPREAD` — vertical credit/debit spread, 2 legs
- `IRON_CONDOR` — 4 legs, defined risk, profits in range
- `STRADDLE` — same strike, both call and put
- `STRANGLE` — different strikes, both call and put
- `WHEEL` — composite: CSP → assignment → CC, repeating

**Wheel strategy** — The cycle of selling cash-secured puts on a stock, getting assigned, then selling covered calls until called away, then repeating. Dima's primary income strategy. Tracked as linked Positions.

**Assignment** — When an option holder exercises their right and the seller must deliver:
- `TO me` — Got the shares (CSP got exercised against me; I now own 100 shares per contract)
- `FROM me` — Lost the shares (CC got exercised against me; my 100 shares are gone, I keep premium + difference)

**Expired** — Option reached expiry date out-of-the-money. Premium kept, no shares change hands. Best outcome for short-option strategies.

## Trade actions

- **STO** = Sell To Open (open a short option position — collect premium)
- **BTO** = Buy To Open (open a long option position — pay premium)
- **STC** = Sell To Close (close a long option position)
- **BTC** = Buy To Close (close a short option position — pay back premium ± P&L)

For Dima's primary strategies (CC, CSP, Wheel), entries are STO, exits are either BTC or assignment/expiry.

## Pricing terms

**Premium** — The price paid for an options contract. In the app: stored per-contract in dollars (e.g., $1.50), but P&L displayed multiplied by 100 × contracts.

**Mark price** — IBKR's mid-quote estimate for current value. Used for unrealized P&L. Comes from `OpenPosition.markPrice` in Flex XML.

**Strike** / **strikePrice** — The price at which the option can be exercised.

**Expiry** — The date the option contract ends. After this date the option is worth either zero or its intrinsic value (assignment).

**DTE** = Days To Expiry. Common metric for selecting CC/CSP — typically 30–45 DTE for monthly income strategies.

**IV** = Implied Volatility. The market's expected annualized volatility implied by the current option price. Higher IV = richer premium = more income, more risk. Cached per `(ticker, expiry)`. Sanity bounds: 10% min, 300% max.

**IV crush** — Sudden IV drop after a known event (earnings, FDA decision). Selling premium before the event captures this; buying premium beforehand exposes to it.

**Black-Scholes** — Theoretical option pricing model. Used as auto-fill fallback for premium when no live quote available (e.g., manual entry of a position from a screenshot).

## P&L terminology

**Premium received** — Locked-in income from STO. Doesn't change after the open trade.

**Unrealized P&L** — Current paper P&L on an open position based on mark price. Changes minute to minute.

**Realized P&L** — Final P&L after the position is closed/expired/assigned.

**Total P&L (CC-specific)** — For a Covered Call, the combination of:
1. Premium received (option side)
2. ± Unrealized option P&L (option side, if not yet closed)
3. ± Share appreciation (stock side, since shares are part of the position)

These are displayed separately — never collapsed into one number.

**Annualized return** — Premium / capital × (365 / DTE). Used to compare positions across different expiries. Dima's target: 12% annual.

## IBKR-specific terms

**Flex Query** — IBKR's data export feature. Configured in Account Management; returns XML of trades, positions, balances, etc. The app's source of truth for imported data. Auth via Flex token + query ID.

**Flex token** — Long-lived auth string, stored in DataStore. Has expiry — renew annually.

**Query ID** — Identifies which configured Flex Query to fetch. Stored next to token.

**`fullResync()`** — Wipes imported data (preserves manual entries) and re-imports from scratch. Use when sync state is suspicious. Triggered by "Resync" button.

**`syncFromIbkr()`** — Incremental sync. Adds new trades, dedups against existing. Triggered by "Sync now" button and `FlexSyncWorker`.

**OWL** — IBKR's marker for "option exercised/assigned" events. Lives in the trade's `notes` XML attribute, NOT `code`. (Critical gotcha — see `gotchas.md`.)

**`availableFunds`** — IBKR's actual buying power (different from `cashBalance`). The number to use for "available capital" display.

**`EquitySummaryByReportDateInBase`** — XML element with daily portfolio values. Array ordered chronologically. Use `.last()` for current value.

## Tax terms (US for Israeli tax resident)

**1042-S** — IRS form summarizing US-source income paid to non-resident aliens (covering withholding tax). Used for Israeli tax filing. Auto-parse planned for R2.

**Form 1325** — Israeli tax form for foreign income reporting. Generation planned post-R2.

**ROC** = Return Of Capital. Some distributions from US funds are classified as ROC, which adjusts cost basis instead of being taxable income. Affects DivTracker (separate app), not OPT directly.

**PIL** = Payment In Lieu (of dividends). Different US withholding rate applies (30% vs 25%). Relevant for DivTracker, mentioned here only because OPT may eventually share dividend logic.

## App-specific terms

**Activity feed** — Chronological list of recent events (sync ran, position closed, premium collected, alert fired). DB-backed via `EventEntity`. Hebrew strings.

**CC reminder banner** — Banner that appears when a ticker has 100+ shares with no open CC. Suggests: "You have 200 AAPL shares — consider selling 2 calls."

**Min premium calculator** — Given a ticker, strike, DTE, and capital, computes the minimum premium needed to hit Dima's annual target (currently 12%). Surfaces in AddPosition flow.

**StrategicRiskAnalyzer** — Offline rule-based scorer (0–100) that evaluates a proposed trade. Considers IV percentile, days to earnings, annualized return, IV crush risk. Outputs Hebrew explanation.

## UI strings (Hebrew, common)

- "אין אירועים" — No events (empty state for activity feed)
- "סנכרן עכשיו" — Sync now
- "סנכרון אוטומטי" — Auto-sync
- "סינכרון מלא" — Full resync
- "פוזיציות פתוחות" — Open positions
- "פרמיה שהתקבלה" — Premium received
- "רווח/הפסד" — P&L
- "תאריך פקיעה" — Expiry date
- "מחיר מימוש" — Strike price
- "תוקצב" — Allocated (capital)

## Codex bot

GitHub-integrated AI reviewer. Comments on PRs automatically. Different from Claude (this assistant). To request a fix from it inline: comment `@codex address that feedback` on the PR. Plan: integrate into OPT workflow once GitHub Actions added.

## Related apps (separate repos)

- **HydroMe** (`funzi7/HydroMe`) — water reminder app, R1 spec done
- **RatesNow** (`funzi7/RatesNow`) — currency converter, Round 5 done
- **FundMe** (`claude/fundme-phase-1-setup-594lP`) — React Native, multi-platform finance
- **DivTracker Pro** — Israeli tax dividend tracker, Android Kotlin

These are mentioned only for context. Don't pull patterns across apps unless explicitly asked.
