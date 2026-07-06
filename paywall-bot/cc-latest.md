# paywall-bot — postmortem of 5 defective posts, 2026-07-03→06 (READ-ONLY, 2026-07-06)

Step A = production poll-run logs (verbatim POST-RECORD); Step B = CI re-fetch via the SAME
winning fetcher + existing parser UNMODIFIED (temp branch `diag/run-post5`, run **28798426385**,
success; **branch self-deleted from within CI** — "temp branch deleted"; nothing throwaway
remains). No fixes written. CONTEXT.md §6 updated on main (`b55911e`, docs-only).

## Per-target: winning fetcher (Step A, verbatim POST-RECORD)
| target | article | run | POST-RECORD |
|---|---|---|---|
| (i) primaries/Likud-deal | news/politics/2026-07-05/.premium/…2d27 ("אותו נקנה, אותו נעיף…") | 28740441107 @07-05 12:16 | `source=one3ft paras=29 chars=6614 cocoon=0 author=no subtitle=yes images=4` |
| (ii) AI-lawyer | wallstreet/2026-07-03/.premium/…1829 (og:title "מה קורה כשאנשים מייצגים את עצמם בבית המשפט — עם AI כעורך דין") | posted 07-03 ~21:57 (run 72ac1f7-commit) | source resolved by og:title in CI; posting-run log not pulled (older run), all sibling posts that day = one3ft |
| (iii) "איתות עצבני בשוק ה-AI" | wallstreet/2026-07-04/ty-article-magazine/.premium/…2d0e | 28733904156 @07-05 07:52:36 | `source=one3ft paras=13 chars=5086 cocoon=0 author=no subtitle=yes images=4`; telegraph_url logged verbatim |
| (iv) Buffett/managers | markets/2026-07-05/.premium/…308c ("הם מוכרחים לחייך…") | 28749709636 @07-05 17:57:06 | `source=one3ft paras=17 chars=2591 cocoon=0 author=no subtitle=yes images=2` |
| (v) Koi-Security lawsuit | technation/2026-07-05/.highlight/…31ca-dd48 | 28743913741 @07-05 14:26:00 | `source=one3ft paras=11 chars=3174 cocoon=0 author=no subtitle=yes images=1` |

No QUALITY-GATE / TEASER-GATE / TALKBACK-GATE line fired near any of these posts. (Bonus find:
markets/…3191 was jina-REJECTED in-chain 4× — "jina rejected for premium URL (talkback section
present)" — then permanent_fail @07-05 20:06:26 after smry-timeout + one3ft-503 + wayback-404;
the #58 defenses are working.)

## (i) SPACE INJECTION — PROVEN: our `get_text(" ")` join, not source text
Raw source `<p>` (one3ft, verbatim):
```
'קחו למשל את ח<a class="x1bvjpef …" href="/news/politics/…0000019f-1d93…">וק יסוד: לימוד תורה, השנוי במחלוקת</a>. זה עבר בקריאה ראשונה…'
```
TheMarker's in-body anchor starts MID-WORD ("…את ח" + `<a>`"וק יסוד…השנוי במחלוקת"`</a>` + ". זה").
- `el.get_text(' ')` → `'קחו למשל את ח וק יסוד: לימוד תורה, השנוי במחלוקת . זה עבר…'` (the defect,
  == parsed paragraph [8] verbatim)
- `el.get_text('')` → `'קחו למשל את חוק יסוד: לימוד תורה, השנוי במחלוקת. זה עבר…'` (perfect)
The separator-space is injected at EVERY element boundary by our join. Call sites:
`_extract_paragraphs` `core/article_parser.py:2268` (`_clean(p.get_text(" "))`), figcaption
`:2191`, cocoon `:1574`. (Figcaption also shows a doubled space between caption/credit spans.)
**Fix:** inside `<p>`/figcaption, children are inline — join with `""` and insert a space only at
`<br>` boundaries (e.g. replace `<br>` with a space first, then `get_text("")`). Add a regression
test with a mid-word anchor.

## (ii) THAI COCOON + English "Cocoon AI Summary" label — source-side, TRANSIENT
Today's one3ft re-fetch of the SAME article: `raw html has THAI: False ; has 'Cocoon AI Summary':
False`; final parse buckets clean; only benign '■' bullets in the subtitle. TheMarker's
AI-summary block is regenerated per request — at post time it emitted a Thai variant + the
English label; today it doesn't. Note every affected POST-RECORD shows **cocoon=0 subtitle=yes**:
the "cocoon-looking" published block is actually the **subtitle blockquote** (the ■-bulleted AI
summary rides in meta[description]/on-page h2). **Fix path:** can't be reproduced post-hoc —
capture at post time: extend POST-RECORD/quality_inspector to log subtitle text + a
foreign-codepoint scan of the final node JSON, so the next occurrence carries evidence; consider
tightening the subtitle path's label-replace (run `_matches_cocoon_caption` replace on subtitle
too) as cheap hardening.

## (iii) 404 TELEGRA.PH LINK — the page is LIVE (HTTP 200)
The EXACT createPage URL from the posting log
(`telegra.ph/איתות-עצבני-בשוק-הAI-נפילה-של-20-במחיר-של-מדד-חיוני-07-05`) returns **200
(22,523 bytes)** in BOTH raw-Hebrew and percent-encoded forms. So creation succeeded and the page
exists — the discrepancy is NOT the API response. Verdict: the owner's 404 was either transient
(clicked immediately after creation) or the CHANNEL MESSAGE's link string differs from the
createPage URL (the mixed-direction slug `…בשוק-הAI-נפילה-של-20…` can break naive URL
auto-linking/truncation in clients). **Fix:** log the exact URL string embedded in the channel
message (extend POST-RECORD with `telegraph=<url>`), and post the percent-encoded form
(direction-safe) in the message.

## (iv) TRAILING RELATED HEADLINES — inside section.article-body-wrapper, text-marker needed
Last 10 parsed paragraphs end with exactly: `'עוד כותרות'`-block content — paragraphs [12..16] =
"1. עד כמה השינוי בהשקעות…", "2. תקציב הרכבת הקלה…", "3. משוק חופשי אכזרי…", "4. סיאול קיבלה
טעימה…", "5. שוד הקריפטו הגדול…". DOM proof: those `<p>`s sit **INSIDE
`section.article-body-wrapper`** (ancestor chain `section.article-body-wrapper.xjp7ctv > section.
x1zfbmb.… > section.… > div.…`) with fully obfuscated classes — `related-ish elements INSIDE
body-wrapper: 0` (no related/recommend/teaser class token exists). Class filters and the #58
wrapper scoping CANNOT catch this module. **Fix:** HTML-path end-of-body TEXT marker — when a
`<p>`'s text is exactly "עוד כותרות", truncate it and every following `<p>` (mirror of
JINA_END_MARKERS for the HTML path); belt-and-braces: also drop `^\d\.\s` numbered-headline
paragraphs after it.

## (v) HOMOGLYPHS (ط in "אלטו", ب in "בורסה"; 预计将 in iv) — source-side, TRANSIENT
Today's raw one3ft fetches: `'אלטו' count=41 ; 'ط' present=False`, `'ب' present=False` (v);
`raw html contains 预计将: False` (iv). Final cleaned fields scan CLEAN (only '■' bullets).
The homoglyphs existed in the AI-generated source text at post time and are gone from today's
render — origin is SOURCE-side (TheMarker's AI text), not pipeline-injected. Whether the pipeline
should have caught them at post time can't be proven post-hoc (logs don't record subtitle/cocoon
text). **Fix:** same as (ii) — post-time foreign-codepoint scan + logging; plus a publish-boundary
WARNING when the final node JSON contains foreign-script codepoints (cheap, no behavior change).

## Main state
- `main` @ `b55911e` (CONTEXT.md §6 updated with these findings — docs-only commit).
- **PR #70 (RTL via RLM) open** awaiting gate/merge; **#62 markets-emphasis live on main**;
  #58/#59/#61 merged. Poll pipeline healthy (in-chain jina talkback rejection observed working).
- diag/run-post5 **self-deleted**; leftover manual-delete branches unchanged:
  `diag/run-brokenimg`, `diag/run-srclink`, `diag/telethon-vs-posted-guids`.
