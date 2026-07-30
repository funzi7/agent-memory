# paywall-bot — PR #87 final-boundary RTL and source-health handoff (2026-07-30)

## Git and pull request

- Repository: `funzi7/paywall-bot`.
- Actual fetched starting `origin/main`: `3984794798293eff28c89965a1077769ba2f1ee5`.
- Branch: `fix/techfeedil-rtl-excerpts-source-health-20260730`.
- Final branch/PR head: `84e7c1c517e545a08b5b6e55b196c934a8123818`.
- Draft PR #87: https://github.com/funzi7/paywall-bot/pull/87, targeting `main`; not merged.
- Current read-only main at final diagnosis: `4557f89a1b7d73db6851ca5b29ff692c59746440`.
- Starting/current production-state blobs:
  `state/techfeedil.json` `cff7e9da31dfec31353e8360ab233081ef7b6adb` /
  `62990159174808418d2a05e73d77582e289041b5`;
  health `1fcd4e9d743826d99a3c915e7906bf0ff3fc4fa4` unchanged.
  PR #87 changes no tracked `state/` path.

## Root causes

1. pc.co.il/456036, message 361: `build_article_message` added the trusted
   RTL isolate around the English-led `xAI` excerpt, then
   `tg_bot._publish_clean_message` ran the assembled line through the
   semantic source cleaner and removed the controls immediately before
   `Bot.send_message`.
2. geektime.co.il/everybody-hates-anthropic, message 358: the publisher
   description was an unfinished prefix of the first body paragraph, with no
   generated ellipsis. It was selected for Telegram and rendered as a
   Telegraph blockquote before the complete paragraph.
3. Telegraph force mode did not require the native title/author metadata
   policy; Jina used `summary_blocks_remaining = 1`; Tech excerpts still had
   fixed 800/500 caps and a legacy hard slice.
4. Copied production deferred rows stayed at retry zero because phase-2
   exceptions incremented aggregate errors but did not advance row lifecycle.

## Implementation

- Semantic clean → MarkdownV2 escape → one exact renderer-owned
  `RLM+RLI … PDI+RLM` wrapper. Final-send validation trusts controls only at
  exact outer positions, URL-only lines stay bare, and initial/RetryAfter sends
  reuse the identical payload. Source controls remain rejected.
- One idempotent Tech-only display policy covers Telegraph request
  `title`/`author_name` and serialized content nodes without contaminating
  semantic identity/fingerprint/tag values. TheMarker remains feature-off and
  byte-pinned.
- Generic NFKC/whitespace/quote-dash subtitle/body comparison removes only
  unfinished substantial prefixes across direct HTML/Jina/finalization.
- Tech dynamic fitting keeps the complete excerpt when the exact escaped,
  wrapped UTF-16 payload fits 4,096 units; overflow truncates at sentence,
  word, then combining/emoji-sequence boundary with ellipsis.
- HTML keeps complete Cocoon p/li blocks. Jina collects a provisional bounded
  region and stops on structural, repeated-lede, material-shape or corrupt
  first-block evidence without swallowing body.
- A source-health 429 records bounded `Retry-After` and makes no fallback or
  article request in that run; a recent representative identity may be reused
  without a cached body. TGR has a bounded official-home fallback for
  non-cooldown failures.
- Tech phase-2 exceptions/publish/send failures advance bounded retry/terminal
  lifecycle. failed→degraded emits recovery only; healthy→degraded emits one
  degradation; unchanged effective states are silent.

## Read-only live evidence

- N12 TECH12: direct Radware challenge; Jina and inspected official N12/Mako
  category/RSS/embedded forms did not prove current same-scope TECH12 URLs.
  Broader Digital/Nexter was not substituted; no fallback added.
- The Gadget Reviews: official RSS 429/cooldown; official home listing current
  with canonical dated review URLs; conservative token-gated fallback added.
- The Verifier: direct/Jina 403; public official RSS remained discoverable but
  no official complete accessible article representation was proven; no
  fallback or access-control bypass.
- Exact stuck rows in copied state: gadgety.co.il/366030/xmc-1200-של-xmems,
  pc.co.il/455617, pc.co.il/455771. No posted canonical/terminal identity was
  proven; pc/455771 remained live. No manual deletion or one-shot cleanup.

## Tests and safety

Final-head CI run 30585622054 passed every focused suite, 360/360 full-discovery tests, compileall, all workflow-YAML parses, all shell syntax checks, the state guard and git diff checks.

CI covers all named Tech suites, `tests.test_message_format`, full unittest
discovery/complete TheMarker regressions, compileall, every workflow YAML,
every tracked shell with `bash -n`, `git diff --check`, and
`git diff --exit-code -- state/`. Exact Telegram/Telegraph/DM/state-save
boundaries are mocked. No real publication, page edit, repost, owner DM,
Backfill, page-doctor, production-state save, token display or article-body log
occurred.

## Blockers / uncertainty

- No proven current same-scope first-party N12 TECH12 fallback.
- No proven complete public first-party The Verifier extraction representation.
- Local Python/git-network execution in this Termux/PRoot session is blocked by
  the runner's bubblewrap `fchdir to oldroot` failure; the exact remote PR
  head is validated by GitHub Actions.
