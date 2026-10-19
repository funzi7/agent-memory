# OptionsProfitTracker — 2026-10-19 single-flight Flex sync handoff

Date: 2026-10-19. Same branch `s2/ibkr-reconciliation-lifecycle-dashboard`, same PR #19 OPEN,
NOT merged; no push to main (`7225b7af16c183de00a9f064ead03a01ad6af1d3` untouched). This complete
replacement supersedes the same-day "urgent Flex option-parse repair" handoff as the CURRENT state;
that round is summarised below and kept in agent-memory git, and its project record is
`docs/S2_8_ACCEPTANCE.md` / `S2_8_VALIDATION.md` §2026-10-19. Every open S2.8 item is carried forward.

## Heads and gates

- Round start: `6879976c499266b216477579b548de8b8c84afba` (urgent repair final, Codex clean).
- `d39aec7e4dd27513f3b260822e0611777ab61f5c`: owner "Option 2" implementation. Exact-head Codex review
  5573929901: P2 4315700680 (boot persistence) + P2 4315700698 (REPLACE decided from a stale
  WorkManager snapshot) — fixed in `c3cf04997f6c90ce878b5f7d514a775e17624bba`; replies
  4315983605/4315984015, threads resolved.
- `c3cf04997f6c90ce878b5f7d514a775e17624bba`: exact-head Codex review 5574298999: P2 4316014193 (a
  dashboard sync-now tap that JOINS a same-kind sync finishing before the tap reads its last-sync
  baseline waited 60/120 s and reported "still running"; full path skipped auto-expiry) — first fix in
  `97c3539c5dc24cb2d640a7252d5321ad88273507` (reply 4316387677, resolved).
- `97c3539`: exact-head Codex review 5574785803: P2 4316418642 (that fix identified the joined request
  from a slot read AFTER the enqueue, which WorkManager's deletion of finished records on the next
  insert can redirect) — fixed in `6add95960f3dccc9e174e86d30ff92a35f81c3a3` (reply 4316567905, resolved).
- `6add959`: exact-head Codex review 5575010512: P2 4316598285 (the tap still completed on any advance
  of the SHARED last-sync time, which periodic/pre-market/other-kind runs move while the tap's own
  request waits for Flex ownership) — fixed in `bd9b8269389c0a2794a8205e59cb99546114f63e` (reply
  4316678374, resolved).
- `bd9b826`: the requested exact-head Codex review did NOT run — "You have reached your Codex usage
  limits for code reviews" (comment 6272919243, 2026-10-19T17:15:13Z; state `failed`); build-gate and
  scripts-test passed there, check-codex-status / codex-gate-evaluator failed for lack of a signal (not
  bypassed). An independent read-only review agent (NOT Codex, not a gate) found no P1/P2 and three P3,
  fixed in the final HEAD: cleanup re-reads each stale one-shot before `cancelWorkById` and skips one
  that started (`startedSinceRead`); a queued Import runs only on the trades tapped (a reset while it
  waits cancels it); coordinator comment corrected.
- Final project HEAD: `fbe255608f305db0ccdb16dab22430d18babd2e0`.
- Exact-head checks/review: on the final HEAD `fbe255608f305db0ccdb16dab22430d18babd2e0`: build-gate success (run 39296972085, 2026-10-19T17:51:30Z) and scripts-test success (run 39296971999); check-codex-status and codex-gate-evaluator FAILURE because the exact-head Codex review could not run — the Codex connector reports its usage limit (comments 6273524502 and 6273530110, 2026-10-19T17:46Z; also 6272919243 on bd9b826). Not bypassed; re-request the Codex review when the limit or credits allow. Status comment 6273643578. All five Codex threads of this round replied and resolved; PR #19 OPEN, not merged.

## Owner decision implemented — "Option 2" (cancel stale one-shots, single-flight Flex sync)

- `notification/FlexSyncQueue`: four unique homes only (`flex_price_sync` periodic, `pre_market_sync`,
  `flex_sync_now_full`, `flex_sync_now_regular`). LEGACY = a FlexSyncWorker one-shot in none of them
  and without the pre-market tag. On every process start `OptionsTrackerApp` cancels legacy
  ENQUEUED/BLOCKED work by id (`cancelWorkById`, bounded 10 s) before scheduling anything and logs one
  `FLEX_QUEUE legacy Flex one-shot cleanup: cancelled=… startedSinceRead=…` line; each is re-read just
  before its cancel and one seen RUNNING is reported, not cancelled (WorkManager has no conditional
  cancel, so a start in that last gap stays possible); idempotent. The worker ends a legacy one-shot that starts anyway without a broker request.
- Slot policies are CONSTANTS (Codex fix): sync-now `KEEP` — joins a pending, waiting or running
  request, never cancels it (the owner-approved join semantic); external pre-market re-arms (app
  start, dashboard, boot) `KEEP`; only the running pre-market worker `REPLACE`s its own slot (as
  before). Enqueues run on the caller's thread and return their `Operation`; `BootReceiver` waits for
  persistence (bounded 5 s each, IO coroutine) before `pending.finish()`. Never decide `REPLACE` from a
  WorkManager snapshot — it can cancel work that started running in between.
- Dashboard taps (`syncPrices`/`fullSync`) complete ONLY when a request serving them records a completed
  sync — never on the shared last-sync time (display only). `DashboardViewModel.requestSyncNow`
  (`NonCancellable`): read the joinable requests (`FlexSyncQueue.pendingRequestIds` = the slot's
  ENQUEUED/RUNNING work, the state KEEP evaluates) BEFORE enqueueing; `syncNow` returns a
  `SyncNowTicket`; `FlexSyncQueue.servingRequestIds`/`servingIdsOf`: inserted → only its own request;
  discarded by KEEP → the same-kind request it joined (read before, or just after if another caller
  inserted one in between). The worker records each completed sync's id in process memory
  (`recordCompletedSync`, bounded 32) immediately before each success that follows a last-sync write;
  no-op exits never record. Never identify the joined request from a slot read after the enqueue.
- `data/remote/FlexSyncCoordinator`: one in-process owner (process-wide Mutex) of every Flex
  fetch/write — worker, manual `סנכרן מ-IBKR`, Import, full re-sync. Only the periodic job coalesces
  (into any in-flight run); everything else waits and runs. No-op exits happen before ownership;
  released on success/failure/cancellation; a cancelled waiter never runs; `doImport` is not wrapped
  (fullResync calls it while holding ownership). No polling/automatic import/extra provider request.
- Terminal IBKR codes 1010–1012/1014–1016 stay non-retryable (urgent repair).

## Validation (actual, final HEAD)

- Focused (FlexSyncQueueTest 21, FlexSyncCoordinatorTest 9, FlexTerminalErrorPolicyTest 3) 33/33;
  full `cleanTestDebugUnitTest testDebugUnitTest compileDebugKotlin assembleDebug` with the persisted
  audit input: 1808 tests / 0 failures / 0 errors / 1 existing skip / 117 classes, BUILD SUCCESSFUL,
  zero real `^e:`; audit unchanged (selected=4844.09 brokerReference=4741.75 delta=102.34); scripts
  76/76; `git diff --check` clean. All Gradle via heavy-run, JDK 21.
- Offline replay of the cleanup rule on the morning read-only WorkManager copy: exactly 42 cancels
  (attempts 19..55, 1,550 total, due 12:55–12:56 ET); preserves periodic `acc3a84a…` and pre-market
  `e16f7f59…`; 8 other workers untouched.
- APK 1.0.0/1 (no bump) SHA-256 `4afde87e616f74e45eb81b69e01aaae079e3a56eca25fcadabc731c481e665d5`,
  65,957,453 bytes, original signer SHA-256 `9e5307e1…8221` / SHA-1 `5d3d855c…1551`; at
  `/sdcard/Download/OptionsProfitTracker/OptionsProfitTracker-1.0.0.apk` (shared-storage copy 13:45 ET,
  hash matches). Superseded in Download: `e0169b00…` (bd9b826), `8a6d86e8…` (6add959), `2016a75d…`,
  `48daf02a…` (97c3539), `8323eaf1…` (c3cf049), `8c4a29cf…` (d39aec7), `ee8808f2…` (interim).

## Device: BLOCKED — nothing physical this round

The owner's rule requires the shared ADB device lease; on this host there is no lease tooling
(`/root/work/.locks/adb-device.lock` is only an empty file this agent's own per-command `flock`
created during the urgent repair). So NO ADB command ran: no read-only inventory, install, launch or
queue check. The phone's WorkManager state is UNVERIFIED; the last verified install is `5b532f56…`
(10:26 ET). The 42 stale chains (due ≈12:55 ET per the morning copy) are cancelled only when this
build's process starts on the phone; that due time has passed and whether they ran (jobs of this
background-restricted app wait for the foreground) or whether the owner installed one of this round's
APKs first is unknown. No IBKR request was made. Pending physical check (needs lease
tooling or the owner installing the Download APK): one `FLEX_QUEUE … cancelled=` line on first start,
`flex_price_sync` + `pre_market_sync` remain, launches do not recreate the queue.

## Owner decisions / actions (numbered; nothing implemented for 3–7)

1. DECIDED (2) and implemented — this round.
2. RESOLVED by correction (urgent repair): `OPEN` (Opendoor) is a ticker in stock paths/brief/report.
3. Owner's own Import of the newly accepted OPEN/one-letter option cycles (moves realized totals and
   Sep/YTD parity references; re-audit afterwards).
4. Pace non-terminal GetStatement `Fail` retries (documented 1 request/second).
5. Non-standard option multipliers refused at import; support needs `contractMultiplier` authorized in
   protected ProfitCalculator paths.
6. A dashboard/settings sync-now tap joins a request waiting in retry backoff (30 s … WorkManager's 5 h
   cap): keep / bound one-shot retries to N / run those taps in-process like `סנכרן מ-IBKR`.
7. An overdue pre-market sync now RUNS at the next opportunity (background-restricted phone: next app
   foreground, weekends included) instead of being moved to the next day by every app start/dashboard
   visit; on a weekday's first open 09:00–18:59 ET with no sync yet, the app-start full sync follows
   (serialized). keep / skip when a later sync already succeeded / drop after an owner-chosen window.

## Same-day urgent Flex repair (summary; details in project docs)

Post-token-renewal manual sync failed `Flex options incomplete: rejected=8 … requiredField=8`: the
March-2026 `ticker == "OPEN" || length < 2` filter refused real broker underlyings and S2.8 made
refusals fatal. Fixed with the pure `FlexOptionRowParser` (any non-blank underlying; named, redacted
refusals), validate-before-persist, fail-closed full re-sync, NaN commission refused, standard
multiplier 100 only, `OPEN` accepted in every stock/brief/report path, terminal IBKR codes not
retried. One live manual sync passed (1588 rows → 498 opens / 474 closes / 0 errors; preview only).
Final HEAD `6879976c…` exact-head Codex clean.

## Carried-forward S2.8 backlog (unchanged, not closed)

- Fixed Sep 1–28 options: broker 4741.75 vs canonical 4844.09, residual 102.34 over 33 local-only
  cycles; owner has no saved export. Sep3–Oct2 206.27 (whole-dollar reference); September statement
  5634.27 vs 5832.48 (198.21; SOXL3586 assigned-vs-expired evidence gap, −1.02 counterfactual);
  YTD 38287.55 vs 37688.74 (598.81). No offsets/plugs. Re-audit after any owner Import (decision 3).
- Held exact series identity / positive non-penny tick metadata for automatic recommendations.
- OPT→Trading Tracker bridge and conditional ChatGPT report SPEC_ONLY; Phase 3 exit learning;
  historical stock-ledger coverage; SOFI attribution; missing Flex ibOrderID; PR #20 rollout;
  MIGRATION_30_31 registered at 1 of 17 builders; journal/snapshot/bidi debt; owner-deferred
  physical PUT/0DTE/brief checks.

Finalize memory only with `AGENT_MEMORY_PROJECT=options-profit-tracker
/root/work/bin/agent-memory-finalize "<factual message>"`; never mutate memory Git directly.
