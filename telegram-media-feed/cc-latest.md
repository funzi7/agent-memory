# telegram-media-feed latest handoff

- Repo name: `funzi7/telegram-media-feed`
- Branch name: `main`
- Date/time: `2026-07-10T11:37:18Z`

## Current Update

- Added migration `003_post_sources` and defensive schema repair for source columns on `posts`.
- Telegram ingestion now captures `from.id`, `from.username`, names, `from.is_bot`, and `sender_chat` id/title/username without filtering out bot-uploaded media.
- Added source display helpers with `Unknown source` fallback for old rows.
- Added authenticated `/api/history` with paging and filters for topic, source, type, status, and search.
- Added `/history` archive UI with lightweight media cards, source summaries, and links to Feed/Topics.
- Added Feed -> History/Topics, Topics -> Feed/History, and History -> Feed/Topics navigation.
- Existing feed, media proxy, custom player, topics admin, and manual topic names were preserved.

## Validation

- `git diff --check`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- Port `3000` was already occupied by an existing `next-server`; validated rebuilt app with `PORT=3001 npm start`.
- `/api/health`: `HTTP 200`, `ok=true`.
- `/api/feed?limit=20` with `APP_ACCESS_TOKEN`: `HTTP 200`, returned posts `8,7,6,5,4`.
- `/admin/topics`: `HTTP 200`.
- `/history`: `HTTP 200`.
- `/api/history` without token: `HTTP 401`.
- `/api/history?limit=30` with `APP_ACCESS_TOKEN`: `HTTP 200`, returned media `8,7,6,5,4,3`.
- History included existing media rows `4,5,6,7,8`.
- Existing rows with no source fields displayed as `Unknown source`.
- Source summaries returned `unknown:6`.
- `/api/media/4`, `/api/media/5`, `/api/media/7` with range request and `APP_ACCESS_TOKEN`: `HTTP 206`.
