# Private Media TV — F2C.5.1 Handoff (physical code-25 defect fixes: card geometry/no-clip, real LTR title alignment, poster fallback, split provider dimensions)

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | funzi7/private-media-tv |
| Milestone | F2C.5.1 — presentation-only fixes for the five owner-reported physical code-25 defects (A/B/C card geometry, B English titles still RTL-aligned, C blank posters, D conflated provider dimensions, E raw provider-logo layout) |
| Branch / tracking branch | main / origin/main |
| Starting application HEAD | 0f2b2d08cf27aafcc9acf927ddf4315d9d284adc (F2C.5) |
| Final application HEAD | 7d4d5571d03b0ea23f9d8534e6d4de80cac00fef |
| Exact-head Android CI | 32175236690 — success (Android CI, exact head 7d4d557) |
| Mobile identity | com.funzi7.privatemediatv.mobile, 0.4.7-phone-test, versionCode 26 (updates code 25 in place) |
| TV regression identity | com.funzi7.privatemediatv, 0.6.6-f2c51, versionCode 29 (regression build only; shared metadata/presentation changed; NOT delivered) |
| Development signer SHA-256 | 2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0 |

One cohesive F2C.5.1 commit on main, pushed without force; final application HEAD matches origin/main.
The exact-head Android CI passed and uploaded the signed mobile and TV artifacts. Only the mobile
artifact was downloaded and published. No TV export/delivery, no Shield, no adb device attached. No
Room/DB schema change; no native TDLib rebuild (verify-only). The code-23/24 startup-crash path was not
touched.

## What F2C.5.1 delivered (final HEAD 7d4d557)

Owner physically tested code 25 and ACCEPTED startup (no code-23/24 crash recurrence), the below-poster
action strip, the relationship/recommendation rows, and the current-Israel details section, but reported
five presentation defects. All are in the single mobile file
`app-mobile/src/main/kotlin/com/funzi7/privatemediatv/mobile/F2bCatalogScreens.kt` (+ two new tests).
Decision record: ADR 0025 addendum. Narrative in CHANGELOG/README/TODO and the F2C.5.1 sections of
PROJECT_STATE / RELEASE_REVIEW / HANDOFF / TEST_PLAN / MOBILE_ACCEPTANCE / UX_DECISIONS / TMDB_INTEGRATION.

1. **Card geometry — no clipped fragments, truly equal heights (A/B/C).** The card text body is now a
   deterministic block: an explicitly line-heighted two-line title (`minLines=2`, so a short title still
   reserves two lines and the year/rating rows align across every card), a one-line year row, and a
   one-line rating row, at a FONT-SCALE-AWARE fixed height (`f2bCardTextBodyHeight()` derives from the sp
   line heights) that fits the worst case with no overflow — a long title + year + rating can no longer
   be clipped. The `רוצה לראות`/`מועדפים` rows and the in-line search/library cards were a divergent
   clone (`F2bLibraryRecordCard`/`F2bSearchCard`: content-sized height + raw image that showed a blank
   box on a missing poster); they now reuse the SAME card contract (`F2bCardArtwork` + the
   content-directional title body), so those rows keep equal heights and never show a blank poster.
2. **Real LTR/RTL title alignment (B).** F2C.5's first-strong isolate fixed glyph ORDER but not visual
   ALIGNMENT. New policy `f2bContentDirection` (true first-strong scan over `java.lang.Character`,
   default RTL when no strong char) drives BOTH `LocalLayoutDirection` and `TextAlign.Start`, so a Latin
   title (`Hockey Psychology`, `Amongst Men`) lays out LTR and left-aligns and a Hebrew title lays out
   RTL and right-aligns — inside the unchanged RTL app. `F2bDetailsTitle` composes title + parenthesized
   LTR-isolated year (`bidiCardYearLabel` / `bidiSafeTitleYearRange`) as one directional run; the Hebrew
   controls below stay RTL. Isolate control chars remain runtime-built (`Char(0x20xx)`), so no raw bidi
   character trips the `BidiSpoofing` lint.
3. **Poster fallback reliability — never a blank card (C).** Traced the remaining blank posters to card
   clones that rendered a raw image with no placeholder. `F2bCardArtwork` is now a render-time tri-state
   (loading → loaded → missing) that advances through the ENTIRE candidate chain (a dead primary URL
   never suppresses a live alternate), shows a neutral loading surface while trying, and settles on the
   title-aware placeholder only when exhausted — loading and missing are visually distinct.
   `F2bRemoteImage` gains a `settled`+`placeholder` path (default null keeps `F2bHeroImage`'s
   onFailure candidate-advance behaviour unchanged); the 16:9 Continue-Watching / next-episode / episode
   rows now carry a title-aware placeholder too.
4. **Two separate provider dimensions + real logo chips (D/E).** Current-Israel availability
   (`F2bIsraelAvailabilityDetails`, `state.israelAvailability`) and the original/international dimension
   (`F2bProviderDetails`: a series' `originalNetworks` as `רשת / פלטפורמה מקורית` + the international/US
   baseline `state.watchAvailability` as `זמין לצפייה בארה״ב`) are now BOTH distinct, prominent details
   sections — the original/international section was restored out of the buried `פרטים נוספים`
   disclosure. The two datasets are never merged; unknown original network omits its section while
   Israel availability may still display. Providers render as compact wrapping logo chips (`FlowRow`):
   the actual TMDB watch-provider/network logo, a stable monogram when the logo is absent or fails
   (never a giant empty box), plus a concise monetization sub-label. Deterministic product order
   (`f2bOrderedWatchProviders`: subscription → free/ads → rent → buy, then TMDB display priority, then
   name), explicitly not a "best provider" claim; Apple TV+ (FLATRATE→subscription) and Apple TV Store
   (RENT/BUY→rent) stay distinct; many providers bound to an initial 6 with a `הצג עוד` reveal (nothing
   discarded); JustWatch attribution stays secondary. The pinned F2C.5 provider labels + the
   `F2B_PROVIDER_LOGO_TEST_TAG` = one node per logo-bearing entry contract are preserved.

Version bump across all pin sites (build.gradle ×2, MobileModels, MobileManifestContractTest,
android-ci.yml TV asserts + TV/mobile printf, mobile verify/export/download/delivery/rejection/upgrade
scripts); the rotation allow-list gained `0.4.6-phone-test:25` (the outgoing code 25 demoted to
previous); the code-23 physically-broken blocklist is unchanged. The intentionally-lagging TV delivery
scripts (pinned to TV 0.6.3-f2c3) were left untouched (no TV delivery this milestone).

## Validation evidence

- Broad: `./gradlew test lint :app-mobile:assembleDebug :app-tv:assembleDebug` BUILD SUCCESSFUL —
  1,453 unit tests / 0 failures across 11 modules (app-mobile 398, +8 new), lint clean (incl.
  `BidiSpoofing`), both mobile and TV debug APKs assembled; `git diff --check` clean.
- New focused tests green: `F2c51PresentationTest` (pure JVM — first-strong content direction for
  Latin/Hebrew/mixed/punctuation-only; monetization ordering; Apple TV+/Store distinct categories/
  labels; ordering discards nothing) and `F2c51PresentationComposeTest` (Robolectric — three uniform
  cards keep an identical total height across varied title length/rating; artwork-less card shows the
  title-aware placeholder, never blank; `F2bProviderDetails` keeps two dimensions, bounds 8 providers to
  6 with `הצג עוד (2)`, distinct Apple identities). The pre-existing
  `F2bCatalogPagingAndProviderComposeTest` (provider separation + US availability + JustWatch + one logo
  tag) and the watch-availability refresh test still pass against the redesigned chips.
- Script harnesses: mobile delivery 15, mobile CI rejections 20+1, upgrade verifier 13, credential scan
  41, `bash -n` on the edited scripts — all passed.
- TDLib verify-only (NO rebuild): `bootstrap-tdlib-android.sh --verify-only` + `verify-tdlib-artifact.sh`
  — packaged JNI unchanged (Java JAR SHA e39bb497…, libtdjni.so SHA 21d59ebf… for the source artifact).
- Built mobile debug APK verified locally: com.funzi7.privatemediatv.mobile, 0.4.7-phone-test (26),
  arm64-v8a only, one `lib/arm64-v8a/libtdjni.so`, Development signer.
- Two independent adversarial reviews (UI Compose correctness; regression/scope/version-pin
  consistency) returned no HIGH/MEDIUM defects; the one substantive LOW (a fixed-dp reserve vs sp text
  at elevated accessibility font scale) was addressed by making the text-body reserve font-scale aware.
- CI: exact-head `Android CI` run 32175236690 for 7d4d557 completed success (TDLib verify, tests, lint,
  signed TV+mobile assemblies, both artifacts uploaded).

## Delivery evidence (mobile only)

Published via `./scripts/download-latest-ci-mobile-apk-to-phone.sh` from CI run 32175236690, artifact
`private-media-tv-mobile-apk-7d4d5571d03b0ea23f9d8534e6d4de80cac00fef`:

- Latest: `/storage/emulated/0/Download/PrivateMediaTV/Mobile/private-media-tv-mobile-latest.apk` —
  0.4.7-phone-test (26), APK SHA-256
  678352cb8cecdf80d8cddf77bedb32e1f805067a2ef24d2c6911e5447a969bdc, 59,133,491 bytes, modified
  2026-08-18 19:30:55 UTC, ARM64-only, one `lib/arm64-v8a/libtdjni.so` (packaged JNI SHA
  790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f), Development signer verified.
- Rotation result: `rotated` — the code-25 `latest` was demoted to `previous`; new code 26 is `latest`.
  `previous` = 0.4.6-phone-test (25), APK SHA-256
  1209916697d5d650c8af984d47646e7f1f81200e936386a09984d3b3a9369d57, 59,117,111 bytes. The prior code 24
  was superseded out of the two-slot layout; broken code 23 is absent. Only the two canonical Mobile
  files exist; the TV `PrivateMediaTV/*.apk` files are untouched. Canonical rollback state: latest =
  code 26, previous = code 25, broken code 23 excluded.

## Not done / pending

- **Physical code-26 acceptance is PENDING** on the owner's phone (`docs/MOBILE_ACCEPTANCE.md` F2C.5.1
  gate: startup over code 25; equal card heights + no chopped titles in `רוצה לראות`/`פופולרי`/`חדש`;
  English LTR + Hebrew RTL titles; non-blank posters; both current-Israel and original/international
  provider sections; compact logo chips; many-provider reveal; Apple distinction; existing
  collection/similar/recommendation rows).
- **Scanning / Local Library scan behaviour remains physically PENDING** — it was NOT owner-tested and
  must NOT be inferred as passed from any unrelated testing.
- All F2C.5 deferrals remain deferred (unchanged): local-file first-class catalog PLAYBACK bridge
  (F2C.4 deferral #1, ADR 0025 options), home-row per-card Israel badge population, OMDb credential
  provisioning + rating population, Wikidata franchise DATA population (the `אותו יקום` row stays
  omitted until populated). TV code 29 is compile/CI regression evidence only; no TV delivery, no Shield.

## Continuation instructions

Next agent: obtain the owner's physical code-26 acceptance (MOBILE_ACCEPTANCE F2C.5.1 gate) and,
separately, an explicit owner physical test of scanning (still pending). To advance F2C.5's headline
feature, resolve the local-source playback-identity architecture (ADR 0025 options) — the structured
lookup (`LocalCatalogMatcher`/`findCatalogCandidates`) and typed binding (Local Library DB v2
`boundConfidence`) are in place to feed it. Then wire the deferred data paths: home-row IL badge
(bounded `currentlyAvailableInTerritory` over visible card keys), OMDb credential slot +
`state.titleRatings` population, and Wikidata franchise fetch + `state.franchiseRelations`. Repo memory
reminders: mobile ViewModels reached by `viewModel()` need an exact `(Application)` constructor;
app-mobile Robolectric tests use `BundledSQLiteDriver` + `@ConscryptMode(OFF)`/`@GraphicsMode(LEGACY)`;
write bidi isolates as `Char(0x20xx)` constants or backslash-u2066/u2069 escapes (raw
U+2066/2068/2069 bytes fail `BidiSpoofing` lint); Robolectric text measurement is width-unreliable, so a card equal-height test uses
`minLines` + a horizontally-scrollable row (each card keeps its full intrinsic width) rather than
natural wrapping; version bumps touch ~14 pin sites plus the mobile rotation allow-list; the TV delivery
scripts intentionally lag and are out of scope when there is no TV delivery.
