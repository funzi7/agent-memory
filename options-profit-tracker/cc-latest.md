# OptionsProfitTracker — 2026-11-11 handoff: fast IBKR sync, converging Import, one sync a day, no phantom shares

This is the complete current handoff. It supersedes the 2026-11-06 stock-price recovery handoff while
retaining that history in git and the appended state/roadmap/gotchas records.

## Heads, branch, PR

- This round started at OPT HEAD `b928645dd3290909fe71367b6e480e925ddd3e3d`.
- Final/pushed OPT HEAD: `cffe27df5441525355ff32fcd122ca523bdac60d` (three commits this round:
  `319ff26`, `ccd36f0`, `cffe27d`).
- Branch: `s2/ibkr-reconciliation-lifecycle-dashboard`; PR #19 remains OPEN and unmerged. No push to
  `main`. The owner's existing `local.properties` SDK path remains unstaged/excluded.
- `319ff26` was pushed into a GitHub Actions major outage (GitHub's status page, 2026-11-11
  20:26–21:07 UTC): its three runs never left `queued` and Codex answered the review request with
  "We couldn't complete this review". Nothing was reviewed or gated for that head.
- `ccd36f0`: PR Build Gate and Workflow Scripts Tests passed; the exact-head Codex review
  (`5865444473`) found two P2 and no P1 — the sold-out zeroing was skipped when the report lists no
  position at all, and an app-start/boot catch-up could run beside an overdue daily request. Both
  are fixed in `cffe27d`.
- Exact-head Codex review for `cffe27d` requested in PR comment
  [6807755428](https://github.com/funzi7/OptionsProfitTracker/pull/19#issuecomment-6807755428).
  For `cffe27d`: PR Build Gate success (`43105636380`), Workflow Scripts Tests success
  (`43105636308`), and Codex's exact-head receipt
  [6807873204](https://github.com/funzi7/OptionsProfitTracker/pull/19#issuecomment-6807873204):
  "Didn't find any major issues. Reviewed commit: `cffe27df54`" (2026-11-11 21:50 UTC). The two P2
  threads of the `ccd36f0` review were answered with the fix (replies `4543605799`, `4543606088`)
  and resolved. The first (`4543319208`, `FlexSyncWorker.kt`) was NOT outdated — the fix is at the
  early exits, not at the lines the thread is anchored to — so the Gate stayed red until it was
  resolved; nothing was resolved without a fix and no `codex-p1-acknowledged` override was used.
  `check-codex-status` turned green at 21:54 UTC ("Reviewed — clear"). PR #19 stays OPEN and
  unmerged with `no-automerge` and `needs-owner`; Merge Bot ran twice after the green Gate and did
  not merge; `main` is unchanged at `7225b7a`.
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
   file; one catch-up at app start/boot only when nothing synced that New York day. A run that has
   the day's file re-arms for 04:00 on the NEXT New York date (`nextDailySyncTomorrow`), never an
   hour later the same morning. Settings states the daily time and the repeat rule, not a dated
   "next sync".
4. "why in cc reminder theres phantom ticker nebx …" — the snapshot kept `shares: 100` for a sold
   holding under an open option. A payload whose holdings list is proven complete
   (`FlexHoldingsCompleteness`) now zeroes the shares it does not list — also when the report lists
   no position at all (`StockSnapshotSoldOut.zeroWhenNoPositionIsListed`, review fix).
5. Review fix: the automatic catch-up at app start/boot is withheld while the daily slot already
   holds a request that serves today (`FlexSyncQueue.automaticCatchUpDue`), so a phone that was
   offline at 04:00 New York downloads the file once when the network returns.

No P&L, realized-ledger or reconciliation rule changed.

## Validation

Compile gate zero `^e:` lines; full JVM 2368 tests / 173 classes / 0 failures / 0 errors / 2 existing
skips; `clean assembleDebug` passed (42/42). APK `1.0.0` / code `1`, 64,865,240 bytes, SHA-256
`ab2a37e92edc68db8364e981c7e912ada2545c368af3916a7311d722dad0ab0d`, signer unchanged. An independent
read-only review of the first diff found no serious defect and three small ones, all fixed.

## Device

Six builds were installed in place during the session, each after the three signer gates of
`PHONE_BUILD.md` §4 with the app idle and data preserved: 02:12:32 `0a868ac4…`, 03:10:02
`2ca5f602…`, 03:25:23 `7d7c661f…` (= `319ff26`), 03:37:42 `c470f8c7…`, 04:01:58 `029bb44e…`
(= `ccd36f0`), and the final one at 04:41:13 phone time (2026-11-11 21:41 UTC) `ab2a37e9…`
(= `cffe27d`), also delivered to
`/sdcard/Download/OptionsProfitTracker/OptionsProfitTracker-1.0.0.apk`. The agent never launched the
app and started no sync, Import or provider request. The last three builds have not run on the
phone.

Verified from the phone's log with the owner's own taps: the 5,344,309-character payload parsed in
0.72 s (2 min 19 s before) with identical row counts; the Import completed ("ok manual import now
work"); `flex_price_sync` is CANCELLED in WorkManager; `holdings list complete=true … zeroed sold-out
shares: [NEBX 100→0]` with the stock value equal to IBKR's own 14,098.52 ("nebx is gone").

NOT verified with real data: the superseded-preview refresh; the daily run and its repeat; the
"tomorrow" re-arm; the new Settings line; the worker's copy of the sold-out zeroing; the "no position
at all" zeroing; the withheld catch-up.

## State of the phone's job queue when the round ended (04:03–04:41 phone time, read-only)

- `pre_market_sync` is held by the system for 15:00 Asia/Bangkok on 2026-11-12 = 03:00 New York.
  That is the request an older build left (`KEEP` keeps it) and it is the first automatic run; from
  the run after it the time is 04:00 New York.
- **The 15-minute price-alert check is not scheduled.** Its WorkManager row reads `RUNNING` with no
  app process and the system holds no job for it. At 03:45:00 the system started the app for that
  check; app start re-registers the alert work with `ExistingPeriodicWorkPolicy.UPDATE` (and after an
  update WorkManager re-registers every job), which cancelled the job that woke the app; the check
  ran unprotected and the process was gone 7 s later, the phone being at thermal status 2 from Gradle
  builds. Pre-existing race, not changed. It heals at the next process start (the owner opening the
  app, or the 15:00 job). The owner was told. At 04:41 the phone was back at thermal status 0 and
  the same three system jobs were listed; the agent did not start the app to repair it.

## First thing next session

1. Confirm the alert check is scheduled again: `adb shell dumpsys jobscheduler` lists a fourth job for
   `com.dima.optionstracker`, and the WorkManager row is not a `RUNNING` row without a process.
2. Read the `SYNC_SCHED Flex file …`, `SYNC_SCHED Pre-market sync requested …` and (if present)
   `Daily sync received the previous file …` lines of the first daily runs. The owner's file,
   requested at 15:10 New York, was stamped `whenGenerated=20261111;093051`: whether IBKR's new file
   exists at 03:00 / 04:00 New York is not yet known. A run that has the day's file must log a
   re-arm for the NEXT New York date.

## Open owner decisions

- OS-stop protection for explicit sync taps (recommendation: leave it now that a sync takes seconds).
- With auto-sync OFF, app start's `cancelAll` also cancels the explicit owner slots.
- November MULL / RKLX stock figures are held on the legacy aggregate (−3,529.10 not projected) —
  P&L domain, needs explicit instruction.
- The worker's `partial close refused IRE PUT 6.0 …` line is logged on every sync before any quantity
  comparison; it is not evidence of a discrepancy. The app holds 12 open contracts.
- The price-alert job's start-up re-registration (recommendation: `KEEP` unless the interval changed).
- `TODO.md` 3b: a catch-up that is already enqueued is not re-checked when it finally runs.

The financial-parity residuals and the standalone market-agent plan are unchanged.
