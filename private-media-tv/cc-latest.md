# Private Media TV — F2B.3 Handoff

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | `funzi7/private-media-tv` |
| Milestone | F2B.3 — complete source inventory, seamless catalog paging, local library, and recurring-news UX |
| Branch / tracking branch | `main` / `origin/main` |
| Starting application HEAD | `180b6054887e6e0a468134d138da62b874c543a2` |
| Final application HEAD | `de2d0b45102a58e5e9802caa6310d6432bbb85b1` |
| Manager-verified F2B.2 CI baseline | 31527095286 |
| Final exact-HEAD F2B.3 CI | 31547288691 — success |
| Agent-memory base before this handoff | `8009ea261d3be58423f93ebc5af4202863805ae4` |
| Mobile identity | `com.funzi7.privatemediatv.mobile`, `0.3.3-phone-test`, versionCode 11 |
| TV regression identity | `com.funzi7.privatemediatv`, `0.5.3-f2b3`, versionCode 16 |
| Development signer SHA-256 | `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` |

The application changes span 98 reviewed files. The milestone implementation commit was followed
only by scoped CI/publication corrections discovered from real post-push evidence. All commits were
pushed without force and the final application HEAD matches `origin/main`.

Only the exact-final-HEAD mobile artifact was published to shared storage. The TV APK was built and
verified as a regression artifact but was not exported, downloaded to shared storage, installed, or
deployed. No Shield command ran.

The agent-memory repository was fetched after application CI and delivery. Its newer clean HEAD
matched `origin/main`; that work was preserved and only this handoff was changed.

## Physical code-10 input

The owner physically installed mobile code 10 and established:

- Telegram and TMDB remained configured and the TMDB catalog worked;
- Israeli catalog rows were visible;
- the F2B.2 My Sources crash was repaired and source chats could be selected;
- most desired Telegram source chats were archived and appeared missing from source inventory;
- source lists needed display-name search and sorting;
- recent known recurring editions were not found and source search was too slow;
- Home used manual row-page actions that reset horizontal position;
- prominent full-catalog search, Favorites, and Want to Watch were needed;
- ordinary season navigation exposed inappropriate future placeholders for daily news programs;
- returning from an episode lost list position;
- episode artwork could remain a large empty block; and
- the top Back control was too close to system UI.

F2B.3 did not reset credentials, Telegram session/database, source selection, metadata/image cache,
source cache, TDLib bytes, playback resume, recurring state, or player preferences.

## Proven Archive inventory root cause and repair

Pinned TDLib `LoadChats` returns `Ok` while chat/list-position changes arrive asynchronously as
updates. The old adapter treated the callback as if the runtime `StateFlow` had already changed and
immediately took its inventory snapshot. A delayed Archive `UpdateNewChat` or
`UpdateChatPosition` could therefore arrive after the snapshot and be omitted from both source
management and selected-source discovery.

An executable delayed-update regression reproduced that race. The repair adds update-driven,
revision-observing Main/Archive loading with bounded rounds, per-list progress observation,
quiescence/settle boundaries, correct 404 list-end handling, timeout/failure containment, and one
stable deduplicated final snapshot. Short loads do not imply end, and no `GetChats` replacement or
history scan was introduced.

Provider-neutral source metadata now records `MAIN`, `ARCHIVE`, or `UNKNOWN`. Room schema v8 adds
this display metadata non-destructively. Moving a chat between Main and Archive updates metadata but
does not change opaque identity, selected membership, or source-scope revision. Selected archived
channels/groups remain in My Sources; eligible unselected archived rows remain in Add Sources. A
failed or incomplete live inventory refresh retains cached rows and never commits a partial list as
authoritative.

Both source screens open cached metadata immediately, refresh in the background, search locally by
Unicode display title, and sort deterministically ascending or descending by name. Filtering and
sorting never run Telegram message queries and never alter selected/active/type/list membership.
Cards may show Main/Archive locally, but raw Telegram IDs remain inside private provider/persistence
boundaries.

## Selected-source discovery performance and diagnostics

Telegram discovery remains explicit, bounded, and selected-source-only. It does not run from Home,
ordinary TMDB search, details, artwork, source-list search, or catalog pagination. It uses per-chat
`SearchChatMessages`; no global account search or history scan exists.

FAST discovery is staged:

1. strongest exact title/year, episode, learned recurring-template, or exact-date form first;
2. preferred/proven and remaining selected chats through a bounded worker pool;
3. secondary aliases/date forms only when earlier high-confidence stages have not validated; and
4. broader bounded pages/forms only under explicit Extended Search.

Each query/chat operation has a centralized bounded deadline. A slow or failed selected chat is a
retryable sibling failure and cannot erase a valid result from another source. Valid variants are
emitted and persisted progressively, so the UI can show “sources found — search continues” and
allow playback before the bounded request finishes. Later variants append with stable identity and
deterministic presentation order. Cancellation or partial work never becomes a completed negative
cache result.

Safe aggregate diagnostics distinguish PLAN, PROVIDER_SEARCH, PROVIDER_ZERO, CANDIDATE_MAPPING,
PARSER_REJECT, IDENTITY_REJECT, DATE_EPISODE_REJECT, VALIDATED, and COMPLETE. They contain only
elapsed time/counts, selected/query/completed-search counts, provider/candidate/reject/validated
counts, freshness, and stable failure category. They contain no query string, chat title/ID,
message/file ID, filename, caption, provider locator, exception, stack trace, or private timing per
source.

Recurring exact-date planning covers common padded/unpadded dot and hyphen forms with two- or
four-digit years. Learned templates are tried first. A bounded broad-title result is accepted only
when parsing proves the exact requested date and conservative identity. Typed parser, identity, and
date/episode rejection counts make physical misses diagnosable without private data.

## Automatic Home and search paging

Manual “next page” buttons were removed. Every horizontal Home row owns a stable provider-neutral
navigation key and `LazyListState`. Near-tail observation requests one page at a time, suppresses
duplicate recomposition requests, appends without replacing existing cards, deduplicates stable
media identities, retains exact index/offset, shows bounded tail loading, retries after isolated
failure, and stops at each branch's real end. Obsolete language/query work is cancelled.

The prominent Home search remains a global pageable TMDB movie/TV search plus cached local recurring
programs. The IL/US/GB passive-country policy does not restrict explicit search. Search never calls
Telegram and automatically appends near the end while retaining cards and position.

Executable Compose coverage exercises the real near-tail trigger, one active request, retry after
failure, append/dedup, exact horizontal restoration, and clean end-of-branch behavior.

## Catalog policy, sections, and provider rows

Passive Home discovery uses exactly the owner-approved origin-country allowlist `IL|US|GB`.
Explicit TMDB text search remains global. Country filtering is expressed through official Discover
queries and defensively checked in returned fixtures. A non-allowlisted fixture is excluded from
passive Home but remains searchable.

The metadata model separates logical sections from localized titles:

- `GENERAL`;
- `ISRAEL`;
- `ISRAELI_BROADCASTERS`;
- `STREAMING_PROVIDERS`; and
- `USER_LIBRARY`.

There are 32 first-class passive logical rows, each with Popular and New where required:

- General Movies Popular/New and General TV Popular/New, scoped to IL/US/GB;
- Israeli Movies Popular/New and Israeli TV Popular/New, scoped to TMDB origin country IL;
- Popular/New for כאן 11, קשת 12, רשת 13, HOT, and yes; and
- Popular/New for exactly Netflix, Amazon, Disney+, Apple TV+, Max/HBO, Paramount+, and Hulu.

Channel 14, 15, 16, and Educational TV are intentionally not configured. No eighth streaming
provider is enabled.

Provider/network and watch-provider identities were resolved against current official TMDB
provider/network metadata and centralized in a declarative provider registry, not UI code. Precision
rules prevent Apple TV+ from being conflated with Apple/iTunes, Max from an unrelated similarly
named network, Paramount+ from unrelated Paramount/Showtime entities, and Amazon provider variants
from being treated as interchangeable without evidence.

Each streaming row is a deterministic US-origin union of reliable original/network provenance and
current US watch-provider availability. Internal provenance remains `ORIGINAL`, `AVAILABLE`, or
`BOTH`; the user sees one Popular and one New row per service. Branch cursors advance independently,
merge by popularity or actual release/first-air date with stable tie-breakers, deduplicate by TMDB
media identity, avoid starvation, isolate branch/provider failures, and retain valid stale data.
Movie original provenance is not fabricated where TMDB exposes no reliable official relationship.

New rows use actual movie release or TV first-air date descending with an injected date policy;
future items are not presented as already released. Cache identity includes section/category,
media type, origin policy, network/watch provider, watch region, provenance branch, sort mode, and
branch page/cursor, preventing row collisions and unrelated invalidation.

Movie/series details keep original network/platform provenance separate from US watch availability.
Provider logos use only official TMDB image metadata with text fallback. US regional availability
is labelled as such, and “Powered by JustWatch” appears whenever watch-provider availability is
displayed. Missing data never fabricates a provider. Availability follows the existing private
metadata cache and stale-while-revalidate policy and refreshes an already-open details screen.

## Local library, feedback, and watched state

An app-private Room `UserStateDatabase` stores provider-neutral identity state independently of
TMDB account authentication:

- Favorite;
- Want to Watch;
- top-level Not Interested;
- watched TMDB episodes; and
- watched local recurring editions.

Favorite, Want to Watch, and Not Interested are independent booleans. The same TMDB identity from
general/provider rows has one shared state. Local Favorites and Want to Watch Home rows render
cached metadata/program data and survive restart, process death, metadata refresh, and APK update.

Not Interested removes top-level movies/series/local programs from passive Home rows, but keeps them
in explicit global search and preserves metadata, cache, resume, Favorite, and Want to Watch. A
management list supports reversible undo.

Episodes and recurring editions support manual watched/unwatched. Season bulk-watch marks only
currently known already-aired episodes; future or later-discovered episodes remain unwatched.
Season progress is derived. Existing completion policy is reused: completion at or below 30 seconds
remaining, the tested 90% fallback when duration/final-segment evidence is unreliable, no opening-
without-playback completion, completion surviving a later backward seek, and no movie inheritance.
The production player forwards actual-playback evidence before automatic watch marking.

Full application reset closes and reopens the user-state database and rebinds all three library
observers without requiring ViewModel/process recreation. Ordinary app update/reset preservation
boundaries remain unchanged.

## Recurring-news presentation

Core metadata adds `STANDARD_EPISODIC` and `RECURRING_DATED`. High-confidence automatic recurring
classification uses canonical TMDB news genre identity, never localized title text or episode count.
A persisted owner override can force either mode and wins over automatic classification.

Recurring mode presents “Editions” instead of a seasons-first UX. A bounded multi-season projection
uses an injected Clock/ZoneId, excludes future dates, aggregates real non-future TMDB evidence, and
orders newest first. Source-backed editions from explicit selected-source lookup merge under the
same deterministic TMDB-series/local-program association; duplicate top-level local cards are
hidden. Same-date variants group only when no meaningful marker proves separate early/main/late
broadcasts. Cadence/templates optimize search but never fabricate an edition or playback source.

TMDB recurring details expose explicit Search/Refresh Editions, hydrate watched state, use exact
date-aware source requests and cache-plan identity, and retain learned templates. Local recurring
service/correction paths reject future-as-aired evidence. Standard scripted series retain ordinary
season order and existing future-episode behavior.

## Navigation, insets, and artwork

A provider-neutral route/back-stack and scroll-memory model restores the previous meaningful
index/offset for Home vertical state, every Home row, search, My Sources, Add Sources, Favorites,
Want to Watch, Not Interested, series/details, season episodes, recurring editions, and Sources.
Stable keys contain no Telegram IDs and are reusable for future TV focus restoration. Parent lists
are not reconstructed at item zero on normal Back.

Phone top bars use supported safe/status-bar/display-cutout insets and normal touch sizing without a
device-specific spacer or double padding.

Episode artwork falls back in order: exact TMDB still, already-known app-private Telegram inline
minithumbnail for the exact selected/supported source, TMDB series backdrop, poster, then a compact
neutral placeholder. Remote image failure advances the chain. No Telegram search, full-video frame
extraction, path exposure, or thumbnail download is triggered for artwork. Private thumbnail bytes
are bounded, app-private, absent from logs/public diagnostics/APKs/CI/handoff, and protected content
fails closed.

## Compatibility and security

Mobile code 11 updates code 10, and TV code 16 is a regression-only update over code 15. Package
IDs, signer, Keystore aliases, TDLib paths, ARM64 ABI, schema/state identities, and app-private
storage are preserved. Room migrations are additive: catalog schema v8 plus user-state schema v1.

The release preserves Telegram/TMDB credentials and authenticated session, source membership,
metadata/image/source/recurring caches, TDLib bytes, resume, warm/local resolver behavior, cache
ledger, and player preferences. It adds no uninstall, downgrade, clear-data, database fallback,
Firebase, analytics, crash reporting, ad SDK, WebView YouTube UI, history scan, F2C TV redesign, or
Shield deployment.

Raw TDLib types remain inside `core-telegram`. Core metadata/catalog/model and UI remain
provider-neutral. No credential, phone number, session/database, private source/media identity,
caption/filename, token, QR data, private URL, screenshot, or packaged private database appears in
fixtures, public diagnostics, APKs, or this handoff.

## Principal modules and files

The application diff contains 14,710 insertions and 790 deletions across 98 files:

- `core-telegram`: revision-driven Main/Archive loader, list membership, staged progressive selected-
  chat discovery, deadlines, typed aggregate diagnostics, private thumbnail extraction, and tests;
- `core-catalog`: schema v8, user-state database/store, source/recurring discovery semantics,
  future/date policies, private thumbnail cache boundary, and tests;
- `core-metadata`: country/provider/broadcaster registry, 32 logical rows, branch union paging,
  presentation mode, provider availability/provenance/logos/attribution, and tests;
- `core-model`: provider-neutral navigation memory and tests;
- `app-mobile`: automatic paging, global search, library/feedback/watch UX, recurring-series bridge,
  provider details, source UX, insets/artwork/navigation, code 11, and Compose/ViewModel/data tests;
- `app-tv`: code 16 regression identity only;
- publication/upgrade/downloader scripts and Android CI; and
- README, TODO, CHANGELOG, permanent product/architecture/data/security/Telegram/TMDB/UX/test/
  release/distribution/acceptance documents plus ADR 0015.

The future YouTube roadmap was corrected only in documentation. YouTube is deferred until after
F2B.3 physical acceptance and targets a separately audited isolated unofficial/private
`core-youtube` boundary feeding the existing native Media3 stack—not IFrame, WebView, Play Services,
Firebase, analytics, or official player UI. SmartTube/current ecosystem source, license, dependency,
and submodule audit is mandatory before reuse. Account and incognito modes, authoritative local
history, SponsorBlock, DeArrow, conservative source matching, and Y1–Y4 are future work; no YouTube
code or version was added here.

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

Aggregate result: 1,011/1,011 JUnit tests, zero failures/errors/skips.

| Module | Tests |
| --- | ---: |
| app-mobile | 225 |
| app-tv | 74 |
| core-catalog | 189 |
| core-metadata | 61 |
| core-model | 19 |
| core-playback | 85 |
| core-provider | 27 |
| core-provisioning | 48 |
| core-security | 98 |
| core-telegram | 185 |
| Total | 1,011 |

Focused behavior includes delayed Archive updates and list movement, selected archived-source
search, staged/progressive discovery and reject counts, exact recurring dates, source sort/search,
Compose automatic paging/position/end behavior, global search paging, local library/feedback/watch,
season completion boundaries, universal Back restoration, recurring newest-real/nonfuture rules,
artwork fallback/no-provider work, exact catalog/provider registry and branch failure isolation,
provider-detail labels/logos/JustWatch, migrations, and code 10→11/code 15→16 compatibility.

Retained executable harnesses passed: credential/private-material scans, WebCrypto/Kotlin
interoperability, provisioning inspection, native layout/16-KiB alignment, signing/package/JNI,
upgrade, TV/mobile publication, exact-head downloader rejection/success, and shell syntax. The final
mobile publication harness has 12 cases including code 10→11 rotation.

Official TDLib 1.8.66 at pinned source commit
`022d60202e446ad1287b9fb68e687c8a0760788b` was verified only; no native rebuild occurred. Local
packaged JNI SHA-256 was
`21d59ebfeba4edc62ea74cefaa79b08650e796530f3d5e57804105cc44cb65dc`; the separately retained CI
lineage packaged JNI is
`790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f`. Both retain ARM64 only, NDK
r28c, expected JNI/AAR/JAR identities, 16-KiB packaging, and the Development signer.

Local inspected candidates:

| Candidate | Size | SHA-256 |
| --- | ---: | --- |
| Mobile code 11 | 58,798,473 bytes | `8fc1a69ef8b10d0fcd135f213dcbda9e985e7a4a2cdd0acdf4b9daed0bd5de61` |
| TV code 16 regression | 58,938,779 bytes | `f832809fbba230b516e5827c875fc9ab4d96747807aace898a31b972563228d4` |

No attached ADB device was present. Therefore no installation, launch, authenticated code-11 flow,
or physical playback result is claimed.

## Commit and CI history

| Application HEAD | Purpose | CI evidence |
| --- | --- | --- |
| `c0d29363f7e107b7baaf48e3533ed1071f1bec43` | F2B.3 implementation | run 31544780141 failed only at stale F2B.2 workflow version assertions after tests/lint/build/native gates passed |
| `58e454ca47e7771f0ad51ff1b2e6bb395efcec45` | update F2B.3 CI version assertions | run 31545774965 passed and uploaded both artifacts |
| `200745e4289f07047897a52b03fc5db4c3bd9887` | allow verified code-10 mobile predecessor rotation | run 31547004831 failed before tests because a runner toolchain-context change missed the existing verify-only TDLib cache |
| `de2d0b45102a58e5e9802caa6310d6432bbb85b1` | stable build-input-first TDLib cache restoration | run 31547288691 passed fully without rebuilding TDLib |

The final workflow cache identity keeps pinned native build inputs ahead of volatile host-toolchain
context and uses a one-time legacy-prefix fallback. The restored artifact is still required to pass
both native verification scripts before tests or assembly; the workflow never invokes a TDLib
build.

Final exact-HEAD CI:

| Field | Value |
| --- | --- |
| Run | 31547288691 |
| URL | https://github.com/funzi7/private-media-tv/actions/runs/31547288691 |
| Branch / HEAD | `main` / `de2d0b45102a58e5e9802caa6310d6432bbb85b1` |
| Time | 2026-08-11T23:39:12Z through 2026-08-11T23:52:40Z |
| Conclusion | success |
| Wrapper job | 93962396300 — success |
| Android job | 93962421204 — success |
| Mobile artifact | ID 9123219784, 57,979,591-byte archive, digest `sha256:762e7543b485aa192c9a7feaeb097a31dda3d69e48a39a07c177cb447f0caf9e` |
| TV artifact | ID 9123219202, 58,379,080-byte archive, digest `sha256:4d591b89eb5510db27d4f2b42122282ed9b4d86a1ed56bf1526d39584fd6963d` |

The run passed wrapper validation, exact pinned-TDLib verification, publication/downloader/security
harnesses, signer reconstruction, all tests, focused F2B.3 tests, lint, signed ARM64 TV/mobile
assembly, package/version/signer/JNI/private-content verification, checksums, and both uploads.

GitHub emitted one non-failing maintenance annotation: SHA-pinned actions whose bundled runtime
targets Node 20 were forced onto Node 24. It did not affect the successful release.

## Exact-head mobile-only delivery

After final CI passed, this command selected and published only the exact-final-HEAD mobile artifact:

    ./scripts/download-latest-ci-mobile-apk-to-phone.sh

| Field | Final mobile APK |
| --- | --- |
| Canonical path | `/storage/emulated/0/Download/PrivateMediaTV/Mobile/private-media-tv-mobile-latest.apk` |
| Package/version | `com.funzi7.privatemediatv.mobile`, `0.3.3-phone-test`, versionCode 11 |
| Size | 57,978,516 bytes |
| APK SHA-256 | `feb793116dd11c92be7d5fb313efda5086a7721054f6dbad8ffe40309c00ce7a` |
| Fresh timestamp | 2026-08-11 23:56:42.194885556 +0000 |
| Epoch | 1786492602 |
| Signer SHA-256 | `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` |
| ABI / JNI | ARM64 only / `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f` |

The canonical APK is a regular copied file, not a symlink. A fresh independent verifier passed
package/version/code, signer, ARM64/JNI/native layout, credential/database/private-content scans,
hash, and timestamp. The previous slot now contains the verified exact code-10 APK: 57,650,840
bytes, SHA-256
`306805992205653999614b01366627b3f3aa2f1a3392dbdd3663a1bc99c06040`. A fresh shared-storage
upgrade check passed code 10→11 with the same package, signer, ARM64 ABI, and update-preserving
policy; no uninstall, downgrade, or clear-data operation exists.

The parent TV latest/previous files and provisioning HTML retained their pre-delivery sizes and
timestamps. No TV exporter/downloader, TV installation, or Shield deployment ran.

## Pending physical acceptance, limits, and next step

`adb devices -l` listed no attached device. Physical code-11 acceptance is therefore pending. The
automated regressions prove the repaired invariants but do not replace the owner's authenticated
Telegram account, archived chat inventory, real TMDB/provider data, source captions, playback, or
phone navigation state.

The immediate next step is the ordered code-11 procedure in `docs/MOBILE_ACCEPTANCE.md`:

1. install code 11 over code 10 without uninstalling or clearing data;
2. confirm Telegram/TMDB and all retained state remain configured;
3. verify archived source inventory, local name search/sort, selection survival across Main/Archive
   movement, and selected archived-source search;
4. repeat a known recent-edition search and record only safe stage/count diagnostics;
5. verify progressive first results and exact-date recurring matching when evidence exists;
6. trigger automatic Home and global-search pagination and prove no position jump;
7. exercise Favorites, Want to Watch, Not Interested/undo, manual episode watch, season bulk-watch,
   and persistence;
8. verify Back restores exact positions across Home/search/source/library/season/recurring flows;
9. verify safe top insets and artwork fallback;
10. inspect provider provenance separately from US availability and JustWatch attribution;
11. open a news/current-affairs program and verify Editions-first, newest-real/nonfuture behavior;
12. play and replay a valid selected source when available, retaining F2B.2/F2B.1 resolver behavior.

Never publish source names, captions, filenames, chat/message/file IDs, credentials, sessions,
private screenshots, query strings, or raw exceptions. Do not deliver the TV APK, begin F2C final TV
design, deploy Shield, rebuild TDLib, or implement YouTube before code-11 physical acceptance.

After F2B.3 physical acceptance, the next product milestone should be chosen from the retained
roadmap: F2C final TV catalog UX remains deferred, and YouTube begins only with the dedicated Y1
technical/license/security audit and isolated anonymous proof—no version is assigned yet.
