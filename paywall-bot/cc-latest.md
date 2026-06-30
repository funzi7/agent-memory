# paywall-bot — srcset + source-link fixes (PR #54, 2026-06-30)

Status: **PR #54** OPEN → main, branch `claude/srcset-and-source-link`. Not merged (owner merges
after CI + Codex). Two confirmed fixes from the full-body diagnosis (prev memory `45cdeb0`).
Suite `python3 -m tests.test_message_format` green.

## FIX A — broken inline images: srcset comma-split (precrop)
`core/article_parser.py` `_srcset_largest` (~line 1734) split `srcset` on a **bare comma**.
Haaretz/TheMarker image URLs embed commas in the query (`...?precrop=1633,1921,x400,y0&...`),
so one entry shattered; a fragment `y0&width=1500&cmsprod 1500w` won and `_resolve_image_url`
made it a broken relative URL `https://www.themarker.com/.../.premium/y0&width=1500&...` →
**HTTP 400** → broken square. No-precrop URLs (no commas) parsed fine → 200 (why it was missed).
- **Fix:** tokenize on **whitespace**, not commas. URLs never contain whitespace; descriptor is
  whitespace-separated. Token matching `^[\d.]+[wx],?$` = descriptor for the preceding URL
  token; else a URL; strip trailing entry-separator comma; `precrop` commas stay in the URL.
  Full query preserved. Density `2x` + descriptor-less srcsets still handled.

## FIX B — in-body external source link flattened (NYT "לכתבה של")
Direct `<a href="nytimes.com">לכתבה של ניו יורק טיימס</a>` inside `section.article-body-wrapper`
was flattened by paragraph extraction (`get_text`) → phrase survived as text, href dropped.
- **New** `core/article_parser.py` `_extract_source_link(soup, base_url)` — first in-body
  `<a href>` whose visible text contains a phrase in `_SOURCE_LINK_PHRASES`
  (`לכתבה של`/`לכתבה המקורית`/`הכתבה המקורית`/`לקריאת הכתבה`/`במקור`) **and** whose host is
  external (NOT in `_DOMESTIC_SOURCE_HOSTS` = themarker.com/haaretz.co.il/haaretz.com/t.me).
  Matched on **phrase + external host**, never the obfuscated CSS classes. Returns
  `{"href","label"}`; label from `_SOURCE_LABEL_BY_HOST` (nytimes→ניו יורק טיימס, bloomberg→בלומברג,
  reuters→רויטרס, ft→פייננשל טיימס, wsj→וול סטריט ג'ורנל, economist→אקונומיסט) else anchor text.
- **`ParsedArticle.source_link: dict|None`** (new field, ~line 366); set in `parse_html` (~2336).
- **`core/main.py`** two `publish_article` call sites (~409, ~557) pass `source_link=parsed.source_link`.
- **`core/telegraph_pub.py`** `publish_article` (~209) re-cleans the **label** via
  `_global_clean_paragraph` (href untouched; empty label → drop); `_build_nodes` (~105) emits a
  real `{"tag":"a","attrs":{"href":…}}` node `"כתבה מקורית: <label>"` next to the footer.
  Domestic-phrase links ignored; no link → no-op.

## Tests (tests/test_message_format.py)
- **T1T1T** `test_t1t1t_srcset_precrop_commas_not_split` — precrop srcset → chosen src is the
  full 1500w `img.haarets.co.il` URL with `precrop=…` intact, host preserved, not a fragment;
  + `_select_best_image_src`/`_resolve_image_url` end-to-end stays on CDN; + descriptor-less/2x.
- **U1U1U** `test_u1u1u_in_body_external_source_link_emitted_as_anchor` — NYT `<a>` →
  `parsed.source_link` host nytimes.com + label "ניו יורק טיימס", `_build_nodes` emits the
  nytimes `<a>`; domestic themarker link with same phrase → `source_link is None`, no ext anchor.

## Main / repo state
- **PR #53** (Join CTA → author_url = source URL) **MERGED** to main (`bca520b`). Telegraph
  byline no longer a t.me "Join" CTA.
- **PR #54** (this) OPEN, branch `claude/srcset-and-source-link`. Awaiting CI + merge.
- **PR #35** (old capture diag) still OPEN.
- **Chinese Cocoon**: still UNREPRODUCED — both Wall-St candidates pulled full bodies with 0
  CJK and neither title matched "וול סטריט ננעלה בעליות … נאסד\"ק". Next: resolve the exact
  source URL by title from feed/state/posted-GUIDs, re-run the `diag-fullbody.yml` CJK trace.
- **Video**: confirmed plays gif-style (Telegraph accepted video nodes;
  telegra.ph/VIDEO-EMBED-TEST-06-30).
- Heroes unaffected by FIX A (different resolve path) — all hero GETs 200 image/jpeg.
- **Temp branches pending MANUAL deletion** (proxy blocks git-refs DELETE → push hangs up):
  `diag/run-fullbody`, `diag/run-srclink`, `diag/run-brokenimg`, `diag/run-consolidated`
  (also stale: `diag/telethon-vs-posted-guids`). Main carries no diag workflow.
