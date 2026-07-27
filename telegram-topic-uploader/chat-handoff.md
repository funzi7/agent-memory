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

**Install over the existing app.** The debug certificate has not changed since D5A — at D6A5 it is
still `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4`. **D6A5 (code 30,
`0.13.5-d6a5`) supersedes every earlier build; no intermediate version needs installing first.**
Since D6A5 the **Settings screen states the installed version**, read from the package itself —
check it before recording any device answer, because a checklist answered against the previous
build reads identically to one answered against this one.
**Do not uninstall** — it destroys the database, and with it every folder grant, destination, queue
item, confirmation, ignore marker and deletion tombstone.

## 4. Current completed milestone

**D6A5** — opened by two device reports that point in opposite directions, and joined by four more
while it was being written. **The session was interrupted by a Termux kill and resumed**; see
`cc-latest.md` for what survived and what had been claimed but not done.

> **Deletion after a Telegram-confirmed upload works on hardware, and so does external deletion
> followed by a scan.** Neither was rewritten. The broken path was the *manual* one, and the reason
> is why: the post-upload path counts **other** jobs and excludes the job that licensed it, while
> the manual gate counted every job — including the `AWAITING_ROUTING` one that is what puts an item
> in Review — and so refused before the provider was ever asked.

| Workstream | What it was |
| --- | --- |
| **1. Confirmed is not queued** | `ALREADY_QUEUED` collapsed three unrelated facts into one verdict. Nine `DestinationRelationship` states, one pure policy, and the queued sentence reachable from exactly one of them. A confirmed item gets a dialog offering delete / keep / a different topic. |
| **2. The manual deletion reaches the provider** | One line: `SOURCE_DEPENDENT_STATUSES` included the statuses every un-uploaded item has. `SourceDependencyPolicy` separates a preparation that committed to a destination from one that did not. **D6A4's diagnosis was right — the missing sentence was the evidence.** |
| **3. Orphan reservations** | Released only when provably orphaned; never one owned by a live job, a confirmed upload, a `RESULT_UNKNOWN`, an album member or a batch operation. |
| **4. Five platforms** | Reddit, X, 9GAG, Instagram, TikTok, each with its own state sentence. The server stays the authority. |
| **5. The installed version, in Settings** | Read from `PackageManager`, never a literal. **`BuildConfig` was rejected on purpose**: it reports what the *source* compiled as, so it would name the new version while the phone runs the old APK — the exact confusion the row exists to end. |
| **6. A failed item can be removed** | The mechanism existed; the row drew **nothing** when the strict rule refused. It now always draws the control, disabled with its reason when it must be, plus a dismissal that keeps the reservation. |
| **7. A Review item can leave Review** | Review's *attention* card had one recovery action and no way out. It now offers **Do not upload**, or says why not. Reversible, and never called a deletion. |
| **8. Preview from a folder** | The overlay was hosted by two routes and the folder page was not one of them. The folder route now hosts the **same** overlay, not a second player. |

| Field | Value |
| --- | --- |
| App version | code 30, `0.13.5-d6a5` |
| App HEAD | `4e36dcc7ef23266fce772910e319d141c6916ccc` |
| Server HEAD | `cb0174765306f429225b299845d6f11456dc666d` |
| Room schema | **12 — unchanged.** No migration runs. |
| App unit tests | 1869, 0 failures. Lint clean. Both assembles succeed. |
| Server tests | 594 passed, 2 skipped. `ruff` and `mypy` clean. |
| Install | over the existing app, **never uninstall, never clear data** |
| **Deployment** | **`cb01747` is deployed and healthy.** `version` reports the full 40-character commit — **never `null` again** — and `devices` still shows **active: 1**. |
| APK | copied to Downloads as `TelegramTopicUploader-0.13.5-d6a5.apk`, **byte-for-byte identical** to the build output |
| Hardware-proven | Pairing, authenticated requests, the D6A3 destination selector, deletion **after** a confirmed upload, external deletion + scan |
| Never checked | **All of D6A5.** All of D6A4. D6A2's Preview ownership and album settlement. Any end-to-end remote send. |

**The D6A4 outage is closed.** The host is no longer running a hand-copied tree: it runs exactly
`cb01747` and reports that commit itself.

**Do this first:** install the APK over the existing app, **open Settings and confirm it reads
`0.13.5-d6a5` / `30`**, then work `docs/D6A5_DEVICE_CHECKLIST.md` in order. Nothing needs doing on
the VPS.

Previous: **D6A4** — a hotfix milestone opened by a **production outage** and three device reports.

> **The D6A3 destination selector works on hardware.** Pairing stayed connected, the chat and topic
> identifier fields are gone, and choosing a topic by name is the flow. **Preserved untouched.**

| Workstream | What it was |
| --- | --- |
| **1. Release integrity** | `.gitignore` carried an unanchored `secrets/` rule that also matched `src/remote_sources/secrets/`, so the package was **never tracked**; `git archive` shipped without it and `rsync --delete` removed the host's copy. Rules anchored to the root, package tracked, plus `scripts/release-preflight` and tests that read the **index**. |
| **2. Real rollback** | The old one printed *"attempting to restart the previous release"* and ran `docker compose up -d` against the **already-promoted broken tree**. It now snapshots before promotion and restores tree, marker and verified database, or says `ROLLBACK FAILED`. |
| **3. Release marker** | `version` answered `deployed_commit: null` because it read a **host** path the container does not mount. Now inside the bind-mounted state directory. **Verified fixed in production at D6A5.** |
| **4. 9GAG readiness** | Every classification has its own sentence; validation records a sanitized platform signal. |
| **5. Deletion diagnostics** | Three stages added, every refusal carries one. **The absence of the sentence was the finding** — and D6A5 proved it: the provider was never asked. |
| **6. Animated GIFs** | `MediaKind.ANIMATION`, 9GAG `Animated`, Reddit `.gif`/`.gifv`/gallery/preview, `sendAnimation`. |

Previous: **D6A3** (`309ae0d`, code 28), **D6A2** (`3cdfdd8`, code 27), **D6A1** (`2a0f74e`, code 26),
**D6A** (`d209e64`, code 25), **D5C** (`97125dc`, code 24) — **all device-untested in full**.

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
| **9GAG** | implemented; payload shape verified against the live site | optional server-side cookies | **refused live — 403**, classified `setup_required` |
| **Reddit** | implemented (`u/…` and `r/…`) | **required** — anonymous is 403 | **no** |
| **X** | implemented (gallery-dl + cookies) | **required** | **no** |
| **Instagram** | **implemented at D6A5** (gallery-dl, Instaloader fallback) | **required** | **no** |
| **TikTok** | **implemented at D6A5** (gallery-dl + yt-dlp) | **required** | **no** |

All five are selectable in the Android app since D6A5, each with its own state sentence. **Being
selectable is not being live-tested**, and the two must never be conflated in a report.

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

**Reported by the user during ordinary use — currently FAILED on hardware:**

- **Manual permanent deletion without upload.** Root-caused in D6A5 to one line in
  `SOURCE_DEPENDENT_STATUSES`; **not re-verified on a device.**
- **A confirmed upload described as "already queued"**, with an empty Upload Queue. Fixed in D6A5;
  **not re-verified.**
- **A terminal Failed item with no removal action.** Fixed in D6A5; **not re-verified.**
- **A Review item with no action that removes it from Review.** Fixed in D6A5; **not re-verified.**
- **Preview from inside a folder did nothing.** Root-caused to a missing overlay host and fixed in
  D6A5; **not re-verified.**
- **A 42-item send:** album failure, three items missing, album rows stuck in the Queue. Fixed in
  D6A; **not re-verified.** The 50 MB suspicion is **consistent with the evidence but not proven**.
- **Selection actions unreachable without scrolling to the top.** Fixed; not re-verified.

**Verified against production this milestone (server, not the phone):**

- The deployment ran end to end; `remote-sources-ctl version` reports the full 40-character commit;
  loopback health and readiness answer 200; an unauthenticated data route is 401; **no application
  port is on a non-loopback address**; and **the pairing survived** — `devices` still shows
  `active: 1`.

**Unvalidated on hardware:**

- **All of D6A5.** **All of D6A4.** **All of D6A2**, including all three fixes. **All of D6A1.**
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
- **Distrust prose written ahead of the fact.** A resumed session must verify claims against
  artefacts on disk — test XMLs, lint reports, APK timestamps and sizes — never against what a
  `TODO.md` or a checklist says was done. D6A5 was resumed from a state where both claimed results
  that had not happened.

## 11. Roadmap

**The authoritative, itemised backlog is the table in
`/root/work/telegram-topic-uploader/TODO.md`** — every reported item, its owner, its state and the
evidence required to close it. This list is the ordering; that table is the record.

1. **Device-validate D6A5**, `docs/D6A5_DEVICE_CHECKLIST.md`, **in order**. Confirm the Settings
   version first — every other answer depends on which build produced it. Priority: **§1 the manual
   deletion**, which **deletes real files** — disposable copies in a disposable folder only; then §3
   confirmed-versus-queued; then §6 the four new findings; then §5 the five platforms.
   **The server needs nothing** — `cb01747` is already deployed and healthy.
2. Live-validate one remote source against a **disposable** topic — the server's
   `docs/D6A_LIVE_CHECKLIST.md` carries the exact order. Pairing works and must not be reworked;
   **nothing past pairing has ever run end to end.**
3. Credentials for Instagram and TikTok, then a live check for each. Both are implemented and both
   correctly report setup-required until a session exists on the server.
4. Whatever the device reports about D6A4, D5C and D5B.
5. Still owed from D4B/D4C: deletion retries, batch deletion, blocked deletion states, the launch
   scan, the Hebrew Preview.
6. A manual-resolution affordance for a remote `RESULT_UNKNOWN`. Recorded correctly and never
   retried, but resolving one is currently "look at the topic and decide".
7. Deferred from D6A5: the post-tap ignore refusal is still one generic sentence. The row explains
   pre-emptively, so this only shows after a race.
8. **Stories and expiring content** stay a separate opt-in schedule, deferred.
9. Optional content-based topic *suggestions* on Review — never automatic routing.
10. Result-unknown reconciliation that never re-sends without evidence, and evidence-based
    resolution of an unowned or ambiguous legacy reservation (D3A.1).
11. **Explicitly not on the roadmap:** per-account mapping of local folders.

## 12. New-chat startup procedure

1. **Read this file, then `cc-latest.md`, then the server's `cc-latest.md`.**
2. **Verify any supplied HEADs against GitHub** before trusting them.
3. **Treat repository and memory contents as the source of truth**, not any summary — including this
   one — if the two disagree.
   **When the user supplies SHAs, read agent-memory before responding**: confirm each against
   `origin/main`, and only then answer. A supplied SHA is a claim to verify, never a fact to repeat.
4. **Continue from the roadmap above** without asking the user to reconstruct the project's history.
