# telegram-media-feed handoff

Updated: 2026-07-18 UTC

## Repository state

- Branch: `agent/fix-album-carousel-swipe`
- Task starting application HEAD: `28d6e46999e868039492a6d6ce4bbf8a1be54be6`
- Task starting agent-memory HEAD: `6ada4e258fa30109972ae3b9d9ae7ef457476ad7`
- Pushed application HEAD: `6222ee4f9d30d8a1ca930d8feb3b4a1e430908b2`
- Application commit: `feat: improve media rail and video warming`
- The exact pushed agent-memory HEAD is reported in the completion response because this file cannot contain the SHA of its own commit.
- The task did not deploy and made no infrastructure changes. Port 3000, SESSION 1, Cloudflare, webhook configuration, BotFather, `.env.local`, and Telegram source content were not changed.

## Recovered interrupted work

The phone powered off with substantial uncommitted work. The surviving tracked diff and untracked files were inspected in place against the expected application baseline, along with both repositories and the previous handoff. Nothing was reset, cleaned, restored, stashed, overwritten, moved to another checkout, or force-pushed. Final review found no duplicated or incomplete production blocks; it did catch one persistent-rail cleanup race left in the partial tree, fixed by capturing the exact post adapter used for setup and clearing that same adapter during effect cleanup.

## Transparent persistent action rail

- Images and videos share one left rail in the exact Like, Share, Mute, Fullscreen, Menu order; irrelevant video controls are omitted without placeholders.
- Idle controls have transparent backgrounds and no permanent backdrop/opaque circle. Every target is 48×48, icons are white with subtle contrast shadows, keyboard focus and press states are visible, and the liked heart is red.
- The rail remains independently visible when transient playback controls auto-hide. Pointer ownership outside its buttons stays transparent.
- Existing Like, Telegram share/action sheet, download, mute, fullscreen, and menu handlers remain wired to the settled item. Telegram identity/client-capability checks, browser download credentials, owner-link gates, server authorization, and permission-based omission are unchanged.
- Deterministic source/CSS coverage preserves vertical feed swipes, horizontal album swipes, image opening, double-tap Like, both ordinary/album scrubber paths, and the active-item action boundary. Persistent adapter setup/cleanup is also regression-covered.

## Settlement-gated next-video warming

- Warm planning starts only after the current post has settled for playback, before the next swipe.
- Priority roles are bounded and explicit: current 0; active-playing album siblings 1; nearest likely next ordinary single video 2; farther directional candidates 3; previous candidate 4.
- At most two downloads run concurrently. Obsolete queued/unfinished work is cancelled, a replaced next target is cancelled, and retained lower-priority background work (including a role-null task) can be preempted and resumed behind the urgent target. Rapid A→B→A creates fresh work instead of reusing a cancelled promise.
- The active album keeps priority and cold current ordinary playback stays on the direct range-capable path. Prepared-source observation performs only authorized reuse checks, starts no storage/network work, and does not cancel the canonical warm GET on a negative HEAD.
- A late cache completion may remain available for a later viewing but never replaces the current persistent viewing's locked source. Preloading creates no player, assigns no current source, calls no `play()`, and initiates no autoplay/policy retry.
- Existing memory/storage/entry limits, deduplication, pin/release behavior, synthetic secret-free cache keys, and live authorization/visibility revalidation remain intact.

## Delayed spinner and safe timing diagnostics

- Ordinary, album, and persistent-player loading use a generation-scoped 300 ms delay. Fake-clock coverage proves hidden through 299 ms, visible at 300 ms, and no fast-playback flash.
- Authoritative `playing`, stable Play after policy rejection, terminal failure, explicit Pause/ended where applicable, leaving the current viewing, and viewing/source-generation changes clear pending or visible loading state.
- Warm priority/lifecycle and source/spinner timing diagnostics are observational, structurally allowlisted, safely clamped, and bounded by the existing report limits. They retain no source URL, token, file id, media content, request object, or arbitrary error.

## Operations documentation

`docs/TERMUX_RUNBOOK.md` now provides copy-paste phone/Termux restart, wake-lock, PRoot Debian, SESSION 1 server/tunnel, SESSION 2 Codex YOLO, `tmfup`, local/public health, both BotFather URLs, webhook update/check, changed-Quick-Tunnel recovery, port-3000/stale-Next diagnosis, dirty-worktree preservation, and forbidden destructive-command procedures. URL-dependent blocks fail closed when no current tunnel URL is found, and the no-tunnel `tmfup` form explicitly overrides any stale configured public URL. README links the runbook.

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

The deterministic suite passed **410/410**. In addition to the retained Android/autoplay coverage below, it proves the transparent-rail visual/action/gesture/permission contract, captured persistent-rail cleanup, settlement-gated warm priorities, maximum-two concurrency, stale-work cancellation/preemption, authorization-preserving prepared reuse, late-source lock protection, playback-inert preloading, the complete delayed-spinner transition matrix, and bounded safe timing diagnostics. Retained coverage proves:

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

The isolated port-3001 browser suite passed three clean final-source runs. Each run covered Android startup override plus real backward navigation, stable Play after injected policy rejection with no readiness retry, same-node/source synchronous trusted recovery, excluded-control guards, continuous-bridge regressions, and 21 viewings. Every run released its process and port.

## Validation status

- `git diff --check` — passed.
- `npm test` — passed, 410/410.
- `npm run typecheck` — passed.
- `TMF_NEXT_DIST_DIR=.next-codex-rail-warm-final npm run build` — passed.
- Three clean `TMF_BROWSER_PORT=3001 node scripts/browser-check-session-prime.cjs` runs — passed.
- The live `.next/BUILD_ID` checksum remained `08650f3057b85b0dc837c225d6b5ac87b0367ce72c79a7ab93ceb5653a76ba9a`. Next-generated type references were restored exactly and the task-owned build directory was removed.
- Application commit was pushed normally to its tracking branch; no force push was used.

Headless and deterministic validation cannot establish Telegram Android media policy. Physical Android acceptance remains pending, and video/mixed albums remain physically untested.

## Remaining owner work

- After an explicit owner deployment, confirm Android Telegram starts visibly on the nearest eligible ordinary video when restoration lands on an image, then scroll backward and confirm the image remains present and unpassed.
- Exercise a later source replacement that policy-rejects. Require immediate stable Play, no readiness retry/Pause flash, zero response from excluded controls, and one handler-time `play()` from the active video surface or explicit Play control on the same node/source.
- Repeat later ordinary-video transitions and separately test video/mixed albums; no physical album result is currently claimed.
- On images, ordinary videos, and albums, physically inspect rail contrast/obstruction and exercise every action plus vertical/horizontal swipes, image opening, double-tap, and scrubber interactions.
- Under fast and throttled networking, confirm nearest-next warming starts after current settlement but before swipe, preserves album priority, causes no player/source/play/autoplay churn, and that Loading neither flashes on fast playback nor survives any terminal/current-viewing transition.
