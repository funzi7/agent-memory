# telegram-media-feed latest handoff

- Repo name: `funzi7/telegram-media-feed`
- Branch name: `main`
- Date/time: `2026-07-10T10:39:00Z`

## Current Update

- Hardened `/api/media/[mediaId]` range handling and response headers for under-limit videos, with explicit `Accept-Ranges`, `Content-Length`, and `Content-Range` behavior plus safer proxy failure logs.
- Added frontend retry behavior for video playback errors so small videos do not immediately collapse into a permanent unavailable state, while preserving the custom vertical-feed player controls.
- Split fallback UX between too-large videos and playback failures, showing file size and Telegram open actions.
- Added topic display title resolution with DB title preference and a temporary mapping for thread `4403` to `חיילות`.
- Added concise webhook ingest logs with update/message/thread/media/file/post identifiers and no secret values.

## Validation

- `git diff --check`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `PORT=3001 npm start`: passed.
- `/api/health`: `HTTP 200`, `ok=true`.
- `/api/feed?limit=20`: `HTTP 200`, returned `5` items (`8,7,6,5,4`).
- `/api/media/4` with `Range: bytes=0-1023`: `HTTP 206`, `Content-Type=video/mp4`, `Content-Length=1024`, `Accept-Ranges=bytes`, `Content-Range=bytes 0-1023/1918131`.
- `/api/media/5` with `Range: bytes=0-1023`: `HTTP 206`, `Content-Type=video/mp4`, `Content-Length=1024`, `Accept-Ranges=bytes`, `Content-Range=bytes 0-1023/8778081`.
- `/api/media/7` with `Range: bytes=0-1023`: `HTTP 206`, `Content-Type=video/mp4`, `Content-Length=1024`, `Accept-Ranges=bytes`, `Content-Range=bytes 0-1023/12700385`.
- `/api/media/6`: `HTTP 413`.
- `/api/media/8`: `HTTP 413`.
