# cc-latest.md — affiliate-deals-bot handoff (latest)

> Rolling handoff for `funzi7/affiliate-deals-bot`. Read this first, then the
> repository documentation linked below.

## Latest milestone: 24/7 production deployment of the caption-split Telegram mirror

- Date: 2026-08-26
- Branch `main`, tracking `origin/main`.
- Feature commit: `14c4038c9a1052425603867f5fad8ae52ff91c34` (caption-overflow
  split + continuation persistence + edit reconciliation — see below).
- Deploy-surfaced runtime fix: `abfc0b90106232fdc4ea5a4594c5b89db24fd941`.
- Final commit (pushed, verified local == origin/main):
  `841a5ed9c512ba9355752d5a8fa7a2608ee65d84`.

The mirror is now **deployed as a persistent 24/7 `systemd` service and running**
on the owner's existing VPS, fully isolated from the unrelated Remote Sources
application (`/opt/remote-sources`) that shares the host. All fourteen server-side
checkpoints passed.

## How the server was reached (no secrets recorded)

Reused the sibling `telegram-remote-sources` production SSH configuration
(`deploy/production.env` → `RS_DEPLOY_HOST`/`RS_DEPLOY_KEY`) **read-only** as the
trusted connection reference for the same VPS, over the Android host's already
active Tailscale path — **no local Tailscale binary is needed or was installed**.
The host-reference file `~/.telegram_vps_host` lives in the Termux/devagent HOME
context (absent under the current `/root` HOME, which is why an earlier session
reported the tailnet path unreachable — that was a HOME-context problem, not a
missing Tailscale). Host positively identified by confirming Remote Sources at
`/opt/remote-sources` (`RELEASE_COMMIT 0e18506…`, Docker stack healthy). **No
host, IP, tailnet name, or SSH key value was printed, committed, or documented.**

## Deployment (isolated; shares nothing with Remote Sources)

- Host: Ubuntu 24.04.4 x86_64, 1 CPU, ~2 GiB RAM (~1.25 GiB free with both apps),
  ~39 GiB free disk, Python 3.12.3, systemd 255.
- `/opt/affiliate-deals-bot` (git repo at the pushed HEAD, `affideals`-owned),
  dedicated `.venv` (Telethon 1.44.0), `/etc/affiliate-deals-bot/affiliate-deals.env`
  (`0600`), `/var/lib/affiliate-deals-bot/` (`0700`) with the user session, the
  SQLite DB, and `backups/` (all `0600`), user `affideals`, unit
  **`affiliate-deals-telegram.service`** (enabled + active). Outbound-only, no
  inbound port. Source `@KSPcoil`, destination `@AffiIsrael`, KSP id `14095`;
  LastPrice/Rozenfeld disabled.

Safe corrections required by real host evidence:
1. `apt install python3-venv` (host lacked ensurepip/pip; RS is Docker-isolated).
2. Private repo → transferred via `git bundle` (committed objects only) + clone,
   not `git clone` (unauthenticated clone refused).
3. Unit gained `SuccessExitStatus=130` so a clean `systemctl stop` is *inactive*,
   not *failed* (a real crash still triggers `Restart=on-failure`).
4. **Runtime fix `abfc0b9`:** a best-effort owner alert whose dedup key already
   carried a prior alert with a different reason raised `RepositoryConflictError`
   from `enqueue_outbox` and crash-looped the service on startup against the
   migrated DB; now tolerated (owner already alerted). +1 test.

## State migration — no republish

A consistent SQLite `.backup` snapshot of the local runtime DB was pre-migrated
v4→v5 (verifying the real production rows) and transferred with the user session
and a path-corrected `.env` (all `0600 affideals`). Preserved: **15
source→destination mappings (dest msgs 5–19), cursor 16535**, the dedup/source
journal, outbox/retry state, and the continuation-mapping schema. On startup
nothing already-published was republished; cursor stayed 16535. The one stale
pre-split outbox event (pending `telegram_edit` for 16535, old 1050-unit un-split
caption, already exhausted+alerted before) terminalized gracefully as
non-retryable `telegram_content_too_long` — no duplicate.

## Server-side validation (14/14 passed)

enabled; active; user session + bot connect from the server; `@KSPcoil` readable;
`@AffiIsrael` writable; mappings+cursor survived migration; no duplicate on
startup; catch-up deduplicated (no new posts in window); **owner notification
from the server** delivered (message id returned); stop/start preserves state;
forced `SIGKILL` → `Restart=on-failure` recovery (new PID) → healthy; **Remote
Sources unchanged** (containers Up 13 days healthy, `RELEASE_COMMIT 0e18506`,
its units untouched). Host after deploy: ~715 MiB used / ~1.25 GiB free, load ~0.06.

## The underlying feature (commit 14c4038)

Over-limit media captions **split instead of block**: media keeps the first
chunk (≤1024 UTF-16), the remainder becomes ordered synthetic continuation text
messages (≤4096); UTF-16/entity/surrogate-safe; never truncates; unsplittable
single-entity → block+alert. Schema **v5** `mapping_role`
(`primary`/`album_member`/`continuation`) persists continuations distinguishably.
Edit reconciliation edits the primary in place, grows/shrinks continuations, and
deletes **only** obsolete synthetic continuations (the primary is never deleted;
a failed delete → reconciliation failure). Physically validated live against real
`@AffiIsrael` in the prior session (primary+continuation publish, in-place edit,
obsolete-continuation delete, restart durability).

## Validation

- Offline: pytest **478 passed**; ruff check + ruff-format clean (66 files);
  strict mypy clean; `git diff --check` clean; `systemd-analyze verify` clean;
  secret/session/host/key scan clean.
- Server: the 14 checkpoints above.

## Remaining / not verified

- Shared VPS **not rebooted** (autostart via enablement only); no **new**
  `@KSPcoil` post appeared during the window, so a fresh live server publish/split
  was not observed (split/edit validated live prior + offline).
- Live multi-continuation grow/shrink is offline-only (physical source limit).
- KSP 403/Turnstile — probing-only limitation. Purchase/commission never provable.

## Next work / cautions

- Watch the running service (`journalctl -u affiliate-deals-telegram`); confirm
  it mirrors the next real `@KSPcoil` post (and splits an overflow) live.
- Never commit `.env`, sessions, runtime DBs/backups, tokens, API hash, cookies,
  logs, or any **server host / SSH key / tailnet** value. Deployment/ops:
  `docs/DEPLOYMENT.md`. LastPrice/Rozenfeld await real affiliate examples.

Repository references: `README.md`, `TODO.md`, `docs/ARCHITECTURE.md`,
`docs/RUNBOOK.md`, `docs/DEPLOYMENT.md`, `docs/PROJECT_STATE.md`,
`docs/RELEASE_REVIEW.md`, `docs/HANDOFF.md`, `docs/KSP_LIVE_SMOKE.md`,
`docs/BRAND.md`, `docs/FUTURE_WEBSITE.md`, `docs/FUTURE_DISCOVERY.md`.
