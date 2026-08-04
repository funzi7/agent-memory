# Private Media TV — F1D.5 Handoff

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | `funzi7/private-media-tv` |
| Milestone | F1D.5 — persistent TDLib media cache, warm resume, faster streaming, and complete player controls |
| Branch / tracking branch | `main` / `origin/main` |
| Starting application HEAD | `2c97790b08178658b8ca37c0d66832d94fd954dd` |
| Final application HEAD | `cd0865762d3db304d265a0972a4c40731e9e4d56` |
| Starting agent-memory HEAD / parent | `1cd7694a693919e8e60152ecc886ed7cbcd14462` |
| Mobile identity | `com.funzi7.privatemediatv.mobile`, `0.1.5-phone-test`, `versionCode` 6 |
| TV identity | `com.funzi7.privatemediatv`, `0.3.8-f1c7`, `versionCode` 11 |
| Development signer SHA-256 | `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` |

The application milestone commit was pushed without rewriting history. Application `HEAD` and
`origin/main` both resolve to the final application SHA above. Exact-HEAD Android CI succeeded and
the exact-HEAD mobile artifact was downloaded, reverified, and published only to the package-
specific Mobile directory. The TV APK was built and inspected locally and in CI but was not
exported, downloaded to shared storage, installed, or deployed.

## Authoritative physical code-5 baseline

The owner physically updated and tested mobile code 5 before F1D.5. Established facts are:

- credentials and the authenticated Telegram session survived the update;
- real Telegram media played with visible video and audible audio;
- F1D.4 adaptive buffering performed better than the preceding build; and
- performance and reopen reuse could still be improved.

Those observations prove authorization, discovery, byte-range delivery, Media3 decoding, visible
video, and audible audio. They do not prove code-6 cache retention, warm reattachment, controls,
tracks, long-playback performance, process-death restoration, or Shield behavior. No native TDLib
defect was present or repaired.

## Outcome

F1D.5 makes TDLib's existing package-private downloaded file the authoritative persistent media-
byte cache, adds a bounded one-player warm session and versioned resume state, advances range
selection to 16 → 32 → 64 MiB, selects exact device-specific Media3 profiles, and introduces an
always-left-to-right playback timeline. Provider-neutral player state now supports speed, scaling,
safe embedded audio/subtitle selection, buffered state, loaded-list navigation, and original mobile
and TV overlays.

Mobile advances from code 5 to code 6 and TV advances from code 10 to code 11 without changing
package identity, Development signer, credential/database-key storage identities, authenticated
TDLib database/session paths, existing complete or partial TDLib files, or unrelated app-private
state. External Telegram subtitle matching and source aggregation remain F2D.

## Resource architecture

| Resource | Owner and lifetime | Bound / persistence | Cleanup, upgrade, privacy, and failure behavior |
| --- | --- | --- | --- |
| Warm playback session | Process-scoped `WarmPlaybackSessionOwner`; retained for five minutes after route exit | At most one controller; no disk persistence; memory remains bounded by the selected Media3 profile | Exit pauses, detaches the surface, and stops speculative demand. Same opaque identity reattaches. Replacement, exact expiry, logout/disconnect/reset, process shutdown, memory pressure, or failure releases. A failed reattach is discarded and rebuilt. No provider ID is public. |
| TDLib byte cache | Package-private `TdLibMediaCacheManager`; survives process death and ordinary APK update | TDLib's existing file is the only byte copy. Atomic versioned ledger is app-private metadata outside the TDLib files root | Ready-time maintenance adopts legacy files without rename, copy, deletion, or redownload. Eligible eviction is serialized LRU through TDLib `DeleteFile`; ledger state is removed only after confirmation and retained after failure. Active/warm/current/Continue Watching/user-pinned entries are never silently evicted. Reset follows the existing scoped app-data policy. Paths, filenames, and provider IDs never enter public state. |
| Playback resume | `PlaybackResumeStore` plus per-attempt coordinator | Versioned app-private records, capped at 2,048; save at most every five seconds during active playback and at lifecycle boundaries | Survives restart/update. Restore rewinds five seconds, suppresses positions below 30 seconds and completed records, and isolates corrupt records. Progress is retained when cached bytes are cleared. Logout/full reset clears only after the destructive provider action succeeds; failure retains rollback state. |
| Provider ranges and prefetch | Provider-neutral adaptive policy; TDLib runtime owns the one effective per-file request | Individual request cap 64 MiB; no complete-file eager conversion and no second request queue | Selects 16/32/64 MiB using seek, useful consumption, throughput, playback speed, buffer pressure, local coverage, and free-cache budget. Reuses/coalesces coverage, rejects stale generations, prioritizes foreground bytes, and stops speculation on pause, warm detach, or close. Low storage prevents growth. |
| Media3 memory | `Media3PlaybackController` and named LoadControl profile selected from device class plus Android low-RAM capability | Mobile 128 MiB, TV 192 MiB, fallback 96 MiB target; 64 KiB allocator segments | No disk copy and no `SimpleCache`. Warm retention cannot exceed the active profile. Controller release, replacement, failure, process death, or memory pressure frees it. Screen size is not used as a memory signal. |
| Controls, tracks, and preferences | Provider-neutral controller/state plus app-private preference store | One current runtime selection set; persisted values are speed, scaling, subtitle enabled state, and preferred audio/subtitle languages | Runtime Media3 handles are generation-bound and never persisted. New media resolves safe language preferences only against supported tracks and otherwise leaves Media3 defaults. Failures are sanitized and optional-track failure does not stop playback. Logout/reset behavior follows settings scope; no internal IDs or raw `Format` output cross the boundary. |
| Presentation and queue | Shared timeline/overlay reducers with separate mobile and TV Compose presentations; route-scoped diagnostic queue | One active route queue; no invented episode relation and no queue persistence | Previous/next uses only loaded real items and saves the old item before switching. Mobile is touch-first; TV is D-pad-first. Back closes submenu, hides controls, then exits; TV focus returns to the invoking control. UI and accessibility semantics contain no provider identity. |

## Cache policy

TDLib's app-private file remains authoritative; Media3 `SimpleCache` and any other complete duplicate
were not added.

- partial media expires seven days after last access;
- complete media expires 30 days after last access;
- unfinished Continue Watching media and explicit user pins are retained;
- current, active, and warm media are eviction-ineligible;
- mobile effective budget is `min(8 GiB, 20% of app-data filesystem capacity)`;
- TV effective budget is `min(16 GiB, 25% of app-data filesystem capacity)`; and
- both reserve at least `max(2 GiB, 10% of filesystem capacity)`.

If the reserve or cache budget cannot be maintained, new read-ahead growth stops and maintenance
tries the oldest eligible unpinned entries. Existing readable bytes remain usable and playback is
not crashed merely because growth is disabled. Maintenance runs lazily after Telegram reaches
Ready, at most every 24 hours absent pressure. Legacy code-5 files are adopted by safe relative-path
hash and later reconciled to the TDLib file operation identity; direct raw-file deletion is never
used while TDLib owns the runtime.

The player cache panel exposes only cached bytes, known total, partial/complete state, retention,
pin/unpin, safe low-storage state, and confirmed clear. Clearing current media releases playback,
asks TDLib to delete the cached file, retains resume progress, and permits later redownload.

## Resume and completion behavior

The resume coordinator saves progress no more than every five seconds while active and also on
pause, completed seek, player exit, Activity stop, controller release, and warm expiry. Records
include duration and reliable completion state when known. Reopening unfinished media restores five
seconds before the saved point, never below zero. Positions below 30 seconds and completed films do
not resume.

The existing episode completion policy remains unchanged: a reliable final-segment result at or
below exactly 30 seconds remaining, or the 90% fallback when final-segment information is
unreliable, applies only when real provider-neutral episode context exists. Diagnostic-list items
do not invent episode ordering; movies do not inherit episode automatic completion. A real Media3
ended state marks completion for all media. No next episode is synthesized.

## Streaming and Media3 profiles

The adaptive request policy is:

- 16 MiB for cold/startup demand and after a user or parser far seek;
- 32 MiB after at least 8 MiB of useful sequential consumption;
- 64 MiB after at least 24 MiB of sustained useful sequential consumption when observed throughput,
  consumption, playback speed, buffer state, and storage headroom justify growth;
- 64 MiB maximum, always clamped to known remaining size and never zero; and
- 50% normal and 75% rebuffer-pressure read-ahead watermarks.

Repeated no-progress pressure prevents unhelpful growth. One effective TDLib request remains in
force, active coverage is reused/coalesced, stale updates are ignored, readable foreground bytes do
not wait for speculative extension, and paused/warm-detached/closed sessions issue no speculative
work.

| Profile | Min / max forward | Initial / rebuffer | Back buffer | Target | Selection |
| --- | --- | --- | --- | ---: | --- |
| `MOBILE_FAST` | 20,000 / 90,000 ms | 1,500 / 5,000 ms | 20,000 ms | 128 MiB | Mobile unless Android reports low RAM |
| `TV_FAST` | 30,000 / 120,000 ms | 2,000 / 6,000 ms | 30,000 ms | 192 MiB | TV unless a real memory-capability check requires fallback |
| `LOW_MEMORY_FALLBACK` | 15,000 / 60,000 ms | 2,500 / 7,000 ms | 15,000 ms | 96 MiB | Real low-memory result |

Every profile uses a 64 KiB allocator segment and time priority. Screen size is never treated as a
memory capability.

## Timeline, tracks, and overlays

`PlaybackTimeline` is explicitly LTR inside both RTL and LTR compositions: zero/current time is at
the far left, duration/end at the far right, and progress increases left to right. Played and
buffered fractions are distinct. Touch mapping, drag, TV D-pad Left/Right, time-label order, and
accessibility semantics share the same model.

The controller exposes the seven approved speeds from 0.5× through 2.0×, Fit/Fill/Zoom, play/pause,
near and exact seek, buffered position/duration, safe video summary, previous/next availability,
embedded audio tracks, embedded subtitle tracks, and subtitle Off. Track presentation is limited to
sanitized language/label, channel count or codec summary when reliable, forced/default flags, and
selected/supported state. Media3 internal IDs, group IDs, URLs, filenames, raw formats, and provider
identifiers are excluded.

The original TV overlay is landscape, D-pad-first, and 10-foot-readable. It has Back/title/real
previous-next context, central ±10 seconds and large play/pause, an always-LTR bottom timeline, and
the six panels **תצוגה**, **מהירות**, **שמע**, **כתוביות**, **מטמון**, and **מידע**. The mobile
presentation is touch-first in portrait or landscape and uses the same behavior. Paused/open-menu
state remains visible; otherwise controls hide after four seconds. Interaction reveals controls,
Back closes a submenu before controls before route exit, and TV restores focus. The diagnostic
engineering panel remains secondary/collapsible. No engine chooser exists because Media3 is the
only engine.

## Principal changed areas

- `core-provider`: opaque resource identity, cache presentation contracts, and the 16/32/64 MiB
  adaptive selector.
- `core-telegram`: atomic cache ledger/manager, legacy adoption, budget/reserve/LRU policy, confirmed
  TDLib deletion, cache-aware range selection, and serialized active ownership.
- `core-playback`: warm-session owner, resume and preference stores, named LoadControl profiles,
  safe track/control state, route queue, timeline, overlay reducer, and Media3 wiring.
- `app-mobile`: code-6 identity, always-LTR touch player, all six panels, queue navigation, and
  secondary engineering diagnostics.
- `app-tv`: code-11 identity, original D-pad overlay, submenu/focus/back behavior, and shared player
  regression surface; no TV delivery.
- CI and delivery scripts: code-6/code-11 identities, retained code-5 update baseline, same-version
  code-6 refresh without losing the previous APK, and exact-HEAD artifact validation.
- Documentation: cache/warm-player ADR, 23-step physical code-6 acceptance procedure, architecture,
  security, Telegram, test, release, state, UX, distribution, and Shield-deferred records.

## Native artifact evidence

No TDLib native build occurred. Both mandatory verification-only commands passed locally, and
exact-HEAD CI restored and verified its pre-existing official cache without rebuilding.

| Native property | Observed value |
| --- | --- |
| Official TDLib version | 1.8.66 |
| Official source commit | `022d60202e446ad1287b9fb68e687c8a0760788b` |
| ABI | `arm64-v8a` only |
| NDK | r28c |
| Local AAR SHA-256 | `025313d2a7cdbf148e5c700e8ef6c9d384f2301aff043c844997e0c23eb9abd2` |
| Local Java JAR SHA-256 | `e39bb497b7eea1f33d7d3b5816591b7656259df29e0231c10287e514e3951a04` |
| Local packaged JNI SHA-256 | `21d59ebfeba4edc62ea74cefaa79b08650e796530f3d5e57804105cc44cb65dc` |
| CI packaged JNI SHA-256 | `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f` |
| Layout | ARM64 DYN, NDK r28c, `LOAD` alignment at least `0x4000`, stored and 16,384-byte APK aligned, expected system dependencies only |

The local and CI JNI hashes are the two pre-existing, separately verified cache lineages for the
same pinned official source/build identity. F1D.5 changed neither lineage, source pin, native input,
ABI, NDK, AAR/JAR identity, nor packaging policy.

## Local validation

Both required TDLib verification-only commands, Gradle 9.5/JDK 21 discovery, all focused module
tests, aggregate tests, aggregate lint, and both signed assemblies passed. Generated JUnit XML
records 513 tests with zero failures, errors, or skips:

| Module | Tests |
| --- | ---: |
| `app-tv` | 74 |
| `app-mobile` | 49 |
| `core-model` | 15 |
| `core-playback` | 78 |
| `core-provider` | 27 |
| `core-provisioning` | 48 |
| `core-security` | 96 |
| `core-telegram` | 126 |
| **Total** | **513** |

All 460 tests present at the start remain. Added coverage includes warm same-resource reattach,
exact five-minute expiry, replacement, failed warm rebuild, no detached audio/read-ahead, lifecycle
release, resume throttling/rewind/suppression/corruption isolation, legacy adoption, TTLs, pins,
budgets/reserve/LRU/deletion retry, 16/32/64 growth and watermarks, stale/coalesced ranges, exact
profiles and memory bounds, always-LTR input mapping, speed/scaling/tracks/preferences, overlay
timing/back/focus, queue availability, sanitization, and upgrade/publication compatibility.

Additional executable validation passed:

- browser/WebCrypto/Kotlin interoperability and negative checks;
- provisioning inspector: 4 cases;
- APK upgrade harness: 13 cases;
- TV publication harness: 9 cases;
- TV exact-HEAD downloader rejection harness: 8 cases;
- mobile publication harness: 10 cases;
- mobile downloader harness: 19 rejection cases and 1 success case;
- native-layout and APK identity/content verification;
- shell syntax checks;
- real retained mobile code 5→6 update verification; and
- TV code 10→11 behavior fixture verification.

No retained real TV code-10 APK was available, so no real-pair TV APK comparison is claimed. The TV
APK remained a non-delivered regression candidate.

### Commands actually run

The observed command set included both mandatory repository preflights and these milestone checks:

```bash
./scripts/bootstrap-tdlib-android.sh --verify-only
./scripts/verify-tdlib-artifact.sh
./gradlew --version
./gradlew projects
./gradlew test
./gradlew lint
./gradlew :app-mobile:assembleDebug
./gradlew :app-tv:assembleDebug
./gradlew :app-mobile:testDebugUnitTest
./gradlew :app-tv:testDebugUnitTest
./gradlew :core-model:test
./gradlew :core-provider:test
./gradlew :core-playback:testDebugUnitTest
./gradlew :core-telegram:testDebugUnitTest
./gradlew :core-security:testDebugUnitTest
./gradlew :core-provisioning:testDebugUnitTest
./scripts/test-inspect-pmtprov.sh
./scripts/test-verify-upgrade-apks.sh
./scripts/test-apk-phone-delivery.sh
./scripts/test-download-latest-ci-apk-rejections.sh
./scripts/test-mobile-apk-phone-delivery.sh
./scripts/test-download-latest-ci-mobile-apk-rejections.sh
node tools/verify-lan-crypto-fallback.mjs
node tools/verify-provisioning-html.mjs
node tools/verify-pmtprov-interop.mjs self-test
bash -n scripts/*.sh
bash -n scripts/lib/*.sh
./scripts/export-latest-mobile-apk-to-phone.sh
./scripts/download-latest-ci-mobile-apk-to-phone.sh
adb devices -l
git diff --check
```

The final locally assembled artifacts were:

| Candidate | Size | SHA-256 | Modification time |
| --- | ---: | --- | --- |
| Mobile code 6 | 56,609,030 bytes | `234eceea423e0bfe19a8f4f6e337ee39e24c961d9f6911eb6f6acb1b885c05a5` | `2026-08-04 19:49:42.902609786 +0000` |
| TV code 11 | 57,668,476 bytes | `1b086dcd3a2cd29f3712bfda450ebd0a0dde4d0ae2da1f7f5483fb3c2cdc6086` | `2026-08-04 19:49:44.558609785 +0000` |

Both passed package/version/code, Development signer, ARM64-only, local JNI, 16 KiB native layout,
and forbidden-content inspection. The real retained mobile code-5 APK passed update verification
against the final local code-6 build. The synthetic TV behavior fixture passed code 10→11. The TV
exporter, TV CI downloader, installer, and Shield deployer were not run.

`adb devices -l` listed no attached device. Therefore no code-6 installation, launch, state
preservation, Telegram behavior, playback performance, touch/track behavior, or Shield result is
inferred from local or CI validation.

## Exact-final-HEAD Android CI

| Field | Value |
| --- | --- |
| Run | `30945616102` |
| Event / branch | `push` / `main` |
| Commit | `cd0865762d3db304d265a0972a4c40731e9e4d56` |
| Conclusion | success |
| Wrapper job | `92114729524` — passed in 8 seconds |
| Android build job | `92114776688` — passed in 6 minutes 20 seconds |
| Mobile artifact | `private-media-tv-mobile-apk-cd0865762d3db304d265a0972a4c40731e9e4d56` (artifact `8907124757`) |
| TV artifact | `private-media-tv-apk-cd0865762d3db304d265a0972a4c40731e9e4d56` (artifact `8907120083`) |

The exact-HEAD run passed wrapper validation, pinned official-TDLib cache verification without a
native rebuild, artifact-selection rejection tests, browser crypto fallback, Development signer
reconstruction/verification, aggregate and focused tests, lint, signed ARM64 TV/mobile assembly,
package/version/signer/JNI/content inspection, metadata/checksum generation, and both artifact
uploads. GitHub emitted a non-failing Node.js action-runtime deprecation annotation for the pinned
cache/upload actions; the run conclusion remained success and no F1D.5 check failed.

## Final CI mobile-only delivery

After CI succeeded, `./scripts/download-latest-ci-mobile-apk-to-phone.sh` selected only the exact-
HEAD push artifact, verified its metadata and payload, and published it through the Mobile-specific
rotation path. The distinct verified code-5 APK remains `previous`.

| Field | Final CI mobile APK |
| --- | --- |
| Canonical path | `/storage/emulated/0/Download/PrivateMediaTV/Mobile/private-media-tv-mobile-latest.apk` |
| Package/version | `com.funzi7.privatemediatv.mobile`, `0.1.5-phone-test` (`versionCode` 6) |
| Size | 56,251,476 bytes |
| APK SHA-256 | `17c2d7f970ec260a7a9c47426ea8464da1fda53aa3a5ac2ca8a2fd969a25e542` |
| Fresh modification timestamp | `2026-08-04 20:05:23.378609427 +0000` |
| Modification epoch | `1785873923` |
| Development signer SHA-256 | `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` |
| ABI | ARM64 only |
| Packaged JNI SHA-256 | `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f` |

The final APK is a real copied file, not a symlink, and it passes a fresh real code-5→6 upgrade
verification. Parent TV `latest`, `previous`, and the offline provisioning tool retained their exact
pre-milestone hashes, sizes, timestamps, and inodes. No TV export, CI TV download, installation,
launch, or deployment occurred. Shared-storage publication does not prove app-private state or
physical playback behavior.

## Security decisions

- TDLib Java/JNI types remain confined to `core-telegram`; UI, `core-model`, `core-provider`, and
  `core-playback` remain provider-neutral. `core-security` remains independent of TDLib.
- Cache/resume internals may keep the provider operation identity only in app-private storage.
  Shared models, logs, exceptions, CI, UI diagnostics, accessibility semantics, and this public
  handoff contain no Telegram file/chat/message identity, filename, path, or raw format.
- Cache deletion uses only supported TDLib deletion and never directly removes a runtime-owned
  downloaded file. Failure retains ledger state for retry.
- Existing credential vault, database-key envelope/alias, authenticated database/session, TDLib
  files, progress, Continue Watching, preferences, and unrelated state are preserved across update.
- Neither APK contains credentials, keys, `.pmtprov`, Telegram session/database material, private
  media, private captures, or signing secrets.
- The mobile harness preserves the approved unrestricted screenshot/recording behavior and warning;
  TV secure-window handling is unchanged.

## Limitations and pending physical acceptance

- Physical code-6 install-over-code-5 and all 23 acceptance steps remain pending.
- Warm reattachment, five-minute expiry behavior, process-death disk reuse, timeline direction,
  touch controls, scaling, every speed, embedded tracks, queue navigation, cache pin/clear/redownload,
  cold-large-media comparison, and ten-minute continuity have behavior tests but no physical phone
  result.
- A real retained TV code-10 APK was unavailable; only behavior compatibility and the new code-11
  build/CI inspections passed.
- Shield D-pad, codec, memory, passthrough, and performance acceptance remains deferred. A phone
  result would not prove any of those TV properties.
- External Telegram subtitle matching and source aggregation remain F2D and were not simulated.
- The CI Node.js action-runtime deprecation annotation should be addressed in a future maintenance
  update after reviewing new immutable action pins; it did not affect this successful run.

## Continuation

1. On the authorized phone, follow `docs/MOBILE_ACCEPTANCE.md` in order: install code 6 over code 5
   without uninstalling or clearing data, then perform all cache, warm-session, process-death,
   timeline, controls, tracks, navigation, clear/redownload, performance, and ten-minute checks.
2. Record only safe timing/rebuffer measurements. Do not publish private names, identifiers,
   screenshots, or account/session information.
3. Do not infer Shield results from phone acceptance and do not deliver the TV APK for this
   milestone.
4. After physical F1D.5 acceptance, continue with **F2A — local persistent Telegram catalog and
   source-variant identity**, preserving the provider-neutral cache/player contracts. F2D remains
   responsible for external Telegram subtitle/source aggregation.
