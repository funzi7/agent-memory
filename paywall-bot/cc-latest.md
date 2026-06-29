# paywall-bot — image-rail DOM capture (CI diagnostic, 2026-06-29)

READ-ONLY capture run in GitHub Actions (agent egress blocks article hosts; CI egress
is open). One-shot workflow added to main (`07c6427`), dispatched via a push-triggered
copy on temp branch `diag/run`, then REMOVED from main (`c2ed0cb`) and the temp branch
deleted. Captured URL: `https://www.themarker.com/news/security/2026-06-28/ty-article/0000019f-0ee9-da41-ab9f-2fed40a90000`
(the Rafael/Romania SPYDER deal article; direct fetch 200). Parser fns run UNMODIFIED.

Current main state: Wave-1 merged (#42 → `3f284d1`); short-flash `06558d4` + numeric-drop
`0334040`; byline+drop-cap #44 merged; Codex byline-narrow `72952f2`.

## THE ROOT CAUSE (decisive)
TheMarker is a React/Meta-stack page. `_extract_paragraphs` and `_extract_inline_images`
both select containers with `("article", ".article-body", "main")`. On this DOM that is
catastrophically broad:
- the page root is `<main class="article-page …">` (selector `main` grabs the WHOLE page);
- EVERY related / most-read / teaser card is its OWN `<article>` element carrying only
  Meta-hashed atomic classes (e.g. `x1uczgqu x1mk7zoj … xpiheen xemlk5x`), some also
  `.no-print` — so selector `article` grabs all the rails too.
`_extract_inline_images` saw **23 `<img>` across the matched containers**. The FIRST 5 in
DOM order are RAIL/teaser thumbnails, which fill `_INLINE_IMAGE_MAX_COUNT = 5` and are
KEPT; the genuine body photo is then DROPPED ('cap'). So the "body images" published are
actually related-article rail teasers, and the real lede photo is lost.

## (1) EXACT class names
- **Rail/teaser image cards:** nested `<article>` with ONLY hashed classes, e.g.
  `article.x1uczgqu.x1mk7zoj.x1wfwxd8.…xpiheen.xemlk5x` (and variants ending `.no-print`,
  `.x1fc8kun`, `.x117zp41`). Inner: `> a.x1n2onr6.x1vjfegm > img.x1mraiob.xxymvpz.xt7dq6l.x193iq5w.xh8yej3`.
- **Page root:** `main.article-page.x14eghgn.…` (stable token: `article-page`).
- **REAL body root (stable):** `section.article-body-wrapper.xjp7ctv` — the genuine body
  `<figure>`/photo lives under `… > section.article-body-wrapper > figure… > img`.
- Hashed `x…` classes are unstable build artifacts — DO NOT key on them. Stable tokens
  observed: `article-page`, `article-body-wrapper`, `no-print`.

## (2) Ancestor chains — kept (rail) vs real body
KEPT inline images (all 5 — these are the BUG; teasers, not body photos):
```
article.<hashed…xemlk5x> > a.x1n2onr6.x1vjfegm > img.x1mraiob.xxymvpz.xt7dq6l.x193iq5w.xh8yej3
```
their srcs are teaser thumbs with DIFFERENT article-ids than the body, e.g.
`https://www.themarker.com/news/security/2026-06-28/ty-article/y132&width=568&height=…`
and `https://img.haarets.co.il/bs/0000019e-f0a0-…`, `…/bs/0000019f-0db3-…`.

Real BODY photo (DROPPED, reason cap/dup — equals hero):
```
main.article-page.… > div.… > section.…xybk0e9 > section.…x1ei77yq.x13tpwow.x1jc3sgu.…
  > section.article-body-wrapper.xjp7ctv > figure.x12ds5z6.…x40r8a > div.x1n2onr6
  > div.x1hc1fzr.… > img.x1mraiob.…x1huxd7x
```
src = hero `https://img.haarets.co.il/bs/0000019f-0ef2-… /e5/be/107646fc` (hero on page is
`…/0000019f-0ee9-…/107646fc`).

## (3) STEP-1(D) verdict
`rail is INSIDE a body container (article/.article-body/main)? True` →
**TRAILING/NESTED-WITHIN-ARTICLE**, because `<main>` and the teaser `<article>` cards all
match the broad selector. The rails are NOT a clean separate sibling the parser already
excludes — they are pulled IN by the selector itself. Positional scoping ("after last body
¶") alone is therefore insufficient; the fix must scope to the real body root.

## (4) Broken/rail image src patterns
- themarker responsive thumbs: `https://www.themarker.com/…/ty-article/yNNN&width=568&height=…`
  (also `width=317`, `width=112`) — teaser/rail sizes.
- haaretz CDN with OTHER article-ids: `https://img.haarets.co.il/bs/<other-id>/…`.
These are exactly the images currently mis-published as body photos (the קניון-style breakage:
non-body teaser URLs / wrong-article CDN ids reaching Telegraph).

## WHAT THE IMAGE FIX SHOULD KEY ON
1. **Scope inline-image extraction to the REAL body root**, identified by the STABLE class
   **`article-body-wrapper`** (`soup.select_one("section.article-body-wrapper")`, fall back to
   `.article-body`/`main`/`article` only if absent). Walk `<figure>`/`<img>` ONLY within that
   subtree — this drops every nested-`<article>` teaser and the `<main>`-level rails in one move.
   The genuine body photo lives there.
2. **Add `no-print` to the structural-noise ancestor tokens** (`NOISE_STRUCTURAL_ANCESTOR_CLASS_TOKENS`)
   as defense-in-depth — it stably marks non-print UI (gift button, rails, dialogs, related).
3. Do **NOT** rely on the hashed `x…` classes (unstable). The existing token blocklist
   (related/recommended/most-read/…) does not fire here because the cards use only hashed
   classes + `no-print`; body-root scoping is the real fix, token-exclusion is the backstop.
4. After scoping, the `_INLINE_IMAGE_MAX_COUNT=5` cap will no longer be consumed by rails, so
   the real lede figure (currently dropped) will surface.

(Body text was fine: 7 Hebrew paragraphs [0..6] about רפאל/ספיידר/רומניה; hero resolved.)
