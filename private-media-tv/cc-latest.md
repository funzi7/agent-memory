# Private Media TV — F2B.5.1 Handoff

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | funzi7/private-media-tv |
| Milestone | F2B.5.1 — Physical Search Engine V2 known-source reliability repair |
| Branch / tracking branch | main / origin/main |
| Starting application HEAD | 8b2f0eb6102695201244f56e7242c4e5c4f6b444 |
| Final application HEAD | bd59754e14123e199381417664969d3513806781 |
| Starting agent-memory HEAD | 80772998b1375b6d9eeae2fce7e3a82e0e98932e |
| Exact-head Android CI | 31841163231 — success |
| Mobile identity | com.funzi7.privatemediatv.mobile, 0.3.8-phone-test, versionCode 16 (updates code 15 in place) |
| TV regression identity | com.funzi7.privatemediatv, 0.5.8-f2b51, versionCode 21 (built and verified only) |
| Development signer SHA-256 | 2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0 |

The milestone was committed once on main and pushed without force. The final application HEAD
matches origin/main. Exact-head Android CI passed and uploaded both artifacts; only the mobile
artifact was downloaded and published to the isolated Mobile shared-storage directory. The TV
artifact is a shared-code regression that was built and verified but never downloaded, exported,
installed, or deployed. No Shield command ran. No physical device was attached.

## Why F2B.5.1 exists

F2B.5 (ADR 0017) shipped Search Engine V2. On mobile code 15 a real known-source title regressed
physically: the live `SearchChatMessages` text phase failed, and because V2 had disabled the
recent-history rescue (`fallbackAllowed = emptySet()`) there was no fallback. The known live phase
could also consume the whole deadline, a parser-uncertain result was hidden, and a deadline was
reported to the owner as source unavailability. A previously working title that code 15 already
resolved from the local index still returned, isolating the defect to the known/manual override
phase rather than the index or the pool. F2B.5.1 is a targeted reliability repair, not a search
rewrite.

## Preserved and unchanged

Search Engine V2, the local Room/FTS4 index (schema 11) and its deterministic normalization/ranking,
the Telegram-X-derived single-chat pager, the AUTO-8/maximum-12 live pool, exact binding, the
official TDLib account/session and resolver, Media3 playback, the TDLib byte cache/downloads, TMDB
identity, and the local library are all unchanged. The retained F2B.4.2 engine stays reachable only
through explicit LEGACY_DIAGNOSTIC construction; production never runs both engines and never falls
back to legacy after a V2 miss. Official TDLib remains the single Telegram runtime.

## Implemented behavior — the four repairs

1. **V2-specific bounded known/manual-source history fallback.** A new `historyFallbackOnly`
   adapter request drives a bounded scan through the supported `GetChatHistory` metadata boundary
   (`loadRecentSourceMedia`, eligible for channels and supported groups): at most 5 pages of up to
   100 raw messages each, plus a reserved deadline; whichever bound is reached first stops the scan.
   It never downloads media bytes and never fans across the normal active pool. It runs only for an
   explicit known/manual override when the live phase surfaced nothing (zero provider messages, zero
   mapped media, a live timeout, no acceptable candidate, or a retryable provider failure). Useful
   scanned media is persisted into the same existing V2 metadata index, so a fallback hit resolves
   locally on the next search. New pipeline stage `KNOWN_SOURCE_HISTORY_FALLBACK`.

2. **Dedicated known-source query plan.** `SourceDiscoveryQueryPlanner.knownSourceLiveQueries(...)`
   emits at most two live text queries before the fallback. For a TV episode it prefers a natural
   title + episode-word form that matches real captions, then one structured `SxxExx` form; for a
   movie the plain localized/original title first, then a year-qualified form (a failed year query
   never blocks the plain-title query). An explicit owner MANUAL alias/phrase is placed ahead of any
   generated filename-style form. Generated `SxxExx` variants no longer consume the whole budget.

3. **12-second known-source budget with a reserved fallback.** Budgets are now known/manual total
   12s (was 8s), split into a live text-search phase (~6s cap) and a reserved history-fallback phase
   (~5s), each coerced to the remaining total; the live phase can no longer starve the fallback.
   Normal active pool remains 15s; each Deep batch remains 20s. Two known sources run concurrently;
   a slow first source cannot block the second. Known-override order: exact binding → local index →
   known live queries → (nothing surfaced) bounded history fallback → best-effort active-pool
   fallthrough within any remaining budget → terminal.

4. **Uncertainty vs contradiction acceptance.** For a known/manual source, a `PARSER_REJECT`
   (parser-uncertain) result is surfaced as an owner-confirmable POSSIBLE instead of being hidden,
   and it is confirmable even without a typed search phrase via a new provider-neutral
   `SourceVariantPresentation.ownerConfirmable` provenance flag (the confirmed source caption learns
   the exact binding). `IDENTITY_REJECT` and `DATE_EPISODE_REJECT` (contradiction) still fail closed.

### Truthful diagnostics and terminal UI

Provider counters now separate raw Telegram messages returned from mapped playable/plausible media,
with new aggregate counters for parser-uncertain possibles, history messages scanned, and history
fallback pages (and a populated recent-fallback-considered counter). Diagnostics remain aggregate
count-only — no query strings, titles, provider/message/file IDs, filenames, captions, or raw
errors. The mobile UI no longer mislabels raw messages as media. Terminal states are truthful: a
deadline is presented as a bounded-time warning that keeps any results visible and offers
Retry/Deep; an exhausted no-match is a completed miss; a partial states some sources did not finish;
only a real provider/runtime failure claims the source is temporarily unavailable.

## Modules and files

- `core-catalog`: `SourceDiscoveryContracts.kt` (known-source query planner, `historyFallbackOnly`
  request field, `KNOWN_SOURCE_HISTORY_FALLBACK` stage, `ownerConfirmable` presentation flag, new
  aggregate statistics fields), `SearchEngineV2.kt` (known-source orchestration, split budgets,
  counters, POSSIBLE persistence). Tests: `SearchEngineV2IntegrationTest.kt`,
  `SourceDiscoveryContractsTest.kt`.
- `core-telegram`: `TelegramCatalogSourceAdapter.kt` (bounded `GetChatHistory` known-source rescue
  behind `historyFallbackOnly`). Test: `TelegramCatalogSourceAdapterTest.kt`.
- `app-mobile`: `F2bCatalogScreens.kt` and `F2bCatalogViewModel.kt` (owner-confirmable POSSIBLE
  binding, truthful terminal messages, raw-vs-mapped diagnostics), `MobileModels.kt` version
  constant. Tests: `F2bSearchEngineV2PresentationTest.kt`, and updated Compose/manifest tests.
- Version config: `app-mobile/build.gradle.kts` (16 / 0.3.8-phone-test), `app-tv/build.gradle.kts`
  (21 / 0.5.8-f2b51). Delivery/upgrade/downloader scripts and `.github/workflows/android-ci.yml`
  version assertions advanced to the new pair.
- Docs: PROJECT_STATE, RELEASE_REVIEW, HANDOFF, MOBILE_ACCEPTANCE, TEST_PLAN, APK_DISTRIBUTION,
  UX_DECISIONS, SECURITY, TELEGRAM_INTEGRATION, ARCHITECTURE, PRODUCT_SPEC, README, TODO, CHANGELOG,
  and new ADR 0018.

## Validation actually run

- `./gradlew test`: passed 1,201/1,201 with zero failures/errors/skips (core-model 19, core-provider
  27, core-metadata 66, core-catalog 296, core-telegram 214, core-security 98, core-provisioning 48,
  core-playback 90, app-tv 74, app-mobile 269).
- `./gradlew lint`, `:app-mobile:assembleDebug`, `:app-tv:assembleDebug`: passed.
- Both TDLib verify-only commands passed; no native rebuild. TDLib 1.8.66, source commit
  022d60202e446ad1287b9fb68e687c8a0760788b, ARM64, NDK r28c, 16-KiB. Local AAR SHA-256
  025313d2a7cdbf148e5c700e8ef6c9d384f2301aff043c844997e0c23eb9abd2, Java JAR SHA-256
  e39bb497b7eea1f33d7d3b5816591b7656259df29e0231c10287e514e3951a04, local libtdjni.so SHA-256
  21d59ebfeba4edc62ea74cefaa79b08650e796530f3d5e57804105cc44cb65dc.
- Both APK native-layout scans passed (ARM64 libtdjni.so, NDK r28c, 16-KiB LOAD/APK alignment, only
  expected Android system dependencies). APK credential scanner: 41 cases. Mobile phone-delivery
  harness: 12 cases. CI mobile downloader rejections: 20 + 1 success. TV phone-delivery: 9 cases.
  Upgrade verifier behavior: 13 cases (real pairs mobile 15→16 and TV 20→21). Shell syntax: all
  scripts. `git diff --check`: clean.

## APK and CI delivery results

- Exact-head Android CI run 31841163231 for HEAD bd59754… concluded success and uploaded both
  artifacts. Mobile artifact 58,602,183 bytes; TV artifact 58,805,069 bytes (TV not delivered).
- The exact-head mobile CI artifact was downloaded and published to the isolated Mobile directory as
  `private-media-tv-mobile-latest.apk`: 58,601,108 bytes, APK SHA-256
  e37df5ba2239b8958df044f538964309ff8c4c97a57566a44589be7d3fefaa2d, modified 2026-08-14 21:26:00 UTC
  (epoch 1786742760), packaged libtdjni.so SHA-256 (CI-cache lineage)
  790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f, Development signer above. Code 15
  rotated to `private-media-tv-mobile-previous.apk` (58,584,728 bytes). The parent TV files
  (`private-media-tv-latest.apk`, `private-media-tv-previous.apk`, offline provisioning tool) were
  not modified. The published latest is a real regular file, not a symlink.

## Physical status and omitted checks

`adb devices -l` listed no attached device. No installation, launch, Telegram login, on-demand
search, playback, or Shield result is claimed. Physical mobile code-16 acceptance per
`docs/MOBILE_ACCEPTANCE.md` (Tests A–G, to be run before rebuilding all 58 indexes) is pending. The
TV application was not exported, downloaded, installed, or deployed.

## Limitations and risks

- Known-source strategy correctness is proven by focused synthetic regressions with virtual-clock
  deadlines and fake adapters; the physical known-source reliability outcome is unconfirmed until
  code-16 acceptance.
- The active-pool fallthrough after a known-source miss shares the 12-second known budget, so when
  the known live phase and fallback consume most of the budget the fallthrough is best-effort only.
- The packaged CI libtdjni.so uses the established CI-cache lineage
  (790c545f…), which differs from the local artifact lineage (21d59ebf…); both are documented as
  preserved and no native rebuild occurred.

## Unresolved decisions

None new. The isolated legacy F2B.4.2 diagnostic engine removal remains gated on physical mobile
search acceptance and is not part of F2B.5.1.

## Exact next milestone and continuation

1. Physically install code 16 over code 15 (update in place, no uninstall/clear-data) and run
   `docs/MOBILE_ACCEPTANCE.md` Tests A–G, especially Test B (the previously regressed known-source
   title returns automatically or as "possible", with the bounded history fallback rescuing a failed
   live search, entirely within ~12 seconds and never a generic source-unavailable message on a
   deadline) and Test E (raw-Telegram-messages vs mapped-media diagnostics).
2. Record the observed physical outcome; if search reliability is confirmed, schedule the gated
   isolated-legacy-engine cleanup as a separate milestone.
