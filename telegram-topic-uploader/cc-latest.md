# Telegram Topic Uploader — latest handoff

## Task and repository state

| Field | Value |
| --- | --- |
| Task | D2A — SAF-scoped video discovery, metadata extraction, streaming SHA-256, deterministic routing, duplicate reservation, and persistent upload-queue creation |
| Application repository | `/root/work/telegram-topic-uploader` |
| Branch | `main` |
| Tracking branch | `origin/main` |
| Starting application HEAD | `f0a9184e48e0124b076f3ba14edf924eb52c4a4c` (D1.1) |
| Final application HEAD | `37346839c3fb402c5c0a52b998617a8bccb07d50` |
| Application commit | `feat: D2A SAF media discovery, streaming hashing, and upload queue` (48 files, 8,412 insertions, 167 deletions) |
| Push | Successful (`f0a9184..3734683`); `main` verified clean at 0 ahead / 0 behind |
| Version | code 3 -> 4, name `0.2.1-d1.1` -> `0.3.0-d2a` |
| Room schema | 2 -> 3, explicit `MIGRATION_2_3`, no destructive fallback |
| Deployment | None |

No production token, Telegram identifier, bot username/ID, chat ID, thread ID, group title, private
link, binding command, file name, content URI, document ID, path, or hash of real user media was
requested, used, or recorded anywhere, including this file.

## What D2A implements

**Discovery.** `DocumentTreeReader` is the only way into a granted tree and its entire surface is
`authorityOf`, `hasReadAccess`, `rootDocument`, `listChildren`, `readDocument`. `AndroidDocumentTreeReader`
derives every resolver URI from the granted tree URI, so a provider cannot steer the scan outside it,
and contains no create/rename/move/copy/delete/writable-descriptor call. `SafMediaScanner` walks
iteratively (no stack overflow), visits each document ID at most once (breaks provider cycles),
bounded at depth 64 and 200,000 entries. A failing subtree is counted and skipped; a lost grant ends
the scan and marks the directory for reauthorization.

**Classification.** `VideoTypeAllowlist`: a concrete video subtype is trusted verbatim; when the
provider reports nothing or one of five documented generic placeholders, the file name extension is
matched against a fixed allowlist of 23 container extensions. A concrete non-video type is never
overridden by a video-looking extension.

**Metadata.** Name, MIME, size, nullable duration, content URI, source directory, document identity,
discovery time. Duration via `MediaMetadataRetriever` on a read-only descriptor — header only, no
frame decode, no thumbnail, null on any failure. Missing display name becomes a constant placeholder,
never the document ID.

**Hashing.** `StreamingMediaHasher`: one 64 KiB buffer per call reused for every chunk,
`ensureActive()` per chunk, `stream.use` on every path, digest finalized only after end of input,
lowercase canonical hex only. Truncated/IO/revoked/cancelled all return typed failures.

**Change detection.** Size + modification time captured at discovery, re-read after hashing, compared
against the digested byte count. Vanished document, size mismatch either side, or moved modification
time -> `FILE_CHANGED`, no hash persisted, no reservation, visible in Review. Zero-byte -> `FILE_EMPTY`.

**Routing.** No routing logic duplicated. `RoutingContext(folderDestinationId = directory mapping,
enabledDestinationIds = send-ready only)` fed to the existing `DeterministicRoutingEngine`.
`DestinationReadiness` re-derives readiness from the destination row + currently validated bot
(exists, enabled, complete binding, token connected, bound bot == validated bot, state VERIFIED or
BOUND_UNTESTED). Anything else -> sanitized `ReviewReasonCode`, null destination, no reservation.

**Reservation.** One transaction updates the media row, reserves `(sha256, topicDestinationId)`, and
inserts the QUEUED job. Existing reservation -> duplicate, no second job. Unique-index rejection under
a concurrent scan -> re-read the reservation: winner means duplicate; no winner means it was not a
race, so the transaction is abandoned leaving no orphan of either kind.

**Idempotency.** Media identity is `(documentAuthority, documentId)`, not the tree-derived content
URI, so overlapping parent/child trees converge on one record with ownership fixed at first discovery.
Rescan of an unchanged file returns its existing job. A job carrying Telegram evidence is never
rewritten.

**Execution.** `ScanCoordinator` uses an application-lifetime supervised `CoroutineScope` on
`Dispatchers.IO`. `scan_runs` unique index on `sourceDirectoryId` = unique work per directory across
processes. Cancel writes a durable flag the pipeline polls AND cancels the coroutine; the run row is
closed with a recorded outcome either way (`withContext(NonCancellable)`). Interrupted runs reconciled
at startup as `INTERRUPTED`, never resumed. Scanning never starts on ordinary launch.

**UI.** Directories: name, enabled state, grant type, mapped destination, binding readiness,
map/change/clear destination, Scan, Scan all enabled, live progress + counts, Cancel scan, last-scan
outcome + counts, reauthorize action. Queue: name, destination, size, nullable duration, routing
method, preparation status, **no upload control**. Review: sanitized reason per item. Dashboard counts
from real rows. EN/HE at exact key parity (200 strings each), RTL with LTR islands for numbers.

## DELIBERATE DEVIATION: not WorkManager

The task said "WorkManager or another justified persistent Android mechanism". WorkManager was
evaluated and **not** adopted. Its merged manifest contributes `WAKE_LOCK`, `RECEIVE_BOOT_COMPLETED`,
and foreground-service components to an application whose entire posture is "the manifest declares only
INTERNET", and its purpose is running work while the user is absent — the wrong default for a scanner
that reads user video files. The chosen mechanism delivers every required property (unique work per
directory, explicit start/cancel, persisted state, safe restart, no duplicates) with strictly less
privilege. The permission set is byte-identical to D1.1. `TODO.md` D2B lists re-evaluating this for
the deferred transfer stage, where deferred background execution is genuinely needed.

## Schema 3 and migration

Additive only. `source_directories` += `accessState`, `lastScanStartedAt`, `lastScanFinishedAt`,
`lastScanOutcome`, four counters (all with defaults). `media_items` += `documentAuthority`,
`documentId`, `documentLastModifiedAt`, `hashedAt`, `hashedSizeBytes` + unique index on
`(documentAuthority, documentId)` (legacy rows have NULL identity; SQLite treats NULLs in a unique
index as distinct, so all survive). `upload_jobs` += nullable `reviewReason` + a **non-unique**
`(mediaItemId, topicDestinationId)` lookup index. `scan_runs` created with a unique index on the
directory.

Job uniqueness per item+destination is enforced **inside the transaction**, not by a unique index,
because installing one over arbitrary legacy data could fail a migration that has no destructive
fallback to recover with. The durable cross-scan race guard remains the unique reservation index on
`upload_idempotency`.

No D0/D1/D1.1 row deleted or rewritten; no existing `sha256`, `telegramMessageId`,
`telegramConfirmedAt`, `deleteAfter`, or reservation touched. Schemas 1 and 2 byte-for-byte unchanged;
3 exported and committed.

## Key refactor worth knowing

`TransactionRunner` (`data/local/TransactionRunner.kt`) was extracted so `RoomScanRepository` takes a
transaction port and DAOs instead of `AppDatabase`. That is what makes the reservation/duplicate/race
logic testable on the JVM with in-memory fakes. `RoomTransactionRunner` wraps `database.withTransaction`
in production. `MediaScanner`/`MediaHasher` moved out of `domain/ports/FuturePorts.kt` into
`domain/scan/`; only `UploadCoordinator` and `SafeDeletionManager` remain unimplemented there.

## Tests and exact results

**JVM: 255 tests across 28 classes, 0 failures, 0 errors, 0 skipped** (D1.1 had 156 across 20; +99).
All 156 pre-existing tests remain green with unchanged per-class counts.

| Class | Tests | Covers |
| --- | --- | --- |
| `SafMediaScannerTest` | 11 | recursion, MIME + extension fallback, unsupported exclusion, failing subtree, revoked grant at start and mid-traversal, cycles incl. self/ancestor reference, repeated IDs, missing root, cancellation, collector-failure propagation |
| `VideoTypeAllowlistTest` | 8 | trusted subtypes, bare `video/` rejected, generic + missing MIME fallback, all 23 extensions, non-video types never overridden, malformed names |
| `StreamingMediaHasherTest` | 9 | four published SHA-256 vectors incl. one-million-`a`, 8 MiB input proving read requests never exceed the fixed buffer, partial-stream failure yields no hash, unreadable, revoked, stream closure, cancellation propagates |
| `DestinationReadinessTest` | 9 | every ready/non-ready classification and its sanitized code |
| `RoomScanRepositoryTest` | 27 | run lifecycle + concurrent-start uniqueness, interrupted reconciliation, rediscovery, overlapping trees, valid folder route, every review reason, non-canonical hashes rejected, same-hash/same-dest dedup, concurrent duplicate race, same-hash/different-dest allowed, repeat idempotency, review placeholder reuse/replacement, historical confirmed job never rewritten |
| `DirectoryScanPipelineTest` | 20 | full discovery-to-queue, no Telegram evidence, documents unchanged + streams closed, unmapped/not-ready routing, four change/failure paths, zero-byte, unnamed, revoked at start and mid-hash, repeat idempotency, byte-identical copy dedup, overlapping trees, durable cancellation, failing subtree, unusable authority |
| `ScanCoordinatorTest` | 8 | no scan on construction, unique work, disabled/missing refused, revoked refused before work, scan-all only enabled, cancel marks run, startup reconciliation restores scannability |
| `D2AScanSurfaceTest` | 7 | no transfer/mutation/deletion/logging/broad-storage/thumbnail symbol in scan sources; read-only port method sets by reflection; bounded-buffer hasher |

**Instrumentation: 28 compiled (was 15), none executed — no attached device.** New:
`AppDatabaseMigrationTest` +2 (2->3 preserving full D0/D1/D1.1 records incl. validated bot, offset,
binding, directory mapping, media hash, RESULT_UNKNOWN job, reservation; legacy NULL-identity rows
coexisting while new duplicate document identities are rejected) and `D2AScanPersistenceTest` 11
(routing, dedup, 6-way concurrent race, idempotency, overlap, unique run, reconciliation, access
state) against real Room where SQLite enforces the constraints.

No automated test contacts Telegram production or touches real user media; discovery and hashing run
against a synthetic in-memory document tree (`FakeDocumentTree`).

| Command/check | Result |
| --- | --- |
| `GRADLE_USER_HOME=/root/.gradle ./gradlew --offline test` | Passed: 255 tests, 28 classes, 0 failures/errors/skipped. |
| Focused D2A suites | Passed: 99 tests across 8 classes, 0 failures. |
| `./gradlew --offline lint` | Passed; lint XML contains 0 issues. |
| `./gradlew --offline assembleDebug` | Passed. |
| `./gradlew --offline assembleDebugAndroidTest` | Passed; 28 instrumentation tests compiled, none executed. |
| `git diff --check` | Passed (working tree and staged). |
| `adb devices -l` | Ran successfully; **zero attached devices**. |
| APK ZIP integrity | Both APKs passed `unzip -t`. |
| AAPT2 badging | `com.funzi7.telegramtopicuploader`, versionCode 4, versionName `0.3.0-d2a`, minSdk 23, targetSdk 37; permissions INTERNET + AndroidX injected app-scoped only; `usesCleartextTraffic=false`; `allowBackup=false`; `fullBackupContent=false`. |
| `apksigner verify` | Verifies with v1+v2 debug schemes, one signer, RSA 2048. |
| D1.1 -> D2A update compatibility (static) | Same package, **same certificate digest**, unchanged min/target SDK and permission set, versionCode 3 -> 4. No device install performed. |
| Packaged DEX inspection | No `sendVideo`/`sendDocument`/`sendMediaGroup`/`sendAnimation`/`copyMessage(s)`/`openOutputStream`/`MANAGE_EXTERNAL_STORAGE`/`READ_MEDIA_VIDEO`/`READ_EXTERNAL_STORAGE` string anywhere. |
| Leakage sweep | Token patterns, `t.me`/`joinchat`, real-looking chat IDs, non-synthetic content URIs, absolute storage paths: zero matches outside synthetic fixtures. |
| Logger check | No logging call of any kind in the scan sources. |

## Environment notes (still current)

- `HOME=/home/devagent`. Both `/home/devagent/.android/debug.keystore` and `/root/.android/debug.keystore`
  currently hold the correct certificate `74e78654…` — verified with `keytool -list -v` **before**
  building this session, so the D1.1 keystore gotcha did not recur. Keep verifying it each session.
- Gradle dependency cache lives at `/root/.gradle`, not `$HOME/.gradle`. Always build with
  `GRADLE_USER_HOME=/root/.gradle ./gradlew --offline …`. `/root/.gradle/gradle.properties` sets the
  qemu aapt2 wrapper.
- `aapt2` must be invoked through `/opt/android-sdk/aapt2-wrapper/aapt2` (qemu shim); calling
  `build-tools/37.0.0/aapt2` directly gives `Illegal instruction`.
- Network **is** reachable from this sandbox (dl.google.com responded), but the offline cache has no
  `androidx.work` artifact. That was not the reason for skipping WorkManager — the reason is the
  permission surface, documented above.
- `grep` on `.dex` files returns nothing useful; pipe through `strings -a` first.
- Preserved APKs in this session's scratchpad: `d1-app-debug.apk` (versionCode 2, SHA-256
  `458f83ae…`) and `d2a-app-debug.apk` (versionCode 4, SHA-256 `8ac1871d…`). Compare the signer digest
  against a preserved APK before claiming update compatibility.
- Kotlin KDoc block comments **nest**, so writing a literal `video/*` inside a doc comment opens an
  unterminated nested comment and fails compilation. Cost one build cycle.

## Artifacts (debug development signing only)

- Main APK: `app/build/outputs/apk/debug/app-debug.apk`, 13,917,663 bytes,
  SHA-256 `8ac1871d58d2488cb1d15c78ed7371327cd184f552252d16249a5a4c6ef86c3a`.
- Instrumentation APK: `app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk`,
  1,367,700 bytes, SHA-256 `9397981fbceaed8ed6869b37608d976eef8555c6d10ef9357b9c5caddf1a6d87`.
- Package `com.funzi7.telegramtopicuploader`; versionCode 4; versionName `0.3.0-d2a`; minSdk 23;
  compile/target SDK 37.
- Debug certificate SHA-256 `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4`
  (identical to D0, D1, D1.1). Development debug signing, not release signing.

## Evidence classification

USER-REPORTED device evidence only — not observed or performed by any agent:

- D1.1 was installed over D1 and launched;
- anonymous-administrator binding succeeded in a fresh session;
- the binding candidate was confirmed;
- the explicit bot test message was sent successfully to the selected topic;
- closing and reopening the app preserved bot validation and the topic binding;
- token removal/replacement was **not** tested and was intentionally skipped;
- no media scanning, hashing, upload, or deletion has yet occurred.

Nothing else is claimed.

AGENT-OBSERVED in D2A: repository/Git/source/schema inspection; JVM tests, lint, Kotlin and
instrumentation compilation, both APK assemblies; ZIP, AAPT2 manifest, signature/certificate,
permission and DEX inspection; the static D1-to-D2A signer comparison against the preserved APK;
leakage and logger sweeps; ADB running successfully with zero attached devices.

UNTESTED: the D2A APK has **never** been installed, updated over D1.1, launched, or run. No real SAF
provider, document tree, video file, duration extraction, or hash of real media. Room 2 -> 3 migration
never executed on a device. Android Keystore and scan-persistence instrumentation compiled only. No
real revoked-grant recovery, cancellation of a long scan, or large-directory throughput. No Telegram
traffic. No media upload/copy/download/background transfer/quarantine/move/rename/deletion. No share
target, external automation, AI, release signing, distribution, or deployment.

## Remaining device work (not executed)

`docs/D2A_DEVICE_CHECKLIST.md` — install over D1.1; confirm bot validation, binding, and existing
directories survive; configure a **dedicated folder containing only non-personal copied test videos**;
map it to the bound test destination; scan and verify metadata; verify queue entries; verify **no
Telegram message was sent**; rescan and verify no duplicates; add a byte-identical copy under another
name and verify same-destination dedup; restart and verify persistence; revoke folder access and
verify the recoverable reauthorize path; verify no file was modified or deleted. Record only
pass/fail, counts, and sanitized reasons — never a file name, URI, path, hash, or Telegram identifier.

Also outstanding: the D1.1 binding regression items never reported, and executing the Room migration
and Keystore instrumentation on a device.

## Risks

- Every provider behaviour is modelled by a synthetic in-memory tree. Real SAF providers vary in what
  they report for size, modification time, MIME, and child listings; the device checklist is the only
  way to confirm classification and change detection hold in practice.
- Change detection relies on the provider reporting a usable size and modification time. A provider
  reporting neither can only be checked against the digested byte count, so a same-length in-place
  modification during a scan could go undetected. Documented, not hidden.
- Document ownership is fixed at first discovery when parent and child trees overlap. If the two trees
  map to different destinations the file routes to the first tree's destination until the overlapping
  mapping is removed. Deterministic and idempotent, but potentially surprising.
- Job uniqueness per item+destination is in-transaction rather than a unique index (see schema note).
  Room serializes write transactions so this is sound, but weaker than a DB constraint.
- Progress is persisted per processed entry — fine for the dedicated test folders D2A targets, chatty
  for a very large tree. D2B should batch it.
- Cancelling a very large single file stops at the next 64 KiB chunk, so a slow provider can delay it.
- Not using WorkManager means a scan cannot continue once the process is gone; the user restarts it.
  Intentional, and safe because repeat scans are idempotent.
- `MediaMetadataRetriever` behaviour on unusual containers is unverified on a device; the failure path
  returns null, so the worst outcome is a missing duration.
- All pre-existing D1/D1.1 risks still apply (Keystore/migration/UI not device-executed; token
  transiently immutable in the OkHttp URL; `validateToken` holds the mutex across `getMe`; a cancelled
  test persists RESULT_UNKNOWN; a page with a missing `update_id` fails closed; schema-v1 duplicate
  pairs are RETEST_REQUIRED; binding uniqueness relies on SQLite triggers plus an in-transaction
  pre-check).
- The artifact is debug-signed and is not a production release.

## Remaining D2B work (not started)

Persistent queue claiming with an owner lease, attempt accounting, bounded retry policy and backoff,
process-death recovery for claimed-but-undispatched jobs, constrained background coordination for the
deferred stage (re-evaluating the WorkManager decision above), manual routing controls so a Review
item can be assigned a destination and reserved then, re-scan/re-hash actions for changed or
unreadable items, and large-directory/claim-race/process-restart tests.

## Remaining D3 work (not started)

Media transport behind a separately reviewed gateway boundary; reconcile every dispatch into
confirmed/retryable/permanent/result-unknown; never auto-retry result-unknown until duplicate risk is
reconciled; require a positive returned Telegram message ID before confirmation or deletion
eligibility; provider-aware keep/delete/quarantine with process-death recovery; revoked-grant,
partial-mutation, overflow, and confirmation-gate tests.

## Deployment declaration

Nothing was deployed, distributed, installed, or run on a device or emulator in the D2A session. No
Telegram request of any kind was made. **No media was uploaded, moved, renamed, or deleted**, and no
media was copied, downloaded, or quarantined.
