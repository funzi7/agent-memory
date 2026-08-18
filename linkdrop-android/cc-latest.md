# LinkDrop — Milestone 4 Handoff (Clipboard autofill fix · truthful yt-dlp version/freshness · update-assisted retry · clear-on-success)

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | funzi7/linkdrop-android |
| Milestone | 4 — fix v0.1.3 physical findings: foreground Clipboard autofill, truthful yt-dlp version + auto freshness, update-assisted retry; clear Home field only after a true completion |
| Branch / tracking | main / origin/main |
| Starting application HEAD | `571095449f1a4c5719ecc89f95cde2181df15b2c` (Milestone 3) |
| Final pushed application HEAD | `97f21c2173ad0b4be330c19c8db329bfe14dd850` |
| Starting agent-memory HEAD | `378fe47d81351f0843b915c3ebf934db9a24ae8b` |
| Identity | com.funzi7.linkdrop, 0.1.4-feasibility, versionCode 5, minSdk 30 / targetSdk 36 / compileSdk 37, arm64-v8a only |
| APK (release asset) | LinkDrop-v0.1.4-feasibility-arm64-debug.apk — 125,959,939 bytes |
| APK SHA-256 | `ac83b12dab8fb59a20b6be9d5fad8ebbe4f9c82983228c5e9e9cb5868d35a250` |
| Release | prerelease `v0.1.4-feasibility`, target = final HEAD, asset attached; downloaded asset SHA re-verified == source |
| Phone delivery | `/storage/emulated/0/Download/LinkDrop/LinkDrop-v0.1.4-feasibility-arm64-debug.apk` (SHA matches source) |
| Git author identity | funzi7 <207505227+funzi7@users.noreply.github.com> (repo-local) |

One coherent commit on main, pushed without force; `git ls-remote` confirms remote main == local HEAD.
No device or emulator was attached to the build.

## Physical evidence carried in (real device — Samsung Galaxy S25 Ultra · Android 16 / One UI · arm64)

Confirmed working (do not re-test): real X download completes, file exists under `X/`; duplicate skip works;
Advanced-Diagnostics manual download works; Shizuku automatic background clipboard ingestion worked while
Shizuku was active; **Shizuku stops when the hotspot/Wi-Fi that starts it is removed** (so optional). The
permanent Home URL field is usable; with Shizuku off, Home truthfully shows auto-detection disabled.

The three v0.1.3 defects this milestone fixed:
1. **Foreground Clipboard autofill did NOT work** — v0.1.3 read the clipboard in `MainActivity.onResume()`,
   but since Android 10 a foreground app can read the clipboard only once its window has **input focus**.
2. **Running yt-dlp version invisible (`yt-dlp ?`)** — a manual update returned DONE but the UI still showed `?`.
3. **A specific X URL failed twice with `I/O operation on closed file`, then downloaded after a manual engine
   update** — consistent with the upstream yt-dlp urllib closed-file regression (2025.11.12 → fixed 2025.12.08,
   PR #15049), NOT proof (pre/post versions not captured). The bundled Python env uses stdlib urllib only.

Deferred (explicitly NOT done): the `adb tcpip 5555` / localhost Shizuku-persistence experiment.

## What was implemented (application HEAD 97f21c2)

- **Clipboard autofill fix:** read in `MainActivity.onWindowFocusChanged(true)` (not onResume);
  lifecycle-scoped `OnPrimaryClipChangedListener` (STARTED-only, focus-guarded, unregistered in onStop);
  pure `ingest/ClipTextExtractor` (direct text, else coerceToText). `ClipboardAutofillPolicy.evaluate`
  adds a Reason; VM emits bounded, deduped `clipboard/CLIPBOARD_*` diagnostics + records last result for
  Advanced Diagnostics. Strictly UI-only (never submits).
- **Clear Home field only after success:** `HomeUrlFieldState` gains submittedKey/submittedText; submit no
  longer clears; a VM always-on queue collector edge-detects newly terminal-success rows (baseline on first
  emission) + pure `ingest/HomeFieldClearPolicy` (clear only watched-submission-complete-and-unchanged, or an
  external COMPLETED matching the exact AUTOFILLED value; never a typed value, never a duplicate-skip externally).
- **Truthful version:** `YtDlpDownloaderEngine.probeVersion()` runs `yt-dlp --version` via `execute()` (fallback
  `version(context)`), on init and after update. `EngineState.Updating(prev)`; null version → "גרסת yt-dlp לא זמינה"
  never `?`. `MediaRepository.updateEngine` → Ready→Updating→Ready reactively; a FAILED update restores the prior
  state (a failed init stays Failed — do NOT fabricate Ready). Structured `EngineUpdateResult` +
  `EngineUpdateClassifier` (UPDATED only from a real before/after change; unknown before/after → NO_CHANGE).
- **engineMutex** serializes extract/download/update (download holds it whole transfer). Separate from initMutex
  and MediaRepository.updateMutex; acquired without nesting → no deadlock.
- **Auto freshness:** `download/EngineFreshnessPolicy` (24h) from `LinkDropApp.onCreate` in appScope,
  non-blocking, once/interval, STABLE only. lastEngineCheckAt persisted only when the update did NOT fail.
- **Failure classification + bounded retry:** `downloader/EngineErrorClassifier` (exact `I/O operation on closed
  file` → IO_CLOSED_FILE candidate; filesystem/no-output/postprocessing/cancel never retried).
  `download/EngineUpdateRetryPolicy` (one bounded transient retry via WorkManager runAttemptCount; one controlled
  update + one retry for a stale engine candidate; afterEngineUpdate retries only on a genuine UPDATED).
  `DownloadWorker.handleFailure` uses `Result.retry()` (same row + unique work → no dup job/file); new RETRYING
  status; per-identity engine-retry tracked in-process by `download/EngineRetryTracker` (dedupKey, no migration);
  worker aborts on a terminal row (no cancelled-row resurrection). Concise Home "ההורדה נכשלה" / "נסה שוב".

New pure files: downloader/{EngineErrorClassifier,EngineUpdateClassifier}.kt,
download/{EngineFreshnessPolicy,EngineUpdateRetryPolicy,EngineRetryTracker}.kt,
ingest/{HomeFieldClearPolicy,ClipTextExtractor}.kt. New QueueStatus.RETRYING (TEXT — no DB migration; added to
DuplicatePolicy.ACTIVE_STATUSES, WorkReconciliationPolicy.isInFlight, QueueRepository.inFlightRows).

## Internal 4-track adversarial review — confirmed findings, all fixed and re-tested

- **HIGH:** a failed engine update flipped a failed init into `Ready(version unavailable)` and reported the
  downloader ready → `updateEngine` restores the prior state on FAILED.
- **MEDIUM-HIGH:** persisting the freshness clock on a FAILED update suppressed the proven recovery for 24h →
  persist only on a non-failed update (LinkDropApp + assisted-retry).
- **MEDIUM-HIGH (clipboard):** anti-refill guard stored the canonical URL while the clipboard holds the raw
  value → re-filled a just-cleared URL. Fixed: don't overwrite the last-seen raw clipboard key at clear time.
- **MEDIUM:** a manual update queued behind an active download mislabeled Home "updating" → `homeStatusLine`
  shows an in-progress transfer ("מוריד כעת") ahead of the updating label.
- **LOW:** EngineUpdateClassifier claimed UPDATED with an unknown before-version → NO_CHANGE.
- **LOW:** cancelled row could be resurrected by a racing retry run → worker aborts on a terminal row.

## Automated tests / lint / build

- `./gradlew testDebugUnitTest` → **231 tests, 0 failures** (178 M3 + 53 new). New/extended: ClipboardAutofillPolicy
  (+5 evaluate/Reason), ClipTextExtractor 4, HomeFieldClearPolicy 9, EngineErrorClassifier 7, EngineUpdateRetryPolicy 7,
  EngineFreshnessPolicy 5, EngineUpdateClassifier 5, EngineVersionLabel 4, MediaRepositoryEngineState (+5), QueueActiveSemantics
  (+1 RETRYING), QueueStatus (+1). `./gradlew lintDebug` → 0 errors. `assembleDebug` → arm64 APK (libpython.so + libffmpeg.so).
  `git diff --check` clean. All heavy builds via the device-wide lock. Merged manifest: versionCode 5, versionName
  0.1.4-feasibility, SystemForegroundService keeps dataSync, NO wifi/UNMETERED token.

## Reused hard-won facts (still true / newly confirmed)

- Build host ARM + x86_64 SDK under qemu: `buildFeatures.aidl=false` + committed pre-generated AIDL Java
  (`scripts/gen-aidl.sh`); AGP 9.3.1 built-in Kotlin 2.3.21, KSP 2.3.7, Hilt 2.60.1, Room 2.8.4, WorkManager
  2.11.2, Compose BOM 2026.08.00, youtubedl-android 0.18.1. Heavy Gradle auto-routes through `/root/work/bin/heavy-run`.
- **youtubedl-android 0.18.1 (primary-source confirmed):** `version(context)`/`versionName(context)` read
  SharedPreferences ("youtubedl-android", keys dlpVersion/dlpVersionName) written ONLY by an update → **null on a
  never-updated bundled install** (that was the `?`). Run `YoutubeDLRequest(listOf()).addOption("--version")` +
  `execute()` and read `getOut().trim()` for the REAL runtime version. `UpdateStatus.DONE` ≠ a version change
  (compares GitHub tag vs the stored pref). Updated yt-dlp binary lives in `noBackupFilesDir/youtubedl-android/yt-dlp/`,
  SURVIVES app updates (init_ytdlp copies the bundled binary only if none exists), wiped on uninstall/clear-data.
  Bundled Python = stdlib urllib + OpenSSL (no requests/urllib3). `execute(req, id)` 2-arg overload exists.
- **yt-dlp `I/O operation on closed file`:** real urllib request-handler regression (introduced stable 2025.11.12,
  fixed PR #15049 in stable 2025.12.08), hit during HLS/m3u8 (X video uses HLS). Update on STABLE to fix.
- **Android clipboard:** since Android 10, foreground clipboard reads require window INPUT FOCUS (or default IME);
  `onResume()` does not guarantee focus — use `onWindowFocusChanged(true)`. Android 12 paste-toast fires only on the
  first cross-app read.
- Adding a QueueStatus value needs NO Room migration (TEXT via converter; DB v1; unknown→FAILED). Release: `gh release
  create` of the ~120 MB APK can time out mid-upload; create the release first, then `gh release upload --clobber`. The
  `file#name` rename syntax did NOT apply here — physically copy the APK to the versioned name before uploading, or the
  asset lands as `app-debug.apk`. `scripts/copy-apk-to-downloads.sh` default name bumped to v0.1.4.

## Not physically tested (PENDING — the next device test)

**No device/emulator attached.** The Clipboard autofill fix (focus read + live listener + no-overwrite),
clear-on-success, real `--version` reporting + the runtime updater, automatic freshness, the update-assisted retry,
Share without Shizuku, FIFO two-URL, TikTok, screen-off, recents-removal, reboot — all pending
`docs/PHYSICAL_TEST_PLAN.md` (Tests A–F first). JVM tests do NOT prove Android's real Clipboard/focus timing, the
yt-dlp updater/version query, notifications, or WorkManager retry timing. Do NOT claim any new flow works until the
user physically verifies `0.1.4-feasibility`.

## Continuation (Milestone 5)

Run `docs/PHYSICAL_TEST_PLAN.md` Tests A–F: Clipboard autofill on focus + live update + no-overwrite (Shizuku OFF);
manual Home download + clear-only-after-completion; real yt-dlp version + before/after on update; update-assisted
retry (bounded, no loop, no dup) if a compatible failure occurs; Share without Shizuku; FIFO two-URL. Only after A–F:
screen-off / recents / reboot / TikTok, and the deferred persistent-Shizuku experiment. Then real multi-video +
thumbnails, restore a stranded AWAITING_SELECTION, Compose/instrumented tests. Never claim the new flows work until
physically confirmed.
