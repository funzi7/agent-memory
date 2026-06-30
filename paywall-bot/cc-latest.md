# paywall-bot — Join CTA fix (PR #53, 2026-06-30)

Status: **PR #53** OPEN → main, branch `claude/join-author-url`, head **`ac6f57e`**. Not merged
(owner merges after CI green + Codex). Fixes ONLY the Telegraph Join CTA.

## Fix — author_url = source URL, channel link removed
`core/telegraph_pub.py` hardcoded `AUTHOR_URL = "https://t.me/demarkerpremium"` and passed it as
`createPage`'s `author_url`, so Telegraph rendered the page byline as a **"Join" CTA** to the channel.
- **`core/telegraph_pub.py:16-17`** — removed the `AUTHOR_URL` constant (replaced with a NOTE: never
  set author_url to the t.me channel). `AUTHOR_NAME = "TheMarker"` unchanged.
- **`core/telegraph_pub.py:~74`** (`_ensure_account` → `createAccount`) — `author_url` now `""`.
- **`core/telegraph_pub.py:~270-276`** (`publish_article` → `createPage`) — `author_url` now
  **`original_url or ""`** (the article's TheMarker source URL, same link as the footer
  "מקור: TheMarker"). Non-t.me author_url removes the Join CTA and links the byline to the source.
  Empty fallback when no source URL; the t.me channel is NEVER emitted. (Per-page author_url
  overrides the account-level default on every page.)

## Test
`test_r1r1r_join_author_url_is_source_not_channel` (registered as **S1S1S**): patches
`_ensure_account`/`_post`, calls `publish_article`, asserts captured `createPage` `author_url` ==
source URL, `!= "https://t.me/demarkerpremium"`, no `t.me/`, `author_name=="TheMarker"`; plus the
empty-`original_url` → `""` fallback. Full suite **152/152** green. Only `core/telegraph_pub.py` +
`tests/test_message_format.py` changed.

## Main state
Wave-1 #42→`3f284d1`; byline+drop-cap #44; **#47 + Codex `9174afe` MERGED**; subhead/video = no-op;
broken-images resolved by #47 (every hero+inline src GETs 200 image/jpeg). Still pending / open:
- **PR #35** (old capture diag) open.
- **PR #53** (this Join fix) open, awaiting CI+merge.
- Source-link (NYT) fix: deferred — parser flattens in-body `<a href>` via get_text; needs a
  full-body (non-paywalled) capture to lock the selector.
- Cocoon Chinese-block: unreproduced (premium bodies truncate on direct fetch); two foreign filters
  present.
- Throwaway page **telegra.ph/VIDEO-EMBED-TEST-06-30** (Telegraph accepted video nodes; eyeball if
  external mp4 actually plays before pursuing video embeds).
- Temp branches pending MANUAL deletion (proxy blocks git-refs DELETE → 403):
  **`diag/run-srclink`**, **`diag/run-brokenimg`**, **`diag/run-consolidated`**.
