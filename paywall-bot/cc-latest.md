# paywall-bot — consolidated diagnostic: Join / Cocoon / Tags / images / source-link / video (2026-06-30)

PART 1 local (main `5d9f741`). PART 2/3 = CI capture (workflow added to main, run via push
branch `diag/run-consolidated`, removed `5d9f741`). Read-only; no bot logic changed.

## (1) JOIN — root cause = AUTHOR_URL hardcoded to the channel
`core/telegraph_pub.py:16-17`: `AUTHOR_NAME="TheMarker"`, **`AUTHOR_URL="https://t.me/demarkerpremium"`**
→ passed to `createPage` (`:268-269`). Telegraph renders the page author/JOIN link as `author_url`
→ it points at the Telegram channel, hardcoded (no per-post / config source). **Fix:** set
`AUTHOR_URL` to the intended Join/channel link (or make it site-config driven).

## (2) COCOON — two foreign filters; label hardcoded Hebrew
- `_extract_cocoon_paragraphs` (`article_parser.py:1463`) collects `<p>/<li>` under containers whose
  class matches `NOISE_ANCESTOR_CLASSES=("ai-summary","cocoon","summary-block","ai-generated")`; light
  filter `_is_noise_text` (ends `_foreign_script_ratio(text) > 0.30 → drop`, counts CJK/Thai/Arabic) +
  length + caption-only drop.
- `_finalize` then runs `_global_clean_paragraph` per cocoon paragraph (char-strips CJK, drops if
  had_foreign & <15 Hebrew). So a **fully-Chinese Cocoon should NOT survive** (dropped twice).
- Label = hardcoded `COCOON_CAPTION_HE="🤖 סיכום AI של TheMarker"` (`telegraph_pub.py:81`), emitted by
  `_build_nodes` only when `cocoon_paragraphs` non-empty; source English "Cocoon AI Summary" is
  replaced inline / dropped if caption-only.
- **CI: could NOT reproduce a Chinese Cocoon.** All sampled `.premium` articles fetch as the
  PAYWALLED teaser (paragraphs=1, cocoon=0) on direct fetch — the Cocoon block lives in the full body
  behind the paywall. Need full-body HTML (the bot's real one3ft/telegram chain) to confirm.

## (3) TAGS — `sites/themarker/tags.py:build_tags(url, title)`
Slot 1 = section tag by URL-path prefix (`SECTION_TAGS`); slots 2-4 = keyword tags by case-insensitive
**substring match on the TITLE** (`KEYWORD_TAGS`: נתניהו/טראמפ/איראן/בנק ישראל/אינפלציה/ריבית/מסים/
בורסה/אבטלה/מלחמה/AI…). Deduped, "themarker" filtered, cap `MAX_TAGS=4`. Inputs = URL + title only.

## (4) BROKEN INLINE IMAGES — NOT reproducible on current main; every image loads
CI ran the parser + an HTTP GET (browser UA) on every chosen src and hero. Across 10 articles:
- **Every HERO → 200 `image/jpeg`** (33-150KB). Not referer-gated.
- The one article with inline images — markets-live "וול סטריט ברצף הירידות…" (`…ed8a`) — had
  **inline_images=3, ALL GET 200 `image/jpeg`** (118-150KB). Its raw `<img>` carried a normal
  `srcset` (`img.haarets.co.il/bs/<id>/…459503683.jpg?&width=420…1500w`); `_select_best_image_src`
  picked a working `img.haarets.co.il` URL → 200 image/jpeg 73KB. **No broken/placeholder/gated src.**
- All `.premium` articles → `inline_images=0`, `raw <img> in body-wrapper: 0` (paywall teaser body).
**Root cause / state:** post-#47 (body-root scope) there are NO broken inline images on these
articles — chosen srcs and heroes all load. The historical "broken squares" were the React
rail/teaser thumbnails #47 now excludes. No lazy-placeholder / thumbnail / gating failure remains in
the sample. **Fix:** none needed for these; if a new broken case appears, capture that exact URL.

## (5) SOURCE LINK (OpenAI/NYT) — INCONCLUSIVE via direct fetch; href-flattening is a code fact
- OpenAI article CONFIRMED: `wallstreet/2026-06-26/.premium/0000019f-029d` →
  TITLE "בעקבות נפילת ספייס אקס: OpenAI מתכוונת לדחות את ההנפקה שלה ל-2027".
- On direct fetch it is the PAYWALLED teaser (paragraphs=1): **NO international `<a href>` and NO
  "לכתבה של"/"הכתבה המקורית"/"לקריאת הכתבה" phrase** appeared, and `intl host preserved in emitted
  nodes = False`. The "read original / לכתבה של ניו יורק טיימס" reference (if present) lives in the
  FULL body behind the paywall, which direct fetch doesn't return. **So whether it is a direct
  `<a href>` vs text-only could NOT be captured** — need the full body via the bot's fetch chain.
- **Code fact (confirmable now):** even if it IS a body `<a href>`, the parser DROPS the href.
  `_extract_paragraphs` builds each paragraph with `_clean(p.get_text(" "))` (anchor href discarded,
  only visible text kept), and `_build_nodes` emits body paragraphs as `{"tag":"p","children":[<str>]}`
  — a plain string, no `<a>` child. The ONLY `<a>` node emitted is the footer "מקור: TheMarker"
  (`original_url`). So any in-body external source link is flattened to text and its href is lost.
  **Fix:** detect an in-body original-source `<a href>` (intl host / "לכתבה של …" pattern) BEFORE
  get_text flattens it, and emit it as a Telegraph `a` node (e.g. a "לכתבה המקורית ב-<source>" link
  near the footer). Confirm the exact element on a full-body fetch first.

## (6) VIDEO-EMBED-TEST — Telegraph ACCEPTED video nodes
gif-as-video mp4 used: `https://gif.haarets.co.il/bs/0000019e-fea1-…/nati-falon-dapa-promotion.gif?&width=576&height=335&format=mp4&cmsprod`.
`createPage` returned **ok=True → https://telegra.ph/VIDEO-EMBED-TEST-06-30** (page has a control
img + `{"tag":"video","attrs":{"src":mp4}}` + a `video[controls]` + a `video>source` variant).
Telegraph's API did NOT reject the `video` nodes. **Eyeball that URL** to confirm whether Telegraph
actually PLAYS an EXTERNAL mp4 (historically Telegraph IV only auto-plays media it has ingested via
upload; external src may render as a non-playing box). Worth pursuing ONLY if the eyeball shows it
plays; otherwise the gif-as-video stays dropped (already handled by #47 body-root scope — these sit
outside `section.article-body-wrapper`).

## Fix summary
1. Join: point `AUTHOR_URL` at the intended link.
2. Cocoon: filters already present; get the offending full-body URL to confirm whether a Chinese
   block bypasses via a non-`NOISE_ANCESTOR_CLASSES` container.
3. Tags: title+URL only (no bug; extend keyword/section coverage if desired).
4. Broken images: resolved by #47; no action.
5. Source link: add in-body original-source `<a href>` capture → Telegraph `a` node (parser
   currently flattens it via get_text); needs a full-body capture to lock the selector.
6. Video: decide after eyeballing telegra.ph/VIDEO-EMBED-TEST-06-30.

## Main state
Wave-1 #42→`3f284d1`; byline+drop-cap #44; **#47 + Codex `9174afe` MERGED**; subhead/video = no-op.
Open: **PR #35**. Temp branches pending MANUAL deletion (proxy blocks git-refs DELETE → 403):
**`diag/run-srclink`**, **`diag/run-brokenimg`**, **`diag/run-consolidated`**. All diag workflows
removed from main. Throwaway page **telegra.ph/VIDEO-EMBED-TEST-06-30** can be deleted by anyone with
the token (not linked from the channel).
