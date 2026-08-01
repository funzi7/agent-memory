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

### Permanent manager-workflow rules — recorded so no later chat rediscovers them

- **The user launches the complete three-pane development session with the `apps` command.**
  **Do not** hand them `cd`, `cauto`, or any other session-entry command before a future prompt
  unless they explicitly ask for one. They already know how to open the session; offering it every
  time is noise.
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
still `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4`. **D6A7e2 (code 41,
`0.13.16-d6a7e2`) supersedes every earlier build; no intermediate version needs installing first.**

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

### The Instagram viewing session, as D6A7e4 found it — read this before claiming it is connected

A **read-only** probe taken before deploying found the dedicated viewing account's stored connection
state as **`rejected`**, `last_signal = authentication_expired`, following a **scheduled** check at
09:32 UTC on 2026-08-01. The same row records a successful authenticated operation at 06:26 UTC the
same morning, so it was working and stopped being accepted between those two times.

**D6A7e4 did not cause this and did not repair it.** It ran no validation, no check and no operator
probe; it did not replace, clear or re-validate the credential. The post-deployment probe showed the
credential's configuration timestamp unchanged and both sources still enabled on `normal`.

**Do not repeat "the viewing session is connected" from §4c onward** — that was true at D6A7e2 and
was still true on the morning of 2026-08-01. It is a claim to re-verify, not a fact to carry.

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
| **TikTok** | **implemented at D6A5** (gallery-dl + yt-dlp) | **required** | **no** |

All five are selectable in the Android app since D6A5, each with its own state sentence. **Being
selectable is not being live-tested**, and the two must never be conflated in a report.

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
`/root/work/telegram-topic-uploader/TODO.md`** — 120 rows after D6A7e3, each with an owner, a state and the
evidence required to close it. This list is the ordering; that table is the record.

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
