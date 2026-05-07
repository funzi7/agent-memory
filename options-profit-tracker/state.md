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
- **Last commit:** `fdc1cf1` (Group D' — social regression + CSP net + reports all-years + per-bar remaining)
- **Recent commits:** `8a44bd4` → `9ddca1c` (Group A) → `f1c3e9a` (Group B) → `16fd852` (Group C) → `fdc1cf1` (Group D')

## Active issues

### Group A — Image + sort + alerts (FIX 4) ✅ COMPLETE

| # | Issue | Status |
|---|---|---|
| A1 | Strategy distribution sortedByDescending | ✅ verified |
| A2 | Source column header click logs PORTFOLIO_SORT + sorts list | ✅ verified |
| A3 | Source column shortened "ק+" / "מ-" / "הקצ" / "פק" | ✅ verified |
| A4 | Image cache (Coil ImageLoader, mem 25% + disk 5%) | ✅ verified |
| A5 | Telegram URL normalize | ✅ verified — minor: some posts show emoji as inline image |
| A6 | Abnormal alerts no shares filter, threshold strict 5% | 🟡 partial — only 1 ticker shown when multiple should appear |

### Group B — Dashboard regressions (FIX 3) ✅ COMPLETE

| # | Issue | Status |
|---|---|---|
| B1 | "בתהליך" duplicate removed | ✅ verified |
| B2 | Yearly "24%" duplicate removed | ✅ verified |
| B3 | Minus on right side | ✅ N/A — verified already correct |
| B4 | "נותר: $X" overlay on monthly bar | ✅ initial done, refined in D'4 |
| B5 | $5066 vs $5116 — Settings recompute on open | ✅ verified |

### Group C — CSP + report aggregation (FIX 2) — PARTIAL

| # | Issue | Status |
|---|---|---|
| C1 | CSP cash net of premium | 🔄 IN PROGRESS — see E'1 below |
| C2 | INTC profitable tickers aggregation | ✅ verified (2026-only correct; All-Years added in D'3) |
| C3 | (was B5 retry) Settings recomputes target on open | ✅ verified |
| C4 | Posts paragraph breaks | ✅ verified — caused D'1 regression now fixed |

### Group D' — Social regression + CSP + reports + per-bar (NEW)

| # | Issue | Status |
|---|---|---|
| D'1 | Social Feed regression fix | ✅ verified — section restored |
| D'2 | CSP "ייצא מהקאש" rewrite | 🔴 broken — not right-aligned, still shows $14991, missing cash balance |
| D'3 | Reports "כל השנים" toggle | ✅ verified |
| D'4 | Per-bar "נותר" overlay + total row RTL | 🔴 partial — "סה\"כ" still left, missing target amount on each bar |

### Group E' (NEXT) — UI rendering corrections + activity feed dedup

| # | Issue | Source | Status |
|---|---|---|---|
| E'1 | CSP card: right-align + show cash balance + correct net amount | retry of D'2 | ⏳ |
| E'2 | Monthly target: "סה\"כ" right + restore target amount per bar | retry of D'4 | ⏳ |
| E'3 | Phantom IREN in abnormal alerts (Dima doesn't hold) | new from device test | ⏳ |
| E'4 | Activity feed: edit-then-close creates duplicate row | new from device test | ⏳ |

### Other open items not yet addressed

| # | Issue | Notes |
|---|---|---|
| E1 | Spread display leg-matching | 🔴 broken — 3-pass SELL+BUY matching, not addressed in `8a44bd4` |
| E2 | Annual target screen | 🟡 partial — needs bars for previous months + year selector |
| E3 | Black-Scholes premium auto-fill | 🟡 implemented, unconfirmed by Dima on device |
| E4 | APK 16 KB page-size warning | ⏳ open — ML Kit `text-recognition:16.0.0` |
| E5 | Cents-level P&L mismatch (BTCI: 349.49 vs IBKR 349.50) | 🔴 open |
| E6 | Dashboard layout: 3 cards same row + bigger annual target at bottom | ⏳ |

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
