# paywall-bot — markets-emphasis feature (PR #62, 2026-07-03)

Status: **PR #62** OPEN → main, branch `claude/emphasize-markets`, head **`258c890`**,
URL https://github.com/funzi7/paywall-bot/pull/62 (verified via API: state=open, merged=false,
3 files, +312/−1). Codex reviews; Codex Gate + merge-bot handle gating/merge. Did NOT touch the
#58 quality gate, fetch chain, or paragraph scoping. `handoffs/CONTEXT.md` read first and updated
in the SAME commit (per its own protocol).

## Feature — bold markets in BODY paragraphs only
`core/telegraph_pub.py`:
- **`_emphasize_markets_children(text) -> list`** (new helper, defined above
  `_inline_image_figure_node`): splits a body paragraph into mixed Telegraph children — plain
  strings + `{"tag":"strong","children":[<span>]}` nodes. Returns `[text]` when nothing matches;
  every original character/space preserved exactly (asserted byte-for-byte); no dir/bdi additions.
- **`_build_nodes` body loop** (`nodes.append({"tag":"p","children":
  _emphasize_markets_children(p)})`) — the ONLY call site. Title, subtitle blockquote, byline
  ("מאת:"), Cocoon block, figcaptions, footer "מקור: TheMarker", and the source-link node keep
  flat string children.

## Editable constants (module-level, "extend freely")
`INDEX_NAMES` (optional leading "מדד " joins the bolded span; דאו ג'ונס, נאסד"ק, S&P 500,
ראסל 2000, ניקיי, דאקס, פוטסי/FTSE, ת"א 35/125/90/בנקים/ביטוח/נדל"ן/בנייה/נפט וגז/טכנולוגיה,
מדד הבנייה, מדד הנדל"ן) · `COMPANY_NAMES` (whole-token only; טבע…בלקרוק incl. OpenAI, ספייס אקס)
· `MOVEMENT_VERBS` (all listed inflections of עלה/ירד/זינק/צנח/קפץ/נפל/התחזק/נחלש/הוסיף/איבד/
צלל/התרסק/נסוג/התאושש/התייצב/צמח) · `RECORD_PHRASES` (שיא יומי חדש, שיא (של) כל הזמנים,
שיא חדש, שבר שיא, רשם שיא).

## Matching (one pass, NON-OVERLAPPING)
Rule priority: 1) INDEX_NAMES (optional `מדד\s+` prefix inside the span) → 2) COMPANY_NAMES
(whole-token) → 3) RECORD_PHRASES → 4) movement verb + adjacent magnitude AS ONE SPAN
(`verb \s+ (?:[בל][-–־]?)? \d[\d.,]* \s* %` — bare verb with no % NEVER bolded) → 5) standalone
percentages incl. ב-X%/ל-X%. Longest-first alternation within each rule; later rules never match
inside an already-claimed span; Hebrew-safe boundaries `(?<![A-Za-zא-ת0-9])…(?![A-Za-zא-ת0-9])`
(no `\b` — gershayim inside נאסד"ק/ת"א break it). Regexes precompiled in `_EMPH_RULES`.

## Tests (tests/test_message_format.py; labels F2F2F+ because C2C2C-E2E2E were taken)
- **F2F2F** `test_f2f2f_markets_emphasis_exact_spans` — the spec sentence → strong spans exactly
  `["מדד דאו ג'ונס","עלה ב-0.6%","שיא יומי חדש","נאסד\"ק","התחזק ב-2.1%"]`; "עם נעילת המסחר"
  plain; rejoined == original.
- **G2G2G** `test_g2g2g_markets_emphasis_bare_verb_not_bolded` — "המתח עלה בין הצדדים" → no strong.
- **H2H2H** `test_h2h2h_markets_emphasis_body_only` — market text placed in subtitle/author/cocoon/
  figcaption/source-link stays flat while the body paragraph in the same build gets strong spans.
Validation: `python3 -m py_compile` on changed modules OK; standalone
`python3 -m tests.test_message_format` all green (full pytest can't run in sandbox — CI
`test-message-format` is the arbiter, per CONTEXT §5.3).

## CONTEXT.md updated in the same commit — 3 NEW OPEN TODO items (production posts 2026-07-02/03)
1. **Space-before-period after trailing numbers/Latin** ("בפברואר 2022 ." not "2022.") — diagnose
   WHERE the space is injected (node join vs source text) before fixing.
2. **Residual isolated foreign homoglyphs INSIDE Hebrew words** in cocoon/body (Arabic ر/ض,
   Cyrillic н, CJK 城市的, stray Latin fragments) — single chars pass the dominance-ratio filters
   by design; raw-fetch diagnosis (source-side vs pipeline-side) needed before any fix.
3. **Cocoon/paragraph alignment renders LTR in some posts** — no direction mechanism exists in the
   pipeline (verified); candidate fix: prepend RLM to Hebrew-containing paragraph/cocoon text nodes.

## Repo state
#58 + #59 merged (in-chain gates + fix-#15 two-check gate live on main); #61 sync merged.
PR #62 (this) open awaiting Codex + gate + merge-bot. Pending: fix #16 upstream (show-full-output)
→ sync → merge; manual deletion of `diag/run-brokenimg`, `diag/run-srclink`,
`diag/telethon-vs-posted-guids`.
