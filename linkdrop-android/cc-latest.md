# LinkDrop — Milestone 1 Handoff (setup wizard + lifecycle fixes)

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | funzi7/linkdrop-android |
| Milestone | 1 — setup wizard, Shizuku lifecycle fix, per-action feedback, reactive engine state |
| Branch / tracking | main / origin/main |
| Starting application HEAD | `e7cb5ff11b31852b24f69aa0f1e61a8b39b4808d` (Milestone 0) |
| Final pushed application HEAD | `2803eeaea8babe24c07f17dec992f0dc8e4e279e` |
| Starting agent-memory HEAD | `03f2d392a8fbb58cc2758dcb741069b8fb0a0dd5` |
| Identity | com.funzi7.linkdrop, 0.1.1-feasibility, versionCode 2, minSdk 30 / targetSdk 36 / compileSdk 37, arm64-v8a only |
| APK (release asset) | LinkDrop-v0.1.1-feasibility-arm64-debug.apk — 125,599,395 bytes |
| APK SHA-256 | `7fe67178a337115c519dddf43040952a2ecfef4af4c415e588000f1ce3670c84` |
| Signer | debug keystore (feasibility; no release signing configured) |
| Release | prerelease `v0.1.1-feasibility`, target = final HEAD, APK attached; created after push |
| Phone delivery | `/storage/emulated/0/Download/LinkDrop/LinkDrop-v0.1.1-feasibility-arm64-debug.apk` (SHA matches source) |
| Git author identity | funzi7 <207505227+funzi7@users.noreply.github.com> (repo-local) |

One coherent commit on main, pushed without force; `git ls-remote` confirms remote main equals the local
HEAD. No device or emulator was attached.

## What was implemented (application HEAD 2803eea)

Milestone 0 was a working vertical slice behind one dense diagnostic screen. Milestone 1 turns it into a
guided app; product scope and the open clipboard-feasibility question are unchanged.

- **First-run setup wizard** (`onboarding/OnboardingState.kt` pure mapper + `ui/OnboardingScreen.kt`):
  four steps — Shizuku (install/open), authorize LinkDrop in Shizuku, choose a download folder (real
  TikTok/ + X/ subfolder create + write test via new `SafStorage.verifyDownloadFolder()`), grant overlay.
  Each step's "done" is derived from the **real device state every launch**; onboarding-complete is a new
  DataStore flag set **only after a live re-verification** of `OnboardingStateMapper.allReady`. Then
  monitoring auto-starts once per process.
- **Explicit Shizuku phase model** (`shizuku/ShizukuPhase.kt` + `ShizukuPhaseMapper`; `shizuku/MonitorGate.kt`):
  NOT_INSTALLED · INSTALLED_NOT_RUNNING · RUNNING_PERMISSION_REQUIRED · READY_UNBOUND · BINDING · BOUND ·
  MONITORING · ERROR. `MonitorGate.mayBind` = only when READY (delegates to `BinderStateMapper.canOperate`).
  **The meaningless `monitor/bind_timeout` is gone**: `ClipboardMonitorService` now enters foreground first
  (startForegroundService OS contract), then gates on `mayBind`; the 6s wait only runs when READY, so a
  failure there is a genuine bind failure (`monitor/bind_failed`) or a defined `monitor/lost`, never a
  missing-prerequisite timeout. `DiagnosticViewModel.startMonitoring()` also gates before starting.
- **Reactive engine lifecycle** (`downloader/EngineState.kt` + `MediaRepository` `StateFlow<EngineState>`):
  NotStarted → Initializing → Ready(version, ffmpeg) / Failed(message). `ensureEngineReady()`/`retryEngineInit()`
  are mutex-serialized, idempotent, off the main thread. `EngineState.fromInitResult` is the pure reducer.
  The UI collects the flow; the racy `engineVersion == null` heuristic is gone.
- **Feedback for every action** (`DiagnosticViewModel` `messages` Channel → Snackbar in `AppRoot`): every
  button emits a Snackbar and/or a visible state change; actions that cannot run are disabled with a hint.
- **Clean home + Settings → advanced diagnostics** (`ui/AppRoot.kt` router + Snackbar host, `HomeScreen.kt`,
  `SettingsScreen.kt`, `DiagnosticScreen.kt` retitled "אבחון מתקדם", `UiCommon.kt` shared composables +
  Hebrew status mappers). Home = title + one-line status + action banner + active queue + recent. Nothing
  from the old diagnostic screen was removed — it all lives under Settings now.
- **Guarded downloads** (`SafStorage.hasRoot()` + guard in `UrlIngestPipeline.classifyAndRoute` and at the
  top of `DownloadWorker.doWork`): a download never starts without a valid SAF destination
  (`NO_DESTINATION`, retryable).
- **Manifest `<queries>`** extended with `market` + `https` VIEW intents so `ShizukuManager.launchShizukuApp()`
  / `openShizukuInStore()` resolve. Package const `SHIZUKU_PACKAGE = moe.shizuku.privileged.api`.
- **APK auto-delivery** (`scripts/copy-apk-to-downloads.sh`): probes the real writable Android Download dir
  (candidates `/storage/emulated/0/Download`, `/sdcard/Download`, Termux downloads — **do not guess**),
  publishes to `Download/LinkDrop/<versioned>.apk`, and verifies source↔destination SHA-256.

## Automated tests / lint / build

- `./gradlew testDebugUnitTest` → **99 tests, 0 failures, 0 errors** (70 from M0 + 29 new). New classes:
  ShizukuPhaseTest 8, OnboardingStateTest 7, MediaRepositoryEngineStateTest 5, MonitorGateTest 5,
  EngineStateTest 4. These cover every required M1 case: onboarding for not-installed / installed-not-running
  / permission-missing / ready; SAF missing; overlay missing; all-ready; binder death; permission denied;
  engine INITIALIZING→READY and →FAILED; no bind in NOT_INSTALLED / not-running; auto-start only when all
  prerequisites ready.
- `./gradlew lintDebug` → **0 errors, 31 warnings**. The previously-flagged `MissingPermission` on
  `DownloadNotifier.notify()` (runCatching-guarded) is now `@SuppressLint`-justified → 0 errors.
- `./gradlew assembleDebug` → arm64-v8a APK, embeds libpython.so + libffmpeg.so. `git diff --check` clean.
- All heavy builds ran through the global heavy-build lock (PreToolUse hook auto-wraps `gradlew`); the lock
  was not bypassed.

## Not physically tested (PENDING — still the whole point)

No device/emulator. Everything Android-runtime is unverified: the **onboarding-on-device flow**, Shizuku
binding + clipboard observation (the primary feasibility question, still **UNPROVEN** on One UI 16), real
extraction/downloads, SAF writes, the overlay, foreground services/notifications, the Share path, DB at
runtime. Compose composables were **not** rendered on a device — only the pure state machines behind them
are unit-tested. `docs/PHYSICAL_TEST_PLAN.md` was rewritten to start from the wizard (no diagnostic-button
hunting on home).

## Reused hard-won facts (still true)

- Build host is ARM running x86_64 SDK under qemu: `android.aapt2FromMavenOverride=/opt/android-sdk/aapt2-wrapper/aapt2`
  (global `~/.gradle/gradle.properties`); native `aidl` SIGILLs so `buildFeatures.aidl=false` + committed
  pre-generated AIDL Java (`scripts/gen-aidl.sh`). SDK at `/opt/android-sdk` via `local.properties`.
- Toolchain: AGP 9.3.1 built-in Kotlin 2.3.21 (no `kotlin.android` plugin), KSP 2.3.7, Hilt 2.60.1, Room 2.8.4,
  compileSdk 37 / targetSdk 36, Compose BOM 2026.08.00. yt-dlp = `io.github.junkfood02.youtubedl-android` 0.18.1
  (JitPack broken ≥0.15). `.entries` on enums works.
- coroutines-test is wired as `testImplementation`; `MediaRepository` is JVM-testable with a fake `DownloaderEngine`
  (interface-only deps) — that is why the engine StateFlow lives in `MediaRepository`, not the Android-bound
  `YtDlpDownloaderEngine`.

## Forbidden-name validation

Case-insensitive scan over project files (excluding .git/.gradle/build/.kotlin) for the prohibited personal
first name + retired `com.<name>` namespace: **PASS — 0 occurrences.** All packages are `com.funzi7.linkdrop*`
(plus the intentional framework `android.content` for the redeclared @hide clipboard AIDL). namespace/applicationId
= com.funzi7.linkdrop. Same scan run over this agent-memory dir before commit.

## Continuation (Milestone 2)

Run `docs/PHYSICAL_TEST_PLAN.md` on the Android 16 Samsung device **starting from the onboarding wizard**;
install directly from `Download/LinkDrop/`. Confirm on-device: no `bind_timeout` when Shizuku is absent; every
action gives feedback; the reactive engine row updates without "refresh". Record the clipboard-feasibility
verdict (listener vs polling, latency, power). Then harden the winning clipboard path, add real multi-video +
overlay thumbnails, wire runtime engine self-update to a periodic worker, and add instrumented/Compose UI tests
when a device/emulator is available. Never claim clipboard monitoring works until the physical test confirms it.
