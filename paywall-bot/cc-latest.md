# paywall-bot — Tech Feed IL stale/promo discovery-queue hotfix handoff

Date: 2026-07-19 UTC

This is the current authoritative agent handoff (supersedes the PR #77
attribution/health handoff, which is preserved in `handoffs/CONTEXT.md` §11
and `docs/techfeedil-attribution-health.md`). This hotfix's record is
CONTEXT §11b plus the "Stale/promotional queue hotfix" section of the same
docs file.

## Git and pull request

- Primary repository: `funzi7/paywall-bot`.
- Authoritative starting `origin/main`:
  `4496513bf1d90f88eb95fdf3b021d86e84768e2b` (PR #77 merged at `dabad7f` +
  the first post-merge production poll state).
- Branch: `fix/techfeedil-stale-promo-queue`.
- Hotfix commit / local HEAD / remote HEAD / PR head (verified equal):
  `9c622697543ae92107171f4f5b24b9b0d29a0392`.
- Ready, non-draft PR: **#78**,
  `https://github.com/funzi7/paywall-bot/pull/78` — verified via API: open,
  targets `main` (base exactly `4496513…`), `draft: false`, head SHA as
  above. NOT merged. No Backfill was run; nothing was published; no
  production state file is edited by the PR.

## Incident

The 18:16 UTC poll (first after PR #77) worked as designed — The Gadget
Reviews baseline was created, the previously frozen TGspot feed flowed —
but it queued three TGspot items, including `godeal24-jul26-vol2`
(published 2026-07-16T16:00Z, **74h old at discovery**, "משלמים פעם אחת
וזהו: … במחירי קיץ מיוחדים" — a pure GoDeal software-license sale). The
Android-backup (13:38Z) and Kimi/OpenAI (17:08Z) items are legitimate.
Gaps: no admission age limit (a repaired feed can queue everything its
baseline missed, however old) and no TGspot promo exclusion (TGR already
had one).

## The hotfix

- **A. TGspot promotional exclusions** (`sites/techfeedil/config.yaml`,
  existing feed-filter architecture — not Telegram-side): narrow
  `exclude_title_url_pattern` (godeal…/coupon/deal URL slugs, bounded
  קופון/קופונים tokens, explicit sale phrases מחירי קיץ/חורף/אביב/סתיו/חג/
  השקה מיוחדים, מבצע לזמן מוגבל) + `exclude_categories`
  קופונים/מבצעים/דילים. Reviews ("האם שווה את המחיר?"), launches and
  substantive price reporting ("מחיר האייפון בישראל ירד…") tested NOT
  matched.
- **B. Admission freshness guard** — `defer.max_new_item_age_hours`
  (Tech = 24; TheMarker unset → disabled/unchanged). Enforced in
  `core.main._phase1_discover` at FIRST discovery, only with a trustworthy
  feed timestamp; fresh-admitted items are never evicted for aging through
  retries; timestampless items keep the existing flow. Suppressed
  identities go to bounded `state["suppressed_items"]` (key/reason/
  source_id/published_at only — never titles/bodies; cap 300) and
  `_filter_fresh_items` excludes them, so stale feed rows neither reappear
  each hourly poll nor consume the per-run cap.
- **C. One-shot queue cleanup** — `_cleanup_stale_promo_deferred`
  (core/main.py; runs in `run_poll` after `_normalize_deferred_queue`,
  gated on max_new_item_age_hours + marker `stale_promo_cleanup_v1`).
  Re-evaluates ONLY existing deferred entries from stored metadata:
  removes entries already beyond the limit at their ORIGINAL
  `first_seen_at`, or failing their own source's current feed exclusions;
  retained entries stay byte-identical (retry_count/first_seen_at
  preserved). Replayed on a copy of the committed production state:
  removes exactly `godeal24-jul26-vol2`
  (`promotional_filter_cleanup`), retains the two legitimate articles,
  second run is a byte-identical no-op, removed identity filtered from
  re-discovery.

## Validation

- NEW `tests/test_techfeedil_hotfix.py` — **12 OK** (72h reject at
  discovery incl. no-title registry; 5h accept; fresh-then-aged retained
  with retry count; timestampless never rejected; godeal URL + pure
  sale-title rejected; substantive price coverage retained; exact
  three-item production fixture removes only the deal; suppression
  persists across polls; idempotence + marker gating; TheMarker unchanged
  incl. inert cleanup; Telegraph/Telegram calls hard-fail if attempted).
  Wired into `.github/workflows/ci.yml`.
- Full matrix green: `tests.test_message_format` 185 checks
  (`All tests passed.`); unittest `tests.test_techfeedil` 21,
  `tests.test_techfeedil_wave2` 17, `tests.test_source_health` 50,
  `tests.test_techfeedil_quality` 42, `tests.test_techfeedil_hotfix` 12
  (142 total, OK); `compileall`, PyYAML parse of all 16 workflows,
  `bash -n scripts/*.sh`, `git diff --check` — pass.
- `state/errors.log` test noise restored before commit; no state files in
  the diff.

## Post-merge (owner)

1. Merge PR #78 through the normal review process. **Do not run Backfill.**
2. On the next scheduled poll expect the log line
   `deferred cleanup: removed …godeal24-jul26-vol2… (promotional_filter_cleanup)`
   and `state["suppressed_items"]` gaining that identity with the marker
   `stale_promo_cleanup_v1` set.
3. The Android-backup and Kimi/OpenAI articles publish through the normal
   30-minute defer lifecycle (verify channel-brand header, footer-only
   source link, byline rules, Hebrew AI-summary caption, topic tags with
   source last — per the PR #77 checklist).
4. GoDeal/coupon rows must never enter `deferred_items` again; older-than-
   24h rows at discovery are suppressed with `stale_at_discovery:<age>h`.
