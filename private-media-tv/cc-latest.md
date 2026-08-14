# Private Media TV — F2B.5 Handoff

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | funzi7/private-media-tv |
| Milestone | F2B.5 — Search Engine V2 local index and bounded Telegram live search |
| Branch / tracking branch | main / origin/main |
| Starting application HEAD | 6cfbe7d870e8478b9014f25d29eadfc662304246 |
| Final application HEAD | 8b2f0eb6102695201244f56e7242c4e5c4f6b444 |
| Starting agent-memory HEAD | 8c77b5d38423e91b2c8ade6c72e0ca3af04f9caa |
| Exact-head Android CI | 31815991716 — success |
| Mobile identity | com.funzi7.privatemediatv.mobile, 0.3.7-phone-test, versionCode 15 |
| TV regression identity | com.funzi7.privatemediatv, 0.5.7-f2b5, versionCode 20 |
| Development signer SHA-256 | 2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0 |

The application milestone was committed once and pushed without force. Final application HEAD
matches origin/main. Exact-head CI passed, and only its mobile artifact was downloaded and
published to the isolated Mobile shared-storage directory. The TV artifact was built and verified
as a shared-code regression but was not downloaded, exported, installed, or delivered. No Shield
command ran.

## Implemented architecture and behavior

### One authoritative Search Engine V2 pipeline

Normal production discovery now uses this single order:

1. existing exact binding;
2. local Room search index;
3. eligible manual or proven known-source live search;
4. bounded active live-search pool;
5. explicit Deep Search batches.

Exact binding still returns before any local query or Telegram work and continues through the
existing resolver, Media3 player, TDLib byte cache, downloads, and playback stack. Search Engine
V2 is the production default. The old discovery service and old 100-result dual media-filter
transport remain reachable only through explicit LEGACY_DIAGNOSTIC construction. Production never
runs both engines and never automatically falls back to legacy after a V2 miss.

Automatic, owner-literal, recurring-program, and refresh paths now route through V2 semantics.
Home, TMDB browsing/details, and metadata search still never start Telegram discovery.

### Android-native local search index

Catalog Room schema 11 is an additive migration. It retains the existing private metadata-index
base rows and adds:

- a standalone FTS4 unicode61 projection with deterministic trigger synchronization and migration
  backfill;
- a deterministic normalized substring column and token-prefix fallback;
- separate account-scoped live-pool configuration and pin rows; and
- a stable index scan-start marker used by generation-safe reconciliation.

The normalizer uses Unicode NFKC, locale-independent lowercasing, punctuation and common filename
separator normalization, and collapsed whitespace. Search covers caption/text, filename, dates,
attachment metadata, and durable source/message/attachment identity without downloading video
bytes. It supports Hebrew, English, mixed Hebrew/English, numbers, punctuation, exact normalized
phrase, normalized substring, all-token, and supported token-prefix lookup.

Ranking is deterministic: literal strength is evaluated before learned evidence, then stable
source affinity and newest-date tie breaking. The implementation validates the complete bounded
local union before applying the presentation cap, so newer weak or identity-rejected rows cannot
hide an older exact literal result. A focused 58-selected-source dataset returns locally without
calling Telegram.

All selected My Sources may contribute indexed rows, including selected sources outside the
active live pool. Partial sources are searchable immediately. Per-source and Index All workflows
support newest-to-oldest metadata scans, durable checkpoints, cancel, pause/resume, process restart,
generation rejection, edits, replacements, deletes, and new messages. A replayless runtime gap
conservatively marks READY work stale and invalidates a partial head cursor while retaining
searchable rows. Incremental rows create or update an accurate PARTIAL job and indexed-media count.

The My Sources UI exposes NOT_INDEXED, INDEXING, PARTIAL, READY, STALE, and FAILED, indexed counts,
per-source actions, and the required Hebrew Index All action. Index All accounts for every selected
source while only issuing history work for currently provider-eligible sources; retained rows for
an ineligible source stay visible rather than being silently discarded. Indexing uses
GetChatHistory metadata only and never calls DownloadFile.

### Active live pool, known override, and Deep Search

My Sources selection remains authoritative and keeps all existing selections. It is independent of
LIVE SEARCH SOURCES:

- missing configuration means deterministic AUTO mode, up to 8 eligible sources;
- explicit pinning is transactionally capped at 12;
- attempting source 13 returns a typed rejection and does not deselect or delete anything;
- manual affinity is authoritative, including an explicit empty override;
- otherwise only PROVEN learned affinity can override the normal cap;
- one discovery operation increments affinity at most once per source, so two distinct successful
  operations are required to become proven; and
- a known/manual/proven source remains eligible for its title even outside the configured 12.

FAST and OWNER_LITERAL search local rows first, then eligible known sources, then the active pool
only if still needed. Literal owner results remain visible when conservative TMDB parsing is
uncertain. DEEP is an explicit action: it searches the local index first and then only remaining
selected sources in deterministic batches of at most 12. It continues through later batches after
an earlier hit, keeps all prior results visible in stable order, shows group progress, and stops
later batches on cancellation.

User-facing deadlines are centralized. An eligible known/manual operation and its remaining-time
pool fallback share an 8-second total deadline; a normal active-pool operation without that
override receives 15 seconds; each explicit Deep batch receives 20 seconds. Account-scope lookup,
chat preparation, searches, and paging are inside the total deadline. Individual provider work is
bounded to no more than 4 seconds so slow siblings release worker slots. Every path terminalizes as
results, partial results, empty, typed error, deadline, or cancellation; it cannot leave an endless
Loading state.

Results are progressive. The first valid result is surfaced immediately while siblings may
continue, later results append by durable identity without destructive resorting, and partial
coverage does not become a false completed miss. Starting a new query, leaving the route, explicit
cancel, or starting playback invalidates the old generation. Late results cannot contaminate a new
query, and cancellation retains every result already presented.

### Telegram-X-derived live pager

core-telegram now owns an isolated provider-neutral pager/state machine around official TDLib
SearchChatMessages. The initial request is unfiltered, fromMessageId 0, offset 0, limit 20. It
preserves totalCount and nextFromMessageId, handles short pages with continuation evidence,
requests later 20-result pages only when no usable media has been found or explicit variants are
requested, stops after the first usable automatic result, guards repeated cursors, and has a
budgeted safety ceiling.

Search context and request generations suppress stale responses. Cancellation, empty, typed error,
terminal page, and repeated-cursor states are explicit. Results retain Telegram ordering and are
deduplicated stably. Caption/text search happens before local identification of playable video and
plausible video documents, avoiding an over-restrictive server media filter. Pager request, page,
state, and internal transport toString output is redacted.

The adapter uses bounded parallel chat preparation and four search workers. It records partial
hydration/search failures, timeouts, pages, provider results, useful results, cancellations, and
terminal reason without exposing source names, queries, captions, filenames, or provider IDs.

### Search UX and diagnostics

The mobile harness presents the required simple Hebrew phases for local index, known source,
active-pool, and Deep batch work. It includes local-coverage explanations, AUTO/explicit live-pool
management, the 12-source rejection notice, Index All controls, source labels on result cards, and
Deep Search retention/cancellation. Existing exact binding, possible-owner-result behavior, Hebrew
episode parsing, recurring identity, fullscreen/orientation controls, and player continuity remain
covered.

Unrestricted diagnostics are count-only: local query time, indexed sources/rows/results, live
scheduled/completed/timed-out sources, pages, provider/useful results, cancelled work, elapsed
time, failure category, and terminal reason. Technical details remain behind the diagnostics
disclosure. No unrestricted diagnostic contains private source or media identity.

## Upstream reuse and licensing

The pinned research baselines are:

- groupultra/telegram-search at
  02baeec6b8a320ade999c773d2806622b6219b87, AGPL-3.0; and
- TGX-Android/Telegram-X at
  5459ddb884a56a668b31ca4357c4a0cdf7dae250, GPL-3.0-or-later.

telegram-search provided the architectural and adapted lifecycle model for selected-chat metadata
synchronization, batch persistence, local-only lookup, update/edit/delete upsert and tombstone
handling, cancellation, and checkpoints. Its Node, GramJS, Takeout, PGlite/PostgreSQL, Jieba,
vector/embedding, server, UI, and account-session implementations were not imported.

Telegram X provided the adapted 20-result SearchChatMessages pager, continuation, total-count,
context-generation, cancellation, and stale-response behavior. The application copied no Telegram
X UI, branding, assets, or unrelated code.

Source headers and docs/THIRD_PARTY_SEARCH_ENGINE.md record the exact repositories, pinned commits,
upstream paths, reuse classification, licenses, and original Telegram X copyright. Complete pinned
root license texts are stored under third_party/licenses. Their SHA-256 values are:

- telegram-search AGPL text:
  74971ebe9f8aff6d68fb017906a0c455d2aad56fbd46120fe56b734774724cfe;
- Telegram X GPL text:
  3972dc9744f6499f0f9b2dbf76696f2ae7ad8af9b23dde66d6af86c9dfb36986.

No external source was copied into this public agent-memory repository.

## Principal implementation areas

- core-catalog: SearchEngineV2, Room FTS4 index, ranking, live-pool persistence/planning,
  deadlines, progressive aggregation, exact/owner/deep behavior, recurring V2 routing, index
  lifecycle, migration 10 to 11, and privacy cleanup.
- core-telegram: Telegram-X-derived pager, unfiltered TDLib request/continuation mapping, bounded
  adapter concurrency/timeouts, partial failure accounting, cancellation/stale suppression, and
  diagnostic legacy transport.
- app-mobile: search/index/live-pool models, production composition, Index All coordinator,
  ViewModel cancellation/retention, source-management UI, diagnostics, and physical code-15
  acceptance harness.
- app-tv: shared-code compile/regression and version 20 only; no delivery or physical change.
- .github/workflows and scripts: F2B.5 focused CI, code-15/code-20 package assertions, safe
  predecessor update fixtures, and exact-head mobile artifact publication.
- docs and ADR 0017: product, architecture, data, Telegram, security, UX, test, release,
  distribution, state, handoff, third-party provenance, and SEARCH-first physical acceptance.

## Local validation

Focused prototypes passed before broad integration:

- local Room search covered Hebrew, English, mixed text, filename and punctuation normalization,
  substring, all-token/prefix, deterministic ranking, 58 selected sources with zero Telegram calls,
  incremental updates, and migration/backfill;
- the Telegram pager covered the initial 0/0/20 request, second and third-page continuation, short
  pages with continuation evidence, terminal empty, typed error, cancellation, repeated-cursor
  safety, stale context rejection, and new-query invalidation.

Focused integration suites then covered exact bypass, local-first known search, AUTO 8, explicit
12/source-13 rejection, known override outside the pool, 58-source local coverage, progressive
sibling results, hard deadlines including a suspended account lookup, bounded Deep batches and
retention/cancel, owner-literal uncertainty, recurring routing, Index All, lifecycle/restart, UI
phase copy, route/playback cancellation, and legacy-only construction.

Final validation completed successfully:

- ./gradlew --version;
- ./gradlew projects;
- ./gradlew test;
- ./gradlew lint;
- ./gradlew :app-mobile:assembleDebug;
- ./gradlew :app-tv:assembleDebug;
- ./scripts/bootstrap-tdlib-android.sh --verify-only;
- ./scripts/verify-tdlib-artifact.sh;
- package/version/signer, private-material, ARM64 JNI, ELF dependency, NDK r28c, 16-KiB load and APK
  alignment checks;
- mobile and TV delivery behavior harnesses, exact-head artifact-selection rejection harnesses,
  credential scan, PMTPROV inspection/interoperability, LAN crypto fallback, shell syntax, and
  upgrade-verifier behavior suites; and
- real local mobile code 14 to 15 and TV code 19 to 20 update compatibility checks.

The successful final test report contains 1,179 unique tests in 123 suites with zero skipped,
failures, or errors:

- app-mobile 264;
- app-tv 74;
- core-catalog 280;
- core-metadata 66;
- core-model 19;
- core-playback 90;
- core-provider 27;
- core-provisioning 48;
- core-security 98; and
- core-telegram 213.

The final local APKs were:

- mobile: 58,584,728 bytes, SHA-256
  ab146d53ff444ee7917452796567738322a90676d38a48b8aaa9e88f1d3ddefd,
  modified 2026-08-14 15:31:36.564807455 +0000;
- TV regression: 58,787,739 bytes, SHA-256
  a9cbc70a7ede64170f04bc58187ab79225b1bd574b3d2840d476fd4110cfcbdb,
  modified 2026-08-14 15:32:11.460807442 +0000.

Official TDLib 1.8.66 remains pinned to official source commit
022d60202e446ad1287b9fb68e687c8a0760788b, ARM64-only, NDK r28c, and 16-KiB-compatible. The verified
local artifact AAR SHA-256 is
025313d2a7cdbf148e5c700e8ef6c9d384f2301aff043c844997e0c23eb9abd2, and its source JNI SHA-256 is
21d59ebfeba4edc62ea74cefaa79b08650e796530f3d5e57804105cc44cb65dc. TDLib was verified only and
was not rebuilt.

adb devices -l found no attached device.

## Exact-head CI and mobile delivery

Android CI run 31815991716 completed successfully for exact application HEAD
8b2f0eb6102695201244f56e7242c4e5c4f6b444. Wrapper validation and the main job both passed. The
main job verified official pinned TDLib, artifact-rejection paths, LAN crypto fallback, Development
signing, unit tests, focused F2B.5 tests, lint, signed ARM64 TV/mobile assemblies, package/version,
signer, JNI and private-material rules, metadata/checksums, and both artifact uploads.

The exact mobile artifact is
private-media-tv-mobile-apk-8b2f0eb6102695201244f56e7242c4e5c4f6b444, artifact ID 9225368275.
The TV artifact ID 9225366861 was not downloaded or delivered.

The guarded mobile downloader independently required current remote main, the successful push run,
the exact artifact name, one APK/checksum/metadata set, matching commit/package/version/code/hash,
Development signer, ARM64-only JNI, and expected private-material policy. It then atomically rotated
only the isolated mobile files. Final publication:

- path:
  /storage/emulated/0/Download/PrivateMediaTV/Mobile/private-media-tv-mobile-latest.apk;
- size: 58,584,728 bytes;
- SHA-256:
  50596c8be1378d1c6538befe9cdb82555362c53cd10822ceebf7596fb53df23f;
- modified time: 2026-08-14 16:00:15.752806800 +0000;
- package/version: com.funzi7.privatemediatv.mobile / 0.3.7-phone-test (15);
- signer: the Development certificate above;
- ABI: arm64-v8a only; and
- packaged TDLib JNI SHA-256:
  790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f.

An independent post-publication verification confirmed the file is regular, not a symlink, and has
the same package, version, signer, ABI, JNI, size, hash, and timestamp. The previous mobile APK was
rotated within the Mobile directory. Parent TV shared-storage files were not changed.

## Physical acceptance, limitations, and next step

No authorized Android device was attached. There was no installation, launch, Telegram login,
real-source index build, real Telegram query, result selection, playback, cancellation, rotation,
or state-preservation test. File publication, unit tests, local builds, and CI are not physical
acceptance.

The remaining gate is the ordered code-15 SEARCH-first procedure in docs/MOBILE_ACCEPTANCE.md:

1. update mobile code 14 to 15 without uninstalling or clearing app data;
2. retest the previously working known title and playback;
3. retest the previously failing known source and confirm a local hit or terminal live result within
   the interactive budget;
4. verify progressive literal owner search in an active source;
5. verify indexed content from a selected non-active source, proving local coverage is not capped;
6. verify normal live fanout stays within AUTO/configured pool;
7. run explicit Deep Search for content outside both active pool and current local coverage;
8. verify a superseded query cannot contaminate the replacement; and
9. play the returned video and verify fullscreen, portrait, and rotation regression behavior.

On-device SQLite/FTS4 behavior, real TDLib latency, and live source-specific media mapping remain
physical acceptance risks until those tests pass. A conservatively stale index may require owner
resume/reconciliation after a replayless process gap. The legacy diagnostic engine is intentionally
retained for rollback comparison and should be removed only in a later cleanup milestone after
physical V2 acceptance.

The exact next milestone is code-15 physical F2B.5 acceptance only. Do not expand it into TV
delivery, Shield deployment, TMDB changes, a second Telegram session, server search, embeddings,
Node/GramJS/PGlite/PostgreSQL, UI branding reuse, or legacy removal.

Keep every real account, source, title, query, caption, filename, message identity, screenshot, and
session detail out of public issues, commits, CI, and agent-memory.
