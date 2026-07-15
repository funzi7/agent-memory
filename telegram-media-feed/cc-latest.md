# telegram-media-feed handoff

Updated: 2026-07-15 UTC

## Repository state

- Branch: `agent/fix-album-carousel-swipe`
- Task starting application HEAD: `e7e1569e98498c946db32e31c73e6bf6cf90d8b8`
- Task starting agent-memory HEAD: `fa5817bc6aec7ff31a4868c442d8ff0ac7d78643`
- Pushed application HEAD: `28d6e46999e868039492a6d6ce4bbf8a1be54be6`
- Application commit: `fix: add Android video-first recovery fallback`
- The exact pushed agent-memory HEAD is reported in the completion response because this file cannot contain the SHA of its own commit.
- The task did not deploy and made no infrastructure changes. Port 3000, SESSION 1, Cloudflare, webhook configuration, BotFather, `.env.local`, and Telegram source content were not changed.

## Physical Android result carried into this task

Application build `e7e1569e9849` physically proved the continuous hidden-to-visible exact-promotion path:

- the primed video remained physically playing;
- promotion made one seek while playback continued;
- the same persistent player node and locked source became visible and continued playback.

That result also established the remaining platform limit. The next source replacement on the same `HTMLVideoElement` was rejected with `NotAllowedError`, and the rejection repeated for authenticated-direct, cache-Blob, and memory-Blob sources. Later real interactions reported `navigator.userActivation.isActive=true`, but that build made no synchronous recovery `play()` call. Its automatic visible attempt also caused a brief Play/Pause-state flicker when policy rejected it.

## Implemented bounded Android workaround

Authenticated Telegram Android, non-topic sessions now apply a narrow startup override only when the restored/initial item is one valid ordinary image and a later eligible ordinary single video exists.

- The session begins visibly on the nearest eligible ordinary video.
- Canonical feed order is unchanged. The skipped image remains at its original index, is not hidden, completed, passed, viewed, or written as progression, and is reachable with normal backward scrolling.
- Albums, including a one-active-member media group, are never initial-image or target-video candidates. Oversized/unavailable videos, hidden/deleted posts, invalid media, and non-ordinary shapes are also excluded.
- Browser, iOS, desktop, non-Telegram, topic, ordinary video-first, album-first, and no-candidate behavior remain unchanged.
- Hidden priming is held while the fresh canonical decision is made and does not run when the override applies.
- A safe `android-startup-override-applied` diagnostic records only structural identifiers and an allowlisted reason, with no source URL, credentials, platform identity, or media content.
- The persistent-player and one-locked-source architecture remain intact.

## Trusted policy recovery and stable Play

For a policy-rejected currently visible video, only a genuine trusted interaction on the active video surface or explicit Play control with `navigator.userActivation.isActive === true` may recover playback.

- The event handler calls `play()` synchronously before returning, once per physical interaction/current source generation, on the same loaded node and source.
- Accepted `playing` restores visible reusable playback state. Another rejection immediately returns to bounded stable Play.
- Menu, Like, Share, Download, Copy link, Mute, Fullscreen, diagnostics, scrubber, playback speed, and navigation controls are recovery-inert.
- Album/per-item playback also fails closed: a policy rejection cancels any delayed single-tap action, generic delayed Play cannot clear the policy latch, and only the synchronous trusted path can recover it.
- Muted visible `NotAllowedError` immediately stops Loading, never displays a Pause flash, keeps the source loaded, and suppresses automatic retries from `loadedmetadata`, `loadeddata`, `canplay`, `canplaythrough`, `progress`, other readiness signals, or stale queued `playing` events.

## User-visible timestamps

Feed and History timestamps now use local 24-hour time with no AM/PM. Existing date and relative-date behavior, stored/API timestamps, ordering, timezone interpretation, and persistence semantics are unchanged.

## Deterministic and browser coverage

The deterministic suite passed **381/381**. Coverage proves:

- Android Telegram image-first startup chooses the nearest eligible ordinary video;
- the skipped image stays unpassed, progression-free, canonically ordered, and backward-reachable;
- hidden priming does not run on the override path;
- browser, iOS, desktop, non-Telegram, video-first, albums, unavailable/invalid media, and topic feeds remain unchanged;
- visible `NotAllowedError` produces stable Play without a readiness retry loop or Pause flash;
- trusted active-video/Play interaction calls `play()` synchronously once per interaction/source generation;
- every excluded control remains inert;
- successful recovery restores reusable state and failed recovery stays bounded;
- delayed album taps cannot bypass a policy latch;
- feed and History use 24-hour formatting.

The isolated port-3001 browser suite passed three clean runs. Each run covered Android startup override plus real backward navigation, stable Play after injected policy rejection with no readiness retry, same-node/source synchronous trusted recovery, excluded-control guards, continuous-bridge regressions, and 21 viewings. Every run released its process and port.

## Validation status

- `git diff --check` — passed.
- `npm test` — passed, 381/381.
- `npm run typecheck` — passed.
- `TMF_NEXT_DIST_DIR=.next-codex-android-final npm run build` — passed.
- Three clean `TMF_BROWSER_PORT=3001 node scripts/browser-check-session-prime.cjs` runs — passed.
- The live `.next/BUILD_ID` checksum remained unchanged. Next-generated type references were restored exactly and the task-owned build directory was removed.
- Application commit was pushed normally to its tracking branch; no force push was used.

Headless and deterministic validation cannot establish Telegram Android media policy. Physical Android acceptance remains pending, and video/mixed albums remain physically untested.

## Remaining owner work

- After an explicit owner deployment, confirm Android Telegram starts visibly on the nearest eligible ordinary video when restoration lands on an image, then scroll backward and confirm the image remains present and unpassed.
- Exercise a later source replacement that policy-rejects. Require immediate stable Play, no readiness retry/Pause flash, zero response from excluded controls, and one handler-time `play()` from the active video surface or explicit Play control on the same node/source.
- Repeat later ordinary-video transitions and separately test video/mixed albums; no physical album result is currently claimed.
