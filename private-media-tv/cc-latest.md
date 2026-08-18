# Private Media TV — F2C.4 Handoff

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | funzi7/private-media-tv |
| Milestone | F2C.4 — first-class SAF Local Library, Deep per-source history rescue, text-free exact binding, runtime start-or-attach idempotence + stale lease-error cleanup, offline local-first downloads, Source Inspector + truthful index/FAST-live UX |
| Branch / tracking branch | main / origin/main |
| Starting application HEAD | 259a51252aeb077f8de631b493d361120054ccb4 |
| Final application HEAD | bb0b9d7e78e024e3c5a93aca1ee0d4aa978cd6e2 |
| Exact-head Android CI | 32096140914 — success |
| Mobile identity | com.funzi7.privatemediatv.mobile, 0.4.4-phone-test, versionCode 23 (updates code 22 in place) |
| TV regression identity | com.funzi7.privatemediatv, 0.6.4-f2c4, versionCode 27 (regression build only, not delivered) |
| Development signer SHA-256 | 2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0 |

One cohesive F2C.4 commit on main, pushed without force; final application HEAD matches origin/main.
Exact-head Android CI passed and uploaded both signed artifacts; only the mobile artifact was
downloaded and published. No TV export/delivery, no Shield, no adb device attached.

## What F2C.4 implemented (application HEAD bb0b9d7)

Decision record: `docs/adr/0024-f2c4-local-library-deep-rescue-binding-runtime-offline-inspector.md`;
narrative in CHANGELOG, README, TODO, PROJECT_STATE / HANDOFF / RELEASE_REVIEW F2C.4 sections,
TEST_PLAN / MOBILE_ACCEPTANCE F2C.4 matrices, ARCHITECTURE / DATA_MODEL / UX_DECISIONS /
OFFLINE_DOWNLOADS / PLAYBACK_CONTINUITY / PRODUCT_SPEC / TMDB_INTEGRATION.

Driven by physical code-22 owner evidence (A: Deep missed a file later found by a Known Source; B:
AUTOMATIC `זה הפרק` failed on the text requirement; C: recurring stale runtime-lease presentation; D:
Downloads falsely showed zero while a COMPLETE download existed; E: ambiguous index-build progress;
F/G: FAST-live wording + uninspectable sources) plus owner request H (Local Library).

1. **Text-free exact binding.** `bindSource()` no longer requires `ownerSourceSearchText` or a derived
   confirmation phrase; `ownerSearchText` is nullable through every layer
   (`F2bCatalogDataSource` → `SourceDiscoveryService` → `RoomSourceIntelligenceRepository.bindExactSource`).
   A binding persists from the index row's durable locators + `media.identity.stableKey` and its
   identity-derived PROVEN affinity in one transaction; the optional alias is learned in a SEPARATE
   best-effort transaction AFTER commit, so alias-learning failure never rolls back the binding.
   `BIND_CONFIRMATION_UNAVAILABLE_NOTICE` removed. AUTOMATIC and POSSIBLE both bind on
   `זה הפרק`/`זה הסרט` with no literal search on screen.
2. **Deep per-source bounded history rescue.** In the Deep group loop, every searchable source the
   live phase left without an accepted candidate runs ONE bounded `GetChatHistory` rescue for THAT
   source, reusing the F2B.5.1 history-fallback path (`runLiveGroup(historyFallback=true,
   knownSourceGroup=true)` → adapter `searchSelectedChatHistoryFallback` / `historyFallbackOnly`),
   through the same `TmdbAwareSourceMatcher` + `KnownSourcePossibleRelevancePolicy` floor and bounds
   (≤5 pages × ≤100 raw messages, per-op timeout, cancellable). The rescue is additive (a throwaway
   `DeepGroupOutcomes` isolates it so one source's rescue never downgrades another's live terminal),
   Deep continues through the remaining sources, and the owner never has to pre-configure the channel
   as a Known Source. New `SourceDiscoverySafeStage.DEEP_HISTORY_RESCUE` +
   `SourceSearchV2Budgets.deepHistoryRescueMillis` (5 s/source).
3. **Runtime start-or-attach idempotence.** Reaching Running health or authorization Ready supersedes
   a stale `runtimeAttempt.terminalFailure` (new `MobileRuntimeAttempt.clearedStaleFailure()`);
   `restartFailedRuntimeFromVault` treats an already-owned HEALTHY runtime as a successful attach
   (`reconcileHealthyOwnedRuntime`) instead of synthesizing `CLIENT_ALREADY_ACTIVE`; a new serialized
   `MobileProcessRuntimeOwner.startOrAttach` makes create-vs-attach atomic under the one owner mutex.
   `ProcessTelegramRuntimeLease` is unchanged and still rejects a real second client; the discovery
   backend still drives the coalesced `recover()` for runtime-gated operations (ADR 0019).
4. **Offline Downloads local-first.** `F2bCatalogDataSource.offlineDownloads()` observes the
   account-scoped `offline_downloads` Room store DIRECTLY (persisted active account via
   `RoomSourceDiscoveryRepository.persistedActiveAccountState()` → `observeOfflineDownloads`) as a
   long-lived `F2bLocalDownloadsProjection` (Available / NoActiveAccount / AccountConflict /
   TransientReadFailure). No provider/runtime gate; never a false empty; a NoActiveAccount projection
   never wipes a valid list; a transient DB read failure keeps the last valid list and shows
   `לא ניתן לרענן כרגע`; the fail-soft observer reattaches on normal completion. The F2C.3
   zero-Telegram COMPLETE local-playback happy path is unchanged.
5. **Source Inspector + truthful UX.** Clickable source cards → a new `SOURCE_INSPECTOR` route
   (`פרטי מקור`): per-source indexed video rows newest-first (a per-channel DAO query, pure-local —
   no Telegram fanout), an in-source search over that source's local index, a bounded `רענן מדיה`
   catch-up, and a RAW test-play that resolves an indexed row by token alone
   (`resolveRawIndexedSource`, no identity/binding/media-association commit) so it never creates
   catalog progress (nullable `F2bPlayableLaunch.identity` + `raw` flag). The index one-liner shows
   scanned/found/pages, an explicit history-progress cue, and a `ממתין לתגובה מ-Telegram…` waiting
   state (never a fake completion), with per-state actions. FAST live-search reworded to
   `חיפוש מהיר בזמן אמת` with an explanation that a not-pinned source still participates in the local
   index and Deep (the three mechanisms named distinctly).
6. **First-class SAF Local Library** in a new provider-neutral `:core-locallibrary` module
   (device-local DB v1, NOT the Telegram account-scoped catalog): SAF `OPEN_DOCUMENT_TREE` folder
   grants (persistable read, write where granted); ONE initial recursive video scan, then incremental
   reconciliation (new/changed/deleted; an unchanged file is never re-extracted; a lost permission
   retains metadata and marks the folder INACCESSIBLE) — never a full re-scan on launch. Stable
   fingerprint = document id + size + lastModified (no whole-file hashing). `LocalFilenameParser`
   proposes catalog identities (SxxEyy/NxMM/natural/Hebrew episode, movie title+year) without
   fabricating markers. Local MP4/MKV play through the common Media3 player via a seekable SAF
   `ProviderRangeSource` (`SafLocalFileRangeSource`, `ContentResolver.openFileDescriptor` +
   `Os.pread`/`Os.fstat`) — no multi-GB copy, no coercion into a Telegram token. Explicit physical
   delete (`DocumentsContract.deleteDocument`) is confirmed (`למחוק את הקובץ מהמכשיר?`), never
   automatic; a read-only provider fails truthfully; removing a folder deletes only indexed rows.

## Validation evidence

- Broad: `./gradlew test lint :app-mobile:assembleDebug :app-tv:assembleDebug` BUILD SUCCESSFUL — all
  module unit tests green (core-metadata / core-telegram / core-catalog / **core-locallibrary (19
  tests)** / app-mobile / app-tv), lint clean, both debug APKs assembled; `git diff --check` clean.
- Focused F2C.4 regressions (new/updated, all green): binding — `OwnerDirectedSourceSearchTest`
  (null-text bind + proven affinity), `F2c1SourcePanelViewModelTest` (BN-A AUTOMATIC bind, BN-B
  text-less POSSIBLE binds); Deep — `SearchEngineV2IntegrationTest` (M/BN-D synthetic false-negative:
  live miss + bounded history hit found WITHOUT Known-Source config; three prior Deep-coverage tests
  updated to filter `historyFallbackOnly` requests); runtime — `MobileViewModelTest` (Running/Ready
  supersede stale lease failure, Retry-while-healthy attaches without restart/lease error,
  `startOrAttach` attach + single-creation); offline — `F2c3ViewModelTest` (local-first Available
  without backend, TransientReadFailure keeps last list + notice, NoActiveAccount does not wipe);
  inspector — `F2c3ViewModelTest` (open/search, raw test-play never arms a catalog identity);
  `:core-locallibrary` — `LocalLibraryRepositoryTest` (BL 1-8/12-16) + `LocalFilenameParserTest`.
- Script harnesses: credential scan 41, mobile delivery 14, mobile CI rejections 20+1, upgrade
  verifier 13, TV delivery 9 — all passed. TDLib verify-only (NO rebuild): pinned commit unchanged,
  ARM64 AAR SHA-256 025313d2a7cdbf148e5c700e8ef6c9d384f2301aff043c844997e0c23eb9abd2.
- Local mobile debug APK verified 0.4.4-phone-test (23), ARM64-only, one `lib/arm64-v8a/libtdjni.so`,
  Development signer.
- CI: exact-head `Android CI` run 32096140914 for bb0b9d7… completed success (wrapper validation;
  official TDLib, tests, lint, and signed TV/mobile assemblies).

## Delivery evidence (mobile only)

Published via `./scripts/download-latest-ci-mobile-apk-to-phone.sh` from CI run 32096140914,
artifact `private-media-tv-mobile-apk-bb0b9d7e78e024e3c5a93aca1ee0d4aa978cd6e2`:

- Latest: `/storage/emulated/0/Download/PrivateMediaTV/Mobile/private-media-tv-mobile-latest.apk` —
  0.4.4-phone-test (23), APK SHA-256
  8cd07aa8bac7474d5a6d3764ad91c81b466617c2021584c5893eb190e64ae0c8, 59,067,955 bytes, modified
  2026-08-18 03:56 UTC, ARM64-only, one `lib/arm64-v8a/libtdjni.so` (packaged JNI sha
  790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f), Development signer verified.
- Rotation result: `rotated` — previous is now the code 22 build (0.4.3-phone-test), 58,904,060
  bytes. Only the two canonical Mobile files exist; TV files untouched. latest = code 23, previous =
  code 22.

## Not done / pending

- **Physical code-23 acceptance is PENDING** on the owner's phone — gates in
  `docs/MOBILE_ACCEPTANCE.md` F2C.4: in-place install over code 22 (no uninstall/clear-data); no stale
  PMTV-TDLIB-RUNTIME-LEASE while the runtime is healthy; the pre-existing COMPLETE download visible +
  locally playable before/without Telegram Ready; AUTOMATIC `זה הפרק` binds with no identifying text;
  Deep finds a previously-missed title via the per-source rescue; index build shows live
  scanned/media/page counters + active/waiting/completed; FAST-live label clarity; Source Inspector
  list/search/test-play; Local Library add folder → one initial scan → local MP4/MKV play with no
  Telegram search → restart shows the library from the DB with no rescan → add-new-file incremental →
  explicit confirmed physical delete; exact-Back after Inspector/Local Library/Player; the retained
  F2C.3 regressions.
- Bounded follow-ups (documented truthfully, NOT physical defects): full
  Continue-Watching/resume/auto-next parity for a catalog-BOUND local file and local-source priority
  ahead of Telegram discovery (AY) — the `:core-locallibrary` scan/reconcile/delete/match/range-source
  core and the standalone local player are complete and tested; the neutral catalog-playable
  generalization that threads a bound local file through `F2bPlayableLaunch`'s progress machinery is
  the next step. The Source-Inspector structured-episode-code local lookup (requirement I) is an
  additive follow-up; the physical false-negative is already fixed by the per-source history rescue.
- TV code 27 is compile/regression evidence only; no TV delivery, no Shield.

## Continuation instructions

Next agent: obtain the owner's physical code-23 result first (MOBILE_ACCEPTANCE F2C.4 gates). If a
gate fails, pull a real Android bug report before changing anything. Architecture decisions live in
ADR 0024. Environment/bump reminders (see also the manager's private notes and the repo memory): the
new `:core-locallibrary` tests need `@ConscryptMode(OFF)` + `@SQLiteMode(LEGACY)` + BundledSQLiteDriver
under Robolectric (framework driver fails), and the module's `build.gradle.kts` wires
`sourceSets { getByName("test").assets.directories.add("schemas") }`; version bumps touch 10+ pin
sites and the mobile rotation allow-list needs the outgoing build (now `0.4.3-phone-test:22`); never
trust `./gradlew … | tail` exit codes. The Local Library DB starts at v1 with a strictly-additive
migration policy (dual `migrate` overrides + committed exported schema for any future version); do not
couple the SAF lifecycle to the Telegram catalog schema.
