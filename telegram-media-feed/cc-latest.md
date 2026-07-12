# telegram-media-feed — latest handoff (round 4: real-device Telegram bootstrap fix + Lock removal)

- Date: 2026-07-12
- Repo: `funzi7/telegram-media-feed`, branch `claude/personalization-telegram-auth-98x51m` (upstream `origin/<same>` verified to match)
- Task starting HEAD: `96aeb8cbb90e0c717d5a61e86ba0ed36d5d38d67` (round 3, deployed on port 3000)
- agent-memory starting HEAD: `4eec0f076cf7c6f6512969c7214ec12dd4759de8`
- Final HEADs: reported by the completing response and visible in `git log` on both branches (this file is committed with the final push).

## Why this round existed

After deploying `96aeb8c` with the user's numeric ID present in `ALLOWED_TELEGRAM_USER_IDS` (`.env.local`) and a server restart, the real Telegram Android Mini App STILL showed the `Private feed` / `Access token` form. The user had also previously pressed the feed `Lock` button, which cleared the locally stored token.

## Exact root cause (diagnosed from code, reproduced in a browser scenario)

The round-3 `waitForTelegramInitData` had an early exit: it aborted the bounded wait ~250 ms after `document.readyState === "complete"`, on the assumption that the bridge script's initData decision was final once the document finished loading. On real Telegram Android that assumption is false:

- the document reaches `complete` quickly (the bridge script itself loads fast),
- `window.Telegram.WebApp` already EXISTS at that point but with an EMPTY `initData` string,
- the WebView populates `initData` slightly later.

So the wait returned null early → bootstrap fell through to the browser-profile path → `/api/auth/browser-profile` gave a personalization-only identity with no feed access → feed request 401 → `needsToken` → token form. The failed identity was also cached per token in `ensurePersonalizationIdentity`, so the page didn't recover within its lifetime. **Why document-complete / early bridge detection was insufficient: document readiness and bridge-script completion say nothing about when Telegram's WebView injects initData; the only valid signals are the actual appearance of a non-empty `initData` or the full timeout.** The user's Lock press was a red herring — the stored token must be (and now is) irrelevant to Telegram launches.

## New bootstrap state machine (`app/personalization.ts`, consumed by `app/feed-page.tsx`)

Order on every fresh mount (all auth fetches same-origin with `credentials: "include"`, `cache: "no-store"`):

1. **Session first** — `GET /api/auth/me`. A valid Telegram session opens the feed cookie-only immediately; the stored APP_ACCESS_TOKEN is never consulted; the token form never shows.
2. **Hint detection** — `detectTelegramLaunchHints()`: non-empty `WebApp.initData`; bridge `platform` other than ``/`unknown`; `tgWebAppData|tgWebAppVersion|tgWebAppPlatform` in `location.hash`/`location.search`; the official bridge's `sessionStorage.__telegram__initParams` containing `tgWebApp`. A bare bridge object with empty initData is NOT a hint (the script defines `window.Telegram` in any browser). Hints select the UI path only — never authentication; `initDataUnsafe` is never trusted.
3. **Full-window wait** — `waitForTelegramInitData()` polls every 100 ms for the FULL `TELEGRAM_BRIDGE_WAIT_MS = 2000`. Deliberately NO early exit on `document.readyState`, script completion, or a bridge with empty initData. `ready()` is called safely once when the bridge appears; `expand()` stays optional/safe; no Telegram fullscreen APIs.
4. **Authenticate + verify** — POST initData to `/api/auth/telegram` (server-side official HMAC validation + allowlist, unchanged), then an immediate `/api/auth/me` verifies the fresh cookie BEFORE the feed loads.
5. **Failure handling** — with launch hints, the token form is UNREACHABLE. Specific screens with Retry: `no-init-data` (new; copy: "Telegram did not provide sign-in data. Close the Mini App, reopen it from the bot, and retry."), `invalid-init-data`, `not-allowlisted`, `session-verify`, `network`. A mid-session feed 401 under a Telegram identity maps to `session-verify`, never the token form.

**Token form conditions (exhaustive):** no existing session AND no initData after the full 2 s AND no Telegram launch hints — i.e. only a normal browser launch.

Stored-token isolation: the sessionStorage feed cache is applied only AFTER identity resolves (`applyCachedFeedEntry`; requires a telegram identity or a real browser token), so no token-era cache renders before Telegram auth; `effectiveAccessToken` is `""` under a Telegram identity, so media/feed/event requests carry no Authorization header or `access_token` query param; stale `needsToken` cannot survive a successful Telegram bootstrap.

Diagnostics (secret-free): `BootstrapStage` enum (`checking-session`, `existing-telegram-session`, `telegram-hints-found`, `waiting-bridge`, `init-data-found`, `authenticating`, `verifying-session`, `telegram-ready`, `telegram-failed:<reason>`, `browser-fallback`) surfaced as `data-boot-stage` on the `auth-booting` and `telegram-auth-error` testid nodes. No initData/tokens/cookies logged anywhere.

## Lock removal

- Feed menu: `Lock` button, `handleLock`, `handleLockClick`, and the `onLock` prop chain deleted from `app/feed-page.tsx`. No user-facing path clears the stored token, feed caches, warm video cache, or personalization identity, and nothing forces `needsToken=true`.
- History page: visible `Lock` button removed (internal 401 handling kept).
- Admin pages (`/admin/topics`, `/admin/ingest`, `/admin/personalization`): action relabeled exactly **`Sign out of admin`**; handlers clear only the locally stored APP_ACCESS_TOKEN + page state (never Telegram sessions, personalization data, or media caches).
- Authorization split unchanged: Telegram allowlist → feed/media cookie-only, never admin; APP_ACCESS_TOKEN → admin; no username auth.

## Validation performed (port 3001 production build; port 3000 untouched)

- `git diff --check`, `npm run typecheck`, `npm run build` clean.
- `npm test` **103/103** (96 prior + 7 new in `tests/telegram-bootstrap.test.ts`: hint matrix incl. empty-bridge non-hint; immediate initData + single ready(); late bridge; bridge-present-empty-initData with late data; document-complete-with-800ms-late-initData root-cause reproduction; full-window elapse before returning null).
- Round-4 browser suite (`browser-check-5.mjs`) **15/15**, including the real-device reproduction: bridge defined synchronously with empty initData + android platform, document long complete, initData populated 900 ms later → app authenticates and opens the feed with zero token usage; existing-cookie launch with the bridge removed; hints-without-initData reopen/Retry error with `data-boot-stage=telegram-failed:no-init-data` and working Retry; hints + stale stored token never show the token form; plain browser still unlocks with the token; no Lock in feed menu or history; admin shows `Sign out of admin`; non-allowlisted user gets the allowlist error.
- Regression suites: round-3 **30/30** (cookie-only auth, scrub, keyboard, speeds, double-tap zones, album warming, cross-tab reuse), round-2 **21/21**, round-1 **19/19** (one round-1 check updated to await the token form, which now legitimately appears only after the full bounded wait — expected behavior change, not a regression).

## Still pending / honest limitations

- **Real Telegram on a physical device was NOT exercised** — this sandbox cannot run Telegram. All Telegram behavior was validated with signed initData fixtures and a simulated bridge, including the exact document-complete-before-initData failure mode. Real-device acceptance is the immediate next step after deployment.
- **Deployment status: port 3000 still runs `96aeb8c` (the broken bootstrap) until the user redeploys this round's commit.** The fix cannot help the real device before that.
- Real upstream Telegram media 200/206 not testable in the sandbox (media route untouched this round).
- `.env.local`, BotFather, the Cloudflare tunnel, runtime SQLite, and topic assets were not modified.

## Next-step candidates

1. User deploys this branch's HEAD to port 3000 and reopens the Mini App from the bot on Android; if a failure screen shows, `data-boot-stage` on the error panel identifies the failing stage without exposing secrets.
2. Real-device acceptance of round-3 interactions (scrub, speeds, double-tap zones, album preloading).
3. Deferred items unchanged: Local Bot API Server for >20MB, ffmpeg, history importer, Eximo, personal History UI, browser-flow query-token removal, `disableVerticalSwipes()` (needs real-device evidence).

## Environment notes for the next agent

- Repo checkout lives at `/home/user/telegram-media-feed` (task prompts may say `/root/work/...` — wrong).
- Tests: `npm test` (tsx --test, CJS: no top-level await; DB tests set `process.env.SQLITE_PATH` then `require(...) as typeof import(...)`; the new bootstrap tests mock `globalThis.window`/`document` BEFORE requiring `../app/personalization`).
- Playwright: import from `/opt/node22/lib/node_modules/playwright/index.mjs`, chromium at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`; simulate Telegram by intercepting `https://telegram.org/js/telegram-web-app.js`; media stubs MUST implement byte-range 206 responses or direct video playback is unseekable.
- Validation scratch suites (session-scoped, may be gone): browser-check-{regression,3,4,5}.mjs under the session scratchpad `tmf-validate/` with a dedicated `app.sqlite`, fake bot token `123456:TEST-FAKE-BOT-TOKEN-for-validation`, allowlisted test id `777000111`, server on 3001.
