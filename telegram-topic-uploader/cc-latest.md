# Telegram Topic Uploader — latest handoff

## Task and repository state

| Field | Value |
| --- | --- |
| Task | D4C — a fourth manually assigned source profile (9GAG), the original file name on every upload, the 9GAG file name as the Telegram caption, a visible Back control plus a left-to-right timeline and tap-to-toggle in Preview, thumbnails on Queue and History rows, one automatic scan per fresh app session, newest/oldest ordering in Review, and deletion wording that says *permanently* |
| Application repository | `/root/work/telegram-topic-uploader` |
| Branch | `main` |
| Tracking branch | `origin/main` |
| Starting application HEAD | `011f90f` (D4B) |
| Version | code 20 -> 21, name `0.8.0-d4b` -> `0.9.0-d4c` |
| Room schema | **10, unchanged.** Nothing durable was needed — see the schema section |
| Deployment | None. Not installed or run on any device or emulator in this session |

No production token, Telegram identifier, bot username/ID, chat ID, thread ID, group title, forum
topic name, private link, binding command, nonce, file name, content URI, document ID, path, folder
name, destination name, or media hash was requested, used, or recorded anywhere, including this file.

## New user-reported D4B hardware evidence (not observed by any agent)

Recorded exactly as reported, and nothing beyond it:

- D4B was installed on the Android device.
- The device flow broadly worked.
- A disposable uploaded source file disappeared after the Telegram upload was confirmed.
- The user looked for the file in the Android recycle bin and did not find it.
- Preview needs a visible Back control.
- The player timeline direction is wrong for the desired interaction in Hebrew and must be LTR.
- Tapping the video itself does not currently provide the desired play/pause toggle.
- Queue needs thumbnails in addition to the existing name and details.
- The user wants an automatic scan once per fresh app opening/session, but not on every brief return.
- The user wants a newest/oldest sort control, defaulting to newest first.
- The user added a fourth real source folder for 9GAG.
- 9GAG filenames may contain the title/description that should remain visible in Telegram.

**Agent-confirmed by code inspection, not by the device:** the app uses direct document deletion
through the provider, not Trash. The file was never in a bin, which is exactly why the user could not
find it there. **The wording was wrong; the mechanism was not.**

**Do not claim that retry deletion, batch deletion, blocked deletion states, the duplicate pre-check,
or any other D4B checklist path was validated on hardware.** They remain user-unvalidated.

## Decisions answered through the stop-and-ask UX gate

The task supplied its own final decisions (launch scan once per process, setting ON by default,
newest-first default, caption = filename minus final extension, LTR timeline inside RTL Preview, tap
toggles playback, deletion is permanent). Three things were genuinely unresolved, so work stopped
before any file was edited:

1. **What a repair does to a caption.** `editMessageMedia` replaces the caption *along with* the
   media, so the existing caption-free repair would have **deleted** the caption a 9GAG upload
   arrived with. -> **Resubmit the same computed caption.** Recomputed by the same pure policy from
   the same stored display name and profile, so it can only ever be the identical text or null.
   Rejected: leaving repair caption-free (silent loss); refusing repair for captioned items (a blank
   0:00 9GAG card could never be fixed).
2. **Where the automatic-scan toggle lives.** -> **Settings screen**, not Directories.
3. **Do History rows get thumbnails too?** Queue and History share one card. -> **Both.**

## The pieces worth re-reading

### `domain/upload/TelegramCaptionPolicy` — the whole caption feature

Pure, ~80 lines, one rule: profile must be `NINE_GAG`, strip **only** the final extension, trim the
ends, blank -> null, bound to 1 024 UTF-16 units without splitting a surrogate pair. `.hidden` and
`.mp4` are both *names* (leading dot is not a separator), `a.b.c.mp4` -> `a.b.c`, `"    .mp4"` ->
null. `D4CSurfaceTest` bans `split(`, `replace(`, `filterNot`, `isDigit`, `Regex(` **inside the policy
file** and bans generator/rewriter/translator/title-caser/model markers across all of production.

Sent with **no `parse_mode`** — that is a safety property, not a style choice: a name containing `*`,
`_`, `[` or `\` would otherwise be parsed as markup and mangled or rejected.

### The repair caption needed a JSON escaper

`editMessageMedia` takes the caption *inside* the `InputMediaVideo` JSON, which the repair gateway
hand-builds. So `appendJsonString` was added: the two mandatory escapes, five short forms, every
remaining C0 control, and U+2028/U+2029. Nothing is dropped — anything unwritable becomes `\uXXXX` —
so two captions cannot collapse into one. A guard asserts the value is **never interpolated**.

### `LaunchScanSession` is process-scoped, and that is the entire design

`ProcessLaunchScanSession` = one singleton `AtomicBoolean`, `compareAndSet(false, true)`. An
`onResume` hook would have scanned on every return from Telegram, every closed file picker, every
rotation. Only the process ending resets it, which is exactly what the user means by "opening the
app". A guard bans `onResume`, `DefaultLifecycleObserver`, and `ProcessLifecycleOwner` from
production. Coalescing is free: it calls the same `ScanLauncher.startScanForAllEnabled()` a manual
scan uses, and `ScanCoordinator` already refuses a second run per directory (`ALREADY_RUNNING`).

Called from `MainViewModel.init` **after** the reconciliation block, in its own `try/catch`, so a
failed launch scan gets its own sentence and never blocks the app opening. A guard proves the launch
path cannot reach `uploadLauncher`, `batchLauncher`, or `deletionLauncher`.

### One construction site for an upload request

`MediaUploadRequest` is built in exactly **one** place (`MediaUploadCoordinator.transfer`), and
`D4CSurfaceTest` counts `request = MediaUploadRequest(` == 1. That is what makes "every upload path
keeps the file's name and gets its caption" a single fact rather than three implementations. Preview
**Send now**, a Queue row, and a batch item are three callers of the same coordinator.

### Preview: three lambdas replaced three behaviours

- `exitPreview` — one policy, three call sites (visible Back, `BackHandler`, Close). Guard asserts
  `onClick = exitPreview` appears exactly twice and `BackHandler { exitPreview() }` once.
- `togglePlayback` — one decision, two surfaces (button + video tap), so the label can never
  contradict what a tap just did. No-op until `prepared`; after completion it is the same `start()`.
- Exactly **one** `LocalLayoutDirection provides LayoutDirection.Ltr` in the file (guard counts it),
  wrapping only the `Slider` + its two `SpaceBetween` time labels. Guard also bans
  `durationMs - positionMs`, `reversed()`, `1f - ` — reversing values would break a11y semantics.
- The tap handler is on the `Box` holding the `AndroidView` and nothing else; every control is a
  sibling further down the `Column`, so nothing bubbles. Guard counts `.clickable(` == 1.

### Ordering: honest provenance, not a creation date

`ReviewSourceTimestamp.resolve(sourceLastModifiedAt, discoveredAt)` returns a `ReviewTimestamp`
carrying an **enum provenance**. Preferred = `media_items.documentLastModifiedAt` (already persisted
from `COLUMN_LAST_MODIFIED`, already populated by every scan). Fallback = `discoveredAt`, and the
screen prints `review_sort_discovery_fallback` when any visible row uses it. There is **no** extracted
container creation time and none was added — `MediaMetadataRetriever.METADATA_KEY_DATE` was
deliberately not used, because a guessed date presented as a fact is worse than an honest fallback.
Guard bans `creationTime`, `createdDate`, `dateTaken`, `mediaCreatedAt` from production.

Tie-break is the opaque job ID, **ascending in both directions** (guard counts `thenBy { it.item
.jobId }` == 2): a bulk download stamps many files with the same millisecond and a grid that
reshuffles under a finger mid-selection is worse than any ordering choice.

Sort is applied to the routable grid **and** the attention cards — one screen, one order.

## Schema decision: 10, unchanged

Checked rather than assumed:

- ordering reads two columns that already existed and were already populated (`documentLastModifiedAt`,
  `discoveredAt`); projecting them through `ReviewItemRow`/`ReviewItem` is not a schema change;
- `source_directories.sourceProfile` is `TEXT` mapped by name, unknown -> `UNSPECIFIED`, so a new enum
  value is **data**;
- the one preference is a boolean in `SharedPreferences` — Room here holds *evidence*, and a toggle
  is not evidence;
- Queue/History thumbnails read `media_items.contentUri` through the existing join.

`version = 10`, no `MIGRATION_10_11`, no `11.json`, destructive fallback still forbidden. Guards pin
all of that.

## Tests and exact results

```
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline testDebugUnitTest      # 1199 tests / 86 classes, 0 failures
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline lint                   # No errors or warnings
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline assembleDebug          # success
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline assembleDebugAndroidTest  # success (compiled only)
git diff --check                                                          # clean
```

New: `TelegramCaptionPolicyTest`, `D4CSurfaceTest`. Extended: `UploadTransferPolicyTest`,
`ReviewGridPolicyTest`, `MainViewModelTest`, `TelegramMediaUploadGatewayTest`,
`TelegramMediaRepairGatewayTest`, `FakeScanDaos`.

**Re-scoped, not deleted**, because their subject genuinely moved:

- `D3B15SurfaceTest`'s `assertFalse(gateway.contains("\"caption\""))`. Keeping it would have forced
  the repair to *delete* captions. Replaced by: the class may write only the caller's value, only via
  `appendJsonString`, never interpolated; `parse_mode` and `supports_streaming` still banned.
- `D3B2SurfaceTest`'s "History shows no `contentUri`". The card needs one for the thumbnail, so it now
  proves the URI reaches the decoder and nothing else, is never in a `Text`, and appears exactly twice.
- `D4ASurfaceTest`'s exact profile-enum list: four values -> five, in order.

**One known flake, pre-existing:** `TelegramMediaRepairGatewayTest > a body that did not finish is
incomplete, so a retry is safe` failed once in this session and passed on rerun and on every other
run. It is a MockWebServer `DISCONNECT_DURING_REQUEST_BODY` timing test; the caption is null on that
path so the request bytes are byte-identical to D4B's. Not a D4C regression, but worth knowing before
someone chases it.

## APK identity (debug development signing only)

| Field | Value |
| --- | --- |
| Package | `com.funzi7.telegramtopicuploader` |
| Version | code 21, name `0.9.0-d4c` |
| minSdk / targetSdk / compileSdk | 23 / 37 / 37 |
| Permissions | `INTERNET`, `ACCESS_NETWORK_STATE`, `RUN_USER_INITIATED_JOBS`, `POST_NOTIFICATIONS` — **unchanged** |
| Application components | 1 exported launcher activity, 1 non-exported `BatchUploadJobService` — **unchanged** |
| Path | `app/build/outputs/apk/debug/app-debug.apk` |
| Size | 14,868,560 bytes |
| SHA-256 | `bc7ebeac23f0a9d8c2df6aaa6153b1e2742ad2471d99ae380c3d7e087cd40e31` |
| Signer | `CN=Android Debug, O=Android, C=US`, RSA 2048, cert SHA-256 `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4` |
| Schemes | v1 JAR ✓, v2 ✓ (v3/v3.1/v4 not used) |

Signer unchanged, so it installs **over** D4B without an uninstall. Schema unchanged, so no migration
runs on the existing database.

## Agent-observed vs user-reported

**Agent-observed:** every test result, the lint result, both assemblies, the merged manifest, the APK
identity above, and the code inspection confirming direct provider deletion rather than Trash.

**User-reported only:** everything in the hardware-evidence section. No agent saw the device, the
missing file, the recycle bin, or the Hebrew Preview.

## Device-untested boundaries

Nothing in D4C ran on a device or emulator. Specifically unverified on hardware: that a 9GAG upload
arrives with its original file name **and** its caption; that a presentation repair preserves that
caption; that the launch scan fires exactly once per real app opening and not on a resume; that
Preview's visible Back, LTR timeline, and tap-to-toggle behave as intended in a Hebrew RTL UI; and
that Queue and History thumbnails decode across the user's real codecs. Instrumentation suites compile
but were not run; no device was attached.

Everything left unvalidated after D4B stays unvalidated.

## Next device action (ask for exactly this)

`docs/D4C_DEVICE_CHECKLIST.md`. **Steps 3 and 9 are the gate: do not upload the backlog until the
launch-scan behaviour and the 9GAG caption have both been confirmed on one disposable file.** Do not
ask for token setup, multi-topic binding, Dashboard counts, old repair checks, or a full D4A
regression run.

## Roadmap after D4C

1. Whatever the device reports about the caption, the launch scan, and the Hebrew Preview.
2. Still owed from D4B: real-world evidence about deletion retries, batch deletion, and blocked
   deletion states.
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
  stop until answered. D4B raised two; D4C raised three. All were answered before any file was edited.
- Do not introduce another binding command alias or syntax without asking first.

## Env notes (still current)

- `GRADLE_USER_HOME=/root/.gradle ./gradlew --offline …`; `aapt2` at
  `/opt/android-sdk/aapt2-wrapper/aapt2`.
- `apksigner` at `/opt/android-sdk/build-tools/36.0.0/apksigner`; `verify --print-certs -v` gives DN,
  cert SHA-256, key algorithm/size, and which schemes verified, in one call.
- **`lint` takes ~2–10 minutes.** Run it in the background and do other work meanwhile. The HTML
  report's plain-text body says "No errors or warnings"; the SARIF report is the easiest thing to
  parse (`results` array empty == clean).
- **`dexdump` crashes (Illegal instruction)** — use `strings` over extracted `classes*.dex`.
- Merged manifest at
  `app/build/intermediates/merged_manifest/debug/processDebugMainManifest/AndroidManifest.xml`. It
  legitimately contains debug-only components from `ui-tooling`, `ui-test-manifest`, `androidx
  .startup`, `room`, and `profileinstaller`; the *application's own* manifest is one activity and one
  service.
- **The offline Gradle cache has no media3, ExoPlayer, Coil, Glide, Picasso — and no DataStore.**
  Anything media-shaped uses platform APIs (`VideoView`, `MediaPlayer`, `MediaMetadataRetriever`,
  `AudioManager`); the one durable preference uses `SharedPreferences`.
- **`SharedPreferences.commit()` trips lint's `ApplySharedPref` and `UseKtx`.** Both are suppressed
  with `@SuppressLint("ApplySharedPref", "UseKtx")` and a documented reason: the UI reports which way
  the toggle went, and `apply()` and the KTX `edit` extension both return nothing.
- **Room's SQL parser rejects a correlated subquery in a projection.** Split it into a second `@Query`
  and compose in the repository.
- **A source-shape guard must strip comments** (`codeOf()`), *and* several guards do **not** strip
  them. A KDoc containing a banned literal fails the build — D4C hit this by writing
  `DocumentsContract.deleteDocument` in a UI comment; the four blanket "no deletion" guards tripped
  instantly. Say "the one sanctioned deleter" instead of naming the API.
- **Blanket "no file may be deleted" guards** live in `D2B1`, `D2B2A`, `D2B2B`, `D3A`, `D3B2` and
  `D4A` surface tests, each narrowed **by file name** (`AndroidDocumentDeleter.kt`).
- **The version literal is pinned in FIVE surface tests now**: `D3B15`, `D3B2`, `D4A`, `D4B`, `D4C`.
  Every bump must update all of them.
- **Lint's `UnusedResources` will fail the 0-issue bar** when a string is added but never referenced,
  or orphaned by a UI change. D4C removed `preview_position` (replaced by two separate end labels) and
  had to delete a string it added but did not use. Delete from **both** locales —
  `LocalizationResourcesTest` compares key sets exactly.
- **An apostrophe in an English string resource must be escaped** (`\\'`) or `mergeDebugResources`
  fails. `\\u2014` for an em dash avoids the issue entirely.
- **`%1$d` followed by a word trips lint's `PluralsCandidate`.** Use `<plurals>`; Hebrew uses
  `one`/`two`/`other` only.
- **The `Edit` tool writes literal characters where Kotlin source needs `\\uXXXX` escapes.** Patch
  those lines with a small Python script instead.
- No Robolectric/mockito: prove UI rules by extracting them into pure objects (`TelegramCaptionPolicy`,
  `ReviewGridSort`, `ReviewSourceTimestamp`, `SourceDeletionGate`, `TransferIndicatorPolicy`, …) plus
  source-shape assertions, and Room behaviour in compiled-only androidTest.
- Kotlin property initializers run in declaration order: a `StateFlow` whose `combine`/`onEach`/
  `stateIn` touches another property must be declared **after** it.
- In `runTest`, a `stateIn(WhileSubscribed)` flow has no value until something collects it **and**
  `advanceUntilIdle()` has run.

## Deployment declaration

Nothing was deployed, installed, or run on a device or emulator in the D4C session. **No real Telegram
request of any kind was made** — no `sendVideo`, no `sendDocument`, no `editMessageMedia`, no
`getUpdates`, no send. No forum topic was created, renamed, closed, or deleted; no binding was written
against a real group. **No media file was uploaded, moved, renamed, copied, downloaded, quarantined, or
deleted**, and no real document was opened for writing on any path. No real file name was read,
recorded, or used as a test fixture: every name in the test suite is synthetic.
