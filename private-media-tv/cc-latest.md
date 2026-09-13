# private-media-tv — code45 Website `WEB_SOURCE` handoff (Claude Code)

## Identity

- Repository: `private-media-tv`, branch `main`, tracking `origin/main`.
- Starting application HEAD: `2f06e1b1be44ca7e99f31090f96daf534de0c1ed`
  (two local commits from the previous round were still unpushed; `origin/main` was
  `8e1f5a8a79674fa459e1c1b6900338a11d9cc173`).
- Final application HEAD: `3004e6b1a93e36f79237097c5d08ed84faad7d83` (one commit, normal push, no force;
  the same push also carried the previous round's two commits, which had been committed locally but never
  pushed).
- Mobile Test target unchanged: `0.4.26-phone-test` / versionCode 45. No version bump, no new milestone.
- TV/Shield frozen at `0.6.11-f2c71` / 34 and untouched.

## What this round was

One owner clarification, acted on end to end. The previous round had REFUSED a request the owner never
made. They asked for two public Websites — `dlive.sx` and `ntv.cx` — to play INSIDE the app through the
existing shared GeckoView engine, exactly as they play in a browser:

```text
PMTV -> shared GeckoView WebsitePlaybackEngine -> the Website itself -> the Website's own player
```

and stated plainly: "This is a WEB_SOURCE task, not a NATIVE_STREAM task." PMTV had instead applied the
requirement for a source's own lawful, technically verified *direct/native* playback binding to
browser-only rendering, and declined.

## The most important lesson, for whoever reads this next

**A contract sentence written for one boundary was silently applied to a different one.** The sentence
"a playback-capable provider/source role requires its own lawful, technically verified binding" was
written about extraction and native playback. Applied to a browser rendering a page, it forbids
something it was never about — and because the sentence was in `AGENTS.md`, the refusal looked like
policy compliance rather than a misreading. The fix was to make the distinction explicit in the contract
FIRST, before any code: `AGENTS.md` now has a **Website `WEB_SOURCE` semantics** section, and the old
sentence says in its own words that it governs direct/native/extracted authority only.

When a rule seems to forbid something the owner plainly wants, check whether the rule is about the thing
you are actually doing before declining.

## What actually blocked it in the code

Not the engine. The engine was already permissive (JavaScript, cross-origin frames and nested frames,
cross-origin media/CDNs, cookies `ACCEPT_ALL`, EME/DRM, fullscreen). Two real blockers, both upstream:

1. **A `WEB_SOURCE` was required to advertise native-media-shaped capability before its own owner-bound
   row could exist.** Discovery filtered profiles through a provider capability gate — `LIVE_MATCHES`
   while a fixture runs, replay/highlights once finished, `LIVE_MATCHES` again before kickoff. That gate
   answers a real question, *is this REUSABLE PROVIDER worth QUERYING*, and it stays. It was also applied
   to an exact `SINGLE_RESOURCE` page the owner had already bound to that exact match, where the question
   does not arise: that path issues no request at all, it re-projects the existing binding. Net effect: a
   Website was admitted only if the probe had ALSO inferred playable-media evidence from it — only if it
   looked like a native source. A Website legitimately advertises `GENERAL_VIDEO_SOURCE` and nothing more.
2. **Autoplay was stricter than a browser.** The pinned GeckoView ships
   `media.geckoview.autoplay.request=true` and exposes NO runtime autoplay default, so the app's
   permission delegate *is* the browser's autoplay policy. It denied both audible and silent autoplay.
   Silent autoplay is how an ordinary web player reaches its first frame before the viewer unmutes, and
   denying it protects nothing. Silent autoplay is now allowed on a public-HTTPS non-YouTube document;
   audible autoplay stays denied, exactly as an ordinary mobile browser denies it.

Admission is now by REGISTRATION KIND and reads no binding, so everything downstream carries the weight:
a row needs an `EXACT`/`OWNER_CONFIRMED` binding for that exact target and resource, the per-row
role-versus-state check governs each row (its pre-match condition is the one that was relaxed), a
postponed/cancelled fixture admits no role, presentation suppresses a profile with nothing to show, and
the capability gate still governs every reusable provider.

## What the independent review caught in my own fix, which is the part worth reading

Two P1 defects, both mine, both in the first implementation of the above:

1. **The presentation-suppression rule inherited the widening.** Its pre-match branch delegated to the
   very predicate I had just relaxed, so on any UPCOMING fixture the suppression was inert: a source
   search that issues no network request at all would have reported one "checked" provider per saved
   exact page, and the owner-facing message would have flipped from "no sources were configured" to "the
   search completed — none found". **When you widen a predicate, grep every caller of it, including the
   ones that were supposed to be the safety net.** The pre-widening rule is now a separate function used
   only by presentation, with a regression test that fails if the delegation returns.
2. **The replacement owner-facing copy asserted that the site's own player PLAYS.** No Website playback
   has been observed on a device in this project, and one of the owner's own two pages did not play for
   them. Shipping that sentence would have put a physical claim in the UI that the same commit's evidence
   record denies. The copy now states only the affordance — the page can be opened here, and whose player
   is used there. Two sibling defects came with it: asserting that no stream EXISTS on the page (PMTV
   looks only where it has an audited resolver, so "was not found" is the strongest honest verb), and
   telling the owner to wait for kickoff while the button directly beneath was already enabled.

A third, smaller, was a truthfulness regression in diagnostics: the autoplay-blocked code keyed on the
capability decision rather than the final answer, so a silent-autoplay request refused by the
public-HTTPS guard returned DENY with no diagnostic at all. The answer and the diagnostic now come from
one pure function — which also gave that delegate its first test coverage, since it had none.

The review also found that an earlier draft of the state/handoff/test-plan notes quoted validation
results captured BEFORE the final source edit. The numbers were real but described a superseded revision.
**Write the validation section last, after the last source edit, or re-run it.**

## A fix of my own that I removed after reading the engine instead of assuming

I first added a pass that rewrote Gecko's stored site permissions at session start, reasoning that a
DENY written by the older policy would outlive it because "Gecko stops asking a site it has been told to
refuse". That reasoning was wrong, and the pinned artifact says so: the autoplay decision is taken from
the embedder's answer for the CURRENT top-level document and reset per document, and the
permission-manager row that is also written is not read back for an ordinary principal. The pass would
have corrected nothing and would have raced the document's first autoplay request.

Two things made this catchable: the planning agent read the actual pinned Gecko source rather than the
API docs, and the bundled pref was verifiable directly out of the AAR
(`assets/omni.ja!/defaults/pref/arm64-v8a/geckoview-prefs.js`). **Check the pinned artifact, not the
javadoc, before building machinery around an engine's behaviour.**

## Owner-visible wording that was false

The website-only notice said no stream on the page "can be played inside the application". Under the
clarified contract that is false — the page plays inside the application, through the isolated browser,
with the site's own player as the surface. What PMTV had not found is a stream its OWN player can take.
All four lifecycle variants now say that, each still stating whether a broadcast is even expected to
exist yet. `SUPERSEDED — owner approved`. The action label and every other control were left alone.

## Partly delivered: `football.co.il`

The owner said "add football.co.il". What shipped is the IDENTITY fragment: the site is recognised by its
own published name `מנהלת הליגות לכדורגל`, so several saved pages of it read as one source. No
capability, coverage claim, discovery route or playback grant, and a regression test asserts it is not
natively resolvable. It is **not inert**, though, and the review was right to insist on the distinction:
membership of ANY known family is what admits a site to the Sports provider-portfolio surface. Saying "it
grants nothing" was wrong; saying what it grants is the fix.

Consuming the site as a Ligat ha'Al data/highlights/full-match source is **NOT implemented** and stays on
the backlog — and the previous round's deferred TODO entry had to be restored after I had flipped it to
done, which is exactly the freeze-map hazard the project rules forbid. **A deferred owner item does not
become done because an adjacent fragment of it shipped.**

Why it was not rushed: the site's RSS feed carries **articles only**, with zero `<enclosure>` elements and
no video, HLS or embed reference anywhere in the document, and several article titles **contain scores**.
So it is neither a highlights nor a full-match index, and rendering its item text on a spoiler-free Sports
surface would break the owner's own rule. Its own pages do embed video and are openable through the
Website engine like any other Website source. Its `robots.txt` publishes `Crawl-delay: 5`, which the
bounded probe does not yet honour per host. `football.org.il` answers 403 from outside Israel, was never
audited, and is deliberately NOT claimed.

## Physical status — PENDING, and not claimed

**No Website playback was observed, and no Website Playback PASS is claimed.** The device answered ADB
for the whole implementation window but was LOCKED with the screen off
(`isKeyguardShowing=true`, `mScreenOn=false`), and a lock-screen bypass is prohibited. None of the eight
required observations — page opens, embed/player rendered, play from the site's own control, moving
video frames, audio, fullscreen, Back, leave/re-enter — needs less than the screen and a real tap.

The browser control test is unusable for the same reason, and this is worth recording as a technique
result: launching a browser with the URL "worked" (the activity resumed) while rendering nothing behind
the keyguard, and two screen captures three seconds apart differed in **zero** pixels across the whole
1080×2340 screen. A resumed activity is not a rendered page. Always check `isKeyguardShowing` before
attempting visual device evidence.

Host-side structure was verified and is explicitly NOT playback evidence: both pages answer HTTP 200
over HTTPS with no `http://` resource, no custom scheme and no popup in the player chain, and both reach
an ordinary JS/HLS browser player through a same-origin embed page and then a cross-origin player frame.

## Validation

All of it against the exact committed tree, after the last source edit, with every test task forced to
re-run through its `clean…` counterpart rather than accepted as up-to-date:
`:app-mobile:testDebugUnitTest` **1,489 tests, 0 failures, 0 errors, 11 skipped across 160 classes**; the
fourteen other mobile-used module test tasks re-run from clean and green; scoped Mobile lint **0 errors,
39 warnings** and `:app-mobile:assembleDebug` successful; `git diff --check` clean. Credential scanner
(62), mobile phone-delivery (15), CI downloader (20 rejection + 1 success), mobile upgrade verifier (8)
and all three GeckoView artifact gates passed against the built APK.

**Five mutations applied in place, each caught by a named test**: presentation inheriting the widening;
dropping the single-resource admission; restoring the pre-match capability requirement; reverting the
suppression on the refresh's YouTube exit; reverting autoplay parity. The two-Website route test is
deliberately NOT a mutation guard — it exercises the manual-source path, which never carried the gate —
and the docs say so rather than counting it as one.

## Delivery truth

- Exact-final-HEAD Android CI: run `34788770961` on `3004e6b1a93e36f79237097c5d08ed84faad7d83`, both jobs
  success (wrapper validation; official TDLib, mobile tests, mobile lint and signed mobile APK).
- The CI artifact was published to BOTH required device paths by the canonical downloader, and each copy
  was then verified independently on the device: `260131716` bytes, SHA-256
  `dd1e6ede1397c2c342fb0c19f8c7bc1a0341d9f9fa3a4a02fd2737d8ab269a81`, Development certificate
  `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0`. Both on-device `sha256sum` reads
  match that hash exactly, and both are real regular files.
- **Correction to an earlier handoff note:** `scripts/download-latest-ci-mobile-apk-to-phone.sh` WORKS.
  A previous round recorded that it always fails because Android shared storage is not writable from the
  Debian layer; that was a state of the environment, not a property of the script. Run the canonical
  downloader and read its real output before reaching for an `adb push` workaround.
- **No installation or launch is claimed.** The artifact was delivered, not installed: the device was
  locked with the screen off throughout, so no in-place upgrade, launch, or playback was performed.
- One in-repo placeholder is deliberately left as it stands: `docs/CODE45_OWNER_CONTRACT.md` still marks
  the phone-delivery line **PENDING** from the previous round's close-out. Amending it would require a new
  application commit, which under the canonical review contract invalidates the exact-head fallback
  attestation and the green CI for `3004e6b…`. The delivery evidence therefore lives here, which is the
  documented place for post-push evidence, rather than in a cosmetic commit that would weaken the
  release evidence it was meant to record.

## Review

`review_provider = claude_code_fallback`, `reason = codex_quota_unavailable`. An independent Opus
reviewer that did not do the implementation produced **39 findings**: 17 changed code or tests, 4 were
accepted with the rationale recorded instead of "fixed", the rest were corroborating or informational.
Zero unresolved P1 or P2. This is not a Codex review and is not presented as one.

## Known limitation identified and deliberately left alone

When the bounded probe's own crawler cannot inspect a child/media origin inside a Website's chain
(`SOURCE_UNSAFE_ADDRESS` / `SOURCE_DNS_FAILED`), the URL is refused outright with no "use as a website"
offer. Neither of the owner's two Websites hits that path, and the instruction was to fix only the
actual blockers, so it is recorded rather than changed speculatively. Also unchanged: the bounded probe
does not implement a per-host robots crawl-delay, which `football.co.il` publishes as 5 seconds.

## Rules note

`agent-memory/DEVELOPMENT_RULES_FULL.md` was read in full first, then the full application and
agent-memory preflight. No `reset`, `clean`, `restore`, `stash`, force push or alternate worktree was
used, and no unrelated local work was touched — an uncommitted `paywall-bot/cc-latest.md` change in the
agent-memory repository was left exactly as found, which the finalize script's per-project scoping
preserves. Planning ran in Fable, implementation and review in Opus, and agent-memory was finalized ONLY
through `/root/work/bin/agent-memory-finalize`.
