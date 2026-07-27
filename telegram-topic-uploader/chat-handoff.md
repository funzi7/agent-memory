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

**Install over the existing app.** The debug certificate has not changed since D5A — at D6A6 it is
still `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4`. **D6A6 (code 31,
`0.13.6-d6a6`) supersedes every earlier build; no intermediate version needs installing first.**

**D6A6 moves the Room schema 12 → 13** — one new table for the Instagram publishing queue, nothing
else touched. It is the first schema move since D5C. Check Directories, Review, the Queue and
History after installing; anything missing is a migration defect, not a cosmetic one.
Since D6A5 the **Settings screen states the installed version**, read from the package itself —
check it before recording any device answer, because a checklist answered against the previous
build reads identically to one answered against this one.
**Do not uninstall** — it destroys the database, and with it every folder grant, destination, queue
item, confirmation, ignore marker and deletion tombstone.

## 4. Current completed milestone

**D6A6** — one root cause behind two failing 9GAG checks, the Interest source type, and local
Instagram publishing.

> **The reported symptom was one message: "the server could not reach the platform right now", for
> an Interest source *and* for an ordinary profile.** It was neither a network fault nor two bugs.
> `remote-sources-configure ninegag-cookies` stored the file verbatim and the adapter pushed it into
> a `Cookie:` header; the operator supplied the ordinary Netscape `cookies.txt`, which is multi-line
> and therefore not a legal header value, so `httpx` refused **before a byte left the process**. The
> exception was caught with genuine transport faults. DNS, TCP, TLS and HTTP were never attempted —
> which is exactly why both source kinds produced the same sentence.

| Workstream | What it was |
| --- | --- |
| **1. The cookie root cause** | Both jar and header formats are read; an unusable file is refused **at import time**; a credential this server cannot use is `SETUP_REQUIRED`, never "unreachable". `#HttpOnly_` lines are cookies, not comments. A challenge page is `CHALLENGE` **whatever status carries it** — 9GAG serves its anti-bot page with a 403, and classifying from the status told an operator with a working session to configure one. |
| **2. 9GAG Interest** | Its own source type, never a mode flag. Cross-type refusal **by name** in both directions. Feed modes **proved live**: `/hot` and `/fresh` exist, `/trending`, `/top` and `/new` are 404. The bare path is stored explicitly as `hot`. A reserved segment can no longer become an account name — a trailing slash was enough. |
| **3. Pulled forward** | Remote `RESULT_UNKNOWN` resolution (two answers, neither a resend); the per-item Ignore race (four reasons, not one). |
| **4. Instagram publishing** | A destination and a durable queue in **its own table**, never overloading a Telegram status. `ACTION_SEND` + `content://` + `ClipData` + a non-exported FileProvider over one cache directory. **Opening Instagram is never publication**; the published state comes only from the user and is undoable. Removing from the queue never deletes a file. |
| **5. The official Meta publisher** | **Vocabulary and safety rules only.** The executor is deliberately not built — see below. |

| Field | Value |
| --- | --- |
| App version | code 31, `0.13.6-d6a6` |
| App HEAD | `a0720d7300cd66eb3f0d1aed2cc46868a646d3fe` |
| Server HEAD | `a985e2da51c7681efbb6c036e3b96e4d31920f26` — **deployed and verified** |
| Room schema | **12 → 13.** One additive table; no existing table, column or row touched. |
| App unit tests | 1913, 0 failures. Lint clean. Both assembles succeed. |
| Server tests | 691 passed, 4 skipped. `ruff`, `mypy` and the release preflight clean. |
| APK | `TelegramTopicUploader-0.13.6-d6a6.apk`, byte-for-byte identical to the build output |
| Hardware-proven | Unchanged from D6A5. **Nothing in D6A6 has run on a device.** |

**The 9GAG defect is fixed and proven fixed in production** — the session is read correctly and the
message changed from "unreachable" to a named refusal. **9GAG nonetheless refuses this host:** both
`/u/<name>/posts` and `/interest/<slug>` answer with an anti-bot challenge while the site root
answers 200. Live 9GAG discovery is blocked **by the platform**, and this connector deliberately has
no challenge solving, no proxy rotation and no retry-until-allowed.

### The official Meta Instagram publisher is not implemented, and that was deliberate

Requested mid-milestone. **Implemented:** the durable vocabulary (16 publish states, six publication
types, account type) and every rule decidable from state alone — Story eligibility from *Meta's*
account type rather than a local setting, the bounded missed-schedule grace period, carousel bounds,
cancel and retry safety, and the classification making an undetermined publish `RESULT_UNKNOWN`
rather than a retry. 23 tests, none able to produce a published state.

**Not implemented:** the OAuth flow, the container-workflow executor, server-side scheduling and the
Meta-readable media delivery boundary.

> **Preserve this judgement rather than re-litigating it.** None of them can be exercised without
> the user's Meta App and authorization, and a publishing client that has never once run against
> Meta is not something to deploy to a production server on the strength of mocked tests. The parts
> that are dangerous to get wrong **and** verifiable without an account are the parts that exist.

Rows 43–54 of the application's `TODO.md` carry it, with owners, states and required evidence. Rows
47–48 are blocked on the user. **No Meta app secret or access token may ever be requested in chat.**

Previous: **D6A5** — confirmed-versus-queued, a manual deletion that finally reached the provider,
five platforms, and four device findings added mid-milestone. Its headline result: **manual
permanent deletion without upload now works on hardware**, closing the defect reported at D6A.

Previous: **D6A4** — the production outage, release integrity, a rollback that restores, a release
marker the container can read, 9GAG readiness, animated media.

Previous: D6A3 (`309ae0d`, code 28), D6A2 (`3cdfdd8`, code 27), D6A1 (`2a0f74e`, code 26),
D6A (`d209e64`, code 25), D5C (`97125dc`, code 24).

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
| **9GAG** | **accounts and Interests** — two distinct source types | optional server-side cookies, **configured** | **refused live — anti-bot challenge on every deep path**, classified `challenge` |
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

**Verified against production this milestone (server, not the phone):**

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

**Unvalidated on hardware:**

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
- **Distrust prose written ahead of the fact.** A resumed session must verify claims against
  artefacts on disk — test XMLs, lint reports, APK timestamps and sizes — never against what a
  `TODO.md` or a checklist says was done. D6A5 was resumed from a state where both claimed results
  that had not happened.

## 11. Roadmap

**The authoritative, itemised backlog is the table in
`/root/work/telegram-topic-uploader/TODO.md`** — 54 rows, each with an owner, a state and the
evidence required to close it. This list is the ordering; that table is the record.

1. **Device-validate D6A6**, `docs/D6A6_DEVICE_CHECKLIST.md`. **The migration check comes first**:
   schema 12 → 13 runs on this install, and anything missing from Directories, Review, the Queue or
   History afterwards is a defect worth stopping for. Then the 9GAG source-type choosers, then the
   Instagram publishing queue — where step 20 (the file survives "remove from publishing") is the
   one that matters. **The server needs nothing.**
2. **Finish device-validating D6A5**: confirmed-versus-queued, the Failed row's removal, the Review
   row's Do not upload, Preview from a folder, orphan reservations, the five-platform list.
3. **The official Meta Instagram publisher** — rows 43–54. Blocked on the user creating the Meta App
   and authorizing the account (rows 47–48) before any of it can be verified.
4. **9GAG live discovery** is blocked by the platform's anti-bot challenge, not by this code. It
   needs a session or a route 9GAG accepts from this host; there is nothing to fix in the connector.
5. Live-validate one remote source against a **disposable** topic. Pairing works and must not be
   reworked; **nothing past pairing has ever run end to end.**
6. Credentials for Instagram and TikTok remote sources, then a live check for each.
7. Whatever the device reports about D6A4, D5C and D5B.
8. Still owed from D4B/D4C: deletion retries, batch deletion, blocked deletion states, the launch
   scan, the Hebrew Preview.
9. Multi-item / carousel outbound sharing — deliberately not implemented, and not to be claimed
   without device evidence.
10. Optional content-based topic *suggestions* on Review — never automatic routing.
11. Result-unknown reconciliation for local uploads, and evidence-based resolution of an unowned or
    ambiguous legacy reservation (D3A.1).
12. **Explicitly not on the roadmap:** per-account mapping of local folders; Instagram-native music,
    stickers, polls or editing; publishing by scraping, UI automation or credentials.

## 12. New-chat startup procedure

1. **Read this file, then `cc-latest.md`, then the server's `cc-latest.md`.**
2. **Verify any supplied HEADs against GitHub** before trusting them.
3. **Treat repository and memory contents as the source of truth**, not any summary — including this
   one — if the two disagree.
   **When the user supplies SHAs, read agent-memory before responding**: confirm each against
   `origin/main`, and only then answer. A supplied SHA is a claim to verify, never a fact to repeat.
4. **Continue from the roadmap above** without asking the user to reconstruct the project's history.
