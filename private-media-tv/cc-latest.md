# private-media-tv — code45 continuation handoff (Claude Code)

## Identity

- Repository: `private-media-tv`, branch `main`, tracking `origin/main`.
- Starting application HEAD: `5a138337a3473248e23649befef7ede2cfa6a3e9` (code44).
- Final application HEAD: `563fd1347a1909cca6187d8c98dacf82eeb31baa`.
- Mobile Test target advanced exactly once: `0.4.26-phone-test` / versionCode 45.
- TV/Shield remains frozen at `0.6.11-f2c71` / 34 and was not edited, built, tested or released.

## What this round was

A continuation, not a new milestone. A previous Codex session stopped mid-work leaving a large
uncommitted worktree; its quota was exhausted, so implementation continued in Claude Code. Nothing
was discarded and no worktree was bypassed: the existing work was recovered, independently
re-validated, then extended.

The recovered tree was verified green before any new edit (all 16 mobile-used test modules, 352
actionable tasks, 0 failures), which confirmed the previous session's own claim.

## Owner physical evidence carried into this round

**PHYSICAL PASS (preserved, must not regress):** the YouTube account connects and is recognised;
both YouTube catalog rows display; selecting a YouTube video starts real playback in the shared
Media3 player. These supersede an earlier account-lookup PHYSICAL FAIL for exactly those paths.

**PHYSICAL FAIL (addressed this round):** playback ran at effectively the lowest available quality.

## Quality defect — diagnosed from evidence, not assumption

Per-client InnerTube probes on the current host:

| client identity | status | adaptive formats | with direct URL | ciphered | top height |
| --- | --- | --- | --- | --- | --- |
| ANDROID | OK | 39 | 0 | 0 | 2160 |
| WEB_SAFARI | UNPLAYABLE | 0 | 0 | 0 | — |
| ANDROID_VR | LOGIN_REQUIRED | 0 | 0 | 0 | — |
| IOS | OK | 32 | 32 | 0 | 2160 |

The collapse is at the provider admission stage, upstream of selection and of Media3. The ANDROID
identity still publishes its ladder, but those representations now carry neither a plain URL nor a
signature cipher (server-side adaptive only), so the direct-format admission correctly declined all
39; the two other ladder entries had gone stale. One muxed 360p rendition survived.

Refuted by repository-wide inspection: track-selector caps, viewport constraints, bandwidth/data
limits, an incorrect mobile profile, and missing audio/video pairing. No such constraint exists
anywhere in the codebase, and the selection comparator already ordered highest-first.

Correction: the maintained official IOS identity leads the ladder; its adaptive representations
arrive as plain unciphered HTTPS URLs with complete byte-range evidence. Nothing is deciphered,
attested, re-signed, re-hosted or transcoded, and SABR, cipher, DRM and login bypasses remain
rejected. A production resolve moved from `total=1 maxHeight=360` to
`total=33 video=22 audio=10 maxVideoHeight=2160`.

The resolved ladder is described to the shared player as one derived on-demand DASH manifest (32
representations in a production build), validated in tests against the exact Media3 parser that
consumes it. A suspected blocker — that IOS-minted media URLs need a matching User-Agent — was
tested against the live host and refuted: HTTP 206 range responses with and without that header.

Recorded trade-off: adaptive YouTube leaves the progressive read-through/forward-fill cache lane,
exactly as HLS/DASH already does.

## Other behaviour landed

- Standalone public videos join the one canonical progress/Continue Watching model through a
  provider-neutral `PublicVideo` identity keyed by the opaque digest the video domain already used.
  No second watch store, no provider-specific Continue Watching row. Existing 30-second meaningful
  floor and completion rule reused unchanged; completion removes the card; reopening advances one
  row. Optional remote account reporting no longer suppresses the local authoritative record.
- Explicit Watch Later added as its own field through additive user-state schema 11→12, at the
  owner's decision, so an already-watched item can be re-added while the forward-only Want lifecycle
  keeps refusing a Want re-add. Watch Later is never conflated with Continue Watching.
- Unmetered transports open each session at the best rendition the renderer reports it can decode;
  metered, offline and unknown transports keep the existing conservative behaviour. The choice is
  per-loaded-source, never persisted, never overrides a manual pick, and is released back to
  adaptive after a sustained stall so it cannot strand playback.
- Sports LIVE consumption corrected: a momentary LIVE view that merely straddles the provider's
  FINISHED transition can no longer consume a match or reveal its result. Two tests had asserted the
  incorrect behaviour and were corrected with it.

## Validation actually run

- All 16 mobile-used test modules, scoped Mobile lint and `assembleDebug`: BUILD SUCCESSFUL, 622
  actionable tasks, 0 failures. No root aggregate and no app-tv task ran; all heavy work used the
  installed global heavy-build queue.
- APK verification, credential/private-material scan (62 cases), phone-delivery harness (15 cases),
  CI downloader harness (20 rejection + 1 success), upgrade verifier (8 cases): all passed.
- `git diff --check` clean; working tree clean at the final HEAD.
- Exact-final-HEAD CI run `34737890707` on `563fd1347a1909cca6187d8c98dacf82eeb31baa`: **success**
  (wrapper validation and the TDLib/tests/lint/signed-APK job both succeeded). A superseded earlier
  run for the previous commit was cancelled. No check was weakened to obtain green.

## Artifact

- Authoritative exact-head CI artifact published to both required phone locations, both created.
- Package `com.funzi7.privatemediatv.mobile`, `0.4.26-phone-test` / 45, arm64-v8a only.
- APK SHA-256 `d58767f68c2c6984e714a69105e710027719de3ab13f984cbb91b92af84428d5`, 260,049,796 bytes.
- Development signer certificate SHA-256
  `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0`.
- TDLib JNI SHA-256 `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f`. This is the
  CI-built TDLib and deliberately differs from the locally built candidate's
  `21d59ebfeba4edc62ea74cefaa79b08650e796530f3d5e57804105cc44cb65dc`; the artifact verifier accepted
  the CI value. They are not claimed to match.
- Installed in place on the authorized device. Retained first-install history confirms no uninstall
  and no data clear; the connected account and owner state were preserved throughout.
- All previously delivered versioned APKs remain present.

## Physical status

- **PASS:** in-place upgrade and package identity; the three owner-confirmed YouTube paths above.
- **Device capability evidence (not rendered-resolution evidence):** the authorized device declares
  hardware AV1 and VP9 decoders with a 96x96–8192x8192 limit, so the 2160p rungs are genuinely
  decodable and the highest-playable default resolves against a real capability.
- **PENDING owner acceptance:** actually rendered/selected resolution during playback; partial
  progress entering Continue Watching; resume at the correct position; completion removing the card;
  Mobile Data remaining conservative; and the owner-facing action surfaces.

## Remaining work

- The owner-facing Like / Watch Later / Not Interested action strip is **not implemented**. Its
  storage, schema, semantics and hybrid local-first contract are in place and recorded as PENDING;
  it is not claimed done.
- Sports Programs still shares one bounded request budget across listing pages and item fetches with
  no cross-refresh cursor, so later pages can still be starved. Rows no longer collapse to one.
- LiveBall reconciliation is layered rather than one canonical function, and the alias-master merge
  runs only at load; runtime projection dedupe covers the visible case.
- Production Live Channels, Israel broadcast assignment and official Sports YouTube rights registries
  remain intentionally empty/fail-closed: the audits established no lawful stable automated feed,
  authorized fixed stream or defensible territory grant.

## Future backlog (not implemented)

Local PMTV recommendation learning from retained truthful signals; owner-private IPTV provider;
Israeli operator/VOD catalogue integrations (all currently blocked for lack of a lawful documented
public machine-readable contract).

## Review provenance

`review_provider=claude_code_fallback`, `reason=codex_quota_unavailable`. An independent reviewer
that did not perform the implementation reviewed the complete task diff before finalization. Two P1
findings were real and fixed — side-loaded captions dropped on the manifest route, and an opening
quality choice that could strand playback by removing lower rungs from adaptive selection (a defect
introduced by this round's own work). Unresolved P1 = 0, unresolved P2 = 0. This was not a Codex
review and is not recorded as one.

## Privacy

No credentials, tokens, session material, device serial, pairing code, Telegram identity, private
source URL, private media title or screenshot appears in this record. Public certificate and
artifact hashes only.
