# paywall-bot — latest Claude Code status

## Codex PR #58 P1 fixed: reject teaser renders IN-CHAIN, continue to bypass sources

**PR #58 (`claude/quality-gate-jina`) new head SHA:** `d1d98a0`

**Problem (Codex P1):** `article_parser.fetch_and_parse` accepted the FIRST source
that passed `is_valid` (only min_paragraphs + min_chars + language) — so a
paywall-teaser render from telegram/jina/smry on a premium URL won the chain and
STOPPED it before one3ft/wayback. The teaser gate only ran LATER (in
`core.main._quality_gate_reason`, from `_fetch_and_publish` / `process_item`),
which deferred the whole item (bump_retry → permanent_fail) — so the next poll
re-hit the same early teaser source and the trustworthy bypass sources were never
tried.

**Fix — single source of truth + reject in-chain:**
- `core/article_parser.py`: MOVED `TEASER_SUSPECT_SOURCES = ("jina","smry","telegram")`
  (+ its comment) here from `core.main`, and added `_is_teaser_shape(parsed,
  source, url)` — the EXACT existing predicate (premium marker in url AND source
  in TEASER_SUSPECT_SOURCES AND `sum(len(p) for p in paragraphs) < 2*min_chars`,
  via `_premium_marker`/`_cv`/`PAYWALL_MIN_BODY_CHARS`).
- `fetch_and_parse` loop: after a fetcher returns a non-None source, if
  `_is_teaser_shape(...)` → `log_info("TEASER-GATE in-chain: rejecting <source>
  render, continuing chain: <url>")` and **`continue`** to the next source
  (no `_finalize`). If every source ends rejected/none → returns `"none"` exactly
  as before, so the caller's defer/retry path is untouched. (`log_info` is already
  imported in article_parser; no new imports.)
- `core/main.py`: DELETED the local `TEASER_SUSPECT_SOURCES` constant+comment, and
  changed `_quality_gate_reason`'s teaser branch to `if
  article_parser._is_teaser_shape(parsed, source, url): return "teaser_shape"`.
  Everything else (talkback_signature logic, both call sites) unchanged — the gate
  stays a last-resort backstop.

**Tests (`tests/test_message_format.py`, new `C2C2C`, stubs the chain via
`article_parser._CHAIN_FETCHERS`):**
- (a) premium: jina teaser + one3ft full → `fetch_and_parse` returns **one3ft**
  (chain CONTINUED past the teaser).
- (b) premium: telegram/jina/smry all teaser, one3ft/wayback nothing → **none**
  (defer path preserved).
- (c) NON-premium: jina teaser-length → **jina** (gate only covers premium URLs).
- (d) premium: jina FULL body → **jina** (no false positive).

**Validation:** `python3 -m py_compile core/article_parser.py core/main.py
tests/test_message_format.py` OK; the 4 C2C2C cases + `_is_teaser_shape` predicate
checks pass standalone (the in-chain TEASER-GATE log fires as expected). NOTE: the
**full** `python -m tests.test_message_format` suite could not run in this sandbox
— its top-level `from core import tg_bot` pulls `telegram`/`cryptography`, whose
rust binding panics here (unrelated to this change); the article_parser side was
validated in isolation. Committed to `claude/quality-gate-jina` (PR #58) as
`d1d98a0` — Codex will re-review.
