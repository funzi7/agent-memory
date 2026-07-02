# paywall-bot — ROOT CAUSE PROVEN from production logs: jina served the defective 200K post (2026-07-02)

READ-ONLY forensic pass: production `poll.yml` run logs (Part A) + fetch-chain code on main
(Part B). No code changes, no CI workflow, no temp branch, nothing posted.

## VERDICT (log-proven)
**The defective 200K post (intro + cocoon + talkbacks instead of the body) was rendered from the
`jina` (r.jina.ai) fetcher, NOT one3ft.** Production poll workflow = `.github/workflows/poll.yml`
("Poll & Post", cron `0 5-23/2 * * *`, ~10 runs/day). Run **28540546618** (job 84612950023,
2026-07-01T18:54–18:56Z — the post went out 18:56:08Z, not 07-02 morning) shows the exact chain:

```
18:56:03 DIAG attempting source=telegram … (no hit)
18:56:03 DIAG attempting source=direct  … skipping direct fetch for premium URL
18:56:03 DIAG attempting source=jina
18:56:07 jina fetch status=200 bytes=15481
18:56:07 DIAG jina dropped by jina_artifact: '## תגובות'        <- comments HEADER dropped…
18:56:07 DIAG jina end-of-body truncate at: 'כתבות שאולי פספסתם' (kept 40 paragraphs)  <- …but truncate fired AFTER the comments
18:56:07 DIAG jina after-noise: 29 paragraphs
18:56:07 parsed via jina: title_len=64, paragraphs=29, total_chars=4299, paywalled=False
18:56:07 article via jina: …/markets/2026-07-01/…/0000019f-1d65…
18:56:08 telegraph_url … telegra.ph/עד-200-אלף-שקל-לאדם-…-07-01
```
Mechanism: jina's markdown of the PAYWALLED premium page = teaser intro + Cocoon + **reader
comments** + related headlines. The `## תגובות` header was dropped as a jina artifact but the
**comment bodies beneath it were kept as body paragraphs** because the end-of-body truncate
marker only matched later at 'כתבות שאולי פספסתם'. Result: 29 paras / 4,299 chars — sails past
`is_valid` (≥4 paras, ≥1500 chars) → posted; **one3ft was never tried** (chain stops at first
validator pass). `run summary: posted=4 (jina: 1, one3ft: 3)` — the jina one is the defect.

**Control case in the same repo, run 28546630344 (politics 1e47, 20:47Z):** jina truncate DID
match `'תגובות: 2שמירה קריאת זן'` at 7 paras → jina left 1 para → failed `is_valid` → chain
continued → smry 0 → **one3ft 843KB, 8 paras → posted clean**. So the failure needs BOTH a
paywalled article on the jina path AND jina's talkback-section marker shape not matching — the
truncate-marker set (`'תגובות: N…'` matched; bare `'## תגובות'` did not act as truncate marker)
is the precise hole.

## Other defective posts — what the logs show
- **June-29 "וול סטריט ננעלה בעליות" (Chinese Cocoon)** — run **28405709091** (job 84167596232,
  posted 2026-06-29T22:05:34Z): served via **direct** (status=200, 852,198 B; live-blog → not
  premium → direct allowed), 21 paras / 3,861 chars. **Logs are SILENT on cocoon/subtitle** —
  `parsed via X:` records only `title_len, paragraphs, total_chars, paywalled`; no cocoon count,
  no subtitle text, so which field carried the Chinese cannot be proven from logs (code-side
  candidates were closed by #55's subtitle ratio guard; cocoon path already double-filtered).
- **June-30 Wall-St close** — run **28479057305** (22:10:45Z): via **direct**, 988,264 B,
  64 paras/13,767 chars, no defect signal in logs.
- **"Netanyahu byline" case — NOT traceable in logs.** The poll logs never record the
  author/byline field at all, and no run log I inspected (28540546618, 28529183304, 28479057305,
  28405709091, 28546630344) mentions נתניהו in any title/slug. Logs silent on author = a finding.
- **Logging gaps (all confirmed):** no per-post fetch-path in the Telegram/Telegraph record (only
  buried DIAG lines), no cocoon/subtitle/author logging, no node-JSON size, no teaser flag.

## Fetch-chain map (code on main, `core/article_parser.py`)
- Order (`_fetch_chain`, :54): **telegram → direct → jina → smry → one3ft → wayback**; first
  source whose parse passes validation WINS and the chain stops (`fetch_and_parse`, :3344-3391).
  No retry/warm-up per source — one GET each (one3ft cold-start 503 → falls through to wayback).
- Per-source gates: `_try_direct` (:3213) skipped for `/.premium/` + requires `not paywalled`;
  `_try_one3ft` (:3257) + `_try_wayback` (:3318) require `not paywalled`;
  **`_try_jina` (:3233-3242) and `_try_smry`/`_try_telegram` have NO paywall/teaser check** —
  only `is_valid` + `_content_validates`. jina markdown carries no paywall CSS markers, so
  `paywalled` is always False on that path.
- Validation: `is_valid` (:2786) = title + ≥`min_paragraphs` (4) + ≥`min_chars` (1500 sum).
  `_content_validates` → `_is_valid_themarker_content` (:2842) = landing-page markers,
  paste-URL echo, Hebrew-ratio ≥ min. **Nothing detects a teaser or talkbacks.**
- DEFER happens only when ALL six sources fail: `source=="none"` → `core/main.py:368`
  bump_retry (max 5 → permanent_fail) + defer to next poll (2h). Also a 30-min age gate
  (`MIN_AGE_BEFORE_POST_SECONDS`) before first fetch (:360).

## Quality-gate plug point (identified, NOT implemented)
- **Primary: `core/main.py` between :363 (`fetch_and_parse` returns) and :401
  (`publish_article`)** — mirror at the second call site :519-524 (`_fetch_and_publish`).
  Available there: `parsed` (title/subtitle/paragraphs/cocoon/inline_images/paywalled),
  **`source`** (which fetcher won), `item.link`, `state`. A gate that flags
  (a) talkback signature in `parsed.paragraphs` (descending `^\d{1,3} .+ HH:MM$` pattern) or
  (b) teaser shape (e.g. premium URL + source in {jina,smry,telegram} + body < ~2× min_chars)
  can reuse the EXACT existing defer block at :368-380 (bump_retry/record_defer) — defer-to-retry
  is already the failure mode for `none`.
- **Secondary (better UX): inside `_try_jina` at :3240** — reject a jina render of a
  `_premium_marker()` URL that contains a `תגובות` section (raw markdown check) or teaser shape,
  so the chain CONTINUES to one3ft in the SAME run instead of deferring 2h. Signals available:
  raw markdown, parsed paras/chars, url.
- Fix for the label-only hole: add `'## תגובות'` to jina's END-OF-BODY truncate markers (it is
  currently only a drop-this-line artifact), so comments after it can never be kept.

## Run-ID table
| event | run | job | time (UTC) | fetch path | bytes | paras/chars |
|---|---|---|---|---|---|---|
| 200K recorded (30-min age gate) | 28529183304 | 84573794580 | 07-01 15:35 | none (delayed-fetch record only) | — | — |
| **200K POSTED (defective)** | **28540546618** | 84612950023 | 07-01 18:56:08 | **jina** | 15,481 | 29/4,299 |
| politics 1e47 posted (clean) | 28546630344 | 84633465494 | 07-01 20:47:21 | one3ft (after jina 1-para fail) | 843,276 | 8/1,736 |
| Jun-29 "ננעלה בעליות" posted | 28405709091 | 84167596232 | 06-29 22:05:34 | direct | 852,198 | 21/3,861 |
| Jun-30 Wall-St close posted | 28479057305 | 84410865224 | 06-30 22:10:45 | direct | 988,264 | 64/13,767 |

## Main / repo state
- #53–#56 MERGED; 0 open PRs. markets-emphasis prompt not yet run; video embeds queued
  (telegra.ph/VIDEO-EMBED-TEST-06-30 plays gif-style). Nothing throwaway added by this task.
- Leftover manual-delete branches (proxy blocks git-refs DELETE from the agent):
  `diag/run-brokenimg`, `diag/run-srclink`, `diag/telethon-vs-posted-guids`.
