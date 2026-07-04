# cc-latest.md — OptionsProfitTracker handoff (latest)

> Rolling single-file handoff. Every future prompt OVERWRITES this file with a fresh, complete summary of the just-finished task and then prints its commit SHA. Read this first for the newest context, then `state.md` (full commit chain), `pending-tests.md` (device-test checklists), and `roadmap.md` (backlog + owner rules).

## Latest task: M1 — docs maintenance (2026-07-04, Claude Code)
Docs-only maintenance in `funzi7/agent-memory`. No app code, no build. Four edits in one commit:

1. **pending-tests.md** — appended a consolidated GM→R2 device-test checklist with real per-owner statuses. Per the owner rule, it contains NO regression tests. Buckets:
   - CONFIRMED WORKING: GM2 sort persistence; R2 drill-down navigation (inner sale row → actual open/closed position; short-only ticker → short page).
   - FAILED on the owner's current build (retest ONLY after `git pull` latest main + full `adb install -r`): R1a (Covered Put row assignment-probability readout in "פוזיציות פתוחות"), R1b (numbers in-place inside Hebrew feed titles), GP1 (dismissed banner still returns on dashboard re-entry).
   - PENDING (not yet testable / not yet run): GN1 multi-banner, GN2 current-month default, GO BootReceiver post-reboot refresh, GP2 CoveredPutDetail probability card, R2-restore (back restores expanded ticker + scroll), Covered Put core (MULL fixture to the cent: premium 1,820.00 / effective cover 23.60 / upside BE 29.9912 / max profit 6,488.56).

2. **roadmap.md** — added an "Owner rules + verified gaps (M1)" section:
   - GLOBAL RULE: back navigation must restore the exact previous spot (screen state + scroll) everywhere.
   - GLOBAL RULE: no large flickers / involuntary jumps; banner ✕ must be smooth; monthly-target card must NOT refill/re-animate on banner dismiss (small live-value refreshes like unrealized-P&L are fine).
   - VERIFIED FEATURE GAP: short-close (buy-to-cover) is invisible — `importStockSoldEvents` skips `buySell != "SELL"` (~`ImportViewModel:1303`) and there is no stock-BUY `EventType`, so a short's closing BUY (which carries IBKR `fifoPnlRealized`) never becomes a feed event nor enters stock-realized totals. Design pending owner approval.
   - DIAGNOSIS NEEDED: banner reappears on every dashboard entry after ✕ despite GP1's cache-vs-dismissedSig check; suspect the worker rewrites the cache string between entries. Needs a read/log diagnostic before any fix.

3. **state.md** — one dated bullet recording this M1 maintenance.

4. **cc-latest.md** — this file (first publish).

## Current open items (owner-facing)
- **R1a / R1b retest after rebuild** — reported failing on the owner's device; both are believed fixed in main but need latest-main + full APK install to confirm.
- **GP1 banner-reappear diagnosis** — still returns on every dashboard entry; add a read/log diagnostic to see whether the worker cache string changes between entries before attempting a fix.
- **R2-restore clarification** — confirm with owner the exact remaining symptom (expanded ticker + scroll spot should already restore via `rememberSaveable` expandedTicker + saveable `LazyListState` shipped in R2 / OPT `018d9ef`).
- **Buy-to-cover feature** — surface closing STK BUY trades as a feed event and include their `fifoPnlRealized` in stock-realized totals. Design pending owner approval (touches import path; not P&L-locked math but adjacent — get sign-off).
- **Two new global rules** — back-restores-exact-spot, and no-large-flickers/smooth-banner-✕-without-monthly-target-refill — apply to all future UI work.

## Latest OPT app commit referenced
- R2 shipped at OPT `018d9ef` (StockRealized drill-down position-aware nav + rememberSaveable expand/scroll restore).

## Pointers
- `options-profit-tracker/state.md` — full dated commit chain / current state.
- `options-profit-tracker/pending-tests.md` — device-test checklists (this M1 section is newest).
- `options-profit-tracker/roadmap.md` — backlog + owner global rules + verified gaps.
- `options-profit-tracker/gotchas.md` — hard-won lessons (read before touching IV / RTL / P&L / migrations).
