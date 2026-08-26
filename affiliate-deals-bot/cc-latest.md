# cc-latest.md — affiliate-deals-bot handoff (latest)

> Rolling handoff for `funzi7/affiliate-deals-bot`. Read this first, then the
> repository documentation linked below.

## Latest milestone: publish deals not self-promo; recover cursor-stranded posts; paced channel fill

- Date: 2026-08-26
- Branch `main`, tracking `origin/main`.
- Final commit (pushed, verified local == origin/main == deployed server HEAD):
  **`c450cbe94899ec1f9bdccd35776e54e250ee4d35`** (parent
  `841a5ed9c512ba9355752d5a8fa7a2608ee65d84`).

Fixed two owner-observed production faults and filled the channel. All three
changes were **physically validated on the live 24/7 service**.

## Problem A — self-promo was published (fixed)

`@KSPcoil` msg **16525** (`ksp.co.il/link/Whatsapp`, "join our WhatsApp") was
mirrored to `@AffiIsrael` (dest 10) because classification is host+path only and
never inspected the `/link/` alias. New **deal-vs-self-promo** classifier
(`application/self_promo.py`, pure): a post is `merchant_self_promo_non_deal` when
its only commercial destination is a merchant community `/link/<alias>` (whole
camelCase-token match on whatsapp/telegram/instagram/facebook/newsletter/vip/... —
never a substring, so `Instax`/`InstantPot`/`AppleWatch` stay product deals) and it
has **no** product/category/SKU destination. Terminal skip: not published, links
**not** affiliate-converted (no `appKey` minted), not retried, not alerted,
recorded by a `telegram_self_promo_skipped` analytics event; the processor returns
a noop `DeliveryPlan`. Persisted state is `blocked` (no v6 change to
`source_versions` needed). Applied in `process`/`process_batch` **before**
conversion and in the crash-recovery `evaluate_batch_links`/`evaluate_links` paths.
A post with any real shopping destination still publishes even alongside a WhatsApp
link; bare `wa.me`/`t.me` stay non-commercial and never trigger a skip alone
(preserves the long-standing "publish a post that merely carries such a link"
behavior). The real dest-10 WhatsApp post was **not** deleted (owner did not ask).

## Problem B — missing real deal 16535 (root cause + fix)

**Root cause (architectural):** the catch-up cursor advances at journal/observe
time, in the same txn as the journal insert, **decoupled from publication**. A
source version driven to a terminal *unpublished* state is then invisible to both
catch-up (`min_id > cursor`) and the drain (`processed_at` set) — permanently lost.
`16535` (Beauty26 + 20 `/sku`+`/link` deals, all 21 converted, state `eligible`)
had its **pre-split** outbox event fail terminally `telegram_content_too_long`
(migrated stale payload) while cursor 16537 passed it. No poison-skips occurred
(the 16512–16519 id gaps are simply non-posts).

**Fix:** startup `recover_publishable_versions()` (+ repo
`list_publishable_unmapped_versions`, `discard_failed_outbox`, and runtime
`deliver_source_post`) re-derives a fresh plan and re-delivers eligible-but-unmapped
versions from durable state, cursor-independent, exactly once. In production it
recovered `16535` → `@AffiIsrael` **dest 28 (primary) + 29 (continuation)** (the
21 affiliate links, caption-overflow split), silently, on the deploy restart.

## Channel fill (schema v6)

New `request-backfill` (pure DB write, safe while live) → `backfill_control` +
`backfill_items` (schema **v6**, additive) → `TelegramBackfillCoordinator` running
inside the service. It scans history backward (`scan_source_posts_desc`), skips
already-mirrored, evaluates each with side-effect-free
`AffiliateTelegramBatchProcessor.evaluate_deal` (skips self-promo + ineligible),
selects the newest N eligible deals, and delivers them **oldest-first** through the
**existing** outbox at `TELEGRAM_BACKFILL_PACE_SECONDS` (default 30s) via a durable
`not_before` gate. FloodWait is honored ≥ its duration **without spending the retry
budget** (`defer_outbox` un-does the claim increment; `_fail_outbox_claim` defers on
`retry_after_seconds`). Album+continuations = one logical post (no extra gap).
Crash/restart resumes from the next undelivered item, never duplicating (mapping
check + stable `random_id`). Realtime is never blocked (pace gate lives only on the
coordinator task). The coordinator watcher and per-item delivery were hardened so a
transient error / hung Telegram call can never permanently stall the fill.

## Production validation (live service, dc28664→c450cbe code identical)

- 16535 recovered: dest 28+29; no other stranded version; silent.
- Self-promo: deployed classifier maps `/link/Whatsapp`→`community_self_promo`→skip;
  `/link/Beyerdynamic` and whatsapp+product publish. Real promo not republished.
- **30-deal fill: 30/30** → `@AffiIsrael` **dest 31–62**; source 16489–16510 +
  16512–16519 (already-mirrored 16511 skipped); scanned 50, skipped-mirrored 20,
  skipped-self-promo 0, skipped-ineligible 0; oldest source `2026-08-20T12:15Z`,
  newest `2026-08-24T12:15Z`; 2 caption-splits (dest 43,44 and 54,55); **0 dup,
  0 fail, 0 owner alert, 0 undelivered**; completed 10:42:02Z. Base pace ~31–32s;
  three ~95–128s gaps were **FloodWaits honored silently** (0 alerts).
- Restart safety: a mid-fill restart resumed no-dup; the post-fill redeploy restart
  left phase `completed`, added no dest (max 62), cursor intact.
- Realtime during the window: real deals 16538 (dest 27), 16539 (dest 30) mirrored
  automatically; no collision with the fill's dest range. 53 total `@AffiIsrael`
  mappings after.
- Remote Sources unchanged (containers Up 13 days healthy, `RELEASE_COMMIT 0e18506`).

## Validation

- Offline: pytest **522 passed** (+34 `test_self_promo.py`, +10 `test_backfill.py`);
  ruff check + ruff-format clean (71 files); strict mypy clean; `git diff --check`
  clean; secret/host/tailnet/key/session scan clean.
- Deploy: backup taken (SQLite `.backup`, quick_check ok) before upgrade; session +
  `/etc/.../affiliate-deals.env` preserved; `git bundle` transfer + checkout; only
  `affiliate-deals-telegram.service` restarted; RS untouched.

## Server access (unchanged; no secrets recorded)

Same VPS as the sibling `telegram-remote-sources`. Reuse its git-ignored
`deploy/production.env` (`RS_DEPLOY_HOST`/`RS_DEPLOY_KEY`) **but export
`HOME=/home/devagent` first** so `~/.telegram_vps_host` resolves (it is absent
under `/root` HOME — that HOME-context miss is why a tailnet path can look
unreachable). Read the SQLite DB read-only via the host venv Python
(`sqlite3` CLI is NOT installed). **Caution:** a `mode=ro` (and even a fresh
normal) diagnostic connection can lag the service's rapid WAL writes by minutes —
use it only for stable-state reads; for live progress trust the durable
`backfill_items`/`backfill_control` after the fill goes idle. Never open a second
Telethon client against the live user session. Never print/commit host/IP/tailnet/
key values.

## Remaining / not verified

- Shared VPS **not rebooted** (autostart via enablement only).
- FloodWait exercised by natural rate limits during the fill; not forced
  synthetically (offline suite covers the 5-flood>max-attempts case).
- KSP 403/Turnstile — probing-only limitation; purchase/commission never provable.
- If KSP starts self-promoting via bare `wa.me`/`t.me` (not `/link/<community>`),
  extend the self-promo rule (today only merchant `/link/<community-alias>` fires).
- LastPrice/Rozenfeld await real affiliate examples.

## Next work / cautions

- Watch `journalctl -u affiliate-deals-telegram`; confirm the next real `@KSPcoil`
  deal mirrors and any self-promo is skipped. Never commit `.env`, sessions,
  runtime DBs/backups, tokens, or server host/key/tailnet values. Ops:
  `docs/DEPLOYMENT.md`, `docs/RUNBOOK.md`.

Repository references: `README.md`, `TODO.md`, `docs/ARCHITECTURE.md`,
`docs/RUNBOOK.md`, `docs/DEPLOYMENT.md`, `docs/PROJECT_STATE.md`,
`docs/RELEASE_REVIEW.md`, `docs/HANDOFF.md`, `docs/KSP_LIVE_SMOKE.md`.
