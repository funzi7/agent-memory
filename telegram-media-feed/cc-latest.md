# telegram-media-feed latest handoff

- Repo: `funzi7/telegram-media-feed`
- Branch: `agent/fix-album-carousel-swipe`
- Date/time: `2026-07-11T07:56:07Z`
- Starting telegram-media-feed HEAD: `6efcea9f35e98da577bd3bc9f930d7702971bd66`
- telegram-media-feed HEAD: `c90fe72150da96f8174f2b5feb2689e3e4d554de` (pushed)
- agent-memory HEAD before this handoff commit: `2e98e569eab110575c520d587caa423cd361a77f`
- Final agent-memory pushed HEAD is reported by the completing agent after commit/push.

## Current Update

- Album React state no longer changes on each raw horizontal `scroll`. The carousel commits its canonical media index only after scrolling finishes, using native element `scrollend` when supported and a 140ms debounced fallback otherwise.
- Touch/pointer gestures record the settled start index. Completion can select only `start - 1`, `start`, or `start + 1`, bounded to the album; long/fast flings therefore cannot skip multiple items.
- A clear swipe requires overall horizontal dominance plus either 12% of carousel width (bounded to 24-72px) or at least 12px at 0.35px/ms. Small, ambiguous, cancelled, or vertical movement returns to the starting item. Horizontal velocity expires after 80ms without horizontal motion.
- User scrolling and programmatic arrows/restoration/resize alignment are explicitly separated, so state-driven `scrollTo` calls cannot fight a finger or momentum gesture. Arrows use one target per activation and commit state only after settle.
- Every settle corrects to exactly `carousel.clientWidth * targetIndex`. CSS enforces LTR `x mandatory` snapping, `start` alignment, `scroll-snap-stop: always`, and slides with `flex: 0 0 100%`, `width: 100%`, and `min-width: 100%`.
- Physical swipe behavior stays LTR even around Hebrew/RTL captions: left advances and right returns. Touch handlers do not prevent native scrolling, and overall vertical intent remains owned by the main feed.
- ResizeObserver plus window, visual viewport, and fullscreen resize signals realign the current item after orientation, browser UI, layout, or fullscreen changes without resetting the post.
- Counter, dots, aria carousel label, active video eligibility, and preload selection update only for the exactly settled slide. Existing arrow labels/disabled states remain intact.
- README and `docs/PROJECT_STATE.md` now describe the exact behavior, validation, remaining work, limitations, untouched scope, commands, routes, and commit checkpoints.

## Validation

- `git diff --check`: passed in `telegram-media-feed`; agent-memory was rerun after this handoff edit before commit.
- `npm run typecheck`: passed after the final intent/velocity and pointer-completion review changes.
- `npm run build`: passed; all existing pages and API routes compiled.
- Production HTTP/API checks passed:
  - `/`, `/?topic=47`, `/topics`, `/history`, `/history?topic=47`, `/admin/topics`, and `/admin/ingest`: `HTTP 200`
  - `/api/health`: `HTTP 200`
  - `/api/feed?limit=8`: `HTTP 200`, 8 items
  - `/api/feed?topic=47&limit=8`: `HTTP 200`, 2 matching posts including the three-photo album
  - `/api/topics`, `/api/admin/topics`, and `/api/admin/ingest?limit=5`: valid `HTTP 200` item responses
  - ranged media 4, 5, and 7: `HTTP 206`; too-large media 23: unchanged `HTTP 413`
- Temporary Playwright/CDP checks passed against production and independently against development, without adding a repo dependency:
  - three-photo post 21: long/fast `1 -> 2` and never `1 -> 3`; normal `2 -> 3`; reverse `3 -> 2`; 5%-width drag stayed on 2
  - canonical counter stayed on 1 during the active fling, then counter/dot/aria changed together only after settle
  - every rest was within 0.75px of the exact width-multiple; slide and carousel widths matched
  - LTR, mandatory/start/always snap styles and exact 100% slide sizing were computed in browser
  - portrait/landscape/portrait retained item 2 at the new exact width
  - vertical movement advanced exactly one feed post without changing the album, including a deliberately early diagonal-horizontal jitter case
  - desktop arrows passed `1 -> 2 -> 3 -> 2` with correct labels and edge disabled states
  - mixed post 20 photo/too-large-video placeholder passed and retained `Open in Telegram`
  - simulated absence of `onscrollend` exercised the debounce fallback and settled exactly on item 2

## Remaining TODOs

- Replace query-string access-token media URLs with cookie/session or Telegram Mini App authentication before unrestricted sharing.
- Implement the official Local Bot API Server solution for files over 20MB as a separate task, optionally add `ffmpeg`, and deploy on persistent hosting/VPS infrastructure.
- Consider TDLib/MTProto only if future history/message-access needs justify it.
- Consider reducing noisy server error logging for client-aborted media ranges.

## Explicitly Not Done

- No unrelated feed, player, topics, captions, sharing, fullscreen, history, ingest, API filtering, media loading, cache, or preload behavior was intentionally changed.
- No Local Bot API Server, `ffmpeg`, TDLib/MTProto, persistent media host, or change to the current over-20MB fallback was implemented.
- No Eximo investigation/fix, X/Twitter fetcher, or Eximo replacement was attempted.
- No permanent per-user seen/unseen state or permanent Playwright/browser dependency was added.
- `/admin/topics` remains the separate manual-title editor.

## Known Limitations

- Hosted Telegram Bot API `getFile` still cannot serve files over 20MB; they remain placeholder cards with `Open in Telegram`.
- Available mixed albums contain a photo plus an over-20MB placeholder, not a playable album video. That available mixed combination passed; standalone playable media range loading also passed.
- Current token-based access is not suitable for unrestricted sharing. Shared URLs must exclude `APP_ACCESS_TOKEN`, bot tokens, media proxy URLs, Telegram file URLs, and other secrets.
- Fullscreen/orientation, Web Share, and clipboard support still vary by browser and must fail gracefully.
- Browser private cache remains per browser/profile and is subject to eviction.
- Eximo diagnosis remains unchanged:
  - user media appears in `/admin/ingest`
  - Eximo media does not appear in `/admin/ingest`
  - Telegram does not deliver Eximo bot messages to this bot webhook
  - this is not a feed/history bug
  - future options are an owned X/Twitter fetcher, TDLib/MTProto, or replacing Eximo

## Useful Commands And Routes

- `git diff --check`
- `npm run typecheck`
- `npm run build`
- `npm start -- -H 127.0.0.1 -p <available-port>`
- `/`
- `/?topic=<message_thread_id>`
- `/topics`
- `/history`
- `/history?topic=<message_thread_id>`
- `/admin/topics`
- `/admin/ingest`
- `/api/health`
- `/api/feed?limit=8`
- `/api/feed?topic=<message_thread_id>&limit=8`
- `/api/topics`
- `/api/admin/topics`
- `/api/admin/ingest?limit=5`
- `/api/media/4`, `/api/media/5`, `/api/media/7`
