# Private Media TV — F2C.5.2 Handoff (physical code-26 defect fixes + durable Israel-availability badge)

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | funzi7/private-media-tv |
| Milestone | F2C.5.2 — the eight owner-reported physical code-26 defects/requests: content-direction for descriptive prose (A/B/C), atomic Hebrew vote-count (D/E), a dedicated Episode Details page with one-shot background source discovery (F–K), a designed poster/hero placeholder (L–N), real provider logos via SVG rasterization (E/S/T), included-access-only availability + provider-family dedup (U–AA), a stable direction-aware title/year slot (O–R), and a DURABLE catalog Israel badge that completes the F2C.5-deferred Home/card IL population (I, AB–AI) |
| Branch / tracking branch | main / origin/main |
| Starting application HEAD | 7d4d5571d03b0ea23f9d8534e6d4de80cac00fef (F2C.5.1) |
| Final application HEAD | f4e5d65003cc36ccf145c9ce752f6ba1bea85026 |
| Exact-head Android CI | 32200290205 — success (Android CI, exact head f4e5d65) |
| Mobile identity | com.funzi7.privatemediatv.mobile, 0.4.8-phone-test, versionCode 27 (updates code 26 in place) |
| TV regression identity | com.funzi7.privatemediatv, 0.6.7-f2c52, versionCode 30 (regression build only; shared metadata/presentation changed; NOT delivered) |
| Development signer SHA-256 | 2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0 |
| Published mobile APK SHA-256 (CI artifact, f4e5d65) | a2450b1479277e1c4328a4d0b187756332ec4d347edaa4f379415d73f97a1866 |
| Published mobile TDLib JNI SHA-256 (CI build) | 790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f |

Two commits on main, pushed without force; final application HEAD matches origin/main. The first
milestone commit (99ce0b2) FAILED exact-head CI on the one stale CI version pin the plumbing inventory
missed — the "Verify TV and mobile package, version, signer, and TDLib payload" step asserts the built
app-tv APK's manifest version against inline literals that were still `0.6.6-f2c51`/`29`. The scoped,
non-destructive follow-up commit f4e5d65 bumped those to `0.6.7-f2c52`/`30`; its exact-head CI passed
and uploaded the signed mobile and TV artifacts. Only the mobile artifact was downloaded and published.
No TV export/delivery, no Shield, no adb device attached. **No Room/DB schema change** (Catalog/FTS 11,
UserState v5, territory availability v2, Local Library v2); no native TDLib rebuild (verify-only). One
new runtime dependency: AndroidSVG `1.4` (Apache-2.0, no transitive deps), on the logo decode path only.

## What F2C.5.2 delivered (final HEAD f4e5d65)

1. **Content-direction for descriptive PROSE (A/B/C).** A single `F2bDirectionalProse` wrapper applies
   the F2C.5.1 first-strong content-direction policy (`f2bContentDirection` + `LocalLayoutDirection` +
   `TextAlign.Start`) to overview/synopsis/card-description Text sites (movie/series overview and the
   secondary "more details" overview, season overview, episode synopsis, search/episode card
   descriptions), so an English overview reads LTR with its trailing period on the correct side and a
   Hebrew overview reads RTL; Hebrew UI controls (`עוד`/`פחות`, buttons, labels) stay RTL.
2. **Atomic Hebrew vote-count (D/E).** `hebrewVotePhrase` (grammar-correct singular `הצבעה אחת`) +
   `atomicHebrewVoteChip` (first-strong isolate) emit `N הצבעות` as ONE indivisible unit so the number
   and noun never split in the RTL paragraph; `tmdbVoteLabel`/`titleRatingLabel` rebuilt from atomic
   pieces. The no-`TMDB 0.0` guard (`hasMeaningfulTmdbRating`) is preserved; a missing/zero count omits
   the vote unit.
3. **Episode Details flow (F–K).** An episode tap now calls `openEpisode` (the existing `EPISODE_DETAILS`
   route) instead of an inline search that dominated the interaction. The page renders episode metadata
   immediately (still w/ fallback, S/E, content-directional title + synopsis, air date, runtime, TMDB
   vote, watched toggle, playback progress) and a new `F2bCatalogViewModel.autoDiscoverEpisodeSources`
   starts ONE identity-scoped background source session (reusing the F2C.1 retained-session + the F2C
   generation/identity/route guards) rendered in a `מקורות` inline panel below. Recomposition /
   watched-toggle / metadata refresh never restart it; a retained session for the same episode is
   reused with zero Telegram work; a search failure surfaces only inside the panel; Back keeps the F2C.3
   exact-back contract.
4. **Designed placeholder (L–N).** `F2bDesignedArtworkPlaceholder` (in-palette gradient + Movie/TV glyph
   `ic_media_movie`/`ic_media_tv` + content-directional title + media-type hint) replaces the flat
   title-only card fallback and, at 16:9, the giant "Private Media TV" hero box. Local only, no
   generated art. `MediaIdentity` is threaded into the artwork call sites to pick the glyph.
5. **Real provider logos (E/S/T).** Root cause traced: TMDB frequently serves network/provider
   `logo_path` as SVG, which the raster-only `BitmapFactory` path returned null for → monogram.
   `BoundedMetadataImageLoader` now content-sniffs SVG (`looksLikeSvg`) and rasterizes it (AndroidSVG)
   at a bounded size, and follows TMDB redirects (`instanceFollowRedirects = true`). The data path
   (parse → codec wrappers persist `logoPath`/`logoSizes` → URL/size → cache key → chip) was verified
   correct and unchanged; the monogram is now only a genuine fallback.
6. **Included-access-only availability + family dedup (U–AA).** New shared core-metadata policy
   `WatchProviderPresentation.kt`: `offersIncludedAccess`/`hasIncludedAccessProvider` (FLATRATE/FREE/ADS)
   and `WatchProviderFamilies.includedAccess` (filters rent/buy out of the primary sections — a
   rent/buy-only title omits the section — and collapses provider families to one canonical brand chip,
   keyed on `StreamingProviderKey` with a conservative normalized-name bridge; Apple TV+ vs the Apple TV
   store never merge). Applied in `F2bProviderDetails` + `F2bIsraelAvailabilityDetails`; provider chip
   names lay out LTR. The three dimensions (IL / original network / US) stay distinct. The raw
   `WatchAvailability` model is unchanged (keeps every monetization type) — this is a render-time
   projection.
7. **Stable title/year slot (O–R).** `F2bDetailsTitle` is now a direction-scoped `Row` with a weighted
   title area and a dedicated trailing year slot, so the year is anchored at the same trailing edge
   regardless of title length; a long title ellipsizes to two lines instead of pushing the year.
8. **Durable catalog Israel badge (I, AB–AI).** The card 🇮🇱 badge no longer depends on the transient
   Details-only `israelAvailableKeys` mutation (the reset that cleared it on Details-open is removed; the
   Details write now UNIONs). `F2bCatalogViewModel.refreshIsraelBadges` reconstructs the projection on
   Home load: Phase 1 reads the durable `TerritoryAvailabilityStore` (`israelCurrentlyAvailable`) for
   immediate known positives, then Phase 2 runs ONE bounded (≤4 concurrency, identity-deduped, capped
   at 24/pass) INCLUDED-access enrichment (`enrichIsraelIncludedAccess`) derived from the durable TMDB
   watch-provider metadata cache — zero Telegram — and only UNIONs positives (a cached positive never
   flickers away), guarded by a generation. The badge means "available in IL via ≥1 subscription/free/ads
   provider"; unknown → no flag; a rent/buy-only listing never flags. `territory-availability.db` stays
   v2 (the store is read-only for the badge; per-title evidence lives in the durable metadata cache — no
   arrival-row contamination).

## Modules and files

- `core-metadata`: new `WatchProviderPresentation.kt` (included-access + family dedup policy); edited
  `MetadataImageLoader.kt` (SVG rasterization + redirect follow); `build.gradle.kts` + `gradle/libs.versions.toml`
  (AndroidSVG 1.4). New tests `WatchProviderPresentationTest`, `MetadataImageSvgDetectionTest`.
- `app-mobile`: `F2bCatalogScreens.kt` (prose direction, atomic vote label, title/year Row, designed
  placeholder + `MediaKind`, provider filter/dedup + LTR chip names, Episode Details page auto-discovery
  + `מקורות` panel, `F2bIsraelBadge` render unchanged); `F2bCatalogViewModel.kt`
  (`autoDiscoverEpisodeSources`, `refreshIsraelBadges`, union `israelAvailableKeys`, included-access
  badge rule, drop Details reset); `F2bCatalogDataSource.kt` (`israelCurrentlyAvailable`,
  `enrichIsraelIncludedAccess`); `MobileModels.kt`, `build.gradle.kts` (version 27); new drawables
  `ic_media_movie.xml`/`ic_media_tv.xml`. New test `F2c52PresentationTest`; additions to
  `F2c2IsraelAvailabilityDataSourceTest` and `F2bCatalogViewModelTest`; updated pins in
  `F2c2DetailsPresentationTest`, `F2c5PresentationTest`, `F2c51PresentationComposeTest`,
  `F2bCatalogPagingAndProviderComposeTest`, `MobileCatalogUiContractTest`, `MobileManifestContractTest`.
- `app-tv`: `build.gradle.kts` (version 30, regression only).
- CI/scripts/docs: `.github/workflows/android-ci.yml` (mobile+TV metadata printf + the TV verify-step
  version assertion), version pins across `scripts/verify-mobile-apk.sh`, `export-`/`download-latest-ci-mobile-apk-to-phone.sh`,
  `test-mobile-apk-phone-delivery.sh`, `test-download-latest-ci-mobile-apk-rejections.sh`,
  `test-verify-upgrade-apks.sh`, rotation allow-list `scripts/lib/mobile-apk-delivery.sh` (+`0.4.7-phone-test:26`);
  CHANGELOG/README/TODO/PRODUCT_SPEC/PROJECT_STATE/HANDOFF/RELEASE_REVIEW/TEST_PLAN/MOBILE_ACCEPTANCE/
  UX_DECISIONS/TMDB_INTEGRATION + ADR 0025 F2C.5.2 addendum.

## Validation (commands actually run, all local unless noted)

- `./gradlew test` = **1,468 tests / 0 failures**; `lint`; `:app-mobile:assembleDebug`;
  `:app-tv:assembleDebug` — all green.
- Harnesses: APK credential scanner (41 cases), mobile phone-delivery (15 cases), CI mobile downloader
  rejections (20 + 1), upgrade verifier (13 cases) — all pass. Shell `bash -n` on all scripts clean.
- Built mobile APK verified: pkg `com.funzi7.privatemediatv.mobile`, `0.4.8-phone-test`/27, arm64-v8a
  only, TDLib JNI present, dev signer `2987a463…`. `git diff --check` clean.
- TDLib verify-only: `bootstrap-tdlib-android.sh --verify-only` + `verify-tdlib-artifact.sh` pass
  (pinned commit 022d602…); no native rebuild.
- Exact-head Android CI 32200290205 (f4e5d65) — success. CI mobile downloader published the exact-head
  code-27 artifact; rotation = rotated.

## Phone delivery

- `Download/PrivateMediaTV/Mobile/private-media-tv-mobile-latest.apk` = `0.4.8-phone-test`/27 (f4e5d65,
  SHA-256 a2450b14…). `…-mobile-previous.apk` = `0.4.7-phone-test`/26. Broken code-23 excluded (not
  present; still on the physically-broken blocklist). The TV `Download/PrivateMediaTV` files were NOT
  touched (no mobile rotation of TV artifacts). No adb device attached; installation/launch is the
  owner's manual step and is NOT claimed.

## Omitted / pending / limitations / risks

- **Physical code-27 owner acceptance PENDING** (install over code 26, no uninstall / no Clear Data;
  the code27 acceptance checklist is in `docs/MOBILE_ACCEPTANCE.md`). **Local Library scanning remains
  physically PENDING** — not owner-tested and NOT inferred to pass.
- Still deferred from F2C.5 (unchanged): local files as first-class catalog PLAYBACK sources; OMDb
  credential provisioning + rating population; Wikidata franchise DATA population.
- Provider-family dedup renames a keyed provider to its canonical brand (e.g. Amazon variants →
  "Prime Video"); the normalized-name bridge is conservative and never merges distinct keyed services,
  but a genuinely new unkeyed brand that normalizes to a known family name would map to it — extend
  `NAME_FAMILY_TO_KEY`/`PROVIDERS` if a real provider needs a new stable identity.
- The IL badge Phase-2 enrichment issues bounded (≤4, ≤24/pass) TMDB `/watch/providers` requests for
  unknown visible cards; the durable store (populated by the Home Discover IL snapshot) resolves most
  cards in Phase 1, so enrichment is a gap-filler. Passive catalog stays zero-Telegram.

## Exact next milestone / continuation

- Await the owner's physical code-27 acceptance against `docs/MOBILE_ACCEPTANCE.md` (the 14-point
  checklist). If a defect is reported, treat it as the next F2C.5.x presentation increment.
- The next substantive product decision remains the deferred **local-file first-class catalog playback
  bridge** (ADR 0025 "Deferred"), which needs a provider-neutral playback-source identity threaded
  through `resolveForPlayback` + Continue-Watching + auto-next — a material playback-pipeline change,
  not presentation.
- Preserve all constraints: no schema change without stopping to report; TDLib verify-only (no
  speculative rebuild); mobile-only delivery (never rotate TV files); `funzi7` only; never
  reset/clean/restore/stash/force-push.
