# Private Media TV — F2B.1 Handoff

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | `funzi7/private-media-tv` |
| Milestone | F2B.1 — explicit source scope, recurring programs, resolver reliability, and mobile fullscreen |
| Branch / tracking branch | `main` / `origin/main` |
| Starting application HEAD | `e0b6557f128cb4a33e218edadae7f930c3eadbe5` |
| Final application HEAD | `038a8e3dc7b2d6bc39674ef0ed778ec6a4b98f97` |
| Historical F2B exact-HEAD CI baseline | `31324478391` |
| Final F2B.1 exact-HEAD CI | `31513282254` — success |
| Agent-memory base before this handoff | `35ace4d1bfe815d7a795484a1fdf5036310babfa` |
| Mobile identity | `com.funzi7.privatemediatv.mobile`, `0.3.1-phone-test`, `versionCode` 9 |
| TV identity | `com.funzi7.privatemediatv`, `0.5.1-f2b1`, `versionCode` 14 |
| Development signer SHA-256 | `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` |

The application milestone was committed once as
`038a8e3dc7b2d6bc39674ef0ed778ec6a4b98f97`, pushed without force, fetched, and
verified at `origin/main`. Exact-final-HEAD Android CI run `31513282254` passed both jobs and uploaded
the signed TV and mobile artifacts. Only the exact-head mobile artifact was downloaded to shared
storage. No TV APK was exported, downloaded, installed, or deployed, and no Shield command ran.

The agent-memory repository opened clean, was fetched before this edit, and its actual `HEAD` and
`origin/main` both resolved to the base recorded above. Newer unrelated agent-memory work was
preserved.

## Product and architecture correction

F2B's TMDB-first ordinary browsing remains authoritative, but its automatic all-broadcast source
scope is revoked. The permanent flow is:

```text
TMDB Home/Search
→ selected movie, series, or exact episode
→ explicit Sources, Play-needs-source, recurring Lookup, or Refresh
→ bounded search of explicitly selected Telegram chats only
→ validated variants
→ warm/local/remote typed resolution
→ playback
```

Ordinary Home, metadata search, details, and rendering a persisted recurring-program card never
trigger Telegram. Telegram is an on-demand source provider, not a mirrored catalog. There is no
all-account default, global-search post-filter, or whole-history fallback.

Only broadcast channels and supported groups explicitly selected in **"המקורות שלי"** may
participate. New, joined, unselected, private, direct, unsupported, or ambiguous chats are never
searched or silently selected.

The mandatory Product Intent Check and permanent F2B.1 invariants were added to `AGENTS.md` and the
authoritative product, architecture, data, Telegram, UX, security, test, release, acceptance, and
handoff documentation. ADR 0013 records the corrected decisions and supersedes conflicting F2B
scope and resolution behavior.

## Implemented behavior

### Explicit source management and discovery

- **"המקורות שלי"** contains selected chats only, with title, channel/group type, active state,
  Remove, and Refresh.
- **"הוספת מקורות"** contains eligible unselected channels and supported groups, with local
  filtering, Refresh, and Add.
- Listing chats reads chat metadata only and never scans message history.
- Add and Remove increment the source-scope revision. Removal makes the chat eligible for Add
  Sources again.
- Migration preserves only historical selections proven to be explicit owner choices. Ambiguous
  F2B default-all membership becomes unselected.
- Zero selected chats produces zero Telegram searches and actionable UI guidance.
- Discovery snapshots the selected set and uses pinned-TDLib per-chat `SearchChatMessages` only,
  with separate video/document filters, at most four deterministic query forms, bounded pages,
  results, and concurrency, lifecycle cancellation, durable deduplication, a fail-closed 200-chat
  cap, and no global/history fallback.
- Scope changes stale only revision-bound discovery/template state; TMDB metadata, Telegram media
  bytes, resume, preferences, and unrelated caches remain intact.
- The revoked legacy channel diagnostic redirects to the catalog without loading a channel,
  querying sources, or reading message history.

### Recurring programs and template cache

Provider-neutral `LocalRecurringProgram` and `LocalRecurringEdition` identities coexist with TMDB
identities.

- Two distinct high-confidence dated results with the same deterministic normalized base title may
  promote one provisional recurring program.
- Editions remain separate children beneath one program identity.
- Same-date results merge only when no high-confidence marker distinguishes separate broadcasts.
- Morning/evening, early/main/late, part number, explicit time, special-edition, and other stable
  edition-specific wording remain distinct.
- Multiple Telegram files representing the same actual edition remain source variants.
- The versioned parser handles Hebrew, English, and mixed Unicode conservatively, strips only
  high-confidence dates/release tags, retains meaningful numbers, and does not fuzzy-merge
  unrelated titles.
- Owner program creation, corrections, splits, and merges persist. No source-less edition can be
  created; every edition requires real source evidence.
- Owner assignments bind to exact durable `ProviderResourceIdentity`; a replacement attachment at
  the same locator cannot inherit a correction, while the prior correction remains dormant.
- Cadence inference normally requires at least three consistent real editions and yields only a
  hint.
- Successful query forms, validated date pattern, preferred selected sources, cadence, source
  revision, parser/template version, last success, and negative state persist in Room and survive
  restart and update.
- Refresh reuses learned successful forms first and may add one date-targeted query only when a
  validated date pattern exists.
- Schedule/template knowledge never creates an edition without an actual matching result.
- Discovery results, edition rows, source assignments, and template changes commit atomically for
  the captured source revision and roll back on scope change or cancellation.

### Resolver, warm session, and local cache

Resolution is typed instead of collapsing every failure into unavailable.

- A retained five-minute warm session matching the stable opaque provider-resource identity
  reattaches before `GetMessage`.
- Reentry retains the same controller, provider source, parsed container, memory buffer, position,
  tracks, speed, and scaling.
- Durable Room locators reconstruct after recomposition, route return, ViewModel recreation, and
  process recreation; transient registry state is never the sole playback route.
- Warm, remote, complete-local, retryable, runtime-not-ready, stale-locator,
  attachment-changed, fatal, and definitively-deleted outcomes remain distinct.
- A raw `GetMessage` 404, timeout, runtime transition, registry miss, stale mapping, rate limit, or
  transient server failure is retryable and cannot overwrite a previously valid source as
  definitively unavailable.
- Only an exact permanent Telegram deletion event proves remote deletion. Transient live updates
  and file-state transitions cannot mark a source remotely unavailable.
- Attachment replacement remains distinct from deletion.
- A complete exact local copy may remain playable through the existing secure provider/cache
  boundary only when stable identity, validated account scope, and current selected-chat
  eligibility are proven.
- Partial local data remains known but cannot promise missing remote ranges.
- Protected-content handling continues to fail closed.

### Mobile player safety and fullscreen

- Non-fullscreen controls apply Compose safe-drawing, navigation-bar, and display-cutout insets.
- A visible Fullscreen action uses supported immersive APIs and restores system bars on exit.
- Actual video height greater than width selects portrait fullscreen; width greater than or equal
  to height selects landscape.
- Unknown dimensions preserve current orientation until dimensions become known.
- Manual Rotate overrides automatic orientation for that playback session.
- Leaving fullscreen restores ordinary application orientation behavior.
- Fullscreen transitions retain the same controller/source, position, Media3 memory buffer,
  selected tracks, speed, and scaling.
- TV orientation behavior and the final F2C TV presentation remain unchanged.

## Principal modules and files

The final application commit changes 106 files. Principal areas are:

- `AGENTS.md`, `README.md`, `TODO.md`, and `CHANGELOG.md`;
- `docs/PRODUCT_SPEC.md`, `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`,
  `docs/TELEGRAM_INTEGRATION.md`, `docs/SECURITY.md`, `docs/UX_DECISIONS.md`,
  `docs/TEST_PLAN.md`, `docs/PROJECT_STATE.md`, `docs/RELEASE_REVIEW.md`,
  `docs/HANDOFF.md`, `docs/MOBILE_ACCEPTANCE.md`, `docs/APK_DISTRIBUTION.md`,
  `docs/TV_CATALOG_UX_SPEC.md`, and ADR 0013;
- `core-catalog` source-scope contracts, Room migrations through schema v6, recurring parser,
  cadence, entities, DAO/repository/service, transactional source discovery, and tests;
- `core-metadata` provider-neutral recurring identities and tests;
- `core-telegram` selected-chat search, eligible-chat projection, durable resolution, permanent
  deletion tracking, trusted-local eligibility, and tests;
- `core-playback` warm-session ownership, typed playback attempts, rendered-video dimensions, and
  retention tests;
- `app-mobile` catalog data source/ViewModel/screens, source-management UI, recurring-program
  integration, production bridges, safe-inset overlay, fullscreen/orientation effects, and tests;
- `app-tv` regression version/build compatibility; and
- `.github/workflows/android-ci.yml` and package-specific verification/delivery scripts.

Raw TDLib types remain confined to `core-telegram`. Provider, UI, and public models remain opaque
and provider-neutral.

## Compatibility and preservation

Room migration is non-destructive through schemas v3→v4→v5→v6. Mobile code 9 updates code 8, and
TV code 14 remains compatible with code 13. The v4→v5 migration also repairs legacy F2B
on-demand rows whose raw 404 had been incorrectly persisted as unavailable, without deleting their
locator, cache, or byte state.

The update contract preserves:

- Telegram credentials, authorization session, and TDLib database;
- the separate TMDB credential;
- TMDB metadata and image caches;
- existing on-demand source results;
- Telegram media-byte cache and cache ledger;
- playback progress and resume state;
- warm-player behavior and player preferences; and
- application IDs, Keystore aliases, TDLib storage paths, Development signer, ARM64 ABI, and JNI
  lineage.

Real retained APK pairs passed upgrade verification:

- mobile `0.3.0-phone-test`/8 → `0.3.1-phone-test`/9;
- TV `0.5.0-f2b`/13 → `0.5.1-f2b1`/14.

No uninstall, downgrade, data clear, vault replacement, session reset, or cache deletion was
introduced.

## Security and privacy review

- No real credential, phone number, authentication material, session/database, private
  source/program/media identity, filename, caption, path, provider identifier, QR data, private
  URL, or private content is present in public state, tests, logs, APKs, or this handoff.
- Runtime Telegram and TMDB credentials remain separate, app-private, and Keystore protected.
- Trusted local playback requires exact opaque identity, validated account scope, and current
  selected-chat eligibility.
- Local bytes are accessed only through the existing secure provider/cache boundary.
- Protected-content policy remains fail-closed.
- APK private-material and credential scans passed.
- The staged application diff was independently reviewed and contained only source, tests, Room
  schema metadata, workflow/scripts, and documentation; no binary or private artifact was committed.
- No TDLib native rebuild occurred.

## Local validation

The required command set passed:

```bash
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
```

Focused test tasks for every touched module also passed. Aggregate result: **884/884 tests**, zero
failures, errors, or skips:

| Module | Tests |
| --- | ---: |
| `app-mobile` | 177 |
| `app-tv` | 74 |
| `core-catalog` | 148 |
| `core-metadata` | 40 |
| `core-model` | 15 |
| `core-playback` | 85 |
| `core-provider` | 27 |
| `core-provisioning` | 48 |
| `core-security` | 98 |
| `core-telegram` | 172 |
| **Total** | **884** |

Retained executable validation also passed:

- all three browser/WebCrypto/Kotlin provisioning interoperability checks;
- provisioning inspector: 4 cases;
- upgrade behavior: 13 cases;
- TV delivery harness: 9 cases;
- TV downloader rejection: 8 cases;
- mobile delivery harness: 11 cases;
- mobile downloader: 20 rejection cases plus 1 success case;
- APK credential scanner: 41 cases;
- APK native-layout/private-material inspection; and
- all shell-script syntax checks.

The full observed command family additionally included focused Gradle tasks for `app-mobile`,
`app-tv`, `core-catalog`, `core-metadata`, `core-model`, `core-playback`, `core-provider`,
`core-provisioning`, `core-security`, and `core-telegram`; the Node interoperability tools;
`test-inspect-pmtprov.sh`; all retained upgrade/delivery/downloader/scanner harnesses;
`verify-mobile-apk.sh`; `verify-upgrade-apks.sh`; `gh run watch/view`; and the exact-head mobile
downloader.

Official TDLib 1.8.66 at source commit
`022d60202e446ad1287b9fb68e687c8a0760788b` was verified without rebuilding. Native identities:

| Property | Observed value |
| --- | --- |
| ABI / NDK | ARM64 only / NDK r28c |
| Local AAR SHA-256 | `025313d2a7cdbf148e5c700e8ef6c9d384f2301aff043c844997e0c23eb9abd2` |
| Local JAR SHA-256 | `e39bb497b7eea1f33d7d3b5816591b7656259df29e0231c10287e514e3951a04` |
| Local packaged JNI SHA-256 | `21d59ebfeba4edc62ea74cefaa79b08650e796530f3d5e57804105cc44cb65dc` |
| CI-cache packaged JNI SHA-256 | `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f` |
| Layout | ARM64 DYN, every `LOAD` at least `0x4000`, stored and 16,384-byte APK aligned, expected dependencies only |
| Host page size | 4,096 bytes |

The local and CI hashes are the existing separately verified native lineages for the same pinned
official source/build identity. F2B.1 changed no native source, input, ABI, NDK, signer, or cache
identity.

## Local APK evidence

| Candidate | Identity | Size | SHA-256 | Modification time |
| --- | --- | ---: | --- | --- |
| Mobile | `0.3.1-phone-test`/9 | 58,322,588 bytes | `8e52a36693576f59b3b549494db254abfcdce48b64f41fd93642189289cba6d7` | `2026-08-11 15:59:20.789982629 +0000` |
| TV regression | `0.5.1-f2b1`/14 | 58,312,163 bytes | `b4854b7c4fee3b7e91d4842d59bb04b36e119d75d910fbd34872755aaba433ea` | `2026-08-11 15:59:49.685982618 +0000` |

Both passed exact package/version/code, Development signer, ARM64/JNI, native-layout,
prohibited-content, and retained-update checks. The local mobile exporter was intentionally omitted;
the exact-head CI downloader below is the authoritative publication. The TV artifact was not
exported or delivered.

## Exact-final-HEAD Android CI

| Field | Value |
| --- | --- |
| Run | `31513282254` |
| URL | `https://github.com/funzi7/private-media-tv/actions/runs/31513282254` |
| Branch / commit | `main` / `038a8e3dc7b2d6bc39674ef0ed778ec6a4b98f97` |
| Run time | `2026-08-11T16:36:21Z` through `2026-08-11T16:49:03Z` |
| Conclusion | success |
| Wrapper job | `93852095819` — success |
| Android build job | `93852136045` — success |
| Mobile artifact | ID `9110393545`, `private-media-tv-mobile-apk-038a8e3dc7b2d6bc39674ef0ed778ec6a4b98f97`, 57,635,303-byte archive, digest `sha256:3aaeee760aefe9562a62b3ded290d1b62a29c2075a7082a758d16feffa1d0ffe` |
| TV artifact | ID `9110392043`, `private-media-tv-apk-038a8e3dc7b2d6bc39674ef0ed778ec6a4b98f97`, 58,198,856-byte archive, digest `sha256:7871b7108c7cf9a024e95ebf2f733082b41c24064375f046e33269f2fed8770f` |

The exact-HEAD run passed wrapper validation, pinned official-TDLib verification without a native
rebuild, artifact-selection rejection tests, browser crypto fallback, Development signer
reconstruction/verification, aggregate and focused tests, lint, signed ARM64 TV/mobile assembly,
package/version/signer/JNI/content inspection, checksum and non-sensitive metadata generation, and
both artifact uploads. The push-only run correctly skipped the pull-request signing identity step.
GitHub emitted one non-failing maintenance annotation that SHA-pinned actions using a Node 20
runtime were being forced onto Node 24; it did not affect this successful result.

## Final exact-head CI mobile-only delivery

After CI succeeded, `./scripts/download-latest-ci-mobile-apk-to-phone.sh` selected only the exact-
HEAD push artifact. It verified artifact shape and metadata, checksum, package, version,
Development signer, ABI, JNI, native layout, and prohibited-content boundary, then published
through the Mobile-only rotation path.

| Field | Final CI mobile APK |
| --- | --- |
| Canonical path | `/storage/emulated/0/Download/PrivateMediaTV/Mobile/private-media-tv-mobile-latest.apk` |
| Package/version | `com.funzi7.privatemediatv.mobile`, `0.3.1-phone-test` (`versionCode` 9) |
| Size | 57,634,229 bytes |
| APK SHA-256 | `4598891e99dbcf07cd252fdf72474042bdfb4ed97a3aad59bf15a312ad8b349b` |
| Fresh modification timestamp | `2026-08-11 16:52:55.197981403 +0000` |
| Modification epoch | `1786467175` |
| Development signer SHA-256 | `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` |
| ABI / JNI | ARM64 only / `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f` |
| Native layout | NDK r28c, ARM64 DYN, 16-KiB compatible and aligned, expected dependencies only |

The final APK is a real regular copied file, not a symlink. A fresh independent mobile verifier and
the real retained code-8→9 upgrade verifier passed against the canonical pair. The verified
`previous` file is code 8, 57,339,289 bytes, SHA-256
`ffb6d1b0f530fc258c0b60d75d202e08224f3149faef5833e2a02461bba429b9`.

Parent TV `latest`, `previous`, and the provisioning tool retained their exact pre-publication
hashes, sizes, timestamps, and inodes:

- `private-media-tv-latest.apk`: 57,030,122 bytes, SHA-256
  `11bca1c3333cebcb5f08e10d5361b586cb7e7d8341b5aa0b4ff00908ba8f24`;
- `private-media-tv-previous.apk`: 57,107,459 bytes, SHA-256
  `48095b075917c756eece8689c3684780a083018e5c03bf0568ae1261aac18877`;
- `telegram-provisioning-file.html`: 6,066 bytes, SHA-256
  `ff56a206d462c5f1f1a71644e04814564f47b1d801b58e4af1dab2245602f26f`.

No TV exporter, TV CI downloader, TV installation, or Shield deployment ran.

## Physical status, limitations, and risks

`adb devices -l` listed no attached device. Therefore no code-9 installation, launch,
update-preserved credentials/session/cache, real selected-channel/group search, recurring-program
grouping, immediate source replay, safe-inset behavior, fullscreen/orientation transition, or
physical buffer/track continuity is claimed.

Known deliberate constraints and remaining evidence boundaries:

- discovery fails closed when selected eligible scope exceeds the configured bounded cap;
- recurring promotion is conservative, so ambiguous results remain separate until owner
  correction;
- cadence/template knowledge cannot prove or fabricate an edition;
- retryable remote resolution can temporarily leave missing bytes unavailable but cannot become a
  deletion claim;
- only a complete exact permitted local copy can play without remote bytes;
- protected-content sources fail closed;
- JVM/Compose contract tests cannot substitute for real-device rendering, gesture navigation,
  orientation, network, thermal, or long-playback evidence; and
- GitHub's Node-runtime annotation is future workflow maintenance, not a current failure.

No material F2B.1 product ambiguity remains unresolved. The outstanding item is physical
acceptance, not an implementation choice. F2C remains intentionally unimplemented.

## Exact next milestone and continuation

The immediate next milestone is **physical F2B.1 mobile code-9 acceptance**. Follow the ordered
25-step procedure in `docs/MOBILE_ACCEPTANCE.md` without uninstalling, downgrading, or clearing
data. It must verify:

1. code 9 updates retained code 8 and preserves Telegram/TMDB state;
2. My Sources/Add Sources add/remove/refresh only explicit channels and supported groups;
3. ordinary TMDB Home remains Telegram-free and only selected chats are searched;
4. several minutes of playback followed by immediate same-source replay reuses the valid warm
   session without a false unavailable state or unnecessary buffering;
5. normal controls remain above Android navigation UI;
6. immersive bars, automatic portrait/landscape, manual rotate, and controller/position/buffer/
   track/speed/scaling continuity work physically; and
7. suitable recurring content appears as real dated editions beneath one program without a
   fabricated edition.

Record only sanitized outcomes. Never publish private source, program, media, filename, caption,
path, identifier, credential, session, or screenshot content. Do not deliver or install the TV APK
and do not run Shield deployment for F2B.1.

After physical F2B.1 acceptance, the next development milestone remains **F2C**, implementing the
final TV Home/details/series/Continue Watching UX under the approved TV-first D-pad contract. F2D
remains subtitles/audio and final integration.
