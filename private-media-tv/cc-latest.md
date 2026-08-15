# Private Media TV — F2C Handoff

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | funzi7/private-media-tv |
| Milestone | F2C — Playback-first catalog UX, Continue Watching, inline series/episode sources |
| Branch / tracking branch | main / origin/main |
| Starting application HEAD | 3910fc8c6b1b354df795302eafde982404e83a28 |
| Final application HEAD | 8c72e65eb47779ab22c42654882fcc394e8c3dfa |
| Starting agent-memory HEAD | dd4b7f966e6c0a574b316398483144bf896f83cc |
| Exact-head Android CI | 31905811454 — success |
| Mobile identity | com.funzi7.privatemediatv.mobile, 0.4.0-phone-test, versionCode 19 (updates code 18 in place) |
| TV regression identity | com.funzi7.privatemediatv, 0.6.0-f2c, versionCode 23 (regression build only, not delivered) |
| Development signer SHA-256 | 2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0 |

One cohesive F2C commit on main, pushed without force; the final application HEAD matches
origin/main. Exact-head Android CI passed and uploaded both signed artifacts; only the mobile
artifact was downloaded and published. No TV export/delivery, no Shield, no adb device attached.

## What F2C implemented (application HEAD 8c72e65e)

Full decision record: `docs/adr/0020-f2c-playback-first-catalog-and-continue-watching.md`;
narrative: CHANGELOG F2C entry, PROJECT_STATE F2C sections, UX_DECISIONS F2C section (supersedes
the F2B "Sources route never bypassed" rule for the normal flow), DATA_MODEL (UserState v3),
TEST_PLAN F2C matrix, MOBILE_ACCEPTANCE code-19 gates A–M.

1. **Data (core-catalog).** `UserStateDatabase` v2→v3 via strictly additive `MIGRATION_2_3`:
   `user_playback_progress` gains nullable presentation-snapshot columns (title/parent title/
   season/episode numbers/poster/still/backdrop paths/date label) and the device/account-local
   last-played source pointer (`lastSourceKey` = the existing durable opaque CatalogSourceToken
   digest, `lastSourceAccountKey`, timestamp). New `UserPlaybackProgressStore` APIs: bounded
   `observeContinueWatching` (newest-first, corrupt rows skipped, LIMIT over the index that has
   existed since v2), one-query bulk `progressFor`, membership-only `removeFromContinueWatching`,
   account-validated `commitLastPlayedSource`/`lastPlayedSource`/`clearLastPlayedSource`. The
   pointer is never journaled through the mutation outbox and never readable under another opaque
   account. Catalog/search DB stays at schema 11; exported schema 3.json committed.
2. **Orchestration (app-mobile).** Player progress callbacks now persist catalog-identity progress
   at a bounded cadence (one durable write per 5 s, aligned with the resume store, plus an
   immediate completion write and a final session-end flush; real playback only — failed launches
   and diagnostic sessions write nothing; `EpisodeCompletionPolicy` thresholds; movies never
   auto-complete). The launched source's token is captured with the launch and committed as the
   durable last-played source only after observed playback, including through auto-next
   (`F2bPreparedContinuationSource`). Direct Continue Watching playback
   (`resolveLastPlayedForPlayback` → backend `resolveForPlayback(media, token)`) uses the existing
   pure-resolution path (Room locator → binding/index fallback → trusted complete-local → account
   re-check → one GetMessage-equivalent resolve): zero Search Engine V2 discovery, zero
   SearchChatMessages. Transient failures keep the row and pointer; definitive failures fall back
   to one bounded item-scoped inline session on explicit intent, and the pointer is replaced only
   after an alternative actually plays. Source sessions are decoupled from the SOURCES route via
   `sourceSessionRoute` (host-route guard) so the same generation-guarded engine orchestration
   serves the historical SOURCES screen and the new inline series/movie panels; `selectSeason`
   loads one season inline (default priority: Continue Watching episode's season → remembered
   in-process selection → first regular aired season; never Specials while ordinary seasons
   exist) with ONE bulk progress query per season. The backend exposes `activeAccountScope()`.
   The F2B.5.2.1 fail-soft startup invariant extends to the new Continue Watching observer.
3. **UI (mobile).** Home "המשך צפייה" is the first meaningful media row (local-first, hidden when
   empty; card tap = direct continue; long-press = explicit membership-only removal). Series page:
   compact hero, essential metadata, primary continue button, season chips, episode cards with
   still/number/title/date/runtime/overview/watched state and an always-visible progress bar,
   inline source panel beneath the tapped episode (episode tap = automatic item-scoped discovery;
   long-press = historical episode details), long metadata behind "פרטים נוספים"; back collapses
   the panel in place. Movie page is playback-first with the same inline panel. Verbose engine
   statistics stay behind "פרטי אבחון". Player "מסך מלא"/"סיבוב" text buttons replaced by 48 dp
   IconButtons (three hand-authored vector drawables, Hebrew contentDescriptions, no new
   dependencies); callbacks, rotation policy, keep-screen-on, warm session, and resume unchanged.
4. **Versions/delivery plumbing.** Mobile 18→19 and TV 22→23 across build.gradle.kts,
   MobileModels constants, MobileManifestContractTest, android-ci.yml exact-head assertions and
   metadata, verify/export/download scripts, both delivery harnesses, CI rejection fixtures,
   upgrade-verifier fixtures, and the rotation allow-list (`0.3.10-phone-test:18` added so the
   outgoing build demotes to previous). Broken `0.3.9-phone-test:17` stays blocklisted from the
   canonical previous slot.

## Validation evidence

- Focused F2C regressions first, then affected modules, then one broad pass:
  `ContinueWatchingStoreTest` (10 tests, core-catalog: collection order/exclusion, membership-only
  removal, snapshot+pointer retention across plain writes and reopen, account-scoped pointer
  isolation, journal-free pointer commits, malformed-row containment, bulk lookup, recurring
  rehydration, redaction, real chained 1→2→3 migration incl. a seeded on-disk v2 DB opened through
  Room with code-18-like rows readable through the v3 store). `F2cPlaybackFirstViewModelTest`
  (17 tests: zero-discovery direct continue, transient-keeps-pointer, definitive-failure fallback
  with commit-only-after-real-playback, no-commit-without-playback, 5 s write throttling with
  final flush, completion policy per media kind, default season incl. Continue Watching priority
  and never-Specials, one bulk lookup per season, one inline session per episode tap, supersede/
  cancel on episode switch, back collapse, inline POSSIBLE binding, movie zero-discovery + one
  session, local Continue Watching state, contained failing observer with reattach, auto-next
  source-context commit). `MobilePlayerOverlayComposeTest` (icons present with Hebrew semantics at
  ≥48 dp, text buttons absent), `MobilePlayerWindowContractTest` (icon drawables + semantics
  pinned in source), `MobileCatalogUiContractTest` F2C contract additions. Three legacy tests
  updated for intended behavior (default-season auto-load count, new "מחפש מקור…" loading label,
  TV version pins).
- Full local suite: `./gradlew test` — 1263 tests, 0 failures/0 errors across all modules;
  `./gradlew lint` clean; `:app-mobile:assembleDebug` and `:app-tv:assembleDebug` BUILD
  SUCCESSFUL; `git diff --check` clean. Local mobile debug APK identity verified
  (0.4.0-phone-test/19, ARM64-only, packaged JNI + Development signer as pinned).
- Script harnesses: credential scan 41, TV delivery 9, mobile delivery 14, mobile CI rejections
  20+1, TV CI rejections 8, upgrade verifier 13, pmtprov 4 — all passed; `bash -n` clean on all
  scripts.
- TDLib verify-only (NO rebuild): pinned commit 022d60202e446ad1287b9fb68e687c8a0760788b, ARM64
  AAR sha 025313d2a7cdbf148e5c700e8ef6c9d384f2301aff043c844997e0c23eb9abd2.
- CI: exact-head `Android CI` run 31905811454 for 8c72e65e… completed success (wrapper validation,
  script self-tests, full tests, lint, both assemblies, version/signer/payload verification,
  artifact upload).
- Debugging note: one intermediate local test run hung for ~35 CPU-minutes — a fail-soft-observer
  test with a permanently failing fake flow loops forever under `advanceUntilIdle` (the observer
  retries on a virtual-time delay). Fixed by making the fake failure one-shot; recorded here so the
  pattern is not reintroduced.

## Delivery evidence (mobile only)

Published via `./scripts/download-latest-ci-mobile-apk-to-phone.sh` from CI run 31905811454,
artifact `private-media-tv-mobile-apk-8c72e65eb47779ab22c42654882fcc394e8c3dfa`:

- Latest: `/storage/emulated/0/Download/PrivateMediaTV/Mobile/private-media-tv-mobile-latest.apk`
  — 0.4.0-phone-test (19), APK SHA-256
  c7182d59437aa2b989916bcc9fc26073c4b18bd92dd16b5c1e73d95260e0e14c, 58,717,864 bytes, modified
  2026-08-15 20:24:15 UTC, ARM64-only, one `lib/arm64-v8a/libtdjni.so` (packaged JNI sha
  790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f), Development signer verified.
- Rotation result: `rotated` — previous is now the known-good code 18 (0.3.10-phone-test),
  byte-identical to its original publication (SHA-256
  c6c57598f9e7d6604a5c2ce34ee6885e85695a874385cb8836d313048b921060, 58,633,880 bytes). Broken
  code 17 is not present in any canonical slot and remains blocklisted from promotion.
- Only the two canonical Mobile files exist; TV files untouched.

## Not done / pending

- **Physical code-19 acceptance is PENDING** on the owner's phone — gates A–M in
  `docs/MOBILE_ACCEPTANCE.md`: in-place install over code 18 (no uninstall/clear-data), startup,
  old code-18 resume preserved, Continue Watching entry from real playback, direct continue with
  no search UI, inline series flow with default season, per-episode progress, inline sources on a
  new episode, back behavior, movie playback-first, player icons, fullscreen/rotation/resume,
  keep-screen-on, index/runtime state intact. Automated tests are not physical evidence.
- Broader physical F2B.5.2 acceptance (recorded against code 18) also remains pending.
- The final TV rendering of the playback-first flow (D-pad) remains open; F2C shipped the shared
  business/data layer (core-catalog stores + provider-neutral view-model state) it will consume.
- Movies never auto-complete (per the established MovieCompletionPolicy), so a fully watched
  movie leaves Continue Watching only via manual watched or explicit removal — flagged in
  RELEASE_REVIEW as a residual product question for the owner.

## Continuation instructions

Next agent: obtain the owner's physical code-19 result first (gates A–M). If a gate fails, pull a
real Android bug report before changing anything; a transient Telegram failure must not be treated
as a broken pointer (the row and pointer are designed to survive it). If acceptance passes, record
it in `docs/MOBILE_ACCEPTANCE.md`/`docs/PROJECT_STATE.md`. Architecture decisions live in ADR
0020; the milestone record is in CHANGELOG / PROJECT_STATE / TEST_PLAN / RELEASE_REVIEW / HANDOFF
at the application HEAD above. Version-bump reminder: MobileManifestContractTest pins the TV
versionName/versionCode literals in addition to the previously known script/CI pin sites.
