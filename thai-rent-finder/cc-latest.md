diagnostic: TRF PR #88 wave + run-storm quantification (READ-ONLY)

_2026-07-05. READ-ONLY on funzi7/thai-rent-finder: no code/PR/comment/label/run change — only this
agent-memory publish. `gh` unavailable → REST/curl + GitHub MCP. Owner referenced only by login `funzi7`._

## 0. PR #88 now
```
state=open  merged=False  head=claude/enrich-dates-search-cleanup@c3b700e  mergeable=True/unstable  labels=[]
title: Enrich Lazudi extraction, "עודכן" dates, mobile search + recents, dead-concern cleanup
commits (all authored "Claude"):
  796d62a 17:48:42  feat(scrapers): extract lazudi floor/furnished/facilities; share amenity table
  e7102f0 17:50:10  feat(ui): show "עודכן" last-seen date+time on card and detail header
  9a2b726 17:52:41  feat(search): always-visible mobile search box + recent-searches chips
  c3b700e 17:53:08  feat(admin): cleanup-dead-concerns endpoint for removed RULE keys   <== HEAD
latestCommitDate = 2026-07-05T17:53:08Z
```

## 1. ping / marker / reaction timeline
```
review comments:
  [17:58:44] chatgpt-codex-connector[bot] commit=c3b700e src/components/SearchBox.tsx:33  ACTIVE P2 "Reset pagination when committing mobile searches"
  [17:58:44] chatgpt-codex-connector[bot] commit=c3b700e src/app/listings/page.tsx:206    ACTIVE P2 "Keep mobile q in sync with FiltersBar"
  [17:58:53] funzi7  id=3525359670  @claude fix  (ai-loop attempt=1, agent=claude state=requested, head c3b700e)  SearchBox.tsx:33
       trigger reactions: claude[bot]:eyes@17:58:55 , funzi7:-1@17:59:19   <== fix #23 ADD-ONLY 👎
issue comments:
  [17:59:20] funzi7  <!-- ai-loop:v1 root_pr=88 head=c3b700e attempt=1 agent=claude state=no_delivery -->  (fix #23 handoff marker)  reactions: (none)
```

## 2. Claude Fixer run (job of run 28749789826, the 25s "success") — steps
```
  2 Fail-soft check for ANTHROPIC_API_KEY : success   (has_key true)
  3 Checkout repository                   : success
  4 Run Claude Code                       : success   (17:59:01→17:59:18 = 17s; NO commit produced)
  5 Delivery check — did a fix land on the head? : success  (fix #23 Part A — ran)
  6 Mark a no-delivery fix (👎 + ladder handoff) : success  (FIRED → added 👎 17:59:19 + no_delivery marker 17:59:20)
  7 Label Claude's PR for auto-merge      : success   (no-op — @claude-mention path)
```
Delivery truth: commits on head after the 17:58:53 ping = NONE (head still c3b700e @17:53:08). So Claude
ran a no-op and fix #23 caught it honestly (👎 + no_delivery marker) — NOT a silent pass (the TRF #84 bug).

## 3. gate + checks on head c3b700e (21 check-runs; chronological highlights)
```
17:54:45 build-gate            [completed/success]
17:54:50 check-codex-status    [completed/failure]
17:55:21 Vercel Preview Comments [completed/success]  (Vercel bot check, details_url vercel.com/github)
17:56:33 check-codex-status    [completed/failure]
17:58:14 check-codex-status    [completed/failure]
17:58:50 check-codex-status    [completed/failure]
17:58:59 check-codex-status    [completed/failure]  (authoritative required check — RED)
17:59:32 codex-gate-verdict    [completed/failure] :: "🔴 Active Codex P1/P2"
   summary: "An unresolved Codex P1/P2 on c3b700e is blocking merge. It clears when Codex posts a fix
             Summary or the head is updated (last active 2026-07-05T17:58:44Z, last fix none)."
(also many trigger_codex_fix / archive_codex_summary jobs, mostly skipped — the bridge's debounce.)
```

## 4. Merge Bot runs #72–#80 (all workflow_run, all SKIPPED)
```
  #80 17:59:38 workflow_run skipped actor=funzi7
  #79 17:59:09 workflow_run skipped actor=funzi7
  #78 17:58:59 workflow_run skipped actor=chatgpt-codex-connector[bot]
  #77 17:58:58 workflow_run skipped actor=chatgpt-codex-connector[bot]
  #76 17:58:58 workflow_run skipped actor=funzi7
  #75 17:58:57 workflow_run skipped actor=chatgpt-codex-connector[bot]
  #74 17:56:32 workflow_run skipped actor=funzi7
  #73 17:56:30 workflow_run skipped actor=vercel[bot]      <== the "vercel-actor" run
  #72 17:55:26 workflow_run skipped actor=vercel[bot]
```
Each wakes on a "Codex Gate" `workflow_run [completed]`; the job `if:` requires `conclusion=='success'`.
Every gate run was failure/cancelled → all 9 SKIP at the job level (~0 runner-min). The actor is
INHERITED from the upstream gate run's triggering event (a Vercel preview comment → gate run actor
vercel[bot] → merge-bot woken with actor vercel[bot]).

## 5. STORM QUANTIFICATION — the ~5-min wave (17:54–18:00), 30 runs
```
name × event                                 runs  conclusions                 real_billable_min (skipped=0)
Merge Bot × workflow_run                        9   skipped:9                   ~0   (all no-op skips)
Codex Gate × pull_request_review_comment        ~3  cancelled:2, failure:1      ~2   (concurrency collapse + 1 real)
Codex Gate × issue_comment                      2   failure:1, cancelled:1      ~3
Codex Gate × pull_request_review                2   failure:1, cancelled:1      ~2
Codex Gate × workflow_dispatch                  2   failure:2                   ~3   (head-targeted self-reruns)
Codex Auto-Fix × pull_request_review_comment    3   success:2, skipped:1        ~2
Codex Auto-Fix × pull_request_review            2   success:1, skipped:1        ~1
Codex Auto-Fix × issue_comment                  2   skipped:2                   ~0
Claude Fixer × pull_request_review_comment      3   success:1, skipped:2        ~1   (1 real no-op run + 2 skips)
Claude Fixer × issue_comment                    2   skipped:2                   ~0
```
Wave total: **30 runs, ≈15 real billable runner-minutes** (SKIPPED jobs consume ~0 — GitHub does not bill
a job whose `if:` evaluated false). The naive "ceil every run to ≥1 min" count was ~32 min; the honest
figure is ~15 because **more than half the runs are ~0-cost skips.**

## 6. deployment era on TRF main
```
claude.yml                  : #23 delivery-check + no_delivery marker           → POST-#23
claude-fallback-watchdog.yml: #23 codex-cloud + updateBranch, #21 grace, #24 push-instruction, freshness → POST-#24
codex-gate.yml              : #21 SYNC_GRACE + freshness                          → POST-#21
codex-backup-fix.yml        : #24 state=no_change (honest) + freshness            → POST-#24
```

---

# VERDICT

**(a) #88 status.** Codex found **2 ACTIVE P2** on head c3b700e (both at 17:58:44): "Reset pagination when
committing mobile searches" (`src/components/SearchBox.tsx:33`) and "Keep mobile q in sync with FiltersBar"
(`src/app/listings/page.tsx:206`). **The fixer did NOT deliver:** claude.yml ran (25s job success) but its
Delivery-check step (fix #23) found **zero commits after the 17:58:53 ping** — the 29s "success" was a
no-op. **Fix #23 handled it honestly**: step 6 "Mark a no-delivery fix" fired → **ADDED a 👎**
(`funzi7:-1@17:59:19`) on the trigger and posted the `agent=claude state=no_delivery` marker (17:59:20).
The gate verdict is now **🔴 Active Codex P1/P2** ("last fix none"). **To merge:** a real fix commit must
land for the two P2 (the watchdog ladder will advance to the codex-cloud stage — a `@codex fix` top-level
ping — within ~20 min of the no_delivery marker, since Claude didn't deliver; or the owner fixes). A fix
commit advances the head → the P2s go stale → gate green → merge-bot merges (`claude/*` branch, no
`needs-owner`).

**(b) The two red gate runs + the vercel-actor merge-bot run.** The red `check-codex-status` runs are the
gate **correctly** evaluating **🔴 Active Codex P1/P2** — 2 unresolved P2 on the head, "last fix none". Not
a malfunction. The gate fired on several events; fix-#12 concurrency **cancelled** the overlapping runs,
leaving genuine `failure` verdicts. The **vercel-actor Merge Bot runs (#72/#73, actor=vercel[bot])**: merge-bot
wakes on **every** "Codex Gate" `workflow_run [completed]`; a Vercel preview comment (an `issue_comment` by
`vercel[bot]`) triggered a Codex Gate run whose actor was `vercel[bot]`, and its completion woke merge-bot
with the **inherited** actor. Merge-bot **SKIPPED** (job `if:` requires gate `conclusion=='success'`; it was
failure). Pure designed no-op; the vercel actor is cosmetic.

**(c) Storm digest — who makes the 1s no-ops.** Of the 30 wave runs, the biggest no-op source is **Merge Bot
× workflow_run — 9 runs, ALL skipped (~0 min)** (wakes on every gate completion, fail-closed job `if:`).
**Claude Fixer skipped ×4 and Codex Auto-Fix skipped ×4** (job-`if:` / cross-channel debounce) are also ~0
min. The runs that actually burned a runner: **Codex Gate** (`failure` ×4 + `cancelled` ×4 — the cancels
still start a runner for ~1–2 min before concurrency kills them) and one **Claude** no-op (~1 min) + bridge
`success` ×3 (~1 min). Honest wave cost ≈ **15 runner-min**, of which **the Codex Gate cancels/failures are
~10–12 min** and everything else is near-zero skips.

**(d) Malfunction vs designed noise.** **Nothing is malfunctioning** — every item is designed filter-noise:
Merge Bot's 9 skips (broad `workflow_run` wake + fail-closed `if:`), Codex Gate's cancels (fix-#12
concurrency collapse), Claude/bridge skips (job-`if:` + fix-#12/#13 debounce), the gate RED (correct — 2
active P2), and the Claude no-op-success (correctly caught by fix #23). The only real cost is the Codex Gate
runs that start a runner before being cancelled.

**(e) Recommended trims (recommendations only — no changes made).**
1. **Narrow Codex Gate `on:` — drop `pull_request_review_comment` (keep `pull_request_review`).** A single
   Codex review with N inline notes currently fires `pull_request_review` **and** N × `pull_request_review_comment`
   → N+ gate runs, most cancelled but each burns ~1–2 min before the concurrency kill. **Biggest real saving:
   ~4–8 runner-min/wave** + far fewer cancels. (Verify the gate doesn't rely on the per-note event for
   freshness — it evaluates the whole head, so the review-level event suffices.)
2. **Gate the Merge Bot `workflow_run` wake.** 9 skips/wave at ~0 min each — minute savings ≈ 0, but it
   clutters the run list and the "storm" perception. Mechanism: add a `workflow_run.conclusions: [success]`
   filter (if supported) or keep as-is (cheap). **Expected: ~0 min, cleaner history.**
3. **Codex Auto-Fix / Claude Fixer on `pull_request_review_comment [created]`** wake on every inline comment
   (mostly skipped). Already debounced; skips are ~0 min. **Cosmetic only.**
Net: the one trim worth doing is #1 (drop the gate's `pull_request_review_comment` trigger) — it removes the
only non-trivial minute cost.

**(f) Deployment era + what it means for #88.** TRF main is **POST-#23 AND POST-#24** (claude.yml has the
delivery-check + no_delivery marker; the watchdog has codex-cloud/update-branch/grace/push-instruction; the
gate has grace+freshness; codex-backup has honest states+freshness). **This wave is the first observed run
of the new delivery-aware chain — and it worked:** the Claude no-op "success" was honestly flagged (👎 +
`no_delivery` marker) instead of silently passing as it did on TRF #84. Consequently #88's chain will
**self-advance**: the watchdog reads the `no_delivery` marker, and within its 20-min window posts the
codex-cloud `@codex fix` (with the fix-#24 "commit and push directly" instruction) — no human needed unless
the whole ladder fails, at which point it escalates to `needs-owner` with the View-task hint.
