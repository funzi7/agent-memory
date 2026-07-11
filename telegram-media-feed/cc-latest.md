# telegram-media-feed latest handoff

- Repo: `funzi7/telegram-media-feed`
- Branch: `main`
- Date/time: `2026-07-11T06:20:07Z`
- telegram-media-feed HEAD: `6efcea9f35e98da577bd3bc9f930d7702971bd66` (pushed)
- agent-memory HEAD before this handoff commit: `5d75c9d5e5ad9ce83fb4c74a005a92e6e64d7fdd`
- Final pushed HEADs are reported by the completing agent after commit/push.

## Current Update

- Active playable videos now have a compact fullscreen control tied to controls visibility. It uses standard Fullscreen API with WebKit/native-video fallback, fails gracefully when unavailable, does not force rotation, and preserves playback/mute/progress state.
- Only the active playable slide renders fullscreen; photos, too-large fallbacks, and offscreen album videos do not expose it.
- Each post has a Share action using Web Share or clipboard/legacy-copy fallback with `Link copied` confirmation.
- Shared URLs are rebuilt as same-origin `/?topic=<message_thread_id>` URLs and exclude the current query, access token, bot token, media proxy URL, Telegram file URL, and Telegram post URL.
- Added authenticated `GET /api/topics` plus a mobile-first `/topics` directory with display titles, secondary thread ids, active media/video/photo counts, latest/update dates, topic-feed links, and topic-history links.
- Feed/Topics/History navigation points normal users to `/topics`; `/admin/topics` remains the manual-title editor.
- Previous album swipe, private cache/bounded preload, topic filtering, captions, source display, soft-delete, and too-large fallback behavior were preserved.
- Large-video roadmap is documented: hosted `getFile` remains limited to 20MB; the [official Local Bot API Server](https://core.telegram.org/bots/api#using-a-local-bot-api-server) is the preferred future solution for unlimited downloads and local absolute file paths. Future architecture is Next.js plus Local Bot API Server on persistent hosting/VPS, with optional `ffmpeg`; TDLib/MTProto is the heavier alternative.

## Validation

- `git diff --check`: passed in both repos.
- `npm run typecheck`: passed.
- `npm run build`: passed, including `/topics` and `/api/topics`.
- Production HTTP/API checks passed:
  - feed, topic feed, `/topics`, topic history, `/admin/ingest`, and `/admin/topics`: `HTTP 200`
  - `/api/feed`: 8 items; topic `6828`: 3 matching items
  - `/api/topics`: 6 valid count-consistent items
  - `/api/media/4`, `/api/media/5`, `/api/media/7` range requests: `HTTP 206`
  - `/api/media/23` kept the expected too-large `HTTP 413`
- Temporary Playwright checks passed:
  - topic card/feed and History links, required fields, mobile/desktop responsiveness
  - fullscreen visible only on active playable video, real enter/exit, unavailable-API fallback, portrait/landscape layout
  - source/play/mute/progress preservation, one-tap pause/resume, controls hide/show, preload bound, and topic cache
  - no fullscreen on photos; album `1/3 -> 2/3 -> 1/3`
  - Web Share and clipboard fallback both emitted a secret-free topic URL

## TODO

- Replace query-string access-token media URLs with Mini App, cookie, or session authentication before real friend-sharing. Until then, share only a safe app/topic URL.
- Implement Local Bot API Server support as a separate future task; optionally add `ffmpeg`, then deploy the app/server on persistent hosting/VPS infrastructure.
- Consider TDLib/MTProto only if the heavier history/message-access requirements justify it.

## Explicitly Not Done

- Local Bot API Server, `ffmpeg`, TDLib/MTProto, persistent media hosting, and changes to the existing over-20MB fallback were not implemented.
- No Eximo ingestion fix, X/Twitter fetcher, or Eximo replacement was attempted.
- No permanent seen/unseen history or permanent Playwright dependency was added.
- `/admin/topics` remains the manual-title editing interface.

## Known Limits

- Hosted Telegram Bot API `getFile` still cannot serve files over 20MB; larger files remain fallback cards with `Open in Telegram`.
- Current token-based access is not appropriate for unrestricted friend-sharing. Shared links must exclude `APP_ACCESS_TOKEN` and all secrets until proper session/Mini App auth exists.
- Fullscreen/orientation, Web Share, and clipboard support vary by browser and must fail gracefully.
- Browser private cache is per browser/profile and subject to eviction.
- Eximo diagnosis:
  - user media appears in `/admin/ingest`
  - Eximo media does not appear in `/admin/ingest`
  - Telegram does not deliver Eximo bot messages to this bot webhook
  - this is not a feed/history bug
  - future options are an owned X/Twitter fetcher, TDLib/MTProto, or replacing Eximo

## Useful Commands And Routes

- `git diff --check`
- `npm run typecheck`
- `npm run build`
- `npm start -- -p 3001`
- `/`
- `/?topic=<message_thread_id>`
- `/topics`
- `/history`
- `/history?topic=<message_thread_id>`
- `/admin/topics`
- `/admin/ingest`
- `/api/feed?limit=8`
- `/api/feed?topic=<message_thread_id>&limit=8`
- `/api/topics`
- `/api/admin/ingest?limit=5`
- `/api/media/4`, `/api/media/5`, `/api/media/7`
