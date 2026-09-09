# cc-latest.md — OptionsProfitTracker handoff (latest)

> Rolling single-file handoff. Every future prompt OVERWRITES this file with a fresh, complete summary of the just-finished task and then prints its commit SHA.

## Latest task: S2.2 — SPCH partial-close lifecycle (feed + CC reminder) and a market brief that explains every mover it shows (2026-09-09, Claude Code)

- Base main SHA: `7225b7af16c183de00a9f064ead03a01ad6af1d3` (unchanged — main was never pushed to)
- Task branch: `s2/ibkr-reconciliation-lifecycle-dashboard` (the SAME branch as S2/S2.1; no replacement PR)
- Starting head: `9266b80262b2e43e5be51275962020f8c7c900f4`
- Final branch HEAD: `62b8a00ce24223c5022f4391e39da57f4bad722f` (code+tests attested on `88ba309`; `62b8a00` is docs only)
- PR: <https://github.com/funzi7/OptionsProfitTracker/pull/19> — still **OPEN**, labels `needs-owner` + `no-automerge`, **NOT merged**
- `local.properties` (`sdk.dir=/opt/android-sdk`) is modified on disk and deliberately **NOT committed**

### Model phase facts
Ran end to end on **Opus 5 (1M context)**, selected by the owner via `/model`. One read-only Opus reviewer subagent was used for the mandatory fallback PR review (Codex quota exhausted). No protected file was touched: `ProfitCalculator`, `BlackScholesCalculator`, `StrategicRiskAnalyzer`, `AppPreferences`, `AvgCostResolver`, `OptionsDatabase` and every migration are byte-identical. Room stays at v31.

### Files changed (14 modified, 7 new)
New: `domain/usecase/StockSnapshotMerge.kt`, `domain/usecase/PartialCloseFeed.kt`, `domain/usecase/MarketMoveExplainer.kt`, `data/remote/MarketNewsService.kt`, plus their three test files.
Modified: `OptionsTrackerApp.kt`, `FlexQueryService.kt`, `CcReminderEligibility.kt`, `IbkrReconciler.kt`, `MarketBriefBuilder.kt`, `ReconciliationAudit.kt`, `ReportGenerator.kt`, `FlexSyncWorker.kt`, `ClosePositionScreen.kt`, `DashboardViewModel.kt`, `MarketBriefCard.kt`, `FlexCycleBuilder.kt`, `ImportViewModel.kt` (+ 5 test files).

---

## The three owner physical findings, root-caused

### 1. FEED showed "SPCH נסגר BTC • $0.00" at 19.09 03:00

**Exact broker/device values found.** `positions` id **3554** = SPCH CALL 12.0 exp 2026-09-18, OPEN, and id **3556** = the same contract, CLOSED_BTC, 10 contracts, `notes = " [סגירה חלקית: 10/18]"`, close 2026-09-08 @ 0.39, commission 6.87 + close 15.30, `ibkr_realized_pnl = NULL`. Its local realized is `(0.30 − 0.39) × 10 × 100 − 22.17 = −112.17` — exactly the figure the owner's calendar showed. `activity_events` id **1026**: title `SPCH נסגר BTC`, description `Strike 12.0 • $112.17`, **`amount = 0.0`**, **`position_id = 3554`** (the row that is still OPEN), `timestamp = 1789761600000` = **2026-09-18 16:00 ET** = 19.09 03:00 Thailand.

**Root cause — two halves, both confirmed by that row.** `ClosePositionScreen.closeAndWait()`'s partial branch inserts the closed slice but **discards its id**, then writes the feed event against `pos.id` — the original row, which stays OPEN with the remainder — and gives it the FULL-close label `נסגר BTC`. Then `OptionsTrackerApp`'s cold-start FEED_FIX pass recomputes every close event from its linked position: for an OPEN row `ibkrRealizedPnl` is null and `realizedPnL()` is 0 → **amount $0.00**, and `baseDate = closeDate ?: expirationDate` → since an open row has no close date → **16:00 ET of the EXPIRY**. The description was not recomputed, which is why it still read `$112.17` next to `$0.00`.

**Fix.** New pure `PartialCloseFeed` owns the wording (`"<TICKER> נסגר חלקית"`, `"10 מתוך 18 חוזים • Strike 12.0"`, every number run FSI/PDI-isolated, **no money in the description** — the row's amount column is the single place money appears) and the re-home decision. The close screen keeps the slice id and writes the event against it, and no longer mutates the ORIGINAL row's existing event (which for a partial close is that position's still-valid history). The import path and `FlexSyncWorker` now use the same wording, and the import stamps the broker execution instant instead of defaulting to "now". The cold-start pass **never recomputes a close event whose position is OPEN**: it re-homes it onto the closed sibling slice (unique, or resolved by the event's own NY date), and when it cannot identify one it leaves the row untouched rather than inventing $0.

**Device result.** `FEED_FIX: re-homed partial-close event 1026 from OPEN 3554 to slice 3556 (SPCH 10/18)`. The row now reads `SPCH נסגר חלקית` / `⁨10⁩ מתוך ⁨18⁩ חוזים • ⁨ Strike 12.0⁩` / **−$112.17** / `09.09 03:00`, one row only, no duplicate. On the next cold start `rehomed=0` — the repair is idempotent.

**Timestamp, honestly.** `09.09 03:00` = 2026-09-08 16:00 ET, the **close date's** settle (it was the *expiry's*). It is still a fallback rather than a real fill time, because **IBKR has no record of this close at all** — see the open question below.

### 2. CC REMINDER showed "SPCH • 1000 מניות לא מכוסות"

**Root cause.** Both stock-snapshot merges (`ImportViewModel` and `FlexSyncWorker`) carried the same clamp — `if (flip || abs(new) >= abs(existing))` — so a stored share count could only ever **GROW**. The device snapshot held `"SPCH":{"shares":1800,…}` while IBKR reports **800**; 1800 − 800 covered by 8 calls = the 1000 the owner saw. There is **no manual share override for SPCH**, so this was never a product-precedence question.

Why the clamp existed: `parseStockPositions` kept only the FIRST `<OpenPosition>` row per ticker+account, so a holding split across lot rows was UNDER-counted, and a growth-only rule hid that. (A third site — the per-position loop in `syncOpenPositionPrices` — wrote the broker number *unconditionally*, so which rule applied depended on whether the ticker happened to have an open option with a quoted underlying.)

**Fix.** The under-count is fixed at the source: `FlexCycleBuilder.netStockShares` is `levelOfDetail`-aware (SUMMARY rows win over LOT rows, otherwise lots are summed) and reports whether the reading was **unambiguous**; an unlabelled payload listing a ticker more than once keeps the legacy first-row reading and is marked ambiguous. `StockSnapshotMerge` then accepts a genuine reduction and keeps the conservative clamp only for that ambiguous case. All three sites now go through it. Separately, `CcReminderEligibility.coversHeldShares` makes coverage "a live open SHORT CALL" rather than "a row labelled COVERED_CALL" (a wheel CC is stored as WHEEL, an imported one as CUSTOM); spread strategies are excluded because their short leg is covered by the long leg, not by stock.

**Device result.** `CC_REMIND: ticker=SPCH snapshot=800 … total=800 openCC=800 uncovered=0` → `CC_REMINDER_FILTER: ticker=SPCH included=false reason=fully_covered_or_below_round_lot=0`. **SPCH is out of the reminder.** A legitimate one still appears: `SOXL totalShares=100 openCC=0 uncovered=100 → included=true` (its CC expired that day). Ghost protection intact — ASTX/BBAI still excluded for `no_current_holding_evidence`.

### 3. MARKET BRIEF printed "אין הסבר זמין במקורות האפליקציה לתנועה הזו."

**Fix per the owner's ruling.** The sentence is gone and there is no fallback branch to reintroduce it. A material mover the app cannot explain is **not listed in this card at all** — it stays in the separate raw "טופ עולות/יורדות" card, unchanged. New pure `MarketMoveExplainer` resolves, in priority order: (1) a company headline published **TODAY in New York**, (2) an earnings report the app's own cache has dated to today or tomorrow — worded as *scheduled*, never *released* (the app only stores the date), (3) an explicit `$`/`@` cashtag or company-name social item. Litigation-advertising headlines ("class action", "law firm", "deadline reminder") are filtered out — they are published about anything that moves and explain nothing. **No sector or macro branch exists**, deliberately: the app holds no factual sector attribution, so such a line could only be invented.

**Data source and network discipline.** `MarketNewsService` calls the **same Finnhub `company-news` endpoint and the same stored key** that "חדשות תיק" already uses — no new provider, no new key. It runs only for MATERIAL movers (≥3%), at most 8 tickers per refresh, one attempt per ticker per 30 minutes, cleared on the NY date rollover; nothing is fetched on a closed day, overnight or pre-market (there are no movers then). The brief rebuilds every minute on the session ticker and that path issues **no** requests. Measured on device: **14 MARKET_NEWS requests across ~30 minutes and four app launches.** The cache is per-process, matching the existing `NewsCache`.

**Device result.** The card reads exactly `מה קורה היום בשוק / מסחר רגיל. / 09:30–16:00 ET` — no movers, and **0 occurrences of "אין הסבר זמין" anywhere in the UI tree**. The raw movers card below still lists MULL +7.3%, SPCH etc.

---

## The defect the device QA itself exposed (and fixed)

The first import after installing rewrote the SPCH remainder **from 8 contracts back to 18**:

```
IBKR_RECON: open SPCH CALL 12.0 2026-09-18 src=MANUAL: qty 8 → 18 comm 5.4977 → 12.37
```

`buildNetPositionCycles` produced a plain **OPEN cycle of 18** because the Flex payload contains no closing fill for this contract, and `applyOpen` took the broker quantity literally. The app was then holding a 10-contract closed slice **and** an 18-contract open row — 28 contracts where 18 ever existed — with the opening commission charged on both rows (12.37 + 6.87 against a broker charge of 12.37). This is exactly the "must not recombine into 18 open" case in the task brief.

**Fix.** `IbkrReconciler.closedSiblingContractsUnknownToBroker` counts closes the app recorded out of the SAME opening that the broker cycle does not know about (same contract, `openDate >= cycle.openDate`, not already claimed by a closed cycle in this pass), and `applyOpen` subtracts them and **prorates the opening commission** to the contracts the row keeps. A deduction that would leave nothing means the two sides disagree about something else, so the row is left untouched rather than guessed at.

**Device result on the next import:** `qty 18 → 8 (broker 18 − 10 closed-in-app) comm 12.37 → 5.5`. 5.50 + 6.87 = 12.37, exactly IBKR's charge. The second import converged with `updated=0`.

## Partial cycles are reconciled at last
Phase 1 of `reconcileWithBroker` only ever saw net-zero cycles and phase 4 only net-open ones, so a partial cycle's closed slice never received IBKR's realized P&L or its real execution instant. New `IbkrReconciler.matchPartialSlice` / `applyPartialSlice` write **only the close side** (realized, close commission, close price, close date, status) — the still-open remainder owns the opening premium, opening commission and open date, which is what the slice convention (`commission = 0.0`) depends on — and `ReconciliationAudit.compareSlice/accumulateSlice` audit them without comparing fields the slice does not own. A row a closed cycle already claimed is never re-claimed by a partial. **On this device the branch did not fire (`partial=0`)** because the payload has no partial cycle for SPCH 12C; it is covered by 10 unit tests.

---

## ⚠️ Open question for the owner — IBKR disagrees about SPCH strike 12

The Flex statement says the SPCH 12C position is **18 contracts open** and the holding is **800 shares**. It contains the 1,000-share stock sale (four SELL fills @ ~$10.69 on 2026-09-08, now in the feed) but **no buy-to-close for the 10 option contracts**. The app shows 10 closed + 8 open because the owner recorded that close in the app on 2026-09-08 (`BTC_PROFIT_PERCENT`, close 0.39).

S2.2 implements the owner's stated target state (preserve 10/18, 8 open, uncovered = 0) and treats the app's close as one the broker has not reported yet — which is why the reconciler no longer destroys the split. **But if that buy-to-close never actually executed at IBKR, the real position is 18 short calls against 800 shares — 1,000 shares' worth naked.** Please check the IBKR app. Two consequences follow from the answer: the slice's `ibkrRealizedPnl` stays NULL (so −$112.17 is the app's own calculation, not the broker's) and its feed timestamp stays a 16:00 ET settle rather than a real fill time.

---

## The owner closed two positions mid-session (not a defect — recorded so the numbers reconcile)
At 10:32 and 10:33 ET on 2026-09-09, while a build was installing, the owner closed **SPCH 12C (the
remaining 8 contracts)** and **RKLX 20C (6 contracts)** through "סגירת פוזיציה" — real closes with
prices, target percentages and commissions typed in (`BTC_PROFIT_PERCENT`, the only writer of which is
the close screen). Consequences visible in the later logs, all correct:
- SPCH 12C is now FULLY closed: 10 (08.09) + 8 (09.09) = 18. The partial-close event on the slice is
  untouched and coexists with the new full-close row — the cross-surface contract holding under a real
  second close.
- The CC reminder now reads `SPCH totalShares=800 openCC=0 uncovered=800` and RKLX `600 uncovered`,
  which is RIGHT: they hold the shares and no longer have a call written against them.
- `noMatch` rose 1 → 3 because the broker still reports those two contracts as open (the closes are
  minutes old and not yet in the Flex statement), so their open cycles find no open row.
The earlier verification (`openCC=800 uncovered=0`, SPCH excluded) was made against the state that
existed at the time and remains the evidence for the fix.

## Tests, compile, audit
- Compile gate: `grep -c "^e: "` = **0**, `BUILD SUCCESSFUL`. `git diff --check` clean.
- **281 JVM tests, 0 failures, 0 errors, 0 skipped** (187 → 272 → 281 after the review round). New files: `StockSnapshotMergeTest` (13), `PartialCloseFeedTest` (10), `MarketMoveExplainerTest` (15); extended `IbkrReconcilerTest` (+13), `CcReminderEligibilityTest` (+6), `ReconciliationAuditTest` (+7), `MarketBriefBuilderTest` (+7), `FlexCycleBuilderTest` (+6).
- One defect was found by the tests themselves: `MarketBriefBuilder.build`'s duplicate-input merge dropped `newsToday`, so a ticker that is both held and optioned lost its explanation and vanished from the card. Fixed, with a test.
- **`IBKR_AUDIT: cycles=268 closed=260 unique=257 ambiguous=3 unmatched=0 partial=0 partialMatched=0 | mismatches realized=0 premium=0 commission=0 qty=0 timestamp=0 maxRealizedDelta=0c refusedRealized=38260c | verdict=CLEAN_BUT_INCOMPLETE`** — identical on both runs. The three long-standing split cycles (BTCI PUT 33 qty 2, IRE PUT 6 qty 8, SPCH CALL 10 qty 18) are still REFUSED by design, carrying $382.60 of broker realized P&L.
- Reconciliation convergence over FOUR non-destructive imports: run 1 `updated=1 inserted=0 unchanged=261 ambiguous=3 noMatch=1`, then **`updated=0`** on every subsequent run. `noMatch` rose 1 → 3 only because the owner closed SPCH 12C and RKLX 20C mid-session (see below), so their still-open broker cycles find no open row — an expiry/close lifecycle fact, not a reconciliation failure.

## Device QA — PERFORMED (ADB `192.168.1.117:32957`, non-destructive throughout)
- Signer `5d3d855c6c6c397f817df2bd0c62f16f940b1551` on every build; three `install -r` updates, `firstInstallTime` stayed `2026-04-22 22:53:57`, Room DB/WAL untouched. No uninstall, no `pm clear`, no reboot. A private local DB/DataStore backup was taken and never committed.
- Calendar preserved: 2026-09-08 totals `87.51 + (−112.17) = −24.66` → displays **−25**, unchanged.
- **0 FATAL EXCEPTION**, 0 Room/SQLite/migration/downgrade errors. PNL log storm still **0 / 0 / 0**.
- Privacy: `<FlexQueryResponse` 0, `apikey=` 0, `primaryEmail` 0, bare `U\d{6,}` 0, owner email 0. `accountId="***"` / `acctAlias="***"` appear masked by `FlexLogRedaction` (the key name survives, the value never does). Every `token=` / `AndroidRuntime` / `IllegalStateException` hit in the buffer belongs to SurfaceFlinger/WindowManager or another app's process, not to ours.
- Log noise: the new `MARKET_BRIEF` diagnostic was gated to log only when a ticker's decision CHANGES after it produced **288 lines in half an hour**; now **9**.

## Review, CI and delivery
- **Codex is still out of quota.** Re-requested on the S2.2 head `4935ba6`; the connector replied with
  the usage-limit message again. So, per DEVELOPMENT_RULES_FULL, this PR had a **Claude Code fallback
  PR review** — a separate read-only latest-Opus reviewer over the COMPLETE `origin/main...HEAD` diff,
  across money/data integrity, partial-close lifecycle, stale state and races, cross-surface
  consistency, network/cache/runtime, privacy, tests, and approved behaviour. It returned CHANGES
  REQUESTED. Every valid finding is fixed in `88ba309`, each with a test — including one genuine
  double-count the S2.2 fix had itself introduced (`netStockShares` deciding the row level per PAYLOAD
  instead of per TICKER, summing a SUMMARY row with an unlabelled duplicate) and one quiet weakening
  of the S2 ghost guard (an ambiguous reading equal to the stored count re-stamped `sharesUpdatedAt`).
  Four assertions that could not fail were replaced with discriminating ones. Two claims were checked
  and NOT acted on: `BrokerReconciliationStore.contractKeyOf` vs `IbkrReconciler.fingerprint` do
  produce identical strings (a missing test, not a defect — now pinned), and `ReportGenerator`'s
  hard-coded `× 100` is consistent with the rest of the codebase (`contractMultiplier` is used nowhere
  in `domain/`) and was left alone as out of scope.
- **PR Build Gate: SUCCESS** on `4935ba6` and again on the final head **`62b8a00`**. Codex Gate stays RED (no Codex review has run on any head of this PR); `codex-p1-acknowledged` was deliberately NOT added — forcing the gate green would be dishonest.
- APK versionName **1.0.0**, **64,729,700 B**, SHA-256
  `15bca64875bfd7d5cf131f3f5f680e75aff90c2c7ddc9778d03e6a7df16627c9`, signer SHA-1
  `5d3d855c6c6c397f817df2bd0c62f16f940b1551`. Delivered to
  `/sdcard/Download/OptionsProfitTracker/OptionsProfitTracker-1.0.0.apk`; the on-device hash matches
  the local one exactly.

## What was NOT verified
- **The positive market-brief path was not observed live.** No ticker was simultaneously a ≥3% mover AND had a today-dated headline during the session. The negative path is proven live and precisely: `mover=NOK pct=3.3 news=5 newsToday=0 → NONE_omitted_from_brief` — five real Finnhub items fetched, none dated today, correctly not used. Finnhub's `company-news` covers a large cap like NOK (5 items) but returned **0 items for every leveraged/thinly-covered name in this portfolio** (MULL, MVLL, ASTX, RKLX, NEBX, TSLL, SNXX, WDCX, SOXL), so in practice this card will often show no movers at all. That is the owner's ruling working as specified, but they should know the consequence.
- No reboot test (explicitly forbidden this task).
- The owner's own visual comparison against the IBKR app.
- The SPCH broker disagreement above is unresolved and needs the owner.

## Complete remaining backlog (nothing deleted)
Everything from S2/S2.1 remains open: owner review/merge of PR #19; a real Codex review; the reboot test; dashboard alert-banner reappear (GP1); the buy-to-cover feed gap (A5, ≈$3,159.07 for MULL 2026-07); how to correct the three split cycles (A4); whether to strengthen the feed fingerprint with `tradeID`/`ibExecID`; **cleartext credentials in the daily external-storage backup** and **`allowBackup="true"` with no extraction rules** (both still NOT changed — owner decisions); the social backlog; PR #18 automation-core findings; Room/Hilt DB-builder consolidation; expiry-banner undercount; alerts pre-market; calendar progress-bar jump; tables-UX sort persistence; the 2026-07-04 device items (R1a/R1b/GP1 failed; GN1/GN2/GO/GP2/R2-restore/Covered-Put-core pending); unifying the four worker session windows onto `MarketCalendar.sessionAt`; and every earlier roadmap entry.
Newly added by S2.2: the SPCH broker disagreement above, and the thin Finnhub coverage for this portfolio's tickers (the owner may want to decide whether a second, already-approved source should feed the explanations).

## Pointers
- `state.md` — commit chain; `roadmap.md` — backlog; `gotchas.md` — hard-won lessons; `pending-tests.md` — owner device checklist.
- `PHONE_BUILD.md` — build/install/logcat runbook (test count updated to 272 in S2.2).
