# cc-latest.md — affiliate-deals-bot handoff (latest)

> Rolling handoff for `funzi7/affiliate-deals-bot`. Read this first, then the
> repository documentation linked below.

## Latest milestone: Affi Admin + Core Shadow Mode + Radar Scheduler + Source Manager + Governor Control Plane

- Date: 2026-08-30
- Branch `main`, tracking `origin/main`.
- Final commit (pushed, verified local == origin/main == deployed server HEAD):
  **`c46bd25181ae31ba2fbf3bbe14096344b33a53f3`** ("Make Affi Core observable
  and controllable: admin PWA, shadow mode, 24/7 radar scheduler, governor
  control plane"), parent `55f8bee78fbf837b55f623d167e67c2412de74ee`.

## Production state (the important part)

- **`AFFI_CORE_ENABLED=true` + runtime mode `SHADOW`** — the completion state.
  The engine polls/binds/decides/simulates 24/7 with ZERO automatic public
  writes (`core_publications` = 0; the only publisher remains the KSP mirror).
  Mode is durable in `core_runtime_state`, changed from the Admin without
  restart, audited. LIVE is NOT enabled (requires typing `LIVE` in the Admin).
- Schema **v9** live in production (migrated v8→v9 automatically on first
  open; pre-deploy backup `db-predeploy-20260830T174222Z.sqlite3` in
  `backups/`, integrity+quick_check ok). Mirror state preserved; it published
  genuinely new posts during the deploy (cursor 16569→16574, mappings 84→89,
  0 duplicate destination ids after restart).
- Radar sources (DB rows, managed from the Admin): `beedealslive` —
  parser=beedeals, **shadow, enabled** (real cycles observed: 31 posts → 18
  signals → candidates, all conservatively `needs_review`; a new live post
  was ingested mid-validation). `kspcoil` — generic-parser probe used for the
  §37 validation (30 posts → 23 signals), then **disabled + archived** so KSP
  stays mirror-only. All admin actions (incl. one deliberately rejected
  wrong-name attempt) are in `admin_audit_log`.
- **Admin service** `affiliate-deals-admin` installed + enabled, loopback-only
  `127.0.0.1:8642`, env `/etc/affiliate-deals-bot/affiliate-deals-admin.env`
  (0600 affideals; holds a generated ADMIN_CSRF_SECRET;
  ADMIN_ALLOWED_EMAILS=diman7@duck.com). It is **fail-closed**: without
  CF_ACCESS_TEAM_DOMAIN + CF_ACCESS_AUDIENCE it refuses to start (verified:
  "Cloudflare Access configuration is incomplete"). No insecure fallback is
  running; the temporary triple-gated loopback instance used for validation
  was stopped and its env deleted (port 8642 closed).
- **PENDING OWNER (the only open steps)** — Cloudflare edge for
  `https://admin.affi.co.il`: on the server run `cloudflared tunnel login`
  (browser authorize for zone affi.co.il), then `cloudflared tunnel create
  affi-admin`, fill `<TUNNEL_ID>` into
  `/etc/cloudflared/config.yml.pending-owner` → rename to `config.yml`,
  `cloudflared tunnel route dns affi-admin admin.affi.co.il`,
  `cloudflared service install && systemctl enable --now cloudflared`; create
  the Zero Trust **Access application** for admin.affi.co.il (allow only the
  owner), then put the team domain + Application AUD tag into the admin env
  and `systemctl restart affiliate-deals-admin`. cloudflared 2026.8.2 is
  already installed. Until then the panel stays loopback-only by design.

## What was built (schema v9, all additive)

- `affi_core/modes.py` — hard gate vs durable OFF/SHADOW/LIVE; per-source
  modes cap at the runtime mode. `affi_core/control.py` — typed control-plane
  values (policy config, thread state, source records/health, publications,
  shadow outcomes, audit, commands, heartbeats).
- `admin/` — aiohttp Hebrew-RTL mobile-first PWA (no SPA/Node/external
  assets): CF Access JWT via team JWKS (iss/AUD/RS256; email header never
  trusted alone), HMAC CSRF + same-origin on every POST, strict CSP,
  `no-store`, static-only service worker, full audit; pages: dashboard (click
  tracking honestly "עדיין לא מופעל"), system/mode (LIVE type-to-confirm),
  sources, source test (read-only ~20 posts, NO cursor mutation), candidates
  (internal score; reprocess/ignore/manual-publish — manual bypasses score
  only, never caps/FloodWait), products, links (KSP appKey=14095), pubs +
  chain view, governor editor (hot-reload), audit, errors. Admin↔engine via
  durable `admin_commands` queue — the admin process NEVER talks to Telegram.
- `infrastructure/telegram/radar_collector.py` + `radar_scheduler.py` —
  generic collector (any public channel, no code changes), 24/7 scheduler
  (cursors/health/backoff 60·2ⁿ≤1800/FloodWait), `AdminCommandExecutor`,
  `CoreThreadExecutor` (durable intents: CREATE keyed by chain state — crash
  can never double-post; EDIT keyed by rendered-content digest — same content
  dedups, new content re-edits), `HeartbeatRunner`.
- `affi_core/orchestrator.py` — §14 pipeline; bound-listing ladder tier 2b
  (a `merchant_products` binding resolves NO_MATCH; conflicts →
  `bound_listing_conflict` NEEDS_REVIEW; matcher caution never overridden).
- `affi_core/channel_policy.py` — locked policy 10 soft/14 hard per 24h,
  45-min gap, ≤2/rolling-hour, quiet 00:00–07:00 Asia/Jerusalem
  (zoneinfo/DST), exceptional bypass (quiet-only, ≥15-min gap, recorded);
  actual public posts incl. legacy mirror count toward volume; ranked queue.
- `affi_core/thread_chain.py` — sequential chain **SUPERSEDES
  reply-to-ROOT**: permanent ROOT → 24h window edits latest in place (never
  extends window; expiry alone never posts) → replies chain to previous
  latest. `governed.py` v2 anchors mirror threading to the chain LATEST.
- `telegram/transform.py` — TEXT_LINK locked rule: URL-equivalent displayed
  text replaced together with the target (UTF-16-correct); labels keep text.

## Validation (all physically performed)

- Offline: **1026 pytest**, ruff + format + strict mypy (135 files),
  `git diff --check`, secret scan — clean. v8→v9 verified on a real
  production backup copy (31 tables digest-identical, cursor preserved).
- Real Telegram (local): BeeDeals SHADOW smoke via the committed engine path
  with a raising sentinel publisher (30 posts → 17 candidates; idempotent
  re-poll; tracking links internal-only; controlled bound-listing resolution;
  zero publisher calls). **12-step sequential-chain E2E** on an ephemeral
  channel (SHADOW physically refused; ROOT; same-content dedup; in-place
  edit; window never extended; expiry posts nothing; u1→u0, u2→u1, restart,
  u3→u2; one ROOT ever; chain re-read from Telegram; channel deleted).
  **TEXT_LINK smoke** on ephemeral channels (displayed URL text + target both
  → appKey=14095; label kept; UTF-16 with astral emoji).
- Server (§35–39): admin origin headers/bind/healthz; real Admin flows for
  mode/sources/tests through the command queue executed by the telegram
  service; scheduler heartbeat paused→running on mode change WITHOUT restart;
  generic second channel validated then archived; governor config served with
  locked defaults; KSP mirror regression (published new posts throughout,
  restart clean, 0 dup ids); Remote Sources untouched; VPS not rebooted.

## Server access (unchanged; no secrets recorded)

Same VPS as the sibling `telegram-remote-sources`. Use its git-ignored
`deploy/production.env` for `RS_DEPLOY_HOST`, but the **working SSH key is
`/home/devagent/.ssh/telegram_remote_sources` with `HOME=/home/devagent`**
(the `RS_DEPLOY_KEY` path under `/root` is stale — auth fails with it). Read
the SQLite DB read-only via the host venv Python (`sqlite3` CLI is NOT
installed; use `sudo -u affideals /opt/affiliate-deals-bot/.venv/bin/python`).
A `mode=ro` diagnostic connection can lag rapid WAL writes — stable-state reads
only. Never open a second Telethon client against the live user session. Never
print/commit host/IP/tailnet/key values.

## Remaining / future work

- Owner Cloudflare steps above (tunnel login + Access app) — then verify the
  edge: unauthenticated curl to https://admin.affi.co.il must 302 to
  `<team>.cloudflareaccess.com`, never serve admin content.
- LIVE mode: owner decision later, via the Admin, after reviewing shadow
  outcomes vs policy. Shadow outcomes appear once candidates resolve
  (currently all needs_review — correct conservatism; curation/binding will
  unlock them; the WOULD_* simulation itself is unit- and physically-proven).
- Click analytics: future only; no numbers are invented anywhere.
- Repo docs: README, TODO (reconciled backlog incl. SUPERSEDED reply-to-ROOT),
  docs/PROJECT_STATE, ARCHITECTURE, RUNBOOK, DEPLOYMENT (admin + cloudflared
  runbook), HANDOFF, RELEASE_REVIEW, FUTURE_*, new docs/ADMIN.md +
  docs/SHADOW_MODE.md.
- Shared VPS still not rebooted (autostart of both units verified via
  enablement only). A production-organic caption split still hasn't occurred
  naturally (real E2E + offline suite cover it).
