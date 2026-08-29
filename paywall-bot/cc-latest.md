# paywall-bot handoff — 2026-08-29 UTC (PR #101: provider portfolio + alert lifecycle + flood safety)

## Task and scope

One integrated reliability PR per the 2026-08-29 task: (A) owner-alert
noise/dedupe/aggregation, (B) TheMarker alternative full-body provider
portfolio, (C) archive.today/BypassPaywallReader ecosystem investigation,
(D) provider-aware outage semantics, (E) recovery flood safety, plus probe
tooling, docs, and backlog reconciliation. DEVELOPMENT_RULES_FULL.md was
read in full FIRST — canonical copy: `agent-memory/DEVELOPMENT_RULES_FULL.md`
(added by the owner as agent-memory commit `eec6ece` on 2026-08-29; it did
not exist anywhere before that upload).

## Git/PR state (exact)

- Starting `origin/main`: `69102a134263935b358d03532c1e45037c43cd8f`
  (state commits on top of #100 merge `f200759…`).
- Branch: `fix/themarker-provider-alert-reliability-20260829` (owner-ns,
  NOT claude/* — legitimate Merge Bot candidate without any label).
- PR: https://github.com/funzi7/paywall-bot/pull/101 — **OPEN**.
- Heads: `f66bc87` (implementation) → `bb6f2b8` (temp probe trigger) →
  **`fcffc13a9213fc937de67800e790c547bdda8626`** (GHA evidence + report +
  reconciliation + trigger removal; final at handoff time).
- Exact-head application CI: green on ALL THREE heads — `f66bc87`
  (run 33258837365), `bb6f2b8` (run 33258866717), and the final
  `fcffc13` (confirmed success 2026-08-29).
- **Codex: capacity EXHAUSTED again.** chatgpt-codex-connector posted a
  usage-limit notice on #101 (2026-08-29, comment 5463117008-adjacent
  thread) — per policy NOT a review signal; `check-codex-status`/Gate
  correctly fail-closed. NO exception used, no label games, nothing forged.
  **Exact unblock path:** when quota returns → fresh exact-head Codex review
  of the FINAL #101 head (post `@codex review` if the connector doesn't
  auto-review; established trigger, cf. PRs #72/#73/#87/#93) → resolve any
  real P1/P2 → Gate green → normal SHA-pinned Merge Bot auto-merge.
- **Retrospective #100 review (merge `f200759…`) still PENDING** on the same
  quota. Do it AFTER #101's own review (merge-critical first):
  `@codex review` on #100; any real P1/P2 → normal forward-fix.

## What changed (all code-verified by 572-test discover; production
verification PENDING merge)

1. **Owner-alert incident lifecycle** (`core/alerting.py` +
   `core/source_health.py`): DM only on incident start / material change
   (reason change, NEW failing element, queue magnitude bucket 0|1-9|10-49|50+
   crossing, severity escalation) / one bounded reminder per
   `alerting.incident_reminder_hours` (24) / one recovery. Signatures strip
   volatile numerics (root cause of n12 consec=27 + theverifier consec=36
   every-run re-alerts). Tech Feed IL aggregates by ROOT incident
   (`source:<publisher>`; extraction > discovery > baseline > production_poll
   > pipeline > production_visibility > blocked_queue), ≤ ONE aggregated
   urgent/recovery DM + the daily digest per run; additive `incidents` key in
   health state; deploy-time seeding from existing last_alert_at → rollout
   re-sends NOTHING. Criticals stay immediate; owner-DM failure stays hard.
   TheMarker `pipeline_outage`: same lifecycle (production evidence of the
   noise: ≥11 identical DMs 08-24→08-29).
2. **Visibility false positive**: `_production_identity_semantics` — known
   includes `suppressed_items` + publication events/ledger/equivalents;
   published stays events-only. Exact Gadgety fixture
   (`gadgety.co.il/367635`, `stale_at_discovery:64.9h`, live in production
   suppressed_items) now healthy `newest_item_intentionally_suppressed`.
3. **Provider portfolio**: `core/providers.py` registry (local
   telegram/direct; external jina/smry/one3ft/wayback/archive_today);
   archive.today mirror family = ONE domain (≤2 mirrors, family-stop on
   429/challenge, READ-ONLY /newest/ + existing snapshots, UUID wrong-article
   guard, NOT in fetch_chain); taxonomy SUCCESS/CONTENT_REJECT (health) vs
   ITEM_MISS (distinct from PROVIDER_UNAVAILABLE; latches, never clears) vs
   SERVICE_SHELL/RATE_LIMITED/TRANSPORT_ERROR/PROVIDER_UNAVAILABLE (fail
   closed). Outage classifier now takes `external_sources=` derived from the
   configured fetch_chain. Per-run unavailable latch (2 systemic fails →
   `unavailable_cached_for_run`, classifier-complete, zero requests). one3ft
   warm retry (once/run, 8s+45s). wayback availability-API pre-check
   (definitive no-snapshot → ITEM_MISS; API outage → legacy /web/2026/).
   No secret ever reaches third-party adapters (regression-tested).
4. **Flood safety**: `posting.max_posts_per_run: 4` + newest-first recovery
   selection when no outage and ready>30 (`themarker_recovery_current_first`);
   rows past the cap never attempted; nothing discarded. Simulated on a COPY
   of live state (93 deferred; 63 >72h; first recovery poll touches only
   ≤45h-old rows; drain ≈24 polls).
5. **Probe**: `tools/themarker_provider_probe.py` + dispatch-only
   `TheMarker Provider Probe` workflow (no secrets, body-free, cannot import
   tg/telegraph, temp logging). Operator tool, never scheduled.

## GHA probe evidence (authoritative for enablement)

Run **33258865312** (success, head `bb6f2b8`, runner egress), artifact +
`reports/themarker-provider-portfolio-20260829.md`:
- **one3ft: 3 gate-passing FULL BODIES after wake-up** (magazine-highlight
  45¶/10,435/0.775; premium 9¶/2,499/0.795; live 10¶/1,799/0.648; title+UUID
  verified) + one 2xx content-reject; first attempt reproduced cold-start →
  `one3ft_warm_retry` ENABLED (runner-verified).
- wayback: 6/6 deterministic ITEM_MISS → `wayback_availability_precheck`
  ENABLED (runner-verified).
- archive_today: 6/6 RATE_LIMITED (family wall, one-mirror fast-fail) →
  DIAGNOSTIC_ONLY (no full-body runner proof; NOT enabled).
- Periscope/Corsfix: HTTP 400 `invalid_origin` from the runner — browser-only
  + paid registered Origin by design → REQUIRES_OWNER_CONFIGURATION, not
  implemented (no key/secret created).
- RemovePaywall + BypassPaywallReader router: HTTP-200 shells → REJECTED.
  1ft.io: NXDOMAIN → REJECTED (one3ft IS a self-hosted 13ft).
- **No NEW third-party provider passed acceptance as of 2026-08-29.**

## Validation

572-test `unittest discover` OK (+67 new: lifecycle 21, portfolio 37 incl.
adversarial guards, flood 9); message_format OK; compileall; 16 workflow
YAMLs parse; bash -n; node gate tests; `git diff --check`; tracked state/
byte-clean. Docs: README (3 new reliability sections), ADR
`docs/themarker-provider-portfolio-20260829.md`, report above, CONTEXT.md
new top section + §6 backlog reconciliation (DONE/PENDING/SUPERSEDED).

## Production reality at handoff

Outage ACTIVE since 2026-08-26T13:53Z; 93 deferred (63 >72h, 76 retry-0);
poll 33250172369 (2026-08-29T11:27Z): discovery admits fine, fairness 1
probe + 19 local-only of 90 ready, chain jina=403/smry=no_body/one3ft=503/
wayback=503, posted=2 that day via direct. Latest legacy `pipeline_outage`
DM 2026-08-29T11:28Z.

## PENDING (physical evidence required, in order)

1. Codex quota → fresh exact-head review of #101 final head `fcffc13`
   (CI already green there) → Gate → normal Merge Bot SHA-pinned merge.
2. Post-merge §36: next scheduled TheMarker Polls — expect warm-retry one3ft
   successes/2xx-rejects (outage clears on positive capability only),
   wayback=no_snapshot ITEM_MISS lines, newest-first recovery selection +
   `post_cap_reached` when applicable, no historical flood, no retry burn.
3. Post-merge §37: next Source Health daily run — ONE aggregated
   urgent/recovery DM max + digest; no Verifier feed+publisher duplicates;
   TheMarker outage DM silence until 24h reminder/recovery.
4. Retrospective #100 Codex audit (after #101 review).
5. If archive.today is ever to be enabled: re-run the probe (operator
   dispatch) and require a genuine full-body runner result first.
