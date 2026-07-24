# Telegram Topic Uploader — latest handoff

## Task and repository state

| Field | Value |
| --- | --- |
| Task | D3B1.4 — one canonical dashboard/list count model, clickable drill-down tiles, idempotent local state repair, and a safe `RETIRED` removal from the active queue |
| Application repository | `/root/work/telegram-topic-uploader` |
| Branch | `main` |
| Tracking branch | `origin/main` |
| Starting application HEAD | `8e4176c68e0ff9135a923ac43d869b9ab23ec969` (D3B1.3) |
| Version | code 13 -> 14, name `0.5.3-d3b1.3` -> `0.5.4-d3b1.4` |
| Room schema | **stays 7.** Statuses are stored as text, so `RETIRED` needs no migration; no entity, index, or schema JSON changed |
| Deployment | None. Not installed or run on any device or emulator in this session |

No production token, Telegram identifier, bot username/ID, chat ID, thread ID, group title, forum
topic name, private link, binding command, file name, content URI, document ID, path, or media hash
was requested, used, or recorded anywhere, including this file.

## New user-reported device evidence (D3B1.3 on hardware; not observed by any agent)

- D3B1.3 was installed and run on the user's Android device.
- Two fresh videos were uploaded through Upload queue.
- Both appeared in Telegram with **real thumbnails and real non-zero durations**.
- The D3B1.3 blank-0:00 presentation defect is therefore **user-validated as fixed** for those two files.
- The previous batch details showed **two items confirmed and one sample item rejected**.
- That confirms the earlier *completed with issues* result was caused by the **rejected sample item**,
  not by the two confirmed Telegram posts.
- Before the latest upload, the dashboard displayed **five queued** items.
- The Queue screen displayed only **three rows**: two fresh videos and one sample item.
- Three earlier videos had already been sent through the application in previous runs.
- The sample item stayed in Queue and the D3B1.3 correction action refused to remove it.
- The user asked that **every dashboard tile be clickable**.
- Source-file state after the latest run was not explicitly reported.
- The exact raw database states are not known from the user report and were **not** invented.

## Root causes

**Four definitions of the same word.** The dashboard counted `status = 'QUEUED'`; the Queue projected
`READY`/`QUEUED`/`UPLOADING`/`FAILED_RETRYABLE` through a media join; "completed" meant only
`COMPLETED`; History listed a fifth set. Each was defensible alone; none agreed. That is exactly how
five queued items sit behind a three-row queue.

**A discarded confirmation.** `recordConfirmedOutcome` refused the *whole* outcome when
`usableReservation` returned null (an unowned pre-D2B2A row, a mismatch, or missing media evidence),
throwing away a positive message ID the application already held and leaving a job Telegram had
accepted looking like ordinary queue work.

## What D3B1.4 implements

**Canonical grouping** (`domain/dashboard/DashboardGrouping.kt`). `DashboardGroup` has eight values
(WAITING_FOR_ROUTING, QUEUED, UPLOADING, NEEDS_REVIEW, COMPLETED, FAILED, CANCELLED_OR_RETIRED,
SOURCE_MISSING) and `classify(JobStateEvidence)` is total over `UploadStatus`, so a row belongs to
exactly one. Precedence: positive Telegram evidence (message ID > 0 **and** confirmation timestamp)
outranks the local status → COMPLETED; partial/non-positive evidence → NEEDS_REVIEW; a
`TELEGRAM_CONFIRMED` row without that evidence → NEEDS_REVIEW (fail closed, surfaced); then status,
with READY/QUEUED/FAILED_RETRYABLE additionally requiring no terminal completion. FAILED is
`FAILED_PERMANENT` only. Batch-item state is never an input.

**One projection.** `UploadJobDao.observeAllJobSummaries()` and `observeAllReviewRows()` (no status
WHERE at all) replace `observeDashboardCounts`/`observeQueue`/`observeHistory`/filtered
`observeReviewItems`, all now deleted. `RoomCatalogRepository` tallies counts and splits Queue/History
by group; `RoomScanRepository.observeReviewItems` filters by group. Tile count == rows behind the tile,
by construction. `UploadJobSummaryRow`/`UploadJobSummary` gained `lastErrorCode`,
`hasPositiveTelegramConfirmation`, `hasPartialTelegramEvidence`; `ReviewItemRow`/`ReviewItem` gained
`completedAt`/`hasCompleted` and the same two evidence flags; both expose `dashboardGroup`.
`DashboardCounts.cancelled` -> `cancelledOrRetired`, plus `of(group)` and `tally(groups)`.

**Root transaction fix.** `recordConfirmedOutcome` now writes `recordDispatchConfirmed` first and
unconditionally, then calls `confirmOwned` only for a provably owned matching reservation; an
ambiguous one is retained untouched (no `ExecutionConflictException` for it any more).

**Local reconciliation.** New `StateRepairRepository.reconcileDurableState(): StateRepairSummary`,
implemented by `RoomQueueExecutionRepository`, bound in `AppModule`, called once from
`MainViewModel.init`. New DAO statements `findContradictoryConfirmedJobs`, `normalizeConfirmedJob`
(clears owner/lease/dispatchAttemptId/dispatchStartedAt/nextAttemptAt/lastError*, keeps attemptCount
and the evidence), `findUnprovenConfirmations` (read-only count). Ownership never guessed, batch rows
never read, unproven confirmations never accepted. No request, no media read, no file mutation, no
resend; second pass is a no-op.

**Clickable dashboard.** `ui/DashboardTiles.kt`: `DashboardTile` (group + `TileDestination`),
`baseRoute`/`filteredRoute`/`parseGroup`, and `JobGroupFilter` (the one filter all three list screens
use). `DashboardScreen` loops over the eight tiles as `Card(onClick=…)` with `Role.Button` and a
content description; routes are `review|queue|history?group=<NAME>` with an optional nav argument.
`ActiveFilterHeader` names the filter and offers **Show all**, which clears it in place so Back still
returns to the Dashboard. Top-bar tab matching now strips the `?` query.

**Safe retirement.** `UploadStatus.RETIRED` (terminal; edges READY/QUEUED/FAILED_RETRYABLE/
FAILED_PERMANENT -> RETIRED, none out). `domain/queue/SafeRetirementPolicy.kt` +
`QueueRetirementPolicy` display gate. Eligibility: eligible status, no message ID/confirmation, never
RESULT_UNKNOWN, no claim/lease/attemptId/startedAt, and `lastErrorCode` in `PROVED_NOT_ACCEPTED_CODES`
(RATE_LIMITED, SERVER_FAILURE, DESTINATION_REJECTED, DESTINATION_NOT_READY, MEDIA_UNREADABLE,
MEDIA_TOO_LARGE, MEDIA_CHANGED, PERMISSION_REVOKED, TOKEN_INVALID, FORBIDDEN, CANCELLED) or null.
TIMEOUT/NETWORK_FAILURE/RESPONSE_INVALID/PROCESS_INTERRUPTED/UNKNOWN and unrecognised codes fail closed
(new refusal `NOT_SAFELY_RETIRABLE`). `QueueCorrectionRepository.retireFromQueue` +
`UploadJobDao.retireFromQueue` (guarded, sets completedAt, keeps attemptCount/lastErrorCode);
`releaseExactlyOwnedReservation` releases only a provably owned match and retains anything ambiguous
while the job still leaves Queue. `findForMediaAndDestination` now also excludes RETIRED, so a rescan
prepares a new job. `cancelQueuedPreparation` and its SQL guard are **unchanged**.

## Files touched

New: `domain/dashboard/DashboardGrouping.kt`, `domain/queue/SafeRetirementPolicy.kt`,
`domain/repository/StateRepairRepository.kt`, `ui/DashboardTiles.kt`; tests
`domain/dashboard/DashboardGroupingTest`, `domain/queue/SafeRetirementPolicyTest`,
`data/repository/{CanonicalProjectionTest,SafeRetirementTest,StateRepairTest}`,
`ui/DashboardTilesTest`, `security/D3B14SurfaceTest`, androidTest `data/local/D3B14PersistenceTest`.
Modified: `Models` (+RETIRED), `Daos`, `EntityMappings`, `RoomCatalogRepository`, `RoomScanRepository`,
`RoomQueueExecutionRepository`, `Repositories`, `UploadStatusTransitions`, `di/AppModule`,
`ui/MainViewModel`, `ui/Screens`, `ui/TelegramTopicUploaderApp`, `res/values{,-iw}/strings.xml`,
`app/build.gradle.kts`. Tests updated: `QueueExecutionTest`, `UploadStatusTransitionValidatorTest`,
`D2B2ASurfaceTest`, `D3A1SurfaceTest`, `MainViewModelTest`, `SourceMissingReconciliationTest`,
`FakeScanDaos`, `AppDatabaseDaoTest`, `D3A1PersistenceTest`. Docs: README, TODO, ARCHITECTURE,
PROJECT_STATE, RELEASE_REVIEW, SECURITY, D3B1_DEVICE_CHECKLIST.

## Tests and exact results

| Check | Result |
| --- | --- |
| `--offline testDebugUnitTest` | **743 tests / 63 classes, 0 failures, 0 errors, 0 skipped** (D3B1.3: 676/56) |
| `--offline lint` | **0 issues** (empty `<issues>`) |
| `--offline assembleDebug` / `assembleDebugAndroidTest` | passed |
| Instrumentation | compiles, **not run** (no device) |
| Room schema | stays **7**; no schema JSON changed |
| `git diff --check` | clean |

Key new tests: eight-group partition and evidence precedence; confirmed evidence can never count as
queued; TELEGRAM_CONFIRMED counts as completed only with the evidence it claims; DELETE_PENDING and
COMPLETED count as completed; READY/QUEUED/FAILED_RETRYABLE queued only without evidence; groups
mutually exclusive and the screen sets partition them; **every tile count equals the filtered row
count**; contradictory row normalized idempotently; owned reservation synchronized, unowned retained
verbatim; batch item alone never promotes a job; repair reads no media and mutates nothing; eight tile
routes/filters, zero-count tile, Show all; pristine cancel still works; safe failed/retry item retired;
owned reservation released atomically; ambiguous one retained while the job leaves Queue;
RESULT_UNKNOWN / confirmed / live-claim never retirable; ambiguous error codes fail closed; RETIRED
excluded from Queue and present in filtered History; batch history unchanged; EN/HE key parity and the
truthful retired note.

## APK identity (debug development signing only)

- Main APK `app/build/outputs/apk/debug/app-debug.apk`: **14,409,631 bytes**, SHA-256
  `5df9b143a9f879c1a614f99ec8d015f17825f53429ed8b9a57ef77b70fa6df0c`.
- Instrumentation APK: 1,579,572 bytes, SHA-256
  `bd7195cca8f8e7cfdec7ffbd0a17a92af870b4a79346bb32c379047445f9ab4b`.
- Package `com.funzi7.telegramtopicuploader`; versionCode 14; versionName `0.5.4-d3b1.4`; minSdk 23;
  compile/target SDK 37; cleartext false; backup false.
- AAPT2 permissions: INTERNET, ACCESS_NETWORK_STATE, RUN_USER_INITIATED_JOBS, POST_NOTIFICATIONS (+
  AndroidX `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`). One non-exported
  `platform.BatchUploadJobService` with `BIND_JOB_SERVICE`; no application receiver.
- Debug cert SHA-256 `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4` — matches the
  expected value and every earlier build, so it updates over D3B1.3 in place.

## Untested device boundary

The D3B1.4 APK has **never** been installed, updated over D3B1.3, launched, or run. Whether the user's
own database actually holds the contradictory confirmed rows the reconciliation repairs — and
therefore whether their Queued tile drops to the sample item alone — is **unproven**; the exact raw
database states are unknown and were not invented. Every test row was synthetic: no real SAF provider,
video, hash, or Telegram traffic. The two old blank 0:00 posts are never automatically resent, edited,
or deleted.

## Next device action (ask for exactly this, nothing more)

1. Install `0.5.4-d3b1.4` over D3B1.3 **without uninstalling**.
2. Open Dashboard; confirm previously sent videos no longer inflate **Queued**.
3. Confirm those completed uploads appear under **Completed**.
4. Tap each of the eight tiles and verify the matching filtered destination opens (filter named, **Show
   all** offered, Back returns to Dashboard).
5. Open the **Queued** tile; confirm the rejected sample is the only remaining active row.
6. Tap **Remove from queue** on the sample.
7. Confirm active Queue becomes empty and the sample appears under Cancelled/retired History.
8. Confirm no Telegram message was sent and no source file changed.

Do not ask the user to upload another video, rebind the bot, rescan missing sources, or retest
background permissions.

## D3B1.5 roadmap — in-place Telegram video presentation repair (not started)

The two blank 0:00 posts from D3B1.2 are still in the topic and D3B1.4 deliberately does not touch
them. D3B1.5 should add an explicit **Repair Telegram video presentation** action from confirmed
History: operate only on a positive stored Telegram message ID sent by this bot; use `editMessageMedia`
to replace that same message in place; reuse the D3B1.3 compatibility probe, duration, dimensions, and
thumbnail; never create a duplicate automatically; require the source media to still exist and still
match its canonical hash; never retry a result-unknown edit automatically.

**After the D3B1.4 device validation and the D3B1.5 presentation repair, multi-topic binding in one
session remains the next product feature.**

## Env notes (still current)

- `GRADLE_USER_HOME=/root/.gradle ./gradlew --offline …`; `aapt2` at
  `/opt/android-sdk/aapt2-wrapper/aapt2`; `apksigner` in `/opt/android-sdk/build-tools/37.0.0`.
- **`dexdump` crashes (Illegal instruction) in this sandbox** — use `strings` over extracted
  `classes*.dex` for DEX marker checks.
- `Bitmap.createScaledBitmap` trips lint `UseKtx`; use `androidx.core.graphics.scale`.
- `flatMapLatest` needs `@OptIn(ExperimentalCoroutinesApi::class)` in coroutines 1.11.
- No Robolectric/mockito: UI guarantees are proved with pure logic plus source-shape assertions in the
  `security/*SurfaceTest` classes, and Room behaviour in compiled-only androidTest.
- Lint's `PluralsCandidate` fires on `%d` followed by a word; put the count at the end of the string.
- Each repository test file declares its own private `MutableList<T>.replaceWith` helper.

## Remaining D3B work (not started)

- **D3B1.5 in-place presentation repair** (above).
- **D3B2 immediate cancellation** of the in-flight multipart request (replaces stop-after-current).
- Result-unknown reconciliation that never re-sends without evidence. D3B1.4 *surfaces* contradictory
  and unproven-confirmation rows under Needs review but resolves neither.
- Evidence-based resolution of an unowned/ambiguous legacy reservation (D3A.1 blocker).
- Safe-deletion stage gated on a confirmed positive Telegram message ID.
- A truly background notification stop action.
- Optional future conversion stage (unsupported media → H.264/AAC); D3B1.4 does not transcode.

## Deployment declaration

Nothing was deployed, distributed, installed, or run on a device or emulator in the D3B1.4 session. No
real Telegram request of any kind was made, no forum topic was created/renamed/closed/deleted, and no
media was uploaded, moved, renamed, copied, downloaded, quarantined, or deleted — every byte in every
test came from a synthetic in-memory array. The two existing Telegram posts are never automatically
resent.
