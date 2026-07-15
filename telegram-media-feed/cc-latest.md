# telegram-media-feed handoff

Updated: 2026-07-15 UTC

## Repository state

- Branch: `agent/fix-album-carousel-swipe`
- Task starting application HEAD: `6bfd191ff44558b42e94d397c91c0dade71049b6`
- Task starting agent-memory HEAD: `48b14bcec7271f12c97fdf701c7d58a7815b928c`
- Pushed application HEAD: `d80b8a6507a36183636e486d73e1fbc15a4a73b8`
- Application commit: `fix: bound persistent prime rewind`
- The exact pushed agent-memory HEAD is reported in the completion response because this file cannot contain the SHA of its own commit.

## Physical Android evidence that triggered this fix

Application build `6bfd191ff445` failed the image-first acceptance run on Android Chromium 149. The visible initial post was an image and the session used one player node, `persistent-player-1`.

- At about 1.080 seconds the application created the persistent player, selected the nearest future ordinary-video prime candidate, attached one `authenticated-direct` source, and called muted `play()`. Its promise stayed pending while the source loaded.
- At about 4.458 seconds, approximately 3.38 seconds later, hidden priming itself succeeded: the node genuinely played, emitted the session-player unlock, intentionally paused once, and marked the prime complete.
- The completed-prime readiness path then repeatedly assigned `currentTime = 0`, including when playback time was already zero.
- Chromium emitted recursive `seeking` → `seeked` → `canplay` cycles. Approximately 76 cycles occurred in about 245 ms.
- The diagnostic reached 310 events, `truncated=true`, and `stopReason=max-report-bytes`.
- The first visible user transition was absent because the readiness storm filled the report first.

This proves the hidden unlock was successful. The regression was the controller's redundant zero-reset recursion, not failed priming or missing media readiness.

## Implemented fix

`lib/persistent-player.ts` now owns a bounded reset operation scoped to the prime media id/version and source/viewing generations. Its explicit state distinguishes not requested, metadata wait, existing-seek wait, seek issued, complete, and cancelled.

- A genuine current-generation hidden-prime `playing` deterministically unlocks the node, marks the pause expected, pauses once, marks the prime complete, and then requests the reset.
- Missing metadata records a pending reset without assigning playback time.
- `video.seeking === true` prevents an assignment.
- `|currentTime| <= 0.01` completes as already zero with no assignment.
- A necessary rewind marks `seek-issued` synchronously before the one permitted `currentTime = 0` assignment.
- The matching authoritative `handleSeeked` completes only a reset that actually issued a seek. Duplicate or stale events never assign again and normal user scrubbing cannot create a reset.
- Generic metadata/data/canplay/canplaythrough/progress/duration readiness may advance a pending pre-assignment state but cannot reissue an issued/completed/cancelled reset.
- A throwing playback-time assignment cancels the operation without retry or timer loop.
- A different video, source failure, viewing end, viewer change, cancellation, or detach invalidates the old reset. Stale old-source seek events cannot mutate a newer viewing.

Promotion races are explicit:

- Exact promotion while the hidden `play()` remains pending changes that same viewing to visible. It retains the same HTMLVideoElement, source, and pending request, makes no second attempt, performs no hidden pause/reset, and treats the later `playing` as `persistent-playing`.
- Exact promotion after an already-zero completed prime starts visible playback immediately on the same source/node.
- Exact promotion while the sole rewind is in flight waits for matching `seeked`, then calls visible play exactly once. It never issues a second seek.
- A different visible video cancels the prime/reset and performs the ordinary one-source transition while retaining an already-unlocked node.
- A late hidden play-promise settlement cannot clear a newer same-source visible attempt.

The hidden image remains unchanged with no player UI, spinner, black frame, controls, or layout shift. Pending/rewind promotion can truthfully show Loading until authoritative visible playback. Watch/completion/progression/History and Like/share/download accounting remain zero during hidden prime and begin only after authoritative visible `playing`.

## Diagnostic hardening

`lib/autoplay-diagnostics.ts` now coalesces structurally identical high-frequency observations including metadata/data readiness, progress, timeupdate samples, canplay/canplaythrough, waiting/stalled, seeking, and seeked.

- The first event is retained.
- Materially changed safe state is retained.
- A bounded time/count sample is retained.
- Omitted repetitions are represented by `diagnostic-events-coalesced` with an allowlisted event name and safe suppressed count.
- Authoritative player unlock/prime/promotion/playing, policy/source failure, trusted-release, and active-transition events remain present after a synthetic storm.
- New safe reset traces cover pending metadata, already-zero skip, seek issued, completion, cancellation, and stale reset events.
- Coalescing is recorder-only and cannot affect playback timing or media state.

## Automated coverage

The deterministic suite now covers the requested reset and race matrix: zero versus one assignment, every readiness no-op, existing seek, failed assignment, synchronous `seeking`/`seeked`/`canplay` recursion, at most one seek cycle, 20 repeated canplay events, authoritative and duplicate seeked, pending/completed/rewind promotion, different-video cancellation, stale old-source seeked, stable node/source identity, no hidden consumption, visible accounting only after playing, diagnostic coalescing/authoritative retention, and a bounded 1,000-event storm. Existing image/video/20-video transitions, manual controls, anonymous/nonallowlisted denial, and album automation remain passing.

Isolated browser coverage on task-owned port 3001 includes:

- Scenario A: an Android-style playback-time assignment synchronously emits `seeking`, `seeked`, and `canplay`. Already-zero produces zero assignments; nonzero produces exactly one assignment and one seek cycle. Repeated readiness produces no recursion, and the diagnostic remains untruncated.
- Scenario B: exact pending prime promotion retains the node/source/promise, reveals the host, and turns later `playing` into visible playback without hidden pause/reset.
- Scenario C: promotion during the one issued rewind waits for one `seeked` and starts visible playback once.

## Validation completed

- `git diff --check` — passed.
- `npm test` — passed, 357/357.
- `npm run typecheck` — passed.
- `TMF_NEXT_DIST_DIR=.next-codex-prime-reset npm run build` — passed.
- A before/after checksum confirmed the deployed `.next/BUILD_ID` was unchanged. Next-generated type-file edits were returned to their exact original form and the task-owned build directory was removed.
- `scripts/browser-check-session-prime.cjs` — passed three consecutive clean runs on port 3001. The suite found no client error portal, no infinite media-event loop, and no synthetic `max-report-bytes` truncation. Port 3001 was released afterward.
- The application worktree was clean after commit, push succeeded, and local HEAD matched the tracking branch at `d80b8a6507a36183636e486d73e1fbc15a4a73b8`.

These are deterministic/headless results, not physical Telegram Android acceptance.

## Remaining owner work and boundaries

- The owner deploys afterward with only `tmfup`; this task did not deploy.
- Physical Android image-first acceptance remains pending. The next report must show either already-zero/no seek or one issued/completed seek, no readiness recursion/truncation, and retain the first visible transition. Pending and rewind-in-flight promotions should also be observed if naturally reproducible.
- Continue through the first visible video plus 20 later ordinary-video transitions on the same node without pressing Play.
- Albums retain automated behavior but remain physically untested; no physical album result is claimed.
- VPS/fixed-domain production and Local Bot API/large-media work remain later phases.
- Live port 3000, SESSION 1, Cloudflare, webhook configuration, BotFather, the deployed server, and source Telegram content were untouched.
