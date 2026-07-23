# Telegram Topic Uploader — latest handoff

## Task and repository state

| Field | Value |
| --- | --- |
| Task | D3A — explicit, real, single-item Telegram media upload from the persistent queue |
| Application repository | `/root/work/telegram-topic-uploader` |
| Branch | `main` |
| Tracking branch | `origin/main` |
| Starting application HEAD | `8f38d7f91d52149a7002d08b6f7e00ce472bc413` (D2B2B) |
| Version | code 7 -> 8, name `0.3.3-d2b2b` -> `0.4.0-d3a` |
| Room schema | **5, unchanged.** No column, no index, no migration, no schema 6 |
| Application commit | `feat: D3A explicit single-item Telegram media upload` |
| Deployment | None |

No production token, Telegram identifier, bot username/ID, chat ID, thread ID, group title, forum
topic name, private link, binding command, file name, content URI, document ID, path, or hash of real
user media was requested, used, or recorded anywhere, including this file.

## The problem this task exists to solve — read this first

D3A is the first code in this application that can move a user's bytes off the device. The entire
task reduces to one question: **can this ever put the same video in the topic twice?**

The answer rests on a distinction the transport must be able to make, and it is the thing to protect
in every future change:

- **body provably did not finish** -> Telegram cannot have accepted anything -> retry is safe;
- **complete body handed to the network, no trustworthy answer** -> the video may already be there ->
  `RESULT_UNKNOWN`, reservation kept, never re-sent automatically, no retry action offered.

Instrumenting only the file part would blur these, because the trailing multipart boundary is still
unsent after the last file byte. `CompletionTrackingRequestBody` therefore wraps the **whole**
multipart body and flips only after `sink.flush()`. If you change the transport, keep that.

## What D3A implements

**`TelegramMediaUploadApiGateway`** (transport/telegram, own file) — the only class that can move
bytes. Same D1 posture: fixed host, no logger, no cache, `followRedirects(false)` (the path carries
the token), `retryOnConnectionFailure(false)` (one-shot body; an automatic re-send is the duplicate),
`.cache(null)`, bounded response read. Timeouts 15 s connect / 60 s write / 60 s read / 15 min call.

**It is deliberately separate from `TelegramBotApiGateway`.** `D1SecuritySurfaceTest` used to grep
the entire transport package for `sendVideo`/`sendDocument`/`MultipartBody`. That test was **split**,
not deleted: a hygiene half still covers the whole package (no logger, no cache, fixed host) and a
capability half now names the two setup files only. Do not fold media into the setup gateway.

**Streaming** — `StreamingDocumentBody`: one 64 KiB buffer per upload, reused; `contentLength()` =
verified hashed size; aborts if the stream exceeds it mid-write or falls short at the end
(`MediaBodyFailure.SIZE_MISMATCH`); progress per chunk; cancellation checked between chunks via the
`AtomicReference<Call>` handle; `stream.use`; `isOneShot() = true`.

**`RoomUploadDispatchRepository`** (own file, read-only) — `loadDispatchPlan` is one transaction
covering eligibility, reservation ownership, destination readiness for the *currently validated* bot,
canonical hash, and size vs `TelegramUploadLimits.MAX_UPLOAD_BYTES`. `verifyDispatchPreconditions`
re-proves generation + destination immediately before dispatch. It lives in its own file for the same
reason the execution repository does: the per-file "cannot transfer media" greps on scanning,
correction, and execution would have been hollowed out by putting media evidence in any of them.

**`claimEligibleJob`** (new on `QueueExecutionRepository`) — targeted claim, reusing the **same**
`claimForExecution` guarded statement as `claimNextEligible`, so the two cannot drift. Only failure
behaviour differs: a typed refusal (`ALREADY_CLAIMED`, `NOT_DUE`, `ATTEMPTS_EXHAUSTED`,
`DISPATCH_ALREADY_STARTED`, …) instead of falling through to another candidate. **A per-row tap must
never claim a different row** — that is the invariant, and there are JVM and instrumentation tests
for it.

**`MediaUploadCoordinator`** (domain/upload) — `AtomicBoolean` compare-and-set = one upload
application-wide, second call returns `Busy`. Sequence: `reconcileExpiredClaims` (recovery where
execution starts, never at launch) -> plan -> provider metadata re-read + stream probe -> method
selection -> `claimEligibleJob` -> `withValidatedToken` -> `verifyDispatchPreconditions` -> fresh
attempt ID -> `markDispatchStarted` (once) -> transfer -> exactly one durable outcome -> progress
cleared in `finally`. **It never advances to the next item.** Cancellation after dispatch started ->
`RESULT_UNKNOWN` under `NonCancellable`.

**Lease renewal.** A heartbeat renews the claim only when progress advanced since the last check.
This is the D2B2B footgun the previous handoff warned about: 50 MB on a slow link outlives the
10-minute lease. Renewing on *movement* rather than on the clock means a stalled transfer correctly
loses its claim.

**Method selection** — `UploadTransferPolicy` asks `VideoTypeAllowlist`; only `video/mp4` is
confidently MPEG-4 -> `sendVideo` + `supports_streaming=true`. Everything else -> `sendDocument`.
`.m4v` is a *relative*, not a certainty, so it is a document. File names are sanitized against quotes,
backslashes, separators, and every line-break form.

**Response verification** — confirmed requires `ok=true`, positive `message_id`, `chat.id` == request,
and `message_thread_id` == request. **A null thread is not accepted**, unlike the D1 `sendMessage`
rule, because which topic a video landed in is the entire point. Anything weaker -> `ResultUnknown`.

**Failure classification** — `UploadFailureClassifier`, one table. Retryable: rate limit, 5xx,
timeout, network, internal, unreadable stream, revoked grant, incomplete body. Permanent: invalid
token, forbidden, bot removed, send forbidden, rejected topic/destination, `PAYLOAD_TOO_LARGE` (new
code, HTTP 413), unparsable non-2xx, size mismatch. Only the transport can produce "unknown".

**`RetryPolicy.nextAttemptAt(attemptCount, now, serverMinimumDelayMillis)`** —
`max(local, clamp(server, 0, 1 h))`. Later only, never earlier, never an extra attempt.
`recordRetryableFailure` takes it as a **required** parameter: a defaulted interface parameter would
add a `$default` synthetic to the port surface `D2B2BSurfaceTest` asserts by name.

**Invalid token** -> `TelegramSetupService.recordRejectedToken`, guarded on the same generation, does
not touch the encrypted secret.

**UI** — one per-row `Upload now` (`UploadEligibilityPolicy` is the display gate), disabled globally
while any upload runs; corrections withheld during an upload; determinate progress only once the
verified total is known; LTR-wrapped byte counts; no success shown before the durable outcome;
`RESULT_UNKNOWN` Review rows get their own explanation and no action. 269 strings per locale (+14,
`queue_preparation_only_note` renamed to `queue_manual_upload_note`).

**Design decision: no schema 6.** The only new state is byte progress, and a persisted byte counter
would eventually be read as evidence of what Telegram received — which only a returned positive
message ID is.

**Design decision: no user cancellation.** Only safe if it maps onto the request-body-complete
distinction. Deferred to D3B explicitly.

**Design decision: no background execution.** A foreground coroutine started by a tap needs none, and
WorkManager's `WAKE_LOCK` / `RECEIVE_BOOT_COMPLETED` / foreground-service surface would be paid for
nothing. That cost belongs with batch/resumable uploads.

## Surface tests that had to change (and why that was correct)

Four pre-existing guards asserted the absence of exactly what D3A adds. All were **rewritten to
protect the property that still holds**, never deleted:

- `D2B1SurfaceTest`, `D2B2ASurfaceTest`, `D2B2BSurfaceTest`: "the Queue screen renders no dispatch
  control" -> now assert exactly one per-row `Upload now` taking a single job ID, and no batch,
  retry, resume, or automatic dispatch control or callback (`upload_all`, `send_all`, `onUploadAll`,
  `onRetryUpload`, …).
- `D1SecuritySurfaceTest`: transport guard split into hygiene (whole package) and capability (the two
  setup files).
- `D2B2BSurfaceTest` execution-port method set gained `claimEligibleJob`.
- `TelegramSetupUiPolicyTest` and `TelegramSetupUiPolicy` gained the `PAYLOAD_TOO_LARGE` branch —
  adding a `TelegramFailureCode` constant breaks two exhaustive `when`s. That is the intended
  tripwire.
- `FakeTelegramSetupDao.setConnectionFailure` was a no-op stub returning 0; it now applies the real
  guard (saved secret + exact generation). That is a strengthening, and one D3A test depends on it.

## Tests and exact results

The **complete** JVM suite was run, not a focused subset.

| Class | Tests | Result |
| --- | --- | --- |
| `MediaUploadCoordinatorTest` (new) | 24 | 0 failures |
| `TelegramMediaUploadGatewayTest` (new) | 19 | 0 failures |
| `D3ASurfaceTest` (new) | 13 | 0 failures |
| `UploadTransferPolicyTest` (new) | 8 | 0 failures |
| `QueueExecutionTest` (39 -> 46) | 46 | 0 failures |
| `MainViewModelTest` (14 -> 18) | 18 | 0 failures |
| `RetryPolicyTest` (6 -> 8) | 8 | 0 failures |
| **Full suite** | **514 across 45 classes** | **0 failures / errors / skipped** |

`MediaUploadCoordinatorTest` drives the **real** `RoomQueueExecutionRepository`,
`RoomUploadDispatchRepository`, `RoomCatalogRepository`, and `TelegramSetupService` against the
shared `FakeScanDaos`, faking only the transport — so its assertions are durable rows, not mock
agreement. Reuse that harness for D3B.

| Command/check | Result |
| --- | --- |
| `./gradlew --offline testDebugUnitTest` | 514 executed, 0 failures |
| `./gradlew --offline lint` | Passed; lint XML has 0 issues |
| `./gradlew --offline assembleDebug` / `assembleDebugAndroidTest` | Passed |
| Instrumentation | 77 across 9 classes compiled (was 71/8); **none executed — no device** |
| Room schema | 5 unchanged; 1–5 byte-for-byte as committed by D2B2B |
| `git diff --check` | Passed |
| AAPT2 badging | versionCode 8, `0.4.0-d3a`, minSdk 23, targetSdk 37; INTERNET + AndroidX injected only; cleartext false; backup false |
| `apksigner verify` | v1+v2, one signer, cert `74e78654…` (same as D0–D2B2B) |
| DEX | `sendVideo` + `sendDocument` once each **by design**; zero `sendMediaGroup`/`sendAnimation`/`sendPhoto`/`copyMessage`/`openOutputStream`/`MANAGE_EXTERNAL_STORAGE`/`READ_MEDIA_VIDEO`/`READ_EXTERNAL_STORAGE`/`editForumTopic`/`setChatTitle`/`androidx.work`/`WorkManager`; `deleteDocument`/`renameDocument`/`moveDocument`/`createDocument` 1 each as always |
| Localization | EN/HE exact parity, 269 each |

## Environment notes (still current, plus new ones)

- `HOME=/home/devagent`. Debug keystore holds `74e78654…` in both `/home/devagent/.android/` and
  `/root/.android/`. Keep verifying each session.
- Gradle cache is `/root/.gradle`: always `GRADLE_USER_HOME=/root/.gradle ./gradlew --offline …`.
- `aapt2` via `/opt/android-sdk/aapt2-wrapper/aapt2`; `apksigner` in
  `/opt/android-sdk/build-tools/37.0.0`.
- `./gradlew test --tests …` fails; use `testDebugUnitTest --tests '*Foo'`.
- `strings -a` before grepping a `.dex`.
- **Never run bare `find /`** — the proot container self-mounts recursively.
- **No earlier debug APK is preserved anywhere.** D3A's DEX check is therefore absolute, not
  differential. If you want a differential check, preserve the APK *before* rebuilding.
- **Do not type raw U+0085/U+2028/U+2029 into a source file** — they mangle. Write `\\u0085` etc. Two
  files needed fixing this session because of it.
- `runTest` + `advanceUntilIdle()` **hangs** against the lease heartbeat, because its `delay` loop
  always schedules another task. Synchronize with a `CompletableDeferred` the fake gateway completes
  instead.
- Kotlin does not allow `{ copy(...) }` as an `Entity.() -> Entity` literal in a `mapOf`; use
  `listOf<Pair<(Entity) -> Entity, X>>` with explicit `{ job: Entity -> job.copy(...) }`.
- Lint's `PluralsCandidate` fires on `%d` followed by a word. Put the unit before the number.
- Kotlin KDoc block comments nest, so a literal `video/` + `*` inside a doc comment breaks
  compilation.
- **Do not add `rememberSaveable` to `TelegramSetupScreens.kt`** — `D1SecuritySurfaceTest` asserts its
  absence.

## Artifacts (debug development signing only)

- Main APK: `app/build/outputs/apk/debug/app-debug.apk`, 14,168,952 bytes,
  SHA-256 `b77865046fa66c498d73876a529464586af01a090f40e2f96b427b42b668d80a`.
- Instrumentation APK: `app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk`,
  1,540,221 bytes, SHA-256 `78b087ef6bf883b428ce9cd6643044cb4bfdcfb5af1bc7d962221dc7e3783a1e`.
- Package `com.funzi7.telegramtopicuploader`; versionCode 8; versionName `0.4.0-d3a`; minSdk 23;
  compile/target SDK 37; debug certificate SHA-256
  `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4`.

## Evidence classification

USER-REPORTED D2B2B device evidence only — not observed or performed by any agent:

- D2B2B was installed over D2B2A;
- the D2B2B application launched successfully;
- **no** D2B2B execution, claim, retry, or recovery operation was manually tested;
- **no** D2B2A queue-correction operation was manually tested;
- **no media upload, movement, rename, or deletion was reported.**

Nothing else is claimed. Earlier D2B2A/D2B1/D2A/D1/D1.1 user-reported evidence is preserved in
`docs/PROJECT_STATE.md`.

AGENT-OBSERVED in D3A: repository/Git/source/schema inspection; the complete JVM suite; lint; Kotlin
and instrumentation compilation; both APK assemblies; AAPT2 manifest/signature/permission/DEX
inspection; localization parity.

UNTESTED: the D3A APK has **never** been installed, updated over D2B2B, launched, or run. **No upload
has ever been performed by this application against Telegram, by anyone.** Upload now, progress,
confirmation, and every failure path are physically unverified. The Room 4 -> 5 migration has still
never run on a device. All three D2B2A corrections remain untested on a device. No real SAF provider,
document tree, video file, or hash of real media. No Telegram traffic. No media
upload/copy/download/quarantine/move/rename/deletion. No forum topic created, renamed, closed, or
deleted. No share target, external automation, AI, release signing, distribution, or deployment.

## Remaining device work (not executed)

`docs/D3A_DEVICE_CHECKLIST.md` — one fresh, small, non-personal MP4; scan it; tap Upload now on that
exact row; confirm visible progress; confirm exactly one video in the correct topic; confirm the app
says *Telegram confirmed* only afterwards; confirm the source file is present and unchanged; confirm
nothing continues on its own.

Also still outstanding, from earlier versions: the whole of `D2B2B_DEVICE_CHECKLIST.md` (including
the Room 4 -> 5 migration gate), the whole of `D2B2A_DEVICE_CHECKLIST.md`, the untested parts of
`D2B1_DEVICE_CHECKLIST.md` and `D2A_DEVICE_CHECKLIST.md`, the D1.1 binding regression, and executing
the Keystore and persistence instrumentation on a device.

## Risks

- **The first real upload has never happened.** Everything is proved against MockWebServer and
  synthetic arrays.
- Timeouts (15 s / 60 s / 60 s / 15 min) are a judgement call without production data. A very slow
  link could trip the call timeout, which records `RESULT_UNKNOWN` — safe but annoying.
- The heartbeat renews only while bytes move, so a long stall can be reconciled to `RESULT_UNKNOWN`
  while the coroutine is still alive; the outcome write then fails closed rather than overwriting it.
- A `RESULT_UNKNOWN` job keeps its reservation forever and D3A adds **no** reconciliation path. The
  same content cannot be re-reserved for that topic until D3B or the user acts.
- Method selection trusts provider MIME first; a container mislabelled `video/mp4` would be sent as a
  video part and may be rejected — permanently, not silently.
- `supports_streaming=true` is sent without inspecting `moov` placement, so a non-faststart MP4 may
  not stream well. It still plays.
- No user cancellation: a long upload can only be stopped by leaving the app, recorded as
  `RESULT_UNKNOWN`.
- The artifact is debug-signed and is not a production release.
- All pre-existing D1/D1.1/D2A/D2B1/D2B2A/D2B2B risks still apply, including that the Room 4 -> 5
  migration has never run on a device.

## Remaining D3B work (not started)

Android background execution and its permission cost, chosen against real durations rather than
guessed. Batch or continued queue execution on top of the D3A single-item path, keeping every
per-item invariant. User cancellation mapped explicitly onto the request-body-complete distinction. A
reconciliation path for `RESULT_UNKNOWN` items that never re-sends without evidence. The
provider-aware keep/delete/quarantine deletion stage with process-death recovery, gated on a
confirmed positive Telegram message ID. Revoked-grant, partial-mutation, overflow, and deletion-gate
tests.

## Deployment declaration

Nothing was deployed, distributed, installed, or run on a device or emulator in the D3A session. **No
real Telegram request of any kind was made** and no Telegram forum topic was created, renamed,
closed, or deleted. **No media was uploaded, moved, renamed, copied, downloaded, quarantined, or
deleted.** Every network test ran against a local MockWebServer; every streamed byte came from a
synthetic in-memory array.
