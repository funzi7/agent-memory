# Private Media TV — F2C.6 Handoff

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | `funzi7/private-media-tv` |
| Milestone | F2C.6 — My List/Liked semantic split; unified Continue Watching progression; saved-series new-season reactivation; exact relationship-rail Back restoration; eventual Israel-badge coverage; Specials-last |
| Branch / tracking branch | `main` / `origin/main` |
| Starting application HEAD | `f4e5d65003cc36ccf145c9ce752f6ba1bea85026` |
| Final application HEAD | `e0bd44e56b35a08ca2aacf6b23cd5d15ca59f1e2` |
| Exact-head Android CI | `32349900412` — success, exact head `e0bd44e56b35a08ca2aacf6b23cd5d15ca59f1e2` |
| Mobile identity | `com.funzi7.privatemediatv.mobile`, `0.4.9-phone-test`, versionCode 28 (update over code 27) |
| TV regression identity | `com.funzi7.privatemediatv`, `0.6.8-f2c6`, versionCode 31 (shared regression build only; not delivered) |
| Schemas | Catalog/FTS 11; UserState v6 (strictly additive v5→v6); territory availability v2; Local Library v2 |
| Development signer SHA-256 | `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` |
| Published mobile APK SHA-256 | `f9c3a24e78242bd0a54860004f28be56198f18474f4ecdc484e32f52e234cc7f` |
| Published mobile APK size/time | 59,332,692 bytes; `2026-08-20 08:54:41.226516428 +0000` |
| Published mobile TDLib JNI SHA-256 | `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f` |

One cohesive application commit was pushed normally, without force. Final application HEAD equals
`origin/main`. Exact-head CI passed every job and uploaded both signed artifacts. Only the exact-head
mobile artifact was downloaded and published. No TV export/delivery, Shield action, uninstall,
downgrade, or Clear Data operation occurred. `adb devices -l` found no attached device, so installation,
launch, and physical acceptance are not claimed.

## Product behavior delivered

1. **Legacy Favorite becomes My List, never Liked.** The persisted v5 `favorite` bit remains the
   storage-compatible representation of My List (`הרשימה שלי`) and renders on Plus. Every existing old
   Heart/Favorite selection therefore appears as active Plus after upgrade. New Liked (`אהבתי`) is a
   separate durable bit and starts false for all legacy rows. Bookmark remains Want to Watch and Eye
   remains Seen.
2. **Four independent owner actions.** Plus/My List, Bookmark/Want, Heart/Liked, and Eye/Seen persist
   independently on movie and TV cards and Details. They are separate checked accessibility/click
   targets; action taps never open the card underneath. My List removal/re-add does not change Liked,
   and Liked does not reorder an unchanged My List collection.
3. **Recommendation semantics are split.** Typed signals distinguish My List, Liked, Want, Seen,
   playback, and Not Interested with field-specific occurrence clocks. Only explicit Liked supplies
   the strong positive affinity boost; all old saved titles are not misread as likes.
4. **UserState v5→v6 is strictly additive.** New columns hold Liked, its timestamp, and exact-candidate
   continuation suppression. The physical Favorite key/columns remain intact. A real Room
   `MigrationTestHelper` v5 fixture plus store-open assertions prove legacy Favorite→My List true,
   Liked false, and preservation of Want, Not Interested, Seen, snapshots, watched rows, playback
   progress, continuation targets, and journal rows.
5. **One standard-series continuation engine.** Real playback completion and durable manual Watched
   evidence combine only to select the next regular episode; the registers remain separate. Manual
   Watched never fabricates progress. Manual Unwatched can move the target backward. Actual episode
   metadata drives ordering and cross-season selection; old gaps win over a new season.
6. **Target-before-Resume cleanup.** Playback/manual/bulk paths persist a replacement or truthful
   terminal decision before removing the consumed Resume. Metadata/commit failure retains the Resume.
   Later metadata recovery promotes only retained real automatic-completion evidence, never a manual
   Watched row, and removes the old membership only after the new target/terminal decision commits.
   Real Resume wins dedup when it represents the same target episode.
7. **Explicit removal remains meaningful.** Suppression is scoped to the exact current candidate.
   Atomic upsert/reveal plus a per-series mutex and owner-action generation make the later owner action
   win both pre-lock and in-lock races. A materially changed target may re-enter; removal is not a
   permanent series ban.
8. **Saved-series new-season recovery.** My List TV series receive deduped, cache-first metadata
   freshness with concurrency at most four. A later regular season can create a continuation target
   even when the prior target row is null and the old metadata looked finished. This never starts
   Telegram and never jumps over older unwatched regular content.
9. **Specials are last and opt-in.** One shared presentation policy orders regular seasons ascending,
   then season 0/`מיוחדים`. Specials-only titles still render and default correctly. Season 0 can be
   opened, played, and marked Watched, but normal continuation never crosses into it.
10. **Exact relationship-rail Back.** Collection, Franchise, Similar, and Recommendations use stable
    contexts derived from parent `MediaIdentity` plus relationship kind. The click path synchronously
    captures first-visible identity anchor, bounded index, pixel offset, and parent Details vertical
    offset before navigation. Existing `NavigationPositionMemory` restores anchor first, then exact
    offset; a bounded index is only the fallback when the anchor disappeared. Series vertical restore
    waits for the selected season layout, including Specials-only pages.
11. **Eventual Israel badge coverage.** A generation-owned deduped queue admits currently loaded Home,
    owner-library, relationship, end-screen, and Search cards plus appended pages. It drains 24-item
    batches until empty, with provider concurrency at most four (including stale revalidation). One
    identity shown in four rows causes one lookup per epoch. Timestamped evidence distinguishes
    included access, authoritative fresh negative, and unknown/failure; a known positive remains while
    refresh is pending and only newer authoritative negative evidence removes it. Details and Catalog
    share the same cache/evidence. Subscription/flatrate, free, and ads qualify; rent/buy-only does not.

## Architecture and security decisions

- ADR 0026 records compatibility-first My List storage, independent Liked, additive UserState v6,
  evidence-derived continuation, exact candidate suppression, target-free My List refresh, shared
  season ordering, reuse of NavigationPositionMemory, and the bounded Israel queue.
- TMDB remains the metadata/identity and watch-provider authority. My List freshness and Israel badge
  enrichment use the normal TMDB cache/freshness infrastructure. No Telegram search or history scan is
  triggered by Home, Details, continuation refresh, or badge work.
- No ML, local-file catalog playback bridge, OMDb credential provisioning, Wikidata population, Local
  Library scan redesign, player redesign, or Deep Search redesign was added.
- TDLib remained pinned to official commit `022d60202e446ad1287b9fb68e687c8a0760788b` and was verified
  only. No native rebuild was run. No credentials, signing material, private identifiers, media names,
  screenshots, sessions, or private URLs were committed or copied into this handoff.

## Main implementation areas

- `core-catalog`: UserState v6 schema/migration, My List/Liked contracts and Room stores, independent
  clocks/journal semantics, series watched lookup, atomic continuation suppression/reveal, migration and
  persistence tests.
- `core-metadata`: shared season presentation and regular-series progression policies; timestamped
  territory-availability evidence; progression/order/ranking tests.
- `app-mobile`: four-action state/presentation, library rows, Liked-only reranking, unified continuation
  recomputation and saved-series freshness, restoration-aware Details navigation, Israel queue/evidence
  handling, card/Details/Search badges, and focused ViewModel/Compose/data-source regressions.
- `app-tv`: versionCode 31 / `0.6.8-f2c6` regression pin only.
- CI/release: exact mobile 28 and TV 31 assertions/metadata, safe mobile code27→28 rotation, verifier and
  downloader harness pins, ADR and release/acceptance/product/data/playback/test documentation.

## Validation actually run

- `./gradlew --version` and `./gradlew projects` passed (Gradle 9.5, JDK 21).
- Focused migration, owner-state, recommendation, continuation, season-order, navigation Compose,
  Israel queue/data-source, startup, and retained regression tests passed. Four independent read-only
  final audits (owner state, continuation, navigation/season order, Israel coverage) reported no
  concrete remaining F2C.6 defect.
- One broad `./gradlew test` passed: **1,517 discovered; 1,514 passed; 3 skipped; 0 failures/errors**.
  The skipped cases were environment-dependent private-LAN socket-listener tests because this host had
  no eligible private IPv4 interface. Counts: mobile 439, TV 74, catalog 349, Local Library 34,
  metadata 109, model 19, playback 96, provider 27, provisioning 48, security 98, Telegram 224.
- `./gradlew lint`, `./gradlew :app-mobile:assembleDebug`, and
  `./gradlew :app-tv:assembleDebug` passed.
- Release/security harnesses passed: credential scanner 41 cases; TV delivery 9; mobile delivery 16;
  TV CI downloader rejection 8; mobile CI downloader 20 rejection + 1 success; upgrade verifier 13;
  provisioning inspector 4; Bash syntax for 26 scripts; all three browser/WebCrypto interoperability
  verifiers.
- Real retained code27→local-code28 and code27→published-CI-code28 upgrade verification passed:
  package continuity, increasing versionCode, same signer, ARM64-only, exactly one TDLib JNI, and
  update-preserving `adb install -r` policy with no downgrade/uninstall/clear-data behavior.
- Local mobile APK: 60,754,927 bytes, SHA-256
  `f52b04e6e6427a87a24fdb645119aa0ae0cd156eb8d2e6b088e9cf11fbd2e582`, built
  `2026-08-20 08:28:58.970881268 +0000`.
- Local TV regression APK: 59,066,359 bytes, SHA-256
  `e467f2c1f51d07ca7e58c42e6db6572074f011136ec7f6d31be954161017c79c`, built
  `2026-08-20 07:50:10.970882156 +0000`. It was not delivered.
- `./scripts/bootstrap-tdlib-android.sh --verify-only` and
  `./scripts/verify-tdlib-artifact.sh` both passed. Local official AAR SHA-256:
  `025313d2a7cdbf148e5c700e8ef6c9d384f2301aff043c844997e0c23eb9abd2`; local artifact JNI SHA-256:
  `21d59ebfeba4edc62ea74cefaa79b08650e796530f3d5e57804105cc44cb65dc`.
- `git diff --check`, staged scope review, credential-shape scan, binary-file scan, APK private-material
  checks, and final repository cleanliness checks passed.
- Exact-head Android CI `32349900412` succeeded in 11m12s. Wrapper validation, pinned TDLib verification,
  rejection/security gates, aggregate/focused tests, lint, signed ARM64 TV/mobile assemblies,
  package/version/signer/JNI checks, metadata/checksums, and both artifact uploads passed. The only
  annotation was a non-failing GitHub-hosted Node.js action-runtime deprecation notice.

## Phone publication

- Exact-head CI mobile downloader published:
  `/storage/emulated/0/Download/PrivateMediaTV/Mobile/private-media-tv-mobile-latest.apk`.
- `latest` is verified code 28 (`0.4.9-phone-test`), SHA-256
  `f9c3a24e78242bd0a54860004f28be56198f18474f4ecdc484e32f52e234cc7f`, 59,332,692 bytes,
  timestamp `2026-08-20 08:54:41.226516428 +0000`.
- `previous` is verified code 27 (`0.4.8-phone-test`), SHA-256
  `a2450b1479277e1c4328a4d0b187756332ec4d347edaa4f379415d73f97a1866`, 59,249,482 bytes.
- Exactly those two mobile APKs remain. Broken code 23 is excluded and remains blocklisted. The TV
  download-directory APKs were not changed by the mobile-only publisher.

## Pending, limitations, and risks

- **Physical code28 acceptance is pending.** No device was attached, so install/update, launch, state
  preservation on the physical phone, action behavior, continuation behavior, rail restoration, and
  far-row Israel coverage have not been owner-verified yet.
- **Local Library scanning remains physically pending** unless the owner performs that separate test.
  It is not claimed as passed by this milestone.
- Israel availability is only as complete/current as authoritative region-IL watch-provider evidence.
  Failures remain unknown and retry only on a later bounded refresh; they are never treated as a fresh
  negative. Rent/buy-only offers intentionally never show the flag.
- A continuation metadata/target commit failure intentionally retains the old Resume rather than
  showing a potentially false next card. Normal later metadata refresh provides the recovery path.
- The successful CI run emitted a non-blocking notice that some pinned third-party GitHub actions are
  being forced from deprecated Node.js 20 to Node.js 24 by the runner. This did not affect artifacts or
  validation but should be revisited when those actions publish a reviewed update.

## Exact next step / continuation

1. Owner installs code28 over code27 with no uninstall or Clear Data and performs the F2C.6 procedure in
   `docs/MOBILE_ACCEPTANCE.md`: legacy Hearts→Plus, four-action independence, My List/Liked rows,
   episode/season/new-season continuation, older-gap protection, Specials-last, exact relationship
   Back, far-row/appended Israel coverage, and badge stability. Scanning stays a separate pending gate.
2. If a concrete physical defect appears, make only a scoped F2C.6.x follow-up and preserve the exact
   migration/delivery semantics above.
3. After acceptance, the next substantive roadmap item still requires an owner architecture decision:
   the deferred provider-neutral local-file first-class catalog playback bridge. Do not infer approval
   for OMDb provisioning, Wikidata population, scan/player redesign, or Deep Search redesign.

Preserve all permanent constraints: `funzi7` only; no reset/clean/restore/stash/force push; no alternate
checkout/worktree; no speculative TDLib rebuild; no Telegram work from browsing/continuation/badge paths;
mobile-only publication for this milestone; never claim physical or scanning evidence without the owner.
