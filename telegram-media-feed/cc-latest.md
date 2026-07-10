# telegram-media-feed latest handoff

- Repo name: `funzi7/telegram-media-feed`
- Branch name: `main`
- Date/time: `2026-07-10T12:28:12Z`

## Current Update

- Added migration `004_media_visibility` and defensive schema repair for `media_items.visibility` plus `visibility_updated_at`.
- Added owner-only `PATCH /api/media/[mediaId]/visibility` guarded by `APP_ACCESS_TOKEN`; values are `active`, `hidden`, and `deleted`.
- Main feed now selects only active media items; media proxy behavior is unchanged.
- `/api/history` defaults to active media and supports `visibility=active|hidden|deleted|all` while preserving topic, source, type, playback status, and search filters.
- `/history` now has a Visibility filter, compact Hide / Mark deleted / Restore controls, hidden/deleted badges, clearer `Unknown source` helper text, and mobile badge wrapping.
- Existing source tracking, topic names, navigation, auth/unlock, under-limit playback, and too-large fallback were preserved.

## Validation

- `git diff --check`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- Port `3000` was occupied; validated rebuilt app with `npm start -- -p 3001`.
- `/api/health`: `HTTP 200`.
- `/api/feed?limit=20` with `APP_ACCESS_TOKEN`: `HTTP 200`.
- `/history`: `HTTP 200`.
- `/api/history` without token: `HTTP 401`.
- `PATCH /api/media/4/visibility` without token: `HTTP 401`.
- `/api/history?limit=80` with `APP_ACCESS_TOKEN`: `HTTP 200`; default rows were all `active`.
- Active History included existing media rows `4,5,6,7,8`.
- Hide/delete/restore transition on one feed media item passed: hidden and deleted states were excluded from feed, visible via matching History filters and `all`, and restore returned the item to feed/history.
- Mobile History layout checked at `360x740` Android viewport with Playwright: 10 cards inspected, badge clipping/overflow check passed.
- `/api/media/4`, `/api/media/5`, `/api/media/7` with range request and `APP_ACCESS_TOKEN`: `HTTP 206`.
