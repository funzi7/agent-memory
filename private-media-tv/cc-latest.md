# Private Media TV — F2C.7.2 Final (mobile-test phase; published code 32; physical owner acceptance pending)

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | `funzi7/private-media-tv` |
| Milestone | F2C.7.2 — mobile-test phase: §8 protected-source playback capability, §10 index-backed availability, §12 CW exact-index tap, §17 background auto-download, §6/§19 runtime retention re-assertion, verified-physical offline-play, Series-Eye latency, recommendation ranking, §20 `חדש בישראל` monitored absence→presence, and a §5 watchdog test-infra hang fix |
| Branch / tracking branch | `main` / `origin/main` |
| Starting application HEAD (this session) | `76ee1561f6c1da90719c30f0d2dc814c02d85649` (F2C.7.1 / code 31) |
| Final application HEAD | `da3b612a95666fd22098e8e267a4e729e35ed20f` — equals `origin/main`; ONE commit `da3b612` pushed normally (no force), 48 files changed +3 new |
| Exact-head Android CI | `32764321654` — **success** for `da3b612` (Gradle wrapper validation + Official TDLib verify + unit tests + focused tests + lint + signed TV/mobile ARM64 assembly + APK identity/version/signer/TDLib-payload verify + mobile delivery/rejection bash suites all green; exact-head TV+mobile artifacts uploaded) |
| Mobile identity | `com.funzi7.privatemediatv.mobile`, `0.4.13-phone-test`, versionCode 32 (updates code 31 in place — NO uninstall / NO Clear Data) |
| TV identity | `com.funzi7.privatemediatv`, `0.6.11-f2c71`, versionCode 34 — **UNCHANGED** (no TV bump). TV/Shield application + delivery deferred to a LATER phase per owner correction |
| Schemas | **No migration this milestone.** Catalog v12, UserState v7, Local Library v3, territory-availability v3 all unchanged (§10/§17/§20 use existing schema) |
| Development signer SHA-256 | `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` |
| Published mobile code-32 APK (CI build) | 59,843,480 bytes, SHA-256 `82c5c1681ac12aa24eba04e2d97e6c4418470e4604090a22a0764f3632764dab`, ARM64-only, pinned JNI `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f`, Development signer; rotated to `/storage/emulated/0/Download/PrivateMediaTV/Mobile/private-media-tv-mobile-latest.apk`. **latest=code 32; previous=code 31** (SHA `98bbebad3760001f67f13edb4669f340dbb033aad1df530116ddc053e8c0060e`, byte-identical to the F2C.7.1 published code-31 APK); broken **code 23 excluded** from promotion; TV/Shield delivery files untouched |
| TDLib | Pinned official commit unchanged; CI verified/packaged the pinned artifact; no rebuild |

## Truthful physical code-31 owner evidence (this milestone's targets)

`עב` Hebrew-language badge = **PASS**. `חדש בישראל` row = **FAIL** (entirely absent on Home).
COMPLETE-download Play = **FAIL** (hangs on `מכין ניגון…`). `זמין מהמכשיר` from `COMPLETE` state alone =
**FAIL** (not verified bytes). Series-Eye tap = **FAIL** (visibly slow). End-screen recommendation
ranking = **FAIL** (near-raw TMDB order).

## What changed this session (F2C.7.2; ADR 0030)

1. **§8 protected sources are a capability, not a global reject.** A protected chat is discoverable,
   selectable and **playable (streaming)** when TDLib permits. `TelegramMediaSummary.playbackOnly`
   (`!message.canBeSaved || chat.hasProtectedContent`) yields a playable `TelegramPlayableMedia` with a
   **null** offline controller, so forward/save/export restrictions are never bypassed. Catalog
   `usableAsSource` (SUPPORTED ∪ PROTECTED); adapter merges PROTECTED into the eligible branch; gateway
   no longer short-circuits protected. Mobile `F2bSourceEligibility.selectable`/`.playbackOnly`;
   Add-Sources shows the truthful `מוגן — ניגון בלבד (ללא הורדה/ייצוא)` status (via `sourceStatusLabel`)
   with an ENABLED add action; INACCESSIBLE/UNSUPPORTED stay disabled.
2. **§10 index-backed availability.** `SourceIntelligence.passiveAvailability` → AVAILABLE/LIKELY/
   UNKNOWN from local state only, **zero** passive Telegram search; UNKNOWN never renders as
   "no source"; annotated on Home/Search/Details/CW (`sourceAvailabilityByKey` + `verifiedPresentDownload`).
3. **§12 CW exact-index tap.** complete download → exact bound/auto local → exact indexed playable
   Telegram → warm/last-known → else Episode Details; no discovery from the Home-row tap.
4. **§17 background auto-download.** Durable WorkManager (`work-runtime-ktx` 2.10.0) unique periodic
   worker drives the ONE `MobileDownloadCoordinator` engine; OFF by default (UserState v7); one enqueue
   per newly-aired REGULAR episode; no Specials/future; bounded backoff; re-armed at launch.
5. **§6/§19 runtime retention re-assertion.** On launch every COMPLETE is re-asserted against TDLib
   `reconcile()`: present → re-pin + persist COMPLETE (clears stale missing marker); reclaimed →
   recover through the one engine (never a restart from zero); record never dropped; idempotent per key.
6. **Verified-physical offline-play.** COMPLETE record ≠ verified bytes: local-first resolve against
   `verifyOfflineDownloadPresent` into the ONE shared player, no discovery/no hang; `זמין מהמכשיר` and
   `פרקים זמינים` reflect verified bytes; preparing has terminal states (generation token, bounded
   `withTimeoutOrNull(25s)`, success→player, missing→`הקובץ המקומי אינו זמין`+`הורד מחדש`, Back cancels).
7. **Series-Eye optimistic transition** (immediate UI, async single-transaction persist, reversible
   `SERIES_EYE` provenance) + **recommendation ranking** (similarity → genre/theme → franchise/
   collection → language/origin/network → vote/popularity → recency, with a recency penalty).
8. **§20 `חדש בישראל` monitored authoritative absence→presence.** Durable negatives re-checked on
   refresh (`titlesWithDurableAbsence`, bounded) establish real arrivals going forward; F2C.6.1 fix
   preserved (no "first observation" false positives; no fabricated past dates; RETURNED/DAY_ONE out).

**Test-infra bug fixed (root cause + fix — remember this class).** A retention-recovery unit test
drove the intentionally-recurring §5 stall watchdog on a virtual `StandardTestDispatcher`; the test
body used `runCurrent()` correctly, but `runTest`'s implicit end-of-test `advanceUntilIdle()` spun the
watchdog's `while(isActive){ delay(15s); reconcile() }` loop forever under virtual time (ONE test
consumed CPU for 80+ minutes; the real-time `runTest` timeout can't fire during a virtual-time spin).
Fix: the watchdog **self-terminates when no transfer is active** (`hasActiveTransfer()`; re-armed by
`ensureWatchdog` on new work) — also removes a real production waste — plus
`MobileDownloadCoordinator.shutdown()` cancels the engine scope; affected tests call `shutdown()` as
explicit completion signalling. NOT a timeout bump/skip/delete.

Docs updated: ADR 0030, CHANGELOG, PROJECT_STATE, HANDOFF, MOBILE_ACCEPTANCE (F2C.7.2 code-32
checklist), TODO, UX_DECISIONS (§8), RELEASE_REVIEW.

## Validated vs pending

- **Validated locally (mobile-only per owner correction):** `:app-mobile:testDebugUnitTest`
  (0 failures across all suites; `F2c71DownloadAndBindTest` now 16 tests / 2.9s, no hang;
  `MobileManifestContractTest` 9/9 post-bump), changed-core module tests (core-catalog/-metadata/
  -telegram/-locallibrary/-provider, 0 failures), `:app-mobile:lintDebug` (no Error/Fatal),
  `:app-mobile:assembleDebug` (59.8 MB APK), mobile delivery/rejection/upgrade bash suites, `git diff
  --check` clean. **Did NOT build app-tv locally** (owner correction); CI builds it (green).
- **Validated remotely:** exact-head Android CI `32764321654` success for `da3b612`; exact-head mobile
  code-32 APK downloaded + rotated (code 31 → previous, code 32 → latest; code 23 excluded).
- **PENDING (no ADB on host — owner physical acceptance):** the code-31 FAILs above (offline-play,
  `חדש בישראל`, Series-Eye latency, ranking) + protected playback (§8), passive availability (§10),
  background auto-download (§17), and long-horizon byte retention. **No code-32 physical acceptance is
  claimed.** Owner runs the `docs/MOBILE_ACCEPTANCE.md` F2C.7.2 code-32 checklist.
- **NOT done (by constraint):** NO TV bump, NO TV delivery, NO Shield delivery, NO TDLib rebuild.

## Exact next steps

Await the owner's code-32 physical results and fold new evidence in. The **later phase** is the
TV/Shield application: bump TV, build/regress app-tv, and deliver to the Shield — only after the owner
accepts this mobile-test build.

## Continuation instructions

Start at HEAD `da3b612` on `main` (== origin/main). Do NOT reset/clean/stash/force-push or rebuild
TDLib. Heavy builds via `/root/work/bin/heavy-run -- ./gradlew …` (device-wide build lock; not on
PATH) — ALWAYS wrap a test run in `timeout` so a future virtual-scheduler spin can't burn hours.
`heavy-run` swallows gradle stdout to a 28-byte tail; read the JUnit XML under
`*/build/test-results/*/*.xml` for authoritative pass/fail. When bumping mobile versions, touch every
pin: `app-mobile/build.gradle.kts`, `MobileModels.kt`, `.github/workflows/android-ci.yml` MOBILE
metadata printf (leave TV assertion/metadata), `scripts/lib/mobile-apk-delivery.sh` rotation allow-list
(add the PREVIOUS `name:code`), `verify/export/download` scripts' `EXPECTED_VERSION_NAME`+
`EXPECTED_VERSION_CODE`, and `test-mobile-apk-phone-delivery.sh` (header + self-assert grep +
`CODE_*_BASELINE` version()/code() maps + rotation-test rename) / `test-download-latest-ci-mobile-apk-
rejections.sh` (`valid_version_name`+`valid_version_code`) / `test-verify-upgrade-apks.sh`.
`MobileManifestContractTest` reads `build.gradle.kts` at RUNTIME — never edit versions mid-test-run.
Publication is the exact-head mobile CI downloader after `Android CI` passes; NEVER deliver TV/Shield
this phase; never bypass TDLib forward/save/export restrictions.
