# Telegram Topic Uploader — cross-chat bootstrap

**Read this file first.** Then `cc-latest.md` beside it, and — since D6A —
`/root/work/agent-memory/telegram-remote-sources/cc-latest.md`.

This is the one canonical copy. It deliberately does **not** exist in any application repository, so
they cannot drift.

Nothing in this file contains a real token, Telegram identifier, chat ID, thread ID, group or topic
title, VPS address, Tailscale hostname, tailnet name, SSH fingerprint, pairing code, device token,
platform credential, account name, subreddit, post identifier, private link, file name, folder name,
content URI, path, media hash, or screenshot — and nothing added to it ever may.

---

## 1. The system, since D6A

This is now **three repositories and one live VPS**.

| Repository | Purpose | Local path |
| --- | --- | --- |
| `funzi7/telegram-topic-uploader` | The Android app. The user's management interface. | `/root/work/telegram-topic-uploader` |
| `funzi7/telegram-remote-sources` | The always-on server. Private. | `/root/work/telegram-remote-sources` |
| `funzi7/agent-memory` | This memory. **Shared with other projects — preserve their commits.** | `/root/work/agent-memory` |

All three: branch `main`, tracking `origin/main`.

**The application** is a private, local-first Android app that uploads media from folders granted
through the Storage Access Framework into topics of a private Telegram forum supergroup, and — only
after Telegram provably has a file — can permanently delete the source.

**The server** discovers posts on Reddit, X and 9GAG, holds them for review, downloads media only
when needed, and delivers into Telegram topics. It holds everything the phone must not: platform
sessions, scraping tools, the schedule, the media, and the Telegram bot token.

### Final HEADs

Recorded in each session's final report. **Never invent or predict a HEAD before the commit exists** —
one written down early is a fabrication, and downstream sessions will try to verify it. Verify any
supplied HEAD against GitHub before trusting it.

### D6A10 current handoff — the official Publisher activated for real use

**One approved milestone.** The D6A9 Publisher (official Meta Content Publishing API, server-owned)
went from `setup_required` to a working product, without touching Telegram delivery or the Instagram
*viewing* credential. No real Meta publication has occurred — no operator Meta credential is
configured on production — so the four Meta-runtime gates are `BLOCKED_NEEDS_META_SETUP`, honestly.

- **Batch drafts.** Select videos in Review (or one folder-media video) → "Add to Instagram
  Publisher" → one independent server draft per video (never a carousel), each staged resumably.
- **Burned-in video text, rendered on the server.** A draft editor sets an Instagram caption and an
  overlay: simple (one text, TOP/CENTER/BOTTOM, full duration) or Advanced (multi-segment, each with
  start/end, position and size). The server burns it with ffmpeg+libass into a *verified derivative*
  (ffprobe + recomputed SHA-256), never modifying the original; Hebrew/RTL render correctly. READY
  means the current overlay revision has a verified derivative; any edit invalidates it and
  re-renders, and a render that finishes after a newer edit is `superseded`, never published.
- **Durable automation.** One server policy per device: manual / every-N-hours+anchor / fixed daily
  times, in an IANA timezone. At most one front-of-queue READY job publishes per due slot; a
  RESULT_UNKNOWN pauses the account's automation; there is no catch-up burst after downtime (anchor
  defines the grid, a cursor advances past missed slots, a 15-minute grace). DST fall-back publishes
  once, spring-forward's nonexistent hour is skipped.
- **Operator-only connection.** No in-app Instagram login. The Meta app id/secret/long-lived token are
  provisioned on the server (`remote-sources-configure instagram-publisher`, hidden input,
  `instagram_publisher` namespace) and validated read-only (`remote-sources publisher-validate`).
  Graph pinned v26.0. The D6A9 `/publish/account/connect` OAuth stub was reduced to operator-only.

**HEADs (verify against GitHub before trusting):** Android
`76fec641735089049b8a1cbe7e25901cb3703987` (65 / 0.16.0-d6a10, Room 17, no migration); server
`01dbda6919faea73d4a225b21b56d49848aaa94c`, deployed and the service reports the same, migration
`0011_d6a10_publisher_automation` applied. APK
`Download/telegram-topic-uploader/TelegramTopicUploader-0.16.0-d6a10.apk` (17,600,701 bytes, SHA-256
`2f67f863…608641`, signer `74:E7:86:54:…:DF:D4` matches, not installed, prior APKs untouched).
Gates: server 2,053 pytest passed + preflight 77 + both real smokes PASSED (render frame-verified
Hebrew/RTL; automation `MEDIA_PUBLISH_CALLS_PER_JOB=1`, no burst); Android 3,921 tests / 0 failures +
lint 0 errors + both assembles. Adversarial review: no high/critical; two low-severity Android fixes
applied + regression-pinned. The deploy rebuilt the api image and now pins `fonts-dejavu-core` +
`tzdata` (the render font + automation zoneinfo DB), verified present on production. Publisher
production runtime `SETUP_REQUIRED` (no Meta credential). Device checklist (Hebrew) is in the app repo
`docs/D6A10_DEVICE_CHECKLIST.md` and awaits the user's normal use.

### D6A9 current handoff — a proven double delivery is closed, and the official Publisher shipped

**One approved milestone, two strictly-ordered parts, both shipped.**

- **Part A (P0), the priority.** A media item was physically delivered to its Telegram topic
  **twice** while its Queue row still offered *Upload now* and its source file was gone. Root cause: a
  generic failure of the phone-upload `finalize` call — the one call that can make the server
  dispatch to Telegram — was classified as a pre-dispatch retry, so the retry dispatched again. Fixed
  on both sides: a lost/timed-out/5xx/malformed finalize is RESULT_UNKNOWN (never retried), a server
  content-identity guard on ordered `(sha256, bytes)` + frozen destination + upload shape refuses a
  second dispatch of delivered/in-flight media, and the stranded row recovers from positive-only,
  monotone media evidence — never a resend.
- **Part B.** The **official** Instagram Publisher (Meta Content Publishing API; no private APIs, no
  browser automation, no publishing through viewing cookies). Server-owned throughout: credential in
  the `instagram_publisher` secret namespace only, SHA-256 verified staging, durable server-owned
  scheduling, exactly-once publish with RESULT_UNKNOWN reconciliation. A **new**, distinct drawer
  destination "Instagram Publisher" / "מפרסם אינסטגרם" — NOT the pre-existing local "Instagram
  publishing" share flow, which was left untouched. With no Meta credential it is `setup_required`.

**HEADs (verify against GitHub before trusting):** Android `65d01b77a6cce380b097b03d06292b7777b4c194`;
server `2b4b4491a61d08efc22f0cf06fce03db75d6bbaf`, deployed and the service reports `2b4b449`, migration
`0010_d6a9_instagram_publisher`. Android **64 / 0.15.0-d6a9**, Room **17**. APK
`Download/telegram-topic-uploader/TelegramTopicUploader-0.15.0-d6a9.apk` (18,797,507 bytes, SHA-256
`2ad5563e…`, signer matches D6A8f), not installed, prior APKs untouched. Publisher production runtime
`SETUP_REQUIRED` (no Meta credential). Gates: server 1,996 pytest passed + release-preflight + P0
finalize smoke `duplicate_second_send=none`; Android 3,904 tests / 0 failures + lint + assembles. An
independent adversarial review of the exactly-once core found and fixed four liveness bugs, each with
a regression test. Device checklist (Hebrew) is in `cc-latest.md` and awaits the user's normal use.

### D6A8f current handoff — the shared Instagram viewing session is rejected and contained

The handset physically showed the one shared Instagram viewing session as **rejected / connection
rejected**. This is an account/session fact shared by every Instagram source, not a network,
pairing, per-source or missing-setting failure. No account, source, destination, post, cookie,
filename/path or screenshot identity is retained here.

The server now has one generation-bound, cross-process-leased contact gate. Rejected/challenged
blocks scheduled feed and Story discovery, rosters, Check now (including old clients), ordinary
validation, authenticated media resolution, automatic retry and live maintenance before any
extractor or HTTP start. Configured-but-unverified is validation-only; absent/unreadable fails
locally; rate-limit/backoff remains authoritative. Sources stay enabled and keep destination,
schedule, mode, Story setting, cursor, items, Review, History and backlog. Credential-blocked work
parks under the same delivery operation and retry ladder, consumes no rung, creates no duplicate and
never re-arms `RESULT_UNKNOWN`.

Server production code and deployed release are
`d35fce0ccf83001577a812600e8cebe18056cb2d`; the documentation HEAD is
`9d7cd6009a6d1829919ec53be35bb8acbe19182c`; migration remains
`0009_d6a7f1a_video_poster`. The exact-tree gate passed ruff format/check, mypy over 146 source files,
1,927 passed / 3 skipped tests, the 68-module archive preflight, shell syntax and diff checks. The
real isolated service/runtime smoke passed with zero process, socket and HTTP-client starts and
exact durable preservation. Guarded production deployment passed; afterwards a healthy scheduler
left two already-overdue rejected rows untouched with zero Instagram CheckRuns and zero recent
session uses. Production retained three enabled Instagram sources and no retry-wait operation at
the observation.

Android is **63 / 0.14.12-d6a8f**, Room **17**, no migration. Production code is
`9d9d864c4d75b1b345c248b365ab4f32121e86d8`; the exact green gate included the test-only correction
at `f03a6d22cf753815ac6f7b06b536c6add78e72dd`; documentation HEAD is
`65e00d0a953a88b76c384530b9a388710c1ffd54`. The shared card owns the renewal explanation, source
cards show only a compact shared pause, Instagram Check now is locally unavailable, stored Review /
History / pending work stays visible, and non-Instagram actions are unchanged. The gate passed 3,864
tests / 245 suites with no failure, error or skip, lint with 2 warnings / 0 errors, and both debug
assemblies. Instrumentation compiled and did not run.

The uninstalled APK is
`/sdcard/Download/TelegramTopicUploader/TelegramTopicUploader-0.14.12-d6a8f.apk`, 17,361,748 bytes,
SHA-256 `eaaf5dfc06c3625749cbe415e31e33265b1e952f096f97ebdb34a1fe31df665d`; source and destination match
and the signing certificate matches the prior release. Older APKs were untouched.

Release truth is deliberately split: `UNIT_CI=PASSED`, `INTEGRATION_SMOKE=PASSED`,
`DEVICE_E2E=AWAITING_USER_NORMAL_USE`, and
`INSTAGRAM_RENEWAL_RUNTIME=BLOCKED_NEEDS_FRESH_CREDENTIAL`. ADB had no connected device. No fresh
operator-provided credential existed, so there were zero live Instagram validations, zero repeat
probes of the rejected session and zero Telegram test sends. Future renewal imports a genuinely new
server-only generation, observes configured-unverified locally, then uses one explicit validation;
anything other than connected means stop. The ten checks in `docs/D6A8F_DEVICE_CHECKLIST.md` remain
unmarked until normal physical observation.

## 2. Working model

- **ChatGPT is the manager, planner and verifier.** It writes the milestone specification, checks the
  result, and decides what ships.
- **Claude Code or Codex implements** inside the repositories.
- **The user works from Android**, through Termux with a PRoot Debian environment. Everything runs on
  that device; there is no separate workstation. **Docker is not available there** — the server image
  must be built on the VPS.
- **Standard entry:** the user starts the agent in `/root/work/telegram-topic-uploader` and hands it
  the milestone specification.
- **No destructive git, ever.** `git reset`, `git clean`, `git restore`, `git stash`, force push,
  destructive checkout, and alternate worktrees used to bypass local changes are all forbidden.
- **Repositories are committed and pushed separately** — server, then application, then agent-memory.
  All must end clean, zero ahead, zero behind.

### D6A8b settled what the withdrawn D6A8a fix was pointing at — read this before touching claims

The D6A8a note below is still correct about `dispatchAttemptId`, and D6A8b explains **why** it was
correct and fixed the underlying problem rather than the symptom. The column really did mean *an
attempt is claimed* to the rest of the application — and that was itself the defect. Four durable
columns were unioned into one boolean:

    hasExecutionClaim = executionOwnerToken IS NOT NULL OR dispatchAttemptId IS NOT NULL

Two of them (`executionOwnerToken`, `executionLeaseExpiresAt`) mean **a worker holds this row now**.
Two of them (`dispatchAttemptId`, `dispatchStartedAt`) mean **an attempt happened once and is
over** — and a terminal settlement clears the first pair and deliberately *keeps* the second, so
every row that had ever reached dispatch read as permanently claimed.

Since D6A8b the concept is split: `hasLiveExecutionClaim` and `hasDispatchAttemptEvidence`.

- **a retirement** still refuses both, because it releases the reservation and a started request may
  have been accepted. Its refusal is now `DISPATCH_ALREADY_ATTEMPTED`, which is true of the row;
- **a dismissal** refuses only the live half, because it keeps the reservation.

**Do not re-merge them, and do not "simplify" the policy back to one boolean.** The cost of the
merge was not a bad sentence: D6A5's dismissal tests the same boolean, so it had been unreachable
for every row it was built for, and its tests passed because they constructed
`hasExecutionClaim = false` — a value production cannot produce for such a row.

### Two D6A8a fixes were withdrawn, and must not be re-attempted

Both were plausible, both were refuted by an adversarial read of the finished diff, and neither
reached a device:

- **Retaining `dispatchAttemptId` for a server-owned wait.** That column means *an attempt is
  claimed* to the rest of the application — `hasExecutionClaim` is projected from it, every claim
  query requires it NULL, `SafeRetirementPolicy` refuses removal on it. Retaining it makes the row
  permanently unsendable and unremovable.
- **Acting on a per-item `found: false` from the reconcile route.** `decideFor` discards a not-found
  *exact* finding, so such a branch can only fire on the legacy media-at-destination probe — which,
  since D6A7f2c, says "not found" about sessions that are alive. It is a duplicate-post path.

The sound replacement is `device_non_terminal_sessions` on the reconcile response: a **count**, not
an identity, so zero cannot be the "asked with the wrong key" answer.

### Facts about production a later chat must not rediscover — D6A8a

- **TikTok's CDN refuses this deployment's own HTTP client, whatever headers or cookies it carries,
  and serves `yt-dlp`.** Tested live, one variable at a time, from the production host against a
  real post: the resolved format's own `http_headers` → 403; those plus the document's cookies →
  403 with an anti-bot HTML body; bare, `Referer`-only and `User-Agent`-only → 403; `yt-dlp`
  downloading the same post seconds later → 19.5 MB of real MP4. **Do not re-attempt a
  "resolve the URL and fetch it ourselves" fix for TikTok**; it is tested and dead, and the code
  that did it has been deleted rather than left as a fallback.
- **The reconcile route answers `found: false` for two opposite facts** — the server has no such
  session, and the session's body would not parse. Android now separates them with `provenAbsent`.
  Anything new that reads that route must keep them apart.
- **`DeliveryOperation.last_retry_after_seconds` serves two different waits** — Telegram's own
  uncapped `retry_after`, and the pre-dispatch ladder's position. A third kind of wait added to
  that column must extend `_TELEGRAM_OWNED_WAITS` in `remote_sources/delivery/failures.py`.
- **The ten TikTok items imported on 2026-08-10 are real user data and were deliberately left in
  `review`.** No one-off SQL, no manual dispatch, no baseline reset. The source's own scheduled
  check is what acts on them.

### Permanent manager-workflow rules — recorded so no later chat rediscovers them

- **The user launches the complete three-pane development session with the `apps` command.**
  **Do not** hand them `cd`, `cauto`, or any other session-entry command before a future prompt
  unless they explicitly ask for one. They already know how to open the session; offering it every
  time is noise.
- **Since D6A7f2a, every Claude session started by `apps` runs at effort `xhigh`.** The launcher's
  Claude pane exports `CLAUDE_CODE_EFFORT_LEVEL=xhigh` for that process only; no global shell
  setting was touched, and a shell, pane or manual `claude` outside `apps` keeps its own default.
  The mechanism was verified against the installed binary rather than assumed — it recognises the
  variable and `xhigh` is a valid level — and an environment variable was chosen over the
  equivalent command-line flag deliberately: a future version that stopped recognising the variable
  would ignore it, whereas an unknown flag would fail the launcher outright. Consequence worth
  knowing: `/effort` cannot lower it mid-session while the variable is set. The pane arrangement,
  window numbering, working directories, `--add-dir` paths and permissions are unchanged, and the
  pre-edit backup lives beside the script and is **not** in any repository.
- **Development prompts stay in English.** Explanations to the user, and every device-testing
  instruction, stay in **Hebrew**.
- **Every final Android build is copied to `/sdcard/Download/`** with a versioned filename and a
  verified matching SHA-256. See §3 — it is not optional and it is not the last step somebody
  remembers.
- **Install upgrades over the existing application.** Never uninstall, never clear app data: that
  destroys every folder grant, destination, queue item, confirmation, ignore marker and deletion
  tombstone.
- **Every newly agreed product decision, workflow rule, device finding, unresolved defect and
  verification result is written to a durable file** — the relevant project `TODO.md` or state
  document, and this handoff — **before the milestone ends**. A later chat must never have to
  rediscover something this one was told. Silence is not equivalent to completion.
- **Do not silently close an older device row.** A checklist line is closed by somebody running it,
  never by a later milestone deciding it probably works. D6A7d closed exactly one — screenshots —
  and only because the device said so.
- **A refusal is not a result.** The D6A7c1 device report pressed Check now twice; the second was
  refused by the manual cooldown, and that is evidence about the cooldown and nothing else. Story
  deduplication was **not** proven and must not be recorded as proven.
- **`GRADLE_USER_HOME=/root/.gradle` for every Gradle command.** The agent runs as `devagent`, whose
  `$HOME` is `/home/devagent`, while the Gradle cache lives under `/root/.gradle`. Without it,
  `--offline` fails at configuration time with dozens of "no cached version available" lines that
  read like a broken build and are not.

## 3. Installation rule

Always show the Termux `cp` command before installation:

```
cp /root/work/telegram-topic-uploader/app/build/outputs/apk/debug/app-debug.apk /sdcard/Download/
```

**Install over the existing app.** The debug certificate has not changed since D5A — at D6A7d it is
still `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4`. **D6A7e8 (code 50,
`0.13.25-d6a7e8`) supersedes every earlier build; no intermediate version needs installing first.**

**D6A8e does not move the Room schema — it stays at 17, and no migration runs on this install.**
The topic Queue is a projection and snapshot predicate over the existing queue, and live SAF access
is resolved from exact identity plus the grants already stored in `source_directories`; neither
needs a new table or column. Build **62 / `0.14.11-d6a8e`** supersedes 61. Install it over 61 — do
not uninstall and do not re-add a removed nested folder merely to make an old card readable.

**D6A8d does not move the Room schema — it stays at 17, and no migration runs on this install.**
Its counts are projections and its delivery wording is presentation state. Build **61 /
`0.14.10-d6a8d`** supersedes 60.

**D6A8c does not move the Room schema — it stays at 17, and no migration runs on this install.**
The inline player's expansion state is UI state and needs no column. Build **60 /
`0.14.9-d6a8c`** supersedes 59.

**D6A8b does not move the Room schema — it stays at 17, and no migration runs on this install.**
The local repair needed no new column: the two facts it separates were already in four existing
columns and were only ever read through one projection. Build **59 / `0.14.8-d6a8b`** supersedes 58.

**D6A8a does not move the Room schema — it stays at 17, and no migration runs on this install.**
The durable delete queue reuses `manual_source_deletions`, which has recorded the user's
confirmation before any attempt since D5A and simply had **nothing that ever executed those rows**;
the now-durable Review sort order is an `AppSettingsRepository` preference storing the enum's
*name*, deliberately not a column. Anything missing after the install is therefore not a migration
defect, because there was no migration.

**D6A7e8 does not move the Room schema — it stays at 17, and no migration runs on this install.**
The identity field's canonical value is **form state**: it has no column, is not persisted, is not
sent as a separate field, and what reaches the server is the ordinary identity string it always was.
There is deliberately no schema 18. Anything missing after the install is therefore not a migration
defect, because there was no migration.

**D6A7e7a does not move the Room schema — it stays at 17, and no migration runs on this install.**
Process-start ownership is runtime orchestration; the dispatch error vocabulary was already stored
as text in the existing error column, so naming a new code cost no schema change; the same-attempt
confirmation writes job, attempt and evidence columns that already exist; and the last-send summary
is a presentation aggregate in its own `last_send_summary` private preference file. Anything missing
after the install is therefore not a migration defect, because there was no migration.

**D6A7e7 does not move the Room schema — it stays at 17, and no migration runs on this install.**
The transport selection and the derived public endpoint live in the existing `remote_server`
preference file, never in Room, so anything missing after the install is not a migration defect,
because there was no migration.

**D6A7e6a does not move the Room schema — it stays at 17, and no migration runs on this install.**
Notification lifecycle is process behaviour over the existing runner slot and request rows; no
notification-lifecycle state was added to Room and no migration was created for one. With the send
queue empty, **force-stop the application once before testing** — the old orphan notification
predates this build and must be cleared once so anything seen afterwards is this build's own
behaviour.

**D6A7e6 does not move the Room schema — it stays at 17, and no migration runs on this install.**
The foreground-first start fits the existing runner slot, and thumbnails and Preview staging are
cache state, not Room state; anything missing after the install is therefore not a migration
defect, because there was no migration.

### The permanent APK-to-Downloads rule — D6A7c1

> **After the final successful Android build, every Android release must copy the exact final
> `app-debug.apk` into `/sdcard/Download/` with a versioned filename, verify that the destination
> exists, and verify that source and destination SHA-256 values match. Building the APK without
> copying it is not a completed Android release handoff.**

It is a rule rather than a habit because D6A7c built an APK and did not copy it, and the user could
not install the release. Three further conditions:

- **The copy must follow the final build containing all committed Android code.** If Android changes
  after the copy, rebuild and copy again.
- **Never delete prior APKs from Downloads.** They are the only way to go back.
- **If `/sdcard/Download/` is unavailable, the Android release handoff has failed** — report the
  exact filesystem error rather than silently skipping the copy.
- **D6A8d: verify the signer by its certificate, not by the signature block.** `META-INF/CERT.RSA`
  is a PKCS#7 SignedData block that *contains the signature*, so its digest changes on every build
  and comparing it release to release proves nothing — it will always look different and read as a
  changed signer. Extract the certificate inside it and compare that fingerprint:
  `openssl pkcs7 -inform DER -in CERT.RSA -print_certs | openssl x509 -noout -fingerprint -sha256`.
  It has been `74:E7:86:54:97:9A:76:70:4D:80:36:D5:76:83:59:FE:A9:2D:DE:6A:7E:65:51:E2:04:C1:3D:0E:8F:3C:DF:D4`
  (`CN=Android Debug`) since D5A.

**D6A7e2 does not move the Room schema — it stays at 16, and no migration runs on this install.**
Every folder grant, destination, queue item, confirmation, ignore marker, deletion tombstone and
Story identity is simply still there. (That makes the install cheap to verify and cheap to reason
about: anything missing afterwards is not a migration defect, because there was no migration.)

**D6A7e1 moved the Room schema 15 → 16** — one new table, `explicit_send_requests`, so a *Send
now* tap is durable authorization that survives a process death and a second tap can wait its
turn instead of being refused and forgotten. Purely additive: no row rewritten, no table
recreated, destructive fallback still forbidden. (D6A7e moved it 14 → 15 for the batch
acceptance columns.) **A migration runs on this install: check Directories, Review, the Queue and
History afterwards, because anything missing is a migration defect, not a cosmetic one.**

**D6A7d moved the Room schema 13 → 14** — five nullable columns on `upload_jobs` and one unique
index, so a person's finding about an uncertain upload can be recorded without manufacturing
Telegram evidence. Purely additive: no row is rewritten, no table recreated, destructive fallback
still forbidden. (D6A6 moved it 12 → 13 for the Instagram publishing queue; nothing between them
moved it.) **A migration runs on this install: check Directories, Review, the Queue and History
afterwards, because anything missing is a migration defect, not a cosmetic one.**
Since D6A5 the **Settings screen states the installed version**, read from the package itself —
check it before recording any device answer, because a checklist answered against the previous
build reads identically to one answered against this one.
**Do not uninstall** — it destroys the database, and with it every folder grant, destination, queue
item, confirmation, ignore marker and deletion tombstone.

## 4. Current completed milestone

**D6A8e** — one global Queue viewed by topic, and an exact document that remained reachable through
its mapped parent after the nested mapping that discovered it was removed.

> **The topic Queue is not another queue.** Room's `upload_jobs` and its durable reservation remain
> the only job identity and exactly-once authority. `UploadJobDao.findClaimCandidates` supplies the
> canonical total order — due time, creation time, then job ID — and an optional stable destination
> ID predicate filters that order without changing it. `RoomBatchRepository` freezes the same
> press-time snapshot and `BatchUploadCoordinator` / `DefaultBatchUploadRunner` execute it through
> the same single-item launcher and application-wide ownership guard as global *Upload all*.
> Destination labels are presentation only. Confirmed and `RESULT_UNKNOWN` jobs remain ineligible,
> album-owned members remain excluded from the generic runner, and only one active batch slot exists.
>
> **The nested SAF defect was an access-routing defect, not a missing-file defect.** Media kept the
> exact provider authority and document ID discovered through the child, but byte consumers tried
> the child-derived URI directly after unmapping released that permission. One canonical live
> resolver now prefers the usable original tree, otherwise asks active candidate trees to prove
> access to that exact document and deterministically chooses the narrowest proven ancestor. It
> never searches by name, metadata or path, never enumerates siblings, and never assumes that a
> shared authority is enough. Read and write are separate capabilities; deletion still needs its
> frozen policy and every existing proof. A fallback is transient and does not rewrite provenance.
> Shared-tree permission release is reference-aware, and parent/child rescans retain one logical
> media row and its queue/history/evidence.
>
> **D6A8d physical evidence carried into this milestone:** the repaired TikTok backlog delivered
> naturally through `AUTO_SEND`, **10/10**, and the user physically confirmed all ten arrivals; none
> of those ten showed the white/blank-card presentation. No manual Send or Check now was used.
> Instagram is deliberately **partial**: **20** deliveries were physically observed and **4** were
> still in automatic retry at observation, so its backlog is not recorded complete. Remote History
> physically read **All 169 / Sent 101 / Failed 68 / Unknown 0**, and pending cards used truthful
> not-sent-yet / automatic-retry wording. The code maps one carousel to one media group and calls
> `sendMediaGroup`; physical Telegram album rendering remains **UNVERIFIED**.
>
> Final release values: Android code
> `9c836182bc86056a0ea8a407568fe015d1d0113b`, Android HEAD
> `6f6b49be51d84a39c5825334b8faae97d171d4c8`, server docs HEAD
> `cbb687c99ec50073fc365ddec7bb6f33a1d3012f`; gate **3838 tests / 0 failures /
> 0 errors / 0 skipped / 242 suites / 2 lint warnings and 0 lint errors**; APK SHA-256
> `555e43572887b1c2ff441c8d8681654148b1eadf1c01cbfc6cecfd54aa7e018a` at **17,331,566
> bytes**, source/destination identical and signer certificate matched to D6A8d. The adversarial
> review classified **19 atomic claims: 3 confirmed and fixed, 16 refuted, 0 not applicable**.
> Server production stays deployed at
> `0e18506fbe8bd8695cea73128dc83d7c71e0c673`, migration
> `0009_d6a7f1a_video_poster`; D6A8e does not deploy server code or its documentation.

**D6A8d** — the white/blank Telegram video card on every Remote delivery this service has ever made,
a confirmed delivery that still published its earlier failure, a card that claimed a delivery on an
item that had never been sent, and counts on every relevant tab.

> **The white card is a re-occurrence, not a discovery, and the control case had to come from
> somewhere unexpected.** D6A7f1 proved on hardware that a `sendVideo` with no duration renders as a
> blank `0:00` card; D6A7f1a proved that some files stayed blank *with correct durations* until the
> poster travelled too. The Remote dispatcher was never brought along: it built every outgoing
> member with duration, dimensions and poster absent — unconditionally, on both transports, for
> every delivery ever made. So **no normally-presenting Remote video exists** to compare against,
> and the working sibling is the phone path: same bot, same Local Bot API server, same period, 194
> confirmed sessions with videos up to **28,784,273 bytes**, all carrying measured presentation and
> a verified poster, all rendering normally. That is nearly three times the size of the Remote video
> that came out blank, which is what rules size out. **No size threshold is encoded and a test in
> each repository refuses one.**
>
> **The reason for the omission was true when it was written and had quietly lapsed.** The docstring
> said this service "has no decoder". The media is staged on the server before dispatch and the
> runtime image has carried `ffmpeg` — and therefore `ffprobe` — since the first release, because
> `yt-dlp` needs it. The honest sentence was never *cannot know*; it was *never asked*. No
> dependency was added, and the toolchain was inspected before anything was reached for.
>
> **A delivery is retried in place**, so the five Instagram rows that confirmed on 12 August are the
> rows that had failed — and the confirmation was written over the top without clearing it. Five
> rows said `confirmed`, with a confirmation time and a message id, beside `media_http_403`. Fixed
> in three places, each load-bearing alone: the writer, a projection guard that covers every row
> written before the writer was fixed, and one narrow repair (5 / 5 / 0).
>
> **A frozen destination does not mean delivered.** It means a delivery operation exists — true of
> the 33 items sitting in Review having never been sent — and the card was rendering *sent to
> `<topic>`* for it. One boolean carrying two facts, the same class D6A8a fixed one line higher.
>
> **The 33 were re-armed by D6A8c and were not sent by this milestone.** Nothing here pressed Send,
> pressed Check now, created a delivery operation, moved a cursor or altered their state, and no
> live request of any kind was made — the optional bounded media reconstruction was not needed.

**D6A8c** — the Local Bot API container that could never read the directory Remote delivery stages
into, an Instagram media fetch that carried no session, a compact media tile that opened a player
and nothing that closed it, and a refusal that implied it knew a reason it had never stored.

> **The diagnosis was certain rather than plausible because of a working sibling.** Every Remote
> Sources delivery attempted after the cloud-to-local migration was refused — 33, no successes — and
> every one ever confirmed was before it. Meanwhile **194 phone uploads confirmed across the same
> period**, same bot, same server, same release. The only difference is which directory the file sat
> in: the phone's root was mounted into the `telegram-bot-api` container and the delivery staging
> root was not. Confirmed from inside the container before and after the fix.
>
> The cause in code was one boolean doing two jobs — `supports_local_path` means *this transport
> accepts a path*, and it was answering *this file is one the receiver can open*. The rule is now a
> conjunction, so no other directory can repeat it silently.
>
> Instagram's media fetch was anonymous while its discovery was authenticated. One bounded probe:
> **403** for the old path, **512,272 bytes of valid media** for the authenticated extractor,
> against the same failing member minutes apart.
>
> **The repair re-armed 33 items — 10 TikTok and 23 Instagram — and the 23 were added only after the
> user reviewed the evidence and approved.** The brief had scoped it to TikTok; the milestone
> reported the count and left them alone rather than widening on its own reading. It created no
> delivery operation, sent nothing, preserved all 33 historical refusals, and a second `--apply`
> reported zero.

**D6A8b** — the terminally failed row that offered nothing at all, the canonical rule that a settled
row may keep evidence and never ownership, three transport conditions that were never unidentified,
a pre-dispatch retry ladder that started again every morning, a Telegram refusal that recorded no
reason, and Remote History finally saying it is a record of *attempts*.

> **Forensics first, and the local half was structural.** The Room database is not reachable from an
> unprivileged shell, and it did not need to be: `SafeRetirementPolicy.refusal` is an ordered `when`
> of mutually exclusive clauses, so the sentence the card rendered eliminates every earlier clause.
> No message id and no confirmation, a genuine `FAILED_PERMANENT`, a true claim boolean — and since
> exactly two statements write `FAILED_PERMANENT` and both guarantee `executionOwnerToken IS NULL`,
> there was no live owner and the true half could only be `dispatchAttemptId`.
> `LOCAL_FAILED_ITEM_BUCKET = TERMINAL_AMBIGUOUS_STALE_CLAIM`.
>
> **Production had three enabled AUTO_SEND sources, not one** — two Instagram, one TikTok.
>
> **The D6A8a TikTok fix worked and Telegram then refused every item.** A scheduled check succeeded
> at 06:58 on 2026-08-12 and the backlog drain created ten operations six seconds later, the first
> Telegram requests those items ever produced. All ten were definitively refused.
>
> **Five Instagram items each had six delivery operations**, one per daily check since 1 August,
> because ladder exhaustion was recorded only in a log line while the item's durable code stayed the
> coarse `download_failed` — which is transient by construction.
>
> **`REVIEW` + `FAILED_AFTER_DISPATCH` was predicted and does not exist.** Zero pairs, and the state
> is unreachable. The refutation is pinned by a test, not by prose.

**D6A8a** — the Queue row that claimed the server owned a send the server had no record of, the
TikTok auto-send path diagnosed from production, the copy that said a configuration had been sent
to, the sort corrected to date and size, and a delete queue that finally has a driver.

> **A corrective milestone, opened by hardware, settled by evidence read first.** Nothing here was
> designed from the brief's description alone: the server was read read-only before a line was
> written, and **two plausible readings were refuted on the way**. Both refutations are recorded in
> the repositories rather than tidied away, because they are the part a later chat most needs.
>
> **The stuck Queue row was not waiting for the server.** All 197 local upload sessions on the
> server are terminal; there is no staged, retry-waiting or dispatching row at all, no bot-wide
> block and no maintenance. The handset had asked fifteen times and been answered `200` each time.
> Two defects made the row permanent: the durable write that produces a server-owned wait **cleared
> the dispatch-attempt identity**, leaving only the weaker media-at-destination one to ask with; and
> a *not found* answer was never acted on, which is right everywhere except for a row whose whole
> content is a claim that answer disproves. Both fixed — and narrowed by their own guard, because
> the transport reported `found = false` for both "no such session" and "an answer that would not
> parse", which are opposite facts. `RESULT_UNKNOWN` is still untouched by any absence.
>
> **The TikTok 403 was not a header problem, and the first fix for it was wrong.** Ten items were
> imported, authorised, attempted and abandoned without a reason — ten operations, zero Telegram
> requests, reasons written only to a log line. The obvious diagnosis (a signed CDN URL fetched
> without the `http_headers` yt-dlp prints beside it) was implemented and then **refuted live**:
> those headers 403, those headers plus the document's own cookies 403 with an anti-bot HTML body,
> bare and single-header variants 403 — while `yt-dlp` downloading the same post from the same host
> succeeded with 19.5 MB of real MP4. **TikTok declines this deployment's ordinary HTTP client and
> serves the extractor.** So the extractor downloads now, and the resolve-then-fetch path was
> **deleted** rather than kept. *Do not attempt the header fix again; it is tested and dead.*
>
> **A transient pre-dispatch failure finally has an owner** — the existing `RETRY_WAIT` state on a
> bounded five-rung ladder driven by the existing retry pass. No second engine, no second queue. A
> manual Send is never retried behind the person's back; a photo carousel is never retried at all
> and says so by name.
>
> **"בלי זה" meant *without this platform*, not *without sorting*.** D6A8 misread it. The sort is a
> dropdown (date and size, both directions, unknown sizes last in both, now durable across a process
> death) and the exclusion lives on Remote Review, the one surface whose rows carry an authoritative
> platform — the local grid deliberately does not get it, and that division is pinned by tests.
>
> **The delete queue was already durable and had no driver.** A Delete on an idle, safe file was
> greyed out because something unrelated was uploading; the confirmation was recorded faithfully and
> then nothing ever selected those rows. Room stays at **17**.

### 4a. The previous milestone

**D6A8c** — the Local Bot API container that could never read the directory Remote delivery stages
into, and an Instagram media fetch that carried no session. Its full note is in section 4 above; the
five Instagram deliveries it unblocked confirmed on their own afterwards, and those five confirmations
are what exposed both defects D6A8d fixed.

**D6A8** — inline playback inside the cards, the durable History poster, the **בלי זה** sort
option, and the TikTok listing that finally lists.

> **TikTok imports, proven from production.** The connector had never imported a post: gallery-dl
> must fetch every post's own page, TikTok answers those with an anti-bot challenge, and the tool
> skips each failure and exits zero with `[]` — a blocked profile read honestly as an empty feed,
> baselined as "nothing new" forever. A second defect hid behind it: the shared dump reader drops
> the URL element of a `Message.Url` triple and TikTok's metadata carries no `url` key, so even an
> unchallenged dump parsed to zero posts while url-embedding fixtures stayed green. Discovery now
> runs `yt-dlp --dump-single-json --flat-playlist` on the profile — no post page ever fetched, the
> page recorded as a `ytdl:` plan resolved fresh at dispatch. **A silent zero is never an empty
> feed**: clean-exit-zero-entries is `TEMPORARY_FAILURE / tiktok_listing_unavailable` and a failed
> validation; the one honest empty is yt-dlp's own `videoCount == 0` sentence. **Live validation:
> the deployed adapter's `discover(limit=3)` against the enabled TikTok source, from the
> production host, answered `success_new_posts` with 3 dated, titled, cover-carrying posts** —
> read-only, no DB write, no Telegram; the next scheduled check imports on its own. Photo
> carousels: a named limitation, refused at dispatch, never posted as their background track.
>
> **Inline playback lives on the cards.** The platform `MediaPlayer` on an owned `TextureView`
> (no media library, D6A7e3's rule stands) in the Review cell and below the Queue/History row:
> one application-wide slot, tap-target exactly the picture (images declare no gesture — scrolling
> and selection untouched), auto-hiding LTR controls with a lift-to-seek bar, a full-screen dialog
> sharing the session, pauses on backgrounding and audio-focus loss, and the Preview overlay
> takes the slot away at all four call sites. Named v1 limitation: rotation ends inline playback.
>
> **The History poster outlives its file.** Thumbnails always decoded from the original document,
> which delete-after-confirmation destroys moments after confirming — hence the permanent gray
> squares. A bounded two-tier poster store (deletion-time captures evicted last) now captures
> after the deletion gate and before the SHA-256 re-proof, always overwriting; the manual
> permanent discard removes the stored picture; compact tiles state a settled absence. Old rows
> whose sources were already gone get the sentence, not a picture — nothing can backfill them.
>
> **בלי זה** — a third Review sort chip that applies no comparator at all, with an honest note.
>
> **The adversarial review of the finished diff confirmed 19 findings (0 refuted), all fixed
> before the code commit** — the critical being the fullscreen toggle destroying its own session
> because the arbiter-release effect lived on the swappable surface. Six guards re-scoped, none
> deleted; one pre-existing dead slice anchor (D3B2's card region) found and repaired.
>
> **HEADs.** Android code commit `d5dd45fd3763d82821310e6967f136b9c839f449`, HEAD
> `845096633d133cab8e7663de1c5b2368b600a47f`, **57 / `0.14.6-d6a8`**, Room schema **17**, no
> migration; APK 17,159,121 bytes,
> `ed384318ae4ac9546e273a185a278f859f32b530bb839a91f1cac46d395cdf97`, in Downloads, not
> installed. Server code commit `76e4c7c03f575810e078fdd96a58da854a553f76`; `SERVER_HEAD` **and**
> `DEPLOYED_HEAD` equal at `f34ef5c61db5e0c9e1a885c02fac4b54ccd3cfa7` — deployed first attempt
> under a freshly re-read guard (Instagram 288.5 then 282.2 minutes out), the local Bot API
> container never restarted. Gates: Android 3588/0/0/0, 230 suites, lint 0 (the documented
> D6A7e8 flake hit the first pass once; the whole gate re-ran green, byte-identical APK); server
> 1637 passed, 3 skipped. TikTok live probes itemised in the server repo's
> `docs/RELEASE_REVIEW.md`; Telegram zero; Instagram not contacted.
>
> **Still open:** the physical run of build 57 — `docs/D6A8_DEVICE_CHECKLIST.md`, 32 items,
> backlog rows 258–268 — plus the still-unmarked D6A7f2c run (rows 252–257). Load-bearing:
> inline playback with the one-player rule, the delete-after-confirmation poster, the TikTok
> source's own check importing and rendering on the phone, and one TikTok send producing exactly
> one Telegram message.

## 4-prev. The milestone before

**D6A7f2c** — durable server-session reconciliation, the attempt-scoped retry identity, and
terminal History semantics.

> **The physical proof came first: the >50 MB Local-mode send is CLOSED.** Sent on build 55,
> positively confirmed by Telegram, retention ran; the server's table corroborates read-only —
> exactly one part ever staged above 50 MiB, 62,389,767 bytes, session confirmed. Do not reopen
> the ceiling sync, the migration, or that send's poster/duration. The stale open session expired
> **on its own** at its 2026-08-09 06:25Z deadline, exactly as predicted.
>
> **The defect family: the server settles, the phone never re-asks.** D6A7f2b's scheduler settled
> the three parked sessions within a minute, and the Queue went on promising "the server will send
> at 13:14" for hours — Android's only way to learn a session's fate was to try to create it
> again, and a create is not a read. The server gained `POST /local-uploads/reconcile` — bounded,
> device-scoped, identity never echoed, nothing per-item logged, zero mutation, zero dispatch,
> zero Telegram, and deliberately answering under maintenance — and the phone gained
> `ServerUploadSessionReconciler`, a single-flight read-only pass at process start after durable
> recovery, on the foreground 0→1 edge, on entering the Queue, and on pull-to-refresh, mapped by
> one exhaustive policy onto guarded UPDATE-only statements. **Attribution is the safety core**:
> the row's own retained `dispatchAttemptId` may confirm, un-block or downgrade; a
> media-at-destination match may only confirm, and only the newest row per media carries that
> probe. `not_found` mutates nothing. Reconciliation is never a retry.
>
> **The retry identity finally names one attempt.** `create_session` returns the existing row for
> an identity whatever its state — correct idempotency for an attempt, a permanent lockout for
> the legacy media-scoped `u1-` key, which is why the D6A7f2b sentence "it will be uploaded again
> to the current transport" was not executable. New single-upload sessions are keyed `u2-` + the
> durable `dispatchAttemptId`; a pure disposition table first rejoins a live legacy session
> (`open`/`staged` — staged bytes never abandoned), answers everything server-owned, delivered,
> uncertain, refused **or unrecognised** from the session itself, and opens a new session only
> after `failed_before_dispatch`/`cancelled`/`expired` or absence. Identity strings exist in one
> transport-internal object and nowhere else; albums and repairs keep their identities.
>
> **History has no upload ceiling — as a concept, not a value.** The card requires its surface;
> QUEUE passes the live row ceiling, HISTORY passes null; one invariant (whose truth table has a
> single true cell) gates every current-tense statement, so a positive confirmation dominates
> everywhere — the confirmed 59.5 MB video can never again read "blocked by a 50 MB limit". Due
> times render only while still future against a bounded card tick; a busy refusal reads as the
> previous attempt it was; the Queue says why rows remain.
>
> **HEADs.** Android code commit `19d63231c59e73fa7c80a6aecf662885176340e3`, HEAD
> `c8b121731630f343828ebff16f98539bd26bac40`, **56 / `0.14.5-d6a7f2c`**, Room schema **17**, no
> migration; APK 17,089,507 bytes,
> `a5d056b79d04232d8752faebf224e76ebe4c4a00d48945f1a9a9fe9b5ab7eab7`, in Downloads, not
> installed. Server code commit `3055e2afbe16a66075b77c2417b7cb98ca342f19`; `SERVER_HEAD` **and**
> `DEPLOYED_HEAD` equal at `e9f2d1e818d5da9db43ed0f48fbdd2bc03e7141f` — the guard window (861+
> minutes to Instagram's next check) allowed deploying docs too, and the local Bot API container
> was never restarted. Gates: Android 3553/0/0/0, 228 suites, lint 0; server 1630 passed,
> 4 skipped. Capability `local_uploads.reconcile.v1`.
>
> **Still open:** the physical run of build 56 — `docs/D6A7F2C_DEVICE_CHECKLIST.md`, backlog rows
> 252–257: the three stale rows reconciling on Queue open with no Send tap, the confirmed item's
> ceiling-free History card, and ONE safe explicit retry producing exactly one Telegram message
> through a new `u2-` session.

## 4a. Previous milestone

**D6A7f2b** — the state nothing owned, and the four rows that closed a phone's upload path.

> **The forensics came first and they changed the answer.** The user pressed Send on two videos above
> the old 50 MB ceiling. **D6A7f2a's ceiling fix worked**: the handset synchronized the transport
> three times and both files cleared preflight and reached the server — the stale-50-MB defect is
> closed and must not be reopened. Both requests were then refused **HTTP 422
> `too_many_active_sessions`** at `13:37:34Z` and `13:38:04Z`, **no session row was created for
> either**, and **Telegram was never contacted**. A 4 MB file would have been refused identically:
> the refusal reads no byte count.
>
> **The cause was a state with no owner.** The server's per-device cap is four and the device held
> exactly four, three of them parked by ordinary pacing at `06:14`–`06:27` with `attempt_count = 0`.
> Nothing could ever release them: `LocalUploadDispatcher.dispatch` had one caller, the device's own
> `finalize`; `due_dispatch_sessions` — written for the pass that would have driven them — had **no
> production caller at all**, only a unit test; `finalize` answers `session_not_open` for a parked
> session, so the phone could not finish one either; and `expire_sessions` swept `open` and only
> `open`. `RETRY_WAIT` was a terminal state that was not marked terminal.
>
> **Both attempts are bucket `I` (OTHER_PROVEN).** Bucket A was considered and rejected: it presumes
> a session with `received_bytes < expected_bytes` and prescribes a chunk/resume repair, and no
> session existed. Root cause code
> `local_upload_retry_wait_has_no_driver_and_saturates_active_session_cap`.
>
> **The server correction is deployed and verified live.** The scheduler now drives due sessions;
> retention reclaims every unfinished state, derived from the enum rather than a written list, with
> `DISPATCHING` deliberately excluded; and the transport generation is finally compared to something —
> `LocalUploadSession.backend` had asserted its own rule since D6A7f and no code had ever read it
> back. Within a minute of deployment the three parked sessions settled
> `failed_before_dispatch` / `transport_generation_changed` with `attempt_count = 0`,
> `request_started_at` null and no message ids — **nothing was sent** — and the device's active
> sessions went from four to one. **The cap was not raised**: a cap that admits work nobody will ever
> finish is not a cap that was too small.
>
> **The Android half stops the queue lying about which leg failed.** `retry_wait` and `dispatching`
> both became `RATE_LIMITED`, whose card sentence is *"Telegram asked this bot to slow down"* — said
> about sessions Telegram had never heard of. The server has distinguished `telegram_delivery_paced`
> from `telegram_rate_limited` since D6A7f and the phone never read the field. Four new codes, a
> ten-member `UploadTransferPhase` derived from durable columns, `nextAttemptAt` finally reaching a
> screen after existing unshown since schema 1, six notices carved out of one generic sentence, and
> **no Send button while the server owns the delivery**.
>
> **HEADs.** Server `d5cd04c1d5d827f8b129b1af8f427d56518a0b06`, and `DEPLOYED_HEAD` equals it
> exactly; migration head `0009_d6a7f1a_video_poster`, unchanged — none was written. Android
> **55 / `0.14.4-d6a7f2b`**, Room schema **17**, no migration: every new durable value is text in a
> column that already existed.
>
> **Still open:** the physical run of build 55 — `docs/D6A7F2B_DEVICE_CHECKLIST.md` — and one server
> upload session still `open` for this device, a video at 0 of 33,443,444 bytes received, which
> Android resumes in place or which expires by itself at `2026-08-09 06:25Z`.

## 4a. Previous milestone

**D6A7f2** — the Local Bot API migration, performed once.

> **The bot is on the official Telegram Local Bot API server.** One `logOut`; the cloud-verified bot
> id was frozen before the call and the local server answered `getMe` with exactly that id. Backend
> `local`, verified, maintenance clear, queue released, `max_upload_bytes` **2,097,152,000**. No
> database migration; every row count identical before and after; every schedule untouched.
> **No Telegram message was sent by any agent.**
>
> **Android was not rebuilt** — code commit `2afcedb9…`, APK `b3705d52…`, version 53 /
> `0.14.2-d6a7f1a`, Room schema 17, all unchanged.
>
> > **Corrected by D6A7f2a.** The line that stood here — *"the application learns the ceiling by
> > asking the server, which is what D6A7f built it to do"* — described the **design**. D6A7f built
> > the store, the binding and all three readers, and **nothing that could ever write one**:
> > `TransportCeilingSource.record(...)` had five call sites and all five were in one unit test, and
> > `RemoteTelegramTransport.transportStatus()` had no caller anywhere. The phone never asked, so
> > the ceiling could not move and the handset went on refusing a >50 MB video against 50 MB. The
> > missing synchronizer is D6A7f2a — **code 54 / `0.14.3-d6a7f2a`**.
>
> **The D6A7f1a two-class device gate closed on hardware.** Both the control class and the previously
> blank/white card class now show a useful poster, a real duration and exactly one message.
> **There is no 10 MB rule** and there never was: the user's client auto-plays the smaller video and
> requires a tap on the larger one, which is what made the missing poster conspicuous on one and
> nearly invisible on the other.
>
> **HEADs.** Server `11c98184d89c5d494e39ec800e9321a93b1159e2`; `DEPLOYED_HEAD` `f3609c3ca524cbbd3c856af09f168844f4966e1b` — deliberately different, the two
> commits between them being documentation only, because a docs-only redeploy would have restarted a
> freshly migrated backend inside the Instagram deployment window. Android, after D6A7f2a:
> code commit `602976dea98195190881ee75f1cddd14073103a4`, HEAD
> `a50ab0be423a6aaaed61c1d097f514d210e3e517`. **The server is unchanged by D6A7f2a — read-only, no
> commit, no deployment; it was already correct and the whole defect was on the phone.**
>
> **Still open:** the user's first physical >50 MB send over the local backend, and one deliberate
> *look* at poster sharpness in local mode — now on **code 54**, via
> `docs/D6A7F2A_DEVICE_CHECKLIST.md`. The transport rows of `docs/D6A7F2_DEVICE_CHECKLIST.md` are
> superseded: they could not have passed on code 53.

### The milestone this one completes

**D6A7f1a** — the picture the phone always made and never sent.

> **A corrective milestone, and the second half of D6A7f1's.** D6A7f1 restored the video metadata
> and the handset confirmed it: the videos that still look wrong now carry **real, non-zero
> durations**, tens of seconds and over a minute, where the original defect showed `0:00`. Duration
> propagation works and is not in question.
>
> **What is still wrong is the poster** — the still image Telegram shows on the message. Same shape
> of loss, one layer along. The application has generated a bounded JPEG poster for every video it
> presents inline since D3B1.3; it is *required*, and a file that cannot produce one is sent as a
> **document** instead, which is why every blank-card file provably had one on the phone. D6A7f's
> upload declaration had a size, a digest, a filename and a caption, and **no field for an image**.
> So Telegram was left to generate a preview itself — which it manages for some containers and not
> for others.
>
> **It is not a file-size rule.** The physical examples were around 10–12 MB. Telegram documents no
> such threshold, none was proved, and none was written into either repository.
>
> **Two repositories changed and production was deployed.** `LIVE_PROBES_USED=0` — no agent
> contacted any platform and **no Telegram message was sent**. The application was **not installed**.
> **No `logOut`, no Local Bot API activation**, and the `api_id`/`api_hash` the user had already
> configured was **left untouched**: not read, not cleared, not replaced, not printed, not
> re-requested. Status reports only that it is *configured* and *readable*.

| Field | Value |
| --- | --- |
| **Final application HEAD** | **`e507c659ef6c1c3c4379b25125cfa72e7dcb9d81`** — pushed. The build tree is `2afcedb9ade9480e5c78f2c3144f268aa3a9027d`; the commit after it is documentation only (the artefact record), so the APK hash is unchanged — documentation is not a build input |
| **Final server HEAD** | **`89b292d5086415da8d6d1c38d1598303d4d02409`** — **deployed and verified**; `DEPLOYED_HEAD` equals it exactly |
| **Deployment** | **done, CLOUD gateway mode, no rollback.** Migration `0008` → **`0009_d6a7f1a_video_poster`** applied and verified as the database head, and all eight poster columns are present. Backend `cloud`, `max_upload_bytes` 52,428,800, **no `logOut`**, Local Bot API not active — its container does not exist at all. **Every row count identical before and after.** The enabled Instagram source was **307 minutes** out when the clock was re-read immediately beforehand, and 305 afterwards — the wall clock elapsing, and the proof no Instagram request occurred |
| **Existing upload rows** | All eight pre-existing `local_upload_parts` rows read back as `poster_state = 'absent'` — true of them, and **none was rewritten, redispatched or deleted** to make it so |
| Version | code 52 → **53**, name `0.14.1-d6a7f1` → **`0.14.2-d6a7f1a`** |
| Room schema | **17, unchanged.** No schema 18: the poster is generated for an existing upload request, held in memory only until it is staged server-side, and never written to the user's folder, to Room or to a cache |
| Gate | **3327 Android unit tests, 0 failures, 0 errors, 0 skipped** (3287 before, **all retained**); **lint 0 issues**; `assembleDebug` and `assembleDebugAndroidTest` both succeed — instrumentation **compiles and was not run**. Server: **1529 passed, 4 skipped** (1479/4 at D6A7f1), plus ruff format/check, mypy (125 files), `release-preflight` (60 modules), `git diff --check` |
| APK | `/sdcard/Download/TelegramTopicUploader-0.14.2-d6a7f1a.apk`, SHA-256 `b3705d521ac2f7810ef55f586349aaa9d72b1efc7725da3d332028ff0b1f7c5b`, 16,964,198 bytes — hash verified identical to the build output, **not installed**. Every earlier APK left in place |
| **D6A7f2a build** | code **54** / `0.14.3-d6a7f2a`, Room 17, no migration. APK `/sdcard/Download/TelegramTopicUploader-0.14.3-d6a7f2a.apk`, SHA-256 `478268982aec7f084f31c1894a177b77345f4598e94a432863065bdd054a6eca`, 17,011,433 bytes — verified identical to the build output, **not installed**. Every earlier APK left in place |
| Hardware | **The blocking gate is open, and it is now TWO classes of video.** A control video from the class that already displayed correctly, **and** one from the class that produces the blank card, must both show a useful poster and a real duration, once each, exactly one message each. `docs/D6A7F1A_DEVICE_CHECKLIST.md`, nothing pre-marked. **The Local Bot API migration (D6A7f2) stays blocked until both pass.** |

### The lesson this milestone is really about

**One passing physical test was generalised into a class of passes.** The D6A7f1 checklist asked for
*one* ordinary small video. It got one, it worked, and "video presentation is fixed" is a far larger
claim than one file supports. The successor checklist requires two classes deliberately — the one
that already worked and the one that did not — and that change is the more durable half of the
correction.

**And a parity oracle was read as prose rather than as code.** D6A7f1 compared the server-backed
request against the three fields the old direct gateway's *documentation* names. That gateway also
attached a fourth thing its KDoc does not enumerate in that sentence: the `thumbnail` multipart part.
Reading `TelegramMediaUploadApiGateway` line by line is what found this.

### What D6A7f1a changed

* **One product concept, named once: the video poster.** `TelegramVideoThumbnail` →
  `TelegramVideoPoster`; `VideoUploadMetadata.thumbnail` → `poster`. Nothing above the four legacy
  direct transports speaks Telegram's wire vocabulary, and a guard asserts it. (The application's own
  *history/grid* thumbnail is a different, unrelated concept and is untouched.)
* **A declaration that describes the poster and cannot carry it.** Four numbers and a digest; no
  JPEG, no base64, nothing binary in a JSON body.
* **`POST /local-uploads/{id}/parts/{n}/poster`** — the whole image, one bounded request, exact
  `Content-Length`, digest recomputed over what arrived. Wrong length refused before the body is
  read; short body changes nothing; wrong digest keeps nothing; exact repeat writes nothing twice;
  refused once Telegram has been asked.
* **Staged before finalize**, because once staging is complete the phone may be gone. A 429 that
  delays the send by an hour reuses the same poster. The server has no decoder and never re-derives
  one.
* **One poster, two wire fields, chosen by transport.** `thumbnail` for cloud (main video is
  multipart, so the documented guarantee applies); `thumbnail` **and** `cover` for the planned local
  transport (main video is a `file://` path, so `thumbnail`'s *"Ignored if the file is not uploaded
  using multipart/form-data"* lapses and `cover`'s contract does not). Verified at source against the
  pinned official `tdlib/telegram-bot-api` revision — **no re-pin required**, and a test pins it so
  moving it forces the verification to be redone.
* **An album video member has a poster for the first time.** The album path passed `thumbnail = null`
  explicitly, with a note claiming a grouped video attaches no separate cover — never true of
  `InputMediaVideo`. A repair carries one too.
* **A bounded four-rung extraction ladder** — chosen frame, first frame, unsnapped decode,
  index-based extraction — then a neutral placeholder with **no text of any kind**. Before this, one
  failed decode demoted a perfect H.264 file to a document.
* **A poster never costs the send.** Not declared, not uploaded and digest-mismatched all dispatch
  exactly as D6A7f1 does. `delivered_wrong_shape` remains terminal and is never resent.
* **No public-edge limit was widened.** Telegram's ceiling for the image is under 200 kB; the general
  mutation cap is 256 KiB.

---

## 4a. The previous milestone

**D6A7f1** — the three numbers a blank card is missing, a document that stays one, and a setup that
does not wait a day.

> **Corrected by D6A7f1a.** It fixed the **duration**, and only the duration. Do not read its
> checklist's line 23 as *video presentation is fully physically fixed*.

> **A corrective milestone, opened by hardware.** D6A7f was installed and exercised on the handset.
> It proved a great deal — async validation is live, the TikTok connector correction works, URL
> cleaning works, and the transport reaches Telegram over public HTTPS with no Tailscale. It also
> **failed its own acceptance gate**: the one video it delivered arrived as a blank white card with a
> download icon and a duration of `0:00`.
>
> **Three repositories changed and production was deployed.** `LIVE_PROBES_USED=0` — no agent
> contacted any platform, no Telegram message was sent, no TikTok probe was made, and the forensic
> read of the 01:45 check was a read-only database query with no identity printed. The application
> was **not installed**. **No `logOut`, no Local Bot API activation, no `api_id`/`api_hash`** — the
> absolute rule of this milestone, kept.

| Field | Value |
| --- | --- |
| **Final application HEAD** | **`82375dece6d0f4ed9f25ddc6cb383ff78c697a75`** — pushed. The build tree is `ea753c6463cbe2554e8d3c50e5d793350b8bd332`; the commit after it is documentation only (the artefact record), so the APK hash is unchanged — documentation is not a build input |
| **Final server HEAD** | **`4fdd3abee47061573642aaa762f5c1ddb064b1c5`** — **deployed and verified**; `DEPLOYED_HEAD` equals it exactly |
| **Deployment** | **done, CLOUD gateway mode, first attempt.** Migration `0007` → **`0008_d6a7f1_media_metadata`** applied and verified as the database head. Backend `cloud`, `max_upload_bytes` 52,428,800, **no `logOut`**, Local Bot API not active, no `api_id`/`api_hash` stored. **Every row count identical across the deployment and across the re-arm.** Instagram untouched to the microsecond; the enabled source's next check was 212 minutes out when the clock was re-read immediately beforehand |
| **Initial-import re-arm** | **1 source re-armed**, schedule only: `next_check_at` 24 h → 15 min, counter 0 → 1, nothing else written. **Then live-verified.** The scheduler ran the re-armed check on its own at `21:20:40Z`, one second after its due time, settled `initial_import_found_nothing` again, and moved the source to `21:50:40Z` — **+30 minutes, the ladder's second rung**, where D6A7f would have written another 24 hours. The scheduling half is `live-verified`, not merely deployed. The **import itself is still outstanding** — the extractor genuinely returns no posts for that profile, which is a fact about TikTok and not about scheduling |
| Version | code 51 → **52**, name `0.14.0-d6a7f` → **`0.14.1-d6a7f1`**. The **patch** moves this time: the transport is the same transport, now saying what it was always supposed to say |
| Room schema | **17, unchanged.** No schema 18 and no new export — nothing durable was added: the validation presentation is UI/SavedState, the declaration's new fields are wire data, and the local work evidence already held `VideoUploadMetadata` before dispatch |
| Gate | **3287 Android unit tests, 0 failures, 0 errors, 0 skipped** (3246 before, all retained); **lint 0 issues**; `assembleDebug` and `assembleDebugAndroidTest` both succeed — instrumentation **compiles and was not run**. Server: **1479 passed, 4 skipped** (1413/4 at D6A7f), plus ruff format/check, mypy (124 files), `bash -n`, `release-preflight` (60 modules), `git diff --check` |
| APK | `/sdcard/Download/TelegramTopicUploader-0.14.1-d6a7f1.apk`, SHA-256 `c4b47edbdf309c1e91792fb23b70f5763ab865909239b52cabb4a4c65e0e2a89`, 16,947,804 bytes — hash verified identical to the build output, **not installed**. Every earlier APK left in place |
| Hardware | **The blocking gate is still open.** The next ordinary inline-video send must arrive with a real non-zero duration and normal presentation. `docs/D6A7F1_DEVICE_CHECKLIST.md`, nothing pre-marked. **The Local Bot API migration stays blocked until it passes.** |

### What the D6A7f device session actually established

**Proved, and not to be re-asked:**

* async source validation is live — a TikTok validation showed a running state, disabled its control,
  survived leaving the screen, and settled successfully showing the validated profile;
* the deployed D6A7e8 TikTok connector correction validates a real public profile;
* source-URL canonicalisation works on the handset;
* the D6A7f transport reaches Telegram: one video was **positively delivered**, positive message id.

**Disproved:**

* **presentation fidelity.** That video rendered as a blank white card, download icon, `0:00`, for
  ~11 MB of real content. Transport reachability and presentation fidelity are different claims and
  D6A7f proved only the first;
* a source created asking for initial history ran its first check **immediately** — six seconds — and
  found nothing, then went onto its ordinary 24-hour cadence with the history still unimported;
* validation's four states were not visually distinguishable.

### The two contracts D6A7f lost in transit

**Both were visible in committed code before this milestone opened.**

1. **The video metadata.** `TelegramMediaUploadApiGateway` attaches `duration`, `width` and `height`
   to every `sendVideo`, and its own KDoc says those three are what prevent the blank `0:00` card.
   `RemoteUploadPart` carried position, kind, filename, size, digest, caption — and nothing about the
   video. **The contract was never overridden; there was no field for it.**
2. **The transfer method.** The server had carried `as_document` since D6A7f and **no client could
   set it**, so `SEND_DOCUMENT` — chosen precisely *because* the container cannot be confidently
   identified — was re-derived from the MIME type. A `video/mp4` the application had deliberately
   declined to present as a video was presented as one. **A media kind is not a transfer method.**

The general lesson, worth carrying forward: *when a transport moves, the contracts that had nowhere
to travel fail silently and the tests keep passing, because they were asserting on the response.*

### The third defect: setup work is not a cadence

The forensics, read from the database rather than from prose: the source was created `18:45:03Z`,
its first check ran `18:45:09Z` — **six seconds**, so creation did **not** wait — and settled
`succeeded` / `success_no_new_posts` / `initial_import_found_nothing`, 0 discovered, 0 inserted,
baseline still false. `_apply_first_scan` was **correct**. Then the scheduler read
`SUCCESS_NO_NEW_POSTS`, saw a success, and applied the Daily preset: `next_check_at` moved exactly 24
hours out with the import still owed.

Every step individually right, outcome wrong — which is why the correction is in the scheduler, not
in discovery. `domain/initial_import_retry.py` is a bounded, **durable** setup ladder: 15 min, 30
min, 1 h, 2 h, 4 h, 6 h. The position is a **column**, because a counter in the process returns a
repeatedly-empty source to the shortest rung on every restart. A platform signal always outranks it —
including a strong signal on the **Story** half of a check whose feed succeeded.

### A delivered message that is not the requested shape

`DELIVERED_WRONG_SHAPE`, a state of its own on both `SendOutcome` and `LocalUploadState`. The post
exists and its ids are real, so it is **not** `RESULT_UNKNOWN` — describing a delivered message as
*possibly not sent* is the exact dishonesty this vocabulary exists to prevent. It is terminal,
**nothing resends it**, and its staged bytes are retained because an in-place `editMessageMedia` is
the only safe repair direction. Opt-in per member, so Remote Sources' own deliveries are unaffected.

### Guards re-scoped, none weakened — four, and one new

1. `AppVersionTest` — the version pin, updated as intended.
2. `D6A4SurfaceTest` pinned `RemoteBackoffReason.fromWire(state.run.outcome)`; the expression moved
   into a composable where the run is bound as `run`. Rewritten **structurally**: every `fromWire`
   feeds a label function and no `.outcome` is rendered or interpolated. It had already gone quiet
   twice on variable renames.
3. `D6A7E7BPlatformChooserTest` asserted *exactly one* `onValidate` call site. There are now two
   legitimate ones — the button and Retry. A count would have to be relaxed to 2, then 3, losing
   meaning by degrees, so it now asserts the property: **every** call site is an `onClick`/`onRetry`
   body, none reachable from `LaunchedEffect`, `onValueChange`, `DisposableEffect` or `produceState`.
4. **New, and the reason it exists:** `D6A7F1SourceStatusTest` asserts every region it slices is
   bounded and smaller than half the file, and every anchor unique. A
   `substringAfter`/`substringBefore` slice **fails open** — a renamed anchor makes the region the
   whole remainder and every `contains` keeps passing while asserting nothing.

### The test double that was lying

Worth recording as a pattern. The server's `FakeBotApi` answered **every** send method with a bare
`message_id`, a `chat` and a thread — no `photo`, no `video`, no `document`. So "Telegram confirmed
it" was provable in that suite without Telegram ever agreeing what it had posted, which is precisely
the check the server-backed transport had lost. It also never listed `sendDocument` as a send method,
so every "nothing was sent" assertion in that file was blind to the one method the restored
`as_document` contract routes to.

It now returns the shape it was asked for, and the video shape is **echoed from the request**: a
`sendVideo` supplying no duration is answered with zeros — the blank card as a real client would draw
it — so the suite fails if the server ever stops sending the three fields.

## 4a. Previous milestone: D6A7f — the phone stops being a Telegram client

### The deployment — three attempts, and what production actually did

**Deployed and verified in CLOUD gateway mode.** `SERVER_HEAD` and `DEPLOYED_HEAD` are both
`df194a011b1733741380144d337976d026ad172f`; the service reports that commit; migration head is
`0007_d6a7f_transport`; backend is `cloud` with `max_upload_bytes` 52,428,800; **no `logOut`**; the
Local Bot API service is **not running** and no `api_id`/`api_hash` is stored.

**Nothing was lost and nothing was contacted.** Devices 4/1, destinations 3/3, sources 2/1, items 71,
media 74, delivery operations 71, check runs 18, reservations 68 — identical before and after. Every
Instagram field matches to the microsecond, including `next_check_at`, `updated_at` and the check-run
count, so **no check was triggered by the deployment**, and the session connection state was not
mutated. 8099 and 8100 stay loopback-only, Funnel stays on 8443, private Serve stays on 443, the
firewall is unchanged, and there is **no Local Bot API listener at all**.

**The legacy 429 repair: examined 5, repaired 5.** Total operations unchanged at 71, so no second
operation; original attempt count, destination and chat preserved; no confirmation and no message id
fabricated; items returned to `queued`; and `retry_wait` being non-terminal, they were absent from
History while waiting (66 listed, not 71).

**Then the ordinary retry ran by itself, and the honest result is that it did not deliver.** Sixty
seconds later all five settled `failed_before_dispatch` / `download_failed` — the source media has
expired. **Nothing reached Telegram**, so no duplicate post is possible, and the five items are in
**Review** for the user. The repair corrected a *misclassification*; it never promised to make expired
media downloadable. No retry was triggered by hand.

**Three attempts, because the deployment tooling had defects the milestone's own code did not.**

1. **Refused by the Instagram maintenance window** at `16:50:45Z` — the enabled source was due
   `17:13:35Z`, 22.8 minutes. Nothing touched. The check then ran naturally at `17:13:52Z`, failed as
   its predecessors had, and moved the next check to `2026-08-08T00:32:40Z`, which opened the window.
2. **The edge served the previous route policy.** Its config is a bind-mounted template rendered by
   nginx's entrypoint *at container start*, and `docker compose up -d` leaves a running container
   alone when its image and definition are unchanged — a file's contents changing is neither. Now
   force-recreated every deployment.
3. **A location regex nginx could never parse.** `{8,64}` unquoted: nginx reads `{` in a location as
   the start of a block, so the directive ended mid-regex and the container refused to start.
   **Three separate guards had agreed with it** — each pinned the string that had been written rather
   than one nginx would accept. All three fixed, plus a general rule test, plus `nginx -t` in the
   deployment before anything restarts.

**A fourth defect, found while those failed and fixed in the same pass:** `remote-sources-ctl` had no
`verify-backup`, which the rollback calls before restoring the database. The call fell through to
`usage`, so the rollback read a good backup as unverifiable, refused to restore, and printed *the
pre-deployment backup no longer verifies* — a false reason about a command that never ran. It
survived because the rollback tests stub the wrapper with a fake that implements it. Fixed, and a
guard now asserts every operator-CLI subcommand the deployment invokes exists in the real wrapper.

Both failed attempts left the service stopped with the schema at `0007` and the previous tree
restored. `0007` is purely additive — verified directly against the live database — so the previous
release ran against it unharmed and was restarted each time. Downtime was minutes; no row was lost.

**What is still open:** the device gate. Android 51 is built and **not installed**, and the Local Bot
API migration has not begun. The >50 MB ceiling is **not** active.

### The architecture this milestone makes permanent

```
Android → authenticated public HTTPS → Remote Sources application server → one authoritative
Telegram transport (Cloud now / Local after a migration that has not happened)
```

**Android needs no Tailscale for uploads, and the Local Bot API service must never be publicly
exposed.** This supersedes the earlier D6A7f sketch in which the phone spoke to a Local Bot API
server directly over the tailnet. The phone no longer holds a Bot API endpoint at all.

### The four things it changes

**One backend authority.** `delivery/backend.py` is the only place that answers *which Bot API am I
speaking to, and what will it accept*. **There is no fallback between backends** — a silent fallback
is how the same media is posted twice. The ceilings are byte-exact and read from official source
rather than from the documented "MB": cloud **52,428,800**, local **2,097,152,000** (the constants
are `50 << 20` and `2000 << 20`; 2²⁰ was proved, not assumed). The application compiles in neither
number any more.

**A 429 is a wait, not a failure.** `OperationState.RETRY_WAIT` is durable and non-terminal, carries
Telegram's own `retry_after`, and is **absent from `/history`, because history means finished**. The
same operation is parked — same identity, same frozen destination — so no second delivery and no
second history row can appear. Pacing counters are rows, not process memory, so a restart cannot
burst through them.

**A validation is a row, not a request.** A profile extraction can take ten minutes; a phone will not
hold a request open for ten minutes, and that mismatch is exactly what the user saw as *the server
did not answer in time*. Runs are durable, one live per normalised identity, recovered after a
restart. **Nothing can cancel one** — leaving a screen is not a reason to throw away work already
being done — and a poll that fails never restarts anything, because a retry there would be a second
extractor.

**One media item, one active work surface.** A media whose routed sibling is prepared, queued,
uploading or retry-waiting is no longer *also* active Review work. `SHADOWED_BY_ACTIVE_JOB` is
temporary and reversible; it is not the durable retirement positive confirmation writes.

### Two device findings, and what became of them

* **A — a Telegram rate-limit refusal is shown as a failure.** Confirmed in production: **five**
  delivery operations were turned into false terminal failures by a 429. The repair exists —
  `remote-sources repair-rate-limited --apply`, evidence-gated, expects 5 — and **has not run**,
  because the code that implements it is not deployed. This is the first thing to do after a
  deployment.
* **B — the TikTok *Check source* that timed out.** Forensics proved **the request never reached the
  application**; the five edge 413s in the same window were the deployment's own probe. So it neither
  proves nor disproves the D6A7e8 connector correction. **Do not ask the user to press it again**
  until D6A7f is deployed and installed — the whole point of durable validation is that the answer no
  longer has to arrive inside one request.

### Guards re-scoped, none weakened — six

`D3ASurfaceTest` (the ceiling now comes from `transportCeiling.currentCeilingBytes()`),
`D3B2SurfaceTest` (a count became "every `OkHttpClient.Builder()` disables replay"), `D6A4SurfaceTest`
(classification now via `RemoteBackoffReason.fromWire`), `D6A7E7APreviewLifecycleSurfaceTest`
(renamed the transport's method rather than widening the guard), `ConfirmedReviewProjectionTest` and
`DashboardGroupingTest` (the placeholder is now shadowed *while* the sibling works, and retired only
on confirmation — a stronger assertion than the one it replaced). Each carries its reason beside it.

### Defects found by the milestone's own verification, and fixed

* The server's `record_rate_limit` accepted a JSON `true` as a seconds value, because
  `isinstance(True, int)` is true in Python.
* A confirmed upload session reported a message **count** but no message **ids**, which would have
  made every successful upload `RESULT_UNKNOWN` — the state that must never be retried. The ids now
  travel end to end.
* A non-terminal validation answer with no run id stranded the screen; it is now a malformed
  response.
* The validation run id did not survive process death while the documentation claimed it did. It now
  does — four strings in saved state, resumed before anything is drawn, and never a second start.

## 4a00000000. Previous milestone: D6A7e8 — a link that says what it is, and the URL a connector should have asked for

> **Two repositories, and both changed.** The **server** was edited, gated, deployed and verified —
> `SERVER_HEAD` and `DEPLOYED_HEAD` are both `b0ed4f04…`. The **application** gained one pure
> presentation policy and was rebuilt. **No agent contacted any platform: `LIVE_PROBES_USED=0`.**
> The one live TikTok request in this milestone's evidence is the **user's**, from the handset,
> before the milestone began. Instagram was not contacted, not validated, not checked and not
> re-scheduled. Nothing was sent to Telegram. The application was **not installed** and **not run**
> on any device or emulator.

| Field | Value |
| --- | --- |
| **Final application HEAD** | **`2bbf253530099d7aa93f3d0fc66cc7146c574f28`** — pushed. The build tree is `f9d190c0b1ac7316b9e59247899d64bdb14989ac`; the final HEAD adds a documentation-only artefact-record commit, and the hash is unchanged because documentation is not a build input |
| **Final server HEAD** | **`b0ed4f0407a089b5cf567c78a3c4f7a055197638`** — **deployed and verified**; `DEPLOYED_HEAD` equals it exactly. Code commit `b38f8ebe1d8bb33ad961cf4af0a5709621cb9f1b`, deployed first; the docs commit was redeployed so the two match |
| Version | code 49 → **50**, name `0.13.24-d6a7e7b` → **`0.13.25-d6a7e8`** |
| Room schema | **17, unchanged — no migration runs on this install.** The canonical identity value is form state: no column, not persisted, not sent as a separate field. `18.json` stays absent. Server: **`0006_session_connection`**, unchanged |
| Gate | **3187 Android unit tests across 205 suites, 0 failures, 0 errors, 0 skipped. Lint: 0 issues** (counted from the XML reports, every task `--rerun-tasks`, the whole gate re-run from the committed tree). Server: **1243 passed, 3 skipped**, plus ruff, mypy, `bash -n`, `release-preflight`, `git diff --check` |
| APK | `/sdcard/Download/TelegramTopicUploader-0.13.25-d6a7e8.apk`, SHA-256 `4ebd0498e6c5977c5db1b745e39f226b27f065861dcbd91e7fc16feccfa595b8`, 16,850,766 bytes — hash verified identical to the build output, **not installed**. Built from the tree at `f9d190c`. Every earlier APK left in place |
| Hardware | **The seventh run closed rows 193 and 194** — TikTok visible, chips wrap, selectable, form appears. **Nothing else in D6A7e7b was reported and nothing else is marked.** No line of D6A7e8 is verified: `docs/D6A7E8_DEVICE_CHECKLIST.md`, 18 items, all *not attempted*. New backlog rows **220–227**; **row 220 is the acceptance test and only the user can run it** |

### What opened it

The seventh physical run confirmed the D6A7e7b platform-chooser fix on hardware and then performed
the **first live TikTok source validation this project has ever done**. It reached TikTok and the app
displayed *the platform returned content the server could not read; the connector must be updated.*

**The sentence was correct, and the truthful mapping is the whole reason the fix was findable.** The
classification travelled unchanged and the app rendered it rather than collapsing it into a generic
error, so the next question was *which* connector and *why*.

### What shipped — the server half

The connector was asking gallery-dl for `https://www.tiktok.com/@<handle>`, which in gallery-dl
**1.32.8** routes to `TiktokUserExtractor` — a `Dispatch` that enumerates **nothing** and prints only
queue entries handing the work to its sub-extractors. `--dump-json` records a queue entry and never
descends. So a healthy profile produced queue records and zero members, and `classify_dump` refused
it as `tiktok_not_enumerated` — **by the same rule that stopped an Instagram source being baselined
at zero in D6A7b. The guard worked; the URL was wrong.**

* Discovery asks **`…/@<handle>/posts`**, the extractor that actually enumerates.
* **Not `--resolve-json`**, which is exactly how D6A7b fixed Instagram — because it resolves every
  queued sub-extractor and the first is the **avatar**, whose `id` is the *user's* numeric id in the
  same shape a post id has. It would have parsed as a post, sorted first, and become the cursor:
  the profile picture stored as the newest post. The asymmetry is written down in `CONNECTORS.md`.
* **`-o tiktok-range=1-N`**, the extractor's own listing bound, because `--range` bounds *files* and
  cannot stop pagination that happens before the first record exists. **Derived from
  `InitialImport`, never a literal** — the first draft used `12`, which would have capped a
  `last_25` import at twelve and then baselined, silently discarding the requested history.
* A photo carousel's **background track** — an `mp3` at `num: 0` carrying the post's own id — would
  have sorted ahead of every image and been delivered as a photograph. Dropped on the extractor's own
  `type` field. Newly reachable: before the URL fix no carousel had ever reached the parser.
* **`vm.`/`vt.`/`tiktok.com/t/` are refused by name.** `_strip_url` had been stripping the
  short-link host like any other spelling of the site, leaving the redirect token standing exactly
  where a username stands — and it matched. A share link silently became a **profile source for an
  account nobody had named**.

### What shipped — the application half

A pasted profile link becomes the clean canonical source URL in the field, immediately, with no
request of any kind. `RemoteSourceUrlCleaner` is one pure object with no client, no coroutine, no
`Context`, no WebView and no redirect resolution — and a test that **reads its source file** and
fails if any of those appears. The rule is not a list of parameter names but *a source identity URL
carries no query and no fragment.* It acts only on a complete `http(s)` URL on a host the selected
platform is known by, so a bare `@name`, a half-typed URL and an unknown host are left as typed.

Meaning survives and only tracking goes: Reddit's `u/` versus `r/`, a 9GAG Interest's slug and its
**explicit** feed mode — and a feed mode the user has not chosen is never invented.

### The safety argument that matters most

**Cleaning cannot become fetching.** A short link's target is knowable only by following it, and
neither the phone nor the server will. Both refuse instead, decided from the text alone, because a
component whose contract is that it never fetches must not acquire the ability to.

### Guards re-scoped, none weakened — one

`D6A7E4SurfaceTest`'s literal-anchored *only an answer about the current form may fill the name*
went **red** when the comparison widened, correctly. It was re-scoped to assert the new call, **and
a second guard added** that pins the property making the widening safe: built on `describes(...) ||`,
widened only by `RemoteSourceUrlCleaner.isSameSource`, platform and source type still exact.

### The brief's premise that production contradicted

The milestone brief said the failed validation had recorded a TikTok platform signal. **It had
not.** `platform_health` holds exactly two rows, `instagram` and `ninegag`.
`_record_validation_signal` writes only *setup-shaped* classifications and `malformed_upstream` is
not one — correctly, because a connector defect has no operator action attached and a TikTok row
reading *setup required* would send somebody to import a cookie that fixes nothing. Nothing was
erased and nothing was manufactured. **Always verify a brief's production claims read-only before
acting on them.**

## 4a0000000. Previous milestone: D6A7e7b

**D6A7e7b** — a platform that fits on the phone, a history that says when, and an icon that is
actually an icon.

> **Android only.** The server was **not** edited, not deployed, not restarted, not migrated and not
> contacted for a change; `SERVER_HEAD` and `DEPLOYED_HEAD` are both unchanged. The server audit that
> opened this milestone was **read-only**. **No platform was contacted** — not TikTok, not Instagram,
> not X, not Reddit, not 9GAG: no source created, validated, enabled, disabled or checked. No Telegram
> content was sent and no Telegram history was queried. The application was **not installed** and
> **not run** on any device or emulator.

| Field | Value |
| --- | --- |
| **Final application HEAD** | **`7ad6d2bcd615cdcae0975635ca8661766575900e`** — pushed. The build tree is `f3991ed49be4ed0e7b2d5767f3028059e1e1cdc5`; the final HEAD adds a documentation-only artefact-record commit, and the hash is unchanged because documentation is not a build input |
| **Final server HEAD** | **`c7536bf64f23b80feb92f9eac2e1e2c915c0d0fd`** — **unchanged, not redeployed, not edited, not contacted for a change.** `DEPLOYED_HEAD` equals it exactly |
| Version | code 48 → **49**, name `0.13.23-d6a7e7a` → **`0.13.24-d6a7e7b`** |
| Room schema | **17, unchanged — no migration runs on this install.** Every timestamp this milestone renders was already a column, and the History query already selected the confirmation one; only the domain projection dropped it. The Archive filters on a **computed** `DashboardGroup` — there is deliberately no `archived` column. The incremental scan reads digest, hashed-at, hashed-size, modification-time and size columns that all already exist. Server: `0006_session_connection`, unchanged |
| Gate | **3134 Android unit tests across 203 suites, 0 failures, 0 errors, 0 skipped. Lint: 0 issues** (both counted from the XML reports, every task with `--rerun-tasks`, the whole gate re-run from the committed tree). Server: **not run — the repository was not touched** |
| APK | `/sdcard/Download/TelegramTopicUploader-0.13.24-d6a7e7b.apk`, SHA-256 `e9d9cf3ab0ee33073b5d76a0071afd1317dfd76f970d4b414b9c3e45143eafa9`, 16,850,760 bytes — hash verified identical to the build output, **not installed**. Built from the tree at `f3991ed` |
| Hardware | **No line of D6A7e7b is verified.** `docs/D6A7E7B_DEVICE_CHECKLIST.md`, 71 items, all *not attempted*. New backlog rows **192–219**. Every D6A7e7a row (**179–191**) stays open — the sixth run reported a different screen and produced no evidence about any of them |

### What opened it

**The sixth physical run.** In *Remote Sources → Add source*, on the narrow Hebrew/RTL handset, the
platform chooser showed **Instagram, 9GAG, X and Reddit — and TikTok was not there at all.** Not
disabled, not greyed, not explained: absent.

**It was never a product gap.** `RemotePlatform.selectable` has contained `TIKTOK` since D6A5, the
TikTok tab exists, the TikTok profile source type exists in this build *and* in the deployed
server's own enum, the server's adapter registry lists TikTok as supported and advertises
`tiktok_profile` with no feed modes, and every TikTok label and identity hint has been in both
locales for eight milestones. The form drew the server-supplied `selectablePlatforms` as chips
inside a plain `Row` — no wrapping, no scrolling — so the fifth chip was measured past the edge of
the viewport and clipped. Under RTL that edge is the left one, which is why those four survived.

**TikTok was not contacted.** No source was created and no validation attempted, because the control
that would have started one was unreachable. Nothing about this is evidence about TikTok's
availability, its adapter or whether the deployed host can read a TikTok profile.

**And this is the second occurrence of one defect.** D6A7e5 found three of five schedule presets
unreachable behind a horizontal scroll. Same failure — a control outside the viewport — different
group, eight days later.

**Plus four product decisions**, all taken beside the report: History should say *when* a delivery
actually happened; the launcher icon renders as a blank white shape and should be a real icon; the
*Source missing* and *Cancelled / retired* Dashboard tiles are historical records and should stop
looking like current work **without deleting anything**; and the future official Instagram publisher
must be multi-account from the beginning.

### What shipped

- **One wrapping container, and no group left deciding for itself.** `RemoteChipFlow` is a `FlowRow`
  that fills its width, spaces both directions identically, declares no height, inserts no spacer,
  clips nothing and **counts nothing** — so a sixth platform wraps rather than disappearing. Seven
  groups draw through it, including the D6A7e5 schedule selector that contributed the original
  `FlowRow`. The platform tab strip keeps its own horizontal scroll and is still the only one.
- **TikTok's form was already correct and is now reachable.** One advertised source type, so no
  source-type chooser; no feed-mode chooser; a TikTok-specific identity hint; preselection from the
  tab. No cookie UI, no Cobalt UI, no credential field of any kind was added.
- **One rule about which time a delivery may claim.** `RemoteHistoryTimelinePolicy` grants a *sent
  and confirmed on Telegram* sentence only on **both** halves — the server's own `CONFIRMED` state
  **and** a renderable `confirmed_at`. A read-only server audit confirmed the semantics rather than
  assuming them: `confirmed_at` is assigned in exactly one place, the positive-confirmation
  settlement path, and is null for every other outcome — **including a `result_unknown` operation a
  human later resolved as delivered**, because that resolution is recorded against the item and never
  against the operation. `created_at` is stamped by the column default at row insert, before any
  request, and now appears only under *the send operation was created*.
- **One formatter, two History screens.** `LocalMoment` gives an exact local date and clock time from
  the platform's own locale-aware patterns, with **no timezone constant anywhere**. It replaced three
  copies of the same expression. `RenderableMoment` rejects an absent, zero or implausibly early
  epoch, so **no card can print 1 January 1970** and an omitted moment produces no text.
- **Remote History Details**, read-only, carrying only already-loaded facts, each under its own
  label, with two times under two labels and **no operation, item, source, destination, chat, thread
  or message identifier**. The message count is shown; the message ids are not. Expanding fetches
  nothing.
- **`RemoteDeliveryFailureCode`** matches the thirteen literals the server's sender and settlement
  paths author, one translated sentence each; an unrecognised value names itself as unrecognised and
  the stored string is never printed.
- **"Sent to X" stopped being said about deliveries that were not sent.** A confirmed row keeps it;
  every other row names the destination it was *aimed at*.
- **Local History carries the real confirmation moment**, gated once at the entity mapping on the
  whole positive pair (message id > 0 **and** a stamp), so half-evidence can never render as proof.
  Dispatch-start and operation-ended joined the Details block that already existed, each under its
  own name. **No migration** — every column already existed.
- **Remote Review** states the platform's own publish time and the server's discovery time as two
  separate sentences, the first omitted when the platform's metadata carried none.
- **A real launcher icon** — adaptive, opaque blue field, white play-and-arrow mark, monochrome layer
  for themed launchers, and a self-contained vector for the Android 6/7 devices `minSdk 23` covers.
  Every drawn point is inside the mask's guaranteed safe circle. No downloaded artwork, no borrowed
  logo, no text.
- **An Archive that hides nothing durable.** `HistoryMode` splits `HISTORY_GROUPS` **by
  subtraction**, so the halves are provably disjoint and provably exhaustive. The two groups lost
  their tiles and gained one compact entry, hidden at zero. Nothing folded, rewritten, copied,
  flagged or deleted; opening it performs no scan, upload, deletion or repair.
- **An incremental launch scan.** `ScanEvidenceReusePolicy` grants reuse only on a full conjunction:
  same owning tree, same authority and document id, same media kind, complete canonical digest with a
  complete hashing record, internally consistent stored evidence, and size and modification time both
  known, both non-zero and both exactly equal. A display name is **not an input**. No sampling, no
  prefix hash, no *probably unchanged*. A previously-missing row is always re-read.

### The safety argument that matters most

**Missing-file detection is untouched, structurally rather than by promise.** The presence marker
`lastSeenScanRunId` is written by `persistDiscovery` — **before any stream is opened** — so a
document that skips its hash has already been recorded as seen by this run. Only an exhaustive
completed traversal may still infer absence, and nothing on the fast path can clear the coverage
flag or change the outcome classification. A reused document is finalized through the *same* call
the hashed path uses, so routing, duplicate reservation, the already-confirmed guard, the ignore
re-judgement and every counter behave identically. `hashedAt` carries the moment the digest was
genuinely computed, so the column keeps meaning *when the bytes were read*.

### Three guards re-scoped, none weakened

D6A7e5's "the schedule selector wraps" now asserts it delegates to the shared container, with a
second test proving that container is a real `FlowRow` that never scrolls and fixes no height.
D6A7e's "a local moment is formatted for the device" now reads the shared formatter and bans
hand-rolled formatting across all three files that render one. `DashboardTilesTest` now pins six
tiles, and a new test asserts both archived groups are absent from the work grid **and** still
present in the model and in `HISTORY_GROUPS`. Each would have gone silently vacuous if left matching
its old literal. **D6A7e7a's exact-version pin became a floor**, for the same reason D4A's did.

### The Instagram publisher, recorded and not built

Rows 213–219 record it as **multi-account from day one**: `InstagramPublisherAccount` keyed by an
opaque internal id and never a username; independent authorization, disconnection and
reauthorization; a chosen default; a target account **frozen onto a publication at queue or schedule
time**, never redirected and never automatically retried onto another; per-account history keeping
its frozen safe label after a rename or disconnection; duplicate protection scoped to the exact
target account; a personal account Meta cannot publish to represented as **unsupported**. Tokens,
app secrets and refresh secrets never reach Android.

None of it is implemented. **Meta was not contacted and no credential was configured.** The existing
local `ACTION_SEND` route is untouched and still proves no publication. **An Instagram viewing
session and an Instagram publishing authorization are separate concerns and neither may substitute
for the other** — the first exists and is currently disconnected (row 130), the second does not exist
at all.

## 4a000000. Previous milestone: D6A7e7a

**D6A7e7a** — a recovery that knows which process it is in, an answer that outranks a guess, and a
send that says how it ended.

> **Android only.** The server was **not** edited, not deployed, not restarted and not contacted for
> a change; `SERVER_HEAD` and `DEPLOYED_HEAD` are both unchanged. **Instagram was not contacted**: no
> validation, no check, no operator probe; no credential replaced or cleared; no source enabled or
> disabled. No Telegram content was sent. The application was **not installed** and **not run** on
> any device or emulator.

| Field | Value |
| --- | --- |
| **Final application HEAD** | **`c1cc465f873dd6b1d034de2d7d28ca03116a366f`** — pushed. The build tree is `19b6ee4`; the final HEAD adds a documentation-only artefact-record commit, and the hash is unchanged because documentation is not a build input |
| **Final server HEAD** | **`c7536bf64f23b80feb92f9eac2e1e2c915c0d0fd`** (`c7536bf`) — **unchanged**, and equal to `DEPLOYED_HEAD` |
| Version | code 47 → **48**, name `0.13.22-d6a7e7` → **`0.13.23-d6a7e7a`** |
| Room schema | **17, unchanged — no migration runs on this install.** Process-start ownership is runtime orchestration; the dispatch error vocabulary was already text in `lastErrorCode`; the same-attempt confirmation writes columns that already exist; and the last-send summary is a presentation aggregate in its own `last_send_summary` preference file. `18.json` is pinned absent by `D6A7E7ASurfaceTest` |
| Gate | **2986 Android unit tests, 0 failures, 0 errors, 0 skipped; lint 0 issues** — counted from the XML reports, every task `--rerun-tasks`, the whole gate re-run from the committed tree. Server: **not run — the repository was not touched** |
| APK | `/sdcard/Download/TelegramTopicUploader-0.13.23-d6a7e7a.apk`, SHA-256 `2c0912cbc9d72ba10b79eb47ecbf8cb92de544fe21a2c9522f64a9962556f1e5`, 16,795,676 bytes — hash verified identical, **not installed** |
| Hardware | **No line of D6A7e7a is verified.** `docs/D6A7E7A_DEVICE_CHECKLIST.md`, 46 items, all *not attempted*. New rows **179–191**. D6A7e7's rows **171–172 closed on the user's report**; **168–170, 173–178 and 143–167 all stay open on their own line-by-line evidence** |

### What the fifth device run reported

**The public transport works.** Installed over the existing data, the handset reports that the secure
public transport connection works, the authenticated public connection test succeeds, Public HTTPS is
selected and displayed as verified, and ordinary Remote Sources access works **with Tailscale off on
the phone**. Specific positive evidence for the probe and the selected transport — and for nothing
else.

**And a local upload became uncertain, every time.** A media upload to Telegram moved to *requires
review* whenever the user left Preview or the application while it ran and came back, with the
application saying it did not know whether Telegram had received the file. The user was explicit that
the upload itself continued and appeared to finish. **Not a cancelled request**, and **not
attributable to Tailscale or the transport** — the local upload path never used a Remote Sources
endpoint.

### What it is

**Process start is not Activity start, and that was the defect.** Every operation only valid after a
real process death ran from `MainViewModel.init`, which Android runs whenever it builds an Activity.
Recovery now has one owner invoked from `Application.onCreate`, once per operating-system process,
and its entitlement is structural: a brand-new process cannot hold the media-operation slot, the
registered transfer, or the runner that held them. It checks anyway, because Android creates a
process for a service too.

**The repair a screen can reach keeps every evidence repair and has lost claim reconciliation.**
D6A7a's reachability is kept — only the owner changed. Settling an abandoned dispatch now requires a
stated `DispatchRecoveryAuthority` and a `LiveTransferSnapshot`; a caller that cannot prove
abandonment changes nothing and reports `ACTIVE_OWNER_PRESENT` or `ABANDONMENT_NOT_PROVEN`.

**Positive Telegram evidence outranks a local uncertainty, for the same attempt.** The coordinator
captures a returned message id at the statement that produces it, so a cancellation unwinding a
moment later cannot throw the proof away; and `confirmSameAttemptAfterUnknown` corrects an
already-uncertain row when that same attempt's answer arrives afterwards. **Not a retry**: no second
request, no second attempt, nothing asked of Telegram about what it holds, and the audit survives.

**A cancellation names its own origin**, and Android stopping the execution owner stores
`EXECUTION_OWNER_STOPPED` rather than sharing `PROCESS_INTERRUPTED` with a worker that vanished.
**No screen scope owns a transfer** — bulk *Send selected* was the last one and now hands each job to
the durable chain. **A durable last-send summary** — a timestamp, six counts and two closed states in
its own private preference file, written only after each durable outcome commits, dismissible, with
authority over nothing.

**Every uncertain-outcome write attempt is traced**, refusals included, in a closed vocabulary with
no field a job id, attempt id, owner token, file name, URI, hash, destination, Telegram identifier or
exception text could travel in. That trace is what will name the exact writer on the next device run;
this milestone deliberately does **not** claim to know in advance which of the two fired.

### The rules worth carrying forward

- **Process start is not Activity start.** A ViewModel is built whenever Android builds an Activity,
  so anything that is only valid after a real process death does not belong there. `Application.onCreate`
  is the one callback that runs once per process, and the entitlement it confers is structural rather
  than procedural.
- **A repair reachable from a gesture may not decide the fate of a live transfer.** Reachability and
  authority are separate questions, and D6A7a answered only the first one.
- **A proof, never a timeout.** A longer lease makes a wrong answer rarer and leaves it possible, and
  for "did Telegram get my video" that is not an improvement worth having.
- **Evidence outranks the absence of evidence, for the same attempt.** State the precedence once,
  where it can be read, instead of leaving it implicit in a dozen `WHERE` clauses.
- **Capture an answer where it arrives, not where you intend to use it.** `coroutineScope` discards
  its result when its own job dies; the message id had to be recorded at the gateway's return
  statement or it was gone.
- **A recorded outcome and a rendered one are different things.** The chain's settled events were
  always transient and always correct to be; what was missing was anybody writing the fact down for
  a person who was elsewhere.
- **Re-scope a guard, never delete it.** Four went: D6A7a's claim-reconciliation assertion was
  *inverted* and its positive half moved to the new owner; D2B2B's exact method set gained and lost
  a name with a note saying where; D4B's "one upload engine" was re-pointed at the chain and
  strengthened; D6A7e7's exact version pin became a floor.
- **A guard can go vacuous mechanically, not only by anchoring.** Two of this milestone's own new
  guards did: one had not accounted for the Compose compiler's synthetic `${'$'}stable` field, and one
  filtered paths on `/src/main/` against paths that have no leading slash and therefore matched an
  empty set.

## 4a00000. Previous milestone: D6A7e7

**D6A7e7** — a public edge that forwards almost nothing, an endpoint the phone derives instead of
typing, and a marker it demands before trusting.

> **Both repositories moved.** The server was changed, **deployed and verified**, and a restricted
> public edge is **live**. **Instagram was not contacted**: no validation, no check, no operator
> probe; no credential replaced or cleared; no source enabled or disabled. No Telegram content was
> sent. No authenticated mutation was performed during the deployment. The application was **not
> installed** and **not run** on any device or emulator.

| Field | Value |
| --- | --- |
| **Final application HEAD** | **`2d54c1d739500ff2aeb308a8e739e3212b405fc0`** — pushed. The build tree is `cbbcaa4`; the final HEAD adds a documentation-only artefact-record commit, and the hash is unchanged because documentation is not a build input |
| **Final server HEAD** | **`c7536bf64f23b80feb92f9eac2e1e2c915c0d0fd`** — **changed, deployed and verified**, from `eaeba83`. `DEPLOYED_HEAD` equals it exactly |
| Version | code 46 → **47**, name `0.13.21-d6a7e6a` → **`0.13.22-d6a7e7`** |
| Room schema | **17, unchanged — no migration runs on this install.** Server: `0006_session_connection`, unchanged — none was needed and none was written |
| Gate | **2892 Android unit tests, 0 failures, 0 errors, 0 skipped; lint 0 issues** — counted from the XML reports, every task `--rerun-tasks`, the whole gate re-run from the committed tree. Server: **1202 passed, 3 skipped** (1205 collected) |
| APK | `/sdcard/Download/TelegramTopicUploader-0.13.22-d6a7e7.apk`, SHA-256 `bb52ee932de6b511913dc5360061470dceb08dc1316206dad9ee544a816bfa31`, 16,737,706 bytes — hash verified identical, **not installed** |
| Hardware | **Nothing verified.** `docs/D6A7E7_DEVICE_CHECKLIST.md`, all items *not attempted*. New rows **168–178**; rows **143–167 stay open line by line** and nothing is closed by this milestone |

### What it is

Roadmap item 3, which the user approved: replace the phone's Tailscale dependency with a securely
authenticated public HTTPS path, **retaining Tailscale on the VPS** for administration, recovery
and any future private pairing. Not a device report — the server half was built, gated, deployed
and verified first, and the Android half followed against a live public edge.

**The topology.** Private: Tailscale Serve, HTTPS 443, tailnet-only, straight to the loopback API —
and pairing lives there and only there. Public: Tailscale Funnel, HTTPS 8443, into a **stateless
nginx edge** on host loopback 8100 (immutable digest, read-only rootfs, no capabilities, no
database, no credential) which forwards only `/api/v1/*` over the internal compose network.
Neither 8099 nor 8100 is published beyond loopback, the firewall opens none of 8099/8100/8443,
tailscaled is the only process presenting a public port, and Funnel on 443 is forbidden and
verified absent.

**The Funnel URL is treated as fully public and discoverable.** Pairing, readiness, health, the
OpenAPI document and every unknown path answer one fixed 404, byte-identical to each other. A
plausible bearer header is required before anything is forwarded; client forwarding identity and
`Cookie` are stripped; one fixed marker is injected; there is **no access log at all**; every
response carries `X-Remote-Sources-Ingress: public-v1` and a closed security-header set. The same
contract is repeated in-process so an edge regression fails **closed**. Two invariants: a public
client without a valid active device token can neither read nor mutate any application state, and
**public ingress can never mint a device token**.

**On the phone**, the public endpoint is **derived** from the endpoint the user already proved by
pairing — same hostname, HTTPS, port 8443, nothing else — and no code path accepts a typed one. It
is saved only after an authenticated probe of `GET /api/v1/device` returns 200 with the exact
marker and a device-shaped body; redirects are disabled outright so a bearer token cannot cross an
origin. Proving and switching are two decisions, and the second is the user's. A public selection
with no proven endpoint refuses rather than falling back. **Pairing and recovery stay private-only.**

### The rules worth carrying forward

- **A public URL is not a secret, so nothing may be load-bearing on it.** Design as if the hostname
  is known, because it is discoverable.
- **Two lines of defence, because a configuration file is a place a policy can regress.** A marker
  that only ever *restricts* is safe to trust without knowing the peer.
- **Absence cannot be misconfigured.** No access log at all beats a carefully-formatted one.
- **A refusal that maps the routes is a leak.** Every blocked public path answers the same bytes.
- **Derive what the user already proved; never ask them to retype it.**
- **Prove, then switch — never in one step.**
- **Two endpoints that differ only by port need a discriminator that is the port.** The
  "check Tailscale" hint was keyed on host shape and would have fired for a *public* failure,
  sending the user to look at a VPN they had deliberately turned off.
- **A guard sliced on a comment anchor can go vacuous.** Three of this milestone's own new guards
  did: the source is comment-stripped before matching, so a `// -- section` anchor sliced to
  end-of-file and the assertion silently widened. Anchor on code.
- **Verify the network premises read-only before deploying, not during.**

### The user-approved roadmap, as it now stands

1. Reconnect the dedicated Instagram viewing session — **done before this milestone** by the
   approved operator flow; the session reads `connected` and the backoff window has expired.
2. Configure Reddit OAuth and validate one disposable source — **deferred by the user**: the
   current app-registration process requires approval.
3. Replace the phone's Tailscale dependency with a securely authenticated HTTPS access path —
   **delivered by D6A7e7 on both sides, device-unverified.** Pairing and recovery are deliberately
   *not* replaced and never will be.
4. Validate/configure TikTok and X — still open.
5. Handle 9GAG separately — the deployed host still receives an anti-bot challenge.

## 4a0000. Previous milestone: D6A7e6a

See §4's predecessor below and the detailed record in `cc-latest.md`.

## 4a000. Previous milestone: D6A7e6

**D6A7e6** — a corrective milestone opened by the third physical run: a tap that starts its own
service, a confirmed item that leaves Review, and a preview that can stage what it cannot seek.

> **Application only.** The server repository was **not edited and not deployed**; its HEAD and the
> deployed HEAD both remain `eaeba836650f67245b0bd8265b46f6e03d2cd29d`. **Instagram was not
> contacted.** No Telegram content was sent. The application was **not installed** and **not run**
> on any device or emulator.

| Field | Value |
| --- | --- |
| **Final application HEAD** | **`dbead271995ea3cd9b414b85ad0542d414d9e1f8`** — pushed. The build tree is `bc38827`; the final HEAD adds a documentation-only artefact-record commit, and the hash is unchanged because documentation is not a build input |
| **Final server HEAD** | **`eaeba836650f67245b0bd8265b46f6e03d2cd29d`** — unchanged |
| Version | code 44 → **45**, name `0.13.19-d6a7e5` → **`0.13.20-d6a7e6`** |
| Room schema | **17, unchanged — no migration runs on this install.** Server: `0006_session_connection`, unchanged |
| Gate | **2805 Android unit tests, 0 failures, 0 errors, 0 skipped; lint 0 issues** — counted from the XML reports, every task `--rerun-tasks`, the whole gate re-run from the committed tree |
| APK | `/sdcard/Download/TelegramTopicUploader-0.13.20-d6a7e6.apk`, SHA-256 `9fe6bcb6f07c8179af1ebfe565901520492278d12a37d26929f691fd2a86e13c`, 16,683,920 bytes — hash verified identical, **not installed** |
| Hardware | **Nothing verified.** `docs/D6A7E6_DEVICE_CHECKLIST.md`, 42 items, all *not attempted*. Backlog rows **143–149 failed on hardware at D6A7e5 and are re-opened**; row **150** stays open and is now **non-blocking**; new rows **151–161** |

### The four findings the third run produced, and the limit of what may be claimed

D6A7e5 was installed **over the existing application data** and used.

1. **Send now still did not start an upload.** The exact visible sentence was *הבקשה נרשמה. ממתין
   ש־Android יפעיל את ההעלאה.* — no moving byte progress, no Telegram post, the item stayed
   waiting. **A D6A7e5 hardware failure**: rows 143–149 are *not* completed. **Why the platform
   never entered its UIDT JobService is still not established** (row 150) — D6A7e6's answer is to
   make the question non-blocking, not to answer it.
2. **A Telegram-confirmed file remained in active Review, offering pre-upload actions it could only
   refuse** — pressing *Do not upload this* explained that Telegram had already confirmed the file.
   Traced in the durable rows: a per-job projection served the media's evidence-free
   `AWAITING_ROUTING` placeholder as routing work, the durable retirement ran only on startup and
   other screens' refreshes, and the per-media ignore refused after the tap instead of before it.
3. **Some Review cards showed אין תמונת פתיחה while siblings had thumbnails** — a per-media
   failure: one `getFrameAtTime(0)` was the entire strategy and the sentence also showed while
   still loading.
4. **Preview said לא הצלחנו לקרוא את הקובץ הזה לצורך נגינה for a file the upload path could
   carry** — the player needs a seekable descriptor, the upload reads a one-pass stream, and
   *readable but not seekable* had no path at all.

### What it built

- **Send now means queue and start.** From the visible tap: **persist → start the `dataSync`
  foreground service immediately → schedule the UIDT job as backup**. The six-second watchdog is
  the verifier now, no longer the first mover; both owners share one repository, runner, durable
  lease, launcher and notification; a refused start is its exact closed category with a corrective
  *resume the send queue* action; the scheduler can no longer reach the service and `cancelPending`
  no longer stops it.
- **No user-facing "request recorded" state.** The condition vocabulary collapsed to the send
  queue's language in both locales — *נוסף לתור השליחה*, *בתור לשליחה — מקום n*, *מתחיל העלאה…*,
  *מעלה n מתוך m*, the exact refusals — and the forbidden sentences are pinned absent from every
  string value by `D6A7E6SurfaceTest`. A queued-or-active row never re-offers its Send-now button.
- **The diagnostics panel** — *פרטי אבחון*, collapsed under the send-queue card: which owner
  entered, ownership, launcher, registration, bytes, the last recorded step with elapsed time, and
  the last durable refusal. Closed members only; the foreground service records its own
  `FOREGROUND_SERVICE_ENTERED` so the panel can finally say *which* owner arrived.
- **Confirmed media leaves active Review reactively.** Both canonical projections carry a
  sibling-confirmation `EXISTS`; the one classifier retires an evidence-free placeholder for
  confirmed media into the same group the durable repair writes, so the row leaves the grid the
  moment the confirmation commits. The ignore gate is media-level and the control disappears
  before it could be refused; Preview over confirmed media shows the confirmation instead of
  pre-upload controls; a genuinely distinct unresolved job stays actionable under its own id.
- **Confirmed local deletion from History.** *מחקו את העותק המקומי לצמיתות* on the confirmed
  KEEP-policy row, through the confirmed-source engine only — evidence demanded, exact SAF document
  re-proved, no network, no resend — with *נסו שוב למחוק את העותק המקומי* after a failure.
- **One shared seekable preview source.** Provider thumbnail → direct-descriptor frames at a
  bounded deterministic ladder → one bounded private staged copy for the readable-but-unseekable
  case (256 MiB/512 MiB/64 MiB margin/2 concurrent, opaque evidence-bearing keys, byte-count
  verification, `.part` cleanup). Playback retries **once** from the staged copy under the
  unchanged D6A7e3 rules; thumbnail failures classify into ten categories with a bounded retry;
  one media viewport with the poster inside it. **The preview cache is never upload evidence** —
  pinned structurally in both directions.

### The rules worth carrying forward

- **A user's verb is the contract.** *Send now* is a promise to queue and start, not to ask a
  platform; every internal stage that leaks into a sentence will eventually stand over a dead
  queue looking like success.
- **A fallback that arrives through a deadline is still a fallback.** The third run proved the
  deadline path can fail exactly like the primary; the primary had to become the thing the tap
  itself does.
- **Per-row projections need per-media evidence** wherever the *decision* is per-media — or the
  control outlives the decision and can only refuse.
- **A control must disappear before it can be refused**, not fail after being pressed.
- **Presentation readability and upload readability are different capabilities** — bridge them
  with a bounded private copy for presentation only, and pin the two worlds apart structurally.
- **Re-scope a guard, never delete it.** Every D6A7e5 guard the renames turned red was re-pointed
  at the new exact contract with its reason in the file; the platform-surface exemption list is
  still exactly one file.

## 4a00. Previous milestone: D6A7e5

**D6A7e5** — a corrective milestone opened by the first physical run of D6A7e4: a chain Android owns,
a deletion that explains itself, and five presets you can reach — **extended mid-milestone by a
sixth device finding**, that an accepted schedule was being presented as started execution.

> **Application only.** The server repository was **not edited and not deployed**; its HEAD and the
> deployed HEAD both remain `eaeba836650f67245b0bd8265b46f6e03d2cd29d`. **Instagram was not
> contacted**: no validation, no check, no operator probe; no credential replaced or cleared; no
> source enabled or disabled. No Telegram content was sent. The application was **not installed** and
> **not run** on any device or emulator.

| Field | Value |
| --- | --- |
| **Final application HEAD** | **`79db54e4a1b87ba689e772cc9f7652793b2a5ec4`** — pushed |
| **Final server HEAD** | **`eaeba836650f67245b0bd8265b46f6e03d2cd29d`** — unchanged |
| Version | code 43 → **44**, name `0.13.18-d6a7e4` → **`0.13.19-d6a7e5`** |
| Room schema | **16 → 17**, one additive table, no row rewritten, no destructive fallback |
| Gate | **2717 Android unit tests, 0 failures, 0 errors, 0 skipped; lint 0 issues** — counted from the XML reports, every task `--rerun-tasks`, re-run in full after the last edit |
| APK | `/sdcard/Download/TelegramTopicUploader-0.13.19-d6a7e5.apk`, SHA-256 `8584e73d09815af5f4baae64f5d2fa38d36c7c3e86241e613316e141bc722ccb` — hash verified identical, **not installed** |
| Hardware | **Nothing verified.** `docs/D6A7E5_DEVICE_CHECKLIST.md`, **50 lines** (lines 36–50 are the second device report’s hardware checks, to be done first), all *not attempted* |

### The five findings the handset produced, and the limit of what may be claimed

D6A7e4 was installed **over the existing application data** and used.

1. **The explicit Send now FIFO did not reliably continue when the user switched to another Android
   application.** **Do not state a cause.** It is not established whether the active transfer stopped,
   whether it completed and the next request never started, whether the process was suspended, or
   whether the process was killed and later reconciled.
2. **Two positively uploaded videos remained on the device.** **Do not say the storage provider
   refused deletion.** Which of the general retention categories applies is a question about the
   durable rows on that handset — and the application can now answer it per row.
3. **The Instagram viewing session is currently rejected** — see §4a below. Not this milestone's to
   close.
4. **Only two of five schedule presets were visibly reachable** on the narrow RTL screen.
5. **A nearly screen-high empty vertical block** in the expanded source editor.

**A sixth finding arrived against D6A7e5's own build and was integrated into the same milestone,
not deferred.**

6. **An accepted scheduling request was being presented too close to actual execution.** Pressing
   *Send now* showed a message meaning *a request was sent to Android to upload in the background*.
   Then: no upload began, no byte progress appeared, no Telegram post was created. Further taps added
   further durable requests — the FIFO grew correctly — and **no runner ever drained it**.

   **The application-level root cause IS established, and may be stated:** *acceptance was a terminal
   state*. Three omissions, all in this repository. (a) A `startDeadlineAt` was written and **nothing
   ever consumed it**. (b) `MainViewModel` computed an `ExplicitSendChainStatus` that **no composable
   read**, so the one state that most needed a screen was the one state no screen could show. (c) On
   Android 14+ there was **no second execution owner** — the UIDT job was treated as the only path
   rather than the preferred one, so "the job never entered" had no next move. The only remedy that
   existed was a manual *Start now* the user had no reason to know about.

   **Do not state why the platform did not enter the job.** A network constraint the device could not
   satisfy, an OEM background policy, a platform-side start refusal — all remain candidates and none
   is asserted. That is durable backlog row **150**, and the diagnostic trail exists to answer it from
   the device.

**None of the six is marked fixed by a test run.**

### What it built

**An Android platform execution owner for the explicit-send chain.** A dedicated user-initiated data
transfer `JobService` on its **own** fixed job id for Android 14+, and one narrowly scoped
data-transfer foreground service below it — WorkManager was preferred by the instruction and is not a
dependency here and cannot be resolved offline, so the fallback and its two install-time permissions
are documented in the manifest. No boot receiver, no wake lock, no alarm, no new exported component,
and no second upload engine.

**One durable runner lease** in a new single-row table, taken by one guarded `UPDATE`, so a foreground
start, the JobService, the fallback service and restart recovery cannot both drain the chain. The tap
is persisted **before** the platform is asked; an accepted-but-never-entered job becomes a bounded
state with *Start now* on it; returning to the app reads the durable chain and needs no second tap.
One progress notification with *Cancel current upload* and *Cancel the rest*, neither carrying an
identifier.

**A deletion audit that produced two repairs**: an idempotent reconciliation for confirmed
delete-policy uploads whose task was never written (the confirming transaction's insert is
best-effort by design), and one centralized wake so a blocker *ending* is itself the trigger. Plus one
pure classifier so History says exactly one truthful sentence — including *repair pending*, where it
used to say *Source kept*.

**One shared wrapping schedule selector** for Add and Edit with all five presets visible, and a
rejected Instagram session that states its own repair.

**For finding 6: four stages, a bounded deadline that something owns, and a trace.** Four ordered
stages — `REQUEST_RECORDED`, `PLATFORM_SCHEDULE_ACCEPTED`, `RUNNER_ENTERED_AND_OWNS_CHAIN`,
`MEDIA_UPLOAD_STARTED` — with `mayClaimUploading` true for the last and no other, enforced on the type
and guarded in both locales. A **six-second** start deadline (not the old two minutes: it now triggers
a foreground-service start, and Android only permits one while the app still qualifies) armed by
acceptance and owned by `ExplicitSendStartWatchdog`. Within it exactly one of three things happens —
the UIDT JobService enters and takes the lease, the immediate foreground-capable fallback is started
while the visible tap still qualifies and takes the lease, or an **exact** sanitized refusal is
recorded with a corrective *Start now* beside it on the Queue card **and** on the owning row. **Never
a fourth case, and never a second tap.** The same `dataSync` service is now the fallback on Android
14+ too; it and a late UIDT job compete for the one guarded `UPDATE`, and the loser sends nothing.
Plus a closed-vocabulary `ExplicitSendDiagnosticEvent` trail across the whole path — request,
schedule, pending, entry, notification, ownership, launcher, registration, first byte, settlement,
stop — sanitized *by construction*: the recorder's one method takes an enum member and there is no
overload that could take a string, an id or a throwable.

**One real defect found while building it:** a runner that *lost* the ownership race used to cancel
the chain's notification on its way out. One chain correctly has one notification id, so a loser could
tear down the **winner's** required progress notification and leave a genuine transfer running
invisibly and unstoppably. A loser now detaches and leaves it alone.

### The durable backlog, reconciled

Row **124** (five schedule presets on hardware) **failed** at D6A7e4 and is re-opened; row **125** was
untestable while it did. Row **130** (the Instagram viewing session) is confirmed rejected from a
second, stronger source. Rows **111–119** and the remaining D6A7e4 rows stay device-unverified.
Twenty rows were added, each naming the evidence that would close it — including three that say what
they cannot say: **137**, the two previously undeleted videos, whose retention category is
*unestablished* and must be reported as the exact on-screen sentence; **141**, the empty layout
block, which is *traced, not proven fixed*; and **150**, *why Android accepted the explicit-send job
and never entered its JobService on this handset*, which is **unknown**, is not claimed anywhere, and
cannot be closed from this repository at all. Rows **143–149** are the second device report's
hardware checks. The table is in the application's `TODO.md`.

### The rules those produced, which outlive the milestone

- **`ApplicationScope` is not background execution.** It says which object owns the work *inside* the
  process and nothing about whether Android will keep the process running. An explicit user-authorized
  transfer chain needs a **platform** execution owner. Every comment implying otherwise was corrected.
- **Ownership settles a race; cancellation timing never does.** A pending platform job already on its
  way in passes straight through a cancel. One guarded durable `UPDATE` has no window.
- **Acceptance is not a start**, and the two must be recorded separately or a stuck chain looks busy.
- **A deadline nobody consumes is not a deadline**, and a status nothing renders is not a status.
  D6A7e5's first build had both, and the chain still sat accepted for ever. Every bounded window needs
  a named component whose job is to come back and look, and every state that can go wrong needs a
  surface that shows it. This is the sharpest rule the milestone produced.
- **One primary owner plus no fallback is a design that fails silently.** Preferring the platform path
  is right; treating it as the only possible path is what turns "it did not arrive" into nothing at
  all.
- **A loser must cost the winner nothing.** Losing a race is normal and safe; tearing down the
  winner's notification on the way out is not.
- **Persist the user's tap before asking the platform**, so no scheduling outcome can lose it.
- **The absence of a row is not a decision.** A missing deletion task is *repair pending*, never
  *kept by policy*.
- **A blocker ending is a trigger.** Waiting for an unrelated future upload, or a restart, is not a
  schedule.
- **Re-scope a guard, never delete it.** ~40 pre-existing static guards went red; all were re-scoped
  to exact new values behind one **named exemption list of one file**, which a new test holds to one
  file. Two slices that had silently widened were tightened.
- **A control off the end of an invisible scroll does not exist.**
- **Trace a measurement defect before changing it, and report what the trace did *not* prove.**

## 4a0. Previous milestone: D6A7e4

**D6A7e4** — a name the validation already had, two cadences nobody could choose, and a list that
admits what is wrong.

> **Three approved product changes plus one owed correction.** The server was changed, deployed and
> verified. **Instagram was not contacted**: no validation, no check and no operator probe was run,
> and no credential was replaced or re-validated. No Telegram content was sent. No source was
> enabled or disabled.

### What it built

**1. The source name comes from the validation that already ran.** `POST /sources/validate` returns
`suggested_display_name` and `suggested_name_from_platform` on a **successful** validation only,
composed from the one platform call it already makes. The order is a trusted platform-returned
display name, then the platform's canonical handle, then the normalised identity — **never** the raw
text the request carried, which normalisation may have changed or refused. **No second request.**

**2. Five schedule presets.** `attentive` 2 h, `normal` 4 h, `relaxed` 8 h, **`slow` 12 h**,
**`daily` 24 h**. The three existing wire values are unchanged. No deployed source was moved.

**3. Platform tabs and one deterministic order** on Remote Sources — All, Instagram, TikTok, X,
9GAG, Reddit, each with its source count, plus *Other* only when an unknown-platform source exists.

**4. The server's D6A7e2 test-count records corrected** to 1071 passed / 3 skipped. Durable backlog
row 120 is closed.

### The rules those produced, which outlive the milestone

- **A suggested name is a suggestion, never an instruction.** The form field carries *who last filled
  it* — empty, automatic, or manual — and a manual value is never overwritten by anything automatic.
  Both failures are silent, which is why this is a typed value with its own tests rather than a
  convention: an automatic name that refuses to update leaves the previous account's name above a new
  identity, and one that overwrites eats what somebody typed.
- **Guard a late answer twice.** Two validations can be in flight and the network does not promise
  order. The ViewModel discards a superseded response by ticket; independently the published state
  carries the platform, identity and source type it was asked about, and the form applies only an
  answer that describes what it is currently showing.
- **A suggestion is composed from the request that already happened.** Never add a platform request
  for a display string.
- **The base interval is a base.** The app derives no next-check time from a preset — a static guard
  asserts `approximateHours` appears nowhere in the screen's code. `next_check_at` is the only number
  presented as an answer.
- **The 24-hour scheduler cap is why Daily is bounded.** It predates the presets and is applied after
  jitter and after the ×3 dormancy multiplier, so Daily sits *at* the cap: dormancy cannot lengthen
  it and its jitter is one-sided (roughly 21–24 h). Documented rather than adjusted; the cap is the
  older and stronger rule.
- **A tab is a projection, not a query.** Selecting one makes no request, changes no source and
  creates no check run — asserted by a guard over `selectSourceTab`'s body, so a per-tab request
  cannot be added later without failing a test.
- **An unknown platform gets an *Other* tab or it disappears.** And if it disappears, the All count
  stops equalling the sum of the others — the symptom nobody can explain. *Other* exists only when
  such a source does, so there is no speculative empty tab.
- **Sort in one place.** Checking, then waiting on a person, then enabled by nearest next check, then
  enabled with no time yet, then disabled; ties by a locale-aware case-insensitive `Collator`, then
  by a stable id nobody sees. **The exclusions matter as much:** a rate limit is not attention because
  waiting *is* the action, one failure is not (three in a row is), and a successful check that found
  nothing is not an error.
- **Re-scope a guard, never delete it.** Four pre-existing guards went red; all four were re-scoped
  and none loosened. A guard that goes vacuous is worse than one that goes red.

| Field | Value |
| --- | --- |
| App version | code **43**, `0.13.18-d6a7e4` |
| App HEAD | `989f4270bfa86018c3a695bc2a1f9c12fec43f5c` |
| Server HEAD | `eaeba836650f67245b0bd8265b46f6e03d2cd29d` — **changed and deployed**, from `478323c1ea6ec61a708b59b6b0b5621e7ecdb876` |
| Room schema | **16, unchanged — no migration runs.** Server: `0006_session_connection`, **unchanged; none was needed and none was written** |
| App unit tests | **2607, 0 failures, 0 errors, 0 skipped. Lint: 0 issues**, both counted from the XML reports with `--rerun-tasks` |
| Server tests | **1143 passed, 3 skipped** (1146 collected), at the deployed HEAD |
| APK | **copied to `/sdcard/Download/TelegramTopicUploader-0.13.18-d6a7e4.apk`, hash verified, not installed** |
| Production | Server deployed and verified. **No Instagram contact, no check, no probe, no Telegram content sent, no source enabled or disabled** |
| **Not** proven | **every line of D6A7e4 on hardware** (`docs/D6A7E4_DEVICE_CHECKLIST.md`). Also: **no platform-returned display name has been observed live** — 9GAG and Reddit are exercised against synthetic payloads only, and Instagram, TikTok and X make no such claim at all. **The D6A7e3 Preview checks remain open** |

### The Instagram viewing session, as D6A7e5 found it on the handset — read this before claiming it is connected

The installed D6A7e4 build's card **visibly stated `viewing connection rejected`**, with the **last
server session use a few minutes earlier**, its **purpose `source validation`**, and its **outcome
`failed`**. That is a live rejection **observed by a real operation** — not merely an old cached
*connected* value. It is consistent with, and stronger than, the read-only probe D6A7e4 took before
deploying (`rejected`, `last_signal = authentication_expired`, after a scheduled check at 09:32 UTC on
2026-08-01, having worked at 06:26 UTC the same morning).

Record truthfully, and repeat nothing beyond this:

- the dedicated viewing credential **remains configured**;
- Instagram is **currently rejecting** that session;
- a **source-validation operation observed** the rejection;
- **Refresh status does not reconnect the account** — it only rereads server state;
- **repeated validation with the same rejected session is not a repair.**

**D6A7e5 neither caused nor repaired this and contacted Instagram at no point**: no validation, no
check, no operator probe, no cookie replaced or cleared, no source enabled or disabled, no server
state changed. D6A7e5 also **reworded the card** so the rejected state states its repair instead of
saying nothing, and it offers **no Connect and no Retry validation button**, because neither could
perform one.

**The open follow-up is the user's and the server operator's, not an agent's:** sign in to the
dedicated viewing account again, export a fresh cookie jar, import it through the approved server
operator flow, and perform **one separately authorised bounded validation**.

**Do not repeat "the viewing session is connected" from §4c onward** — that was true at D6A7e2 and on
the morning of 2026-08-01. It is a claim to re-verify, not a fact to carry.

## 4b. The D6A7e2 server test-count mismatch — resolved, and now corrected in the repository

Two durable records disagreed. The server's own committed documents and its D6A7e2 commit message
said **1070 passed, 4 skipped**; agent-memory said **1066 passed, 3 skipped**.

`.venv/bin/python -m pytest -q` was run **twice**, read-only, at the unchanged HEAD `478323c`, and
produced **1071 passed, 3 skipped** both times. `pytest -q -rs` shows the only reachable skip is
`tests/test_connector_conformance.py:591`, firing for the three harnesses that declare
`unconfigured=None`, so three skips is code-determined rather than environmental. 1071 + 3 = **1074
collected**, matching the recorded 1070 + 4 exactly (one test miscounted between columns); 1066 + 3
= 1069 is five short, so the memory figure was simply wrong.

**Correct: 1071 passed, 3 skipped.** ✅ **D6A7e4 corrected the server repository's own documents** —
`README.md`, `TODO.md`, `docs/PROJECT_STATE.md` and `docs/RELEASE_REVIEW.md` — with the evidence
recorded beside them. No commit message was rewritten. Durable backlog row 120 is closed.

**That figure is historical.** The current server total is **1143 passed, 3 skipped**.

## 4c. Previous milestone: D6A7e3
**D6A7e3** — a swipe that goes the way you push it, a screen that scrolls under your finger, and a
video that admits it is not there.

> **A corrective, Android-only milestone, opened entirely by the first physical run of D6A7e2.**
> The server was not edited, not deployed and not contacted for a change; Instagram was not
> contacted; no Telegram content was sent.

### What the handset confirmed about D6A7e2 — permanent

- **D6A7e2 was installed on the physical device and exercised.**
- The **dedicated Instagram viewing session is connected**, server-validated.
- **The import enabled no Instagram source.**
- Preview previous/next is present on hardware; the Instagram Dashboard tile exists.

### The three defects it found, all fixed here and none of them closed

1. 🔴 **The swipe direction was the opposite of what the user expects.** D6A7e2 shipped *left →
   next, right → previous*. **The required contract is right → next, left → previous**, and that is
   now what ships. **Device-unverified.**
2. 🔴 **The Preview could not be scrolled vertically when the drag began on the video surface** —
   the controls below the video were unreachable. Root cause: a generic `detectDragGestures` claims
   a drag as soon as touch slop is crossed *in any direction* and consumes it, so the parent's
   `verticalScroll` never saw it. **Device-unverified.**
3. 🔴 **Some videos played audio over a completely black area with no error shown.**
   **Device-unverified.**

### The rules those produced, which outlive the milestone

- **Right is next, left is previous**, decided from the physical sign of the drag alone.
  `LayoutDirection` is not consulted on any gesture path — the same hand movement must mean the same
  thing in Hebrew and English.
- **Decide gesture ownership before consuming anything.** This is the general trap: any scrollable
  parent containing a horizontally-paging child will lose its scroll if the child consumes on plain
  touch slop. A vertical drag must consume *nothing*. The wrong fixes — removing the scroll,
  shrinking the child — were refused explicitly and are guarded against.
- **Prepared is not rendered.** `onPrepared` plus granted audio focus plus no `MediaPlayer` error
  plus an advancing position were **all true** while the screen was black. None of them is about a
  picture. Only the platform's first-video-frame signal, or a real frame arriving on the texture,
  may mean *visible*.
- **Local playback and Telegram upload are separate facts.** A clip this device cannot decode is
  still a file this application can send.
- **Never claim an unproven cause.** "Unsupported codec" is the tempting label for every black
  video and is now impossible to reach without evidence: an unrecognised platform error is
  `UNKNOWN`, an unanswerable decoder query is treated as *decoder present*, and the classification
  checks the **surface first**.
- **One rebuild, carried in the state.** `MAX_RECREATIONS = 1`, never a retry loop.

`VideoView` was replaced by one platform `MediaPlayer` per item **generation** on a `TextureView`
the composable owns; playback starts only when prepared **and** surface-bound; every callback is
refused unless it carries the generation on screen. **Media3/ExoPlayer is not in the offline Gradle
cache**, so it could not have been used, and it would have been a speculative fix for a lifecycle
problem regardless.

| Field | Value |
| --- | --- |
| App version | code **42**, `0.13.17-d6a7e3` |
| App HEAD | `dc3f6331cfae9437ed0683210974a347fa9ccc11` |
| Server HEAD | `478323c1ea6ec61a708b59b6b0b5621e7ecdb876` — **unchanged, not redeployed** |
| Room schema | **16, unchanged — no migration runs.** Server: `0006_session_connection`, unchanged |
| App unit tests | **2538, 0 failures, 0 errors, 0 skipped. Lint: 0 issues**, both counted from the XML reports with `--rerun-tasks` |
| Server tests | **1071 passed, 3 skipped** at the unchanged HEAD — *corrected from evidence; see §4b* |
| APK | **copied to `/sdcard/Download/TelegramTopicUploader-0.13.17-d6a7e3.apk`, hash verified, not installed** |
| Production | **Unchanged.** No Instagram contact, no deployment, no Telegram content sent |
| **Not** proven | **every line of D6A7e3 on hardware** (`docs/D6A7E3_DEVICE_CHECKLIST.md`, 21 lines) — in particular **none of the three defects above is claimed fixed** |

### The D6A7e2 test-count mismatch, as D6A7e3 resolved it

Two durable records disagreed. The server's own committed documents and its D6A7e2 commit message
said **1070 passed, 4 skipped**; agent-memory said **1066 passed, 3 skipped**.

`.venv/bin/python -m pytest -q` was run **twice**, read-only, at the unchanged HEAD `478323c`, and
produced **1071 passed, 3 skipped** both times. `pytest -q -rs` shows the only reachable skip is
`tests/test_connector_conformance.py:591`, firing for the three harnesses that declare
`unconfigured=None`, so three skips is code-determined rather than environmental. 1071 + 3 = **1074
collected**, matching the recorded 1070 + 4 exactly (one test miscounted between columns); 1066 + 3
= 1069 is five short, so the memory figure was simply wrong.

**Correct: 1071 passed, 3 skipped.** Both agent-memory files are corrected. **The server
repository's own documents still carry 1070/4 and are owed a correction in the next server
milestone** — D6A7e3 was forbidden to move the server HEAD.


## 4d. Previous milestone: D6A7e2

**D6A7e2** — a viewing session that says whether it *works*, a sentence that stopped over-claiming,
a Preview you can walk, and an Instagram tile that opens its own list.

> **A dedicated Instagram viewing account replaced the compromised primary one.** Its cookie jar
> was streamed straight into the container's tmpfs over SSH stdin — never written to server disk,
> never passed as an argument, never printed — both plaintext copies were destroyed and their
> absence verified, and **exactly one** authorised live request validated it.

### What the milestone actually establishes

- **The server verified the new session: `connected`, in 2.1 s.** `instagram_enabled_sources: 0`
  before and after — **the import enabled nothing**, and re-enabling remains the user's decision,
  one source at a time. No new CheckRun, no cursor movement, no Story state change, every row count
  identical.
- **The app now answers "is it connected?" rather than "does a credential exist?"** Nine states
  render with words as well as colour, exactly one of them is success, and only the server may
  declare it. `platform.session_connection.v1`.
- **A false sentence is gone.** An empty session-use record no longer claims the session was never
  used; it says nothing has been recorded *since tracking was added*, and that earlier uses are not
  represented.
- **Preview walks previous/next** over a frozen snapshot of the list actually on screen, with
  visible controls, a *3 of 20* position, and gesture arbitration that leaves the seek bar, vertical
  scrolling and image panning alone. **Paging cancels nothing.**
- **A Dashboard Instagram tile** counts the local publishing queue's waiting rows and opens the
  existing screen — one predicate behind both, so the D6A7e1 count/list defect cannot recur here.

| Field | Value |
| --- | --- |
| App version | code **41**, `0.13.16-d6a7e2` |
| App HEAD | `6cebd96412980fb0b440c4182c968310d262fdc2` |
| Server HEAD | `478323c1ea6ec61a708b59b6b0b5621e7ecdb876` — **deployed and verified** |
| Room schema | **16, unchanged — no migration runs.** Server: **`0006_session_connection`**, three nullable columns |
| App unit tests | **2481, 0 failures. Lint: 0 issues**, counted from the XML report with `--rerun-tasks` |
| Server tests | **1071 passed, 3 skipped** — *corrected in D6A7e3; see §4b* |
| APK | **copied to `/sdcard/Download/TelegramTopicUploader-0.13.16-d6a7e2.apk`, hash verified, not installed** |
| Production | **A dedicated Instagram viewing session is configured and verified `connected`. Instagram sources still paused (enabled: 0)** |
| **Not** proven | **every line of D6A7e2 on hardware** (`docs/D6A7E2_DEVICE_CHECKLIST.md`), every line of D6A7e1, and everything D6A7e still owed |

## 4e. Previous milestone: D6A7e1

**D6A7e1** — a security incident contained, a session the screens never mentioned, a transfer no
screen may own, and a Dashboard count that finally opens its own list.

> **This milestone began with Instagram, not with the app.** The user had exported their
> **primary Instagram business account's** cookies and imported them as the server's viewing
> session. Instagram showed a new connection from **Singapore — the server's own hosting
> region** — treated it as suspicious, logged the account out, and required a fresh sign-in.

### The incident, and the exact limit of what may be claimed

- An exported cookie jar **is** an authenticated session. **No password was needed, asked for or
  obtained** — the session cookie is itself the credential.
- Importing it **authorised server-side use**: the server materialised the session, handed the
  path to gallery-dl, and gallery-dl contacted Instagram **from the server's network location**.
  Instagram saw authenticated activity from a new address, environment and request pattern.
- **Both ordinary scheduled checks and development/maintenance probes used it.**
- **Only Instagram knows the exact risk signal that caused the forced logout.** The server's use
  can explain the new connection. Nothing stronger is ever to be claimed.
- **Previous UI and documentation never warned** that Instagram would see authenticated activity
  from the server's location. That gap is corrected in the app and in both repositories' docs.

**Sanitized timeline:** jar imported **2026-07-27 20:16 UTC**; in use until **2026-07-30 04:25
UTC** across 2 manual and 4 scheduled checks plus every documented D6A7b–D6A7e probe; the last
check settled **partial** with the Story half failing — *consistent with* invalidation, not proof.
**Exact per-request counts cannot be reconstructed** and that is stated rather than filled.

**Containment, verified from local credential and process state — never by making a request with
the thing being removed:** credential cleared; the decrypted tmpfs copy (which the clear had left
behind — the defect fixed here) destroyed by restart; **every Instagram source paused**; health,
readiness, 401s, loopback binding, other credentials and all row counts unchanged.

### The two defects that arrived alongside it

1. **Dashboard said Requires review: 3 over an empty filtered list.** The three were *settled
   uncertain uploads* — counted forever, listed nowhere, **not even in History**. The tile
   tallied `classify` while the list applied three more hand-written exclusions. All three moved
   into the one canonical grouping; **the repair is a projection, not a rewrite. No media was
   ever lost.**
2. **A Send now from Preview died with its screen** — Back or app-switch stopped the upload,
   against **D4B**'s persistent-transfer contract. The transfer now lives in an
   application-scoped **durable explicit-send chain** (schema 15 → 16, one additive table).
   Nothing a screen does cancels it; a second tap waits its durable FIFO turn and starts by
   itself; only **Cancel now** stops a live transfer.

| Field | Value |
| --- | --- |
| App version | code **40**, `0.13.15-d6a7e1` |
| App HEAD | `b1a434d7c6fd826fac5e2bec31c15ad630393fc8` |
| Server HEAD | `92269ada1c5c2bead729bad5dc81860010fac23e` — **deployed and verified** |
| Room schema | **15 → 16**, one additive table. Server: **`0005_session_use`**, three nullable columns |
| App unit tests | **2439, 0 failures. Lint: 0 issues**, counted from the XML report with `--rerun-tasks` |
| Server tests | **1035 passed, 3 skipped** |
| APK | **copied to `/sdcard/Download/TelegramTopicUploader-0.13.15-d6a7e1.apk`, hash verified, not installed** |
| Production | **Instagram credential absent, Instagram sources paused (enabled: 0)** |
| **Not** proven | **every line of D6A7e1 on hardware**, and everything D6A7e still owed |

## 4a. Previous milestone: D6A7e

**D6A7e** — a queue Android accepted and never ran, a sentence that outlived its own action, a Reel
the platform's own listing knows about, a schedule stated in numbers, and a 104.8 MB file that
should never have been offered.

> **Three device reports arrived during this milestone**, and one of them is good news that closes a
> check open since D6A7c.

### Verified on the handset, and recorded permanently

- The D6A7d build opened over the existing application data.
- **RESULT_UNKNOWN identification and resolution work** (device-check items 2–4).
- **The later Story check works** (device-check item 7).
- ✅ **A second *successful* Instagram check resent none of the already-imported active Stories.**
  **Live Story deduplication is verified.** D6A7d could not close this: its second Check now was
  refused by the manual cooldown, which is evidence of the cooldown and of nothing else.
- Remote History displays **Story** for live Story deliveries.
- **Per-item Upload now works and sends successfully.**
- ✅ **Source deletion after a confirmed upload succeeded**, verified by the user in the Android file
  manager. **The deletion-refusal sentence displayed beside it was therefore false.**
- Screenshots continue to work.

### The defects, all addressed and none of them closed

1. **Upload queue froze 20 items, Android accepted the job, and nothing ever started.** Progress
   stayed **0 / 20**; no item acquired; nothing sent; and because a retained active batch hides the
   button, pressing *Upload queue* again appeared to do nothing.
2. **A successful upload said the file was permanently deleted *and* that the app never asked
   Android to delete it.**
3. **The same false sentence reappeared minutes later on *"The scan started."*** — classified as
   **stale notice replay / cross-operation notice contamination**. This is the report that
   identified the cause; it is not evidence that anything needed the file.
4. **A known Reel appeared as *Unknown type*.**
5. **The source card named three presets and gave no numbers and no next-check time.**
6. **Rows of 104.8 MB and 50.9 MB sat as `QUEUED`** offering *Upload now*, against the app's own
   50 MB limit.
7. **A RESULT_UNKNOWN replacement reached *Queued* and did not upload**, and its card showed a
   disabled *"it is not in active processing"* action.
8. **Three live queue rows under *"Items in this run: 20."*** The 20 is **historical and correct**
   and must stay 20; the fault was that nothing said which number was which.

### What was built

**Acceptance is not a start.** `RESULT_SUCCESS` means the platform agreed to *consider* the job.
Schema **15** adds `acceptedAt`, `startDeadlineAt`, `executionOwner`, `ownerAcquiredAt`; two active
states join the vocabulary; a two-minute start deadline is reconciled on Queue entry, resume, pull
and launch; and the card then offers **start it here / keep waiting / cancel**. The in-app runner is
the *same* runner over the *same* snapshot. **Exactly one runner may hold a batch, decided by one
guarded `UPDATE … WHERE executionOwner IS NULL` — not by cancellation timing**, because a job already
dispatching sails through a cancellation window. The batch already frozen on the device is
**recovered, not discarded**.

**A notice is a one-shot event.** The deletion stage lived in a `StateFlow` only a manual deletion
wrote and **nothing ever cleared**, and the screen did `"$base $stageMessage"`. One typed result now
maps once into one immutable announcement carrying its own detail and an id that consumption names.
Three notice channels became one. The vague sentence — *"something still needs this file, or the
folder permission does not allow it"* — covered four situations with four different fixes and is
**deleted from both locales**.

**A Reel is proven by a listing, not a field.** No feed record carries a trusted signal, and
`post_url`'s `/reel/` route is written in the same *"exactly one video file"* branch as `type`. The
account's own `…/reels/` (Instagram's `user_clips`) and `…/photos/` (`not _is_reel`) listings are
cross-referenced once per discovery. **Production backfill: 28 unclassified rows → 25 `reel`,
2 `post`, 1 still Unknown; 27 history rows filled; 0 failed.**

**The schedule, in numbers.** Presets state **8 / 4 / 2 hours**, and the card shows the *server's*
last, last-successful and next check as exact local times and countdowns. **Nothing is derived from
the preset.** The manual cooldown and the schedule are **two separate clocks**.

**A file no method can carry is not send-ready work.** One clause in the one candidate query, so
*Upload now*, the batch preview, the snapshot and the claim walk cannot disagree. Units checked
rather than assumed: both sides are binary, so 50.9 MB really is over 52,428,800.

**Two things the queue card never said.** The recorded sanitized failure code — written since D3A,
never once rendered — and a contradiction: `QueueRemovalPolicy` preferred the *dismissal* rule's
`NOT_QUEUED` ("this is not a *failed* row"), which renders as *"it is not in active processing"*
under a status reading **Queued**.

> **The replacement job's upload failure is not claimed as fixed.** The whole sequence now runs
> end-to-end in deterministic tests against the real repository and every step passes; the uncertain
> sibling does not block it. Whatever refused it wrote a code no screen displayed. **The next device
> run must read the reason the card now states** — checklist line 54.

| Field | Value |
| --- | --- |
| App version | code **39**, `0.13.14-d6a7e` |
| App HEAD | `57181ebf1029422fc605814cf78489135250db83` |
| Server HEAD | `b3b9378216402ded73b4a4070eda77e5c0f41356` — **deployed and verified** |
| Room schema | **14 → 15**, four nullable columns, additive. Server: **no migration**, `0004_content_kind` still head |
| App unit tests | **2377, 0 failures. Lint: 0 issues**, counted from the XML report |
| Server tests | **994 passed, 3 skipped** |
| APK | **copied to `/sdcard/Download/TelegramTopicUploader-0.13.14-d6a7e.apk`, hash verified, not installed** |
| Live-proven | **Story deduplication**; **source deletion after a confirmed upload**; the Reel backfill |
| **Not** proven | **every line of D6A7e on hardware**, and the replacement job's real refusal reason |

## 4a. Previous milestone: D6A7d

**D6A7d** — an uncertain upload that can finally be answered, a folder's real name, a delivery that
says what it was, and a refusal that says which refusal.

> **The device report carried one real success.** Instagram Stories were enabled on the existing
> source and one **Check now** discovered and uploaded **every currently active Story** — the
> **first verified live Story import in this project**. The server's own record agrees: eleven
> Stories, one successful manual check, items 28 → 39.
>
> **And it proved nothing about deduplication.** The second Check now was *refused* by the
> fifteen-minute manual cooldown. **That check is still open.**

**Four local files sat in Review with an unknown Telegram result and nothing could be done about
them.** The state was correct — a request may have left the device and no confirmation came back —
and refusing to resend automatically is right. What was wrong is that the row was a dead end: no way
to ignore it, resend it, mark it resolved, or even identify it well enough to go and look in
Telegram. Three actions now, each confirmed: **I found it in Telegram** records a manual
confirmation and **invents no message ID and no confirmation timestamp**; **I did not find it**
makes a second send *possible* without making one happen; **Leave unresolved** calls nothing. Send
again is a separate decision, warned about duplicates, and one uncertain attempt is retried at most
once — a unique index, not a rule the interface remembers.

**Every uncertain card now shows the media**, the real folder name, the file name, the kind and the
topic, so it can actually be compared against Telegram.

**Folders show their real names.** *Folder 2* and *Folder 6* were the generated ordinal, used because
nothing had ever asked Android what the folder is called. It is asked when a folder is added, and
**Rename folder** is on the folder's own page as well as in Directories.

**Remote History says *Story*, *Reel*, *Post* or *Unknown type*** beside the media structure. A Reel
is only ever labelled one when Instagram's own metadata proves it — **a Reel showing as *Post* is
expected, not a defect.**

**Check now says which refusal, and when.** Nine classified reasons, the cooldown with the exact
local time, and only a real transport failure may say the server is unreachable.

**On the server:** `content_kind` frozen onto each delivery, scheduled checks that finally create
durable Check Runs, and `GET /review/unresolved` — the listing that made the D6A6 resolution
endpoint reachable at all.

| Field | Value |
| --- | --- |
| App version | code 38, `0.13.13-d6a7d` |
| App HEAD | `6a9ced6d1791d290a8751c0e1eb325e5dda4d5cd` |
| Server HEAD | `6fa9662b25e606c5d432ea52cc2827500d4f8137` — **deployed and verified** |
| Room schema | **13 → 14**, additive. Server: **`0004_content_kind`**, additive |
| App unit tests | **2250, 0 failures. Lint: no issues** |
| Server tests | **948 passed, 4 skipped** |
| APK | **copied to `/sdcard/Download/TelegramTopicUploader-0.13.13-d6a7d.apk`, hash verified, not installed** |
| Live-proven | **The first active-Story import**, against the real account and the real source |
| **Not** proven | **every line of D6A7d on hardware**; **Story deduplication**; **live Reel classification** |


## 4a. Previous milestone: D6A7c1

**D6A7c1** — corrections a manager review found in D6A7c, plus screenshots and screen recording
turned back on. **The screenshot fix is now confirmed on hardware.**

> **The device report: Android refused screenshots, blocked screen recording, and showed a blank
> white card in Recents.** `FLAG_SECURE` on the window, and `setSecure(true)` on the video preview's
> surface. Both are gone and **nothing replaces them** — the user needs a screenshot to report a
> defect and a recording to show one that spans two screens. A guard fails the build if any
> screenshot-blocking or Recents-hiding mechanism returns.

**This is not a substitute for redaction and weakens none.** No token, cookie or credential is
rendered in plaintext anywhere.

**Three Remote collections had been deciding each other's results.** D6A7c tracked them separately
and then read their success from *one mutable boolean they all shared* — so a Sources failure could
mark History failed, and completion order chose the winner. Every load returns its own outcome now,
and the tests control completion order with explicit gates. The `busy` flag had the matching defect
and is a counter that never reads false while anything is active.

**And a collection that was never requested is no longer "successfully loaded".** The entry path
skipped the collection call when the connection was unusable and recorded a success anyway — so an
empty page, an unreachable server, invalid pairing and no server configured were the same screen.
Four states now, and only a request that actually returned may say *there is nothing here*.

**On the server:** `last_N` was counted in files rather than logical posts (`--post-range` now, its
semantics verified in the tool's source *and* live), a reached bound was mistaken for an ended feed,
the initial Story import count came from the last attempt rather than the whole import, and a Story
preview was retained too late to survive auto-send cleanup. **No new migration was needed.**

| Field | Value |
| --- | --- |
| App version | code 37, `0.13.12-d6a7c1` |
| App HEAD | `87cb1bbaa0df27da54eb0850c50f1759a07f5699` |
| Server HEAD | `f5c0b7d9a4010f7c012a2da1e854e1b8f3848865` — **deployed and verified** |
| Room schema | **13 — unchanged.** Server: **no new migration** |
| App unit tests | **2148, 0 failures. Lint: no issues.** |
| Server tests | **903 passed, 4 skipped** |
| APK | **copied to `/sdcard/Download/TelegramTopicUploader-0.13.12-d6a7c1.apk`, hash verified, not installed** |
| **Not** proven | **every line of D6A7c1 on hardware**, and **no live Story has ever been imported** |

**Two production facts worth knowing.** Between the two server deployments the source's own schedule
ran a check and delivered **three more posts** — 25 → 28 confirmed. No agent ran a check; the source
is `auto_send`, so a scheduled check *is* a delivery. And a **scheduled** check leaves no durable run
record, so a source card can only ever report a *manual* check's result (D6A7b behaviour, deferred).

## 4a. Previous milestone: D6A7c

**D6A7c** — Remote screens that never asked, History with no pictures, pinned posts distorting the
import, and Instagram Stories as an opt-in.

> **The device report: Remote Sources showed no source and Remote History showed no history until
> Refresh was pressed** — and both had been on the server the whole time. Nothing was broken on the
> server or in the transport. The screens simply never asked.

**And that is two defects.** The collections started as empty lists, so *"there is nothing here"*,
*"nothing has been asked yet"* and *"the request failed"* all rendered as the same blank screen.
Loading is a **state** now, and the empty-state sentence is reachable from exactly one of them — a
request that *completed successfully* and returned nothing. **A failed refresh never blanks data
that had already loaded.** Entry and resume load; a redraw does not; there is no timer anywhere.

**History cards carry a picture** — retained by the server at discovery, delivered to the app as
**bytes from an authenticated endpoint, never a URL**. No second image library. A preview that fails
to arrive changes no delivery fact on the card.

**Pinned posts no longer distort the import, and the cause was measured rather than assumed.** A
sanitized probe of the exact installed extractor against the deployed server: three pinned posts
printed **ahead of** newer ones, one ordering inversion, `date` on every record. Nothing in
gallery-dl sorts. `last_25` now means the twenty-five newest **by publication time**, and the cursor
names the newest *dated* post.

**Instagram Stories are a switch on an existing Instagram Profile source**, off by default, never a
source type. Enabling on Auto send asks first and sends nothing until confirmed; disabling never
asks. Story media is staged **at discovery**, so a Story in Review outlives its own expiring URL.

| Field | Value |
| --- | --- |
| App version | code 36, `0.13.11-d6a7c` |
| App HEAD | `1b75649a8714a4463cab80042674806026084e41` |
| Server HEAD | `cbea54ffa9d41b6a76a84a4d739845899995c3f2` — **deployed and verified** |
| Room schema | **13 — unchanged.** Server: `0003_instagram_stories`, additive, columns only |
| App unit tests | **2114, 0 failures. Lint: no issues.** |
| Server tests | **860 passed, 4 skipped.** `ruff`, `ruff format`, `mypy`, preflight clean |
| APK | `app-debug.apk`, 16,149,616 bytes, **not installed** |
| Live-proven | The extractor probe, and the deployment |
| **Not** proven | **Every line of D6A7c on hardware**, and **no live Story has ever been imported** |

**Two results that are correct and will look like bugs**, both stated at the top of
`docs/D6A7C_DEVICE_CHECKLIST.md`: the existing 25 history rows show **placeholders**, because
previews are fetched at discovery and those deliveries predate the feature; and the Story path has
**never carried a real Story**, because the probe found the tray empty.

**And a correction to carry forward: D6A7b reported "lint clean" while three warnings were present.**
`./gradlew lint` exits zero on warnings, so a gate reading the exit code passes while the zero-issue
bar does not. **Read the report, not the exit code.** Fixed here.

## 4a. Previous milestone: D6A7b — a check that could not end

An Instagram source stuck on *Checking* that never settled, with Pending Review at 0 and no posts. A
second hardware addendum, on top of D6A7a.

> **The obvious reading was wrong.** Every check completed in **seconds** and answered `200`. The
> server was never stuck. There was simply nowhere for a *result* to live, and nothing on screen
> that could show one.

**Why there were no posts.** gallery-dl's `instagram:user` extractor does not enumerate a profile:
it emits a `Message.Queue` naming the sub-extractor that would, and stops. `--dump-json` prints that
and exits zero. **`--resolve-json` follows it** — same profile, same session: 142 bytes and 0 posts
before, 383,444 bytes and **30 posts** after. Resolving costs ~1 s per file, so
`extractor_timeout_seconds` went 120 → 300 on measurement.

**And why nothing noticed.** gallery-dl writes one pretty-printed array unless `output.jsonl` is
set, while the reader parsed line by line — zero records from a successful run, and zero records was
treated as an empty feed. Unreadable output, an error recorded *inside* the dump with exit zero, and
queue entries with no members are each refused by name now. Only `[]` is an empty feed, and only it
may advance a baseline.

**A requested history could never be retried.** A first scan that observed nothing still committed
its baseline, so `last_25` became `only_new` permanently. Fixed, plus a narrow repair that re-arms a
stranded source — **it fired on production, `count: 1`** — preserving the row as evidence.

**A check is now a durable row.** It was performed inside the request that asked for it, so a
disconnected client could never learn the result, a restart lost it, and a second tap started a
second extractor. `check_now` starts a run and returns; `/sources/{id}/checks/latest` reads it; a
second tap joins the live run; a restart settles an interrupted one. The app polls to a terminal
state and reports one of five sentences, **both** branches refresh the row, and the card states what
the last check did and whether the history was imported.

**Live:** 25 Review items imported, session accepted, baseline and cursor written. ⚠️ The source is
`auto_send`, so those 25 went to its Telegram topic and are `confirmed` — its own configured
behaviour, triggered by the verification run the addendum required.

**Two things to carry forward.** The Instagram jar was never broken — a probe that skipped
`#HttpOnly_` lines made it look so, and those lines carry the session cookies. And **D6A7a shipped
with ten stale version assertions**, because they read `build.gradle.kts` from disk and Gradle does
not track it as a unit-test input: a version bump leaves the task UP-TO-DATE and the gate reports
success. **Use `--rerun-tasks` for a final Android gate.**

| Field | Value |
| --- | --- |
| App version | code 35, `0.13.10-d6a7b` |
| App HEAD | `e6ec4556f92565db6159305513b43fd87ffcac34` |
| Server HEAD | `94d6a449b6d9902766a0e3e0c26bed6482ee2357` — **deployed and verified** |
| Room schema | **13 — unchanged.** Server: one additive table, `0002_check_runs` |
| App unit tests | **2043, 0 failures. Lint clean.** |
| Server tests | **759 passed, 4 skipped.** `ruff`, `ruff format`, `mypy`, preflight clean |
| APK | `TelegramTopicUploader-0.13.10-d6a7b.apk`, **not installed** |
| Live-proven | The server half: one real check imported 25 posts under the stored `last_25` policy |
| Device-unverified | **Every Android line of D6A7b.** `docs/D6A7B_DEVICE_CHECKLIST.md`; all *not attempted*. Rows 65–71 |

## 4a. Previous milestone: D6A7a — a confirmed upload that came back, and a queue that froze

### Chain one — one stray row caused both A-defects

A confirmed upload still appeared in Review; pressing Upload produced the already-uploaded dialog;
choosing its permanent deletion left the file in place.

Every scan re-hashes and re-finalizes **every** document it enumerates, including one whose
confirmed source is still on disk. `upsertReviewJob` looks for a placeholder to reuse by
`topicDestinationId IS NULL AND status = 'AWAITING_ROUTING'` — which a confirmed job never matches —
so it found nothing and inserted a **second, brand-new placeholder** for media Telegram already
held. That row is what put an already-sent file back in Review.

> **And it is the same row that blocked the deletion.** It made
> `countOtherSourceDependentJobs` non-zero, so `SourceDeletionGate` answered
> `WAITING_FOR_OTHER_JOBS` and returned **before `markAttemptStarted`**. The Android document
> provider was never called at all. This is the identical one-line disagreement D6A5 repaired for
> the *manual* deletion path, left behind on the post-confirmation one.

The scan now asks `countPositivelyConfirmedForMedia` before either branch can write a placeholder;
the guard SQL encodes `SourceDependencyPolicy`; and `retireUnresolvedForConfirmedMedia` retires
already-existing placeholders inside `reconcileDurableState`, at launch and on pull-to-refresh.
Because a confirmed file now correctly stays out of Review, the folder page's **Confirmed** section
gains *Delete the file from this device* — the same D4B use case, authorized by the job carrying the
confirmation — and a refusal names its stage and its sanitized reason.

### Chain two — the queue could freeze with no action left

`armPendingBatchStart` returned without re-attempting when a start was already armed, and the
consume returned silently when the window was not focused, so a missed focus event killed **Upload
queue** for the life of the process. `requestStopAfterCurrent` had no status guard, so cancelling a
batch the platform had accepted but never executed recorded a flag only the runner could clear;
`BatchStatusCard` then matched no branch and rendered **no control at all**, while the retained
active slot hid the start button.

A deferral is announced and a repeat press retries. Cancelling a batch that has not begun executing
withdraws it outright — slot released, item states preserved, **no `RESULT_UNKNOWN`, no Telegram
request**. The card's branch set is total. And the abandoned-claim reconciliation, previously
reachable only from an upload, a batch or an album start — every one of which a stranded row
disables — now runs inside `reconcileDurableState`, so a row left `UPLOADING` returns to queued when
no request had started and to `RESULT_UNKNOWN` when one may have, and is never silently resent.

| Field | Value |
| --- | --- |
| App version | code 34, `0.13.9-d6a7a` |
| App HEAD | `b0910eeba9f0f20cb04d98934fb30885d5befcab` |
| Server HEAD | `b307b0882177738cf9e5dadf1a8eb14b62b40706` — **unchanged; no server change was required** |
| Room schema | **13 — unchanged.** No migration. |
| App unit tests | **2027, 0 failures. Lint clean.** |
| APK | `TelegramTopicUploader-0.13.9-d6a7a.apk`, **not installed** |
| Device-unverified | **Everything in D6A7a.** See `docs/D6A7A_DEVICE_CHECKLIST.md`; all lines are *not attempted*. Backlog rows 59–64 |

## 4a. Previous milestone: D6A7 — the share button, and a refusal that claimed to be an outage

### The addendum, which is the larger half

**Reported from the device.** Validating an Instagram Remote Source displayed the Hebrew equivalent
of *"The server refused the request"*. The global state then changed to *"Paired, but the server
could not be reached."* **Retry** restored it at once.

> **A structured rejection proves the server was reached.** It had to be, to produce one.

**Android root cause:** `RemoteViewModel.handleFailure` fed *every* failure of every kind to the
reducer that owns global reachability. A named refusal, carrying the server's own error code, over a
connection that plainly worked, was recorded as proof of the opposite. A banner that cries outage
during ordinary refusals is a banner nobody reads during a real one.

Classification now lives in one **pure, total** reducer (`RemoteConnectionReducer`) and
`connectionFor` is gone, with a source scan keeping it gone. Transport failure and timeout are
unreachable; `401` is pairing; a structured `4xx` leaves the connection alone; a `5xx` is its own
failure and is never unreachable; platform challenges and rate limits arrive as *successful* calls
and move nothing; cancellation proves nothing. **Retry is no longer a repair** — an answered request
that finds the app believing the server is gone triggers one authoritative status call. The server's
**exact sanitized code** is now shown in brackets rather than discarded. The **last proven
connection is persisted**, so a cold start with the tunnel down no longer looks like an unpaired
phone.

### And the Instagram refusal itself — never a cookie problem

**Root cause was on the server.** The runtime tmpfs was mounted **root-owned** while the service
runs unprivileged, so `PermissionError` escaped as a generic 500 for **every path-based connector —
X, Instagram and TikTok**. 9GAG alone kept working, because its cookies are a header and never
become a file, which is why the fault looked Instagram-shaped. Verified fixed on the deployed host:
Instagram's material now reports `ready`.

> **Nobody was asked to re-export cookies, and nobody should be** until evidence shows the
> configured session is itself missing or rejected. It was present, encrypted and intact throughout.
> `ABSENT` and `UNREADABLE` are now different states, because the action they call for is opposite.

### The first half

Media another application **shares into** this one becomes an ordinary Review item. A shared **link**
is reported as a link and never fetched — fetching it would be the scraping route 9GAG is refusing.
**It is not a connector** and must never be described as one: it discovers nothing, polls nothing,
follows no account, and imports exactly what a person handed it, once.

| Field | Value |
| --- | --- |
| App version | code 33, `0.13.8-d6a7` |
| App HEAD | `5e7e688e8470360369388ec03718fc0ec8fdfbe9` |
| Server HEAD | `b307b0882177738cf9e5dadf1a8eb14b62b40706` — **deployed and verified** |
| Room schema | **13 — unchanged by D6A7.** No migration. |
| App unit tests | **1979, 0 failures. Lint: no issues.** |
| Server tests | **722 passed, 4 skipped.** `ruff`, `ruff format`, `mypy`, preflight clean. |
| APK | `TelegramTopicUploader-0.13.8-d6a7.apk`, byte-for-byte identical, **not installed** |
| Live-proven | The server mount fix: Instagram credential material materialises for the first time |
| Device-unverified | **Everything else in D6A7.** See `docs/D6A7_DEVICE_CHECKLIST.md`; all lines are *not attempted*. |

**Still open, carried forward:** the live Instagram validation answer is unknown (the 500 hid it);
`BulkSendDestination.Shared`/`.Divergent` are unreachable from Review and their UI branches cannot
render; official Meta publishing remains **blocked on Meta authorization**, not completed; 9GAG
automatic discovery remains **platform-blocked**.

Previous: **D6A6a** — a one-member fix to a status that contradicted itself. `RemotePlatformReadiness`
had no `CHALLENGE` member and collapsed it onto `RATE_LIMITED`, so the platform list said *rate
limit* while every validation said *challenge*. **A scheduling bucket is not a sentence.** The whole
path was traced first: production held no rate-limit signal anywhere to be stale.

Previous: **D6A6** — one format mismatch behind two failing 9GAG checks (a Netscape cookie jar
pushed into a `Cookie` header, refused before a byte left the process), the Interest source type,
`RESULT_UNKNOWN` resolution, the Ignore race, local Instagram publishing, and the Meta publisher's
vocabulary and safety rules **without** its executor.

Previous: **D6A5** — confirmed-versus-queued, the manual deletion that finally reached the provider,
five platforms, four device findings. Headline: **manual permanent deletion without upload works on
hardware**, closing the defect reported at D6A.

Previous: D6A4 (the outage, release integrity, a real rollback), D6A3, D6A2, D6A1, D6A, D5C.

## 5. Deployed VPS state — no private values

A DigitalOcean droplet, Ubuntu 24.04.4, amd64, 1 vCPU, ~2 GiB RAM, ~48 GB disk.
Deploy path `/opt/remote-sources`; state `/var/lib/remote-sources`.

**The address, the Tailscale hostname and the tailnet name are deliberately recorded nowhere.** They
live in the operator's shell and in the app's settings.

**Verified by the agent:**

- 2 GiB swap, root-owned `0600`, in `/etc/fstab`, `swappiness=10`.
- Admin user `deploy` with the **existing** keys copied; a new SSH session verified **before**
  hardening; scoped `NOPASSWD` sudo, **not** blanket root, **not** in the `docker` group.
- Locked service user `remote` (uid 10001) owning the state directory at `0750`.
- SSH hardened after that verification: password and challenge-response off, root
  `prohibit-password`. Both key logins re-verified; a password attempt is refused.
- Docker 29.6.2 + Compose v5.3.1 from Docker's own repository, enabled at boot.
- Container healthy: uid 10001, read-only rootfs, `cap_drop: ALL`, `no-new-privileges`, `tini` pid 1.
- **Published to `127.0.0.1:8099` only.** `ss -tlnp` shows **only SSH** publicly. UFW default-denies
  and its script fails if an application port ever appears.
- `/health` and `/ready` answer over loopback; an unauthenticated data route is **401**.
- Tailscale 1.98.9 installed, enabled at boot.

**Blocked, needs a human:** Tailscale node authorisation (`tailscale up` needs a browser signed in to
the tailnet), and everything downstream — `serve --bg`, reboot persistence, Funnel-off verification,
reachability from the phone.

**Not done, needs the user:** every credential, pairing, and any live platform or Telegram request.

## 5a. The Instagram viewing-session rule — D6A7e1, absolute

**A cookie jar is an authenticated session, and the platform sees this server using it.** The
user's primary business account was logged out by Instagram after its imported session acted from
the server's region. Therefore, permanently:

- **Only a dedicated, low-value viewing account may ever be imported** — its own email, unique
  password, two-factor, **no business assets, no ad account, no Facebook Page ownership, no
  important messages**, kept out of the primary account's Accounts Center where avoidable. It may
  still be challenged; the separation limits the cost, not the possibility.
- **One shared viewing session serves every Instagram source.** Adding a source never logs in to
  the target account, never asks for its credentials, and creates no session for it. A **private**
  target is readable only if the viewing account is already an approved follower.
- **No live probe without the user's explicit approval of that specific run.** Ordinary configured
  production checks are separate and are governed by source enablement and the schedule.
- **Re-enabling is per-source, from the application, after the dedicated session is configured.**
  Nothing resumes automatically; a cookie import re-enables nothing.
- **Never ask the user to re-export cookies** unless evidence shows the configured session is
  itself missing or rejected — the D6A7 lesson, still standing.
- **D6A7e2: presence is not connection.** A stored credential is a fact about the server; a working
  session is a fact about the platform, and only an authenticated request can establish it. The
  server composes the verdict and the app *translates* it — never re-derives it — so
  *configured, unverified* and *connected* are different words on the screen and a server too old
  to answer can produce only the first. Re-deriving a state the server already composed is exactly
  how two surfaces come to disagree about one server.
- **D6A7e2: a use that began before the current credential settles nothing about it.**
  `session_configured_at` is a generation boundary carried as a ticket, so an in-flight request
  against the old account can never write a verdict about the new one. It needs no
  credential-derived identifier, which is the point.

## 6. The server-side secret rule — absolute

The **Telegram bot token, Reddit OAuth credentials and X cookies exist only on the server.** The
Android app has never held them and must never receive them: no API method returns a credential, and
no request model has a field that would accept a bot token.

They are entered **interactively with hidden input** through `remote-sources-configure`, never as
command arguments, and stored as AES-256-GCM envelopes under a root-owned `0400` master key.
Backups deliberately exclude that key.

**Claude must never request that the user paste a production secret into a chat or a prompt, and
must never read one.** If a live smoke test needs one, stop and give the user the exact command to
run in their own SSH shell.

## 7. Connector status — do not overstate this

| | Discovery | Credentials | Live-tested |
| --- | --- | --- | --- |
| **9GAG** | **accounts and Interests** — two distinct source types | optional server-side cookies, **configured** | **refused live — anti-bot challenge on every deep path**, classified `challenge`, **confirmed from the device 2026-07-27** |
| **Reddit** | implemented (`u/…` and `r/…`) | **required** — anonymous is 403 | **no** |
| **X** | implemented (gallery-dl + cookies) | **required** | **no** |
| **Instagram** | **implemented at D6A5** | **required — D6A7e1 removed the compromised session; D6A7e2 imported a dedicated one and the server verified it `connected`. Every Instagram source is still paused (`enabled: 0`)** | live-proven for feed, Stories and Story deduplication (D6A7b–D6A7e); one bounded D6A7e2 validation succeeded; **otherwise dormant, by decision** |
| **TikTok** | **implemented at D6A5** (gallery-dl + yt-dlp); **the discovery URL was wrong until D6A7e8** and is now the profile's *posts listing* | **optional** — never required; the D6A7e8 failure was not a refusal and no cookie was imported | **yes, once, pre-fix, and it failed** — the seventh physical run returned `malformed_upstream` / `tiktok_not_enumerated`. Corrected and deployed; **the post-fix validation is backlog row 220 and only the user can run it** |

All five are selectable in the Android app since D6A5, each with its own state sentence. **Being
selectable is not being live-tested**, and the two must never be conflated in a report.

*(Corrected at D6A7e8: this table said TikTok's credentials were **required**. They are not, and
never were — the adapter has advertised `requires_credentials=False, optional_credentials=True`
since D6A5. The distinction matters, because it is what makes a TikTok refusal with no session
`setup_required` rather than `authentication_expired`, and it is why the D6A7e8 failure was
correctly never treated as a credential problem.)*

**9GAG has two source types since D6A6**, and they are never interchangeable: an account feed at
`/u/<name>/posts` and an Interest feed at `/interest/<slug>/<mode>`. Each is refused **by name** when
submitted as the other. Only `hot` and `fresh` exist as feed modes — proved against the live site,
not remembered — and the bare path is recorded explicitly as `hot` so a source cannot change which
feed it follows if the site's default moves.

**9GAG is refused live from this host**, with a session correctly configured: the site root answers
200 and every `/u/…` and `/interest/…` path returns an anti-bot challenge. That is classified as
`challenge`, and nothing in this project solves one.

**Instagram appears twice in this system and the two share nothing.** The *remote source* connector
discovers what an account has already published. **Instagram publishing** (D6A6) is the opposite
direction — local media the user sets aside and posts themselves through the Instagram app. Never
mix their credentials, identities, jobs or evidence.

**Mocked tests prove parsing and classification. They prove nothing about the live platforms.** Never
describe a connector as end-to-end validated on that basis.

The 9GAG connector reads the profile page's own server-rendered payload, because `yt-dlp` downloads
one post and cannot enumerate an account and `gallery-dl` has no 9GAG extractor. **It is the
connector most likely to need maintenance**, since that payload is front-end data, not an API.

## 8. Hardware-validation ledger

**Confirmed by the user, and only this:**

- **D6A7e7b reports (2026-08-07), on the installed D6A7e7b build — the seventh physical run:**
  - ✅ **TikTok is visible in *Remote Sources → Add source*** on the narrow Hebrew/RTL handset, and
    **the platform chips wrap onto another line.** This closes the sixth run's reported defect and
    backlog row **193**. The D6A7e7b `RemoteChipFlow` fix is device-proven.
  - ✅ **TikTok can be selected and its TikTok-specific identity form appears.** Backlog row **194**.
  - 🔴 **The first live TikTok source validation failed.** One public profile, the explicit
    *Check source* control pressed **once**, and the app displayed the `malformed_upstream`
    sentence: *the platform returned content the server could not read; the connector must be
    updated.* **It was correct.** The classification travelled from the server unchanged, the app
    rendered it truthfully, and it named the right component. **No source was created.** The cause
    was the server connector's discovery URL, fixed and deployed in D6A7e8 — the post-fix validation
    is backlog row **220** and is **still owed from the device**.
  - ⚪ **Everything else in D6A7e7b produced no evidence and is not marked.** The launcher icon, the
    Remote and local History times and details, the Archive, the incremental launch scan and the
    install-over survival lines were not reported on. Rows 192 and 195–210 stay open.
  - 🗒️ Public HTTPS was evidently working — the validation reached the server — but nothing about
    the transport was exercised deliberately, so rows 168–178 stay open on their own evidence.

- **D6A7e7a reports (2026-08-07), on the installed D6A7e7a build — the sixth physical run:**
  - 🔴 **TikTok was not visible or reachable in *Remote Sources → Add source*** on the narrow
    Hebrew/RTL handset. The chooser showed **Instagram, 9GAG, X and Reddit** and the fifth platform
    was absent — not disabled, not greyed, not explained. **This is a physical Android layout
    failure, not a product gap**: the platform, its `tiktok_profile` source type, its tab, its
    translated labels and the deployed server's adapter have all existed since D6A5. The chooser drew
    its chips in a non-wrapping `Row` and the fifth was clipped outside the viewport; under RTL that
    edge is the left one. **TikTok was not contacted**: no source created, no validation attempted,
    because the control that would have started one could not be reached. Fixed by D6A7e7b, which is
    **device-unverified** — rows 193–196.
  - 🔴 **The launcher icon renders as a blank white shape.** The manifest pointed both icon
    attributes at a white-only foreground vector, which is not a launcher icon. Fixed by D6A7e7b,
    device-unverified — row 202.
  - ⚪ **No evidence of any kind about D6A7e7a's own corrections.** The run reported a different
    screen. Rows **179–191 all stay open**; the false *Requires review* fix remains under
    opportunistic observation during ordinary use (checklist lines 69–71), which is watching, not
    evidence.
  - 🗒️ **Four product decisions taken beside the report**, all now recorded: History must say *when*
    a delivery actually happened; the *Source missing* and *Cancelled / retired* Dashboard tiles must
    stop presenting themselves as current work **without deleting the records**; the launch scan must
    stop re-reading and re-hashing known unchanged media; and the future official Instagram publisher
    must be **multi-account from day one**. The first three shipped in D6A7e7b, device-unverified;
    the fourth is roadmap only (rows 213–219).

- **D6A7e7 reports (2026-08-06), on the installed D6A7e7 build — the fifth physical run:**
  - ✅ **The secure public transport connection works**, the **authenticated public connection test
    succeeds**, **Public HTTPS is selected and displayed as verified**, and **ordinary Remote Sources
    access works without Tailscale running on the phone.** The supplied screen states, in its own
    words, that secure public transport is in use, that the public connection was verified, that
    ordinary use works without Tailscale on the phone, and that private Tailscale remains available
    for pairing and recovery. This closes backlog rows **171 and 172 and nothing else** — the exact
    sentence of checklist line 9 was not transcribed, and the individual thumbnail, Remote Review and
    Remote History sub-paths were not separately exercised.
  - 🔴 **A local media upload to Telegram became *requires review* every single time** the user left
    the Preview or the application while it was running and came back, with the application saying it
    did not know whether Telegram had received the file. The user clarified explicitly: **the upload
    itself continued and appeared to finish; the problem is only that it becomes requires review.**
    That is **not** evidence of a cancelled request — it is an independent lifecycle or reconciliation
    path writing an uncertain outcome while the real transfer owner carried on. **It must not be
    attributed to Tailscale or to the transport**: the local upload path never used a Remote Sources
    endpoint. Answered by D6A7e7a; **device-unverified**, backlog rows 179–191.
  - ⏳ Nothing else on the D6A7e7 checklist was reported. Rows **168–170 and 173–178** stay open on
    their own lines, and silence on a row never means completion.


- **D6A7e4 (2026-08-01): nothing.** No line of `docs/D6A7E4_DEVICE_CHECKLIST.md` has been
  attempted, and **the whole of the D6A7e3 checklist is still owed** — D6A7e4 changed nothing in
  Preview and closes none of it.
- **Server-observed, not user-reported (2026-08-01):** the dedicated Instagram viewing session's
  stored state moved from `connected` at 06:26 UTC to **`rejected`** after a **scheduled** check at
  09:32 UTC. Observed read-only during D6A7e4's pre-deployment probe; **not caused and not repaired
  by any agent action**, and no validation, check or probe was run.

- **D6A7e3 reports (2026-08-01), on the installed D6A7e2 build — the first physical run of D6A7e2:**
  - ✅ **The dedicated Instagram viewing session is imported and server-validated as `connected`.**
  - ✅ **The import enabled no Instagram source.** Enablement remains the user's decision.
  - ✅ **Preview previous/next is present and works on hardware**, and the **Instagram Dashboard
    tile exists.** Both are D6A7e2 features and both are now confirmed.
  - 🔴 **The horizontal swipe direction was the opposite of what the user expects.** D6A7e2
    implemented *swipe left → next, swipe right → previous*. **The user's explicit decision is
    swipe right → next, swipe left → previous.** Reversed at D6A7e3; **device-unverified.**
  - 🔴 **The Preview screen could not be scrolled vertically when the gesture began on the video
    surface** — there is content below the video and it was unreachable, because the paging gesture
    captured the drag. Fixed at D6A7e3 by deciding gesture ownership before consuming anything;
    **device-unverified.**
  - 🔴 **Some videos played audio while the video area stayed completely black, and the application
    displayed no error.** Root cause: *prepared* was being treated as *rendered*. Fixed at D6A7e3
    with a real render state, one player generation per item, a first-frame deadline and truthful
    non-black outcomes; **device-unverified.**
  - 🟡 **Rule recorded from this run:** **local playback and Telegram upload eligibility are
    independent facts.** A clip this device cannot decode is still a file this application can send,
    and a Preview playback failure must never alter Upload Queue state.

- **D6A7e1 reports (2026-07-30), on the installed D6A7e build:**
  - 🔴 **Instagram logged the primary business account out** after showing a new connection from
    Singapore — the server's hosting region — while that account's exported session was the
    server's viewing session. **Instagram never disclosed the reason**; the server's use of the
    session can explain the connection and no more. Contained: credential removed, decrypted copy
    destroyed by restart, every Instagram source paused, **no live Instagram request made during
    D6A7e1**.
  - 🔴 **Dashboard: Queue 3, Requires review 3, filtered Review 0 cards.** Root-caused to a
    projection disagreement — three *settled uncertain* rows counted by the tile and excluded by
    the list, and absent from History too. **Not lost media.** Fixed at D6A7e1; **device-unverified.**
  - 🔴 **Send now from Preview stops when Preview is closed or the app is backgrounded**, and the
    file stays queued — a regression against **D4B**'s persistent-transfer contract. Fixed at
    D6A7e1 by moving the transfer to an application-scoped durable chain; **device-unverified.**
  - 🟡 **Product decision recorded:** pressing Send now on a second item while one uploads must
    queue an explicit FIFO request that starts automatically — built at D6A7e1,
    **device-unverified**. Ordinary queued items stay manual.
  - 🟡 **Product decision recorded:** files above 50 MB will be solved by the **official Telegram
    Local Bot API Server in local mode (2000 MB)**, in **D6A7f**. Not activated at D6A7e1. No
    compression, splitting or user-account upload was approved.

- **D6A7e reports (2026-07-28), on the installed D6A7d build:**
  - ✅ **Live Story deduplication.** A second *successful* Instagram check, with the same Stories
    still active, resent **nothing**. This closes a check open since D6A7c; D6A7d's second Check now
    was refused by the cooldown, which proved only the cooldown.
  - ✅ **Source deletion after a confirmed upload succeeded**, verified in the **Android file
    manager**. The file was genuinely gone. **The deletion-refusal sentence shown beside it was
    therefore false**, and the same false sentence then appeared on an unrelated *"The scan
    started."* — classified as **stale notice replay**, not as evidence about the file.
  - ✅ RESULT_UNKNOWN identification and resolution (D6A7d checklist items 2–4) and the later Story
    check (item 7) both work.
  - ✅ **Per-item Upload now works and sends.** This is what rules out the media, the connection, the
    destinations and the upload pipeline for the batch defect below.
  - 🔴 **Upload queue: 20 items frozen, Android accepted the job, and nothing ever started.**
    Progress **0 / 20**. **The background-batch path remains device-broken until D6A7e is verified.**
  - 🔴 A known **Reel showed as Unknown type**. **Live Reel classification is not verified**, even
    though the server has since proven the signal and reclassified 25 rows.
  - 🔴 A **104.8 MB** row and a **50.9 MB** row sat as `QUEUED` offering *Upload now*, against the
    app's own 50 MB limit.
  - 🔴 A **RESULT_UNKNOWN replacement reached *Queued* and did not upload**, with a contradictory
    disabled *"not in active processing"* action on the same card.
  - 🔴 Three live queue rows under *"Items in this run: **20**"*. **The 20 is historical, correct,
    and must never be rewritten** — it is a frozen batch's membership. The defect was presentation.
  - 🔴 The source card named three presets with **no numbers and no next-check time**.

  > **Source deletion itself passed in this observed case. Truthful *notice* behaviour did not, and
  > remains open until D6A7e is physically verified.**

- **D5A check 1** — a folder shows its real name; a local alias can be set, shown and cleared.
- **D5A check 2** — tapping a folder opens its own media page.
- **D5A check 3** — one disposable image scanned, thumbnailed, previewed and uploaded.
- **D6A3** — the first successful pairing, authenticated requests, and the destination selector.
- **D6A5 reports, authoritative:** deletion **after** a Telegram-confirmed upload **works**, and
  manual external deletion followed by a complete scan **reconciles correctly**. Neither may be
  broadly rewritten; both are now explicit regression guards.
- **D6A5 installed and confirmed (2026-07-27).** `0.13.5-d6a5` / versionCode **30** was installed
  over the existing app and **the Settings version row was read on the device** — which is both the
  proof of the install and the hardware verification of that row.
- **MANUAL PERMANENT DELETION WITHOUT UPLOAD NOW WORKS ON HARDWARE (2026-07-27).** The deletion
  succeeded and the source disappeared from **both the application and the Android file manager**.
  **This closes the longest-running defect in the project** — reported at D6A, and fixed across
  D6A, D6A2, D6A3, D6A4 and finally D6A5, where the cause turned out to be one line in
  `SOURCE_DEPENDENT_STATUSES`.

  > **It is a separate result from delete-after-confirmed-upload**, which was already
  > hardware-verified independently and earlier. The two are different code paths with different
  > evidence and **must never be merged into a single claim** — conflating them is how the working
  > path nearly got rewritten to fix the broken one.

**Reported by the user during ordinary use — currently FAILED on hardware:**

- ~~**Manual permanent deletion without upload.**~~ **FIXED AND HARDWARE-VERIFIED at D6A5.** Moved
  to the confirmed list above.
- **A confirmed upload described as "already queued"**, with an empty Upload Queue. Fixed in D6A5;
  **not re-verified.**
- **A terminal Failed item with no removal action.** Fixed in D6A5; **not re-verified.**
- **A Review item with no action that removes it from Review.** Fixed in D6A5; **not re-verified.**
- **Preview from inside a folder did nothing.** Root-caused to a missing overlay host and fixed in
  D6A5; **not re-verified.**
- **A 42-item send:** album failure, three items missing, album rows stuck in the Queue. Fixed in
  D6A; **not re-verified.** The 50 MB suspicion is **consistent with the evidence but not proven**.
- **Selection actions unreachable without scrolling to the top.** Fixed; not re-verified.

**Confirmed on hardware 2026-07-27, and it is the first live proof of D6A6:**

- **D6A6 installed** (`0.13.6-d6a6` / code 31).
- **Both 9GAG source types — profile and Interest — report the human-verification challenge.** This
  proves the generic "could not reach the platform" mapping is gone, both types reach the deployed
  connector, the cookie material is usable, both live paths are refused by the platform, and the
  Android message renders. **Discovery itself remains blocked by 9GAG.**

**Reported by the user during ordinary use — root-caused at D6A7, NOT re-verified:**

- **An Instagram source validation showed a generic server refusal, and the whole application then
  reported the server unreachable; Retry fixed it.** Two independent defects behind one report:
  the Android reducer treated an *answered* request as evidence of unreachability, and the server
  was genuinely returning 500 because it could not read its own runtime directory. Both fixed at
  D6A7; the server half is **live-verified**, the Android half is **not verified on hardware.**

  > **Do not ask the user to export cookies for this.** The stored Instagram session was present,
  > encrypted and intact throughout. That was checked before anything was changed, and asking would
  > have been work that changed nothing.

**Verified against production (server, not the phone):**

- **D6A7, 2026-07-27.** The runtime directory now reports `mode=700 owner=10001:10001`; it was
  `0:0`. Instagram's credential material materialises for the **first time** (`ready`) — the same
  call raised `PermissionError` before. X and TikTok correctly report `absent` (no envelope
  configured), 9GAG and Reddit `not_applicable` (no file-shaped credential). Health 200, readiness
  200 with every sub-check true, unauthenticated `/sources` 401, port 8099 loopback-only, 4 devices
  with 1 active.

- The deployment ran end to end; `remote-sources-ctl version` reports the full 40-character commit;
  loopback health and readiness answer 200; an unauthenticated data route is 401; **no application
  port is on a non-loopback address**; and **the pairing survived** — `devices` still shows
  `active: 1`.

**Verified against production this milestone (server, not the phone):**

- The 9GAG session material is read correctly, and both 9GAG source kinds now return a **named
  platform refusal** (`challenge`) rather than the generic "unreachable". The D6A6 root cause is
  fixed and proven fixed live.
- The deployment reports its exact commit; health and readiness answer 200 over loopback; an
  unauthenticated route is 401; the application port is loopback-only; the pairing survived; and
  both configured credentials are still present.

**Reported by the user during ordinary use — root-caused at D6A7c, NOT re-verified:**

- **Remote Sources showed no source and Remote History showed no history until Refresh was pressed.**
  Both were on the server throughout. The screens never loaded themselves, and — the second half —
  an empty list, an unasked screen and a failed request all rendered identically. Fixed at D6A7c;
  **no line of it has run on a device.** Rows 72–76.

**Verified against production at D6A7c (server, not the phone):**

- **The extractor probe**, sanitized and metadata-only, inside the deployed container with the
  configured session: gallery-dl **1.32.8**, exit `0`, 60 URL records, `date` on all 60, a field
  named `pinned` truthy on **3**, arrival order **not** newest-first with one inversion, and **3
  pinned posts printed before a newer post**. This is the measured cause of the pinned-post defect.
- **The Story tray answered `[]`** in 9.4 s with the session accepted — so the URL shape, exit code
  and session acceptance are live-verified, and **no live Story record has ever been observed.**
- `cbea54f` deployed and reporting itself; health and readiness 200 with every sub-check true;
  unauthenticated routes 401; port loopback-only; pairing preserved; migration `0003` applied; and
  the production data intact — 1 source, 25 items, 25 media rows, 25 confirmed operations, 2
  destinations, with the source's `include_stories` still `0` because the deployment did not touch
  it.

**Reported by the user during ordinary use — root-caused at D6A7c1, NOT re-verified:**

- **Android refused screenshots, blocked screen recording, and showed a blank white card in
  Recents.** Cause: `FLAG_SECURE` on the activity window, plus `setSecure(true)` on the video
  preview's surface. Both removed at D6A7c1 with nothing replacing them. **No line of it has run on
  a device.** Rows 87–88.

**Verified against production at D6A7c1 (server, not the phone):**

- `--post-range` bounds **logical posts**: `1-3` → 3 posts, `1-8` → 8 posts, exit `0`, against the
  deployed container with the configured session. **The probed prefix is all single-media, so the
  live run did not exercise a carousel** — the file-versus-post distinction rests on the extractor's
  source, which is unambiguous.
- `f5c0b7d` deployed and reporting itself; health and readiness `200` with every sub-check true;
  `401` on four protected routes; port loopback-only; pairing preserved; migration head unchanged at
  `0003_instagram_stories`; production data intact at 28 items / 28 confirmed operations / 2
  destinations; the source's `include_stories` still `0` / `never_enabled`.
- **The scheduler delivered three posts on its own** between the two deployments (25 → 28). No agent
  ran a check. The source is `auto_send`, so a scheduled check is a Telegram delivery.

**Unvalidated on hardware:**

- **All of D6A7e2.** The connection verdict on the card (including whether it truthfully reads
  *connected* on the handset), the corrected empty-history sentence, Preview previous/next and its
  gesture arbitration, the pan-before-page rule on a zoomed image, the Instagram Dashboard tile and
  its count, and — the one that matters most — **a Send now surviving a swipe to the next item**.
  `docs/D6A7E2_DEVICE_CHECKLIST.md`; 40 lines, every one *not attempted*. Note line 10: the user
  re-enables the Instagram source by hand, and nothing in this milestone did it for them.

- **All of D6A7e1.** `docs/D6A7E1_DEVICE_CHECKLIST.md`; every line *not attempted*. Two of its
  lines are superseded by the D6A7e2 checklist (the session-state vocabulary and the empty
  session-use sentence) and should be read from the newer file; the rest still stand.

- **All of D6A7c1.** Screenshots, screen recording, the Recents preview, the independent collection
  loads, the blocked-versus-empty distinction, and the cumulative Story count.
  `docs/D6A7C1_DEVICE_CHECKLIST.md`; every line *not attempted*.

- **All of D6A7c.** Automatic screen loading, the empty/failed/unasked distinction, pull-to-refresh
  on the Remote screens, history thumbnails and their placeholders, the carousel media count, the
  Stories toggle, its Auto-send confirmation, the Story status lines, and Story staging surviving an
  expiry. `docs/D6A7C_DEVICE_CHECKLIST.md`; every line *not attempted*.

- **All of D6A6** — the source-type and feed-mode choosers, the Ignore-race reasons, the whole
  Instagram publishing queue, and **the 12 → 13 migration**. Nothing in D6A6 has run on a device.

- **D6A5 except the version row and the manual deletion**, both of which are now verified. Still
  unverified: confirmed-versus-queued, the Failed row's removal, the Review row's Do not upload,
  Preview from a folder, orphan reservations, and the five-platform list.
- **All of D6A4.** **All of D6A2**, including all three fixes. **All of D6A1.**
- **Everything past pairing in D6A** — no connector has completed a live check → review → send.
- **All of D5C** — the duplicate checklist has **still not been run**. **All of D5B.**
- Every D5A check beyond 1–3; everything left after D4B and D4C.

**Rules.** Do not infer validation from tests, lint or a successful build — none touch a device.
**A successful deployment validates the server, never the app.** No previously listed checklist item
may be marked passed from a bug report; the user described problems, not a regression run. Manual
checklists cover only new behaviour and direct regressions.

**The durable backlog lives in `/root/work/telegram-topic-uploader/TODO.md`** and is the record of
every open item with its state and its completion evidence. This ledger is the hardware view of it;
the table is the whole of it.

## 9. Permanent product decisions

- **D6A7e4: the approved schedule presets are 2, 4, 8, 12 and 24 hours** — Attentive, Normal,
  Relaxed, Slow, Daily. Hebrew: עירני / רגיל / רגוע / איטי / יומי, each written as *בסיס: כל …*.
  **They are adaptive base intervals, not fixed promises**, and the exact server-returned
  `next_check_at` is what the user is shown. The three original wire values were not renamed; the
  two new ones are `slow` and `daily`.
- **D6A7e4: adding a source fills the name from the validation that already ran** — and a name a
  person typed is **never** overwritten by it. Opening an existing source's editor never replaces
  its stored name either; an explicit action is offered instead.
- **D6A7e4: Remote Sources is organised by platform tabs**, and tab filtering performs **no**
  separate network request — one loaded collection, projected locally.
- **D6A7e4: source sorting is one centralized, deterministic policy** applied identically in every
  tab including All. Checking, then waiting on a person, then enabled by nearest next check, then
  enabled with no time, then disabled; ties by locale-aware case-insensitive name, then stable id.
- **D6A7e2: presence is not connection, and only the server may say *connected*.** A parsed cookie
  file proves nothing about whether the platform will accept it. The server composes one
  authoritative verdict from presence, readability, the last authenticated outcome and the live
  backoff window; the app renders that verdict and never invents one, so a server too old to answer
  can claim at most *configured, unverified*. Colour never carries the meaning alone.
- **D6A7e2: a status sentence may not out-claim its own evidence.** "The server has never used a
  viewing session" was false the moment it shipped — the primary account's session had been used
  many times before tracking existed. An empty record says *nothing has been recorded since
  tracking was added*, and says that earlier uses are not represented. **When a feature can only
  see part of the history, the sentence must say which part.**
- **D6A7e2: moving between items is never an action on them.** Preview navigation redraws and
  nothing else: no transfer is cancelled, no send is withdrawn, no batch and no deletion is
  touched, and a live Send now keeps running with its progress on its own row. The navigation
  session is frozen when Preview opens and never becomes a row.
- **D6A7e2: a gesture belongs to the most specific thing under the finger.** Paging lives on the
  media surface alone, so a seek-bar drag stays a seek; a drag must be clearly horizontal to page;
  a zoomed image pans to its own edge before a further swipe pages it. Direction is arbitrated, not
  guessed.
- **D6A7e1: a cookie jar is an authenticated session, and importing one authorises this server to
  act as that account from its own location.** Only a dedicated, low-value viewing account may
  ever be imported; one shared session serves every Instagram source; adding a source logs in to
  nothing; a private target needs the viewing account approved as a follower. See §5a.
- **D6A7e1: no development, debugging or maintenance command may contact a live platform without
  the user's explicit approval of that specific run.** Operator commands that can reach a platform
  require a confirmation flag, state their bounded scope first, and record one sanitized
  session-use purpose and outcome. `classify-instagram-content` needs
  `--confirm-live-session-use` **even for a dry run**, because its dry run reads the account's
  listings live.
- **D6A7e1: a paused source is never resumed by anything but the user, one source at a time.**
  There is deliberately no bulk resume, and importing a credential re-enables nothing.
- **D6A7e1: one canonical predicate decides every count and every list.** A tile's number and the
  rows that tile opens are the same rows, by construction — no screen may hold a second
  hand-written exclusion. The Requires-review defect was exactly that, three times over.
- **D6A7e1: a transfer's lifetime is never a screen's lifetime.** Preview may start and observe an
  upload; it may not own the coroutine, the request, the claim or the cancellation. Closing
  Preview releases playback only; Back, navigation, rotation, recomposition and app-switching
  cancel nothing; **only an explicit Cancel now may stop a live transfer**.
- **D6A7e1: an explicit Send now tap is durable authorization for exactly that one item.** A
  second tap while one uploads is recorded in a FIFO chain and starts by itself; ordinary queued
  items never start on their own; **Cancel pending send** withdraws intent and nothing else; one
  media transfer is active globally, ever.
- **D6A7e1: files above 50 MB are solved by the official Telegram Local Bot API Server in local
  mode (2000 MB) in D6A7f — never by compression, transcoding, splitting a video across posts, a
  Telegram user account, TDLib-as-user, or an unofficial service.** Until it is deployed,
  oversized rows stay visible and blocked and no screen may promise otherwise.
- **D6A7e: the schedule presets mean 8, 4 and 2 hours, and the card says so.** *Relaxed* is a base of
  every 8 hours, *Normal* every 4, *Attentive* every 2. **A base is not a promise:** every interval
  is jittered by up to ±12%, a source that has just produced new posts may be checked sooner,
  repeated empty checks gradually space out, and a platform refusal starts a backoff.
- **D6A7e: the server owns every schedule time, and Android never computes one.** `last_check_at`,
  `last_success_at`, `next_check_at` and the durable `last_check` (with its `manual` / `scheduled`
  trigger) come off the wire; deriving a countdown from a preset name would look authoritative and
  be routinely wrong. Changing the preset recalculates `next_check_at` in the same `PATCH` response.
- **D6A7e: the manual Check-now cooldown and the automatic schedule are two separate clocks**, and
  the card draws both. They are commonly minutes and hours apart, and conflating them tells the user
  the wrong thing about when a Story will arrive.
- **D6A7e: a Story is checked at the source's next real check, with the feed.** On an **auto-send**
  source a newly discovered Story is delivered *during that successful check* — a check **starting**
  is not a delivery: discovery must succeed, the Story must be new, its media must stage, and the
  send must succeed.
- **D6A7e: a frozen batch's item count is audit evidence and is never rewritten.** A batch created
  with 20 items says 20 for ever, whatever the live queue does afterwards. The current queue count is
  a **different number**, shown separately.
- **D6A7e: acceptance by `JobScheduler` is not execution**, and the two are separate durable facts.
  Exactly one runner may hold a batch, decided by a guarded durable claim rather than by cancelling
  a pending platform job — cancellation is a request with a window.
- **D6A7e: a notice is a one-shot event that owns everything it says.** No sanitized reason may be
  stored beside a notice and concatenated at render time; consumption names the announcement's id.
- **D6A7e: an oversized file stays visible and is never send-ready.** It is not deleted, hidden,
  ignored or retired; it states its own size and the ceiling, and offers no send action.

- **D6A7c1: screenshots and screen recording are allowed, everywhere in the application.** No
  `FLAG_SECURE`, no `setRecentsScreenshotEnabled(false)`, no secure surface, no blur, no overlay, no
  substituted Recents preview, and no per-screen variant for pairing, settings, sources or history.
  The user needs a screenshot to report a defect and a recording to show one that spans two screens,
  and a protection that stops them doing either was costing more than it defended. **A future
  secure-screen feature requires an explicit user decision.** Guarded by
  `ScreenshotPolicySurfaceTest`.
- **D6A7c1: screenshot permission is never a substitute for secret redaction.** What makes a
  screenshot safe to share is that no token, cookie or credential is rendered in plaintext. That
  property is guarded separately and was not touched.
- **D6A7c1: a collection that was never requested is not "loaded".** An empty successful response,
  an unreachable server, invalid pairing and no server configured are four different states. Only a
  request that actually returned successfully may show an empty-state sentence.
- **D6A7c1: no shared mutable state may decide more than one concurrent request's result.** Three
  independently tracked collections reading one boolean is three collections that are not
  independent, and the winner is whichever finished last.
- **D6A7c1: a bound that was reached is not a feed that ended.** When an extractor returns exactly
  as many items as it was asked for, it stopped because it was told to — and a short window must be
  reported as a classified failure rather than imported and called complete.
- **D6A7c1: a flaky test is a defect in the gate.** It makes every "N passed" in every report worth
  less than it looks. Fix it or record it; never let it ride.
- **Local source profiles are organizational only.** A profile filters and batches Review. It selects
  no chat, no thread, no destination.
- **A local folder never auto-maps to a topic.** Routing is `manual -> manual review`.
- **Per-account mapping of local folders is ruled out** by the user, permanently.
- **Remote source/account → Telegram topic mapping is a *server* feature**, never a local-folder one.
- **Telegram confirmation is exact.** A deletion may only follow a strictly positive message ID **and**
  a committed confirmation timestamp **and** the expected destination, re-read from the durable row.
  Cancellation, retryable failure, rejection, incomplete response and `RESULT_UNKNOWN` delete nothing,
  and `RESULT_UNKNOWN` is never retried — on either side.
- **Deletion is of one exact document**, by granted tree plus recorded document ID, after re-proving
  identity, size and a fresh full SHA-256. No name matching, no listing, no recursion, no bulk form.
- **D6A6a: a scheduling bucket is not a sentence.** Two signals may share a backoff ladder and
  still be different facts. Whenever the server groups outcomes for *timing*, check that no
  user-facing enum mirrors that grouping — a challenge and a rate limit shared one, and the platform
  list spent a release telling the user the wrong reason.
- **D6A6a: trace the whole path before believing the obvious suspicion.** "A stale signal is
  outliving a newer one" was the natural reading and would have sent the fix into the server. The
  production row said `challenge`, `blocked_until=None`, `strong_signal_count=0` — there was nothing
  stale anywhere, and the defect was one missing enum member in the app.
- **D6A5: a control that silently disappears is indistinguishable from a broken one.** Offer it with
  its sanitized reason instead. This was already the rule for permanent deletion on the Review card;
  the Failed row not following it is what the device reported.
- **D6A5: strictness must be paid for by something.** Retirement refuses an unproven failure code
  *because it releases the reservation*. A removal that **keeps** the reservation keeps the duplicate
  guard, so it can safely accept what retirement refuses. Weakening the rule without keeping the
  guard would have been the unsafe version of the same change.
- **D6A5: `RESULT_UNKNOWN` receives no action, on any surface, in any milestone.** No resend, no
  ignore, no removal, no evidence change. It is refused first, before every other check.
- **D6A5: the application must state the version it is actually running**, read from the installed
  package. `BuildConfig` is the wrong source — it names what the source tree compiled as, so it
  would report the new version while the phone runs the old APK. A UI literal is worse still.
- **D6A5: "Do not upload" is not a deletion and is never described as one.** It is reversible, the
  source file is untouched, and Restore undoes it. That is what makes it safe to offer on a row that
  has no other safe action.
- **D6A5: one Preview overlay, hosted by every route that offers Preview.** A second implementation
  would mean a second autoplay policy, a second zoom, and a second chance to lose the D6A2 ownership
  rule. The defect was a missing *host*, not a missing player.
- **D6A4: a test that reads the working tree cannot detect a file missing from the release.** Ask
  Git what would ship, read the **index** rather than `HEAD`, and assert the loaded module came
  from the export — an editable install will otherwise answer the import from the checkout.
- **D6A4: a message that claims a recovery must have performed one.** A false rollback is worse
  than no rollback, because the operator reading it stops looking.
- **D6A4: a refusal must name the stage it reached.** Every path that refuses before the provider
  is asked says so; a stage that defaults to null is a failure the user cannot act on.
- **D6A4: an authenticated user pressing a button must not move the scheduler's backoff.** A
  validation records a setup-shaped signal and clears one; it never clears a rate limit and never
  writes `blocked_until` or the strong-signal count.
- **D6A3: a classification correct at the level it was written can be useless at the level somebody
  has to act on.** "The server could not use this source" and "nothing was deleted, the file is
  still there" were both true and both unactionable.
- **D6A3: never ask for something the application already knows.** A chat ID and a thread ID the app
  connected itself must never be retyped by a person.
- **D6A3: "declares no credential" is not "works right now."** Ready means the prerequisites are
  actually satisfied, answered from what this host has observed.
- **D6A2: an asynchronous result may act only on the operation and the item that own it.** It never
  navigates against whichever screen happens to be visible. Enforced by addressing — actions are
  keyed by job ID — rather than by a check somebody has to remember.
- **D6A2: a provider's silence is not proof, and neither is its refusal.** After a real deletion the
  document URI addresses nothing and providers say so in five different ways; only an open descriptor
  proves presence, and the write grant is what makes a `SecurityException` legible.
- **D6A2: a policy with a green test file is not a shipped behaviour** until something in `src/main`
  calls it and something durable records what it decided.
- **D6A1: every declared secret gets its own file and its own Keystore key.** A shared key means
  removing one credential destroys another. The Telegram bot token's file name and alias are frozen
  so an install-over upgrade still decrypts it.
- **D6A1: a successful pairing exchange is not a pairing.** The device is paired only when the token
  and the address are both stored; either failure rolls back locally and revokes the issued token on
  the server, once, and never repeats the exchange.
- **D6A: a provider's `true` is a claim, not proof.** The exact document is re-checked after the
  claim, and only a proven absence is recorded as a deletion.
- **Back is a verb, not a destination.** Preview first, otherwise pop one entry, otherwise leave
  Android's root behaviour alone. Nothing nested routes to the Dashboard.
- **Every upload keeps the file's own name.**
- **9GAG captions only**, for a 9GAG-profile folder, derived from the filename. Nothing generated.
- **Remote captions are the original platform title only** — no link, no handle, nothing generated.
- **Exact duplicates only.** Same complete SHA-256 and same exact byte size. No perceptual, partial,
  prefix, thumbnail, frame, duration or filename matching exists anywhere.
- **The server is authoritative for everything remote.** The app must never build a second job state
  machine over it.

## 10. Agent rules

- **Stop-and-ask UX gate before implementation.** Inspect the actual implementation *first*, identify
  the remaining *material* ambiguities, ask **one grouped question** with numbered options, short
  practical consequences and **no preselected default**, then stop. Edit nothing — no migration, no
  version bump, no commit, no deployment — before the answer. D4B raised two, D4C three, D5A four,
  D5B one, D5C four, D6A four, D6A2 four. D6A1, D6A3 and D6A4 raised none: each arrived with the
  evidence and the decisions already in the request, and inventing a question would have been
  ceremony.
- **Do not invent UX.**
- **Bundle compatible changes into substantial milestones.** Never ship a single hotfix alone.
- **Every requested item gets an explicit status in `TODO.md`** — completed, deliberately deferred
  with a reason, blocked, or device-untested. Nothing dropped silently.
- **Re-scope a guard, do not delete it.** If a surface test fires because a doc comment mentions a
  banned API, **reword the comment** — a guard that must be exempted to describe itself has stopped
  being a guard.
- **Preserve privacy absolutely**, per the header of this file. Every test fixture is synthetic.
- **`in-progress.md`** at the memory root: append a line before editing, remove it after pushing.
- **A source-level guard will fire on your own comments.** `MediaStore`, `token`, `password` and
  `file://` each failed a guard while appearing in prose explaining that a feature does *not* do
  that thing. **Reword the comment, never exempt the guard** — it happened four times in D6A6 alone.
- **Do not deploy a client that has never run against the service it talks to.** D6A6 was asked for
  a complete Meta publishing integration and delivered the vocabulary and the safety rules instead,
  because none of the network half can be exercised without the user's Meta App. Building the
  verifiable half well beats building all of it blind.
- **Reconcile the conversation against the durable backlog before committing. Permanent, and not
  optional.** No device report, user request, discovered defect, deferred verification, operational
  requirement or unfinished item may exist **only** in a conversation. Before the final
  agent-memory commit of any milestone, every one of them must appear in a durable file — normally
  the backlog table in the application's `TODO.md` — carrying a description, an owning
  repository/component, a state, the milestone handling it, and **the evidence required before it
  may be called completed**. The final report must list whatever is still open. **Silence is never
  equivalent to completion.**
- **"Implemented" is not "works".** Use the distinct states and never merge them: `implemented`
  (code plus **synthetic** tests), `deployed`, `installed`, `device-unverified`, `live-unverified`,
  `blocked`, `completed`. A green test suite is evidence about a test suite.
- **Deferred work stays visible.** Never delete an item from `TODO.md` because a milestone ended.
  Record the reason it was deferred and the next exact action.
- **A green Gradle gate can be a stale one.** The unit-test task does not track `build.gradle.kts`
  as an input, so a version bump leaves it UP-TO-DATE and every assertion that reads that file from
  disk goes unchecked. D6A7a was committed with ten such failures reported as success. **Run the
  final Android gate with `--rerun-tasks`,** and read the test XMLs rather than the exit code.
- **Verify a diagnostic probe before believing it.** A throwaway cookie parser that skipped
  `#HttpOnly_` lines produced a confident, wrong conclusion that the Instagram session was missing —
  those lines are exactly where session cookies live. Prefer the production module over a
  reimplementation when reading production state.
- **A green suite is not coverage, and D6A7c is the case study.** It passed 860 server and 2114
  Android tests and shipped several correctness defects. Three were invisible because **the fixtures
  agreed with the code** — every ordering fixture used single-media posts, so a file-counted window
  and a post-counted one were indistinguishable; a Story test asserted the state without asserting
  the number beside it; a harness always answered the connection call successfully, so no test could
  produce a request that was never made. One more was an **ordering** property that no single-step
  test can see. When a milestone changes a *bound*, a *count* or an *order*, write the adversarial
  fixture first.
- **A flaky test is a defect in the gate.** It makes every "N passed" in every report worth less than
  it looks. D6A7c1 found one failing about one run in three and fixed it by asserting the property
  the test's own message always claimed. **D6A7e3 found a second one of exactly the same shape** — a
  cancellation test asserting *exactly one* request had reached `MockWebServer` while racing the
  cancellation — and fixed it the same way. When a test asserts an exact count of something a race
  can change, ask what its *name* claims; that is usually the real property.
- **Two durable records that disagree are both suspect, and running the thing is the evidence.**
  D6A7e2's server test count was recorded as 1070/4 in the server repository and 1066/3 in
  agent-memory. Re-running the suite twice at the unchanged HEAD gave **1071/3**, and the skip site
  was read to prove three skips is code-determined. Neither record was right, and neither would ever
  have been caught by comparing them to each other. **Reconcile a mismatch against the artefact, not
  against the other document, and record the evidence.**
- **A signal about the *player* is not a signal about the *picture*.** D6A7e3's black-video defect
  had `onPrepared` fired, audio focus granted, no `MediaPlayer` error, and an advancing position —
  every one of them true while the screen was black. Wherever a subsystem reports readiness, ask
  what the *user* would call success and observe **that** instead. Here: the platform's
  first-video-frame signal, or a real frame arriving on the texture.
- **Decide gesture ownership before consuming anything.** A generic drag detector claims a gesture
  the moment touch slop is crossed *in any direction*, so a scrollable parent containing a
  horizontally-paging child silently loses its scroll. D6A7e3's Preview could not be scrolled at all
  from the video. A vertical drag must reach the parent **unconsumed**.
- **Never label a failure with a cause you did not establish.** "Unsupported codec" was the tempting
  answer for every black video and would have been wrong for the ones caused by the surface. Map a
  platform error only where the platform names a cause; everything else is *unknown*, said plainly.
- **A green lint task is not a clean lint report.** `./gradlew lint` exits zero on *warnings*, so a
  gate that reads the exit code passes while this project's zero-issue bar does not. D6A7b reported
  "lint clean" with three warnings present, one of them an unused string that was never referenced
  even at its own commit. **Read `app/build/reports/lint-results-debug.xml`.** This is the same
  shape as the stale-Gradle-task trap, in a different task.
- **Measure the extractor before designing around it.** D6A7c's whole ordering fix rests on a
  sanitized, bounded, metadata-only probe of the *exact installed version* — which found a field
  named `pinned`, proved the printed order is not chronological, and proved the order is **observed
  rather than guaranteed**. Reading the installed package's source is stronger evidence than memory
  for field names, and a live probe is the only evidence for ordering. **Record what the probe could
  not establish as loudly as what it could:** the Story tray was empty, so no Story field name in
  this system has ever been confirmed against a real record.
- **Distrust prose written ahead of the fact.** A resumed session must verify claims against
  artefacts on disk — test XMLs, lint reports, APK timestamps and sizes — never against what a
  `TODO.md` or a checklist says was done. D6A5 was resumed from a state where both claimed results
  that had not happened.

## 11. Roadmap

**The authoritative, itemised backlog is the table in
`/root/work/telegram-topic-uploader/TODO.md`** — 219 rows after D6A7e7b, each with an owner, a state and the
evidence required to close it. This list is the ordering; that table is the record.

**Newest first, as of D6A7e8.** `docs/D6A7E8_DEVICE_CHECKLIST.md` (18 lines, rows 220–227) is the
current checklist and nothing in it has been attempted. **Line 14 is the highest-value single line
in the whole backlog**: one *Check source* against a real TikTok profile, on the deployed connector
correction. It is the acceptance test for the server's D6A7e8, it is row 220, and no agent may
perform it. Lines 5–8 answer the pasted-link cleaning on TikTok, 9–10 on Instagram, 11–12 whether
meaningful path components survive, and 13 whether a short share link is left alone.

`docs/D6A7E7B_DEVICE_CHECKLIST.md` (71 lines, rows 192–219) is **partly reported**: the seventh run
answered lines 9, 14, 15 and 16, closing rows 193 and 194. **Everything else in it remains
unattempted** — lines 42–46 (the launcher icon), 47–58 (the incremental scan), 59–68 (the Archive),
21–39 (the History times and details) and 1–5 (install-over survival) produced no evidence at all.
`docs/D6A7E7A_DEVICE_CHECKLIST.md` (46 lines, rows 179–191) remains entirely unattempted beneath it.

**Recorded as future product shape, not as work in progress:** the official Meta Instagram publisher
is **multi-account from day one** (rows 213–219), safe archive pruning needs proof that nothing
depends on a row before it may be removed (row 211), and an explicit full-integrity rescan is a
visible user action if it is ever wanted (row 212). None of the three is implemented, and the
existing local `ACTION_SEND` Instagram route is untouched and still proves no publication.

1. **Device-validate D6A7e3 first — `docs/D6A7E3_DEVICE_CHECKLIST.md`, 21 lines.** It repairs the
   three defects the first physical run of D6A7e2 found, and none of them may be called fixed until
   this runs. Read the three notes at the top before anything else — all three describe intended
   behaviour that could read as broken.

   **The three lines that decide the milestone:** **5–6** (a rightward swipe opens the *next* item),
   **8** (a vertical drag begun in the centre of the video scrolls the screen to the controls below
   it), and **12** — the most valuable single line available — a previously black video showing
   either a real *moving* frame or one of seven exact non-black sentences, **with the exact sentence
   written down**. Whichever it is, it is the first evidence anyone has had about why those clips
   would not show. **Line 13** matters nearly as much: no audio may continue behind a terminal
   playback error.

   `docs/D6A7E2_DEVICE_CHECKLIST.md` is superseded and carries a note saying so; its lines 23–24 now
   describe the *old* swipe direction and must not be used against this build.

2. **Then device-validate D6A7c1 — `docs/D6A7C1_DEVICE_CHECKLIST.md`.** Read its first three notes
   before anything else; all three describe correct behaviour that reads as broken.

   **§B is the quickest and is the reported defect** — take a screenshot on two screens, record the
   screen across two screens, capture a video preview and confirm it is not black, and open Recents
   and confirm the real preview is there. Then §D, the failure-is-never-an-empty-list checks.
   **§E1 step 32** remains the most valuable line available and still takes a real day. Rows 87–98.

3. **Then D6A7c — `docs/D6A7C_DEVICE_CHECKLIST.md`.** Read its opening two notes
   before anything else: the existing 25 history rows show **placeholders** rather than pictures
   (previews are fetched at discovery, and those deliveries predate the feature), and **no live
   Story has ever been imported** (the probe found the tray empty). Both are correct results that
   read as bugs.

   **§A is the reported defect** — open Remote Sources and Remote History from a cold launch
   *without pressing Refresh* and see the source and the 25 deliveries appear by themselves. **§F1
   step 40 is the most valuable line in the milestone**: a Story left in Remote Review until its
   Instagram copy has expired, then sent successfully. It takes a real day, and it is the only proof
   that Story staging does what it exists for. Rows 72–86.

4. **Then D6A7b — `docs/D6A7B_DEVICE_CHECKLIST.md` §B.** Press **Check** on the
   Instagram source and confirm it settles into one of five stated outcomes rather than sitting on
   *Checking*. The server half is live-verified; the phone's loading state is what was reported and
   is the one thing still unproved. Rows 65, 67, 68, 70.
5. **Then D6A7a — `docs/D6A7A_DEVICE_CHECKLIST.md`.** It repairs four defects the
   handset found, and rows 59–63 stay `device-unverified` until it is run. The two lines that matter
   most: a confirmed file is **absent from Review** after a rescan while still shown under Confirmed
   on the folder page (§B), and its local copy actually disappears from the **Android file manager**
   after the delete (§C). §D and §E are the queue: **Upload queue** must always answer, and
   cancelling a batch that never started must release it and leave every item queued. §F is the
   recovery path for anything already stranded as uploading on that handset.
6. **Then D6A7 §B — the connection defect.** Validate any source the server
   refuses, **while watching the global connection card**: it must not move, and the message must
   end with the server's own code in brackets. **Write that code down.** Then Retry, and confirm
   nothing changes, because nothing had gone wrong.
7. **Then D6A7 §C — validate an Instagram source.** This is the first honest Instagram validation
   this deployment has ever been able to answer; every previous one hit the 500. Whatever it says,
   record the exact code. **Do not export cookies** unless it says the session is missing or
   rejected — it was neither.
8. **Then the rest of `docs/D6A7_DEVICE_CHECKLIST.md`**, then D6A6a's one check: the 9GAG row must
   say *human-verification challenge*, not *rate limit*, and keep saying it after a refresh and a
   restart. Row 58.
9. **Then the rest of `docs/D6A6_DEVICE_CHECKLIST.md`.** §3 the source-type and feed-mode choosers,
   §4 the Ignore-race reasons, §5 the Instagram publishing queue — where **step 23** (the file
   survives "remove from publishing") is the one that matters most. If installing from code 30 or
   earlier, §2 the migration check comes before all of it.
10. **Finish device-validating D6A5**: confirmed-versus-queued, the Failed row's removal, the Review
   row's Do not upload, Preview from a folder, orphan reservations, the five-platform list.
11. **9GAG live discovery is blocked by the platform** — both source types are challenged from this
   host with a correct session. There is nothing to fix in the connector; it needs a session or a
   route 9GAG accepts. **Never add challenge solving, proxy rotation or retry-until-allowed.**
12. **The official Meta Instagram publisher** — rows 43–54. Blocked on the user creating the Meta App
   and authorizing the account (rows 47–48) before any of it can be verified.
13. Live-validate one remote source against a **disposable** topic. Pairing works and must not be
   reworked; **nothing past pairing has ever run end to end.**
14. Credentials for **X and TikTok** remote sources, then a live check for each. **Instagram is
   already configured and its material is now `ready`** — that session needs nothing.
15. Decide `BulkSendDestination`: either feed the policy from a surface that can hold pointed items,
    or withdraw the two `ReviewGridScreen` branches that cannot render today.
16. Whatever the device reports about D6A4, D5C and D5B.
17. Still owed from D4B/D4C: deletion retries, batch deletion, blocked deletion states, the launch
   scan, the Hebrew Preview.
18. Multi-item / carousel outbound sharing — deliberately not implemented, never to be claimed
    without device evidence.
19. Optional content-based topic *suggestions* on Review — never automatic routing.
20. Result-unknown reconciliation for local uploads, and evidence-based resolution of an unowned or
    ambiguous legacy reservation (D3A.1).
21. **Explicitly not on the roadmap:** per-account mapping of local folders; Instagram-native music,
    stickers, polls or editing; publishing by scraping, UI automation or credentials.

## 12. New-chat startup procedure

1. **Read this file, then `cc-latest.md`, then the server's `cc-latest.md`.**
2. **Verify any supplied HEADs against GitHub** before trusting them.
3. **Treat repository and memory contents as the source of truth**, not any summary — including this
   one — if the two disagree.
   **When the user supplies SHAs, read agent-memory before responding**: confirm each against
   `origin/main`, and only then answer. A supplied SHA is a claim to verify, never a fact to repeat.
4. **Continue from the roadmap above** without asking the user to reconstruct the project's history.
