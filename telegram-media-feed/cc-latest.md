# telegram-media-feed latest handoff

- Repo: `funzi7/telegram-media-feed`
- Branch: `claude/personalization-telegram-auth-98x51m`
- Updated: `2026-07-12`
- Task starting telegram-media-feed HEAD: `eaac840b1d9fa83ec1e7f0231f8c411b7d752a11` (first personalization release; the user confirmed this build is deployed and running on port 3000)
- Final pushed telegram-media-feed HEAD: `a18e2748ab0893b40d29257691637fa51141a773`
- Task starting agent-memory HEAD: `cec30f7e95faad0ec1fd3c2d7731e9505779c1ee`
- The final pushed agent-memory HEAD is reported by the completing response because this file is part of that commit.
- Work stayed on the checked-out branch; nothing was reset to `main`; the corrected carousel implementation is untouched.

## Deployment status (important)

- **Port 3000 still runs the PREVIOUS commit `eaac840…`** (deployed by the user before this task).
- **The new commit `a18e274…` was validated on a production build on port 3001** with a seeded validation database, and is pushed — but this task did NOT deploy it to port 3000 and did NOT touch the Cloudflare tunnel. Deploying the new commit is a user step (`git pull && npm run build && restart`).
- Round-1 caveat acknowledged: earlier "works" conclusions before the round-1 build was actually deployed were invalid; this round validated everything on a test port and labels deployment status explicitly.

## Exact bugs fixed / features added (round 2)

1. **Rail disappears after video ends** — `onEnded` now forces controls visible and the auto-hide timer is disabled while `video.ended` or the menu is open. Like/Share/Mute/Fullscreen/Menu stay usable after ended; unmuting an ended video no longer auto-replays; single tap replays and normal auto-hide resumes; post change resets; completion stays idempotent.
2. **Menu auto-closed by the controls timer** — while `postMenuOpen` the timer is suppressed and hide requests are ignored; the menu closes only via toggle, outside pointerdown, navigating action, active-post change, or Lock. Root-cause extra fix: `.post-controls-menu` now has `pointer-events: auto` — previously the container inherited `none`, so taps on menu padding fell through to the video tap target (also fixes Android menu scrolling).
3. **Rail order** — exact top-to-bottom order **Like, Share, Mute, Fullscreen, Menu** in one gap-free bottom-anchored column. Active `FeedVideo` registers `{hasAudio, isMuted, isFullscreen, toggleMute, toggleFullscreen}` into the rail; images get Like/Share/Menu. In fullscreen, mute/exit duplicates render inside the video shell (only that subtree is visible there). 48x48 circles/centering preserved.
4. **Liked heart empty after reload** — `/api/feed` now embeds `viewerState` (`liked`, `completed`, `maxWatchPercent`, `lastPositionSeconds`) per media item for the authenticated identity, in all modes, pagination, and topic feeds; absent without identity. The client seeds hearts from the same payload that renders posts; the sessionStorage snapshot folds in live viewer state (a real second bug found in validation: cached items previously kept fetch-time state, so a like made during the session flashed empty after reload). Revalidation skips media mutated after the request started. Unknown identity → disabled `is-unknown` heart, never a false "not liked". Feed cache key bumped `tmf_feed_cache_v5` → `tmf_feed_cache_v6`. The old client bulk media-state fetch was removed (`GET /api/me/media-state` remains for ad-hoc use).
5. **Double-tap like/unlike** — `lib/tap-gesture.ts` recognizer: `DOUBLE_TAP_WINDOW_MS = 250`, `DOUBLE_TAP_MAX_DISTANCE_PX = 64`; only clean taps enter (video < 12 px movement, image ≤ 6 px, multi-touch blocked). Double-tap cancels the pending single tap (play/pause or photo viewer fire after the window resolves); applies to the settled album item; swipes/pinch/progress/rail/menu/viewer taps never count; keyboard activation bypasses it. Like mutations serialized per media id — latest mutation wins, out-of-order responses discarded, failure rolls back with a compact `Like failed` notice.
6. **Heart burst animation** — one centered inline-SVG `.like-burst` per unliked→liked transition (button or double-tap): scale-in/overshoot/fade ~750 ms, `pointer-events: none`, no layout shift, removed on `animationend` + 1.2 s safety timeout; never on unlike; `prefers-reduced-motion` gets a plain fade.
7. **Avatar dark ring removed completely** — with a usable image URL the wrapper is transparent from the first loading frame: `border: 0; outline: 0; background: none; box-shadow: none; padding/margin: 0`; img `display: block; object-fit: cover; transform: scale(1.01)` (hides anti-aliased rim); `overflow: hidden` + circle kept; error → deterministic initials fallback (only imageless topics show it, gradient kept). Shared component also kills the dark `#121212` ring `/topics` applied to image avatars.
8. **Cross-tab video cache** — diagnosed: fresh tab → memory empty → `acquireStored` aborted by the fixed 120 ms probe before Cache Storage init + large-blob `response.blob()` could finish → duplicate full direct download. Fixed with a two-stage lookup: `VideoWarmCache.hasStored()` / store `has()` (header-only `cache.match`, no body read, no network, no full initialize) bounded at `VIDEO_STORED_EXISTENCE_WAIT_MS = 450`; when the entry exists, materialization is awaited up to `VIDEO_STORED_MATERIALIZE_WAIT_MS = 4000` with no parallel direct request; a miss falls through to direct range playback immediately. Bounded limits, too-large exclusion, and secret-free keys unchanged.
9. **Diagnostics** — `/admin/personalization` + `GET /api/admin/personalization` (`lib/personalization-diagnostics.ts`): admin token required, Telegram session never qualifies; shows current actor (identity type, masked `actor#<id>`, username), browser feed mode, topic preference table (score + per-type points/counts + updated), 50 recent events (type/media/topic/weight/created/reversed), 50 recent media states, and the +1/+2/+3 explanation; proves duplicates add nothing. No destructive controls, no tokens, no other users. Menu gained a `Personalization` link (History/Topics/Manage topics/Ingest/Refresh/Lock/Open in Telegram kept). One-time `Completed · +1` transient notice on first completion per media (server `changed` flag gates repeats).
10. **Ranking untouched** — weights/formula/constants/modes/exploration/stability exactly as round 1.

## API / schema / storage changes

- `/api/feed` response media items: new optional `viewerState` object (only for the requesting identity). No other response changes; no database schema changes; no env-var changes.
- New route: `GET /api/admin/personalization`. New page: `/admin/personalization`.
- Client storage: `tmf_feed_cache_v6` (was v5). Cookie names unchanged (`tmf_session`).
- New module `lib/tap-gesture.ts`; `PersistentVideoWarmStore` gained optional `has(key)`.

## Validation performed (port 3001 test build)

- `git diff --check` clean; `npm run typecheck`; `npm run build`.
- `npm test` **79/79** (64 prior + 15 new: recognizer single/double/distant/rapid/cancel; cache existence-without-body-read, miss/abort/ineligible, memory reporting, slow-materialization-no-abort-no-duplicate-fetch; feed hydration first-response/pagination/topic/for-you/user-isolation/no-identity; diagnostics exact totals + reversal + no token leak + admin-only).
- HTTP: all pages 200 incl. `/admin/personalization`; feed and diagnostics APIs 401 without token; hydrated viewer state verified with/without identity and on topic feeds; too-large 413.
- Headless Chromium (390x844, deterministic WebM/JPEG substitution): **21/21** — completion notice exactly once, ended pins rail (checked 3.2 s past auto-hide), exact rail order + Like topmost, replay, menu open > auto-hide with video advancing, in-menu tap kept open, outside tap closes, ended+menu both visible, double-tap like + single burst + self-removal, unlike with no animation, image double-tap likes without opening viewer, single-tap viewer still opens, liked heart filled at first paint after reload, unliked correct after reload, touch swipe moves exactly one album item and likes nothing, diagnostics show completion +1 for the browser actor, initials fallback gradient intact.
- Round-1 regression browser suite re-run on the new build: **19/19** (token unlock, identity bootstrap grants nothing, mode switch/persistence, Latest chronological, 48x48 rail, collisions, avatar, RTL placement, carousel arrows, no Telegram-absent error).
- Avatar screenshots at normal scale and DPR 3 over image and video posts saved as validation artifacts (not committed).

## Manual checks NOT performed / limitations

- Physical Android device (touch vendor behavior, decoder, Web Share chrome, real quota pressure).
- Real media `200/206` against Telegram upstream (sandbox has none; the media route was not modified this round).
- Real Telegram WebView Mini App auth (fixtures only, as before).
- Port 3000 was not redeployed; the new commit is validated but NOT live there.
- Cross-tab: a brand-new tab still pays local blob materialization/decode time for large entries (bounded, spinner-represented, no network); two tabs racing before the first warm persists still cause one direct download in the second tab; without Cache Storage the fallback is direct playback.
- In-memory rate limits remain per-process.

## tmfup false positive

`tmfup` exists only as an external shell alias outside every accessible repository, so its checker could not be edited (shell config intentionally untouched). Its `FINAL DIAGNOSIS: FAILED_CHECK_LOG` was a false positive: the sole log line `nohup: ignoring input` is harmless nohup noise and the checker should ignore exactly that line (while keeping real warnings/exceptions). Also: `/api/feed` returning `401` without a token/session is expected authorization behavior, not a server failure.

## Explicitly Not Done (unchanged roadmap)

Local Bot API Server (>20MB, high priority), ffmpeg, Android folder uploader, Eximo workaround, full personal History UI, push notifications, comments, social profiles, ML, negative scoring, ranking-weight changes, global recommendations, BotFather/tunnel changes.

## HEADs

- telegram-media-feed final pushed HEAD: `a18e2748ab0893b40d29257691637fa51141a773`
- agent-memory final pushed HEAD: reported in the completing response (this commit).
