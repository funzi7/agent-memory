# LinkDrop — Milestone 5 handoff

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | `funzi7/linkdrop-android` |
| Branch / tracking | `main` / `origin/main` |
| Starting application HEAD | `97f21c2173ad0b4be330c19c8db329bfe14dd850` |
| Final pushed application HEAD | `fb34f2977b3f0e1622875b92e606d651f74506ae` |
| Known LinkDrop agent-memory starting HEAD | `ff0f8dbe57e5ed87b492616d81821ac0fab79e30` |
| Agent-memory repository base at finalization | `a063ab791b97dc2ebed087d99f3da2c835d37e2b` (other project handoffs had advanced the shared repository) |
| Android identity | `com.funzi7.linkdrop`, versionCode 6, versionName `0.1.5-feasibility`, minSdk 30 / targetSdk 36 / compileSdk 37, arm64-v8a only |
| Git identity | `funzi7 <207505227+funzi7@users.noreply.github.com>` |
| Prerelease | [`v0.1.5-feasibility`](https://github.com/funzi7/linkdrop-android/releases/tag/v0.1.5-feasibility), target and tag both resolve to the final application HEAD |
| Release asset | `LinkDrop-v0.1.5-feasibility-arm64-debug.apk`, 126,297,555 bytes |
| APK SHA-256 | `ef006039ee30ec5d6b15b566bb349a9bd64d95e1d42f45bdfd941152be2fce9e` |
| Phone delivery | `/storage/emulated/0/Download/LinkDrop/LinkDrop-v0.1.5-feasibility-arm64-debug.apk` |

The project commit was pushed without force. Local `main`, remote `main`, the release tag, and the release target
were independently verified as the same full application SHA. The source APK, phone-storage copy, GitHub API
digest, and an independently downloaded release asset all have the size and SHA-256 above. The release is marked
as a prerelease and contains one correctly named asset.

## Physical facts carried forward from `v0.1.4-feasibility`

Verified on a Samsung Galaxy S25 Ultra running Android 16 / current One UI, arm64-v8a:

1. Foreground Clipboard autofill works with Shizuku off.
2. A copied X URL fills the permanent Home field.
3. The Home URL remains while a download is running.
4. The Home URL clears only after actual successful completion.
5. Share → LinkDrop works with Shizuku off.
6. Two URLs submitted quickly work FIFO: the first downloads, the second waits, then starts automatically.
7. Advanced Diagnostics displayed the actual runtime yt-dlp version `2026.07.04` on the tested device.
8. Real X downloads work.
9. Duplicate prevention prevents a second physical media file.
10. Shizuku remains optional and LinkDrop works without it.

Defects physically observed on that same v0.1.4 build:

- Some TikTok downloads work.
- Diagnostics showed all TikTok rows, while Home Recent did not show the newest records correctly.
- Repeated completed TikTok submissions created persistent `SKIPPED_DUPLICATE` rows, but not extra media files.
- At least one TikTok downloaded with audio; at least two TikTok jobs were marked `COMPLETED` and created files
  without audio.
- `https://www.tiktok.com/@israel_edits151/video/7665458835611520276` physically failed with
  `Unable to extract universal data for rehydration`.
- The stable engine updater reported current stable / no newer stable at that time.
- One X post containing a real video was falsely classified as images-only.

These are physical facts about v0.1.4. They do not physically prove Milestone 5 behavior.

User decision implemented: **Download Again downloads to private temp, validates, stages a safe replacement,
and replaces the old file only after success. Any failure keeps the old file and authoritative URI.**

Explicitly deferred: the `adb tcpip 5555` / localhost persistent-Shizuku experiment. Shizuku remains optional.

## Milestone 5 implementation

### Home, duplicate handling, identity, and Share

- Room owns one deterministic ordering contract: `createdAt DESC, id DESC`. Home takes the first ten terminal
  logical rows in that order and reacts to the DAO Flow; Diagnostics retains complete history.
- Completed duplicates now return a typed result before insert, WorkManager scheduling, or output. Normal code
  creates zero duplicate rows/work/files. A bounded diagnostic event is allowed. Startup deletes only legacy
  rows whose literal status is `SKIPPED_DUPLICATE`; completed, failed, cancelled, and active history is preserved.
- A process-wide identity mutation gate and repository matching converge Home, Share, Shizuku, Diagnostics,
  TikTok `vm`/`vt` short links, resolved canonical links, and surrounding share text on one logical post.
- Active duplicates return `AlreadyActive`. Share still submits directly; Home truthfully shows
  `כבר בתהליך הורדה` instead of inviting a second submission. Backend idempotency is the boundary.
- Only explicit `הורד מחדש` bypasses completed-duplicate blocking. Generation-fenced unique work with `KEEP`
  prevents two replacement taps or Share/Home/Shizuku during replacement from starting another job.

### X classification

- `UNSUPPORTED_IMAGES_ONLY` now requires affirmative all-still-image evidence. Empty download lists, unknown
  wrapper formats, and no recognized usable video become extraction ambiguity rather than still-image proof.
- A bounded secondary structured yt-dlp JSON probe is available for incomplete X mapping.
- Legacy X images-only rows remain retryable/re-evaluable in place; video found on re-extraction follows normal
  download flow without adding history clutter.

### TikTok final-media integrity and fallback

- Extraction records bounded format evidence: format ID, codecs, protocol, dimensions/bitrate/container, and
  audio-only/video-only/muxed distinctions. Source audio expectation is conservative and tri-state.
- Normal highest-practical-quality selection remains first. Every produced private temp video is inspected with
  the bundled arm64 `libffprobe.so` before SAF or `COMPLETED`; the probe has hard process/output bounds and parses
  structured JSON for actual streams, codecs, container, and duration.
- When reliable source evidence says audio is expected, an actual silent output cannot complete. The finite,
  de-duplicated fallback plan tries explicit best-video + known audio, an H264 muxed A/V format, then another safe
  muxed A/V representation. It never globally forces low-resolution H264 and cannot loop.
- A good fallback completes. Exhausted expected-audio fallbacks fail with `MEDIA_AUDIO_MISSING` and normal Hebrew
  text `הסרטון ירד ללא אודיו ולכן לא נשמר`. Probe failure and audio-only output cannot falsely complete. Affirmative
  source-no-audio evidence permits a legitimate silent video.
- Diagnostics persist only bounded/redacted format and final-probe summaries. Signed URL queries, cookies,
  authorization data, tokens, and huge raw logs are not retained.

### Rehydration and engine update budget

- The universal-data marker maps to `TIKTOK_REHYDRATION_UNAVAILABLE` and the user message
  `TikTok לא החזיר כרגע את נתוני הסרטון. נסה שוב מאוחר יותר.` Raw generic `yt-dlp -U` advice is sanitized and is
  neither user advice nor proof that a stable update exists.
- Recovery reuses the same row and performs at most one delayed extraction retry. A serialized STABLE freshness
  check may run once if independently stale; installed-current stable skips updater work. No nightly/master.
- Room schema 2 adds durable `engineUpdateAttempted` and `workGeneration` fields, plus replacement URI state.
  The atomic updater claim survives process death; explicit Retry/Download Again starts a new generation and a
  fresh bounded budget. The in-memory tracker is keyed by exact `(rowId, workGeneration)`.

### Transactional replacement and recovery

- Completed rows in Home and Diagnostics expose `הורד מחדש`; failed rows retain Retry where appropriate.
- A replacement retains the old output and URI, downloads privately, runs the full integrity/fallback gate,
  creates a distinct SAF candidate, and verifies provider read-back length and SHA-256.
- Both old and candidate URIs are durable before authority changes. The old document is deleted only after the
  new authoritative candidate has been re-verified. SAF atomic rename semantics are never assumed.
- Failure before candidate staging restores the valid old completed row. Candidate-bearing uncertain state is
  left recoverable for startup rather than cleared by cancellation. Replacement work has no user Cancel action.
- Failure reports `ההורדה מחדש נכשלה — הקובץ הקודם נשמר`; success reports `הקובץ הוחלף בהצלחה`.
- Room migration `1 -> 2` is registered and non-destructive. It adds nullable old/candidate URIs and non-null
  generation/updater fields with default zero; schema identity hash is `3d202066ee97e845099dfa5478371aa8`.

### Preserved Milestone 4 contracts

- Clipboard autofill remains UI-only and works without Shizuku.
- Home URL stays through active work and clears only after true completion.
- Share works without Shizuku; transfer coordination remains FIFO one-at-a-time.
- Normal work requests `NetworkType.CONNECTED`, allows cellular, requests expedited execution with fallback,
  and retains WorkManager's default executor. The old global single-thread executor was not reintroduced.
- Merged `SystemForegroundService` retains `foregroundServiceType="dataSync"`; notifications remain truthful.
- Actual runtime yt-dlp version display, 24-hour STABLE freshness, serialized engine work, and bounded assisted
  retry remain in place.

## Runtime/dependency decision

Primary sources were checked on 2026-08-21. yt-dlp `2026.08.19` was the current stable release at execution;
this is a dated observation, not a hardcoded forever-latest value. Maven Central and the upstream tag still list
`youtubedl-android` `0.18.1` as latest/release. The resolved AAR bundles Python 3.12, QuickJS, FFmpeg, and ffprobe;
it does not bundle `requests`, `urllib3`, `curl_cffi`, or `yt_dlp_ejs`, and its wrapper exposes no probe API.
LinkDrop therefore directly invokes the bundled ffprobe binary with bounded arguments. The wrapper/runtime was
intentionally kept unchanged: no unsupported large native dependency, impersonation stack, or nightly engine was
added. Upstream TikTok HEVC/audio and rehydration reports informed defensive design but do not prove the cause of
each physical v0.1.4 failure.

## Automated validation and adversarial review

- `./gradlew testDebugUnitTest`: **313 tests, 0 failures, 0 errors, 0 skipped**.
- `./gradlew lintDebug`: **0 errors, 35 warnings**.
- `./gradlew assembleDebug`: **passed**.
- All heavy Gradle work ran through the installed phone-wide heavy-build queue.
- `git diff --check`: clean before commit; final project worktree is clean after push.
- Packaged metadata: versionCode 6, versionName `0.1.5-feasibility`, application ID `com.funzi7.linkdrop`.
- APK native libraries are arm64-v8a only and include Python, FFmpeg, ffprobe, and QuickJS.
- Merged WorkManager service is `dataSync`; normal downloads require CONNECTED, not UNMETERED/Wi-Fi-only;
  Shizuku remains optional; no custom WorkManager executor is configured.
- Source, phone, GitHub digest, and independent release download SHA-256 all match exactly.
- Forbidden identity scan was clean; source, tests, fixtures, docs, metadata, Git identity, and this handoff use
  only `funzi7` for project identity.

Four independent adversarial tracks reviewed duplicate/order/identity races, media integrity/rehydration,
replacement/cancellation/recovery, and tests/docs/release evidence. Confirmed issues were fixed and the final
heavy suite was rerun. Final review found no remaining automated release blocker, including the fourteen named
failure modes: expected-audio silence cannot complete; old replacement output is not deleted first; normal
duplicates cannot persist rows; source races share one gate; retry/update budgets are finite and durable; generic
updater prose is sanitized; ambiguous X is not images-only; cleanup is literal-status-only; explicit replacement
does not weaken normal dedup; Home order is deterministic; legitimate silent sources are accepted; duplicate
replacement taps share one generation; old URI authority is retained until safe commit.

## Physical validation still required

No device or emulator was attached during Milestone 5 implementation and release validation. All Milestone 5
runtime behavior remains physically unverified by the agent. Run `docs/PHYSICAL_TEST_PLAN.md` A–H on the target
Samsung device:

1. New TikTok appears immediately at the top of Home Recent and in Diagnostics.
2. Repeated completed Home/Share submissions create no file, row, or work clutter.
3. Repair a known silent TikTok with Download Again; observe old-file retention, audio fallback, one final file,
   and old-file preservation on forced failure.
4. Download several new TikToks and verify actual audio whenever source audio exists.
5. Retry the known rehydration URL; expect no false update advice, one bounded recovery, concise final failure,
   and no duplicate row/work.
6. Re-evaluate the existing false X images-only row; if video is found, download it in place.
7. TikTok Share → LinkDrop must begin directly without pressing Home Download.
8. Re-run Shizuku-off Clipboard autofill, URL retention/clear, two-URL FIFO, normal X, and runtime-version display.

The `adb tcpip 5555` / localhost persistent-Shizuku experiment remains deferred.
