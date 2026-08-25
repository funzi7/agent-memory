# Private Media TV — F2C.7.3 Final (mobile-test phase; published code 33; physical owner acceptance pending)

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | `funzi7/private-media-tv` |
| Milestone | F2C.7.3 — physical code-32 defect fixes: aired-episode convergence (§A/§C), Home pull-to-refresh + bounded foreground/date-boundary refresh (§B), reliable Known-Source/Deep-Search for a title-less episode (§D), download/recovery visibility (§E), one-press Back + Back icon (§F), `חדש בישראל` ordering + recent-arrival evidence window (§G/§H), background auto-download fresh metadata (§I), mobile-only CI (§K) |
| Branch / tracking branch | `main` / `origin/main` |
| Starting application HEAD | `da3b612a95666fd22098e8e267a4e729e35ed20f` (F2C.7.2 / code 32) |
| Final application HEAD | `c246b55cc8e1979dcac573b1ef323c27addb63ad` — equals `origin/main`; ONE commit pushed normally (no force), 40 files changed (+1727 / -243) incl. 4 new (2 top-bar vector drawables, F2c73DownloadsAffordanceTest, ADR 0031) |
| Exact-head Android CI | run `32826885503` — **success** for `c246b55` (mobile-only job) |
| Mobile identity | `com.funzi7.privatemediatv.mobile`, `0.4.14-phone-test`, versionCode 33 (updates code 32 in place — NO uninstall / NO Clear Data) |
| TV identity | `com.funzi7.privatemediatv`, `0.6.11-f2c71`, versionCode 34 — UNCHANGED; NOT built/tested/linted/verified/delivered this phase (local or CI). TV/Shield deferred |
| Schemas | No migration. Catalog v12, UserState v7, Local Library v3, territory-availability v3 unchanged |
| Development signer SHA-256 | `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` |
| Pinned TDLib JNI (arm64) SHA-256 | `21d59ebfeba4edc62ea74cefaa79b08650e796530f3d5e57804105cc44cb65dc` — unchanged (verify-only, no rebuild) |
| Published mobile code-33 APK (CI build) | 59,861,045 bytes, SHA-256 `2bd18eb44bf23dc496952b19c9b5cc055905b335e75918708f303148a5de3e9c`, ARM64-only, pinned TDLib JNI `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f` (unchanged from the code-32 build), Development signer; rotated to `/storage/emulated/0/Download/PrivateMediaTV/Mobile/private-media-tv-mobile-latest.apk`. **latest = code 33; previous = code 32** (SHA `82c5c1681ac12aa24eba04e2d97e6c4418470e4604090a22a0764f3632764dab`, byte-identical to the F2C.7.2 published code-32 APK); broken **code 23 excluded** from promotion; TV/Shield delivery files untouched |

## Truthful physical code-32 owner evidence (this milestone's targets)

Series-Eye tap immediate response = **PASS**. Missing-COMPLETE-byte automatic recovery/re-download
self-started = **PARTIAL PASS**. **FAIL** (addressed this milestone): newly-aired E06 (air date
24.08.2026, owner's local date later) did not converge; a real E06 source in a configured Known Source
was found by neither normal discovery nor Deep Search; retention-recovery was invisible outside the
Downloads page; Back needed two presses (a transient source-search state consumed the first); the top
app bar used the text `חזרה`; Home had no pull-to-refresh; `חדש בישראל` rendered below the generic
New/Popular rows and showed only two very old titles.

## What changed this session (F2C.7.3; ADR 0031)

1. **§A/§C aired-episode convergence.** The continuation target's AIRED/FUTURE kind is re-decided at
   recompute time against the CURRENT local date. The scheduled recompute now covers EVERY continuing
   series — My List ∪ series with a durable continuation target ∪ series in Continue Watching — and the
   refresh-currency gate is broadened from My-List membership to continuing-series membership (a series
   with no completion evidence still yields NoProgress and creates nothing). A bounded automatic
   foreground / date-boundary refresh (`onCatalogForegrounded`) runs on process launch and when the
   local calendar day rolls over (a no-op on the same day), re-evaluating aired state and forcing a
   bounded metadata refresh so a not-yet-cached newly-aired episode is discovered — without opening the
   series page and with ZERO Telegram search. A `forceRefresh` flag was added to `seriesDetails`/
   `seasonDetails` (default off) for that bounded refresh. The injected clock is now local-zone
   consistent (the data source moved from UTC to `systemDefaultZone`). Specials excluded, future stays
   future, no fabricated progress.
2. **§B Home pull-to-refresh.** Native Material3 `PullToRefreshBox` routes to the SAME
   `openCatalog(forceRefresh = true)` owner as the `רענון` button (one refresh implementation): TMDB
   Home rows + Israel availability + Series-Eye + local source availability + a forced continuing-series
   continuation refresh, with ZERO Telegram search; existing content stays rendered; Home scroll /
   navigation memory preserved.
3. **§D reliable Known-Source + Deep-Search for a title-less episode.** Factual root cause: a
   bare/partial episode marker omitting the series title (`S01E06`, `1x06`, `פרק 6`, `עונה 1 פרק 6`) was
   classified `IDENTITY_REJECT` and failed closed BEFORE the known-source recall (consulted only for
   `PARSER_REJECT`). A title-LESS marker is now `PARSER_REJECT` (a leading season word like `עונה 1` is
   treated as a marker, not a title), so INSIDE an owner-bound known/manual source the recall matches it
   against the target episode (STRONG/PLAUSIBLE owner-confirmable); a residual REAL conflicting title
   stays `IDENTITY_REJECT`, and a non-known source still fails closed — a bare marker never becomes a
   global catalog identity and cannot cross-bind a different series. Deep Search now INCLUDES the
   inherited/owner-bound Known Sources (previously excluded as "already covered by FAST", which never
   ran in a pure Deep), with the bounded per-source `GetChatHistory` rescue. Bounds unchanged.
4. **§E download/recovery visibility.** A compact top-app-bar Downloads control on catalog screens
   (except Downloads) with an active-count badge and a progress ring — determinate only when every
   active transfer has a known total, otherwise indeterminate; never a fabricated percentage — driven
   by the ONE `MobileDownloadCoordinator`/Room projection (no second tracker); tapping opens Downloads.
   The Downloads row shows a truthful `משחזר קובץ…` state (durable record COMPLETE + a live active
   transfer) distinct from a healthy COMPLETE and from a genuinely missing file
   (`הקובץ המקומי אינו זמין` + `הורד מחדש`). Supplements the OS foreground notification.
5. **§F one-press Back + Back icon.** `navigateBack()` cancels the transient inline source
   search/preparation of the page being left (results retained for a zero-re-search reopen,
   generation-guarded) AND pops the previous entry in the same action — no two-step. The inline panel
   keeps its explicit `סגור מקורות` close. The textual `חזרה` top-bar action becomes a standard
   AutoMirrored Back icon (48dp, Hebrew content description); system Back and top-bar Back call the same
   contract; player and Local Library Back unchanged.
6. **§G/§H `חדש בישראל`.** The arrival rows are prepended to the whole passive discovery block, so the
   row renders after the owner/personal area and before EVERY generic discovery row regardless of
   registry order. A 60-day recent-arrival window keyed on the arrival EVENT (authoritative
   available-since, else the observed absence→presence transition — never production year, never first
   observation) ages out a stale transition while keeping an old title that genuinely arrived recently.
   The F2C.6.1 evidence floor and the current-included-access 🇮🇱 badge semantics are unchanged.
7. **§I background auto-download fresh metadata.** The durable WorkManager worker forces a bounded
   metadata refresh (same aired policy as §A) to discover a not-yet-cached newly-aired REGULAR episode
   and enqueue it once, without opening the Catalog UI. OFF by default, no Specials/future, bounded
   per-series backoff, the ONE download engine.
8. **§K mobile-only CI.** The `Android CI` validation job no longer assembles, tests, lints, verifies,
   version-checks, or uploads app-tv, and delivers no Shield; it runs Gradle wrapper validation, pinned
   official TDLib verification, mobile + mobile-used-core unit tests, mobile lint, the signed ARM64
   mobile APK, mobile package/version/signer/pinned-TDLib-JNI verification, the mobile delivery/
   rejection/upgrade/credential/provisioning harnesses, and uploads only the mobile artifact. TV
   scripts/features retained for the later phase.

Docs updated: ADR 0031, CHANGELOG, TODO (post-commit CI/publication facts live here in agent-memory,
not as stale TODO checkboxes), PROJECT_STATE, HANDOFF, MOBILE_ACCEPTANCE (F2C.7.3 code-33 checklist),
RELEASE_REVIEW, UX_DECISIONS, README, TEST_PLAN.

## Validated vs pending

- **Validated locally (mobile-only per owner correction):** `:app-mobile:testDebugUnitTest` 499/0,
  `:core-catalog:testDebugUnitTest` 371/0, `:core-metadata:testDebugUnitTest` 136/0 (2 opt-in
  live-TMDB skips); `:app-mobile:lintDebug` + `:core-catalog:lintDebug` + `:core-metadata:lintDebug`
  0 Error/Fatal; `:app-mobile:assembleDebug`; built mobile APK verified (0.4.14-phone-test/33, ARM64,
  pinned TDLib JNI `21d59ebf…` unchanged, Development signer); mobile delivery 16 (incl. code 32→33
  rotation) / CI rejection 20+1 / upgrade 13 (mobile 32→33) / credential 41 / pmtprov 4 shell
  harnesses; `bash -n` all scripts; node LAN-crypto/provisioning/interop verifiers; `git diff --check`
  clean; `adb devices -l` empty. **Did NOT build/test/lint/verify app-tv** (local or CI).
- **Validated remotely:** exact-head Android CI `32826885503` **success** for `c246b55`; exact-head
  mobile code-33 APK downloaded + rotated. Rotation `rotated`: latest = code 33 (APK SHA `2bd18eb4…`), previous = code 32 (APK SHA `82c5c168…`); broken code 23 excluded. No TV artifact published to phone; no Shield delivery.
- **PENDING (no ADB on host — owner physical acceptance):** every code-32 FAIL above (aired
  convergence, Known-Source/Deep-Search discovery, recovery visibility, one-press Back, pull-to-refresh,
  `חדש בישראל` order/evidence) is the owner's live gate on the phone. **No code-33 physical acceptance
  is claimed.** Still also pending physical: protected-source playback, passive availability, background
  auto-download, long-horizon byte retention, recommendation-ranking quality.
- **NOT done (by constraint):** NO TV bump, NO TV build/test/lint/verify, NO TV delivery, NO Shield
  delivery, NO TDLib rebuild.

## Remaining real risks

- The known-source title-less relaxation surfaces a matching bare-marker file as an owner-confirmable
  POSSIBLE inside an owner-bound source; a channel that mixes a different series' title-less episodes
  under the same season number could present a plausible-but-wrong POSSIBLE (still owner-confirmed
  before any bind; a conflicting title is rejected). Physical Known-Source discovery is the gate.
- The recent-arrival window (60 days) is a product choice; if the owner considers a genuine older
  arrival still "new", the window may need tuning after physical review.
- All runtime/on-device behavior (aired convergence timing, pull-to-refresh, discovery, recovery UI,
  Back) is host-verified only; the phone remains the acceptance gate.

## Exact next steps

Await the owner's code-33 physical results (the `docs/MOBILE_ACCEPTANCE.md` F2C.7.3 checklist) and fold
new evidence in. The **later phase** is the TV/Shield application: bump TV, build/regress app-tv, and
deliver to the Shield — only after the owner accepts this mobile-test build.

## Continuation instructions

Start at HEAD `c246b55` on `main` (== origin/main). Do NOT reset/clean/stash/force-push or rebuild
TDLib. This is the Mobile Test phase: do NOT build/test/lint app-tv or bump/deliver TV. Heavy builds
via `/root/work/bin/heavy-run -- ./gradlew …` (device-wide build lock; not on PATH) — ALWAYS wrap a
run in `timeout` and give the Bash tool its own high `timeout` (or run in background), since the tool
default is 2 min. `heavy-run` swallows gradle stdout; read JUnit XML under `*/build/test-results/*/*.xml`
for authoritative pass/fail. When bumping mobile versions touch every pin: `app-mobile/build.gradle.kts`,
`MobileModels.kt`, the CI mobile metadata printf, `scripts/verify|export|download` `EXPECTED_*`,
`scripts/lib/mobile-apk-delivery.sh` rotation allow-list (add the PREVIOUS `name:code`), and the
delivery/rejection/upgrade harnesses (incl. the `CODE_*_BASELINE` maps + the current rotation test).
`MobileManifestContractTest` reads `build.gradle.kts` at RUNTIME — never edit versions mid-test-run.
Publication is the exact-head mobile CI downloader after `Android CI` passes; never deliver TV/Shield
this phase; never bypass TDLib forward/save/export restrictions.
