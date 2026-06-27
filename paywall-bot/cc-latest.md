# paywall-bot — PR #32 inline-images P2-A / P2-B fix (2026-06-27)

Branch `claude/article-inline-images`, PR #32. One fix commit added.

## New code SHA
**`12fdb7e`** (full: `12fdb7e43fd1e0bb40042cd71b1a084feb9ff65e`) — prior head was `1d64d22`.
Only two files changed: `core/article_parser.py`, `tests/test_message_format.py`.

## STEP 0 — branch state (verified)
- Pre-fix head: `1d64d22` ("pick real URL from lazy-load attrs + normalise hero").
- Commits on the feature: `290947b` (feat) → `11bc8cf` (single-container anchor → final paragraph index) → `1d64d22`.
- **Codex's claimed multi-container fixes `1bf5412` / `f4d8073` do NOT exist** in the repo (`git cat-file` → "Not a valid object name"). They never landed. The multi-container bug was still open.

## Diagnosed
- **P2-A (multi-container anchor reset)** — `_extract_inline_images` (core/article_parser.py). Container selection `for sel in ("article",".article-body","main"): for el in soup.select(sel)` appends *every* match, so two sibling `.article-body` → 2 containers. `_extract_paragraphs` uses the identical loop and concatenates all containers' paragraphs into ONE final list. But the anchor counter did `for container in containers: current_idx = 0` — resetting per container, so a `<figure>` at the start of the 2nd container anchored at index 0, ahead of container 1's paragraphs. **Reachable → fixed.**
- **P2-B (blocklist false positives)** — `_is_inline_image_url_blocked` did `any(b in src.lower() for b in BLOCK)`, a raw substring test. Wrongly dropped silicon-valley.jpg ("icon" in silICON), google-pixel-phone.jpg ("pixel"), tracking-shot.jpg, avatar-photo.jpg, logo-corner.jpg.

## P2-A — FIXED
Moved `current_idx = 0` to once, before the container loop. The counter now advances continuously against the final concatenated paragraph list (`kept_fp_to_final_idx` already maps to the global index), keeping anchors monotonic across containers — same approach as the single-container fix `11bc8cf`. Verified: figure at start of 2nd `.article-body` now anchors at index 2 (after container 1's two paragraphs), not 0.

## P2-B — FIXED
Replaced the substring check with whole-path-component matching. A blocklist token (`_INLINE_IMAGE_BLOCK_TOKENS`: icon/logo/avatar/sprite/pixel/spacer/blank/transparent/tracking/beacon/favicon/emoji/doubleclick/googleadservices/share/ad/ads/1x1/1px + plurals) drops an image ONLY when it is the EXACT filename stem (icon.png, logo.svg), an EXACT path directory segment (/icons/x.png), or a placeholder stem (1x1, spacer, 1px). The `data:` URI drop and the `<100px` declared-dimension drop are unchanged. Leans toward KEEPING when ambiguous.

Verify (keep/drop):
- silicon-valley.jpg → **keep**, google-pixel-phone.jpg → **keep**, tracking-shot.jpg → keep, avatar-photo.jpg → keep, logo-corner.jpg → keep, news-anchor.jpg → keep, real-photo.jpg → keep.
- /icons/x.png → **drop**, spacer.gif → **drop**, pixel.gif → **drop**, logo.svg → drop, icon.png → drop, avatar.jpg → drop, sprite.png → drop, 1x1.png → drop, data: URI → drop, <100px image → drop (via dimension filter).

## Tests
3 added: A1A1A (P2-B keep/drop matrix), B1B1B (sub-100px regression guard — descriptive name kept by blocklist but still dropped on dimension), C1C1C (P2-A multi-container anchor = 2). A1A1A and C1C1C **fail before the fix, pass after**; B1B1B pins the unchanged dimension drop. No existing assertion weakened.

**Local: 133/133 pass** (was 130/130; +3 new).

## CI
**GREEN.** CI workflow `ci.yml` run #110, event `pull_request`, `head_sha=12fdb7e`, conclusion **success** (job `test-message-format`). This is the merge gate. (`check-codex-status` is the separate codex-gate workflow, not the test CI.)
