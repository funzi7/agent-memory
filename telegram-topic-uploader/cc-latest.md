# Telegram Topic Uploader — latest handoff

## Task and repository state

| Field | Value |
| --- | --- |
| Task | D4A — manual source profiles for the three watched folders, a Review thumbnail grid, global selection across filters, select-all-current-filter and clear-all-global, atomic bulk routing of a selection to one topic, in-app video preview, and removal of the duplicate visible progress indicators |
| Application repository | `/root/work/telegram-topic-uploader` |
| Branch | `main` |
| Tracking branch | `origin/main` |
| Starting application HEAD | `7d01454` (D3B2) |
| Committed application HEAD | `ec59744` — D4A, pushed to `origin/main` |
| Version | code 18 -> 19, name `0.6.1-d3b2` -> `0.7.0-d4a` |
| Room schema | **8 -> 9.** One additive column, `MIGRATION_8_9`, `9.json` exported |
| Deployment | None. Not installed or run on any device or emulator in this session |
| Session history | The first D4A session was **interrupted** (Termux closed) after implementing and validating, but **before any commit**. A second session recovered the dirty worktree, completed three remaining gaps, and committed. |

No production token, Telegram identifier, bot username/ID, chat ID, thread ID, group title, forum
topic name, private link, binding command, nonce, file name, content URI, document ID, path, or media
hash was requested, used, or recorded anywhere, including this file.

## Recovery from the interrupted first session

Recorded because it explains the shape of the commit, not because anything was lost.

**What existed before the interruption.** Both repositories were on their original HEADs
(`7d01454` / `407c185`), zero ahead and zero behind, with **no commit of any kind**. All D4A work sat
uncommitted: 36 modified files, 11 untracked new files (including `9.json`, `MediaThumbnailSource.kt`,
`TransferIndicatorPolicy.kt`, `ReviewGridPolicy.kt`, `ReviewGridScreen.kt`, `ReviewPreview.kt`,
`ReviewBulkRouteDialogs.kt`, four test suites, and the device checklist), plus a fully rewritten
`cc-latest.md`. The version bump and the 8 -> 9 migration were already applied — exactly once each.

**What was recovered.** Everything. Nothing was reset, cleaned, restored, stashed, or rebuilt from the
base; the second session read every changed file, re-ran the full suite to establish that the recovered
state was genuinely green (1025 tests, 0 failures — matching what the first session had recorded), and
continued in place.

**What was still missing, and was completed afterwards.** Three gaps against the user's final
decisions:

1. **The duplicate pre-check was counts-only.** It did not show each duplicate's thumbnail and display
   name and offered no way to drop one or all of them. Now it lists every blocked item with its frame,
   its local name, and the "same media is already queued for the selected topic" sentence, with a
   per-item **Remove** and a **Remove all of these from the selection** for the duplicates. Removing
   re-reads the plan instead of patching it; removing the last item closes the confirmation. Nothing on
   that path writes.
2. **The profile chip filtered the grid only,** leaving the non-routable section unfiltered. Both halves
   now go through the same `underFilter` call.
3. **Two routing engines still existed.** Removing the per-card dropdown had left `resolveManualRoute`,
   `ManualRouteRequest`, and `ManualRouteResult` behind — a second engine whose duplicate refusal
   *wrote* (media marked `DUPLICATE`, review reason rewritten). All of it was removed, along with the
   dead `MainViewModel.resolveReviewItem` and four now-unreachable notices and their strings in both
   locales. The suites that pinned its guarantees were **ported onto the surviving path, not deleted**:
   `ManualReviewResolutionTest`, two `QueueCorrectionTest` cases, and the `D2B1PersistenceTest` /
   `D2B2APersistenceTest` instrumentation cases. One behaviour changed on purpose: a refused duplicate
   is no longer marked, because that was a partial write.

## New user-reported D3B2 hardware evidence (not observed by any agent)

Recorded exactly as reported, and nothing beyond it:

- D3B2 was installed and run on the user's Android device.
- The user tested through **step 3** of the D3B2 device checklist.
- The repair flow **works on hardware**: the previously blank 0:00 Telegram posts were converted into
  real, playable video **inside the same Telegram messages**.
- Repair progress **with percentages** was visible.
- **Two visible progress indicators appeared at the same time** during that operation.
- The user considers that duplicate-indicator issue **non-critical for now** and wants it folded into
  the next substantial milestone rather than shipped as a standalone build.
- The remaining D3B2 checks will be exercised **gradually during ongoing usage** rather than blocking
  forward progress.
- The user wants to move on to manual source profiles and bulk Review routing.

Nothing is recorded about the other D3B2 checklist steps — cancellation, batch pause, the exact
refusal reasons for the four rows that previously said only "cannot repair", or the fixed drawer Menu
position. **They remain user-unvalidated.** Do not infer them from "the repair worked".

This also retires the old D3B1.5 hypothesis: the four generic refusals were never diagnosed, because
the user has not yet re-run that step. Do not record a root cause.

### Root cause of the duplicate indicators (found by reading code, not by observing)

`UploadJobCard` drew `MediaTransferIndicator` for any live transfer owned by its row, and
`RepairRowSection` — rendered *inside that same card* — drew `MediaTransferIndicator` again for the
`InFlight` repair state. One repair, two bars advancing in lockstep. The Queue had the identical
shape: `BatchStatusCard` drew the current batch item and the row that item belonged to drew it again.

## The user's decisions (final; do not reopen)

Supplied **with** the task and treated as final:

1. Source profile assignment is **manual only** — the app must not auto-detect it.
2. Review surface is a **thumbnail grid**.
3. **Select all** applies only to the currently filtered view; **Clear selection** clears the full
   global selection set.
4. **Thumbnail tap toggles selection only.**
5. **Preview opens from a separate explicit control** on the card.
6. **Selection persists across filters**; a mixed selection from several profiles routes to one topic
   in one action.
7. Preview must be **in-app**, never an external Android viewer.
8. The duplicate progress bars are **not** a standalone hotfix — fold them into this milestone.

Answered through the **stop-and-ask gate** (work stopped before any file was edited):

9. **A duplicate inside a bulk commit** → **pre-check before Confirm**. Single-item routing already
   treats "these exact bytes are already reserved for that topic" as a *non-error*, which collides
   head-on with "abort the whole bulk commit". So after a topic is chosen the whole selection is
   checked against it, and **Confirm stays disabled** until nothing is already-queued or ineligible.
10. **Non-routable Review rows** → their own **section below the grid**, keeping their existing
    per-item action. (Dropping them would make rescan/reauthorize unreachable.)
11. **Unprofiled folders** → a **fifth "Not set yet" chip**, items also under All, plus a banner.
12. **The per-card destination dropdown** → **removed**. One routing path, one confirmation, one
    commit.

## Manual source profiles

`SourceProfile` = `UNSPECIFIED | INSTAGRAM | TIKTOK | DOWNLOADS_X` on `SourceDirectory`, written only
by `DirectoryRepository.setSourceProfile`, reachable only from the folder chooser the user taps.

**There is no detection path of any kind** — no display-name matching, no tree-URI inspection, no MIME
or filename heuristic. `D4ASurfaceTest` asserts no `detectProfile`/`inferProfile`/`guessProfile`
identifier exists in production source. The reasoning is worth keeping: with three folders the user
already knows which is which, and a heuristic that got one wrong would silently attach a meaning they
never expressed to everything that folder ever produced.

`UNSPECIFIED` is migrated-into but **never offered**: `SELECTABLE_SOURCE_PROFILES` in `Screens.kt`
lists only the three, and the surface test checks that. The UI names it *Not set yet*, gives it its
own Review chip, and shows a banner pointing at Folders.

The profile is **organizational only** — it routes nothing, maps to no account, suggests no topic, and
nothing in the scan/queue/dispatch/batch/repair paths reads it.

## Schema decision: 8 -> 9, one additive column

```sql
ALTER TABLE source_directories ADD COLUMN sourceProfile TEXT NOT NULL DEFAULT 'UNSPECIFIED'
```

That is the entire migration. A machine diff of `8.json` vs `9.json`: 14 tables in both, one added
column in `source_directories`, zero removed columns anywhere. No table carrying Telegram evidence,
reservations, or repair history is touched. Destructive fallback stays forbidden.
`migration8To9AddsOneUnspecifiedProfileColumnAndPreservesEveryRecord` asserts every earlier record
survives and that a migrated folder reads `UNSPECIFIED` rather than a guessed name.

## Review grid, selection, and partitioning

`domain/review/ReviewGridPolicy.kt` holds it all as **pure functions** over opaque job IDs (no Room,
no Compose, no Android), which is what makes every rule directly testable. `ReviewRow` **moved** from
`ui/MainViewModel.kt` into this file.

| Action | Scope |
| --- | --- |
| Thumbnail tap | one item; selects/deselects only — never opens, never routes |
| **Select all shown** | the active chip's visible **routable** items, **additive** |
| **Clear selection** | the **entire** global set, including chip-hidden items |
| Changing a chip | nothing — selection is global by design |

The asymmetry is deliberate and is the safe direction: nothing can be stranded selected-but-unreachable.
Non-routable items are never added by Select all, because no destination could accept them.

`MainViewModel` prunes the selection against live Review data on every emission (`ReviewSelection
.retainExisting`), so a routed/retired/rescanned item cannot leave its ID behind and inflate the count;
the same pass closes a preview whose item has left Review.

`ReviewGridPartition` splits on `ReviewAction`: only `ASSIGN_DESTINATION` becomes a grid card;
rescan / reauthorize / result-unknown keep their card and single action below the grid. The active chip
runs `underFilter` over **both** halves — filtering only the grid would hide a folder's routable items
while still showing its stuck ones, which says two things about one folder at once.

## Bulk routing: judged first, then written, or not written at all

`ReviewResolutionRepository` now exposes exactly `observeReviewItems`, `previewBulkRoute` (read-only
plan) and `resolveBulkRoute` (atomic commit). **This broke `D2B1SurfaceTest`'s exact `declaredMethods`
set assertion** — expected, updated.

**The single-item engine is gone, not merely unreachable.** `resolveManualRoute`, `ManualRouteRequest`,
`ManualRouteResult`, `recordAlreadyReserved`, `MainViewModel.resolveReviewItem`, four `UiNotice` values,
and four strings per locale were removed. Keeping the transaction would have kept a second confirmation
semantics: its duplicate refusal **wrote** (media -> `DUPLICATE`, review reason rewritten), which is the
partial write the all-or-nothing decision forbids. Its suites were ported onto `resolveBulkRoute`
(`ManualReviewResolutionTest`, two `QueueCorrectionTest` cases, `D2B1PersistenceTest`,
`D2B2APersistenceTest`), with the result mapping: `Queued` -> `Routed`, `AlreadyQueued` ->
`Aborted(1, 0)`, `HashUnavailable`/`NotResolvable`/`JobNotFound` -> `Aborted(0, 1)`,
`DestinationNotReady` and `Failed` unchanged in meaning.

The ordering is the safety property: `resolveBulkRouteLocked` judges the **whole** selection first,
against the same snapshot the writes happen in, and starts writing only once every item comes back
routable. So the ordinary abort case **never writes at all** rather than writing and rolling back. The
`ReservationFailedException` rollback remains for the one thing judging cannot rule out — a write that
fails against a constraint anyway.

Two non-obvious guarantees:

- **Batch-local hash set.** Two selected items with byte-identical content would *both* pass a
  per-item check (neither reservation exists yet) and the second write would collide mid-transaction.
  The second is reported already-queued **before** any write — the same answer the user would get if
  the first had been routed a moment earlier. Covered by
  `two selected items with identical bytes cannot both be routed to one topic`.
- **The write loop re-reads** every row it writes rather than trusting the judging pass, so a row that
  changed between the two loops aborts instead of being written from a stale read.

`BulkRoutePlan.isCommittable` = destination ready **and** ≥1 routable **and** zero already-queued
**and** zero ineligible. That single predicate *is* decision 9.

**The pre-check is a list, not a number.** `BulkRouteConfirmDialog` resolves each blocked job ID against
the live Review rows and draws its frame and its local display name, with the "same media is already
queued for the selected topic" sentence, a per-item **Remove**, and **Remove all of these from the
selection** for the duplicates. `removeFromBulkSelection` / `removeDuplicatesFromBulkSelection` mutate
the selection and then **re-read** the plan (`recheckBulkRoute`) rather than patching the one on screen
— a patched plan answers a question about a selection that no longer exists. Removing the last item
clears the plan and reports `REVIEW_BULK_NOTHING_SELECTED`. Neither removal writes anything.

Routing prepares only: `QUEUED` + `RoutingMethod.MANUAL`, no file read for sending, moved, renamed, or
deleted, no Telegram call, no upload start.

## In-app preview and thumbnails — no new dependency

**Nothing player-shaped is in the offline Gradle cache** (no media3, no ExoPlayer, no Coil/Glide), and
the build is `--offline`. So both use platform APIs, which is also the better answer:

- Preview: `android.widget.VideoView` in an `AndroidView`, with custom Compose play/pause + `Slider`
  seek and a 250 ms position poll (the platform player has no position callback).
- Thumbnails: `MediaMetadataRetriever.getFrameAtTime(0, OPTION_CLOSEST_SYNC)` on `Dispatchers.IO` into
  a bounded in-memory `LruCache`; **never** written to disk. Every failure returns null → placeholder.
  Catches `Throwable` deliberately (`setDataSource` throws RuntimeException families; a big frame can
  throw `OutOfMemoryError`).

**The preview is an overlay in the Review window, not a `Dialog` and not a second activity.** Two
reasons, both load-bearing:

- `FLAG_SECURE` is a **window** flag. A dialog window would **not** inherit the activity's, silently
  dropping the protection. `VideoView` additionally calls `setSecure(true)` because the activity flag
  does not cover a `SurfaceView`'s own buffer either.
- The Review composition underneath is never torn down, so selection, chip, and scroll position are
  exactly preserved.

No `ACTION_VIEW`, `ACTION_SEND`, `createChooser`, `FileProvider`, `grantUriPermission`, or
`startActivity` anywhere in production source — the surface test asserts each absence.

`MediaThumbnailSource` is injected into **`MainActivity`**, not the ViewModel, so `MainViewModel` keeps
its JVM-testable surface free of `ImageBitmap`.

## Duplicate progress indicator fix

`domain/execution/TransferIndicatorPolicy` maps each `ActiveMediaOperationKind` to exactly one
`TransferIndicatorSlot`:

| Kind | Slot | Why |
| --- | --- | --- |
| `REPAIR` | `REPAIR_SECTION` | It already carries the repair status line and **Cancel now** |
| `BATCH_ITEM` | `BATCH_CARD` if visible, else `ROW` | The card already names "n of m"; falling to NONE would hide a live transfer |
| `SINGLE_UPLOAD` | `ROW` | The row the user tapped **Upload now** on |

All three call sites in `Screens.kt` ask `drawsIn(...)` first; `UploadJobCard` gained a
`batchCardVisible` parameter supplied by `QueueScreen` as `batchStatus != null`.
`TransferIndicatorPolicyTest` asserts that for **every** kind, under **both** batch-card conditions,
**exactly one** surface draws. D3B2's staging, percentages, and **Waiting for Telegram confirmation**
are untouched.

## Tests and exact results

```
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline testDebugUnitTest      # 1031 tests / 81 classes, 0 failures
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline lint                   # 0 issues
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline assembleDebug          # success
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline assembleDebugAndroidTest  # success (compiled only)
git diff --check                                                          # clean
```

(The recovered pre-interruption state measured 1025 / 0 on the same command; the three completed gaps
added six tests.)

New: `ReviewGridPolicyTest`, `TransferIndicatorPolicyTest`, `BulkReviewRoutingTest`,
`D4ASurfaceTest`. Extended: `MainViewModelTest` (selection / filters / preview / bulk routing /
duplicate removal), `LocalizationResourcesTest` (plural key parity + `other` fallback),
`AppDatabaseMigrationTest` (8→9). Ported, not deleted: `ManualReviewResolutionTest`, two
`QueueCorrectionTest` cases, `D2B1PersistenceTest`, `D2B2APersistenceTest`.

**One lint issue appeared and was fixed:** `ModifierParameter` on the shared `ReviewThumbnail`, whose
`modifier` defaulted to `Modifier.fillMaxWidth()`. It now defaults to `Modifier` and the grid passes the
width at the call site. Lint is back to 0.

**Four earlier surface tests pinned facts this milestone deliberately moved** and were updated with a
comment naming what moved them: `D2B1SurfaceTest` (port member set), `D3ASurfaceTest` (schema 8→9),
`D3B15SurfaceTest` (version literal; `MIGRATION_7_8` is no longer the *last* entry in `ALL`, so the
assertion now checks membership not position), `D3B2SurfaceTest` (version, schema, and `sourceProfile`
dropped from its forbidden-marker list — it was future work then, not unsafe).

**One flaky test to know about:** `TelegramMediaRepairGatewayTest > a D3B2 cancellation ends the live
edit and can never produce a duplicate post` failed once under full-suite load and passed in isolation
and on every subsequent full run. It uses `SocketPolicy.NO_RESPONSE` with an 8 MB body, so it is
timing-sensitive. Nothing in the transport layer was touched this milestone.

## APK identity (debug development signing only)

| Field | Value |
| --- | --- |
| Package | `com.funzi7.telegramtopicuploader` |
| Version | code 19, name `0.7.0-d4a` |
| minSdk / targetSdk / compileSdk | 23 / 37 / 37 |
| Permissions | `INTERNET`, `ACCESS_NETWORK_STATE`, `RUN_USER_INITIATED_JOBS`, `POST_NOTIFICATIONS` — **unchanged** |
| Components | 1 exported launcher activity, 1 non-exported `BatchUploadJobService` (`BIND_JOB_SERVICE`) — **unchanged** |
| Path | `app/build/outputs/apk/debug/app-debug.apk` |
| Size | 15,443,253 bytes |
| SHA-256 | `eab5fef68bd128ac15b843a3ccbdd9e3d51a3e9f73984c4845e8a75020016637` |
| Signer | `CN=Android Debug, O=Android, C=US`, RSA 2048, cert SHA-256 `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4` |
| Schemes | v1 JAR ✓, v2 ✓ (v3/v3.1/v4 not used) |

Signer unchanged, so it installs **over** D3B2 without an uninstall.

## Agent-observed vs user-reported

**Agent-observed:** every test result, lint result, both assemblies, the schema diff, the APK identity
above, the duplicate-indicator root cause (read from source), and the recovered repository state
described at the top of this file.

**User-reported only:** everything in the hardware-evidence section. No agent saw the device, the
Telegram posts, the repair, or the two progress bars.

## Device-untested boundaries

Nothing in D4A ran on a device or emulator. Specifically unverified on hardware: the grid's appearance
and column count on a real phone, thumbnail decoding across real codecs, `VideoView` playback and
seeking against real SAF documents, the 8→9 migration on a real installed database, whether exactly one
progress indicator now appears during a real repair, and the duplicate pre-check's blocked-item list and
its Remove controls against a real duplicate. The ported instrumentation suites **compile but were not
run** — no device was attached — so their new expectations are unverified on hardware.

## Next device action (ask for exactly this)

`docs/D4A_DEVICE_CHECKLIST.md`: install over D3B2 without uninstalling; set all three folder profiles
by hand; confirm the grid shows thumbnail / size / length / profile; tap thumbnails to select;
preview one item in-app and return with the selection intact; switch chips and confirm the selection
survives; select-all on one chip; clear-all; route a mixed selection to one topic; confirm they all
leave Review for the Queue with no upload started and no new Telegram post; confirm a repair or upload
shows **exactly one** progress indicator. Step **12a** is optional and only reachable if the
confirmation actually reports a blocked item — the checklist explains how to bring that about with two
byte-identical test copies.

Do **not** ask for a retest of token setup, background scheduling, multi-topic binding, source-missing
reconciliation, queue retirement, or old History card formatting.

## Roadmap after D4A

1. **Optional content-based topic suggestions** — from available caption/link metadata, sampled
   frames, OCR, and speech evidence. Offered as a *suggestion* on Review, never as automatic routing.
2. **Only after that is proved on hardware:** high-confidence automatic routing, strictly opt-in, with
   uncertain items still landing in Review.
3. **Explicitly not on the roadmap: per-account mapping.** The user has ruled it out.
4. Still open from before: result-unknown reconciliation that never re-sends without evidence
   (including a *manual* repair-retry design); evidence-based resolution of an unowned/ambiguous
   legacy reservation (D3A.1); safe deletion gated on a confirmed positive message ID.

## Process rules the user set

- **Do not ship a single-hotfix build on its own**; fold it into the next substantive milestone. (The
  user did not install the standalone D3B1.4.2 APK, and explicitly asked for the duplicate-indicator
  fix to be folded into D4A rather than shipped alone.)
- **Mandatory stop-and-ask UX gate**: never silently choose among materially different user-facing
  behaviours. Inspect the implementation *first*, then ask one grouped question with numbered options,
  short practical consequences, and **no preselected default**, and stop until answered. D4A raised
  four; all four were answered before any file was edited.
- Do not introduce another binding command alias or syntax without asking first.

## Env notes (still current)

- `GRADLE_USER_HOME=/root/.gradle ./gradlew --offline …`; `aapt2` at
  `/opt/android-sdk/aapt2-wrapper/aapt2`.
- **Correction to an earlier note:** `apksigner` **is** present, at
  `/opt/android-sdk/build-tools/36.0.0/apksigner`. A bare `find /` for it times out — look in
  `/opt/android-sdk/build-tools/*/` directly. `apksigner verify --print-certs -v` gives the DN, the
  cert SHA-256, the key algorithm/size, and which signature schemes verified, in one call.
- **`dexdump` crashes (Illegal instruction)** — use `strings` over extracted `classes*.dex`.
- Merged manifest at
  `app/build/intermediates/merged_manifest/debug/processDebugMainManifest/AndroidManifest.xml` (also a
  plural `merged_manifests/debug/processDebugManifest/` path).
- **The offline Gradle cache has no media3, ExoPlayer, Coil, Glide, or Picasso.** Anything media-shaped
  must use platform APIs (`VideoView`, `MediaMetadataRetriever`, `MediaPlayer`).
- **A source-shape guard must strip comments** (`codeOf()`), or documenting why a mechanism was
  rejected fails the guard that rejects it. Equally: do not weaken a guard by rewording prose.
- A blanket `.delete()` ban over `src/main/java` hits `AndroidKeystoreSecretStore`'s own atomic file.
  Exclude that one file by name rather than dropping the guard.
- `UploadJobDao.recordDispatchRetryable` enforces `:nextAttemptAt > :now`, so "retry immediately" needs
  its own statement (`recordDispatchCancelled`).
- Adding a default parameter to an `interface` method adds a synthetic `name$default` to
  `declaredMethods`, breaking exact-set reflection assertions in surface tests.
- Adding a `TelegramFailureCode` value breaks three exhaustive `when`s: `UploadFailureClassifier`,
  `TelegramSetupService.toConnectionStatus`, `TelegramSetupUiPolicy.testFailureLabel` (+ its test).
- **The version literal is pinned in two surface tests**, `D3B15SurfaceTest` *and* `D3B2SurfaceTest`
  (now also `D4ASurfaceTest`). Every bump must update all of them.
- Lint's `UnusedResources` **will** fail the 0-issue bar when a UI rewrite orphans strings — delete
  them from **both** locales (`LocalizationResourcesTest` compares key sets exactly).
- **An apostrophe in an English string resource must be escaped** (`\\'`) or `mergeDebugResources`
  fails with "Invalid unicode escape sequence". Beware Python heredocs eating the backslash.
- **`%1$d` followed by a word trips lint's `PluralsCandidate`.** Use `<plurals>`. For Hebrew use
  `one`/`two`/`other` only — `many` trips `UnusedQuantity` because current CLDR retired it.
  `LocalizationResourcesTest` now checks plural key parity and the `other` fallback separately.
- `CompositionLocalProvider` is in `androidx.compose.runtime`, **not** `androidx.compose.ui`.
- Lint's `UseKtx` wants `String.toUri()` (`androidx.core.net.toUri`) over `Uri.parse(…)`.
- To mix full-width headers with grid cells in one `LazyVerticalGrid`, use
  `item(span = { GridItemSpan(maxLineSpan) })`.
- No Robolectric/mockito: prove UI rules by extracting them into pure objects (`ReviewSelection`,
  `ReviewGridPartition`, `TransferIndicatorPolicy`, `MediaSummaryFormat`, `RepairRowPresentation`,
  `BindCommand`, `RepairEligibilityPolicy`, `TopBarLeadingCluster`, `DashboardDrillDown`) plus
  source-shape assertions, and Room behaviour in compiled-only androidTest.
- Early `return` from a `@Composable` is legal but avoid it; guard with `if (state !is …)` instead.
- Kotlin property initializers run in declaration order: a `StateFlow` whose `onEach` touches a
  `MutableStateFlow` must be declared **after** it.

## Deployment declaration

Nothing was deployed, installed, or run on a device or emulator in the D4A session. **No real Telegram
request of any kind was made** — no `editMessageMedia`, no `sendVideo`, no `getUpdates`, no send. No
forum topic was created, renamed, closed, or deleted; no binding was written against a real group; and
no media was uploaded, moved, renamed, copied, downloaded, quarantined, or deleted. No media file was
opened for writing on any path; preview and thumbnail decoding open documents **read-only**.
