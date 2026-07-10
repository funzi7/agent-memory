# telegram-media-feed latest handoff

- Repo name: `funzi7/telegram-media-feed`
- Branch name: `main`
- Date/time: `2026-07-10T12:46:05Z`

## Current Update

- Added display-layer detection for Telegram anonymous/group-sent messages (`GroupAnonymousBot` / fake sender id) so History shows `Sent as group · <sender chat>` instead of `@GroupAnonymousBot`.
- History now includes the helper note `Telegram hides the real sender for anonymous/group-sent messages.` for those sources.
- Added DB-backed `source_aliases` table and owner-only `PATCH /api/admin/source-aliases` so source display aliases such as `אני` can be set without changing raw Telegram source fields.
- `/history` Sources panel now exposes compact Filter plus Alias/Save/Clear controls and preserves raw source keys separately from display titles.
- `/admin/topics` now renders explicit mobile topic cards at narrow widths while keeping the desktop table for wide screens; mobile nav spacing was tightened.
- History badges were adjusted to avoid mobile clipping; soft delete/visibility behavior was preserved.

## Validation

- `git diff --check`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- Port `3000` was occupied; validated rebuilt app with `npm start -- -p 3001`.
- `/api/health`: `HTTP 200`.
- `/api/feed?limit=20` with `APP_ACCESS_TOKEN`: `HTTP 200`.
- `/history`: `HTTP 200`.
- `/admin/topics`: `HTTP 200`.
- `/api/history` without token: `HTTP 401`.
- `/api/history?limit=80&visibility=all` with `APP_ACCESS_TOKEN`: `HTTP 200`, returned media.
- Real local `GroupAnonymousBot` rows displayed as `Sent as group`, not `@GroupAnonymousBot`, and included the anonymous sender helper.
- Source alias save to `אני`, reflected History display, and prior alias restore all passed; unauthenticated alias write returned `HTTP 401`.
- Hide/delete/restore transition on one feed media item passed; hidden/deleted were excluded from feed and visible through matching History filters.
- Mobile History layout checked at `360x740` Android viewport with Playwright: 10 cards inspected, badge clipping/overflow check passed.
- Mobile Topics layout checked at `360x740`: desktop table hidden, topic cards visible, no horizontal overflow, nav controls did not overlap.
- `/api/media/4`, `/api/media/5`, `/api/media/7` with range request and `APP_ACCESS_TOKEN`: `HTTP 206`.
