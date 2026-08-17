# LinkDrop — Milestone 3 Handoff (Shizuku optional · Home URL autofill · one-at-a-time · truthful notifications)

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | funzi7/linkdrop-android |
| Milestone | 3 — manual use without Shizuku, foreground Clipboard autofill, immediate downloads, truthful notifications, queue/UI fixes |
| Branch / tracking | main / origin/main |
| Starting application HEAD | `045d007460f3260b0d9e530e3f08ea3cdda03551` (Milestone 2) |
| Final pushed application HEAD | `571095449f1a4c5719ecc89f95cde2181df15b2c` |
| Starting agent-memory HEAD | `3c43c97423f881eae6ebfb9c39309b2ecd1eb6d2` |
| Identity | com.funzi7.linkdrop, 0.1.3-feasibility, versionCode 4, minSdk 30 / targetSdk 36 / compileSdk 37, arm64-v8a only |
| APK (release asset) | LinkDrop-v0.1.3-feasibility-arm64-debug.apk — 125,879,091 bytes |
| APK SHA-256 | `6561145e0221414408c063edbeffec64512e7a55629087c31dd871980f6f5184` |
| Release | prerelease `v0.1.3-feasibility`, target = final HEAD, asset attached; downloaded asset SHA re-verified == source |
| Phone delivery | `/storage/emulated/0/Download/LinkDrop/LinkDrop-v0.1.3-feasibility-arm64-debug.apk` (SHA matches source) |
| Git author identity | funzi7 <207505227+funzi7@users.noreply.github.com> (repo-local) |

One coherent commit on main, pushed without force; `git ls-remote` confirms remote main == local HEAD.
No device or emulator was attached to the build.

## Physical evidence carried in (real device — Samsung Galaxy S25 Ultra · Android 16 / One UI · arm64)

On `v0.1.2`: the interrupted `v0.1.1` X download **recovered and completed**; the file physically exists
under the configured `X/` folder; a second X URL copied while Shizuku monitored was auto-detected,
extracted (title shown), and completed; re-copying a completed URL was skipped as a **duplicate**;
Advanced-Diagnostics manual URL download works. **Shizuku stops when the temporary hotspot/Wi-Fi that
starts it via Wireless Debugging is removed** — so on cellular it cannot be an always-available
prerequisite. That drove the Milestone-3 "Shizuku is optional" correction.

## What was implemented (application HEAD 5710954)

- **Shizuku optional in onboarding (§3/§4):** `OnboardingStateMapper` gains `requiredReady`
  (folder+overlay), `REQUIRED_STEPS`/`OPTIONAL_STEPS`, and an `OnboardingSnapshot.requiredReady` field;
  `allReady` still means "all incl. Shizuku". Wizard finishes on `requiredReady`, offers
  *"המשך בלי זיהוי אוטומטי"*, labels Shizuku steps *"(רשות)"*, never shows a not-running Shizuku as done.
  `finishOnboarding` starts monitoring only if Shizuku READY and leaves `autoMonitorAttempted=false`
  otherwise so the `init{}` collector auto-starts monitoring if Shizuku later becomes READY.
- **Permanent Home URL card (§5)** + **foreground Clipboard autofill (§6):** Home field + *"הורד"* routes
  through the same `UrlIngestPipeline` via new `IngestSource.HOME_MANUAL`. `MainActivity.onResume` reads
  the clipboard (no Shizuku) → `vm.onForegroundClipboard`; pure `ClipboardAutofillPolicy` decides
  Fill/Ignore, never submits, never overwrites deliberate edits (fills only empty field or its own prior
  autofilled value). Pure `HomeUrlPolicy` reflects an already-active/completed identity (*"כבר הורד"*).
- **Strict single ingestion:** all sources converge on the mutex-serialized idempotent `ingest()` +
  `DuplicatePolicy`; `enqueueUniqueWork(workName, KEEP)` keeps exactly one WorkRequest per canonical
  identity (workName = `linkdrop_dl_$dedupKey`, stable across the row's life).
- **Deterministic one-at-a-time (§10/§11):** KEY INSIGHT — `DownloadWorker` is a `CoroutineWorker`; its
  `doWork()` runs on `Dispatchers.Default`, NOT the WorkManager main executor, so the old single-thread
  `setExecutor` did NOT serialize transfers. Removed it (default executor). New fair-`Mutex`
  `DownloadCoordinator.withTransferSlot`: second item → `WAITING` ("ממתין") → FIFO auto-release on
  completion/failure/cancellation (`finally`), no Activity needed. New `WAITING` `QueueStatus` (stored as
  TEXT name — NO Room migration; converter maps unknown→FAILED) is an active hold in
  `DuplicatePolicy.ACTIVE_STATUSES` + `WorkReconciliationPolicy.isInFlight` + `QueueRepository.inFlightRows`.
- **Immediate background start (§9)** + **cellular (§14):** `DownloadScheduler` sets
  `setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)` (preserves the request); only
  `NetworkType.CONNECTED` constraint (never UNMETERED). `NetworkPolicy` documents/asserts it.
- **Truthful notifications & stages (§12/§13):** start notification only at `DOWNLOAD_START`, posted
  explicitly (appears even when FGS promotion fell back / Activity never opened); ongoing notification one
  id per row (`fgsId`), completion only after SAF write. Pure `DownloadNotificationPolicy` is the tested
  contract. New `DownloadStage`: `WORK_ENQUEUE_REQUESTED`, `WORK_RUNNING`, `WAITING`, `COMPLETED`,
  `DUPLICATE_SKIPPED`; the false "…ההורדה החלה" enqueue message is gone.
- **Honest queue wording (§8):** Home active section *"הורדות"* (non-terminal only); `queueStatusHebrew`
  maps `WAITING→"ממתין"`, `DOWNLOADING→"מוריד"`, `QUEUED/EXTRACTING/DETECTED→"מכין הורדה"` — never *"בתור"*.
  Advanced Diagnostics *"כל הרשומות (N)"*.

New pure files: download/{DownloadCoordinator,DownloadNotificationPolicy,NetworkPolicy}.kt,
ingest/{ClipboardAutofillPolicy,HomeUrlPolicy}.kt.

## Internal 4-track adversarial review — confirmed findings, all fixed

- **MAJOR:** `retry()` bypassed the duplicate policy → could download a second file for a since-COMPLETED
  identity / orphan a QUEUED row. Now runs `DuplicatePolicy.decide` over sibling rows first (skip/refuse).
- **HIGH:** cancellation cleanup ran suspend Room calls in an already-cancelled coroutine → row never
  marked CANCELLED / notification never cleared. Now wrapped in `withContext(NonCancellable)`.
- **MEDIUM-HIGH:** failure notifications posted at the FGS id were wiped by WorkManager's foreground-service
  teardown on `Result.failure()`. Terminal (completed/failed) notifications now post at a disjoint id
  (`TERMINAL_DOWNLOAD_BASE` [3000,3999] vs. ongoing [2000,2999]); ids never collide.
- **MEDIUM:** on API 30 (minSdk) expedited work runs as an FGS, so `getForegroundInfo()` posts before
  `doWork()` — it returned a "מוריד"/progress notification for a pre-gate/WAITING item. Now returns a
  neutral *"מכין הורדה"* notification, upgraded to the real one only at `DOWNLOAD_START`.
- **LOW:** the Home automation notice + an onboarding KDoc were reworded to be truthful (the notice reads
  the real Shizuku phase — *"האזנה אינה פעילה"* when Shizuku is up but not monitoring).
- **Known limitation (not fixed, pre-existing overlay path):** an `AWAITING_SELECTION` row stranded by
  process death permanently blocks its identity (recoverable via the diagnostics cancel button) — TODO.

## Automated tests / lint / build

- `./gradlew testDebugUnitTest` → **178 tests, 0 failures** (136 M2 + 42 new). New: ClipboardAutofillPolicy
  7, HomeUrlPolicy 8, DownloadCoordinator 4 (coroutines-test), DownloadNotificationPolicy 7, NetworkPolicy 2,
  OnboardingOptionalShizuku 5, QueueActiveSemantics 6, AutoDetectionNotice 3.
- `./gradlew lintDebug` → **0 errors, 33 warnings**. `./gradlew assembleDebug` → arm64-v8a APK
  (libpython.so + libffmpeg.so). `git diff --check` clean. All heavy builds via the device-wide lock.
- Merged manifest: versionCode 4, versionName 0.1.3-feasibility, SystemForegroundService keeps
  `foregroundServiceType="dataSync"`, FOREGROUND_SERVICE_DATA_SYNC present, NO wifi/UNMETERED token.

## Not physically tested (PENDING — the next device test)

**No device/emulator attached.** Home Clipboard autofill, Shizuku-free manual/Share download, immediate
expedited background start, the new start/progress/completion notifications, FIFO multi-download, TikTok,
screen-off, recents-removal, reboot — all pending `docs/PHYSICAL_TEST_PLAN.md` (Tests A–E first). JVM
coordinator tests do NOT prove Android's real expedited/FGS/notification behaviour. Do NOT claim any of the
new flows work until the user physically verifies `0.1.3-feasibility`.

## Reused hard-won facts (still true)

- Build host ARM + x86_64 SDK under qemu: `android.aapt2FromMavenOverride` set globally; native `aidl`
  SIGILLs → `buildFeatures.aidl=false` + committed pre-generated AIDL Java (`scripts/gen-aidl.sh`). SDK
  at `/opt/android-sdk` via `local.properties`.
- Toolchain unchanged: AGP 9.3.1 built-in Kotlin 2.3.21, KSP 2.3.7, Hilt 2.60.1, Room 2.8.4,
  WorkManager 2.11.2, Compose BOM 2026.08.00, youtubedl-android 0.18.1. `data object` works.
- WorkManager 2.11.2: `CoroutineWorker.doWork()` runs on `Dispatchers.Default`, NOT the `setExecutor`
  executor — so a single-thread executor does not serialize coroutine transfers (use app-level
  coordination). On API < 31, expedited work runs as an FGS and calls `getForegroundInfo()` before
  `doWork()`. SystemForegroundService still needs the merged `dataSync` type (M2 fix retained).
- Adding a `QueueStatus` enum value needs NO Room migration (stored as TEXT via converter; DB version 1;
  `stringToStatus` maps unknown→FAILED). Heavy Gradle auto-routes through `/root/work/bin/heavy-run` lock
  via the global PreToolUse hook. Release: `gh release create` of the ~120 MB APK can exceed a 2-min
  timeout mid-upload; the release is created but assetless — finish with `gh release upload --clobber`.
- APK delivery: `scripts/copy-apk-to-downloads.sh` (default name bumped to v0.1.3) verifies src↔dst SHA.

## Continuation (Milestone 4)

Run `docs/PHYSICAL_TEST_PLAN.md` Tests A–E on the configured device: Shizuku OFF Home autofill + manual
download on cellular (start + completion notifications + file under X/); Share without Shizuku; automatic
mode with Shizuku up (app not opened); two URLs (second shows "ממתין", starts automatically); duplicate
skip. Only after A–E: screen-off / recents / reboot / TikTok. Then harden the winning clipboard path, real
multi-video + thumbnails, periodic engine-update worker, Compose/instrumented tests, and reconcile stranded
`AWAITING_SELECTION` rows. Never claim the new flows work until physically confirmed.
