# Private Media TV — F2C.6.1 Handoff

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | `funzi7/private-media-tv` |
| Milestone | F2C.6.1 — physical code-28 defect fixes: derived tri-state series Eye with reversible SERIES_EYE provenance; Continue Watching convergence; shared library-card four-action strip; `חדש בישראל` evidence floor + historical repair + structural placement; Local Library parent-folder identity evidence; cross-platform architecture audit |
| Branch / tracking branch | `main` / `origin/main` |
| Starting application HEAD | `e0bd44e56b35a08ca2aacf6b23cd5d15ca59f1e2` |
| Final application HEAD | `b5785d4f622699f4c905807ac96ad53761cf00ab` |
| Exact-head Android CI | `32613768659` — success, exact head `b5785d4f622699f4c905807ac96ad53761cf00ab` (both jobs green; exact-head mobile + TV artifacts uploaded, unexpired) |
| Mobile identity | `com.funzi7.privatemediatv.mobile`, `0.4.10-phone-test`, versionCode 29 (updates code 28 in place) |
| TV regression identity | `com.funzi7.privatemediatv`, `0.6.9-f2c61`, versionCode 32 (shared regression build only; not delivered) |
| Schemas | Catalog/FTS 11; UserState **v6 unchanged** (watch-mark provenance via new persisted `reason` values); territory availability **v2→v3** additive + fail-closed arrival repair; Local Library v2 unchanged |
| Development signer SHA-256 | `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` |
| Local mobile APK | 59,382,512 bytes, SHA-256 `5e1e606ab450a06ad2e05db6c7bceb58648b7191a809f0b724b1e13a4df0735d` |
| Local TV regression APK | 59,082,747 bytes, SHA-256 `89dbbc4f1174f559251a99f554c742fca445474c9c6e7676be56057ced134182` |
| TDLib | Pinned official commit `022d60202e446ad1287b9fb68e687c8a0760788b`, verify-only (no rebuild); AAR `025313d2a7cdbf148e5c700e8ef6c9d384f2301aff043c844997e0c23eb9abd2`, JNI `21d59ebfeba4edc62ea74cefaa79b08650e796530f3d5e57804105cc44cb65dc` |

One cohesive application commit was pushed normally (no force). Final HEAD equals `origin/main`.
Exact-head CI passed and uploaded both exact-head artifacts.

**PUBLICATION IS WITHHELD (release gate).** The milestone made real runtime validation of the
live `חדש בישראל` data path a release gate. No TMDB credential exists anywhere on this host
(environment, configs, other local repos, and shared storage were all searched) and
`adb devices -l` lists no device, so the live positive-path TMDB region-IL smoke could not run —
by the milestone's own rule this is a release blocker. Therefore the exact-head mobile code-29
APK was NOT published: the phone keeps latest = verified code 28
(`f9c3a24e78242bd0a54860004f28be56198f18474f4ecdc484e32f52e234cc7f`) and previous = code 27
(`a2450b1479277e1c4328a4d0b187756332ec4d347edaa4f379415d73f97a1866`), verified read-only after
CI. Broken code 23 remains excluded. No TV export/delivery, Shield action, uninstall, downgrade,
or Clear Data occurred.

## Product behavior delivered

1. **Derived tri-state series Eye (owner-chosen model).** On a STANDARD series the top Eye is
   derived from durable regular-episode watched/playback evidence plus truthful TMDB metadata:
   OFF (an aired regular episode is unwatched), CAUGHT_UP (indeterminate — everything aired
   watched but the latest season's released run not provably complete; a real
   `triStateToggleable` state with its own Hebrew state description, never a false binary),
   COMPLETE (positive completion evidence only — closed series, or last-aired provably closing
   the fully-aired latest declared season; every insufficiency fails closed to CAUGHT_UP).
   Season 0 never participates; a newly aired unwatched episode returns the Eye to OFF
   automatically. Movies and recurring-dated titles keep the binary title register; historical
   series title-Seen bits are preserved and never converted into watched episodes.
2. **Safe reversible Eye bulk with durable provenance — no schema bump.** The Eye-OFF tap loads
   all regular seasons (fail-closed abort if any fails), marks only aired regular episodes not
   already watched with the new persisted `SERIES_EYE` reason value (season bulk now writes
   `MANUAL_SEASON_BULK` and skips already-watched rows), fabricates no playback/Resume rows,
   starts no Telegram work, and recomputes continuation once. Undo removes ONLY marks still
   solely SERIES_EYE-owned; real playback completion upgrades a mark's ownership in place; later
   explicit episode/season actions always win; no timestamp heuristics. UserState stays v6 —
   the lenient reader means a code-28 rollback reads new marks as unwatched instead of failing
   to open a bumped schema.
3. **Continue Watching convergence.** The physically observed stale-aired-target shape
   (S02E09-style) is reproduced and fixed as a pinned regression: after a caught-up bulk no
   older aired gap survives as a target or Resume; a known future episode becomes the truthful
   waiting card; a proven finale leaves nothing; undoing an evidence-empty series also removes
   its continuation target. Older-gap priority, manual-unwatched authority, My List new-season
   re-entry, Resume dedup, and Specials exclusion are unchanged.
4. **Shared four-action strip on collection cards.** Cards in `הרשימה שלי`/`אהבתי`/`רוצה לראות`
   (rows and full pages) render THE catalog strip via one shared implementation
   (`F2bCardActionStrip`): Plus/Bookmark/Heart/Eye independent, the collection's own action
   active, action taps never open Details, geometry/2:3 poster/title-year slot/RTL/Israel badge
   unchanged.
5. **`חדש בישראל` evidence floor + repair + placement.** An arrival now requires genuine
   evidence: an authoritative available-since/season date, or a genuinely monitored per-title
   authoritative absence→presence transition (a per-title watch-provider response is COMPLETE
   for that title, unlike a bounded Discover page; the badge worker's fresh per-title results
   feed a durable evidence store — territory v2→v3 additive with the reserved
   `authoritative-title-evidence:v1` scope). First-observation time is never arrival proof;
   RETURNED and DAY_ONE stay excluded. The v3 migration repairs historically unprovable arrival
   classes fail-closed while preserving every current-availability row, so the 🇮🇱 badge (dedup
   queue, 24-batches, ≤4 concurrency, included subscription/free/ads only, newer-negative-only
   removal) loses nothing and is regression-pinned unchanged. The combined row renders
   structurally (by `CatalogSection` identity, never display-string matching) before every
   broadcaster/streaming rail, after Continue Watching and the owner-library rows.
6. **Local Library folder-context recognition.** The production SAF traversal carries a bounded
   relative ancestor-folder chain (nearest 4, root excluded, length-capped, never persisted or
   logged) into the parser: filename evidence has priority; `Season N`/`עונה N`/`SNN` folders
   contribute season context only; the nearest meaningful non-generic ancestor supplies the
   series-title fallback; season contradictions keep filename values but fail closed to an
   owner-confirmable match. New bare `Episode N`/`E NN` forms. Reconcile reclassifies
   fingerprint-unchanged rows via pure re-parse — no media re-extraction, bindings and
   playback/identity keys byte-identical. Local Library DB stays v2.

## Architecture and security decisions

- ADR 0027 records the derived-Eye model, the reason-column provenance choice (explicitly chosen
  over a v7 bump for rollback safety), the shared strip contract, the Israel evidence
  floor/transition model and fail-closed historical repair, the structural row placement, the
  folder-context rules, and the opt-in live-smoke design.
- `docs/ARCHITECTURE.md` gains the F2C.6.1 cross-platform audit: pure-JVM vs Android-bound
  module map, what `app-tv` actually implements (engineering shell + real Telegram streaming
  surface; zero catalog/metadata usage), Shield full-product prerequisites (TV catalog rendering
  is the only prerequisite package), the factual Windows abstraction map (no desktop target
  exists; none was created), and non-overlapping parallel work packages.
- No Telegram work was added to any browsing/continuation/badge path. No scraper was fabricated.
  TDLib was verified only. No credentials, tokens, private identifiers, media names,
  screenshots, sessions, or private URLs were committed or copied into this handoff. The live
  smoke reads its token only from the invocation-time `PMTV_TMDB_SMOKE_TOKEN` environment
  variable and never persists or prints it.

## Validation actually run

- Full `./gradlew test`: **1,564 discovered; 1,559 passed; 0 failures; 0 errors; 5 skipped** —
  3 environment-dependent private-LAN listener cases (no eligible private IPv4 interface on this
  host) plus the 2 OPT-IN live TMDB smoke tests (gated off in normal/CI runs; skipped is
  reported as skipped, not passed). Module counts: mobile 446, TV 74, catalog 357, locallibrary
  48, metadata 127, model 19, playback 96, provider 27, provisioning 48, security 98,
  telegram 224.
- Aggregate `./gradlew lint`, `:app-mobile:assembleDebug`, `:app-tv:assembleDebug` passed.
- Harnesses: credential scanner 41; TV delivery 9; mobile delivery 16 (outgoing-rotation case
  now 28→29); TV CI downloader rejections 8; mobile CI downloader 20 rejections + 1 success;
  upgrade verifier 13; provisioning inspector 4; `bash -n` for 27 scripts; pmtprov WebCrypto
  interop self-test, LAN crypto fallback, and provisioning-HTML verifiers.
- REAL published-code28 → built-code29 upgrade verification passed (same package, increasing
  code, same signer, ARM64-only, single pinned JNI, update-preserving `adb install -r` policy).
- Built APK identities verified: mobile `0.4.10-phone-test`/29 and TV `0.6.9-f2c61`/32, both
  ARM64-only with the pinned JNI and Development signer.
- **Real integration smokes:** the Local Library smoke drove ACTUAL nested directories/files
  (including Hebrew names) through the production SAF-contract provider, the production
  `AndroidLocalDocumentProvider` recursive traversal, parser, matcher, repository, and Room
  store end to end — passed (only the OS permission-grant check is bypassed on the JVM host).
  The live TMDB smoke ran against the REAL api.themoviedb.org service through production
  transport/parsing/classification: the unauthenticated failure path passed (typed failure;
  fabricates no availability and no arrival); the positive included-access checks were BLOCKED —
  no TMDB credential and no device.
- Exact-head Android CI `32613768659` succeeded for `b5785d4f…` (wrapper validation +
  TDLib/tests/lint/signed TV+mobile assembly job) and uploaded both exact-head artifacts
  (mobile 59,383,588 bytes; TV 59,083,689 bytes, per the GitHub artifacts API).
- `git diff --check`, staged-scope review, and final repository cleanliness checks passed.
- `adb devices -l`: no device attached at any point; no installation/launch/physical claims.

## Phone publication

**Not performed (release gate).** The canonical mobile directory was verified read-only after
CI and is unchanged: latest = code 28 (`0.4.9-phone-test`, SHA-256 `f9c3a24e…`, 59,332,692
bytes), previous = code 27 (`0.4.8-phone-test`, SHA-256 `a2450b14…`, 59,249,482 bytes). Broken
code 23 remains excluded and blocklisted. TV download files untouched.

## Pending, limitations, and risks

- **Release gate (blocker): live positive-path TMDB smoke.** To finish the release: run
  `PMTV_TMDB_SMOKE_TOKEN=<owner token> ./gradlew :core-metadata:testDebugUnitTest --tests
  '*F2c61LiveTmdb*' -Ppmtv.live.tmdb.smoke=true` (token never persisted/printed) or perform a
  real-device E2E; on success run `./scripts/download-latest-ci-mobile-apk-to-phone.sh` against
  exact head `b5785d4f622699f4c905807ac96ad53761cf00ab` (CI artifacts retained 30 days) to
  publish code 29 with rotation latest=29 / previous=28.
- **Physically verified from code 28 (owner):** recursive Local Library tree scanning, nested
  file discovery, and file recognition. **Not physically verified:** local playback/delete/
  reconcile, all code-29 outcomes (the F2C.6.1 procedure in `docs/MOBILE_ACCEPTANCE.md`), and
  the remaining code-28 checks that continue during normal usage.
- With TMDB-only sources, `חדש בישראל` fills only as monitored per-title transitions accumulate
  (or when a dated official feed is integrated); this is deliberate truthful precision over
  fabricated recall, and the historical false rows were repaired away.
- A code-29→28 rollback reads SERIES_EYE/SEASON_BULK marks as unwatched under code 28 (lenient
  reader; data physically preserved and restored on re-upgrade) — the deliberate safest
  direction versus an unopenable bumped schema.
- TV code 32 remains a regression build only; no Shield delivery or acceptance is claimed.

## Exact next step / continuation

1. Complete the release gate (live TMDB smoke with owner token, or device E2E), then publish
   code 29 via the exact-head CI mobile downloader and verify rotation 29/28.
2. Owner installs code 29 over code 28 (no uninstall/Clear Data) and runs the F2C.6.1 procedure
   in `docs/MOBILE_ACCEPTANCE.md` (tri-state Eye states/bulk/undo, CW convergence, collection
   card strip, Israel row behavior/placement, folder-context recognition via `סרוק שינויים`).
3. Deferred and untouched: local-file catalog playback bridge (needs the owner architecture
   decision), local source priority/CW-reopen/progress/auto-next parity, OMDb provisioning,
   Wikidata franchise population, Windows implementation, final Shield rollout.

Preserve all permanent constraints: `funzi7` only; no reset/clean/restore/stash/force push; no
alternate checkout/worktree; no speculative TDLib rebuild; no Telegram work from
browsing/continuation/badge paths; mobile-only publication; never claim physical or runtime
evidence without the owner/device.
