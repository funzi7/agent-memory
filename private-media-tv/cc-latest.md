# Private Media TV — F2C.5 Handoff (incremental: catalog visual consistency, local catalog lookup/binding, relationships/recommendations, multi-source ratings, poster reliability, current-Israel availability)

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | funzi7/private-media-tv |
| Milestone | F2C.5 (incremental) — catalog card/poster/bidi/availability UI, structured local-file catalog lookup + typed binding, title relationship/recommendation rows, provider-neutral multi-source ratings, current-Israel availability |
| Branch / tracking branch | main / origin/main |
| Starting application HEAD | 519c4468770439ccf9fb7a5d97a0b8d4f3d7f9ac (F2C.4.1) |
| Final application HEAD | 0f2b2d08cf27aafcc9acf927ddf4315d9d284adc |
| Exact-head Android CI | 32123046275 — success (both jobs: Gradle wrapper validation; Official TDLib, tests, lint, signed TV/mobile APKs) |
| Mobile identity | com.funzi7.privatemediatv.mobile, 0.4.6-phone-test, versionCode 25 (updates code 24 in place) |
| TV regression identity | com.funzi7.privatemediatv, 0.6.5-f2c5, versionCode 28 (regression build only; shared metadata/presentation changed; NOT delivered) |
| Development signer SHA-256 | 2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0 |

Seven cohesive F2C.5 commits on main, pushed without force; final application HEAD matches origin/main.
The exact-head Android CI passed both jobs and uploaded the signed mobile and TV artifacts. Only the
mobile artifact was downloaded and published. No TV export/delivery, no Shield, no adb device attached.

**Incremental note:** the version identity labels this F2C.5, but the DELIVERED content is bounded to
the items below — the headline local-source *playback* integration (F2C.4 deferral #1) is DEFERRED
(architecture decision in ADR 0025). Owner physical acceptance is incremental.

## What F2C.5 delivered (final HEAD 0f2b2d0)

Decision record: ADR 0025. Narrative in CHANGELOG/README/TODO and the F2C.5 sections of PROJECT_STATE /
RELEASE_REVIEW / HANDOFF / TEST_PLAN / MOBILE_ACCEPTANCE / UX_DECISIONS / DATA_MODEL / TMDB_INTEGRATION.

1. **Uniform catalog card (`F2bMetadataCard`, the physical code-24 defects).** ONE fixed geometry
   (fixed width, fixed 2:3 poster viewport, fixed action-strip height reserved even when actions are
   absent, bounded title/metadata) — a long title never makes a card taller than its siblings. The
   Favorite/Want/Seen owner actions moved to a strip BELOW the poster (artwork never covered; the
   `viewModel.toggleCard*(card)` contract literals preserved). Bounded poster fallback chain
   (`MediaImages.posterFallbackChain`: poster → localized he→en→textless→any → cropped backdrop) with a
   title-aware placeholder — never a blank card; the image loader retains a cached image on refresh
   failure. Reusable content-direction title policy (`bidiContentTitle`/`bidiCardYearLabel`): Latin
   reads LTR, Hebrew RTL via the Unicode first-strong isolate; the year is a separate parenthesized
   LTR-isolated element. No fake "TMDB 0.0" (`VoteSummary.hasMeaningfulTmdbRating`) on cards or details.
   Isolate control chars are built at runtime (`Char(0x20xx)`) so no raw bidi character trips the
   `BidiSpoofing` lint. Reused by home rows, the end-screen, and detail relationship rows.
2. **Detail relationship rows + multi-source ratings.** Priority-ordered rows `סרטים בסדרה` (TMDB
   collection, real release order) / `אותו יקום` (explicit franchise) / `כותרים דומים` (Similar) /
   `מומלץ אם אהבת את זה` (Recommendations) with cross-row de-duplication + current/Not-Interested
   filtering + no empty rows (`f2bDetailRelationshipRows`/`TitleRelationshipDedup`). Provider-neutral
   `TitleRating` presentation — each source on its own scale (TMDB/IMDb /10, Metacritic /100, RT %),
   LTR-isolated, NEVER averaged (`titleRatingLabel`).
3. **Metadata enrichment backends (core-metadata).** `OmdbRatingProvider` (IMDb/Metacritic/RT by
   `external_ids.imdb_id`, optional runtime key, inert until provisioned, fail-soft);
   `WikidataFranchiseProvider` (WDQS SPARQL, CC0, P179/P1434 mapped to TMDB ids via P4947/P4983,
   descriptive User-Agent, fail-soft); `TitleRelationshipDedup`; `posterFallbackChain`;
   `TerritoryAvailabilityStore.currentlyAvailableInTerritory`; enrichment cache categories/TTLs.
4. **Structured local catalog lookup + typed binding (completes F2C.4 deferral #2).** Parser adds
   `3X07`; `LocalCatalogMatcher` corroborates parsed season/episode or title+year against a requested
   `MediaIdentity` (AUTOMATIC vs POSSIBLE, no fabrication on contradicting evidence);
   `LocalLibraryRepository.findCatalogCandidates` runs entirely off the persisted index (no SAF
   rescan). **Local Library DB v1→v2 additive migration** adds `boundConfidence` (OWNER/AUTOMATIC) +
   `boundAtEpochMillis`; a seeded v1→v2 upgrade test preserves the v1 folder/file + legacy owner
   binding (reads back OWNER); committed `2.json`. `playbackResourceKey` derivation unchanged (its
   pre-existing NUL field separator is now a Kotlin unicode escape in source — identical bytes).
5. **Current-Israel availability (details).** Distinct `זמין בישראל` block (series: `הכותר זמין בישראל`,
   never "כל העונות זמינות") from region-IL `/watch/providers` with the provider list + JustWatch
   attribution; evidence-floored (unknown → nothing, no crossed-out flag). The metadata-cache resource
   key already scopes by region, so US and IL do not collide.

Version bump across all pin sites (build.gradle ×2, MobileModels, MobileManifestContractTest,
android-ci.yml, mobile verify/export/download/delivery/rejection/upgrade scripts); rotation allow-list
gained `0.4.5-phone-test:24`; the code-23 physically-broken blocklist is unchanged.

## Validation evidence

- Broad: `./gradlew test lint :app-mobile:assembleDebug :app-tv:assembleDebug` BUILD SUCCESSFUL —
  1,445 unit tests / 0 failures across 11 modules, lint clean (incl. `BidiSpoofing`), both mobile and
  TV debug APKs assembled; `git diff --check` clean.
- New focused tests green: core-locallibrary (parser `3X07`, `LocalCatalogMatcher`, `findCatalogCandidates`,
  v1→v2 seeded migration), core-metadata (OMDb, Wikidata, poster fallback, TMDB-0.0 predicate,
  relationship dedup, currently-available store query), app-mobile `F2c5PresentationTest`.
- Script harnesses: mobile delivery 15, mobile CI rejections 20+1, upgrade verifier 13, credential
  scan 41, `bash -n scripts/*.sh scripts/lib/*.sh` — all passed.
- TDLib verify-only (NO rebuild): `bootstrap-tdlib-android.sh --verify-only` + `verify-tdlib-artifact.sh`
  — packaged JNI unchanged (Java JAR SHA e39bb497…, libtdjni.so SHA 21d59ebf… for the source artifact).
- CI: exact-head `Android CI` run 32123046275 for 0f2b2d0 completed success (both jobs; TDLib verify,
  tests, lint, signed TV+mobile assemblies, both artifacts uploaded).

## Delivery evidence (mobile only)

Published via `./scripts/download-latest-ci-mobile-apk-to-phone.sh` from CI run 32123046275, artifact
`private-media-tv-mobile-apk-0f2b2d08cf27aafcc9acf927ddf4315d9d284adc`:

- Latest: `/storage/emulated/0/Download/PrivateMediaTV/Mobile/private-media-tv-mobile-latest.apk` —
  0.4.6-phone-test (25), APK SHA-256
  1209916697d5d650c8af984d47646e7f1f81200e936386a09984d3b3a9369d57, 59,117,111 bytes, modified
  2026-08-18 10:02:25 UTC, ARM64-only, one `lib/arm64-v8a/libtdjni.so` (packaged JNI SHA
  790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f), Development signer verified.
- Rotation result: `rotated` — the code-24 `latest` was demoted to `previous`; new code 25 is `latest`.
  `previous` = 0.4.5-phone-test (24), APK SHA-256
  3456626dedfae5a7aa22aa8c80bd9d3d1ea5e8a2a0606be0f7f300e451e55685, 59,067,959 bytes. Broken code 23 is
  absent. Only the two canonical Mobile files exist; the TV `PrivateMediaTV/*.apk` files are untouched.
  Canonical rollback state: latest = code 25, previous = code 24, broken code 23 excluded.

## Deferred / not done (documented in ADR 0025)

- **Local files as first-class catalog PLAYBACK sources (F2C.4 deferral #1 — spec F/G/H).** The catalog
  player is typed on `TelegramPlayableMedia` and Continue-Watching stores a `CatalogSourceToken`
  (Telegram locator). Full catalog progress/resume/CW-direct-reopen/auto-next parity for a bound local
  file, and source priority ahead of Telegram, need a provider-neutral playback-source identity —
  WITHOUT coercing a SAF URI into a Telegram token (spec A). Options in ADR 0025: (a) provider-neutral
  source identity across Telegram + local (full F/G/H, largest, highest regression risk to F2C.2/F2C.3
  session-token/exactly-once auto-next), (b) identity-keyed progress only (no direct CW re-open of the
  exact local file), (c) source-panel variants that play via the standalone SAF player (no continuity).
  The structured LOOKUP + binding provenance (item 4) ARE delivered.
- **Home-row per-card Israel badge enrichment** (the details IL block IS delivered; the card has the
  badge slot, but the bounded home-flow query that populates `israelAvailableKeys` for every visible
  card is deferred).
- **OMDb credential provisioning UI + end-to-end rating population** (provider integrated + tested;
  inert until a key is provisioned) and **Wikidata franchise DATA population** (provider + dedup
  delivered; the details fetch + TMDB card enrichment that fills the `אותו יקום` row is deferred, so
  that row is currently omitted). Researched-but-deferred rating sources documented in TMDB_INTEGRATION.
- **Physical code-25 acceptance is PENDING** on the owner's phone (incremental) — `docs/MOBILE_ACCEPTANCE.md`
  F2C.5 gate lists the physically-checkable items (startup, equal card dimensions, actions below poster,
  title/year bidi, non-blank posters, collection/similar/recommendation rows, no fake TMDB 0.0, details
  Israel availability). TV code 28 is compile/CI regression evidence only; no TV delivery, no Shield.

## Continuation instructions

Next agent: obtain the owner's physical code-25 acceptance (MOBILE_ACCEPTANCE F2C.5 gate). To complete
F2C.5's headline feature, resolve the local-source playback-identity architecture (ADR 0025 options)
and thread a bound local file through `resolveForPlayback` / the last-played-source pointer / the F2C.2
auto-next selection (`resolveFastContinuation`/`resolveRecurringContinuation`) WITHOUT weakening the
exactly-once/session-token invariants — the structured lookup (`LocalCatalogMatcher`/`findCatalogCandidates`)
and typed binding (Local Library DB v2 `boundConfidence`) are already in place to feed it. Then wire the
deferred data paths: home-row IL badge (bounded `currentlyAvailableInTerritory` over visible card keys),
OMDb credential slot + `state.titleRatings` population on detail load, and Wikidata franchise fetch +
TMDB enrichment into `state.franchiseRelations`. Reminders (repo memory): mobile ViewModels reached by
`viewModel()` need an exact `(Application)` constructor; app-mobile Robolectric DB tests use
`BundledSQLiteDriver` + `@SQLiteMode(LEGACY)`/`@ConscryptMode(OFF)`/`@GraphicsMode(LEGACY)`; write bidi
isolates as `Char(0x20xx)` (raw U+2066/U+2069 fails `BidiSpoofing` lint); Room migrations override BOTH
`migrate` overloads and commit the exported `N.json`; version bumps touch ~14 pin sites plus the mobile
rotation allow-list; a new schema version needs a first-build re-run so the merged test assets pick up
the KSP-generated `N.json` before the migration test can validate it.
