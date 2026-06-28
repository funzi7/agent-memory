# paywall-bot — foreign-script / Cocoon-label / truncation investigation (2026-06-28)

READ-ONLY investigation (no source changed). Code read at branch
`claude/article-inline-images` @ `12fdb7e`; production `main` confirmed to have
**identical** cleaner wiring (`_finalize` + `_GLOBAL_FOREIGN_RANGES`), so these
findings apply to live output too.

Observed leaks: Chinese (已经是), Russian (последние), English ("herself")
mid-Hebrew in the summary; once a whole body in Chinese; literal English
"Cocoon AI Summary" label instead of Hebrew.

---

## 1) FETCH-PATH ROUTING — the bypass is the FLASH path + the channel "keep-on-None"

`fetch_and_parse` (core/article_parser.py:2992) iterates the chain and EVERY
winning source returns through `_finalize`:
```python
for source_name in _fetch_chain():
    fetcher = _CHAIN_FETCHERS.get(source_name)
    ...
    parsed, source = fetcher(url, item_title, item_description)
    if source is not None:
        return _finalize(parsed, source, url)
```
`_finalize` (article_parser.py:2760) cleans title/subtitle/paragraphs/cocoon_paragraphs:
```python
parsed.title = _global_clean_title(parsed.title or "")
if parsed.subtitle: parsed.subtitle = _global_clean_paragraph(parsed.subtitle)
parsed.paragraphs = [c for c in (_global_clean_paragraph(p) for p in parsed.paragraphs) if c]
parsed.cocoon_paragraphs = [c for c in (_global_clean_paragraph(p) for p in parsed.cocoon_paragraphs) if c]
```
`telegraph_pub.publish_article` (telegraph_pub.py:221-228) RE-cleans the same fields → the **Telegraph PAGE is double-cleaned and DROPS** any paragraph the cleaner nulls (`if c`).

### Routing table
| Path | parse fn | through `_finalize`? | Telegraph page | Channel message |
|---|---|---|---|---|
| telegram | `_parse_telegram_message` | ✅ | cleaned, drops None | excerpt via `_publish_clean_message` (keeps None) |
| direct | `parse_html` | ✅ | cleaned, drops None | same |
| jina | `parse_jina_markdown` | ✅ | cleaned, drops None | same |
| smry | `parse_smry_html` | ✅ | cleaned, drops None | same |
| one3ft | `parse_html` | ✅ | cleaned, drops None | same |
| wayback | `parse_html` | ✅ | cleaned, drops None | same |
| **flash** | **NONE** | **❌ BYPASS** | n/a (no Telegraph page) | raw `item.title` + `item.description`, only `escape_md`+`_truncate`+`_publish_clean_message` |

**Bypass A — flash route.** `process_item` (main.py:311-314): `classify()` →
if `/news-flashes/` AND `len(description) < 200` → `_post_flash`, which never calls
`fetch_and_parse`/`_finalize`:
```python
async def _post_flash(item):              # main.py:248
    title_md = tg_bot.escape_md(item.title)
    body = _truncate(item.description, 600)     # RAW RSS description
    body_md = tg_bot.escape_md(body)
    text = f"🔸 *{title_md}*\n\n{body_md}\n\n🔗 {url_md}"
    return await tg_bot.post_to_channel(text, disable_preview=True)
```

**Bypass B — channel send boundary keeps foreign-dominant lines.** Both flash AND
article posts send through `tg_bot.post_to_channel` → `_publish_clean_message`
(tg_bot.py:64-97), which runs `_global_clean_paragraph` per line BUT on a `None`
result **keeps the ORIGINAL line** (to preserve structure):
```python
cleaned = _global_clean_paragraph(line)
if cleaned is None:
    out_lines.append(line)   # <-- keeps the raw foreign line verbatim
    continue
```
`_global_clean_paragraph` returns `None` for a foreign-DOMINANT line
(`had_foreign and <15 Hebrew letters`). The Telegraph page DROPS such lines;
the channel message KEEPS them. That asymmetry is the live leak surface.

Verified:
- `_global_clean_paragraph('已经是…')` → `None`; `_publish_clean_message` of a
  flash body with that line returns the **Chinese line unchanged** → explains
  "whole body in Chinese" and CJK/Cyrillic in summaries.
- A MIXED line with ≥15 Hebrew letters IS cleaned (`'…בעקבות 已经是 דיווחים…'` →
  Chinese stripped) — so leaks specifically come from foreign-dominant lines.

---

## 2) FOREIGN-SCRIPT STRIPPING — what is and isn't stripped

Char-level strip (article_parser.py:886) deletes only chars in
`_GLOBAL_FOREIGN_RANGES` (line 743) ∪ `_GLOBAL_FOREIGN_SPECIFIC` (line 771):
```python
def _global_strip_foreign_chars(text):
    return "".join(c for c in text if not _is_global_foreign_char(c))
```
`_GLOBAL_FOREIGN_RANGES` includes: CJK `0x3400-0x9FFF` + `0xF900-0xFAFF`,
Hiragana/Katakana `0x3040-0x30FF`, Hangul `0xAC00-0xD7AF`/`0x1100-0x11FF`,
Arabic `0x0600-0x06FF`/`0x0750-0x077F`/`0x08A0-0x08FF`/`0xFB50-0xFDFF`/`0xFE70-0xFEFF`,
Cyrillic `0x0400-0x04FF`/`0x0500-0x052F`/`0x2DE0-0x2DFF`/`0xA640-0xA69F`.

So **CJK and Cyrillic ARE stripped** (for mixed lines) — they are NOT the
problem at the char level. Three real gaps explain the leaks:

- **(a) Thai is NOT stripped.** `0x0E00-0x0E7F` is in `FOREIGN_SCRIPT_RANGES`
  (the ratio detector, line 259) but MISSING from `_GLOBAL_FOREIGN_RANGES`. Thai
  is never char-stripped (only counted toward the dominance ratio).
- **(b) Standalone Latin is KEPT by design.** Only Latin runs FUSED to a Hebrew
  letter are removed (`_strip_glued_latin`, line 901). A space-bounded English
  word ("herself") is indistinguishable from a brand name (S&P, AI, DriveNets)
  and is intentionally preserved → English leaks.
- **(c) Foreign-DOMINANT lines: strip never runs in the channel.** The strip is
  inside `_global_clean_paragraph`, which returns `None` for a foreign-heavy
  line; the Telegraph page drops it, but `_publish_clean_message` keeps the raw
  original (finding 1, bypass B). So a fully-CJK/Cyrillic line ships untouched.

Which fields get cleaned: title, subtitle, body paragraphs, cocoon_paragraphs,
inline-image captions — all via `_finalize` AND again in `publish_article`
(Telegraph page) and once per line in `_publish_clean_message` (channel, keep-on-None).
Which DON'T: the **flash** title/description (never parsed), and any
foreign-dominant **channel line** (kept verbatim on None).

---

## 3) "Cocoon AI Summary" LABEL — `\s+` defeated by zero-width / bidi separators

The Telegraph page itself renders a HARDCODED Hebrew caption
(`telegraph_pub.py:122`, `COCOON_CAPTION_HE = "🤖 סיכום AI של TheMarker"`), so a
surviving English label means the literal string rode in as CONTENT (a paragraph
/ cocoon line / title) and the replacement regexes missed it.

Detection + replacement (article_parser.py):
```python
_COCOON_CAPTION_RE        = re.compile(r"^\s*cocoon\s+ai\s+summary", re.IGNORECASE)   # :787
_COCOON_CAPTION_INLINE_RE = re.compile(r"(?:\*{1,2}|_)*cocoon\s+ai\s+summary(?:\s*(?:\*{1,2}|_))*", re.IGNORECASE)  # :820
GLOBAL_COCOON_CAPTION_HE  = "🤖 סיכום AI של TheMarker"
```
Both rely on `\s+` between the words. Python `str` `\s` matches ASCII whitespace
+ Unicode Zs (incl. NBSP U+00A0) but **NOT** Cf-category zero-width / bidi marks.
Empirically tested — when a separator sits between the words:

| separator | `_matches_cocoon_caption` | inline replaced | foreign-strip removes sep |
|---|---|---|---|
| plain space / NBSP U+00A0 | ✅ | ✅ | — |
| ZWSP U+200B | ❌ | ❌ | ❌ |
| LRM U+200E | ❌ | ❌ | ❌ |
| RLM U+200F | ❌ | ❌ | ❌ |
| WORD JOINER U+2060 | ❌ | ❌ | ❌ |
| BOM/ZWNBSP U+FEFF | ❌ | ❌ | ✅ (in Arabic-PF-B range, but words still un-replaced) |

`_global_clean_paragraph('Cocoon​AI​Summary')` → `'Cocoon​AI​Summary'`
(label shipped verbatim — it's Latin, so the foreign-strip leaves it too).

**Suspected real shape:** TheMarker is an RTL Hebrew site; the Latin "Cocoon AI
Summary" run embedded in RTL markup gets bidi isolation marks (LRM U+200E /
RLM U+200F) or zero-width chars (U+200B/U+2060/U+FEFF) inserted between the
words. These are Cf chars that `\s` doesn't match and the strip set (mostly)
doesn't remove, so neither the start-anchored nor the inline replacement fires.
Fix direction: NFKC/Cf-strip (or `[\s​-‏⁠﻿]+`) BEFORE the
caption match; also matters because the label is matched 3 ways but all share `\s+`.

---

## 4) COMPLETENESS / TRUNCATION — no silent mid-article cut

`publish_article` → `_build_nodes` (telegraph_pub.py:95) appends EVERY paragraph
(`for i, p in enumerate(paragraphs, start=1): nodes.append({"tag":"p",...})`),
JSON-encodes, and POSTs to `createPage`. **No max-paragraph count, no char/byte
cap, no early break on the body.** The only caps in the whole publish path:
- `safe_title = (title or "ללא כותרת").strip()[:256]` — TITLE only (telegraph_pub.py:250).
- `_INLINE_IMAGE_MAX_COUNT = 5` — inline IMAGES only (article_parser.py:1484), DOM-order truncation, not body text.
- Channel EXCERPT: `_truncate(first_paragraph, 800)` (article post, main.py:274) /
  `_truncate(item.description, 600)` (flash, main.py:250). These cap the Telegram
  message excerpt (first paragraph only) — expected, not article-body truncation.

Telegraph's own ~64KB `createPage` content limit is NOT pre-checked. An
over-limit page makes `_post` (telegraph_pub.py:23) get a not-ok response and,
after 3 attempts, **raise** → `publish_article` returns `None` → main logs
"telegraph publish failed" and the item is deferred/retried. So a too-long
article FAILS WHOLESALE; it is never silently truncated mid-way. No silent
body-truncation cap exists in the code.

---

## Summary of root causes
1. **Flash route** (`/news-flashes/` + desc<200) posts raw RSS title+description with no `_finalize`.
2. **`_publish_clean_message` keeps the original line when the cleaner returns `None`** → foreign-dominant CJK/Cyrillic lines ship verbatim in the channel message (Telegraph page drops them — asymmetry).
3. Standalone Latin kept by design ("herself"); **Thai missing** from `_GLOBAL_FOREIGN_RANGES`.
4. Cocoon-label replacement uses `\s+`, defeated by zero-width/bidi (U+200B/200C/200D/2060/FEFF/200E/200F) between words; those chars aren't stripped either.
5. No body truncation cap — long articles fail wholesale (return None), never silently cut.
