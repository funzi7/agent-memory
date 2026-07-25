# Telegram Topic Uploader — latest handoff

## Task and repository state

| Field | Value |
| --- | --- |
| Task | D5A — real folder names and an editable local alias, a folder-media page, image discovery and upload, several selected items sent separately or as one Telegram album, a reversible Ignored state, permanent deletion of a source that was never uploaded, pull-to-refresh where it has a truthful meaning, and destination selectors ordered by confirmed use |
| Application repository | `/root/work/telegram-topic-uploader` |
| Branch | `main` |
| Tracking branch | `origin/main` |
| Starting application HEAD | `0821b29` (D4C) |
| Version | code 21 -> 22, name `0.9.0-d4c` -> `0.10.0-d5a` |
| Room schema | **10 -> 11**, one additive `MIGRATION_10_11`, `11.json` exported and committed |
| Deployment | None. Not installed or run on any device or emulator in this session |

No production token, Telegram identifier, bot username/ID, chat ID, thread ID, group title, forum
topic name, private link, binding command, nonce, file name, content URI, document ID, path, folder
name, destination name, or media hash was requested, used, or recorded anywhere, including this file.

## The four things the UX gate actually resolved

The task supplied its own decisions for folder naming, the reversibility of Ignored, the tombstone,
the existence of both send modes, and the meaning of popularity. It also predicted, correctly, that
**the album would be the thing with real ambiguity**. All four unresolved questions were about albums,
and work stopped before any file was edited until they were answered:

1. **Send now only, or also queued?** -> **Both.** That single answer is why `upload_albums` and
   `upload_album_items` exist at all: an album prepared now and sent next week has to survive the app
   closing, and so does the order it was selected in.
2. **Mixed images and videos?** -> **Send everything, split automatically after one confirmation.**
   Photos and videos share one group (the documentation permits it); every document fallback becomes
   its own post in the same action, named in the confirmation.
3. **More than ten?** -> **Explicit split the user confirms**, stated in numbers.
4. **A failed or half-confirmed album?** -> **No retry at all.**

One decision was **stated as an assumption rather than asked**, because the task's own wording
dictated it: a GIF, an oversized image, and an image breaking the documented dimension or ratio limits
all travel as `sendDocument` — the task's own "truthful fallback when the image cannot be sent safely
as a photo".

## Official Bot API facts, read this session (not from memory)

- `sendMediaGroup`: *"must include 2-10 items"*; *"Documents and audio files can be only grouped in an
  album with messages of the same type"*; returns an **Array of Message**.
- `sendPhoto`: *"at most 10 MB… width and height must not exceed 10000 in total… ratio at most 20"*.
- `InputMediaPhoto.media` takes `attach://<file_attach_name>`; each entry has its own `caption`.
- `Message.photo` is an **Array of PhotoSize** — that array being non-empty is the photo confirmation.

**How to read the docs here:** the whole page is ~840 KB and `WebFetch` truncates it long before
`sendPhoto`. `curl -sS https://core.telegram.org/bots/api -o botapi.html` works from this environment,
and a small Python script that finds `name="sendmediagroup"` and strips tags gets the exact table.

## The pieces worth re-reading

### `SourceDirectoryNaming` — the whole folder-name feature

Pure, three strings in, one label out. **It has no overload taking a URI, a document ID, or a path**,
and `D5ASurfaceTest` asserts those identifiers do not appear in the file at all — that signature *is*
the privacy guarantee. Alias first, provider name second, generated ordinal only when the provider
genuinely supplies nothing (and the card says so in words).

Watch out: U+0085/U+2028/U+2029 are compared **by code point** (`character.code in
UNICODE_LINE_SEPARATORS`) rather than as character literals. Two of them are line terminators, and a
source file containing them literally is read by the compiler as a broken line.

### Manual deletion is a **separate table**, and that was the important call

`source_deletion_tasks.originUploadJobId` is `NOT NULL` — that column is what makes "nothing is deleted
without a confirmed upload" a database fact. Widening it to nullable for D5A would have converted that
into a rule someone has to remember. So `manual_source_deletions` is its own table with its own
states, and what the two share is the part that matters: the same `DocumentDeleter`, the same
tree-plus-document-ID addressing, and the same re-proof.

`ManualSourceDeletionCoordinator` has **no gateway, no token service, no upload launcher, no queue** in
its constructor. "A deletion retry never uploads" is a fact about the type.

One deliberate difference from D4B, stated rather than hidden: a media row that never obtained a
canonical digest is deletable on identity, size and modification time. Refusing would leave a file the
user explicitly asked to remove permanently undeletable because an old scan could not read it.

### The album gateway is the upload gateway's **twin**, not its cousin

It shares `StreamingDocumentBody` and `CompletionTrackingRequestBody`. Two implementations of "did the
body finish" is exactly how an application posts the same album twice. Success is absolute: every item
back, in order, positive ID, right chat and thread, right media shape. Anything less is
`IncompleteResponse` -> every member recorded result-unknown -> nothing confirmed, nothing deleted,
nothing resent.

No-retry is enforced **durably**, not by omission: `markDispatchStarted` matches only
`state = 'PREPARED'`, so a settled album cannot dispatch again even if a future caller tried.

### Ignored is a marker plus one filter, and that is the entire design

`media_items.ignoredAt` + the digest it was decided against. Review excludes ignored rows in **one**
place — the projection — and because every Review consumer reads that one flow, the item is
simultaneously gone from the grid, from **Select all**, from the pruned global selection, and from
routing and upload, with no rule of its own anywhere. That is also why the undo is one cleared field.
`RETIRED` was deliberately not overloaded: it is terminal and cannot restore.

The stored digest is what makes "a rescan must not hand back the same media" work without also
applying an old decision to bytes the user has never seen.

### The folder page derives, never stores

`RoomFolderMediaRepository` folds a `(media, job)` join into one card per media item and computes seven
states from evidence already written. Nothing is stored to make a card appear under a heading — a page
keeping its own copy of "this is confirmed" is the D3B1.4 Dashboard-count defect waiting to recur.

### Destination order is derived, and the predicate does the exclusions for free

One aggregate over `upload_jobs` with `telegramMessageId > 0 AND telegramConfirmedAt IS NOT NULL`. A
connection test creates no job; a repair creates none; failed, cancelled, retryable, queued and
result-unknown rows have no such pair. Nothing had to be excluded by name. Applied in exactly **one**
place, so every selector shares one order, and identity is the destination ID so a rename keeps the
history.

## Schema decision: 10 -> 11, additive

Six columns (`providerDisplayName`, `localAlias`, `mediaKind`, `ignoredAt`, `ignoredSha256`, plus two
indexes) and three tables (`manual_source_deletions`, `upload_albums`, `upload_album_items`).

Not one `UPDATE` touches a user value, no table is rebuilt, destructive fallback stays forbidden, and
the new tables start empty — so the upgrade deletes nothing, routes nothing, ignores nothing, and
makes no source file deletable.

`mediaKind` backfills to `'VIDEO'`, and that is **proved rather than assumed**: `persistDiscovery` is
the only code that has ever inserted a `media_items` row, and until D5A it ran only for documents
`VideoTypeAllowlist` had already accepted.

## Tests and exact results

```
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline testDebugUnitTest      # 1358 tests / 95 classes, 0 failures
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline lint                   # No issues found
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline assembleDebug          # success
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline assembleDebugAndroidTest  # success (compiled only)
git diff --check                                                          # clean
```

New: `SourceDirectoryNamingTest`, `ImageUploadPolicyTest`, `AlbumPlanPolicyTest`,
`DestinationOrderPolicyTest`, `ManualDeletionGateTest`, `ManualSourceDeletionCoordinatorTest`,
`MediaDecisionTest`, `TelegramAlbumGatewayTest`, `D5ASurfaceTest`.

**Re-scoped, not deleted**, because the subject genuinely moved — the pattern this project has used
since D4C:

- `SafMediaScannerTest`'s "a JPEG is not media" fixture: a JPEG *is* media now, so keeping it would
  assert the opposite of what shipped.
- `UploadTransferPolicyTest`'s "`image/jpeg` resolves to nothing": it resolves, as an image, never as
  an inline-video candidate — and the rule the test exists for is asserted beside it.
- `D3ASurfaceTest`'s ban on the literal `sendPhoto`: banning the word would forbid the feature.
  `sendMediaGroup` stays banned from the single-upload sources instead.
- `D2B2BSurfaceTest`'s single `attemptCount` increment: narrowed **by table**, not relaxed.
- `D4ASurfaceTest`'s indicator-slot and routing-call-site counts: both moved because a surface and a
  caller were *added*, and both still assert the one-policy / one-engine property.

**Known flake, pre-existing:** `TelegramMediaRepairGatewayTest > a body that did not finish is
incomplete, so a retry is safe` still fails occasionally and passes on rerun. Same MockWebServer
`DISCONNECT_DURING_REQUEST_BODY` timing test recorded in the D4C handoff. **Do not copy that fixture
into a new test** — D5A tried, and the album version was flaky too; the deterministic replacement is a
cancellation that is already requested before the first chunk is written.

## APK identity (debug development signing only)

| Field | Value |
| --- | --- |
| Package | `com.funzi7.telegramtopicuploader` |
| Version | code 22, name `0.10.0-d5a` |
| minSdk / targetSdk / compileSdk | 23 / 37 / 37 |
| Permissions | `INTERNET`, `ACCESS_NETWORK_STATE`, `RUN_USER_INITIATED_JOBS`, `POST_NOTIFICATIONS` — **unchanged** |
| Application components | 1 exported launcher activity, 1 non-exported `BatchUploadJobService` — **unchanged** |
| Path | `app/build/outputs/apk/debug/app-debug.apk` |
| Size | 15,182,740 bytes |
| SHA-256 | `4b354ecac2e5c936c9932c495d7154a5ba1b8d9809435ea1ba78d83fba6ec638` |
| Signer | `CN=Android Debug, O=Android, C=US`, RSA 2048, cert SHA-256 `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4` |
| Schemes | v1 JAR yes, v2 yes (v3/v3.1/v4 not used) |

Signer unchanged, so it installs **over** D4C without an uninstall. Schema moves 10 -> 11, so one
additive migration runs on the existing database.

## Agent-observed vs user-reported

**Agent-observed:** every test result, the lint result, both assemblies, the merged manifest, the APK
identity, the schema export, and the official Bot API text quoted above.

**User-reported only:** the D5A requirements themselves — the generic folder name, wanting an alias,
wanting a folder page, wanting images, wanting a reversible "do not upload", wanting deletion without
upload, wanting pull-to-refresh, and wanting most-used topics first.

## Device-untested boundaries

Nothing in D5A ran on a device or emulator. Unverified on hardware: real folder names; that an alias
renames nothing; the folder page; an image arriving as a photo with its original name and 9GAG
caption; a GIF arriving animated; an album arriving as one grouped post in the selected order;
**Do not upload** and **Return to Review** across a rescan; a permanent deletion removing the exact
file and leaving a same-named sibling; each pull-to-refresh doing only what it claims; and topic order
matching real usage. Instrumentation suites compile but were not run; no device was attached.

On API 23 the EXIF orientation tag is not read, so a rotated photo shows as its pixels are stored.
Cosmetic, stated, and not papered over with a dependency the offline cache does not have.

**D4C was never validated on hardware either**, and `docs/D4C_DEVICE_CHECKLIST.md` now says so at the
top. Everything unvalidated after D4B and D4C stays unvalidated.

## Next device action (ask for exactly this)

`docs/D5A_DEVICE_CHECKLIST.md`. **Steps 9, 12 and 15 are the gate: do not run a large batch until an
image upload, a permanent deletion, and an album have each been confirmed once on disposable media.**
Do not ask for token setup, multi-topic binding, Dashboard counts, old repair checks, or a full
historical regression run.

## Roadmap after D5A

1. Whatever the device reports about images, albums, the permanent deletion, and the folder page.
2. Still owed from D4B/D4C: real-world evidence about deletion retries, batch deletion, blocked
   deletion states, the 9GAG caption on a real upload, the launch scan, and the Hebrew Preview.
3. Optional content-based topic *suggestions* on Review (never automatic routing).
4. Only after that is proved on hardware: high-confidence automatic routing, strictly opt-in, with
   uncertain items still landing in Review.
5. **Explicitly not on the roadmap: per-account mapping.** The user has ruled it out.
6. Still open from before: result-unknown reconciliation that never re-sends without evidence
   (including a *manual* repair-retry design), and evidence-based resolution of an unowned or
   ambiguous legacy reservation (D3A.1).

## Process rules the user set

- **Do not ship a single-hotfix build on its own**; fold it into the next substantive milestone.
- **Mandatory stop-and-ask UX gate**: inspect the implementation *first*, then ask one grouped
  question with numbered options, short practical consequences, and **no preselected default**, and
  stop until answered. D4B raised two, D4C three, D5A four. All were answered before any file was
  edited.
- Do not introduce another binding command alias or syntax without asking first.
- **Every requested item must appear in `TODO.md` with an explicit status.** D5A's section marks each
  one completed, deliberately deferred, or device-untested; nothing is dropped silently.

## Env notes (still current)

- `GRADLE_USER_HOME=/root/.gradle ./gradlew --offline …`; `aapt2` at
  `/opt/android-sdk/aapt2-wrapper/aapt2`.
- `apksigner` at `/opt/android-sdk/build-tools/36.0.0/apksigner`; `verify --print-certs -v` gives DN,
  cert SHA-256, key algorithm/size, and which schemes verified, in one call.
- **`lint` takes ~3 minutes.** Run it in the background and do other work meanwhile. The SARIF report
  is the easiest thing to parse (`results` array empty == clean); the plain-text report says
  "No issues found."
- **`dexdump` crashes (Illegal instruction)** — use `strings` over extracted `classes*.dex`.
- **The offline Gradle cache has no media3, ExoPlayer, Coil, Glide, Picasso, DataStore — and no
  `androidx.exifinterface`.** D5A wanted the last one for image orientation and could not have it, so
  it uses the platform `android.media.ExifInterface` behind a `Build.VERSION.SDK_INT >= N` guard with
  a documented `@file:Suppress("ExifInterface")`. **A method-level `@SuppressLint` does not silence
  the import line** — the suppression has to be at file level.
- **Lint's `UnusedResources` will fail the 0-issue bar** for any string added but never referenced.
  D5A added six and had to remove five and *use* the sixth. Delete from **both** locales;
  `LocalizationResourcesTest` compares key sets exactly.
- **`%1$d` followed by a word trips `PluralsCandidate`.** Use `<plurals>`; Hebrew uses
  `one`/`two`/`other` only.
- **The `Edit`/`Write` tools write literal characters where Kotlin needs `\uXXXX` escapes.** This bites
  every time a file mentions U+0085/U+2028/U+2029 or a form feed. Patch those lines with a small
  Python script written to the scratchpad — and note that a `heredoc` containing those characters is
  itself rejected by the Bash tool, so the script has to be written with `Write` first.
- Room's SQL parser rejects a correlated subquery in a projection; split it and compose in Kotlin.
  It also cannot express "the latest job per media", which is why the folder page joins flat and folds
  in Kotlin.
- **A source-shape guard must strip comments** (`codeOf()`), and several guards do **not**. A KDoc
  containing a banned literal fails the build.
- **The version literal is now pinned in SIX surface tests**: `D3B15`, `D3B2`, `D4A`, `D4B`, `D4C`,
  `D5A`. Every bump must update all of them. The **schema** literal is pinned in `D3A`, `D3B2`, `D4A`,
  `D4B`, `D4C` and `D5A`.
- No Robolectric/mockito: prove UI rules by extracting them into pure objects and asserting shapes.
- Kotlin property initializers run in declaration order: a `StateFlow` whose `combine`/`flatMapLatest`
  touches another property must be declared **after** it.
- In `runTest`, a `stateIn(WhileSubscribed)` flow has no value until something collects it **and**
  `advanceUntilIdle()` has run — and `advanceUntilIdle()` also runs the ViewModel's own `init`
  reconciliation, so read a "before" counter *after* it, not before.

## Deployment declaration

Nothing was deployed, installed, or run on a device or emulator in the D5A session. **No real Telegram
request of any kind was made** — no `sendVideo`, no `sendPhoto`, no `sendDocument`, no
`sendMediaGroup`, no `editMessageMedia`, no `getUpdates`, no send. No forum topic was created,
renamed, closed, or deleted; no binding was written against a real group. **No media file was
uploaded, moved, renamed, copied, downloaded, quarantined, or deleted**, and no real document was
opened for writing on any path. No real file name was read, recorded, or used as a test fixture:
every name in the test suite is synthetic.
