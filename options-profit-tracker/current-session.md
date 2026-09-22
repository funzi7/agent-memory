# Current session — OptionsProfitTracker

**Round:** S2.7 — broker-exact realized P&L, one canonical ledger, broker provenance, 0DTE,
PUT liquidity, model BTC exit target, market-brief fixes
**Date:** 2026-09-22
**Agent:** Claude Code (Opus 5, 1M context)

## State at handoff

| | |
|---|---|
| branch | `s2/ibkr-reconciliation-lifecycle-dashboard` |
| HEAD | `a6e18376fad85e85a57da2fabdf5959be9c76cab` (pushed) |
| PR | **#19 OPEN**, `needs-owner`, `no-automerge`, NOT merged. `main` untouched. |
| compile | `:app:compileDebugKotlin` BUILD SUCCESSFUL, zero `e: ` lines |
| tests | 1384 JVM tests, 0 failures, 0 errors, 1 skipped, 65 classes |
| APK | 1.0.0 sha256 `b84a0069c80cb56bcdf547f4d06ed3ed1bb5d614c1e7b13106b99fa4629c3d34`, signer `5d3d855c…`, delivered to `/sdcard/Download/OptionsProfitTracker/`, **NOT installed** |
| device QA | **NOT RUN — ADB down all round** |
| review | Codex Gate **fail-closed pending** on `a6e1837` ("Codex has not reviewed head") — the expected state right after a push, not a verdict |

## The two things to do first next session

1. **Reconnect ADB from Termux**, install `-r` in place (never uninstall / `pm clear` / wipe DB), and
   work through the `pending-tests.md` S2.7 table. Every acceptance number is still unverified.
2. **Read the `PUT_CHAIN` log line before judging the put list.** Yahoo 429'd this host, so it is
   unproven whether the chain carries per-contract volume/open interest. An empty put list may be
   correct behaviour under "unproven ⇒ exclude", not a defect.

## Decisions recorded in CLAUDE.md this round

- The headline stock figure is IBKR's own `fifoPnlRealized` again — S2.6's average-cost headline is
  `SUPERSEDED — owner approved`, on the strength of the owner's current Orders & Trades screenshots.
- ALL-TIME is one canonical ledger with broker provenance derived from the owner's date boundary.
  **No Room migration; schema stays v31.**
- After reconciliation the displayed realized P&L is IBKR's, to the cent — `CloseRowAudit` measures it.
- 0DTE prices from the real fractional time to 16:00 ET (owner-approved protected change).
- A PUT candidate must be genuinely tradable; `ask/2` ESTIMATE is superseded for that ranking.
- The BTC exit target is a model result; the hardcoded 80 % is superseded.
- The market brief prints a category heading once; an exchange is not an index.
- OPT → Trading Tracker is specified, not built.

## Open blockers

See `roadmap.md` S2.7 backlog. The two that are not the owner's to wait on: PR #20 (brings the
canonical Claude review fallback) and the `MIGRATION_30_31` registration gap at 16 of 17 database
builders.
