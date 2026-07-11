# telegram-media-feed latest handoff

- Repo: `funzi7/telegram-media-feed`
- Branch: `agent/fix-album-carousel-swipe`
- Updated: `2026-07-11T17:01:46Z`
- Task starting telegram-media-feed HEAD: `c90fe72150da96f8174f2b5feb2689e3e4d554de`
- Current/pushed telegram-media-feed HEAD: `c58132abdce73560dff9971ba6de8da39372db9b`
- Task starting and pre-handoff agent-memory HEAD: `161f150e5981dd70960a25ac34b00ab59755a998`
- The final pushed agent-memory HEAD is reported by the completing response because this file is part of that commit.

## Pre-Task Manual Confirmation

The user manually tested and confirmed the corrected album carousel on this branch before the task. It advanced exactly one item, settled correctly, synchronized dots/counter, preserved vertical feed scrolling, and retained the current item across resize/rotation. The user also marked the vertical feed, topic-filtered feed/history, video controls auto-hide/show, single-tap play/pause, progress, mute persistence, retry, fullscreen, sharing, APIs/pages, caching/preload, soft-delete behavior, and the existing Eximo diagnosis working. These were protected behaviors, not redesign targets.

## Implemented

### Highest-resolution Telegram photo selection

- `lib/telegram-media-selection.ts` is a pure/testable extraction helper used by `lib/telegram.ts`.
- Telegram photo arrays now choose by `width * height` first and use `file_size` only as the secondary tie-breaker for equal dimensions.
- A larger variant with missing `file_size` beats a smaller variant with a size. Input order does not matter.
- Existing SQLite upsert behavior retains the selected variant's actual `file_id`, `file_unique_id`, width, height, and available file size.
- Image documents retain the original document id and bytes. Their Telegram thumbnail is never stored or rendered as primary media, and thumbnail dimensions are no longer presented as original dimensions.
- Six tests cover missing sizes, smaller sized variants, equal-dimension size ties, unordered arrays, preservation of all selected fields, and original image-document selection.

### Direct images and mobile photo viewer

- Feed/gallery/viewer images are direct protected `/api/media/:id` `<img>` requests; there is no Next Image optimizer, canvas, generated thumbnail, blur/filter, quality transform, fake sharpening, or artificial upscaling.
- Feed images keep `object-fit: contain`, intrinsic aspect ratio, `image-rendering: auto`, and `filter: none`.
- A short photo tap opens a portal fullscreen dialog with the identical full proxy source. It supports pinch zoom, zoomed pan, touch double-tap/mouse double-click zoom, Escape, and a clear close SVG.
- Zoom/pan bounds use the actual contained image box, so letterboxed images cannot be panned off-screen on a non-overflowing axis.
- The feed becomes inert/accessibility-hidden under the modal; Tab is trapped on Close and focus returns to the opener.
- Feed scroll and album index remain unchanged across open/close. More than 6px of image movement suppresses the viewer, including small horizontal album movement.

### Feed topic identity and icon controls

- Topic identity moved to the lower-right above the progress/safe-area region. A reserved left rail prevents intersection with mute/fullscreen controls.
- Avatar and topic name are one persistent link to `/?topic=<message_thread_id>`. Caption stays in the same lower content block.
- Names/captions use automatic text direction/plaintext bidi/start alignment for Hebrew and mixed RTL/LTR text.
- Identity remains visible when playback/post controls auto-hide.
- Missing/failed profile images use deterministic initials and background color; there is no broken-image icon.
- Fullscreen and Share visible text were replaced by conventional circular inline-SVG buttons with 44px targets, aria labels, titles/tooltips, and focus-visible styling. Existing handlers/gating and controls-layer hide/show behavior remain.
- Share still builds a new origin-root URL with only the `topic` key. It never copies access tokens, bot tokens, media proxy URLs, Telegram file URLs, or current-page secrets.
- Feed Menu now has separate `Topics` and `Manage topics` links.
- Feed cache key advanced to v3 only to invalidate old cached topic objects that lack avatar metadata; cache/preload logic otherwise remains.

### Topic profile images

- Added idempotent SQLite migration `007_topic_profile_images.sql` with one metadata row per topic. `lib/db.ts` also repair-creates the table/index.
- Owner uploads accept JPEG/PNG/WebP up to 5 MiB. Server validation enforces MIME, filename extension, Sharp-decoded format/dimensions/full decode, and a 40-megapixel ceiling without re-encoding.
- Files are written mode-restricted under ignored persistent `data/topic-assets/` using UUID-based canonical filenames. Client paths are never storage paths; path resolution enforces a fixed root and strict basename pattern.
- Replacement atomically switches metadata, changes a monotonic versioned URL, and cleans the old inaccessible file best-effort. Failed new uploads clean up strictly. Remove clears metadata/file safely and is idempotent.
- `GET /api/topic-assets/:topicId` uses existing feed access authorization and sends the stored MIME, inline disposition, private cache/ETag, and `nosniff`.
- `POST`/`DELETE /api/admin/topics/profile-image` use existing owner `APP_ACCESS_TOKEN` authorization.
- `/admin/topics` shows current profile/fallback preview plus Upload/Choose, Replace, Remove on desktop/mobile. Existing manual-title Save/Clear remains. A visible Back to topics link was added.
- Zero-media detected topics and General (`message_thread_id 0`) are now included in admin summaries so every detected topic is configurable.
- Topic asset bytes are intentionally not in Git. Backups/server migrations must move SQLite and `data/topic-assets/` together.

### Topics API and gallery

- `/api/topics` returns profile availability/versioned relative URL and optional preview media id/type/MIME/dimensions/relative URL along with existing counts/dates. Returned URLs contain no embedded secrets.
- Preview selection first identifies the latest post containing active media, then selects an active non-too-large image within that post. Hidden/deleted media cannot cover a topic.
- A latest standalone video without a usable thumbnail falls back to the topic profile/generated visual instead of using an older photo. A mixed latest album may use its active photo.
- Admin counts retain existing all-visibility behavior. `/api/media` soft-delete/history semantics were not changed.
- `/topics` is a mobile-first visual gallery: 2 columns mobile, 3 medium, 4 wide, with no horizontal overflow.
- Cover order is latest suitable active image, profile image, deterministic gradient/initials. Full videos are never streamed as static covers.
- Every card keeps its circular avatar, automatic-direction topic name, media/photo/video counts, small thread id/date, primary feed link, and visible History action on screen without hover.
- `/topics` has a visible Manage topics action; `/admin/topics` has the visible return link.

## Carousel Preservation

- The manually validated carousel settle, resize, pointer/touch intent, one-step target, and scroll event functions were not rewritten or simplified. The diff only threads the image-open callback through media rendering and wraps the card for the viewer portal.
- Production browser regression reconfirmed long/normal/reverse swipes move exactly one item, every rest is an exact width multiple, counter/dot/aria stay synchronized, resize preserves item 2, small drag returns without viewer, album viewer open/close preserves item 2, and vertical touch scrolls the feed without changing the album.

## Validation Completed

- `git diff --check`: passed on the final repo tree; rerun in agent-memory before its commit.
- `npm test`: 6/6 passed.
- `npm run typecheck`: passed.
- `npm run build`: passed; existing and new pages/routes compiled.
- Migration 007 idempotency passed. Current ignored DB records 007, contains zero profile rows after tests, and `data/topic-assets/` contains zero test files.
- Production pages returned `200`: `/`, topic-filtered feed, `/topics`, `/history`, topic-filtered history, `/admin/topics`, `/admin/ingest`, and health.
- Feed/topics/admin topics/admin ingest/history API payloads passed. General and zero-media topic 11679 were present in admin; active public topics had the new fields.
- Latest-video topic 6828 returned no obsolete older-photo cover; mixed-album topic 47 retained an active album photo.
- Normal photo media returned `200`; ranged photo/video returned `206`; existing too-large media 115 returned unchanged `413`.
- Latest media 127/message 11764 streamed directly and decoded/browser-rendered at `1080x707`, matching SQLite.
- JPEG/PNG/WebP topic asset upload, versioned serve, replace, safe random basename, owner/feed auth, MIME/decode mismatch rejection, oversize rejection, remove, and cleanup all passed. Browser admin Upload/Replace/Remove and manual title Save/Clear passed with original empty state restored.
- Gallery browser checks passed at 390px/1200px: 2/4 columns, direct latest active covers and correct fallbacks, visible identities/counts/history, exact navigation, RTL, and no overflow.
- Viewer checks passed direct source equality, intrinsic 1080x707, contain/auto/no-filter, modal inert/focus, double-tap zoom, bounded pan, close/focus restore, and scroll retention.
- Feed checks passed lower-right geometry with no mute/fullscreen overlap, persistent avatar link, SVG labels/tooltips, safe share payload containing only `topic`, fullscreen enter/exit, and distinct navigation.
- A supported WebM was substituted only in the temporary browser network layer to reconfirm existing single-tap play/pause, mute state, and control auto-hide/show; application media handling was unchanged.
- `/admin/ingest` still loads; existing cache/preload, soft delete/restore, large-media fallback, source display, captions, and history/feed filtering compile and API checks remained healthy.

## Existing Photo Rows: Honest Limitation

SQLite stores only the one selected Telegram file id/unique id per media row. `webhook_ingest_audit` stores redacted media keys and size, not the original Telegram `photo[]` variants. The Bot API cannot reconstruct discarded alternate file ids from this database. No existing row was claimed or marked as upgraded; affected photos may need to be reposted after the fix.

Authenticated proxy decoding matched these stored recent text-heavy photo dimensions:

- media 121/message 11758: `720x1280`
- media 118/message 11755: `687x1230`
- media 106/message 11743: `396x1280`
- media 102/message 11739: `700x535`
- media 101/message 11738: `591x1280`
- media 98/message 11735: `1080x437`
- media 95/message 11732: `597x866`
- media 94/message 11730: `700x651`
- latest media 127/message 11764: `1080x707`

These checks prove the selected stored file is displayed directly. They cannot prove that an old row retained Telegram's largest historical variant because the other variants no longer exist locally.

Telegram may compress normal `photo` uploads. Sending an image as a Telegram file/document generally preserves the original better, and image documents now always stream that original rather than a thumbnail.

## Explicitly Not Done

- No phone-folder automatic uploader. Future concept: a user-controlled Android folder, discovery/import of new files, and later decisions for folder access, duplicate detection, background execution, topic assignment, and Android/Termux lifecycle.
- No Local Bot API Server or `ffmpeg`. The official Local Bot API Server remains the high-priority >20MB roadmap; current placeholder and Open in Telegram behavior remain.
- No Eximo ingestion fix, X/Twitter fetcher, or workaround.
- No per-user seen/unseen history.
- No AI sharpening/upscale, invented Telegram variants, old-row reconstruction, full-video gallery covers, or permanent Playwright dependency.
- No replacement for query-string media/asset access-token auth in this task.

## Known Limitations / Remaining TODOs

- Replace query-string `access_token` media/asset URLs with Telegram Mini App, cookie, or session auth before broader sharing. Relative API URLs are token-free, but native media elements inherit the existing limitation.
- High priority: deploy Telegram's official Local Bot API Server on persistent hosting for >20MB files; optionally add `ffmpeg` later for compatibility.
- Back up/migrate `data/topic-assets/` with SQLite.
- Repost any older photo whose larger Telegram variant was discarded by the previous selection bug.
- Telegram normal-photo compression cannot be reversed.
- Fullscreen, Web Share, clipboard, pinch/pointer behavior, and private cache eviction remain browser-dependent.
- Eximo diagnosis remains unchanged:
  - user media appears in `/admin/ingest`
  - Eximo media does not appear there
  - Telegram does not deliver Eximo bot messages to this bot webhook
  - this is not a feed/history bug
  - future options remain an owned X/Twitter fetcher, TDLib/MTProto, or replacing Eximo

## Useful Commands And Routes

- `npm test`
- `git diff --check`
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
