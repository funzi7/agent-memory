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
| Head after D6A3 | **`befe5040d2d0177c7cedf23feaad3d1397166e31`** (`befe504`) |
| Matching app head | `309ae0d3723cc056bda3432f84c8b0d08a0e25f9` (`309ae0d`), versionCode 28, `0.13.3-d6a3` |
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

```
uv run ruff format --check src tests alembic   # 51 files already formatted
uv run ruff check src tests alembic            # All checks passed
uv run mypy                                    # no issues in 52 source files
uv run pytest -q                               # 331 passed
```

Synthetic fixtures only. **No test touches a live platform, Telegram or the network.**

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

- **Tailscale node authorisation.** `tailscale up` needs a browser signed in to the tailnet. Backend
  state was `NeedsLogin` at the end of the session.
- Everything downstream of it: `tailscale serve --bg`, reboot persistence, Funnel-off verification,
  and the private HTTPS endpoint being reachable from the phone.

**Not done — needs the user:**

- Every credential. `remote-sources-configure telegram | reddit | x-cookies` has not been run.
  **Claude did not request, read or handle any production credential, and must not.**
- Pairing the phone. **Attempted at D6A: the exchange succeeded here and the phone could not keep
  the token. Blocked until the D6A1 APK is installed and the orphaned devices are revoked.**
- Any live platform or Telegram request. **Nothing has been sent to Telegram from this server.**
- **Any authenticated request from a phone. Not one has ever arrived**, because pairing has never
  completed on a device.

## Connector status, honestly

| | Discovery | Extraction | Credentials | Live-tested |
| --- | --- | --- | --- | --- |
| 9GAG | implemented, payload shape verified against the live site | direct CDN URLs | none | **no** |
| Reddit | implemented | Reddit's own media URLs | **required** | **no** |
| X | implemented | gallery-dl URLs | **required** | **no** |
| Instagram | prepared boundary, reports unsupported | — | — | n/a |
| TikTok | prepared boundary, reports unsupported | — | — | n/a |

**Do not describe any connector as end-to-end validated.** Mocked tests prove the parsing and the
classification. They prove nothing about the live platforms.

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

## Next action

**`docs/D6A_LIVE_CHECKLIST.md` §8 has the exact order. It changed, and the order is the point:**

1. **Deploy with the one command:** `./scripts/deploy-production` from the development checkout,
   then `sudo remote-sources-ctl version` to confirm the deployed commit.
2. `sudo remote-sources-ctl devices` — note the count.
3. `sudo remote-sources-ctl revoke-all-devices --confirm` — clear the orphans, **once**.
4. Install the D6A1 APK **over** the Android app. No uninstall, no data clear.
5. `sudo remote-sources-ctl pair` — one code, used immediately, ten-minute life.
6. Confirm the app says **Connected** (one authenticated request succeeding — which has never
   happened) and `remote-sources-ctl devices` shows `"active": 1`.
7. Only then: **one** source pointed at a **disposable** topic with initial import **Last 5**.

Steps 1–3 of the original checklist — Tailscale authorisation, `70-serve.sh`, credentials — are
already done, proven by the exchange having reached this server.

## Gotchas for the next session

- **Docker is not available in the PRoot dev environment.** The image must be built on the VPS.
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
- **Issue-once is a property, not a gap.** Because only the hash is stored, a device record whose
  token the phone never kept is indistinguishable from a working one. That is the price of never
  being able to leak a token from a database copy, and `revoke-all-devices` is the whole remedy.
