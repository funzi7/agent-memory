# Telegram Topic Uploader — latest handoff

## Task and repository state

| Field | Value |
| --- | --- |
| Task | D2B1 — real destination naming and rename UX, plus manual Review resolution into the persistent queue |
| Application repository | `/root/work/telegram-topic-uploader` |
| Branch | `main` |
| Tracking branch | `origin/main` |
| Starting application HEAD | `37346839c3fb402c5c0a52b998617a8bccb07d50` (D2A) |
| Final application HEAD | `274a2d9f28628a38edef88a3ac4997673554a3c7` |
| Application commit | `feat: D2B1 explicit destination naming and manual Review resolution` (38 files, 5,145 insertions, 261 deletions) |
| Push | Successful (`3734683..274a2d9`); `main` verified clean at 0 ahead / 0 behind |
| Version | code 4 -> 5, name `0.3.0-d2a` -> `0.3.1-d2b1` |
| Room schema | **Unchanged at version 3**; no migration added |
| Deployment | None |

No production token, Telegram identifier, bot username/ID, chat ID, thread ID, group title, forum
topic name, private link, binding command, file name, content URI, document ID, path, or hash of real
user media was requested, used, or recorded anywhere, including this file.

## The product fact this whole task rests on

The Telegram Bot API binding message gives the app the chat and the `message_thread_id`. **It does not
give the app the existing forum topic's name.** So D2B1 does not pretend the app fetched or
synchronized a topic name, and it adds no TDLib, MTProto, user-account login, Telegram session
storage, or new Telegram privilege to get one. The local display name is typed by the user and
editable by the user. That is the whole design constraint — if a future task proposes "just read the
topic name", this is why it cannot without a different Telegram surface entirely.

## What D2B1 implements

**Naming authority.** `domain/destination/DestinationNaming.kt` — `DestinationNameValidator` trims,
then refuses blank, line breaks (LF/CR/NEL/LS/PS), ISO controls, bidi embedding/override/isolate
controls, and > 128 Unicode **code points** (`codePointCount`, so an emoji costs one). The same
validator backs the Compose form state, creation, renaming, and binding confirmation, so the dialog's
inline error and the repository's refusal can never disagree. Written with `Char.code` comparisons and
named constants — **no literal control characters in source** (an early draft embedded real U+2028 etc.
via the Write tool; check with `LC_ALL=C grep '[^ -~]'` if you touch it).

**Creation.** `CatalogRepository.addPlaceholderTopic` is gone; `createTopicDestination(displayName)`
returns a typed rejection instead of substituting a name. The Topics dialog prefills nothing but a
neutral hint. `placeholder_topic_name`, `placeholder_topic_note`, and `add_placeholder_topic` were
deleted from **both** locales, and the dead `TopicsScreen` composable in `Screens.kt` (unused — the app
routes to `TelegramTopicsScreen`) was removed with them.

**Renaming.** `TopicDestinationDao.rename` is one guarded UPDATE whose SET clause is `displayName` and
`updatedAt` only, so chat/thread/bot IDs, binding state, `boundAt`, `lastConnectionTestAt`, and
`createdAt` survive **by construction** rather than by care. Works for bound and enabled destinations.
No network call; the Telegram topic keeps its own name.

**Rename at binding confirmation.** `ConfirmTopicBindingRequest` gained an optional `displayName`
(defaulted null, so every existing construction site still compiles). Validated *before* the
transaction — an unusable name returns `TopicBindingMutationResult.InvalidDisplayName` and binds
nothing — then applied by `rename` inside the same transaction as `bind`. UI prefills the
destination's **current local** name and is labelled as local. `BindingIssue.INVALID_DISPLAY_NAME` is
the new UI state.

**Duplicates allowed on purpose.** Forum topics repeat names. `DestinationOption` renders name +
binding state + (when bound) thread ID in every selector. Chat IDs are never rendered.

**Manual resolution.** `ReviewResolutionRepository` (`observeReviewItems`, `resolveManualRoute`) is
implemented by the **same** `RoomScanRepository` the scan pipeline uses, so it inherits the identical
reservation/duplicate/race semantics instead of a parallel copy. `ReviewActionPolicy` decides, as pure
testable code, the single action a row may offer: assign, rescan, reauthorize, or none.

**The resolution transaction**, in order, all inside one `TransactionRunner.inTransaction`:
1. refuse any job with `telegramMessageId` or `telegramConfirmedAt`;
2. return `AlreadyQueued` if the job is already `QUEUED` for that destination with `MANUAL` routing —
   this is what makes repeated and concurrent taps idempotent;
3. refuse anything that left `AWAITING_ROUTING` or already holds a destination;
4. refuse any reason not in `ROUTE_RELATED_REASONS`;
5. require a complete lowercase 64-char SHA-256;
6. re-derive `DestinationReadiness` from the destination row + currently validated bot;
7. reserve `(sha256, destinationId)`, resolving a unique-index rejection by re-reading the winner;
8. `assignManualRoute`, whose WHERE still requires `AWAITING_ROUTING` + null destination + no Telegram
   evidence; zero rows updated throws and abandons the whole transaction.

The job is **converted**, never deleted and reinserted — that is what makes step 2 possible.

**Duplicate content.** A reservation held by *different* content yields `AlreadyQueued`: no second
job, media row `DUPLICATE`, Review row retained with the new sanitized reason
`ReviewReasonCode.DUPLICATE_ALREADY_QUEUED`. That reason is itself route-related, which is precisely
how "the same hash may still be manually routed to a different destination" is satisfied.

**Preparation failures.** `FILE_CHANGED`, `FILE_EMPTY`, `HASH_FAILED`, `METADATA_UNAVAILABLE`,
`PERMISSION_REVOKED` never offer Queue — **even when a hash from an earlier scan is still stored**,
because D2A deliberately leaves an old hash untouched when it writes a review job, so a `FILE_CHANGED`
row genuinely can carry a canonical hash. The reason itself records that the bytes may no longer be
the hashed bytes. Actions are rescan / reauthorize / explanation only. The repository enforces this
independently of the UI.

**Queue.** Preparation-only, plus one read-only details expander. Return-to-Review, cancel, and
reassign are **explicitly deferred to D2B2**: each needs a released reservation *and* a new
`QUEUED -> AWAITING_ROUTING` edge in `UploadStatusTransitionValidator`. That is a reservation-lifecycle
design change, not a button, and the task said to defer rather than ship a partial unsafe version.

## Refactors worth knowing

- `RoomCatalogRepository` now takes `TransactionRunner` + `TelegramSetupDao` instead of `AppDatabase`
  (mirrors what D2A did to `RoomScanRepository`). That is what makes naming and atomic bind+rename
  JVM-testable. `D1PersistenceTest` was updated to pass `RoomTransactionRunner(database)`.
- `ScanCoordinator` now implements a new `ScanLauncher` interface; `MainViewModel` depends on the port
  so it can be tested with fakes. DI provides `ScanLauncher` from the `ScanCoordinator` singleton.
- `bindingVerificationLabel` moved from private in `TelegramSetupScreens.kt` to internal in
  `TelegramSetupUiPolicy.kt` so selectors and cards share it.
- `CatalogRepository.observeReview()` / `UploadJobDao.observeReview()` were **removed** in favour of
  the richer `observeReviewItems()`.
- `String?.isCanonicalSha256()` is now one internal helper in `EntityMappings.kt`; the private copy in
  `RoomScanRepository` was deleted.

## GOTCHA that cost a build

`D1SecuritySurfaceTest` asserts `TelegramSetupScreens.kt` contains **no `rememberSaveable`** — that is
a real token-hygiene guard (the token field must never enter saved state). The first version of the
confirmation name field used `rememberSaveable` in that file and broke it. Fix: `ConfirmationNameField`
lives in `ui/DestinationNameForm.kt` instead. **Do not add `rememberSaveable` to
`TelegramSetupScreens.kt`.**

## Schema decision

**No schema change, so none was made.** Version 3 retained; schemas 1, 2, 3 byte-for-byte unchanged;
no `MIGRATION_3_4`; destructive fallback still absent. `DUPLICATE_ALREADY_QUEUED` goes into the
existing nullable `upload_jobs.reviewReason` TEXT column. `rename`, `assignManualRoute`, and
`observeReviewItems` touch only existing columns and indices. No field was added for transient Compose
state. (`copyRoomSchemas` reported NO-SOURCE and `git status` showed no schema file change — that is
the check.)

## Tests and exact results

**JVM: 332 tests across 35 classes, 0 failures, 0 errors, 0 skipped** (D2A had 255 across 28; +77).
All 255 pre-existing tests remain green with unchanged per-class counts.

| New class | Tests | Covers |
| --- | --- | --- |
| `DestinationNameValidatorTest` | 11 | trimming, inner spacing preserved, blank/whitespace, all five line-break forms, ISO + bidi controls, the 128 code-point boundary from both sides, astral-plane = one code point, Hebrew and mixed Hebrew-English, emoji/Unicode, `normalize` |
| `DestinationNameFormTest` | 6 | untouched empty form neither submits nor errors, whitespace-only does error, valid submits trimmed, each invalid reason blocks, Hebrew + English submit, every rejection has a distinct message |
| `ReviewActionPolicyTest` | 9 | every route-related reason assignable with a hash, no hash -> rescan, prep failures never offer Queue with a stored hash, revoked -> reauthorize, empty file -> none, missing/disabled directory -> none, Telegram evidence / destination / other status untouchable, null reason -> none, and the two reason sets are disjoint and cover every code |
| `RoomCatalogRepositoryTest` | 14 | explicit name required and trimmed, creation never generates text, each rejection reported, Hebrew/English + duplicates, rename preserves ID + every binding value + `createdAt`, rename leaves mappings/reservations/jobs, bound+enabled renameable, invalid rename changes nothing, missing destination reported, observation resolves by ID, atomic rename+bind, omitted name kept, invalid name binds nothing, rejected binding leaves name alone |
| `ManualReviewResolutionTest` | 19 | happy path (one job + one reservation, MANUAL, no Telegram evidence), every route reason, destination disabled after render, unbound/retest/other-bot/result-unknown, unvalidated token, missing/blank destination, no hash + 5 non-canonical forms, repeat idempotent, 6 concurrent taps, identical content not queued twice but retained as audit, same content to a different destination, existing job reported, failed transaction leaves no orphan (via `assignManualRouteHook`), prep failures with a stale hash, Telegram evidence never rewritten, job that left Review not re-routable, missing job, released reservation reused |
| `MainViewModelTest` | 10 | typed name passed through, each invalid name -> its own notice, rename updates topics + directory rows by ID, only send-ready destinations offered, review rows carry the policy action, one request forwarded, already-queued is a plain result, each refusal -> its own notice, rescan uses the scan port, construction reconciles without scanning |
| `D2B1SurfaceTest` | 8 | resolution port's exact method set, no Telegram symbol in naming/review sources, no forum-topic-edit or chat-title method anywhere, no transfer/stream symbol in the repositories, no media mutation symbol, Queue renders no dispatch handler, exactly one manifest permission, no generated destination-name string in either locale |

**Instrumentation: 40 compiled across 6 classes (was 28 across 5), none executed — no attached
device.** New: `D2B1PersistenceTest` (12) repeating naming, rename preservation (binding + mapping +
job + reservation), atomic rename+bind, invalid name at confirmation, manual resolution, six-way
concurrent resolution, duplicate/different-destination, not-ready and missing-hash refusals, prep
failures, the Telegram-evidence guard, and the review projection — against real Room.

| Command/check | Result |
| --- | --- |
| `GRADLE_USER_HOME=/root/.gradle ./gradlew --offline test` | Passed: 332 tests, 35 classes, 0 failures/errors/skipped. |
| Focused D2B1 suites | Passed: 77 tests across 7 classes, 0 failures. |
| `./gradlew --offline lint` | Passed; lint XML contains 0 issues. |
| `./gradlew --offline assembleDebug` | Passed. |
| `./gradlew --offline assembleDebugAndroidTest` | Passed; 40 instrumentation tests compiled, none executed. |
| Room schema | No change; version 3, all three exported schemas byte-for-byte unchanged. |
| `git diff --check` | Passed (working tree and staged). |
| `adb devices -l` | Ran successfully; **zero attached devices**. |
| APK ZIP integrity | Both APKs passed `unzip -t`. |
| AAPT2 badging | `com.funzi7.telegramtopicuploader`, versionCode 5, versionName `0.3.1-d2b1`, minSdk 23, targetSdk 37; permissions INTERNET + AndroidX injected app-scoped only; `usesCleartextTraffic=false`; `allowBackup=false`; `fullBackupContent=false`. |
| `apksigner verify` | Verifies with v1+v2 debug schemes, one signer, RSA 2048. |
| D2A -> D2B1 update compatibility (static) | Same package, **same certificate digest**, unchanged min/target SDK and permission set, versionCode 4 -> 5. No device install performed. |
| Packaged DEX inspection | Zero occurrences of `sendVideo`/`sendDocument`/`sendMediaGroup`/`sendAnimation`/`copyMessage(s)`/`openOutputStream`/`MANAGE_EXTERNAL_STORAGE`/`READ_MEDIA_VIDEO`/`READ_EXTERNAL_STORAGE`/`editForumTopic`/`createForumTopic`/`deleteForumTopic`/`setChatTitle`. |
| Localization | EN and HE at exact key parity, **235 strings each** (was 200; two generated-name keys removed, 37 added). |
| Leakage sweep | Token patterns, `t.me`/`joinchat`, real-looking chat IDs, non-synthetic content URIs, absolute storage paths: zero new matches; every hit is a pre-existing synthetic fixture or doc prose. |

## Environment notes (still current)

- `HOME=/home/devagent`. Both `/home/devagent/.android/debug.keystore` and
  `/root/.android/debug.keystore` hold `74e78654…` — verified with `keytool -list -v` **before**
  building this session. Keep verifying it each session.
- Gradle dependency cache is `/root/.gradle`, not `$HOME/.gradle`. Always
  `GRADLE_USER_HOME=/root/.gradle ./gradlew --offline …`.
- `aapt2` must go through `/opt/android-sdk/aapt2-wrapper/aapt2` (qemu shim).
- `./gradlew test --tests ...` fails with "Unknown command-line option '--tests'" — use the variant
  task: `./gradlew testDebugUnitTest --tests '*Foo'`.
- `grep` on `.dex` returns nothing useful; pipe through `strings -a` first.
- Kotlin KDoc block comments nest, so a literal `video/*` inside a doc comment breaks compilation
  (cost a build in D2A).
- Preserved APKs in this session's scratchpad: `d2a-app-debug.apk` (versionCode 4, SHA-256
  `8ac1871d…`, re-verified this session). Compare the signer digest against a preserved APK before
  claiming update compatibility.

## Artifacts (debug development signing only)

- Main APK: `app/build/outputs/apk/debug/app-debug.apk`, 14,001,979 bytes,
  SHA-256 `e84c11309671873515ed906b89126a574694cf39e47acea84c7fb10ee1d9a3b0`.
- Instrumentation APK: `app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk`,
  1,382,150 bytes, SHA-256 `2b772359fb4007cbe66011858d1368c798308c09d8b5e1b171cccba5f7a19f4b`.
- Package `com.funzi7.telegramtopicuploader`; versionCode 5; versionName `0.3.1-d2b1`; minSdk 23;
  compile/target SDK 37.
- Debug certificate SHA-256 `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4`
  (identical to D0, D1, D1.1, D2A). Development debug signing, not release signing.

## Evidence classification

USER-REPORTED D2A device evidence only — not observed or performed by any agent:

- D2A was installed over D1.1 and launched;
- existing bot validation, topic binding, and prior configuration remained available;
- a dedicated test directory was mapped to the bound destination;
- video scanning completed;
- queue entries appeared as expected;
- repeating the scan created no duplicate queue entries;
- a byte-identical copy under another file name was deduplicated for the same destination;
- **no Telegram message was sent by scanning**;
- the non-video text-file skip test was **not** performed;
- the tested D2A flow was otherwise reported as working;
- the UI displayed an automatically generated name such as "Local destination 2" instead of the real
  topic name — this is the defect D2B1 exists to fix.

Nothing else is claimed. (Earlier D1/D1.1 user-reported evidence is preserved in
`docs/PROJECT_STATE.md`.)

AGENT-OBSERVED in D2B1: repository/Git/source/schema inspection; JVM tests, lint, Kotlin and
instrumentation compilation, both APK assemblies; ZIP, AAPT2 manifest, signature/certificate,
permission and DEX inspection; the static D2A-to-D2B1 signer comparison against the preserved APK;
localization parity; leakage and logger sweeps; ADB running successfully with zero attached devices.

UNTESTED: the D2B1 APK has **never** been installed, updated over D2A, launched, or run. Destination
creation, renaming, the rename-at-confirmation form, and manual Review resolution have never run on a
device. The non-video skip case the user skipped in D2A remains unverified. No real SAF provider,
document tree, video file, or hash of real media. Android Keystore and Room persistence
instrumentation compiled only. No Telegram traffic. No media upload/copy/download/background
transfer/quarantine/move/rename/deletion. No forum topic created, renamed, closed, or deleted. No
share target, external automation, AI, release signing, distribution, or deployment.

## Remaining device work (not executed)

`docs/D2B1_DEVICE_CHECKLIST.md` — install over D2A; verify bot, binding, directories, Queue and Review
survive; verify no automatic scan or Telegram call; create a destination with an explicit name
(including the blank/multi-line/over-length rejections and a duplicate name); **rename the existing
legacy placeholder to the real Telegram topic name**; confirm the new name appears in Topics,
Directories, Queue and Review and survives restart; confirm the rename preserved binding and
test-message capability and did **not** rename the Telegram topic; create an unmapped Review item and
assign it manually; verify one QUEUED item with MANUAL routing; repeat and verify no duplicate;
verify a disabled destination is refused at the moment of assignment; verify preparation failures
cannot be bypassed into Queue; verify no media was uploaded, moved, renamed or deleted. Record only
pass/fail and counts.

Also still outstanding: `docs/D2A_DEVICE_CHECKLIST.md` items the user did not report (the non-video
skip case, cancellation, revoked-grant recovery, scan-all, force-stop reconciliation), the D1.1
binding regression items, and executing the Room migration and Keystore instrumentation on a device.

## Risks

- Every D2B1 claim is verified by JVM tests and compiled instrumentation only. The device checklist is
  the only way to confirm the dialog, the rename, and the Review actions behave in practice.
- A rename advances `updatedAt`. That is what the column means, but any consumer treating it as
  "binding last changed" would see movement. Nothing in the codebase does.
- Bidi control characters are refused in names, so a user who wanted an explicit directional mark
  cannot have one. Hebrew and mixed-direction names lay out correctly without them.
- A preparation-failure item that genuinely still has valid bytes and a valid stored hash cannot be
  queued manually; it must be rescanned first. Deliberately conservative; costs one scan.
- `DUPLICATE_ALREADY_QUEUED` keeps the Review row visible rather than clearing it, so repeatedly
  assigning duplicates accumulates accurate but non-self-clearing Review rows.
- Manual routing shares `RoomScanRepository`, so it inherits in-transaction job uniqueness rather than
  a database constraint — sound because Room serializes writes, but weaker than an index (same note as
  D2A).
- Queue reassignment and return-to-Review are absent by decision, so a manually misrouted item can
  only be corrected once D2B2 lands.
- All pre-existing D1/D1.1/D2A risks still apply (Keystore/migration/UI not device-executed; token
  transiently immutable in the OkHttp URL; `validateToken` holds the mutex across `getMe`; a cancelled
  test persists RESULT_UNKNOWN; a page with a missing `update_id` fails closed; schema-v1 duplicate
  pairs are RETEST_REQUIRED; SAF provider variance and same-length in-place modification).
- The artifact is debug-signed and is not a production release.

## Remaining D2B2 work (not started)

Persistent queue claiming with an owner lease; attempt accounting, bounded retry policy and backoff;
process-death recovery for claimed-but-undispatched jobs; constrained background coordination for the
deferred stage (re-evaluating D2A's deliberate decision **not** to use WorkManager, which was made on
permission-surface grounds — WorkManager's merged manifest contributes `WAKE_LOCK`,
`RECEIVE_BOOT_COMPLETED`, and foreground-service components); reservation-release semantics, then
return-to-Review and cancel-preparation, then safe queue reassignment on top of them, never releasing
or rewriting a reservation carrying Telegram evidence; re-hash actions beyond D2B1's rescan; and
large-directory throughput, claim-race, and process-restart tests.

## Remaining D3 work (not started)

Media transport behind a separately reviewed gateway boundary; reconcile every dispatch into
confirmed/retryable/permanent/result-unknown; never auto-retry result-unknown until duplicate risk is
reconciled; require a positive returned Telegram message ID before confirmation or deletion
eligibility; provider-aware keep/delete/quarantine with process-death recovery; revoked-grant,
partial-mutation, overflow, and confirmation-gate tests.

## Deployment declaration

Nothing was deployed, distributed, installed, or run on a device or emulator in the D2B1 session. No
Telegram request of any kind was made and no Telegram forum topic was created, renamed, closed, or
deleted. **No media was uploaded, moved, renamed, or deleted**, and no media was copied, downloaded,
or quarantined.
