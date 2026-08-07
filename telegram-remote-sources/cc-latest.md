# Remote Sources server — latest handoff

> The canonical cross-chat bootstrap for this system is
> `/root/work/agent-memory/telegram-topic-uploader/chat-handoff.md`. **Read that first.** This file
> is the detailed technical handoff for the server repository specifically.

Nothing in this file contains a real IP address, Tailscale hostname, tailnet name, SSH fingerprint,
bot token, chat or thread identifier, destination title, pairing code, device token, OAuth
credential, cookie, account name, subreddit, post identifier, source URL, media filename or content
hash — and nothing added to it ever may.

---

## Identity

| Field | Value |
| --- | --- |
| Repository | `https://github.com/funzi7/telegram-remote-sources` (private) |
| Local path | `/root/work/telegram-remote-sources` |
| Branch | `main`, tracking `origin/main` |
| First commit | D6A (`308b4c0`). The repository was genuinely empty before it. |
| Head after D6A1 | `31d2edf088387dd262c617457dc5fce3e660739d` (`31d2edf`) |
| Head after D6A2 | **unchanged — `31d2edf`.** D6A2 was three Android-local regressions. |
| Head after D6A3 | `befe5040d2d0177c7cedf23feaad3d1397166e31` (`befe504`) — **deployed, and it failed** |
| Head after D6A4 | `ffab60766b070b974594c41da6363b5bc7d3dd01` (`ffab607`) — never deployed; superseded |
| Head after D6A5 | `cb0174765306f429225b299845d6f11456dc666d` (`cb01747`) — deployed |
| Head after D6A6 | `a985e2da51c7681efbb6c036e3b96e4d31920f26` (`a985e2d`) — deployed |
| Head after D6A6a | `7564912c24c121c2c021887e8a5621b91f8d5df4` (`7564912`) — deployed and verified |
| **Head after D6A7** | **`b307b0882177738cf9e5dadf1a8eb14b62b40706`** (`b307b08`) — **deployed and verified** |
| Head after D6A7a | **unchanged — `b307b08`.** See the D6A7a note below. |
| Head after D6A7b | `94d6a449b6d9902766a0e3e0c26bed6482ee2357` (`94d6a44`) — deployed and verified |
| Head after D6A7c | `cbea54ffa9d41b6a76a84a4d739845899995c3f2` (`cbea54f`) — deployed; **shipped four defects, see D6A7c1** |
| Head after D6A7c1 | `f5c0b7d9a4010f7c012a2da1e854e1b8f3848865` (`f5c0b7d`) — deployed and verified |
| Head after D6A7d, first commit | `60ebc6b43ba9e1122f383e2323eaba28347e0a26` (`60ebc6b`) — deployed and verified |
| Head after D6A7d | `6fa9662b25e606c5d432ea52cc2827500d4f8137` (`6fa9662`) — deployed and verified |
| Head after D6A7e, first commit | `40dcb9801a368f4075ef3ceaa91af10f77f2c8e0` (`40dcb98`) — deployed; the first dry run found a bound |
| Head after D6A7e, narrowing fix | `614265acc9a2485e19b4804fb428aab49afa3d01` (`614265a`) — deployed; backfill applied here |
| Head after D6A7e | `b3b9378216402ded73b4a4070eda77e5c0f41356` (`b3b9378`) — deployed and verified |
| Head after D6A7e1 | `92269ada1c5c2bead729bad5dc81860010fac23e` (`92269ad`) — deployed and verified; migration head `0005_session_use` |
| **Head after D6A7e2, unchanged through D6A7e3** | **`478323c1ea6ec61a708b59b6b0b5621e7ecdb876`** (`478323c`) — **deployed and verified**; migration head **`0006_session_connection`**. D6A7e3 was an Android-only correction: this repository was not edited, not deployed and not contacted for a change, and Instagram was not contacted |
| **Head after D6A7e4** | **`eaeba836650f67245b0bd8265b46f6e03d2cd29d`** (`eaeba83`) — **deployed and verified**; migration head **`0006_session_connection`**, unchanged. No migration was needed and none was written |
| **Head after D6A7e5, unchanged** | **`eaeba836650f67245b0bd8265b46f6e03d2cd29d`** (`eaeba83`) — **unchanged. This repository was not edited, not deployed, not restarted and not contacted for a change.** D6A7e5 was an Android-only corrective milestone; migration head **`0006_session_connection`**, unchanged; **Instagram was not contacted** |
| **Head after D6A7e6, unchanged** | **`eaeba836650f67245b0bd8265b46f6e03d2cd29d`** (`eaeba83`) — **unchanged. This repository was not edited, not deployed, not restarted and not contacted for a change.** D6A7e6 was an Android-only corrective milestone (the third physical run's four findings); migration head **`0006_session_connection`**, unchanged; **Instagram was not contacted**: no validation, no check, no operator probe, no credential touched, no source enabled or disabled. The viewing session's repair remains the user's and the operator's, exactly as recorded below |
| **Head after D6A7e6a, unchanged** | **`eaeba836650f67245b0bd8265b46f6e03d2cd29d`** (`eaeba83`) — **unchanged. This repository was not edited, not deployed, not restarted and not contacted for a change.** D6A7e6a was an Android-only hotfix (the fourth physical run's orphan explicit-send notification); migration head **`0006_session_connection`**, unchanged; **Instagram was not contacted**: no validation, no check, no operator probe, no credential touched, no source enabled or disabled. Tailscale was off on the phone during the fourth run — recorded as a coincidence, not a cause, and the local notification cleanup is pinned connectivity-blind |
| **Head after D6A7e7** | **`c7536bf64f23b80feb92f9eac2e1e2c915c0d0fd`** (`c7536bf`) — **deployed and verified**; migration head **`0006_session_connection`**, unchanged — none was needed and none was written. The first commit `07fd920` carried the code and was deployed first; `c7536bf` adds the deployment record and was redeployed so the deployed HEAD equals this one exactly. **A restricted public edge is live**: Tailscale Funnel HTTPS 8443 → host loopback 8100 → a digest-pinned nginx edge → the API. Private Serve 443 unchanged and re-verified. **Instagram was not contacted** |
| **Head after D6A7e7a, unchanged** | **`c7536bf64f23b80feb92f9eac2e1e2c915c0d0fd`** (`c7536bf`) — **unchanged. This repository was not edited, not deployed, not restarted and not contacted for a change**, and the deployed HEAD is the same value. D6A7e7a was an **Android-only** corrective milestone: the fifth physical run reported that a local upload to Telegram became *requires review* every time the user left the application while it ran and came back. **That defect is local and is not attributable to this server, to the public edge or to Tailscale** — the local upload path never used a Remote Sources endpoint, and a structural guard now pins the fix's own sources free of every Remote Sources, transport and Tailscale symbol. Migration head **`0006_session_connection`**, unchanged. **No Funnel, Serve, public-edge, rate-limit or firewall configuration was changed.** **Instagram was not contacted**: no validation, no check, no operator probe, no credential touched, no source enabled or disabled. The same run also reported the **public HTTPS transport working on the handset** — the authenticated probe succeeds and ordinary Remote Sources use works with Tailscale off, which is positive device evidence for the D6A7e7 edge deployed from here |
| **Head after D6A7e7b, unchanged** | **`c7536bf64f23b80feb92f9eac2e1e2c915c0d0fd`** (`c7536bf`) — **unchanged. This repository was not edited, not deployed, not restarted, not migrated and not contacted for a change**, and the deployed HEAD is the same value. D6A7e7b is **Android-only**. The sixth physical run reported that **TikTok was not visible in the phone's *Add source* platform chooser** — and that is emphatically **not a server finding**: this server already supports TikTok (`Platform.TIKTOK`, `SourceType.TIKTOK_PROFILE`, in `SUPPORTED_PLATFORMS`, with a real adapter advertising `profile_discovery=True`, `requires_credentials=False`, `optional_credentials=True`, exactly one source type and no feed modes), and `/system/status` has advertised all of it for eight milestones. The phone clipped the fifth chip out of a non-wrapping row. **No platform request occurred**: TikTok was not contacted, no source was created, validated, enabled, disabled or checked, and no credential was touched. The milestone's server work was a **read-only audit** of `schemas.py`, `routes.py`, `db/models.py`, `delivery/operations.py`, `delivery/telegram.py` and `adapters/registry.py`, which confirmed that Remote History already exposes **both** `created_at` and `confirmed_at` and that Android already parses both — so **no API change, no migration and no deployment was needed or made**. Migration head **`0006_session_connection`**, unchanged. **No Funnel, Serve, public-edge, nginx, rate-limit or firewall configuration was changed.** **Instagram was not contacted** |
| **Head after D6A7e8** | **`b0ed4f0407a089b5cf567c78a3c4f7a055197638`** (`b0ed4f0`) — **deployed and verified**; migration head **`0006_session_connection`**, unchanged — none was needed and none was written. The code commit `b38f8ebe1d8bb33ad961cf4af0a5709621cb9f1b` (`b38f8eb`) was deployed first; `b0ed4f0` adds the deployment record and was redeployed so the deployed HEAD equals this one exactly. **The TikTok connector was asking gallery-dl for a URL that enumerates nothing** — see the section below. **`LIVE_PROBES_USED=0`**: no agent made a live request to any platform. **Instagram was not contacted**; its enabled source's `next_check_at` is unchanged to the microsecond across both deployments |
| Host | A DigitalOcean droplet, Ubuntu 24.04.4, amd64, 1 vCPU, ~2 GiB RAM, ~48 GB disk |
| Deploy path on host | `/opt/remote-sources` |
| State path on host | `/var/lib/remote-sources` |

The VPS address, its Tailscale hostname and the tailnet name are **deliberately not recorded
anywhere**. They live in the operator's shell and in the Android app's settings.

## D6A7e8 — the profile URL that was never a feed

**What opened it.** The user performed the first live TikTok source validation this project has ever
done, from the handset, on D6A7e7b. It reached TikTok and the app displayed
`MALFORMED_UPSTREAM` — *the platform returned content the server could not read; the connector must
be updated.* It was right.

**The root cause, established with zero live probes.** The route has written one sanitized warning
per refused validation since D6A3 — connector, classification, reason, and deliberately nothing else.
Reading a narrow window of production logs around the reported time gave the whole answer:

```
2026-08-07T07:48:33+0000  connector=tiktok  classification=malformed_upstream  reason=tiktok_not_enumerated
```

That detail is authored by exactly one statement: `classify_dump`'s `queue_count and not
url_records`. The structural condition it needs is a dump with at least one `Message.Queue` record
and **zero** `Message.Url` records. The installed extractor's own source says why:

* `gallery-dl` **1.32.8**, `yt-dlp` **2026.07.04** (read from the deployed container).
* `https://www.tiktok.com/@<handle>` matches `TiktokUserExtractor`, which is a `Dispatch`. Its
  `items()` returns *only* queue tuples — the avatar and the posts listing — and enumerates nothing.
* `DataJob.resolve` is **false** by default, so `handle_queue` records a queue entry and never
  descends. `--resolve-json` is the mode that would.

Confirmed offline, by pattern matching alone with a synthetic handle: the profile URL resolves to
`TiktokUserExtractor`, `…/posts` resolves to `TiktokPostsExtractor`. **No TikTok request was made by
any agent at any point.** The user's approved allowance of one bounded diagnostic probe was not
spent.

**The correction.** Discovery asks `https://www.tiktok.com/@<handle>/posts`.

**Why not `--resolve-json`, which is exactly how D6A7b fixed Instagram.** It resolves *every* queued
sub-extractor, and the first is the **avatar** — one `Message.Url` whose `id` is the **user's**
numeric id, in the same 6–25 digit shape a post id has. It would have parsed as a post, sorted
first, and become the source's cursor: the profile picture stored as the newest post. Asking the
enumerating extractor directly cannot produce it, and it leaves the queue guard meaning what it says
so a future TikTok extractor that queues again is still reported loudly. **This asymmetry with
Instagram is deliberate and is written down in `docs/CONNECTORS.md`.**

**A second bound, because there were two things to bound.** `--range` bounds *files* and the job
evaluates it on records the extractor has already produced, so it cannot stop the listing paginating
a whole profile before the first record exists. `-o tiktok-range=1-N` is the extractor's own listing
bound. **It is derived from `InitialImport`, never a literal** — the first draft used `12`, which
would have capped a `last_25` import at twelve posts and then baselined, silently discarding the
requested history. That is the D6A7b failure by a new route, and no existing test would have caught
it because the conformance harness stubs the extractor and ignores argv.

**Two more, both proven and both newly reachable.**

* A photo carousel's **background track** is printed as another file of the same post — an `mp3`
  carrying the post's own id at `num: 0`. `kind_for_extension` has no rule for `mp3`, so the member
  kind fell to `IMAGE`, and `num: 0` sorted it **ahead of every photograph**. Dropped on the
  extractor's own `type` field. It could only surface now: before the URL fix nothing was enumerated,
  so no carousel had ever reached the parser.
* `_strip_url` stripped `vm.tiktok.com/` like any other spelling of the site, leaving a share link's
  **redirect token** standing exactly where a username stands — and it is letters and digits, so it
  matched `_TIKTOK_USER`. `vm.tiktok.com/<token>` normalised to a **profile source for an account
  nobody had named**, checked on a schedule from then on. `vm.`, `vt.` and `tiktok.com/t/` are
  refused by name now, decided from the text alone.

**The premise the brief got wrong, corrected from production.** The milestone brief stated the failed
validation had recorded a TikTok platform signal. It had not, and `platform_health` still holds
exactly two rows, `instagram` and `ninegag`. `_record_validation_signal` writes only *setup-shaped*
classifications, and `malformed_upstream` is not one — correctly, because a connector defect has no
operator action attached and a TikTok row reading *setup required* would have sent somebody to import
a cookie that fixes nothing. **Nothing was erased and nothing was manufactured.**

**The gate and the deployment.** 1243 passed, 3 skipped (1202/3 at D6A7e7); ruff, mypy, `bash -n`,
`release-preflight` and `git diff --check` all clean, from the committed tree. Deployed twice —
`b38f8eb` then `b0ed4f0` — each time with the read-only Instagram maintenance guard run immediately
before: the enabled source was due in 483 minutes, far outside the deployment plus a conservative
ninety-minute margin. Row counts identical across both. Its `next_check_at` is unchanged to the
microsecond; only the countdown moved, which is what proves nothing contacted Instagram.

**What is not proven.** That TikTok discovery works live. Deployment proves the code is on the host.
Only the user's next *Check source* from the handset is evidence about the product, and no agent may
perform it or claim it. No TikTok source was created, enabled or scheduled.

## D6A7e7 — the public edge, and the phone that no longer carries Tailscale

**HEAD `c7536bf64f23b80feb92f9eac2e1e2c915c0d0fd`, deployed and verified. Migration head
`0006_session_connection`, unchanged.** Server tests: **1202 passed, 3 skipped** (1205 collected;
1143/3 at D6A7e4). 59 new tests across `tests/test_d6a7e7_public_ingress.py`,
`tests/test_d6a7e7_edge_config.py` and `tests/test_d6a7e7_deployment.py`.

### What it is

The private path is untouched: Tailscale Serve, HTTPS 443, tailnet-only, straight to the loopback
API — pairing, health, readiness and the OpenAPI document live there and only there. The new
public path is Tailscale Funnel, HTTPS 8443, terminating TLS in the host tailscaled and handing
plaintext to `127.0.0.1:8100`, where a **stateless nginx edge** — pinned by immutable image
digest, read-only rootfs, all capabilities dropped, non-root, no database, no credential —
forwards only `/api/v1/*` to the API over the internal compose network.

**Neither 8099 nor 8100 is published beyond host loopback, the firewall opens none of
8099/8100/8443, and tailscaled is the only process presenting a public port.** Funnel on 443 is
forbidden and two scripts verify its absence rather than assuming it.

### The rules that make a public URL safe to have

The Funnel URL is treated as **fully public and discoverable** — the hostname is not the boundary.
The edge answers pairing, readiness, health, the OpenAPI document and every unknown path with one
fixed 404 that is byte-identical to each other, so no public response reveals which routes exist
or whether a pairing challenge does. It requires a syntactically plausible bearer header before
forwarding a byte; strips `Forwarded`, `X-Forwarded-For`, `X-Forwarded-Host`, `X-Forwarded-Proto`,
`X-Real-IP` and `Cookie`; injects one fixed internal marker; bounds bodies to the application's own
ceiling, plus headers, connections, request rates (mutations stricter) and upstream time; keeps
**no access log at all**, so an `Authorization` value has nowhere to be logged; and stamps every
response with the fixed `X-Remote-Sources-Ingress: public-v1` marker and a closed security-header
set.

`PublicIngressMiddleware` repeats the whole contract in-process, so an edge regression fails
**closed**. Trusting the marker is fail-safe by construction: only the edge can set it on a public
request, and forging it on a private connection buys **fewer** capabilities, never more. Public
401s lose their machine `reason`; private ones keep it. Rate limiting is bounded process memory —
480/min global, 30/min invalid-auth, 240/min per credential, 60 mutations/min, 1024 keys with LRU
— keyed by SHA-256 of the header, never the raw token, never persisted, and changing nothing
durable.

**The two invariants:** a public internet client without a valid active device token can neither
read nor mutate any application state; and **public ingress can never mint a device token**.

### What the deployment proved

Deployed HEAD exact and 40 characters; migration head unchanged in script directory and database;
both containers healthy; 8099 and 8100 loopback-only; no firewall rule for any guarded port;
private Serve 443 verified end to end through tailscaled (health 200, readiness 200, protected
route 401, **pairing exchange still reachable**).

From an ordinary off-tailnet internet client, unauthenticated: root, unknown paths, health,
readiness, OpenAPI, a well-formed pairing exchange, TRACE, DELETE and PUT all **404**; tokenless
and malformed-token requests **401**; a 300 000-byte mutation **413** at the edge; spoofed
forwarding headers and a forged ingress marker changed nothing; every response carried the fixed
marker and all five security headers; both refusal bodies were the sanitized envelopes with no
version, database, migration, staging, secret, source or device detail. The in-process defence was
confirmed **live**: over host loopback with the marker set by hand, the deployed application
answered 404 for health, readiness, OpenAPI and pairing, while the same requests unmarked answered
200, 200, 200 and 422.

Tailscale **1.98.9**. The node already carried the `funnel` attribute with
`ports=443,8443,10000`, MagicDNS and HTTPS certificates, so **no interactive approval was required
and no tailnet policy was changed or broadened**.

### Instagram, and what the clock proves

Read-only before and after, printing no source identity: one enabled Instagram source, preset
`daily`, Stories off, the second source still disabled, session connection state `connected`, the
previous credential's `authentication_expired` still the historical `last_signal`. The next check
was **395 minutes** away before the deployment — far outside the window plus a conservative
90-minute margin — and **389 minutes** away afterwards. It advanced only by the wall clock that
elapsed, which is the evidence that **no Instagram request occurred**: a check would have reset
it. Row counts identical throughout. Nothing was sent to Telegram, and no authenticated mutation
was performed during the deployment.

### The rules worth carrying forward

- **A public URL is not a secret, so it must not be load-bearing.** Everything is designed as if
  the hostname is known, because it is discoverable.
- **Two lines of defence, because a configuration file is a place a policy can regress.** The edge
  enforces the route policy and the application enforces it again; a marker that only ever
  restricts is safe to trust without knowing the peer.
- **Absence cannot be misconfigured.** No access log at all beats a carefully-formatted one.
- **A refusal that maps the routes is a leak.** Every blocked public path answers the same bytes.
- **Re-scope a guard, never delete it.** `70-serve.sh`'s "Funnel is off" check became "no Funnel on
  443" — and its old PCRE lookahead under `grep -E` could never fire, so it was replaced by parsed
  JSON. Same for the deployment's non-loopback-listener sentence guard, which now covers the edge
  port too.
- **Verify the network premises read-only before deploying, not during.** The preflight checks the
  firewall, the private Serve and the absence of Funnel on 443 before the backup is even taken.

## D6A7e5 — the server was not touched, and the viewing session is rejected on the handset too

**D6A7e5 changed nothing here.** The repository was not edited, not deployed, not restarted and not
contacted for a change. `SERVER_HEAD` and `DEPLOYED_HEAD` are both
`eaeba836650f67245b0bd8265b46f6e03d2cd29d`, migration head `0006_session_connection`, unchanged. No
server test suite was run, because no server code moved. The milestone was an Android-only correction
of two defects the first physical run of D6A7e4 found on the handset.

### The one thing recorded here: the viewing session, as the handset showed it

This is the **only** server-relevant finding of the milestone, and it is an observation, not an action.

The installed D6A7e4 build's Instagram viewing-session card **visibly stated `viewing connection
rejected`**, with:

- the **last server session use a few minutes earlier**;
- its **purpose: `source validation`**;
- its **outcome: `failed`**.

That is a **live rejection observed by a real operation**, not merely an old cached *connected*
value — which makes it stronger evidence than, and consistent with, the read-only probe D6A7e4 took
before deploying (`rejected`, `last_signal = authentication_expired`, following a scheduled check at
09:32 UTC on 2026-08-01, having worked at 06:26 UTC the same morning).

Record truthfully, and claim nothing beyond it:

- the **dedicated viewing credential remains configured** on the server;
- **Instagram is currently rejecting that session**;
- a **source-validation operation observed** the rejection;
- **Refresh status in the app does not reconnect the account** — it only rereads server state;
- **repeated validation against the same rejected session is not a repair**, and a source check does
  not repair a session either.

**D6A7e5 neither caused nor repaired it.** It ran no validation, no check and no operator probe;
replaced, cleared and re-validated nothing; enabled and disabled no source; changed no server state;
and made no Instagram request of any kind.

### The open follow-up — the user's and the operator's, never an agent's

1. The user signs in to the **dedicated viewing account** again.
2. They export a **fresh cookie jar**.
3. It is imported through the **approved server operator flow**.
4. **One separately authorised bounded validation** is performed.

Until all four have happened, **do not record the session as connected**, and do not schedule or
retry validation against the rejected material.

## D6A7e4 — the source name validation already knew, two slower cadences, and a count corrected from evidence

**HEAD `eaeba836650f67245b0bd8265b46f6e03d2cd29d`, deployed and verified. Migration head unchanged at
`0006_session_connection`. Instagram was not contacted: no validation, no check, no operator probe;
no credential replaced or re-validated; no source enabled or disabled.**

### 1. A suggested source name, from one validation

Adding a source asked for the same thing twice: the identity was validated against the platform — a
request that, when it succeeds, has already seen what the platform calls the account — and the
separate name field was left empty for the user to retype it.

`POST /sources/validate` now returns two additive fields on the **successful** result:

| Field | Meaning |
| --- | --- |
| `suggested_display_name` | A name the client may put in its source-name field. `null` on any refusal. |
| `suggested_name_from_platform` | `true` only when a platform genuinely answered with that name. |

**One request, not two.** `adapter.validate` is the only platform call on the path; the suggestion is
composed from its result and the already-normalised identity. A test installs an adapter that counts
its own invocations and asserts one.

`domain/source_naming.py` is the single policy — a trusted platform display name, then the canonical
handle, then `NormalisedSource.display`. Never the raw request text, which normalisation may have
changed or refused. The fallback is `display` rather than the bare identity **deliberately**: it is
what keeps a 9GAG Interest distinguishable from a 9GAG profile of the same word, and a Reddit `r/`
from a `u/`.

`ValidationResult` gained an additive `display_name`. **9GAG** fills it from the profile's `fullName`
/ `username` or the Interest's `name` / `listType`, out of the payload it had already fetched;
**Reddit** from the listing's `subreddit_name_prefixed` / `author`. Both read *named keys only*,
never a whole object, so a field nobody deliberately chose cannot reach a response.
**Instagram, TikTok and X make no display-name claim at all** and fall back to the normalised
identity — stated rather than papered over, because a name the platform never gave is not one to
imply.

### 2. Five schedule presets

`attentive` 2 h, `normal` 4 h, `relaxed` 8 h, **`slow` 12 h**, **`daily` 24 h**. The three existing
wire values are untouched — deployed source rows carry them and older clients send them. One
base-interval table, on the enum, read by the scheduler, the API and the docs alike.

**The dormancy audit, documented rather than engineered away.**
`MAX_REGULAR_INTERVAL_SECONDS` — 24 hours — predates the presets and is applied *after* jitter and
*after* the ×3 dormancy multiplier. So a 3× multiplier on a 24-hour base cannot become three days:
`daily` sits **at** the cap, dormancy cannot lengthen it, and its jitter is one-sided (the downward
half applies, the upward half is clamped, landing roughly 21–24 h out). `slow` reaches the same
ceiling after several empty checks and stops. Parameterised tests assert the bound for **every**
preset across the whole ladder.

**No migration.** `remote_sources.schedule_preset` is `String(24)` with no `CHECK` constraint, so the
values are data. A migration written to document an enum would be a deployed file that changes
nothing — and a test asserts the *absence* of a constraint rather than the presence of a file.

### 3. The D6A7e2 count, corrected in this repository

`README.md`, `TODO.md`, `docs/PROJECT_STATE.md` and `docs/RELEASE_REVIEW.md` read **1070 passed, 4
skipped**. Two identical read-only `pytest -q` runs at the unchanged D6A7e2 HEAD `478323c` both
answered **1071 passed, 3 skipped** — the one skip site producing three code-determined skips, and
1071 + 3 = **1074 collected**. All four documents now carry the corrected figures with the evidence
beside them. **No commit message was rewritten.**

That figure is historical. **The current total is 1143 passed, 3 skipped (1146 collected)** — 64 new
tests in `tests/test_d6a7e4_source_naming.py` and `tests/test_d6a7e4_schedule_presets.py`, plus eight
existing `test_domain.py` parametrisations that expand over the two added presets.

### The gate, and where it was run from

`release-preflight` and `tests/test_release_integrity.py` both read `HEAD`, so both fired on the
uncommitted `domain/source_naming.py` **exactly as designed**. The figures above are from the run
that followed the commit. `ruff format --check` 104 files, `ruff check` clean, `mypy` clean over 102
source files, `bash -n scripts/deploy-production` clean, `git diff --check` clean.

### Deployment verification

Deployed HEAD exact and 40 characters; migration head `0006_session_connection` in both the script
directory and the database; health `200`, readiness all-true; six protected routes each `401`
unauthenticated; the application port bound to `127.0.0.1` only; the Instagram credential's
configuration timestamp unchanged; **2 sources, 2 enabled, 0 disabled — identical before and after**,
both still `normal`, so **no source was moved to Slow or Daily**; and the deployed build reports all
five presets at 2 / 4 / 8 / 12 / 24 hours.

### The Instagram viewing session, as found before deploying

A **read-only** probe found the stored connection state **`rejected`**, `last_signal =
authentication_expired`, following a **scheduled** check at 09:32 UTC on 2026-08-01. The same row
records a successful authenticated operation at 06:26 UTC that morning, so the session was working
and stopped being accepted between those two times.

**Scheduler-attributed. D6A7e4 neither caused nor repaired it**, ran no validation, check or probe,
and replaced nothing. Do not repeat an older "connected" claim without re-verifying.

## D6A7e2 — a dedicated viewing account, and a session that says whether it works

**HEAD `478323c1ea6ec61a708b59b6b0b5621e7ecdb876`, deployed and verified. Migration head
`0006_session_connection`.** Server tests: **1071 passed, 3 skipped.**

> **Corrected in D6A7e3, from evidence.** This line used to read *1066 passed, 3 skipped*, and the
> server repository's own `README.md`, `TODO.md`, `docs/PROJECT_STATE.md`, `docs/RELEASE_REVIEW.md`
> and the D6A7e2 commit message all read *1070 passed, 4 skipped*. Neither was right.
>
> `.venv/bin/python -m pytest -q` was run **twice**, read-only, at this exact unchanged HEAD, and
> produced **1071 passed, 3 skipped** both times. `pytest -q -rs` shows the suite's only reachable
> skip is `tests/test_connector_conformance.py:591` — *this platform requires no credential, so it
> has no unconfigured state* — firing for the three harnesses that declare `unconfigured=None`
> (lines 112, 165 and 435), so three skips is determined by the code rather than by the environment.
> 1071 + 3 = **1074 collected**, which matches the recorded 1070 + 4 exactly, so the server's figure
> miscounted one test between the two columns; 1066 + 3 = 1069 is five short of the collection, so
> the old memory figure was simply wrong.
>
> **The server's own committed documents still carry 1070/4 and are owed a correction in the next
> server milestone.** D6A7e3 was forbidden to move the server HEAD, so nothing in that repository
> was edited, and nothing was deployed.

### The gap D6A7e1 left

D6A7e1 could report that a credential *exists*. That is not the question anyone opens the screen
to ask, and this milestone proved the gap concretely: the new dedicated account's cookie file
parsed, an envelope was written, and none of it was evidence that Instagram would accept it.

### The state, and why it is composed rather than stored

`0006_session_connection` adds three **nullable** columns to `platform_health` —
`session_configured_at`, `session_validated_at`, `session_connection_state`. Purely additive; the
existing row is preserved; `0005_session_use` was not edited, and a test enforces that a deployed
migration never is.

The stored value is only the **verdict of the last authenticated use**. What the API returns is
`effective_connection_state(...)`, composed at read time in one place, with this precedence:

1. **absent** — no credential. Nothing else can outrank this; after the D6A7e1 containment a stale
   challenge must not dress an empty server up as anything else.
2. **unreadable** — a credential exists and the server cannot materialise it. A server fault, not a
   credential one. (The D6A7 tmpfs shape.)
3. the credential's own refusal verdict — **rejected / challenged / rate_limited**.
4. **backoff** — a live window is open. Derived, *never stored*: a window is a fact about now.
5. the stored verdict, otherwise.
6. **configured_unverified** — a credential exists and nothing has proved it works.

**The generation boundary.** `session_configured_at` is stamped on import and on clear, and
`SessionUseRecorder` carries that timestamp as a ticket. A use that began before the current
credential was configured settles nothing — so an in-flight request against the *old* account can
never write a verdict about the *new* one. No credential-derived identifier is needed for this,
which is the point: nothing that could identify an account is stored to make it work.

### The import, and the single authorised live request

- The plaintext jar was streamed over SSH **stdin straight into the container's tmpfs** and never
  written to server disk, never passed as an argument, never printed. The scoped sudo grant does
  not include `install`, `cp` or `rm`, and the container bind-mounts only `/var/lib/remote-sources`
  — so this was the only route that kept plaintext off disk, not a convenience.
- Import removes the runtime copy **before** writing the new envelope, then marks configured. Both
  plaintext copies were destroyed afterwards and their absence verified.
- **`validate-instagram-session` refuses without `--confirm-live-session-use`** (exit 2), refuses
  with no credential, refuses if the material is unreadable, and refuses if no Instagram profile
  source exists. It picks the identity internally and **never prints it**.
- Exactly **one** live request was made. Result: `connection_state: connected`,
  `validation_ok: true`, `elapsed_seconds: 2.1`, `instagram_enabled_sources: 0`.
- **The import enabled nothing.** Verified afterwards: no new CheckRun (still 6), cursor, Story
  state and `last_check_at` untouched, every row count identical. Re-enabling stays the user's
  decision, one source at a time.

### The permanent rule this adds

> **Presence is not connection.** A stored credential is a fact about this server; a working
> session is a fact about the platform, and only an authenticated request can establish it. No
> surface may present the first as the second — `docs/SECURITY.md` item 5.

## D6A7e1 — the session Instagram saw, and the removal that now removes

**A security incident, contained the day it was understood, and the code defects it exposed.**

### What happened, and the limit of what may be claimed

The user had exported their **primary Instagram business account's** cookies and imported them
here as the viewing session. Instagram showed a new connection from **Singapore — this server's
own hosting region** — treated the activity as suspicious, logged the account out, and required a
fresh sign-in.

An exported jar **is** an authenticated session: no password was needed, asked for or obtained,
because the session cookie *is* the credential. Importing it authorised server-side use — this
server materialised it, handed the path to gallery-dl, and gallery-dl contacted Instagram from
this host. Instagram therefore saw authenticated activity from a new address, environment and
request pattern. **Only Instagram knows the exact risk signal behind the logout**; the server's
use can explain the new connection and nothing stronger is claimed.

### The sanitized audit (read-only; no new Instagram request was made for it)

| Fact | Value |
| --- | --- |
| Jar imported | **2026-07-27 20:16 UTC** (host command log; the command only, never content) |
| Session in use until | **2026-07-30 04:25 UTC** |
| Durable check runs | 6 — 2 manual (07-28 13:47 initial 11-Story import; 17:22), 4 scheduled (07-28 23:54 → 7 Stories; 07-29 07:31; 07-29 16:49; 07-30 04:25) |
| Probes, all documented, all session-using | resolve-json + timing (D6A7b), pinned-post + Story tray (D6A7c), post-range (D6A7c1), roster probes + classification dry runs and apply (D6A7e) |
| Last check's shape | **partial** — feed `success_no_new_posts`, Story half `temporary_failure/extractor_failed`. **Consistent with** the session being invalidated around then; not proof |
| What cannot be proved | the exact number of extractor invocations — probes were never durably counted, pre-D6A7d scheduled checks left no rows, log retention is bounded |

### Containment — verified from local state only

`clear instagram/cookies` (07-30 09:43 UTC) → **the decrypted tmpfs copy was still present
afterwards**, which is exactly the defect fixed here → destroyed by the approved restart → every
Instagram source paused through the new command. Verified: credential **not set**, enabled
Instagram sources **0**, no running check, no gallery-dl/yt-dlp process, health and readiness
200, unauthenticated routes 401, port loopback-only, other credentials untouched, row counts
identical (1 source, 46 items, 46 media, 46 operations, 2 destinations, 4 devices, 6 check runs).
**Absence was proved from credential and process state — never by making a request with the thing
being removed.**

### What was built

- **`clear` now removes envelope *and* decrypted runtime copy**; re-import removes the previous
  copy first; a constructed adapter re-stats the absent file and refuses. Idempotent,
  namespace-scoped, prints no secret metadata. `tests/test_credential_clear.py` (12).
- **`remote-sources-ctl pause-instagram-sources --confirm`** — one transaction, one column,
  counts only, idempotent, contacts nothing, deletes nothing, preserves every setting and Story
  fact. **No bulk resume by design**; a later cookie import re-enables nothing.
  `tests/test_pause_instagram_sources.py` (8).
- **The permanent live-probe rule** in `OPERATIONS.md`, with its first enforcement:
  `classify-instagram-content` refuses without `--confirm-live-session-use`, **including on a dry
  run**, because a dry run resolves the account's listings live.
- **`0005_session_use`** + `SessionUseRecorder`: three nullable columns on `platform_health`
  (`session_last_used_at`, `session_last_use_purpose`, `session_last_use_outcome`); the purpose is
  written **before** each authenticated extractor operation and the outcome only **after** its
  result is classified; start-up settles unsettled rows as `interrupted`. Closed vocabularies;
  no account, source, URL or post identity has a column that could hold it. Exposed through
  `/system/status` with `session_scope` under the new `platform.session_use.v1` capability.
  Existing rows backfill **NULL** — an audit is documentation, never manufactured rows.
  `tests/test_session_use.py` (18).

### The product rules this fixed in place

One shared viewing session serves **every** Instagram source; adding a source never logs in to
the target and never asks for its credentials; a **private** target is readable only if the
viewing account is an approved follower; the next session must be a **dedicated, low-value**
account (own email, unique password, two-factor, no business assets, no ad account, no Page
ownership, kept out of the primary account's Accounts Center where avoidable). **A dedicated
account may still be challenged** — the separation limits the cost, not the possibility.
Re-enabling paused sources is per-source, from the application, after that session is configured.

### Gate

`ruff format --check`, `ruff check`, `mypy` (100 files), **1035 passed / 3 skipped**,
`bash -n scripts/deploy-production`, `scripts/release-preflight` (50 modules) — all clean. **No
test contacts Instagram, Telegram or any live platform**; the new suites forbid it structurally.

### Still owed

The user creates the dedicated viewing account and imports its cookies
(`sudo remote-sources-configure instagram-cookies <path>`), then re-enables selected sources
**individually from the app**. Nothing resumes on its own. And **D6A7f** — the official Local Bot
API Server for files above 50 MB — is designed in `docs/D6A7F_LOCAL_BOT_API_DESIGN.md` and
deliberately not begun.

## D6A7e — the listing that knows what a Reel is

**The device report.** Remote History labels Stories correctly, and **a post the user knows to be a
Reel appears as *Unknown type***. Separately, and this is the good half: **a second successful
Instagram check did not resend the already-imported active Stories**, so **live Story deduplication
is verified** — the check D6A7d left open.

### The probe, before anything changed

Metadata-only, bounded, read-only, against the deployed container and the configured session. No
media downloaded, no source check through the API, no Telegram send, no item created, no cursor or
Story state touched.

| Fact | Value |
| --- | --- |
| gallery-dl | 1.32.8 |
| `product_type` / `media_product_type` / `subtype_name_for_REST__` in a feed record | **absent, all three** |
| `subcategory` on every feed record | `posts` — which carries Reels too |
| `post_url` route shapes | `/p/` ×10, `/reel/` ×2 |
| Feed identities on the account's clips listing | **4 of 6** |
| Named by the untrusted `type` | **1** — it missed three |
| `type` on the clips listing itself, every member a Reel | `post` on **10 of 12** |
| Clips ∩ photos listings | **0** |
| Clips throughput | 40 posts in 44.5 s (≈1.1 s each) |
| Photos throughput | ~59 s for **three**, ~79 s for nine |

**`post_url` is the same guess wearing a URL.** Read the extractor: `type` *and* `post_url` are both
written in the `if len(files) == 1 and files[0]["video_url"]` branch. So the `/reel/` route looks
canonical and is derived from media shape. Both fields are now in `UNTRUSTED_REEL_FIELDS`, with a
test that fails the build if either is read.

### What proves a Reel instead

Not a field — a **listing**. `InstagramReelsExtractor.posts()` is `self.api.user_clips(uid)`,
Instagram's own clips endpoint. `InstagramPhotosExtractor.posts()` yields a post only
`if not self._is_reel(post)`, and `_is_reel` reads `product_type` / `media_product_type` /
`clips_metadata` off the raw API post. Neither depends on the media's shape.

A discovery that finds unproven posts resolves **both listings once** and cross-references by
canonical identity — two requests for a whole page, never one per post. Bounded to 60 logical posts
and 120 s each, run sequentially, and a listing that fails or times out **classifies nothing and
fails nothing**. Membership in both is a contradiction, reported as `unknown` with a sanitized
conflict outcome.

> **The first production dry run found a real bound and is worth keeping.** It asked both listings
> for the full 34-post window; clips resolved and **photos timed out**, leaving three rows Unknown.
> That degradation was correct — and avoidable. The resolver now runs clips first and sizes the
> photos window from what clips left, which turned 34 into 9. Measured, fixed, re-measured.

**`post` got narrower, and the behaviour it replaced was an over-claim.** D6A7d answered `post` for
any feed record carrying no reel signal; the profile listing carries Reels *and* posts under one
subcategory, so that was never the same claim. An unproven record is `unknown` now. Five D6A7d tests
changed because the behaviour they pinned was the defect.

### The production backfill — run, with its counts

`remote-sources-ctl classify-instagram-content`, dry run → verified runbook backup → apply → verify.

| | Before | After |
| --- | --- | --- |
| Instagram rows with no classification | 28 | **1** |
| `reel` | 0 | **25** |
| `post` | 0 | **2** |
| `story` | 11 | 11 |
| History rows filled | — | **27** |
| Failed / conflicting | — | **0 / 0** |

Items 39, operations 39, check runs 2 — unchanged. Stories toggle, import state, enabled flag,
baseline and preset all exactly as they were. **One row stays Unknown, and that is the pass working
as designed.**

### The schedule contract, pinned rather than changed

A later device report asked what the Android card could not answer: *when will a Story I publish be
discovered, and on an auto-send source, sent?* **No scheduler arithmetic changed.** The base
intervals were already 8 h / 4 h / 2 h; `SourceResponse` already returned every schedule timestamp
and the durable `last_check` with its trigger; and `PATCH /sources/{id}` has always recalculated
`next_check_at` in the same response. Nine regression tests pin it and `API.md` documents it as the
contract an app reads **instead of** deriving a countdown from a preset name — because jitter of
±12%, adaptive dormancy, a platform backoff and any manual check all move the real time. The
**manual cooldown is a different clock**.

### No migration

`content_kind` is already nullable on both tables and NULL already means *nobody proved anything*.
**`0004_content_kind` remains the head.** No new API vocabulary, field or capability.

### Gate

`ruff format --check`, `ruff check`, `mypy` (96 files), **994 passed / 3 skipped**,
`bash -n scripts/deploy-production`, `scripts/release-preflight` (49 modules) — all clean.

### Still owed

**Device-unverified: that a Reel appears as *Reel*, an ordinary video post as *Post*, and
unclassifiable legacy content as *Unknown*, on the handset's Remote History.**

## What it is

An always-on server that discovers posts from remote platforms, holds them for review, downloads
media only when needed, and delivers confirmed media into Telegram topics. The Android application
manages it; it holds everything the phone must not — platform sessions, scraping tools, the
schedule, the media, and the Telegram bot token.

## Stack

Python 3.12 in Docker. FastAPI + uvicorn, SQLAlchemy 2 + Alembic, SQLite (WAL), httpx, cryptography,
gallery-dl, yt-dlp. Dependencies locked with `uv.lock` (47 packages), installed `--frozen`.

**One process. It is the only writer.** That is the concurrency policy, not an implementation detail
— the API and the scheduler share one event loop, and a second writer would break the
commit-before-network guarantees silently rather than loudly. It is stated in three places in the
code for that reason.

## The pieces worth re-reading

### `db/enums.py` — `CheckOutcome`

Eleven outcomes, of which exactly two are successes. `advances_cursor` is **defined** as `is_success`,
so "the cursor only moves on an unambiguous success" is one definition rather than a rule every
branch must remember. `MALFORMED_UPSTREAM` exists so that "the extractor returned something we could
not read" is never rounded down to "there was nothing new".

### `db/base.py` — `UtcDateTime`

A `TypeDecorator`, and it exists because of a bug the test suite found on its first run.
`DateTime(timezone=True)` is a *request* SQLite cannot honour: it returns a naive datetime, and
comparing one to `utcnow()` raises `TypeError`. That would have crashed the scheduler, the token
expiry check and every backoff window the first time they ran against real data. Every timestamp
column uses the decorator now.

### `db/models.py` — the two destination columns

`pending_destination_id` follows the source's mapping and is rewritten on a remap.
`frozen_destination_id`, plus the literal chat and thread copied onto the operation row, is written
once at dispatch and never again. History reads the frozen columns. Remapping a source can no more
rewrite delivery evidence than it can un-send a message.

`(source_id, canonical_post_id)` is unique. Rediscovery collides with the existing row rather than
producing a second Review card — which is why **ignore survives a rescan with no reconciliation
job**, and why `BASELINE` (a post that existed before the source was added) can never resurface.

### `delivery/operations.py` — the ordering is the argument

1. Freeze and **commit** the operation.
2. Stage the media. A failure here is proven pre-dispatch, so the item returns to Review.
3. Mark dispatching and **commit `request_started_at`** — before the request.
4. Send.
5. **Commit the confirmation, then** clean up.

Restart recovery needs no extra logic: a row found `DISPATCHING` had already begun its request, so
the only lawful transition is `RESULT_UNKNOWN`. Step 5's order is the one people get backwards —
cleaning up first means a crash loses the proof and keeps nothing.

`DeliveryEngine.cleanup(session, operation)` takes no client, no adapter and no queue, and a test
asserts that signature. "A cleanup retry cannot contact Telegram" is a fact about the type graph.

### `adapters/ninegag.py` — the interesting connector

`yt-dlp` downloads one 9GAG post and cannot enumerate an account. `gallery-dl` has no 9GAG extractor
at all. So discovery reads the profile page's own server-rendered `window._config` payload at
`/u/<name>/posts`, which carries `profile`, a newest-first `posts` array and a `nextCursor`.

Verified against the live site while writing it: three consecutive pages, no overlap, timestamps
descending, a media URL fetched successfully. The old `/v1/user-posts/...` API now returns **405**
and is not used.

**This is the connector most likely to need maintenance.** The payload is the site's front-end data,
not a documented API. If it changes, discovery reports `malformed_upstream` and stops — the safe
failure — but it does stop.

### `adapters/reddit.py` — OAuth is mandatory

Reddit answers a server address's unauthenticated JSON with **403**. Verified. So a Reddit source
without credentials reports `SETUP_REQUIRED` — visible and fixable — rather than an empty feed
forever. Galleries become one item with ordered media using Reddit's own `media_id` per member, and
gallery extraction runs *before* single-media extraction because a gallery post also carries a `url`
pointing at the gallery page.

### `adapters/x.py` — the distinction that matters

gallery-dl with operator-supplied cookies, `--dump-json --no-download`, metadata-only. The whole
care in this file is telling **"I have no session"** apart from **"there is nothing new"**. Output
that hit the size cap is `MALFORMED_UPSTREAM`, because output we did not fully read is not output we
may call empty.

### `domain/scheduling.py`

One-hour floor, validated at construction and re-asserted where the value is written. Jitter from an
injected RNG (tests seed it). Platform staggering. 6/12/24-hour ladder on a strong signal, applied
**platform-wide** — a rate limit is a fact about the platform, not about the account that tripped it.
Start-up defers everything overdue past a grace window, staggered.

### `secrets/store.py`

AES-256-GCM envelopes. The namespace and name are the **associated data**, so moving an envelope
into another slot produces an authentication failure rather than a silently wrong credential. The
master key is root-owned `0400`, written through a temp file created with restrictive permissions
from the moment it exists, and never overwritten.

Backups deliberately **exclude the master key**. A backup holding both it and the envelopes is a
copy of every credential in wherever backups are kept.

### `logging_setup.py` — the ordering bug the tests caught

The `Bearer` and query-string rules must run **before** the generic `key=value` rule.
`Authorization: Bearer <token>` matches both, and the generic rule alone redacts the word "Bearer"
and leaves the token standing. A test pins it.

Telegram's error descriptions *are* persisted (History wants them) and are scrubbed **before** the
length bound, because they can quote the request URL — including the token that was in it.

## Tests

**`uv` is not installed here.** Use the checked-in virtualenv, which is the same toolchain:

```
.venv/bin/ruff format --check src tests   # 67 files already formatted
.venv/bin/ruff check src tests            # All checks passed
.venv/bin/mypy                            # no issues in 67 source files
.venv/bin/python -m pytest -q             # 594 passed, 2 skipped   (D6A5)
bash -n scripts/deploy-production         # syntax
scripts/release-preflight                 # refuses a release missing a first-party module
```

Synthetic fixtures only. **No test touches a live platform, Telegram or the network.** The deploy and
rollback tests drive a **sandbox host** through an overridable SSH binary and never leave the machine.

## Live state on the host

**Agent-verified:**

- Ubuntu 24.04.4 amd64, 1 vCPU, ~2 GiB, ~48 GB, confirmed by `deploy/00-preflight.sh`.
- 2 GiB swap active, root-owned `0600`, in `/etc/fstab`, `vm.swappiness=10`.
- Admin user `deploy` created with the existing keys copied; a **new** SSH session as that user
  verified **before** hardening; scoped `NOPASSWD` sudo works and is not blanket root; **not** in the
  `docker` group.
- Locked service user `remote` (uid 10001) owning `/var/lib/remote-sources` at `0750`.
- SSH hardened **after** that verification: password and challenge-response off, root
  `prohibit-password`. Both key logins re-verified afterwards; a password attempt is refused.
- Docker **29.6.2** and Compose **v5.3.1** from `download.docker.com`, enabled at boot.
- Image built; `docker compose config` valid; migrations applied; container **healthy**.
- Container: uid 10001, read-only rootfs, `cap_drop: ALL`, `no-new-privileges`, `tini` as pid 1,
  `restart: unless-stopped`.
- Port published **only** to `127.0.0.1:8099`. `ss -tlnp` shows **only SSH** on a public interface.
- UFW: default deny incoming; SSH, Tailscale UDP and the `tailscale0` interface only. The script
  fails if an application port ever appears — it does not.
- `/health` and `/ready` answer over loopback; `/api/v1/sources` without a token is **401**.
- Tailscale **1.98.9** installed and enabled at boot.

**Blocked — needs a human:**

- ~~**Tailscale node authorisation** and the private endpoint.~~ **Done by the user, and proven:**
  the phone paired and authenticated requests arrive. Funnel is off and the application port is still
  bound to loopback only.
- ~~Deploying a reproducible release.~~ **Done at D6A5, and it closed the D6A4 outage.** The host
  runs exactly `cb01747` and reports that commit itself. It is no longer carrying a hand-copied file.
- The **rollback path** has still never run against a real host — the D6A5 deployment succeeded, so
  nothing triggered it. Its *preconditions* did run: the backup, the snapshot and the
  prove-it-restorable step all executed before promotion.

**Not done — needs the user:**

- Every credential. `remote-sources-configure telegram | reddit | x-cookies` has not been run.
  **Claude did not request, read or handle any production credential, and must not.**
- ~~Pairing the phone.~~ **Done, and it works.** Devices: total 4, **active 1**, revoked 3.
  **Do not rework pairing** without an objective regression, and note that a deployment preserves it.
- **Nothing has ever been sent to Telegram from this server.** No connector has completed a live
  check → review → send. A live 9GAG check *was* attempted and was refused with 403 — which is the
  only live platform evidence there is.

## Connector status, honestly

| | Discovery | Extraction | Credentials | Live-tested |
| --- | --- | --- | --- | --- |
| 9GAG | **accounts and Interests** — two distinct source types | direct CDN URLs | optional cookies, **configured** | **refused live — anti-bot challenge on every deep path**, classified `challenge` |
| Reddit | implemented | Reddit's own media URLs | **required** | **no** |
| X | implemented | gallery-dl URLs | **required** | **no** |
| Instagram | **implemented at D6A5** | gallery-dl, Instaloader fallback | **required** | **no** |
| TikTok | **implemented at D6A5** | gallery-dl + yt-dlp | **required** | **no** |

**Do not describe any connector as end-to-end validated.** Mocked tests prove the parsing and the
classification. They prove nothing about the live platforms.

**9GAG has two source types since D6A6** — an account feed and an Interest feed — and neither is
ever normalised into the other. Only `hot` and `fresh` exist as Interest feed modes, proved against
the live site. **9GAG refuses this host on every deep path** even with a correctly configured
session, which is classified `challenge` and is not something this project will work around.

## D6A1 — what the first live pairing attempt proved, and the one command it added

Sanitised, and no raw log was copied.

**This server behaved correctly at every step.** The private Tailscale HTTPS endpoint answered the
phone, `POST /api/v1/pairing/exchange` returned **success** and minted a device token, and re-using
the consumed code afterwards was **refused** — the single-use rule working, not a second fault.

The failure was entirely on the Android side: its secure-storage layer accepted only the Telegram
bot-token reference and refused the remote device token, so every successful exchange was discarded
by the phone. Fixed in the app at D6A1 (`0.13.1-d6a1`, versionCode 26). **No server code needed to
change for that**, and no API change was made — the app's pairing rollback reuses the existing
authenticated `POST /api/v1/device/revoke`.

### The one thing the server did need

Each successful-but-discarded exchange left an **active device record whose plaintext nobody holds**.
This server keeps only `sha256(token)` by design, so it cannot tell those from working devices and
cannot hand the plaintext back. The only honest remedy is to revoke everything and pair again.

Added, in `api/auth.py` and `__main__.py`, surfaced through `scripts/remote-sources-ctl`:

- `remote-sources devices` → `{"devices_total": n, "active": n, "revoked": n}`. **Counts only** — no
  token, no token hash, no device id, no label, no address, no timestamp, no raw row.
- `remote-sources revoke-all-devices --confirm` → refuses without the flag (exit 2, nothing
  changed), **revokes rather than deletes** so `revoked_at` keeps the audit trail, commits once so a
  failure changes nothing, is idempotent, prints counts only, exits non-zero with a **fixed** message
  on failure (an exception's text can carry a path or a row).
- The `ctl` wrapper forwards `--confirm` from the operator's own command line and **never supplies it
  itself**. Typing the wrapper's name is not consent.

12 tests in `tests/test_device_cleanup_cli.py`. Suite 331 → **343**, 0 failures.

## D6A2 — this repository was not modified

The Android milestone after D6A1 fixed three regressions the device reported: a completing upload
closing a different item's Preview, permanent deletion still not working, and settled album shells
staying in the Upload Queue. **All three were Android-local.** The server was inspected as context
and no objective cross-contract defect was found, so nothing here changed and this repository's HEAD
is still `31d2edf`.

The Android app to install is now **versionCode 27 / `0.13.2-d6a2`**, which supersedes D6A1.

**Nothing below has moved.** The orphan-device cleanup and the pairing order are still exactly as
D6A1 left them, and remote pairing has still never completed on a device.

## D6A3 — the first hardware pairing, and three server changes

**Pairing works end to end on the physical device.** Paired, Connected, and authenticated
system-status, destinations, sources, review and history all returned data. Device counts: total 4,
**active 1**, revoked 3. Destination creation over the API worked. **Do not rework pairing.**

### 1. Destinations are created *or reused*

`POST /destinations` keys on `(chat_id, thread_id)` — already the table's unique constraint — and
returns the existing row untouched, label included.

**Why the server had to be the one to do this:** the endpoint deliberately never returns `chat_id`
or `thread_id`, so the Android app cannot recognise a topic it already registered and therefore
cannot avoid duplicating it. That rule stays; reuse moved here instead. Every source already mapped
to a destination keeps working. The response shape is unchanged and still identifier-free.

The Android form now offers locally connected Telegram topics **by name**, with no chat or thread
field anywhere — which is what makes the same topic legitimately arrive again for a second source.

### 2. 9GAG's 403 — Ready now means the prerequisites are satisfied

**The deployed host was answered 403 twice.** Two defects behind that:

* `classify_http_status` calls 401/403 `AUTHENTICATION_EXPIRED`. Correct when a session existed;
  precisely wrong when none was ever configured, because it sends an operator to renew a credential
  that does not exist.
* `setup_required = requires_credentials and not configured`, so 9GAG — which requires none —
  reported **Ready** while being refused in production.

Now: no session → `SETUP_REQUIRED`; session configured → `AUTHENTICATION_EXPIRED`.
`AdapterCapabilities.optional_credentials` marks a connector that accepts a credential without
requiring one, and `_setup_required` also fires when such a connector's last recorded platform
signal was setup-shaped. **"Declares no credential" and "works from this host right now" are
different claims**, and only the first had ever been tested.

Optional `NINEGAG_COOKIES` + `remote-sources-configure ninegag-cookies <path>` — the X precedent
exactly: a path not a value, encrypted at rest, decrypted for one check, never returned by any
endpoint, **never sent to Android**. Browser-compatible headers only; **no challenge solving, no
proxy rotation, no retry-until-allowed**. One sanitized line per refused validation: connector,
classification, reason — no URL, account, cookie, body or header.

**Still not verified live.** Nothing has succeeded from the deployed host since the 403.

### 3. One-command deployment

`./scripts/deploy-production [--dry-run]`, from the development checkout, never from the host.

Refuses on: wrong repository, not `main`, dirty tracked tree, `HEAD != origin/main`, missing release
files, or a host that does not already carry this deployment. Then backs up **and verifies** the
database, ships `git archive` of the committed HEAD (**no `.git`, no GitHub credential** — the host
deliberately has neither), stages under `.releases/`, and promotes with `rsync --delete`.

**That last part is the defect in the old procedure:** unpacking an archive over the running tree
leaves behind every file a newer release deleted, and produces no error. Host-only state is excluded
by name — environment file, secrets, database, backups, staging, Tailscale, SSH — which is what
makes those exclusions load-bearing now that `--delete` is in play.

Then `90-deploy.sh` unchanged, and verifies the operator CLI, loopback health, that the application
port is **not** on a non-loopback address, Tailscale backend state and container status. On failure
it restarts the previous release and says the backup is intact.

`RELEASE_COMMIT` marker + `remote-sources-ctl version`, which validates the marker is a 40-character
hex SHA before printing. Config in git-ignored `deploy/production.env`. **Never automatic.**

369 tests, 0 failures. **No device record, pairing, destination, source or runtime state is touched
by any of this, and nothing was deployed.**

## D6A4 — the outage, and four server changes

**The D6A3 deployment failed on the host.** It built, migrated, recreated the container, and then
restart-looped:

```
ModuleNotFoundError: No module named 'remote_sources.secrets'
```

`.gitignore` line 29 was `secrets/`, unanchored, and matched `src/remote_sources/secrets/`. The
package was **never tracked**: `git ls-files` returned nothing for it. `git archive` shipped a
release without it, `COPY src ./src` built an image without it, and `rsync --delete` — the D6A3
improvement — removed the copy the host already had.

**Recovery required copying the package to the host by hand, plus a reboot.** The service is healthy
and **the commit it is running cannot be rebuilt from Git**. Deploying `ffab607` is what closes that,
and it is the first action of the next session.

**Why 369 tests were green through all of it:** tests import the working tree, where the file exists
— and the venv carries an **editable install pointing at the checkout**
(`_editable_impl_remote_sources.pth`), so even a deliberately isolated import was satisfied by the
very copy that was not going to ship. Any test about what a release *ships* must assert the loaded
module's path, or it is worthless.

### 1. Release integrity

Rules anchored to the repository root — `/secrets/`, `/cookies/`. Runtime secret material lives in
the host state directory, never here, so anchoring loses nothing. A blanket `!/src/**` negation was
written and **rejected**: it un-ignores `__pycache__`. A guard test asserts both properties at once.

`src/remote_sources/secrets/{__init__,store,cli}.py` are now tracked. **No key, no envelope, no
ciphertext, no cookie and no environment file became tracked.**

`tests/test_release_integrity.py` reads the **index** (`git write-tree`), not `HEAD`, so a gap fails
*before* the commit; and `_assert_loaded_from_export` asserts the loaded module's path is inside the
export, without which it passes on an empty archive.

`scripts/release-preflight` walks the first-party import graph from the container's real entry points
(`__main__.py`, `runtime.py`, `api/app.py`, `api/routes.py`, `secrets/cli.py`) and compares it to
`git archive` members. **Run against the pre-fix HEAD it refuses and names the package.** The deploy
script executes it directly — the shebang decides the interpreter, which matters for the test stubs.

### 2. A rollback that restores

The old failure path printed *"attempting to restart the previous release"* and ran
`docker compose up -d` **against the already-promoted broken tree**. It restored no files, no marker
and no database. A message describing a recovery that did not happen is worse than none, because the
operator reading it stops looking.

Now: verified database backup, snapshot the running release to `.releases/previous-<id>`, prove it
restorable (compose file, deploy script, `src/remote_sources`), record the prior `RELEASE_COMMIT`,
then promote. On any post-promotion failure — stop, restore tree, restore marker, restore the
verified backup **when migrations may have run**, restart, wait for health, and only then print *the
previous release is restored and healthy*. Otherwise `ROLLBACK FAILED` and the host's actual state.

`RS_DEPLOY_SSH` overrides the SSH binary, so `tests/test_deploy_rollback.py` (13 tests) drives a
sandbox host with stubbed `sudo`/`docker`/`rsync`/`curl`/`ss`/`tailscale`/CLI, injects a failure at
each stage, and asserts **restored state on disk** rather than wording — including a rollback that
itself fails and a backup that no longer verifies. `RS_DEPLOY_HEALTH_RETRIES`/`_INTERVAL` bound the
health wait so the suite stays fast.

### 3. A release marker the container can read

`remote-sources-ctl version` returned `{"version":"0.1.0","deployed_commit":null}` on a correct
release: it read `/opt/remote-sources/RELEASE_COMMIT`, a **host** path the container does not mount.

`Settings.release_commit_file` (`RS_RELEASE_COMMIT_FILE`) defaults inside `data_dir`, which
`compose.yaml` already bind-mounts — a **directory** mount, chosen deliberately: a missing single-file
bind target makes Docker create a directory, which is a silent trap for whoever deploys next. A test
asserts the default's parent is `data_dir` **and** that `compose.yaml` mounts it.

`read_release_commit` does a bounded read and accepts **only** 40 lowercase hex characters.
Directory, oversized, uppercase, trailing content, undecodable bytes → `None`. 20 tests. The
deployment writes the marker to both locations and **fails and rolls back** if the running service
does not report the promoted commit.

### 4. Readiness learns from a validation

The live 9GAG refusal was classified correctly — `connector=ninegag classification=setup_required
reason=http_403`, returned in a 200 — and the platform list still said Ready. `PlatformHealth` was
written only by the **scheduler**, which runs for source *rows*; validating a source that did not
exist yet touched nothing durable.

`validate_source` gained `session: SessionDep` and calls `_record_validation_signal`, which stores
`last_signal`/`last_signal_at` for setup-shaped outcomes and clears a setup-shaped signal on success.
**Platform, classification, timestamp — nothing else**; the table has no column that could hold a
URL, an account, a cookie or a body. `blocked_until` and `strong_signal_count` are untouched: one
person pressing Validate must not silence the scheduler, and one request getting through does not
disprove a rate limit. 10 tests, including survival across a restart.

### 5. Animated media

`MediaKind.ANIMATION` in an existing `String(16)` column — **no migration**.

* **9GAG:** `_ANIMATED_TYPES = {"Animated"}`; the `image460sv` MP4 rendition is preferred, with a
  real `image/gif` asset as fallback.
* **Reddit:** direct `.gif`, `.gifv` (**refused** with no MP4 — it is an HTML page), `image/gif`
  gallery members (preferring the member's `mp4`), and `preview.reddit_video_preview.fallback_url`.
* **Fetching:** `_DOCUMENT_CONTENT_TYPES` raises `MALFORMED_UPSTREAM / media_is_a_document`, so no URL
  extension can stage a web page as media. `_DEFAULT_EXTENSION[ANIMATION] = ".mp4"`.
* **Telegram:** `sendAnimation` for a single animation; inside an album it travels as `video`,
  because `sendMediaGroup` has no animation type.
* Identity is the post's, so two renditions cannot become two review items. 22 tests.

**443 passed, 1 skipped.** `ruff format --check`, `ruff check`, `mypy` and `bash -n
scripts/deploy-production` all clean. **Nothing was deployed; the production VPS was not accessed and
no SSH connection was made.**

## D6A5 — Instagram, TikTok, a conformance suite, and the first verified deployment

The server changes were committed and pushed **before** the session was interrupted, and were
deliberately **not redone** on resumption. Nothing in the Android integration or in the four device
findings required a further server change, so `cb01747` is both the D6A5 commit and the deployed one.

- **Instagram** and **TikTok** connectors, which had been prepared boundaries reporting unsupported.
  Both **require** credentials and correctly report `SETUP_REQUIRED` until a session is configured on
  the server. Neither has ever been exercised against the live platform.
- **A connector conformance suite** every adapter must pass, so a new connector cannot quietly skip
  the classification and cursor rules the older ones follow.

### The deployment, and exactly what it verified

`./scripts/deploy-production --dry-run`, then `./scripts/deploy-production`, from the development
checkout. The dry run printed the **preflight** and **snapshot** steps, which is what D6A4 asked for.

| Check | Result |
| --- | --- |
| `remote-sources-ctl version` | **`cb0174765306f429225b299845d6f11456dc666d`** — a 40-character commit. **`null` is gone.** |
| Deployed commit vs `origin/main` | identical |
| Container | `remote-sources-api-1 Up (healthy)` |
| `GET /api/v1/health` over loopback | **200** |
| `GET /api/v1/ready` over loopback | **200** |
| `GET /api/v1/sources` unauthenticated | **401** |
| Application port on any non-loopback address | **none — 8099 does not appear** |
| `remote-sources-ctl devices` | total 4, **active: 1**, revoked 3 — **the pairing survived the deployment** |

The only non-loopback listeners are `sshd` on 22 and `tailscaled` on its own Tailscale addresses.

**No credential was requested, read, handled or recorded, and nothing was sent to Telegram.**

### Two corrections worth carrying forward

- **`git status` clean is not `release-preflight` clean.** The script reads `HEAD`, so a new module
  that is staged but uncommitted still fails it — run it against `git write-tree` before the commit
  exists, which is what the *test* does. It caught two new modules in D6A6, exactly as designed.
- **A scheduling bucket is not a sentence.** `CHALLENGE` and `RATE_LIMITED` share the backoff ladder
  because both mean "stop asking for hours". They are not the same fact, and D6A6a is the milestone
  where the app was rendering the bucket instead of the refusal. Whenever outcomes are grouped for
  *timing* here, check nothing user-facing mirrors the grouping.
- **One connector wanting a header string while four want a jar file is a trap.** D6A6's whole
  root cause. Accept what the operator actually exports, and validate it at import time.
- **The health routes are `/api/v1/health` and `/api/v1/ready`.** An earlier note in this file said
  `/health` and `/ready`; those return **404**. The deploy script has always probed the correct
  paths, so the error only bites someone verifying by hand — and it looks exactly like an outage.
- **Reuse the deploy script's own `remote()` construction** when running an ad-hoc command:
  `-o BatchMode=yes` plus `-i "$RS_DEPLOY_KEY"` from `deploy/production.env`. Rebuilding the SSH
  invocation by hand and omitting the key both fails **and** prints the host address, which must
  never be recorded anywhere.

## D6A6 — the requirement as it was recorded (now implemented; see the section below)

**Kept as written, because recording a requirement before any code exists is the practice this
project wants to keep.** Everything in it is done — see *the cookie root cause, the Interest source
type, and the publisher's safety half* below for what was actually found and built.

The 9GAG source the user actually wants is a **9GAG Interest page**, public URL shape
`/interest/<slug>`, optionally carrying a feed mode such as `/hot`. `adapters/ninegag.py` discovers
**only** `https://9gag.com/u/<username>/posts`.

> **An Interest is not a profile, and this adapter must never pretend otherwise.** Quietly rewriting
> a pasted Interest URL into a user profile would produce a source that looks accepted and then
> discovers the wrong feed, or nothing, with no way for the user to tell which. There is already a
> precedent for refusing that coercion: `domain.identity.normalise` refuses an Instagram story URL
> **by name** rather than letting it become a profile. Do the same here.

| Requirement | Owner |
| --- | --- |
| An **explicit Interest source type** in `AdapterCapabilities.source_types`, beside the profile type — two types, never one with a mode flag bolted on | Android + server |
| Accept and normalise **only genuine `/interest/<slug>` identities**; anything else refused with a sanitized reason | Server |
| **Never silently convert** an Interest URL into a profile, or a profile URL into an Interest. Refused by name, and a test asserts it | Android + server |
| Support the applicable **feed modes deliberately** — enumerated and chosen, never inherited from whatever the page defaults to | Server |
| **Ordered posts with stable post IDs.** Identity is the post's, so two renditions cannot become two Review items | Server |
| **Bounded pagination**, with the ceilings the profile path already uses | Server |
| **Cursor and idempotency unchanged** — `advances_cursor` stays defined as `is_success`; rediscovery still collides on `(source_id, canonical_post_id)` | Server |
| **Malformed upstream stays safe** — an unreadable payload reports `MALFORMED_UPSTREAM` and stops, never rounded down to "nothing new" | Server |
| **Animated media preserved** — `ANIMATION`, MP4 rendition preferred, real `image/gif` fallback | Server |
| **Deterministic synthetic fixtures** shaped like the real payload; no test contacts 9GAG | Server |
| **Connector-conformance coverage** — a harness in `tests/test_connector_conformance.py`, or the suite fails by design | Server |
| Android **source-type selection** plus **Hebrew and English** help and identity hints | Android |

**The identity stored must remain sanitized:** the slug and the chosen feed mode, and nothing else.
No URL, no account, no cookie — the same rule every other source row follows.

**Live verification is a separate item and is blocked.** The deployed host is answered **403 by 9GAG
without a configured session**, so `remote-sources-configure ninegag-cookies <path>` remains a
prerequisite for any live Interest check. **Implementation being complete is never, on its own,
evidence that this works** — which is exactly the mistake the 9GAG readiness bug made at D6A3.

Itemised in this repository's `TODO.md` and as rows 29–31 in
`/root/work/telegram-topic-uploader/TODO.md`.

## D6A6 — the cookie root cause, the Interest source type, and the publisher's safety half

### 1. Why both 9GAG checks returned the same generic message

`remote-sources-configure ninegag-cookies` stored the file's bytes verbatim, and `NineGagAdapter`
injected them into an HTTP `Cookie` header. The operator supplied the ordinary thing — a **Netscape
`cookies.txt`**, which is exactly what X, Instagram and TikTok want here because gallery-dl and
yt-dlp consume a jar *file*. A jar is multi-line and tab-separated, so `httpx` raised
`LocalProtocolError` **before a byte left the process**; the adapter caught it with genuine transport
faults and reported `TEMPORARY_FAILURE`.

**Stage reached: header construction.** DNS, TCP, TLS and HTTP were never attempted — which is why
an Interest source and a profile source produced *identical* messages and looked like one bug.

`adapters/cookies.py` reads both forms now, the CLI refuses an unusable file **at import time**, and
unusable material is `SETUP_REQUIRED` rather than "unreachable". Two more corrections:

- **`#HttpOnly_` is a domain annotation, not a comment.** Skipping those lines produced a header
  that looked fine and authenticated nothing.
- **A challenge page is a challenge whatever status carries it.** 9GAG serves its anti-bot page with
  a 403; classified from the status alone it read as "configure a session", which is useless advice
  to an operator who already had one. The body is inspected before the status now.

**Live, from the deployed build:** session readable, site root 200, and both `/u/<name>/posts` and
`/interest/<slug>` (`hot` and `fresh`) → `challenge / anti_bot_challenge`. **The defect is fixed and
proven fixed; the platform still refuses this host.** No challenge solving, no proxy rotation, no
retry-until-allowed — by design.

### 2. 9GAG Interest

`SourceType.NINEGAG_INTEREST`, distinct from the account type, with cross-type refusal **by name** in
both directions. A bare word is ambiguous and is resolved only by the type the caller chose.

**Feed modes proved against the live site:** `/hot` and `/fresh` answer with the page payload;
`/trending`, `/top`, `/new` are 404. The bare path is the site default and is stored **explicitly**
as `hot`. The Interest payload is the account payload with `interest` where `profile` would be —
which is why validation checks for its *own* object; a request built for the wrong one would parse.

**A defect found while writing it:** a trailing slash was enough to change a source's *kind*.
`interest/` reduced to the bare word `interest`, no prefix matched, and it became an account named
"interest" — silently. Reserved segments are refused by name now.

**Conformance is keyed by source type, not platform.** A per-platform map would have run every
property against the account feed and reported itself complete.

### 3. `RESULT_UNKNOWN` resolution

`POST /review/{id}/resolve-unknown`, two answers and neither is a resend. *Delivered* confirms the
item without inventing a message ID — **the operation row keeps `RESULT_UNKNOWN`**, so the evidence
trail still says exactly what Telegram told this server, which was nothing. *Not delivered* returns
it to Review. Anything that is not `RESULT_UNKNOWN` is refused: a confirmed item has evidence and a
failed one has a verdict, and a button may overwrite neither.

### 4. The Instagram Publisher — vocabulary and safety rules only

**Implemented:** 16 `InstagramPublishState` values, six `InstagramPublicationType` values,
`InstagramAccountType`, three `instagram_publisher/*` secret refs, and
`domain/instagram_publishing.py` — Story eligibility from **Meta's** account type rather than a local
setting, the bounded missed-schedule grace period (a six-hour-late Story never goes out silently
after an outage), carousel bounds, cancel and retry safety, and the classification that makes an
undetermined publish `RESULT_UNKNOWN` rather than a retry. 23 tests; none can produce a published
state, which is itself asserted.

**Not implemented:** OAuth with Instagram Login, the container-workflow executor, server-side
scheduling, and the Meta-readable temporary media delivery boundary.

> **The reasoning, to preserve rather than re-litigate.** None can be exercised without the user's
> Meta App and authorization. An OAuth flow and a publishing client that has never once run against
> Meta is not something to deploy here on the strength of mocked tests — and the parts that are both
> dangerous to get wrong and verifiable without an account are exactly the parts that were built.

**Never request a Meta app secret or access token in chat.** Rows 43–54 of the application's
`TODO.md` track the rest; 47–48 are blocked on the user.

### Deployment

`a985e2d` deployed and verified: exact commit reported, `/api/v1/health` and `/api/v1/ready` 200 over
loopback, unauthenticated route 401, application port **loopback only** (the only non-loopback
listeners are `sshd` and `tailscaled`), `devices` still **active: 1**, and both configured
credentials — `telegram/bot_token` and `ninegag/cookies` — present. **No secret value was displayed.**

**691 passed, 4 skipped.** `ruff format --check`, `ruff check`, `mypy` and the release preflight all
clean.

## D6A6a — the status that contradicted its own validation, and why this repository was not the cause

**Reported from the device.** Check source returned `challenge` for both 9GAG source types while the
Remote Sources platform list persistently said *rate limit*.

**Traced here first, because the obvious suspicion pointed here.** Production held:

```
platform=ninegag  last_signal='challenge'  blocked_until=None  strong_signal_count=0
```

**No rate-limit signal existed anywhere to be stale**, and the scheduler had never run for 9GAG.
The API serialized `challenge` and the app parsed it correctly. **The cause was one missing member in
the Android readiness enum**, which folded `CHALLENGE` into `RATE_LIMITED`. Fixed there.

### What this repository gained: the guard rail

`CheckOutcome.CHALLENGE` and `CheckOutcome.RATE_LIMITED` **share the backoff ladder and nothing
else.** Both are strong backoff signals — grouping them for *scheduling* is correct — and only one
of them is setup-shaped, so only one can be cleared by configuring the server.

| | `CHALLENGE` | `RATE_LIMITED` |
| --- | --- | --- |
| Strong backoff signal | yes | yes |
| Setup-shaped (cleared by a successful validation) | **yes** | no |
| Written by a validation | **yes** | no — a validation cannot create one |
| Written by the scheduler | yes | yes |

`tests/test_platform_signal_ordering.py` (11 tests) pins it: both writers stamp the current instant,
so **a stale signal cannot overwrite a newer one by construction** rather than by a comparison
somebody has to remember; a genuinely newer result wins in either direction; and a successful
validation clears a challenge but never a rate limit. `docs/CONNECTORS.md` carries the same table.

**No production code changed here.** `7564912` was deployed anyway so the running commit still
equals `origin/main`, and the persisted `challenge` signal survived the deployment unchanged.

### Live evidence, from the device

Both 9GAG source types reach this connector and report the challenge correctly. That confirms the
D6A6 cookie fix end to end from the phone. **Discovery remains refused by 9GAG on every deep path.**

## D6A7 — a cookie jar this server could not reach, reported to the phone as a broken session

**The device evidence.** Instagram Remote Source validation displayed the Hebrew equivalent of
*"The server refused the request"*, and the phone's global state then said the server could not be
reached. Neither sentence was true.

**The root cause, from this server's own log, before anything was changed:**

```
PermissionError: [Errno 13] Permission denied: '<runtime dir>/instagram-cookies.txt'
```

`compose.yaml` declared the runtime tmpfs under **`volumes:` in long form**, which accepts only
`size` and `mode`. Docker therefore mounted it **root-owned, mode 0700**, while the service runs as
`10001:10001`. The application could not so much as `stat` a file in its own runtime directory.
`Runtime._cookie_file` had a guard for exactly this — and the probe sat **outside** it, so the
exception left the composition root, passed through the route, and became a generic **500**.

### Three wrongs from one mount option

1. **Every path-based connector was broken in production** — X, Instagram and TikTok, on every
   call. 9GAG was unaffected and kept answering normally, because its cookies are a **header read
   into memory** and never become a file. That asymmetry is why the fault looked Instagram-shaped.
2. **The platform list reported those three Ready.** `credentials_configured()` reads the encrypted
   envelope, and nothing asked whether the jar could actually be produced.
3. **The phone was told something indistinguishable from "your session is broken."** The obvious
   action — export the cookies again — was work, was sensitive, and would have changed nothing. The
   envelope was present and intact throughout.

### What changed

| Change | Why |
| --- | --- |
| `compose.yaml` mounts `/run/remote-sources` through the **short-form `tmpfs:` list** with `uid`/`gid` | It is the only form that can carry ownership. Verified against the deployment host with a disposable container **before** the file was edited. |
| `Runtime._cookie_material` is **total** | Three states, no exception escapes. The probe is now inside the guard. |
| `CredentialMaterialState` — `NOT_APPLICABLE` / `ABSENT` / `READY` / `UNREADABLE` | `ABSENT` and `UNREADABLE` call for **opposite actions**. Collapsing them is what sends somebody to re-export a session that is already correct. |
| `AdapterContext.credential_material_unreadable` | Both faults arrive inside an adapter as `None`. The distinction is carried rather than guessed. |
| Each adapter names its own two — `instagram_session_absent` / `instagram_session_unreadable`, and the same for X and TikTok | One vocabulary per connector, no generic sentence. |
| Each adapter's own path probe is total as well | It was the **second** place the exception escaped. |
| `POST /sources/validate` answers `setup_required` / `credential_material_unreadable` | A structured **200**, never a 500. |
| `_setup_required` gained a third way in | A connector whose material this server cannot read must not read as Ready. |

### Verified on the deployed host, 2026-07-27

- ✅ Runtime directory: `mode=700 owner=10001:10001`. It was `0:0`.
- ✅ `instagram → configured=True material=ready`. **The jar materialised for the first time.** This
      exact call raised `PermissionError` before the fix.
- ✅ `x → absent`, `tiktok → absent` — genuinely not configured, correctly distinguished from
      unreadable. `ninegag`/`reddit → not_applicable`: neither has a file-shaped credential.
- ✅ Health 200, readiness 200 with every sub-check true, unauthenticated `/sources` 401.
- ✅ Port 8099 **loopback-only**. Non-loopback listeners: `sshd`, `tailscaled`, and `systemd` on 22
      and the local stub resolver.
- ✅ Devices: 4 total, **1 active**, 3 revoked. Sources: 0.
- ✅ 722 passed, 4 skipped. `ruff`, `ruff format`, `mypy` clean. `release-preflight`: 42 modules.

### Still open

- [ ] **The live Instagram validation answer is unknown.** The 500 hid whatever the real answer was.
      The first honest validation from the phone is itself new evidence and must be recorded **with
      its exact code**.
- [ ] **Do not ask the user to export any cookies** until evidence shows the configured session is
      itself missing or rejected. It was not, and asking was the wrong action the whole time.
- [ ] 9GAG automatic discovery remains **platform-blocked** by the anti-bot challenge from D6A6a.

## D6A7e7b — no server change, and the roadmap it did add

**This repository was not touched.** `SERVER_HEAD` and `DEPLOYED_HEAD` are both
`c7536bf64f23b80feb92f9eac2e1e2c915c0d0fd`. D6A7e7b is Android-only, and the only server work was a
**read-only audit**.

**What the audit established, and why the app needed no new endpoint.** Remote History has exposed
**both** `created_at` and `confirmed_at` since `history.v1`, and Android has parsed both since D6A7c.
`confirmed_at` is assigned in **exactly one place in `src/`** — `_settle_confirmed`, reached only
from the `SendOutcome.CONFIRMED` branch — so it is null for `FAILED_BEFORE_DISPATCH`,
`FAILED_AFTER_DISPATCH`, `RESULT_UNKNOWN` and every still-running operation. `created_at` is the
column default, stamped when `create_operation` inserts the row, **before any Telegram request is
made**. So the two are the start and the end of one delivery, and no field was missing: the phone
simply had no rule about which one a sentence may quote. It has one now, and it requires both the
`confirmed` state and the timestamp.

**One edge worth remembering for any future History work.** Resolving a `RESULT_UNKNOWN` item as
*delivered* sets the **item** to `CONFIRMED` and deliberately leaves the **operation** at
`RESULT_UNKNOWN` with `confirmed_at` still null (`routes.py`, the resolve-unknown route). The phone
therefore states no send time for such a row, which is correct — a person reading a topic is not
Telegram — but it means "the user considers it delivered" and "Telegram confirmed it" are genuinely
different rows on that screen, and neither may be rendered as the other.

**TikTok, since the report named it.** This server already supports TikTok fully:
`Platform.TIKTOK`, `SourceType.TIKTOK_PROFILE`, membership in `SUPPORTED_PLATFORMS`, and a real
adapter advertising `profile_discovery=True`, `requires_credentials=False`,
`optional_credentials=True`, exactly one source type and **no** feed modes. `/system/status`
advertises all of it. **The reported failure was a phone layout defect** — the fifth chip clipped out
of a non-wrapping row — and **no platform request occurred** during the milestone.

### Recorded here as future server shape only — the multi-account Instagram publisher

Not implemented, not designed in code, not configured, and **Meta was not contacted**. The
Android-side roadmap rows are 213–219 in the application's `TODO.md`; what belongs to *this*
repository when it is eventually built:

- An `InstagramPublisherAccount` entity with an **opaque internal id as its primary key — never the
  username**, plus a user-facing label, a Meta-reported account type, a connection state, an
  authorization generation, encrypted token material **per account**, expiry/refresh metadata where
  applicable, connected and revoked timestamps, and capabilities derived from Meta's own response.
- **Several accounts authorised independently.** Disconnecting one, or one needing
  reauthorization, must not disturb the others; one account's failure or backoff must not silently
  stop every other unless Meta's response proves the condition is app-wide.
- **Tokens, app secrets and refresh secrets never leave this server.** Android receives safe account
  metadata and connection state only — the same boundary the viewing-session credentials already sit
  behind.
- **A publication's target account is frozen at queue or schedule time** and is never redirected by
  a later default change, never fallen back from, and never automatically retried onto a different
  account. Publication history keeps the frozen safe label even after a rename or a disconnection.
- Idempotency and duplicate protection are scoped to the exact target publishing account.
- Revoking one account deletes only that account's usable token material.
- Server-side scheduling continues with the phone closed.
- A personal account Meta cannot publish to is represented as **unsupported**, never coerced into a
  professional-account state.

**And the separation that must never blur here of all places.** The **Instagram viewing session**
this server already holds is a read-only credential for Remote Sources *discovery*. An **Instagram
publishing authorization** would be a Meta account grant for *posting*. Two different credentials,
two different purposes, and **neither may ever substitute for the other**.

## Next action

**Nothing on the server.** It is deployed, healthy, and running a commit that is reproducible from
Git for the first time since the D6A3 outage. D6A7 (`b307b08`) is live and verified.

1. Install the **D6A7** APK (`0.13.8-d6a7`, code 33) and **validate an Instagram source**. This is
   the first honest Instagram validation this deployment has ever been capable of answering — every
   previous one hit the 500. **Record the exact code the phone shows in brackets.** Whatever it is,
   it is new evidence, and it is not a reason to export cookies unless it says the session itself is
   missing or rejected.
2. 9GAG: Validate from the app; expect a message naming the platform refusal rather than a generic
   one, and the platform list to show **needing setup** after a refresh, surviving a restart.
3. Optional: configure a cookie export server-side and Validate again.
4. Configure X and TikTok sessions if those platforms are wanted; both correctly report `absent`
   until then. **Instagram is already configured and its material is now `ready`** — nothing about
   that session needs touching.
5. One source at a **disposable** topic, initial import **Last 5**; then one animated item, which
   should arrive as a looping animation.

`docs/D6A_LIVE_CHECKLIST.md` carries the same order with the failure history attached.

**Nothing past pairing has ever run end to end.** No connector has completed a live check → review →
send, and a successful deployment is not evidence that one would.

## Gotchas for the next session

- **Docker is not available in the PRoot dev environment.** The image must be built on the VPS.
- **A Compose long-form `tmpfs:` under `volumes:` accepts only `size` and `mode`.** It cannot carry
  `uid`/`gid`, so a non-root service gets a directory it does not own and cannot read. Use the
  short-form service-level `tmpfs:` list for anything a non-root process must write. This cost a
  silent production outage of **three connectors at once**, invisible because the fourth kept
  working — and it looked, from the phone, exactly like a broken credential.
- **A read of the container's own runtime state is the cheapest real diagnosis available.** One
  `docker exec` printing `stat -c %a %u:%g` on the runtime directory answered in seconds what the
  sanitized API responses could not express at all. Reach for the log and the mount before the code.
- **The health routes are `/api/v1/health` and `/api/v1/ready`.** The bare paths 404. Verifying a
  healthy service with the short paths looks exactly like an outage.
- **Run an ad-hoc remote command through the deploy script's own SSH construction** — the key from
  `RS_DEPLOY_KEY` is required, and omitting it prints the host address in the error.
- **A console script's shebang is an absolute path baked in at install time.** Building the venv at
  `/build` and copying it to `/app` produced entry points pointing at an interpreter that no longer
  existed; the builder now works at the runtime path. This cost one rebuild.
- `alembic` needs `RS_DATABASE_PATH` and `PYTHONPATH=src` when run outside the container.
- The `TelegramSender` protocol exists so the delivery engine depends on behaviour rather than on
  the concrete client — that is what lets tests substitute a transport that never opens a socket.
- Reservations are keyed on `(destination, sha256, byte_size)` — the **natural** key, not the row id.
  A gallery may legitimately contain the same image twice, and inserting by row id crashed a
  confirmation that had already happened.
- **`uv` is not installed in the dev environment**, whatever the docs say to run. `.venv/bin/ruff`,
  `.venv/bin/mypy` and `.venv/bin/pytest` are the same toolchain `uv run` would invoke.
- **`rsync` is not installed here either.** The deploy tests ship a Python `rsync` stub honouring
  `--exclude` for both copy and delete.
- **The venv's editable install points at the checkout.** Any test about what a release *ships*
  must assert the loaded module's path, or the checkout answers the import and the test proves
  nothing. This is exactly how the outage stayed invisible.
- **`python3 -I` ignores `PYTHONPATH`.** Insert the path with `sys.path.insert` inside the `-c`
  snippet.
- **An unanchored `.gitignore` directory rule matches at every depth.** `secrets/` cost a
  production outage. Anchor runtime-state rules to the root, and check `git check-ignore -v`
  before assuming a source file is tracked.
- **Ruff `E501` fires on embedded shell/Python stub programs** in the deploy and release tests;
  both carry per-file ignores with stated reasons.
- **Issue-once is a property, not a gap.** Because only the hash is stored, a device record whose
  token the phone never kept is indistinguishable from a working one. That is the price of never
  being able to leak a token from a database copy, and `revoke-all-devices` is the whole remedy.

---

## D6A7a — no server change, and the tracing that proves it

**D6A7a is an Android-only corrective milestone**, opened on a hardware addendum received after
D6A7 had already been committed. It repaired four device-reported defects and **this repository was
not modified, not deployed and not accessed**. The head above is unchanged.

The addendum permitted a server change only if objective tracing proved the local Telegram upload
API contract was involved. It traced to four causes, none of which touches this server or any remote
connector:

1. **A confirmed upload reappeared in Review.** `RoomScanRepository.upsertReviewJob` reuses a
   placeholder found by `topicDestinationId IS NULL AND status = 'AWAITING_ROUTING'`, which a
   confirmed job never matches, so a rescan inserted a second placeholder for media Telegram already
   held. Purely local scan/routing state.
2. **Its permanent deletion never reached the Android document provider.** That placeholder made
   `countOtherSourceDependentJobs` non-zero, so `SourceDeletionGate` refused before
   `markAttemptStarted`. Purely local SAF/deletion state; **no Telegram request is made on that path
   at all, by design.**
3. **Upload queue could be a silent no-op.** `armPendingBatchStart` did not re-attempt an
   already-armed start and a window-focus deferral said nothing. Purely an Android JobScheduler /
   view-model concern.
4. **Cancelling a batch could freeze the queue.** `requestStopAfterCurrent` had no status guard, so
   a scheduled-but-never-run session absorbed a flag only the runner could clear. Purely local batch
   session state.

**Nothing remote was exercised.** No production credential was requested or handled, no live source
was checked, no `/api/v1` route was called, and no deployment or rollback was run. The Instagram
validation answer that D6A7 left open remains open and is still the next live evidence this
repository owes.

---

## D6A7b — the Instagram check that answered 200 in seconds and imported nothing

**The device reported a source stuck on "Checking" with zero Pending Review.** The obvious reading
was wrong and this repository's own logs proved it: every check completed in **seconds** and answered
`200`. Four causes, each verified on the deployed host.

### 1. gallery-dl's real output shape

`gallery_dl.job.DataJob` writes line-delimited JSON **only** when `output.jsonl` is configured;
otherwise it dumps **one pretty-printed array** at the end. `iter_records` parsed `stdout` line by
line, so every line was a fragment and none was valid JSON — **zero records from a fully successful
run**, which was then treated as an empty feed.

`read_dump` parses the whole document first, with the line form as a fallback. Shared by all three
gallery-dl connectors.

### 2. Zero records from a success is never an empty feed

`classify_dump` refuses three cases by name: unreadable output; an **in-band error record** —
gallery-dl records an extractor exception in the dump and *still exits zero*; and **queue entries
with no members**. `[]` is the one honest empty feed and the only thing that may advance a baseline.

### 3. The decisive one: the wrong gallery-dl mode

`instagram:user` does not enumerate a profile. It emits a `Message.Queue` naming the sub-extractor
that would, and stops.

> Same profile, same session. `--dump-json` → **142 bytes, 0 posts**, empty stderr, exit `0`.
> `--resolve-json` → **383,444 bytes, 30 URL records, 30 posts**.

`extractor_timeout_seconds` 120 → **300**, measured: resolving costs ~1 s per file here (30 files
36.3 s, 120 files 129.5 s), so the window a first `last_25` import needs could only ever time out.
Safe because a check no longer holds an HTTP request open; still a hard bound, process group killed.

**X and TikTok keep `--dump-json`.** No evidence says their extractors queue; the new classification
now reports it loudly if they do. **Next exact action: one live check of each, reading
`queue_count`.**

### 4. A requested history that could never be retried

`_apply_first_scan` committed the baseline having observed no posts, so `last_5/10/25` became
`only_new` permanently. It now refuses to complete such a scan, and
`repair_unfulfilled_initial_imports` re-arms a stranded source — only a non-`only_new` choice, a
committed baseline, **no accepted IDs, no cursor, no item of any kind** — preserving the row as
evidence. **Fired on production: `count: 1`.**

### 5. A check is a durable row

The route performed the whole check inside the request, so a disconnected client could never learn
the result, a restart lost it, and a second tap started a second extractor.

`check_runs`, migration `0002_check_runs`, additive. `check_now` starts a run and returns;
`/sources/{id}/checks/latest` reads it; a second request **joins** the live run under a partial
unique index; `recover_interrupted_runs` settles a run the process did not survive as `interrupted`
— its own state, because nothing is known about the platform — which also releases the index. The
source response carries the initial-import state and the last run's counts.

### Live result

✅ `success_new_posts` in 160.0 s: **25 Review items, 25 accepted IDs, baseline established, cursor
written, 25 media rows.** The configured session **was accepted**.

⚠️ The source is `review_mode = auto_send`, so all 25 were dispatched to its Telegram topic and are
`confirmed` with no failures. Its own configured behaviour, triggered by the verification run the
addendum required.

**The cookie jar was never the problem.** A throwaway probe that skipped `#HttpOnly_` lines suggested
`sessionid` was missing; those lines *carry* the session cookies and `_parse_jar` has always read
them. A completeness guard was added anyway — `<platform>_session_incomplete` for Instagram and X,
decided from the file before any subprocess runs — with a test pinning that an HttpOnly session
cookie counts. TikTok is deliberately excluded: it discovers anonymously.

### Gate and deployment

- **759 passed, 4 skipped.** `ruff`, `ruff format`, `mypy`, release preflight clean.
- Deployed at the exact committed HEAD and verified: `/api/v1/health` and `/api/v1/ready` `200` over
  loopback, unauthenticated route `401`, the application port bound to `127.0.0.1` only, paired
  devices preserved (`active: 1`).

---

## D6A7c — pinned posts printed first, and a Story that had to outlive its own URL

**Head `cbea54ffa9d41b6a76a84a4d739845899995c3f2` (`cbea54f`) — deployed and verified.**
Migration **`0003_instagram_stories`**, additive, columns only. **860 passed, 4 skipped** (759 at
D6A7b).

### The probe came first, and it is the reason this milestone is not guesswork

A sanitized, bounded, metadata-only probe of the **exact installed extractor** was run inside the
deployed container against the already-configured session, before a line was written. Nothing was
written to the database, no API route was called, nothing went to Telegram, and no account, post id,
Story id, caption, URL or cookie was printed or persisted.

| Fact | Value |
| --- | --- |
| version / exit / elapsed | gallery-dl **1.32.8** / `0` / 60.3 s |
| stdout / URL records / queue entries | 763,192 bytes / **60** / **0** |
| records carrying `date` | **60 of 60** |
| a field literally named `pinned` | present on all 60, **truthy on 3** |
| arrival order strictly newest-first | **no** — exactly one inversion |
| pinned posts printed before a newer post | **3** |
| carousels in the window | **0** — multi-member grouping was **not** exercised live |

**Reading:** the three pinned posts are printed first, contiguously, ahead of newer posts. Nothing
in gallery-dl sorts — `InstagramExtractor.items()` yields whatever Instagram's API returned, and the
`pinned` config (default `true`) only decides whether pins are *included*, never where they land.
**The order is observed, never guaranteed.**

### 1. Chronology is imposed here

`domain/feed_order.py`. Logical posts sorted by publication time, newest first, tie-broken by
identity — **not** by arrival order, which is the thing pinning perturbs.

- `last_5/10/25` = the newest 5/10/25 **chronological** posts. A pin outside the window is excluded
  because it is not one of the newest; a pin inside it is included once because it is.
- **The cursor names the newest *dated* post**, which is the half that mattered more: a cursor
  pointing at an old pin would make the next check stop enumerating there and treat everything above
  it as already seen. An undated record sorts last and can never take the cursor; when nothing
  observed has a usable time, the previous cursor **stands** — safe, because
  `(source_id, canonical_post_id)` is unique and re-reading creates nothing.
- **The `pinned` field is never read.** `_extract_pinned` returns *account identifiers*. A test
  asserts that deleting the field entirely changes no ordering.
- `MAX_WINDOW` 120 → **150**: pins consume slots ahead of the chronological window, so a `last_25`
  that must discard three pins needs room for twenty-eight. ~1 s per file measured, 300 s bound.
- Carousel grouping, shortcode identity and the unique constraint are untouched.
- **22 regression tests**, covering all seven required proofs.

### 2. Stories — a setting on the profile source, never a source type

- `include_stories` default `false`, per source, accepted **only** for `instagram_profile` and
  refused **by name** elsewhere rather than stored and ignored.
- `StoryImportState` — `never_enabled` / `initial_pending` / `initial_complete` — plus a completion
  timestamp and a count. **The state does not change what is imported**: both before and after
  completion the rule is "import every active Story not already seen", because identity does the
  work. What it records is whether the *promise made when the setting was turned on* was kept, and a
  failed run must not be able to fake it.
- Identity is `story:<media_id>`, **per frame**. The extractor gives every frame of an account's
  tray the same reel-level `post_id`; folding on it would make one item of the tray and drop every
  later Story. Collision with a feed identity is **decidable** — neither the base64url shortcode
  alphabet nor the decimal fallback contains `:` — and a test checks the whole alphabet.
- **No Story cursor**, written down as a decision in `domain/stories.py` and proved by test. The
  tray is complete on every read and expires within a day, so there is nothing to bound; a cursor
  written past a Story not safely imported would hide it permanently.
- Highlights refused **twice**: the URL this adapter builds can only route to `subcategory=stories`,
  and `highlights` is in the excluded set. Live has no extractor at all. Tagged stays excluded.
- **A feed success beside a Story failure settles the run `partial`** — terminal, not a success.
  Strong signals (rate limit, challenge) are taken from **either** half, because a refusal is a fact
  about the platform whichever request met it; the platform-clear only happens when *every* part
  succeeded.

### 3. Story media is staged at discovery

`staging/items/<item id>/` — the **same** root, quota, permissions, escape check and one-tree
cleanup the operation directories use. Not a parallel storage system.

- All-or-nothing per Story. A failure removes the item and **frees its identity**, so the retry is
  honest; the initial import stays **open**.
- Delivery reuses the staged copy, **copied not moved** — a failed send leaves the item still
  sendable, and a Story's upstream media cannot be fetched twice.
- Cleaned only on a **confirmed** delivery.
- Proved by a test where the upstream refuses **every** request and the delivery still confirms.

### 4. History previews

`delivery/thumbnails.py`. One bounded, MIME-validated, quota'd preview per media row, fetched once
at discovery. `HistoryEntry.first_media_kind` and `.thumbnail_available`; `GET
/history/{id}/thumbnail` serves bytes behind the same device dependency, or `404`.

**A sibling of staging, not part of it** — staging is transient working space, a preview is kept as
long as its history row, and a permanent retention inside a transient quota is how deliveries begin
failing months later for a reason nobody can see. Oldest-first eviction rather than refusal.

**No URL of any kind reaches the phone.** A test asserts over the serialised body that no account,
post id, Story id, source URL, media URL, chat/thread id or filesystem path appears.

### Deployment, verified

| Check | Result |
| --- | --- |
| `remote-sources-ctl version` | **`cbea54ffa9d41b6a76a84a4d739845899995c3f2`** — the exact pushed HEAD |
| `/api/v1/health` · `/api/v1/ready` over loopback | **200** · **200**, every sub-check true |
| unauthenticated `/sources` · `/history` | **401** · **401** |
| application port on a non-loopback address | **none** — only `sshd` and `tailscaled` |
| `devices` | total 4, **active: 1** — pairing survived |
| alembic | **`0003_instagram_stories`** |
| production data | 1 source, 25 items, 25 media rows, **25 confirmed operations**, 2 destinations — all intact |
| the source's Stories toggle | **`include_stories = 0`, `never_enabled` — untouched by the deployment** |
| retained previews on existing rows | **0** — correct: previews are fetched at discovery and those 25 predate the feature |

**No production source check was run**, deliberately: that source is `auto_send`, so a check is a
Telegram send. Nothing went to Telegram. No credential was requested, printed or handled.

### Still open — and be precise about which

- [ ] **No live Story has ever been imported.** The probe found the tray **empty** — `[]`, 9.4 s,
      exit 0, session accepted. So the URL shape, exit code, empty answer and session acceptance are
      live-verified, and **every Story field name comes from reading the installed extractor's
      source rather than from an observed record.** This is the milestone's largest live unknown.
- [ ] **No second live feed import since the ordering fix.** Proved synthetically and against a
      measured real dump shape, not by a live re-import.
- [ ] **No Story expiry has been observed.** The staging guarantee is proved by a test in which the
      upstream refuses everything; nothing has waited a real day.
- [ ] **Carousel grouping was not exercised live** — the probe window contained none.
- [ ] **X and TikTok keep `--dump-json`**, carried forward unchanged from D6A7b. Next exact action:
      one live check of each, reading `queue_count`.

### Gotchas this milestone added

- **A `docker cp` into the container fails: the rootfs is read-only.** Pipe a script through
  `docker exec -i … python3 -` instead.
- **`sh -lc` inside the container resets `PATH`** and loses `/app/.venv/bin`. Use `sh -c`, or the
  absolute `/app/.venv/bin/…`.
- **`release-preflight` refused this release by name** until the three new modules were tracked —
  exactly as designed. `git status` clean is still not preflight clean.

---

## D6A7c1 — a window counted in files, a count from the wrong check, and a preview that came too late

**Head `f5c0b7d9a4010f7c012a2da1e854e1b8f3848865` (`f5c0b7d`) — deployed and verified.**
**No new migration**; head remains `0003_instagram_stories`. **903 passed, 4 skipped** (860 at D6A7c).

A manager review of the committed D6A7c code found four correctness gaps. D6A7c's own gate was green
at 860 tests, and that is the instructive part: **three of the four were invisible because the
fixtures agreed with the code**, and the fourth was an ordering property no single-step test can see.

### 1. `last_N` was counted in files, not logical posts

gallery-dl prints one record per media *file*. D6A7c bounded the run at **150 file records** against
a want of `limit * 10`. Twenty-five ten-member carousels are **250 files**, and three pinned
carousels eat thirty more before the chronological run starts. Every fixture in the ordering suite
used single-media posts, so a file-counted window and a post-counted one were indistinguishable in
all of them.

**`--post-range` bounds logical posts**, established two ways rather than guessed:

- `option.py` documents `--range` as "which **files**" and `--post-range` as "like `--range`, but for
  **posts**";
- `job.py` evaluates the post predicate on `Message.Directory` — one per logical post — and a post it
  rejects has **every one of its `Message.Url` records skipped**; `predicate_range` then raises
  `StopExtraction`, which `DataJob.run` catches **without recording an error**;
- live against the deployed host with the configured session: `--post-range 1-3` → 3 posts,
  `--post-range 1-8` → 8 posts, both exit `0`.

> **What that live probe could NOT show**, and it is recorded rather than glossed: every post in the
> probed prefix of this account is **single-media**, so it did not exercise a carousel and cannot by
> itself distinguish file-bounding from post-bounding. The distinction rests on the source path
> above, which is unambiguous. Carousels are covered by ten-member synthetic fixtures.

There is deliberately **no `--range` beside it** — a file bound would cut a carousel in half.

### 2. A bound that was reached is not a feed that ended

**The first attempt at this got it wrong in an instructive way.** Counting the *selection* does not
work: Instagram prints pinned posts first, so an old pin sorts into the selection and pads a short
window out until it looks full. Twenty-three chronological posts plus seven old pins fills a
twenty-five-post selection with two pins and hides that two of the newest twenty-five were never
fetched.

What may be trusted is the **trailing chronological run**. The chronological run is always a *suffix*
of what was printed, so everything the feed holds newer than the last post printed is provably
present. Short run + bound reached + cursor never seen → widen once (`PINNED_HEADROOM` 5 → 15), then
report `temporary_failure / insufficient_post_window` writing **no cursor, no baseline, no items**.

`MAX_DISCOVERY_ATTEMPTS = 2` — two runs, never a loop. `MAX_POST_WINDOW = 60`.

### 3. The initial Story import count was the last attempt's

Two Stories staged, one failed, the import stays open; the retry stages the last one and completes
it — and D6A7c displayed **1** instead of **3**, because it wrote *that check's* count at completion.
The total is accumulated now as each Story becomes safely staged, **in the same transaction as its
item**, so a rollback takes the increment with it and a rediscovered Story never reaches it.
Completion only stamps the state and the moment. Counting stops at completion.

**No migration**: the fix is in *when* the existing column is written.

### 4. A new Story could be delivered before it ever got a preview

The retention pass ran **before** Story discovery inserted anything. So a Story found by that very
check could be inserted, staged, auto-sent and have its transient staged media cleaned after
confirmation **without ever receiving a History preview** — and a later check is no repair, because
by then the Story and its upstream thumbnail URL are both gone.

It runs after now. An **image** Story reuses its already-staged bytes rather than downloading the
same picture twice; a video Story uses its upstream thumbnail when safely available and otherwise has
none. The pass is also **addressed rather than swept**: it is handed exactly the items the check
created, instead of re-querying every position-zero media row of the whole source every time.

### Bounds raised, on measurement

~1 s and ~12.7 KB per file record; a carousel-heavy `last_25` is ~250 records. The old 300 s / 4 MiB
met that with no margin. Now **600 s / 8 MiB**, still hard bounds, truncation still
`MALFORMED_UPSTREAM` rather than a short feed.

### The audit confirmed intact

Migration additive (13 `add_column`, zero destructive statements); Story identity cannot collide with
a feed identity; staging all-or-nothing; a confirmed delivery removes **only its own** item directory
and a failed one **keeps** the staged Story; highlights, live and tagged excluded; thumbnail auth and
redaction; older production rows readable. New regression coverage for the cleanup-isolation cases.

### Deployment, verified

| Check | Result |
| --- | --- |
| `remote-sources-ctl version` | **`f5c0b7d9a4010f7c012a2da1e854e1b8f3848865`** — the exact pushed HEAD |
| health · ready over loopback | **200** · **200**, every sub-check true |
| unauthenticated `sources`/`history`/`destinations`/`review` | **401** on all four |
| application port | `127.0.0.1:8099` only |
| devices | total 4, **active: 1** — pairing survived |
| migration head | `0003_instagram_stories` |
| production data | 1 source, **28** items, 28 media rows, **28 confirmed** operations, 2 destinations |
| the source's Stories toggle | **`include_stories = 0`, `never_enabled` — untouched** |

**No production source check was run**, nothing went to Telegram, and no credential was requested,
printed or handled.

### Two production facts worth not rediscovering

**1. The scheduler delivered three posts on its own.** Production went from 25 items / 25 operations
at the D6A7c deployment to **28 / 28** by the D6A7c1 one, with `last_check_at` at `10:24` UTC. **No
agent ran a check**, and none was invoked through the API. That was the source's own configured
schedule — and because the source is `review_mode = auto_send`, a scheduled check **is** a Telegram
delivery. Any deployment restart is eventually followed by one. Nothing has to *ask* for that.

**2. A scheduled check leaves no `check_runs` row.** `check_now` opens a durable run; the scheduler's
path calls `check_one` directly and records nothing. So `last_check_at` advances while `last_check`
stays null, and a source card can only ever show a **manual** check's result. **D6A7b behaviour, not
a D6A7c defect**, and deliberately **not fixed here** — it is a behaviour change rather than a
correction. Row S8 in the server `TODO.md`.

### Still open, unchanged

- [ ] **No live Story has ever been observed or imported.** The probe found the tray empty.
- [ ] **No live carousel-heavy import** and **no live pinned re-check** since the ordering work.
- [ ] **No Story expiry observed.**
- [ ] **X and TikTok keep `--dump-json`** — one live check of each, reading `queue_count`.
- [ ] **9GAG platform-blocked**; **Meta publishing blocked on the user**; **rollback never executed**;
      **off-site backup not set up**.

### Gotchas this milestone added

- **`--range` is files; `--post-range` is posts.** For **Stories the asymmetry reverses**: a story
  reel yields one `Message.Directory` for the whole tray and one `Message.Url` per frame, so a
  *post* is the reel and a *file* is a frame — **Stories keep `--range`**.
- **A green suite is not coverage.** Three of these four defects were invisible because every fixture
  used single-media posts, or asserted a state without asserting the number beside it.

---

# D6A7d — what a delivery *was*, and a scheduled check that left no trace

| Field | Value |
| --- | --- |
| Server HEAD | **`6fa9662b25e606c5d432ea52cc2827500d4f8137`** — deployed and verified |
| Intermediate HEAD | `60ebc6b43ba9e1122f383e2323eaba28347e0a26` — also deployed and verified |
| Migration head | **`0004_content_kind`** — two nullable columns plus one **proven** backfill. `0003` untouched |
| Tests | **994 passed, 3 skipped** (948 at D6A7d) (903 at D6A7c1) |
| Gate | `ruff format --check`, `ruff check`, `mypy`, `pytest`, `bash -n scripts/deploy-production`, `scripts/release-preflight`, `git diff --check` — all clean |

## The production fact this milestone was written from

**The first live Story import in this project succeeded.** Stories were enabled on the real
Instagram source and one manual **Check now** discovered and uploaded every currently active Story.
The server's own record agrees and was read directly before and after both deployments:

- `include_stories = True`, `story_import_state = initial_complete`, `story_initial_item_count = 11`
- one `check_runs` row: `trigger = manual`, `state = succeeded`, `inserted_stories = 11`
- items 28 → **39**, delivery operations 28 → **39**

**The second Check now was refused by the fifteen-minute manual cooldown.** A refusal is not
evidence of deduplication. **That check is still open** and is the single most valuable line in the
Android device checklist.

## 1. `content_kind` — three things one word could not tell apart

A Story can be a video. So can a Reel. So can an ordinary post. The History card had only
`media_count` and `first_media_kind`, so the one question the user asked — *what was this?* — had no
field to answer it.

`InstagramContentKind`: `story` / `reel` / `post` / `unknown`. Shown **beside** the media structure,
never merged into it. Every value is earned:

- **`story`** — the Story discovery path and the `story:` namespace on the canonical identity. The
  only value provable from a stored row alone, and therefore the only one the migration backfills.
- **`reel`** — Instagram's own product metadata only: `product_type` / `media_product_type` equal to
  `clips`, `subtype_name_for_REST__ == "XDTClipsMedia"`, or gallery-dl's `reels` subcategory.
- **`post`** — feed content read successfully and not proven to be a Reel. A positive statement.
- **`unknown`** — legacy, non-Instagram, or genuinely insufficient evidence. Visible, not actionable.

> ### The field that is deliberately not read — measured, not assumed
>
> gallery-dl **1.32.8**, `InstagramExtractor._parse_post_rest`, ends with:
>
> ```python
> if "type" not in data:
>     if len(files) == 1 and files[0]["video_url"]:
>         data["type"] = "reel"
>     else:
>         data["type"] = "post"
> ```
>
> That is *"exactly one video file"*. Reading it would relabel **every ordinary single-video post a
> Reel**. It is not consulted, and a regression test carries `"type": "reel"` on a post that is not
> one and asserts it still classifies as `post`.
>
> **The consequence, stated because it is visible on the device.** The printed record is
> `{**post_data, **file}` and `product_type` is read by the extractor without being copied into
> either — so with the profile arguments this service uses, **no trusted reel signal reaches the
> parser and feed content classifies as `post`**. That is the specification, not a gap. **Live Reel
> classification has therefore never been exercised, and no claim about it may be made.**

**Frozen where it matters.** `DeliveryOperation` copies the classification at creation, exactly as
it copies `destination_label`, so editing, reclassifying or deleting an item cannot change what a
past delivery says it was. A test rewrites the item afterwards and asserts the operation is
unchanged.

## 2. A scheduled check now leaves the evidence a manual one always did

The defect was observed in production at D6A7c1 and deferred as row S8: the scheduler called
`check_one` directly, so a scheduled check advanced `last_check_at`, imported content and — on an
auto-send source — delivered it, while writing no `CheckRun` at all. On an auto-send source a
scheduled check *is* the delivery, so the card could report only the kind of check that mattered
least.

`Scheduler.run_scheduled_check` gives both triggers the same shape of evidence:

- **one execution, one row.** `begin_run` is authoritative through the partial unique index, so a
  tick that meets a live run — manual or scheduled — starts nothing and joins nothing; the source is
  checked on the next tick. A scheduler retry cannot produce two rows for one execution.
- **`RUNNING` is never a resting state.** Ordinary completion settles through the same
  `settle_from_report` the manual path uses; an exception settles `FAILED`; a process that did not
  survive settles `INTERRUPTED` at the next start-up. **A restart cannot fabricate a completed run.**
- **partial stays partial** — the feed and Story halves are carried separately.
- **the manual cooldown is not consulted by the scheduler.** It bounds how often a *person* may ask.

No migration was needed: `check_runs.trigger` and `CheckTrigger` have existed since D6A7b. Only the
scheduler's failure to write a row was new.

## 3. `GET /review/unresolved` — the listing that made an endpoint reachable

`POST /review/{item_id}/resolve-unknown` has been correct since **D6A6** and was completely
unreachable from an application: a `result_unknown` item is in neither `/review` nor
`/review/ignored`, so nothing a client could list ever named one, and settling one required already
knowing an item id.

Additive, same projection, same redaction, same pagination. **Declared above `/review/{item_id}`** —
FastAPI matches in declaration order, and a literal path registered after a parameterised one is
never reached. A test pins that, and the `401`.

## 4. `0004_content_kind`

Two nullable columns — `remote_items.content_kind`, `delivery_operations.content_kind` — and exactly
one backfill: rows whose `canonical_post_id` begins `story:` become `story`, and so do the delivery
operations naming them. That prefix is a namespace this service controls and no feed identity can
produce one, so it is a proof rather than a heuristic. **Everything else stays `NULL` → `unknown`.**

`0003` is untouched, and a test asserts it — it is deployed, so it is history.

## 5. Capabilities added

```
instagram.content_kind.v1   checks.scheduled_runs.v1   review.unresolved.v1
```

## Deployment verification — both deployments

Recorded before and after, without printing identity:

| | Before | After |
| --- | --- | --- |
| devices / items / operations / check_runs | 4 / 39 / 39 / 1 | **identical** |
| `include_stories` | `True` | `True` |
| `story_import_state` | `initial_complete` | `initial_complete` |
| `story_initial_item_count` | `11` | `11` |
| `story_initial_completed_at` | unchanged | unchanged |
| review mode / schedule | `auto_send` / `normal` | unchanged |

Also verified each time: the exact 40-character deployed commit reported by the service, migration
head `0004_content_kind`, `/health` and `/ready` both `200` with `migrations_current: true`, `401` on
every protected route **including the new `/review/unresolved`**, and the application port listening
on `127.0.0.1` only.

**The backfill did exactly what it claimed:** 11 items and 11 operations became `story`; 28 and 28
stayed `NULL`.

**No production source check was run**, no Instagram discovery was invoked through the API, nothing
was sent to Telegram, and the source's Stories toggle, destination, review mode and schedule were not
touched. **The scheduler did not execute during or after either deployment** — `next_check_at` was
several hours out both times.

## Still open on the server

- **Story deduplication on a second successful check.** ⛔ Not closed by the first import succeeding.
- One later new Story imported exactly once; real Story expiry.
- **Live Reel classification** — never observed; `reel` has never been produced outside a test.
- A scheduled check observed on a source card.
- Live pinned-post re-check; X and TikTok live extractor-shape checks; 9GAG (platform-blocked).
- Production rollback has never executed. Off-site backup is not set up.
