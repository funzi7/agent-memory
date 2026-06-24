# paper-trader — cc-latest

_Date: 2026-06-24 · paper-trader PR: funzi7/paper-trader#3 · dashboard: agent-memory main_

## Small-account "always buy what you can" + natural Hebrew + dashboard bidi/persistence

### PART A — paper-trader (PR #3, branch `claude/screener-paper-trader-bridge-jm1s4d`)
New `sizing.small_account_fill: {enabled: true, mode: rank_preferred_greedy}`
(reversible). A small account never sits fully in cash when a selected name fits.
Pure `portfolio.plan_buys`, shared by `engine._execute_orders` AND
`report._pending_lines` (preview == fill):
1. drop names priced above **total** cash → "לא ניתנת לרכישה";
2. equal-weight the rest (slice = cash/count, whole shares);
3. if that buys **zero**, drop the **most expensive** eligible name (tie → worst
   momentum rank) and recompute until ≥1 whole share fits — guarantees participation
   (e.g. $100, AMDL $67 + USD $97 + names >$100 → buys **1 AMDL**, ~$33 cash left);
4. **top up** leftover cash onto the **highest-ranked** kept names.
Rank is parsed from the order reason (`rank N` / `#k`). Fee math, T→T+1 and
signal/ranking are **unchanged**.

**$10k accounts are BYTE-IDENTICAL.** Steps 3–4 only engage on the zero-buy path
(which a $10k account never hits), eligibility never drops a name (no share costs
> $10k), and the flag is absent from every regression fixture (they run the
untouched legacy path). A dedicated self-test also asserts $10k fills are identical
with the flag **on vs off**. `test_regression` + `test_scan_regression` stay green.

### PART B — natural Hebrew
Removed the awkward **"לא תיקנה"** everywhere. Previews:
`לא ניתנת לרכישה (מחיר יחידה $X גבוה מהמזומן הזמין $Y)` for names above cash,
`לא נקנתה הפעם (הקצאה שוות-משקל קטנה מהמחיר)` for eligible-but-dropped; engine
run-notes: `{tk} לא נקנתה — …`.

### PART C — agent-memory dashboard + detail page (committed to main)
- **BIDI:** `w()` now wraps Latin/number/ticker/price runs in ISOLATES
  (U+2066…U+2069) instead of LRM marks (the scrambling cause); pending buy lines
  wrap the whole qty/ticker/price/cost run in one isolate.
- **Target persistence:** per-strategy target value + %/$ mode persist in
  `localStorage` (load on open, save on edit) with an "↺ אפס יעדים" reset; the
  "resets on reload" limitation is gone.
- **Allocation mirror:** the client `affordability()` mirrors `plan_buys`, so the
  dashboard preview matches what the engine will buy. Kept dual %/$ + disclaimer,
  detail pages (both sizes), benchmark-on-top, cash-change, "עודף מול SPY". SW v3.

### Verification (offline)
- `tests/selftest.py` → **399 green** (+19: plan_buys zero-buy guard / AMDL example
  / rank tie-break / top-up, engine $10k byte-identical, $100 participates).
- `main.py --dry-run --synthetic`: $100 leveraged_momentum buys **1 TQQQ**, $100
  screener_track buys **1 CELH** (best affordable subset, others "לא נקנתה הפעם");
  **$10k buys all**; no "לא תיקנה"; writes nothing; no secrets.
- Dashboard: 19/19 headless checks (plan_buys mirror, localStorage persist+reset,
  single-isolate pending lines, both pages render).

Dashboard: https://funzi7.github.io/agent-memory/paper-trader/dashboard.html ·
detail: …/strategy.html?id={strategy}
