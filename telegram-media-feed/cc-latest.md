# Telegram Media Feed — synchronous trusted-release autoplay handoff

Date: 2026-07-14

## Repository state

- Application repository checkout: `/home/user/telegram-media-feed` (task prompts may say `/root/work/telegram-media-feed`; the real path is under `/home/user`).
- Working branch: `claude/personalization-telegram-auth-98x51m` — fast-forwarded to contain everything from `agent/fix-album-carousel-swipe` up to `5cbfd4a346dd`, then extended with this round's commit. Pushes go to this branch; `agent/fix-album-carousel-swipe` was not modified.
- Verified starting application HEAD: `5cbfd4a346dd1119f8c7b6fed44a99697a294866` (the deployed build that failed physical acceptance).
- Verified starting agent-memory HEAD: `c2606408123550e0eb1b4a2cd2ff8f0bef6eab90` (merged into the personalization branch alongside this file's history).
- Final pushed HEADs are reported in the completion response; a commit cannot contain its own SHA.
- Both repositories were clean at their verified starting states. `.env.local`, secrets, BotFather, the tunnel, runtime SQLite, topic assets, SESSION 1, and the port-3000 deployment were untouched. This task did not deploy; the owner deploys with `tmfup`.

## Why this round existed — build 5cbfd4a physically FAILED

Two physical Android runs (Telegram 9.6, Chromium 149, ordinary single-video posts; albums untested):

1. After closing and reopening the Mini App, the FIRST visible video autoplayed correctly (it inherited transient activation from opening/interacting with the Mini App).
2. Every SUBSEQUENT vertical video briefly showed prepare/loading but did not start; manual Play remained required.

The captured diagnostic proved for the failed item (media 1457): declarative attributes correctly installed (`autoplayAttribute/defaultMuted/muted/playsInline` all true), memory-Blob source, `readyState=4`, the full 12.31s range buffered — and the source was attached only AFTER final settlement while `userActivationIsActive=false`. Declarative playback never began; the one declarative-fallback `play()` rejected immediately with muted `NotAllowedError` (`policyBlockedGeneration=2` latched). Later, a genuine user action restored activation, but the feed recovery repeatedly emitted `trusted-recovery-suppressed` `reason=candidate-not-eligible` for the already-current settled blocked video — the recovery gate was wrong. The trace also showed an OUTGOING video (`active=false`) receiving internal-pause recovery, an owner claim, another play attempt, and actual `playing` — an outgoing video must never reclaim ownership.

Architectural root cause: the critical work ran too late. Activation is live during the vertical swipe, but target configuration and source attachment waited for the settle debounce/scroll-snap completion — by then activation had expired and Telegram Android rejected even muted, fully buffered playback. The old provisional path could not compensate: it was gated on a previous policy block, its eligibility check rejected the already-current settled blocked item, and it raced outgoing internal-pause recovery.

## Implemented architecture (this round)

### Primary synchronous trusted-release path (`app/feed-page.tsx` `handleTrustedFeedRelease`)

Runs in the CAPTURE phase of trusted `pointerup`/`touchend` on the feed surface — before React updates, settlement, menu handlers, or click logic — on EVERY ordinary vertical transition, with NO requirement for a prior `NotAllowedError`, policy latch, `policyBlockedGeneration`, failed declarative attempt, or previous successful video. Gates: `event.isTrusted`; document visible; Telegram WebApp not deactivated; the gesture did not begin on a scrubber/menu/dialog/photo-viewer/form field (`isExemptVerticalReleaseTarget`). Important nuance: a vertical swipe that merely STARTS over a button — including the full-viewport `.video-tap-target` — is feed scrolling and stays eligible; TAPS on any control (`isExemptFeedControlTarget`: buttons, links, scrubber, menu, dialogs, inputs) never enter the trusted path and keep their own handlers.

Inside the same synchronous trusted task, in order:

1. `resolveVerticalReleaseTarget` (`lib/video-autoplay.ts`, pure) computes the deterministic final snap target from `startScrollTop` (gesture start), current scrollTop, viewport height, item count, signed finger travel, and release velocity. Past-midpoint honors actual position; ≥ max(48px, 12% viewport) travel or ≥0.5 px/ms same-direction velocity advances exactly one post (the feed uses `scroll-snap-stop: always`); below-threshold keeps the current post; edges clamp.
2. The matching `element.scrollTo({top: targetIndex*height, behavior:"smooth"})` is issued, so the provisional target IS the settled target by construction. `pendingTrustedSnapRef` records it; `settleFeedPosition` defers geometry settlement while that snap is in flight (bounded by `TRUSTED_SNAP_SETTLE_TIMEOUT_MS=1500`) — this fixed a real race where the cancelled native fling emitted an early `scrollend` that settled a midpoint back to the outgoing post and reverted the target.
3. `setSharedVideoAutoplayPlaybackTarget(targetMediaId)` atomically revokes a mismatched owner (pause before any new play work) and commits the target.
4. `flushSync(setTrustedProvisionalPlayback({postId, mediaId}))` mounts/configures the target synchronously: React layout effects install `autoplay/muted/defaultMuted/playsInline`, configure coordinator/group, and attach the synchronously available source — prepared warm Blob first, otherwise the authenticated direct URL locked for the viewing via `trustedDirectSourceKeyRef` (a late Blob cannot replace it).
5. `recoverSharedVideoAutoplayFromTrustedGesture(mediaId, gesture, {allowPendingDeclarative:true})` → coordinator `startAttempt` → `video.play()` is invoked synchronously BEFORE the handler returns. No `await`/promise/rAF/timer/effect sits between the trusted event and the play call (source-asserted in tests).

Settlement then confirms the same provisional target without restarting it (sameView configure; source/generation untouched) or atomically invalidates it for a genuinely cancelled gesture; `provisional-confirmed`/`provisional-invalidated` are recorded.

### Group-level target arbitration (`lib/video-autoplay.ts`)

`VideoAutoplayPlaybackGroup` now keeps: a registered member per mounted media key (`registerMember`/`unregisterMember`, synced in coordinator `configure`/`destroy`); an authoritative `targetMediaKey` (`setPlaybackTarget`, committed synchronously at trusted release, settlement, progress restoration, cache restore, feed reset, carousel media change; cleared on feed unmount); and `allowsPlayback` as the single authoritative predicate. Consequences:

- `claim()` refuses a non-target member (traced `owner-claim-rejected`, and a non-paused claimant is paused) — a stale/outgoing video can never displace the owner, even when its play promise resolves late.
- `shouldPlay`/`staleReason` fail for non-targets (`replaced-by-active-video`), so readiness retries, internal-pause recovery, and stale `playing` events die the moment the target moves. Internal-pause recovery armed during an in-flight attempt is dropped by the post-attempt `shouldPlay` recheck.
- `recoverFromTrustedGesture(mediaKey, …)` resolves the member BY MEDIA KEY through the registry (recovery-candidate pointer only as fallback) and requires `allowsPlayback` — the already-current settled policy-blocked video is always addressable and retries once per source generation on the next genuine trusted interaction (release or click). `candidate-not-eligible` is now emitted only for a genuinely unaddressable key.
- `allowPendingDeclarative` no longer requires `mutedPolicyBlockObserved` — the primary path exists to PREVENT the policy failure. Without the flag (plain clicks), a non-blocked generation still cannot use the trusted path. `shouldPromoteTrustedSnapCandidate` was removed.

### Preserved semantics

Fresh-open first video: declarative autoplay + bounded coordinator fallback unchanged (opening activation still helps). Manual Play immediate; explicit Pause durable for its viewing and never overridden by a same-post below-threshold release; navigating to another post is a new viewing that may autoplay. Mute preference separate from forced-muted startup; scrub/speeds/fullscreen/share/download/source-link/progression/watch-completion unchanged. Center control: loading only while a real attempt pends, Pause only after accepted `playing`, stable Play after a policy rejection, no flash, no stale spinner.

### Diagnostics (secret-free, structural redaction unchanged)

New allowlisted events: `trusted-release-entered`, `trusted-release-target`, `trusted-release-play`, `provisional-confirmed`, `provisional-invalidated`, `owner-claim-rejected`. New fields: integer `gestureId` (per-gesture correlation), `gestureProgressPercent` (rounded percent-of-viewport, −1000..1000), `gestureVelocity` (rounded px/ms, clamped ±50), `playCalledBeforeReturn`, `sourceReadyBeforePlay`. New safe reasons include the target-selection reasons (`past-midpoint`/`distance-threshold`/`velocity-flick`/`below-threshold`) and `not-playback-target`. No coordinates, URLs, tokens, or private values are exported.

## Validation performed (isolated; port 3000 untouched)

- `git diff --check`, `npm run typecheck`, `npm run build` clean; `npm test` **307/307** (14 new tests in `tests/trusted-release.test.ts`: atomic target commit/owner revocation; no-prior-block primary path; play called synchronously before the caller continues; activation expiry after start; 20 consecutive trusted transitions with exactly one owner; one attempt per gesture+generation; untrusted/no-activation rejection; current-blocked recovery by media key with no candidate change; registry-independent eligibility; outgoing retry/claim/restart prevention; internal-pause cancellation on target change; durable manual Pause under a same-post release; unregistered-key handling; `owner-claim-rejected` tracing. Rewrote the obsolete "pending declarative disabled until block" and `shouldPromoteTrustedSnapCandidate` tests; added the deterministic `resolveVerticalReleaseTarget` matrix; updated `tests/feed-video-declarative.test.ts` source-order assertions to the new release path incl. the no-async-between-commit-and-play check and the pending-snap settle guard).
- New browser suite (session scratchpad `tmf-validate-r5/browser-check-6.mjs`, prod build on port 3001, fresh seeded DB of 24 single-video posts + 1 image, CDP trusted touch swipes): **19/19**, repeated across multiple clean stop→reseed→start cycles (`run-cycle.sh`). The Telegram-policy simulation defeats declarative autoplay entirely (autoplay property/attribute no-ops) and rejects `play()` with `NotAllowedError` unless invoked synchronously inside a trusted input task (window-capture listeners + `setTimeout(0)` reset), with a bounded opening-activation window. Proven: fresh-open first video plays with no gesture; 20 consecutive vertical transitions each begin from a synchronous trusted-task `play()` with the source already attached; **zero** `NotAllowedError` across the run (no prior latch needed — the failure is prevented); exactly one video plays at every check; playback survives activation expiry; no outgoing restarts; with no opening activation the first video blocks → stable Play control, no stale spinner → untrusted synthetic events and menu interactions start nothing → one genuine below-threshold trusted gesture recovers it without a Play press and stays on the post; plain-browser token flow intact; anonymous `/api/feed` 401; non-allowlisted 403 + Access-denied screen, no token form; no client error portal.
- Suite-development finding worth keeping: an early `scrollend` from the cancelled native fling could fire settlement mid-programmatic-snap and revert the target to the outgoing post (observed as one non-trusted rejected fallback play on the reverted post). Fixed in app code with `pendingTrustedSnapRef` deferral (above). A residual harness artifact remains: CDP synthetic touch streams occasionally arrive with early moves coalesced away, so the app measures sub-threshold travel and correctly keeps the current post; the suite re-issues the gesture in that case (real fingers do not lose their move stream).

## NOT validated / honest limitations

- **Real Telegram on a physical Android device was NOT exercised** — headless Chromium with a simulated policy cannot prove Android Telegram acceptance. The 15-step, 20-video no-Play physical plan in `TODO.md`/`docs/PROJECT_STATE.md` remains the release gate. Do not report autoplay accepted until it passes.
- **Albums remain physically untested** (automated album semantics retained; no pass/fail claim).
- **Port 3000 still runs the failed build `5cbfd4a` until the owner deploys with `tmfup`.** The tunnel and SESSION 1 were untouched.
- `tmfup` deploys the CURRENT checked-out branch of the owner's live checkout (fast-forward from the same-name remote branch). This round pushed to `claude/personalization-telegram-auth-98x51m`; if the live checkout sits on `agent/fix-album-carousel-swipe`, the owner must check out/merge the pushed branch (it is a strict superset of `5cbfd4a`) before `tmfup`, or merge it into that branch themselves.

## Next-step candidates

1. Owner deploys, force-stops Telegram, reopens, starts a clean Autoplay diagnostics capture, and runs the exact 20-video plan (never pressing Play), repeating after reopen, Force stop, muted preference, and unmuted preference; on any failure wait 2–3 s and export the report. `gestureId`-correlated `trusted-release-*` events plus `trusted-recovery-*`/`owner-claim-rejected` reasons pinpoint the failing stage.
2. Albums: separate later physical test.
3. Deferred backlog unchanged (Local Bot API Server >20MB, ffmpeg, MTProto fallback only if bot-to-bot delivery stops, browser query-token removal, Postgres).

## Environment notes for the next agent

- Tests: `npm test` (tsx --test; CJS, no top-level await). Playwright: import `/opt/node22/lib/node_modules/playwright/index.mjs`, chromium at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`; trusted swipes via `context.newCDPSession(page)` + `Input.dispatchTouchEvent`; media stubs must serve byte-range 206s; simulate Telegram by intercepting `https://telegram.org/js/telegram-web-app.js` with signed initData (fake bot token `123456:TEST-FAKE-BOT-TOKEN-for-validation`).
- Validation DB seeding: run the seed script from the repo cwd (migrations resolve relative paths); reseed between suite runs or per-user feed progress resumes mid-feed and shrinks the visible feed (this produced misleading "0 playing" runs during this task).
- `run-cycle.sh` in the scratchpad `tmf-validate-r5/` does stop→reseed→start→run in one shot.
