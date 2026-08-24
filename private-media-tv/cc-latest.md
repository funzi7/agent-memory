# Private Media TV — F2C.7.1 Final (published code 31; physical owner acceptance pending)

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | `funzi7/private-media-tv` |
| Milestone | F2C.7.1 — physical code-30 runtime fixes: process-durable background downloads + `dataSync` foreground service, near-complete stall reconciliation, **explicit-download retention/detection/recovery** (reproduced code-30 defect: COMPLETE record persists but bytes vanished within hours), full persisted download identity, series-centric Known Sources with inheritance restoration, no-discovery Continue Watching tap, Local Library auto-binding, עב on CW/next-episode cards |
| Branch / tracking branch | `main` / `origin/main` |
| Starting application HEAD (this session) | `ec44de8c77dd220c424cdad5f8179fb1fd676205` (F2C.7 / code 30) |
| Final application HEAD | `76ee1561f6c1da90719c30f0d2dc814c02d85649` — equals `origin/main`; two commits pushed normally (no force): `769cad6` (milestone, 43 files) + `76ee156` (scoped CI-fix follow-up after post-push CI exposed a stale workflow version assertion) |
| Exact-head Android CI | `32738295230` — **success** for `76ee156` (Gradle wrapper validation + Official TDLib verify + unit tests + focused F2B.5 tests + lint + signed TV/mobile ARM64 assembly + APK identity/version/signer/TDLib-payload verify all green; exact-head TV+mobile artifacts uploaded). The prior run `32736133019` (`769cad6`) FAILED only at the TV APK version-name verify (workflow still asserted 0.6.10-f2c7/33). |
| Mobile identity | `com.funzi7.privatemediatv.mobile`, `0.4.12-phone-test`, versionCode 31 (updates code 30 in place — NO uninstall / NO Clear Data) |
| TV regression identity | `com.funzi7.privatemediatv`, `0.6.11-f2c71`, versionCode 34 (regression build only; **NOT delivered**) |
| Schemas | **Catalog v11→v12 additive** (offline_downloads presentation + localBytesMissing + lastProgressAt/retryCount/nextRetryAt columns; DELETE empty child affinity overrides); UserState v7 / Local Library v3 unchanged; 12.json committed |
| Development signer SHA-256 | `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` |
| Published mobile code-31 APK (CI build) | 59,546,512 bytes, SHA-256 `98bbebad3760001f67f13edb4669f340dbb033aad1df530116ddc053e8c0060e`, ARM64-only, pinned JNI `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f`, Development signer; rotated to `/storage/emulated/0/Download/PrivateMediaTV/Mobile/private-media-tv-mobile-latest.apk` (code 30 → previous) |
| TDLib | Pinned official commit unchanged; CI verified/packaged the pinned artifact; no rebuild |

## What changed this session (F2C.7.1; ADR 0029)

Physical code-30 owner evidence. Preserved: shared Local Library player + full controls,
Back-to-library, recursive scan/folder mapping, and the COMPLETE download RECORD surviving reopen.
Reproduced defect (fixed): that COMPLETE record's physical BYTES became unavailable within hours —
the card stayed COMPLETE yet offline playback failed with `הקובץ המקומי אינו זמין` / `הורד מחדש`.

1. **Process-durable downloads (§2/§3/§16).** New `MobileDownloadCoordinator` (process singleton)
   owns the engine scope, FIFO `Semaphore(2)`, controllers, and status→Room persistence OFF the
   ViewModel; `DownloadForegroundService` (`dataSync`, `FOREGROUND_SERVICE_DATA_SYNC` +
   `POST_NOTIFICATIONS`) keeps the process alive with the OS-required ongoing notification (canonical
   title incl. SxxEyy; tap → Downloads). Single TDLib client/runtime lease unchanged.
2. **Stall reconciliation (§5).** Real-byte no-progress watchdog + `ProviderOfflineDownloadController.reconcile()`
   re-queries TDLib `GetFile`: a genuinely-complete file promotes to COMPLETE (659/660 MiB fix), a
   stalled transfer resumes. Owner PAUSE never auto-resumed; complete never restarted from zero.
3. **Explicit-download retention/detection/recovery (§6 — the headline).** Retention chain audited
   factually: the COMPLETE record lives in Room; the playable bytes live behind the TDLib cache
   ledger + physical file; `TdLibMediaCacheManager` already excludes `explicitlyPinned` entries from
   eviction under BOTH the 30-day TTL and low storage, and its only DeleteFile path is double-guarded
   — now PROVEN by regression tests, so the app's own maintenance is not the deleter. Added:
   (a) proactive launch-time runtime-free presence reconciliation
   (`reconcileCompletedOfflineDownload` → `TelegramOfflineLocalPlayback`, ledger+files only)
   distinguishing COMPLETE_AND_PRESENT vs COMPLETE_RECORD_BUT_LOCAL_FILE_MISSING WITHOUT a play-tap →
   truthful durable `localBytesMissing` marker (schema v12; `clearOfflineDownloadLocalMissing` on
   recovery), never deleting the record/pin; (b) `reconcile()` no longer skips COMPLETE so a TDLib
   path/file-id refresh no longer orphans the pinned file and a vanished complete file is re-added to
   recover its bytes.
4. **Full persisted download identity (§7)** `<Series>·SxxEyy·<Episode>` / `<Movie> (year)` +
   quality/state/bytes/percent, schema v12, offline, never a raw Telegram filename.
5. **Series-centric Known Sources (§9)** — SERIES-level affinity by default; clearing a child scope
   RESTORES inheritance; v12 migration repairs accidental empty per-season/episode overrides.
6. **No discovery from a Continue Watching tap (§12)** — opens details and stops.
7. **Local Library auto-binding (§13)** — single-safe TMDB resolve → AUTOMATIC bind → progress
   reconcile → Continue Watching. **עב on CW/next-episode cards + recommendation-card
   original_language (§14).** **`חדש בישראל` placement verified unchanged (§15).**

Test/infra correctness fixed this session (were failing the full build after the F2C.7 base):
- `F2bCatalogViewModel` now INJECTS the download coordinator (production = process singleton; host
  tests = isolated coordinator over the injected data source + `NoOpDownloadForegroundController`),
  so constructing the ViewModel with a fake data source no longer NPEs on real Android/OS resources
  (this had broken ~196 host ViewModel tests).
- Catalog v11→v12: `CatalogDatabaseTest` asserts user_version 12; the shared JVM helper
  `openTestCatalogDatabase` registers the full migration set so reopening an older on-disk fixture
  migrates forward.
- `DownloadForegroundService` assigns `intent.flags` (not `.setFlags(`) and carries no forbidden
  window-flag token — satisfying the mobile screenshot-policy source scan (which matches comments).
- `F2cPlaybackFirstViewModelTest` AF Test 10 rewritten to the §12 contract (definitive failure →
  open details, zero discovery, no pointer commit) — the old test asserted the removed CW-discovery.
- Mobile-delivery rotation allow-list (`scripts/lib/mobile-apk-delivery.sh`) recognizes
  `0.4.11-phone-test:30` now that expected is `0.4.12-phone-test:31`.
- `.github/workflows/android-ci.yml` TV verify assertion + TV/mobile metadata printf blocks bumped
  to 0.6.11-f2c71/34 and 0.4.12-phone-test/31 (the CI-fix follow-up commit).

Deferred to F2C.7.2 (documented, NOT implemented): protected-source capability model (§8),
index-backed AVAILABLE/LIKELY/UNKNOWN passive availability + CW exact-indexed probe (§10), background
auto-download scheduler trigger (§17), and runtime-driven re-assertion of TDLib download-list
membership on every launch (the strongest OS-reclamation defense; the §6 detection/recovery layer
landed this milestone).

Docs updated: ADR 0029 (retention-chain audit + §6 upgrade), CHANGELOG, PROJECT_STATE, HANDOFF,
MOBILE_ACCEPTANCE (14-item code-31 checklist).

## Validated vs pending

- **Validated locally:** `heavy-run -- ./gradlew test lint :app-mobile:assembleDebug
  :app-tv:assembleDebug` → BUILD SUCCESSFUL (all module unit/Robolectric/migration tests, lint, both
  signed debug APKs). New retention tests green: cache-manager pin-never-evicted (TTL + low storage),
  ledger survives restart, locator refresh preserves pin; resolver present/missing/locator-refresh;
  repo mark/clear missing marker; ViewModel startup presence reconciliation (present→clear /
  missing→mark). Mobile delivery/rejection/upgrade-verifier bash suites pass; `git diff --check` clean.
- **Validated remotely:** exact-head Android CI `32738295230` success for `76ee156`; exact-head
  mobile APK downloaded + rotated to the phone (code 30 → previous, code 31 → latest).
- **PENDING (no ADB on host — owner physical acceptance):** on-device background-download
  continuation AND long-horizon completed-byte retention (a completed download's bytes staying
  available over hours). The owner runs the 14-item `docs/MOBILE_ACCEPTANCE.md` code-31 checklist.
- **NOT done (by constraint):** NO TV delivery, NO Shield delivery, NO TV/mobile APK rebuild of
  pinned TDLib.

## Exact next milestone (F2C.7.2)

Runtime-driven re-assertion of TDLib download-list membership on every launch (strongest defense
against OS/TDLib byte reclamation) building on the §6 detection/recovery already shipped; the
protected-source capability model (§8) replacing global PROTECTED rejection with
DISCOVERABLE/PLAYABLE/OFFLINE_DOWNLOADABLE/EXPORTABLE; index-backed passive availability
AVAILABLE/LIKELY/UNKNOWN with the CW exact-indexed-source probe (§10) and zero passive Telegram
search; the background auto-download scheduler trigger (§17). Await the owner's code-31 physical
results first and fold any new evidence in.

## Continuation instructions

Start at HEAD `76ee156` on `main` (== origin/main). Do NOT reset/clean/stash/force-push or rebuild
TDLib. Heavy builds via `/root/work/bin/heavy-run -- ./gradlew …` (device-wide build lock; not on
PATH). Preserve the working completed-download RECORD persistence and the §6 retention invariants.
When bumping versions, also touch `.github/workflows/android-ci.yml` (TV verify assertion + both
metadata printf blocks) and the mobile rotation allow-list in `scripts/lib/mobile-apk-delivery.sh` —
both are easy-to-miss pin sites that only fail in CI / the delivery bash suite. Publication is the
exact-head mobile CI downloader after `Android CI` passes; never deliver TV/Shield.
