# OptionsProfitTracker — State

> Living document. Update at the end of every working session.
> Last updated: 2026-05-05 (post commit `8a44bd4`)

## Current focus

ייצוב באגים פעילים שלא נסגרו ב-commit `8a44bd4`. יש פטרן של "הצהרת done שלא תפסה בקוד" — לכן כל FIX מכאן ואילך כולל verification בלוג שחייב להופיע לפני סגירה.

הבא בתור: סדרה של 4 פרומפטים (A/B/C/D) שמבוססים על הסיכום מ-2026-05-05 — סדר ההרצה: A (FIX 4 image+sort) → B (FIX 3 dashboard) → C (FIX 2 CSP+INTC) → D (FIX 1 IV).

## Repo + state

- **Repo:** funzi7/OptionsProfitTracker
- **DB version:** 30 (planned bump to 31 in FIX 1/F for `initial_implied_volatility` column)
- **Branch (current work):** `main`
- **Last commit:** `be9a23e` (Group H prime — monthly bar reverted + PercentPill, BS fill cache-IV fallback, stale price baseline)
- **Recent commits:** `8a44bd4` → `9ddca1c` (Group A) → `f1c3e9a` (Group B) → `16fd852` (Group C) → `fdc1cf1` (Group D prime) → `7df9465` (Group E prime) → `589b44e` (Group F prime) → `646a1e0` (Group G prime) → `be9a23e` (Group H prime)

## Active issues

### Group A (FIX 4) - COMPLETE
A1 strategy sort, A2/A3 source column click+shorten, A4/A5 image cache+URL normalize: all verified. A6 abnormal alerts: partial - only one ticker shows when multiple should (still open, see N-items).

### Group B (FIX 3) - COMPLETE
B1 duplicate removed, B2 yearly 24 percent removed, B4 remaining overlay, B5 monthly target unified 5066: all verified. B3 skipped (minus already correct).

### Group C (FIX 2) - COMPLETE
C2 INTC aggregation verified (2026-only correct), C3 settings target reload verified, C4 post paragraphs verified. C1 CSP cash: superseded by E prime and F-area work.

### Group D prime - COMPLETE
D1 social regression fixed (section restored), D3 reports all-years toggle verified, D4 per-bar remaining done. D2 CSP text: superseded by E prime.

### Group E prime - COMPLETE
E1 CSP card: found root cause - premium is per-share not per-contract. ASTS net = (150 - 9.31) x 100 x 1 = 14069 not 14991. Number now correct. Card restructured RTL with 3 rows (exit cash, available now, after assignment).
E2 monthly bar: realized/target/remaining on each bar, total row RTL.
E3 phantom IREN: added AlertSource enum + badges (bait/watchlist/draft/other). Root cause NOT fixed - just labeled. Superseded by F4.
E4 feed dedup: edit-then-close now updates same row instead of stacking.

### Group F prime - COMPLETE (commit 589b44e)
F1 assignment prob: added DELTA_DEBUG log, made BlackScholesCalculator unit-tolerant (accepts IV as percent or decimal via <5.0 heuristic). Awaiting device verification of EWY showing ~95 percent.
F2 remove IV autofill: stripped all 8 lookupIvForExpiry call sites, removed init cachedIv overwrite. IV now manual-only, user-typed value survives field changes.
F3 feed color: POSITION_EDITED moved to blue (PremiumReceivedColor) branch.
F4 phantom prune: added isFullSync param, prune runs only on fullResync, removes snapshot tickers absent from Flex with no open position and no manual override.

### Group G prime - COMPLETE (commit 646a1e0)
G1 assignment prob IV-free fallback: added assignmentProbability field, BS-delta when IV present else logistic moneyness fallback, hides row when null/zero (no more "very low 0 percent"). Awaiting device verify of RIOT/PLUG now showing probability.
G2 stale prices off-hours: triggerPriceRefresh now writes fetched Yahoo prices back to currentStockPrice (the field ReportGenerator reads), not just the snapshot. Awaiting device verify.
G3 monthly progress percent restored as single LTR row.
G4 required-collateral label now PUT-only (CC no longer shows it).

### Group H prime - COMPLETE (commit be9a23e)
H1 monthly bar reverted: removed the G3 row addition below the bar. Replaced with a PercentPill above the bar matching the AnnualTargetCard pattern (single source of truth). Negative percent clamped to 0 for the pill so a net-loss month doesn't render as nonsense. Added MONTHLY_PCT log to diagnose any sign issue from `realizedForProgress / monthlyTarget`.
H2 BS fill cache-IV fallback: `fillPremiumFromBS` now reads `ivCacheDao.getLatestIvForTicker(ticker)` when the IV field is empty, sets it into state, and re-runs `recalculate()`. If still no BS price, surface a Hebrew autoFillStatus message ("הזן IV..." or "לא ניתן לחשב...") instead of silently writing 0.00. Added BS_FILL log inside `BlackScholesCalculator.calculate` to confirm inputs.
H3 stale price baseline: removed the `else if (oldCurrent != null && oldCurrent != yahooCurrent) obj.put("previous", oldCurrent)` fallback from BOTH price-refresh paths in DashboardViewModel. The fallback was mutating "previous" forward over refreshes, inflating daily change (ASTS real +6% → app +13%). Also flipped abnormal-alert base order to `previous ?: dailyOpen` (was `dailyOpen ?: previous`) — dailyOpen is captured opportunistically and drifts.

## New active issues from device test 2026-05-13 (N-items)

| # | Issue | Status |
|---|---|---|
| N4 | Off-market-hours: all data wrong (CC reminder, abnormal alerts, per-ticker numbers/percent) - stock prices do not update outside market hours | fixed in H prime (G prime wrote current; H prime fixes previous-close baseline + abnormal-alert base order), awaiting device verify |
| N5 | Monthly target dashboard: total progress percent disappeared | fixed in H prime (G prime restored but redesigned bar; H prime reverts to original bar + adds PercentPill matching annual style) |
| N6 | Assignment probability inverted (EWY deep ITM showed 28 percent) | fixed across F/G prime, awaiting final verify |
| N7 | "betachonot"/"maniot" in open-position card need right-align (word right, number left) | open |
| N8 | Phantom tickers MULL/MU persist | fixed in F prime, awaiting device verify |
| N9 | "bitachon nidrash" appears on CALL position - should be PUT only | fixed in G prime |
| N10 | IV 99 percent wrong, reverts to old value on field change | fixed in F prime (removed), awaiting device verify |
| N11 | Edit-open-position shows "sale opportunity" texts that should not appear | open |
| N12 | Feed: updated position shows green instead of blue | fixed in F prime, awaiting device verify |
| N13 | Social dashboard shows old posts, not newest from all channels | open |
| N14 | System notifications "X fired/created", main activity - remove entirely | open |
| N15 | Alerts: show all highest IVs by current portfolio tickers + dates | open (feature) |

## ✅ Confirmed working as of `8a44bd4`

This list is the source of truth — don't re-prompt items from here.

- Backup/Restore v4 (JSON, schema v4, autoFillCache + manualPnlAdjustment)
- Expected-profit calculator + calendar (state-aware: PLUG CC -$3367, SOFI -$3517, RIOT -$693, OWL -$17, IBRX +$254)
- Global left arrows (Unicode `←`, not Material Icons)
- Edit-position UX: tags removed, keyboard stays open during typing, premium recommendation
- DRAFT does not create activity-feed rows
- Portfolio sort persists across recompose (ViewModel + DataStore) + total shows full number
- Massive.com IV provider wired (Marketdata primary, Massive fallback) — but Massive fallback returns empty (Group D)
- Monthly realized — manual + IBKR combined
- Edit closed position (pre-fill + warning + "עדכן סגירה" button)
- Black-Scholes "מלא" works; premium NOT updated for CSP DRAFT (frozen), other strategies auto-update
- Save-as-draft → drafts list
- DB v30 + `initial_premium` column + migration with backfill (NOTE: `initial_iv` column does NOT yet exist — that's Group D)
- Top movers expand/collapse inline
- Portfolio events refresh (try/finally on isRefreshing)
- CC Reminder no longer says "CSP"
- CC Assignment Probability based on Black-Scholes delta
- IV per-contract trigger runs (but cache stays empty — that's Group D)
- Posts: LTR for English text in posts, POST_IMAGE callbacks run, new put starts at 0% (not 100%)

## Ungrouped TODO (from Dima's roadmap, post-stabilization)

Re-classified from prior summary — see `roadmap.md` for the full list. Main groups:

- **F1.** AI per-post analysis (only for posts containing portfolio tickers — saves API calls)
- **F2.** Watchlist alerts → click opens AddPosition with ticker/strategy pre-filled
- **F3.** News inside position-open screen (per-ticker only, no sector filter)
- **F4.** Pre-market mode in dashboard header ("17 פוזיציות פתוחות") + price refresh in pre-market
- **F5.** CC reminder updates in pre-market (data starts 15:00 Bangkok / 04:00 ET)
- **F6.** Twitter/Nitter (free instances only — no paid API)
- **F7.** Reddit + Bloomberg + private Telegram bot integration
- **F8.** Filtered subreddits per watchlist
- **F9.** Home-screen widgets
- **F10.** AI chat for position analysis (Anthropic + Gemini keys ready)
- **F11.** Paper trading simulator
- **F12.** stockanalysis.com regex broken — try digrin.com / dividend.com fallback
- **F13.** Annual tax forms + Israeli Form 1325 + 1042-S parse
- **F14.** Spread redesign + drill-down + "best trades to repeat" (R5)
- **F15.** Delete confirmations across all screens — verification audit
- **F16.** Transfer commissions (multi-currency living)

## Validated environment notes

- **Pre-market ET:** 4:00–9:30 ET = **15:00–20:30 שעון תאילנד**
- **After-hours ET:** 16:00–20:00 ET = **03:00–07:00 שעון תאילנד**
- **Verified Marketdata-supported tickers (22):** IBRX, OPEN, BTCI, NVO, OWL, IREN, PLUG, RKLB, BBAI, EWY, ASTS, SOFI, RIOT, DRAM, NVDA, MULL, TTD, SMCI, ONDS, KEY, KBWY, USO, CHPT, LUNR, CCL
- **API keys present in DataStore:** Marketdata ✅, Massive ⚠️ (free tier returns empty IV), Finnhub, Alpha Vantage, Anthropic, Gemini, IBKR Flex token + Query ID. Alpaca **removed** (registration too complex).

## Workflow rules (reminders for all agents)

1. Max 4 fixes per Claude Code prompt
2. **GREP before fixing** — confirm grep target exists before writing changes
3. **Build must pass** before commit (`./gradlew :app:compileDebugKotlin --stacktrace`)
4. **Auto-accept all file edits** — Claude Code does not prompt for diff confirmation
5. **NEVER** change `realizedPnL()` without explicit Dima approval
6. Each fix has a verification step (specific log tag) that MUST appear in logcat before declaring done
7. Warn before any `uninstall` recommendation — past data loss

## Repo

- **GitHub:** funzi7/OptionsProfitTracker
- **Default branch:** `main`
- **Active branch:** `claude/analyze-project-structure-TC5ZG`
- **Branch naming convention:** `claude/batch{N}-{description}` or `claude/{round-label}-{description}`
- **PR convention:** conventional commits (`fix:`, `feat:`, `chore:`, etc.)
