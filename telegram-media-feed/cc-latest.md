# telegram-media-feed latest handoff

- Repo name: `funzi7/telegram-media-feed`
- Branch name: `main`
- Date/time: `2026-07-10T18:53:32Z`
- telegram-media-feed HEAD before final handoff commit: `e9ea077c18c7a9d6abf237913e004774144360f2`
- agent-memory HEAD before final handoff commit: `eaa67e86b5e2fcf48578cfecbabf09ec9865e590`
- Final pushed HEADs are reported by the completing agent after commit/push.

## Current Update

- Split feed overlays into persistent content and auto-hidden control layers.
- Persistent overlay keeps the clickable topic label plus caption visible/readable.
- Auto-hidden controls now include mute, progress, `Open in Telegram`, and date/time; tapping the video restores the full controls.
- Captions show under the topic label, clamp to 3 lines, and support `More` / `Less` expansion.
- Too-large media fallback cards still show `Open in Telegram`.
- Playback failures now auto-retry up to 2 times with a subtle `Retrying` state before permanent `Playback failed` + manual `Retry`.
- Retry handling ignores aborted media errors and no longer keys the `<video>` element, so observer/playback state survives source-version retries.
- Active videos preload with `auto`, nearby videos use `metadata`, and farther videos use `none`.
- Feed mute state now uses `tmf_feed_muted`, migrates `tmf_video_muted`, persists across route/topic changes, and preserves the intended unmuted preference if a browser requires muted autoplay.

## Validation

- `npm run typecheck`: passed.
- `npm run build`: passed.
- Port `3000` was occupied; validated rebuilt app with `npm start -- -p 3001`.
- `/`, `/history`, `/history?topic=7053`, `/admin/topics`, `/admin/ingest`: `HTTP 200`.
- `/api/feed?limit=8`: `HTTP 200`.
- `/api/feed?topic=7053&limit=8`: `HTTP 200`, all returned posts matched topic `7053`.
- `/api/history?topic=7053&limit=8&visibility=active`: `HTTP 200`, all returned items matched topic `7053`.
- `/api/admin/ingest?limit=5`: `HTTP 200`.
- `/api/media/4`, `/api/media/5`, `/api/media/7` with `Range: bytes=0-0`: `HTTP 206`.
- Playwright Chromium validation passed with temporary local WebM interception:
  - feed/topic feed load
  - date/time and `Open in Telegram` hide with controls
  - tap restores controls
  - topic label stays visible/clickable
  - caption is readable on mobile viewport
  - long caption expands/collapses
  - auto retry happens before permanent error
  - manual `Retry` still works
  - mute/unmute preference persists across videos
  - too-large fallback `Open in Telegram` remains visible
- `git diff --check`: passed.

## TODO

- Replace query-string media access tokens with cookie/session auth before wider sharing.

## Explicitly Not Done

- No Eximo ingestion fix was attempted.
- No TDLib/MTProto reader, X/Twitter fetcher, or Eximo replacement pipeline was added.
- No permanent Playwright/browser-test dependency was added.
- Topic filtering, history, topics admin, ingest audit, soft delete/visibility, media proxy, source display, and large-media fallback behavior were not intentionally changed.

## Known Limits

- Hosted Telegram Bot API still has the 20MB `getFile` limit; larger files remain fallback cards.
- Eximo diagnosis:
  - user media appears in `/admin/ingest`
  - Eximo media does not appear in `/admin/ingest`
  - Telegram is not delivering Eximo bot messages to this bot webhook
  - this is not a feed/history bug
  - future options are our own X/Twitter fetcher, TDLib/MTProto, or replacing Eximo

## Useful Commands And Routes

- `npm run typecheck`
- `npm run build`
- `npm start -- -p 3001`
- `git diff --check`
- `/`
- `/?topic=7053`
- `/history`
- `/history?topic=7053`
- `/admin/topics`
- `/admin/ingest`
- `/api/feed?topic=7053&limit=8`
- `/api/history?topic=7053&limit=8&visibility=active`
- `/api/media/4`, `/api/media/5`, `/api/media/7`
