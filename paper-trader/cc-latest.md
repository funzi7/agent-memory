# paper-trader — cc-latest

_Date: 2026-06-24 · Branch: `claude/screener-paper-trader-bridge-jm1s4d` · paper-trader commit `637958c`_

## What changed
Added a new strategy **`leveraged_momentum`** — a momentum scanner over a 2x/3x
leveraged-ETF universe with **volatility-derived exits**. It reuses
`momentum_scan`'s monthly 6-1 ranking / buffer / regime / min_hold / refill
machinery (it subclasses `MomentumScan` and imports the shared `momentum_6_1` —
no duplicated math). Only the universe and the EXITS differ; `momentum_scan`, the
engine, the IBKR-style fee math and the T→T+1 no-look-ahead fills are **untouched**
(the new exit paths live entirely inside `decide()`, and the engine's fixed
`trail_pct` path is gated on a key this strategy does not set).

### New exit paths (used ONLY by leveraged_momentum)
- **Adaptive trailing stop** — `trail = clamp(vol_multiple·daily_vol·√vol_window,
  trail_floor 0.15, trail_cap 0.50)`, where `daily_vol` is the stdev of the
  ticker's OWN daily returns over `vol_window` (20). Partial-history names get a
  tighter trail (× `trail_factor` 0.7, re-clamped to the floor).
- **Hard crash-stop (volatility-relative)** — 1-day return ≤
  `-max(crash_floor_pct 0.20, crash_vol_multiple 3.0·daily_vol)` ⇒ sell at the
  NEXT open. Fires before the adaptive trail. (Once-a-day-on-close system → every
  stop is a next-open order, never intraday.)
- **Partial-history ranking** — ≥147 bars → standard 6-1; ≥`short_history_bars`
  63 (but <147) → SHORT-window momentum (63/5), flagged partial, tighter trail;
  <63 → excluded. Crossing 147 bars returns it to normal ranking/trail.

**Exit precedence** (first met sells next open): crash-stop → regime-off
liquidation → personal-momentum negative → adaptive trail → monthly buffer-drop
(only the buffer-drop is `min_hold_days`-gated).

## Files
- NEW `papertrader/leveraged_universe.py` — `LEVERAGED_ETFS` (25 names: broad,
  single-stock, sector, country, gold-miner leverage; owner's choice).
- NEW `papertrader/strategies/leveraged_momentum.py` — `LeveragedMomentum`.
- `config.yaml` — `leveraged_momentum` block (enabled); `momentum_scan` keeps its
  fixed `trail_pct: 0.20`.
- `papertrader/strategies/__init__.py` — registered.
- `main.py` — SOFT set + `lev_info`/`lev_regime` wiring into the report.
- `papertrader/report.py` — leveraged holding line (rank, partial flag,
  short/full momentum, current effective trail %), regime line, weekly turnover.
- `README.md` + `handoffs/CONTEXT.md` — leveraged section + paper-only risk note
  (2x–3x leverage, volatility decay, next-open stops, expect large drawdowns).
- `tests/selftest.py` — +60 checks (361 total green).

## Two new portfolios
`leveraged_momentum_100` / `leveraged_momentum_10k` — fresh $100 / $10,000,
registered + enabled. Now **8 strategies × 2 sizes = 16 portfolios**.

## Verification (offline, no network)
- `pip install -r requirements.txt` ✓
- `python tests/selftest.py` → **All 361 checks passed** (registration,
  partial-history, adaptive-trail math, crash-stop, exit precedence, ranking
  parity with momentum_scan, report rendering, config block, engine integration;
  existing strategies remain byte-identical).
- `python main.py --dry-run --synthetic` → renders the leveraged_momentum block
  (regime line + monthly entries), writes nothing, exits 0, no secrets.

> ⚠️ Paper ONLY. Leveraged ETFs target 2x–3x daily moves and suffer volatility
> decay; the basket deliberately includes single-stock / sector / country /
> gold-miner leverage. Every stop fills at the next open (no intraday). This
> exists to MEASURE the behavior, not as a recommendation — no real money.
