# Private Media TV — F2B.4 Handoff

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | `funzi7/private-media-tv` |
| Milestone | F2B.4 — reliable private source intelligence, offline playback, rich metadata, and continuity |
| Branch / tracking branch | `main` / `origin/main` |
| Starting application HEAD | `de2d0b45102a58e5e9802caa6310d6432bbb85b1` |
| Final application HEAD | `5f198b1c727b866ca82b0622c82a5280081a4156` |
| Manager-verified F2B.3 CI baseline | `31547288691` |
| Final exact-HEAD F2B.4 CI | `31707468748` — success |
| Agent-memory base before this handoff | `93169d675be8387f4c4c8445719c5d0a735b9caa` |
| Mobile identity | `com.funzi7.privatemediatv.mobile`, `0.3.4-phone-test`, versionCode 12 |
| TV regression identity | `com.funzi7.privatemediatv`, `0.5.4-f2b4`, versionCode 17 |
| Development signer SHA-256 | `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` |

All application commits were pushed without force, and the final application HEAD matches
`origin/main`. The final scoped delivery commit adds the verified code-11 mobile predecessor to the
isolated rotation allowlist and covers the real code 11→12 rotation; it does not change application
runtime behavior.

Only the exact-final-HEAD mobile artifact was downloaded and published to shared storage. The TV
APK was compiled and verified as regression evidence but was not exported, downloaded to shared
storage, installed, or deployed. No Shield deployment command ran.

The agent-memory repository was fetched after final application CI and delivery. Its current HEAD
matched `origin/main`. Two unrelated existing working-tree edits outside `private-media-tv` were
preserved and excluded from this handoff commit.

## Code-11 physical source failures

Two distinct code-11 source failures were supplied as authoritative owner evidence and remain
separate in the release documentation:

- In the provider-zero case, 58 explicitly selected sources produced 162 completed source searches
  and zero provider results. With no candidate, the parser and matcher had nothing to inspect. This
  was not diagnosed as a parser failure.
- In the no-work case, 58 persisted selected sources produced zero searches because the previous
  adapter intersected persisted membership with an incomplete in-memory runtime projection. This
  was a source preparation defect, not a parser failure.

Persisted explicit selected membership is now authoritative. A failed hydration never deletes or
silently changes selected membership.

## Selected-source hydration and discovery

Selected-source preparation is a typed stage. Each persisted selected source first uses already
hydrated state or an exact targeted pinned-TDLib `GetChat` request, then receives a searchable,
temporarily unavailable, protected, unsupported, or definitively missing eligibility outcome.
Search planning consumes the returned hydrated record directly and does not depend on waiting for
the Main/Archive runtime snapshot to republish it.

Safe aggregate diagnostics expose only persisted, already hydrated, hydrated-on-demand,
searchable, temporary, protected, unsupported, and missing counts. Raw Telegram identities and
private text do not enter unrestricted diagnostics. `NO_SEARCHABLE_SELECTED_SOURCES` is possible
only after the entire effective selected set passes typed hydration and eligibility.

The runtime-empty regression uses 58 persisted selected fixtures, hydrates supported fixtures on
demand, creates real search work, and proves completed search count is greater than zero. The exact
TDLib operation is targeted per source; no all-chat hydration or history scan was added.

Per-chat textual search remains selected-source-only, lifecycle-owned, cancellable, bounded, and
conservative. A dedicated bounded recent-media fallback runs only after textual provider zero in a
manual/proven source or an explicitly expanded DEEP source. It inspects a centralized recent
window, maps caption/filename/date locally, and sends candidates through the normal conservative
movie, episode, and recurring-date matcher. It never escalates to unbounded history.

## Source affinity, aliases, learning, and metadata index

Provider-neutral source intelligence is persisted by stable media identity rather than title text:

- manual movie affinity;
- TV-series affinity inherited by seasons and episodes unless a lower-level override exists;
- explicit season and exact-episode overrides, including an explicit empty override;
- recurring-program affinity inherited by editions unless an edition override exists; and
- separate learned evidence with `PROVEN`, `LIKELY`, and `UNKNOWN` confidence.

Manual affinity is authoritative and is never removed or replaced by learning. FAST restricts work
to the effective manual affinity set when one exists. DEEP expands to other selected sources only
through the explicit user action. Temporarily unavailable manual assignments remain visible and
persisted.

Private manual aliases, learned successful forms, date forms, media filters, success/failure
recency, and proven sources are stored separately. Manual aliases win. Recurring identities reuse
the existing recurring template infrastructure rather than creating a competing system. No private
alias or source text enters logs, public diagnostics, CI fixtures, APK assets, or this handoff.

Catalog Room schema v9 adds a private adaptive Telegram metadata index and explicit per-source index
jobs. Adaptive rows are learned only from bounded discovery/fallback, explicit playback resolution,
known live updates, and explicit owner binding. Full metadata indexing requires the private owner
action, is metadata-only, resumable, cancellable, checkpointed, idempotent, newest-to-oldest, and
bounded per page. A stale process-death lease reopens as partial and does not invisibly resume on
ordinary startup. Direct/private and protected chats fail closed. No operation downloads complete
video bytes while building metadata.

Local source resolution is ordered cache, manual affinity, local index, learned evidence, targeted
FAST, bounded recent fallback, then explicit DEEP expansion. A fresh local-index match returns
without waiting for Telegram search.

## FAST and DEEP UX

The normal Hebrew UI uses distinct **חיפוש מהיר** and **חיפוש מעמיק** actions and matching progress
copy. FAST is affinity/index/learned-first and bounded; DEEP explicitly broadens aliases and selected
sources. A normal miss presents an actionable no-source message with Fast/Deep and source-management
choices. Stable technical states and aggregate counters remain available only behind **פרטי אבחון**
and never expose source identity or private metadata.

## Offline downloads and airplane playback

Catalog schema v9 also adds stable source/media-identity offline records and season batches. The
Telegram implementation uses TDLib's app-private downloaded file as authoritative bytes through the
pinned official download-list APIs; it does not create a second Media3 `SimpleCache` copy.

Movies, single TV episodes, recurring editions, and season batches support provider-neutral states,
bounded concurrency, explicit quality policy, pause/resume, retry, single-item cancel/removal,
remaining-season cancel, process restart recovery, independent sibling failure, progress/known
bytes, storage pressure handling, and explicit retention pins. Completion is published only after
physical completion and durable pinning. Removal uses the existing TDLib-confirmed safe deletion
boundary and never deletes unrelated media or user state.

A complete exact retained item is resolved before remote source work. The runtime-independent local
resolver confines reads to the app-private TDLib files root, rejects path escape/symlink/non-regular
or size-mismatch cases, and returns the existing secure provider-neutral local range source without
requiring a running Telegram runtime. Airplane-mode playback therefore retains seek, resume,
Continue Watching, watched state, speed, embedded audio/subtitles, and next-item playback when that
exact next item is also complete offline. A missing offline next item fails clearly rather than
spinning. Legal cached metadata/artwork keeps the Downloads/details surfaces usable offline.

## Rich official TMDB metadata

The provider-neutral metadata model and app-private cache now cover official TMDB movie and TV
details, production/origin data, credits, creators, networks, region-labelled certification/content
ratings, external IDs, collection membership, last/next official episode summaries, videos,
recommendations, and similar metadata. Movie budget/revenue and all optional fields are omitted when
absent or invalid rather than fabricated. TMDB votes remain explicitly labelled TMDB.

TV year-range policy closes a range only when official lifecycle evidence says ended or canceled,
with valid dates and no in-production state. Returning, active, planned, unknown, or merely
currently-last-aired series display an open range such as `2020–`. Absence of a scheduled next
episode never implies a finale.

Movie collection continuation uses only official same-collection membership and valid release
dates. It chooses one unique earliest later already-released part and fails closed for a missing
current part, missing/equal dates, ambiguity, branches, or future releases. It never infers sequence
from title numbering.

IMDb remains an external ID only. The official IMDb API requires a paid/new-secret owner decision,
and the bulk dataset requires a separate licensing/storage decision, so no IMDb rating provider was
added. No IMDb or Rotten Tomatoes scraping or fabricated score exists.

## Trailer metadata and spoiler policy

Official TMDB video endpoints map into a provider-neutral typed trailer/teaser/clip/featurette/other
model. Endpoint context, never vague title text, proves movie, general-series, season, or episode
scope. General-series trailers are preferred; then a current/relevant watched-season trailer; then a
spoiler-safe teaser. A future-season trailer cannot become the series Hero/default, remains grouped
under its official season, and carries the spoiler-warning policy until watched progress unlocks it.

YouTube target identity is cached as non-playable metadata only. F2B.4 adds no IFrame, WebView
YouTube UI, Google Play Services, Firebase/analytics, or private YouTube engine, and exposes no
misleading active Play action for an unsupported target.

## Continuity, collection next, and end screens

Auto-next is enabled by default for the code 11→12 update, per explicit owner decision. A persistent
global setting can disable it later. For an actually playing standard episode or recurring edition,
the coordinator shows the approved 20-second countdown only for a real unique already-aired next
item. **עבור עכשיו** is the default-focused D-pad action, activates with one OK, and actual
completion transitions automatically when the owner does nothing. Cancel suppresses only that
occurrence. Pause/seek, repeated events, future episodes, nonexistent items, and the latest real
recurring edition are covered fail-closed.

Near completion, next-source preparation uses cached source, affinity, index, and FAST only. It
never performs a 58-source DEEP fanout and never auto-downloads an item the owner did not queue.

Movies use the separate approved three-minute collection continuation overlay, including poster,
title, immediate action, and cancel. Only a unique official already-released collection successor
qualifies. If safe source preparation cannot complete, navigation falls back to details/source
selection rather than a black screen.

The deterministic end screen appears only when no direct continuation exists and official evidence
supports the terminal condition. A currently latest episode of an ongoing/returning series is not a
finale. Ranking uses Want to Watch, official TMDB Recommendations, Similar, then approved catalog
scope; it removes Not Interested, future/unavailable, duplicate, watched, and current items, and
returns a D-pad-focusable first result without claiming machine learning.

## Sync-ready local mutation journal

UserState Room schema v2 preserves v1 rows and adds provider-neutral playback progress plus a typed
field-separated pending mutation journal. Library booleans, watched/completed state, playback
position, Continue Watching, and supported preferences mutate local-first and work offline. State
and journal writes share one Room transaction.

Playback position cannot clear watched/completed state, and Favorite, Want to Watch, and Not
Interested retain separate field clocks. Sync payload types cannot represent Telegram credentials,
session/database state, TMDB credentials, raw chat/message/file identity, media bytes, private
filenames/captions, provider locators, or filesystem paths.

No network endpoint, worker pretending to synchronize, or remote server was added. Future
multi-device synchronization remains explicitly unimplemented.

## Compatibility and security

Mobile code 12 updates code 11 with the same package and Development signer. TV code 17 is a
compile/regression-only successor to code 16. Additive migrations preserve credentials, the
authenticated TDLib database/session, selected sources and inventory, recurring templates,
metadata/image/source caches, UserState data, library state, watched/resume/Continue Watching,
TDLib media bytes and cache ledger, player preferences, and provider registry.

Official TDLib 1.8.66 remains pinned to official source commit
`022d60202e446ad1287b9fb68e687c8a0760788b`, ARM64-only, NDK r28c, and 16-KiB-compatible. The
preserved local native artifact JNI SHA-256 is
`21d59ebfeba4edc62ea74cefaa79b08650e796530f3d5e57804105cc44cb65dc`; the published exact-CI
APK lineage JNI SHA-256 is `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f`.
No native rebuild occurred.

Raw TDLib types remain inside `core-telegram`. No credential, private title/source name, Telegram or
message identity, filename/caption, private index content, offline path, session, token, QR data,
private URL, screenshot, or private database appears in unrestricted logs, public diagnostics,
tests, APK assets, CI output, or this handoff.

## Principal implementation areas

- `core-catalog`: Catalog v8→v9, source intelligence/affinity/aliases, adaptive and explicit index,
  offline queue/batches, bounded fallback, typed hydration statistics, conservative continuation
  and recommendation inputs, and UserState v1→v2 mutation journal/progress.
- `core-telegram`: exact targeted chat hydration, bounded recent-media metadata window, official
  persistent download-list commands/updates, retention integration, and runtime-independent
  verified complete-local playback.
- `core-metadata`: official rich TMDB fields, collections, certification/content ratings, lifecycle
  year policy, video/trailer scopes, recommendation provenance, and cache compatibility.
- `core-playback`, `core-model`, and shared UI: default-enabled occurrence-safe auto-next,
  collection continuation, end-screen ranking, focus/default-action semantics, and persistent
  preference migration.
- `app-mobile`: source-affinity/index/FAST/DEEP flows, diagnostics disclosure, Downloads, offline
  details/playback, rich optional metadata, trailer organization, countdown/collection/end-screen
  surfaces, and the ordered code-12 acceptance harness.
- `app-tv`: package/version regression assembly only; no delivery or physical deployment.
- Documentation: product, architecture, data model, Telegram/TMDB integration, playback/cache,
  offline downloads, UX, security, testing, release/distribution, roadmap/ADR, mobile acceptance,
  and Shield acceptance were reconciled to actual F2B.4 behavior and evidence.

## Validation evidence

Local validation passed:

- `./scripts/bootstrap-tdlib-android.sh --verify-only`;
- `./scripts/verify-tdlib-artifact.sh`;
- `./gradlew --version` and `./gradlew projects`;
- `./gradlew test` — 1,035 tests, zero failures/errors;
- `./gradlew lint`;
- `./gradlew :app-mobile:assembleDebug`;
- `./gradlew :app-tv:assembleDebug`;
- all focused touched-module tests;
- credential scan, provisioning/crypto interoperability, inspector, upgrade, signing, native
  layout, TV/mobile publication, TV/mobile exact-head downloader rejection/success, package/version,
  and shell-syntax harnesses; and
- `git diff --check` before every application commit.

The final local mobile APK was 59,239,067 bytes with SHA-256
`d809ba5f8277c7635ba1a02abff608acba4f42e322ba82e597a5e7b203b7aed6`. The regression-only local
TV APK was 59,228,363 bytes with SHA-256
`dc0f075e4744f58c24f55e2f0850f259ff928fe4cac3fc702e4c1bff6cdbcea6`. Both passed exact package,
version/code, Development signer, ARM64/JNI, native-layout, and prohibited-content inspection.

The first milestone exact-head CI attempt exposed hosted-runner build-tool drift in the native
cache fingerprint. A scoped fix kept ordinary build-cache reuse strict while making prohibited
`--verify-only` use the immutable published artifact's complete deterministic verifier. No native
rebuild was performed. Exact-head run `31704278195` then passed. Final delivery evidence comes from
the later exact-head run below, after the code-11 rotation regression was discovered and fixed.

Final Android CI run `31707468748` completed successfully for exact final application HEAD
`5f198b1c727b866ca82b0622c82a5280081a4156`. Wrapper validation, official TDLib verification,
1,035 tests, lint, signed ARM64 TV/mobile assemblies, package/version/signer/JNI checks, and both
artifact uploads passed. The exact mobile artifact ID was `9184213475`; the TV artifact was not
downloaded.

GitHub CLI artifact transfer stalled before publication. The same exact non-expired artifact was
retrieved through the authenticated GitHub artifact API over HTTP/1.1, archive-tested, then supplied
to the unchanged repository exact-head mobile downloader. That downloader independently re-resolved
remote `main`, successful run `31707468748`, the exact artifact name/commit metadata, checksum,
package/version/code, Development signer, ARM64-only ABI, and pinned JNI before atomic publication.

The published exact-head mobile APK is:

- path: `/storage/emulated/0/Download/PrivateMediaTV/Mobile/private-media-tv-mobile-latest.apk`;
- size: 58,289,812 bytes;
- SHA-256: `b694263c03b38c532661df703b49ead3cfc23c4e064cc6205789915488482913`;
- fresh modified time: `2026-08-13 14:22:11.385993214 +0000`;
- package/version: `com.funzi7.privatemediatv.mobile` / `0.3.4-phone-test` (12);
- signer: the Development certificate above; and
- ABI/JNI: ARM64-only with the pinned JNI hash above.

The existing verified code-11 APK was rotated to the package-specific `previous` path. A direct
post-publication verification proved same package/signer, old `0.3.3-phone-test` code 11 to new
`0.3.4-phone-test` code 12, ARM64-only JNI, and update-preserving `adb install -r` policy with no
uninstall, downgrade, or clear-data action.

`adb devices -l` found no authorized device. Therefore no installation, launch, airplane-mode
session, credential/session preservation observation, or ordered physical code-12 acceptance step
was claimed. Physical code-12 acceptance remains pending. TV/Shield physical acceptance also
remains pending and no Shield deployment was attempted.

## Future-only boundaries

- The remote private multi-device synchronization server remains future work; only the local safe
  mutation contract/journal exists.
- The isolated private YouTube/SmartTube engine remains future work. It must retain its own Media3
  player, no IFrame/WebView YouTube UI, no Google Play Services/Firebase/analytics/ad SDK, account
  and incognito modes, authoritative local history, supported remote history, and a provider-neutral
  TMDB/recurring matching boundary.
- SponsorBlock and DeArrow runtime integration remain future work. SmartTube/current ecosystem
  source, license, dependency, and submodule auditing is required before any reuse.
- No version number was assigned to future YouTube work.

## Safe continuation

1. Use the ordered physical procedure in the F2B.4 mobile acceptance document and install code 12
   over code 11 without uninstalling or clearing data.
2. Verify credentials/session and user-state preservation before testing discovery.
3. Reproduce the former no-search-work title, confirm targeted hydration creates real searches, then
   verify manual affinity restricts FAST and explicit DEEP expands only by owner action.
4. Exercise provider-zero bounded fallback, second-search index/learning acceleration, explicit
   source indexing with cancel/resume, and private diagnostic disclosure.
5. Download an episode and practical season subset, enable airplane mode, verify play/seek/resume/
   watched state and downloaded-next auto-next, then remove retention without removing user state.
6. Verify active/ended year ranges, collection continuation, 20-second episode auto-next, separate
   movie continuation, true-finale end screens, and the ongoing-series non-finale rule.
7. Keep all physical screenshots private unless they are proven free of source/index/media identity.
8. Do not implement the remote sync server or YouTube/SmartTube/SponsorBlock/DeArrow runtime as part
   of F2B.4 follow-up.
