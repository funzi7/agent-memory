# paywall-bot — Telegraph formatting map (READ-ONLY code dump, 2026-06-29)

Input for Wave-2 formatting fixes (bold+underline subheads, external source link,
right-align-when-starts-English, media credits). Local code read at main `132b117`.
No code changed.

## 1. SUBHEADINGS — currently DROPPED
`core/article_parser.py:_extract_paragraphs` (2062-2114) walks **only `c.find_all("p")`**
within containers `("article",".article-body","main")`. So body `<h3>/<h4>` (and any
`<strong>`-only "subhead" paragraph that isn't a `<p>`) are **never captured** — silently
dropped. Each kept `<p>` becomes a flat `{"tag":"p","children":[text]}` node.
- `<h1>` → page TITLE only: `_extract_title` (1413-1423; `og:title` → `h1.article-header__title`
  → `h1`). Becomes the Telegraph `title` field, NOT a content node.
- `<h2>` → SUBTITLE: `_extract_subtitle` (1426-1455; `meta[description]` → `h2.article-header__sub-title`
  → first `<article> h2`). Rendered as ONE `blockquote` node.
- `<h3>/<h4>` / strong-only subheads: **no extraction path at all.** No heading node tag is
  emitted anywhere. (For Wave-2 bold+underline subheads, they must first be captured — currently
  there is nothing to format.)

## 2. TELEGRAPH ASSEMBLY + RTL
`core/telegraph_pub.py:_build_nodes` (95-176) — ORDERED node list:
1. hero `figure > img` (if `hero_image_url`)
2. subtitle `blockquote` (if `subtitle`)
3. Cocoon block (if `cocoon_paragraphs`): `p > strong`=`COCOON_CAPTION_HE` then each `p > em`
4. byline `p > strong` = `"מאת: {author}"` (if `author`)
5. inline images anchored at index 0 (figure[+figcaption])
6. body paragraphs: each `{"tag":"p","children":[p]}`, followed by its anchored inline-image figures
7. `hr`
8. footer `p` = `"מקור: "` + `{"tag":"a","attrs":{"href":original_url},"children":["TheMarker"]}`

`publish_article` (179-277) re-cleans title/subtitle/author/paragraphs/cocoon/captions via the
global cleaner, clamps title to 256, then `_post("createPage", {access_token,title,author_name,
author_url,content=json.dumps(nodes),return_content:false})`.

(b) **SOURCE URL in scope: YES** — `original_url` is a `_build_nodes` param and is ALREADY used
in the footer `a` node ("מקור: TheMarker"). An additional/external source-link node is trivial to
append (everything needed is already present at assembly time).

(c) **RTL / direction mechanism: NONE.** No `dir=`, no `direction`, no RLM/RLE/PDF bidi marks
injected, no leading direction char, no wrapper node, no `align`. Grep confirms: the only bidi
references in the codebase are in `core/article_parser.py` — `_CAPTION_SEP` (810) and
`_ZERO_WIDTH_STRIP` (~816) — and those only MATCH the Cocoon caption / STRIP zero-widths; they do
NOT set page direction (LRM/RLM U+200E/U+200F are deliberately preserved in text, never used to
align). Direction relies **entirely on Telegraph's default + the Hebrew characters themselves**
(browser bidi auto-renders Hebrew RTL). Consequence: a paragraph that STARTS with English/Latin
renders LTR-aligned — there is no current right-align mechanism (this is the Wave-2 gap).

## 3. FIGCAPTION / MEDIA CREDIT
- Inline-image figcaption: `_extract_inline_images` (2024-2030): `el.find("figcaption")` →
  `_clean(fc.get_text(" "))`, fallback to img `alt` then `title`; cleaned via
  `_global_clean_paragraph` → stored as `InlineImage.caption`. Rendered by
  `_inline_image_figure_node` (telegraph_pub.py:84-92) as `{"tag":"figcaption","children":[caption]}`
  inside the `figure`.
- Standalone photo-credit `<p>`: `NOISE_PHOTO_CREDIT_RE = re.compile(r"^צילום\s*:")`
  (article_parser.py:101); dropped by `_is_noise_text` (1351-1359) ONLY when the paragraph STARTS
  with "צילום:" AND is short (`< NOISE_PHOTO_CREDIT_MAX_LEN`). Inline "(צילום: …)" inside a longer
  paragraph is preserved.
- **"וידאו:" / "עריכה:" have NO dedicated handling** — they are not in the credit-drop rule; a
  standalone "וידאו:"/"עריכה:" line is only dropped if it trips another noise rule, else kept.
- `<video>` credit lives in the tag's `title="צילום: …"` attribute and is NOT extracted (video tags
  aren't processed; only `<img>` alt/title). So no video-credit text leaks today.

## 4. Telegraph node tags CURRENTLY emitted (telegraph_pub.py)
`figure, img, blockquote, p, strong, em, a, hr, figcaption`.
- In use for emphasis: **`strong`** (caption/byline), **`em`** (cocoon). Links: **`a`**.
- NOT yet used (available in Telegraph IV): **`h3`, `h4`, `u` (underline)**, `b`, `i`, `aside`,
  `iframe`, `ul/ol/li`, `s`. → Wave-2 bold+underline subheads can use `strong`+`u` (or `h3`/`h4`);
  underline `u` is currently unused and available.

## Main state
Wave-1 merged (#42 → `3f284d1`); short-flash `06558d4`, numeric-drop `0334040`; byline+drop-cap
#44 merged; Codex byline-narrow `72952f2`. **PR #47 (inline-image body-root scope, `35b1c92`)
PENDING merge.** Video = **no-op**: handled by #47's body-root scope (gif-as-video sit in rail
cards outside `section.article-body-wrapper`); no Telegraph-embeddable players in the sampled
articles, so no video node work needed now. Image-rail + video diag workflows added/removed.
