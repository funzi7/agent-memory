# paywall-bot — foreign-script + Cocoon-label leak FIXES (2026-06-28)

Branch `claude/article-inline-images` (PR #32). Implements the four fixes from
the investigation @ agent-memory `a85290a`.

## New code SHA
**`fcace5b`** (paywall-bot, branch `claude/article-inline-images`) — built on
`2553d58`. Only four files changed: `core/article_parser.py`, `core/main.py`,
`core/tg_bot.py`, `tests/test_message_format.py`.

## FIX 1 — flash route now cleans title + description (core/main.py `_post_flash`)
Flash items (`/news-flashes/` + desc<200) bypass the fetch chain / `_finalize`,
so raw RSS title+description shipped uncleaned. Now:
```python
title_clean = article_parser._global_clean_title(item.title or "")
if not title_clean.strip():
    title_clean = "מבזק"                      # placeholder so the link still posts
body_clean = article_parser._global_clean_paragraph(item.description or "")
...
if body_clean:  # cleaned + 600-char truncate, full 🔸/body/🔗 layout
else:           # foreign-dominant/empty body -> 🔸 title + 🔗 link ONLY
```

## FIX 2 — drop foreign-dominant lines in the channel (core/tg_bot.py `_publish_clean_message`)
Was: `if cleaned is None: out_lines.append(line)` (kept raw foreign line).
Now: a non-blank line that cleans to `None` (foreign-dominant) is **dropped**
(mirrors the Telegraph page's `if c` comprehensions); blank/whitespace-only
lines are still preserved as structural spacing (checked before the cleaner).
```python
if not line.strip():
    out_lines.append(line); continue   # structural blank kept
cleaned = _global_clean_paragraph(line)
if cleaned is None:
    continue                            # foreign-dominant junk -> DROP
out_lines.append(cleaned)
```

## FIX 3 — Thai added to char-strip ranges (core/article_parser.py `_GLOBAL_FOREIGN_RANGES`)
`(0x0E00, 0x0E7F)  # Thai` added. It was only in `FOREIGN_SCRIPT_RANGES` (ratio
detector); now Thai is char-stripped from mixed Hebrew lines like CJK/Cyrillic.

## FIX 4 — Cocoon label tolerates zero-width/bidi separators (core/article_parser.py)
`\s` does not match the Cf zero-width/bidi marks TheMarker's RTL markup inserts
between "Cocoon"/"AI"/"Summary", so the English label survived. New shared class:
```python
_CAPTION_SEP = r"[\s​‌‍⁠﻿‎‏]+"
_COCOON_CAPTION_RE        = ^\s*cocoon + _CAPTION_SEP + ai + _CAPTION_SEP + summary
_COCOON_CAPTION_INLINE_RE = (?:\*{1,2}|_)*cocoon + _CAPTION_SEP + ai + _CAPTION_SEP + summary(?:\s*(?:\*{1,2}|_))*
```
So the Hebrew caption (`GLOBAL_COCOON_CAPTION_HE = "🤖 סיכום AI של TheMarker"`)
fires regardless of separator. The marks are NOT pre-stripped before the match
(that would fuse the words and break `+`). Separately, as output hygiene, the
end of both `_global_clean_paragraph` and `_global_clean_title` strip the
invisible zero-width chars via:
```python
_ZERO_WIDTH_STRIP = {0x200B:None,0x200C:None,0x200D:None,0x2060:None,0xFEFF:None}
text = text.translate(_ZERO_WIDTH_STRIP)
```
U+200E/U+200F (LRM/RLM) are deliberately NOT stripped globally (direction marks)
— they're handled only by the widened match.

## Glued-CJK case (verification)
`已经是זו וולוו…` (CJK fused to a Hebrew letter, no space, Hebrew-dominant) →
char-strip removes the CJK and the line is KEPT (not nulled). This already held
via `_finalize` cleaning `cocoon_paragraphs`; test K1K1K is a regression guard
(passes before and after) — the old screenshots predate cocoon cleaning.

## Tests — 7 added, full suite 141/141 green
`python3 -m tests.test_message_format` → All tests passed (was 134/134).
- E1E1E flash foreign desc → title+link only; Hebrew desc cleaned+included
- F1F1F flash all-foreign title → Hebrew placeholder, link still posts
- G1G1G channel: whole-CJK & whole-Russian DROPPED, Hebrew+CJK kept (CJK stripped), blanks preserved
- H1H1H Thai stripped from mixed line
- I1I1I caption replaced for ZWSP/LRM/RLM/word-joiner + plain + md-wrapped (paragraph AND title)
- J1J1J zero-width chars (U+200B/C/D/2060/FEFF) stripped from final output
- K1K1K CJK glued to Hebrew letter stripped, line kept
6 of 7 fail-before/pass-after; K1K1K passes both (regression guard). No existing
assertion weakened (the prior `_publish_clean_message` test E2E lines all clean
to non-None, so the drop change doesn't affect them).

## Verify outputs (local)
- caption all shapes → `🤖 סיכום AI של TheMarker`
- Thai: `מדד תל אביב สวัสดี ירד…` → Thai removed, Hebrew kept
- channel: whole-CJK/whole-Russian dropped, Hebrew+CJK line kept w/ CJK stripped
- zero-width hygiene: no U+200B/C/D/2060/FEFF in output
- flash all-foreign title → `מבזק` placeholder + link

## CI
`test-message-format` (`.github/workflows/ci.yml`) is the gate; green on the
prior commit and re-running for `fcace5b` after push.
