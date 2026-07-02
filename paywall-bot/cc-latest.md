# paywall-bot — quality gate + jina talkback defenses (PR #58, 2026-07-02)

Status: **PR #58** OPEN → main, branch `claude/quality-gate-jina`, head **`c6141dc`**,
URL https://github.com/funzi7/paywall-bot/pull/58 (verified via API: state=open, merged=false,
3 files, +417/−8). Owner merges after CI + Codex. Implements the five fixes from the log-proven
forensics (`f379116`): the 200K post was a jina render of a paywalled page — teaser + Cocoon +
reader comments — that passed `is_valid` and posted; one3ft never tried.

## FIX 1 — in-chain jina rejection for premium URLs (same-run recovery)
`core/article_parser.py` — new **`_jina_has_talkback_section(md)`** (above `_try_jina`, ~:3290):
bare `## תגובות` heading per line (via `_JINA_COMMENTS_HEADING_RE`) or `'תגובות ('`/`'תגובות:'`
substring in the raw markdown. In **`_try_jina`**: premium URL (`_premium_marker()`) + talkback
section → `return None, None` BEFORE parsing → chain **continues to smry/one3ft in the same run**
(no 2h defer). Logs `jina rejected for premium URL (talkback section present): <url>`.

## FIX 2 — `## תגובות` = END-OF-BODY truncate marker
`core/article_parser.py` — new **`_JINA_COMMENTS_HEADING_RE`**
(`^#{1,6}\s*תגובות\s*(?:\(\d+\))?\s*$`, defined after `JINA_END_MARKERS` ~:210). In
`parse_jina_markdown`'s end-marker branch (~:2470): raw-block heading match OR stripped text ==
bare `תגובות` now BREAKS the loop (truncate) — previously the heading was dropped as a jina
ARTIFACT and the comment bodies below it were kept (the exact 200K hole). Anchored form, not a
`JINA_END_MARKERS` substring — prose mentioning תגובות is untouched.

## FIX 3 — pre-post quality gate (both call sites)
`core/main.py` — new **`TALKBACK_HEADER_RE`** (`^\d{1,3}\s+.{0,80}?\s+\d{1,2}:\d{2}$`),
**`TEASER_SUSPECT_SOURCES = ("jina","smry","telegram")`**, **`_quality_gate_reason(parsed,
source, url)`** (module top, after MAX_ITEMS_PER_RUN):
- (a) `talkback_signature` — ≥2 paragraphs matching the leaked header shape ("16 הספחת מהפחת 18:58").
- (b) `teaser_shape` — premium URL + source in TEASER_SUSPECT_SOURCES + total chars < 2×min_chars
  (default 3000). one3ft/direct excluded — a short full-body post stays legit.
Wired in **`process_item`** (right after the `source=="none"` defer block, before
`article via {source}`) and **`_fetch_and_publish`** (same position) — both REUSE the exact
existing defer block (bump_retry → max-5 permanent_fail; `mark_posted` guid on permanent).
Log line: `QUALITY-GATE: defer url=… source=… reason=…`.

## FIX 4 — POST-RECORD structured logging
`core/main.py` — new **`_log_post_record(url, source, parsed)`**, called inside `if ok:` after
every successful channel post (both call sites):
`POST-RECORD url=<link> source=<fetcher> paras=<n> chars=<n> cocoon=<n> author=yes/no
subtitle=yes/no images=<n>`. Kills the forensic blindness (fetch path/cocoon/subtitle/author
were unrecorded at post time).

## FIX 5 — `_extract_paragraphs` scoped to the real body
`core/article_parser.py:~2170` — paragraph walk roots at **`section.article-body-wrapper`** when
present; else all `.article-body` blocks; the legacy broad `("article",".article-body","main")`
walk ONLY when neither exists (jina/smry/legacy fixtures unchanged). Mirrors #47's image scoping;
verified safe on the audited last-20 (parsed == wrapper `<p>` ±1). Closes server-rendered
talkbacks on HTML paths.

## Tests (tests/test_message_format.py) — full suite green (161)
- **W1W1W** `test_w1w1w_quality_gate_defers_200k_talkback_shape` — 200K regression shape via
  jina/premium → `_fetch_and_publish` returns "bumped", `publish_article` sentinel never called,
  retry_count==1.
- **X1X1X** `test_x1x1x_try_jina_rejects_premium_with_talkback_section` — premium+`## תגובות`
  markdown → (None,None); non-premium same markdown parses (comments truncated, none leak).
- **Y1Y1Y** `test_y1y1y_jina_bare_comments_heading_truncates_body` — 2 body paras kept, both
  comment paras after `## תגובות` dropped.
- **Z1Z1Z** `test_z1z1z_quality_gate_teaser_shape_source_scoped` — premium+jina 2-para/~1.8KB →
  `teaser_shape`; SAME body via one3ft → posts end-to-end.
- **A2A2A** `test_a2a2a_quality_gate_silent_on_clean_full_article` — 8-para/4KB one3ft → posted,
  deferred cleared.
- **B2B2B** `test_b2b2b_extract_paragraphs_scoped_to_body_wrapper` — talkback `<p>`s outside the
  wrapper excluded; no-wrapper page keeps legacy behavior.
Fixture note: body paragraphs must be genuinely distinct — `_word_overlap_dedup` (≥85%) collapses
near-identical test paragraphs (`_HE_BODY_PARAS` added for this).

## Main / repo state
- **#53–#56 MERGED**; **PR #58 (this) OPEN** awaiting CI + Codex; 0 other feature PRs open.
- markets-emphasis prompt still NOT run; video embeds queued
  (telegra.ph/VIDEO-EMBED-TEST-06-30 plays gif-style).
- Manual-delete branches (proxy blocks git-refs DELETE from the agent): `diag/run-brokenimg`,
  `diag/run-srclink`, `diag/telethon-vs-posted-guids`.
