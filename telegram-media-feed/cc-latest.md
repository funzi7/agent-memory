# telegram-media-feed latest handoff

- Repo name: `funzi7/telegram-media-feed`
- Branch name: `main`
- Date/time: `2026-07-10T19:27:04Z`
- telegram-media-feed HEAD before final handoff commit: `1b64ede72d72d9ead05c670cb7cc2f58d35b1764`
- agent-memory HEAD before final handoff commit: `08d61eef7ad3c2f9b105601700354b8ece848b0c`
- Final pushed HEADs are reported by the completing agent after commit/push.

## Current Update

- Fixed video-surface taps so a single tap both reveals controls and toggles play/pause.
- Topic and caption interactions stay separate from playback toggles.
- Removed rendered top feed/filter controls; date/time, `Open in Telegram`, `All feed`, and secondary menu controls now live in the per-card auto-hidden controls layer.
- Persistent overlay now contains only the right-side lower-third topic label and caption.
- Captions clamp to 3 lines with `More` / `Less`, stay under the topic label, and are spaced above controls/progress.
- Mute/unmute remains visible on playable videos while controls are visible unless browser introspection confirms no audio, in which case `No audio` is shown.
- `tmf_feed_muted` still persists the intended mute preference; autoplay muted fallback does not overwrite it.
- Auto retry is faster and bounded with 150ms then 450ms retry delays before fallback.
- Too-large fallback cards still keep `Open in Telegram` visible.
- Removed stale top-control CSS selectors.

## Validation

- `git diff --check`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- Port `3000` was occupied; rebuilt app was validated with `npm start -- -p 3001`.
- HTTP checks passed:
  - `/`, `/history`, `/history?topic=47`, `/admin/topics`, `/admin/ingest`: `HTTP 200`.
  - `/api/feed?limit=8`: `HTTP 200`, 8 items.
  - `/api/feed?topic=47&limit=8`: `HTTP 200`, all posts matched topic `47`.
  - `/api/history?topic=47&limit=8&visibility=active`: `HTTP 200`, all items matched topic `47`.
  - `/api/admin/ingest?limit=5`: `HTTP 200`.
  - `/api/media/4`, `/api/media/5`, `/api/media/7` with `Range: bytes=0-0`: `HTTP 206`.
- Browser validation used a temporary `/tmp` Playwright install only.
- Playwright checks passed:
  - real feed loaded 8 posts
  - real `/?topic=47` loaded
  - real `/admin/ingest` loaded
  - one tap toggled play/pause and restored hidden controls
  - topic tap opened topic feed and did not toggle playback
  - date/time, `Open in Telegram`, and `All feed` hid with controls
  - controls were not near the top safe area
  - topic label appeared right-side lower/mid-lower
  - `Topic 47` fallback displayed cleanly
  - caption was readable, clamped, and expandable without toggling playback
  - mute/unmute appeared on videos, synced with `video.muted`, and persisted to the next video
  - image card did not show mute
  - auto retry showed `Retrying` quickly (`333ms` final run), was bounded, and manual `Retry` cleared fallback immediately

## TODO

- Replace query-string media access tokens with cookie/session auth before wider sharing.

## Explicitly Not Done

- No Eximo ingestion fix was attempted.
- No TDLib/MTProto reader, X/Twitter fetcher, or Eximo replacement pipeline was added.
- No permanent Playwright/browser-test dependency was added.
- Topic filtering, history, topics admin, ingest audit, soft delete/visibility, media proxy range streaming, source display, captions data, and large-media fallback behavior were not intentionally changed.

## Known Limits

- Hosted Telegram Bot API still has the 20MB `getFile` limit; larger files remain fallback cards.
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
- `/?topic=47`
- `/history`
- `/history?topic=47`
- `/admin/topics`
- `/admin/ingest`
- `/api/feed?limit=8`
- `/api/feed?topic=47&limit=8`
- `/api/history?topic=47&limit=8&visibility=active`
- `/api/admin/ingest?limit=5`
- `/api/media/4`, `/api/media/5`, `/api/media/7`
