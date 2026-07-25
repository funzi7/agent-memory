# Telegram Topic Uploader — latest handoff

> **`chat-handoff.md`, beside this file, is the canonical cross-chat bootstrap.** A brand-new managing
> conversation reads that first and this second. This file is the detailed technical handoff for the
> latest completed milestone; that one is the concise, authoritative starting point. **Every future
> milestone must update both.**

## Task and repository state

| Field | Value |
| --- | --- |
| Task | D5C — permanent source deletion reachable from Review and Preview, exact binary duplicate grouping, one representative upload per group, and automatic permanent deletion of every frozen copy that is independently re-proven byte-identical after an exact positive Telegram confirmation |
| Application repository | `/root/work/telegram-topic-uploader` |
| Branch | `main` |
| Tracking branch | `origin/main` |
| Starting application HEAD | `5da03f8` (D5B) |
| Version | code 23 -> 24, name `0.11.0-d5b` -> `0.12.0-d5c` |
| Room schema | **11 -> 12.** One additive `MIGRATION_11_12`; `12.json` exported and committed |
| Deployment | None. Not installed or run on any device or emulator in this session |

No production token, Telegram identifier, bot username/ID, chat ID, thread ID, group title, forum
topic name, private link, binding command, nonce, file name, content URI, document ID, path, folder
name, destination name, or media hash was requested, used, or recorded anywhere, including this file.

## Hardware evidence, exactly as it stands

- **D5B is device-untested in full.** It was never reported as installed or exercised. Nothing in it
  is validated.
- **D5A checks 1–3 remain the only passed D5A checks**, exactly as after D5B: the real folder name and
  local alias; tapping a folder opening its page; one disposable image scanned, thumbnailed, previewed
  and uploaded. Plus the one defect (Back went to the Dashboard) that D5B fixed and nobody has
  confirmed on hardware.
- Still explicitly unvalidated: albums; Ignored and Restore across a rescan; manual permanent deletion;
  pull-to-refresh everywhere; destination popularity; same-name sibling deletion safety; album
  no-retry — and now everything in D5C.

**Do not infer hardware validation from any automated result in this file.**

## The four things the UX gate resolved

The task supplied most decisions. Four genuine user-facing ambiguities remained; all four were asked
as one grouped question and answered before a single file was edited.

1. **Representative: oldest copy, changeable.** Default is the oldest source timestamp, deterministic
   tie-break on the opaque media ID; the user may pick another member on the group page before
   confirming. The representative supplies the outgoing filename and, for a 9GAG folder, the caption.
2. **A cross-profile group appears under every member's chip**, and its representative never changes
   with the chip.
3. **The group detail is a dedicated page**, so Back returns to Review at the exact scroll offset
   under the D5B contract.
4. **Groups are excluded from the ordinary bulk selection**, from Send separately and from Send as
   album. A group's only send path is its own explicit action.

## The pieces worth re-reading

### `ExactDuplicateGrouping` and `DuplicateGroupKey` — the whole definition

`DuplicateGroupKey.of(sha256, size)` returns null unless the digest is a complete lowercase
64-character hexadecimal string and the size is strictly positive. Membership is **one equality** on
that key. That is why every excluded case is excluded *structurally* rather than by a check:
truncation, shared prefix, re-encode, resize, watermark, remux, edited tag and
same-size-different-digest all produce different keys, and an unfinished hash produces no key at all.

Filename, folder, profile, timestamp, duration, dimensions and thumbnail are **not fields of the key**,
and `D5CSurfaceTest` asserts that by reading the key's own declaration.

A group needs at least two **distinct** documents; the input is deduplicated by media ID first, so one
file listed twice cannot look like a pair. Order is total and data-derived — oldest timestamp, then
media ID — which is what makes the representative immune to chips and to the sort control.

### Grouping is presentation; the rows were already separate

`media_items` is unique on `(documentAuthority, documentId)` and on `contentUri`; the `sha256` index
is a plain lookup. **Two byte-identical files were already two rows before D5C.** The only pre-existing
dedupe is the `(sha256, topicDestinationId)` reservation, which refuses a second upload of identical
bytes to the same topic — which is exactly why the group action uploads one copy and never trips it.

Grouping happens in `ReviewDuplicateProjection`, **before** either filter runs. A chip is a fact about
the screen; a group is a fact about the files.

### One filter predicate, one deletion policy

`ReviewFilters.accepts(profile, kind, filter, mediaFilter)` is now the single composition of Review's
two filters, asked by the routable half, the non-routable half, the hidden-selected count and the
duplicate projection. It replaced four copies of the same expression, which is why the D4A and D5B
guards that pinned `underFilters(routable, …)` were re-scoped to pin the predicate instead.

`SourceDeletionPolicy` is per **media item**, not per Review row, because one source may have several
jobs and a screen deciding from the row in front of it would offer to delete bytes another topic's
queued upload needs. It is not the authority; `ManualDeletionGate` re-derives everything inside the
coordinator immediately before deleting.

### The class split is the safety property

`DuplicateGroupCoordinator` holds the upload launcher and routes one job through the existing
`previewBulkRoute` / `resolveBulkRoute` and `uploadNow`. `DuplicateMemberDeletionCoordinator` has
**no** gateway, launcher, token service or queue in its constructor, and the first reaches the second
only through the two-verb `DuplicateMemberDeletionRunner` port. "A deletion retry never contacts
Telegram" is therefore a fact about the type graph, and `D5CSurfaceTest` asserts the constructor's
exact dependency count.

### Deletion is licensed by a row, not by a return value

`UploadNowResult.Confirmed` is necessary and not sufficient. The job row is read back and must carry a
strictly positive message ID, a committed confirmation timestamp, and the **frozen** destination.
Everything else — cancellation, retryable failure, rejection, incomplete response, `RESULT_UNKNOWN`,
another topic's confirmation — settles the operation `NOT_UPLOADED`, which is terminal so nothing later
can reinterpret it.

Per copy, immediately before deletion: reopen the exact document in **that copy's own** tree, re-read
size, stream and digest the whole current file, require exact equality to both frozen values, then
delete that one document by tree plus document ID. Members are independent, so one refusal never
blocks a sibling and never licenses one.

Eleven per-member states. A copy whose fresh hash no longer matches is `CHANGED_NOT_DELETED` and is
counted in its own bucket, never as an unsafe duplicate — after that point nobody has proved it is a
copy of anything.

## Schema decision: 11 -> 12

`duplicate_operations` and `duplicate_operation_members`. Durable because the decision has to survive
the process: the user confirms, the upload runs, Telegram confirms, and only then do the deletions
begin, and every one of those is a place the app can be killed. The migration is purely additive: no
`DROP`, no `RENAME`, no `DELETE FROM`, no `INSERT INTO`, no `UPDATE` of any existing table. Both tables
start empty, so no operation is invented for existing media and no historical upload gains a
retroactive licence to delete anything.

## Tests and exact results

```
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline testDebugUnitTest      # 1549 tests, 0 failures
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline lint                   # No issues found
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline assembleDebug          # success
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline assembleDebugAndroidTest  # success (compiled only)
git diff --check                                                          # clean
```

New: `ExactDuplicateGroupingTest` (including the mandated half-identical A/B/C fixture),
`DuplicateDeletionGateTest`, `DuplicateMemberDeletionCoordinatorTest`, `DuplicateGroupCoordinatorTest`,
`SourceDeletionPolicyTest`, `ReviewDuplicateProjectionTest`, `D5CSurfaceTest`, plus
`FakeDuplicateOperationRepository`.

**Re-scoped, not deleted** — the pattern since D4C:

- `D5BSurfaceTest`'s "the schema deliberately did not move" pinned a *proxy*. D5C legitimately moves
  the schema, so it now asserts the real fact: no migration and no entity persists a scroll offset, a
  filter, a sort order or the current screen.
- `D4ASurfaceTest` and `D5BSurfaceTest` follow the filter composition into `ReviewFilters.accepts`.
- `D4ASurfaceTest`'s commit-entry-point count went 3 -> 4 (the duplicate representative is a fourth
  caller of the same engine).
- `D2B2BSurfaceTest`'s attempt-counter count went 2 -> 3 (a third counter, in the second deletion
  engine, which also cannot upload).
- `D4BSurfaceTest`'s migration and DAO windows were **narrowed**: both ran to the end of the file and
  had been silently widening with every milestone.
- `D5ASurfaceTest` follows `PermanentDeletionDialog` becoming `internal` and taking plain parameters.
- Version literal now pinned in seven surface tests; schema literal in seven.

**Known flake, pre-existing:** `TelegramMediaRepairGatewayTest > a body that did not finish is
incomplete, so a retry is safe` fails occasionally and passes on rerun (MockWebServer
`DISCONNECT_DURING_REQUEST_BODY` timing). It fired once this session and passed on the next run. **Do
not copy that fixture into a new test.**

## APK identity (debug development signing only)

| Field | Value |
| --- | --- |
| Package | `com.funzi7.telegramtopicuploader` |
| Version | code 24, name `0.12.0-d5c` |
| minSdk / targetSdk / compileSdk | 23 / 37 / 37 |
| Permissions | `INTERNET`, `ACCESS_NETWORK_STATE`, `RUN_USER_INITIATED_JOBS`, `POST_NOTIFICATIONS` — **unchanged** |
| Components | 1 exported launcher activity, 1 non-exported `BatchUploadJobService` — **unchanged** |
| Path | `app/build/outputs/apk/debug/app-debug.apk` |
| Size | 15,417,390 bytes |
| SHA-256 | `283959d388267856ffc291b08e6042a0366443970bf7772e7fbcff4f0e86c0b9` |
| Signer | `CN=Android Debug, O=Android, C=US`, RSA 2048, cert SHA-256 `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4` |
| Schemes | v1 JAR yes, v2 yes (v3/v3.1/v4 not used) |

Signer unchanged, so it installs **over** D5B without an uninstall. The schema **does** move this
time, so `MIGRATION_11_12` runs on first open and adds two empty tables.

## Agent-observed vs user-reported

**Agent-observed:** every test result, the lint result, both assemblies, the merged manifest, the APK
identity, the signer, and the schema decision.

**User-reported only:** the D5A hardware evidence (checks 1–3 and the Back defect) recorded above.
Nothing about D5B or D5C has any hardware evidence at all.

## Device-untested boundaries

Nothing in D5C ran on a device or emulator. Unverified on hardware: that the Review card menu offers
the deletion and that the folder tombstone reads correctly; that Preview's deletion behaves the same;
that two byte-identical copies actually group on a real provider; that a similar-but-not-identical file
stays outside the group; that the group page's Back returns to the right Review position; that one
group produces exactly one Telegram post; that both copies are then removed automatically; that a copy
changed mid-operation is retained; and that every new string reads correctly in Hebrew.
Instrumentation suites compile but were not run; no device was attached.

## Next device action (ask for exactly this)

`docs/D5C_DEVICE_CHECKLIST.md`. Steps 4 to 10 are the point of the milestone and they **delete real
files** — insist the user prepares disposable copies in a disposable folder first, and never tests
this on media they care about.

**Do not re-run the D5A or D5B checklists.** Ask only that their remaining checks continue during
ordinary use, and that only failures or surprises are reported. Do not ask for token setup,
multi-topic binding, old repair checks, or historical Dashboard regression.

## Roadmap after D5C

1. Whatever the device reports about D5C, then whatever it reports about D5B.
2. The rest of the D5A checklist as it is exercised.
3. Still owed from D4B/D4C: deletion retries, batch deletion, blocked deletion states, the launch
   scan, the Hebrew Preview.
4. **The Remote Sources service — a future *server* milestone, not started and not device-validated.**
   Instagram, TikTok, X/Twitter, Reddit, 9GAG. Android app stays the management UI; a separate
   always-on server does discovery/download/dedupe/delivery. `gallery-dl` primary, `yt-dlp` fallback,
   self-hosted `cobalt` for suitable TikTok no-watermark extraction, `Instaloader` as the Instagram
   fallback, Reddit OAuth/user-agent-aware ingestion. Telegram positive-confirmation and exact-document
   deletion concepts reused server-side. Mapping is remote source/account -> Telegram topic; local
   folder profiles stay organizational. Scheduling conservative, adaptive, jittered, hours-scale —
   **never every ten minutes** — with strong multi-hour backoff on 429/403/CAPTCHA/session risk, a
   separate opt-in faster schedule for expiring content, no aggressive retry loops, and source-specific
   last-seen IDs.
5. Optional content-based topic *suggestions* on Review (never automatic routing).
6. **Explicitly not on the roadmap: per-account mapping of local folders.** The user has ruled it out.
7. Still open from before: result-unknown reconciliation that never re-sends without evidence
   (including a *manual* repair-retry design), and evidence-based resolution of an unowned or
   ambiguous legacy reservation (D3A.1).

## Process rules the user set

- **Do not ship a single-hotfix build on its own**; fold it into the next substantive milestone.
- **Mandatory stop-and-ask UX gate**: inspect the implementation *first*, then ask one grouped
  question with numbered options, short practical consequences, and **no preselected default**, and
  stop until answered. D4B raised two, D4C three, D5A four, D5B one, D5C four. All were answered
  before any file was edited.
- Do not introduce another binding command alias or syntax without asking first.
- **Every requested item must appear in `TODO.md` with an explicit status** — completed, deliberately
  deferred, blocked, or device-untested. Nothing dropped silently.
- **Both handoff files are updated every milestone**: this one and `chat-handoff.md`.

## Env notes (still current)

- `GRADLE_USER_HOME=/root/.gradle ./gradlew --offline …`; `aapt2` at
  `/opt/android-sdk/aapt2-wrapper/aapt2`.
- `apksigner` at `/opt/android-sdk/build-tools/36.0.0/apksigner`; `verify --print-certs -v` gives DN,
  cert SHA-256, key algorithm/size, and which schemes verified, in one call.
- **`lint` takes ~3 minutes.** Run it in the background and do other work meanwhile.
  `app/build/reports/lint-results-debug.txt` says "No issues found." when clean.
- **`dexdump` crashes (Illegal instruction)** — use `strings` over extracted `classes*.dex`.
- The offline Gradle cache has no media3, ExoPlayer, Coil, Glide, Picasso, DataStore, and no
  `androidx.exifinterface`. D5C needed none of them.
- **minSdk is 23, so `Map.putIfAbsent` is an API-24 lint error.** Write the explicit
  `containsKey`/assign pair. Lint's `NewApi` catches it and fails the zero-issue bar.
- **Lint's `PluralsCandidate` also fails the zero-issue bar**: a string with `%d` followed by a word
  must be a `<plurals>`. D5C hit it on the Review duplicate-summary line.
- **`UnusedResources` fails it too** for any string added but never referenced. Delete from **both**
  locales; `LocalizationResourcesTest` compares key sets exactly. Hebrew plurals need `one`/`two`/
  `other`.
- **A removed or renamed string may be pinned by an old surface test**, and a `substringAfter` window
  in an old guard may silently widen when new code is appended to the same file — D5C had to narrow
  two in `D4BSurfaceTest` for exactly that reason.
- **A `codeOf()`-stripped source still contains the package name**, and
  `com.funzi7.telegramtopicuploader` contains the substring `upload`. Ban `uploadJob`, `sendPhoto`,
  `deleteDocument` and similar instead. Likewise, short markers such as `dHash`/`aHash` are substrings
  of `expectedHash` and `MediaHasher` — a negative guard must use distinctive names.
- No Robolectric/mockito: prove UI rules by extracting them into pure objects and asserting shapes.
- Kotlin property initializers run in declaration order: a `StateFlow` whose `combine`/`flatMapLatest`
  touches another property must be declared **after** it.
- Room's SQL parser rejects a correlated subquery in a projection; split it and compose in Kotlin.

## Deployment declaration

Nothing was deployed, installed, or run on a device or emulator in the D5C session. **No real Telegram
request of any kind was made** — no `sendVideo`, no `sendPhoto`, no `sendDocument`, no
`sendMediaGroup`, no `editMessageMedia`, no `getUpdates`, no send. No forum topic was created,
renamed, closed, or deleted; no binding was written against a real group. **No media file was
uploaded, moved, renamed, copied, downloaded, quarantined, or deleted**, and no real document was
opened for writing on any path. No real file name was read, recorded, or used as a test fixture: every
name, folder name, digest and byte sequence in the test suite is synthetic.
