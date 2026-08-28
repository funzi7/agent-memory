# Private Media TV — F2C.7.4 Final (mobile-test correction; code 34 published; physical acceptance pending)

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | `funzi7/private-media-tv` |
| Milestone | F2C.7.4 — episode truth, Continue Watching semantics, season completeness/direct refresh, source identity integrity, exhaustive Deep, protected capability separation, stale-index catch-up, forward Israel observation, and factual versioned mobile-test delivery |
| Branch / tracking branch | `main` / `origin/main` |
| Starting application HEAD | `c246b55cc8e1979dcac573b1ef323c27addb63ad` (F2C.7.3 / mobile code 33) |
| Final application HEAD | `7ea85b19fa4c07946043adf0d41b3e08f71242f4` — equals `origin/main`; pushed normally, no force |
| Application commits | `9a5bc88c155eac72f0cb354c63935d1a0de59e98` (correction implementation) and `7ea85b19fa4c07946043adf0d41b3e08f71242f4` (owner-required versioned Test delivery) |
| Exact-head Android CI | run `33157574547` — **SUCCESS** for final HEAD; wrapper validation plus one explicit mobile/mobile-used build job; no TV/Shield job or artifact |
| Mobile identity | `com.funzi7.privatemediatv.mobile`, `0.4.15-phone-test`, versionCode 34; updates code 33 without uninstall or Clear Data |
| TV identity | `com.funzi7.privatemediatv`, `0.6.11-f2c71`, versionCode 34 — unchanged and untouched; no TV build/test/lint/verify/publication/delivery and no Shield action |
| Schemas | Catalog v12, UserState v7, Local Library v3, territory v3 — unchanged; legacy continuation repair uses scoped row reconciliation, not a migration |
| Development signer SHA-256 | `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` |
| Local code-34 APK | 61,581,551 bytes; SHA-256 `71e2d43259263d939b24c6d0398321d5e07a83fe83a1a383af515acf715f6b9b`; ARM64-only; verified local official TDLib JNI SHA-256 `21d59ebfeba4edc62ea74cefaa79b08650e796530f3d5e57804105cc44cb65dc` |
| Published exact-head CI code-34 APK | 59,926,581 bytes; SHA-256 `68c78e393560e91ea316b682bbc5f0e7ce390275df3c75c004dfd837cd8b040b`; ARM64-only; verified workflow-produced official TDLib JNI SHA-256 `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f`; expected signer |
| Delivered path | `/storage/emulated/0/Download/PrivateMediaTV/Test/private-media-tv-mobile-0.4.15-phone-test.apk` — real regular file, exact-head CI bytes, fresh publication epoch `1787908628` |

The owner cancelled the mobile latest/previous slot contract while the first pushed run was active.
That obsolete run (`33156185065`) was cancelled, not treated as final evidence. ADR 0033 and the
delivery tooling now use one factual versioned Test filename. The two obsolete unversioned mobile
slot files and their empty `Mobile/` directory were removed only after the new versioned code-34 copy
was verified. No older versioned or unrelated file was removed. Frozen TV APK SHA-256 values remained
`11bca1c3333cebcb5f08e10d5361b586cb7e7d8341b5aa0b4ff00908ba8f24aa` and
`48095b075917c756eece8689c3684780a083018e5c03bf0568ae1261aac18877`.

## Truthful physical code-33 owner evidence

**PASS:** Series Eye reacted immediately; top Back icon existed; top Downloads icon existed;
`חדש בישראל` was in the requested high Home position; CI was mobile-only; missing COMPLETE bytes
could automatically start recovery.

**FAIL:** a real episode with a past displayed air date still appeared unaired; an incomplete season
appeared as one episode / `1/1 watched`; Continue Watching showed speculative future episodes,
including a fabricated S02E09 after real S02E08; an E06 search displayed explicit E05 files as E06
matches; the real E06 in a configured Known Source was missed by normal and Deep search; physical
Deep planned about 53 sources, completed 0, failed about 53, and ended
`PARTIAL_SOURCE_FAILURE`; `חדש בישראל` still contained only two proven entries.

These remain code-33 facts. Host/CI validation does not convert them into physical code-34 PASS
evidence. **Code-34 physical acceptance is pending.**

## Root causes

1. Progression could derive `latest episode + 1` and persist/render that guess as a real episode.
2. A persisted FUTURE label and independently implemented date checks could outlive the air-date
   boundary, while direct nested metadata routes did not reliably revalidate stale/contradictory
   season structure.
3. A one-row cached/provider snapshot could be treated as proof that a season total was one.
4. Local-index learned-alias and owner-context paths could convert a hard wrong-episode/identity reject
   into POSSIBLE, allowing explicit E05 evidence to surface for target E06.
5. A pure Deep request excluded normal-pool sources as if a FAST phase had already run. Empty
   post-hydration work lacked per-source attribution and was charged as wholesale failure, so the
   observed 0-completed/about-53-failed result did not prove that 53 provider searches executed.
6. Protected-content status was conflated with searchability instead of independent official
   index/search/stream/download/export capabilities.
7. Explicit search could conclude from a stale/partial tail checkpoint without a bounded current-head
   catch-up, missing a newly posted episode.
8. Israel observation covered too few catalog encounter paths to build useful future evidence.
9. Mutable mobile slot filenames obscured factual version identity; the owner replaced that delivery
   contract during finalization.

## Implemented

1. **Central episode truth.** `core-metadata` owns an injected-Clock
   `EpisodeAirStatePolicy`: valid ISO date on/before today = AIRED, later = FUTURE,
   missing/invalid = UNKNOWN. Series, Season, Episode Details, Continue Watching, Series Eye,
   bulk/auto-download, progression, and unaired labels consume it; persisted targets are re-evaluated
   against today.
2. **No fabricated episode identity.** Progression returns only a real provider episode, real
   announcement, or identity-free waiting state. Legacy placeholders are decode/purge-only. A real
   S02E08 completion with no announced successor produces no S02E09 card or target.
3. **Continue Watching semantics.** In-progress/actionable/aired entries are first. Real future
   announcements are last, dated nearest-first then unknown-date. The same real target moves forward
   when it airs; ordering never invents playback progress.
4. **Truthful season structure and direct refresh.** COMPLETE/PARTIAL/UNKNOWN structure prevents false
   exact totals while retaining a verified one-episode season. Stale Series/Season/Episode content
   stays visible during bounded coalesced revalidation; successful writes update the visible route.
   Foreground/date-boundary/Home refresh recomputes continuing metadata without Telegram work.
5. **Hard source identity precedence.** VALIDATED may be automatic; only non-contradictory
   PARSER_REJECT may become owner-confirmable POSSIBLE in strong Known/manual context;
   IDENTITY_REJECT and DATE_EPISODE_REJECT are discarded across index, aliases, bindings, live,
   history, Known, Deep, and persisted paths. Unsafe legacy bindings are conditionally reconciled.
6. **Owner-bound recall.** Exact title-less season/episode markers are supported inside a strongly
   bound series source; bare Hebrew episode markers additionally require unambiguous season context.
   Explicit wrong episode/season/series always wins.
7. **Deep correctness.** Every selected searchable source is planned exactly once, Known/manual
   first even with normal-pool overlap, with at most four concurrent operations. Deterministic order,
   checkpoint/resume, per-source bounds, cancellation, and failure isolation remain. Zero completed
   is FAILED. Privacy-safe counters distinguish hydration, availability, unsupported, provider,
   account, completed-empty, and completed-with-media outcomes.
8. **Capabilities and catch-up.** Officially readable protected sources can index/search/stream while
   offline download/export remain false. Explicit normal/Deep search performs at most two bounded
   incremental pages for relevant stale/partial/interrupted selected indexes, Known first and four
   concurrent; passive Home remains zero Telegram.
9. **Israel forward coverage.** Epoch-deduped, TTL/coalesced observations now include discovery,
   personal lists, continuing series/targets, and catalog-search results. Only authoritative fresh
   region-IL absence→included-access evidence can become an arrival; first positive, production year,
   and stale transitions remain non-evidence.
10. **Factual mobile-test delivery.** The publisher derives
    `private-media-tv-mobile-<versionName>.apk`, writes only beneath `PrivateMediaTV/Test`, stages and
    re-verifies in the same directory, atomically replaces only the exact same-version target, and
    preserves all sibling entries. There is no mobile slot rotation, rollback promotion, or directory
    cleanup. Symbolic/non-regular exact targets fail closed. Broken code23 cannot be delivered because
    only the exact current identity is accepted.

ADR 0032 records episode/search/Deep decisions; ADR 0033 records the owner-updated delivery contract.

## Validation evidence

### Local mobile/mobile-used validation

- Focused correction rerun:
  `/root/work/bin/heavy-run -- timeout 900 ./gradlew :core-catalog:testDebugUnitTest :app-mobile:testDebugUnitTest`
  — PASS.
- Complete explicit module matrix — 1,608 discovered, 1,606 passed, two opt-in live-metadata tests
  skipped, zero failures/errors: app-mobile 506; catalog 384; metadata 141; Telegram 233; playback 96;
  Local Library 56; provisioning 48; security 98; model 19; provider 27.
- `:app-mobile:lintDebug`, `:core-catalog:lintDebug`, `:core-metadata:lintDebug`, and
  `:core-telegram:lintDebug` — PASS.
- `:app-mobile:assembleDebug` — PASS on the final production tree; exact package/version/signer/
  ARM64/JNI/native-layout/private-material verification passed.
- Delivery/security harnesses — credential scanner 41; versioned mobile publisher 13; exact-head CI
  downloader 20 rejection + one success; provisioning inspector 4; mobile-only upgrade 8; real
  retained code33→34 update compatibility; 28 shell scripts syntax; browser provisioning/crypto
  interoperability; both TDLib verify-only commands — PASS.
- `git diff --check` — PASS before each commit and at final verification.
- `adb devices -l` listed no device. No installation, launch, live catalog/provider behavior, or
  physical code-34 acceptance is claimed.

All substantial Gradle commands used `/root/work/bin/heavy-run -- timeout ...`. No root aggregate
`test`/`lint` and no `:app-tv:*` command ran.

### Exact-head CI and publication

- Android CI run `33157574547` completed **SUCCESS** for exact final HEAD
  `7ea85b19fa4c07946043adf0d41b3e08f71242f4`.
- Passed steps included wrapper validation, pinned official TDLib verification, delivery/security/
  upgrade harnesses, browser crypto, Development signer verification, explicit mobile/mobile-used
  unit tests, mobile lint, signed ARM64 mobile assembly, package/version/signer/JNI verification,
  checksum/metadata generation, and mobile artifact upload.
- `./scripts/download-latest-ci-mobile-apk-to-phone.sh` selected only that exact-head successful run,
  verified the artifact, and replaced the same-version local Test file with authoritative CI bytes.
- Final delivered path and SHA-256:
  `/storage/emulated/0/Download/PrivateMediaTV/Test/private-media-tv-mobile-0.4.15-phone-test.apk` —
  `68c78e393560e91ea316b682bbc5f0e7ce390275df3c75c004dfd837cd8b040b`.
- The obsolete mobile slot directory is absent. Retained TV APKs and the offline provisioning tool
  remained untouched. Shield was not attempted.

## External decisions and remaining risks

- No secondary episodic provider is integrated or credentialed. A bounded structural fallback needs
  an owner-selected lawful provider, credential/terms decision, and authoritative external-ID
  mapping; TMDB remains catalog identity. Truthful incomplete UI/direct TMDB refresh are complete now.
- Historical Israel-arrival backfill needs a separately owner-authorized authoritative region-IL
  historical feed with licensing/credential terms. No scraping, invented dates, or inferred history
  was added; forward monitoring is complete.
- The code33 physical Deep evidence did not retain enough safe detail to reconstruct its underlying
  hydration category. Code34 now reports safe aggregate attribution; a real device Deep run remains
  the proof of runtime recovery.
- All episode/date/season/search/Deep/protected/catch-up/Israel corrections are host- and CI-validated
  only. Real provider data, Telegram runtime behavior, and UX quality remain the physical code34 gate.

## Exact next step

Install code34 over code33 without uninstall or Clear Data and execute the F2C.7.4 checklist in
`docs/MOBILE_ACCEPTANCE.md`. Record only observed results. TV/Shield application work remains a later
owner-approved phase after mobile-test acceptance. Future final mobile and TV APKs will use distinct
factual versioned filenames directly beneath `PrivateMediaTV/`, but those final apps are not
implemented or published now.

## Continuation instructions

Start at application HEAD `7ea85b19fa4c07946043adf0d41b3e08f71242f4` on `main` ==
`origin/main`. Do not reset/clean/stash/force-push or rebuild TDLib speculatively. This remains the
Mobile Test phase: do not build/test/lint/version/publish app-tv and do not deliver Shield. Use bounded
heavy Gradle commands. Mobile-test publication is only a verified factual version filename beneath
`Download/PrivateMediaTV/Test/`; never recreate mobile latest/previous slots. Preserve every older
versioned/unrelated phone file. Physical code34 evidence, not host inference, decides the next product
change.
