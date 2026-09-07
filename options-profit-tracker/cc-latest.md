# cc-latest.md — OptionsProfitTracker handoff (latest)

> Rolling single-file handoff. Every future prompt OVERWRITES this file with a fresh, complete summary of the just-finished task and then prints its commit SHA. Read this first for the newest context, then `state.md` (full commit chain), `pending-tests.md` (device-test checklists), `roadmap.md` (backlog + owner rules) and `gotchas.md` (hard-won lessons).

## Latest task: S2 — IBKR-authoritative reconciliation + option-lifecycle correctness + dashboard market brief + financial/UX fixes (2026-09-07/08, Claude Code)

- **Base main SHA:** `7225b7af16c183de00a9f064ead03a01ad6af1d3` (== origin/main, verified by fetch; still current).
- **Task branch:** `s2/ibkr-reconciliation-lifecycle-dashboard`
- **Final branch HEAD:** `1ab4c824c4c0c0d087ed4d3fde851968e1cf4493` (2 commits: `f327a7e` implementation, `1ab4c82` device-verified fixes).
- **PR:** https://github.com/funzi7/OptionsProfitTracker/pull/19 — **OPEN, NOT merged**, labels `needs-owner` + `no-automerge` (this repo has no `needs-dima` label — `needs-owner` is Merge Bot's protected-path escalation label per `merge-bot.yml`; `automerge` was never added). Owner review/merge pending.
- `local.properties` (`sdk.dir=/opt/android-sdk`) stays locally modified and uncommitted.

### Protected paths touched (explicit owner approval, both in `.claude-guard.json`)
- `ProfitCalculator.kt` — ONLY: Covered Put ASSIGNED branch → gross 0 + the zero-out guard includes COVERED_PUT (owner ruling); `PNL_TRACE` gated behind `PnlDiagnostics.enabled` (default false).
- `StrategicRiskAnalyzer.kt` — ONLY: `estimateAssignmentProb` gains an `optionType` parameter (CALL → above-strike tail; PUT unchanged, default PUT).
- NOT touched: `BlackScholesCalculator`, `OptionsDatabase`/migrations (no schema change, no migration), `AppPreferences`, `AvgCostResolver`.

### Exact financial behavior changed
1. **Covered Put assignment (owner ruling; the 8d8907b accounting is SUPERSEDED — owner approved):** option leg realizes **$0**; the premium folds into the effective buy-to-cover price (strike − premiumPerShare). `CoveredPutCalculator.assign` now returns `effectiveCoverPrice`, `optionPremiumRealized = 0`, `shortRealizedPnL = (shortEntry − effectiveCover) × coveredShares`; combined total unchanged (MULL 6,488.56). Realized is computed, not stored, so the manual MULL record resolves to $0 with no data edit.
2. **CALL assignment probability:** above-strike tail (deep-OTM CALL 50 on 20.68 → ~1%, was ~96%).
3. **CC yield banner:** `PremiumYieldCalculator` — a Covered Call yields on `capitalAtRisk` (stock cost basis × shares, the same base the 12/18/25% premium-target lines use); other strategies keep premium ÷ strike.
4. **Commissions:** IBKR's `ibCommission` is negated into the app's expense convention. **Verified against IBKR's own `fifoPnlRealized` on the device** — both signs occur per fill (81 of 1399 fills are credits): SPCH 11C gross 224.00 vs IBKR 235.78 → the +5.86/+5.92 fills are maker **rebates**; SOFI 18C gross −14.00 vs IBKR −26.88 → the −4.79/−8.09 fills are charges. The old `abs()` booked rebates as charges (23.56 on SPCH 11C alone — the owner's "~$20 discrepancy"). An interim "detect the payload's charge sign" idea was written and **reverted**: the sign is per-fill, not per-payload.

### IBKR reconciliation precedence + unique-match/ambiguity behavior
- Every surface already reads `ibkrRealizedPnl ?: ProfitCalculator.realizedPnL`; reconciliation writes the broker values onto the matched row, so all surfaces agree by construction.
- After a unique match the row gets: broker avg open/close premium, quantity, signed open/close commission, open/close dates, IBKR realized P&L, and the status the broker evidence proves (code A → ASSIGNED, Ep → EXPIRED, roll → ROLLED, a priced buy/sell-to-close → CLOSED_BTC; a zero-price close without a code keeps the existing closed status and never invents one for an OPEN row).
- Never overwritten: notes, tags, favorite, BTC target, wheel group, stock basis/shares, IV, currency, strategy, spread legs, multiplier, `syncSource` (MANUAL stays MANUAL → a full resync never deletes the owner's row), createdAt, id.
- Matching: same contract → same quantity → open date → close date; or the single MANUAL row within 5 days of the broker open when the owner's quantity was approximate. Zero/several candidates → **no write** + a bounded `IBKR_RECON AMBIGUOUS` line.
- **Claim resolution (added after device QA):** several cycles can claim ONE row. All claims are resolved before any write — the row goes to the cycle whose open/close dates agree, other cycles are inserted as their own IMPORTED rows (`newRowFromCycle`), and a row with no date evidence is CONTESTED and untouched.

### Root causes fixed
- **SOFI (`CLOSED_BTC → "הוקצה" $0`):** the price sync wrote a STALE copy read before the manual close (resurrecting the row as OPEN) → auto-expire set EXPIRED/closePrice 0 → FlexSyncWorker's heuristic ("closed on/after expiry at 0 ⇒ ASSIGNED", which never skipped EXPIRED rows) flipped it to ASSIGNED/$0; its OptionEAE match also ignored the expiry. Fixed by a re-read-by-id guard in both price syncs, EXPIRED/priced-BTC/ROLLED rows never being re-inferred, an expiry-aware EAE match, and broker verdicts stored in `BrokerReconciliationStore`.
- **Feed "15.08 03:00":** `OptionsTrackerApp`'s FT2 pass has no done-flag and ran on every cold start, rewriting every close row to 16:00 ET of the close date. Now a broker execution instant always wins, intraday closes keep their recorded instant, only expiry/assignment use the 16:00 ET settle. `CloseTimestampResolver` is the single rule; the feed row and "עריכת סגירה" read the same value.
- **SPCH:** manual rows were never reconciled (`isDuplicate` skipped them; `updateDuplicatePremium` refused MANUAL rows), so the owner's approximations stayed forever — plus the rebate-as-charge error above.
- **Multi-cycle overwrite (found on device):** BKSY 25C had a +$171.95 buy-to-close and a later assignment; both matched one row and the last applied won, destroying the buy-to-close. Fixed by claim resolution + orphan insertion.
- **Premium churn (found on device):** `updateDuplicatePremium` used `findDuplicate` (LIMIT 1, no quantity) so on a two-row contract (PLUG PUT 2.0 qty 20 + qty 100, QQQ PUT 602) it wrote one cycle's premium onto the other's row on every import. New `PositionDao.countByContract`; multi-row contracts are left to the reconciler.
- **CC reminder coverage:** staleness is now keyed to the latest CC **assignment** settle (16:00 ET of the assignment date) instead of the closed row's `updatedAt`, which every auto-expire / buy-to-close / re-scan bumps — that is what hid genuinely held tickers.
- **Market brief on a closed day:** the snapshot still holds the last session's move, so a holiday showed "יורדות היום". Movers/context are now gated on a trading day.

### Dashboard section + CC reminder
- **"מה קורה היום בשוק"** — `MarketBriefCard` inserted immediately before `item(key = "row3_positions")` ("פוזיציות פתוחות"), same ElevatedCard + centered icon + `bodyMedium` bold title. Fed by `DashboardViewModel.marketBrief` (a `combine` of open positions, holdings, watchlist, snapshot, alert cache and the loaded social feed) → pure `MarketBriefBuilder`. No network, no AI, no new provider/key/polling, no per-recomposition work. Reasons are only stated when app data supports them, else "אין הסבר זמין במקורות האפליקציה". **Documented gap:** no cached NEWS source exists on the dashboard, so news context comes from the social feed + earnings cache only.
- **CC reminder** copy is the owner's choice #1 ("אפשר לשקול מכירת Covered Call" / "פרמיה משוערת לחוזה: $X" / "מוצג כי יש מניות פנויות ואין עליהן CC פתוח."), money in `LtrText` with 2 decimals.

### PNL log cleanup — measured, not assumed
`PnlDiagnostics.enabled = false` gates `PNL_TRACE`, `PnLDebug`, `PNL_DBG`. Same dashboard load: **old build 63,006 / 2,966 / 2,319 → S2 build 0 / 0 / 0**.

### Tests + compile
- **97 JVM tests, 0 failures, 0 errors, 0 skipped** (was 23 before S2), forced clean run. CoveredPutCalculatorTest 16, ProfitCalculatorCoveredPutTest 11, IbkrReconcilerTest 20, FlexCycleBuilderTest 10, CcReminderEligibilityTest 10, MarketBriefBuilderTest 9, CloseTimestampResolverTest 7, PremiumYieldCalculatorTest 7, StrategicRiskAnalyzerTest 7.
- `:app:compileDebugKotlin` BUILD SUCCESSFUL, zero `^e:` lines. `git diff --check` clean.

### PR checks / review
- **build-gate PASS** on the first head `f327a7e`; re-running on `1ab4c82` at handoff time.
- **Codex Gate RED — no review was performed.** `chatgpt-codex-connector[bot]`: "You have reached your Codex usage limits for code reviews." No findings exist, nothing was suppressed, and the `codex-p1-acknowledged` override was deliberately NOT applied (owner decision: add credits, or apply the label).
- A local multi-agent review ran instead; one agent completed (its simplification findings were applied), the others died on the account's session rate limit.

### Device QA — PERFORMED (ADB returned as `192.168.1.117:34617`)
- 3 × `adb install -r` after the full 3-way signer gate (keystore = new APK = installed = `5d3d855c…`). `firstInstallTime` unchanged 2026-04-22; Room DB / DataStore / caches intact; launch clean; 0 FATAL / AndroidRuntime / IllegalState / Room / SQLite / migration errors. A private local backup of the app data was taken first (scratchpad only, never committed).
- Real IBKR sync + import driven through the app UI **3 times, non-destructively** ("ייבא N פעולות"; delete+import never touched): 790 trades → 265 cycles. Run 1 `updated=106 ambiguous=3 noMatch=2`; run 2 `updated=2 inserted=1`; run 3 **`updated=0 inserted=0 unchanged=261 ambiguous=3 noMatch=0`** — converged and idempotent on real data.
- **SOFI verified:** feed row `SOFI נסגר BTC • −$26.88` at 05.09 02:48 (was `SOFI CC הוקצה $0.00`); "עריכת סגירה" shows close 0.24, close commission 8.09, P&L −$26.88 and **שעת סגירה 05.09.26 02:48:02** labeled **שעת ביצוע בפועל (IBKR)**.
- **BKSY verified:** the lost buy-to-close cycle was reinserted (row id 3553, CLOSED_BTC, ibkr 171.95) with its real execution timestamp and a matching feed row.
- **"מה קורה היום בשוק"** renders exactly before "פוזיציות פתוחות", same heading weight, plain Hebrew, LTR numbers, no flicker. **CC reminder** shows the three approved lines with LTR money.
- 3 contracts stayed **AMBIGUOUS by design** and were never overwritten: BTCI PUT 33 qty 2, IRE PUT 6 qty 8, SPCH CALL 10 qty 18 (several manual rows opened within days of each other).

### APK / signer / delivery
`:app:assembleDebug` BUILD SUCCESSFUL → `app-debug.apk` **64,713,902 B**, SHA-256 `0082b9e2ed9f801d9568e94af45ae2e654c846c1f69bb96a7980a530021aa168`; `com.dima.optionstracker` versionCode 1 / versionName 1.0.0 (no bump policy → no bump); signer SHA-1 `5d3d855c6c6c397f817df2bd0c62f16f940b1551`. Delivered to `/sdcard/Download/OptionsProfitTracker/OptionsProfitTracker-1.0.0.apk` with the same size and SHA-256.

### What was NOT verified
- Owner's own visual comparison of SPCH + one more position against the IBKR app (figures now match IBKR by construction, but the owner should confirm).
- Covered Put MULL screens, the CALL-probability readout and the CC yield tier were not opened on the device (unit-tested only).
- **Reboot: NOT performed** (owner-gated).
- **PR is NOT merged** — owner review pending.

### Owner S1 acceptance — PASSED (recorded). Reboot — still pending.

### Complete remaining backlog (nothing deleted)
1. Owner review + merge of PR #19; Codex review once credits allow (or `codex-p1-acknowledged`).
2. Owner visual checklist in `pending-tests.md` (2026-09-08 block), incl. deciding what to do about the 3 ambiguous contracts and confirming the reinserted BKSY row belongs.
3. Reboot test (owner-gated).
4. Preserved: dashboard alert-banner reappear (GP1); buy-to-cover import gap (short-close STK BUY invisible); social backlog; PR #18 automation-core review findings; Room/Hilt DB-builder consolidation (DI); expiry-banner undercount; alerts pre-market; calendar progress-bar jump; tables-UX sort persistence; `TaxReportScreen`/`AddPositionViewModel` sites that still call the calculator directly instead of `ibkr ?: calc`; F1/F2/R1/R2; all older pending device tests.

## Pointers
- `PHONE_BUILD.md` (OPT) — build → test → APK → signer gate → `install -r` → launch → logcat loop (test count updated to 91 in S2; now 97).
- `README.md` — S2 product-contract notes (IBKR authoritative; Covered Put ruling).
- `state.md` (two S2 blocks), `pending-tests.md` (S2 status + owner checklist), `roadmap.md`, `gotchas.md` (S2 + S2 device-QA lessons).
