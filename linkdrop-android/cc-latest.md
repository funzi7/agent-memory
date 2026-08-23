# LinkDrop — v0.1.8-test1 Facebook/progress handoff

## Identity and delivery

| Field | Value |
| --- | --- |
| Repository | `funzi7/linkdrop-android` |
| Branch / upstream | `main` / `origin/main` |
| Starting application HEAD | `f37d66fdb18a97629dc076997c3a7b92d61a8c6f` |
| Final pushed application HEAD | `9223fe52889f56f6a28ec104905b7fd4099bb86e` |
| Android identity | `com.funzi7.linkdrop`; versionCode 9; versionName `0.1.8-test1` |
| SDK / ABI | minSdk 30 / targetSdk 36 / compileSdk 37 / `arm64-v8a` only |
| Build type | TEST build for focused Facebook physical acceptance; **no GitHub release was published** |
| APK | `LinkDrop-v0.1.8-test1-arm64-debug.apk`, 127,337,384 bytes |
| APK SHA-256 | `dbd07774443fd69ed8710c2314db6c3991f509f4e40c3dc105038263d2f85ea4` |
| Phone delivery | `/storage/emulated/0/Download/LinkDrop/LinkDrop-v0.1.8-test1-arm64-debug.apk`; source/destination SHA-256 and byte comparison match |

## New physical facts from v0.1.7-test1

The Samsung Galaxy S25 Ultra on Android 16/current One UI now reports
`מאמת מדיה (ffprobe) = READY`. Multiple real X downloads and multiple real TikTok downloads reached
`COMPLETED`, exercising extraction -> download -> Android media probe -> SAF -> completion. The old global
v0.1.6 `MEDIA_PROBE` blocker is therefore **physically fixed**.

Some individual X/TikTok sources still fail during `EXTRACTION` as `TEMPORARY_FAILURE` or `UNKNOWN`.
These source-specific extraction results are not validator failures. Another physical observation was a
successful job visibly reaching 100%, resetting to 0%, and reaching 100% again. With
`bestvideo*+bestaudio/best`, yt-dlp can transfer separate video and audio components; the old UI flattened
both callbacks into one unexplained percentage.

## Focused v0.1.8-test1 changes

1. **First-class public Facebook video** — `Platform.FACEBOOK` uses display/folder name `Facebook` and the
   existing ingest, queue, dedup, source-state, validated download, ffprobe/audio, SAF, retry, Download
   Again, and FIFO paths. Supported identities include singular `/reel/<id>`, concrete
   `/<owner>/videos/<id>`, `watch/?v=<id>`, and `video.php?v=<id>`; tracking parameters are discarded while
   `v` identity is preserved. Current `pfbid...` video IDs are also accepted. Arbitrary Facebook pages,
   profiles, photo-only URLs, lookalike hosts, credentials, cookies, and login workarounds are not.
2. **Bounded Facebook redirects** — unresolved `fb.watch` and Facebook `/share/r|v/...` forms have no
   invented post ID and require controlled HTTPS resolution. Every hop must remain on a legitimate
   Facebook host; the resolver stops as soon as a concrete supported Facebook video/reel is reached, so a
   later login redirect cannot erase a proven public identity.
3. **Truthful progress** — youtubedl-android 0.18.1's third callback value is its raw stdout line, not an
   unused opaque value. A small process-local current-work store interprets download destinations,
   merger/postprocessor lines, and component resets without a Room migration. For the fixed primary
   selector, the UI can label the first two objectively ordered downloads `מוריד וידאו` and
   `מוריד אודיו`; merge is `ממזג וידאו ואודיו`. Unknown later components remain generic. A structural
   validation fallback first publishes `מנסה פורמט חלופי`, separately from a new component. The same
   Room row and one WorkRequest remain in use.
4. **Cleaner Home source semantics** — a completed row with a present local file no longer looks broken
   because a later online check is `UNKNOWN` or `TEMPORARY_FAILURE`. Failed extraction rows show one concise
   explanation rather than a duplicate failure-stage line. Advanced Diagnostics retains source state,
   failure stage, code/detail, timestamps, and truthful transient progress.
5. **Restricted access** — factual private/login/friends-only Facebook results map to `RESTRICTED` and stop
   new transfer work. Generic 403/ambiguity is not called deleted. A completed local file remains usable;
   stale restricted/not-available source-gate errors are cleared only on the narrowly eligible completed
   rows.

TikTok/X behavior, validator preflight-before-transfer, cellular permission, optional Shizuku, UI-only
foreground clipboard autofill, direct Android Share ingestion, local/source state independence, safe
replacement, and one-transfer-at-a-time FIFO remain intact. There is no Facebook-specific downloader and
no validator bypass.

## Automated validation

All heavy Gradle commands used `/root/work/bin/heavy-run` on the final application source set:

| Check | Result |
| --- | --- |
| `./gradlew testDebugUnitTest` | PASS — 458 tests, 0 failures/errors/skips |
| `./gradlew lintDebug` | PASS — no errors (39 reported findings) |
| `./gradlew assembleDebug` | PASS |
| `git diff --check` / cached check | PASS |
| `python3 scripts/runtime-smoke.py --self-test` | PASS |
| `scripts/inspect-apk-validator.py app/build/outputs/apk/debug/app-debug.apk` | PASS — 4,871-byte fixture; arm64 ffprobe/ffmpeg; all 81 closure libraries resolved from 76 packaged libraries |
| APK metadata | PASS — `com.funzi7.linkdrop`, versionCode 9, versionName `0.1.8-test1`, arm64-only |
| APK delivery | PASS — source/destination SHA-256 and `cmp` match |

Targeted tests cover Facebook concrete/query/share identities, equivalent-form dedup, strict redirect
platform fences, malicious/profile/photo rejection, Facebook SAF mapping, image-only rejection, component
and merge progress, fallback distinction, one row/WorkRequest, single-file behavior, Home warning
suppression, concise extraction errors, and retained Diagnostics detail. SQLite contract tests exercise the
100 -> 0 -> 100 update on one row/generation and the narrow completed-row source-gate cleanup.

## Mandatory live runtime smoke

The final rebuilt APK was supplied explicitly to the smoke gate. It ran from
`2026-08-23T17:37:02Z` through `17:38:58Z` using checksum-verified official stable yt-dlp `2026.08.19`
and ffmpeg/ffprobe `7.1.5`, with no credentials, cookies, login, proxy, remote service, or device. The JSON
report is `build/runtime-smoke/v0.1.8-test1-report-final.json`; temporary media was removed after validation.

| Platform / exact source | Extraction and transfer | ffprobe result | Bytes / SHA-256 |
| --- | --- | --- | --- |
| Facebook — `https://www.facebook.com/reel/1370361647863285` | AVAILABLE; `NORMAL_BEST`; source evidence expects audio | AV1 video + AAC audio; 2 streams; 26.604 s | 7,814,691 / `21e566d3fddd931a24298183849c804787b698b946e5dc9927702261a1480e71` |
| TikTok — `https://www.tiktok.com/@intjatarot/video/7649459254197292310` | AVAILABLE; `NORMAL_BEST`; source evidence expects audio | HEVC video + MP3 audio; 2 streams; 422.164898 s | 30,504,082 / `7c0d8886fda8179d05dcdaa33899faa19fb8c5c1b4761a50dd4bbed65e30a8bb` |
| X — `https://x.com/Fun_Viral_Vids/status/2089115673515507916` | AVAILABLE; `NORMAL_BEST`; source audio evidence unknown | H264 video + AAC audio; 2 streams; 3.784853 s | 458,853 / `a6e0a1658d26de9bca31953abcf274961e2a0ec461e450784090d9cc6c4a4295` |

The regression URL `https://www.tiktok.com/@israel_edits151/video/7665458835611520276` also passed in
this final run: AVAILABLE, `NORMAL_BEST`, source evidence expects audio, HEVC + MP3, 5,868,980 bytes,
SHA-256 `148bdbbf697524c578cc7de7440ec420d850c50da727ff0d744c11b9feeea5e1`.

No structural fallback happened in the live sources; deterministic tests verify that a fallback attempt is
labelled separately from component transfer. An earlier Facebook harness attempt rejected yt-dlp's valid
metadata URL because it contained Facebook's own `_rdr` query noise. The gate was corrected to normalize
extracted metadata through the same strict application identity policy; user input acceptance remains
strict. The passing run above generated and ffprobed a real Facebook media file.

## Remaining physical acceptance (small and Facebook-only)

There is currently no ADB transport. The prior S25 validator, X, and TikTok facts above are accepted and do
not need repetition unless a regression appears. Install the delivered TEST APK and run only:

- **F-A** — paste or share one public Facebook video/reel (the smoke URL above is current). Expect Facebook
  recognition -> validated download -> `Facebook/` SAF file -> `COMPLETED`.
- **F-B** — open the saved file. Expect working video and audio because this source has audio.
- **F-C** — submit the exact same Facebook source again. Expect dedup and no second physical file.

Facebook has not yet passed F-A/F-B/F-C on the phone, so v0.1.8-test1 remains a diagnostic TEST build and
must not be promoted or released until those checks pass.
