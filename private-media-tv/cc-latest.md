# Private Media TV — F2B Handoff

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | `funzi7/private-media-tv` |
| Milestone | F2B — TMDB-first catalog and bounded on-demand Telegram source discovery |
| Branch / tracking branch | `main` / `origin/main` |
| Starting application HEAD | `605c053390bf7252eebfc90af5bf72cc47e4bb39` |
| Final application HEAD | `e0b6557f128cb4a33e218edadae7f930c3eadbe5` |
| Agent-memory base before this handoff | `988ce1fce614ee50abdc9f231c077d38c1ff10ee` |
| Mobile identity | `com.funzi7.privatemediatv.mobile`, `0.3.0-phone-test`, `versionCode` 8 |
| TV identity | `com.funzi7.privatemediatv`, `0.5.0-f2b`, `versionCode` 13 |
| Development signer SHA-256 | `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` |

The application milestone was committed once as
`e0b6557f128cb4a33e218edadae7f930c3eadbe5` and pushed without rewriting
history. A subsequent fetch verified that application `HEAD` and `origin/main`
both resolve to that exact commit. Exact-final-HEAD Android CI passed, and only
its mobile artifact was downloaded and published to the package-specific Mobile
directory. No TV APK was exported, downloaded to shared storage, installed, or
deployed.

The agent-memory repository opened clean, was fetched before this edit, and its
actual `HEAD` and `origin/main` both resolved to the base recorded above. Newer
unrelated agent-memory work was preserved.

## Authoritative architecture reversal

The owner physically installed mobile code 7 and exercised a Telegram-channel
scan. The scan operated, but physical use established that full-history scanning
is the wrong primary product architecture. No additional private or physical
result is inferred from that observation.

F2B makes TMDB the authoritative browsing, search, movie, series, season, and
episode identity. Telegram is now an on-demand playback-source provider:

```text
TMDB Home/Search
→ movie, series, season, or exact episode
→ explicit Sources or Play action
→ bounded Telegram source discovery
→ validated source variants
→ current-message re-resolution
→ existing TDLib/Media3 cache, resume, and player pipeline
```

Home, TMDB search, movie details, series details, season details, and episode
metadata do not start Telegram discovery. Initial whole-history scanning,
checkpoints, pause/resume scan UI, aggregate scan progress, scan-derived catalog
lists, and perpetual channel mirroring are disconnected from normal application
startup and runtime. There is no fallback that scans an entire channel history.

## Implemented modules and boundaries

One coherent module, `core-metadata`, was added. It owns provider-neutral media
identities, metadata and catalog-row models, provider/cache contracts, the
internal TMDB HTTPS implementation, serialization tests, Room metadata caching,
stale-while-revalidate behavior, official image configuration, and bounded image
loading. Stable identity is:

- `Movie(tmdbId)`;
- `TvSeries(tmdbId)`; and
- `TvEpisode(seriesTmdbId, seasonNumber, episodeNumber)`.

Title text is never the primary identity, and no TMDB ID is invented.

`core-catalog` now owns provider-neutral source discovery, conservative parsing
and TMDB-aware matching, deterministic query planning, source-scope state, Room
schema/migration, on-demand result caching, durable source identity, freshness,
availability, playback commit coordination, and explicit legacy F2A cleanup.
It contains no raw TDLib objects.

`core-telegram` remains the only module with raw TDLib types. It implements the
exact pinned global and per-channel search APIs, channel filtering, pagination,
candidate projection, and current-message source re-resolution. `core-security`
owns the separate runtime TMDB credential vault and remains independent of
TDLib.

`app-mobile` provides the F2B diagnostic catalog, metadata settings, source
scope, source selection, refresh, extended search, and playback bridge.
`app-tv` compiles the shared metadata/discovery/playback boundary and advances
its update identity, but does not implement or deliver the final F2C TV design.

The principal changed areas are:

- `core-metadata/`;
- `core-catalog/` Room v3 and source-discovery contracts/repository/service;
- `core-telegram/` bounded search and playback-resolution adapters;
- `core-security/` TMDB credential-vault identity and Android implementation;
- `app-mobile/` F2B state, data source, ViewModel, screens, runtime bridge, and
  acceptance tests;
- `app-tv/` shared-boundary wiring and version regression;
- `scripts/` and `.github/workflows/android-ci.yml` artifact, upgrade,
  credential, native-layout, and mobile-only delivery verification; and
- the active project, security, Telegram, test, release, acceptance, UX,
  distribution, and ADR documentation.

## TMDB metadata behavior

The implementation was based on the current official TMDB developer reference,
not memory. It covers application authentication, trending, popular, top-rated,
recent/discover and genre-backed rows, movie and TV search, movie/series/season/
episode details, credits, external IDs, alternative titles, image configuration,
pagination, and safe HTTP/rate-limit classification.

Metadata supports Hebrew and English with deterministic requested-language,
English, then original-field fallback. Original title/name remains separate.
Images use the official secure configuration/path model with requested-language,
English, and language-neutral selection. Image bytes use bounded app-private
memory/disk caching and are never stored in Room or bundled as remote artwork.

TMDB vote score/count is always labelled as TMDB data. No IMDb score is derived
or fabricated from TMDB votes. The approved official TMDB mark and required
attribution notice appear together in the mobile About/Credits surface.

Metadata freshness is centralized and tested:

| Metadata class | Freshness |
| --- | ---: |
| Catalog rows | 6 hours |
| Search results | 1 hour |
| Movie/series details | 3 days |
| Season/episode details | 5 days |
| Genres/image configuration | 14 days |

Cached data is bounded and coordinate-validated before use. A network or
background-refresh failure does not erase a previously valid payload. Search and
row pagination remain bounded and retain already loaded pages across background
refresh.

## Runtime TMDB credential protection

Mobile `הגדרת TMDB` supports secure local input, validate, save, confirmed
replace, confirmed clear, and configured/not-configured status. The credential
is stored in a distinct Android-Keystore-protected alias and envelope beneath
package-owned app-private storage. It does not reuse a Telegram alias or
envelope.

TMDB requests use HTTPS application Bearer authentication. The credential is
absent from source, BuildConfig, CI, plaintext preferences, URLs, logs,
screenshots, state, `toString()`, APK payloads, and this public handoff. Candidate
buffers are normalized and zeroed after use. HTTP errors are reduced to stable,
safe categories without raw bodies or authorization headers.

Credential lifecycle tests cover not configured, normalized input, validate,
save, protected read-back, unconfirmed and confirmed replacement, confirmed
clear, failure paths, zeroization, and presentation/string redaction. The APK
scanner rejects common Telegram/TMDB credential aliases, JWT-shaped tokens,
private-key markers and containers, databases, sessions, and private media.

## Telegram source scope and bounded discovery

The default source scope is `ALL_BROADCAST_CHANNELS`, with per-channel
exclusions. `SELECTED_CHANNELS_ONLY` is also supported. Existing F2A selected-
channel state is retained only as a legacy preference and cannot silently narrow
the new default. Loading the joined broadcast-channel list is allowed; loading
every historical message is not.

The exact pinned TDLib API is used as follows:

- fast all-broadcast search with no exclusions uses channel-filtered global
  `SearchMessages`;
- selected-only scope, any exclusion, and every explicit extended search use
  bounded per-channel `SearchChatMessages`;
- only video and document media filters are searched;
- a plan contains at most four unique deterministic semantic queries;
- fast search uses at most two pages per query/filter;
- extended search uses at most four pages per query/filter;
- each request is capped at 100 results;
- per-channel fan-out is capped at 200 eligible channels and fails closed if the
  scope is larger;
- identical normalized requests are not repeated;
- selection changes cancel lifecycle-owned discovery; and
- private chats, groups, unbounded pagination, and full-history fallback are
  excluded.

Movie plans use localized, original, and validated alternative titles plus the
intended year, then a bounded title-only fallback where safe. Numeric titles are
handled without confusing title tokens with release-year evidence. Episode
plans use exact series identity, season, and episode with deterministic
`SxxExx`, `SxEx`, and `NxNN` forms. No season or episode number is invented.

Every candidate passes conservative parsing and TMDB-aware matching. Conflicting
explicit years, unrelated titles, and season/episode conflicts are rejected.
Known localized and original aliases may independently corroborate the same
identity, while generic caption text is not treated as identity evidence.

Results are deduplicated by durable message/attachment identity. Distinct
messages or channels remain distinct variants even when reliable remote evidence
marks the underlying bytes as exact duplicates. The public/UI projection never
contains raw Telegram identifiers.

## Source cache and freshness

On-demand results are keyed by opaque account scope, TMDB media identity,
source-scope revision, and discovery-plan version. Freshness is centralized and
tested:

- positive results: 12 hours;
- negative/no-source results: 30 minutes.

Fresh positive and negative cache reads return without a Telegram request.
Stale positive results display immediately while refreshing; stale negatives
retry discovery. Manual refresh bypasses freshness while keeping old valid
variants visible until a replacement commits. A failed refresh retains the last
valid variants, timestamp, freshness, and safe statistics.

Account state is opaque and fail-closed. Fresh offline cache can be used only
for a single established account scope. A ready live account is checked against
that scope before cached results cross an account boundary or a refresh/playback
operation proceeds. Scope revisions invalidate discovery results without
deleting Telegram messages or TDLib byte-cache files.

## Room migration and F2A legacy handling

The catalog database advances non-destructively from schema v2 to v3. Existing
scan-produced records remain present as legacy data but are not used to build the
TMDB Home, search, Movies, Series, or Unclassified catalog. `CatalogSyncEngine`
and full-history entry points are not composed or started by the normal runtime.

The confirmed action `מחק נתוני סריקה ישנים` removes only obsolete F2A scan-
derived catalog metadata. Tests prove that it retains Telegram credentials,
session/database state, TDLib media bytes, playback resume, cache ledger, player
preferences, source-scope preferences, TMDB metadata, and the new on-demand
source cache.

Process-owned catalog and metadata databases now close safely and reopen after a
full application reset. Surviving F2B UI state and lifecycle jobs are cancelled
and cleared before vault/database deletion, preventing stale account/catalog
presentation or post-reset writes.

## Source presentation and playback

The mobile source list exposes safe on-device channel/source labels and available
resolution, claimed/verified HDR/DV state, codec/container, size, language hints,
local/partial/remote/unavailable state, cache state, and cached-result age. It is
sorted complete/local, partial/local, remote available, then unavailable, with
reliable quality and stable ordering. Quality is never inferred from file size.

Selecting a cached variant never trusts a stale TDLib file ID. Playback:

1. resolves the durable message locator;
2. fetches the current message;
3. verifies that the intended attachment still exists and is available;
4. reconstructs the current playable handle;
5. safely commits refreshed operational metadata and provider revision; and
6. enters the existing player pipeline.

Deleted, replaced, stale-revision, or unavailable sources do not enter the
player. Only that variant is marked unavailable, the source list remains open,
and alternatives remain usable. Playback and discovery jobs are generation-
guarded so superseded same-media and cross-media results cannot update or launch
the wrong selection.

The proven TDLib byte cache, warm session, resume, adaptive 16→32→64 MiB range
streaming, Media3 device profiles, LTR timeline, track controls, and cache
controls remain independent and are reused unchanged.

## Mobile UI and TV boundary

Mobile now provides:

- TMDB-backed Home rows and cards;
- debounced, cancellable, pageable movie/TV search;
- movie details;
- series details and season/episode selection;
- exact episode details;
- explicit `מקורות` entry;
- cached/loading/refreshing/success/empty/error source states;
- `רענון מקורות` and explicit `חיפוש מורחב`;
- source-scope mode, selection, and exclusions;
- confirmed F2A legacy cleanup; and
- TMDB credential status/settings plus About/Credits attribution.

Tests prove that Home, search, movie details, series details, season details, and
episode metadata do not start Telegram discovery. Only explicit Sources, Play
when source selection is needed, or refresh starts discovery.

TV compiles the shared F2B code and advances from code 12 to 13, but the final
horizontal Home/details/series design and Continue Watching integration remain
F2C. The TV APK was built and inspected only. It was not exported, downloaded,
installed, or deployed.

## Native and update preservation

No TDLib native build occurred. Both mandatory verification-only commands passed
locally, and exact-final-HEAD CI restored and verified the existing official
artifact without rebuilding it.

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
| Layout | ARM64 DYN, 16-KiB compatible, stored and 16,384-byte APK aligned, expected system dependencies only |

The local and CI JNI hashes are the existing separately verified native
lineages for the same pinned official source/build identity. F2B changed no
native source, input, ABI, NDK, AAR/JAR lineage, signer, or cache identity.

Real retained APK pairs passed mobile code 7→8 and TV code 12→13 package,
signer, and update-compatibility verification. Mobile code 8 preserves the
mobile application ID, Development signer, app-private storage identities,
Keystore aliases, and TDLib paths. Mobile-only publication left all parent TV
files byte-for-byte and metadata unchanged.

## Local validation

Gradle 9.5.0/JDK 21 project discovery, aggregate tests, focused module tests,
aggregate lint, and both signed debug assemblies passed. Generated JUnit XML
recorded 756 tests with zero failures, errors, or skips:

| Module | Tests |
| --- | ---: |
| `app-mobile` | 128 |
| `app-tv` | 74 |
| `core-catalog` | 102 |
| `core-metadata` | 37 |
| `core-model` | 15 |
| `core-playback` | 78 |
| `core-provider` | 27 |
| `core-provisioning` | 48 |
| `core-security` | 98 |
| `core-telegram` | 149 |
| **Total** | **756** |

The retained executable checks also passed:

- browser WebCrypto, production-Kotlin interoperability, provisioning HTML,
  self-test, and negative checks;
- provisioning inspector: 4 cases;
- APK upgrade harness: 13 cases;
- TV publication harness: 9 cases;
- mobile publication harness: 11 cases;
- TV exact-HEAD downloader rejection harness: 8 cases;
- mobile downloader harness: 20 rejection cases and 1 success case;
- credential/APK scanner harness: 41 cases;
- deterministic native-layout, identity, signer, JNI, packaging, and prohibited-
  content inspection; and
- shell syntax checks.

The final locally assembled artifacts were:

| Candidate | Size | SHA-256 | Modification time |
| --- | ---: | --- | --- |
| Mobile code 8 | 58,063,300 bytes | `5a3b9ce0302876d4132e5588e1c05b37e230c9c684dec8f7795fc7138cc98658` | `2026-08-09 16:29:35.605185006 +0000` |
| TV code 13 | 58,281,939 bytes | `3f2737930ee274598037b638db248113b430fee4603541676ec0b1d8ec0f487f` | `2026-08-09 16:29:33.229185007 +0000` |

Both passed package/version/code, Development signer, ARM64-only, TDLib JNI,
NDK r28c/16-KiB native layout, and credential/private-content inspection. The TV
exporter, TV CI downloader, installer, and Shield deployer were not run.

`adb devices -l` listed no attached device. Therefore no code-8 installation,
launch, update, credential provisioning, metadata request, Telegram discovery,
source playback, cache/resume preservation, cleanup action, or Shield behavior is
claimed from local or CI validation.

### Commands actually run

The observed command set included all mandatory application and agent-memory
preflights and these milestone checks:

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
./gradlew :core-metadata:testDebugUnitTest
./gradlew :core-catalog:testDebugUnitTest
./gradlew :core-model:test
./gradlew :core-provider:test
./gradlew :core-playback:testDebugUnitTest
./gradlew :core-telegram:testDebugUnitTest
./gradlew :core-security:testDebugUnitTest
./gradlew :core-provisioning:testDebugUnitTest
node tools/verify-lan-crypto-fallback.mjs
node tools/verify-provisioning-html.mjs
node tools/verify-pmtprov-interop.mjs self-test
./scripts/test-inspect-pmtprov.sh
./scripts/test-verify-upgrade-apks.sh
./scripts/test-apk-phone-delivery.sh
./scripts/test-mobile-apk-phone-delivery.sh
./scripts/test-download-latest-ci-apk-rejections.sh
./scripts/test-download-latest-ci-mobile-apk-rejections.sh
./scripts/test-apk-credential-scan.sh
bash -n scripts/*.sh
bash -n scripts/lib/*.sh
./scripts/export-latest-mobile-apk-to-phone.sh
./scripts/download-latest-ci-mobile-apk-to-phone.sh
./scripts/verify-mobile-apk.sh --apk /storage/emulated/0/Download/PrivateMediaTV/Mobile/private-media-tv-mobile-latest.apk
adb devices -l
git diff --check
```

Two initial independent-verifier invocations were command-usage errors, not APK
failures: one omitted required `--apk`, and one supplied the APK digest to the
option whose value is the expected signer fingerprint. The corrected invocation
shown above passed with the configured Development signer.

## Local mobile-only delivery

Before the application push, the local mobile exporter copied the verified local
code-8 APK to:

`/storage/emulated/0/Download/PrivateMediaTV/Mobile/private-media-tv-mobile-latest.apk`

It was 58,063,300 bytes with SHA-256
`5a3b9ce0302876d4132e5588e1c05b37e230c9c684dec8f7795fc7138cc98658`
and modification time `2026-08-09 16:35:18.477184875 +0000`. This was file
delivery only, not installation or physical acceptance.

Parent TV `latest`, `previous`, and the provisioning tool retained their exact
pre-publication hashes, sizes, timestamps, and inodes. No TV exporter or
deployment ran.

## Exact-final-HEAD Android CI

| Field | Value |
| --- | --- |
| Run | `31324478391` |
| URL | `https://github.com/funzi7/private-media-tv/actions/runs/31324478391` |
| Event / branch / commit | `push` / `main` / `e0b6557f128cb4a33e218edadae7f930c3eadbe5` |
| Run time | `2026-08-09T16:42:22Z` through `2026-08-09T16:53:28Z` |
| Conclusion | success |
| Wrapper job | `93272541946` — success, `16:42:31Z` through `16:42:40Z` |
| Android build job | `93272567405` — success, `16:42:44Z` through `16:53:27Z` |
| Mobile artifact | `private-media-tv-mobile-apk-e0b6557f128cb4a33e218edadae7f930c3eadbe5`, artifact `9041248660`, 57,340,363-byte archive, SHA-256 `d71ec98924bc819dccfc868330566c282e760f7d32843bfef063ec7ad74c11bf` |
| TV artifact | `private-media-tv-apk-e0b6557f128cb4a33e218edadae7f930c3eadbe5`, artifact `9041248166`, 58,002,247-byte archive, SHA-256 `9082ef6c80856c2f8511fe6b1bfe73b299e050d19d00de3278aecc336290f33d` |

The exact-HEAD run passed wrapper validation, pinned official-TDLib artifact
verification without a native rebuild, downloader rejection tests, browser
crypto fallback, Development signer reconstruction/verification, aggregate
tests, focused F2B tests, lint, signed ARM64 TV/mobile assembly, package/version/
signer/JNI/content inspection, non-sensitive metadata/checksum generation, and
both artifact uploads. The pull-request-only signer step was correctly skipped
for the push run. Both artifacts were created on 2026-08-09 and were unexpired
when inspected.

## Final exact-HEAD CI mobile-only delivery

After CI succeeded,
`./scripts/download-latest-ci-mobile-apk-to-phone.sh` selected only the exact-
HEAD push artifact. It verified artifact shape and metadata, checksum, package,
version, Development signer, ABI, JNI, native layout, and prohibited-content
boundary, then published through the Mobile-only rotation path.

| Field | Final CI mobile APK |
| --- | --- |
| Canonical path | `/storage/emulated/0/Download/PrivateMediaTV/Mobile/private-media-tv-mobile-latest.apk` |
| Package/version | `com.funzi7.privatemediatv.mobile`, `0.3.0-phone-test` (`versionCode` 8) |
| Size | 57,339,289 bytes |
| APK SHA-256 | `ffb6d1b0f530fc258c0b60d75d202e08224f3149faef5833e2a02461bba429b9` |
| Fresh modification timestamp | `2026-08-09 16:59:06.537184330 +0000` |
| Modification epoch | `1786294746` |
| Development signer SHA-256 | `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` |
| ABI | ARM64 only |
| Packaged JNI SHA-256 | `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f` |
| Native layout | NDK r28c, ARM64 DYN, 16-KiB compatible and aligned, expected dependencies only |

The final APK is a real regular copied file, not a symlink. A corrected
independent `verify-mobile-apk.sh` invocation passed against the canonical file.
Parent TV `latest`, `previous`, and the provisioning tool retained their exact
pre-download hashes, sizes, timestamps, and inodes. No TV export, CI TV download,
installation, launch, or deployment occurred.

## Limitations, risks, and next step

Physical mobile code-8 acceptance remains pending. No physical update over code
7, retained Telegram session, existing cached/resume playback, local TMDB
credential provisioning, live TMDB catalog/search/details, on-demand source
discovery, immediate cached source reopen, manual refresh, exact episode match,
source playback, scope invalidation, or legacy-cleanup preservation result is
claimed. Follow `docs/MOBILE_ACCEPTANCE.md` in order and record only safe
outcomes; never publish a credential, channel/media label, filename, provider
identity, database content, or identifying screenshot.

Runtime availability and search latency depend on the locally provisioned TMDB
credential, Telegram account/channel membership, network conditions, and media
naming. Extended search remains deliberately bounded and does not guarantee that
every source can be found. Claimed release tags remain distinct from verified
media properties.

F2C is next: final TV Home/details/series UX plus Continue Watching integration
on top of the physically proven F2B data flow. F2D remains advanced source
selection and external subtitle/audio integration. Shield acceptance, TV
delivery, installation, and deployment remain deferred.

## Continuation

1. Install mobile code 8 over code 7 without uninstalling or clearing data.
2. Perform the 26-step F2B procedure in `docs/MOBILE_ACCEPTANCE.md`, including
   retained Telegram/cache/resume checks before locally configuring TMDB.
3. Confirm TMDB Home/Search/Details never starts a history scan and that
   Telegram discovery begins only from explicit Sources/Play/refresh.
4. Confirm cached source results reopen immediately, exact episode matching and
   source-scope revision behavior, and optional confirmed legacy cleanup while
   preserving session/cache/resume/TMDB/source-cache state.
5. Record only safe outcomes, then proceed to F2C. Do not infer Shield behavior
   from phone acceptance and do not deliver the TV APK for F2B.
