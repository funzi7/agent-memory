# cc-latest.md — affiliate-deals-bot handoff (latest)

> Rolling handoff for `funzi7/affiliate-deals-bot`. Read this first, then the
> repository documentation linked below.

## 2026-09-08 (latest) — SERVER-SIDE KSP alias pilot: the VPS can resolve, safely

- **Repo HEAD `090ef57e3bd5c4aa4d889a3d3704f8ff47db4751`** (docs + research +
  pilot tooling only). **Deployed runtime HEAD stays
  `2ed10b18efb1cc6540ee0173a79d88b2a8a4fc91` — NOT redeployed, deliberately**:
  nothing under `src/` or `tests/` changed, so a redeploy would carry risk with
  no benefit. Schema unchanged at v12.
- Owner ruled out the personal phone as a production dependency: *"the personal
  phone must NOT become the production resolver; if Israeli egress is required,
  the SERVER must have it."* This milestone answers that — as **research**.

### The safety invariant (this is the load-bearing part)

The Israeli WireGuard tunnel runs **inside a dedicated network namespace**,
never on the host. The interface is created in the **host** namespace so its UDP
socket keeps the host's ordinary default route, then **moved** into the
namespace. That ordering is why the host's routing never changes; reverse it and
the tunnel cannot reach its endpoint. `/etc/netns/kspilot/resolv.conf` is
applied through `ip netns exec`'s private mount namespace and does **not**
replace the host resolver. Proven empirically before anything else ran: a fresh
namespace has zero routes and no egress, and the host default route, the four
units and the Cloudflare tunnel were unchanged throughout.

### Baseline matrix — the block is TWO independent gates

| Vantage | KSP | Control (ivory/zap) |
| --- | --- | --- |
| A: host, Singapore datacenter egress, `curl` | **403** | **403** |
| B: IL namespace, plain `curl` | **403** | **200** |
| C: IL namespace, ordinary **headful** Chrome | **resolves** | resolves |

Geography and client type are **each necessary, neither sufficient**. Notably
the Proton exit is a **datacenter ASN** and still worked, so "residential IP" is
not the discriminator.

### Results

- **30/30 aliases resolved on all 3 passes** (p1 warm, p2 warm, **p3 genuinely
  cold profile**), 0 challenges, 0 errors, 30/30 canonical stability, and
  **30/30 identical to the phone pilot**. Median wall time 5.56 s (~1.5 s real,
  the rest is the deliberate 4 s settle window).
- **UTM: 15/15 `/link` carry `utm_source=telegram`, 0/15 `/sku`.** The deployed
  converter already emits `/cat/14095-58233?utm_source=telegram` **with no code
  change**.
- **No canary was minted.** Verified on a DB copy that opening one downgrades
  `ksp:plain_category` from `dashboard_verified` to `canary_pending` —
  `latest_verifications()` takes the LAST run per route_key. Two direct KSP URLs
  went to the owner instead.

### Harness hardening (`tools/ksp-alias-pilot/`) — 17 findings, 2 blocking

A research script that runs as **root** beside production is its own hazard.
Both blockers were real:
1. `run_pass.sh` took a profile **path** and, with `fresh`, `rm -rf`'d it as
   root — a supplied production directory would have been destroyed. Now a
   restricted **name**, resolved under the pilot root, re-checked for
   containment on the resolved path.
2. `wg setconf` inherited stderr, and WireGuard's parser **quotes the offending
   config line back** — for a bad key, the secret itself. Suppressed; failures
   report *that* they failed, not why.

Also fixed: stripped-secret file surviving a failure (now an `EXIT` trap that
shreds); Chrome's log opened **by root** in a `kspilot`-writable directory
(symlink clobber — now opened by the unprivileged user); host-wide
`pkill -f "Xvfb :99"` also matching `:990` (now a tracked pid); teardown
asserting success without checking (now verifies and exits non-zero); success
reported after a failed pass; readiness proving only that *something* answered
the port; `KeyError('canonical_type')` aborting a whole pass; `settled`
conflating settled/vanished/timeout (now explicit `settle_state`); and
classification regexes matching anywhere in the URL, so a redirector quoting a
KSP path in its query string read as the destination (now host-verified,
path-anchored).

**The fixes changed no measurement**: all **180** recorded results (3 server + 3
phone passes × 30) replay through the tightened classifier with **0**
differences.

### Infrastructure state now

VPN config installed at `/etc/affiliate-deals-bot/vpn/israel.conf`, root-owned,
**0600**, never printed/committed/diffed. `wireguard-tools`, Chrome, Xvfb and
the unprivileged `kspilot` user remain installed. **Torn down and verified**: 0
namespaces, 0 host `wg` interfaces, 0 chrome, 0 Xvfb, 0 pilot profiles, no
`/run/ksp-alias-pilot`, 1 host default route. All four units active with
**NRestarts=0**. `remote-sources-backup`/`-diskcheck` are timer-driven, so
`inactive dead` is their normal resting state — do not misread that as an
outage. Real unit names are `affiliate-deals-admin`, `affiliate-deals-go`,
`affiliate-deals-telegram`, `cloudflared` (**not** `affiliate-deals-bot` /
`-mirror` — probing those names returns a misleading `inactive`).

### Still NOT approved

No resolver is wired in, no alias mapping is stored in production, no blocked
post was resurrected, tracking OFF, Core SHADOW. Building the resolver needs a
**new explicit owner approval**. Open owner item: the UTM attribution verdict
(research doc §14.6) — compare `https://ksp.co.il/cat/14095-58233?utm_source=telegram`
against the control `https://ksp.co.il/cat/14095-58233` in the KSP affiliate
dashboard.

## 2026-09-08 (later) — ALERT SEMANTICS CORRECTED (new posts only) + two KSP alias PILOTS

- **Project HEAD = deployed runtime HEAD =
  `2ed10b18efb1cc6540ee0173a79d88b2a8a4fc91`** (local == origin == server tree,
  content-verified). **Schema unchanged at v12** — the correction is query and
  control flow, no migration. Verified online backup taken first:
  `/var/lib/affiliate-deals-bot/backups/db-prenewpost-20260908T131754Z.sqlite3`
  (integrity + quick_check ok, row counts match). Post-deploy: all 4 units
  active, both DBs `integrity_check ok`, **0** orphaned SQLite descriptors,
  Core **SHADOW**, `core_publications` **0**, `AFFI_TRACKING_ENABLED` absent
  from every env file and the live process, 7 KSP contracts still
  `dashboard_verified`, real edge 200/200/404.

### TRACK A — only a NEW post counts (owner decision)

The lifecycle shipped earlier the same day counted a source **edit** as proof
the channel was producing, and a successful **edit** of an already-mirrored post
as Affi publishing. **That was an implementation mismatch, never an approved
behaviour** — say so plainly, do not re-document it as approved.

- **Source activity** = `source_events.event_kind = 'created'` **only**.
  `edited` and `deleted` prove nothing.
- **Recovery / outage interruption** = a genuinely new post reaching the channel
  for the first time. Durable proof: the delivered `telegram-publish:v1:<version>`
  outbox row (an edit is `telegram-edit:v1:<version>`) joined to the
  `target_mapping_history` row with `album_position = 0` **and
  `edited_at IS NULL`** — the last condition is what stops a publish-tagged plan
  that reached the *reconciliation* path from counting. `published_at` is never
  bumped by an edit; `updated_at` is, which is why the probe must not use it.
- Runtime gates recovery on the **first-publication branch** of
  `_deliver_telegram_claim` (`published_new_post`), never on "a send happened".
- Everything else unchanged: 6h rule, one 24h escalation from incident start,
  silence after, silent transient retries, one notification per spent budget,
  S3 per post+cause, S4 immediate + aggregated, append-only episodes, atomic
  claim-and-enqueue.

**Why it mattered:** `@KSPcoil` edits constantly — 219 of 332 real source
events are edits.

**LIVE PROOF on production data** (this is natural exercise, not a fixture):
the corrected probe returns `2026-09-08T10:15:11Z` (post 16649's **creation**),
while the old reading returned `10:19:04Z` (that same post's **edit**). Since
the first alert deploy production saw **7 created + 9 edited** events and **16
blocked/partial occurrences across 4 incidents → 0 Telegram messages**. Under
the pre-2026-09-08 behaviour those would have been 16 messages.

### Codex review of Track A — 6 findings, all fixed

Genuine Codex (`codex-cli 0.153.3`), not the Claude fallback. **2 MAJOR, 2
MINOR, 2 NIT.**
1. **MAJOR** — a plan from a `created` source event can reach the
   **reconciliation** branch when a target appears between enqueue and send, and
   the first fix would have counted that edit as a new publication. Fixed in the
   runtime gate *and* in the SQL (`edited_at IS NULL`).
2. **MAJOR** (pre-existing) — a worker holding a stale `notified == False` read
   could close an incident another worker had just announced, losing the
   recovery message forever. The store now judges that inside its own
   transaction; the caller never decides.
3. **MINOR** — two of my tests were vacuous. The replay test only hit an
   existing timestamp guard (now drives a real already-current delivery through
   the runtime); the ordering test used `+00:00` values whose lexical and
   chronological order agree by luck (now uses the mirror's `Z` form and was
   **mutation-checked**: fails under lexical ordering, passes under `julianday`).
4. **NITs** — stale sweep docstring, two unused test helpers.

Codex confirmed clean: no path lets `edited`/`deleted` satisfy activity; ordinary
`telegram_edit` deliveries cannot recover or advance the marker; SQLite's
integer-to-text key concatenation is correct; album/continuation rows share one
timestamp harmlessly.

### TRACK B — two alias pilots (RESEARCH ONLY, nothing wired anywhere)

Same 30 real production aliases (15 `/link`, 15 `/sku`), read-only sample.

- **Pilot 1 — an ordinary browser resolves EVERYTHING: 30/30 (100%)**, 0
  challenges, 0 errors, **stable across 3 passes and 2 browsers** (Brave
  Chromium 152, Samsung Internet 143), median **2.51 s**, **exactly one redirect
  hop**. 20 items, 10 categories. Method: real phone, ordinary Android VIEW
  intent targeted with `-p`, tab URL read from DevTools **metadata**. No
  headless, no WebDriver/stealth, no UA/`Sec-CH-UA` spoofing, no CAPTCHA/WAF
  bypass, no cookies, no credentials, no JS injected into any KSP page.
- **THE BLOCK IS TWO GATES**, separated when the owner connected an Israeli VPN
  mid-pilot: same browser + same phone went **403 → resolve** when egress
  changed, **and** on that Israeli IP `curl` from the phone still gets 403 while
  the browser beside it succeeds. Geography matters *and* client type matters.
  Cloudflare's answer is a WAF **block**, not a challenge (no `cf-mitigated`, no
  Turnstile) — nothing to solve, which is why nothing was bypassed.
- **Pilot 2 — catalog/MCP produced 0/30 strong matches of its own.** Every KSP
  catalog path 403s an honest client while `/_cache/kdm/*` returns 200 (control).
  No hosted MCP reachable; `guymon92/ksp-mcp` is a placeholder host whose source
  spoofs UA/Referer/Origin. **Dangerous failure mode**: the one reachable
  corroborator (public search index) returned ids only for **near-miss**
  products — `AEGABU51291M` vs `ABU512`**`0`**`1M` (different ₪2,079 oven), and
  a *refill bag* for `/sku/224607`. A "closest result" resolver ships wrong
  products. Newest items ("חדש באתר") are not indexed at all.
- **Cross-check:** A=1 (inherited from prior owner evidence, not derived),
  **B=29 browser-only**, **C=0 disagreements**, D=0, E=0, F=0. Weaker real
  signal: catalog predicted *target type* correctly **29/30**.
- **New facts:** `/sku/<n>` is never the item id and a **third** namespace
  exists (on-page מק"ט, e.g. `item/450832` shows `401869`); `/link` aliases land
  carrying `?utm_source=telegram` (15/15) while `/sku` carry none (0/15) — so
  substituting a canonical URL for a `/link` alias changes what KSP sees, and
  that interaction is **unstudied**.
- **The 1.2% salvage figure is NOT revised** — it was correct for the methods
  then available; the pilots found a *different capability*, not an error.
- **PRIVACY CONSTRAINT for any productionisation**: DevTools `/json/list`
  returns **every open tab** in the profile. The pilot read only its own tab,
  discarded the rest unrecorded, closed only its own tabs, removed both
  forwards. A production design must never log that endpoint.
- **NOT PROVEN**: that KSP permits automated resolution; durability against a
  WAF rule change; Chrome itself (`com.android.chrome` is **disabled** on the
  device — enabling it is the one optional owner action); the precise boundary
  between the two gates; a cold browser profile; anything about affiliate
  attribution.

### UNRESOLVED OWNER DECISIONS (do not decide these for them)

1. **Whether to build an alias resolver at all** — the pilots supersede the old
   "no lawful source exists" finding but are **not** approval. Four questions in
   `docs/KSP_ALIAS_RESOLUTION_RESEARCH.md` §13.7: is a phone browser an
   acceptable production dependency; is the DevTools privacy constraint
   acceptable; should this evidence instead be used to ask KSP for allow-listed
   access; how does attribution behave when a `?utm_source=telegram` `/link`
   alias is replaced.
2. Resurrection D2–D5 (`ERROR_LIFECYCLE_RESEARCH.md` §7) — still open.
3. Tracking activation — still OFF, still the owner's call.
4. Core LIVE — still SHADOW.
5. Cloudflare `/login` rate-limit rule — still pending, dashboard-only.

### Validation

**1485 pytest passed**, ruff + format + strict mypy clean (167 files),
`git diff --check` clean, 0 broken doc links, secret/identity scan clean.
**No CI exists in this repository — never claim a CI pass.**

## 2026-09-08 — OWNER-ALERT LIFECYCLE shipped (schema v12); Telegram quiet, evidence complete

- **Project HEAD = deployed runtime HEAD =
  `46a5d9690313bc1868e7ed0405068f435d123700`** on `main` (local == origin ==
  server tree, content-verified `git diff --exit-code HEAD` clean). No
  docs-only tail commit: code and docs shipped together, so there is no
  runtime-vs-doc HEAD distinction this time.
- **Live schema v12** (additive migration `alert_incidents_and_occurrences`).
  Applied on first open after restart. **Every pre-existing row count is
  identical before and after** (source_messages 154, source_versions 318,
  target_mappings 146, url_decisions 1081, outbox_events 354, failures 133,
  source_events 318). Verified online backup taken first through SQLite's
  backup API as `affideals`:
  `/var/lib/affiliate-deals-bot/backups/db-prealerts-20260908T035508Z.sqlite3`
  (integrity + quick_check ok, row counts match).
- **Unchanged and re-verified after deploy**: Core **SHADOW**,
  `core_publications` **0**, `AFFI_TRACKING_ENABLED` absent from every env file
  **and** from the live process, the **7 dashboard_verified** KSP route
  contracts + 2 `no_affiliate_mechanism` + 1 `structural_only`, both DBs
  `integrity_check ok`, **0** orphaned/deleted SQLite descriptors, WAL/SHM
  present, all four units active with NRestarts 0, real edge
  (`admin/login` 200, `go/healthz` 200, canary 302 + `no-store`, unknown token
  404).

### What changed (alerting ONLY — no conversion/eligibility/policy change)

The mirror used to send **one Telegram message per recorded failure**.
Production had reached **80** delivered owner alerts (41 by 2026-09-06, then 39
more in two days under the old policy). Recording a fact and interrupting the
owner are now separate acts.

**Owner-approved contract** (full text in `docs/OWNER_ALERT_POLICY.md`):
- **S0 expected limitation** (e.g. `affiliate_mechanism_unavailable`): never a
  message per post/version/edit. Only the outage rule speaks.
- **Outage rule**: one message when (1) the source is demonstrably still
  producing **content** (a `created`/`edited` row in `source_events`; a deletion
  does not count), (2) the same cause blocked output **more than once**, and
  (3) **no successful publication** reached the destination for **6 continuous
  hours** measured from the first blocked occurrence.
- **One escalation at 24h of incident age** (not 24h after the message), then
  **absolute silence** until recovery.
- **One recovery message**, only after a **real** publication (a
  `target_mappings` row written by `complete_outbox` after an actual send).
- **S1 transient**: silent while attempts remain; one message per root cause
  once it will not be retried. **S3**: one per post + unchanged cause.
  **S4 critical**: immediate, aggregated by root cause, never per attempt.

### Before/after alert-noise estimate (real data, read-only replay)

Replaying the genuine 41-message production history through the shipped policy:
**41 → 2 messages**, with **17 durable incident episodes** retaining every
occurrence. The measured 2026-08-25 four-message delivery incident is **one**
message, proven through the real runtime in
`tests/unit/test_alert_runtime_integration.py`.

### Architecture (new package `src/affiliate_deals_bot/alerts/`)

- `severity.py` — deterministic S0–S4 from **stable failure codes only**, never
  message text. Exhaustiveness test over every `FailureCode`, every
  `blocked_reason` and every runtime topic (derived from the source at test
  time, so a new code fails the build). **Unknown cause → CRITICAL**, never S0.
- `incidents.py` — `alert_incidents` + `alert_incident_occurrences`. Four
  invariants: claim-and-enqueue is **one transaction** (a phase can never be
  marked notified without a durable message); history is **append-only
  episodes** (`logical_key` + `episode`; a recovered incident is closed forever
  and a later failure opens a new row); phase claims are fenced on
  `cleared_at IS NULL`; **all cross-table time comparisons use `julianday()`**
  because this store writes `+00:00` and the mirror writes `Z`.
- `policy.py` — the rules above. Wired at
  `telegram_processing.py` → `TelegramMirrorRuntime(alert_policy=…)`; the single
  seam is `runtime._queue_alert`, so every existing call site is unchanged in
  meaning. `LegacyAlertPolicy` exists **only** for pre-existing tests.
- **Admin**: existing `מערכת` page gains `תקריות התראה`. No new page, no nav
  change.

### Deploy safety

Incident tables start empty and nothing back-fills them; every clock starts at
the first occurrence **after** the upgrade, so no retroactive 6h warning and no
escalation for the already-running KSP outage. Confirmed post-deploy:
`alert_incidents` 0, `alert_incident_occurrences` 0, incident-schema alerts
queued 0, 80 historical alerts preserved, **0 pending** owner alerts before the
restart (pending legacy rows would still be delivered as live work — check this
before any future alert-policy deploy; see RUNBOOK).

### Review (Codex, genuinely — not the Claude fallback)

`codex-cli 0.153.3`, read-only sandbox, adversarial: **15 findings — 3 blockers,
11 major, 1 minor**. 14 accepted and fixed, each pinned by
`tests/unit/test_alert_review_findings.py`. Blockers: (1) a policy exception fell
back to one message per signal, re-creating the storm — now one critical
"alert policy failed" per source; (2) the phase claim committed before the
outbox insert, so a crash marked an incident told with no message — now atomic;
(3) reopening a recovered incident deleted its occurrences — now append-only
episodes. Also fixed: root causes aggregate per source not per delivery; all 38
real publisher/delivery codes classified (were defaulting to CRITICAL on first
attempt); a partial conversion can no longer claim a retry was exhausted; the
publication probe orders by `julianday` (text ordering put `…:00Z` after
`…:00.8Z`); the 24h escalation no longer needs further activity; a sweep after a
restart announces recovery instead of closing silently; a replayed delivery of
an already-mirrored post no longer fabricates recovery. One finding partly
declined: `affiliate_recovery_failed` is **transient** (that path schedules a
retry); `affiliate_processing_failed` is **critical** as the reviewer intended.

### Real runtime validation (deployed artifact, no production writes)

The 6h/24h arithmetic is proven by deterministic persisted tests with a
controlled clock plus restart-safety tests, **not** by waiting six hours.
Additionally the **deployed build on the server** was exercised against a
**scratch copy** of the real production database (the verified backup, copied to
a temp path, deleted afterwards; production untouched, nothing sent):

```
8 blocked alias posts inside 6h  -> 0 Telegram messages
the 9th, past the 6h mark        -> 1 message ("has published nothing for 6h 5m")
3 more blocked posts after it    -> 0 additional messages
durable evidence                 -> 12 occurrences / 12 posts on one incident
VERDICT: 12 blocked posts -> 1 Telegram message
```

**Honest limitation**: `@KSPcoil` produced **no new post** during the
post-deploy validation window (deployed 03:56 UTC, early morning in Israel), so
**live S0 suppression on genuinely new production traffic was NOT naturally
exercised** — no PASS is claimed for that. No synthetic Telegram alert was sent;
the owner did not approve one. Confirmed after deploy: 0 source events, 0
incidents, 0 owner alerts queued.

### Validation

**1469 pytest passed**, ruff + format + strict mypy clean (166 files),
`git diff --check` clean. Migration 12 proven on a fresh DB and on a
production-shaped v11 DB seeded with the 41 historical alerts (asserts **zero**
back-notification). **No CI exists in this repository — never claim a CI pass.**
One flake seen once and not reproducible (3/3 passes in isolation):
`test_a_second_process_never_orphans_the_click_stores_wal` — a `spawn`
subprocess that failed to start within 30s under load; `tracking/clicks.py` and
all non-migration code in `sqlite.py` are untouched by this milestone.

### NOT done, NOT approved (unchanged)

Resurrection of blocked posts, `blocked → pending`, freshness windows,
blocked-edit-after-restore policy, retroactive treatment of the 877 historical
alias posts (owner decisions **D2–D5**, still open), the KSP alias resolver,
owner-in-the-loop resolver pilot, publishing alias-only posts unmonetised,
tracking activation, Core LIVE. Also still pending from before: the Cloudflare
`/login` rate-limit rule (dashboard-only).

## 2026-09-06 — Phase B deployed + verified; alias-resolution RESEARCH milestone (research only)

- **Repo HEAD `2bbd865ea5ab482f0c768042da82739119dbe424`** on `main` (local ==
  origin/main), docs-only research commit over `226760d` (docs) over
  **`f6a240814847d24257c1093b7733fadebfe1e36e`** (the runtime production
  actually runs). **Deployed server tree = `226760d`** (content-verified,
  identical runtime to `f6a2408`); the research commit `2bbd865` is docs-only
  and was deliberately **not** deployed — production behaviour unchanged.
- **Production state:** tracking **OFF** (`AFFI_TRACKING_ENABLED` and
  `AFFI_TRACKING_REQUIRE_DASHBOARD_VERIFIED` unset in every env file and in
  the live process); Core **SHADOW**, `core_publications` 0; all four units
  active, NRestarts 0; 85 redirect events, all canary traffic.
- **Phase B (2026-09-04 → 09-06) is DONE up to the activation decision:**
  `go.affi.co.il` routed through the existing tunnel to the enabled
  `affiliate-deals-go` unit; real edge 302/`no-store`/404 verified; ten
  canaries opened on the owner's phone and judged from the authenticated KSP
  dashboard → **7 route classes `dashboard_verified`** (item ×2, shops ×2,
  category ×2, and the corrected `affiliate_query_category` re-verified
  2026-09-06 after its fingerprint changed), 2 `no_affiliate_mechanism`
  (`/link`, `/sku`), 1 `structural_only`. The old `/link`/`/sku` seeding was
  withdrawn; nothing is seeded. **Rule: KSP honours the affiliate id only in
  the URL PATH; `?appKey=` is inert.** Converter corrections deployed
  (`f6a2408`): `/mob|web/cat/<ids>?appKey=` → `/cat/14095-<ids>`; `/link`,
  `/sku` → `affiliate_mechanism_unavailable` (fail closed, no exception).
- **Real production effect since the deploy:** every new `@KSPcoil` post was
  alias-only → blocked with an owner alert; **nothing published** (vs 6–11
  publishes/day before). Recompute over 972 decisions: 41 convert, 923 fail
  (877 formerly "converted" aliases). One mirrored post's later edit was
  blocked → mirror keeps pre-edit content (existing blocked-edit rule).
- **Research findings (docs/KSP_ALIAS_RESOLUTION_RESEARCH.md):** KSP's
  "העתק קישור" is **client-side** — read from KSP's own published bundles
  (mobile chunk `3826.471ce24c85eda56f3d1c.js`, web chunk
  `31.080c1a8b719a0ab89a93.js`, dictionaries `/_cache/kdm/*/he.json`, all
  served to a plain client while every page/API path answers **403 "KSP
  Forbidden 403"**): copied link = `BaseUrl + "/appkey/" + <affiliate code
  from the `mac` cookie / config.affiliation> + "/" + <landed path>` (+ query
  on mobile, tracking params stripped); the only server call is
  `get_forum_code?uin=` for two page ids. **No alias→canonical operation
  exists in the SPA**; `/link`/`/sku` are server-side redirects, 403 to
  non-browsers from this device AND the VPS (even robots.txt). No current
  affiliate API evidenced; legacy `/af/` pages are historical (do NOT ask the
  owner to re-inspect them). Every open-source KSP client (guymon92/ksp-mcp
  MIT, eran-broder/ksp, Gallind, …) relies on spoofing/stealth/session replay
  — out of scope; the MCP "first number" rule is NOT a `/sku`→UIN mapper.
- **Alias salvage estimate:** corpus 342 distinct aliases / 506 occurrences /
  138 posts, 97% single-use, top-100 covers 32%; 124/138 posts alias-only;
  `/link` gates 100% (`/sku` alone → 23%). **Salvageable today: 1.2%** (6
  occurrences the owner resolved by hand); 0 by any server-side tier.
- **Recommended next milestone:** **no automated resolver** (evidence does not
  support one). Target = hybrid ladder whose first tier needs a lawful
  `alias → canonical URL` source: KSP-side unlock (allow-listed resolution,
  feed/API, or `?appKey` attribution restored; contact via the programme's
  published address) or an **owner-in-the-loop pilot** (~26 new aliases/day).
  Plus the alert lifecycle + capability-aware resurrection design.
- **Error-lifecycle findings (docs/ERROR_LIFECYCLE_RESEARCH.md):** all alerts
  funnel through `runtime.py:_queue_alert`; dedup is per version / event /
  outbox row / **attempt**, never root cause; edits re-alert; `blocked` is
  terminal (no reprocess path exists; startup recovery/backfill see only
  `eligible`; `stale_telegram_delivery_plan` guard). Measured: 41 owner
  messages in 12.9 days, 90% affiliate-related, 32% from edits, runs of
  11/9 identical, 4 messages for one delivery incident; retries never ran.
  Proposed: severity classes S0–S4, incident aggregation (new additive
  tables), cooldown/escalation, one recovery message, capability-aware
  resurrection keyed on a recorded `blocked_capability` + contract
  fingerprint, paced like backfill, through the existing idempotency guards.
- **UNRESOLVED OWNER DECISIONS (nothing chosen, do not choose for them):**
  tracking activation; alias-only block policy; Option E pilot yes/no; and
  D1–D5 in ERROR_LIFECYCLE_RESEARCH.md §7 (S0 alert form, resurrection
  freshness window, blocked-edit handling after capability restore, edit
  dedup today, retroactive treatment of the 877 historical links).
- **Still pending from before:** Cloudflare `/login` rate-limit rule
  (dashboard-only, unclaimed).
- **Rules reaffirmed:** read-only DB via `mode=ro` as `affideals`; never open
  the live DB read-write as root; no WAF/Turnstile bypass, no UA spoofing, no
  cookies/tokens of anyone; never print host/IP/tailnet/keys; `funzi7` only.

## 2026-09-04 — Affiliate Trust + click tracking, PHASE A ONLY (not deployed)

> SUPERSEDED by the 2026-09-06 section above for deployment status, the route
> matrix, and the `/link`/`/sku` seeding (withdrawn). The design notes below
> still describe the code.

- Repo HEAD **`0db4e0217b820ea43a36903de251afd81c0b0f6d`** on `main`
  (local == origin). **1238 pytest passed**, ruff + format + strict mypy clean
  (157 files), `git diff --check` clean. **No CI exists in this repository**
  (0 check-runs on the pushed HEAD) — do not claim a CI pass.
- **NOTHING WAS DEPLOYED.** Production is untouched: no SSH change, no service
  restart, no env var set, no Cloudflare DNS/tunnel change, no real go link, no
  `@AffiIsrael` post, no KSP canary. Core still SHADOW. Deployed server code is
  still the previous HEAD.
- **Feature is OFF by default** (`AFFI_TRACKING_ENABLED=false`). With it off no
  tracking store is even constructed and published output is unchanged.
- **Schema v11** (additive): `redirect_links`, `route_verification_runs` in the
  app DB. Click events live in a **SEPARATE** append-only SQLite DB
  (`GO_CLICK_DATABASE_URL`) — the main DB's every transaction holds a
  whole-database write lock shared with the mirror, and `analytics_events`
  forces a UNIQUE key per row with no time index. Both DBs share ONE hardening
  implementation (`harden_sqlite_files`); the WAL-orphan invariant is re-proven
  against the new store with a real spawn-based second process.
- **KSP route matrix: TEN classes, not five.** Identity comes from
  `merchants.ksp.ksp_route_class`, which dispatches on the converter's own
  matchers, so a new accepted route cannot appear without a contract — the
  exhaustiveness test fails otherwise. Transformations are heterogeneous:
  `/link` + `/sku` append appKey (path preserved); `/cat` → `/cat/14095-<ids>`;
  `/item` + `/shops` → `/appkey/14095/...`; four shapes pass through unchanged.
  **`FUTURE_DISCOVERY.md` used to claim all routes just append appKey — that was
  wrong and is now corrected.**
- **Evidence seeding**: only `/link` and `/sku` are DASHBOARD_VERIFIED, from the
  four owner-confirmed affiliate **visits** in `docs/KSP_LIVE_SMOKE.md` (visit
  registration only — never commission). The other eight are STRUCTURAL_ONLY.
  Seeding is declarative in `tracking/routes.py`, not a data migration.
  **Staleness is derived from a contract fingerprint** computed from the
  converter's real output — no invented time-based expiry.
- **Substitution seam is `telegram_processing.py`, right before
  `transform_album`** — after eligibility (earlier would make every commercial
  link look unconverted and BLOCK the post) and before chunking (UTF-16 length
  changes). It lands inside the persisted outbox payload, so link identity MUST
  be deterministic: `enqueue_outbox` raises on a byte-different payload for the
  same idempotency key. Identity = (source_id, occurrence, destination).
- **Core coupling handled**: `governed.extract_ksp_item_ids` scans outgoing text
  for KSP item ids; once tracked, the text has none. `DeliveryPlan` carries a
  **non-serialized** `tracked_origin_urls` field for Core to read instead.
- **Owner UX decisions (asked and answered): 1B, 2A, 3A** — verification summary
  on `/links` + workflow on `/links/verification` (sub-page, no nav item, mirrors
  `/sources/test`); canaries listed in the inventory with a "בדיקה" badge and
  excluded from all business totals; the existing Dashboard "אנליטיקה" section
  grown in place.
- **Bug fixed on the way**: the Admin KSP identity badge used a hand-maintained
  substring list that missed the accepted `/item/<affiliate>-<value>` shortcut
  and showed "appKey חסר" for a genuinely affiliate-carrying link. Now derived
  from the matrix.
- **Real runtime validation done**: the actual `affiliate-deals-go` console
  entry was started as a process and driven with curl — 302 with exact
  `Location`, `no-store`, no cookies, 404 for unknown, and the token appeared
  ZERO times in the log. Migration 11 proven additive on fresh, v10, and a
  **real legacy v4 dev DB** (`.local/affiliate-deals.sqlite3`, untracked).
- **NOT VERIFIED — Phase B, never claim these**: real `https://go.affi.co.il`
  edge; Cloudflare DNS/tunnel route for it; real phone click; real KSP landing
  through the redirect; Israeli egress in practice; KSP dashboard attribution
  for the tracked path. Also still pending from before: the Cloudflare `/login`
  rate-limit rule.
- **Not possible today**: per-public-click ↔ per-KSP-click reconciliation. KSP
  exposes no identifier that would make it real, so no report parser was
  invented and none should be.

## 2026-09-04 (final) — Admin ACCEPTED on the owner's phone; two blockers fixed

- Repo HEAD **`d99c6ab979d7436b7d30f15ffb65fdc7bd388f24`** on `main`
  (local == origin == deployed). **1102 pytest passed**, ruff + format + strict
  mypy clean (140 files). Live schema **v10**, core mode **SHADOW**,
  `core_publications` 0.
- **PHYSICAL PHONE ACCEPTANCE: PASSED.** The owner enrolled their own
  credential (their password never passed through the agent) and confirmed on
  their Android phone against the real `https://admin.affi.co.il`: login plus
  dashboard, system (session posture + the audit row for that login), sources,
  candidates + a candidate detail, links, publications, governor, the LIVE
  type-to-confirm gate, PWA install/re-open, and the logout/login loop.
- **TWO RELEASE BLOCKERS found only by testing the real path — both fixed:**
  1. **`Referrer-Policy: no-referrer` broke every real-browser login.** Under
     it a browser suppresses `Referer` AND serializes the `Origin` of a
     form-POST *navigation* as literal `null` (Fetch spec), so the same-origin
     CSRF check had nothing to compare → `cross_origin_rejected` before any
     credential check. `fetch()` POSTs (mode cors) are exempt, which is why
     only the no-JS login form broke. Fixed with `Referrer-Policy:
     same-origin` (cross-origin navigations still send no referrer) plus a
     `Sec-Fetch-Site: same-origin` fallback (forbidden header — page script
     cannot forge it). **Never set `no-referrer` on a page with a form POST.**
  2. **SQLite file hardening orphaned a live connection's WAL.**
     `_secure_sensitive_file()` opened+closed its own fd to `fchmod` the DB and
     `-wal`/`-shm`. POSIX drops EVERY advisory lock a process holds on a file
     when it closes ANY fd for it → the closing connection thought it was the
     last one, checkpointed, and **unlinked the WAL set under the running
     mirror**, which kept committing (no error!) into deleted inodes: writes
     invisible to all readers, lost on exit. This caused BOTH the earlier
     database corruption AND the repeated "mirror silent while systemd says
     active" stalls. Fixed with `lstat` + path-based `chmod` (opens no fd).
     Regression test drives a real second process and fails on the old code.
- **Diagnosis technique that cracked it (reusable):** restarting the admin
  reproduced the stall 4/4; `SIGUSR1` now dumps sanitized asyncio task
  state (all workers were ALIVE at normal await points — ruling out death,
  cancellation and loop starvation); py-spy showed the loop idle in `select`;
  `/proc/<pid>/fd` showed **`(deleted)`** `-wal`/`-shm` with inodes differing
  from the live paths. **If a service goes quiet: check `/proc/<pid>/fd` for
  `(deleted)` sqlite files first, then `kill -USR1`.**
- **Post-fix stability**: 35 read-only samples / 17 min, max worker heartbeat
  age 5s, zero >30s, NRestarts 0, and **two admin restarts inside the window**
  (the old trigger) with no stall.
- **STILL PENDING (unclaimed, needs the owner): Cloudflare rate-limiting rule**
  on `admin.affi.co.il/login` — dashboard/API-token only, so it cannot be
  applied or verified from here. A 25-request GET probe returned all 200 =
  INCONCLUSIVE (the specced rule is POST-only). Settings in DEPLOYMENT.md.
- **Host**: `/usr/local/sbin/affi-admin-cli` runs the admin CLI as the service
  user under the unit's EnvironmentFile (TTY-aware for `--enroll`). Temporary
  diagnostics (heartbeat sampler, py-spy venv) were removed after use.
- **RULES**: never open the live DB read-write as root; never delete rows under
  a running service; deploy via git bundle (`/tmp/affi.bundle`) and always
  check `git status` after checkout (admin/ was once root-owned and silently
  blocked it).

## 2026-09-04 addendum — Admin now authenticates itself (password + TOTP); Access ABANDONED

- Repo HEAD **`bb8b703e28ece6138f21b7c075d8dd9da7bc30b8`** on `main`
  (local == origin/main == deployed `/opt/affiliate-deals-bot`).
  **1093 pytest passed**, ruff + format + strict mypy clean (140 files).
  Live schema is now **v10**.
- **Cloudflare Access is ABANDONED** — its Zero Trust onboarding demands a
  billing method the owner declined (twice). The owner chose an **internally
  authenticated Admin**, keeping the Tunnel and the loopback-only origin. All
  `CF_ACCESS_*` configuration is removed from code, env and docs. Do NOT
  reintroduce it. Passkeys/WebAuthn are a FUTURE enhancement and must use a
  mature maintained library — the owner explicitly forbade hand-rolled
  CBOR/COSE in this milestone.
- **What ships**: scrypt password + RFC 6238 TOTP (validated against the RFC
  4226 vectors) with a replay guard; server-side sessions in a `__Host-` cookie
  (Secure/HttpOnly/SameSite=Lax) with bounded idle (`ADMIN_SESSION_IDLE_MINUTES`
  =720) and absolute (`ADMIN_SESSION_ABSOLUTE_HOURS`=168) expiry; exponential
  login throttle over salted scopes + a global scrypt-burn ceiling;
  login/logout/revoke-all, all audited; `--enroll` / `--check` /
  `--revoke-sessions`. **Fail-closed is preserved**: the service refuses to
  serve while no owner is enrolled — no config can raise an unauthenticated
  panel.
- **Verified over the REAL `https://admin.affi.co.il`** (not a local origin),
  using a throwaway credential so the owner's password never passed through the
  agent: **32/32** edge + login-flow checks and **27/27** panel-vs-live-data
  checks (dashboard/sources/candidates/governor/links/publications, LIVE
  refused without the exact phrase, added source starts DISABLED and archives).
- **Found live**: Cloudflare Scrape Shield rewrote the owner's address into
  `[email protected]`. Fixed with `ui.email_safe()` (Cloudflare's
  `<!--email_off-->` markers) on the owner field and audit actor; re-verified.
- **INCIDENT I CAUSED — read before touching the DB.** The verification harness
  cleaned up by opening the live SQLite DB **read-write as root** while both
  services ran → root-owned `-wal`/`-shm` beside the affideals-owned DB →
  `database disk image is malformed`; the mirror froze then failed. Recovered
  fully: restored `db-preupgrade-20260904T133005Z.sqlite3` (integrity ok)
  through SQLite's backup API **as affideals**; post-recovery integrity ok,
  schema 10, heartbeats advancing, NRestarts 0, data intact (73 candidates,
  133 source_messages, 141 target_mappings, 0 core_publications, mode SHADOW).
  Nothing published; Remote Sources untouched.
  **RULE: never open the live DB read-write as root and never delete rows under
  a running service.** Use `sudo /usr/local/sbin/affi-admin-cli ...`, else
  `sudo -u affideals`, else stop the service. Procedure in RUNBOOK.md.
- **Host changes**: admin env drops `ADMIN_ALLOWED_EMAILS`, adds the two session
  bounds (a `.bak-*` copy is kept); systemd unit refreshed;
  **`/usr/local/sbin/affi-admin-cli`** (root 0755) runs the admin CLI as the
  service user under the unit's EnvironmentFile, TTY-aware so `--enroll`
  prompts without echoing. `src/affiliate_deals_bot/admin/` was root-owned from
  an earlier deploy and silently blocked `git checkout` — now affideals-owned;
  **always check `git status` after a deploy**.
- **PENDING OWNER (both genuinely need the owner, not the agent)**
  1. Enroll: `sudo /usr/local/sbin/affi-admin-cli --enroll --email diman7@duck.com`
     then `sudo systemctl reset-failed affiliate-deals-admin && sudo systemctl
     start affiliate-deals-admin`. Until then the admin is fail-closed and
     `https://admin.affi.co.il` correctly answers **502**.
  2. Cloudflare **rate-limiting rule** on `admin.affi.co.il/login` (dashboard,
     free plan, no Zero Trust): POST + `/login`, by IP, 10 req / 10 min, block
     1h. **No country allowlist** (owner's explicit instruction). Exact settings
     in DEPLOYMENT.md. The in-app throttle is already live and independent.
  3. Owner's physical **phone acceptance** of the PWA — NOT done, **no PASS
     claimed**; it needs the owner's own login.

## 2026-08-31 addendum — Cloudflare Tunnel edge DONE; Access pending owner (billing)

> **PARTIALLY SUPERSEDED by the 2026-09-04 addendum above**: the Tunnel facts
> below still hold, but Cloudflare **Access was abandoned** and replaced by the
> Admin's own password + TOTP login. Ignore every "Access pending" statement.

- Repo HEAD now **`4d30c1e4335838b5014a8a337e425939a26aeda9`** on `main`
  (docs-only reconciliation commit over `c46bd25…`; local == origin/main).
  1026 pytest passed, ruff + format + strict mypy clean. Deployed server code
  still `c46bd25` (byte-identical for runtime — docs-only, no redeploy).
- **Cloudflare Tunnel for `admin.affi.co.il` physically configured + verified.**
  Locally-managed named tunnel **`affi-admin`**, id
  `a8e948d2-d447-4a78-a4b4-89544de51e1b`. Runs as the `cloudflared` systemd
  service (enabled+active, 4 QUIC edge conns). `/etc/cloudflared/config.yml`
  routes `admin.affi.co.il → http://127.0.0.1:8642` (fallback 404); credentials
  JSON `/root/.cloudflared/<id>.json` (root-only); proxied CNAME created.
  Edge verified: unauth `https://admin.affi.co.il` → Cloudflare **502** (origin
  loopback + admin fail-closed), no admin content/redirect/raw-origin/other-app;
  nothing on :8642; no public port (only pre-existing sshd:22; cloudflared
  metrics on 127.0.0.1:20241); apex/`www` unchanged (522); Remote Sources
  healthy.
- **`cloudflared tunnel login` cert transfer is broken on this host** (known
  cloudflared bug #1252 — `Failed to fetch resource`, browser-download fallback;
  two clean failures, all other net tests fine). Owner chose the manual-cert
  fallback: the browser-downloaded `cert.pem` (on the Android phone Downloads,
  where this agent runs) was transferred **file-only** phone→VPS (contents
  never printed/pasted), installed 0600 root, validated via `cloudflared tunnel
  list`, used for `create`+`route dns`, then **securely shredded**. If the
  tunnel ever needs management (create/delete/route) again, cert.pem must be
  re-provided; the running tunnel needs only the credentials JSON.
- **PENDING OWNER — Cloudflare Access** (the ONLY open edge step): the owner
  declined Cloudflare **Zero Trust** onboarding for now (first activation asks
  for a billing method). So the Access application for admin.affi.co.il + the
  admin env `CF_ACCESS_TEAM_DOMAIN`/`CF_ACCESS_AUDIENCE` are NOT set → admin
  service stays **failed/fail-closed** by design (verified message: "Cloudflare
  Access configuration is incomplete"). Do NOT weaken this; do NOT start the
  admin without Access; do NOT use the insecure no-auth mode. Consequently the
  physical **owner phone acceptance** and **through-the-real-Admin-UI**
  verifications (task §10–§16) are NOT performed — they need an Access session.
  When the owner is ready to add Zero Trust billing: create a self-hosted Access
  app (allow only diman7@duck.com), put team domain + AUD into the admin env
  (0600), `systemctl restart affiliate-deals-admin`, then run the §9/§10–§17
  edge+UI acceptance.

## Latest milestone: Affi Admin + Core Shadow Mode + Radar Scheduler + Source Manager + Governor Control Plane

- Date: 2026-08-30
- Branch `main`, tracking `origin/main`.
- Final commit (pushed, verified local == origin/main == deployed server HEAD):
  **`c46bd25181ae31ba2fbf3bbe14096344b33a53f3`** ("Make Affi Core observable
  and controllable: admin PWA, shadow mode, 24/7 radar scheduler, governor
  control plane"), parent `55f8bee78fbf837b55f623d167e67c2412de74ee`.

## Production state (the important part)

- **`AFFI_CORE_ENABLED=true` + runtime mode `SHADOW`** — the completion state.
  The engine polls/binds/decides/simulates 24/7 with ZERO automatic public
  writes (`core_publications` = 0; the only publisher remains the KSP mirror).
  Mode is durable in `core_runtime_state`, changed from the Admin without
  restart, audited. LIVE is NOT enabled (requires typing `LIVE` in the Admin).
- Schema **v9** live in production (migrated v8→v9 automatically on first
  open; pre-deploy backup `db-predeploy-20260830T174222Z.sqlite3` in
  `backups/`, integrity+quick_check ok). Mirror state preserved; it published
  genuinely new posts during the deploy (cursor 16569→16574, mappings 84→89,
  0 duplicate destination ids after restart).
- Radar sources (DB rows, managed from the Admin): `beedealslive` —
  parser=beedeals, **shadow, enabled** (real cycles observed: 31 posts → 18
  signals → candidates, all conservatively `needs_review`; a new live post
  was ingested mid-validation). `kspcoil` — generic-parser probe used for the
  §37 validation (30 posts → 23 signals), then **disabled + archived** so KSP
  stays mirror-only. All admin actions (incl. one deliberately rejected
  wrong-name attempt) are in `admin_audit_log`.
- **Admin service** `affiliate-deals-admin` installed + enabled, loopback-only
  `127.0.0.1:8642`, env `/etc/affiliate-deals-bot/affiliate-deals-admin.env`
  (0600 affideals; holds a generated ADMIN_CSRF_SECRET;
  ADMIN_ALLOWED_EMAILS=diman7@duck.com). It is **fail-closed**: without
  CF_ACCESS_TEAM_DOMAIN + CF_ACCESS_AUDIENCE it refuses to start (verified:
  "Cloudflare Access configuration is incomplete"). No insecure fallback is
  running; the temporary triple-gated loopback instance used for validation
  was stopped and its env deleted (port 8642 closed).
- **Cloudflare edge** — SUPERSEDED by the 2026-08-31 addendum at the top: the
  Tunnel (`affi-admin`, config.yml, DNS route, systemd service) is now DONE and
  verified. The tunnel was built with the manual-cert fallback (not the
  browser-auto-deposit this block originally assumed) because `cloudflared
  tunnel login` cert transfer is broken on this host (#1252). The ONLY open edge
  step is the Zero Trust **Access application** + admin `CF_ACCESS_*` env, which
  the owner deferred (declined Zero Trust billing for now). Admin stays
  fail-closed until then. cloudflared 2026.8.2 is installed;
  `/etc/cloudflared/config.yml.pending-owner` remains as a template.

## What was built (schema v9, all additive)

- `affi_core/modes.py` — hard gate vs durable OFF/SHADOW/LIVE; per-source
  modes cap at the runtime mode. `affi_core/control.py` — typed control-plane
  values (policy config, thread state, source records/health, publications,
  shadow outcomes, audit, commands, heartbeats).
- `admin/` — aiohttp Hebrew-RTL mobile-first PWA (no SPA/Node/external
  assets): CF Access JWT via team JWKS (iss/AUD/RS256; email header never
  trusted alone), HMAC CSRF + same-origin on every POST, strict CSP,
  `no-store`, static-only service worker, full audit; pages: dashboard (click
  tracking honestly "עדיין לא מופעל"), system/mode (LIVE type-to-confirm),
  sources, source test (read-only ~20 posts, NO cursor mutation), candidates
  (internal score; reprocess/ignore/manual-publish — manual bypasses score
  only, never caps/FloodWait), products, links (KSP appKey=14095), pubs +
  chain view, governor editor (hot-reload), audit, errors. Admin↔engine via
  durable `admin_commands` queue — the admin process NEVER talks to Telegram.
- `infrastructure/telegram/radar_collector.py` + `radar_scheduler.py` —
  generic collector (any public channel, no code changes), 24/7 scheduler
  (cursors/health/backoff 60·2ⁿ≤1800/FloodWait), `AdminCommandExecutor`,
  `CoreThreadExecutor` (durable intents: CREATE keyed by chain state — crash
  can never double-post; EDIT keyed by rendered-content digest — same content
  dedups, new content re-edits), `HeartbeatRunner`.
- `affi_core/orchestrator.py` — §14 pipeline; bound-listing ladder tier 2b
  (a `merchant_products` binding resolves NO_MATCH; conflicts →
  `bound_listing_conflict` NEEDS_REVIEW; matcher caution never overridden).
- `affi_core/channel_policy.py` — locked policy 10 soft/14 hard per 24h,
  45-min gap, ≤2/rolling-hour, quiet 00:00–07:00 Asia/Jerusalem
  (zoneinfo/DST), exceptional bypass (quiet-only, ≥15-min gap, recorded);
  actual public posts incl. legacy mirror count toward volume; ranked queue.
- `affi_core/thread_chain.py` — sequential chain **SUPERSEDES
  reply-to-ROOT**: permanent ROOT → 24h window edits latest in place (never
  extends window; expiry alone never posts) → replies chain to previous
  latest. `governed.py` v2 anchors mirror threading to the chain LATEST.
- `telegram/transform.py` — TEXT_LINK locked rule: URL-equivalent displayed
  text replaced together with the target (UTF-16-correct); labels keep text.

## Validation (all physically performed)

- Offline: **1026 pytest**, ruff + format + strict mypy (135 files),
  `git diff --check`, secret scan — clean. v8→v9 verified on a real
  production backup copy (31 tables digest-identical, cursor preserved).
- Real Telegram (local): BeeDeals SHADOW smoke via the committed engine path
  with a raising sentinel publisher (30 posts → 17 candidates; idempotent
  re-poll; tracking links internal-only; controlled bound-listing resolution;
  zero publisher calls). **12-step sequential-chain E2E** on an ephemeral
  channel (SHADOW physically refused; ROOT; same-content dedup; in-place
  edit; window never extended; expiry posts nothing; u1→u0, u2→u1, restart,
  u3→u2; one ROOT ever; chain re-read from Telegram; channel deleted).
  **TEXT_LINK smoke** on ephemeral channels (displayed URL text + target both
  → appKey=14095; label kept; UTF-16 with astral emoji).
- Server (§35–39): admin origin headers/bind/healthz; real Admin flows for
  mode/sources/tests through the command queue executed by the telegram
  service; scheduler heartbeat paused→running on mode change WITHOUT restart;
  generic second channel validated then archived; governor config served with
  locked defaults; KSP mirror regression (published new posts throughout,
  restart clean, 0 dup ids); Remote Sources untouched; VPS not rebooted.

## Server access (unchanged; no secrets recorded)

Same VPS as the sibling `telegram-remote-sources`. Use its git-ignored
`deploy/production.env` for `RS_DEPLOY_HOST`, but the **working SSH key is
`/home/devagent/.ssh/telegram_remote_sources` with `HOME=/home/devagent`**
(the `RS_DEPLOY_KEY` path under `/root` is stale — auth fails with it). Read
the SQLite DB read-only via the host venv Python (`sqlite3` CLI is NOT
installed; use `sudo -u affideals /opt/affiliate-deals-bot/.venv/bin/python`).
A `mode=ro` diagnostic connection can lag rapid WAL writes — stable-state reads
only. Never open a second Telethon client against the live user session. Never
print/commit host/IP/tailnet/key values.

## Remaining / future work

- Cloudflare **Tunnel** DONE (2026-08-31; see top addendum). Remaining edge
  step = the Zero Trust **Access application** + admin `CF_ACCESS_*` env, which
  the owner deferred (declined Zero Trust billing). Currently unauthenticated
  `https://admin.affi.co.il` → Cloudflare **502** (origin loopback + admin
  fail-closed). AFTER the Access app exists it must instead **302** to
  `<team>.cloudflareaccess.com` and never serve admin content — verify then.
  The owner phone acceptance + through-the-Admin-UI checks (§10–§16) also wait
  on Access.
- LIVE mode: owner decision later, via the Admin, after reviewing shadow
  outcomes vs policy. Shadow outcomes appear once candidates resolve
  (currently all needs_review — correct conservatism; curation/binding will
  unlock them; the WOULD_* simulation itself is unit- and physically-proven).
- Click analytics: future only; no numbers are invented anywhere.
- Repo docs: README, TODO (reconciled backlog incl. SUPERSEDED reply-to-ROOT),
  docs/PROJECT_STATE, ARCHITECTURE, RUNBOOK, DEPLOYMENT (admin + cloudflared
  runbook), HANDOFF, RELEASE_REVIEW, FUTURE_*, new docs/ADMIN.md +
  docs/SHADOW_MODE.md.
- Shared VPS still not rebooted (autostart of both units verified via
  enablement only). A production-organic caption split still hasn't occurred
  naturally (real E2E + offline suite cover it).
