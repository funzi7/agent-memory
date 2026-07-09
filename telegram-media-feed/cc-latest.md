# telegram-media-feed latest handoff

- Repo name: `funzi7/telegram-media-feed`
- Branch name: `main`
- Latest project commit SHA: `c56f034c12285e8dc8379e9fb3492fdd2f865d63`
- Date/time: `2026-07-09T15:29:35Z`

## What was built

- Created the first Next.js TypeScript MVP for a private Telegram media feed.
- Added SQLite migrations and auto-applied local database setup.
- Added Telegram Bot API webhook ingestion at `POST /api/telegram/webhook`.
- Ingests `photo`, `video`, `animation`, and image/video `document` messages.
- Ignores text-only messages and updates from non-allowed chats when `ALLOWED_CHAT_ID` is set.
- Tracks forum `message_thread_id` in topics and posts.
- Supports Telegram albums with `media_group_id` by grouping items into one post and delaying feed visibility with `ALBUM_FINALIZE_DEBOUNCE_MS`.
- Stores metadata only and marks files over 20MB as `too_large_for_bot_api`.
- Added private feed API, backend media streaming endpoint, health endpoint, and mobile-first scroll-snap frontend.
- Added README setup instructions, SECURITY notes, and TODO phase 2 plan.

## Files changed

- `.env.example`
- `.gitignore`
- `README.md`
- `SECURITY.md`
- `TODO.md`
- `app/api/feed/route.ts`
- `app/api/health/route.ts`
- `app/api/media/[mediaId]/route.ts`
- `app/api/telegram/webhook/route.ts`
- `app/feed-page.tsx`
- `app/globals.css`
- `app/layout.tsx`
- `app/page.tsx`
- `lib/auth.ts`
- `lib/db.ts`
- `lib/env.ts`
- `lib/feed.ts`
- `lib/media.ts`
- `lib/telegram.ts`
- `migrations/001_initial.sql`
- `next-env.d.ts`
- `next.config.mjs`
- `package-lock.json`
- `package.json`
- `tsconfig.json`

## Commands run

- `git status --short --branch`
- `git branch --show-current`
- `git remote -v`
- `find . -maxdepth 3 -type f -not -path './.git/*' -print`
- `node --version`
- `npm --version`
- `npm install`
- `npm run typecheck`
- `npm run build`
- `npm audit --json`
- `npm audit --audit-level=moderate`
- `git add .env.example .gitignore README.md SECURITY.md TODO.md app lib migrations next-env.d.ts next.config.mjs package-lock.json package.json tsconfig.json`
- `git commit -m "Initial telegram media feed MVP"`
- `git push -u origin main`

## Tests/checks run

- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm audit --audit-level=moderate`: passed with `found 0 vulnerabilities`.

## Setup steps still needed by the user

- Create a Telegram bot with BotFather.
- Disable bot privacy mode with BotFather `/setprivacy`.
- Add the bot to the private supergroup and promote it to admin.
- Populate `.env.local` with `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `ALLOWED_CHAT_ID`, and `APP_ACCESS_TOKEN`.
- Expose the local app over HTTPS for Telegram webhook delivery.
- Register the webhook with Telegram using `setWebhook` and the configured secret token.
- Send new media messages after the webhook is active; Bot API webhooks do not import old history.

## Known limitations

- Hosted Telegram Bot API media streaming is limited to files up to 20MB.
- Larger files are indexed as placeholders and require `Open in Telegram`.
- Old Telegram history is not imported.
- Topic titles are only captured when Telegram sends topic service messages; otherwise the UI shows topic ids.
- `ALLOWED_TELEGRAM_USER_IDS` is only meaningful behind a trusted proxy or wrapper that injects `X-Telegram-User-Id`.
- SQLite is appropriate for the local private MVP but should be migrated before heavier concurrent use.

## Next recommended task

- Configure a real bot/webhook against the private supergroup, ingest several test media posts and albums, then verify mobile playback and topic grouping on an actual phone.
