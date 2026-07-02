# paywall-bot — READ-ONLY audit of last 20 POSTED articles (2026-07-02)

Ran the bot's REAL chain (`_fetch_one3ft` → `parse_html` → `_finalize` → `_build_nodes`),
UNMODIFIED, on the 20 most-recent `posted_guids`, in CI (branch `diag/run-audit20`, run
28576143282, success). Posted nothing; changed no bot behavior. **The diag workflow + its temp
branch SELF-DELETED from within CI** (`gh api --method DELETE …/git/refs/heads/diag/run-audit20`
→ "temp branch deleted"); nothing throwaway remains on main or as a leftover branch. All 20
fetched full bodies (one3ft 200, 800KB–1.1MB after a cold-start warm-up).

## HEADLINE RESULT — all four reported issues are NON-REPRODUCING on current main (0/20 each)
| check | count | notes |
|---|---|---|
| Talkbacks in parsed body | **0/20** | talkback regex matched 0 parsed paragraphs; **0 talkback DOM containers** found in ANY fetched HTML (comment/talkback/responses/ugc classes) |
| Partial / truncated body | **0/20** | `paras_parsed ≈ body-wrapper <p>` for every article (±1); no article has raw ≥2× parsed; max node JSON = 27,385 B (art.4), all well under Telegraph's 64KB |
| Residual foreign chars | **0/20** | zero foreign-script chars in any final field (title/subtitle/cocoon/paras/captions); `hits by script: {}` |
| English "Cocoon AI Summary" label | **0/20** | no label survived; **cocoon=0 for all 20** (no Cocoon block present in any fetched body) |

The four bugs the task described (talkbacks, 200K truncation, `شيقل` Arabic opening, English
Cocoon label) were from **earlier posts made by an older deployed version**. On current main —
after #53/#54/#55 (+#56 automation sync) merged — none reproduce across the last 20 posts.

## A. Talkbacks — do NOT leak, and are not even in the fetched DOM
- `_extract_paragraphs` (core/article_parser.py:2170) walks the BROAD containers
  `("article", ".article-body", "main")` — NOT scoped to `section.article-body-wrapper`. So a
  server-rendered comments block inside `<article>`/`<main>` *could* leak if the noise-class
  filters missed it.
- BUT: in all 20 fetched bodies, **no talkback/comments container exists in the HTML at all**
  (TheMarker loads comments via JS/XHR, absent from the one3ft static render). `all_container<p>`
  is only ~3 more than `body-wrapper<p>` (nav/teaser `<p>`), and those extras are already dropped
  (parsed count tracks the body-wrapper count, not the broad count). No descending-number+time
  talkback signature appeared in any parsed list.
- **Fix / hardening (latent, not currently firing):** scope `_extract_paragraphs`' root to
  `section.article-body-wrapper` (mirror the inline-image scoping from #47), falling back to
  `.article-body`/`article` only when the wrapper is absent. Closes the theoretical leak if
  comments ever render server-side. Not urgent — no current leak.

## B. Truncation — none; 200K article is COMPLETE
- No article is partial. **200K target = `[10] markets/2026-07-01/.premium/…1d65`
  ("עד 200 אלף שקל לאדם: המהפכה שמציע משרד האוצר…"): html_len=861,468 (full page), paras_parsed=16
  == body-wrapper `<p>`=16 (complete parse), node_json_bytes=12,639 (well under 64KB).**
  **Verdict: the earlier published truncation was NOT from a partial fetch, NOT from parsing, and
  NOT from 64KB handling — current code parses and renders it in full.** (`_fetch_generic` reads
  `r.text` with no size cap; the only 64KB boundary is Telegraph's `content` field, and the
  largest of the 20 was 27KB.) The old truncation was an artifact of the previous deployment.

## C. Foreign residue — none; no ranges missing
- Zero foreign-script chars survived in any final cleaned field across all 20. The `شيقل` Arabic
  run did NOT reproduce.
- `_GLOBAL_FOREIGN_RANGES` (as printed) already covers every relevant script — Arabic
  `0x0600-06FF` (+Supplement/Ext-A/PF-A/PF-B), Cyrillic `0x0400-04FF` (+supplements), CJK
  `0x3400-9FFF` (+compat), Hiragana/Katakana, Hangul, Thai `0x0E00-0E7F`. **No missing ranges** for
  any script that appeared (none appeared). `_global_clean_paragraph` strips these char-level in
  BOTH `_finalize` and the publish boundary; a fully-foreign field → dropped to None, a mixed
  field → foreign chars stripped. The `شيقל` case is covered both by the Arabic range (char strip)
  and by the context-aware Arabic→Hebrew visual map for mixed tokens.

## D. Cocoon label — not present, not surviving
- No article carried a Cocoon block (`cocoon=0` ×20), so the English label had nothing to survive
  through. The label-strip is `_COCOON_CAPTION_RE`/`_COCOON_CAPTION_INLINE_RE` with `_CAPTION_SEP`
  (matches ASCII ws + zero-width/bidi marks `​-‍⁠﻿‎‏`) and runs
  inside `_global_clean_paragraph` — i.e. on the Telegraph-page render path (title/subtitle/
  paragraphs/cocoon/captions via `_finalize` + `publish_article`), not just the channel message.
  No evasion pattern observed in this sample.

## Fix summary
- Talkbacks: **latent-only** → optionally scope `_extract_paragraphs` to
  `section.article-body-wrapper` (defense-in-depth). No current leak.
- Truncation / 200K / foreign residue / Cocoon label: **already resolved on current main** — no
  code change indicated; the reported defects were from an older deployment and do not reproduce.

## Main / repo state
- **#53, #54, #55, #56 all MERGED** to main (per parallel-session verify: #55 subtitle guard
  merged 2026-06-30T10:00:50Z; #56 automation sync merged 10:04:43Z; latest main CI success).
  Images working (heroes + inline all 200 image/jpeg; srcset precrop fix live). **0 open PRs.**
- markets-emphasis / bold-stocks PR: none open (not found among open PRs).
- Diag hygiene: `diag/run-audit20` self-deleted. Pre-existing leftover branches from EARLIER tasks
  still pending manual deletion (local proxy blocks git-refs DELETE): `diag/run-brokenimg`,
  `diag/run-srclink`, `diag/telethon-vs-posted-guids`.
