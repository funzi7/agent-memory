# telegram-media-feed latest handoff

- Repo name: `funzi7/telegram-media-feed`
- Branch name: `main`
- Date/time: `2026-07-10T18:02:26Z`

## Current Update

- Added `GET /api/feed?topic=<message_thread_id>` while preserving the default unfiltered feed.
- Feed topic chips now link to topic-filtered feed views; filtered feed shows a compact topic pill with `History` and `All feed`.
- `/history?topic=...` initializes the topic filter and accepts both existing `topic:<chat>:<thread>` keys and simple thread ids.
- History card topic titles link to topic-filtered history; history `Open in feed` links now include the topic query.
- Polished custom video controls: progress rail is at the viewport bottom, controls auto-hide while playing, taps reveal/toggle playback, mute preference persists in `localStorage`, and unmuted autoplay rejection falls back without marking media unavailable.
- Added `webhook_ingest_audit` migration and redacted audit persistence for every valid Telegram webhook update after secret validation.
- Added owner-only `GET /api/admin/ingest` plus `/admin/ingest` page with source username, bot, topic, media key, and result filters.
- Admin ingest page includes the Eximo delivery diagnostic note: if no update appears there, Telegram did not deliver that bot message to this bot via Bot API.
- README/TODO now note that media access tokens in query URLs should be replaced with cookie/session auth before sharing with friends.

## Validation

- `git diff --check`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- Port `3000` was occupied; validated rebuilt app with `npm start -- -p 3001`.
- `/api/health`: `HTTP 200`.
- `/api/feed?limit=20` with `APP_ACCESS_TOKEN`: `HTTP 200`.
- `/api/feed?topic=7053&limit=20` with `APP_ACCESS_TOKEN`: `HTTP 200`, all returned posts matched topic `7053`.
- `/history`: `HTTP 200`.
- `/history?topic=7053`: `HTTP 200`.
- `/api/history?topic=7053&limit=20&visibility=active` with `APP_ACCESS_TOKEN`: `HTTP 200`, all returned items matched topic `7053`.
- `/admin/topics`: `HTTP 200`.
- `/admin/ingest`: `HTTP 200`.
- `/api/admin/ingest` with `APP_ACCESS_TOKEN`: `HTTP 200`.
- Synthetic webhook POST with a fake `EximoDiagnostics` bot text message returned `HTTP 200`; `/api/admin/ingest?sourceUsername=EximoDiagnostics&isBot=true&mediaType=text&result=ignored` showed the redacted audit row. The local fake row was removed after validation so it will not pollute real Eximo searches.
- `/api/media/4`, `/api/media/5`, `/api/media/7` with range request and `APP_ACCESS_TOKEN`: `HTTP 206`.
