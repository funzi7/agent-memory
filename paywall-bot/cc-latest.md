# paywall-bot — latest Claude Code session state

Updated: 2026-07-20 (UTC), post-#80-merge follow-up

## What just happened

PR #80 was merged by the owner (main `65c1738`, then state commits →
`b454eae`). The FIRST post-#80 poll surfaced two remaining shared issues,
fixed in **PR #81 (open, do not merge without review)**:
branch `fix/techfeedil-rtl-source-tag` from `b454eae`, head
`706b2e7b62052b4d5db1ce490ffe6108504efc52`, non-draft to main, 1 commit,
10 files, no `state/` files.
https://github.com/funzi7/paywall-bot/pull/81

## Incident A — English/digit-leading lines still LTR

"Teclast P50 2026 …" lines rendered left-aligned in Telegram AND
Telegraph (incl. Cocoon). A single leading RLM was insufficient; in
Telegraph the mark could be a STANDALONE invisible child (["‏", {em}])
that a renderer merges/drops.

**Fix (force-RTL tenants only; TheMarker byte-identical):** every text
unit is BRACKETED with trusted RLMs at both ends.
- Telegraph `_rtl_children` + `_rtl_prefix_first_text`/`_rtl_suffix_last_text`:
  marks EMBEDDED into first/last real text node, descending into
  em/strong (Cocoon caption + paragraphs); bare RLM child only when a
  block ends in an anchor (footer trailing pin after the link). Validator
  caption count now direction-mark-insensitive.
- Telegram `core.main._rtl_text_line`: title (mark also inside the bold
  entity), excerpt, hashtag line, flash lines bracketed; bare-link lines
  unmarked. Latin runs/specs/numbers keep internal order.
- Two old force-mode pins updated deliberately (trailing RLM now
  unconditional; title mark inside bold).

## Incident B — pc.co.il post shipped without a source hashtag

Source tag hung off URL-host parsing only. **Fix:** deterministic
identity-first resolution — `tags.SOURCE_ID_TAGS` + `source_tag_for`
(source_id → source_domain → URL host), independent of topic detection;
`build_tags` guarantees it LAST, exactly once, never capped out, present
even with zero topic tags. Identity threads parsed.source_id/domain →
`_post_article` → `build_article_message` → `build_message_tags`
(TheMarker positional contract untouched via TypeError chain).
Canonical map: gadgety→גאדגטי, geektime→גיקטיים, tgspot→TGspot,
theverifier→TheVerifier, n12→N12, pc→אנשים_ומחשבים, walla→וואלהTECH,
hwzone→HWzone, thegadgetreviews→GadgetReviews.

## Test matrix (all green locally, all in ci.yml)

185 message-format checks + unittest 21+17+50+42+13+15+13+12 + NEW
`tests/test_techfeedil_rtl_source_tag.py` (11); compileall, workflow
YAML, `bash -n`, `git diff --check`, `git diff --exit-code -- state/`.

## Post-merge (owner)

1. Merge PR #81 through review; watch the next poll: English-leading
   Telegram/Telegraph lines must right-align; every post's last hashtag
   must be its source tag (esp. pc.co.il posts).
2. Still pending from earlier rounds (egress-blocked sandbox, owner-run):
   page-doctor repairs for the Android/Kimi/Verifier pages —
   docs/techfeedil-attribution-health.md has the exact commands.
3. `telegraph.author_name_rlm` experiment remains default-off pending
   live verification (native author-strip alignment is Telegraph-side).

## Standing rules (unchanged)

Work only in funzi7/paywall-bot (+ this memory repo). Never write the
owner's personal name. Commits as funzi7
(207505227+funzi7@users.noreply.github.com). Never print secrets. No
Backfill; no publishing during development; never mutate tracked
`state/` files (CI enforces). Verify PRs via API with full 40-char SHAs.
gh CLI unavailable — use GitHub MCP tools. Test isolation: `_activate`
pattern re-points ERROR_LOG per suite.

## Earlier history

PR #72 (wave 2), #77 (attribution/health), #78 (queue hotfix +
state-hygiene gate), #79 (Cocoon gate/validator/IV ledger/page doctor),
#80 (Verifier content + RTL + multi-publisher hardening) — all merged.
