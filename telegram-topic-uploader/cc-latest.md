# Telegram Topic Uploader — latest handoff

## Task and repository state

| Field | Value |
| --- | --- |
| Task | D3B1.2 — add the `ACCESS_NETWORK_STATE` permission Android requires of a job that declares a required network, and preflight it locally |
| Application repository | `/root/work/telegram-topic-uploader` |
| Branch | `main` |
| Tracking branch | `origin/main` |
| Starting application HEAD | `3645597f2a2359e7962e4573b847976ac6dfee37` (D3B1.1) |
| Version | code 11 -> 12, name `0.5.1-d3b1.1` -> `0.5.2-d3b1.2` |
| Room schema | **stays 7.** No schema change, no migration, no schema file touched |
| Deployment | None. Not installed or run on any device or emulator in this session |

No production token, Telegram identifier, bot username/ID, chat ID, thread ID, group title, forum
topic name, private link, binding command, file name, content URI, document ID, path, or media hash
was requested, used, or recorded anywhere, including this file.

## New user-reported device evidence (D3B1.1 on hardware; not observed by any agent)

- D3B1.1 was installed and launched on the user's Android device.
- The existing background batch was still available.
- The user tapped the background-upload action.
- The app displayed the exact sanitized category equivalent to **"background-upload security permission
  is unavailable"**.
- **No video was sent.**
- **No source-file mutation** was reported.
- The two original queued test videos **do not need to be recreated or rescanned**.
- Background execution, notification progress, and lock-screen continuation were **not reached**.

## Corrected diagnosis

The displayed message is the `BatchScheduleResult.SecurityRejected` string, which is reachable from
exactly one place: a `SecurityException` thrown by `JobScheduler.schedule`. So the build reached the
platform and the platform threw — it did **not** return `RESULT_FAILURE`, and the D3B1.1 window-focus
gate did not stop it.

Official Android contract: a `JobInfo` built with `setRequiredNetwork(...)` or
`setRequiredNetworkType(...)` may only be scheduled by an app that declares
`android.permission.ACCESS_NETWORK_STATE`; from Android 14 `JobScheduler.schedule` throws
`SecurityException` otherwise. The app targets 37, builds the batch JobInfo with
`setRequiredNetwork(NetworkRequest)`, declared `INTERNET` + `RUN_USER_INITIATED_JOBS` +
`POST_NOTIFICATIONS`, and did **not** declare `ACCESS_NETWORK_STATE`.

**Record correction:** the D3B1.1 permission-dialog/window-focus race was a *real* code defect and its
fix stays intact and in force — it was simply not the blocker the device was hitting. No media was sent
or changed during either rejected attempt.

## What D3B1.2 implements

**Manifest.** Adds exactly `<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />`
(once). The four intentional permissions are now INTERNET, ACCESS_NETWORK_STATE,
RUN_USER_INITIATED_JOBS, POST_NOTIFICATIONS. It is a **normal install-time** permission — granted on
install/update, no user approval, never passed to `ActivityResultContracts.RequestPermission`, no
rationale, no Settings escalation. Everything else kept: non-exported `BatchUploadJobService` +
`BIND_JOB_SERVICE`, `setUserInitiated(true)`, `setRequiredNetwork(...)`, focused-window gate, typed
results, `SCHEDULE_RETRY_REQUIRED`, Try-again / Cancel-unstarted, same frozen snapshot, same sequential
D3A path.

**Preflight + preconditions.** `UidtBatchScheduler.holdsNetworkStatePermission()` uses
`ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_NETWORK_STATE) ==
PackageManager.PERMISSION_GRANTED`. New pure `SchedulePreconditions(networkStatePermissionGranted,
componentResolvable, canRunUserInitiatedJobs)` with `mayAttempt = all three`. `jobScheduler.schedule(...)`
(the single call site) runs only when `mayAttempt`; otherwise the new `RawScheduleOutcome.NotAttempted`
is produced and the platform is never called. `classifyScheduleOutcome(preconditions, outcome, success,
failure)` now takes the precondition object; the network-state check is first, then component, then
run-state, then the raw outcome. New sanitized enum value
`BatchScheduleResult.NetworkStatePermissionUnavailable`; `SecurityRejected` kept as the fallback for
any other `SecurityException`.

**Message.** New `UiNotice.BATCH_SCHEDULE_NETWORK_STATE_UNAVAILABLE` ->
`batch_notice_schedule_network_state_unavailable`, EN/HE parity: "This version doesn't currently hold
the network-state permission Android requires for background transfer. Update or reinstall the
application. Nothing was sent." Deliberately **not** the notification-permission message; no platform
constant or exception text in either locale.

**Files touched.** `app/src/main/AndroidManifest.xml`; `domain/batch/BatchUploadPorts.kt`
(`NetworkStatePermissionUnavailable`, `RawScheduleOutcome.NotAttempted`, `SchedulePreconditions`,
`classifyScheduleOutcome` signature); `platform/UidtBatchScheduler.kt` (preflight + gate);
`ui/MainViewModel.kt` (notice + mapping); `ui/TelegramTopicUploaderApp.kt` (notice -> string);
`res/values{,-iw}/strings.xml`; `app/build.gradle.kts` (version). Tests: new
`security/D3B12SurfaceTest.kt`; extended `BatchScheduleResultMapperTest`, `BatchUploadCoordinatorTest`,
`MainViewModelTest`; permission assertions updated in `D1SecuritySurfaceTest`, `D2B1SurfaceTest`,
`D2B2ASurfaceTest`, `D2B2BSurfaceTest`, `D3ASurfaceTest`, `D3A1SurfaceTest`, `D3B1SurfaceTest`. Docs:
README, TODO, ARCHITECTURE, PROJECT_STATE, RELEASE_REVIEW, SECURITY, D3B1_DEVICE_CHECKLIST.

## Tests and exact results

Full JVM suite: **641 tests across 53 classes, 0 failures, 0 errors, 0 skipped** (D3B1.1 baseline: 625
across 52). No re-run needed — the previously flaky MockWebServer gateway test passed first time.

- `D3B12SurfaceTest` (new, 7): source manifest declares ACCESS_NETWORK_STATE exactly once and nothing
  unrelated, no duplicate, no `uses-permission-sdk-23`; every merged/packaged manifest the build
  produces carries the four intentional permissions and no unrelated one (AndroidX's injected
  dynamic-receiver permission is the only allowance); exactly one `ActivityResultContracts.RequestPermission`
  and only POST_NOTIFICATIONS is ever `.launch(...)`ed, no rationale/Settings escalation, and
  `Manifest.permission.ACCESS_NETWORK_STATE` is referenced in exactly one file; `jobScheduler.schedule(`
  appears exactly once and only behind `if (preconditions.mayAttempt)`; the category maps to its own
  notice while PermissionUnavailable keeps its own; EN/HE parity with no platform constant in the text;
  no WorkManager/foreground service/wake lock/boot receiver/`openOutputStream` added.
- `BatchScheduleResultMapperTest` (extended): missing declaration -> `mayAttempt` false and
  `NetworkStatePermissionUnavailable`, reported before every other cause, never PermissionUnavailable
  and never SecurityRejected; held declaration proceeds to the existing checks; SecurityException still
  -> SecurityRejected; RESULT_SUCCESS still Accepted.
- `BatchUploadCoordinatorTest` (extended): a network-state rejection keeps the snapshot recoverable
  (`markScheduleRetryRequired`) and touches no upload job; a session rejected before the fix retries the
  same frozen snapshot with no new snapshot created; repeated retries submit exactly one platform job.
- `MainViewModelTest` (extended): all seven non-accepted `BatchScheduleResult` categories map to seven
  distinct notices, asserted exhaustively over the enum.
- Seven surface tests converted from "count of `<uses-permission` == 3" to exact-set assertions on the
  four permission **names** (not substring checks).

| Check | Result |
| --- | --- |
| `--offline testDebugUnitTest` | 641 / 53 classes, 0 failures, 0 errors, 0 skipped |
| `--offline lint` | **0 issues** (`lint-results-debug.xml` has an empty `<issues>` element) |
| `--offline assembleDebug` / `assembleDebugAndroidTest` | passed |
| Instrumentation | 93 tests / 11 classes **compile, not run** (no device); androidTest APK byte-identical |
| Room schema | stays **7**; no schema JSON changed; 1–7 committed |
| `git diff --check` | clean |

## APK identity (debug development signing only)

- Main APK `app/build/outputs/apk/debug/app-debug.apk`: **14,312,872 bytes**, SHA-256
  `912311540bb2964eadbd21bb6725ef5b3086e95078e22f8e9c52704a94f36b79`.
- Instrumentation APK: 1,566,099 bytes, SHA-256
  `495cab881dd67457c488f0c46c4adef970af31724e538bad514c99d3f27c28e5` (unchanged since D3B1).
- Package `com.funzi7.telegramtopicuploader`; versionCode 12; versionName `0.5.2-d3b1.2`; minSdk 23;
  compile/target SDK 37; cleartext false; backup false.
- AAPT2 permissions: INTERNET, ACCESS_NETWORK_STATE, RUN_USER_INITIATED_JOBS, POST_NOTIFICATIONS (+
  AndroidX `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`). One non-exported
  `platform.BatchUploadJobService` with `BIND_JOB_SERVICE`; no receiver of ours.
- Debug cert SHA-256 `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4` (v1+v2 verify)
  — matches the expected value and every earlier build, so it updates over D3B1.1 in place.
- DEX (`strings` over extracted `classes*.dex`): `ACCESS_NETWORK_STATE` once, `setUserInitiated` once,
  `canRunUserInitiatedJobs` present; no `androidx/work`, no `WorkManager`, no `openOutputStream`.
- Replaced D3B1.1 APK: 14,312,025 bytes, SHA-256
  `a19be6cb3a7bd17b6c54129631efd3b90e9eb939d90d3f522b26cea19616a414`.

## Untested device boundary

The D3B1.2 APK has **never** been installed, updated over D3B1.1, launched, or run. **Whether Android
now accepts the schedule call is unproven** — that is exactly what the device run exists to determine.
No background batch, UIDT job, notification, lock-screen continuation, stop/resume, cancel-unstarted,
or Room migration has run on hardware. No real SAF provider, video, or hash; no Telegram traffic; no
media mutation — every test byte was a synthetic in-memory array.

## Next device action (ask for exactly this, nothing more)

1. Install D3B1.2 over D3B1.1 **without uninstalling**.
2. Open Queue.
3. Use **Try background upload again** on the existing frozen batch.
4. Confirm the batch is accepted.
5. Background or lock the device.
6. Confirm both videos upload exactly once.
7. Confirm both source files remain unchanged.

Do **not** ask for another scan or replacement files unless the original rows are no longer present.
No permission dialog should appear for the network-state permission; if the app still reports it is not
held, the install is malformed and needs a reinstall.

**After D3B1.2 passes on the device, multi-topic binding in one session is the next product feature.**

## Env notes (still current)

- `GRADLE_USER_HOME=/root/.gradle ./gradlew --offline …`; `aapt2` at
  `/opt/android-sdk/aapt2-wrapper/aapt2`; `apksigner` in `/opt/android-sdk/build-tools/37.0.0`.
- **`dexdump` crashes (Illegal instruction) in this sandbox** — use `strings` over extracted
  `classes*.dex` for DEX marker checks.
- The merged manifest is produced by `processDebugMainManifest`, which resource processing (and hence
  unit-test compilation) already depends on, so a merged-manifest assertion works inside
  `testDebugUnitTest` without a prior `assembleDebug`.
- Referencing a permission constant under a `||` short-circuit can trip lint `InlinedApi`; an
  early-return SDK guard silences it. `ACCESS_NETWORK_STATE` needs no SDK guard (API 1).
- Unit tests cannot instantiate `UidtBatchScheduler` (no Robolectric/mockito in this project), so the
  preflight is proved through the pure `SchedulePreconditions`/`classifyScheduleOutcome` plus a
  source-shape guard on the single `schedule(` call site.

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

Nothing was deployed, distributed, installed, or run on a device or emulator in the D3B1.2 session. No
real Telegram request of any kind was made, no forum topic was created/renamed/closed/deleted, and no
media was uploaded, moved, renamed, copied, downloaded, quarantined, or deleted — every byte in every
test came from a synthetic in-memory array.
