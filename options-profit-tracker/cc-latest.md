# OptionsProfitTracker — rolling handoff (Claude Code)

**Task:** S2.5 — IBKR ORDERS & TRADES P&L PARITY + STRATEGY INTEGRITY + BTC WHAT-IF + SOCIAL MARKET BRIEF
**Date:** 2026-09-14
**Branch:** `s2/ibkr-reconciliation-lifecycle-dashboard` — **PR #19 OPEN** (`needs-owner`, `no-automerge`),
**never merged**, nothing pushed to `main` (`main` is still `7225b7af16c183de00a9f064ead03a01ad6af1d3`).

---

## 1. Heads

| | SHA |
|---|---|
| S2.5 starting HEAD | `9183a167c03f15761e48f94cbde5aa0d9571c9e3` |
| **Final HEAD** | `074de86e52f2a168b89dc21ff32a851570f1b144` (see §13) |
| merge-base with `origin/main` | `7225b7af16c183de00a9f064ead03a01ad6af1d3` |

---

## 2. READ THIS FIRST — two of the brief's premises did not survive contact with the repository

### 2.1 The "+141.89 mismatch" does not exist anywhere

The brief asks for "every row responsible for any prior +141.89 mismatch". Searched exhaustively:
the working tree, the **entire git history** (`git log --all -S "141.89"` in both repos), all of
`/root/work/agent-memory`, and all of `/root/work`. **Zero hits.** The only `141.89` under `/root/work`
is in `agent-memory/paper-trader/*.json` — a different project's simulated portfolio.

The same is true of **`-10,974.60`, `+1,620.56` and `-9,354.04`**: none of them appears in code, tests,
or memory. Only `-2,412.39` and `-6,815.39` do, and only as S2.4 narrative plus synthetic test fixtures.

**These figures are external to the codebase.** They can only have come from the owner's own IBKR
screen. There is nothing here to trace them to, and no sanitized Sep 1–12 reference fixture exists to
reproduce them from. Building one would mean inventing the lot history that produces the target number.
That was not done.

### 2.2 The $4,403.00 is a COST BASIS difference, not a duplicated sale — and that is now proven

S2.4 noted `−2,412.39 + (−4,403.00) = −6,815.39` and read the $4,403 as a double count. It is not:

| | proceeds | cost matched | realized |
|---|---|---|---|
| SPCH, 1,000 shares sold 2026-09-08 | $10,695.00 | $17,510.39 (≈ **17.5104**/sh) | **−$6,815.39** ← Flex FIFO |
| the same 1,000 shares | $10,695.00 | $13,107.39 (≈ **13.1074**/sh) | **−$2,412.39** ← Orders & Trades |

`(17.51039 − 13.10739) × 1,000 = 4,403.00` exactly — which is why the same number falls out whichever
way you decompose the difference. IBKR's own four EXECUTION fills confirm it directly: each implies a
matched basis of ≈17.51/share (10.69+6.8126, 10.69+6.8197, 10.70+6.8154, 10.69+6.8194), i.e. FIFO
reaching back to older, dearer lots. **Nothing is duplicated.** Both figures are now reproduced exactly
by unit tests from a STATED basis (`StockLotAccountingTest`).

**What is still an OWNER question:** which basis IBKR's Orders & Trades screen uses. The app now
computes both and logs them side by side per ticker-month (`STOCK_BASIS`), so one real import on the
device answers it.

---

## 3. What shipped

### 3.1 `SpreadEvidence` — a spread is a broker fact (Tasks B and F)

**Root cause of the SPCH report, found in the code.** `ImportViewModel.detectAndLinkSpreads` ran over
**every row in the database** after every import AND every background sync, and paired a SELL with a BUY
on: *same ticker + optionType + expiry + different strike + equal contract count + open dates within
1 day, relaxed to 3*. **No status filter** (a long-closed BUY could capture a live SELL), **no
`syncSource` filter** (a MANUAL, owner-created row was fair game), `firstOrNull` on an unsorted list. It
then overwrote BOTH rows' `strategyType` and all four `spreadLeg*` columns.

A covered call and an unrelated long call on one underlying match that exactly. `coversHeldShares`
excludes a spread's short leg — correctly — so the reminder then reported **`SPCH • 800 מניות לא מכוסות`**
over 800 shares those 8 contracts covered.

- Linking now requires **IBKR's own order id** (`ibOrderID`, else `orderID`, never `transactionID`).
  Proximity is not an input at all. On the owner's current query **nothing links**, which is the honest
  answer. `detectAndLinkSpreads` is now `auditStoredSpreadLabels` and only reports.
- **ONE vertical rule.** Three classifiers disagreed: `correctedSpreadType` had the CALL half inverted,
  `detectAndLinkSpreads` had **all four** branches inverted, and `spreadPairToEntity` ignored the strikes
  entirely while writing a note computed by the CORRECT rule — so a row contradicted itself. The
  invariant: **selling the HIGHER strike is the BULL vertical, for CALLs and PUTs alike.**
- **The atomic clear** at the persistence boundary (`buildEntity` → `sanitizeLegs`), plus the form.
- **A background pass may RENAME a vertical, never PROMOTE a row into one.** The dashboard's launch-time
  reclassifier selected `name.contains("SPREAD") || spreadLegStrike > 0` and rewrote every match — which
  is why the owner's correction did not survive a **cold start**.
- **Coverage asks what the row IS**: a multi-leg NAME with no real second leg is stale metadata, and the
  shares behind it are covered. The S2.2 ruling (a REAL vertical's short leg is not stock coverage) is
  untouched. Generic — no SPCH special case. Coverage also honours `contractMultiplier` now.

### 3.2 `BtcWhatIf` — the BTC preview and the What-if engine (Tasks C and D)

**Three independently sufficient causes of the negative BTC preview**, in descending size:

1. **A phantom long leg.** `ProfitCalculator.totalPremium` subtracts `spreadLegPremium` whenever it is
   non-null with no strategy guard, and the import heuristic above stamped one onto ordinary CCs and
   CSPs. Once the phantom leg is dearer than the real premium the opening credit itself is negative.
   **Removed at source by §3.1; `ProfitCalculator` was not touched.**
2. **The opening commission charged twice** — `parse(input) ?: openCommission` on a blank field, in the
   preview, in BOTH save paths, in the chips and in the summary card (the last two as a literal
   `- commission * 2`). Blank is now **zero**, labelled `לפני עמלת סגירה` until a fee is entered.
3. **A label that was not about the buyback.** `אם סוגר עכשיו (BTC)` printed
   `(strike − cost basis) × shares` for a CC above its strike — a STOCK figure, independent of the
   buyback price in the field beside it.

The engine: FAST=ASK, BALANCED=MID, PATIENT=BID; a BUY limit is a MAXIMUM so the advice is whether to
move it; live book only in `Session.REGULAR`; theoretical only from the EXACT contract's own IV; honest
`UNAVAILABLE` with neither; refuses outright on stale spread metadata. ×multiplier exactly once. Full
card on the close screen, compact row on the position card (which issues **no** network request).

### 3.3 `SocialExplanation` — the brief explains (Task E)

Analysed Social items now supply the *why*, through the existing `socialPosts` path. **No new provider,
no new key, and nothing reworded** — it SELECTS the sentence that names the subject and carries a number,
strips URLs and invisible marks, bounds at a word, attributes the source.

Relevance is `MarketNewsRelevance` with a new `requireCashtag` (channel authors capitalise for EMPHASIS,
so the bare-symbol case signal does not exist in a post; **the NEWS path is bit-for-bit unchanged**),
plus `CompanyNameMap`. A **sector** post becomes the grouped row's note — ONE row naming the tracked
symbols. Company news and dated earnings still outrank it. No explanation still means **OMIT**.

### 3.4 `StockLotAccounting` + `SyncDeltaReport` — realized P&L (Task A)

Realized stock P&L computed from the broker's own fills under **FIFO or AVERAGE**, with short stock,
buy-to-cover, commissions once per fill, broker-day months, and an explicit ambiguity flag. An
import-time `STOCK_BASIS` audit logs broker/fifo/avg per ticker-month, ordered by how much the two bases
disagree.

**The displayed figure is UNCHANGED**, deliberately — see §4.

`SyncDeltaReport` records the before/after of one import: every option cycle that moved, its delta, the
per-month net, both totals, and `idempotent`. The "before" is captured before any write.

---

## 4. Why the production basis was NOT switched

`captureStockRealized` rebuilds its map from the CURRENT Flex window only. For a share bought before the
window there IS no purchase in the payload — a measured fact (GPUS 2026-01), not a hypothesis. **An
average-cost figure computed from a truncated window is wrong with confidence**, which is worse than the
number it would replace.

So `StockLotAccounting` reports rather than replaces, and flags `insufficientHistory` per ticker. A real
short sale and a sale whose purchase predates the window are **indistinguishable** in this payload, and
both are counted as ambiguous rather than silently priced.

Switching the basis needs two things the agent cannot supply: the owner's answer about which basis their
screen uses, and a window that provably contains the opening lots.

---

## 5. Device QA — PERFORMED. The phone came online mid-round, during an OPEN US option session.

The owner enabled wireless debugging partway through (SM-S938B, 192.168.1.121). The session ran
2026-09-14 ~13:30–14:05 ET — **the regular option session was open**, which is what S2.3 and S2.4 never
had. The owner asked to pause ADB at 14:05 ET and no device command was issued after that.

### Signer gate — PASSED, all three steps
| step | result |
|---|---|
| keystore `~/.android/debug.keystore` | SHA-1 `5D:3D:85:5C:6C:6C:39:7F:81:7D:F2:BD:0C:62:F1:6F:94:0B:15:51` |
| built APK | SHA-1 `5d3d855c6c6c397f817df2bd0c62f16f940b1551` |
| INSTALLED APK, pulled off the device | the same SHA-1 |
| `adb install -r` ×2 | `Success`, streamed, in place. No uninstall, no `pm clear`, no DB/DataStore deletion, **no reboot** |
| `firstInstallTime` | still **2026-04-22 22:53:57** after both installs |
| installed SHA-256 == build SHA-256 | yes, read back off the device both times |

### QA B — THE SPCH CHAIN, VERIFIED END TO END

**Before (S2.4 build):**
```
SPREAD_FIX: id=3570 SPCH current=BULL_CALL_SPREAD strike=12.0 leg=11.5 dir=SELL type=CALL
SPREAD_FIX: id=3572 SPCH current=BULL_CALL_SPREAD strike=11.5 leg=12.0 dir=BUY  type=CALL
CC_FIX    : ticker=SPCH totalShares=800 openCC=0 uncovered=800      <-- the owner's report, reproduced
```

**THE FALSE MATE, IDENTIFIED EXACTLY.** Row **3572** is a **`CLOSED_BTC` BUY CALL 11.5**, 8 contracts,
`sync_source=IMPORTED`, expiry 2026-09-25. The old `detectAndLinkSpreads` had **no status filter**, so a
long-CLOSED buy captured the live SELL CALL 12.0. That is the precise mechanism, on the owner's own data.

**After (S2.5 build), read straight out of `options_tracker.db`:**
```
id 3570  COVERED_CALL  SELL CALL 12.0  x8  OPEN  MANUAL
         spread_leg_strike=NULL  spread_leg_premium=NULL
         spread_leg_type=NULL    spread_leg_direction=NULL     <-- the atomic clear, all four
CC_FIX : ticker=SPCH totalShares=800 openCC=800 uncovered=0    <-- the reminder is gone
```
The owner corrected the row through the normal edit screen; `buildEntity`'s `sanitizeLegs` cleared all
four fields, which the pre-S2.5 build would have re-persisted.

| QA B step | result |
|---|---|
| 1–3 inspect the row, capture hidden spread fields, identify the false mate | done — above |
| 4 correct to Covered Call through the supported path | done (by the owner) |
| 5 spread fields clear | **all four NULL** |
| 6–7 run the reconciliation that used to mutate it → stays COVERED_CALL | **a real IBKR `FlexSyncWorker` sync ran** (4 holdings, 4 prices, 5 price updates). Row unchanged |
| 8–9 cold start → still COVERED_CALL | force-stop + relaunch. Unchanged. `openCC=800 uncovered=0` |
| 10 CC reminder no longer reports 800 uncovered | **confirmed** |

No trade was entered, nothing was closed, no fake data was created.

### Other device evidence

- **Stability:** 0 FATAL EXCEPTION, 0 ANR across three launches and one real sync (~51,000 app-PID log
  lines). The only "Room" matches in the crash grep were `DlbEffectContext.applySpecificConfigForRoomModel`,
  an audio-effect line.
- **Live CC BID/ASK/MID — the thing S2.4 could not prove.** On screen during the regular session:
  SOXL `ביד לחוזה $430.00 · ביקוש לחוזה $480.00 · אמצע לחוזה $455.00 · לימיט מומלץ לחוזה (אמצע, לא מובטח ביצוע) $455.00`.
  The mid is the average of a real two-sided book and the recommended limit is that mid, ×100 once.
- **Market brief, live:** `מצב השוק — מסחר רגיל 03:00–20:30+1` (device zone, no ET suffix); four
  benchmarks; a rung-1 company row `GLWG -25.9%` with its attributed headline
  (`CORRECTION: Corning's Ticker Is GLW Not GLWG — Benzinga`); and ONE correlation row naming eight
  tickers, worded as co-movement. No fabricated reason, no raw unexplained mover list.
- **Yahoo health — see §13.**
- `SPREAD_FIX: found 7 verticals with a second leg … 0 renamed` — the narrowed launch pass no longer
  touches single-leg rows, and changes nothing on real verticals.

### What device QA did NOT cover, and why

- **The manual import was not run.** The new `STOCK_BASIS`, `OPTIONS_SYNC` and `SPREAD_AUDIT` lines live
  in `ImportViewModel`, which only the Settings screen's sync/import button drives — `FlexSyncWorker`
  has its own lighter path and emits none of them. Reaching that button needs UI taps, and one earlier
  blind tap on the dashboard landed inside the owner's **IBKR TWS app**. Driving a brokerage phone by
  coordinate taps is not a risk worth taking for a log line; UI automation was stopped there and the
  only inputs after it were two BACK presses. **One press of the owner's own sync button produces all
  three audits**, and `STOCK_BASIS` is what answers the basis question in §2.
- **The live What-if SCREEN was not photographed** for the same reason — it needs navigation into a
  position's close screen. The engine is covered by 50 unit tests and the live option book is evidenced
  by the CC card above, which reads the same `IvService` path.

### The old detector's real footprint, measured

Every one of the **7** stored second legs in the database belongs to a **mutual pair**: FISV 3340/3341,
NVDA 3379/3380, SOFI 3455/3456 and SPCH 3570/3572 each stored the *other* as its leg. `detectAndLinkSpreads`
updated both rows in place rather than collapsing them, so both exist AND both net the other's premium.

**Realized P&L is NOT double-counted by this**, and that matters: all four pairs carry
`ibkr_realized_pnl` (FISV −490.46 / +1,011.04; NVDA +769.56 / −90.44; SPCH 3572 +77.40), and the broker
figure wins over `ProfitCalculator` at ~25 call sites. Summing the pair gives the spread's true total.
What the mutual legs do distort is anything reading `totalPremium` — expected profit, capital at risk,
premium totals — and all of these rows are closed. **Zero orphan labels** (a multi-leg strategy with no
second leg) exist in the whole database.

---

## 5b. For the record — the phone was unreachable for most of the round

For the first ~2 hours `adb devices` listed nothing: `adb connect` to both addresses in memory
(`192.168.1.118:37211`, `192.168.1.117:43817`) returned `No route to host`, and `adb mdns services` is
unsupported in this adb build. The host ADB server was up and reachable from PRoot on the canonical
`ADB_SERVER_SOCKET=tcp:127.0.0.1:5037` throughout; it was the DEVICE that was absent, and the
wireless-debugging port is randomised on each toggle and readable only from the phone's own screen. No
new ADB server was started from PRoot and the interactive Termux pairing helper was not invoked.

The owner brought the phone online at ~13:30 ET (new address `192.168.1.121:43759`), which is what made
§5 possible. **Before that point this section read "device QA NOT PERFORMED", and nothing was faked to
cover it.**

---

## 6. Tests, compile, gates

- **908 JVM tests, 0 failures, 0 errors, 0 skipped, 44 classes** (was 729 / 39). Read from the JUnit XML
  on a forced re-run, not from Gradle's summary.
- `:app:compileDebugKotlin` → BUILD SUCCESSFUL, `grep -c "^e: file:"` = **0**.
- `git diff --check` clean. `local.properties` deliberately not committed.
- **PR Build Gate PASSED** on `e692901` and on `e7039c5`.
- **No guard-protected file touched**: `ProfitCalculator`, `StrategicRiskAnalyzer`,
  `BlackScholesCalculator`, `*Migration*`, `*Database*`, `AppPreferences`, `AvgCostResolver` are all
  untouched in the S2.5 diff.

---

## 7. Review

**Codex is provably quota-unavailable.** `codex exec` returns, verbatim:
`You've hit your usage limit. Visit https://chatgpt.com/codex/settings/usage to purchase more credits or
try again at Sep 19th, 2026 9:42 AM.`

The sanctioned DEVELOPMENT_RULES_FULL fallback ran instead: `review_provider = claude_code_fallback`,
`reason = codex_quota_unavailable`, a separate Opus reviewer per round, over the COMPLETE PR diff.
**This is not presented as a Codex review**, and `codex-p1-acknowledged` was NOT used.

**CENTRAL structured fallback attestation is STILL MISSING** — the same infrastructure blocker as S2.4.
No `provider=claude_code_fallback` / `reviewed_head=` / `unresolved_p1=` mechanism exists under
`/root/work/bin`, in `automation-core`, or in this repo's `.github/workflows` (`claude-fallback-watchdog.yml`
is the FIXER loop, not a review attestation). It was **not faked** and no workflow was patched.

---

## 8. What the reviews found

Round 1 on `e692901` — **1 BLOCKER, 7 MAJOR, 9 MINOR, 7 NIT.** The blocker is the one worth keeping:

> **The commit that removed a wrong money figure introduced one.** The rewritten `אם סוגר עכשיו (BTC)`
> card subtracted the NET spread mark — the field above it is literally labelled
> `מחיר נוכחי נטו של הספרד` — from the MAIN leg's GROSS premium. A 100/95 bull put sold for 2.00 against
> a 0.80 long leg, marked at 0.40 net, read **$160.00** while the row directly above it read **$80.00**.
> A short straddle went the other way, since `totalPremium` there is leg1 + leg2.

The majors, all fixed:
1. **`brokerOrderId` died one step before every consumer.** `doImport` rebuilds a `ParsedTrade` from each
   `NetPositionCycle`, and the cycle had no order-id field — so `mayLink` could only ever answer
   NO_ORDER_EVIDENCE, `aggregateTrades`' `singleOrNull` rule was unreachable dead code, and the audit
   line recommending `ibOrderID` as the cure would never have come true.
2. **`WhatIfQuoteCache` gated on the last SUCCESS** — a failing chain fetch re-fired on every keystroke
   in the BTC price field. The exact loop `CcPremium` already documents; fixed with a `triedAt` stamp.
3. **`WhatIfCompactRow` could never render** — `analyze` left `atCurrentLimit` null on the no-book
   branch, and the card issues no request by design.
4. **A SECTOR social item was handed to every ticker in its industry** — one post produced four
   identical rows AND removed all four from the grouping pool, so the grouped row it was written for was
   never built, and it consumed the whole `MAX_EXPLAINED_MOVERS` cap.
5. **`SyncDeltaReport`'s "before" was captured after `doImport` had already written the payload** — a
   first import into a cleared database logged `delta=0.00 idempotent=true`.
6. **`ProfitCalculator` prices 2 of the 4 verticals.** A debit vertical stored as a SELL row reported
   `strike × 100 × N` — an ~11× inflation feeding `profitPercentOnPosition`, `annualizedReturn`, the
   collateral screens and the `coerceAtLeast(-maxLoss)` floor.
7. **`insufficientHistory` was unreachable on the import path** — the only path — so the flag the class
   exists for was always false, including for the GPUS shape it documents.

Found by the agent between rounds, not by the reviewer: the What-if refetch loop (same as #2, found
first), and **pasted format characters instead of escapes in three places — including `PartialCloseFeed`,
which has carried pasted U+2068/U+2069 since S2.2 against this repo's own rule.**

**Seven tests were rewritten because they could not fail for the reason they were named after.**

---

## 9. Owner decisions recorded in `CLAUDE.md`

New sections, in the file's own voice, all marked `SUPERSEDED — owner approved` where they replace a
prior rule and with the historical rule left in place:

- *A spread is a BROKER FACT, never a resemblance* (decisions 6, 7, 9)
- *SPCH's 8 short calls cover its 800 shares* (decision 17)
- *A blank closing commission is ZERO, never the opening one again*
- *The BTC preview says what it means, and the What-if answers "should I move my limit?"* (10–14)
- *The market brief may reuse the analysed Social feed* (15, 16)
- *Realized P&L: the app can now CALCULATE a basis, and reports both* (1–5)
- *OWNER-PENDING — `ProfitCalculator` prices 2 of the 4 verticals*

`README.md` gained the five product-contract changes. Reboot (decision 18) is **not reopened** — it
remains PASS from S2.3 and was not repeated.

---

## 10. Owner-pending

1. **Which basis does IBKR's Orders & Trades screen use?** One real import now logs `STOCK_BASIS` lines
   with broker/fifo/avg side by side per ticker-month. That answers it.
2. **Where do `-10,974.60`, `+1,620.56`, `-9,354.04` and `+141.89` come from?** They exist nowhere in
   this repository or its history. Please send the exact IBKR view.
3. **Get `ibOrderID` into the Flex query's field list.** It is now the single switch that turns
   auto-spread-linking back on, and it also removes the stock grain rule's `(ticker, day)` ambiguity.
   Nothing in the app can do it — it is a setting in the IBKR portal.
4. **`ProfitCalculator`'s 2-of-4 vertical memberships** (guard-protected). Not reachable today; live the
   moment #3 is done.
5. **Historical rows carrying a double-charged close fee** (`closeCommission == commission`) are NOT
   repaired — rewriting stored money on trades the owner has already seen is their call.
6. **Device QA A–E** — see §5.
7. **Unchanged and untouched from before:** the `× 1.3` premium boost in `ReportGenerator`'s abnormal-move
   alert; the assigned Covered Put realizing its premium nowhere on the manual path; cleartext
   credentials in the daily external-storage backup; `allowBackup` with no extraction rules; the
   dashboard price-refresh fan-out; the CSP prefill's ticker-level IV; the per-ticker `changePct`
   day-baseline gap; the options-vs-stock month-key split; settings rendering the Flex token in plain text.

---

## 11. Privacy

Every new log line (`SPREAD_AUDIT`, `STOCK_BASIS`, `OPTIONS_SYNC`, `WHAT_IF`) carries contract identity,
dates and money only — no token, key, account id, crumb-bearing URL, raw payload or personal identity.
`refreshWhatIf`'s catch logs the exception CLASS only, per the S2.4 crumb rule. `spreadPairToEntity` no
longer writes a raw order id into the owner-visible `notes` field. Asserted in tests for both the
delta report and the basis audit.

---

## 12. Yahoo health, and the stale-Issue lifecycle (#9, #11)

### Yahoo price AND options: HEALTHY for app users, measured on the device

| layer | result |
|---|---|
| `PRICE` (v8 chart, pre/post aware) | live intraday: SOXL 103.475 vs prev 121.82 (−15.06 %), MULL 19.63 vs 21.85 (−10.16 %) |
| `CRUMB` | `handshake ok (crumb len=11, cookie=true)` |
| `MARKET_CONTEXT` | `benchmarks resolved 4/4` (SPY/QQQ/DIA/IWM) |
| **option chain** (v7 options) | `PUT_SCAN: universe=16 red=9 scanned=4 tickers/9 expiries/421 contracts requests=13 ranked=4 providerFailure=NONE` |
| CC quote | a real two-sided book on screen: SOXL bid $430.00 / ask $480.00 / mid $455.00 |

A **bare unauthenticated** request from the same network returned **HTTP 429** on all three endpoints
(`v7/finance/quote`, `v8/finance/chart`, `v7/finance/options`). That is the whole story: Yahoo refuses
unauthenticated callers, and the app is not one — S2.3 added the browser cookie+crumb handshake
(`YahooCrumb`), which is why every number above exists.

### Issue #11 — "[Health Check] Build failed: compileDebugKotlin" → **CLOSED as stale**

Checked out `origin/main` (`7225b7af…`) into a clean worktree and ran the exact command the issue names:
`BUILD SUCCESSFUL in 1m 27s`, `grep -c '^e: file:'` = **0**. The commit it was opened against
(`0d0eaa8`, 2026-06-07) is three months behind `main`. Closed with that evidence; the scheduled health
check will reopen it if `main` ever fails again.

### Issue #9 — "[Health Check] Yahoo Finance broken (fail-http)" → **LEFT OPEN, evidence posted**

Open since 2026-05-05 with **102 auto-nudge comments**. The body's own diagnosis is right and the title
is not: the CI probe is an unauthenticated GET from a GitHub Actions IP, so it will report `fail-http`
no matter how healthy the app is. Posted the device measurements above and the recommendation to fix
the PROBE — teach it the crumb handshake, or treat `429`/`401` as *inconclusive* so only a real schema
change (`fail-shape-no-price`) opens an issue. Explicitly recommended **against** the body's step 1
("switch to Alpha Vantage"): the app's Yahoo path is not broken, and Alpha Vantage's 25/day limit cannot
carry a 13-request put scan.

Left OPEN deliberately — the CI check really does fail, so it is a live defect *in the probe*, and
closing it while the workflow reports red would hide it. **That is the stale-Issue lifecycle answer:
close what is provably fixed, keep open what is provably still failing, and put the evidence in the
thread either way.**

---

## 13. Final head and APK

| | |
|---|---|
| **Final HEAD** | `074de86e52f2a168b89dc21ff32a851570f1b144` |
| branch | `s2/ibkr-reconciliation-lifecycle-dashboard` — **PR #19 OPEN**, `no-automerge` + `needs-owner`, **never merged**; `main` untouched |
| JVM tests | **977, 0 failures, 0 errors, 0 skipped** |
| PR Build Gate | **PASS** on this head |
| Codex Gate | FAILURE — `You have reached your Codex usage limits for code reviews.` Quota-blocked; a Claude fallback reviewer was used instead and is **not** called a Codex review |
| APK | 1.0.0 (no invented bump), sha256 `28ee636132f7a6f00d883555fef1dc5a5865c1fbd46ddc994b5d4d8b124aa767`, signer SHA-1 `5d3d855c6c6c397f817df2bd0c62f16f940b1551` |
| install | built == installed == delivered; `firstInstallTime` still 2026-04-22 22:53:57 (an upgrade, not a reinstall) |
| delivered to | `/sdcard/Download/OptionsProfitTracker/OptionsProfitTracker-1.0.0.apk` |

## 14. S2.5 ADDENDUM — risk-adjusted puts + leveraged/inverse ETP discovery

Read the dated blocks in `state.md`, `gotchas.md`, `roadmap.md` and `pending-tests.md` for the detail.
The four things a successor most needs to know:

1. **The put list is no longer ranked by premium / collateral.** `PutScore` =
   `0.70 × strategicQualityScore + 0.30 × returnPercentileScore`, computed ONCE and read by both
   surfaces. The quality half REUSES `StrategicRiskAnalyzer` — do not fork a second probability model.
2. **The 2x-vs-3x RATIO is a reported data-source GAP, not an oversight.** No free source publishes it;
   name inference is wrong on live products (UVXY "Ultra" = 1.5x, SVXY "Short" = −0.5x, both cut in
   2018 and never renamed). A ratio is stored only where the registered name states an explicit
   multiple. The scan filters on `leveraged or inverse`, which IS a fact. Owner options are in
   `roadmap.md` — do not "fix" this by scraping issuer marketing pages.
3. **The PR modifies two guard-protected files** (`ProfitCalculator.kt`, `StrategicRiskAnalyzer.kt`),
   from earlier owner-ruled commits on this branch. It must not auto-merge.
4. **Device-proven, during an open session:** the risk adjustment inverted a ratio-only ranking on the
   owner's own screen — the highest return in the pool (percentile 97) finished LAST because its OTM
   probability was a coin flip. That is the feature working, not a bug.
