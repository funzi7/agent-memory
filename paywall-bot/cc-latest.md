# paywall-bot — RTL alignment via RLM (PR #70, 2026-07-06)

Status: **PR #70** OPEN → main, branch `claude/rtl-rlm-alignment`, head **`ca0ab6e`**,
URL https://github.com/funzi7/paywall-bot/pull/70 (verified via API: state=open, merged=false,
3 files, +201/−33). Codex Gate + merge-bot handle gating/merge. `handoffs/CONTEXT.md` read first
and updated in the SAME commit. Closes CONTEXT TODO #3 (LTR alignment).

## Fix — prepend RLM to Hebrew-containing Telegraph blocks
Telegraph aligns each block by its FIRST strong-direction character and the pipeline had no
direction mechanism — a Hebrew paragraph/cocoon opening with a Latin/foreign token rendered LTR.
`core/telegraph_pub.py`:
- **`_RLM = "‏"` + `_rtl_children(children) -> list`** (new, defined with `_rtl_node_text`
  just above `_inline_image_figure_node`): when the node's combined text (nested children
  included) contains a Hebrew letter `[א-ת]` and doesn't already start with RLM —
  `children[0]` string → RLM prefixed in place; otherwise (leading markets-emphasis `<strong>`,
  cocoon `<em>`, byline `<strong>`) a bare RLM string is inserted as the new first child.
  Returns a NEW list. No Hebrew → returned unchanged (pure English/numbers stay LTR).
- **Applied at ALL `_build_nodes` emission points** (7 wiring sites): body paragraphs — AFTER
  `_emphasize_markets_children` — subtitle blockquote, Cocoon label line + every cocoon
  paragraph, byline "מאת:", figcaptions (`_inline_image_figure_node`), footer "מקור: TheMarker",
  and the source-link "כתבה מקורית:" line.
- **Untouched:** createPage `title` parameter; `_emphasize_markets_children` internals (its
  byte-preservation tests unchanged — RLM wraps around its output).

## Tests (tests/test_message_format.py; standalone suite all green)
- **I2I2I** `test_i2i2i_rlm_prepended_to_latin_opening_hebrew_paragraph` — 'World Liberty
  Financial הפכה את הסיפור' → p children start with "‏"; paragraph opening with a strong
  node (leading "טסלה" match) → `children[0] == "‏"` inserted BEFORE the strong.
- **J2J2J** `test_j2j2j_rlm_not_added_to_pure_english_paragraph` — pure-English → no RLM anywhere.
- **K2K2K** `test_k2k2k_rlm_on_subtitle_cocoon_and_figcaption` — Hebrew subtitle blockquote /
  cocoon paragraph / figcaption open with RLM.
- Pre-RLM assertions updated (expectations unchanged, just skip/strip the mark): **JJJ**
  (cocoon render), **M1M1M** (byline node finder), **H2H2H** (markets-emphasis body-only).
Validation: `python3 -m py_compile` OK on changed modules; `python3 -m tests.test_message_format`
all green (full pytest can't run in sandbox — CI `test-message-format` is the arbiter).

## CONTEXT.md changes (same commit)
- §6: **TODO #3 (LTR alignment) marked DONE via RLM** with the implementation record above.
- §6: **5 NEW OPEN TODO items** (production posts 2026-07-03→06):
  a. inline-split spaces generalized — spaces INSIDE words ("ח וק" for "חוק") and before
     punctuation ("במחלוקת .") — same family as the old drop-cap join bug; raw-HTML diagnosis pending.
  b. fully-foreign (Thai) cocoon block published AND literal English "Cocoon AI Summary" label
     surviving on some posts — path unknown, diagnosis pending.
  c. isolated foreign homoglyphs inside Hebrew words persist (ط, ب, 预计将) — source-vs-pipeline
     diagnosis pending.
  d. one channel post linked a telegra.ph URL returning 404 ("איתות עצבני בשוק ה-AI", 07-05) —
     createPage-URL vs posted-URL comparison pending.
  e. trailing related-article headlines leaked at the end of one body (07-06 Buffett/investment-
     managers post) — end-marker/truncate gap pending.

## Repo state
markets-emphasis (#62) merged to main (`_emphasize_markets_children` live); #58/#59/#61 merged
earlier. PR #70 (this) open awaiting Codex + gate + merge-bot. Sync-PR gate quirk still applies
(no Codex review on sync PRs → override label `codex-p1-acknowledged`). Manual-delete branches
still pending: `diag/run-brokenimg`, `diag/run-srclink`, `diag/telethon-vs-posted-guids`.
