# cc-latest.md — affiliate-deals-bot handoff (latest)

> Rolling handoff for `funzi7/affiliate-deals-bot`. Read this first, then the
> repository documentation linked below.

## Latest milestone: backend foundation and verified KSP category logic

- Date: 2026-08-24
- Branch: `main`, tracking `origin/main`
- Project commit: `40cf2d780e0b2c4fedfc4e3569f49deb6cf3f00a`
- Commit message: `Build affiliate deals backend foundation`
- Project push: verified; local `HEAD` and `origin/main` matched the full SHA.

The repository began as a clean, empty, unborn `main` branch with an empty
remote. There was no existing code, documentation, handoff, or project memory
to preserve.

## Implemented

- Python 3.12+ backend foundation with immutable Telegram-oriented source,
  message/edit/album, UTF-16 entity, media, button, target, processing, retry,
  failure, notification, and analytics models.
- Explicit ports for ingestion, extraction, resolution, classification,
  recognition, merchant adapters/deep links, persistence, owner notification,
  publication/edit synchronization, analytics, and future marketing work. No
  real Telegram runtime or publisher was added.
- Location-preserving URL extraction, including malformed HTTP(S) candidates
  and schemeless Telegram URL entities retained/normalized for fail-closed
  handling.
- Manual HTTPS redirect resolution for 301/302/303/307/308 with bounded depth,
  loop/malformed-location/timeout/connection handling, per-hop DNS rechecks,
  all-answer IP policy, and DNS-pinned TLS transport.
- SSRF rejection for localhost/internal hostnames, loopback/link-local/private
  and other non-global addresses, transition ranges, legacy numeric IPv4 forms,
  mixed unsafe DNS answers, and Azure platform VIP `168.63.129.16`.
- Conservative URL classification. KSP root hosts and real KSP subdomains are
  conversion-required; only exact approved hosts reach `KSPAdapter`. Deceptive
  suffixes such as `ksp.co.il.evil.example` do not match.
- `KSPAdapter` only: affiliate ID `14095`; verified single/multi-category
  conversion with exact identifier preservation; observed `/web/cat/` alias
  destination support; existing `/cat/14095-...` and
  `/appkey/14095/cat/...` candidates; separate fresh validation requiring safe
  2xx KSP category behavior and exactly one `appKey=14095`.
- No `affToken` synthesis. A real opaque server-generated token may remain only
  on an existing candidate, is not identity proof, and is redacted from
  evidence. Credential-shaped KSP query parameters fail closed.
- Permanent all-or-nothing gate: every commercial decision must replace with
  the exact converted URL and validation must apply to that same URL. One
  failed required link blocks the entire post. Exceptions and unsuccessful
  resolver result values both fail closed.
- SQLite migrations through v3 for source identities/versions, attempts,
  targets, decisions, validations, failures, retries, cursors, analytics, and
  outbox. Writes are fenced to the exact active attempt. Expired final attempts
  become failed, newer edits supersede older in-flight work, late older edits
  cannot become current, and post-tombstone deliveries are not processable.
- Source deletion records a tombstone and never deletes target mappings. No
  target auto-deletion path exists for source deletion, stock, expiry, or later
  URL failure.
- Dummy recording owner notifier and future website planning only in
  `docs/FUTURE_WEBSITE.md`, referenced by `TODO.md`.

## Validation evidence

- Pytest: `232 passed in 3.29s`.
- Ruff lint and format checks: passed for `src` and `tests`.
- Strict mypy: passed across all 38 Python modules in `src` and `tests`.
- Final staged `git diff --check`: passed.
- Final staged secret/session/runtime-artifact scan: passed. `.env.example`
  contains placeholders; public affiliate ID `14095` is intentional.

Real smoke ran at `2026-08-24T18:36:56.002534Z` through the production SSRF and
pinned HTTPS path against:

- `https://ksp.co.il/appkey/14095/cat/3689`
- `https://ksp.co.il/cat/14095-98682..98766`
- `https://ksp.co.il/cat/14095-100348`
- `https://ksp.co.il/link/PhilipsHairDryers`

All four returned terminal HTTP 403 with zero redirects. No final
`appKey=14095` marker was observable. The three category candidates failed
validation retryably; the non-redirected alias remained an unsupported `/link/`
shape and was blocked. This is failed live affiliate validation/access control,
not a contradiction of the supplied owner-verified category facts. Purchase or
commission attribution was not—and cannot be—proven by this URL smoke.

## Still out of scope / not physically verified

- Real Telegram user login/session, source-channel ingestion/catch-up,
  destination publication, production owner notification, album publishing,
  and complete edit synchronization.
- Telegram remote-success/local-crash reconciliation and exactly-once delivery.
- Live KSP category redirect plus `appKey=14095` behavior from an allowed
  network, any purchase/commission, or any `affToken` relationship.
- Product/item or other non-category KSP conversion. These remain typed,
  publication-blocking failures until an official verified deep-link mechanism
  is supplied.
- LastPrice and Rozenfeld recognition/conversion/validation; no formats or
  adapters were guessed.
- Marketing-agent decisions, paid ads, autonomous spend, revenue reinvestment,
  dashboard/UI, website implementation, and automatic expiry/deletion.

## Next work and cautions

1. Re-run KSP smoke from a network KSP permits and retain sanitized final URL,
   status, redirect count, and exact affiliate-marker evidence.
2. Obtain real LastPrice/Rozenfeld affiliate examples before implementing
   either merchant.
3. Add Telegram ingestion/catch-up, then a durable publication/outbox runtime.
   The publisher must re-check that an eligible version is current and not
   tombstoned when claiming an outbox item.
4. Add production owner-notification delivery, complete edit sync, deployment,
   monitoring, and database backup/restore procedures.

Canonical source snapshots intentionally retain source text/buttons for future
mirroring; protect the database and backups as source content even though
diagnostic URL evidence is redacted.

Repository references: `README.md`, `TODO.md`, `docs/ARCHITECTURE.md`,
`docs/KSP_LIVE_SMOKE.md`, `docs/PROJECT_STATE.md`, `docs/RELEASE_REVIEW.md`,
`docs/RUNBOOK.md`, `docs/HANDOFF.md`, and `docs/FUTURE_WEBSITE.md`.
