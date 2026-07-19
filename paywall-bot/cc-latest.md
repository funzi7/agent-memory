# paywall-bot — Cocoon ASCII integrity + Instant-View verification handoff

Date: 2026-07-19 UTC

Current authoritative agent handoff (supersedes the PR #78 stale/promo
handoff; that record stays in `handoffs/CONTEXT.md` §11b). This task's
record: CONTEXT §11c + the "Cocoon ASCII corruption + missing Instant View"
section of `docs/techfeedil-attribution-health.md` (incl. the exact
post-merge repair procedure).

## Git and pull request

- Primary repository: `funzi7/paywall-bot`.
- Authoritative starting `origin/main`:
  `3f70b53c1b396a95d58227ff54161f4f13dfd35d` (PR #78 merged at `a9e1610`,
  publishing poll state `8d900d9`, later TheMarker state commit).
- Branch: `fix/techfeedil-cocoon-instant-view`.
- Commit / local HEAD / remote HEAD / PR head (verified equal):
  `3ee97d1e7d0782990a43fe0b46cf2ec9411d8dc1`.
- Ready, non-draft PR: **#79**,
  `https://github.com/funzi7/paywall-bot/pull/79` — verified via API: open,
  targets `main`, `draft: false`, head SHA as above, 12 files, NO file under
  state/. NOT merged. No Backfill; no publish; no Telegraph create/edit; no
  channel post or owner DM during development.

## Production evidence (poll run 29704212502, ~21:22 UTC, from logs + state 8d900d9)

- Both TGspot articles published via `direct`, `foreign=0`:
  - **Android backup**: page's AI-summary area visibly shipped `b6b`,
    `google-`, `awy` + raw `Cocoon AI Summary` label with corrupted
    word/RTL boundaries. POST-RECORD `cocoon=0` — widget text rode the
    extracted content (body fingerprint `גוגלgoogle…` shows glued Latin);
    all tokens are printable ASCII → invisible to the Unicode-only scan
    (that is WHY it was insufficient: it whitelists all printable ASCII).
  - **Kimi**: preview card, no ⚡ Instant View; Android post from the SAME
    run has IV. Concrete structural diffs: `images=1` vs `0`, `---` run in
    the Telegraph path (title's " – "). IV root cause = documented
    Telegram-side uncertainty (IV generation is async server-side;
    sandbox cannot reach telegra.ph/MTProto) — resolved operationally via
    the new verification + doctor cached-page check, not guessed.
- The Verifier article sits deferred; Poll workflow intentionally disabled
  until this merges.

## The fixes

- **Cocoon token-integrity gate** —
  `article_parser.sanitize_cocoon_paragraphs`, tenant opt-in
  `ai_summary.strict_token_gate` (Tech on, TheMarker off). Every
  Latin/alnum token needs evidence: `COCOON_LATIN_ALLOWLIST` (AI/API/SMS/
  GB/MB/…), `COCOON_BRAND_CANONICAL` (Google/Android/OpenAI/ChatGPT/Kimi/
  Moonshot/… with safe lowercase→canonical normalization), article-context
  tokens (title/subtitle/body), or valid shape (TitleCase brand, `K3`
  model, `15GB` unit, 4–5-letter acronym). Rejected CLASSES: 1–3-letter
  lowercase fragments (`awy`), alnum garbage (`b6b`), dangling hyphens
  (`google-`), Latin glued to Hebrew (prefix forms `ל-15GB`/`ב-SMS`
  valid), punctuation runs, vendor residue. Unexplained token → drop
  paragraph; dropped ≥ kept → omit ENTIRE block. Fail closed: missing
  summary acceptable, corrupted one is not. `COCOON-GATE` bounded logs.
- **Wide vendor-label matcher** — `vendor_label_present` /
  `strip_vendor_label_wide`: per-letter with optional separators (space,
  zero-width, bidi, soft hyphen, dash, underscore, dot, glued) — catches
  casing/HTML-nesting/obfuscation variants; label never enters
  `cocoon_paragraphs`; Tech caption `🤖 סיכום AI של Tech Feed IL` renders
  exactly once iff a valid block renders (standalone strong-node count, so
  a label-normalized subtitle isn't a false duplicate); serialized-node
  assertions prove absence.
- **Final publish-boundary validator** —
  `telegraph_pub.validate_publish_fields` + `_serialized_page_violations`
  immediately before createPage/editPage, per-field: vendor label, control
  chars, unsupported-script LETTERS (emoji/symbols remain log-only),
  strict cocoon gate. Cocoon-only findings → drop block, rebuild once,
  revalidate; mandatory-field findings → DO NOT publish (defers).
  `PUBLISH-VALIDATE url= field= reason= token= codepoints= context=`
  bounded diagnostics. `publish_article(edit_path=…)` → `editPage`
  (repair only; never duplicate page, never a Telegram post).
- **Instant-View verification** — opt-in
  `features.instant_view_verification` + `instant_view:` schedule
  (window 6h, recheck ≥20min, ≤5 checks/run, max age 48h). Bounded
  body-free `state["publication_ledger"]` (cap 100: identity, Telegraph
  URL, message id via new `tg_bot.LAST_MESSAGE_ID`, timestamps, iv_status,
  alerted). `_verify_instant_view_ledger` in run_poll rechecks read-only
  via new `telethon_client.message_webpage_status` (`cached_page` ⇒
  instant_view; else preview_no_iv / preview_pending /
  inspection_unavailable). One owner alert per publication after the
  window; never delete/repost/duplicate.
- **Page doctor** — `tools/telegraph_page_doctor.py`: read-only diagnose
  (`--url` / `--message-id`: validity, node summary, contamination
  findings, cached-page status); repair dry-run by default, `--apply` +
  exact path + `--source-url` required, re-parses with production code,
  full validator, `editPage` only, refuses non-owned pages, no
  credentials/full-body logging.

## No-publish replay (J)

State copy of `8d900d9` + sanitized Android fixture through the real
parser: raw widget summary extracted (2 paragraphs + label) → gate omits
the block (`vendor_label_only`, `alnum_garbage`,
`block_incoherent_after_drops`) → final nodes `{figure, p×5, strong, hr,
a}` carry NONE of the four leaked tokens, no caption without a block,
body/hero/author/footer/Telegram message intact; state copy untouched;
zero Telegraph/Telegram/DM calls. Kimi vs Android structural comparison
recorded from production data.

## Validation

- NEW `tests/test_techfeedil_cocoon_iv.py` — **15 OK** (wired into ci.yml):
  exact Android fixture (four tokens absent from final nodes; valid
  Google/Android/Google One/15GB/40MB preserved; caption exactly once when
  valid; block omitted when unrepairable; article/hero/author/footer/
  message valid), token-gate matrix, vendor-label variants (zero-width/
  bidi/standalone/prefixed), mixed/fully-contaminated blocks, TheMarker
  unchanged (b6b still ships there — established behavior), validator
  abort vs repair (dash-label title aborts; control char aborts; foreign
  letters repaired upstream; emoji passes), edit_path→editPage, IV ledger
  transitions/single-alert/bounds/age-out, doctor helpers, tracked-state
  guard, hard no-network guards.
- Full matrix green: `tests.test_message_format` 185 checks; unittest
  **158** (techfeedil 21, wave2 17, source_health 50, quality 42, hotfix
  13, cocoon_iv 15); compileall; 16-workflow YAML parse; `bash -n
  scripts/*.sh`; `git diff --check`; `git diff --exit-code -- state/`.

## Post-merge (owner) — exact steps in docs/techfeedil-attribution-health.md

1. Merge PR #79 (normal review). Re-enable the Poll workflow afterwards.
2. Repair the published Android page with the page doctor (dry-run, then
   `--apply`): same URL, corrupted summary omitted, no repost needed.
3. Recheck the Kimi message: doctor `--message-id` → cached-page status;
   `preview_no_iv` after 24–48h = Telegram never generated IV; there is no
   safe forced-refresh — the ledger alerts and records instead.
4. The Verifier deferred article publishes through the validated path;
   verify the next posts' POST-RECORD + absence of PUBLISH-VALIDATE
   warnings, and `publication_ledger` IV statuses.
