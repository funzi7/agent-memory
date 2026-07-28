# Telegram Topic Uploader — latest handoff

> **`chat-handoff.md`, beside this file, is the canonical cross-chat bootstrap.** A brand-new
> managing conversation reads that first and this second. **Every future milestone must update
> both**, and from D6A also `/root/work/agent-memory/telegram-remote-sources/cc-latest.md`.
>
> **When the user supplies SHAs, read agent-memory before responding**, verify each against
> `origin/main`, and only then answer. A supplied SHA is a claim to verify, never a fact to repeat.

## Task and repository state

| Field | Value |
| --- | --- |
| Task | **D6A7d** — an uncertain upload that can be answered, a folder's real name, and a delivery that says what it was |
| **Final application HEAD** | **`6a9ced6d1791d290a8751c0e1eb325e5dda4d5cd`** — pushed |
| **Final server HEAD** | **`6fa9662b25e606c5d432ea52cc2827500d4f8137`** (`6fa9662`) — **deployed and verified** |
| Version | code 37 → **38**, name `0.13.12-d6a7c1` → **`0.13.13-d6a7d`** |
| Room schema | **13 → 14.** Five nullable columns on `upload_jobs` and one unique index. Server: **`0004_content_kind`** |
| Gate | **2250 Android unit tests, 0 failures. Lint: no issues** (read from the XML report). Server **948 passed, 4 skipped** |
| APK | `app-debug.apk`, 16,251,384 bytes, SHA-256 `810637f90bce3fb7582537bdc962c7f41899100d72178a426dc43754784949db`. Signer unchanged. **Copied to Downloads with a matching hash. Not installed** |
| APK in Downloads | `/sdcard/Download/TelegramTopicUploader-0.13.13-d6a7d.apk` — hash verified identical |
| Live | **The first active-Story import in this project**, and both deployments |
| Hardware | **No line of D6A7d is verified.** `docs/D6A7D_DEVICE_CHECKLIST.md`; all *not attempted* |

### Previous milestone, for reference

| Field | Value |
| --- | --- |
| Task | D6A7c1 — corrections a review found in D6A7c, plus screenshots and screen recording turned back on |
| Application HEAD | `87cb1bbaa0df27da54eb0850c50f1759a07f5699` (`87cb1bb`) |
| Server HEAD | `f5c0b7d9a4010f7c012a2da1e854e1b8f3848865` (`f5c0b7d`) |
| Version | code 37, `0.13.12-d6a7c1` |
| Gate | 2148 Android unit tests, 0 failures; server 903 passed, 4 skipped |
| Hardware | Screenshots **confirmed working** by the D6A7d device report. Everything else still owed |

No production token, Meta credential, Telegram identifier, chat ID, thread ID, private link, VPS
address, Tailscale hostname, SSH host, pairing code, device token, cookie value, account name, file
name, content URI or media hash is recorded anywhere in this file.

## D6A7c1 — three collections that decided each other's fate, and a window that refused screenshots

D6A7c was implemented across a session boundary, committed, pushed and deployed. A review of the
committed code then found several correctness gaps, and the handset found one more that is not a bug
at all but a decision worth reversing.

### 1. Screenshots, screen recording and Recents — reported from the device

Android refused screenshots, blocked screen recording, and drew a **blank white card in Recents**.
Cause: `FLAG_SECURE` on the activity window — and separately `setSecure(true)` on the preview's
`VideoView` surface, which made any captured video black.

Both removed. **Nothing replaces them**: no secure window, no `setRecentsScreenshotEnabled(false)`,
no blur, no overlay, no substituted Recents preview, no per-screen variant.
`ScreenshotPolicySurfaceTest` fails the build on any of them, and the **four inherited guards that
asserted the old policy were re-scoped rather than deleted**, each carrying the reason.

> **It is not a substitute for redaction and weakens none.** No token, cookie or credential is
> rendered in plaintext anywhere — that is what makes a screenshot safe to share. A future
> secure-screen feature is an explicit user decision.

### 2. One shared boolean decided three collections

D6A7c tracked Sources, Review and History as independent collections and then read their success
from **a single mutable boolean they all shared**. `refreshAll()` starts all three, so a Sources
failure could mark History failed, a request that failed could settle `LOADED`, one that succeeded
could settle `FAILED` — and **which happened depended on completion order**.

Every load **returns** its own outcome now. The tests gate each gateway call by hand and open them in
a chosen order, because a race only *probably* exercised is not tested.

`busy` had the matching defect — the first operation to finish cleared it while others ran — and is
now a counter that cannot go negative, never reads false while anything is active, and releases
exactly one operation on every exit path including cancellation.

### 3. A collection never requested was "successfully loaded"

The entry path refreshed the connection and called the collection API **only if** the connection was
usable, but settled the collection `LOADED` either way. So an empty successful page, an unreachable
server, invalid pairing and no server configured were the same screen — the confusion the load phase
was introduced to end, reappearing one level down.

`BLOCKED` is its own phase now, `FAILED` is its own, and **only a request that actually returned
successfully** may say *there is nothing here*. D6A7c's harness always answered `serverStatus()`
successfully, which is exactly why none of its tests could reproduce this.

### 4. A flaky assertion in the upload gate

`a connection lost before the body completes` failed about **one run in three**: a two-megabyte body
cut mid-stream surfaces as `BodyIncomplete` or `ResultUnknown` depending on kernel buffering, and
**both are safe** — neither claims acceptance. It now asserts the property its own message always
claimed. A flaky gate makes every "N passed" in every milestone report worth less than it looks.

### Next device action (ask for exactly this)

Install from `/sdcard/Download/TelegramTopicUploader-0.13.12-d6a7c1.apk` **over** the existing app
and run `docs/D6A7C1_DEVICE_CHECKLIST.md`, **reading its first three notes first** — all three
describe correct behaviour that reads as broken.

**§B is the quickest and is the reported defect**: a screenshot on two screens, a screen recording
across two screens, a captured video preview that is not black, and a real Recents card. **§E1 step
32** remains the most valuable line available and still takes a real day.

## D6A7c — the screens that never asked, and a Story that outlives its own URL

**The device report.** Remote Sources showed no source although one existed on the server. Remote
History showed no history although twenty-five confirmed delivery operations existed. Pressing
**Refresh** in Remote Sources loaded both.

> **Nothing was broken on the server and nothing was broken in the transport.** The screens simply
> never asked. And that is two defects, not one — the second being why the first was so hard to
> see.

### 1. "Empty", "unasked" and "failed" were the same blank screen

The collections were initialised to `emptyList()`, so *"there is nothing here"*, *"nothing has been
asked yet"* and *"the request failed"* all rendered identically. Loading is a **state** now —
`RemoteLoadPhase`: `NOT_LOADED` / `LOADING` / `LOADED` / `FAILED` — and the rule the milestone asks
for falls out of it:

**"No sources", "No history" and "No review items" are reachable from exactly one phase**, `LOADED`.
A surface guard pins that each empty label is passed to exactly one composable, so a screen cannot
start drawing one directly again.

`failed()` is `copy(phase = FAILED)` — it replaces **nothing**, not the data, not `hasLoadedOnce`,
not the success timestamp. A momentary tunnel drop appearing to lose twenty-five confirmed
deliveries would have been the worse version of the original defect.

**Entry and resume load; a redraw does not.** `LifecycleResumeEffect` with a constant key fires on
entry and on each resume and never on a recomposition; the ViewModel refuses a duplicate anyway — an
in-flight set per collection plus a one-minute staleness bound. **No timer exists in the path**, and
a guard refuses `while (true)`, `Timer(`, `scheduleAtFixedRate` and `repeatOnLifecycle` in the
remote ViewModel.

Pull-to-refresh on all three screens through **one** shared wrapper, including when empty.

### 2. History cards carry a picture

The server retains one bounded, MIME-validated preview per delivered item, fetched **once at
discovery**, in its own quota'd store. It reaches the phone as **bytes from an authenticated
endpoint, never a URL** — an upstream Instagram address would work for about a day and then quietly
stop, and no model here has ever carried a media URL.

**No second image library.** The existing bounded `BitmapFactory` / `LruCache` approach is reused,
and the remote decoder holds **no network client of its own** — its only byte source is the gateway
every other remote call uses. Guards assert both.

> **Your existing 25 history rows will show placeholders, not pictures, and that is correct.**
> Previews are fetched at discovery and those deliveries predate the feature. Confirmed against the
> production database: `media with retained preview: 0`. **This will look like a bug on the
> device**, and the checklist opens by saying so.

### 3. Pinned posts — measured before anything was written

A sanitized probe of the exact installed extractor (gallery-dl **1.32.8**) inside the deployed
container, using the configured session: exit `0`, 60 URL records, **0 queue entries**, `date` on
**60 of 60**, a field literally named `pinned` **truthy on 3**, arrival order **not** newest-first
with one inversion, and **3 pinned posts printed before a newer post**.

Nothing in gallery-dl sorts. So `last_25` now means the twenty-five newest posts **by publication
time**, ordered on the server, and **the cursor names the newest *dated* post** — the half that
mattered more, because a cursor on an old pin would make the next check treat everything above it as
already seen. The `pinned` field is **never read**: it returns account identifiers, and a test
asserts that deleting it changes no ordering.

### 4. Stories — a switch, never a source type

Off by default, per source, Instagram profile only, refused **by name** elsewhere. Identity is
`story:<media_id>` per **frame** (the tray shares one reel-level `post_id`), namespaced so collision
with a feed shortcode is **decidable**. **No Story cursor**, written down as a decision. Media is
**staged at discovery**, so a Story in Review is still sendable after the Instagram copy expires.

Enabling on an **auto-send** source asks first and **sends nothing to the server until confirmed** —
a guard asserts cancelling has no path to a request. Disabling never asks.

### Two guards fired, both re-scoped rather than relaxed

- **The D5A pull-to-refresh count.** Six → **seven**, not nine, because the three Remote screens
  share one wrapper — and it now asserts that too.
- **The server's release-integrity test refused the release by name**, listing the three untracked
  new modules. Exactly as designed; that is the D6A4 outage's lesson working.

### And a correction worth carrying forward

**D6A7b reported "lint clean" and three warnings were in fact present** — two `PluralsCandidate` and
one `UnusedResources`, all on D6A7b's own strings, and `remote_source_next_check` was never
referenced even at its own commit. `lint` exits zero on warnings, so a gate that reads the exit code
passes while the project's zero-issue bar does not. **Read the report, not the exit code.** Fixed
here: two counting strings became proper plurals (Hebrew has a dual form, so `%d` was wrong for
exactly two) and the unused one was removed from **both** locales.

### Next device action (ask for exactly this)

Install `app-debug.apk` (`0.13.11-d6a7c`, code 36) **over** the existing app and run
`docs/D6A7C_DEVICE_CHECKLIST.md` — **reading its opening two notes first**, because both describe
correct results that read as bugs.

§A is the reported defect: **open Remote Sources and Remote History from a cold launch without
pressing Refresh**, and see the source and the 25 deliveries appear by themselves.

**§F1 step 40 is the single most valuable line in the milestone** — a Story left in Remote Review
until its Instagram copy has expired, then sent successfully. It takes a real day, and it is the
only proof that Story staging does what it exists for.

## D6A7b — a check with nowhere to put its result, and a profile gallery-dl never listed

**The device report.** An Instagram source was added successfully and appeared in Remote Sources.
Pressing **Check** showed *Checking* and it never settled into success or a classified failure.
Pending Review stayed at 0 and no posts appeared.

> **The obvious reading was wrong, and the production evidence says so.** Every check completed in
> **seconds** and answered `200`. The server was never stuck. Four separate causes.

### What the source was actually configured to do

`initial_import = last_25` — **not** `only_new`, so zero Review items was **not** expected. And:
`baseline_established = true`, `initial_import_accepted = 0`, no cursor, `consecutive_empty = 3`,
**zero items of any kind**. The requested history had been silently converted into "only new".

### 1. gallery-dl prints one pretty-printed array, not one document per line

`gallery_dl.job.DataJob` writes line-delimited JSON **only** when `output.jsonl` is configured;
otherwise it accumulates every message and dumps the lot at the end. `iter_records` parsed line by
line, so every line is a fragment and **not one is valid JSON** — zero records from a completely
successful run. `read_dump` parses the whole document first; the line form stays as a fallback.

### 2. A successful run that enumerated nothing is not an empty feed

`classify_dump` refuses unreadable output, an **in-band error record** (gallery-dl records an
extractor exception in the dump and *still exits zero*), and **queue entries with no members**. `[]`
remains the one honest empty feed and the only thing that may advance a baseline.

### 3. The real reason there were no members — the wrong gallery-dl mode

`instagram:user` **does not enumerate a profile.** It emits a `Message.Queue` naming the
sub-extractor that would, and stops. `--dump-json` prints that and exits zero.

> **`--resolve-json` follows it.** Same profile, same session: `--dump-json` → 142 bytes, 0 posts,
> empty stderr, exit 0. `--resolve-json` → 383,444 bytes, 30 URL records, **30 posts**.

Resolving costs ~1 s per file here (30 files 36.3 s, 120 files 129.5 s), so
`extractor_timeout_seconds` went 120 → **300** on measurement. Safe *because* a check no longer
holds an HTTP request open. **X and TikTok keep `--dump-json`** — no evidence says their extractors
queue, and the new classification now says so loudly if they do. Next exact action: one live check
of each, reading `queue_count`.

### 4. A requested history could never be retried

`_apply_first_scan` committed the baseline having observed **no posts at all**, so `last_5/10/25`
became `only_new` permanently — a baseline is never re-established and the frozen choice has no
update path. It now refuses to complete such a scan, and `repair_unfulfilled_initial_imports`
re-arms a stranded source: only a non-`only_new` choice, a committed baseline, **no accepted IDs, no
cursor, and no item of any kind**. The row is preserved as evidence. **It fired on production:
`count: 1`.**

### 5. A check is a durable row, not an open connection

The route performed the whole check *inside* the request. So a client that timed out or navigated
away had nowhere to read the result; a restart lost it; a second tap started a second extractor; and
the one answer the app got — *"Checking now."* — described a run that had **already finished**,
carried no counts, and left the card byte-for-byte unchanged when the answer was "nothing new".

`check_runs` + `0002_check_runs`. `check_now` starts a run and returns; `/sources/{id}/checks/latest`
reads it; a second request **joins** the live run under a partial unique index; a restart settles an
interrupted run as `interrupted` — which also releases that index, without which one crash would
block a source's checks forever.

Android: `checkNow` polls until terminal and reports one of five sentences; **both** branches refresh
the row, where the failure branch used to refresh nothing; and the card finally states whether a
check is running, what the last one did with counts, and whether the history has been imported.

### Live result

✅ `success_new_posts` in 160.0 s: **25 Review items, 25 accepted IDs, baseline established, cursor
written, 25 media rows.** The session **was accepted**.

⚠️ **The source is `review_mode = auto_send`, so all 25 were dispatched to its Telegram topic and
are `confirmed`.** Its own configured behaviour and the import it was asked for — but triggered by
the verification run the addendum required, not by a tap.

### Two corrections worth carrying forward

- **The jar was never the problem.** A throwaway probe that skipped `#HttpOnly_` lines made it look
  as though `sessionid` was missing. Those lines *carry* the session cookies — the prefix is curl's
  annotation on the domain field, not a comment — and `_parse_jar` has always read them. The
  completeness check added here stays as a guard, re-documented as one.
- **D6A7a shipped with ten stale version assertions.** They read `build.gradle.kts` from disk, and
  **Gradle does not track that file as an input to the unit-test task**, so a version bump leaves
  the task UP-TO-DATE and the final gate reports success without re-running them. Now re-scoped to
  "the version never goes backwards"; only `AppVersionTest` pins the exact pair. **Use
  `--rerun-tasks` for a milestone's final Android gate.**

### Next device action (ask for exactly this)

Install `TelegramTopicUploader-0.13.10-d6a7b.apk` **over** the existing app and run
`docs/D6A7B_DEVICE_CHECKLIST.md` §B first: press **Check** and confirm it settles into one of five
stated outcomes rather than sitting on *Checking*. `docs/D6A7A_DEVICE_CHECKLIST.md` is still owed
and is not superseded.

## D6A7a — a confirmed upload that came back, a deletion that stopped at the gate, and a queue that froze

**Four device reports in one session, and they are two causal chains rather than four bugs.** D6A7
had already been committed when they arrived, so this is a corrective milestone.

### Chain one — one stray row caused both A-defects

A confirmed upload still appeared in Review; pressing Upload produced the already-uploaded dialog;
choosing its permanent deletion did nothing to the file.

**Root cause of the Review row.** Every scan re-hashes and re-finalizes **every** document it
enumerates, including one whose confirmed source is still on disk. `finalizeLocked` reaches
`RoutingDecision.ManualReview` — the only answer a scan can get since D4B — and `upsertReviewJob`
looks for a placeholder to reuse with `findUnresolvedForMedia`, whose predicate is
`topicDestinationId IS NULL AND status = 'AWAITING_ROUTING'`. A confirmed job matches neither, so
nothing is found and a **second, brand-new `AWAITING_ROUTING` job** is inserted for media Telegram
already holds. It classifies as `WAITING_FOR_ROUTING`, so Review shows it as a new candidate.

**Root cause of the deletion, and the exact stage it stopped at.** That same placeholder made
`countOtherSourceDependentJobs` return 1, so `SourceDeletionGate.evaluate` answered
`Wait(WAITING_FOR_OTHER_JOBS)` and returned **before `markAttemptStarted`**. The Android document
provider was never called at all. This is the same one-line disagreement D6A5 repaired for the
*manual* path: `SourceDependencyPolicy` says a preparation needs the bytes only once it has named a
destination, and this SQL still counted every non-terminal row.

**Fixes.** `countPositivelyConfirmedForMedia` (strictly positive message ID **and** durable
timestamp) is consulted before either branch of `finalizeLocked` can write a placeholder, including
the hash-failure branch; a confirmed item returns the new `ScanFinalizeResult.AlreadyConfirmed`,
keeps its observed metadata, and is not pushed to `NEEDS_REVIEW`. The guard SQL now encodes
`SourceDependencyPolicy`. `retireUnresolvedForConfirmedMedia` retires already-existing placeholders
inside `reconcileDurableState`, at launch and on pull-to-refresh, touching only a row with no
destination, no evidence, no attempt, no claim, no dispatch and no completion.

**And a confirmed item keeps a home.** The folder page's Confirmed section now offers *Delete the
file from this device*, through `deleteConfirmedLocalSource` — the same use case, not a parallel
one — authorized by the job carrying the positive message ID with the destination frozen onto that
same row. A refusal names its stage (`confirmedDeleteStageLabel`) and reason
(`confirmedDeleteReasonLabel`) instead of one sentence covering three situations; a
`RETRY_AVAILABLE` outcome is reported as a retry, never as a success.

### Chain two — the queue could freeze with no action left

**Why the start could be silent.** `armPendingBatchStart` returned immediately when a start was
already armed — without re-attempting and without a word — and `tryConsumePendingBatchStart`
returned just as quietly when the window was not resumed and focused. A focus event that never
arrived left the flag set and killed the button for the life of the process. The window check itself
is necessary and kept (a UIDT job is only accepted while the app holds a focused window); what
changed is that a deferral is announced and a repeat press retries.

**Why cancellation stuck.** `requestStopAfterCurrent` had no status guard, so cancelling a session
the platform had accepted but never executed recorded a flag only the runner or a resume could
clear — and the runner was never going to run. `BatchStatusCard` then matched none of its branches
and rendered **no control at all**, while the retained active slot hides the Upload-queue button.
That is the reported dead end exactly.

**Fixes.** `startedAt` is written only by the runner, from inside the JobService, so a null value is
durable evidence that nothing was acquired or sent. `cancelCurrentAndPause` withdraws such a session
outright — slot released, item states preserved, **no `RESULT_UNKNOWN`, no Telegram request**. The
boolean became `BatchCancelResult` (cancelled-and-paused / unstarted-cancelled / already-stopped /
nothing-active / failed), because `false` used to be announced as *"there is no paused upload to
resume"*. The card's branch set is now total and always leaves one control or one sentence.

**Recovery for rows already stranded as `UPLOADING`.** `reconcileExpiredClaims` was reachable only
from a single upload, a batch run or an album send — all of which a stranded row disables, because
it is ineligible for Upload now and drops the eligible count that draws the Upload-queue button. It
now also runs inside `reconcileDurableState`. Rules unchanged and evidence-based: no request-start
evidence → back to queued without spending an attempt; dispatch evidence → `RESULT_UNKNOWN`, never
resent; confirmation → confirmed. A `RESULT_UNKNOWN` row stays unretirable by design.

### What did **not** change

Room schema. The single statement that writes `UPLOADING` (`markDispatchStarted`, which also stamps
`dispatchAttemptId` and `dispatchStartedAt`). Snapshot creation still touches no upload job. No
confirmation is ever rewritten, no reservation released, no upload-job row deleted, and the database
is never recreated or cleared. No server code.

### New tests

`ConfirmedSourceDeletionTest` (13) and `D6A7aSurfaceTest` (11), plus additions to
`RoomScanRepositoryTest`, `StateRepairTest`, `RoomBatchRepositoryTest`, `BatchUploadCoordinatorTest`,
`MainViewModelTest` and `D5ASurfaceTest`. Three pre-existing tests changed **because the behaviour
they pinned was the defect**: the folder page's Confirmed branch is no longer a do-nothing branch, a
`Retried` deletion is no longer announced as a success, and a stop request can no longer be recorded
on a session that never started.

### Next device action (ask for exactly this)

Install `TelegramTopicUploader-0.13.9-d6a7a.apk` **over** the existing app — do not uninstall, do not
clear data — and run `docs/D6A7A_DEVICE_CHECKLIST.md`. The two lines that matter most are: a
confirmed file is absent from Review after a rescan while still shown under Confirmed on the folder
page; and its local copy actually disappears from the **Android file manager** after the delete.

## D6A7 — a source's refusal is not the server's silence

**The device report.** Validating an Instagram Remote Source displayed the Hebrew equivalent of
*"The server refused the request"*. The global server state then changed from connected to *"Paired,
but the server could not be reached."* Pressing **Retry** restored it immediately.

**None of that was an outage.** A structured rejection is proof the server *was* reached — it had to
be, to produce one.

### Android root cause

`RemoteViewModel.handleFailure` ended with `_connection.value = connectionFor(baseUrl, failure)` for
**every** failure of every kind. So an answer from the server, carrying the server's own error code,
over a connection that plainly worked, was recorded as proof of the opposite.

What that costs is not cosmetic: a banner that cries outage during ordinary refusals is a banner
nobody reads during a real one, and it sends somebody to debug a tunnel that was working.

### The rule, and where it now lives

**A request that was *answered* is proof of reachability, whatever the answer said. Only a request
that never got an answer is evidence about reachability at all.**

`domain/remote/RemoteConnectionEvidence.kt` — `RemoteConnectionReducer`, pure, no Android types, no
clock, no coroutines, total over state × evidence. `connectionFor` is **gone**, and a source scan
asserts it stays gone and that no screen or repository writes the connection state.

| Situation | Global state | Test |
| --- | --- | --- |
| DNS / TCP / TLS / no route / timeout | **unreachable** | ✅ |
| Device auth `401` | **pairing required** | ✅ |
| Structured `4xx` from a source validation | **unchanged** — only the operation refuses | ✅ |
| Server `5xx` | **reached**, its own distinct sentence, never unreachable | ✅ |
| Platform challenge, rate limit, inaccessible source, malformed upstream, unsupported type | arrive as **successful** calls carrying an outcome; move nothing | ✅ |
| Cancellation (user left the screen) | **unchanged** — a non-event | ✅ |
| Retry after each of the above | ✅ | ✅ |

### Four supporting changes

- **`RemoteFailure.ServerError(status, code)`** splits a `5xx` from a considered refusal. They used
  to be the same value, so an internal server error was indistinguishable from a deliberate "no".
- **Retry is no longer a repair.** When an answered request finds the app believing the server is
  gone, the truth is re-established from **one authoritative status call** — not invented from a
  refusal, and not waiting for the user to press anything.
- **The server's sanitized code is kept and shown**, in brackets after the sentence. It was parsed
  and then discarded behind one generic message, which is exactly why the reported refusal could not
  be identified from the phone and had to be recovered from the server's log.
- **`ProvenConnection` is persisted** — address, server version, timestamp; nothing secret — and
  restored on launch. A cold start with the tunnel down used to be indistinguishable from a phone
  that had never been paired.

### The Instagram refusal itself — diagnosed separately, and it was never a cookie problem

Root cause was **on the server**: the runtime tmpfs was mounted root-owned while the service runs
unprivileged, so every path-based connector — X, Instagram, TikTok — failed on every call with an
uncaught `PermissionError` that became a 500. 9GAG was unaffected because its cookies are a header
and never become a file. **Verified fixed on the deployed host: Instagram's material is now
`ready`.** Full account in `agent-memory/telegram-remote-sources/cc-latest.md`.

**Nobody was asked to export cookies, and nobody should be** until evidence shows the configured
session is itself missing or rejected. It was not.

### Also in D6A7

- **Media shared into the app** becomes an ordinary Review item. A shared **link** is reported as a
  link and never fetched — fetching it would be the scraping route 9GAG is refusing. **Not a
  connector**, and never to be described as one.
- **One Instagram move, two surfaces.** `InstagramQueueAvailabilityPolicy` gives one answer,
  computed once, read by the Review card and by Preview. A refused move shows its reason.
- **Fixed by its own failing test:** dropping the one already-queued item the bulk confirmation
  warned about re-prepared through the *route-only* path and silently cleared the pending send.

### Still open

- [ ] **Nothing is hardware-verified.** See `docs/D6A7_DEVICE_CHECKLIST.md`.
- [ ] **The live Instagram validation answer is unknown** — the 500 hid it. The first honest
      validation is new evidence; record the **exact bracketed code**.
- [ ] **`BulkSendDestination.Shared` and `.Divergent` are unreachable from Review.** An item with a
      destination is not manually resolvable, so it is never selectable there. The two branches in
      `ReviewGridScreen` cannot render today. **Next exact action:** either feed the policy from a
      surface that can hold pointed items, or withdraw the branches and their strings.
- [ ] **Official Meta publishing stays blocked on Meta authorization**, not completed.
- [ ] **9GAG automatic discovery stays platform-blocked** by the D6A6a anti-bot challenge.

## D6A6a — the platform list contradicted its own validation

**Reported from the device after installing `0.13.6-d6a6` / code 31.**

### Hardware and live evidence, 2026-07-27 — what the device proved

- **D6A6 is installed.** `0.13.6-d6a6` / code 31 confirmed in Settings.
- **9GAG Interest** Check source displays the challenge sentence.
- **9GAG profile** Check source displays the same classification.

Together, and this is the first live proof of the D6A6 fix:

1. the former generic *"the server could not reach the platform"* mapping is **gone**;
2. **both** 9GAG source types reach the deployed connector;
3. the **cookie material is usable**;
4. both live paths are refused by the platform's **anti-bot challenge**;
5. the Android challenge message **renders correctly**.

**Live 9GAG discovery remains blocked by the platform.** That is unchanged and is not a code defect.

### The contradiction, and the root cause

The Remote Sources **platform list** persistently said *"Rate limit — the platform asks the server to
slow down"*, contradicting every validation of the same platform.

**The whole path was traced before anything was changed**, because the obvious suspicion — a stale
signal outliving a newer one — would have pointed at the server:

| Layer | What it actually held |
| --- | --- |
| Connector validation | `challenge / anti_bot_challenge` |
| Persisted `PlatformHealth` (production) | `last_signal='challenge'`, `blocked_until=None`, `strong_signal_count=0` |
| `PlatformStatus` serialization | `last_signal: "challenge"` |
| Android parse | `RemoteBackoffReason.CHALLENGE` — correct |
| **Android `readiness()`** | **`CHALLENGE \|\| RATE_LIMITED -> RATE_LIMITED`** ← the defect |

> **No rate-limit signal existed anywhere to be stale.** `blocked_until` was null and the
> strong-signal count was zero, and the scheduler had never run for 9GAG. Every server-side
> hypothesis — a stale signal, a bucket contamination, an ordering hazard — was ruled out by
> evidence rather than by argument.

**Root cause: `RemotePlatformReadiness` had no `CHALLENGE` member.** The two signals share the
server's **backoff ladder** — correct, both mean "stop asking for hours" — and the app mirrored that
grouping into the sentence a person reads.

> **A scheduling bucket is not a sentence.** This is D6A5's own rule — *known classifications never
> collapse into one generic sentence* — failing in miniature, one enum member short. The test that
> made it possible is the one that had to change: it asserted both signals produced `RATE_LIMITED`,
> and the production code obliged.

### The fix, and what did not need fixing

- `RemotePlatformReadiness.CHALLENGE`, its own state with its own Hebrew and English sentence.
- It joins the states permitting a new source: a challenge is a refusal the platform may stop
  making, unlike a state an operator fixes on the server.
- **A live backoff window no longer hides the reason for it** — a challenge with a blocked window
  still reads as a challenge, because "wait" is not the reason.
- **No server production change was required.** The ordering rules are now pinned by
  `tests/test_platform_signal_ordering.py` (11 tests): both writers stamp the current instant, so a
  stale signal cannot overwrite a newer one **by construction** rather than by a comparison somebody
  has to remember; a genuinely newer result wins in either direction; and a successful validation
  clears a challenge but never a rate limit.

**Still device-unverified:** that the list now reads *human-verification challenge*. Backlog row 58.

### Release

| Field | Value |
| --- | --- |
| App HEAD | `fe275766bb6e207a56e970f4e89059545afac256` |
| Server HEAD | `7564912c24c121c2c021887e8a5621b91f8d5df4` — **deployed and verified** |
| Version | code 31 → **32**, `0.13.6-d6a6` → **`0.13.7-d6a6a`** |
| Room schema | **13 — unchanged.** No migration runs. |
| Android tests | **1919, 0 failures.** Lint clean. Both assembles succeed. |
| Server tests | **702 passed, 4 skipped.** `ruff`, `mypy`, preflight clean. |
| APK | `TelegramTopicUploader-0.13.7-d6a6a.apk`, 15,961,780 bytes, SHA-256 `217ac57a9c037deb89864623ea9fb3b68a36069dc247ae068d46149bbaa9b47a`, **byte-for-byte identical**, signer unchanged |
| Production | `7564912…` deployed; health/ready 200, unauthenticated 401, **loopback-only**, `devices` still **active: 1**, and the persisted `challenge` signal survived the deployment unchanged |

## The D6A6 root cause — one format mismatch, two symptoms

**Reported:** after the 9GAG cookies were imported, **Check source** returned the same generic
*"the server could not reach the platform right now"* for an intended Interest source **and** for an
ordinary profile source.

**Found, and it is exact.** `remote-sources-configure ninegag-cookies` stored the file's bytes
verbatim, and `NineGagAdapter` injected those bytes into an HTTP `Cookie` header. The operator
supplied the ordinary thing — a **Netscape `cookies.txt`**, which is exactly what the X, Instagram
and TikTok connectors want, because gallery-dl and yt-dlp consume a jar *file*. A jar is multi-line
and tab-separated, which is not a legal header value, so `httpx` raised `LocalProtocolError`
**before a byte left the process**. That exception is an `httpx.HTTPError`, the adapter caught it
alongside genuine transport faults, and classified it `TEMPORARY_FAILURE / transport_failure`.

**Stage reached: cookie-file materialisation / header construction.** DNS, TCP, TLS and HTTP were
never attempted — which is precisely why the Interest and the profile produced *identical* messages
and looked like one bug.

> **The lesson worth keeping: one connector wanting a header string while four want a jar file is a
> trap, not a contract.** Both forms are read now, and an unusable file is refused **at import
> time** rather than days later as an unexplained outage.

Two further corrections came out of it:

- **`#HttpOnly_` lines are cookies, not comments.** Skipping them yields a header that looks fine
  and authenticates nothing. A test caught it.
- **A challenge page is a challenge whatever status carries it.** 9GAG serves its anti-bot page with
  a **403**; classified from the status alone it read as "configure a session", which is useless
  advice to an operator who already had one. The body is inspected before the status now.

### Live status, verified against the deployed build

| Check | Result |
| --- | --- |
| Session material readable | **yes** — `session_usable: True`, no credential error |
| 9GAG profile validate | `challenge / anti_bot_challenge` |
| 9GAG Interest `hot` and `fresh` | `challenge / anti_bot_challenge` |
| Site root from the host | **200** |

**The defect is fixed and proven fixed in production** — the message changed from "unreachable" to a
named platform refusal. **9GAG nonetheless refuses this host**: deep paths are challenged while the
root is served. That is the platform's decision, and this connector deliberately has no challenge
solving, no proxy rotation and no retry-until-allowed. **Live 9GAG discovery remains blocked.**

## 9GAG Interest — a source type, not a mode flag

`SourceType.NINEGAG_INTEREST`, distinct from the account type. An Interest URL submitted as a
profile, or a profile URL submitted as an Interest, is **refused by name** in both directions; a
bare word is ambiguous between the two and is resolved only by the type the caller explicitly chose.

**Feed modes were proved against the live site rather than remembered:** `/hot` and `/fresh` answer
with the page's own payload; `/trending`, `/top` and `/new` answer **404**. The bare path is the
site's default and is stored **explicitly** as `hot`, so a source cannot silently change which feed
it follows if the site's default moves.

The Interest payload is structurally identical to the account payload with `interest` where
`profile` would be — same `posts` array, same `nextCursor` shape — which is exactly why validation
checks for its *own* object: a request built for the wrong one would otherwise parse.

**A defect found while writing it:** a reserved path segment could become an account name. A
trailing slash was enough — `interest/` reduced to the bare word `interest`, no prefix matched, and
it became an account named "interest", silently, with an ordinary-looking source row to show for it.

**Conformance coverage is keyed by source type now, not by platform.** A per-platform map would have
run every property against the account feed only and reported itself complete while the Interest
feed had no coverage at all.

## Pulled forward from the backlog

- **Remote `RESULT_UNKNOWN` resolution.** Two answers, neither a resend: *delivered* confirms the
  item without inventing a message ID — the operation row keeps `RESULT_UNKNOWN`, so the evidence
  trail still says exactly what Telegram told this server, which was nothing — and *not delivered*
  returns it to Review, where sending again is an ordinary deliberate action.
- **The per-item Ignore race.** Four sanitized reasons instead of one generic sentence.

## Instagram publishing — the local, manual route

A dedicated destination, **פרסום באינסטגרם / Instagram publishing**, over its **own table**.

> **It is deliberately not a flag on an upload job, an ignore marker, a reservation or a deletion
> tombstone.** Every one of those already means something about *Telegram*, and overloading one
> would make a queued item look confirmed, ignored, reserved or deletable to code that has never
> heard of Instagram.

- `ACTION_SEND`, exact MIME type, `content://` URI, `FLAG_GRANT_READ_URI_PERMISSION`, matching
  `ClipData`. A SAF grant cannot be re-granted onward, so bytes are staged into a **bounded**
  app-cache copy behind a **non-exported** FileProvider serving exactly one cache directory. No
  legacy filesystem URI, no broad storage permission, no media-index registration, nothing in
  Downloads.
- Eight distinct outcomes, because "Instagram is not installed", "the folder grant is gone" and
  "the file is missing" have three different fixes.
- **Opening Instagram is never publication.** The published state is reachable only from the user's
  explicit confirmation, is named `USER_CONFIRMED_PUBLISHED` so no future reader mistakes it for
  evidence, and is undoable. The durable statement carries the rule — `WHERE publishedConfirmedAt
  IS NULL` — so no caller can forget it.
- Removing from the queue deletes one row and **never** a file.

### The official Meta publisher is NOT implemented

Requested mid-milestone and delivered in two halves, on purpose.

**Implemented and tested:** the durable vocabulary the specification names — 16
`InstagramPublishState` values, six `InstagramPublicationType` values, `InstagramAccountType` — and
`domain/instagram_publishing.py`, which holds every rule decidable from state alone: Story
eligibility from **Meta's** account type rather than a local setting, the bounded missed-schedule
grace period, carousel bounds, cancel and retry safety, and the classification that turns an
undetermined publish into `RESULT_UNKNOWN` rather than a retry. 23 tests, none of which can produce a
published state — itself asserted.

**Not implemented:** the OAuth flow, the container-workflow executor, server-side scheduling, and
the Meta-readable temporary media delivery boundary.

> **Why, and it is a judgement to preserve rather than re-litigate.** None of them can be exercised
> without the user's Meta App and authorization. A publishing client that has never once run against
> Meta is not something to deploy to a production server on the strength of mocked tests — and the
> parts that are dangerous to get wrong **and** verifiable without an account are exactly the parts
> that were built.

Tracked as rows 43–54 in the application's `TODO.md`. Rows 47–48 are blocked on the user. **No Meta
app secret or access token may ever be requested in chat.**

## Room schema 12 → 13 — the first move since D5C

One new table, `instagram_publish_items`. **Purely additive**: the migration is asserted to contain
no `DROP`, `ALTER TABLE`, `DELETE FROM` or `UPDATE`, so an upgrade cannot lose a folder grant, a
destination, a queue item, a confirmation, an ignore marker or a deletion tombstone.

It was unavoidable, and the reason is worth keeping: *"the user set this aside to publish
themselves"* is a fact about a media item that **no existing column can hold**, and every candidate
already means something about Telegram.

## Guards re-scoped, never deleted

Nine of them: the schema pins across seven files, the manifest provider pins, three `.delete()`
scans, the media-kind scan, the Preview outbound scan, and two counts. Each states its reason, and
`D6A6SurfaceTest` is the other half — it pins the new capability to the one file that has it and
asserts **Preview itself** still cannot share a document.

**Several fired on this milestone's own comments rather than its code** — `MediaStore`, `token`,
`password`, `file://` all appearing in prose explaining that the feature does *not* do those things.
Per the project rule the comments were reworded, never the guards exempted. It happened four times;
expect it again.

## Post-D6A5 hardware result — the oldest defect in this project is closed

**Reported by the user on 2026-07-27, after D6A5 was installed.**

- `0.13.5-d6a5` / versionCode **30** was installed over the existing app, and **the Settings version
  row was read on the device.** That is simultaneously the proof the install took and the hardware
  verification of the D6A5 About row.
- **Manual permanent deletion without upload now SUCCEEDS on the physical device.** The source
  disappeared from **both the application and the Android file manager** — checked outside the app,
  which is the only evidence that counts for a deletion.

**This closes the defect the project has been chasing since D6A.** It was "fixed" in D6A, again in
D6A2, again in D6A3, diagnosed correctly in D6A4, and actually fixed in D6A5, where the cause was
one line: `SOURCE_DEPENDENT_STATUSES` included `DISCOVERED`, `AWAITING_ROUTING` and `READY`, which
is exactly what every un-uploaded item has, so the gate refused before the provider was asked.

> **D6A4's diagnosis was right, and it is the lesson to keep.** The *absence* of the second sentence
> was the finding. A refusal that cannot say which stage it reached is a refusal nobody can act on,
> and adding the stage is what made the next session look at the gate instead of at the provider.

**Keep these two apart.** Deletion **after a Telegram-confirmed upload** was already hardware-verified
**separately and earlier**; it was never the broken path. It counts *other* jobs and excludes the one
that licensed it. **They are different code paths with different evidence and must never be merged
into one claim** — conflating them is how the working path nearly got rewritten to fix the broken one.

Still unverified from D6A5: confirmed-versus-queued, the Failed row's removal, the Review row's
**Do not upload**, Preview from a folder, orphan reservations, and the five-platform list.

## Previous milestone: D6A5 — the sections below are D6A5's record, kept for context

## This session was interrupted and resumed — what survived

The Termux process was killed mid-milestone. The recovery is worth recording, because the state it
left is a shape that will recur.

- **The server work was committed and pushed** (`cb01747`) and needed nothing further. It was not
  redone.
- **The Android work existed only in the working tree** — 52 modified files, 12 new ones, nothing
  staged, nothing committed. All of it was preserved and continued.
- **`TODO.md` and the device checklist already claimed results that had not happened.** The
  checklist said *"The APK is already on the device, in Downloads"* and TODO claimed *"Lint: no
  issues"*. Neither was true: no D6A5 APK existed anywhere, and the last lint run had reported an
  `UnusedResources` warning. **Prose written ahead of the fact is the thing to distrust on
  resumption**; artefacts on disk are what to read.
- **What the artefacts actually showed:** the unit-test XMLs were current with the sources and
  green; `lint-results-debug.xml` predated the last two source edits; `app-debug.apk` was byte-size
  identical to the **D6A4** build, so `assembleDebug` had never run for D6A5.
- **`assembleDebugAndroidTest` did not compile at all.** Seven `androidTest` fixtures still called
  the pre-D6A5 `RoomScanRepository` constructor, which had gained `duplicateOperationDao` and
  `albumDao`. Only the unit-test fixtures had been updated. Fixed in this session.

## Live evidence — what the device reported, and what it turned out to be

Two reports opened the milestone, and they point in opposite directions:

- **A media item already uploaded and confirmed was refused as "already queued for that topic"**,
  with an **empty** Upload Queue. The block was right; the sentence described a row that did not
  exist. `assessOne` answered `ALREADY_QUEUED` for three different situations — a live sibling job,
  **any** non-released reservation, and a byte-identical selection mate — and Telegram confirmation
  took the second branch.
- **Manual permanent deletion, with no upload, said nothing was deleted and the file stayed.** Root
  cause is one line: `SOURCE_DEPENDENT_STATUSES` included `DISCOVERED`, `AWAITING_ROUTING` and
  `READY`. Every local item that has never been uploaded has a job in one of those — that is what
  puts it in Review — so the gate refused **before the provider was asked**. **D6A4's diagnosis was
  exactly right: the absence of the second sentence was itself the evidence.**

Four more arrived from the device while the milestone was being written:

- **No version anywhere in the UI**, so no hardware report could say which build it was about.
- **A terminal Failed item with no action on it.** The retirement mechanism existed and worked; the
  row simply drew nothing when `SafeRetirementPolicy` refused, which is indistinguishable from
  broken.
- **A Review item with no action that removed it from Review.** Review's *attention* rows are drawn
  by a different card that offers exactly one recovery action — rescan, or reauthorize — so an item
  whose reason was neither had no way out at all.
- **Preview from inside a folder did nothing.** `ReviewPreviewOverlay` was hosted by exactly two
  routes, Review and the duplicate-group page. The folder route had **no host**, so the card's tap
  set a job ID that nothing ever drew.

**Authoritative and preserved:** deletion *after* a Telegram-confirmed upload works on hardware, and
external deletion followed by a scan reconciles correctly. Neither was rewritten. The post-upload
path counts *other* jobs and excludes the one that licensed it — `AND id != :excludingUploadJobId` —
which is precisely why it worked while the manual one did not.

## 1 — confirmed is not queued (Android)

`DestinationRelationship` distinguishes all nine states: active preparation, upload in progress,
Telegram-confirmed, `RESULT_UNKNOWN`, retryable failure, permanent failure, retired preparation,
orphan reservation, and no relationship. `DestinationRelationshipPolicy` is a pure function and the
**only** place the three facts are combined, so Preview, Review, the folder page, the duplicate rows
and every bulk flow read one plan. `preview_notice_already_queued` is reachable from exactly one
relationship and `D6A5SurfaceTest` parses the mapping out of the source to prove it.

A confirmed item gets a **dialog**: it states the confirmation, says whether the local file is still
there, and offers delete / keep / choose a different topic. It creates no second operation, alters no
confirmation, touches no History, and contacts Telegram at no point.

## 2 — the manual deletion reaches the provider (Android)

`SourceDependencyPolicy` distinguishes a preparation that has committed to a destination from one
that has not; Telegram evidence outranks any status. The safety boundary is unchanged: one exact
recorded document, its granted tree, no filename search, no folder enumeration, no recursion, no raw
path, no MediaStore, no alternate candidate. A **proved** deletion or absence reconciles through the
same reconciliation a scan runs, so the item leaves Review without a rescan; a refusal reconciles
nothing.

## 3 — orphan reservations (Android)

`OrphanReservationPolicy` releases only what it can prove. Never a reservation belonging to an active
job, a running upload, a `RESULT_UNKNOWN`, a confirmed upload, an unresolved album member or batch
operation, and never one carrying a Telegram message ID. One guarded statement, one caller.

## 4 — five platforms (Android)

Reddit, X, 9GAG, Instagram and TikTok are all selectable; the server stays the authority and an older
server still hides the two newest. Eight platform states, each with its own Hebrew and English
sentence; the generic one is reachable from exactly one branch — a platform this build has never
heard of — and a test asserts that count is 1. Per-platform setup commands always name a **path**,
never a value. `RemoteMediaKind.ANIMATION`, which the server has produced since D6A4.

## 5 — the version is on screen (Android, new)

Settings shows `versionName` and `versionCode` read from the **installed package** through
`PackageManager` — `PackageInfoCompat.getLongVersionCode`, so no `NewApi` and no deprecation at
minSdk 23.

**`BuildConfig` was considered and rejected**, and the reason is the point of the row: it records
what the *source tree* was compiled as, so it would report the new version even when the APK on the
device is the old one — exactly the confusion the row exists to end. A surface test fails the build
if any source file or either strings file ever carries a version literal of its own.

## 6 — a failed item can be removed (Android, new)

The row now **always** draws the control when removal means anything, and draws it *disabled with
its sanitized reason* when the policy refuses. A control that silently vanishes reads as broken —
this project already says exactly that on the Review card about permanent deletion.

`removeFromActiveProcessing` is strict retirement first and, **only** on
`NOT_SAFELY_RETIRABLE`, a dismissal that sets `RETIRED` while **retaining the reservation**.

> **The trade is the whole design.** Retirement is strict about the recorded error code *because it
> releases the reservation*, and a released reservation is what would permit a second send of the
> same bytes to the same topic. A dismissal keeps that reservation, so the guard the strict rule was
> protecting still stands and the code check has nothing left to defend.

Everything that could mean Telegram holds the media is still refused, and refused first: any stored
message ID or confirmation, `RESULT_UNKNOWN`, and any live or stale execution claim. The durable SQL
re-asserts all of them, so the relaxed Kotlin rule cannot widen what the database will move. No
status but `RETIRED` is written — the recorded failure, the attempt count and the batch outcome are
all kept.

## 7 — a Review item can leave Review (Android, new)

`ReviewIgnorePolicy` gates **Do not upload** on Review's attention card: refused for a positive
confirmation, for `RESULT_UNKNOWN`, and for anything in flight, each with its own sentence. It is
safe to offer on a row with no other action precisely because it commits to nothing — the file is
untouched and Restore undoes it. **It is not a deletion and is never called one.**

## 8 — Preview from a folder (Android, new)

The folder route now hosts the **same** `ReviewPreviewOverlay`, inside its own `Box`, so Back and
Close return to the same folder page with `listState` intact. A second player was deliberately not
written: one overlay means one autoplay policy, one zoom, and one D6A2 ownership rule, so another
item's completing upload still cannot close this Preview.

`observeAllReviewRows()` has no `WHERE` clause, so the resolved row exists for **every** upload job —
which is why confirmed, ignored and queued folder items are all previewable now that something draws
them. `previewAvailable` additionally requires a job identity, so a card never offers a Preview the
projection cannot honour.

## Tests and exact results — D6A6

| | |
| --- | --- |
| Android unit tests | **1913, 0 failures** (1869 at D6A5) |
| Android lint | **No issues found** |
| `assembleDebug` / `assembleDebugAndroidTest` | success — instrumentation **compiled only**, never run |
| Server tests | **691 passed, 4 skipped** (668 at D6A5) |
| `ruff format --check`, `ruff check`, `mypy` | clean, 74 source files |
| `scripts/release-preflight` | 42 first-party modules, all present |
| `bash -n scripts/deploy-production`, `git diff --check` | clean, all three repositories |

**The known MockWebServer flake recurred**, as documented: `TelegramMediaRepairGatewayTest` and
`TelegramMediaUploadGatewayTest` failed under the parallel run and passed in isolation and on a
clean re-run. The Telegram transport had **zero diff** this milestone — only `transport/remote/`
changed. Re-run before treating one as real.

## Deployment — done, and verified

| Check | Result |
| --- | --- |
| `remote-sources-ctl version` | **`a985e2da51c7681efbb6c036e3b96e4d31920f26`** — the exact pushed HEAD |
| `GET /api/v1/health` / `/api/v1/ready` over loopback | **200** / **200** |
| `GET /api/v1/sources` unauthenticated | **401** |
| Application port | **loopback only** — the `:8099` bind is `127.0.0.1`, and the only non-loopback listeners are `sshd` and `tailscaled` |
| `remote-sources-ctl devices` | total 4, **active: 1** — the pairing survived |
| Credential presence | `telegram/bot_token` **set**, `ninegag/cookies` **set** — both preserved across the deployment. The three new `instagram_publisher/*` refs correctly read **not set** |

**No secret value was displayed at any point**, and no credential was requested, read or handled.

## APK identity (debug development signing only)

| | |
| --- | --- |
| Path | `app/build/outputs/apk/debug/app-debug.apk` |
| Bytes | 16,941,720 |
| SHA-256 | `fbcf8f8aaa64e2f25c4744dd7bdab46a1b45daa1ae5e0e326a810f136469b18f` |
| Signer SHA-256 | `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4` — **unchanged since D5A** |
| Application ID | unchanged |
| versionCode / versionName | **31** / **`0.13.6-d6a6`**, read back from `output-metadata.json` |
| Copied to Downloads | `TelegramTopicUploader-0.13.6-d6a6.apk` — **byte-for-byte identical**, `cmp` clean, same SHA-256 |

**Install over the existing application. Do not uninstall and do not clear app data.** The schema
moves 12 → 13 on this install; it adds one table and touches nothing else.

## Hardware evidence, exactly as it stands

- **Proven on hardware:** pairing, authenticated requests, the D6A3 destination selector, deletion
  **after** a confirmed upload, external deletion followed by a scan, the D6A5 Settings version row,
  **manual permanent deletion without upload**, **the D6A6 install**, and — new — **both 9GAG source
  types reaching the deployed connector and rendering the challenge message**.
- **Proven live (server + platform):** the 9GAG session material is read correctly; both 9GAG paths
  return `challenge / anti_bot_challenge`; the deployment reports its exact commit; health and
  readiness 200 over loopback; unauthenticated 401; loopback-only exposure; pairing preserved.
- **Blocked by the platform, not by this code:** live 9GAG **discovery**. Both paths are challenged.
- **Never checked on a device:** the D6A6a platform-list sentence (row 58); D6A6's source-type and
  feed-mode choosers, the Ignore-race reasons, the whole Instagram publishing queue, and the
  **12 → 13 migration**; D6A5's confirmed-versus-queued dialog, the Failed row's removal, the Review
  row's Do not upload, Preview from a folder, orphan reservations, the five-platform list;
  everything in D6A4 and D6A2.
- **Not implemented, so not verifiable:** automatic publishing through Meta's official API.

**Keep these apart.** *Implemented* / *deployed* / *installed* / *hardware-verified* /
*live-verified* / *successful discovery* are six different states, and 9GAG currently sits at
"deployed, installed, hardware-verified that it reports a refusal correctly, and **not** discovering".

## Next device action (ask for exactly this)

The server is deployed and healthy; **nothing needs doing on the VPS.**

1. Install `TelegramTopicUploader-0.13.7-d6a6a.apk` from **Downloads**, over the existing app.
2. **Settings first** — `0.13.7-d6a6a` / `32`. **No migration runs**; the schema stayed at 13.
3. **The one new check, §3a of the checklist:** open **Remote sources** and read the 9GAG row. It
   must say *אתגר אימות אנושי* (human-verification challenge), **not** *הגבלת קצב* (rate limit).
   Refresh, then force-close and reopen: the sentence must not change.
4. Everything else in `docs/D6A6_DEVICE_CHECKLIST.md` that D6A6 left unverified — the source-type
   and feed-mode choosers, the Ignore-race reasons, and the whole Instagram publishing section,
   where **step 23** (the file survives "remove from publishing") is the one that matters.

**Already verified on 2026-07-27 and not worth re-running:** the D6A6 install, and that both 9GAG
source types reach the connector and report the challenge.

## Env notes (still current)

- `GRADLE_USER_HOME=/root/.gradle ./gradlew --offline …`; `keytool -printcert -jarfile <apk>`.
- **`lintDebug` takes ~3–4 minutes.**
- **`uv` is not installed.** Use the server repo's `.venv/bin/{ruff,mypy,pytest}`.
- **`rsync` is not installed** in this environment. The deploy tests ship a Python `rsync` stub that
  honours `--exclude` for both copy and delete.
- **The server venv carries an editable install pointing at the checkout**
  (`_editable_impl_remote_sources.pth`). Any test about what a release *ships* must assert the loaded
  module's path, or the checkout answers the import and the test is worthless.
- **`python3 -I` ignores `PYTHONPATH`.** Insert the path with `sys.path.insert` inside the `-c`
  snippet.
- **`kotlin.test` is not on the unit-test classpath.** Use `org.junit.Assert`.
- **minSdk 23 means no `java.time`**; no desugaring artefact in the offline cache.
- **`UnusedResources`, `PluralsCandidate`, `NewApi` fail the zero-issue bar.** Removing a UI form
  means removing its strings from **both** locales — `LocalizationResourcesTest` compares key sets.
- **An apostrophe in an Android string resource** ("server's") is an *"Invalid unicode escape
  sequence"* build failure. Rephrase rather than escape.
- **Annotations must stay adjacent to their function.** Inserting a helper between `@StringRes` /
  `@Composable` and its target is a lint failure or a compile error.
- **A doc comment can trip a source-level guard.** Reword the comment, never exempt the guard.
- **D6A6: a source-level guard will fire on your own comments.** `MediaStore`, `token`, `password`
  and `file://` all appeared in prose explaining that a feature does *not* do those things, and each
  failed a guard. Reword the comment; never exempt the guard. It happened four times in one
  milestone.
- **D6A6: a backtick-quoted `image/*` inside a KDoc closes the comment.** The `*/` terminates it and
  the file stops parsing several lines later with a confusing error. Write "a wildcard" instead.
- **D6A6: `git status` clean is not `release-preflight` clean.** The preflight reads `HEAD`, so a new
  module that is staged but not committed still fails it. Run it against `git write-tree` before the
  commit exists, which is what the *test* does.
- **D6A6: the androidTest source set is not compiled by `testDebugUnitTest`.** D6A5 shipped with it
  broken for a whole session. Always run all four Gradle tasks.
- **Surface tests pin the version literal** — eleven of them at D6A4, and D6A5 adds the opposite
  guard: no *production* source or strings file may contain a version literal at all, because the
  About row reads the installed package instead.
- **`BuildConfig` is not generated** — `buildFeatures.buildConfig` is off, so a unit test cannot
  import it. Read `build.gradle.kts` if a test needs the declared version.
- **The androidTest source set is not compiled by `testDebugUnitTest`.** A constructor change that
  updates the unit-test fixtures can leave `assembleDebugAndroidTest` broken for a whole session
  while every unit test stays green. D6A5 found seven such fixtures. Always run the full four-task
  command, never just the tests.
- **The health routes are `/api/v1/health` and `/api/v1/ready`.** The bare `/health` and `/ready`
  return 404. Verifying by hand with the short paths produces a false alarm.
- **`deploy/production.env` holds `RS_DEPLOY_HOST`, `RS_DEPLOY_KEY`, `RS_DEPLOY_PATH`.** Reuse the
  deploy script's own `remote()` construction — `-o BatchMode=yes` plus `-i "$RS_DEPLOY_KEY"`.
  Rebuilding the SSH invocation by hand and omitting the key fails **and** prints the host address,
  which must never be recorded.
- **Known flake, pre-existing:** `TelegramMediaRepairGatewayTest` and `TelegramMediaUploadGatewayTest`
  (MockWebServer timing) fail occasionally under parallel Gradle tasks and pass on a clean re-run.
  The transport layer had **zero diff** in D6A4. Re-run before treating one as real.
- **Ruff's S603/S607 fire on `subprocess` in tests**, and `E501` on embedded shell/Python stub
  programs. The release and deploy tests carry per-file ignores with stated reasons.
- **D6A7c: `./gradlew lint` exits zero on warnings.** A gate that reads the exit code passes while
  the project's zero-issue bar does not — which is how D6A7b reported "lint clean" with three
  warnings present. **Read `app/build/reports/lint-results-debug.xml`,** not the exit code.
- **D6A7c: adding a method to `RemoteServerGateway` breaks every test double at once**, but the fix
  is one edit: they all extend `StubRemoteGateway`, except `FakeRemoteGateway` in the pairing test.
- **D6A7c: `docker cp` into the container fails — the rootfs is read-only.** Pipe a script through
  `sudo docker exec -i <container> /app/.venv/bin/python3 -` instead. And `sh -lc` inside the
  container **resets `PATH`** and loses `/app/.venv/bin`; use `sh -c` or absolute paths.
- **D6A7c: `assembleDebugAndroidTest` can report success while producing a stale APK.** Check the
  output file's timestamp, and force it with `--rerun-tasks` for a milestone's final gate — the same
  staleness trap the unit-test task has.
- **Writing certain literals into Kotlin through a file-writing tool can land a raw NUL byte**, which
  makes `grep` treat the file as binary. If a grep over a file you just wrote returns nothing it
  should have matched, check for NUL bytes first.

---

# D6A7d — the first live Stories, and four rows that could not be answered

The device report on the D6A7c1 build carried one real success and four dead ends.

## What the hardware proved, and what it did not

**Verified.** Android screenshots work — the `FLAG_SECURE` removal is confirmed. The local Review
screen opens and shows its rows. Instagram Stories were enabled on the existing source, and
**pressing Check now while active Stories existed discovered and uploaded every currently active
Story.** This is the **first verified live Story import in this project**, and the server's own
record agrees: eleven Stories, one successful manual check, items 28 → 39.

> **The second Check now was *refused* by the fifteen-minute manual cooldown.** A refusal is not
> evidence of deduplication. **The Story dedupe check is still open**, and no document in any of the
> three repositories may say otherwise.

**Still unverified:** a second successful check importing zero copies of the same active Stories;
one later new Story importing exactly once; a Story left in Review remaining sendable after expiry;
screen recording; a non-blank Recents preview; a captured local video preview that is not black; a
live carousel-heavy import; a live pinned-post re-check; and **live Reel classification**, which has
never been exercised at all.

## 1. A `RESULT_UNKNOWN` row is a question, and questions can be answered

Four local files sat in Review with an unknown Telegram result. **The state was correct** — a
request may have left the device and no confirmation came back — and the refusal to resend
automatically is right, because an automatic resend is how one post becomes two. **That rule is
untouched.** What was wrong is that the row could not be ignored, resent, marked resolved, or even
*identified* well enough to go and check Telegram by hand.

Three actions, each behind a confirmation dialog:

- **I found it in Telegram** — resolves the row as manually confirmed. It leaves Review and stays in
  History as *confirmed by you, not confirmed by Telegram*. **No message ID is invented, no
  confirmation timestamp is invented, no network call is made, nothing is sent, no file is
  deleted**, and the reservation on those bytes is deliberately **kept**.
- **I did not find it — allow sending again** — resolves the attempt as user-declared absent and
  releases **this job's own** reservation. Creates no job and sends nothing.
- **Leave unresolved** — reaches no repository at all. The view model returns before any call.

**Send again is the second decision.** It prepares one queue row, warned in red; the send is the
ordinary explicit action afterwards, through the one existing engine, so the replacement receives a
fresh dispatch attempt from the same dispatcher as any other job. The uncertain attempt survives
untouched in History with its attempt, error code and evidence exactly as the transport left them.

**Design decisions worth carrying forward:**

- **The status is never overloaded.** `RESULT_UNKNOWN` stays `RESULT_UNKNOWN`, so the deletion gate,
  the retirement policy and the destination relationship behave exactly as before. The finding lives
  on its own columns: `unknownResolution`, `unknownResolvedAt`, `unknownResolvedAttemptId`,
  `unknownResolutionProvenance`.
- **"Retried at most once" is a unique index**, not a rule the interface remembers.
  `retryOfUncertainJobId` on the *new* row carries it, so repeated taps collide and a process death
  between the resolution and the retry is safe — the resolution commits on its own.
- **Idempotency is the statement's `WHERE`**, not a read: `AND unknownResolution IS NULL`. A replay
  after a restart matches zero rows.
- **The projection filters; nothing is retired.** A settled row leaves Review the same way an
  ignored one does — no status rewritten, no reservation touched.

## 2. A card you can compare against Telegram

Every uncertain Review card draws the **same** thumbnail the grid does, from the same bounded cache
and the same decoder — no second image library, no main-thread decode, and a failure leaves the
placeholder rather than hiding the card. Beside it: the real folder name, the file name, the media
kind, the topic label, the uncertain status and the three actions. The full preview is one tap away
and **opening it resolves nothing**. There is a direct action to the folder page, and Back returns
to Review at the exact scroll offset.

## 3. A folder is called what the user calls it

The device showed *Folder 2* and *Folder 6* — the generated ordinal a row is created with. **The
naming policy has existed since D5A; what was missing is that nothing ever asked.** The provider's
name was read only by an explicit refresh nobody had a reason to press.

It is asked now, once, when a folder is added: one read-only question about the tree's own root
document. A reauthorization refreshes it and never blanks a correct name. **Rename folder is on the
folder's own page** as well as in Directories, from the same composable. A rename is local metadata —
no Android folder renamed, no tree URI changed, no permission revoked, no scan state touched.

The Queue and History projections now carry the three naming fields, so every screen asks the one
policy instead of printing whichever field its query selected.

## 4. Remote History says what was delivered

*Story* / *Reel* / *Post* / *Unknown type*, **beside** the media structure rather than merged into
it, because all three can be one video. The app derives nothing — the value is the server's frozen
classification, and an absent field or an unrecognised value both read as *Unknown type*.

> **A Reel will almost certainly show as *Post*, and that is correct.** See the server handoff: the
> only trustworthy reel signals are Instagram's own product metadata, and gallery-dl 1.32.8's `type`
> field guesses "reel" from *exactly one video file*, so it is deliberately not read. **Do not record
> a Reel labelled *Post* as a device failure** — record it as *not proven*.

## 5. Check now says which refusal

*"The server is not checking this source now"* was true of every refusal and useful for none. The API
had returned the structured facts since D6A7b; the app flattened them. Nine classified reasons now:
the cooldown with the **exact local eligible time** and *"אפשר לבדוק שוב בעוד N דקות"*; a check
already running, which is **accepted** and attached to rather than refused; a disabled source; a
platform backoff; a rejected pairing; a real transport failure — **the only one that may say the
server is unreachable** — and a safe fallback carrying the server's own sanitized code.

**No application-wide timer.** The countdown is a `LaunchedEffect` inside the card that shows it,
ticking every thirty seconds, existing only while that card does and only for a refusal with an end.
Returning to the screen clears it and re-reads the source. A settled check refreshes the source card,
Remote Review **and** Remote History.

## 6. The remote uncertain workflow, finally reachable

The server's `resolve-unknown` endpoint has been correct since D6A6 and unreachable, because no
listing ever returned a `result_unknown` item. The server gained `GET /review/unresolved`; Remote
Review gained a third chip. **The server owns that state machine and the app does not duplicate a
line of it** — a surface test asserts the local and remote paths cannot reach each other.

## Practical notes for the next session

- **`GRADLE_USER_HOME=/root/.gradle`.** The agent runs as `devagent` whose `$HOME` is
  `/home/devagent`, and the Gradle cache lives under `/root/.gradle`. Without it `--offline` fails at
  configuration time with dozens of "no cached version available" lines that look like a broken
  build and are not.
- **Read the lint XML, not the exit code.** `lint` exits zero on warnings. D6A7d's first run had ten
  warnings and one hint — plurals, an autoboxed `mutableStateOf`, and seven strings declared but
  never rendered. All fixed rather than suppressed; the unused ones were wired to the surfaces that
  owed the user those sentences.
- **`--rerun-tasks` for the final gate.** Gradle does not track `build.gradle.kts` as a unit-test
  input, so a version bump leaves the task UP-TO-DATE and stale assertions pass.
- **Older milestone surface tests pin the schema version.** D6A7d had to update nine of them, plus
  one that sliced `MIGRATION_12_13` up to `val ALL` and started reading the new migration's SQL, and
  one that asserted the canonical projection contains no `WHERE` anywhere — a correlated `EXISTS`
  subquery is a join predicate, not a filter, and the guard was narrowed to say what it means.
