# paywall-bot — latest Claude Code session state

Updated: 2026-07-21 (UTC), source-health resilience round

## What just happened

PR #82 merged (main `cf1a6b6`). The daily health run surfaced discovery/
health-accuracy issues, fixed in **PR #83 (open, do not merge without
review)**: branch `fix/techfeedil-source-health-tgspot-fallback` from
`cf1a6b6`, head `25a325450fc17d80df154678ca1b48bbbd494fe3`, non-draft,
1 commit, 10 files, no `state/` files.
https://github.com/funzi7/paywall-bot/pull/83

Scope was discovery/health only: no page repairs, no page-doctor, no
backfill, no Telegram posts, no state mutation.

## Incidents + fixes

- **TGspot RSS 415** (unexpected content type, no items →
  no_representative_item): first-party-only `fallback_discovery` chain on
  tgspot-main, shared by production `_try_feed` and health `probe_feed`:
  canonical `/feed/` (advertised on TGspot's own RSS page) → official
  website listing (html_category + strict article_url_pattern) →
  official Telegram channel preview `t.me/s/tgspotcoil` as URL-REFERENCE
  fallback only (direct tgspot.co.il links, per-message timestamps, no
  post text/media/Telegram attribution, per-poll cap 6, cross-path+state
  dedup, own `::telegram_preview` feed_id → independent first-sight
  baseline, normal defer/24h-max-age, fail-safe parsing, no Telethon).
  415 never suppressed — success requires parseable first-party items.
  Live re-diagnosis egress-blocked; evidence + owner curl matrix in
  docs/techfeedil-attribution-health.md.
- **Effective-vs-primary health**: probe details primary_status/reason +
  fallback_attempted/name/status/reason + effective_status +
  fallback_chain; history tracks effective_last_success_at (fallback
  success counts — "Last success: n/a" impossible while fallback serves)
  and primary_last_success_at. Degraded keeps items → representative
  extraction candidate survives primary-RSS failure.
- **Alerts**: urgent only on EFFECTIVE failure after threshold; ONE
  fingerprint-deduped healthy→degraded transition notice (silent repeats
  while fallback healthy; stays in digest); recovery notice on effective
  recovery; manual runs never increment scheduled counters.
- **Quiet sources**: freshness fresh/idle/stale; idle (≥24h default)
  stays healthy; only per-feed silence_sla_hours degrades
  (stale_feed_beyond_silence_sla + feed_lagging_website:<n> from one
  bounded website probe); valid stale feed never `failed`. Two old
  stale→failed pins updated deliberately (test_source_health, wave2).
- **Digest**: coherent clauses — "direct discovery blocked by Radware;
  Jina discovery succeeded" / "direct extraction HTTP 403; Jina
  extraction succeeded" / "primary feed HTTP 415; the official Telegram
  channel preview succeeded". Root cause of the contradictory
  "(Jina fallback failed)": missing jina_extraction_succeeded pattern +
  unconditional suffix keyed on a detail extraction never sets. Fixed +
  pinned.
- **Future scope documented only**: generic Telegram ingestion layer
  (official channels reference, flash channels reposted with
  attribution, >500-char posts → Telegraph, no flash minimum,
  anti-flood/baseline/dedup) — NOT implemented.

## Test matrix (all green locally, all in ci.yml)

185 message-format checks + unittest 21+17+50+42+13+15+13+12+11+11 +
NEW `tests/test_techfeedil_tgspot_health.py` (17); compileall, workflow
YAML, `bash -n`, `git diff --check`, state-clean gate.

## Post-merge (owner)

1. Merge PR #83 through review; watch the next daily health run: TGspot
   should read degraded-with-fallback (or healthy via /feed/), digest
   lines coherent, Gadgety idle-not-broken.
2. Complete the live TGspot 415 header-matrix diagnosis from an
   egress-capable machine (curl commands in the doc) and, if `/feed/`
   proves canonical, consider swapping the primary URL.
3. Still pending owner-run page-doctor repairs: Apple-Watch page (from
   #82 round) + earlier Android/Kimi/Verifier pages.
4. Poll & Post — Tech Feed IL: re-enable if it was disabled for #82.

## Standing rules (unchanged)

Work only in funzi7/paywall-bot (+ this memory repo). Never write the
owner's personal name. Commits as funzi7
(207505227+funzi7@users.noreply.github.com). Never print secrets. No
Backfill; no publishing during development; never mutate tracked
`state/` files (CI enforces). Verify PRs via API with full 40-char
SHAs. gh CLI unavailable — GitHub MCP tools. `_activate` test isolation.

## Earlier history

PRs #72, #77, #78, #79, #80, #81, #82 — all merged (see
handoffs/CONTEXT.md §8–§11g for the full trail).
