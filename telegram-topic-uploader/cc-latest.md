# Telegram Topic Uploader — latest handoff

## Task and repository state

| Field | Value |
| --- | --- |
| Task | D3B1.3 — prove Telegram video compatibility before `sendVideo`; send duration/dimensions/thumbnail; drop unconditional `supports_streaming`; add read-only batch outcome details |
| Application repository | `/root/work/telegram-topic-uploader` |
| Branch | `main` |
| Tracking branch | `origin/main` |
| Starting application HEAD | `c2d6ebf11f382c106da40978c042915f7ad9c2ed` (D3B1.2) |
| Version | code 12 -> 13, name `0.5.2-d3b1.2` -> `0.5.3-d3b1.3` |
| Room schema | **stays 7.** DAO queries added only; no entity, index, migration, or schema JSON changed |
| Deployment | None. Not installed or run on any device or emulator in this session |

No production token, Telegram identifier, bot username/ID, chat ID, thread ID, group title, forum
topic name, private link, binding command, file name, content URI, document ID, path, or media hash
was requested, used, or recorded anywhere, including this file.

## New user-reported device evidence (D3B1.2 on hardware; not observed by any agent)

- D3B1.2 was installed and run on the user's Android device.
- The existing frozen batch was retried.
- The application reported that the background upload started.
- Two media posts appeared in the intended Telegram forum topic.
- Both appeared as **blank white video cards showing duration 0:00**.
- The Telegram cards displayed **non-zero file sizes**.
- The batch notification reported that the run **completed with issues**.
- The user did **not** report whether downloading and opening either card played successfully.
- The exact durable job or batch-item outcomes were not reported.
- Source-file mutation was not explicitly checked in this report.
- No duplicate automatic resend was reported.

## Root cause (MIME-only sendVideo)

`UploadTransferPolicy` treated a `video/mp4` MIME type as sufficient evidence for `SEND_VIDEO`, and the
gateway then sent `supports_streaming=true` with **no** duration, width, height, or thumbnail. MP4 is
only a container: it proves nothing about the codec, a readable duration, valid dimensions, rotation, or
whether a cover can be produced. A mislabelled or modern-codec `.mp4` sent that way is exactly a blank
0:00 card even though Telegram accepted the bytes.

## What D3B1.3 implements

**Read-only compatibility probe.** New domain port `TelegramVideoCompatibilityProbe` and Android impl
`AndroidTelegramVideoCompatibilityProbe` (`data/upload/`) over `MediaExtractor` +
`MediaMetadataRetriever`. Inspects the current SAF document immediately before claim/dispatch, after the
existing size and modification-time checks in `MediaUploadCoordinator.mediaRefusal`. Opens the document
in mode `"r"` only; never opens an output stream, writes, copies, remuxes, transcodes, re-tags, retains
a full-resolution frame, caches, or persists. Returns only a bounded sanitized `TelegramVideoCompatibility`
(video-track present, normalized codec *category* — never the raw string, duration, w/h, rotation,
inline-safe flag, optional bounded JPEG thumbnail, sanitized reason). Every failure fails closed to
"send as document". Below API 27 it refuses to decode a frame larger than 3840×2160; from 27+ it uses
`getScaledFrameAtTime`.

**Conservative inline policy (pure `TelegramVideoCompatibilityPolicy`).** `SEND_VIDEO` only when: MPEG-4
container + real video track + H.264/AVC (`video/avc`) codec + positive representable duration + positive
bounded dimensions + understood rotation (0/90/180/270, dims transposed for a quarter turn) + producible
bounded JPEG thumbnail. Everything else (HEVC/AV1/VP9/VP8/MPEG-4-Part-2/unknown, no track, no
duration/dims, bad rotation, no thumbnail) ⇒ `SEND_DOCUMENT`, byte-for-byte, safe original name and
resolved MIME — a fallback, **never** a refusal. Duration rule: round to nearest second, never down to
zero (200 ms ⇒ 1 s).

**Policy/coordinator wiring.** `UploadTransferPolicy.selectMethod` replaced by `classifyContainer(...)
: ResolvedContainer?` (resolved MIME + `isMpeg4Candidate`). `MediaUploadCoordinator` gains the probe as
a constructor dependency, resolves the transfer via `resolveTransfer(...)` (probe only for an MP4
candidate — a non-candidate is never opened), and threads `VideoUploadMetadata` (duration/w/h/thumbnail)
into `MediaUploadRequest.video`.

**Gateway.** `TelegramMediaUploadApiGateway` sends `duration`/`width`/`height` and an attached in-memory
JPEG thumbnail (`attach://cover_thumb`, `image/jpeg`) for a `SEND_VIDEO`, and none for a `SEND_DOCUMENT`.
`supports_streaming` **removed entirely** (this build proves no fast-start suitability). A `SEND_VIDEO`
with no proved metadata is refused locally (`INVALID_LOCAL_INPUT`) before any byte. Response parsing now
reads `result.video` (positive duration + positive w/h) / `result.document` and requires the shape to
match the method, on top of the unchanged ok/positive-message-id/exact-chat/exact-thread checks; an
unexpected/unusable shape stays `RESULT_UNKNOWN` (`UNUSABLE_RESULT`) and is never auto-resent. The
whole-multipart completion tracking still wraps the complete body including the thumbnail part.

**Batch details.** `BatchOutcomeSummary`/`BatchOutcomeItem`/`BatchOutcomeDetails` (`domain/batch/`);
`UploadBatchDao.observeMostRecentSession()` + `observeItemDetails()` (joins media display name only);
`RoomBatchRepository.observeMostRecentDetails()`; `BatchUploadLauncher.recentBatchDetails` ->
`MainViewModel.batchDetails` -> a read-only `BatchDetailsCard` in `Screens.kt` showing exact sanitized
counts (confirmed, already confirmed, result unknown, deferred, failed, source missing, media
unavailable, skipped/not-queued, total) + optional per-item rows with the local display name only. Card
text explains that "Completed with issues" means at least one item was not durably confirmed, **not**
that Telegram received nothing, and offers no resend. Finalization rule unchanged: COMPLETED only when
every item is durably CONFIRMED.

**Existing two posts.** Never automatically resent, replaced, deleted, or edited; reservations not
released; RESULT_UNKNOWN not promoted to CONFIRMED from a screenshot; no `deleteMessage` added.

## Files touched

New: `domain/upload/VideoCompatibility.kt`, `data/upload/AndroidTelegramVideoCompatibilityProbe.kt`,
`domain/batch/BatchOutcomeSummary.kt`; tests `TelegramVideoCompatibilityPolicyTest`,
`BatchOutcomeSummaryTest`, `security/D3B13SurfaceTest`. Modified: `UploadTransferPolicy`,
`MediaUploadPorts` (+`VideoUploadMetadata`), `MediaUploadCoordinator`, `TelegramMediaUploadApiGateway`,
`BatchRepository`/`RoomBatchRepository`, `BatchUploadPorts`/`BatchUploadCoordinator`, `Daos` (+
`BatchItemDetailRow`), `di/AppModule` (probe binding), `ui/MainViewModel`, `ui/Screens`,
`ui/TelegramTopicUploaderApp`, `res/values{,-iw}/strings.xml`, `app/build.gradle.kts`. Tests updated:
`UploadTransferPolicyTest`, `MediaUploadCoordinatorTest` (+ FakeCompatibilityProbe),
`TelegramMediaUploadGatewayTest`, `MainViewModelTest`, `BatchTestFakes`, `BatchUploadCoordinatorTest`,
`D2AScanSurfaceTest` (scoped to scan sources), `D3B1SurfaceTest` (launcher member set +
`getRecentBatchDetails`). Docs: README, TODO, ARCHITECTURE, PROJECT_STATE, RELEASE_REVIEW, SECURITY,
D3B1_DEVICE_CHECKLIST.

## Tests and exact results

| Check | Result |
| --- | --- |
| `--offline testDebugUnitTest` | **676 tests / 56 classes, 0 failures, 0 errors, 0 skipped** (D3B1.2: 641/53) |
| `--offline lint` | **0 issues** (empty `<issues>`) |
| `--offline assembleDebug` / `assembleDebugAndroidTest` | passed |
| Instrumentation | compiles, **not run** (no device); androidTest APK byte-identical |
| Room schema | stays **7**; no schema JSON changed |
| `git diff --check` | clean |

Key new tests: policy fail-closed rules (H.264 safe; HEVC/AV1/VP9/VP8/MPEG4P2/unknown ⇒ document; no
track; zero/missing duration; zero/missing/oversized dims; 90/270 swaps dims; 180 keeps; bad rotation
fails closed; null rotation upright; no/oversized thumbnail fails closed; duration rounding incl. never
0); gateway request fields (video has duration/w/h + attached JPEG thumbnail; document has none; no
`supports_streaming`; metadata-free SEND_VIDEO refused locally); response evidence (valid video shape
confirms; zero duration / missing dims ⇒ RESULT_UNKNOWN; SEND_DOCUMENT requires document shape;
SEND_VIDEO with only a document ⇒ RESULT_UNKNOWN); coordinator (proved candidate ⇒ SEND_VIDEO with
metadata; non-candidate never probed; unvouched candidate ⇒ document, still Confirmed); batch summary
exact counts sum to total; D3B13 surface (probe read-only, no supports_streaming field, thumbnail
limits, no new background mechanism/permission/receiver/deleteMessage, EN/HE parity).

## APK identity (debug development signing only)

- Main APK `app/build/outputs/apk/debug/app-debug.apk`: **14,353,410 bytes**, SHA-256
  `e9bce7c08219f7fc5963fc361044dd4f03dcb3a690c80946d1e08174a86c120c`.
- Instrumentation APK: 1,566,099 bytes, SHA-256
  `495cab881dd67457c488f0c46c4adef970af31724e538bad514c99d3f27c28e5` (unchanged).
- Package `com.funzi7.telegramtopicuploader`; versionCode 13; versionName `0.5.3-d3b1.3`; minSdk 23;
  compile/target SDK 37; cleartext false; backup false.
- AAPT2 permissions: INTERNET, ACCESS_NETWORK_STATE, RUN_USER_INITIATED_JOBS, POST_NOTIFICATIONS (+
  AndroidX `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`). One non-exported `platform.BatchUploadJobService`
  with `BIND_JOB_SERVICE`; no receiver.
- Debug cert SHA-256 `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4` — matches the
  expected value and every earlier build, so it updates over D3B1.2 in place.

## Untested device boundary

The D3B1.3 APK has **never** been installed, updated over D3B1.2, launched, or run. **Whether Telegram
now shows a real duration and thumbnail for a compatible video, and a normal document rather than a
blank 0:00 card for an incompatible one, is unproven** — that is exactly what the device run exists to
determine. No real SAF provider, video, or hash; no Telegram traffic; no media mutation — every test
byte was a synthetic in-memory array. The two existing posts are never automatically resent.

## Next device action (ask for exactly this, nothing more)

1. Install `0.5.3-d3b1.3` over D3B1.2 **without uninstalling**.
2. Do **not** retry the two existing posts.
3. Add **one** fresh, non-personal video from the same download source.
4. Scan and upload it through **Upload queue**.
5. If compatible, confirm Telegram shows a **real duration and thumbnail**.
6. If not compatible, confirm it appears as a **normal document**, not a blank 0:00 video.
7. Open **batch details** and confirm the exact sanitized outcome.
8. Confirm the **source file is unchanged**.

Do not ask the user to retest bot setup, binding, source-missing reconciliation, permissions, or the two
existing posts.

**After D3B1.3 device validation, multi-topic binding in one session remains the next product feature.**

## Env notes (still current)

- `GRADLE_USER_HOME=/root/.gradle ./gradlew --offline …`; `aapt2` at
  `/opt/android-sdk/aapt2-wrapper/aapt2`; `apksigner` in `/opt/android-sdk/build-tools/37.0.0`.
- **`dexdump` crashes (Illegal instruction) in this sandbox** — use `strings` over extracted
  `classes*.dex` for DEX marker checks.
- `Bitmap.createScaledBitmap` trips lint `UseKtx`; use `androidx.core.graphics.scale` instead to keep
  lint at 0 issues.
- `flatMapLatest` needs `@OptIn(ExperimentalCoroutinesApi::class)` in coroutines 1.11.
- Unit tests cannot instantiate the Android probe (no Robolectric/mockito); its read-only posture is
  proved via the pure `TelegramVideoCompatibilityPolicy` plus a source-shape guard in `D3B13SurfaceTest`.

## Remaining D3B work (not started)

- **D3B2 immediate cancellation** of the in-flight multipart request (replaces stop-after-current).
- Result-unknown reconciliation that never re-sends without evidence.
- Evidence-based resolution of an unowned/ambiguous legacy reservation (D3A.1 blocker).
- Safe-deletion stage gated on a confirmed positive Telegram message ID.
- A truly background notification stop action.
- Optional future conversion stage (unsupported media → H.264/AAC) — explicitly **not** part of D3B1.3;
  this task does not transcode.

## Deployment declaration

Nothing was deployed, distributed, installed, or run on a device or emulator in the D3B1.3 session. No
real Telegram request of any kind was made, no forum topic was created/renamed/closed/deleted, and no
media was uploaded, moved, renamed, copied, downloaded, quarantined, or deleted — every byte in every
test came from a synthetic in-memory array. The two existing Telegram posts are never automatically
resent.
