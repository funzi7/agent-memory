# Private Media TV — F2B.5.2 Handoff

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | funzi7/private-media-tv |
| Milestone | F2B.5.2 — Runtime survivability, automatic index continuity, and source-inventory recovery |
| Branch / tracking branch | main / origin/main |
| Starting application HEAD | bd59754e14123e199381417664969d3513806781 |
| Final application HEAD | c8ef6a6c11e78486b6ecd5e94ee1e6d527efb201 |
| Starting agent-memory HEAD | 4b8d84ccf515c30179db98ebf6b0c374a3de49b4 |
| Exact-head Android CI | 31862292848 — success |
| Mobile identity | com.funzi7.privatemediatv.mobile, 0.3.9-phone-test, versionCode 17 (updates code 16 in place) |
| TV regression identity | com.funzi7.privatemediatv, 0.5.9-f2b52, versionCode 22 (built and verified only) |
| Development signer SHA-256 | 2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0 |

The milestone was committed once on main and pushed without force; the final application HEAD matches
origin/main. Exact-head Android CI passed (Gradle wrapper validation and the official-TDLib/tests/lint/signed-APK job) and uploaded both signed artifacts; only the mobile artifact was downloaded and published to the isolated Mobile shared-storage directory, rotating the code-16 APK to `previous`. The TV artifact is a shared-code regression, never downloaded, exported,
installed, or deployed. No Shield command ran. No physical device was attached (`adb devices` empty),
so physical code-17 acceptance is pending on the owner's phone.

## Why F2B.5.2 exists

On mobile code 16 the owner physically hit a runtime-survivability defect independent of search: after
a native TDLib start failed, repeated Retry could not recover and only an Android Force Stop restored
operation. The session/database were intact (Force Stop + reopen restored Telegram, Index All resumed,
and a newly joined source appeared), so the fault was process-local runtime ownership, not session
data. Physical code-16 evidence, preserved: known-source Search Engine V2 repair works (a previously
failing real TV episode was found again); owner literal -> explicit bind -> playback works; local-index
search returns real media; Index All retained ~2,035–2,064 indexed rows across a failed all-source
operation; the newly joined source appeared after runtime recovery. F2B.5.2 removes the need for Force
Stop and makes the index survive runtime loss. It is not a Search Engine rewrite.

## Root cause and repairs

A Java-side update/result handler exception fires `TdLibClientGateway.handleNativeFailure()`, which
poisons the `CallbackRequestBridge` (`failAll`). The native client is still alive, but a Close routed
through the poisoned bridge returned `NATIVE_FAILURE`; the gateway's synthesized-Closed fallback only
matched `CLIENT_CLOSED`, so no genuine `AuthorizationStateClosed` arrived, the lease stayed held, and
the phone reported `PMTV-TDLIB-RUNTIME-LEASE`. Repairs:

1. **Real Close on a poisoned-but-alive client.** `close()` sends `TdApi.Close()` directly to the
   native client, bypassing the bridge; the genuine Closed releases the lease. Ownership is never faked.
2. **Coalesced `TelegramRuntime.recover()`.** Released -> one restart; retained -> drive Close, await
   real Closed within a bounded window, release, one restart; else `AwaitingClose` (no lease error, no
   second client). Concurrent Retry taps coalesce. Exposes `TelegramRuntimeRecoveryStatus`.
3. **Coordinated recover-once** for recoverably-failed runtimes at the source-discovery backend owner
   (covers search, My Sources refresh, index continuation, hydration); fatal states never retried.
4. **Non-fatal content-update backpressure.** Runtime stays Ready; dropped message-boundary updates
   advance a durable `contentUpdateGapRevision`; file-state chatter is coalesced. Delivered as a
   distinct `contentUpdateGapSignals` stream.
5. **Incremental idempotent catch-up.** Gap stales READY jobs; catch-up walks newest history to the
   previously-indexed boundary (`newlyIndexedInPage == 0`), then finalizes READY. No FTS4 schema-11
   change, no full-history rescan, no duplicate rows.
6. **Index All continuity + UX.** `WAITING_FOR_TELEGRAM` state, auto-resume-on-ready, new-source
   auto-index; cached-inventory-preserving refresh + auto-retry; ineligible-source disabled visibility;
   safe runtime diagnostics; reworked Index All status; playback `keepScreenOn` on the common surface.

## Preserved and unchanged

Search Engine V2, the local Room/FTS4 index (schema 11), the Telegram-X-derived pager, the
AUTO-8/maximum-12 live pool, exact binding, the F2B.5.1 known-source natural query and reserved
`GetChatHistory` fallback, parser-uncertain POSSIBLE, contradiction rejection, owner literal,
progressive results, truthful DEADLINE/EXHAUSTED/PARTIAL terminals, offline local search (not gated on
`currentAccountScope()` before a valid local/index/exact result), Media3 playback, the TDLib byte
cache/downloads, TMDB identity, and the local library. Official TDLib 1.8.66 remains the single runtime.

## Modules and files

core-telegram: `TdLibClientGateway` (real Close), `TelegramSessionController` (recover + gap),
`TelegramRuntime`, new `TelegramRuntimeRecovery`, `TelegramCatalogSourceAdapter` (gap signal).
core-catalog: `CatalogContracts` (contentUpdateGapSignals), `SourceIntelligence` (newlyIndexedInPage,
completeMetadataIndexCatchUp). core-playback: `PlaybackController` (playbackKeepsScreenOn),
`Media3PlaybackController` (keepScreenOn surface). app-mobile: `ProductionF2bSourceDiscoveryBackend`
(recover-once, gap collector, catch-up loop, WAITING), `F2bSourceIndexCoordinator`
(WAITING_FOR_TELEGRAM), `F2bCatalogViewModel` (runtime-ready observer, auto-index, refresh notice),
`F2bCatalogDataSource` (runtimeReadySignals), `F2bCatalogModels`/`F2bCatalogScreens` (eligibility +
status UX), `MobileRuntimeFacade`/`MobileViewModel`/`MobileModels`/`MobileAcceptanceApp` (facade
recover, diagnostics), `MobilePlayerOverlay` (keepScreenOn). Versions: gradle, MobileModels, CI, and
the contract test.

## Validation actually run

`./gradlew test` — green except one pre-existing flaky Robolectric paging test
(`F2bCatalogPagingAndProviderComposeTest > real LazyRow retries one failed append…`) that passes in
isolation and is unrelated to F2B.5.2. `./gradlew lint` — BUILD SUCCESSFUL.
`./gradlew :app-mobile:assembleDebug :app-tv:assembleDebug` — both debug APKs built.
`./scripts/bootstrap-tdlib-android.sh --verify-only` and `./scripts/verify-tdlib-artifact.sh` — TDLib
1.8.66 (`022d60202e446ad1287b9fb68e687c8a0760788b`), ARM64, no rebuild. `git diff --check` — clean.
Focused regressions added at the controller (recover RETAINED/AwaitingClose/coalescing/backpressure),
repository (bounded idempotent catch-up), coordinator (WAITING), ViewModel (auto-index), compose
(inventory notice + eligibility), and playback (screen-awake) levels.

## APK and CI delivery results

Exact-head Android CI run 31862292848 for c8ef6a6c11e78486b6ecd5e94ee1e6d527efb201 passed and uploaded both signed artifacts. Only the mobile artifact was downloaded and published; the TV artifact was built and verified but never downloaded, exported, installed, or deployed.

- Mobile latest: `/storage/emulated/0/Download/PrivateMediaTV/Mobile/private-media-tv-mobile-latest.apk`
- Package `com.funzi7.privatemediatv.mobile`, version `0.3.9-phone-test` (17), arm64-v8a only
- APK SHA-256: `295ab184e90c3ed6250ea76fa91d2b38c2ada732d5e7e573be5b0d35e38477a2`
- TDLib JNI (`libtdjni.so`) SHA-256: `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f`
- Certificate SHA-256: `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0`
- Size 58,633,880 bytes, published 2026-08-15 03:57:36 UTC, rotation: rotated (code 16 -> previous)
- No TV export/delivery. No Shield command ran. No physical device attached (`adb devices` empty).

## Physical status and omitted checks

No physical device was attached; physical code-17 acceptance (retained index/binding, retry recovery
without Force Stop, Index All wait/resume, inventory refresh, indexed search, catch-up, player
screen-awake) is pending on the owner's phone. The gateway poisoned-client Close runs against the real,
un-fakeable TDLib `Client`; it is validated end-to-end at the controller level and must be confirmed
physically.

## Limitations and risks

"All-source maintenance active" is derived from persisted index-job presence (no new entity/schema); a
never-indexed source does not auto-index on select. The runtime-ready observer polls readiness on a
bounded interval in production. If TDLib truly cannot deliver Closed, recovery reports `AwaitingClose`
and keeps retrying (never a lease error); a genuine wedged native process would still require a process
restart, but the physical evidence shows the session/database intact and recoverable.

## Unresolved decisions

None new. F2B.5.2 hardened survivability without changing what is indexed, searched, or selected, so no
product-intent escalation was required.

## Exact next milestone and continuation

Physical code-17 acceptance on the phone, then any owner-directed follow-up. Do not reopen Search
Engine V2, the FTS4 schema-11 index, or normal live fan-out. Continue on main from
c8ef6a6c11e78486b6ecd5e94ee1e6d527efb201.
