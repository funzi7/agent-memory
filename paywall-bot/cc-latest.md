# paywall-bot — Join / Cocoon / Tags / broken-image diagnostic (2026-06-30)

PART 1 = local code read (main `13ea979`/`53c3f8f`). PART 2 = CI capture (workflow added to
main, run via push branch `diag/run-brokenimg`, removed from main `53c3f8f`). Read-only.

## (1) JOIN button — root cause = AUTHOR_URL is the channel, hardcoded
`core/telegraph_pub.py:16-17`:
```python
AUTHOR_NAME = "TheMarker"
AUTHOR_URL  = "https://t.me/demarkerpremium"
```
Passed to `createPage` (`telegraph_pub.py:268-269`) as `author_name`/`author_url`. Telegraph
renders the page author byline as a link to `author_url` → the Instant-View "JOIN"/author link
points at the **Telegram channel `t.me/demarkerpremium`**, hardcoded. There is no per-post or
config-driven value; whatever the Join issue is (wrong/!desired target, or it should be a
`t.me/...` join/`+invite` link), the single source of truth is this constant. **Fix:** set
`AUTHOR_URL` to the intended Join/channel link (or make it site-config driven).

## (2) COCOON — TWO foreign filters; a fully-Chinese Cocoon should NOT survive
- Extraction `_extract_cocoon_paragraphs` (`article_parser.py:1463`) collects `<p>/<li>` under
  containers whose class matches `NOISE_ANCESTOR_CLASSES = ("ai-summary","cocoon","summary-block",
  "ai-generated")`, with a LIGHT filter: `_is_noise_text` + length + caption-only drop.
- `_is_noise_text` ends with `if _foreign_script_ratio(text) > FOREIGN_SCRIPT_THRESHOLD (0.30): return True`
  — `_foreign_script_ratio` counts CJK/Thai/Arabic; a fully-Chinese paragraph ≈1.0 → dropped at extraction.
- `_finalize` then runs `_global_clean_paragraph` on every cocoon paragraph (char-strips CJK +
  drops if had_foreign and <15 Hebrew letters). Second net.
- Label is hardcoded Hebrew `COCOON_CAPTION_HE = "🤖 סיכום AI של TheMarker"` (telegraph_pub.py:81),
  emitted by `_build_nodes` as a `p>strong` ONLY when `cocoon_paragraphs` is non-empty. The source's
  English "Cocoon AI Summary" text is replaced inline / dropped if caption-only.
- **CI confirm:** on both Wall-St articles tested, **NO Cocoon block** existed under those classes
  (`cocoon_paragraphs=0`). So a surviving-Chinese-Cocoon could NOT be reproduced in this sample.
  Likely the user's Chinese-Cocoon either predates the Wave-1 foreign-script fixes, or sits in a
  container whose class is NOT in `NOISE_ANCESTOR_CLASSES` (so it's treated as body, not cocoon).
  **A specific article URL where the Chinese Cocoon appeared is needed to pin the exact path.**
  A MIXED Hebrew+Chinese block would partially survive (Chinese char-stripped, Hebrew kept).

## (3) TAGS — `sites/themarker/tags.py:build_tags(url, title)`
- Slot 1 = section tag by URL-path prefix (`SECTION_TAGS`: /wallstreet/→וולסטריט, /markets/→שווקים,
  /realestate/→נדלן, /news/aviation/→תעופה, …); no match → `DEFAULT_SECTION_TAG = None`.
- Slots 2-4 = keyword tags by case-insensitive **substring match on the TITLE** (`KEYWORD_TAGS`:
  נתניהו, טראמפ, איראן, בנק ישראל, אינפלציה, ריבית, מס/מסים, בורסה/מניות, אבטלה, מלחמה/צה"ל,
  AI/בינה מלאכותית). Deduped, "themarker" filtered, capped `MAX_TAGS = 4`.
- Inputs are ONLY URL path + title — no body text, no category metadata, no keyword from content.

## (4) BROKEN INLINE IMAGES — RESOLVED by #47; hero loads fine
CI ran the existing parser on 6 cache-derived URLs (the cmlink feed is stale and lacks the named
articles; identity confirmed from fetched og:title):
| cand | title | inline_images | hero GET |
|---|---|---|---|
| cand0 | "ב–21 מיליון שקל: צה\"ל רוכש מאות מכ\"מים לגילוי רחפנים" (מאגוס/IDF radar) | **0** | 200 image/jpeg 47.9KB |
| cand1 | "...הקטארים... רפאל" (security) | 0 | 200 image/jpeg 94KB |
| cand2 | "האוצר... תקציב הביטחון..." | 0 | 200 image/jpeg 141KB |
| cand3 | "אחרי וויקס: אלמנטור מפטרת 100 עובדים" (technation) | 0 | 200 image/jpeg 119KB |
| cand4 | "תחזית לנפילה של 70%..." (wallstreet) | 0 | 200 image/jpeg 51KB |
| cand5 | "עליות בבורסות אירופה; הנפט יורד ב-1%" (wallstreet-live, 30¶) | 0 | 200 image/jpeg 96KB |

**Root cause / state:** after PR #47 (inline-image walk scoped to `section.article-body-wrapper`),
`_extract_inline_images` returns **0 images** for all of these — the genuine body figure equals the
hero (deduped) or there is none in the body wrapper. The HERO (`img.haarets.co.il/bs/<this-article-id>/…`)
loads cleanly (200, `image/jpeg`, no Referer needed → NOT referer-gated). The historical "broken
square" inline images were the React **rail/teaser thumbnails** (themarker responsive thumbs
`/ty-article/yNNN&width=568…` + wrong-article-id haaretz CDN) that #47 now excludes. So on
current `main` these articles emit no broken inline images. Could NOT capture a surviving broken
CHOSEN inline src because none survives post-#47 in this sample.
**What the fix should do:** nothing further for these — #47 already removed the broken teasers and
the hero is fine. If a genuine in-body figure ever needs surfacing, it lives under
`section.article-body-wrapper` and loads from `img.haarets.co.il/bs/<id>/…` (200, image/jpeg). If a
future broken case appears, capture that specific URL (chosen-src GET status/ct) — the lazy/srcset
selection (`_select_best_image_src`) and the per-image filters are unchanged and were not the
failure here.

## Fix summary (for the four issues)
1. **Join:** point `AUTHOR_URL` at the desired channel/join link (or make it config-driven).
2. **Cocoon:** code already double-filters foreign-dominant; need the offending URL to confirm
   whether the Chinese block bypasses via a non-`NOISE_ANCESTOR_CLASSES` container — likely a
   classifier-coverage gap, not a missing filter.
3. **Tags:** title+URL only; to improve coverage add keywords/section prefixes (no structural bug).
4. **Broken images:** resolved by #47; hero loads; no action needed unless a new sample reproduces.

## Main state
Wave-1 merged (#42 → `3f284d1`); byline+drop-cap #44 merged; **#47 + Codex `9174afe` MERGED**;
source-link fix BLOCKED pending a user-provided translated URL (0/40 in sample); subhead = no-op;
video = no-op. Open: **PR #35** (old capture diag). Temp branches pending MANUAL deletion (proxy
now blocks git-refs DELETE → HTTP 403): **`diag/run-srclink`**, **`diag/run-brokenimg`**. All diag
workflows removed from main.
