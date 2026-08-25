# cc-latest.md — affiliate-deals-bot handoff (latest)

> Rolling handoff for `funzi7/affiliate-deals-bot`. Read this first, then the
> repository documentation linked below.

## Latest milestone: Telegram mirror activation + KSP `/link` & `/sku` conversion

- Date: 2026-08-25
- Branch `main`, tracking `origin/main`.
- Project commit (pushed, verified local == origin/main):
  `6849ee9bef36e4f350c774df47597df2ff47674f`
  (parent `40cf2d780e0b2c4fedfc4e3569f49deb6cf3f00a`).

This milestone committed the previously-uncommitted Telegram mirror runtime and
resolved the production blocker where every recent `@KSPcoil` post is `/link/`
and `/sku/` alias-only.

## The KSP alias fix (key result)

- `/link/<alias>` and `/sku/<id>` convert by **appending `appKey=14095`** to the
  original URL query — **no HTTP/browser resolution**. Path preserved; **never**
  `/appkey/14095/link|sku/...` (owner-tested INVALID); `affToken` **never
  synthesized** (KSP mints it server-side). Existing query preserved, single
  appKey; foreign/unsafe/afftoken/malformed fail closed; validation structural
  only. Direct `/web|mob/cat|item|shops/` and existing verified forms unchanged.
- Owner-verified (manual, Android Chrome Incognito, same IP `72.251.215.16`):
  opening the four aliases with `?appKey=14095` produced **four affiliate visits
  in the authenticated KSP dashboard** with server-generated
  `/mob/link|sku/...?affToken=14095...` forms. `/sku/<id>` is **not** an identity
  map to `/item/<id>`.

## Real Telegram activation (physically verified)

- `@KSPcoil` (id `-1001495211401`) → `@AffiIsrael`; owner chat resolved via the
  project's own bot. `check-setup` passed.
- First E2E: 16511 → `@AffiIsrael` **msg 5** (read, parse hidden TextUrl/caption/
  formatting/photo, Hebrew/emoji UTF-16, `/web/cat/`→`/cat/14095-…`, partial
  owner alert, mapping/cursor, restart/dedup).
- Original 24h backfill (pre-fix): found **11**, published **0**, blocked **11**.
- Reprocessed backlog (post-fix): found **11**, **published 11** → dest msgs
  6–16; destination messages verified to carry `/link|sku/…?appKey=14095`; E2E
  post not duplicated; cursor `16535`. Newer posts 16532–16534 published
  (17–19); realtime resumed; restart/dedup and owner alerts confirmed.
- 16535 converted but its transformed photo caption is 1050 UTF-16 units (>
  Telegram's 1024) → `MediaCaptionTooLong` → blocked + owner-alerted (graceful).

## Client-context finding (documented limitation, NOT a blocker)

Same IP `72.251.215.16`: normal Android Chrome reaches KSP; `aiohttp`/headless
Chromium get `403 "KSP Forbidden 403"`; stock headful Chromium is intermittently
challenged by **Cloudflare Turnstile**. Exact discriminator **not proven**;
IP-reputation hypothesis **disproven**. No stealth/CAPTCHA/Turnstile/WAF/cookie
bypass used or needed — aliases carry `?appKey=14095` directly, so browser
resolution is **not** a production dependency. The 403/Turnstile is an HTTP/
browser **probing** limitation only; **not solved**, **not** an alias blocker.

## Validation

- Offline: pytest **454 passed**; ruff + ruff-format clean (63 files); strict
  mypy clean (63 files); `git diff --check` clean; secret/session scan clean
  (`.env`, `.local/` session+databases+backup untracked/gitignored).
- Live: E2E, backlog reprocess, newer posts, realtime, restart/dedup, owner
  notifications — all recorded above.

## Remaining / not verified

- **Live edit-sync round-trip** (edit a published source → same destination
  message edited, not duplicated): not physically performed (no controlled test
  source channel; no natural KSP edit in-window; bot auth was temporarily
  FloodWait-limited from diagnostic logins). Covered by deterministic tests +
  the edit-publish path (16511 from an EDITED batch). To close: controlled
  `live-smoke` on a reader-owned test channel, or a natural edit.
- Over-limit photo captions (16535) → block+alert; future: classify
  `MediaCaptionTooLong` non-retryable / caption handling.
- KSP automated 403/Turnstile probing limit; purchase/commission attribution
  (never provable by automation); **no persistent production hosting/deployment**
  (do not claim continuous operation).

## Next work / cautions

- Close the live edit-sync gap.
- LastPrice & Rozenfeld await real affiliate examples (no formats guessed);
  AliExpress future; Amazon policy/research-gated. Future Telegram search bot +
  cross-store discovery engine and `affi.co.il` website assistant/widget are
  documented, unbuilt. Marketing agent + ad spend require a hard Budget
  Controller first.
- Never commit `.env`, sessions, runtime DBs/backups, tokens, API hash, login
  codes, cookies, or logs. Protect the runtime database as source content.

Repository references: `README.md`, `TODO.md`, `docs/ARCHITECTURE.md`,
`docs/RUNBOOK.md`, `docs/PROJECT_STATE.md`, `docs/RELEASE_REVIEW.md`,
`docs/HANDOFF.md`, `docs/KSP_LIVE_SMOKE.md`, `docs/BRAND.md`,
`docs/FUTURE_WEBSITE.md`, `docs/FUTURE_DISCOVERY.md`.
