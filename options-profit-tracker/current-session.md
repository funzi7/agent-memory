# Current session — OptionsProfitTracker

**Round:** S2.7 — broker-exact realized P&L, one canonical ledger, broker provenance, 0DTE,
PUT liquidity, model BTC exit target, market-brief fixes — **CLOSED**
**Date:** 2026-09-22 (implementation, Codex rounds 10–16, device QA, finalization)
**Agent:** Claude Code (Opus 5, 1M context)

## Final state

| | |
|---|---|
| branch | `s2/ibkr-reconciliation-lifecycle-dashboard` |
| **FINAL HEAD** | **`4512cbfa93b0a1623d544626c56e1c8709c06083`** (pushed; tracking branch in sync) |
| started from | `1a51e5e41a3e8a13a05d6833d862783243fa62cb` — 18 commits |
| `origin/main` | `7225b7af16c183de00a9f064ead03a01ad6af1d3` — **untouched**, HEAD is not an ancestor of it |
| PR | **#19 OPEN**, `needs-owner`, `no-automerge`, **NOT merged** (`mergedAt` null) |
| compile | `:app:compileDebugKotlin` BUILD SUCCESSFUL, zero `e: ` lines |
| tests | **1409 JVM tests, 0 failures, 0 errors, 1 skipped, 66 classes** |
| `git diff --check` | clean |
| health scripts | 75 / 75 pass |
| APK | 1.0.0 sha256 `b01e16d701f965ae645fb125f77123272cdfe3ba919f535e2291206fd95ad687`, signer `5d3d855c…`, **installed in place (`adb install -r`), launched clean**, delivered to `/sdcard/Download/OptionsProfitTracker/` |
| device QA | **RAN** — see `cc-latest.md` §7 |
| exact-head checks | `build-gate` **pass**, `scripts-test` **pass**, `check-codex-status` **pass**, `codex-gate-evaluator` **pass** |
| review | **Codex, clean, at the exact head**: "Didn't find any major issues." (reviewed commit `4512cbfa93`, 2026-09-22T15:10:20Z). Genuine Codex evidence — **not** a Claude fallback |
| review threads | 37 total: 10 resolved, 27 unresolved and **all 27 outdated**. Zero unresolved current-head threads |

> **Superseded by the above:** the previous revision of this file recorded HEAD `a6e1837`,
> 1384 tests / 65 classes, APK `b84a0069…` **NOT installed**, **device QA NOT RUN — ADB down**, and
> the Codex Gate **fail-closed pending**. Every one of those has been overtaken by later evidence.

## What the final device QA proved

- SOFI **−$3,077.21**, BTCI **−$1,914.57**, NOK **−$3,570.42** — match IBKR Orders & Trades to the cent.
- SPCH month **−$4,288.73** is correct and is a **wider period** than the owner's Sep 1–18 screenshot:
  the 2026-09-08 fills total −6,815.39 and a later 2026-09-21 sale realized +2,526.66.
- Four reference tickers over the owner's window: rounded rows **−15,377.59** vs IBKR header
  **−15,377.60**. One cent of IBKR aggregate rounding. **No adjustment added.**
- Dashboard month: stock −$12,850.93 + options +$4,372.90 = **−$8,478.03**, combined **derived**.
- Ledger: `incoming=272 stored=0 -> 272 tickers=103 span=2025-11-21..2026-09-21`, repeat pass
  `stored=272 -> 272` (scoped merge idempotent on that already-running sync path).
- **Yahoo `volume` / `openInterest` PROVEN present** in the live device chain payload.

## What was NOT observed / NOT re-run — do not reopen as a blocker

- **Import-only diagnostics** (`CloseRowAudit contractViolations==0`, the Sep 1–18 triple, the
  +$6,916.31 / −$6,795.78 subtotals, same-snapshot import idempotency, `OPTIONS_SYNC` /
  `REALIZED_LEDGER`): **NOT RE-RUN — owner explicitly declined further broker synchronization.**
- A live **accepted PUT row** (the scan ranked zero that session), a live **0DTE** contract (none
  expiring that day), and a **broad-index news item** (none qualified that session).

Do not fabricate a PASS for any of these and do not initiate a sync to chase them.

## Standing owner rulings

- **No further IBKR sync/import.** The account is synchronized; no new broker data is expected.
- **No price / IV / option-chain / market-data / news refresh for QA.** The owner reports a manual
  refresh appears to run ~3 passes and can burn the monthly API-key quota. Cause **undiagnosed** —
  it is a backlog investigation, not a known bug, and must not be reproduced.

## The next task is NOT in this repository

**OPT → Trading Tracker** one-way lifecycle sync. Contract already written in
`docs/OPT_TO_TRADING_TRACKER_CONTRACT.md`; nothing implemented. Next manager session runs
`clauto trading-tracker`.

## Open blockers

See `roadmap.md` — the S2.7 backlog plus the dated **S2.7 FINAL backlog reconciliation** block that
supersedes its first two entries. The ones that are not the owner's to wait on: PR #20 (canonical
Claude review fallback, still OPEN) and the `MIGRATION_30_31` registration gap at 16 of 17 database
builders.
