# telegram-media-feed latest handoff

- Repo: `funzi7/telegram-media-feed`
- Branch: `agent/fix-album-carousel-swipe`
- Updated: `2026-07-13`
- Task starting telegram-media-feed HEAD: `fdb48b1707bdf218c4f774a4d822da986708bf04`
- Current/pushed telegram-media-feed HEAD: `d98d1fd1da2561e79acc82855a5d71af20b477af`
- Task starting agent-memory HEAD: `57d081d6db150dc4f27510230b3f58ab5308173a`
- The final pushed agent-memory HEAD is reported by the completion response because this file belongs to that commit.

## Deployment state

- The repository candidate was committed and pushed. It was **not** deployed or substituted for the live application.
- The live application on port 3000 was intentionally not stopped, restarted, requested, or tested. The Cloudflare tunnel/SESSION 1 was not touched.
- Final production validation used only a task-owned server on `127.0.0.1:3001`, a temporary SQLite database, and a temporary Chromium profile. Those processes were stopped and the temporary data was removed.
- `.env.local`, its pre-existing backup files, Telegram allowlists, BotFather, the Telegram group, webhook configuration, live/runtime SQLite files, topic assets, logs, caches, screenshots, and browser profiles were not changed or committed. No real token, initData, session cookie, or private media URL was printed.
- The candidate's share/download/zoom/autoplay/cache changes have not been physically accepted on Android Telegram. Autoplay remains a release-blocking physical gate because the owner observed intermittent failures on deployed `fdb48b1`.

## Owner-confirmed externally

These observations came from the owner on real deployed Telegram builds; they were not reproduced physically by this coding agent:

- Telegram Mini App authentication works.
- A numeric Telegram user absent from `ALLOWED_TELEGRAM_USER_IDS` sees **Access denied** and cannot enter the feed.
- Telegram launches do not show the APP_ACCESS_TOKEN form.
- Per-user progression appears to work in routine use.
- On deployed `fdb48b1`, autoplay remained intermittent: some later videos stayed paused until manual Play. That behavior is not an accepted baseline.
- Before Bot-to-Bot Communication was enabled, Aximo bot messages did not reach the feed bot's webhook. Manually forwarding the same media as a normal user ingested successfully, proving the parser was not the original delivery blocker.
- The exact successful operational path was `@BotFather` → select the feed bot → **Bot Settings** → blue **Open** into the BotFather Mini App → select `@Media_feed_player_mimi_bot` → enable **Bot-to-Bot Communication**.
- After enabling it, one **new** Aximo bot post appeared in the feed. Old bot messages were not replayed. The feed bot still needs the applicable group admin/privacy access.
- Native Telegram delivery is therefore sufficient today. No MTProto/user bridge, X scraper, or Instagram scraper is needed. MTProto is only a future fallback if bot-to-bot delivery stops.

## Implemented

### Generic bot-origin ingest and source URLs

- Added deterministic real-ingest fixtures for bot-origin photo, video, and mixed `media_group_id` album updates. They prove `from.is_bot=true` is accepted generically, preserve caption and exact forum `message_thread_id`, form an ordered album, and record `/admin/ingest` audit rows with `isBot=true` and `ingested` status.
- There is no Aximo-specific sender filter or special case.
- Added migration `010_post_source_url.sql`. Canonical post-level sources are extracted from caption/text URL and `text_link` entities, raw caption/text URLs, and reply-markup inline keyboard URL buttons while retaining Telegram message identity separately.
- X/Twitter/Instagram links outrank other explicit external links; Telegram encounter order breaks ties. Album messages may upgrade a generic source to a recognized social source but cannot downgrade it.
- Copy link can also recover an explicit safe URL from an older row's stored raw caption when that row predates `source_url`.
- URL normalization rejects credentials, private/local hosts, the current private app origin, Quick Tunnel, Bot API/media-proxy paths, and token/session/initData-style query parameters. It never fabricates a source.
- README, Security, Project State, admin ingest wording, TODO, and the release review now record the verified BotFather Mini App path, new-message-only behavior, required group access, owner-confirmed success, and why no bridge is currently needed.

### Active-item media actions

- Replaced the ineffective Share outcome with an accessible active-item action sheet: **Share to Telegram**, **Copy link**, and **Download image/video**. Every action derives the settled album media id rather than defaulting to item one.
- Telegram share preparation is server-side and Mini-App-only. `POST /api/me/share/prepare` derives the current live-allowlisted Telegram viewer, validates active/finalized media, rate limits the actor, and calls Bot API `savePreparedInlineMessage` with the stored cached `file_id`. The client calls `WebApp.shareMessage` only with the prepared id.
- A false native callback is normal cancellation. Only a true callback may consume a one-time hashed, viewer/media-bound `/api/me/share/confirm` capability and record the existing idempotent +3 share event. The old direct `/api/me/events/share` path returns `410`; opening, preparing, cancelling, copying, and downloading do not score.
- Browser/admin sharing is clearly disabled rather than claiming success. Native callbacks are bounded at 120 seconds with late-callback settlement guards; HTTP action calls are bounded at 15 seconds.
- Copy fallback order is canonical/legacy-caption source, active Telegram message, post Telegram message, then **No source link available**. Private app, tunnel, media-proxy, and secret-bearing URLs are never copied.
- Download preparation requires an authenticated Telegram viewer or owner token, trusted origin, eligible active media, and a per-actor rate limit. Migration `011_media_action_tokens.sql` stores only hashes for five-minute opaque download capabilities.
- `GET /api/download/:ticket` rechecks the Telegram actor's live allowlist and current media visibility/finalization, streams the upstream body without whole-file buffering, preserves `200`/`206` range behavior, and returns a safe filename, MIME, attachment disposition, no-store caching, `nosniff`, and narrow Telegram Web CORS.
- The Mini App prefers `WebApp.downloadFile`; an authorized browser uses the same-origin ticketed attachment. A hosted-Bot-API oversized flag, known size over 20 MB, later `getFile` oversize, or unavailable source never claims success and retains the Open in Telegram/clear unavailable fallback.
- Action-sheet teardown restores focus after inert cleanup for Close, success, active-item change, and post change. No duplicate live status is announced while the sheet is open.

### Full-screen image zoom

- Single images, image albums, and image items in mixed albums share one full-screen viewer and open the exact settled media id.
- Pointer gestures implement two-finger pinch in/out, clamped `1×`–`5×` scale, zoomed pan, and double-tap `1×`↔`2.5×`. Pan clamps both axes; tall images remain top-aligned and vertically pannable.
- Opening makes the feed inert and disables Telegram vertical swipes. The close control remains reachable; Escape and Telegram `WebApp.BackButton` close the viewer. Cleanup restores BackButton/vertical-swipe state and focuses the originating image.
- Closing keeps the same post, album item, and feed position. Close/reopen or a media identity change starts with a clean transform. The modal owns zoom gestures, leaving ordinary inline carousel/feed gestures untouched.

### Autoplay release-blocker investigation and fix

The exact Android event sequence was unavailable because deployed `fdb48b1` had no trace, but review of that exact code found three concrete causes/race amplifiers:

1. After `play()` settled, any unexpected active `pause` was persisted as explicit user Pause. Source/load/cache/group/WebView operations could therefore permanently poison that viewing until manual Play.
2. The implementation tracked only one expected internal pause and cleared it on `playing`. A queued stale source/load pause arriving afterward was reclassified as user intent.
3. `AbortError` only set an “awaiting readiness” state. If `readyState` was already sufficient, or `loadeddata`/`canplay` fired while `play()` was still pending, no future event remained to retry. Midpoint vertical activation, stable-URL source replacements, and ownership claimed only after playback widened these intermittent races.

Candidate behavior:

- Vertical playback is ownerless during a real gesture and assigned only after the final scroll-snap settle. Cancelled/edge gestures also arm settlement so playback cannot remain ownerless. Carousel activation remains final-settle-only.
- The shared group claims the incoming settled video before invoking `play()`, pausing the previous owner first. Stale `playing` events and old promise settlements cannot retake ownership or pause a newer in-flight attempt.
- Internal/source/group pauses are counted and classified; active ready media recovers immediately, otherwise readiness re-arms it. Recovery is event-driven, capped at three unclassified recoveries per source/view, and cannot be bypassed by same-generation configure/readiness calls. Source/view/resume or explicit user Play re-arms the budget.
- A ready `AbortError` gets one immediate same-source-generation retry. A readiness event received while the attempt is pending is chained after settlement. No polling or continuous play loop was added.
- Only the app Pause action or an unmarked pause from visible native/standard fullscreen controls establishes durable explicit Pause. Source replacement, cache handoff, playback-group replacement, scrubbing, visibility, Telegram activation/deactivation, and page hide/show are internal/temporary.
- Same-URL server `mediaVersion` changes force `video.load()`, local retry/cache source versions remain distinct, and full-buffer state resets on either identity change.
- Missing `pageshow` is repaired when the document becomes visible/Telegram activates. Unmount/deactivation cancels pending retry. Explicit pause, mute preference, playback speed, scrub, fullscreen, watch/completion accounting, album behavior, and warm-cache behavior remain intact.
- Added bounded media lifecycle diagnostics: automatic in development, opt-in in production with `tmf_media_debug=1`, at most 120 events per mounted trace and 600 globally. It records post/media/index, active/settled state, server/local source versions, direct versus warm Blob, readiness/network/play/pause/buffer/lifecycle state, stored versus actual mute, and autoplay generations. Sources are reduced to redacted classes and errors are scrubbed; no path, origin, URL capability, initData, cookie, or token is logged.

### Release security and product review

- Fixed a release-blocking warm-cache authorization bypass found during the systematic review. Manual Cache Storage reuse previously bypassed the media route's HTTP revalidation and could hand already-warmed speculative bytes to a removed viewer or replay newly hidden media.
- Every active memory/persistent Blob lease now first issues a credentialed, no-store `HEAD /api/media/:mediaId`. HEAD performs live feed authorization/allowlist plus active/finalized lookup (with the explicit owner History exception), returns only a secret-free media version/ETag, and never calls Telegram `getFile`.
- Reuse requires `200` plus exact version/ETag. `401`/`403`/`404`, mismatch, abort, or network failure yields no lease, retires memory/task state, schedules persistent eviction, and falls back to the direct authenticated source.
- Normal viewers can GET only active media in single posts/finalized albums. The owner token retains hidden/deleted/settling media access for History. Direct media is `private, no-cache`.
- History and all admin pages now wait for Telegram launch classification before touching localStorage. Telegram launches never read/send/show a stored owner token; feed/Topics hide owner-only navigation. Browser owner/admin workflows remain separate; Feed/History still have no Lock.
- Added `docs/RELEASE_REVIEW.md` with media, navigation, playback, image, action, authentication/security, Aximo, and network/error matrices. Each row records automated/manual status, defect, severity, whether fixed, and remaining physical validation. Larger/ambiguous product work remains TODO rather than a redesign.
- Existing ranking, canonical passed/consumed progression, one-video ownership, mute semantics, watch/completion accounting, topic assets, and admin separation were preserved.

## Validated

- `git diff --check`: passed.
- `npm test`: passed, **235/235**.
- `npm run typecheck`: passed.
- `npm run build`: passed cleanly with Next.js `15.5.20`.
- Deterministic coverage includes bot photo/video/album ingest and audit; source entity/raw/button ordering and unsafe URLs; prepared share security/cancellation/scoring; active photo/video/album download/range/filename/auth/oversize/no-score; viewer pinch/pan/double-tap/reset/item selection; cache HEAD authorization and eviction; auth/session/owner-tool boundaries; and progression/ranking regressions.
- Autoplay coverage includes 20 consecutive vertical transitions, direct/warm Blob swaps, successful-play→stale-internal-pause recovery, ready and in-flight `AbortError`, multiple server/local source versions, rapid final settle, slow/waiting/stalled recovery, feed head merge, restored progression, alternating album/vertical transitions, explicit Pause, fullscreen/native pause, visibility/WebView lifecycle, and cancellation after inactive/unmount.
- Final isolated production HTTP on `127.0.0.1:3001` passed: health and owner feed/topics returned 200; anonymous feed/media/share-preparation/download-preparation returned 401.
- Final isolated headless Chromium passed: anonymous launch rendered **Private feed** and its owner token form with no Next error portal; the owner-browser unlock reached the empty For You/Latest feed with no error portal.
- The task-owned server/browser were stopped and temporary data removed. Port 3000/tunnel remained untouched.
- None of these results proves Android Telegram pinch, media policy, native share picker, native download dialog, or real Aximo X/Instagram formatting.

## Exact next physical Telegram acceptance plan

Run only after the owner explicitly deploys `d98d1fd1da2561e79acc82855a5d71af20b477af`. Record Android device and Telegram client versions. Do not publish acceptance content to the source group without separate owner authorization.

1. Open as allowlisted A. Confirm token-free entry, no feed flash, and no owner-token form. In the same cookie context switch to non-allowlisted B: confirm **Access denied**, no inherited data/token form, and direct feed/media/share/download denial. Switch A→different allowlisted B and confirm likes/progression remain separate. Remove a test id from the allowlist and confirm live denial on the next protected request.
2. Exercise Latest, For You, two topic feeds, Topics, owner-browser History, caught-up, refresh, pagination, and album swipe. Forward-settle through posts/albums, close/reopen, Force stop, and use another device with the same account. Confirm next stable item at time zero, media-first album progression, independent contexts, and no auto-pass merely from closing.
3. Autoplay is the release-blocking gate. Without pressing **Play**:
   - cold-open and scroll through at least **20 consecutive video posts**;
   - close/reopen and repeat at least 20 transitions;
   - Force stop Telegram, reopen, and repeat at least 20 transitions;
   - set the stored preference muted and repeat;
   - explicitly **Unmute** and repeat, confirming any policy-forced muted fallback does not overwrite the later preference;
   - alternate vertical transitions with video albums and mixed image/video albums, including video 1→2 with late readiness, image→video, and video→image→video.
   Every finally settled video must start and only one may play. Regress explicit Pause, scrub, fullscreen, all four speeds, background/return, and source/cache handoff: only actual user Pause may remain suppressed, and lifecycle pauses must not poison later items. If anything sticks, enable the bounded redacted trace for one reproduction, capture only post/media/index and event sequence, then remove the flag.
4. On a single image, image album, and mixed album, open the exact settled image. Physically test pinch out/in across `1×`–`5×`, pan/clamping, double-tap zoom/reset, reachable close and Telegram BackButton, no feed/carousel movement while open, same post/item/position on close, and clean transform after change/reopen. Confirm normal inline carousel swipe before opening.
5. From photo, video, supported animation/document, and multiple mixed-album positions, open Media actions. Confirm labels and every target follow the settled item; dismissal restores the feed and leaves no invisible interception.
6. Share supported active media to Saved Messages or another private acceptance target, never the source group. Confirm the actual Telegram media/caption rather than an app/tunnel URL. Cancel normally with no +3; confirm only a true success creates one idempotent share event. Test unsupported browser/client, preparation failure, expiry, and rate-limit states.
7. Copy from a real Aximo X entity, raw Twitter caption, Instagram caption, inline-button source, multiple-URL post, and no-URL post. Confirm social/source/active-Telegram/post-Telegram order, the exact no-link message, no private/tunnel/proxy/credential URL, and no share score.
8. Test native Android download for active photo/video and album item 2+. Confirm safe filename/MIME/playable bytes, cancellation/failure, and no share/completion event. Test browser attachment fallback. Oversized/unavailable media must not claim success and must direct the owner to Open in Telegram/clear unavailability.
9. Only if explicitly authorized, send new Aximo X-style, Instagram-style, captioned, inline-keyboard, and album posts. Confirm `/admin/ingest` shows `from.is_bot=true`, `status=ingested`, caption/thread/album/source preservation. Do not expect old posts to replay. The generic one-post success is already owner-confirmed; these formats are not.
10. Exercise source-not-ready, aborted/failed media, Retry, failed share preparation, clipboard unavailable, download unavailable, offline/reconnect, and session expiry. Recheck Like, completion/watch accounting, Open in Telegram, one-video ownership, browser/admin separation, admin `Sign out of admin`, and continued absence of Lock.

## TODO

- Deploy only as an explicit owner operation, then complete the full physical plan above. Do not mark autoplay fixed until the 20-item Android Telegram runs pass.
- Capture a bounded redacted lifecycle trace only if the candidate still fails physically; the actual deployed WebView event order is still unknown.
- Keep Local Bot API Server/optional ffmpeg as the future solution for hosted-Bot-API files over 20 MB.
- Keep MTProto/TDLib only as a fallback if native bot-to-bot delivery stops or a separately authorized history project needs it.
- Eventually remove the legacy browser owner-token query form from media URLs after the session migration is complete.

## Not done

- No deployment or live port-3000/tunnel operation.
- No physical Android Telegram autoplay, pinch, native `shareMessage`, or native download-dialog validation.
- No real Aximo X-style/Instagram-style/inline-button/album acceptance post by this agent.
- No BotFather change, Telegram group post, webhook publication, `.env.local` edit, allowlist edit, or APP_ACCESS_TOKEN distribution.
- No MTProto/user bridge, X scraper, Instagram scraper, Local Bot API Server, ffmpeg/transcoding, Android folder importer, comments, profiles, notifications, topic snooze, timestamp redesign, or ranking rewrite.
- Exact video timestamp resume remains intentionally disabled.

## Bugs and limitations

- The candidate has no known automated stop-ship failure, but the autoplay outcome is still physically unaccepted. Fake media elements and Chromium are not Telegram Android WebView proof.
- The exact real-device event that triggered each deployed `fdb48b1` failure was not captured; the candidate fixes all code-substantiated permanent-stall mechanisms and adds safe instrumentation for any recurrence.
- No web app can revoke bytes already delivered into a browser profile. The application now refuses and evicts unauthorized warm-cache reuse, but a person with profile-level access may inspect local site data; clear site data on lost/shared devices.
- Telegram native share/download APIs depend on client support. Browser sharing stays unavailable; browser download uses the short-lived capability fallback.
- Copy link can use only a safe explicit URL Telegram supplied/stored; it never guesses one.
- Bot-to-Bot Communication delivers only new bot messages. Old Aximo history is not replayed.
- Hosted Bot API `getFile` still cannot serve/download files over 20 MB. Open in Telegram remains the current fallback.
- Network/offline failure can leave durable progression behind the newest pending settled departure until a later successful retry; playback remains non-blocking.
- Closing while only viewing an item intentionally leaves it eligible on reopen. Exact timestamp resume remains disabled by design.

## Useful commands and routes

- Commands: `git diff --check`, `npm test`, `npm run typecheck`, `npm run build`, `npm start -- -H 127.0.0.1 -p 3001`
- UI: `/`, `/?mode=for-you|latest`, `/?topic=<thread>`, `/topics`, `/history`, `/admin/topics`, `/admin/ingest`, `/admin/personalization`
- Auth/feed: `/api/auth/telegram`, `/api/auth/me`, `/api/auth/logout`, `/api/auth/browser-profile`, `/api/feed`, `GET|HEAD /api/media/<id>`, `/api/topic-assets/<topicId>`
- Viewer: `/api/me/feed-progress`, `/api/me/media-state`, `/api/me/events/progress|complete|like`; legacy Share event is disabled
- Actions: `/api/me/share/prepare`, `/api/me/share/confirm`, `/api/me/download/prepare`, `/api/download/<ticket>`
- Diagnostics/admin: `/api/health`, `/api/admin/personalization`, `/api/admin/topics`, `/api/admin/ingest`
