# OptionsProfitTracker — 2026-11-12 handoff: fast IBKR sync, converging Import, one sync a day, no phantom shares, periodic jobs registered once, New York dates

This is the complete current handoff. It supersedes the 2026-11-06 stock-price recovery handoff while
retaining that history in git and the appended state/roadmap/gotchas records.

## Heads, branch, PR

- This round started at OPT HEAD `b928645dd3290909fe71367b6e480e925ddd3e3d`.
- Final/pushed OPT HEAD: `5870eba1219f1623b0453890fc1a2da79b965946` (five commits this round:
  `319ff26`, `ccd36f0`, `cffe27d`, `9006059`, `5870eba`).
- Branch: `s2/ibkr-reconciliation-lifecycle-dashboard`; PR #19 remains OPEN and unmerged. No push to
  `main`. The owner's existing `local.properties` SDK path remains unstaged/excluded.
- `319ff26` was pushed into a GitHub Actions major outage (2026-11-11 20:26–21:07 UTC): its runs
  never left `queued` and Codex answered "We couldn't complete this review".
- `ccd36f0`: PR Build Gate and Workflow Scripts Tests passed; the exact-head Codex review
  (`5865444473`) found two P2 and no P1 — both fixed in `cffe27d`.
- `cffe27d`: PR Build Gate and Workflow Scripts Tests passed; Codex receipt `6807873204` "Didn't
  find any major issues"; the two P2 threads were answered with the fix and resolved (never without
  a fix, no override label); `check-codex-status` green.
- `9006059` (alert registration fix, owner approved): review requested in PR comment
  [6815406441](https://github.com/funzi7/OptionsProfitTracker/pull/19#issuecomment-6815406441).
  Result: PR Build Gate and Workflow Scripts Tests passed; Codex's exact-head receipt
  [6815451948](https://github.com/funzi7/OptionsProfitTracker/pull/19#issuecomment-6815451948):
  "Didn't find any major issues. Reviewed commit: `90060599e5`" (2026-11-12 05:23 UTC);
  `check-codex-status` green ("Reviewed — clear").
- `5870eba` (New York dates, draft-price job; owner's rule and "ok"): review requested in PR
  comment [6816064139](https://github.com/funzi7/OptionsProfitTracker/pull/19#issuecomment-6816064139).
  Result: PR Build Gate and Workflow Scripts Tests passed; Codex's exact-head receipt
  [6816115535](https://github.com/funzi7/OptionsProfitTracker/pull/19#issuecomment-6816115535):
  "Didn't find any major issues. Reviewed commit: `5870eba121`" (2026-11-12 06:07 UTC);
  `check-codex-status` green ("Reviewed — clear"). PR #19 stays OPEN and unmerged with
  `no-automerge` and `needs-owner`.
- The final agent-memory SHA is the canonical finalizer result and must be read from git.

## Owner preference state on the phone

Auto-sync is ON — the owner switched it on during this round. It had been left OFF by the 2026-11-06
device round, which is why the owner reported "sync from ibkr again dont work": no IBKR sync had
completed since 2026-11-04.

## What the owner reported, and what was done

1. "sync from ibkr again dont work" — after the switch, each sync ran 2.3–4.5 minutes and the system
   stopped 5 of 7 worker runs. `Regex.findAll` over the 5.3 MB Flex payload costs matches × payload
   length on Android (54.8 s per pass against 0.13 s with one matcher; no difference on OpenJDK).
   `data/remote/RegexScan` now does every payload scan; output is pinned to the pre-change parser.
2. "i press the ייבא 966 פעולות and nothing hapenes" / "so fix that why i need to make another sync
   and be in the same situation again" — an automatic worker sync had superseded the Flex preview,
   the refusal went to a message the preview does not draw, and Cancel blanked the credentials. An
   Import tap on a superseded preview now fetches again under ONE `Kind.MANUAL_SYNC` ownership and
   imports that payload in the same turn when it states exactly the tapped trades.
3. "auto sync from ibkr is only 1 per day …" / "no need for hourly, it will pull the same file over
   and over again" / "ibkr sync should be repeated if first one is failed" — SUPERSEDED, owner
   approved: the periodic job and the Settings frequency choices. One scheduled sync a day at 04:00
   `America/New_York`; it repeats hourly within the day only while it has not brought the day's
   file; one catch-up at app start/boot only when nothing synced that New York day and the daily
   slot does not already serve today (`automaticCatchUpDue`, review fix). A run that has the day's
   file re-arms for 04:00 on the NEXT New York date. Settings states the daily time and the repeat
   rule, not a dated "next sync".
4. "why in cc reminder theres phantom ticker nebx …" — the snapshot kept `shares: 100` for a sold
   holding under an open option. A payload whose holdings list is proven complete
   (`FlexHoldingsCompleteness`) now zeroes the shares it does not list — also when the report lists
   no position at all (review fix).
5. 2026-11-12, owner: "1. yes fix" — the price-alert job. App start and boot re-registered the alert
   work with `UPDATE` on every process start, cancelling the system job that had just woken the app;
   at 03:45 the phone ended that unprotected process mid-check and no alert check ran until the
   owner opened the app at 11:47. Now `AlertWorker.ensureScheduled` leaves an existing registration
   at the wanted interval untouched (`AlertRegistration.needed`); only an explicit Settings change
   updates it.
6. 2026-11-12, owner: "3. yes" — to "check on IBKR that the IRE PUT 6.0 (Nov 20) open quantity is
   12, as the app shows". Read as confirmed; the worker's `partial close refused IRE …` line is
   noise.
7. 2026-11-12, owner: "ok" — to "the daily draft-price update registers itself the same way … do
   you want the same fix there?". App start calls `DraftUpdateWorker.ensureScheduled`; the shared
   pure rule is `PeriodicRegistration.needed`.
8. 2026-11-12, the owner's date rule: "every trade … needs to be שייך to the timezone NY regardless
   the time of my timezone, i mean if i close a trade on 1st but in NY is still 31st so in the pnl
   its in the 31st aka last month and no in the new month". Realized P&L already obeyed it (Flex
   `tradeDate`, default date of a manual open/close, `NewYorkMarketPeriod` in the reports). 45
   leftover zone-less `LocalDate.now()` reads in eleven files (old file importers' fallback dates,
   tax screen default year/month, "start of month" label, feed "today" boundary, day counts to an
   expiry or an earnings date) now use `NewYorkMarketPeriod.currentDate()`; `NewYorkDateRuleTest`
   allows the phone's date only in fifteen housekeeping stamps.

No P&L, realized-ledger or reconciliation rule changed.

## OPEN with the owner — November MULL / RKLX stock P&L (do not implement without an explicit yes)

Owner, 2026-11-12: "2. why not from 1st? explain". Explained with the rows read from the phone: the
month does start on the 1st (a Sunday; first sales Monday 11-02). Shown: MULL −5,678.18, RKLX
−926.74 (the 11-02 sales). Stored but not shown: MULL 11-04 −868.07 and 11-06 −1,796.59, RKLX 11-04
−864.43 = −3,529.10. Displayed month −7,382.88; from all stored rows −10,911.98. Cause:
`StockRealizedLedger.decideProjection` (in the code since `3a76a75`, 2026-11-05) lets rows replace a
published ticker-month only with prior authority, no published value or a cent-exact match; the
11-02 totals were published by the 2026-11-04 20:38 New York sync, before authority existed; the
next completed sync (11-11) also carried 11-04 and 11-06, so both pairs are HELD for ever. Candidate
rule put to the owner, NOT implemented: a published total that equals the rows up to some day, with
every other row dated after that day, is an older snapshot of the same month — rows take over.
The owner's reply was the date rule of item 8, not a yes or no; it is not the cause here (10-31 and
11-01 were a weekend; the hidden sales are dated 11-04 and 11-06). The question was asked again.
The owner also thinks IBKR groups trades by their own timezone ("i think"); that is NOT
established — one check with stored execution times (Sep 1–28 options, app 4,844.09 vs IBKR
4,741.75) did not support it: no close on 09-28, and the three closes dated 08-31 are profits
(+174.11), which would raise IBKR's figure, not lower it.

## Validation

Compile gate zero `^e:` lines; full JVM 2375 tests / 175 classes / 0 failures / 0 errors / 2 existing
skips; `clean assembleDebug` passed (42/42). APK `1.0.0` / code `1`, 64,865,240 bytes, SHA-256
`6a746e6df3a67d6e63c34ebe07a5a2d5cd6a27de622d25a04873a39722a35bc0`, signer unchanged.

## Device

Eight builds were installed in place, each after the three signer gates of `PHONE_BUILD.md` §4 with
the app idle and data preserved: on 2026-11-12 phone time 02:12:32 `0a868ac4…`, 03:10:02
`2ca5f602…`, 03:25:23 `7d7c661f…` (= `319ff26`), 03:37:42 `c470f8c7…`, 04:01:58 `029bb44e…`
(= `ccd36f0`), 04:41:13 `ab2a37e9…` (= `cffe27d`), 12:13:34 `f4591b39…` (= `9006059`) and 13:01:07
`6a746e6d…` (= `5870eba`), the last also delivered to `/sdcard/Download/OptionsProfitTracker/OptionsProfitTracker-1.0.0.apk`. The agent
never launched the app and started no sync, Import or provider request.

Verified from the phone's log with the owner's own taps: the 5,344,309-character payload parsed in
0.72 s (2 min 19 s before) with identical row counts; the Import completed ("ok manual import now
work"); `flex_price_sync` is CANCELLED in WorkManager; `holdings list complete=true … zeroed sold-out
shares: [NEBX 100→0]` with the stock value equal to IBKR's own 14,098.52 ("nebx is gone").

Seen in the log without anyone opening the app: at 12:18 (build `f4591b39…`) and again at 13:01:52
(the last build) the alert job started the app, the new code logged `Alert work already registered
at 15min — left untouched` and, on the last build, `Draft B-S update already registered daily —
left untouched`; no `ALERT_WORKER SCHEDULED`; each check ended at once (outside the alert's trading
window); the alert job stayed listed; no crash.

NOT verified with real data: the superseded-preview refresh; the daily run and its repeat; the
"tomorrow" re-arm; the new Settings line; the worker's copy of the sold-out zeroing; the "no
position at all" zeroing; the withheld catch-up; an alert check that works for seconds while bound.

## State of the phone when the round ended (13:05 phone time on 2026-11-12, read-only)

Four system jobs for the app: the daily Flex run held for 15:00 Asia/Bangkok = 03:00 New York (the
request an older build left; `KEEP` keeps it; from the run after it the time is 04:00 New York), the
alert check (15 minutes), and two daily jobs. Thermal status normal.

## First thing next session

1. Read the first daily runs: `SYNC_SCHED Flex file …`, `Pre-market sync requested …`, `Daily sync
   received the previous file …`. The owner's file, requested at 15:10 New York on 11-11, was
   stamped `whenGenerated=20261111;093051`: whether IBKR's new file exists at 03:00 / 04:00 New York
   is not known. A run that has the day's file must log a re-arm for the NEXT New York date.
2. Confirm alert checks complete inside the trading window (from 04:00 New York) with no
   `ALERT_WORKER SCHEDULED` at process start.
3. Ask for / act on the owner's answer about the November MULL / RKLX rule.

## Open owner decisions

- The November MULL / RKLX projection rule above (P&L domain).
- OS-stop protection for explicit sync taps (recommendation: leave it now that a sync takes seconds).
- With auto-sync OFF, app start's `cancelAll` also cancels the explicit owner slots.
- OPT `TODO.md` 3b: a catch-up that is already enqueued is not re-checked when it finally runs.

The financial-parity residuals and the standalone market-agent plan are unchanged.
