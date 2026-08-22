# LinkDrop — v0.1.7-test1 media-validator blocker handoff

## Identity and state

| Field | Value |
| --- | --- |
| Repository | `funzi7/linkdrop-android` |
| Branch / upstream | `main` / `origin/main` |
| Verified starting application HEAD | `90d3fc26480b506645c3aa7524667bfb98388573` (v0.1.6-feasibility release commit) |
| Final pushed application HEAD | `f37d66fdb18a97629dc076997c3a7b92d61a8c6f` |
| Android identity | `com.funzi7.linkdrop`; versionCode 8; versionName `0.1.7-test1` |
| SDK / ABI | minSdk 30 / targetSdk 36 / compileSdk 37 / `arm64-v8a` only |
| Build type | TEST build for physical validation — **NO GitHub release was published** |
| APK | `LinkDrop-v0.1.7-test1-arm64-debug.apk`, 126,750,424 bytes |
| APK SHA-256 | `01a3e90cf2834efb71f1be8cb24a9258c3697816d01794cee4f26bc8c2d2913a` |
| Phone delivery | `/storage/emulated/0/Download/LinkDrop/LinkDrop-v0.1.7-test1-arm64-debug.apk` (SHA-verified copy) |

## The physical finding that forced this build

On the Samsung S25 Ultra, v0.1.6 Retry starts a real download, progress reaches 100%, then the row fails at
`failureStage = MEDIA_PROBE` ("בדיקת מדיה") across multiple X/TikTok items. Bytes download fine; the
validation of the downloaded file itself fails. **v0.1.6 is NOT physically accepted.**

## Root cause (established statically from the packaged APK — not guessed)

`FfprobeMediaIntegrityProbe` launches `nativeLibraryDir/libffprobe.so` (arm64 Android PIE, PT_INTERP
`/system/bin/linker64` — a supported exec method; python exec demonstrably works on this phone) via
`ProcessBuilder`, but v0.1.6 set the child `LD_LIBRARY_PATH` to only
`noBackupFilesDir/youtubedl-android/packages/ffmpeg/usr/lib` + `nativeLibraryDir`. The binary's transitive
DT_NEEDED closure (readelf over the APK payloads, honoring the zips' symlink entries) needs five libraries
that exist ONLY in `packages/python/usr/lib`:
`libcrypto.so.3` (via libssh), `libc++_shared.so` + `libandroid-posix-semaphore.so` (via libx265),
`libandroid-support.so` (via libunistring), `libexpat.so.1` (via libfontconfig).
The Android linker therefore aborts the child ("CANNOT LINK EXECUTABLE") → exec succeeds, exit ≠ 0 →
probe kind `PROCESS_FAILED` → `MEDIA_INTEGRITY_PROBE_FAILED` → stage `MEDIA_PROBE`, on every item.
yt-dlp's own ffmpeg invocations kept working because youtubedl-android 0.18.1's `ENV_LD_LIBRARY_PATH`
(decompiled `YoutubeDL.class`) is `packages/python/usr/lib : packages/ffmpeg/usr/lib :
packages/aria2c/usr/lib` — which is why downloads reached 100%. The M6 host smoke used Debian ffprobe and
could never exercise this path.

## What v0.1.7-test1 changes (one blocker only)

1. **Root fix** — `FfprobeLibraryPath` (pure, unit-tested) now builds the child `LD_LIBRARY_PATH` exactly
   like the wrapper: python, ffmpeg, aria2c package `usr/lib` dirs, then `nativeLibraryDir`, then any
   inherited path, de-duplicated.
2. **Validator preflight** — `MediaValidatorPreflight` self-tests the SAME singleton
   `FfprobeMediaIntegrityProbe` (now Hilt-provided; the engine injects the same instance) against a tiny
   bundled known-good fixture `assets/validator/linkdrop_probe_fixture.mp4` (4,871 bytes, one h264 video +
   one aac audio stream, host-ffprobe-verified). It runs at app startup (after engine init extracts the
   packages) and in `DownloadWorker` immediately after `ensureEngineReady()` — BEFORE source
   check/extraction and any byte transfer. Success is cached per process; failure is never cached.
3. **Fail-closed gate** — on preflight failure the row fails immediately with new code
   `MEDIA_VALIDATOR_UNAVAILABLE` → user message "בדיקת המדיה אינה זמינה כרגע", stage `MEDIA_PROBE`
   (`FailureStageMapper`), while the persisted technical detail keeps the REAL probe failure kind + detail
   (e.g. `PROCESS_FAILED: CANNOT LINK EXECUTABLE …`). No large download starts when the validator cannot run.
4. **Diagnostics** — new `מאמת מדיה (ffprobe)` StatusRow (READY / FAILED — kind: detail / טרם נבדק / בודק…)
   next to the FFmpeg row, plus a manual `בדיקת מאמת מדיה` action that re-runs the preflight.
5. **Packaged-APK inspection** — committed `scripts/inspect-apk-validator.py`: pure-stdlib ELF parser that
   asserts arm64 PIE ffprobe/ffmpeg, the fixture asset, arm64-v8a-only payload, and the FULL linker closure
   resolving against exactly the fixed LD path dirs (symlink-aware). Its negative control (ffmpeg-only
   path) reproduces exactly the five missing libraries on the v0.1.6 APK.
6. Version bump to versionCode 8 / `0.1.7-test1`; copy-script and CI artifact names updated. No
   source-availability/dedup/replacement/history feature was touched.

## Exact-HEAD automated validation (all via /root/work/bin/heavy-run)

| Check | Result at `f37d66fdb18a97629dc076997c3a7b92d61a8c6f` |
| --- | --- |
| `./gradlew testDebugUnitTest` | PASS — 424 tests, 0 failures, 0 errors, 0 skipped |
| `./gradlew lintDebug` | PASS — 0 errors, 39 warnings |
| `./gradlew assembleDebug` | PASS |
| `git diff --check` / worktree | PASS / clean |
| `scripts/inspect-apk-validator.py` on the built APK | PASS — fixture packaged; ffprobe/ffmpeg arm64 PIE; 81-library linker closure fully resolved (76 packaged); also wired into CI |
| Live runtime smoke (real TikTok + X, Debian ffprobe) | PASSED — 5 validated real outputs (see below) |
| Adversarial review (3 independent tracks incl. root-cause refutation) | PASS — root cause independently CONFIRMED; 4 accepted findings fixed pre-commit |

The mandatory live smoke ran `2026-08-22T09:02:14Z`–`09:04:17Z` on the host over live public internet at
exact clean HEAD `f37d66fdb18a97629dc076997c3a7b92d61a8c6f` (verified at start and end, worktree clean),
with official checksum-verified stable yt-dlp (runtime target `official_stable_after_in_app_update`; APK
bundled yt-dlp `2025.11.12`, payload SHA-256 `89a0d9058ea9018e380b7771898ff46e393a1986dcd13fef331693c87ce1fca4`)
and Debian ffmpeg/ffprobe `7.1.5-0+deb13u1`. Validated real outputs — every one ffprobed with a video AND
an audio stream, all via `NORMAL_BEST`:

| Source | Streams | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| `tiktok.com/@intjatarot/video/7649459254197292310` (audio case) | HEVC + MP3 | 30,504,082 | `7c0d8886fda8179d05dcdaa33899faa19fb8c5c1b4761a50dd4bbed65e30a8bb` |
| `x.com/Fun_Viral_Vids/status/2089115673515507916` | H264 + AAC | 458,853 | `a6e0a1658d26de9bca31953abcf274961e2a0ec461e450784090d9cc6c4a4295` |
| `tiktok.com/@zetazuri/video/7407465424998157600` | HEVC + AAC | 5,766,775 | `85955eae01e61651bb498fe16f5d7018b4be6165a565fd25503b8a012044d0a2` |
| `tiktok.com/@gkidsfilms/video/7306281397784694059` | HEVC + AAC | 16,472,623 | `2a1400b834c1413cdc4dae0bdc44eef588c2978fd1301e43db1536b0248dde1a` |
| `tiktok.com/@sigmafemalethings/video/7642782992565275926` (audio case) | HEVC + MP3 | 16,230,367 | `8b34de63b0e01e51292f2c5396bd37638462aedb606648765c56cc2fe3d6871b` |

The mandatory known-rehydration URL (`@israel_edits151`) remained `TEMPORARY_FAILURE` after three bounded
attempts — recorded, never labelled deleted. An earlier same-HEAD run (`~09:00Z`) FAILED because both
default TikTok URLs returned rehydration; that failing run is preserved evidence that the gate blocks, and
the passing run added the documented fallback URLs. **This smoke used Debian ffprobe — it does NOT validate
the Android `libffprobe.so` execution path** (see the validation boundary below).

## Adversarial review outcome

Three independent tracks reviewed the uncommitted change set:

1. **Root-cause refutation** — CONFIRMED the claim from the actual phone-delivered v0.1.6 APK: readelf
   closure reproduces exactly the five missing libraries with the ffmpeg-only path and zero missing with
   python+ffmpeg; decompiled 0.18.1 `ZipUtils.unzip(File,File)` recreates zip symlink entries via
   `Os.symlink` (and that overload is the one used for packages); `ENV_LD_LIBRARY_PATH` is byte-for-byte
   `python:ffmpeg:aria2c`; `extractNativeLibs=true`; linker abort maps to `PROCESS_FAILED` (exec succeeds,
   exit ≠ 0), never `START_FAILED`; every alternative kind (BINARY_MISSING/TIMEOUT/OUTPUT_LIMIT/
   READ_FAILED/INVALID_JSON/SOURCE_MISSING/SELinux) was mechanically ruled out. `libffmpeg.so` shares the
   identical direct NEEDED set and demonstrably links on-device under the wrapper env during yt-dlp merges —
   the strongest available no-device evidence that the fixed ffprobe will link on the S25.
2. **Concurrency/correctness** — two accepted findings, both fixed before commit: the validator gate now
   runs only when engine init succeeded (a transient init failure keeps its pre-existing retryable
   extraction path instead of becoming a terminal validator failure) and before
   `preparePersistedRehydrationRetry` (a broken validator can no longer burn the one-shot engine-update
   budget); a cancelled preflight now restores the previous published state instead of stranding `Running`
   (regression-tested). Ready-is-absorbing-per-process was reviewed and kept deliberately.
3. **Android runtime** — Hilt graph acyclic/complete, asset packaging safe, 5-arity combine exact,
   ProcessBuilder env verified against the decompiled wrapper, version bump consistent. Accepted finding,
   fixed: CI now actually runs `scripts/inspect-apk-validator.py` after assembling the APK.

## Explicit validation boundary

The Android `libffprobe.so` execution path CANNOT be executed on this host (Android bionic binary; the
Debian-ffprobe smoke does not validate it). What is proven without the device: the packaged binary is a
correct arm64 PIE, its full linker closure resolves under the fixed LD path (statically), the preflight
logic is unit-tested, and the gate blocks downloads on failure. What is NOT proven: that ffprobe actually
runs on the S25 Ultra. **Do not claim the runtime bug fixed** until physical acceptance passes.

## Physical acceptance for the user (docs/PHYSICAL_TEST_PLAN.md, PRIORITY section)

- **V-A** — Launch LinkDrop → אבחון מתקדם: `מאמת מדיה (ffprobe)` must read `READY`. If `FAILED`, the row
  shows the exact kind/detail — report it verbatim.
- **V-B** — Retry ONE previously failing X video: 100% → probe passes → SAF write → `COMPLETED`.
- **V-C** — Retry ONE previously failing TikTok: same pipeline.

The v0.1.6 A–G plan remains pending and unchanged after V-A..V-C.
