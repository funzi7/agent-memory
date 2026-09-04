# cc-latest.md — affiliate-deals-bot handoff (latest)

> Rolling handoff for `funzi7/affiliate-deals-bot`. Read this first, then the
> repository documentation linked below.

## 2026-09-04 (final) — Admin ACCEPTED on the owner's phone; two blockers fixed

- Repo HEAD **`d99c6ab979d7436b7d30f15ffb65fdc7bd388f24`** on `main`
  (local == origin == deployed). **1102 pytest passed**, ruff + format + strict
  mypy clean (140 files). Live schema **v10**, core mode **SHADOW**,
  `core_publications` 0.
- **PHYSICAL PHONE ACCEPTANCE: PASSED.** The owner enrolled their own
  credential (their password never passed through the agent) and confirmed on
  their Android phone against the real `https://admin.affi.co.il`: login plus
  dashboard, system (session posture + the audit row for that login), sources,
  candidates + a candidate detail, links, publications, governor, the LIVE
  type-to-confirm gate, PWA install/re-open, and the logout/login loop.
- **TWO RELEASE BLOCKERS found only by testing the real path — both fixed:**
  1. **`Referrer-Policy: no-referrer` broke every real-browser login.** Under
     it a browser suppresses `Referer` AND serializes the `Origin` of a
     form-POST *navigation* as literal `null` (Fetch spec), so the same-origin
     CSRF check had nothing to compare → `cross_origin_rejected` before any
     credential check. `fetch()` POSTs (mode cors) are exempt, which is why
     only the no-JS login form broke. Fixed with `Referrer-Policy:
     same-origin` (cross-origin navigations still send no referrer) plus a
     `Sec-Fetch-Site: same-origin` fallback (forbidden header — page script
     cannot forge it). **Never set `no-referrer` on a page with a form POST.**
  2. **SQLite file hardening orphaned a live connection's WAL.**
     `_secure_sensitive_file()` opened+closed its own fd to `fchmod` the DB and
     `-wal`/`-shm`. POSIX drops EVERY advisory lock a process holds on a file
     when it closes ANY fd for it → the closing connection thought it was the
     last one, checkpointed, and **unlinked the WAL set under the running
     mirror**, which kept committing (no error!) into deleted inodes: writes
     invisible to all readers, lost on exit. This caused BOTH the earlier
     database corruption AND the repeated "mirror silent while systemd says
     active" stalls. Fixed with `lstat` + path-based `chmod` (opens no fd).
     Regression test drives a real second process and fails on the old code.
- **Diagnosis technique that cracked it (reusable):** restarting the admin
  reproduced the stall 4/4; `SIGUSR1` now dumps sanitized asyncio task
  state (all workers were ALIVE at normal await points — ruling out death,
  cancellation and loop starvation); py-spy showed the loop idle in `select`;
  `/proc/<pid>/fd` showed **`(deleted)`** `-wal`/`-shm` with inodes differing
  from the live paths. **If a service goes quiet: check `/proc/<pid>/fd` for
  `(deleted)` sqlite files first, then `kill -USR1`.**
- **Post-fix stability**: 35 read-only samples / 17 min, max worker heartbeat
  age 5s, zero >30s, NRestarts 0, and **two admin restarts inside the window**
  (the old trigger) with no stall.
- **STILL PENDING (unclaimed, needs the owner): Cloudflare rate-limiting rule**
  on `admin.affi.co.il/login` — dashboard/API-token only, so it cannot be
  applied or verified from here. A 25-request GET probe returned all 200 =
  INCONCLUSIVE (the specced rule is POST-only). Settings in DEPLOYMENT.md.
- **Host**: `/usr/local/sbin/affi-admin-cli` runs the admin CLI as the service
  user under the unit's EnvironmentFile (TTY-aware for `--enroll`). Temporary
  diagnostics (heartbeat sampler, py-spy venv) were removed after use.
- **RULES**: never open the live DB read-write as root; never delete rows under
  a running service; deploy via git bundle (`/tmp/affi.bundle`) and always
  check `git status` after checkout (admin/ was once root-owned and silently
  blocked it).

## 2026-09-04 addendum — Admin now authenticates itself (password + TOTP); Access ABANDONED

- Repo HEAD **`bb8b703e28ece6138f21b7c075d8dd9da7bc30b8`** on `main`
  (local == origin/main == deployed `/opt/affiliate-deals-bot`).
  **1093 pytest passed**, ruff + format + strict mypy clean (140 files).
  Live schema is now **v10**.
- **Cloudflare Access is ABANDONED** — its Zero Trust onboarding demands a
  billing method the owner declined (twice). The owner chose an **internally
  authenticated Admin**, keeping the Tunnel and the loopback-only origin. All
  `CF_ACCESS_*` configuration is removed from code, env and docs. Do NOT
  reintroduce it. Passkeys/WebAuthn are a FUTURE enhancement and must use a
  mature maintained library — the owner explicitly forbade hand-rolled
  CBOR/COSE in this milestone.
- **What ships**: scrypt password + RFC 6238 TOTP (validated against the RFC
  4226 vectors) with a replay guard; server-side sessions in a `__Host-` cookie
  (Secure/HttpOnly/SameSite=Lax) with bounded idle (`ADMIN_SESSION_IDLE_MINUTES`
  =720) and absolute (`ADMIN_SESSION_ABSOLUTE_HOURS`=168) expiry; exponential
  login throttle over salted scopes + a global scrypt-burn ceiling;
  login/logout/revoke-all, all audited; `--enroll` / `--check` /
  `--revoke-sessions`. **Fail-closed is preserved**: the service refuses to
  serve while no owner is enrolled — no config can raise an unauthenticated
  panel.
- **Verified over the REAL `https://admin.affi.co.il`** (not a local origin),
  using a throwaway credential so the owner's password never passed through the
  agent: **32/32** edge + login-flow checks and **27/27** panel-vs-live-data
  checks (dashboard/sources/candidates/governor/links/publications, LIVE
  refused without the exact phrase, added source starts DISABLED and archives).
- **Found live**: Cloudflare Scrape Shield rewrote the owner's address into
  `[email protected]`. Fixed with `ui.email_safe()` (Cloudflare's
  `<!--email_off-->` markers) on the owner field and audit actor; re-verified.
- **INCIDENT I CAUSED — read before touching the DB.** The verification harness
  cleaned up by opening the live SQLite DB **read-write as root** while both
  services ran → root-owned `-wal`/`-shm` beside the affideals-owned DB →
  `database disk image is malformed`; the mirror froze then failed. Recovered
  fully: restored `db-preupgrade-20260904T133005Z.sqlite3` (integrity ok)
  through SQLite's backup API **as affideals**; post-recovery integrity ok,
  schema 10, heartbeats advancing, NRestarts 0, data intact (73 candidates,
  133 source_messages, 141 target_mappings, 0 core_publications, mode SHADOW).
  Nothing published; Remote Sources untouched.
  **RULE: never open the live DB read-write as root and never delete rows under
  a running service.** Use `sudo /usr/local/sbin/affi-admin-cli ...`, else
  `sudo -u affideals`, else stop the service. Procedure in RUNBOOK.md.
- **Host changes**: admin env drops `ADMIN_ALLOWED_EMAILS`, adds the two session
  bounds (a `.bak-*` copy is kept); systemd unit refreshed;
  **`/usr/local/sbin/affi-admin-cli`** (root 0755) runs the admin CLI as the
  service user under the unit's EnvironmentFile, TTY-aware so `--enroll`
  prompts without echoing. `src/affiliate_deals_bot/admin/` was root-owned from
  an earlier deploy and silently blocked `git checkout` — now affideals-owned;
  **always check `git status` after a deploy**.
- **PENDING OWNER (both genuinely need the owner, not the agent)**
  1. Enroll: `sudo /usr/local/sbin/affi-admin-cli --enroll --email diman7@duck.com`
     then `sudo systemctl reset-failed affiliate-deals-admin && sudo systemctl
     start affiliate-deals-admin`. Until then the admin is fail-closed and
     `https://admin.affi.co.il` correctly answers **502**.
  2. Cloudflare **rate-limiting rule** on `admin.affi.co.il/login` (dashboard,
     free plan, no Zero Trust): POST + `/login`, by IP, 10 req / 10 min, block
     1h. **No country allowlist** (owner's explicit instruction). Exact settings
     in DEPLOYMENT.md. The in-app throttle is already live and independent.
  3. Owner's physical **phone acceptance** of the PWA — NOT done, **no PASS
     claimed**; it needs the owner's own login.

## 2026-08-31 addendum — Cloudflare Tunnel edge DONE; Access pending owner (billing)

> **PARTIALLY SUPERSEDED by the 2026-09-04 addendum above**: the Tunnel facts
> below still hold, but Cloudflare **Access was abandoned** and replaced by the
> Admin's own password + TOTP login. Ignore every "Access pending" statement.

- Repo HEAD now **`4d30c1e4335838b5014a8a337e425939a26aeda9`** on `main`
  (docs-only reconciliation commit over `c46bd25…`; local == origin/main).
  1026 pytest passed, ruff + format + strict mypy clean. Deployed server code
  still `c46bd25` (byte-identical for runtime — docs-only, no redeploy).
- **Cloudflare Tunnel for `admin.affi.co.il` physically configured + verified.**
  Locally-managed named tunnel **`affi-admin`**, id
  `a8e948d2-d447-4a78-a4b4-89544de51e1b`. Runs as the `cloudflared` systemd
  service (enabled+active, 4 QUIC edge conns). `/etc/cloudflared/config.yml`
  routes `admin.affi.co.il → http://127.0.0.1:8642` (fallback 404); credentials
  JSON `/root/.cloudflared/<id>.json` (root-only); proxied CNAME created.
  Edge verified: unauth `https://admin.affi.co.il` → Cloudflare **502** (origin
  loopback + admin fail-closed), no admin content/redirect/raw-origin/other-app;
  nothing on :8642; no public port (only pre-existing sshd:22; cloudflared
  metrics on 127.0.0.1:20241); apex/`www` unchanged (522); Remote Sources
  healthy.
- **`cloudflared tunnel login` cert transfer is broken on this host** (known
  cloudflared bug #1252 — `Failed to fetch resource`, browser-download fallback;
  two clean failures, all other net tests fine). Owner chose the manual-cert
  fallback: the browser-downloaded `cert.pem` (on the Android phone Downloads,
  where this agent runs) was transferred **file-only** phone→VPS (contents
  never printed/pasted), installed 0600 root, validated via `cloudflared tunnel
  list`, used for `create`+`route dns`, then **securely shredded**. If the
  tunnel ever needs management (create/delete/route) again, cert.pem must be
  re-provided; the running tunnel needs only the credentials JSON.
- **PENDING OWNER — Cloudflare Access** (the ONLY open edge step): the owner
  declined Cloudflare **Zero Trust** onboarding for now (first activation asks
  for a billing method). So the Access application for admin.affi.co.il + the
  admin env `CF_ACCESS_TEAM_DOMAIN`/`CF_ACCESS_AUDIENCE` are NOT set → admin
  service stays **failed/fail-closed** by design (verified message: "Cloudflare
  Access configuration is incomplete"). Do NOT weaken this; do NOT start the
  admin without Access; do NOT use the insecure no-auth mode. Consequently the
  physical **owner phone acceptance** and **through-the-real-Admin-UI**
  verifications (task §10–§16) are NOT performed — they need an Access session.
  When the owner is ready to add Zero Trust billing: create a self-hosted Access
  app (allow only diman7@duck.com), put team domain + AUD into the admin env
  (0600), `systemctl restart affiliate-deals-admin`, then run the §9/§10–§17
  edge+UI acceptance.

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
- **Cloudflare edge** — SUPERSEDED by the 2026-08-31 addendum at the top: the
  Tunnel (`affi-admin`, config.yml, DNS route, systemd service) is now DONE and
  verified. The tunnel was built with the manual-cert fallback (not the
  browser-auto-deposit this block originally assumed) because `cloudflared
  tunnel login` cert transfer is broken on this host (#1252). The ONLY open edge
  step is the Zero Trust **Access application** + admin `CF_ACCESS_*` env, which
  the owner deferred (declined Zero Trust billing for now). Admin stays
  fail-closed until then. cloudflared 2026.8.2 is installed;
  `/etc/cloudflared/config.yml.pending-owner` remains as a template.

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

- Cloudflare **Tunnel** DONE (2026-08-31; see top addendum). Remaining edge
  step = the Zero Trust **Access application** + admin `CF_ACCESS_*` env, which
  the owner deferred (declined Zero Trust billing). Currently unauthenticated
  `https://admin.affi.co.il` → Cloudflare **502** (origin loopback + admin
  fail-closed). AFTER the Access app exists it must instead **302** to
  `<team>.cloudflareaccess.com` and never serve admin content — verify then.
  The owner phone acceptance + through-the-Admin-UI checks (§10–§16) also wait
  on Access.
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
