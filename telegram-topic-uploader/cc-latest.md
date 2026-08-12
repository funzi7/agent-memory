# Telegram Topic Uploader — latest handoff

> **`chat-handoff.md`, beside this file, is the canonical cross-chat bootstrap.** A brand-new
> managing conversation reads that first and this second. **Every future milestone must update
> both**, and from D6A also `/root/work/agent-memory/telegram-remote-sources/cc-latest.md`.
>
> **When the user supplies SHAs, read agent-memory before responding**, verify each against
> `origin/main`, and only then answer. A supplied SHA is a claim to verify, never a fact to repeat.

## D6A8c — a tile that opened a player and nothing that closed it

**Android production change: yes.** `60` / `0.14.9-d6a8c`, Room schema **17**, **no migration** —
the player's expansion state is UI state. **Server production change: yes, deployed** — see
`/root/work/agent-memory/telegram-remote-sources/cc-latest.md`.

| Field | Value |
| --- | --- |
| Android code commit | `7af20cb9e569d94136783dda7733379bf931b602` |
| Android HEAD | `2bcdfbbc15172ecc9d549ad08d93e36a1297f512` — documentation only after the code, so the APK hash is unchanged; documentation is not a build input |
| Version | **60** / `0.14.9-d6a8c`, Room schema **17**, **no migration** |
| Gate | **3734 tests, 0 failures, 0 errors, 0 skipped, 236 suites; lint 0 issues** (3714/235 at D6A8b), counted from the XML reports on the committed tree with `--rerun-tasks`. `assembleDebug` and `assembleDebugAndroidTest` both build; instrumentation **compiles and was not run** |
| APK | `/sdcard/Download/TelegramTopicUploader-0.14.9-d6a8c.apk`, **17,242,503 bytes**, SHA-256 `c3cecc6355f02e81a6c27d6c6495a272300487ee2d803518b500756a8398559f`, byte-identical to the build output, signing certificate `74:E7:86:54:…:DF:D4` verified unchanged against the D6A8b APK, **not installed** |
| Server | code `5f6bb4aa2c75c9882348d6b5b425cec36cca3c0e` = `DEPLOYED_HEAD`; `SERVER_HEAD` `fb45bf45219bfa25c7390181bfab5eb472eb8786` is documentation after the deployment. Migration head `0009_d6a7f1a_video_poster` unchanged |
| Hardware | **`docs/D6A8C_DEVICE_CHECKLIST.md`.** Nothing pre-marked; D6A8b's physical evidence carried forward in its own section |

### The toggle the user asked for

D6A8 made a card's compact video tile expand into an inline player and never made anything collapse
it. The gap was easy to miss because the tile is *replaced* by the player: the control you press to
open is no longer on screen, so the only ways back were opening a different card or scrolling this
one out of composition — side effects, not actions.

The obvious fix is refused, and the refusal is pinned by a test. Making a tap on the large player
collapse the card would give that surface a third meaning for one gesture — it already reveals
hidden controls, then plays and pauses — so somebody reaching for pause would close the card. The
toggle keeps its own compact target, present as long as the player is, and deliberately **not**
auto-hidden with the playback controls: the only way out of a state must not be hidden by that
state.

It adds no state. `InlineVideoPlayback.activeKey` already answers "is this card expanded", and a
per-card boolean beside it would be a second answer to one question — the shape that leaves a
collapsed card still holding the application-wide slot. Collapsing releases the slot; the existing
disposal then releases the `MediaPlayer` and abandons audio focus, so "no hidden audio" is the path
that already handled scrolling rather than new code to get wrong.

Full screen is untouched and separate in both behaviour and wording: **סגור נגן / Close player**
against **מסך מלא**. The compact tile is **פתח נגן / Open player** rather than "Play", which belongs
to the expanded surface.

### A refusal that implied it knew why

Twenty-eight of the thirty-three definitive refusals in production stored no reason — the build that
handled them read Telegram's description, classified nothing, and dropped it. "Telegram refused this
send" is true and invites the reading that the product knows why and is withholding it.

Three honest answers now. A recognised token is said in full (fourteen translated). No reason at all
says exactly that. And a token this build does not recognise — including the server's own
`telegram_refused_unclassified`, and the five old rows carrying an inherited *staging* reason rather
than a Telegram one — keeps the plain sentence. Those five are the reason: they would otherwise
explain a Telegram refusal with a download failure. **Nothing is guessed for a row that never stored
a reason, and no historical row is rewritten.**

### Physical evidence recorded this milestone

`D6A8B_AMBIGUOUS_LOCAL_DISMISS_DEVICE_RESULT = PASSED`. The ambiguous local terminal failure — the
row that read *permanent failure / reason unknown / cannot remove because an attempt is still
claimed* — offered **Remove from active processing** on build 59 and the user has now used it. It
worked. No resend was attempted and the failure was not re-created.

**Nothing is claimed about whether that row's source file was deleted or retained**: the handset did
not report it, so the checklist does not say. Writing "the file was kept" because it is the expected
behaviour would be inventing evidence.

## D6A8b — one boolean that meant both "a worker holds this" and "an attempt happened once"

**Android production change: yes.** `59` / `0.14.8-d6a8b`, Room schema **17**, **no migration** —
the local repair separates two facts that were already in four existing columns and were only ever
read through one projection. **Server production change: yes, deployed** — see
`/root/work/agent-memory/telegram-remote-sources/cc-latest.md`.

| Field | Value |
| --- | --- |
| Android code commit | `c6e32cae6122319ad2d064a361ae5183b22ce632` |
| Android HEAD | `486bddea0c57162fcced91ba854697adba24a3ba` — documentation only after the code, so the APK hash is unchanged; documentation is not a build input |
| Version | **59** / `0.14.8-d6a8b`, Room schema **17**, **no migration** |
| Gate | **3714 tests, 0 failures, 0 errors, 0 skipped, 235 suites; lint 0 issues** (3673/233 at D6A8a), from the committed tree with `--rerun-tasks`. `assembleDebug` and `assembleDebugAndroidTest` both build; instrumentation **compiles and was not run** |
| APK | `/sdcard/Download/TelegramTopicUploader-0.14.8-d6a8b.apk`, **17,232,412 bytes**, SHA-256 `bc157c8e8222073fda72068b0153c431ef9a4f32d1482bec1338438897dabc6f`, byte-identical to the build output, signer `74e78654…` unchanged since D5A, **not installed** |
| Server | code `09a65f099aebb2eb0162c8866bc959ffa76c4c58` = `DEPLOYED_HEAD`; `SERVER_HEAD` `2af6d4a00e9769b27f6bf0d1ef0a254106960861` is documentation after the deployment and was deliberately not redeployed. Migration head `0009_d6a7f1a_video_poster` unchanged |
| Hardware | **`docs/D6A8B_DEVICE_CHECKLIST.md`.** Four lines pre-marked, all physically reported before this build existed; everything else unticked |

### The forensics, done before any code was written

**The local half was structural, and that is stronger than a dump.** The Room database is not
reachable from an unprivileged shell — no root, no app-external data directory, and a persistent
debug API was deliberately not introduced to inspect one row. It was not needed:
`SafeRetirementPolicy.refusal` is an ordered `when` of mutually exclusive clauses, so the sentence
the card rendered eliminates every earlier clause by construction.

* clause 1 did not fire → **no** stored message id and no confirmation;
* clause 2 did not fire → the status really is `FAILED_PERMANENT`;
* clause 3 fired → the claim boolean was true;
* exactly **two** statements in the application write `FAILED_PERMANENT`, one setting
  `executionOwnerToken = NULL` and the other requiring it null → **no live owner**, so the true half
  could only be `dispatchAttemptId` — which `recordDispatchPermanentFailure` keeps on purpose.

`LOCAL_FAILED_ITEM_BUCKET = TERMINAL_AMBIGUOUS_STALE_CLAIM`; safe to resend **no**, safe to retire
**no**, safe to dismiss keeping the reservation **yes**.

### What the fix is, and what must not be undone

`hasExecutionClaim` unioned four columns. It is now split into `hasLiveExecutionClaim` (owner,
lease) and `hasDispatchAttemptEvidence` (attempt id, start time). A **retirement** still refuses
both — it releases the reservation — under the new, true name `DISPATCH_ALREADY_ATTEMPTED`. A
**dismissal** refuses only the live half, because it keeps the reservation.

`dismissFromActiveList` is its own statement: `retireFromQueue` requires the very markers a
settlement keeps, so the dismissal reached the database and matched zero rows. It preserves
`completedAt` rather than overwriting it.

**Do not re-merge the two booleans.** The merge made D6A5's dismissal unreachable for every row it
was built for, and its tests passed because they built `hasExecutionClaim = false` — a value
production cannot produce for a settled row that reached dispatch.

### Also in this milestone

* **`TerminalClaimPolicy`** — a pure exhaustive table over every `UploadStatus`: a settled row may
  keep any amount of attempt evidence and may **never** keep live ownership.
* **The canonical terminal-claim reconciliation**, in process-start recovery. Clears an owner and a
  lease from an already-settled row and nothing else; a live row is unreachable from its statement;
  idempotent; finds nothing on a healthy database, which is why it is run rather than assumed.
* **Three conditions off `UNKNOWN`**: `INVALID_LOCAL_INPUT` → `REQUEST_INVALID`,
  `WEBHOOK_CONFLICT` → `WEBHOOK_CONFLICT`, `INTERNAL_ERROR` → `LOCAL_TRANSPORT_FAILURE`. The first
  two are proof nothing arrived and join `PROVED_NOT_ACCEPTED_CODES`. **`HTTP_ERROR` and
  `API_ERROR` keep `UNKNOWN` deliberately** — they mean *Telegram replied and this build has no
  branch for what it said*, and there is no stronger true statement.
* **Remote History** says it records *attempts*, with All / Sent / Failed / Unknown tabs filtering
  pages already in memory, and a per-card line relating the attempt to what became of its item —
  correlated by item id, never by title or thumbnail. `RESULT_UNKNOWN` has its own tab because
  calling it *failed* asserts the one thing it exists to leave unproven.

### Adversarial review — eight lenses, three confirmed

1. **Server fields no Android surface consumed.** `auto_send_stopped` and `failure_detail` were
   parsed and never rendered. Fixed by completing the chain, not by removing the fields.
2. **The dismissal overwrote `completedAt`** — the moment the attempt ended — with the moment
   somebody tidied a list. Now `COALESCE`.
3. **The publication rule matched by suffix**, so free text ending in `_rate_limited` would have
   been forwarded verbatim to a phone. A token-shape test now runs first.

### Device evidence carried in

* **PASSED** — the D6A8a stale server-owned Queue row became sendable on build 58; the user pressed
  Upload now once; it uploaded; Telegram received it.
* **PARTIAL PASS** — inline History playback works in-card with a real advancing position and
  visible LTR progress/seek, play/pause, volume and fullscreen controls. Fullscreen round trip,
  background pause, audio-focus loss and rotation **not** reported and **not** claimed.

## D6A8a — a claim about somebody else's table, and a queue that had no driver

**Android production change: yes.** `58` / `0.14.7-d6a8a`, Room schema **17**, **no migration** —
the delete queue reuses `manual_source_deletions`, which already recorded the user's authorisation
durably and simply had nothing that executed it; the now-durable Review sort order is a preference,
not a column. **Server production change: yes, deployed** — see
`/root/work/agent-memory/telegram-remote-sources/cc-latest.md`.

| Field | Value |
| --- | --- |
| Android code commit | `f0b7694743284a310562d16e471865f9ab794df1` |
| Android HEAD | `aa9b30166dad84988a2a8c7fe425db14acb58ecb` — documentation only after the code, so the APK hash is unchanged; documentation is not a build input |
| Version | **58** / `0.14.7-d6a8a`, Room schema **17**, **no migration** |
| Gate | **3673 tests, 0 failures, 0 errors, 0 skipped, 233 suites; lint 0 issues** (3588/230 at D6A8), from the committed tree with `--rerun-tasks`. `assembleDebug` and `assembleDebugAndroidTest` both build; instrumentation **compiles and was not run** |
| APK | `/sdcard/Download/TelegramTopicUploader-0.14.7-d6a8a.apk`, **17,207,507 bytes**, SHA-256 `5f9ac2216a4a709c04f2fe19a3b19b742b5ccdcfe186538494a3665b5d8e3d6b`, byte-identical to the build output, signer `74e78654…` unchanged since D5A, **not installed** |
| Server | code `3e3638976cd4cd78b6795d575a9c551ba6b5ca4c`, `SERVER_HEAD` and `DEPLOYED_HEAD` **equal**; migration head `0009_d6a7f1a_video_poster` unchanged. Three deployments, each first-attempt, each under a freshly re-read guard |
| Hardware | **`docs/D6A8A_DEVICE_CHECKLIST.md`, nothing pre-marked.** D6A8's section C is **withdrawn**, not closed: it tested an option built on a misreading |

### The forensics, done before any code was written

Read-only against production, no platform contacted, no row written:

* **`LOCAL_STUCK_UPLOAD_BUCKET = I (SESSION_NOT_FOUND_ANDROID_STALE)`.** All 197 local upload
  sessions on the server are terminal — 193 confirmed, one expired, three failed-before-dispatch
  (all three `cloud`-era). **No staged, no retry-waiting, no dispatching row exists at all**, no
  bot-wide Telegram block, no maintenance. The handset had called
  `POST /api/v1/local-uploads/reconcile` fifteen times and been answered `200` every time.
* **TikTok: 10 items, 10 operations, 10 `failed_before_dispatch / download_failed`, 0 Telegram
  requests, 0 carousels.** `dispatch_auto_send` ran and processed all ten. The reasons
  (`media_http_403` ×5, `tiktok_media_unresolved` ×5) went to a log line and were thrown away.

### 1 — the Queue row that could never be told it was wrong

Two independent defects, both fixed:

* **the identity was erased exactly when it became necessary.** `recordDispatchRetryable` clears
  `dispatchAttemptId` — right for every ordinary retry, exactly wrong for a server-owned wait where
  the server accepted the bytes and still holds the send. `ServerUploadSessionReconciler` emits its
  strong exact-attempt probe only for a row that still has one, so every server-owned row could be
  asked about **only** through the weaker media-at-destination identity. A sibling DAO statement,
  `recordServerOwnedWait`, keeps it for exactly `SERVER_STAGED_AWAITING_TELEGRAM`,
  `SERVER_SENDING_TO_TELEGRAM` and `RATE_LIMITED`;
* **a proven absence was never acted on.** For a row whose entire content is a claim about the
  server's own table, *no such session* disproves it. It now settles the new
  `DispatchErrorCode.SERVER_SESSION_ABSENT`, becomes explicitly retryable, offers *Upload now*, and
  is in `PROVED_NOT_ACCEPTED_CODES` so removal stops being refused.

**The narrowing that keeps the widening safe:** the transport reported `found = false` both for
"the server said there is no such session" and for "a session whose body would not parse" — opposite
facts. `RemoteReconcileFinding.provenAbsent` now carries the server's own boolean, and the policy
requires it. `RESULT_UNKNOWN` is still untouched by any absence, under either attribution.

### 2 — three removal sentences instead of one borrowed uncertainty

`QueueCorrectionRefusal` gained `SERVER_HOLDS_DELIVERY`, `SERVER_SENDING_TO_TELEGRAM` and
`RESULT_UNKNOWN`. A card that has just stated a certainty no longer explains its disabled control
with "the recorded outcome does not prove Telegram never received it".

### 3 — `יעד:` instead of `נשלח אל`

`remote_source_destination` renders the source's **configured** destination and always did; the
English on the same id was always the present-tense "Goes to". The Hebrew past tense is why the user
believed ten items had been sent. A guard now forbids past tense on that line. An `AUTO_SEND`
source's count says `פריטים ממתינים:` rather than `ממתינים לסקירה:`.

### 4 — "בלי זה" meant *without this platform*

D6A8 read it as *without sorting* and shipped a chip with no comparator. Corrected: the sort is a
**dropdown** — date newest/oldest, size largest/smallest — unknown sizes sort **last in both**
directions, and the order is now **durable** (an `AppSettingsRepository` preference storing the enum
*name*, so a removed member reads as the default). The exclusion the phrase meant —
**בלי TikTok / Instagram / 9GAG / X / Reddit** — lives on **Remote Review**, the one surface whose
rows carry a server-supplied `RemotePlatform`. The local grid deliberately does **not** get it: its
only source-category field is the folder profile the user configured, which already has its own
inclusion chips, and inferring a platform from a filename or folder name is the guess this project
refuses everywhere else. **That division is pinned by tests and stated in the docs.**

### 5 — the delete queue

`SourceDeletionPolicy` returns the new `Queueable` when the *only* remaining obstacle is that
another media holds the slot — every refusal about the file itself still wins, and each is tested.
`ManualSourceDeletionCoordinator.drainQueuedDeletions()` runs the authorisations oldest-first,
reconciling `DELETING` rows left by a dead process **before** reading the queue (they are not in the
two queued states, so without that they would be the one row the pass could never see). Execution is
the same gate, the same compare-and-set claim, the same identity/size/last-modified/digest re-proof
and the same single irreversible call. Withdrawal is guarded on the two states that have provably
not begun. Driven from `SourceDeletionWakeCoordinator.wake`, **unconditionally** — gating it on
`releasesSourceBytes` would have reproduced the original defect one layer up, because that policy
returns false for exactly the transitions this exists for.

### Two of this milestone's own fixes were withdrawn — do not re-attempt them

An adversarial review of the finished diff refuted both halves of the first answer to the stuck
Queue row. **Neither reached a device, and neither should be tried again.**

* **Retaining `dispatchAttemptId` for a server-owned wait.** The column does not mean "which attempt
  this was" to the rest of the application; it means *an attempt is claimed*. `hasExecutionClaim` is
  projected as `executionOwnerToken IS NOT NULL OR dispatchAttemptId IS NOT NULL`, every claim query
  requires it NULL, and `SafeRetirementPolicy` refuses removal on it — so retaining it would have
  made every server-owned wait permanently **unsendable and unremovable**.
* **Acting on a per-item `found: false`.** `ServerUploadSessionReconciler.decideFor` discards a
  not-found *exact* finding before the policy sees one, so such a branch can only ever fire on the
  legacy media-at-destination probe — and since D6A7f2c a session is opened under the attempt-scoped
  identity, so that probe answers *not found* about sessions that are **alive**. It would have told
  the user nothing was sent while the server was about to send, and permitted a removal that
  releases the reservation whose whole job is to stop a duplicate post.

**What replaced them:** the reconcile response now carries `device_non_terminal_sessions` — how many
sessions the server holds for this device that have not settled, of any kind, under any identity.
Zero is a count rather than an identity, so it cannot be the "asked with the wrong key" answer, and
zero means every row on that device claiming server ownership is stale by arithmetic. `null` is
never read as zero, a failed lookup never qualifies, and `RESULT_UNKNOWN` remains untouched.

### Guards re-scoped, never deleted or weakened

Eleven changed premise and every one was re-scoped: D6A8's two "בלי זה = no sorting" assertions
became *every offered order really orders*; D4C's two-direction tie-break count became
one-per-order; D4C's single-preference count became *the store still has no generic setter*; D5A's
`"queue"` substring — which matched `queuedDeletions` — became the five things it stood for; four
rendition-selection tests became assertions on the format selector that replaced them; and five
refusal-reason assertions were renamed with *and it is still refused* kept beside each.

## D6A8 — the card that plays, the poster that outlives its file, and the listing that finally lists

**Android production change: yes.** `57` / `0.14.6-d6a8`, Room schema **17**, no migration — the
durable poster store is app-private files keyed by a digest of the document URI, deliberately not
a column. **Server production change: yes, deployed and live-validated** — see
`/root/work/agent-memory/telegram-remote-sources/cc-latest.md`. Server code commit
`76e4c7c03f575810e078fdd96a58da854a553f76`; `SERVER_HEAD` and `DEPLOYED_HEAD` **equal** at
`f34ef5c61db5e0c9e1a885c02fac4b54ccd3cfa7`; the local Bot API container was never restarted.

Android code commit `d5dd45fd3763d82821310e6967f136b9c839f449`, HEAD
`845096633d133cab8e7663de1c5b2368b600a47f`. APK
`/sdcard/Download/TelegramTopicUploader-0.14.6-d6a8.apk`, **17,159,121 bytes**, SHA-256
`ed384318ae4ac9546e273a185a278f859f32b530bb839a91f1cac46d395cdf97`, byte-identical to the build
output, signer unchanged since D5A, **not installed**.

### 1 — TikTok imports, proven from production (server)

The connector had never imported a post: gallery-dl's enumeration fetches **every post's own
page**, TikTok answers those with an anti-bot challenge, and the tool skips each failure and
exits zero with `[]` — a blocked profile indistinguishable from an empty one, baselining as
"nothing new" forever. A second defect hid behind it: the shared dump reader drops the URL of a
`Message.Url` triple and TikTok's metadata carries no `url` key, so even an unchallenged dump
parsed to zero posts while url-embedding fixtures stayed green. Discovery now runs
`yt-dlp --dump-single-json --flat-playlist` on the profile — one entry per post, no post page
fetched, the page recorded as a `ytdl:` plan resolved fresh at dispatch. **A silent zero is never
an empty feed**: clean-exit-zero-entries is `TEMPORARY_FAILURE / tiktok_listing_unavailable` and
a *failed* validation; the one honest empty is yt-dlp's own `videoCount == 0` sentence. **Live
production validation:** the deployed adapter's `discover(limit=3)` against the enabled TikTok
source, from the production host, answered `success_new_posts` with 3 dated, titled,
cover-carrying posts — read-only, no DB write, no Telegram; the source's next scheduled check
imports on its own. Photo carousels are a **named limitation**: indistinguishable in the flat
listing, refused at dispatch by name, never posted as their background track.

### 2 — inline playback inside the cards (Android)

`InlineCardPlayback.kt`: the platform `MediaPlayer` on an owned `TextureView` (D6A7e3's
no-library rule stands), hosted by the Review grid cell and by the Queue/History card below its
row. One application-wide slot (`InlineVideoPlayback`); a video's tap target is exactly its
picture and an image's picture declares no gesture; auto-hiding LTR controls with a lift-to-seek
bar; a full-screen dialog sharing the session; pauses on `ON_PAUSE` and on audio-focus loss —
a pause, never a release. Opening the Preview overlay stops inline playback at all four call
sites. Named v1 limitation: rotation recreates the Activity and ends inline playback.

### 3 — the History poster that survives the source's deletion (Android)

The gray squares were structural: thumbnails decode from the original document at render time,
and delete-after-confirmation destroys that document moments after the send confirms. The
two-tier `HistoryPosterStore` (`filesDir/history-posters`, 64 MiB, pure eviction policy —
deletion-time captures evicted last) fixes the class: the confirmed-source sweep captures **after
the gate and before the SHA-256 re-proof**, always overwriting its tier; render write-throughs
land after the frame is displayed; the manual permanent discard **removes** the stored picture in
every absence-proved branch; compact tiles state a settled absence instead of staying silent.
Old rows whose sources were already gone cannot get a picture back — they get the sentence.

### 4 — the requested sort chip (Android)

`ReviewSortOrder.UNSORTED`, labeled exactly **בלי זה**: no comparator at all, the projection's
own order, an honest note replacing the timestamp sentence, default unchanged.

### The adversarial review — 19 confirmed, 0 refuted, all fixed pre-commit

The critical: the fullscreen toggle destroyed its own session — the arbiter-release
`DisposableEffect` lived on the *surface*, and a surface swap fires `onDispose` (effect identity
is positional). It lives on the session-owning parent now. The class worth carrying: every
finding was invisible to a green unit suite — composition dynamics, platform lifecycle, API
asynchrony, cross-feature interaction.

### Guards: six re-scoped, none deleted

Three write/delete scans exclude `HistoryPosterStore.kt` by name on a marker list
`D6A8SurfaceTest` pins (no ContentResolver/DocumentsContract/MediaStore/stream/network); D3B2's
mention-count became a property **and its card slice's end anchor was dead** (`private fun` vs
the real `internal fun` — the region silently ran to end-of-file; anchored and measured now);
D5A's sniff scan excludes the store's own-file filtering; the server's tooling-notes guard now
pins yt-dlp and gallery-dl's absence for TikTok.

### Gate

**Android: 3588 tests, 0 failures, 0 errors, 0 skipped, 230 suites; lint 0** (3553/228 at
D6A7f2c), from the XML reports on the committed tree with `--rerun-tasks`; both APK variants
build; the first pass hit the documented D6A7e8 socket-buffering flake once (untouched transport
file) and the whole gate re-ran green with the byte-identical APK. **Server: 1637 passed,
3 skipped** (1630/4; the three are the conformance no-credential skips, by name), ruff, mypy 129
files, release-preflight 61 modules — from the committed tree.

### What is still open

The physical run of build 57 — `docs/D6A8_DEVICE_CHECKLIST.md`, 32 items, unmarked; backlog rows
258–268. Load-bearing: inline playback on all three surfaces with the one-player rule and the
Preview interaction; a delete-after-confirmation send keeping its poster; **the TikTok source's
own scheduled check importing and the items rendering in Remote Review** (the enumeration half is
already production-proven); one TikTok send producing exactly one Telegram message. Rows 252–257
(the D6A7f2c physical run) remain open and unmarked.

---

## D6A7f2c — the rows that finally re-ask, the identity that names one attempt, and a History card with no ceiling

**Android production change: yes.** `56` / `0.14.5-d6a7f2c`, Room schema **17**, no migration —
the durable attempt identity (`dispatchAttemptId`) has existed since schema 5.
**Server production change: yes, and deployed** — see
`/root/work/agent-memory/telegram-remote-sources/cc-latest.md`. Server code commit
`3055e2afbe16a66075b77c2417b7cb98ca342f19`; `SERVER_HEAD` and `DEPLOYED_HEAD` are **equal** at
`e9f2d1e818d5da9db43ed0f48fbdd2bc03e7141f` — unlike the two milestones before, the guard window
allowed deploying the docs too (Instagram 861.2 minutes out at the second pass), and the local
Bot API container was never restarted.

Android code commit `19d63231c59e73fa7c80a6aecf662885176340e3`, HEAD
`c8b121731630f343828ebff16f98539bd26bac40`. APK
`/sdcard/Download/TelegramTopicUploader-0.14.5-d6a7f2c.apk`, **17,089,507 bytes**, SHA-256
`a5d056b79d04232d8752faebf224e76ebe4c4a00d48945f1a9a9fe9b5ab7eab7`, byte-identical to the build
output, signer unchanged since D5A, **not installed**.

### The physical proof came first

**The first >50 MB Local-mode send is CLOSED.** Sent on build 55, positively confirmed by
Telegram, retention policy ran; corroborated read-only against the server's table — exactly one
part ever staged above 50 MiB, 62,389,767 bytes, session **confirmed**. Do not reopen the
ceiling-sync defect, the migration, or that send's poster/duration. And the stale open session
from D6A7f2b **expired on its own** at its 2026-08-09 06:25Z deadline (`expired /
session_expired`), exactly as predicted — nothing was cancelled by hand.

### 1 — reconciliation is a read (Android + server)

`ServerUploadSessionReconciler` (app-scoped, single-flight joined like the transport
synchronizer) asks the server's new `POST /local-uploads/reconcile` — bounded ≤50, device-scoped,
no identity echoed, nothing per-item logged, zero mutation, zero dispatch, zero Telegram,
maintenance-gate-free — at process start **after** durable recovery, on the 0→1 foreground edge
(its own `ActivityLifecycleCallbacks` registration; `ProcessLifecycleOwner` stays banned), on
`onEnterQueue`, on Queue pull-to-refresh (awaited), plus one self-armed pass at the nearest
visible server-owned due moment (≤30 min, foreground only, never periodic). Findings map through
the exhaustive `ServerSessionReconciliationPolicy` onto guarded single statements in
`RoomQueueExecutionRepository` — six `UPDATE`s, no `INSERT`, no `DELETE`; a reconciled
confirmation runs the same reservation sync and at-most-once deletion request a live one does.

> **The attribution asymmetry is the safety core.** A finding under the row's own retained
> `dispatchAttemptId` (`u2-` probe) may confirm, un-block a `RESULT_UNKNOWN`, or downgrade. A
> finding under the legacy media-at-destination identity (`u1-` probe) may **confirm only** —
> positive evidence is monotone; negative evidence cannot rule out an older attempt — and only
> the **newest** row per (sha256, chat, thread) carries the legacy probe at all. `not_found`
> changes nothing, ever. Reconciliation is never a retry: sends stay explicit.

### 2 — the identity names one attempt (Android + server)

`MediaUploadRequest.dispatchAttemptId` carries the exact id `markDispatchStarted` persisted;
`ServerTelegramMediaUploadGateway` refuses a request without one, then decides via **one
read-only legacy lookup** and the pure `SingleUploadDispositionPolicy`: `open`/`staged` →
**rejoin the legacy session** (staged bytes never abandoned); `retry_wait`/`dispatching`/
`confirmed`/`delivered_wrong_shape`/`result_unknown`/`failed_after_dispatch`/**any unrecognised
state** → answered from the session, nothing created; only `failed_before_dispatch`/`cancelled`/
`expired` or absence → a new `u2-<attemptId>` session. Identity strings are composed in exactly
one transport-internal object (`ServerClientRequestIds`) — a surface guard pins the `"u1-` and
`"u2-` literals to that single file and their absence from the whole interface layer. Albums
(`al-`) and repairs (`rp-`) deliberately keep their existing identities.

### 3 — the card names its surface (Android)

`UploadJobCardSurface` is a **required** card parameter and `ceilingBytes` lost its default:
QUEUE passes the row's live ceiling, HISTORY passes **null** — History has no active upload
ceiling, which is the concept, not a smaller fix. One invariant
(`UploadCardPresentationPolicy.rendersActiveSendability`) gates every current-tense statement:
only QUEUE, never over a positive confirmation — its truth table has exactly one true cell. Due
times render only while ahead of a bounded half-minute card tick (D6A7d's countdown idiom):
server-owned rows print the server's send moment, actionable rows print **this device's own
eligibility spacing** (named as such in both locales), and an expired time is never printed as
future. `APPLICATION_SERVER_BUSY` and `TRANSPORT_GENERATION_CHANGED` have dedicated past-tense
branches — הניסיון הקודם לא התחיל כי לשרת היו יותר מדי העלאות פעילות / שום דבר לא נשלח — with
"אפשר לנסות שוב עכשיו" once due, and Upload now's `enabled` additionally honours
`localRetryDue`. The Queue states why rows remain at all: a Send now action stays listed until a
final outcome.

### Guards: three re-scoped, none deleted

* `D6A7F2BSurfaceTest`'s identity guard moved with the identity: same forbidden-generated-value
  list over the new decision slice **and** over `ServerClientRequestIds`, plus the requirement
  that the attempt identity come from `request.dispatchAttemptId`; the slice-size meta-guard list
  updated with it.
* `D6A7F2ASurfaceTest`'s size-block guards re-anchored on `sizeBlockCeilingBytes != null` — the
  nullable ceiling is now itself the verdict — and the judged-against-the-row's-ceiling guard
  additionally pins `ceilingBytes = null` at the History call site.
* `D2B2BSurfaceTest`'s no-provider-text guard collided with a mere field access
  (`row.messageThreadId` contains the forbidden `.message` substring): resolved with a `with(row)`
  receiver scope in the repository, never by touching the guard.

### Gate

**3553 tests, 0 failures, 0 errors, 0 skipped, 228 suites; lint 0 issues** (3467/222 at
D6A7f2b), counted from the XML report files on the exact committed tree with `--rerun-tasks`.
Instrumentation compiles and was not run.

### What is still open

The physical run of build 56 — `docs/D6A7F2C_DEVICE_CHECKLIST.md`, unmarked; backlog rows
252–257. Load-bearing: the three stale rows reconcile on Queue open with no Send tap; the
confirmed 59.5 MB item's History card shows no size block and no ceiling; ONE safe explicit
retry of a transport-generation row opens a new `u2-` session and produces exactly one Telegram
message. §29's Android-side row counts remain honestly unmeasured — the app's Room database is
sandboxed away from this environment; the server-side classification stood in (60 sessions:
56 confirmed / 3 `transport_generation_changed` / 1 `expired`, 0 active, all `u1-`).

---

## D6A7f2b — the state nothing owned, and the four rows that closed a phone's upload path

**Android production change: yes.** `55` / `0.14.4-d6a7f2b`, Room schema **17**, no migration.
**Server production change: yes, and deployed** — see
`/root/work/agent-memory/telegram-remote-sources/cc-latest.md`. Server `SERVER_HEAD`
`4abe3c7ae194e836f0802277c265ef6c57104c9c`, `DEPLOYED_HEAD`
`d5cd04c1d5d827f8b129b1af8f427d56518a0b06` — the difference is documentation only and deliberate.

Android code commit `7de9325fbc30222224e21d52dff71ba0a071f89d`. APK
`/sdcard/Download/TelegramTopicUploader-0.14.4-d6a7f2b.apk`, 17,037,198 bytes, SHA-256
`be3f589528d45014e4759c873451c77dfbb69bb6ba9e985d69ddcd8ff7733ec3`, source and destination identical,
**not installed**.

### The forensics came first, and they changed the answer

The brief's own instruction was to establish where each of the two >50 MB attempts stopped **before**
designing anything, and it was the right instruction: the obvious hypothesis was wrong.

Read read-only from production, no identity printed:

* the api access log for `13:25`–`13:55Z` contains exactly **two** phone-originated mutations —
  `POST /api/v1/local-uploads` at `13:37:34Z` and `13:38:04Z`, **both 422**;
* each was preceded in the same second by a `getMe` through the active local backend, and the
  transport row's `verified_at` reads `2026-08-08 13:38:04.363838Z` — the second attempt's own call,
  to the microsecond. That correlation is what identified them, and it also proves both requests
  **reached the route body**: `_verify_bot` runs after Pydantic validation, so a schema-level 422
  could not have produced a `getMe`;
* **no `LocalUploadSession` row exists for either.** The newest row in the whole table is
  `06:27:11Z`; sessions created after `07:00Z` — zero; parts with `expected_bytes > 52,428,800` —
  zero; largest part ever staged — 33,443,444 bytes.

So neither attempt uploaded a byte, and Telegram was never contacted for either.

**Proved rather than inferred.** The deployed `create_session` was replayed against a `VACUUM INTO`
copy of the production database — writes nothing to production, throwaway staging root, no network:

```
ACTIVE_SESSIONS_FOR_DEVICE = 4
77 MB, cap=4 (production)      -> REFUSED  too_many_active_sessions
60 MB, cap=4 (production)      -> REFUSED  too_many_active_sessions
 4 MB, cap=4 (control)         -> REFUSED  too_many_active_sessions   <- size is irrelevant
77 MB, cap=4, reserve 0        -> REFUSED  too_many_active_sessions
77 MB, cap=5, all else equal   -> ACCEPTED                            <- the cap is the only refuser
```

Storage played no part: 32,269,179 bytes staged of an 8,589,934,592-byte quota, 41,186,807,808 free
against a 4,294,967,296-byte reserve. The cap check precedes both.

**ATTEMPT_A_BUCKET = I (OTHER_PROVEN). ATTEMPT_B_BUCKET = I (OTHER_PROVEN).**
Bucket A was considered and rejected in writing: it presumes a session with
`received_bytes < expected_bytes` and prescribes a chunk/resume/edge/timeout repair. No session
existed and no chunk was ever sent, so bucket A would have sent the milestone in the wrong direction.
Root cause: `local_upload_retry_wait_has_no_driver_and_saturates_active_session_cap`.

### D6A7f2a is positively verified and is not to be reopened

Three `GET /telegram/transport` calls at `13:37:16Z`, `13:37:29Z` and `13:37:34Z` — the synchronizer
working. The ceiling reached the phone, the local 50 MB block was gone, and both >50 MB items reached
the server's create route. **The stale-50-MB defect is closed.**

### What the Android half changes

**The queue card was naming a party that had not been contacted.** `retry_wait` and `dispatching`
both mapped to `RATE_LIMITED`, whose sentence is *"Telegram asked this bot to slow down"*. The
server has distinguished `telegram_delivery_paced` (its own pacing gate) from `telegram_rate_limited`
(Telegram's 429) since D6A7f, and this device never read the field.

* **Four new codes**, on both `TelegramFailureCode` and `DispatchErrorCode`:
  `SERVER_STAGED_AWAITING_TELEGRAM`, `SERVER_SENDING_TO_TELEGRAM`, `PHONE_TO_SERVER_INTERRUPTED`,
  `TRANSPORT_GENERATION_CHANGED`. An **unrecognised** park reason takes the server-owned branch
  deliberately — it is the weaker claim, and understating a Telegram throttle is harmless where
  inventing one is the defect being fixed.
* **`UploadTransferPhase`** — one canonical ten-member user-facing model, **derived** from durable
  columns and never stored. A stored phase would be a second copy of facts the row already holds,
  free to disagree with them.
* **`nextAttemptAt` finally reaches a screen.** Durable since schema 1, dropped by the summary
  projection ever since — which is why the app could promise a scheduled retry and never say when.
  Four files, no migration.
* **One generic notice became six.** Every `RetryScheduled` produced *"The upload failed. A retry was
  scheduled; nothing starts on its own."* Both halves are false for most of the codes that reach it.
* **No Send button while the server owns the delivery**, and the two server-owned codes are
  deliberately **absent** from `PROVED_NOT_ACCEPTED_CODES`. Retirement releases the reservation, and
  the server is about to post the media that reservation protects. The omission is named in the
  source as a rule rather than left to be read as an oversight.
* **`MediaRepairCoordinator.permanentCodeFor` is gone**, replaced by the exhaustive
  `UploadFailureClassifier`. D6A7f2a wrote a comment predicting that this map's `else` would silently
  mislabel a new code, updated its sibling for all six application-server codes, and updated this one
  for exactly one of them — so a repair refused by the session cap settled `FAILED_PERMANENT` with
  `UNKNOWN`, which is not in `PROVED_NOT_ACCEPTED_CODES`, so the user could not even remove it. The
  comment predicted the defect and the map still had it. **Removing the map removes the class.**

### Guards: three re-scoped, none deleted — and two of them were already vacuous

* `D3ASurfaceTest`'s post-confirmation guard forbade the *word* `UploadStatus.COMPLETED` anywhere in
  the upload package. `UploadTransferPhasePolicy` **reads** it. Re-scoped to forbid the **assignment**
  — which is what a transition actually looks like — plus an exact-set assertion naming the one file
  permitted to read it, so the exemption cannot spread quietly. Stronger than before:
  `status=UploadStatus.COMPLETED` written without spaces passed the old marker and fails this one.
* `D5ASurfaceTest:141` sliced `.substringBefore("// A manual deletion that has not settled")` — a
  comment its own `codeOf` strips first. **Region measured at 13,755 of 30,686 characters**, spanning
  a second `when (media.state)` block, so the assertions could be satisfied from the wrong branch.
* `D6A7E7SurfaceTest:271` sliced between two comments. **Its "block" was the entire 43,573-character
  file**, and the nested failure branch was the first of eighteen candidates, the probe's own by
  coincidence.

Both are code-anchored now and both carry a **measured-size assertion**. So does every slice in the
new `D6A7F2BSurfaceTest`: a guard cannot notice its own vacuity, so it has to be checked from
outside. That is the lesson worth carrying — a comment-anchored slice does not go red, it goes
**vacuous**, and a vacuous guard also stops anybody writing a real one.

### Gate

**3467 tests, 0 failures, 0 errors, 0 skipped, 222 suites; lint 0 issues** (3425 / 219 at D6A7f2a),
counted from the XML report files rather than from console prose. `assembleDebug` and
`assembleDebugAndroidTest` both build; the instrumentation tests **compile and were not run**.

### What is still open

The physical run of build 55 — `docs/D6A7F2B_DEVICE_CHECKLIST.md`. One server upload session remains
`open` for this device (a video at 0 of 33,443,444 bytes received): Android resumes it in place on a
rejoin, and it expires by itself at `2026-08-09 06:25Z` if nobody does. The three parked sessions are
already settled and are not actionable.

---

## D6A7f2a — the synchronizer D6A7f designed and never wired

**Android production change: yes.** `54` / `0.14.3-d6a7f2a`, Room schema **17**, no migration.
Code commit `602976dea98195190881ee75f1cddd14073103a4`, HEAD `a50ab0be423a6aaaed61c1d097f514d210e3e517`.
APK `/sdcard/Download/TelegramTopicUploader-0.14.3-d6a7f2a.apk`, SHA-256
`478268982aec7f084f31c1894a177b77345f4598e94a432863065bdd054a6eca`.

**Server: read-only. No commit, no deployment, and none was needed.** It was already correct.

### The defect, and why no test could see it

D6A7f made the upload ceiling "a fact the server reports" and built every part of that sentence
except the verb.

* `TransportCeilingSource` — persisted, Hilt-bound, read by the dispatch gate, the queue claim and
  the batch snapshot.
* `RemoteTelegramTransport.transportStatus()` — present, correct, parsing `max_upload_bytes`.
* **Production callers of either: zero.** `record(...)` had five call sites and all five were in one
  unit test. `transportStatus()` had none anywhere, not even a test.

So the recorded ceiling could never leave 52,428,800, and the handset refused a ~77 MB queued video
with *"exceeds the current Telegram 50.0 MB limit"* for hours after the server reported
`backend=local` and `max_upload_bytes=2,097,152,000`.

Every existing test passed throughout, because every one of them was about the **readers**. The
lesson is general and worth carrying: *a guard on the consumers of a value cannot see that nothing
produces it.* The new guard asserts that exactly one production file **writes** the ceiling, and
that there is one.

### What shipped

* `ActiveTelegramTransportSynchronizer` — one authenticated read, single-flight, recorded exactly.
  Boundaries: cold start, foreground return, Queue entry, transport-screen entry, explicit refresh
  (including Queue pull-to-refresh), and **immediately before an explicit send's size preflight**.
  No timer. The shared read runs on the application scope, so a screen leaving mid-flight cannot
  discard an answer other callers are waiting on.
* A failure records nothing, invents nothing and clears no pairing. The ceiling moves **both**
  directions — a smaller server figure is recorded exactly like a larger one.
* The live ceiling threaded into the three readers still using the default: the Queue's eligibility
  projection, the card that prints the limit, and the album plan.
* Stale `MEDIA_TOO_LARGE` withheld while untrue; the code and the attempt stay on the row.
* A size-blocked row states the **active** limit, offers *Refresh the upload limit*, and can be
  withdrawn again — the size branch used to short-circuit the pending-send controls.
* A Telegram transport card: backend, verification, ceiling, maintenance. No endpoint, host, port,
  token, `api_id` or `api_hash`, and no field one could occupy.
* **Six application-server failure codes**, separated from Telegram's. `RemoteFailure.ServerError`
  is the user's own deployment's 5xx and had been reported as *"Telegram answered with a server
  error"*, along with maintenance, quota, disk and session-cap refusals. The legacy `SERVER_FAILURE`
  is now party-neutral, because a row written before this milestone cannot say which server failed.
  A 429 still says Telegram; `RESULT_UNKNOWN` is still never retried automatically.
* Review scroll anchoring by item **key** — the D5B saveable state could not survive the rows
  arriving late, which is what was actually resetting the position — plus a transient back-to-top
  control (appears on upward movement far from the top, auto-hides after 3 s, never flashes on a
  restoration).
* One shared Preview media-gesture contract, obeyed by **both** the video and image surfaces. The
  image had exactly the defect D6A7e3 removed from video.

### Two things worth remembering

* **A raw NUL byte made a whole source file invisible to grep.**
  `transport/remote/RemoteTelegramTransport.kt` held one literal 0x00 inside `token.fill(...)`, so
  `file(1)` called the 475-line source *data* and plain `grep` skipped it as binary. Every
  grep-based audit of this repository read the application's entire Telegram transport client as
  empty. Written as `'\u0000'` now; behaviour identical. **When auditing this tree, use `grep -a`
  or read files directly.**
* **Ten surface guards were re-scoped, none deleted.** One had an *expired premise* rather than a
  broken one: it banned any copy claiming Local Bot API support was active, written when it was not,
  and D6A7f2 made it so. It now defends what still matters — name the transport, never the
  deployment.

### Gate

3425 tests, 0 failures, 0 errors, 0 skipped across 219 suites; lint 0 issues; `assembleDebug` and
`assembleDebugAndroidTest` both build. **Instrumentation compiled, not run** — no device-side
automation exists and none is claimed.

### Open

`docs/D6A7F2A_DEVICE_CHECKLIST.md`, unmarked. The transport rows of `docs/D6A7F2_DEVICE_CHECKLIST.md`
are superseded by it: they could not have passed on code 53.

---

## D6A7f2 — the Local Bot API migration, performed once

**The bot is on the official Telegram Local Bot API server.** `logOut` calls: **1**. The
cloud-verified bot id was frozen before the call and the local server answered `getMe` with exactly
that id. Backend `local`, verified, maintenance clear, queue released. `max_upload_bytes`
**2,097,152,000**. **No Telegram message was sent by any agent** — the only methods this milestone
called are `logOut` and `getMe`, and neither creates a post.

| Field | Value |
| --- | --- |
| **Final server HEAD** | `11c98184d89c5d494e39ec800e9321a93b1159e2` — pushed |
| **DEPLOYED_HEAD** | `f3609c3ca524cbbd3c856af09f168844f4966e1b` — **differs from HEAD, and deliberately.** The two commits after it are documentation only. A docs-only redeploy restarts the api container and the freshly migrated local Bot API server, and the enabled Instagram source's next check was inside the 90-minute deployment window by then. The brief's own rule applies: do not risk active Telegram work merely to make two SHAs equal |
| **Final Android HEAD** | `649131c473ff4b25ad889d9fea702c99bd3cb7ea` — pushed, **documentation only** |
| Android code commit | `2afcedb9ade9480e5c78f2c3144f268aa3a9027d`, unchanged. APK `b3705d52…` unchanged and **not rebuilt**. Version 53 / `0.14.2-d6a7f1a`, Room schema 17 |
| Database migration | **none introduced.** Head is still `0009_d6a7f1a_video_poster` |
| Row counts | **identical** before and after, all fourteen tables. Schedules untouched |
| Server gate | 1586 passed, 4 skipped (1529/4 at D6A7f1a); ruff, mypy 127 files, `bash -n`/`sh -n`, release-preflight 61 modules, `git diff --check` — clean |

### The D6A7f1a gate closed on hardware, and there is no 10 MB rule

The user tested **both** classes of video on code 53 — the control class and the previously
blank/white card class. Both now show a useful poster, normal video presentation, a real non-zero
duration, and exactly one message. The suspected ~10 MB boundary is **not** a rule and is encoded
nowhere: the user's Telegram client auto-plays the smaller video and requires a tap on the larger
one, so the missing poster was conspicuous on one and nearly invisible on the other. The defect was
identical in both. **Inline videos carry explicit poster evidence, independent of file size.**

### Five things the previous milestone wrote down that were not true

1. **`env_file` was a leak, not a mitigation.** Compose's `env_file` is read by the docker CLI on the
   host and its values become the container's own configuration — `docker inspect` returns them and
   the daemon writes them to disk. Shredding the tmpfs file afterwards protected nothing. Replaced by
   two mode-0600 files on tmpfs, mounted **read-only**, read by the image's own entrypoint, which
   validates them, exports them into its own process and `exec`s the official binary.
2. **The credential directory was root-owned.** `/run/remote-sources-local` was `drwxr-xr-x root
   root` — created by the docker daemon, because a short-syntax bind mount whose source is missing is
   created by the daemon root-owned and 0755. The writer is the api container as uid 10001.
3. **There was no reboot recovery.** `/run` is tmpfs; a reboot erased the material and the container
   restart-looped forever. A systemd oneshot now reads the durable backend and does nothing unless it
   is `local`.
4. **The migration accepted any bot.** It required a positive id and nothing more.
5. **It could call `logOut` twice.**

### And eight an adversarial read of the finished diff found, before the door closed

Reviewers whose only job was to break it, and skeptics whose only job was to refute them. Eight
survived; six were invisible to a green suite.

* **Maintenance did not stop the scheduler.** `accepts_dispatch` had one reader — the device-facing
  route — so the migration's own safety window did not cover the retry pass or the auto-send drain.
* **A `logOut` whose answer was lost left no durable record**, so the documented retry called the
  irreversible thing again and left the deployment permanently stuck. There is now a **write-ahead
  marker** set before the call, and an ambiguity is resolved with **evidence**: one `getMe` against
  the cloud, which creates nothing. `401` means it took effect; a success means it did not.
* **Nothing serialised the command.** The same marker is a conditional-`UPDATE` lock.
* **A rollback left `cloud_logged_out_at` set**, so a later migration would skip `logOut` entirely.
* **Boot recovery aborted on its first poll** — a pipeline under `pipefail` in an assignment `set -e`
  acts on. The one moment it exists for is the one moment the API is down.
* **`telegram-verify` could overwrite the frozen expectation** — the first command an operator
  reaches for when debugging a mismatch.

### The image, and what its provenance actually rests on

Built on a GitHub-hosted **amd64** runner, manually dispatched; **never on the production host**
(1 vCPU, ~1,967 MB). `telegram-bot-api` `adfd7f6a8e990272851777eeb3ae0def4216f161` — which is also the
**current head** of the official repository, so the pin is exact rather than lagging — with `td`
`a9966eb3704a3351568c28013fed67d797c17828`. The binary reports `Bot API 10.2`.

**The image id changed across `docker save` / `docker load`** (`7a54e53d…` on the runner,
`7df49461…` on production). Docker does not promise it survives the round trip and it does not, so
the id is not the provenance chain. What holds is the export SHA-256
`8ca32f329567bd1ce1641fa7697de9ad013292b23ea733a8c94120434c41a3dd` (46,889,733 bytes), identical when
computed on the runner, on the development machine and on the host — and then asking the **loaded**
image what it contains.

### Proved on the running container, not asserted

`docker inspect` on the local Bot API container contains **zero** occurrences of `TELEGRAM_API`, and
so do all of the daemon's on-disk container configs — exactly where the old `env_file` would have put
them. Its `Cmd` carries no `--api-id`. It publishes **no host port at all**; no listener on 8081
exists anywhere on the host; the firewall still allows only SSH and Tailscale; Serve 443 and Funnel
8443 are unchanged; its view of staged media is read-only.

Two residual exposures, written down rather than glossed: the running process's own environment is
readable by root through `/proc`, which is the floor for any design where the official binary reads
`getenv`; and tmpfs is swap-backed on a host that has a swap file, so "never touches a disk" is a
weaker claim than it sounds.

### What is still open

The user's first physical test over the local backend: Tailscale off, transport says **Local** and
shows the larger ceiling, an existing >50 MB item becomes sendable **in place**, one disposable video
above 50 MB sent **once**. `docs/D6A7F2_DEVICE_CHECKLIST.md` in the Android repository.

The line that matters most is a **look, not an assertion**: poster sharpness in local mode. The main
video travels as a path, so `thumbnail`'s documented guarantee lapses and the poster travels as
`cover` as well; a client may render a cover larger than a 320 px image flatters. If it reads soft
that is a later cosmetic decision — raise the poster's dimensions, or drop `cover` — and **never** a
reason to resend a message that arrived.

---

## Task and repository state

| Field | Value |
| --- | --- |
| Task | **D6A7f1a** — a pre-migration **corrective** milestone, and the second half of D6A7f1's. D6A7f1 restored the video metadata and hardware confirmed it: the videos that still look wrong now carry **real, non-zero durations**. What is still missing is the **poster** — the still image Telegram shows on the message — which this application has generated for every inline video since D3B1.3 and which D6A7f's declaration had no field for |
| **Final application HEAD** | **`e507c659ef6c1c3c4379b25125cfa72e7dcb9d81`** — pushed. The build tree is `2afcedb9ade9480e5c78f2c3144f268aa3a9027d`; the commit after it is documentation only (the artefact record), so the APK hash is unchanged |
| **Final server HEAD** | **`89b292d5086415da8d6d1c38d1598303d4d02409`** — **deployed and verified**, and `DEPLOYED_HEAD` equals it exactly |
| **Deployment** | **done, CLOUD gateway mode, no rollback.** Migration `0008` → **`0009_d6a7f1a_video_poster`**, applied and verified, all eight poster columns present. Backend `cloud`, 52,428,800 bytes, **no `logOut`**, Local Bot API not active and its container does not exist. **Every row count identical before and after.** The enabled Instagram source was **307** minutes out when the clock was re-read immediately beforehand, **305** afterwards — the wall clock elapsing, and the proof no Instagram request occurred |
| **Telegram local credentials** | **configured, and untouched.** Not read, not cleared, not replaced, not printed, not re-requested. Status reports only *configured* / *readable* |
| **Existing upload rows** | All eight pre-existing `local_upload_parts` rows read `poster_state = 'absent'` — true of them, and none rewritten, redispatched or deleted to make it so |
| Version | code 52 → **53**, name `0.14.1-d6a7f1` → **`0.14.2-d6a7f1a`** |
| Room schema | **17, unchanged — no migration runs on this install.** No schema 18: the poster is generated for an existing upload request, held in memory only until it is staged server-side, and never written to the user's folder, to Room or to a cache |
| Gate | **3327 Android unit tests, 0 failures, 0 errors, 0 skipped** (3287 before, **all retained**); **lint 0 issues** — both counted from the XML reports, every task `--rerun-tasks`, whole gate re-run from the committed tree. `assembleDebug` and `assembleDebugAndroidTest` both succeed; **instrumentation compiles and was not run**. Server: **1529 passed, 4 skipped** (1479/4 at D6A7f1), plus ruff format/check, mypy (125 files), `release-preflight` (60 modules), `git diff --check` |
| APK | `/sdcard/Download/TelegramTopicUploader-0.14.2-d6a7f1a.apk`, SHA-256 `b3705d521ac2f7810ef55f586349aaa9d72b1efc7725da3d332028ff0b1f7c5b`, 16,964,198 bytes — hash verified identical to the build output, **not installed**. Every earlier APK left in place |
| Production | **Deployed, and nothing else touched.** `LIVE_PROBES_USED=0`: no agent contacted any platform and **no Telegram message was sent** |
| Hardware | **The blocking gate is open, and it is now TWO classes of video.** `docs/D6A7F1A_DEVICE_CHECKLIST.md`, nothing pre-marked. A control video from the class that already displayed correctly **and** one from the blank-card class must both show a useful poster and a real duration. **The Local Bot API migration (D6A7f2) stays blocked until both pass** |

### Why this milestone exists — and the lesson in it

**D6A7f1 was reported as fixing the video regression, and it fixed half of it.** The first video the
user tested displayed normally. Subsequent ordinary uploads exposed more videos that still arrive as
a large blank/white media card — with **real durations** on them, tens of seconds and over a minute.

That distinction is the whole finding. Duration, width and height propagation is **physically
fixed** and is not re-litigated. The remaining defect is poster/preview presentation.

**Two lessons, and they are the durable part:**

1. **One passing physical test was generalised into a class of passes.** The D6A7f1 checklist asked
   for *one* ordinary small video. It got one, it worked, and "video presentation is fixed" is far
   larger than one file supports. The successor checklist requires **two classes** — the one that
   already worked and the one that did not.
2. **A parity oracle was read as prose rather than as code.** D6A7f1 compared the server-backed
   request against the three fields the old direct gateway's *KDoc* names. That gateway also attached
   a fourth thing that sentence does not enumerate: the `thumbnail` multipart part. Reading
   `TelegramMediaUploadApiGateway` line by line is what found this.

**It is not a file-size rule.** The examples were around 10–12 MB. Telegram documents no such
threshold, none was proved, and none was written into either repository.

### What D6A7f1a changed on the phone

* **One product concept, named once: the video poster.** `TelegramVideoThumbnail` →
  `TelegramVideoPoster`; `VideoUploadMetadata.thumbnail` → `poster`;
  `THUMBNAIL_UNAVAILABLE` → `POSTER_UNAVAILABLE`. Nothing above the four legacy direct transports
  speaks Telegram's wire vocabulary, and a guard asserts it. **The app's own history/grid thumbnail
  is a different, unrelated concept and is untouched.**
* **`VideoPosterPolicy`** — the pure rule: `SEND_VIDEO` may declare a poster; `SEND_DOCUMENT` and
  `SEND_PHOTO` may not, and neither is coerced into `SEND_VIDEO` to obtain one. The JPEG check reads
  **both ends** of the bytes, so a truncated encode that kept its header is not a whole image.
* **`RemoteUploadPart`** gains four poster facts and no bytes. The image has its own bounded route,
  uploaded **before finalize**, so it is on the server before the phone is free to leave.
* **`PosterStagingPlan`** — the staging decision, pure and separate from the loop that acts on it.
  The server's answer outranks this device's memory, exactly as the byte offset already did, so a
  process that died after staging the poster comes back, reads `verified`, and sends nothing.
* **A bounded four-rung extraction ladder** — chosen frame, first frame, unsnapped decode,
  `getFrameAtIndex(0)` — then a neutral placeholder with **no text of any kind**, no filename, and no
  claim to be a frame. Before this, one failed decode demoted a perfect H.264 file to a document.
* **An album video member declares a poster for the first time.** The album path passed
  `thumbnail = null` explicitly, with a note claiming a grouped video attaches no separate cover —
  never true of `InputMediaVideo`. A repair declares one too.
* **A poster never costs the send**, and `delivered_wrong_shape` remains delivered, terminal and
  never resent.

---

## The previous milestone

| Field | Value |
| --- | --- |
| Task | **D6A7f1** — a pre-migration **corrective** milestone. D6A7f's transport reached Telegram and lost two contracts on the way; a source still owing its requested history was being scheduled as though it were finished; and validation's four states were indistinguishable on screen. All three are corrected |
| **Final application HEAD** | **`82375dece6d0f4ed9f25ddc6cb383ff78c697a75`** — pushed. The build tree is `ea753c6463cbe2554e8d3c50e5d793350b8bd332`; the commit after it is documentation only (the artefact record), so the APK hash is unchanged — documentation is not a build input |
| **Final server HEAD** | **`4fdd3abee47061573642aaa762f5c1ddb064b1c5`** — **deployed and verified**, and `DEPLOYED_HEAD` equals it exactly |
| **Deployment** | **done, CLOUD gateway mode, first attempt, no rollback.** Migration head `0007` → **`0008_d6a7f1_media_metadata`**, applied and verified. Backend `cloud`, 52,428,800 bytes, **no `logOut`**, Local Bot API not active, no `api_id`/`api_hash` stored. **All 17 table row counts identical** across the deployment *and* across the re-arm. Instagram untouched; its enabled source's next check was re-read read-only immediately beforehand at **212 minutes** out |
| **Initial-import re-arm** | **1 source, schedule only.** `next_check_at` 24 h → **15 min**; counter 0 → 1. No check started, no run created, nothing imported, nothing sent. **Then it was live-verified:** the scheduler ran the re-armed check on its own at `21:20:40Z` — one second after the due time — found nothing again, and moved the source to `21:50:40Z`, **+30 minutes, the ladder's second rung**, where D6A7f would have written another 24 hours |
| Version | code 51 → **52**, name `0.14.0-d6a7f` → **`0.14.1-d6a7f1`**. The **patch** moves: the transport is unchanged, and what changed is that it now says what it was always supposed to say |
| Room schema | **17, unchanged — no migration runs on this install.** No schema 18 and no new export: the validation presentation is UI/SavedState, the declaration's new fields are wire data, and local work evidence already carried `VideoUploadMetadata` before dispatch |
| Gate | **3287 Android unit tests, 0 failures, 0 errors, 0 skipped** (3246 before, **all retained**); **lint 0 issues** — both counted from the XML reports, every task `--rerun-tasks`, whole gate re-run from the committed tree. `assembleDebug` and `assembleDebugAndroidTest` both succeed; **instrumentation compiles and was not run**. Server: **1479 passed, 4 skipped** (1413/4 at D6A7f), plus ruff format/check, mypy (124 files), `bash -n`, `release-preflight` (60 modules), `git diff --check` |
| APK | `/sdcard/Download/TelegramTopicUploader-0.14.1-d6a7f1.apk`, SHA-256 `c4b47edbdf309c1e91792fb23b70f5763ab865909239b52cabb4a4c65e0e2a89`, 16,947,804 bytes — hash verified identical to the build output, **not installed**. Built from the tree at `ea753c6463cbe2554e8d3c50e5d793350b8bd332`. Every earlier APK left in place |
| Production | **Deployed, and nothing else touched.** `LIVE_PROBES_USED=0`: no agent contacted any platform, no Telegram message was sent, **no TikTok probe was made**, and the forensic read of the 01:45 check was a read-only database query with no identity printed |
| Hardware | **The blocking gate is open.** `docs/D6A7F1_DEVICE_CHECKLIST.md`, nothing pre-marked. **The Local Bot API migration stays blocked** until the next ordinary inline-video send arrives with a real non-zero duration and normal presentation |

### Why this milestone exists — the D6A7f device session

**It proved a lot.** Async source validation is live on the handset: a TikTok validation showed a
running state, disabled its control while active, survived leaving the screen, and settled
successfully showing the validated profile. That is positive hardware evidence for durable validation
runs, for the D6A7e8 TikTok connector correction, and for source-URL cleaning. The D6A7f transport
also reaches Telegram over public HTTPS with no Tailscale: one video was **positively delivered**
with a positive message id.

**And it failed its own acceptance gate.** That video rendered as a blank white media card with a
download icon and a duration of `0:00`, for ~11 MB of real content. **Transport reachability and
presentation fidelity are different claims**, and D6A7f proved only the first.

### The two contracts, both visible in committed code before this opened

1. **Video metadata.** `TelegramMediaUploadApiGateway` attaches `duration`, `width` and `height` to
   every `sendVideo`, and its own KDoc says those three prevent the blank card. `RemoteUploadPart`
   carried position, kind, filename, size, digest, caption — and nothing about the video. **The
   contract was never overridden; there was no field for it.**
2. **Transfer method.** The server had carried `as_document` since D6A7f and **no client could set
   it**, so `SEND_DOCUMENT` — chosen precisely *because* the container cannot be confidently
   identified — was re-derived from the MIME type. A `video/mp4` the application had deliberately
   declined to present as a video was presented as one.

**The lesson to carry forward:** when a transport moves, the contracts that had nowhere to travel
fail *silently*, and the tests keep passing — because they were asserting on the response.

### What shipped in the application

* `RemoteUploadPart` gains `asDocument` (written unconditionally — an omitted `false` is
  indistinguishable from a client that never heard of the field) and `durationSeconds` / `width` /
  `height` (non-null for exactly one transfer method).
* **`RemoteUploadDeclaration`** — one pure, directly testable object owning the declaration rule for
  all three gateways. It was three inline expressions, which is how a single upload, an album member
  and a repair came to disagree about what a declaration is.
* A `SEND_VIDEO` without three positive numbers is **refused before a byte is staged**, which is
  where the direct gateway refused it and where the check stopped happening when the transport moved.
* **`RemoteValidationStatus`** + a `ValidationPresentation` enum: four states, each with an icon, a
  heading, a body, a screen-reader sentence and a tint. The enum makes "all four are answered" a
  property of the type. Colour is never the only carrier. The control disables **and relabels**
  itself while its own run is live.
* **The source card's three facts get three sections** — last check, initial import, regular
  schedule. An outstanding import says so prominently with the time of the next *actual* attempt, and
  the chosen cadence stops claiming to govern a source that is still being set up.
* `RemoteSource` reads `initial_import_pending`, `initial_import_empty_attempts` and
  `next_check_is_initial_import_retry`; `RemoteValidationRun` reads `started_at` / `finished_at`,
  which the server had always sent and D6A7f never read.

### The highest-consequence line, found by auditing my own change

`delivered_wrong_shape` is new on the server. The Android session mappings all end in an `else`
branch that reports **`BodyIncomplete`** — *the body provably never finished, nothing was accepted,
a retry is safe* — and the dispatch coordinator acts on that by retrying. An unrecognised delivered
state would therefore have **posted the user's media a second time**, for a message that already
exists with a real id.

All three mappings name the value and share the `STATE_CONFIRMED` branch: single → `Sent(id)`,
album → `Sent(ids)`, repair → `Repaired(targetId)`. D6A7e7a's rule, unchanged — positive Telegram
evidence outranks local doubt.

**Carry this forward:** when a server adds a terminal state, check what every client's default
branch says about it. A default that means *nothing happened* is safe for a state that means
nothing happened, and catastrophic for one that means *it happened, differently*.

### Guards re-scoped, none weakened — three, plus one new

1. `AppVersionTest` — the version pin, as intended.
2. `D6A4SurfaceTest` pinned `RemoteBackoffReason.fromWire(state.run.outcome)`; the expression moved
   into a composable binding the run as `run`. Rewritten **structurally** — every `fromWire` feeds a
   label function, no `.outcome` is rendered or interpolated. It had already gone quiet twice on
   variable renames.
3. `D6A7E7BPlatformChooserTest` asserted *exactly one* `onValidate` call site. There are now two
   legitimate ones (the button, and Retry). A count would have to be relaxed to 2, then 3, losing
   meaning by degrees — so it asserts the property instead: **every** call site is an
   `onClick`/`onRetry` body, none reachable from `LaunchedEffect`, `onValueChange`,
   `DisposableEffect` or `produceState`.
4. **New:** `D6A7F1SourceStatusTest` asserts every region it slices is **bounded and smaller than
   half the file**, and every anchor unique. A `substringAfter`/`substringBefore` slice **fails
   open** — a renamed anchor makes the region the whole remainder, and every `contains` keeps passing
   while asserting nothing.

## Previous milestone: D6A7f — the phone stops being a Telegram client

### The deployment, and the four defects it found

**Deployed in CLOUD gateway mode on the third attempt.** Migration `0007_d6a7f_transport` applied,
backend `cloud`, no `logOut`, Local Bot API not running. Row counts identical across the deployment;
Instagram identical to the microsecond with no deployment-triggered check; 8099/8100 loopback-only,
Funnel 8443, Serve 443, firewall unchanged, no Local Bot API listener.

**The legacy 429 repair: examined 5, repaired 5** — same operations, no duplicates, no fabricated
confirmation, items back in the queue, and absent from History while waiting. **The automatic retry
then ran by itself and all five failed to download**: `failed_before_dispatch` / `download_failed`,
because the source media has expired. Nothing reached Telegram and the five items are in **Review**.
The repair corrected a misclassification; it could not make expired media downloadable, and saying
otherwise would be the round-up this project does not do.

**Why it took three attempts, and why it matters beyond this milestone:**

1. the Instagram maintenance window refused the first (22.8 minutes to the next check);
2. the edge never re-read its route policy — a bind-mounted template rendered at container start,
   and `docker compose up -d` leaves a matching running container alone;
3. an unquoted `{8,64}` in an nginx `location` regex, which nginx reads as the start of a block, so
   the container refused to start — **and three separate guards had agreed with it**, each pinning
   the string that had been written rather than one nginx would accept;
4. found while those failed: `remote-sources-ctl` had no `verify-backup`, the subcommand the rollback
   calls before restoring the database — so every rollback needing a restore refused, and reported
   *the backup no longer verifies* about a command that never ran. The rollback tests had stubbed the
   wrapper with a fake that implemented it.

All four are fixed, each with a guard that reads the real file rather than a stub.

### The architecture this milestone makes permanent

```
Android → authenticated public HTTPS → Remote Sources application server → one authoritative
Telegram transport (Cloud now / Local after a migration that has not happened)
```

**This supersedes the earlier D6A7f sketch** in which the phone talked to a Local Bot API server
directly over the tailnet. Android needs no Tailscale for uploads, and the Local Bot API service must
never be publicly exposed. The phone no longer holds a Bot API endpoint at all: there is no field for
a host, a port, a token, an `api_id` or an `api_hash` — absent, not redacted, so no screen can start
showing one.

### What the application half actually does now

**Every Telegram operation goes through this application's own server**, over the same public HTTPS
the Remote Sources feature already uses, with the same device bearer token. The four direct Bot API
transports still exist — they are the rollback path, and deleting them would delete the record of how
the previous transport behaved — but **the composition root binds none of them**, and a surface guard
asserts that about the dependency graph rather than about a string.

**The size ceiling is the server's to report.** `TransportCeilingSource` is the single place that
answers *how large a file may be*; it is persisted, so a queued item stays eligible across a restart
rather than flickering in and out of the queue on every cold start. Neither 50 MB nor 2000 MB is
compiled in any more: an item that was too large yesterday becomes sendable the moment the number
changes — **no rescan, no new media row, no replacement job**.

**The bot token is never transmitted.** The ports still pass a `CharArray`, because that parameter is
also this device's own setup guard, and the server-backed adapters accept it without reading its
value. What travels is the **public numeric bot id**, so a server configured with a different bot is
a hard refusal rather than a silent rebind of bindings that belong to the device.

**One media item, one active work surface.** A media whose routed sibling is prepared, queued,
uploading or retry-waiting is no longer *also* active Review work: it is `SHADOWED_BY_ACTIVE_JOB`,
which is temporary and reversible, and is not the durable retirement that positive confirmation
writes. Both canonical projections carry the same correlated `EXISTS`, and the fake DAO the unit
tests run against carries it clause for clause — so the rule is asserted against exactly what
production computes.

**A source check outlives the screen.** *Check source* starts a durable run on the server and the app
only ever reads it. Leaving the screen cancels nothing, because there is no route that could. A poll
that fails is one read that did not arrive and never restarts anything — a retry there would become a
second extractor, which is the defect this replaces. Rotation keeps the ViewModel; **process death
restores the run's identity and the request it belongs to from saved state**, resumed before anything
is drawn.

### The two device findings

* **A — a Telegram rate-limit refusal shown as a failure.** Confirmed in production: **five**
  delivery operations were turned into false terminal failures by a 429. `RETRY_WAIT` prevents new
  ones; the existing five are repaired by `remote-sources repair-rate-limited --apply`, which is
  evidence-gated and expects exactly 5. **It has not run**, because the code is not deployed. It is
  the first thing to do after a deployment.
* **B — the TikTok *Check source* that timed out.** Forensics proved **the request never reached the
  application**, and the five edge 413s in the same window were the deployment's own probe. It
  therefore neither proves nor disproves the D6A7e8 connector correction. **Do not ask the user to
  press it again until D6A7f is deployed and installed** — durable validation exists precisely so the
  answer no longer has to arrive inside one request.

### Four defects the milestone's own verification found, and fixed

* `record_rate_limit` accepted a JSON `true` as a seconds value, because `isinstance(True, int)`.
* A confirmed upload session reported a message **count** and no message **ids**, which would have
  made every successful upload `RESULT_UNKNOWN` — the state that must never be retried.
* A non-terminal validation answer carrying no run id stranded the screen; it is a malformed response
  now.
* The validation run id did not survive process death while the documentation said it did. Four
  strings in saved state now make the claim true.

### What the next session must not do

* **Do not perform the Local Bot API `logOut` migration** until the user has installed D6A7f and
  confirmed the new gateway works. This was absolute in D6A7f and remains the gate.
* **Do not deploy while the enabled Instagram source is within 90 minutes of its next check.**
  Re-read it read-only immediately before deploying, every time. It refused a deployment on
  2026-08-07 and was right to.
* **Do not ask the user to re-press TikTok *Check source*** before the async validation is deployed
  and installed.

## Previous milestone: D6A7e8

### D6A7e8 task and repository state

| Field | Value |
| --- | --- |
| Task | **D6A7e8** — a link that says what it is, and the URL a connector should have asked for. **Two repositories**: the Android source-URL canonicaliser, and the server's TikTok connector correction |
| **Final application HEAD** | **`2bbf253530099d7aa93f3d0fc66cc7146c574f28`** — pushed. The build tree is `f9d190c0b1ac7316b9e59247899d64bdb14989ac`; the final HEAD adds a documentation-only artefact-record commit (it touches only `TODO.md`, `docs/PROJECT_STATE.md` and `docs/RELEASE_REVIEW.md`), and the hash is unchanged because documentation is not a build input |
| **Final server HEAD** | **`b0ed4f0407a089b5cf567c78a3c4f7a055197638`** (`b0ed4f0`) — **changed, deployed and verified.** `DEPLOYED_HEAD` equals it exactly. The code commit is `b38f8ebe1d8bb33ad961cf4af0a5709621cb9f1b` (`b38f8eb`), deployed first; the docs commit was redeployed so the two match |
| Version | code 49 → **50**, name `0.13.24-d6a7e7b` → **`0.13.25-d6a7e8`** |
| Room schema | **17, unchanged — no migration runs on this install.** The canonical identity value is **form state**: no column, not persisted, not sent as a separate field, and what reaches the server is the ordinary identity string it always was. There is deliberately no schema 18 and `18.json` stays absent. Server: **`0006_session_connection`**, unchanged |
| Gate | **3187 Android unit tests across 205 suites, 0 failures, 0 errors, 0 skipped. Lint: 0 issues** (both counted from the XML reports, every task with `--rerun-tasks`, the whole gate re-run from the committed tree). Server: **1243 passed, 3 skipped**, plus ruff, mypy, `bash -n`, `release-preflight` and `git diff --check`, all from its committed tree |
| APK | `app-debug.apk`, 16,850,766 bytes, SHA-256 `4ebd0498e6c5977c5db1b745e39f226b27f065861dcbd91e7fc16feccfa595b8`. **Copied to Downloads as `TelegramTopicUploader-0.13.25-d6a7e8.apk` with a verified-identical hash. Not installed.** Built from the tree at `f9d190c`. Every earlier APK left in place |
| Production | **The server was deployed twice** (`b38f8eb`, then `b0ed4f0` so HEAD and DEPLOYED_HEAD match); migration head unchanged; row counts identical across both. **No agent contacted any platform: `LIVE_PROBES_USED=0`.** The one live TikTok request in the evidence is the **user's**, from the handset, before this milestone began. Instagram was not contacted — its enabled source's `next_check_at` is unchanged to the microsecond |
| Hardware | **The seventh run closed backlog rows 193 and 194** (TikTok visible, chips wrap, selectable, form appears). Nothing else in D6A7e7b was reported and nothing else is marked. **No line of D6A7e8 is verified.** `docs/D6A7E8_DEVICE_CHECKLIST.md`, 18 items, all *not attempted*. New backlog rows **220–227**, of which **220 is the acceptance test and only the user can run it** |

### What this milestone is, and what opened it

**The seventh physical run did two things.** It confirmed the D6A7e7b platform-chooser fix on
hardware — TikTok visible, chips wrapping, selectable, its identity form appearing — and it then
performed the first live TikTok source validation this project has ever done. That failed, showing
*the platform returned content the server could not read; the connector must be updated.*

**The sentence was correct, and the Android mapping is why the milestone had a starting point.** The
classification travelled from the server unchanged and the app rendered it truthfully instead of
collapsing it into a generic error, so the next question was *which* connector and *why*. **No
Android production code was changed for it, and none needed to be.** The server half is recorded in
`telegram-remote-sources/cc-latest.md`; in one line, the connector was asking gallery-dl for a
profile URL that routes to a dispatch extractor and enumerates nothing.

**The product request, taken beside that run.** Pasting a profile link pastes whatever the platform's
*Share* button produced. Nobody can confirm at a glance which account they are about to follow, and
the share token travels to the server for no reason.

### What shipped

* **`RemoteSourceUrlCleaner`, one pure object in `domain/remote`.** No client, no coroutine, no
  repository, no `ViewModel`, no `Context`, no WebView, no redirect resolution — and
  `D6A7E8IdentityFieldPolicyTest` **reads the source file** and fails if any of those appears,
  because "this class has no client" is the kind of claim that stays in a docstring while an import
  grows underneath it.
* **The rule is not an allowlist of parameter names**, which would need maintaining. It is *a source
  identity URL carries no query and no fragment*, so whatever a platform invents next is already
  discarded. Query and fragment are cut in the parser before any per-platform rule sees the text, so
  no share token reaches form state, a log, a diagnostic or the server.
* **Conservative by construction.** It acts only when the whole current value is a complete `http(s)`
  URL on a host the selected platform is known by. A bare `@name`/`r/name`/`u/name`, a half-typed
  URL, a scheme-less URL and an unknown host all come back as typed — which is what stops the field
  being rewritten mid-keystroke.
* **Per platform, never generic.** TikTok `/@name` only. Instagram one segment, never `p`, `reel`,
  `stories` and the rest. X onto canonical `x.com` from any of its five spellings. Reddit keeps `u/`
  versus `r/` and presents `user/` as `u/`. 9GAG keeps a profile's shape, an Interest's slug and an
  explicit `hot`/`fresh` — and **never invents a feed mode the user has not chosen**.
* **`describesSameSource`.** Because the field can now be rewritten, a verdict must not be discarded
  when the text is merely tidied. It compares the identity **as a source**, is built on `describes`
  so it is a strict superset, still requires platform and source type to match exactly, and widens
  only on a pair `isSameSource` can prove names one source — which is false whenever it cannot
  canonicalise both sides.

### The safety argument that matters most

**Cleaning cannot become fetching.** A short share link carries no identity readable without asking
the platform what it points at, so the phone leaves it as pasted and never invents a username from
its redirect token. Looking for that on the phone is what found it **on the server**: `_strip_url`
had been stripping `vm.tiktok.com/` like any other spelling of the site, leaving the token standing
exactly where a username stands — and made of exactly the characters a TikTok username is made of.
A share link silently became a **profile source for an account nobody had named**, checked on a
schedule from then on. Refused by name now, in both places, decided from the text alone.

### Guards re-scoped, never deleted — one of them

`D6A7E4SurfaceTest`'s *only an answer about the current form may fill the name* asserted the literal
`it.describes(platform, identity, sourceType)` in `RemoteScreens.kt`, and widening the comparison
turned it **red** — correctly. It was not deleted. It now asserts the new call, **and a second guard
was added beside it** that reads the widened function and fails unless it is built on
`describes(...) ||`, unless the only widening is `RemoteSourceUrlCleaner.isSameSource`, and unless
platform and source type still match exactly. The guard went from pinning a spelling to pinning the
property that makes the widening safe. `AppVersionTest` was updated to 50 / `0.13.25-d6a7e8`, which
is what that test exists for.

### One flake, recorded rather than hidden

`TelegramMediaRepairGatewayTest`'s *a body that did not finish is incomplete* failed once
mid-milestone under load — a `MockWebServer` disconnect during a two-megabyte request body, whose
outcome depends on socket buffering. Re-run three times in isolation, passed each time; passed in
the committed-tree gate; lives in a transport this milestone does not touch. **Not weakened, not
retried-until-green, not annotated away.** Noted so the next person knows it is not new.

### Deployment verification

**The server was deployed and verified**, unlike every Android-only milestone since D6A7e2. Deployed
commit reported as the full 40 characters, migration head `0006_session_connection`, both containers
healthy, private health and readiness 200, a protected route 401, 8099/8100 loopback-only, no
firewall rule for any application port, Funnel still 8443-only with the private Serve on 443 intact.
Row counts identical: 2 sources, 3 destinations, 4 devices with 1 active, 17 check runs, 71 items,
74 media, 71 delivery operations. The read-only Instagram maintenance guard ran immediately before
each deployment; the enabled source was due in 483 minutes and its `next_check_at` never moved.

## Previous milestone: D6A7e7b

| Field | Value |
| --- | --- |
| Task | **D6A7e7b** — a platform that fits on the phone, a history that says when, and an icon that is actually an icon |
| **Final application HEAD** | **`7ad6d2bcd615cdcae0975635ca8661766575900e`** — pushed. The build tree is `f3991ed49be4ed0e7b2d5767f3028059e1e1cdc5`; the final HEAD adds a documentation-only artefact-record commit (it touches only `TODO.md`, `docs/PROJECT_STATE.md` and `docs/RELEASE_REVIEW.md`), and the hash is unchanged because documentation is not a build input |
| **Final server HEAD** | **`c7536bf64f23b80feb92f9eac2e1e2c915c0d0fd`** (`c7536bf`) — **unchanged, not redeployed, not edited, not migrated, not contacted for a change.** `DEPLOYED_HEAD` equals it exactly. The server audit that opened this milestone was **read-only** |
| Version | code 48 → **49**, name `0.13.23-d6a7e7a` → **`0.13.24-d6a7e7b`** |
| Room schema | **17, unchanged — no migration runs on this install.** Every timestamp rendered here was already a column: `upload_jobs.telegramConfirmedAt`, `.dispatchStartedAt` and `.completedAt` have existed since schema 5 or earlier, and the History query already selected the first and third — only the domain projection dropped them. The Archive filters on a **computed** `DashboardGroup`; there is deliberately no `archived` column. The incremental scan reads `sha256`, `hashedAt`, `hashedSizeBytes`, `documentLastModifiedAt` and `sizeBytes`, all pre-existing. Detail expansion is transient composition state. `18.json` stays absent. Server: **`0006_session_connection`**, unchanged |
| Gate | **3134 Android unit tests across 203 suites, 0 failures, 0 errors, 0 skipped. Lint: 0 issues** (both counted from the XML reports, every task with `--rerun-tasks`, the whole gate re-run from the committed tree). Server: **not run — the repository was not touched** |
| APK | `app-debug.apk`, 16,850,760 bytes, SHA-256 `e9d9cf3ab0ee33073b5d76a0071afd1317dfd76f970d4b414b9c3e45143eafa9`. **Copied to Downloads as `TelegramTopicUploader-0.13.24-d6a7e7b.apk` with a verified-identical hash. Not installed.** Built from the tree at `f3991ed` |
| Production | **Untouched.** No server edit, no deployment, no restart, no Funnel/Serve/edge/firewall change. **No platform was contacted** — not TikTok, not Instagram, not X, not Reddit, not 9GAG: no source created, validated, enabled, disabled or checked. No Telegram content sent, no Telegram history queried |
| Hardware | **No line of D6A7e7b is verified.** `docs/D6A7E7B_DEVICE_CHECKLIST.md`, 71 items, all *not attempted*. New backlog rows **192–219**. Every D6A7e7a row (**179–191**) stays open: the sixth run reported a different screen and produced no evidence about any of them |

### What this milestone is, and what opened it

**The sixth physical run**, on the installed D6A7e7a build, reported two defects and carried four
product decisions.

*Defect one, and the milestone's headline.* In **Remote Sources → Add source**, on the narrow
Hebrew/RTL handset, the platform chooser showed **Instagram, 9GAG, X and Reddit — and TikTok was not
there at all.** Not disabled, not greyed, not explained: absent.

**It was never a product gap, and this matters for how it was fixed.** `RemotePlatform.selectable`
has contained `TIKTOK` since D6A5. The TikTok tab exists. The TikTok profile source type exists in
this build *and* in the deployed server's own enum. The server's adapter registry lists TikTok as
supported, advertises exactly `tiktok_profile`, and advertises no feed modes for it. Every TikTok
label, identity hint and setup sentence has been in both locales for eight milestones. The Add
Source form drew the server-supplied `selectablePlatforms` as chips inside a plain `Row` — no
wrapping, no scrolling — so the fifth chip was measured past the edge of the viewport and clipped.
Under RTL that edge is the left one, which is precisely why the four that survived were those four.

**TikTok was not contacted.** No source was created and no validation attempted, because the control
that would have started one was unreachable. Nothing about this finding is evidence about TikTok's
availability, its adapter, its cookies, or whether the deployed host can read a TikTok profile.

*Defect two.* The launcher icon renders as a **blank white shape**. The manifest pointed both
`android:icon` and `android:roundIcon` directly at `@drawable/ic_launcher_foreground`, a white-only
vector with no background layer of any kind. That is not a launcher icon.

*And this is one defect occurring twice.* D6A7e5 found three of five schedule presets unreachable
behind a horizontal scroll. Same failure — a control outside the viewport — different group, eight
days later. Fixing one more `Row` would have invited a third occurrence, so the layout rule stopped
being a decision each chip group makes for itself.

### What shipped

- **`RemoteChipFlow`, and seven groups drawing through it.** A `FlowRow` that fills its width, spaces
  both directions identically, declares no height, inserts no spacer, clips nothing and **counts
  nothing** — no caller tells it how many chips exist, so a sixth platform a future server advertises
  wraps onto the next line instead of disappearing. The platform, source-type, feed-mode,
  review-mode (Add *and* editor) and initial-import choosers, the source card's two read-only chips,
  and the D6A7e5 schedule selector all use it. The platform tab strip keeps its own horizontal scroll
  and remains the only horizontally scrolling row in the file, still pinned by count.
- **TikTok's form was already correct.** One advertised source type, so no source-type chooser is
  drawn; no feed-mode chooser; a TikTok-specific truthful identity hint; preselection from the TikTok
  tab. **No cookie UI, no Cobalt UI and no credential field of any kind was added.**
- **`RemoteHistoryTimelinePolicy` — one rule about which time a delivery may claim.** A *sent and
  confirmed on Telegram* sentence requires **both** the server's own `CONFIRMED` state **and** a
  renderable `confirmed_at`. Each half rules out a real case: a state without a timestamp is an older
  server and states its status while inventing nothing; a timestamp without the state is
  contradictory server data and the state wins.
- **The server semantics were verified read-only, not assumed.** `confirmed_at` is assigned in
  exactly one place in the whole server — the positive-confirmation settlement path — and is null for
  every other outcome. Critically, it is **also null for a `result_unknown` operation a human later
  resolved as delivered**, because that resolution is recorded against the *item* and never against
  the operation. Such a row therefore states no send time, which is correct: a person reading a topic
  is not Telegram. `created_at` is stamped by the column default when the operation row is inserted,
  **before any request is made**, which is exactly why it is the dangerous field — it is always
  present. It now appears only under *the send operation was created*.
- **`LocalMoment` — one formatter, two History screens.** Exact local date and clock time from the
  platform's own locale-aware patterns, with **no timezone constant anywhere in the application**. It
  replaced three copies of the same expression (the schedule section, the Telegram setup screen, and
  the one local History was about to grow). **`RenderableMoment`** rejects an absent, zero or
  implausibly early epoch — a floor rather than `> 0`, because a truncated parse or a
  seconds-for-milliseconds mistake also yields a positive number that renders as 1970 — so **no card
  can print 1 January 1970** and an omitted moment produces no text at all.
- **Remote History Details**, read-only: source, platform, content kind, frozen destination, media
  count, message count, state, both times under separate labels, and a translated failure reason.
  Expanding fetches nothing and writes nothing. **No operation, item, source, destination, chat,
  thread, message or post identifier is rendered** — the message *count* is shown, the message *ids*
  are not.
- **`RemoteDeliveryFailureCode`** matches the thirteen literals the server's sender and settlement
  paths author, one translated sentence each, exhaustive by `when` so a future code fails the build
  rather than falling into a generic clause. The stored string is never printed.
- **"Sent to X" stopped being said about deliveries that were not sent.** A confirmed row keeps that
  wording; a failed, unresolved or in-flight row names the destination it was *aimed at*.
- **Local History carries the real confirmation moment.** The column has existed since the first
  release and the query always selected it; the mapping collapsed it into a boolean and dropped the
  moment. It is now exposed **only** when the whole positive pair is present — a message id above
  zero **and** a confirmation stamp — gated once at the entity mapping so no future screen can reach
  the ungated value. Dispatch-start and operation-ended joined the Details block that already
  existed, each under its own name, and it stays read-only. **No migration.**
- **Remote Review** states the platform's own publish time and the server's discovery time as two
  separate sentences, the first omitted entirely when the platform's metadata carried none.
- **A real launcher icon** — adaptive, opaque blue field, white play-and-arrow mark (*media, sent
  onward*, and deliberately not a picture of any one platform), a monochrome layer for themed
  launchers, and a self-contained vector in `mipmap-anydpi` for the Android 6 and 7 devices `minSdk
  23` still covers. Without that fallback the blank-icon report would have moved to older hardware
  instead of being fixed. Every drawn point lies within 33 units of the centre of the 108-unit
  viewport, inside the mask's guaranteed 72-unit safe circle. No raster bundle, no downloaded
  artwork, no third-party mark, no text, no initials.
- **An Archive that hides nothing durable.** `HistoryMode` splits `HISTORY_GROUPS` **by
  subtraction**, so the two halves are provably disjoint and provably exhaustive: no row can appear
  in both and none can fall out of both. `SOURCE_MISSING` and `CANCELLED_OR_RETIRED` lost their
  primary tiles and gained one compact entry beneath the grid, hidden at zero. Neither was folded
  into `FAILED` or `COMPLETED`, no status was rewritten, no row was copied to another table, **no
  `archived` column was added**, and nothing was deleted. Opening it performs no scan, upload,
  deletion or state repair.
- **An incremental launch scan.** `ScanEvidenceReusePolicy` grants reuse only on a full conjunction —
  same owning tree, same provider authority and document id, same media kind, a complete canonical
  SHA-256 with a complete hashing record, stored evidence that agrees with itself, and a size and a
  modification time both known, both non-zero and both exactly equal. **A display name is not an
  input to the policy at all.** No sampling, no prefix hash, no *probably unchanged*. A row ever
  declared `SOURCE_MISSING` is always re-read — stricter than the conjunction requires, deliberately.
  Providers that report no size or a zero modification time never qualify, and their files are read
  in full every time, which is the correct outcome rather than a gap.

### The safety argument that matters most

**Missing-file detection is untouched, structurally rather than by promise.** The presence marker
`lastSeenScanRunId` is written by `persistDiscovery` — **before any stream is opened** — so a
document that skips its hash has already been recorded as seen by this run. Only an exhaustive
completed traversal may still infer absence, and nothing on the fast path can clear the coverage
flag or change the outcome classification. A reused document is finalized through the **same** call
the hashed path uses, so routing, duplicate reservation, the already-confirmed guard, the ignore
re-judgement and every counter behave identically. `ScanFinalizeRequest.reusedHashedAtEpochMillis`
carries the moment the digest was genuinely computed, so `hashedAt` keeps meaning *when the bytes
were read* instead of quietly becoming *when the digest was last affirmed*.

**No visible scan counter was added.** Distinguishing *reused* from *new* on screen would need a new
column on both `scan_runs` and `source_directories`, and the instruction was to keep the optimization
internal rather than migrate a schema for a number.

### Guards re-scoped, never deleted — three of them

- D6A7e5's *the schedule selector wraps* now asserts it delegates to the shared container, with a
  **second** test proving that container is a genuine `FlowRow` that never scrolls and fixes no
  height. Left matching `FlowRow(` it would have gone silently vacuous the moment the refactor landed.
- D6A7e's *a local moment is formatted for the device* now reads the shared formatter, bans an
  explicit zone inside it, and bans hand-rolled formatting across **all three** files that render a
  moment.
- `DashboardTilesTest` now pins **six** tiles, and a new test asserts both archived groups are absent
  from the work grid **and** still present in the model and in `HISTORY_GROUPS`.
- And, for the fourth time in this project's history, **an exact-version pin became a floor**:
  `D6A7E7ASurfaceTest` asserted `versionCode = 48` literally, which made it a statement about which
  milestone is current rather than about D6A7e7a. It now asserts the build never goes backwards, plus
  the install-identity invariants that genuinely belong to it.

### The Instagram publisher — recorded, not built

Rows 213–219 record the future official Meta publisher as **multi-account from day one**: an
`InstagramPublisherAccount` keyed by an opaque internal id and **never by a username**, with its own
label, Meta-reported type, connection state, authorization generation, per-account encrypted token
material and Meta-derived capabilities; independent authorization, disconnection and
reauthorization, so one account needing attention never stops the others unless Meta's own response
proves the condition is app-wide; a chosen default; a target account **frozen onto a publication at
queue or schedule time**, never redirected by a later default change and never automatically retried
onto another; per-account history that keeps its frozen safe label after a rename or a
disconnection; duplicate protection scoped to the exact target account; and a personal account Meta
cannot publish to represented as **unsupported** rather than coerced into a professional state.
Tokens, app secrets and refresh secrets never reach Android.

**None of it is implemented. Meta was not contacted and no credential was configured.** The existing
local `ACTION_SEND` route is untouched: it hands media to the Instagram application through Android
sharing, and **proves no publication whatsoever** — the application never learns whether anything was
posted. It is not retired.

**The distinction that must not blur.** An **Instagram viewing session** is the server's read-only
credential for Remote Sources discovery. An **Instagram publishing authorization** is a Meta account
grant for posting. They are separate concerns and **neither may ever substitute for the other**. The
first exists and is currently disconnected (row 130); the second does not exist at all.

### Deliberately future, and said so

- **Safe archive pruning** (row 211): a historical row may be permanently removed only once it is
  proved that no duplicate-prevention, upload-evidence, deletion-evidence, retry-history,
  destination-history or recorded user decision still depends on it. D6A7e7b purges nothing and
  offers no control that could.
- **An explicit full-integrity rescan** (row 212): the incremental path is the default and the only
  path today. There is no hidden full-hash mode, and if one is wanted it must be a visible,
  user-started action.

## Previous milestone: D6A7e7a


| Field | Value |
| --- | --- |
| Task | **D6A7e7a** — a recovery that knows which process it is in, an answer that outranks a guess, and a send that says how it ended |
| **Final application HEAD** | **`c1cc465f873dd6b1d034de2d7d28ca03116a366f`** — pushed. The build tree is `19b6ee4`; the final HEAD adds a documentation-only artefact-record commit (it touches only `docs/PROJECT_STATE.md` and `docs/RELEASE_REVIEW.md`), and the hash is unchanged because documentation is not a build input |
| **Final server HEAD** | **`c7536bf64f23b80feb92f9eac2e1e2c915c0d0fd`** (`c7536bf`) — **unchanged, not redeployed, not edited, not contacted for a change.** `DEPLOYED_HEAD` equals it exactly |
| Version | code 47 → **48**, name `0.13.22-d6a7e7` → **`0.13.23-d6a7e7a`** |
| Room schema | **17, unchanged — no migration runs on this install.** Process-start ownership is runtime orchestration; the dispatch error vocabulary was already stored as text in `lastErrorCode`, so naming a new code cost no schema change; the same-attempt confirmation writes job, attempt and evidence columns that already exist; and the last-send summary is a presentation aggregate in its own `last_send_summary` private preference file. `18.json` is pinned absent by `D6A7E7ASurfaceTest`. Server: **`0006_session_connection`**, unchanged |
| Gate | **2986 Android unit tests, 0 failures, 0 errors, 0 skipped. Lint: 0 issues** (both counted from the XML reports, every task with `--rerun-tasks`, the whole gate re-run from the committed tree). Server: **not run — the repository was not touched** |
| APK | `app-debug.apk`, 16,795,676 bytes, SHA-256 `2c0912cbc9d72ba10b79eb47ecbf8cb92de544fe21a2c9522f64a9962556f1e5`. **Copied to Downloads as `TelegramTopicUploader-0.13.23-d6a7e7a.apk` with a verified-identical hash. Not installed.** Built from the tree at `19b6ee4` |
| Production | **Untouched.** No server edit, no deployment, no restart, no Funnel/Serve/edge/firewall change. **Instagram was not contacted**: no validation, no check, no operator probe; no credential replaced or cleared; no source enabled or disabled. No Telegram content sent |
| Hardware | **No line of D6A7e7a is verified.** `docs/D6A7E7A_DEVICE_CHECKLIST.md`, 46 items, all *not attempted*. New backlog rows **179–191**. D6A7e7's rows **171–172 close on the user's report**; rows **168–170, 173–178 and 143–167 all stay open on their own line-by-line evidence** |

### What this milestone is, and what opened it

**The fifth physical run**, on the installed D6A7e7 build, reported two things.

*Working.* The secure public transport connection works, the authenticated public connection test
succeeds, **Public HTTPS** is selected and displayed as verified, and ordinary Remote Sources access
works **with Tailscale off on the phone**. Specific positive evidence for the public probe and the
selected transport — and for nothing else.

*Broken.* A local media upload to Telegram became **requires review every single time** the user left
Preview or the application while it ran and came back, with the application saying it did not know
whether Telegram had received the file. The user clarified explicitly: **the upload itself continued
and appeared to finish; the problem is only that it becomes requires review.** That is not a
cancelled request, and it is **not attributable to Tailscale or to the transport** — the local upload
path never used a Remote Sources endpoint.

### The writers, established rather than guessed

Exactly two production statements can move a started attempt to `RESULT_UNKNOWN`, and the report's own
detail distinguishes them. The upload coordinator's cancellation boundary fires while that attempt's
owner token is still live and its lease unexpired — the only shape consistent with an upload that was
healthy a moment earlier. `markAbandonedDispatchResultUnknown`, via `reconcileAbandonedClaimsLocked`,
cannot fire against a live renewed claim at all: its guard requires an expired lease or an absent
owner.

What made the second dangerous is not a guess. It ran from `MainViewModel.init` — which Android runs
whenever it builds an Activity — and from the Dashboard, Queue and History pull-to-refresh gestures,
**with no live-owner check of any kind**, resting entirely on a ten-minute execution lease whose
renewal loop is tied to observed byte movement. That loop stops renewing while the client waits for
Telegram's answer, and its `delay` does not advance while the device is suspended. A live upload can
therefore genuinely lose its lease, and the routine that then settles it is one a gesture reaches.

Both are closed, and both now record a sanitized closed-vocabulary trace at every write attempt,
refusals included. **Which one fired on the handset is deliberately not claimed** — the trace is what
will say on the next run.

### What shipped

**Process start is not Activity start.** `ApplicationStartupRecoveryCoordinator` runs from
`Application.onCreate`, at most once per operating-system process behind an `AtomicBoolean`, and is
the only owner entitled to sweep abandoned dispatches. The entitlement is structural: a brand-new
process cannot hold the media-operation slot, a registered transfer, or the runner that held them. It
checks anyway, because Android creates a process for a *service* too, and a process created to carry
an upload must never settle the work it was created to do. It starts no ordinary queued upload,
resumes only durable requests a person already tapped, contacts Telegram never, and deletes nothing.

**The repair a screen can reach keeps every evidence repair and has lost claim reconciliation.**
D6A7a put it there so a stranded row could be repaired from a gesture rather than from the actions
that row disabled; **the reachability is kept** and only the owner changed.

**A proof obligation, not a longer timeout.** `ProcessDeathDispatchRecovery` requires a stated
`DispatchRecoveryAuthority` and a `LiveTransferSnapshot`. `ProcessStart` sweeps everything and only
where no in-memory owner exists; `BeforeClaim` acts on one named job and only while the caller holds
the single media-operation slot with its own registration standing. A caller that cannot prove
abandonment changes nothing and reports `ACTIVE_OWNER_PRESENT` or `ABANDONMENT_NOT_PROVEN`.

**Positive Telegram evidence outranks a local uncertainty, for the same attempt.**
`DispatchSettlementAuthority` states the precedence once. The coordinator captures a returned message
id at the statement the gateway produces it — `coroutineScope` discards its result when its own job
dies, so the proof had to be recorded there or it was gone — and `confirmSameAttemptAfterUnknown`
corrects an already-uncertain row when that same attempt's answer arrives afterwards, guarded on the
same job, attempt id, frozen destination and a strictly positive identifier. **Not a retry**: no
second request, no second attempt, nothing asked of Telegram about what it holds, and `attemptCount`
stays outside the `SET` clause so the audit survives.

**A cancellation names its own origin.** `DispatchCancellationOrigin` is closed and carries no
payload; Android stopping the execution owner stores `EXECUTION_OWNER_STOPPED` rather than sharing
`PROCESS_INTERRUPTED` with a worker that simply vanished. The conservative rule is untouched: after
dispatch, a real cancellation may still be uncertain.

**No screen scope owns a transfer.** Bulk *Send selected* was the last surface running the launcher
inside `viewModelScope`; it now hands each routed job to the one durable chain, which drains serially
through the same launcher under an Android execution owner.

**A durable last-send summary.** A timestamp, six counts and two closed states in its own
`last_send_summary` private preference file, written only after each item's durable outcome commits,
surviving ViewModel recreation, leaving and returning, process death and an upgrade. Dismissible, and
dismissing it removes a card and nothing else. It has authority over nothing, and a stored value that
contradicts what a summary can possibly be is discarded without touching a single upload row.

**Rows an earlier build got wrong.** The first start after the upgrade normalizes any `RESULT_UNKNOWN`
row that already carries a positive message id **and** a confirmation timestamp. A row without that
pair stays unresolved: Telegram is not contacted, nothing is resent, and delivery is inferred from no
file disappearance, elapsed time, notification, byte count, batch row or recollection.

### The rules worth carrying forward

- **Process start is not Activity start.** A ViewModel is built whenever Android builds an Activity,
  so anything only valid after a real process death does not belong there.
- **Reachability and authority are different questions.** D6A7a answered the first correctly and left
  the second unasked, and the fifth device report is what that costs.
- **A proof, never a timeout.** A longer lease makes a wrong answer rarer and leaves it possible.
- **Evidence outranks the absence of evidence, for the same attempt** — stated once, where it can be
  read, instead of implied by a dozen `WHERE` clauses.
- **Capture an answer where it arrives, not where you intend to use it.** A cancelled
  `coroutineScope` throws its result away.
- **A recorded outcome and a rendered one are different things.** The chain's settled events were
  always transient and correct to be; nobody was writing the fact down for a person who was elsewhere.
- **A guard can go vacuous mechanically, not only by anchoring.** Two of this milestone's own new
  guards did: one had not accounted for the Compose compiler's synthetic `${'$'}stable` field, and one
  filtered on `/src/main/` against paths with no leading slash, matching an empty set.

### Deployment verification

**None was performed, because nothing was deployed.** The server repository was not edited, its HEAD
is unchanged at `c7536bf64f23b80feb92f9eac2e1e2c915c0d0fd`, and the deployed HEAD is the same value.
Instagram was not contacted; the viewing session's repair remains the user's and the server
operator's.

## Previous milestone: D6A7e7

| Field | Value |
| --- | --- |
| Task | **D6A7e7** — a public edge that forwards almost nothing, an endpoint the phone derives instead of typing, and a marker it demands before trusting |
| **Final application HEAD** | **`2d54c1d739500ff2aeb308a8e739e3212b405fc0`** — pushed. The build tree is `cbbcaa4`; the final HEAD adds a documentation-only artefact-record commit (verified: it touches only `docs/PROJECT_STATE.md` and `docs/RELEASE_REVIEW.md`), and the hash is unchanged because documentation is not a build input |
| **Final server HEAD** | **`c7536bf64f23b80feb92f9eac2e1e2c915c0d0fd`** (`c7536bf`) — **changed, deployed and verified**, from `eaeba83`. The code commit `07fd920` was deployed first; `c7536bf` adds the deployment record and was redeployed so **`DEPLOYED_HEAD` equals `SERVER_HEAD` exactly** |
| Version | code 46 → **47**, name `0.13.21-d6a7e6a` → **`0.13.22-d6a7e7`** |
| Room schema | **17, unchanged — no migration runs on this install.** The transport selection and the derived public endpoint live in the existing `remote_server` preference file (keys `selected_transport`, `public_base_url`); a URL and an enum are not a reason to move the database. `18.json` is pinned absent by `D6A7E7SurfaceTest`. Server: **`0006_session_connection`**, unchanged — none was needed and none was written |
| Gate | **2892 Android unit tests, 0 failures, 0 errors, 0 skipped. Lint: 0 issues** (both counted from the XML reports, every task with `--rerun-tasks`, the whole gate re-run from the committed tree). Server: **1202 passed, 3 skipped** (1205 collected; 1143/3 at D6A7e4), from the committed tree |
| APK | `app-debug.apk`, 16,737,706 bytes, SHA-256 `bb52ee932de6b511913dc5360061470dceb08dc1316206dad9ee544a816bfa31`. **Copied to Downloads as `TelegramTopicUploader-0.13.22-d6a7e7.apk` with a verified-identical hash. Not installed.** Built from the tree at `cbbcaa4` |
| Production | **The server was deployed and verified, and a restricted public edge is live.** Tailscale Funnel HTTPS 8443 → host loopback 8100 → a digest-pinned nginx edge → the API. Private Serve 443 unchanged and re-verified end to end. **Instagram was not contacted**: no validation, no check, no operator probe; no credential replaced or cleared; no source enabled or disabled. No Telegram content sent. No authenticated mutation during the deployment |
| Hardware | **No line of D6A7e7 is verified.** `docs/D6A7E7_DEVICE_CHECKLIST.md`, all items *not attempted*. New backlog rows **168–178**; rows **143–167 stay open on their own line-by-line evidence** and nothing is closed by this milestone |

### What this milestone is, and what opened it

**Not a device report.** This is roadmap item 3, which the user approved: replace the phone's
Tailscale dependency with a securely authenticated public HTTPS path, **retaining Tailscale on the
VPS** for administration, recovery and any future private pairing. The server half was built,
gated, deployed and verified first; the Android half followed against a live public edge.

### The server half, deployed and verified

Private path unchanged — Serve, HTTPS 443, tailnet-only, straight to the loopback API, and pairing
lives there and only there. New public path — Funnel, HTTPS 8443, into a **stateless nginx edge**
on host loopback 8100, pinned by immutable digest, read-only rootfs, all capabilities dropped, no
database and no credential, forwarding only `/api/v1/*` to the API over the internal compose
network. Neither 8099 nor 8100 is published beyond loopback; the firewall opens none of
8099/8100/8443; tailscaled is the only process presenting a public port; Funnel on 443 is
forbidden and verified absent.

The **Funnel URL is treated as fully public and discoverable.** Pairing, readiness, health, the
OpenAPI document and every unknown path answer one fixed 404, byte-identical to each other. A
plausible bearer header is required before anything is forwarded. Client forwarding identity and
`Cookie` are stripped; one fixed internal marker is injected. There is **no access log at all**, so
an `Authorization` value has nowhere to be logged. Every response carries
`X-Remote-Sources-Ingress: public-v1` and a closed security-header set. `PublicIngressMiddleware`
repeats the contract in-process so an edge regression fails **closed**; public 401s lose their
machine `reason` while private ones keep it; rate limiting is bounded process memory keyed by a
SHA-256 digest, never the raw token.

**Two invariants:** a public client without a valid active device token can neither read nor mutate
any application state, and **public ingress can never mint a device token**.

Verified from an ordinary off-tailnet internet client, unauthenticated — root, unknown paths,
health, readiness, OpenAPI, a well-formed pairing exchange, TRACE, DELETE and PUT all 404;
tokenless and malformed-token 401; a 300 000-byte mutation 413; spoofed forwarding headers and a
forged marker changed nothing; the marker and all five security headers present; both refusal
bodies sanitized. And confirmed **live in-process**: with the marker set by hand over host
loopback, the deployed application answered 404 for health, readiness, OpenAPI and pairing while
the same requests unmarked answered 200, 200, 200 and 422.

### The Android half

**Two transports, one selected at a time.** The public endpoint is **derived** from the endpoint
the user already proved by pairing — same hostname, HTTPS, port 8443, no credentials, no path, no
query, no fragment — and **there is no field, argument or code path that accepts a typed one**. A
non-HTTPS private endpoint derives nothing; an IP-address substitution is refused, because the edge
presents a certificate for a name.

**Nothing is saved until an authenticated probe proves it:** `GET /api/v1/device` with the token
the device already holds, requiring HTTP 200, the exact `X-Remote-Sources-Ingress: public-v1`
marker — checked *before* the body is read — and a device-shaped answer. Health is deliberately
not the probe: over public ingress it does not exist, and a transport that cannot carry an
authenticated request is not one worth switching to. Redirects stay disabled outright, so a bearer
token cannot cross an origin; a `3xx` is its own refusal.

**Proving an endpoint and choosing to use it are two decisions, and the second is the user's.** A
probe that fails saves nothing, switches nothing, clears nothing, and never reports a working
pairing as unpaired. A public selection with no proven endpoint **refuses rather than falling back**
to the private endpoint the user chose to stop depending on. No racing: one action produces one
request to one origin, through the single `activeBaseUrl` seam every authenticated request and
every thumbnail already goes through.

**Pairing and recovery stay private-only**, on both sides. If the token is ever lost or revoked:
enable Tailscale on the phone, select the private transport, pair over private 443, then switch
back.

### The one narrowing that was load-bearing

Both endpoints share a hostname **by design**, so the "check Tailscale" hint — keyed on host shape
since D6A — would have fired for a *public* failure and sent the user to look at a VPN they had
deliberately turned off. The public port now answers that question, and a test pins it.

### The rules worth carrying forward

- **A public URL is not a secret, so nothing may be load-bearing on it.** Design as if the hostname
  is known, because it is discoverable.
- **Two lines of defence, because a configuration file is a place a policy can regress.** A marker
  that only ever *restricts* is safe to trust without knowing the peer.
- **Absence cannot be misconfigured.** No access log at all beats a carefully-formatted one.
- **A refusal that maps the routes is a leak.** Every blocked public path answers the same bytes.
- **Derive what the user already proved; never ask them to retype it.** A second typed copy of a
  hostname is a second chance to get it wrong, and a place somebody could be talked into putting
  an attacker's host.
- **Prove, then switch — never in one step.** A probe that switched by itself would move the app
  off a transport that is currently working, without being asked.
- **Two endpoints that differ only by port need a discriminator that is the port.** Anything keyed
  on the host will answer the same for both and say the wrong thing about one of them.
- **Re-scope a guard, never delete it.** The exact version pin moved to `D6A7E7SurfaceTest` and
  `D6A7E6ASurfaceTest` became the `>= 46` floor; the server's "Funnel is off" check became "no
  Funnel on 443" and its old PCRE lookahead under `grep -E` — which could never fire — was replaced
  by parsed JSON.
- **A guard sliced on a comment anchor is a guard that can go vacuous.** Three of this milestone's
  own new guards did exactly that: `codeOf` strips comments, so a `// -- section` anchor sliced to
  end-of-file and the assertion silently widened. They are anchored on code now.

### Deployment verification

Deployed HEAD exact and 40 characters, equal to `SERVER_HEAD`; migration head unchanged in both the
script directory and the database; both containers healthy; 8099 and 8100 loopback-only; no
firewall rule for any guarded port; private Serve 443 verified end to end through tailscaled with
pairing still reachable. Tailscale 1.98.9 — the node already carried the `funnel` attribute with
`ports=443,8443,10000` plus MagicDNS and HTTPS certificates, so **no approval was required and no
tailnet policy was changed or broadened**.

**Instagram was not contacted, and the clock proves it.** Read-only before and after, printing no
source identity: one enabled source, preset `daily`, Stories off, the second source still disabled,
session state `connected`, the previous credential's `authentication_expired` still the historical
`last_signal`. The next check was **395 minutes** away before and **389 minutes** after — it
advanced only by the wall clock that elapsed, and a check would have reset it. Row counts identical
throughout.

### Previous milestone, for reference (D6A7e6a)

### The two physical-device findings that hotfix answered

D6A7e6 was installed **over the existing application data** on the handset and exercised.

1. **The principal D6A7e6 corrections appear to work.** The previously reported upload, Review,
   thumbnail and Preview problems are reported corrected in use. **A broad physical smoke pass,
   not evidence that any checklist line passed** — rows 143–161 record the positive signal and
   stay open on their own line-by-line evidence.
2. **An orphan explicit-send notification.** An ongoing notification whose Hebrew title means
   *Sending your media* appeared by itself while no explicit send was active, no item was in the
   upload queue, nothing was uploading and nothing required Review — and opening the application
   through it showed no corresponding work. The notification was not truthful about current work.
   Tailscale was disabled on the phone at the time; the explicit-send path is local and **the
   finding must not be attributed to Tailscale**. **Which lawful late ending produced the physical
   occurrence is deliberately not claimed** — the established defect is that JobService completion
   could leave its detached notification behind at all.

**Neither finding is settled by a test run.** No private file name, identifier or screenshot
content from the report is recorded anywhere.

### What shipped

**One typed settle decision for the shared notification.** `ExplicitSendNotificationCleanupPolicy`
(domain, pure) is asked by both the UIDT JobService and the foreground service whenever a runner's
run settles: `OWNERSHIP_REFUSED` — and any owned ending with a live successor on the chain —
resolves to `DETACH_FOR_OTHER_OWNER`, because one chain shares one notification id and a loser
removing it would strip the winner's required progress notification off a running transfer; every
other owned ending resolves to `REMOVE_NOTIFICATION`, including an internal failure that asked for
a reschedule — a reschedule is an acceptance, not an entry, and a re-entered job attaches its own
fresh notification before any work. The JobService keeps `JOB_END_NOTIFICATION_POLICY_DETACH`
while work is live, swaps the identical last-shown content to the platform's own
`JOB_END_NOTIFICATION_POLICY_REMOVE` at an owned settle, finishes (rescheduling only when the
typed outcome asks), and cancels any previously detached copy behind the same typed decision. The
foreground service maps DETACH to `STOP_FOREGROUND_DETACH` and REMOVE to a cancel plus
`STOP_FOREGROUND_REMOVE`; a run the platform stopped mid-flight still removes.

**The obsolete UIDT backup stands down after the drain.** In the runner, for owners other than the
JobService itself: the durable platform-request state is cleared — the call moved from inside the
lease, where its own `ownerToken IS NULL` guard had silently refused it, to after the release,
where it actually fires while the same guard still protects any successor's fresh request state —
and the pending explicit-send JobScheduler entry is withdrawn as a best-effort courtesy on
`EXPLICIT_SEND_JOB_ID` only, never the batch's. The JobService owner never issues the courtesy:
`JobScheduler.cancel` on the running job's own id would stop the very runner doing the cancelling.
Cancellation is not the duplicate-safety mechanism — the durable ownership lease is, and a job
passing through the cancellation loses it, sends nothing, and now also removes its own
notification. A new request after the drain schedules a fresh backup normally.

**One bounded, idempotent, connectivity-blind orphan reconciliation.**
`ExplicitSendNotificationReconciler` runs once at application process start and again when an
explicit-send notification deep link opens the application. Preserve-first: durable work preserves,
a live lease preserves, a live single-item transfer preserves; only provable emptiness cancels,
through a remover port whose platform half is a single `NotificationManager` cancel of this
application's own notification id. It never starts an upload, a runner, a job or a service; never
contacts Telegram; never touches a job row, confirmation evidence, RESULT_UNKNOWN or a durable
request. Its constructor takes exactly the three durable facts, the remover and a clock —
`D6A7E6ASurfaceTest` pins the lifecycle file free of every gate, network and Remote Sources
symbol. The deep link routes to the Send Queue, never Review, and no fake Queue row is shown to
explain a removed notification.

**The gate grew with the fix.** 34 new deterministic tests: the policy truth table; every
previously-orphaning ending driven through the real runner; the two-owner races in both
directions; the late backup entering after the drain; the courtesy withdrawal, its owner guard and
its non-role in duplicate safety; the moved platform-request clear actually firing; the
reconciliation's preserve/cancel table, idempotence and refusal to change anything durable; the
deep-link halves on the ViewModel; and the structural pins. Every touched guard was re-scoped with
its reason in the file, never deleted: the foreground service's `val lost =` slice re-pointed at
the policy branches, D6A7E6SurfaceTest's exact version pin relaxed to the `>= 45` convention with
`D6A7E6ASurfaceTest` owning the exact 46, `AppVersionTest` moved to the new declaration, and the
in-app start's withdrawal count updated from one to two deliberate courtesies.

### The rules worth carrying forward

- **A notification is a claim about current work.** Attaching one is the platform's requirement;
  ending one is the application's, at every settle — or the user eventually finds it standing over
  an empty app.
- **The loser rule and the orphan rule are one policy.** Detach-while-live and remove-at-settle
  belong in a single typed decision both services ask, never in two private conditionals that can
  drift.
- **A recovery owner is not queued work.** Stand the backup down when the chain it was scheduled
  for drains; keep the lease, never the cancellation, as the duplicate guard.
- **A guarded write that can never fire is a comment wearing SQL.** Check a guard's reachability
  from its call site, not just its presence — the in-lease `clearPlatformRequest` had never fired.
- **Do not attribute a local defect to a coincident network fact.** The cleanup's inputs are
  pinned connectivity-blind so the attribution cannot creep in later.

### The user-approved roadmap order after this hotfix — recorded, not implemented

1. Reconnect the dedicated Instagram viewing session, with a conservative operating profile.
2. Configure Reddit OAuth and validate one disposable source.
3. Replace the phone's Tailscale dependency with a securely authenticated HTTPS access path,
   retaining Tailscale for server administration.
4. Validate/configure TikTok and X.
5. Handle 9GAG separately — the deployed host currently receives an anti-bot challenge.

None of these server/network items is part of D6A7e6a; Instagram was not contacted.

### Deployment verification

**None was performed, because nothing was deployed.** The server repository was not edited, its
HEAD is unchanged at `eaeba836650f67245b0bd8265b46f6e03d2cd29d`, and the deployed HEAD is the same
value. Instagram was not contacted; the viewing session's repair remains the user's and the server
operator's.

### Previous milestone, for reference (D6A7e6)

| Field | Value |
| --- | --- |
| Task | **D6A7e6** — a corrective milestone opened by the third physical run: a tap that starts its own service, a confirmed item that leaves Review, and a preview that can stage what it cannot seek |
| **Final application HEAD** | **`dbead271995ea3cd9b414b85ad0542d414d9e1f8`** — pushed. The build tree is `bc38827`; the final HEAD adds a documentation-only artefact-record commit, and the hash is unchanged because documentation is not a build input |
| **Final server HEAD** | **`eaeba836650f67245b0bd8265b46f6e03d2cd29d`** (`eaeba83`) — **unchanged, not redeployed, not edited, not contacted for a change** |
| Version | code 44 → **45**, name `0.13.19-d6a7e5` → **`0.13.20-d6a7e6`** |
| Room schema | **17, unchanged — no migration runs on this install.** The foreground-first start fits the existing `explicit_send_runner` slot; thumbnails and Preview staging are cache state, not Room state. `18.json` is pinned absent by `D6A7E6SurfaceTest`. Server: **`0006_session_connection`**, unchanged |
| Gate | **2805 Android unit tests, 0 failures, 0 errors, 0 skipped. Lint: 0 issues** (both counted from the XML reports, every task with `--rerun-tasks`, the whole gate re-run from the committed tree). Server: **not run — the repository was not touched** |
| APK | `app-debug.apk`, 16,683,920 bytes, SHA-256 `9fe6bcb6f07c8179af1ebfe565901520492278d12a37d26929f691fd2a86e13c`. **Copied to Downloads as `TelegramTopicUploader-0.13.20-d6a7e6.apk` with a matching hash. Not installed.** Built from the tree at `bc38827` |
| Production | **Untouched.** No server edit, no deployment, no restart. **Instagram was not contacted**: no validation, no check, no operator probe; no credential replaced or cleared; no source enabled or disabled. No Telegram content sent |
| Hardware | **No line of D6A7e6 is verified.** `docs/D6A7E6_DEVICE_CHECKLIST.md`, 42 items, all *not attempted*. **Backlog rows 143–149 failed on hardware at D6A7e5 and are re-opened; row 150 stays open and is now non-blocking; new rows 151–161.** The D6A7e3 Preview checks are still owed in full |

### The four physical-device findings this milestone answers

D6A7e5 was installed **over the existing application data** on the handset and exercised.

1. **Send now still did not start an upload.** The exact visible sentence was *הבקשה נרשמה. ממתין
   ש־Android יפעיל את ההעלאה.* — no moving byte progress, no Telegram post, the item stayed
   waiting, the application still talking about an Android request rather than performing the
   user's action. **A D6A7e5 hardware failure: rows 143–149 are not completed.** Row 150 remains
   truthful — *why* the platform never entered its UIDT JobService is still not established, and
   D6A7e6 made that question **non-blocking** rather than answering it.
2. **A Telegram-confirmed file remained in active Review**, offered an action equivalent to *Do not
   upload this*, and pressing it produced a sentence explaining that Telegram already confirmed the
   file — the screen and action model disagreed with the durable evidence. The durable trace: a
   per-job projection served the media's evidence-free `AWAITING_ROUTING` placeholder as routing
   work; the durable retirement ran only at startup and on other screens' refreshes; the per-media
   ignore refused *after* the tap.
3. **Some Review cards showed אין תמונת פתיחה while siblings had thumbnails** — per-media, not
   folder-wide: one `getFrameAtTime(0)` was the whole strategy, every failure collapsed into one
   null, and the sentence also showed while the decode was still running.
4. **Preview said לא הצלחנו לקרוא את הקובץ הזה לצורך נגינה for a file that stayed uploadable** —
   the player needs a seekable descriptor, the upload reads a one-pass stream, and *readable but
   not seekable* had no path at all.

**None of the four is marked fixed by a test run.** The private file names visible in the report's
screenshots are recorded nowhere.

### What shipped

**Send now means queue and start.** From the visible tap: **persist → start the `dataSync`
foreground service immediately → schedule the UIDT job as backup**. `ExplicitSendForegroundStarter`
(the renamed, promoted fallback port) is called from inside `requestSend` before the scheduler; the
six-second watchdog survives as the **verifier** — one recovery retry, then the exact durable
refusal (`ForegroundStartNotAllowed`, `RunnerDidNotStart`) with the corrective *resume the send
queue* action. Both owners share the one repository, runner, durable lease, `UploadLauncher`, claim
machine and notification; a late UIDT entry loses the guarded `UPDATE` and sends nothing. The
scheduler can no longer reach the transfer service at all, and `cancelPending` no longer stops it —
a started service is never merely pending. One service lifetime drains the whole FIFO; a retryable
upload failure **settles the explicit authorization** (the job keeps its own bounded retry; a later
explicit action resends); RESULT_UNKNOWN still blocks automatic resend.

**No user-facing "request recorded" state.** `WAITING_FOR_ANDROID_TO_START` and
`STARTING_FALLBACK_RUNNER` collapsed into one `STARTING_UPLOAD`; every sentence moved to the send
queue's vocabulary in both locales; the chain card is titled *תור השליחה*; the forbidden sentences
are pinned absent from **every** string value; the tap's outcome is `Starting`, never
`WaitingForPlatform`; and a queued-or-active row shows its state instead of an actionable Send-now
button (`activeExplicitSendJobIds` covers even the claim-to-registration window).

**The sanitized diagnostics are finally visible** — *פרטי אבחון*, collapsed under the send-queue
card: foreground service entered / UIDT entered (its own new `FOREGROUND_SERVICE_ENTERED` event —
the owners no longer share one entry event), ownership, launcher, registration, bytes, the last
recorded step with elapsed seconds, and the last durable refusal category read from the runner
slot, so a process death loses the timeline and never the failure. `ExplicitSendDiagnosticsSummary`
is the pure projection; `ExplicitSendDiagnosticsSource` is the read port.

**Confirmed media leaves active Review, reactively.** Both canonical projections carry a
correlated sibling-confirmation `EXISTS` (`mediaConfirmedElsewhere`); `DashboardGrouping.classify`
retires a destination-less, evidence-free placeholder whose media a sibling positively confirmed —
into the same `CANCELLED_OR_RETIRED` group the durable repair writes, so projection and repair
cannot disagree and all four surfaces stay consistent. The row leaves the grid on the confirming
transaction's own commit. `ReviewIgnorePolicy` refuses at the media level and the grid gates the
control on it, so *Do not upload this* disappears before it could be refused; Preview over
confirmed media shows the confirmation banner and no pre-upload controls; a genuinely distinct
unresolved job stays actionable under its own job id.

**Confirmed local deletion from History.** *מחקו את העותק המקומי לצמיתות* on a confirmed
KEEP-policy row's History entry — the automatic policy and a later explicit deletion are different
decisions — through `deleteConfirmedLocalSource(jobId, destinationId)` and the unchanged D4B
engine: both halves of the confirmation demanded by the guarded `UPDATE`, the exact SAF document
re-proved by identity, size, mtime and full SHA-256, no network, no resend, the exact resulting
category shown, and *נסו שוב למחוק את העותק המקומי* after a failure. Nothing is ever represented
as Android Trash.

**One shared seekable preview source.** `MediaThumbnailSource` became the preview-media access
layer for Review thumbnails, Preview opening frames and playback: provider document thumbnail →
direct read-only descriptor frames at `PreviewThumbnailStrategy`'s bounded ladder (start, ~1 s,
~10 %, midpoint; first valid bitmap wins; never a whole-video decode) → one staged exact byte copy
in application cache for the readable-but-unseekable case. `PreviewStagingPolicy` pins the bounds:
256 MiB per file (deliberately above the Telegram ceiling — Preview capability and upload
eligibility are independent), 512 MiB total with deterministic LRU of unreferenced copies, a
64 MiB free-space margin, two concurrent copies, opaque SHA-256 keys embedding the source evidence
(a changed file is a different key by construction), byte-count verification, `.part` staging with
process-start cleanup. Playback retries **once** from the staged copy — the spent retry lives in
`VideoRenderState`, `recreate` preserves it, so no loop is reachable — under the unchanged D6A7e3
generation/surface/first-frame rules; a staging refusal names the exact step
(`SOURCE_MISSING`, `PERMISSION_REVOKED`, `STAGING_FAILED`, `STAGING_SPACE_UNAVAILABLE` joined the
closed classification). *אין תמונת פתיחה* only after every strategy settles; ten classified
thumbnail-failure categories under *More actions* with a bounded retry that invalidates exactly
one result. §15's audit: **one media viewport** — the poster draws inside the same Box the
`TextureView` plays in and is removed by the first real frame; a terminal failure keeps one static
image, no stale surface, no audio behind it. **The preview cache is never upload evidence** —
`D6A7E6SurfaceTest` pins the upload files free of every staging symbol and the cache free of every
transport symbol.

### The rules worth carrying forward

- **A user's verb is the contract.** *Send now* promises queue-and-start; internal scheduling
  stages may never be its answer, and the third run is what one leaked stage costs.
- **A fallback reached through a deadline can fail exactly like the primary.** When it matters,
  the fallback must become what the action itself does, and the deadline a verifier.
- **Per-row projections need per-media evidence wherever the decision is per-media** — otherwise
  the control outlives the decision and exists only to be refused.
- **A control disappears before it can be refused**, never fails after being pressed.
- **Presentation readability and upload readability are different capabilities.** Bridge them with
  a bounded private copy for presentation only, and pin the two worlds apart structurally, in both
  directions.
- **A diagnostic nobody can open is not a diagnostic.** The trail existed at D6A7e5; the panel is
  what makes row 150 answerable from the device.
- **Re-scope a guard, never delete it.** Every guard the renames turned red was re-pointed at the
  new exact contract with its reason in the file; the version pin moved to the `>= 44` convention
  because `D6A7E6SurfaceTest` owns the exact pin; the removed string keys are pinned *absent*; the
  platform-surface exemption list is still exactly one file.

### Deployment verification

**None was performed, because nothing was deployed.** The server repository was not edited, its
HEAD is unchanged at `eaeba836650f67245b0bd8265b46f6e03d2cd29d`, and the deployed HEAD is the same
value. Instagram was not contacted; the viewing session's repair remains the user's and the server
operator's.

### Previous milestone, for reference (D6A7e5)

| Field | Value |
| --- | --- |
| Task | **D6A7e5** — a corrective milestone opened by the first physical run of D6A7e4: a chain Android owns, a deletion that explains itself, and five presets you can reach. **Extended mid-milestone by a sixth device finding:** an accepted schedule was being presented as started execution, so it also separates the four stages, gives the bounded start deadline an owner and an automatic foreground-capable fallback, and adds a sanitized end-to-end trace |
| **Final application HEAD** | **`79db54e4a1b87ba689e772cc9f7652793b2a5ec4`** — pushed |
| **Final server HEAD** | **`eaeba836650f67245b0bd8265b46f6e03d2cd29d`** (`eaeba83`) — **unchanged, not redeployed, not edited, not contacted for a change** |
| Version | code 43 → **44**, name `0.13.18-d6a7e4` → **`0.13.19-d6a7e5`** |
| Room schema | **16 → 17.** One additive migration, `MIGRATION_16_17`, creating one table (`explicit_send_runner`), rewriting no row, with no destructive fallback. Server: **`0006_session_connection`**, unchanged — none was needed and none was written |
| Gate | **2717 Android unit tests, 0 failures, 0 errors, 0 skipped. Lint: 0 issues** (both counted from the XML reports, every task with `--rerun-tasks`, re-run in full after the last edit). Server: **not run — the repository was not touched** |
| APK | `app-debug.apk`, 16,618,342 bytes, SHA-256 `8584e73d09815af5f4baae64f5d2fa38d36c7c3e86241e613316e141bc722ccb`. **Copied to Downloads with a matching hash. Not installed.** Built from the tree at `ed501a7`; the final HEAD adds a documentation-only artefact-record commit, and the hash is unchanged because documentation is not a build input |
| APK in Downloads | `/sdcard/Download/TelegramTopicUploader-0.13.19-d6a7e5.apk` — hash verified identical |
| Production | **Untouched.** No server edit, no deployment. **Instagram was not contacted**: no validation, no check, no operator probe; no credential replaced or cleared; no source enabled or disabled. No Telegram content sent |
| Hardware | **No line of D6A7e5 is verified.** `docs/D6A7E5_DEVICE_CHECKLIST.md`, **50 lines** (lines 36–50 are the second device report’s hardware checks, to be done first), all *not attempted*. **The D6A7e3 Preview checks are still owed in full** |

### The six physical-device findings this milestone answers

D6A7e4 was installed **over the existing application data** on the handset and exercised.

1. **The explicit Send now FIFO did not reliably continue when the user switched to another Android
   application.** It is **not** established whether the active transfer stopped, whether it completed
   and the next explicit request never started, whether the process was suspended, or whether the
   process was killed and later reconciled. **Do not repeat any of the four as a cause.**
2. **Two positively uploaded videos remained on the device**, with *Delete source after confirmed
   upload* expected. **No cause is claimed** — in particular, do **not** say the storage provider
   refused deletion. Which of the general retention categories applies is a question about the
   durable rows on that handset, and the application can now answer it per row.
3. **The Instagram viewing session is currently rejected.** The card visibly stated *viewing
   connection rejected*, last server session use a few minutes earlier, purpose **source
   validation**, outcome **failed**. A live rejection observed by a real operation, **not** a stale
   cached *connected* value. See the section below.
4. **Only two of five schedule presets were visibly reachable** on the physical narrow RTL screen —
   Normal (4 h) and Relaxed (8 h). The 2-, 12- and 24-hour options could not practically be selected.
5. **A nearly screen-high empty vertical block** in the expanded source editor, between the schedule
   controls and their explanatory text. A layout defect, not intentional spacing.

6. **An accepted scheduling request was being presented too close to actual execution.** Reported
   against **this milestone's own build** and integrated into it rather than deferred. Pressing *Send
   now* showed a message meaning *a request was sent to Android to upload in the background*, and
   then: no upload began, no byte progress appeared, no Telegram post was created. Further taps added
   further durable requests — the FIFO grew correctly — and **no runner ever drained it**.

   **This one's application-level root cause IS established and may be stated: acceptance was a
   terminal state.** Three omissions, all in this repository. (a) A `startDeadlineAt` was written and
   **nothing ever consumed it** — the only reader was a status a screen fetched on window focus.
   (b) `MainViewModel` computed an `ExplicitSendChainStatus` that **no composable read**: the one
   state that most needed a screen was the one state no screen could show. (c) On Android 14+ there
   was **no second execution owner**, because the UIDT job was treated as the only possible path
   rather than the preferred one. The only remedy that existed was a manual *Start now* the user had
   no reason to know they needed.

   **Do not state why the platform did not enter the job.** A network constraint the device could not
   satisfy, an OEM background policy, a platform-side start refusal — all remain candidates and none
   is asserted anywhere. Durable backlog row **150**, still open.

**None of the six is marked fixed by a test run.** Findings 1, 2, 4, 5 and 6 are addressed in code and
re-checked on the handset; finding 3 is not this milestone's to close, and the *platform's own reason*
for finding 6 is not this repository's to answer.

### What shipped

**An Android platform execution owner for the explicit-send chain.** Android 14+: a dedicated
user-initiated data transfer `JobService` on its own fixed job id `4_734_200` — deliberately **not**
the batch's `4_734_100`, since one shared platform slot would mean scheduling either silently
replaced the other. Required Internet network, an estimated upload-byte total summed from already
verified hashed sizes, the required progress notification attached **before** any long-running work,
and exactly one extra: an opaque constant. Below Android 14: one narrowly scoped data-transfer
foreground service, started only from the visible tap. WorkManager was preferred by the instruction
and is genuinely unavailable — that artifact is not a dependency here and cannot be resolved by an
offline build — so the fallback and its two permissions (`FOREGROUND_SERVICE`,
`FOREGROUND_SERVICE_DATA_SYNC`) are documented in the manifest. No boot receiver, no wake lock, no
alarm, no new exported component, and **no second upload engine**: every item still goes through the
one unchanged `UploadLauncher.uploadNow`.

**One durable runner owner.** Four runners can reach the chain — a foreground start, the JobService,
the fallback service, restart recovery. Exactly one wins a lease held in one new `explicit_send_runner`
row and taken by a **single guarded `UPDATE`**; the losers acquire nothing, claim nothing and send
nothing. Expiry is evidence-based (a heartbeat that stops) and releases *ownership of the chain* only
— it never clears dispatch evidence, never re-arms a request whose job may have reached Telegram, and
never turns an uncertain outcome into a retryable one.

**Persist first, then ask the platform.** A refusal, a missing notification permission, or a process
death between the two never loses the tap, and the screen says which of those it was: starting,
waiting for Android, active, waiting behind another explicit send, platform scheduling refused, or
notification permission required. Returning to the app reads the durable chain — never a second tap.

**Four stages, and a bounded deadline that something owns** — the correction the sixth finding forced,
replacing the two-minute window described above, which was recorded and then consumed by nothing.

* **Four ordered stages**: `REQUEST_RECORDED` → `PLATFORM_SCHEDULE_ACCEPTED` →
  `RUNNER_ENTERED_AND_OWNS_CHAIN` → `MEDIA_UPLOAD_STARTED`. `ExplicitSendStage.mayClaimUploading` is
  true for the last and no other, and the rule lives on the type so no screen can inherit an older,
  more optimistic sentence. A surface guard fails the build if the stage-2 sentence ever acquires a
  word meaning *uploading*, in **either** locale.
* **A six-second start deadline**, not two minutes. It is now the trigger for a foreground-service
  start, and Android permits one only while the application still qualifies to make it — so a
  minutes-long window would always arrive too late to use. `ExplicitSendStartWatchdog` owns it.
* **Exactly one of three outcomes inside that window, and never a fourth:** the UIDT JobService enters
  and takes the durable lease; or the immediate foreground-capable fallback is started while the
  original visible tap still qualifies and takes it; or an **exact** sanitized refusal
  (`RunnerDidNotStart`, `ForegroundStartNotAllowed`, or whatever the platform answered) is written to
  the durable runner slot, shown on the Queue chain card **and** on the owning row, with a corrective
  *Start now* beside it. **No second tap is ever required.**
* **The same `dataSync` service is now also the Android 14+ fallback.** The UIDT job stays primary and
  is still tried first. Non-exported, no intent filter, foreground immediately with the same required
  notification, stops itself when the chain empties, no boot receiver, and it cannot start itself —
  its only two callers are the pre-Android-14 scheduling path and the deadline a visible tap armed.
* **Ten exact user-facing sentences, one per state, in both locales, never concatenated.** The old
  *Android was asked to run this upload in the background* is replaced by *waiting for Android to
  start the transfer*.
* **The chain status is finally rendered.** It had been computed and read by nothing.

**A sanitized end-to-end trace.** `ExplicitSendDiagnosticEvent` covers request → schedule attempted →
accepted/refused → platform job pending → JobService entered → notification attached → ownership
acquired/refused → start deadline exceeded → fallback attempted/accepted/refused → launcher called →
transfer registered → upload started → settled → runner stopped. Sanitized **by construction**: the
recorder is a `fun interface` whose one method takes an enum member, with no overload that could take
a message, a throwable, a count or an identifier — so no file name, URI, hash, destination, Telegram
id, token, package internal or `JobParameters` extra can pass through it. In-memory and bounded,
because production logging is forbidden here and logcat is not reachable by the user.

**One real defect found while building that.** A runner that *lost* the ownership race used to cancel
the chain's notification on its way out. One chain correctly has one notification id, so a loser could
tear down the **winner's** required progress notification and leave a genuine transfer running
invisibly and unstoppably. A loser now detaches and leaves the posted notification alone.

**One progress notification** on its own channel and id: ordinal, total, real byte progress,
*waiting for Telegram to confirm* as its own phase, the exact waiting count, **Cancel current upload**
and **Cancel the rest**. Neither carries an identifier; the active request is resolved from the
durable chain and matched against the live transfer's owner, so neither can reach a batch item, an
album, a repair, or a foreign request. `onStopJob` writes nothing durable, because a Task Manager stop
may take the process with it.

**The deletion audit produced two repairs.** The task written inside the confirming transaction is
best-effort by design (a confirmation must never be lost over a bookkeeping row), so a confirmation
can commit while its task does not — and nothing looked for the result, while History rendered the
absence of a task as *Source kept*. An idempotent `SourceDeletionReconciler` now creates exactly one
`PENDING` task for a confirmed, `DELETE_AFTER_CONFIRMATION` upload with a strictly positive message
id, a durable confirmation timestamp and no task for its media row; it runs at startup, when a
platform runner starts, after a confirmed upload and before a sweep, and it never alters a confirmed
upload, contacts Telegram, resends, creates a task for `KEEP`, or treats an unproven manual
`RESULT_UNKNOWN` resolution as a confirmation. Second, a task waiting on another job was only
reconsidered by a sweep; `SourceDeletionWakeCoordinator` plus a pure `SourceDeletionWakePolicy` table
makes the blocker *ending* the trigger, and refuses by name every transition that still needs the
bytes. A sweep exception becomes a sanitized flag on a report and can never change an upload outcome.

**History says exactly one thing**, from `SourceRetentionPolicy` — a pure function over the frozen
policy, the durable task and the absence of one, producing one of fifteen named categories including
*repair pending*, which is what a confirmed upload with no deletion task actually is.

**One shared wrapping schedule selector** (`RemoteSchedulePresetSelector`, a `FlowRow`) used by both
Add source and the existing source editor. All five presets laid out and hit-testable on a narrow
portrait phone, no horizontal scroll and therefore no hidden scroll position to restore wrongly,
labels unshortened, domain order untouched. **The platform tab row keeps its own horizontal scroll.**

**The layout blank was traced before anything changed.** The expanded card's subtree contains no
`fillMaxSize`, `fillParentMaxHeight`, `fillMaxHeight`, `IntrinsicSize`, `BoxWithConstraints`, vertical
`weight`, nested `LazyColumn` or second vertical scroll container — the only `weight` there is
horizontal, in the header `Row` — so the blank could **not** have come from a child receiving the
viewport's remaining height. The one construct on that path measuring children with unbounded
constraints was the horizontal scroll container the presets sat in, replaced by a wrapping layout
whose height is the sum of its children by construction. No hard-coded height, spacer, or hidden
content. **This is a structural change with a static guard, not a confirmed fix.**

**The rejected Instagram session states its own repair.** `REJECTED_OR_EXPIRED` used to fall through
to nothing. It now says Instagram no longer accepts the stored viewing session, that a fresh cookie
export from the dedicated viewing account must be configured **on the server by its operator**, and
that refreshing only rereads server state and does not reconnect — nor does checking a source repair
a session. **Refresh status** and **How the connection works** stay; there is no Connect and no Retry
validation button, because neither could perform the repair.

### The rules worth carrying forward

- **`ApplicationScope` is not background execution.** It says which object owns the work *inside* the
  process; it says nothing to Android about whether the process may keep running. Every comment and
  document that implied otherwise was corrected this milestone. An explicit user-authorized transfer
  chain needs a **platform** execution owner.
- **Ownership, not cancellation timing.** Cancelling a pending platform job always leaves a window in
  which a job already on its way in enters anyway. One guarded durable `UPDATE` has no window.
- **Acceptance is not a start.** `RESULT_SUCCESS` and an entered JobService are different facts, and
  conflating them is how the batch reached a dead end nothing ever asked about again. The chain
  records both, and the bounded window turns *still waiting* into a state with an action on it.
- **Persist the tap before asking the platform.** Then no scheduling outcome can lose it.
- **A missing deletion task is not "kept by policy".** The absence of a row is not a decision. The
  frozen policy is what distinguishes them, and History now carries it.
- **A blocker ending is itself a trigger.** Waiting for an unrelated future upload, or for a restart,
  is not a schedule.
- **Re-scope a guard, never delete it.** Roughly forty pre-existing static guards went red. All were
  re-scoped to the new exact values — never relaxed to inequalities — behind one **named exemption
  list of one file**, which `D6A7E5SurfaceTest` holds to one file. Two slices that had silently
  widened (`D3B15SurfaceTest`'s entity slice, `D6A7E1SurfaceTest`'s cancel slice) were tightened.
- **A control off the end of an invisible scroll does not exist.** Five chips in a
  `horizontalScroll` row meant three the user could not reach on a narrow RTL screen.
- **Trace a measurement defect before changing it, and say what the trace did and did not prove.**

### The Instagram viewing session, as found — do not repeat an older claim

The installed D6A7e4 build's card visibly stated **viewing connection rejected**, with the **last
server session use a few minutes earlier**, its **purpose source validation**, and its **outcome
failed**. This is a live rejection observed by a real operation — not merely an old cached
*connected* value.

Recorded truthfully:

- the dedicated viewing credential **remains configured**;
- Instagram is **currently rejecting** that session;
- a **source-validation operation observed** the rejection;
- **Refresh status does not reconnect the account** — it only rereads what the server says;
- **repeated validation with the same rejected session is not a repair.**

**D6A7e5 neither caused nor repaired this**, and contacted Instagram at no point: no validation, no
check, no operator probe, no cookie replaced or cleared, no source enabled or disabled, and no server
state changed. Earlier handoffs before D6A7e4 say the session is *connected*; that was true at D6A7e2
and on the morning of 2026-08-01, and is a claim to re-verify, never to repeat.

**The open follow-up, and it is the user's and the server operator's, not an agent's:** sign in to the
dedicated viewing account again, export a fresh cookie jar, import it through the approved server
operator flow, and perform **one separately authorised bounded validation**. Nothing about this is
D6A7e5's to do.

### Deployment verification

**None was performed, because nothing was deployed.** The server repository was not edited, its HEAD
is unchanged at `eaeba836650f67245b0bd8265b46f6e03d2cd29d`, and the deployed HEAD is the same value.

### Previous milestone, for reference

| Field | Value |
| --- | --- |
| Task | **D6A7e4** — a name the validation already had, two cadences nobody could choose, and a list that admits what is wrong |
| **Final application HEAD** | **`989f4270bfa86018c3a695bc2a1f9c12fec43f5c`** — pushed |
| **Final server HEAD** | **`eaeba836650f67245b0bd8265b46f6e03d2cd29d`** (`eaeba83`) — **pushed, deployed and verified**, from `478323c` |
| Version | code 42 → **43**, name `0.13.17-d6a7e3` → **`0.13.18-d6a7e4`** |
| Room schema | **16, unchanged.** Server: **`0006_session_connection`**, unchanged |
| Gate | **2607 Android unit tests, 0 failures. Lint: 0 issues.** Server: **1143 passed, 3 skipped** |
| APK | `app-debug.apk`, 16,514,245 bytes, SHA-256 `97cc5959889cfd601748533c509bbe0a972ebfd7a3a864d28855ec9c6079cffe` |
| APK in Downloads | `/sdcard/Download/TelegramTopicUploader-0.13.18-d6a7e4.apk` — hash verified identical |
| Hardware | **Installed on the handset and exercised. Five findings came back — all five are the subject of D6A7e5.** `docs/D6A7E4_DEVICE_CHECKLIST.md` now carries a record of them at the end |

### Previous milestone, for reference



| Field | Value |
| --- | --- |
| Task | **D6A7e3** — a corrective milestone opened by the first physical run of D6A7e2: a swipe that goes the way you push it, a screen that scrolls under your finger, and a video that admits it is not there |
| **Final application HEAD** | **`dc3f6331cfae9437ed0683210974a347fa9ccc11`** — pushed |
| **Final server HEAD** | **`478323c1ea6ec61a708b59b6b0b5621e7ecdb876`** (`478323c`) — **unchanged, not redeployed, not contacted for a change** |
| Version | code 41 → **42**, name `0.13.16-d6a7e2` → **`0.13.17-d6a7e3`** |
| Room schema | **16, unchanged — no migration runs.** Server: **`0006_session_connection`**, unchanged |
| Gate | **2538 Android unit tests, 0 failures, 0 errors, 0 skipped. Lint: 0 issues** (both counted from the XML reports, all tasks with `--rerun-tasks`). Server, read-only at unchanged HEAD: **1071 passed, 3 skipped** — see the test-count correction below |
| APK | `app-debug.apk`, 16,472,257 bytes, SHA-256 `30d83f02cc3ce770ac42d81dddbd053691b795b9d52ddae6d9e1b573114f24af`. **Copied to Downloads with a matching hash. Not installed** |
| APK in Downloads | `/sdcard/Download/TelegramTopicUploader-0.13.17-d6a7e3.apk` — hash verified identical |
| Production | **Unchanged.** No Instagram contact, no server deployment, no Telegram content sent. The dedicated viewing session remains `connected`; every Instagram source remains in the state the user left it in |
| Hardware | **D6A7e2 was installed and exercised — see below. No line of D6A7e3 is verified.** `docs/D6A7E3_DEVICE_CHECKLIST.md`; all 21 lines *not attempted* |

### Previous milestone, for reference

| Field | Value |
| --- | --- |
| Task | **D6A7e2** — a dedicated viewing account imported and verified, a session state that says whether it *works*, a sentence that stopped over-claiming, a Preview you can walk, and an Instagram tile that opens its own list |
| **Final application HEAD** | **`6cebd96412980fb0b440c4182c968310d262fdc2`** — pushed |
| **Final server HEAD** | **`478323c1ea6ec61a708b59b6b0b5621e7ecdb876`** (`478323c`) — **deployed and verified** |
| Version | code 40 → **41**, name `0.13.15-d6a7e1` → **`0.13.16-d6a7e2`** |
| Room schema | **16, unchanged — no migration runs.** Server: **`0006_session_connection`**, three nullable columns on `platform_health` |
| Gate | **2481 Android unit tests, 0 failures. Lint: 0 issues** (counted from the XML report, all with `--rerun-tasks`). Server: **1071 passed, 3 skipped** — *corrected in D6A7e3 from evidence; both the 1066/3 recorded here and the 1070/4 in the server's own documents were wrong* |
| APK | `app-debug.apk`, 16,434,192 bytes, SHA-256 `458fe4a79a433fe37f6e9d40ce004c200607e29886ace8132aaaeb803644ad02`. **Copied to Downloads with a matching hash. Not installed** |
| APK in Downloads | `/sdcard/Download/TelegramTopicUploader-0.13.16-d6a7e2.apk` — hash verified identical |
| Production | **A dedicated Instagram viewing session is configured and the server verified it `connected`** (one authorised live request, 2.1 s). **Every Instagram source remains paused — `enabled: 0` before and after the import** |
| Hardware | **Installed on the handset and exercised. Four results confirmed, three defects found — all three are the subject of D6A7e3.** `docs/D6A7E2_DEVICE_CHECKLIST.md` now carries a superseding note at the top |

### Milestone before that, for reference

| Field | Value |
| --- | --- |
| Task | **D6A7e1** — a security incident contained, a session the screen never mentioned, a transfer no screen may own, and a count that finally opens its own list |
| **Final application HEAD** | **`b1a434d7c6fd826fac5e2bec31c15ad630393fc8`** — pushed |
| **Final server HEAD** | **`92269ada1c5c2bead729bad5dc81860010fac23e`** (`92269ad`) — **deployed and verified** |
| Version | code 39 → **40**, name `0.13.14-d6a7e` → **`0.13.15-d6a7e1`** |
| Room schema | **15 → 16.** One additive table, `explicit_send_requests`. Server: **`0005_session_use`**, three nullable columns on `platform_health` |
| Gate | **2439 Android unit tests, 0 failures. Lint: 0 issues** (counted from the XML report, all with `--rerun-tasks`). Server **1035 passed, 3 skipped** |
| APK | `app-debug.apk`, 16,390,787 bytes, SHA-256 `29d367e1dec3bae7b2e7cf573cfdfcc873838a8a5356c2da16f4de53951df2b8`. **Copied to Downloads with a matching hash. Not installed** |
| APK in Downloads | `/sdcard/Download/TelegramTopicUploader-0.13.15-d6a7e1.apk` — hash verified identical |
| Production | **Instagram credential absent, every Instagram source paused (enabled: 0)**, verified from local credential and process state. **No live Instagram request was made in this milestone** |
| Hardware | **No line of D6A7e1 is verified.** `docs/D6A7E1_DEVICE_CHECKLIST.md`; all *not attempted* |

### And before that, for reference

| Field | Value |
| --- | --- |
| Task | D6A7e — a queue Android accepted and never ran, a sentence that outlived its own action, and a Reel the listing knows |
| Application HEAD | `57181ebf1029422fc605814cf78489135250db83` |
| Server HEAD | `b3b9378216402ded73b4a4070eda77e5c0f41356` |
| Version | code 39, `0.13.14-d6a7e` |
| Gate | 2377 Android unit tests; server 994 passed, 3 skipped |
| Hardware | **Nothing.** Every line still owed, and D6A7e1 does not supersede it |

No production token, Meta credential, Telegram identifier, chat ID, thread ID, private link, VPS
address, Tailscale hostname, SSH host, pairing code, device token, cookie value, account name, file
name, content URI or media hash is recorded anywhere in this file.

## D6A7e3 — the first physical run of D6A7e2, and the three things it found

**Application HEAD `dc3f6331cfae9437ed0683210974a347fa9ccc11`. Server HEAD unchanged at
`478323c1ea6ec61a708b59b6b0b5621e7ecdb876` — not edited, not deployed, not contacted for a change.
Instagram was not contacted. No Telegram content was sent.** Code 42, `0.13.17-d6a7e3`, Room 16.

### 1. What the handset confirmed — record this permanently

- **D6A7e2 was installed on the physical device and exercised.**
- The dedicated Instagram viewing session was imported and **server-validated as connected**.
- **The import enabled no Instagram source.** Enablement remains the user's decision.
- Preview previous/next is present and works on hardware.
- The Instagram Dashboard tile exists and belongs to D6A7e2.

### 2. What it found — three defects, all fixed here, none claimed verified

1. **The swipe direction was the opposite of what the user expects.** D6A7e2 shipped *left → next,
   right → previous*. The required and now implemented contract is **right → next, left →
   previous**.
2. **The Preview could not be scrolled vertically when the drag began on the video surface.** There
   is content below the video and it was unreachable.
3. **Some videos played audio while the video area stayed completely black, with no error shown.**

### 3. The rules these produced, which outlive this milestone

- **Right is next. Left is previous.** Decided from the physical sign of the drag alone.
  `LayoutDirection` is not consulted on any gesture path and a guard forbids it returning — the same
  hand movement must mean the same thing in Hebrew and English, because a media session is a
  filmstrip rather than a paragraph. The visible Previous/Next buttons keep their logical meaning.
- **Decide gesture ownership before consuming anything.** A generic `detectDragGestures` claims a
  drag as soon as touch slop is crossed *in any direction* and consumes it, so a parent
  `verticalScroll` never sees a gesture that began on the child. That is the whole cause of defect 2,
  and it is a trap anywhere a scrollable parent contains a horizontally-paging child. The fix is
  `PreviewNavigation.dragOwner` plus an `awaitEachGesture` loop that consumes only after horizontal
  paging has won; a vertical drag consumes nothing at all. **The wrong fixes — removing the scroll,
  shrinking the video — were refused explicitly and are guarded against.**
- **Prepared is not rendered.** This is the durable one. `onPrepared` plus granted audio focus plus
  no `MediaPlayer` error plus an advancing position were *all true* while the screen was black. None
  of them is about a picture. Only the platform's first-video-frame signal, or a real frame arriving
  on the texture, may mean *visible*.
- **Local playback and Telegram upload are separate facts.** A clip this device cannot decode is
  still a file this application can send. Said on every failure screen, and structural: the render
  domain has no vocabulary for an upload.
- **Never claim an unproven cause.** "Unsupported codec" was the tempting label for every black
  video. A platform error maps to a classification only where the platform names one; anything else
  is `UNKNOWN`; an unanswerable `findDecoderForFormat` is treated as *decoder present* so the honest
  first-frame timeout is reported instead. The classification checks the **surface first**, because
  blaming a codec for a surface that never existed is exactly the wrong sentence.
- **One rebuild, carried in the state.** A retry loop makes an intermittent surface fault look fixed
  and makes a bad file spin forever. `MAX_RECREATIONS = 1` lives in `VideoRenderState`, not in a
  local.

### 4. What replaced `VideoView`, and why not Media3

One platform `MediaPlayer` per item **generation**, bound to a `TextureView` the composable owns.
Playback starts only when the player is prepared **and** its own surface is bound. Every transition
refuses a generation that is not the current one, so item A's late *prepared*, *first frame*,
*error*, *release* or *surface destroyed* cannot fail, clear or overwrite item B — the D6A2 class of
defect, in a new place.

**Media3/ExoPlayer is not in this project's offline Gradle cache**, so adding it would have failed
the offline build — and it would have been a speculative fix for a lifecycle problem. `TextureView`
was chosen over `SurfaceView` because it is an ordinary view in the window: it survives Compose
measurement and vertical scrolling and stays capturable in screenshots and recordings. The two jobs
`VideoView` did implicitly are now explicit arithmetic in `VideoSurfaceTransform` — letterboxing,
and the container's quarter turn applied **once**, refused a second time on platforms that already
rotated the frame.

### 5. The bounded local probe

`AndroidVideoRenderProbe` opens **one** document read-only, reads track headers with
`MediaExtractor`, and asks `MediaCodecList` for a decoder for the **exact declared format** rather
than for the MIME. It decodes no frame, scans no library, opens no output stream, persists nothing
and logs nothing. `VideoRenderFacts` structurally cannot hold a name, URI, path, hash, caption or
folder. **Nothing it produces is sent to the server.**

### 6. The D6A7e2 server test-count mismatch, resolved from evidence

The server's own committed records (`README.md`, `TODO.md`, `docs/PROJECT_STATE.md`,
`docs/RELEASE_REVIEW.md` and the D6A7e2 commit message) said **1070 passed, 4 skipped**. This memory
said **1066 passed, 3 skipped**. Neither was right.

**Evidence.** `.venv/bin/python -m pytest -q` was run **twice**, read-only, at the unchanged HEAD
`478323c`, and produced **1071 passed, 3 skipped** both times. `pytest -q -rs` shows the suite's
only reachable skip is `tests/test_connector_conformance.py:591` — *this platform requires no
credential, so it has no unconfigured state* — which fires for the three harnesses declaring
`unconfigured=None` (lines 112, 165, 435). Three skips is determined by the code, not the
environment.

- 1071 + 3 = **1074 collected**, exactly matching the recorded 1070 + 4, so the server's figure is
  one test miscounted between columns.
- 1066 + 3 = 1069, five short of the collection, so this memory's figure was simply wrong.

**The correct count is 1071 passed, 3 skipped.** This memory and
`telegram-remote-sources/cc-latest.md` are corrected. **The server repository's own committed
documents still carry 1070/4 and are owed a correction in the next server milestone** — fixing them
here would have moved the server HEAD, which D6A7e3 forbade. Nothing was deployed and no server file
was changed.

### 7. A flaky test was fixed rather than tolerated

`TelegramMediaRepairGatewayTest > a D3B2 cancellation ends the live edit and can never produce a
duplicate post` failed one run in three with `expected:<1> but was:<0>`. It asserted *exactly one*
request had reached `MockWebServer` while cancelling on the first progress callback of an 8 MB body
— a race with no bearing on duplicate posts. It now asserts the property its own name always
claimed: **never a second request**. The client-side proofs are unchanged.

### 8. Guards re-scoped, none deleted

Five assertions named an implementation this milestone was asked to replace. Each was re-pointed at
the replacement, with the reason recorded in the file; three are strictly stronger.
`D4ASurfaceTest` ("the player is this application's own"), `D4BSurfaceTest` (the autoplay trigger —
which turned out to *be* the defect, so the guard now asserts the opposite), `D4CSurfaceTest` (the
teardown steps, now following them into `releasePreviewPlayer`, and the tap-enabled state), and
`D6A7E2SurfaceTest` (the gesture and player counts, which now assert the **absence** of what they
used to require, so they cannot pass vacuously against code that no longer exists).

### 9. Owed from the handset

`docs/D6A7E3_DEVICE_CHECKLIST.md` — 21 lines, **all not attempted**. The three that decide whether
this milestone worked: **5–6** (a rightward swipe advances), **8** (a finger on the video scrolls the
screen to the controls below it), and **12** (a previously black video shows a real moving frame, or
one of seven exact non-black sentences with no audio behind it). Line 12 is the most valuable single
line available: whichever sentence appears is the first evidence anyone has had about *why* those
clips would not show.

## D6A7e2 — the replacement account, and four things the screens could not say

### 1. The dedicated viewing account, and how its credential was moved

The user placed the new account's cookie file on the handset and it was imported without any part
of it being read, printed, hashed, copied into a repository, or written to server disk.

**The route mattered and was not a convenience.** The scoped sudo grant excludes `install`, `cp`
and `rm`, and the container bind-mounts only `/var/lib/remote-sources` — so the file was streamed
over SSH **stdin** directly into the container's **tmpfs** (`umask 077; cat > …`), which is the
only path that keeps plaintext off durable storage and out of any argument list. The import
command's own output was sanitized before display so that byte and cookie counts were withheld.
Both plaintext copies were then destroyed and their absence positively verified.

**Exactly one live request was authorised and exactly one was made.** Result:
`connection_state: connected`, `validation_ok: true`, `elapsed_seconds: 2.1`,
`instagram_enabled_sources: 0`. Afterwards: no new CheckRun (still 6), no cursor movement, no
Story-state change, `last_check_at` untouched, every row count identical. **The import enabled
nothing**, by design.

### 2. "Configured" was never the question

D6A7e1 shipped the card that had been missing and it could still only say a credential *exists*.
The new account proved why that is not enough: the file parsed and an envelope was written, and
none of that was evidence Instagram would accept it.

The server now composes **one** authoritative verdict — `platform.session_connection.v1`, with
`session_connection_state`, `session_validated_at` and `session_configured_at` on the platform
status — and the app **translates** it rather than re-deriving it. Nine states, each with words as
well as colour, and exactly one drawn as success. A server too old to answer can produce at most
*configured, unverified*: `legacyStateOf` is structurally incapable of returning `CONNECTED`, and
both a behavioural test and a static guard hold it there.

### 3. The sentence that was false

An empty session-use record used to say the server had **never** used a viewing session. The
incident that opened D6A7e1 is the counter-example: that session was used many times, before any
of it was recorded. It now says *no session use has been recorded since session-use tracking was
added*, and adds that *earlier uses are not represented by this card* — English and Hebrew, with a
build-failing guard on the old wording in either locale.

**The general rule this leaves behind:** when a feature can only see part of the history, the
sentence must say which part.

### 4. Preview walks, and walking is not acting

`PreviewNavigation` freezes the ordered list when Preview opens, so a background rescan cannot
shuffle the session under the user; a vanished item is skipped rather than redrawn under a stale
identity; boundaries answer *nothing* rather than wrapping. Visible Previous/Next controls sit
beside the swipe, with a *3 of 20* position — deliberately **not** pinned left-to-right, because
unlike D4C's timeline it is a Hebrew sentence and not a physical axis.

**The real risk here was gesture arbitration**, and it is handled by placement as much as by
arithmetic: paging lives only on the media surface, so the seek bar and every button are siblings
whose drags can never reach it; a drag must cross 120 px *and* be 1.5× more horizontal than
vertical; a zoomed image pans to its own edge before a further swipe pages it, and pinching never
pages. Navigation touches no transfer, no pending send, no batch and no deletion — a live Send now
keeps running with its progress on its own row — and the snapshot is process state that never
becomes a database row.

### 5. The Instagram tile

A ninth Dashboard tile counting the local publishing queue's waiting rows, opening the **existing**
publishing screen on the ordinary back stack. One predicate — `InstagramPublishQueuePolicy.active`
— drives both the number and the screen's first section, and *published* is its exact complement in
the same file, so the D6A7e1 count/list class of defect cannot recur here. Rows marked published
stay on screen in their own section so the undo affordance survives the split. Drawing the tile
makes no Remote Sources request.

### 6. What the guards caught — the useful part of this milestone

Every one of these came from an existing check rather than from review, and none was fixed by
weakening the check. **This is the pattern worth carrying forward.**

- **`D4CSurfaceTest` was right and the new code was wrong.** The *3 of 20* label had been pinned
  left-to-right by analogy with D4C's seek timeline. The timeline is pinned because a media
  position is a physical distance along a file and the drag must move the way it looks; a position
  label is a Hebrew sentence, and pinning it breaks the reading of the word between the numbers.
  **The production code was fixed, not the test.**
- **Lint found a dropped sentence, not merely an unused string.** Three `UnusedResources`: two were
  genuine duplicates the card rewrite had superseded and were deleted; the third — *the viewing
  account only asks to view the source profile* — had been dropped from the card by mistake and was
  **put back on screen**. **An unused string is a question, not an instruction to delete.**
- **A guard had gone vacuous rather than red.** `substringAfter` returns the *whole file* when its
  delimiter is missing, so renaming the viewing-session composable left one assertion silently
  passing against an unrelated fragment. Anchored on the real name now, with an existence assertion
  first, and re-scoped honestly: the card does have controls, so the pin is that none of them can
  spend or change the session.
- **`ViewingSessionPolicyTest`** now covers the older-server fallback explicitly, recording the two
  expectations that moved and why.

Nothing was deleted; every re-scope carries its reason in the file and in
`docs/RELEASE_REVIEW.md`.

## D6A7e1 — the incident, and the two defects that arrived with it

### 1. The security incident, and exactly what can be claimed

The user had exported their **primary Instagram business account's** cookies and imported them as
the server's viewing session. Instagram then showed a new connection from **Singapore — the
server's own hosting region** — treated the activity as suspicious, logged the account out, and
required a fresh sign-in.

**The mechanism, stated truthfully.** An exported cookie jar *is* an authenticated session; no
password was ever needed, asked for or obtained, because the session cookie is itself the
credential. Importing it authorised server-side use: the server materialised the session, handed
its path to gallery-dl, and gallery-dl contacted Instagram from the server's own network
location. Instagram therefore saw authenticated activity from a new address, environment and
request pattern rather than from the user's phone. Both ordinary scheduled checks **and**
development/maintenance probes used it.

**What cannot be proved.** *Only Instagram knows the exact risk signal behind the forced logout.*
The server's use can explain the new connection; nothing stronger is claimed anywhere.

**The sanitized audit** (from the host's own command log, durable CheckRun rows and source
timestamps): jar imported **2026-07-27 20:16 UTC**; used continuously through **2026-07-30 04:25
UTC** — the initial 25-post import, an 11-Story initial import (07-28 13:47, manual), a manual
check (17:22), scheduled checks at 23:54 (7 more Stories), 07-29 07:31, 07-29 16:49 and 07-30
04:25 — plus every documented D6A7b–D6A7e probe (resolve-json, timing, pinned-post, Story tray,
post-range, roster, and the classification backfill's dry runs and apply). The 04:25 check settled
**partial**: feed no-new-content, Story half `temporary_failure/extractor_failed` — *consistent
with* the session being invalidated around then, not proof of it. **Exact per-request counts
cannot be reconstructed**: probes were never durably counted, pre-D6A7d scheduled checks left no
rows, and log retention is bounded. That gap is stated rather than filled.

**Containment, performed and verified from local state only — no live request was made to prove
an absence.** Credential envelope cleared (07-30 09:43 UTC); the decrypted tmpfs copy was found
**still present after the clear** — the exact defect this milestone fixes — and destroyed by the
approved restart; every Instagram source paused through the new auditable command. Verified:
credential *not set*, enabled Instagram sources **0**, no check running, no gallery-dl/yt-dlp
process, health and readiness 200, unauthenticated routes 401, port loopback-only, every other
credential untouched, and every row count identical before and after (1 source, 46 items, 46
media, 46 operations, 2 destinations, 4 devices, 6 check runs).

**The warning gap, corrected.** Previous UI and documentation never said that Instagram would see
authenticated activity from the server's location. It does now — in the app, in `SECURITY.md`,
`THREAT_MODEL.md`, `CONNECTORS.md` and both READMEs.

### 2. What the server gained

- **`clear` removes the credential everywhere it exists** — envelope *and* the decrypted runtime
  copy (the CLI runs inside the container, where that file lives); re-importing removes the
  previous copy first, so a rotated session cannot keep acting as the old account; a
  constructed adapter re-stats the now-absent file and refuses. Idempotent, namespace-scoped,
  prints nothing a secret could travel in.
- **`remote-sources-ctl pause-instagram-sources --confirm`** — one transaction, exactly the
  `enabled` column, counts only, idempotent, refuses without the flag, and **no bulk resume
  exists by design**: a later cookie import re-enables nothing, and that is regression-tested.
- **The permanent live-probe rule**: no development, debugging or maintenance command may contact
  the live platform without the user's explicit approval of that specific run.
  `classify-instagram-content` now refuses without `--confirm-live-session-use` — required on a
  **dry run** too, because a dry run reads the account's listings live.
- **Migration `0005_session_use`** plus a `SessionUseRecorder`: every authenticated extractor
  operation writes a sanitized purpose **before** it runs and settles a sanitized outcome
  **after** its result is classified; start-up settles what a dead process left as `interrupted`,
  so a death can never fabricate a success. Exposed through `/system/status` under
  `platform.session_use.v1`. Pre-existing rows stay NULL — **the audit is documentation, never
  manufactured rows.**

### 3. The Dashboard count that opened an empty list

**Reported:** Queue 3, Requires review 3, and the filtered Review screen showed **zero** cards.

**Root cause, proven rather than assumed.** The tile tallied `DashboardGrouping.classify` alone
while the Review projection applied three further hand-written exclusions — ignored media (D5A),
settled uncertain rows (D6A7d), and the view model's Instagram-set-aside filter (D6A6). The three
rows were **settled uncertain uploads**: counted forever and listed nowhere — *not even in
History*, so D6A7d's own "becomes a History record" sentence was never actually implemented. **No
media was lost; the rows were in the Queue the whole time.**

All three decisions moved **into `classify`**: *found it in Telegram* is a completed record (the
card still says the user confirmed it and Telegram did not); *did not find it* with its one
replacement is retired; an unretried one stays in Review where its **Send again** lives; ignored
review work retires; set-aside media gains a deliberately tile-less group whose visible home is
the Instagram publishing screen. **The repair is a projection change only** — no row rewritten,
nothing deleted, resent or rescanned.

### 4. A transfer no screen may own

**Reported:** Send now from Preview, then Back or app-switch → the upload stops with an error and
the file stays queued. A regression against **D4B**'s persistent-transfer contract.

**Root cause:** the send ran the whole transfer inside the Activity-retained `viewModelScope`.
Preview's own disposal was never the culprit — it stops playback and nothing else, and a guard
now pins that.

**The fix — a durable explicit-send chain** (`ExplicitSendCoordinator`, schema 15 → 16, one
additive table). Every **Send now** — Preview, Queue row, any single-item surface — records a
durable request and the transfer runs in the **application scope**. Back, in-app navigation,
rotation, recomposition and app-switching cancel nothing; progress hands off to the Queue row by
**job identity** (no unkeyed slot anywhere); only **Cancel now** reaches a live transfer.

**Send now on B while A uploads** is no longer refused and forgotten: B waits in durable FIFO
order and starts **by itself** when A settles — confirmed, permanently failed, RESULT_UNKNOWN
(never retried) or explicitly cancelled — each waiting item revalidated through the launcher's
own preflight and skipped with its **exact sanitized reason** if it became unsendable. **Cancel
pending send** withdraws intent only. An ordinary queued row with no tap never starts. A restart
resumes only requests whose job **provably never dispatched**; dispatch evidence hands the job to
the RESULT_UNKNOWN boundary, never to a resend. The chain shares the one global media-operation
arbiter with the batch, albums and repair — it waits for the slot rather than racing it.

### 5. Files above 50 MB — the decision, recorded and not implemented

The selected long-term solution is the **official Telegram Local Bot API Server in `--local`
mode** (bot uploads to **2000 MB**, per the official documentation), designed in the server
repository's `docs/D6A7F_LOCAL_BOT_API_DESIGN.md` for **D6A7f**. **Not activated here**: it needs
the user's Telegram `api_id`/`api_hash`, an explicit `logOut` migration off the public Bot API
(with its documented ~10-minute cooldown as the real downtime floor), a one-endpoint audit of
every bot client in both repositories, and its own release with a rehearsed rollback. **Rejected
outright:** automatic quality reduction, transcoding, splitting a video across posts, Telegram
user-account uploads, TDLib-as-user, unofficial services. Until then oversized rows stay visible
and blocked, enter no send path, and the card names the **current Telegram transport** without
promising anything. The design's Android-connectivity recommendation for the managing chat is
**Option A** (the phone talks to the private local endpoint over Tailscale) — it keeps one
transport and one ambiguity boundary; Option B (a gateway on the app server) is the right
*second* step if the token is ever to leave the phone, and should not be bundled into the
transport migration.

### Next device action (ask for exactly this)

Install `/sdcard/Download/TelegramTopicUploader-0.13.15-d6a7e1.apk` **over** the existing app and
run `docs/D6A7E1_DEVICE_CHECKLIST.md`, **reading its three opening notes first** — all three
describe correct behaviour that reads as broken. **Lines 10 and 12** are the reported
transfer-lifetime regression and matter most; **16–18** are the new explicit-send chain; **6** is
the count the Dashboard owed.

## D6A7e — three device reports, and one of them is good news

### What the handset proved

- ✅ **Live Story deduplication.** A second *successful* Instagram check, same Stories still active,
  resent **nothing**. Open since D6A7c, whose second Check now was refused by the cooldown — which is
  evidence of the cooldown and of nothing else.
- ✅ **Source deletion after a confirmed upload succeeded**, checked in the Android **file manager**.
- ✅ RESULT_UNKNOWN identification and resolution work; the later Story check works; **per-item
  Upload now works and sends**; screenshots still work.

### 1. Android accepted a batch and never ran it

*Upload queue* froze twenty items. `RESULT_SUCCESS` came back. The JobService was **never entered**:
progress **0 / 20**, no item acquired, nothing to Telegram — and because a retained active batch
hides the button, pressing *Upload queue* again appeared to do nothing.

**Acceptance is a request the platform agreed to consider, not a start**, and the durable state had
nowhere to say so: `updatedAt` moves on every write, `createdAt` predates the request, `startedAt` is
written only by a runner. So *accepted and never started* was indistinguishable from *not submitted*,
and **nothing ever asked again**.

Schema 15 adds `acceptedAt`, `startDeadlineAt`, `executionOwner`, `ownerAcquiredAt`.
`START_DEADLINE_EXCEEDED` and `INTERRUPTED` join the vocabulary, both **active** — snapshot kept,
slot kept, no upload job touched, no attempt spent. A two-minute deadline is reconciled on Queue
entry, resume, pull, launch and before every batch action, and then the card offers **start it here /
keep waiting / cancel**.

> **The duplicate-send guarantee is a durable claim, not cancellation timing.** Both runners compete
> for one column in one guarded `UPDATE … WHERE executionOwner IS NULL`. A job already dispatching
> would sail straight through a cancellation window, which is exactly why cancelling the pending
> platform job is a courtesy and not the rule.

**The stuck session is recovered, not discarded.** It carries no `acceptedAt` — accepted by a build
with nowhere to record one — and the deadline rule reads an absent acceptance as already past.

### 2. The sentence that outlived its own action

A successful upload said the file had been **permanently deleted** *and* that the app had **never
asked Android to delete it**. The user checked: it really was deleted.

**The second screenshot is what solved it.** Minutes later, an unrelated folder scan announced *"The
scan started."* — with the same deletion sentence still attached. That rules out every reading in
which deletion is at fault.

`MainViewModel` published the deletion stage into a `StateFlow` **only a manual deletion wrote and
nothing ever cleared**, and the screen composed `"$base $stageMessage"`. One refusal therefore
attached itself to every notice for the life of the process.

A notice is a one-shot event now: one typed result, mapped once, into one immutable `UiAnnouncement`
that owns everything it says, with an id that consumption names so a recomposition, a navigation or
a second action cannot replay or clear somebody else's. **Three notice channels became one.**

And the vague sentence is **gone from both locales**: *"something still needs this file, or the
folder permission does not allow it"* covered a job that still needed the bytes, a read-only grant, a
live operation and an unsettled uncertain send with one set of words. The coordinator's classified
outcome distinguishes all four and is always present.

### 3. The Reel signal is a listing, not a field

A bounded, sanitized probe of the live account, gallery-dl 1.32.8:

| Fact | Value |
| --- | --- |
| `product_type` / `media_product_type` / `subtype_name_for_REST__` in a feed record | **absent, all three** |
| `post_url` carrying a `/reel/` route | present — **written in the same `len(files)==1 and video_url` branch as `type`** |
| Proven Reels in one six-post window, by the account's clips listing | **4** |
| Named by `type` | **1** — it missed three |
| `type` on the clips listing itself, every member a Reel | `post` on **10 of 12** |

So the canonical-looking route is the media-shape guess wearing a URL, and both fields are refused
by name. `…/reels/` is Instagram's own `user_clips`; `…/photos/` yields a post only
`if not self._is_reel(post)`. Both are resolved **once per discovery**, clips first, with the photos
window sized from what clips left — the first production dry run asked both for 34 posts and the
photos tab timed out, because it spends ~59 s on **three**.

**Production backfill:** 28 → **25 `reel`, 2 `post`, 1 still Unknown**; 27 history rows filled; 0
failed. `post` also got narrower: an unproven feed record is `unknown` now, because the profile
listing carries Reels and posts under one subcategory.

### 4. The schedule, in numbers

Presets state **8 / 4 / 2 hours**; the card shows the **server's** last, last-successful and next
check as exact local times and countdowns. **Nothing is derived from the preset.** The manual
cooldown and the schedule are **two separate clocks**. One screen-scoped ticker, once a minute,
stopped whenever the screen is not resumed. No scheduler arithmetic changed.

### 5. A 104.8 MB file was offered as send-ready work

Two rows sat as `QUEUED` with *Upload now*, against the app's own 50 MB limit. The limit was never
missing — the dispatch path has enforced it since D3A — but **eligibility never consulted it**, so a
batch would freeze the file in as work it could only fail.

**Units checked rather than assumed:** both sides are binary, ceiling 52,428,800, display ÷1024. So
"50.9 MB" is ≈53.4 million bytes and is genuinely over; the comparison is on exact bytes because
52,428,801 renders as "50.0 MB". One clause in the one candidate query, so *Upload now*, the preview,
the snapshot and the claim walk cannot disagree. The row **stays visible** and says its size.

### 6. Two things the queue card never said

**The recorded failure code** — written since D3A, **never once rendered** — which is precisely why
the device report could only say *"pressing Upload now still fails"*.

**A contradiction.** `QueueRemovalPolicy` preferred the *dismissal* rule's answer; dismissal exists
for a terminally failed row, so for a `QUEUED` row with an unproven error code it answered
`NOT_QUEUED` — *"this is not a failed row"* — which renders as **"it is not in active processing"**
under a status reading **Queued**.

> **The replacement job's upload failure is not claimed as fixed.** The whole sequence now runs
> end-to-end against the real repository — uncertain sibling, declared absent, replacement queued,
> reservation owned, targeted claim, fresh dispatch identity, restart on both sides of dispatch —
> and every step passes. Whatever refused it wrote a code no screen displayed. **Checklist line 54
> is the most valuable line in the milestone.**

### 7. History is not the live queue

Three live rows under *"Items in this run: 20"*. **The 20 is right and must stay 20** — it is a
frozen batch's membership, and rewriting it would destroy the only record of that run. The Queue now
states its **current** total, eligible, blocked and oversized counts separately, and the historical
card says what it is showing.

### Guards re-scoped, never deleted

Fourteen: the schema pins across nine files, the migration-list pins across four, the two
pull-to-refresh guards, the batch-launcher surface, the "no private field" scan (which fired on the
word *token* **in a comment** — the fourth time this project has hit that, exactly as predicted), the
D6A3/D6A4 deletion-stage guards, and the D5B Back-stack slice whose anchor moved with the notice
rename. Each carries its reason.

**And one project invariant held rather than being relaxed:** the batch diagnostics were written as
`Log.d` first, `D3B2SurfaceTest` refused them, and they became a bounded **in-memory** trail. Logcat
would not have helped anyway — the person with the frozen batch cannot read it.

### Next device action (ask for exactly this)

Install `/sdcard/Download/TelegramTopicUploader-0.13.14-d6a7e.apk` **over** the existing app and run
`docs/D6A7E_DEVICE_CHECKLIST.md`, **reading its four opening notes first** — all four describe
correct behaviour that reads as broken.

**§B is the reported defect** and the twenty-item batch is already on the device. **Line 27** is the
stale-notice proof, and **line 54** — the exact refusal sentence on the replacement job — is the
single most valuable line available.

## D6A7d — the record of the previous milestone, kept for context

| Field | Value |
| --- | --- |
| Task | D6A7d — an uncertain upload that can be answered, a folder's real name, and a delivery that says what it was |
| Application HEAD | `6a9ced6d1791d290a8751c0e1eb325e5dda4d5cd` |
| Server HEAD | `6fa9662b25e606c5d432ea52cc2827500d4f8137` |
| Version | code 38, `0.13.13-d6a7d` |
| Room schema | 13 → 14, five nullable columns on `upload_jobs` and one unique index. Server `0004_content_kind` |
| Gate | 2250 Android unit tests, 0 failures; server 948 passed, 4 skipped |
| APK | `TelegramTopicUploader-0.13.13-d6a7d.apk`, SHA-256 `810637f90bce3fb7582537bdc962c7f41899100d72178a426dc43754784949db` |
| Hardware | **Items 2–4 and 7 confirmed working by the D6A7e device report.** The rest is still owed |

**What it built.** Manual resolution for a `RESULT_UNKNOWN` row — *I found it in Telegram* records a
confirmation and **invents no message ID**; *I did not find it* makes a second send *possible*
without making one happen; one uncertain attempt is retried at most once, under a unique index. Real
folder display names and **Rename folder**. `content_kind` — Story / Reel / Post / Unknown — frozen
onto each delivery. Nine classified **Check now** refusals with the cooldown's exact local time. And
`GET /review/unresolved`, the listing that made the D6A6 resolution endpoint reachable at all.

**What D6A7e then learned about it.** The Story and RESULT_UNKNOWN halves work on hardware. The Reel
half did not: D6A7d's own documentation said no trusted signal reached the parser, and D6A7e found
the signal somewhere else entirely — in the account's own clips listing rather than in any field.
D6A7d's `post` default also turned out to be an over-claim and is now `unknown`.

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
