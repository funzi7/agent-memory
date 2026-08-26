# cc-latest.md — affiliate-deals-bot handoff (latest)

> Rolling handoff for `funzi7/affiliate-deals-bot`. Read this first, then the
> repository documentation linked below.

## Latest milestone: Telegram caption-overflow split + continuation persistence + edit reconciliation

- Date: 2026-08-26
- Branch `main`, tracking `origin/main`.
- Parent commit: `6849ee9bef36e4f350c774df47597df2ff47674f`.
- Project commit (pushed, verified local == origin/main):
  `14c4038c9a1052425603867f5fad8ae52ff91c34`.

This milestone makes an over-limit transformed caption **split rather than
block**, persists the synthetic continuation messages distinguishably, and
reconciles them on edit — then verifies the whole round-trip live against real
Telegram. It resolves the 16535-class blocker (a converted photo caption reached
1050 UTF-16 units, above Telegram's 1024 limit, and was previously blocked).

## What changed (key results)

- **Splitter** (`telegram/chunking.py`, `split_overflowing_messages`): media
  caption budget 1024, text 4096 UTF-16 units. Prefers paragraph/newline →
  whitespace → hard UTF-16-safe boundary; **never** splits a surrogate pair or an
  entity (link/emoji/formatting); rebases entity offsets per chunk; preserves all
  content (Hebrew/RTL, emojis, visible URLs, hidden `TextUrl`, formatting,
  affiliate URLs). A single indivisible over-limit entity → block + alert
  (`telegram_caption_unsplittable`), never truncate. Albums split each member's
  caption independently, continuations appended after the album in member order.
- **Plan/serialization**: `DeliveryPlan.continuations` carried through the durable
  outbox payload (backward-compatible), so the split survives restart.
- **Persistence**: schema **v5** adds `mapping_role`
  (`primary`/`album_member`/`continuation`) to `target_mappings` and
  `target_mapping_history`. Verified on a fresh DB and on a backup snapshot of the
  production DB (15 rows → all `primary`, zero loss). `TargetMappingWrite` /
  `PublishedMapping` carry `mapping_role` (`MappingRole` enum).
- **Publisher**: new `publish_continuations`, `edit_continuations`,
  `delete_messages`; `_translate_error` maps `MediaCaptionTooLong`/
  `MessageTooLong` → non-retryable (`telegram_content_too_long`) as a safety net.
- **Runtime reconciliation** (`_deliver_telegram_claim`): publish = primary +
  continuations; edit = edit primary in place (id stable) + edit overlap + publish
  new (grow) or **delete only obsolete synthetic continuations** (shrink), then
  persist. Retry-safe via stable MTProto random ids + idempotent edit/delete.
- **Narrow deletion exception**: the ONLY destination deletion is of obsolete
  synthetic continuations this mirror created during overflow splitting, during
  reconciliation. The primary post is **never** deleted (not on source deletion,
  product gone, offer expired, broken URL, merchant removal). A failed remote
  delete → reconciliation failure (fenced retry → owner alert), never silent
  stale text.

## Live validation (physically verified)

Real Telegram API, real `@AffiIsrael`, isolated temp DB, ephemeral private test
channel (created + deleted; production DB untouched). Media source, 986-unit
caption + 12 KSP `/sku/` links → conversion pushed the transformed caption past
1024 → published primary **msg 22** + continuation **msg 23** (roles
`[primary, continuation]`), both verified present. Shrink edit → primary edited
in place (still **22**), obsolete continuation **23 deleted**. Grow edit → **22**
stable, new continuation **24** published. Restart (fresh runtime, same DB) →
mapping `[22, 24]` survived; edit-after-restart updated **22** and deleted **24**.
All 3 test destination messages + the ephemeral channel cleaned up; **no real KSP
mirror posts touched**. Owner reachability confirmed by `check-setup`.

**Honest scope**: only 0↔1 continuation transitions are reproducible live (a real
source caption cannot exceed 1024, and bounded conversion growth yields at most
one split). Multi-continuation grow/shrink is covered by the offline suite only.

## Deployment (Part 2): NOT performed — blocker

The target host is the owner's existing VPS that also runs the unrelated
`remote-sources` app at `/opt/remote-sources`. It is Tailscale-fronted, SSH over
the private tailnet only. This automation environment had **no Tailscale path and
no server identifier** (`~/.telegram_vps_host` absent), so the server was
unreachable/unidentifiable — deployment was **stopped, not guessed**. The other
app was inspected read-only from its committed deploy config only and NOT touched.

Ready artifacts committed: `deploy/affiliate-deals-telegram.service` (hardened
systemd unit — `Restart=on-failure` + `StartLimit` backoff, isolated paths,
outbound-only, `systemd-analyze verify` clean) and `docs/DEPLOYMENT.md` (isolated
layout `/opt/affiliate-deals-bot` + `/var/lib/affiliate-deals-bot` +
`/etc/affiliate-deals-bot` + `affideals` user; secret/session migration; sqlite
`.backup`; restore/upgrade/rollback; observability; do-not-disturb checklist).
Service unit name: **`affiliate-deals-telegram.service`**; enabled/running status:
**not installed**. To deploy later, run the DEPLOYMENT.md steps from a
tailnet-connected session (or the owner runs them).

## Validation

- Offline: pytest **477 passed** (+23 new); ruff check + ruff-format clean (66
  files); strict mypy clean (66 files); `git diff --check` clean; secret/session
  scan clean (`.env`, `.local/` session+DBs untracked/gitignored);
  `systemd-analyze verify` clean on the unit.
- Live: caption-overflow split + edit-reconcile round-trip above.

## Remaining / not verified

- Server deployment and everything that depends on it: persistent service
  running, server process-restart recovery, server-side dedup/cursor continuity,
  owner notification **from the server**, boot autostart, other-app post-deploy
  health. **Do not claim 24/7 operation.** No server reboot performed.
- Live multi-continuation grow/shrink (offline only, physical source-limit).
- KSP automated 403/Turnstile — probing-only limitation, not a publication
  blocker (aliases carry `?appKey=14095` / structural forms directly).
- Purchase/commission attribution — never provable by automation.

## Next work / cautions

- Deploy the 24/7 service (needs tailnet/SSH access to the host); then perform the
  server-side production validation and owner-from-server alert.
- LastPrice & Rozenfeld await real affiliate examples (never guess formats).
  AliExpress future; Amazon policy/research-gated. Future Telegram search bot +
  cross-store discovery engine and the `affi.co.il` website assistant/widget are
  documented, unbuilt. Marketing agent + ad spend require a hard Budget
  Controller first.
- Never commit `.env`, sessions, runtime DBs/backups, tokens, API hash, login
  codes, cookies, logs, or any server identifier/SSH key. Protect the runtime
  database as source content.

Repository references: `README.md`, `TODO.md`, `docs/ARCHITECTURE.md`,
`docs/RUNBOOK.md`, `docs/DEPLOYMENT.md`, `docs/PROJECT_STATE.md`,
`docs/RELEASE_REVIEW.md`, `docs/HANDOFF.md`, `docs/KSP_LIVE_SMOKE.md`,
`docs/BRAND.md`, `docs/FUTURE_WEBSITE.md`, `docs/FUTURE_DISCOVERY.md`.
