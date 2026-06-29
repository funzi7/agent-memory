# paywall-bot — inline-image body-root scoping fix (PR #47, 2026-06-29)

Status: **PR #47** OPEN → main, branch `claude/image-body-scope`, head **`35b1c92`**.
Not merged (owner merges after CI green + Codex). Fixes ONLY `_extract_inline_images`.

## The fix
`_extract_inline_images` (`core/article_parser.py` ~:1880) no longer re-selects the broad
`("article", ".article-body", "main")` set (which on TheMarker's React DOM swept the whole
page: `<main class="article-page">` + every related/teaser card as its own hashed-class
`<article>` + `no-print`). It now roots the walk at the **stable body subtree**:
```python
body_root = soup.select_one("section.article-body-wrapper")
if body_root is not None:
    containers = [body_root]
else:
    containers = [all .article-body elements]      # multi-container bodies still concatenate
    if not containers:
        containers = legacy ("article",".article-body","main")  # last resort
```
- Keys on the **stable** class `article-body-wrapper` (then `.article-body`), NOT the unstable
  hashed `x…` classes. Drops every nested-`<article>` teaser and the `<main>`-level rails.
- `.article-body` fallback keeps ALL matching containers so a body split across sibling
  `.article-body` elements still works (rails are `<article>`/`<main>`, never `.article-body`).
- Added **`no-print`** to `NOISE_STRUCTURAL_ANCESTOR_CLASS_TOKENS` (`core/article_parser.py:69`)
  as a defense-in-depth backstop for the legacy fallback path (rail cards carry `no-print`).
- Unchanged: per-image filters (url blocklist, dim<`_INLINE_IMAGE_MIN_DIM`, src==hero,
  dup-src, `_INLINE_IMAGE_MAX_COUNT=5`), `_select_best_image_src`, `_extract_paragraphs`.

One-line effect: freeing the cap-5 from rail teasers **surfaces the real lede figure** again
(pre-fix the first 5 of 23 imgs were rail teasers that filled the cap and were published as
body photos while the genuine lede photo was dropped).

## Tests (tests/test_message_format.py) — fail-before/pass-after
- **O1O1O** body-root scope drops the 5 React rail cards; body figure == hero → inline list
  empty, zero rail srcs leak.
- **P1P1P** non-hero second body figure under the wrapper IS kept; no rail src kept.
- **Q1Q1Q** legacy fallback (no wrapper / no `.article-body`): `no-print` token excludes rails.
Full suite **148/148** green (prior multi-`.article-body` test C1C1C still passes).

## Current main state
Wave-1 merged (#42 → `3f284d1`); short-flash `06558d4` + numeric-drop `0334040`; byline+drop-cap
#44 merged; Codex byline-narrow `72952f2`; diag workflow added/removed (`07c6427`→`c2ed0cb`).
This image-scoping fix is PR #47 (`35b1c92`), awaiting merge.

## Still pending
**Video handling** is not addressed — needs a CI DOM capture of a video-containing TheMarker
article (embedded player / `<video>` / iframe) before deciding how to surface or skip it.
The image-rail capture URL used was the Rafael/Romania SPYDER article (no inline video).
