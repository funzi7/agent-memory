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

## 3. Installation rule

Always show the Termux `cp` command before installation:

```
cp /root/work/telegram-topic-uploader/app/build/outputs/apk/debug/app-debug.apk /sdcard/Download/
```

**Install over the existing app.** The debug certificate has not changed since D5A — at D6A7c it is
still `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4`. **D6A7c (code 36,
`0.13.11-d6a7c`) supersedes every earlier build; no intermediate version needs installing first.**

**D6A6 moved the Room schema 12 → 13** — one new table for the Instagram publishing queue, nothing
else touched, the first schema move since D5C. **None of D6A6a, D6A7, D6A7a, D6A7b or D6A7c moves it again.** If you are coming
from code 30 or earlier the migration still runs on this install: check Directories, Review, the
Queue and History afterwards, because anything missing is a migration defect, not a cosmetic one.
Since D6A5 the **Settings screen states the installed version**, read from the package itself —
check it before recording any device answer, because a checklist answered against the previous
build reads identically to one answered against this one.
**Do not uninstall** — it destroys the database, and with it every folder grant, destination, queue
item, confirmation, ignore marker and deletion tombstone.

## 4. Current completed milestone

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
| **Instagram** | **implemented at D6A5** (gallery-dl, Instaloader fallback) | **required** | **no** |
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

**Unvalidated on hardware:**

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
`/root/work/telegram-topic-uploader/TODO.md`** — 86 rows, each with an owner, a state and the
evidence required to close it. This list is the ordering; that table is the record.

1. **Device-validate D6A7c first — `docs/D6A7C_DEVICE_CHECKLIST.md`.** Read its opening two notes
   before anything else: the existing 25 history rows show **placeholders** rather than pictures
   (previews are fetched at discovery, and those deliveries predate the feature), and **no live
   Story has ever been imported** (the probe found the tray empty). Both are correct results that
   read as bugs.

   **§A is the reported defect** — open Remote Sources and Remote History from a cold launch
   *without pressing Refresh* and see the source and the 25 deliveries appear by themselves. **§F1
   step 40 is the most valuable line in the milestone**: a Story left in Remote Review until its
   Instagram copy has expired, then sent successfully. It takes a real day, and it is the only proof
   that Story staging does what it exists for. Rows 72–86.

2. **Then D6A7b — `docs/D6A7B_DEVICE_CHECKLIST.md` §B.** Press **Check** on the
   Instagram source and confirm it settles into one of five stated outcomes rather than sitting on
   *Checking*. The server half is live-verified; the phone's loading state is what was reported and
   is the one thing still unproved. Rows 65, 67, 68, 70.
3. **Then D6A7a — `docs/D6A7A_DEVICE_CHECKLIST.md`.** It repairs four defects the
   handset found, and rows 59–63 stay `device-unverified` until it is run. The two lines that matter
   most: a confirmed file is **absent from Review** after a rescan while still shown under Confirmed
   on the folder page (§B), and its local copy actually disappears from the **Android file manager**
   after the delete (§C). §D and §E are the queue: **Upload queue** must always answer, and
   cancelling a batch that never started must release it and leave every item queued. §F is the
   recovery path for anything already stranded as uploading on that handset.
4. **Then D6A7 §B — the connection defect.** Validate any source the server
   refuses, **while watching the global connection card**: it must not move, and the message must
   end with the server's own code in brackets. **Write that code down.** Then Retry, and confirm
   nothing changes, because nothing had gone wrong.
5. **Then D6A7 §C — validate an Instagram source.** This is the first honest Instagram validation
   this deployment has ever been able to answer; every previous one hit the 500. Whatever it says,
   record the exact code. **Do not export cookies** unless it says the session is missing or
   rejected — it was neither.
6. **Then the rest of `docs/D6A7_DEVICE_CHECKLIST.md`**, then D6A6a's one check: the 9GAG row must
   say *human-verification challenge*, not *rate limit*, and keep saying it after a refresh and a
   restart. Row 58.
7. **Then the rest of `docs/D6A6_DEVICE_CHECKLIST.md`.** §3 the source-type and feed-mode choosers,
   §4 the Ignore-race reasons, §5 the Instagram publishing queue — where **step 23** (the file
   survives "remove from publishing") is the one that matters most. If installing from code 30 or
   earlier, §2 the migration check comes before all of it.
8. **Finish device-validating D6A5**: confirmed-versus-queued, the Failed row's removal, the Review
   row's Do not upload, Preview from a folder, orphan reservations, the five-platform list.
9. **9GAG live discovery is blocked by the platform** — both source types are challenged from this
   host with a correct session. There is nothing to fix in the connector; it needs a session or a
   route 9GAG accepts. **Never add challenge solving, proxy rotation or retry-until-allowed.**
10. **The official Meta Instagram publisher** — rows 43–54. Blocked on the user creating the Meta App
   and authorizing the account (rows 47–48) before any of it can be verified.
11. Live-validate one remote source against a **disposable** topic. Pairing works and must not be
   reworked; **nothing past pairing has ever run end to end.**
12. Credentials for **X and TikTok** remote sources, then a live check for each. **Instagram is
   already configured and its material is now `ready`** — that session needs nothing.
13. Decide `BulkSendDestination`: either feed the policy from a surface that can hold pointed items,
    or withdraw the two `ReviewGridScreen` branches that cannot render today.
14. Whatever the device reports about D6A4, D5C and D5B.
15. Still owed from D4B/D4C: deletion retries, batch deletion, blocked deletion states, the launch
   scan, the Hebrew Preview.
16. Multi-item / carousel outbound sharing — deliberately not implemented, never to be claimed
    without device evidence.
17. Optional content-based topic *suggestions* on Review — never automatic routing.
18. Result-unknown reconciliation for local uploads, and evidence-based resolution of an unowned or
    ambiguous legacy reservation (D3A.1).
19. **Explicitly not on the roadmap:** per-account mapping of local folders; Instagram-native music,
    stickers, polls or editing; publishing by scraping, UI automation or credentials.

## 12. New-chat startup procedure

1. **Read this file, then `cc-latest.md`, then the server's `cc-latest.md`.**
2. **Verify any supplied HEADs against GitHub** before trusting them.
3. **Treat repository and memory contents as the source of truth**, not any summary — including this
   one — if the two disagree.
   **When the user supplies SHAs, read agent-memory before responding**: confirm each against
   `origin/main`, and only then answer. A supplied SHA is a claim to verify, never a fact to repeat.
4. **Continue from the roadmap above** without asking the user to reconstruct the project's history.
