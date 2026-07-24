# Telegram Topic Uploader — latest handoff

## Task and repository state

| Field | Value |
| --- | --- |
| Task | D3B1.5 — in-place Telegram presentation repair + one durable multi-topic binding session, carrying D3B1.4.2's fixed Menu position forward |
| Application repository | `/root/work/telegram-topic-uploader` |
| Branch | `main` |
| Tracking branch | `origin/main` |
| Starting application HEAD | `2783940bf00b7c5bee4d3f6e14493eb7a01aa344` (D3B1.4.2) |
| Version | code 16 -> 17, name `0.5.6-d3b1.4.2` -> `0.6.0-d3b1.5` |
| Room schema | **7 -> 8**, explicit `MIGRATION_7_8`, purely additive |
| Deployment | None. Not installed or run on any device or emulator in this session |

No production token, Telegram identifier, bot username/ID, chat ID, thread ID, group title, forum
topic name, private link, binding command, nonce, file name, content URI, document ID, path, or media
hash was requested, used, or recorded anywhere, including this file.

## Process rules the user set, and how they were honoured

- **The user deliberately did not install the standalone D3B1.4.2 APK.** They said tiny standalone
  builds should be grouped with real work instead of shipped alone. D3B1.5 therefore *carries* the
  fixed Menu position, and the device checklist validates it as its first three steps. **Do not ship
  another single-hotfix build on its own; fold it into the next substantive milestone.**
- **Mandatory stop-and-ask UX gate.** The user forbids an agent silently choosing among materially
  different user-facing behaviours. Four questions were asked *before any file changed*:
  1. Old single-topic Bind / Re-bind flow → **user answered: keep it**, on the same engine.
  2. Command text → **user answered: `/bind@<validated_bot_username> <nonce>`**, one format, one
     parser, no alias, and *"do not introduce another command alias or syntax unless you stop and ask
     me first"*.
  3. Screen placement and 4. session lifetime → the user replied "Continue" without answering. Both
     were taken as **explicitly stated, one-constant-reversible assumptions**: inline on the Topics
     screen (the only option that cannot disturb the still-unvalidated Menu invariant), and 30 minutes
     for a multi-topic session with the validated 10 minutes unchanged for a single bind.
- Asking again after "Continue" was judged worse than proceeding with stated assumptions; if the user
  disagrees, both are single-line changes.

## New user-reported device evidence (not observed by any agent)

- D3B1.4.1 was installed and run; the redundant tile sentence was gone, drill-down Back worked, drawer
  **Dashboard** and **History** opened the right screens, and pull-to-refresh worked.
- The remaining D3B1.4.1 defect was Menu moving to the opposite top-bar edge when Back appeared.
- D3B1.4.2 fixed that but **was not installed**.
- Two earlier bot-uploaded videos still show as blank 0:00 cards; their jobs are durably confirmed and
  hold positive Telegram message IDs. Later D3B1.3 uploads look correct.
- The user wants those two repaired **without any duplicate post**, and wants to connect several
  topics in one pass with a command that already contains the bot username.

## Part A — in-place repair, as implemented

**One method, one class.** `transport/telegram/TelegramMediaRepairApiGateway` knows only
`editMessageMedia`. `sendVideo`, `sendDocument`, `copyMessage`, `forwardMessage` and every
message-deletion method are absent from the file, so no path can drift into posting again. Body:
`chat_id`, `message_id`, and a `media` field holding `{"type":"video","media":"attach://repair_video",
"thumbnail":"attach://repair_thumb","duration":N,"width":N,"height":N}`, plus the two file parts. **No
`supports_streaming`** (no fast-start probe exists) and **no caption**.

**Success = the same message.** Returned `message_id` must equal the stored one, in the same chat and
thread, with a video whose duration/width/height are all positive. A *different* positive ID is never
success — that is the duplicate-detection rule. Anything else → `RESULT_UNKNOWN`.

**Outcomes** (`MediaRepairStatus`): PENDING/RUNNING (unresolved) → REPAIRED / FAILED_PERMANENT /
RETRY_AVAILABLE / RESULT_UNKNOWN. Only `RETRY_AVAILABLE.allowsNewAttempt`. Incomplete body →
retryable; complete body + no trustworthy answer → unknown, never retried automatically **or**
manually. Process death: `dispatchStarted=false` → RETRY_AVAILABLE, `true` → RESULT_UNKNOWN.

**Eligibility** is pure (`RepairEligibilityPolicy`) over durable facts: Completed group, positive
message ID **and** confirmedAt, live bound destination on the current bot generation, canonical hash,
no unresolved/settled-blocking repair, no other media operation. The *file* is re-proved at dispatch
time — size, modification evidence, **full SHA-256 recomputed**, D3B1.3 probe — and there is **no
document fallback**.

**`RoomMediaRepairRepository` contains no statement that writes `upload_jobs`.** That absence is the
guarantee the upload result is never rewritten.

## Part B — one multi-topic binding session, as implemented

`BindCommand` builds/matches `/bind@<bot> <nonce>` and nothing else; the legacy `/ttu_bind_` form is
gone. One clipboard write exists in the whole app, inside **Copy full command**'s `onClick`.
`BindingSessionMode.SINGLE|MULTI` share one nonce format, one `BindingBatchProcessor`, one poll loop
(`pollMutex.tryLock()`), and **one commit** — the single-target confirmation calls the same
`sessions.commit(...)` with a set of size one. Group pinning is **MULTI-only** (a SINGLE session must
still report two topics as ambiguous — this was a real bug caught by an existing test). `BindingCommitPolicy`
is pure and all-or-nothing; duplicate *names* stay allowed per D2B1. Candidates carry chat+thread only
— no chat title, and no invented topic name. Sessions/candidates are durable; the ViewModel restores
via `restoreSession()` called from a `LaunchedEffect` (an `init {}` block would break
`D1SecuritySurfaceTest`), and `onCleared()` must **not** cancel the session.

## Files touched

New: `domain/repair/{MediaRepairModels,MediaRepairPorts,MediaRepairRepository,MediaRepairCoordinator}.kt`,
`domain/binding/{BindCommand,BindingCommitPolicy,BindingSessionRepository}.kt`,
`domain/execution/ExternalMediaOperationArbiter.kt`,
`transport/telegram/{TelegramMediaRepairApiGateway,MultipartMediaBodies}.kt`,
`data/repository/{RoomBindingSessionRepository,RoomMediaRepairRepository}.kt`,
`docs/D3B15_MULTI_TOPIC_DEVICE_CHECKLIST.md`. Rewritten: `domain/binding/{TopicBinding,
TopicBindingCoordinator}.kt`. Modified: Entities/Daos/AppDatabase/DatabaseMigrations, AppModule,
MediaUploadCoordinator (arbiter), BatchUploadCoordinator + BatchUploadPorts (new
`MediaOperationActive`), TelegramGateway (`MESSAGE_NOT_EDITABLE`), UploadFailureClassifier,
TelegramSetupService, TelegramSetupUiPolicy, MainViewModel, TelegramSetupViewModel, Screens,
TelegramSetupScreens, TelegramTopicUploaderApp, both `strings.xml`, `app/build.gradle.kts`.

## Tests and exact results

| Check | Result |
| --- | --- |
| `--offline testDebugUnitTest` | **878 tests / 73 classes, 0 failures, 0 errors, 0 skipped** (D3B1.4.2: 776/66) |
| `--offline lint` | **0 issues** (empty `<issues>`) |
| `--offline assembleDebug` / `assembleDebugAndroidTest` | passed |
| Instrumentation | compiles, **not run** (no device attached) |
| Room schema | **8**, exported as `8.json`, explicit `MIGRATION_7_8` |
| `git diff --check` | clean |

New: `BindCommandTest`, `BindingCommitPolicyTest`, `MultiTopicSessionTest`,
`RepairEligibilityPolicyTest`, `TelegramMediaRepairGatewayTest` (MockWebServer over
`editMessageMedia`), `MediaRepairCoordinatorTest`, `D3B15SurfaceTest`. Extended:
`AppDatabaseMigrationTest` (7→8 preservation + three new unique indices), `TopicBindingValidatorTest`,
`BindingBatchProcessorTest`, `TopicBindingCoordinatorTest`, plus shared `FakeBindingSessionRepository`.

**Known flake, not a regression:** the two `DISCONNECT_DURING_REQUEST_BODY` gateway tests can fail
when `testDebugUnitTest` runs concurrently with `lint` on this machine (MockWebServer sometimes
finishes the body before dropping the socket). **Run `testDebugUnitTest` on its own** for reportable
figures; it is green every time alone.

## APK identity (debug development signing only)

- Main APK `app/build/outputs/apk/debug/app-debug.apk`: **14,584,821 bytes**, SHA-256
  `3d38f21055b2b97ad4c232c6ec3e9dcf70e33917279e6aa8c377c0c4abfa102a`.
- Instrumentation APK: 1,581,941 bytes, SHA-256
  `d21f8bb86dedb3ca5807b4e8f8cd0b20195c3a8aa708c68f50193d62b689c0b5`.
- Package `com.funzi7.telegramtopicuploader`; versionCode 17; versionName `0.6.0-d3b1.5`; minSdk 23;
  compile/target SDK 37; cleartext false; backup false.
- Permissions unchanged: INTERNET, ACCESS_NETWORK_STATE, RUN_USER_INITIATED_JOBS, POST_NOTIFICATIONS
  (+ AndroidX `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`). One non-exported `BatchUploadJobService`;
  no application receiver or provider of our own.
- Debug cert SHA-256 `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4` — matches
  expected, so it updates over the installed `0.5.5-d3b1.4.1` in place.

## Agent-observed vs user-reported

**Agent-observed (this session):** compilation, the full JVM suite, lint, both APK assemblies, the
merged manifest, the signer, schema 8 export, and every source-shape assertion. **User-reported (not
observed):** everything in the device-evidence section above. **Nothing else is claimed.**

## Untested device boundary

The D3B1.5 APK has **never** been installed, launched, or run. **No `editMessageMedia` request has
ever left this machine**, no binding session has ever polled a real `getUpdates`, and the two blank
posts are exactly as they were. Whether they repair, whether several topics collect from one paste
each, and whether Menu holds its position are all unproven here.

## Next device action (ask for exactly this)

`docs/D3B15_MULTI_TOPIC_DEVICE_CHECKLIST.md`: install over the current build; Menu position on
Dashboard then on Completed; repair both old blank posts and confirm each existing post now has a real
thumbnail and duration with **no** extra post and both source files unchanged; then Connect multiple
topics → Copy full command → paste into ≥2 topics of one group without returning → Finish collecting →
name both → Connect all once. Do **not** ask for background scheduling, upload compatibility,
source-missing, retirement, counts, token setup, or folder scans.

## Roadmap after this

1. **D3B2 immediate cancellation** of the in-flight multipart request (replaces stop-after-current).
2. **Source profiles for Instagram / TikTok / Downloads** — derive a profile from durable local
   evidence only (the scanned folder, the provider's file naming), offer it as a *suggestion* on
   Review, never as automatic routing, and never with per-account mappings.
3. **Bulk thumbnail routing** — apply one reviewed decision to a group sharing a proved source
   profile, in one transaction, with **Connect all**'s all-or-nothing semantics.
4. **Later, only after those are proved on hardware:** optional content-based suggestions.
5. Still open from before: result-unknown reconciliation that never re-sends without evidence
   (including a *manual* repair-retry design, deliberately not attempted here); evidence-based
   resolution of an unowned/ambiguous legacy reservation (D3A.1); safe-deletion gated on a confirmed
   positive message ID; a truly background notification stop action.

## Env notes (still current)

- `GRADLE_USER_HOME=/root/.gradle ./gradlew --offline …`; `aapt2` at
  `/opt/android-sdk/aapt2-wrapper/aapt2`; `apksigner` in `/opt/android-sdk/build-tools/37.0.0`.
- **`dexdump` crashes (Illegal instruction)** — use `strings` over extracted `classes*.dex`.
- Merged manifest at
  `app/build/intermediates/merged_manifest/debug/processDebugMainManifest/AndroidManifest.xml`; parse
  with `xml.etree`, not grep (attributes span lines).
- **A source-shape guard must strip comments** (`codeOf()` in `D3B15SurfaceTest`), or documenting why
  a mechanism was rejected fails the guard that rejects it — and a real use could hide behind "it's
  just a comment". Equally: do not weaken a guard by rewording prose; strip comments instead.
- Adding a `TelegramFailureCode` value breaks three exhaustive `when`s: `UploadFailureClassifier`,
  `TelegramSetupService.toConnectionStatus`, `TelegramSetupUiPolicy.testFailureLabel` (+ its test's
  expected map).
- Keep the *current* `versionCode`/`versionName` literal in the **newest** milestone's surface test
  only; older ones assert the stable package identity instead.
- `TopicDestinationDao.bind(...)` sets `BOUND_UNTESTED`; there is no `BOUND` state. `TelegramSetupDao`
  exposes `get()`, not `find()`. `telegram_setup.advanceUpdateOffset` only ever moves **forward**, so
  treat it as best-effort next to a session's own offset.
- `TelegramSetupState.isConnected` also requires a non-null `validationTimestamp` — a fake setup row
  without it silently yields `NotConnected`.
- Compose BOM `2026.06.01` → material3 1.4.0. `material-icons-core` 1.7.8 has
  `Icons.AutoMirrored.Filled.ArrowBack`. Verify an API by unzipping the AAR from
  `/root/.gradle/caches/modules-2/files-2.1/…` and running `javap`; the sandbox is offline so a wrong
  guess costs a full failed build.
- Lint's `UnusedResources` **will** fail the 0-issue bar when a UI rewrite orphans strings — delete
  them from **both** locales to keep exact key parity.
- `Bitmap.createScaledBitmap` trips lint `UseKtx`; use `androidx.core.graphics.scale`.
- `flatMapLatest` needs `@OptIn(ExperimentalCoroutinesApi::class)` in coroutines 1.11.
- No Robolectric/mockito: prove UI rules by extracting them into pure objects (`BindCommand`,
  `BindingCommitPolicy`, `RepairEligibilityPolicy`, `TopBarLeadingCluster`, `DashboardDrillDown`) plus
  source-shape assertions, and Room behaviour in compiled-only androidTest.

## Deployment declaration

Nothing was deployed, installed, or run on a device or emulator in the D3B1.5 session. **No real
Telegram request of any kind was made** — no `editMessageMedia`, no `getUpdates`, no send. No forum
topic was created, renamed, closed, or deleted; no binding was written against a real group; and no
media was uploaded, moved, renamed, copied, downloaded, quarantined, or deleted. The two existing
blank Telegram posts are untouched and are never repaired, resent, or removed without an explicit,
confirmed, per-row user action.
