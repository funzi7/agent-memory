# Telegram Topic Uploader — latest handoff

## Task and repository state

| Field | Value |
| --- | --- |
| Task | D3B2 — immediate cancellation of every active external-media operation, batch pause after the current transfer, staged repair progress with a real percentage, exact sanitized repair-refusal reasons, always-visible media size and duration, and the Telegram topic ID on the multi-topic review form |
| Application repository | `/root/work/telegram-topic-uploader` |
| Branch | `main` |
| Tracking branch | `origin/main` |
| Starting application HEAD | `42bef7f51a1d1743cf9663313f8f5464c68d4f6f` (D3B1.5) |
| Version | code 17 -> 18, name `0.6.0-d3b1.5` -> `0.6.1-d3b2` |
| Room schema | **8, unchanged.** No migration, no new column/table/index, no `9.json` |
| Deployment | None. Not installed or run on any device or emulator in this session |

No production token, Telegram identifier, bot username/ID, chat ID, thread ID, group title, forum
topic name, private link, binding command, nonce, file name, content URI, document ID, path, or media
hash was requested, used, or recorded anywhere, including this file.

## New user-reported D3B1.5 hardware evidence (not observed by any agent)

Recorded exactly as reported, and nothing beyond it:

- D3B1.5 was installed and run on the user's Android device.
- Completed/History contains **five** confirmed video rows.
- Those rows do not expose enough always-visible media information for the user to identify which
  Telegram post is the old blank 0:00 post.
- The user asked for at least a readable duration and size on every video row.
- The user tapped **Repair Telegram video presentation** on **all five** rows.
- **Four** taps produced a generic "cannot repair" result.
- The exact refusal causes were **not shown**.
- The exact result of the **fifth** repair was **not reported**. Do not invent it.
- All corresponding source videos still exist in the configured folder.
- The multi-topic binding flow **worked** on hardware: several topics collected in one session,
  **Connect all** succeeded, and a test message succeeded after binding.
- The review form showed only neutral ordinals, so the user could not tell which candidate was which
  Telegram topic.
- The user chose to expose `message_thread_id` as the topic identifier in that form.
- **No claim was made** about source-file mutation, duplicate Telegram repair posts, or the final
  visual state of any repaired post.
- The fixed drawer Menu position was **not** mentioned in that report, so it is **still not**
  user-validated. It stays on the D3B2 checklist.

### Unproven hypothesis about the four generic refusals

The four identical refusals are **consistent with** the single external-media slot being held while
the first repair ran: D3B1.5's arbiter refuses a repair while another operation holds the slot, and
its view model collapsed that refusal into the same `REPAIR_NOT_ELIGIBLE` message as every
content-based one. It is **equally consistent** with a source or codec check failing on those four
files.

**Do not record this as the confirmed root cause.** Nothing observed distinguishes them — which is
exactly the defect D3B2 fixes. It becomes knowable only when the user reports the exact reasons from
hardware.

## The user's four explicit decisions (final; do not reopen)

1. **Repair progress**: stages **plus** a real upload percentage.
2. **Multi-topic identification**: `Topic <ordinal> · ID <message_thread_id>`, and **no** bot
   acknowledgement message posted into any Telegram topic.
3. **Cancellation scope**: single foreground upload, in-place repair, **and** the current item of a
   background batch.
4. **After the current transfer is cancelled**: pause every remaining item; never continue
   automatically; require an explicit **Resume**.

No further open user-facing ambiguity was found, so no blocking question was raised. Two engineering
choices that shape what the user sees were stated as assumptions rather than left implicit: binary
byte units with one decimal (the spec delegated "a stable documented rounding rule"), and returning a
cancelled batch item to *un-started* rather than settling it (which follows directly from decision 4 —
settling it would make Resume skip the very item the user cancelled).

## Cancellation architecture, and the body-completion boundary

`domain/execution/ActiveMediaTransferController` (new, `@Singleton`) describes the **single** live
media operation: kind (`SINGLE_UPLOAD` / `BATCH_ITEM` / `REPAIR`), the opaque upload-job ID, a
cancellation-requested flag, the transport handle, the phase, and real sent/total bytes. Exactly seven
fields, none capable of carrying a token, URI, path, name, Telegram identifier, or hash — asserted by
both a unit test and a surface test.

**It is not a second lock.** `ExternalMediaOperationArbiter` remains the one exclusivity authority;
the controller only describes whoever won that slot, and refuses a second registration rather than
overwriting one. Every mutation is guarded on the registration still being current, so a late update
from an abandoned operation cannot repaint a newer one.

**Cancellation reaches the request.** `MediaTransferCancellation` is handed to the gateway per call;
the gateway does `cancellation.attach { call.cancel() }` the moment the call exists (and the
controller pulls it *immediately* if the user already asked — the real race is tapping while the
request is still being built), the streaming body checks the flag on every 64 KB chunk, and the
handle is detached on settlement so a later cancel cannot reach a finished call.

**What it means is still decided by evidence.** `CompletionTrackingRequestBody` is untouched:

| Situation | Outcome |
| --- | --- |
| Exact confirmation before settlement | Confirmed — the cancellation loses |
| Body provably incomplete | Safely retryable |
| Complete body, no trustworthy answer | `RESULT_UNKNOWN`, forever |
| Cancelled after the complete-body boundary | `RESULT_UNKNOWN` unless success already proven |

Nothing settles twice; nothing resends automatically; pressing Cancel never makes an uncertain result
certain.

**A cancellation is not a failure.** New guarded DAO statement `recordDispatchCancelled` shares every
guard with `recordDispatchRetryable` and differs in one way: `nextAttemptAt = NULL` instead of a
future time. The DAO's retryable statement enforces `:nextAttemptAt > :now` — that is *why* a separate
statement exists, and a null attempt time is the same "claimable now" state a never-attempted row has.
The attempt count is **not** rolled back, so cancelling repeatedly cannot buy unlimited attempts.

**Cancel current and pause** (replaces `requestStopAfterCurrent` outright, in the launcher, the batch
card, and the notification action): record the durable request **first**, cancel the live request
second — a process death between the two still leaves a session that starts nothing. Only the upload
job the snapshot says is `RUNNING` is cancelled. The runner re-reads the request both *before*
starting an item and *after* one settles; the second read is what makes a cancellation during the
**last** item pause rather than fall out of the loop as a completion. A cancelled item goes back to
`PENDING` via `retainItemForResume` (guarded so only an un-settled item may move), and because items
walk in ordinal order it is the first thing Resume attempts.

`BatchJobContract.ACTION_STOP_AFTER_CURRENT` → `ACTION_CANCEL_CURRENT_AND_PAUSE`, same immutable
`PendingIntent` deep link into `MainActivity`. **No receiver was added** — a broadcast receiver would
have been a new exported component for no capability the deep link lacks.

## Exact refusal UI

`RepairRefusal` now has **21** values: `REPAIR_NOT_REPEATABLE` was split into `ALREADY_REPAIRED`,
`REPAIR_PERMANENTLY_FAILED`, and `REPAIR_RESULT_UNKNOWN`. `RepairEligibilityPolicy` and the durable
`createAttempt` transaction both report them apart, so the last line of defence gives the same
sentence the policy would.

`UiNotice.REPAIR_NOT_ELIGIBLE` and `REPAIR_BUSY` are **gone**. `MainViewModel` exposes
`repairRefusals: StateFlow<Map<String, RepairRefusal>>` (retained for the process lifetime, so the
reason outlives the snackbar and can be compared with the next row's) plus a separate
`repairRefusalNotice` channel, because a repair refusal carries a *value* and `UiNotice` does not.
`RepairNowResult.Busy` maps to `OPERATION_IN_PROGRESS` so both code paths give one sentence.

`RepairRowPresentation` (pure) turns live transfer + durable attempt + last refusal into one row
state. Precedence: a live transfer on this row beats everything; a refusal the user just received
beats the durable history; only then does the attempt speak.

A pre-dispatch refusal creates **no** attempt row, so nothing can later be misread as an unknown edit.

## Staged progress

`MediaTransferPhase`: CHECKING_ELIGIBILITY → VERIFYING_SOURCE → HASHING_SOURCE → ANALYZING_VIDEO →
PREPARING_REQUEST → UPLOADING → WAITING_FOR_CONFIRMATION, plus CANCELLING. Local phases are
indeterminate on screen (no truthful denominator; time-based progress would be an undetectable lie).
`UPLOADING` reports an integer 0–100 from real sent bytes over the verified multipart total, clamped
both ends. `WAITING_FOR_CONFIRMATION` reports **no** percentage — a complete body is not an accepted
message. The repair coordinator announces each local stage and follows each with a cancellation check
(`sourceRefusal` split into `documentRefusal` + `hashRefusal` for exactly this). Other rows' repair
buttons are `enabled = !otherOperationRunning` with an inline
*"Another media operation is currently running."*

## Always-visible media identification

`domain/media/MediaSummaryFormat` (pure). **Rounding rule, stated once:** binary units (1 KB = 1024
B); whole bytes below 1024; one decimal above, rounded half-up; promote to the next unit rather than
ever rendering "1024.0 KB". Durations `M:SS` under an hour, `H:MM:SS` at or above, truncated not
rounded up; **null in means null out**, so an unknown duration is named explicitly and never becomes
the `0:00` that is exactly what a blank card looks like.

Size and length are on every Queue/Completed/History card *before* **Show details**; raw bytes, raw
milliseconds, and attempts stay under Details. Numerals forced LTR, unit words not. No URI, path,
hash, chat/message/thread ID on History.

## Topic ID review

`MultiTopicReview` shows `R.string.telegram_multi_topic_identity` = `Topic %1$d · ID %2$d` from
`candidate.ordinal` and `candidate.messageThreadId`, wrapped in `LayoutDirection.Ltr`, plus a one-line
explanation naming the number as the Telegram topic ID in both locales. Chat ID still hidden; no bot
acknowledgement; command format and its single parser unchanged; ordinals stable; already-bound and
removed candidates still show their ID.

`D3B15SurfaceTest`'s old "the review form shows no identifier" test was **rewritten**, not weakened:
it now asserts the thread ID *is* shown, that it is LTR, that both locales explain it, and that the
chat ID, chat title, nonce, update ID, sender, and command are still absent.

## Schema decision

**Room stays at 8, deliberately.** Every durable fact was already expressible: the cancel request is
the existing nullable `stopAfterCurrentRequestedAt` (now recording a stronger action in the same
field — the runner reads it for the same reason either way), the pause is the existing `PAUSED`
status, and a safely retryable current item is the existing `PENDING` state. A ninth version would
have added a column saying one of those things twice, and two fields that can disagree are worse than
one that cannot.

## Tests and exact results

| Check | Result |
| --- | --- |
| `--offline testDebugUnitTest` | **973 tests / 77 classes, 0 failures, 0 errors, 0 skipped** (D3B1.5: 878/73) |
| `--offline lint` | **0 issues** |
| `--offline assembleDebug` / `assembleDebugAndroidTest` | passed |
| Instrumentation | compiles, **not run** (no device attached) |
| Room schema | **8**, unchanged; `1.json`–`8.json` only |
| `git diff --check` | clean |

New suites: `ActiveMediaTransferControllerTest` (one operation at a time; correct owner may cancel;
wrong/stale owner may not; repeated cancel pulls the handle once; a cancel arriving before the call
exists is not lost; a detached handle is never pulled; the handle clears only on terminal settlement;
a settled operation cannot repaint a newer one; percentage real and bounded 0–100; no field can carry
a secret), `MediaSummaryFormatTest` (every unit boundary, the 1024.0-promotion, half-up rounding,
`M:SS`/`H:MM:SS`, truncation, unknown ≠ 0:00), `RepairRowPresentationTest` (precedence, four distinct
settled states, percentage only while uploading, cancelling stops offering the control),
`D3B2SurfaceTest` (blast radius).

Extended: `MediaUploadCoordinatorTest` (+8: cancel before body → retryable with **null**
`nextAttemptAt`; cancel after body → unknown; confirmation wins the race; foreign job cancels nothing;
repeated cancel starts nothing else; state cleared on settlement; batch-item kind; last byte →
WAITING), `MediaRepairCoordinatorTest` (+6: pre-dispatch cancel sends nothing and creates **no**
attempt row; incomplete → RETRY_AVAILABLE; complete → RESULT_UNKNOWN and unrepeatable; same-message
success wins; foreign cancel; truthful stage order), `DefaultBatchUploadRunnerTest` (+7: retained
un-started; Resume attempts it first; unknown never retried; confirmed never resent; cancel during the
last item still pauses; paused survives a fresh run; snapshot reports PAUSED), `MainViewModelTest`
(+7), and **both gateway suites** with MockWebServer tests that cancel a *real* in-flight request and
assert the body never completed.

Historical surface tests updated **truthfully, not weakened**: `D2B2BSurfaceTest` (new port method),
`D3ASurfaceTest` (new launcher methods; the gateway's default parameter adds a synthetic
`upload$default`), `D3B1SurfaceTest` (`uploadBatchItemNow`, `cancelCurrentAndPause`, renamed strings),
`D3B15SurfaceTest` (version 18, `RepairRowSection`, rewritten review-form test).

**Known flake, still current:** the `DISCONNECT_DURING_REQUEST_BODY` gateway tests can fail when
`testDebugUnitTest` runs concurrently with `lint` on this machine. One failed once under load in this
session and passed on a clean re-run. **Run them sequentially**, never concurrently.

## APK identity (debug development signing only)

- Main APK `app/build/outputs/apk/debug/app-debug.apk`: **14,627,574 bytes**, SHA-256
  `725f7155e5617e76e18c2afe4983d8d5f8bf4db59508ac66b5f0781d5958dc71`.
- Instrumentation APK: 1,581,941 bytes, SHA-256
  `d21f8bb86dedb3ca5807b4e8f8cd0b20195c3a8aa708c68f50193d62b689c0b5` (byte-identical to D3B1.5's —
  correct, since only main sources changed and the test APK carries only test classes).
- Package `com.funzi7.telegramtopicuploader`; versionCode 18; versionName `0.6.1-d3b2`; minSdk 23;
  compile/target SDK 37; cleartext false; backup false.
- Permissions unchanged: INTERNET, ACCESS_NETWORK_STATE, RUN_USER_INITIATED_JOBS, POST_NOTIFICATIONS
  (+ AndroidX `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`). One exported activity; one non-exported
  `BatchUploadJobService`; **no** application receiver or provider of our own.
- Debug cert SHA-256 `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4` — matches
  expected, so it updates over the installed `0.6.0-d3b1.5` in place.

## Agent-observed vs user-reported

**Agent-observed (this session):** compilation, the full JVM suite, lint, both APK assemblies, the
merged manifest, the signer certificate, the schema export, and every source-shape assertion.
**User-reported (not observed):** everything in the hardware-evidence section above. **Nothing else is
claimed.**

## Device-untested boundaries

The D3B2 APK has **never** been installed, launched, or run. Specifically unproven: that a
cancellation terminates a transfer promptly over a real mobile network; that a cancelled upload's
source file is unchanged afterwards; that a paused batch's notification renders the paused state; that
Resume attempts the cancelled item first; that a repair's percentage advances smoothly; that the exact
reason now shown for a previously generic row is the *correct* one; and the carried-forward D3B1.4.2
fixed Menu position, which has still never been reported either way.

## Next device action (ask for exactly this)

`docs/D3B2_DEVICE_CHECKLIST.md`. Install over D3B1.5 without uninstalling; confirm readable size and
length on every Completed row; run one repair and watch its stages and percentage; confirm every other
repair action is disabled with the busy explanation; confirm the same post is edited and no second
post appears; **report the exact refusal reason** for a row that previously said only "cannot repair";
cancel a fresh single upload early and report whether it came back retryable or result-unknown; run a
two-item batch, **Cancel current and pause**, confirm the pause and that no second item started, then
Resume; start a fresh multi-topic session and confirm `Topic N · ID <number>`; and finally confirm the
Menu position on a Dashboard drill-down. Do **not** ask for token setup, source-missing
reconciliation, queue retirement, Dashboard counts, ordinary compatible upload, or a full multi-topic
commit.

## Roadmap after D3B2

1. **Source profiles for Instagram / TikTok / Downloads** — derive a profile from durable local
   evidence only (the scanned folder, the provider's file naming), offer it as a *suggestion* on
   Review, never as automatic routing, never with per-account mappings.
2. **Bulk thumbnail routing** — apply one reviewed decision to a group sharing a proved source
   profile, in one transaction, with **Connect all**'s all-or-nothing semantics.
3. **Only after those are proved on hardware:** optional content-based destination suggestions from
   available caption/link metadata, sampled frames, OCR, and speech evidence; high-confidence
   automatic routing stays opt-in and uncertain items stay in Review.
4. Still open from before: result-unknown reconciliation that never re-sends without evidence
   (including a *manual* repair-retry design); evidence-based resolution of an unowned/ambiguous
   legacy reservation (D3A.1); safe deletion gated on a confirmed positive message ID.

## Process rules the user set

- **Do not ship a single-hotfix build on its own**; fold it into the next substantive milestone. (The
  user deliberately did not install the standalone D3B1.4.2 APK for this reason.)
- **Mandatory stop-and-ask UX gate**: never silently choose among materially different user-facing
  behaviours. D3B2's four decisions arrived *with* the task and were treated as final; no further open
  ambiguity was found, so no blocking question was raised, and the two delegated engineering choices
  were stated explicitly instead.
- Do not introduce another binding command alias or syntax without asking first.

## Env notes (still current)

- `GRADLE_USER_HOME=/root/.gradle ./gradlew --offline …`; `aapt2` at
  `/opt/android-sdk/aapt2-wrapper/aapt2`.
- **`apksigner` is not reliably present in this sandbox** and a `find /` for it times out. Read the
  signing certificate straight out of the APK instead: `zipfile` → `META-INF/CERT.RSA` →
  `openssl pkcs7 -inform DER -print_certs` → `openssl x509 -noout -fingerprint -sha256`.
- **`dexdump` crashes (Illegal instruction)** — use `strings` over extracted `classes*.dex`.
- Merged manifest at
  `app/build/intermediates/merged_manifests/debug/processDebugManifest/AndroidManifest.xml` (note the
  plural `merged_manifests`; the singular path also exists for `processDebugMainManifest`).
- **A source-shape guard must strip comments** (`codeOf()`), or documenting why a mechanism was
  rejected fails the guard that rejects it. Equally: do not weaken a guard by rewording prose.
- A blanket `.delete()` ban over `src/main/java` hits `AndroidKeystoreSecretStore`'s own atomic file.
  Exclude that one file by name rather than dropping the guard.
- `UploadJobDao.recordDispatchRetryable` enforces `:nextAttemptAt > :now`, so "retry immediately"
  needs its own statement (`recordDispatchCancelled`) rather than passing `now`.
- Adding a default parameter to an `interface` method adds a synthetic `name$default` to
  `declaredMethods`, which breaks exact-set reflection assertions in surface tests.
- Adding a `TelegramFailureCode` value breaks three exhaustive `when`s: `UploadFailureClassifier`,
  `TelegramSetupService.toConnectionStatus`, `TelegramSetupUiPolicy.testFailureLabel` (+ its test).
- Keep the *current* `versionCode`/`versionName` literal in the **newest** milestone's surface test
  only; older ones assert stable package identity instead. D3B15SurfaceTest still pins the version, so
  it must be updated on every bump.
- Lint's `UnusedResources` **will** fail the 0-issue bar when a UI rewrite orphans strings — delete
  them from **both** locales to keep exact key parity (`LocalizationResourcesTest` compares key sets).
- No Robolectric/mockito: prove UI rules by extracting them into pure objects (`MediaSummaryFormat`,
  `RepairRowPresentation`, `BindCommand`, `RepairEligibilityPolicy`, `TopBarLeadingCluster`,
  `DashboardDrillDown`) plus source-shape assertions, and Room behaviour in compiled-only androidTest.
- Early `return` from a `@Composable` is legal but avoid it; guard with `if (state !is …)` instead.

## Deployment declaration

Nothing was deployed, installed, or run on a device or emulator in the D3B2 session. **No real
Telegram request of any kind was made** — no `editMessageMedia`, no `sendVideo`, no `getUpdates`, no
send. No forum topic was created, renamed, closed, or deleted; no binding was written against a real
group; and no media was uploaded, moved, renamed, copied, downloaded, quarantined, or deleted. The
existing Telegram posts are untouched and are never repaired, resent, or removed without an explicit,
confirmed, per-row user action.
