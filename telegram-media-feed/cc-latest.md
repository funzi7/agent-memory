# telegram-media-feed latest handoff

- Repo name: `funzi7/telegram-media-feed`
- Branch name: `main`
- Latest project commit SHA: `e4c960f0a813c4b0466730d377b45e42dc97c11e`
- Date/time: `2026-07-09T19:13:00Z`

## Current Update

- Replaced `/api/media/[mediaId]` Telegram file downloads with Node HTTP/HTTPS streaming using `family: 4`, request timeout, client abort handling, and up to 3 attempts for `ETIMEDOUT` / `ECONNRESET` / `EAI_AGAIN`.
- Kept Telegram bot token fully server-side; browser media URLs still point at `/api/media/[mediaId]`.
- Preserved Range passthrough for video playback and added graceful fallback to a full-body `200` stream if Telegram declines a ranged request.
- Added redacted media proxy diagnostics with `media_id`, `media_type`, range presence, attempt number, and final status/error code.
- Tightened Bot API size gating so known-small files are streamed even if a stale `too_large_for_bot_api` flag is present in SQLite.
- Preserved feed fallback UI; existing video elements already use `controls`, `playsInline`, and `preload="metadata"`.
- Preferred stored media MIME type over generic upstream `application/octet-stream` so ranged video responses return `video/mp4`.

## Validation

- `git diff --check`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `NODE_OPTIONS='--dns-result-order=ipv4first' npm run dev`: started successfully on `http://localhost:3000`.
- `curl -sS -L /api/media/3 ...`: `HTTP=200`, nonzero size (`271799` bytes).
- `curl -sS -L /api/media/4 ...`: `HTTP=200`, nonzero size (`1918131` bytes).
- `curl -sS -H 'Range: bytes=0-1023' /api/media/4 ...`: `HTTP=206`, nonzero size (`1024` bytes).
- Range response headers included `Accept-Ranges: bytes`, `Content-Range: bytes 0-1023/1918131`, `Content-Length: 1024`, `Content-Type: video/mp4`.
