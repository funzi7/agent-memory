# Private Media TV — F2C.7 Final (published; physical owner acceptance pending)

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | `funzi7/private-media-tv` |
| Milestone | F2C.7 — unified local/download playback + catalog integration: ONE shared player for all sources, ONE progress identity per catalog identity, local-first source priority, durable owner binding + canonical presentation, CW rightmost-RTL, עב Hebrew-language badge, dd.MM.yyyy LTR dates, downloads expansion (bulk + OFF-default auto-download subscriptions + durable queue) |
| Branch / tracking branch | `main` / `origin/main` |
| Starting application HEAD (this session) | `27256b01393cce122566645f426101c10e09778d` |
| Final application HEAD | `ec44de8c77dd220c424cdad5f8179fb1fd676205` (single task-only commit, 61 files, pushed normally, no force; equals `origin/main`) |
| Exact-head Android CI | `32690830610` — **success**, exact head `ec44de8c77dd220c424cdad5f8179fb1fd676205` (Gradle wrapper validation + Official TDLib/tests/lint/signed TV+mobile assembly both green; exact-head artifacts uploaded) |
| Mobile identity | `com.funzi7.privatemediatv.mobile`, `0.4.11-phone-test`, versionCode 30 (updates code 29 in place) |
| TV regression identity | `com.funzi7.privatemediatv`, `0.6.10-f2c7`, versionCode 33 (regression build only; **not delivered**) |
| Schemas | Catalog/FTS 11 unchanged; territory availability v3 unchanged; **UserState v6→v7 additive** (`series_download_subscriptions`); **Local Library v2→v3 additive** (canonical-presentation columns); schema JSONs for v7/v3 committed |
| Development signer SHA-256 | `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` |
| Published mobile code-30 APK (CI build) | 59,497,200 bytes, SHA-256 `4b56928a47ee60043177c6f27a04066088625b29ede07884ca1301201d842c8e`, ARM64-only, pinned JNI `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f`, Development signer |
| TDLib | Pinned official commit unchanged; CI verified/packaged the pinned artifact; no rebuild |

## What changed this session (one coherent F2C.7 pass; ADR 0028)

1. **ONE player.** Provider-neutral `ProviderPlayableMedia` envelope (Telegram + Local Library
   implementations); local SAF files and completed downloads play through the same shared
   PlaybackScreen/player overlay as streaming; the standalone local player was deleted.
   Catalog-surface local-first launches return to the catalog on Back; Local Library screen
   launches return to the library overlay.
2. **ONE progress identity.** Catalog `user_playback_progress` keyed by `MediaIdentity.stableKey`
   stays authoritative; per-resource resume records are seeded from a strictly-newer catalog row
   (completed/zero rows never seed) and reconciled newest-wins at bind time. No second progress DB.
3. **Local-first source priority:** complete download → owner/auto-bound local file → safe
   automatic match → known provider → discovery. Passive rendering (browsing/cards/badges) issues
   zero Telegram work.
4. **Search** annotates local availability on real provider/catalog results only; never fabricates
   titles from local files.
5. **Durable owner binding.** Manual שייך לקטלוג / שנה שיוך / בטל שיוך via `bindFileToIdentity`;
   OWNER bindings survive rescans and are never silently overwritten (AUTOMATIC never displaces
   OWNER). Local Library v3 adds canonical presentation: bound files show catalog-canonical
   titles; unbound files show a conservative cleaned label.
6. **Continue Watching in RTL:** newest item is visually RIGHTMOST via ViewModel lead-key scroll
   anchoring (no reverseLayout); browse-and-return position restoration preserved.
7. **עב badge.** Separate compact Hebrew-language badge; evidence is TMDB
   `original_language == "he"` ONLY (Hebrew title / IL origin are NOT evidence); carried through
   parser → codec → cache probe → UI with the Israel-badge chokepoint for surface parity; 🇮🇱
   badge and pipeline untouched.
8. **Dates.** All user-visible dates render dd.MM.yyyy (with time dd.MM.yyyy HH:mm), visually LTR
   via escaped directional isolates (BidiSpoofing-safe); presentation-only — stored snapshots and
   APIs remain ISO.
9. **Downloads expansion:** per-episode download button; chronological idempotent season bulk;
   all-seasons bulk; auto-download subscriptions **default OFF** with existing policy vocabulary
   (UserState v7 `series_download_subscriptions`: enabled/variant policy/baseline air date/attempt
   gate, 6h retry backoff, baseline re-captured only on enable); restart-durable deterministic
   queue with cancel; offline playback through the same shared player; downloads and Local
   Library remain structurally disjoint. Canonical-folder physical placement for downloads is
   documented as logical-only (physically impossible without forbidden duplication).
10. **Documented as FUTURE only (not implemented):** availability precheck (UNKNOWN must never be
    shown as "no source") and TheTVDB/OMDb metadata fallback.

Docs: ADR 0028; README/TODO/CHANGELOG/PROJECT_STATE/ARCHITECTURE/HANDOFF/RELEASE_REVIEW/TEST_PLAN
updated; `docs/MOBILE_ACCEPTANCE.md` gained the 15-item F2C.7 physical code-30 procedure
(install over code 29; NO uninstall; NO Clear Data).

## Validation actually run (this session)

- Full non-live `./gradlew test` at the final tree: **1,592 discovered / 1,587 passed /
  0 failures / 0 errors / 5 skipped** (3 environment private-LAN listener cases + 2 opt-in live
  TMDB smokes). Lint clean; both signed release assemblies built.
- Migration evidence from committed code-29 schema JSONs: UserState v6→v7 preserves seeded
  progress rows, chained 1→7 works, unknown stored variant policy falls back to maximum quality;
  Local Library v2→v3 preserves a seeded OWNER binding byte-identically, chained 1→3 works;
  owner-binding lifecycle (bind/rebind/unbind/rescan survival) covered by new store tests.
- New behavior tests: unified local playback ViewModel suite (local-first launch, cross-source
  resume seeding, auto-download sweep ordering + backoff gate), presentation suite (date labels,
  codec round-trip incl. legacy payloads), Robolectric RTL compose test (newest CW item
  rightmost; עב badge shown only for `original_language == "he"`).
- Delivery/CI harnesses all green: credential 41, TV delivery 9, mobile delivery 16 (incl.
  rewritten 29→30 rotation case), TV CI rejections 8, mobile CI rejections 20+1, upgrade 13,
  pmtprov interop self-test 4, `bash -n` 27, node verifiers, TDLib verify-only (pinned JAR/JNI
  hashes unchanged).
- Real upgrade check against the actual published code-29 phone APK → locally built code-30:
  same package, higher code, same Development signer.
- `git diff --check` clean; one cohesive task-only commit; `adb devices -l` empty at all times —
  no installation/launch/physical claims are made.
- Exact-head Android CI `32690830610` for `ec44de8c…`: success, both jobs green.
- **No Telegram runtime integration is possible on this host and none was fabricated**; local
  Telegram-dependent paths are covered by fakes/contract tests only.

## Phone publication (canonical, this session)

`./scripts/download-latest-ci-mobile-apk-to-phone.sh` ran against CI run `32690830610`
(artifact `private-media-tv-mobile-apk-ec44de8c…`) and **succeeded**: package/version/ABI/JNI/
signer verified, rotation performed. Verified final state of
`/storage/emulated/0/Download/PrivateMediaTV/Mobile/`:

- `private-media-tv-mobile-latest.apk` = code 30 CI build, 59,497,200 bytes, SHA-256
  `4b56928a47ee60043177c6f27a04066088625b29ede07884ca1301201d842c8e`
- `private-media-tv-mobile-previous.apk` = published code 29, 59,382,512 bytes, SHA-256
  `0a5f28d346eff0f4cc34c9717553cfbfc3c174eb4f561e902c9ad69bd319ce3a` (timestamp unchanged)
- broken code 23 remains excluded/blocklisted; no other files in the Mobile directory
- TV APKs at the delivery root verified untouched (timestamps unchanged); no TV export, no
  Shield action, no uninstall/downgrade/Clear Data

## Pending, limitations, and risks

- **Physical owner acceptance is pending and is the runtime acceptance gate:** install code 30
  over code 29 (Android must offer Update; NO uninstall/Clear Data) and run the 15-item F2C.7
  procedure in `docs/MOBILE_ACCEPTANCE.md` (unified local/download playback via the one player,
  cross-source resume, local-first priority, search local annotation, manual binding lifecycle,
  CW rightmost-RTL, עב badge, dd.MM.yyyy dates, bulk downloads, OFF-default auto-download,
  queue durability, offline playback).
- Code-30→29 rollback after the v7/v3 migrations have run is not a validated path (additive
  forward migrations only; downgrade behavior untested — avoid rollback, use re-upgrade).
- Auto-download performs no work unless a subscription is explicitly enabled; default state
  after upgrade is OFF for every series.
- TV code 33 remains a regression build only; no Shield delivery or acceptance is claimed.

## Exact next step / continuation

1. Owner performs the F2C.7 code-30 physical procedure (`docs/MOBILE_ACCEPTANCE.md`) — this
   completes the live runtime acceptance gate (TMDB + Telegram + local playback on device).
2. Deferred and untouched: §13 availability precheck (UNKNOWN never "no source") and §14
   TheTVDB/OMDb fallback (documented FUTURE), OMDb provisioning, Wikidata franchise population,
   Windows implementation, final Shield rollout.

Preserve all permanent constraints: `funzi7` only; no reset/clean/restore/stash/force push; no
alternate checkout/worktree; no speculative TDLib rebuild; no Telegram work from
browsing/continuation/badge paths; mobile-only publication; never claim physical or runtime
evidence without the owner/device; never commit or persist any TMDB credential.
