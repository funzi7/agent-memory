# telegram-media-feed latest handoff

- Repo: `funzi7/telegram-media-feed`
- Branch: `claude/personalization-telegram-auth-98x51m` (upstream `origin/<same>` verified to match)
- Updated: `2026-07-12`
- Task starting telegram-media-feed HEAD: `a18e2748ab0893b40d29257691637fa51141a773`
- Final pushed telegram-media-feed HEAD: `96aeb8cbb90e0c717d5a61e86ba0ed36d5d38d67`
- Task starting agent-memory HEAD: `9804faf25f4054e74c891c86dc34f7ddedc25a46`
- Final pushed agent-memory HEAD: reported by the completing response (this file is part of that commit).
- Work stayed on the checked-out branch; nothing reset to `main`; carousel untouched.

## Deployment status

- The user configured BotFather + Cloudflare and deployed the PREVIOUS commit on port 3000; the Mini App opens there but demanded APP_ACCESS_TOKEN (the bug fixed in this round).
- This round's commit `96aeb8c…` was validated on a production build on **port 3001** and pushed. It is **not deployed** to port 3000 by this task (per instructions); the user must pull/build/restart to get the fix live. BotFather, tunnel, `.env.local`, runtime data, port 3000 untouched.

## Root cause: Mini App required APP_ACCESS_TOKEN

Client-side only. `bootstrapIdentity` read `window.Telegram.WebApp.initData` exactly once, synchronously, when the initial React effect ran. On the real device the telegram.org bridge script often had not executed yet, so initData was `undefined`; the code fell through to the browser-profile bootstrap (401 without a token), the failed identity was cached per token, and the token form appeared permanently. Server-side initData validation, the allowlist, and session-based feed access were already correct (a session cookie minted manually did grant `/api/feed`).

## Exact fixes

### Authentication state machine (`app/personalization.ts`, `app/feed-page.tsx`)

1. Bounded bridge wait: `waitForTelegramInitData()` polls every 100 ms up to `TELEGRAM_BRIDGE_WAIT_MS = 1800`, with an early exit 250 ms after `document.readyState === "complete"` (the bridge script is a blocking resource, so "complete" means its initData decision is final). Plain browsers stay fast; slow WebViews get the full window.
2. `ready()` safely + `expand()` only when supported and `isExpanded === false`; no Telegram fullscreen, no `disableVerticalSwipes()` (no real-device evidence of conflict), no host UI interference.
3. `authenticateTelegram(initData)`: POST `/api/auth/telegram` with `credentials: "include"`, then immediately verify the fresh cookie via `GET /api/auth/me`. Failure taxonomy: `invalid-init-data`, `not-allowlisted` (server error code `telegram_user_not_allowed`), `session-verify` (Set-Cookie didn't stick), `network`.
4. UI phases: neutral loading (`data-testid="auth-booting"`) while booting → feed on success → Telegram-specific error screen with Retry (`data-testid="telegram-auth-error"`) on rejection → token form ONLY when no initData was present (plain browser). A mid-session feed 401 under a Telegram identity also becomes the `session-verify` error, never the token form.
5. Cookie-only Mini App: `effectiveAccessToken = identityType === "telegram" ? "" : accessToken` — feed requests carry no Authorization header and media/topic-asset URLs carry NO `access_token` query under a Telegram session; a stale stored `tmf_access_token` is ignored there (kept for browser/admin use). All auth/session/event fetches set `credentials: "include"` explicitly.
6. Origin/proxy: `isTrustedRequestOrigin` (unchanged logic) verified against the tunnel architecture — Origin is matched against the first `X-Forwarded-Host` entry, else `Host`; tests cover direct, proxied, proxy-chain, missing-Origin (allowed; SameSite=Lax is the backstop), hostile, and `null` origins. Nothing was broadly disabled.

### Draggable progress bar

- Pointer-captured scrubbing: press anywhere on the bar, drag continuously (tracking continues outside the bar while captured), live fill/thumb/floating-timestamp updates, commit on release, `pointercancel`/unmount cleanup, clamped [0, duration]; playing videos pause during the scrub and resume after; paused videos stay paused.
- Root fix behind "stays paused": new `userPausedRef` explicit-pause intent gates the `canplay`/`loadeddata` autoplay, so a seek can never resume a deliberately paused video; new/changed media still autoplays.
- Keyboard: ArrowLeft/Right ±5 s, Home, End; accurate `aria-valuemin/max/now/valuetext`; visible focus ring. Visuals: 4 px bar (6 px scrubbing), 14→18 px thumb, 30 px invisible touch target; `touch-action: none`.

### Playback speed

- Exactly 0.5×/1×/1.5×/2× as a "Playback speed" group inside the Menu for playable videos (rail order untouched); `aria-pressed` + `is-active`; selection keeps the Menu open.
- Persisted in localStorage `tmf_playback_rate`; applied via effect + `loadedmetadata` + `playing`, surviving source changes, retries, warm-swaps, album/feed navigation; never resets position/mute/like/fullscreen.
- Rate-aware watch accounting `lib/watch-accounting.ts`: accept a media delta only if `≤ wallDelta × playbackRate × 1.35 + 0.08 s`, absolute cap 4 s. Replaces the fixed 1.5 s threshold that would have rejected legitimate 2× progress. 2× full watch completes; 0.5× never undercounts; seeks (incl. double-tap ±5 and scrubs) contribute zero.

### Video double-tap zones

- Physical thirds of the rendered width (RTL never mirrors): left −5 s (clamp 0) with a `−5` indicator, right +5 s (clamp duration) with `+5`, center Like/Unlike (heart burst on like only). Recognizer window/radius unchanged (250 ms / 64 px); the double-tap cancels the pending single tap, so zone seeks never also play/pause. Play/pause state preserved; repeats accumulate; indicators are pointer-transparent, one-shot (animationend + 900 ms safety), reduced-motion aware. Images unchanged; settled album item only.

### Album sibling preloading

- Trigger: active post's video fires `playing` → `albumPlayingPostId` → `collectVideoWarmTargets(..., { playingPostId })` emits the album's other playable videos as role `album`, carousel order, only while that post is active.
- Priorities: current 0 / album 1 / ahead 2 / previous 3 (`reconcile`); queue ties keep insertion order; global concurrency stays at the proven bound of 2; per-key dedup prevents duplicate downloads; early swipe promotes the sibling's pending task to priority 0.
- Warmed siblings persist in Cache Storage (existing limits: 8/96 MiB storage, 5/64 MiB memory, 20 MiB per entry) for instant carousel playback, cross-tab reuse, and returns. Photos/too-large/duplicates excluded; leaving the post cancels unfinished tasks (completed entries stay); memory eviction now prefers non-retained entries first while hard bounds always hold. Diagnostic: `getQueueSnapshot()`.

## API/schema/storage changes

- No server API or database changes this round. New localStorage key: `tmf_playback_rate`. New client constants: `TELEGRAM_BRIDGE_WAIT_MS=1800`, seek step 5 s, zone thirds ⅓/⅔, watch tolerance 1.35×+0.08 s/cap 4 s.

## Validation performed (port 3001 production build)

- `git diff --check`, `npm run typecheck`, `npm run build` clean; `npm test` **96/96** (79 prior + 17 new: watch-accounting; album policy/queue priority/promotion/cancellation/quota-fallback; telegram cookie-only feed+media+topic-asset access, admin denial, browser-cookie denial; origin matrix).
- Round-3 browser suite **30/30** (390×844, realistic bridge simulation by intercepting `telegram-web-app.js` itself, range-capable media substitution): plain-browser token flow intact; Mini App feed with zero token usage (fresh and with stale stored token), `/api/auth/me` verification, ready/expand called, reload persistent; 900 ms-late initData authenticates; non-allowlisted and tampered initData show their specific errors + Retry (never the token form); drag scrub commit/resume, paused-stays-paused, keyboard ±5/Home, ARIA; 2× applied/persisted/menu-open/position+mute preserved and carried to the next album video; zone double-taps ±5 with correct-side indicators + clamps + play-state preservation, center Like/Unlike with/without burst, single tap intact; album: both siblings warmed exactly once on first real playback, persisted in Cache Storage, swipe reused the blob with no new fetch.
- Regression: round-2 suite **21/21** and round-1 suite **19/19** re-run against this build (newest-post expectation updated for newly seeded validation posts).
- Two test-harness findings worth remembering: (1) the browser media substitute must implement byte ranges or direct playback is unseekable (the real backend serves 206s); (2) simulate delayed initData by delaying the bridge script response, which also delays `readyState === "complete"` exactly like reality.

## Not performed / limitations (honest)

- **Real Telegram device validation was NOT performed** — the BotFather Mini App cannot be exercised from this environment. All Telegram auth validation used signed fixtures + a simulated bridge. Real-device acceptance still needed for: WebView cookie persistence, scrub/zone touch feel, decoder behavior, host gesture interaction.
- Real upstream media 200/206 untested here (no Telegram upstream; media route untouched this round).
- Port 3000 still runs the previous commit until the user redeploys.
- `disableVerticalSwipes()` deliberately not called pending real-device evidence.

## Explicitly deferred

Local Bot API Server (>20MB, high priority), ffmpeg, Android folder importer, Eximo, personal History UI, push notifications, comments, social profiles, ML, negative scoring, ranking changes, browser-flow query-token removal.

## HEADs

- telegram-media-feed final pushed HEAD: `96aeb8cbb90e0c717d5a61e86ba0ed36d5d38d67` (branch and origin verified identical)
- agent-memory final pushed HEAD: reported in the completing response (this commit).
