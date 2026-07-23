# Telegram Topic Uploader — latest handoff

## Task and repository state

| Field | Value |
| --- | --- |
| Task | D2B2A — explicit upload-reservation ownership and safe correction of media prepared but never dispatched |
| Application repository | `/root/work/telegram-topic-uploader` |
| Branch | `main` |
| Tracking branch | `origin/main` |
| Starting application HEAD | `274a2d9f28628a38edef88a3ac4997673554a3c7` (D2B1) |
| Final application HEAD | `06930d5c175ce66913f884140ada39b0741395d1` |
| Version | code 5 -> 6, name `0.3.1-d2b1` -> `0.3.2-d2b2a` |
| Room schema | **3 -> 4**, explicit `MIGRATION_3_4`, no destructive fallback |
| Application commit | `feat: D2B2A reservation ownership and safe correction of prepared uploads` (36 files, 5,473 insertions, 95 deletions) |
| Deployment | None |

No production token, Telegram identifier, bot username/ID, chat ID, thread ID, group title, forum
topic name, private link, binding command, file name, content URI, document ID, path, or hash of real
user media was requested, used, or recorded anywhere, including this file.

## The problem this task exists to solve — read this first

D2B1 deferred return-to-Review, cancellation, and reassignment because each needs a *released*
reservation, and schema 3 reservations stored only `(id, sha256, topicDestinationId, state,
telegramMessageId, createdAt, updatedAt)`. **They did not say which job took them.** Matching by hash
and destination alone is not a safe release key:

- different media rows can hold identical bytes;
- D2B1 intentionally retains duplicate-content Review evidence (`DUPLICATE_ALREADY_QUEUED`);
- pre-D2B2A rows can be genuinely ambiguous;
- releasing another job's reservation would let the same content be sent twice later.

So D2B2A adds ownership first, corrections second. If a future task ever wants to "just delete the
reservation by hash and destination", this is why it must not.

## Schema 4

`upload_idempotency` gains `ownerUploadJobId: String?` with:

- a **unique** index on `ownerUploadJobId` — one job owns at most one active reservation, and SQLite's
  NULL-distinct rule lets any number of unowned legacy rows coexist;
- a foreign key to `upload_jobs(id)`, `onDelete = NO_ACTION`, **`deferred = true`**;
- the unique `(sha256, topicDestinationId)` guard unchanged.

**Why deferred.** The duplicate guard must fire before any job row exists, so the reservation is
written *first*, carrying the ID the job is about to get. An immediate FK would reject that. With the
deferred FK, a reservation left pointing at a job the transaction never inserted fails the **commit**,
so "no orphan job, no orphan reservation" is enforced by SQLite rather than by care. Room emits
`DEFERRABLE INITIALLY DEFERRED` in the exported schema, and `TableInfo` comparison ignores
deferrability, so `runMigrationsAndValidate` is happy.

`MIGRATION_3_4` rebuilds the table (create/copy/drop/rename — SQLite cannot `ALTER TABLE ADD` a
foreign key), copies every column verbatim, recreates all four indices, and touches **no other
table**. Room runs migrations with foreign keys off, which is why the rebuild is safe.

**Fail-closed backfill**, one guarded `UPDATE`: attribute a reservation to a job only when *exactly
one* job matches its destination and a media row with the same canonical SHA-256, further restricted
to a matching `telegramMessageId` when the reservation records one. Zero or many candidates leave the
owner NULL. This cannot violate the unique owner index: schema 3 already guaranteed one reservation
per `(sha256, destination)`, and a job has one destination and one media row.

Schemas 1, 2, 3 are byte-for-byte unchanged; 4 is exported and committed.

## What D2B2A implements

**Ownership at creation.** Both `reserveAndQueue` (scan) and `resolveManualRouteLocked` (manual) now
write the owning job ID, including when reusing a `RELEASED` row. In `reserveAndQueue` the reservation
ID is still generated before the job ID, so `SequentialIdProvider` ordering in existing tests is
unchanged.

**`QueueCorrectionRepository`** — a **new** port, deliberately not added to `ReviewResolutionRepository`
because `D2B1SurfaceTest` asserts that interface has exactly two methods. Implemented by the same
`RoomScanRepository`. Three operations:

1. `returnQueuedJobToReview(jobId)` — releases the owned reservation (`RELEASED` + owner NULL), then
   `UploadJobDao.returnToReview` sets `AWAITING_ROUTING`, null destination, `UNRESOLVED` routing, and
   reason `USER_RETURNED_TO_REVIEW`. Job ID, `createdAt`, SHA-256, `hashedAt`, `hashedSizeBytes`,
   document identity all preserved. Repeat → `AlreadyInReview`.
2. `cancelQueuedPreparation(jobId)` — releases the reservation, sets `CANCELLED` + `completedAt`,
   keeps the destination as audit evidence. Repeat → `AlreadyCancelled`.
3. `reassignQueuedJob(jobId, newDestinationId)` — blank/missing → `DestinationNotReady`; same
   destination → `AlreadyAtDestination` (which is also what a concurrent second tap sees); re-derives
   `DestinationReadiness` in-transaction; moves the reservation and the job with two guarded
   statements in one transaction; conflict at the target → `DestinationAlreadyReserved` with **nothing
   written**; a previously `RELEASED` row at the target is claimed rather than duplicated.

**`loadCorrectableJob`** is the single eligibility gate. Requires status exactly `QUEUED`, a
destination, `attemptCount == 0`, no `telegramMessageId` / `telegramConfirmedAt` / `completedAt` /
`deleteAfter` / `lastErrorCode` / `lastErrorMessage`, a canonical SHA-256, exactly one reservation
naming this job (`findByOwner`), and that reservation being `RESERVED`, evidence-free, and matching
the job's hash and destination. Otherwise a typed `QueueCorrectionRefusal` and **no mutation**.

**Every write is a guarded single statement** (`releaseOwned`, `moveOwnedReservation`,
`claimReleased`, `returnToReview`, `cancelPreparation`, `reassignDestination`) repeating the
invariants in its WHERE clause; zero rows updated throws and rolls back the whole transaction.

**`findForMediaAndDestination` now excludes `CANCELLED`.** That is what stops a later scan or manual
assignment from reviving the cancelled audit row — it creates a **new** job and reuses the released
reservation. This one-line change is load-bearing.

**`refreshMediaStatus(mediaItemId)`** recomputes the media row's status from the jobs that actually
exist (active → QUEUED, awaiting → NEEDS_REVIEW, all cancelled → CANCELLED), and returns immediately
if any job for that media carries Telegram evidence. Keeps Dashboard/Queue counts coherent without
clobbering history.

**Status contract.** Exactly one new edge: `QUEUED -> AWAITING_ROUTING`. `QUEUED -> CANCELLED` already
existed; `CANCELLED` stays terminal.

**Design decision: reused `UploadStatus.CANCELLED` instead of adding `CANCELLED_PREPARATION`.** The
status already existed for jobs and media, was already in `observeHistory`, and already had the
`QUEUED -> CANCELLED` edge. Nothing else produces it, so it is unambiguous today. Adding an enum
constant would have forced changes in every `when` in the UI and the validator for no safety gain.
**If D2B2B adds another cancellation source, revisit this.**

**Design decision: `ReviewReasonCode.USER_RETURNED_TO_REVIEW` is route-related.** Added to
`ReviewActionPolicy.ROUTE_RELATED_REASONS` so a returned item flows straight back into the D2B1 manual
assignment UI. `ReviewActionPolicyTest` asserts the route/preparation sets are disjoint and cover
every reason code — any new reason code must be placed in exactly one of them or that test fails.

**UI.** `UploadJobListScreen` split: new `QueueScreen(rows, sendReadyDestinations, corrections)` over
`QueueRow(job, canCorrect)`; History keeps `UploadJobListScreen`. `QueueCorrectionPolicy.isCorrectable`
is the pure display gate (status/destination/evidence/completion/attempts) — it cannot see ownership,
so a row may offer an action the repository then refuses. `UploadJobSummary` gained
`topicDestinationId`, `hasTelegramEvidence`, `hasCompleted`; `DashboardCounts` gained `cancelled`.
Both withdrawals show an `AlertDialog` first. 20 new strings in each locale (235 -> 255).

## Tests and exact results

**JVM: 381 tests across 38 classes, 0 failures/errors/skipped** (D2B1 had 332 across 35; +49).

| New/changed class | Tests | Covers |
| --- | --- | --- |
| `QueueCorrectionTest` | 30 | ownership on scan- and manual-created reservations; a job never owning two; duplicate leaving no orphan job; return preserving job ID/`createdAt`/hash/media; repeated + 6-way concurrent return; foreign-owned and unowned reservations refused for all three ops; missing reservation; evidence-carrying and non-releasable reservation states; six dispatch-evidence shapes; seven non-QUEUED statuses; missing job; no canonical hash; returned item re-routable reusing the released row; cancel keeping the audit row and media metadata; repeated/concurrent cancel; later scan producing a NEW job; reassign atomic; same-destination no-op; blank/missing destination; four readiness refusals; unvalidated token; conflict preserving everything; released target claimed; repeated reassign; folder mapping untouched |
| `QueueCorrectionPolicyTest` | 5 | the display gate |
| `D2B2ASurfaceTest` | 7 | port method set; no claiming/lease/retry/WorkManager/service markers; no transfer or Telegram symbol in the corrections; Queue renders no dispatch control and keeps the details expander; only the one pre-existing `DELETE FROM upload_jobs`; four schemas + `MIGRATION_3_4` registered, no destructive fallback; one manifest permission |
| `UploadStatusTransitionValidatorTest` | +2 | the new edge; no dispatched/terminal status may return to routing; the edge still names the destination it leaves |
| `ReviewActionPolicyTest` | +1 | a returned item offers manual assignment again |
| `MainViewModelTest` | +4 | queue rows gate corrections; each action forwards one request; idempotent outcomes are plain results; every refusal maps to its own notice |

**Instrumentation: 55 compiled across 7 classes (was 40 across 6), none executed — no device.**
`AppDatabaseMigrationTest` +5 (3 -> 4 preserving everything and backfilling an unambiguous owner;
message-ID evidence resolving an ambiguous pair; ambiguous and orphan rows staying unowned; unowned
row still blocking duplicates while the guarded release matches zero rows; one job cannot own two
reservations while many unowned rows coexist). New `D2B2APersistenceTest` (10) for the three
corrections against real Room.

| Command/check | Result |
| --- | --- |
| `GRADLE_USER_HOME=/root/.gradle ./gradlew --offline test` | Passed: 381 tests, 38 classes, 0 failures/errors/skipped. |
| `./gradlew --offline lint` | Passed; lint XML contains 0 issues. |
| `./gradlew --offline assembleDebug` / `assembleDebugAndroidTest` | Passed. |
| Room schema | 3 -> 4; schemas 1/2/3 byte-for-byte unchanged; 4 exported (9 tables). |
| `git diff --check` | Passed. |
| `adb devices -l` | Ran successfully; **zero attached devices**. |
| AAPT2 badging | versionCode 6, versionName `0.3.2-d2b2a`, minSdk 23, targetSdk 37; INTERNET + AndroidX injected only; cleartext false; backup false. |
| `apksigner verify` | v1+v2, one signer, cert `74e78654…` (same as D0–D2B1). |
| DEX inspection | Zero `sendVideo`/`sendDocument`/`sendMediaGroup`/`sendAnimation`/`copyMessage(s)`/`openOutputStream`/`MANAGE_EXTERNAL_STORAGE`/`READ_MEDIA_VIDEO`/`READ_EXTERNAL_STORAGE`/`editForumTopic`/`createForumTopic`/`deleteForumTopic`/`setChatTitle`/`androidx.work`/`WorkManager`. |
| Localization | EN and HE at exact key parity, **255 strings each** (was 235; +20 both). |
| Leakage sweep | Zero new matches. |

## Environment notes (still current)

- `HOME=/home/devagent`. Both `/home/devagent/.android/debug.keystore` and
  `/root/.android/debug.keystore` hold `74e78654…` — verified with `keytool -list -v` **before**
  building this session. Keep verifying it each session.
- Gradle dependency cache is `/root/.gradle`, not `$HOME/.gradle`. Always
  `GRADLE_USER_HOME=/root/.gradle ./gradlew --offline …`.
- `aapt2` must go through `/opt/android-sdk/aapt2-wrapper/aapt2` (qemu shim); `apksigner` is in
  `/opt/android-sdk/build-tools/37.0.0`.
- `./gradlew test --tests ...` fails with "Unknown command-line option '--tests'" — use the variant
  task: `./gradlew testDebugUnitTest --tests '*Foo'`.
- `grep` on `.dex` returns nothing useful; pipe through `strings -a` first.
- Kotlin KDoc block comments nest, so a literal `video/*` inside a doc comment breaks compilation.
- **Do not add `rememberSaveable` to `TelegramSetupScreens.kt`** — `D1SecuritySurfaceTest` asserts its
  absence as a token-hygiene guard.
- A negative-capability test that greps for a bare word like `WorkManager` will trip over the
  *prose* in `ScanCoordinator.kt` explaining why it was not adopted. Grep for code-shaped markers
  (`androidx.work`, `WorkManager.getInstance`, `android.permission.WAKE_LOCK`) instead. This cost one
  test run.

## Artifacts (debug development signing only)

- Main APK: `app/build/outputs/apk/debug/app-debug.apk`, 14,045,758 bytes,
  SHA-256 `cc9635c3ebb6c0d9c236d1cb8486d63a0369b96f2d06088e6403fe819b4f85ef`.
- Instrumentation APK: `app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk`,
  1,402,376 bytes, SHA-256 `32725c214646c36e6a9c437b6566bf5e5743f83392beff141e93e8594a0447a1`.
- Package `com.funzi7.telegramtopicuploader`; versionCode 6; versionName `0.3.2-d2b2a`; minSdk 23;
  compile/target SDK 37; debug certificate SHA-256
  `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4`.

## Evidence classification

USER-REPORTED D2B1 device evidence only — not observed or performed by any agent:

- D2B1 was installed over D2A and launched;
- the existing Telegram topic binding remained available after the update;
- the user renamed the existing legacy local destination in the Topics screen;
- the new local destination name was saved and remained visible;
- the rename did not break the existing topic binding;
- manual Review resolution was **not** reported as tested;
- explicit creation-name validation, duplicate destination names, and invalid-name rejection were
  **not** reported as tested;
- **no media upload, movement, rename, or deletion was reported.**

Nothing else is claimed. Earlier D2A and D1/D1.1 user-reported evidence is preserved in
`docs/PROJECT_STATE.md`.

AGENT-OBSERVED in D2B2A: repository/Git/source/schema inspection; JVM tests, lint, Kotlin and
instrumentation compilation, both APK assemblies; ZIP, AAPT2 manifest, signature/certificate,
permission and DEX inspection; keystore certificate verification; localization parity; leakage
sweeps; ADB running successfully with zero attached devices.

UNTESTED: the D2B2A APK has **never** been installed, updated over D2B1, launched, or run. **The Room
3 -> 4 migration has never executed on a device or over real data.** Returning, cancelling, and
reassigning a queued item have never run on a device. No real SAF provider, document tree, video file,
or hash of real media. Android Keystore and Room persistence instrumentation compiled only. No
Telegram traffic. No media upload/copy/download/background transfer/quarantine/move/rename/deletion.
No forum topic created, renamed, closed, or deleted. No share target, external automation, AI, release
signing, distribution, or deployment.

## Remaining device work (not executed)

`docs/D2B2A_DEVICE_CHECKLIST.md` — install over D2B1 **without uninstalling** (this is the migration
gate; a crash on first launch means 3 -> 4 failed and there is no destructive fallback); verify bot,
bindings, directories, Queue, Review, History all survive; verify pre-update queue entries refuse
correction with the reservation message (expected — their reservations are unowned) or, if they do
correct, record that; prepare a fresh item and return it to Review, then re-assign it from Review;
change a prepared item's destination and confirm the folder mapping is unchanged; confirm a conflict
refuses without cancelling anything; confirm readiness is enforced at the moment of the change; cancel
a preparation and confirm History says cancelled, the Dashboard Cancelled tile rises, and a later scan
creates a **new** job while the cancelled row survives; Hebrew/RTL pass; and the full negative-scope
check that no media was moved, renamed, or deleted and nothing reached Telegram.

Also still outstanding: the `docs/D2B1_DEVICE_CHECKLIST.md` items the user did not report (manual
Review resolution, name validation, duplicate names), the `docs/D2A_DEVICE_CHECKLIST.md` items (the
non-video skip case, cancellation, revoked-grant recovery, scan-all, force-stop reconciliation), the
D1.1 binding regression items, and executing the Keystore instrumentation on a device.

## Risks

- The 3 -> 4 migration rebuilds `upload_idempotency`. Covered by five instrumentation cases, **none
  of which has run on a device**, and there is no destructive fallback to recover with.
- The owner foreign key is deferred, so a violation surfaces at `COMMIT` rather than at the offending
  statement. Safe (everything fails closed to a typed refusal) but less precise to diagnose.
- **Almost every pre-existing reservation will be unowned**, because the backfill refuses to guess. So
  older queue entries will refuse all three corrections. Deliberate, conservative, and the most likely
  source of user confusion — the checklist calls it out.
- `CANCELLED` is reused as the terminal cancelled-preparation status. Unambiguous today; revisit if
  D2B2B adds another cancellation source.
- Reassignment refuses a conflict rather than resolving it; the user must cancel the conflicting item
  explicitly. An implicit cancellation would be exactly the hidden mutation this task avoids.
- `QueueCorrectionPolicy` gates the UI on a projection that cannot see ownership, so a row can offer
  an action the repository then refuses with a plain sanitized message.
- All pre-existing D1/D1.1/D2A/D2B1 risks still apply.
- The artifact is debug-signed and is not a production release.

## Remaining D2B2B work (not started)

Persistent queue claiming with an owner lease; attempt accounting, bounded retry policy and backoff;
process-death recovery for claimed-but-undispatched jobs; constrained background coordination
(re-evaluating D2A's deliberate decision **not** to use WorkManager, made on permission-surface
grounds — its merged manifest contributes `WAKE_LOCK`, `RECEIVE_BOOT_COMPLETED`, and foreground-service
components); deciding what a claimed-but-undispatched job may do with its reservation **by extending
the D2B2A ownership model, not around it**; re-hash actions beyond D2B1's rescan; and large-directory
throughput, claim-race, and process-restart tests.

## Remaining D3 work (not started)

Media transport behind a separately reviewed gateway boundary; reconcile every dispatch into
confirmed/retryable/permanent/result-unknown; never auto-retry result-unknown until duplicate risk is
reconciled; require a positive returned Telegram message ID before confirmation or deletion
eligibility; provider-aware keep/delete/quarantine with process-death recovery; revoked-grant,
partial-mutation, overflow, and confirmation-gate tests.

## Deployment declaration

Nothing was deployed, distributed, installed, or run on a device or emulator in the D2B2A session. No
Telegram request of any kind was made and no Telegram forum topic was created, renamed, closed, or
deleted. **No media was uploaded, moved, renamed, or deleted**, and no media was copied, downloaded,
or quarantined.
