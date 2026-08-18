# Private Media TV — F2C.4.1 Handoff (emergency mobile startup crash hotfix)

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | funzi7/private-media-tv |
| Milestone | F2C.4.1 — Emergency mobile startup crash hotfix (release blocker): fixes the code-23 immediate-open crash from F2C.4 |
| Branch / tracking branch | main / origin/main |
| Starting application HEAD | bb0b9d7e78e024e3c5a93aca1ee0d4aa978cd6e2 (F2C.4 final = broken code 23) |
| Final application HEAD | 519c4468770439ccf9fb7a5d97a0b8d4f3d7f9ac |
| Exact-head Android CI | 32107205729 — success (wrapper validation + build) |
| Mobile identity | com.funzi7.privatemediatv.mobile, 0.4.5-phone-test, versionCode 24 (updates broken code 23 in place) |
| TV regression identity | com.funzi7.privatemediatv, 0.6.4-f2c4, versionCode 27 (UNCHANGED; no shared production code changed; not delivered) |
| Development signer SHA-256 | 2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0 |

One cohesive F2C.4.1 commit on main, pushed without force; final application HEAD matches origin/main.
The exact-head Android CI initially failed 4 times at the Gradle-wrapper-validation job (~3 s, empty
logs, no steps) because the account's GitHub Actions minutes were exhausted; the owner raised the
limit and a re-run of the same HEAD passed both jobs and uploaded the signed artifacts. Only the mobile
artifact was downloaded and published. No TV export/delivery, no Shield, no adb device attached.

## Root cause (confirmed by code inspection; no fabricated Android stack)

F2C.4 (code 23) passed CI (run 32096140914) but crashed IMMEDIATELY on open on the physical device.
The F2C.4 SAF Local Library added an eagerly-created Compose ViewModel
`MobileLocalLibraryViewModel = viewModel()` to the initial `MobileAcceptanceApp` composition. Its only
constructor was `(Application, CoroutineDispatcher = Dispatchers.IO)`. A Kotlin default argument does
NOT synthesize the exact `(Application)` JVM constructor that the Android
`ViewModelProvider.AndroidViewModelFactory` reflectively requires
(`modelClass.getConstructor(Application::class.java)`); the factory threw "Cannot create an instance of
MobileLocalLibraryViewModel" at first composition and Android killed the process. The pre-existing
unit/Robolectric tests constructed the ViewModel DIRECTLY, never through the production factory path,
so CI never exercised the failing reflective construction. No Telegram session, catalog/local-library
Room, credential, or native-artifact corruption was involved.

## What F2C.4.1 changed (final HEAD 519c446)

Decision record: ADR 0024 amendment (F2C.4.1). Narrative in CHANGELOG, README, TODO, and the F2C.4.1
sections/matrices of PROJECT_STATE / RELEASE_REVIEW / HANDOFF / TEST_PLAN / MOBILE_ACCEPTANCE.

1. **Production ViewModel factory contract (the crash fix).** `MobileLocalLibraryViewModel` now has an
   explicit `constructor(application: Application)` that pins the exact `(Application)` reflective JVM
   signature the Android factory needs — mirroring the same pattern already used by `MobileViewModel`
   and `F2bCatalogViewModel`. Default arguments must never be relied on to satisfy reflection-based
   Android ViewModel construction. An injectable constructor is retained for tests.
2. **Local Library startup fail-soft.** Opening the device-local Room DB is contained (a DB that cannot
   open yields a null repository and the truthful notice `הספרייה המקומית אינה זמינה כרגע.`), and the
   two eager folder/file observers now run under a supervised fail-soft wrapper (reusing the house
   `launchFailSoftObserver` shape): a Room open/query/observe failure degrades to the contained notice
   and can NEVER terminate the process (HOME stays alive by invariant); one observer's failure never
   kills its sibling; `CancellationException` always propagates; a failed observer reattaches only
   after a bounded delay (no hot loop). A small injectable observation seam (the two folder/file flows,
   defaulting to the repository's flows) makes the observer-failure path deterministically testable
   without depending on Room's self-healing behaviour on a closed DB. F2B.5.2.1 startup survivability
   (Telegram STARTING/NOT_READY at launch) is preserved and now co-exercised with the Local Library.
3. **Regression coverage that reproduces the physical failure.**
   `MobileLocalLibraryStartupRegressionTest` (Robolectric) creates the ViewModel through the REAL
   production `ViewModelProvider.AndroidViewModelFactory` reflective path (never the Kotlin constructor)
   over a JVM `BundledSQLiteDriver` Local Library process DB: production-factory creation with the
   `Application` injected (G), empty fresh library (I), existing seeded DB observable with no launch
   rescan (J), forced DB-open-failure fail-soft (K), independent folder/file observer-failure
   containment (L). `MobileStartupCompositionSmokeTest` renders the REAL initial `MobileAcceptanceApp`
   composition through the host activity's default factory, building all three default ViewModels
   (`MobileViewModel`, `F2bCatalogViewModel`, `MobileLocalLibraryViewModel`) with NO Telegram runtime —
   HOME composes and survives (H + Telegram-not-ready M). Every "no crash" claim is asserted via a
   default `UncaughtExceptionHandler`.
4. **Delivery blocklist (rollback safety).** Mobile code 23 (`0.4.4-phone-test:23`) is classified
   physically broken in `scripts/lib/mobile-apk-delivery.sh`: added to
   `pmtv_mobile_version_is_physically_broken` (so publishing code 24 over it is a `superseded` rotation
   that keeps the known-good code-22 `previous`) and to the rotation-identity allow-list (so the
   installed broken-code-23 `latest` is recognized and publication over it is possible) — exactly the
   code-17→18 precedent. New `test-mobile-apk-phone-delivery.sh` case
   `test_broken_code_twentythree_is_never_promoted_to_previous` (15 cases total).

Files: `app-mobile/.../MobileLocalLibraryViewModel.kt`, `MobileModels.kt`, `app-mobile/build.gradle.kts`;
new tests `MobileLocalLibraryStartupRegressionTest.kt`, `MobileStartupCompositionSmokeTest.kt`;
`scripts/lib/mobile-apk-delivery.sh`, `scripts/verify-mobile-apk.sh`,
`scripts/export-latest-mobile-apk-to-phone.sh`, `scripts/download-latest-ci-mobile-apk-to-phone.sh`,
`scripts/test-mobile-apk-phone-delivery.sh`, `scripts/test-download-latest-ci-mobile-apk-rejections.sh`,
`scripts/test-verify-upgrade-apks.sh`; `.github/workflows/android-ci.yml` (mobile build-metadata
version only); CHANGELOG/README/TODO/PROJECT_STATE/RELEASE_REVIEW/HANDOFF/TEST_PLAN/MOBILE_ACCEPTANCE
and the ADR 0024 amendment.

## Validation evidence

- Focused startup regressions green (17 tests): the two new suites above plus the retained
  `ProductionStartupCrashRegressionTest`, `F2bStartupFailSoftViewModelTest`, and
  `MobileManifestContractTest` (mobile 0.4.5-phone-test/24; TV 0.6.4-f2c4/27 unchanged).
- Broad: `./gradlew test lint :app-mobile:assembleDebug` BUILD SUCCESSFUL — all module unit tests green,
  lint clean, mobile debug APK assembled; `git diff --check` clean. No shared/core or TV production code
  changed, so TV was not rebuilt and stays at code 27.
- Script harnesses: mobile delivery 15 (incl. the new code-23 `superseded` case), mobile CI rejections
  20+1, upgrade verifier 13, credential scan 41, `bash -n scripts/*.sh scripts/lib/*.sh` — all passed.
- TDLib verify-only (NO rebuild): packaged JNI unchanged; local mobile debug APK verified
  0.4.5-phone-test (24), ARM64-only, one `lib/arm64-v8a/libtdjni.so`, Development signer.
- CI: exact-head `Android CI` run 32107205729 for 519c446 completed success (wrapper validation;
  official TDLib, tests, lint, signed TV/mobile assemblies, mobile artifact upload).

## Delivery evidence (mobile only)

Published via `./scripts/download-latest-ci-mobile-apk-to-phone.sh` from CI run 32107205729, artifact
`private-media-tv-mobile-apk-519c4468770439ccf9fb7a5d97a0b8d4f3d7f9ac`:

- Latest: `/storage/emulated/0/Download/PrivateMediaTV/Mobile/private-media-tv-mobile-latest.apk` —
  0.4.5-phone-test (24), APK SHA-256
  3456626dedfae5a7aa22aa8c80bd9d3d1ea5e8a2a0606be0f7f300e451e55685, 59,067,959 bytes, modified
  2026-08-18 07:17:40 UTC, ARM64-only, one `lib/arm64-v8a/libtdjni.so` (packaged JNI SHA
  790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f), Development signer verified.
- Rotation result: `superseded` — the broken code 23 `latest` was replaced in place and NOT promoted;
  `previous` remains the known-good code 22 build (0.4.3-phone-test, versionCode 22, APK SHA-256
  dbd43e27e938a88beaa86419e783a2f1946a8093d4d1bccede736229e7ad962e, 58,904,060 bytes, unchanged).
  Only the two canonical Mobile files exist; the TV `PrivateMediaTV/*.apk` files are untouched.
  Canonical rollback state: latest = code 24, previous = code 22.

## Not done / pending

- **Physical code-24 startup acceptance is PENDING** on the owner's phone — minimal first gate in
  `docs/MOBILE_ACCEPTANCE.md` F2C.4.1: install code 24 over the broken code 23 (no uninstall, no Clear
  Data); tap the icon; the app must open, stay open several minutes, HOME usable, no immediate crash.
  Then preservation smoke: Telegram/session present, Catalog opens, Downloads not wiped, Local Library
  (`ספרייה מקומית`) opens without a process crash. **F2C.4 physical acceptance is NOT claimed by this
  hotfix** and its full gates remain PENDING/re-run separately.
- F2C.4's documented bounded follow-ups are unchanged and out of scope here: full
  Continue-Watching/resume/auto-next parity for a catalog-BOUND local file and local-source priority
  ahead of Telegram discovery (AY); Source-Inspector structured-episode-code local lookup (I).
- TV code 27 is compile/regression evidence only; no TV delivery, no Shield.

## Continuation instructions

Next agent: obtain the owner's physical code-24 startup result first (MOBILE_ACCEPTANCE F2C.4.1 minimal
gate). If it still crashes, pull a real Android bug report before changing anything — do NOT re-guess.
Then re-run the full F2C.4 physical acceptance gates. Architecture decisions live in ADR 0024 (+ the
F2C.4.1 amendment). Reminders (see repo memory): mobile ViewModels reached by Compose `viewModel()`
MUST expose an exact `(Application)` JVM constructor — never rely on a Kotlin default argument for
reflection-based Android ViewModel construction; app-mobile Robolectric startup tests use
`@ConscryptMode(OFF)` + `@GraphicsMode(LEGACY)` + `@SQLiteMode(LEGACY)` and install a
BundledSQLiteDriver process DB reflectively (the framework driver fails under Robolectric); the
CI-authoritative mobile downloader is the final publication and it fails fast with empty logs when the
account's GitHub Actions minutes are exhausted (owner action, not a code fix); version bumps touch
~10 pin sites plus the mobile rotation allow-list, and a build proven physically broken must be added
to BOTH the rotation-identity allow-list and `pmtv_mobile_version_is_physically_broken`. The Local
Library DB stays at v1 (strictly-additive migration policy); do not couple the SAF lifecycle to the
Telegram catalog schema.
