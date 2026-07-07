# cc-latest — paywall-bot

**Date:** 2026-07-07
**Task:** Wave 3 — seven verified fixes in ONE PR
**PR:** https://github.com/funzi7/paywall-bot/pull/72 (verified via API: state=open, head `claude/wave3-quality` @ `191fcc7`, base `main` @ `37e9bae` = post-#70-RLM main, 6 files, +597 −67, 1 commit)
**Status:** PR open, awaiting Codex Gate + merge-bot. Sandbox validation fully green.

## The seven fixes

### FIX 1 — inline-join spaces (postmortem item (a))
TheMarker places anchors MID-WORD; `get_text(" ")` injected a space at every element boundary → "ח וק", "במחלוקת .". New **`_inline_text(el)`** in `core/article_parser.py` (just above `_DROPCAP_LEADING_RE`): replaces every `<br>` descendant with a single space, then joins with `get_text("")`. Wired at ALL extraction call sites: `_extract_paragraphs` body loop (`text = _clean(_inline_text(p))`), cocoon paragraphs, figcaption (`cap_text`), and the source-link anchor text. `_clean` unchanged — its whitespace-collapse also normalizes the doubled caption/credit space. Existing tests (drop-cap n1n1n, RLM I2I2I–K2K2K, markets F2F2F–H2H2H) passed UNMODIFIED after the change — no expectation-masking.

### FIX 2 — HTML-path end-of-body markers (postmortem item (e))
**`HTML_END_OF_BODY_MARKERS = {"עוד כותרות", "כתבות מומלצות", "כתבות שאולי פספסתם"}`** (module-level in `core/article_parser.py`, before `PARAGRAPH_MIN_CHARS`). The trailing rail lives INSIDE `section.article-body-wrapper` with fully obfuscated classes — only a text marker can cut it. Critical detail: the marker line is <20 chars, so it is checked **in-loop BEFORE the min-chars filter** (post-assembly-only truncation would be a no-op — the marker never survives into the list); `end_of_body_hit` breaks out of all containers. Belt-and-braces list-level helper `_truncate_at_end_of_body_marker(paragraphs)` (exact stripped match → `paragraphs[:i]`) applied post-assembly. No numbered-paragraph dropping — legit "1. …" listicles survive.

### FIX 3 — publish-boundary evidence capture (items (b)/(c), LOG-ONLY)
In `core/telegraph_pub.py`: **`_scan_foreign_residue(fields, original_url)`** scans FINAL cleaned title/subtitle/cocoon/body/captions right before node building; per hit logs `FOREIGN-RESIDUE url=… field=… char=U+XXXX context=…` at WARNING. Whitelist `_FOREIGN_SCAN_OK` = Hebrew block 0x0590–0x05FF, printable ASCII 0x20–0x7E, whitespace, plus `‏‎■₪€–—“”„‘’…·°±×÷`. **`LAST_PUBLISH_STATS = {"foreign": 0, "srclink": False}`** set by `publish_article` (return signature unchanged). In `core/main.py`: `_log_post_record` extended with `telegraph= foreign= srclink=` (both call sites pass telegraph_url), plus new per-post **`SUBTITLE-RECORD url=… text=<first 200 chars|NONE>`** line — evidence for the next foreign-residue / missing-subtitle occurrence.

### FIX 4 — cocoon-label normalization on the SUBTITLE path
Production POST-RECORDs show `cocoon=0 subtitle=yes` — the AI-summary block rides the SUBTITLE, and the literal English label was published there. New **`normalize_cocoon_label(text)`** in `core/article_parser.py` (whole-line match via `_matches_cocoon_caption` per line → `GLOBAL_COCOON_CAPTION_HE`, then inline `_COCOON_CAPTION_INLINE_RE.sub`, zero-width tolerant). Applied to the subtitle in `publish_article` after `_global_clean_paragraph`. The #55 foreign-ratio guard is untouched.

### FIX 5 — broadened source-link phrase test
The 07-06 Microsoft post's `'לכתבה ב"ניו יורק טיימס"'` was published as plain text. Anchor-text test is now: `text.startswith("לכתבה")` OR contains any of **`_SOURCE_LINK_PHRASES_CONTAINS = ("לקריאת הכתבה", "הכתבה המקורית", "במקור")`**. The EXTERNAL-host requirement is unchanged and does the real gating (themarker-host anchors with the same text stay excluded).

### FIX 6 — in-body gif-video embedding
Mechanism proven by VIDEO-EMBED-TEST: Telegraph plays external-mp4 `{"tag":"video"}` nodes gif-style. `InlineImage` gains `kind: str = "image"`; the inline-image walk also collects `<video>` (figure-wrapped or bare; src from `video[src]` or child `<source src>`; resolved via `_resolve_image_url`, http(s) only; dedup by src; **`_INLINE_VIDEO_MAX_COUNT = 2`**, image cap 5 unchanged and independent). `_build_nodes` emits videos through the SAME figure/figcaption path via `_inline_image_figure_node(src, caption, media_tag)` — captions inherit the join fix + RLM. `publish_article` carries `kind` through the cleaned-inline-images dicts. Rail videos outside the body root remain excluded.

### FIX 7 — body-aware hashtag selection
`sites/themarker/tags.py`: `build_tags(url, title, body_paragraphs=None)` now also scans the first **`BODY_SCAN_PARAGRAPHS = 5`** body paragraphs (joined, lowered). Title hits keep priority — body is consulted per-keyword only when the title missed. When nothing matches, NO hashtag is emitted (DEFAULT_SECTION_TAG=None; better none than wrong). Both `_post_article` call sites in `core/main.py` (process_item + _fetch_and_publish) pass `parsed.paragraphs`.

## Tests added (tests/test_message_format.py — all green)
- **L2L2L** — mid-word anchor join ("חוק יסוד", "במחלוקת. זה"), `<br>` → exactly one space, caption+credit single space.
- **M2M2M** — end-marker truncation via DOM and via list helper; no-marker article unchanged; legit numbered list preserved. (Fixture gotcha hit again: `_word_overlap_dedup` collapses ≥85%-similar sentences — numbered-list fixtures must be lexically distinct.)
- **N2N2N** — foreign scan: one CJK hit detected; clean Hebrew with RLM/■/gershayim → 0 hits.
- **O2O2O** — zero-width-interleaved "Cocoon" label normalized end-to-end (published JSON contains no "Cocoon"); plain Hebrew subtitle untouched.
- **P2P2P** — `'לכתבה ב"ניו יורק טיימס"'` → nytimes link captured with friendly label; same text on themarker host NOT captured.
- **Q2Q2Q** — in-wrapper video emitted as figure+figcaption `{"tag":"video"}` node; rail video excluded.
- **R2R2R** — body-only keyword tagged; title priority over body; no-match → composed message contains no `#`.

Validation: `python3 -m py_compile` on all 5 changed modules + full standalone `python3 -m tests.test_message_format` → "All tests passed". Full pytest cannot run in the sandbox (core.tg_bot → cryptography rust panic); CI `test-message-format` is the arbiter.

## CONTEXT.md (same commit, per protocol)
§6 DIAGNOSED block replaced with WAVE 3 block: (a) inline-split **DONE** (FIX 1); (e) trailing rails **DONE** (FIX 2); (d) 404 **RESOLVED-TRANSIENT** (page live 200; `telegraph=` now logged per post; owner declined percent-encoding); (b)/(c) **INSTRUMENTED** (FOREIGN-RESIDUE + SUBTITLE-RECORD live, awaiting next occurrence); FIX 4/5/6/7 recorded; IV inconsistency **EXTERNAL** (monitor only). New **"VERIFY IN NEXT POSTS"** checklist: words joined correctly / no space-before-punctuation; no trailing rails ("עוד כותרות"); subtitle label normalized to Hebrew; לכתבה ב… anchors live-linked; embedded videos play; hashtags relevant or absent; POST-RECORD shows telegraph=/foreign=/srclink=; SUBTITLE-RECORD present per post.

## Next steps
1. Codex Gate on PR #72 → merge-bot (needs-owner would be a hard stop; none expected).
2. After the next few cron posts, walk the VERIFY IN NEXT POSTS checklist against errors.log POST-RECORD/SUBTITLE-RECORD lines.
3. If FOREIGN-RESIDUE fires, the log now pinpoints field + codepoint + context — design the targeted fix from that evidence.
