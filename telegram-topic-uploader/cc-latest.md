# Telegram Topic Uploader — latest handoff

## Task and repository state

| Field | Value |
| --- | --- |
| Task | D3B1.1 — hotfix for the real-device UIDT first-run scheduling rejection ("system did not accept the background upload") |
| Application repository | `/root/work/telegram-topic-uploader` |
| Branch | `main` |
| Tracking branch | `origin/main` |
| Starting application HEAD | `fac6f8806834bb664d312c45c943975008ea5299` (D3B1) |
| Version | code 10 -> 11, name `0.5.0-d3b1` -> `0.5.1-d3b1.1` |
| Room schema | **stays 7.** No schema change — the new batch status is stored as unrestricted text |
| Deployment | None. Not installed or run on any device or emulator in this session |

No production token, Telegram identifier, bot username/ID, chat ID, thread ID, group title, forum
topic name, private link, binding command, file name, content URI, document ID, path, or media hash
was requested, used, or recorded anywhere, including this file.

## Real D3B1 device failure (user-reported, not observed by any agent)

- D3B1 was installed and launched on the user's Android device.
- Two eligible test videos were present in Queue.
- The user explicitly tapped **Upload queue** and confirmed the action.
- The app showed the sanitized message that **the system did not accept the background upload**.
- **No video was sent** by that batch attempt.
- **No source-file mutation** was reported.
- Notification-permission state was **not explicitly reported**.
- Stop/resume and background progress were **not reached or tested**.

## Diagnosis — a permission/window-focus scheduling race

A JobScheduler user-initiated data transfer (UIDT) job's `schedule()` returns `RESULT_FAILURE` when the
app is not considered to hold a visible, focused window at the exact scheduling moment. The old D3B1 UI
made that failure likely:

- `BatchUploadControl` launched the POST_NOTIFICATIONS request on **every** API 33+ confirmation, even
  when permission was already granted;
- it called the schedule flow **directly from inside the Activity-Result permission callback** — i.e.
  while the system permission dialog was still dismissing and the app window had not regained focus;
- the gate relied on `AppVisibilityTracker.isVisible`, which counts **started** Activities and does not
  prove **resumed window focus**.

So scheduling raced the dialog dismissal and the platform rejected it. RESULT_FAILURE alone does not
expose one exact platform cause; the app treated every rejection as terminal `SCHEDULING_FAILED`.

## What D3B1.1 implements

**Permission/window-focus flow (the race fix).**
- Already-granted (or API < 33): the permission dialog is **not** re-launched. Confirm arms one
  transient in-memory pending action, scheduled only when the app is proven RESUMED with a focused
  window.
- Not granted: request permission; the Activity-Result callback only **forwards the grant/deny fact**
  — it never freezes a snapshot or schedules. Denied -> `NotificationPermissionRequired`, no batch.
  Granted -> arm exactly one transient pending action, wait for the window to regain focus, then invoke
  `startBatch` exactly once; the pending action is cleared whatever the result.
- `AppVisibilityTracker` now also tracks RESUMED count + window focus (focus fed from
  `MainActivity.onWindowFocusChanged`), exposing `isResumedAndFocused` behind a new domain interface
  `AppWindowState`. `AndroidBatchPlatformGate.isAppVisible()` now checks `isResumedAndFocused`.
- The focus rising-edge is delivered by a Compose `ViewTreeObserver.OnWindowFocusChangeListener` in
  `TelegramTopicUploaderApp` calling `MainViewModel.onWindowFocusRegained()`, which consumes the pending
  action once. The pending flag lives only in the ViewModel (never Room): process death before focus
  recovery freezes no snapshot and sends nothing; arming is idempotent and consumption single-shot, so
  rotation/recomposition cannot duplicate the start.

**Typed scheduler diagnostics.** `BatchScheduler.schedule()` returns a sanitized `BatchScheduleResult`
(`Accepted`, `PermissionUnavailable`, `ServiceUnavailable`, `AppNotEligibleNow`, `SystemRejected`,
`InvalidRequest`, `SecurityRejected`) instead of a Boolean. `UidtBatchScheduler` now checks
`JobScheduler.canRunUserInitiatedJobs()` on API 34+ (false -> PermissionUnavailable), verifies the
declared JobService component resolves via PackageManager before scheduling (unresolved / null service
-> ServiceUnavailable), distinguishes a thrown SecurityException (-> SecurityRejected) and
IllegalArgumentException (-> InvalidRequest) from a plain RESULT_FAILURE (-> AppNotEligibleNow), and
maps an unexpected non-success code -> SystemRejected. The mapping is a pure, off-device-testable
function `classifyScheduleOutcome(componentResolvable, canRun, RawScheduleOutcome, success, failure)`.
It persists/logs no exception text, platform text, package internals, session ID, media data, or
identifier, does not loop schedule, and acknowledges RESULT_FAILURE cannot pin one exact cause. The
JobInfo build is otherwise unchanged (setUserInitiated(true), required INTERNET, estimated bytes, one
fixed non-exported `BatchUploadJobService` ComponentName built once, one opaque session-ID extra, fixed
`BATCH_JOB_ID`).

**Recoverable scheduling rejection.** A snapshot rejected **before** any JobService execution now moves
to a new persisted status `SCHEDULE_RETRY_REQUIRED` — an **active/recoverable** state (`isActive`
true), not terminal. It retains the frozen snapshot and the active-slot ownership and claims/mutates no
upload job. The Queue batch card exposes:
- **Try background upload again** (`retryScheduling`): reschedules the same session and same frozen
  items; the fixed platform job id means repeated taps cannot submit two platform jobs; no newly queued
  row joins; on acceptance -> SCHEDULED (`markScheduled` now also accepts a SCHEDULE_RETRY_REQUIRED
  session).
- **Cancel unstarted batch** (`cancelUnstartedBatch`): available only before a JobService ever starts
  (DAO guard `startedAt IS NULL`, statuses CREATED/SCHEDULE_RETRY_REQUIRED/SCHEDULED); makes the session
  terminal `CANCELLED`, clears activeSlot, keeps audit rows, touches no upload job/reservation/media/
  Telegram state.

The legacy `SCHEDULING_FAILED` enum value is kept **only** so a device's old failed session still reads
as terminal and never blocks a new snapshot; no new session moves there (coordinator now calls
`markScheduleRetryRequired`, not `markSchedulingFailed`).

**Precise sanitized messages.** The single generic scheduling-failure string was replaced by
per-category messages (permission not available; application window not ready — return to the app and
try again; background-transfer service unavailable; Android rejected the request — use Try again;
invalid local scheduling request; security permission unavailable) plus a cancelled-batch message.
EN/HE parity; no raw exception text, JobScheduler internals, or private value in any string.

## Files touched

Domain: `BatchModels.kt` (+SCHEDULE_RETRY_REQUIRED, +CANCELLED; `isActive` includes retry-required),
`BatchUploadPorts.kt` (`BatchScheduleResult`, `RawScheduleOutcome`, `classifyScheduleOutcome`,
`AppWindowState`; `BatchScheduler.schedule` returns the typed result; `BatchStartResult.ScheduleRejected`
replaces `SchedulingFailed`; launcher gains `retryScheduling` + `cancelUnstartedBatch`),
`BatchRepository.kt` (+`markScheduleRetryRequired`, +`cancelUnstartedBatch`),
`BatchUploadCoordinator.kt` (recoverable scheduleCreated; retry; cancel; typed resume).
Data: `Daos.kt` UploadBatchDao (+`markScheduleRetryRequired`, +`cancelUnstarted`; `markScheduled` guard
now CREATED or SCHEDULE_RETRY_REQUIRED), `RoomBatchRepository.kt` (impl).
Platform: `UidtBatchScheduler.kt` (typed result, canRunUserInitiatedJobs, component resolution,
sanitized exceptions, single ComponentName), `AppVisibilityTracker.kt` (resumed+focus, AppWindowState),
`AndroidBatchPlatformGate.kt` (isResumedAndFocused).
UI/DI: `MainActivity.kt` (inject tracker, onWindowFocusChanged), `MainViewModel.kt` (pending gate,
confirmBatchUpload/onNotificationPermissionResult/onWindowFocusRegained/retryBatchScheduling/
cancelUnstartedBatch, new UiNotices, typed notice mapping), `Screens.kt` (BatchUploadControl permission
logic, BatchStatusCard retry/cancel, status labels), `TelegramTopicUploaderApp.kt` (focus listener,
QueueScreen wiring, notices), `AppModule.kt` (bind AppWindowState). `strings.xml` (+ EN/HE), version.

## Tests and exact results

Full JVM suite: **625 tests, 0 failures** after re-running the one pre-existing flaky test
(`TelegramMediaUploadGatewayTest > a connection lost before the body completes...`, MockWebServer
timing — passes in isolation; D3B1 baseline was 600). New/updated:
- `BatchScheduleResultMapperTest` (8): pure typed mapping — canRunUserInitiatedJobs=false ->
  PermissionUnavailable, unresolved -> ServiceUnavailable, SecurityException/IllegalArgumentException
  sanitized, RESULT_FAILURE -> recoverable AppNotEligibleNow, RESULT_SUCCESS -> Accepted, unexpected ->
  SystemRejected.
- `BatchUploadCoordinatorTest`: rejection retains snapshot recoverably (markScheduleRetryRequired, no
  upload-job touch); retry reschedules same snapshot -> SCHEDULED; rejected retry stays retry-required;
  retry with nothing/running reports correctly; cancel-unstarted delegates.
- `RoomBatchRepositoryTest`: retry-required keeps the slot; retry -> SCHEDULED without a new snapshot;
  cancel-unstarted clears the slot terminally and leaves the upload job QUEUED; a started (RUNNING)
  session cannot be cancelled as unstarted.
- `MainViewModelTest`: already-granted+focused schedules once; permission grant while unfocused
  schedules nothing until focus returns, then exactly once; denial creates no snapshot + asks for
  permission; repeated confirms/focus regains do not duplicate; a fresh ViewModel after "process death"
  starts nothing on focus; retry/cancel delegate.
- `D3B1SurfaceTest`: launcher method set updated to include `retryScheduling` + `cancelUnstartedBatch`.

| Check | Result |
| --- | --- |
| `--offline testDebugUnitTest` | 625, 0 failures (flaky gateway test re-run passes) |
| `--offline lint` | 0 issues (fixed an InlinedApi warning by using an early-return SDK guard) |
| `--offline assembleDebug` / `assembleDebugAndroidTest` | passed |
| Instrumentation | **compiled, not run** (no device). Only unit tests changed; androidTest APK byte-identical to D3B1 |
| Room schema | stays **7**; no schema JSON changed; 1-7 committed |
| `git diff --check` | clean |

## Artifacts (debug development signing only)

- Main APK: `app/build/outputs/apk/debug/app-debug.apk`, 14,312,025 bytes,
  SHA-256 `a19be6cb3a7bd17b6c54129631efd3b90e9eb939d90d3f522b26cea19616a414`.
- Instrumentation APK: `app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk`, 1,566,099
  bytes, SHA-256 `495cab881dd67457c488f0c46c4adef970af31724e538bad514c99d3f27c28e5` (unchanged from D3B1).
- Package `com.funzi7.telegramtopicuploader`; versionCode 11; versionName `0.5.1-d3b1.1`; minSdk 23;
  compile/target SDK 37; cleartext false; backup false; permissions INTERNET +
  RUN_USER_INITIATED_JOBS + POST_NOTIFICATIONS (+ AndroidX-injected dynamic-receiver perm); one
  non-exported `BatchUploadJobService` with `BIND_JOB_SERVICE`; debug cert SHA-256
  `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4`.
- DEX (via `strings`; `dexdump` crashes in this sandbox): `setUserInitiated`, `canRunUserInitiatedJobs`,
  `getServiceInfo` present; no `androidx/work`/`WorkManager`; `startForegroundService` only as a
  ContextCompat/NotificationCompat framework symbol, not our code.

## Untested device behaviour

The D3B1.1 APK has **never** been installed, updated over D3B1, launched, or run. No background batch,
UIDT job, notification, real window-focus/permission-dialog timing, stop/resume, cancel-unstarted, or
Room migration has run on a device. No real SAF provider, video, or hash; no Telegram traffic; no media
mutation — every test byte was a synthetic in-memory array.

## Env notes (still current)

- `GRADLE_USER_HOME=/root/.gradle ./gradlew --offline …`; `aapt2` at
  `/opt/android-sdk/aapt2-wrapper/aapt2`; `apksigner` in `/opt/android-sdk/build-tools/37.0.0`.
- **`dexdump` crashes (Illegal instruction) in this sandbox** — use `strings` over extracted
  `classes*.dex` for DEX marker checks.
- `PackageManager.getServiceInfo(ComponentName, Int)` is deprecated on API 33+; the API-34-only path
  uses `ComponentInfoFlags.of(0L)`.
- Referencing `Manifest.permission.POST_NOTIFICATIONS` under a `||` short-circuit trips lint
  `InlinedApi`; an **early-return** `if (SDK < TIRAMISU) return true` guard silences it (same shape as
  `AndroidBatchPlatformGate`).
- Adding an **eager forever `StateFlow.collect`** in a ViewModel leaks in `runTest`; the focus
  rising-edge is instead pushed via `onWindowFocusRegained()` from the Compose focus listener.

## Corrected future routing decision (roadmap, NOT implemented here)

1. **Multi-topic binding session:** one session and nonce; the copied command already includes
   `@validated_bot_username`; collect candidates from several topics without returning to the app;
   review, locally name, and commit all candidates together.
2. **Scalable routing:** Instagram/TikTok/Downloads folders identify **provenance only** (no per-account
   mappings required); add **bulk thumbnail routing as the deterministic baseline**; later add optional
   content-based destination suggestions using available caption/link metadata, sampled frames, OCR and
   speech evidence; high-confidence automatic routing stays **opt-in**; uncertain items stay in Review.

## Remaining D3B work (not started)

- **D3B2 immediate cancellation** of the in-flight multipart request (replaces stop-after-current).
- Result-unknown reconciliation that never re-sends without evidence.
- Evidence-based resolution of an unowned/ambiguous legacy reservation (D3A.1 blocker).
- Safe-deletion stage gated on a confirmed positive Telegram message ID.
- A truly background notification stop action (currently opens the app to record the stop).

## Deployment declaration

Nothing was deployed, distributed, installed, or run on a device or emulator in the D3B1.1 session. No
real Telegram request of any kind was made, no forum topic was created/renamed/closed/deleted, and no
media was uploaded, moved, renamed, copied, downloaded, quarantined, or deleted — every byte in every
test came from a synthetic in-memory array.
