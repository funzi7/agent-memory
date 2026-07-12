# telegram-media-feed latest handoff

- Repo: `funzi7/telegram-media-feed`
- Branch: `agent/fix-album-carousel-swipe`
- Updated: `2026-07-12`
- Task starting telegram-media-feed HEAD: `02678a3746b014146cb27774c1941bd51eba0388`
- Current/pushed telegram-media-feed HEAD: `fdb48b1707bdf218c4f774a4d822da986708bf04`
- Task starting agent-memory HEAD: `0eef8677e472ddb5dbcc49b39a31962bf9766d7c`
- The final pushed agent-memory HEAD is reported by the completion response because this file belongs to that commit.

## Deployment note

- The application commit was pushed, but the live server on port 3000 was intentionally not stopped, restarted, replaced, or redeployed. The Cloudflare tunnel was not changed.
- Port 3001 was used only for isolated production/API/headless-Chromium validation. Both servers started by this task were stopped, the Chromium process was stopped, and temporary SQLite/browser data was removed.
- `.env.local`, its two pre-existing untracked backup files, BotFather, Telegram group content, live SQLite/runtime data, and topic assets were not changed or committed. No secret values were printed.
- The owner previously confirmed that Telegram Mini App authentication works and the token screen is gone. This round's security, autoplay/mute, and cross-session progression changes have not been deployed or physically verified by this agent.

## Implemented

### Stop-ship current-account/session isolation

Root cause: the client bootstrap accepted a valid `/api/auth/me` Telegram cookie before waiting for the current launch's initData. Telegram accounts sharing an Android WebView cookie jar could therefore let non-allowlisted B inherit allowlisted A. `/topics` independently had the same class of entry-path problem because it fetched protected topics/assets before current-launch bootstrap.

- `/` and `/topics` now inspect the current Telegram launch and poll the full bounded bridge/initData window before accepting any existing viewer cookie or requesting protected viewer data/assets.
- Current non-empty initData always wins. `POST /api/auth/telegram` revokes the presented viewer session before validating the current signed numeric Telegram user, checks the live `ALLOWED_TELEGRAM_USER_IDS`, and creates a new session bound to that user only after success.
- Invalid, missing-on-a-hinted-launch, expired, non-allowlisted, rate-limited, and configuration-failure authentication responses clear the stale viewer cookie. Unexpected hinted-launch bootstrap exceptions also revoke and fail closed.
- The client verifies that both the auth response and the new `/api/auth/me` cookie resolve to the exact current Telegram numeric user. A→allowlisted B rotates identity without merging A's viewer data. Only the intentional browser-profile→Telegram promotion merges.
- A non-allowlisted Telegram launch renders **Access denied**, with no feed flash and no APP_ACCESS_TOKEN form. The same behavior is implemented for Topics.
- `/api/auth/me` and every feed-authorized request recheck the current allowlist. Removing a Telegram id revokes and clears that session on the next request.
- Feed, media, topics/topic assets, personalization, and progression derive the viewer only from the validated server session. Client `userId` input is never authority.
- Browser owner-token access remains separate and functional. A removed Telegram session cannot become the browser viewer identity merely because the request also has an owner token. Telegram sessions still do not grant admin access.

### Vertical/carousel autoplay and mute preference

Root cause: active state, source readiness/version changes, and outstanding `play()` promises were handled by independent effects. A cold first transition could activate video 2 before its source was ready, then a later load/pause aborted that attempt without a valid same-generation retry. Mounted album videos also had conflicting local actual-mute state rather than one canonical viewer preference.

- Added `lib/video-autoplay.ts`, a generation-safe coordinator keyed by active media and source/version.
- Activation attempts autoplay. Source arrival and `loadedmetadata`, `loadeddata`, and `canplay` readiness progress retry only while that exact generation remains active.
- An unmuted policy rejection immediately retries that active video muted. The muted fallback updates actual element/rail state but never writes the persisted preference.
- Stale resolutions/rejections cannot claim playback, mute a newer source, or revive an inactive video. Abort errors re-arm readiness instead of adding arbitrary timers.
- A shared playback group ensures only one mounted feed/carousel video owns playback and pauses the previous owner. Inactive and preloaded siblings stay paused.
- Explicit Pause is scoped to one active media viewing, survives a source refresh of that media, and clears when navigating to another post or album media. Native/fullscreen pauses are treated as explicit intent; coordinator/load/replacement pauses are not.
- Scrubbing uses temporary suspension and keeps the prior play/pause intent. Playback-rate persistence, double-tap seek/like, fullscreen, buffering/retry, and genuine watch/completion accounting remain intact.
- Carousel activation is still settle-driven. Cold video→video, image→video, and video→image→video transitions autoplay only the newly settled item.
- `tmf_feed_muted` is feed-level viewer preference. Explicit mute/unmute is the only writer. Every new vertical/album video starts with that preference; a temporary browser-policy mute does not change what later videos first attempt.

### Durable per-viewer/context progression

Root cause: active stable ids, indexes, offsets, and scroll position existed only in memory/sessionStorage, so a new Telegram WebView/device restarted at item 1.

- Migration `009_user_feed_progress.sql` adds:
  - `user_feed_passed_media`: the commutative semantic source keyed by authenticated internal viewer, canonical feed context, and stable media id.
  - `user_feed_progress`: a compact newest-successful-write diagnostic/API summary, not the restoration algorithm's mutable cursor.
- Stable post/media ids deliberately have no content foreign key, so hidden/deleted content does not erase history. Contexts come from the feed architecture: `latest`, `for-you`, and normalized `topic:<thread-id>`.
- `GET|PUT /api/me/feed-progress` uses the authenticated session viewer. PUT accepts only stable `{postId, mediaId}`, derives/validates context/order/eligibility on the server, enforces origin/rate limits, and uses `INSERT OR IGNORE` for idempotent reordered/cross-device writes.
- Canonical progression means media passed by **forward, settled navigation** plus genuine completion:
  - vertical forward settle adds the item just departed;
  - album forward settle adds media N, so reopen selects N+1;
  - genuine completion adds the active media immediately;
  - merely arriving, raw scroll pixels, preload, failed autoplay, buffering, or seeking do not add progression or watched time.
- Closing/hiding does not auto-pass the currently viewed item. It flushes only already-pending departure/completion entries with `keepalive`.
- Routine writes use a 500 ms per-context stable-ID queue. Multiple rapid settles are retained instead of collapsing to the newest. In-flight writes are awaited by Refresh and idempotently duplicated with keepalive on page hide. Failures never break playback/navigation and remain retryable.
- Restoration reads server state before rendering/positioning, fetches 30-item pages until the stable target is found, and never silently jumps to item 1 on a progress-read/target-resolution failure.
- The resolver scans the current canonical order for the first eligible active media absent from the passed set. Latest/topic use chronological order; For You uses the existing v1 rank and its completion-based missing-anchor fallback. Restored videos always start at `0`.
- When all currently eligible media is passed, the UI shows **You're caught up**. Newly ingested/eligible media is unpassed and becomes available on the next read.
- Latest, For You, and each topic context are independent. Telegram users are independent. Browser→Telegram merge unions passed histories while Telegram A→B never merges.
- The versioned session cache is now keyed by authenticated viewer and context. It remains a same-session performance optimization only; it cannot authoritatively backfill passed progress from array position or override server progress.

## Validated

- `git diff --check`: passed.
- `npm test`: passed, `163/163`.
- `npm run typecheck`: passed.
- `npm run build`: passed with Next.js `15.5.20`.
- Deterministic security tests cover signed allowlisted A, same-cookie non-allowlisted B denial/revocation, A→allowlisted B rotation and data separation, exact cookie identity verification, missing/invalid initData, live allowlist removal, direct feed/media/progress denial, arbitrary client `userId` non-authority, and browser/admin isolation.
- Deterministic autoplay tests cover first video, first vertical 1→2, source-not-ready/canplay, unmuted rejection→muted fallback, stale attempts/sources, previous pause, explicit Pause scope, cold first album 1→2 with late source/abort/readiness, later transitions, image/video paths, settled-only playback, paused siblings, native pause, and all requested mute-preference cases.
- Deterministic progression tests cover two users, next-item/time-zero reopen without sessionStorage, album N→N+1 and completed album→next post, independent Latest/For You/topic contexts, pagination by stable ids, missing/deleted/filtered items, current For You order/fallback, idempotency, out-of-order/backward writes, caught-up then new ingestion, authorization/origin, browser fallback, and browser→Telegram union.
- Isolated production HTTP integration on `127.0.0.1:3001` passed health/root/Topics, anonymous denial, allowlisted Telegram auth/feed/topics/progress, same-cookie non-allowlisted denial + cookie clearing + revoked direct feed/media/topic access, and browser-profile/admin-token isolation.
- Headless Chromium on `127.0.0.1:3001` passed an allowlisted current-launch feed, a real wheel-settled progress write and stable-ID/time-zero reload restoration, then a non-allowlisted launch in the same browser cookie jar showing **Access denied** with no feed/token form on `/` and `/topics`; direct feed/topic requests were denied after cookie clearing.

## TODO / exact next manual test plan

Release remains blocked until the owner completes these tests on a physical Android Telegram client after deploying `fdb48b1707bdf218c4f774a4d822da986708bf04`:

1. Open with allowlisted A. Confirm token-free feed access and no feed flash before authentication.
2. In the same Android Telegram/WebView cookie context, switch to a numeric Telegram id absent from `ALLOWED_TELEGRAM_USER_IDS`. Confirm **Access denied**, no feed, no token form, and no Topics data. Retry/reopen must remain denied. This is the stop-ship gate.
3. After that denial, confirm direct feed and media URLs do not work in that context. Switch back to A and confirm a fresh successful current-initData authentication.
4. Add/use a different allowlisted B and switch A→B in the same cookie jar. Confirm B gets a fresh identity and does not inherit A's likes, completions, progression, or topic preferences. Remove B from the allowlist and confirm its next request is revoked/denied.
5. Cold launch the feed. Confirm video 1 autoplays, the first vertical video 1→2 settle autoplays without a tap, later videos autoplay, and only the visible active video plays while the prior video pauses.
6. Explicitly Pause one active video. Trigger readiness/source changes if possible; it must remain paused. Move to another post; the next video must autoplay and must not inherit the old pause suppression.
7. Cold launch a multi-video album and swipe video 1→video 2 before video 2 is fully ready. Confirm video 2 autoplays after readiness, video 1 pauses, later transitions still work, and preloaded siblings never play. Repeat image→video and video→image→video.
8. Explicitly unmute, then repeat vertical and album transitions. The next video must first attempt sound. If WebView policy forces muted fallback, playback must still start muted, the rail must show actual muted state, and the stored preference must remain unmuted for the next first attempt. Repeat after explicit mute; later videos must remain muted.
9. Scroll forward through several posts, close/reopen, Force stop Telegram, and open on another device with the same account. Confirm restoration at the next passed item (not item 1 and not the exact prior item) and video time 0.
10. In an album, settle from media N to N+1 and close while viewing N+1. Reopen at N+1. After the last album media is canonically passed/completed, reopen at the next feed post.
11. Verify Latest, For You, and at least two topic-filtered feeds retain independent progress. Verify pagination can restore a target beyond the first page, caught-up never wraps to item 1, and newly ingested media appears after caught-up.
12. Recheck scrubber, playback speeds, double-tap seek/like, fullscreen/native pause, completion scoring, browser APP_ACCESS_TOKEN access, admin `Sign out of admin`, and absence of Lock from feed/History.

## Not done

- No physical Android Telegram validation was performed by this agent. In particular, the owner has not yet verified the stop-ship non-allowlisted-account denial against the deployed commit.
- The live port-3000 application was not restarted/redeployed, and the Cloudflare tunnel was not changed.
- No BotFather change, Telegram group post, `.env.local` edit, allowlist edit, admin-token distribution, or Telegram webhook publication was performed.
- No Telegram Local Bot API Server, ffmpeg/transcoding, Android folder importer, TDLib/MTProto history import, Eximo integration, push notifications, comments, social profiles, ML ranking, negative scoring, or ranking rewrite.
- Exact video timestamp resume remains intentionally disabled.

## Bugs / limitations

- No known automated stop-ship failure remains, but deterministic fake-video and headless-Chromium behavior is not proof of Android Telegram WebView media/autoplay behavior.
- Network/offline failure can leave durable progress behind the latest settled departure until a later queued/pagehide retry. Playback and navigation remain non-blocking.
- Closing while merely viewing the current item intentionally leaves it eligible; only a settled forward departure or genuine completion passes it.
- A WebView may require the temporary muted autoplay fallback even when the stored preference is unmuted. This is expected policy handling, not a preference change.
- The hosted Telegram Bot API still cannot proxy files over 20 MB; the existing Open in Telegram fallback remains.
- Browser owner media URLs may still use the legacy token query path. Authenticated Telegram viewer media is cookie-only.

## Useful commands and routes

- `git diff --check`
- `npm test`
- `npm run typecheck`
- `npm run build`
- `npm start -- -H 127.0.0.1 -p 3001`
- `/`, `/?mode=for-you|latest`, `/?topic=<thread>`, `/topics`, `/history`
- `/admin/topics`, `/admin/ingest`, `/admin/personalization`
- `/api/health`, `/api/feed`, `/api/media/<id>`, `/api/topics`, `/api/topic-assets/<topicId>`
- `/api/auth/telegram`, `/api/auth/me`, `/api/auth/logout`, `/api/auth/browser-profile`
- `/api/me/feed-progress`, `/api/me/media-state`
- `/api/me/events/progress|complete|like|share`
