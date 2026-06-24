# paper-trader — cc-latest

_Date: 2026-06-24 · Branch: `claude/screener-paper-trader-bridge-jm1s4d` · PR: funzi7/paper-trader#2_

## What changed (display + cash-tracking only — fills byte-identical)
Clarity/correctness fixes around whole-share affordability, pending-order display,
and cash tracking. **Fee math, T→T+1, signal/ranking and the actual fills are
UNCHANGED** — the engine already buys the affordable whole-share subset (option A)
and skips the rest; this surfaces it honestly and adds cash-movement visibility.

- **Affordability-aware pending preview** (`report._pending_lines`): every pending
  BUY is pre-priced per account size. Affordable → `⏳ מחר — קנייה {N} {tk} @ ~${px}
  (≈${cost}) — {reason}` (planned whole-share qty + approx price + approx cost +
  short reason). Unaffordable (unit price > the account's equal cash slice) → marked
  up front as `⏳ {tk} — מחיר יחידה (...) גבוה מההקצאה (...), לא תיקנה`, NOT listed as
  a buy. Applies to screener_track / momentum_scan / leveraged_momentum / guru_track,
  both $100 and $10k. Preview qty uses the SAME slice the engine fills.
- **Idle footer** retitled `💤 אסטרטגיות שיושבות במלואן במזומן (אין פוזיציות)` with an
  explicit `מזומן $X` per size — a non-duplicative roll-up (the number is the
  strategy's cash = full account value, not a separate budget).
- **Cash movement**: `Portfolio.cash_history` (`[date, cash]`, appended each run like
  equity_history) + `cash_change_today` / `cash_change_since_inception`. Per-account
  line now shows `מזומן $X (יומי ±$Y, מאז התחלה ±$Z)`.

## New portfolios.json fields (for the dashboard)
Each portfolio now also carries **`cash_history`**, **`cash_change_today`**, and
**`cash_change_since_inception`**.

## Files (paper-trader)
`papertrader/report.py` (pending preview + signed_money + footer + cash line),
`papertrader/portfolio.py` (cash_history field + cash-change methods + to_dict),
`papertrader/engine.py` (append cash_history each run), `tests/selftest.py`
(+19 checks), `handoffs/CONTEXT.md`.

## Verification (offline)
- `pip install` ✓ · `tests/selftest.py` → **380 checks green** (regression fills
  byte-identical; new coverage for affordable-subset buys, up-front skips on $100,
  all-bought on $10k, fractional path, qty+reason, cash-change math + engine
  cash_history, retitled footer).
- `python main.py --dry-run --synthetic` shows unaffordable skips, qty+reason buys,
  the cash-change line, and the retitled non-duplicative footer; writes nothing; no
  secrets.

## ⏭️ Dashboard follow-up (this repo)
`paper-trader/dashboard.html` should consume the new JSON fields next: render
pending orders with planned qty + cost + reason and "לא תיקנה (מחיר > הקצאה)" for
unaffordable names, and show per-portfolio cash with daily + since-inception change.
The paper-trader JSON fields land first (PR #2); the dashboard edit is a separate
prompt.
