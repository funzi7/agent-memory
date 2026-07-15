# Telegram Media Feed — image-first same-node prime handoff

Date: 2026-07-15

## Repository state

- Application repository: `/root/work/telegram-media-feed`
- Application branch: `agent/fix-album-carousel-swipe`
- Verified takeover/base application HEAD: `9b55a24ac836892c5c1cddf6418f26388c94da9d`
- Pushed application HEAD: `6bfd191ff44558b42e94d397c91c0dade71049b6`
- Application upstream contains that exact commit and the application worktree was clean after push.
- Agent-memory repository: `/root/work/agent-memory`
- Agent-memory branch: `agent/fix-album-carousel-swipe`
- Verified parent agent-memory HEAD: `c2606408123550e0eb1b4a2cd2ff8f0bef6eab90`
- The exact pushed agent-memory commit cannot be written inside itself; it belongs in the completion response.

The takeover audit found no application commit newer than `9b55a24` on either the checked-out upstream or `origin/claude/personalization-telegram-auth-98x51m`. The known Claude agent-memory branch also contained no newer handoff commit beyond the previously identified completed history. No generated work was merged blindly.

## Physical baseline and remaining gap

Application build `9b55a24ac836892c5c1cddf6418f26388c94da9d` physically passed Android Telegram startup when the restored initial item was an ordinary video and passed every later tested ordinary-video transition. Later videos played while browser activation reported false, video → image → video worked, and the same `persistentPlayerNodeId` remained in use.

The only observed ordinary-video autoplay failure was image-first startup. In that case the persistent ordinary-feed node had never emitted its first genuine `playing` event, so the first later video could not use the already-unlocked-element path. Albums were not physically tested and have no physical pass/fail result.

## Implemented image-first session prime

- The feed still renders exactly one ordinary-feed `HTMLVideoElement`. No second/hidden unlock video, audio element, Web Audio context, synthetic click, unrelated sample, generated silent media, or placeholder source was added.
- Priming waits through the empty pre-feed render. Authentication, authorized feed loading, and restored progression must establish a visible ordinary single image before the one-shot decision is consumed.
- Candidate selection scans only forward from that image and chooses the nearest eligible ordinary single-video item already in the loaded feed. Images, albums, unavailable/hidden/deleted/unplayable rows, invalid identities/sources, and hosted-Bot-API oversized placeholders are skipped.
- An initial normal video uses the existing path and skips priming. An initial album also skips it. A feed with no eligible future candidate records one stable no-candidate decision. There is at most one automatic candidate/attempt per authenticated feed session.
- The existing source order is reused: already materialized and authorized memory Blob lease, then materialized persisted-cache Blob lease, then the authorized direct URL. The selected source is locked for the attempt; a late warm Blob cannot replace it.
- The controller installs `autoplay`, `muted`, `defaultMuted`, `playsInline`, and `preload=auto` properties/attributes before assigning the source once, then calls `play()` immediately in the authenticated bootstrap layout path.
- The stable absolute host stays mounted and connected. While priming it is `visibility:hidden`, pointer-inert, and never `display:none`, so it neither covers/intercepts the visible image nor creates a black frame or layout shift.
- Only a current-source/current-generation genuine `playing` event is authority. A resolved promise or elapsed timer cannot unlock the controller.
- Authoritative prime playing unlocks the same persistent node, issues one expected intentional pause, prevents recovery for that pause, rewinds to zero when metadata permits, hides the host, and marks the session complete.
- Prime media events have no visible item/post context. They cannot record watch time, last position, completion, feed progression, History, active-post changes, rail/control/spinner state, Like, share, or download activity.
- Reaching the exact candidate promotes the existing source at time zero with no `src` rewrite and no `load()`. Any late prepared lease for that same media is released rather than substituted.
- Reaching a different video invalidates hidden prime state and uses the same already-unlocked node for the requested viewing. A user arriving while the original prime is still pending promotes or replaces it generation-safely.
- Feed revalidation, restored-progression changes, candidate removal, viewer/account bootstrap changes, pagehide/visibility/WebApp deactivation, NotAllowedError, external AbortError, terminal media error, and stale events are bounded. A failed prime stays invisible, never marks the controller unlocked, and never loops.
- A queued intentional pause from an old prime operation cannot clear truthful playback after the same node has already started a newer source/viewing.
- Viewer/account re-bootstrap is tracked as a new authenticated feed session even when public identity type and token-presence shape do not change. Prepared leases and viewer-sensitive warm memory are released before the controller rebinds.

## Next-launch diagnostics

- The authenticated Menu now includes **Record next Mini App launch** and a cancel action.
- The only cross-launch value is the literal boolean `true` under one dedicated key. No report, identity, credential, URL, media value, or private content is persisted with it.
- On the next launch the flag is read and removed before capture starts. Consumption runs at client module initialization, before feed bootstrap, persistent-player creation, candidate selection, or prime attempt.
- The tested launch needs no diagnostics Start tap.
- Added safe events: `session-prime-candidate-selected`, `session-prime-attempt`, `session-prime-play-pending`, `session-prime-playing`, `session-prime-paused`, `session-prime-complete`, `session-prime-promoted`, `session-prime-cancelled`, `session-prime-failed`, and `session-prime-no-candidate`.
- Events retain only existing allowlisted scalar structure, including the same safe `persistentPlayerNodeId` and viewing/source generations. Existing 1,000-event, 40-media-identity, 10-minute, and approximate 500-KB report bounds and structural redaction are unchanged.

## Deterministic and browser coverage

The final deterministic suite passed **345/345**. New/extended coverage proves:

- nearest eligible future ordinary-video selection;
- album, oversized, unavailable, hidden, deleted, and unplayable skipping;
- exactly one ordinary player node and identical prime/visible node identity;
- genuine-playing unlock authority, intentional-pause suppression, and rewind;
- no watch/completion/progression/History or visible UI during prime;
- exact promotion without source assignment/load and different-video reuse;
- video-first no duplicate prime and stable no-candidate state;
- slow pending source retention and late-Blob non-replacement;
- one bounded invisible policy/Abort/terminal failure;
- viewer and lifecycle cancellation with lease release;
- stale prime playing/pause/promise events unable to mutate current playback;
- activation-false first-visible and 20 later transitions on one node;
- existing video → image → video, manual controls, watch accounting, anonymous denial, nonallowlisted denial, and album automation;
- next-launch flag ordering, clearing, playback inertness, and secret-free diagnostic export.

The tracked isolated suite `scripts/browser-check-session-prime.cjs` passed on task-owned loopback port 3001 with an element-scoped browser policy model:

- successful image-first prime;
- promise resolution alone did not unlock;
- activation remained false after the authoritative prime;
- exact first-visible promotion plus 20 later visible videos used one DOM node/id;
- zero post-unlock NotAllowedError;
- zero source-churn AbortError;
- policy-rejected prime made one attempt and exposed no control/spinner;
- video-first startup made no prime attempt.

The browser server was stopped and port 3001 released. Headless Chromium and the deterministic policy model do not prove Android Telegram acceptance.

## Validation completed

- `git diff --check` — passed.
- `npm test` — passed, 345/345.
- `npm run typecheck` — passed.
- `npm run build` — passed with `TMF_NEXT_DIST_DIR=.next-codex-prime`.
- A before/after metadata comparison proved the deployed `.next/BUILD_ID` did not change. The task-owned build directory was removed afterward.
- `TMF_BROWSER_PORT=3001 node scripts/browser-check-session-prime.cjs` — passed; its loopback server closed.
- The application commit was pushed by a normal fast-forward update; no force push was used.

## Documentation and deferred roadmap

README, TODO, project state, and release review now preserve these requirements without implementing them in this task:

- Build `9b55a24` physically passed video-first and all later tested ordinary transitions; image-first remained the sole ordinary failure.
- The new same-node prime is machine-validated but physical Android image-first acceptance remains pending.
- Albums retain automated behavior but remain physically untested. Native share, download, image zoom/pinch, oversized media, and network/session/failure-state physical acceptance also remain open.
- Final full acceptance is deferred until persistent VPS production with a fixed domain.
- Future **Copy link** means a stable internal app permalink to the current post and exact media item. It must not copy or prefer X, Twitter, Instagram, or another source URL. It is deferred until the fixed domain exists and must contain no token, initData, cookie, credential, media capability, or private query value; unauthorized/nonallowlisted viewers remain denied.
- Future per-user **Not interested in this topic right now** is a temporary topic snooze with a suggested 24-hour default, immediate Undo, early restore from Topics/settings, automatic reappearance on expiry, no deletion, and no effect on other viewers.
- Preserve 24-hour timestamps, explicit Owner/Admin separation, persistent VPS hosting, fixed domain, Telegram Local Bot API, and support for videos over 20 MB as future work.

## Required owner acceptance

After the owner deploys using only `tmfup`:

1. On the prior launch, choose **Record next Mini App launch** and restore to a single image with a later eligible ordinary video.
2. Force-close/reopen Telegram. Do not tap diagnostics Start on the tested launch.
3. Confirm recording started before one invisible candidate/attempt and the genuine-playing → intentional-pause → complete sequence on the stable node.
4. After activation reports false, reach the first visible video without pressing Play. It must start at time zero on the same node; exact promotion must show no source reattachment/load.
5. Continue through that video plus 20 later ordinary transitions, including image ↔ video. Require one node, automatic playback, zero post-unlock policy rejection, zero source-churn abort, and no Play flash.
6. Repeat close/reopen, Force stop, stored muted/unmuted, video-first no-duplicate-prime, and stable no-candidate behavior. Preserve a bounded report for any failure.
7. Do not claim a physical album pass from this ordinary-video run.

## Operational boundaries observed

- No deployment was performed. The owner deploys later with `tmfup`.
- Live port 3000 and the deployed process/build tree were not stopped, restarted, tested, or replaced.
- SESSION 1, Cloudflare/Quick Tunnel, webhook configuration, BotFather, and Telegram group content were untouched.
- No environment file, token, initData, cookie, private URL, database content, private media value, user identity, chat identity, caption, or file identifier was printed or copied into this handoff.
