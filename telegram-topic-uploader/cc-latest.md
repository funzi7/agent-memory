# Telegram Topic Uploader — latest handoff

## Task and repository state

| Field | Value |
| --- | --- |
| Task | D2B2B — persistent queue claiming, dispatch-attempt state, bounded retry scheduling, and process-death recovery |
| Application repository | `/root/work/telegram-topic-uploader` |
| Branch | `main` |
| Tracking branch | `origin/main` |
| Starting application HEAD | `06930d5c175ce66913f884140ada39b0741395d1` (D2B2A) |
| Version | code 6 -> 7, name `0.3.2-d2b2a` -> `0.3.3-d2b2b` |
| Room schema | **4 -> 5**, explicit **additive** `MIGRATION_4_5`, no destructive fallback |
| Application commit | `feat: D2B2B durable queue claiming, dispatch attempts, bounded retry, and recovery` |
| Deployment | None |

No production token, Telegram identifier, bot username/ID, chat ID, thread ID, group title, forum
topic name, private link, binding command, file name, content URI, document ID, path, or hash of real
user media was requested, used, or recorded anywhere, including this file.

## The problem this task exists to solve — read this first

D3 performs a real upload. Before that can be safe, the database must survive a process dying
mid-upload and answer, without guessing: who was working on this, how far did they get, and is it
safe to try again. Nothing in D0–D2B2A could. `attemptCount` existed but counted nothing, there was
no owner concept, and nothing distinguished "nobody has tried this" from "someone started sending it
and vanished".

**That last distinction is the whole task.** Before the external request, the job is merely reserved
locally and can go straight back to the queue. After it, Telegram may already have accepted the
upload, so re-queueing would send the same media twice. If a future task ever wants to "just put the
stuck job back in Queue", this is why it must not.

## Schema 5

`upload_jobs` gains five nullable columns and one non-unique `(status, nextAttemptAt)` index:

- `executionOwnerToken: String?` — the single live claimer
- `executionLeaseExpiresAt: Long?` — finite lease
- `dispatchAttemptId: String?` — identifies one external attempt
- `dispatchStartedAt: Long?` — **the one-way door**
- `nextAttemptAt: Long?` — bounded retry schedule

`attemptCount` is deliberately **not** overloaded to carry ownership: "someone holds this" and "we
have tried this N times" change at different moments and answer different questions.

`MIGRATION_4_5` is five `ALTER TABLE ADD COLUMN` plus one `CREATE INDEX IF NOT EXISTS`. SQLite adds a
nullable column without rewriting the table, so it cannot fail partway. No other table is touched;
`telegramMessageId`, `telegramConfirmedAt`, `completedAt`, `deleteAfter`, `attemptCount`, `status`,
and `reviewReason` appear in no statement, so all historical evidence and every schema-4
`ownerUploadJobId` survive byte for byte.

**No backfill, on purpose.** A legacy row lands all-NULL = "unclaimed, never dispatched, due now",
the only interpretation true of every pre-D2B2B row. Inventing a claim or attempt ID would be
guessing whether something once reached Telegram. Schemas 1–4 byte-for-byte unchanged; 5 exported.

## What D2B2B implements

**`QueueExecutionRepository`** — new port, new `RoomQueueExecutionRepository` in its **own file**.
That separation is load-bearing: `D2B2ASurfaceTest` greps `RoomScanRepository.kt` for transfer
markers, and putting execution there would have hollowed that test out. Nine operations:
`claimNextEligible`, `renewLease`, `releaseClaimBeforeDispatch`, `markDispatchStarted`,
`recordConfirmedOutcome`, `recordRetryableFailure`, `recordPermanentFailure`, `recordResultUnknown`,
`reconcileExpiredClaims`.

**Claiming.** `findClaimCandidates` orders by `COALESCE(nextAttemptAt, 0)`, `createdAt`, `id` —
total and stable. Each candidate is re-verified in-transaction (canonical SHA-256; exactly one owned
`RESERVED` reservation matching hash and destination; destination send-ready for the *currently
validated* bot). The guarded `claimForExecution` repeats every invariant, so a losing claimer updates
zero rows and moves to the next candidate. `attemptCount` is **absent from its SET clause**. Owner
token is caller-supplied, from `SecureExecutionOwnerTokenGenerator` (256-bit `SecureRandom`, hex).

**`markDispatchStarted` is the only `attemptCount = attemptCount + 1` in the codebase** and
`D2B2BSurfaceTest` asserts exactly one such statement exists and that it requires
`dispatchStartedAt IS NULL`. Repeated same attempt ID → `AlreadyStarted`, no second increment
(detected before the statement runs). Different attempt ID → `ATTEMPT_MISMATCH`.

**Outcomes**, each one transaction with guarded statements:

- Confirmed — positive Telegram message ID mandatory (reuses the existing validator rule); job and
  reservation updated together, zero rows on either aborts both; no deletion scheduled.
- Retryable — clears claim and in-flight marker, keeps reservation owned+`RESERVED`, keeps job
  `QUEUED`, stores a `DispatchErrorCode` name, sets future `nextAttemptAt`; converts to permanent
  when the budget is spent.
- Permanent — terminal with `completedAt`, reservation and attempt fields retained.
- Result-unknown — clears ownership, retains attempt ID/start time, marks the reservation
  `RESULT_UNKNOWN` (**never released** — content may already be in Telegram), never reschedules.

**`RetryPolicy`** — 5 attempts; 30 s / 2 min / 10 min / 30 min; deterministic, no jitter (single-user
app, one bot, no thundering herd; reproducibility beats spread). `DEFAULT_LEASE_MILLIS` = 10 min.

**Recovery.** `reconcileExpiredClaims`, one transaction over `findExpiredClaims` — which also catches
a job left `UPLOADING` with a started dispatch and **no owner at all** (process killed between two
statements). Pre-dispatch → `clearAbandonedClaim`, preserving `attemptCount` and `nextAttemptAt`.
Post-dispatch → `markAbandonedDispatchResultUnknown` + reservation mark. Both guarded, so repeated or
concurrent passes act exactly once.

**Status contract.** Exactly one new edge: `UPLOADING -> QUEUED` (bounded-retry rescheduling).
`QUEUED -> UPLOADING`, `UPLOADING -> {TELEGRAM_CONFIRMED, FAILED_PERMANENT, RESULT_UNKNOWN}` already
existed and carry the rest.

**Design decision: reuse `UPLOADING` for "dispatch started"** instead of a new status. It already
meant exactly that, already had all four outcome edges, and already appears in `observeQueue` and
`DashboardCounts.uploading`. A new constant would have forced changes in every `when` for no gain.

**Design decision: a retryable failure lands on `QUEUED`, not `FAILED_RETRYABLE`.**
`FAILED_RETRYABLE` counts toward the Dashboard *failed* tile, which is actively misleading for an
item simply waiting 30 seconds. The durable retry marker is a future `nextAttemptAt`.
`FAILED_RETRYABLE` and its `-> QUEUED` edge are left untouched and unused by D2B2B.

**Design decision: no production coordinator start.** `QueueExecutionCoordinator` is the seam D3 will
call. It holds **no transfer executor, not even a no-op one** — a placeholder would make the queue
look like it was running while silently discarding work — and nothing at launch references it.
`D2B2BSurfaceTest` asserts both by reflection (constructor parameter types) and by source grep.

**D2B2A corrections.** `loadCorrectableJob` gained one clause refusing any job with an owner token,
lease, attempt ID, or start time → new `QueueCorrectionRefusal.EXECUTION_CLAIM_ACTIVE`. **A stale
claim is refused too**, until recovery reconciles it. The three correction SQL statements repeat the
four null checks in their WHERE clauses, and `QueueCorrectionPolicy` hides the actions via a new
`UploadJobSummary.hasExecutionClaim` projected from the queue/history queries. Note the ordering in
`loadCorrectableJob`: the evidence check (attemptCount/messageId/…) runs **first**, so an in-flight
job reports `ALREADY_DISPATCHED`, not `EXECUTION_CLAIM_ACTIVE`. The tests assert that exact split.

**UI.** One boolean in the projection, consumed by the existing display gate. `EXECUTION_CLAIM_ACTIVE`
maps to the existing `QUEUE_NOT_CORRECTABLE` notice — nothing the user could do differently — so **no
new string**. Localization stays at 255 keys per locale.

## Tests and exact results

Focused runs only; the full historical suite was deliberately **not** re-run.

| Class | Tests | Result |
| --- | --- | --- |
| `QueueExecutionTest` (new) | 39 | 0 failures |
| `RetryPolicyTest` (new) | 6 | 0 failures |
| `D2B2BSurfaceTest` (new) | 10 | 0 failures |
| Affected existing (9 classes: `QueueCorrectionTest`, `QueueCorrectionPolicyTest`, `UploadStatusTransitionValidatorTest`, `D2B2ASurfaceTest`, `MainViewModelTest`, `RoomCatalogRepositoryTest`, `EntityMappingsTest`, `ManualReviewResolutionTest`, `RoomScanRepositoryTest`) | 130 | 0 failures |
| Guards (6 classes: `D1SecuritySurfaceTest`, `D2AScanSurfaceTest`, `D2B1SurfaceTest`, `ReviewActionPolicyTest`, `SafeDeletionPolicyEvaluatorTest`, `LocalizationResourcesTest`) | 39 | 0 failures |

**Repository totals: 436 JVM tests across 41 classes** (D2B2A had 381 across 38; +55).
**71 instrumentation across 8 classes** compiled (was 55 across 7; +16), **none executed — no
device**: `AppDatabaseMigrationTest` +3 (4 -> 5 preserving everything and inventing no execution
state; confirmed/cancelled/completed evidence preserved; the claim index added alongside the existing
ones), and new `D2B2BPersistenceTest` (13) where SQLite's own write serialization proves six
concurrent claimers → one owner, six concurrent dispatch starts → one attempt, six concurrent
reconcilers → one action.

| Command/check | Result |
| --- | --- |
| Focused `testDebugUnitTest --tests …` | 224 executed, 0 failures/errors/skipped |
| `./gradlew --offline lint` | Passed; lint XML has 0 issues |
| `./gradlew --offline assembleDebug` / `assembleDebugAndroidTest` | Passed |
| Room schema | 4 -> 5; 1/2/3/4 byte-for-byte unchanged; 5 exported (9 tables) |
| `git diff --check` | Passed |
| AAPT2 badging | versionCode 7, versionName `0.3.3-d2b2b`, minSdk 23, targetSdk 37; INTERNET + AndroidX injected only; cleartext false; backup false |
| `apksigner verify` | v1+v2, one signer, cert `74e78654…` (same as D0–D2B2A) |
| Keystore | `keytool -list -v` confirmed `74e78654…` **before** building |
| DEX | Zero `sendVideo`/`sendDocument`/`sendMediaGroup`/`sendAnimation`/`copyMessage`/`openOutputStream`/`MANAGE_EXTERNAL_STORAGE`/`READ_MEDIA_VIDEO`/`READ_EXTERNAL_STORAGE`/`editForumTopic`/`createForumTopic`/`deleteForumTopic`/`setChatTitle`/`androidx.work`/`WorkManager` |
| Merged manifest | Only `androidx.room.MultiInstanceInvalidationService` + `androidx.profileinstaller.ProfileInstallReceiver`, both pre-existing; project manifest declares no service/receiver |
| Localization | EN and HE exact key parity, 255 each, unchanged |

## Environment notes (still current)

- `HOME=/home/devagent`. Both `/home/devagent/.android/debug.keystore` and
  `/root/.android/debug.keystore` hold `74e78654…`. Keep verifying it each session.
- Gradle dependency cache is `/root/.gradle`, not `$HOME/.gradle`. Always
  `GRADLE_USER_HOME=/root/.gradle ./gradlew --offline …`.
- `aapt2` must go through `/opt/android-sdk/aapt2-wrapper/aapt2` (qemu shim); `apksigner` is in
  `/opt/android-sdk/build-tools/37.0.0`.
- `./gradlew test --tests ...` fails with "Unknown command-line option '--tests'" — use the variant
  task: `./gradlew testDebugUnitTest --tests '*Foo'`.
- `grep` on `.dex` returns nothing useful; pipe through `strings -a` first.
- **Never run bare `find /` here.** The proot container self-mounts recursively, so `find /` produces
  thousands of duplicate paths and times out. Search specific roots.
- `deleteDocument`/`renameDocument`/`moveDocument`/`createDocument`/`JobScheduler`/`AlarmManager`
  appear once or twice in the DEX and always have — they are AndroidX/framework references, not our
  code. Compare counts against a preserved earlier APK rather than asserting zero.
- Kotlin KDoc block comments nest, so a literal `video/*` inside a doc comment breaks compilation.
- **Do not add `rememberSaveable` to `TelegramSetupScreens.kt`** — `D1SecuritySurfaceTest` asserts
  its absence as a token-hygiene guard.
- Negative-capability tests must grep code-shaped markers (`androidx.work`, `WorkManager.getInstance`)
  rather than bare words, because the prose explaining why WorkManager was not adopted contains them.
- A `generateSequence { }` lambda cannot call a `suspend` function; use a `buildList` + `while` loop
  in coroutine tests.
- Adding an enum constant to `QueueCorrectionRefusal` breaks the exhaustive `when` in
  `MainViewModel.toNotice()`. That is the intended tripwire.

## Artifacts (debug development signing only)

- Main APK: `app/build/outputs/apk/debug/app-debug.apk`, 14,094,921 bytes,
  SHA-256 `7ab10766f1bee3dbad8cfb44d8d674fdda9182104bdce5daec4481bc4b63dd03`.
- Instrumentation APK: `app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk`,
  1,429,939 bytes, SHA-256 `f1dba19de002f8286c4f36848bd4a1345ad717bf9e4183f1db6374d00c9e252f`.
- Package `com.funzi7.telegramtopicuploader`; versionCode 7; versionName `0.3.3-d2b2b`; minSdk 23;
  compile/target SDK 37; debug certificate SHA-256
  `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4`.

## Evidence classification

USER-REPORTED D2B2A device evidence only — not observed or performed by any agent:

- D2B2A was installed over D2B1 without uninstalling;
- the application launched successfully;
- the existing bot setup and validation remained available;
- the existing topic binding remained available;
- the renamed local destination name remained available;
- the configured directory remained available;
- existing Queue data remained available;
- **the D2B2A queue-correction actions were NOT tested** — return to Review, cancel preparation, and
  reassign destination all remain entirely unverified on a device;
- **no media upload, movement, rename, or deletion was reported.**

Nothing else is claimed. Earlier D2B1, D2A, and D1/D1.1 user-reported evidence is preserved in
`docs/PROJECT_STATE.md`.

AGENT-OBSERVED in D2B2B: repository/Git/source/schema inspection; focused JVM tests, lint, Kotlin and
instrumentation compilation, both APK assemblies; AAPT2 manifest, signature/certificate, permission
and DEX inspection; keystore certificate verification; localization parity.

UNTESTED: the D2B2B APK has **never** been installed, updated over D2B2A, launched, or run. **The
Room 4 -> 5 migration has never executed on a device or over real data.** No claim, lease renewal,
release, dispatch start, outcome, or recovery operation has ever run on a device — nothing calls them
yet. **All three D2B2A corrections remain untested on a device.** No real SAF provider, document
tree, video file, or hash of real media. Android Keystore and Room persistence instrumentation
compiled only. No Telegram traffic. No media upload/copy/download/background transfer/quarantine/
move/rename/deletion. No forum topic created, renamed, closed, or deleted. No share target, external
automation, AI, release signing, distribution, or deployment.

## Remaining device work (not executed)

`docs/D2B2B_DEVICE_CHECKLIST.md` — install over D2B2A **without uninstalling** (the migration gate; a
crash on first launch means 4 -> 5 failed and there is no destructive fallback); verify bot, binding,
renamed destination, directories, Queue, Review, History and Dashboard counts all survive; then the
negative gate — nothing executes on its own, no attempt counter moves, no progress or notification
appears, force-stop and reopen changes nothing, nothing reaches Telegram, no file is moved, renamed,
copied, or deleted, and no new folder appears.

Also still outstanding: **the entire `docs/D2B2A_DEVICE_CHECKLIST.md`** (the user explicitly did not
test the corrections), the `docs/D2B1_DEVICE_CHECKLIST.md` items the user did not report (manual
Review resolution, name validation, duplicate names), the `docs/D2A_DEVICE_CHECKLIST.md` items
(non-video skip, cancellation, revoked-grant recovery, scan-all, force-stop reconciliation), the D1.1
binding regression items, and executing the Keystore instrumentation on a device.

## Risks

- The 4 -> 5 migration has **never run on a device**. Far simpler than 3 -> 4 (nullable columns and
  one index, no rebuild, no backfill), but there is still no destructive fallback.
- Every execution operation is unexercised in production because nothing calls them. First real use
  is D3.
- The retry schedule (5; 30 s / 2 min / 10 min / 30 min) is a judgement call made without production
  data on how a real Telegram upload fails. D3 should revisit once real failure modes are known.
- The 10-minute default lease is untested against real upload durations. A large video on a slow
  connection could outlive it — which is why `renewExecutionLease` accepts an `UPLOADING` job — but
  **D3 has to actually call `renewLease`**, or recovery will convert a healthy in-flight upload to
  `RESULT_UNKNOWN`. This is the most likely D3 footgun.
- A `RESULT_UNKNOWN` job keeps its reservation forever until something reconciles it. Deliberate and
  safe, but the same content cannot be re-reserved for that topic until D3 adds a reconciliation path
  or the user acts.
- `EXECUTION_CLAIM_ACTIVE` is unreachable on this build because nothing claims anything.
- All pre-existing D1/D1.1/D2A/D2B1/D2B2A risks still apply, including that almost every pre-D2B2A
  reservation is unowned and therefore refuses correction.
- The artifact is debug-signed and is not a production release.

## Remaining D3 work (not started)

Media transport behind a separately reviewed gateway boundary. A coordinator that calls the D2B2B
execution API around every dispatch: `claimNextEligible` → `markDispatchStarted` → exactly one of the
four outcomes, renewing the lease during long transfers. Selecting and justifying the Android
background execution mechanism **together with** the real transfer — WorkManager's merged manifest
contributes `WAKE_LOCK`, `RECEIVE_BOOT_COMPLETED`, and foreground-service components, so the
permission-surface cost must be weighed against real duration, progress, cancellation, and
foreground-notification requirements. Reconciling abandoned claims where execution actually starts,
never automatically at application launch. Requiring a positive returned Telegram message ID before
confirmation or deletion eligibility. Provider-aware keep/delete/quarantine with process-death
recovery. Progress, cancellation, and user-visible queue execution controls. Revoked-grant,
partial-mutation, overflow, and confirmation-gate tests.

## Deployment declaration

Nothing was deployed, distributed, installed, or run on a device or emulator in the D2B2B session. No
Telegram request of any kind was made and no Telegram forum topic was created, renamed, closed, or
deleted. **No media was uploaded, moved, renamed, or deleted**, and no media was copied, downloaded,
or quarantined.
