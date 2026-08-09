# Private Media TV — F2A Handoff

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | `funzi7/private-media-tv` |
| Milestone | F2A — persistent account-scoped local Telegram catalog and source-variant identity |
| Branch / tracking branch | `main` / `origin/main` |
| Starting application HEAD | `cd0865762d3db304d265a0972a4c40731e9e4d56` |
| Final application HEAD | `605c053390bf7252eebfc90af5bf72cc47e4bb39` |
| Agent-memory base before this handoff | `b869c405a259f593db8d14c67534d8981ff80544` |
| Mobile identity | `com.funzi7.privatemediatv.mobile`, `0.2.0-phone-test`, `versionCode` 7 |
| TV identity | `com.funzi7.privatemediatv`, `0.4.0-f2a`, `versionCode` 12 |
| Development signer SHA-256 | `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` |

The application milestone commit was pushed without rewriting history. Application `HEAD` and
`origin/main` both resolve to the final application SHA above. The exact-final-HEAD Android CI run
succeeded, and its mobile artifact was downloaded, independently reverified, and published only to
the package-specific Mobile directory. The TV APK was built and inspected locally and in CI but was
not exported, downloaded to shared storage, installed, or deployed.

The agent-memory worktree initially opened clean at
`a6492d54c337b3f6ccbc29edb73f7bad7bc429f8`. A fresh pre-handoff fetch found one newer unrelated
remote commit, so it was preserved with `git pull --ff-only`; this handoff is based on the actual
current parent recorded above.

## Authoritative physical code-6 baseline

The owner physically installed and tested mobile code 6. Credentials and the authenticated
Telegram session survived the update, real Telegram playback remained functional, TDLib-owned byte
cache was reused, leaving playback and reopening the same media returned to the saved position, and
immediate re-entry reused the warm session and resumed without buffering.

Those observations close only the physical warm-session and immediate-resume baseline. Full
track/control/cache-management acceptance was not explicitly reported and is not claimed. Physical
mobile code-7 catalog acceptance remains pending. No Shield result is claimed.

## Outcome

F2A adds the first permanent app-private catalog for media discovered in explicitly selected
Telegram broadcast channels. It provides account isolation, a default-empty channel allowlist,
resumable bounded history scanning, persistent checkpoints, bounded reconnect catch-up, live
new/edit/delete ingestion, deterministic provisional classification and grouping, source variants,
local search/filtering, reversible manual correction, cache/availability projection, and playback
through the existing production Telegram/Media3 pipeline.

One coherent module, `core-catalog`, was added. It owns provider-neutral catalog contracts, parser
and grouping rules, scan orchestration, Room persistence, migrations, and catalog-domain tests. It
does not depend on raw TDLib classes. `core-telegram` owns the Telegram adapter, discovery, history,
live-update mapping, durable locator handling, current-message playback resolution, and exact TDLib
cache control. `app-mobile` owns the touch diagnostic UI. `app-tv` compiles the shared production
catalog boundary only; the final F2C TV catalog design was not implemented.

## Catalog persistence and account scope

The app-private Room database is schema version 2 and uses WAL, foreign keys, deterministic schema,
explicit indexes, bounded transactions, and no destructive migration fallback. Its persisted
domains are:

- opaque account scope;
- discovered channel settings and enabled state;
- per-channel scan mode, state, counters, cursor, newest-known cursor, and reconcile generation;
- provisional catalog items;
- exact source variants; and
- versioned reversible source-scoped manual overrides.

Composite account/key relationships enforce account scope at relational boundaries. The migration
from schema 1 to 2 preserves valid rows and drops only malformed cross-account links from a
foreign-key-disabled legacy fixture. Account-scoped query tests, foreign-key tests, migration row
preservation, WAL behavior, and malformed-record isolation passed. The database is process-owned
and remains independent of TDLib media-byte eviction. No database or catalog content is packaged in
either APK.

After authorization reaches Ready, `core-telegram` obtains the active account through the pinned
official API and derives an install-private opaque scope using a non-exportable Android Keystore
HMAC identity. Raw account identity remains inside package-private implementation. If the active
scope differs from the catalog scope, the app fails closed with a safe conflict: it neither merges
nor automatically deletes either catalog. Explicit activation or confirmed old-catalog clearing is
required.

## Channel allowlist and removal

Channel discovery persists supported, protected, and inaccessible projections without enabling any
channel automatically. Users may enable or disable individual supported channels, select all, or
deselect all. Only enabled supported channels are eligible for scan and live ingestion. Enabled
state survives restart and APK update.

Disabling a channel stops ingestion immediately and safely pauses any in-flight checkpoint without
deleting existing variants. Confirmed indexed-channel removal first disables ingestion, removes
only that channel's variants transactionally, cleans empty items without affecting other variants
or surviving manual state, and never deletes Telegram messages.

F2A has no safe provider-owned channel-batch cache-clear operation. If cache cleanup is requested
during channel removal, catalog metadata removal still commits, TDLib bytes are retained, and the
UI reports the limitation safely. Existing exact-variant pin/unpin/clear remains available only
through the resolved production cache manager; raw filesystem deletion is never used.

## Source and provisional-item identity

Durable source identity is the opaque combination of account scope, channel, message, and
attachment slot/type. A current TDLib file operation identity is refreshable operational state and
is never the permanent catalog key. Private remote unique-file evidence can detect duplicate
physical media, but it never replaces message-source identity or leaks through presentation.

Message edits update the exact source row. Attachment replacement updates its generation and
classification without aliasing old warm/resume state. Provider revision and observation priority
prevent stale history, live, and playback-resolution races from overwriting newer content.
Duplicate updates are idempotent, while duplicate or forwarded physical media remains represented
by distinct source variants.

Provisional item identity is explicitly identity-versioned and deterministic; parser version is
stored separately so future reclassification is intentional:

- `MOVIE_CANDIDATE`: normalized title and optional explicit year;
- `SERIES_EPISODE_CANDIDATE`: normalized series title, explicit season, explicit episode, and
  optional year; or
- `UNCLASSIFIED` for ambiguous, conflicting, or low-confidence metadata.

Only exact high-confidence identity fields group variants across channels. Fuzzy title similarity
is never used, and missing season or episode numbers are never invented. Empty provisional items
are cleaned only after their last source disappears and no surviving manual state requires them.

## Parser, search, and manual correction

Parser version 1 consumes only app-private Telegram filename/caption metadata. It applies Unicode
normalization and locale-independent casing, handles common movie/year and explicit episode
patterns, common separators, repeated release tokens, and mixed Hebrew/English text, and leaves
ambiguous input unclassified.

Identity-bearing title/year/season/episode is separate from claimed release tags. Claimed
resolution, container, source type, HDR/DV, codec, and language remain explicitly unverified.
Actual size, duration, width, height, MIME/container when known, and cache state come from
Telegram/Media3 facts and are never inferred from a filename or file size.

Account-scoped local search covers normalized provisional title, normalized on-device display
title, optional year, and episode context. It is bounded, deterministic, debounced at 300 ms, and
does not query Telegram or the internet per keystroke. Browse screens also support type/channel
filters, newest-first ordering, and title ordering, including visible-title ordering for
unclassified items.

Manual correction can mark an exact source unclassified, edit title/year, set a movie candidate,
set an explicit series/season/episode candidate, and remove the override to return to automatic
classification. The versioned override survives rescans and message edits until reversed or until
its exact source disappears. It does not create a TMDB identity and is never silently overwritten
by the automatic parser.

## Scanning, checkpoints, and live updates

Initial scanning is explicitly user-started, newest-to-oldest, and bounded to 40 messages per page.
Each page, source upsert batch, grouping update, counters, and next checkpoint commits atomically.
Progress includes enabled not-yet-started channels as well as running, paused, cancelled,
retryable, fatal, and completed channels.

Pause, resume, cancel, retry, and reconcile are exact, account-scoped operations. Initial resume
continues paused/cancelled work and remaining not-yet-started sibling channels. Cancellation joins
the exact scan before persisting terminal state, avoiding cancel/resume races. Process death changes
stale running checkpoints to paused on next open; committed data and cursor remain resumable. The
scan does not continue invisibly after process death and no perpetual background service was added.

Each channel isolates adapter, begin, page-load, commit, and fatal/retryable failure. One failed
channel does not abort later channels. Reconcile uses a generation so retry/restart remains
idempotent and stale variants are pruned only after a completed pass. Successful discovery marks
channels absent from the full bounded result inaccessible and disables them without deleting their
catalog variants.

Live subscription starts before bounded catch-up so there is no reconnect gap. New messages,
edits, attachment replacement, permanent deletion, and file/cache-state changes are applied
idempotently only for currently enabled channels. A single persistence failure does not terminate
later live ingestion. Three bounded recent catch-up pages update the newest-known cursor without
mutating a completed initial-history checkpoint on failure. Deep missed historical edits require
explicit reconcile.

## Playback and cache independence

Selecting a catalog variant never trusts a stale TDLib file identity. Playback uses the durable
message source to fetch the current message, confirms that the exact attachment remains playable,
refreshes operational metadata, and passes a provider-neutral range source through the existing
warm/cache/resume/player route. Account scope is rechecked before playback. If the source is absent
or replaced incompatibly, only that variant becomes unavailable and the details screen remains
open for another variant.

Warm/resume identity combines the durable source with attachment-generation evidence, while the
cache controller remains tied to the exact current TDLib file operation. A file-ID refresh for the
same attachment preserves warm/resume identity; an attachment replacement invalidates it when
generation evidence changes. Existing persistent TDLib bytes, adaptive range streaming, resume
positions, controls, LTR timeline, track preferences, and Media3 behavior are reused unchanged.

Catalog metadata and source membership survive transitions among `REMOTE`, `PARTIAL`, `COMPLETE`,
and `UNAVAILABLE` and survive TDLib byte eviction. Catalog identity is not itself a cache pin. No
TDLib file is moved or renamed, and no second media-byte cache was introduced.

## Mobile diagnostic UI and TV boundary

Mobile adds the touch-first **קטלוג מקומי** action and diagnostic routes for overview, sources,
scan progress, movies, series, unclassified items, search, item details, source variants, playback,
and manual correction. Overview and progress expose only safe counts and status. UI capabilities
use process-local opaque tokens; public state, errors, logs, tests, and accessibility semantics do
not expose provider identifiers.

TV advances only because the catalog model and Telegram adapter are shared production code. The TV
package, shared database/query compilation, and existing player route were regression-built and
tested. No final TV Home, artwork, horizontal catalog rows, details design, TMDB data, TV export,
installation, or delivery was added.

## Security and upgrade preservation

- TDLib Java/JNI types remain confined to `core-telegram`; `core-catalog`, UI, `core-model`,
  `core-provider`, and `core-playback` remain provider-neutral. `core-security` remains independent
  of TDLib.
- Entity and public-model `toString()` output is redacted. Logs, exceptions, UI state, tests, CI,
  artifacts, and this public handoff contain no private or real account/channel/message/file
  identity, media title, filename, provider path, database row, private screenshot, credential,
  key, QR, or session data. Test-only locators and metadata are synthetic.
- Mobile code 7 preserves the package and signer used by code 6, credential vault, database-key
  material, authenticated TDLib database/session, complete and partial byte cache, cache ledger,
  playback resume records, warm/player preferences where process state permits, and unrelated
  settings. No version-triggered deletion was added.
- TV code 12 preserves code-11 package/signing/update identity. It was validation-only and was not
  delivered.
- Backup remains disabled. The new catalog starts empty and adopts metadata only through explicit
  source selection and scanning.
- Neither APK contains credentials, keys, `.pmtprov`, Telegram session/database material, catalog
  database/content, private media, private captures, or signing secrets.

## Native artifact evidence

No TDLib native build occurred. Both mandatory verification-only commands passed locally, and the
exact-HEAD CI run restored and verified its pre-existing official cache without rebuilding.

| Native property | Observed value |
| --- | --- |
| Official TDLib version | 1.8.66 |
| Official source commit | `022d60202e446ad1287b9fb68e687c8a0760788b` |
| ABI | `arm64-v8a` only |
| NDK | r28c |
| Local AAR SHA-256 | `025313d2a7cdbf148e5c700e8ef6c9d384f2301aff043c844997e0c23eb9abd2` |
| Local Java JAR SHA-256 | `e39bb497b7eea1f33d7d3b5816591b7656259df29e0231c10287e514e3951a04` |
| Local packaged JNI SHA-256 | `21d59ebfeba4edc62ea74cefaa79b08650e796530f3d5e57804105cc44cb65dc` |
| CI packaged JNI SHA-256 | `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f` |
| Layout | ARM64 DYN, NDK r28c, every `LOAD` alignment at least `0x4000`, stored and 16,384-byte APK aligned, expected system dependencies only |

The local and CI JNI hashes are the two pre-existing, separately verified cache lineages for the
same pinned official source/build identity. F2A changed neither lineage, source pin, native input,
ABI, NDK, AAR/JAR identity, nor packaging policy.

## Local validation

Both TDLib verification-only commands, Gradle 9.5/JDK 21 discovery, every focused module task,
aggregate tests, aggregate lint, and both signed debug assemblies passed. Generated JUnit XML
records 617 tests with zero failures, errors, or skips:

| Module | Tests |
| --- | ---: |
| `app-mobile` | 71 |
| `app-tv` | 74 |
| `core-catalog` | 71 |
| `core-model` | 15 |
| `core-playback` | 78 |
| `core-provider` | 27 |
| `core-provisioning` | 48 |
| `core-security` | 96 |
| `core-telegram` | 137 |
| **Total** | **617** |

All 513 tests present at the start remain within the 617-test result. New behavior coverage includes
account reopen/conflict/isolation/clear, channel selection/default-empty/disabled updates/removal,
schema/migration/WAL/foreign keys/corrupt-link isolation, source idempotency/revision/edit/
replacement/deletion/duplicate evidence, conservative parser fixtures, scan batching/checkpoint/
pause/resume/cancel/restart/retry/end/failure/reconcile races, live/catch-up isolation, exact
grouping and no fuzzy merge, manual correction/reversal, local search/sorting, playback
re-resolution/stale file identity/unavailable alternate, cache-state independence, redaction, and
mobile/TV upgrade compatibility.

Additional executable validation passed:

- browser WebCrypto, production-Kotlin interoperability, provisioning HTML, self-test, and negative
  checks;
- provisioning inspector: 4 cases;
- APK upgrade harness: 13 cases;
- TV publication harness: 9 cases;
- mobile publication harness: 10 cases;
- TV exact-HEAD downloader rejection harness: 8 cases;
- mobile downloader harness: 20 rejection cases and 1 success case;
- deterministic native-layout, APK identity, signer, JNI, and prohibited-content verification;
- shell syntax checks;
- real retained mobile code 6→7 update verification; and
- real retained TV code 11→12 update verification.

The TV code-11 input was artifact `8907120083` from successful starting-HEAD Android CI run
`30945616102`, with APK SHA-256
`c0579ae0385c7b2fe69b70ea1fd54194990f9d2ba3c2343ffd2877a10cec18d1`. This is real update-pair
evidence, not exact-final-HEAD CI evidence.

The final locally assembled artifacts were:

| Candidate | Size | SHA-256 | Modification time |
| --- | ---: | --- | --- |
| Mobile code 7 | 57,086,527 bytes | `b4c3cbf13ee97b1566c6e0ae329f88e0a7818064f5a53cdd94933f03b584b410` | `2026-08-09 06:08:32.166529396 +0000` |
| TV code 12 | 57,996,245 bytes | `80dd36cf8e36dcb966d5a55242422fe0220ae2a25e6b2f92ccf001bf5a31543f` | `2026-08-09 06:08:32.094529396 +0000` |

Both passed package/version/code, Development signer, ARM64-only, local JNI, 16 KiB native layout,
and forbidden-content inspection. The TV exporter, TV CI downloader, installer, and Shield deployer
were not run.

`adb devices -l` listed no attached device. Therefore no code-7 installation, launch, catalog
behavior, update preservation, Telegram action, or Shield result is inferred from local or CI
validation.

### Commands actually run

The observed command set included all mandatory application and agent-memory preflights and these
milestone checks:

```bash
./scripts/bootstrap-tdlib-android.sh --verify-only
./scripts/verify-tdlib-artifact.sh
./gradlew --version
./gradlew projects
./gradlew test
./gradlew lint
./gradlew :app-mobile:assembleDebug
./gradlew :app-tv:assembleDebug
./gradlew :app-mobile:testDebugUnitTest
./gradlew :app-tv:testDebugUnitTest
./gradlew :core-catalog:testDebugUnitTest
./gradlew :core-model:test
./gradlew :core-provider:test
./gradlew :core-playback:testDebugUnitTest
./gradlew :core-telegram:testDebugUnitTest
./gradlew :core-security:testDebugUnitTest
./gradlew :core-provisioning:testDebugUnitTest
node tools/verify-lan-crypto-fallback.mjs
node tools/verify-provisioning-html.mjs
node tools/verify-pmtprov-interop.mjs self-test
./scripts/test-inspect-pmtprov.sh
./scripts/test-verify-upgrade-apks.sh
./scripts/test-apk-phone-delivery.sh
./scripts/test-mobile-apk-phone-delivery.sh
./scripts/test-download-latest-ci-apk-rejections.sh
./scripts/test-download-latest-ci-mobile-apk-rejections.sh
bash -n scripts/*.sh
bash -n scripts/lib/*.sh
./scripts/export-latest-mobile-apk-to-phone.sh
./scripts/download-latest-ci-mobile-apk-to-phone.sh
adb devices -l
git diff --check
```

## Local mobile-only delivery

Before the application push, the local mobile exporter published the verified local code-7 APK to
the Mobile directory at 57,086,527 bytes, SHA-256
`b4c3cbf13ee97b1566c6e0ae329f88e0a7818064f5a53cdd94933f03b584b410`, modification
`2026-08-09 06:11:56.482529318 +0000`. The verified code-6 APK remained the distinct `previous`.

Parent TV `latest`, `previous`, and the provisioning tool retained their exact hashes, sizes,
timestamps, and inodes. No TV exporter or deployment ran. Shared-storage file delivery is not
installation, launch, update, or physical acceptance evidence.

## Exact-final-HEAD Android CI

| Field | Value |
| --- | --- |
| Run | `31298739489` |
| URL | `https://github.com/funzi7/private-media-tv/actions/runs/31298739489` |
| Event / branch | `push` / `main` |
| Commit | `605c053390bf7252eebfc90af5bf72cc47e4bb39` |
| Conclusion | success |
| Wrapper job | `93207982963` — success |
| Android build job | `93207997312` — success in 12 minutes 2 seconds |
| Mobile artifact | `private-media-tv-mobile-apk-605c053390bf7252eebfc90af5bf72cc47e4bb39` (artifact `9033949499`, 56,896,055-byte archive, unexpired) |
| TV artifact | `private-media-tv-apk-605c053390bf7252eebfc90af5bf72cc47e4bb39` (artifact `9033949267`, 57,805,639-byte archive, unexpired) |

The exact-HEAD run passed wrapper validation, pinned official-TDLib cache verification without a
native rebuild, downloader rejection tests, browser crypto fallback, Development signer
reconstruction/verification, aggregate and focused F2A tests, lint, signed ARM64 TV/mobile
assembly, package/version/signer/JNI/content inspection, metadata/checksum generation, and both
artifact uploads. GitHub emitted only a non-failing Node.js action-runtime deprecation annotation;
the run conclusion remained success and no F2A check failed.

## Final CI mobile-only delivery

After CI succeeded, `./scripts/download-latest-ci-mobile-apk-to-phone.sh` selected only the exact-
HEAD push artifact, verified its three-file shape, metadata, checksum, package, version, signer,
ABI, JNI, native layout, and prohibited-content boundary, and published it through the Mobile-only
rotation path. The distinct verified code-6 APK remains `previous`.

| Field | Final CI mobile APK |
| --- | --- |
| Canonical path | `/storage/emulated/0/Download/PrivateMediaTV/Mobile/private-media-tv-mobile-latest.apk` |
| Package/version | `com.funzi7.privatemediatv.mobile`, `0.2.0-phone-test` (`versionCode` 7) |
| Size | 56,894,981 bytes |
| APK SHA-256 | `1e5a7448d5f5b7a00a7777fc06228fbdf7a4d8625dee390351c7a815215d8729` |
| Fresh modification timestamp | `2026-08-09 06:38:10.702528717 +0000` |
| Modification epoch | `1786257490` |
| Development signer SHA-256 | `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` |
| ABI | ARM64 only |
| Packaged JNI SHA-256 | `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f` |
| Native layout | NDK r28c, ARM64 DYN, `LOAD` 0x4000, stored and 16,384-byte aligned, expected dependencies only |

The final APK is a real copied file, not a symlink. The verified code-6 `previous` is 56,251,476
bytes with SHA-256 `17c2d7f970ec260a7a9c47426ea8464da1fda53aa3a5ac2ca8a2fd969a25e542`.
Parent TV `latest`, `previous`, and the provisioning tool retained their exact pre-publication
hashes, sizes, timestamps, and inodes. No TV export, CI TV download, installation, launch, or
deployment occurred.

## Limitations and deferred work

- Physical code-7 catalog acceptance remains pending: update over code 6, retained Telegram/cache/
  resume behavior, default-empty selection, three committed pages, pause/force-stop/reopen/resume,
  duplicate resistance, browsing/search, grouped variants, alternate playback, manual correction,
  and disabled-source live-ingestion checks are not yet physically proven.
- Full history need not complete for the first physical pass; scanning intentionally does not run
  invisibly after process death.
- Deep missed historical edits require explicit reconcile.
- Android Keystore-backed account-scope derivation is implemented and compile/test covered, but no
  physical code-7 account-scope creation or account-switch conflict was exercised on a device.
- F2A has no safe provider-owned channel-batch TDLib cache cleanup; requested cleanup retains bytes
  and reports the limitation after catalog metadata removal commits.
- No TMDB networking, IMDb-labelled ratings, or remote metadata cache exists. F2B is next.
- Final TV Home/details/series pages remain F2C. Final source picker and external subtitle/audio
  integration remain F2D.
- Shield D-pad, performance, storage capacity, codecs, update, and catalog acceptance remain
  entirely deferred. A phone result will not prove them.

## Continuation

1. On the authorized phone, follow the 22-step F2A order in `docs/MOBILE_ACCEPTANCE.md`, installing
   code 7 over code 6 without uninstalling or clearing data.
2. Record only safe counts and outcomes; publish no channel/media names, filenames, identifiers,
   screenshots, account/session data, or database contents.
3. Do not infer Shield behavior from phone acceptance and do not deliver the TV APK for F2A.
4. After physical F2A acceptance, continue with **F2B — TMDB matching and app-private metadata
   cache**, preserving account scope, provisional/source identity, parser-version, cache, playback,
   and privacy contracts.
