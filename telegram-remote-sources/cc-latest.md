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
| **Head after D6A5** | **`cb0174765306f429225b299845d6f11456dc666d`** (`cb01747`) — **deployed and verified** |
| Matching app head | `4e36dcc7ef23266fce772910e319d141c6916ccc` (`4e36dcc`), versionCode 30, `0.13.5-d6a5` |
| Host | A DigitalOcean droplet, Ubuntu 24.04.4, amd64, 1 vCPU, ~2 GiB RAM, ~48 GB disk |
| Deploy path on host | `/opt/remote-sources` |
| State path on host | `/var/lib/remote-sources` |

The VPS address, its Tailscale hostname and the tailnet name are **deliberately not recorded
anywhere**. They live in the operator's shell and in the Android app's settings.

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
| 9GAG | **user profiles only** (`/u/<name>/posts`), payload shape verified against the live site | direct CDN URLs | optional server-side cookies | **refused live — 403**, classified `setup_required` |
| Reddit | implemented | Reddit's own media URLs | **required** | **no** |
| X | implemented | gallery-dl URLs | **required** | **no** |
| Instagram | **implemented at D6A5** | gallery-dl, Instaloader fallback | **required** | **no** |
| TikTok | **implemented at D6A5** | gallery-dl + yt-dlp | **required** | **no** |

**Do not describe any connector as end-to-end validated.** Mocked tests prove the parsing and the
classification. They prove nothing about the live platforms.

**9GAG covers user profiles and nothing else.** A **9GAG Interest page** — `/interest/<slug>`,
optionally with a feed mode such as `/hot` — is a **different source type**, is **not supported**,
and is specified as **D6A6**. An Interest URL must never be normalised into a user profile.

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

- **The health routes are `/api/v1/health` and `/api/v1/ready`.** An earlier note in this file said
  `/health` and `/ready`; those return **404**. The deploy script has always probed the correct
  paths, so the error only bites someone verifying by hand — and it looks exactly like an outage.
- **Reuse the deploy script's own `remote()` construction** when running an ad-hoc command:
  `-o BatchMode=yes` plus `-i "$RS_DEPLOY_KEY"` from `deploy/production.env`. Rebuilding the SSH
  invocation by hand and omitting the key both fails **and** prints the host address, which must
  never be recorded anywhere.

## D6A6 — the 9GAG source is an Interest page, not a user profile

**Reported from the device after D6A5. Nothing is implemented; this is the requirement, recorded
before any code exists, and no production code was touched when it was written.**

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

## Next action

**Nothing on the server.** It is deployed, healthy, and running a commit that is reproducible from
Git for the first time since the D6A3 outage.

1. ~~Install the D6A5 APK and confirm the Settings version.~~ **Done on 2026-07-27** — it read
   `0.13.5-d6a5` / code 30, and **manual permanent deletion without upload then succeeded on the
   device.** Both are Android-side results; **neither validates anything in this repository.**
2. 9GAG: Validate from the app; expect a message naming the platform refusal rather than a generic
   one, and the platform list to show **needing setup** after a refresh, surviving a restart.
3. Optional: configure a cookie export server-side and Validate again.
4. Configure Instagram and TikTok sessions if those platforms are wanted; both correctly say
   setup-required until then.
5. One source at a **disposable** topic, initial import **Last 5**; then one animated item, which
   should arrive as a looping animation.

`docs/D6A_LIVE_CHECKLIST.md` carries the same order with the failure history attached.

**Nothing past pairing has ever run end to end.** No connector has completed a live check → review →
send, and a successful deployment is not evidence that one would.

## Gotchas for the next session

- **Docker is not available in the PRoot dev environment.** The image must be built on the VPS.
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
