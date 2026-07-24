# Telegram Topic Uploader — latest handoff

## Task and repository state

| Field | Value |
| --- | --- |
| Task | D4B — remove folder-to-topic routing from the product, keep source profiles organizational only, autoplay Preview and release it cleanly on close, add destination selection with Add to queue and Send now inside Preview, and delete a source file only after an exact positive Telegram confirmation |
| Application repository | `/root/work/telegram-topic-uploader` |
| Branch | `main` |
| Tracking branch | `origin/main` |
| Starting application HEAD | `ec59744` (D4A) |
| Version | code 19 -> 20, name `0.7.0-d4a` -> `0.8.0-d4b` |
| Room schema | **9 -> 10.** One additive column, one new table, one legacy cleanup; `MIGRATION_9_10`, `10.json` exported |
| Deployment | None. Not installed or run on any device or emulator in this session |

No production token, Telegram identifier, bot username/ID, chat ID, thread ID, group title, forum
topic name, private link, binding command, nonce, file name, content URI, document ID, path, folder
name, destination name, or media hash was requested, used, or recorded anywhere, including this file.

## New user-reported D4A hardware evidence (not observed by any agent)

Recorded exactly as reported, and nothing beyond it:

- D4A was installed and run on the Android device.
- The folder UI shows source-profile assignment.
- The legacy one-destination folder mapping is **still visible**.
- The user clarified that Instagram, TikTok and Downloads/X media may **all** go to **any**
  destination. The source profile must therefore remain organizational only.
- In Preview, pressing Back closes the visible overlay but playback **continues audibly for roughly
  one additional second**.
- Preview **does not begin playback automatically**.
- The user wants destination selection and **Add to queue** / **Send now** inside Preview.
- The user has **intentionally not started uploading the large media backlog**, because safe deletion
  after a confirmed upload was not implemented yet.
- The user **cannot reasonably compare a large folder manually against Telegram** to identify which
  files were uploaded.
- The user selected a **per-folder** delete-after-confirmation toggle, **off by default**.
- The user selected **bounded automatic deletion retries plus a manual retry action**.

**Nothing is user-reported about D4A bulk-routing success, real thumbnail codec coverage, duplicate
pre-check behaviour, or the single-progress-indicator fix. Do not mark them validated.**

## The user's decisions (final; do not reopen)

Twenty were supplied **with** the task: profile is organizational only; a folder has no fixed
destination; the legacy folder-to-destination control is removed; existing folder mappings stop
affecting new scans; queued/uploading/completed jobs keep their destinations; Preview autoplays;
thumbnail tap stays selection-only; Preview is a separate explicit action; Back/Close stop playback
before the overlay disappears; Preview offers a destination and then both actions; Add to queue uses
the atomic engine with one item and starts no upload; Send now uses that same routing path then the
existing foreground upload engine and stays open until settlement; deletion is per-folder, OFF by
default for every existing and new folder, never retroactive, permitted only after a positive message
ID + durable timestamp + committed transaction; never after refusal/failure/cancellation/retryable/
RESULT_UNKNOWN/contradictory evidence; a deletion failure keeps the upload confirmed and never
re-uploads; bounded automatic retries plus a manual retry; History shows the deletion state; Preview
closes and returns to Review after either action.

Answered through the **stop-and-ask UX gate** (work stopped before any file was edited):

1. **Back during an active Send now transfer** -> **Back closes Preview and the upload continues.**
   Progress, Cancel now and the outcome move to the Queue row. The two rejected options were holding
   the user on the screen for a large video, and discarding an almost finished upload on a stray Back.
2. **When a changed folder delete toggle becomes fixed for an already-queued job** -> **frozen when
   routed, re-synced while still merely queued.** A job that has begun dispatching, carries Telegram
   evidence, or has completed keeps what it was routed under.

## What was removed, not hidden

`SourceDirectory.topicDestinationId`, `ScanFinalizeRequest.folderDestinationId`,
`DirectoryRepository.setTopicDestination`, `SourceDirectoryDao.setTopicDestination`,
`DirectoryRow.destination` / `.readiness`, `Screens.DestinationSelector`, `readinessLabel`, and six
`destination_state_*` strings plus five destination-mapping strings **in both locales**.

The DB column `source_directories.topicDestinationId` **survives**, nullable and documented as
legacy. Dropping a column from SQLite means rebuilding the table and copying every configured folder;
a column nobody reads is the smaller risk. It is cleared by `MIGRATION_9_10` **and** by
`DirectoryRepository.clearLegacyFolderDestinations()` on every startup reconciliation.

`RoutingMethod.FOLDER` survives in exactly two places and neither creates one: the routing engine's
own branch (nothing feeds it) and the History label a pre-D4B job needs. `D4BSurfaceTest` pins that.

The scan still calls the one routing engine with `folderDestinationId = null`, so "a human must
decide" stays the engine's conclusion rather than an assertion the scan makes alone. `reserveAndQueue`
survives as an unreachable-but-correct branch, in the same style as the existing
`AiProposalNeedsReview` branch.

## Deletion design (the part worth re-reading)

- `domain/deletion/SourceDeletionGate` — **pure** function over `DeletionGateFacts`. No Room, no
  Android, no clock, no provider. `D4BSurfaceTest` asserts that purity by marker.
- `SourceDeletionCoordinator` — runs the gate, re-proves the document, calls the deleter once,
  records one durable outcome. Asks `ExternalMediaOperationArbiter` whether anything is reading the
  file; **does not** take the slot itself (the sweep runs *after* the upload releases it).
- `data/deletion/AndroidDocumentDeleter` — the **only** production file that can delete. Tree URI +
  recorded document ID. No name, path, `File`, listing, or bulk op.
- `source_deletion_tasks` — **unique index on `mediaItemId`**, so one source deletes once however many
  destinations confirmed it. `insertIfAbsent` is `OnConflictStrategy.IGNORE`.
- `markAttemptStarted` is a **compare-and-set on the task's own attempt counter**, both so two sweeps
  cannot take one task and so the D2B2B guard "only one statement increments attemptCount" stays
  byte-exact (it counts `attemptCount = attemptCount + 1` occurrences in `Daos.kt`; the deletion
  statement computes from the bound parameter instead, and even the KDoc had to avoid the literal).
- `upload_jobs.sourceDeletePolicy` is a **new column, not `deleteAfter`**: `deleteAfter` is a
  quarantine deadline and part of `hasResolvedEvidence()`, so overloading it would make a deletion
  decision look like Telegram evidence.
- The deletion task is created **inside `recordConfirmedOutcome`'s transaction**, best-effort: a
  bookkeeping failure must never abort a confirmation. A task existing at all is therefore the proof
  that the confirmation committed, which is what `confirmationCommitted = true` encodes.
- Re-proof before deleting = identity, then size + mtime, then a **full SHA-256 re-read**. Always,
  not only when metadata looks odd. The operation is irreversible.
- `WAITING_FOR_OTHER_JOBS` is **not an attempt** and does not spend the retry budget.
- Retry budget = 4, clamped doubling backoff from 60 s to 30 min. Manual retry re-arms and
  revalidates. Neither can contact Telegram or start an upload.
- Sweep call sites, and there are only four: after a confirmed foreground upload, after a confirmed
  batch item (same call — a batch item goes through `MediaUploadCoordinator`), startup
  reconciliation, and Dashboard pull-to-refresh. No scheduler, worker, alarm, or observer.

## Preview

`_previewPinnedRow` in `MainViewModel` is the non-obvious piece. Routing moves the item out of Review
*before* the upload starts, and D4A's rule closes a preview whose row disappeared — so Send now would
have slammed the overlay shut on its own progress. The pin lives exactly as long as the action, so
the ordinary rule is untouched.

`TransferIndicatorPolicy` gained `PREVIEW_SHEET` and a `previewVisible` input. `slotFor` is exhaustive
over kind × batchCardVisible × previewVisible, and the test asserts exactly one drawing surface for
every combination.

One shared `stopPlayback` closure is used by `BackHandler`, the Close button, and
`DisposableEffect(onDispose)`; it clears listeners, calls `VideoView.stopPlayback()` (releases the
`MediaPlayer` **and** the surface, unlike `pause()`), nulls the reference, and abandons audio focus.
Autoplay hangs off `setOnPreparedListener`, never off composition.

## Schema decision: 9 -> 10

```sql
ALTER TABLE upload_jobs ADD COLUMN sourceDeletePolicy TEXT NOT NULL DEFAULT 'KEEP';
CREATE TABLE source_deletion_tasks (...);           -- + 3 indices, unique on mediaItemId
UPDATE source_directories SET topicDestinationId = NULL;
```

`'KEEP'` is the only honest default: those uploads were confirmed before the policy existed. The new
table starts empty, so nothing historical acquires deletion work. No job destination, Telegram
evidence, reservation, or media row is touched; no folder is opted in; destructive fallback stays
forbidden.

## Tests and exact results

```
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline testDebugUnitTest      # 1109 tests / 84 classes, 0 failures
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline lint                   # No issues found
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline assembleDebug          # success
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline assembleDebugAndroidTest  # success (compiled only)
git diff --check                                                          # clean
```

New: `SourceDeletionGateTest`, `SourceDeletionCoordinatorTest`, `D4BSurfaceTest`, plus test fakes
`FakeSourceDeletionRepository`, `FakeDocumentDeleter`, `FakeSourceDeletionLauncher`,
`FakeSourceDeletionTaskDao`. Extended: `MainViewModelTest`, `QueueExecutionTest`,
`BulkReviewRoutingTest`, `RoomDirectoryRepositoryTest`, `MediaUploadCoordinatorTest`,
`TransferIndicatorPolicyTest`, `AppDatabaseMigrationTest` (9 -> 10).

**Rewritten, not deleted**, because their subject moved: the folder-routing regions of
`RoomScanRepositoryTest`, `DirectoryScanPipelineTest`, `QueueCorrectionTest`, and
`SourceMissingReconciliationTest`. They now assert a scan reaches Review and reserves nothing, and
that the duplicate guard fires at the routing step.

`SourceDeletionCoordinatorTest` uses the **production** `StreamingMediaHasher` over `FakeDocumentTree`
on purpose: the re-proof is the last line of defence and stubbing it would test everything except the
thing that decides whether these are the bytes Telegram took.

## APK identity (debug development signing only)

| Field | Value |
| --- | --- |
| Package | `com.funzi7.telegramtopicuploader` |
| Version | code 20, name `0.8.0-d4b` |
| minSdk / targetSdk / compileSdk | 23 / 37 / 37 |
| Permissions | `INTERNET`, `ACCESS_NETWORK_STATE`, `RUN_USER_INITIATED_JOBS`, `POST_NOTIFICATIONS` — **unchanged** |
| Application components | 1 exported launcher activity, 1 non-exported `BatchUploadJobService` (`BIND_JOB_SERVICE`) — **unchanged** |
| Path | `app/build/outputs/apk/debug/app-debug.apk` |
| Size | 14,826,111 bytes |
| SHA-256 | `ae06ce4c4a7b4f83516e9a6104fc22837c128f97c3ab2665e4d6eb05fafd5eb8` |
| Signer | `CN=Android Debug, O=Android, C=US`, RSA 2048, cert SHA-256 `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4` |
| Schemes | v1 JAR ✓, v2 ✓ (v3/v3.1/v4 not used) |

Signer unchanged, so it installs **over** D4A without an uninstall.

## Agent-observed vs user-reported

**Agent-observed:** every test result, the lint result, both assemblies, the schema export, the merged
manifest, and the APK identity above.

**User-reported only:** everything in the hardware-evidence section. No agent saw the device, the
folder screen, the Preview audio, or the backlog.

## Device-untested boundaries

Nothing in D4B ran on a device or emulator. Specifically unverified on hardware: that Preview
autoplays and that Back silences it instantly; that Add to queue and Send now work from the overlay
against a real topic; the 9 -> 10 migration on a real installed database; and — most importantly —
**that a real source document is deleted, once, only after Telegram confirms it. The deletion path has
never touched a real file.** Instrumentation suites compile but were not run; no device was attached.

The D4A behaviours the device never exercised remain unvalidated: bulk routing against a real topic,
thumbnail decoding across real codecs, the duplicate pre-check's blocked-item list, and the
single-progress-indicator fix.

## Next device action (ask for exactly this)

`docs/D4B_DEVICE_CHECKLIST.md`. Its steps 7–9 are the gate: **do not upload the backlog until a single
disposable test video has been confirmed and its source deleted, with nothing else in the folder
touched.** Do not ask for token setup, multi-topic binding, Dashboard counts, source-missing
reconciliation, old repair validation, or a full D4A selection retest.

## Roadmap after D4B

1. Whatever the device reports about deletion, in particular any retry state seen in the wild.
2. Optional content-based topic *suggestions* on Review (never automatic routing).
3. Only after that is proved on hardware: high-confidence automatic routing, strictly opt-in, with
   uncertain items still landing in Review.
4. **Explicitly not on the roadmap: per-account mapping.** The user has ruled it out.
5. Still open from before: result-unknown reconciliation that never re-sends without evidence
   (including a *manual* repair-retry design), and evidence-based resolution of an unowned or
   ambiguous legacy reservation (D3A.1).

## Process rules the user set

- **Do not ship a single-hotfix build on its own**; fold it into the next substantive milestone.
- **Mandatory stop-and-ask UX gate**: inspect the implementation *first*, then ask one grouped
  question with numbered options, short practical consequences, and **no preselected default**, and
  stop until answered. D4B raised two; both were answered before any file was edited.
- Do not introduce another binding command alias or syntax without asking first.

## Env notes (still current)

- `GRADLE_USER_HOME=/root/.gradle ./gradlew --offline …`; `aapt2` at
  `/opt/android-sdk/aapt2-wrapper/aapt2`.
- `apksigner` is at `/opt/android-sdk/build-tools/36.0.0/apksigner`. `verify --print-certs -v` gives
  DN, cert SHA-256, key algorithm/size, and which schemes verified, in one call.
- **`lint` takes ~10 minutes.** Run it in the background and do other work meanwhile.
- **`dexdump` crashes (Illegal instruction)** — use `strings` over extracted `classes*.dex`.
- Merged manifest at
  `app/build/intermediates/merged_manifest/debug/processDebugMainManifest/AndroidManifest.xml`. It
  legitimately contains debug-only components from `ui-tooling`, `ui-test-manifest`, `androidx
  .startup`, `room`, and `profileinstaller`; the *application's own* manifest is still one activity
  and one service.
- **The offline Gradle cache has no media3, ExoPlayer, Coil, Glide, or Picasso.** Anything
  media-shaped must use platform APIs (`VideoView`, `MediaPlayer`, `MediaMetadataRetriever`,
  `AudioManager`).
- **Room's SQL parser rejects a correlated subquery in a projection** ("no viable alternative at
  input 'upload_jobs AS others'"). Split it into a second `@Query` and compose in the repository —
  which reads better anyway.
- **A source-shape guard must strip comments** (`codeOf()`), *and* the guards that do not strip them
  (D2B2B's attempt-count counter) mean a KDoc containing the banned literal will fail the build.
- **Blanket "no file may be deleted" guards** now live in `D2B1`, `D2B2A`, `D2B2B`, `D3A`, `D3B2` and
  `D4A` surface tests. D4B narrowed each **by file name** (`AndroidDocumentDeleter.kt`) rather than by
  dropping a marker. Keep it that way: the guards still prove nothing else can touch media.
- **The version literal is pinned in four surface tests now**: `D3B15`, `D3B2`, `D4A`, `D4B`. Every
  bump must update all of them.
- **A migration guard bounded by `substringBefore("val ALL: Array<Migration>")` breaks** the moment a
  later migration is added — it swallows the new one. Bound at the *next* migration name instead.
  `D4A` and `D3B15` both needed this.
- **`preview_choose_destination` collides with the banned marker `review_choose_destination`** by
  substring. Watch out for string keys that contain a removed key as a suffix.
- Lint's `UnusedResources` **will** fail the 0-issue bar when a UI removal orphans strings — delete
  them from **both** locales (`LocalizationResourcesTest` compares key sets exactly).
- **An apostrophe in an English string resource must be escaped** (`\\'`) or `mergeDebugResources`
  fails. `\\u2014` for an em dash works and avoids the issue entirely.
- **`%1$d` followed by a word trips lint's `PluralsCandidate`.** Use `<plurals>`. For Hebrew use
  `one`/`two`/`other` only.
- Adding a default parameter to an `interface` method adds a synthetic `name$default` to
  `declaredMethods`, breaking exact-set reflection assertions in surface tests.
- No Robolectric/mockito: prove UI rules by extracting them into pure objects (`SourceDeletionGate`,
  `TransferIndicatorPolicy`, `ReviewSelection`, `ReviewGridPartition`, `MediaSummaryFormat`, …) plus
  source-shape assertions, and Room behaviour in compiled-only androidTest.
- Kotlin property initializers run in declaration order: a `StateFlow` whose `combine`/`onEach`
  touches a `MutableStateFlow` must be declared **after** it.
- In `runTest`, a `stateIn(WhileSubscribed)` flow has no value until something collects it **and**
  `advanceUntilIdle()` has run. A ViewModel action that reads `.value` will silently no-op otherwise.

## Deployment declaration

Nothing was deployed, installed, or run on a device or emulator in the D4B session. **No real Telegram
request of any kind was made** — no `sendVideo`, no `editMessageMedia`, no `getUpdates`, no send. No
forum topic was created, renamed, closed, or deleted; no binding was written against a real group.
**No media file was uploaded, moved, renamed, copied, downloaded, quarantined, or deleted**, and no
real document was opened for writing on any path. The deletion code added in this milestone has never
run against real user storage.
