# Private Media TV — F2C.1 Handoff

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | funzi7/private-media-tv |
| Milestone | F2C.1 — Continuation targets, series positioning, provider row split, movie completion, inline source reliability/result quality |
| Branch / tracking branch | main / origin/main |
| Starting application HEAD | 8c72e65eb47779ab22c42654882fcc394e8c3dfa |
| Final application HEAD | d335da59602301f9fc4596f00ee40ab704a7a0b5 |
| Starting agent-memory HEAD | 13c38930b34744a82b4760d5bc13c6932153df8c (manager-verified); unrelated projects advanced it to 568124b0aab34c267efc2e2f0148e33a2727a5fc before this handoff, all preserved |
| Exact-head Android CI | 31951643758 — success |
| Mobile identity | com.funzi7.privatemediatv.mobile, 0.4.1-phone-test, versionCode 20 (updates code 19 in place) |
| TV regression identity | com.funzi7.privatemediatv, 0.6.1-f2c1, versionCode 24 (regression build only, not delivered) |
| Development signer SHA-256 | 2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0 |

One cohesive F2C.1 commit on main, pushed without force; the final application HEAD matches
origin/main. Exact-head Android CI passed and uploaded both signed artifacts; only the mobile
artifact was downloaded and published. No TV export/delivery, no Shield, no adb device
attached.

## What F2C.1 implemented (application HEAD d335da59)

Full decision record: `docs/adr/0021-f2c1-continuation-targets-and-source-relevance.md`;
narrative: CHANGELOG F2C.1 entry, PROJECT_STATE F2C.1 sections, PRODUCT_SPEC + UX_DECISIONS
F2C.1 sections (superseding the F2C movie-never-auto-completes catalog rule and the old POSSIBLE
Play label), DATA_MODEL (UserState v4), TEST_PLAN F2C.1 matrix, MOBILE_ACCEPTANCE code-20 gates
A–M plus the recorded synthetic code-19 physical evidence.

1. **Series entry positioning (core defect fix).** Entry into a standard episodic series resolves
   the viewing target (in-progress episode → next after latest completed, crossing to the next
   real season's first episode when needed → stored continuation target → first regular aired),
   selects that season, and anchors the target episode visibly via a one-shot
   `seriesEntryAnchorKey` consumed by an `onGloballyPositioned` scroll. Derivation is one bounded
   per-series key-prefix query (`seriesEpisodeProgress`, LIMIT 500 — no N+1). Owner-initiated
   season switches are tracked per visit and never fought by refreshes. Zero Telegram work.
2. **Next-episode Continue Watching targets (UserState v3→v4).** New strictly additive
   `series_continuation_targets` table (PK profile+series; kinds AIRED_EPISODE / FUTURE_EPISODE /
   PLACEHOLDER_EPISODE / PLACEHOLDER_SERIES; structural invariants forbid fabricated
   title/date/still facts on placeholders and any coordinates on the series-level kind) behind
   `SeriesContinuationTargetStore` (bounded newest-first observe, in-place upsert = one logical
   target per series, keyed remove, malformed-row containment; never journaled; no source
   pointer). Projection runs on real episode completion and re-projects on series-page metadata
   load; `SeriesFinalePolicy` suppresses targets for proven finales; safe contiguous `E+1`
   placeholders exist only inside the latest known regular season. The Home row merges resumes
   with target cards (target hidden while its series has an active resume; explicit removal of
   either clears both); an aired target's tap reuses the pendingContinueFallback machinery to
   open the series positioned at the episode with its ONE bounded inline session; future/
   unannounced targets open the series page only. Hebrew states: `טרם שודר`,
   `פרק N · טרם פורסם`, `הפרק הבא · טרם הוכרז`. Standard episodic only; recurring-edition
   policies untouched.
3. **Movie completion (owner decision).** `catalogCompletionReached` now includes movies
   (end-of-media / ≤30 s reliable / 90% fallback); the store still forces membership off on
   completion, so finished movies leave the row automatically while resume/bindings/downloads
   stay. `UserPlaybackProgressStore.update` gained a movie-only `allowCompletionRestart` flag: a
   NEW real session below the threshold re-enters the row; the flag drops after the session's
   completion write so backward seeks stay sticky; episodes can never clear completion. The
   watched register still never auto-marks movies.
4. **Known-source relevance (222-result flood fix).** `KnownSourcePossibleRelevancePolicy`
   (core-catalog) gates the engine's known-source PARSER_REJECT→POSSIBLE upgrade: STRONG
   (structured SxxEyy/NxMM or natural Hebrew עונה/פרק forms matching the target, title+episode,
   title+year) → PRIMARY tier; PLAUSIBLE (title/alias containment, or live-retrieval provenance —
   which the predicate-less history fallback can never claim) → ADDITIONAL tier; NONE → rejected
   as `knownSourceNoiseRejectCount`; CONTRADICTION (wrong season/episode/year, episode syntax on
   a movie) → rejected. `SourceVariantPresentation.relevanceTier` carries the tier. Pipeline
   order, budgets, pools, exact binding, owner-literal never-hide, and K1–K8 behavior unchanged.
5. **Bounded deterministic presentation.** `sortedSourceVariants` ranks BOUND → VALIDATED →
   PRIMARY-POSSIBLE → ADDITIONAL before the established cache/quality/label tie-breakers;
   `presentSourceResults` token-dedups and materializes ≤8 primary cards
   (`F2B_SOURCE_PRIMARY_RESULTS_MAX`, aligned with the AUTO-8 pool) plus explicitly revealed
   ADDITIONAL batches of 12 (`F2B_SOURCE_ADDITIONAL_REVEAL_BATCH`, aligned with the 12-source
   explicit/Deep bound) behind `הצג התאמות נוספות (N)`. Normal counts are filtered
   (`N התאמות` / `M התאמות נוספות`); raw/mapped/candidate/noise totals stay in `פרטי אבחון`.
   Both the inline panel and the historical SOURCES screen share the bounded presentation.
6. **No-silent-Play (physical no-op fix).** Per-card `F2bSourcePlaybackAction`
   (Idle/Resolving/Failed) in UI state: every enabled Play/confirm tap immediately shows
   `מכין ניגון…`/`משייך ומכין ניגון…` on the tapped card and every failure (resolution classes,
   binding failure, stale tap, missing confirmation text) lands visibly on that card plus the
   page notice. Owner-confirmable POSSIBLE Play = `bindSource(playAfterBinding = true)`
   (confirm+bind+play); `זה הפרק`/`זה הסרט` stay bind-only; non-confirmable POSSIBLE renders no
   standard Play; the `נגן לבדיקה` label is removed. Rejection rules unweakened.
7. **Panel collapse/reuse.** `סגור מקורות` renders at the panel TOP with a compact header
   (item · state · filtered count). Collapse retains the session (merging progressive results via
   the cancellation-merge path) into a bounded page-scoped LRU (6); same-item reopen restores
   with zero automatic re-search; explicit refresh replaces; episode switches supersede under the
   existing generation guard; Back still collapses first.
8. **Provider row split.** `CatalogHomeRowRegistry` emits per-provider TV rows
   (availability+original branches) and movie rows (availability-only) per sort — 28 provider
   rows, 46 passive rows; `CatalogHomeRow.mediaType` structurally bans mixed rows; providers
   without a media type in the verified registry get no fabricated row; Hebrew titles per type
   (`Netflix — סדרות פופולריות` …); empty categories are omitted at render (Q13). NOT_INTERESTED,
   TMDB-only passive Home, and attribution unchanged.
9. **Versions/delivery plumbing.** Mobile 19→20 and TV 23→24 across build.gradle.kts,
   MobileModels, MobileManifestContractTest, android-ci.yml exact-head assertions/metadata,
   verify/export/download scripts, both delivery harnesses, CI rejection fixtures, and
   upgrade-verifier fixtures; rotation allow-list adds `0.4.0-phone-test:19`; broken
   `0.3.9-phone-test:17` stays blocklisted from the rollback slot.

## Validation evidence

- Focused F2C.1 regressions first, then affected modules, then one broad pass:
  `SeriesContinuationStoreTest` (store CRUD/in-place upgrade/malformed containment, series
  prefix query, movie restart vs episode stickiness, real chained 1→2→3→4 migration incl. a
  seeded on-disk v3 code-19 DB with snapshot+pointer rows readable),
  `SourceCandidateRelevancePolicyTest` (14 evidence/contradiction cases),
  `SearchEngineV2IntegrationTest` F2C.1 additions (222-record fallback → 2 validated + 5
  ADDITIONAL possible with 200 noise/15 contradiction rejections; evidence-free fallback
  surfaces nothing; duplicate resource dedup; K1–K8 retained),
  `F2c1SeriesPositioningViewModelTest` (Q1–Q4 + zero-discovery),
  `F2c1ContinuationTargetViewModelTest` (Q6–Q11 + same-session stickiness),
  `F2c1SourcePanelViewModelTest` (confirm+play with visible resolving, visible bind failures,
  missing-confirmation-text corner, bind-only, collapse/reuse/supersede Q22–Q24),
  `F2c1SourcePresentationTest` (bounded tiers, deterministic shuffle ranking, dedup, CW row
  merge, truthful labels), `F2c1SourcePanelComposeTest` (no Play on non-confirmable POSSIBLE,
  bounded reveal UI, empty provider rail omitted). Intended-behavior updates:
  CatalogPolicyTest/F2bCatalogDataSourceTest provider split (46 rows, typed Netflix titles),
  F2cPlaybackFirstViewModelTest movie completion + progress-derived default season,
  F2bSourceManagementComposeTest confirm+play labels, MobileCatalogUiContractTest selectSeason
  signature, shared synthetic token now returns a real presentation key.
- Full local suite: `./gradlew test` — 1,313 tests, 0 failures/0 errors/0 skips across all
  modules; `./gradlew lint` clean; `:app-mobile:assembleDebug` and `:app-tv:assembleDebug`
  BUILD SUCCESSFUL; `git diff --check` clean. Local mobile debug APK verified:
  0.4.1-phone-test (20), ARM64-only, one `lib/arm64-v8a/libtdjni.so` (sha
  21d59ebfeba4edc62ea74cefaa79b08650e796530f3d5e57804105cc44cb65dc), Development signer.
- Script harnesses: credential scan 41, TV delivery 9, mobile delivery 14, mobile CI rejections
  20+1, TV CI rejections 8, upgrade verifier 13, pmtprov 4 — all passed; node
  lan-crypto/provisioning-html/pmtprov-interop self-tests passed; `bash -n` clean on all scripts.
- TDLib verify-only (NO rebuild): pinned commit 022d60202e446ad1287b9fb68e687c8a0760788b, ARM64
  AAR sha 025313d2a7cdbf148e5c700e8ef6c9d384f2301aff043c844997e0c23eb9abd2.
- CI: exact-head `Android CI` run 31951643758 for d335da59… completed success (wrapper
  validation, script self-tests, full tests, lint, both assemblies, version/signer/payload
  verification, artifact upload).

## Delivery evidence (mobile only)

Published via `./scripts/download-latest-ci-mobile-apk-to-phone.sh` from CI run 31951643758,
artifact `private-media-tv-mobile-apk-d335da59602301f9fc4596f00ee40ab704a7a0b5`:

- Latest: `/storage/emulated/0/Download/PrivateMediaTV/Mobile/private-media-tv-mobile-latest.apk`
  — 0.4.1-phone-test (20), APK SHA-256
  2a64adf2e0269c4356af7af49248de7b8b4cea185022ca7c1d13e1a2aff34c87, 58,783,400 bytes, modified
  2026-08-16 14:21:37 UTC, ARM64-only, one `lib/arm64-v8a/libtdjni.so` (packaged JNI sha
  790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f), Development signer verified.
- Rotation result: `rotated` — previous is now the known-good code 19 (0.4.0-phone-test),
  byte-identical to its original publication (SHA-256
  c7182d59437aa2b989916bcc9fc26073c4b18bd92dd16b5c1e73d95260e0e14c, 58,717,864 bytes). Broken
  code 17 is not present in any canonical slot and remains blocklisted from promotion.
- Only the two canonical Mobile files exist; TV files untouched.

## Not done / pending

- **Physical code-20 acceptance is PENDING** on the owner's phone — gates A–M in
  `docs/MOBILE_ACCEPTANCE.md`: in-place install over code 19 (no uninstall/clear-data), startup,
  series positioning at the viewing target, the previously flooding real episode now showing a
  small relevant set with weaker matches behind הצג התאמות נוספות, no wrong-episode noise, the
  previously silent ניגון מקור זה now playing or failing visibly, זה הפרק still bind-only with
  confirm+play on possible results, סגור מקורות collapse with retained-result reuse, direct
  active-resume unchanged, series remaining in Continue Watching as the next-episode target
  after completion, movie leaving the row on completion, provider rows split by type×sort,
  player fullscreen/rotate/resume/keep-screen-on good, index/runtime state intact.
- The earlier physical code-19 gates (F2C A–M) and F2B.5.2 code-18 acceptance remain open
  history; the physically observed code-19 defects driving this milestone are recorded in
  MOBILE_ACCEPTANCE with synthetic wording only.
- Continuation-target freshness is bounded by design (upgrades on series-page load or next
  completion; passive Home never fetches per-target metadata) — flagged in RELEASE_REVIEW.
- The final TV rendering of the playback-first flow (D-pad) remains open; TV code 24 is
  compile/regression evidence only.

## Continuation instructions

Next agent: obtain the owner's physical code-20 result first (gates A–M in
`docs/MOBILE_ACCEPTANCE.md`). If a gate fails, pull a real Android bug report before changing
anything; a transient Telegram failure must not be treated as a broken pointer or a broken
target (rows, pointers, and continuation targets are designed to survive it). If acceptance
passes, record it in `docs/MOBILE_ACCEPTANCE.md`/`docs/PROJECT_STATE.md`. Architecture decisions
live in ADR 0021 (persistence/engine/orchestration split); the milestone record is in
CHANGELOG / PROJECT_STATE / TEST_PLAN / RELEASE_REVIEW / HANDOFF at the application HEAD above.
Version-bump reminder: MobileManifestContractTest pins the TV versionName/versionCode literals;
the mobile delivery harness self-asserts the caller scripts' EXPECTED_VERSION pins; the rotation
allow-list needs the outgoing build added explicitly when bumping (this milestone added
`0.4.0-phone-test:19`). Robolectric user-state tests must chain MIGRATION_1_2/2_3/3_4 and use
BundledSQLiteDriver; the shared synthetic `sourceVariant` token stubs `keyForPrivatePresentation`
because the per-card playback-action state keys on it.
