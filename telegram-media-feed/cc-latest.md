# Telegram Media Feed — Android autoplay-policy handoff

Date: 2026-07-14

## Repository state

- Application repository: `/root/work/telegram-media-feed`
- Branch: `agent/fix-album-carousel-swipe`
- Verified starting application HEAD: `a0e9192f1e72dc2a8d3d5d6b1b0fa0dce0db1d0d`
- Pushed application HEAD for this fix: `5cbfd4a346dd1119f8c7b6fed44a99697a294866`
- Verified starting/parent agent-memory HEAD: `c653708cefd228f119a5ee5b8b475179ab013f61`
- The exact pushed agent-memory handoff HEAD is reported in the completion response because a commit cannot contain its own SHA.
- Both repositories were clean at their verified starting HEADs. Only task-owned files were changed.

## Trace-confirmed cause

The owner captured a physical ordinary single-video trace from application build `a0e9192f1e72`, Telegram 9.6 on Android, and Chromium 149. Albums were not exercised.

- Media 1458 was active, settled, muted, and used a memory Blob. The trusted Autoplay diagnostics Start action had left browser user activation active. The programmatic call was followed by `play`, `playing`, promise resolution, and normal time advancement.
- Media 1457 was active, settled, muted, preferred-muted, and used a memory Blob. It reached `readyState=4`, `networkState=1`, and had its complete 12.31-second range buffered, but browser user activation was inactive and `autoplayAttribute=false`.
- Media 1457 received three automatic JavaScript `play()` calls: initial active/source configuration, metadata readiness, and full readiness. All three rejected immediately with policy `NotAllowedError`; no `play` or `playing` event occurred.
- Full readiness and buffering did not help. Missing bytes, network loading, `AbortError`, source replacement during the failed attempt, late readiness, internal pause, ownership loss, and playback starting then stopping were ruled out.
- Manual Play on the same element and memory Blob succeeded within about 5 ms once a trusted viewer action made user activation active.

The confirmed root cause was the old programmatic-first path: it attached/prepared the source, waited for vertical settlement, and then relied on delayed JavaScript `play()` while the mounted element had no declarative autoplay attribute. The first observed video appeared to work only because diagnostic Start supplied transient activation; later settlement happened after that activation expired. The old muted fallback could not help because the failed calls were already muted.

## Implemented fix

- Feed `<video>` elements are created with declarative `autoplay`, `muted`, and `playsinline` behavior. The ref callback and pre-source path synchronously establish `video.autoplay = true`, `video.muted = true`, `video.defaultMuted = true`, and `video.playsInline = true`, plus safe matching attributes, before any direct URL or memory/cache Blob is assigned.
- Source ordering is now: element exists; autoplay/mute/default-muted/plays-inline policy is installed; exclusive active eligibility is established; the media/source generation and playback group are configured; the active source is attached; the browser may start declaratively; the coordinator observes and claims accepted playback.
- The ordinary path gives a DOM source only to the final settled vertical post or settled carousel item. Inactive, outgoing, speculative, and warm-only elements remain sourceless; warm downloading remains separate.
- After the playback group has observed a real muted policy block in this WebView session, a trusted vertical release may synchronously promote only the exact nearest snap candidate as the exclusive provisional owner while activation is live. It uses an already authorized prepared Blob when available; otherwise it uses an authenticated direct source locked for that viewing so a late Blob cannot replace it after activation expires. Final settlement atomically confirms that candidate or invalidates its generation and owner and selects the real final target.
- The provisional path cannot be used by unrelated clicks. Untrusted/synthetic input, explicitly false user activation, duplicates across pointer/touch/click, stale settlement, lifecycle suspension, and explicit Pause are suppressed. Ownership is replaced before playback, so outgoing and incoming media cannot both play.
- Browser-originated declarative `play`/`playing` is accepted without a redundant coordinator `play()` call. The coordinator remains responsible for group ownership, stale attempts, source/view generations, lifecycle suspension/resume, explicit Pause, and bounded fallback/recovery.
- One post-`canplay` fallback may discover a WebView policy block after the browser has had an opportunity to honor declarative autoplay. A muted automatic `NotAllowedError` latches the current source generation as policy-blocked, keeps it active/loaded, consumes no internal-pause recovery budget, and prevents identical retries from metadata/data/canplay/canplaythrough or readiness changes. There is no polling or busy loop.
- A policy-blocked current source may retry synchronously once per source generation on a trusted activation-bearing pointer/touch/click path. The group session latch also permits the narrower trusted vertical-release provisional path described above. Every recovery call remains muted and group-owned.
- Every newly attached source starts actually muted and default-muted, independently of the stored preference. A stored muted preference remains muted. A stored unmuted preference may restore sound only after authoritative `playing` while user activation is active; otherwise playback continues muted without changing the stored preference. Only an explicit viewer Mute/Unmute action persists preference, and the rail reflects the element's actual mute state.
- Manual Play remains immediate and may bypass the policy latch under the trusted viewer action. Explicit manual Pause remains durable for that viewing through source/cache updates, readiness events, diagnostics, lifecycle resume, and cancelled/edge gestures; it is cleared only by manual Play or navigation to different media.
- The central control renders Pause and begins auto-hide only after accepted actual `playing`. Ownership, expected state, and a pending/called `play()` may show bounded loading but cannot imply Pause. A rejected attempt returns directly to stable Play without the prior icon flash.
- Diagnostics remain authenticated, off by default, playback-inert, bounded, and structurally redacted. Safe evidence now covers pre-source policy installation, declarative eligibility and actual playback, policy-block generation, bounded trusted recovery, source classification, and actual UI versus coordinator expectation without exporting source addresses, private content, identifiers, credentials, or arbitrary error text.

## Validation completed

- `git diff --check` — passed.
- `npm test` — passed, 293/293 tests.
- `npm run typecheck` — passed.
- `npm run build` — passed in a clean task-owned mirror excluding repository/build/runtime/environment state.
- Isolated browser validation — passed on task-owned port 3001 against the exact application source. The server was stopped and the port released afterward.
- The browser run observed 22 source assignments with autoplay, muted, default-muted, plays-inline properties and attributes present before `src`.
- Native declarative playback was accepted with zero redundant JavaScript `play()` calls.
- Twenty ordinary vertical transitions passed, as did rapid final-target selection, cancelled/edge durability, 20 policy-gated promoted transitions, direct-source locking, provisional confirmation, and changed-final-target invalidation. At most one element had a source or was playing.
- The policy simulation produced one muted fallback without readiness retries. Synthetic input and inactive activation were suppressed; trusted recovery ran at most once per generation.
- Stored unmuted preference remained separate while startup stayed actually muted. Pause and auto-hide followed actual `playing`, and rejected autoplay did not flash Pause.
- Diagnostics stayed playback-inert and their secret-free export regression coverage passed.
- The browser showed no client error portal. Anonymous and validly signed non-allowlisted access were denied.
- Regression coverage retained albums, warm Blob handoff/source replacement, visibility/pagehide, progression, watch/completion, likes, sharing, downloads, zoom, authentication, and allowlist behavior.

Headless Chromium proves implementation mechanics, not Android Telegram media-policy acceptance. The fix must not be reported physically accepted until the owner completes the plan below. Albums remain physically untested and have no pass/fail result from the ordinary-video trace.

## Required physical Android acceptance

1. Owner deploys using only `tmfup`.
2. Force-close Telegram.
3. Reopen Telegram and the Mini App.
4. Open Autoplay diagnostics and start a clean capture.
5. Scroll through 20 consecutive ordinary single-video vertical-feed posts.
6. Never press Play.
7. Every final settled video must begin playing automatically.
8. Verify only one video plays at a time.
9. Verify no Play-button flash remains.
10. Repeat after closing/reopening the Mini App.
11. Repeat after Telegram Force stop.
12. Repeat with stored mute preference muted.
13. Repeat after setting stored preference unmuted.
14. If one video fails, wait 2–3 seconds, stop diagnostics, and copy the report.
15. Albums remain a separate later physical test and must not be reported passed or failed from this ordinary-video run.

Do not report autoplay fixed until this exact plan passes on the owner's physical Android Telegram client.

## Operational boundaries observed

- No deployment was performed. The owner deploys afterward using only `tmfup`.
- The live application on port 3000 was not stopped, restarted, tested, or modified.
- SESSION 1 and the Cloudflare tunnel were not touched.
- No runtime environment file or secret value was read, printed, copied, or changed.
