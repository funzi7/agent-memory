# telegram-media-feed latest handoff

- Repo: `funzi7/telegram-media-feed`
- Branch: `claude/personalization-telegram-auth-98x51m`
- Updated: `2026-07-12`
- Task starting telegram-media-feed HEAD: `44fb7cd705b7b1e5d4f9fdd118b7936abc69f9fc` (the corrected carousel/cache branch state, fast-forwarded onto the task branch before any change)
- Final pushed telegram-media-feed HEAD: `eaac840b1d9fa83ec1e7f0231f8c411b7d752a11`
- Task starting agent-memory HEAD: `4d52ae7` merge of `0eef8677e472ddb5dbcc49b39a31962bf9766d7c` (previous handoff) with the local thai-rent-finder auto-update.
- The final pushed agent-memory HEAD is reported by the completing response because this file is part of that commit.
- Work stayed on the checked-out branch. Nothing was reset to `main`; the corrected carousel implementation is byte-identical.

## What Was Implemented

First complete version of per-user personalization:

1. **Topic avatar fix** — real loaded profile images render over a transparent wrapper (class `topic-avatar-has-image` set on img load): no generated gradient, no black `box-shadow` halo, no padding ring; `object-fit: cover` fills the circular crop inside the retained subtle 1px neutral border. Size and right-of-title RTL placement unchanged. Initials fallback keeps its deterministic colored background. Upload/replace/remove untouched.

2. **Unified identity model** — `users` table (`identity_type` `telegram`|`browser`, unique nullable `telegram_user_id`, profile fields, `merged_into_user_id`). Browser identities are random opaque server-generated records (never derived from `APP_ACCESS_TOKEN`); they personalize but never grant feed access. `resolveCanonicalUser` follows merges.

3. **Telegram Mini App auth** (`lib/telegram-init-data.ts`) — official algorithm (`secret_key = HMAC_SHA256(bot_token, key="WebAppData")`; hex HMAC of the sorted data-check-string), `timingSafeEqual` comparison, `auth_date` freshness (default max age 3600s, env `TELEGRAM_INITDATA_MAX_AGE_SECONDS`, +300s future skew), strict user-payload validation. `ALLOWED_TELEGRAM_USER_IDS` is the allowlist (unset = reject all Mini App logins). Raw initData never stored/logged. Legacy trusted-proxy header gate moved behind `TRUSTED_PROXY_TELEGRAM_HEADER=1` (weaker, deployment-specific, still requires the app token — this is a small behavior change from the old always-on header gate).

4. **Sessions** (`lib/sessions.ts`) — 32-byte random tokens; only SHA-256 hashes stored (`sessions.token_hash` unique). Cookie `tmf_session`: `HttpOnly; Path=/; SameSite=Lax; Expires=+30d; Secure` in production. Rotation on Telegram auth, logout revocation, automatic cleanup, Origin/Host validation on state-changing cookie routes. No APP_SESSION_SECRET needed (random+hashed design); documented in `.env.example`.

5. **Events** (`lib/user-events.ts`) — exact v1 weights: completion +1 (once per user per playable video; server re-validates genuinely watched seconds ≥ 85% of known duration; client requires 90%, or 85% with `ended`, accumulated from small forward timeupdate deltas only), like +2/unlike −2 (idempotent toggle via `reversed_at`), share +3 once (client reports only after `navigator.share` resolves or clipboard copy succeeds). No negative scoring, no other point sources. Topic always derived server-side from media→post; aggregates recomputed from non-reversed events in the same transaction, so `user_topic_preferences` is always exact.

6. **Watch progress foundation** — `user_media_state.max_watch_percent` + `last_position_seconds`, throttled ~5s client sends, flushes on pause/video change/visibility change/pagehide/cleanup with `keepalive`; failures silent; no auto-restore in the feed yet.

7. **Feed modes** — `GET /api/feed?mode=for-you|latest` (response echoes served `mode`). For You ranks ALL eligible active posts in memory (fine at private scale); Latest is the untouched chronological path; `topic=` always chronological and hides the switch. Compact fixed `For You | Latest` pill top-center, persisted in `localStorage` `tmf_feed_mode`, default `for-you`. Server falls back to `latest` without an identity and the client reflects the served mode. Feed session cache bumped to `tmf_feed_cache_v5` with mode-aware keys.

8. **Ranking (exact formula/constants, `lib/feed-ranking.ts`)**
   - `base = 4.0 * affinity + 1.0 * freshness + 0.75 * unseen`
   - `affinity = score / (score + 3)`; `freshness = 1 / (1 + ageDays / 7)` against an hour-bucketed reference time pinned in the pagination cursor; `unseen = 1` when the user completed none of the post's media.
   - Order `base DESC, telegram_date DESC, id DESC`; deterministic max-2-consecutive-per-topic pass; every 10th position serves the best zero-preference-topic post when the user has any positive preference (~10% deterministic exploration; no randomness anywhere).
   - Constants: `AFFINITY_WEIGHT=4`, `FRESHNESS_WEIGHT=1`, `UNSEEN_BONUS=0.75`, `AFFINITY_HALF_SCORE=3`, `FRESHNESS_HALF_LIFE_DAYS=7`, `MAX_CONSECUTIVE_SAME_TOPIC=2`, `EXPLORATION_INTERVAL=10`, `RANKING_TIME_BUCKET_MS=3600000`.

9. **UI** — heart/Like inline-SVG button in the left rail between fullscreen and share; rail slots bottom-up: menu 0 / share 58 / like 116 / fullscreen 174 / mute 232 px (48x48 circles preserved). Correct `aria-label` Like/Unlike + `aria-pressed`, red filled active state. Viewer state fetched in batches per page with first-write-wins merging (bulk snapshot never clobbers a newer like/completion response).

10. **Guest→Telegram merge** (`lib/users.ts::mergeUserInto`) — events copied with `INSERT OR IGNORE` on target `event_key` (`user:media:type`), state merged (earliest first_seen/completed/liked/shared, latest last_seen, max watch percent, position from most-recently-updated row), affected topic aggregates recomputed exactly, source retired via `merged_into_user_id` + session revocation; repeat merge is an explicit no-op. Runs automatically inside `POST /api/auth/telegram` when a browser-profile cookie is present.

## Database Migration

`migrations/008_user_personalization.sql` (idempotent, wired in `lib/db.ts` MIGRATIONS + `ensureCurrentSchema`): `users`, `sessions`, `user_media_state`, `user_media_events`, `user_topic_preferences` with FKs and indexes. No existing data modified.

## Environment Variables

- `ALLOWED_TELEGRAM_USER_IDS` — repurposed as the Mini App allowlist (names/explanations only in `.env.example`).
- `TELEGRAM_INITDATA_MAX_AGE_SECONDS` — new, optional, default 3600.
- `TRUSTED_PROXY_TELEGRAM_HEADER` — new, optional, opt-in legacy proxy header gate.
- No `APP_SESSION_SECRET` required (hashed random tokens); documented.

## New API Routes / Cookies / Storage Keys

- `POST /api/auth/telegram`, `POST /api/auth/browser-profile`, `GET /api/auth/me`, `POST /api/auth/logout`
- `GET /api/me/media-state?ids=...`, `POST /api/me/events/progress|complete|like|share`
- `GET /api/feed?mode=for-you|latest` (+ existing `topic`, `cursor`, `limit`)
- Cookie: `tmf_session`. localStorage: `tmf_feed_mode` (+ existing `tmf_access_token`). sessionStorage: `tmf_feed_cache_v5`.

## Validation Completed

- `git diff --check` clean; `npm run typecheck` and `npm run build` pass.
- `npm test`: **64/64** (24 pre-existing including carousel/warm-cache/media-selection regressions, plus 40 new: initData valid/tampered-field/tampered-hash/missing-hash/wrong-token/stale/future/malformed-user/missing-user/bad-ids incl. constant-time path; sessions hash/expiry/revocation/cleanup; browser-session-no-access/token-access/telegram-session-access/non-allowlisted-rejection; admin-not-bypassed-by-session; completion/like/unlike/share idempotency incl. hidden/unknown media and server-derived topics; progress clamping; merge exactness/idempotency/max-progress/latest-position; ranking weights ordering, unseen bonus, recency-secondary, max-2-consecutive, deterministic exploration; feed modes chronological/topic-chronological/coverage/stable-dedup-pagination).
- Production server (fresh seeded validation DB, fake test bot token): all pages 200 (`/`, `/?mode=for-you`, `/?mode=latest`, `/?topic=1`, `/topics`, `/history`, `/admin/topics`, `/admin/ingest`, `/api/health`); feed/admin 401 without token; browser-profile bootstrap 401 without feed access, idempotent with; cookie-only feed 401; Telegram auth fixtures: allowlisted 200 + rotated session granting feed but not admin, non-allowlisted 403, stale/tampered 401; merge over HTTP `merged:true` once then `merged:false` with no extra points; events over HTTP: like/unlike/completion/share exact and idempotent, insufficient/impossible progress rejected, unknown media 404, no-session 401, malformed 400, cross-origin Origin 403; For You reordering after +6 on a topic with max-2-consecutive holding; topic feed chronological under `mode=for-you`; too-large media 413.
- Headless Chromium (390x844 mobile + desktop context): **19/19** — token unlock, identity bootstrap without access grant, mode switch default/persistence, Latest chronological head, like aria toggle + reload persistence, 48x48 aligned rail, no mode-switch collisions, real avatar transparent/no-halo/cover, fallback avatar gradient+initials, avatar right of title, carousel arrows exactly one item per step (1/3→2/3→3/3), no intrusive error without Telegram WebApp.

## Failures / Limitations (honest)

- Media `200/206` range semantics could not be re-exercised E2E in this sandbox (no reachable Telegram upstream); that code is untouched by this task and was validated in the previous task. `413` re-verified.
- Video playback (and browser-level completion/progress) not E2E-verified without real media bytes; server side fully validated over HTTP, client tracking unit-designed (forward-delta accumulation, seek exclusion).
- One client bug found and fixed during validation: the bulk viewer-state fetch was cancelled by the background feed revalidation before applying, so liked state didn't restore on reload; fixed with a non-cancelling first-write-wins merge (re-validated 19/19).
- Real BotFather Mini App registration NOT performed; Telegram auth validated only with generated fixtures + fake test bot token. Remaining setup: BotFather `/newapp`, stable HTTPS hosting for the Mini App URL, set `ALLOWED_TELEGRAM_USER_IDS`, real-device WebView acceptance.
- Browser access-token flow still uses query-token media URLs; allowlisted Telegram sessions already get cookie-authenticated media. Removing the query token remains a follow-up.
- In-memory rate limiting is per-process best-effort.

## Remaining TODOs / Explicitly Not Done

- High priority: Telegram Local Bot API Server for >20MB files (unchanged roadmap); optional ffmpeg later.
- Personal watched-history page (data foundation now exists in `user_media_state`); watch-position restoration policy.
- Android phone-folder importer; Eximo limitation unchanged; stronger stable hosting/deployment.
- Not done by design: push notifications, collaborative/global recommendations, ML training, negative/quick-skip scoring, comments, public profiles, BotFather/Cloudflare changes.

## HEADs

- telegram-media-feed final pushed HEAD: `eaac840b1d9fa83ec1e7f0231f8c411b7d752a11`
- agent-memory final pushed HEAD: reported in the completing response (this commit).
