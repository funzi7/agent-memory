# Private Media TV — F2C.3 Handoff

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | funzi7/private-media-tv |
| Milestone | F2C.3 — offline COMPLETE-download playback, unified exact-back navigation, Israel arrival semantics, always-actionable POSSIBLE sources + multi-variant, Deep failure attribution/recall |
| Branch / tracking branch | main / origin/main |
| Starting application HEAD | d3b833f34702c3da1a53d6e411e5edd3400e7981 |
| Final application HEAD | 259a51252aeb077f8de631b493d361120054ccb4 |
| Exact-head Android CI | 31992502597 — success |
| Mobile identity | com.funzi7.privatemediatv.mobile, 0.4.3-phone-test, versionCode 22 (updates code 21 in place) |
| TV regression identity | com.funzi7.privatemediatv, 0.6.3-f2c3, versionCode 26 (regression build only, not delivered) |
| Development signer SHA-256 | 2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0 |

One cohesive F2C.3 commit on main, pushed without force; final application HEAD matches origin/main.
Exact-head Android CI passed and uploaded both signed artifacts; only the mobile artifact was
downloaded and published. No TV export/delivery, no Shield, no adb device attached.

## What F2C.3 implemented (application HEAD 259a5125)

Decision record: `docs/adr/0023-f2c3-offline-playback-navigation-israel-arrival-deep-recall.md`;
narrative in CHANGELOG, PROJECT_STATE / HANDOFF / RELEASE_REVIEW F2C.3 sections, TEST_PLAN /
MOBILE_ACCEPTANCE F2C.3 matrices, ARCHITECTURE / DATA_MODEL / UX_DECISIONS / TMDB_INTEGRATION /
PRODUCT_SPEC / OFFLINE_DOWNLOADS / PLAYBACK_CONTINUITY.

1. **UI-visible POSSIBLE is always owner-actionable.** Removed the hidden `ownerConfirmable=false`
   no-Play gate in `F2bSessionSourceVariantCard` and the `ownerConfirmable` requirement in
   `ownerConfirmationText`; the engine now marks every presented local-index POSSIBLE confirmable.
   Every shown POSSIBLE offers `ניגון מקור זה` (confirm+play) and `זה הפרק`/`זה הסרט` (bind-only);
   hard rejects stay filtered upstream. Sibling variants remain individually selectable (token-keyed
   replace preserves them).
2. **COMPLETE downloads are first-class offline playback.** New
   `resolveOfflineDownloadForPlayback(record)` (data source + backend) resolves through the
   runtime-independent local path FIRST and accepts only `COMPLETE_LOCAL_PLAYABLE` — the happy path
   is zero Telegram runtime / GetMessage / SearchChatMessages / network, and existing code20/21
   COMPLETE records play without re-download. The Downloads screen gained primary Play, card-tap
   Play, a resume bar, identity metadata (movie / `SxxExx` / quality / size / state) and Remove as a
   SECONDARY action; a missing physical file shows `הקובץ המקומי אינו זמין` + `הורד מחדש` (never a
   silent network switch). Offline play emits the normal `F2bPlayableLaunch`, joining
   progress/resume/Continue Watching/completion/auto-next.
3. **One coordinated exact-back catalog stack.** `F2bCatalogNavStack` (payload-carrying `F2bNavEntry`
   = route + selected identity/season/episode) replaces the route-name stack; `navigateBack` restores
   the exact previous destination (reloading details only on a resident-content mismatch) and two
   distinct same-route destinations get distinct slots. A deep link from the outer diagnostic Home
   (`markOuterCatalogEntry`) returns to the OUTER origin; the Catalog button (`enterCatalogHome`)
   lands on a clean Catalog HOME. Inline Back#1-collapse/Back#2-pop, scroll/anchor restoration, and
   the player round-trip are preserved; Android + header Back share one dispatch.
4. **Compact Series/Player visuals.** A compact Favorite/Want/Seen owner-action icon cluster sits
   under the series title; the player groups rotate/fullscreen into the single top bar with Back and
   title. Centered Play/Pause, LTR-isolated −10 (left) / +10 (right), keep-screen-on, fullscreen, and
   the diagnostics-behind-INFO-panel rule are unchanged.
5. **Israel arrival semantics.** New `TerritoryArrivalClass`
   (FIRST_ISRAEL_ARRIVAL / NEW_SEASON_IN_ISRAEL / RETURNED_TO_CATALOG / DAY_ONE_GLOBAL_AVAILABILITY)
   + additive territory-availability DB v1→v2 (arrivalClass, reappeared flag, first/latest season,
   worldReleaseEpochMillis, unavailableAfterEpochMillis; `markUnavailable`; `observeTerritoryArrivals`).
   The combined Home row `חדש בישראל` = FIRST + NEW_SEASON only (day-one worldwide launches, returned
   reappearances, baseline titles, intra-Israel provider moves excluded); the
   per-international-provider `X — סדרות חדשות בישראל` rows are REMOVED (Netflix/Prime/Disney+/Apple
   TV+/HBO Max keep their ordinary rows). Local-operator rows (`חדש ב-HOT/yes/STING+/FreeTV/Cellcom
   TV+/Partner TV+`) are structural with provenance OFFICIAL_PROVIDER_FEED and render only with a
   verified feed — none integrated today (coverage recorded per operator; no scraper fabricated).
6. **Deep failure attribution + recall.** The Telegram adapter reports protected/unsupported chats in
   a distinct `notSearchableSourceChats` bucket (transient inaccessible/hydration-timeout stay
   retryable failures); the engine threads it into the checkpoint/group accounting and
   `deepNotSearchableSourceCount` (invariant `completed+timedOut+failed+notSearchable+inFlight+
   remaining==planned`), so a protected source never inflates FAILED or forces a false PARTIAL — a
   pass with only completed + not-searchable terminates EXHAUSTED. The EXTENDED query plan adds
   natural-Hebrew `עונה N פרק M` and dotted-filename forms.
7. **Versions/delivery plumbing.** Mobile 21→22 and TV 25→26 across build.gradle.kts, MobileModels,
   MobileManifestContractTest, android-ci.yml assertions/metadata, verify/export/download scripts,
   both delivery harnesses, CI rejection fixtures, and upgrade-verifier fixtures; rotation allow-list
   adds `0.4.2-phone-test:21`.

## Validation evidence

- Focused F2C.3 regressions (new/updated), all green: `F2c3ViewModelTest` (offline play +
  missing-file, deep-link→outer, in-catalog back, series→downloads→back, non-flagged POSSIBLE plays),
  `F2c1SourcePanelComposeTest` (every visible POSSIBLE actionable), `F2c2IsraelAvailabilityDataSourceTest`
  (`חדש בישראל`, per-international-provider IL rows removed, local rows empty without a feed),
  `TerritoryAvailabilityStoreTest` (first-arrival / day-one-excluded / returned / new-season /
  provider-move / baseline), `TerritoryAvailabilityMigration1To2Test` (additive v1→v2),
  `TelegramCatalogSourceAdapterTest` (protected → not-searchable, never failed), plus the retained
  F2C.2 Deep/auto-next/watched/MKV suites.
- Broad pass at the final HEAD: `./gradlew test lint :app-mobile:assembleDebug :app-tv:assembleDebug`
  BUILD SUCCESSFUL — all module unit tests green (core-metadata / core-telegram / core-catalog /
  app-mobile / app-tv), lint clean, both debug APKs assembled; `git diff --check` clean. Local mobile
  debug APK verified 0.4.3-phone-test (22), ARM64-only, one `lib/arm64-v8a/libtdjni.so`, Development
  signer.
- Script harnesses: credential scan 41, TV delivery 9, mobile delivery 14, mobile CI rejections
  20+1, TV CI rejections 8, upgrade verifier 13, pmtprov 4 — all passed; `bash -n` clean.
- TDLib verify-only (NO rebuild): pinned commit unchanged, ARM64 AAR SHA-256
  025313d2a7cdbf148e5c700e8ef6c9d384f2301aff043c844997e0c23eb9abd2.
- CI: exact-head `Android CI` run 31992502597 for 259a5125… completed success (wrapper validation,
  script self-tests, TDLib verify, full tests, lint, both assemblies, version/signer/payload
  verification, artifact upload).

## Delivery evidence (mobile only)

Published via `./scripts/download-latest-ci-mobile-apk-to-phone.sh` from CI run 31992502597,
artifact `private-media-tv-mobile-apk-259a51252aeb077f8de631b493d361120054ccb4`:

- Latest: `/storage/emulated/0/Download/PrivateMediaTV/Mobile/private-media-tv-mobile-latest.apk` —
  0.4.3-phone-test (22), APK SHA-256
  dbd43e27e938a88beaa86419e783a2f1946a8093d4d1bccede736229e7ad962e, 58,904,060 bytes, modified
  2026-08-17 04:10 UTC, ARM64-only, one `lib/arm64-v8a/libtdjni.so` (packaged JNI sha
  790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f), Development signer verified.
- Rotation result: `rotated` — previous is now the code 21 build (0.4.2-phone-test), 58,871,292
  bytes. Broken code 17 remains blocklisted from any canonical slot.
- Only the two canonical Mobile files exist; TV files untouched. latest = code 22, previous = code 21.

## Not done / pending

- **Physical code-22 acceptance is PENDING** on the owner's phone — gates in
  `docs/MOBILE_ACCEPTANCE.md` F2C.3: in-place install over code 21 (no uninstall/clear-data), the
  offline COMPLETE-download Play (zero-search local playback + the pre-existing complete download
  playing), Downloads metadata/Play/Remove, exact-back navigation (Catalog↔Downloads, Series↔Player,
  deep-link My Sources → outer Home), the compact series/player visuals, the Deep no-match diagnostics
  distinguishing completed/timeout/failure/not-searchable, the Israel rows (`חדש בישראל` meaningful
  arrival; no per-international-provider IL rows; a returned old title not treated as first arrival),
  and the retained auto-next/keep-screen-on/session-index regressions.
- Deferred, documented truthfully: a per-source Deep recent-history rescue (the known/manual-source
  history rescue is unchanged); live ingestion for the six Israeli operators (none has a verified
  stable public source today — recorded in `IsraelAvailabilityRegistry.localOperatorCoverage`); the
  full per-source private Deep diagnostics UI (aggregate counters already distinguish completed /
  no-match / timeout / failed / not-searchable and raw-vs-mapped-vs-relevant).
- The final TV D-pad rendering of the playback-first flow remains the standing open TV-side item;
  TV code 26 is compile/regression evidence only.

## Continuation instructions

Next agent: obtain the owner's physical code-22 result first (MOBILE_ACCEPTANCE F2C.3 gates). If a
gate fails, pull a real Android bug report before changing anything; an empty combined `חדש בישראל`
right after install is conservative arrival truth (day-one launches are excluded by design), not a
defect, and an empty local-operator row is truthful (no verified feed). Architecture decisions live
in ADR 0023. Environment/bump reminders (see also the manager's private notes): territory DB
migrations tested with MigrationTestHelper need the module's `sourceSets` schema-assets wiring and a
driver-based `migrate(SQLiteConnection)` override; version bumps touch 10+ pin sites and the rotation
allow-list needs the outgoing build added; never trust `./gradlew … | tail` exit codes.
