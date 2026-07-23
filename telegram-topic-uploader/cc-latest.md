# Telegram Topic Uploader — latest handoff

## Task and repository state

| Field | Value |
| --- | --- |
| Task | D3B1 — explicit user-initiated background batch upload on Android 14+, on the D3A per-item path |
| Application repository | `/root/work/telegram-topic-uploader` |
| Branch | `main` |
| Tracking branch | `origin/main` |
| Starting application HEAD | `4c28a755a63593f9402d7d968adeaa4add18eaf0` (D3A.1) |
| Version | code 9 -> 10, name `0.4.1-d3a1` -> `0.5.0-d3b1` |
| Room schema | **6 -> 7.** Two tables, `MIGRATION_6_7`, purely additive, no backfill |
| Application commit | `feat: D3B1 explicit user-initiated background batch upload` |
| Deployment | None |

No production token, Telegram identifier, bot username/ID, chat ID, thread ID, group title, forum
topic name, private link, binding command, file name, content URI, document ID, path, or hash of real
user media was requested, used, or recorded anywhere, including this file.

## New user-reported D3A.1 device evidence — read this first

USER-REPORTED (not observed or performed by any agent):

- D3A.1 was installed and executed on the device;
- the user ran a scan of the existing configured directory;
- the active queue count decreased after the scan;
- the dashboard showed exactly **three** source-missing records;
- **three is the actual number of source videos that had been removed** from the directory;
- no false source-missing record was reported;
- no Telegram request or file mutation was reported during that reconciliation scan.

Do NOT claim the queue reached zero — the user did not report an exact final count. The corrected real
source-missing count is **three** (the earlier D3A run's "four stale" was a different, earlier
observation; this D3A.1 device run reported three removed videos → three source-missing records). Only
that the count decreased and three records appeared as source missing.

## What D3B1 implements

**One explicit action → one frozen snapshot.** `BatchRepository.createSnapshot` (in
`RoomBatchRepository`) reads the currently eligible queue rows via the existing
`UploadJobDao.findClaimCandidates` order (due time, then createdAt, then id) in one transaction and
freezes their job IDs, that order, and their already verified `hashedSizeBytes` into
`upload_batch_items`. It claims nothing, spends no attempt, opens no stream. A row queued after the
freeze is not in the snapshot; there is no code path that adds an item to an existing session.

**Schema 7 (`MIGRATION_6_7`).** Two new tables and their indices, nothing else touched:
- `upload_batch_sessions(id, status, schedulerType, platformJobId, createdAt, startedAt, updatedAt,
  finishedAt, stopAfterCurrentRequestedAt, totalItemCount, totalEstimatedBytes, activeSlot)`.
  **Unique index on `activeSlot`** = the one-active-batch invariant in Room (active session holds the
  single `ACTIVE_SLOT=1`; terminal session holds NULL; SQLite treats NULLs as distinct). Plus a
  `status` index.
- `upload_batch_items(id, sessionId, uploadJobId, ordinal, expectedBytes, state, startedAt,
  finishedAt, outcome)`. Indices `(sessionId, ordinal)`, **unique `(sessionId, uploadJobId)`** (one
  job at most once per batch), `(uploadJobId)`. FK to `upload_jobs` is **NO_ACTION** (no cascade of
  audit history); FK to sessions is CASCADE (inert — sessions are never deleted).
- No private field in either table. Purely additive; schemas 1-6 byte-for-byte unchanged; no backfill;
  no destructive fallback; schema 7 exported/committed.

**The gate (`BatchUploadCoordinator`, implements `BatchUploadLauncher`).** `startBatch()` refuses
before creating anything unless: API 34+ (`BatchPlatformGate.supportsBackgroundBatch`), notification
permission granted, app visible, no active batch, no single-item upload (`ActiveUploadProbe`, extracted
interface implemented by `MediaUploadCoordinator`). On `Created`, it schedules; on schedule failure it
calls `markSchedulingFailed` (terminal) and touches no upload job.

**Scheduler (`UidtBatchScheduler`).** API 34+ JobScheduler UIDT job: `setUserInitiated(true)`,
`setRequiredNetwork(NET_CAPABILITY_INTERNET)`, `setEstimatedNetworkBytes(NETWORK_BYTES_UNKNOWN,
uploadBytes)`, one non-exported `BatchUploadJobService` via ComponentName, one extra
(`EXTRA_SESSION_ID`). Fixed `BATCH_JOB_ID`. Below 34 `schedule()` returns false.

**JobService (`BatchUploadJobService`, `@AndroidEntryPoint`, `@RequiresApi(34)`).** Reads the session
ID from `params.extras`, calls `setNotification(...JOB_END_NOTIFICATION_POLICY_DETACH)` before work,
runs the runner off the main thread in a service scope, calls `jobFinished` exactly once
(`reschedule=false` for paused/terminal, `true` only for an internal FAILED). `onStopJob` cancels the
scope and returns whether a transient reschedule is appropriate; overwrites no durable outcome.
Manifest: `exported=false`, `permission=BIND_JOB_SERVICE`, `tools:targetApi="34"`.

**Runner (`DefaultBatchUploadRunner`).** Depends on `UploadLauncher` (interface), `QueueExecutionRepository`,
`BatchRepository`. Walks the snapshot one item at a time via `uploadLauncher.uploadNow(jobId)` — the
exact D3A path, no second transport, and the single-flight AtomicBoolean guard means never two media
requests. Per item: re-read stop state; if set, pause; reconcile abandoned claims; `inspectJob` reads
the JOB's durable evidence; classify:
- telegramConfirmed → CONFIRMED/ALREADY_CONFIRMED (no send)
- SOURCE_MISSING → SKIPPED/SOURCE_MISSING; RESULT_UNKNOWN → SKIPPED/RESULT_UNKNOWN; other terminal →
  SKIPPED/TERMINAL_SKIPPED (no send)
- QUEUED & attempts exhausted → FAILED; not due → DEFERRED/RETRY_NOT_DUE; still claimed → DEFERRED/BUSY;
  else → send.
Maps `uploadNow` result → item outcome (Confirmed→CONFIRMED; RetryScheduled→DEFERRED; PermanentlyFailed→
FAILED; ResultUnknown→SKIPPED; Busy→DEFERRED; Failed→DEFERRED/OUTCOME_UNRECORDED; PreflightRefused→
mapped). Final: COMPLETED if all CONFIRMED; PAUSED if stop + pending remain; else COMPLETED_WITH_ISSUES.
The JOB decides, never the batch item: a RUNNING item after crash is re-classified from job evidence
(abandoned pre-dispatch retries; abandoned post-dispatch is RESULT_UNKNOWN, never re-sent). Settled
items never revisited → repeated JobService starts idempotent.

**Stop/resume.** Stop records `stopAfterCurrentRequestedAt`; checked at top of each item so the
in-flight item finishes and no next starts → PAUSED (keeps active slot). Resume (`markResumed`, single
guarded statement clears stop + sets SCHEDULED) reschedules the same snapshot, adds no new job, resends
nothing terminal. Immediate multipart cancellation deferred to D3B2.

**Notification (`BatchUploadNotifications`).** Private low-importance channel (NotificationChannelCompat),
NotificationCompat notification showing only position/total/completed/byte-progress/status. Body tap →
MainActivity `ACTION_OPEN_QUEUE`; action → `ACTION_STOP_AFTER_CURRENT` (opens app + records stop —
MainActivity reads intent action, passes to `TelegramTopicUploaderApp(initialBatchAction)`). No file
name/dir/dest/URI/token/chat/thread/hash. Throttled setNotification (status-change always, else ≥800ms).

**Permissions.** Added `RUN_USER_INITIATED_JOBS` + `POST_NOTIFICATIONS` only. `AndroidBatchPlatformGate`
checks POST_NOTIFICATIONS via ContextCompat on API 33+ (true below). `AppVisibilityTracker`
(registered in Application onCreate via `registerActivityLifecycleCallbacks`) counts started activities
for visibility. Screen requests POST_NOTIFICATIONS via `rememberLauncherForActivityResult` on confirm.

**UI (`QueueScreen`).** `Upload queue` button shown only API 34+ (`backgroundBatchSupported`) with
eligible rows, no single upload, no active batch. Confirmation dialog shows count + total size (LTR) +
frozen/new-items/no-deletion text. During a batch: `BatchStatusCard` (completed/total, stop/resume);
per-row Upload now + corrections disabled (`controlsLocked = uploadActive || batchActive`). API 23-33
shows a concise `queue_batch_platform_note`. New UiNotices for all batch outcomes.

## Files added/changed

Added: `domain/batch/{BatchModels,BatchRepository,BatchUploadPorts,BatchUploadCoordinator,
DefaultBatchUploadRunner}.kt`, `data/repository/RoomBatchRepository.kt`, `platform/{BatchJobContract,
UidtBatchScheduler,AppVisibilityTracker,AndroidBatchPlatformGate,BatchUploadNotifications,
BatchUploadJobService}.kt`. Entities +2, Daos +`UploadBatchDao`, AppDatabase v7, `MIGRATION_6_7`.
`MediaUploadCoordinator` implements new `ActiveUploadProbe` + `isUploadActive()`. ViewModel/App/Screens/
MainActivity/Application/AppModule/manifest/build.gradle/strings(×2) updated.

## Tests and exact results

Full JVM suite: **600 across 51 classes, 0 failures/errors/skipped** (D3A.1 had 556/47). New (44/4):
`RoomBatchRepositoryTest`(7), `DefaultBatchUploadRunnerTest`(13, real repo + real runner, fakes only
`UploadLauncher`), `BatchUploadCoordinatorTest`(13), `D3B1SurfaceTest`(11).

Six surface guards **rewritten (not deleted)** to the bounded surface (3 permissions, 1 non-exported
JobService, 0 receivers, no WorkManager/foreground/wakelock/boot): `D3ASurfaceTest`,
`D2B2BSurfaceTest`, `D2B2ASurfaceTest`, `D2B1SurfaceTest`, `D3A1SurfaceTest`, `D1SecuritySurfaceTest`.
`MainViewModelTest` gained a fake `BatchUploadLauncher`. JobScheduler prohibition scoped to each
milestone's own sources (which stay scheduler-free).

| Check | Result |
| --- | --- |
| `--offline testDebugUnitTest` | 600, 0 failures |
| `--offline lint` | 0 issues |
| `--offline assembleDebug` / `assembleDebugAndroidTest` | passed |
| Instrumentation | 93/11 compiled (was 89/10): +2 `MIGRATION_6_7` cases, +`D3B1PersistenceTest`(2); none executed — no device |
| Room schema | 7 exported/committed; 1-6 unchanged |
| `git diff --check` | passed |
| AAPT2 badging | vc 10, `0.5.0-d3b1`, min 23, target 37; INTERNET+RUN_USER_INITIATED_JOBS+POST_NOTIFICATIONS+AndroidX injected; cleartext false; backup false |
| apksigner | v2, cert `74e78654…` |
| DEX | `setUserInitiated`×1; `sendVideo`/`sendDocument`×1; no androidx.work/WorkManager/openOutputStream/broad storage; `deleteDocument`/`renameDocument`/`moveDocument`/`createDocument`×1 (framework); WAKE_LOCK/FOREGROUND_SERVICE only as NotificationCompat symbols (`EXTRA_WAKE_LOCK_ID`, `FLAG_FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_TYPE_*`) |
| Localization | EN/HE parity, 309 each (+35) |

## Environment notes (still current, plus new)

- `GRADLE_USER_HOME=/root/.gradle ./gradlew --offline …`. `aapt2` at `/opt/android-sdk/aapt2-wrapper/aapt2`;
  `apksigner` in `/opt/android-sdk/build-tools/37.0.0`. Debug keystore cert `74e78654…`.
- `TelegramMediaUploadGatewayTest > a connection lost before the body completes...` is **flaky**
  (MockWebServer timing); passes on the full run — re-run if it fails once.
- **Surface tests grep prose:** ScanCoordinator KDoc contains the bare words `WorkManager`, `WAKE_LOCK`,
  `RECEIVE_BOOT_COMPLETED`, `foreground-service`. Use usage-shaped/full-token markers
  (`WorkManager.getInstance`, `android.permission.WAKE_LOCK`) or scope greps. The manifest **comment**
  must also avoid bare permission tokens (I reworded it to "foreground-service, wake-lock, or
  boot-completed").
- **`JobInfo.NETWORK_BYTES_UNKNOWN` is an Int** — `.toLong()` before `setEstimatedNetworkBytes(long,long)`.
- **`AtomicInteger.updateAndGet` needs API 24** (min 23) → lint NewApi. Use synchronized Int.
- **`FLAG_IMMUTABLE` guard on min 23** trips ObsoleteSdkInt (M==23). Just OR it unconditionally.
- **API-34 JobService in manifest** trips NewApi → add `xmlns:tools` + `tools:targetApi="34"` on the
  `<service>`.
- A non-suspend lambda type can't call suspend repo methods — make fake-launcher `result` a
  `suspend (String)->UploadNowResult` when a test triggers stop mid-item.
- The runner depends on `UploadLauncher` (interface), not concrete `MediaUploadCoordinator`, so it is
  fakeable; the gate depends on `ActiveUploadProbe` (interface) for the same reason.

## Artifacts (debug development signing only)

- Main APK: `app/build/outputs/apk/debug/app-debug.apk`, 14,428,922 bytes,
  SHA-256 `8beeefd846b6f7d0205acea037e89a6bd7a831ac27679b40335356f5e457cc80`.
- Instrumentation APK: `app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk`,
  1,566,099 bytes, SHA-256 `495cab881dd67457c488f0c46c4adef970af31724e538bad514c99d3f27c28e5`.
- Package `com.funzi7.telegramtopicuploader`; versionCode 10; versionName `0.5.0-d3b1`; minSdk 23;
  compile/target SDK 37; debug cert SHA-256 `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4`.

## Untested device behaviour

The D3B1 APK has **never** been installed, updated over D3A.1, launched, or run. No background batch,
no UIDT job, no notification, no stop/resume, and no Room 6 -> 7 migration has run on a device, and
neither have the earlier migrations or device checklists. No real SAF provider, video, or hash; no
Telegram traffic; no media mutation.

## Remaining D3B work (not started)

- **D3B2 immediate cancellation** of the in-flight multipart request, mapped onto the
  request-body-complete distinction (replaces the deliberately gentle stop-after-current).
- Result-unknown reconciliation that never re-sends without evidence.
- Explicit, evidence-based resolution of an unowned/ambiguous legacy reservation (D3A.1 blocker).
- **Safe-deletion stage**: provider-aware keep/delete/quarantine with process-death recovery, gated on
  a confirmed positive Telegram message ID.
- Notification stop action currently opens the app to record the stop; a truly background action is a
  later refinement. A paused batch keeps the active slot (no discard action yet).

## Deployment declaration

Nothing was deployed, distributed, installed, or run on a device or emulator in the D3B1 session. No
real Telegram request of any kind was made, no forum topic was created/renamed/closed/deleted, and no
media was uploaded, moved, renamed, copied, downloaded, quarantined, or deleted — every byte in every
test came from a synthetic in-memory array.
