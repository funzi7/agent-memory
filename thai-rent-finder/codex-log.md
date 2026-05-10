# Codex Activity Log — thai-rent-finder

History of Codex auto-fix activities. Newest first.

---

## PR #71 — feat(ci): codex review gate blocks merge until Codex signals
**Date:** 2026-05-10T04:02:37Z
**Reviewed commit:** unknown
**Source:** [PR comment](https://github.com/funzi7/thai-rent-finder/pull/71#pullrequestreview-4258828931)


### 💡 Codex Review

Here are some automated review suggestions for this pull request.

**Reviewed commit:** `27ff841bb1`
    

<details> <summary>ℹ️ About Codex in GitHub</summary>
<br/>

[Your team has set up Codex to review pull requests in this repo](https://chatgpt.com/codex/cloud/settings/general). Reviews are triggered when you
- Open a pull request for review
- Mark a draft as ready
- Comment "@codex review".

If Codex has suggestions, it will comment; otherwise it will react with 👍.




Codex can also answer questions or update the PR. Try commenting "@codex address that feedback".
            
</details>

---

## PR #70 — fix: 4 critical CI automation issues (closes #65, #69)
**Date:** 2026-05-10T03:29:06Z
**Reviewed commit:** unknown
**Source:** [PR comment](https://github.com/funzi7/thai-rent-finder/pull/70#pullrequestreview-4258798226)


### 💡 Codex Review

Here are some automated review suggestions for this pull request.

**Reviewed commit:** `55a8ee701e`
    

<details> <summary>ℹ️ About Codex in GitHub</summary>
<br/>

[Your team has set up Codex to review pull requests in this repo](https://chatgpt.com/codex/cloud/settings/general). Reviews are triggered when you
- Open a pull request for review
- Mark a draft as ready
- Comment "@codex review".

If Codex has suggestions, it will comment; otherwise it will react with 👍.




Codex can also answer questions or update the PR. Try commenting "@codex address that feedback".
            
</details>

---

## PR #70 — fix: 4 critical CI automation issues (closes #65, #69)
**Date:** 2026-05-10T03:29:06Z
**Reviewed commit:** unknown
**Source:** [PR comment](https://github.com/funzi7/thai-rent-finder/pull/70#discussion_r3214249986)

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  Include Thailand-Property in the checkup summary**

When `THAILAND_PROPERTY` has zero fresh rows, adding it here makes `/api/admin/health` return `healthy: false` and site-health report a stale source, but `scripts/build-checkup-message.js` still hard-codes the per-source list to only `FAZWAZ`, `RENTHUB`, `LIVING_INSIDER`, and `LAZUDI` (lines 77-83). The daily Telegram alert can therefore say “Needs Attention” while showing all listed sources as green, hiding the newly monitored stale source from the main triage summary. Please keep the checkup source list in sync with the health endpoint or derive it from the health response.

Useful? React with 👍 / 👎.

---

## PR #68 — feat(ci): codex auto-fix catches inline review comments too
**Date:** 2026-05-04T23:17:54Z
**Reviewed commit:** unknown
**Source:** [PR comment](https://github.com/funzi7/thai-rent-finder/pull/68#pullrequestreview-4224208715)


### 💡 Codex Review

Here are some automated review suggestions for this pull request.

**Reviewed commit:** `3b7bea5996`
    

<details> <summary>ℹ️ About Codex in GitHub</summary>
<br/>

[Your team has set up Codex to review pull requests in this repo](https://chatgpt.com/codex/cloud/settings/general). Reviews are triggered when you
- Open a pull request for review
- Mark a draft as ready
- Comment "@codex review".

If Codex has suggestions, it will comment; otherwise it will react with 👍.




Codex can also answer questions or update the PR. Try commenting "@codex address that feedback".
            
</details>

---

## PR #67 — feat(ci): daily Telegram checkup with health summary
**Date:** 2026-05-04T23:10:08Z
**Reviewed commit:** unknown
**Source:** [PR comment](https://github.com/funzi7/thai-rent-finder/pull/67#pullrequestreview-4224171911)


### 💡 Codex Review

Here are some automated review suggestions for this pull request.

**Reviewed commit:** `088d44d3b2`
    

<details> <summary>ℹ️ About Codex in GitHub</summary>
<br/>

[Your team has set up Codex to review pull requests in this repo](https://chatgpt.com/codex/cloud/settings/general). Reviews are triggered when you
- Open a pull request for review
- Mark a draft as ready
- Comment "@codex review".

If Codex has suggestions, it will comment; otherwise it will react with 👍.




Codex can also answer questions or update the PR. Try commenting "@codex address that feedback".
            
</details>

---

## PR #66 — feat(ci): auto-update state.md daily from production data
**Date:** 2026-05-04T22:12:04Z
**Reviewed commit:** unknown
**Source:** [PR comment](https://github.com/funzi7/thai-rent-finder/pull/66#pullrequestreview-4223908433)


### 💡 Codex Review

Here are some automated review suggestions for this pull request.

**Reviewed commit:** `5250e0fe0b`
    

<details> <summary>ℹ️ About Codex in GitHub</summary>
<br/>

[Your team has set up Codex to review pull requests in this repo](https://chatgpt.com/codex/cloud/settings/general). Reviews are triggered when you
- Open a pull request for review
- Mark a draft as ready
- Comment "@codex review".

If Codex has suggestions, it will comment; otherwise it will react with 👍.




Codex can also answer questions or update the PR. Try commenting "@codex address that feedback".
            
</details>

---

## PR #63 — feat(ci): trigger Codex on site-health issues automatically
**Date:** 2026-05-04T21:16:32Z
**Reviewed commit:** unknown
**Source:** [PR comment](https://github.com/funzi7/thai-rent-finder/pull/63#issuecomment-4374543591)

### Summary
* Tightened the `trigger_codex_on_health_issue` job gate so it only runs for relevant `issues` actions:
  * `opened` events where the issue already includes `site-health`
  * `labeled` events where the newly added label is exactly `site-health` [.github/workflows/codex-auto-fix.ymlL327-L336](https://github.com/funzi7/thai-rent-finder/blob/cdcb8f93ed6c617e7e1b4b8edb8cc8c23584dbf8/.github/workflows/codex-auto-fix.yml#L327-L336)
* This avoids unnecessary workflow runs on unrelated label additions while keeping the existing dedupe/comment logic unchanged. [.github/workflows/codex-auto-fix.ymlL348-L355](https://github.com/funzi7/thai-rent-finder/blob/cdcb8f93ed6c617e7e1b4b8edb8cc8c23584dbf8/.github/workflows/codex-auto-fix.yml#L348-L355)

**Testing**
* ✅ `python3 -m pip install --user pyyaml >/tmp/pip.log && tail -n 5 /tmp/pip.log`
* ✅ `python3 -c "import yaml, pathlib; yaml.safe_load(pathlib.Path('.github/workflows/codex-auto-fix.yml').read_text()); print('ok')"`

Committed on branch `work`:
* `87f3dae` — `fix(ci): scope health trigger to relevant issue actions`

 [View task →](https://chatgpt.com/s/cd_69f90c502cf88191bef44845ee1fe720)

---

## PR #62 — feat(ci): site health workflow + /api/admin/health endpoint
**Date:** 2026-05-04T19:14:50Z
**Reviewed commit:** unknown
**Source:** [PR comment](https://github.com/funzi7/thai-rent-finder/pull/62#issuecomment-4373794444)

### Summary
* Committed the pending lockfile normalization as `chore(lockfile): normalize npm dependency metadata` (`aee0e15`). The update marks multiple transitive packages as `dev: true` and aligns prior `devOptional` markers to `dev`, reducing repeated lockfile churn from npm resolution differences. [package-lock.jsonL59-L66](https://github.com/funzi7/thai-rent-finder/blob/324d2ce9fa4c0fc0434e8ae02685500c737962a4/package-lock.json#L59-L66) [package-lock.jsonL827-L875](https://github.com/funzi7/thai-rent-finder/blob/324d2ce9fa4c0fc0434e8ae02685500c737962a4/package-lock.json#L827-L875)

**Testing**
* ✅ `npx tsc --noEmit` (passed; only emitted an npm warning about unknown env config `http-proxy`).

 [View task →](https://chatgpt.com/s/cd_69f8ef70cda88191963a3b5c38f57970)

---

