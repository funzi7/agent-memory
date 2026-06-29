# paywall-bot — video DOM capture (CI diagnostic, 2026-06-29)

READ-ONLY capture in GitHub Actions (agent egress blocks article hosts). One-shot workflow
added to main (`c114fda`), dispatched via push-triggered temp branch `diag/run-video`, then
REMOVED from main (`5cdcaa9`) and the temp branch deleted. Feed scanned:
`https://www.themarker.com/cmlink/1.144` (100 entries, first 20 fetched via direct).

## How often recent articles contain "video"
**20 / 20** scanned articles flagged HAS_VIDEO=YES — but every hit was a `<video>` TAG, and
**0 / 20 had any iframe player** (no YouTube / Vimeo / Twitter / jwplayer / brightcove /
dailymotion / kaltura embed in the whole sample). The ubiquity is because TheMarker renders
decorative **GIF-as-video** elements (and rail-card teasers) as `<video>`, not because real
embedded players are common. Genuine third-party video embeds were absent in this sample.

## Sample video DOM (first hit: markets/2026-05-28/…0000019e-6ee7-…)
(A) container outerHTML — it is a GIF-as-video, NOT a player:
```html
<video aria-label="פאלון גונג" autoplay
  class="… x1gq9eym no-print"
  data-src="https://gif.haarets.co.il/bs/0000019e-fea1-…/nati-falon-dapa-promotion.gif?&width=576&height=335&format=mp4&cmsprod"
  data-testid="gif-as-video" height="606" loop muted playsinline
  poster="https://gif.haarets.co.il/bs/0000019e-fea1-…?…&frame=1&cmsprod"
  title="צילום: עיצוב: אורן אימגור" width="1042"></video>
```
- (B) iframe src / `<video><source>` / embed id: **NONE** (empty) — no `<source>`, no
  `data-video-id`; the media URL lives in `data-src` = `gif.haarets.co.il/…/*.gif?…format=mp4&cmsprod`.
- (C) ancestor chain: `… > main.article-page > div > section…xybk0e9 > section…x1mjqqkp > article.x…`.
  `article-body-wrapper present: True` but **video INSIDE body wrapper: False** — the gif-video
  sits in a teaser/rail `<article>` card (same hashed-class React rail structure as the images),
  NOT inside `section.article-body-wrapper`. It also carries `no-print`.
- (D) nearby caption/credit text: none in the container; the credit is in the tag's own
  `title="צילום: עיצוב: אורן אימגור"` attribute (an attribute, not body text).

## Stray video credit from the CURRENT parser
Ran `parse_html` → `_build_nodes` on the sample: paragraphs=1, inline_images=5, author=None,
and **NO STRAY** "וידאו על ידי" / "וידאו" / "עריכה" / iframe / youtube / vimeo text in the
emitted nodes. So there is **no video-credit text leak today** — the gif-video `title`
credit ("צילום: …") does NOT reach the body text. (This run was on current main, pre-#47, so
the inline_images=5 are rail teasers — the separate image bug PR #47 fixes; unrelated to video.)

## RECOMMENDATION for the video fix
- The dominant TheMarker "video" is a **GIF-as-video** (`data-testid="gif-as-video"`, autoplay/
  loop/muted, `gif.haarets.co.il/…format=mp4`), usually in a rail card outside the body wrapper
  and marked `no-print`. There were **no Telegraph-embeddable iframe players** (YouTube/Vimeo/
  Twitter) in the sample.
- **Body-root scoping (PR #47) already neutralizes the common case:** since image/figure
  extraction now roots at `section.article-body-wrapper` and these gif-videos sit OUTSIDE it
  (rail cards, `no-print`), they are not surfaced. Keep relying on that scope.
- For any `<video>`/gif-as-video that IS inside the body wrapper: **DROP the player** — Telegraph
  cannot reliably embed a raw `<video>`/gif-mp4 as a player node, and these are decorative. Do
  NOT emit the `data-src` gif/mp4, and do NOT surface the `<video title="צילום: …">` credit or
  any adjacent "וידאו: / וידאו על ידי / עריכה" figcaption (clean/drop it via the existing
  paragraph cleaner if a future path ever exposes it).
- **IF** a genuine Telegraph-embeddable provider appears (iframe whose src is youtube/youtu.be/
  player.vimeo/twitter): emit a Telegraph `iframe` node with the provider URL (`/embed/<id>`),
  positioned at its body anchor — but treat this as the rare path, gated on the player domain
  allowlist; everything else (gif-as-video, unknown players) → drop + clean credit.
- No `<video>`-credit leak exists today, so the credit-cleaning is defense-in-depth, not an
  active bug to chase.

## Current main state
Wave-1 merged (#42 → `3f284d1`); short-flash `06558d4` + numeric-drop `0334040`; byline+drop-cap
#44 merged; Codex byline-narrow `72952f2`; image-rail diag added/removed (`07c6427`→`c2ed0cb`);
**PR #47 (inline-image body-root scope, `35b1c92`) is OPEN/pending merge**; video diag added/
removed (`c114fda`→`5cdcaa9`). No video code written yet (diagnosis only).
