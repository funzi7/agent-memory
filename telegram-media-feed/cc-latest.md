# telegram-media-feed latest handoff

- Repo: `funzi7/telegram-media-feed`
- Branch: `agent/fix-album-carousel-swipe`
- Updated: `2026-07-12`
- Task starting telegram-media-feed HEAD: `c58132abdce73560dff9971ba6de8da39372db9b`
- Current/pushed telegram-media-feed HEAD: `44fb7cd705b7b1e5d4f9fdd118b7936abc69f9fc`
- Task starting and pre-handoff agent-memory HEAD: `e6aad17b3a76d86ed8b809ce682cbf703c348a81`
- The final pushed agent-memory HEAD is reported by the completing response because this file is part of that commit.
- Work stayed on the checked-out branch. Nothing was reset to `main`, and the corrected carousel implementation was not discarded or rewritten.

## Pre-Task Manual Confirmation / Protected State

The user manually confirmed the corrected album carousel before this task: exactly one item per swipe, exact settling, synchronized dots/counter, preserved vertical feed swiping, and current-item retention on resize/orientation. Its gesture constants, one-step target calculation, settle logic, and event wiring were preserved.

The user declared topic gallery/profile-image management, viewer, fullscreen, share, topic/feed/history filtering, controls, mute persistence, admin pages, soft-delete/restore, ingest audit, GroupAnonymousBot display, large-media fallback, image quality selection, original image-document streaming, and existing API routes working unless a small integration change was required. Those features remained protected.

## Exact Implementation

### Tall/high-resolution images

- Stored intrinsic dimensions classify tall media at `height / width >= 1.65`.
- Tall feed images fill the complete media width at original aspect ratio, align to the top, and are clipped by the one-viewport post. The full long screenshot is not reduced until its text is tiny.
- Feed/viewer continue to use the selected highest-quality Telegram proxy file. No generated thumbnail, Next optimizer, canvas, sharpening, AI upscale, or artificial downscale was added.
- Normal-aspect images retain their existing contain-style viewport rendering.
- The existing portal viewer opens tall images fit-to-width, top-aligned, with its own vertical scroll through the complete image.
- Pinch zoom, zoomed pan, touch double-tap/mouse double-click, Escape, visible close SVG, modal focus/inert state, and exact opener/feed restoration remain.
- Modal overscroll is contained and the background feed is fixed/inert, so viewer scrolling cannot advance the feed.
- Carousel tap suppression remains tied to existing gesture movement, so a horizontal album swipe does not open the viewer.

### Topic identity, RTL order, and captions

- Persistent topic/caption block moved to the lower-right above progress and safe-area insets, with width reserved away from the left rail.
- Captions sit directly above the topic row and remain associated with it without crossing progress, album UI, or the rail.
- Topic identity is outside the auto-hidden controls layer and remains visible when controls fade.
- RTL order is explicit: avatar-first markup plus fixed `direction: ltr`/`flex-direction: row-reverse` yields `[avatar far right] [topic name left]` regardless of document direction.
- `dir="auto"`, plaintext bidi behavior, wrapping, and start alignment keep mixed Hebrew/English titles readable.
- Avatar and title remain one clickable Next client link to `/?topic=<message_thread_id>`.

### TikTok-style action rail and menu

- Actions form one left vertical line in logical top-to-bottom order: mute, playable-video fullscreen, share, menu.
- All buttons are identical `48x48` circles on `58px` vertical slots with common touch targets, gap, border, backdrop, focus treatment, and control-layer visibility.
- Visible actions are icon-only inline SVGs with normalized `24x24` view boxes, common `22px` render boxes, zero padding/line-height, consistent stroke/fill, and per-icon optical offsets.
- `aria-label`, `title`, pressed state, `focus-visible`, hidden tab behavior, and menu expanded state remain.
- Photo posts never render fullscreen. Mute is limited to relevant video/audio state. Share/menu remain available normally.
- Rail geometry stays above progress/safe area and clear of lower-right identity/captions and album counter/dots.
- Large surface text actions/date were removed for normal media. Menu now contains date, album metadata, active Open in Telegram, All feed when filtered, History, Topics, Manage topics, Ingest, Refresh, and Lock.
- Too-large media remains the exception with a prominent Open in Telegram primary action.

### Spinner and retry

- Visible `Retrying`/loading text is gone from the video surface.
- A centered circular CSS spinner is pointer-transparent and delayed `140ms` to avoid short-wait flicker.
- Screen readers retain `role="status"` and clipped `Retrying video`/`Loading video` text.
- Waiting/stalled media starts a real `3.5s` recovery timer. Loaded/canplay/playing/pause paths clear the timer and spinner immediately.
- Automatic retry remains bounded to two quick attempts (`150ms`, `450ms`); manual Retry appears only after the bound fails.
- Retry uses the stable media URL, does not overwrite mute preference, ignores browser-cancelled media errors, and has no infinite loop.

### Client navigation and feed state

- Feed/topic links plus topics/history/admin cross-route navigation use Next `Link` where route state supports it. History's same-page topic filter remains a normal navigation because history currently initializes query state on mount.
- `app/page.tsx` normalizes the topic query server-side and the actual stateful feed subtree is keyed by that filter, fixing full <-> topic client transitions without a document reload.
- Versioned feed cache `tmf_feed_cache_v4` uses module memory plus `sessionStorage`, with independent entries for full and each topic feed.
- Entries retain fetched items/cursor/topic metadata, current post id/index/relative offset, feed scroll, and every post's selected album item.
- Cache reuse lasts up to 30 minutes for instant restoration, but every return triggers a background `no-store` revalidation.
- Fresh first-page items lead and replace matching cached versions; cached tail items remain in order; append/revalidation deduplicate ids. New posts therefore appear without losing position.
- Cleanup/pagehide flushes the exact latest position. Lock, token change, and `401` clear state.
- Feed -> topics/history -> feed can reuse the saved state rather than reconstructing a cold feed where practical.

## Video Cache / Preload Architecture

### Identity and targets

- Feed media now includes a stable secret-free `mediaVersion`, SHA-256-derived from media id, Telegram `file_unique_id`, and file size. The media ETag uses the same version identity.
- `app/video-warm-cache.ts` is a browser module singleton, allowing in-memory Blob leases to survive Next route transitions in the tab.
- `app/video-warm-policy.ts` selects the active playable slide, next three playable post selections, and optionally the immediately previous playable item.
- Only the selected album slide participates. Images, over-20MB/too-large media, hidden/deleted feed rows, inactive album slides, unrelated posts, and the whole-feed tail are not warmed.

### Limits, deduplication, and eviction

- Maximum concurrent storage/network warm tasks: `2`.
- Memory Blob LRU: maximum `5` entries and `64 MiB`.
- Versioned Cache Storage LRU: maximum `8` entries and `96 MiB`.
- Per-entry ceiling: `20 MiB`.
- Cache name/version: `tmf-playable-video-v1`.
- Synthetic request shape: `/_tmf-cache/playable/v1/<media-id>/<media-version>`.
- Synthetic keys contain no query, `APP_ACCESS_TOKEN`, bot token, Telegram URL, or file URL. Warm network fetches use the stable same-origin media path and send the app token only in `Authorization`.
- In-flight Cache Storage/network work is deduplicated by media id/version. Target reconciliation cancels irrelevant pending work, but never revokes an attached player source.
- Queue cancellation settles promises and releases concurrency slots even if a Cache API lookup hangs. Caller abort returns promptly without leaving an orphaned Blob pin.
- Active leases increment pins. LRU/corrupt retirement revokes object URLs only after all pins release. A corrupt currently attached URL switches state to direct, then releases on the next animation frame.
- Lock, `401`, access-token change, and explicit clear retire memory, abort work, revoke safe URLs, and clear the versioned persistent cache.

### Startup, reuse, and fallback

- Active playback probes ready memory/Cache Storage first. A ready/in-flight warm source may be awaited up to `2.5s`; a cold storage-only miss waits at most `120ms` before direct playback.
- A missing current video intentionally uses the direct `/api/media/<id>` source so browser range/progressive startup remains available. The next three videos warm in the bounded background.
- After a cold direct source is fully buffered or ends, one sequential full warm fetch may populate Blob/Cache Storage reuse. It can be a second transfer on the first cold visit, but does not compete with active playback.
- Revisits and full/topic/full transitions use the same Blob when valid and do not start another full warm request.
- If a Blob is corrupt/unplayable, it is evicted and the stable direct endpoint is tried once. A direct recoverable failure still gets bounded automatic retry.
- Cache Storage, quota, private browsing, object URL, storage metadata, or persistent read/write failures fall back to memory Blob and then the existing media endpoint.
- Playback controls, seeking, fullscreen, autoplay muted fallback, and stored mute preference are unchanged.

## Media Route Integration

- `/api/media/:id` keeps private caching, ETag, Last-Modified, full `200`, and byte-range `206` behavior.
- Strong matching ETag or fresh date `If-Range` honors the requested range. Weak/stale/malformed validators ignore Range and return the complete `200` representation.
- Expected browser/downstream cancellation logs as a client abort and returns `499` if a response can still be produced, rather than masquerading as an upstream `502`.
- Retry query cache-busters were removed so browser cache, active playback, warm fetch, and route restoration share a stable endpoint identity.

## Validation Completed

- `git diff --check`: passed on the committed application tree.
- `npm test`: 24/24 passed.
- `npm run typecheck`: passed.
- `npm run build`: passed; all existing pages and API routes compiled in production mode.
- Final production build started successfully; feed, topics, and authenticated feed API smoke returned `200`.
- Broader production checks returned `200` for `/`, filtered feed, `/topics`, `/history`, filtered history, `/admin/topics`, `/admin/ingest`, and authenticated feed/topics/history/admin APIs.
- Media checks passed range `206`, matching `If-Range` `206`, stale `If-Range` full `200`, conditional ETag `304`, and unchanged too-large `413`.

### Browser/mobile presentation

- Headless Chromium mobile emulation (`390x844`) rendered stored tall media `396x1280` at width `390` and height about `1261`, top-aligned in the viewport instead of compressed to full height.
- Tall viewer opened at width `390`, had full scroll height about `1261`, started at top, scrolled independently, zoomed/reset, closed, and restored exact feed scroll/focus. Normal `1080x707` retained normal behavior.
- Lower-right topic block, avatar to the right of name, exact topic href, persistent identity during auto-hide, caption/rail/progress clearance, and no photo fullscreen passed.
- Rail circles measured `48x48` with one x-center and `58px` center spacing. Every SVG optical center was within subpixel tolerance.
- Retry fixture produced two bounded direct attempts, showed only the accessible clipped retry label plus spinner, and removed the spinner after recovery.
- Controls auto-hide/show, mute persistence, play/pause, seeking, fullscreen entry/exit, and safe share URL containing only `topic` passed.

### Browser cache/navigation recording

- Deterministic WebM network substitution recorded exactly one warm fetch each for active/current plus the next three ids, maximum concurrency `2`, no mass preload, and no too-large warm.
- Cache Storage contained only the four expected secret-free synthetic keys and declared sizes within limits.
- Full -> topic -> full navigation kept one document boot, used Blob playback, preserved normal controls/seeking, and did not repeat the full warm fetch for the valid cached video.
- A separate context with `window.caches` unavailable used in-memory Blob fallback with the same bounded concurrency.
- Unit coverage also verifies media-version/key stability, warm-policy album selection, in-flight dedup, memory LRU, pinned corrupt release, persistent failure, bearer full GET, storage-only current probe, caller abort, hanging persistent lookup, slot release, and target cancellation.

### Protected regressions

- Corrected three-item carousel reconfirmed exact one-slide touch/pointer movement, exact settles, synchronized counter/dots/aria, resize retention, vertical feed swiping, desktop arrows, and mixed too-large albums.
- `/topics`, `/admin/topics`, `/history`, filtered history, and `/admin/ingest` load.
- Topic profile-image upload, authenticated serve, replacement, and removal passed on an isolated validation DB; the pre-existing ignored asset stayed unchanged and temporary test assets were removed.
- Fullscreen and secret-free topic sharing passed.
- Existing `200/206`, soft-delete/filter behavior, and over-limit Telegram fallback remain.

Browser validation was headless Chromium mobile emulation, not a physical Android Chrome device. Physical-device cache quota/eviction, decoder quirks, Web Share chrome, OS memory pressure, touch vendor behavior, and cancellation timing still need acceptance testing on the user's phone.

## Explicitly Not Done

- No Telegram Local Bot API Server. This remains the high-priority >20MB solution.
- No `ffmpeg` preview or transcoding.
- No Android phone-folder uploader. Keep the future user-controlled folder, duplicate/idempotency, topic assignment, permission owner, background execution, and Termux/native lifecycle design.
- No per-user seen/unseen history. Identity/session semantics remain prerequisite.
- No Eximo fix, X/Twitter fetcher, or workaround.
- No Telegram Mini App/login/cookie-session auth redesign.
- No historical photo-variant reconstruction, sharpening/upscale, full-feed preload, service worker, carousel rewrite, or permanent Playwright dependency.

## Known Limitations / Remaining Roadmap

- **High priority:** deploy Telegram's official Local Bot API Server on persistent hosting for files over 20MB. Keep the current prominent Open in Telegram fallback until it is proven; optionally add `ffmpeg` later for compatibility.
- The first cold direct playback may be followed by one sequential full warm transfer. This preserves fast progressive startup, then makes later visits reusable.
- Cache Storage is best-effort. Quota, private mode, browser policy, profile/site-data cleanup, or eviction can remove it. Memory Blob URLs do not survive a full document reload.
- Cached private media is accessible to the unlocked browser profile. Lock clears application-managed cache; clear site data if a device/profile becomes untrusted.
- Native image/direct-video requests still use query-string app access. Replace this with a validated Mini App/Login or cookie/session architecture before wider sharing. Generated share URLs are secret-free.
- Topic profile assets remain local persistent files; back up/migrate `data/topic-assets/` with SQLite.
- Existing SQLite rows contain only the selected Telegram file id. Discarded old photo variants cannot be reconstructed and may require reposting. Telegram normal-photo compression cannot be reversed.
- Eximo remains a delivery limitation, not a feed/history bug: user media appears in `/admin/ingest`, Eximo posts do not, because Telegram does not deliver those bot messages to this bot webhook. Future options are an owned X/Twitter fetcher, TDLib/MTProto, or replacing Eximo.
- Android folder import, per-user history, and Mini App/auth remain separate roadmap designs.

## Useful Commands And Routes

- `git diff --check`
- `npm test`
- `npm run typecheck`
- `npm run build`
- `npm start -- -H 127.0.0.1 -p <available-port>`
- `/`
- `/?topic=<message_thread_id>`
- `/topics`
- `/history`
- `/history?topic=<message_thread_id>`
- `/admin/topics`
- `/admin/ingest`
- `/api/health`
- `/api/feed?limit=8`
- `/api/feed?topic=<message_thread_id>&limit=8`
- `/api/topics`
- `/api/admin/topics`
- `/api/admin/topics/profile-image`
- `/api/admin/ingest`
- `/api/topic-assets/<topic_id>`
- `/api/media/<media_id>`
