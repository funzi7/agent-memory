# Telegram Topic Uploader — latest handoff

## Task and repository state

| Field | Value |
| --- | --- |
| Task | D3A.1 — reconcile the persistent queue against an exhaustive successful SAF directory scan |
| Application repository | `/root/work/telegram-topic-uploader` |
| Branch | `main` |
| Tracking branch | `origin/main` |
| Starting application HEAD | `dee9541ef6d24494f3f09f6f7d4fbddfbbf31d75` (D3A) |
| Version | code 8 -> 9, name `0.4.0-d3a` -> `0.4.1-d3a1` |
| Room schema | **5 -> 6.** `lastSeenScanRunId` on `media_items`, one index, `MIGRATION_5_6`, no backfill |
| Application commit | `feat: D3A.1 source-presence reconciliation for exhaustive scans` |
| Deployment | None |

No production token, Telegram identifier, bot username/ID, chat ID, thread ID, group title, forum
topic name, private link, binding command, file name, content URI, document ID, path, or hash of real
user media was requested, used, or recorded anywhere, including this file.

## The real user evidence that started this — read this first

USER-REPORTED D3A device evidence (not observed or performed by any agent):

- D3A was installed and launched;
- a fresh, non-personal test video was added to a configured directory;
- a scan discovered that new video;
- the dashboard queue count increased from four stale queued records to five;
- the user explicitly uploaded the new video through the application;
- the video appeared in the intended Telegram topic;
- the application reported the upload as confirmed;
- the dashboard queue count then decreased from five to four;
- the source test file remained present and unchanged;
- the remaining four queued records refer to source videos that are no longer present in the
  configured directory;
- those four videos had previously been uploaded manually outside this application;
- no duplicate upload was reported;
- no file was deleted, moved, renamed or modified by the application.

**D3A works.** The first real upload this project has ever performed did exactly what it promised.
The four stragglers are the defect.

## The defect and its exact cause

The dashboard count is derived from durable upload-job status. A successful scan:

- discovers and refreshes documents that are **present**;
- creates or reuses jobs for those documents;
- **never reconciles media rows that belong to the directory but were not discovered during the scan.**

So a `QUEUED` job stays active indefinitely after its source document is removed outside the app.
Nothing was wrong with the upload path; nothing ever asked the question.

Fixing it means letting the application conclude something from an *absence*, which is the whole risk
of this task: an absence only means anything if the search was complete.

## What D3A.1 implements

**Completeness signal.** `ScanSummary.exhaustive: Boolean`, true only when traversal reached its
natural end with access intact, no cancellation, no interruption, no traversal bound, no entry or
subtree that failed to enumerate, and no unexpected exception. New **`ScanOutcome.PARTIAL`** for a
traversal that ended without full coverage.

**A real bug fixed on the way.** `TraversalBoundReached` used to throw the internal stop exception and
then *fall through* to the shared terminal classification, producing `COMPLETED` for a truncated
traversal. Now it sets `coverageComplete = false` and lands in `PARTIAL`. Same for `EntryUnreadable`
(which continues the scan but permanently clears the flag) and `AccessRevoked`.

**Two things deliberately do NOT clear coverage**, and both matter:

- an unsupported non-video entry was enumerated fine — it just was not a video;
- a video that was enumerated and *then* failed hashing/metadata still counts as **seen**. Otherwise
  one unreadable file could protect, or condemn, every other record in the folder.

**Schema 6.** `media_items.lastSeenScanRunId: String?` plus a non-unique
`(sourceDirectoryId, lastSeenScanRunId)` index — the two columns the reconciliation query reads, in
that order. `MIGRATION_5_6` is `ALTER TABLE ADD COLUMN` + `CREATE INDEX`, nothing else.

**No backfill, and here is why it is safe.** NULL means "no completed scan has looked yet". The
reconciliation treats NULL as *not seen by this run*, which sounds dangerous for legacy rows — it is
not, because a real scan writes the marker **before** finalization runs. A legacy row whose file still
exists is marked seen by the very scan that would otherwise retire it.

**Ownership-scoped marking.** `persistDiscovery` writes the marker on insert, and on refresh only when
`existing.sourceDirectoryId == record.sourceDirectoryId`. This is the subtle one: if an overlapping
configured tree wrote *its* run ID, the owner's next scan would see a foreign marker and declare a
present file missing. The run ID travels inside `DiscoveredDocumentRecord` (new `scanRunId` field),
never from shared mutable state.

**Atomic finalization.** New `ScanRepository.finishExhaustiveRun(ExhaustiveScanFinalizeRequest)`, one
transaction: validate run + directory, re-prove `COMPLETED && exhaustive && GRANTED`, find owned rows
whose marker != this run, retire eligible pre-dispatch jobs, `markScanFinished`, delete the run row.
`ScanCoordinator` routes only exhaustive completions here; PARTIAL/CANCELLED/PERMISSION_REVOKED/
INTERRUPTED/FAILED keep `finishRun`. **Never persist "completed" and then die before reconciling.**

**Retirement.** `UploadJobDao.markSourceMissing` is the only statement that can produce
`SOURCE_MISSING`. WHERE: status in (`AWAITING_ROUTING`,`READY`,`QUEUED`), `attemptCount = 0`, and NULL
`telegramMessageId`, `telegramConfirmedAt`, `completedAt`, `deleteAfter`, `executionOwnerToken`,
`executionLeaseExpiresAt`, `dispatchAttemptId`, `dispatchStartedAt`, `lastErrorCode`,
`lastErrorMessage`. The repository pre-checks the same invariants (so an ineligible job costs
nothing); if the statement still matches 0 rows it throws and the **whole transaction rolls back**,
because a reservation may already have been released for that job.

**Reservations.** Released only on the D2B2A-style proof: names this very job, `RESERVED`, no message
ID, matches this job's canonical hash and destination, and is the single row `findByOwner` returns.
Anything else (unowned pre-D2B2A, another job's, ambiguous) is **retained untouched** and the job
still leaves the queue. Documented cost: restoring that exact content to that exact destination stays
blocked until an explicit later feature.

**New states.** `UploadStatus.SOURCE_MISSING`, `MediaStatus.SOURCE_MISSING`,
`ReviewReasonCode.SOURCE_FILE_MISSING`. Transition validator: allowed only from the three pre-dispatch
states, terminal thereafter. `findForMediaAndDestination` and `findUnresolvedForMedia` both exclude it
(the latter now requires `status = 'AWAITING_ROUTING'`) so a restored file gets a **new** preparation
instead of reviving an audit row. Queue excludes it; History includes it; dashboard gains a dedicated
`sourceMissing` count and a **Source missing** tile.

**Design decision: not a failure.** Folding it into the Failed tile would have been one line and would
have told the user Telegram rejected something that was never sent. Same reasoning keeps it out of
`RESULT_UNKNOWN` (bytes may already be in the topic) and `CANCELLED` (the user decided).

**Design decision: no private copy.** The obvious alternative — copy media into app storage so it
cannot vanish — was rejected outright: it doubles every video on the device, moves user media into the
sandbox, and rewrites the whole storage posture to paper over a counting bug.

## Surface tests that had to change (and why that was correct)

Two pre-existing guards asserted the absence of exactly what D3A.1 adds. Both were **rewritten to
protect the property that still holds**, never deleted:

- `D3ASurfaceTest` "the room schema is unchanged and progress is not persisted" -> "transient upload
  progress is still never persisted". It now *requires* `6.json`, `version = 6`, and `MIGRATION_5_6`,
  and keeps (and widens) the no-byte-progress-column assertion.
- `D2B2BSurfaceTest` migration-registration case now expects
  `arrayOf(MIGRATION_1_2, MIGRATION_2_3, MIGRATION_3_4, MIGRATION_4_5, MIGRATION_5_6)`. Its
  "4 -> 5 is purely additive" assertion is untouched.
- `ReviewActionPolicy.PREPARATION_FAILURE_REASONS` gained `SOURCE_FILE_MISSING` — there is an
  exhaustiveness test over both reason sets. In practice `classify` never sees it, because a retired
  job is no longer `AWAITING_ROUTING` and Review lists only live rows.
- `DirectoryScanPipelineTest` "a failing subtree does not prevent the rest of the directory from
  queueing" now expects `PARTIAL` instead of `COMPLETED`. That is the semantic fix, not a regression.

## Tests and exact results

The **complete** JVM suite was run, not a focused subset.

| Class | Tests | Result |
| --- | --- | --- |
| `SourceMissingReconciliationTest` (new) | 24 | 0 failures |
| `D3A1SurfaceTest` (new) | 10 | 0 failures |
| `DirectoryScanPipelineTest` (21 -> 29) | 29 | 0 failures |
| **Full suite** | **556 across 47 classes** | **0 failures / errors / skipped** |

`SourceMissingReconciliationTest` drives the real `RoomScanRepository` + `RoomCatalogRepository`
against the shared `FakeScanDaos`, so assertions are durable rows, released reservations, and the real
dashboard counts. `DirectoryScanPipelineTest.runScan` now mirrors `ScanCoordinator`'s finalization
choice exactly, so the completeness cases are end-to-end.

`FakeScanDaos` gained: `findUnseenByRun`, `markSourceMissing` (+ a `markSourceMissingHook` for the
rollback test), a real `observeDashboardCounts` computed from rows, and the two tightened lookups.
`FakeDocumentTree` gained `unexpectedlyFailingDirectories` (throws `IllegalStateException`, which the
scanner does not model) to exercise the FAILED path.

| Command/check | Result |
| --- | --- |
| `./gradlew --offline testDebugUnitTest` | 556 executed, 0 failures |
| `./gradlew --offline lint` | Passed; lint XML has 0 issues |
| `./gradlew --offline assembleDebug` / `assembleDebugAndroidTest` | Passed |
| Instrumentation | 89 across 10 classes compiled (was 77/9); **none executed — no device** |
| Room schema | 6 exported and committed; 1–5 byte-for-byte as committed by D3A |
| `git diff --check` | Passed |
| AAPT2 badging | versionCode 9, `0.4.1-d3a1`, minSdk 23, targetSdk 37; INTERNET + AndroidX injected only; cleartext false; backup false |
| `apksigner verify` | v1+v2, one signer, cert `74e78654…` (same as D0–D3A) |
| DEX | Unchanged in every capability sense from D3A: `sendVideo`/`sendDocument` 1 each by design; `deleteDocument`/`renameDocument`/`moveDocument`/`createDocument` 1 each as always; zero `sendMediaGroup`/`sendAnimation`/`sendPhoto`/`copyMessage`/`deleteMessage`/`openOutputStream`/`androidx.work`/`WorkManager`/`MANAGE_EXTERNAL_STORAGE`/`READ_MEDIA_VIDEO`/`READ_EXTERNAL_STORAGE`/`editForumTopic`/`setChatTitle` |
| Localization | EN/HE exact parity, 274 each (+5) |

New instrumentation (compiled only): `D3A1PersistenceTest` (9 tests, real Room + real Queue/History/
Dashboard SQL) and three `AppDatabaseMigrationTest` cases for 5 -> 6.

## Environment notes (still current, plus new ones)

- `HOME=/home/devagent`. Debug keystore holds `74e78654…` in both `/home/devagent/.android/` and
  `/root/.android/`. Keep verifying each session.
- Gradle cache is `/root/.gradle`: always `GRADLE_USER_HOME=/root/.gradle ./gradlew --offline …`.
- `aapt2` via `/opt/android-sdk/aapt2-wrapper/aapt2`; `apksigner` in
  `/opt/android-sdk/build-tools/37.0.0`.
- `./gradlew test --tests …` fails; use `testDebugUnitTest --tests '*Foo'`.
- `strings -a` before grepping a `.dex`.
- **Never run bare `find /`** — the proot container self-mounts recursively.
- **No earlier debug APK is preserved anywhere.** DEX checks are absolute, not differential.
- **Do not type raw U+0085/U+2028/U+2029 into a source file** — write `\\u0085` etc.
- `runTest` + `advanceUntilIdle()` **hangs** against the lease heartbeat; synchronize with a
  `CompletableDeferred` the fake gateway completes.
- Kotlin does not allow `{ copy(...) }` as an `Entity.() -> Entity` literal in a `mapOf`; use
  `listOf<Pair<(Entity) -> Entity, X>>`.
- Lint's `PluralsCandidate` fires on `%d` followed by a word. Put the unit before the number.
- **Do not add `rememberSaveable` to `TelegramSetupScreens.kt`** — `D1SecuritySurfaceTest` asserts its
  absence.
- **New:** a `when` whose branches return different types as the last expression of a `withContext`
  lambda produces an "Expression is unused" warning. Write `withContext<Unit>(NonCancellable) { … }`
  rather than appending a bare `Unit`.
- **New:** surface tests that grep production sources for words like `WorkManager`, `quarantine`, or
  `RECEIVE_BOOT_COMPLETED` will hit **prose in KDoc** — `ScanCoordinator` explains at length why
  WorkManager was rejected. Grep for usages (`import androidx.work`, `WorkManager.getInstance`,
  `OneTimeWorkRequest`) or scope permission checks to the manifest file.
- **New:** to extract one DAO `@Query` in a surface test, use
  `daos.substringBefore("fun observeX").substringBeforeLast("\"\"\"").substringAfterLast("\"\"\"")`.
  A `takeLast(n)` window silently swallows the *previous* query and produces false failures.

## Artifacts (debug development signing only)

- Main APK: `app/build/outputs/apk/debug/app-debug.apk`, 14,172,214 bytes,
  SHA-256 `571b0e8f9065ed50281b539ff3385babb4309e35233f61f722c54d9d4d2dcfde`.
- Instrumentation APK: `app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk`,
  1,559,068 bytes, SHA-256 `bc1b41480d096668a714bf51f10c1eff0ab903b2731144ea79e0833f1e54a1c5`.
- Package `com.funzi7.telegramtopicuploader`; versionCode 9; versionName `0.4.1-d3a1`; minSdk 23;
  compile/target SDK 37; debug certificate SHA-256
  `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4`.

## Evidence classification

USER-REPORTED: the D3A device evidence listed at the top of this file. Nothing else. Earlier
D2B2B/D2B2A/D2B1/D2A/D1/D1.1 user-reported evidence is preserved in `docs/PROJECT_STATE.md`.

AGENT-OBSERVED in D3A.1: repository/Git/source/schema inspection; the complete JVM suite; lint;
Kotlin and instrumentation compilation; both APK assemblies; AAPT2 manifest/signature/permission/DEX
inspection; localization parity.

UNTESTED: the D3A.1 APK has **never** been installed, updated over D3A, launched, or run. The
missing-source reconciliation has never executed on a device. The Room 5 -> 6 migration has never run
on a device, and neither has 4 -> 5. All three D2B2A corrections remain untested on a device. No real
SAF provider, document tree, video file, or hash of real media. No Telegram traffic. No media
upload/copy/download/quarantine/move/rename/deletion.

## Remaining device work (not executed)

`docs/D3A1_DEVICE_CHECKLIST.md` — install over D3A without uninstalling; run one scan of the existing
configured folder; confirm the four stale entries leave Queue, that the queue count becomes zero, that
they appear as source missing, that the previously confirmed upload stays Telegram confirmed, that the
source file still present is unchanged, and that the scan sends nothing to Telegram.

Also still outstanding from earlier versions: `D3A_DEVICE_CHECKLIST.md` beyond the single upload the
user already performed, the whole of `D2B2B_DEVICE_CHECKLIST.md` (including the Room 4 -> 5 gate), the
whole of `D2B2A_DEVICE_CHECKLIST.md`, the untested parts of `D2B1_DEVICE_CHECKLIST.md` and
`D2A_DEVICE_CHECKLIST.md`, the D1.1 binding regression, and the Keystore and persistence
instrumentation.

## Risks

- **The reconciliation has never run against a real SAF provider.** Everything is proved against a
  synthetic document tree and in-memory fakes.
- **`PARTIAL` is a user-visible behaviour change.** A folder that previously reported *completed*
  despite an unreadable subtree now reports *partly scanned* — more honest, and also the outcome that
  suppresses reconciliation, so a persistently unreadable subtree means stale rows are never cleaned
  up. Everything found is still queued.
- **A retained unowned reservation blocks re-preparation.** Restoring a file whose reservation could
  not be proved owned reports it as a duplicate. Deliberate; the remedy is a D3B feature.
- **Room 5 -> 6 has never run on a device**, and neither has 4 -> 5.
- **Absence is judged per directory, per run.** A file moved between two configured folders is retired
  by its owner's scan and re-prepared by the other's; reservation semantics decide whether that
  second preparation succeeds.
- A `RESULT_UNKNOWN` job still keeps its reservation forever and D3A.1 adds **no** reconciliation for
  it — unchanged from D3A.
- The artifact is debug-signed and is not a production release.
- All pre-existing D1/D1.1/D2A/D2B1/D2B2A/D2B2B/D3A risks still apply.

## Remaining D3B work (not started)

Android background execution and its permission cost, chosen against real durations. Batch or
continued queue execution on top of the D3A single-item path, keeping every per-item invariant. User
cancellation mapped explicitly onto the request-body-complete distinction. A reconciliation path for
`RESULT_UNKNOWN` items that never re-sends without evidence. **New:** an explicit, evidence-based way
to resolve an unowned or ambiguous legacy reservation, so a restored file blocked by one from D3A.1
can be prepared again. The provider-aware keep/delete/quarantine deletion stage with process-death
recovery, gated on a confirmed positive Telegram message ID. Revoked-grant, partial-mutation,
overflow, and deletion-gate tests.

## Deployment declaration

Nothing was deployed, distributed, installed, or run on a device or emulator in the D3A.1 session.
**No real Telegram request of any kind was made** and no Telegram forum topic was created, renamed,
closed, or deleted. **No media was uploaded, moved, renamed, copied, downloaded, quarantined, or
deleted, and no real user file was read at all** — every byte in every test came from a synthetic
in-memory array. No file on disk was mutated by the application under test at any point.
