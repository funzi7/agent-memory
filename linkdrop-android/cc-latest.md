# LinkDrop — Milestone 2 Handoff (Android 16 crash fix + FGS hardening + physical evidence)

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | funzi7/linkdrop-android |
| Milestone | 2 — fix Android 16 download crash, harden foreground-service execution, record physical findings |
| Branch / tracking | main / origin/main |
| Starting application HEAD | `2803eeaea8babe24c07f17dec992f0dc8e4e279e` (Milestone 1) |
| Final pushed application HEAD | `045d007460f3260b0d9e530e3f08ea3cdda03551` |
| Starting agent-memory HEAD | `25b3e39d88a2231f9c0717e7b4ac93e4390bfa0f` |
| Identity | com.funzi7.linkdrop, 0.1.2-feasibility, versionCode 3, minSdk 30 / targetSdk 36 / compileSdk 37, arm64-v8a only |
| APK (release asset) | LinkDrop-v0.1.2-feasibility-arm64-debug.apk — 125,487,623 bytes |
| APK SHA-256 | `996cedc79000b47b3a05ebee8448f2bd400fc7817e9153b33b018f06ad6862ef` |
| Release | prerelease `v0.1.2-feasibility`, target = final HEAD, asset attached + digest verified (sha256 matches) |
| Phone delivery | `/storage/emulated/0/Download/LinkDrop/LinkDrop-v0.1.2-feasibility-arm64-debug.apk` (SHA matches source) |
| Git author identity | funzi7 <207505227+funzi7@users.noreply.github.com> (repo-local) |

One coherent commit on main, pushed without force; `git ls-remote` confirms remote main == local HEAD.
No device or emulator was attached to the build.

## Physical test evidence (Samsung Galaxy S25 Ultra · Android 16 / One UI · arm64) — real device

Ran `v0.1.1-feasibility` on the phone. **Proved:** install + onboarding usable; **Google Play REFUSED
Shizuku** (built-for-older-Android) so Shizuku was installed from the **official RikkaApps/Shizuku GitHub
release** and started via **Wireless Debugging over a temporary hotspot** (no Wi-Fi); onboarding
completed; **background clipboard ingestion works for screen-on + X foreground** — a copied X URL was
detected automatically, persisted in Room, queued, reached `DOWNLOADING`, WITHOUT the manual field or
Share. **Failed:** progress stuck at 0%, app crashed, row left at `DOWNLOADING 0%`, crash recurred on
reopen, no file produced. The "מפעיל האזנה אוטומטית לקישורים" Snackbar was near the crash but is NOT the
cause (benign auto-start-monitoring feedback; preserved). **Still unproven:** screen-off, recents-swipe,
reboot, long-term Shizuku, listener-vs-polling, and any completed download.

## Crash root cause (STATIC diagnosis — device logcat was NOT accessible)

Build host is Termux/PRoot: no authorized adb device, no `rish`, `logcat`/`getprop` blocked (fake-root
can't cross into Android namespace), no tombstone/ANR artifact in shared storage. **The exact runtime
exception was NOT recovered and none was invented.** Diagnosed from the merged manifest + WorkManager
2.11.2 bytecode (conclusive): `DownloadWorker` promotes with `FOREGROUND_SERVICE_TYPE_DATA_SYNC`, but
WorkManager's `SystemForegroundService` merged into the APK with **no** `foregroundServiceType`. On
Android 14+ (device API 36) `Service.startForeground(…, DATA_SYNC)` throws `IllegalArgumentException`
("not a subset of foregroundServiceType attribute … in manifest"). WorkManager's `Api31Impl` catches
ONLY `ForegroundServiceStartNotAllowedException` + `SecurityException` (verified in bytecode), so the
`IllegalArgumentException` propagated on the service main thread → process crash. The old worker wrote
`DOWNLOADING` before `setForeground()` and outside try/catch → row stuck at `DOWNLOADING 0%`.

## What was implemented (application HEAD 045d007)

- **Merged-manifest fix (definitive):** merged `android:foregroundServiceType="dataSync"` onto
  `androidx.work.impl.foreground.SystemForegroundService` (`tools:node="merge"`). VERIFIED present in
  `app/build/intermediates/packaged_manifests/.../AndroidManifest.xml` + both merged_manifest
  intermediates, with FOREGROUND_SERVICE + FOREGROUND_SERVICE_DATA_SYNC permissions.
- **Guarded promotion:** `DownloadWorker.promoteToForeground` wraps `setForeground()`; pure
  `ForegroundPromotionPolicy.classify(className,message)`→`FgsPromotionOutcome` (Promoted /
  StartNotAllowed→`FGS_START_NOT_ALLOWED` / ConfigOrSecurityError→`FGS_PROMOTION_CONFIG_ERROR`) then
  `decide()`. Every failure continues as a normal Worker; no FGS exception can crash-loop. (Note: the
  IllegalArgumentException is thrown on WorkManager's service main thread, NOT the worker coroutine, so
  the manifest fix — not the guard — prevents THAT crash; guard covers the rejection path.)
- **Queue ordering:** pure `DownloadStartupPolicy.evaluate(hasDestination, ExtractionGate)` gates
  destination→extraction→entry; row becomes `DOWNLOADING` only on `ProceedToTransfer`. Failures →
  `NO_DESTINATION`/extraction code/`NO_DOWNLOADABLE`, never stuck 0%.
- **Startup reconciliation:** pure `WorkReconciliationPolicy.decide(status, WorkPresence)` +
  `StartupReconciler` (reads `getWorkInfosForUniqueWork`). In-flight = DETECTED/EXTRACTING/QUEUED/
  DOWNLOADING; ACTIVE work→Leave, ABSENT→`markInterrupted(INTERRUPTED_PROCESS)` (retryable, no
  attemptCount bump, never touches COMPLETED). Wired in `LinkDropApp.onCreate` (Dispatchers.IO). Never
  enqueues (no dup jobs). AWAITING_SELECTION intentionally left for future overlay-restore.
- **Exit evidence:** pure `ExitReasonMapper` (REASON_* → code/level/meaningful; hasReadableTrace;
  bounded+redacted summarize) + `ExitReasonReporter` reads `getHistoricalProcessExitReasons`, logs the
  last meaningful exit (`exit/EXIT_*`) deduped via `SettingsRepository.lastExitReportedAt`. Traces
  bounded to 4KB read + 1200-char redacted excerpt; ANR/native only. NOT a Logcat replacement.
- **Stage diagnostics:** `DownloadStage` enum + `ProgressCoalescer(25%)`; pipeline emits DETECTED/
  NORMALIZED/WORK_ENQUEUED, worker emits WORK_STARTED…DOWNLOAD_DONE/FAILED. Progress coalesced.
- **Shizuku GitHub fallback:** pure `ShizukuInstall` (githubReleasesUrl = official RikkaApps/Shizuku
  releases/latest; market/playStore). `ShizukuManager.openShizukuGithub` + `VM.installShizukuFromGithub`
  + onboarding secondary button "הורדה רשמית מ-GitHub" in the NOT_INSTALLED step. Official sources only;
  no scrape/silent-install.

New pure files: download/{DownloadStage,ForegroundPromotionPolicy,DownloadStartupPolicy,
WorkReconciliationPolicy}.kt, diagnostics/ExitReasonMapper.kt, shizuku/ShizukuInstall.kt. New Android:
download/StartupReconciler.kt, diagnostics/ExitReasonReporter.kt.

## Automated tests / lint / build

- `./gradlew testDebugUnitTest` → **136 tests, 0 failures** (99 M1 + 37 new). New: ForegroundPromotion
  PolicyTest 9, WorkReconciliationPolicyTest 8, ExitReasonMapperTest 8, DownloadStartupPolicyTest 5,
  DownloadStageTest 4, ShizukuInstallTest 3. Covers every §14 case incl. dedup-after-interrupt.
- `./gradlew lintDebug` → **0 errors, 33 warnings**. `./gradlew assembleDebug` → arm64-v8a APK
  (libpython.so + libffmpeg.so). `git diff --check` clean. All heavy builds via the device-wide
  heavy-build lock (not bypassed).
- Merged manifest validated (task §15): SystemForegroundService has foregroundServiceType="dataSync".

## Not physically tested (PENDING — the whole point of the next test)

**No device/emulator attached to the build.** The crash fix, the corrected download path (has NEVER
completed a file on device), reconciliation on a real interrupted row, exit-reason capture, clipboard
monitoring beyond screen-on — all pending. The manifest fix is verified STATICALLY only; whether
`startForeground` actually succeeds on One UI 16 is unverified. Do NOT claim the download works until the
user physically verifies `0.1.2-feasibility`.

## Reused hard-won facts (still true)

- Build host ARM + x86_64 SDK under qemu: `android.aapt2FromMavenOverride` set globally; native `aidl`
  SIGILLs → `buildFeatures.aidl=false` + committed pre-generated AIDL Java (`scripts/gen-aidl.sh`). SDK
  at `/opt/android-sdk` via `local.properties`.
- Toolchain unchanged: AGP 9.3.1 built-in Kotlin 2.3.21, KSP 2.3.7, Hilt 2.60.1, Room 2.8.4,
  WorkManager 2.11.2, Compose BOM 2026.08.00, youtubedl-android 0.18.1. `data object` works.
- WorkManager 2.11.2 specifics learned this milestone: its AAR declares SystemForegroundService with NO
  foregroundServiceType; `Api31Impl.startForeground` swallows only ForegroundServiceStartNotAllowed +
  SecurityException (API 29/30 path does NOT wrap at all); MissingForegroundServiceTypeException never
  referenced. So any FGS-type-mismatch on API 34+ crashes unless the merged manifest declares the type.
- APK delivery: `scripts/copy-apk-to-downloads.sh` probes real writable Download dir, publishes to
  `Download/LinkDrop/<versioned>.apk`, verifies src↔dst SHA-256. Default name bumped to v0.1.2.

## Forbidden-name validation

Case-insensitive scan (excluding .git/.gradle/build/.kotlin) for the prohibited personal name + retired
`com.<name>` namespace: **PASS — 0 occurrences** (also 0 for the email local-part token). All packages
`com.funzi7.linkdrop*` (+ intentional framework `android`/`android.content` for the @hide clipboard
AIDL). namespace/applicationId = com.funzi7.linkdrop. Same scan run over this agent-memory dir.

## Continuation (Milestone 3)

Run `docs/PHYSICAL_TEST_PLAN.md` on the already-configured device: install `0.1.2-feasibility` from
`Download/LinkDrop/`, copy one public X video URL with X foreground, confirm **no crash + progress > 0% +
a completed file under X/**, then TikTok, then duplicate-skip, then read Advanced Diagnostics for the
clipboard mechanism (listener vs polling) and the `stage/*` + `FGS_*` outcome. Only after the core path
works: screen-off / recents / interrupted-recovery / Shizuku-restart / reboot. Then harden the winning
clipboard path, real multi-video + thumbnails, periodic engine-update worker, Compose/instrumented tests.
Never claim clipboard monitoring or downloads work until physically confirmed.
