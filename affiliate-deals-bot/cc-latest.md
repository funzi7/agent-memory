# cc-latest.md — affiliate-deals-bot handoff (latest)

> Rolling handoff for `funzi7/affiliate-deals-bot`. Read this first, then the
> repository documentation linked below.

## Latest milestone: Affi Core — the Deal Engine behind the publisher

- Date: 2026-08-29
- Branch `main`, tracking `origin/main`.
- Final commit (pushed, verified local == origin/main == deployed server HEAD):
  **`55f8bee78fbf837b55f623d167e67c2412de74ee`** ("Record the Affi Core
  milestone production deployment"), whose parent is the milestone commit
  **`9e580a0959e67c31f030aaee5e45c6efe056a87f`** (parent
  `c450cbe94899ec1f9bdccd35776e54e250ee4d35`).

## What was built (all additive, flag-gated, production byte-identical when off)

- **`src/affiliate_deals_bot/affi_core/`** (~20 strict-typed modules): Money
  (Decimal; unknown = None, never 0), canonical products + check-digit-validated
  identifiers (UPC-12→GTIN-13) + variant attributes, evidence-based matcher
  (hard id > merchant identity > brand+model+variant > fuzzy-review-only;
  variant contradictions and **equal-or-stronger-tier conflicts** block merges;
  SKU vs product-id are distinct namespaces), offers (affiliate_url only when
  `affiliate_ready` — a `go.bee.deals` link structurally cannot become Affi's
  link; regular_price only when verified), append-only observations + metrics
  (median/low need ≥3 real samples), BeeDeals radar parser/aggregator
  (allowlisted retailer hosts — `amazon.evil.com` can't mint identifiers;
  discount/threshold amounts never become prices; tracking links with query
  strings stay provenance-only), four workers, deterministic Governor (six
  actions, recorded decisions, hidden score), radar pacing (20-min gap +
  volume bands; KSP feed never delayed), Hebrew/RTL rendering (UTF-16 running
  cursor, hidden affiliate TEXT_LINK only when publishable, list price =
  `מחיר מחירון`, tags last, no persuasion), taxonomy, store over **schema
  v7+v8** (16 additive tables; idempotent writes; repository gained a public
  `transaction()` seam), and the channel-independent `AffiCoreService`.
- **Locked thread UX plumbing** behind `AFFI_CORE_ENABLED` (default false;
  `reply_to=None` proven byte-identical at MTProto level): optional reply on
  the three raw send requests with a **same-random_id plain fallback** when
  Telegram rejects the anchor (a deleted ROOT never strands a deal);
  `DeliveryPlan.reply_to_message_id` with backward-compatible outbox payloads;
  `GovernedSourceBatchProcessor` decorating the mirror processor (live +
  backfill paths) with lazy ROOT indexing from existing destination mappings;
  imports are inside the flag gate so the mirror can't be affected even at
  import time. One ROOT per (product, channel) is schema-unique.

## Validation (all passed)

- Offline: **767 pytest**, ruff + format + strict mypy (104 files),
  `git diff --check`, secret/identity scan — clean. Two independent
  adversarial reviews: production-path (0 blockers / 1 minor) and affi_core
  (2 blockers / 8 minors) — **every finding fixed with regression tests**
  (details in `docs/RELEASE_REVIEW.md`).
- Migration: v6→v8 verified on a **real production backup** (73 mappings /
  103 versions / 121 outbox / cursor 16558 preserved bit-for-bit).
- Physical (real Telegram): **root/reply E2E 11/11** on a controlled ephemeral
  private channel (root; on-wire UTF-16 text/entity fidelity incl. the hidden
  affiliate TextUrl offset; tags last; updates 1+2 and a post-restart update 3
  all replying to the SAME root; edit isolated to its update with reply kept;
  restart-preserved root; no duplicate root; same-idempotency-key republish
  returned the same message id). Channel deleted after; production untouched.
- BeeDeals live smoke (read-only): 25 real posts → 15 signals (merchants
  aliexpress 7 / ksp 4 / amazon 2 / ace 2); all tracking links internal-only;
  15 distinct candidates (4 KSP publishable); idempotent; scratch DB deleted.

## Production deployment (verified)

Same mechanism as prior milestones (fresh online `.backup` → stop → git-bundle
fetch → detached checkout of the exact pushed HEAD → `pip install -e` → start).
After upgrade: schema **8** live, mappings 73→78 + cursor 16558→16562 purely
from genuinely new `@KSPcoil` posts (nothing republished), restart left state
byte-identical with **0 duplicate destination ids**, journal clean, Remote
Sources containers Up/healthy. `AFFI_CORE_ENABLED` is **not set** in the
production env (mirror byte-identical). Backups on host:
`backups/db-premilestone-20260829T084036Z.sqlite3` and
`backups/db-preupgrade-20260829T121032Z.sqlite3`.

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

## Enabling Affi Core later (deliberate steps, not automatic)

1. `AFFI_CORE_ENABLED=true` in `/etc/affiliate-deals-bot/affiliate-deals.env`
   → threads eligible single-product KSP posts **only after** their listing is
   bound to a canonical product (`merchant_products.product_id`); until
   bindings exist, behavior is unchanged.
2. Deal-Radar ingestion additionally needs `radar_sources.enabled=1` per
   source **and a worker loop that does not exist yet** (parser/aggregator/
   store are ready; no scheduled radar runner ships in this milestone).

## Remaining / future work

- Radar worker loop + product-binding/enrichment orchestration (workers exist,
  no scheduler); Governor-driven radar publications end-to-end.
- Future search bot + affi.co.il website on `AffiCoreService` (docs:
  FUTURE_DISCOVERY.md / FUTURE_WEBSITE.md). AliExpress adapter mechanism
  pending owner input (`affiliate_adapter_unavailable`); Amazon policy-gated.
- Multi-source root indexing orders by message id (fine for the single KSP
  source; revisit per-channel ordering if a second mirror source is added).
- Threaded posts' overflow continuations publish un-anchored (cosmetic).
- Shared VPS still not rebooted (autostart verified via enablement only).
