# Private Media TV — F2B.5.2.1 Handoff

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | funzi7/private-media-tv |
| Milestone | F2B.5.2.1 — Emergency mobile startup crash hotfix (release blocker) |
| Branch / tracking branch | main / origin/main |
| Starting application HEAD | c8ef6a6c11e78486b6ecd5e94ee1e6d527efb201 |
| Final application HEAD | 3910fc8c6b1b354df795302eafde982404e83a28 |
| Starting agent-memory HEAD | b954ae98ff922fe4cb7dd8f8c48971c3fa55a2bf |
| Exact-head Android CI | 31884520652 — success |
| Mobile identity | com.funzi7.privatemediatv.mobile, 0.3.10-phone-test, versionCode 18 (updates broken code 17 in place) |
| TV regression identity | com.funzi7.privatemediatv, 0.5.9-f2b52, versionCode 22 (unchanged; regression build only) |
| Development signer SHA-256 | 2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0 |

One hotfix commit on main, pushed without force; the final application HEAD matches origin/main.
Exact-head Android CI passed and uploaded both signed artifacts; only the mobile artifact was
downloaded and published. No TV export/delivery, no Shield, no adb device attached.

## Why F2B.5.2.1 exists (sanitized physical evidence)

Mobile code 17 (0.3.9-phone-test) physically crashed immediately on application startup on the
owner's Samsung phone. A real Android bug report captured the fatal exception: an uncaught
retryable `CatalogAdapterException` (safeCode `PMTV-SOURCE-RUNTIME-NOT-READY`, retryable=true) on
`DefaultDispatcher-worker-3`, stack `ProcessRuntimeCatalogBridge.providerAdapters` →
`contentUpdateGapSignals` → `ProductionF2bSourceDiscoveryBackend` background worker.

Root cause: the F2B.5.2 content-gap maintenance worker (launched in the backend's init) subscribed
to the provider gap-signal stream before Telegram authorization reached Ready. `providerAdapters()`
intentionally throws retryable RUNTIME_NOT_READY in that state — a normal startup lifecycle
condition — but unlike the sibling live-updates loop, the content-gap worker had no lifecycle/retry
protection, so the exception escaped the coroutine uncaught and Android killed the process. There
was no evidence of Telegram session, Room, FTS-index, credential, or APK/native corruption; those
boundaries were not touched.

## What the hotfix changed (application HEAD 3910fc8c)

1. **Runtime-gated maintenance supervisor** (`superviseRuntimeGatedMaintenance`, internal seam in
   `ProductionF2bSourceDiscoveryBackend.kt`), now running BOTH live-index workers (content-gap and
   live-updates): safe construction while NOT_READY; bounded cancellation-aware wait for Ready
   before each attach; retryable adapter failures are transient lifecycle state (no staleness
   recorded); stream completion / non-retryable / unexpected failures invoke a contained
   stale-marking hook (rows never deleted) and reattach after a bounded 2 s delay;
   `CancellationException` always propagates. No hot spin, no duplicate workers, no second TDLib
   client, no faked Ready.
2. **Single-source index collector containment** (`F2bCatalogViewModel.buildSourceMetadataIndex`):
   the backend's `MetadataIndexRuntimeUnavailableException` rethrow (previously caught only by the
   aggregate Index All coordinator) could escape `viewModelScope` uncaught — reachable through the
   F2B.5.2 no-tap auto-index of a newly selected source while not Ready. Now contained as the
   single-source WAITING equivalent (checkpoint retained, waiting notice, auto-resume on the next
   runtime-ready signal); unexpected failures stop safely.
3. **Fail-soft startup invariant** (`launchFailSoftObserver`): the catalog ViewModel startup
   observers (metadata refreshes, runtime-ready signals, offline downloads, library collections)
   are contained and reattach after a bounded delay; HOME is reached and kept alive while Telegram
   is STARTING / NOT_READY / recovering.
4. **Delivery rollback protection** (`scripts/lib/mobile-apk-delivery.sh`): a physically broken
   version is never promoted into the canonical `previous` slot —
   `pmtv_mobile_version_is_physically_broken` (currently 0.3.9-phone-test:17) plus a new
   `superseded` rotation outcome that replaces `latest` in place and leaves `previous` untouched;
   `0.3.9-phone-test:17` was added to the rotation recognition allow-list only so publication over
   the installed broken build is possible.
5. Version: mobile 17→18 across build.gradle.kts, MobileModels constants, CI metadata, and all
   script pins. TV untouched (no TV or shared production code changed).

## Validation evidence

- Focused regressions (all green, red-by-construction against the pre-fix escape):
  `MaintenanceSupervisionTest` (9 tests; virtual time; explicit `CoroutineExceptionHandler`
  assertions for spec Tests 1–4: pre-Ready quiet wait + attach + gap processing;
  Ready→unavailable→Ready single reattach; cancellation propagation both waiting and attached;
  contained unexpected failure with bounded retry; retryable/non-retryable classification; stream
  completion reattach; contained interruption/readiness-probe failures; cancellation-only
  termination). `ProductionStartupCrashRegressionTest` (Robolectric; REAL Owner→backend→bridge→Room
  composition over a bundled-driver process database; code16-like persisted state with a READY
  index + PARTIAL Index All checkpoint; runtime present but not Ready; default
  uncaught-exception-handler asserted empty; retained rows survive; after Ready the gap worker
  attaches and a replayed gap signal marks the re-READY index STALE with
  `PMTV-INDEX-CONTENT-GAP-STALE`; plus a HOME smoke over the production data source with no runtime
  at all). `F2bStartupFailSoftViewModelTest` (3 tests: WAITING containment, safe-stop containment,
  fail-soft observer reattach). `MobileCatalogUiContractTest` wiring assertions.
  `scripts/test-mobile-apk-phone-delivery.sh` new case
  `test_broken_code_seventeen_is_never_promoted_to_previous` (14 cases total).
- Full local: `./gradlew test` — 1232 tests, 0 failures/errors across all modules (287 in
  app-mobile); `./gradlew lint` clean; `:app-mobile:assembleDebug` and `:app-tv:assembleDebug`
  BUILD SUCCESSFUL; `git diff --check` clean.
- Script harnesses: credential scan 41, TV delivery 9, mobile delivery 14, pmtprov 4, upgrade
  verifier 13, TV CI rejections 8, mobile CI rejections 20+1 — all passed; `bash -n` clean.
- TDLib verify-only (NO rebuild): pinned commit 022d60202e446ad1287b9fb68e687c8a0760788b, ARM64
  AAR sha 025313d2a7cdbf148e5c700e8ef6c9d384f2301aff043c844997e0c23eb9abd2.
- CI: exact-head `Android CI` run 31884520652 for 3910fc8c… completed success.

## Delivery evidence (mobile only)

Published via `./scripts/download-latest-ci-mobile-apk-to-phone.sh` from CI run 31884520652,
artifact `private-media-tv-mobile-apk-3910fc8c6b1b354df795302eafde982404e83a28`:

- Latest: `/storage/emulated/0/Download/PrivateMediaTV/Mobile/private-media-tv-mobile-latest.apk`
  — 0.3.10-phone-test (18), APK SHA-256
  c6c57598f9e7d6604a5c2ce34ee6885e85695a874385cb8836d313048b921060, 58,633,880 bytes, modified
  2026-08-15 12:40:43 UTC, ARM64-only, one `lib/arm64-v8a/libtdjni.so` (packaged JNI sha
  790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f), Development signer verified.
- Rotation result: `superseded` — broken code 17 was REPLACED, not demoted; previous remains the
  known-good code 16 (0.3.8-phone-test), byte-identical to before publication (SHA-256
  e37df5ba2239b8958df044f538964309ff8c4c97a57566a44589be7d3fefaa2d). Post-publication re-verified
  with `verify-mobile-apk.sh` (note: its `--expected-sha256` flag means the expected SIGNER digest,
  not the APK content hash).
- Only the two canonical Mobile files exist; TV files untouched.

## Not done / pending

- **Physical code-18 acceptance is PENDING** on the owner's phone (gates in
  `docs/MOBILE_ACCEPTANCE.md`): install over code 17 (no uninstall/clear-data), app stays open and
  HOME appears, session retained, index counts/PARTIAL work retained, app alive while Telegram
  becomes Ready, Index All resumes, exact binding + playback, keep-screen-on. Automated tests are
  not physical evidence.
- F2B.5.2 physical code-17 acceptance is recorded as FAILED at startup (superseded by code 18).

## Continuation instructions

Next agent: obtain the owner's physical code-18 result first. If gate 1 fails again, pull a new
Android bug report before changing anything. If acceptance passes, record it in
`docs/MOBILE_ACCEPTANCE.md`/`PROJECT_STATE.md` and remove `0.3.9-phone-test:17` from future
promotion consideration (it stays blocklisted in `pmtv_mobile_version_is_physically_broken`).
Architecture notes live in ADR 0019's F2B.5.2.1 amendment; the full milestone record is in
CHANGELOG / PROJECT_STATE / TEST_PLAN / RELEASE_REVIEW / HANDOFF at the application HEAD above.
