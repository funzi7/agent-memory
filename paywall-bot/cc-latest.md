# paywall-bot — foreign-script + Cocoon-label fixes landed via PR #42 (2026-06-28)

The four foreign-script / Cocoon-label leak fixes now live on a fresh branch
with an open PR to `main`, because the original PR #32 merged before the fix
commit could be added to it.

## Where it lives now
- **PR #42** — `fix: route flash + channel through cleaner, add Thai, fix Cocoon label zero-width`
  https://github.com/funzi7/paywall-bot/pull/42
- **Branch:** `claude/foreign-script-cocoon-fixes`
- **Branch head SHA:** `2a294ed` (`2a294ed57d2d92cd6dabbffc83bd54fea35da791`)
- **Base:** `main` (cherry-pick base `f0d133e`, latest main at branch-creation time)
- Status: OPEN, awaiting Codex review + CI; NOT merged (owner merges).

## Why a new PR
PR #32 (`claude/article-inline-images`) was merged to main at 2026-06-28 05:37
(merge commit `6c0432a`, head `2553d58`) just before fix commit `fcace5b` was
pushed to that branch. A closed PR runs no `pull_request` CI and `ci.yml`'s
`push` trigger is main-only, so `fcace5b` could not be CI-gated or merged from
the old branch. Resolution: branched off latest `origin/main`, cherry-picked
`fcace5b`, opened PR #42.

## Conflict status
**Clean cherry-pick — no conflicts.** `fcace5b`'s parent `2553d58` is already in
main via the #32 merge, so the diff applied directly (git auto-merged
`core/article_parser.py`; both the inline-image feature already on main AND all
four fixes are present). New commit on the branch: `2a294ed`.

## The four fixes (unchanged from fcace5b)
1. **Flash route** (`core/main.py` `_post_flash`): clean `item.title` via
   `_global_clean_title` (empty → `מבזק` placeholder) and `item.description`
   via `_global_clean_paragraph`; foreign-dominant/empty body → title + 🔗 link
   only (never raw body); keep 🔸/🔗 + 600-char truncate on cleaned body.
2. **Channel** (`core/tg_bot.py` `_publish_clean_message`): a non-blank line that
   cleans to None (foreign-dominant) is DROPPED (mirrors Telegraph page);
   blank/whitespace-only separator lines kept verbatim.
3. **Thai** (`core/article_parser.py` `_GLOBAL_FOREIGN_RANGES`): added
   `(0x0E00, 0x0E7F)` so Thai is char-stripped from mixed lines.
4. **Cocoon label** (`core/article_parser.py`): `_CAPTION_SEP` widens the
   inter-word separator in `_COCOON_CAPTION_RE` + `_COCOON_CAPTION_INLINE_RE` to
   accept Cf zero-width/bidi marks (U+200B/C/D/2060/FEFF/200E/200F) so the
   Hebrew caption replacement fires; plus zero-width output hygiene
   (`_ZERO_WIDTH_STRIP`, excludes LRM/RLM) at the end of both clean functions.

## Changed files (diff vs main) — only these four
- core/article_parser.py  (+30/-~)
- core/main.py            (+37/-~)
- core/tg_bot.py          (+17/-~)
- tests/test_message_format.py (+188)
Total: 4 files, 254 insertions, 18 deletions.

## Tests
`python3 -m tests.test_message_format` → **All tests passed, 141/141** (was
134 on main pre-fix; +7 new: E1E1E/F1F1F flash, G1G1G channel-drop, H1H1H Thai,
I1I1I caption zero-width/bidi, J1J1J zero-width hygiene, K1K1K CJK-glued guard).
6 fail-before/pass-after; K1K1K passes both. No assertion weakened.

## CI
PR #42 triggered `test-message-format` (the merge gate) — in_progress at report
time; result will show on the PR. (`check-codex-status` also running — codex
gate, separate from the test CI.)
