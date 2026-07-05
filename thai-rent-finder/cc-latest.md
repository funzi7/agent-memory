diagnostic: TRF PR #84 forensic timeline (READ-ONLY)

_2026-07-05. READ-ONLY on funzi7/thai-rent-finder: no code/PR/comment/label/run change — only this
agent-memory publish. `gh` unavailable → REST/curl + GitHub MCP. Owner referenced only by login `funzi7`._

## 0. PR #84 now
```
state=open  head=claude/solo-cadence-and-concerns@3610ccd  base=main  mergeable=True/unstable
labels=[needs-owner]   title="Solo-use cadence + leaner Hebrew concerns + state.md footer fix"
```
Commits (author/date/msg):
```
6e7ec1e 2026-07-05T06:54:55Z Claude/claude   feat(concerns): plain-Hebrew AI output, 4 categories only; drop 2 low-value rule
c0af56f 2026-07-05T06:57:07Z Claude/claude   perf(scraper): TP city priority, BKK cap 2, 3.5min deadline, job timeout
42e41d4 2026-07-05T06:58:28Z Claude/claude   chore(ci): every-3-days staggered scrape cadence for solo use
60b7418 2026-07-05T06:59:09Z Claude/claude   chore(ci): raise site-health freshness threshold to 80h for 3-day cadence
52dbf6f 2026-07-05T06:59:39Z Claude/claude   fix(scraper): widen stale window 7d -> 14d for 3-day cadence
af69d87 2026-07-05T07:01:42Z Claude/claude   fix(state): stop state.md footer self-duplication (diagnostic Q7)
3610ccd 2026-07-05T08:58:25Z funzi7/funzi7  fix(scraper): avoid unsafe Thailand Property sweeps   <== Codex-Cloud fix (owner-authored), NEW HEAD
```

## 1. ping & reaction timeline (👀 NEVER swapped)
```
issue comment:
  [07:47:58] funzi7  <!-- ai-loop:v1 root_pr=84 head=af69d87 agent=watchdog state=escalated --> Claude didn't fix…   reactions: (none)
review comments:
  [07:09:11] funzi7  @claude fix  (ai-loop attempt=1, head=af69d87)  route/thailand-property.ts:37   reactions: claude[bot]:eyes@07:09:13   <== 👀 never → 👎
  [08:42:11] funzi7  @codex fix                                       thailand-property.ts:24         reactions: chatgpt-codex-connector[bot]:eyes@08:42:17
  [09:02:53] funzi7  @claude fix  (ai-loop attempt=2, head=3610ccd)   route/[source]/route.ts:61      reactions: claude[bot]:eyes@09:02:54   <== 👀 never → 👎
  [09:06:16] funzi7  @codex fix                                       site-health.yml:92              reactions: chatgpt-codex-connector[bot]:eyes@09:06:26
```
The 👀 on both `@claude fix` triggers were placed by the **hosted `claude[bot]` App** (not by claude.yml's AUTOMATION_PAT identity), and neither was ever swapped to 👎.

## 2. Claude Fixer (claude.yml) runs — ZERO failures; "success" with NO delivery
```
claude.yml recent runs: ALL skipped or success — NO failure runs.
  28732918736 2026-07-05T07:09:13Z pull_request_review_comment success   (attempt=1 trigger, head af69d87)
  28735625733 2026-07-05T09:02:55Z pull_request_review_comment success   (attempt=2 trigger, head 3610ccd)
```
Steps of run 28732918736 (attempt=1, the decisive one):
```
  2 Fail-soft check for ANTHROPIC_API_KEY : success
  3 Checkout repository                   : success   (ran → has_key == 'true'; the API key IS present)
  4 Run Claude Code                       : success   (07:09:20 → 07:09:35 = 15 seconds; NO commit produced)
  5 Swap 👀 → 👎 on a failed fix          : SKIPPED   (condition steps.claude.outcome != 'success' is FALSE)
  6 Label Claude's PR for auto-merge      : success
```
No Claude commit exists after `af69d87` (07:01:42) — so claude-code-action RAN, exited 0 in 15s, and delivered nothing. Its "success" makes the fix-#10 swap step skip.

## 3. Codex activity (incl. self-review) + ACTIVE finding set
```
reviews (all COMMENTED):
  chatgpt-codex-connector[bot]  commit=af69d87  07:08:59
  funzi7                        commit=af69d87  07:09:11 / 08:42:11
  chatgpt-codex-connector[bot]  commit=af69d87  08:47:16
  chatgpt-codex-connector[bot]  commit=3610ccd  09:02:42   <== reviews the NEW head, 2 fresh P2
  funzi7                        commit=3610ccd  09:02:53 / 09:06:17
  chatgpt-codex-connector[bot]  commit=3610ccd  09:07:56   <== Codex re-reviews its own/owner's fixes (NOT a fix Summary)
latestCommitDate = 2026-07-05T08:58:25Z
```
P1/P2 review comments (ACTIVE = created_at > latestCommitDate):
```
[07:08:59] stale  P2 "Preserve the serverless scrape deadline"          thailand-property.ts:37  (predates head; owner's 3610ccd addressed)
[07:08:59] stale  P2 "Avoid sweeping Bangkok after only two seen listings" thailand-property.ts:24
[09:02:42] ACTIVE P2 "Add Thailand Property to the Actions jobs UI"      src/app/api/scrape/[source]/route.ts:61
          — the thailand-property Actions-only entry returns 503 before any scraper is created, but the jobs UI doesn't list it.
[09:02:42] ACTIVE P2 "Monitor the Thailand Property workflow run"        .github/workflows/site-health.yml:92
          — after moving TP to the Actions path, the freshness list still starts at FazWaz and never checks scrape-thailand-property.
```

## 4. gate + checks on head 3610ccd
```
codex-gate-verdict [completed/failure] :: "🔴 Active Codex P1/P2"
  summary: "An unresolved Codex P1/P2 on 3610ccd is blocking merge. It clears when Codex posts a fix
            Summary or the head is updated (last active 2026-07-05T09:02:42Z, last fix none)."
check-codex-status (job) [completed/failure]  — authoritative required check, RED.
(check-runs on the head total 35; the bridge trigger_codex_fix succeeded, archive_codex_summary ran.)
```

## 5. watchdog on #84
```
The watchdog escalated at 07:47:58 — added `needs-owner` + the ai-loop:v1 agent=watchdog state=escalated
issue-comment marker (+ Telegram), because attempt=1 Claude did not deliver within the timeout.
```

## 6. TRF deployed fix-era (workflow contents on main)
```
claude.yml                  : --max-turns 50 (fix #7) + CLAUDE_SHOW_FULL_OUTPUT wiring (fix #16)      → CURRENT
codex-gate.yml              : codex-gate-verdict + name: check-codex-status (#15) + SYNC_GRACE_MINUTES (#21) → CURRENT
merge-bot.yml               : roPaged + Link rel="next" (#20; carries #17/#19)                          → CURRENT
claude-fallback-watchdog.yml: late-signal + roPaged + SYNC_GRACE_MINUTES + silent-sync (#18/#19/#20/#21) → CURRENT
codex-auto-fix.yml          : FINDINGS_DIGEST (#13)                                                      → CURRENT
```

---

# VERDICT

**(a) Timeline (one line/event).**
1. 06:54–07:01 — Claude opens #84, 6 commits (concerns plain-Hebrew, scraper perf, 3-day cadence, site-health 80h, stale 14d, state.md footer). Head af69d87.
2. 07:08:59 — Codex reviews af69d87 → 2 active P2 (serverless deadline; BKK-2-listings sweep).
3. 07:09:11 — bridge `@claude fix` (attempt=1); hosted claude[bot] 👀 @07:09:13.
4. 07:09:13–40 — claude.yml runs, "Run Claude Code" **success in 15s, no commit**; swap 👀→👎 **skipped**.
5. 07:47:58 — watchdog escalates → `needs-owner` + marker + Telegram.
6. 08:42:11 — owner `@codex fix`; Codex Cloud 👀 @08:42:17.
7. 08:58:25 — commit **3610ccd** (funzi7 / Codex Cloud: "avoid unsafe Thailand Property sweeps"); new head (owner also updated branch).
8. 09:02:42 — Codex reviews 3610ccd → 2 NEW active P2 (jobs-UI 503 entry; site-health TP freshness).
9. 09:02:53 — bridge `@claude fix` (attempt=2); claude[bot] 👀; claude.yml success again, no commit, swap skipped.
10. 09:06:16 — owner `@codex fix` again; 09:07:56 Codex re-reviews (no fix Summary).
11. 09:08:19 — gate = 🔴 Active Codex P1/P2. Now: open, needs-owner, unstable, RED.

**(b) WHY Claude failed.** Not a crash and not a missing key: step 3 "Checkout" ran, so `has_key == 'true'`
(ANTHROPIC_API_KEY present). **Step 4 "Run Claude Code" concluded `success` in 15 seconds
(07:09:20 → 07:09:35) but produced NO commit** — a no-op success. The last Claude commit is af69d87
@07:01:42, before the ping. claude-code-action reported success without delivering a fix (the actual fix
later came from Codex Cloud as 3610ccd). Decisive: `step 4 Run Claude Code: success` +
`no Claude commit after 07:01:42`.

**(c) WHY no 👎.** The fix-#10 step **"Swap 👀 → 👎 on a failed fix" was SKIPPED** — its guard is
`always() && has_key == 'true' && steps.claude.outcome != 'success'`, and the claude step's outcome WAS
`success` (the 15s no-op), so `!= 'success'` is false → skipped. Compounding it: the 👀 on the comment was
placed by the **hosted `claude[bot]` App**, a different identity from claude.yml's AUTOMATION_PAT — so even
had the swap run, it manages only its own token's reactions, not claude[bot]'s 👀. Result: the 👀 is
orphaned, and a delivered-nothing run looks like a clean success.

**(d) ACTIVE Codex findings on head 3610ccd (the remaining work) — 2× P2:**
- **P2 · `src/app/api/scrape/[source]/route.ts:61`** — the new `thailand-property` Actions-only branch
  returns 503 before creating a scraper, but the jobs UI (`src/app/jobs…`) doesn't list thailand-property
  → add it to the Actions jobs UI.
- **P2 · `.github/workflows/site-health.yml:92`** — after moving Thailand Property to the Actions path,
  the freshness list still starts at FazWaz and never checks `scrape-thailand-property` → add it to the
  monitored-workflows list.

**(e) Finish-line plan for #84 (ordered):**
1. **Fix the 2 active P2 on head 3610ccd** (owner is already driving Codex Cloud via the 09:06 `@codex fix`;
   or Claude): (i) list `thailand-property` in the jobs UI; (ii) add `scrape-thailand-property` to
   site-health's freshness list. Commit → advances the head.
2. **Head advances → the 09:02 P2s go stale automatically** (the gate clears on "the head is updated", or
   on a Codex fix Summary). Let Codex re-review the new head with no active P1/P2.
3. **Gate → 🟢** `check-codex-status` success on the new head.
4. **Remove the `needs-owner` label** — it is merge-bot's FIRST hard-stop; the PR can't merge while set.
5. **merge-bot merges** — #84 is a `claude/*` same-repo branch (a candidate); once green + label removed it
   squash-merges automatically.

**(f) TRF deployment gaps (section 6).** **None material — TRF is at the current fix-era** (claude.yml #7+#16,
gate #15+#21, merge-bot #17/#19/#20, watchdog #18/#19/#20/#21, bridge #13). One thing to verify, not a code
gap: whether the repo Actions var **`CLAUDE_SHOW_FULL_OUTPUT`** is set to `'true'` — the wiring is present
(fix #16) but the var must be on to expose the SDK transcript, which is exactly what would explain the 15s
no-op "success". (Aside: TRF's `sync-automation-core.yml` was `disabled_manually` in the 07-04 fleet scan,
yet the workflows are current — synced before the disable; no live gap, but future upstream fixes won't reach
TRF until sync is re-enabled or manually applied.)

**(g) Design inputs for fix #23 (Claude → Codex-API → Codex-Cloud → needs-owner chain + auto update-branch):**
- **Success ≠ delivery — the core lesson.** claude-code-action returns `success` on a 15s no-op with zero
  commits, so fix #10's `outcome != 'success'` guard can't see the failure: no 👎, no re-trigger. fix #23
  needs a **delivery check** — did a fixer commit land on the head AFTER the ping? If not, treat it as a
  failed attempt (swap 👎, count the attempt, advance the chain) regardless of the action's exit code.
- **Reconcile the two responders / the 👀 identity.** The hosted `claude[bot]` App and self-hosted claude.yml
  both answer `@claude`; the 👀 is claude[bot]'s but claude.yml only manages its own token's reactions.
  fix #23 must either swap ANY `eyes` on the trigger comment or standardize on one responder.
- **Stage hand-off must be automatic, not owner-driven.** Here the chain only advanced because the owner
  manually ran Codex Cloud (`@codex fix`) twice. fix #23's Claude→Codex-API→Codex-Cloud→needs-owner ladder
  should auto-advance to the next stage on a detected no-delivery, escalating to needs-owner only at the end.
- **A Codex-Cloud commit needs a fix Summary (or rely on head-advance).** 3610ccd cleared the old P2s by
  advancing the head, but Codex Cloud posted no fix Summary, so the gate re-blocks on the NEW findings with
  "last fix none". fix #23 should make a Cloud/API fix post a Summary (or lean on the head-advance clear path).
- **Auto update-branch.** The owner manually clicked Update branch; fix #23 should auto-update-branch for a
  loop-candidate PR when the base moves, so the fixer always works the current head.
