# paywall-bot — FULL-BODY diagnosis (broken images / NYT source link / Chinese Cocoon), 2026-06-30

Run via the bot's **REAL paywall bypass** (`_fetch_one3ft` → `parse_html` → `_finalize` →
`telegraph_pub._build_nodes`), NOT a direct `requests.get` teaser. All 4 articles fetched
full premium bodies (one3ft status=200, html_len ≈ 800–870 KB, `paywalled=False`).
CI: branch `diag/run-fullbody`, run **28430802579** (success). Diagnosis only — no fix pushed,
nothing posted to the channel.

**This supersedes the earlier "#47 resolved broken images" claim** — that was based on
direct-fetch teasers which contain NO precrop'd inline images. The bug below is live in the
full body the bot actually publishes.

---

## A. BROKEN INLINE IMAGES — ROOT CAUSE FOUND (srcset comma-split)

The chosen inline-image `src` for every article with a **`precrop`** image came out as a
mangled relative fragment that 400s, e.g.:

    CHOSEN inline src = 'https://www.themarker.com/news/security/2026-06-29/ty-article/.premium/y0&width=1500&height=1765&cmsprod'
    GET -> status=400 ct='text/html'

The real `<img>` in `section.article-body-wrapper` is fine:

    src    = https://img.haarets.co.il/bs/<id>/.../597493.jpg?precrop=1633,1921,x400,y0&width=420&height=494&cmsprod
    srcset = same URL @ 420w,600w,768w,900w,1180w,1500w

**Mechanism** — `_srcset_largest()` (`core/article_parser.py:1734`, called by
`_select_best_image_src` at line 1804) splits the srcset on a bare comma:

    for chunk in srcset_val.split(","):   # line 1749

But Haaretz/TheMarker image URLs embed commas in the query: `precrop=1633,1921,x400,y0`.
The naive split shatters one entry into garbage chunks:

    'https://img.haarets.co.il/bs/X/597493.jpg?precrop=1633'
    '1921'
    'x400'
    'y0&width=1500&height=1765&cmsprod 1500w'   <-- parsed as URL='y0&width=1500&...' desc='1500w'

The widest-`w` chunk `y0&width=1500&height=1765&cmsprod` wins, then `_resolve_image_url`
resolves that relative string against the article URL →
`https://www.themarker.com/.../.premium/y0&width=1500&...` → **400**.

**Perfectly consistent across the run:**
- precrop in URL  → comma-split → broken fragment → **400** (i_idf, ii_base44 f8dd, highlight
  f977 img#1, iv_openai).
- NO precrop (URL is `...840230-2.jpg?&width=420&...`, no commas) → srcset parses fine →
  valid `img.haarets.co.il` src → **200** (premium fa50 both imgs; f977 imgs #2/#3).

Heroes are unaffected (resolved by a different path) — every hero GET = 200 image/jpeg.

**Fix (targeted, in `_srcset_largest`):** stop splitting on bare `,`. The descriptor is
whitespace-separated from the URL and URLs never contain whitespace, so tokenize on
whitespace instead: walk `srcset_val.split()`, treat a token matching `^[\d.]+[wx],?$` as the
descriptor for the preceding URL token (strip a trailing comma), everything else is a URL
(strip trailing comma). Equivalent: split entries on `,\s+` (entry-separator commas are always
followed by whitespace; the `precrop` commas are not). Add a regression case with a
`precrop=W,H,xX,yY` srcset asserting the chosen URL stays on `img.haarets.co.il` and keeps the
full query.

---

## B. NYT SOURCE LINK — REPRODUCED & CONFIRMED FLATTENED

Article iv `wallstreet/2026-06-26/.premium/0000019f-029d` ("בעקבות נפילת ספייס אקס: OpenAI…"):

    INTL <a href>: 1 ; phrase-<a>: 1
    href='https://www.nytimes.com/2026/06/25/technology/openai-ipo-artificial-intelligence.html'
    text='לכתבה של ניו יורק טיימס'  in_body=True
    intl host preserved in emitted nodes: FALSE

- It is a **direct `<a href>` to nytimes.com** (NOT a TheMarker redirect) sitting inside
  `section.article-body-wrapper` (`in_body=True`), anchor classes obfuscated
  (`x1bvjpef x41m6fz …`).
- Position: end of body — `"…מגיעים מהמגזר העסקי. לכתבה של ניו יורק טיימס כתבות מומלצות…"`
  (immediately before the "כתבות מומלצות" recommended-articles block).
- **`_build_nodes` flattens it**: `intl host preserved = False`. The paragraph extractor
  pulls text via `get_text`, so the phrase "לכתבה של ניו יורק טיימס" survives as plain text in
  a `p` node but the `nytimes.com` href is dropped. Only the footer `<a>` (= `original_url`)
  survives.

**Fix:** capture the in-body source anchor before paragraph flattening. Precise selector:
an `<a href>` inside `section.article-body-wrapper` whose visible text matches one of the
source phrases (`"לכתבה של"`, `"לכתבה המקורית"`, `"הכתבה המקורית"`, `"לקריאת הכתבה"`, `"במקור"`)
**and** whose host is external (not themarker.com / haaretz.co.il). Emit it as a real
`{"tag":"a","attrs":{"href":…}}` node (e.g. an extra footer line "כתבה מקורית: NYT", or preserve
the anchor inline within its paragraph). Do NOT rely on the obfuscated CSS classes — match on
phrase + external host.

---

## C. CHINESE COCOON — NOT REPRODUCED in the candidates tried

Both Wall-Street candidates pulled full bodies with **zero** CJK:

    [iii_wallst] wallstreet/2026-06-29/…/0000019f-1195  TITLE='עליות בבורסות אירופה; הנפט יורד ב-1%'
       elements with >=3 CJK chars: 0 ; _extract_cocoon_paragraphs -> 0 ; CJK survived: none
    [iii_wallst] markets/2026-06-26/…/0000019f-02c7      TITLE='הבורסה בת"א נעלה את שבוע המסחר…'
       elements with >=3 CJK chars: 0 ; _extract_cocoon_paragraphs -> 0 ; CJK survived: none

Neither title matches the reported article ("וול סטריט ננעלה בעליות … נאסד""ק"). **I did not hit
the right article** — the Chinese Cocoon remains UNREPRODUCED. Next attempt must resolve the
exact source URL by its title from the feed/state/posted-GUIDs (the precise "וול סטריט ננעלה
בעליות" item), then re-run this same harness. The CJK trace block in `diag-fullbody.yml`
(elements with ≥3 CJK chars → class chain → `NOISE_ANCESTOR_CLASSES` membership →
`_foreign_script_ratio`/`_is_noise_text`/`_global_clean_paragraph` → survival bucket) is ready
and will pinpoint which filter it bypasses once the right URL is used.

---

## Per-article summary (full body, post-`_finalize`)
| key | title (short) | paras | inline | hero | inline GETs |
|---|---|---|---|---|---|
| i_idf | צה"ל רוכש מאות מכ"מים | 5 | 1 | 200 | 1×**400** (precrop) |
| ii_base44 f8dd | מרב בהט / אסף רפפורט | 6 | 1 | 200 | 1×**400** (precrop) |
| ii_base44 f903 | סמוטריץ' מענקי גישור | 13 | 0 | 200 | — |
| ii_base44 f977 (.highlight) | השקעות סקויה | 14 | 3 | 200 | 1×**400** (precrop) + 2×200 |
| ii_base44 fa50 | רכש נתח מספייס־אקס | 26 | 2 | 200 | 2×200 (no precrop) |
| iii_wallst 1195 | עליות בבורסות אירופה | 10 | 0 | 200 | — (no CJK) |
| iii_wallst 02c7 | הבורסה בת"א נעלה | 6 | 0 | 200 | — (no CJK) |
| iv_openai 029d | OpenAI דוחה הנפקה | 10 | 1 | 200 | 1×**400** (precrop) + NYT link |

---

## Main / repo state
- Main is **clean** of any diag workflow. `diag-fullbody.yml` never landed on `origin/main`
  (integration token can't `workflow_dispatch`; the main push was non-fast-forward). The
  diagnostic ran via a **push-trigger temp branch** instead — nothing to remove from main.
- **PR #53** (Join CTA → author_url = source URL) OPEN, branch `claude/join-author-url`,
  head `ac6f57e`. Awaiting CI + owner merge.
- **PR #35** (old capture diag) still OPEN.
- Telethon throwaway page `telegra.ph/VIDEO-EMBED-TEST-06-30` still around (video-node eyeball).
- Two fixes now fully evidenced and ready to implement (separate small PRs):
  1. `_srcset_largest` comma-split → broken inline images (Section A).
  2. in-body external source `<a href>` flattened by `_build_nodes` → NYT link lost (Section B).
- **Temp branches pending MANUAL deletion** (proxy blocks git-refs DELETE → push hangs up):
  `diag/run-fullbody`, `diag/run-srclink`, `diag/run-brokenimg`, `diag/run-consolidated`
  (also stale: `diag/telethon-vs-posted-guids`).
