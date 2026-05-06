# OptionsProfitTracker — State

> Living document. Update at the end of every working session.
> Last updated: 2026-05-05 (post commit `8a44bd4`)

## Current focus

ייצוב באגים פעילים שלא נסגרו ב-commit `8a44bd4`. יש פטרן של "הצהרת done שלא תפסה בקוד" — לכן כל FIX מכאן ואילך כולל verification בלוג שחייב להופיע לפני סגירה.

הבא בתור: סדרה של 4 פרומפטים (A/B/C/D) שמבוססים על הסיכום מ-2026-05-05 — סדר ההרצה: A (FIX 4 image+sort) → B (FIX 3 dashboard) → C (FIX 2 CSP+INTC) → D (FIX 1 IV).

## Repo + state

- **Repo:** funzi7/OptionsProfitTracker
- **DB version:** 30 (planned bump to 31 in FIX 1/D for `initial_implied_volatility` column)
- **Branch (current work):** `claude/analyze-project-structure-TC5ZG`
- **Last verified commit:** `8a44bd4` (1d497fa before)
- **Local path:** `C:\Users\DELL\Downloads\projects claude\OptionsProfitTracker_git`
- **Note on commit `8a44bd4`:** Result NOT yet verified on device — most fixes from prior round did not stick.

## Active issues — failed/incomplete from `8a44bd4`

These are open critical regressions. Fix priority is ordered A → D below.

### Group A — Image + sort + alerts (FIX 4 — first to run)

| # | Issue | Status |
|---|---|---|
| A1 | Strategy distribution unsorted (should be sortedByDescending by count) | ⏳ |
| A2 | Source column header click does nothing (sort not wired) | ⏳ |
| A3 | "קנייה +" not shortened to "ק+" in source column | ⏳ |
| A4 | Image re-fetch on every dialog open (Coil cache disabled or missing config) | ⏳ |
| A5 | Telegram emoji thumbs FAILED — relative URL bug (`//telegram.org/img/emoji/...`) | ⏳ |
| A6 | Abnormal alerts empty even when ticker shows -6% in top losers | ⏳ |

### Group B — Dashboard regressions that didn't stick (FIX 3)

| # | Issue | Status |
|---|---|---|
| B1 | "בתהליך" duplicate Text in monthly target area | 🔴 didn't stick |
| B2 | Yearly target "24%" appears twice (above row + in row) | 🔴 didn't stick |
| B3 | Minus sign on losers still on right side of number (need `\u200E` LRM marker) | 🔴 didn't stick |
| B4 | "נותר: $X" overlay missing on monthly target progress bar | 🔴 didn't stick |
| B5 | Monthly target $5086 (Settings) vs $5116 (Dashboard) — needs single-source-of-truth function | 🔴 didn't stick |

### Group C — CSP + report aggregation (FIX 2)

| # | Issue | Status |
|---|---|---|
| C1 | CSP cash recommendation: should subtract premium (collateral = (strike × 100 - premium) × contracts), already locked at entry | 🔴 |
| C2 | `CSP_CASH` log empty — branch not reaching this code path | 🔴 |
| C3 | Profitable tickers: INTC shows $4052 (single trade) instead of $2050 (4052 - 2000 aggregate) | 🔴 |
| C4 | `PROFITABLE_REPORT` log empty | 🔴 |

### Group D — IV diagnostics + initial preservation (FIX 1)

| # | Issue | Status |
|---|---|---|
| D1 | Massive returns 0 contracts for every ticker — RAW JSON shape unknown | 🔴 |
| D2 | Strike/expiration changes return "contract cache miss forever" — prefetch is async, lookup returns null before completion | 🔴 |
| D3 | Initial IV = current IV (migration backfilled them identically) | 🔴 |
| D4 | Need new column `initial_implied_volatility` in DB v31 with captured-once write semantics | ⏳ |

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
