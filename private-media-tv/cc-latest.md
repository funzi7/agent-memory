# private-media-tv — code45 continuation handoff (Claude Code)

## Identity

- Repository: `private-media-tv`, branch `main`, tracking `origin/main`.
- Starting application HEAD: `563fd1347a1909cca6187d8c98dacf82eeb31baa`.
- Final application HEAD: `8e1f5a8a79674fa459e1c1b6900338a11d9cc173` (19 commits, normal push, no force).
- Mobile Test target unchanged: `0.4.26-phone-test` / versionCode 45. No version bump, no new milestone.
- TV/Shield frozen at `0.6.11-f2c71` / 34: `git diff 563fd13..HEAD -- app-tv` is empty.

## What this round was

A continuation of the SAME code45 milestone, driven by six owner corrections raised mid-session. Each
is recorded below with what was delivered and, where something does not work, that it does not.

## Owner corrections and outcomes

1. **"not both team are showing properly … untd without a position in the table"** — DELIVERED, device
   verification deferred. The previously wired provider's free table endpoint returns exactly 5 rows for
   every key/league/season and ignores every paging parameter; its season-events endpoint caps at 15
   events, so no table could be derived from results either. The owner then named **365scores** as the
   football data source. A bounded, credential-free adapter now supplies the complete table. Verified live
   against the owner's own fixture: full 20-row table, the missing participant at place 13, and a leading
   five identical to the other provider's published prefix. See
   `~/.claude/projects/-root-work-private-media-tv/memory/pmtv-football-data-and-spoiler-gate.md` for the
   route, the four competition ids, and the spoiler caveat below.
2. **"take from 365scores also all the data available … pre match, during match … post match"** — only the
   league table is implemented. The rest was inspected and recorded as the next increment with its
   endpoints (`/web/game/?gameId=`), deliberately NOT half-built at a milestone close. Nothing the owner
   can currently see regresses: the live minute already comes from the canonical kickoff and
   score/statistics/events already come from the existing provider behind the same reveal gate.
3. **"why theres 5 liveball sources? liveball.sx is only one source"** — DELIVERED and verified on device.
   Discovery already issued one query per fixture; the registry SUMMARY was what read as five sources. It
   now reads `מקור אחד · N עמודי משחק שמורים` with a line stating the site is the source and each game's
   page is found automatically. Another family still shows its own provider/resource counts, so the change
   is scoped to a same-origin known family. No saved profile, role or binding was folded away.
4. **"liveball site is with spoilers, no spoilers … unless i watched"** — DELIVERED. Opening a provider
   match page for a LIVE or FINISHED fixture the owner has not watched requires one explicit acceptance,
   held ONCE per match and consulted by all FOUR routes to that page. The first implementation gated only
   one of them; the other three were one-tap reveals.
5. **"i imported a link and its shows to open in a browser"** — EXPLAINED, not fixable as asked. Verified
   across the whole match lifecycle — before kickoff, at half time, and after a finished match — that the
   provider's page carries no media URL, no player initialization and no embed at any point: the player is
   assembled at runtime by an obfuscated loader. PMTV's resolver binds a page that plainly carries a
   playable blob, so there is nothing to bind. A website-only source now states WHY per fixture state.
   Deliberate boundary, recorded so it is not revisited by accident: no obfuscation-defeating extractor.
6. **"thumbnails … needs to be the same and to add more details like name channel, num of views"** —
   geometry DELIVERED (one shared card width); the byline **DOES NOT WORK on the owner's account** and is
   recorded as an open FAIL, see below.

## Open FAIL carried forward

**The channel name and view count do not appear on the owner's real account response.** The model field,
cache column, schema v3 migration with an explicit 2→3 step, the shared byline helper and the rendering on
all three surfaces are implemented and unit-tested, and the parser feeding the YouTube Home rows IS the one
that was extended. On device, after a refresh that demonstrably fetched new items, no card showed the line —
including a newly fetched item, so it is not a stale-cache effect. Conclusion: that account's renderer does
not carry the label under `longBylineText` / `shortBylineText` / `ownerText` / `viewCountText` /
`shortViewCountText`. Next step is to capture the real response for those rows and extend the key set to the
shape it actually uses. A label must never be synthesised and an opaque channel id must never be rendered in
its place, so the current behaviour — render nothing — is the correct interim state. Tracked as TODO C45-20.

## Review process, and what it cost

The primary reviewer was unavailable (usage limit until Sep 19), so the documented Claude fallback ran
fail-closed. **Nine rounds.** Every finding was fixed or explicitly recorded; none was deferred silently.

Findings worth remembering because they were introduced BY earlier fixes in the same session:

- the spoiler gate covering one of four affordances;
- a coverage-aware capture guard that let retries starve never-captured fixtures out their bounded slots,
  and a first capture that burned the fixture's only retry while it was still UPCOMING;
- the Sports Programs rotation cursor, which took **five** designs. A per-pass index, an entry identity, a
  monotone count and a hole-capped window position each starved some entry forever. The settled design is a
  position in the profile's FIXED listing window with per-page observation. Do not "simplify" it back.

Two test guards I wrote were proven weak under mutation and rebuilt until the mutation fails them. One test
claimed to guard an internal branch it never reached; it now states what it actually covers.

**The most valuable technique**: rather than keep answering one reported configuration at a time, the
rotation was modelled faithfully in a scratch simulator and brute-forced over 345 configurations with TWO
metrics separated — a stall (no item request across forty refreshes while work is visible) and a starvation
(an entry still reachable late that was never inspected). That found two starvations the reviews had not, and
settled a policy choice I had earlier made wrongly because a crude metric counted entries on a permanently
dead page as "starved". Reach for this before a sixth review round.

## Corrections I had to make to my own earlier claims

- **`live=false` does not exclude a running match.** The code comment, the ADR and a test all asserted it
  did. Verified false during the owner's own match. The spoiler contract rests on the PHASE GATE, not on any
  request parameter.
- **An acceptance-procedure append silently did nothing** because my guard tested whether an EMPTY string was
  absent from the file, which is never true. The commit message had claimed a procedure that did not exist.
  Any generated-edit guard must assert on real content.
- **A `~/.claude` memory said "no adb here"** — wrong. adb works over TCP; it is shared storage that is not
  writable from the Debian layer, so deliver by `adb push` + on-device `sha256sum`.

## Delivery truth

- Exact-final-HEAD Android CI: run `34773984160` on `8e1f5a8a…`, both jobs success.
- Artifact `18cce24600fefcdc62f1e3bc5a1a65648e62b66790581c8e04979983052a491d`, 260,115,332 bytes, single
  `arm64-v8a`, pinned TDLib present, v2/v3 signing only (no v1 `META-INF`, which is expected).
- All three required paths hold that exact hash, and the device's installed `base.apk` hashes to it, so the
  phone runs precisely the final-head artifact. The build is byte-identical across the last commits because
  those changed only documentation — which is why the installed hash still matches the FINAL head even
  though the install ran from the preceding run. No reinstall is claimed that did not happen.
- In-place upgrade only: `firstInstallTime` stayed `2026-08-03 05:46:55`. No uninstall, Clear Data, state
  erasure, direct preference/database mutation, or lock-screen bypass at any point.

## Not verifiable in this window, stated rather than claimed

- Both teams' real positions ON DEVICE: the new table is captured only while a fixture is UPCOMING, and the
  feed held one LIVE and one FINISHED football fixture with existing snapshots frozen by contract.
- The provider-page spoiler acceptance ON DEVICE: the available LIVE fixture had no website source to gate.
- In-app playback of a real LiveBall LIVE stream: see correction 5 — there is nothing in the page to bind.

## Rules note

`agent-memory/DEVELOPMENT_RULES_FULL.md` was read in full first. No `reset`, `clean`, `restore`, `stash`,
force push or alternate worktree was used, and no unrelated local work was touched — an uncommitted
`paywall-bot/cc-latest.md` change in this repository was left exactly as found, which the finalize script's
per-project scoping preserves. agent-memory was finalized ONLY through `/root/work/bin/agent-memory-finalize`.
