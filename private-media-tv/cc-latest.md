# Private Media TV — F2C.2 Handoff

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | funzi7/private-media-tv |
| Milestone | F2C.2 — Watched UX, Israel VOD catalog, catalog card actions, details polish, exhaustive resumable Deep Search, player/auto-next reliability |
| Branch / tracking branch | main / origin/main |
| Starting application HEAD | d335da59602301f9fc4596f00ee40ab704a7a0b5 |
| Final application HEAD | d3b833f34702c3da1a53d6e411e5edd3400e7981 |
| Starting agent-memory HEAD | a2305ff194bfd5dc8c4e591addbdfa7ed52fdfdf (manager-verified; no unrelated commits landed during the milestone) |
| Exact-head Android CI | 31980349812 — success |
| Mobile identity | com.funzi7.privatemediatv.mobile, 0.4.2-phone-test, versionCode 21 (updates code 20 in place) |
| TV regression identity | com.funzi7.privatemediatv, 0.6.2-f2c2, versionCode 25 (regression build only, not delivered) |
| Development signer SHA-256 | 2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0 |

One cohesive F2C.2 commit on main, pushed without force; the final application HEAD matches
origin/main. Exact-head Android CI passed and uploaded both signed artifacts; only the mobile
artifact was downloaded and published. No TV export/delivery, no Shield, no adb device attached.

## What F2C.2 implemented (application HEAD d3b833f3)

Full decision record: `docs/adr/0022-f2c2-watched-ux-israel-availability-deep-search-autonext.md`;
narrative: CHANGELOG F2C.2 entry, PROJECT_STATE F2C.2 sections, PRODUCT_SPEC + UX_DECISIONS
F2C.2 sections (superseding the F2B.5/ADR-0017 Deep 20-second batch-wall contract, the
`קבוצה N מתוך M` progress wording, and the textual player actions), DATA_MODEL (UserState v5 +
territory availability), TMDB_INTEGRATION (region-IL registry and coverage truth),
PLAYBACK_CONTINUITY (exactly-once transition), AGENTS.md (updated Deep + territory invariants),
TEST_PLAN F2C.2 matrix, MOBILE_ACCEPTANCE code-21 gates A–M.

1. **Exactly-once session-bound auto-next (physical code-20 defect).** The observed failure —
   `עבור עכשיו` in fullscreen did nothing while the NEXT episode appeared watched — was three
   compounding defects: `openCatalogPlayable` rejected PLAYBACK→PLAYBACK, the observation
   identity switched before the rejected handoff, and the old controller's 250 ms ticks wrote
   under the new identity. Now: `openCatalogPlayable` accepts the in-place catalog replacement
   and reports acceptance; identity binds ONLY after acceptance (rejected launches are abandoned
   with their pending source context discarded); every observation session owns an immutable
   token (`beginPlaybackObservation` returns it) carried by all progress/end callbacks, so stale
   controller callbacks are provably dropped; the button only REQUESTS via the coordinator's
   once-latched `goNow` and the single `TransitionRequested` observer is the one transition edge;
   `F2bContinuationTransitionState` renders `עובר לפרק הבא…` / truthful failure + `ניסיון נוסף`;
   fullscreen state is screen-scoped so window/orientation survive the replacement; the
   physically confirmed view-scoped keep-screen-on is untouched.
2. **Exhaustive resumable Deep Search (physical code-20 defect).** The 12-source batch loop whose
   first 20-second-wall expiry abandoned all later sources is replaced with terminal-set
   orchestration: the eligible distinct remaining selected-source set runs in concurrent groups
   of ≤4 (`deepBatchMillis` bounds one GROUP, never the pass), the adapter attributes per-chat
   outcomes (`completedSourceChat` on Progress; completed/timedOut/failed source lists on
   terminals — opaque channel identities only), every source ends COMPLETED/TIMED_OUT/FAILED,
   and an in-memory item-scoped checkpoint (identity + scope revision + normalized plan
   signature; LRU 4/pipeline) lets a repeated Deep resume remaining and retry failed sources
   (fully-completed sessions start fresh; scope/plan changes reconcile). UI:
   `חיפוש מעמיק · נבדקו X מתוך Y מקורות · בודק 4 מקורות במקביל`, a truthful summary line, the
   exact-coverage PARTIAL terminal with `נסה שוב מקורות שנכשלו`, and the full-completion-only
   no-match wording; `SourceDiscoverySafeStatistics` gained invariant-checked
   planned/completed/resumed/timedOut/failed/inFlight/remaining counters (aggregate-only). FAST/
   known/owner-literal budgets and every F2C.1 relevance/presentation floor are unchanged.
3. **Israel availability dimension.** New provider-neutral territory model in core-metadata:
   `TerritoryAvailabilityStore` over the additive Room DB `territory-availability.db` v1
   (observations PK territory+provider+identity with currentlyAvailable, firstObservedAt set
   exactly once and defined as "first time this app observed availability" — never an official
   launch-date claim — lastObservedAt, optional authoritativeAvailableSince, provenance,
   initial-baseline flag; baselines table). Verified coverage (2026-08, TMDB region-IL watch
   pages/JustWatch IL): global streamers only — Netflix 8, Prime Video 9/119, Disney+ 122/337,
   Apple TV+ 350, HBO Max 1899; the six Israeli operators (HOT, yes+, STING+ ex-STING TV,
   FreeTV, Cellcom TV+, Partner TV+) are NOT in TMDB/JustWatch IL data and none except FreeTV
   has a verified stable public catalog source; FreeTV's public portal JSON API exists (real
   `since` dates) but is an undocumented vendor API without a stable ordering contract, so it
   stays a prepared-but-deferred OFFICIAL_PROVIDER_FEED adapter — no scraper fabricated.
   Ingestion: bounded cached TMDB Discover snapshots via the new
   `CatalogDiscoveryCategory.TerritoryProviderAvailability` (`watch_region=IL` +
   with_watch_providers; never origin-country; never in the passive registry). Home appends
   store-projected rows (`חדש לצפייה בישראל` + per-provider new rows), identity-deduplicated,
   omitted while empty, fail-soft, zero Telegram; the first snapshot is a baseline so nothing is
   "new today" right after initialization, and the stale-while-revalidate layer means a newly
   available title records on the NEXT Home load after the background refresh (documented).
   ADR 0014 origin rows and the F2C.1 provider registry are untouched.
4. **Watched UX + top-level Seen (UserState v4→v5, strictly additive).** `MIGRATION_4_5` adds
   only `seen` + `seenUpdatedAtEpochMillis` (+1 index) on `user_media_preferences`; every
   code-20 row stays readable. `setSeen` journals explicit LIBRARY/SEEN mutations; an explicit
   choice survives with all flags off; `observeSeen` returns every explicit choice (true AND
   false) so explicit-unseen overrides the deterministic `TitleSeenPolicy` (movie real
   completion auto-promotes effective Seen; a series never derives it);
   `observeCompletedMovieKeys` feeds only that derivation;
   `OwnerRecommendationSignalProjection` exposes typed favorite/want/not-interested/title-seen/
   manual-vs-automatic-episode-watched/real-playback signals with no ranking. UI: the inline
   season header regained the compact watched control (`סמן עונה כנצפתה`/`סמן עונה כלא נצפתה`,
   aired-only bulk, future protected); every inline episode card has an independent eye toggle
   (`setEpisodeWatchedFor` — flips only the watched register, never opens discovery); poster
   cards carry Favorite (red heart) / Want-to-Watch (bookmark) / Seen (eye) overlay actions
   (`toggleCard*`) that never open details.
5. **Details + player polish.** `F2bExpandableOverview` (ellipsis + `עוד`/`פחות`, no hard cut);
   `tmdbVoteLabel` = `TMDB: <LRI>x.x/10<PDI> · N הצבעות` (LTR-isolated scale; can never read as
   `ציון 100`); bidi-safe secondary year range beside the series title (ongoing open range, no
   fabricated end year); `עונה 1 · 7 פרקים` (`פרק אחד`). Player: LTR-isolated seek row (−10
   LEFT, +10 RIGHT), icon Play/Pause with Hebrew semantics, auto-mirrored Back icon available in
   BOTH window modes running the same progress-saving back flow.
6. **MKV/MP4 document regressions (no redesign).** Pinned end to end: mapper
   (`synthetic.show.s01e02.mkv` + `video/x-matroska` → VIDEO_DOCUMENT, duration unknown,
   supportsStreaming=false never hides a File upload), adapter resolve → range-source playable on
   the durable VIDEO_DOCUMENT slot for `.mkv` and `.mp4`, and engine local-index → episode
   matching → presentation for an `.mkv` document candidate.
7. **Versions/delivery plumbing.** Mobile 20→21 and TV 24→25 across build.gradle.kts,
   MobileModels, MobileManifestContractTest, android-ci.yml exact-head assertions/metadata,
   verify/export/download scripts, both delivery harnesses, CI rejection fixtures, and
   upgrade-verifier fixtures; rotation allow-list adds `0.4.1-phone-test:20`; broken
   `0.3.9-phone-test:17` stays blocklisted from the rollback slot.

## Validation evidence

- Focused F2C.2 regressions first (AN order), all passing at the final HEAD:
  `F2c2SeenRegisterStoreTest` (explicit/durable Seen incl. explicit-unseen survival, the
  deterministic policy, completed-movie keys, the exact 5-aired+1-future season bulk, the typed
  signal projection, and the real chained 1→2→3→4→5 migration over a seeded on-disk v4 code-20
  DB), `TerritoryAvailabilityStoreTest` (500-title baseline never "new", firstObservedAt set
  once, no-evidence titles excluded, multi-provenance dedup, authoritative dates only when
  supplied), `F2c2IsraelAvailabilityDataSourceTest` (baseline → no rows; world premiere stays
  out; a later-observed title enters the Hebrew rows once across providers, following the real
  stale-while-revalidate cadence), rewritten `SearchEngineV2IntegrationTest` Deep suite (distinct
  coverage in ≤4 groups + progress invariant, one-timeout-never-stops + exact terminal
  accounting with PARTIAL not DEADLINE, checkpoint resume, scope-change invalidation, retained
  progressive results, `.mkv` document candidate through index/matching/presentation; K1–K8 and
  the F2C.1 relevance suites retained), `F2bSearchEngineV2PresentationTest` (distinct-source
  labels, no `קבוצה`, deep summary + exact-coverage partial notice),
  `F2c2AutoNextTransitionViewModelTest` (exactly-once under repeated requests, old-token
  callback isolation, failed transition leaves next episode untouched, prepared-but-unplayed
  gains nothing, real playback commits normally, abandoned launch discards context),
  `MobileViewModelTest` in-place PLAYBACK→PLAYBACK addition, `MobilePlayerOverlayComposeTest`
  (+10 visually right of −10 in RTL, icon Play ≥48dp, fullscreen Back invokes back flow),
  `MobilePlayerWindowContractTest` (icon/back/LTR-seek pins, fullscreen-state survival, one
  transition edge + explicit retry), `F2c2DetailsPresentationTest`/`F2c2DetailsComposeTest`
  (9.1/10 + 100 votes, bidi-safe year ranges, episode-count noun, עוד/פחות expand/collapse),
  `TdLibContentMapperTest`/`TelegramCatalogSourceAdapterTest` document additions, plus the
  F2cPlaybackFirst/F2c1 regression suites and both contract tests.
- Broad pass at the final HEAD: `./gradlew test lint :app-mobile:assembleDebug
  :app-tv:assembleDebug` BUILD SUCCESSFUL — 1,310 unit tests, 0 failures/0 errors/0 skips across
  all modules; lint clean (after converting raw bidi isolate characters to \u escapes for the
  BidiSpoofing check); `git diff --check` clean. Local mobile debug APK verified:
  0.4.2-phone-test (21), ARM64-only, one `lib/arm64-v8a/libtdjni.so` (sha
  21d59ebfeba4edc62ea74cefaa79b08650e796530f3d5e57804105cc44cb65dc), Development signer.
- Script harnesses: credential scan 41, TV delivery 9, mobile delivery 14, mobile CI rejections
  20+1, TV CI rejections 8, upgrade verifier 13, pmtprov 4 — all passed; `bash -n` clean on all
  scripts.
- TDLib verify-only (NO rebuild): pinned commit 022d60202e446ad1287b9fb68e687c8a0760788b, ARM64
  AAR sha 025313d2a7cdbf148e5c700e8ef6c9d384f2301aff043c844997e0c23eb9abd2.
- CI: exact-head `Android CI` run 31980349812 for d3b833f3… completed success (wrapper
  validation, script self-tests, full tests, lint, both assemblies, version/signer/payload
  verification, artifact upload).

## Delivery evidence (mobile only)

Published via `./scripts/download-latest-ci-mobile-apk-to-phone.sh` from CI run 31980349812,
artifact `private-media-tv-mobile-apk-d3b833f34702c3da1a53d6e411e5edd3400e7981`:

- Latest: `/storage/emulated/0/Download/PrivateMediaTV/Mobile/private-media-tv-mobile-latest.apk`
  — 0.4.2-phone-test (21), APK SHA-256
  558dd31f91713d405bb83df510eb5dd3ca6450cf826a8c7302b9170071efe162, 58,871,292 bytes, modified
  2026-08-17 00:09:44 UTC, ARM64-only, one `lib/arm64-v8a/libtdjni.so` (packaged JNI sha
  790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f), Development signer verified.
- Rotation result: `rotated` — previous is now the code 20 build (0.4.1-phone-test),
  byte-identical to its original publication (SHA-256
  2a64adf2e0269c4356af7af49248de7b8b4cea185022ca7c1d13e1a2aff34c87, 58,783,400 bytes). Broken
  code 17 is not present in any canonical slot and remains blocklisted from promotion.
- Only the two canonical Mobile files exist; TV files untouched.

## Not done / pending

- **Physical code-21 acceptance is PENDING** on the owner's phone — gates A–M in
  `docs/MOBILE_ACCEPTANCE.md`: in-place install over code 20 (no uninstall/clear-data), the
  inline season control and episode eyes, poster action icons without opening details, the
  overview/vote/year/season-label presentation, the Israel rows (truthfully empty right after
  the first snapshot; a US-only premiere stays out; real IL availability enters), the
  distinct-source Deep progress with resume and exact-coverage terminals, the player control
  order/icons/fullscreen-Back/keep-screen-on, the fullscreen `עבור עכשיו` transition with
  exactly-once semantics and the next episode never wrongly watched, MKV file playback subject
  to device codecs, and the code-20 regressions (small source sets, collapse/reuse, direct
  resume, movie completion, provider rows, indexes/session intact).
- The earlier physical code-20 (F2C.1 gates A–M), code-19, and F2B.5.2 acceptances remain open
  history.
- Known bounded behaviors (flagged in RELEASE_REVIEW): the Deep checkpoint is in-memory (a
  process restart re-runs the full set — slower, never wrong); group-budget expiry without
  per-chat attribution conservatively marks the group timed out; Israel availability observes
  the popularity head of each provider snapshot, lags one stale-while-revalidate cycle, never
  detects departures, and only the five global streamers are covered; the poster Seen eye cannot
  visually distinguish auto-promoted from explicitly-chosen (both active by design).
- The final TV rendering of the playback-first flow (D-pad) remains the standing open TV-side
  item; TV code 25 is compile/regression evidence only.

## Continuation instructions

Next agent: obtain the owner's physical code-21 result first (gates A–M in
`docs/MOBILE_ACCEPTANCE.md`). If a gate fails, pull a real Android bug report before changing
anything; a transient Telegram failure is never a broken pointer/target, and an empty Israel row
right after install is baseline truth, not a defect. Architecture decisions live in ADR 0022;
the milestone record is in CHANGELOG / PROJECT_STATE / TEST_PLAN / RELEASE_REVIEW / HANDOFF at
the application HEAD above. Environment/bump reminders: MobileManifestContractTest pins the TV
literals; the mobile delivery harness self-asserts the caller scripts' EXPECTED_VERSION pins;
the rotation allow-list needs the outgoing build added when bumping (this milestone added
`0.4.1-phone-test:20`); Robolectric user-state tests must chain MIGRATION_1_2/2_3/3_4/4_5 with
BundledSQLiteDriver; never trust `./gradlew … | tail` exit codes (use pipefail or capture `$?`);
Android lint BidiSpoofing forbids raw U+2066/U+2069 in sources (use \u escapes); Robolectric
text overflow needs hard line breaks and semantics-action clicks; the stale-while-revalidate
metadata layer serves cached pages first even under forceRefresh, so fresh-fetch side effects
land on the next load.
