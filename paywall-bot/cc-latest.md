# paywall-bot — Chinese-Cocoon diagnosis (2026-06-30)

READ-ONLY full-body diagnostic via the REAL bypass (`_fetch_one3ft` → `parse_html` → `_finalize`
→ `_build_nodes`), CI branch `diag/run-cocoon`, runs **28432283948** + **28432670525** (both
success). Goal: reproduce the Chinese Cocoon on "וול סטריט ננעלה בעליות: נאסד\"ק זינק ביותר מ-2%,
ספייס אקס ביותר מ-7%". Posted nothing.

## Resolved article + why it's UNRECOVERABLE
- The headline is the **Wall-Street live-blog** `wallstreet/2026-06-29/ty-article-live/0000019f-1195`
  (the last/only Wall-St item in posted_guids; state snapshot last_run 08:24:49, no 06-30 posts).
  "ננעלה בעליות" = the US-close snapshot the bot posted ~06-30 morning.
- **Live-blog content rotates in place.** Fetching `1195` now (warm one3ft, 200, 846 KB) yields
  og:title **"עליות בבורסות אירופה; הנפט יורד ב-1%"** — the morning-of-30 Europe snapshot, NOT the
  close. Wayback has no snapshot (404). The exact "ננעלה" snapshot + its Cocoon is gone.
- First run hit one3ft **503 (cold-start**, identical 258535-byte error page) on the first ~9
  URLs; the prior 45cdeb0 conclusion came from those misses. Re-ran with a one3ft warm-up +
  per-URL retries: **all 11 candidates fetched full bodies (200)**. Result across every candidate
  (live blogs `1195`/`11cd`, all `.highlight`/`.premium` 06-29, both 06-30 markets):
  **0 matches for "ננעלה בעליות", `html_has_CJK=False` everywhere, `cocoon=0` everywhere.**
  (`11cd` now → "טאואר ונובה נפלו ב-6%…", the rotated TASE close.) The snapshot cannot be
  re-fetched from any live URL.

## Mechanism — which path lets a Chinese block through (from code + empirical filter tests)
Two foreign filters exist; I verified each on current main (`python3` locally):
1. **`_is_noise_text`** (article_parser.py:1363) → `_foreign_script_ratio(text) > 0.30` (CJK range
   0x4E00–0x9FFF etc.) → drops the paragraph. Applied in BOTH body extraction and
   `_extract_cocoon_paragraphs` (line 1498).
2. **`_global_clean_paragraph`** (article_parser.py:1033) → char-level foreign strip (line 1153
   `_global_strip_foreign_chars`) + drop-to-None when empty (1180) or `had_foreign` and Hebrew
   letters < floor (1182). Applied to **title/subtitle/paragraphs/cocoon_paragraphs/captions** in
   `_finalize` (3007-3038) AND again at the publish boundary in `telegraph_pub.publish_article`.

Empirical (verified): pure-CJK → `_is_noise_text=True`, `_global_clean_paragraph→None`; mixed
He+CJK (ratio 0.341) → `_is_noise_text=True`, clean strips the CJK leaving only Hebrew. So **every
CLEANED render field strips CJK** — a fully-Chinese block cannot reach the page through body,
cocoon, title, or caption on current main.

**The one structural gap = `_extract_subtitle`** (article_parser.py:1426): it applies ONLY
`_is_subscriber_prompt` — NOT `_is_noise_text` and no foreign-dominance check (deliberately, per
its docstring: PR #17's ≥30-Hebrew floor wrongly dropped short legit subtitles). It relies SOLELY
on `_global_clean_paragraph` in `_finalize` to scrub the subtitle blockquote. That single
dependency is the most plausible original bypass: a foreign-dominant subtitle survives extraction,
and only the char-strip + Hebrew-floor stands between it and the rendered `blockquote`. (The
cocoon path is already double-covered: `_is_noise_text` drops fully-foreign; `_global_clean_paragraph`
strips mixed.)

## Exact fix (recommended)
- **Harden `_extract_subtitle`**: before returning a candidate, drop it when
  `_foreign_script_ratio(raw) > FOREIGN_SCRIPT_THRESHOLD` (mirror the cocoon/body `_is_noise_text`
  guard). Cheap, no Hebrew-floor regression (it's a ratio, not a min-Hebrew count), and closes the
  only render path that skips the foreign-dominance filter. Add a test: a CJK-dominant
  meta[description]/h2 → `_extract_subtitle` returns None → no blockquote node emitted.
- Defensive nicety: assert in a test that `_build_nodes` is never called with un-`_finalize`d
  fields (the subtitle/cocoon must always pass `_global_clean_paragraph`).
- **Cannot confirm the live repro** — the snapshot rotated and one3ft/wayback no longer serve it.
  If it recurs, capture the offending telegra.ph page or the live snapshot AT POST TIME (the live
  blog won't hold it). The `diag-cocoon.yml` CJK trace (class chain → NOISE_ANCESTOR_CLASSES →
  `_foreign_script_ratio` → `_is_noise_text` → `_global_clean_paragraph` → bucket → emitted node)
  is ready to pinpoint the surviving filter the moment a CJK-bearing body is in hand.

## Main / repo state
- **PR #53** (Join CTA) MERGED (`bca520b`). **PR #54** (srcset precrop + in-body source link) OPEN,
  branch `claude/srcset-and-source-link`. **PR #35** (old capture diag) OPEN.
- Main carries **no diag workflow** (diag-cocoon.yml lived only on the temp branch; never on main).
- Video: confirmed plays gif-style (telegra.ph/VIDEO-EMBED-TEST-06-30).
- **Temp branches pending MANUAL deletion** (proxy blocks git-refs DELETE → push hangs up):
  `diag/run-cocoon`, `diag/run-fullbody`, `diag/run-srclink`, `diag/run-brokenimg`,
  `diag/run-consolidated` (also stale: `diag/telethon-vs-posted-guids`).
