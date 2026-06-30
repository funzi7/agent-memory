# paywall-bot — subtitle foreign-ratio guard (PR #55, 2026-06-30)

Status: **PR #55** OPEN → main, branch `claude/subtitle-foreign-guard`, head **`936fbc98`**,
URL https://github.com/funzi7/paywall-bot/pull/55 (verified via API: state=open, merged=false,
2 files / +72, CI pending). Not merged (owner merges after CI + Codex). Closes the Chinese-Cocoon
diagnosis (`95b449b`).

## Fix — drop foreign-dominant subtitle candidates
A fully-Chinese block reached the page as the **subtitle blockquote**. The two foreign filters
(`_is_noise_text` foreign-ratio + `_global_clean_paragraph` char-strip/Hebrew-floor) cover
body/cocoon/title/captions, but **`_extract_subtitle`** (`core/article_parser.py:1426`) applied
ONLY `_is_subscriber_prompt` — no foreign-dominance check (deliberate: PR #17's ≥30-Hebrew-letter
floor wrongly dropped short subtitles). So the subtitle was the one render path skipping the
foreign filter, relying solely on `_global_clean_paragraph` in `_finalize`.
- **`core/article_parser.py` `_extract_subtitle` (~line 1449-1456)**: before returning a candidate,
  `if _foreign_script_ratio(raw) > FOREIGN_SCRIPT_THRESHOLD: continue` — same guard `_is_noise_text`
  uses, applied to the RAW candidate (pre-clean). `_is_subscriber_prompt` kept. RATIO check (not a
  min-Hebrew-letter count) → no PR #17 short-subtitle regression (short Hebrew subtitle ratio 0.0
  passes; only foreign-DOMINANT candidates dropped).

## Test (tests/test_message_format.py)
- **V1V1V** `test_v1v1v_subtitle_foreign_dominant_dropped`: POSITIVE — CJK-dominant
  `meta[description]` and `h2.article-header__sub-title` → `_extract_subtitle` returns None →
  `_build_nodes` emits no `blockquote`. NEGATIVE — short Hebrew subtitle (`תקציר שווי שוק BST
  DriveNets`, ratio 0.0) still returned + rendered as a blockquote. Full suite green. Only
  `core/article_parser.py` + `tests/test_message_format.py` changed.

## Note on reproducibility
The exact "וול סטריט ננעלה בעליות" Chinese-Cocoon snapshot remains **unrecoverable** (transient
live-blog state, rotated; one3ft/wayback no longer serve it — see `95b449b`). This fix is the
evidence-based hardening of the one structural gap (subtitle path); it is not a confirmed live
repro. Cocoon/body/title/caption were already covered. If Chinese recurs, capture the live
snapshot AT POST TIME (the live blog won't hold it).

## Main / repo state
- **PR #53** (Join CTA) **MERGED** (`bca520b`).
- **PR #54** (srcset precrop + in-body source link) — **REAL, OPEN, NOT phantom** (verified via
  API: head `claude/srcset-and-source-link` @ `2ea3f375`, base main). Awaiting CI + merge.
- **PR #55** (this subtitle guard) OPEN, awaiting CI + merge.
- **PR #52** (automation-core sync) and **PR #35** (old capture diag) still OPEN.
- Main carries no diag workflow. Video confirmed plays gif-style
  (telegra.ph/VIDEO-EMBED-TEST-06-30). Bold-stocks: queued (not started).
- **Temp branches pending MANUAL deletion** (proxy blocks git-refs DELETE → push hangs up):
  `diag/run-cocoon`, `diag/run-fullbody`, `diag/run-srclink`, `diag/run-brokenimg`,
  `diag/run-consolidated` (also stale: `diag/telethon-vs-posted-guids`).
