# Private Media TV — F2B.2 Handoff

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | funzi7/private-media-tv |
| Milestone | F2B.2 — physical source-management crash repair and Israeli TMDB catalog rows |
| Branch / tracking branch | main / origin/main |
| Starting application HEAD | 038a8e3dc7b2d6bc39674ef0ed778ec6a4b98f97 |
| Final application HEAD | 180b6054887e6e0a468134d138da62b874c543a2 |
| Manager-verified F2B.1 CI baseline | 31513282254 |
| Final F2B.2 exact-HEAD CI | 31527095286 — success |
| Agent-memory base before this handoff | 30215844d363de1138cd528c37f5751e8a0094f1 |
| Mobile identity | com.funzi7.privatemediatv.mobile, 0.3.2-phone-test, versionCode 10 |
| TV identity | com.funzi7.privatemediatv, 0.5.2-f2b2, versionCode 15 |
| Development signer SHA-256 | 2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0 |

The application milestone was committed once as
180b6054887e6e0a468134d138da62b874c543a2, pushed without force, fetched, and
verified at origin/main. Exact-final-HEAD Android CI run 31527095286 passed both jobs and uploaded
signed TV and mobile artifacts. Only the exact-head mobile artifact was downloaded and published.
No TV APK was exported, downloaded, installed, or copied to shared storage. No Shield deployment
command ran.

The agent-memory repository had advanced beyond the manager-provided starting reference. It opened
clean at 30215844d363de1138cd528c37f5751e8a0094f1, was fetched, and matched origin/main before this
edit. That newer unrelated public work was preserved.

## Physical code-9 input

The owner physically installed mobile code 9 and established these facts:

- the runtime TMDB credential was accepted, validated, persisted, and did not need re-entry;
- TMDB Catalog and real poster rows loaded successfully;
- Telegram remained authenticated;
- opening "המקורות שלי" showed a loading state for about one second and then crashed the Android
  process/UI;
- the crash prevented management of a usable explicit selected-source set; and
- a later no-source result was not evidence of broken Telegram matching because F2B.1 intentionally
  performs no Telegram search when zero sources are selected.

F2B.2 did not reset Telegram, TMDB, application data, caches, resume, or player state.

## Proven My Sources crash root cause

A real Robolectric/Compose Android lazy-layout regression was first run against the failing
implementation. Once a source row entered the LazyColumn, Compose passed the boxed
F2bSourceChatToken value-class object to its saveable-state holder. Android could not store that
custom boxed object in a Bundle, so row composition failed. The asynchronous source-row load
explains why the physical screen appeared for roughly one second before the process/UI crash.

This was an executable failure, not a source-text inference:

- the pre-repair real Compose render failed when one source row reached lazy layout;
- the boxed custom token failed Android Bundle saveability while its existing opaque String backing
  identity passed;
- the compiled lazy key lambda boxed F2bSourceChatToken before handing it to Compose; and
- after changing the presentation key to a primitive opaque String, the same regression passed.

The repair derives the stable key only from the existing opaque/redacted source identity. It is
Bundle-saveable, stable across recomposition and recreation, collision-resistant within the visible
list, contains no raw Telegram chat ID, and is never exposed in UI, accessibility text, or
unrestricted diagnostics. Provider rows are conservatively deduplicated before presentation.
Indexes are not used as normal identity keys.

The same invalid-key invariant also existed in the source-variant lazy list through a boxed
CatalogSourceToken. F2B.2 repaired that latent path with the same primitive opaque-key rule.

The real Compose source-management suite now passes 14/14 cases and exercises:

- zero rows;
- one selected channel;
- one selected group;
- mixed channel/group rows;
- multiple rows;
- duplicate provider input;
- Add Sources and selected/unselected partitioning;
- refresh while visible and discovery of a newly joined eligible chat;
- refresh failure with the cached screen kept alive and retry available;
- navigation away and back;
- ViewModel/configuration recreation;
- searched-no-match navigation to Manage Sources;
- safe search-failure statistics without raw failure text; and
- unique stable primitive lazy keys through actual Compose lazy-layout behavior.

## Source-management behavior

"המקורות שלי" now:

- opens without the proven lazy-key crash;
- shows only explicitly selected eligible source chats;
- supports broadcast channels and eligible groups/supergroups;
- shows channel/group type plus safe active/inactive state;
- supports Remove and Refresh;
- shows an actionable "הוספת מקורות" empty state when nothing is selected; and
- reads bounded chat metadata only, never message history.

"הוספת מקורות" now:

- shows eligible unselected channels and groups;
- excludes selected My Sources rows;
- supports local title filtering and Refresh;
- discovers newly joined eligible chats;
- moves an added chat into My Sources;
- makes a removed source eligible here again; and
- never auto-selects a source.

Private/direct/secret or otherwise unsupported chats are not silently classified as sources. A
provider chat is mapped independently to either a supported row or a typed safe excluded result.
One malformed/unsupported row cannot terminate valid siblings. Duplicate provider projections are
collapsed conservatively by opaque identity.

A live provider/refresh failure leaves the screen alive, retains valid cached metadata, offers a
retry, and does not delete selected membership or mark unrelated rows inactive.

## Explicit selected-source discovery states

Each explicit Sources/Play/program-source/Refresh request resolves one immutable selected-source
snapshot before planning or provider work. The snapshot includes only opaque membership plus exact
selected total/channel/group counts. Scope revision remains internal and is not displayed.

The terminal states are intentionally distinct:

1. NO_SELECTED_SOURCES: zero selected chats, zero Telegram calls, the Hebrew message
   "לא נבחרו מקורות Telegram.", and an "הוספת מקורות" action.
2. SEARCHED_NO_MATCHES: at least one selected source-chat search completed cleanly but yielded zero
   validated matches, the Hebrew message "לא נמצאה גרסה תואמת במקורות שנבחרו.", plus Refresh,
   Extended Search where supported, and Manage Sources.
3. SEARCH_FAILED: no false negative cache; a retryable safe failure state remains distinct from a
   completed negative search and exposes only stable allowed counts/category.

Public-safe discovery diagnostics contain only:

- selected source, channel, and group counts;
- query-plan count;
- completed source-chat search count;
- candidate and validated-result counts;
- cache/freshness state; and
- a stable safe failure category.

They contain no title, chat/provider/message/file ID, filename, source token, scope revision,
exception text, stack trace, path, timestamp-bearing variant detail, or raw provider result.

The executable end-to-end fake/provider regression uses a selected channel, an unselected channel,
and a selected group. It proves that the selected channel and group are queried, the unselected
channel is not queried, no global account search or history scan runs, valid results can display,
and query/result counts are exact. A per-source failure is isolated; a successful sibling match is
retained. All-failed and no-searchable-selected cases are retryable failures rather than
searched-no-match.

Room advances non-destructively through schema v7 to persist the additional safe counts and failure
category. Legacy negative rows that cannot prove completed selected-source work are made stale.
Selected membership and every unrelated cache remain intact.

Recurring discovery uses the same partial-failure contract. A failed sibling no longer deletes its
cached variants, and one dated result plus incomplete provider work remains retryable rather than
becoming a false definitive NotPromoted decision. Existing F2B.1 warm-first replay, retryable
resolver semantics, trusted complete-local fallback, durable locator reconstruction,
protected-content fail-closed behavior, and source-return retry coverage remain passing.

## Israeli TMDB catalog rows

F2B.2 adds two first-class Hebrew Home rows:

- "סרטים ישראליים"
- "סדרות ישראליות"

The implementation follows the current official TMDB Discover contracts:

- Movie uses /discover/movie with with_origin_country=IL;
- TV uses /discover/tv with with_origin_country=IL;
- ordering is popularity.desc;
- the existing adult/content policy is retained;
- page and selected metadata display language are independent request dimensions; and
- no region or original-language filter substitutes for production/origin country.

Israeli origin and Hebrew original language are explicitly separate concepts. A non-Hebrew Israeli
production remains eligible; a Hebrew-language non-Israeli fixture does not enter solely because of
language. No generic Hebrew-content row was added.

The two rows use the existing bounded pageable metadata architecture, image cache, Room metadata
cache, stale-while-revalidate policy, and permitted stale/offline behavior. Country origin is part
of both request and cache identity, so ordinary Popular Movies/TV rows cannot overwrite the Israeli
rows. Page 2 Movie and page 3 TV tests retain IL while changing metadata language independently.

Israeli-row refresh failure is isolated from Home. Existing stale valid row data remains visible
under the normal cache policy; a first-load failure in one Israeli row does not crash or erase the
other rows. Opening, scrolling, and paginating either Israeli row creates zero Telegram source
backend work. Telegram remains on-demand only after explicit Sources/Play actions.

## Compatibility and preservation

Mobile code 10 updates code 9; TV code 15 is a regression-only update over code 14. Package IDs,
Development signer, Keystore aliases, TDLib paths, ARM64 ABI, and native lineage are unchanged.
Room migration is additive and non-destructive.

The release preserves:

- Telegram API credentials and authenticated TDLib session/database;
- the separate TMDB credential without token re-entry;
- TMDB metadata and image caches;
- explicit source membership;
- on-demand source-discovery cache;
- recurring program and learned-template cache;
- TDLib video-byte cache;
- playback resume and cache ledger;
- warm/local resolver behavior; and
- player preferences.

No uninstall, downgrade, application-data clear, credential replacement, session reset, destructive
database fallback, legacy-history scan, Firebase/analytics/crash reporting, F2C TV redesign, or
generic Hebrew-content feature was introduced.

## Principal modules and files

The final application commit changes 60 files. Principal areas are:

- app-mobile source-management Compose UI, source state models/ViewModel/data source, production
  backend, version metadata, real Compose tests, ViewModel tests, and Israeli-row cache/pagination
  tests;
- core-catalog immutable selected scope, terminal discovery states/statistics, Room v7 migration
  and schema, partial-failure/recurring retention, repositories, services, contracts, and tests;
- core-telegram supported-chat projection, typed bad-row exclusion, opaque deduplication,
  selected-chat-only fanout with sibling failure isolation, and tests;
- core-metadata Israeli Movie/TV row kinds, exact TMDB Discover request mapping, language/origin
  separation, pagination, and tests;
- app-tv version/regression compatibility only;
- Android CI, exact-head artifact selection, package-specific publication and upgrade scripts;
- README, TODO, CHANGELOG, AGENTS, product/architecture/data/security/Telegram/TMDB/UX/test/release/
  handoff/distribution/mobile-acceptance documentation; and
- accepted ADR 0014 for source-management safety and IL-origin rows.

Raw TDLib types remain confined to core-telegram. UI, public models, core-metadata, and
core-catalog remain provider-neutral and opaque.

## Security and privacy review

- No credential, phone number, authentication material, session/database, private source/media
  identity, title, filename, caption, provider ID, QR data, key, token, private URL, screenshot, or
  packaged database appears in source fixtures, public diagnostics, APKs, or this handoff.
- Source-management normal UI may show the owner's private chat titles locally; unrestricted
  diagnostics do not.
- Runtime Telegram and TMDB credentials remain separate, app-private, and Keystore protected.
- Protected-content handling remains fail-closed.
- Credential, packaged-database, native-layout, and private-material scans passed for both APKs.
- The staged application diff contained only reviewed source, tests, schema metadata,
  workflow/scripts, and documentation; no generated binary or private artifact was committed.
- No TDLib native rebuild occurred.

## Local validation

The required command family passed:

    ./scripts/bootstrap-tdlib-android.sh --verify-only
    ./scripts/verify-tdlib-artifact.sh
    ./gradlew --version
    ./gradlew projects
    ./gradlew test
    ./gradlew lint
    ./gradlew :app-mobile:assembleDebug
    ./gradlew :app-tv:assembleDebug
    git diff --check
    adb devices -l

Gradle 9.5 ran on JDK 21. The aggregate result is 933/933 tests with zero failures, errors, or skips.
All 884 F2B.1 tests were retained and 49 F2B.2 tests were added.

| Module | Tests |
| --- | ---: |
| app-mobile | 207 |
| app-tv | 74 |
| core-catalog | 159 |
| core-metadata | 44 |
| core-model | 15 |
| core-playback | 85 |
| core-provider | 27 |
| core-provisioning | 48 |
| core-security | 98 |
| core-telegram | 176 |
| Total | 933 |

Focused application evidence includes 14/14 real Compose source-management renders, 71/71
F2bCatalogViewModel tests, and 25/25 F2bCatalogDataSource tests. Focused core metadata, catalog,
Telegram, playback, and TV regression tasks also passed.

Retained executable validation passed:

- browser LAN crypto fallback, provisioning HTML, and WebCrypto/Kotlin pmtprov interoperability;
- provisioning inspector: 4 cases;
- upgrade behavior harness: 13 cases;
- TV publication harness: 9 cases;
- TV downloader rejection harness: 8 cases;
- mobile publication harness: 11 cases;
- mobile downloader: 20 rejection cases plus one isolated success;
- APK credential scanner: 41 cases;
- APK native-layout, signing, private-material, package, and JNI verification; and
- shell syntax for retained scripts.

Real retained local pairs passed:

- mobile 0.3.1-phone-test/code 9 to 0.3.2-phone-test/code 10; and
- TV 0.5.1-f2b1/code 14 to 0.5.2-f2b2/code 15.

Both preserve package, Development signer, and ARM64 ABI. The update verifier requires
update-preserving install policy and contains no uninstall, downgrade, or clear-data behavior.

Official TDLib 1.8.66 at source commit
022d60202e446ad1287b9fb68e687c8a0760788b was verified without rebuilding.

| Property | Observed value |
| --- | --- |
| ABI / NDK | ARM64 only / NDK r28c |
| Local AAR SHA-256 | 025313d2a7cdbf148e5c700e8ef6c9d384f2301aff043c844997e0c23eb9abd2 |
| Local JAR SHA-256 | e39bb497b7eea1f33d7d3b5816591b7656259df29e0231c10287e514e3951a04 |
| Local packaged JNI SHA-256 | 21d59ebfeba4edc62ea74cefaa79b08650e796530f3d5e57804105cc44cb65dc |
| CI-cache packaged JNI SHA-256 | 790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f |
| Layout | ARM64 DYN, expected dependencies only, 16-KiB compatible and APK aligned |

The local and CI hashes are the retained separately verified binary lineages for the same pinned
official source/build identity. F2B.2 changed no native source, build input, ABI, NDK, signer, or
cache identity.

## Local APK evidence

| Candidate | Identity | Size | SHA-256 | Modification time |
| --- | --- | ---: | --- | --- |
| Mobile | 0.3.2-phone-test/code 10 | 58,359,348 bytes | 0461597ddfa02815866487e7263705894918601cce4f3918694acfcc1c5e35e2 | 2026-08-11 19:07:44.213978317 +0000 |
| TV regression | 0.5.2-f2b2/code 15 | 58,686,649 bytes | 0236d87d80834cd50eb0dce94014cd8e3281a94bed13c29236e4ee28daeaabe5 | 2026-08-11 19:07:42.549978318 +0000 |

Both passed exact package/version/code, Development signer, ARM64/JNI, native-layout,
credential/session/database/private-material, and retained-update checks. The local mobile exporter
was intentionally omitted; the exact-head CI downloader below is the authoritative publication.
The TV candidate was built and inspected only.

## Exact-final-HEAD Android CI

| Field | Value |
| --- | --- |
| Run | 31527095286 |
| URL | https://github.com/funzi7/private-media-tv/actions/runs/31527095286 |
| Branch / commit | main / 180b6054887e6e0a468134d138da62b874c543a2 |
| Run time | 2026-08-11T19:17:25Z through 2026-08-11T19:29:18Z |
| Conclusion | success |
| Wrapper job | 93897982493 — success |
| Android build job | 93898042121 — success |
| Mobile artifact | ID 9115724811, private-media-tv-mobile-apk-180b6054887e6e0a468134d138da62b874c543a2, 57,651,915-byte archive, digest sha256:189ee57b64a0e5db73bdfbd2231c8606ca9bc6dec2459c71ea2d778ca28e824e |
| TV artifact | ID 9115723615, private-media-tv-apk-180b6054887e6e0a468134d138da62b874c543a2, 58,215,240-byte archive, digest sha256:600696530138dc34dfec22afd8c150d31d6e6b0315b1a76e00beecb49d10dd50 |

The run passed wrapper validation, pinned official-TDLib verification without a native rebuild,
artifact-selection rejection paths, LAN crypto fallback, Development signer reconstruction and
verification, all unit tests, focused F2B.2 tests, lint, signed ARM64 TV/mobile assembly,
package/version/signer/JNI/content verification, metadata/checksum generation, and both uploads.
The push-only run correctly skipped the pull-request signing identity step.

GitHub emitted one non-failing maintenance annotation: SHA-pinned actions whose bundled runtime
targets Node 20 were forced onto Node 24. It did not affect this successful release but remains a
future workflow-maintenance item.

## Final exact-head CI mobile-only delivery

After CI succeeded, the required command selected only the exact-final-HEAD mobile artifact:

    ./scripts/download-latest-ci-mobile-apk-to-phone.sh

It verified artifact shape/metadata, exact commit, checksum, package, version, Development signer,
ARM64 ABI, pinned JNI, native layout, and prohibited-content boundary before publishing through the
mobile-only rotation path.

| Field | Final CI mobile APK |
| --- | --- |
| Canonical path | /storage/emulated/0/Download/PrivateMediaTV/Mobile/private-media-tv-mobile-latest.apk |
| Package/version | com.funzi7.privatemediatv.mobile, 0.3.2-phone-test, versionCode 10 |
| Size | 57,650,840 bytes |
| APK SHA-256 | 306805992205653999614b01366627b3f3aa2f1a3392dbdd3663a1bc99c06040 |
| Fresh modification timestamp | 2026-08-11 19:32:40.769977746 +0000 |
| Modification epoch | 1786476760 |
| Development signer SHA-256 | 2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0 |
| ABI / JNI | ARM64 only / 790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f |
| Native layout | NDK r28c, ARM64 DYN, 16-KiB compatible/aligned, expected dependencies only |

The canonical APK is a real regular copied file, not a symlink. A fresh independent mobile verifier
passed. The published previous APK is the retained exact-head code-9 artifact: 57,634,229 bytes,
SHA-256 4598891e99dbcf07cd252fdf72474042bdfb4ed97a3aad59bf15a312ad8b349b.
A fresh shared-storage upgrade check passed code 9 to code 10 with the same package, signer, and
ARM64 ABI.

Parent TV files and the provisioning tool retained the exact prior hashes, sizes, timestamps, and
inodes:

- private-media-tv-latest.apk: 57,030,122 bytes, SHA-256
  11bca1c3333cebcb5f08e10d5361b586cb7e7d8341b5aa0b4ff00908ba8f24aa;
- private-media-tv-previous.apk: 57,107,459 bytes, SHA-256
  48095b075917c756eece8689c3684780a083018e5c03bf0568ae1261aac18877; and
- telegram-provisioning-file.html: 6,066 bytes, SHA-256
  ff56a206d462c5f1f1a71644e04814564f47b1d801b58e4af1dab2245602f26f.

No TV exporter, TV CI downloader, TV installation, or Shield deployment ran.

## Physical status, limitations, and risks

adb devices -l listed no attached device. Therefore no code-10 installation, launch, update-state
preservation, source-management rendering, real selected-chat search, Israeli-row rendering, source
playback, warm replay, or Remove/re-add behavior is claimed.

Physical code-10 acceptance is pending. Automated coverage proves the crash invariant and repaired
Compose behavior, but it cannot substitute for the owner's real authenticated account, Telegram
chat list, device Bundle/lifecycle behavior, metadata network/cache state, or media match fixtures.

Known deliberate constraints and evidence boundaries:

- selection remains explicit and capped; oversized selected scope fails closed;
- only supported channels/groups participate, and inaccessible selected rows can remain visible but
  are not searched until eligible;
- searched-no-match is emitted only after real completed selected-source work;
- partial provider failure retains successful siblings and remains retryable where evidence is
  incomplete;
- TMDB origin IL is not equivalent to Hebrew language;
- stale Israeli rows follow the existing bounded metadata cache policy;
- protected-content rules remain fail-closed;
- GitHub's Node-runtime annotation is future maintenance, not a release failure; and
- F2C final TV UX and Shield deployment remain intentionally deferred.

No material F2B.2 architecture, search-semantics, persistence, destructive-behavior, or user-flow
ambiguity remains unresolved. The outstanding evidence is physical acceptance.

## Exact next milestone and continuation

The immediate next milestone is physical F2B.2 mobile code-10 acceptance using the ordered procedure
in docs/MOBILE_ACCEPTANCE.md:

1. install code 10 over code 9 without uninstalling or clearing data;
2. confirm Telegram remains connected and TMDB remains configured;
3. confirm ordinary Catalog rows plus both Israeli Movie/TV rows render;
4. open "המקורות שלי" and prove the physical crash is gone;
5. if empty, confirm the explicit Add Sources action;
6. add one known eligible source and confirm selected-only membership;
7. open a known TMDB movie/episode, explicitly start Sources, and confirm a real selected-source
   search occurs;
8. if a match exists, play it, exit, and replay the same source to retain the F2B.1 resolver
   regression;
9. remove the source and confirm future discovery no longer searches it, then re-add if desired;
   and
10. if no match exists, record only selected/query/completed/candidate/validated counts and the
    stable safe category.

Never publish source names, media titles/filenames, provider/chat/message/file IDs, credentials,
sessions, private screenshots, or raw failure material. Do not export, download, install, or deliver
the TV APK. Do not run Shield deployment.

After physical F2B.2 acceptance, the next development milestone remains F2C final TV catalog UX
under the approved TV-first D-pad contract. F2C was not started here.
