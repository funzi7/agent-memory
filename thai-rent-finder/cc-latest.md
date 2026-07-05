autopsy: PR #88 claude fixer 17s no-op — full transcript (READ-ONLY)

_2026-07-05. READ-ONLY on funzi7/thai-rent-finder: no code/PR/comment/label/run change — only this
agent-memory publish. `gh` unavailable → REST/curl 403 on downstream Actions → GitHub MCP `get_job_logs`.
Owner referenced only by login `funzi7`._

## 0. the run
```
run 28749789826  (claude.yml, "Claude Fixer")  job 85246781366 "claude"
event=pull_request_review_comment  actor=funzi7  head=c3b700e  created 2026-07-05T17:58:55Z
job success (17:58:58→17:59:23 = 25s); step 4 "Run Claude Code" 17:59:01→17:59:18 = ~17s.
Trigger: review comment id 3525359670 (the bridge's @claude fix on src/components/SearchBox.tsx:33,
2 active P2). Log: "Preparing with mode: agent for event: pull_request_review_comment / Verified human
actor: funzi7".
```

## 1. transcript IS exposed (fix #16 var active)
```
action inputs:  show_full_output: true      "show_full_output": "true"
grep "full output hidden": 0 occurrences   → the FULL SDK transcript is in the log.
SDK: claude_code_version 2.1.201, model "claude-opus-4-8[1m]", apiKeySource "ANTHROPIC_API_KEY",
     permissionMode "default", "Running Claude with prompt from file: .../claude-prompt.txt".
```

## 2. the prompt the action fed Claude (verbatim opening)
```
Context prompt: You are the autonomous fixer in a self-healing CI loop. You were
invoked on a GitHub Issue or PR in this repository.
  If triggered by a `claude-fix` Issue (opened by ci-doctor): 1. Read the Issue body… 5. Do NOT merge…
  Prefer the allowed tools and do NOT attempt tools outside the allowlist…
  If triggered by an @claude mention, follow the request in the comment, working on a branch…
Trigger result: true
```
This is the STATIC claude.yml fixer prompt (fed from `claude-prompt.txt`). The visible "Context prompt"
does NOT inline the ping's 2 P2 findings (the action surfaces the review-thread context separately). But
it is MOOT — see §3: Claude processed zero tokens.

## 3. Claude's final message + terminal SDK result (the core evidence)
```
{ "type": "assistant",
  "message": { "model": "<synthetic>", "role": "assistant", "stop_reason": "stop_sequence",
    "usage": { "input_tokens": 0, "output_tokens": 0, ... },
    "content": [ { "type": "text", "text": "Credit balance is too low" } ] },
  "error": "billing_error", "request_id": "req_011CcjM1AN1hKXNYke4U41gD" }

{ "type": "result", "subtype": "success",
  "is_error": true,
  "api_error_status": 400,
  "duration_ms": 259, "num_turns": 1,
  "result": "Credit balance is too low",
  "stop_reason": "stop_sequence",
  "total_cost_usd": 0,
  "usage": { "input_tokens": 0, "output_tokens": 0, ... },
  "permission_denials": [],
  "terminal_reason": "completed" }
```
`is_error:true`, `api_error_status:400`, `error:"billing_error"`, `num_turns:1`, `input_tokens:0`,
`output_tokens:0`, `total_cost_usd:0`, `permission_denials:[]`. **Claude never ran a single inference —
the first API call 400'd on billing.** Yet the action's result `subtype:"success"` and the job exited 0.

## 4. secondary (the cloud-ping cross-trigger)
The later `issue_comment` cross-trigger (the codex-cloud `@claude` re-trigger that fix #25 sanitizes)
hits the SAME billing wall — Claude is out of credit account-wide, so every invocation returns
`billing_error / "Credit balance is too low"` at 0 tokens regardless of trigger. Not separately dumped
(identical root cause). The delivery-check step (fix #23) still fired correctly on this run: it found 0
commits after the ping and posted the 👎 (`funzi7:-1@17:59:19`) + the `agent=claude state=no_delivery`
marker.

---

# VERDICT

**(a) Transcript exposed?** **YES.** `show_full_output: true` (the fix #16 wiring + the repo Actions var
`CLAUDE_SHOW_FULL_OUTPUT=true`), zero "full output hidden" lines, and the complete SDK options + result
JSON are in the log. Fix #16 is exactly what made this diagnosable.

**(b) What prompt the action constructed.** The **static claude.yml fixer prompt** —
`"You are the autonomous fixer in a self-healing CI loop. You were invoked on a GitHub Issue or PR in
this repository. …"` — read from `claude-prompt.txt`. It was NOT empty or garbled, and it did NOT inline
the ping's P2 findings in the visible context (the action would surface the review thread as separate
context). **Irrelevant to the outcome:** `input_tokens:0` means Claude never even ingested the prompt.

**(c) Claude's final message (verbatim).** `"result": "Credit balance is too low"` — a **synthetic**
assistant message (`"model":"<synthetic>"`) wrapping `error:"billing_error"`, `api_error_status:400`.
Claude gave **no reasoning** for finishing without changes: it did not decide "no change needed"; it
never inferred anything (`num_turns:1`, 0 tokens, $0). The "17-second success" is the ~17s of
git-auth + `claude` install + one instant 400 billing bounce.

**(d) Diagnosis: NEITHER a pipeline prompt bug NOR a model decision — it is an INFRASTRUCTURE / BILLING
failure.** The Anthropic account behind `ANTHROPIC_API_KEY` is **out of credit**. Evidence line:
`{"type":"result","subtype":"success","is_error":true,"api_error_status":400,"result":"Credit balance is
too low","total_cost_usd":0,"usage":{"input_tokens":0,"output_tokens":0}}`. Secondary defect worth
naming: **claude-code-action reports `subtype:"success"` and exits 0 despite `is_error:true`**, so a
billing_error masquerades as a clean no-op — which is exactly why it looked like a mysterious "no-op
success". (fix #23's delivery check caught the *symptom* — no commit → 👎 + `no_delivery` marker — and
the ladder advanced; but the ROOT is billing.)

**(e) Recommended fix (one paragraph).** Two layers. **Immediate:** fund the Anthropic account — until
credit is restored the Claude fixer is 100% dead on TRF *and every repo sharing that key* (every call
400s at 0 tokens), so the whole first ladder rung is a no-op everywhere. **Structural:** teach claude.yml
to read the SDK execution output (`claude-execution-output.json` / the `type:"result"` object) and treat
`is_error:true` with `billing_error` / "Credit balance is too low" as a **hard, distinct failure** — not
a delivery no-op — so it (i) alerts the owner to fund and (ii) short-circuits the fixer stage like the
keyless fail-soft, letting the watchdog ladder jump straight to Codex Cloud instead of burning a runner +
a 20-min delivery window per PR. Cheapest version: gate claude.yml behind a `CLAUDE_ENABLED` Actions var
(mirroring `CODEX_BACKUP_ENABLED`) that is flipped off while credit is exhausted.

**(f) Implication for the fix #26 proxy stage.** Given this evidence, feeding Claude the Codex recipe
will **NOT** change the outcome — **NO.** Claude never executes (0 tokens, instant 400); a better prompt
reaches an account that cannot run. A proxy stage is pointless while credit is exhausted. **And the entry
condition must be tightened:** "no-op with key present" is INSUFFICIENT — this run had the key present and
produced a no-op, yet it was a **billing failure**, not a genuine model no-op. The proxy must fire ONLY on
a *genuine model no-op* — Claude actually RAN (`is_error:false`, `num_turns > 1`, `input_tokens/output_tokens
> 0`) and chose not to change code — and **never** on `billing_error` / credit exhaustion / failed / keyless
runs. So the confirmed entry condition is "no-op with key present **AND `is_error:false` AND tokens spent**"
(explicitly excluding billing_error), not "no-op with key present" alone.
