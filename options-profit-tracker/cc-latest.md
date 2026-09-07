# cc-latest.md — OptionsProfitTracker handoff (latest)

> Rolling single-file handoff. Every future prompt OVERWRITES this file with a fresh, complete summary of the just-finished task and then prints its commit SHA.

## Latest task: S2.1 — whole-repo IBKR financial audit + Covered Put projection + dynamic market brief (2026-09-07/08, Claude Code)

- Base main SHA: `7225b7af16c183de00a9f064ead03a01ad6af1d3` (unchanged — main was never pushed to)
- Task branch: `s2/ibkr-reconciliation-lifecycle-dashboard` (the SAME branch as S2; no replacement PR)
- Starting head: `2ee5d842b422ff5f6ad91c761c740baade42e311`
- Final branch HEAD: `95007094dabfaa56cb7e93c549cc16b294de31ce`
- PR: <https://github.com/funzi7/OptionsProfitTracker/pull/19> — still **OPEN**, labels `needs-owner` + `no-automerge`, **NOT merged**. PR #20 was not created.
- `local.properties` (`sdk.dir=/opt/android-sdk`) is modified on disk and deliberately **NOT committed**.

### Model phase policy — recorded factually
The session ran end to end on **Opus 5 (1M context)**, selected by the owner via `/model`. The agent cannot switch models programmatically, so the planning phase did not run on Fable; planning and implementation both used the strongest model available in the session. Four read-only investigator subagents were used for the audit fan-out (whole-repo P&L, ambiguous contracts + stock realized, market brief/calendar/sessions, covered put + docs); all four completed.

### Protected paths touched (explicit owner approval)
- `ProfitCalculator.kt` — matches `**/ProfitCalculator*.kt` in `.claude-guard.json`. **The only change is the owner-approved Workstream B branch** (verified with `git diff` on the file: 25 added lines, nothing else).
- `ProfitCalculatorCoveredPutTest.kt` — the same glob catches the test file; 8 new tests added there.
- No migration, database, AppPreferences, AvgCostResolver, BlackScholes or StrategicRiskAnalyzer file was touched. Room stays at v31, no migration written.

### Workstream A — whole-repo IBKR financial audit

**Invariant enforced everywhere:** a surface that can display or aggregate a CLOSED broker-matched trade must use `ibkrRealizedPnl ?: localCalculation`.

Eight bucket-(B) violations found and fixed **at the call sites** (no extra P&L-locked edits):
1. `TaxReportScreen.kt:175` — the tax report's realized total, its monthly table, assignment income, win/loss counts and the Israeli tax estimate. This value is also **PERSISTED** via `saveLossCarryForward`, so a wrong number left the DB. Highest severity of the eight.
2. `SettingsScreen.kt` `exportTaxCsv()` — the CSV's `RealizedPnL` column silently disagreed with its own `IBKR_PnL` column on every reconciled row.
3. `AddPositionViewModel.kt` `closedIncome` — "פוזיציות קיימות" on the monthly-income card disagreed with the dashboard MTD for the same rows.
4. `AddPositionViewModel.kt` `monthIncome` — the "💡 חסר $Y ליעד" month suggestions, and whether a month was suggested at all.
5. `AddPositionViewModel.kt` `toSnapshot()` — the ticker-analysis card's average profit per trade, best strategy, win rate and losing-streak detection.
6. `AddPositionViewModel.kt` spread pairing — was all-or-nothing: as soon as ONE leg was broker-matched the other contributed `?: 0.0`, dropping its entire P&L. Now per-leg precedence.
7. `ClosePositionScreen.kt` — reachable in edit mode ("עריכת סגירה") on an already-reconciled row. Both the "רווח/הפסד" headline and the **ActivityEvent amount it writes to the DB** used the local recomputation; the feed row stayed wrong until the next cold-start repair pass. A small Hebrew line now says the figure came from IBKR.
8. `CoveredPutDetailScreen.kt` — a CLOSED covered put showed a live mark-to-market card titled plainly "רווח/הפסד", reading as the final result while ignoring `ibkrRealizedPnl` entirely. Closed rows now get a realized card sourced authoritatively; the live card is open-only.

Plus one hardening: `ReportGenerator.toPositionSummary` line 120 — `expectedProfitAtExpiration` returns the LOCAL `realizedPnL` for any non-open row, so `PositionSummary.expectedProfit` on a closed broker-matched row bypassed the broker value. No surface rendered it today (every consumer branches on status first), but one unguarded `.expectedProfit` read would have. Closed.

**Confirmed NOT violations** (checked, left alone): every `PositionSummary.realizedPnL` consumer (the single constructor already applies the precedence), the calendar/reports/annual/monthly totals, `PortfolioSnapshotDaily`, `wheelPositionPnl`, the activity feed's stored amounts, stock-realized surfaces, and roughly 30 diagnostic `Log` lines.

**Answers to the four audit questions**
1. *Does any path subtract commission from an `ibkrRealizedPnl`-derived value?* **No.** `fifoPnlRealized` is already net of commission and the value is never arithmetically modified after the `?:`. Commissions are always their own display row.
2. *Can a broker-reconciled row reach the `closeProfitPercent` fallback?* **Yes** — `NULL_METHOD_BTC` (`CLOSED_BTC` + `closeMethod == null` + no usable close price) and `BTC_PROFIT_PERCENT`. `applyClosed` writes `ibkrRealizedPnl` but leaves status/method untouched when a cycle has no close hint and a zero close price. Harmless now that all eight surfaces prefer the broker value.
3. *Does `expectedProfitAtExpiration` return `realizedPnL` for a CLOSED position?* Yes — handled by the hardening above.
4. *Who fills `PositionSummary.realizedPnL`?* Only `ReportGenerator.toPositionSummary`, and it already honoured the precedence.

**A3 — the audit itself.** New pure `domain/usecase/ReconciliationAudit.kt` (14 unit tests). It compares each uniquely matched pair AFTER the write, against the value the app will actually display, and emits ONE bounded `IBKR_AUDIT` line with 11 metrics: cycles seen, closed cycles seen, uniquely matched, ambiguous, unmatched, realized/premium/commission/quantity/timestamp mismatches, and the largest realized delta in cents, plus a CLEAN/DIVERGENT verdict. Commission is compared as the round-trip total (the open/close split is presentation). A missing execution instant is never counted as a timestamp mismatch, because a 16:00 ET fallback is not evidence. Samples carry contract identity only — capped at 5.

**A4 — the three ambiguous contracts, resolved as a question (NOT guessed).** Device DB evidence: in all three cases the candidate rows' quantities sum EXACTLY to the broker cycle quantity, and premiums agree:
```
BTCI|PUT|33.0|2026-05-15|SELL|2   → rows 12(q1), 208(q1)                 1+1 = 2
IRE|PUT|6.0|2026-09-18|SELL|8     → rows 3534(q6), 3538(q2)              6+2 = 8
SPCH|CALL|10.0|2026-09-04|SELL|18 → rows 3529(q7), 3536(q1), 3537(q10)   7+1+10 = 18
```
This is a **1-cycle : N-rows partition** — the owner recorded one broker round trip as several partial-close rows — not a choice between alternatives. Matching any single row would rewrite its `numContracts` to the full cycle quantity and stamp the whole cycle's realized P&L on it while its siblings kept theirs, roughly double-counting the contract. Open dates are identical within each contract, and both IRE rows even share a close date, so no date rule can break the tie either. **The reconciler still refuses to write.** The only change is the ambiguity REASON, which now names the shape (`cycle_split_across_N_rows_qty_sum_matches`); 4 new tests pin that naming the shape never turns a refusal into a match.

**A5 — stock / short-stock buy-to-cover.** `captureStockRealized` has **no `buySell` filter**, so BUY rows including buy-to-cover are already summed: the stock-realized TOTALS are complete and correct. The gap is presentation only — `importStockSoldEvents` IS SELL-only, so a buy-to-cover produces no feed row and no drill-down entry. Concrete case: MULL 2026-07 aggregate ≈ **$3,159.07** with only one SELL feed event that has `amount = 0.00`; MULL is the one ticker with a recorded short (54 shares @ 714.78, 2026-06-18) that is now closed. Left for the owner — see backlog item 1.

**A6 — idempotency.** Four consecutive full imports on the real feed, all identical: `updated=0 inserted=0 unchanged=261 ambiguous=3 noMatch=0`, verdict CLEAN each time.

### SECURITY — found on the device by the audit, not previously known
Logcat is readable by any process with `READ_LOGS`, any `adb logcat`, and any bug report. The import path was printing, **on every sync**:
- the raw Flex XML head, the EquitySummary and StatementOfFunds sections (each carrying `accountId`);
- the full per-trade attribute map for OWL (`accountId` included);
- the **entire `<AccountInformation>` element**: account number, the owner's legal name, home address, residential address, email, account type and trading permissions;
- the AlphaVantage API key inside its request URL (`IvService.kt:373`; the Massive call two hundred lines below already redacted its key).

Measured before: 14 lines containing `accountId=`/`U…`, 1 raw `<FlexQueryResponse`. Fixed with a new pure `domain/usecase/FlexLogRedaction.kt` (10 unit tests, synthetic fixtures only): identifier masking for account id/alias/name/address/email/phone plus any email anywhere and the Flex `t=`/`q=` credentials, and an `enabled` flag that gates raw payload dumps **OFF by default**. The `<AccountInformation>` dump was removed outright — the block needs one number out of it. Measured after, same device, same feed: `accountId=U` 0, bare `U\d{6,}` 0, `<FlexQueryResponse` 0, `apikey=` 0, `primaryEmail="…@` 0, address strings 0.

### Workstream B — Covered Put expected profit (owner-approved)
`expectedProfitAtExpiration` now has a state-aware `COVERED_PUT && SELL` branch mirroring the CSP one, inserted before the `direction == BUY` branch:
- **ITM (stock ≤ strike) → `0.0`** — assignment is the expected outcome, and the approved accounting realizes $0 on the option and folds the premium into `CoveredPutCalculator.effectiveCoverPrice` (25 − 1.40 = 23.60 for the MULL fixture), booking the gain on the SHORT STOCK side.
- **OTM (stock > strike) → `premiumProfit − commission`**, honouring `autoCloseTargetPercent` with the same `>0 && <100` clamp CSP uses.
- **Unknown price → the same optimistic fallback as CSP** (assume it expires worthless). Never assume assignment.

This removes the contradiction the S2 review flagged: an open covered put promised the full premium while its assignment realized $0. No double count — this function projects the OPTION row only, and every consumer sums option rows; the premium lives on the short side.
Known pre-existing quirk, unchanged and out of scope: `totalPremium` hard-codes ×100 and ignores `PositionEntity.contractMultiplier` for every strategy, not just this one.

### Workstream C — dynamic market brief
- **Universe roll-call line removed** (`Kind.UNIVERSE` gone). It restated the portfolio the dashboard already shows and pushed real news below the fold. `MarketBrief.universe` is still populated for callers.
- **"(+N)" truncation removed everywhere** — `joinCapped` replaced by `joinAll`; `maxTickersPerLine` is gone from the API. It used to hide exactly the tickers the owner needed.
- **`MarketCalendar` is now the single source of truth** (12 unit tests): `nyseHolidayNames(year)` carries Hebrew names, `nyseHolidays` is literally its key set, `closedReason(d)` puts the weekend branch first (because `observed()` shifts fixed-date holidays, so on Sun 25-Dec the only truthful reason is the weekend), and shifted holidays are suffixed "(נצפה)".
- **Full session model**: `sessionAt(date, time)` → OVERNIGHT / PRE_MARKET / REGULAR / AFTER_HOURS / CLOSED_FOR_THE_DAY / NON_TRADING_DAY, including the NYSE **13:00 ET early closes** (day after Thanksgiving, Christmas Eve, July 3 when each is a plain weekday). Takes the clock as a parameter so it stays pure and cannot be frozen in a keyless `remember`. The dashboard session badge and `marketOpenCountdownText` now read the same model — the badge previously claimed regular trading for three hours after an early close.
- **`build()` API change**: `tradingDay: Boolean` + `sessionHasTodaysPrices: Boolean` replaced by one `session` value, so a caller cannot pass a combination that cannot happen.
- **Event lifecycle wording**: expiries read "פקעו היום בנעילת המסחר" once the regular session ends; movers switch to past tense at the same moment; pre-market and overnight state plainly that the prices shown are the previous session's, which is why no movers are listed.
- **What the app cannot know, it does not claim.** Nothing in the app records whether an earnings report has been released — only its calendar date (`AlertWorker`'s cache stores `{checked, next}` and discards Finnhub's `hour` and `epsActual`). So "פורסם היום" and "צפוי בהמשך היום" are never emitted; after the session the wording drops to "דוחות כספיים שנקבעו להיום".
- **Factual reasons only**: the social-mention filter no longer accepts `analyzedTickers`, which is built from a bare `\bTICKER\b` match and made "the KEY takeaway" / "ALL of them" / "IT spending" into stated reasons for price moves. Only an explicit `$`/`@` cashtag or a real company-name match counts. Separately, "today's posts" now means **New York today**; it used the device timezone (Thailand, UTC+7), so for ~11 hours a day the brief mixed a Bangkok-today post list into a New-York-today briefing.

### Tests + compile
- Compile gate: `grep -c "^e: "` = **0**, `BUILD SUCCESSFUL`. `git diff --check` clean.
- **187 JVM tests, 0 failures, 0 errors** (105 → 163 → 187 after the review round).
- New test files: `ReconciliationAuditTest`, `MarketCalendarTest`, `FlexLogRedactionTest`.

### Device QA — PERFORMED (ADB `192.168.1.117:34617`, non-destructive throughout)
- Signer gate passed three ways (new APK / keystore / installed app all `5d3d855c6c6c397f817df2bd0c62f16f940b1551`). Installed with `install -r`; `firstInstallTime` stayed `2026-04-22 22:53:57` across all installs and the Room DB/WAL files were untouched. No uninstall, no `pm clear`, no data deletion, no reboot.
- **8 full IBKR syncs + imports** (790 trades / 265 cycles each) across the task. The review-round build applied ONE commission correction (SPCH 13C open commission 6.83 → 1.37, the split-fill proration fix) and then converged: `updated=0 inserted=0 unchanged=261 ambiguous=3 noMatch=0`.
- **`IBKR_AUDIT: cycles=265 closed=259 unique=256 ambiguous=3 unmatched=0 | mismatches realized=0 premium=0 commission=0 qty=0 timestamp=0 maxRealizedDelta=0c refusedRealized=38260c | verdict=CLEAN_BUT_INCOMPLETE`**. **Zero final-realized divergence across all 256 uniquely matched broker cycles**, and the run now also states what it did NOT check: **$382.60** of broker-reported realized P&L sits on the three refused split cycles. The earlier plain `CLEAN` overstated the coverage and was corrected in the review round.
- All three ambiguities logged with the new self-explaining reason and were **not** overwritten.
- 0 FATAL, 0 Room/SQLite/migration errors. PNL log storm still 0/0/0.
- **Today was Labor Day (Mon 2026-09-07 NY)**, so the market brief was validated on a real holiday: it renders **"השוק בארה״ב סגור היום — יום העבודה. אין מסחר."**. Verified on screen: no universe roll-call line, no "(+N)" anywhere, the old "(סוף שבוע או חג)" hedge gone, no movers on the closed day, only the one relevant ticker (SOXL 127C 09.09 expiring this week), badge "סגור" and countdown "15 שעות לפתיחה" both consistent with the same session model.
- Privacy re-verified on the real feed after the fix: 0 occurrences of the account number, `accountId=`, raw `<FlexQueryResponse`, `apikey=`, the owner's email or address.

### APK / signer / delivery
- `app/build/outputs/apk/debug/app-debug.apk`, versionName **1.0.0**, **64,723,609 bytes**.
- SHA-256 `1ef1450e6ae3e26dd3d9dcbe6edef8ca0e174808fafc3ead57ff652653a01196`.
- Delivered to `/sdcard/Download/OptionsProfitTracker/OptionsProfitTracker-1.0.0.apk`; the on-device hash matches the local one exactly.

### PR checks / review
- `build-gate` was re-run on head `e91488b`.
- **Codex Gate is still RED.** The owner confirmed mid-task that the Codex account is out of quota, so no Codex review has run on any head of this PR. `codex-p1-acknowledged` was deliberately **NOT** added — forcing the gate green would be dishonest. Instead I reviewed the PR myself across four dimensions; see the review round below.
- Per the project gate, validation therefore remains **failed** until a Codex review actually runs.

### Review round — 13 defects found by reviewing this PR myself (Codex has no quota)

The owner confirmed mid-task that Codex is out of quota, so I reviewed the PR across four
dimensions (money/data integrity, runtime+UI, security/privacy, tests+regressions). Everything that
reproduced is fixed, with a test. Several of these were introduced by S2.1 itself.

**Money**
1. `FlexSyncWorker` summed EVERY closing fill still inside the Flex window into each new
   partial-close slice, so the second partial close of a contract re-added the first one's realized
   P&L and commission — closing 4 then 3 of a 10-lot booked 120 and then 210 instead of 90, and
   `ibkrRealizedPnl` is authoritative downstream. New pure `FlexCycleBuilder.attributeLatestFills`
   consumes fills newest-first, prorates one that straddles the boundary, and weights the close price
   by quantity instead of taking the first fill's.
2. A fill that crosses zero is split between two cycles, but its commission was copied whole into
   both, so `realizedPnL` subtracted it twice. Now prorated by quantity. **This corrected a real row
   on the device: SPCH 13C open commission 6.83 → 1.37.**
3. The tax report's loss carry-forward was only ever written on a loss, and nothing clears it — a
   year that turns profitable kept deducting a stale loss forever. It now writes 0 on a profit. The
   broker-authoritative fix is exactly what flips a year's sign, so this was latent and became live.
4. `applyClosed`'s no-close-evidence branch left the row OPEN but still stamped the cycle's realized
   P&L and close commission on it. Nothing ever clears that, so a later manual close was silently
   overridden and the ticker analysis counted an open row as a finished trade.
5. `resolveClaims` could re-home a losing cycle onto a still-OPEN row, closing a live position and
   booking another round trip's P&L on it. Losers now become orphan inserts.
6. A partial close in edit mode copied `ibkrRealizedPnl` onto BOTH resulting rows, so every aggregate
   counted it twice. Split rows now clear it — and an explicit owner edit of a reconciled close drops
   the broker value, so the edit takes effect instead of being silently discarded.
7. `CoveredPutCalculator.assign` folded the premium into the cover basis even for shares with no
   cover, so on an oversized assignment the premium on uncovered shares simply vanished ($70 on the
   14-contract MULL fixture), breaking the file's own "combined is unchanged" contract.
8. The CC premium-yield banner divided a per-contract premium by the WHOLE holding's cost basis: 500
   shares against one call read 0.44% instead of 2.22% and fell to the "חלש" tier; the inverse case
   inflated it threefold. The capital is now scaled to the shares the option actually covers.

**Privacy — more of what Workstream A had started**
9. `FlexQueryService` let `HttpURLConnection`'s exception message — which on Android carries the full
   request URL **including the Flex token** — reach `FlexResult.error`, which the sync worker logs and
   the settings screen displays. Redacted at the source, so no caller can leak it.
10. `FlexLogRedaction` had three defects of its own: it never masked the LAST attribute of an XML
    element (`street="…"/>` survived untouched), it stopped at a comma inside a value so the second
    line of an address survived, and its nested lazy quantifier overflowed the stack at ~15 KB while
    its own doc claimed it was safe on any string. Rewritten as explicit quoted / single-quoted / bare
    alternatives — linear, no nesting — plus JSON shapes, the DU/DF/F account prefixes, bearer tokens
    and more credential parameter names.

**Honesty**
11. The audit reported `verdict=CLEAN` while REFUSING to check cycles. It now counts refusals and the
    money they carry and reports `CLEAN_BUT_INCOMPLETE`. On the real feed that surfaces **$382.60** of
    broker-reported realized P&L sitting on the three split cycles — previously invisible.
12. The brief claimed "אין תנועות חריגות היום" when it had **no price data at all** (empty snapshot,
    failed sync, fresh install) — inventing a fact from missing data. It now says prices are
    unavailable. The dashboard session badge and open-countdown were frozen in a keyless `remember`
    and contradicted the brief beside them; both now read a live clock and the brief recomputes on a
    one-minute ticker (device: the countdown moved 15h → 13h across runs, proving it ticks).
13. Ticker lists wrap now that truncation is gone, so a ticker could be separated from its own
    percentage — items are joined with a NON-BREAKING space (device shows `SOXL 127C 09.09`). New
    Year's Day was shifted Saturday→Friday, which closes a day the NYSE actually trades and put a
    previous-year key into the map; Sunday→Monday only now. And `MarketBriefBuilder` kept a private
    copy of the "today's prices exist" rule while the tested one in `MarketCalendar` had no callers.

**Investigated and NOT changed:** a reported case where a closed cycle consumes the OPEN row an open
cycle needs could not arise — `buildNetPositionCycles` aggregates one contract key into a single
cycle, and a key with both closed and open contracts is a PARTIAL cycle handled by the slice path,
which neither `matchClosed` nor `matchOpen` sees.

### Left for the owner to decide
1. **Buy-to-cover feed rows** (A5): stock-realized totals are already complete, but a short closed by a BUY produces no feed row or drill-down entry, so the itemization under-reports what the total says — ≈$3,159.07 for MULL 2026-07. Adding a `STOCK_SHORT_COVERED` event would be feed-only and must not touch any sum. Not implemented: what appears in the owner's feed is their call.
2. **The three split cycles** (A4): correcting them means merging each set of partial-close rows into one, or teaching the reconciler to split a cycle across rows by `(closeDate, quantity)`. The latter would deterministically resolve BTCI and SPCH but provably **cannot** resolve IRE from the data on the device (both rows close the same day, and the raw payload is not retained).
3. Whether the same-second `(timestamp, amount)` feed fingerprint should be strengthened with `tradeID`/`ibExecID` (both present in the payload, both currently discarded). Feed-only; nine ticker-months are affected, totals unaffected.
4. **Credentials on external storage (found in the review round, NOT changed).** `BackupService`
   serializes the Flex token, the Flex query id and eleven third-party API keys into cleartext JSON
   and writes it to `getExternalFilesDir(null)/auto_backups/`, automatically once a day from
   `MainActivity`, keeping 15 copies. Any app with `MANAGE_EXTERNAL_STORAGE`, and a plain `adb pull`,
   can read them. This is a larger exposure than the logcat leak this task fixed.
5. **`allowBackup="true"` with no extraction rules (same finding).** The `app_settings` DataStore
   holding those same credentials is therefore eligible for Google Auto Backup, so the broker token
   can leave the device to Drive and be restored onto another device by anyone with the account.
   Both 4 and 5 change what a restore can recover, so they are owner decisions, not agent ones.

### What was NOT verified
- No reboot test (explicitly forbidden this task).
- No Codex review (account usage limits).
- The owner's own visual comparison against the IBKR app — see `pending-tests.md`.
- The A5 buy-to-cover conclusion rests on three convergent facts (the aggregate/feed delta, the single recorded MULL short, and the now-positive net stock position); the raw Flex payload is not retained on the device, so the individual BUY row's attributes could not be read back directly.

### Complete remaining backlog (nothing deleted)
Everything preserved from S2 remains open: owner review/merge of PR #19; Codex review; the reboot test; dashboard alert-banner reappear (GP1); the buy-to-cover feed gap; the social backlog; PR #18 automation-core findings; Room/Hilt DB-builder consolidation; expiry-banner undercount; alerts pre-market; calendar progress-bar jump; tables-UX sort persistence; the 2026-07-04 device items (R1a/R1b/GP1 failed; GN1/GN2/GO/GP2/R2-restore/Covered-Put-core pending); and every earlier roadmap entry.
Newly added by S2.1: the three owner decisions above, and unifying the four worker session windows (FlexSyncWorker 4–20, AlertWorker 4–19, DraftUpdateWorker 4–19, IvService 4–19, OptionsTrackerApp 9–18) onto `MarketCalendar.sessionAt` — deliberately NOT done here because it would silently change auto-sync/alert cadence on holidays.

## Pointers
- `state.md` — commit chain; `roadmap.md` — backlog; `gotchas.md` — hard-won lessons; `pending-tests.md` — owner device checklist.
- `PHONE_BUILD.md` — build/install/logcat runbook (test count updated to 163 in S2.1).
