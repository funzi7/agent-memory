# Private Media TV — F2C.7.6 Final (mobile code 36 committed; exact-head CI budget-blocked)

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | funzi7/private-media-tv |
| Milestone | F2C.7.6 — real Sports data, provider/source discovery, private announcements, Universal Source onboarding, and multi-hop source-chain audit |
| Branch / tracking | main / origin/main |
| Starting application HEAD | 01f758ee90edcfb6d943fc0f7ba689444ef51dad (F2C.7.5 / mobile code 35) |
| Final application HEAD | 25dacbcfc7bb4d01aeb328cef668de1b45663bf2 — equals origin/main; pushed normally, no force |
| Application commit | 25dacbcfc7bb4d01aeb328cef668de1b45663bf2 — F2C.7.6 enable real Sports and universal source discovery |
| Agent-memory pre-finalization HEAD | a51e0ebfecb2768646ac1a5db3ab39227a7a87d2; the required finalizer records the resulting memory HEAD |
| Exact-head Android CI | run 33372822414 — FAILED TO START because the GitHub Actions budget prevented further use; wrapper job had zero steps, build job was skipped, and this is not a repository test failure |
| Mobile identity | com.funzi7.privatemediatv.mobile, 0.4.17-phone-test, versionCode 36; intended to update code 35 in place |
| TV identity | com.funzi7.privatemediatv, 0.6.11-f2c71, versionCode 34 — frozen; no direct TV edit/task/build/test/lint/version/artifact/publication or Shield action |
| Persistence | additive Catalog Room v13→v14 Universal Source registry/bindings/priorities; full source profiles and owner origin-graph approvals remain in separate encrypted envelopes |
| Development signer SHA-256 | 2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0 |
| Local code-36 APK | 66,560,197 bytes; SHA-256 157411d72be40dab62e6cfded9d924fbd4246ffe0bba1d1bb3955ade8438f19b; ARM64-only; TDLib JNI SHA-256 21d59ebfeba4edc62ea74cefaa79b08650e796530f3d5e57804105cc44cb65dc |
| Authoritative code-36 publication | NOT PERFORMED — no successful exact-head CI artifact exists, so the local APK was not substituted or copied as the release artifact |
| Retained phone Test artifact | code 35 remains at /storage/emulated/0/Download/PrivateMediaTV/Test/private-media-tv-mobile-0.4.16-phone-test.apk; older versioned APKs were preserved |
| Overall milestone result | FAILED for the requested provider/manual Website Playback capability; real Sports data and source inspection passed separately |

## Owner evidence preserved

The owner physically observed code 35 with the Sports route, high Home placement, and configured
filters, but also the empty אין עדיין נתוני משחקים מחוברים state and a clipped Premier League chip.
Those are code-35 FAIL facts. Code 36 implements the data and padding corrections, but no device was
attached and no code-36 installation, launch, UI, playback, or physical acceptance is claimed.

## Implemented F2C.7.6 candidate

### Real Sports data and spoiler firewall

- A production TheSportsDB V1 HTTPS adapter uses public free-key mode without asking for a fake
  secret. Live provider evidence resolved Beitar Jerusalem 135992, Manchester United 133612,
  Real Madrid 133738, Israeli Premier League 4644, Premier League 4328, Spanish La Liga 4335,
  and UEFA Champions League 4480.
- Season/day/team/league previous+next and exact-event scopes are bounded by request coalescing,
  provider-aware TTLs, a process-wide 24-request/minute gate, concurrency and refresh budgets,
  bounded retry, stale-valid retention, and sibling-provider failure isolation.
- The persisted/public fixture projection contains only provider crosswalk, competition/season,
  teams and safe badges, kickoff, neutral state, and round/stage. Score, result, winner, raw event
  title/description, and score-bearing artwork are not modeled or persisted.
- One provider event identity plus exact fixture evidence preserves the same MatchIdentity through
  rescheduling and later LIVE/highlight/full-replay attachment. Bounded pre-kickoff, live, completion,
  postponed, and delayed post-match checks persist their next-check state.
- Home and Sports use real recent/today/upcoming fixtures even when nothing is live. Favorite teams
  rank before followed-only competitions. Match Details is spoiler-free. Competition/team rails use
  stable RTL scrolling and physical-safe 16dp edge padding without shrinking the label.

### Provider evidence, announcements, and media indexes

- Web resources distinguish exact match pages from truthful provider portals. Current audited mapping
  is Monomax for Premier League and beIN SPORTS CONNECT Thailand for LaLiga/UCL only. Connection,
  login, subscription, region, entitlement, and stream success remain separate states.
- Current Israeli rights/site evidence did not prove a maintainable exact browser player, so no live
  Israeli Web provider was fabricated. Optional API-Football remains a key/account-requiring boundary
  and does not block the zero-setup feed.
- SmartTube root licensing was rechecked, but required MediaServiceCore/SharedModules redistribution
  permission remains unclear. The public search/channel/metadata/resolver path stays fail-closed and
  YouTube never routes through WebView or a competing extractor.
- SPORTS_ANNOUNCEMENT_SOURCE observes only future messages from the exact authenticated Telegram
  sources explicitly selected by the owner. Strong teams/competition/date/kickoff evidence attaches
  to an existing MatchIdentity; ambiguity remains privately owner-assignable; an unknown origin still
  requires approval. No private invite, channel identity, message locator, or raw message is public.
- FootReplays is an owner-approved exact-page/manual index path rather than an unrestricted crawler.
  DasFootball uses one cached/rate-bounded public feed and at most two relevant exact pages. Both
  create spoiler-safe SourcePage evidence, never MatchIdentity, and retain cached/sibling sources on
  provider or structural failure.

### Universal Source onboarding and multi-hop bridge model

- One URL-first Add Source controller is shared by master Sources & Connections, Sports settings,
  Match Details, and movie/series/episode source contexts. It distinguishes reusable provider from
  exact item and permits an explicit type override without requiring selectors, regex, APIs, iframe
  hosts, or media URLs from the owner.
- SourceProfile capabilities cover Sports live/replay/highlights/index/announcements, movies, series,
  episodes, mixed catalog, trailers, and general video. Only demonstrated capabilities are shown.
- A bounded declarative RSS/Atom/JSON-LD generic index profile can be saved without executable owner
  JavaScript or crawler code. Complex sites return a typed custom-adapter requirement rather than a
  false success; safe exact-link fallback remains available as discovery state.
- Source origin graphs distinguish INDEX_BRIDGE, EMBED_BRIDGE, PLAYBACK_HOST, and MEDIA_HOST, with
  bounded depth/origins/redirects/requests/time and mirror branches. Index, top-level navigation,
  child frame, media, redirect, cookie/storage, and fullscreen permissions remain directional and
  profile-scoped. A child/CDN never becomes source, catalog, or match identity and cannot gain global
  top-level trust.
- Production probing resolves each hostname once, rejects any unsafe or mixed DNS answer, pins the
  public addresses in a fresh direct cookie/auth-free HTTP/1.1 client while preserving original-host
  TLS/SNI verification, disables implicit redirects/retry/proxy reuse, and checks the connected peer.
- Exact movie title+year/external ID and exact series/season/episode/date evidence may bind to canonical
  catalog identity. Contradictions reject; ambiguous candidates remain owner-confirmable; no fuzzy
  same-title auto-bind occurs.
- Stable Hebrew failure codes and privacy-safe SOURCE_DIAGNOSTIC_V1 expose the failing chain stage
  and safe public host topology without cookies, tokens, passwords, query secrets, account IDs, or
  Telegram identities. Health/check/edit/disable/delete/detail/diagnostic/priority actions are durable
  and do not suppress siblings.
- Room stores only opaque IDs/fingerprints/lifecycle/health/revisions/check state. Complete private
  profile configuration and exact owner edge approvals use distinct Keystore-backed envelopes. A
  changed chain requires new owner approval and never silently re-enables a disabled source; deletion
  removes only that profile; orphaned vault discovery is bounded and full-reset cleanup is fail-closed.

### Manual trust and Website Playback truth

- Match Details previews an owner-pasted HTTPS source's exact scheme/hostname/resolved origin/provider
  label and login/region warning. The URL cannot self-authorize: an explicit confirmation stores a
  separate exact MatchIdentity + source token + origin grant. Credentials, unsafe schemes, IP literals,
  private/local/reserved/mixed DNS, YouTube, and cross-origin escalation reject.
- Final security review established that Android WebView callbacks cannot expose and enforce every
  redirect/POST hop, final DNS/rebinding destination, or JavaScript WebSocket target while retaining
  normal provider login/DRM behavior. Therefore generic, nested, and manual Website Playback is
  production-disabled before DNS recheck, Proton acquisition, session/event creation, or WebView
  construction. Accounts show לא נתמך כרגע; there is no Open action or fake success.
- The dormant WebView lifecycle/origin classifier remains deterministic test surface only. No page,
  embed, player, entitlement, DRM, or media-playback claim is derived from it. Future enablement needs
  an enforceable end-to-end transport decision, not more allowlist fixtures.

## Validation evidence

### Real network/runtime smokes

- TheSportsDB PASS: production HTTPS calls resolved all three owner teams and four competitions,
  returned non-empty 2026/27 schedules and recent/upcoming favorite events, mapped canonical
  MatchIdentity, and serialized no score/winner field.
- Watch sites PASS only as host HTTP evidence: current Monomax landing/EPL/login and beIN Thailand
  LaLiga/UCL pages and redirect assumptions were fetched. No PMTV WebView, login, player, entitlement,
  DRM, or playback surface was exercised.
- Israeli audit complete with no source claimed: public league/rights/provider surfaces were
  reachable, but no maintainable current exact browser player was proved.
- FootReplays PASS only for source/child structure: a current exact source page and cross-origin
  child page were fetched and conservatively matched. First iframe/player surface and playback were
  not observed.
- DasFootball PASS only for source/page/manifest structure: the bounded feed→exact-page adapter
  matched a recent item, suppressed raw score-bearing presentation, and fetched its cross-origin HLS
  manifest. This was not a PMTV player/media observation.
- Universal probe PASS for source inspection: the production pinned-DNS probe created and codec-
  round-tripped FootReplays and DasFootball profiles with off-origin edge-scoped graph evidence.
  sourcePageLoaded=true; firstEmbedLoaded=false; nestedEmbedLoaded=false;
  playerSurfaceReached=false; mediaPlaybackObserved=false.
- Private Telegram live smoke pending: deterministic selected-source/redaction/durability tests
  passed, but no host live-channel test was performed because private identity must remain on the
  owner's authenticated device/runtime.

### Local mobile-only validation

- Every substantial Gradle command used /root/work/bin/heavy-run -- timeout ...; no root aggregate
  task and no TV task ran.
- Explicit mobile/mobile-used unit matrix: 2,177 tests, zero failures/errors, six intentional opt-in
  skips. Totals: app-mobile 746 (four skips), broadcaster 26, catalog 410, Israel access 27, Local
  Library 56, metadata 197 (two skips), model 24, offline 13, playback 103, provisioning 48, provider
  52, security 108, Sports 79, Telegram 240, YouTube 48.
- All mobile-used Android lint tasks and app-mobile assembleDebug passed. The real four-suite live
  smoke rerun passed together.
- Credential scanner 41; CI-downloader 20 rejection + one success fixture; mobile delivery 13; mobile
  upgrade 8; provisioning inspector 4; WebCrypto/provisioning interoperability; shell syntax; pinned
  TDLib verify-only; package/version/signer/ARM64/JNI/native/private-material checks; real retained
  code35→36 upgrade; and git diff --check all passed.
- adb devices -l listed no device. The local build is not installation, launch, Android Keystore,
  VPN, Telegram, provider login, player, playback, or physical UI evidence.

### Exact-head CI and publication failure

- The application commit was pushed and local HEAD, origin/main, and the requested exact SHA all
  matched 25dacbcfc7bb4d01aeb328cef668de1b45663bf2.
- GitHub Actions run 33372822414 targeted that exact SHA. GitHub's check annotation stated:
  The job was not started because an Actions budget is preventing further use. Wrapper validation
  ran zero steps and the dependent mobile build job was skipped.
- This external budget condition is not fixed by changing application code. The run is not CI success,
  and no exact-head code-36 CI artifact exists. The authoritative downloader was not run and the local
  APK was not published as a substitute. Code 35 remains the latest versioned phone Test artifact.

## Permanent decisions and gates

- Sports and all browsing/presentation surfaces remain absolutely spoiler-free. Provider results and
  score-bearing titles/thumbnails never become owner-visible catalog data.
- Canonical MatchIdentity/catalog identity is provider-neutral; source/index/embed/media hosts attach
  as evidence and never own identity. One failing provider never blanks siblings.
- Owner URLs and discovered graph edges never self-authorize. Trust is explicit, exact, encrypted,
  scoped, and revocable. No arbitrary script, credential injection, file access, DRM/auth/paywall
  bypass, pirate index harvesting, media rehosting, or direct-stream extraction was added.
- YouTube remains SmartTube-compatible only and license-gated. No WebView/IFrame/official-app/Google
  UI/Play Services/data-key/competing extractor fallback exists.
- TV and Shield stay frozen until a separately authorized TV phase after owner acceptance of a valid
  mobile candidate.

## Exact next step

Restore GitHub Actions budget availability, then rerun Android CI for exact application HEAD
25dacbcfc7bb4d01aeb328cef668de1b45663bf2 without changing the repository. Only after that exact run
passes may the canonical downloader fetch, reverify, and atomically publish
PrivateMediaTV/Test/private-media-tv-mobile-0.4.17-phone-test.apk while preserving code 35 and older
APKs. Then install code 36 over code 35 without uninstall/Clear Data and execute only the focused
F2C.7.6 checklist in docs/MOBILE_ACCEPTANCE.md. Record observed PASS/FAIL; do not interpret disabled
Website Playback as passed, and do not begin TV/Shield work.

## Continuation instructions

Start from clean application main == origin/main at
25dacbcfc7bb4d01aeb328cef668de1b45663bf2. Preserve all versioned APKs and unrelated shared-memory
work. Never reset/clean/restore/stash/force-push/create another worktree or rebuild TDLib speculatively.
Remain Mobile Test only and use explicit bounded mobile/mobile-used Gradle targets under the global
heavy-build queue. Do not publish code 36 from local bytes or from a non-exact/non-successful CI run.

---

# SUPERSEDED HISTORICAL — F2C.7.5 Final (mobile code 35 published; physical acceptance pending)

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | `funzi7/private-media-tv` |
| Milestone | F2C.7.5 — stable catalog browsing, provider-neutral metadata and sources, SmartTube-compatible boundaries, Israeli provider contracts, Proton Israel access, managed offline, Connections, trailers, and spoiler-free Sports |
| Branch / tracking | `main` / `origin/main` |
| Starting application HEAD | `7ea85b19fa4c07946043adf0d41b3e08f71242f4` (F2C.7.4 / mobile code 34) |
| Final application HEAD | `01f758ee90edcfb6d943fc0f7ba689444ef51dad` — equals `origin/main`; pushed normally, no force |
| Application commit | `01f758ee90edcfb6d943fc0f7ba689444ef51dad` — `Implement F2C.7.5 mobile catalog and provider architecture` |
| Agent-memory starting HEAD | `f886ca82b277bb8c981aa2a69ef005597f54ccc7`; unrelated projects advanced the shared memory repository to `95000a81e92f4e90913d78c8581c37c7b093d1fe` before this final update, without changing this handoff |
| Exact-head Android CI | run `33302984143` — **SUCCESS** for final application HEAD; wrapper validation plus one mobile/mobile-used job; no TV/Shield job or artifact |
| Mobile identity | `com.funzi7.privatemediatv.mobile`, `0.4.16-phone-test`, versionCode 35; updates code 34 in place |
| TV identity | `com.funzi7.privatemediatv`, `0.6.11-f2c71`, versionCode 34 — no direct `app-tv` file, TV task/build/test/lint/version/artifact/publication/delivery, or Shield action; additive shared contracts changed and TV behavior is unvalidated |
| Persistence | Catalog v12→v13; territory v3→v4; YouTube index v1→v2; new YouTube account-feed v1, broadcaster index v1, and supplemental catalog metadata/crosswalk/evidence/search/trailer v1; UserState v7 and Local Library v3 retained |
| Development signer SHA-256 | `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` |
| Delivered exact-head CI APK | 65,158,296 bytes; SHA-256 `1ae7f3a6d4e560eefb69479dcac33df389bf55c823e0039e666d0866a3a7890b`; ARM64-only; TDLib JNI SHA-256 `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f` |
| Delivered path | `/storage/emulated/0/Download/PrivateMediaTV/Test/private-media-tv-mobile-0.4.16-phone-test.apk` — exact CI bytes, regular file, same-version target replaced atomically |

## Truthful physical code-34 owner evidence

**PASS:** Fallout no longer fabricates S02E09; Continue Watching no longer fabricates
`טרם הוכרז` cards; the real past-date E06 is no longer explicitly `טרם שודר`; Deep found one
correct E06 immediately and another correct E06 from another source group; reopening Sources later
showed the two correct persisted files and not the earlier unrelated `סוכן תרבות`; immediate Series
Eye, one-press Back/icon, Downloads indicator, pull refresh, high `חדש בישראל`, mobile-only CI, and
the recovery mechanism remain PASS.

**FAIL/new requirement evidence:** E06 still lacked useful episode information and a still; FAST
initially surfaced unrelated `סוכן תרבות`; FAST missed real E06 files in two configured Known Sources;
Known priority/catch-up remained insufficient; a catalog title disappeared; Home rows and Continue
Watching jumped; an already-opened/CW title could block on TMDB too long; and Israel history remained
sparse at about five titles. The owner additionally required full category grids/taxonomy/season
count, title-first multi-provider architecture, SmartTube-compatible YouTube/Kan/account/trailers,
Kan/12+/Reshet official provider contracts, Proton Israel, authoritative history, provider-aware
downloads and encrypted vault, unified Connections, provider-neutral metadata/non-TMDB titles, and a
spoiler-free Sports domain.

These are physical code-34 facts. Host tests, CI, and APK publication do not convert them into a
physical code-35 PASS. **Physical code-35 acceptance is pending.**

## Root causes established

1. Home rows mixed mutable provider ordering, page completion, enrichment, and background refresh in
   one presented list. Page/branch completion could prepend or replace items under the viewport.
   Continue Watching also had lead-change snap behavior rather than an interaction-owned anchor.
2. Partial refresh/branch failure could be treated as authority to shrink a cached row; Details could
   replace stale content with a blocking reload instead of rendering cache first and refreshing SWR.
3. FAST could treat a weak generic POSSIBLE/local alias as sufficient before completing configured
   Known/manual phases, so an unrelated result could suppress the real Known Source copies.
4. TMDB identity and whole-record presentation were too closely coupled. Incomplete TMDB episodic
   presentation lacked field-level exact-source reconciliation, and programs absent from TMDB had no
   safe provider-neutral catalog foundation.
5. Forward Israel absence→presence monitoring could only accumulate history from installation time;
   no authoritative, strong-ID historical import path existed.
6. Source discovery and capability modeling were Telegram-centric. Independent physical providers,
   provider failure isolation, media role, stream/offline/export rights, and catalog identity needed
   separate contracts.
7. Remote download ownership and physical storage were not sufficient for provider failover and an
   app-private encrypted, seekable, integrity-checked managed copy.
8. External configuration was fragmented and lacked one status/setup/replacement surface. Candidate
   secret/config replacement also needed validate-before-atomic-publish semantics.
9. Sports lacked canonical Competition/Season/Match identity and a centralized spoiler firewall;
   raw provider titles, thumbnails, and score fields could not be trusted as presentation.
10. Security review found that account sign-out cleanup had to remain independent across provider,
    feed-cache, Keystore, and cursor state; unreviewed/manual WebSource data must never self-authorize;
    descriptor-wide playback headers could cross redirects; and device authorization needed an exact
    browser endpoint allowlist.

## Implemented candidate

### Catalog UX, state, and cache

- Stable keyed row epochs now make existing order immutable, merge pages append-only, enrich keyed
  cards in place, retain stale valid content on partial failure, and preserve exact key/pixel anchors
  across explicit replacement. Continue Watching captures/restores its interacted anchor through
  Details/player round trips and chooses a deterministic neighbor only if the anchor is removed.
- Every catalog Home heading opens an additive vertically paged category grid. Deterministic query
  identity covers family/media/sort/provider/broadcaster/genre/origin semantics; invalid combinations
  remain unavailable rather than fabricated. Query pages dedupe by identity, preserve prior pages on
  retry/failure, and restore per-query grid position and Home position.
- TV cards reserve a season-count line from first render and use `עונה אחת` / `N עונות`; movies have
  no season line and unknown never displays zero. Visible enrichment is bounded, coalesced, cached,
  and never changes card geometry/order.
- Resident/persistent Details, season, episode, image, season-count, provider, personal and recent
  metadata render stale-first. Bounded hot queues and identical-request coalescing provide SWR without
  navigation reset or row reorder. Exact aired episodes get bounded direct reconciliation.

### Provider-neutral catalog and metadata

- PMTV now owns canonical movie/program/season/episode/edition entities, program-type semantics, a
  conservative external-ID crosswalk, durable owner mappings, field-level provenance/conflicts, and a
  unified local metadata index. Existing TMDB stable keys remain compatibility identities, so My List,
  progress, Continue Watching, downloads, bindings, and sources are not destructively re-keyed.
  Non-TMDB titles are valid; title-only/fuzzy merge is forbidden and explicit identity contradiction
  hard-rejects.
- TMDB remains a major discovery/metadata provider, not universal truth. Central merge policy retains
  provider/record/time/locale/authority evidence and does not let stale incomplete structure replace
  stronger complete evidence.
- TVmaze production wiring is deliberately narrow: exact external-ID show lookup and exact
  episode-by-number/date fallback only from an existing exact crosswalk, with bounded rate/429 backoff,
  cached-first stale retention, public-HTTPS image safety, source-link attribution, and CC BY-SA /
  ShareAlike presentation. No live TVmaze result is claimed.
- TheTVDB v4 connection/provider boundary supports project-key login token, optional subscriber PIN,
  license/attribution status and safe replacement, but remains disabled pending approved real project
  access/license. Its API grant is not treated as artwork/trailer/programming rights. EDB and Israel
  Film Center remain disabled boundaries pending an official documented API/license or written
  authorization; they are not scraped.
- Exact official/secondary episode evidence may enrich missing title/still/synopsis/duration and only
  a missing date, with field provenance. It cannot change TMDB/canonical series, season, or episode
  coordinates or overwrite conflicting stronger evidence. The aired E06 enrichment path is a
  deterministic regression target, but live upstream repair is not claimed.

### Search and independent sources

- Search Engine V2 no longer blocks on a metadata-index prepass. FAST stops locally only for strong
  bound/automatic evidence, completes all unresolved Known/manual work before the independent normal
  pool budget, keeps multiple Known physical copies, rejects explicit wrong episodes, and reuses
  persisted Deep results only after current selected/indexed exact validation.
- One catalog item can retain simultaneous Local Library, verified managed, Telegram, SmartTube-
  compatible YouTube, Kan VOD, 12+/mako, and Reshet 13 resources. Provider/resource identity is
  preserved; one provider failure never removes siblings; the provider never owns catalog progress.
- Kan/Keshet/Reshet adapters have isolated checkpoint/index/classification/matching/manual-mapping,
  metadata-enrichment, playback/offline/geo, and concurrent merge contracts. All production operational
  capabilities remain false until documented reusable endpoints or written authorization plus playback,
  auth, DRM, offline-rights, and site audits exist. There is no live archive/stream/download claim,
  arbitrary scraper, paywall bypass, auth bypass, or DRM bypass.

### SmartTube-compatible YouTube and trailers

- The only approved YouTube architecture is a SmartTube-compatible/derived provider behind native
  PMTV UI. Public archive/search/resolver, exact episode/movie matching, Kan checkpoint/index,
  concurrent source merge, adaptive capability projection, account/session/feed/channel/search/action
  contracts, and deterministic fixtures are isolated in `core-youtube`.
- Exact upstream revisions/notices are recorded. SmartTube is MIT; current MediaServiceCore and
  SharedModules revisions did not expose a verified published license, so their code was not copied and
  the production backend fails closed until license/provenance is resolved. No competing extractor was
  invented.
- There is no YouTube Data API key, Google SDK/Play Services, official app launch, embedded website,
  IFrame/WebView player, Google UI/controls, telemetry, yt-dlp, or YouTube download capability.
  SmartTube account device authorization is optional and uses only exact reviewed HTTPS `/activate`
  or `/device` endpoints with no alternate path, query, fragment, user-info, or explicit port.
- Account sign-out independently attempts remote/provider removal, personal feed-cache deletion,
  Keystore session deletion, and all in-memory cursor cleanup; one failure cannot skip later cleanup
  and only a safe aggregate result is presented.
- Details projects exact TMDB video evidence into a nonblocking cached Trailer button/list. Multiple
  trailer/teaser resources remain distinct, localized/official ranking is deterministic, no autoplay
  occurs, and title progress is untouched. Broadcaster supplemental discovery and SmartTube public
  lookup/playback remain authorization/license gated rather than falsely live.

### Israel access, history, connections, and offline

- Native Accounts & Connections unifies SmartTube account, Proton Israel, TMDB, TVmaze, TheTVDB,
  historical Israel, and optional secondary episodic status/setup. Provider-specific forms validate
  and encrypt candidates before atomic replacement; a failed replacement preserves the previous
  working value. Need-based prompts route to the relevant page, and connection status is never treated
  as content success.
- Proton setup accepts owner-generated WireGuard configuration by paste/manual fields or optional SAF,
  never Proton credentials. The official maintained WireGuard Android dependency and Apache-2.0 notice
  are pinned. Config is Keystore-backed/app-private; Android `VpnService.prepare()` consent, exact
  mobile-package allowlist, on-demand/ref-counted leases, grace stop, direct-first geo retry exactly
  once, and logout/disable cleanup are implemented. No real Proton config/tunnel/content success is
  claimed.
- Optional authoritative Israel history imports only strong external IDs into the existing territory
  evidence store, preserves forward history, dedupes provider arrivals, and reports the provider's
  truthful maximum documented window (currently at most 31 days). First observation, release year,
  and fuzzy title never become arrival dates. Live credentialed backfill is pending.
- One download coordinator selects only exact, lawful download-capable sources and can fail over before
  material progress without changing catalog identity. Stream/offline/auto/offline-play/export flags
  are independent; unsupported DRM and YouTube remain non-downloadable.
- The managed app-private Offline Vault uses random per-resource keys wrapped by Android Keystore,
  authenticated bounded chunk/segment encryption, integrity manifests, interruption recovery,
  decrypt-on-read seeking through the player, one managed copy per exact catalog item, and no plaintext
  temp/public MediaStore/export. Provider app-private encryption is not a DRM bypass.
- The exact CI APK packages the complete WireGuard Apache-2.0 notice with SHA-256
  `e49563a755120b7a09b600ee7d1de8526fb60a02d96f5f04dba6885a71334717`; packaged `libwg-go.so`
  SHA-256 is `68730e8c81b613113249574e22838fd6ce9b1c4da2be2f5fe7c71d651e32b005`, matching the pinned
  reviewed dependency.

### Spoiler-free Sports

- Sports is Competition → Season → strong provider-neutral MatchIdentity → zero or more independent
  LIVE/FULL_REPLAY/EXTENDED_HIGHLIGHTS/HIGHLIGHTS/CLIP resources. Editable/reorderable defaults are
  Beitar Jerusalem, Manchester United, Real Madrid and the Israeli Premier League, Premier League,
  LaLiga, and UEFA Champions League.
- Home order is permanently personal rows → Sports → `חדש בישראל` → generic discovery. Sports remains
  available without a live match; relevant live matches lead and favorite-team live matches lead that
  set. Tapping always opens spoiler-free Match Details before explicit source choice.
- A centralized spoiler firewall generates neutral fixture titles/cards and forbids scores, winners,
  events, result summaries, score-bearing provider titles/thumbnails, notifications, accessibility,
  Continue Watching, and downloads presentation. Strong MatchIdentity handles rescheduling and prevents
  fuzzy duplicate fixtures.
- Source contracts distinguish PMTV `NATIVE_STREAM` from lawful non-YouTube `WEB_SOURCE`, media role,
  official/third-party/manual provenance, health, login/region/DRM/subscription, and sibling failure
  isolation. SmartTube never uses WebView.
- `core-sports` currently has provider interfaces and in-memory references only. The verified IPFL
  SmartTube descriptor is `BOUNDARY_ONLY`, with every live capability false. No Sportmonks credential,
  Israeli coverage claim, PL/LaLiga/UEFA schedule/live backend, protected archive integration, scraper,
  or live source claim exists.
- App-mobile includes native Sports/Match Details/Settings, app-private ordered preferences, exact-match
  encrypted manual HTTPS attachment, shared progress/player/Proton lease boundaries, and a gated
  isolated Website Playback surface. Production has no reviewed Web-provider trust resolver, so an
  unreviewed or manual URL fails before VPN/session/event/WebView. A future authorized adapter must
  attest exact HTTPS origins, confined redirects, and no YouTube embed; the GET-only policy blocks
  service workers, popups, YouTube, unsafe requests, and cross-origin navigation. No live Web playback
  is claimed.
- Adaptive descriptors reject non-empty request headers. A future licensed header-bearing provider
  must use origin-scoped redirect-aware transport rather than Media3 descriptor-wide defaults.

## Migration and preservation evidence

- Catalog 12→13 adds provider-neutral source/offline ownership state while preserving all prior rows.
- Territory 3→4 adds authoritative historical provider evidence/sync state and retains all forward
  observations.
- YouTube index 1→2 plus new account-feed v1, broadcaster index v1, and supplemental metadata v1 are
  additive. Existing TMDB keys seed compatibility/internal IDs without rewriting My List, likes,
  watched/progress, Continue Watching, downloads, local/source bindings, or cache ownership.
- WireGuard/session/API/content keys remain in separate Keystore-backed app-private envelopes, never
  Room/plain preferences. No destructive migration, uninstall, Clear Data, or owner-data deletion was
  used or assumed.
- Migration tests from the physical current schemas and required chained tests passed.

## Validation evidence

### Local mobile/mobile-used validation

- All substantial Gradle work ran through `/root/work/bin/heavy-run -- timeout ...`; no root aggregate
  `test`/`lint` and no `:app-tv:*` task ran.
- Final explicit 15-target unit-test matrix: **1,946 discovered, 1,944 passed, 0 failures/errors, 2
  intentionally disabled opt-in live-TMDB smokes**. Module totals: app-mobile 596; broadcaster 26;
  catalog 402; Israel access 27; Local Library 56; metadata 197; model 24; offline 13; playback 103;
  provisioning 48; provider 32; security 100; Sports 41; Telegram 233; YouTube 48.
- Full changed mobile/mobile-used Android lint matrix passed: app-mobile, broadcaster, catalog,
  Israel access, Local Library, metadata, offline, playback, provisioning, security, Telegram, and
  YouTube. `:app-mobile:assembleDebug` passed.
- Focused hardening: Sports service/Web 15/15; Sports + YouTube account/sign-out combined 24/24;
  sign-out cleanup 9/9. Stable snapshots, category navigation, hot cache, FAST Known priority,
  multi-provider merge, migrations, metadata provenance/E06, trailers, Connections, WireGuard leases,
  vault encryption/seeking/recovery, and spoiler invariants all have deterministic tests.
- Harnesses passed: credential/private-material scanner 41; exact-head CI downloader 20 rejection + 1
  success fixture; mobile delivery 13; mobile upgrade 8; provisioning inspector 4; LAN/browser crypto
  and provisioning interoperability; shell syntax; pinned official TDLib verification.
- Local APK package/version/signer/ARM64/JNI/native-layout/private-material checks and retained physical
  code34→code35 update verification passed. `git diff --check` passed before commit. `adb devices -l`
  listed no device.

### Exact-head CI and authoritative publication

- Android CI run `33302984143` completed **SUCCESS** for exact final HEAD
  `01f758ee90edcfb6d943fc0f7ba689444ef51dad` in 19m46s. It passed wrapper validation, official
  pinned TDLib verification, mobile delivery/security/upgrade harnesses, browser crypto, Development
  signer reconstruction/verification, explicit mobile/mobile-used tests, mobile lint, signed ARM64
  code35 assembly, package/version/signer/JNI verification, checksum/metadata creation, artifact upload,
  and runner signing-material cleanup. There was no TV/Shield job or artifact.
- The normal downloader selected exact run/artifact
  `private-media-tv-mobile-apk-01f758ee90edcfb6d943fc0f7ba689444ef51dad`; its first network
  transfer was aborted before verification at about 30 MB and did not replace the destination. The
  same artifact ID was then downloaded with authenticated resumable/retrying transport, ZIP-tested,
  required to contain exactly the APK/checksum/metadata tuple, and checked against commit, package,
  version, ABI, signer, APK hash, and TDLib hash before invoking the same atomic delivery helper.
- Exact CI artifact metadata and post-copy verification agree:
  package `com.funzi7.privatemediatv.mobile`; `0.4.16-phone-test`/35; signer
  `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0`; ARM64-only; TDLib JNI
  `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f`; size 65,158,296; APK
  SHA-256 `1ae7f3a6d4e560eefb69479dcac33df389bf55c823e0039e666d0866a3a7890b`.
- Final delivered path:
  `/storage/emulated/0/Download/PrivateMediaTV/Test/private-media-tv-mobile-0.4.16-phone-test.apk`.
  It is byte-identical to the exact CI APK. The existing code34 versioned file remains; no latest,
  previous, old-version rotation, or TV file was created/deleted. Real code34→delivered code35
  package/signer/version/ARM64 upgrade verification passed.
- No installation, launch, account authorization, provider live response, VPN tunnel, playback,
  download, WebSource, phone UX, TV, Shield, or physical code35 acceptance is claimed.

## External configuration and live gates

- **No YouTube Data API key exists or is required.** Public/account behavior uses only the approved
  SmartTube-compatible boundary. The owner may optionally complete SmartTube-style account device
  authorization after the unresolved upstream component licenses/provenance are cleared and the
  production backend is enabled.
- The owner still needs to import/paste a Proton-generated Israel WireGuard config and grant Android
  VPN consent for physical VPN validation. Never store the config/private key outside the secure app
  envelope or this device.
- Historical Israel live backfill needs the owner's supported-provider API credential and truthful
  coverage validation. The provider must never claim more than its documented available window.
- TheTVDB needs approved project access/license and its project credential (plus subscriber PIN only
  if genuinely required). Any other secondary episodic provider needs a separately approved lawful
  credential/integration. TVmaze needs no credential but still needs a redacted live/physical
  attribution and ShareAlike check.
- Kan/Keshet/Reshet need documented reusable official interfaces or written authorization and a full
  auth/playback/DRM/offline-rights audit before operational capabilities can be enabled.
- Sports needs a real provider credential/coverage audit (including Israeli Premier League coverage),
  authorized official media/source evidence, any legitimate provider account/subscription, and a
  reviewed exact WebSource trust/origin policy before a live claim. VPN does not replace entitlement,
  authentication, subscription, or DRM.
- Physical code35 acceptance must validate the original code34 failures plus category position,
  season counts, cache-first reopen, provider-source concurrency, E06 metadata, Connections, optional
  configured providers, vault behavior, Sports order/spoiler safety, and no-jump invariants. Record only
  observed results.

## Permanent decisions

- One provider-neutral internal catalog owns movie/program/season/episode/edition/match identity.
  Multiple metadata providers and multiple independent physical source providers attach to it. TMDB
  and Telegram are providers, not product identity or universal truth.
- SmartTube-compatible provider capability behind PMTV-native UI is the only YouTube architecture.
  Never reintroduce YouTube WebView/IFrame/Google product UI, official-app launch, Play Services,
  Data API owner key, telemetry, competing extractor, or inferred download permission.
- Home ordering is personal rows → Sports → `חדש בישראל` → generic discovery. All browsed rows/grids
  use stable keyed anchors and never reorder under enrichment/background paging.
- Sports browsing is absolutely spoiler-free and opens Match Details before explicit source choice.
  YouTube never uses the lawful non-YouTube WebSource surface.
- One shared progress/watch-state model, one download coordinator, one app-private encrypted Offline
  Vault, and one app-only Proton lease serve all providers. Capability and entitlement remain separate;
  streamable never implies downloadable/exportable and app encryption never bypasses DRM.
- Passive Home/category browsing never performs Telegram/YouTube/playable-source discovery. A title
  with zero known sources remains valid. Explicit source searches run independent providers
  concurrently and preserve alternative physical copies.
- TV/Shield work starts only in a separately authorized phase after mobile code35 physical acceptance.

## Approved future backlog (not implemented in F2C.7.5)

1. **A — lawful SmartTube/YouTube managed offline:** only if future current upstream/terms evidence
   explicitly permits it; reuse the encrypted Vault, keep stream/offline/auto/offline-play/export flags
   separate, no public MP4/export assumption, yt-dlp, or buffering-as-download.
2. **B — new-episode notifications:** owner opt-in, optional per-title control, provider-neutral real
   episode evidence, exactly-once dedupe, exact deep link, quiet hours/channels, no fabricated episode,
   and coexistence with auto-download status.
3. **C — HOT and yes official VOD:** isolated first-class metadata/archive/source/playback/offline/geo
   adapters under documented lawful interfaces, exact identity/provenance, and no DRM/auth bypass.
4. **D — FreeTV/additional Israeli providers:** investigate only maintainable lawful official paths;
   document blockers instead of arbitrary scraping.
5. **E — OMDb ratings:** secure Connections credential, exact external-ID matching, cached provenance,
   provider isolation, and IMDb labels only for real lawful IMDb/OMDb-backed data; never relabel TMDB.
6. **F — Wikidata/franchise/same universe:** real strong-ID structured population with provenance and
   explicit collection/franchise distinction; never title-similarity inference.
7. **G — private multi-device sync:** encrypted/authenticated single-owner offline-first phone/TV state
   sync with field-separated conflict semantics; never send Telegram sessions/media, provider secrets,
   or device-local download bytes.
8. **H — Source Inspector structured episode lookup:** **already implemented / old TODO superseded** by
   bounded selected-source index lookup for `S01E06`, `1x06`, and supported Hebrew markers with exact
   contradiction rejection. Preserve it; do not reintroduce whole-history scanning.
9. **I — Israeli live/archive ingestion wording:** old generic “operator ingest” is **superseded** by
   named provider-neutral adapters: authorization-gated Kan/Keshet/Reshet, then future HOT/yes/FreeTV.
10. **J — F2D advanced source picker:** richer provider/variant ranking, external subtitle/audio
    sources, language preferences, source technical details, and final playback integration. Embedded
    tracks are not external-source aggregation.
11. **K — final TV/Shield application:** TV Home/details/series/category/Sports/account/provider/player/
    offline parity, D-pad-first focus restoration, 10-foot UX, native Connections, subtitles/audio,
    factual TV versioned APK delivery directly under `PrivateMediaTV/`, and physical Shield acceptance.

Sports provider live integrations, official provider authorization, SmartTube upstream license
resolution, configured account/VPN/history/metadata credentials, and physical code35 checks are current
gates, not silently completed future work. Historical unchecked code-N commit/publish/acceptance tasks
are **SUPERSEDED HISTORICAL**, not physical PASS evidence and not instructions to publish old builds.

## Exact next step

Install the exact delivered code35 APK over code34 without uninstall or Clear Data and execute the
F2C.7.5 procedure in `docs/MOBILE_ACCEPTANCE.md`. Validate only with owner-provided credentials/config
through Accounts & Connections, preserve all secrets on device, and record observed PASS/FAIL. Do not
start TV/Shield work, enable gated providers, infer live access from fixtures, or claim code35 physical
acceptance before that evidence.

## Continuation instructions

Start at application HEAD `01f758ee90edcfb6d943fc0f7ba689444ef51dad` on `main` ==
`origin/main`. The application worktree was clean after publication. Do not reset/clean/restore/stash,
force-push, create another worktree, or rebuild TDLib speculatively. Preserve every older factual
versioned APK and unrelated shared-memory change. This remains Mobile Test only: never build/test/lint/
version/publish `app-tv` or deliver Shield. Use explicit bounded mobile/mobile-used Gradle targets under
`/root/work/bin/heavy-run`. The authoritative APK is the exact-head CI file and hash recorded above;
physical code35 acceptance remains pending.
