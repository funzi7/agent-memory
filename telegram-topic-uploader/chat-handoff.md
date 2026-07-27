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

**Install over the existing app.** The debug certificate has not changed since D5A — at D6A2 it is
still `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4`. **D6A4 (code 29)
supersedes every earlier build; no intermediate version needs installing first.**
**Do not uninstall** — it destroys the database, and with it every folder grant, destination, queue
item, confirmation, ignore marker and deletion tombstone.

## 4. Current completed milestone

**D6A4** — a hotfix milestone opened by a **production outage** and three device reports.

> **The D6A3 destination selector works on hardware.** Pairing stayed connected, the chat and topic
> identifier fields are gone, and choosing a topic by name is the flow. **Preserved untouched.**
>
> **The D6A3 server deployment failed.** It restart-looped on
> `ModuleNotFoundError: No module named 'remote_sources.secrets'`. Recovery required **copying the
> package to the host by hand** plus a reboot. Production is healthy and **the commit it is running
> is not reproducible from Git** — deploying the D6A4 server commit is what closes that, and it is
> the first thing to do.

| Workstream | What it was |
| --- | --- |
| **1. Release integrity** | `.gitignore` carried an unanchored `secrets/` rule that also matched `src/remote_sources/secrets/`, so the package was **never tracked**; `git archive` shipped without it and `rsync --delete` removed the host's copy. Rules anchored to the root, package tracked, plus `scripts/release-preflight` and tests that read the **index** and assert the loaded module path is inside the export. |
| **2. Real rollback** | The old one printed *"attempting to restart the previous release"* and ran `docker compose up -d` against the **already-promoted broken tree**. It now snapshots before promotion and restores tree, marker and verified database, or says `ROLLBACK FAILED`. Thirteen failure-injection tests. |
| **3. Release marker** | `version` answered `deployed_commit: null` because it read a **host** path the container does not mount. Now inside the bind-mounted state directory; a deployment that does not report its promoted commit fails and rolls back. |
| **4. 9GAG readiness** | Server classified the live refusal right — `setup_required`, `http_403` — and Android showed one generic sentence while the platform still said Ready. Every classification has its own sentence; validation now records a sanitized platform signal. |
| **5. Deletion diagnostics** | D6A3's second sentence never appeared, because the paths that refuse **before the provider is asked** returned no stage. Three stages added, every refusal carries one. **The absence of the sentence is the finding: the provider was very likely never asked.** |
| **6. Animated GIFs** | `MediaKind.ANIMATION`, 9GAG `Animated`, Reddit `.gif`/`.gifv`/gallery/preview, `sendAnimation`. A `.gifv` with no MP4 is **refused** — it is an HTML page. |

| Field | Value |
| --- | --- |
| App version | code 29, `0.13.4-d6a4` |
| App HEAD | `55fbd5bb1b6fbee8fabc673c58f73930a826b970` |
| Server HEAD | `ffab60766b070b974594c41da6363b5bc7d3dd01` |
| Room schema | **12 — unchanged.** No migration runs. |
| App unit tests | 1748, 0 failures. Lint clean. |
| Server tests | 443 passed, 1 skipped. `ruff` and `mypy` clean. |
| Install | over the existing app, **never uninstall, never clear data** |
| Hardware-proven | Pairing, authenticated requests, **and the D6A3 destination selector** |
| Hardware-failed | **Permanent deletion**, now under three consecutive fixes |
| Never checked | D6A2's Preview ownership and album settlement; the 9GAG classification; animated delivery; the new deployment and rollback |
| Deployment | **Nothing.** The production VPS was not accessed and no SSH connection was made. |

**Do this first:** deploy the D6A4 server commit, confirm `remote-sources-ctl version` prints a
40-character commit rather than `null`, confirm `devices` still shows `active: 1`, then install the
APK over the existing app. `docs/D6A4_DEVICE_CHECKLIST.md` carries the order.

Previous: **D6A3** — four workstreams opened by the **first successful hardware pairing**.

> **Remote pairing works end to end on the real device.** Paired, Connected, and authenticated
> status, destinations, sources, review and history all returned data. Device counts: total 4,
> **active 1**, revoked 3. **Do not rework pairing** without an objective regression.

| Workstream | What it was |
| --- | --- |
| **A. Destination UX** | The form asked a person to retype a chat ID and a topic ID the app already held. Now a dropdown of connected topics, by name; **no identifier field anywhere**. Server does create-or-reuse on `(chat_id, thread_id)`. |
| **B. 9GAG** | Answered **403 twice** from the deployed VPS while reporting **Ready**. Now setup-required with an optional server-side cookie; **Ready means prerequisites are satisfied**. |
| **C. Deletion** | **Failed again on hardware.** Ten named stages, the production path calls them, plus one further exact attempt on the same document URI. **Not claimed fixed.** |
| **D. Deployment** | One command, `./scripts/deploy-production`. `rsync --delete` removes files a newer release deleted — the silent defect in copy-and-unpack. |

| Field | Value |
| --- | --- |
| App version | code 28, `0.13.3-d6a3` — **superseded by D6A4** |
| App HEAD | `309ae0d3723cc056bda3432f84c8b0d08a0e25f9` |
| Server HEAD | `befe5040d2d0177c7cedf23feaad3d1397166e31` |
| Room schema | **12 — unchanged.** |
| App unit tests | 1727, 0 failures. Lint clean. |
| Server tests | 369, 0 failures. `ruff` and `mypy` clean. |
| Install | **`cp app/build/outputs/apk/debug/app-debug.apk /sdcard/Download/`** — over the existing app, **never uninstall, never clear data** |
| Hardware-proven | **Pairing, and authenticated requests. That is all.** |
| Hardware-failed | **Permanent deletion**, now under two different fixes |
| Never checked | D6A2's Preview ownership and album settlement; everything in D6A3 |

**D6A3's live result:** the destination selector **passed**; the deployment, the rollback, the
release marker, the 9GAG display and the deletion all **failed**. See D6A4 above.

**Before remote pairing on a fresh setup:** deploy the server
(`./scripts/deploy-production`), then `sudo remote-sources-ctl revoke-all-devices --confirm` if
orphan device records exist, then one fresh pairing code used immediately.

Previous: **D6A2** — three regressions reported from ordinary device use. **Two of them had already
been "fixed" in D6A**, with code that passed its own tests and changed nothing on the device.

| Reported | What was actually wrong |
| --- | --- |
| Finishing an upload closed a **different** item's Preview | A completed upload closed "the" preview without asking which one was open |
| Permanent delete still did not work | The D6A check asked the provider a question it cannot answer after a real deletion, and read the silence as *could not confirm* |
| Album rows sat in the Queue with no action | D6A wrote the fix and never called it; nothing durable recorded a shell as finished |

| Field | Value |
| --- | --- |
| App version | code 27, `0.13.2-d6a2` — **superseded by D6A3** |
| Room schema | **12 — unchanged.** No migration runs. |
| App unit tests | 1704, 0 failures. Lint clean. |
| App permissions | unchanged from D5C. **No camera** — pairing is typed, not QR. |
| Server tests | 343, 0 failures. `ruff` and `mypy` clean. |
| Server state | Deployed, migrated, **healthy**. **Unchanged by D6A2 — all three defects are Android-local.** |
| Device-tested? | **No. Nothing in D6A, D6A1 or D6A2 ran on a device.** |
| D6A end-to-end | **Never passed.** Remote pairing has never completed on a device. |

Previous: D6A1 (`2a0f74e`, code 26), D6A (`d209e64`, code 25), D5C (`97125dc`, code 24) — **all
device-untested in full**.

**D6A1's live evidence, still the only remote evidence there is:** the private endpoint answered, the
pairing exchange **succeeded**, the server minted a token, the app truthfully said it could not store
it, and the consumed code was correctly refused afterwards. Each attempt left an active server-side
device record — cleared with `remote-sources-ctl revoke-all-devices --confirm`.

**What the first real pairing attempt established, sanitised:** the private endpoint answered, the
exchange **succeeded**, the server minted a token, the app truthfully said it could not store it, and
the consumed code was correctly refused afterwards. Each attempt left an active server-side device
record whose plaintext nobody holds — cleared with the new
`remote-sources-ctl revoke-all-devices --confirm`.

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
| **9GAG** | implemented; payload shape verified against the live site | none | **no** |
| **Reddit** | implemented (`u/…` and `r/…`) | **required** — anonymous is 403 | **no** |
| **X** | implemented (gallery-dl + cookies) | **required** | **no** |
| Instagram | prepared boundary, reports unsupported | — | n/a |
| TikTok | prepared boundary, reports unsupported | — | n/a |

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
- One D5A defect (Back went to the Dashboard) that D5B fixed and nobody has re-confirmed.

**Reported by the user during ordinary use — currently FAILED on hardware:**

- **Manual permanent deletion said it succeeded and the source file remained.** Fixed in code in
  D6A; **not re-verified on a device.**
- **A 42-item send:** the app showed an album failure, most items were in the topic as individual
  posts, **three** were missing, and album rows stayed in the Queue with no usable action. Fixed in
  code in D6A; **not re-verified.** The 50 MB suspicion is **consistent with the evidence but not
  proven** for those three items.
- **Selection actions were unreachable without scrolling to the top.** Fixed in code; not re-verified.

**Unvalidated on hardware:**

- **All of D6A4** — the release preflight, the real rollback, the release marker, the 9GAG
  classification and readiness refresh, the reachable deletion stages, and animated delivery.
- **D6A3 minus the destination selector**, which passed. The 9GAG classification, the deletion
  diagnosis and the deployment command all failed live and were re-fixed in D6A4.
- **All of D6A2** — including all three fixes. **Two of its three defects were reported fixed in D6A
  and confirmed on hardware zero times.**
- **All of D6A1** — including the fix itself.
- **All of D6A.** Pairing has never completed on a device, so **nothing past pairing has ever run**.
- **All of D5C** — the formal duplicate checklist has **still not been run**.
- **All of D5B.**
- Every D5A check beyond 1–3; everything left after D4B and D4C.

**Rules.** Do not infer validation from tests, lint or a successful build — none touch a device.
**No previously listed checklist item may be marked passed from those three reports**; the user
described problems, not a regression run. Manual checklists cover only new behaviour and direct
regressions; never ask for a full historical regression, token setup, multi-topic binding or old
repair checks unless something visibly breaks.

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

## 11. Roadmap

1. **Deploy the D6A4 server commit first.** It is the first reproducible release since the outage;
   the running host is carrying a hand-copied file. Then `remote-sources-ctl version` must print a
   40-character commit, and `devices` must still show `active: 1`.
2. **Device-validate D6A4**, `docs/D6A4_DEVICE_CHECKLIST.md`, **in order**. Priority: **§2 the
   deletion — and specifically the SECOND sentence of its message, verbatim**, which now names the
   stage the attempt reached; then §1 the 9GAG classification and the readiness refresh, §3 animated
   delivery, §4 the D6A3 regressions. **§2 deletes real files** — disposable copies in a disposable
   folder only.
3. Live-validate one remote source against a **disposable** topic — the server's
   `docs/D6A_LIVE_CHECKLIST.md` carries the exact order. Pairing already works and must not be
   reworked; **nothing past pairing has ever run end to end.**
4. Whatever the device reports about D5C and D5B.
5. Still owed from D4B/D4C: deletion retries, batch deletion, blocked deletion states, the launch
   scan, the Hebrew Preview.
6. **Instagram** (gallery-dl + cookies, Instaloader fallback) and **TikTok** (gallery-dl + yt-dlp +
   a **self-hosted** cobalt). Both are prepared boundaries that currently report unsupported.
   **Stories and expiring content** stay a separate opt-in schedule and are deferred with them.
7. A manual-resolution affordance for a remote `RESULT_UNKNOWN`. Recorded correctly and never
   retried, but resolving one is currently "look at the topic and decide".
8. Optional content-based topic *suggestions* on Review — never automatic routing.
9. Result-unknown reconciliation that never re-sends without evidence, and evidence-based resolution
   of an unowned or ambiguous legacy reservation (D3A.1).
10. **Explicitly not on the roadmap:** per-account mapping of local folders.

## 12. New-chat startup procedure

1. **Read this file, then `cc-latest.md`, then the server's `cc-latest.md`.**
2. **Verify any supplied HEADs against GitHub** before trusting them.
3. **Treat repository and memory contents as the source of truth**, not any summary — including this
   one — if the two disagree.
   **When the user supplies SHAs, read agent-memory before responding**: confirm each against
   `origin/main`, and only then answer. A supplied SHA is a claim to verify, never a fact to repeat.
4. **Continue from the roadmap above** without asking the user to reconstruct the project's history.
