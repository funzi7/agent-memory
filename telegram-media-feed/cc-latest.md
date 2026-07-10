# telegram-media-feed latest handoff

- Repo: `funzi7/telegram-media-feed`
- Branch: `main`
- Date/time: `2026-07-10T20:13:17Z`
- telegram-media-feed HEAD before this handoff commit: `fe49a522057be822c8b613442c135e93c8bd874f`
- agent-memory HEAD before this handoff commit: `6989d09eea52fa283c02552d882e4e361d885b49`
- Final pushed HEADs are reported by the completing agent after commit/push.

## Current Update

- `/api/media/[mediaId]` now sends private browser-cache headers for playable media: `Cache-Control: private, max-age=86400`, stable `ETag`, stable `Last-Modified`, and `Accept-Ranges: bytes`.
- Non-range media requests with matching validators can return `304`; range requests still preserve `200`/`206`, `Content-Length`, and `Content-Range`.
- Too-large media remains a `413` JSON fallback with `Cache-Control: private, no-store`.
- Normal video URLs are stable; retry URLs only add `retry=<n>` after bounded playback failures.
- Feed client now stores recent per-topic snapshots in `sessionStorage`, including full/topic items, topic filter, next cursor, scroll position, active post id/index, and active album item index.
- Returning from topic-filtered feed to full feed restores the previous post when possible; stale snapshots revalidate instead of permanently hiding new items.
- Video preload is bounded:
  - active playable video uses `preload="auto"`
  - next 2-3 playable videos use `preload="metadata"`
  - too-large media is skipped as playable preload
  - inactive metadata preload errors are non-fatal and do not show `Playback failed`
- Multi-media posts now have an Instagram-like horizontal carousel with touch swipe, `1/2` counter, dots, desktop edge arrows, and per-item image/video/too-large fallback rendering.
- Inactive album videos pause and do not compete with the active item.
- Existing topic links, captions, controls auto-hide, mute persistence, history/admin links, and too-large `Open in Telegram` fallback behavior were preserved.

## Validation

- `git diff --check`: passed in `telegram-media-feed` and `agent-memory`.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- Port `3000` was occupied; production validation used `npm start -- -p 3001`.
- API/HTTP:
  - `/`: `HTTP 200`
  - `/history?topic=6828`: `HTTP 200`
  - `/api/feed?limit=8`: `HTTP 200`, 8 items
  - `/api/feed?topic=6828&limit=8`: `HTTP 200`, all posts matched topic `6828`
  - `/api/admin/ingest?limit=5`: `HTTP 200`
  - `/api/media/4`, `/api/media/5`, `/api/media/7` with `Range: bytes=0-0`: `HTTP 206`
  - `/api/media/4` with matching `If-None-Match`: `HTTP 304`
- Browser validation used temporary Playwright under `/tmp/tmf-playwright`, not repo dependencies.
- Mobile browser checks passed:
  - feed rendered 8 posts
  - initial image/fallback post attached 3 future playable video sources, all `metadata`
  - active playable video switched to `preload="auto"`
  - active plus lookahead video sources stayed bounded at 4
  - too-large media IDs were not attached as playable video sources
  - album post `20` showed `1/2`, swiped to `2/2`, then back to `1/2`
  - album dot indicator updated
  - album item with too-large fallback stayed swipeable
  - vertical feed swipe still worked after album interaction
  - topic click opened topic-filtered feed
  - returning via `All feed` restored post `12` to the top
  - full-feed and topic-feed snapshots existed in `sessionStorage`
  - `/admin/ingest` loaded

## TODO

- Replace query-string media access tokens with cookie/session auth before wider sharing.
- Consider reducing noisy server error logging for client-aborted media range requests; the client now treats inactive preload cancellations as non-fatal.

## Explicitly Not Done

- No Eximo ingestion fix was attempted.
- No TDLib/MTProto reader, X/Twitter fetcher, or Eximo replacement pipeline was added.
- No permanent per-user seen/unseen history was added.
- No permanent Playwright/browser-test dependency was added.
- `/api/feed`, `/api/feed?topic=<message_thread_id>`, `/history`, `/history?topic=<message_thread_id>`, `/admin/topics`, `/admin/ingest`, soft delete/visibility behavior, source display behavior, captions data, and large-media fallback semantics were not intentionally changed.

## Known Limits

- Hosted Telegram Bot API still has the 20MB `getFile` limit; larger files remain fallback cards.
- Browser private cache is per browser/profile and subject to normal browser eviction rules.
- Eximo diagnosis:
  - user media appears in `/admin/ingest`
  - Eximo media does not appear in `/admin/ingest`
  - Telegram is not delivering Eximo bot messages to this bot webhook
  - this is not a feed/history bug
  - future options are our own X/Twitter fetcher, TDLib/MTProto, or replacing Eximo

## Useful Commands And Routes

- `git diff --check`
- `npm run typecheck`
- `npm run build`
- `npm start -- -p 3001`
- `/`
- `/?topic=6828`
- `/history`
- `/history?topic=6828`
- `/admin/topics`
- `/admin/ingest`
- `/api/feed?limit=8`
- `/api/feed?topic=6828&limit=8`
- `/api/admin/ingest?limit=5`
- `/api/media/4`, `/api/media/5`, `/api/media/7`
