# Codex Activity Log — thai-rent-finder

History of Codex auto-fix activities. Newest first.

---

## PR #88 — Enrich Lazudi extraction, "עודכן" dates, mobile search + recents, dead-concern cleanup
**Date:** 2026-07-05T17:58:44Z
**Reviewed commit:** unknown
**Source:** [PR comment](https://github.com/funzi7/thai-rent-finder/pull/88#pullrequestreview-4631736633)


### 💡 Codex Review

Here are some automated review suggestions for this pull request.

**Reviewed commit:** `c3b700effb`
    

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

## PR #87 — chore(automation): sync from automation-core
**Date:** 2026-07-05T16:03:52Z
**Reviewed commit:** unknown
**Source:** [PR comment](https://github.com/funzi7/thai-rent-finder/pull/87#pullrequestreview-4631584759)


### 💡 Codex Review

Here are some automated review suggestions for this pull request.

**Reviewed commit:** `ea4743bdb5`
    

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

## PR #85 — Search + sort/range filters, favorites AND status, building name on card, Lazudi description
**Date:** 2026-07-05T15:54:46Z
**Reviewed commit:** unknown
**Source:** [PR comment](https://github.com/funzi7/thai-rent-finder/pull/85#discussion_r3525179808)

### Summary
* Updated saved filter creation to persist the newly added fields: search text, `betterOnly`, excluded concerns, sort direction, sqm range, and year range, so saved presets reapply the full active filter state. [src/components/SavedFiltersBar.tsxL103-L121](https://github.com/funzi7/thai-rent-finder/blob/15244b2a850b75dcff62f438bb03119ced2849a2/src/components/SavedFiltersBar.tsx#L103-L121)
* Expanded the save-dialog preview chips to display the newly persisted filters before saving. [src/components/SavedFiltersBar.tsxL259-L300](https://github.com/funzi7/thai-rent-finder/blob/15244b2a850b75dcff62f438bb03119ced2849a2/src/components/SavedFiltersBar.tsx#L259-L300)
* Committed the change with commit `5bbe18f` and created a pull request.
* Note: `package-lock.json` had an unrelated pre-existing working-tree modification and was not included in the commit.

**Testing**
* ✅ `npx tsc --noEmit`
* ✅ `npm run test:filters`

 [View task →](https://chatgpt.com/s/cd_6a4a7ddc99688191ae48054ca861d1d4)

---

## PR #85 — Search + sort/range filters, favorites AND status, building name on card, Lazudi description
**Date:** 2026-07-05T15:40:22Z
**Reviewed commit:** unknown
**Source:** [PR comment](https://github.com/funzi7/thai-rent-finder/pull/85#pullrequestreview-4631556581)


### 💡 Codex Review

Here are some automated review suggestions for this pull request.

**Reviewed commit:** `15244b2a85`
    

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

## PR #84 — Solo-use cadence + leaner Hebrew concerns + state.md footer fix
**Date:** 2026-07-05T09:07:56Z
**Reviewed commit:** unknown
**Source:** [PR comment](https://github.com/funzi7/thai-rent-finder/pull/84#discussion_r3524602724)

**Summary**
* Added Thailand Property’s `scrape.yml` workflow to the site-health Actions freshness `sources` list so the 80h cadence monitor checks that workflow directly. [.github/workflows/site-health.ymlL90-L97](https://github.com/funzi7/thai-rent-finder/blob/3610ccdd1a23b841425dd2fe11bb4cf5a6c935d7/.github/workflows/site-health.yml#L90-L97)
* Added `thailand-property` to the `/jobs` GitHub-Actions-only source config, linking users to the correct workflow instead of rendering the inline scrape trigger for an API path that now returns 503. [src/app/jobs/page.tsxL28-L40](https://github.com/funzi7/thai-rent-finder/blob/3610ccdd1a23b841425dd2fe11bb4cf5a6c935d7/src/app/jobs/page.tsx#L28-L40)
* Updated the touched Actions scraper schedule labels to reflect the new every-3-days cadence for Thailand Property, FazWaz, Renthub, Living Insider, and Lazudi. [src/app/jobs/page.tsxL34-L75](https://github.com/funzi7/thai-rent-finder/blob/3610ccdd1a23b841425dd2fe11bb4cf5a6c935d7/src/app/jobs/page.tsx#L34-L75)

**Testing**
* ✅ `npx tsc --noEmit`
* ⚠️ `python3 - <<'PY'
import yaml
from pathlib import Path
for p in ['.github/workflows/site-health.yml']:
    with open(p) as f:
        yaml.safe_load(f)
    print(f'{p}: ok')
PY` (warning due to missing `yaml` Python module in the environment)
* ✅ `ruby -e "require 'yaml'; YAML.load_file('.github/workflows/site-health.yml'); puts '.github/workflows/site-health.yml: ok'"`
* ✅ `git diff --check -- .github/workflows/site-health.yml src/app/jobs/page.tsx`

Committed changes on the current branch with commit `e723ce0` and created the PR via `make_pr`. Note: `package-lock.json` was already modified in the working tree and was left uncommitted.

 [View task →](https://chatgpt.com/s/cd_6a4a1e93f6f481919d14818a0f53423f)

---

## PR #84 — Solo-use cadence + leaner Hebrew concerns + state.md footer fix
**Date:** 2026-07-05T09:02:42Z
**Reviewed commit:** unknown
**Source:** [PR comment](https://github.com/funzi7/thai-rent-finder/pull/84#pullrequestreview-4631041677)


### 💡 Codex Review

Here are some automated review suggestions for this pull request.

**Reviewed commit:** `3610ccdd1a`
    

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

## PR #84 — Solo-use cadence + leaner Hebrew concerns + state.md footer fix
**Date:** 2026-07-05T08:47:16Z
**Reviewed commit:** unknown
**Source:** [PR comment](https://github.com/funzi7/thai-rent-finder/pull/84#discussion_r3524578417)

**Summary**
* Updated Thailand Property’s deadline comment to reflect that `search()` is intended for GitHub Actions because the serverless scrape route now blocks this source. [src/scrapers/sources/thailand-property.tsL32-L37](https://github.com/funzi7/thai-rent-finder/blob/af69d8771fea7d192cb1182f2fcbd972e50066e0/src/scrapers/sources/thailand-property.ts#L32-L37)
* Changed Thailand Property city completion semantics so capped scans return `false`, preventing capped Bangkok runs from being treated as stale-sweep-safe. [src/scrapers/sources/thailand-property.tsL942-L949](https://github.com/funzi7/thai-rent-finder/blob/af69d8771fea7d192cb1182f2fcbd972e50066e0/src/scrapers/sources/thailand-property.ts#L942-L949) [src/scrapers/sources/thailand-property.tsL957-L964](https://github.com/funzi7/thai-rent-finder/blob/af69d8771fea7d192cb1182f2fcbd972e50066e0/src/scrapers/sources/thailand-property.ts#L957-L964) [src/scrapers/sources/thailand-property.tsL1090-L1103](https://github.com/funzi7/thai-rent-finder/blob/af69d8771fea7d192cb1182f2fcbd972e50066e0/src/scrapers/sources/thailand-property.ts#L1090-L1103)
* Added `thailand-property` to the GitHub-Actions-only scrape route guard to avoid running its 3.5-minute scrape deadline under Vercel’s 60-second `maxDuration`. [src/app/api/scrape/\[source\]/route.tsL50-L61](https://github.com/funzi7/thai-rent-finder/blob/af69d8771fea7d192cb1182f2fcbd972e50066e0/src/app/api/scrape/%5Bsource%5D/route.ts#L50-L61)
* Committed the changes on the current branch with commit `65bfdab` and created the PR via `make_pr`.

**Testing**
* ✅ `npx tsc --noEmit`

 [View task →](https://chatgpt.com/s/cd_6a4a18e9b1dc8191a57a9c122cbcf583)

---

## PR #84 — Solo-use cadence + leaner Hebrew concerns + state.md footer fix
**Date:** 2026-07-05T07:08:59Z
**Reviewed commit:** unknown
**Source:** [PR comment](https://github.com/funzi7/thai-rent-finder/pull/84#pullrequestreview-4630908196)


### 💡 Codex Review

Here are some automated review suggestions for this pull request.

**Reviewed commit:** `af69d8771f`
    

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

## PR #82 — fix(scraper): stop staleness sweep from deactivating user-curated listings
**Date:** 2026-07-04T15:44:51Z
**Reviewed commit:** unknown
**Source:** [PR comment](https://github.com/funzi7/thai-rent-finder/pull/82#discussion_r3523445173)

**Summary**
* Updated stale sweep city scoping so scrapers that track `completedCities` honor that completion signal before falling back to `opts.city`. This prevents a failed ThailandProperty single-city scan from sweeping stale rows for a city whose inventory was not fully read. [src/scrapers/core/BaseScraper.tsL215-L239](https://github.com/funzi7/thai-rent-finder/blob/43fadf8911882a604b139f9725db34e91261aaa9/src/scrapers/core/BaseScraper.ts#L215-L239)
* Preserved the fallback single-city sweep behavior for scrapers that do **not** track per-city completion. [src/scrapers/core/BaseScraper.tsL224-L239](https://github.com/funzi7/thai-rent-finder/blob/43fadf8911882a604b139f9725db34e91261aaa9/src/scrapers/core/BaseScraper.ts#L224-L239)

**Testing**
* ✅ `npx tsc --noEmit`

Committed the fix as `daf086b fix(scraper): skip stale sweep after failed tracked city runs` and created a PR via the `make_pr` tool.

 [View task →](https://chatgpt.com/s/cd_6a4929d083c08191a22e713afc3eddfe)

---

## PR #82 — fix(scraper): stop staleness sweep from deactivating user-curated listings
**Date:** 2026-07-04T15:13:16Z
**Reviewed commit:** unknown
**Source:** [PR comment](https://github.com/funzi7/thai-rent-finder/pull/82#pullrequestreview-4629816220)


### 💡 Codex Review

Here are some automated review suggestions for this pull request.

**Reviewed commit:** `43fadf8911`
    

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

## PR #75 — chore(automation): bootstrap sync from automation-core
**Date:** 2026-05-12T11:08:34Z
**Reviewed commit:** unknown
**Source:** [PR comment](https://github.com/funzi7/thai-rent-finder/pull/75#pullrequestreview-4271661051)


### 💡 Codex Review

Here are some automated review suggestions for this pull request.

**Reviewed commit:** `fd0141e172`
    

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

## PR #71 — feat(ci): codex review gate blocks merge until Codex signals
**Date:** 2026-05-10T05:09:53Z
**Reviewed commit:** unknown
**Source:** [PR comment](https://github.com/funzi7/thai-rent-finder/pull/71#discussion_r3214337952)

**Summary**
* Hardened Codex Gate’s P1 regex so badge fragments like `/P1-orange` are caught while still avoiding alphanumeric false positives such as `P10` and `P1A`. 
* Switched inline review-comment fetching to `github.paginate(...)`, so inline-only Codex findings are evaluated across long PR review threads. 
* Updated the Codex Gate docs to describe re-checks from `pull_request_review_comment` / `issue_comment` events and paginated inline review-comment coverage. 

**Testing**
* ✅ `ruby -e "require 'yaml'; YAML.load_file('.github/workflows/codex-gate.yml'); puts 'yaml ok'"`
* ✅ `node - <<'NODE' ... NODE`

Created PR: `fix(ci): harden Codex Gate P1 detection`

Note: `package-lock.json` had pre-existing unstaged changes and was intentionally left out of the commit.

 [View task →](https://chatgpt.com/s/cd_6a0012aec9408191aef7f7ebd928b8e7)

---

## PR #71 — feat(ci): codex review gate blocks merge until Codex signals
**Date:** 2026-05-10T05:02:20Z
**Reviewed commit:** unknown
**Source:** [PR comment](https://github.com/funzi7/thai-rent-finder/pull/71#discussion_r3214331130)

**Summary**
* Updated Codex Gate’s P1 marker regex so badge URL fragments like `badge/P1-orange` are detected, while still avoiding false positives such as `P10` / `P1A`. 
* Changed inline review-comment fetching to use paginated `pulls.listReviewComments`, so inline-only Codex findings are not missed on long PR conversations. 
* Folded Codex inline review comments into the same chronological P1 evaluation stream as review bodies and top-level PR comments, and added source-aware status output for stale/unresolved inline P1s. 
* Updated the Codex Gate documentation to explicitly describe inline review comments as valid Codex signals and document the `pull_request_review_comment` re-check path. 

**Testing**
* ⚠️ `python3 - <<'PY' ... PY` — attempted YAML validation with PyYAML first, but the environment does not have the `yaml` Python module installed.
* ✅ `ruby -e "require 'yaml'; YAML.load_file('.github/workflows/codex-gate.yml'); puts 'yaml ok'"`
* ✅ `node - <<'NODE' ... NODE` — verified P1 regex positives (`**P1**`, `[P1]`, `P1:`, `P1-orange` badge forms) and negatives (`P10`, `P1A`, `copy1`).

 [View task →](https://chatgpt.com/s/cd_6a00106e6b8481919f0e40be32160e34)

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

