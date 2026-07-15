# telegram-media-feed handoff

Updated: 2026-07-15 UTC

## Repository state

- Branch: `agent/fix-album-carousel-swipe`
- Continuous-bridge task starting application HEAD: `d80b8a6507a36183636e486d73e1fbc15a4a73b8`
- Continuous-bridge task starting agent-memory HEAD: `6b58362f14768ab9ca647ba25fb3db8fddf2c776`
- Pushed application HEAD: `e7e1569e98498c946db32e31c73e6bf6cf90d8b8`
- Application commit: `fix: keep primed video playing through promotion`
- The exact pushed agent-memory HEAD is reported in the completion response because this file cannot contain the SHA of its own commit.
- This task does not deploy. Live port 3000, SESSION 1, Cloudflare, webhook configuration, BotFather, and Telegram source content remain outside its scope.

## Physical Android evidence that triggered this fix

Build `6bfd191ff445` proved that the image-first hidden candidate could genuinely play, but its pause/reset path repeatedly assigned `currentTime = 0`. Android Chromium recursively emitted `seeking` → `seeked` → `canplay`, filling and truncating the diagnostic report before the first visible transition.

Application build `d80b8a6507a36183636e486d73e1fbc15a4a73b8` fixed that seek loop, but **still failed physical Android image-first acceptance**:

- the real hidden candidate successfully played on the persistent node and locked source;
- the application paused that successful playback;
- exact later promotion called muted `play()` again on the same node/source;
- Android rejected that later call with `NotAllowedError`.

Stable node and source identity therefore do not make pause-and-replay safe. The successful hidden request must remain physically playing through promotion. Physical Android acceptance of the replacement remains pending.

## Current implementation: continuous hidden-to-visible bridge

`lib/persistent-player.ts` retains exactly one session-scoped `HTMLVideoElement` and one locked source per viewing.

- On image-first startup, the nearest eligible real ordinary video starts muted, connected, hidden, and looped on that persistent node.
- Genuine hidden `playing` records that the bridge is physically running, but does not pause, reload, replace `src`, seek, call `play()` again, or set reusable/unlocked state.
- While hidden, the normal visible item/post context stays absent. Watch time, last position, completion, feed progression, History, Like/share/download activity, controls, rail state, spinner, and other visible UI remain unchanged.
- Exact promotion disables `loop` and keeps the same node, source, viewing, and original request.
- If the original request is still pending, promotion makes no second `play()` call; its eventual `playing` belongs to the visible viewing.
- If the bridge is already playing within the zero epsilon, it reveals directly with no `play()`, `pause()`, `load()`, source assignment, or seek.
- If the bridge is already playing above zero, it assigns `currentTime = 0` exactly once while playback continues, waits for the matching authoritative seek completion, then reveals. Readiness, duplicate, and stale events cannot reissue the seek.
- Reusable/unlocked state is set only after actual visible playback is confirmed. Hidden playing alone is insufficient.
- A visible muted `NotAllowedError` clears reusable/unlocked state, exits Loading, and shows Play. One bounded trusted active-media recovery remains available without node/source churn.
- Lifecycle suspension/teardown and a transition to a different video disable looping. Different-video playback then follows the existing one-source transition, with stale bridge events ignored.
- Stable DOM identity, source locking/failover rules, explicit Pause/manual Play, mute preference, ownership/generation guards, albums' separate coordinator, viewer/account teardown, and access control remain preserved.

## Deterministic coverage

The final suite passed **363/363** and proves all of the following:

- hidden bridge playback never pauses after genuine `playing`;
- the hidden bridge remains muted and looped;
- hidden `playing` alone does not set `isUnlocked()`;
- pending exact promotion makes no second play call;
- already-playing-at-zero promotion makes no play, pause, load, source assignment, or seek;
- nonzero promotion performs one seek while still playing;
- visible confirmation establishes reusable/unlocked state;
- visible muted `NotAllowedError` clears reusable/unlocked state and shows Play;
- lifecycle and different-video transitions disable looping;
- hidden playback records zero watch/completion/progression/History/action consumption;
- exactly one player and one locked source remain;
- manual controls remain correct;
- anonymous and validly signed nonallowlisted viewers remain denied.

## Isolated browser coverage on port 3001

`scripts/browser-check-session-prime.cjs` covers four isolated scenarios in fresh browser pages:

- **A — continuous exact promotion:** hidden muted/looped playback continues to a zero-time reveal without pause/replay/load/seek/source churn, then visible confirmation unlocks reuse.
- **B — pending promotion:** promotion retains the original pending node/source/play request and makes no second call before visible `playing`.
- **C — one-seek promotion:** a nonzero continuously playing bridge disables loop, seeks once while still playing, and reveals only after matching seek completion.
- **D — rejection and recovery:** visible muted policy rejection clears reusable state and shows Play; one trusted active-media interaction recovers the same loaded node/source.

Three clean task-owned port-3001 suite runs passed, each covering all four scenarios. The runs found no client error portal, duplicate player/source, hidden consumption, or authorization regression, and released their process/port afterward.

## Validation status at this handoff revision

- `npm test` — passed, 363/363.
- `npm run typecheck` — passed.
- Browser scenarios A–D — passed in three clean port-3001 suite runs.
- `git diff --check` — passed in both repositories after documentation edits.
- `TMF_NEXT_DIST_DIR=.next-codex-continuous-final npm run build` — passed. The live `.next/BUILD_ID` checksum was unchanged, Next-generated type-file edits were restored exactly, and the task-owned build directory was removed.

Deterministic and headless success cannot establish Android Telegram media policy.

## Remaining owner work and boundaries

- After an explicit owner deployment using only `tmfup`, repeat the one-shot next-launch image-first capture on a physical Android Telegram client.
- Leave the initial image untouched until hidden playback is confirmed continuous, muted, looped, and consumption-free. There must be no pause, duplicate play, black frame, controls, spinner, progression, History, or reusable unlock while hidden.
- Promote the exact candidate after activation is inactive. Require the same node/source/request, no second play, zero media operations near time zero or one in-playback seek above zero, then confirmed visible playback before reusable unlock.
- If visible muted playback rejects, require stable Play and bounded trusted active-media recovery on the same node/source.
- Continue through the first visible video plus 20 later ordinary-video transitions with one node and one locked source per viewing.
- Physical Android acceptance remains pending. Albums retain automated behavior but remain physically untested; no physical album result is claimed.
- VPS/fixed-domain production and Local Bot API/large-media work remain later phases.
