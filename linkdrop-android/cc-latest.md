# LinkDrop — Milestone 0 Handoff (feasibility)

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | funzi7/linkdrop-android |
| Milestone | 0 — feasibility APK + vertical slice (Shizuku clipboard spike) |
| Branch / tracking | main / origin/main |
| Starting application HEAD | (empty repo — no prior commits) |
| Final pushed application HEAD | `e7cb5ff11b31852b24f69aa0f1e61a8b39b4808d` |
| Identity | com.funzi7.linkdrop, 0.1.0-feasibility, versionCode 1, minSdk 30 / targetSdk 36 / compileSdk 37, arm64-v8a only |
| APK (release asset) | LinkDrop-v0.1.0-feasibility-arm64-debug.apk — 125,238,795 bytes |
| APK SHA-256 | `e1904620a0bc1778846056c9fcada8f53884770ec6dd0d9def1ea36bbf288d2b` |
| Signer | debug keystore (feasibility; no release signing configured) |
| Release | prerelease `v0.1.0-feasibility` on GitHub, target = final HEAD, APK attached — confirmed via `gh release view` |
| Git author identity | funzi7 <207505227+funzi7@users.noreply.github.com> (repo-local) |

One coherent commit on main, pushed without force; `git ls-remote` confirms the remote main equals the
local HEAD. No device or emulator was attached.

## What was implemented (application HEAD e7cb5ff)

Native app: Kotlin, Jetpack Compose, Material 3, coroutines/Flow, Room, WorkManager, Hilt (KSP), SAF,
Shizuku API + a Shizuku UserService, foreground download notifications, a repository abstraction around
an embedded on-device yt-dlp + FFmpeg downloader engine.

- **Shizuku** (`shizuku/`): install/binder/permission/UID detection; binder-received/dead + permission
  listeners; UserService bind/unbind + lifecycle; binder-death + fail-safe (no crash / no reconnect
  loop); structured diagnostics; AIDL callback privileged→app; visible last-event timestamp; visible
  last raw clipboard (debug-only, in memory); duplicate-event suppression. The privileged
  `ClipboardUserService` runs as ADB shell (uid 2000) and attempts an event listener via reflected
  `IClipboard` + a redeclared `android.content.IOnPrimaryClipChangedListener`, with a bounded, labelled
  polling fallback (≥750 ms) reading `getPrimaryClip` (args built by parameter type across API levels).
- **Ingestion**: clipboard event, `ACTION_SEND` text/plain (`ShareReceiverActivity`), manual field.
  `UrlNormalizer` recognizes all listed TikTok/X hosts, rejects lookalikes, strips tracking, resolves
  short TikTok links via OkHttp with final-host validation.
- **Queue**: Room-backed with all required columns/statuses, survives process death, unique WorkManager
  work per canonical identity, one concurrent download (single-thread executor).
- **Downloader**: `DownloaderEngine`/`MediaRepository` seams; `io.github.junkfood02.youtubedl-android`
  0.18.1 + FFmpeg; extraction-only op; highest-quality selection w/ a/v merge; image-only →
  `UNSUPPORTED_IMAGES_ONLY` (Hebrew message). `YtDlpJson` parses `--dump-single-json` (incl. playlist
  entries) — the alternative multi-item path.
- **Overlay**: real SYSTEM_ALERT_WINDOW selector (bounded, RTL, non-modal, explicit Download/Cancel,
  nothing auto-selected) + mock-3-entries diagnostic.
- **Storage**: `ACTION_OPEN_DOCUMENT_TREE`, persisted permission, `TikTok/`+`X/` subfolders, temp→SAF
  stream, deterministic sanitized filenames, no silent overwrite, SAF write diagnostic, temp cleanup.
- **UI**: Hebrew RTL diagnostic screen with all required state fields + all required action buttons.
- **CI**: `.github/workflows/android-ci.yml` runs testDebugUnitTest, lintDebug, assembleDebug,
  `git diff --check`, uploads the APK.

## Automated tests run / passed / failed

- `./gradlew testDebugUnitTest` → **70 tests, 0 failures, 0 errors** (all passed). Classes:
  UrlNormalizer 19, DuplicatePolicy 12, IngestClassification 7, FilenameSanitizer 7, QueueStatus 5,
  BinderStateMapper 5, DiagnosticRedaction 5, DownloadFlow 4, FolderMapping 3, ExtractionFixture 3.
- `./gradlew lintDebug` → **0 errors, 31 warnings** (all reviewed/accepted: PrivateApi reflection is
  intentional, MissingPermission is runCatching-guarded, version-newer hints, cosmetics).
- `./gradlew assembleDebug` → APK built; arm64-v8a only; embeds libpython.so + libffmpeg.so.
- `git diff --check` → clean.
- **No failing tests.** No instrumentation/physical tests were run.

## Not physically tested (PENDING — the whole point)

Everything Android-runtime. Clipboard monitoring under Shizuku shell identity on **Samsung One UI 16 is
UNPROVEN** — do NOT claim it works. Also unverified on device: real extraction/downloads, SAF writes,
overlay window, foreground services/notifications, Share path, DB at runtime. See
`docs/PHYSICAL_TEST_PLAN.md` (22 steps + result table left unclaimed).

## Architectural decisions & hard-won facts (reuse these)

- **yt-dlp on Android**: the maintained lib moved to **Maven Central** as
  `io.github.junkfood02.youtubedl-android` (JunkFood02/Seal fork). **JitPack builds fail for ≥0.15** —
  do NOT use `com.github.yausername...`. Bundles Python+FFmpeg → arm64-only APK ≈120 MB. Self-update
  extractors at runtime via `updateYoutubeDL` (TikTok/X break often). GPL-3.0 lib (private app OK).
- **Toolchain cascade**: the newest AndroidX (core 1.19 / lifecycle 2.11 / compose-bom 2026.08 /
  okhttp 5.5) **hard-require AGP 9.1+ and compileSdk 37**. AGP 9 uses **built-in Kotlin** and REJECTS
  the `org.jetbrains.kotlin.android` plugin; **Hilt ≥2.59 requires AGP 9**. So the coherent newest
  stack is AGP 9.3.1 + built-in Kotlin 2.3.21 (compose plugin MUST equal it) + KSP 2.3.7 + Gradle 9.5.0
  + Hilt 2.60.1 + Room 2.8.4 + compileSdk 37/targetSdk 36. Do NOT apply kotlin.android under AGP 9.
- **Build host is ARM running x86_64 SDK tools under qemu**: only `aapt2` is qemu-wrapped
  (`android.aapt2FromMavenOverride`). The native `aidl` binary SIGILLs. Workaround: set
  `buildFeatures.aidl = false` and commit **pre-generated AIDL Java** (`scripts/gen-aidl.sh` runs aidl
  through `qemu-x86_64`). Portable to normal x86_64 CI. Watch for other native tools (zipalign is done
  in-JVM by AGP, so it's fine).
- **Clipboard feasibility (prior art)**: on stock AOSP 12–16 `com.android.shell` holds
  `READ_CLIPBOARD_IN_BACKGROUND`, so a shell UserService can read the clipboard in background and
  register `addPrimaryClipChangedListener`. One UI replaces clipboard internals (SemClipboard/Knox) →
  unknown; that is the empirical test.

## Limitations / risks

Clipboard monitoring unproven on One UI 16; real multi-video surfaces one entry via `getInfo` (overlay
multi-select proven only via mock + YtDlpJson); overlay thumbnails are placeholders; polling is a
diagnostic mechanism; `SpecifyForegroundServiceType` lint warning on the WorkManager FGS to verify on
Android 14+.

## Forbidden-name validation

Case-insensitive scan over project files and this memory dir (excluding .git/.gradle/build) for the
prohibited personal first-name token and the retired `com.<name>` namespace: **PASS — 0 occurrences.**
Everything uses `funzi7` / `com.funzi7.linkdrop`.

## Continuation (Milestone 1)

Run the physical test plan on the Android 16 Samsung device first and record the clipboard-feasibility
verdict + which mechanism fired (listener vs. polling). Then harden the winning path, add real
multi-video + overlay thumbnails, wire runtime engine self-update, and add instrumented tests when a
device/emulator is available. Never claim automatic clipboard monitoring works until the physical test
confirms it.
